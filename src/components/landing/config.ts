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

export const EXAMPLE_CARD_STATIC_PATH = "/example-card.svg";

export const COPY_CONFIRMATION_MS = 2000;

export const GENERATOR_SEGMENT = "gerar";
