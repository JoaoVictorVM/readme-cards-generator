import type { Locale } from "@/i18n/config";

const ptBR = {
  activityTemplate: "Atualizado há {n} {unit}",
  units: {
    hour: { one: "hora", many: "horas" },
    day: { one: "dia", many: "dias" },
    month: { one: "mês", many: "meses" },
    year: { one: "ano", many: "anos" },
  },
  activityUnknown: "Atividade recente desconhecida",
  buttonLabel: "Ver repositório",
  errors: {
    invalid_request: "Repositório inválido",
    not_found: "Repositório não encontrado",
    rate_limited: "Limite da API do GitHub excedido",
    too_many_requests: "Muitas requisições, tente de novo em um minuto",
    upstream_error: "GitHub indisponível, tente mais tarde",
    unexpected_error: "Erro inesperado ao gerar o card",
  },
  hints: {
    rate_limited: "Configure GITHUB_TOKEN para ampliar a cota",
  },
} as const;

type Widen<T> = T extends string
  ? string
  : { -readonly [K in keyof T]: Widen<T[K]> };

export type CardCopy = Widen<typeof ptBR>;

const en: CardCopy = {
  activityTemplate: "Updated {n} {unit} ago",
  units: {
    hour: { one: "hour", many: "hours" },
    day: { one: "day", many: "days" },
    month: { one: "month", many: "months" },
    year: { one: "year", many: "years" },
  },
  activityUnknown: "Last activity unknown",
  buttonLabel: "View Repository",
  errors: {
    invalid_request: "Invalid repository",
    not_found: "Repository not found",
    rate_limited: "GitHub API rate limit exceeded",
    too_many_requests: "Too many requests, try again in a minute",
    upstream_error: "GitHub unavailable, try again later",
    unexpected_error: "Unexpected error rendering the card",
  },
  hints: {
    rate_limited: "Configure GITHUB_TOKEN to raise the quota",
  },
};

export const CARD_COPY: Record<Locale, CardCopy> = {
  "pt-BR": ptBR as CardCopy,
  en,
};

export function cardCopyFor(locale: unknown): CardCopy {
  return locale === "pt-BR" ? CARD_COPY["pt-BR"] : CARD_COPY.en;
}
