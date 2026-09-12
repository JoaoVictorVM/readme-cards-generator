import { describe, expect, test } from "bun:test";
import { rateLimitHeaders } from "@/lib/rate-limit/headers";
import type { RateLimitDecision } from "@/lib/rate-limit/types";

const rejected: RateLimitDecision = {
  allowed: false,
  limit: 60,
  remaining: 0,
  resetAt: 1735689600000,
  retryAfterSeconds: 37,
  degraded: null,
  identifier: "203.0.113.7",
};

describe("rateLimitHeaders", () => {
  test("retry-after header is integer seconds", () => {
    const value = rateLimitHeaders(rejected)["Retry-After"];
    expect(value).toMatch(/^[1-9]\d*$/);
    expect(Number.parseInt(value, 10)).toBe(37);
  });

  test("rate limit headers reflect decision", () => {
    expect(rateLimitHeaders(rejected)).toEqual({
      "Retry-After": "37",
      "X-RateLimit-Limit": "60",
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": "1735689600000",
    });
  });

  test("header values are strings", () => {
    const allowed: RateLimitDecision = {
      ...rejected,
      allowed: true,
      remaining: 12,
    };
    for (const decision of [rejected, allowed]) {
      for (const value of Object.values(rateLimitHeaders(decision))) {
        expect(typeof value).toBe("string");
      }
    }
    expect(new Headers(rateLimitHeaders(rejected)).get("retry-after")).toBe(
      "37",
    );
  });
});
