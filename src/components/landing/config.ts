// Declared locally instead of imported from `@/lib/repo-card/config`: that
// module binds the rate limiter and would drag the Upstash clients into the
// client bundle through `copy-example-url.tsx`. Guarded by a drift test.
export const EXAMPLE_CARD_QUERY_PARAMETERS = {
  theme: "theme",
  locale: "locale",
  width: "width",
} as const;

export const EXAMPLE_CARD_QUERY_VALUES = {
  [EXAMPLE_CARD_QUERY_PARAMETERS.theme]: "light",
  [EXAMPLE_CARD_QUERY_PARAMETERS.locale]: "pt-BR",
  [EXAMPLE_CARD_QUERY_PARAMETERS.width]: "480",
} as const;

export const EXAMPLE_CARD_QUERY = new URLSearchParams(
  EXAMPLE_CARD_QUERY_VALUES,
).toString();

export const COPY_CONFIRMATION_MS = 2000;

export const GENERATOR_SEGMENT = "gerar";
