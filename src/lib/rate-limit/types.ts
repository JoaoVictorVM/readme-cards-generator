export const RATE_LIMIT_NAMESPACES = {
  card: "card",
  validate: "validate",
} as const;

export type RateLimitNamespace =
  (typeof RATE_LIMIT_NAMESPACES)[keyof typeof RATE_LIMIT_NAMESPACES];

export type RateLimitDegradation = "not_configured" | "timeout" | "error";

type DecisionFields = {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  identifier: string;
};

export type RateLimitAllowed = DecisionFields & {
  allowed: true;
  degraded: RateLimitDegradation | null;
};

export type RateLimitRejected = DecisionFields & {
  allowed: false;
  degraded: null;
};

export type RateLimitDecision = RateLimitAllowed | RateLimitRejected;

export type LimiterResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export type Limiter = {
  prefix: string;
  limit(identifier: string): Promise<LimiterResult>;
};

export type LimiterProvider = (namespace: RateLimitNamespace) => Limiter | null;

export type RateLimitDependencies = {
  limiterProvider?: LimiterProvider;
  now?: () => number;
  timeoutMs?: number;
};
