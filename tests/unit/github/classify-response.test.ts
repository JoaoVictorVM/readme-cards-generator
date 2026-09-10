import { describe, expect, test } from "bun:test";
import { classifyResponse } from "@/lib/github/classify-response";

const NOW = 1_788_268_953_000;

describe("classifyResponse", () => {
  test("status 200 classifies ok", () => {
    expect(classifyResponse(200, {}, NOW)).toEqual({ status: "ok" });
  });

  test("status 404 classifies not_found", () => {
    expect(classifyResponse(404, {}, NOW)).toEqual({ status: "not_found" });
  });

  test("403 with zero remaining classifies rate_limited", () => {
    const result = classifyResponse(403, { "x-ratelimit-remaining": "0" }, NOW);
    expect(result.status).toBe("rate_limited");
  });

  test("429 with zero remaining classifies rate_limited", () => {
    const result = classifyResponse(429, { "x-ratelimit-remaining": "0" }, NOW);
    expect(result.status).toBe("rate_limited");
  });

  test("403 without zero remaining classifies upstream_error", () => {
    expect(
      classifyResponse(403, { "x-ratelimit-remaining": "42" }, NOW),
    ).toEqual({
      status: "upstream_error",
      reason: "http_status",
      httpStatus: 403,
    });
    expect(classifyResponse(403, {}, NOW)).toEqual({
      status: "upstream_error",
      reason: "http_status",
      httpStatus: 403,
    });
  });

  test("503 classifies upstream_error", () => {
    expect(classifyResponse(503, {}, NOW)).toEqual({
      status: "upstream_error",
      reason: "http_status",
      httpStatus: 503,
    });
  });

  test("non-200 success status classifies upstream_error", () => {
    expect(classifyResponse(204, {}, NOW)).toEqual({
      status: "upstream_error",
      reason: "http_status",
      httpStatus: 204,
    });
  });

  test("rate_limited extracts the reset instant", () => {
    const resetSeconds = Math.floor(NOW / 1000) + 47;
    const result = classifyResponse(
      403,
      {
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(resetSeconds),
      },
      NOW,
    );
    expect(result).toEqual({
      status: "rate_limited",
      resetAt: resetSeconds * 1000,
      retryAfterSeconds: 47,
    });
  });

  test("rate_limited falls back to retry-after", () => {
    const result = classifyResponse(
      429,
      { "x-ratelimit-remaining": "0", "retry-after": "60" },
      NOW,
    );
    expect(result).toEqual({
      status: "rate_limited",
      resetAt: null,
      retryAfterSeconds: 60,
    });
  });

  test("rate_limited hints are null when headers absent", () => {
    expect(
      classifyResponse(403, { "x-ratelimit-remaining": "0" }, NOW),
    ).toEqual({
      status: "rate_limited",
      resetAt: null,
      retryAfterSeconds: null,
    });
  });

  test("quota header matched case-insensitively", () => {
    expect(
      classifyResponse(403, { "X-RateLimit-Remaining": "0" }, NOW).status,
    ).toBe("rate_limited");
    expect(
      classifyResponse(403, new Headers({ "X-RateLimit-Remaining": "0" }), NOW)
        .status,
    ).toBe("rate_limited");
  });

  test("non-numeric quota header treated as not exhausted", () => {
    expect(
      classifyResponse(403, { "x-ratelimit-remaining": "none" }, NOW).status,
    ).toBe("upstream_error");
    expect(
      classifyResponse(403, { "x-ratelimit-remaining": "" }, NOW).status,
    ).toBe("upstream_error");
  });

  test("a reset instant in the past yields a zero retry delay", () => {
    const result = classifyResponse(
      403,
      {
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(NOW / 1000) - 10),
      },
      NOW,
    );
    expect(result).toMatchObject({ retryAfterSeconds: 0 });
  });
});
