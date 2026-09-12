export const RATE_LIMIT_REQUESTS = 60;

export const RATE_LIMIT_WINDOW_SECONDS = 60;

export const RATE_LIMIT_WINDOW_MS = RATE_LIMIT_WINDOW_SECONDS * 1000;

export const RATE_LIMIT_WINDOW = `${RATE_LIMIT_WINDOW_SECONDS} s` as const;

export const RATE_LIMIT_TIMEOUT_MS = 1000;

export const RATE_LIMIT_IDENTIFIER_MAX_LENGTH = 64;

export const RATE_LIMIT_ANONYMOUS_IDENTIFIER = "anonymous";

export const RATE_LIMIT_KEY_PREFIXES = {
  card: "badge-generate:rl:card",
  validate: "badge-generate:rl:validate",
} as const;
