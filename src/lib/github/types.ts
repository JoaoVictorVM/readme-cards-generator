export type Repository = {
  owner: string;
  name: string;
  fullName: string;
  language: string | null;
  pushedAt: string;
  htmlUrl: string;
};

export type RepositoryLookupStatus =
  "ok" | "not_found" | "rate_limited" | "upstream_error" | "unexpected_error";

export type UpstreamErrorReason = "http_status" | "timeout" | "network";

export type UnexpectedErrorReason =
  "invalid_ref" | "invalid_json" | "missing_fields" | "thrown";

export type RepositoryLookupOutcome =
  | { status: "ok"; data: Repository }
  | { status: "not_found" }
  | {
      status: "rate_limited";
      resetAt: number | null;
      retryAfterSeconds: number | null;
    }
  | {
      status: "upstream_error";
      reason: UpstreamErrorReason;
      httpStatus: number | null;
    }
  | { status: "unexpected_error"; reason: UnexpectedErrorReason };

export type RepositoryRef = {
  owner: string;
  repo: string;
};

export type InvalidRefReason = "invalid_owner" | "invalid_repo";

export type FetchImplementation = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export type RepositoryLookupDependencies = {
  fetchImpl?: FetchImplementation;
  token?: string;
  now?: () => number;
};
