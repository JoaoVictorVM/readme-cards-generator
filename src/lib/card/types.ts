import type { Locale } from "@/i18n/config";
import type { Repository } from "@/lib/github/types";
import type { LanguageVisual } from "@/lib/language-icon/types";

export const CARD_THEMES = {
  dark: "dark",
  light: "light",
} as const;

export type CardTheme = (typeof CARD_THEMES)[keyof typeof CARD_THEMES];

export const ERROR_CARD_KINDS = {
  invalid_request: "invalid_request",
  not_found: "not_found",
  rate_limited: "rate_limited",
  too_many_requests: "too_many_requests",
  upstream_error: "upstream_error",
  unexpected_error: "unexpected_error",
} as const;

export type ErrorCardKind =
  (typeof ERROR_CARD_KINDS)[keyof typeof ERROR_CARD_KINDS];

export type RenderCardInput = {
  repository: Repository;
  visual: LanguageVisual;
  theme?: CardTheme;
  locale?: Locale;
  width?: number;
  now?: number;
};

export type RenderErrorCardInput = {
  kind: ErrorCardKind;
  theme?: CardTheme;
  locale?: Locale;
  width?: number;
};

export type ActivityUnit = "hour" | "day" | "month" | "year";

export type DotBand = "green" | "amber" | "gray";

export type Activity =
  | { known: true; unit: ActivityUnit; count: number; band: DotBand }
  | { known: false; band: "gray" };

export type CardPalette = {
  surface: string;
  border: string;
  primary: string;
  secondary: string;
  buttonBackground: string;
  buttonLabel: string;
  dotGreen: string;
  dotAmber: string;
  dotGray: string;
};

export type CardLayout = {
  width: number;
  height: number;
  background: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
  };
  tile: { x: number; y: number; size: number; rx: number };
  icon: { x: number; y: number };
  name: { x: number; y: number; budgetPx: number; budgetChars: number };
  dot: { cx: number; cy: number; r: number };
  activity: { x: number; y: number; budgetPx: number; budgetChars: number };
  button: {
    x: number;
    y: number;
    width: number;
    height: number;
    rx: number;
    labelX: number;
    labelY: number;
  };
  errorGlyph: { x: number; y: number };
  errorMessage: { x: number; y: number; budgetPx: number; budgetChars: number };
};
