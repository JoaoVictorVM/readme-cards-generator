import { expect, test } from "@playwright/test";
import { CARD_COPY } from "../../src/lib/card/copy";
import { siteConfig } from "../../src/lib/site-config";

const GITHUB_TIMEOUT_MS = 5000;
const SVG_TYPE = "image/svg+xml; charset=utf-8";
const SUCCESS_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const ERROR_CACHE = "public, s-maxage=60";
const MISSING = { owner: "badge-generate-no-such-owner-7f3a", repo: "nope" };
const LONG_OWNER = "o".repeat(101);
const REQUESTS = 60;

const { owner, name } = siteConfig.showcaseRepository;
const SHOWCASE = `/api/repo/${owner}/${name}`;
const MISSING_PATH = `/api/repo/${MISSING.owner}/${MISSING.repo}`;
const INVALID_PATH = `/api/repo/${LONG_OWNER}/x`;

// Spec files run through Bun's plain JavaScript loader under
// `bun --bun playwright`, so helpers infer their parameter types from defaults.

function hasUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  return url.length > 0 && token.length > 0;
}

function title(markup = "") {
  return /<title>([^<]*)<\/title>/.exec(markup)?.[1] ?? "";
}

function rootElement(markup = "") {
  return /^<svg[^>]*>/.exec(markup)?.[0] ?? "";
}

function backgroundRect(markup = "") {
  return /<rect[^>]*>/.exec(markup)?.[0] ?? "";
}

function isBalancedXml(markup = "") {
  const stack = [];
  for (const match of markup.matchAll(
    /<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g,
  )) {
    const [, closing, tag, selfClosing] = match;
    if (closing === "/") {
      if (stack.pop() !== tag) return false;
    } else if (selfClosing !== "/") {
      stack.push(tag);
    }
  }
  return stack.length === 0;
}

function expectSvgBody(body = "", width = 380) {
  expect(body.startsWith("<svg")).toBe(true);
  expect(body.endsWith("</svg>")).toBe(true);
  expect(isBalancedXml(body)).toBe(true);
  expect(body).toContain(`viewBox="0 0 ${width} 150"`);
}

test.describe("card endpoint", () => {
  test("existing repository returns 200 svg", async ({ request }) => {
    const response = await request.get(SHOWCASE);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(SVG_TYPE);
    const body = await response.text();
    expectSvgBody(body);
    expect(title(body)).toBe(`${owner}/${name}`);
  });

  test("nonexistent repository returns 404 localized card", async ({
    request,
  }) => {
    const english = await request.get(MISSING_PATH);
    expect(english.status()).toBe(404);
    const englishBody = await english.text();
    expectSvgBody(englishBody);
    expect(title(englishBody)).toBe(CARD_COPY.en.errors.not_found);

    const portuguese = await request.get(`${MISSING_PATH}?locale=pt-BR`);
    expect(portuguese.status()).toBe(404);
    const portugueseBody = await portuguese.text();
    expectSvgBody(portugueseBody);
    expect(title(portugueseBody)).toBe(CARD_COPY["pt-BR"].errors.not_found);
  });

  // Playwright cannot observe outbound calls; a response well under the GitHub
  // budget evidences that no lookup happened.
  test("invalid segment returns 400 svg quickly", async ({ request }) => {
    for (const path of [INVALID_PATH, "/api/repo/a%2Fb/c"]) {
      const started = Date.now();
      const response = await request.get(path);
      const elapsed = Date.now() - started;
      expect(response.status()).toBe(400);
      expect(response.headers()["content-type"]).toBe(SVG_TYPE);
      const body = await response.text();
      expectSvgBody(body);
      expect(title(body)).toBe(CARD_COPY.en.errors.invalid_request);
      expect(elapsed).toBeLessThan(GITHUB_TIMEOUT_MS);
    }
  });

  test("invalid parameters fall back", async ({ request }) => {
    for (const query of ["?theme=purple", "?locale=fr", "?width=abc"]) {
      const response = await request.get(`${SHOWCASE}${query}`);
      expect(response.status()).toBe(200);
      const body = await response.text();
      expectSvgBody(body, 380);
      expect(backgroundRect(body)).toContain('fill="#0d1117"');
    }
  });

  test("width clamps", async ({ request }) => {
    const low = await request.get(`${SHOWCASE}?width=100`);
    expectSvgBody(await low.text(), 280);
    const high = await request.get(`${SHOWCASE}?width=9999`);
    expectSvgBody(await high.text(), 600);
  });

  test("theme and locale apply", async ({ request }) => {
    const response = await request.get(`${SHOWCASE}?theme=light&locale=pt-BR`);
    const body = await response.text();
    expectSvgBody(body);
    expect(backgroundRect(body)).toContain('fill="#ffffff"');
    expect(body).toContain(`>${CARD_COPY["pt-BR"].buttonLabel}</text>`);
  });

  test("success cache control", async ({ request }) => {
    const response = await request.get(SHOWCASE);
    expect(response.headers()["cache-control"]).toBe(SUCCESS_CACHE);
  });

  test("error cache control", async ({ request }) => {
    for (const path of [MISSING_PATH, INVALID_PATH]) {
      const response = await request.get(path);
      expect(response.headers()["cache-control"]).toBe(ERROR_CACHE);
    }
  });

  // The handler emits no Vary; the dev server adds its own RSC entry outside
  // the handler, so only the absence of a body-affecting key is asserted.
  test("every response carries nosniff", async ({ request }) => {
    for (const path of [SHOWCASE, MISSING_PATH, INVALID_PATH]) {
      const response = await request.get(path);
      const headers = response.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["content-type"]).toBe(SVG_TYPE);
      expect(headers["vary"] ?? "").not.toMatch(/accept/i);
    }
  });

  test("head carries same headers", async ({ request }) => {
    const response = await request.head(SHOWCASE);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(SVG_TYPE);
    expect(response.headers()["cache-control"]).toBe(SUCCESS_CACHE);
    expect(await response.text()).toBe("");
  });

  // 403, 500 and 502 cannot be provoked against live GitHub; they share the
  // frame by "every status shares the frame" in
  // tests/unit/repo-card/handle-repo-card-request.test.ts.
  test("all observable statuses are svg", async ({ request }) => {
    const responses = [
      await request.get(SHOWCASE),
      await request.get(MISSING_PATH),
      await request.get(INVALID_PATH),
    ];
    expect(responses.map((r) => r.status())).toEqual([200, 404, 400]);
    if (hasUpstashCredentials()) {
      const headers = { "x-forwarded-for": "198.51.100.251" };
      for (let index = 0; index <= REQUESTS; index += 1) {
        const response = await request.get(INVALID_PATH, { headers });
        if (response.status() === 429) {
          responses.push(response);
          break;
        }
      }
      expect(responses).toHaveLength(4);
    }
    const bodies = [];
    for (const response of responses) {
      expect(response.headers()["content-type"]).toBe(SVG_TYPE);
      const body = await response.text();
      expectSvgBody(body);
      bodies.push(body);
    }
    expect(new Set(bodies.map(rootElement)).size).toBe(1);
    expect(new Set(bodies.map(backgroundRect)).size).toBe(1);
  });

  test("second request is an edge hit", async ({ request }) => {
    test.skip(
      !process.env.PLAYWRIGHT_EXPECT_EDGE_CACHE,
      "requires a deployed host and PLAYWRIGHT_EXPECT_EDGE_CACHE",
    );
    await request.get(SHOWCASE);
    const second = await request.get(SHOWCASE);
    expect(second.status()).toBe(200);
    expect(["HIT", "STALE"]).toContain(second.headers()["x-vercel-cache"]);
  });
});
