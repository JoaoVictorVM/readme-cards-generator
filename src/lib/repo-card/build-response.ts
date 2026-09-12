import { renderErrorCard, type ErrorCardKind } from "@/lib/card";
import { rateLimitHeaders, type RateLimitDecision } from "@/lib/rate-limit";
import {
  REPO_CARD_CONTENT_TYPE,
  REPO_CARD_CONTENT_TYPE_OPTIONS,
  REPO_CARD_ERROR_CACHE_CONTROL,
  REPO_CARD_RATE_LIMITED_CACHE_CONTROL,
  REPO_CARD_SUCCESS_CACHE_CONTROL,
} from "@/lib/repo-card/config";
import type {
  RepoCardErrorStatus,
  RepoCardOptions,
  RepoCardStatus,
} from "@/lib/repo-card/types";

function cacheControlFor(status: RepoCardStatus): string {
  if (status === 200) return REPO_CARD_SUCCESS_CACHE_CONTROL;
  if (status === 429) return REPO_CARD_RATE_LIMITED_CACHE_CONTROL;
  return REPO_CARD_ERROR_CACHE_CONTROL;
}

export function buildSvgResponse(
  status: RepoCardStatus,
  markup: string,
  extraHeaders?: Record<string, string>,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", REPO_CARD_CONTENT_TYPE);
  headers.set("X-Content-Type-Options", REPO_CARD_CONTENT_TYPE_OPTIONS);
  headers.set("Cache-Control", cacheControlFor(status));
  return new Response(markup, { status, headers });
}

export function buildErrorCardResponse(
  status: RepoCardErrorStatus,
  kind: ErrorCardKind,
  options: RepoCardOptions,
  extraHeaders?: Record<string, string>,
): Response {
  return buildSvgResponse(
    status,
    renderErrorCard({ kind, ...options }),
    extraHeaders,
  );
}

export function buildInvalidRequestResponse(
  options: RepoCardOptions,
): Response {
  return buildErrorCardResponse(400, "invalid_request", options);
}

export function buildRateLimitedResponse(
  decision: RateLimitDecision,
  options: RepoCardOptions,
): Response {
  return buildErrorCardResponse(
    429,
    "too_many_requests",
    options,
    rateLimitHeaders(decision),
  );
}

export function buildUnexpectedErrorResponse(
  options: RepoCardOptions,
): Response {
  return buildErrorCardResponse(500, "unexpected_error", options);
}
