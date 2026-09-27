"use client";

import Link from "next/link";
import { useRef } from "react";
import { ExampleCard } from "@/components/landing/example-card";
import { gsap, MOTION, SplitText, useGSAP } from "@/components/motion/gsap";
import { useMagnetic } from "@/components/motion/use-magnetic";
import type { Dictionary } from "@/i18n/types";

type LandingClosingProps = {
  dictionary: Dictionary;
  ctaHref: string;
  cardUrl: string;
};

export function LandingClosing({
  dictionary,
  ctaHref,
  cardUrl,
}: LandingClosingProps) {
  const { landing } = dictionary;
  const root = useRef<HTMLElement>(null);
  const cta = useRef<HTMLAnchorElement>(null);
  useMagnetic(cta);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        SplitText.create(q("[data-closing-title]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 1.1,
              stagger: 0.08,
              ease: "expo.out",
              scrollTrigger: {
                trigger: root.current,
                start: "top 85%",
                once: true,
              },
            }),
        });
        gsap.from(q("[data-closing-fade]"), {
          y: 32,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            once: true,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="closing"
      className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="flex flex-col items-start gap-10">
        <h2 id="closing" data-closing-title className="type-closing">
          {landing.closingTitle}
        </h2>
        <div data-closing-fade>
          <Link ref={cta} href={ctaHref} className="btn-primary btn-primary-lg">
            {landing.ctaGenerate}
            <span aria-hidden="true" className="btn-arrow">
              →
            </span>
          </Link>
        </div>
      </div>
      <div data-closing-fade className="flex justify-center">
        <ExampleCard dictionary={dictionary} markdown={cardUrl} />
      </div>
    </section>
  );
}
