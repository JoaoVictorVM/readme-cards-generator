export const locales = ["pt-BR", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt-BR";

export const localePrefixes: Record<Locale, string> = {
  "pt-BR": "",
  en: "/en",
};

export const localeLabels: Record<Locale, string> = {
  "pt-BR": "PT",
  en: "EN",
};

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}
