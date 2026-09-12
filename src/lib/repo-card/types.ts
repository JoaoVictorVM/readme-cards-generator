import type { Locale } from "@/i18n/config";
import type { CardTheme, ErrorCardKind } from "@/lib/card";
import type {
  Repository,
  RepositoryLookupDependencies,
  RepositoryLookupOutcome,
} from "@/lib/github";
import type {
  LanguageVisual,
  ResolveLanguageIconOptions,
} from "@/lib/language-icon";
import type {
  RateLimitDecision,
  RateLimitDependencies,
  RateLimitNamespace,
} from "@/lib/rate-limit";

export type RepoCardParams = {
  owner: string;
  repo: string;
};

export type RepoCardOptions = {
  theme: CardTheme;
  locale: Locale;
  width: number;
};

export type RepoCardQueryParameterName = "theme" | "locale" | "width";

export type RepoCardStatus = 200 | 400 | 403 | 404 | 429 | 500 | 502;

export type RepoCardErrorStatus = Exclude<RepoCardStatus, 200>;

export type MappedRepoCardOutcome =
  | { status: 200; repository: Repository }
  | {
      status: RepoCardErrorStatus;
      kind: ErrorCardKind;
      headers?: Record<string, string>;
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

export type LanguageIconResolver = (
  language: string | null,
  options?: ResolveLanguageIconOptions,
) => Promise<LanguageVisual>;

export type Clock = () => number;

export type RepoCardDependencies = {
  fetchRepository?: RepositoryLookup;
  checkRateLimit?: RateLimitCheck;
  resolveLanguageIcon?: LanguageIconResolver;
  now?: Clock;
};
