import {
  ACTIVITY_BASELINE_Y,
  ACTIVITY_FONT_SIZE,
  ACTIVITY_TEXT_X,
  BUTTON_HEIGHT,
  BUTTON_LABEL_BASELINE_Y,
  BUTTON_RADIUS,
  BUTTON_Y,
  CARD_BACKGROUND_RADIUS,
  CARD_BORDER_WIDTH,
  CARD_HEIGHT,
  CARD_PADDING,
  DOT_CENTER_X,
  DOT_CENTER_Y,
  DOT_RADIUS,
  ERROR_FONT_SIZE,
  ERROR_GLYPH_Y,
  ERROR_MESSAGE_BASELINE_Y,
  ERROR_MESSAGE_X,
  NAME_BASELINE_Y,
  NAME_CHAR_RATIO,
  NAME_FONT_SIZE,
  SECONDARY_CHAR_RATIO,
  TEXT_COLUMN_X,
  TILE_ICON_INSET,
  TILE_RADIUS,
  TILE_SIZE,
} from "@/lib/card/config";
import { characterBudget } from "@/lib/card/truncate-text";
import type { CardLayout } from "@/lib/card/types";

export function computeLayout(width: number): CardLayout {
  const inset = CARD_BORDER_WIDTH / 2;
  const nameBudgetPx = width - TEXT_COLUMN_X - CARD_PADDING;
  const activityBudgetPx = width - ACTIVITY_TEXT_X - CARD_PADDING;
  const errorBudgetPx = width - ERROR_MESSAGE_X - CARD_PADDING;

  return {
    width,
    height: CARD_HEIGHT,
    background: {
      x: inset,
      y: inset,
      width: width - CARD_BORDER_WIDTH,
      height: CARD_HEIGHT - CARD_BORDER_WIDTH,
      rx: CARD_BACKGROUND_RADIUS,
    },
    tile: {
      x: CARD_PADDING,
      y: CARD_PADDING,
      size: TILE_SIZE,
      rx: TILE_RADIUS,
    },
    icon: {
      x: CARD_PADDING + TILE_ICON_INSET,
      y: CARD_PADDING + TILE_ICON_INSET,
    },
    name: {
      x: TEXT_COLUMN_X,
      y: NAME_BASELINE_Y,
      budgetPx: nameBudgetPx,
      budgetChars: characterBudget(
        nameBudgetPx,
        NAME_FONT_SIZE,
        NAME_CHAR_RATIO,
      ),
    },
    dot: { cx: DOT_CENTER_X, cy: DOT_CENTER_Y, r: DOT_RADIUS },
    activity: {
      x: ACTIVITY_TEXT_X,
      y: ACTIVITY_BASELINE_Y,
      budgetPx: activityBudgetPx,
      budgetChars: characterBudget(
        activityBudgetPx,
        ACTIVITY_FONT_SIZE,
        SECONDARY_CHAR_RATIO,
      ),
    },
    button: {
      x: CARD_PADDING,
      y: BUTTON_Y,
      width: width - CARD_PADDING * 2,
      height: BUTTON_HEIGHT,
      rx: BUTTON_RADIUS,
      labelX: width / 2,
      labelY: BUTTON_LABEL_BASELINE_Y,
    },
    errorGlyph: { x: CARD_PADDING, y: ERROR_GLYPH_Y },
    errorMessage: {
      x: ERROR_MESSAGE_X,
      y: ERROR_MESSAGE_BASELINE_Y,
      budgetPx: errorBudgetPx,
      budgetChars: characterBudget(
        errorBudgetPx,
        ERROR_FONT_SIZE,
        SECONDARY_CHAR_RATIO,
      ),
    },
  };
}
