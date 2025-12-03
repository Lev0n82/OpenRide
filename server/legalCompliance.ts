/**
 * Legal Compliance Automation System
 * 
 * Implements automated regulatory monitoring, compliance checking,
 * and legal document generation as defined in the AI Governance Manifesto.
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";

// ==================== Types ====================

export interface RegulatoryChange {
  id: string;
  jurisdiction: string;
  authority: string;
  title: string;
  description: string;
  effectiveDate: Date;
  impactLevel: "low" | "medium" | "high" | "critical";
  affectedAreas: string[];
  complianceDeadline: Date;
  estimatedCost: number;
  status: "detected" | "analyzed" | "action_required" | "compliant";
}

export interface ComplianceCheck {
  checkType: string;
  entity: string;
  entityId: number;
  passed: boolean;
  issues: string[];
  timestamp: Date;
  autoRemediated: boolean;
}

export interface LegalDocument {
  type: string;
  jurisdiction: string;
  version: string;
  content: string;
  effectiveDate: Date;
  lastUpdated: Date;
  approvedBy: string;
}

export interface RiskAssessment {
  category: "regulatory" | "legal_liability" | "financial" | "reputational";
  riskScore: number; // 0-100
  description: string;
  indicators: string[];
  mitigationActions: string[];
  status: "monitoring" | "action_required" | "mitigated";
  lastAssessed: Date;
}

// ==================== Regulatory Monitoring ====================

/**
 * Canadian regulatory authorities to monitor
 */
const REGULATORY_AUTHORITIES = {
  federal: [
    { name: "Transport Canada", url: "https://tc.canada.ca", topics: ["transportation", "safety"] },
    { name: "FINTRAC", url: "https://fintrac-canafe.canada.ca", topics: ["financial", "blockchain"] },
    { name: "Privacy Commissioner", url: "https://priv.gc.ca", topics: ["privacy", "data"] },
    { name: "CSA", url: "https://securities-administrators.ca", topics: ["securities", "tokens"] },
  ],
  ontario: [
    { name: "FSRA", url: "https://fsrao.ca", topics: ["insurance", "financial"] },
    { name: "MTO", url: "https://ontario.ca/transportation", topics: ["licensing", "vehicles"] },
  ],
  // Add other provinces as needed
};

/**
 * Simulates monitoring regulatory websites for changes
 * In production, this would use web scraping, RSS feeds, or official APIs
 */
export async function monitorRegulatoryChanges(): Promise<RegulatoryChange[]> {
  const changes: RegulatoryChange[] = [];

  // Simulate AI-powered regulatory change detection
  const prompt = `You are a legal AI monitoring Canadian transportation and insurance regulations.
  
Analyze recent regulatory changes that might affect a ridesharing platform operating in Canada.
Consider:
- Transportation Network Company (TNC) regulations
- Insurance requirements for ridesharing
- Driver licensing and background checks
- Data privacy (PIPEDA)
- Securities regulations for governance tokens
- Provincial variations

Return a JSON array of regulatory changes with this structure:
{
  "jurisdiction": "Federal" | "Ontario" | "BC" | etc,
  "authority": "Transport Canada" | "FSRA" | etc,
  "title": "Brief title",
  "description": "What changed",
  "impactLevel": "low" | "medium" | "high" | "critical",
  "affectedAreas": ["insurance", "licensing", etc],
  "daysUntilEffective": number,
  "estimatedComplianceCost": number
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a legal compliance AI assistant." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "regulatory_changes",
          strict: true,
          schema: {
            type: "object",
            properties: {
              changes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    jurisdiction: { type: "string" },
                    authority: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    impactLevel: { type: "string", enum: ["low", "medium", "high", "critical"] },
                    affectedAreas: { type: "array", items: { type: "string" } },
                    daysUntilEffective: { type: "number" },
                    estimatedComplianceCost: { type: "number" },
                  },
                  required: ["jurisdiction", "authority", "title", "description", "impactLevel", "affectedAreas", "daysUntilEffective", "estimatedComplianceCost"],
                  additionalProperties: false,
                },
              },
            },
            required: ["changes"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result = JSON.parse(contentStr || '{"changes":[]}');
    
    for (const change of result.changes) {
      const effectiveDate = new Date();
      effectiveDate.setDate(effectiveDate.getDate() + change.daysUntilEffective);
      
      const complianceDeadline = new Date(effectiveDate);
      complianceDeadline.setDate(complianceDeadline.getDate() - 30); // 30 days before effective

      changes.push({
        id: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        jurisdiction: change.jurisdiction,
        authority: change.authority,
        title: change.title,
        description: change.description,
        effectiveDate,
        impactLevel: change.impactLevel,
        affectedAreas: change.affectedAreas,
        complianceDeadline,
        estimatedCost: change.estimatedComplianceCost,
        status: "detected",
      });
    }
  } catch (error) {
    console.error("Error monitoring regulatory changes:", error);
  }

  return changes;
}

// ==================== Compliance Checking ====================

/**
 * Validates driver compliance with all regulatory requirements
 */
export async function checkDriverCompliance(driver: {
  id: number;
  licenseNumber: string;
  licenseExpiry: Date;
  insuranceExpiry: Date;
  backgroundCheckDate: Date;
  province: string;
}): Promise<ComplianceCheck> {
  const issues: string[] = [];
  const now = new Date();

  // Check license validity
  if (driver.licenseExpiry < now) {
    issues.push("Driver license expired");
  } else if (driver.licenseExpiry < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
    issues.push("Driver license expires within 30 days");
  }

  // Check insurance validity
  if (driver.insuranceExpiry < now) {
    issues.push("Insurance expired - CRITICAL: Driver must be suspended immediately");
  } else if (driver.insuranceExpiry < new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) {
    issues.push("Insurance expires within 14 days");
  }

  // Check background check recency (must be within 1 year)
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  if (driver.backgroundCheckDate < oneYearAgo) {
    issues.push("Background check older than 1 year - renewal required");
  }

  // Province-specific checks
  if (driver.province === "Ontario") {
    // Ontario requires specific insurance minimums
    // In production, would verify with FSRA database
  }

  return {
    checkType: "driver_compliance",
    entity: "driver",
    entityId: driver.id,
    passed: issues.length === 0,
    issues,
    timestamp: now,
    autoRemediated: false,
  };
}

/**
 * Validates ride compliance with regulations
 */
export async function checkRideCompliance(ride: {
  id: number;
  pickupProvince: string;
  dropoffProvince: string;
  driverId: number;
  fare: number;
  distance: number;
}): Promise<ComplianceCheck> {
  const issues: string[] = [];

  // Check cross-province rides (may require additional licensing)
  if (ride.pickupProvince !== ride.dropoffProvince) {
    issues.push(`Cross-province ride requires verification of driver licensing in ${ride.dropoffProvince}`);
  }

  // Check fare reasonableness (anti-price-gouging)
  const maxFarePerKm = 5.0; // $5/km maximum
  const farePerKm = ride.fare / ride.distance;
  if (farePerKm > maxFarePerKm) {
    issues.push(`Fare per km ($${farePerKm.toFixed(2)}) exceeds maximum ($${maxFarePerKm})`);
  }

  return {
    checkType: "ride_compliance",
    entity: "ride",
    entityId: ride.id,
    passed: issues.length === 0,
    issues,
    timestamp: new Date(),
    autoRemediated: false,
  };
}

/**
 * Validates insurance pool adequacy
 */
export async function checkInsurancePoolCompliance(pool: {
  currentBalance: number;
  monthlyClaimsAverage: number;
  minimumReserveMonths: number;
}): Promise<ComplianceCheck> {
  const issues: string[] = [];
  
  const requiredReserve = pool.monthlyClaimsAverage * pool.minimumReserveMonths;
  const reserveRatio = pool.currentBalance / requiredReserve;

  if (reserveRatio < 1.0) {
    issues.push(`Insurance pool below required reserve: $${pool.currentBalance.toFixed(2)} / $${requiredReserve.toFixed(2)} (${(reserveRatio * 100).toFixed(1)}%)`);
  } else if (reserveRatio < 1.2) {
    issues.push(`Insurance pool approaching minimum reserve: ${(reserveRatio * 100).toFixed(1)}% of required`);
  }

  return {
    checkType: "insurance_pool_compliance",
    entity: "insurance_pool",
    entityId: 1,
    passed: reserveRatio >= 1.0,
    issues,
    timestamp: new Date(),
    autoRemediated: false,
  };
}

// ==================== Legal Document Generation ====================

/**
 * Generates jurisdiction-specific Terms of Service
 */
export async function generateTermsOfService(jurisdiction: string): Promise<LegalDocument> {
  const prompt = `Generate comprehensive Terms of Service for a ridesharing platform operating in ${jurisdiction}, Canada.

Include sections on:
1. Service description and scope
2. User eligibility and registration
3. Driver requirements and obligations
4. Rider responsibilities
5. Payment terms and fees (13% network fee: 10% insurance, 2.5% developer, 0.5% buyback)
6. Insurance coverage and liability
7. Dispute resolution and arbitration
8. Privacy and data protection (PIPEDA compliance)
9. Termination and suspension
10. Governing law (${jurisdiction} law)

Make it legally sound, clear, and user-friendly. Include all necessary disclaimers and limitations of liability.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a legal AI assistant specializing in Canadian transportation law." },
        { role: "user", content: prompt },
      ],
    });

    const content = typeof response.choices[0]?.message?.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0]?.message?.content) || "";

    return {
      type: "terms_of_service",
      jurisdiction,
      version: `1.0.${Date.now()}`,
      content,
      effectiveDate: new Date(),
      lastUpdated: new Date(),
      approvedBy: "AI_Generated_Pending_Review",
    };
  } catch (error) {
    console.error("Error generating Terms of Service:", error);
    throw error;
  }
}

/**
 * Generates driver service agreement
 */
export async function generateDriverAgreement(jurisdiction: string): Promise<LegalDocument> {
  const prompt = `Generate a comprehensive Driver Service Agreement for a ridesharing platform in ${jurisdiction}, Canada.

Include sections on:
1. Independent contractor relationship (not employee)
2. Driver obligations and standards
3. Vehicle requirements and maintenance
4. Insurance requirements (commercial rideshare insurance)
5. Background checks and ongoing verification
6. Earnings structure (drivers keep 87% of fare)
7. RIDE token rewards and governance rights
8. Termination conditions
9. Dispute resolution
10. Tax obligations and reporting

Ensure compliance with ${jurisdiction} employment law and CRA independent contractor guidelines.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a legal AI assistant specializing in Canadian employment and transportation law." },
        { role: "user", content: prompt },
      ],
    });

    const content = typeof response.choices[0]?.message?.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0]?.message?.content) || "";

    return {
      type: "driver_agreement",
      jurisdiction,
      version: `1.0.${Date.now()}`,
      content,
      effectiveDate: new Date(),
      lastUpdated: new Date(),
      approvedBy: "AI_Generated_Pending_Review",
    };
  } catch (error) {
    console.error("Error generating Driver Agreement:", error);
    throw error;
  }
}

// ==================== Risk Assessment ====================

/**
 * Assesses regulatory risk based on current compliance status
 */
export async function assessRegulatoryRisk(complianceChecks: ComplianceCheck[]): Promise<RiskAssessment> {
  const failedChecks = complianceChecks.filter(c => !c.passed);
  const criticalIssues = failedChecks.filter(c => 
    c.issues.some(issue => issue.includes("CRITICAL") || issue.includes("expired"))
  );

  let riskScore = 0;
  const indicators: string[] = [];
  const mitigationActions: string[] = [];

  // Calculate risk score
  riskScore += failedChecks.length * 10;
  riskScore += criticalIssues.length * 30;
  riskScore = Math.min(riskScore, 100);

  // Identify indicators
  if (criticalIssues.length > 0) {
    indicators.push(`${criticalIssues.length} critical compliance issues detected`);
  }
  if (failedChecks.length > 10) {
    indicators.push(`High volume of compliance failures (${failedChecks.length})`);
  }

  // Recommend mitigation actions
  if (criticalIssues.length > 0) {
    mitigationActions.push("Immediately suspend non-compliant drivers");
    mitigationActions.push("Notify affected users and regulators");
  }
  if (failedChecks.length > 5) {
    mitigationActions.push("Increase compliance monitoring frequency");
    mitigationActions.push("Implement automated remediation for common issues");
  }

  return {
    category: "regulatory",
    riskScore,
    description: `Regulatory compliance risk based on ${complianceChecks.length} checks`,
    indicators,
    mitigationActions,
    status: riskScore > 70 ? "action_required" : riskScore > 40 ? "monitoring" : "mitigated",
    lastAssessed: new Date(),
  };
}

/**
 * Assesses legal liability risk based on incident patterns
 */
export async function assessLegalLiabilityRisk(incidents: {
  accidents: number;
  injuries: number;
  propertyDamage: number;
  claims: number;
  avgClaimAmount: number;
}): Promise<RiskAssessment> {
  let riskScore = 0;
  const indicators: string[] = [];
  const mitigationActions: string[] = [];

  // Calculate risk based on incident frequency
  if (incidents.accidents > 10) {
    riskScore += 20;
    indicators.push(`High accident frequency: ${incidents.accidents} accidents`);
  }
  if (incidents.injuries > 0) {
    riskScore += incidents.injuries * 15;
    indicators.push(`${incidents.injuries} injury incidents`);
  }
  if (incidents.avgClaimAmount > 10000) {
    riskScore += 25;
    indicators.push(`High average claim amount: $${incidents.avgClaimAmount.toFixed(2)}`);
  }

  riskScore = Math.min(riskScore, 100);

  // Recommend mitigation
  if (riskScore > 60) {
    mitigationActions.push("Increase driver safety training requirements");
    mitigationActions.push("Enhance vehicle inspection frequency");
    mitigationActions.push("Review and increase insurance coverage");
  }

  return {
    category: "legal_liability",
    riskScore,
    description: "Legal liability risk based on incident patterns",
    indicators,
    mitigationActions,
    status: riskScore > 70 ? "action_required" : riskScore > 40 ? "monitoring" : "mitigated",
    lastAssessed: new Date(),
  };
}

// ==================== Automated Remediation ====================

/**
 * Automatically remediates common compliance issues
 */
export async function autoRemediateCompliance(check: ComplianceCheck): Promise<boolean> {
  // Only auto-remediate non-critical issues
  const hasCriticalIssue = check.issues.some(issue => 
    issue.includes("CRITICAL") || issue.includes("expired")
  );

  if (hasCriticalIssue) {
    return false; // Requires human intervention
  }

  // Auto-remediate warnings (e.g., expiring soon)
  if (check.checkType === "driver_compliance") {
    for (const issue of check.issues) {
      if (issue.includes("expires within")) {
        // Send automated reminder to driver
        console.log(`Sent renewal reminder to driver ${check.entityId}: ${issue}`);
        return true;
      }
    }
  }

  return false;
}

// ==================== Export ====================

export const legalCompliance = {
  monitorRegulatoryChanges,
  checkDriverCompliance,
  checkRideCompliance,
  checkInsurancePoolCompliance,
  generateTermsOfService,
  generateDriverAgreement,
  assessRegulatoryRisk,
  assessLegalLiabilityRisk,
  autoRemediateCompliance,
};
