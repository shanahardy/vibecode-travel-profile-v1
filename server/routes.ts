import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth (must be done before registering other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface

  return httpServer;
}
