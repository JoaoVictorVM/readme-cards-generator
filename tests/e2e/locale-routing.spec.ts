import { expect, test } from "@playwright/test";
import en from "../../src/i18n/dictionaries/en";
import ptBR from "../../src/i18n/dictionaries/pt-BR";

test("root renders portuguese without redirect", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/");
  await expect(
    page.getByRole("heading", { name: ptBR.landing.title }),
  ).toBeVisible();
});

test("en renders english without redirect", async ({ page }) => {
  const response = await page.goto("/en");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe("/en");
  await expect(
    page.getByRole("heading", { name: en.landing.title }),
  ).toBeVisible();
});

test("en link from gerar navigates to en gerar", async ({ page }) => {
  await page.goto("/gerar");
  await page.getByRole("link", { name: "EN", exact: true }).click();
  await page.waitForURL("**/en/gerar");
  await expect(
    page.getByRole("heading", { name: en.generator.title }),
  ).toBeVisible();
});

test("pt link from en gerar navigates to gerar", async ({ page }) => {
  await page.goto("/en/gerar");
  await page.getByRole("link", { name: "PT", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/gerar");
  await expect(
    page.getByRole("heading", { name: ptBR.generator.title }),
  ).toBeVisible();
});

test("language links are plain anchors", async ({ page }) => {
  await page.goto("/gerar");
  const pt = page.getByRole("link", { name: "PT", exact: true });
  const enLink = page.getByRole("link", { name: "EN", exact: true });
  expect(await pt.evaluate((node) => node.tagName)).toBe("A");
  expect(await enLink.evaluate((node) => node.tagName)).toBe("A");
  await expect(pt).toHaveAttribute("href", "/gerar");
  await expect(enLink).toHaveAttribute("href", "/en/gerar");
});

test("active locale is emphasized", async ({ page }) => {
  await page.goto("/en");
  await expect(
    page.getByRole("link", { name: "EN", exact: true }),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    page.getByRole("link", { name: "PT", exact: true }),
  ).not.toHaveAttribute("aria-current", "true");
});

test("unknown route renders not found inside the shell", async ({ page }) => {
  const response = await page.goto("/rota-inexistente");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: ptBR.errors.notFoundTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: ptBR.footer.repositoryLinkLabel }),
  ).toBeVisible();
});
