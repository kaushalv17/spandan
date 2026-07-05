import { Worker } from "bullmq";
import { env } from "./config/env.js";
import {
  bullConnection,
  INFERENCE_QUEUE,
  type InferenceJobData,
} from "./infrastructure/queue.js";
import { logger } from "./infrastructure/logger.js";
import { processObservation } from "./services/inferenceService.js";

// Background consumer: pulls queued observations, runs the full inference +
// health pipeline, and records outcomes. Runs as its own process: npm run worker.
const worker = new Worker<InferenceJobData>(
  INFERENCE_QUEUE,
  async (job) => {
    await processObservation(job.data.observationId);
  },
  { connection: bullConnection(), concurrency: env.WORKER_CONCURRENCY },
);

worker.on("completed", (job) =>
  logger.info({ jobId: job.id }, "inference job completed"),
);
worker.on("failed", (job, err) =>
  logger.error({ jobId: job?.id, err }, "inference job failed"),
);

logger.info(
  `inference worker listening on ${INFERENCE_QUEUE} (concurrency ${env.WORKER_CONCURRENCY})`,
);

async function shutdown(): Promise<void> {
  logger.info("shutting down inference worker");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
