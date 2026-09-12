import { describe, expect, test } from "bun:test";
import type { RateLimitDecision } from "@/lib/rate-limit";
import {
  buildInvalidInputResponse,
  buildMappedResponse,
  buildRateLimitedResponse,
  buildResponse,
  buildUnexpectedErrorResponse,
} from "@/lib/validate/build-response";

const REJECTED: RateLimitDecision = {
  allowed: false,
  limit: 60,
  remaining: 0,
  resetAt: 1735689600000,
  retryAfterSeconds: 37,
  identifier: "203.0.113.7",
  degraded: null,
};

function expectMandatoryHeaders(response: Response): void {
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
}

describe("buildResponse", () => {
  test("sets json content type", () => {
    const response = buildResponse(404, { exists: false, error: "not_found" });
    expect(response.headers.get("content-type")).toBe(
      "application/json; charset=utf-8",
    );
  });

  test("sets no-store", () => {
    const response = buildResponse(404, { exists: false, error: "not_found" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  test("sets nosniff", () => {
    const response = buildResponse(404, { exists: false, error: "not_found" });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("body round trips as json", async () => {
    const success = { exists: true as const, owner: "a", repo: "b" };
    const failure = { exists: false as const, error: "not_found" as const };
    expect(JSON.parse(await buildResponse(200, success).text())).toEqual(
      success,
    );
    expect(JSON.parse(await buildResponse(404, failure).text())).toEqual(
      failure,
    );
  });

  test("extra headers are merged not overriding mandatory ones", () => {
    const response = buildResponse(
      403,
      { exists: false, error: "rate_limited" },
      { "Retry-After": "47", "Cache-Control": "public, max-age=60" },
    );
    expect(response.status).toBe(403);
    expect(response.headers.get("retry-after")).toBe("47");
    expectMandatoryHeaders(response);
  });

  test("mapped builder forwards status body and headers", async () => {
    const response = buildMappedResponse({
      status: 403,
      body: { exists: false, error: "rate_limited" },
      headers: { "Retry-After": "5" },
    });
    expect(response.status).toBe(403);
    expect(response.headers.get("retry-after")).toBe("5");
    expect(await response.json()).toEqual({
      exists: false,
      error: "rate_limited",
    });
  });

  test("invalid input builder is 400 invalid_input", async () => {
    const response = buildInvalidInputResponse();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
    expectMandatoryHeaders(response);
  });

  test("rate limited builder includes f06 headers", async () => {
    const response = buildRateLimitedResponse(REJECTED);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      exists: false,
      error: "rate_limited",
    });
    expect(response.headers.get("retry-after")).toBe("37");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe("1735689600000");
    expectMandatoryHeaders(response);
  });

  test("fallback builder is 500 unexpected_error", async () => {
    const response = buildUnexpectedErrorResponse();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      exists: false,
      error: "unexpected_error",
    });
    expectMandatoryHeaders(response);
  });
});
