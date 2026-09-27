"use client";

import { useMemo, useRef, useState } from "react";
import { EXAMPLE_CARD_QUERY_PARAMETERS } from "@/components/landing/config";
import { CopyExampleUrl } from "@/components/landing/copy-example-url";
import { gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import { SectionTitle } from "@/components/motion/section-title";
import type { ShowcaseEntry } from "@/components/landing/showcase-types";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  CARD_DEFAULT_LOCALE,
  CARD_DEFAULT_THEME,
  CARD_DEFAULT_WIDTH,
  CARD_HEIGHT,
  CARD_MAX_WIDTH,
  CARD_MIN_WIDTH,
} from "@/lib/card/config";
import { renderCard } from "@/lib/card/render-card";
import { CARD_THEMES, type CardTheme } from "@/lib/card/types";
import { cn } from "@/lib/utils";

type CardPlaygroundProps = {
  dictionary: Dictionary;
  entry: ShowcaseEntry;
  now: number;
  baseUrl: string;
};

const WIDTH_STEP = 10;

type OptionGroupProps<T extends string> = {
  name: string;
  legend: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

function OptionGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: OptionGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="eyebrow mb-3">{legend}</legend>
      <div className="inline-flex w-fit rounded-full border p-1">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 font-mono text-xs transition-colors duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foreground",
              option === value
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={option === value}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function toDataUri(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

export function CardPlayground({
  dictionary,
  entry,
  now,
  baseUrl,
}: CardPlaygroundProps) {
  const { landing } = dictionary;
  const [theme, setTheme] = useState<CardTheme>(CARD_DEFAULT_THEME);
  const [locale, setLocale] = useState<Locale>(CARD_DEFAULT_LOCALE);
  const [width, setWidth] = useState(CARD_DEFAULT_WIDTH);
  const stage = useRef<HTMLDivElement>(null);
  const { contextSafe } = useGSAP({ scope: stage });

  const src = useMemo(
    () => toDataUri(renderCard({ ...entry, theme, locale, width, now })),
    [entry, theme, locale, width, now],
  );

  const url = useMemo(() => {
    const query = new URLSearchParams();
    if (theme !== CARD_DEFAULT_THEME) {
      query.set(EXAMPLE_CARD_QUERY_PARAMETERS.theme, theme);
    }
    if (locale !== CARD_DEFAULT_LOCALE) {
      query.set(EXAMPLE_CARD_QUERY_PARAMETERS.locale, locale);
    }
    if (width !== CARD_DEFAULT_WIDTH) {
      query.set(EXAMPLE_CARD_QUERY_PARAMETERS.width, String(width));
    }
    const search = query.toString();
    return search ? `${baseUrl}?${search}` : baseUrl;
  }, [baseUrl, theme, locale, width]);

  const pulse = contextSafe(() => {
    if (!window.matchMedia(MOTION).matches) return;
    gsap.fromTo(
      "[data-playground-card]",
      { opacity: 0.35, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" },
    );
  });

  const light = theme === CARD_THEMES.light;

  return (
    <section aria-labelledby="playground" className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <SectionTitle id="playground">{landing.playgroundTitle}</SectionTitle>
        <p className="type-lead max-w-2xl">{landing.playgroundIntro}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
        <div
          ref={stage}
          data-playground-stage
          data-theme={theme}
          className={cn(
            "card-frame flex min-h-[14rem] items-center justify-center overflow-hidden border p-6 transition-colors duration-700 sm:min-h-[24rem] sm:p-10",
            light
              ? "border-transparent bg-foreground"
              : "stage-grid bg-surface",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-playground-card
            src={src}
            alt={`${entry.repository.fullName} (${theme}, ${locale}, ${width}px)`}
            width={width}
            height={CARD_HEIGHT}
            style={{ width }}
            className="block h-auto max-w-full"
          />
        </div>

        <div className="flex flex-col gap-8">
          <OptionGroup
            name="playground-theme"
            legend={landing.playgroundThemeLabel}
            options={Object.values(CARD_THEMES)}
            value={theme}
            onChange={(value) => {
              setTheme(value);
              pulse();
            }}
          />
          <OptionGroup
            name="playground-locale"
            legend={landing.playgroundLocaleLabel}
            options={locales}
            value={locale}
            onChange={(value) => {
              setLocale(value);
              pulse();
            }}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <label htmlFor="playground-width" className="eyebrow">
                {landing.playgroundWidthLabel}
              </label>
              <output
                htmlFor="playground-width"
                className="font-mono text-xs tabular-nums"
              >
                {width}px
              </output>
            </div>
            <input
              id="playground-width"
              type="range"
              min={CARD_MIN_WIDTH}
              max={CARD_MAX_WIDTH}
              step={WIDTH_STEP}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="h-11 w-full cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="eyebrow">{landing.playgroundUrlLabel}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <code
            data-playground-url
            className="block min-w-0 flex-1 rounded-2xl border bg-surface px-5 py-3.5 font-mono text-sm leading-relaxed break-all select-all"
          >
            {url}
          </code>
          <CopyExampleUrl
            url={url}
            copyLabel={landing.copyExampleLabel}
            copiedLabel={landing.copiedExampleLabel}
          />
        </div>
      </div>
    </section>
  );
}
