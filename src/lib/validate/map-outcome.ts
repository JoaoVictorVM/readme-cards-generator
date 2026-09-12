import type { RepositoryLookupOutcome } from "@/lib/github";
import type { MappedResponse } from "@/lib/validate/types";

export function mapOutcome(outcome: RepositoryLookupOutcome): MappedResponse {
  switch (outcome.status) {
    case "ok":
      return {
        status: 200,
        body: {
          exists: true,
          owner: outcome.data.owner,
          repo: outcome.data.name,
        },
      };
    case "not_found":
      return { status: 404, body: { exists: false, error: "not_found" } };
    case "rate_limited": {
      const hint = outcome.retryAfterSeconds;
      const headers =
        hint !== null && hint >= 1
          ? { "Retry-After": String(Math.floor(hint)) }
          : undefined;
      return {
        status: 403,
        body: { exists: false, error: "rate_limited" },
        ...(headers ? { headers } : {}),
      };
    }
    case "upstream_error":
      return { status: 502, body: { exists: false, error: "upstream_error" } };
    case "unexpected_error":
      if (outcome.reason === "invalid_ref") {
        return { status: 400, body: { exists: false, error: "invalid_input" } };
      }
      return {
        status: 500,
        body: { exists: false, error: "unexpected_error" },
      };
  }
}
