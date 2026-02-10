/**
 * Shared types for Voiceflow integration
 */

export interface VoiceflowTrace {
  type: 'text' | 'speak' | 'visual' | 'choice' | 'end' | 'profile_data' | string;
  payload: {
    message?: string;
    src?: string; // TTS audio URL
    data?: Record<string, any>; // Custom profile data
    slate?: any; // Rich text content
    imageUrl?: any; // Image URL
    actions?: Array<{ name: string; request: any }>; // Button actions
  };
}

export interface VoiceflowResponse {
  messages: string[];
  ttsUrls: string[];
  profileData: Record<string, any>;
  isComplete: boolean;
  traces: VoiceflowTrace[];
}

export interface VoiceflowSessionResponse {
  sessionId: string;
  voiceflowUserId: string;
  expiresAt: number;
  initialMessages: string[];
  initialTtsUrls: string[];
  profileData: Record<string, any>;
}

export interface VoiceflowInteractRequest {
  message?: string;
  action?: {
    type: 'launch' | 'text' | 'intent' | string;
    payload?: any;
  };
}

export interface VoiceflowStateResponse {
  state: {
    stack: any[];
    storage: Record<string, any>;
    variables: Record<string, any>;
  };
}

export interface VoiceflowStatusResponse {
  status: 'ready' | 'not_configured';
  message: string;
  projectKey?: string;
  runtimeUrl?: string;
}

// Profile data extraction types matching TravelProfile structure
export interface ExtractedContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface ExtractedLocation {
  city?: string;
  state?: string;
  zipCode?: string;
  nearestAirport?: string;
}

export interface ExtractedGroupMember {
  name: string;
  age?: number;
  isMinor?: boolean;
  schoolInfo?: {
    schoolName?: string;
    grade?: string;
  };
}

export interface ExtractedTrip {
  destination?: string;
  timeframe?: {
    startDate?: string;
    endDate?: string;
    flexibility?: string;
  };
  purpose?: string;
}

export interface ExtractedBudgetPreferences {
  budgetRange?: string;
  priorityCategory?: string;
}

export interface ExtractedProfileData {
  contactInfo?: ExtractedContactInfo;
  location?: ExtractedLocation;
  groupMembers?: ExtractedGroupMember[];
  trips?: ExtractedTrip[];
  pastTripExperience?: string;
  budgetPreferences?: ExtractedBudgetPreferences;
}
