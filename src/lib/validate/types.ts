import type {
  RepositoryLookupDependencies,
  RepositoryLookupOutcome,
} from "@/lib/github";
import type {
  RateLimitDecision,
  RateLimitDependencies,
  RateLimitNamespace,
} from "@/lib/rate-limit";

export type ValidationErrorCode =
  | "invalid_input"
  | "not_found"
  | "rate_limited"
  | "upstream_error"
  | "unexpected_error";

export type ValidationSuccessBody = {
  exists: true;
  owner: string;
  repo: string;
};

export type ValidationFailureBody = {
  exists: false;
  error: ValidationErrorCode;
};

export type ValidationBody = ValidationSuccessBody | ValidationFailureBody;

export type ValidationStatus = 200 | 400 | 403 | 404 | 429 | 500 | 502;

export type MappedResponse = {
  status: ValidationStatus;
  body: ValidationBody;
  headers?: Record<string, string>;
};

export type QueryParameterName = "owner" | "repo";

export type ValidationQuery = {
  owner: string;
  repo: string;
};

export type RepositoryLookup = (
  owner: string,
  repo: string,
  dependencies?: RepositoryLookupDependencies,
) => Promise<RepositoryLookupOutcome>;

export type RateLimitCheck = (
  input: Request | Headers,
  namespace: RateLimitNamespace,
  dependencies?: RateLimitDependencies,
) => Promise<RateLimitDecision>;

export type ValidationDependencies = {
  fetchRepository?: RepositoryLookup;
  checkRateLimit?: RateLimitCheck;
};
