import { expect, test } from "@playwright/test";
import { deriveTileColor } from "../../src/lib/language-icon/tile-color";
import { siteConfig } from "../../src/lib/site-config";

const FALLBACK_TILE = "#2b2f3a";
const JAVASCRIPT_COLOR = "#f1e05a";

const { owner, name } = siteConfig.showcaseRepository;
const SHOWCASE = `/api/repo/${owner}/${name}`;
const GO_REPOSITORY = "/api/repo/golang/go";
// A Markdown-only repository GitHub reports with `language: null`.
const NO_LANGUAGE_REPOSITORY = "/api/repo/sindresorhus/awesome";

function tileFill(markup = "") {
  const match =
    /<rect x="20" y="20" width="56" height="56" rx="14" fill="([^"]*)"/.exec(
      markup,
    );
  return match?.[1] ?? "";
}

function iconGroup(markup = "") {
  return (
    /<g transform="translate\(32 32\)">([\s\S]*?)<\/g><text/.exec(
      markup,
    )?.[1] ?? ""
  );
}

function declaredIds(markup = "") {
  return Array.from(markup.matchAll(/\bid="([^"]*)"/g), (m) => m[1]);
}

function expectZeroExternalReferences(markup = "") {
  for (const forbidden of [
    "<image",
    "<script",
    "<style",
    "<link",
    "<foreignObject",
    "data:",
    "@import",
    "javascript:",
  ]) {
    expect(markup).not.toContain(forbidden);
  }
  expect(markup).not.toMatch(/\son[a-z]+=/i);
  for (const match of markup.matchAll(/url\(([^)]*)\)/g)) {
    expect(match[1].startsWith("#") || match[1].startsWith("'#")).toBe(true);
  }
  for (const match of markup.matchAll(/xlink:href="([^"]*)"/g)) {
    expect(match[1].startsWith("#")).toBe(true);
  }
  for (const match of markup.matchAll(/(?<![:\w])href="([^"]*)"/g)) {
    expect(match[1].startsWith("https://github.com/")).toBe(true);
  }
}

test.describe("language icon inlined in the card", () => {
  test("resolved icon markup appears inlined in the card svg", async ({
    request,
  }) => {
    const body = await (await request.get(SHOWCASE)).text();
    const fragment = iconGroup(body);
    expect(fragment.startsWith("<svg")).toBe(true);
    expect(fragment.endsWith("</svg>")).toBe(true);
    expect(fragment).not.toContain("<polyline");
  });

  test("resolved tile color is the tile fill in the card", async ({
    request,
  }) => {
    const body = await (await request.get(SHOWCASE)).text();
    const fill = tileFill(body);
    expect(fill).toBe(deriveTileColor(JAVASCRIPT_COLOR));
    expect(fill).not.toBe(FALLBACK_TILE);
  });

  test("namespaces survive into the card document", async ({ request }) => {
    const body = await (await request.get(GO_REPOSITORY)).text();
    const fragment = iconGroup(body);
    expect(/^<svg[^>]*xmlns:xlink=/.test(fragment)).toBe(true);
  });

  test("card svg has zero external references", async ({ request }) => {
    for (const path of [SHOWCASE, GO_REPOSITORY]) {
      expectZeroExternalReferences(await (await request.get(path)).text());
    }
  });

  test("two cards on one page do not collide", async ({ request }) => {
    const first = declaredIds(await (await request.get(SHOWCASE)).text());
    const second = declaredIds(await (await request.get(GO_REPOSITORY)).text());
    expect(second.length).toBeGreaterThan(0);
    for (const id of [...first, ...second]) {
      expect(id.startsWith("bgi-")).toBe(true);
    }
    const shared = first.filter((id) => second.includes(id));
    expect(shared).toEqual([]);
  });

  test("language without an icon still produces a filled tile", async ({
    request,
  }) => {
    const response = await request.get(NO_LANGUAGE_REPOSITORY);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(tileFill(body)).toBe(FALLBACK_TILE);
    expect(iconGroup(body)).toContain("<polyline");
  });
});
