"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, SplitText, useGSAP } from "@/components/motion/gsap";
import { SpotlightGrid } from "@/components/motion/spotlight-grid";

type GeneratorIntroProps = {
  children: ReactNode;
};

export function GeneratorIntro({ children }: GeneratorIntroProps) {
  const root = useRef<HTMLElement>(null);

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
              duration: 1.2,
              stagger: 0.09,
              ease: "expo.out",
            }),
        });
        gsap.from(q("[data-hero-fade]"), {
          y: 24,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          delay: 0.25,
          ease: "expo.out",
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative isolate flex flex-col gap-10 py-4 sm:py-8"
    >
      <SpotlightGrid />
      {children}
    </section>
  );
}
