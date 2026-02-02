// Type augmentations for Express and Passport authentication

// Express.User augmentation for Passport
declare global {
  namespace Express {
    interface User {
      claims?: {
        sub: string;
        email: string;
        first_name?: string;
        last_name?: string;
        profile_image_url?: string;
        exp?: number;
      };
      access_token: string;
      refresh_token?: string;
      expires_at?: number;
    }
  }
}

// Session data augmentation for returnTo
declare module 'express-session' {
  interface SessionData {
    returnTo?: string;
  }
}

export {};
