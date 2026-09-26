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
export const EXAMPLE_CARD_LIGHT_STATIC_PATH = "/example-card-light.svg";

export const SHOWCASE_DATA_PATH = "src/components/landing/showcase-data.json";

export const MARQUEE_REPOSITORIES = [
  { owner: "facebook", name: "react" },
  { owner: "vitejs", name: "vite" },
  { owner: "oven-sh", name: "bun" },
  { owner: "rust-lang", name: "rust" },
  { owner: "golang", name: "go" },
  { owner: "python", name: "cpython" },
  { owner: "sveltejs", name: "svelte" },
  { owner: "tailwindlabs", name: "tailwindcss" },
] as const;

export const COPY_CONFIRMATION_MS = 2000;

export const GENERATOR_SEGMENT = "gerar";
