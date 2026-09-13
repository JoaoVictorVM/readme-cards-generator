import { describe, expect, test } from "bun:test";
import {
  EXAMPLE_CARD_QUERY,
  EXAMPLE_CARD_QUERY_VALUES,
} from "@/components/landing/config";
import {
  buildExampleCardUrl,
  PARAMETER_ROWS,
  showcaseCardPath,
} from "@/components/landing/example-url";
import { locales } from "@/i18n/config";
import {
  CARD_DEFAULT_LOCALE,
  CARD_DEFAULT_THEME,
  CARD_DEFAULT_WIDTH,
  CARD_MAX_WIDTH,
  CARD_MIN_WIDTH,
  CARD_THEMES,
} from "@/lib/card";
import { buildCardPath } from "@/lib/repo-card";
import { REPO_CARD_QUERY_PARAMETERS } from "@/lib/repo-card/config";
import { siteConfig } from "@/lib/site-config";

const HOST = "https://badge.example";

describe("buildExampleCardUrl", () => {
  test("example url uses showcase path", () => {
    const { owner, name } = siteConfig.showcaseRepository;
    const expectedPath = buildCardPath(owner, name);
    expect(showcaseCardPath()).toBe(expectedPath);
    expect(
      buildExampleCardUrl(HOST).startsWith(`${HOST}${expectedPath}?`),
    ).toBe(true);
  });

  test("example url carries all three parameters", () => {
    const query = new URL(buildExampleCardUrl(HOST)).searchParams;
    expect(Array.from(query.keys()).sort()).toEqual(
      Object.values(REPO_CARD_QUERY_PARAMETERS).sort(),
    );
    expect(query.get("theme")).toBe("light");
    expect(query.get("locale")).toBe("pt-BR");
    expect(query.get("width")).toBe("480");
    expect(EXAMPLE_CARD_QUERY).toBe("theme=light&locale=pt-BR&width=480");
  });

  test("example url has no double slash", () => {
    const plain = buildExampleCardUrl(HOST);
    const trailing = buildExampleCardUrl(`${HOST}/`);
    expect(trailing).toBe(plain);
    expect(plain.replace("https://", "")).not.toContain("//");
  });
});

describe("PARAMETER_ROWS", () => {
  test("parameter rows mirror card config", () => {
    expect(Object.keys(PARAMETER_ROWS)).toEqual(["theme", "locale", "width"]);
    expect(PARAMETER_ROWS.theme.name).toBe("theme");
    expect(PARAMETER_ROWS.theme.values).toEqual(Object.values(CARD_THEMES));
    expect(PARAMETER_ROWS.theme.defaultValue).toBe(CARD_DEFAULT_THEME);
    expect(PARAMETER_ROWS.locale.name).toBe("locale");
    expect(PARAMETER_ROWS.locale.values).toEqual(locales);
    expect(PARAMETER_ROWS.locale.defaultValue).toBe(CARD_DEFAULT_LOCALE);
    expect(PARAMETER_ROWS.width.name).toBe("width");
    expect(PARAMETER_ROWS.width.min).toBe(CARD_MIN_WIDTH);
    expect(PARAMETER_ROWS.width.max).toBe(CARD_MAX_WIDTH);
    expect(PARAMETER_ROWS.width.defaultValue).toBe(String(CARD_DEFAULT_WIDTH));
  });

  test("example query values are non-defaults", () => {
    const theme = EXAMPLE_CARD_QUERY_VALUES.theme;
    expect(theme).not.toBe(PARAMETER_ROWS.theme.defaultValue);
    expect(PARAMETER_ROWS.theme.values).toContain(theme);

    const locale = EXAMPLE_CARD_QUERY_VALUES.locale;
    expect(locale).not.toBe(PARAMETER_ROWS.locale.defaultValue);
    expect(PARAMETER_ROWS.locale.values).toContain(locale);

    const width = Number(EXAMPLE_CARD_QUERY_VALUES.width);
    expect(String(width)).not.toBe(PARAMETER_ROWS.width.defaultValue);
    expect(width).toBeGreaterThanOrEqual(PARAMETER_ROWS.width.min);
    expect(width).toBeLessThanOrEqual(PARAMETER_ROWS.width.max);
  });
});
