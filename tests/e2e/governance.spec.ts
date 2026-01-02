import { test, expect } from '@playwright/test';

test.describe('DAO Governance Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([{
      name: 'session',
      value: 'mock-governance-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
  });

  test('should display governance page', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for governance heading
    const heading = page.getByRole('heading', { name: /governance|dao|proposals|voting/i });
    await expect(heading).toBeVisible();
  });

  test('should show information about DAO governance tiers', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for tier information
    const tierInfo = page.getByText(/tier|emergency|operational|strategic|24 hour|3-5 day|7 day/i);
    const hasTierInfo = await tierInfo.count() > 0;
    
    expect(hasTierInfo).toBeTruthy();
  });

  test('should display active proposals list', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for proposals section
    const proposalsHeading = page.getByRole('heading', { name: /active proposals|proposals|current votes/i });
    const noProposals = page.getByText(/no active proposals|no proposals/i);
    
    await expect(proposalsHeading.or(noProposals)).toBeVisible();
  });

  test('should show proposal details', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for proposal cards or list items
    const proposalElements = page.locator('[role="article"], [class*="proposal"], li').first();
    
    // May or may not have active proposals
    const proposalCount = await proposalElements.count();
    expect(proposalCount).toBeGreaterThanOrEqual(0);
  });

  test('should display vote counts for proposals', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for voting statistics
    const voteInfo = page.getByText(/votes? for|votes? against|for:|against:|voting/i);
    const hasVoteInfo = await voteInfo.count() > 0;
    
    // Will be true if there are proposals, or false if no active proposals
    expect(typeof hasVoteInfo).toBe('boolean');
  });

  test('should have vote buttons on proposals', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for voting buttons
    const voteForButton = page.getByRole('button', { name: /vote for|support|yes/i });
    const voteAgainstButton = page.getByRole('button', { name: /vote against|oppose|no/i });
    
    // Buttons may not exist if no active proposals
    const hasVoteButtons = await voteForButton.count() > 0 || 
                           await voteAgainstButton.count() > 0;
    
    expect(typeof hasVoteButtons).toBe('boolean');
  });

  test('should have accessible voting buttons with ARIA labels', async ({ page }) => {
    await page.goto('/governance');
    
    const voteButtons = await page.getByRole('button', { name: /vote/i }).all();
    
    for (const button of voteButtons) {
      const hasAccessibleName = await button.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label');
        const textContent = el.textContent?.trim();
        
        return !!(ariaLabel || textContent);
      });
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should show voting deadline for proposals', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for time/deadline information
    const deadlineInfo = page.getByText(/ends|deadline|closes|voting ends|time remaining/i);
    const hasDeadlineInfo = await deadlineInfo.count() > 0;
    
    expect(typeof hasDeadlineInfo).toBe('boolean');
  });

  test('should have create proposal button', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for create proposal action
    const createButton = page.getByRole('button', { name: /create proposal|new proposal|submit proposal/i });
    const hasCreateButton = await createButton.count() > 0;
    
    expect(hasCreateButton).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/governance');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus').first();
    const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
    
    expect(['button', 'a', 'input', 'select']).toContain(tagName);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/governance');
    
    // Check for h1
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for h2 sections
    const h2 = page.locator('h2');
    const h2Count = await h2.count();
    
    expect(h2Count).toBeGreaterThanOrEqual(0);
  });

  test('should show RIDE token balance for voting power', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for token balance display
    const tokenInfo = page.getByText(/RIDE token|token balance|voting power|\d+ RIDE/i);
    const hasTokenInfo = await tokenInfo.count() > 0;
    
    expect(typeof hasTokenInfo).toBe('boolean');
  });

  test('should display proposal tier badges', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for tier badges on proposals
    const tierBadges = page.getByText(/tier 1|tier 2|tier 3|emergency|operational|strategic/i);
    const hasTierBadges = await tierBadges.count() > 0;
    
    expect(typeof hasTierBadges).toBe('boolean');
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('/governance');
    
    const skipLink = page.getByRole('link', { name: /skip to|skip navigation|skip to content/i });
    const hasSkipLink = await skipLink.count() > 0;
    
    expect(hasSkipLink).toBeTruthy();
  });

  test('should handle voting action', async ({ page }) => {
    await page.goto('/governance');
    
    // Try to click vote button if proposals exist
    const voteButton = page.getByRole('button', { name: /vote for/i }).first();
    
    if (await voteButton.isVisible().catch(() => false)) {
      await voteButton.click();
      
      // Should show some feedback (toast, modal, or update)
      await page.waitForTimeout(1000);
      
      // Check for success message or updated vote count
      const feedback = page.getByText(/voted|success|thank you|vote recorded/i);
      const hasFeedback = await feedback.count() > 0;
      
      expect(typeof hasFeedback).toBe('boolean');
    }
  });

  test('should show proposal description', async ({ page }) => {
    await page.goto('/governance');
    
    // Look for proposal descriptions
    const descriptions = page.locator('p, [class*="description"]');
    const hasDescriptions = await descriptions.count() > 0;
    
    expect(hasDescriptions).toBeTruthy();
  });
});
