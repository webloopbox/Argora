import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Ensure .env.test exists at the repo root and sets DATABASE_URL ' +
      'pointing to the test database (e.g. brainstorm_test).',
  );
}

const API_URL = 'http://localhost:3000';
const WEB_URL = 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  globalSetup: './global-setup',
  use: {
    baseURL: WEB_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter ./apps/api dev',
      // pnpm resolves a relative --filter path against the working directory,
      // a Playwright webServer runs in the config directory, hence the repo root.
      cwd: path.resolve(__dirname, '../..'),
      url: `${API_URL}/stats`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret',
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
        WEB_ORIGIN: process.env.WEB_ORIGIN ?? WEB_URL,
        PORT: '3000',
        NODE_ENV: 'test',
        ANTHROPIC_API_KEY: '',
        OPENAI_API_KEY: '',
        GEMINI_API_KEY: '',
      },
    },
    {
      command: 'pnpm --filter ./apps/web dev',
      cwd: path.resolve(__dirname, '../..'),
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
