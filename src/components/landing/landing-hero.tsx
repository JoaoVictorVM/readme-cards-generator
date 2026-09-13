import Link from "next/link";
import { ExampleCard } from "@/components/landing/example-card";
import type { Dictionary } from "@/i18n/types";

type LandingHeroProps = {
  dictionary: Dictionary;
  ctaHref: string;
};

export function LandingHero({ dictionary, ctaHref }: LandingHeroProps) {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {dictionary.landing.title}
        </h1>
        <p className="max-w-2xl text-lg text-[var(--color-muted)]">
          {dictionary.landing.subtitle}
        </p>
        <Link
          href={ctaHref}
          className="rounded-[var(--radius-site)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent-foreground)] transition-opacity hover:opacity-90"
        >
          {dictionary.landing.ctaGenerate}
        </Link>
      </div>
      <ExampleCard dictionary={dictionary} />
    </section>
  );
}
