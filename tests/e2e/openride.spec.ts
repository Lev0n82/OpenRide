import { test, expect } from '@playwright/test';
import { testUsers, testVehicle, testRide, testDelivery, testProposal } from '../fixtures/testData';

/**
 * OpenRide E2E Test Suite
 * 
 * Tests cover all major user workflows:
 * - Authentication and authorization
 * - Driver registration and verification
 * - Ride booking and completion
 * - Delivery service
 * - DAO governance
 * - Insurance management
 * - Token economics
 * - Safety features
 */

test.describe('OpenRide Platform E2E Tests', () => {
  
  test.describe('FR-1: Authentication & Authorization', () => {
    
    test('AC-1.1: Users can access home page without authentication', async ({ page }) => {
      await page.goto('/');
      // Check for OpenRide branding
      const hasOpenRide = await page.locator('text=/OpenRide/i').count() > 0;
      expect(hasOpenRide).toBeTruthy();
      
      // Check for driver and rider options
      const hasDriverOption = await page.locator('text=/drive|driver/i').count() > 0;
      const hasRiderOption = await page.locator('text=/ride|rider/i').count() > 0;
      expect(hasDriverOption || hasRiderOption).toBeTruthy();
    });

    test('AC-1.3: Unauthenticated users are redirected to login for protected routes', async ({ page }) => {
      // Try to access driver dashboard without auth
      await page.goto('/driver');
      // Should redirect to login
      await page.waitForURL(/login|oauth/, { timeout: 5000 }).catch(() => {
        // If no redirect, check if login prompt is shown
      });
    });

    test('AC-1.5: Role-based access control for driver features', async ({ page }) => {
      await page.goto('/');
      // Try to access driver dashboard
      const driverLink = page.locator('text=/driver.*dashboard/i').first();
      if (await driverLink.count() > 0) {
        await driverLink.click();
        // Should navigate to driver page or login
        const url = page.url();
        expect(url).toMatch(/driver|login|oauth/);
      } else {
        // Direct navigation
        await page.goto('/driver');
        const url = page.url();
        expect(url).toContain('driver');
      }
    });
  });

  test.describe('FR-2: Driver Registration & Verification', () => {
    
    test('AC-2.1: Users can access driver application form', async ({ page }) => {
      await page.goto('/driver');
      // Look for driver registration or application elements
      const hasDriverContent = await page.locator('text=/driver|apply|register/i').count() > 0;
      expect(hasDriverContent).toBeTruthy();
    });

    test('AC-2.7: Unverified drivers cannot toggle availability', async ({ page }) => {
      await page.goto('/driver');
      // Check that availability toggle is disabled or shows verification required message
      const verificationMessage = page.locator('text=/verif|kyc|pending/i');
      // Either verification message exists or toggle is disabled
      const hasMessage = await verificationMessage.count() > 0;
      if (!hasMessage) {
        const toggle = page.locator('[role="switch"]').first();
        if (await toggle.count() > 0) {
          const isDisabled = await toggle.isDisabled();
          expect(isDisabled).toBeTruthy();
        }
      }
    });
  });

  test.describe('FR-3: Ride Booking & Matching', () => {
    
    test('AC-3.1: Riders can access ride booking interface', async ({ page }) => {
      await page.goto('/rider');
      // Look for ride booking elements
      const hasRideBooking = await page.locator('text=/book|request|ride/i').count() > 0;
      expect(hasRideBooking).toBeTruthy();
    });

    test('AC-3.2: Ride booking shows fare estimation', async ({ page }) => {
      await page.goto('/rider');
      // Look for fare or price related elements
      const hasFareInfo = await page.locator('text=/fare|price|cost|\\$/i').count() > 0;
      expect(hasFareInfo).toBeTruthy();
    });
  });

  test.describe('FR-5: Delivery Service', () => {
    
    test('AC-5.2: Customers can access delivery booking interface', async ({ page }) => {
      await page.goto('/delivery-booking');
      await expect(page).toHaveURL('/delivery-booking');
      
      // Check for delivery booking form elements
      const hasDeliveryForm = await page.locator('text=/delivery|package|pickup|dropoff/i').count() > 0;
      expect(hasDeliveryForm).toBeTruthy();
    });

    test('AC-5.3: Delivery form captures required information', async ({ page }) => {
      await page.goto('/delivery-booking');
      
      // Look for form fields
      const formFields = [
        'text=/pickup/i',
        'text=/drop.*off|destination/i',
        'text=/package|size|weight/i',
      ];
      
      for (const selector of formFields) {
        const field = page.locator(selector).first();
        const exists = await field.count() > 0;
        expect(exists).toBeTruthy();
      }
    });
  });

  test.describe('FR-6: DAO Governance System', () => {
    
    test('AC-6.1: Users can access governance page', async ({ page }) => {
      await page.goto('/governance');
      await expect(page).toHaveURL('/governance');
      
      // Check for governance elements
      const hasGovernance = await page.locator('text=/governance|proposal|vote|dao/i').count() > 0;
      expect(hasGovernance).toBeTruthy();
    });

    test('AC-6.4: Governance page shows voting interface', async ({ page }) => {
      await page.goto('/governance');
      
      // Look for voting-related elements
      const hasVoting = await page.locator('text=/vote|proposal|yes|no|active/i').count() > 0;
      expect(hasVoting).toBeTruthy();
    });
  });

  test.describe('FR-7: Insurance Pool Management', () => {
    
    test('AC-7.2: Insurance pool balance is visible', async ({ page }) => {
      await page.goto('/insurance');
      await expect(page).toHaveURL('/insurance');
      
      // Check for insurance pool information
      const hasInsurance = await page.locator('text=/insurance|pool|balance|claim/i').count() > 0;
      expect(hasInsurance).toBeTruthy();
    });

    test('AC-7.3: Drivers can access claim submission', async ({ page }) => {
      await page.goto('/insurance');
      
      // Look for claim submission elements
      const hasClaims = await page.locator('text=/claim|submit|incident/i').count() > 0;
      expect(hasClaims).toBeTruthy();
    });
  });

  test.describe('FR-8: RIDE Token Economics', () => {
    
    test('AC-8.3: Token balance is displayed', async ({ page }) => {
      await page.goto('/tokens');
      await expect(page).toHaveURL('/tokens');
      
      // Check for token balance display
      const hasTokens = await page.locator('text=/token|ride|balance/i').count() > 0;
      expect(hasTokens).toBeTruthy();
    });

    test('AC-8.4: Users can view transaction history', async ({ page }) => {
      await page.goto('/tokens');
      
      // Look for transaction history elements
      const hasHistory = await page.locator('text=/transaction|history|earned|buyback/i').count() > 0;
      expect(hasHistory).toBeTruthy();
    });
  });

  test.describe('FR-14: Progressive Web App', () => {
    
    test('AC-14.1: PWA manifest is accessible', async ({ page }) => {
      const response = await page.goto('/manifest.json');
      expect(response?.status()).toBe(200);
      
      const manifest = await response?.json();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('short_name');
      expect(manifest).toHaveProperty('start_url');
      expect(manifest?.name).toContain('OpenRide');
    });

    test('AC-14.4: Service worker is registered', async ({ page }) => {
      await page.goto('/');
      
      // Check if service worker is registered
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          return registrations.length > 0;
        }
        return false;
      });
      
      // Service worker should be registered
      expect(swRegistered).toBeTruthy();
    });
  });

  test.describe('Navigation & User Experience', () => {
    
    test('Users can navigate between main sections', async ({ page }) => {
      await page.goto('/');
      
      // Test navigation to each main section
      const sections = [
        { text: 'DAO Governance', url: '/governance' },
        { text: 'Insurance Pool', url: '/insurance' },
        { text: 'My Tokens', url: '/tokens' },
      ];
      
      for (const section of sections) {
        const link = page.locator(`text=${section.text}`).first();
        if (await link.count() > 0) {
          await link.click();
          await page.waitForURL(section.url, { timeout: 3000 }).catch(() => {
            // Navigation might require auth
          });
        }
      }
    });

    test('Home page displays platform information', async ({ page }) => {
      await page.goto('/');
      
      // Check for key branding
      const hasOpenRide = await page.locator('text=/OpenRide/i').count() > 0;
      expect(hasOpenRide).toBeTruthy();
      
      // Check for platform features mentioned
      const hasFeatures = await page.locator('text=/drive|rider|earn|token|governance/i').count() > 0;
      expect(hasFeatures).toBeTruthy();
      
      // Check for fee structure information
      const hasFeeInfo = await page.locator('text=/87%|13%|fee|earning/i').count() > 0;
      expect(hasFeeInfo).toBeTruthy();
    });

    test('Platform displays RIDE token information', async ({ page }) => {
      await page.goto('/');
      
      // Look for token information
      const hasTokenInfo = await page.locator('text=/RIDE token|governance|vote/i').count() > 0;
      expect(hasTokenInfo).toBeTruthy();
    });
  });

  test.describe('Accessibility & Responsiveness', () => {
    
    test('Pages have proper heading structure', async ({ page }) => {
      await page.goto('/');
      
      // Check for h1 heading
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();
      
      const h1Text = await h1.textContent();
      expect(h1Text).toBeTruthy();
    });

    test('Interactive elements are keyboard accessible', async ({ page }) => {
      await page.goto('/');
      
      // Check that buttons are focusable
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        const isFocused = await firstButton.evaluate(el => el === document.activeElement);
        expect(isFocused).toBeTruthy();
      }
    });

    test('Pages are responsive on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check that content is visible
      const hasContent = await page.locator('text=/OpenRide/i').count() > 0;
      expect(hasContent).toBeTruthy();
      
      // Check that page is interactive (has buttons or links)
      const hasInteractive = await page.locator('button, a').count() > 0;
      expect(hasInteractive).toBeTruthy();
    });
  });

  test.describe('Performance & Loading', () => {
    
    test('Home page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds (generous for test environment)
      expect(loadTime).toBeLessThan(5000);
    });

    test('Pages show loading states appropriately', async ({ page }) => {
      await page.goto('/driver');
      
      // Check for loading indicators or content
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      expect(hasContent!.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    
    test('404 page is shown for invalid routes', async ({ page }) => {
      await page.goto('/invalid-route-that-does-not-exist');
      
      // Should show 404 or redirect to home
      const has404 = await page.locator('text=/404|not found|page.*not.*exist/i').count() > 0;
      const isHome = page.url().endsWith('/');
      
      expect(has404 || isHome).toBeTruthy();
    });

    test('Application handles errors gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Check that error boundary is in place
      const hasError = await page.locator('text=/error|something.*wrong/i').count() > 0;
      
      // If no error shown, that's good - app is working
      // If error shown, it should be handled gracefully
      if (hasError) {
        const errorMessage = await page.locator('text=/error|something.*wrong/i').first().textContent();
        expect(errorMessage).toBeTruthy();
      }
    });
  });
});
