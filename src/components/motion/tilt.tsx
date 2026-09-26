"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";
import { FINE_POINTER, gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import { cn } from "@/lib/utils";

type TiltProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Tilt({ children, className, ...rest }: TiltProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION} and ${FINE_POINTER}`, () => {
        const card = root.current!;
        const glare = card.querySelector<HTMLElement>("[data-glare]")!;
        const rx = gsap.quickTo(card, "rotationX", {
          duration: 0.7,
          ease: "power3",
        });
        const ry = gsap.quickTo(card, "rotationY", {
          duration: 0.7,
          ease: "power3",
        });

        const onMove = (event: PointerEvent) => {
          const box = card.getBoundingClientRect();
          const px = (event.clientX - box.left) / box.width;
          const py = (event.clientY - box.top) / box.height;
          ry((px - 0.5) * 16);
          rx((0.5 - py) * 16);
          gsap.to(glare, {
            "--gx": `${px * 100}%`,
            "--gy": `${py * 100}%`,
            duration: 0.4,
            ease: "power3",
            overwrite: "auto",
          });
        };
        const onEnter = () => gsap.to(glare, { opacity: 1, duration: 0.4 });
        const onLeave = () => {
          rx(0);
          ry(0);
          gsap.to(glare, { opacity: 0, duration: 0.6 });
        };

        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerenter", onEnter);
        card.addEventListener("pointerleave", onLeave);
        return () => {
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerenter", onEnter);
          card.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      data-tilt
      className={cn(
        "relative will-change-transform [transform-style:preserve-3d]",
        className,
      )}
      {...rest}
    >
      {children}
      <span
        data-glare
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 [background:radial-gradient(circle_at_var(--gx,50%)_var(--gy,50%),rgba(255,255,255,0.22),transparent_55%)]"
      />
    </div>
  );
}
