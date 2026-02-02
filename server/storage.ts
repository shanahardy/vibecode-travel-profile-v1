import { authStorage } from "./replit_integrations/auth/storage";
import type { User, UpsertUser } from "@shared/models/auth";
import type {
  TravelProfile,
  InsertTravelProfile,
  Trip,
  InsertTrip,
  TravelGroupMember,
  InsertTravelGroupMember
} from "@shared/schema";
import { db } from "./db";
import { travelProfiles, trips, travelGroupMembers } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Unified storage interface that combines auth storage with app-specific storage
export interface IStorage {
  // User methods (delegated to auth storage)
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined>;

  // Profile methods
  getProfile(userId: string): Promise<TravelProfile | undefined>;
  upsertProfile(userId: string, profile: Partial<InsertTravelProfile>): Promise<TravelProfile>;
  deleteProfile(userId: string): Promise<void>;

  // Trip methods
  getTrips(profileId: string): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip | undefined>;
  createTrip(profileId: string, trip: InsertTrip): Promise<Trip>;
  updateTrip(tripId: string, updates: Partial<Trip>): Promise<Trip>;
  deleteTrip(tripId: string): Promise<void>;

  // Group members
  syncGroupMembers(profileId: string, members: InsertTravelGroupMember[]): Promise<void>;
  getGroupMembers(profileId: string): Promise<TravelGroupMember[]>;
}

class Storage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    return authStorage.getUser(id);
  }

  async updateUser(id: string, data: Partial<UpsertUser>): Promise<User | undefined> {
    return authStorage.updateUser(id, data);
  }

  // Profile methods
  async getProfile(userId: string): Promise<TravelProfile | undefined> {
    const result = await db.query.travelProfiles.findFirst({
      where: eq(travelProfiles.userId, userId),
    });
    return result;
  }

  async upsertProfile(userId: string, profile: Partial<InsertTravelProfile>): Promise<TravelProfile> {
    const existing = await this.getProfile(userId);

    if (existing) {
      // Update existing profile
      const [updated] = await db
        .update(travelProfiles)
        .set({
          ...profile,
          updatedAt: new Date()
        })
        .where(eq(travelProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new profile
      const [created] = await db
        .insert(travelProfiles)
        .values({
          userId,
          ...profile,
        })
        .returning();
      return created;
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    await db.delete(travelProfiles).where(eq(travelProfiles.userId, userId));
  }

  // Trip methods
  async getTrips(profileId: string): Promise<Trip[]> {
    return db.query.trips.findMany({
      where: eq(trips.profileId, profileId),
      orderBy: (trips, { desc }) => [desc(trips.createdAt)],
    });
  }

  async getTripById(tripId: string): Promise<Trip | undefined> {
    const result = await db.query.trips.findFirst({
      where: eq(trips.id, tripId),
    });
    return result;
  }

  async createTrip(profileId: string, trip: InsertTrip): Promise<Trip> {
    const [created] = await db
      .insert(trips)
      .values({
        ...trip,
        profileId,
      })
      .returning();
    return created;
  }

  async updateTrip(tripId: string, updates: Partial<Trip>): Promise<Trip> {
    const [updated] = await db
      .update(trips)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(trips.id, tripId))
      .returning();
    return updated;
  }

  async deleteTrip(tripId: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, tripId));
  }

  // Group members
  async syncGroupMembers(profileId: string, members: InsertTravelGroupMember[]): Promise<void> {
    // Delete existing members
    await db.delete(travelGroupMembers).where(eq(travelGroupMembers.profileId, profileId));

    // Insert new members
    if (members.length > 0) {
      await db.insert(travelGroupMembers).values(
        members.map(member => ({
          ...member,
          profileId,
        }))
      );
    }
  }

  async getGroupMembers(profileId: string): Promise<TravelGroupMember[]> {
    return db.query.travelGroupMembers.findMany({
      where: eq(travelGroupMembers.profileId, profileId),
      orderBy: (travelGroupMembers, { asc }) => [asc(travelGroupMembers.sequence)],
    });
  }
}

export const storage = new Storage();
