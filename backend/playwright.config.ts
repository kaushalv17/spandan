import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 30_000 },
  use: { baseURL: process.env.API_BASE || "http://localhost:8080/api/v1" },
  reporter: "list",
});
