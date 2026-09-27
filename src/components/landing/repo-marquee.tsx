import type { ShowcaseData } from "@/components/landing/showcase-types";
import { MarqueeRow, type MarqueeItem } from "@/components/landing/marquee-row";
import { Reveal } from "@/components/motion/reveal";
import type { Dictionary } from "@/i18n/types";
import { renderCard } from "@/lib/card";

type RepoMarqueeProps = {
  dictionary: Dictionary;
  data: ShowcaseData;
};

function toDataUri(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export function RepoMarquee({ dictionary, data }: RepoMarqueeProps) {
  const items: MarqueeItem[] = data.marquee.map((entry) => ({
    alt: entry.repository.fullName,
    src: toDataUri(
      renderCard({ ...entry, theme: "dark", now: data.generatedAt }),
    ),
  }));
  const reversed = [...items].reverse();

  return (
    <section
      aria-labelledby="marquee"
      className="full-bleed flex flex-col gap-10"
    >
      <Reveal className="container-site">
        <h2 id="marquee" className="eyebrow">
          {dictionary.landing.marqueeTitle}
        </h2>
      </Reveal>
      <div className="flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <MarqueeRow items={items} />
        <MarqueeRow items={reversed} reverse />
      </div>
    </section>
  );
}
