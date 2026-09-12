import { renderCard } from "@/lib/card";
import { fetchRepository, parseRepositoryRef } from "@/lib/github";
import { guardRoute } from "@/lib/http";
import { resolveLanguageIcon } from "@/lib/language-icon";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildErrorCardResponse,
  buildInvalidRequestResponse,
  buildRateLimitedResponse,
  buildSvgResponse,
  buildUnexpectedErrorResponse,
} from "@/lib/repo-card/build-response";
import {
  REPO_CARD_RATE_LIMIT_NAMESPACE,
  REPO_CARD_ROUTE_LABEL,
} from "@/lib/repo-card/config";
import { mapOutcome } from "@/lib/repo-card/map-outcome";
import { readCardOptions } from "@/lib/repo-card/read-card-options";
import type {
  RepoCardDependencies,
  RepoCardParams,
} from "@/lib/repo-card/types";

async function handle(
  request: Request,
  params: RepoCardParams,
  dependencies: RepoCardDependencies = {},
): Promise<Response> {
  const limit = dependencies.checkRateLimit ?? checkRateLimit;
  const lookup = dependencies.fetchRepository ?? fetchRepository;
  const resolveIcon = dependencies.resolveLanguageIcon ?? resolveLanguageIcon;
  const now = dependencies.now ?? Date.now;

  const decision = await limit(request, REPO_CARD_RATE_LIMIT_NAMESPACE);
  const options = readCardOptions(request);
  if (!decision.allowed) return buildRateLimitedResponse(decision, options);

  const ref = parseRepositoryRef(params.owner, params.repo);
  if (!ref.ok) return buildInvalidRequestResponse(options);

  const mapped = mapOutcome(await lookup(ref.data.owner, ref.data.repo));
  if (mapped.status !== 200) {
    return buildErrorCardResponse(
      mapped.status,
      mapped.kind,
      options,
      mapped.headers,
    );
  }

  const { repository } = mapped;
  const visual = await resolveIcon(repository.language);
  return buildSvgResponse(
    200,
    renderCard({ repository, visual, ...options, now: now() }),
  );
}

export const handleRepoCardRequest = guardRoute<
  [RepoCardParams, RepoCardDependencies?]
>(REPO_CARD_ROUTE_LABEL, handle, (_error, request) =>
  buildUnexpectedErrorResponse(readCardOptions(request)),
);
