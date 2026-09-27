"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, SplitText, useGSAP } from "@/components/motion/gsap";
import { cn } from "@/lib/utils";

type SectionTitleProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function SectionTitle({ id, children, className }: SectionTitleProps) {
  const root = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        SplitText.create(root.current, {
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
      });
    },
    { scope: root },
  );

  return (
    <h2 ref={root} id={id} className={cn("type-section", className)}>
      {children}
    </h2>
  );
}
