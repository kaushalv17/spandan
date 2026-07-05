import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { pingModelService } from "./clients/modelServiceClient.js";
import { env } from "./config/env.js";
import { healthcheck as dbHealthcheck } from "./infrastructure/db.js";
import { logger } from "./infrastructure/logger.js";
import { errorHandler, notFound } from "./http/middleware/errorHandler.js";
import { apiRouter } from "./http/routes/index.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(pinoHttp({ logger }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

  app.get("/health", (_req, res) =>
    res.json({ status: "ok", service: "spandan-backend" }),
  );

  // Readiness probe: DB is required, model service is reported but not fatal.
  app.get("/ready", (_req, res) => {
    void Promise.all([
      dbHealthcheck().catch(() => false),
      pingModelService(),
    ]).then(([db, model]) => {
      res
        .status(db ? 200 : 503)
        .json({ status: db ? "ready" : "degraded", db, model });
    });
  });

  app.use("/api/v1", apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(env.PORT, () => logger.info(`spandan-backend on :${env.PORT}`));
}
