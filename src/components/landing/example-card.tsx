import { showcaseCardPath } from "@/components/landing/example-url";
import { format } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT } from "@/lib/card";
import { siteConfig } from "@/lib/site-config";

type ExampleCardProps = {
  dictionary: Dictionary;
};

export function ExampleCard({ dictionary }: ExampleCardProps) {
  const { owner, name } = siteConfig.showcaseRepository;
  const repository = `${owner}/${name}`;

  return (
    <figure className="flex w-full max-w-[380px] flex-col gap-2">
      {/* The card must be the exact endpoint response a README embeds, so the
          image optimizer (which rejects SVG by default) is bypassed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={showcaseCardPath()}
        alt={format(dictionary.landing.exampleCardAlt, { repository })}
        width={CARD_DEFAULT_WIDTH}
        height={CARD_HEIGHT}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-auto max-w-full"
      />
      <figcaption className="text-sm text-[var(--color-muted)]">
        {format(dictionary.landing.exampleCardCaption, { repository })}
      </figcaption>
    </figure>
  );
}
