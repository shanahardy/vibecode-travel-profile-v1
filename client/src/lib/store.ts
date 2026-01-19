import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TravelProfile {
  name: string;
  travelStyle: string[];
  budget: 'budget' | 'moderate' | 'luxury' | null;
  preferredDestinations: string[];
  dietaryRestrictions: string[];
  interests: string[];
  travelCompanions: string;
  homeAirport: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ProfileState {
  profile: TravelProfile;
  messages: Message[];
  isLoading: boolean;
  
  // Actions
  updateProfile: (updates: Partial<TravelProfile>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
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
      messages: [
        {
          id: 'init-1',
          role: 'assistant',
          content: "Hi there! I'm your AI travel assistant. I'm here to help you build your perfect travel profile so we can plan amazing trips together. To start, what's your name?",
          timestamp: Date.now(),
        },
      ],
      isLoading: false,

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
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

      resetConversation: () =>
        set({
          messages: [
            {
              id: 'init-1',
              role: 'assistant',
              content: "Hi there! I'm your AI travel assistant. I'm here to help you build your perfect travel profile. Let's start fresh. What's your name?",
              timestamp: Date.now(),
            },
          ],
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
      name: 'travel-profile-storage',
    }
  )
);
