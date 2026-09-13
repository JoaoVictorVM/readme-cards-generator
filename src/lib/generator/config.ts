// Leaf imports on purpose: the `@/lib/card` and `@/lib/github` barrels pull the
// logger, the environment accessors and the Devicon client into the client
// bundle. These two files are the only cross-module imports the browser needs.
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT } from "@/lib/card/config";

export const GENERATOR_ACCEPTED_HOST = "github.com";

export const GENERATOR_WWW_PREFIX = "www.";

export const GENERATOR_GIT_SUFFIX = ".git";

// Mirrors REPO_CARD_ROUTE_PREFIX from `@/lib/repo-card/config`, which binds
// the Upstash clients and cannot be imported here. Guarded by a drift test.
export const GENERATOR_CARD_ROUTE_PREFIX = "/api/repo";

export const GENERATOR_GITHUB_ORIGIN = "https://github.com";

export const GENERATOR_VALIDATE_PATH = "/api/validate";

export const GENERATOR_VALIDATE_PARAMETERS = {
  owner: "owner",
  repo: "repo",
} as const;

export const GENERATOR_REQUEST_TIMEOUT_MS = 10_000;

export const GENERATOR_DEFAULT_COOLDOWN_SECONDS = 60;

export const GENERATOR_MAX_COOLDOWN_SECONDS = 120;

export const GENERATOR_COPY_FEEDBACK_MS = 2000;

export const GENERATOR_IMAGE_WIDTH = CARD_DEFAULT_WIDTH;

export const GENERATOR_IMAGE_HEIGHT = CARD_HEIGHT;
