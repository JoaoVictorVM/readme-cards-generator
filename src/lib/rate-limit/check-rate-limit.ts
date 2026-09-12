import { logError } from "@/lib/logger";
import { resolveClientIdentifier } from "@/lib/rate-limit/client-ip";
import {
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_TIMEOUT_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/rate-limit/config";
import { defaultLimiterProvider } from "@/lib/rate-limit/limiter";
import type {
  LimiterResult,
  RateLimitDecision,
  RateLimitDegradation,
  RateLimitDependencies,
  RateLimitNamespace,
} from "@/lib/rate-limit/types";

const TIMEOUT = Symbol("rate-limit-timeout");

export function retryAfterSeconds(resetAt: number, now: number): number {
  const seconds = Math.ceil((resetAt - now) / 1000);
  return Math.min(Math.max(seconds, 1), RATE_LIMIT_WINDOW_SECONDS);
}

function degradedDecision(
  reason: RateLimitDegradation,
  identifier: string,
  now: number,
): RateLimitDecision {
  return {
    allowed: true,
    limit: RATE_LIMIT_REQUESTS,
    remaining: RATE_LIMIT_REQUESTS,
    resetAt: now + RATE_LIMIT_WINDOW_MS,
    retryAfterSeconds: 1,
    degraded: reason,
    identifier,
  };
}

function isLimiterResult(value: unknown): value is LimiterResult {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === "boolean" &&
    Number.isFinite(candidate.limit) &&
    Number.isFinite(candidate.remaining) &&
    Number.isFinite(candidate.reset)
  );
}

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

// Only a short digest reaches the logs so an address never lands in clear.
function identifierDigest(identifier: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < identifier.length; index += 1) {
    hash ^= identifier.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export async function checkRateLimit(
  input: Request | Headers,
  namespace: RateLimitNamespace,
  dependencies: RateLimitDependencies = {},
): Promise<RateLimitDecision> {
  const now = dependencies.now ?? (() => Date.now());
  const timeoutMs = dependencies.timeoutMs ?? RATE_LIMIT_TIMEOUT_MS;
  let identifier = "anonymous";

  try {
    const headers = input instanceof Headers ? input : input.headers;
    identifier = resolveClientIdentifier(headers);

    const limiterProvider =
      dependencies.limiterProvider ?? defaultLimiterProvider;
    const limiter = limiterProvider(namespace);
    if (limiter === null) {
      return degradedDecision("not_configured", identifier, now());
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const expiry = new Promise<typeof TIMEOUT>((resolve) => {
      timer = setTimeout(() => resolve(TIMEOUT), timeoutMs);
    });

    let outcome: LimiterResult | typeof TIMEOUT;
    try {
      // The in-flight call is abandoned on expiry; its eventual result is
      // discarded and a late rejection must not surface as unhandled.
      const pending = limiter.limit(identifier);
      pending.catch(() => {});
      outcome = await Promise.race([pending, expiry]);
    } finally {
      clearTimeout(timer);
    }

    if (outcome === TIMEOUT) {
      logError("rate limit check timed out", {
        namespace,
        budgetMs: timeoutMs,
      });
      return degradedDecision("timeout", identifier, now());
    }

    if (!isLimiterResult(outcome)) {
      logError("rate limit check returned an unexpected result", {
        namespace,
        identifier: identifierDigest(identifier),
      });
      return degradedDecision("error", identifier, now());
    }

    const current = now();
    const base = {
      limit: outcome.limit,
      resetAt: outcome.reset,
      retryAfterSeconds: retryAfterSeconds(outcome.reset, current),
      identifier,
    };

    if (!outcome.success) {
      return { ...base, allowed: false, remaining: 0, degraded: null };
    }
    return {
      ...base,
      allowed: true,
      remaining: Math.max(outcome.remaining, 0),
      degraded: null,
    };
  } catch (error) {
    logError("rate limit check failed", {
      namespace,
      identifier: identifierDigest(identifier),
      error: errorName(error),
    });
    return degradedDecision("error", identifier, now());
  }
}
