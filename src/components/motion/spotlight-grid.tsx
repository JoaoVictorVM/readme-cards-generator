"use client";

import { useRef } from "react";
import { FINE_POINTER, gsap, MOTION, useGSAP } from "@/components/motion/gsap";

export function SpotlightGrid() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION} and ${FINE_POINTER}`, () => {
        const grid = root.current!;
        const area = grid.parentElement!;
        const onMove = (event: PointerEvent) => {
          const box = grid.getBoundingClientRect();
          gsap.to(grid, {
            "--sx": `${event.clientX - box.left}px`,
            "--sy": `${event.clientY - box.top}px`,
            duration: 0.6,
            ease: "power3",
            overwrite: "auto",
          });
        };
        area.addEventListener("pointermove", onMove);
        return () => area.removeEventListener("pointermove", onMove);
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      data-spotlight
      aria-hidden="true"
      className="full-bleed pointer-events-none absolute inset-y-0 -z-10 [background-image:linear-gradient(to_right,#1c1c1c_1px,transparent_1px),linear-gradient(to_bottom,#1c1c1c_1px,transparent_1px)] [mask-image:radial-gradient(440px_circle_at_var(--sx)_var(--sy),black,transparent)] [background-size:56px_56px] [--sx:70%] [--sy:40%]"
    />
  );
}
