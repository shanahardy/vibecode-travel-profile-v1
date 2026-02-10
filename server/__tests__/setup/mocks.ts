/**
 * Mock Fixtures for Travel Application Tests
 * Provides reusable mock data for profiles, trips, and group members
 */

import type { TravelProfile, Trip, TravelGroupMember } from '@shared/schema';
import type { User } from '@shared/models/auth';

/**
 * Mock User (from auth system)
 */
export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: null,
  stripeCustomerId: null,
  subscriptionType: 'free',
  isPremium: false,
  emailNotifications: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

/**
 * Mock Travel Profile
 */
export const mockTravelProfile: TravelProfile = {
  id: 'profile-1',
  userId: 'test-replit-user-id',
  name: 'Test Traveler',
  contactInfo: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '555-0100',
    dateOfBirth: '1990-01-01'
  },
  location: {
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    preferredAirports: ['SFO', 'OAK'],
    preferredTerminals: [{ type: 'international', name: 'International Terminal' }]
  },
  budgetPreferences: {
    priorityCategories: {
      flights: 'medium',
      lodging: 'high',
      food: 'medium',
      activities: 'low'
    },
    budgetRange: {
      min: 1000,
      max: 5000,
      currency: 'USD'
    },
    notes: 'Prefer comfortable but affordable options'
  },
  travelStyle: ['adventure', 'cultural'],
  budget: 'moderate',
  preferredDestinations: ['Europe', 'Asia'],
  dietaryRestrictions: ['vegetarian'],
  interests: ['hiking', 'museums'],
  travelCompanions: '',
  homeAirport: 'SFO',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

/**
 * Mock Upcoming Trip
 */
export const mockTrip: Trip = {
  id: 'trip-1',
  profileId: 'profile-1',
  destination: 'Paris, France',
  purpose: 'vacation',
  status: 'upcoming',
  timeframe: { type: 'flexible', description: 'Spring 2026' },
  notes: 'First time visiting',
  pastTripDate: null,
  summary: null,
  likes: null,
  dislikes: null,
  specialNeeds: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

/**
 * Mock Past Trip
 */
export const mockPastTrip: Trip = {
  id: 'trip-2',
  profileId: 'profile-1',
  destination: 'Tokyo, Japan',
  purpose: 'vacation',
  status: 'past',
  timeframe: { type: 'past', description: 'March 2025' },
  pastTripDate: 'March 2025',
  summary: 'Amazing cultural experience',
  likes: ['Sushi', 'Cherry blossoms', 'Temples'],
  dislikes: ['Crowded trains'],
  specialNeeds: ['Vegetarian restaurants'],
  notes: '',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

/**
 * Mock Group Member (Minor)
 */
export const mockGroupMember: TravelGroupMember = {
  id: 'member-1',
  profileId: 'profile-1',
  name: 'Child Name',
  age: 10,
  isMinor: true,
  schoolInfo: {
    schoolName: 'Elementary School'
  },
  groupType: 'family',
  sequence: 0,
  createdAt: new Date('2025-01-01'),
};

/**
 * Mock Group Member (Adult)
 */
export const mockAdultGroupMember: TravelGroupMember = {
  id: 'member-2',
  profileId: 'profile-1',
  name: 'Adult Name',
  age: 35,
  isMinor: false,
  schoolInfo: null,
  groupType: 'family',
  sequence: 1,
  createdAt: new Date('2025-01-01'),
};

/**
 * Mock Replit Auth session user
 */
export const mockReplitUser = {
  id: 'test-replit-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  profileImageUrl: 'https://example.com/avatar.png'
};

/**
 * Mock authenticated request with Replit Auth session
 */
export const createAuthenticatedRequest = (overrides = {}) => ({
  isAuthenticated: () => true,
  user: {
    claims: {
      sub: mockReplitUser.id,
      email: mockReplitUser.email,
      first_name: mockReplitUser.firstName,
      last_name: mockReplitUser.lastName,
      profile_image: mockReplitUser.profileImageUrl
    }
  },
  ...overrides
});

/**
 * Mock unauthenticated request
 */
export const createUnauthenticatedRequest = () => ({
  isAuthenticated: () => false,
  user: null
});

/**
 * Reset all travel-specific mocks to their default state
 */
export function resetTravelMocks() {
  jest.clearAllMocks();
}

/**
 * Alias for resetTravelMocks to match template tests
 */
export const resetAllMocks = resetTravelMocks;

/**
 * Create a mock profile with custom overrides
 */
export function createMockProfile(overrides: Partial<TravelProfile> = {}): TravelProfile {
  return {
    ...mockTravelProfile,
    ...overrides,
    createdAt: overrides.createdAt || new Date('2025-01-01'),
    updatedAt: overrides.updatedAt || new Date('2025-01-01'),
  };
}

/**
 * Create a mock trip with custom overrides
 */
export function createMockTrip(overrides: Partial<Trip> = {}): Trip {
  return {
    ...mockTrip,
    ...overrides,
    createdAt: overrides.createdAt || new Date('2025-01-01'),
    updatedAt: overrides.updatedAt || new Date('2025-01-01'),
  };
}

/**
 * Create a mock group member with custom overrides
 */
export function createMockGroupMember(overrides: Partial<TravelGroupMember> = {}): TravelGroupMember {
  return {
    ...mockGroupMember,
    ...overrides,
    createdAt: overrides.createdAt || new Date('2025-01-01'),
  };
}

/**
 * Mock Voiceflow Session
 */
export const mockVoiceflowSession = {
  userId: 'test-replit-user-id',
  voiceflowUserId: 'replit_test-replit-user-id',
  createdAt: Date.now(),
};

/**
 * Mock Voiceflow Traces (sample conversation responses)
 */
export const mockVoiceflowTraces = {
  textTrace: {
    type: 'text',
    payload: {
      message: 'Hello! I can help you plan your trip.',
    },
  },
  speakTrace: {
    type: 'speak',
    payload: {
      message: 'What is your name?',
      src: 'https://voiceflow-tts.example.com/audio/abc123.mp3',
    },
  },
  profileDataTrace: {
    type: 'profile_data',
    payload: {
      data: {
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
    },
  },
  endTrace: {
    type: 'end',
    payload: {},
  },
};

/**
 * Mock Voiceflow API Response (successful launch)
 */
export const mockVoiceflowLaunchResponse = [
  mockVoiceflowTraces.textTrace,
  mockVoiceflowTraces.speakTrace,
];

/**
 * Mock Voiceflow API Response (with profile data)
 */
export const mockVoiceflowInteractResponse = [
  {
    type: 'text',
    payload: {
      message: 'Thanks for sharing that information!',
    },
  },
  mockVoiceflowTraces.profileDataTrace,
];

/**
 * Mock Voiceflow State
 */
export const mockVoiceflowState = {
  stack: [
    {
      nodeId: 'node-1',
      type: 'block',
    },
  ],
  storage: {},
  variables: {
    userName: 'John',
  },
};

/**
 * Create mock Voiceflow session with overrides
 */
export function createMockVoiceflowSession(overrides = {}) {
  return {
    ...mockVoiceflowSession,
    ...overrides,
  };
}
