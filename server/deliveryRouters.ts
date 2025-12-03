/**
 * Delivery & Courier Service Routers
 * 
 * tRPC procedures for delivery service management
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { 
  updateDriverProfile, 
  getDriverProfileByUserId,
  createRide,
  getRideById,
  updateRide,
  getAvailableRides,
  getRidesByRiderId,
  getRidesByDriverId,
  updateUserTokenBalance,
  createTokenTransaction,
} from "./db";
import { TRPCError } from "@trpc/server";
import { 
  DRIVER_RIDE_TOKENS, 
  RIDER_RIDE_TOKENS,
  INSURANCE_FEE_PERCENTAGE,
  DEVELOPER_FEE_PERCENTAGE,
  BUYBACK_FEE_PERCENTAGE,
} from "@shared/openride-const";

export const deliveryRouter = router({
  /**
   * Toggle delivery service opt-in for driver
   */
  toggleDeliveryService: protectedProcedure
    .input(z.object({
      enabled: z.boolean(),
      maxPackageWeight: z.number().min(1).max(100).optional(), // kg
      maxPackageSize: z.enum(["small", "medium", "large", "xlarge"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const driverProfile = await getDriverProfileByUserId(ctx.user.id);
      
      if (!driverProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Driver profile not found',
        });
      }

      await updateDriverProfile(driverProfile.id, {
        offersDelivery: input.enabled,
        maxPackageWeight: input.maxPackageWeight,
        maxPackageSize: input.maxPackageSize,
      });

      return {
        success: true,
        offersDelivery: input.enabled,
      };
    }),

  /**
   * Get driver's delivery settings
   */
  getDeliverySettings: protectedProcedure.query(async ({ ctx }) => {
    const driverProfile = await getDriverProfileByUserId(ctx.user.id);
    
    if (!driverProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Driver profile not found',
      });
    }

    return {
      offersDelivery: driverProfile.offersDelivery,
      maxPackageWeight: driverProfile.maxPackageWeight,
      maxPackageSize: driverProfile.maxPackageSize,
      totalDeliveries: driverProfile.totalDeliveries,
    };
  }),

  /**
   * Request a delivery
   */
  requestDelivery: protectedProcedure
    .input(z.object({
      pickupAddress: z.string(),
      pickupLat: z.string(),
      pickupLng: z.string(),
      dropoffAddress: z.string(),
      dropoffLat: z.string(),
      dropoffLng: z.string(),
      packageDescription: z.string(),
      packageWeight: z.number(), // kg
      packageSize: z.enum(["small", "medium", "large", "xlarge"]),
      recipientName: z.string(),
      recipientPhone: z.string(),
      deliveryInstructions: z.string().optional(),
      estimatedDistance: z.number().optional(), // meters
      estimatedDuration: z.number().optional(), // seconds
      estimatedFare: z.number(), // cents
    }))
    .mutation(async ({ input, ctx }) => {
      // Calculate fees (13% total)
      const insuranceFee = Math.floor(input.estimatedFare * INSURANCE_FEE_PERCENTAGE);
      const developerFee = Math.floor(input.estimatedFare * DEVELOPER_FEE_PERCENTAGE);
      const buybackFee = Math.floor(input.estimatedFare * BUYBACK_FEE_PERCENTAGE);
      const driverEarnings = input.estimatedFare - insuranceFee - developerFee - buybackFee;

      const rideId = await createRide({
        riderId: ctx.user.id,
        serviceType: "delivery",
        pickupAddress: input.pickupAddress,
        pickupLat: input.pickupLat,
        pickupLng: input.pickupLng,
        dropoffAddress: input.dropoffAddress,
        dropoffLat: input.dropoffLat,
        dropoffLng: input.dropoffLng,
        estimatedDistance: input.estimatedDistance,
        estimatedDuration: input.estimatedDuration,
        estimatedFare: input.estimatedFare,
        insuranceFee,
        developerFee,
        buybackFee,
        driverEarnings,
        packageDescription: input.packageDescription,
        packageWeight: input.packageWeight,
        packageSize: input.packageSize,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        deliveryInstructions: input.deliveryInstructions,
      });

      const ride = await getRideById(rideId);

      return {
        success: true,
        delivery: ride,
      };
    }),

  /**
   * Get available deliveries for drivers
   */
  getAvailableDeliveries: protectedProcedure.query(async ({ ctx }) => {
    const driverProfile = await getDriverProfileByUserId(ctx.user.id);
    
    if (!driverProfile) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Driver profile not found',
      });
    }

    if (!driverProfile.offersDelivery) {
      return [];
    }

    const allRides = await getAvailableRides();
    
    // Filter for deliveries that match driver's capacity
    const deliveries = allRides.filter(ride => 
      ride.serviceType === 'delivery' &&
      (!ride.packageWeight || ride.packageWeight <= (driverProfile.maxPackageWeight || 20))
    );

    return deliveries;
  }),

  /**
   * Upload proof of delivery
   */
  uploadProofOfDelivery: protectedProcedure
    .input(z.object({
      rideId: z.number(),
      proofUrl: z.string(), // URL to uploaded photo
    }))
    .mutation(async ({ input, ctx }) => {
      const ride = await getRideById(input.rideId);
      
      if (!ride) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Delivery not found',
        });
      }

      if (ride.serviceType !== 'delivery') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Not a delivery',
        });
      }

      const driverProfile = await getDriverProfileByUserId(ctx.user.id);
      if (!driverProfile || ride.driverId !== driverProfile.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not your delivery',
        });
      }

      await updateRide(input.rideId, {
        proofOfDeliveryUrl: input.proofUrl,
      });

      return {
        success: true,
      };
    }),

  /**
   * Get delivery history for customer
   */
  getMyDeliveries: protectedProcedure.query(async ({ ctx }) => {
    const allRides = await getRidesByRiderId(ctx.user.id);
    return allRides.filter(ride => ride.serviceType === 'delivery');
  }),

  /**
   * Get delivery history for driver
   */
  getMyDriverDeliveries: protectedProcedure.query(async ({ ctx }) => {
    const driverProfile = await getDriverProfileByUserId(ctx.user.id);
    
    if (!driverProfile) {
      return [];
    }

    const allRides = await getRidesByDriverId(driverProfile.id);
    return allRides.filter(ride => ride.serviceType === 'delivery');
  }),
});
