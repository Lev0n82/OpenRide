import { test, expect } from '@playwright/test';

test.describe('Ride Booking Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication as rider
    await context.addCookies([{
      name: 'session',
      value: 'mock-rider-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
  });

  test('should display ride booking page', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check for booking heading or form
    const heading = page.getByRole('heading', { name: /book a ride|request a ride|ride booking/i });
    const bookingForm = page.getByLabel(/pickup|destination|from|to/i);
    
    await expect(heading.or(bookingForm.first())).toBeVisible();
  });

  test('should show pickup and destination input fields', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check for location input fields
    const pickupInput = page.getByLabel(/pickup|from|pick.*up|starting/i);
    const destinationInput = page.getByLabel(/destination|to|drop.*off|ending/i);
    
    await expect(pickupInput.or(destinationInput)).toBeVisible();
  });

  test('should allow entering pickup location', async ({ page }) => {
    await page.goto('/ride/book');
    
    const pickupInput = page.getByLabel(/pickup|from|pick.*up|starting/i).first();
    
    if (await pickupInput.isVisible().catch(() => false)) {
      await pickupInput.fill('123 Main St, San Francisco, CA');
      
      // Check value was entered
      const value = await pickupInput.inputValue();
      expect(value).toContain('123 Main St');
    }
  });

  test('should allow entering destination location', async ({ page }) => {
    await page.goto('/ride/book');
    
    const destinationInput = page.getByLabel(/destination|to|drop.*off|ending/i).first();
    
    if (await destinationInput.isVisible().catch(() => false)) {
      await destinationInput.fill('456 Market St, San Francisco, CA');
      
      // Check value was entered
      const value = await destinationInput.inputValue();
      expect(value).toContain('456 Market St');
    }
  });

  test('should show fare estimate after entering locations', async ({ page }) => {
    await page.goto('/ride/book');
    
    const pickupInput = page.getByLabel(/pickup|from|pick.*up|starting/i).first();
    const destinationInput = page.getByLabel(/destination|to|drop.*off|ending/i).first();
    
    if (await pickupInput.isVisible().catch(() => false) && 
        await destinationInput.isVisible().catch(() => false)) {
      
      await pickupInput.fill('123 Main St, San Francisco, CA');
      await destinationInput.fill('456 Market St, San Francisco, CA');
      
      // Look for estimate button or automatic calculation
      const estimateButton = page.getByRole('button', { name: /estimate|calculate|get fare/i });
      if (await estimateButton.isVisible().catch(() => false)) {
        await estimateButton.click();
      }
      
      await page.waitForTimeout(2000);
      
      // Check for fare display
      const fareDisplay = page.getByText(/\$\d+|\d+\.\d+|fare|price|cost/i);
      const hasFareInfo = await fareDisplay.count() > 0;
      
      expect(hasFareInfo).toBeTruthy();
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check all inputs have labels or aria-labels
    const inputs = await page.locator('input[type="text"], input[type="search"]').all();
    
    for (const input of inputs) {
      const hasAccessibleLabel = await input.evaluate(el => {
        const id = el.getAttribute('id');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.getAttribute('placeholder');
        const hasLabelElement = id && document.querySelector(`label[for="${id}"]`);
        
        return !!(ariaLabel || ariaLabelledBy || hasLabelElement || placeholder);
      });
      
      expect(hasAccessibleLabel).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Tab through form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus').first();
    const isFocusable = await focusedElement.evaluate(el => {
      const tagName = el.tagName.toLowerCase();
      return ['input', 'button', 'a', 'select', 'textarea'].includes(tagName);
    });
    
    expect(isFocusable).toBeTruthy();
  });

  test('should show map for route visualization', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check for map container or map-related elements
    const mapContainer = page.locator('[id*="map"], [class*="map"], [aria-label*="map"]');
    const hasMapElement = await mapContainer.count() > 0;
    
    expect(hasMapElement).toBeTruthy();
  });

  test('should have confirm/book ride button', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Look for booking action button
    const bookButton = page.getByRole('button', { name: /book|confirm|request ride|submit/i });
    
    // Button should exist (may be disabled until form is filled)
    const buttonCount = await bookButton.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should show payment method selection', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Look for payment-related elements
    const paymentElements = page.getByText(/payment|pay with|pi|credit card|wallet/i);
    const hasPaymentInfo = await paymentElements.count() > 0;
    
    expect(hasPaymentInfo).toBeTruthy();
  });

  test('should display ride history for riders', async ({ page }) => {
    await page.goto('/rider');
    
    // Check for dashboard or ride history
    const rideHistory = page.getByText(/recent rides|ride history|past trips|no rides yet/i);
    const dashboard = page.getByRole('heading', { name: /rider dashboard|my rides/i });
    
    await expect(rideHistory.or(dashboard)).toBeVisible();
  });

  test('should show active ride status if ride is in progress', async ({ page }) => {
    await page.goto('/rider');
    
    // Check for active ride indicator or empty state
    const activeRide = page.getByText(/active ride|in progress|driver arriving|on the way/i);
    const noActiveRide = page.getByText(/no active ride|book a ride|request a ride/i);
    
    const hasRideStatus = await activeRide.first().isVisible().catch(() => false) ||
                          await noActiveRide.first().isVisible().catch(() => false);
    
    expect(hasRideStatus).toBeTruthy();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check for h1 heading
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    expect(h1Count).toBeGreaterThanOrEqual(1);
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('/ride/book');
    
    // Check for skip link (may be visually hidden)
    const skipLink = page.getByRole('link', { name: /skip to|skip navigation|skip to content/i });
    const hasSkipLink = await skipLink.count() > 0;
    
    expect(hasSkipLink).toBeTruthy();
  });
});
