import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { ExampleCard } from "@/components/landing/example-card";
import type { Dictionary } from "@/i18n/types";

type LandingHeroProps = {
  dictionary: Dictionary;
  ctaHref: string;
  cardUrl: string;
};

export function LandingHero({
  dictionary,
  ctaHref,
  cardUrl,
}: LandingHeroProps) {
  const { landing } = dictionary;

  return (
    <section className="grid gap-12 py-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:py-16">
      <div className="flex flex-col items-start gap-6">
        <p className="font-mono text-xs tracking-wide text-muted uppercase">
          {landing.heroEyebrow}
        </p>
        <h1 className="max-w-[14ch] text-4xl leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">
          {landing.title}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          {landing.subtitle}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={ctaHref}
            className="inline-flex h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-85"
          >
            {landing.ctaGenerate}
          </Link>
          <a
            href="#parameters"
            className="inline-flex h-11 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {landing.ctaParameters}
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
      <ExampleCard dictionary={dictionary} markdown={cardUrl} />
    </section>
  );
}
