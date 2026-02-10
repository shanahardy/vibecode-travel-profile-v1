/**
 * Jest Setup File
 * Runs before Jest framework initializes
 * Use for environment variables and module-level mocks
 */

// Set test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-only';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_webhook_secret';
process.env.STRIPE_PRICE_ID_PRO = 'price_test_mock_price_id';
process.env.SENDGRID_API_KEY = 'SG.test_api_key_for_testing';
process.env.SENDGRID_FROM = 'test@example.com';
process.env.POSTHOG_API_KEY = 'test_posthog_api_key';
process.env.POSTHOG_HOST = 'https://app.posthog.com';
process.env.OPENAI_API_KEY = 'sk-test-openai-key';
process.env.NODE_ENV = 'test';

// Mock the database module
jest.mock('./server/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([])),
      })),
    })),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve([{ id: 1 }])),
      })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => Promise.resolve([])),
    })),
  },
}));

// Mock pg (node-postgres)
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(() => Promise.resolve({ rows: [] })),
    connect: jest.fn(() => Promise.resolve({
      query: jest.fn(() => Promise.resolve({ rows: [] })),
      release: jest.fn(),
    })),
    end: jest.fn(() => Promise.resolve()),
  })),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(() =>
        Promise.resolve({
          id: 'cus_test123',
          email: 'test@example.com',
        })
      ),
      retrieve: jest.fn(() =>
        Promise.resolve({
          id: 'cus_test123',
          email: 'test@example.com',
        })
      ),
    },
    checkout: {
      sessions: {
        create: jest.fn(() =>
          Promise.resolve({
            id: 'cs_test123',
            url: 'https://checkout.stripe.com/test',
          })
        ),
        retrieve: jest.fn(() =>
          Promise.resolve({
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: { userId: '1' },
          })
        ),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(() =>
          Promise.resolve({
            url: 'https://billing.stripe.com/test',
          })
        ),
      },
    },
    subscriptions: {
      retrieve: jest.fn(() =>
        Promise.resolve({
          id: 'sub_test123',
          status: 'active',
        })
      ),
    },
    webhooks: {
      constructEvent: jest.fn((payload, sig, secret) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            metadata: { userId: '1' },
          },
        },
      })),
    },
  }));
});

// Mock SendGrid
jest.mock('@sendgrid/mail', () => {
  const mockSend = jest.fn(() => Promise.resolve([{ statusCode: 202 }]));
  return {
    MailService: jest.fn().mockImplementation(() => ({
      setApiKey: jest.fn(),
      send: mockSend,
    })),
    setApiKey: jest.fn(),
    send: mockSend,
  };
});

// Mock PostHog
jest.mock('posthog-node', () => {
  return {
    PostHog: jest.fn().mockImplementation(() => ({
      capture: jest.fn(),
      shutdown: jest.fn(() => Promise.resolve()),
    })),
  };
});

// Mock authentication middleware
jest.mock('./server/middleware/auth', () => ({
  requireAuth: jest.fn((req, res, next) => {
    req.user = {
      claims: {
        sub: 'test-replit-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        profile_image_url: 'https://example.com/avatar.png',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    req.isAuthenticated = () => true;
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => {
    req.isAuthenticated = () => false;
    next();
  }),
  getUserId: jest.fn(() => 'test-replit-user-id'),
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = {
      claims: {
        sub: 'test-replit-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        profile_image_url: 'https://example.com/avatar.png',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    req.isAuthenticated = () => true;
    next();
  }),
}));

// Mock Replit auth integration
jest.mock('./server/replit_integrations/auth/storage', () => ({
  authStorage: {
    getUser: jest.fn(() =>
      Promise.resolve({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      })
    ),
    upsertUser: jest.fn(() =>
      Promise.resolve({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      })
    ),
    updateUser: jest.fn(() => Promise.resolve({
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    })),
  },
}));

// Mock Replit auth middleware
jest.mock('./server/replit_integrations/auth/replitAuth', () => ({
  setupAuth: jest.fn(() => Promise.resolve()),
  isAuthenticated: jest.fn((req, res, next) => {
    req.user = {
      claims: {
        sub: 'test-replit-user-id',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        profile_image_url: 'https://example.com/avatar.png',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };
    req.isAuthenticated = () => true;
    next();
  }),
  getSession: jest.fn(() => (req, res, next) => {
    req.session = {
      save: jest.fn((cb) => cb()),
      destroy: jest.fn((cb) => cb()),
    };
    next();
  }),
}));

// Mock storage module with travel-specific methods
jest.mock('./server/storage', () => ({
  storage: {
    // User methods
    getUserById: jest.fn(),
    updateUser: jest.fn(),

    // Profile methods
    getProfile: jest.fn(),
    upsertProfile: jest.fn(),
    deleteProfile: jest.fn(),

    // Trip methods
    getTrips: jest.fn(),
    getTripById: jest.fn(),
    createTrip: jest.fn(),
    updateTrip: jest.fn(),
    deleteTrip: jest.fn(),

    // Group member methods
    syncGroupMembers: jest.fn(),
    getGroupMembers: jest.fn(),
  },
}));

// Mock ws (WebSocket)
jest.mock('ws', () => {
  return {
    WebSocketServer: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  };
});

// Mock openid-client
jest.mock('openid-client', () => ({
  discovery: jest.fn(() => Promise.resolve({
    issuer: 'https://replit.com/oidc',
    authorization_endpoint: 'https://replit.com/oidc/authorize',
    token_endpoint: 'https://replit.com/oidc/token',
    userinfo_endpoint: 'https://replit.com/oidc/userinfo',
    end_session_endpoint: 'https://replit.com/oidc/logout',
  })),
  refreshTokenGrant: jest.fn(() => Promise.resolve({
    access_token: 'new_access_token',
    refresh_token: 'new_refresh_token',
    claims: () => ({
      sub: 'test-replit-user-id',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  })),
  buildEndSessionUrl: jest.fn(() => new URL('https://replit.com/oidc/logout')),
}));

// Mock openid-client/passport
jest.mock('openid-client/passport', () => ({
  Strategy: jest.fn().mockImplementation(() => ({
    authenticate: jest.fn(),
  })),
}));

// Mock passport
jest.mock('passport', () => ({
  use: jest.fn(),
  initialize: jest.fn(() => (req, res, next) => next()),
  session: jest.fn(() => (req, res, next) => next()),
  authenticate: jest.fn(() => (req, res, next) => next()),
  serializeUser: jest.fn(),
  deserializeUser: jest.fn(),
}));

// Mock express-session
jest.mock('express-session', () => {
  return jest.fn(() => (req, res, next) => {
    req.session = {
      save: jest.fn((cb) => cb()),
      destroy: jest.fn((cb) => cb()),
    };
    next();
  });
});

// Mock connect-pg-simple
jest.mock('connect-pg-simple', () => {
  return jest.fn(() => {
    return jest.fn().mockImplementation(() => ({}));
  });
});

// Mock HTML5 Audio API
global.Audio = jest.fn().mockImplementation((src) => {
  return {
    src,
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(),
    load: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    currentTime: 0,
    duration: 0,
    paused: true,
    volume: 1,
  };
});
