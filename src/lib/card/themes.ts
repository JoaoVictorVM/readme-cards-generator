import type { CardPalette, CardTheme } from "@/lib/card/types";

export const CARD_PALETTES: Record<CardTheme, CardPalette> = {
  dark: {
    surface: "#0d1117",
    border: "#30363d",
    primary: "#e6edf3",
    secondary: "#8b949e",
    buttonBackground: "#1f6feb",
    buttonLabel: "#ffffff",
    dotGreen: "#3fb950",
    dotAmber: "#d29922",
    dotGray: "#8b949e",
  },
  light: {
    surface: "#ffffff",
    border: "#d0d7de",
    primary: "#24292f",
    secondary: "#57606a",
    buttonBackground: "#0969da",
    buttonLabel: "#ffffff",
    dotGreen: "#1a7f37",
    dotAmber: "#9a6700",
    dotGray: "#6e7781",
  },
};

export function paletteFor(theme: unknown): CardPalette {
  return theme === "light" ? CARD_PALETTES.light : CARD_PALETTES.dark;
}

function channel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a >= b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}
