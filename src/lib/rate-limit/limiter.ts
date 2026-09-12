import { Ratelimit } from "@upstash/ratelimit";
import {
  RATE_LIMIT_KEY_PREFIXES,
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_TIMEOUT_MS,
  RATE_LIMIT_WINDOW,
} from "@/lib/rate-limit/config";
import {
  defaultRedisClientProvider,
  type RedisClientProvider,
} from "@/lib/rate-limit/redis-client";
import type {
  Limiter,
  LimiterProvider,
  RateLimitNamespace,
} from "@/lib/rate-limit/types";

export function createLimiterProvider(
  clientProvider: RedisClientProvider = defaultRedisClientProvider,
): LimiterProvider {
  const limiters = new Map<RateLimitNamespace, Limiter>();

  return (namespace) => {
    const memoized = limiters.get(namespace);
    if (memoized) return memoized;

    const redis = clientProvider.getClient();
    if (redis === null) return null;

    const prefix = RATE_LIMIT_KEY_PREFIXES[namespace];
    const ratelimit = new Ratelimit({
      redis,
      prefix,
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW),
      analytics: false,
      ephemeralCache: new Map(),
      timeout: RATE_LIMIT_TIMEOUT_MS,
    });

    const limiter: Limiter = {
      prefix,
      async limit(identifier) {
        const { success, limit, remaining, reset } =
          await ratelimit.limit(identifier);
        return { success, limit, remaining, reset };
      },
    };
    limiters.set(namespace, limiter);
    return limiter;
  };
}

export const defaultLimiterProvider = createLimiterProvider();
