import type { Locale } from "@/i18n/config";
import {
  CARD_DEFAULT_LOCALE,
  CARD_DEFAULT_THEME,
  CARD_DEFAULT_WIDTH,
  CARD_MAX_WIDTH,
  CARD_MIN_WIDTH,
} from "@/lib/card/config";
import type { CardTheme } from "@/lib/card/types";

export function resolveCardTheme(value: unknown): CardTheme {
  return value === "light" ? "light" : CARD_DEFAULT_THEME;
}

export function resolveCardLocale(value: unknown): Locale {
  return value === "pt-BR" ? "pt-BR" : CARD_DEFAULT_LOCALE;
}

export function resolveCardWidth(value: unknown): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(numeric)) return CARD_DEFAULT_WIDTH;
  const rounded = Math.round(numeric);
  return Math.min(Math.max(rounded, CARD_MIN_WIDTH), CARD_MAX_WIDTH);
}
