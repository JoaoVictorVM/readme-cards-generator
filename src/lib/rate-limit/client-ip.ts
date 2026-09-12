import {
  RATE_LIMIT_ANONYMOUS_IDENTIFIER,
  RATE_LIMIT_IDENTIFIER_MAX_LENGTH,
} from "@/lib/rate-limit/config";

export function resolveClientIdentifier(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded === null) return RATE_LIMIT_ANONYMOUS_IDENTIFIER;

  const first = forwarded.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.length === 0) return RATE_LIMIT_ANONYMOUS_IDENTIFIER;

  return first.slice(0, RATE_LIMIT_IDENTIFIER_MAX_LENGTH);
}
