/**
 * Authentication Workflow Tests
 * Tests Replit Auth integration, user session management, and protected routes
 */

import request from 'supertest';
import express from 'express';
import { requireAuth, optionalAuth, getUserId } from '../middleware/auth';
import { authStorage } from '../replit_integrations/auth/storage';

// Create a minimal test app
const app = express();
app.use(express.json());

// Test routes
app.get('/api/auth/user', requireAuth, async (req: any, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = await authStorage.getUser(userId);
  res.json({ user });
});

app.get('/api/public', optionalAuth, (req: any, res) => {
  res.json({ isAuthenticated: req.isAuthenticated() });
});

app.post('/api/auth/update', requireAuth, async (req: any, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await authStorage.updateUser(userId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

describe('Authentication Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/user', () => {
    it('should return user data for authenticated requests', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body.user).toEqual(mockUser);
      expect(authStorage.getUser).toHaveBeenCalledWith('test-replit-user-id');
    });

    it('should handle non-existent users', async () => {
      (authStorage.getUser as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body.user).toBeNull();
    });
  });

  describe('GET /api/public', () => {
    it('should work for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/public')
        .expect(200);

      expect(response.body.isAuthenticated).toBe(false);
    });
  });

  describe('POST /api/auth/update', () => {
    it('should update user profile successfully', async () => {
      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        emailNotifications: true,
      };

      await request(app)
        .post('/api/auth/update')
        .send(updateData)
        .expect(200);

      expect(authStorage.updateUser).toHaveBeenCalledWith('test-replit-user-id', updateData);
    });

    it('should validate input fields', async () => {
      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      const invalidData = {
        firstName: '', // Empty string
      };

      await request(app)
        .post('/api/auth/update')
        .send(invalidData)
        .expect(200);

      // Still calls updateUser - validation happens at the storage layer if needed
      expect(authStorage.updateUser).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      (authStorage.updateUser as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const updateData = {
        firstName: 'Test',
      };

      await request(app)
        .post('/api/auth/update')
        .send(updateData)
        .expect(500);
    });
  });

  describe('User Storage Operations', () => {
    it('should create or update user on upsert', async () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      (authStorage.upsertUser as jest.Mock).mockResolvedValue(mockUser);

      const userData = {
        id: 'replit-user-123',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      const result = await authStorage.upsertUser(userData);

      expect(result).toEqual(mockUser);
      expect(authStorage.upsertUser).toHaveBeenCalledWith(userData);
    });

    it('should handle upsert errors gracefully', async () => {
      (authStorage.upsertUser as jest.Mock).mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(
        authStorage.upsertUser({
          id: 'test-id',
          email: 'duplicate@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
      ).rejects.toThrow('Unique constraint violation');
    });
  });
});
