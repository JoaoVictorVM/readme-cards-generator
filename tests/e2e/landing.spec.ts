import { expect, test } from "@playwright/test";
import en from "../../src/i18n/dictionaries/en";
import ptBR from "../../src/i18n/dictionaries/pt-BR";
import { siteConfig } from "../../src/lib/site-config";

const SVG_TYPE = "image/svg+xml; charset=utf-8";
const SUCCESS_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";
const EXAMPLE_QUERY = "theme=light&locale=pt-BR&width=480";
const VIEWPORT_WIDTHS = [360, 768, 1024, 1440];

const { owner, name } = siteConfig.showcaseRepository;
const REPOSITORY = `${owner}/${name}`;
const CARD_PATH = `/api/repo/${owner}/${name}`;

const routes = [
  { path: "/", locale: "pt-BR", dictionary: ptBR, other: en, cta: "/gerar" },
  { path: "/en", locale: "en", dictionary: en, other: ptBR, cta: "/en/gerar" },
];

// Spec files run through Bun's plain JavaScript loader under
// `bun --bun playwright`, so helpers infer their parameter types from defaults.

// Every page load costs one GitHub call on the dev server (no edge cache), so
// only the tests that assert on the live card let the image request through.
const STUB_CARD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="380" height="150"' +
  ' viewBox="0 0 380 150" role="img"><title>stub</title></svg>';

const LIVE_CARD_TESTS = new Set(["example card loads from api route"]);

function title(markup = "") {
  return /<title>([^<]*)<\/title>/.exec(markup)?.[1] ?? "";
}

function viewBox(markup = "") {
  return /viewBox="([^"]*)"/.exec(markup)?.[1] ?? "";
}

for (const route of routes) {
  test.describe(`landing page ${route.path}`, () => {
    const { landing } = route.dictionary;

    test.beforeEach(async ({ page }, testInfo) => {
      if (LIVE_CARD_TESTS.has(testInfo.title)) return;
      await page.route(
        (url) => url.pathname === CARD_PATH,
        (handler) =>
          handler.fulfill({
            status: 200,
            contentType: SVG_TYPE,
            body: STUB_CARD,
          }),
      );
    });

    test("above the fold at 1440x900", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);
      const targets = [
        page.getByRole("heading", { level: 1, name: landing.title }),
        page.getByRole("link", { name: landing.ctaGenerate, exact: true }),
        page.locator("figure img"),
      ];
      for (const target of targets) {
        await expect(target).toBeVisible();
        const box = await target.boundingBox();
        expect(box).not.toBeNull();
        expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
        expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(900);
        expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(1440);
      }
    });

    test("example card loads from api route", async ({ page }) => {
      const cardResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === CARD_PATH,
      );
      await page.goto(route.path);
      const image = page.locator("figure img");
      await expect(image).toHaveAttribute("src", CARD_PATH);
      const response = await cardResponse;
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe(SVG_TYPE);
    });

    test("cta links to locale generator", async ({ page }) => {
      await page.goto(route.path);
      const cta = page.getByRole("link", {
        name: landing.ctaGenerate,
        exact: true,
      });
      await expect(cta).toHaveAttribute("href", route.cta);
      expect(await cta.evaluate((node) => node.tagName)).toBe("A");
    });

    test("how it works lists exactly three steps", async ({ page }) => {
      await page.goto(route.path);
      const section = page.getByRole("region", {
        name: landing.howItWorksTitle,
      });
      const items = section.locator("ol > li");
      await expect(items).toHaveCount(3);
      await expect(items.nth(0)).toContainText(landing.step1Title);
      await expect(items.nth(1)).toContainText(landing.step2Title);
      await expect(items.nth(2)).toContainText(landing.step3Title);
    });

    test("parameters table documents three parameters", async ({ page }) => {
      await page.goto(route.path);
      const table = page.getByRole("table", { name: landing.parametersTitle });
      const rows = table.locator("tbody tr");
      await expect(rows).toHaveCount(3);

      const theme = rows.filter({
        has: page.getByRole("rowheader", { name: "theme" }),
      });
      await expect(theme.locator("td").nth(0)).toHaveText("dark, light");
      await expect(theme.locator("td").nth(1)).toHaveText("dark");

      const locale = rows.filter({
        has: page.getByRole("rowheader", { name: "locale" }),
      });
      await expect(locale.locator("td").nth(0)).toHaveText("pt-BR, en");
      await expect(locale.locator("td").nth(1)).toHaveText("en");

      const width = rows.filter({
        has: page.getByRole("rowheader", { name: "width" }),
      });
      await expect(width.locator("td").nth(0)).toContainText("280");
      await expect(width.locator("td").nth(0)).toContainText("600");
      await expect(width.locator("td").nth(1)).toHaveText("380");
    });

    test("example url present and selectable", async ({ page }) => {
      await page.goto(route.path);
      const code = page.locator("code", { hasText: CARD_PATH });
      await expect(code).toHaveCount(1);
      const text = (await code.textContent()) ?? "";
      expect(text.endsWith(`${CARD_PATH}?${EXAMPLE_QUERY}`)).toBe(true);
      expect(text.startsWith("http")).toBe(true);
      const userSelect = await code.evaluate(
        (node) => getComputedStyle(node).userSelect,
      );
      expect(userSelect).toBe("all");
    });

    test("copy button writes clipboard", async ({ page, context }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.goto(route.path);
      const code = page.locator("code", { hasText: CARD_PATH });
      const expected = (await code.textContent()) ?? "";
      const button = page.getByRole("button", {
        name: landing.copyExampleLabel,
      });
      await expect(button).toBeVisible();
      await button.click();
      await expect(
        page.getByRole("button", { name: landing.copiedExampleLabel }),
      ).toBeVisible();
      const clipboard = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboard).toBe(expected);
      await expect(
        page.getByRole("button", { name: landing.copyExampleLabel }),
      ).toBeVisible({ timeout: 4000 });
    });

    test("no horizontal overflow across viewports", async ({ page }) => {
      await page.goto(route.path);
      for (const width of VIEWPORT_WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          imageRight:
            document.querySelector("figure img")?.getBoundingClientRect()
              .right ?? Number.POSITIVE_INFINITY,
        }));
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        expect(metrics.imageRight).toBeLessThanOrEqual(width);
      }
    });

    test("metadata description is localized", async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        landing.metaDescription,
      );
      await expect(page).toHaveTitle(
        new RegExp(route.dictionary.common.productName),
      );
    });

    test("no copy leaks between locales", async ({ page }) => {
      await page.goto(route.path);
      const foreign = [
        route.other.landing.title,
        route.other.landing.subtitle,
        route.other.landing.ctaGenerate,
        route.other.landing.howItWorksTitle,
        route.other.landing.parametersTitle,
        route.other.landing.step1Title,
      ];
      for (const text of foreign) {
        await expect(page.getByText(text, { exact: true })).toHaveCount(0);
      }
    });

    test("image has intrinsic size and alt", async ({ page }) => {
      await page.goto(route.path);
      const image = page.locator("figure img");
      await expect(image).toHaveAttribute("width", "380");
      await expect(image).toHaveAttribute("height", "150");
      await expect(image).toHaveAttribute("loading", "eager");
      const alt = await image.getAttribute("alt");
      expect(alt).toContain(REPOSITORY);
    });
  });
}

test.describe("live example integration with the card endpoint", () => {
  test("live example renders f05 response", async ({ page }) => {
    const cardResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === CARD_PATH,
    );
    await page.goto("/");
    const response = await cardResponse;
    const body = await response.text();
    expect(body.startsWith("<svg")).toBe(true);
    expect(title(body)).toBe(REPOSITORY);
    // `document.images` is typed as HTMLImageElement, unlike querySelector.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Array.from(document.images).find((node) =>
              node.getAttribute("src")?.startsWith("/api/repo/"),
            )?.complete ?? false,
        ),
      )
      .toBe(true);
    const natural = await page.evaluate(() => {
      const image = Array.from(document.images).find((node) =>
        node.getAttribute("src")?.startsWith("/api/repo/"),
      );
      return [image?.naturalWidth ?? 0, image?.naturalHeight ?? 0];
    });
    expect(natural).toEqual([380, 150]);
  });

  test("live example is edge cacheable", async ({ page }) => {
    const cardResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === CARD_PATH,
    );
    await page.goto("/");
    const response = await cardResponse;
    expect(response.headers()["cache-control"]).toBe(SUCCESS_CACHE);
  });

  test("live example matches direct fetch", async ({ page, request }) => {
    const cardResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === CARD_PATH,
    );
    await page.goto("/");
    const served = await (await cardResponse).text();
    const direct = await (await request.get(CARD_PATH)).text();
    expect(title(direct)).toBe(title(served));
    expect(viewBox(direct)).toBe(viewBox(served));
  });
});
