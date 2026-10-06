import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

config({ path: '.env.test', override: true })
const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  workers: 1,
  retries: 0,
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${PORT}`,
    reducedMotion: 'reduce', // both designs stop their animations under reduced motion
  },
  webServer: {
    command: 'pnpm build && node .output/server/index.mjs',
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { ...process.env as Record<string, string>, PORT: String(PORT), NUXT_PUBLIC_BASE_URL: `http://localhost:${PORT}` },
  },
})
