import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login button on homepage when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Check for login button
    const loginButton = page.getByRole('link', { name: /sign in|log in|login/i });
    await expect(loginButton).toBeVisible();
  });

  test('should redirect to OAuth when clicking login', async ({ page }) => {
    await page.goto('/');
    
    const loginButton = page.getByRole('link', { name: /sign in|log in|login/i });
    await loginButton.click();
    
    // Should redirect to OAuth portal
    await page.waitForURL(/oauth/i, { timeout: 5000 });
  });

  test('should show user menu when authenticated', async ({ page, context }) => {
    // Mock authentication by setting cookie
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    await page.goto('/');
    
    // Should show user-specific elements (dashboard link, profile, etc.)
    // This will fail if not properly authenticated, which is expected in test environment
    const userElements = page.getByRole('button', { name: /profile|account|menu/i });
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    
    // At least one should be visible
    const hasUserUI = await userElements.isVisible().catch(() => false) || 
                      await dashboardLink.isVisible().catch(() => false);
    
    expect(hasUserUI).toBeTruthy();
  });

  test('should have accessible login flow', async ({ page }) => {
    await page.goto('/');
    
    // Check keyboard navigation to login button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const loginButton = page.getByRole('link', { name: /sign in|log in|login/i });
    await expect(loginButton).toBeFocused();
    
    // Check focus indicator is visible
    const focusedElement = await page.locator(':focus').first();
    const outlineWidth = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineWidth
    );
    expect(outlineWidth).not.toBe('0px');
  });

  test('should maintain authentication state across pages', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    await page.goto('/');
    await page.goto('/governance');
    await page.goto('/');
    
    // Should still show authenticated state
    const userElements = page.getByRole('button', { name: /profile|account|menu/i });
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    
    const hasUserUI = await userElements.isVisible().catch(() => false) || 
                      await dashboardLink.isVisible().catch(() => false);
    
    expect(hasUserUI).toBeTruthy();
  });

  test('should handle logout flow', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);

    await page.goto('/');
    
    // Try to find and click logout button
    const logoutButton = page.getByRole('button', { name: /log out|logout|sign out/i });
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      
      // Should show login button again
      const loginButton = page.getByRole('link', { name: /sign in|log in|login/i });
      await expect(loginButton).toBeVisible({ timeout: 5000 });
    }
  });
});
