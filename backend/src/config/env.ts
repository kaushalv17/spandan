import { existsSync } from "node:fs";
import { z } from "zod";

// Load variables from a local .env file when present (development). In
// production (Docker / CI) the environment is injected directly, so no .env
// file exists and this is skipped. Uses Node's built-in loader (>= 20.12) so
// there is no external dependency.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(8080),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("24h"),
  AI_SERVICE_URL: z.string().url(),
  AI_TIMEOUT_MS: z.coerce.number().default(30_000),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string().default("spandan-observations"),
  INFERENCE_QUEUE: z.string().default("spandan-inference"),
  WORKER_CONCURRENCY: z.coerce.number().default(4),
  CORS_ORIGIN: z.string().default("*"),
  // Radius (metres) within which a new observation auto-binds to an asset.
  ASSET_MATCH_RADIUS_M: z.coerce.number().default(60),
});

export type Env = z.infer<typeof schema>;

export const env: Env = (() => {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
})();
