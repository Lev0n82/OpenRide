# OpenRide Self-Improvement System Design

**Version:** 1.0  
**Date:** December 2024  
**Author:** Manus AI  
**Status:** Design Specification

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Opportunity Generation](#opportunity-generation)
4. [Judge Panel System](#judge-panel-system)
5. [Feedback Incorporation](#feedback-incorporation)
6. [Implementation Workflow](#implementation-workflow)
7. [Database Schema](#database-schema)
8. [API Specifications](#api-specifications)
9. [Admin Dashboard](#admin-dashboard)
10. [Safety & Rollback](#safety--rollback)

---

## Overview

The Self-Improvement System enables OpenRide to autonomously identify, validate, and implement platform improvements through a rigorous multi-model AI review process. The system operates in a continuous cycle of opportunity generation, multi-judge validation, feedback incorporation, and automated implementation.

### Core Principles

The system is built on three foundational principles that ensure quality and safety. First, **autonomous discovery** allows the platform to continuously analyze operational data, user feedback, and performance metrics to identify improvement opportunities without human intervention. Second, **rigorous validation** requires unanimous approval from a panel of three AI models—two reasoning models and one visual agentic model—each evaluating proposals from different perspectives. Third, **iterative refinement** ensures that proposals are revised and resubmitted until they achieve 100% approval from all judges, guaranteeing that only thoroughly vetted improvements reach production.

### System Components

The self-improvement system consists of five interconnected components working in concert. The **Opportunity Generator** analyzes platform data to identify potential improvements in user experience, performance, safety, and business metrics. The **Judge Panel** evaluates each proposal through three specialized AI models that assess technical feasibility, user impact, and visual design quality. The **Feedback Incorporator** automatically revises proposals based on judge feedback, iterating until all concerns are addressed. The **Implementation Engine** deploys approved improvements through automated code generation, testing, and deployment pipelines. Finally, the **Monitoring Dashboard** provides administrators with visibility into the improvement pipeline, success metrics, and manual override capabilities.

### Improvement Categories

The system targets six categories of improvements, each with specific success criteria and validation requirements. **User Experience** improvements enhance interface usability, reduce friction in key workflows, and improve accessibility. **Performance** improvements optimize database queries, reduce API response times, and minimize bundle sizes. **Safety** improvements strengthen security measures, enhance fraud detection, and improve emergency response systems. **Business Metrics** improvements increase driver earnings, reduce rider wait times, and optimize pricing algorithms. **Feature Enhancements** add requested capabilities, improve existing features, and integrate new technologies. **Code Quality** improvements refactor complex code, eliminate technical debt, and improve test coverage.

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTINUOUS IMPROVEMENT CYCLE                 │
└─────────────────────────────────────────────────────────────────┘

1. DATA COLLECTION
   ├─ User feedback & ratings
   ├─ Performance metrics
   ├─ Error logs & incidents
   ├─ Business KPIs
   └─ Competitor analysis
          ↓
2. OPPORTUNITY GENERATION
   ├─ LLM analyzes data patterns
   ├─ Identifies improvement areas
   ├─ Generates detailed proposals
   └─ Creates implementation plans
          ↓
3. JUDGE PANEL EVALUATION
   ├─ Reasoning Model 1: Technical feasibility
   ├─ Reasoning Model 2: User impact & business value
   └─ Visual Model: UI/UX design quality
          ↓
4. FEEDBACK INCORPORATION (If Rejected)
   ├─ Aggregate judge feedback
   ├─ Identify required changes
   ├─ Revise proposal automatically
   └─ Resubmit to judges
          ↓
5. JUDGE APPROVAL GATE (100% Required)
   ├─ All 3 judges must approve
   ├─ No outstanding concerns
   └─ Implementation plan validated
          ↓
6. DAO COMMUNITY VOTING
   ├─ 7-day voting period
   ├─ Token-weighted votes (1 token = 1 vote)
   ├─ Automatic extension if no votes
   └─ Minimum 100 votes (quorum)
          ↓
7. VOTER FEEDBACK (If Rejected)
   ├─ Collect feedback from "no" voters
   ├─ Analyze concerns with LLM
   ├─ Revise proposal
   └─ Resubmit to judges → DAO
          ↓
8. DAO APPROVAL GATE (51% Required)
   ├─ Yes votes ≥ 51% of total votes
   ├─ Quorum met (≥100 votes)
   └─ Community consensus achieved
          ↓
9. AUTOMATED IMPLEMENTATION
   ├─ Generate code changes
   ├─ Run automated tests
   ├─ Deploy to staging
   ├─ Validate in production
   └─ Monitor success metrics
          ↓
10. OUTCOME TRACKING
   ├─ Measure impact on KPIs
   ├─ Collect user feedback
   ├─ Report results to DAO
   ├─ Identify new opportunities
   └─ Feed back to step 1
```

### Component Interaction Diagram

```
┌──────────────────┐
│  Data Sources    │
│  - User Feedback │
│  - Metrics DB    │
│  - Error Logs    │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────┐
│  Opportunity Generator       │
│  (LLM-powered analysis)      │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────┐
│  Improvement Proposal        │
│  - Problem statement         │
│  - Proposed solution         │
│  - Implementation plan       │
│  - Success metrics           │
└────────┬─────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────┐
│              Judge Panel                          │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Reasoning 1 │ │ Reasoning 2 │ │  Visual    │ │
│  │ Technical   │ │ Business    │ │  Design    │ │
│  └──────┬──────┘ └──────┬──────┘ └──────┬─────┘ │
└─────────┼───────────────┼───────────────┼────────┘
          │               │               │
          └───────────────┴───────────────┘
                          │
                          ↓
         ┌────────────────────────────┐
         │  Approval Decision         │
         │  - All approve? → Deploy   │
         │  - Any reject? → Revise    │
         └────────┬───────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ↓                 ↓
┌─────────────────┐  ┌─────────────────┐
│ Feedback Loop   │  │ Implementation  │
│ - Incorporate   │  │ - Code gen      │
│ - Resubmit      │  │ - Test          │
└─────────────────┘  │ - Deploy        │
                     │ - Monitor       │
                     └─────────────────┘
```

---

## Opportunity Generation

The Opportunity Generator continuously analyzes platform data to identify potential improvements.

### Data Sources

The generator aggregates data from multiple sources to build a comprehensive view of platform health and user satisfaction. **User feedback** includes ride ratings, driver ratings, support tickets, feature requests, and in-app surveys. **Performance metrics** track API response times, database query performance, page load times, error rates, and resource utilization. **Business metrics** monitor ride completion rates, driver acceptance rates, rider wait times, pricing effectiveness, and revenue per ride. **Safety metrics** track incident reports, SOS activations, insurance claims, and fraud detection alerts. **Competitive intelligence** analyzes competitor features, pricing strategies, market positioning, and user reviews.

### Generation Algorithm

```
FUNCTION generateImprovementOpportunities():
    
    // Step 1: Collect recent data
    userFeedback = getUserFeedback(last30Days)
    performanceMetrics = getPerformanceMetrics(last30Days)
    businessMetrics = getBusinessMetrics(last30Days)
    safetyIncidents = getSafetyIncidents(last30Days)
    competitorData = getCompetitorData()
    
    // Step 2: Analyze patterns with LLM
    analysisPrompt = buildAnalysisPrompt({
        userFeedback,
        performanceMetrics,
        businessMetrics,
        safetyIncidents,
        competitorData
    })
    
    analysis = invokeLLM({
        messages: [
            {
                role: "system",
                content: "You are an expert product analyst for a rideshare platform. Analyze the provided data and identify the top 5 improvement opportunities. For each opportunity, provide: 1) Problem statement, 2) Impact assessment, 3) Proposed solution, 4) Implementation complexity, 5) Success metrics."
            },
            {
                role: "user",
                content: analysisPrompt
            }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "improvement_opportunities",
                schema: {
                    type: "object",
                    properties: {
                        opportunities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    category: { type: "string" },
                                    priority: { type: "string" },
                                    problemStatement: { type: "string" },
                                    impactAssessment: { type: "string" },
                                    proposedSolution: { type: "string" },
                                    implementationComplexity: { type: "string" },
                                    successMetrics: { type: "array", items: { type: "string" } }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    
    // Step 3: Generate detailed proposals
    proposals = []
    FOR EACH opportunity IN analysis.opportunities:
        proposal = generateDetailedProposal(opportunity)
        proposals.append(proposal)
    
    // Step 4: Store proposals for judge review
    FOR EACH proposal IN proposals:
        saveProposal(proposal)
    
    RETURN proposals

FUNCTION generateDetailedProposal(opportunity):
    
    // Generate comprehensive proposal with LLM
    proposalPrompt = `
    Based on this improvement opportunity:
    ${JSON.stringify(opportunity)}
    
    Generate a detailed implementation proposal including:
    1. Detailed problem analysis with data evidence
    2. Proposed solution with technical specifications
    3. Database schema changes (if needed)
    4. API endpoint changes (if needed)
    5. Frontend component changes (if needed)
    6. Implementation steps with timeline
    7. Testing strategy
    8. Rollback plan
    9. Success metrics and KPIs
    10. Risk assessment
    `
    
    detailedProposal = invokeLLM({
        messages: [
            {
                role: "system",
                content: "You are a senior software architect. Generate detailed technical implementation proposals."
            },
            {
                role: "user",
                content: proposalPrompt
            }
        ],
        response_format: { type: "json_schema", ... }
    })
    
    RETURN {
        id: generateUUID(),
        category: opportunity.category,
        priority: opportunity.priority,
        problemStatement: opportunity.problemStatement,
        proposedSolution: detailedProposal.solution,
        technicalSpec: detailedProposal.technicalSpec,
        implementationPlan: detailedProposal.implementationPlan,
        successMetrics: detailedProposal.successMetrics,
        riskAssessment: detailedProposal.riskAssessment,
        status: "pending_review",
        createdAt: new Date()
    }
```

### Proposal Structure

Each generated proposal follows a standardized structure to ensure consistent evaluation by the judge panel.

**Proposal Schema:**

```typescript
type ImprovementProposal = {
  id: string;
  category: "ux" | "performance" | "safety" | "business" | "feature" | "code_quality";
  priority: "critical" | "high" | "medium" | "low";
  
  // Problem definition
  problemStatement: string;
  dataEvidence: {
    metric: string;
    currentValue: number;
    targetValue: number;
    source: string;
  }[];
  userImpact: string;
  businessImpact: string;
  
  // Proposed solution
  proposedSolution: string;
  technicalApproach: string;
  alternativesConsidered: string[];
  
  // Implementation details
  databaseChanges: {
    tables: string[];
    migrations: string;
  } | null;
  apiChanges: {
    newEndpoints: string[];
    modifiedEndpoints: string[];
  } | null;
  frontendChanges: {
    newComponents: string[];
    modifiedComponents: string[];
    uiMockups?: string[]; // URLs to generated mockups
  } | null;
  
  // Execution plan
  implementationSteps: {
    step: number;
    description: string;
    estimatedHours: number;
  }[];
  testingStrategy: string;
  rollbackPlan: string;
  
  // Success criteria
  successMetrics: {
    metric: string;
    currentValue: number;
    targetValue: number;
    measurementMethod: string;
  }[];
  
  // Risk assessment
  risks: {
    risk: string;
    severity: "high" | "medium" | "low";
    mitigation: string;
  }[];
  
  // Metadata
  status: "pending_review" | "in_review" | "revising" | "approved" | "implementing" | "deployed" | "rejected";
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Judge Panel System

The Judge Panel consists of three specialized AI models that evaluate proposals from different perspectives. All three judges must approve a proposal before implementation.

### Judge Roles

**Judge 1: Technical Feasibility Evaluator (Reasoning Model)**

This judge assesses the technical soundness of the proposal, focusing on implementation feasibility, code quality, and system architecture. The evaluation criteria include whether the proposed database schema changes are properly normalized and indexed, whether API endpoints follow RESTful/tRPC conventions, whether the implementation plan is realistic and complete, whether the testing strategy covers all critical paths, whether the rollback plan is comprehensive and safe, and whether the technical approach aligns with existing architecture.

**Judge 2: Business & User Impact Evaluator (Reasoning Model)**

This judge evaluates the proposal's impact on users and business metrics, ensuring improvements deliver real value. The evaluation criteria include whether the problem statement is backed by quantitative data, whether the proposed solution addresses the root cause, whether success metrics are measurable and achievable, whether the user impact justifies the implementation cost, whether the business impact aligns with strategic goals, and whether risks are properly identified and mitigated.

**Judge 3: Visual Design & UX Evaluator (Visual Agentic Reasoning Model)**

This judge reviews UI mockups and design specifications to ensure visual quality and user experience excellence. The evaluation criteria include whether UI mockups follow OpenRide's design system, whether the user flow is intuitive and efficient, whether accessibility standards (WCAG 2.2 AA) are met, whether the design is responsive across devices, whether visual hierarchy guides user attention effectively, and whether the design aligns with modern UX best practices.

### Evaluation Process

```
FUNCTION evaluateProposal(proposal):
    
    // Step 1: Submit to all judges in parallel
    judge1Evaluation = evaluateTechnicalFeasibility(proposal)
    judge2Evaluation = evaluateBusinessImpact(proposal)
    judge3Evaluation = evaluateVisualDesign(proposal)
    
    // Step 2: Aggregate results
    evaluations = [judge1Evaluation, judge2Evaluation, judge3Evaluation]
    
    // Step 3: Check for unanimous approval
    allApproved = evaluations.every(e => e.decision === "approve")
    
    IF allApproved:
        proposal.status = "approved"
        scheduleImplementation(proposal)
    ELSE:
        proposal.status = "revising"
        aggregateFeedback = compileFeedback(evaluations)
        reviseProposal(proposal, aggregateFeedback)
    
    // Step 4: Record evaluation
    saveEvaluationRound({
        proposalId: proposal.id,
        evaluations: evaluations,
        decision: allApproved ? "approved" : "needs_revision",
        timestamp: new Date()
    })
    
    RETURN { allApproved, evaluations }

FUNCTION evaluateTechnicalFeasibility(proposal):
    
    evaluationPrompt = `
    You are a senior software architect reviewing an implementation proposal.
    
    Proposal:
    ${JSON.stringify(proposal, null, 2)}
    
    Evaluate the technical feasibility based on:
    1. Database schema design quality
    2. API design following best practices
    3. Implementation plan completeness
    4. Testing strategy adequacy
    5. Rollback plan safety
    6. Architectural alignment
    
    Provide:
    - Decision: "approve" or "reject"
    - Score: 0-100 for each criterion
    - Feedback: Specific issues and recommendations
    - RequiredChanges: List of mandatory changes before approval
    `
    
    evaluation = invokeLLM({
        messages: [
            { role: "system", content: "You are Judge 1: Technical Feasibility Evaluator" },
            { role: "user", content: evaluationPrompt }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "technical_evaluation",
                schema: {
                    type: "object",
                    properties: {
                        decision: { type: "string", enum: ["approve", "reject"] },
                        scores: {
                            type: "object",
                            properties: {
                                databaseDesign: { type: "number" },
                                apiDesign: { type: "number" },
                                implementationPlan: { type: "number" },
                                testingStrategy: { type: "number" },
                                rollbackPlan: { type: "number" },
                                architecturalAlignment: { type: "number" }
                            }
                        },
                        overallScore: { type: "number" },
                        feedback: { type: "string" },
                        requiredChanges: { type: "array", items: { type: "string" } },
                        optionalSuggestions: { type: "array", items: { type: "string" } }
                    }
                }
            }
        }
    })
    
    RETURN {
        judge: "technical_feasibility",
        decision: evaluation.decision,
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        requiredChanges: evaluation.requiredChanges,
        optionalSuggestions: evaluation.optionalSuggestions,
        timestamp: new Date()
    }

FUNCTION evaluateBusinessImpact(proposal):
    
    evaluationPrompt = `
    You are a product manager evaluating the business value of an improvement proposal.
    
    Proposal:
    ${JSON.stringify(proposal, null, 2)}
    
    Evaluate based on:
    1. Problem validation with data evidence
    2. Solution effectiveness for root cause
    3. Success metrics measurability
    4. User impact vs. implementation cost
    5. Business alignment with strategy
    6. Risk assessment completeness
    
    Provide:
    - Decision: "approve" or "reject"
    - Score: 0-100 for each criterion
    - Feedback: Specific concerns and recommendations
    - RequiredChanges: Mandatory changes before approval
    `
    
    evaluation = invokeLLM({
        messages: [
            { role: "system", content: "You are Judge 2: Business & User Impact Evaluator" },
            { role: "user", content: evaluationPrompt }
        ],
        response_format: { type: "json_schema", ... }
    })
    
    RETURN {
        judge: "business_impact",
        decision: evaluation.decision,
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        requiredChanges: evaluation.requiredChanges,
        optionalSuggestions: evaluation.optionalSuggestions,
        timestamp: new Date()
    }

FUNCTION evaluateVisualDesign(proposal):
    
    // Only evaluate if proposal includes UI changes
    IF proposal.frontendChanges IS null OR proposal.frontendChanges.uiMockups IS empty:
        RETURN {
            judge: "visual_design",
            decision: "approve",
            feedback: "No UI changes in this proposal",
            timestamp: new Date()
        }
    
    // Generate evaluation with visual model
    evaluationPrompt = `
    You are a UX designer reviewing UI mockups for a rideshare platform.
    
    Proposal:
    ${JSON.stringify(proposal, null, 2)}
    
    Review the attached UI mockups and evaluate:
    1. Design system consistency
    2. User flow intuitiveness
    3. Accessibility compliance (WCAG 2.2 AA)
    4. Responsive design quality
    5. Visual hierarchy effectiveness
    6. Modern UX best practices
    
    Provide:
    - Decision: "approve" or "reject"
    - Score: 0-100 for each criterion
    - Feedback: Specific design issues
    - RequiredChanges: Mandatory design changes
    `
    
    // Prepare mockup images for visual model
    mockupImages = proposal.frontendChanges.uiMockups.map(url => ({
        type: "image_url",
        image_url: { url: url }
    }))
    
    evaluation = invokeLLM({
        messages: [
            { role: "system", content: "You are Judge 3: Visual Design & UX Evaluator" },
            {
                role: "user",
                content: [
                    { type: "text", text: evaluationPrompt },
                    ...mockupImages
                ]
            }
        ],
        response_format: { type: "json_schema", ... }
    })
    
    RETURN {
        judge: "visual_design",
        decision: evaluation.decision,
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        requiredChanges: evaluation.requiredChanges,
        optionalSuggestions: evaluation.optionalSuggestions,
        timestamp: new Date()
    }
```

### Approval Criteria

A proposal is approved for implementation only when **all three conditions** are met:

1. **Unanimous Approval:** All three judges return `decision: "approve"`
2. **No Required Changes:** All judges have empty `requiredChanges` arrays
3. **Minimum Score Threshold:** Each judge's `overallScore` is ≥ 80/100

If any condition fails, the proposal enters the revision cycle.

---

## Feedback Incorporation

When a proposal is rejected by any judge, the Feedback Incorporator automatically revises the proposal based on judge feedback and resubmits for evaluation.

### Revision Algorithm

```
FUNCTION reviseProposal(proposal, evaluations):
    
    // Step 1: Aggregate all required changes
    allRequiredChanges = []
    FOR EACH evaluation IN evaluations:
        IF evaluation.requiredChanges.length > 0:
            allRequiredChanges.push({
                judge: evaluation.judge,
                changes: evaluation.requiredChanges,
                feedback: evaluation.feedback
            })
    
    // Step 2: Generate revised proposal with LLM
    revisionPrompt = `
    You are revising an improvement proposal based on judge feedback.
    
    Original Proposal:
    ${JSON.stringify(proposal, null, 2)}
    
    Judge Feedback:
    ${JSON.stringify(allRequiredChanges, null, 2)}
    
    Revise the proposal to address ALL required changes from ALL judges.
    Maintain the same structure but update relevant sections.
    Explain how each required change was addressed.
    `
    
    revisedProposal = invokeLLM({
        messages: [
            { role: "system", content: "You are a proposal revision specialist" },
            { role: "user", content: revisionPrompt }
        ],
        response_format: { type: "json_schema", schema: ProposalSchema }
    })
    
    // Step 3: Track revision history
    saveRevisionHistory({
        proposalId: proposal.id,
        revisionNumber: proposal.revisionCount + 1,
        changes: allRequiredChanges,
        revisedProposal: revisedProposal,
        timestamp: new Date()
    })
    
    // Step 4: Update proposal
    proposal.update(revisedProposal)
    proposal.revisionCount += 1
    proposal.status = "pending_review"
    
    // Step 5: Resubmit to judges
    evaluateProposal(proposal)
    
    RETURN proposal

FUNCTION compileFeedback(evaluations):
    
    feedback = {
        technicalFeasibility: null,
        businessImpact: null,
        visualDesign: null,
        allRequiredChanges: [],
        allOptionalSuggestions: []
    }
    
    FOR EACH evaluation IN evaluations:
        IF evaluation.judge === "technical_feasibility":
            feedback.technicalFeasibility = {
                decision: evaluation.decision,
                score: evaluation.overallScore,
                feedback: evaluation.feedback,
                requiredChanges: evaluation.requiredChanges
            }
        ELSE IF evaluation.judge === "business_impact":
            feedback.businessImpact = {
                decision: evaluation.decision,
                score: evaluation.overallScore,
                feedback: evaluation.feedback,
                requiredChanges: evaluation.requiredChanges
            }
        ELSE IF evaluation.judge === "visual_design":
            feedback.visualDesign = {
                decision: evaluation.decision,
                score: evaluation.overallScore,
                feedback: evaluation.feedback,
                requiredChanges: evaluation.requiredChanges
            }
        
        feedback.allRequiredChanges.push(...evaluation.requiredChanges)
        feedback.allOptionalSuggestions.push(...evaluation.optionalSuggestions)
    
    RETURN feedback
```

### Maximum Revision Limit

To prevent infinite revision loops, the system enforces a maximum of **5 revision attempts** per proposal. If a proposal fails to achieve unanimous approval after 5 revisions, it is marked as `rejected` and requires manual review by a human administrator.

---

## DAO Voting Governance

After a proposal receives unanimous approval from all three AI judges, it must be submitted to the DAO community for democratic voting. Implementation proceeds only if the proposal achieves **51% approval** from voting members.

### Voting Requirements

The DAO voting system ensures that all platform improvements have community support before deployment. **Voting eligibility** is determined by token holdings, where any user holding at least 1 RIDE token can vote on improvement proposals, with voting power proportional to token holdings (1 token = 1 vote). **Approval threshold** requires that the proposal receives votes from at least 51% of all cast votes in favor of implementation, calculated as `(yes_votes / total_votes) × 100 ≥ 51`. **Voting period** spans an initial 7-day window from proposal publication, with an automatic 7-day extension granted if zero votes are cast during the initial period, and a maximum of one extension allowed per proposal. **Quorum requirement** mandates a minimum of 100 votes cast for the vote to be valid, ensuring meaningful community participation.

### Voting Workflow

```
FUNCTION submitToDAOVoting(proposal):
    
    // Step 1: Verify judge approval
    IF proposal.status !== "approved":
        THROW new Error("Proposal must be approved by all judges first")
    
    // Step 2: Create voting proposal
    votingProposal = createVotingProposal({
        improvementProposalId: proposal.id,
        title: generateVotingTitle(proposal),
        description: generateVotingDescription(proposal),
        votingStartDate: new Date(),
        votingEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: "active",
        extensionGranted: false,
        yesVotes: 0,
        noVotes: 0,
        totalVotes: 0
    })
    
    // Step 3: Update proposal status
    proposal.status = "dao_voting"
    proposal.votingProposalId = votingProposal.id
    
    // Step 4: Notify all DAO members
    notifyDAOMembers({
        type: "new_improvement_vote",
        proposalId: votingProposal.id,
        title: votingProposal.title,
        votingEndDate: votingProposal.votingEndDate
    })
    
    // Step 5: Schedule voting period end check
    scheduleVotingCheck(votingProposal.id, votingProposal.votingEndDate)
    
    RETURN votingProposal

FUNCTION castVote(userId, votingProposalId, vote):
    
    // Step 1: Verify voting eligibility
    user = getUserById(userId)
    tokenBalance = user.rideTokenBalance
    
    IF tokenBalance < 1:
        THROW new Error("Must hold at least 1 RIDE token to vote")
    
    // Step 2: Verify voting period
    votingProposal = getVotingProposalById(votingProposalId)
    
    IF votingProposal.status !== "active":
        THROW new Error("Voting period has ended")
    
    IF new Date() > votingProposal.votingEndDate:
        THROW new Error("Voting period has expired")
    
    // Step 3: Check for existing vote
    existingVote = getVote(userId, votingProposalId)
    
    IF existingVote:
        // Update existing vote
        oldVote = existingVote.vote
        oldVotingPower = existingVote.votingPower
        
        // Remove old vote count
        IF oldVote === "yes":
            votingProposal.yesVotes -= oldVotingPower
        ELSE:
            votingProposal.noVotes -= oldVotingPower
        
        votingProposal.totalVotes -= oldVotingPower
        
        // Update vote
        existingVote.vote = vote
        existingVote.votingPower = tokenBalance
        existingVote.updatedAt = new Date()
    ELSE:
        // Create new vote
        existingVote = createVote({
            userId: userId,
            votingProposalId: votingProposalId,
            vote: vote,
            votingPower: tokenBalance,
            createdAt: new Date()
        })
    
    // Step 4: Update vote counts
    IF vote === "yes":
        votingProposal.yesVotes += tokenBalance
    ELSE:
        votingProposal.noVotes += tokenBalance
    
    votingProposal.totalVotes += tokenBalance
    
    RETURN { success: true, currentTally: calculateTally(votingProposal) }

FUNCTION checkVotingPeriodEnd(votingProposalId):
    
    votingProposal = getVotingProposalById(votingProposalId)
    currentTime = new Date()
    
    // Check if voting period has ended
    IF currentTime < votingProposal.votingEndDate:
        RETURN // Still in voting period
    
    // Check if no votes were cast
    IF votingProposal.totalVotes === 0:
        IF votingProposal.extensionGranted:
            // Extension already used, mark as failed
            votingProposal.status = "failed_no_votes"
            proposal = getProposalById(votingProposal.improvementProposalId)
            proposal.status = "rejected_no_votes"
            
            notifyDAOMembers({
                type: "vote_failed_no_participation",
                proposalId: votingProposal.id
            })
        ELSE:
            // Grant 7-day extension
            votingProposal.votingEndDate = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000)
            votingProposal.extensionGranted = true
            
            notifyDAOMembers({
                type: "voting_extended",
                proposalId: votingProposal.id,
                newEndDate: votingProposal.votingEndDate,
                reason: "No votes cast in initial period"
            })
            
            // Schedule new check
            scheduleVotingCheck(votingProposal.id, votingProposal.votingEndDate)
        
        RETURN
    
    // Check quorum
    IF votingProposal.totalVotes < 100:
        votingProposal.status = "failed_quorum"
        proposal = getProposalById(votingProposal.improvementProposalId)
        proposal.status = "rejected_quorum"
        
        notifyDAOMembers({
            type: "vote_failed_quorum",
            proposalId: votingProposal.id,
            votesReceived: votingProposal.totalVotes,
            quorumRequired: 100
        })
        
        RETURN
    
    // Calculate approval percentage
    approvalPercentage = (votingProposal.yesVotes / votingProposal.totalVotes) * 100
    
    IF approvalPercentage >= 51:
        // Proposal approved by DAO
        votingProposal.status = "approved"
        votingProposal.approvalPercentage = approvalPercentage
        
        proposal = getProposalById(votingProposal.improvementProposalId)
        proposal.status = "dao_approved"
        
        notifyDAOMembers({
            type: "vote_passed",
            proposalId: votingProposal.id,
            approvalPercentage: approvalPercentage,
            yesVotes: votingProposal.yesVotes,
            noVotes: votingProposal.noVotes
        })
        
        // Proceed to implementation
        implementApprovedProposal(proposal)
    ELSE:
        // Proposal rejected by DAO
        votingProposal.status = "rejected"
        votingProposal.approvalPercentage = approvalPercentage
        
        proposal = getProposalById(votingProposal.improvementProposalId)
        proposal.status = "dao_rejected"
        
        notifyDAOMembers({
            type: "vote_failed",
            proposalId: votingProposal.id,
            approvalPercentage: approvalPercentage,
            yesVotes: votingProposal.yesVotes,
            noVotes: votingProposal.noVotes
        })
        
        // Collect voter feedback and revise
        collectVoterFeedback(votingProposal)
```

### Voter Feedback Collection

When a proposal is rejected by the DAO, the system collects feedback from "no" voters to understand their concerns and incorporate them into a revised proposal.

```
FUNCTION collectVoterFeedback(votingProposal):
    
    // Step 1: Get all "no" voters
    noVoters = getVotes(votingProposal.id, vote: "no")
    
    // Step 2: Request feedback from no voters
    FOR EACH voter IN noVoters:
        sendFeedbackRequest({
            userId: voter.userId,
            votingProposalId: votingProposal.id,
            message: "Your vote helped shape OpenRide's future. Please share why you voted against this improvement so we can address your concerns."
        })
    
    // Step 3: Wait 48 hours for feedback
    scheduleFeedbackCollection(votingProposal.id, 48 * 60 * 60 * 1000)
    
FUNCTION processFeedbackAndRevise(votingProposalId):
    
    votingProposal = getVotingProposalById(votingProposalId)
    proposal = getProposalById(votingProposal.improvementProposalId)
    
    // Step 1: Aggregate voter feedback
    voterFeedback = getVoterFeedback(votingProposalId)
    
    IF voterFeedback.length === 0:
        // No feedback received, use LLM to infer concerns
        voterFeedback = inferConcerns(proposal, votingProposal)
    
    // Step 2: Analyze feedback with LLM
    feedbackAnalysis = invokeLLM({
        messages: [
            {
                role: "system",
                content: "You are analyzing voter feedback on a rejected improvement proposal. Identify common themes, concerns, and required changes."
            },
            {
                role: "user",
                content: `
                Proposal:
                ${JSON.stringify(proposal, null, 2)}
                
                Voting Results:
                - Yes: ${votingProposal.yesVotes} (${votingProposal.approvalPercentage}%)
                - No: ${votingProposal.noVotes} (${100 - votingProposal.approvalPercentage}%)
                
                Voter Feedback:
                ${JSON.stringify(voterFeedback, null, 2)}
                
                Identify:
                1. Top 5 concerns from voters
                2. Required changes to address concerns
                3. Revised proposal incorporating feedback
                `
            }
        ],
        response_format: { type: "json_schema", ... }
    })
    
    // Step 3: Revise proposal based on voter feedback
    revisedProposal = reviseProposalWithVoterFeedback(proposal, feedbackAnalysis)
    
    // Step 4: Resubmit to judge panel
    proposal.status = "pending_review"
    proposal.revisionCount += 1
    proposal.voterFeedbackIncorporated = true
    
    evaluateProposal(revisedProposal)
    
    RETURN revisedProposal
```

### Voting Dashboard

The DAO voting dashboard provides transparency into active votes and historical decisions.

**Dashboard Sections:**

**Active Votes** displays all improvement proposals currently open for voting, showing the proposal title, category, voting deadline, current tally (yes/no votes), approval percentage, and a "Vote Now" button. **Voting History** shows past votes with outcomes, including proposal title, voting period, final tally, approval percentage, implementation status, and impact metrics. **My Votes** tracks the user's voting history, displaying proposals voted on, vote cast (yes/no), voting power used, outcome, and ability to view proposal details. **Upcoming Votes** previews proposals that have passed judge panel review and will soon be submitted for DAO voting.

---

## Implementation Workflow

Once a proposal receives unanimous approval from all three judges **and** achieves 51% DAO approval, the Implementation Engine automatically generates code, runs tests, and deploys the changes through a rigorous 5-stage pipeline ensuring thorough validation before reaching all users.

### Implementation Steps

```
FUNCTION implementApprovedProposal(proposal):
    
    proposal.status = "implementing"
    
    TRY:
        // Step 1: Generate code changes
        codeChanges = generateCode(proposal)
        
        // Step 2: Apply changes to codebase
        applyChanges(codeChanges)
        
        // Step 3: Run automated tests
        testResults = runTests()
        IF testResults.failed > 0:
            THROW new Error("Tests failed: " + testResults.failures)
        
        // Step 4: Deploy to staging
        deployToStaging()
        
        // Step 5: Run integration tests on staging
        stagingTests = runStagingTests()
        IF stagingTests.failed > 0:
            THROW new Error("Staging tests failed")
        
        // Step 6: Deploy to production
        deployToProduction()
        
        // Step 7: Monitor success metrics
        scheduleMetricsMonitoring(proposal)
        
        proposal.status = "deployed"
        proposal.deployedAt = new Date()
        
        RETURN { success: true }
        
    CATCH error:
        // Rollback on failure
        rollbackChanges(proposal)
        proposal.status = "failed"
        proposal.error = error.message
        
        // Alert admins
        notifyAdmins({
            type: "implementation_failed",
            proposal: proposal,
            error: error
        })
        
        RETURN { success: false, error: error.message }

FUNCTION generateCode(proposal):
    
    codeGenerationPrompt = `
    Generate production-ready code for this approved improvement proposal.
    
    Proposal:
    ${JSON.stringify(proposal, null, 2)}
    
    Generate:
    1. Database migration files (if schema changes)
    2. tRPC procedure implementations (if API changes)
    3. React components (if frontend changes)
    4. Test files for all new code
    5. Documentation updates
    
    Follow OpenRide's existing code style and architecture.
    Include comprehensive error handling and logging.
    `
    
    generatedCode = invokeLLM({
        messages: [
            { role: "system", content: "You are an expert full-stack developer" },
            { role: "user", content: codeGenerationPrompt }
        ],
        response_format: {
            type: "json_schema",
            json_schema: {
                name: "code_generation",
                schema: {
                    type: "object",
                    properties: {
                        migrations: { type: "array", items: { type: "object" } },
                        serverFiles: { type: "array", items: { type: "object" } },
                        clientFiles: { type: "array", items: { type: "object" } },
                        testFiles: { type: "array", items: { type: "object" } },
                        documentation: { type: "string" }
                    }
                }
            }
        }
    })
    
    RETURN generatedCode
```

### 5-Stage Deployment Pipeline

The deployment pipeline follows a rigorous progression through five environments, each with specific validation gates that must be satisfied before promotion to the next stage.

**Stage 1: Development (Dev) Environment** is the first deployment target where generated code is initially deployed. This environment runs automated unit tests, integration tests, and static code analysis. It uses a dedicated development database with test data and is accessible only to the development team and CI/CD systems. The validation gate requires all automated tests to pass with 100% success rate and code quality checks to pass (linting, type checking, security scanning). Typical duration is 10-15 minutes for automated validation.

**Stage 2: Integration System Testing (IST) Environment** validates that new code integrates correctly with existing systems and third-party services. This environment runs comprehensive integration tests including API contract tests, database migration tests, and third-party service integration tests. It uses a staging database with production-like data volume and is accessible to QA engineers and automated testing systems. The validation gate requires all integration tests to pass, database migrations to complete successfully, and no breaking changes to existing API contracts. Typical duration is 20-30 minutes for integration validation.

**Stage 3: User Acceptance Testing (UAT) Environment** allows designated test users to validate functionality before production release. This environment provides a production-like experience for manual testing by real users. It uses a UAT database with anonymized production data and is accessible to internal test users, beta testers, and QA team. The validation gate requires manual sign-off from at least 3 designated test users, all critical user flows to be tested successfully, and no critical or high-severity bugs reported. Typical duration is 24-48 hours for manual user testing and approval.

**Stage 4: Stage Environment (10% Production Traffic)** exposes new functionality to 10% of real production users for validation under real-world conditions. This environment runs in production infrastructure with real production data, serving exactly 10% of the user base determined by consistent user ID hashing. The validation gate requires at least 95% of user interactions with new functionality to succeed, error rates to remain within 150% of baseline, performance metrics to remain within 130% of baseline, and monitoring period of 24 hours with stable metrics. The system tracks actual user interactions to ensure the 10% cohort successfully uses the new functionality without issues.

**Stage 5: Production Environment (100% Traffic)** is the final deployment target serving all users. This environment serves 100% of production traffic with full feature availability. The validation gate requires error rates to remain within 150% of baseline, success metrics defined in the proposal to be achieved within 48 hours, and no critical incidents or user complaints related to the new functionality. Continuous monitoring continues for 48 hours post-deployment with automatic rollback if metrics degrade.

### User Interaction Validation

The Stage environment (10% of users) requires real user validation before promoting to full production. The system tracks actual user interactions with the new functionality to ensure it works correctly under real-world conditions.

```
FUNCTION validateUserInteractions(environment, proposal):
    
    // Calculate how many successful interactions are needed
    totalUsers = getTotalActiveUsers()
    stageUsers = totalUsers * 0.10  // 10% of users
    
    // Determine minimum interactions needed based on feature type
    IF proposal.category === "user_experience":
        // UI changes: require at least 50% of stage users to interact
        minInteractions = stageUsers * 0.50
    ELSE IF proposal.category === "feature_enhancement":
        // New features: require at least 30% of stage users to try it
        minInteractions = stageUsers * 0.30
    ELSE:
        // Other changes: require at least 20% of stage users to interact
        minInteractions = stageUsers * 0.20
    
    // Track interactions over 24 hours
    interactions = trackInteractions(
        environment: environment,
        duration: 24 hours,
        featureIdentifier: proposal.id
    )
    
    successfulInteractions = interactions.filter(i => i.success === true).length
    totalInteractions = interactions.length
    
    // Validate sufficient interactions occurred
    IF totalInteractions < minInteractions:
        RETURN {
            success: false,
            reason: "Insufficient user interactions",
            expected: minInteractions,
            actual: totalInteractions
        }
    
    // Validate success rate
    requiredSuccessRate = 0.95  // 95% of interactions must succeed
    actualSuccessRate = successfulInteractions / totalInteractions
    
    IF actualSuccessRate < requiredSuccessRate:
        RETURN {
            success: false,
            reason: "Success rate below threshold",
            expected: requiredSuccessRate,
            actual: actualSuccessRate
        }
    
    RETURN {
        success: true,
        count: totalInteractions,
        successRate: actualSuccessRate
    }
```

### Promotion Gates

Each stage has specific criteria that must be met before code can be promoted to the next stage. These gates ensure quality and stability at every step.

| Stage | Promotion Gate Criteria | Typical Duration | Rollback on Failure |
|-------|------------------------|------------------|---------------------|
| Dev → IST | All unit tests pass (100%)<br>Code quality checks pass<br>No security vulnerabilities | 10-15 min | Automatic |
| IST → UAT | All integration tests pass<br>Database migrations succeed<br>No API contract breaks | 20-30 min | Automatic |
| UAT → Stage | Manual sign-off from 3+ test users<br>All critical flows tested<br>No critical/high bugs | 24-48 hours | Manual |
| Stage → Prod | 95%+ user interaction success rate<br>Error rate ≤ 150% baseline<br>Performance ≤ 130% baseline<br>24 hours stable metrics | 24 hours | Automatic |
| Production | Success metrics achieved<br>Error rate ≤ 150% baseline<br>No critical incidents<br>48 hours monitoring | 48 hours | Automatic |

---

## Database Schema

### Improvement Proposals Table

```typescript
export const improvementProposals = mysqlTable("improvement_proposals", {
  id: int("id").primaryKey().autoincrement(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  
  // Classification
  category: varchar("category", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  
  // Problem definition
  problemStatement: text("problem_statement").notNull(),
  dataEvidence: text("data_evidence"), // JSON
  userImpact: text("user_impact"),
  businessImpact: text("business_impact"),
  
  // Proposed solution
  proposedSolution: text("proposed_solution").notNull(),
  technicalSpec: text("technical_spec"), // JSON
  implementationPlan: text("implementation_plan"), // JSON
  
  // Success criteria
  successMetrics: text("success_metrics"), // JSON
  riskAssessment: text("risk_assessment"), // JSON
  
  // Status tracking
  status: varchar("status", { length: 20 }).notNull().default("pending_review"),
  revisionCount: int("revision_count").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  approvedAt: timestamp("approved_at"),
  deployedAt: timestamp("deployed_at"),
});
```

### Judge Evaluations Table

```typescript
export const judgeEvaluations = mysqlTable("judge_evaluations", {
  id: int("id").primaryKey().autoincrement(),
  
  proposalId: int("proposal_id").notNull(),
  revisionNumber: int("revision_number").notNull(),
  
  // Judge identity
  judgeType: varchar("judge_type", { length: 50 }).notNull(), // "technical_feasibility", "business_impact", "visual_design"
  
  // Evaluation results
  decision: varchar("decision", { length: 20 }).notNull(), // "approve", "reject"
  overallScore: int("overall_score").notNull(), // 0-100
  scores: text("scores"), // JSON with individual criterion scores
  
  // Feedback
  feedback: text("feedback").notNull(),
  requiredChanges: text("required_changes"), // JSON array
  optionalSuggestions: text("optional_suggestions"), // JSON array
  
  // Metadata
  evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
});
```

### Revision History Table

```typescript
export const revisionHistory = mysqlTable("revision_history", {
  id: int("id").primaryKey().autoincrement(),
  
  proposalId: int("proposal_id").notNull(),
  revisionNumber: int("revision_number").notNull(),
  
  // Changes made
  changesRequested: text("changes_requested"), // JSON
  revisedContent: text("revised_content"), // JSON
  revisionRationale: text("revision_rationale"),
  
  // Metadata
  revisedAt: timestamp("revised_at").notNull().defaultNow(),
});
```

### Implementation Tracking Table

```typescript
export const implementationTracking = mysqlTable("implementation_tracking", {
  id: int("id").primaryKey().autoincrement(),
  
  proposalId: int("proposal_id").notNull(),
  
  // Deployment details
  deploymentStage: varchar("deployment_stage", { length: 50 }).notNull(), // "staging", "canary", "production"
  deploymentPercentage: int("deployment_percentage").notNull().default(0), // 0-100
  
  // Success metrics
  metricsSnapshot: text("metrics_snapshot"), // JSON with before/after values
  
  // Status
  status: varchar("status", { length: 20 }).notNull(), // "in_progress", "success", "failed", "rolled_back"
  errorMessage: text("error_message"),
  
  // Timestamps
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});
```

### DAO Voting Proposals Table

```typescript
export const daoVotingProposals = mysqlTable("dao_voting_proposals", {
  id: int("id").primaryKey().autoincrement(),
  
  improvementProposalId: int("improvement_proposal_id").notNull(),
  
  // Voting details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  
  // Voting period
  votingStartDate: timestamp("voting_start_date").notNull(),
  votingEndDate: timestamp("voting_end_date").notNull(),
  extensionGranted: boolean("extension_granted").notNull().default(false),
  
  // Vote counts (weighted by token holdings)
  yesVotes: int("yes_votes").notNull().default(0),
  noVotes: int("no_votes").notNull().default(0),
  totalVotes: int("total_votes").notNull().default(0),
  
  // Results
  approvalPercentage: int("approval_percentage"), // 0-100
  status: varchar("status", { length: 20 }).notNull(), // "active", "approved", "rejected", "failed_quorum", "failed_no_votes"
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
```

### DAO Votes Table

```typescript
export const daoVotes = mysqlTable("dao_votes", {
  id: int("id").primaryKey().autoincrement(),
  
  votingProposalId: int("voting_proposal_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Vote details
  vote: varchar("vote", { length: 10 }).notNull(), // "yes", "no"
  votingPower: int("voting_power").notNull(), // Token balance at time of vote
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Composite unique index to prevent duplicate votes
export const daoVotesIndex = uniqueIndex("user_proposal_unique").on(
  daoVotes.userId,
  daoVotes.votingProposalId
);
```

### Voter Feedback Table

```typescript
export const voterFeedback = mysqlTable("voter_feedback", {
  id: int("id").primaryKey().autoincrement(),
  
  votingProposalId: int("voting_proposal_id").notNull(),
  userId: int("user_id").notNull(),
  
  // Feedback content
  feedback: text("feedback").notNull(),
  concerns: text("concerns"), // JSON array of specific concerns
  suggestions: text("suggestions"), // JSON array of improvement suggestions
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

---

## API Specifications

### Opportunity Generation Endpoints

**Procedure:** `selfImprovement.generateOpportunities`

```typescript
selfImprovement: router({
  generateOpportunities: adminProcedure
    .mutation(async () => {
      const opportunities = await generateImprovementOpportunities();
      return { success: true, count: opportunities.length, opportunities };
    }),
});
```

### Judge Panel Endpoints

**Procedure:** `selfImprovement.submitForReview`

```typescript
submitForReview: adminProcedure
  .input(z.object({ proposalId: z.number() }))
  .mutation(async ({ input }) => {
    const proposal = await getProposalById(input.proposalId);
    const { allApproved, evaluations } = await evaluateProposal(proposal);
    return { allApproved, evaluations };
  }),
```

**Procedure:** `selfImprovement.getEvaluations`

```typescript
getEvaluations: adminProcedure
  .input(z.object({ proposalId: z.number() }))
  .query(async ({ input }) => {
    const evaluations = await db.select()
      .from(judgeEvaluations)
      .where(eq(judgeEvaluations.proposalId, input.proposalId))
      .orderBy(judgeEvaluations.revisionNumber, judgeEvaluations.evaluatedAt);
    return evaluations;
  }),
```

### DAO Voting Endpoints

**Procedure:** `selfImprovement.submitToDAOVoting`

```typescript
submitToDAOVoting: adminProcedure
  .input(z.object({ proposalId: z.number() }))
  .mutation(async ({ input }) => {
    const proposal = await getProposalById(input.proposalId);
    
    if (proposal.status !== "approved") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Proposal must be approved by all judges first"
      });
    }
    
    const votingProposal = await submitToDAOVoting(proposal);
    return votingProposal;
  }),
```

**Procedure:** `selfImprovement.castVote`

```typescript
castVote: protectedProcedure
  .input(z.object({
    votingProposalId: z.number(),
    vote: z.enum(["yes", "no"])
  }))
  .mutation(async ({ input, ctx }) => {
    const result = await castVote(ctx.user.id, input.votingProposalId, input.vote);
    return result;
  }),
```

**Procedure:** `selfImprovement.getActiveVotes`

```typescript
getActiveVotes: publicProcedure
  .query(async () => {
    const activeVotes = await db.select()
      .from(daoVotingProposals)
      .where(eq(daoVotingProposals.status, "active"))
      .orderBy(daoVotingProposals.votingEndDate);
    
    return activeVotes;
  }),
```

**Procedure:** `selfImprovement.getVotingHistory`

```typescript
getVotingHistory: publicProcedure
  .input(z.object({
    limit: z.number().optional().default(20),
    offset: z.number().optional().default(0)
  }))
  .query(async ({ input }) => {
    const history = await db.select()
      .from(daoVotingProposals)
      .where(
        or(
          eq(daoVotingProposals.status, "approved"),
          eq(daoVotingProposals.status, "rejected")
        )
      )
      .orderBy(desc(daoVotingProposals.votingEndDate))
      .limit(input.limit)
      .offset(input.offset);
    
    return history;
  }),
```

**Procedure:** `selfImprovement.getMyVotes`

```typescript
getMyVotes: protectedProcedure
  .query(async ({ ctx }) => {
    const myVotes = await db.select()
      .from(daoVotes)
      .innerJoin(daoVotingProposals, eq(daoVotes.votingProposalId, daoVotingProposals.id))
      .where(eq(daoVotes.userId, ctx.user.id))
      .orderBy(desc(daoVotes.createdAt));
    
    return myVotes;
  }),
```

**Procedure:** `selfImprovement.submitVoterFeedback`

```typescript
submitVoterFeedback: protectedProcedure
  .input(z.object({
    votingProposalId: z.number(),
    feedback: z.string().min(10),
    concerns: z.array(z.string()).optional(),
    suggestions: z.array(z.string()).optional()
  }))
  .mutation(async ({ input, ctx }) => {
    // Verify user voted "no"
    const vote = await db.select()
      .from(daoVotes)
      .where(
        and(
          eq(daoVotes.userId, ctx.user.id),
          eq(daoVotes.votingProposalId, input.votingProposalId),
          eq(daoVotes.vote, "no")
        )
      )
      .limit(1);
    
    if (!vote.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Only 'no' voters can submit feedback"
      });
    }
    
    const feedback = await db.insert(voterFeedback).values({
      votingProposalId: input.votingProposalId,
      userId: ctx.user.id,
      feedback: input.feedback,
      concerns: JSON.stringify(input.concerns || []),
      suggestions: JSON.stringify(input.suggestions || [])
    });
    
    return { success: true };
  }),
```

### Implementation Endpoints

**Procedure:** `selfImprovement.implementProposal`

```typescript
implementProposal: adminProcedure
  .input(z.object({ proposalId: z.number() }))
  .mutation(async ({ input }) => {
    const proposal = await getProposalById(input.proposalId);
    
    if (proposal.status !== "dao_approved") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Proposal must be approved by DAO before implementation"
      });
    }
    
    const result = await implementApprovedProposal(proposal);
    return result;
  }),
```

---

## Admin Dashboard

The admin dashboard provides visibility into the self-improvement pipeline, DAO voting activity, and manual override capabilities.

### Dashboard Sections

**1. Opportunity Pipeline**
- List of pending proposals with status
- Filter by category, priority, status
- View proposal details and evaluation history
- Manual approve/reject override

**2. Judge Panel Activity**
- Recent evaluations by each judge
- Judge agreement rates
- Average scores by category
- Evaluation time metrics

**3. DAO Voting Activity**
- Active votes with real-time tallies
- Voting participation rates
- Historical approval rates by category
- Voter engagement metrics
- Feedback summary from rejected proposals

**4. Implementation Status**
- Currently deploying improvements
- Deployment stage and percentage
- Success metrics tracking
- Rollback controls

**5. Success Metrics**
- Improvements deployed (last 30 days)
- Success rate (% achieving target metrics)
- User satisfaction impact
- Business metrics impact
- DAO approval rate trends

**6. Manual Controls**
- Pause automatic generation
- Pause automatic DAO submission
- Pause automatic implementation
- Force rollback
- Override judge decision
- Cancel active vote (emergency only)

---

## Safety & Rollback

### Automatic Rollback Triggers

The system automatically rolls back a deployment if any of these conditions occur:

1. **Error Rate Spike:** Error rate increases by >50% compared to baseline
2. **Performance Degradation:** API response time increases by >30%
3. **User Complaints:** Negative feedback rate increases by >100%
4. **Critical Bug:** Any error marked as severity "critical"
5. **Metric Regression:** Success metrics move opposite of target direction

### Manual Rollback

Administrators can manually trigger rollback at any time through the dashboard. The rollback process:

1. Immediately routes 100% traffic to previous version
2. Reverts database migrations (if safe)
3. Restores previous code version
4. Marks improvement as "rolled_back"
5. Generates incident report for analysis

### Safety Limits

- **Maximum 3 improvements** can be in implementation simultaneously
- **Minimum 24 hours** between deployments to same component
- **Maximum 10 improvements** per week to prevent change fatigue
- **Mandatory review** for changes affecting payment or safety systems

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation

