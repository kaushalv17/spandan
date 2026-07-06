import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Unit tests only. The Playwright suite in e2e/ runs via `npm run e2e`.
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
});
