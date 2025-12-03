/**
 * AI Market Analysis Service
 * 
 * Autonomous system for identifying, evaluating, and scoring expansion opportunities
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { 
  marketOpportunities, 
  marketAnalysisReports,
  type InsertMarketOpportunity,
  type InsertMarketAnalysisReport 
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketData {
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  region: string;
  population: number;
  metroPopulation: number;
  gdpPerCapita: number;
  smartphonePenetration: number;
  rideshareAdoptionRate: number;
  vehicleOwnershipRate: number;
}

export interface CompetitiveData {
  competitorCount: number;
  marketLeader: string;
  marketLeaderShare: number;
  marketSaturation: number;
  averageRidePrice: number;
}

export interface RegulatoryData {
  regulatoryStatus: "permissive" | "moderate" | "restrictive" | "unclear" | "prohibited";
  licenseRequired: boolean;
  estimatedComplianceTime: number; // days
  estimatedComplianceCost: number; // cents
}

export interface OpportunityScore {
  overallScore: number;
  marketAttractivenessScore: number;
  competitiveLandscapeScore: number;
  regulatoryFeasibilityScore: number;
  operationalReadinessScore: number;
  tier: "tier1" | "tier2" | "tier3" | "watch";
  recommendation: "immediate_evaluation" | "evaluate_within_6mo" | "monitor" | "not_viable";
  confidenceScore: number;
}

// ============================================================================
// OPPORTUNITY SCORING ALGORITHM
// ============================================================================

/**
 * Calculate comprehensive opportunity score for a market
 * Based on weighted factors across 4 dimensions
 */
export function calculateOpportunityScore(
  market: MarketData,
  competitive: CompetitiveData,
  regulatory: RegulatoryData,
  infrastructure: {
    roadQuality: number; // 0-10
    gpsAccuracy: number; // 0-10
    mobileNetwork: number; // 0-10
    paymentSystems: number; // 0-10
    languageBarrier: number; // 0-10 (10 = no barrier)
  }
): OpportunityScore {
  
  // Market Attractiveness (40% weight)
  const populationScore = scorePopulation(market.metroPopulation);
  const incomeScore = scoreIncome(market.gdpPerCapita);
  const smartphoneScore = market.smartphonePenetration / 10; // 0-100 to 0-10
  const adoptionScore = market.rideshareAdoptionRate / 10;
  const growthScore = estimateGrowthPotential(market);
  
  const marketAttractivenessScore = Math.round(
    (populationScore * 10 + 
     incomeScore * 10 + 
     smartphoneScore * 5 + 
     adoptionScore * 10 + 
     growthScore * 5) / 40 * 100
  );
  
  // Competitive Landscape (20% weight)
  const competitorScore = scoreCompetitorStrength(competitive);
  const saturationScore = 100 - competitive.marketSaturation;
  const pricingScore = scorePricingEnvironment(competitive.averageRidePrice);
  
  const competitiveLandscapeScore = Math.round(
    (competitorScore * 10 + 
     saturationScore / 10 * 5 + 
     pricingScore * 5) / 20 * 100
  );
  
  // Regulatory Feasibility (25% weight)
  const regulatoryClarityScore = scoreRegulatoryClarity(regulatory.regulatoryStatus);
  const licensingScore = scoreLicensingDifficulty(regulatory.estimatedComplianceTime);
  const insuranceScore = 7; // Placeholder - would assess insurance availability
  const timeToComplianceScore = scoreTimeToCompliance(regulatory.estimatedComplianceTime);
  
  const regulatoryFeasibilityScore = Math.round(
    (regulatoryClarityScore * 10 + 
     licensingScore * 5 + 
     insuranceScore * 5 + 
     timeToComplianceScore * 5) / 25 * 100
  );
  
  // Operational Readiness (15% weight)
  const infrastructureScore = Math.round(
    (infrastructure.roadQuality + 
     infrastructure.gpsAccuracy + 
     infrastructure.mobileNetwork + 
     infrastructure.paymentSystems + 
     infrastructure.languageBarrier) / 5
  );
  
  const operationalReadinessScore = Math.round(infrastructureScore * 10);
  
  // Overall Score (weighted average)
  const overallScore = Math.round(
    marketAttractivenessScore * 0.40 +
    competitiveLandscapeScore * 0.20 +
    regulatoryFeasibilityScore * 0.25 +
    operationalReadinessScore * 0.15
  );
  
  // Determine tier and recommendation
  let tier: "tier1" | "tier2" | "tier3" | "watch";
  let recommendation: "immediate_evaluation" | "evaluate_within_6mo" | "monitor" | "not_viable";
  
  if (overallScore >= 80) {
    tier = "tier1";
    recommendation = "immediate_evaluation";
  } else if (overallScore >= 60) {
    tier = "tier2";
    recommendation = "evaluate_within_6mo";
  } else if (overallScore >= 40) {
    tier = "tier3";
    recommendation = "monitor";
  } else {
    tier = "watch";
    recommendation = "not_viable";
  }
  
  // Confidence score based on data quality
  const confidenceScore = 85; // Placeholder - would calculate based on data completeness
  
  return {
    overallScore,
    marketAttractivenessScore,
    competitiveLandscapeScore,
    regulatoryFeasibilityScore,
    operationalReadinessScore,
    tier,
    recommendation,
    confidenceScore
  };
}

// ============================================================================
// SCORING HELPER FUNCTIONS
// ============================================================================

function scorePopulation(metroPopulation: number): number {
  if (metroPopulation >= 5000000) return 10;
  if (metroPopulation >= 2000000) return 8;
  if (metroPopulation >= 1000000) return 6;
  if (metroPopulation >= 500000) return 4;
  return 2;
}

function scoreIncome(gdpPerCapita: number): number {
  if (gdpPerCapita >= 75000) return 10;
  if (gdpPerCapita >= 50000) return 8;
  if (gdpPerCapita >= 30000) return 6;
  if (gdpPerCapita >= 20000) return 4;
  return 2;
}

function estimateGrowthPotential(market: MarketData): number {
  // Higher growth potential if:
  // - Lower current rideshare adoption (more room to grow)
  // - Higher smartphone penetration (ready for adoption)
  // - Moderate vehicle ownership (need for alternatives)
  
  const adoptionGap = 100 - market.rideshareAdoptionRate;
  const readiness = market.smartphonePenetration;
  const need = 100 - market.vehicleOwnershipRate;
  
  return Math.round((adoptionGap * 0.4 + readiness * 0.3 + need * 0.3) / 10);
}

function scoreCompetitorStrength(competitive: CompetitiveData): number {
  // Lower competitor strength is better
  if (competitive.competitorCount === 0) return 10;
  if (competitive.marketLeaderShare < 30) return 8;
  if (competitive.marketLeaderShare < 50) return 6;
  if (competitive.marketLeaderShare < 70) return 4;
  return 2;
}

function scorePricingEnvironment(averageRidePrice: number): number {
  // Moderate to premium pricing is ideal (room for competitive pricing)
  // Very low pricing suggests race to bottom
  const priceInDollars = averageRidePrice / 100;
  
  if (priceInDollars >= 20) return 8; // Premium market
  if (priceInDollars >= 15) return 10; // Ideal range
  if (priceInDollars >= 10) return 6; // Moderate
  if (priceInDollars >= 5) return 4; // Low
  return 2; // Race to bottom
}

function scoreRegulatoryClarity(status: string): number {
  switch (status) {
    case "permissive": return 10;
    case "moderate": return 7;
    case "restrictive": return 5;
    case "unclear": return 3;
    case "prohibited": return 0;
    default: return 5;
  }
}

function scoreLicensingDifficulty(complianceTimeDays: number): number {
  if (complianceTimeDays <= 90) return 10; // < 3 months
  if (complianceTimeDays <= 180) return 7; // 3-6 months
  if (complianceTimeDays <= 270) return 5; // 6-9 months
  if (complianceTimeDays <= 365) return 3; // 9-12 months
  return 2; // > 12 months
}

function scoreTimeToCompliance(days: number): number {
  if (days <= 90) return 10;
  if (days <= 180) return 8;
  if (days <= 270) return 6;
  if (days <= 365) return 4;
  return 2;
}

// ============================================================================
// AI ANALYSIS GENERATION
// ============================================================================

/**
 * Generate AI-powered market analysis summary
 */
export async function generateMarketAnalysis(
  market: MarketData,
  competitive: CompetitiveData,
  regulatory: RegulatoryData,
  score: OpportunityScore
): Promise<string> {
  
  const prompt = `You are an expert market analyst for OpenRide, a decentralized rideshare platform. Analyze the following market opportunity and provide a concise executive summary (3-4 paragraphs, 200-250 words).

**Market:** ${market.city}, ${market.state ? market.state + ', ' : ''}${market.country}
**Population:** ${market.metroPopulation.toLocaleString()}
**GDP per Capita:** $${market.gdpPerCapita.toLocaleString()}
**Smartphone Penetration:** ${market.smartphonePenetration}%
**Current Rideshare Adoption:** ${market.rideshareAdoptionRate}%

**Competitive Landscape:**
- Competitors: ${competitive.competitorCount}
- Market Leader: ${competitive.marketLeader} (${competitive.marketLeaderShare}% share)
- Market Saturation: ${competitive.marketSaturation}%
- Average Ride Price: $${(competitive.averageRidePrice / 100).toFixed(2)}

**Regulatory Environment:** ${regulatory.regulatoryStatus}
**Estimated Time to Compliance:** ${regulatory.estimatedComplianceTime} days
**Estimated Compliance Cost:** $${(regulatory.estimatedComplianceCost / 100).toLocaleString()}

**Opportunity Score:** ${score.overallScore}/100 (${score.tier.toUpperCase()})
**Recommendation:** ${score.recommendation.replace(/_/g, ' ').toUpperCase()}

Provide:
1. Market opportunity assessment
2. Key competitive advantages for OpenRide
3. Primary challenges and risks
4. Strategic recommendation

Be specific, data-driven, and actionable. Focus on what makes this market attractive or unattractive for OpenRide's decentralized, driver-first model.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a strategic market analyst specializing in rideshare and transportation markets. Provide concise, data-driven analysis." },
      { role: "user", content: prompt }
    ]
  });

  const content = response.choices[0].message.content;
  return typeof content === 'string' ? content : "Analysis generation failed.";
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Create or update market opportunity in database
 */
export async function saveMarketOpportunity(
  market: MarketData,
  competitive: CompetitiveData,
  regulatory: RegulatoryData,
  score: OpportunityScore,
  aiAnalysis: string
): Promise<number> {
  
  const opportunity: InsertMarketOpportunity = {
    // Location
    city: market.city,
    state: market.state,
    country: market.country,
    countryCode: market.countryCode,
    region: market.region,
    
    // Tier and scores
    tier: score.tier,
    overallScore: score.overallScore,
    marketAttractivenessScore: score.marketAttractivenessScore,
    competitiveLandscapeScore: score.competitiveLandscapeScore,
    regulatoryFeasibilityScore: score.regulatoryFeasibilityScore,
    operationalReadinessScore: score.operationalReadinessScore,
    
    // Market data
    population: market.population,
    metroPopulation: market.metroPopulation,
    gdpPerCapita: market.gdpPerCapita,
    smartphonePenetration: market.smartphonePenetration,
    rideshareAdoptionRate: market.rideshareAdoptionRate,
    vehicleOwnershipRate: market.vehicleOwnershipRate,
    
    // Competitive data
    competitorCount: competitive.competitorCount,
    marketLeader: competitive.marketLeader,
    marketLeaderShare: competitive.marketLeaderShare,
    marketSaturation: competitive.marketSaturation,
    averageRidePrice: competitive.averageRidePrice,
    
    // Regulatory data
    regulatoryStatus: regulatory.regulatoryStatus,
    licenseRequired: regulatory.licenseRequired,
    estimatedComplianceTime: regulatory.estimatedComplianceTime,
    estimatedComplianceCost: regulatory.estimatedComplianceCost,
    
    // AI analysis
    aiAnalysisSummary: aiAnalysis,
    aiRecommendation: score.recommendation,
    aiConfidenceScore: score.confidenceScore,
    
    // Status
    status: "identified",
    lastAnalyzedAt: new Date(),
  };
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(marketOpportunities).values(opportunity);
  return result.insertId;
}

/**
 * Get all market opportunities sorted by score
 */
export async function getMarketOpportunities(tier?: "tier1" | "tier2" | "tier3" | "watch") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (tier) {
    return db.select().from(marketOpportunities)
      .where(eq(marketOpportunities.tier, tier))
      .orderBy(desc(marketOpportunities.overallScore));
  }
  
  return db.select().from(marketOpportunities)
    .orderBy(desc(marketOpportunities.overallScore));
}

/**
 * Get market opportunity by ID
 */
export async function getMarketOpportunityById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select().from(marketOpportunities)
    .where(eq(marketOpportunities.id, id))
    .limit(1);
  return results[0] || null;
}

/**
 * Update market opportunity status
 */
export async function updateMarketStatus(
  id: number, 
  status: "identified" | "preliminary_assessment" | "deep_dive_analysis" | "dao_proposal" | "approved" | "rejected" | "launched"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(marketOpportunities)
    .set({ status, updatedAt: new Date() })
    .where(eq(marketOpportunities.id, id));
}

// ============================================================================
// AUTOMATED MARKET SCANNING
// ============================================================================

/**
 * Scan and analyze a list of cities for expansion opportunities
 * This would be called periodically (e.g., monthly) to identify new opportunities
 */
export async function scanMarketsForOpportunities(cities: Array<{
  city: string;
  state?: string;
  country: string;
  countryCode: string;
}>) {
  const results = [];
  
  for (const cityInfo of cities) {
    try {
      // In production, this would fetch real data from APIs
      // For now, using placeholder data
      const market: MarketData = {
        ...cityInfo,
        region: getRegion(cityInfo.countryCode),
        population: 1000000, // Placeholder
        metroPopulation: 1500000, // Placeholder
        gdpPerCapita: 50000, // Placeholder
        smartphonePenetration: 85, // Placeholder
        rideshareAdoptionRate: 25, // Placeholder
        vehicleOwnershipRate: 70, // Placeholder
      };
      
      const competitive: CompetitiveData = {
        competitorCount: 2,
        marketLeader: "Uber",
        marketLeaderShare: 60,
        marketSaturation: 40,
        averageRidePrice: 1500, // $15.00
      };
      
      const regulatory: RegulatoryData = {
        regulatoryStatus: "moderate",
        licenseRequired: true,
        estimatedComplianceTime: 120,
        estimatedComplianceCost: 500000, // $5,000
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
      
      results.push({
        marketId,
        city: cityInfo.city,
        score: score.overallScore,
        tier: score.tier,
        recommendation: score.recommendation
      });
      
    } catch (error) {
      console.error(`Error analyzing ${cityInfo.city}:`, error);
    }
  }
  
  return results;
}

function getRegion(countryCode: string): string {
  const regions: Record<string, string> = {
    'CA': 'North America',
    'US': 'North America',
    'MX': 'Latin America',
    'GB': 'Europe',
    'DE': 'Europe',
    'FR': 'Europe',
    'AU': 'Asia-Pacific',
    'NZ': 'Asia-Pacific',
    'SG': 'Asia-Pacific',
    'JP': 'Asia-Pacific',
  };
  
  return regions[countryCode] || 'Other';
}
