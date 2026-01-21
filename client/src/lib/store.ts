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
  firstName: string;
  lastName: string;
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
  restoreDemoProfile: () => void;
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
        travelGroup: {
            type: 'family',
            members: [
                { name: 'Traveler', age: 35, isMinor: false },
                { name: 'JD', age: 13, isMinor: true, schoolInfo: { schoolName: '' } }
            ]
        }
      },
      messages: [],
      isLoading: false,
      currentStep: 1, // Start at step 1 to show the group immediately
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
            travelGroup: {
                type: 'family',
                members: [
                    { name: 'Traveler', age: 35, isMinor: false },
                    { name: 'JD', age: 13, isMinor: true, schoolInfo: { schoolName: '' } }
                ]
            }
          },
        }),

      restoreDemoProfile: () => 
        set({
            currentStep: 10,
            isAwaitingConfirmation: false,
            messages: [
                { id: '1', role: 'assistant', content: "Welcome back! I've restored your travel profile. Ready to plan your next trip?", timestamp: Date.now(), type: 'text' }
            ],
            profile: {
                name: 'Alex Johnson',
                contactInfo: {
                    firstName: 'Alex',
                    lastName: 'Johnson',
                    email: 'alex.johnson@example.com',
                    phone: '+1 (555) 123-4567',
                    dateOfBirth: '1985-06-15'
                },
                travelStyle: ['Relaxation', 'Adventure'],
                budget: 'luxury',
                preferredDestinations: ['Bora Bora', 'Kyoto', 'Santorini'],
                dietaryRestrictions: [],
                interests: ['Photography', 'Hiking', 'Food'],
                travelCompanions: 'Family',
                homeAirport: 'SFO',
                travelGroup: {
                    type: 'family',
                    members: [
                        { name: 'Alex', age: 38, isMinor: false },
                        { name: 'Sarah', age: 36, isMinor: false },
                        { name: 'Leo', age: 10, isMinor: true, schoolInfo: { schoolName: 'Lincoln Elementary' } },
                        { name: 'Mia', age: 8, isMinor: true, schoolInfo: { schoolName: 'Lincoln Elementary' } }
                    ]
                },
                location: {
                    city: 'San Francisco',
                    state: 'CA',
                    zipCode: '94114',
                    preferredAirports: ['SFO', 'OAK'],
                    preferredTerminals: []
                },
                budgetPreferences: {
                    priorityCategories: {
                        flights: 'high',
                        lodging: 'high',
                        food: 'medium',
                        activities: 'medium'
                    },
                    budgetRange: {
                        min: 3000,
                        max: 8000,
                        currency: 'USD'
                    },
                    notes: 'Prefer direct flights and boutique hotels.'
                },
                upcomingTrips: [
                    {
                        destination: 'Bora Bora',
                        purpose: 'vacation',
                        timeframe: {
                            type: 'specific',
                            description: 'Jun 12 - Jun 18, 2026',
                            startDate: '2026-06-12T00:00:00.000Z',
                            endDate: '2026-06-18T00:00:00.000Z'
                        },
                        notes: 'Anniversary trip, overwater bungalow required.'
                    },
                    {
                        destination: 'Kyoto, Japan',
                        purpose: 'vacation',
                        timeframe: {
                            type: 'flexible',
                            description: 'Oct 10 - Oct 20, 2026',
                            startDate: '2026-10-10T00:00:00.000Z',
                            endDate: '2026-10-20T00:00:00.000Z'
                        },
                        notes: 'Fall foliage season.'
                    }
                ],
                pastTrips: [
                    {
                        destination: 'Maui, Hawaii',
                        date: 'Dec 2024',
                        summary: 'Relaxing family beach vacation with some hiking.',
                        likes: ['The Four Seasons Resort', 'Road to Hana', 'Snorkeling at Molokini'],
                        dislikes: ['Crowds at Lahaina', 'Long flight delay'],
                        specialNeeds: ['Kid-friendly dining']
                    }
                ]
            }
        })
    }),
    {
      name: 'travel-profile-storage-v3',
    }
  )
);
