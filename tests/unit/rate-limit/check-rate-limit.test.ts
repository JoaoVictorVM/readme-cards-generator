import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  checkRateLimit,
  retryAfterSeconds,
} from "@/lib/rate-limit/check-rate-limit";
import {
  RATE_LIMIT_KEY_PREFIXES,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/rate-limit/config";
import { createLimiterProvider } from "@/lib/rate-limit/limiter";
import { createRedisClientProvider } from "@/lib/rate-limit/redis-client";
import type {
  Limiter,
  LimiterProvider,
  LimiterResult,
  RateLimitDegradation,
  RateLimitNamespace,
} from "@/lib/rate-limit/types";

const NOW = 1735689600000;
const IP = "203.0.113.7";

function request(forwarded?: string): Request {
  const headers = new Headers();
  if (forwarded !== undefined) headers.set("x-forwarded-for", forwarded);
  return new Request("http://localhost/api/repo/a/b", { headers });
}

type Call = {
  namespace: RateLimitNamespace;
  prefix: string;
  identifier: string;
};

function fakeProvider(
  handler: (call: Call) => Promise<LimiterResult> | LimiterResult,
): { calls: Call[]; provider: LimiterProvider } {
  const calls: Call[] = [];
  const provider: LimiterProvider = (namespace) => {
    const prefix = RATE_LIMIT_KEY_PREFIXES[namespace];
    const limiter: Limiter = {
      prefix,
      async limit(identifier) {
        const call = { namespace, prefix, identifier };
        calls.push(call);
        return handler(call);
      },
    };
    return limiter;
  };
  return { calls, provider };
}

function result(overrides: Partial<LimiterResult> = {}): LimiterResult {
  return {
    success: true,
    limit: RATE_LIMIT_REQUESTS,
    remaining: 59,
    reset: NOW + 37_000,
    ...overrides,
  };
}

const clock = () => NOW;

let warnSpy: ReturnType<typeof spyOn>;
let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("checkRateLimit", () => {
  test("under limit allows and reports remaining", async () => {
    const { provider } = fakeProvider(() => result({ remaining: 41 }));
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision).toEqual({
      allowed: true,
      limit: RATE_LIMIT_REQUESTS,
      remaining: 41,
      resetAt: NOW + 37_000,
      retryAfterSeconds: 37,
      degraded: null,
      identifier: IP,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("at limit rejects with retry after", async () => {
    const { provider } = fakeProvider(() =>
      result({ success: false, remaining: 0 }),
    );
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.remaining).toBe(0);
    expect(decision.degraded).toBeNull();
    expect(decision.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  test("retry after is derived from reset instant", () => {
    expect(retryAfterSeconds(NOW + 37_000, NOW)).toBe(37);
    expect(retryAfterSeconds(NOW + 36_001, NOW)).toBe(37);
    expect(retryAfterSeconds(NOW + 36_000, NOW)).toBe(36);
  });

  test("retry after never below one second", async () => {
    expect(retryAfterSeconds(NOW - 5_000, NOW)).toBe(1);
    expect(retryAfterSeconds(NOW, NOW)).toBe(1);
    const { provider } = fakeProvider(() =>
      result({ success: false, remaining: 0, reset: NOW - 5_000 }),
    );
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision.retryAfterSeconds).toBe(1);
  });

  test("retry after never exceeds window", async () => {
    expect(retryAfterSeconds(NOW + 10 * RATE_LIMIT_WINDOW_MS, NOW)).toBe(
      RATE_LIMIT_WINDOW_SECONDS,
    );
    const { provider } = fakeProvider(() =>
      result({ success: false, remaining: 0, reset: NOW + 999_999_999 }),
    );
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision.retryAfterSeconds).toBe(RATE_LIMIT_WINDOW_SECONDS);
  });

  test("missing credentials allows with not_configured", async () => {
    let constructed = 0;
    const provider = createLimiterProvider(
      createRedisClientProvider({
        construct: () => {
          constructed += 1;
          throw new Error("must not construct");
        },
      }),
    );
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision).toEqual({
      allowed: true,
      limit: RATE_LIMIT_REQUESTS,
      remaining: RATE_LIMIT_REQUESTS,
      resetAt: NOW + RATE_LIMIT_WINDOW_MS,
      retryAfterSeconds: 1,
      degraded: "not_configured",
      identifier: IP,
    });
    expect(constructed).toBe(0);
  });

  test("disabled warning logged once", async () => {
    const provider = createLimiterProvider(createRedisClientProvider());
    for (let i = 0; i < 10; i += 1) {
      await checkRateLimit(request(IP), i % 2 ? "card" : "validate", {
        limiterProvider: provider,
      });
    }
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("thrown error allows with error reason", async () => {
    const { provider } = fakeProvider(() => {
      throw new TypeError("fetch failed");
    });
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.degraded).toBe("error");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  test("rejected promise allows with error reason", async () => {
    const { provider } = fakeProvider(() =>
      Promise.reject(new Error("upstream 500")),
    );
    const decision = await checkRateLimit(request(IP), "validate", {
      limiterProvider: provider,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.degraded).toBe("error");
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  test("slow limiter allows with timeout reason", async () => {
    const { provider } = fakeProvider(
      () => new Promise((resolve) => setTimeout(() => resolve(result()), 500)),
    );
    const started = performance.now();
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      now: clock,
      timeoutMs: 50,
    });
    const elapsed = performance.now() - started;
    expect(decision.allowed).toBe(true);
    expect(decision.degraded).toBe("timeout");
    expect(elapsed).toBeLessThan(400);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0]?.[0])).toContain("budgetMs=50");
  });

  test("unexpected limiter result allows with error reason", async () => {
    const { provider } = fakeProvider(
      () => ({ garbage: true }) as unknown as LimiterResult,
    );
    const decision = await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.degraded).toBe("error");
  });

  test("degraded decision has complete field set", async () => {
    const scenarios: Array<[RateLimitDegradation, LimiterProvider]> = [
      ["not_configured", () => null],
      [
        "error",
        fakeProvider(() => {
          throw new Error("boom");
        }).provider,
      ],
      ["timeout", fakeProvider(() => new Promise(() => {})).provider],
    ];
    for (const [reason, limiterProvider] of scenarios) {
      const decision = await checkRateLimit(request(IP), "card", {
        limiterProvider,
        now: clock,
        timeoutMs: 20,
      });
      expect(decision.degraded).toBe(reason);
      expect(decision.allowed).toBe(true);
      expect(decision.limit).toBe(RATE_LIMIT_REQUESTS);
      expect(decision.remaining).toBe(RATE_LIMIT_REQUESTS);
      expect(decision.resetAt).toBe(NOW + RATE_LIMIT_WINDOW_MS);
      expect(decision.retryAfterSeconds).toBe(1);
      expect(decision.identifier).toBe(IP);
    }
  });

  test("namespaces use distinct buckets", async () => {
    const { calls, provider } = fakeProvider(() => result());
    await checkRateLimit(request(IP), "card", { limiterProvider: provider });
    await checkRateLimit(request(IP), "validate", {
      limiterProvider: provider,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]?.prefix).not.toBe(calls[1]?.prefix);
    expect(calls[0]?.identifier).toBe(IP);
    expect(calls[1]?.identifier).toBe(IP);
  });

  test("never throws for any dependency failure", async () => {
    const providers: LimiterProvider[] = [
      () => {
        throw new Error("provider exploded");
      },
      () => null,
      () => ({
        prefix: "x",
        limit: () => {
          throw "not an error";
        },
      }),
      () => ({ prefix: "x", limit: () => Promise.reject("string reason") }),
      () => ({ prefix: "x", limit: () => new Promise(() => {}) }),
      () => ({
        prefix: "x",
        limit: async () => null as unknown as LimiterResult,
      }),
    ];
    for (const limiterProvider of providers) {
      const decision = await checkRateLimit(request(IP), "card", {
        limiterProvider,
        timeoutMs: 20,
      });
      expect(decision.allowed).toBe(true);
    }
    const decision = await checkRateLimit(null as unknown as Request, "card", {
      limiterProvider: fakeProvider(() => result()).provider,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.degraded).toBe("error");
  });

  test("identifier not logged in clear", async () => {
    const { provider } = fakeProvider(() => {
      throw new Error("boom");
    });
    await checkRateLimit(request(IP), "card", { limiterProvider: provider });
    await checkRateLimit(request(IP), "card", {
      limiterProvider: provider,
      timeoutMs: 20,
    });
    for (const call of errorSpy.mock.calls) {
      expect(String(call[0])).not.toContain(IP);
    }
    expect(errorSpy.mock.calls.length).toBeGreaterThan(0);
  });

  test("accepts a headers object directly", async () => {
    const { calls, provider } = fakeProvider(() => result());
    const headers = new Headers({ "x-forwarded-for": "10.0.0.9, 10.0.0.1" });
    await checkRateLimit(headers, "card", { limiterProvider: provider });
    expect(calls[0]?.identifier).toBe("10.0.0.9");
  });

  test("missing header uses anonymous bucket", async () => {
    const { calls, provider } = fakeProvider(() => result());
    const decision = await checkRateLimit(request(), "card", {
      limiterProvider: provider,
    });
    expect(calls[0]?.identifier).toBe("anonymous");
    expect(decision.identifier).toBe("anonymous");
  });
});
