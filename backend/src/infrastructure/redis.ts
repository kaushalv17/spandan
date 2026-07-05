import IORedis, { type Redis } from "ioredis";
import { env } from "../config/env.js";

// BullMQ requires maxRetriesPerRequest = null on its connections.
export function createRedis(): Redis {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

export const redis: Redis = createRedis();
