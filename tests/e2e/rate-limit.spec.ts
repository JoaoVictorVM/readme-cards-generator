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

// The card endpoint (F05) does not exist yet. These specs are authored against
// the F06 module contract and are enabled once that consumer lands.
test.describe.skip("rate limit through the card endpoint", () => {
  test("sixty first request is rejected", () => {});
  test("card rejection is an svg card", () => {});
  test("card exhaustion does not block validate", () => {});
  test("rejected request makes no github call", () => {});
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
