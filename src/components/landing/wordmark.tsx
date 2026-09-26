"use client";

import { useRef } from "react";
import {
  gsap,
  MOTION,
  SplitText,
  useGSAP,
} from "@/components/landing/motion/gsap";

type WordmarkProps = {
  text: string;
};

export function Wordmark({ text }: WordmarkProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        SplitText.create(root.current!.querySelector("p"), {
          type: "chars",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 105,
              ease: "none",
              stagger: 0.04,
              scrollTrigger: {
                trigger: root.current,
                start: "top bottom",
                end: "bottom bottom",
                scrub: 0.6,
              },
            }),
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden="true" className="full-bleed overflow-hidden">
      <p className="text-center text-[13.2vw] leading-[0.82] font-semibold tracking-[-0.06em] whitespace-nowrap select-none">
        {text}
      </p>
    </div>
  );
}
