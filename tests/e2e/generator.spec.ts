import { expect, test } from "@playwright/test";
import en from "../../src/i18n/dictionaries/en";
import ptBR from "../../src/i18n/dictionaries/pt-BR";
import { getCanonicalHost } from "../../src/lib/site-config";
import {
  countValidateRequests,
  findCustomizationControls,
  generatorUi,
  isValidateUrl,
  JSON_TYPE,
  naturalWidth,
  SHOWCASE_CARD_PATH,
  SHOWCASE_PAIR,
  SHOWCASE_SUCCESS_BODY,
  stubCard,
  stubValidate,
  SVG_TYPE,
} from "./generator-helpers";

const MISSING = { owner: "badge-generate-no-such-owner-7f3a", repo: "nope" };
const PAIR = SHOWCASE_PAIR;
const CARD_PATH = SHOWCASE_CARD_PATH;
const SNIPPET = `[![${PAIR}](${getCanonicalHost()}${CARD_PATH})](https://github.com/${PAIR})`;

const routes = [
  {
    path: "/gerar",
    dictionary: ptBR,
    switchTo: "EN",
    otherPath: "/en/gerar",
    other: en,
  },
  {
    path: "/en/gerar",
    dictionary: en,
    switchTo: "PT",
    otherPath: "/gerar",
    other: ptBR,
  },
];

// Every live success costs GitHub calls (one for the validation, one for the
// card image), so only the tests that assert on the live endpoints let the
// requests through; every other test fulfils the exact F07/F05 responses.
const LIVE_TESTS = new Set([
  "snippet matches prd shape exactly",
  "snippet uses canonical names from endpoint",
  "not found shows localized error clears result and keeps value",
  "result image has intrinsic size and loads",
]);

// Spec files run through Bun's plain JavaScript loader under
// `bun --bun playwright`, so typed helpers live in generator-helpers.ts.

for (const route of routes) {
  test.describe(`generator ${route.path}`, () => {
    const { generator } = route.dictionary;

    test.beforeEach(async ({ page }, testInfo) => {
      if (LIVE_TESTS.has(testInfo.title)) return;
      await stubCard(page);
    });

    test("page renders form and no result initially", async ({ page }) => {
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await expect(
        page.getByRole("heading", { level: 1, name: generator.title }),
      ).toBeVisible();
      await expect(ui.input).toHaveAttribute(
        "placeholder",
        "https://github.com/owner/repo",
      );
      await expect(ui.button).toBeEnabled();
      await expect(ui.result).toHaveCount(0);
      await expect(ui.alert).toHaveCount(0);
    });

    test("all four formats generate the same card", async ({ page }) => {
      await stubValidate(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      const inputs = [
        `https://github.com/${PAIR}`,
        `http://github.com/${PAIR}`,
        `github.com/${PAIR}`,
        PAIR,
        `https://github.com/${PAIR}.git`,
        `https://github.com/${PAIR}/`,
        `https://github.com/${PAIR}/tree/canary`,
      ];
      for (const input of inputs) {
        await ui.submit(input);
        await expect(ui.button).toBeEnabled();
        await expect(ui.image).toHaveAttribute("src", CARD_PATH);
        await expect(ui.snippet).toHaveText(SNIPPET);
      }
    });

    test("invalid input shows error and sends no request", async ({ page }) => {
      const counter = countValidateRequests(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      for (const input of ["not a url", "gitlab.com/a/b", "vercel", ""]) {
        await ui.submit(input);
        await expect(ui.alert).toHaveText(generator.errorInvalidUrl);
        await expect(ui.input).toHaveAttribute("aria-invalid", "true");
        await expect(ui.input).toHaveValue(input);
        await expect(ui.result).toHaveCount(0);
      }
      expect(counter.value).toBe(0);
    });

    test("submit disables button with loading state", async ({ page }) => {
      await stubValidate(page, { delayMs: 1500 });
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.button).toBeDisabled();
      await expect(ui.spinner).toBeVisible();
      await expect(ui.button).toBeEnabled({ timeout: 5000 });
      await expect(ui.spinner).toHaveCount(0);
      await expect(ui.image).toHaveAttribute("src", CARD_PATH);
    });

    test("no card before click and typing does not update result", async ({
      page,
    }) => {
      await stubValidate(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.input.fill(`https://github.com/${PAIR}`);
      await page.waitForTimeout(500);
      await expect(ui.result).toHaveCount(0);

      await ui.button.click();
      await expect(ui.image).toHaveAttribute("src", CARD_PATH);

      const other = "https://github.com/someone-else/other-repo";
      await ui.input.fill(other);
      await page.waitForTimeout(500);
      await expect(ui.image).toHaveAttribute("src", CARD_PATH);
      await expect(ui.snippet).toHaveText(SNIPPET);
      await expect(ui.input).toHaveValue(other);
    });

    test("snippet matches prd shape exactly", async ({ page }) => {
      await stubCard(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(`https://github.com/${PAIR}`);
      await expect(ui.snippet).toHaveText(SNIPPET, { timeout: 15_000 });
      expect(await ui.snippet.textContent()).not.toContain("?");
    });

    test("snippet uses canonical names from endpoint", async ({ page }) => {
      await stubCard(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit("Vercel/Next.js");
      await expect(ui.snippet).toHaveText(SNIPPET, { timeout: 15_000 });
      await expect(ui.image).toHaveAttribute("src", CARD_PATH);
      await expect(ui.image).toHaveAttribute("alt", PAIR);
    });

    test("copy button writes clipboard and confirms for two seconds", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await stubValidate(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.snippet).toHaveText(SNIPPET);

      await ui.copy.click();
      await expect(ui.copied).toBeVisible();
      await expect(ui.copied.locator("svg.lucide-check")).toHaveCount(1);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        SNIPPET,
      );

      await expect(ui.copy).toBeVisible({ timeout: 3500 });
      await expect(ui.copied).toHaveCount(0);
    });

    test("copy fallback selects text and shows hint", async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error("denied")) },
        });
      });
      await stubValidate(page);
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.snippet).toHaveText(SNIPPET);

      await ui.copy.click();
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: generator.copyFallbackLabel }),
      ).toHaveCount(1);
      expect(
        await page.evaluate(() => window.getSelection()?.toString() ?? ""),
      ).toBe(SNIPPET);
      await expect(ui.copy).toBeVisible();
    });

    test("not found shows localized error clears result and keeps value", async ({
      page,
    }) => {
      await stubCard(page);
      await page.route(isValidateUrl, async (handler) => {
        const url = new URL(handler.request().url());
        if (url.searchParams.get("owner") === MISSING.owner) {
          await handler.continue();
          return;
        }
        await handler.fulfill({
          status: 200,
          contentType: JSON_TYPE,
          body: JSON.stringify(SHOWCASE_SUCCESS_BODY),
        });
      });
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.image).toHaveAttribute("src", CARD_PATH);

      const missing = `https://github.com/${MISSING.owner}/${MISSING.repo}`;
      await ui.input.fill(missing);
      await ui.input.press("Enter");
      await expect(ui.alert).toHaveText(generator.errorNotFound, {
        timeout: 15_000,
      });
      await expect(ui.result).toHaveCount(0);
      await expect(ui.input).toHaveValue(missing);
      await expect(ui.input).toBeFocused();
      await expect(ui.button).toBeEnabled();
    });

    test("429 disables button until retry after", async ({ page }) => {
      const counter = countValidateRequests(page);
      await stubValidate(page, {
        status: 429,
        body: { exists: false, error: "rate_limited" },
        headers: { "Retry-After": "2", "X-RateLimit-Remaining": "0" },
      });
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.alert).toHaveText(generator.errorTooManyRequests);
      await expect(ui.button).toBeDisabled();
      await expect(ui.result).toHaveCount(0);
      await expect(ui.button).toBeEnabled({ timeout: 3500 });
      await expect(ui.alert).toHaveText(generator.errorTooManyRequests);

      await ui.button.click();
      await expect.poll(() => counter.value).toBe(2);
    });

    test("403 shows quota message without cooldown", async ({ page }) => {
      await stubValidate(page, {
        status: 403,
        body: { exists: false, error: "rate_limited" },
        headers: { "Retry-After": "900" },
      });
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.alert).toHaveText(generator.errorQuotaExhausted);
      await expect(ui.button).toBeEnabled();
      await expect(ui.result).toHaveCount(0);
    });

    test("502 and 500 show could not verify", async ({ page }) => {
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      const cases = [
        { status: 502, error: "upstream_error" },
        { status: 500, error: "unexpected_error" },
      ];
      for (const { status, error } of cases) {
        await page.unroute(isValidateUrl);
        await stubValidate(page, { status, body: { exists: false, error } });
        await ui.submit(PAIR);
        await expect(ui.alert).toHaveText(generator.errorCouldNotVerify);
        await expect(ui.result).toHaveCount(0);
        await expect(ui.button).toBeEnabled();
      }
    });

    test("network failure shows could not verify", async ({ page }) => {
      await page.route(isValidateUrl, (handler) => handler.abort("failed"));
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await ui.submit(PAIR);
      await expect(ui.alert).toHaveText(generator.errorCouldNotVerify);
      await expect(ui.result).toHaveCount(0);
    });

    test("interface exposes no customization controls", async ({ page }) => {
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      await expect(ui.form.locator("input")).toHaveCount(1);
      await expect(ui.form.locator("button[type=submit]")).toHaveCount(1);
      await expect(ui.form.locator("select")).toHaveCount(0);
      expect(await findCustomizationControls(page)).toEqual([]);
    });

    test("result image has intrinsic size and loads", async ({ page }) => {
      await page.goto(route.path);
      const ui = generatorUi(page, route.dictionary);
      const cardResponse = page.waitForResponse(
        (response) => new URL(response.url()).pathname === CARD_PATH,
      );
      await ui.submit(PAIR);
      await expect(ui.image).toHaveAttribute("src", CARD_PATH, {
        timeout: 15_000,
      });
      await expect(ui.image).toHaveAttribute("width", "380");
      await expect(ui.image).toHaveAttribute("height", "150");
      await expect(ui.image).toHaveAttribute("alt", PAIR);
      const response = await cardResponse;
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toBe(SVG_TYPE);
      await expect.poll(() => naturalWidth(page)).toBeGreaterThan(0);
    });

    test("language switch preserves generator route", async ({ page }) => {
      await page.goto(route.path);
      await page
        .getByRole("link", { name: route.switchTo, exact: true })
        .click();
      await page.waitForURL((url) => url.pathname === route.otherPath);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: route.other.generator.title,
        }),
      ).toBeVisible();
    });
  });
}
