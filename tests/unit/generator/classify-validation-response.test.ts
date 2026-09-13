import { describe, expect, test } from "bun:test";
import {
  classifyValidationResponse,
  GENERATOR_DEFAULT_COOLDOWN_SECONDS,
  GENERATOR_MAX_COOLDOWN_SECONDS,
} from "@/lib/generator";

const SUCCESS_BODY = { exists: true, owner: "vercel", repo: "next.js" };
const RATE_LIMITED_BODY = { exists: false, error: "rate_limited" };

function classify(status: number, body: unknown, retryAfter: string | null) {
  return classifyValidationResponse({ status, retryAfter, body });
}

describe("classifyValidationResponse", () => {
  test("200 with valid body is ok with canonical names", () => {
    expect(classify(200, SUCCESS_BODY, null)).toEqual({
      status: "ok",
      owner: "vercel",
      repo: "next.js",
    });
  });

  test("200 with malformed body is could_not_verify", () => {
    const bodies = [
      { exists: false, error: "not_found" },
      { exists: true, owner: "vercel" },
      { exists: true, owner: "", repo: "next.js" },
      { exists: true, owner: "vercel", repo: 3 },
      "vercel/next.js",
      null,
      undefined,
      [],
    ];
    for (const body of bodies) {
      expect(classify(200, body, null)).toEqual({
        status: "error",
        kind: "could_not_verify",
      });
    }
  });

  test("400 is invalid_url", () => {
    expect(
      classify(400, { exists: false, error: "invalid_input" }, null),
    ).toEqual({ status: "error", kind: "invalid_url" });
  });

  test("404 is not_found", () => {
    expect(classify(404, { exists: false, error: "not_found" }, null)).toEqual({
      status: "error",
      kind: "not_found",
    });
  });

  test("403 is quota_exhausted without cooldown", () => {
    for (const retryAfter of [null, "900"]) {
      const outcome = classify(403, RATE_LIMITED_BODY, retryAfter);
      expect(outcome).toEqual({ status: "error", kind: "quota_exhausted" });
      expect(outcome.status === "error" && outcome.retryAfterSeconds).toBe(
        undefined,
      );
    }
  });

  test("429 is too_many_requests with retry after", () => {
    expect(classify(429, RATE_LIMITED_BODY, "37")).toEqual({
      status: "error",
      kind: "too_many_requests",
      retryAfterSeconds: 37,
    });
  });

  test("429 retry after defaults and caps", () => {
    const cases: Array<[string | null, number]> = [
      [null, GENERATOR_DEFAULT_COOLDOWN_SECONDS],
      ["0", GENERATOR_DEFAULT_COOLDOWN_SECONDS],
      ["-5", GENERATOR_DEFAULT_COOLDOWN_SECONDS],
      ["abc", GENERATOR_DEFAULT_COOLDOWN_SECONDS],
      ["1.5", GENERATOR_DEFAULT_COOLDOWN_SECONDS],
      ["999", GENERATOR_MAX_COOLDOWN_SECONDS],
      ["120", 120],
      ["1", 1],
    ];
    for (const [header, expected] of cases) {
      expect(classify(429, RATE_LIMITED_BODY, header)).toEqual({
        status: "error",
        kind: "too_many_requests",
        retryAfterSeconds: expected,
      });
    }
  });

  test("502 and 500 are could_not_verify", () => {
    expect(
      classify(502, { exists: false, error: "upstream_error" }, null),
    ).toEqual({ status: "error", kind: "could_not_verify" });
    expect(
      classify(500, { exists: false, error: "unexpected_error" }, null),
    ).toEqual({ status: "error", kind: "could_not_verify" });
  });

  test("unknown status is could_not_verify", () => {
    for (const status of [418, 503, 301, 0]) {
      expect(classify(status, {}, null)).toEqual({
        status: "error",
        kind: "could_not_verify",
      });
    }
  });

  test("body error code is not consulted", () => {
    expect(classify(404, RATE_LIMITED_BODY, "37")).toEqual({
      status: "error",
      kind: "not_found",
    });
  });
});
