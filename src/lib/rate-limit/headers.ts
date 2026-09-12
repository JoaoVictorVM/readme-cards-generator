import type { RateLimitDecision } from "@/lib/rate-limit/types";

export type RateLimitHeaders = {
  "Retry-After": string;
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
};

export function rateLimitHeaders(
  decision: RateLimitDecision,
): RateLimitHeaders {
  return {
    "Retry-After": String(decision.retryAfterSeconds),
    "X-RateLimit-Limit": String(decision.limit),
    "X-RateLimit-Remaining": String(decision.remaining),
    "X-RateLimit-Reset": String(decision.resetAt),
  };
}
