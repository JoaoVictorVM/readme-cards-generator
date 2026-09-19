import { expect, test } from "@playwright/test";
import en from "../../src/i18n/dictionaries/en";
import ptBR from "../../src/i18n/dictionaries/pt-BR";

const routes = [
  { path: "/", dictionary: ptBR },
  { path: "/gerar", dictionary: ptBR },
  { path: "/en", dictionary: en },
  { path: "/en/gerar", dictionary: en },
];

for (const route of routes) {
  test(`header and footer present on ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(
      page.getByRole("banner").getByText(route.dictionary.common.productName),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "PT", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "EN", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: route.dictionary.footer.repositoryLinkLabel,
      }),
    ).toBeVisible();
  });

  test(`dark surface tokens applied on ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    expect(background).toBe("rgb(0, 0, 0)");
  });
}

test("geist font variable applied", async ({ page }) => {
  await page.goto("/");
  const fontFamily = await page.evaluate(
    () => getComputedStyle(document.body).fontFamily,
  );
  expect(fontFamily.toLowerCase()).toContain("geist");
});

test("no hardcoded copy leaks between locales", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByText(ptBR.footer.attribution)).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByText(en.footer.attribution)).toHaveCount(0);
});

test("favicon is the svg card icon", async ({ page, request }) => {
  await page.goto("/");
  const href = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(href).not.toBeNull();
  expect(href).toContain("/icon.svg");
  const response = await request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  const body = await response.text();
  expect(body.startsWith("<svg")).toBe(true);
  expect(body).toContain('viewBox="0 0 32 32"');
  expect(body).toContain("prefers-color-scheme: dark");
});
