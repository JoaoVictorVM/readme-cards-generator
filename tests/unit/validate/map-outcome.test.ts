import { describe, expect, test } from "bun:test";
import type {
  Repository,
  RepositoryLookupOutcome,
  UnexpectedErrorReason,
  UpstreamErrorReason,
} from "@/lib/github";
import { mapOutcome } from "@/lib/validate/map-outcome";

const REPOSITORY: Repository = {
  owner: "vercel",
  name: "next.js",
  fullName: "vercel/next.js",
  language: "JavaScript",
  pushedAt: "2025-01-01T00:00:00Z",
  htmlUrl: "https://github.com/vercel/next.js",
};

const DOCUMENTED_STATUSES = [200, 400, 403, 404, 500, 502];

describe("mapOutcome", () => {
  test("ok maps to 200 with canonical names", () => {
    const mapped = mapOutcome({ status: "ok", data: REPOSITORY });
    expect(mapped.status).toBe(200);
    expect(mapped.body).toEqual({
      exists: true,
      owner: "vercel",
      repo: "next.js",
    });
    expect(Object.keys(mapped.body).sort()).toEqual([
      "exists",
      "owner",
      "repo",
    ]);
    expect(mapped.headers).toBeUndefined();
  });

  test("not_found maps to 404", () => {
    const mapped = mapOutcome({ status: "not_found" });
    expect(mapped.status).toBe(404);
    expect(mapped.body).toEqual({ exists: false, error: "not_found" });
  });

  test("rate_limited maps to 403", () => {
    const mapped = mapOutcome({
      status: "rate_limited",
      resetAt: 1735689647000,
      retryAfterSeconds: 47,
    });
    expect(mapped.status).toBe(403);
    expect(mapped.body).toEqual({ exists: false, error: "rate_limited" });
    expect(mapped.headers).toEqual({ "Retry-After": "47" });
  });

  test("rate_limited without hint has no retry-after", () => {
    for (const hint of [null, 0]) {
      const mapped = mapOutcome({
        status: "rate_limited",
        resetAt: null,
        retryAfterSeconds: hint,
      });
      expect(mapped.status).toBe(403);
      expect(mapped.headers).toBeUndefined();
    }
  });

  test("upstream_error maps to 502", () => {
    const reasons: UpstreamErrorReason[] = [
      "http_status",
      "timeout",
      "network",
    ];
    for (const reason of reasons) {
      const mapped = mapOutcome({
        status: "upstream_error",
        reason,
        httpStatus: reason === "http_status" ? 503 : null,
      });
      expect(mapped.status).toBe(502);
      expect(mapped.body).toEqual({ exists: false, error: "upstream_error" });
    }
  });

  test("unexpected_error maps to 500", () => {
    const reasons: UnexpectedErrorReason[] = [
      "invalid_json",
      "missing_fields",
      "thrown",
    ];
    for (const reason of reasons) {
      const mapped = mapOutcome({ status: "unexpected_error", reason });
      expect(mapped.status).toBe(500);
      expect(mapped.body).toEqual({
        exists: false,
        error: "unexpected_error",
      });
    }
  });

  test("invalid_ref reason maps to 400", () => {
    const mapped = mapOutcome({
      status: "unexpected_error",
      reason: "invalid_ref",
    });
    expect(mapped.status).toBe(400);
    expect(mapped.body).toEqual({ exists: false, error: "invalid_input" });
  });

  test("mapping is exhaustive", () => {
    const outcomes: RepositoryLookupOutcome[] = [
      { status: "ok", data: REPOSITORY },
      { status: "not_found" },
      { status: "rate_limited", resetAt: null, retryAfterSeconds: null },
      { status: "upstream_error", reason: "network", httpStatus: null },
      { status: "unexpected_error", reason: "thrown" },
      { status: "unexpected_error", reason: "invalid_ref" },
    ];
    for (const outcome of outcomes) {
      const mapped = mapOutcome(outcome);
      expect(DOCUMENTED_STATUSES).toContain(mapped.status);
      expect(mapped.body.exists).toBe(outcome.status === "ok");
    }
  });
});
