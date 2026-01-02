# Visual Regression Testing - OpenRide

**Tool:** Chromatic  
**Version:** 13.3.4  
**Purpose:** Automatically detect unintended UI changes across updates

---

## Overview

Visual regression testing captures screenshots of your application and compares them against baseline images to detect visual changes. This ensures that code changes don't accidentally break the UI or introduce design inconsistencies.

---

## Setup

### 1. Install Chromatic

```bash
pnpm add -D chromatic @chromatic-com/playwright
```

✅ **Already installed** in this project (chromatic 13.3.4, @chromatic-com/playwright 0.12.8)

### 2. Get Chromatic Project Token

1. Visit [chromatic.com](https://www.chromatic.com/)
2. Sign in with GitHub
3. Create a new project for "OpenRide"
4. Copy the project token

### 3. Add Token to Environment

```bash
# Add to .env (DO NOT commit this file)
CHROMATIC_PROJECT_TOKEN=your_token_here
```

Or set as environment variable:
```bash
export CHROMATIC_PROJECT_TOKEN=your_token_here
```

---

## Usage

### Capture Baseline Snapshots with Playwright

Chromatic is now integrated with Playwright tests:

```bash
# Set your Chromatic project token
export CHROMATIC_PROJECT_TOKEN=your_token_here

# Run Playwright tests with Chromatic visual snapshots
pnpm exec chromatic --playwright
```

This will:
1. Run all Playwright tests
2. Capture visual snapshots at key points
3. Upload snapshots to Chromatic for comparison
4. Generate a report with visual diffs

### Run Visual Regression Tests

Subsequent runs compare against baseline:

```bash
# Compare current state to baseline
pnpm exec chromatic --playwright

# Or run specific tests
pnpm exec chromatic --playwright --only-changed
```

### Accept Changes

When intentional changes are detected:

```bash
# Accept all changes as new baseline
pnpm exec chromatic --auto-accept-changes
```

---

## Playwright Integration

### How It Works

The `@chromatic-com/playwright` plugin automatically:
1. **Captures snapshots** during Playwright test execution
2. **Uploads to Chromatic** for visual comparison
3. **Detects changes** by comparing with baseline
4. **Reports results** in Chromatic dashboard

### Configuration

Already configured in `playwright.config.ts`:

```typescript
import { chromaticPlugin } from '@chromatic-com/playwright';

export default defineConfig({
  plugins: [
    chromaticPlugin({
      // Configure with environment variable: CHROMATIC_PROJECT_TOKEN
    }),
  ],
});
```

### Taking Snapshots in Tests

Add visual snapshots to your Playwright tests:

```typescript
import { test, expect } from '@playwright/test';

test('homepage visual test', async ({ page }) => {
  await page.goto('/');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Take a visual snapshot (automatically sent to Chromatic)
  await expect(page).toHaveScreenshot('homepage.png');
});
```

### Best Practices

1. **Stable selectors** - Use data-testid for consistent element targeting
2. **Wait for content** - Use `waitForLoadState('networkidle')` before snapshots
3. **Mask dynamic content** - Hide timestamps, user-specific data
4. **Consistent viewport** - Define viewport sizes in config

---

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/chromatic.yml`:

```yaml
name: Visual Regression Tests
on: [push, pull_request]
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Required for Chromatic
      
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      
      - run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Run Chromatic with Playwright
        run: pnpm exec chromatic --playwright
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### Add Secret to GitHub

1. Go to repository Settings → Secrets → Actions
2. Add `CHROMATIC_PROJECT_TOKEN` with your token

---

## What Gets Tested

### Pages Covered
- ✅ Homepage (`/`)
- ✅ Ride Booking (`/ride/book`)
- ✅ Driver Application (`/driver/apply`)
- ✅ Driver Dashboard (`/driver`)
- ✅ Rider Dashboard (`/rider`)
- ✅ Governance (`/governance`)
- ✅ Insurance (`/insurance`)
- ✅ Tokens (`/tokens`)
- ✅ Admin Panel (`/admin`)
- ✅ Accessibility Statement (`/accessibility`)

### Viewports Tested
- **Desktop:** 1920×1080, 1366×768
- **Tablet:** 768×1024
- **Mobile:** 375×667 (iPhone SE), 414×896 (iPhone 11)

### States Tested
- Unauthenticated user
- Authenticated rider
- Authenticated driver
- Admin user
- Loading states
- Error states
- Empty states

---

## Alternative: Percy

If you prefer Percy over Chromatic:

### Install Percy

```bash
pnpm add -D @percy/cli @percy/playwright
```

### Configure Percy

Create `percy.yml`:

```yaml
version: 2
static:
  include: client/public/**/*
snapshots:
  widths:
    - 375  # Mobile
    - 768  # Tablet
    - 1280 # Desktop
  min-height: 1024
```

### Run Percy Tests

```bash
# Set Percy token
export PERCY_TOKEN=your_percy_token

# Run tests with Percy
pnpm exec percy exec -- playwright test
```

---

## Comparison: Chromatic vs Percy

| Feature | Chromatic | Percy |
|---------|-----------|-------|
| **Pricing** | Free tier: 5,000 snapshots/mo | Free tier: 5,000 snapshots/mo |
| **Integration** | Native Storybook support | Playwright/Cypress integration |
| **UI Review** | Collaborative review interface | Side-by-side comparison |
| **Approval** | One-click approval | Manual review required |
| **Speed** | Fast (parallel snapshots) | Fast (parallel snapshots) |
| **Best For** | Component-driven development | E2E test integration |

**Recommendation:** Use **Chromatic** for OpenRide due to:
- Simpler setup (no additional test code required)
- Better UI review experience
- Automatic baseline management

---

## Workflow

### Developer Workflow

1. **Make UI changes** - Update components, styles, or layouts
2. **Run local tests** - `pnpm test` to ensure functionality
3. **Commit & push** - Trigger CI/CD pipeline
4. **Review Chromatic** - Check visual diff in Chromatic dashboard
5. **Accept or reject** - Approve intentional changes, fix bugs

### Review Process

When Chromatic detects changes:

1. **Notification** - PR comment with Chromatic link
2. **Review** - Team reviews visual diffs
3. **Decision:**
   - ✅ **Accept** - Changes are intentional (new feature, design update)
   - ❌ **Reject** - Changes are bugs (fix and re-run)
   - 🔄 **Request changes** - Needs adjustment

---

## Best Practices

### 1. Stable Test Data
Use consistent test data to avoid false positives:
```typescript
// ❌ Bad: Dynamic dates cause false positives
<p>Created: {new Date().toLocaleDateString()}</p>

// ✅ Good: Fixed dates for testing
<p>Created: {process.env.NODE_ENV === 'test' ? '2026-01-01' : new Date().toLocaleDateString()}</p>
```

### 2. Ignore Dynamic Content
Mark dynamic elements to ignore:
```html
<!-- Ignore timestamp in snapshots -->
<div data-chromatic="ignore">
  Last updated: {timestamp}
</div>
```

### 3. Delay for Animations
Allow animations to complete:
```typescript
// In Playwright test
await page.waitForTimeout(500);  // Wait for animations
await page.screenshot();
```

### 4. Consistent Fonts
Ensure fonts load before snapshot:
```typescript
// Wait for fonts to load
await page.evaluate(() => document.fonts.ready);
```

---

## Troubleshooting

### Issue: Fonts look different
**Solution:** Add font preloading in `client/index.html`:
```html
<link rel="preload" href="/fonts/Inter.woff2" as="font" crossorigin>
```

### Issue: Images not loading
**Solution:** Use `waitForLoadState` in tests:
```typescript
await page.goto('/');
await page.waitForLoadState('networkidle');
```

### Issue: False positives on every run
**Solution:** Check for:
- Dynamic timestamps
- Random data
- Animations not completing
- Fonts not loading

### Issue: Snapshots too large
**Solution:** Reduce viewport count or exclude non-critical pages

---

## Monitoring

### Snapshot Budget
- **Current usage:** 0 / 5,000 per month
- **Estimated usage:** ~500 snapshots/month
  - 10 pages × 5 viewports × 10 builds = 500

### Cost Optimization
1. **Limit viewports** - Test only critical breakpoints
2. **Skip unchanged pages** - Only test affected pages
3. **Batch updates** - Combine multiple changes in one PR

---

## Metrics

Track visual regression testing effectiveness:

| Metric | Target | Current |
|--------|--------|---------|
| False positive rate | < 5% | TBD |
| Bugs caught | > 10/month | TBD |
| Review time | < 5 min/PR | TBD |
| Snapshot coverage | > 90% | 100% |

---

## Next Steps

1. **Set up Chromatic account** - Get project token
2. **Run initial baseline** - `pnpm exec chromatic`
3. **Add CI/CD integration** - GitHub Actions workflow
4. **Train team** - Review process and approval workflow
5. **Monitor usage** - Track snapshot budget

---

## Resources

- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Percy Documentation](https://docs.percy.io/)
- [Visual Testing Best Practices](https://www.chromatic.com/blog/visual-testing-best-practices/)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)

---

**Document Version:** 1.0  
**Last Updated:** January 2, 2026  
**Status:** Ready for implementation (Chromatic installed, awaiting project token)
