import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TravelMember {
  name: string;
  age: number;
  isMinor: boolean;
  schoolInfo?: { schoolName: string };
}

export interface TravelGroup {
  type: 'solo' | 'partner' | 'family' | 'group';
  members: TravelMember[];
}

export interface ContactInfo {
  email: string;
  phone: string;
  dateOfBirth: string;
}

export interface LocationInfo {
  city: string;
  state: string;
  zipCode: string;
  preferredAirports: string[];
  preferredTerminals: { type: string; name: string }[];
}

export interface Trip {
  destination: string;
  timeframe: { type: string; description: string; startDate?: string; endDate?: string };
  purpose: 'vacation' | 'business' | 'family' | 'other';
  notes: string;
  plannerMessages?: Message[];
}

export interface PastTrip {
  destination: string;
  date: string;
  likes: string[];
  dislikes: string[];
  specialNeeds: string[];
  summary: string;
}

export interface BudgetPreferences {
  priorityCategories: {
    flights: 'low' | 'medium' | 'high';
    lodging: 'low' | 'medium' | 'high';
    food: 'low' | 'medium' | 'high';
    activities: 'low' | 'medium' | 'high';
  };
  budgetRange?: {
    min: number;
    max: number;
    currency: string;
  };
  notes: string;
}

export interface TravelProfile {
  // Legacy fields (kept for compatibility/fallback)
  name: string;
  travelStyle: string[];
  budget: 'budget' | 'moderate' | 'luxury' | null;
  preferredDestinations: string[];
  dietaryRestrictions: string[];
  interests: string[];
  travelCompanions: string;
  homeAirport: string;

  // New Onboarding Fields
  contactInfo?: ContactInfo;
  travelGroup?: TravelGroup;
  location?: LocationInfo;
  upcomingTrips?: Trip[];
  pastTrips?: PastTrip[];
  budgetPreferences?: BudgetPreferences;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'confirmation' | 'followup' | 'completion';
}

interface ProfileState {
  profile: TravelProfile;
  messages: Message[];
  isLoading: boolean;
  
  // Onboarding State
  currentStep: number;
  isAwaitingConfirmation: boolean;
  
  // Actions
  updateProfile: (updates: Partial<TravelProfile>) => void;
  updateSection: (section: keyof TravelProfile, data: any) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setStep: (step: number) => void;
  setAwaitingConfirmation: (awaiting: boolean) => void;
  resetConversation: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: {
        name: '',
        travelStyle: [],
        budget: null,
        preferredDestinations: [],
        dietaryRestrictions: [],
        interests: [],
        travelCompanions: '',
        homeAirport: '',
      },
      messages: [],
      isLoading: false,
      currentStep: 0,
      isAwaitingConfirmation: false,

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      updateSection: (section, data) => 
        set((state) => ({
          profile: { ...state.profile, [section]: data }
        })),

      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: Math.random().toString(36).substring(7),
              timestamp: Date.now(),
            },
          ],
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setStep: (step) => set({ currentStep: step }),
      setAwaitingConfirmation: (awaiting) => set({ isAwaitingConfirmation: awaiting }),

      resetConversation: () =>
        set({
          messages: [],
          currentStep: 0,
          isAwaitingConfirmation: false,
          profile: {
            name: '',
            travelStyle: [],
            budget: null,
            preferredDestinations: [],
            dietaryRestrictions: [],
            interests: [],
            travelCompanions: '',
            homeAirport: '',
          },
        }),
    }),
    {
      name: 'travel-profile-storage-v2',
    }
  )
);
