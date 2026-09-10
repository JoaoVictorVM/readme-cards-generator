export type LanguageIconVariant = "original" | "plain";

export type LanguageEntry = {
  language: string;
  slug: string;
  variant: LanguageIconVariant;
  color: string;
};

export type LanguageIconSource = "devicon" | "fallback";

export type LanguageVisual = {
  iconMarkup: string;
  tileColor: string;
  source: LanguageIconSource;
  language: string | null;
  slug: string | null;
};

export type IconFailureCause =
  | "timeout"
  | "http_error"
  | "too_large"
  | "not_svg"
  | "malformed"
  | "transport_error";

export type IconFetchResult =
  { ok: true; markup: string } | { ok: false; cause: IconFailureCause };

export type SanitizeResult =
  | { ok: true; markup: string; removed: string[] }
  | { ok: false; cause: "malformed" };

export type FetchImplementation = (
  url: string,
  init: RequestInit,
) => Promise<Response>;

export type IconCache = {
  load(
    slug: string,
    variant: LanguageIconVariant,
    dependencies: LanguageIconDependencies,
  ): Promise<IconFetchResult>;
  reset(): void;
};

export type LanguageIconDependencies = {
  fetchImpl?: FetchImplementation;
  now?: () => number;
  createIdPrefix?: (slug: string) => string;
  cache?: IconCache;
};

export type ResolveLanguageIconOptions = {
  idPrefix?: string;
  deps?: LanguageIconDependencies;
};
