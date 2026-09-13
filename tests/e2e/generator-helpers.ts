import type { Page } from "@playwright/test";
import type { Dictionary } from "../../src/i18n/types";
import { siteConfig } from "../../src/lib/site-config";

export const VALIDATE_PATH = "/api/validate";
export const JSON_TYPE = "application/json; charset=utf-8";
export const SVG_TYPE = "image/svg+xml; charset=utf-8";

const { owner, name } = siteConfig.showcaseRepository;

export const SHOWCASE_PAIR = `${owner}/${name}`;
export const SHOWCASE_CARD_PATH = `/api/repo/${owner}/${name}`;
export const SHOWCASE_SUCCESS_BODY = { exists: true, owner, repo: name };

export const STUB_CARD =
  '<svg xmlns="http://www.w3.org/2000/svg" width="380" height="150"' +
  ' viewBox="0 0 380 150" role="img"><title>stub</title></svg>';

export function isValidateUrl(url: URL): boolean {
  return url.pathname === VALIDATE_PATH;
}

export async function stubCard(page: Page): Promise<void> {
  await page.route(
    (url) => url.pathname.startsWith("/api/repo/"),
    (route) =>
      route.fulfill({ status: 200, contentType: SVG_TYPE, body: STUB_CARD }),
  );
}

type StubValidateOptions = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delayMs?: number;
};

export async function stubValidate(
  page: Page,
  options: StubValidateOptions = {},
): Promise<void> {
  const {
    status = 200,
    body = SHOWCASE_SUCCESS_BODY,
    headers = {},
    delayMs = 0,
  } = options;
  await page.route(isValidateUrl, async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    await route.fulfill({
      status,
      contentType: JSON_TYPE,
      headers: { "Cache-Control": "no-store", ...headers },
      body: JSON.stringify(body),
    });
  });
}

export function countValidateRequests(page: Page): { value: number } {
  const counter = { value: 0 };
  page.on("request", (request) => {
    if (isValidateUrl(new URL(request.url()))) counter.value += 1;
  });
  return counter;
}

export function generatorUi(page: Page, dictionary: Dictionary) {
  const { generator } = dictionary;
  const result = page.getByTestId("generator-result");
  const input = page.getByRole("textbox", { name: generator.urlFieldLabel });
  const button = page.getByRole("button", { name: generator.submitLabel });
  const form = page.locator("form").filter({ has: input });
  return {
    input,
    button,
    form,
    // Scoped to the form: Next.js mounts its own role="alert" route announcer.
    alert: form.getByRole("alert"),
    spinner: page.getByTestId("generator-spinner"),
    result,
    image: result.locator("img"),
    snippet: result.locator("pre"),
    copy: page.getByRole("button", { name: generator.copyLabel }),
    copied: page.getByRole("button", { name: generator.copiedLabel }),
    async submit(value: string): Promise<void> {
      await input.fill(value);
      await button.click();
    },
  };
}

export function naturalWidth(page: Page): Promise<number> {
  return page
    .getByTestId("generator-result")
    .locator("img")
    .evaluate((node) => (node as HTMLImageElement).naturalWidth);
}

export function findCustomizationControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const pattern = /theme|locale|width/i;
    const selector = [
      "main input",
      "main select",
      "main textarea",
      "main button",
      "main [role=slider]",
      "main [role=switch]",
      "main [role=combobox]",
    ].join(", ");
    return Array.from(document.querySelectorAll(selector))
      .filter((element) => {
        const label = element.id
          ? document.querySelector(`label[for="${element.id}"]`)
          : null;
        const haystack = [
          element.id,
          element.getAttribute("name"),
          element.getAttribute("aria-label"),
          element.textContent,
          label?.textContent,
        ].join(" ");
        return pattern.test(haystack);
      })
      .map((element) => element.outerHTML);
  });
}
