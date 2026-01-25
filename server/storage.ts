// Note: User authentication is now handled by Replit Auth
// See server/replit_integrations/auth/storage.ts for user operations

// modify the interface with any CRUD methods you might need for your app
// (excluding user management which is handled by Replit Auth)

export interface IStorage {
  // Add your app-specific storage methods here
}

export class MemStorage implements IStorage {
  constructor() {
    // Initialize your app-specific storage here
  }

  // Add your app-specific storage methods here
}

export const storage = new MemStorage();
