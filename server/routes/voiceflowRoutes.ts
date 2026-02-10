import type { Express } from "express";
import { AuthenticatedRequest, getUserId } from "../middleware/auth";
import { isAuthenticated } from "../replit_integrations/auth";
import { randomUUID } from "crypto";

const SESSION_COOKIE_NAME = "voiceflow_session_id";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const VOICEFLOW_RUNTIME_URL = process.env.VOICEFLOW_RUNTIME_URL || 'https://general-runtime.voiceflow.com';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// In-memory session storage (could be moved to database in production)
const sessionStore = new Map<string, { userId: string; voiceflowUserId: string; createdAt: number }>();

/**
 * Helper function to retry failed API calls
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`[Voiceflow] API call failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Validate Voiceflow API key format
 */
function isValidApiKey(apiKey: string | undefined): boolean {
  if (!apiKey) return false;

  // Per official docs: API keys must start with VF.DM.
  if (!apiKey.startsWith('VF.DM.')) return false;

  // Detect placeholder patterns
  if (apiKey.includes('XXXX')) return false;

  // Real Voiceflow API keys are longer than the prefix
  if (apiKey.length < 20) return false;

  return true;
}

/**
 * Parse Voiceflow traces to extract messages and profile data
 */
function parseVoiceflowResponse(traces: any[]) {
  const messages: string[] = [];
  const ttsUrls: string[] = [];
  let profileData: any = {};
  let isComplete = false;

  for (const trace of traces) {
    switch (trace.type) {
      case 'text':
        if (trace.payload?.message) {
          messages.push(trace.payload.message);
          ttsUrls.push(''); // Empty for text-only messages
        }
        break;

      case 'speak':
        if (trace.payload?.message) {
          messages.push(trace.payload.message);
          ttsUrls.push(trace.payload?.src || ''); // Extract TTS URL
        }
        break;

      case 'visual':
        // Handle visual elements if needed
        break;

      case 'choice':
        // Handle choice buttons if needed
        break;

      case 'end':
        isComplete = true;
        break;

      case 'profile_data':
        // Custom trace type for extracted profile data
        if (trace.payload?.data) {
          profileData = { ...profileData, ...trace.payload.data };
        }
        break;

      default:
        // Handle other trace types
        break;
    }
  }

  return { messages, ttsUrls, profileData, isComplete };
}

export async function registerVoiceflowRoutes(app: Express) {
  // Log configuration status at startup
  console.log('[Voiceflow] Configuration Check:');
  const apiKey = process.env.VOICEFLOW_API_KEY;
  const projectKey = process.env.VOICEFLOW_PROJECT_KEY;

  if (!apiKey) {
    console.log('  API Key: ❌ MISSING');
  } else if (apiKey.includes('XXXX')) {
    console.log('  API Key: ❌ PLACEHOLDER');
  } else if (!isValidApiKey(apiKey)) {
    console.log('  API Key: ❌ INVALID FORMAT');
  } else {
    console.log(`  API Key: ✓ SET (${apiKey.substring(0, 10)}...)`);
  }

  console.log(`  Project Key: ${projectKey ? '✓ SET (' + projectKey + ')' : '❌ MISSING'}`);
  console.log(`  Runtime URL: ${VOICEFLOW_RUNTIME_URL}`);
  console.log('');

  /**
   * POST /api/voiceflow/session
   * Initialize a new Voiceflow session for the authenticated user
   */
  app.post("/api/voiceflow/session", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      // Get user ID from Replit Auth session
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', code: 'auth/no-token' });
      }

      // Check if Voiceflow API key is configured and valid
      if (!isValidApiKey(process.env.VOICEFLOW_API_KEY)) {
        return res.status(500).json({
          error: "Voiceflow API key not configured properly",
          message: "Please set VOICEFLOW_API_KEY in Replit Secrets with a valid API key from Voiceflow Dashboard",
          instructions: [
            "1. Go to Voiceflow Dashboard (https://www.voiceflow.com/dashboard)",
            "2. Navigate to Project Settings → API Keys",
            "3. Copy the Dialog Manager API key (starts with VF.DM.)",
            "4. Add to Replit Secrets as VOICEFLOW_API_KEY",
            "5. Restart the server"
          ]
        });
      }

      // Check if project ID is configured
      if (!process.env.VOICEFLOW_PROJECT_KEY) {
        return res.status(500).json({
          error: "Voiceflow project key not configured",
          message: "Please add VOICEFLOW_PROJECT_KEY to Replit Secrets",
          instructions: [
            "Use your Voiceflow project ID (found in project URL or settings)"
          ]
        });
      }

      // Resolve or generate session ID for continuity
      let sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (!sessionId) {
        sessionId = randomUUID();
      }

      // Use Replit user ID as Voiceflow user ID for session continuity
      const voiceflowUserId = `replit_${userId}`;

      // Store session mapping
      sessionStore.set(sessionId, {
        userId,
        voiceflowUserId,
        createdAt: Date.now()
      });

      console.log('[Voiceflow] Session created for user:', userId, 'sessionId:', sessionId);

      // Initialize Voiceflow session with launch action
      // Use VOICEFLOW_PROJECT_KEY as the version/project identifier
      const versionId = process.env.VOICEFLOW_PROJECT_KEY || process.env.VOICEFLOW_VERSION || 'production';
      const interactUrl = `${VOICEFLOW_RUNTIME_URL}/state/user/${voiceflowUserId}/interact`;

      const response = await fetchWithRetry(interactUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.VOICEFLOW_API_KEY!,
        },
        body: JSON.stringify({
          action: {
            type: 'launch'
          },
          config: {
            tts: true,
            stripSSML: true,
          },
          versionID: versionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Voiceflow] Session initialization failed:', {
          userId,
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return res.status(response.status).json({
          error: 'Failed to initialize Voiceflow session',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined,
        });
      }

      const responseData = await response.json();
      const parsed = parseVoiceflowResponse(responseData);

      console.log('[Voiceflow] Session initialized successfully for user:', userId);

      // Set session cookie for continuity across page refreshes
      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_COOKIE_MAX_AGE * 1000,
      });

      res.json({
        sessionId,
        voiceflowUserId,
        expiresAt: Date.now() + (SESSION_COOKIE_MAX_AGE * 1000),
        initialMessages: parsed.messages,
        initialTtsUrls: parsed.ttsUrls,
        profileData: parsed.profileData,
      });
    } catch (error: any) {
      console.error("[Voiceflow] Session creation error:", {
        userId: getUserId(req),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      return res.status(500).json({
        error: 'Failed to create Voiceflow session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * POST /api/voiceflow/interact
   * Send a message or action to Voiceflow and get response
   */
  app.post("/api/voiceflow/interact", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', code: 'auth/no-token' });
      }

      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (!sessionId) {
        return res.status(400).json({ error: 'No session found. Please initialize a session first.' });
      }

      const session = sessionStore.get(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Invalid session' });
      }

      const { message, action } = req.body;

      if (!message && !action) {
        return res.status(400).json({ error: 'Either message or action is required' });
      }

      // Use VOICEFLOW_PROJECT_KEY as the version/project identifier
      const versionId = process.env.VOICEFLOW_PROJECT_KEY || process.env.VOICEFLOW_VERSION || 'production';

      // Build request payload
      const payload: any = {
        config: {
          tts: true,
          stripSSML: true,
        },
        versionID: versionId
      };

      if (action) {
        payload.action = action;
      } else if (message) {
        payload.action = {
          type: 'text',
          payload: message
        };
      }

      const interactUrl = `${VOICEFLOW_RUNTIME_URL}/state/user/${session.voiceflowUserId}/interact`;

      console.log('[Voiceflow] Sending interaction for user:', userId, 'message:', message);

      const response = await fetchWithRetry(interactUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.VOICEFLOW_API_KEY!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Voiceflow] Interaction failed:', {
          userId,
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        return res.status(response.status).json({
          error: 'Failed to send message to Voiceflow',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined,
        });
      }

      const responseData = await response.json();
      const parsed = parseVoiceflowResponse(responseData);

      console.log('[Voiceflow] Interaction successful:', {
        userId,
        messageCount: parsed.messages.length,
        hasProfileData: Object.keys(parsed.profileData).length > 0,
        isComplete: parsed.isComplete,
      });

      res.json({
        messages: parsed.messages,
        ttsUrls: parsed.ttsUrls,
        profileData: parsed.profileData,
        isComplete: parsed.isComplete,
        traces: responseData, // Include raw traces for debugging
      });
    } catch (error: any) {
      console.error("[Voiceflow] Interaction error:", {
        userId: getUserId(req),
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
      return res.status(500).json({
        error: 'Failed to process Voiceflow interaction',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/voiceflow/state
   * Get current conversation state
   */
  app.get("/api/voiceflow/state", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', code: 'auth/no-token' });
      }

      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (!sessionId) {
        return res.status(400).json({ error: 'No session found' });
      }

      const session = sessionStore.get(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Invalid session' });
      }

      const stateUrl = `${VOICEFLOW_RUNTIME_URL}/state/user/${session.voiceflowUserId}`;

      const response = await fetchWithRetry(stateUrl, {
        method: 'GET',
        headers: {
          'Authorization': process.env.VOICEFLOW_API_KEY!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Voiceflow] State fetch failed:', {
          userId,
          status: response.status,
          error: errorData,
        });
        return res.status(response.status).json({
          error: 'Failed to fetch Voiceflow state',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined,
        });
      }

      const state = await response.json();
      res.json({ state });
    } catch (error: any) {
      console.error("[Voiceflow] State fetch error:", {
        userId: getUserId(req),
        error: error.message,
      });
      return res.status(500).json({
        error: 'Failed to fetch Voiceflow state',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * DELETE /api/voiceflow/session
   * Reset/end the current session
   */
  app.delete("/api/voiceflow/session", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', code: 'auth/no-token' });
      }

      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (!sessionId) {
        return res.status(400).json({ error: 'No session found' });
      }

      const session = sessionStore.get(sessionId);
      if (!session || session.userId !== userId) {
        return res.status(403).json({ error: 'Invalid session' });
      }

      // Delete state from Voiceflow
      const stateUrl = `${VOICEFLOW_RUNTIME_URL}/state/user/${session.voiceflowUserId}`;

      const response = await fetchWithRetry(stateUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': process.env.VOICEFLOW_API_KEY!,
        },
      });

      // Remove from session store
      sessionStore.delete(sessionId);

      // Clear cookie
      res.clearCookie(SESSION_COOKIE_NAME);

      console.log('[Voiceflow] Session deleted for user:', userId);

      res.json({ success: true, message: 'Session deleted successfully' });
    } catch (error: any) {
      console.error("[Voiceflow] Session deletion error:", {
        userId: getUserId(req),
        error: error.message,
      });
      return res.status(500).json({
        error: 'Failed to delete Voiceflow session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/voiceflow/status
   * Health check for Voiceflow service
   */
  app.get("/api/voiceflow/status", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required', code: 'auth/no-token' });
      }

      const apiKey = process.env.VOICEFLOW_API_KEY;
      const projectKey = process.env.VOICEFLOW_PROJECT_KEY;
      const hasValidApiKey = isValidApiKey(apiKey);
      const hasProjectKey = !!projectKey;
      const isConfigured = hasValidApiKey && hasProjectKey;

      // Determine detailed status
      let statusMessage = "Voiceflow service is ready";
      let setupInstructions: string[] | undefined;

      if (!apiKey) {
        statusMessage = "Voiceflow API key not configured";
        setupInstructions = [
          "1. Go to Voiceflow Dashboard (https://www.voiceflow.com/dashboard)",
          "2. Navigate to Project Settings → API Keys",
          "3. Copy the Dialog Manager API key (starts with VF.DM.)",
          "4. Add to Replit Secrets as VOICEFLOW_API_KEY",
          "5. Restart the server"
        ];
      } else if (apiKey.includes('XXXX')) {
        statusMessage = "Voiceflow API key is a placeholder";
        setupInstructions = [
          "The API key in .env is a placeholder value",
          "Please add your real Voiceflow API key to Replit Secrets",
          "Visit https://www.voiceflow.com/dashboard → Project Settings → API Keys"
        ];
      } else if (!hasValidApiKey) {
        statusMessage = "Voiceflow API key has invalid format";
        setupInstructions = [
          "API keys should start with 'VF.DM.' and be at least 20 characters",
          "Please verify the API key in Replit Secrets"
        ];
      } else if (!hasProjectKey) {
        statusMessage = "Voiceflow project key not configured";
        setupInstructions = [
          "Add VOICEFLOW_PROJECT_KEY to Replit Secrets",
          "Use your Voiceflow project ID (found in project URL or settings)"
        ];
      }

      res.json({
        status: isConfigured ? "ready" : "not_configured",
        message: statusMessage,
        configuration: {
          apiKey: apiKey ? (apiKey.includes('XXXX') ? 'placeholder' : hasValidApiKey ? 'valid' : 'invalid') : 'missing',
          projectKey: hasProjectKey ? projectKey : 'missing',
          runtimeUrl: VOICEFLOW_RUNTIME_URL,
        },
        setupInstructions,
      });
    } catch (error) {
      console.error("Voiceflow status check error:", error);
      res.status(500).json({
        error: "Failed to check Voiceflow service status"
      });
    }
  });
}
