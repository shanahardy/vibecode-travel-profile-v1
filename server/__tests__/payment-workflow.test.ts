/**
 * Payment Workflow Tests
 * Tests Stripe checkout sessions, webhooks, and billing portal
 */

import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import { requireAuth } from '../middleware/auth';
import { authStorage } from '../replit_integrations/auth/storage';

// Create a minimal test app
const app = express();
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Mock Stripe instance
const mockStripe = new Stripe('sk_test_mock');

// Test routes for checkout
app.post('/api/create-checkout-session', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await authStorage.getUser(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const priceId = req.body.priceId || process.env.STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return res.status(400).json({ error: 'Price ID not configured' });
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await mockStripe.customers.create({
        email: user.email || undefined,
      });
      customerId = customer.id;
      await authStorage.updateUser(userId, { stripeCustomerId: customerId });
    }

    // Create checkout session
    const session = await mockStripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/account?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/account?canceled=true`,
      metadata: { userId },
    } as any);

    res.json({ url: session.url });
  } catch (error: any) {
    if (error.type === 'StripeError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Test route for billing portal
app.post('/api/create-portal-session', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    const user = await authStorage.getUser(userId);

    if (!user?.stripeCustomerId) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    const session = await mockStripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:5000/',
    });

    res.json({ url: session.url });
  } catch (error: any) {
    if (error.type === 'StripeError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

describe('Payment Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/create-checkout-session', () => {
    it('should create checkout session for new user without Stripe customer', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: null,
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (authStorage.updateUser as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send({ priceId: 'price_test123' })
        .expect(200);

      expect(response.body.url).toBe('https://checkout.stripe.com/test');
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(authStorage.updateUser).toHaveBeenCalledWith('test-replit-user-id', {
        stripeCustomerId: 'cus_test123',
      });
    });

    it('should create checkout session for existing Stripe customer', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_existing',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send({ priceId: 'price_test123' })
        .expect(200);

      expect(response.body.url).toBe('https://checkout.stripe.com/test');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should use default price ID from environment', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      process.env.STRIPE_PRICE_ID_PRO = 'price_default';

      const response = await request(app)
        .post('/api/create-checkout-session')
        .send({})
        .expect(200);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      (authStorage.getUser as jest.Mock).mockResolvedValue(null);

      await request(app)
        .post('/api/create-checkout-session')
        .send({ priceId: 'price_test' })
        .expect(404);
    });

    it('should return 400 when price ID is not configured', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      delete process.env.STRIPE_PRICE_ID_PRO;

      await request(app)
        .post('/api/create-checkout-session')
        .send({})
        .expect(400);
    });

    it('should handle Stripe API errors', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Card declined'), { type: 'StripeError' })
      );

      await request(app)
        .post('/api/create-checkout-session')
        .send({ priceId: 'price_test' })
        .expect(400);
    });
  });

  describe('POST /api/create-portal-session', () => {
    it('should create portal session for user with Stripe customer', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test123',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/create-portal-session')
        .send({})
        .expect(200);

      expect(response.body.url).toBe('https://billing.stripe.com/test');
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        return_url: 'http://localhost:5000/',
      });
    });

    it('should use FRONTEND_URL when configured', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      process.env.FRONTEND_URL = 'https://myapp.com';

      await request(app)
        .post('/api/create-portal-session')
        .send({})
        .expect(200);

      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_test',
        return_url: 'https://myapp.com',
      });
    });

    it('should return 404 for user without Stripe customer', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: null,
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);

      await request(app)
        .post('/api/create-portal-session')
        .send({})
        .expect(404);
    });

    it('should handle Stripe errors', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.billingPortal.sessions.create as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Invalid customer'), { type: 'StripeError' })
      );

      await request(app)
        .post('/api/create-portal-session')
        .send({})
        .expect(400);
    });

    it('should handle unexpected errors', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        stripeCustomerId: 'cus_test',
      };

      (authStorage.getUser as jest.Mock).mockResolvedValue(mockUser);
      (mockStripe.billingPortal.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const response = await request(app)
        .post('/api/create-portal-session')
        .send({})
        .expect(500);

      expect(response.body.error).toBe('Failed to create portal session');
    });
  });
});
