import { fail, ok, type Result } from "@/lib/result";
import { VALIDATE_QUERY_PARAMETERS } from "@/lib/validate/config";
import type { QueryParameterName, ValidationQuery } from "@/lib/validate/types";

function readParameter(
  params: URLSearchParams,
  name: QueryParameterName,
): string | null {
  const value = params.get(VALIDATE_QUERY_PARAMETERS[name]);
  return value === null || value.length === 0 ? null : value;
}

export function readQuery(
  request: Request,
): Result<ValidationQuery, "invalid_input"> {
  const params = new URL(request.url).searchParams;
  const owner = readParameter(params, "owner");
  if (owner === null) return fail("invalid_input", "owner");
  const repo = readParameter(params, "repo");
  if (repo === null) return fail("invalid_input", "repo");
  return ok({ owner, repo });
}
