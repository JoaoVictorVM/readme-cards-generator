import { logError, logWarn } from "@/lib/logger";
import { buildRepositoryRequest } from "@/lib/github/build-request";
import { classifyResponse } from "@/lib/github/classify-response";
import {
  GITHUB_MAX_RESPONSE_BYTES,
  GITHUB_REQUEST_TIMEOUT_MS,
} from "@/lib/github/config";
import { normalizeRepository } from "@/lib/github/normalize-repository";
import { parseRepositoryRef } from "@/lib/github/parse-repository-ref";
import type {
  FetchImplementation,
  RepositoryLookupDependencies,
  RepositoryLookupOutcome,
} from "@/lib/github/types";

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error;
}

function declaredTooLarge(response: Response): boolean {
  const declared = response.headers.get("content-length");
  if (declared === null) return false;
  const size = Number(declared);
  return Number.isFinite(size) && size > GITHUB_MAX_RESPONSE_BYTES;
}

export async function fetchRepository(
  owner: string,
  repo: string,
  dependencies: RepositoryLookupDependencies = {},
): Promise<RepositoryLookupOutcome> {
  const ref = `${owner}/${repo}`;
  try {
    const parsed = parseRepositoryRef(owner, repo);
    if (!parsed.ok) {
      return { status: "unexpected_error", reason: "invalid_ref" };
    }

    const fetchImpl: FetchImplementation =
      dependencies.fetchImpl ??
      ((url, init) => globalThis.fetch(url, init as RequestInit));
    const now = dependencies.now ?? (() => Date.now());
    const request = buildRepositoryRequest(parsed.data, dependencies.token);

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      GITHUB_REQUEST_TIMEOUT_MS,
    );

    try {
      // Invoked outside the try so that a seam throwing synchronously reaches
      // the outer guard as `thrown` instead of being read as a transport error.
      const pending = fetchImpl(request.url, {
        method: "GET",
        headers: request.headers,
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });

      let response: Response;
      try {
        response = await pending;
      } catch (error) {
        if (controller.signal.aborted) {
          logError("github lookup timed out", {
            ref,
            budgetMs: GITHUB_REQUEST_TIMEOUT_MS,
          });
          return {
            status: "upstream_error",
            reason: "timeout",
            httpStatus: null,
          };
        }
        if (!(error instanceof Error)) {
          logError("github lookup threw", { ref, error: errorName(error) });
          return { status: "unexpected_error", reason: "thrown" };
        }
        logError("github lookup transport failure", {
          ref,
          error: errorName(error),
        });
        return {
          status: "upstream_error",
          reason: "network",
          httpStatus: null,
        };
      }

      const classification = classifyResponse(
        response.status,
        response.headers,
        now(),
      );

      if (classification.status === "not_found") {
        logWarn("github repository not found", { ref });
        return classification;
      }
      if (classification.status === "rate_limited") {
        logWarn("github quota exhausted", {
          ref,
          resetAt: classification.resetAt,
        });
        return classification;
      }
      if (classification.status === "upstream_error") {
        logError("github lookup rejected", {
          ref,
          httpStatus: classification.httpStatus,
        });
        return classification;
      }

      if (declaredTooLarge(response)) {
        logError("github response exceeds the size ceiling", {
          ref,
          size: response.headers.get("content-length"),
        });
        return { status: "unexpected_error", reason: "invalid_json" };
      }

      let body: unknown;
      try {
        const text = await response.text();
        const size = new TextEncoder().encode(text).byteLength;
        if (size > GITHUB_MAX_RESPONSE_BYTES) {
          logError("github response exceeds the size ceiling", { ref, size });
          return { status: "unexpected_error", reason: "invalid_json" };
        }
        body = JSON.parse(text);
      } catch (error) {
        if (controller.signal.aborted) {
          logError("github lookup timed out", {
            ref,
            budgetMs: GITHUB_REQUEST_TIMEOUT_MS,
          });
          return {
            status: "upstream_error",
            reason: "timeout",
            httpStatus: null,
          };
        }
        logError("github response body is not valid json", {
          ref,
          error: errorName(error),
        });
        return { status: "unexpected_error", reason: "invalid_json" };
      }

      const normalized = normalizeRepository(body);
      if (!normalized.ok) {
        logError("github payload is missing required fields", {
          ref,
          field: normalized.detail,
        });
        return { status: "unexpected_error", reason: "missing_fields" };
      }

      return { status: "ok", data: normalized.data };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    logError("github lookup threw", { ref, error: errorName(error) });
    return { status: "unexpected_error", reason: "thrown" };
  }
}
