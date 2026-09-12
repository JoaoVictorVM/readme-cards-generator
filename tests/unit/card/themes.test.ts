import { describe, expect, test } from "bun:test";
import {
  CARD_PALETTES,
  contrastRatio,
  paletteFor,
  relativeLuminance,
} from "@/lib/card/themes";

const ROLES = [
  "surface",
  "border",
  "primary",
  "secondary",
  "buttonBackground",
  "buttonLabel",
  "dotGreen",
  "dotAmber",
  "dotGray",
] as const;

describe("card palettes", () => {
  test("both palettes have every role", () => {
    for (const theme of ["dark", "light"] as const) {
      for (const role of ROLES) {
        expect(CARD_PALETTES[theme][role]).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });

  test("luminance of black and white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
  });

  test("contrast of black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 3);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 3);
  });

  test("name contrast meets floor in both themes", () => {
    for (const theme of ["dark", "light"] as const) {
      const { primary, surface } = CARD_PALETTES[theme];
      expect(contrastRatio(primary, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("button label contrast meets floor in both themes", () => {
    for (const theme of ["dark", "light"] as const) {
      const { buttonLabel, buttonBackground } = CARD_PALETTES[theme];
      expect(
        contrastRatio(buttonLabel, buttonBackground),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("light surface is white and text is dark", () => {
    expect(CARD_PALETTES.light.surface).toBe("#ffffff");
    expect(relativeLuminance(CARD_PALETTES.light.primary)).toBeLessThan(0.2);
  });

  test("unknown theme lookup returns dark", () => {
    for (const value of [undefined, null, "purple", "Light", 3]) {
      expect(paletteFor(value)).toBe(CARD_PALETTES.dark);
    }
    expect(paletteFor("light")).toBe(CARD_PALETTES.light);
  });
});
