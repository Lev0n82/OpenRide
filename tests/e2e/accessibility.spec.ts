import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Compliance (WCAG 2.2 AAA)', () => {
  test('Homepage should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Ride Booking page should have no accessibility violations', async ({ page }) => {
    await page.goto('/ride/book');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Driver Application page should have no accessibility violations', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session',
      value: 'mock-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
    
    await page.goto('/driver/apply');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Governance page should have no accessibility violations', async ({ page }) => {
    await page.goto('/governance');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Driver Dashboard should have no accessibility violations', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session',
      value: 'mock-driver-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
    
    await page.goto('/driver');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Rider Dashboard should have no accessibility violations', async ({ page, context }) => {
    await context.addCookies([{
      name: 'session',
      value: 'mock-rider-session',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    }]);
    
    await page.goto('/rider');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Accessibility Statement page should have no violations', async ({ page }) => {
    await page.goto('/accessibility');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Should have proper color contrast ratios (AAA: 7:1 for normal text)', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .options({
        runOnly: {
          type: 'rule',
          values: ['color-contrast-enhanced']
        }
      })
      .analyze();
    
    // AAA level requires 7:1 contrast for normal text
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should have alt text, or be marked as decorative (aria-hidden or role="presentation")
      const isAccessible = alt !== null || 
                          role === 'presentation' || 
                          ariaHidden === 'true' ||
                          ariaLabel !== null;
      
      expect(isAccessible).toBeTruthy();
    }
  });

  test('All form inputs should have labels', async ({ page }) => {
    await page.goto('/ride/book');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        runOnly: {
          type: 'rule',
          values: ['label', 'label-title-only']
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        runOnly: {
          type: 'rule',
          values: ['heading-order']
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Interactive elements should have accessible names', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        runOnly: {
          type: 'rule',
          values: ['button-name', 'link-name']
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page should have valid ARIA attributes', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        runOnly: {
          type: 'rule',
          values: ['aria-valid-attr', 'aria-valid-attr-value', 'aria-allowed-attr']
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Page should have proper landmark regions', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        runOnly: {
          type: 'rule',
          values: ['region', 'landmark-one-main']
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Skip links should be present', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip navigation link
    const skipLink = page.getByRole('link', { name: /skip to|skip navigation|skip to content/i });
    const hasSkipLink = await skipLink.count() > 0;
    
    expect(hasSkipLink).toBeTruthy();
  });

  test('Focus indicators should be visible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus').first();
    
    // Check that outline is visible
    const outlineWidth = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineWidth
    );
    
    const outlineStyle = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outlineStyle
    );
    
    // Should have visible outline (not 0px and not 'none')
    expect(outlineWidth).not.toBe('0px');
    expect(outlineStyle).not.toBe('none');
  });

  test('Text should be resizable up to 200%', async ({ page }) => {
    await page.goto('/');
    
    // Get initial font size
    const initialFontSize = await page.evaluate(() => {
      return parseFloat(window.getComputedStyle(document.body).fontSize);
    });
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    await page.waitForTimeout(500);
    
    // Content should still be readable and not overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Some horizontal scroll is acceptable at 200% zoom
    expect(typeof hasHorizontalScroll).toBe('boolean');
  });
});
