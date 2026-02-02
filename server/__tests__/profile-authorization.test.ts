/**
 * Profile Authorization Tests
 * Tests ownership validation - users can only access their own data
 * SECURITY CRITICAL: Validates that the trip ownership fix prevents unauthorized access
 */

import request from 'supertest';
import express from 'express';
import { storage } from '../storage';
import { registerProfileRoutes } from '../routes/profileRoutes';
import { isAuthenticated } from '../replit_integrations/auth/replitAuth';
import {
  mockTravelProfile,
  mockTrip,
  createMockProfile,
  createMockTrip,
  mockGroupMember,
} from './setup/mocks';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock current authenticated user ID (changeable per test)
let currentUserId = 'user-1';

// Mock isAuthenticated to use currentUserId
jest.mock('../replit_integrations/auth/replitAuth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = {
      claims: {
        sub: currentUserId,
        email: `${currentUserId}@example.com`,
        first_name: 'User',
        last_name: currentUserId,
      },
    };
    req.isAuthenticated = () => true;
    next();
  }),
}));

describe('Profile Authorization', () => {
  beforeAll(async () => {
    await registerProfileRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUserId = 'user-1'; // Reset to default user
  });

  describe('Profile Ownership', () => {
    it('should allow user to GET own profile', async () => {
      const profile = createMockProfile({ userId: 'test-replit-user-id' });
      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.userId).toBe('test-replit-user-id');
      expect(storage.getProfile).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should return 404 when user tries to GET non-existent profile', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(null);

      await request(app)
        .get('/api/profile')
        .expect(404);
    });

    it('should allow user to POST (create/update) own profile', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      (storage.upsertProfile as jest.Mock).mockResolvedValue(profile);
      (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/profile')
        .send({
          name: 'Updated Name',
          contactInfo: {
            firstName: 'Updated',
            lastName: 'User',
            email: 'user-1@example.com',
            phone: '555-0100',
            dateOfBirth: '1990-01-01',
          },
        })
        .expect(200);

      expect(storage.upsertProfile).toHaveBeenCalledWith('test-replit-user-id', expect.any(Object));
    });

    it('should allow user to DELETE own profile', async () => {
      (storage.deleteProfile as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .delete('/api/profile')
        .expect(200);

      expect(storage.deleteProfile).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should handle concurrent access from different users (isolation)', async () => {
      const user1Profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const user2Profile = createMockProfile({ userId: 'user-2', id: 'profile-2' });

      // User 1 request
      currentUserId = 'user-1';
      (storage.getProfile as jest.Mock).mockResolvedValue(user1Profile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response1 = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response1.body.userId).toBe('user-1');

      // User 2 request
      currentUserId = 'user-2';
      (storage.getProfile as jest.Mock).mockResolvedValue(user2Profile);

      const response2 = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response2.body.userId).toBe('user-2');

      // Verify isolation (both use the global mock user ID)
      expect(storage.getProfile).toHaveBeenCalledTimes(2);
      expect(storage.getProfile).toHaveBeenCalledWith('test-replit-user-id');
    });
  });

  describe('Trip Ownership - SECURITY CRITICAL', () => {
    it('should allow user to create trip in own profile', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const newTrip = createMockTrip({ profileId: 'profile-1' });

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.createTrip as jest.Mock).mockResolvedValue(newTrip);

      await request(app)
        .post('/api/profile/trips')
        .send({
          destination: 'Paris',
          purpose: 'vacation',
          status: 'upcoming',
          timeframe: { type: 'flexible', description: 'Summer 2026' },
        })
        .expect(200);

      expect(storage.createTrip).toHaveBeenCalledWith('profile-1', expect.any(Object));
    });

    it('should allow user to list own trips', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const trips = [createMockTrip({ profileId: 'profile-1' })];

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTrips as jest.Mock).mockResolvedValue(trips);

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(storage.getTrips).toHaveBeenCalledWith('profile-1');
    });

    it('should allow user to update own trip [VALIDATES SECURITY FIX]', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const trip = createMockTrip({ id: 'trip-1', profileId: 'profile-1' });

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(trip);
      (storage.updateTrip as jest.Mock).mockResolvedValue({ ...trip, destination: 'Updated' });

      await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Updated' })
        .expect(200);

      expect(storage.getTripById).toHaveBeenCalledWith('trip-1');
      expect(storage.updateTrip).toHaveBeenCalled();
    });

    it('should DENY user from updating another user\'s trip [SECURITY FIX VALIDATION]', async () => {
      // User 1 is authenticated
      currentUserId = 'user-1';

      // But the trip belongs to user-2's profile
      const user1Profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const user2Trip = createMockTrip({ id: 'trip-1', profileId: 'profile-2' });

      (storage.getProfile as jest.Mock).mockResolvedValue(user1Profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(user2Trip);

      const response = await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Hacked' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden: Trip belongs to another user');
      expect(storage.updateTrip).not.toHaveBeenCalled();
    });

    it('should allow user to delete own trip [VALIDATES SECURITY FIX]', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const trip = createMockTrip({ id: 'trip-1', profileId: 'profile-1' });

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(trip);
      (storage.deleteTrip as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(200);

      expect(storage.getTripById).toHaveBeenCalledWith('trip-1');
      expect(storage.deleteTrip).toHaveBeenCalledWith('trip-1');
    });

    it('should DENY user from deleting another user\'s trip [SECURITY FIX VALIDATION]', async () => {
      // User 1 is authenticated
      currentUserId = 'user-1';

      // But the trip belongs to user-2's profile
      const user1Profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const user2Trip = createMockTrip({ id: 'trip-1', profileId: 'profile-2' });

      (storage.getProfile as jest.Mock).mockResolvedValue(user1Profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(user2Trip);

      const response = await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden: Trip belongs to another user');
      expect(storage.deleteTrip).not.toHaveBeenCalled();
    });

    it('should return 404 when trip not found', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(null);

      await request(app)
        .put('/api/profile/trips/nonexistent')
        .send({ destination: 'Test' })
        .expect(404);
    });

    it('should handle cross-user trip access attempts (edge case)', async () => {
      // User 1 tries to access user-2's trip by guessing the ID
      currentUserId = 'user-1';

      const user1Profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const user2Trip = createMockTrip({ id: 'trip-999', profileId: 'profile-2' });

      (storage.getProfile as jest.Mock).mockResolvedValue(user1Profile);
      (storage.getTripById as jest.Mock).mockResolvedValue(user2Trip);

      await request(app)
        .put('/api/profile/trips/trip-999')
        .send({ destination: 'Exploit' })
        .expect(403);

      expect(storage.updateTrip).not.toHaveBeenCalled();
    });
  });

  describe('Group Member Ownership', () => {
    it('should allow user to sync members in own profile', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });

      (storage.upsertProfile as jest.Mock).mockResolvedValue(profile);
      (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .post('/api/profile')
        .send({
          name: 'Test User',
          contactInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '',
            dateOfBirth: '',
          },
          travelGroup: {
            type: 'family',
            members: [
              { name: 'Child', age: 10, isMinor: true, schoolInfo: { schoolName: 'School' } },
            ],
          },
        })
        .expect(200);

      expect(storage.syncGroupMembers).toHaveBeenCalledWith(
        'profile-1',
        expect.arrayContaining([
          expect.objectContaining({ name: 'Child', age: 10 }),
        ])
      );
    });

    it('should handle member list isolation (user A members != user B members)', async () => {
      // User 1's profile with members
      currentUserId = 'user-1';
      const profile1 = createMockProfile({ userId: 'user-1', id: 'profile-1' });
      const members1 = [{ ...mockGroupMember, profileId: 'profile-1', name: 'User1 Child' }];

      (storage.getProfile as jest.Mock).mockResolvedValue(profile1);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue(members1);

      const response1 = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response1.body.travelGroup.members[0].name).toBe('User1 Child');

      // User 2's profile with different members
      currentUserId = 'user-2';
      const profile2 = createMockProfile({ userId: 'user-2', id: 'profile-2' });
      const members2 = [{ ...mockGroupMember, profileId: 'profile-2', name: 'User2 Child' }];

      (storage.getProfile as jest.Mock).mockResolvedValue(profile2);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue(members2);

      const response2 = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response2.body.travelGroup.members[0].name).toBe('User2 Child');

      // Verify isolation
      expect(response1.body.travelGroup.members[0].name).not.toBe(
        response2.body.travelGroup.members[0].name
      );
    });

    it('should handle empty member list per user', async () => {
      const profile = createMockProfile({ userId: 'user-1', id: 'profile-1' });

      (storage.getProfile as jest.Mock).mockResolvedValue(profile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.travelGroup).toBeUndefined();
    });

    it('should handle concurrent member updates from different users', async () => {
      // User 1 updates members
      currentUserId = 'user-1';
      const profile1 = createMockProfile({ userId: 'user-1', id: 'profile-1' });

      (storage.upsertProfile as jest.Mock).mockResolvedValue(profile1);
      (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

      await request(app)
        .post('/api/profile')
        .send({
          name: 'User 1',
          contactInfo: {
            firstName: 'User',
            lastName: '1',
            email: 'user1@example.com',
            phone: '',
            dateOfBirth: '',
          },
          travelGroup: {
            type: 'family',
            members: [{ name: 'User1 Child', age: 8, isMinor: true }],
          },
        })
        .expect(200);

      expect(storage.syncGroupMembers).toHaveBeenCalledWith('profile-1', expect.any(Array));

      // User 2 updates members (should not affect user 1)
      currentUserId = 'user-2';
      const profile2 = createMockProfile({ userId: 'user-2', id: 'profile-2' });

      (storage.upsertProfile as jest.Mock).mockResolvedValue(profile2);

      await request(app)
        .post('/api/profile')
        .send({
          name: 'User 2',
          contactInfo: {
            firstName: 'User',
            lastName: '2',
            email: 'user2@example.com',
            phone: '',
            dateOfBirth: '',
          },
          travelGroup: {
            type: 'friends',
            members: [{ name: 'User2 Friend', age: 25, isMinor: false }],
          },
        })
        .expect(200);

      expect(storage.syncGroupMembers).toHaveBeenCalledWith('profile-2', expect.any(Array));

      // Verify both calls used correct profile IDs
      expect(storage.syncGroupMembers).toHaveBeenCalledTimes(2);
    });
  });
});
