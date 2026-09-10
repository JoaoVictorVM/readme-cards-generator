import { ICON_FAILURE_TTL_MS } from "@/lib/language-icon/config";
import { fetchIconMarkup } from "@/lib/language-icon/devicon-client";
import { rewriteDeclaredIds } from "@/lib/language-icon/rewrite-ids";
import { sanitizeSvg } from "@/lib/language-icon/sanitize-svg";
import { logWarnOnce } from "@/lib/logger";
import type {
  IconCache,
  IconFailureCause,
  IconFetchResult,
  LanguageIconDependencies,
  LanguageIconVariant,
} from "@/lib/language-icon/types";

type Entry =
  | { kind: "markup"; markup: string }
  | { kind: "failure"; cause: IconFailureCause; at: number };

export function createIconCache(): IconCache {
  const entries = new Map<string, Entry>();
  const inFlight = new Map<string, Promise<IconFetchResult>>();

  async function resolve(
    slug: string,
    variant: LanguageIconVariant,
    dependencies: LanguageIconDependencies,
  ): Promise<IconFetchResult> {
    const now = dependencies.now ?? (() => Date.now());
    const fetched = await fetchIconMarkup(
      slug,
      variant,
      dependencies.fetchImpl,
    );
    if (!fetched.ok) {
      entries.set(slug, { kind: "failure", cause: fetched.cause, at: now() });
      return fetched;
    }

    const sanitized = sanitizeSvg(fetched.markup);
    if (!sanitized.ok) {
      entries.set(slug, { kind: "failure", cause: "malformed", at: now() });
      return { ok: false, cause: "malformed" };
    }
    if (sanitized.removed.length > 0) {
      logWarnOnce(
        `devicon-sanitized:${slug}`,
        "devicon markup carried disallowed content",
        { slug, removed: sanitized.removed.join(",") },
      );
    }

    const markup = rewriteDeclaredIds(sanitized.markup);
    entries.set(slug, { kind: "markup", markup });
    return { ok: true, markup };
  }

  return {
    async load(slug, variant, dependencies) {
      const now = dependencies.now ?? (() => Date.now());
      const entry = entries.get(slug);
      if (entry?.kind === "markup") {
        return { ok: true, markup: entry.markup };
      }
      if (entry?.kind === "failure") {
        if (now() - entry.at < ICON_FAILURE_TTL_MS) {
          return { ok: false, cause: entry.cause };
        }
        entries.delete(slug);
      }

      const pending = inFlight.get(slug);
      if (pending !== undefined) return pending;

      const started = resolve(slug, variant, dependencies).finally(() => {
        inFlight.delete(slug);
      });
      inFlight.set(slug, started);
      return started;
    },
    reset() {
      entries.clear();
      inFlight.clear();
    },
  };
}

export const iconCache = createIconCache();

export function resetIconCache(): void {
  iconCache.reset();
}
