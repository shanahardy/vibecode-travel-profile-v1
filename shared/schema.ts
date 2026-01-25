import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  pgEnum,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export const travelGroupTypeEnum = pgEnum("travel_group_type", [
  "solo",
  "partner",
  "family",
  "group"
]);

export const budgetLevelEnum = pgEnum("budget_level", [
  "budget",
  "moderate",
  "luxury"
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "upcoming",
  "past",
  "cancelled"
]);

export const tripPurposeEnum = pgEnum("trip_purpose", [
  "vacation",
  "business",
  "family",
  "other"
]);

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant"
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "confirmation",
  "followup",
  "completion"
]);

export const productTypeEnum = pgEnum("product_type", [
  "stay",
  "activity",
  "food"
]);

export const priorityLevelEnum = pgEnum("priority_level", [
  "low",
  "medium",
  "high"
]);

export const itineraryPeriodEnum = pgEnum("itinerary_period", [
  "Morning",
  "Afternoon",
  "Evening"
]);

// ============================================================================
// TABLES
// ============================================================================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Travel Profiles - One-to-one with users
export const travelProfiles = pgTable("travel_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Contact information (stored as JSON)
  contactInfo: jsonb("contact_info").$type<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
  }>(),

  // Location information (stored as JSON)
  location: jsonb("location").$type<{
    city: string;
    state: string;
    zipCode: string;
    preferredAirports: string[];
    preferredTerminals: { type: string; name: string }[];
  }>(),

  // Budget preferences (stored as JSON)
  budgetPreferences: jsonb("budget_preferences").$type<{
    priorityCategories: {
      flights: "low" | "medium" | "high";
      lodging: "low" | "medium" | "high";
      food: "low" | "medium" | "high";
      activities: "low" | "medium" | "high";
    };
    budgetRange?: {
      min: number;
      max: number;
      currency: string;
    };
    notes: string;
  }>(),

  // Legacy fields (for backward compatibility)
  name: text("name").notNull().default(""),
  travelStyle: jsonb("travel_style").$type<string[]>().default([]),
  budget: budgetLevelEnum("budget"),
  preferredDestinations: jsonb("preferred_destinations").$type<string[]>().default([]),
  dietaryRestrictions: jsonb("dietary_restrictions").$type<string[]>().default([]),
  interests: jsonb("interests").$type<string[]>().default([]),
  travelCompanions: text("travel_companions").default(""),
  homeAirport: text("home_airport").default(""),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Travel Group Members - Family/group companions
export const travelGroupMembers = pgTable("travel_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => travelProfiles.id, { onDelete: "cascade" }),

  name: text("name").notNull(),
  age: integer("age").notNull(),
  isMinor: boolean("is_minor").notNull().default(false),

  // School info for minors (stored as JSON)
  schoolInfo: jsonb("school_info").$type<{
    schoolName: string;
  }>(),

  groupType: travelGroupTypeEnum("group_type").notNull(),
  sequence: integer("sequence").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Trips - Both upcoming and past trips
export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id")
    .notNull()
    .references(() => travelProfiles.id, { onDelete: "cascade" }),

  destination: text("destination").notNull(),
  status: tripStatusEnum("status").notNull().default("upcoming"),
  purpose: tripPurposeEnum("purpose").notNull(),

  // Flexible timeframe (stored as JSON to support both specific and flexible dates)
  timeframe: jsonb("timeframe").$type<{
    type: string;
    description: string;
    startDate?: string;
    endDate?: string;
  }>().notNull(),

  notes: text("notes").default(""),

  // Past trip specific fields
  pastTripDate: text("past_trip_date"), // e.g., "Dec 2024"
  likes: jsonb("likes").$type<string[]>(),
  dislikes: jsonb("dislikes").$type<string[]>(),
  specialNeeds: jsonb("special_needs").$type<string[]>(),
  summary: text("summary"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Planner Messages - AI chat conversation history per trip
export const plannerMessages = pgTable("planner_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),

  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Itinerary Days - Day-level itinerary structure
export const itineraryDays = pgTable("itinerary_days", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),

  dayNumber: integer("day_number").notNull(),
  date: text("date"), // ISO date string
  title: text("title"),
  description: text("description"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Itinerary Slots - Time slots within each day
export const itinerarySlots = pgTable("itinerary_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayId: varchar("day_id")
    .notNull()
    .references(() => itineraryDays.id, { onDelete: "cascade" }),

  period: itineraryPeriodEnum("period").notNull(),
  timeRange: text("time_range"), // e.g., "9:00 AM - 12:00 PM"
  title: text("title"),
  description: text("description"),
  sequence: integer("sequence").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Options - Hotels, activities, restaurants (reusable across trips)
export const productOptions = pgTable("product_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  title: text("title").notNull(),
  type: productTypeEnum("type").notNull(),
  imageUrl: text("image_url"),

  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: integer("review_count"),
  price: text("price"),
  location: text("location"),
  description: text("description"),

  // Additional metadata stored as JSON
  metadata: jsonb("metadata").$type<Record<string, any>>(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Slot Product Options - Junction table linking products to itinerary slots
export const slotProductOptions = pgTable("slot_product_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotId: varchar("slot_id")
    .notNull()
    .references(() => itinerarySlots.id, { onDelete: "cascade" }),
  productId: varchar("product_id")
    .notNull()
    .references(() => productOptions.id, { onDelete: "cascade" }),

  isSelected: boolean("is_selected").notNull().default(false),
  isSaved: boolean("is_saved").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one }) => ({
  travelProfile: one(travelProfiles, {
    fields: [users.id],
    references: [travelProfiles.userId],
  }),
}));

export const travelProfilesRelations = relations(travelProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [travelProfiles.userId],
    references: [users.id],
  }),
  groupMembers: many(travelGroupMembers),
  trips: many(trips),
}));

export const travelGroupMembersRelations = relations(travelGroupMembers, ({ one }) => ({
  profile: one(travelProfiles, {
    fields: [travelGroupMembers.profileId],
    references: [travelProfiles.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  profile: one(travelProfiles, {
    fields: [trips.profileId],
    references: [travelProfiles.id],
  }),
  messages: many(plannerMessages),
  itineraryDays: many(itineraryDays),
}));

export const plannerMessagesRelations = relations(plannerMessages, ({ one }) => ({
  trip: one(trips, {
    fields: [plannerMessages.tripId],
    references: [trips.id],
  }),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  trip: one(trips, {
    fields: [itineraryDays.tripId],
    references: [trips.id],
  }),
  slots: many(itinerarySlots),
}));

export const itinerarySlotsRelations = relations(itinerarySlots, ({ one, many }) => ({
  day: one(itineraryDays, {
    fields: [itinerarySlots.dayId],
    references: [itineraryDays.id],
  }),
  productOptions: many(slotProductOptions),
}));

export const productOptionsRelations = relations(productOptions, ({ many }) => ({
  slotAssignments: many(slotProductOptions),
}));

export const slotProductOptionsRelations = relations(slotProductOptions, ({ one }) => ({
  slot: one(itinerarySlots, {
    fields: [slotProductOptions.slotId],
    references: [itinerarySlots.id],
  }),
  product: one(productOptions, {
    fields: [slotProductOptions.productId],
    references: [productOptions.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTravelProfileSchema = createInsertSchema(travelProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTravelGroupMemberSchema = createInsertSchema(travelGroupMembers).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPlannerMessageSchema = createInsertSchema(plannerMessages).omit({
  id: true,
  createdAt: true,
});

export const insertItineraryDaySchema = createInsertSchema(itineraryDays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItinerarySlotSchema = createInsertSchema(itinerarySlots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductOptionSchema = createInsertSchema(productOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSlotProductOptionSchema = createInsertSchema(slotProductOptions).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTravelProfile = z.infer<typeof insertTravelProfileSchema>;
export type TravelProfile = typeof travelProfiles.$inferSelect;

export type InsertTravelGroupMember = z.infer<typeof insertTravelGroupMemberSchema>;
export type TravelGroupMember = typeof travelGroupMembers.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertPlannerMessage = z.infer<typeof insertPlannerMessageSchema>;
export type PlannerMessage = typeof plannerMessages.$inferSelect;

export type InsertItineraryDay = z.infer<typeof insertItineraryDaySchema>;
export type ItineraryDay = typeof itineraryDays.$inferSelect;

export type InsertItinerarySlot = z.infer<typeof insertItinerarySlotSchema>;
export type ItinerarySlot = typeof itinerarySlots.$inferSelect;

export type InsertProductOption = z.infer<typeof insertProductOptionSchema>;
export type ProductOption = typeof productOptions.$inferSelect;

export type InsertSlotProductOption = z.infer<typeof insertSlotProductOptionSchema>;
export type SlotProductOption = typeof slotProductOptions.$inferSelect;
