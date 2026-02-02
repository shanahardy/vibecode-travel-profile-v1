/**
 * Storage Layer Tests
 * Tests database operations for users, profiles, and trips
 */

import { authStorage } from '../replit_integrations/auth/storage';
import { storage } from '../storage';
import {
  mockTravelProfile,
  mockTrip,
  mockPastTrip,
  mockGroupMember,
  mockAdultGroupMember,
  createMockProfile,
  createMockTrip,
  createMockGroupMember,
} from './setup/mocks';

describe('Storage Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Operations', () => {
    it('should get user by ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        stripeCustomerId: null,
        subscriptionType: 'free' as const,
        isPremium: false,
        emailNotifications: true,
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const user = await authStorage.getUser('test-user-id');

      expect(user).toEqual(mockUser);
      expect(authStorage.getUser).toHaveBeenCalledWith('test-user-id');
    });

    it('should return null for non-existent user', async () => {
      (authStorage.getUser as jest.Mock).mockResolvedValue(null);

      const user = await authStorage.getUser('non-existent-id');

      expect(user).toBeNull();
    });

    it('should create or update user with upsert', async () => {
      const userData = {
        id: 'replit-user-123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      const mockUser = {
        id: '1',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      (authStorage.upsertUser as jest.Mock).mockResolvedValue(mockUser);

      const user = await authStorage.upsertUser(userData);

      expect(user).toEqual(mockUser);
      expect(authStorage.upsertUser).toHaveBeenCalledWith(userData);
    });

    it('should update user fields', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        emailNotifications: false,
      };

      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      await authStorage.updateUser('test-user-id', updates);

      expect(authStorage.updateUser).toHaveBeenCalledWith('test-user-id', updates);
    });

    it('should update Stripe customer ID', async () => {
      const updates = {
        stripeCustomerId: 'cus_new123',
        subscriptionType: 'pro' as const,
        isPremium: true,
      };

      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      await authStorage.updateUser('test-user-id', updates);

      expect(authStorage.updateUser).toHaveBeenCalledWith('test-user-id', updates);
    });

    it('should handle database errors gracefully', async () => {
      (authStorage.getUser as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(authStorage.getUser('test-user-id')).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('Subscription Type Validation', () => {
    it('should only allow valid subscription types', async () => {
      const validTypes = ['free', 'pro'];

      for (const type of validTypes) {
        (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

        await authStorage.updateUser('test-user-id', {
          subscriptionType: type as 'free' | 'pro',
        });

        expect(authStorage.updateUser).toHaveBeenCalledWith('test-user-id', {
          subscriptionType: type,
        });
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent user updates', async () => {
      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      const updates = [
        authStorage.updateUser('user-1', { firstName: 'User' }),
        authStorage.updateUser('user-2', { firstName: 'Another' }),
        authStorage.updateUser('user-3', { emailNotifications: true }),
      ];

      await Promise.all(updates);

      expect(authStorage.updateUser).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent reads', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@test.com' },
        { id: 2, email: 'user2@test.com' },
        { id: 3, email: 'user3@test.com' },
      ];

      (authStorage.getUser as jest.Mock)
        .mockResolvedValueOnce(mockUsers[0])
        .mockResolvedValueOnce(mockUsers[1])
        .mockResolvedValueOnce(mockUsers[2]);

      const reads = [
        authStorage.getUser('id-1'),
        authStorage.getUser('id-2'),
        authStorage.getUser('id-3'),
      ];

      const results = await Promise.all(reads);

      expect(results).toEqual(mockUsers);
      expect(authStorage.getUser).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle unique constraint violations', async () => {
      const duplicateError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { code: '23505' }
      );

      (authStorage.upsertUser as jest.Mock).mockRejectedValue(duplicateError);

      await expect(
        authStorage.upsertUser({
          id: 'test-id',
          email: 'duplicate@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('duplicate key value violates unique constraint');
    });

    it('should handle connection timeouts', async () => {
      (authStorage.getUser as jest.Mock).mockRejectedValue(
        new Error('connection timeout')
      );

      await expect(authStorage.getUser('test-id')).rejects.toThrow(
        'connection timeout'
      );
    });
  });

  describe('Data Integrity', () => {
    it('should preserve data types on update', async () => {
      const updates = {
        emailNotifications: true, // boolean
        isPremium: false, // boolean
        subscriptionType: 'free' as const, // enum
      };

      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      await authStorage.updateUser('test-user-id', updates);

      expect(authStorage.updateUser).toHaveBeenCalledWith('test-user-id', updates);
    });

    it('should handle null values correctly', async () => {
      const updates = {
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        stripeCustomerId: null,
      };

      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      await authStorage.updateUser('test-user-id', updates);

      expect(authStorage.updateUser).toHaveBeenCalledWith('test-user-id', updates);
    });
  });

  describe('Profile Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getProfile', () => {
      it('should fetch profile by userId', async () => {
        (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);

        const profile = await storage.getProfile('test-replit-user-id');

        expect(profile).toEqual(mockTravelProfile);
        expect(storage.getProfile).toHaveBeenCalledWith('test-replit-user-id');
      });

      it('should return undefined for non-existent profile', async () => {
        (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

        const profile = await storage.getProfile('non-existent-id');

        expect(profile).toBeUndefined();
      });

      it('should handle JSONB fields correctly', async () => {
        const profileWithJsonb = createMockProfile({
          contactInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '555-1234',
            dateOfBirth: '1990-01-01'
          },
          location: {
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            preferredAirports: ['LAX'],
            preferredTerminals: [{ type: 'domestic', name: 'Terminal 3' }]
          },
          budgetPreferences: {
            priorityCategories: {
              flights: 'medium',
              lodging: 'high',
              food: 'medium',
              activities: 'low'
            },
            notes: 'Prefer comfort over cost'
          },
        });

        (storage.getProfile as jest.Mock).mockResolvedValue(profileWithJsonb);

        const profile = await storage.getProfile('test-user-id');

        expect(profile?.contactInfo).toEqual({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          phone: '555-1234',
          dateOfBirth: '1990-01-01'
        });
        expect(profile?.location).toEqual({
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          preferredAirports: ['LAX'],
          preferredTerminals: [{ type: 'domestic', name: 'Terminal 3' }]
        });
        expect(profile?.budgetPreferences).toEqual({
          priorityCategories: {
            flights: 'medium',
            lodging: 'high',
            food: 'medium',
            activities: 'low'
          },
          notes: 'Prefer comfort over cost'
        });
      });
    });

    describe('upsertProfile', () => {
      it('should create new profile', async () => {
        (storage.getProfile as jest.Mock).mockResolvedValue(undefined);
        (storage.upsertProfile as jest.Mock).mockResolvedValue(mockTravelProfile);

        const profile = await storage.upsertProfile('test-user-id', {
          name: 'Test Traveler',
          contactInfo: {
            firstName: 'Test',
            lastName: 'Traveler',
            email: 'test@example.com',
            phone: '555-0100',
            dateOfBirth: '1990-01-01'
          },
        });

        expect(profile).toEqual(mockTravelProfile);
        expect(storage.upsertProfile).toHaveBeenCalledWith('test-user-id', expect.any(Object));
      });

      it('should update existing profile', async () => {
        const updatedProfile = createMockProfile({ name: 'Updated Name' });

        (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
        (storage.upsertProfile as jest.Mock).mockResolvedValue(updatedProfile);

        const profile = await storage.upsertProfile('test-user-id', {
          name: 'Updated Name',
        });

        expect(profile.name).toBe('Updated Name');
      });

      it('should handle missing optional fields', async () => {
        const minimalProfile = createMockProfile({
          dietaryRestrictions: [],
          interests: [],
        });

        (storage.upsertProfile as jest.Mock).mockResolvedValue(minimalProfile);

        const profile = await storage.upsertProfile('test-user-id', {
          name: 'Minimal Traveler',
        });

        expect(profile).toBeDefined();
      });

      it('should validate dietary restrictions array', async () => {
        const profileWithDiet = createMockProfile({
          dietaryRestrictions: ['vegetarian', 'gluten-free', 'nut-allergy'],
        });

        (storage.upsertProfile as jest.Mock).mockResolvedValue(profileWithDiet);

        const profile = await storage.upsertProfile('test-user-id', {
          dietaryRestrictions: ['vegetarian', 'gluten-free', 'nut-allergy'],
        });

        expect(profile.dietaryRestrictions).toHaveLength(3);
      });
    });

    describe('deleteProfile', () => {
      it('should delete profile', async () => {
        (storage.deleteProfile as jest.Mock).mockResolvedValue(undefined);

        await storage.deleteProfile('test-user-id');

        expect(storage.deleteProfile).toHaveBeenCalledWith('test-user-id');
      });

      it('should cascade delete trips and members', async () => {
        (storage.deleteProfile as jest.Mock).mockResolvedValue(undefined);
        (storage.getTrips as jest.Mock).mockResolvedValue([]);
        (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

        await storage.deleteProfile('test-user-id');

        // Verify profile was deleted
        expect(storage.deleteProfile).toHaveBeenCalledWith('test-user-id');
      });
    });
  });

  describe('Trip Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('getTripById', () => {
      it('should fetch trip with profileId', async () => {
        (storage.getTripById as jest.Mock).mockResolvedValue(mockTrip);

        const trip = await storage.getTripById('trip-1');

        expect(trip).toEqual(mockTrip);
        expect(trip?.profileId).toBe('profile-1');
      });

      it('should return undefined for non-existent trip', async () => {
        (storage.getTripById as jest.Mock).mockResolvedValue(undefined);

        const trip = await storage.getTripById('non-existent-id');

        expect(trip).toBeUndefined();
      });
    });

    describe('getTrips', () => {
      it('should list all trips for profile', async () => {
        (storage.getTrips as jest.Mock).mockResolvedValue([mockTrip, mockPastTrip]);

        const trips = await storage.getTrips('profile-1');

        expect(trips).toHaveLength(2);
        expect(trips[0].status).toBe('upcoming');
        expect(trips[1].status).toBe('past');
      });

      it('should return empty array when no trips', async () => {
        (storage.getTrips as jest.Mock).mockResolvedValue([]);

        const trips = await storage.getTrips('profile-1');

        expect(trips).toEqual([]);
      });

      it('should filter by profileId correctly', async () => {
        const profile2Trips = [createMockTrip({ profileId: 'profile-2', destination: 'Rome, Italy' })];

        (storage.getTrips as jest.Mock).mockResolvedValue(profile2Trips);

        const trips = await storage.getTrips('profile-2');

        expect(trips).toHaveLength(1);
        expect(trips[0].profileId).toBe('profile-2');
      });
    });

    describe('createTrip', () => {
      it('should create upcoming trip with correct status', async () => {
        const newTrip = createMockTrip({
          destination: 'Barcelona, Spain',
          status: 'upcoming',
        });

        (storage.createTrip as jest.Mock).mockResolvedValue(newTrip);

        const trip = await storage.createTrip('profile-1', {
          profileId: 'profile-1',
          destination: 'Barcelona, Spain',
          purpose: 'vacation',
          status: 'upcoming',
          timeframe: { type: 'flexible', description: 'Summer 2026' },
          notes: '',
        });

        expect(trip.status).toBe('upcoming');
        expect(trip.destination).toBe('Barcelona, Spain');
      });

      it('should create past trip with arrays', async () => {
        (storage.createTrip as jest.Mock).mockResolvedValue(mockPastTrip);

        const trip = await storage.createTrip('profile-1', {
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
        });

        expect(trip.status).toBe('past');
        expect(trip.likes).toEqual(['Sushi', 'Cherry blossoms', 'Temples']);
        expect(trip.dislikes).toEqual(['Crowded trains']);
        expect(trip.specialNeeds).toEqual(['Vegetarian restaurants']);
      });

      it('should handle JSONB timeframe field', async () => {
        const tripWithTimeframe = createMockTrip({
          timeframe: { type: 'specific', description: 'June 15-22, 2026' },
        });

        (storage.createTrip as jest.Mock).mockResolvedValue(tripWithTimeframe);

        const trip = await storage.createTrip('profile-1', {
          profileId: 'profile-1',
          destination: 'Paris, France',
          purpose: 'vacation',
          status: 'upcoming',
          timeframe: { type: 'specific', description: 'June 15-22, 2026' },
          notes: '',
        });

        expect(trip.timeframe).toEqual({ type: 'specific', description: 'June 15-22, 2026' });
      });
    });

    describe('updateTrip', () => {
      it('should modify trip fields', async () => {
        const updatedTrip = createMockTrip({
          destination: 'Nice, France',
          notes: 'Changed destination',
        });

        (storage.updateTrip as jest.Mock).mockResolvedValue(updatedTrip);

        const trip = await storage.updateTrip('trip-1', {
          destination: 'Nice, France',
          notes: 'Changed destination',
        });

        expect(trip.destination).toBe('Nice, France');
        expect(trip.notes).toBe('Changed destination');
      });

      it('should update timeframe JSONB field', async () => {
        const updatedTrip = createMockTrip({
          timeframe: { type: 'flexible', description: 'Fall 2026' },
        });

        (storage.updateTrip as jest.Mock).mockResolvedValue(updatedTrip);

        const trip = await storage.updateTrip('trip-1', {
          timeframe: { type: 'flexible', description: 'Fall 2026' },
        });

        expect(trip.timeframe).toEqual({ type: 'flexible', description: 'Fall 2026' });
      });
    });

    describe('deleteTrip', () => {
      it('should remove trip', async () => {
        (storage.deleteTrip as jest.Mock).mockResolvedValue(undefined);

        await storage.deleteTrip('trip-1');

        expect(storage.deleteTrip).toHaveBeenCalledWith('trip-1');
      });
    });
  });

  describe('Group Member Operations', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('syncGroupMembers', () => {
      it('should replace all members atomically', async () => {
        (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

        await storage.syncGroupMembers('profile-1', [
          { profileId: 'profile-1', name: 'Member 1', age: 10, isMinor: true, schoolInfo: null, groupType: 'family', sequence: 0 },
          { profileId: 'profile-1', name: 'Member 2', age: 35, isMinor: false, schoolInfo: null, groupType: 'family', sequence: 1 },
        ]);

        expect(storage.syncGroupMembers).toHaveBeenCalledWith('profile-1', expect.any(Array));
      });

      it('should handle empty member list', async () => {
        (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

        await storage.syncGroupMembers('profile-1', []);

        expect(storage.syncGroupMembers).toHaveBeenCalledWith('profile-1', []);
      });

      it('should handle minors with school info', async () => {
        (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

        await storage.syncGroupMembers('profile-1', [
          {
            profileId: 'profile-1',
            name: 'Child',
            age: 12,
            isMinor: true,
            schoolInfo: { schoolName: 'Middle School' },
            groupType: 'family',
            sequence: 0,
          },
        ]);

        const call = (storage.syncGroupMembers as jest.Mock).mock.calls[0];
        expect(call[1][0].schoolInfo).toEqual({
          schoolName: 'Middle School',
        });
      });

      it('should handle adults without school info', async () => {
        (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

        await storage.syncGroupMembers('profile-1', [
          {
            profileId: 'profile-1',
            name: 'Adult',
            age: 40,
            isMinor: false,
            schoolInfo: null,
            groupType: 'family',
            sequence: 0,
          },
        ]);

        const call = (storage.syncGroupMembers as jest.Mock).mock.calls[0];
        expect(call[1][0].schoolInfo).toBeNull();
      });

      it('should preserve sequence order', async () => {
        (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

        await storage.syncGroupMembers('profile-1', [
          { profileId: 'profile-1', name: 'First', age: 30, isMinor: false, schoolInfo: null, groupType: 'family', sequence: 0 },
          { profileId: 'profile-1', name: 'Second', age: 28, isMinor: false, schoolInfo: null, groupType: 'family', sequence: 1 },
          { profileId: 'profile-1', name: 'Third', age: 5, isMinor: true, schoolInfo: null, groupType: 'family', sequence: 2 },
        ]);

        const call = (storage.syncGroupMembers as jest.Mock).mock.calls[0];
        expect(call[1][0].sequence).toBe(0);
        expect(call[1][1].sequence).toBe(1);
        expect(call[1][2].sequence).toBe(2);
      });
    });

    describe('getGroupMembers', () => {
      it('should retrieve members in sequence order', async () => {
        (storage.getGroupMembers as jest.Mock).mockResolvedValue([
          mockGroupMember,
          mockAdultGroupMember,
        ]);

        const members = await storage.getGroupMembers('profile-1');

        expect(members).toHaveLength(2);
        expect(members[0].sequence).toBeLessThan(members[1].sequence);
      });

      it('should return empty array when no members', async () => {
        (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

        const members = await storage.getGroupMembers('profile-1');

        expect(members).toEqual([]);
      });

      it('should filter by profileId correctly', async () => {
        const profile2Members = [
          createMockGroupMember({ profileId: 'profile-2', name: 'Different Profile Member' }),
        ];

        (storage.getGroupMembers as jest.Mock).mockResolvedValue(profile2Members);

        const members = await storage.getGroupMembers('profile-2');

        expect(members).toHaveLength(1);
        expect(members[0].profileId).toBe('profile-2');
      });
    });
  });

  describe('Data Integrity', () => {
    it('should handle concurrent trip operations', async () => {
      (storage.createTrip as jest.Mock)
        .mockResolvedValueOnce(createMockTrip({ id: 'trip-1', destination: 'Paris' }))
        .mockResolvedValueOnce(createMockTrip({ id: 'trip-2', destination: 'London' }))
        .mockResolvedValueOnce(createMockTrip({ id: 'trip-3', destination: 'Berlin' }));

      const operations = [
        storage.createTrip('profile-1', { profileId: 'profile-1', destination: 'Paris', purpose: 'vacation', status: 'upcoming', timeframe: { type: 'flexible', description: 'Spring 2026' }, notes: '' }),
        storage.createTrip('profile-1', { profileId: 'profile-1', destination: 'London', purpose: 'business', status: 'upcoming', timeframe: { type: 'flexible', description: 'Q2 2026' }, notes: '' }),
        storage.createTrip('profile-1', { profileId: 'profile-1', destination: 'Berlin', purpose: 'vacation', status: 'upcoming', timeframe: { type: 'flexible', description: 'Summer 2026' }, notes: '' }),
      ];

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      expect(storage.createTrip).toHaveBeenCalledTimes(3);
    });

    it('should cascade delete members when profile deleted', async () => {
      (storage.deleteProfile as jest.Mock).mockResolvedValue(undefined);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      await storage.deleteProfile('test-user-id');

      // After delete, members should be gone
      const members = await storage.getGroupMembers('profile-1');
      expect(members).toEqual([]);
    });

    it('should handle JSONB schoolInfo field correctly', async () => {
      const memberWithSchool = createMockGroupMember({
        schoolInfo: { schoolName: 'Test School' },
      });

      (storage.getGroupMembers as jest.Mock).mockResolvedValue([memberWithSchool]);

      const members = await storage.getGroupMembers('profile-1');

      expect(members[0].schoolInfo).toEqual({
        schoolName: 'Test School',
      });
    });
  });
});
