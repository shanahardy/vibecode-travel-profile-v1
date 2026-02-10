/**
 * Voiceflow API Client
 *
 * Provides wrapper functions for interacting with the Voiceflow backend API
 */

import type {
  VoiceflowSessionResponse,
  VoiceflowResponse,
  VoiceflowInteractRequest,
  VoiceflowStateResponse,
  VoiceflowStatusResponse,
  VoiceflowTrace,
  ExtractedProfileData
} from '@shared/voiceflow-types';

const API_BASE = '/api/voiceflow';

/**
 * Initialize a new Voiceflow session
 */
export async function initVoiceflowSession(): Promise<VoiceflowSessionResponse> {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to initialize session' }));
    throw new Error(error.error || 'Failed to initialize Voiceflow session');
  }

  return response.json();
}

/**
 * Send a message to Voiceflow and get response
 */
export async function sendMessage(message: string): Promise<VoiceflowResponse> {
  const request: VoiceflowInteractRequest = { message };

  const response = await fetch(`${API_BASE}/interact`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error || 'Failed to send message to Voiceflow');
  }

  return response.json();
}

/**
 * Send an action to Voiceflow (e.g., launch, intent)
 */
export async function sendAction(action: { type: string; payload?: any }): Promise<VoiceflowResponse> {
  const request: VoiceflowInteractRequest = { action };

  const response = await fetch(`${API_BASE}/interact`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send action' }));
    throw new Error(error.error || 'Failed to send action to Voiceflow');
  }

  return response.json();
}

/**
 * Get current Voiceflow conversation state
 */
export async function getState(): Promise<VoiceflowStateResponse> {
  const response = await fetch(`${API_BASE}/state`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to get state' }));
    throw new Error(error.error || 'Failed to get Voiceflow state');
  }

  return response.json();
}

/**
 * Reset/delete current Voiceflow session
 */
export async function deleteSession(): Promise<void> {
  const response = await fetch(`${API_BASE}/session`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete session' }));
    throw new Error(error.error || 'Failed to delete Voiceflow session');
  }
}

/**
 * Check Voiceflow service status
 */
export async function checkStatus(): Promise<VoiceflowStatusResponse> {
  const response = await fetch(`${API_BASE}/status`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to check status' }));
    throw new Error(error.error || 'Failed to check Voiceflow status');
  }

  return response.json();
}

/**
 * Parse Voiceflow response traces to extract messages and profile data
 */
export function parseVoiceflowResponse(traces: VoiceflowTrace[]): {
  messages: string[];
  ttsUrls: string[];
  profileData: ExtractedProfileData;
  isComplete: boolean;
} {
  const messages: string[] = [];
  const ttsUrls: string[] = [];
  let profileData: ExtractedProfileData = {};
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
        if (trace.payload?.imageUrl) {
          // Could display images in the future
        }
        break;

      case 'choice':
        // Handle choice buttons if needed
        if (trace.payload?.actions) {
          // Could display buttons in the future
        }
        break;

      case 'end':
        isComplete = true;
        break;

      case 'profile_data':
        // Custom trace type for extracted profile data
        if (trace.payload?.data) {
          profileData = mergeProfileData(profileData, trace.payload.data);
        }
        break;

      default:
        // Handle unknown trace types
        console.debug('[Voiceflow] Unknown trace type:', trace.type);
        break;
    }
  }

  return { messages, ttsUrls, profileData, isComplete };
}

/**
 * Merge profile data, handling nested objects and arrays
 */
function mergeProfileData(
  existing: ExtractedProfileData,
  incoming: Record<string, any>
): ExtractedProfileData {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (key === 'groupMembers' && Array.isArray(value)) {
      // Merge group members array
      merged.groupMembers = [...(merged.groupMembers || []), ...value];
    } else if (key === 'trips' && Array.isArray(value)) {
      // Merge trips array
      merged.trips = [...(merged.trips || []), ...value];
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Merge nested objects (contactInfo, location, budgetPreferences)
      merged[key as keyof ExtractedProfileData] = {
        ...(merged[key as keyof ExtractedProfileData] as any),
        ...value
      };
    } else {
      // Direct assignment for primitives
      merged[key as keyof ExtractedProfileData] = value;
    }
  }

  return merged;
}

/**
 * Format profile data for display in the UI
 */
export function formatProfileDataForDisplay(data: ExtractedProfileData): Record<string, any> {
  const formatted: Record<string, any> = {};

  if (data.contactInfo) {
    formatted['Contact Information'] = data.contactInfo;
  }

  if (data.location) {
    formatted['Location'] = data.location;
  }

  if (data.groupMembers && data.groupMembers.length > 0) {
    formatted['Travel Group'] = data.groupMembers;
  }

  if (data.trips && data.trips.length > 0) {
    formatted['Upcoming Trips'] = data.trips;
  }

  if (data.pastTripExperience) {
    formatted['Past Trip Experience'] = data.pastTripExperience;
  }

  if (data.budgetPreferences) {
    formatted['Budget Preferences'] = data.budgetPreferences;
  }

  return formatted;
}
