"use client";

import { useRef } from "react";
import { gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import { SectionTitle } from "@/components/motion/section-title";
import type { Dictionary } from "@/i18n/types";

type HowItWorksProps = {
  dictionary: Dictionary;
};

export function HowItWorks({ dictionary }: HowItWorksProps) {
  const { landing } = dictionary;
  const root = useRef<HTMLElement>(null);
  const steps = [
    { title: landing.step1Title, description: landing.step1Description },
    { title: landing.step2Title, description: landing.step2Description },
    { title: landing.step3Title, description: landing.step3Description },
  ];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.from(root.current!.querySelectorAll("li"), {
          y: 32,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: {
            trigger: root.current!.querySelector("ol"),
            start: "top 85%",
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
      aria-labelledby="how-it-works"
      className="flex flex-col gap-12"
    >
      <SectionTitle id="how-it-works">{landing.howItWorksTitle}</SectionTitle>
      <ol className="grid [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] gap-x-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-4 border-t py-8">
            <span aria-hidden="true" className="caption">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="type-annotation">{step.title}</h3>
            <p className="type-lead">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
