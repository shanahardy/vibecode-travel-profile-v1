/**
 * Trip Management Tests
 * Tests trip CRUD operations including the critical ownership security fix
 */

import request from 'supertest';
import express from 'express';
import { storage } from '../storage';
import { registerProfileRoutes } from '../routes/profileRoutes';
import {
  mockTravelProfile,
  mockTrip,
  mockPastTrip,
  createMockProfile,
  createMockTrip,
} from './setup/mocks';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication
let mockUserId = 'test-replit-user-id';
jest.mock('../middleware/auth', () => ({
  getUserId: jest.fn(() => mockUserId),
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = { claims: { sub: mockUserId } };
    next();
  }),
}));

describe('Trip Management', () => {
  beforeAll(async () => {
    await registerProfileRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserId = 'test-replit-user-id';
  });

  describe('GET /api/profile/trips', () => {
    it('should list all trips for user profile', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([mockTrip, mockPastTrip]);

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].destination).toBe('Paris, France');
      expect(response.body[1].destination).toBe('Tokyo, Japan');
      expect(storage.getProfile).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should return 404 when profile does not exist', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should return empty array when no trips', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTrips as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.getProfile as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/profile/trips')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch trips');
    });
  });

  describe('POST /api/profile/trips', () => {
    it('should create new trip with required fields', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.createTrip as jest.Mock).mockResolvedValue(mockTrip);

      const tripData = {
        destination: 'Barcelona, Spain',
        purpose: 'vacation',
        status: 'upcoming',
        timeframe: { type: 'flexible', description: 'Summer 2026' },
        notes: 'Beach vacation',
      };

      const response = await request(app)
        .post('/api/profile/trips')
        .send(tripData)
        .expect(200);

      expect(response.body.destination).toBe('Paris, France');
      expect(storage.createTrip).toHaveBeenCalledWith('profile-1', tripData);
    });

    it('should return 404 when profile does not exist', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/profile/trips')
        .send({ destination: 'Test', purpose: 'vacation' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should set correct status for upcoming trips', async () => {
      const upcomingTrip = createMockTrip({ status: 'upcoming' });
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.createTrip as jest.Mock).mockResolvedValue(upcomingTrip);

      const response = await request(app)
        .post('/api/profile/trips')
        .send({
          destination: 'Paris',
          purpose: 'vacation',
          status: 'upcoming',
          timeframe: { type: 'flexible', description: 'Spring 2026' },
        })
        .expect(200);

      expect(response.body.status).toBe('upcoming');
    });

    it('should handle JSONB timeframe field', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.createTrip as jest.Mock).mockResolvedValue(mockTrip);

      const timeframe = {
        type: 'specific',
        description: 'June 15-22, 2026',
        startDate: '2026-06-15',
        endDate: '2026-06-22',
      };

      await request(app)
        .post('/api/profile/trips')
        .send({
          destination: 'Paris',
          purpose: 'vacation',
          timeframe,
        })
        .expect(200);

      expect(storage.createTrip).toHaveBeenCalledWith(
        'profile-1',
        expect.objectContaining({ timeframe })
      );
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .post('/api/profile/trips')
        .send({ destination: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.createTrip as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/profile/trips')
        .send({ destination: 'Test', purpose: 'vacation' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create trip');
    });
  });

  describe('PUT /api/profile/trips/:id - WITH SECURITY FIX', () => {
    it('should update trip after verifying ownership', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(mockTrip);
      (storage.updateTrip as jest.Mock).mockResolvedValue({
        ...mockTrip,
        destination: 'Nice, France',
      });

      const response = await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Nice, France' })
        .expect(200);

      expect(response.body.destination).toBe('Nice, France');
      expect(storage.getTripById).toHaveBeenCalledWith('trip-1');
      expect(storage.updateTrip).toHaveBeenCalledWith('trip-1', { destination: 'Nice, France' });
    });

    it('should return 404 when profile not found', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should return 404 when trip not found', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/profile/trips/non-existent-trip')
        .send({ destination: 'Test' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Trip not found');
    });

    it('should return 403 when trip belongs to different user (SECURITY FIX)', async () => {
      const otherUserProfile = createMockProfile({ id: 'profile-2', userId: 'other-user-id' });
      const otherUserTrip = createMockTrip({ id: 'trip-999', profileId: 'profile-2' });

      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile); // User's profile (profile-1)
      (storage.getTripById as jest.Mock).mockResolvedValue(otherUserTrip); // Trip belongs to profile-2

      const response = await request(app)
        .put('/api/profile/trips/trip-999')
        .send({ destination: 'Hacked Destination' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden: Trip belongs to another user');
      expect(storage.updateTrip).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(mockTrip);
      (storage.updateTrip as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/profile/trips/trip-1')
        .send({ destination: 'Test' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to update trip');
    });
  });

  describe('DELETE /api/profile/trips/:id - WITH SECURITY FIX', () => {
    it('should delete trip after verifying ownership', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(mockTrip);
      (storage.deleteTrip as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(storage.getTripById).toHaveBeenCalledWith('trip-1');
      expect(storage.deleteTrip).toHaveBeenCalledWith('trip-1');
    });

    it('should return 404 when profile not found', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should return 404 when trip not found', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/profile/trips/non-existent-trip')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Trip not found');
    });

    it('should return 403 when trip belongs to different user (SECURITY FIX)', async () => {
      const otherUserProfile = createMockProfile({ id: 'profile-2', userId: 'other-user-id' });
      const otherUserTrip = createMockTrip({ id: 'trip-999', profileId: 'profile-2' });

      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile); // User's profile (profile-1)
      (storage.getTripById as jest.Mock).mockResolvedValue(otherUserTrip); // Trip belongs to profile-2

      const response = await request(app)
        .delete('/api/profile/trips/trip-999')
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Forbidden: Trip belongs to another user');
      expect(storage.deleteTrip).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      mockUserId = '';

      const response = await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle database errors', async () => {
      (storage.getProfile as jest.Mock).mockResolvedValue(mockTravelProfile);
      (storage.getTripById as jest.Mock).mockResolvedValue(mockTrip);
      (storage.deleteTrip as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/profile/trips/trip-1')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to delete trip');
    });
  });
});
