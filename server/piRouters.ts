/**
 * Pi Network Integration Routers
 * 
 * tRPC procedures for Pi Network authentication and payments
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { verifyPiUser, getPiPayment, approvePiPayment, completePiPayment, isPiConfigured } from "./pi";
import { upsertUser, getUserByOpenId, updateUserTokenBalance, createTokenTransaction } from "./db";
import { TRPCError } from "@trpc/server";

export const piRouter = router({
  /**
   * Check if Pi Network is configured
   */
  isConfigured: publicProcedure.query(() => {
    return { configured: isPiConfigured() };
  }),

  /**
   * Verify Pi Network user and create/update user in database
   */
  verifyUser: publicProcedure
    .input(z.object({
      accessToken: z.string(),
      username: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Verify with Pi Network
      const piUser = await verifyPiUser(input.accessToken);
      
      // Create or update user in our database
      await upsertUser({
        openId: piUser.uid,
        name: input.username || piUser.username || 'Pi User',
        email: null,
        loginMethod: 'pi_network',
        lastSignedIn: new Date(),
      });
      
      // Get the full user record
      const user = await getUserByOpenId(piUser.uid);
      
      return {
        success: true,
        user,
      };
    }),

  /**
   * Approve a payment (called from onReadyForServerApproval callback)
   */
  approvePayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      rideId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get payment details from Pi Network
      const payment = await getPiPayment(input.paymentId);
      
      // Verify the payment belongs to this user
      if (payment.user_uid !== ctx.user.openId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Payment does not belong to this user',
        });
      }
      
      // Verify payment amount matches expected amount (if rideId provided)
      // TODO: Add ride fare verification here
      
      // Approve the payment with Pi Network
      const approvedPayment = await approvePiPayment(input.paymentId);
      
      return {
        success: true,
        payment: approvedPayment,
      };
    }),

  /**
   * Complete a payment (called from onReadyForServerCompletion callback)
   */
  completePayment: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
      txid: z.string(),
      rideId: z.number(),
      amount: z.number(), // Amount in Pi
    }))
    .mutation(async ({ input, ctx }) => {
      // Get payment details from Pi Network
      const payment = await getPiPayment(input.paymentId);
      
      // Verify the payment belongs to this user
      if (payment.user_uid !== ctx.user.openId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Payment does not belong to this user',
        });
      }
      
      // Complete the payment with Pi Network
      const completedPayment = await completePiPayment(input.paymentId, input.txid);
      
      // Verify payment was successful
      if (!completedPayment.transaction?.verified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment transaction not verified',
        });
      }
      
      // Award RIDE tokens to rider (1 RIDE per ride)
      await updateUserTokenBalance(ctx.user.id, 1);
      await createTokenTransaction({
        userId: ctx.user.id,
        amount: 1,
        transactionType: 'ride_reward',
        description: `Ride reward for ride #${input.rideId} - Pi payment ${input.paymentId}`,
        rideId: input.rideId,
      });
      
      // TODO: Update ride record with payment info
      // TODO: Award driver their RIDE tokens (10 RIDE)
      // TODO: Distribute network fees (13% split)
      
      return {
        success: true,
        payment: completedPayment,
        rideTokensAwarded: 1,
      };
    }),

  /**
   * Get payment status
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({
      paymentId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const payment = await getPiPayment(input.paymentId);
      
      // Verify the payment belongs to this user
      if (payment.user_uid !== ctx.user.openId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Payment does not belong to this user',
        });
      }
      
      return payment;
    }),
});
