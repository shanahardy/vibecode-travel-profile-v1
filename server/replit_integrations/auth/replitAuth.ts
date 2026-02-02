import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { authStorage } from "./storage";
import { storage } from "../../storage";
import './types';

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error(
      '❌ SESSION_SECRET environment variable is required for authentication.\n' +
      'Please set it in your Replit Secrets or .env file.\n' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

async function updateUserSession(
  req: any,
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
): Promise<void> {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;

  // Persist to session store
  return new Promise<void>((resolve, reject) => {
    req.session.save((err: any) => {
      if (err) {
        console.error('Failed to save session after token refresh:', err);
        reject(err);
      } else {
        console.log('Session saved successfully');
        resolve();
      }
    });
  });
}

async function upsertUser(claims: any) {
  const userId = claims["sub"];

  // Upsert user record
  await authStorage.upsertUser({
    id: userId,
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });

  // Auto-create travel profile if it doesn't exist
  const existingProfile = await storage.getProfile(userId);
  if (!existingProfile) {
    const firstName = claims["first_name"] || '';
    const lastName = claims["last_name"] || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Traveler';

    await storage.upsertProfile(userId, {
      name: fullName,
      contactInfo: {
        firstName: claims["first_name"] || '',
        lastName: claims["last_name"] || '',
        email: claims["email"] || '',
        phone: '',
        dateOfBirth: '',
      },
      budget: null,
      travelStyle: null,
    });
    console.log(`✓ Auto-created travel profile for user ${userId}`);
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const claims = tokens.claims();
    const user: Express.User = {
      claims: claims as Express.User['claims'],
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_at: claims?.exp || 0,
    };

    // Upsert user data asynchronously (fire-and-forget)
    upsertUser(claims).catch((err) => {
      console.error('Failed to upsert user during authentication:', err);
    });

    // Call verified synchronously - authentication succeeds based on tokens
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    if (req.query.returnTo) {
      req.session.returnTo = req.query.returnTo as string;
    }
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    const returnTo = req.session.returnTo || "/";
    delete req.session.returnTo;

    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: returnTo,
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // If no valid session, destroy and return 401
  if (!req.isAuthenticated() || !user?.expires_at) {
    console.log('Session destroyed: No authenticated user or missing expires_at');
    if (req.session) {
      return req.session.destroy(() => {
        res.status(401).json({ message: "Unauthorized" });
      });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check if token is still valid
  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Token expired - try to refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('Session destroyed: No refresh token available');
    return req.session.destroy(() => {
      res.status(401).json({ message: "Unauthorized" });
    });
  }

  try {
    console.log('Saving session...');
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    await updateUserSession(req, user, tokenResponse);
    return next();
  } catch (error) {
    console.error('Token refresh failed:', error);
    console.log('Session destroyed: Token refresh failed');
    return req.session.destroy(() => {
      res.status(401).json({ message: "Unauthorized" });
    });
  }
};
