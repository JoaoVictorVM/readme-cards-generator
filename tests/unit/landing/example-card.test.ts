import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import { EXAMPLE_CARD_STATIC_PATH } from "@/components/landing/config";
import { CARD_DEFAULT_WIDTH } from "@/lib/card";
import { CARD_PALETTES } from "@/lib/card/themes";
import { siteConfig } from "@/lib/site-config";
import {
  backgroundRect,
  expectStandaloneSvg,
  expectZeroExternalReferences,
  rendererHrefs,
  textContent,
} from "../card/helpers";

const { owner, name } = siteConfig.showcaseRepository;
const markup = readFileSync(join("public", EXAMPLE_CARD_STATIC_PATH), "utf8");

describe("static example card", () => {
  test("path is an absolute svg under public", () => {
    expect(EXAMPLE_CARD_STATIC_PATH.startsWith("/")).toBe(true);
    expect(EXAMPLE_CARD_STATIC_PATH.endsWith(".svg")).toBe(true);
  });

  test("is a standalone card at the default width", () => {
    expectStandaloneSvg(markup, CARD_DEFAULT_WIDTH);
    expectZeroExternalReferences(markup);
  });

  test("renders the showcase repository", () => {
    expect(markup).toContain(`<title>${owner}/${name}</title>`);
    expect(textContent(markup, 92, 42)).toBe(name);
    expect(rendererHrefs(markup)).toEqual([
      `https://github.com/${owner}/${name}`,
    ]);
  });

  test("uses the current dark palette", () => {
    const { surface, border, primary, buttonBackground, buttonLabel } =
      CARD_PALETTES.dark;
    expect(backgroundRect(markup)).toContain(`fill="${surface}"`);
    expect(backgroundRect(markup)).toContain(`stroke="${border}"`);
    expect(markup).toContain(`fill="${primary}">${name}</text>`);
    expect(markup).toContain(`fill="${buttonBackground}"/>`);
    expect(markup).toContain(`fill="${buttonLabel}">View Repository</text>`);
  });
});
