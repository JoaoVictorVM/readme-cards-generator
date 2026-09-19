import { EXAMPLE_CARD_STATIC_PATH } from "@/components/landing/config";
import { format } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT } from "@/lib/card";
import { siteConfig } from "@/lib/site-config";

type ExampleCardProps = {
  dictionary: Dictionary;
  markdown: string;
};

export function ExampleCard({ dictionary, markdown }: ExampleCardProps) {
  const { owner, name } = siteConfig.showcaseRepository;
  const repository = `${owner}/${name}`;

  return (
    <figure className="flex w-full max-w-[380px] flex-col">
      <figcaption className="sr-only">
        {dictionary.landing.exampleMarkdownLabel}
      </figcaption>
      <code
        aria-label={dictionary.landing.exampleMarkdownLabel}
        className="hero-rise block rounded-site border bg-surface px-4 py-3 font-mono text-xs leading-relaxed break-all text-muted select-all sm:text-[13px]"
      >
        <span className="text-foreground">![{name}]</span>({markdown})
      </code>
      <span
        aria-hidden="true"
        className="hero-draw ml-8 block h-8 w-px bg-border [animation-delay:250ms]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={EXAMPLE_CARD_STATIC_PATH}
        alt={format(dictionary.landing.exampleCardAlt, { repository })}
        width={CARD_DEFAULT_WIDTH}
        height={CARD_HEIGHT}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="hero-rise h-auto max-w-full [animation-delay:450ms]"
      />
      <p className="mt-2 font-mono text-xs text-muted">
        {format(dictionary.landing.exampleCardCaption, { repository })}
      </p>
    </figure>
  );
}
