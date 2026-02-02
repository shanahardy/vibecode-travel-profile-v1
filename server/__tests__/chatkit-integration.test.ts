/**
 * ChatKit Integration Tests
 * Tests AI chat session creation and health checks
 */

import request from 'supertest';
import express from 'express';
import { storage } from '../storage';
import { registerChatKitRoutes } from '../routes/chatKitRoutes';
import { createMockProfile } from './setup/mocks';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock current user ID
let currentUserId = 'test-replit-user-id';

// Mock isAuthenticated
jest.mock('../replit_integrations/auth/replitAuth', () => ({
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = {
      claims: {
        sub: currentUserId,
        email: 'test@example.com',
      },
    };
    req.isAuthenticated = () => true;
    next();
  }),
}));

describe('ChatKit Integration', () => {
  const originalEnv = process.env;

  beforeAll(async () => {
    await registerChatKitRoutes(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentUserId = 'test-replit-user-id';
    process.env = { ...originalEnv };
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.OPENAI_CHATKIT_WORKFLOW_ID = 'workflow-123';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/chatkit/session', () => {
    it('should successfully create session with valid auth', async () => {
      (storage.getUserById as jest.Mock).mockResolvedValue({ id: currentUserId, email: 'test@example.com' });

      // Mock fetch for OpenAI API
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            client_secret: 'client-token-123',
            expires_at: Date.now() + 3600000,
          }),
        })
      ) as jest.Mock;

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(200);

      expect(response.body).toHaveProperty('clientToken');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('sessionId');
    });

    it('should pass user ID to ChatKit API', async () => {
      (storage.getUserById as jest.Mock).mockResolvedValue({ id: currentUserId, email: 'test@example.com' });

      const fetchSpy = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            client_secret: 'token',
            expires_at: Date.now() + 3600000,
          }),
        })
      ) as jest.Mock;
      global.fetch = fetchSpy;

      await request(app)
        .post('/api/chatkit/session')
        .expect(200);

      // Verify fetch was called with user ID and workflow
      expect(fetchSpy).toHaveBeenCalled();
      const fetchCall = fetchSpy.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.user).toBe(currentUserId);
      expect(requestBody.workflow.id).toBe('workflow-123');
    });

    it('should return client token and expiry', async () => {
      (storage.getUserById as jest.Mock).mockResolvedValue({ id: currentUserId, email: 'test@example.com' });

      const expiryTime = Date.now() + 3600000;
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            client_secret: 'secret-abc-123',
            expires_at: expiryTime,
          }),
        })
      ) as jest.Mock;

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(200);

      expect(response.body.clientToken).toBe('secret-abc-123');
      expect(response.body.expiresAt).toBe(expiryTime);
    });

    it('should handle missing OpenAI API key gracefully', async () => {
      delete process.env.OPENAI_API_KEY;

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('OPENAI_API_KEY');
    });

    it('should handle missing workflow ID', async () => {
      delete process.env.OPENAI_CHATKIT_WORKFLOW_ID;

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('OPENAI_CHATKIT_WORKFLOW_ID');
    });

    it('should require authentication', async () => {
      // Override isAuthenticated mock for this test
      const { isAuthenticated } = require('../replit_integrations/auth/replitAuth');
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .post('/api/chatkit/session')
        .expect(401);
    });

    it('should handle database errors', async () => {
      (storage.getUserById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle OpenAI API errors', async () => {
      (storage.getUserById as jest.Mock).mockResolvedValue({ id: currentUserId });

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
        })
      ) as jest.Mock;

      const response = await request(app)
        .post('/api/chatkit/session')
        .expect(429);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/chatkit/status', () => {
    it('should return ready when fully configured', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_CHATKIT_WORKFLOW_ID = 'workflow-123';

      const response = await request(app)
        .get('/api/chatkit/status')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.message).toContain('ready');
    });

    it('should return not_configured when API key missing', async () => {
      delete process.env.OPENAI_API_KEY;
      process.env.OPENAI_CHATKIT_WORKFLOW_ID = 'workflow-123';

      const response = await request(app)
        .get('/api/chatkit/status')
        .expect(200);

      expect(response.body.status).toBe('not_configured');
      expect(response.body.message).toContain('OpenAI API key');
    });

    it('should return not_configured when workflow ID missing', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      delete process.env.OPENAI_CHATKIT_WORKFLOW_ID;

      const response = await request(app)
        .get('/api/chatkit/status')
        .expect(200);

      expect(response.body.status).toBe('not_configured');
      expect(response.body.message).toContain('workflow');
    });

    it('should require authentication', async () => {
      // Status endpoint requires authentication
      const { isAuthenticated } = require('../replit_integrations/auth/replitAuth');
      (isAuthenticated as jest.Mock).mockImplementationOnce((req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' });
      });

      await request(app)
        .get('/api/chatkit/status')
        .expect(401);
    });

    it('should return correct status structure', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.OPENAI_CHATKIT_WORKFLOW_ID = 'workflow-123';

      const response = await request(app)
        .get('/api/chatkit/status')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      expect(['ready', 'not_configured']).toContain(response.body.status);
      expect(typeof response.body.message).toBe('string');
    });
  });
});
