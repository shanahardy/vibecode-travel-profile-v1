/**
 * Profile Workflow Tests
 * Tests the complete profile management workflow including trips and travel group
 */

import request from 'supertest';
import express from 'express';
import { storage } from '../storage';
import { registerProfileRoutes } from '../routes/profileRoutes';
import {
  mockTravelProfile,
  mockTrip,
  mockPastTrip,
  mockGroupMember,
  mockAdultGroupMember,
  createMockProfile,
  createMockTrip,
} from './setup/mocks';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication - will be set before each test
let mockUserId = 'test-replit-user-id';
jest.mock('../middleware/auth', () => ({
  getUserId: jest.fn(() => mockUserId),
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = { claims: { sub: mockUserId } };
    next();
  }),
}));

describe('Profile Workflow', () => {
  beforeAll(async () => {
    await registerProfileRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'test-replit-user-id';
  });

  describe('GET /api/profile', () => {
    it('should successfully fetch profile with related data', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([mockTrip, mockPastTrip]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([mockGroupMember, mockAdultGroupMember]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'profile-1');
      expect(response.body).toHaveProperty('name', 'Test Traveler');
      expect(response.body).toHaveProperty('upcomingTrips');
      expect(response.body).toHaveProperty('pastTrips');
      expect(response.body).toHaveProperty('travelGroup');
      expect(storage.getProfile).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should return 404 when profile does not exist', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/profile')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should correctly separate upcoming vs past trips', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([mockTrip, mockPastTrip]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.upcomingTrips).toHaveLength(1);
      expect(response.body.pastTrips).toHaveLength(1);
      expect(response.body.upcomingTrips[0].destination).toBe('Paris, France');
      expect(response.body.pastTrips[0].destination).toBe('Tokyo, Japan');
    });

    it('should transform trips to match client store format', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([mockTrip]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      const upcomingTrip = response.body.upcomingTrips[0];
      expect(upcomingTrip).toHaveProperty('destination');
      expect(upcomingTrip).toHaveProperty('purpose');
      expect(upcomingTrip).toHaveProperty('timeframe');
      expect(upcomingTrip).toHaveProperty('notes');
      expect(upcomingTrip).not.toHaveProperty('id');
      expect(upcomingTrip).not.toHaveProperty('profileId');
    });

    it('should include travel group with members', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([mockGroupMember, mockAdultGroupMember]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.travelGroup).toBeDefined();
      expect(response.body.travelGroup.type).toBe('family');
      expect(response.body.travelGroup.members).toHaveLength(2);
      expect(response.body.travelGroup.members[0].name).toBe('Child Name');
      expect(response.body.travelGroup.members[1].name).toBe('Adult Name');
    });

    it('should handle empty trips and members', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.getGroupMembers as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile')
        .expect(200);

      expect(response.body.upcomingTrips).toEqual([]);
      expect(response.body.pastTrips).toEqual([]);
      expect(response.body.travelGroup).toBeUndefined();
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .get('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.getProfile as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/profile')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch profile');
    });
  });

  describe('POST /api/profile', () => {
    it('should create new profile with nested data', async () => {
      (storage.upsertProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.deleteTrip as jest.Mock).mockResolvedValue(undefined);
      (storage.createTrip as jest.Mock).mockResolvedValue(mockTrip);
      (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

      const profileData = {
        name: 'Test Traveler',
        contactInfo: mockTravelProfile.contactInfo,
        location: mockTravelProfile.location,
        budgetPreferences: mockTravelProfile.budgetPreferences,
        upcomingTrips: [{
          destination: 'Paris, France',
          purpose: 'vacation',
          timeframe: { type: 'flexible', description: 'Spring 2026' },
          notes: 'First trip',
        }],
        travelGroup: {
          type: 'family',
          members: [
            { name: 'Child', age: 10, isMinor: true, schoolInfo: { schoolName: 'Elementary' } },
          ],
        },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(storage.upsertProfile).toHaveBeenCalled();
      expect(storage.syncGroupMembers).toHaveBeenCalled();
      expect(storage.createTrip).toHaveBeenCalled();
    });

    it('should reject demo data protection', async () => {
      const demoData = {
        name: 'Alex Johnson',
        contactInfo: { email: 'alex.johnson@example.com' },
      };

      const response = await request(app)
        .post('/api/profile')
        .send(demoData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot save demo profile data');
    });

    it('should sync travel group members atomically', async () => {
      (storage.upsertProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.syncGroupMembers as jest.Mock).mockResolvedValue(undefined);

      const profileData = {
        name: 'Test',
        travelGroup: {
          type: 'family',
          members: [
            { name: 'Member 1', age: 30, isMinor: false },
            { name: 'Member 2', age: 8, isMinor: true, schoolInfo: { schoolName: 'Elementary' } },
          ],
        },
      };

      await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(200);

      expect(storage.syncGroupMembers).toHaveBeenCalledWith(
        'profile-1',
        expect.arrayContaining([
          expect.objectContaining({ name: 'Member 1', sequence: 0 }),
          expect.objectContaining({ name: 'Member 2', sequence: 1 }),
        ])
      );
    });

    it('should sync trips (delete + recreate pattern)', async () => {
      const existingTrip = createMockTrip({ id: 'old-trip-1' });
      (storage.upsertProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([existingTrip]);
      (storage.deleteTrip as jest.Mock).mockResolvedValue(undefined);
      (storage.createTrip as jest.Mock).mockResolvedValue(mockTrip);

      const profileData = {
        name: 'Test',
        upcomingTrips: [
          { destination: 'New Destination', purpose: 'vacation', timeframe: {}, notes: '' },
        ],
      };

      await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(200);

      expect(storage.deleteTrip).toHaveBeenCalledWith('old-trip-1');
      expect(storage.createTrip).toHaveBeenCalled();
    });

    it('should create past trips with pastTripDate and arrays', async () => {
      (storage.upsertProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);
      (storage.createTrip as jest.Mock).mockResolvedValue(mockPastTrip);

      const profileData = {
        name: 'Test',
        pastTrips: [{
          destination: 'Tokyo, Japan',
          date: 'March 2025',
          summary: 'Great trip',
          likes: ['Sushi', 'Culture'],
          dislikes: ['Crowds'],
          specialNeeds: ['Vegetarian options'],
        }],
      };

      await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(200);

      expect(storage.createTrip).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({
          status: 'past',
          pastTripDate: 'March 2025',
          likes: ['Sushi', 'Culture'],
          dislikes: ['Crowds'],
          specialNeeds: ['Vegetarian options'],
        })
      );
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .post('/api/profile')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.upsertProfile as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/profile')
        .send({ name: 'Test' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to save profile');
    });
  });

  describe('DELETE /api/profile', () => {
    it('should successfully delete profile', async () => {
      (storage.deleteProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/profile')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(storage.deleteProfile).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .delete('/api/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.deleteProfile as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/profile')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to delete profile');
    });
  });
});
