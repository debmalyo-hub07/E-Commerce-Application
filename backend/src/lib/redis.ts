import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import IORedis from "ioredis";

// ── Upstash Redis (REST API) — for caching and rate limiting ──
export const upstashRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ── IORedis — for BullMQ job queues (requires raw Redis connection) ──
const createIORedisConnection = (): IORedis => {
  const redis = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  });

  redis.on("error", (err) => {
    console.error("[IORedis] Connection error:", err);
  });

  redis.on("connect", () => {
    console.log("[IORedis] Connected to Redis");
  });

  return redis;
};

const globalForRedis = globalThis as unknown as { ioRedis: IORedis };
export const ioRedis: IORedis =
  globalForRedis.ioRedis ?? createIORedisConnection();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.ioRedis = ioRedis;
}

// ── Rate Limiters (using Upstash sliding window) ──────────────

export const authRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "rl:auth",
});

export const paymentRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "rl:payment",
});

export const publicProductsRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(200, "1 m"),
  prefix: "rl:products",
});

export const adminRateLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  prefix: "rl:admin",
});

export const loginBruteForceLimiter = new Ratelimit({
  redis: upstashRedis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "rl:login",
});
