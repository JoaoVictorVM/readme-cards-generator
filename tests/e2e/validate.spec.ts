import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/lib/site-config";

const GITHUB_TIMEOUT_MS = 5000;
const MISSING = { owner: "badge-generate-no-such-owner-7f3a", repo: "nope" };

test.describe("validate endpoint", () => {
  test("existing repository returns 200 shape", async ({ request }) => {
    const { owner, name } = siteConfig.showcaseRepository;
    const response = await request.get(
      `/api/validate?owner=${owner}&repo=${name}`,
    );
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(
      "application/json; charset=utf-8",
    );
    expect(await response.json()).toEqual({
      exists: true,
      owner,
      repo: name,
    });
  });

  test("nonexistent repository returns 404 shape", async ({ request }) => {
    const response = await request.get(
      `/api/validate?owner=${MISSING.owner}&repo=${MISSING.repo}`,
    );
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({
      exists: false,
      error: "not_found",
    });
  });

  test("missing parameter returns 400 quickly", async ({ request }) => {
    for (const query of ["?owner=x", "?repo=y"]) {
      const started = Date.now();
      const response = await request.get(`/api/validate${query}`);
      const elapsed = Date.now() - started;
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({
        exists: false,
        error: "invalid_input",
      });
      expect(elapsed).toBeLessThan(GITHUB_TIMEOUT_MS);
    }
  });

  test("malformed parameter returns 400", async ({ request }) => {
    const response = await request.get("/api/validate?owner=a%2Fb&repo=c");
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      exists: false,
      error: "invalid_input",
    });
  });

  test("every response carries no-store", async ({ request }) => {
    const { owner, name } = siteConfig.showcaseRepository;
    const queries = [
      `?owner=${owner}&repo=${name}`,
      `?owner=${MISSING.owner}&repo=${MISSING.repo}`,
      "?owner=x",
    ];
    for (const query of queries) {
      const response = await request.get(`/api/validate${query}`);
      const headers = response.headers();
      expect(headers["cache-control"]).toBe("no-store");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["content-type"]).toBe("application/json; charset=utf-8");
    }
  });

  test("head carries same headers", async ({ request }) => {
    const response = await request.head("/api/validate?owner=x");
    expect(response.status()).toBe(400);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });
});
