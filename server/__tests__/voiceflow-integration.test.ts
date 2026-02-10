/**
 * Voiceflow Integration Tests
 * Comprehensive test coverage for Voiceflow API integration including:
 * - Utility function tests (parsing, merging, retry logic)
 * - API endpoint tests (session, interact, state, delete, status)
 * - Security tests (authentication, session ownership)
 * - Integration tests (full conversation flows)
 */

import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { registerVoiceflowRoutes } from '../routes/voiceflowRoutes';
import {
  mockTravelProfile,
  mockVoiceflowSession,
  mockVoiceflowTraces,
  mockVoiceflowLaunchResponse,
  mockVoiceflowInteractResponse,
  mockVoiceflowState,
  createMockVoiceflowSession,
} from './setup/mocks';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());

// Mock authentication
let mockUserId = 'test-replit-user-id';
jest.mock('../middleware/auth', () => ({
  getUserId: jest.fn(() => mockUserId),
}));

jest.mock('../replit_integrations/auth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    if (!mockUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = { claims: { sub: mockUserId } };
    next();
  }),
}));

// Mock fetch for Voiceflow API calls
global.fetch = jest.fn();

// Mock environment variables
const originalEnv = process.env;

describe('Voiceflow Integration', () => {
  beforeAll(async () => {
    await registerVoiceflowRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'test-replit-user-id';
    // Use valid Voiceflow API key format for tests
    process.env.VOICEFLOW_API_KEY = 'VF.DM.test1234567890.abcdefghij';
    process.env.VOICEFLOW_PROJECT_KEY = 'test-project-key';
    process.env.VOICEFLOW_RUNTIME_URL = 'https://general-runtime.voiceflow.com';
    process.env.NODE_ENV = 'test';
    (global.fetch as jest.Mock).mockClear();
    // Default successful mock for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockVoiceflowLaunchResponse,
    });
  });

  afterEach(() => {
    // Restore environment variables
    process.env.VOICEFLOW_API_KEY = originalEnv.VOICEFLOW_API_KEY;
    process.env.VOICEFLOW_PROJECT_KEY = originalEnv.VOICEFLOW_PROJECT_KEY;
    process.env.VOICEFLOW_RUNTIME_URL = originalEnv.VOICEFLOW_RUNTIME_URL;
    process.env.NODE_ENV = originalEnv.NODE_ENV;
  });

  describe('Utility Functions', () => {
    // Note: These are internal functions, so we test them through the API endpoints
    // that use them. If they were exported, we'd test them directly here.

    describe('parseVoiceflowResponse (via API responses)', () => {
      it('should extract text messages from traces', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockVoiceflowLaunchResponse,
        });

        const response = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        expect(response.body.initialMessages).toEqual([
          'Hello! I can help you plan your trip.',
          'What is your name?',
        ]);
      });

      it('should extract profile data from traces', async () => {
        // First create a session
        const sessionResponse = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        const sessionCookie = sessionResponse.headers['set-cookie'][0];

        // Then test interaction with profile data
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockVoiceflowInteractResponse,
        });

        const response = await request(app)
          .post('/api/voiceflow/interact')
          .set('Cookie', sessionCookie)
          .send({ message: 'My name is John Doe' })
          .expect(200);

        expect(response.body.profileData).toEqual({
          contactInfo: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        });
      });

      it('should detect conversation completion', async () => {
        // First create a session
        const sessionResponse = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        const sessionCookie = sessionResponse.headers['set-cookie'][0];

        // Then test completion detection
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [
            mockVoiceflowTraces.textTrace,
            mockVoiceflowTraces.endTrace,
          ],
        });

        const response = await request(app)
          .post('/api/voiceflow/interact')
          .set('Cookie', sessionCookie)
          .send({ message: 'Done' })
          .expect(200);

        expect(response.body.isComplete).toBe(true);
      });

      it('should extract TTS URLs from speak traces', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => mockVoiceflowLaunchResponse,
        });

        const response = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        // Verify ttsUrls are returned
        expect(response.body.initialTtsUrls).toBeDefined();
        expect(response.body.initialTtsUrls).toHaveLength(2);
        // First message is text (empty TTS URL)
        expect(response.body.initialTtsUrls[0]).toBe('');
        // Second message is speak (has TTS URL)
        expect(response.body.initialTtsUrls[1]).toBe('https://voiceflow-tts.example.com/audio/abc123.mp3');
      });

      it('should maintain parallel arrays for messages and TTS URLs', async () => {
        const sessionResponse = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        const sessionCookie = sessionResponse.headers['set-cookie'][0];

        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { type: 'text', payload: { message: 'Text message' } },
            { type: 'speak', payload: { message: 'Spoken message', src: 'https://audio1.mp3' } },
            { type: 'speak', payload: { message: 'Another spoken message', src: 'https://audio2.mp3' } },
          ],
        });

        const response = await request(app)
          .post('/api/voiceflow/interact')
          .set('Cookie', sessionCookie)
          .send({ message: 'Hello' })
          .expect(200);

        // Verify parallel array structure
        expect(response.body.messages).toHaveLength(3);
        expect(response.body.ttsUrls).toHaveLength(3);
        expect(response.body.messages.length).toBe(response.body.ttsUrls.length);

        // Verify TTS URL mapping
        expect(response.body.ttsUrls[0]).toBe(''); // text trace
        expect(response.body.ttsUrls[1]).toBe('https://audio1.mp3'); // speak trace
        expect(response.body.ttsUrls[2]).toBe('https://audio2.mp3'); // speak trace
      });
    });

    describe('fetchWithRetry (via API error handling)', () => {
      it('should retry failed API calls', async () => {
        // Clear default mock and set up retry scenario
        (global.fetch as jest.Mock).mockClear();
        (global.fetch as jest.Mock)
          .mockRejectedValueOnce(new Error('Network error'))
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockVoiceflowLaunchResponse,
          });

        const response = await request(app)
          .post('/api/voiceflow/session')
          .expect(200);

        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(response.body.sessionId).toBeDefined();
      });

      it('should fail after max retries', async () => {
        // Clear default mock and make all calls fail
        (global.fetch as jest.Mock).mockClear();
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const response = await request(app)
          .post('/api/voiceflow/session')
          .expect(500);

        expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
        expect(response.body.error).toBe('Failed to create Voiceflow session');
      });
    });
  });

  describe('POST /api/voiceflow/session', () => {
    it('should initialize session and return session data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      expect(response.body).toMatchObject({
        sessionId: expect.any(String),
        voiceflowUserId: 'replit_test-replit-user-id',
        expiresAt: expect.any(Number),
        initialMessages: expect.any(Array),
        profileData: expect.any(Object),
      });

      // Check session cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('voiceflow_session_id=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should reuse existing session cookie if present', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const existingSessionId = 'existing-session-id';

      const response = await request(app)
        .post('/api/voiceflow/session')
        .set('Cookie', [`voiceflow_session_id=${existingSessionId}`])
        .expect(200);

      expect(response.body.sessionId).toBe(existingSessionId);
    });

    it('should return 401 when unauthenticated', async () => {
      mockUserId = '';

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should return 500 when API key is missing', async () => {
      delete process.env.VOICEFLOW_API_KEY;

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(500);

      expect(response.body.error).toBe('Voiceflow API key not configured properly');
      expect(response.body.message).toContain('VOICEFLOW_API_KEY');
      expect(response.body.instructions).toBeDefined();
    });

    it('should return 500 when project key is missing', async () => {
      delete process.env.VOICEFLOW_PROJECT_KEY;

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(500);

      expect(response.body.error).toBe('Voiceflow project key not configured');
      expect(response.body.message).toContain('VOICEFLOW_PROJECT_KEY');
      expect(response.body.instructions).toBeDefined();
    });

    it('should handle Voiceflow API errors', async () => {
      // Clear default mock and simulate error
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid project' }),
      });

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(400);

      expect(response.body.error).toBe('Failed to initialize Voiceflow session');
    });

    it('should call Voiceflow API with correct parameters', async () => {
      // Clear and set specific mock
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/state/user/replit_test-replit-user-id/interact'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'VF.DM.test1234567890.abcdefghij',
          }),
          body: expect.stringContaining('"type":"launch"'),
        })
      );
    });

    it('should include versionID in session initialization API request', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"versionID":"test-project-key"')
        })
      );
    });
  });

  describe('POST /api/voiceflow/interact', () => {
    beforeEach(() => {
      // Setup session store with test session
      // Note: The session store is internal to voiceflowRoutes, so we need to
      // initialize it by creating a session first
    });

    it('should send message and receive response', async () => {
      // First, create a session
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Then, send an interaction
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowInteractResponse,
      });

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'My name is John' })
        .expect(200);

      expect(response.body).toMatchObject({
        messages: expect.any(Array),
        profileData: expect.any(Object),
        isComplete: expect.any(Boolean),
        traces: expect.any(Array),
      });
    });

    it('should send action instead of message', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Send action
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockVoiceflowTraces.textTrace],
      });

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ action: { type: 'intent', payload: 'start_over' } })
        .expect(200);

      expect(response.body.messages).toHaveLength(1);

      // Verify action was sent correctly (check the last call, not first)
      const lastCall = (global.fetch as jest.Mock).mock.calls[(global.fetch as jest.Mock).mock.calls.length - 1];
      expect(lastCall[1].body).toContain('"type":"intent"');
    });

    it('should include versionID in interact API request', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Clear mock and test interact call
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowInteractResponse,
      });

      await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'Hello' })
        .expect(200);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"versionID":"test-project-key"')
        })
      );
    });

    it('should return 400 when session cookie is missing', async () => {
      const response = await request(app)
        .post('/api/voiceflow/interact')
        .send({ message: 'Hello' })
        .expect(400);

      expect(response.body.error).toContain('No session found');
    });

    it('should return 403 for invalid session ownership', async () => {
      // Create session with one user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Try to interact with different user
      mockUserId = 'different-user-id';

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'Hello' })
        .expect(403);

      expect(response.body.error).toBe('Invalid session');
    });

    it('should return 400 when both message and action are missing', async () => {
      // Create session first
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Either message or action is required');
    });

    it('should return 401 when unauthenticated', async () => {
      mockUserId = '';

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', ['voiceflow_session_id=test-session'])
        .send({ message: 'Hello' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle Voiceflow API errors', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Voiceflow API fails on next call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      });

      const response = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'Hello' })
        .expect(500);

      expect(response.body.error).toBe('Failed to send message to Voiceflow');
    });
  });

  describe('GET /api/voiceflow/state', () => {
    it('should return conversation state', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Get state - mock next API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowState,
      });

      const response = await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toHaveProperty('state');
      expect(response.body.state).toMatchObject({
        stack: expect.any(Array),
        storage: expect.any(Object),
        variables: expect.any(Object),
      });
    });

    it('should return 400 when no session found', async () => {
      const response = await request(app)
        .get('/api/voiceflow/state')
        .expect(400);

      expect(response.body.error).toContain('No session found');
    });

    it('should return 403 for invalid session ownership', async () => {
      // Create session with one user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Try to get state with different user
      mockUserId = 'different-user-id';

      const response = await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', sessionCookie)
        .expect(403);

      expect(response.body.error).toBe('Invalid session');
    });

    it('should return 401 when unauthenticated', async () => {
      mockUserId = '';

      const response = await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', ['voiceflow_session_id=test-session'])
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle Voiceflow API errors', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Voiceflow API fails on next call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'State not found' }),
      });

      const response = await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', sessionCookie)
        .expect(404);

      expect(response.body.error).toBe('Failed to fetch Voiceflow state');
    });
  });

  describe('DELETE /api/voiceflow/session', () => {
    it('should delete session and clear cookie', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Delete session - mock next API call
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const response = await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Session deleted successfully',
      });

      // Verify cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('voiceflow_session_id=;');
    });

    it('should return 400 when no session found', async () => {
      const response = await request(app)
        .delete('/api/voiceflow/session')
        .expect(400);

      expect(response.body.error).toContain('No session found');
    });

    it('should return 403 for invalid session ownership', async () => {
      // Create session with one user
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Try to delete with different user
      mockUserId = 'different-user-id';

      const response = await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(403);

      expect(response.body.error).toBe('Invalid session');
    });

    it('should return 401 when unauthenticated', async () => {
      mockUserId = '';

      const response = await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', ['voiceflow_session_id=test-session'])
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should still clean up local session even if Voiceflow API fails', async () => {
      // Create session first
      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Clear default mock and make all retries fail
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API error'));

      const response = await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(500);

      expect(response.body.error).toBe('Failed to delete Voiceflow session');
    });
  });

  describe('GET /api/voiceflow/status', () => {
    it('should return ready status when configured', async () => {
      const response = await request(app)
        .get('/api/voiceflow/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ready',
        message: 'Voiceflow service is ready',
        configuration: {
          apiKey: 'valid',
          projectKey: 'test-project-key',
          runtimeUrl: 'https://general-runtime.voiceflow.com',
        },
        setupInstructions: undefined,
      });
    });

    it('should return not_configured when API key is missing', async () => {
      const savedKey = process.env.VOICEFLOW_API_KEY;
      delete process.env.VOICEFLOW_API_KEY;

      const response = await request(app)
        .get('/api/voiceflow/status')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'not_configured',
        message: 'Voiceflow API key not configured',
      });
      // Configuration object should show missing API key
      expect(response.body.configuration.apiKey).toBe('missing');
      expect(response.body.configuration.projectKey).toBe('test-project-key');
      expect(response.body.setupInstructions).toBeDefined();

      // Restore
      process.env.VOICEFLOW_API_KEY = savedKey;
    });

    it('should return not_configured when project key is missing', async () => {
      const savedKey = process.env.VOICEFLOW_PROJECT_KEY;
      delete process.env.VOICEFLOW_PROJECT_KEY;

      const response = await request(app)
        .get('/api/voiceflow/status')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'not_configured',
        message: 'Voiceflow project key not configured',
      });
      expect(response.body.configuration.projectKey).toBe('missing');
      expect(response.body.setupInstructions).toBeDefined();

      // Restore
      process.env.VOICEFLOW_PROJECT_KEY = savedKey;
    });

    it('should return 401 when unauthenticated', async () => {
      mockUserId = '';

      const response = await request(app)
        .get('/api/voiceflow/status')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should use runtime URL from module initialization', async () => {
      // Note: VOICEFLOW_RUNTIME_URL is set as a constant at module load time,
      // so changing process.env after the module loads won't affect it.
      // This test verifies that the URL is returned correctly.
      const response = await request(app)
        .get('/api/voiceflow/status')
        .expect(200);

      expect(response.body.configuration.runtimeUrl).toBeDefined();
      expect(typeof response.body.configuration.runtimeUrl).toBe('string');
      expect(response.body.configuration.runtimeUrl).toContain('voiceflow.com');
    });
  });

  describe('Security Tests', () => {
    it('should require authentication on all endpoints', async () => {
      mockUserId = '';

      await request(app).post('/api/voiceflow/session').expect(401);
      await request(app).post('/api/voiceflow/interact').expect(401);
      await request(app).get('/api/voiceflow/state').expect(401);
      await request(app).delete('/api/voiceflow/session').expect(401);
      await request(app).get('/api/voiceflow/status').expect(401);
    });

    it('should validate session ownership on all session operations', async () => {
      // Create session with user A
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // Try to use session with user B
      mockUserId = 'different-user-id';

      await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'Hello' })
        .expect(403);

      await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', sessionCookie)
        .expect(403);

      await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(403);
    });

    it('should set secure cookie attributes in production', async () => {
      process.env.NODE_ENV = 'production';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('Secure');
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('SameSite=Lax');

      process.env.NODE_ENV = 'test';
    });

    it('should not expose sensitive details in production errors', async () => {
      const savedEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Clear default mock and make API fail
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Internal error'));

      const response = await request(app)
        .post('/api/voiceflow/session')
        .expect(500);

      expect(response.body.details).toBeUndefined();

      // Restore
      process.env.NODE_ENV = savedEnv;
    });
  });

  describe('Integration Tests', () => {
    it('should complete full conversation flow', async () => {
      // 1. Initialize session
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'text', payload: { message: 'Welcome! What is your name?' } },
        ],
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      expect(sessionResponse.body.initialMessages).toHaveLength(1);
      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // 2. Send first message
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'text', payload: { message: 'Nice to meet you, John!' } },
          { type: 'profile_data', payload: { data: { contactInfo: { firstName: 'John' } } } },
        ],
      });

      const interact1 = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'My name is John' })
        .expect(200);

      expect(interact1.body.profileData.contactInfo.firstName).toBe('John');

      // 3. Check state
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stack: [], storage: {}, variables: { userName: 'John' } }),
      });

      const stateResponse = await request(app)
        .get('/api/voiceflow/state')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(stateResponse.body.state.variables.userName).toBe('John');

      // 4. Complete conversation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'text', payload: { message: 'Thank you! Your profile is complete.' } },
          { type: 'end', payload: {} },
        ],
      });

      const interact2 = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'Done' })
        .expect(200);

      expect(interact2.body.isComplete).toBe(true);

      // 5. Delete session
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await request(app)
        .delete('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(200);
    });

    it('should handle session persistence across page refreshes', async () => {
      // Create session
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];
      const sessionId = sessionResponse.body.sessionId;

      // Simulate page refresh - initialize again with same cookie
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const refreshResponse = await request(app)
        .post('/api/voiceflow/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Should reuse the same session ID
      expect(refreshResponse.body.sessionId).toBe(sessionId);
    });

    it('should accumulate profile data across multiple interactions', async () => {
      // Create session
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVoiceflowLaunchResponse,
      });

      const sessionResponse = await request(app)
        .post('/api/voiceflow/session')
        .expect(200);

      const sessionCookie = sessionResponse.headers['set-cookie'][0];

      // First interaction - name
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'profile_data', payload: { data: { contactInfo: { firstName: 'John' } } } },
        ],
      });

      const response1 = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'John' })
        .expect(200);

      expect(response1.body.profileData.contactInfo.firstName).toBe('John');

      // Second interaction - email
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { type: 'profile_data', payload: { data: { contactInfo: { email: 'john@example.com' } } } },
        ],
      });

      const response2 = await request(app)
        .post('/api/voiceflow/interact')
        .set('Cookie', sessionCookie)
        .send({ message: 'john@example.com' })
        .expect(200);

      expect(response2.body.profileData.contactInfo.email).toBe('john@example.com');
    });
  });
});
