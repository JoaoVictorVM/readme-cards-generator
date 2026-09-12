import { fetchRepository, parseRepositoryRef } from "@/lib/github";
import { guardRoute } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildInvalidInputResponse,
  buildMappedResponse,
  buildRateLimitedResponse,
  buildUnexpectedErrorResponse,
} from "@/lib/validate/build-response";
import {
  VALIDATE_RATE_LIMIT_NAMESPACE,
  VALIDATE_ROUTE_PATH,
} from "@/lib/validate/config";
import { mapOutcome } from "@/lib/validate/map-outcome";
import { readQuery } from "@/lib/validate/read-query";
import type { ValidationDependencies } from "@/lib/validate/types";

async function handle(
  request: Request,
  dependencies: ValidationDependencies = {},
): Promise<Response> {
  const limit = dependencies.checkRateLimit ?? checkRateLimit;
  const lookup = dependencies.fetchRepository ?? fetchRepository;

  const decision = await limit(request, VALIDATE_RATE_LIMIT_NAMESPACE);
  if (!decision.allowed) return buildRateLimitedResponse(decision);

  const query = readQuery(request);
  if (!query.ok) return buildInvalidInputResponse();

  const ref = parseRepositoryRef(query.data.owner, query.data.repo);
  if (!ref.ok) return buildInvalidInputResponse();

  const outcome = await lookup(ref.data.owner, ref.data.repo);
  return buildMappedResponse(mapOutcome(outcome));
}

export const handleValidateRequest = guardRoute<[ValidationDependencies?]>(
  VALIDATE_ROUTE_PATH,
  handle,
  () => buildUnexpectedErrorResponse(),
);
