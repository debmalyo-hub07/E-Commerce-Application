import type { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";

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
