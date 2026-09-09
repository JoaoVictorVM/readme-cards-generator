"use client";

import { useEffect } from "react";
import { SiteShell } from "@/components/layout/site-shell";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dictionary = getDictionary(defaultLocale);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <SiteShell locale={defaultLocale}>
      <section className="flex flex-col items-start gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {dictionary.errors.unexpectedTitle}
        </h1>
        <p className="text-[var(--color-muted)]">
          {dictionary.errors.unexpectedMessage}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-[var(--radius-site)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          {dictionary.errors.retryLabel}
        </button>
      </section>
    </SiteShell>
  );
}
