# OpenRide Implementation Design Document

**Version:** 1.0  
**Date:** December 2024  
**Author:** Manus AI  
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema Design](#database-schema-design)
3. [API Endpoint Specifications](#api-endpoint-specifications)
4. [Component Architecture](#component-architecture)
5. [State Management Patterns](#state-management-patterns)
6. [Algorithm Specifications](#algorithm-specifications)
7. [Third-Party Integrations](#third-party-integrations)
8. [File Structure & Organization](#file-structure--organization)
9. [UI/UX Design & Component Hierarchy](#uiux-design--component-hierarchy)

---

## Overview

This document provides comprehensive implementation design for all outstanding OpenRide features. It serves as the authoritative reference for developers implementing the requirements defined in REQUIREMENTS.md. Each section includes detailed specifications, code examples, and architectural diagrams to ensure consistent, high-quality implementation.

The design follows the existing OpenRide architecture built on React 19, tRPC 11, Drizzle ORM, and MySQL, while introducing new patterns for AI/ML features, real-time tracking, and Progressive Web App capabilities.

---

## Database Schema Design

This section defines all new database tables and schema modifications required for outstanding features. All schemas use Drizzle ORM syntax and follow the existing naming conventions established in `drizzle/schema.ts`.

### 1. AI/ML Data Collection Schema

The platform requires comprehensive data collection to power AI features including demand prediction, dynamic pricing, and intelligent matching. The following tables capture ride patterns, demand metrics, and algorithm performance.

#### 1.1 Demand Data Table

The `demand_data` table records granular demand information for each ride request, enabling the ML model to identify patterns and predict future demand.

```typescript
import { mysqlTable, int, varchar, timestamp, decimal, boolean } from "drizzle-orm/mysql-core";

export const demandData = mysqlTable("demand_data", {
  id: int("id").primaryKey().autoincrement(),
  
  // Temporal dimensions
  timestamp: timestamp("timestamp").notNull(), // When ride was requested
  hourOfDay: int("hour_of_day").notNull(), // 0-23
  dayOfWeek: int("day_of_week").notNull(), // 0-6 (Sunday=0)
  isWeekend: boolean("is_weekend").notNull(),
  isHoliday: boolean("is_holiday").notNull().default(false),
  
  // Spatial dimensions (geographic grid cell)
  gridCellId: varchar("grid_cell_id", { length: 20 }).notNull(), // e.g., "43.65_-79.38" (lat_lng rounded to 0.01)
  pickupLat: decimal("pickup_lat", { precision: 10, scale: 7 }).notNull(),
  pickupLng: decimal("pickup_lng", { precision: 10, scale: 7 }).notNull(),
  dropoffLat: decimal("dropoff_lat", { precision: 10, scale: 7 }),
  dropoffLng: decimal("dropoff_lng", { precision: 10, scale: 7 }),
  
  // Demand metrics
  requestCount: int("request_count").notNull().default(1), // Aggregated count for this cell/hour
  completedCount: int("completed_count").notNull().default(0),
  cancelledCount: int("cancelled_count").notNull().default(0),
  noDriverCount: int("no_driver_count").notNull().default(0), // No drivers available
  
  // Supply metrics
  availableDrivers: int("available_drivers").notNull(),
  avgWaitTime: int("avg_wait_time"), // seconds
  avgAcceptanceTime: int("avg_acceptance_time"), // seconds until driver accepts
  
  // Pricing
  avgFare: int("avg_fare"), // cents
  surgeMultiplier: int("surge_multiplier").notNull().default(100), // 100 = 1.0x, 150 = 1.5x
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DemandData = typeof demandData.$inferSelect;
export type InsertDemandData = typeof demandData.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_demand_grid_time ON demand_data(grid_cell_id, timestamp);
CREATE INDEX idx_demand_hour_day ON demand_data(hour_of_day, day_of_week);
CREATE INDEX idx_demand_timestamp ON demand_data(timestamp);
```

#### 1.2 Demand Predictions Table

The `demand_predictions` table stores ML model predictions for future demand, enabling proactive driver positioning and dynamic pricing.

```typescript
export const demandPredictions = mysqlTable("demand_predictions", {
  id: int("id").primaryKey().autoincrement(),
  
  // Prediction target
  gridCellId: varchar("grid_cell_id", { length: 20 }).notNull(),
  predictedTimestamp: timestamp("predicted_timestamp").notNull(), // When prediction is for
  predictedHour: int("predicted_hour").notNull(), // 0-23
  
  // Prediction values
  predictedDemand: int("predicted_demand").notNull(), // Expected number of ride requests
  confidenceScore: int("confidence_score").notNull(), // 0-100
  predictedSurge: int("predicted_surge").notNull().default(100), // 100 = 1.0x
  
  // Model metadata
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  
  // Actual outcome (filled in after prediction period)
  actualDemand: int("actual_demand"),
  predictionError: int("prediction_error"), // Absolute difference
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DemandPrediction = typeof demandPredictions.$inferSelect;
export type InsertDemandPrediction = typeof demandPredictions.$inferInsert;
```

#### 1.3 Pricing Decisions Table

The `pricing_decisions` table logs all dynamic pricing decisions for transparency, auditing, and model training.

```typescript
export const pricingDecisions = mysqlTable("pricing_decisions", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associated ride
  rideId: int("ride_id").notNull(),
  
  // Pricing inputs
  baseFare: int("base_fare").notNull(), // cents
  distance: int("distance").notNull(), // meters
  estimatedDuration: int("estimated_duration").notNull(), // seconds
  
  // Demand factors
  currentDemand: varchar("current_demand", { length: 20 }).notNull(), // "low", "medium", "high", "surge"
  availableDriverCount: int("available_driver_count").notNull(),
  hourOfDay: int("hour_of_day").notNull(),
  dayOfWeek: int("day_of_week").notNull(),
  
  // Competitive factors
  competitorAvgPrice: int("competitor_avg_price"), // cents, if available
  competitorCount: int("competitor_count").default(0),
  
  // Pricing decision
  surgeMultiplier: int("surge_multiplier").notNull(), // 100 = 1.0x
  finalFare: int("final_fare").notNull(), // cents
  
  // Outcome metrics
  wasAccepted: boolean("was_accepted"),
  wasCompleted: boolean("was_completed"),
  riderRating: int("rider_rating"), // 0-500 (rating * 100)
  
  // Model metadata
  algorithmVersion: varchar("algorithm_version", { length: 50 }).notNull(),
  decisionTimestamp: timestamp("decision_timestamp").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PricingDecision = typeof pricingDecisions.$inferSelect;
export type InsertPricingDecision = typeof pricingDecisions.$inferInsert;
```

#### 1.4 Matching Decisions Table

The `matching_decisions` table records all driver-rider matching decisions to train and improve the matching algorithm.

```typescript
export const matchingDecisions = mysqlTable("matching_decisions", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associated ride
  rideId: int("ride_id").notNull(),
  riderId: int("rider_id").notNull(),
  
  // Selected driver
  selectedDriverId: int("selected_driver_id").notNull(),
  
  // Matching inputs
  availableDriverCount: int("available_driver_count").notNull(),
  riderRating: int("rider_rating").notNull(), // 0-500
  riderTotalRides: int("rider_total_rides").notNull(),
  
  // Selected driver attributes
  driverRating: int("driver_rating").notNull(), // 0-500
  driverTotalRides: int("driver_total_rides").notNull(),
  driverEta: int("driver_eta").notNull(), // seconds
  driverDistance: int("driver_distance").notNull(), // meters
  driverAcceptanceRate: int("driver_acceptance_rate").notNull(), // 0-100
  
  // Matching decision
  isPremiumMatch: boolean("is_premium_match").notNull().default(false), // 5-star to 5-star
  matchScore: int("match_score").notNull(), // 0-100
  
  // Outcome metrics
  wasAccepted: boolean("was_accepted"),
  acceptanceTime: int("acceptance_time"), // seconds
  wasCompleted: boolean("was_completed"),
  finalRiderRating: int("final_rider_rating"), // Rating rider gave driver
  finalDriverRating: int("final_driver_rating"), // Rating driver gave rider
  
  // Model metadata
  algorithmVersion: varchar("algorithm_version", { length: 50 }).notNull(),
  matchTimestamp: timestamp("match_timestamp").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MatchingDecision = typeof matchingDecisions.$inferSelect;
export type InsertMatchingDecision = typeof matchingDecisions.$inferInsert;
```

### 2. Real-Time Tracking Schema

Real-time driver location tracking requires efficient storage and retrieval of location data.

#### 2.1 Driver Locations Table

The `driver_locations` table stores the most recent location for each active driver, updated every 5-10 seconds.

```typescript
export const driverLocations = mysqlTable("driver_locations", {
  id: int("id").primaryKey().autoincrement(),
  
  driverId: int("driver_id").notNull().unique(), // One row per driver
  userId: int("user_id").notNull(),
  
  // Current location
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  heading: int("heading"), // 0-359 degrees
  speed: int("speed"), // km/h
  accuracy: int("accuracy"), // meters
  
  // Status
  isAvailable: boolean("is_available").notNull().default(false),
  currentRideId: int("current_ride_id"),
  
  // Timestamps
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DriverLocation = typeof driverLocations.$inferSelect;
export type InsertDriverLocation = typeof driverLocations.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_driver_location_available ON driver_locations(is_available, last_updated);
CREATE SPATIAL INDEX idx_driver_location_coords ON driver_locations(latitude, longitude);
```

#### 2.2 Location History Table

The `location_history` table archives location updates for completed rides, enabling route replay and dispute resolution.

```typescript
export const locationHistory = mysqlTable("location_history", {
  id: int("id").primaryKey().autoincrement(),
  
  rideId: int("ride_id").notNull(),
  driverId: int("driver_id").notNull(),
  
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  heading: int("heading"),
  speed: int("speed"),
  
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LocationHistory = typeof locationHistory.$inferSelect;
export type InsertLocationHistory = typeof locationHistory.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_location_history_ride ON location_history(ride_id, timestamp);
```

### 3. Progressive Web App Schema

PWA features require tables for push notification subscriptions and offline sync.

#### 3.1 Push Subscriptions Table

The `push_subscriptions` table stores Web Push API subscription objects for each user device.

```typescript
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  
  userId: int("user_id").notNull(),
  
  // Push subscription object (from browser)
  endpoint: varchar("endpoint", { length: 500 }).notNull().unique(),
  p256dhKey: varchar("p256dh_key", { length: 200 }).notNull(),
  authKey: varchar("auth_key", { length: 200 }).notNull(),
  
  // Device info
  deviceType: varchar("device_type", { length: 50 }), // "android", "ios", "desktop"
  browserType: varchar("browser_type", { length: 50 }), // "chrome", "firefox", "safari"
  
  // Preferences
  enableRideUpdates: boolean("enable_ride_updates").notNull().default(true),
  enableDriverAlerts: boolean("enable_driver_alerts").notNull().default(true),
  enableGovernance: boolean("enable_governance").notNull().default(true),
  enableInsurance: boolean("enable_insurance").notNull().default(true),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  lastUsed: timestamp("last_used").notNull().defaultNow(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
```

#### 3.2 Notification Queue Table

The `notification_queue` table queues notifications for delivery, supporting retry logic and delivery tracking.

```typescript
export const notificationQueue = mysqlTable("notification_queue", {
  id: int("id").primaryKey().autoincrement(),
  
  userId: int("user_id").notNull(),
  subscriptionId: int("subscription_id").notNull(),
  
  // Notification content
  title: varchar("title", { length: 100 }).notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  icon: varchar("icon", { length: 200 }),
  badge: varchar("badge", { length: 200 }),
  data: text("data"), // JSON string with action data
  
  // Delivery tracking
  status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "sent", "failed"
  attempts: int("attempts").notNull().default(0),
  lastAttempt: timestamp("last_attempt"),
  errorMessage: text("error_message"),
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for"),
  sentAt: timestamp("sent_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NotificationQueue = typeof notificationQueue.$inferSelect;
export type InsertNotificationQueue = typeof notificationQueue.$inferInsert;
```

### 4. Enhanced Ride Schema

Existing `rides` table requires additional fields for real-time tracking and enhanced features.

#### 4.1 Rides Table Extensions

Add the following columns to the existing `rides` table:

```typescript
// Add to existing rides table
export const rides = mysqlTable("rides", {
  // ... existing fields ...
  
  // Real-time tracking
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  actualPickupTime: timestamp("actual_pickup_time"),
  actualDropoffTime: timestamp("actual_dropoff_time"),
  
  // Route tracking
  plannedRoute: text("planned_route"), // JSON array of lat/lng points
  actualRoute: text("actual_route"), // JSON array from location_history
  routeDeviation: int("route_deviation"), // meters
  
  // Enhanced pricing
  baseFare: int("base_fare").notNull(),
  surgeMultiplier: int("surge_multiplier").notNull().default(100),
  distanceFare: int("distance_fare").notNull(),
  timeFare: int("time_fare").notNull(),
  
  // Matching
  matchingAlgorithmVersion: varchar("matching_algorithm_version", { length: 50 }),
  matchScore: int("match_score"),
  isPremiumMatch: boolean("is_premium_match").default(false),
  
  // ... existing fields ...
});
```

### 5. Driver Application Schema

Enhanced driver application process requires detailed document tracking.

#### 5.1 Driver Documents Table

The `driver_documents` table tracks all uploaded documents with verification status.

```typescript
export const driverDocuments = mysqlTable("driver_documents", {
  id: int("id").primaryKey().autoincrement(),
  
  driverId: int("driver_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Document details
  documentType: varchar("document_type", { length: 50 }).notNull(), // "license", "insurance", "registration", "vehicle_photo", "profile_photo"
  documentUrl: varchar("document_url", { length: 500 }).notNull(),
  documentKey: varchar("document_key", { length: 500 }).notNull(), // S3 key
  
  // Metadata
  fileName: varchar("file_name", { length: 255 }),
  fileSize: int("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Verification
  verificationStatus: varchar("verification_status", { length: 20 }).notNull().default("pending"), // "pending", "approved", "rejected"
  verifiedBy: int("verified_by"), // admin user_id
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  
  // Expiry (for licenses, insurance)
  expiryDate: timestamp("expiry_date"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = typeof driverDocuments.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_driver_docs_driver ON driver_documents(driver_id, document_type);
CREATE INDEX idx_driver_docs_verification ON driver_documents(verification_status, created_at);
```

### 6. Admin Workflow Schema

Admin verification and approval workflows require audit trails.

#### 6.1 Admin Actions Table

The `admin_actions` table logs all administrative actions for accountability and auditing.

```typescript
export const adminActions = mysqlTable("admin_actions", {
  id: int("id").primaryKey().autoincrement(),
  
  adminId: int("admin_id").notNull(),
  
  // Action details
  actionType: varchar("action_type", { length: 50 }).notNull(), // "approve_driver", "reject_driver", "approve_claim", etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "driver", "claim", "user", etc.
  entityId: int("entity_id").notNull(),
  
  // Action data
  previousState: text("previous_state"), // JSON
  newState: text("new_state"), // JSON
  notes: text("notes"),
  
  // Metadata
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: varchar("user_agent", { length: 500 }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = typeof adminActions.$inferInsert;
```

### Database Migration Strategy

All schema changes must be applied through Drizzle migrations to ensure version control and rollback capability.

**Migration workflow:**

1. Create new schema file: `drizzle/ml-schema.ts` for AI/ML tables
2. Create new schema file: `drizzle/tracking-schema.ts` for real-time tracking tables
3. Create new schema file: `drizzle/pwa-schema.ts` for PWA tables
4. Export all schemas from `drizzle/schema.ts`
5. Run `pnpm db:push` to apply changes
6. Verify migrations in production with `pnpm db:check`

**Rollback plan:**

Each migration includes a down migration that reverses changes. Critical data tables (demand_data, pricing_decisions, matching_decisions) should never be dropped without backup.

---

## API Endpoint Specifications

This section defines all tRPC procedures required for outstanding features, including input schemas, output types, and error handling patterns. All procedures follow the existing tRPC architecture with type-safe client-server communication.

### 1. AI/ML Feature Endpoints

The AI and machine learning features require endpoints for data collection, prediction retrieval, and algorithm configuration.

#### 1.1 Demand Prediction Endpoints

**Procedure:** `ai.getDemandPredictions`

Retrieves demand predictions for a specific geographic area and time range, enabling drivers to position themselves optimally.

```typescript
// Input schema
const getDemandPredictionsInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1000).max(50000).default(5000), // meters
  hoursAhead: z.number().min(1).max(24).default(4), // predict next 4 hours
});

// Output type
type DemandPredictionOutput = {
  predictions: Array<{
    gridCellId: string;
    centerLat: number;
    centerLng: number;
    hour: number; // 0-23
    timestamp: Date;
    predictedDemand: number;
    confidenceScore: number; // 0-100
    predictedSurge: number; // 100 = 1.0x, 150 = 1.5x
    recommendedEarnings: number; // cents per hour estimate
  }>;
  generatedAt: Date;
  modelVersion: string;
};

// Implementation
ai: router({
  getDemandPredictions: protectedProcedure
    .input(getDemandPredictionsInput)
    .query(async ({ input, ctx }) => {
      // 1. Calculate grid cells within radius
      const gridCells = calculateGridCellsInRadius(
        input.latitude,
        input.longitude,
        input.radius
      );
      
      // 2. Get predictions for next N hours
      const now = new Date();
      const predictions = await db.select()
        .from(demandPredictions)
        .where(and(
          inArray(demandPredictions.gridCellId, gridCells),
          gte(demandPredictions.predictedTimestamp, now),
          lte(demandPredictions.predictedTimestamp, 
            new Date(now.getTime() + input.hoursAhead * 60 * 60 * 1000)
          )
        ))
        .orderBy(demandPredictions.predictedTimestamp);
      
      // 3. Calculate recommended earnings
      const enriched = predictions.map(p => ({
        ...p,
        centerLat: parseFloat(p.gridCellId.split('_')[0]),
        centerLng: parseFloat(p.gridCellId.split('_')[1]),
        recommendedEarnings: calculateEarnings(p.predictedDemand, p.predictedSurge),
      }));
      
      return {
        predictions: enriched,
        generatedAt: new Date(),
        modelVersion: predictions[0]?.modelVersion || "1.0",
      };
    }),
});
```

**Error handling:**
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User is not a driver
- `BAD_REQUEST`: Invalid coordinates or radius

---

**Procedure:** `ai.recordDemandData`

Records demand data for a ride request to train the prediction model. Called automatically when rides are requested.

```typescript
const recordDemandDataInput = z.object({
  rideId: z.number(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  availableDrivers: z.number(),
  wasCompleted: z.boolean(),
  wasCancelled: z.boolean(),
  noDriverAvailable: z.boolean(),
  waitTime: z.number().optional(), // seconds
  fare: z.number().optional(), // cents
  surgeMultiplier: z.number().default(100),
});

ai: router({
  recordDemandData: protectedProcedure
    .input(recordDemandDataInput)
    .mutation(async ({ input }) => {
      const now = new Date();
      const gridCellId = calculateGridCell(input.pickupLat, input.pickupLng);
      
      await db.insert(demandData).values({
        timestamp: now,
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        gridCellId,
        pickupLat: input.pickupLat.toString(),
        pickupLng: input.pickupLng.toString(),
        dropoffLat: input.dropoffLat?.toString(),
        dropoffLng: input.dropoffLng?.toString(),
        requestCount: 1,
        completedCount: input.wasCompleted ? 1 : 0,
        cancelledCount: input.wasCancelled ? 1 : 0,
        noDriverCount: input.noDriverAvailable ? 1 : 0,
        availableDrivers: input.availableDrivers,
        avgWaitTime: input.waitTime,
        avgFare: input.fare,
        surgeMultiplier: input.surgeMultiplier,
      });
      
      return { success: true };
    }),
});
```

#### 1.2 Dynamic Pricing Endpoints

**Procedure:** `pricing.calculateFare`

Calculates dynamic fare for a ride request based on distance, time, demand, and competitive factors.

```typescript
const calculateFareInput = z.object({
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  estimatedDistance: z.number(), // meters
  estimatedDuration: z.number(), // seconds
  requestTime: z.date().optional(), // for future ride scheduling
});

type FareBreakdown = {
  baseFare: number; // cents
  distanceFare: number; // cents
  timeFare: number; // cents
  surgeMultiplier: number; // 100 = 1.0x
  surgeFare: number; // cents
  totalFare: number; // cents
  driverEarnings: number; // 87% of total
  networkFee: number; // 13% of total
  feeBreakdown: {
    insurance: number; // 10%
    developer: number; // 2.5%
    buyback: number; // 0.5%
  };
  demandLevel: "low" | "medium" | "high" | "surge";
  competitorAvgPrice: number | null; // cents, if available
  isPriceCompetitive: boolean;
};

pricing: router({
  calculateFare: publicProcedure
    .input(calculateFareInput)
    .query(async ({ input }): Promise<FareBreakdown> => {
      // 1. Calculate base fare
      const baseFare = 300; // $3.00 minimum
      const distanceFare = Math.round(input.estimatedDistance * 0.15); // $0.15/km = $0.00015/m
      const timeFare = Math.round(input.estimatedDuration * 0.5); // $0.30/min = $0.005/sec
      
      // 2. Determine demand level
      const gridCell = calculateGridCell(input.pickupLat, input.pickupLng);
      const availableDrivers = await getAvailableDriversInRadius(
        input.pickupLat,
        input.pickupLng,
        5000
      );
      const recentRequests = await getRecentRequestsInCell(gridCell, 15); // last 15 min
      
      const demandLevel = calculateDemandLevel(recentRequests.length, availableDrivers.length);
      const surgeMultiplier = calculateSurgeMultiplier(demandLevel);
      
      // 3. Check competitor pricing (optional)
      const competitorPrice = await fetchCompetitorPricing(
        input.pickupLat,
        input.pickupLng,
        input.dropoffLat,
        input.dropoffLng
      );
      
      // 4. Apply surge with competitive cap
      let finalSurge = surgeMultiplier;
      if (competitorPrice) {
        const baseTotal = baseFare + distanceFare + timeFare;
        const surgedTotal = Math.round(baseTotal * (surgeMultiplier / 100));
        
        // Don't exceed competitor price by more than 10%
        if (surgedTotal > competitorPrice * 1.1) {
          finalSurge = Math.round((competitorPrice * 1.1 / baseTotal) * 100);
        }
      }
      
      // 5. Calculate final fare
      const subtotal = baseFare + distanceFare + timeFare;
      const surgeFare = Math.round(subtotal * ((finalSurge - 100) / 100));
      const totalFare = subtotal + surgeFare;
      
      // 6. Calculate fee distribution
      const networkFee = Math.round(totalFare * 0.13);
      const driverEarnings = totalFare - networkFee;
      
      return {
        baseFare,
        distanceFare,
        timeFare,
        surgeMultiplier: finalSurge,
        surgeFare,
        totalFare,
        driverEarnings,
        networkFee,
        feeBreakdown: {
          insurance: Math.round(totalFare * 0.10),
          developer: Math.round(totalFare * 0.025),
          buyback: Math.round(totalFare * 0.005),
        },
        demandLevel,
        competitorAvgPrice: competitorPrice,
        isPriceCompetitive: competitorPrice ? totalFare <= competitorPrice * 1.1 : true,
      };
    }),
});
```

#### 1.3 Intelligent Matching Endpoints

**Procedure:** `matching.findBestDriver`

Implements intelligent driver-rider matching algorithm considering proximity, ratings, and premium tiers.

```typescript
const findBestDriverInput = z.object({
  rideId: z.number(),
  riderId: z.number(),
  pickupLat: z.number(),
  pickupLng: z.number(),
  riderRating: z.number().min(0).max(500),
  riderTotalRides: z.number(),
  maxRadius: z.number().default(5000), // meters
});

type DriverMatch = {
  driverId: number;
  userId: number;
  name: string;
  rating: number;
  totalRides: number;
  distance: number; // meters
  eta: number; // seconds
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  matchScore: number; // 0-100
  isPremiumMatch: boolean;
  acceptanceRate: number; // 0-100
};

matching: router({
  findBestDriver: protectedProcedure
    .input(findBestDriverInput)
    .mutation(async ({ input }): Promise<DriverMatch | null> => {
      // 1. Get all available drivers within radius
      const availableDrivers = await db.select()
        .from(driverProfiles)
        .innerJoin(users, eq(driverProfiles.userId, users.id))
        .innerJoin(driverLocations, eq(driverProfiles.id, driverLocations.driverId))
        .innerJoin(vehicles, eq(driverProfiles.id, vehicles.driverId))
        .where(and(
          eq(driverProfiles.isAvailable, true),
          eq(driverProfiles.verificationStatus, "approved"),
          eq(driverLocations.isAvailable, true),
          eq(vehicles.isActive, true)
        ));
      
      // 2. Filter by distance
      const driversInRange = availableDrivers.filter(d => {
        const distance = calculateDistance(
          input.pickupLat,
          input.pickupLng,
          parseFloat(d.driver_locations.latitude),
          parseFloat(d.driver_locations.longitude)
        );
        return distance <= input.maxRadius;
      });
      
      if (driversInRange.length === 0) return null;
      
      // 3. Calculate match scores
      const scoredDrivers = driversInRange.map(d => {
        const distance = calculateDistance(
          input.pickupLat,
          input.pickupLng,
          parseFloat(d.driver_locations.latitude),
          parseFloat(d.driver_locations.longitude)
        );
        const eta = estimateETA(distance, d.driver_locations.speed || 30);
        
        // Scoring algorithm
        let score = 50; // base score
        
        // Proximity (max 30 points)
        const proximityScore = Math.max(0, 30 - (distance / 100)); // -1 point per 100m
        score += proximityScore;
        
        // Rating (max 25 points)
        const ratingScore = (d.driver_profiles.averageRating / 500) * 25;
        score += ratingScore;
        
        // Experience (max 15 points)
        const experienceScore = Math.min(15, d.driver_profiles.totalRides / 10);
        score += experienceScore;
        
        // Acceptance rate (max 10 points)
        const acceptanceScore = (d.driver_profiles.acceptanceRate / 100) * 10;
        score += acceptanceScore;
        
        // Premium matching bonus
        const isRiderPremium = input.riderRating >= 480; // 4.8+ stars
        const isDriverPremium = d.driver_profiles.averageRating >= 480;
        const isPremiumMatch = isRiderPremium && isDriverPremium;
        if (isPremiumMatch) score += 20;
        
        return {
          ...d,
          distance,
          eta,
          matchScore: Math.min(100, Math.round(score)),
          isPremiumMatch,
        };
      });
      
      // 4. Sort by score and select best
      scoredDrivers.sort((a, b) => b.matchScore - a.matchScore);
      const bestDriver = scoredDrivers[0];
      
      // 5. Record matching decision
      await db.insert(matchingDecisions).values({
        rideId: input.rideId,
        riderId: input.riderId,
        selectedDriverId: bestDriver.driver_profiles.id,
        availableDriverCount: driversInRange.length,
        riderRating: input.riderRating,
        riderTotalRides: input.riderTotalRides,
        driverRating: bestDriver.driver_profiles.averageRating,
        driverTotalRides: bestDriver.driver_profiles.totalRides,
        driverEta: bestDriver.eta,
        driverDistance: bestDriver.distance,
        driverAcceptanceRate: bestDriver.driver_profiles.acceptanceRate,
        isPremiumMatch: bestDriver.isPremiumMatch,
        matchScore: bestDriver.matchScore,
        algorithmVersion: "1.0",
      });
      
      // 6. Return match
      return {
        driverId: bestDriver.driver_profiles.id,
        userId: bestDriver.users.id,
        name: bestDriver.users.name,
        rating: bestDriver.driver_profiles.averageRating,
        totalRides: bestDriver.driver_profiles.totalRides,
        distance: bestDriver.distance,
        eta: bestDriver.eta,
        vehicleInfo: {
          make: bestDriver.vehicles.make,
          model: bestDriver.vehicles.model,
          year: bestDriver.vehicles.year,
          color: bestDriver.vehicles.color,
          licensePlate: bestDriver.vehicles.licensePlate,
        },
        matchScore: bestDriver.matchScore,
        isPremiumMatch: bestDriver.isPremiumMatch,
        acceptanceRate: bestDriver.driver_profiles.acceptanceRate,
      };
    }),
});
```

### 2. Real-Time Tracking Endpoints

Real-time driver location tracking requires efficient update and query endpoints.

#### 2.1 Location Update Endpoints

**Procedure:** `tracking.updateDriverLocation`

Updates driver's current location. Called every 5-10 seconds while driver is active.

```typescript
const updateDriverLocationInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(359).optional(),
  speed: z.number().min(0).optional(), // km/h
  accuracy: z.number().optional(), // meters
});

tracking: router({
  updateDriverLocation: protectedProcedure
    .input(updateDriverLocationInput)
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin' && !ctx.user.isDriver) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only drivers can update location' });
      }
      
      const driver = await getDriverProfileByUserId(ctx.user.id);
      if (!driver) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver profile not found' });
      }
      
      // Upsert location (update if exists, insert if not)
      await db.insert(driverLocations)
        .values({
          driverId: driver.id,
          userId: ctx.user.id,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          heading: input.heading,
          speed: input.speed,
          accuracy: input.accuracy,
          isAvailable: driver.isAvailable,
          currentRideId: driver.currentRideId,
          lastUpdated: new Date(),
        })
        .onDuplicateKeyUpdate({
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          heading: input.heading,
          speed: input.speed,
          accuracy: input.accuracy,
          lastUpdated: new Date(),
        });
      
      // If driver is on active ride, archive location to history
      if (driver.currentRideId) {
        await db.insert(locationHistory).values({
          rideId: driver.currentRideId,
          driverId: driver.id,
          latitude: input.latitude.toString(),
          longitude: input.longitude.toString(),
          heading: input.heading,
          speed: input.speed,
          timestamp: new Date(),
        });
      }
      
      return { success: true };
    }),
});
```

**Procedure:** `tracking.getDriverLocation`

Retrieves real-time location for a specific driver. Used by riders to track their matched driver.

```typescript
const getDriverLocationInput = z.object({
  driverId: z.number(),
  rideId: z.number().optional(), // Verify rider has access to this driver
});

tracking: router({
  getDriverLocation: protectedProcedure
    .input(getDriverLocationInput)
    .query(async ({ input, ctx }) => {
      // Verify access: rider can only track their matched driver
      if (input.rideId) {
        const ride = await getRideById(input.rideId);
        if (!ride || ride.riderId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
      }
      
      const location = await db.select()
        .from(driverLocations)
        .where(eq(driverLocations.driverId, input.driverId))
        .limit(1);
      
      if (!location[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver location not available' });
      }
      
      return {
        latitude: parseFloat(location[0].latitude),
        longitude: parseFloat(location[0].longitude),
        heading: location[0].heading,
        speed: location[0].speed,
        lastUpdated: location[0].lastUpdated,
      };
    }),
});
```

**Procedure:** `tracking.getRideRoute`

Retrieves complete route history for a ride, enabling route replay and dispute resolution.

```typescript
const getRideRouteInput = z.object({
  rideId: z.number(),
});

tracking: router({
  getRideRoute: protectedProcedure
    .input(getRideRouteInput)
    .query(async ({ input, ctx }) => {
      // Verify access
      const ride = await getRideById(input.rideId);
      if (!ride || (ride.riderId !== ctx.user.id && ride.driverId !== ctx.user.id && ctx.user.role !== 'admin')) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      
      const route = await db.select()
        .from(locationHistory)
        .where(eq(locationHistory.rideId, input.rideId))
        .orderBy(locationHistory.timestamp);
      
      return {
        rideId: input.rideId,
        points: route.map(p => ({
          latitude: parseFloat(p.latitude),
          longitude: parseFloat(p.longitude),
          heading: p.heading,
          speed: p.speed,
          timestamp: p.timestamp,
        })),
        totalDistance: calculateRouteDistance(route),
        duration: route.length > 0 
          ? route[route.length - 1].timestamp.getTime() - route[0].timestamp.getTime()
          : 0,
      };
    }),
});
```

### 3. Progressive Web App Endpoints

PWA features require endpoints for push notification management.

#### 3.1 Push Notification Endpoints

**Procedure:** `pwa.subscribeToPush`

Registers a push notification subscription for the user's device.

```typescript
const subscribeToPushInput = z.object({
  endpoint: z.string().url(),
  p256dhKey: z.string(),
  authKey: z.string(),
  deviceType: z.enum(["android", "ios", "desktop"]).optional(),
  browserType: z.string().optional(),
});

pwa: router({
  subscribeToPush: protectedProcedure
    .input(subscribeToPushInput)
    .mutation(async ({ input, ctx }) => {
      await db.insert(pushSubscriptions)
        .values({
          userId: ctx.user.id,
          endpoint: input.endpoint,
          p256dhKey: input.p256dhKey,
          authKey: input.authKey,
          deviceType: input.deviceType,
          browserType: input.browserType,
        })
        .onDuplicateKeyUpdate({
          p256dhKey: input.p256dhKey,
          authKey: input.authKey,
          isActive: true,
          lastUsed: new Date(),
        });
      
      return { success: true };
    }),
});
```

**Procedure:** `pwa.updateNotificationPreferences`

Updates user's notification preferences.

```typescript
const updateNotificationPreferencesInput = z.object({
  enableRideUpdates: z.boolean().optional(),
  enableDriverAlerts: z.boolean().optional(),
  enableGovernance: z.boolean().optional(),
  enableInsurance: z.boolean().optional(),
});

pwa: router({
  updateNotificationPreferences: protectedProcedure
    .input(updateNotificationPreferencesInput)
    .mutation(async ({ input, ctx }) => {
      await db.update(pushSubscriptions)
        .set(input)
        .where(eq(pushSubscriptions.userId, ctx.user.id));
      
      return { success: true };
    }),
});
```

**Procedure:** `pwa.sendNotification` (Internal/Admin only)

Sends a push notification to a user. Called internally by ride status updates, etc.

```typescript
const sendNotificationInput = z.object({
  userId: z.number(),
  title: z.string().max(100),
  body: z.string().max(500),
  icon: z.string().url().optional(),
  data: z.record(z.any()).optional(),
  scheduledFor: z.date().optional(),
});

pwa: router({
  sendNotification: adminProcedure
    .input(sendNotificationInput)
    .mutation(async ({ input }) => {
      // Get all active subscriptions for user
      const subscriptions = await db.select()
        .from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.userId, input.userId),
          eq(pushSubscriptions.isActive, true)
        ));
      
      // Queue notifications for each subscription
      for (const sub of subscriptions) {
        await db.insert(notificationQueue).values({
          userId: input.userId,
          subscriptionId: sub.id,
          title: input.title,
          body: input.body,
          icon: input.icon,
          data: JSON.stringify(input.data),
          scheduledFor: input.scheduledFor,
        });
      }
      
      // Trigger background worker to process queue
      await triggerNotificationWorker();
      
      return { success: true, queuedCount: subscriptions.length };
    }),
});
```

### 4. Driver Application Endpoints

Enhanced driver application process with document upload and verification.

**Procedure:** `driver.uploadDocument`

Uploads a driver verification document to S3 and records metadata.

```typescript
const uploadDocumentInput = z.object({
  documentType: z.enum(["license", "insurance", "registration", "vehicle_photo", "profile_photo"]),
  fileData: z.string(), // base64 encoded
  fileName: z.string(),
  mimeType: z.string(),
  expiryDate: z.date().optional(),
});

driver: router({
  uploadDocument: protectedProcedure
    .input(uploadDocumentInput)
    .mutation(async ({ input, ctx }) => {
      const driver = await getDriverProfileByUserId(ctx.user.id);
      if (!driver) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver profile not found' });
      }
      
      // Decode base64 and upload to S3
      const fileBuffer = Buffer.from(input.fileData, 'base64');
      const fileKey = `driver-documents/${driver.id}/${input.documentType}-${Date.now()}.${input.fileName.split('.').pop()}`;
      
      const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
      
      // Record document
      await db.insert(driverDocuments).values({
        driverId: driver.id,
        userId: ctx.user.id,
        documentType: input.documentType,
        documentUrl: url,
        documentKey: fileKey,
        fileName: input.fileName,
        fileSize: fileBuffer.length,
        mimeType: input.mimeType,
        expiryDate: input.expiryDate,
        verificationStatus: "pending",
      });
      
      return { success: true, documentUrl: url };
    }),
});
```

**Procedure:** `admin.verifyDriverDocument`

Admin endpoint to approve or reject driver documents.

```typescript
const verifyDriverDocumentInput = z.object({
  documentId: z.number(),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

admin: router({
  verifyDriverDocument: adminProcedure
    .input(verifyDriverDocumentInput)
    .mutation(async ({ input, ctx }) => {
      await db.update(driverDocuments)
        .set({
          verificationStatus: input.status,
          verifiedBy: ctx.user.id,
          verifiedAt: new Date(),
          rejectionReason: input.rejectionReason,
        })
        .where(eq(driverDocuments.id, input.documentId));
      
      // Log admin action
      await db.insert(adminActions).values({
        adminId: ctx.user.id,
        actionType: `${input.status}_document`,
        entityType: "driver_document",
        entityId: input.documentId,
        notes: input.rejectionReason,
      });
      
      // Check if all documents are approved
      const document = await db.select()
        .from(driverDocuments)
        .where(eq(driverDocuments.id, input.documentId))
        .limit(1);
      
      if (document[0]) {
        const allDocuments = await db.select()
          .from(driverDocuments)
          .where(eq(driverDocuments.driverId, document[0].driverId));
        
        const requiredTypes = ["license", "insurance", "registration"];
        const allApproved = requiredTypes.every(type =>
          allDocuments.some(d => d.documentType === type && d.verificationStatus === "approved")
        );
        
        if (allApproved) {
          // Auto-approve driver
          await updateDriverProfile(document[0].driverId, {
            verificationStatus: "approved",
          });
        }
      }
      
      return { success: true };
    }),
});
```

### API Error Handling

All endpoints follow consistent error handling patterns:

| Error Code | HTTP Status | Usage |
|------------|-------------|-------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks required permissions |
| `NOT_FOUND` | 404 | Requested resource doesn't exist |
| `BAD_REQUEST` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource already exists or state conflict |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |

**Example error response:**

```typescript
{
  error: {
    message: "Driver profile not found",
    code: "NOT_FOUND",
    data: {
      userId: 123,
      path: "driver.uploadDocument"
    }
  }
}
```

### Rate Limiting

Critical endpoints implement rate limiting to prevent abuse:

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| `tracking.updateDriverLocation` | 20 requests | 1 minute |
| `pricing.calculateFare` | 30 requests | 1 minute |
| `driver.uploadDocument` | 10 requests | 1 hour |
| `pwa.sendNotification` | 100 requests | 1 hour |

---

## Component Architecture

This section defines the frontend component hierarchy, data flow patterns, and state management strategies for all outstanding features.

### 1. Component Hierarchy

The OpenRide frontend follows a hierarchical component structure with clear separation of concerns between layout, pages, features, and UI components.

```
client/src/
├── App.tsx                          # Root component with routing
├── main.tsx                         # Entry point with providers
├── index.css                        # Global styles and theme
├── components/
│   ├── ui/                          # shadcn/ui components (Button, Card, etc.)
│   ├── DashboardLayout.tsx          # Shared dashboard layout
│   ├── Map.tsx                      # Google Maps wrapper
│   └── AIChatBox.tsx                # AI chat interface
├── pages/
│   ├── Home.tsx                     # Landing page
│   ├── DriverDashboard.tsx          # Driver dashboard
│   ├── RiderDashboard.tsx           # Rider dashboard
│   ├── RideBooking.tsx              # Ride booking interface
│   ├── DriverApplication.tsx        # Driver application form
│   ├── Governance.tsx               # DAO governance
│   ├── Insurance.tsx                # Insurance management
│   ├── ExpansionDashboard.tsx       # Expansion management
│   └── [NEW PAGES TO ADD]
│       ├── RealTimeTracking.tsx     # Live ride tracking
│       ├── DemandHeatmap.tsx        # AI demand visualization
│       ├── AdminVerification.tsx    # Admin driver verification
│       └── NotificationSettings.tsx # PWA notification preferences
├── features/
│   ├── tracking/
│   │   ├── useDriverLocation.ts     # Real-time location hook
│   │   ├── useRideTracking.ts       # Ride tracking hook
│   │   └── LocationUpdater.tsx      # Background location updater
│   ├── ai/
│   │   ├── useDemandPredictions.ts  # Demand prediction hook
│   │   ├── useDynamicPricing.ts     # Dynamic pricing hook
│   │   └── DemandHeatmapLayer.tsx   # Map overlay component
│   ├── pwa/
│   │   ├── usePushNotifications.ts  # Push notification hook
│   │   ├── useServiceWorker.ts      # Service worker hook
│   │   └── InstallPrompt.tsx        # PWA install prompt
│   └── driver/
│       ├── useDocumentUpload.ts     # Document upload hook
│       └── DocumentUploader.tsx     # Document upload component
├── contexts/
│   ├── ThemeContext.tsx             # Theme provider (existing)
│   ├── AuthContext.tsx              # Auth state (existing via tRPC)
│   └── [NEW CONTEXTS TO ADD]
│       ├── LocationContext.tsx      # Driver location state
│       └── NotificationContext.tsx  # Notification state
├── hooks/
│   ├── useAuth.ts                   # Auth hook (existing)
│   └── [NEW HOOKS TO ADD]
│       ├── useGeolocation.ts        # Browser geolocation
│       ├── useRealTimeUpdates.ts    # WebSocket/polling
│       └── useOfflineSync.ts        # Offline data sync
└── lib/
    ├── trpc.ts                      # tRPC client (existing)
    └── [NEW UTILITIES TO ADD]
        ├── geolocation.ts           # Geolocation utilities
        ├── notifications.ts         # Notification helpers
        └── serviceWorker.ts         # Service worker registration
```

### 2. State Management Patterns

OpenRide uses a hybrid state management approach combining tRPC queries, React Context, and local component state.

#### 2.1 Server State (tRPC)

All server data is managed through tRPC queries and mutations with automatic caching and invalidation.

**Pattern: Optimistic Updates**

For instant feedback on user actions (e.g., toggling driver availability, updating ride status):

```typescript
const utils = trpc.useUtils();

const toggleAvailability = trpc.driver.toggleAvailability.useMutation({
  onMutate: async (newStatus) => {
    // Cancel outgoing refetches
    await utils.driver.getProfile.cancel();
    
    // Snapshot previous value
    const previousProfile = utils.driver.getProfile.getData();
    
    // Optimistically update
    utils.driver.getProfile.setData(undefined, (old) => 
      old ? { ...old, isAvailable: newStatus } : old
    );
    
    return { previousProfile };
  },
  onError: (err, newStatus, context) => {
    // Rollback on error
    utils.driver.getProfile.setData(undefined, context?.previousProfile);
  },
  onSettled: () => {
    // Refetch to ensure sync
    utils.driver.getProfile.invalidate();
  },
});
```

**Pattern: Real-Time Polling**

For frequently changing data (e.g., driver location, ride status):

```typescript
const { data: driverLocation } = trpc.tracking.getDriverLocation.useQuery(
  { driverId: ride.driverId },
  {
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: ride.status === "in_progress", // Only poll during active ride
  }
);
```

**Pattern: Infinite Queries**

For paginated data (e.g., ride history, demand data):

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = trpc.rider.getRideHistory.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);
```

#### 2.2 Client State (React Context)

Global client-side state that doesn't belong on the server is managed through React Context.

**LocationContext** - Manages driver's current location and background updates

```typescript
// contexts/LocationContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  isTracking: boolean;
  error: string | null;
};

type LocationContextType = {
  location: LocationState;
  startTracking: () => void;
  stopTracking: () => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    accuracy: null,
    isTracking: false,
    error: null,
  });
  
  const updateLocation = trpc.tracking.updateDriverLocation.useMutation();
  
  useEffect(() => {
    if (!location.isTracking) return;
    
    let watchId: number;
    
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed ? position.coords.speed * 3.6 : null, // m/s to km/h
            accuracy: position.coords.accuracy,
            isTracking: true,
            error: null,
          };
          
          setLocation(newLocation);
          
          // Send to server
          updateLocation.mutate({
            latitude: newLocation.latitude!,
            longitude: newLocation.longitude!,
            heading: newLocation.heading || undefined,
            speed: newLocation.speed || undefined,
            accuracy: newLocation.accuracy || undefined,
          });
        },
        (error) => {
          setLocation(prev => ({ ...prev, error: error.message }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
    
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [location.isTracking]);
  
  const startTracking = () => {
    setLocation(prev => ({ ...prev, isTracking: true }));
  };
  
  const stopTracking = () => {
    setLocation(prev => ({ ...prev, isTracking: false }));
  };
  
  return (
    <LocationContext.Provider value={{ location, startTracking, stopTracking }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocation must be used within LocationProvider");
  return context;
}
```

**NotificationContext** - Manages push notification state and preferences

```typescript
// contexts/NotificationContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type NotificationContextType = {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [isSupported] = useState(() => "Notification" in window && "serviceWorker" in navigator);
  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "denied"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const subscribeMutation = trpc.pwa.subscribeToPush.useMutation();
  
  useEffect(() => {
    if (!isSupported) return;
    
    // Check if already subscribed
    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    });
  }, [isSupported]);
  
  const subscribe = async () => {
    if (!isSupported) return;
    
    // Request permission
    const permission = await Notification.requestPermission();
    setPermission(permission);
    
    if (permission !== "granted") return;
    
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    });
    
    // Send subscription to server
    const subscriptionJSON = subscription.toJSON();
    await subscribeMutation.mutateAsync({
      endpoint: subscriptionJSON.endpoint!,
      p256dhKey: subscriptionJSON.keys!.p256dh,
      authKey: subscriptionJSON.keys!.auth,
      deviceType: getDeviceType(),
      browserType: getBrowserType(),
    });
    
    setIsSubscribed(true);
  };
  
  const unsubscribe = async () => {
    if (!isSupported) return;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      setIsSubscribed(false);
    }
  };
  
  return (
    <NotificationContext.Provider value={{ isSupported, isSubscribed, permission, subscribe, unsubscribe }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used within NotificationProvider");
  return context;
}

// Helper functions
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getDeviceType(): "android" | "ios" | "desktop" {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  return "desktop";
}

function getBrowserType(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari")) return "safari";
  return "unknown";
}
```

#### 2.3 Local Component State

Transient UI state that doesn't need to be shared is managed with `useState` and `useReducer`.

**Examples:**
- Form input values before submission
- Modal open/closed state
- Tab selection in multi-tab interfaces
- Loading states for local operations
- Temporary error messages

### 3. Data Flow Patterns

#### 3.1 Ride Booking Flow

```
User Action: Enter pickup/dropoff locations
    ↓
Component: RideBooking.tsx
    ↓
Hook: trpc.pricing.calculateFare.useQuery()
    ↓
Server: pricing.calculateFare procedure
    ↓
Response: Fare breakdown with surge pricing
    ↓
Component: Display fare estimate
    ↓
User Action: Confirm booking
    ↓
Hook: trpc.ride.createRide.useMutation()
    ↓
Server: 
  1. Create ride record
  2. Call matching.findBestDriver
  3. Record demand data
  4. Record pricing decision
  5. Send push notification to driver
    ↓
Response: Ride created with matched driver
    ↓
Component: Navigate to RealTimeTracking.tsx
    ↓
Hook: trpc.tracking.getDriverLocation.useQuery() (polling)
    ↓
Component: Display driver location on map
```

#### 3.2 Driver Location Update Flow

```
Component Mount: DriverDashboard.tsx
    ↓
Context: useLocation().startTracking()
    ↓
Browser API: navigator.geolocation.watchPosition()
    ↓
Callback: Every 5-10 seconds
    ↓
Context: Update local state
    ↓
Hook: trpc.tracking.updateDriverLocation.useMutation()
    ↓
Server:
  1. Upsert driver_locations table
  2. If on active ride, insert location_history
    ↓
Response: Success
    ↓
(Rider's polling query fetches updated location)
```

#### 3.3 Push Notification Flow

```
Server Event: Ride status changed
    ↓
Server: trpc.pwa.sendNotification.mutate()
    ↓
Database: Insert into notification_queue
    ↓
Background Worker: Process queue
    ↓
Web Push API: Send notification to device
    ↓
Service Worker: Receive push event
    ↓
Service Worker: Display notification
    ↓
User Action: Click notification
    ↓
Service Worker: Open app to relevant page
    ↓
App: Navigate to ride details
```

### 4. Component Design Patterns

#### 4.1 Container/Presenter Pattern

Separate data fetching (containers) from UI rendering (presenters) for better testability.

**Container Component:**

```typescript
// features/tracking/RealTimeTrackingContainer.tsx
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import RealTimeTrackingPresenter from "./RealTimeTrackingPresenter";

export default function RealTimeTrackingContainer() {
  const params = useParams<{ rideId: string }>();
  const rideId = parseInt(params.rideId);
  
  const { data: ride, isLoading: rideLoading } = trpc.ride.getRideById.useQuery({ rideId });
  const { data: location, isLoading: locationLoading } = trpc.tracking.getDriverLocation.useQuery(
    { driverId: ride?.driverId || 0, rideId },
    { enabled: !!ride, refetchInterval: 5000 }
  );
  
  if (rideLoading) return <LoadingSkeleton />;
  if (!ride) return <NotFound />;
  
  return (
    <RealTimeTrackingPresenter
      ride={ride}
      driverLocation={location}
      isLocationLoading={locationLoading}
    />
  );
}
```

**Presenter Component:**

```typescript
// features/tracking/RealTimeTrackingPresenter.tsx
import { MapView } from "@/components/Map";
import { Card } from "@/components/ui/card";

type Props = {
  ride: Ride;
  driverLocation: DriverLocation | undefined;
  isLocationLoading: boolean;
};

export default function RealTimeTrackingPresenter({ ride, driverLocation, isLocationLoading }: Props) {
  return (
    <div className="h-screen flex flex-col">
      {/* Map */}
      <div className="flex-1">
        <MapView
          center={driverLocation ? { lat: driverLocation.latitude, lng: driverLocation.longitude } : undefined}
          zoom={15}
          onMapReady={(map, google) => {
            // Add markers, route, etc.
          }}
        />
      </div>
      
      {/* Ride Info Card */}
      <Card className="absolute bottom-4 left-4 right-4 p-4">
        <h3 className="font-semibold">{ride.status}</h3>
        <p className="text-sm text-muted-foreground">
          Driver: {ride.driverName} • ETA: {ride.estimatedArrivalTime}
        </p>
        {isLocationLoading && <p className="text-xs">Updating location...</p>}
      </Card>
    </div>
  );
}
```

#### 4.2 Custom Hook Pattern

Extract complex logic into reusable hooks.

**Example: useDemandPredictions**

```typescript
// features/ai/useDemandPredictions.ts
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

export function useDemandPredictions(latitude: number, longitude: number, radius: number = 5000) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data, isLoading, refetch } = trpc.ai.getDemandPredictions.useQuery(
    { latitude, longitude, radius, hoursAhead: 4 },
    { 
      refetchInterval: autoRefresh ? 300000 : false, // Refresh every 5 minutes
      staleTime: 240000, // Consider stale after 4 minutes
    }
  );
  
  // Find best opportunity
  const bestOpportunity = data?.predictions.reduce((best, current) => 
    current.recommendedEarnings > (best?.recommendedEarnings || 0) ? current : best
  , data.predictions[0]);
  
  return {
    predictions: data?.predictions || [],
    bestOpportunity,
    isLoading,
    refetch,
    autoRefresh,
    setAutoRefresh,
  };
}
```

#### 4.3 Compound Component Pattern

For complex UI components with multiple related parts.

**Example: DocumentUploader**

```typescript
// features/driver/DocumentUploader.tsx
import { createContext, useContext, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

type DocumentUploaderContextType = {
  documentType: string;
  file: File | null;
  setFile: (file: File | null) => void;
  upload: () => Promise<void>;
  isUploading: boolean;
};

const DocumentUploaderContext = createContext<DocumentUploaderContextType | undefined>(undefined);

function DocumentUploader({ documentType, children }: { documentType: string; children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = trpc.driver.uploadDocument.useMutation();
  
  const upload = async () => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (!base64) return;
      
      await uploadMutation.mutateAsync({
        documentType,
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <DocumentUploaderContext.Provider value={{ documentType, file, setFile, upload, isUploading: uploadMutation.isLoading }}>
      {children}
    </DocumentUploaderContext.Provider>
  );
}

function FileInput() {
  const context = useContext(DocumentUploaderContext);
  if (!context) throw new Error("FileInput must be used within DocumentUploader");
  
  return (
    <input
      type="file"
      accept="image/*,application/pdf"
      onChange={(e) => context.setFile(e.target.files?.[0] || null)}
    />
  );
}

function UploadButton() {
  const context = useContext(DocumentUploaderContext);
  if (!context) throw new Error("UploadButton must be used within DocumentUploader");
  
  return (
    <Button onClick={context.upload} disabled={!context.file || context.isUploading}>
      {context.isUploading ? "Uploading..." : "Upload"}
    </Button>
  );
}

function Preview() {
  const context = useContext(DocumentUploaderContext);
  if (!context) throw new Error("Preview must be used within DocumentUploader");
  
  if (!context.file) return null;
  
  return (
    <Card className="p-4">
      <p className="text-sm">{context.file.name}</p>
      <p className="text-xs text-muted-foreground">{(context.file.size / 1024).toFixed(2)} KB</p>
    </Card>
  );
}

DocumentUploader.FileInput = FileInput;
DocumentUploader.UploadButton = UploadButton;
DocumentUploader.Preview = Preview;

export default DocumentUploader;

// Usage:
// <DocumentUploader documentType="license">
//   <DocumentUploader.FileInput />
//   <DocumentUploader.Preview />
//   <DocumentUploader.UploadButton />
// </DocumentUploader>
```

### 5. Performance Optimization Patterns

#### 5.1 Code Splitting

Lazy load heavy components to reduce initial bundle size.

```typescript
// App.tsx
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";

const RealTimeTracking = lazy(() => import("./pages/RealTimeTracking"));
const DemandHeatmap = lazy(() => import("./pages/DemandHeatmap"));
const AdminVerification = lazy(() => import("./pages/AdminVerification"));

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/ride/:rideId/track" component={RealTimeTracking} />
        <Route path="/driver/demand" component={DemandHeatmap} />
        <Route path="/admin/verification" component={AdminVerification} />
      </Switch>
    </Suspense>
  );
}
```

#### 5.2 Memoization

Prevent unnecessary re-renders of expensive components.

```typescript
import { memo } from "react";

const DemandHeatmapLayer = memo(({ predictions }: { predictions: DemandPrediction[] }) => {
  // Expensive map rendering logic
  return <HeatmapOverlay data={predictions} />;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if predictions actually changed
  return JSON.stringify(prevProps.predictions) === JSON.stringify(nextProps.predictions);
});
```

#### 5.3 Virtual Scrolling

For long lists (e.g., ride history, demand data).

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function RideHistoryList({ rides }: { rides: Ride[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: rides.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <RideCard ride={rides[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Algorithm Specifications

This section provides detailed pseudocode and mathematical formulations for all AI/ML algorithms and business logic.

### 1. Intelligent Driver-Rider Matching Algorithm

The matching algorithm balances multiple factors to optimize both rider experience and driver fairness.

#### 1.1 Algorithm Overview

**Objective:** Select the optimal driver for a ride request by maximizing a composite score that considers proximity, service quality, and fairness.

**Inputs:**
- Rider location (latitude, longitude)
- Rider rating (0-500, where 500 = 5.0 stars)
- Rider total rides
- List of available drivers within maximum radius
- Each driver's location, rating, total rides, acceptance rate

**Output:**
- Selected driver ID
- Match score (0-100)
- Premium match flag (boolean)

#### 1.2 Detailed Algorithm

```
FUNCTION findBestDriver(riderLat, riderLng, riderRating, riderTotalRides, maxRadius):
    
    // Step 1: Get all available drivers
    availableDrivers = getAvailableDrivers()
    
    // Step 2: Filter by distance
    driversInRange = []
    FOR EACH driver IN availableDrivers:
        distance = haversineDistance(riderLat, riderLng, driver.lat, driver.lng)
        IF distance <= maxRadius:
            driver.distance = distance
            driver.eta = estimateETA(distance, driver.speed)
            driversInRange.append(driver)
    
    IF driversInRange.isEmpty():
        RETURN null  // No drivers available
    
    // Step 3: Calculate match scores
    FOR EACH driver IN driversInRange:
        score = 50  // Base score
        
        // Proximity component (max 30 points)
        // Closer drivers get higher scores
        proximityScore = max(0, 30 - (driver.distance / 100))
        score += proximityScore
        
        // Rating component (max 25 points)
        // Higher rated drivers get higher scores
        ratingScore = (driver.rating / 500) * 25
        score += ratingScore
        
        // Experience component (max 15 points)
        // More experienced drivers get higher scores
        experienceScore = min(15, driver.totalRides / 10)
        score += experienceScore
        
        // Acceptance rate component (max 10 points)
        // Drivers who accept more rides get higher scores
        acceptanceScore = (driver.acceptanceRate / 100) * 10
        score += acceptanceScore
        
        // Premium matching bonus (20 points)
        isRiderPremium = (riderRating >= 480)  // 4.8+ stars
        isDriverPremium = (driver.rating >= 480)  // 4.8+ stars
        IF isRiderPremium AND isDriverPremium:
            score += 20
            driver.isPremiumMatch = true
        ELSE:
            driver.isPremiumMatch = false
        
        // Fairness adjustment
        // Penalize drivers who received many recent requests
        recentRequests = countRecentRequests(driver.id, last15Minutes)
        IF recentRequests > 3:
            score -= (recentRequests - 3) * 5  // -5 points per extra request
        
        driver.matchScore = min(100, max(0, round(score)))
    
    // Step 4: Sort by score and select best
    driversInRange.sortByDescending(driver.matchScore)
    bestDriver = driversInRange[0]
    
    // Step 5: Record decision for ML training
    recordMatchingDecision(
        rideId, riderId, bestDriver.id,
        availableDriverCount: driversInRange.length,
        matchScore: bestDriver.matchScore,
        isPremiumMatch: bestDriver.isPremiumMatch,
        // ... other metadata
    )
    
    RETURN bestDriver

FUNCTION haversineDistance(lat1, lng1, lat2, lng2):
    R = 6371000  // Earth radius in meters
    φ1 = lat1 * π / 180
    φ2 = lat2 * π / 180
    Δφ = (lat2 - lat1) * π / 180
    Δλ = (lng2 - lng1) * π / 180
    
    a = sin(Δφ/2)² + cos(φ1) * cos(φ2) * sin(Δλ/2)²
    c = 2 * atan2(√a, √(1-a))
    
    distance = R * c
    RETURN distance

FUNCTION estimateETA(distance, currentSpeed):
    IF currentSpeed > 0:
        avgSpeed = currentSpeed  // Use current speed
    ELSE:
        avgSpeed = 30  // Default 30 km/h
    
    timeHours = distance / (avgSpeed * 1000)  // distance in meters, speed in km/h
    timeSeconds = timeHours * 3600
    
    // Add buffer for stops, traffic
    buffer = timeSeconds * 0.2  // 20% buffer
    
    RETURN round(timeSeconds + buffer)
```

#### 1.3 Scoring Breakdown

| Component | Max Points | Formula | Rationale |
|-----------|-----------|---------|-----------|
| Base | 50 | Fixed | Ensures all drivers start with reasonable score |
| Proximity | 30 | `30 - (distance_meters / 100)` | Closer drivers reduce wait time |
| Rating | 25 | `(rating / 500) × 25` | Quality service improves rider satisfaction |
| Experience | 15 | `min(15, total_rides / 10)` | Experienced drivers are more reliable |
| Acceptance | 10 | `(acceptance_rate / 100) × 10` | Rewards drivers who accept rides |
| Premium | 20 | Bonus if both 4.8+ stars | Exceptional service for top riders |
| Fairness | -25 to 0 | `-5 × (recent_requests - 3)` | Distributes opportunities |

**Maximum possible score:** 150 points (capped at 100)

### 2. Dynamic Pricing Algorithm

The pricing algorithm adjusts fares in real-time based on supply, demand, and competitive factors while maintaining transparency and fairness.

#### 2.1 Algorithm Overview

**Objective:** Calculate optimal fare that balances driver earnings, rider affordability, and platform sustainability.

**Inputs:**
- Pickup location (latitude, longitude)
- Dropoff location (latitude, longitude)
- Estimated distance (meters)
- Estimated duration (seconds)
- Current time (hour, day of week)

**Output:**
- Base fare (cents)
- Distance fare (cents)
- Time fare (cents)
- Surge multiplier (100 = 1.0x)
- Total fare (cents)
- Fee breakdown

#### 2.2 Detailed Algorithm

```
FUNCTION calculateDynamicFare(pickupLat, pickupLng, dropoffLat, dropoffLng, distance, duration):
    
    // Step 1: Calculate base components
    baseFare = 300  // $3.00 minimum
    distanceFare = round(distance * 0.00015 * 100)  // $0.15 per km
    timeFare = round(duration * 0.005 * 100)  // $0.30 per minute
    subtotal = baseFare + distanceFare + timeFare
    
    // Step 2: Determine demand level
    gridCell = calculateGridCell(pickupLat, pickupLng)
    availableDrivers = countAvailableDriversInRadius(pickupLat, pickupLng, 5000)
    recentRequests = countRecentRequestsInCell(gridCell, last15Minutes)
    
    demandLevel = calculateDemandLevel(recentRequests, availableDrivers)
    baseSurge = getSurgeMultiplier(demandLevel)
    
    // Step 3: Time-of-day adjustment
    hour = getCurrentHour()
    dayOfWeek = getCurrentDayOfWeek()
    
    timeMultiplier = 100  // Default 1.0x
    IF hour IN [7,8,9,17,18,19]:  // Rush hours
        timeMultiplier = 110  // 1.1x
    IF dayOfWeek IN [5,6]:  // Friday, Saturday nights
        IF hour IN [22,23,0,1,2]:
            timeMultiplier = 115  // 1.15x
    
    // Step 4: Combine surge factors
    combinedSurge = round((baseSurge / 100) * (timeMultiplier / 100) * 100)
    combinedSurge = min(200, combinedSurge)  // Cap at 2.0x
    
    // Step 5: Competitive pricing check
    competitorPrice = fetchCompetitorPricing(pickupLat, pickupLng, dropoffLat, dropoffLng)
    
    IF competitorPrice IS NOT null:
        surgedTotal = round(subtotal * (combinedSurge / 100))
        maxAllowedPrice = round(competitorPrice * 1.10)  // Don't exceed by >10%
        
        IF surgedTotal > maxAllowedPrice:
            // Adjust surge to stay competitive
            combinedSurge = round((maxAllowedPrice / subtotal) * 100)
            combinedSurge = max(100, combinedSurge)  // Never go below 1.0x
    
    // Step 6: Calculate final fare
    surgeFare = round(subtotal * ((combinedSurge - 100) / 100))
    totalFare = subtotal + surgeFare
    
    // Step 7: Fee distribution
    networkFee = round(totalFare * 0.13)
    driverEarnings = totalFare - networkFee
    
    insuranceFee = round(totalFare * 0.10)
    developerFee = round(totalFare * 0.025)
    buybackFee = round(totalFare * 0.005)
    
    // Step 8: Record pricing decision
    recordPricingDecision(
        baseFare, distanceFare, timeFare,
        demandLevel, availableDrivers,
        surgeMultiplier: combinedSurge,
        finalFare: totalFare,
        competitorAvgPrice: competitorPrice
    )
    
    RETURN {
        baseFare, distanceFare, timeFare,
        surgeMultiplier: combinedSurge,
        surgeFare, totalFare,
        driverEarnings, networkFee,
        feeBreakdown: { insuranceFee, developerFee, buybackFee },
        demandLevel,
        competitorAvgPrice: competitorPrice,
        isPriceCompetitive: (competitorPrice ? totalFare <= competitorPrice * 1.1 : true)
    }

FUNCTION calculateDemandLevel(requestCount, driverCount):
    IF driverCount == 0:
        RETURN "surge"
    
    ratio = requestCount / driverCount
    
    IF ratio >= 3.0:
        RETURN "surge"
    ELSE IF ratio >= 2.0:
        RETURN "high"
    ELSE IF ratio >= 1.0:
        RETURN "medium"
    ELSE:
        RETURN "low"

FUNCTION getSurgeMultiplier(demandLevel):
    SWITCH demandLevel:
        CASE "low":
            RETURN 100  // 1.0x
        CASE "medium":
            RETURN 120  // 1.2x
        CASE "high":
            RETURN 150  // 1.5x
        CASE "surge":
            RETURN 200  // 2.0x (max)

FUNCTION calculateGridCell(lat, lng):
    // Round to 0.01 degrees (~1km resolution)
    gridLat = round(lat, 2)
    gridLng = round(lng, 2)
    RETURN gridLat + "_" + gridLng
```

#### 2.3 Pricing Formula

**Base Fare:**
```
Base = $3.00 (fixed minimum)
```

**Distance Fare:**
```
Distance Fare = Distance (km) × $0.15
              = Distance (m) × 0.00015
```

**Time Fare:**
```
Time Fare = Duration (min) × $0.30
          = Duration (sec) × 0.005
```

**Surge Multiplier:**
```
Demand Ratio = Recent Requests / Available Drivers

Surge = {
  1.0x  if ratio < 1.0  (low demand)
  1.2x  if 1.0 ≤ ratio < 2.0  (medium demand)
  1.5x  if 2.0 ≤ ratio < 3.0  (high demand)
  2.0x  if ratio ≥ 3.0  (surge)
}

Time Adjustment = {
  1.1x  if rush hour (7-9am, 5-7pm)
  1.15x if weekend night (Fri/Sat 10pm-2am)
  1.0x  otherwise
}

Combined Surge = min(2.0, Surge × Time Adjustment)
```

**Competitive Cap:**
```
IF Competitor Price exists:
  Max Allowed = Competitor Price × 1.10
  Final Surge = min(Combined Surge, Max Allowed / Subtotal)
```

**Total Fare:**
```
Subtotal = Base + Distance Fare + Time Fare
Surge Amount = Subtotal × (Surge Multiplier - 1.0)
Total = Subtotal + Surge Amount
```

**Fee Distribution:**
```
Network Fee (13%) = Total × 0.13
  ├─ Insurance (10%) = Total × 0.10
  ├─ Developer (2.5%) = Total × 0.025
  └─ Buyback (0.5%) = Total × 0.005

Driver Earnings (87%) = Total × 0.87
```

### 3. Demand Prediction Algorithm

The demand prediction algorithm uses historical data to forecast future ride demand by location and time.

#### 3.1 Algorithm Overview

**Objective:** Predict ride demand for each geographic grid cell for the next 24 hours to enable proactive driver positioning.

**Inputs:**
- Historical demand data (grid cell, hour, day, request count)
- Current time
- Prediction horizon (hours ahead)

**Output:**
- Predicted demand for each grid cell and hour
- Confidence score (0-100)

#### 3.2 Feature Engineering

```
FUNCTION extractFeatures(demandRecord):
    features = {
        // Temporal features
        hourOfDay: demandRecord.hour,  // 0-23
        dayOfWeek: demandRecord.dayOfWeek,  // 0-6
        isWeekend: (demandRecord.dayOfWeek IN [0,6]),
        isRushHour: (demandRecord.hour IN [7,8,9,17,18,19]),
        
        // Historical averages
        avgDemandThisHour: getAvgDemandForHour(demandRecord.gridCell, demandRecord.hour),
        avgDemandThisDay: getAvgDemandForDay(demandRecord.gridCell, demandRecord.dayOfWeek),
        
        // Recent trends
        demandLast1Hour: getSumDemand(demandRecord.gridCell, last1Hour),
        demandLast3Hours: getSumDemand(demandRecord.gridCell, last3Hours),
        demandLast24Hours: getSumDemand(demandRecord.gridCell, last24Hours),
        
        // Spatial features
        gridCellId: demandRecord.gridCell,
        neighborDemand: getAvgDemandInNeighbors(demandRecord.gridCell),
        
        // Supply features
        avgDriversAvailable: demandRecord.availableDrivers,
        
        // Outcome
        actualDemand: demandRecord.requestCount
    }
    RETURN features
```

#### 3.3 Prediction Model (Simplified Gradient Boosting)

```
FUNCTION trainDemandModel(historicalData):
    // Extract features for all historical records
    trainingData = []
    FOR EACH record IN historicalData:
        features = extractFeatures(record)
        trainingData.append(features)
    
    // Train gradient boosting model
    model = GradientBoostingRegressor(
        n_estimators: 100,
        max_depth: 5,
        learning_rate: 0.1,
        loss: 'squared_error'
    )
    
    X = trainingData.features
    y = trainingData.actualDemand
    
    model.fit(X, y)
    
    RETURN model

FUNCTION predictDemand(model, gridCell, targetHour, targetDay):
    // Build feature vector for prediction
    features = {
        hourOfDay: targetHour,
        dayOfWeek: targetDay,
        isWeekend: (targetDay IN [0,6]),
        isRushHour: (targetHour IN [7,8,9,17,18,19]),
        avgDemandThisHour: getAvgDemandForHour(gridCell, targetHour),
        avgDemandThisDay: getAvgDemandForDay(gridCell, targetDay),
        demandLast1Hour: getSumDemand(gridCell, last1Hour),
        demandLast3Hours: getSumDemand(gridCell, last3Hours),
        demandLast24Hours: getSumDemand(gridCell, last24Hours),
        gridCellId: gridCell,
        neighborDemand: getAvgDemandInNeighbors(gridCell),
        avgDriversAvailable: getCurrentAvgDrivers(gridCell)
    }
    
    // Make prediction
    predictedDemand = model.predict(features)
    
    // Calculate confidence based on historical variance
    historicalVariance = getVarianceForHour(gridCell, targetHour)
    confidence = max(0, min(100, 100 - (historicalVariance * 10)))
    
    RETURN {
        predictedDemand: round(predictedDemand),
        confidenceScore: round(confidence)
    }
```

#### 3.4 Batch Prediction Generation

```
FUNCTION generatePredictions(model, hoursAhead):
    predictions = []
    currentTime = getCurrentTime()
    
    // Get all active grid cells
    gridCells = getActiveGridCells()
    
    FOR hour IN range(1, hoursAhead + 1):
        targetTime = currentTime + hour * 3600
        targetHour = getHour(targetTime)
        targetDay = getDayOfWeek(targetTime)
        
        FOR EACH gridCell IN gridCells:
            prediction = predictDemand(model, gridCell, targetHour, targetDay)
            
            // Calculate recommended earnings
            avgFare = getAvgFareForCell(gridCell)
            expectedRides = prediction.predictedDemand / 5  // Assume driver captures 20% of demand
            recommendedEarnings = expectedRides * avgFare * 0.87  // After 13% fee
            
            predictions.append({
                gridCellId: gridCell,
                predictedTimestamp: targetTime,
                predictedHour: targetHour,
                predictedDemand: prediction.predictedDemand,
                confidenceScore: prediction.confidenceScore,
                predictedSurge: calculateExpectedSurge(prediction.predictedDemand),
                recommendedEarnings: round(recommendedEarnings),
                modelVersion: "1.0"
            })
    
    // Store predictions in database
    savePredictions(predictions)
    
    RETURN predictions

FUNCTION calculateExpectedSurge(predictedDemand):
    avgDrivers = 5  // Assume average driver availability
    ratio = predictedDemand / avgDrivers
    
    IF ratio >= 3.0:
        RETURN 200  // 2.0x
    ELSE IF ratio >= 2.0:
        RETURN 150  // 1.5x
    ELSE IF ratio >= 1.0:
        RETURN 120  // 1.2x
    ELSE:
        RETURN 100  // 1.0x
```

#### 3.5 Model Evaluation and Retraining

```
FUNCTION evaluateModel(model, testData):
    predictions = []
    actuals = []
    
    FOR EACH record IN testData:
        features = extractFeatures(record)
        predicted = model.predict(features)
        actual = record.actualDemand
        
        predictions.append(predicted)
        actuals.append(actual)
    
    // Calculate metrics
    mae = meanAbsoluteError(predictions, actuals)
    rmse = rootMeanSquaredError(predictions, actuals)
    r2 = r2Score(predictions, actuals)
    
    RETURN { mae, rmse, r2 }

FUNCTION retrainModel():
    // Retrain weekly with latest data
    historicalData = getDemandData(last90Days)
    
    // Split into train/test
    trainData = historicalData[0:80%]
    testData = historicalData[80%:100%]
    
    // Train new model
    newModel = trainDemandModel(trainData)
    
    // Evaluate
    metrics = evaluateModel(newModel, testData)
    
    // Deploy if better than current model
    IF metrics.mae < currentModel.mae:
        deployModel(newModel)
        logModelUpdate(metrics)
```

### 4. Geospatial Utilities

Common geospatial calculations used across algorithms.

#### 4.1 Grid Cell Calculation

```
FUNCTION calculateGridCell(latitude, longitude, precision = 0.01):
    // Round coordinates to specified precision
    // 0.01 degrees ≈ 1.1 km at equator
    gridLat = round(latitude / precision) * precision
    gridLng = round(longitude / precision) * precision
    
    RETURN gridLat + "_" + gridLng

FUNCTION getNeighborCells(gridCell):
    [lat, lng] = gridCell.split("_")
    precision = 0.01
    
    neighbors = []
    FOR dLat IN [-precision, 0, precision]:
        FOR dLng IN [-precision, 0, precision]:
            IF dLat == 0 AND dLng == 0:
                CONTINUE  // Skip center cell
            
            neighborLat = lat + dLat
            neighborLng = lng + dLng
            neighbors.append(neighborLat + "_" + neighborLng)
    
    RETURN neighbors
```

#### 4.2 Distance and ETA Calculations

```
FUNCTION haversineDistance(lat1, lng1, lat2, lng2):
    R = 6371000  // Earth radius in meters
    
    φ1 = lat1 * π / 180
    φ2 = lat2 * π / 180
    Δφ = (lat2 - lat1) * π / 180
    Δλ = (lng2 - lng1) * π / 180
    
    a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
    c = 2 × atan2(√a, √(1-a))
    
    distance = R × c
    RETURN distance

FUNCTION estimateETA(distance, currentSpeed = null):
    // Default speed assumptions
    IF currentSpeed IS null OR currentSpeed == 0:
        avgSpeed = 30  // km/h in urban areas
    ELSE:
        avgSpeed = currentSpeed
    
    // Convert distance (meters) to time (seconds)
    timeHours = distance / (avgSpeed * 1000)
    timeSeconds = timeHours * 3600
    
    // Add buffer for stops, traffic lights, etc.
    buffer = timeSeconds * 0.2  // 20% buffer
    
    RETURN round(timeSeconds + buffer)

FUNCTION calculateRouteDistance(locationPoints):
    totalDistance = 0
    
    FOR i IN range(1, locationPoints.length):
        prevPoint = locationPoints[i - 1]
        currPoint = locationPoints[i]
        
        segmentDistance = haversineDistance(
            prevPoint.latitude, prevPoint.longitude,
            currPoint.latitude, currPoint.longitude
        )
        
        totalDistance += segmentDistance
    
    RETURN totalDistance
```

---

## Third-Party Integrations

This section documents integration patterns for external services including Google Maps, Pi Network, and Web Push API.

### 1. Google Maps Integration

OpenRide uses the Manus proxy for Google Maps API access, providing full access to all Maps JavaScript API features without requiring API keys from users.

#### 1.1 Map Component Setup

The existing `Map.tsx` component provides a React wrapper around Google Maps with automatic proxy authentication.

**Basic Usage:**

```typescript
import { MapView } from "@/components/Map";

function RideBookingMap() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  
  return (
    <MapView
      center={{ lat: 43.65, lng: -79.38 }}
      zoom={13}
      onMapReady={(mapInstance, googleInstance) => {
        setMap(mapInstance);
        setGoogle(googleInstance);
      }}
    />
  );
}
```

#### 1.2 Places Autocomplete

For address input with autocomplete suggestions.

```typescript
import { MapView } from "@/components/Map";
import { useEffect, useRef } from "react";

function AddressInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  useEffect(() => {
    if (!google || !inputRef.current) return;
    
    const autocompleteInstance = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'ca' },  // Restrict to Canada
      fields: ['formatted_address', 'geometry', 'name'],
    });
    
    autocompleteInstance.addListener('place_changed', () => {
      const place = autocompleteInstance.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onLocationSelected({ lat, lng, address: place.formatted_address });
      }
    });
    
    setAutocomplete(autocompleteInstance);
  }, [google]);
  
  return (
    <>
      <MapView onMapReady={(_, g) => setGoogle(g)} />
      <input ref={inputRef} type="text" placeholder="Enter address" />
    </>
  );
}
```

#### 1.3 Directions Service

For route calculation and display.

```typescript
function RouteDisplay({ origin, destination }: { origin: LatLng; destination: LatLng }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  const [route, setRoute] = useState<google.maps.DirectionsResult | null>(null);
  
  useEffect(() => {
    if (!google || !map) return;
    
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
    });
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          setRoute(result);
          
          // Extract distance and duration
          const leg = result.routes[0].legs[0];
          const distance = leg.distance?.value;  // meters
          const duration = leg.duration?.value;  // seconds
          
          onRouteCalculated({ distance, duration });
        }
      }
    );
  }, [google, map, origin, destination]);
  
  return <MapView onMapReady={(m, g) => { setMap(m); setGoogle(g); }} />;
}
```

#### 1.4 Real-Time Driver Marker

For displaying and updating driver location on the map.

```typescript
function DriverMarker({ driverId, rideId }: { driverId: number; rideId: number }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  
  // Poll driver location every 5 seconds
  const { data: location } = trpc.tracking.getDriverLocation.useQuery(
    { driverId, rideId },
    { refetchInterval: 5000 }
  );
  
  useEffect(() => {
    if (!google || !map) return;
    
    // Create marker on first load
    if (!marker) {
      const newMarker = new google.maps.Marker({
        map: map,
        icon: {
          url: '/car-icon.png',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
      });
      setMarker(newMarker);
    }
  }, [google, map]);
  
  useEffect(() => {
    if (!marker || !location) return;
    
    // Animate marker to new position
    const newPosition = new google.maps.LatLng(location.latitude, location.longitude);
    
    // Smooth animation
    animateMarker(marker, newPosition, location.heading || 0);
    
    // Center map on driver
    map?.panTo(newPosition);
  }, [location, marker, map]);
  
  return <MapView onMapReady={(m, g) => { setMap(m); setGoogle(g); }} />;
}

function animateMarker(marker: google.maps.Marker, newPosition: google.maps.LatLng, heading: number) {
  const currentPosition = marker.getPosition();
  if (!currentPosition) {
    marker.setPosition(newPosition);
    return;
  }
  
  // Animate over 1 second
  const duration = 1000;
  const startTime = Date.now();
  
  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const lat = currentPosition.lat() + (newPosition.lat() - currentPosition.lat()) * progress;
    const lng = currentPosition.lng() + (newPosition.lng() - currentPosition.lng()) * progress;
    
    marker.setPosition(new google.maps.LatLng(lat, lng));
    
    // Rotate icon based on heading
    const icon = marker.getIcon() as google.maps.Icon;
    if (icon && typeof icon === 'object') {
      marker.setIcon({
        ...icon,
        rotation: heading,
      });
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  animate();
}
```

#### 1.5 Heatmap Layer (Demand Visualization)

For displaying demand predictions as a heatmap overlay.

```typescript
function DemandHeatmap({ predictions }: { predictions: DemandPrediction[] }) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [google, setGoogle] = useState<typeof window.google | null>(null);
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  
  useEffect(() => {
    if (!google || !map) return;
    
    // Convert predictions to heatmap data
    const heatmapData = predictions.map(p => ({
      location: new google.maps.LatLng(p.centerLat, p.centerLng),
      weight: p.predictedDemand,
    }));
    
    // Create or update heatmap
    if (!heatmap) {
      const newHeatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        radius: 50,
        opacity: 0.6,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(0, 0, 223, 1)',
          'rgba(0, 0, 191, 1)',
          'rgba(0, 0, 159, 1)',
          'rgba(0, 0, 127, 1)',
          'rgba(63, 0, 91, 1)',
          'rgba(127, 0, 63, 1)',
          'rgba(191, 0, 31, 1)',
          'rgba(255, 0, 0, 1)'
        ],
      });
      setHeatmap(newHeatmap);
    } else {
      heatmap.setData(heatmapData);
    }
  }, [google, map, predictions]);
  
  return <MapView onMapReady={(m, g) => { setMap(m); setGoogle(g); }} />;
}
```

### 2. Pi Network Integration

Pi Network SDK integration for cryptocurrency payments and KYC verification.

#### 2.1 SDK Initialization

```typescript
// lib/pi.ts
import { Pi } from "@pi-network/sdk";

let piInstance: Pi | null = null;

export function initializePi() {
  if (piInstance) return piInstance;
  
  piInstance = new Pi({
    version: "2.0",
    sandbox: import.meta.env.DEV, // Use sandbox in development
  });
  
  return piInstance;
}

export function getPi() {
  if (!piInstance) {
    throw new Error("Pi SDK not initialized. Call initializePi() first.");
  }
  return piInstance;
}
```

#### 2.2 User Authentication

```typescript
// hooks/usePiAuth.ts
import { useEffect, useState } from "react";
import { initializePi, getPi } from "@/lib/pi";

export function usePiAuth() {
  const [piUser, setPiUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    initializePi();
  }, []);
  
  const authenticate = async () => {
    const pi = getPi();
    
    try {
      const auth = await pi.authenticate(
        ['username', 'payments'],
        (payment) => {
          // Payment callback
          console.log('Payment approved:', payment);
        }
      );
      
      setPiUser(auth.user);
      setIsAuthenticated(true);
      
      return auth.user;
    } catch (error) {
      console.error('Pi authentication failed:', error);
      throw error;
    }
  };
  
  return { piUser, isAuthenticated, authenticate };
}
```

#### 2.3 Payment Processing

```typescript
// features/payment/usePiPayment.ts
import { getPi } from "@/lib/pi";
import { trpc } from "@/lib/trpc";

export function usePiPayment() {
  const verifyPayment = trpc.payment.verifyPiPayment.useMutation();
  
  const createPayment = async (amount: number, memo: string, metadata: any) => {
    const pi = getPi();
    
    try {
      // Create payment request
      const payment = await pi.createPayment({
        amount: amount,
        memo: memo,
        metadata: metadata,
      });
      
      // Poll for payment completion
      const paymentId = payment.identifier;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const paymentStatus = await pi.getPayment(paymentId);
        
        if (paymentStatus.status === 'completed') {
          // Verify payment on server
          const verification = await verifyPayment.mutateAsync({
            paymentId: paymentId,
            amount: amount,
          });
          
          return { success: true, payment: paymentStatus, verification };
        }
        
        if (paymentStatus.status === 'cancelled') {
          return { success: false, error: 'Payment cancelled by user' };
        }
        
        attempts++;
      }
      
      return { success: false, error: 'Payment timeout' };
    } catch (error) {
      console.error('Payment error:', error);
      return { success: false, error: error.message };
    }
  };
  
  return { createPayment };
}
```

#### 2.4 KYC Status Check

```typescript
// features/driver/usePiKYC.ts
import { getPi } from "@/lib/pi";
import { useEffect, useState } from "react";

export function usePiKYC() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'unverified'>('pending');
  
  const checkKYC = async () => {
    const pi = getPi();
    
    try {
      const user = await pi.authenticate(['username'], () => {});
      
      // Pi Network provides KYC status in user object
      if (user.user.kyc_verified) {
        setKycStatus('verified');
      } else {
        setKycStatus('unverified');
      }
      
      return user.user.kyc_verified;
    } catch (error) {
      console.error('KYC check failed:', error);
      setKycStatus('unverified');
      return false;
    }
  };
  
  useEffect(() => {
    checkKYC();
  }, []);
  
  return { kycStatus, checkKYC };
}
```

### 3. Progressive Web App (PWA) Integration

PWA features enable offline functionality, installability, and push notifications.

#### 3.1 Service Worker Registration

```typescript
// lib/serviceWorker.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('Service Worker registered:', registration.scope);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 3600000);
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    });
  }
}
```

#### 3.2 Service Worker Implementation

```javascript
// public/sw.js
const CACHE_NAME = 'openride-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API requests: network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        // Cache new assets
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    data: data.data || {},
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'OpenRide', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

#### 3.3 Web App Manifest

```json
// public/manifest.json
{
  "name": "OpenRide",
  "short_name": "OpenRide",
  "description": "Decentralized rideshare and delivery platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshot-mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshot-desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["travel", "navigation"],
  "shortcuts": [
    {
      "name": "Book a Ride",
      "short_name": "Book Ride",
      "description": "Quickly book a ride",
      "url": "/book",
      "icons": [{ "src": "/icon-ride.png", "sizes": "96x96" }]
    },
    {
      "name": "Send a Package",
      "short_name": "Send Package",
      "description": "Send a package for delivery",
      "url": "/delivery",
      "icons": [{ "src": "/icon-delivery.png", "sizes": "96x96" }]
    }
  ]
}
```

#### 3.4 Install Prompt Component

```typescript
// features/pwa/InstallPrompt.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };
  
  if (!showPrompt || localStorage.getItem('installPromptDismissed')) {
    return null;
  }
  
  return (
    <Card className="fixed bottom-4 left-4 right-4 p-4 shadow-lg z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
      >
        <X className="w-4 h-4" />
      </button>
      
      <h3 className="font-semibold mb-2">Install OpenRide</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Install our app for quick access and offline features
      </p>
      
      <div className="flex gap-2">
        <Button onClick={handleInstall} className="flex-1">
          Install
        </Button>
        <Button onClick={handleDismiss} variant="outline" className="flex-1">
          Not now
        </Button>
      </div>
    </Card>
  );
}
```

---

## File Structure & Organization

This section defines the complete file structure for implementing all outstanding features.

### 1. Database Schema Files

```
drizzle/
├── schema.ts                    # Main schema export (existing)
├── ml-schema.ts                 # AI/ML tables (NEW)
│   ├── demandData
│   ├── demandPredictions
│   ├── pricingDecisions
│   └── matchingDecisions
├── tracking-schema.ts           # Real-time tracking tables (NEW)
│   ├── driverLocations
│   └── locationHistory
├── pwa-schema.ts                # PWA tables (NEW)
│   ├── pushSubscriptions
│   └── notificationQueue
└── driver-schema.ts             # Enhanced driver tables (NEW)
    ├── driverDocuments
    └── adminActions
```

### 2. Server-Side Files

```
server/
├── routers.ts                   # Main router export (existing)
├── db.ts                        # Database helpers (existing)
├── ai-routers.ts                # AI/ML endpoints (NEW)
│   ├── getDemandPredictions
│   ├── recordDemandData
│   └── generatePredictions
├── pricing-routers.ts           # Dynamic pricing endpoints (NEW)
│   ├── calculateFare
│   └── recordPricingDecision
├── matching-routers.ts          # Matching endpoints (NEW)
│   ├── findBestDriver
│   └── recordMatchingDecision
├── tracking-routers.ts          # Location tracking endpoints (NEW)
│   ├── updateDriverLocation
│   ├── getDriverLocation
│   └── getRideRoute
├── pwa-routers.ts               # PWA endpoints (NEW)
│   ├── subscribeToPush
│   ├── updateNotificationPreferences
│   └── sendNotification
├── driver-routers.ts            # Enhanced driver endpoints (NEW)
│   ├── uploadDocument
│   └── getApplicationStatus
├── admin-routers.ts             # Admin endpoints (NEW)
│   ├── verifyDriverDocument
│   ├── getPendingApplications
│   └── getAdminActions
├── services/                    # Business logic services (NEW)
│   ├── demandPrediction.ts
│   ├── dynamicPricing.ts
│   ├── matching.ts
│   ├── notifications.ts
│   └── geospatial.ts
└── workers/                     # Background workers (NEW)
    ├── predictionGenerator.ts
    └── notificationProcessor.ts
```

### 3. Client-Side Files

```
client/src/
├── pages/                       # Page components
│   ├── Home.tsx                 # Landing page (existing)
│   ├── RideBooking.tsx          # Ride booking (existing)
│   ├── DriverDashboard.tsx      # Driver dashboard (existing)
│   ├── RiderDashboard.tsx       # Rider dashboard (existing)
│   ├── RealTimeTracking.tsx     # Live ride tracking (NEW)
│   ├── DemandHeatmap.tsx        # AI demand visualization (NEW)
│   ├── DriverApplication.tsx    # Enhanced driver application (NEW)
│   ├── AdminVerification.tsx    # Admin driver verification (NEW)
│   └── NotificationSettings.tsx # PWA notification preferences (NEW)
├── features/                    # Feature modules
│   ├── tracking/                # Real-time tracking (NEW)
│   │   ├── useDriverLocation.ts
│   │   ├── useRideTracking.ts
│   │   ├── LocationUpdater.tsx
│   │   ├── DriverMarker.tsx
│   │   └── RouteDisplay.tsx
│   ├── ai/                      # AI features (NEW)
│   │   ├── useDemandPredictions.ts
│   │   ├── useDynamicPricing.ts
│   │   ├── DemandHeatmapLayer.tsx
│   │   └── PricingBreakdown.tsx
│   ├── pwa/                     # PWA features (NEW)
│   │   ├── usePushNotifications.ts
│   │   ├── useServiceWorker.ts
│   │   ├── InstallPrompt.tsx
│   │   └── NotificationPermissionPrompt.tsx
│   ├── driver/                  # Driver features (NEW)
│   │   ├── useDocumentUpload.ts
│   │   ├── DocumentUploader.tsx
│   │   ├── ApplicationStatus.tsx
│   │   └── DocumentVerificationBadge.tsx
│   └── payment/                 # Pi Network payment (NEW)
│       ├── usePiPayment.ts
│       ├── usePiAuth.ts
│       ├── usePiKYC.ts
│       └── PaymentFlow.tsx
├── contexts/                    # React contexts
│   ├── ThemeContext.tsx         # Theme provider (existing)
│   ├── LocationContext.tsx      # Driver location state (NEW)
│   └── NotificationContext.tsx  # Notification state (NEW)
├── hooks/                       # Custom hooks
│   ├── useAuth.ts               # Auth hook (existing)
│   ├── useGeolocation.ts        # Browser geolocation (NEW)
│   ├── useRealTimeUpdates.ts    # WebSocket/polling (NEW)
│   └── useOfflineSync.ts        # Offline data sync (NEW)
├── lib/                         # Utilities
│   ├── trpc.ts                  # tRPC client (existing)
│   ├── pi.ts                    # Pi Network SDK (NEW)
│   ├── geolocation.ts           # Geolocation utilities (NEW)
│   ├── notifications.ts         # Notification helpers (NEW)
│   └── serviceWorker.ts         # Service worker registration (NEW)
└── components/                  # Shared components
    ├── ui/                      # shadcn/ui components (existing)
    ├── Map.tsx                  # Google Maps wrapper (existing)
    ├── DashboardLayout.tsx      # Dashboard layout (existing)
    └── [NEW COMPONENTS]
        ├── RideStatusCard.tsx
        ├── DriverInfoCard.tsx
        ├── FareBreakdownCard.tsx
        └── DemandHeatmapLegend.tsx
```

### 4. Public Assets

```
client/public/
├── manifest.json                # PWA manifest (NEW)
├── sw.js                        # Service worker (NEW)
├── icon-72.png                  # PWA icons (NEW)
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png
├── icon-384.png
├── icon-512.png
├── badge-72.png                 # Notification badge (NEW)
├── car-icon.png                 # Driver marker icon (NEW)
├── screenshot-mobile.png        # PWA screenshots (NEW)
└── screenshot-desktop.png
```

---

## UI/UX Design & Component Hierarchy

This section provides wireframes and component specifications for all new pages.

### 1. Real-Time Tracking Page

**Route:** `/ride/:rideId/track`

**Purpose:** Display live driver location and ride status during active rides.

**Component Hierarchy:**

```
RealTimeTracking
├── MapView (full screen)
│   ├── DriverMarker (animated)
│   ├── PickupMarker
│   ├── DropoffMarker
│   └── RoutePolyline
├── RideStatusCard (bottom overlay)
│   ├── StatusBadge ("Arriving", "In Progress", etc.)
│   ├── DriverInfo
│   │   ├── Avatar
│   │   ├── Name
│   │   ├── Rating
│   │   └── VehicleInfo
│   ├── ETADisplay
│   ├── FareDisplay
│   └── ActionButtons
│       ├── ContactDriver
│       ├── ShareRide
│       └── CancelRide
└── EmergencyButton (floating, top-right)
```

**Layout:**

- Full-screen map with driver marker updating every 5 seconds
- Bottom card with ride details, semi-transparent background
- Emergency SOS button always visible in top-right corner
- Route displayed as blue polyline from pickup to dropoff
- Driver marker rotates based on heading, animates smoothly between updates

**Key Interactions:**

- Tap driver marker to show info window with name and vehicle
- Tap "Contact Driver" to open phone dialer
- Tap "Share Ride" to copy live tracking link
- Tap "Emergency" to trigger SOS alert to emergency contacts
- Map auto-centers on driver location, user can pan/zoom manually

### 2. Demand Heatmap Page

**Route:** `/driver/demand`

**Purpose:** Show AI-predicted demand hotspots to help drivers position optimally.

**Component Hierarchy:**

```
DemandHeatmap
├── MapView (full screen)
│   ├── HeatmapLayer (demand visualization)
│   ├── DriverLocationMarker (current position)
│   └── RecommendedZoneMarkers
├── DemandLegend (top-left overlay)
│   ├── ColorScale
│   └── DemandLevels
├── PredictionCard (bottom overlay)
│   ├── TimeSelector (next 1-4 hours)
│   ├── TopOpportunities (list)
│   │   └── OpportunityCard
│   │       ├── Location
│   │       ├── PredictedDemand
│   │       ├── ConfidenceScore
│   │       └── EstimatedEarnings
│   └── RefreshButton
└── SettingsButton (top-right)
    └── AutoRefreshToggle
```

**Layout:**

- Full-screen map with heatmap overlay showing demand intensity
- Color gradient from blue (low demand) to red (high demand)
- Legend in top-left explaining color scale
- Bottom card showing top 3 opportunities with earnings estimates
- Time selector to view predictions for 1-4 hours ahead

**Key Interactions:**

- Tap opportunity card to center map on that location
- Swipe time selector to change prediction horizon
- Tap "Navigate" to open directions to recommended zone
- Toggle auto-refresh to update predictions every 5 minutes
- Heatmap updates when time selection changes

### 3. Driver Application Page

**Route:** `/driver/apply`

**Purpose:** Enhanced driver application with document upload and real-time verification status.

**Component Hierarchy:**

```
DriverApplication
├── ProgressStepper
│   ├── Step1: Personal Info
│   ├── Step2: Vehicle Info
│   ├── Step3: Documents
│   └── Step4: Review
├── StepContent
│   ├── PersonalInfoForm (Step 1)
│   │   ├── NameInput
│   │   ├── PhoneInput
│   │   ├── EmailInput
│   │   └── PiKYCStatus
│   ├── VehicleInfoForm (Step 2)
│   │   ├── MakeInput
│   │   ├── ModelInput
│   │   ├── YearInput
│   │   ├── ColorInput
│   │   └── LicensePlateInput
│   ├── DocumentUploadForm (Step 3)
│   │   ├── DocumentUploader (License)
│   │   │   ├── FileInput
│   │   │   ├── Preview
│   │   │   ├── UploadButton
│   │   │   └── VerificationBadge
│   │   ├── DocumentUploader (Insurance)
│   │   ├── DocumentUploader (Registration)
│   │   └── DocumentUploader (Vehicle Photo)
│   └── ReviewForm (Step 4)
│       ├── SummaryCard
│       ├── DocumentChecklist
│       └── SubmitButton
└── ApplicationStatus (after submission)
    ├── StatusBadge
    ├── PendingDocuments
    └── ApprovedDocuments
```

**Layout:**

- Stepper at top showing 4 steps with progress indicator
- Form content in center with clear labels and validation
- Document upload with drag-and-drop support
- Real-time verification badges (pending/approved/rejected)
- Review step shows all entered information for confirmation

**Key Interactions:**

- Click "Next" to advance to next step (with validation)
- Click "Back" to return to previous step
- Drag-and-drop files or click to browse
- Upload button shows progress spinner during upload
- Verification badge updates when admin approves/rejects
- Submit button triggers final application submission

### 4. Admin Verification Dashboard

**Route:** `/admin/verification`

**Purpose:** Admin interface for reviewing and approving driver applications.

**Component Hierarchy:**

```
AdminVerification
├── FilterBar
│   ├── StatusFilter (All/Pending/Approved/Rejected)
│   ├── DateFilter
│   └── SearchInput
├── ApplicationList
│   └── ApplicationCard (for each pending application)
│       ├── ApplicantInfo
│       │   ├── Name
│       │   ├── Email
│       │   ├── Phone
│       │   └── PiKYCBadge
│       ├── VehicleInfo
│       ├── DocumentGrid
│       │   └── DocumentThumbnail (clickable)
│       ├── ActionButtons
│       │   ├── ApproveButton
│       │   ├── RejectButton
│       │   └── ViewDetailsButton
│       └── SubmittedDate
└── DocumentModal (when thumbnail clicked)
    ├── FullSizeImage
    ├── DocumentInfo
    │   ├── Type
    │   ├── UploadDate
    │   └── ExpiryDate
    └── VerificationActions
        ├── ApproveDocument
        └── RejectDocument (with reason)
```

**Layout:**

- Filter bar at top for sorting/searching applications
- List of application cards with key info and thumbnails
- Click thumbnail to open full-size document in modal
- Approve/Reject buttons with confirmation dialogs
- Rejected applications show rejection reason

**Key Interactions:**

- Click "Approve" to approve entire application
- Click "Reject" to open rejection reason dialog
- Click document thumbnail to view full-size
- Click "Approve Document" to approve individual document
- Click "Reject Document" to reject with reason
- Filter updates list in real-time

### 5. Notification Settings Page

**Route:** `/settings/notifications`

**Purpose:** Manage push notification preferences and subscription status.

**Component Hierarchy:**

```
NotificationSettings
├── SubscriptionStatus
│   ├── StatusBadge (Subscribed/Not Subscribed)
│   ├── SubscribeButton (if not subscribed)
│   └── UnsubscribeButton (if subscribed)
├── PreferencesForm
│   ├── PreferenceToggle (Ride Updates)
│   ├── PreferenceToggle (Driver Alerts)
│   ├── PreferenceToggle (Governance)
│   └── PreferenceToggle (Insurance)
├── TestNotificationButton
└── NotificationHistory
    └── NotificationCard (recent notifications)
        ├── Title
        ├── Body
        ├── Timestamp
        └── ReadStatus
```

**Layout:**

- Subscription status at top with prominent subscribe button
- Toggle switches for each notification category
- Test button to send sample notification
- History list showing recent notifications

**Key Interactions:**

- Click "Subscribe" to request notification permission
- Toggle switches update preferences immediately
- Click "Test" to send test notification
- Click notification in history to mark as read

---

## Implementation Checklist

This checklist ensures all components are implemented in the correct order with proper dependencies.

### Phase 1: Database & Backend Foundation

- [ ] Create `drizzle/ml-schema.ts` with AI/ML tables
- [ ] Create `drizzle/tracking-schema.ts` with location tables
- [ ] Create `drizzle/pwa-schema.ts` with PWA tables
- [ ] Create `drizzle/driver-schema.ts` with enhanced driver tables
- [ ] Run `pnpm db:push` to apply schema changes
- [ ] Create `server/services/geospatial.ts` with utility functions
- [ ] Create `server/services/demandPrediction.ts` with ML logic
- [ ] Create `server/services/dynamicPricing.ts` with pricing algorithm
- [ ] Create `server/services/matching.ts` with matching algorithm
- [ ] Create `server/services/notifications.ts` with push notification logic

### Phase 2: API Endpoints

- [ ] Create `server/ai-routers.ts` with demand prediction endpoints
- [ ] Create `server/pricing-routers.ts` with fare calculation endpoints
- [ ] Create `server/matching-routers.ts` with driver matching endpoints
- [ ] Create `server/tracking-routers.ts` with location tracking endpoints
- [ ] Create `server/pwa-routers.ts` with push notification endpoints
- [ ] Create `server/driver-routers.ts` with document upload endpoints
- [ ] Create `server/admin-routers.ts` with verification endpoints
- [ ] Export all new routers from `server/routers.ts`
- [ ] Write unit tests for all new procedures

### Phase 3: Third-Party Integrations

- [ ] Create `lib/pi.ts` with Pi Network SDK initialization
- [ ] Create `lib/serviceWorker.ts` with service worker registration
- [ ] Create `public/sw.js` with service worker implementation
- [ ] Create `public/manifest.json` with PWA manifest
- [ ] Generate PWA icons in all required sizes
- [ ] Test Pi Network authentication flow
- [ ] Test push notification subscription

### Phase 4: Frontend State Management

- [ ] Create `contexts/LocationContext.tsx` for driver location state
- [ ] Create `contexts/NotificationContext.tsx` for notification state
- [ ] Create `hooks/useGeolocation.ts` for browser geolocation
- [ ] Create `hooks/usePiAuth.ts` for Pi authentication
- [ ] Create `hooks/usePiPayment.ts` for Pi payments
- [ ] Create `hooks/usePiKYC.ts` for KYC verification
- [ ] Create `hooks/usePushNotifications.ts` for push notifications

### Phase 5: Feature Components

- [ ] Create `features/tracking/useDriverLocation.ts`
- [ ] Create `features/tracking/DriverMarker.tsx`
- [ ] Create `features/tracking/RouteDisplay.tsx`
- [ ] Create `features/ai/useDemandPredictions.ts`
- [ ] Create `features/ai/DemandHeatmapLayer.tsx`
- [ ] Create `features/ai/useDynamicPricing.ts`
- [ ] Create `features/pwa/InstallPrompt.tsx`
- [ ] Create `features/driver/DocumentUploader.tsx`
- [ ] Create `features/payment/PaymentFlow.tsx`

### Phase 6: Page Components

- [ ] Create `pages/RealTimeTracking.tsx`
- [ ] Create `pages/DemandHeatmap.tsx`
- [ ] Update `pages/DriverApplication.tsx` with document upload
- [ ] Create `pages/AdminVerification.tsx`
- [ ] Create `pages/NotificationSettings.tsx`
- [ ] Add routes to `App.tsx`
- [ ] Test all page navigation flows

### Phase 7: Testing & Optimization

- [ ] Write Playwright tests for ride booking flow
- [ ] Write Playwright tests for driver application flow
- [ ] Write Playwright tests for admin verification flow
- [ ] Write Playwright tests for real-time tracking
- [ ] Test PWA installation on Android
- [ ] Test PWA installation on iOS
- [ ] Test push notifications on all platforms
- [ ] Optimize bundle size with code splitting
- [ ] Test offline functionality

### Phase 8: Deployment

- [ ] Generate production build
- [ ] Test service worker in production mode
- [ ] Verify all environment variables are set
- [ ] Run database migrations on production
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Test critical user flows in production

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Complete and ready for implementation

