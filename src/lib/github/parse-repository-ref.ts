import { fail, ok, type Result } from "@/lib/result";
import { GITHUB_REF_PATTERN } from "@/lib/github/config";
import type { InvalidRefReason, RepositoryRef } from "@/lib/github/types";

// A segment made only of dots still matches the charset but would collapse the
// request path when the URL is resolved, so it is rejected before composition.
const DOT_ONLY_SEGMENT = /^\.+$/;

function isValidSegment(segment: unknown): segment is string {
  return (
    typeof segment === "string" &&
    GITHUB_REF_PATTERN.test(segment) &&
    !DOT_ONLY_SEGMENT.test(segment)
  );
}

export function parseRepositoryRef(
  owner: string,
  repo: string,
): Result<RepositoryRef, InvalidRefReason> {
  if (!isValidSegment(owner)) return fail("invalid_owner");
  if (!isValidSegment(repo)) return fail("invalid_repo");
  return ok({ owner, repo });
}
