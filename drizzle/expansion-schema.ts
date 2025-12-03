/**
 * Expansion & Market Analysis Schema
 * 
 * Tables for AI-driven geographic expansion:
 * - Market opportunity tracking
 * - Regulatory assessment
 * - Launch planning and execution
 * - Performance monitoring
 */

import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";
import { users } from "./schema";

// ============================================================================
// MARKET OPPORTUNITIES
// ============================================================================

/**
 * Tracks potential expansion markets with AI-generated opportunity scores
 */
export const marketOpportunities = mysqlTable("market_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  
  // Location
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull(),
  countryCode: varchar("countryCode", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  region: varchar("region", { length: 100 }), // e.g., "North America", "Europe"
  
  // Market tier classification
  tier: mysqlEnum("tier", ["tier1", "tier2", "tier3", "watch"]).notNull(),
  
  // Opportunity scoring (0-100 scale, stored as integers)
  overallScore: int("overallScore").notNull(),
  marketAttractivenessScore: int("marketAttractivenessScore").notNull(),
  competitiveLandscapeScore: int("competitiveLandscapeScore").notNull(),
  regulatoryFeasibilityScore: int("regulatoryFeasibilityScore").notNull(),
  operationalReadinessScore: int("operationalReadinessScore").notNull(),
  
  // Market data
  population: int("population"),
  metroPopulation: int("metroPopulation"),
  gdpPerCapita: int("gdpPerCapita"), // USD
  smartphonePenetration: int("smartphonePenetration"), // percentage * 100
  rideshareAdoptionRate: int("rideshareAdoptionRate"), // percentage * 100
  vehicleOwnershipRate: int("vehicleOwnershipRate"), // percentage * 100
  
  // Competitive landscape
  competitorCount: int("competitorCount").default(0),
  marketLeader: varchar("marketLeader", { length: 100 }),
  marketLeaderShare: int("marketLeaderShare"), // percentage * 100
  marketSaturation: int("marketSaturation"), // percentage * 100
  averageRidePrice: int("averageRidePrice"), // cents
  
  // Regulatory environment
  regulatoryStatus: mysqlEnum("regulatoryStatus", [
    "permissive",
    "moderate",
    "restrictive",
    "unclear",
    "prohibited"
  ]),
  licenseRequired: boolean("licenseRequired").default(true),
  estimatedComplianceTime: int("estimatedComplianceTime"), // days
  estimatedComplianceCost: int("estimatedComplianceCost"), // cents
  
  // Financial projections
  estimatedTAM: int("estimatedTAM"), // Total Addressable Market (annual rides)
  estimatedRevenue: int("estimatedRevenue"), // cents (annual, year 1)
  estimatedBreakEvenMonths: int("estimatedBreakEvenMonths"),
  estimatedROI: int("estimatedROI"), // percentage * 100 (24-month)
  
  // AI analysis
  aiAnalysisSummary: text("aiAnalysisSummary"),
  aiRecommendation: mysqlEnum("aiRecommendation", [
    "immediate_evaluation",
    "evaluate_within_6mo",
    "monitor",
    "not_viable"
  ]).notNull(),
  aiConfidenceScore: int("aiConfidenceScore").notNull(), // 0-100
  
  // Status tracking
  status: mysqlEnum("status", [
    "identified",
    "preliminary_assessment",
    "deep_dive_analysis",
    "dao_proposal",
    "approved",
    "rejected",
    "launched"
  ]).default("identified").notNull(),
  
  // Timestamps
  lastAnalyzedAt: timestamp("lastAnalyzedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketOpportunity = typeof marketOpportunities.$inferSelect;
export type InsertMarketOpportunity = typeof marketOpportunities.$inferInsert;

// ============================================================================
// MARKET ANALYSIS REPORTS
// ============================================================================

/**
 * Detailed analysis reports for markets under evaluation
 */
export const marketAnalysisReports = mysqlTable("market_analysis_reports", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull().references(() => marketOpportunities.id),
  
  // Report metadata
  reportType: mysqlEnum("reportType", [
    "preliminary_assessment",
    "deep_dive_analysis",
    "competitive_analysis",
    "regulatory_assessment",
    "financial_projection"
  ]).notNull(),
  reportVersion: int("reportVersion").default(1).notNull(),
  
  // Report content
  executiveSummary: text("executiveSummary"),
  fullReportUrl: text("fullReportUrl"), // S3 URL to PDF/document
  fullReportJson: text("fullReportJson"), // JSON data for programmatic access
  
  // Key findings
  keyFindings: text("keyFindings"), // JSON array
  opportunities: text("opportunities"), // JSON array
  risks: text("risks"), // JSON array
  recommendations: text("recommendations"), // JSON array
  
  // Data sources
  dataSources: text("dataSources"), // JSON array of sources used
  dataQuality: mysqlEnum("dataQuality", ["high", "medium", "low"]),
  
  // Analysis metadata
  analyzedBy: varchar("analyzedBy", { length: 100 }), // "AI System" or analyst name
  reviewedBy: int("reviewedBy").references(() => users.id),
  approvedBy: int("approvedBy").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
});

export type MarketAnalysisReport = typeof marketAnalysisReports.$inferSelect;
export type InsertMarketAnalysisReport = typeof marketAnalysisReports.$inferInsert;

// ============================================================================
// REGULATORY REQUIREMENTS
// ============================================================================

/**
 * Tracks regulatory requirements for each market
 */
export const regulatoryRequirements = mysqlTable("regulatory_requirements", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull().references(() => marketOpportunities.id),
  
  // Requirement details
  requirementType: mysqlEnum("requirementType", [
    "platform_license",
    "driver_license",
    "vehicle_inspection",
    "insurance",
    "background_check",
    "data_privacy",
    "tax_registration",
    "accessibility",
    "other"
  ]).notNull(),
  
  requirementName: varchar("requirementName", { length: 200 }).notNull(),
  description: text("description"),
  
  // Jurisdiction
  jurisdictionLevel: mysqlEnum("jurisdictionLevel", ["federal", "state", "municipal"]).notNull(),
  jurisdictionName: varchar("jurisdictionName", { length: 100 }).notNull(),
  
  // Compliance details
  isRequired: boolean("isRequired").default(true).notNull(),
  estimatedCost: int("estimatedCost"), // cents
  estimatedTimeToComplete: int("estimatedTimeToComplete"), // days
  renewalFrequency: varchar("renewalFrequency", { length: 50 }), // "annual", "biennial", "none"
  
  // Documentation
  regulationUrl: text("regulationUrl"),
  applicationUrl: text("applicationUrl"),
  guidanceNotes: text("guidanceNotes"),
  
  // Status tracking
  status: mysqlEnum("status", [
    "identified",
    "in_progress",
    "submitted",
    "approved",
    "rejected",
    "not_applicable"
  ]).default("identified").notNull(),
  
  assignedTo: int("assignedTo").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type RegulatoryRequirement = typeof regulatoryRequirements.$inferSelect;
export type InsertRegulatoryRequirement = typeof regulatoryRequirements.$inferInsert;

// ============================================================================
// EXPANSION LAUNCHES
// ============================================================================

/**
 * Tracks active expansion launches from planning to execution
 */
export const expansionLaunches = mysqlTable("expansion_launches", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull().references(() => marketOpportunities.id),
  
  // Launch metadata
  launchName: varchar("launchName", { length: 200 }).notNull(), // e.g., "Toronto Launch 2025"
  launchTier: mysqlEnum("launchTier", ["tier1", "tier2", "tier3"]).notNull(),
  
  // Launch phases
  currentPhase: mysqlEnum("currentPhase", [
    "planning",
    "regulatory_compliance",
    "technology_localization",
    "driver_recruitment",
    "closed_beta",
    "soft_launch",
    "public_launch",
    "growth",
    "maturity"
  ]).default("planning").notNull(),
  
  // Timeline
  plannedBetaDate: timestamp("plannedBetaDate"),
  plannedSoftLaunchDate: timestamp("plannedSoftLaunchDate"),
  plannedPublicLaunchDate: timestamp("plannedPublicLaunchDate"),
  actualBetaDate: timestamp("actualBetaDate"),
  actualSoftLaunchDate: timestamp("actualSoftLaunchDate"),
  actualPublicLaunchDate: timestamp("actualPublicLaunchDate"),
  
  // Budget
  approvedBudget: int("approvedBudget").notNull(), // cents
  spentToDate: int("spentToDate").default(0).notNull(), // cents
  projectedFinalCost: int("projectedFinalCost"), // cents
  
  // Targets
  targetDriverCount: int("targetDriverCount").notNull(),
  targetRideCount: int("targetRideCount").notNull(), // first 3 months
  targetMarketShare: int("targetMarketShare"), // percentage * 100 (12 months)
  
  // Actuals
  currentDriverCount: int("currentDriverCount").default(0).notNull(),
  currentRideCount: int("currentRideCount").default(0).notNull(),
  currentMarketShare: int("currentMarketShare"), // percentage * 100
  
  // Performance metrics
  averageRating: int("averageRating"), // rating * 100
  averageWaitTime: int("averageWaitTime"), // seconds
  acceptanceRate: int("acceptanceRate"), // percentage * 100
  cancellationRate: int("cancellationRate"), // percentage * 100
  
  // Financial performance
  totalRevenue: int("totalRevenue").default(0).notNull(), // cents
  totalDriverPayments: int("totalDriverPayments").default(0).notNull(), // cents
  contributionMargin: int("contributionMargin"), // percentage * 100
  isBreakeven: boolean("isBreakeven").default(false).notNull(),
  breakEvenDate: timestamp("breakEvenDate"),
  
  // Status
  status: mysqlEnum("status", [
    "active",
    "on_hold",
    "delayed",
    "completed",
    "cancelled"
  ]).default("active").notNull(),
  
  healthScore: int("healthScore"), // 0-100, AI-calculated based on KPIs
  
  // Team
  launchLeadId: int("launchLeadId").references(() => users.id),
  
  // Notes
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpansionLaunch = typeof expansionLaunches.$inferSelect;
export type InsertExpansionLaunch = typeof expansionLaunches.$inferInsert;

// ============================================================================
// LAUNCH MILESTONES
// ============================================================================

/**
 * Tracks key milestones and tasks for each launch
 */
export const launchMilestones = mysqlTable("launch_milestones", {
  id: int("id").autoincrement().primaryKey(),
  launchId: int("launchId").notNull().references(() => expansionLaunches.id),
  
  // Milestone details
  milestoneName: varchar("milestoneName", { length: 200 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "regulatory",
    "technology",
    "recruitment",
    "marketing",
    "operations",
    "financial"
  ]).notNull(),
  
  // Timeline
  plannedDate: timestamp("plannedDate"),
  actualDate: timestamp("actualDate"),
  daysDelayed: int("daysDelayed"), // negative if early, positive if late
  
  // Status
  status: mysqlEnum("status", [
    "not_started",
    "in_progress",
    "blocked",
    "completed",
    "cancelled"
  ]).default("not_started").notNull(),
  
  blockerReason: text("blockerReason"),
  
  // Assignment
  assignedTo: int("assignedTo").references(() => users.id),
  
  // Dependencies
  dependsOn: text("dependsOn"), // JSON array of milestone IDs
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type LaunchMilestone = typeof launchMilestones.$inferSelect;
export type InsertLaunchMilestone = typeof launchMilestones.$inferInsert;

// ============================================================================
// MARKET PERFORMANCE
// ============================================================================

/**
 * Tracks ongoing performance metrics for launched markets
 */
export const marketPerformance = mysqlTable("market_performance", {
  id: int("id").autoincrement().primaryKey(),
  launchId: int("launchId").notNull().references(() => expansionLaunches.id),
  
  // Time period
  periodType: mysqlEnum("periodType", ["daily", "weekly", "monthly", "quarterly"]).notNull(),
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  
  // Supply metrics
  activeDrivers: int("activeDrivers").notNull(),
  newDriversAdded: int("newDriversAdded").default(0),
  driversChurned: int("driversChurned").default(0),
  driverRetentionRate: int("driverRetentionRate"), // percentage * 100
  averageDriverEarnings: int("averageDriverEarnings"), // cents per hour
  driverSatisfactionScore: int("driverSatisfactionScore"), // 0-100
  
  // Demand metrics
  totalRides: int("totalRides").notNull(),
  uniqueRiders: int("uniqueRiders").notNull(),
  newRiders: int("newRiders").default(0),
  ridersChurned: int("ridersChurned").default(0),
  riderRetentionRate: int("riderRetentionRate"), // percentage * 100
  averageRidesPerRider: int("averageRidesPerRider"), // rides * 100
  riderSatisfactionScore: int("riderSatisfactionScore"), // 0-100
  
  // Operational metrics
  averageWaitTime: int("averageWaitTime").notNull(), // seconds
  acceptanceRate: int("acceptanceRate").notNull(), // percentage * 100
  cancellationRate: int("cancellationRate").notNull(), // percentage * 100
  averageRating: int("averageRating").notNull(), // rating * 100
  technicalErrorRate: int("technicalErrorRate"), // percentage * 100
  
  // Financial metrics
  grossRevenue: int("grossRevenue").notNull(), // cents
  netRevenue: int("netRevenue").notNull(), // cents (after driver payments)
  driverPayments: int("driverPayments").notNull(), // cents
  insuranceFees: int("insuranceFees").notNull(), // cents
  marketingSpend: int("marketingSpend").notNull(), // cents
  operatingExpenses: int("operatingExpenses").notNull(), // cents
  contributionMargin: int("contributionMargin").notNull(), // cents
  contributionMarginPercent: int("contributionMarginPercent"), // percentage * 100
  ebitda: int("ebitda"), // cents
  
  // Market share
  estimatedMarketShare: int("estimatedMarketShare"), // percentage * 100
  competitorPriceIndex: int("competitorPriceIndex"), // our avg price / competitor avg price * 100
  
  // Growth metrics
  rideGrowthRate: int("rideGrowthRate"), // percentage * 100 vs previous period
  revenueGrowthRate: int("revenueGrowthRate"), // percentage * 100 vs previous period
  
  // AI health score
  healthScore: int("healthScore").notNull(), // 0-100
  healthTrend: mysqlEnum("healthTrend", ["improving", "stable", "declining"]),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketPerformance = typeof marketPerformance.$inferSelect;
export type InsertMarketPerformance = typeof marketPerformance.$inferInsert;

// ============================================================================
// EXPANSION BUDGET
// ============================================================================

/**
 * Tracks expansion budget allocation and spending
 */
export const expansionBudget = mysqlTable("expansion_budget", {
  id: int("id").autoincrement().primaryKey(),
  
  // Budget period
  fiscalQuarter: varchar("fiscalQuarter", { length: 10 }).notNull(), // e.g., "2025-Q1"
  fiscalYear: int("fiscalYear").notNull(),
  
  // Budget allocation
  totalBudget: int("totalBudget").notNull(), // cents
  marketResearchBudget: int("marketResearchBudget").notNull(), // cents
  regulatoryComplianceBudget: int("regulatoryComplianceBudget").notNull(), // cents
  driverRecruitmentBudget: int("driverRecruitmentBudget").notNull(), // cents
  marketingBudget: int("marketingBudget").notNull(), // cents
  technologyBudget: int("technologyBudget").notNull(), // cents
  contingencyBudget: int("contingencyBudget").notNull(), // cents
  
  // Spending to date
  totalSpent: int("totalSpent").default(0).notNull(), // cents
  marketResearchSpent: int("marketResearchSpent").default(0).notNull(),
  regulatoryComplianceSpent: int("regulatoryComplianceSpent").default(0).notNull(),
  driverRecruitmentSpent: int("driverRecruitmentSpent").default(0).notNull(),
  marketingSpent: int("marketingSpent").default(0).notNull(),
  technologySpent: int("technologySpent").default(0).notNull(),
  contingencySpent: int("contingencySpent").default(0).notNull(),
  
  // Rollover from previous quarter
  rolloverFromPrevious: int("rolloverFromPrevious").default(0).notNull(), // cents
  
  // DAO approval
  approvedByProposalId: int("approvedByProposalId"), // references proposals table
  approvedAt: timestamp("approvedAt"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExpansionBudget = typeof expansionBudget.$inferSelect;
export type InsertExpansionBudget = typeof expansionBudget.$inferInsert;
