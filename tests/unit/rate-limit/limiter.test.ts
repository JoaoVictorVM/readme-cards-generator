import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { Redis } from "@upstash/redis";
import { RATE_LIMIT_KEY_PREFIXES } from "@/lib/rate-limit/config";
import { createLimiterProvider } from "@/lib/rate-limit/limiter";
import {
  createRedisClientProvider,
  type RedisCredentials,
} from "@/lib/rate-limit/redis-client";

const names = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"] as const;

function clearEnv() {
  for (const name of names) delete process.env[name];
}

function constructing() {
  const constructed: RedisCredentials[] = [];
  const construct = (credentials: RedisCredentials): Redis => {
    constructed.push(credentials);
    return {} as Redis;
  };
  return { constructed, construct };
}

let warnSpy: ReturnType<typeof spyOn>;
let errorSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  clearEnv();
  warnSpy = spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  clearEnv();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
});

describe("limiter registry", () => {
  test("limiter absent when url missing", () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const { constructed, construct } = constructing();
    const provider = createLimiterProvider(
      createRedisClientProvider({ construct }),
    );
    expect(provider("card")).toBeNull();
    expect(constructed).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      "UPSTASH_REDIS_REST_URL",
    );
  });

  test("limiter absent when token missing", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    const { constructed, construct } = constructing();
    const provider = createLimiterProvider(
      createRedisClientProvider({ construct }),
    );
    expect(provider("validate")).toBeNull();
    expect(constructed).toHaveLength(0);
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      "UPSTASH_REDIS_REST_TOKEN",
    );
  });

  test("limiter absent when values blank", () => {
    process.env.UPSTASH_REDIS_REST_URL = "   ";
    process.env.UPSTASH_REDIS_REST_TOKEN = "";
    const { constructed, construct } = constructing();
    const provider = createLimiterProvider(
      createRedisClientProvider({ construct }),
    );
    expect(provider("card")).toBeNull();
    expect(constructed).toHaveLength(0);
  });

  test("disabled warning is emitted once per instance", () => {
    const provider = createLimiterProvider(createRedisClientProvider());
    for (let i = 0; i < 5; i += 1) provider("card");
    provider("validate");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  test("limiter memoized per namespace", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const { constructed, construct } = constructing();
    const provider = createLimiterProvider(
      createRedisClientProvider({ construct }),
    );
    const first = provider("card");
    const second = provider("card");
    provider("validate");
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(constructed).toHaveLength(1);
    expect(constructed[0]).toEqual({
      url: "https://example.upstash.io",
      token: "token",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test("each namespace has its own prefix", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    const provider = createLimiterProvider(
      createRedisClientProvider({ construct: constructing().construct }),
    );
    expect(provider("card")?.prefix).toBe(RATE_LIMIT_KEY_PREFIXES.card);
    expect(provider("validate")?.prefix).toBe(RATE_LIMIT_KEY_PREFIXES.validate);
    expect(RATE_LIMIT_KEY_PREFIXES.card).not.toBe(
      RATE_LIMIT_KEY_PREFIXES.validate,
    );
  });

  test("module import has no side effects", async () => {
    const upstash = await import("@upstash/redis");
    const constructSpy = spyOn(upstash, "Redis");
    await import("@/lib/rate-limit/index");
    await import("@/lib/rate-limit/limiter");
    await import("@/lib/rate-limit/redis-client");
    expect(constructSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    constructSpy.mockRestore();
  });
});
