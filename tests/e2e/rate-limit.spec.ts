import { expect, test } from "@playwright/test";

const REQUESTS = 60;
const INVALID_QUERY = "/api/validate?owner=x";

function hasUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  return url.length > 0 && token.length > 0;
}

// Each run forwards a fresh address so counters from earlier runs never bleed
// into the assertions.
function uniqueForwardedFor() {
  const tail = Math.floor(Math.random() * 250) + 1;
  return `198.51.100.${tail}`;
}

// A 101-character owner makes every request of the burst a cheap 400 that
// never reaches GitHub.
const INVALID_CARD_PATH = `/api/repo/${"o".repeat(101)}/x`;
const GITHUB_TIMEOUT_MS = 5000;

test.describe("rate limit through the card endpoint", () => {
  test.beforeEach(() => {
    test.skip(
      !hasUpstashCredentials(),
      "requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
    );
  });

  test("sixty first request is rejected", async ({ request }) => {
    const headers = { "x-forwarded-for": uniqueForwardedFor() };
    for (let index = 0; index < REQUESTS; index += 1) {
      const response = await request.get(INVALID_CARD_PATH, { headers });
      expect(response.status()).toBe(400);
    }
    const rejected = await request.get(INVALID_CARD_PATH, { headers });
    expect(rejected.status()).toBe(429);
    const retryAfter = Number(rejected.headers()["retry-after"]);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(rejected.headers()["x-ratelimit-limit"]).toBe(String(REQUESTS));
    expect(rejected.headers()["x-ratelimit-remaining"]).toBe("0");
  });

  test("card rejection is an svg card", async ({ request }) => {
    const headers = { "x-forwarded-for": uniqueForwardedFor() };
    for (let index = 0; index < REQUESTS; index += 1) {
      await request.get(INVALID_CARD_PATH, { headers });
    }
    const rejected = await request.get(INVALID_CARD_PATH, { headers });
    expect(rejected.status()).toBe(429);
    expect(rejected.headers()["content-type"]).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(rejected.headers()["cache-control"]).toBe("no-store");
    const body = await rejected.text();
    expect(body.startsWith("<svg")).toBe(true);
    expect(body.endsWith("</svg>")).toBe(true);
    expect(body).toContain(
      "<title>Too many requests, try again in a minute</title>",
    );
  });

  test("card exhaustion does not block validate", async ({ request }) => {
    const headers = { "x-forwarded-for": uniqueForwardedFor() };
    for (let index = 0; index < REQUESTS; index += 1) {
      await request.get(INVALID_CARD_PATH, { headers });
    }
    const rejected = await request.get(INVALID_CARD_PATH, { headers });
    expect(rejected.status()).toBe(429);
    const validate = await request.get(INVALID_QUERY, { headers });
    expect(validate.status()).toBe(400);
  });

  // The zero-call half is asserted by "rate limit rejection returns 429
  // before parsing" in tests/unit/repo-card/handle-repo-card-request.test.ts;
  // here the response time under the GitHub budget evidences no lookup.
  test("rejected request makes no github call", async ({ request }) => {
    const headers = { "x-forwarded-for": uniqueForwardedFor() };
    for (let index = 0; index <= REQUESTS; index += 1) {
      await request.get(INVALID_CARD_PATH, { headers });
    }
    const started = Date.now();
    const rejected = await request.get(INVALID_CARD_PATH, { headers });
    const elapsed = Date.now() - started;
    expect(rejected.status()).toBe(429);
    expect(elapsed).toBeLessThan(GITHUB_TIMEOUT_MS);
  });
});

test.describe("rate limit through the validation endpoint", () => {
  test("validate rejection is json", async ({ request }) => {
    test.skip(
      !hasUpstashCredentials(),
      "requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN",
    );
    const headers = { "x-forwarded-for": uniqueForwardedFor() };

    for (let index = 0; index < REQUESTS; index += 1) {
      const response = await request.get(INVALID_QUERY, { headers });
      expect(response.status()).toBe(400);
    }

    const rejected = await request.get(INVALID_QUERY, { headers });
    expect(rejected.status()).toBe(429);
    expect(rejected.headers()["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
    expect(rejected.headers()["cache-control"]).toBe("no-store");
    expect(await rejected.json()).toEqual({
      exists: false,
      error: "rate_limited",
    });
    const retryAfter = Number(rejected.headers()["retry-after"]);
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(rejected.headers()["x-ratelimit-limit"]).toBe(String(REQUESTS));
    expect(rejected.headers()["x-ratelimit-remaining"]).toBe("0");
  });

  test("all requests allowed without credentials", async ({ request }) => {
    test.skip(
      hasUpstashCredentials(),
      "only meaningful when the limiter fails open",
    );
    const headers = { "x-forwarded-for": uniqueForwardedFor() };

    for (let index = 0; index < REQUESTS + 10; index += 1) {
      const response = await request.get(INVALID_QUERY, { headers });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({
        exists: false,
        error: "invalid_input",
      });
    }
  });
});
