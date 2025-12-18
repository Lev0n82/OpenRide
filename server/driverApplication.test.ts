import { describe, it, expect, beforeAll } from 'vitest';
import { createCaller } from './_core/trpc';
import type { Context } from './_core/context';

describe('Driver Application API', () => {
  let userContext: Context;
  let adminContext: Context;
  
  beforeAll(() => {
    // Mock user context
    userContext = {
      user: {
        id: 1,
        openId: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        loginMethod: 'google',
        phoneNumber: null,
        profilePhoto: null,
        rideTokenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    
    // Mock admin context
    adminContext = {
      user: {
        id: 2,
        openId: 'admin-user-456',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        loginMethod: 'google',
        phoneNumber: null,
        profilePhoto: null,
        rideTokenBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
  });
  
  describe('saveDraftApplication', () => {
    it('should save draft application with personal info', async () => {
      const caller = createCaller(userContext);
      
      const result = await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      expect(result.success).toBe(true);
      expect(result.applicationId).toBeDefined();
    });
    
    it('should update existing draft application', async () => {
      const caller = createCaller(userContext);
      
      // First save
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      // Update with vehicle info
      const result = await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2020,
        vehicleColor: 'Silver',
        licensePlate: 'ABC123',
        passengerCapacity: 4,
      });
      
      expect(result.success).toBe(true);
    });
    
    it('should require authentication', async () => {
      const caller = createCaller({ ...userContext, user: null });
      
      await expect(
        caller.driverApplication.saveDraftApplication({
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
        })
      ).rejects.toThrow();
    });
  });
  
  describe('uploadDocument', () => {
    it('should upload driver license document', async () => {
      const caller = createCaller(userContext);
      
      // First create draft application
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      // Upload document
      const fakeFileData = Buffer.from('fake-image-data').toString('base64');
      const result = await caller.driverApplication.uploadDocument({
        documentType: 'license',
        fileData: fakeFileData,
        fileName: 'license.jpg',
        mimeType: 'image/jpeg',
      });
      
      expect(result.success).toBe(true);
      expect(result.fileUrl).toBeDefined();
      expect(result.fileUrl).toContain('license');
    });
    
    it('should reject invalid file types', async () => {
      const caller = createCaller(userContext);
      
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      const fakeFileData = Buffer.from('fake-file-data').toString('base64');
      
      await expect(
        caller.driverApplication.uploadDocument({
          documentType: 'license',
          fileData: fakeFileData,
          fileName: 'document.txt',
          mimeType: 'text/plain',
        })
      ).rejects.toThrow('Invalid file type');
    });
    
    it('should reject files over 10MB', async () => {
      const caller = createCaller(userContext);
      
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      // Create a large fake file (>10MB)
      const largeFileData = Buffer.alloc(11 * 1024 * 1024).toString('base64');
      
      await expect(
        caller.driverApplication.uploadDocument({
          documentType: 'license',
          fileData: largeFileData,
          fileName: 'large-file.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow('File size exceeds 10MB limit');
    });
  });
  
  describe('checkPiKycStatus', () => {
    it('should return pending status for new applications', async () => {
      const caller = createCaller(userContext);
      
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      const result = await caller.driverApplication.checkPiKycStatus();
      
      expect(result.kycStatus).toBe('pending');
      expect(result.message).toContain('KYC verification');
    });
  });
  
  describe('submitApplication', () => {
    it('should submit complete application', async () => {
      const caller = createCaller(userContext);
      
      // Create complete application
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        vehicleMake: 'Toyota',
        vehicleModel: 'Camry',
        vehicleYear: 2020,
        vehicleColor: 'Silver',
        licensePlate: 'ABC123',
        passengerCapacity: 4,
      });
      
      // Upload all required documents
      const fakeFileData = Buffer.from('fake-image-data').toString('base64');
      await caller.driverApplication.uploadDocument({
        documentType: 'license',
        fileData: fakeFileData,
        fileName: 'license.jpg',
        mimeType: 'image/jpeg',
      });
      await caller.driverApplication.uploadDocument({
        documentType: 'insurance',
        fileData: fakeFileData,
        fileName: 'insurance.jpg',
        mimeType: 'image/jpeg',
      });
      await caller.driverApplication.uploadDocument({
        documentType: 'registration',
        fileData: fakeFileData,
        fileName: 'registration.jpg',
        mimeType: 'image/jpeg',
      });
      
      // Note: In real scenario, KYC would need to be verified
      // For testing, we'll need to mock the KYC status
      
      const result = await caller.driverApplication.submitApplication();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('submitted');
    });
    
    it('should reject incomplete applications', async () => {
      const caller = createCaller(userContext);
      
      // Create incomplete application (missing vehicle info)
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      await expect(
        caller.driverApplication.submitApplication()
      ).rejects.toThrow();
    });
  });
  
  describe('getMyApplication', () => {
    it('should return user application', async () => {
      const caller = createCaller(userContext);
      
      await caller.driverApplication.saveDraftApplication({
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      });
      
      const result = await caller.driverApplication.getMyApplication();
      
      expect(result.application).toBeDefined();
      expect(result.application?.fullName).toBe('John Doe');
    });
    
    it('should return null for users without applications', async () => {
      const newUserContext = {
        ...userContext,
        user: { ...userContext.user!, id: 999 },
      };
      const caller = createCaller(newUserContext);
      
      const result = await caller.driverApplication.getMyApplication();
      
      expect(result.application).toBeNull();
    });
  });
  
  describe('Admin endpoints', () => {
    describe('getPendingApplications', () => {
      it('should return pending applications for admins', async () => {
        const caller = createCaller(adminContext);
        
        const result = await caller.driverApplication.getPendingApplications();
        
        expect(Array.isArray(result.applications)).toBe(true);
      });
      
      it('should reject non-admin users', async () => {
        const caller = createCaller(userContext);
        
        await expect(
          caller.driverApplication.getPendingApplications()
        ).rejects.toThrow('FORBIDDEN');
      });
    });
    
    describe('reviewApplication', () => {
      it('should approve application', async () => {
        const userCaller = createCaller(userContext);
        const adminCaller = createCaller(adminContext);
        
        // Create and submit application
        await userCaller.driverApplication.saveDraftApplication({
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
          vehicleMake: 'Toyota',
          vehicleModel: 'Camry',
          vehicleYear: 2020,
          vehicleColor: 'Silver',
          licensePlate: 'ABC123',
          passengerCapacity: 4,
        });
        
        const fakeFileData = Buffer.from('fake-image-data').toString('base64');
        await userCaller.driverApplication.uploadDocument({
          documentType: 'license',
          fileData: fakeFileData,
          fileName: 'license.jpg',
          mimeType: 'image/jpeg',
        });
        await userCaller.driverApplication.uploadDocument({
          documentType: 'insurance',
          fileData: fakeFileData,
          fileName: 'insurance.jpg',
          mimeType: 'image/jpeg',
        });
        await userCaller.driverApplication.uploadDocument({
          documentType: 'registration',
          fileData: fakeFileData,
          fileName: 'registration.jpg',
          mimeType: 'image/jpeg',
        });
        
        await userCaller.driverApplication.submitApplication();
        
        // Get application ID
        const app = await userCaller.driverApplication.getMyApplication();
        
        // Admin approves
        const result = await adminCaller.driverApplication.reviewApplication({
          applicationId: app.application!.id,
          action: 'approve',
        });
        
        expect(result.success).toBe(true);
        expect(result.message).toContain('approved');
      });
      
      it('should reject application with reason', async () => {
        const userCaller = createCaller(userContext);
        const adminCaller = createCaller(adminContext);
        
        // Create and submit application
        await userCaller.driverApplication.saveDraftApplication({
          fullName: 'Jane Doe',
          email: 'jane@example.com',
          phoneNumber: '+1234567890',
          vehicleMake: 'Honda',
          vehicleModel: 'Civic',
          vehicleYear: 2019,
          vehicleColor: 'Blue',
          licensePlate: 'XYZ789',
          passengerCapacity: 4,
        });
        
        const fakeFileData = Buffer.from('fake-image-data').toString('base64');
        await userCaller.driverApplication.uploadDocument({
          documentType: 'license',
          fileData: fakeFileData,
          fileName: 'license.jpg',
          mimeType: 'image/jpeg',
        });
        await userCaller.driverApplication.uploadDocument({
          documentType: 'insurance',
          fileData: fakeFileData,
          fileName: 'insurance.jpg',
          mimeType: 'image/jpeg',
        });
        await userCaller.driverApplication.uploadDocument({
          documentType: 'registration',
          fileData: fakeFileData,
          fileName: 'registration.jpg',
          mimeType: 'image/jpeg',
        });
        
        await userCaller.driverApplication.submitApplication();
        
        const app = await userCaller.driverApplication.getMyApplication();
        
        // Admin rejects
        const result = await adminCaller.driverApplication.reviewApplication({
          applicationId: app.application!.id,
          action: 'reject',
          rejectionReason: 'Documents are not clear',
        });
        
        expect(result.success).toBe(true);
        expect(result.message).toContain('rejected');
      });
      
      it('should reject non-admin users', async () => {
        const caller = createCaller(userContext);
        
        await expect(
          caller.driverApplication.reviewApplication({
            applicationId: 1,
            action: 'approve',
          })
        ).rejects.toThrow('FORBIDDEN');
      });
    });
  });
});
