export { checkRateLimit } from "@/lib/rate-limit/check-rate-limit";
export { rateLimitHeaders } from "@/lib/rate-limit/headers";
export type { RateLimitHeaders } from "@/lib/rate-limit/headers";
export {
  RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/rate-limit/config";
export { RATE_LIMIT_NAMESPACES } from "@/lib/rate-limit/types";
export type {
  RateLimitDecision,
  RateLimitDegradation,
  RateLimitDependencies,
  RateLimitNamespace,
} from "@/lib/rate-limit/types";
