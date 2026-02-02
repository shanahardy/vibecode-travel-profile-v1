import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerPaymentRoutes } from "./routes/paymentRoutes";
import { registerWebhookRoutes } from "./routes/webhookRoutes";
import { registerChatKitRoutes } from "./routes/chatKitRoutes";
import { registerProfileRoutes } from "./routes/profileRoutes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  console.log('Starting route registration...');

  try {
    // Register webhook routes FIRST (needs raw body before JSON parsing)
    await registerWebhookRoutes(app);
    console.log('✓ Webhook routes registered');
  } catch (error) {
    console.error('✗ Failed to register webhook routes:', error);
    throw error;
  }

  try {
    // Setup Replit Auth (must be done before registering other routes)
    await setupAuth(app);
    registerAuthRoutes(app);
    console.log('✓ Auth routes registered');
  } catch (error) {
    console.error('✗ Failed to register auth routes:', error);
    throw error;
  }

  try {
    // Register payment routes
    await registerPaymentRoutes(app);
    console.log('✓ Payment routes registered');
  } catch (error) {
    console.error('✗ Failed to register payment routes:', error);
    throw error;
  }

  try {
    // Register ChatKit routes
    await registerChatKitRoutes(app);
    console.log('✓ ChatKit routes registered');
  } catch (error) {
    console.error('✗ Failed to register ChatKit routes:', error);
    throw error;
  }

  try {
    // Register profile routes
    await registerProfileRoutes(app);
  } catch (error) {
    console.error('✗ Failed to register profile routes:', error);
    throw error;
  }

  console.log('✓ All routes registered successfully');

  // Debug endpoint (development only)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/routes', (req, res) => {
      const routes: Array<{ path: string; methods: string[] }> = [];
      app._router.stack.forEach((middleware: any) => {
        if (middleware.route) {
          routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
          });
        } else if (middleware.name === 'router' && middleware.handle.stack) {
          middleware.handle.stack.forEach((handler: any) => {
            if (handler.route) {
              routes.push({
                path: handler.route.path,
                methods: Object.keys(handler.route.methods)
              });
            }
          });
        }
      });
      res.json({ routes });
    });
    console.log('✓ Debug routes endpoint registered at /api/debug/routes');
  }

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface

  return httpServer;
}
