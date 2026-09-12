import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { Repository, RepositoryLookupOutcome } from "@/lib/github";
import {
  RATE_LIMIT_NAMESPACES,
  type RateLimitDecision,
  type RateLimitNamespace,
} from "@/lib/rate-limit";
import { handleValidateRequest } from "@/lib/validate";
import type {
  RateLimitCheck,
  RepositoryLookup,
  ValidationDependencies,
} from "@/lib/validate/types";

const NOW = 1735689600000;

const REPOSITORY: Repository = {
  owner: "vercel",
  name: "next.js",
  fullName: "vercel/next.js",
  language: "JavaScript",
  pushedAt: "2025-01-01T00:00:00Z",
  htmlUrl: "https://github.com/vercel/next.js",
};

const ALLOWED: RateLimitDecision = {
  allowed: true,
  limit: 60,
  remaining: 59,
  resetAt: NOW + 60_000,
  retryAfterSeconds: 1,
  identifier: "203.0.113.7",
  degraded: null,
};

const REJECTED: RateLimitDecision = {
  allowed: false,
  limit: 60,
  remaining: 0,
  resetAt: NOW + 37_000,
  retryAfterSeconds: 37,
  identifier: "203.0.113.7",
  degraded: null,
};

function request(query: string): Request {
  return new Request(`http://localhost/api/validate${query}`, {
    headers: { "x-forwarded-for": "203.0.113.7" },
  });
}

type LookupCall = { owner: string; repo: string };

function fakeLookup(handler: (call: LookupCall) => RepositoryLookupOutcome): {
  calls: LookupCall[];
  lookup: RepositoryLookup;
} {
  const calls: LookupCall[] = [];
  const lookup: RepositoryLookup = async (owner, repo) => {
    const call = { owner, repo };
    calls.push(call);
    return handler(call);
  };
  return { calls, lookup };
}

type LimitCall = { headers: Headers; namespace: RateLimitNamespace };

function fakeLimiter(decision: RateLimitDecision): {
  calls: LimitCall[];
  check: RateLimitCheck;
} {
  const calls: LimitCall[] = [];
  const check: RateLimitCheck = async (input, namespace) => {
    const headers = input instanceof Headers ? input : input.headers;
    calls.push({ headers, namespace });
    return decision;
  };
  return { calls, check };
}

type Harness = ValidationDependencies & {
  lookupCalls: LookupCall[];
  limitCalls: LimitCall[];
};

function deps(
  outcome: RepositoryLookupOutcome = { status: "ok", data: REPOSITORY },
  decision: RateLimitDecision = ALLOWED,
): Harness {
  const lookup = fakeLookup(() => outcome);
  const limiter = fakeLimiter(decision);
  return {
    fetchRepository: lookup.lookup,
    checkRateLimit: limiter.check,
    lookupCalls: lookup.calls,
    limitCalls: limiter.calls,
  };
}

function expectMandatoryHeaders(response: Response): void {
  expect(response.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
}

let warnSpy: ReturnType<typeof spyOn>;
let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("handleValidateRequest", () => {
  test("existing repository returns 200", async () => {
    const d = deps();
    const response = await handleValidateRequest(
      request("?owner=Vercel&repo=Next.js"),
      d,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      exists: true,
      owner: "vercel",
      repo: "next.js",
    });
    expect(d.lookupCalls).toEqual([{ owner: "Vercel", repo: "Next.js" }]);
  });

  test("nonexistent repository returns 404", async () => {
    const d = deps({ status: "not_found" });
    const response = await handleValidateRequest(
      request("?owner=nobody&repo=nothing"),
      d,
    );
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      exists: false,
      error: "not_found",
    });
    expect(d.lookupCalls).toHaveLength(1);
  });

  test("missing owner returns 400 without lookup", async () => {
    const d = deps();
    const response = await handleValidateRequest(request("?repo=b"), d);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("missing repo returns 400 without lookup", async () => {
    const d = deps();
    const response = await handleValidateRequest(request("?owner=a"), d);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("invalid segment returns 400 without lookup", async () => {
    const d = deps();
    const slash = await handleValidateRequest(
      request("?owner=a%2Fb&repo=c"),
      d,
    );
    expect(slash.status).toBe(400);
    const long = await handleValidateRequest(
      request(`?owner=a&repo=${"r".repeat(101)}`),
      d,
    );
    expect(long.status).toBe(400);
    expect(await long.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("github quota returns 403 distinct from 429", async () => {
    const d = deps({
      status: "rate_limited",
      resetAt: null,
      retryAfterSeconds: null,
    });
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      exists: false,
      error: "rate_limited",
    });
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
    expect(response.headers.get("retry-after")).toBeNull();
  });

  test("github quota retry-after from outcome", async () => {
    const d = deps({
      status: "rate_limited",
      resetAt: NOW + 47_000,
      retryAfterSeconds: 47,
    });
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(403);
    expect(response.headers.get("retry-after")).toBe("47");
  });

  test("upstream error returns 502", async () => {
    const d = deps({
      status: "upstream_error",
      reason: "timeout",
      httpStatus: null,
    });
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      exists: false,
      error: "upstream_error",
    });
  });

  test("unexpected error returns 500", async () => {
    const d = deps({ status: "unexpected_error", reason: "missing_fields" });
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      exists: false,
      error: "unexpected_error",
    });
  });

  test("rate limit rejection returns 429 before parsing", async () => {
    const d = deps({ status: "ok", data: REPOSITORY }, REJECTED);
    const response = await handleValidateRequest(request("?owner=a"), d);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      exists: false,
      error: "rate_limited",
    });
    expect(response.headers.get("retry-after")).toBe("37");
    expect(response.headers.get("x-ratelimit-limit")).toBe("60");
    expect(response.headers.get("x-ratelimit-remaining")).toBe("0");
    expect(response.headers.get("x-ratelimit-reset")).toBe(
      String(NOW + 37_000),
    );
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("limiter called with validate namespace", async () => {
    const d = deps();
    await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(d.limitCalls).toHaveLength(1);
    expect(d.limitCalls[0]?.namespace).toBe(RATE_LIMIT_NAMESPACES.validate);
    expect(d.limitCalls[0]?.headers.get("x-forwarded-for")).toBe("203.0.113.7");
  });

  test("degraded decision is treated as allow", async () => {
    const d = deps(
      { status: "not_found" },
      { ...ALLOWED, degraded: "not_configured" },
    );
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(404);
    for (const [name] of response.headers) {
      expect(name.toLowerCase()).not.toContain("degrad");
    }
    expect(response.headers.get("x-ratelimit-limit")).toBeNull();
  });

  test("every response carries no-store", async () => {
    const cases: Array<[string, ValidationDependencies]> = [
      ["?owner=a&repo=b", deps()],
      ["?owner=a&repo=b", deps({ status: "not_found" })],
      ["?owner=a", deps()],
      ["?owner=a%2Fb&repo=c", deps()],
      [
        "?owner=a&repo=b",
        deps({ status: "rate_limited", resetAt: null, retryAfterSeconds: 3 }),
      ],
      [
        "?owner=a&repo=b",
        deps({ status: "upstream_error", reason: "network", httpStatus: null }),
      ],
      [
        "?owner=a&repo=b",
        deps({ status: "unexpected_error", reason: "thrown" }),
      ],
      ["?owner=a&repo=b", deps({ status: "ok", data: REPOSITORY }, REJECTED)],
    ];
    for (const [query, d] of cases) {
      const response = await handleValidateRequest(request(query), d);
      expectMandatoryHeaders(response);
    }
  });

  test("thrown lookup yields 500 json", async () => {
    const d = deps();
    d.fetchRepository = () => {
      throw new Error("boom http://localhost/api/validate?owner=a");
    };
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      exists: false,
      error: "unexpected_error",
    });
    expectMandatoryHeaders(response);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const line = String(errorSpy.mock.calls[0]?.[0]);
    expect(line).toContain("route=/api/validate");
    expect(line).toContain("error=Error");
    expect(line).not.toContain("owner=a");
  });

  test("thrown limiter yields 500 json", async () => {
    const d = deps();
    d.checkRateLimit = async () => {
      throw new TypeError("redis exploded");
    };
    const response = await handleValidateRequest(request("?owner=a&repo=b"), d);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      exists: false,
      error: "unexpected_error",
    });
    expectMandatoryHeaders(response);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(d.lookupCalls).toHaveLength(0);
  });

  test("body shapes are closed", async () => {
    const success = await handleValidateRequest(
      request("?owner=a&repo=b"),
      deps(),
    );
    expect(Object.keys(await success.json()).sort()).toEqual([
      "exists",
      "owner",
      "repo",
    ]);

    const failures: Array<[string, ValidationDependencies]> = [
      ["?owner=a", deps()],
      ["?owner=a&repo=b", deps({ status: "not_found" })],
      [
        "?owner=a&repo=b",
        deps({ status: "rate_limited", resetAt: null, retryAfterSeconds: 9 }),
      ],
      [
        "?owner=a&repo=b",
        deps({ status: "upstream_error", reason: "timeout", httpStatus: null }),
      ],
      [
        "?owner=a&repo=b",
        deps({ status: "unexpected_error", reason: "invalid_json" }),
      ],
      ["?owner=a&repo=b", deps({ status: "ok", data: REPOSITORY }, REJECTED)],
    ];
    for (const [query, d] of failures) {
      const response = await handleValidateRequest(request(query), d);
      expect(Object.keys(await response.json()).sort()).toEqual([
        "error",
        "exists",
      ]);
    }
  });

  test("production call omits dependencies", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const response = await handleValidateRequest(request("?owner=a%2Fb"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
    expectMandatoryHeaders(response);
  });
});
