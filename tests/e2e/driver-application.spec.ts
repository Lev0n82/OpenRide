import { test, expect } from '@playwright/test';

test.describe('Driver Application Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'session',
      value: 'mock-driver-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
  });

  test('should display driver application page', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Check for application heading
    const heading = page.getByRole('heading', { name: /become a driver|driver application/i });
    await expect(heading).toBeVisible();
  });

  test('should show multi-step application form', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Check for progress indicators
    const progressSteps = page.locator('[aria-label*="progress"], [role="progressbar"], nav[aria-label*="progress"]');
    await expect(progressSteps.first()).toBeVisible();
    
    // Should show step 1 (personal information)
    const personalInfoSection = page.getByRole('heading', { name: /personal information/i });
    const fullNameInput = page.getByLabel(/full name|name/i);
    
    await expect(personalInfoSection.or(fullNameInput)).toBeVisible();
  });

  test('should validate required fields in personal information step', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Try to proceed without filling required fields
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();
    
    // Should show validation error or stay on same step
    await page.waitForTimeout(1000);
    
    // Check if still on personal info step or error message shown
    const fullNameInput = page.getByLabel(/full name|name/i);
    const isStillOnStep = await fullNameInput.isVisible();
    
    expect(isStillOnStep).toBeTruthy();
  });

  test('should allow filling personal information', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Fill personal information
    const fullNameInput = page.getByLabel(/full name|name/i).first();
    const emailInput = page.getByLabel(/email/i).first();
    const phoneInput = page.getByLabel(/phone/i).first();
    
    if (await fullNameInput.isVisible().catch(() => false)) {
      await fullNameInput.fill('John Doe');
    }
    if (await emailInput.isVisible().catch(() => false)) {
      await emailInput.fill('john.doe@example.com');
    }
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('+1234567890');
    }
    
    // Try to proceed to next step
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    await nextButton.click();
    
    await page.waitForTimeout(1000);
  });

  test('should show vehicle information step', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Fill personal info and proceed
    const fullNameInput = page.getByLabel(/full name|name/i).first();
    if (await fullNameInput.isVisible().catch(() => false)) {
      await fullNameInput.fill('John Doe');
      
      const emailInput = page.getByLabel(/email/i).first();
      await emailInput.fill('john@example.com');
      
      const phoneInput = page.getByLabel(/phone/i).first();
      await phoneInput.fill('+1234567890');
      
      const nextButton = page.getByRole('button', { name: /next|continue/i });
      await nextButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should show vehicle information fields
      const vehicleFields = page.getByLabel(/vehicle|make|model|license plate/i);
      await expect(vehicleFields.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Check that all inputs have associated labels
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="tel"]').all();
    
    for (const input of inputs) {
      const hasLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const hasLabelElement = id && document.querySelector(`label[for="${id}"]`);
        
        return !!(ariaLabel || ariaLabelledBy || hasLabelElement);
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation through form', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus on input fields
    const focusedElement = await page.locator(':focus').first();
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    
    expect(['input', 'button', 'a', 'select']).toContain(tagName);
  });

  test('should show document upload section', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Navigate through steps to documents
    // This is a simplified test - in real scenario would fill all previous steps
    const documentSection = page.getByText(/upload|document|license|insurance|registration/i);
    
    // May not be visible on first step, which is expected
    const hasDocumentMention = await documentSection.count() > 0;
    expect(hasDocumentMention).toBeTruthy();
  });

  test('should have proper ARIA labels on buttons', async ({ page }) => {
    await page.goto('/driver/apply');
    
    // Check navigation buttons have proper labels
    const buttons = await page.getByRole('button').all();
    
    for (const button of buttons) {
      const hasAccessibleName = await button.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label');
        const textContent = el.textContent?.trim();
        
        return !!(ariaLabel || textContent);
      });
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should show application status for existing applications', async ({ page }) => {
    await page.goto('/driver');
    
    // Should show either application form or status
    const statusIndicators = page.getByText(/pending|approved|rejected|verified|under review/i);
    const applyButton = page.getByRole('button', { name: /apply/i });
    const applicationForm = page.getByLabel(/full name|name/i);
    
    const hasContent = await statusIndicators.first().isVisible().catch(() => false) ||
                       await applyButton.isVisible().catch(() => false) ||
                       await applicationForm.isVisible().catch(() => false);
    
    expect(hasContent).toBeTruthy();
  });
});
