import en from "./dictionaries/en";
import ptBR from "./dictionaries/pt-BR";
import { defaultLocale, isLocale, type Locale } from "./config";
import type { Dictionary } from "./types";

const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": ptBR as Dictionary,
  en,
};

export function getDictionary(locale: unknown): Dictionary {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[defaultLocale];
}

export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
