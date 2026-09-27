"use client";

import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { DESKTOP, gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import type { Dictionary } from "@/i18n/types";

type CardAssemblyProps = {
  dictionary: Dictionary;
  repositoryUrl: string;
  repository: string;
  cardMarkup: string;
  snippet: string;
};

const ASSEMBLY_SHARE = 0.78;
const ZOOM_SCALE = 3.2;

export function CardAssembly({
  dictionary,
  repositoryUrl,
  repository,
  cardMarkup,
  snippet,
}: CardAssemblyProps) {
  const { landing, generator } = dictionary;
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(`${MOTION} and ${DESKTOP}`, () => {
        const frame = q("[data-assembly-frame]")[0] as HTMLElement;
        const cardBox = q("[data-card]")[0] as HTMLElement;
        const card = cardBox.querySelector("svg")!;
        const outline = card.querySelector(":scope > rect");
        const parts = card.querySelectorAll(":scope > rect ~ *:not(title)");

        gsap.set(q("[data-typed]"), { text: "" });

        const build = gsap
          .timeline({ defaults: { ease: "power2.out" } })
          .to(q("[data-caret]"), { opacity: 1, duration: 0.1 })
          .to(q("[data-typed]"), {
            text: repositoryUrl,
            duration: 2,
            ease: "none",
          })
          .to(q("[data-caret]"), { opacity: 0, duration: 0.1 })
          .to(q("[data-generate]"), {
            scale: 0.92,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
          })
          .to(q("[data-status]"), { opacity: 1, duration: 0.3 })
          .to(q("[data-status]"), { opacity: 0, duration: 0.3 }, "+=0.6")
          .fromTo(cardBox, { opacity: 0 }, { opacity: 1, duration: 0.01 }, "<")
          .fromTo(
            outline,
            { drawSVG: "0%", fillOpacity: 0 },
            { drawSVG: "100%", duration: 1.4, ease: "power1.inOut" },
          )
          .to(outline, { fillOpacity: 1, duration: 0.4 })
          .from(
            parts,
            { opacity: 0, y: 10, stagger: 0.25, duration: 0.6 },
            "-=0.6",
          )
          .from(q("[data-snippet]"), { opacity: 0, y: 16, duration: 0.7 })
          .to(q("[data-copied]"), { opacity: 1, duration: 0.4 }, "+=0.2");

        const zoomDuration =
          (build.duration() * (1 - ASSEMBLY_SHARE)) / ASSEMBLY_SHARE;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=260%",
            scrub: 0.6,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          },
        });
        tl.add(build).to(frame, {
          scale: ZOOM_SCALE,
          opacity: 0,
          duration: zoomDuration,
          ease: "power2.in",
          transformOrigin: () => {
            const f = frame.getBoundingClientRect();
            const c = cardBox.getBoundingClientRect();
            const x = c.left + c.width / 2 - f.left;
            const y = c.top + c.height / 2 - f.top;
            return `${x}px ${y}px`;
          },
        });
        tl.to(
          q("[data-assembly-chrome]"),
          { opacity: 0, duration: zoomDuration * 0.6, ease: "power1.in" },
          `<`,
        );
      });

      mm.add(`${MOTION} and not ${DESKTOP}`, () => {
        gsap.from(q("[data-assembly-frame] > *"), {
          y: 24,
          opacity: 0,
          stagger: 0.12,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: q("[data-assembly-frame]")[0],
            start: "top 80%",
          },
        });
      });
    },
    { scope: root, dependencies: [repositoryUrl] },
  );

  return (
    <div>
      <section
        ref={root}
        aria-labelledby="assembly"
        className="flex flex-col justify-center gap-10 py-12 lg:min-h-svh"
      >
        <div data-assembly-chrome className="flex flex-col gap-4">
          <p className="eyebrow">{landing.assemblyEyebrow}</p>
          <h2 id="assembly" className="type-section">
            {landing.assemblyTitle}
          </h2>
        </div>

        <div
          data-assembly-frame
          aria-hidden="true"
          className="card-frame flex w-full max-w-3xl flex-col gap-6 self-center border bg-surface p-5 sm:p-8"
        >
          <div className="flex items-center gap-2 rounded-full border bg-background p-1.5 pl-5">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden font-mono text-xs whitespace-nowrap sm:text-sm">
              <span data-typed>{repositoryUrl}</span>
              <span
                data-caret
                className="ml-0.5 inline-block h-4 w-px bg-foreground opacity-0"
              />
            </div>
            <div data-generate className="btn-primary h-10 px-5">
              {generator.submitLabel}
            </div>
          </div>
          <p
            data-status
            className="caption -my-3 flex items-center gap-2 opacity-0"
          >
            <LoaderCircle className="size-3.5 animate-spin" />
            {generator.submittingLabel}
          </p>
          <div
            data-card
            className="w-full max-w-[460px] self-center [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: cardMarkup }}
          />
          <div
            data-snippet
            className="relative rounded-2xl border bg-background p-4 pr-24 font-mono text-xs leading-relaxed break-all text-muted"
          >
            {snippet}
            <span
              data-copied
              className="absolute top-3 right-3 rounded-full bg-accent px-2.5 py-1 font-sans text-[11px] font-semibold text-accent-foreground opacity-0"
            >
              {landing.copiedExampleLabel}
            </span>
          </div>
        </div>

        <p data-assembly-chrome className="caption self-center">
          {repository}
        </p>
      </section>
    </div>
  );
}
