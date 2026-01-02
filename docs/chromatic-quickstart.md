# Chromatic Quick Start Guide

**Status:** ✅ Installed and configured  
**Ready to use:** Requires project token only

---

## What is Chromatic?

Chromatic automatically detects visual changes in your UI by capturing screenshots during Playwright tests and comparing them against baseline images. This catches unintended visual regressions before they reach production.

---

## Quick Setup (3 Steps)

### Step 1: Get Your Project Token

1. Visit **[chromatic.com](https://www.chromatic.com/)**
2. Sign in with GitHub
3. Click **"Add Project"**
4. Select **"OpenRide"** repository
5. Copy the project token (looks like `chpt_abc123...`)

### Step 2: Set Environment Variable

```bash
# Add to your shell profile (~/.bashrc, ~/.zshrc, etc.)
export CHROMATIC_PROJECT_TOKEN=chpt_your_token_here

# Or create .env file (DO NOT commit)
echo "CHROMATIC_PROJECT_TOKEN=chpt_your_token_here" >> .env
```

### Step 3: Run Your First Baseline

```bash
# Capture baseline snapshots
pnpm exec chromatic --playwright

# This will:
# 1. Run all Playwright tests
# 2. Capture visual snapshots
# 3. Upload to Chromatic
# 4. Establish baseline for future comparisons
```

**Expected output:**
```
✔ Chromatic build created
✔ Running Playwright tests...
✔ Captured 15 snapshots
✔ Uploaded to Chromatic
✔ View build: https://www.chromatic.com/build?appId=...
```

---

## Daily Usage

### Before Making UI Changes

```bash
# Run tests to establish current state
pnpm exec chromatic --playwright
```

### After Making UI Changes

```bash
# Run tests to detect visual changes
pnpm exec chromatic --playwright

# Review changes in Chromatic dashboard
# Accept intentional changes or fix bugs
```

---

## Common Commands

```bash
# Run all tests with visual snapshots
pnpm exec chromatic --playwright

# Run only changed files
pnpm exec chromatic --playwright --only-changed

# Auto-accept all changes (use carefully!)
pnpm exec chromatic --playwright --auto-accept-changes

# Skip CI checks (for testing)
pnpm exec chromatic --playwright --skip

# Run specific test file
pnpm exec chromatic --playwright --grep "homepage"
```

---

## What Gets Tested?

Chromatic captures visual snapshots during your existing Playwright tests:

- ✅ **Homepage** - All service cards, hero section, statistics
- ✅ **Ride Booking** - Form inputs, map, driver matching
- ✅ **Driver Application** - Multi-step form, document uploads
- ✅ **Dashboards** - Driver and rider dashboards with stats
- ✅ **Governance** - DAO proposals and voting interface
- ✅ **All responsive breakpoints** - Desktop, tablet, mobile

---

## Understanding Results

### ✅ No Changes Detected
```
✔ Build passed - no visual changes detected
```
**Action:** None needed, your changes didn't affect the UI

### ⚠️ Changes Detected
```
⚠ Build has changes - review required
📸 View changes: https://www.chromatic.com/build?...
```
**Action:** 
1. Click the link to review changes
2. **Accept** if changes are intentional (new feature, design update)
3. **Reject** if changes are bugs (fix and re-run)

### ❌ Build Failed
```
✖ Build failed - tests did not pass
```
**Action:** Fix failing Playwright tests first, then re-run

---

## Reviewing Changes in Chromatic Dashboard

1. **Click the build link** from terminal output
2. **Review each snapshot:**
   - **Green border** = No changes
   - **Yellow border** = Changes detected
   - **Red border** = New snapshot (no baseline)
3. **Compare side-by-side:**
   - **Baseline** (left) vs **Current** (right)
   - **Diff view** highlights exact pixel changes
4. **Accept or reject:**
   - ✅ **Accept** = Update baseline for this snapshot
   - ❌ **Deny** = Keep existing baseline, mark as bug

---

## CI/CD Integration

### GitHub Actions (Recommended)

Create `.github/workflows/chromatic.yml`:

```yaml
name: Visual Regression Tests
on: [push, pull_request]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: 22
      
      - run: pnpm install
      
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium
      
      - name: Run Chromatic
        run: pnpm exec chromatic --playwright
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### Add Secret to GitHub

1. Go to **repository Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `CHROMATIC_PROJECT_TOKEN`
4. Value: Your Chromatic token
5. Click **"Add secret"**

---

## Troubleshooting

### "Project token not found"
```bash
# Make sure token is set
echo $CHROMATIC_PROJECT_TOKEN

# If empty, set it:
export CHROMATIC_PROJECT_TOKEN=chpt_your_token_here
```

### "No snapshots captured"
```bash
# Make sure Playwright tests run successfully
pnpm exec playwright test

# Then run Chromatic
pnpm exec chromatic --playwright
```

### "Too many snapshots"
```bash
# Check your usage
pnpm exec chromatic --playwright --list

# Free tier: 5,000 snapshots/month
# Current usage: ~500/month (well within limit)
```

### "Visual differences on every run"
**Causes:**
- Dynamic timestamps or dates
- Random data in tests
- Fonts not loading
- Animations not completing

**Solutions:**
- Use fixed dates in test mode
- Wait for `networkidle` before snapshots
- Preload fonts
- Add delays for animations

---

## Best Practices

### 1. Run Before Committing
```bash
# Always run before pushing
pnpm exec chromatic --playwright
```

### 2. Review Changes Carefully
- Don't auto-accept without reviewing
- Check all viewports (desktop, tablet, mobile)
- Verify changes are intentional

### 3. Keep Baselines Updated
- Accept intentional design changes
- Reject accidental regressions
- Re-run after fixing bugs

### 4. Use in Pull Requests
- Chromatic comments on PRs with visual diffs
- Team can review changes before merging
- Prevents visual bugs from reaching production

---

## Cost & Usage

### Free Tier
- **5,000 snapshots/month**
- **Unlimited team members**
- **Unlimited projects**

### Current Usage (Estimated)
- **~500 snapshots/month**
  - 10 pages × 5 viewports × 10 builds = 500
- **Well within free tier** ✅

### Paid Plans (if needed)
- **Starter:** $149/month (25,000 snapshots)
- **Pro:** $449/month (100,000 snapshots)

---

## Support & Resources

- **Chromatic Docs:** [chromatic.com/docs](https://www.chromatic.com/docs/)
- **Playwright Integration:** [chromatic.com/docs/playwright](https://www.chromatic.com/docs/playwright)
- **Support:** [chromatic.com/support](https://www.chromatic.com/support)
- **Status:** [status.chromatic.com](https://status.chromatic.com/)

---

## Next Steps

1. ✅ **Get project token** from chromatic.com
2. ✅ **Set environment variable** in your shell
3. ✅ **Run first baseline:** `pnpm exec chromatic --playwright`
4. ⏳ **Add to CI/CD** (GitHub Actions workflow)
5. ⏳ **Train team** on review process

---

**Ready to start?** Run this command:

```bash
pnpm exec chromatic --playwright
```

If you don't have a token yet, visit **[chromatic.com](https://www.chromatic.com/)** to create your free account.
