import { RATE_LIMIT_NAMESPACES } from "@/lib/rate-limit";

export const REPO_CARD_ROUTE_LABEL = "/api/repo/[owner]/[repo]";

export const REPO_CARD_ROUTE_PREFIX = "/api/repo";

export const REPO_CARD_QUERY_PARAMETERS = {
  theme: "theme",
  locale: "locale",
  width: "width",
} as const;

export const REPO_CARD_CONTENT_TYPE = "image/svg+xml; charset=utf-8";

export const REPO_CARD_CONTENT_TYPE_OPTIONS = "nosniff";

export const REPO_CARD_SUCCESS_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export const REPO_CARD_ERROR_CACHE_CONTROL = "public, s-maxage=60";

// The verdict belongs to the client, not the URL; caching it would let one
// exhausted client deny the card to every reader sharing the edge entry.
export const REPO_CARD_RATE_LIMITED_CACHE_CONTROL = "no-store";

export const REPO_CARD_RATE_LIMIT_NAMESPACE = RATE_LIMIT_NAMESPACES.card;
