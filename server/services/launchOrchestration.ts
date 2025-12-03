/**
 * Launch Orchestration & Monitoring Service
 * 
 * Manages the end-to-end launch process for new markets,
 * coordinates phases, tracks milestones, monitors performance,
 * and provides AI-driven recommendations for optimization
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { 
  expansionLaunches,
  launchMilestones,
  marketPerformance,
  marketOpportunities,
  type InsertExpansionLaunch,
  type InsertLaunchMilestone,
  type InsertMarketPerformance
} from "../../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface LaunchPlan {
  marketId: number;
  launchName: string;
  launchTier: "tier1" | "tier2" | "tier3";
  approvedBudget: number; // cents
  targetDriverCount: number;
  targetRideCount: number;
  targetMarketShare: number; // percentage * 100
  plannedBetaDate: Date;
  plannedSoftLaunchDate: Date;
  plannedPublicLaunchDate: Date;
  milestones: MilestoneDefinition[];
}

export interface MilestoneDefinition {
  milestoneName: string;
  description: string;
  category: "regulatory" | "technology" | "recruitment" | "marketing" | "operations" | "financial";
  plannedDate: Date;
  dependsOn: string[]; // milestone names
}

export interface LaunchHealth {
  launchId: number;
  healthScore: number; // 0-100
  status: "on_track" | "at_risk" | "delayed" | "critical";
  issues: HealthIssue[];
  recommendations: string[];
  nextMilestone: string;
  daysUntilNextMilestone: number;
}

export interface HealthIssue {
  category: "budget" | "timeline" | "drivers" | "rides" | "quality" | "regulatory";
  severity: "high" | "medium" | "low";
  description: string;
  impact: string;
  recommendation: string;
}

export interface PerformanceMetrics {
  launchId: number;
  period: "daily" | "weekly" | "monthly";
  metrics: {
    // Supply
    activeDrivers: number;
    newDrivers: number;
    driverChurn: number;
    driverRetention: number; // percentage
    avgDriverEarnings: number; // cents per hour
    driverSatisfaction: number; // 0-100
    
    // Demand
    totalRides: number;
    uniqueRiders: number;
    newRiders: number;
    riderChurn: number;
    riderRetention: number; // percentage
    avgRidesPerRider: number;
    riderSatisfaction: number; // 0-100
    
    // Operations
    avgWaitTime: number; // seconds
    acceptanceRate: number; // percentage
    cancellationRate: number; // percentage
    avgRating: number; // 0-500 (rating * 100)
    
    // Financial
    revenue: number; // cents
    driverPayments: number; // cents
    contributionMargin: number; // percentage
    
    // Growth
    rideGrowthRate: number; // percentage vs previous period
    revenueGrowthRate: number; // percentage vs previous period
  };
}

// ============================================================================
// LAUNCH PLANNING
// ============================================================================

/**
 * Create comprehensive launch plan for a market
 */
export async function createLaunchPlan(
  marketId: number,
  budget: number,
  launchLeadId?: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get market details
  const market = await db.select().from(marketOpportunities)
    .where(eq(marketOpportunities.id, marketId))
    .limit(1);
  
  if (!market[0]) throw new Error("Market not found");
  
  const marketData = market[0];
  
  // Calculate targets based on market size
  const targetDriverCount = Math.max(100, Math.round(marketData.metroPopulation! / 5000));
  const targetRideCount = targetDriverCount * 200; // 200 rides per driver in first 3 months
  const targetMarketShare = marketData.tier === "tier1" ? 15 : marketData.tier === "tier2" ? 10 : 5;
  
  // Set timeline
  const now = new Date();
  const plannedBetaDate = new Date(now);
  plannedBetaDate.setDate(plannedBetaDate.getDate() + 90); // 3 months from now
  
  const plannedSoftLaunchDate = new Date(plannedBetaDate);
  plannedSoftLaunchDate.setDate(plannedSoftLaunchDate.getDate() + 30); // 1 month after beta
  
  const plannedPublicLaunchDate = new Date(plannedSoftLaunchDate);
  plannedPublicLaunchDate.setDate(plannedPublicLaunchDate.getDate() + 60); // 2 months after soft launch
  
  // Create launch record
  const launch: InsertExpansionLaunch = {
    marketId,
    launchName: `${marketData.city} Launch ${now.getFullYear()}`,
    launchTier: marketData.tier as "tier1" | "tier2" | "tier3",
    currentPhase: "planning",
    plannedBetaDate,
    plannedSoftLaunchDate,
    plannedPublicLaunchDate,
    approvedBudget: budget,
    spentToDate: 0,
    targetDriverCount,
    targetRideCount,
    targetMarketShare,
    currentDriverCount: 0,
    currentRideCount: 0,
    launchLeadId,
    status: "active"
  };
  
  const [result] = await db.insert(expansionLaunches).values(launch);
  const launchId = result.insertId;
  
  // Create milestones
  await createLaunchMilestones(launchId, {
    betaDate: plannedBetaDate,
    softLaunchDate: plannedSoftLaunchDate,
    publicLaunchDate: plannedPublicLaunchDate
  });
  
  return launchId;
}

async function createLaunchMilestones(
  launchId: number,
  dates: {
    betaDate: Date;
    softLaunchDate: Date;
    publicLaunchDate: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  
  const milestones: InsertLaunchMilestone[] = [
    // Regulatory milestones
    {
      launchId,
      milestoneName: "Platform License Obtained",
      description: "Secure all required platform operating licenses",
      category: "regulatory",
      plannedDate: new Date(dates.betaDate.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days before beta
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Insurance Coverage Secured",
      description: "Establish commercial insurance partnerships",
      category: "regulatory",
      plannedDate: new Date(dates.betaDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      status: "not_started"
    },
    
    // Technology milestones
    {
      launchId,
      milestoneName: "App Localization Complete",
      description: "Translate app and integrate local payment methods",
      category: "technology",
      plannedDate: new Date(dates.betaDate.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days before beta
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Local Maps Integration",
      description: "Configure maps, geocoding, and routing for market",
      category: "technology",
      plannedDate: new Date(dates.betaDate.getTime() - 45 * 24 * 60 * 60 * 1000),
      status: "not_started"
    },
    
    // Recruitment milestones
    {
      launchId,
      milestoneName: "100 Drivers Recruited",
      description: "Recruit and verify minimum 100 drivers for beta",
      category: "recruitment",
      plannedDate: dates.betaDate,
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "500 Drivers Recruited",
      description: "Scale to 500 active drivers for soft launch",
      category: "recruitment",
      plannedDate: dates.softLaunchDate,
      status: "not_started"
    },
    
    // Marketing milestones
    {
      launchId,
      milestoneName: "Marketing Campaign Launch",
      description: "Launch driver recruitment marketing campaign",
      category: "marketing",
      plannedDate: new Date(dates.betaDate.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days before beta
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Public Relations Campaign",
      description: "Launch PR campaign and media outreach",
      category: "marketing",
      plannedDate: new Date(dates.publicLaunchDate.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days before public launch
      status: "not_started"
    },
    
    // Operations milestones
    {
      launchId,
      milestoneName: "Beta Launch",
      description: "Launch closed beta with 100 drivers and invited riders",
      category: "operations",
      plannedDate: dates.betaDate,
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Soft Launch",
      description: "Open to public with limited marketing",
      category: "operations",
      plannedDate: dates.softLaunchDate,
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Public Launch",
      description: "Full public launch with marketing campaign",
      category: "operations",
      plannedDate: dates.publicLaunchDate,
      status: "not_started"
    },
    
    // Financial milestones
    {
      launchId,
      milestoneName: "Positive Contribution Margin",
      description: "Achieve positive unit economics",
      category: "financial",
      plannedDate: new Date(dates.softLaunchDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days after soft launch
      status: "not_started"
    },
    {
      launchId,
      milestoneName: "Breakeven EBITDA",
      description: "Reach breakeven profitability",
      category: "financial",
      plannedDate: new Date(dates.publicLaunchDate.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months after public launch
      status: "not_started"
    }
  ];
  
  await db.insert(launchMilestones).values(milestones);
}

// ============================================================================
// LAUNCH MONITORING
// ============================================================================

/**
 * Calculate launch health score and identify issues
 */
export async function assessLaunchHealth(launchId: number): Promise<LaunchHealth> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const launch = await db.select().from(expansionLaunches)
    .where(eq(expansionLaunches.id, launchId))
    .limit(1);
  
  if (!launch[0]) throw new Error("Launch not found");
  
  const launchData = launch[0];
  const issues: HealthIssue[] = [];
  let healthScore = 100;
  
  // Check budget
  const budgetUsed = (launchData.spentToDate / launchData.approvedBudget) * 100;
  const timeElapsed = calculateTimeElapsed(launchData.createdAt);
  
  if (budgetUsed > timeElapsed + 20) {
    issues.push({
      category: "budget",
      severity: "high",
      description: `Budget ${budgetUsed.toFixed(0)}% used but only ${timeElapsed.toFixed(0)}% of timeline elapsed`,
      impact: "May run out of budget before launch completion",
      recommendation: "Review spending, identify cost savings, or request additional budget"
    });
    healthScore -= 20;
  }
  
  // Check driver recruitment
  const driverProgress = (launchData.currentDriverCount / launchData.targetDriverCount) * 100;
  if (driverProgress < timeElapsed - 15) {
    issues.push({
      category: "drivers",
      severity: driverProgress < timeElapsed - 30 ? "high" : "medium",
      description: `Driver recruitment ${driverProgress.toFixed(0)}% complete, should be ${timeElapsed.toFixed(0)}%`,
      impact: "May not have enough drivers for launch",
      recommendation: "Increase recruitment budget, expand marketing channels, or offer sign-on bonuses"
    });
    healthScore -= driverProgress < timeElapsed - 30 ? 25 : 15;
  }
  
  // Check ride volume (if launched)
  if (launchData.currentPhase !== "planning" && launchData.currentPhase !== "regulatory_compliance") {
    const rideProgress = (launchData.currentRideCount / launchData.targetRideCount) * 100;
    if (rideProgress < 50 && launchData.currentPhase === "growth") {
      issues.push({
        category: "rides",
        severity: "medium",
        description: `Ride volume ${rideProgress.toFixed(0)}% of target`,
        impact: "Lower than expected demand",
        recommendation: "Increase rider marketing, offer promotional pricing, improve driver availability"
      });
      healthScore -= 15;
    }
  }
  
  // Check quality metrics
  if (launchData.averageRating && launchData.averageRating < 420) { // < 4.2 stars
    issues.push({
      category: "quality",
      severity: "high",
      description: `Average rating ${(launchData.averageRating / 100).toFixed(2)} below 4.2 threshold`,
      impact: "Poor user experience damaging brand reputation",
      recommendation: "Investigate quality issues, provide driver training, address rider complaints"
    });
    healthScore -= 20;
  }
  
  // Get next milestone
  const milestones = await db.select().from(launchMilestones)
    .where(and(
      eq(launchMilestones.launchId, launchId),
      eq(launchMilestones.status, "not_started")
    ))
    .orderBy(launchMilestones.plannedDate)
    .limit(1);
  
  const nextMilestone = milestones[0];
  const daysUntilNextMilestone = nextMilestone && nextMilestone.plannedDate
    ? Math.ceil((nextMilestone.plannedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : 0;
  
  // Determine status
  let status: LaunchHealth["status"];
  if (healthScore >= 80) status = "on_track";
  else if (healthScore >= 60) status = "at_risk";
  else if (healthScore >= 40) status = "delayed";
  else status = "critical";
  
  // Generate recommendations
  const recommendations = await generateLaunchRecommendations(launchData, issues);
  
  return {
    launchId,
    healthScore: Math.max(0, healthScore),
    status,
    issues,
    recommendations,
    nextMilestone: nextMilestone?.milestoneName || "No upcoming milestones",
    daysUntilNextMilestone
  };
}

function calculateTimeElapsed(startDate: Date): number {
  const now = Date.now();
  const start = startDate.getTime();
  const elapsed = now - start;
  
  // Assume 6-month launch timeline
  const totalDuration = 180 * 24 * 60 * 60 * 1000;
  return Math.min(100, (elapsed / totalDuration) * 100);
}

async function generateLaunchRecommendations(
  launch: any,
  issues: HealthIssue[]
): Promise<string[]> {
  const recommendations: string[] = [];
  
  // Add issue-specific recommendations
  issues.forEach(issue => {
    recommendations.push(issue.recommendation);
  });
  
  // Add phase-specific recommendations
  switch (launch.currentPhase) {
    case "planning":
      recommendations.push("Finalize regulatory compliance roadmap");
      recommendations.push("Begin driver recruitment marketing campaign");
      break;
    case "regulatory_compliance":
      recommendations.push("Expedite license applications where possible");
      recommendations.push("Prepare technology localization in parallel");
      break;
    case "driver_recruitment":
      recommendations.push("Host driver information sessions");
      recommendations.push("Activate referral program to accelerate recruitment");
      break;
    case "closed_beta":
      recommendations.push("Collect detailed feedback from beta participants");
      recommendations.push("Monitor metrics closely and iterate quickly");
      break;
    case "soft_launch":
      recommendations.push("Gradually increase marketing spend based on performance");
      recommendations.push("Optimize pricing and driver incentives");
      break;
    case "public_launch":
      recommendations.push("Launch full marketing campaign");
      recommendations.push("Focus on customer acquisition and retention");
      break;
    case "growth":
      recommendations.push("Optimize operations for profitability");
      recommendations.push("Expand service area to suburbs");
      break;
  }
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Record performance metrics for a launch
 */
export async function recordPerformanceMetrics(
  launchId: number,
  period: "daily" | "weekly" | "monthly",
  metrics: PerformanceMetrics["metrics"]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const now = new Date();
  const periodStart = getPeriodStart(now, period);
  const periodEnd = now;
  
  const record: InsertMarketPerformance = {
    launchId,
    periodType: period,
    periodStart,
    periodEnd,
    
    // Supply metrics
    activeDrivers: metrics.activeDrivers,
    newDriversAdded: metrics.newDrivers,
    driversChurned: metrics.driverChurn,
    driverRetentionRate: metrics.driverRetention,
    averageDriverEarnings: metrics.avgDriverEarnings,
    driverSatisfactionScore: metrics.driverSatisfaction,
    
    // Demand metrics
    totalRides: metrics.totalRides,
    uniqueRiders: metrics.uniqueRiders,
    newRiders: metrics.newRiders,
    ridersChurned: metrics.riderChurn,
    riderRetentionRate: metrics.riderRetention,
    averageRidesPerRider: Math.round(metrics.avgRidesPerRider * 100),
    riderSatisfactionScore: metrics.riderSatisfaction,
    
    // Operational metrics
    averageWaitTime: metrics.avgWaitTime,
    acceptanceRate: Math.round(metrics.acceptanceRate * 100),
    cancellationRate: Math.round(metrics.cancellationRate * 100),
    averageRating: metrics.avgRating,
    
    // Financial metrics
    grossRevenue: metrics.revenue,
    netRevenue: Math.round(metrics.revenue - metrics.driverPayments),
    driverPayments: metrics.driverPayments,
    insuranceFees: Math.round(metrics.revenue * 0.10),
    marketingSpend: 0, // Would track separately
    operatingExpenses: 0, // Would track separately
    contributionMargin: Math.round(metrics.revenue - metrics.driverPayments),
    contributionMarginPercent: Math.round(metrics.contributionMargin * 100),
    
    // Growth metrics
    rideGrowthRate: Math.round(metrics.rideGrowthRate * 100),
    revenueGrowthRate: Math.round(metrics.revenueGrowthRate * 100),
    
    // Health score
    healthScore: calculateMetricsHealthScore(metrics)
  };
  
  await db.insert(marketPerformance).values(record);
  
  // Update launch record with latest metrics
  await db.update(expansionLaunches)
    .set({
      currentDriverCount: metrics.activeDrivers,
      currentRideCount: metrics.totalRides,
      averageRating: metrics.avgRating,
      averageWaitTime: metrics.avgWaitTime,
      acceptanceRate: Math.round(metrics.acceptanceRate * 100),
      cancellationRate: Math.round(metrics.cancellationRate * 100),
      totalRevenue: metrics.revenue,
      totalDriverPayments: metrics.driverPayments,
      contributionMargin: Math.round(metrics.contributionMargin * 100),
      healthScore: calculateMetricsHealthScore(metrics),
      updatedAt: new Date()
    })
    .where(eq(expansionLaunches.id, launchId));
}

function getPeriodStart(now: Date, period: "daily" | "weekly" | "monthly"): Date {
  const start = new Date(now);
  
  switch (period) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start.setDate(1); // Start of month
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return start;
}

function calculateMetricsHealthScore(metrics: PerformanceMetrics["metrics"]): number {
  let score = 100;
  
  // Quality metrics
  if (metrics.avgRating < 420) score -= 20; // < 4.2 stars
  if (metrics.avgWaitTime > 300) score -= 15; // > 5 minutes
  if (metrics.acceptanceRate < 90) score -= 10; // < 90%
  if (metrics.cancellationRate > 10) score -= 10; // > 10%
  
  // Satisfaction
  if (metrics.driverSatisfaction < 70) score -= 10;
  if (metrics.riderSatisfaction < 70) score -= 10;
  
  // Growth
  if (metrics.rideGrowthRate < 0) score -= 15; // Negative growth
  
  // Retention
  if (metrics.driverRetention < 80) score -= 10;
  if (metrics.riderRetention < 60) score -= 10;
  
  return Math.max(0, score);
}

// ============================================================================
// MILESTONE MANAGEMENT
// ============================================================================

/**
 * Complete a milestone
 */
export async function completeMilestone(
  milestoneId: number,
  notes?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const milestone = await db.select().from(launchMilestones)
    .where(eq(launchMilestones.id, milestoneId))
    .limit(1);
  
  if (!milestone[0]) throw new Error("Milestone not found");
  
  const now = new Date();
  const planned = milestone[0].plannedDate;
  const daysDelayed = planned ? Math.ceil((now.getTime() - planned.getTime()) / (24 * 60 * 60 * 1000)) : 0;
  
  await db.update(launchMilestones)
    .set({
      status: "completed",
      actualDate: now,
      daysDelayed,
      updatedAt: now,
      completedAt: now
    })
    .where(eq(launchMilestones.id, milestoneId));
}

/**
 * Get upcoming milestones for a launch
 */
export async function getUpcomingMilestones(launchId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(launchMilestones)
    .where(and(
      eq(launchMilestones.launchId, launchId),
      eq(launchMilestones.status, "not_started")
    ))
    .orderBy(launchMilestones.plannedDate)
    .limit(limit);
}
