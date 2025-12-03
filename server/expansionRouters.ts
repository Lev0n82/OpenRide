/**
 * Expansion Router
 * 
 * tRPC procedures for AI-powered expansion system
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  calculateOpportunityScore,
  generateMarketAnalysis,
  saveMarketOpportunity,
  getMarketOpportunities,
  getMarketOpportunityById,
  updateMarketStatus,
  scanMarketsForOpportunities,
  type MarketData,
  type CompetitiveData,
  type RegulatoryData as RegulatoryDataType
} from "./services/marketAnalysis";
import {
  generateRegulatoryAssessment,
  generateComplianceRoadmap,
  saveRegulatoryRequirements,
  getRegulatoryRequirements,
  updateRequirementStatus,
  getComplianceProgress,
  generateComplianceChecklist
} from "./services/regulatoryAssessment";
import {
  generateRecruitmentCampaign,
  getOnboardingProgress,
  sendOnboardingReminder,
  getRecruitmentMetrics,
  generateReferralCode,
  scoreDriverApplication
} from "./services/driverRecruitment";
import {
  createLaunchPlan,
  assessLaunchHealth,
  recordPerformanceMetrics,
  completeMilestone,
  getUpcomingMilestones
} from "./services/launchOrchestration";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const expansionRouter = router({
  
  // ============================================================================
  // MARKET ANALYSIS
  // ============================================================================
  
  // Analyze a new market opportunity
  analyzeMarket: adminProcedure
    .input(z.object({
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
      countryCode: z.string(),
      region: z.string(),
      population: z.number(),
      metroPopulation: z.number(),
      gdpPerCapita: z.number(),
      smartphonePenetration: z.number(),
      rideshareAdoptionRate: z.number(),
      vehicleOwnershipRate: z.number(),
      competitorCount: z.number(),
      marketLeader: z.string(),
      marketLeaderShare: z.number(),
      marketSaturation: z.number(),
      averageRidePrice: z.number(),
      regulatoryStatus: z.enum(["permissive", "moderate", "restrictive", "unclear", "prohibited"]),
      licenseRequired: z.boolean(),
      estimatedComplianceTime: z.number(),
      estimatedComplianceCost: z.number(),
    }))
    .mutation(async ({ input }) => {
      const market: MarketData = {
        city: input.city,
        state: input.state,
        country: input.country,
        countryCode: input.countryCode,
        region: input.region,
        population: input.population,
        metroPopulation: input.metroPopulation,
        gdpPerCapita: input.gdpPerCapita,
        smartphonePenetration: input.smartphonePenetration,
        rideshareAdoptionRate: input.rideshareAdoptionRate,
        vehicleOwnershipRate: input.vehicleOwnershipRate,
      };
      
      const competitive: CompetitiveData = {
        competitorCount: input.competitorCount,
        marketLeader: input.marketLeader,
        marketLeaderShare: input.marketLeaderShare,
        marketSaturation: input.marketSaturation,
        averageRidePrice: input.averageRidePrice,
      };
      
      const regulatory: RegulatoryDataType = {
        regulatoryStatus: input.regulatoryStatus,
        licenseRequired: input.licenseRequired,
        estimatedComplianceTime: input.estimatedComplianceTime,
        estimatedComplianceCost: input.estimatedComplianceCost,
      };
      
      const infrastructure = {
        roadQuality: 8,
        gpsAccuracy: 9,
        mobileNetwork: 9,
        paymentSystems: 8,
        languageBarrier: 7,
      };
      
      const score = calculateOpportunityScore(market, competitive, regulatory, infrastructure);
      const aiAnalysis = await generateMarketAnalysis(market, competitive, regulatory, score);
      const marketId = await saveMarketOpportunity(market, competitive, regulatory, score, aiAnalysis);
      
      return {
        marketId,
        score,
        aiAnalysis
      };
    }),
  
  // Get all market opportunities
  getMarketOpportunities: adminProcedure
    .input(z.object({
      tier: z.enum(["tier1", "tier2", "tier3", "watch"]).optional()
    }))
    .query(async ({ input }) => {
      return getMarketOpportunities(input.tier);
    }),
  
  // Get market opportunity by ID
  getMarketOpportunity: adminProcedure
    .input(z.object({
      marketId: z.number()
    }))
    .query(async ({ input }) => {
      return getMarketOpportunityById(input.marketId);
    }),
  
  // Update market status
  updateMarketStatus: adminProcedure
    .input(z.object({
      marketId: z.number(),
      status: z.enum(["identified", "preliminary_assessment", "deep_dive_analysis", "dao_proposal", "approved", "rejected", "launched"])
    }))
    .mutation(async ({ input }) => {
      await updateMarketStatus(input.marketId, input.status);
      return { success: true };
    }),
  
  // Scan multiple cities for opportunities
  scanCities: adminProcedure
    .input(z.object({
      cities: z.array(z.object({
        city: z.string(),
        state: z.string().optional(),
        country: z.string(),
        countryCode: z.string(),
      }))
    }))
    .mutation(async ({ input }) => {
      return scanMarketsForOpportunities(input.cities);
    }),
  
  // ============================================================================
  // REGULATORY ASSESSMENT
  // ============================================================================
  
  // Generate regulatory assessment for a market
  assessRegulatory: adminProcedure
    .input(z.object({
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
      countryCode: z.string(),
    }))
    .mutation(async ({ input }) => {
      return generateRegulatoryAssessment({
        ...input,
        serviceType: "rideshare"
      });
    }),
  
  // Generate compliance roadmap
  generateRoadmap: adminProcedure
    .input(z.object({
      marketId: z.number()
    }))
    .mutation(async ({ input }) => {
      // First get regulatory assessment
      const assessment = await generateRegulatoryAssessment({
        city: "Toronto", // Would get from market
        country: "Canada",
        countryCode: "CA",
        serviceType: "rideshare"
      });
      
      // Save requirements
      await saveRegulatoryRequirements(input.marketId, assessment.requirements);
      
      // Generate roadmap
      const roadmap = await generateComplianceRoadmap(input.marketId, assessment.requirements);
      
      return roadmap;
    }),
  
  // Get regulatory requirements for a market
  getRequirements: adminProcedure
    .input(z.object({
      marketId: z.number()
    }))
    .query(async ({ input }) => {
      return getRegulatoryRequirements(input.marketId);
    }),
  
  // Update requirement status
  updateRequirement: adminProcedure
    .input(z.object({
      requirementId: z.number(),
      status: z.enum(["identified", "in_progress", "submitted", "approved", "rejected", "not_applicable"]),
      assignedTo: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      await updateRequirementStatus(input.requirementId, input.status, input.assignedTo);
      return { success: true };
    }),
  
  // Get compliance progress
  getComplianceProgress: adminProcedure
    .input(z.object({
      marketId: z.number()
    }))
    .query(async ({ input }) => {
      return getComplianceProgress(input.marketId);
    }),
  
  // Generate compliance checklist
  getComplianceChecklist: adminProcedure
    .input(z.object({
      marketId: z.number()
    }))
    .query(async ({ input }) => {
      return generateComplianceChecklist(input.marketId);
    }),
  
  // ============================================================================
  // DRIVER RECRUITMENT
  // ============================================================================
  
  // Generate recruitment campaign
  generateCampaign: adminProcedure
    .input(z.object({
      launchId: z.number(),
      city: z.string(),
      state: z.string().optional(),
      country: z.string(),
      language: z.string(),
      targetDriverCount: z.number(),
      budget: z.number(),
      competitorDriverEarnings: z.number(),
      localCulture: z.string(),
    }))
    .mutation(async ({ input }) => {
      return generateRecruitmentCampaign(input.launchId, {
        city: input.city,
        state: input.state,
        country: input.country,
        language: input.language,
        targetDriverCount: input.targetDriverCount,
        budget: input.budget,
        competitorDriverEarnings: input.competitorDriverEarnings,
        localCulture: input.localCulture
      });
    }),
  
  // Get onboarding progress
  getOnboardingProgress: adminProcedure
    .input(z.object({
      driverId: z.number()
    }))
    .query(async ({ input }) => {
      return getOnboardingProgress(input.driverId);
    }),
  
  // Send onboarding reminder
  sendReminder: adminProcedure
    .input(z.object({
      driverId: z.number()
    }))
    .mutation(async ({ input }) => {
      await sendOnboardingReminder(input.driverId);
      return { success: true };
    }),
  
  // Get recruitment metrics
  getRecruitmentMetrics: adminProcedure
    .input(z.object({
      launchId: z.number()
    }))
    .query(async ({ input }) => {
      return getRecruitmentMetrics(input.launchId);
    }),
  
  // Generate referral code
  generateReferralCode: protectedProcedure
    .input(z.object({
      driverId: z.number()
    }))
    .mutation(({ input }) => {
      return { code: generateReferralCode(input.driverId) };
    }),
  
  // Score driver application
  scoreApplication: adminProcedure
    .input(z.object({
      yearsOfExperience: z.number(),
      vehicleAge: z.number(),
      vehicleCondition: z.enum(["excellent", "good", "fair", "poor"]),
      hasCommercialInsurance: z.boolean(),
      hasPreviousRideshareExperience: z.boolean(),
      backgroundCheckClean: z.boolean(),
    }))
    .mutation(({ input }) => {
      return scoreDriverApplication(input);
    }),
  
  // ============================================================================
  // LAUNCH ORCHESTRATION
  // ============================================================================
  
  // Create launch plan
  createLaunch: adminProcedure
    .input(z.object({
      marketId: z.number(),
      budget: z.number(),
      launchLeadId: z.number().optional()
    }))
    .mutation(async ({ input }) => {
      const launchId = await createLaunchPlan(input.marketId, input.budget, input.launchLeadId);
      return { launchId };
    }),
  
  // Assess launch health
  getLaunchHealth: adminProcedure
    .input(z.object({
      launchId: z.number()
    }))
    .query(async ({ input }) => {
      return assessLaunchHealth(input.launchId);
    }),
  
  // Record performance metrics
  recordMetrics: adminProcedure
    .input(z.object({
      launchId: z.number(),
      period: z.enum(["daily", "weekly", "monthly"]),
      metrics: z.object({
        activeDrivers: z.number(),
        newDrivers: z.number(),
        driverChurn: z.number(),
        driverRetention: z.number(),
        avgDriverEarnings: z.number(),
        driverSatisfaction: z.number(),
        totalRides: z.number(),
        uniqueRiders: z.number(),
        newRiders: z.number(),
        riderChurn: z.number(),
        riderRetention: z.number(),
        avgRidesPerRider: z.number(),
        riderSatisfaction: z.number(),
        avgWaitTime: z.number(),
        acceptanceRate: z.number(),
        cancellationRate: z.number(),
        avgRating: z.number(),
        revenue: z.number(),
        driverPayments: z.number(),
        contributionMargin: z.number(),
        rideGrowthRate: z.number(),
        revenueGrowthRate: z.number(),
      })
    }))
    .mutation(async ({ input }) => {
      await recordPerformanceMetrics(input.launchId, input.period, input.metrics);
      return { success: true };
    }),
  
  // Complete milestone
  completeMilestone: adminProcedure
    .input(z.object({
      milestoneId: z.number(),
      notes: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      await completeMilestone(input.milestoneId, input.notes);
      return { success: true };
    }),
  
  // Get upcoming milestones
  getUpcomingMilestones: adminProcedure
    .input(z.object({
      launchId: z.number(),
      limit: z.number().default(5)
    }))
    .query(async ({ input }) => {
      return getUpcomingMilestones(input.launchId, input.limit);
    }),
});
