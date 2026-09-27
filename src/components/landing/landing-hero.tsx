"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION, SplitText, useGSAP } from "@/components/motion/gsap";
import { useMagnetic } from "@/components/motion/use-magnetic";
import type { Dictionary } from "@/i18n/types";

type LandingHeroProps = {
  dictionary: Dictionary;
  ctaHref: string;
};

export function LandingHero({ dictionary, ctaHref }: LandingHeroProps) {
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
          type: "words",
          mask: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.words, {
              yPercent: 110,
              duration: 1.3,
              stagger: 0.06,
              ease: "expo.out",
            }),
        });
        gsap.from(q("[data-hero-fade]"), {
          y: 24,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
          delay: 0.45,
          ease: "expo.out",
        });
        gsap.to(q("[data-scroll-hint]"), {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom 60%",
            scrub: true,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-center gap-8 py-16"
    >
      <p data-hero-intro data-hero-fade className="eyebrow">
        {landing.heroEyebrow}
      </p>
      <h1 data-hero-intro data-hero-title className="type-headline">
        {landing.title}
      </h1>
      <p data-hero-intro data-hero-fade className="type-lead max-w-xl">
        {landing.subtitle}
      </p>
      <div
        data-hero-intro
        data-hero-fade
        className="flex flex-wrap items-center gap-x-6 gap-y-3"
      >
        <Link ref={cta} href={ctaHref} className="btn-primary">
          {landing.ctaGenerate}
          <span aria-hidden="true" className="btn-arrow">
            →
          </span>
        </Link>
        <a
          href="#parameters"
          className="caption transition-colors duration-200 hover:text-foreground"
        >
          {landing.ctaParameters}
        </a>
      </div>
      <div
        data-scroll-hint
        aria-hidden="true"
        className="absolute bottom-8 left-0 flex items-center gap-4"
      >
        <span className="scroll-line" />
        <span className="caption">{landing.scrollHint}</span>
      </div>
    </section>
  );
}
