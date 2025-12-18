import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { driverApplications, driverDocuments, driverProfiles, vehicles, users } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "./storage";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const driverApplicationRouter = router({
  // Save draft application
  saveDraftApplication: protectedProcedure
    .input(z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
      phoneNumber: z.string().min(1),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleYear: z.number().optional(),
      vehicleColor: z.string().optional(),
      licensePlate: z.string().optional(),
      passengerCapacity: z.number().min(1).max(8).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Check if application already exists
      const [existing] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, userId))
        .limit(1);

      if (existing) {
        // Update existing draft
        await db!
          .update(driverApplications)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(driverApplications.id, existing.id));

        return { success: true, applicationId: existing.id };
      } else {
        // Create new draft
        const [result] = await db!
          .insert(driverApplications)
          .values({
            userId,
            ...input,
            status: 'draft',
          });

        return { success: true, applicationId: result.insertId };
      }
    }),

  // Upload document
  uploadDocument: protectedProcedure
    .input(z.object({
      documentType: z.enum(['license', 'insurance', 'registration']),
      fileData: z.string(), // base64
      fileName: z.string(),
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get or create application
      let [application] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, userId))
        .limit(1);

      if (!application) {
        // Create draft application if it doesn't exist
        const [result] = await db!
          .insert(driverApplications)
          .values({
            userId,
            fullName: ctx.user.name || '',
            email: ctx.user.email || '',
            phoneNumber: ctx.user.phoneNumber || '',
            status: 'draft',
          });

        [application] = await db!
          .select()
          .from(driverApplications)
          .where(eq(driverApplications.id, result.insertId))
          .limit(1);
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(input.fileData, 'base64');
      const fileSize = buffer.length;

      // Upload to S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const fileKey = `driver-documents/${userId}/${input.documentType}/${timestamp}-${randomSuffix}-${input.fileName}`;
      
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Check if document already exists for this application
      const [existingDoc] = await db!
        .select()
        .from(driverDocuments)
        .where(
          and(
            eq(driverDocuments.applicationId, application.id),
            eq(driverDocuments.documentType, input.documentType)
          )
        )
        .limit(1);

      if (existingDoc) {
        // Update existing document
        await db!
          .update(driverDocuments)
          .set({
            fileUrl: url,
            fileName: input.fileName,
            fileSize,
            mimeType: input.mimeType,
            verificationStatus: 'pending',
            uploadedAt: new Date(),
          })
          .where(eq(driverDocuments.id, existingDoc.id));
      } else {
        // Insert new document
        await db!
          .insert(driverDocuments)
          .values({
            applicationId: application.id,
            documentType: input.documentType,
            fileUrl: url,
            fileName: input.fileName,
            fileSize,
            mimeType: input.mimeType,
            verificationStatus: 'pending',
          });
      }

      return { success: true, fileUrl: url };
    }),

  // Check Pi Network KYC status
  checkPiKycStatus: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get application
      const [application] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, userId))
        .limit(1);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found. Please save your application first.',
        });
      }

      // TODO: Integrate with actual Pi Network KYC API
      // For now, return mock data
      const kycStatus = application.piKycStatus || 'pending';
      
      return {
        kycStatus,
        kycUrl: 'https://kyc.pi.network',
        message: kycStatus === 'verified' 
          ? 'KYC verification complete' 
          : 'Please complete KYC verification on Pi Network',
      };
    }),

  // Submit application
  submitApplication: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      // Get application with documents
      const [application] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, userId))
        .limit(1);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      // Validate application is complete
      if (!application.fullName || !application.email || !application.phoneNumber) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please complete personal information',
        });
      }

      if (!application.vehicleMake || !application.vehicleModel || !application.licensePlate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please complete vehicle information',
        });
      }

      // Check required documents
      const documents = await db!
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.applicationId, application.id));

      const hasLicense = documents.some(d => d.documentType === 'license');
      const hasInsurance = documents.some(d => d.documentType === 'insurance');
      const hasRegistration = documents.some(d => d.documentType === 'registration');

      if (!hasLicense || !hasInsurance || !hasRegistration) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please upload all required documents (license, insurance, registration)',
        });
      }

      // Check KYC status
      if (application.piKycStatus !== 'verified') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Please complete Pi Network KYC verification',
        });
      }

      // Submit application
      await db!
        .update(driverApplications)
        .set({
          status: 'submitted',
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(driverApplications.id, application.id));

      return { success: true, message: 'Application submitted successfully' };
    }),

  // Get my application
  getMyApplication: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      const userId = ctx.user.id;

      const [application] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, userId))
        .limit(1);

      if (!application) {
        return { application: null, documents: [], missingDocuments: ['license', 'insurance', 'registration'] };
      }

      const documents = await db!
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.applicationId, application.id))
        .orderBy(desc(driverDocuments.uploadedAt));

      const uploadedTypes = documents.map(d => d.documentType);
      const missingDocuments = (['license', 'insurance', 'registration'] as const)
        .filter(type => !uploadedTypes.includes(type));

      return {
        application,
        documents,
        missingDocuments,
      };
    }),

  // Admin: Get pending applications
  getPendingApplications: adminProcedure
    .query(async () => {
      const db = await getDb();

      const applications = await db!
        .select({
          application: driverApplications,
          user: users,
        })
        .from(driverApplications)
        .leftJoin(users, eq(driverApplications.userId, users.id))
        .where(eq(driverApplications.status, 'submitted'))
        .orderBy(desc(driverApplications.submittedAt));

      return applications;
    }),

  // Admin: Get application details
  getApplicationDetails: adminProcedure
    .input(z.object({
      applicationId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();

      const [application] = await db!
        .select({
          application: driverApplications,
          user: users,
        })
        .from(driverApplications)
        .leftJoin(users, eq(driverApplications.userId, users.id))
        .where(eq(driverApplications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      const documents = await db!
        .select()
        .from(driverDocuments)
        .where(eq(driverDocuments.applicationId, input.applicationId))
        .orderBy(desc(driverDocuments.uploadedAt));

      return {
        ...application,
        documents,
      };
    }),

  // Admin: Approve or reject application
  reviewApplication: adminProcedure
    .input(z.object({
      applicationId: z.number(),
      action: z.enum(['approve', 'reject']),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      const [application] = await db!
        .select()
        .from(driverApplications)
        .where(eq(driverApplications.id, input.applicationId))
        .limit(1);

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (input.action === 'approve') {
        // Update application status
        await db!
          .update(driverApplications)
          .set({
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(driverApplications.id, input.applicationId));

        // Create driver profile
        const [profileResult] = await db!
          .insert(driverProfiles)
          .values({
            userId: application.userId,
            piNetworkKycVerified: true,
            verificationStatus: 'approved',
            offersDelivery: false,
            isAvailable: false,
          });

        // Create vehicle record
        await db!
          .insert(vehicles)
          .values({
            driverId: profileResult.insertId,
            make: application.vehicleMake || '',
            model: application.vehicleModel || '',
            year: application.vehicleYear || new Date().getFullYear(),
            color: application.vehicleColor || '',
            licensePlate: application.licensePlate || '',
            vehicleType: 'sedan',
            capacity: application.passengerCapacity || 4,
            isActive: true,
          });

        // Update user role to driver
        await db!
          .update(users)
          .set({ role: 'driver' })
          .where(eq(users.id, application.userId));

        return { success: true, message: 'Application approved and driver profile created' };
      } else {
        // Reject application
        await db!
          .update(driverApplications)
          .set({
            status: 'rejected',
            rejectionReason: input.rejectionReason,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
            updatedAt: new Date(),
          })
          .where(eq(driverApplications.id, input.applicationId));

        return { success: true, message: 'Application rejected' };
      }
    }),
});
