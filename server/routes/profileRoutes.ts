import type { Express } from "express";
import { storage } from "../storage";
import type { TravelProfile, InsertTrip } from "@shared/schema";
import { getUserId, type AuthenticatedRequest } from "../middleware/auth";
import { isAuthenticated } from "../replit_integrations/auth/replitAuth";

export async function registerProfileRoutes(app: Express): Promise<void> {
  console.log('Registering profile routes...');

  try {
    // Get user's profile from DB
    app.get("/api/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const profile = await storage.getProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Fetch related data
      const trips = await storage.getTrips(profile.id);
      const groupMembers = await storage.getGroupMembers(profile.id);

      // Separate trips by status
      const upcomingTrips = trips.filter(t => t.status === 'upcoming');
      const pastTrips = trips.filter(t => t.status === 'past');

      // Build response matching client store format
      const response = {
        ...profile,
        upcomingTrips: upcomingTrips.map(t => ({
          destination: t.destination,
          purpose: t.purpose,
          timeframe: t.timeframe,
          notes: t.notes || '',
        })),
        pastTrips: pastTrips.map(t => ({
          destination: t.destination,
          date: t.pastTripDate || '',
          summary: t.summary || '',
          likes: t.likes || [],
          dislikes: t.dislikes || [],
          specialNeeds: t.specialNeeds || [],
        })),
        travelGroup: groupMembers.length > 0 ? {
          type: groupMembers[0].groupType,
          members: groupMembers.map(m => ({
            name: m.name,
            age: m.age,
            isMinor: m.isMinor,
            schoolInfo: m.schoolInfo,
          })),
        } : undefined,
      };

      res.json(response);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  console.log('  ✓ GET /api/profile');

  // Create/update profile in DB
  app.post("/api/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profileData = req.body;

    // Guard against demo data
    if (
      profileData.name === "Alex Johnson" ||
      profileData.contactInfo?.email === "alex.johnson@example.com"
    ) {
      return res.status(400).json({
        error: "Cannot save demo profile data",
      });
    }

    try {
      // Extract data that goes to different tables
      const { upcomingTrips, pastTrips, travelGroup, ...profileFields } = profileData;

      // Upsert profile
      const profile = await storage.upsertProfile(userId, profileFields);

      // Sync travel group members
      if (travelGroup?.members) {
        await storage.syncGroupMembers(
          profile.id,
          travelGroup.members.map((member: any, index: number) => ({
            name: member.name,
            age: member.age,
            isMinor: member.isMinor,
            schoolInfo: member.schoolInfo,
            groupType: travelGroup.type,
            sequence: index,
          }))
        );
      }

      // Sync trips (simple implementation - delete and recreate)
      const existingTrips = await storage.getTrips(profile.id);
      await Promise.all(existingTrips.map(t => storage.deleteTrip(t.id)));

      // Create upcoming trips
      if (upcomingTrips?.length) {
        await Promise.all(
          upcomingTrips.map((trip: any) =>
            storage.createTrip(profile.id, {
              destination: trip.destination,
              purpose: trip.purpose || 'vacation',
              status: 'upcoming',
              timeframe: trip.timeframe,
              notes: trip.notes || '',
            } as InsertTrip)
          )
        );
      }

      // Create past trips
      if (pastTrips?.length) {
        await Promise.all(
          pastTrips.map((trip: any) =>
            storage.createTrip(profile.id, {
              destination: trip.destination,
              purpose: 'vacation',
              status: 'past',
              timeframe: { type: 'past', description: trip.date },
              pastTripDate: trip.date,
              summary: trip.summary || '',
              likes: trip.likes || [],
              dislikes: trip.dislikes || [],
              specialNeeds: trip.specialNeeds || [],
              notes: '',
            } as InsertTrip)
          )
        );
      }

      res.json({ success: true, profile });
    } catch (error) {
      console.error("Failed to save profile:", error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });
  console.log('  ✓ POST /api/profile');

  // Delete profile
  app.delete("/api/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await storage.deleteProfile(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete profile:", error);
      res.status(500).json({ error: "Failed to delete profile" });
    }
  });
  console.log('  ✓ DELETE /api/profile');

  // Trip endpoints
  app.get("/api/profile/trips", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const trips = await storage.getTrips(profile.id);
      res.json(trips);
    } catch (error) {
      console.error("Failed to fetch trips:", error);
      res.status(500).json({ error: "Failed to fetch trips" });
    }
  });
  console.log('  ✓ GET /api/profile/trips');

  app.post("/api/profile/trips", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const trip = await storage.createTrip(profile.id, req.body);
      res.json(trip);
    } catch (error) {
      console.error("Failed to create trip:", error);
      res.status(500).json({ error: "Failed to create trip" });
    }
  });
  console.log('  ✓ POST /api/profile/trips');

  app.put("/api/profile/trips/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Get user's profile
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Get trip and verify ownership
      const tripId = String(req.params.id);
      const existingTrip = await storage.getTripById(tripId);
      if (!existingTrip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (existingTrip.profileId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Trip belongs to another user" });
      }

      // Update trip
      const trip = await storage.updateTrip(tripId, req.body);
      res.json(trip);
    } catch (error) {
      console.error("Failed to update trip:", error);
      res.status(500).json({ error: "Failed to update trip" });
    }
  });
  console.log('  ✓ PUT /api/profile/trips/:id');

  app.delete("/api/profile/trips/:id", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Get user's profile
      const profile = await storage.getProfile(userId);
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Get trip and verify ownership
      const tripId = String(req.params.id);
      const existingTrip = await storage.getTripById(tripId);
      if (!existingTrip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      if (existingTrip.profileId !== profile.id) {
        return res.status(403).json({ error: "Forbidden: Trip belongs to another user" });
      }

      // Delete trip
      await storage.deleteTrip(tripId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete trip:", error);
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });
  console.log('  ✓ DELETE /api/profile/trips/:id');

  console.log('✓ Profile routes registered successfully');
  } catch (error) {
    console.error('✗ Error registering profile routes:', error);
    throw error;
  }
}
