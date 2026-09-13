export type RepositoryUrlFailure =
  | "empty"
  | "unsupported_host"
  | "missing_segments"
  | "invalid_owner"
  | "invalid_repo";

export type RepositoryPair = {
  owner: string;
  repo: string;
};

export type ValidationErrorKind =
  | "invalid_url"
  | "not_found"
  | "quota_exhausted"
  | "too_many_requests"
  | "could_not_verify";

export type ValidationOutcome =
  | { status: "ok"; owner: string; repo: string }
  | {
      status: "error";
      kind: ValidationErrorKind;
      retryAfterSeconds?: number;
    };

export type RequestResolution = ValidationOutcome | { status: "aborted" };

export type RawValidationResponse = {
  status: number;
  retryAfter: string | null;
  body: unknown;
};

export type FormState =
  | { status: "idle" }
  | { status: "validating"; sequence: number; previous: RepositoryPair | null }
  | { status: "success"; owner: string; repo: string }
  | {
      status: "error";
      kind: ValidationErrorKind;
      cooldownUntil: number | null;
    };

export type FormEvent =
  | { type: "REJECT_INPUT" }
  | { type: "SUBMIT"; sequence: number }
  | { type: "RESOLVE"; sequence: number; resolution: RequestResolution }
  | { type: "COOLDOWN_ENDED" };

export type RequestValidationOptions = {
  signal?: AbortSignal;
  fetchImplementation?: typeof fetch;
  timeoutMs?: number;
};

export type RequestValidation = (
  owner: string,
  repo: string,
  options?: RequestValidationOptions,
) => Promise<RequestResolution>;
