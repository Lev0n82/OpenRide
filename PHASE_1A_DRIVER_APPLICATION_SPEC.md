# Phase 1A: Driver Application & Verification - Complete Specification

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation  
**Author:** Manus AI

---

## Executive Summary

This document provides the complete technical specification for implementing the driver application and verification system in OpenRide. The specification covers all aspects from database schema to UI components, API endpoints, security requirements, and comprehensive test plans. This system enables prospective drivers to submit applications with required documents, integrates with Pi Network KYC for identity verification, and provides administrators with tools to review and approve applications.

The implementation follows the existing OpenRide architecture built on React 19, tRPC 11, Drizzle ORM, and MySQL, while introducing new patterns for file uploads to S3, document verification workflows, and admin approval processes.

---

## Table of Contents

1. [Requirements Overview](#requirements-overview)
2. [Database Schema](#database-schema)
3. [API Specifications](#api-specifications)
4. [Component Architecture](#component-architecture)
5. [File Upload & Security](#file-upload--security)
6. [Pi Network KYC Integration](#pi-network-kyc-integration)
7. [Notification System](#notification-system)
8. [Test Plan](#test-plan)
9. [Implementation Checklist](#implementation-checklist)

---

## Requirements Overview

### Functional Requirements (FR-2)

The system shall allow users to apply as drivers and complete verification through Pi Network KYC integration before accepting rides. Prospective drivers submit an application including personal information, vehicle details, and required documents. The system integrates with Pi Network's KYC system to verify driver identity. Administrators review applications and can approve or reject based on document quality and background checks. Only verified drivers can toggle availability and accept ride requests.

### Acceptance Criteria

The implementation must satisfy all eight acceptance criteria defined in REQUIREMENTS.md:

**AC-2.1:** Users can submit driver application with all required fields (name, email, phone, vehicle info). The application form must validate that all mandatory fields are completed before allowing submission. Vehicle information includes make, model, year, color, license plate number, and passenger capacity.

**AC-2.2:** System validates required documents are uploaded (license, insurance, registration). The system must enforce that all three critical documents are uploaded before the application can be submitted. Each document type can only be uploaded once per application, with the ability to replace documents before submission.

**AC-2.3:** Pi Network KYC status is checked and displayed in application. The system must query Pi Network's KYC API during the application process and display the verification status with appropriate badges (verified/unverified). Unverified users must be prompted to complete Pi KYC before proceeding.

**AC-2.4:** Admins can review pending applications with all submitted information visible. The admin verification dashboard must display a list of pending applications with applicant details, vehicle information, and document thumbnails. Admins must be able to view full-size documents by clicking thumbnails.

**AC-2.5:** Admins can approve or reject applications with optional notes. The admin interface must provide clear approve/reject buttons for each application. When rejecting, admins must be able to provide a reason that will be communicated to the applicant.

**AC-2.6:** Drivers receive notification of application status change. When an admin approves or rejects an application, the system must send a notification to the driver via the built-in notification system. The notification must include the status and any admin notes.

**AC-2.7:** Only verified drivers can toggle "available" status. The driver dashboard must check verification status before allowing drivers to go online. Unverified drivers attempting to toggle availability must see an error message.

**AC-2.8:** Unverified drivers see clear message explaining verification requirement. The driver dashboard must display a prominent message explaining that verification is pending and what steps remain (if any). The message must include expected timeline and any required actions.

---

## Database Schema

### 1. Driver Applications Table

The `driver_applications` table tracks the overall application status and metadata. This is separate from the existing `drivers` table to maintain a clear audit trail of the application process.

```typescript
export const driverApplications = mysqlTable("driver_applications", {
  id: int("id").primaryKey().autoincrement(),
  
  // User reference
  userId: int("user_id").notNull().unique(), // One application per user
  
  // Application status
  status: varchar("status", { length: 20 }).notNull().default("draft"), 
  // "draft", "submitted", "under_review", "approved", "rejected"
  
  // Personal information
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  
  // Vehicle information
  vehicleMake: varchar("vehicle_make", { length: 100 }).notNull(),
  vehicleModel: varchar("vehicle_model", { length: 100 }).notNull(),
  vehicleYear: int("vehicle_year").notNull(),
  vehicleColor: varchar("vehicle_color", { length: 50 }).notNull(),
  licensePlate: varchar("license_plate", { length: 20 }).notNull().unique(),
  passengerCapacity: int("passenger_capacity").notNull().default(4),
  
  // Pi Network KYC
  piKycStatus: varchar("pi_kyc_status", { length: 20 }), // "verified", "unverified", "pending"
  piKycCheckedAt: timestamp("pi_kyc_checked_at"),
  
  // Admin review
  reviewedBy: int("reviewed_by"), // admin user_id
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DriverApplication = typeof driverApplications.$inferSelect;
export type InsertDriverApplication = typeof driverApplications.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_driver_applications_user_id ON driver_applications(user_id);
CREATE INDEX idx_driver_applications_status ON driver_applications(status);
CREATE INDEX idx_driver_applications_submitted_at ON driver_applications(submitted_at);
CREATE INDEX idx_driver_applications_license_plate ON driver_applications(license_plate);
```

**Status Flow:**
- `draft` → User is filling out application but hasn't submitted
- `submitted` → Application submitted, awaiting admin review
- `under_review` → Admin has opened the application for review
- `approved` → Admin approved, driver profile created
- `rejected` → Admin rejected with reason

### 2. Driver Documents Table

The `driver_documents` table tracks all uploaded documents with verification status. This schema is already defined in IMPLEMENTATION_DESIGN.md but included here for completeness.

```typescript
export const driverDocuments = mysqlTable("driver_documents", {
  id: int("id").primaryKey().autoincrement(),
  
  // References
  applicationId: int("application_id").notNull(), // Links to driver_applications
  userId: int("user_id").notNull(),
  
  // Document details
  documentType: varchar("document_type", { length: 50 }).notNull(), 
  // "license", "insurance", "registration", "vehicle_photo", "profile_photo"
  documentUrl: varchar("document_url", { length: 500 }).notNull(),
  documentKey: varchar("document_key", { length: 500 }).notNull(), // S3 key
  
  // Metadata
  fileName: varchar("file_name", { length: 255 }),
  fileSize: int("file_size"), // bytes
  mimeType: varchar("mime_type", { length: 100 }),
  
  // Verification
  verificationStatus: varchar("verification_status", { length: 20 }).notNull().default("pending"), 
  // "pending", "approved", "rejected"
  verifiedBy: int("verified_by"), // admin user_id
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  
  // Expiry (for licenses, insurance)
  expiryDate: timestamp("expiry_date"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DriverDocument = typeof driverDocuments.$inferSelect;
export type InsertDriverDocument = typeof driverDocuments.$inferInsert;
```

**Indexes:**
```sql
CREATE INDEX idx_driver_documents_application_id ON driver_documents(application_id);
CREATE INDEX idx_driver_documents_user_id ON driver_documents(user_id);
CREATE INDEX idx_driver_documents_type_status ON driver_documents(document_type, verification_status);
```

**Required Document Types:**
- `license` - Driver's license (front and back)
- `insurance` - Vehicle insurance certificate
- `registration` - Vehicle registration document
- `vehicle_photo` - Photo of the vehicle (optional but recommended)
- `profile_photo` - Driver profile photo (optional but recommended)

### 3. Schema Migration Plan

**Step 1:** Create `driver_applications` table
```sql
-- Generated by drizzle-kit
CREATE TABLE driver_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  vehicle_make VARCHAR(100) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  vehicle_year INT NOT NULL,
  vehicle_color VARCHAR(50) NOT NULL,
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  passenger_capacity INT NOT NULL DEFAULT 4,
  pi_kyc_status VARCHAR(20),
  pi_kyc_checked_at TIMESTAMP,
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);
```

**Step 2:** Create `driver_documents` table (if not exists)

**Step 3:** Add indexes

**Step 4:** Run migration: `pnpm db:push`

---

## API Specifications

### 1. Driver Application Endpoints

All driver application endpoints are grouped under the `driver` router namespace.

#### 1.1 Create/Update Draft Application

**Procedure:** `driver.saveDraftApplication`

**Purpose:** Save application progress without submitting. Allows users to complete the application over multiple sessions.

**Input Schema:**
```typescript
const saveDraftApplicationInput = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 format
  vehicleMake: z.string().min(2).max(100),
  vehicleModel: z.string().min(2).max(100),
  vehicleYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  vehicleColor: z.string().min(2).max(50),
  licensePlate: z.string().min(2).max(20).toUpperCase(),
  passengerCapacity: z.number().int().min(1).max(8).default(4),
});
```

**Output Schema:**
```typescript
{
  success: boolean;
  applicationId: number;
  status: "draft";
}
```

**Implementation:**
```typescript
driver: router({
  saveDraftApplication: protectedProcedure
    .input(saveDraftApplicationInput)
    .mutation(async ({ input, ctx }) => {
      // Check if application already exists
      const existing = await db.select()
        .from(driverApplications)
        .where(eq(driverApplications.userId, ctx.user.id))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing draft
        await db.update(driverApplications)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(driverApplications.userId, ctx.user.id));
        
        return {
          success: true,
          applicationId: existing[0].id,
          status: "draft" as const,
        };
      } else {
        // Create new draft
        const [result] = await db.insert(driverApplications)
          .values({
            userId: ctx.user.id,
            ...input,
            status: "draft",
          });
        
        return {
          success: true,
          applicationId: result.insertId,
          status: "draft" as const,
        };
      }
    }),
});
```

**Error Handling:**
- `CONFLICT`: License plate already exists in system
- `BAD_REQUEST`: Invalid input format (phone number, email, year)

#### 1.2 Upload Document

**Procedure:** `driver.uploadDocument`

**Purpose:** Upload a verification document (license, insurance, registration) to S3 and record metadata.

**Input Schema:**
```typescript
const uploadDocumentInput = z.object({
  documentType: z.enum(["license", "insurance", "registration", "vehicle_photo", "profile_photo"]),
  fileData: z.string(), // base64 encoded
  fileName: z.string().max(255),
  mimeType: z.string(),
  expiryDate: z.date().optional(), // Required for license and insurance
});
```

**Output Schema:**
```typescript
{
  success: boolean;
  documentId: number;
  documentUrl: string;
  verificationStatus: "pending";
}
```

**Implementation:**
```typescript
uploadDocument: protectedProcedure
  .input(uploadDocumentInput)
  .mutation(async ({ input, ctx }) => {
    // Get application
    const application = await db.select()
      .from(driverApplications)
      .where(eq(driverApplications.userId, ctx.user.id))
      .limit(1);
    
    if (application.length === 0) {
      throw new TRPCError({ 
        code: 'NOT_FOUND', 
        message: 'Driver application not found. Please save your application first.' 
      });
    }
    
    if (application[0].status !== "draft") {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Cannot upload documents after application is submitted.' 
      });
    }
    
    // Validate file size (max 10MB)
    const fileBuffer = Buffer.from(input.fileData, 'base64');
    if (fileBuffer.length > 10 * 1024 * 1024) {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'File size exceeds 10MB limit.' 
      });
    }
    
    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(input.mimeType)) {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF.' 
      });
    }
    
    // Generate secure S3 key with random suffix to prevent enumeration
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = input.fileName.split('.').pop();
    const fileKey = `driver-documents/${application[0].id}/${input.documentType}-${randomSuffix}.${fileExtension}`;
    
    // Upload to S3
    const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
    
    // Check if document type already exists
    const existingDoc = await db.select()
      .from(driverDocuments)
      .where(
        and(
          eq(driverDocuments.applicationId, application[0].id),
          eq(driverDocuments.documentType, input.documentType)
        )
      )
      .limit(1);
    
    if (existingDoc.length > 0) {
      // Replace existing document
      await db.update(driverDocuments)
        .set({
          documentUrl: url,
          documentKey: fileKey,
          fileName: input.fileName,
          fileSize: fileBuffer.length,
          mimeType: input.mimeType,
          expiryDate: input.expiryDate,
          verificationStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(driverDocuments.id, existingDoc[0].id));
      
      return {
        success: true,
        documentId: existingDoc[0].id,
        documentUrl: url,
        verificationStatus: "pending" as const,
      };
    } else {
      // Insert new document
      const [result] = await db.insert(driverDocuments).values({
        applicationId: application[0].id,
        userId: ctx.user.id,
        documentType: input.documentType,
        documentUrl: url,
        documentKey: fileKey,
        fileName: input.fileName,
        fileSize: fileBuffer.length,
        mimeType: input.mimeType,
        expiryDate: input.expiryDate,
        verificationStatus: "pending",
      });
      
      return {
        success: true,
        documentId: result.insertId,
        documentUrl: url,
        verificationStatus: "pending" as const,
      };
    }
  }),
```

**Error Handling:**
- `NOT_FOUND`: Application doesn't exist
- `BAD_REQUEST`: File too large, invalid MIME type, or application already submitted
- `INTERNAL_SERVER_ERROR`: S3 upload failed

#### 1.3 Check Pi Network KYC Status

**Procedure:** `driver.checkPiKycStatus`

**Purpose:** Query Pi Network API to check user's KYC verification status.

**Input Schema:**
```typescript
// No input required - uses authenticated user's Pi account
```

**Output Schema:**
```typescript
{
  kycStatus: "verified" | "unverified" | "pending";
  kycUrl?: string; // URL to complete KYC if unverified
  checkedAt: Date;
}
```

**Implementation:**
```typescript
checkPiKycStatus: protectedProcedure
  .mutation(async ({ ctx }) => {
    // TODO: Integrate with Pi Network KYC API
    // For now, return mock data
    const kycStatus = "unverified"; // Replace with actual API call
    
    // Update application with KYC status
    await db.update(driverApplications)
      .set({
        piKycStatus: kycStatus,
        piKycCheckedAt: new Date(),
      })
      .where(eq(driverApplications.userId, ctx.user.id));
    
    return {
      kycStatus,
      kycUrl: kycStatus !== "verified" ? "https://kyc.pi.network" : undefined,
      checkedAt: new Date(),
    };
  }),
```

#### 1.4 Submit Application

**Procedure:** `driver.submitApplication`

**Purpose:** Submit completed application for admin review. Validates that all required documents are uploaded and Pi KYC is verified.

**Input Schema:**
```typescript
// No input required - submits the user's draft application
```

**Output Schema:**
```typescript
{
  success: boolean;
  applicationId: number;
  status: "submitted";
  submittedAt: Date;
}
```

**Implementation:**
```typescript
submitApplication: protectedProcedure
  .mutation(async ({ ctx }) => {
    // Get application
    const application = await db.select()
      .from(driverApplications)
      .where(eq(driverApplications.userId, ctx.user.id))
      .limit(1);
    
    if (application.length === 0) {
      throw new TRPCError({ 
        code: 'NOT_FOUND', 
        message: 'Driver application not found.' 
      });
    }
    
    if (application[0].status !== "draft") {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Application has already been submitted.' 
      });
    }
    
    // Validate Pi KYC status
    if (application[0].piKycStatus !== "verified") {
      throw new TRPCError({ 
        code: 'PRECONDITION_FAILED', 
        message: 'Pi Network KYC verification is required before submitting application.' 
      });
    }
    
    // Check required documents
    const documents = await db.select()
      .from(driverDocuments)
      .where(eq(driverDocuments.applicationId, application[0].id));
    
    const requiredTypes = ["license", "insurance", "registration"];
    const uploadedTypes = documents.map(d => d.documentType);
    const missingTypes = requiredTypes.filter(t => !uploadedTypes.includes(t));
    
    if (missingTypes.length > 0) {
      throw new TRPCError({ 
        code: 'PRECONDITION_FAILED', 
        message: `Missing required documents: ${missingTypes.join(', ')}` 
      });
    }
    
    // Submit application
    const submittedAt = new Date();
    await db.update(driverApplications)
      .set({
        status: "submitted",
        submittedAt,
        updatedAt: submittedAt,
      })
      .where(eq(driverApplications.id, application[0].id));
    
    // TODO: Send notification to admins
    
    return {
      success: true,
      applicationId: application[0].id,
      status: "submitted" as const,
      submittedAt,
    };
  }),
```

**Error Handling:**
- `NOT_FOUND`: Application doesn't exist
- `BAD_REQUEST`: Application already submitted
- `PRECONDITION_FAILED`: Missing KYC verification or required documents

#### 1.5 Get My Application

**Procedure:** `driver.getMyApplication`

**Purpose:** Retrieve the authenticated user's driver application with all documents and status.

**Input Schema:**
```typescript
// No input required
```

**Output Schema:**
```typescript
{
  application: DriverApplication | null;
  documents: DriverDocument[];
  missingDocuments: string[]; // Array of document types not yet uploaded
}
```

**Implementation:**
```typescript
getMyApplication: protectedProcedure
  .query(async ({ ctx }) => {
    const application = await db.select()
      .from(driverApplications)
      .where(eq(driverApplications.userId, ctx.user.id))
      .limit(1);
    
    if (application.length === 0) {
      return {
        application: null,
        documents: [],
        missingDocuments: ["license", "insurance", "registration"],
      };
    }
    
    const documents = await db.select()
      .from(driverDocuments)
      .where(eq(driverDocuments.applicationId, application[0].id));
    
    const requiredTypes = ["license", "insurance", "registration"];
    const uploadedTypes = documents.map(d => d.documentType);
    const missingDocuments = requiredTypes.filter(t => !uploadedTypes.includes(t));
    
    return {
      application: application[0],
      documents,
      missingDocuments,
    };
  }),
```

### 2. Admin Verification Endpoints

All admin verification endpoints are grouped under the `admin` router namespace and require admin role.

#### 2.1 Get Pending Applications

**Procedure:** `admin.getPendingApplications`

**Purpose:** Retrieve list of all applications awaiting admin review.

**Input Schema:**
```typescript
const getPendingApplicationsInput = z.object({
  status: z.enum(["submitted", "under_review", "all"]).default("submitted"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
```

**Output Schema:**
```typescript
{
  applications: Array<{
    application: DriverApplication;
    documents: DriverDocument[];
    user: Pick<User, "id" | "name" | "email">;
  }>;
  total: number;
}
```

**Implementation:**
```typescript
admin: router({
  getPendingApplications: adminProcedure
    .input(getPendingApplicationsInput)
    .query(async ({ input }) => {
      const whereClause = input.status === "all" 
        ? notInArray(driverApplications.status, ["draft", "approved", "rejected"])
        : eq(driverApplications.status, input.status);
      
      const applications = await db.select()
        .from(driverApplications)
        .where(whereClause)
        .orderBy(desc(driverApplications.submittedAt))
        .limit(input.limit)
        .offset(input.offset);
      
      const total = await db.select({ count: count() })
        .from(driverApplications)
        .where(whereClause);
      
      // Fetch documents and user info for each application
      const result = await Promise.all(
        applications.map(async (app) => {
          const documents = await db.select()
            .from(driverDocuments)
            .where(eq(driverDocuments.applicationId, app.id));
          
          const user = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, app.userId))
          .limit(1);
          
          return {
            application: app,
            documents,
            user: user[0],
          };
        })
      );
      
      return {
        applications: result,
        total: total[0].count,
      };
    }),
});
```

#### 2.2 Review Application

**Procedure:** `admin.reviewApplication`

**Purpose:** Approve or reject a driver application with optional notes.

**Input Schema:**
```typescript
const reviewApplicationInput = z.object({
  applicationId: z.number().int(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().max(1000).optional(),
});
```

**Output Schema:**
```typescript
{
  success: boolean;
  applicationId: number;
  status: "approved" | "rejected";
  driverId?: number; // Only present if approved
}
```

**Implementation:**
```typescript
reviewApplication: adminProcedure
  .input(reviewApplicationInput)
  .mutation(async ({ input, ctx }) => {
    const application = await db.select()
      .from(driverApplications)
      .where(eq(driverApplications.id, input.applicationId))
      .limit(1);
    
    if (application.length === 0) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Application not found' });
    }
    
    if (!["submitted", "under_review"].includes(application[0].status)) {
      throw new TRPCError({ 
        code: 'BAD_REQUEST', 
        message: 'Application has already been reviewed' 
      });
    }
    
    const now = new Date();
    const newStatus = input.action === "approve" ? "approved" : "rejected";
    
    // Update application status
    await db.update(driverApplications)
      .set({
        status: newStatus,
        reviewedBy: ctx.user.id,
        reviewedAt: now,
        reviewNotes: input.notes,
        approvedAt: input.action === "approve" ? now : null,
        rejectedAt: input.action === "reject" ? now : null,
        updatedAt: now,
      })
      .where(eq(driverApplications.id, input.applicationId));
    
    let driverId: number | undefined;
    
    // If approved, create driver profile
    if (input.action === "approve") {
      const [result] = await db.insert(drivers).values({
        userId: application[0].userId,
        vehicleMake: application[0].vehicleMake,
        vehicleModel: application[0].vehicleModel,
        vehicleYear: application[0].vehicleYear,
        vehicleColor: application[0].vehicleColor,
        licensePlate: application[0].licensePlate,
        passengerCapacity: application[0].passengerCapacity,
        verificationStatus: "verified",
        verifiedAt: now,
        isAvailable: false,
      });
      
      driverId = result.insertId;
    }
    
    // Send notification to applicant
    await notifyOwner({
      title: `Driver Application ${input.action === "approve" ? "Approved" : "Rejected"}`,
      content: `Application #${input.applicationId} has been ${newStatus}. ${input.notes || ''}`,
    });
    
    // Log admin action
    await db.insert(adminActions).values({
      adminId: ctx.user.id,
      actionType: `${input.action}_driver_application`,
      entityType: "driver_application",
      entityId: input.applicationId,
      notes: input.notes,
    });
    
    return {
      success: true,
      applicationId: input.applicationId,
      status: newStatus,
      driverId,
    };
  }),
```

**Error Handling:**
- `NOT_FOUND`: Application doesn't exist
- `BAD_REQUEST`: Application already reviewed
- `INTERNAL_SERVER_ERROR`: Failed to create driver profile

---

## Component Architecture

### 1. Driver Application Page

**Route:** `/driver/apply`

**Purpose:** Multi-step form for drivers to submit application with document uploads.

**Component Hierarchy:**

```
DriverApplicationPage
├── ApplicationHeader
│   ├── Title
│   └── StatusBadge (if application exists)
├── ProgressStepper
│   ├── Step 1: Personal Info
│   ├── Step 2: Vehicle Info
│   ├── Step 3: Pi KYC Verification
│   ├── Step 4: Document Upload
│   └── Step 5: Review & Submit
├── StepContent
│   ├── Step1PersonalInfo
│   │   ├── FullNameInput
│   │   ├── EmailInput (pre-filled from auth)
│   │   └── PhoneNumberInput
│   ├── Step2VehicleInfo
│   │   ├── VehicleMakeInput
│   │   ├── VehicleModelInput
│   │   ├── VehicleYearSelect
│   │   ├── VehicleColorInput
│   │   ├── LicensePlateInput
│   │   └── PassengerCapacitySelect
│   ├── Step3PiKYC
│   │   ├── KYCStatusDisplay
│   │   ├── KYCVerifiedBadge (if verified)
│   │   ├── KYCUnverifiedMessage (if not verified)
│   │   └── CheckKYCButton
│   ├── Step4Documents
│   │   ├── DocumentUploader (License)
│   │   │   ├── FileDropzone
│   │   │   ├── FilePreview
│   │   │   ├── UploadProgress
│   │   │   ├── ExpiryDateInput
│   │   │   └── UploadButton
│   │   ├── DocumentUploader (Insurance)
│   │   ├── DocumentUploader (Registration)
│   │   ├── DocumentUploader (Vehicle Photo - optional)
│   │   └── DocumentUploader (Profile Photo - optional)
│   └── Step5Review
│       ├── PersonalInfoSummary
│       ├── VehicleInfoSummary
│       ├── KYCStatusSummary
│       ├── DocumentChecklist
│       └── SubmitButton
└── NavigationButtons
    ├── BackButton
    └── NextButton (or SubmitButton on last step)
```

**State Management:**

```typescript
interface ApplicationState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    capacity: number;
  };
  piKyc: {
    status: "verified" | "unverified" | "pending" | null;
    checkedAt: Date | null;
  };
  documents: {
    license: { uploaded: boolean; url?: string; expiryDate?: Date };
    insurance: { uploaded: boolean; url?: string; expiryDate?: Date };
    registration: { uploaded: boolean; url?: string };
    vehiclePhoto: { uploaded: boolean; url?: string };
    profilePhoto: { uploaded: boolean; url?: string };
  };
  isSubmitting: boolean;
  errors: Record<string, string>;
}
```

**Validation Rules:**

| Field | Rule | Error Message |
|-------|------|---------------|
| fullName | Min 2 chars, max 255 | "Full name must be between 2 and 255 characters" |
| email | Valid email format | "Please enter a valid email address" |
| phoneNumber | E.164 format | "Please enter a valid phone number (e.g., +12025551234)" |
| vehicleMake | Min 2 chars, max 100 | "Vehicle make must be between 2 and 100 characters" |
| vehicleModel | Min 2 chars, max 100 | "Vehicle model must be between 2 and 100 characters" |
| vehicleYear | 1990 to current year + 1 | "Vehicle year must be between 1990 and {currentYear + 1}" |
| vehicleColor | Min 2 chars, max 50 | "Vehicle color must be between 2 and 50 characters" |
| licensePlate | Min 2 chars, max 20, uppercase | "License plate must be between 2 and 20 characters" |
| passengerCapacity | 1 to 8 | "Passenger capacity must be between 1 and 8" |
| document file size | Max 10MB | "File size must not exceed 10MB" |
| document file type | JPEG, PNG, WebP, PDF | "File must be JPEG, PNG, WebP, or PDF" |
| license expiryDate | Future date | "License expiry date must be in the future" |
| insurance expiryDate | Future date | "Insurance expiry date must be in the future" |

**Key Interactions:**

1. **Auto-save Draft:** Form automatically saves progress every 30 seconds or when user navigates between steps using `driver.saveDraftApplication`.

2. **Step Navigation:** User can only proceed to next step if current step is valid. Back button always available except on first step.

3. **Pi KYC Check:** When user reaches Step 3, automatically check KYC status. If unverified, show prominent message with link to complete KYC. Provide "Recheck Status" button.

4. **Document Upload:** Drag-and-drop or click to browse. Show upload progress bar. Display preview thumbnail after upload. Allow replacement before submission.

5. **Review Step:** Display all entered information in read-only format. Show green checkmarks for completed sections. Highlight any missing required items in red.

6. **Submit:** Validate all requirements (KYC verified, all documents uploaded). Show confirmation dialog. On success, redirect to driver dashboard with success message.

**Error Handling:**

- **Network Errors:** Show toast notification with retry button. Don't lose form data.
- **Validation Errors:** Show inline error messages below each field. Prevent navigation to next step.
- **Upload Failures:** Show error message with retry button. Allow user to select different file.
- **Submission Failures:** Show detailed error message explaining what went wrong. Allow user to fix and resubmit.

### 2. Admin Verification Dashboard

**Route:** `/admin/verification`

**Purpose:** Admin interface for reviewing and approving/rejecting driver applications.

**Component Hierarchy:**

```
AdminVerificationPage
├── PageHeader
│   ├── Title
│   └── Stats (Total Pending, Reviewed Today, Avg Review Time)
├── FilterBar
│   ├── StatusFilter (All / Submitted / Under Review)
│   ├── DateRangeFilter
│   └── SearchInput (by name, email, license plate)
├── ApplicationList
│   └── ApplicationCard (for each application)
│       ├── ApplicantHeader
│       │   ├── ApplicantName
│       │   ├── ApplicantEmail
│       │   ├── ApplicantPhone
│       │   ├── PiKYCBadge
│       │   └── SubmittedDate
│       ├── VehicleInfo
│       │   ├── VehicleDetails (Make, Model, Year, Color)
│       │   └── LicensePlate
│       ├── DocumentGrid
│       │   ├── DocumentThumbnail (License) - clickable
│       │   ├── DocumentThumbnail (Insurance) - clickable
│       │   ├── DocumentThumbnail (Registration) - clickable
│       │   ├── DocumentThumbnail (Vehicle Photo) - clickable
│       │   └── DocumentThumbnail (Profile Photo) - clickable
│       ├── ActionButtons
│       │   ├── ViewDetailsButton
│       │   ├── ApproveButton (green)
│       │   └── RejectButton (red)
│       └── StatusBadge (if under review)
├── DocumentModal (when thumbnail clicked)
│   ├── FullSizeImage/PDF
│   ├── DocumentInfo
│   │   ├── DocumentType
│   │   ├── UploadDate
│   │   ├── FileSize
│   │   └── ExpiryDate (if applicable)
│   ├── ZoomControls
│   └── CloseButton
└── ReviewModal (when Approve/Reject clicked)
    ├── ApplicationSummary
    ├── ActionConfirmation ("Are you sure you want to approve/reject?")
    ├── NotesTextarea (optional for approve, required for reject)
    └── ConfirmButton

```

**State Management:**

```typescript
interface AdminVerificationState {
  applications: Array<{
    application: DriverApplication;
    documents: DriverDocument[];
    user: { id: number; name: string; email: string };
  }>;
  filters: {
    status: "submitted" | "under_review" | "all";
    dateRange: { start: Date | null; end: Date | null };
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  selectedApplication: number | null;
  selectedDocument: DriverDocument | null;
  reviewModal: {
    open: boolean;
    applicationId: number | null;
    action: "approve" | "reject" | null;
    notes: string;
  };
  isLoading: boolean;
}
```

**Key Interactions:**

1. **Load Applications:** On mount, fetch pending applications using `admin.getPendingApplications`. Show loading skeleton.

2. **Filter Applications:** When filter changes, refetch with new parameters. Update URL query params for bookmarking.

3. **View Document:** Click thumbnail to open full-size modal. Support zoom in/out for images. PDF viewer for PDF documents.

4. **Approve Application:** Click Approve → Open review modal → Enter optional notes → Confirm → Call `admin.reviewApplication` → Show success toast → Remove from list.

5. **Reject Application:** Click Reject → Open review modal → Enter required rejection reason → Confirm → Call `admin.reviewApplication` → Show success toast → Remove from list.

6. **Pagination:** Load more button at bottom. Infinite scroll optional.

**Error Handling:**

- **Load Failures:** Show error message with retry button.
- **Review Failures:** Show error toast. Keep modal open so admin can retry.
- **Document Load Failures:** Show placeholder image with error message.

---

## File Upload & Security

### 1. File Upload Flow

The file upload process follows a secure pattern that prevents direct client-to-S3 uploads and ensures all files are validated server-side.

**Client-Side Flow:**

```typescript
// 1. User selects file
const handleFileSelect = async (file: File, documentType: string) => {
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File size must not exceed 10MB");
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    toast.error("File must be JPEG, PNG, WebP, or PDF");
    return;
  }
  
  // Convert to base64
  const base64 = await fileToBase64(file);
  
  // Upload via tRPC
  const result = await trpc.driver.uploadDocument.mutate({
    documentType,
    fileData: base64,
    fileName: file.name,
    mimeType: file.type,
    expiryDate: documentType === 'license' || documentType === 'insurance' 
      ? expiryDate 
      : undefined,
  });
  
  // Update UI with uploaded document
  setDocuments(prev => ({
    ...prev,
    [documentType]: {
      uploaded: true,
      url: result.documentUrl,
    },
  }));
  
  toast.success("Document uploaded successfully");
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

**Server-Side Flow:**

```typescript
// 1. Receive base64 file data
// 2. Decode to buffer
const fileBuffer = Buffer.from(input.fileData, 'base64');

// 3. Validate file size server-side (defense in depth)
if (fileBuffer.length > 10 * 1024 * 1024) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'File size exceeds 10MB limit' });
}

// 4. Validate MIME type server-side
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
if (!allowedTypes.includes(input.mimeType)) {
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid file type' });
}

// 5. Generate secure S3 key with random suffix
const randomSuffix = Math.random().toString(36).substring(2, 15);
const fileExtension = input.fileName.split('.').pop();
const fileKey = `driver-documents/${applicationId}/${input.documentType}-${randomSuffix}.${fileExtension}`;

// 6. Upload to S3
const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

// 7. Store metadata in database
await db.insert(driverDocuments).values({...});
```

### 2. Security Requirements

**File Validation:**

| Check | Client-Side | Server-Side | Purpose |
|-------|-------------|-------------|---------|
| File size ≤ 10MB | ✅ | ✅ | Prevent DoS via large uploads |
| MIME type in whitelist | ✅ | ✅ | Prevent malicious file types |
| File extension matches MIME | ❌ | ✅ | Prevent MIME type spoofing |
| Random suffix in S3 key | N/A | ✅ | Prevent enumeration attacks |
| Application ownership | N/A | ✅ | Prevent unauthorized uploads |

**S3 Bucket Configuration:**

```json
{
  "bucket": "openride-driver-documents",
  "region": "us-east-1",
  "acl": "public-read",
  "cors": [
    {
      "allowedOrigins": ["https://openride.com"],
      "allowedMethods": ["GET"],
      "allowedHeaders": ["*"]
    }
  ],
  "lifecycle": {
    "rules": [
      {
        "id": "delete-rejected-applications",
        "status": "Enabled",
        "expiration": {
          "days": 90
        },
        "filter": {
          "prefix": "driver-documents/"
        }
      }
    ]
  }
}
```

**File Naming Convention:**

```
driver-documents/{applicationId}/{documentType}-{randomSuffix}.{extension}

Examples:
driver-documents/123/license-a8f3k2j9d.jpg
driver-documents/123/insurance-x7m2p4n1q.pdf
driver-documents/456/registration-b9g5h8k3l.png
```

**Access Control:**

- **Public Read:** Document URLs are publicly accessible (required for admin review)
- **Write:** Only server can write via API key
- **Delete:** Only server can delete (when application is rejected or expired)
- **Enumeration Prevention:** Random suffixes prevent guessing document URLs

### 3. File Size Limits

| Document Type | Max Size | Recommended Size | Format |
|---------------|----------|------------------|--------|
| Driver License | 10 MB | 2-5 MB | JPEG, PNG, PDF |
| Insurance | 10 MB | 2-5 MB | PDF preferred |
| Registration | 10 MB | 2-5 MB | PDF preferred |
| Vehicle Photo | 10 MB | 2-5 MB | JPEG, PNG, WebP |
| Profile Photo | 10 MB | 1-3 MB | JPEG, PNG, WebP |

**Compression Recommendations:**

- Images should be compressed to balance quality and file size
- Recommended resolution: 1920x1080 for photos, 300 DPI for scanned documents
- Client-side compression optional but recommended for mobile uploads

---

## Pi Network KYC Integration

### 1. Pi Network KYC Overview

Pi Network provides a KYC (Know Your Customer) verification system that has already verified millions of users globally. OpenRide integrates with this system to streamline driver verification and reduce fraud.

**Benefits:**
- Reduces verification friction (no need to re-verify identity)
- Leverages Pi's existing trust network
- Enables seamless Pi payment integration
- Reduces administrative burden on OpenRide

### 2. KYC Integration Flow

```
User starts driver application
    ↓
Step 3: Check Pi KYC Status
    ↓
Call trpc.driver.checkPiKycStatus()
    ↓
Server queries Pi Network API
    ↓
┌─────────────────────────────────┐
│ KYC Status Response             │
├─────────────────────────────────┤
│ • verified: User is KYC verified│
│ • unverified: User needs KYC    │
│ • pending: KYC in progress      │
└─────────────────────────────────┘
    ↓
Update application.piKycStatus
    ↓
Display status to user
    ↓
If unverified: Show KYC completion link
If verified: Allow proceeding to document upload
If pending: Show "Check back later" message
```

### 3. Pi Network API Integration

**Endpoint:** `GET https://api.pi.network/v2/kyc/{user_id}/status`

**Authentication:** Bearer token (Pi API key)

**Request:**
```typescript
const response = await fetch(`https://api.pi.network/v2/kyc/${piUserId}/status`, {
  headers: {
    'Authorization': `Bearer ${process.env.PI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
```

**Response:**
```json
{
  "user_id": "pi_user_123",
  "kyc_status": "verified",
  "verified_at": "2024-01-15T10:30:00Z",
  "kyc_level": "full"
}
```

**Status Mapping:**

| Pi Network Status | OpenRide Status | User Action |
|-------------------|-----------------|-------------|
| `verified` | `verified` | Can proceed |
| `unverified` | `unverified` | Must complete KYC |
| `pending` | `pending` | Wait for approval |
| `rejected` | `unverified` | Must reapply |

### 4. Implementation Details

**Environment Variables:**
```bash
PI_API_KEY=your_pi_api_key_here
PI_KYC_URL=https://api.pi.network/v2/kyc
```

**Server Implementation:**
```typescript
import { env } from "./_core/env";

async function checkPiKycStatus(piUserId: string): Promise<{
  kycStatus: "verified" | "unverified" | "pending";
  verifiedAt?: Date;
}> {
  try {
    const response = await fetch(`${env.PI_KYC_URL}/${piUserId}/status`, {
      headers: {
        'Authorization': `Bearer ${env.PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Pi KYC API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      kycStatus: data.kyc_status === "verified" ? "verified" : 
                 data.kyc_status === "pending" ? "pending" : "unverified",
      verifiedAt: data.verified_at ? new Date(data.verified_at) : undefined,
    };
  } catch (error) {
    console.error("Failed to check Pi KYC status:", error);
    // Fail open: allow application to proceed but flag for manual review
    return { kycStatus: "unverified" };
  }
}
```

**Client UI:**

```typescript
// Step 3: Pi KYC Verification
const PiKYCStep = () => {
  const checkKyc = trpc.driver.checkPiKycStatus.useMutation();
  const { data: application } = trpc.driver.getMyApplication.useQuery();
  
  const handleCheckKyc = async () => {
    const result = await checkKyc.mutateAsync();
    if (result.kycStatus === "verified") {
      toast.success("Pi KYC verified! You can proceed to document upload.");
    } else if (result.kycStatus === "pending") {
      toast.info("Your Pi KYC is pending approval. Check back later.");
    } else {
      toast.warning("Pi KYC not verified. Please complete KYC to continue.");
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Pi Network KYC Verification</h2>
      
      {application?.application?.piKycStatus === "verified" ? (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">KYC Verified</p>
            <p className="text-sm text-green-700">
              Your identity has been verified through Pi Network.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-semibold text-yellow-900">KYC Verification Required</p>
            <p className="text-sm text-yellow-700 mt-1">
              To ensure safety and trust, all drivers must complete Pi Network KYC verification.
              This is a one-time process that typically takes 1-2 business days.
            </p>
          </div>
          
          <Button onClick={handleCheckKyc} disabled={checkKyc.isPending}>
            {checkKyc.isPending ? "Checking..." : "Check KYC Status"}
          </Button>
          
          {application?.application?.piKycStatus === "unverified" && (
            <a 
              href="https://kyc.pi.network" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              Complete Pi KYC <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Notification System

### 1. Notification Requirements

The system must send notifications to drivers when their application status changes. Notifications should be delivered through the built-in OpenRide notification system (using `notifyOwner` helper).

**Notification Triggers:**

| Event | Recipient | Title | Content |
|-------|-----------|-------|---------|
| Application Submitted | Admins | "New Driver Application" | "New application from {name} ({email})" |
| Application Approved | Driver | "Application Approved!" | "Congratulations! Your driver application has been approved. You can now start accepting rides." |
| Application Rejected | Driver | "Application Update" | "Your driver application requires attention. Reason: {reason}" |
| Document Rejected | Driver | "Document Verification Failed" | "Your {documentType} was rejected. Reason: {reason}. Please upload a new document." |

### 2. Implementation

**Server-Side Notification:**

```typescript
import { notifyOwner } from "./_core/notification";

// After admin approves application
await notifyOwner({
  title: "Application Approved!",
  content: `Congratulations! Your driver application has been approved. You can now start accepting rides.`,
});

// After admin rejects application
await notifyOwner({
  title: "Application Update",
  content: `Your driver application requires attention. Reason: ${input.notes || 'Please contact support for details.'}`,
});
```

**Client-Side Notification Display:**

```typescript
// In driver dashboard
const { data: notifications } = trpc.system.getNotifications.useQuery();

return (
  <div className="space-y-4">
    {notifications?.map(notification => (
      <div key={notification.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900">{notification.title}</h3>
        <p className="text-sm text-blue-700 mt-1">{notification.content}</p>
        <p className="text-xs text-blue-600 mt-2">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    ))}
  </div>
);
```

---

## Test Plan

### 1. Unit Tests

Unit tests validate individual functions and procedures in isolation.

**Test File:** `server/driver-application.test.ts`

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Driver Application Tests", () => {
  let ctx: TrpcContext;
  
  beforeEach(() => {
    ctx = createAuthContext('user');
  });
  
  describe("AC-2.1: Submit application with all required fields", () => {
    it("should save draft application with valid data", async () => {
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.driver.saveDraftApplication({
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "+12025551234",
        vehicleMake: "Toyota",
        vehicleModel: "Camry",
        vehicleYear: 2020,
        vehicleColor: "Silver",
        licensePlate: "ABC123",
        passengerCapacity: 4,
      });
      
      expect(result.success).toBe(true);
      expect(result.status).toBe("draft");
      expect(result.applicationId).toBeGreaterThan(0);
    });
    
    it("should reject invalid phone number format", async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.driver.saveDraftApplication({
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber: "invalid",
          vehicleMake: "Toyota",
          vehicleModel: "Camry",
          vehicleYear: 2020,
          vehicleColor: "Silver",
          licensePlate: "ABC123",
          passengerCapacity: 4,
        })
      ).rejects.toThrow();
    });
    
    it("should reject vehicle year before 1990", async () => {
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.driver.saveDraftApplication({
          fullName: "John Doe",
          email: "john@example.com",
          phoneNumber: "+12025551234",
          vehicleMake: "Toyota",
          vehicleModel: "Camry",
          vehicleYear: 1985,
          vehicleColor: "Silver",
          licensePlate: "ABC123",
          passengerCapacity: 4,
        })
      ).rejects.toThrow();
    });
  });
  
  describe("AC-2.2: Validate required documents", () => {
    it("should reject submission without required documents", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Save draft first
      await caller.driver.saveDraftApplication({...});
      
      // Try to submit without documents
      await expect(
        caller.driver.submitApplication()
      ).rejects.toThrow("Missing required documents");
    });
    
    it("should accept submission with all required documents", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Save draft
      await caller.driver.saveDraftApplication({...});
      
      // Upload required documents
      await caller.driver.uploadDocument({
        documentType: "license",
        fileData: "base64data",
        fileName: "license.jpg",
        mimeType: "image/jpeg",
      });
      
      await caller.driver.uploadDocument({
        documentType: "insurance",
        fileData: "base64data",
        fileName: "insurance.pdf",
        mimeType: "application/pdf",
      });
      
      await caller.driver.uploadDocument({
        documentType: "registration",
        fileData: "base64data",
        fileName: "registration.pdf",
        mimeType: "application/pdf",
      });
      
      // Submit should succeed
      const result = await caller.driver.submitApplication();
      expect(result.success).toBe(true);
      expect(result.status).toBe("submitted");
    });
  });
  
  describe("AC-2.3: Pi Network KYC status check", () => {
    it("should check and store Pi KYC status", async () => {
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.driver.checkPiKycStatus();
      
      expect(result.kycStatus).toBeOneOf(["verified", "unverified", "pending"]);
      expect(result.checkedAt).toBeInstanceOf(Date);
    });
    
    it("should reject submission without KYC verification", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Save draft and upload documents
      await caller.driver.saveDraftApplication({...});
      await uploadAllDocuments(caller);
      
      // Mock unverified KYC status
      // (In real test, mock Pi API response)
      
      await expect(
        caller.driver.submitApplication()
      ).rejects.toThrow("Pi Network KYC verification is required");
    });
  });
  
  describe("AC-2.4: Admin review pending applications", () => {
    it("should return list of pending applications", async () => {
      const adminCtx = createAuthContext('admin');
      const caller = appRouter.createCaller(adminCtx);
      
      const result = await caller.admin.getPendingApplications({
        status: "submitted",
        limit: 20,
        offset: 0,
      });
      
      expect(result.applications).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
    
    it("should deny access to non-admin users", async () => {
      const userCtx = createAuthContext('user');
      const caller = appRouter.createCaller(userCtx);
      
      await expect(
        caller.admin.getPendingApplications({
          status: "submitted",
          limit: 20,
          offset: 0,
        })
      ).rejects.toThrow("FORBIDDEN");
    });
  });
  
  describe("AC-2.5: Admin approve/reject applications", () => {
    it("should approve application and create driver profile", async () => {
      const adminCtx = createAuthContext('admin');
      const caller = appRouter.createCaller(adminCtx);
      
      // Create and submit application first
      const userCaller = appRouter.createCaller(ctx);
      await userCaller.driver.saveDraftApplication({...});
      await uploadAllDocuments(userCaller);
      await userCaller.driver.submitApplication();
      
      // Get application ID
      const { application } = await userCaller.driver.getMyApplication();
      
      // Admin approves
      const result = await caller.admin.reviewApplication({
        applicationId: application!.id,
        action: "approve",
        notes: "All documents verified",
      });
      
      expect(result.success).toBe(true);
      expect(result.status).toBe("approved");
      expect(result.driverId).toBeGreaterThan(0);
    });
    
    it("should reject application with reason", async () => {
      const adminCtx = createAuthContext('admin');
      const caller = appRouter.createCaller(adminCtx);
      
      // Create and submit application first
      const userCaller = appRouter.createCaller(ctx);
      await userCaller.driver.saveDraftApplication({...});
      await uploadAllDocuments(userCaller);
      await userCaller.driver.submitApplication();
      
      // Get application ID
      const { application } = await userCaller.driver.getMyApplication();
      
      // Admin rejects
      const result = await caller.admin.reviewApplication({
        applicationId: application!.id,
        action: "reject",
        notes: "License photo is blurry",
      });
      
      expect(result.success).toBe(true);
      expect(result.status).toBe("rejected");
      expect(result.driverId).toBeUndefined();
    });
  });
  
  describe("AC-2.6: Driver receives notification", () => {
    it("should send notification on approval", async () => {
      // Test notification system integration
      // Mock notifyOwner function and verify it's called
    });
    
    it("should send notification on rejection", async () => {
      // Test notification system integration
    });
  });
  
  describe("AC-2.7: Only verified drivers can toggle availability", () => {
    it("should allow verified driver to go online", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Assume driver is verified
      const result = await caller.driver.toggleAvailability({ available: true });
      
      expect(result.success).toBe(true);
      expect(result.isAvailable).toBe(true);
    });
    
    it("should prevent unverified driver from going online", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Assume driver is not verified
      await expect(
        caller.driver.toggleAvailability({ available: true })
      ).rejects.toThrow("Driver verification required");
    });
  });
  
  describe("AC-2.8: Unverified drivers see clear message", () => {
    it("should return verification status in driver profile", async () => {
      const caller = appRouter.createCaller(ctx);
      
      const profile = await caller.driver.getMyProfile();
      
      expect(profile).toHaveProperty("verificationStatus");
      expect(profile?.verificationStatus).toBeOneOf(["pending", "verified", "rejected"]);
    });
  });
});
```

### 2. Integration Tests

Integration tests validate end-to-end workflows using Playwright.

**Test File:** `tests/driver-application.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Driver Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular user
    await page.goto('/');
    await page.click('text=Login');
    // Complete OAuth flow
  });
  
  test('AC-2.1: Complete driver application with all fields', async ({ page }) => {
    // Navigate to driver application
    await page.goto('/driver/apply');
    
    // Step 1: Personal Info
    await page.fill('input[name="fullName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phoneNumber"]', '+12025551234');
    await page.click('button:has-text("Next")');
    
    // Step 2: Vehicle Info
    await page.fill('input[name="vehicleMake"]', 'Toyota');
    await page.fill('input[name="vehicleModel"]', 'Camry');
    await page.selectOption('select[name="vehicleYear"]', '2020');
    await page.fill('input[name="vehicleColor"]', 'Silver');
    await page.fill('input[name="licensePlate"]', 'ABC123');
    await page.selectOption('select[name="passengerCapacity"]', '4');
    await page.click('button:has-text("Next")');
    
    // Verify we're on Step 3
    await expect(page.locator('h2:has-text("Pi Network KYC")')).toBeVisible();
  });
  
  test('AC-2.2: Upload required documents', async ({ page }) => {
    // Navigate to document upload step
    await page.goto('/driver/apply');
    await completeSteps1And2(page);
    await completeStep3PiKYC(page);
    
    // Step 4: Upload Documents
    await expect(page.locator('h2:has-text("Upload Documents")')).toBeVisible();
    
    // Upload license
    await page.setInputFiles('input[data-document-type="license"]', 'tests/fixtures/license.jpg');
    await expect(page.locator('text=license.jpg')).toBeVisible();
    
    // Upload insurance
    await page.setInputFiles('input[data-document-type="insurance"]', 'tests/fixtures/insurance.pdf');
    await expect(page.locator('text=insurance.pdf')).toBeVisible();
    
    // Upload registration
    await page.setInputFiles('input[data-document-type="registration"]', 'tests/fixtures/registration.pdf');
    await expect(page.locator('text=registration.pdf')).toBeVisible();
    
    // Next button should be enabled
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
    await page.click('button:has-text("Next")');
    
    // Verify we're on Review step
    await expect(page.locator('h2:has-text("Review")')).toBeVisible();
  });
  
  test('AC-2.3: Pi KYC status displayed', async ({ page }) => {
    await page.goto('/driver/apply');
    await completeSteps1And2(page);
    
    // Step 3: Pi KYC
    await page.click('button:has-text("Check KYC Status")');
    
    // Wait for status to load
    await page.waitForSelector('[data-testid="kyc-status"]');
    
    // Verify status badge is visible
    const statusBadge = page.locator('[data-testid="kyc-status"]');
    await expect(statusBadge).toBeVisible();
    
    // Status should be one of: verified, unverified, pending
    const statusText = await statusBadge.textContent();
    expect(['verified', 'unverified', 'pending'].some(s => statusText?.toLowerCase().includes(s))).toBeTruthy();
  });
  
  test('AC-2.4: Admin can view pending applications', async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
    
    // Navigate to verification dashboard
    await page.goto('/admin/verification');
    
    // Verify page loaded
    await expect(page.locator('h1:has-text("Driver Verification")')).toBeVisible();
    
    // Check if applications are displayed
    const applicationCards = page.locator('[data-testid="application-card"]');
    const count = await applicationCards.count();
    
    if (count > 0) {
      // Verify first application has required info
      const firstCard = applicationCards.first();
      await expect(firstCard.locator('[data-testid="applicant-name"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="applicant-email"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="vehicle-info"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="document-thumbnail"]')).toHaveCount(3); // license, insurance, registration
    }
  });
  
  test('AC-2.5: Admin can approve application', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/verification');
    
    // Click approve on first application
    const firstCard = page.locator('[data-testid="application-card"]').first();
    await firstCard.locator('button:has-text("Approve")').click();
    
    // Review modal should open
    await expect(page.locator('[data-testid="review-modal"]')).toBeVisible();
    
    // Enter optional notes
    await page.fill('textarea[name="notes"]', 'All documents verified');
    
    // Confirm approval
    await page.click('button:has-text("Confirm Approval")');
    
    // Success toast should appear
    await expect(page.locator('text=Application approved successfully')).toBeVisible();
    
    // Application should be removed from list
    await expect(firstCard).not.toBeVisible();
  });
  
  test('AC-2.6: Driver receives notification on approval', async ({ page }) => {
    // Submit application as driver
    await page.goto('/driver/apply');
    await completeApplicationAndSubmit(page);
    
    // Admin approves (in separate session)
    await approveApplicationAsAdmin(page);
    
    // Navigate to driver dashboard
    await page.goto('/driver/dashboard');
    
    // Check for notification
    await expect(page.locator('text=Application Approved')).toBeVisible();
  });
  
  test('AC-2.7: Verified driver can toggle availability', async ({ page }) => {
    // Assume driver is verified
    await page.goto('/driver/dashboard');
    
    // Toggle availability switch
    const availabilityToggle = page.locator('input[data-testid="availability-toggle"]');
    await availabilityToggle.click();
    
    // Verify toggle is on
    await expect(availabilityToggle).toBeChecked();
    
    // Status should show "Available"
    await expect(page.locator('text=Available')).toBeVisible();
  });
  
  test('AC-2.8: Unverified driver sees verification message', async ({ page }) => {
    // Assume driver is not verified
    await page.goto('/driver/dashboard');
    
    // Verification message should be visible
    await expect(page.locator('text=Verification Pending')).toBeVisible();
    await expect(page.locator('text=Your application is under review')).toBeVisible();
    
    // Availability toggle should be disabled
    const availabilityToggle = page.locator('input[data-testid="availability-toggle"]');
    await expect(availabilityToggle).toBeDisabled();
  });
});
```

### 3. Test Coverage Goals

| Acceptance Criterion | Unit Tests | Integration Tests | Total Tests |
|---------------------|------------|-------------------|-------------|
| AC-2.1: Submit application | 3 | 1 | 4 |
| AC-2.2: Validate documents | 2 | 1 | 3 |
| AC-2.3: Pi KYC status | 2 | 1 | 3 |
| AC-2.4: Admin review | 2 | 1 | 3 |
| AC-2.5: Approve/reject | 2 | 1 | 3 |
| AC-2.6: Notifications | 2 | 1 | 3 |
| AC-2.7: Availability toggle | 2 | 1 | 3 |
| AC-2.8: Verification message | 1 | 1 | 2 |
| **Total** | **16** | **8** | **24** |

**Coverage Target:** 100% of acceptance criteria

---

## Implementation Checklist

### Phase 1: Database & Schema (Day 1)

- [ ] Create `driver_applications` table schema in `drizzle/schema.ts`
- [ ] Create `driver_documents` table schema (if not exists)
- [ ] Add indexes for performance
- [ ] Run `pnpm db:push` to apply migrations
- [ ] Verify tables created in database

### Phase 2: API Endpoints (Day 1-2)

- [ ] Create `server/driver-routers.ts` file
- [ ] Implement `driver.saveDraftApplication` procedure
- [ ] Implement `driver.uploadDocument` procedure
- [ ] Implement `driver.checkPiKycStatus` procedure
- [ ] Implement `driver.submitApplication` procedure
- [ ] Implement `driver.getMyApplication` procedure
- [ ] Create `server/admin-routers.ts` file (if not exists)
- [ ] Implement `admin.getPendingApplications` procedure
- [ ] Implement `admin.reviewApplication` procedure
- [ ] Add routers to `server/routers.ts`

### Phase 3: Frontend Components (Day 2-3)

- [ ] Create `pages/DriverApplication.tsx` component
- [ ] Implement Step 1: Personal Info form
- [ ] Implement Step 2: Vehicle Info form
- [ ] Implement Step 3: Pi KYC verification
- [ ] Implement Step 4: Document upload with drag-and-drop
- [ ] Implement Step 5: Review and submit
- [ ] Add form validation for all fields
- [ ] Add auto-save draft functionality
- [ ] Create `pages/AdminVerification.tsx` component
- [ ] Implement application list with filters
- [ ] Implement document viewer modal
- [ ] Implement review modal (approve/reject)
- [ ] Add pagination

### Phase 4: Testing (Day 3-4)

- [ ] Write 16 unit tests in `server/driver-application.test.ts`
- [ ] Write 8 integration tests in `tests/driver-application.spec.ts`
- [ ] Run all tests and ensure 100% pass rate
- [ ] Fix any failing tests
- [ ] Generate test coverage report
- [ ] Verify 100% acceptance criteria coverage

### Phase 5: Integration & Polish (Day 4)

- [ ] Test Pi Network KYC integration with real API
- [ ] Test S3 file uploads with real bucket
- [ ] Test notification system
- [ ] Add loading states and error handling
- [ ] Add success/error toast messages
- [ ] Test on mobile devices
- [ ] Fix any UI/UX issues
- [ ] Update documentation

### Phase 6: Deployment (Day 4)

- [ ] Create checkpoint with all changes
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Mark all Phase 1A tasks complete in todo.md

---

## Appendix

### A. Error Codes Reference

| Code | Description | User Action |
|------|-------------|-------------|
| `NOT_FOUND` | Application not found | Create new application |
| `BAD_REQUEST` | Invalid input data | Fix validation errors |
| `CONFLICT` | License plate already exists | Use different plate |
| `PRECONDITION_FAILED` | Missing KYC or documents | Complete requirements |
| `FORBIDDEN` | Insufficient permissions | Contact admin |
| `INTERNAL_SERVER_ERROR` | Server error | Retry or contact support |

### B. Database Indexes

```sql
-- driver_applications
CREATE INDEX idx_driver_applications_user_id ON driver_applications(user_id);
CREATE INDEX idx_driver_applications_status ON driver_applications(status);
CREATE INDEX idx_driver_applications_submitted_at ON driver_applications(submitted_at);
CREATE INDEX idx_driver_applications_license_plate ON driver_applications(license_plate);

-- driver_documents
CREATE INDEX idx_driver_documents_application_id ON driver_documents(application_id);
CREATE INDEX idx_driver_documents_user_id ON driver_documents(user_id);
CREATE INDEX idx_driver_documents_type_status ON driver_documents(document_type, verification_status);
```

### C. Environment Variables

```bash
# Pi Network Integration
PI_API_KEY=your_pi_api_key_here
PI_KYC_URL=https://api.pi.network/v2/kyc

# S3 Storage (already configured)
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=openride-driver-documents
```

---

**End of Specification Document**

This document provides complete specifications for implementing Phase 1A: Driver Application & Verification. All requirements, designs, APIs, components, security patterns, and test plans are documented in detail. Implementation can begin immediately following this specification.
