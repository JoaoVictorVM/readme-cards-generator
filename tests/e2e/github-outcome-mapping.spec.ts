import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/lib/site-config";

const GITHUB_TIMEOUT_MS = 5000;

// The card endpoint (F05) does not exist yet. These specs are authored against
// the F02 contract and are enabled once that consumer lands.
test.describe.skip("github outcome mapping through the card endpoint", () => {
  test("normalized fields render in card positions", () => {});
  test("card endpoint maps not_found to 404", () => {});
  test("card endpoint maps rate_limited to 403", () => {});
  test("card endpoint maps upstream_error to 502", () => {});
  test("card endpoint maps unexpected_error to 500", () => {});
  test("both endpoints agree on existence", () => {});
});

test.describe("github outcome mapping through the validation endpoint", () => {
  // Only `ok` and `not_found` can be provoked against the live API. The
  // `rate_limited`, `upstream_error` and `unexpected_error` mappings are
  // asserted through the dependency seam in
  // tests/unit/validate/handle-validate-request.test.ts.
  test("validation endpoint maps outcomes to error codes", async ({
    request,
  }) => {
    const { owner, name } = siteConfig.showcaseRepository;
    const existing = await request.get(
      `/api/validate?owner=${owner}&repo=${name}`,
    );
    expect(existing.status()).toBe(200);
    expect(await existing.json()).toEqual({
      exists: true,
      owner,
      repo: name,
    });

    const missing = await request.get(
      "/api/validate?owner=badge-generate-no-such-owner-7f3a&repo=nope",
    );
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toEqual({
      exists: false,
      error: "not_found",
    });
  });

  // Playwright cannot observe server-side outbound calls; the zero-call half of
  // the criterion is asserted by the unit recorder. Here the response time
  // staying under the GitHub budget evidences that no lookup happened.
  test("validation endpoint rejects invalid ref before lookup", async ({
    request,
  }) => {
    const queries = ["?owner=a%2Fb&repo=c", `?owner=a&repo=${"r".repeat(101)}`];
    for (const query of queries) {
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
});
