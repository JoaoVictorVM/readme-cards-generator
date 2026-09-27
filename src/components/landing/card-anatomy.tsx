"use client";

import { useRef } from "react";
import { gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import { SectionTitle } from "@/components/motion/section-title";
import type { Dictionary } from "@/i18n/types";

type CardAnatomyProps = {
  dictionary: Dictionary;
  cardMarkup: string;
};

export function CardAnatomy({ dictionary, cardMarkup }: CardAnatomyProps) {
  const { landing } = dictionary;
  const root = useRef<HTMLElement>(null);
  const notes = [
    {
      title: landing.anatomyIconTitle,
      description: landing.anatomyIconDescription,
    },
    {
      title: landing.anatomyActivityTitle,
      description: landing.anatomyActivityDescription,
    },
    {
      title: landing.anatomyButtonTitle,
      description: landing.anatomyButtonDescription,
    },
  ];

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        const cardBox = q("[data-anatomy-card]")[0] as HTMLElement;
        const parts = cardBox.querySelectorAll("svg > rect ~ *:not(title)");
        gsap
          .timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: q("[data-anatomy-body]")[0],
              start: "top 80%",
              end: "center 45%",
              scrub: 0.8,
            },
          })
          .from(cardBox, { opacity: 0, scale: 0.92, duration: 1 })
          .from(parts, { opacity: 0.12, stagger: 0.24, duration: 0.3 })
          .from(
            q("[data-note]"),
            { x: 24, opacity: 0, stagger: 0.15, duration: 0.6 },
            "<",
          );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="anatomy"
      className="flex flex-col gap-12"
    >
      <SectionTitle id="anatomy">{landing.anatomyTitle}</SectionTitle>
      <div
        data-anatomy-body
        className="grid items-center gap-12 min-[48rem]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] min-[48rem]:gap-16"
      >
        <div
          data-anatomy-card
          aria-hidden="true"
          className="card-frame w-full max-w-[560px] justify-self-center [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: cardMarkup }}
        />
        <ol className="flex flex-col">
          {notes.map((note, index) => (
            <li
              key={note.title}
              data-note
              className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-y-2 border-t py-6 last:border-b"
            >
              <span aria-hidden="true" className="caption row-span-2 pt-2">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="type-annotation">{note.title}</h3>
              <p className="type-lead">{note.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
