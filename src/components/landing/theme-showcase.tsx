import {
  EXAMPLE_CARD_LIGHT_STATIC_PATH,
  EXAMPLE_CARD_STATIC_PATH,
} from "@/components/landing/config";
import { format } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT, CARD_THEMES } from "@/lib/card";
import { siteConfig } from "@/lib/site-config";

type ThemeShowcaseProps = {
  dictionary: Dictionary;
};

export function ThemeShowcase({ dictionary }: ThemeShowcaseProps) {
  const { landing } = dictionary;
  const { owner, name } = siteConfig.showcaseRepository;
  const repository = `${owner}/${name}`;
  const themes = [
    {
      theme: CARD_THEMES.dark,
      src: EXAMPLE_CARD_STATIC_PATH,
      caption: landing.themeDarkCaption,
      surface: "bg-background",
      captionColor: "text-muted",
    },
    {
      theme: CARD_THEMES.light,
      src: EXAMPLE_CARD_LIGHT_STATIC_PATH,
      caption: landing.themeLightCaption,
      surface: "bg-foreground",
      captionColor: "text-background/70",
    },
  ];

  return (
    <section aria-labelledby="themes" className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2
          id="themes"
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {landing.themesTitle}
        </h2>
        <p className="max-w-2xl text-muted">{landing.themesIntro}</p>
      </div>
      <ul className="grid overflow-hidden rounded-site border sm:grid-cols-2">
        {themes.map((entry) => (
          <li
            key={entry.theme}
            className={`flex flex-col items-center gap-4 px-6 py-10 sm:px-10 ${entry.surface}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.src}
              alt={`${format(landing.exampleCardAlt, { repository })} (${entry.caption})`}
              width={CARD_DEFAULT_WIDTH}
              height={CARD_HEIGHT}
              loading="lazy"
              decoding="async"
              className="h-auto w-full max-w-[380px]"
            />
            <code className={`font-mono text-xs ${entry.captionColor}`}>
              ?theme={entry.theme}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}
