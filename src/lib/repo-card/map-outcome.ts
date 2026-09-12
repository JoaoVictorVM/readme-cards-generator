import type { RepositoryLookupOutcome } from "@/lib/github";
import type { MappedRepoCardOutcome } from "@/lib/repo-card/types";

export function mapOutcome(
  outcome: RepositoryLookupOutcome,
): MappedRepoCardOutcome {
  switch (outcome.status) {
    case "ok":
      return { status: 200, repository: outcome.data };
    case "not_found":
      return { status: 404, kind: "not_found" };
    case "rate_limited": {
      const hint = outcome.retryAfterSeconds;
      const headers =
        hint !== null && hint >= 1
          ? { "Retry-After": String(Math.floor(hint)) }
          : undefined;
      return {
        status: 403,
        kind: "rate_limited",
        ...(headers ? { headers } : {}),
      };
    }
    case "upstream_error":
      return { status: 502, kind: "upstream_error" };
    case "unexpected_error":
      if (outcome.reason === "invalid_ref") {
        return { status: 400, kind: "invalid_request" };
      }
      return { status: 500, kind: "unexpected_error" };
  }
}
