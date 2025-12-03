// OpenRide Platform Constants

// Fee Structure (Total: 13%)
export const NETWORK_FEE_PERCENTAGE = 13;
export const INSURANCE_FEE_PERCENTAGE = 10;
export const DEVELOPER_FEE_PERCENTAGE = 2.5;
export const BUYBACK_FEE_PERCENTAGE = 0.5;

// Token Rewards
export const DRIVER_RIDE_TOKENS = 10;
export const RIDER_RIDE_TOKENS = 1;

// DAO Governance Tiers
export const GOVERNANCE_TIERS = {
  emergency: {
    votingPeriodHours: 24,
    quorumPercentage: 30,
    approvalThreshold: 66,
  },
  operational: {
    votingPeriodHours: 96, // 4 days (middle of 3-5 range)
    quorumPercentage: 15,
    approvalThreshold: 51,
  },
  strategic: {
    votingPeriodHours: 168, // 7 days
    quorumPercentage: 20,
    approvalThreshold: 51,
  },
} as const;

// Minimum RIDE tokens required to submit a proposal
export const MIN_TOKENS_FOR_PROPOSAL = 10000;

// Ride Status
export const RIDE_STATUS = {
  REQUESTED: "requested",
  ACCEPTED: "accepted",
  DRIVER_ARRIVING: "driver_arriving",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Driver Verification Status
export const VERIFICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Claim Status
export const CLAIM_STATUS = {
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  PAID: "paid",
} as const;
