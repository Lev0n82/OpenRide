import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for OpenRide E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially for database consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid database conflicts
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop - Chromium (1920x1080, 1366x768)
    {
      name: 'Desktop Chrome 1920x1080',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Chrome 1366x768',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },

    // Desktop - Firefox (1920x1080, 1366x768)
    {
      name: 'Desktop Firefox 1920x1080',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Firefox 1366x768',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1366, height: 768 }
      },
    },

    // Desktop - WebKit/Safari (1920x1080, 1366x768)
    {
      name: 'Desktop Safari 1920x1080',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Desktop Safari 1366x768',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1366, height: 768 }
      },
    },

    // Mobile - iPhone 13
    {
      name: 'Mobile Safari iPhone 13',
      use: { ...devices['iPhone 13'] },
    },

    // Mobile - Pixel 5
    {
      name: 'Mobile Chrome Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
