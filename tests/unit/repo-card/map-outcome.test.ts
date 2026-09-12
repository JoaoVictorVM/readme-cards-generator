import { describe, expect, test } from "bun:test";
import { ERROR_CARD_KINDS } from "@/lib/card";
import type {
  RepositoryLookupOutcome,
  UnexpectedErrorReason,
  UpstreamErrorReason,
} from "@/lib/github";
import { mapOutcome } from "@/lib/repo-card/map-outcome";
import type { RepoCardStatus } from "@/lib/repo-card/types";
import { REPOSITORY } from "../card/helpers";

const STATUSES: RepoCardStatus[] = [200, 400, 403, 404, 429, 500, 502];

const EVERY_OUTCOME: RepositoryLookupOutcome[] = [
  { status: "ok", data: REPOSITORY },
  { status: "not_found" },
  { status: "rate_limited", resetAt: null, retryAfterSeconds: 47 },
  { status: "rate_limited", resetAt: null, retryAfterSeconds: null },
  { status: "upstream_error", reason: "http_status", httpStatus: 500 },
  { status: "upstream_error", reason: "timeout", httpStatus: null },
  { status: "upstream_error", reason: "network", httpStatus: null },
  { status: "unexpected_error", reason: "invalid_ref" },
  { status: "unexpected_error", reason: "invalid_json" },
  { status: "unexpected_error", reason: "missing_fields" },
  { status: "unexpected_error", reason: "thrown" },
];

describe("mapOutcome", () => {
  test("ok maps to 200 with repository", () => {
    const mapped = mapOutcome({ status: "ok", data: REPOSITORY });
    expect(mapped).toEqual({ status: 200, repository: REPOSITORY });
    expect("kind" in mapped).toBe(false);
  });

  test("not_found maps to 404 not_found", () => {
    expect(mapOutcome({ status: "not_found" })).toEqual({
      status: 404,
      kind: "not_found",
    });
  });

  test("rate_limited maps to 403 with retry-after", () => {
    expect(
      mapOutcome({
        status: "rate_limited",
        resetAt: 1735689647000,
        retryAfterSeconds: 47,
      }),
    ).toEqual({
      status: 403,
      kind: "rate_limited",
      headers: { "Retry-After": "47" },
    });
  });

  test("rate_limited floors fractional hints", () => {
    const mapped = mapOutcome({
      status: "rate_limited",
      resetAt: null,
      retryAfterSeconds: 12.9,
    });
    expect(mapped.status === 403 && mapped.headers).toEqual({
      "Retry-After": "12",
    });
  });

  test("rate_limited without hint has no retry-after", () => {
    for (const hint of [null, 0, 0.5]) {
      expect(
        mapOutcome({
          status: "rate_limited",
          resetAt: null,
          retryAfterSeconds: hint,
        }),
      ).toEqual({ status: 403, kind: "rate_limited" });
    }
  });

  test("upstream_error maps to 502", () => {
    const reasons: UpstreamErrorReason[] = [
      "http_status",
      "timeout",
      "network",
    ];
    for (const reason of reasons) {
      expect(
        mapOutcome({ status: "upstream_error", reason, httpStatus: null }),
      ).toEqual({ status: 502, kind: "upstream_error" });
    }
  });

  test("unexpected_error maps to 500", () => {
    const reasons: UnexpectedErrorReason[] = [
      "invalid_json",
      "missing_fields",
      "thrown",
    ];
    for (const reason of reasons) {
      expect(mapOutcome({ status: "unexpected_error", reason })).toEqual({
        status: 500,
        kind: "unexpected_error",
      });
    }
  });

  test("invalid_ref reason maps to 400 invalid_request", () => {
    expect(
      mapOutcome({ status: "unexpected_error", reason: "invalid_ref" }),
    ).toEqual({ status: 400, kind: "invalid_request" });
  });

  test("kinds are f04 kinds", () => {
    const kinds = Object.values(ERROR_CARD_KINDS);
    for (const outcome of EVERY_OUTCOME) {
      const mapped = mapOutcome(outcome);
      if (mapped.status !== 200) expect(kinds).toContain(mapped.kind);
    }
  });

  test("mapping is exhaustive", () => {
    for (const outcome of EVERY_OUTCOME) {
      const mapped = mapOutcome(outcome);
      expect(STATUSES).toContain(mapped.status);
      expect(mapped.status === 200).toBe(outcome.status === "ok");
    }
    expect(
      mapOutcome({ status: "bogus" } as unknown as RepositoryLookupOutcome),
    ).toBeUndefined();
  });
});
