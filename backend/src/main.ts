import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./infrastructure/logger.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(pinoHttp({ logger }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
  app.get("/health", (_req, res) =>
    res.json({ status: "ok", service: "spandan-backend" }),
  );
  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(env.PORT, () => logger.info(`spandan-backend on :${env.PORT}`));
}
