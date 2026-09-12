import { Redis } from "@upstash/redis";
import { getUpstashRedisRestToken, getUpstashRedisRestUrl } from "@/lib/env";
import { logWarn } from "@/lib/logger";

export type RedisCredentials = { url: string; token: string };

export type RedisClientProviderDependencies = {
  readCredentials?: () => {
    url: string | undefined;
    token: string | undefined;
  };
  construct?: (credentials: RedisCredentials) => Redis;
};

export type RedisClientProvider = {
  getClient(): Redis | null;
};

function readFromEnv() {
  return {
    url: getUpstashRedisRestUrl(),
    token: getUpstashRedisRestToken(),
  };
}

export function createRedisClientProvider(
  dependencies: RedisClientProviderDependencies = {},
): RedisClientProvider {
  const readCredentials = dependencies.readCredentials ?? readFromEnv;
  const construct =
    dependencies.construct ??
    (({ url, token }: RedisCredentials) => new Redis({ url, token }));

  // Resolved once per serverless instance: `undefined` means not yet
  // evaluated, `null` means the limiter is disabled for this instance.
  let client: Redis | null | undefined;

  return {
    getClient() {
      if (client !== undefined) return client;
      const { url, token } = readCredentials();
      if (!url || !token) {
        const missing = !url
          ? "UPSTASH_REDIS_REST_URL"
          : "UPSTASH_REDIS_REST_TOKEN";
        logWarn("rate limiter disabled: upstash credentials missing", {
          missing,
        });
        client = null;
        return client;
      }
      client = construct({ url, token });
      return client;
    },
  };
}

export const defaultRedisClientProvider = createRedisClientProvider();
