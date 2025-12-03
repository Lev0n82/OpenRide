/**
 * Regulatory Assessment Service
 * 
 * Automated system for identifying and tracking regulatory requirements
 * in new markets, generating compliance roadmaps, and monitoring ongoing compliance
 */

import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { 
  regulatoryRequirements,
  marketOpportunities,
  type InsertRegulatoryRequirement 
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface RegulatoryContext {
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  serviceType: "rideshare" | "delivery" | "courier";
}

export interface RegulatoryRequirementData {
  requirementType: "platform_license" | "driver_license" | "vehicle_inspection" | "insurance" | "background_check" | "data_privacy" | "tax_registration" | "accessibility" | "other";
  requirementName: string;
  description: string;
  jurisdictionLevel: "federal" | "state" | "municipal";
  jurisdictionName: string;
  isRequired: boolean;
  estimatedCost: number; // cents
  estimatedTimeToComplete: number; // days
  renewalFrequency: string;
  regulationUrl?: string;
  applicationUrl?: string;
  guidanceNotes?: string;
}

export interface ComplianceRoadmap {
  marketId: number;
  totalRequirements: number;
  estimatedTotalCost: number; // cents
  estimatedTotalTime: number; // days (critical path)
  requirements: RegulatoryRequirementData[];
  criticalPath: string[]; // requirement names in order
  risks: string[];
  recommendations: string[];
}

// ============================================================================
// AI-POWERED REGULATORY ANALYSIS
// ============================================================================

/**
 * Generate comprehensive regulatory assessment using AI
 */
export async function generateRegulatoryAssessment(
  context: RegulatoryContext
): Promise<{
  requirements: RegulatoryRequirementData[];
  summary: string;
  risks: string[];
  estimatedTimeline: number;
  estimatedCost: number;
}> {
  
  const prompt = `You are a regulatory compliance expert specializing in transportation network companies (TNCs), ridesharing, and delivery services. Analyze the regulatory requirements for launching OpenRide in the following market:

**Market:** ${context.city}, ${context.state ? context.state + ', ' : ''}${context.country}
**Service Types:** Rideshare, Delivery, Courier
**Platform Model:** Decentralized, driver-owned cooperative with DAO governance

Identify ALL regulatory requirements across three jurisdiction levels:
1. **Federal/National** requirements
2. **State/Provincial** requirements (if applicable)
3. **Municipal/City** requirements

For EACH requirement, provide:
- Requirement type (platform license, driver license, vehicle inspection, insurance, background check, data privacy, tax registration, accessibility, other)
- Specific requirement name
- Brief description
- Jurisdiction level and name
- Whether it's mandatory or optional
- Estimated cost (in USD)
- Estimated time to complete (in days)
- Renewal frequency (annual, biennial, one-time, none)

Also provide:
- Summary of regulatory environment (2-3 sentences)
- Key risks and challenges
- Estimated total timeline to full compliance (days)
- Estimated total cost (USD)

Format your response as JSON with this structure:
{
  "requirements": [
    {
      "requirementType": "platform_license",
      "requirementName": "TNC Operating License",
      "description": "...",
      "jurisdictionLevel": "state",
      "jurisdictionName": "Ontario",
      "isRequired": true,
      "estimatedCost": 5000,
      "estimatedTimeToComplete": 90,
      "renewalFrequency": "annual"
    }
  ],
  "summary": "...",
  "risks": ["...", "..."],
  "estimatedTimeline": 120,
  "estimatedCost": 15000
}

Be thorough and specific. Include all licenses, permits, insurance, background checks, vehicle requirements, data privacy compliance, tax obligations, and accessibility requirements.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a regulatory compliance expert for transportation and delivery services. Provide comprehensive, accurate regulatory analysis in JSON format." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "regulatory_assessment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            requirements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  requirementType: { type: "string" },
                  requirementName: { type: "string" },
                  description: { type: "string" },
                  jurisdictionLevel: { type: "string" },
                  jurisdictionName: { type: "string" },
                  isRequired: { type: "boolean" },
                  estimatedCost: { type: "number" },
                  estimatedTimeToComplete: { type: "number" },
                  renewalFrequency: { type: "string" }
                },
                required: ["requirementType", "requirementName", "description", "jurisdictionLevel", "jurisdictionName", "isRequired", "estimatedCost", "estimatedTimeToComplete", "renewalFrequency"],
                additionalProperties: false
              }
            },
            summary: { type: "string" },
            risks: {
              type: "array",
              items: { type: "string" }
            },
            estimatedTimeline: { type: "number" },
            estimatedCost: { type: "number" }
          },
          required: ["requirements", "summary", "risks", "estimatedTimeline", "estimatedCost"],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const result = typeof content === 'string' ? JSON.parse(content) : content;
  
  // Convert requirements to proper format
  const requirements: RegulatoryRequirementData[] = result.requirements.map((req: any) => ({
    ...req,
    estimatedCost: Math.round(req.estimatedCost * 100), // Convert to cents
  }));

  return {
    requirements,
    summary: result.summary,
    risks: result.risks,
    estimatedTimeline: result.estimatedTimeline,
    estimatedCost: Math.round(result.estimatedCost * 100) // Convert to cents
  };
}

// ============================================================================
// COMPLIANCE ROADMAP GENERATION
// ============================================================================

/**
 * Generate a compliance roadmap with critical path analysis
 */
export async function generateComplianceRoadmap(
  marketId: number,
  requirements: RegulatoryRequirementData[]
): Promise<ComplianceRoadmap> {
  
  // Calculate total cost and time
  const estimatedTotalCost = requirements.reduce((sum, req) => sum + req.estimatedCost, 0);
  
  // Determine critical path (requirements that must be done sequentially)
  // In practice, many requirements can be done in parallel
  // Critical path typically: Platform license → Insurance → Driver onboarding → Vehicle inspection
  const criticalPath = determineCriticalPath(requirements);
  const estimatedTotalTime = calculateCriticalPathTime(requirements, criticalPath);
  
  // Identify risks
  const risks = identifyComplianceRisks(requirements);
  
  // Generate recommendations
  const recommendations = generateComplianceRecommendations(requirements);
  
  return {
    marketId,
    totalRequirements: requirements.length,
    estimatedTotalCost,
    estimatedTotalTime,
    requirements,
    criticalPath,
    risks,
    recommendations
  };
}

function determineCriticalPath(requirements: RegulatoryRequirementData[]): string[] {
  const path: string[] = [];
  
  // Priority order for critical path
  const priorityTypes = [
    "platform_license",
    "insurance",
    "tax_registration",
    "driver_license",
    "vehicle_inspection",
    "background_check",
    "data_privacy",
    "accessibility"
  ];
  
  for (const type of priorityTypes) {
    const req = requirements.find(r => r.requirementType === type && r.isRequired);
    if (req) {
      path.push(req.requirementName);
    }
  }
  
  return path;
}

function calculateCriticalPathTime(requirements: RegulatoryRequirementData[], criticalPath: string[]): number {
  let totalTime = 0;
  
  for (const reqName of criticalPath) {
    const req = requirements.find(r => r.requirementName === reqName);
    if (req) {
      totalTime += req.estimatedTimeToComplete;
    }
  }
  
  // Add 20% buffer for delays
  return Math.round(totalTime * 1.2);
}

function identifyComplianceRisks(requirements: RegulatoryRequirementData[]): string[] {
  const risks: string[] = [];
  
  // Check for expensive requirements
  const expensiveReqs = requirements.filter(r => r.estimatedCost > 1000000); // > $10,000
  if (expensiveReqs.length > 0) {
    risks.push(`High compliance costs: ${expensiveReqs.length} requirements over $10,000 each`);
  }
  
  // Check for time-consuming requirements
  const slowReqs = requirements.filter(r => r.estimatedTimeToComplete > 180); // > 6 months
  if (slowReqs.length > 0) {
    risks.push(`Lengthy approval processes: ${slowReqs.length} requirements taking over 6 months`);
  }
  
  // Check for federal/national requirements (often more complex)
  const federalReqs = requirements.filter(r => r.jurisdictionLevel === "federal");
  if (federalReqs.length > 3) {
    risks.push(`Complex federal compliance: ${federalReqs.length} national-level requirements`);
  }
  
  // Check for data privacy requirements (GDPR, etc.)
  const privacyReqs = requirements.filter(r => r.requirementType === "data_privacy");
  if (privacyReqs.length > 0) {
    risks.push("Data privacy compliance required (may need legal counsel and technical implementation)");
  }
  
  return risks;
}

function generateComplianceRecommendations(requirements: RegulatoryRequirementData[]): string[] {
  const recommendations: string[] = [];
  
  // Recommend parallel processing
  const parallelizable = requirements.filter(r => 
    r.requirementType !== "platform_license" && r.isRequired
  );
  if (parallelizable.length > 3) {
    recommendations.push(`Process ${parallelizable.length} requirements in parallel to reduce timeline`);
  }
  
  // Recommend early start on slow items
  const slowReqs = requirements.filter(r => r.estimatedTimeToComplete > 90);
  if (slowReqs.length > 0) {
    recommendations.push(`Start early on: ${slowReqs.map(r => r.requirementName).join(", ")}`);
  }
  
  // Recommend legal counsel for complex jurisdictions
  const federalReqs = requirements.filter(r => r.jurisdictionLevel === "federal");
  if (federalReqs.length > 2) {
    recommendations.push("Engage local legal counsel for federal/national requirements");
  }
  
  // Recommend budget allocation
  const totalCost = requirements.reduce((sum, req) => sum + req.estimatedCost, 0);
  recommendations.push(`Allocate $${(totalCost / 100).toLocaleString()} + 25% contingency for compliance costs`);
  
  return recommendations;
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save regulatory requirements to database
 */
export async function saveRegulatoryRequirements(
  marketId: number,
  requirements: RegulatoryRequirementData[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const records: InsertRegulatoryRequirement[] = requirements.map(req => ({
    marketId,
    requirementType: req.requirementType,
    requirementName: req.requirementName,
    description: req.description,
    jurisdictionLevel: req.jurisdictionLevel,
    jurisdictionName: req.jurisdictionName,
    isRequired: req.isRequired,
    estimatedCost: req.estimatedCost,
    estimatedTimeToComplete: req.estimatedTimeToComplete,
    renewalFrequency: req.renewalFrequency,
    regulationUrl: req.regulationUrl,
    applicationUrl: req.applicationUrl,
    guidanceNotes: req.guidanceNotes,
    status: "identified"
  }));
  
  await db.insert(regulatoryRequirements).values(records);
}

/**
 * Get regulatory requirements for a market
 */
export async function getRegulatoryRequirements(marketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(regulatoryRequirements)
    .where(eq(regulatoryRequirements.marketId, marketId));
}

/**
 * Update requirement status
 */
export async function updateRequirementStatus(
  requirementId: number,
  status: "identified" | "in_progress" | "submitted" | "approved" | "rejected" | "not_applicable",
  assignedTo?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updates: any = { status, updatedAt: new Date() };
  if (assignedTo) updates.assignedTo = assignedTo;
  if (status === "approved") updates.completedAt = new Date();
  
  await db.update(regulatoryRequirements)
    .set(updates)
    .where(eq(regulatoryRequirements.id, requirementId));
}

/**
 * Get compliance progress for a market
 */
export async function getComplianceProgress(marketId: number): Promise<{
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  percentComplete: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const requirements = await db.select().from(regulatoryRequirements)
    .where(eq(regulatoryRequirements.marketId, marketId));
  
  const total = requirements.length;
  const completed = requirements.filter(r => r.status === "approved").length;
  const inProgress = requirements.filter(r => r.status === "in_progress" || r.status === "submitted").length;
  const notStarted = requirements.filter(r => r.status === "identified").length;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    percentComplete
  };
}

// ============================================================================
// REGULATORY MONITORING
// ============================================================================

/**
 * Monitor for regulatory changes in active markets
 * This would be called periodically (e.g., weekly) to detect new regulations
 */
export async function monitorRegulatoryChanges(context: RegulatoryContext): Promise<{
  hasChanges: boolean;
  changes: Array<{
    type: "new_requirement" | "updated_requirement" | "removed_requirement";
    description: string;
    impact: "high" | "medium" | "low";
  }>;
}> {
  
  // In production, this would:
  // 1. Scrape government websites
  // 2. Check legislative tracking services
  // 3. Monitor industry news
  // 4. Use AI to detect relevant changes
  
  // For now, return placeholder
  return {
    hasChanges: false,
    changes: []
  };
}

/**
 * Generate compliance checklist for launch team
 */
export async function generateComplianceChecklist(marketId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const requirements = await db.select().from(regulatoryRequirements)
    .where(eq(regulatoryRequirements.marketId, marketId));
  
  const market = await db.select().from(marketOpportunities)
    .where(eq(marketOpportunities.id, marketId))
    .limit(1);
  
  if (!market[0]) throw new Error("Market not found");
  
  let checklist = `# Regulatory Compliance Checklist\n\n`;
  checklist += `**Market:** ${market[0].city}, ${market[0].state || ''} ${market[0].country}\n`;
  checklist += `**Total Requirements:** ${requirements.length}\n`;
  checklist += `**Estimated Timeline:** ${Math.max(...requirements.map(r => r.estimatedTimeToComplete || 0))} days\n`;
  checklist += `**Estimated Cost:** $${(requirements.reduce((sum, r) => sum + (r.estimatedCost || 0), 0) / 100).toLocaleString()}\n\n`;
  
  // Group by jurisdiction level
  const federal = requirements.filter(r => r.jurisdictionLevel === "federal");
  const state = requirements.filter(r => r.jurisdictionLevel === "state");
  const municipal = requirements.filter(r => r.jurisdictionLevel === "municipal");
  
  if (federal.length > 0) {
    checklist += `## Federal/National Requirements\n\n`;
    federal.forEach(req => {
      checklist += `- [ ] **${req.requirementName}**\n`;
      checklist += `  - ${req.description}\n`;
      checklist += `  - Cost: $${((req.estimatedCost || 0) / 100).toLocaleString()}\n`;
      checklist += `  - Timeline: ${req.estimatedTimeToComplete} days\n`;
      checklist += `  - Status: ${req.status}\n\n`;
    });
  }
  
  if (state.length > 0) {
    checklist += `## State/Provincial Requirements\n\n`;
    state.forEach(req => {
      checklist += `- [ ] **${req.requirementName}**\n`;
      checklist += `  - ${req.description}\n`;
      checklist += `  - Cost: $${((req.estimatedCost || 0) / 100).toLocaleString()}\n`;
      checklist += `  - Timeline: ${req.estimatedTimeToComplete} days\n`;
      checklist += `  - Status: ${req.status}\n\n`;
    });
  }
  
  if (municipal.length > 0) {
    checklist += `## Municipal/City Requirements\n\n`;
    municipal.forEach(req => {
      checklist += `- [ ] **${req.requirementName}**\n`;
      checklist += `  - ${req.description}\n`;
      checklist += `  - Cost: $${((req.estimatedCost || 0) / 100).toLocaleString()}\n`;
      checklist += `  - Timeline: ${req.estimatedTimeToComplete} days\n`;
      checklist += `  - Status: ${req.status}\n\n`;
    });
  }
  
  return checklist;
}
