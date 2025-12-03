/**
 * Machine Learning & Analytics Schema
 * 
 * Tables for collecting data to train ML models for:
 * - Demand prediction
 * - Dynamic pricing
 * - Driver positioning
 * - Intelligent matching
 */

import { int, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";
import { users, driverProfiles, rides } from "./schema";

// ============================================================================
// DEMAND ANALYTICS
// ============================================================================

/**
 * Tracks ride demand patterns by location and time
 * Used for: Demand prediction, driver positioning recommendations
 */
export const demandAnalytics = mysqlTable("demand_analytics", {
  id: int("id").autoincrement().primaryKey(),
  // Location (grid-based for heatmap)
  locationLat: varchar("locationLat", { length: 20 }).notNull(),
  locationLng: varchar("locationLng", { length: 20 }).notNull(),
  gridCellId: varchar("gridCellId", { length: 50 }).notNull(), // e.g., "lat_43.65_lng_-79.38"
  // Time patterns
  hourOfDay: int("hourOfDay").notNull(), // 0-23
  dayOfWeek: int("dayOfWeek").notNull(), // 0-6 (Sunday=0)
  isWeekend: boolean("isWeekend").notNull(),
  isHoliday: boolean("isHoliday").default(false).notNull(),
  // Demand metrics
  requestCount: int("requestCount").default(0).notNull(),
  completedRideCount: int("completedRideCount").default(0).notNull(),
  cancelledRideCount: int("cancelledRideCount").default(0).notNull(),
  averageWaitTime: int("averageWaitTime"), // seconds
  averageFare: int("averageFare"), // cents
  // Supply metrics
  availableDriverCount: int("availableDriverCount").default(0).notNull(),
  supplyDemandRatio: int("supplyDemandRatio"), // ratio * 100 (e.g., 150 = 1.5)
  // Timestamps
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DemandAnalytic = typeof demandAnalytics.$inferSelect;
export type InsertDemandAnalytic = typeof demandAnalytics.$inferInsert;

// ============================================================================
// PRICING HISTORY
// ============================================================================

/**
 * Tracks pricing decisions and outcomes
 * Used for: Dynamic pricing optimization, competitive analysis
 */
export const pricingHistory = mysqlTable("pricing_history", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").references(() => rides.id),
  // Location context
  pickupGridCell: varchar("pickupGridCell", { length: 50 }).notNull(),
  dropoffGridCell: varchar("dropoffGridCell", { length: 50 }).notNull(),
  distance: int("distance").notNull(), // meters
  // Time context
  requestedAt: timestamp("requestedAt").notNull(),
  hourOfDay: int("hourOfDay").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  isWeekend: boolean("isWeekend").notNull(),
  // Pricing
  baseFare: int("baseFare").notNull(), // cents
  surgeMultiplier: int("surgeMultiplier").default(100).notNull(), // multiplier * 100 (e.g., 150 = 1.5x)
  finalFare: int("finalFare").notNull(), // cents
  competitorAvgPrice: int("competitorAvgPrice"), // cents (from external API)
  // Demand context
  demandLevel: varchar("demandLevel", { length: 20 }).notNull(), // low, medium, high, surge
  availableDrivers: int("availableDrivers").notNull(),
  pendingRequests: int("pendingRequests").notNull(),
  // Outcome
  wasAccepted: boolean("wasAccepted").notNull(),
  acceptanceTime: int("acceptanceTime"), // seconds until accepted
  wasCompleted: boolean("wasCompleted").notNull(),
  customerRating: int("customerRating"), // rating * 100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PricingHistory = typeof pricingHistory.$inferSelect;
export type InsertPricingHistory = typeof pricingHistory.$inferInsert;

// ============================================================================
// DRIVER POSITIONING RECOMMENDATIONS
// ============================================================================

/**
 * AI-generated recommendations for where drivers should position themselves
 * Used for: Driver notifications, earnings optimization
 */
export const driverPositioningRecommendations = mysqlTable("driver_positioning_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => driverProfiles.id),
  // Recommended location
  recommendedLat: varchar("recommendedLat", { length: 20 }).notNull(),
  recommendedLng: varchar("recommendedLng", { length: 20 }).notNull(),
  recommendedGridCell: varchar("recommendedGridCell", { length: 50 }).notNull(),
  locationName: varchar("locationName", { length: 200 }), // e.g., "Downtown Toronto"
  // Prediction metrics
  predictedDemand: int("predictedDemand").notNull(), // expected rides per hour
  predictedEarnings: int("predictedEarnings").notNull(), // cents per hour
  confidenceScore: int("confidenceScore").notNull(), // confidence * 100 (0-100)
  // Time window
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  // Status
  wasSent: boolean("wasSent").default(false).notNull(),
  wasFollowed: boolean("wasFollowed").default(false).notNull(),
  actualEarnings: int("actualEarnings"), // cents (tracked if followed)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DriverPositioningRecommendation = typeof driverPositioningRecommendations.$inferSelect;
export type InsertDriverPositioningRecommendation = typeof driverPositioningRecommendations.$inferInsert;

// ============================================================================
// MATCHING ANALYTICS
// ============================================================================

/**
 * Tracks driver-rider matching decisions and outcomes
 * Used for: Intelligent matching optimization, premium service quality
 */
export const matchingAnalytics = mysqlTable("matching_analytics", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  riderId: int("riderId").notNull().references(() => users.id),
  driverId: int("driverId").references(() => driverProfiles.id),
  // Rider context
  riderRating: int("riderRating").notNull(), // rating * 100
  riderTotalRides: int("riderTotalRides").notNull(),
  riderIsPremium: boolean("riderIsPremium").default(false).notNull(), // 5-star rider
  // Driver context (at time of match)
  driverRating: int("driverRating"), // rating * 100
  driverTotalRides: int("driverTotalRides"),
  driverIsPremium: boolean("driverIsPremium").default(false).notNull(), // 5-star driver
  driverDistance: int("driverDistance"), // meters from pickup
  driverEta: int("driverEta"), // seconds
  // Matching decision
  matchingAlgorithm: varchar("matchingAlgorithm", { length: 50 }).notNull(), // "nearest", "premium", "balanced"
  wasPremiumMatch: boolean("wasPremiumMatch").default(false).notNull(), // 5-star to 5-star
  matchScore: int("matchScore"), // algorithm confidence * 100
  // Outcome
  wasAccepted: boolean("wasAccepted").notNull(),
  wasCompleted: boolean("wasCompleted").notNull(),
  finalRiderRating: int("finalRiderRating"), // rating given by driver
  finalDriverRating: int("finalDriverRating"), // rating given by rider
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MatchingAnalytic = typeof matchingAnalytics.$inferSelect;
export type InsertMatchingAnalytic = typeof matchingAnalytics.$inferInsert;

// ============================================================================
// ML MODEL PERFORMANCE
// ============================================================================

/**
 * Tracks ML model performance metrics
 * Used for: Model monitoring, A/B testing, continuous improvement
 */
export const mlModelPerformance = mysqlTable("ml_model_performance", {
  id: int("id").autoincrement().primaryKey(),
  modelName: varchar("modelName", { length: 100 }).notNull(), // "demand_prediction_v1", "pricing_optimizer_v2"
  modelVersion: varchar("modelVersion", { length: 50 }).notNull(),
  // Performance metrics
  accuracyScore: int("accuracyScore"), // accuracy * 100
  precisionScore: int("precisionScore"), // precision * 100
  recallScore: int("recallScore"), // recall * 100
  f1Score: int("f1Score"), // F1 * 100
  maeScore: int("maeScore"), // Mean Absolute Error
  rmseScore: int("rmseScore"), // Root Mean Squared Error
  // Business metrics
  revenueImpact: int("revenueImpact"), // cents (positive or negative)
  customerSatisfaction: int("customerSatisfaction"), // satisfaction * 100
  driverSatisfaction: int("driverSatisfaction"), // satisfaction * 100
  // Deployment
  isActive: boolean("isActive").default(false).notNull(),
  deployedAt: timestamp("deployedAt"),
  evaluatedAt: timestamp("evaluatedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MlModelPerformance = typeof mlModelPerformance.$inferSelect;
export type InsertMlModelPerformance = typeof mlModelPerformance.$inferInsert;
