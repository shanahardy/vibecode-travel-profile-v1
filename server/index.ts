import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import { randomUUID } from "crypto";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { pool } from "./db";
import { sanitizeInputs } from "./middleware/sanitize";
import { logEvent } from "./lib/audit";

/**
 * Validate critical environment variables at startup
 * Logs warnings for missing or misconfigured values
 */
function validateEnvironmentVariables() {
  console.log('\n=== Environment Configuration Check ===');

  // Required variables
  const required = {
    'SESSION_SECRET': process.env.SESSION_SECRET,
    'DATABASE_URL': process.env.DATABASE_URL,
  };

  // Optional but important variables
  const optional = {
    'VOICEFLOW_API_KEY': process.env.VOICEFLOW_API_KEY,
    'VOICEFLOW_PROJECT_KEY': process.env.VOICEFLOW_PROJECT_KEY,
    'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  };

  // Check required variables
  let hasRequiredVars = true;
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      console.error(`❌ MISSING REQUIRED: ${key}`);
      hasRequiredVars = false;
    } else {
      console.log(`✓ ${key}: configured`);
    }
  }

  // Check optional variables
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      console.log(`⚠️  ${key}: not set (optional)`);
    } else if (value.includes('XXXX')) {
      console.log(`⚠️  ${key}: PLACEHOLDER detected - replace in Replit Secrets`);
    } else {
      const preview = value.substring(0, 10);
      console.log(`✓ ${key}: configured (${preview}...)`);
    }
  }

  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Source: Replit Secrets (preferred) or .env file (fallback)');
  console.log('========================================\n');

  if (!hasRequiredVars) {
    console.error('FATAL: Missing required environment variables');
    process.exit(1);
  }
}

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Trust proxy for Replit
app.set("trust proxy", true);

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://api.stripe.com",
          "https://api.openai.com",
          "https://us.i.posthog.com",
          "https://eu.i.posthog.com",
          "wss:",
          "ws:",
        ],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Rate limiting (500 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and webhooks
    return req.path === "/health" || req.path === "/ready" || req.path.startsWith("/api/webhook");
  },
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL || true
      : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  })
);

// Cookie parser
app.use(cookieParser());

// Health check endpoints (before JSON parsing)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/ready", async (_req, res) => {
  try {
    // Check database connection
    await pool.query("SELECT 1");
    res.json({ status: "ready" });
  } catch (error) {
    res.status(503).json({ status: "not ready", error: "Database connection failed" });
  }
});

// Register webhook routes FIRST (needs raw body) - webhooks are registered in routes.ts
// Raw body parsing for webhooks
app.use("/api/webhook", express.raw({ type: "application/json" }));

// JSON parsing with raw body capture for other routes
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// XSS sanitization (skip webhook routes)
app.use((req, res, next) => {
  if (req.path.startsWith("/api/webhook")) {
    return next();
  }
  sanitizeInputs(req, res, next);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Request logging with request ID
app.use((req, res, next) => {
  const requestId = randomUUID();
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);

      // Log to PostHog
      logEvent("api.request", {
        requestId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
      });
    }
  });

  next();
});

(async () => {
  // Validate environment variables at startup
  validateEnvironmentVariables();

  try {
    await registerRoutes(httpServer, app);
  } catch (error) {
    console.error('FATAL: Failed to register routes:', error);
    process.exit(1);
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
