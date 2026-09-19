import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  EXAMPLE_CARD_LIGHT_STATIC_PATH,
  EXAMPLE_CARD_STATIC_PATH,
} from "@/components/landing/config";
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
const CARDS = [
  { theme: "dark", path: EXAMPLE_CARD_STATIC_PATH },
  { theme: "light", path: EXAMPLE_CARD_LIGHT_STATIC_PATH },
] as const;

for (const { theme, path } of CARDS) {
  const markup = readFileSync(join("public", path), "utf8");

  describe(`static example card (${theme})`, () => {
    test("path is an absolute svg under public", () => {
      expect(path.startsWith("/")).toBe(true);
      expect(path.endsWith(".svg")).toBe(true);
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

    test("uses the current palette", () => {
      const { surface, border, primary, buttonBackground, buttonLabel } =
        CARD_PALETTES[theme];
      expect(backgroundRect(markup)).toContain(`fill="${surface}"`);
      expect(backgroundRect(markup)).toContain(`stroke="${border}"`);
      expect(markup).toContain(`fill="${primary}">${name}</text>`);
      expect(markup).toContain(`fill="${buttonBackground}"/>`);
      expect(markup).toContain(`fill="${buttonLabel}">View Repository</text>`);
    });
  });
}
