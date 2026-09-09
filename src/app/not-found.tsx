import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { localeHome } from "@/i18n/routing";

export default function NotFound() {
  const dictionary = getDictionary(defaultLocale);

  return (
    <SiteShell locale={defaultLocale}>
      <section className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.errors.notFoundTitle}
        </h1>
        <p className="text-[var(--color-muted)]">
          {dictionary.errors.notFoundMessage}
        </p>
        <Link
          href={localeHome(defaultLocale)}
          className="rounded-[var(--radius-site)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          {dictionary.errors.backHomeLabel}
        </Link>
      </section>
    </SiteShell>
  );
}
