"use client";

import type { RefObject } from "react";
import { FINE_POINTER, gsap, MOTION, useGSAP } from "@/components/motion/gsap";

const STRENGTH = 0.35;

export function useMagnetic(target: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION} and ${FINE_POINTER}`, () => {
      const element = target.current;
      if (!element) return;
      const mx = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3" });
      const my = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3" });
      const onMove = (event: PointerEvent) => {
        const box = element.getBoundingClientRect();
        mx((event.clientX - (box.left + box.width / 2)) * STRENGTH);
        my((event.clientY - (box.top + box.height / 2)) * STRENGTH);
      };
      const onLeave = () =>
        gsap.to(element, {
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "elastic.out(1, 0.4)",
        });
      element.addEventListener("pointermove", onMove);
      element.addEventListener("pointerleave", onLeave);
      return () => {
        element.removeEventListener("pointermove", onMove);
        element.removeEventListener("pointerleave", onLeave);
      };
    });
  });
}
