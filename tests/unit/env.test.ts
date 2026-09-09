import { afterEach, describe, expect, test } from "bun:test";
import {
  getEnv,
  getGithubToken,
  getUpstashRedisRestToken,
  getUpstashRedisRestUrl,
} from "@/lib/env";

const names = [
  "GITHUB_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

function clear() {
  for (const name of names) delete process.env[name];
}

afterEach(clear);

describe("env accessor", () => {
  test("all vars absent returns undefined", () => {
    clear();
    expect(getGithubToken()).toBeUndefined();
    expect(getUpstashRedisRestUrl()).toBeUndefined();
    expect(getUpstashRedisRestToken()).toBeUndefined();
    expect(getEnv()).toEqual({
      githubToken: undefined,
      upstashRedisRestUrl: undefined,
      upstashRedisRestToken: undefined,
    });
  });

  test("present var is returned", () => {
    clear();
    process.env.GITHUB_TOKEN = "ghp_example";
    expect(getGithubToken()).toBe("ghp_example");
  });

  test("blank var treated as absent", () => {
    clear();
    process.env.GITHUB_TOKEN = "   ";
    expect(getGithubToken()).toBeUndefined();
  });
});
