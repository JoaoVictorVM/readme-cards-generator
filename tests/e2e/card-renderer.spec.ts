import { expect, test } from "@playwright/test";
import { renderCard, renderErrorCard } from "../../src/lib/card";
import { CARD_COPY } from "../../src/lib/card/copy";
import { fetchRepository } from "../../src/lib/github";
import { resolveLanguageIcon } from "../../src/lib/language-icon";
import { siteConfig } from "../../src/lib/site-config";

const SVG_TYPE = "image/svg+xml; charset=utf-8";
const MISSING = { owner: "badge-generate-no-such-owner-7f3a", repo: "nope" };
const LONG_OWNER = "o".repeat(101);

const { owner, name } = siteConfig.showcaseRepository;
const SHOWCASE = `/api/repo/${owner}/${name}`;

// The F03 id prefix is minted per call on the server, and the activity line
// depends on the clock, so both are normalized before comparing bodies.
function normalize(markup = "") {
  return markup
    .replace(/bgi-[a-z0-9]+-[a-z0-9]+-/g, "bgi-X-")
    .replace(/<text x="108" y="66"[^>]*>[^<]*<\/text>/, "<text/>");
}

function rootElement(markup = "") {
  return /^<svg[^>]*>/.exec(markup)?.[0] ?? "";
}

function backgroundRect(markup = "") {
  return /<rect[^>]*>/.exec(markup)?.[0] ?? "";
}

test.describe("card renderer through the endpoint", () => {
  test("card markup is returned unmodified", async ({ request }) => {
    const response = await request.get(SHOWCASE);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe(SVG_TYPE);
    const served = await response.text();

    const outcome = await fetchRepository(owner, name);
    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    const visual = await resolveLanguageIcon(outcome.data.language);
    const local = renderCard({ repository: outcome.data, visual });

    expect(normalize(served)).toBe(normalize(local));
  });

  test("error card markup is returned unmodified", async ({ request }) => {
    const response = await request.get(
      `/api/repo/${MISSING.owner}/${MISSING.repo}`,
    );
    expect(response.status()).toBe(404);
    expect(await response.text()).toBe(renderErrorCard({ kind: "not_found" }));
  });

  test("theme locale width reach the renderer", async ({ request }) => {
    const response = await request.get(
      `${SHOWCASE}?theme=light&locale=pt-BR&width=480`,
    );
    const body = await response.text();
    expect(rootElement(body)).toContain('width="480"');
    expect(backgroundRect(body)).toContain('fill="#ffffff"');
    expect(body).toContain(`>${CARD_COPY["pt-BR"].buttonLabel}</text>`);
  });

  test("invalid parameters fall back to renderer defaults", async ({
    request,
  }) => {
    const plain = await (await request.get(SHOWCASE)).text();
    const odd = await (
      await request.get(`${SHOWCASE}?theme=purple&locale=fr&width=abc`)
    ).text();
    expect(normalize(odd)).toBe(normalize(plain));
  });

  // 403, 500 and 502 cannot be provoked against live GitHub; they are asserted
  // by "every status shares the frame" in
  // tests/unit/repo-card/handle-repo-card-request.test.ts.
  test("every status body is a renderer document", async ({ request }) => {
    const bodies = [];
    for (const path of [
      SHOWCASE,
      `/api/repo/${LONG_OWNER}/x`,
      `/api/repo/${MISSING.owner}/${MISSING.repo}`,
    ]) {
      const body = await (await request.get(path)).text();
      expect(body.startsWith("<svg")).toBe(true);
      expect(body.endsWith("</svg>")).toBe(true);
      bodies.push(body);
    }
    expect(new Set(bodies.map(rootElement)).size).toBe(1);
    expect(new Set(bodies.map(backgroundRect)).size).toBe(1);
    expect(rootElement(bodies[0])).toContain('width="380"');
  });

  test("name in bold text position and link target", async ({ request }) => {
    const body = await (await request.get(SHOWCASE)).text();
    expect(body).toContain(
      `<text x="92" y="42" font-size="16" font-weight="700"`,
    );
    expect(body).toMatch(
      new RegExp(`<text x="92" y="42"[^>]*>${name.replace(".", "\\.")}</text>`),
    );
    expect(body).toContain(`<a href="https://github.com/${owner}/${name}">`);
  });
});
