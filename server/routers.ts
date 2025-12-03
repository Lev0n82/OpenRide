import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createDriverProfile,
  getDriverProfileByUserId,
  updateDriverProfile,
  getPendingDriverVerifications,
  updateDriverAvailability,
  createVehicle,
  getVehiclesByDriverId,
  getActiveVehicleByDriverId,
  createRide,
  getRideById,
  updateRide,
  getAvailableRides,
  getRidesByRiderId,
  getRidesByDriverId,
  getActiveRideByDriverId,
  getActiveRideByRiderId,
  createRating,
  getRatingsByUserId,
  createProposal,
  getProposalById,
  getActiveProposals,
  getAllProposals,
  updateProposal,
  createVote,
  getVotesByProposalId,
  getUserVoteForProposal,
  getInsurancePool,
  updateInsurancePool,
  createClaim,
  getClaimById,
  getClaimsByUserId,
  getPendingClaims,
  updateClaim,
  createTokenTransaction,
  getTokenTransactionsByUserId,
  createBuybackRecord,
  getBuybackHistory,
  createEmergencyContact,
  getEmergencyContactsByUserId,
  createSafetyIncident,
  getSafetyIncidentsByRideId,
  getAllSafetyIncidents,
  updateUserTokenBalance,
  getUserById,
} from "./db";
import {
  DRIVER_RIDE_TOKENS,
  RIDER_RIDE_TOKENS,
  INSURANCE_FEE_PERCENTAGE,
  DEVELOPER_FEE_PERCENTAGE,
  BUYBACK_FEE_PERCENTAGE,
  GOVERNANCE_TIERS,
  MIN_TOKENS_FOR_PROPOSAL,
} from "@shared/openride-const";
import { TRPCError } from "@trpc/server";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // DRIVER MANAGEMENT
  // ============================================================================
  
  driver: router({
    // Apply to become a driver
    applyAsDriver: protectedProcedure
      .input(z.object({
        licenseNumber: z.string(),
        licenseExpiry: z.date(),
        licenseDocumentUrl: z.string(),
        insuranceDocumentUrl: z.string(),
        vehicleRegistrationUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getDriverProfileByUserId(ctx.user.id);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Driver profile already exists' });
        }

        const profileId = await createDriverProfile({
          userId: ctx.user.id,
          licenseNumber: input.licenseNumber,
          licenseExpiry: input.licenseExpiry,
          licenseDocumentUrl: input.licenseDocumentUrl,
          insuranceDocumentUrl: input.insuranceDocumentUrl,
          vehicleRegistrationUrl: input.vehicleRegistrationUrl,
          piNetworkKycVerified: true, // Assume Pi Network KYC is verified
          verificationStatus: 'pending',
        });

        return { profileId, success: true };
      }),

    // Get current user's driver profile
    getMyProfile: protectedProcedure.query(async ({ ctx }) => {
      return await getDriverProfileByUserId(ctx.user.id);
    }),

    // Toggle driver availability
    setAvailability: protectedProcedure
      .input(z.object({ isAvailable: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getDriverProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver profile not found' });
        }
        if (profile.verificationStatus !== 'approved') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Driver not verified' });
        }

        await updateDriverAvailability(profile.id, input.isAvailable);
        return { success: true };
      }),

    // Get pending verifications (admin only)
    getPendingVerifications: adminProcedure.query(async () => {
      return await getPendingDriverVerifications();
    }),

    // Approve/reject driver verification (admin only)
    updateVerification: adminProcedure
      .input(z.object({
        driverId: z.number(),
        status: z.enum(['approved', 'rejected']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateDriverProfile(input.driverId, {
          verificationStatus: input.status,
          verificationNotes: input.notes,
        });
        return { success: true };
      }),
  }),

  // ============================================================================
  // VEHICLE MANAGEMENT
  // ============================================================================
  
  vehicle: router({
    // Add a vehicle
    add: protectedProcedure
      .input(z.object({
        make: z.string(),
        model: z.string(),
        year: z.number(),
        color: z.string(),
        licensePlate: z.string(),
        vehicleType: z.enum(['sedan', 'suv', 'van', 'luxury']),
        capacity: z.number().default(4),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getDriverProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver profile not found' });
        }

        const vehicleId = await createVehicle({
          driverId: profile.id,
          ...input,
        });

        return { vehicleId, success: true };
      }),

    // Get my vehicles
    getMyVehicles: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getDriverProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return await getVehiclesByDriverId(profile.id);
    }),
  }),

  // ============================================================================
  // RIDE MANAGEMENT
  // ============================================================================
  
  ride: router({
    // Request a ride (rider)
    request: protectedProcedure
      .input(z.object({
        pickupAddress: z.string(),
        pickupLat: z.string(),
        pickupLng: z.string(),
        dropoffAddress: z.string(),
        dropoffLat: z.string(),
        dropoffLng: z.string(),
        estimatedDistance: z.number(),
        estimatedDuration: z.number(),
        estimatedFare: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already has an active ride
        const activeRide = await getActiveRideByRiderId(ctx.user.id);
        if (activeRide) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active ride' });
        }

        const rideId = await createRide({
          riderId: ctx.user.id,
          ...input,
          status: 'requested',
        });

        return { rideId, success: true };
      }),

    // Get available rides (driver)
    getAvailable: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getDriverProfileByUserId(ctx.user.id);
      if (!profile || profile.verificationStatus !== 'approved') {
        return [];
      }
      return await getAvailableRides();
    }),

    // Accept a ride (driver)
    accept: protectedProcedure
      .input(z.object({ rideId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getDriverProfileByUserId(ctx.user.id);
        if (!profile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Driver profile not found' });
        }

        // Check if driver already has an active ride
        const activeRide = await getActiveRideByDriverId(profile.id);
        if (activeRide) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already have an active ride' });
        }

        const ride = await getRideById(input.rideId);
        if (!ride || ride.status !== 'requested') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ride not available' });
        }

        const vehicle = await getActiveVehicleByDriverId(profile.id);
        if (!vehicle) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No active vehicle found' });
        }

        await updateRide(input.rideId, {
          driverId: profile.id,
          vehicleId: vehicle.id,
          status: 'accepted',
          acceptedAt: new Date(),
        });

        return { success: true };
      }),

    // Update ride status
    updateStatus: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        status: z.enum(['driver_arriving', 'in_progress', 'completed', 'cancelled']),
        cancellationReason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ride = await getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ride not found' });
        }

        const profile = await getDriverProfileByUserId(ctx.user.id);
        
        // Check authorization
        if (ride.riderId !== ctx.user.id && (!profile || ride.driverId !== profile.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const updates: any = { status: input.status };

        if (input.status === 'in_progress') {
          updates.startedAt = new Date();
        } else if (input.status === 'completed') {
          updates.completedAt = new Date();
          
          // Calculate fees and distribute tokens
          if (ride.estimatedFare) {
            const insuranceFee = Math.round(ride.estimatedFare * (INSURANCE_FEE_PERCENTAGE / 100));
            const developerFee = Math.round(ride.estimatedFare * (DEVELOPER_FEE_PERCENTAGE / 100));
            const buybackFee = Math.round(ride.estimatedFare * (BUYBACK_FEE_PERCENTAGE / 100));
            const driverEarnings = ride.estimatedFare - insuranceFee - developerFee - buybackFee;

            updates.actualFare = ride.estimatedFare;
            updates.insuranceFee = insuranceFee;
            updates.developerFee = developerFee;
            updates.buybackFee = buybackFee;
            updates.driverEarnings = driverEarnings;
            updates.rideTokensAwarded = DRIVER_RIDE_TOKENS + RIDER_RIDE_TOKENS;

            // Update insurance pool
            await updateInsurancePool(insuranceFee, 0, 0);

            // Award RIDE tokens
            if (ride.driverId && profile) {
              await updateUserTokenBalance(ctx.user.id, DRIVER_RIDE_TOKENS);
              await createTokenTransaction({
                userId: ctx.user.id,
                transactionType: 'ride_reward',
                amount: DRIVER_RIDE_TOKENS,
                rideId: input.rideId,
                description: `Driver reward for ride #${input.rideId}`,
              });

              // Update driver stats
              await updateDriverProfile(profile.id, {
                totalRides: profile.totalRides + 1,
                totalEarnings: profile.totalEarnings + driverEarnings,
              });
            }

            // Award rider tokens
            await updateUserTokenBalance(ride.riderId, RIDER_RIDE_TOKENS);
            await createTokenTransaction({
              userId: ride.riderId,
              transactionType: 'ride_reward',
              amount: RIDER_RIDE_TOKENS,
              rideId: input.rideId,
              description: `Rider reward for ride #${input.rideId}`,
            });
          }
        } else if (input.status === 'cancelled') {
          updates.cancelledAt = new Date();
          updates.cancellationReason = input.cancellationReason;
        }

        await updateRide(input.rideId, updates);
        return { success: true };
      }),

    // Get my rides
    getMyRides: protectedProcedure.query(async ({ ctx }) => {
      const riderRides = await getRidesByRiderId(ctx.user.id);
      const profile = await getDriverProfileByUserId(ctx.user.id);
      const driverRides = profile ? await getRidesByDriverId(profile.id) : [];
      
      return {
        asRider: riderRides,
        asDriver: driverRides,
      };
    }),

    // Get active ride
    getActive: protectedProcedure.query(async ({ ctx }) => {
      const riderRide = await getActiveRideByRiderId(ctx.user.id);
      if (riderRide) return { ride: riderRide, role: 'rider' as const };

      const profile = await getDriverProfileByUserId(ctx.user.id);
      if (profile) {
        const driverRide = await getActiveRideByDriverId(profile.id);
        if (driverRide) return { ride: driverRide, role: 'driver' as const };
      }

      return null;
    }),

    // Rate a ride
    rate: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ride = await getRideById(input.rideId);
        if (!ride || ride.status !== 'completed') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ride not completed' });
        }

        const profile = await getDriverProfileByUserId(ctx.user.id);
        
        let ratingType: 'driver_to_rider' | 'rider_to_driver';
        let ratedId: number;

        if (ride.riderId === ctx.user.id) {
          // Rider rating driver
          if (!ride.driverId) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'No driver to rate' });
          }
          ratingType = 'rider_to_driver';
          ratedId = ride.driverId;
        } else if (profile && ride.driverId === profile.id) {
          // Driver rating rider
          ratingType = 'driver_to_rider';
          ratedId = ride.riderId;
        } else {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        await createRating({
          rideId: input.rideId,
          raterId: ctx.user.id,
          ratedId,
          ratingType,
          rating: input.rating,
          comment: input.comment,
        });

        // Update driver average rating if driver was rated
        if (ratingType === 'rider_to_driver' && ride.driverId) {
          const driverProfile = await getDriverProfileByUserId(ratedId);
          if (driverProfile) {
            const allRatings = await getRatingsByUserId(ratedId);
            const driverRatings = allRatings.filter(r => r.ratingType === 'rider_to_driver');
            const avgRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
            await updateDriverProfile(driverProfile.id, {
              averageRating: Math.round(avgRating * 100),
            });
          }
        }

        return { success: true };
      }),
  }),

  // ============================================================================
  // DAO GOVERNANCE
  // ============================================================================
  
  governance: router({
    // Create a proposal
    createProposal: protectedProcedure
      .input(z.object({
        title: z.string().max(200),
        description: z.string(),
        tier: z.enum(['emergency', 'operational', 'strategic']),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check minimum token balance
        if (ctx.user.rideTokenBalance < MIN_TOKENS_FOR_PROPOSAL) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Minimum ${MIN_TOKENS_FOR_PROPOSAL} RIDE tokens required to create proposal`,
          });
        }

        const tierConfig = GOVERNANCE_TIERS[input.tier];
        const votingEndsAt = new Date();
        votingEndsAt.setHours(votingEndsAt.getHours() + tierConfig.votingPeriodHours);

        const proposalId = await createProposal({
          proposerId: ctx.user.id,
          title: input.title,
          description: input.description,
          tier: input.tier,
          votingPeriodHours: tierConfig.votingPeriodHours,
          quorumPercentage: tierConfig.quorumPercentage,
          approvalThreshold: tierConfig.approvalThreshold,
          votingEndsAt,
        });

        return { proposalId, success: true };
      }),

    // Vote on a proposal
    vote: protectedProcedure
      .input(z.object({
        proposalId: z.number(),
        voteChoice: z.enum(['for', 'against']),
      }))
      .mutation(async ({ ctx, input }) => {
        const proposal = await getProposalById(input.proposalId);
        if (!proposal) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
        }

        if (proposal.status !== 'active') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Proposal is not active' });
        }

        if (new Date() > proposal.votingEndsAt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Voting period has ended' });
        }

        // Check if user already voted
        const existingVote = await getUserVoteForProposal(input.proposalId, ctx.user.id);
        if (existingVote) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already voted on this proposal' });
        }

        const votingPower = ctx.user.rideTokenBalance;

        await createVote({
          proposalId: input.proposalId,
          voterId: ctx.user.id,
          voteChoice: input.voteChoice,
          votingPower,
        });

        // Update proposal vote counts
        const newVotesFor = input.voteChoice === 'for'
          ? proposal.votesFor + votingPower
          : proposal.votesFor;
        const newVotesAgainst = input.voteChoice === 'against'
          ? proposal.votesAgainst + votingPower
          : proposal.votesAgainst;

        await updateProposal(input.proposalId, {
          votesFor: newVotesFor,
          votesAgainst: newVotesAgainst,
          totalVotingPower: proposal.totalVotingPower + votingPower,
        });

        return { success: true };
      }),

    // Get all proposals
    getAll: publicProcedure.query(async () => {
      return await getAllProposals();
    }),

    // Get active proposals
    getActive: publicProcedure.query(async () => {
      return await getActiveProposals();
    }),

    // Get proposal by ID with votes
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const proposal = await getProposalById(input.id);
        if (!proposal) return null;

        const votes = await getVotesByProposalId(input.id);
        return { proposal, votes };
      }),
  }),

  // ============================================================================
  // INSURANCE & CLAIMS
  // ============================================================================
  
  insurance: router({
    // Get insurance pool status
    getPool: publicProcedure.query(async () => {
      return await getInsurancePool();
    }),

    // Submit a claim
    submitClaim: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        claimType: z.enum(['accident', 'damage', 'injury', 'theft', 'other']),
        description: z.string(),
        amountRequested: z.number(),
        evidenceUrls: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const ride = await getRideById(input.rideId);
        if (!ride) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Ride not found' });
        }

        // Verify user was part of the ride
        const profile = await getDriverProfileByUserId(ctx.user.id);
        if (ride.riderId !== ctx.user.id && (!profile || ride.driverId !== profile.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
        }

        const claimId = await createClaim({
          rideId: input.rideId,
          claimantId: ctx.user.id,
          claimType: input.claimType,
          description: input.description,
          amountRequested: input.amountRequested,
          evidenceUrls: input.evidenceUrls,
        });

        return { claimId, success: true };
      }),

    // Get my claims
    getMyClaims: protectedProcedure.query(async ({ ctx }) => {
      return await getClaimsByUserId(ctx.user.id);
    }),

    // Get pending claims (admin)
    getPending: adminProcedure.query(async () => {
      return await getPendingClaims();
    }),

    // Review claim (admin)
    reviewClaim: adminProcedure
      .input(z.object({
        claimId: z.number(),
        status: z.enum(['approved', 'rejected', 'paid']),
        amountApproved: z.number().optional(),
        reviewNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const claim = await getClaimById(input.claimId);
        if (!claim) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Claim not found' });
        }

        const updates: any = {
          status: input.status,
          reviewNotes: input.reviewNotes,
          reviewedAt: new Date(),
        };

        if (input.status === 'approved' && input.amountApproved) {
          updates.amountApproved = input.amountApproved;
          // Update insurance pool
          await updateInsurancePool(0, input.amountApproved, 0);
        } else if (input.status === 'paid' && claim.amountApproved) {
          updates.paidAt = new Date();
          // Update insurance pool
          await updateInsurancePool(0, 0, claim.amountApproved);
        }

        await updateClaim(input.claimId, updates);
        return { success: true };
      }),
  }),

  // ============================================================================
  // TOKEN ECONOMICS
  // ============================================================================
  
  tokens: router({
    // Get my token balance and transactions
    getMyTokens: protectedProcedure.query(async ({ ctx }) => {
      const transactions = await getTokenTransactionsByUserId(ctx.user.id);
      return {
        balance: ctx.user.rideTokenBalance,
        transactions,
      };
    }),

    // Get buyback history
    getBuybackHistory: publicProcedure.query(async () => {
      return await getBuybackHistory();
    }),
  }),

  // ============================================================================
  // SAFETY
  // ============================================================================
  
  safety: router({
    // Add emergency contact
    addEmergencyContact: protectedProcedure
      .input(z.object({
        contactName: z.string(),
        contactPhone: z.string(),
        relationship: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createEmergencyContact({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    // Get my emergency contacts
    getMyContacts: protectedProcedure.query(async ({ ctx }) => {
      return await getEmergencyContactsByUserId(ctx.user.id);
    }),

    // Report safety incident
    reportIncident: protectedProcedure
      .input(z.object({
        rideId: z.number(),
        incidentType: z.enum(['sos_triggered', 'harassment', 'accident', 'unsafe_driving', 'other']),
        description: z.string(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const incidentId = await createSafetyIncident({
          rideId: input.rideId,
          reporterId: ctx.user.id,
          incidentType: input.incidentType,
          description: input.description,
          location: input.location,
        });

        return { incidentId, success: true };
      }),

    // Get all safety incidents (admin)
    getAllIncidents: adminProcedure.query(async () => {
      return await getAllSafetyIncidents();
    }),
  }),
});

export type AppRouter = typeof appRouter;
