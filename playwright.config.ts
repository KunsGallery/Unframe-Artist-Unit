import { defineConfig } from "@playwright/test";

// Public-page smoke tests against `next dev` and a mock Firestore REST server.
// Run with `npm run test:e2e`; stop other `next dev` processes first (they share .next).
const port = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  use: { baseURL: `http://localhost:${port}` },
  webServer: [
    { command: "node tests/e2e/mock-firestore.mjs", port: 8899, reuseExistingServer: false },
    {
      command: `next dev -p ${port}`,
      port,
      timeout: 180_000,
      reuseExistingServer: false,
      env: { FIRESTORE_EMULATOR_HOST: "127.0.0.1:8899", NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo-uau", NEXT_PUBLIC_SITE_URL: "https://uau.unframe.kr" },
    },
  ],
});
