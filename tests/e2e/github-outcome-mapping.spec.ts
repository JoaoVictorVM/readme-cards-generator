import { expect, test } from "@playwright/test";
import { siteConfig } from "../../src/lib/site-config";

const GITHUB_TIMEOUT_MS = 5000;

const MISSING = { owner: "badge-generate-no-such-owner-7f3a", repo: "nope" };

function title(markup = "") {
  return /<title>([^<]*)<\/title>/.exec(markup)?.[1] ?? "";
}

function textAt(markup = "", x = 0, y = 0) {
  const pattern = new RegExp(`<text x="${x}" y="${y}"[^>]*>([^<]*)</text>`);
  return pattern.exec(markup)?.[1] ?? "";
}

test.describe("github outcome mapping through the card endpoint", () => {
  test("normalized fields render in card positions", async ({ request }) => {
    const { owner, name } = siteConfig.showcaseRepository;
    const body = await (await request.get(`/api/repo/${owner}/${name}`)).text();
    expect(textAt(body, 92, 42)).toBe(name);
    expect(textAt(body, 108, 66).startsWith("Updated")).toBe(true);
    expect(body).toContain(`<a href="https://github.com/${owner}/${name}">`);
  });

  test("card endpoint maps not_found to 404", async ({ request }) => {
    const response = await request.get(
      `/api/repo/${MISSING.owner}/${MISSING.repo}`,
    );
    expect(response.status()).toBe(404);
    expect(response.headers()["content-type"]).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(title(await response.text())).toBe("Repository not found");
  });

  // `rate_limited` → 403, `upstream_error` → 502 and `unexpected_error` → 500
  // cannot be provoked against the live API. They are asserted through the
  // dependency seam in tests/unit/repo-card/handle-repo-card-request.test.ts
  // ("github quota returns 403 distinct from 429", "upstream error returns
  // 502 card", "unexpected error returns 500 card").

  test("both endpoints agree on existence", async ({ request }) => {
    const { owner, name } = siteConfig.showcaseRepository;
    const existingValidate = await request.get(
      `/api/validate?owner=${owner}&repo=${name}`,
    );
    expect((await existingValidate.json()).exists).toBe(true);
    const existingCard = await request.get(`/api/repo/${owner}/${name}`);
    expect(existingCard.status()).toBe(200);

    const missingValidate = await request.get(
      `/api/validate?owner=${MISSING.owner}&repo=${MISSING.repo}`,
    );
    expect(await missingValidate.json()).toEqual({
      exists: false,
      error: "not_found",
    });
    const missingCard = await request.get(
      `/api/repo/${MISSING.owner}/${MISSING.repo}`,
    );
    expect(missingCard.status()).toBe(404);
  });
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
