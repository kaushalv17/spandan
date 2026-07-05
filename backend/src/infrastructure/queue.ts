import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq";
import { env } from "../config/env.js";

export interface InferenceJobData {
  observationId: string;
}

export const INFERENCE_QUEUE = env.INFERENCE_QUEUE;

// Build a plain BullMQ connection options object from REDIS_URL. Passing options
// (instead of an ioredis instance) lets BullMQ use its own bundled ioredis and
// avoids the cross-version Redis type conflict between app + bullmq ioredis.
export function bullConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined,
    maxRetriesPerRequest: null,
  };
}

// Lazily constructed so that merely importing this module (e.g. from the HTTP
// app or a unit test) does not open a Redis connection. The connection is only
// created the first time a job is actually enqueued.
let queue: Queue<InferenceJobData> | null = null;

export function getInferenceQueue(): Queue<InferenceJobData> {
  if (!queue) {
    queue = new Queue<InferenceJobData>(INFERENCE_QUEUE, {
      connection: bullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: 1_000,
        removeOnFail: 5_000,
      },
    });
  }
  return queue;
}

export async function enqueueInference(
  data: InferenceJobData,
  opts?: JobsOptions,
): Promise<string> {
  const job = await getInferenceQueue().add("infer", data, opts);
  return job.id ?? "";
}
