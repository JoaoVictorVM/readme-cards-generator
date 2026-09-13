import { REPO_CARD_QUERY_PARAMETERS } from "@/lib/repo-card/config";

export const EXAMPLE_CARD_QUERY_VALUES = {
  [REPO_CARD_QUERY_PARAMETERS.theme]: "light",
  [REPO_CARD_QUERY_PARAMETERS.locale]: "pt-BR",
  [REPO_CARD_QUERY_PARAMETERS.width]: "480",
} as const;

export const EXAMPLE_CARD_QUERY = new URLSearchParams(
  EXAMPLE_CARD_QUERY_VALUES,
).toString();

export const COPY_CONFIRMATION_MS = 2000;

export const GENERATOR_SEGMENT = "gerar";
