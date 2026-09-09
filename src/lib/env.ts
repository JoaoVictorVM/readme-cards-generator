function read(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getGithubToken(): string | undefined {
  return read("GITHUB_TOKEN");
}

export function getUpstashRedisRestUrl(): string | undefined {
  return read("UPSTASH_REDIS_REST_URL");
}

export function getUpstashRedisRestToken(): string | undefined {
  return read("UPSTASH_REDIS_REST_TOKEN");
}

export type Env = {
  githubToken: string | undefined;
  upstashRedisRestUrl: string | undefined;
  upstashRedisRestToken: string | undefined;
};

export function getEnv(): Env {
  return {
    githubToken: getGithubToken(),
    upstashRedisRestUrl: getUpstashRedisRestUrl(),
    upstashRedisRestToken: getUpstashRedisRestToken(),
  };
}
