"use client";

import { useRef } from "react";
import {
  gsap,
  MOTION,
  ScrollTrigger,
  useGSAP,
} from "@/components/landing/motion/gsap";
import { CARD_DEFAULT_WIDTH, CARD_HEIGHT } from "@/lib/card/config";

export type MarqueeItem = {
  src: string;
  alt: string;
};

type MarqueeRowProps = {
  items: MarqueeItem[];
  reverse?: boolean;
};

export function MarqueeRow({ items, reverse = false }: MarqueeRowProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        const track = root.current!.querySelector("ul")!;
        const loop = gsap.fromTo(
          track,
          { xPercent: reverse ? -50 : 0 },
          {
            xPercent: reverse ? 0 : -50,
            duration: 60,
            ease: "none",
            repeat: -1,
          },
        );
        loop.totalTime(loop.duration() * 1000);

        let direction = 1;
        let hovering = false;
        const settle = () =>
          gsap.to(loop, {
            timeScale: hovering ? 0 : direction,
            duration: 1.2,
            ease: "power2.out",
            overwrite: true,
          });

        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            if (hovering) return;
            direction = self.direction;
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
            gsap.to(loop, {
              timeScale: direction * boost,
              duration: 0.25,
              overwrite: true,
              onComplete: settle,
            });
          },
        });

        const onEnter = () => {
          hovering = true;
          settle();
        };
        const onLeave = () => {
          hovering = false;
          settle();
        };
        const element = root.current!;
        element.addEventListener("pointerenter", onEnter);
        element.addEventListener("pointerleave", onLeave);
        return () => {
          element.removeEventListener("pointerenter", onEnter);
          element.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: root },
  );

  const doubled = [...items, ...items];

  return (
    <div ref={root} className="overflow-hidden">
      <ul className="flex w-max gap-4 pr-4">
        {doubled.map((item, index) => {
          const clone = index >= items.length;
          return (
            <li key={`${item.alt}-${index}`} aria-hidden={clone || undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={clone ? "" : item.alt}
                width={CARD_DEFAULT_WIDTH}
                height={CARD_HEIGHT}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-auto w-[280px] select-none sm:w-[340px]"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
