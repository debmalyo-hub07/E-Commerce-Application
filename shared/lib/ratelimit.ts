/**
 * Rate Limiting Facade
 *
 * Provides type-safe rate limiting that can be imported by frontend API routes.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Initialize Redis client from env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://default.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "default-token",
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

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Apply rate limiting to a Next.js API route.
 * Returns a 429 response if limit exceeded, or null if OK.
 *
 * @param request - The incoming Next.js request
 * @param limiter - An @upstash/ratelimit Ratelimit instance
 * @param identifier - The key to rate limit on (e.g., IP address, user ID)
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit,
  identifier?: string
): Promise<NextResponse | null> {
  const ip =
    identifier ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  const result = await limiter.limit(ip);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: "Too many requests. Please slow down.",
        error_code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null; // No rate limit hit — proceed
}
