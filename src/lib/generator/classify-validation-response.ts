import {
  GENERATOR_DEFAULT_COOLDOWN_SECONDS,
  GENERATOR_MAX_COOLDOWN_SECONDS,
} from "@/lib/generator/config";
import type {
  RawValidationResponse,
  ValidationOutcome,
} from "@/lib/generator/types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function readSuccessBody(
  body: unknown,
): { owner: string; repo: string } | null {
  if (typeof body !== "object" || body === null) return null;
  const { exists, owner, repo } = body as Record<string, unknown>;
  if (exists !== true) return null;
  if (!isNonEmptyString(owner) || !isNonEmptyString(repo)) return null;
  return { owner, repo };
}

export function parseRetryAfter(header: string | null): number {
  if (header === null) return GENERATOR_DEFAULT_COOLDOWN_SECONDS;
  const seconds = /^\d+$/.test(header.trim())
    ? Number.parseInt(header.trim(), 10)
    : Number.NaN;
  if (!Number.isFinite(seconds) || seconds < 1) {
    return GENERATOR_DEFAULT_COOLDOWN_SECONDS;
  }
  return Math.min(seconds, GENERATOR_MAX_COOLDOWN_SECONDS);
}

export function classifyValidationResponse(
  response: RawValidationResponse,
): ValidationOutcome {
  switch (response.status) {
    case 200: {
      const pair = readSuccessBody(response.body);
      return pair
        ? { status: "ok", owner: pair.owner, repo: pair.repo }
        : { status: "error", kind: "could_not_verify" };
    }
    case 400:
      return { status: "error", kind: "invalid_url" };
    case 404:
      return { status: "error", kind: "not_found" };
    case 403:
      return { status: "error", kind: "quota_exhausted" };
    case 429:
      return {
        status: "error",
        kind: "too_many_requests",
        retryAfterSeconds: parseRetryAfter(response.retryAfter),
      };
    default:
      return { status: "error", kind: "could_not_verify" };
  }
}
