import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  console.warn(
    "[Ratelimit] REDIS_URL or REDIS_TOKEN not configured. Rate limiting disabled."
  );
}

const redis = new Redis({
  url: process.env.REDIS_URL || "https://default.upstash.io",
  token: process.env.REDIS_TOKEN || "default-token",
});

export const rateLimiters = {
  loginBruteForce: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    prefix: "ratelimit:login",
    analytics: true,
  }),

  authEndpoint: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:auth",
    analytics: true,
  }),

  paymentEndpoint: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "ratelimit:payment",
    analytics: true,
  }),

  publicProducts: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(200, "1 m"),
    prefix: "ratelimit:public:products",
    analytics: true,
  }),

  adminEndpoint: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "ratelimit:admin",
    analytics: true,
  }),
};
