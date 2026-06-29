import { describe, it, expect, beforeAll } from "vitest";

describe("foundation", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.JWT_SECRET = "0123456789abcdef";
    process.env.AI_SERVICE_URL = "http://localhost:8001";
    process.env.S3_ENDPOINT = "http://localhost:9000";
    process.env.S3_ACCESS_KEY = "a";
    process.env.S3_SECRET_KEY = "b";
    process.env.NODE_ENV = "test";
  });

  it("loads a valid environment", async () => {
    const { env } = await import("../../src/config/env.js");
    expect(env.PORT).toBeGreaterThan(0);
    expect(env.S3_BUCKET).toBe("spandan-observations");
  });

  it("boots the app with a health route", async () => {
    const { createApp } = await import("../../src/main.js");
    const app = createApp();
    expect(app).toBeDefined();
  });
});
