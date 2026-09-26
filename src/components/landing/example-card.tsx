import { EXAMPLE_CARD_STATIC_PATH } from "@/components/landing/config";
import { format } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT } from "@/lib/card/config";
import { siteConfig } from "@/lib/site-config";

type ExampleCardProps = {
  dictionary: Dictionary;
  markdown: string;
};

export function ExampleCard({ dictionary, markdown }: ExampleCardProps) {
  const { owner, name } = siteConfig.showcaseRepository;
  const repository = `${owner}/${name}`;

  return (
    <figure className="flex w-full max-w-[380px] flex-col [perspective:1000px]">
      <figcaption className="sr-only">
        {dictionary.landing.exampleMarkdownLabel}
      </figcaption>
      <code
        data-hero-intro
        aria-label={dictionary.landing.exampleMarkdownLabel}
        className="block rounded-site border bg-surface px-4 py-3 font-mono text-xs leading-relaxed break-all text-muted select-all sm:text-[13px]"
      >
        <span className="text-foreground">![{name}]</span>({markdown})
      </code>
      <span
        data-hero-intro
        data-hero-connector
        aria-hidden="true"
        className="ml-8 block h-8 w-px origin-top bg-border"
      />
      <div
        data-hero-intro
        data-tilt
        className="relative will-change-transform [transform-style:preserve-3d]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EXAMPLE_CARD_STATIC_PATH}
          alt={format(dictionary.landing.exampleCardAlt, { repository })}
          width={CARD_DEFAULT_WIDTH}
          height={CARD_HEIGHT}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="block h-auto max-w-full"
        />
        <span
          data-glare
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 [background:radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.22),transparent_55%)]"
        />
      </div>
      <p data-hero-intro className="mt-3 font-mono text-xs text-muted">
        {format(dictionary.landing.exampleCardCaption, { repository })}
      </p>
    </figure>
  );
}
