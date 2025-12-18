import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * OpenRide Database Schema
 * Comprehensive schema for decentralized rideshare platform with DAO governance
 */

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "driver", "rider"]).default("user").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }),
  profilePhoto: text("profilePhoto"),
  rideTokenBalance: int("rideTokenBalance").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// DRIVER PROFILES & VERIFICATION
// ============================================================================

export const driverProfiles = mysqlTable("driverProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  licenseExpiry: timestamp("licenseExpiry"),
  licenseDocumentUrl: text("licenseDocumentUrl"),
  insuranceDocumentUrl: text("insuranceDocumentUrl"),
  vehicleRegistrationUrl: text("vehicleRegistrationUrl"),
  piNetworkKycVerified: boolean("piNetworkKycVerified").default(false).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verificationNotes: text("verificationNotes"),
  isAvailable: boolean("isAvailable").default(false).notNull(),
  // Delivery & Courier Service
  offersDelivery: boolean("offersDelivery").default(false).notNull(),
  maxPackageWeight: int("maxPackageWeight").default(20), // kg
  maxPackageSize: mysqlEnum("maxPackageSize", ["small", "medium", "large", "xlarge"]).default("medium"),
  totalRides: int("totalRides").default(0).notNull(),
  totalDeliveries: int("totalDeliveries").default(0).notNull(),
  averageRating: int("averageRating").default(0).notNull(), // stored as rating * 100 (e.g., 450 = 4.50)
  totalEarnings: int("totalEarnings").default(0).notNull(), // in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverProfile = typeof driverProfiles.$inferSelect;
export type InsertDriverProfile = typeof driverProfiles.$inferInsert;

// ============================================================================
// VEHICLES
// ============================================================================

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => driverProfiles.id),
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 50 }).notNull(),
  year: int("year").notNull(),
  color: varchar("color", { length: 30 }).notNull(),
  licensePlate: varchar("licensePlate", { length: 20 }).notNull(),
  vehicleType: mysqlEnum("vehicleType", ["sedan", "suv", "van", "luxury"]).notNull(),
  capacity: int("capacity").default(4).notNull(),
  photoUrl: text("photoUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

// ============================================================================
// RIDES
// ============================================================================

export const rides = mysqlTable("rides", {
  id: int("id").autoincrement().primaryKey(),
  riderId: int("riderId").notNull().references(() => users.id),
  driverId: int("driverId").references(() => driverProfiles.id),
  vehicleId: int("vehicleId").references(() => vehicles.id),
  // Service type
  serviceType: mysqlEnum("serviceType", ["ride", "delivery"]).default("ride").notNull(),
  status: mysqlEnum("status", [
    "requested",
    "accepted",
    "driver_arriving",
    "in_progress",
    "completed",
    "cancelled"
  ]).default("requested").notNull(),
  pickupAddress: text("pickupAddress").notNull(),
  pickupLat: varchar("pickupLat", { length: 20 }).notNull(),
  pickupLng: varchar("pickupLng", { length: 20 }).notNull(),
  dropoffAddress: text("dropoffAddress").notNull(),
  dropoffLat: varchar("dropoffLat", { length: 20 }).notNull(),
  dropoffLng: varchar("dropoffLng", { length: 20 }).notNull(),
  estimatedDistance: int("estimatedDistance"), // in meters
  estimatedDuration: int("estimatedDuration"), // in seconds
  estimatedFare: int("estimatedFare"), // in cents
  actualFare: int("actualFare"), // in cents
  insuranceFee: int("insuranceFee"), // 10% in cents
  developerFee: int("developerFee"), // 2.5% in cents
  buybackFee: int("buybackFee"), // 0.5% in cents
  driverEarnings: int("driverEarnings"), // 87% in cents
  rideTokensAwarded: int("rideTokensAwarded"), // RIDE tokens given (10 driver + 1 rider)
  // Delivery-specific fields
  packageDescription: text("packageDescription"),
  packageWeight: int("packageWeight"), // in kg
  packageSize: mysqlEnum("packageSize", ["small", "medium", "large", "xlarge"]),
  recipientName: varchar("recipientName", { length: 100 }),
  recipientPhone: varchar("recipientPhone", { length: 20 }),
  deliveryInstructions: text("deliveryInstructions"),
  proofOfDeliveryUrl: text("proofOfDeliveryUrl"), // Photo URL
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  cancellationReason: text("cancellationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ride = typeof rides.$inferSelect;
export type InsertRide = typeof rides.$inferInsert;

// ============================================================================
// RATINGS
// ============================================================================

export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  raterId: int("raterId").notNull().references(() => users.id),
  ratedId: int("ratedId").notNull().references(() => users.id),
  ratingType: mysqlEnum("ratingType", ["driver_to_rider", "rider_to_driver"]).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

// ============================================================================
// DAO GOVERNANCE
// ============================================================================

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  proposerId: int("proposerId").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  tier: mysqlEnum("tier", ["emergency", "operational", "strategic"]).notNull(),
  status: mysqlEnum("status", ["active", "passed", "rejected", "executed"]).default("active").notNull(),
  votingPeriodHours: int("votingPeriodHours").notNull(), // 24, 72-120, or 168
  quorumPercentage: int("quorumPercentage").notNull(), // 30, 15, or 20
  approvalThreshold: int("approvalThreshold").notNull(), // 66 or 51
  votesFor: int("votesFor").default(0).notNull(),
  votesAgainst: int("votesAgainst").default(0).notNull(),
  totalVotingPower: int("totalVotingPower").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  votingEndsAt: timestamp("votingEndsAt").notNull(),
  executedAt: timestamp("executedAt"),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull().references(() => proposals.id),
  voterId: int("voterId").notNull().references(() => users.id),
  voteChoice: mysqlEnum("voteChoice", ["for", "against"]).notNull(),
  votingPower: int("votingPower").notNull(), // RIDE token balance at time of vote
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

// ============================================================================
// INSURANCE & CLAIMS
// ============================================================================

export const insurancePool = mysqlTable("insurancePool", {
  id: int("id").autoincrement().primaryKey(),
  totalReserves: int("totalReserves").default(0).notNull(), // in cents
  totalClaims: int("totalClaims").default(0).notNull(), // in cents
  totalPaid: int("totalPaid").default(0).notNull(), // in cents
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsurancePool = typeof insurancePool.$inferSelect;

export const claims = mysqlTable("claims", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  claimantId: int("claimantId").notNull().references(() => users.id),
  claimType: mysqlEnum("claimType", ["accident", "damage", "injury", "theft", "other"]).notNull(),
  description: text("description").notNull(),
  amountRequested: int("amountRequested").notNull(), // in cents
  amountApproved: int("amountApproved"), // in cents
  status: mysqlEnum("status", ["pending", "under_review", "approved", "rejected", "paid"]).default("pending").notNull(),
  evidenceUrls: text("evidenceUrls"), // JSON array of URLs
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  paidAt: timestamp("paidAt"),
});

export type Claim = typeof claims.$inferSelect;
export type InsertClaim = typeof claims.$inferInsert;

// ============================================================================
// TOKEN ECONOMICS
// ============================================================================

export const tokenTransactions = mysqlTable("tokenTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  transactionType: mysqlEnum("transactionType", ["ride_reward", "buyback_burn", "governance_reward", "transfer"]).notNull(),
  amount: int("amount").notNull(), // positive for credit, negative for debit
  rideId: int("rideId").references(() => rides.id),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

export const buybackHistory = mysqlTable("buybackHistory", {
  id: int("id").autoincrement().primaryKey(),
  quarterYear: varchar("quarterYear", { length: 10 }).notNull(), // e.g., "2025-Q1"
  fundsAllocated: int("fundsAllocated").notNull(), // in cents
  tokensBurned: int("tokensBurned").notNull(),
  averagePrice: int("averagePrice").notNull(), // in cents per token
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type BuybackHistory = typeof buybackHistory.$inferSelect;
export type InsertBuybackHistory = typeof buybackHistory.$inferInsert;

// ============================================================================
// SAFETY & EMERGENCY
// ============================================================================

export const emergencyContacts = mysqlTable("emergencyContacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  contactName: varchar("contactName", { length: 100 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }).notNull(),
  relationship: varchar("relationship", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = typeof emergencyContacts.$inferInsert;

export const safetyIncidents = mysqlTable("safetyIncidents", {
  id: int("id").autoincrement().primaryKey(),
  rideId: int("rideId").notNull().references(() => rides.id),
  reporterId: int("reporterId").notNull().references(() => users.id),
  incidentType: mysqlEnum("incidentType", ["sos_triggered", "harassment", "accident", "unsafe_driving", "other"]).notNull(),
  description: text("description").notNull(),
  location: text("location"),
  status: mysqlEnum("status", ["reported", "under_review", "resolved", "escalated"]).default("reported").notNull(),
  resolutionNotes: text("resolutionNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type SafetyIncident = typeof safetyIncidents.$inferSelect;
export type InsertSafetyIncident = typeof safetyIncidents.$inferInsert;

// ============================================================================
// DRIVER APPLICATIONS & DOCUMENTS
// ============================================================================

export const driverApplications = mysqlTable("driverApplications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  fullName: varchar("fullName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  vehicleMake: varchar("vehicleMake", { length: 50 }),
  vehicleModel: varchar("vehicleModel", { length: 50 }),
  vehicleYear: int("vehicleYear"),
  vehicleColor: varchar("vehicleColor", { length: 30 }),
  licensePlate: varchar("licensePlate", { length: 20 }),
  passengerCapacity: int("passengerCapacity").default(4),
  piKycStatus: mysqlEnum("piKycStatus", ["pending", "in_progress", "verified", "failed"]).default("pending").notNull(),
  piUserId: varchar("piUserId", { length: 100 }),
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected"]).default("draft").notNull(),
  rejectionReason: text("rejectionReason"),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverApplication = typeof driverApplications.$inferSelect;
export type InsertDriverApplication = typeof driverApplications.$inferInsert;

export const driverDocuments = mysqlTable("driverDocuments", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull().references(() => driverApplications.id),
  documentType: mysqlEnum("documentType", ["license", "insurance", "registration"]).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  verificationNotes: text("verificationNotes"),
  verifiedBy: int("verifiedBy").references(() => users.id),
  verifiedAt: timestamp("verifiedAt"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = typeof driverDocuments.$inferInsert;

// ============================================================================
// ML & ANALYTICS TABLES
// ============================================================================

export * from './ml-schema';

// ============================================================================
// EXPANSION & MARKET ANALYSIS TABLES
// ============================================================================

export * from './expansion-schema';
