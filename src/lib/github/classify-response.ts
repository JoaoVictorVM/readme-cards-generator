import { GITHUB_SUCCESS_STATUS } from "@/lib/github/config";
import type { RepositoryLookupOutcome } from "@/lib/github/types";

export type HeaderSource = Headers | Record<string, string | undefined>;

export type ResponseClassification =
  | { status: "ok" }
  | Extract<
      RepositoryLookupOutcome,
      { status: "not_found" | "rate_limited" | "upstream_error" }
    >;

const QUOTA_STATUSES = new Set([403, 429]);

function readHeader(source: HeaderSource, name: string): string | null {
  if (typeof (source as Headers).get === "function") {
    return (source as Headers).get(name);
  }
  const lowered = name.toLowerCase();
  for (const [key, value] of Object.entries(
    source as Record<string, string | undefined>,
  )) {
    if (key.toLowerCase() === lowered && typeof value === "string")
      return value;
  }
  return null;
}

function readInteger(source: HeaderSource, name: string): number | null {
  const raw = readHeader(source, name);
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || !/^-?\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function quotaIsExhausted(headers: HeaderSource): boolean {
  return readInteger(headers, "x-ratelimit-remaining") === 0;
}

function rateLimitHints(
  headers: HeaderSource,
  now: number,
): { resetAt: number | null; retryAfterSeconds: number | null } {
  const resetSeconds = readInteger(headers, "x-ratelimit-reset");
  if (resetSeconds !== null) {
    const resetAt = resetSeconds * 1000;
    return {
      resetAt,
      retryAfterSeconds: Math.max(0, Math.ceil((resetAt - now) / 1000)),
    };
  }
  const retryAfter = readInteger(headers, "retry-after");
  if (retryAfter !== null) {
    return { resetAt: null, retryAfterSeconds: Math.max(0, retryAfter) };
  }
  return { resetAt: null, retryAfterSeconds: null };
}

export function classifyResponse(
  status: number,
  headers: HeaderSource,
  now: number = Date.now(),
): ResponseClassification {
  if (status === GITHUB_SUCCESS_STATUS) return { status: "ok" };
  if (status === 404) return { status: "not_found" };
  if (QUOTA_STATUSES.has(status) && quotaIsExhausted(headers)) {
    return { status: "rate_limited", ...rateLimitHints(headers, now) };
  }
  return {
    status: "upstream_error",
    reason: "http_status",
    httpStatus: status,
  };
}
