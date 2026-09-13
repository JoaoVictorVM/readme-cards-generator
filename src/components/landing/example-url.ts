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
import { EXAMPLE_CARD_QUERY } from "@/components/landing/config";

export type ParameterRow = {
  name: string;
  values: readonly string[];
  defaultValue: string;
};

export type ParameterRows = {
  theme: ParameterRow;
  locale: ParameterRow;
  width: ParameterRow & { min: number; max: number };
};

export const PARAMETER_ROWS: ParameterRows = {
  theme: {
    name: REPO_CARD_QUERY_PARAMETERS.theme,
    values: Object.values(CARD_THEMES),
    defaultValue: CARD_DEFAULT_THEME,
  },
  locale: {
    name: REPO_CARD_QUERY_PARAMETERS.locale,
    values: locales,
    defaultValue: CARD_DEFAULT_LOCALE,
  },
  width: {
    name: REPO_CARD_QUERY_PARAMETERS.width,
    values: [`${CARD_MIN_WIDTH}–${CARD_MAX_WIDTH}`],
    defaultValue: String(CARD_DEFAULT_WIDTH),
    min: CARD_MIN_WIDTH,
    max: CARD_MAX_WIDTH,
  },
};

export function showcaseCardPath(): string {
  const { owner, name } = siteConfig.showcaseRepository;
  return buildCardPath(owner, name);
}

export function buildExampleCardUrl(host: string): string {
  const base = host.replace(/\/+$/, "");
  return `${base}${showcaseCardPath()}?${EXAMPLE_CARD_QUERY}`;
}
