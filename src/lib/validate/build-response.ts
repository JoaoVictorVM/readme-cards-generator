import { rateLimitHeaders, type RateLimitDecision } from "@/lib/rate-limit";
import {
  VALIDATE_CACHE_CONTROL,
  VALIDATE_CONTENT_TYPE,
  VALIDATE_CONTENT_TYPE_OPTIONS,
} from "@/lib/validate/config";
import type {
  MappedResponse,
  ValidationBody,
  ValidationStatus,
} from "@/lib/validate/types";

export function buildResponse(
  status: ValidationStatus,
  body: ValidationBody,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", VALIDATE_CONTENT_TYPE);
  headers.set("Cache-Control", VALIDATE_CACHE_CONTROL);
  headers.set("X-Content-Type-Options", VALIDATE_CONTENT_TYPE_OPTIONS);
  return new Response(JSON.stringify(body), { status, headers });
}

export function buildMappedResponse(mapped: MappedResponse): Response {
  return buildResponse(mapped.status, mapped.body, mapped.headers);
}

export function buildInvalidInputResponse(): Response {
  return buildResponse(400, { exists: false, error: "invalid_input" });
}

export function buildRateLimitedResponse(
  decision: RateLimitDecision,
): Response {
  return buildResponse(
    429,
    { exists: false, error: "rate_limited" },
    rateLimitHeaders(decision),
  );
}

export function buildUnexpectedErrorResponse(): Response {
  return buildResponse(500, { exists: false, error: "unexpected_error" });
}
