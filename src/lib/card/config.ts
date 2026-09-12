import type { Locale } from "@/i18n/config";
import type { CardTheme } from "@/lib/card/types";

export const CARD_MIN_WIDTH = 280;

export const CARD_MAX_WIDTH = 600;

export const CARD_DEFAULT_WIDTH = 380;

export const CARD_HEIGHT = 150;

export const CARD_DEFAULT_THEME: CardTheme = "dark";

export const CARD_DEFAULT_LOCALE: Locale = "en";

export const CARD_PADDING = 20;

export const CARD_BACKGROUND_RADIUS = 12;

export const CARD_BORDER_WIDTH = 1;

export const TILE_SIZE = 56;

export const TILE_RADIUS = 14;

export const TILE_ICON_INSET = 12;

export const TEXT_COLUMN_GAP = 16;

export const TEXT_COLUMN_X = CARD_PADDING + TILE_SIZE + TEXT_COLUMN_GAP;

export const NAME_BASELINE_Y = CARD_PADDING + 22;

export const DOT_RADIUS = 5;

export const DOT_CENTER_X = TEXT_COLUMN_X + DOT_RADIUS;

export const DOT_CENTER_Y = 62;

export const ACTIVITY_TEXT_GAP = 11;

export const ACTIVITY_TEXT_X = DOT_CENTER_X + ACTIVITY_TEXT_GAP;

export const ACTIVITY_BASELINE_Y = 66;

export const BUTTON_HEIGHT = 36;

export const BUTTON_RADIUS = 8;

export const BUTTON_Y = CARD_HEIGHT - CARD_PADDING - BUTTON_HEIGHT;

export const BUTTON_LABEL_BASELINE_Y = 117;

export const ERROR_GLYPH_SIZE = 24;

export const ERROR_GLYPH_Y = 63;

export const ERROR_MESSAGE_GAP = 12;

export const ERROR_MESSAGE_X =
  CARD_PADDING + ERROR_GLYPH_SIZE + ERROR_MESSAGE_GAP;

export const ERROR_MESSAGE_BASELINE_Y = 80;

export const NAME_FONT_SIZE = 16;

export const NAME_FONT_WEIGHT = 700;

export const ACTIVITY_FONT_SIZE = 13;

export const ACTIVITY_FONT_WEIGHT = 400;

export const BUTTON_FONT_SIZE = 13;

export const BUTTON_FONT_WEIGHT = 600;

export const ERROR_FONT_SIZE = 13;

export const ERROR_FONT_WEIGHT = 500;

export const NAME_CHAR_RATIO = 0.6;

export const SECONDARY_CHAR_RATIO = 0.52;

export const ELLIPSIS = "…";

export const FONT_STACK =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const HOUR_MS = 60 * 60 * 1000;

export const DAY_MS = 24 * HOUR_MS;

export const DAYS_PER_MONTH = 30;

export const DAYS_PER_YEAR = 365;

export const GREEN_BAND_MAX_DAYS = 30;

export const AMBER_BAND_MAX_DAYS = 180;

export const MAX_MONTHS = 11;

export const REPOSITORY_LINK_ORIGIN = "https://github.com/";
