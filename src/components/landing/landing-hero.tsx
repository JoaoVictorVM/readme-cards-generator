"use client";

import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { ExampleCard } from "@/components/landing/example-card";
import { gsap, MOTION, SplitText, useGSAP } from "@/components/motion/gsap";
import { SpotlightGrid } from "@/components/motion/spotlight-grid";
import { useMagnetic } from "@/components/motion/use-magnetic";
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
  const root = useRef<HTMLElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  useMagnetic(cta);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(MOTION, () => {
        gsap.set(q("[data-hero-intro]"), { opacity: 1 });
        SplitText.create(q("[data-hero-title]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.09,
              ease: "expo.out",
            }),
        });
        gsap
          .timeline({ defaults: { ease: "expo.out" }, delay: 0.35 })
          .from(q("[data-hero-fade]"), {
            y: 18,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
          })
          .from(
            q("code[data-hero-intro]"),
            { y: 18, opacity: 0, duration: 0.9 },
            "-=0.8",
          )
          .from(
            q("[data-hero-connector]"),
            { scaleY: 0, duration: 0.5, ease: "power2.out" },
            "-=0.5",
          )
          .from(
            q("[data-tilt]"),
            { y: 48, rotationX: -28, opacity: 0, duration: 1.4 },
            "-=0.2",
          )
          .from(
            q("figure p[data-hero-intro]"),
            { opacity: 0, duration: 0.6 },
            "-=1",
          );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate grid gap-12 py-8 lg:min-h-[calc(100dvh-10rem)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16 lg:py-16"
    >
      <SpotlightGrid />
      <div className="flex flex-col items-start gap-6">
        <p
          data-hero-intro
          data-hero-fade
          className="font-mono text-xs tracking-wide text-muted uppercase"
        >
          {landing.heroEyebrow}
        </p>
        <h1
          data-hero-intro
          data-hero-title
          className="max-w-[14ch] text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[5.25rem]"
        >
          {landing.title}
        </h1>
        <p
          data-hero-intro
          data-hero-fade
          className="max-w-xl text-lg leading-relaxed text-muted"
        >
          {landing.subtitle}
        </p>
        <div
          data-hero-intro
          data-hero-fade
          className="flex flex-wrap items-center gap-x-6 gap-y-3"
        >
          <Link
            ref={cta}
            href={ctaHref}
            className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {landing.ctaGenerate}
          </Link>
          <a
            href="#parameters"
            className="group inline-flex h-12 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            {landing.ctaParameters}
            <ArrowDown
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
            />
          </a>
        </div>
      </div>
      <ExampleCard dictionary={dictionary} markdown={cardUrl} />
    </section>
  );
}
