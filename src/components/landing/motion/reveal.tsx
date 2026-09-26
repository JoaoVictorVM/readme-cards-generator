"use client";

import { useRef, type ReactNode } from "react";
import { gsap, MOTION, useGSAP } from "@/components/landing/motion/gsap";

type RevealProps = {
  children: ReactNode;
  className?: string;
};

export function Reveal({ children, className }: RevealProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.from(root.current!.children, {
          y: 32,
          opacity: 0,
          duration: 1.1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
