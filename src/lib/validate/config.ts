import { RATE_LIMIT_NAMESPACES } from "@/lib/rate-limit";

export const VALIDATE_ROUTE_PATH = "/api/validate";

export const VALIDATE_QUERY_PARAMETERS = {
  owner: "owner",
  repo: "repo",
} as const;

export const VALIDATE_CONTENT_TYPE = "application/json; charset=utf-8";

export const VALIDATE_CACHE_CONTROL = "no-store";

export const VALIDATE_CONTENT_TYPE_OPTIONS = "nosniff";

export const VALIDATE_RATE_LIMIT_NAMESPACE = RATE_LIMIT_NAMESPACES.validate;
