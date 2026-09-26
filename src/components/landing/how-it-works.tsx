"use client";

import { LoaderCircle } from "lucide-react";
import { useRef } from "react";
import { DESKTOP, gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import type { Dictionary } from "@/i18n/types";

type HowItWorksProps = {
  dictionary: Dictionary;
  repositoryUrl: string;
  cardMarkup: string;
  snippet: string;
};

export function HowItWorks({
  dictionary,
  repositoryUrl,
  cardMarkup,
  snippet,
}: HowItWorksProps) {
  const { landing, generator } = dictionary;
  const root = useRef<HTMLElement>(null);
  const steps = [
    { title: landing.step1Title, description: landing.step1Description },
    { title: landing.step2Title, description: landing.step2Description },
    { title: landing.step3Title, description: landing.step3Description },
  ];

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(`${MOTION} and ${DESKTOP}`, () => {
        const card = q("[data-card]")[0]!.querySelector("svg")!;
        const frame = card.querySelector(":scope > rect");
        const parts = card.querySelectorAll(":scope > rect ~ *:not(title)");
        const [first, second, third] = q("[data-step]");

        gsap.set(q("[data-step]"), { opacity: 0.25 });
        gsap.set(q("[data-typed]"), { text: "" });

        gsap
          .timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=280%",
              scrub: 0.8,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
            },
          })
          .to(first, { opacity: 1, duration: 0.3 })
          .to(q("[data-caret]"), { opacity: 1, duration: 0.1 }, "<")
          .to(q("[data-typed]"), {
            text: repositoryUrl,
            duration: 2,
            ease: "none",
          })
          .to(first, { opacity: 0.25, duration: 0.3 })
          .to(second, { opacity: 1, duration: 0.3 }, "<")
          .to(q("[data-caret]"), { opacity: 0, duration: 0.1 }, "<")
          .to(q("[data-generate]"), {
            scale: 0.92,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
          })
          .to(q("[data-status]"), { opacity: 1, duration: 0.3 })
          .to(q("[data-status]"), { opacity: 0, duration: 0.3 }, "+=0.7")
          .fromTo(
            q("[data-card]"),
            { opacity: 0 },
            { opacity: 1, duration: 0.01 },
            "<",
          )
          .fromTo(
            frame,
            { drawSVG: "0%", fillOpacity: 0 },
            { drawSVG: "100%", duration: 1.4, ease: "power1.inOut" },
          )
          .to(frame, { fillOpacity: 1, duration: 0.4 })
          .from(
            parts,
            { opacity: 0, y: 10, stagger: 0.25, duration: 0.6 },
            "-=0.6",
          )
          .to(second, { opacity: 0.25, duration: 0.3 })
          .to(third, { opacity: 1, duration: 0.3 }, "<")
          .from(q("[data-snippet]"), { opacity: 0, y: 16, duration: 0.7 })
          .to(q("[data-copied]"), { opacity: 1, y: 0, duration: 0.4 }, "+=0.3")
          .to({}, { duration: 0.8 });
      });

      mm.add(`${MOTION} and not ${DESKTOP}`, () => {
        gsap.from(q("[data-stage] > *"), {
          y: 24,
          opacity: 0,
          stagger: 0.12,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-stage]")[0], start: "top 80%" },
        });
      });
    },
    { scope: root, dependencies: [repositoryUrl] },
  );

  return (
    <div>
      <section
        ref={root}
        aria-labelledby="how-it-works"
        className="grid gap-12 lg:min-h-dvh lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16 lg:py-16"
      >
        <div className="flex flex-col gap-8">
          <h2
            id="how-it-works"
            className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl"
          >
            {landing.howItWorksTitle}
          </h2>
          <ol className="flex flex-col border-t">
            {steps.map((step, index) => (
              <li
                key={step.title}
                data-step
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 gap-y-2 border-b py-6"
              >
                <span
                  aria-hidden="true"
                  className="row-span-2 pt-1 font-mono text-xs text-muted"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-medium tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div
          data-stage
          aria-hidden="true"
          className="flex flex-col gap-6 rounded-2xl border bg-surface p-5 sm:p-8"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 min-w-0 flex-1 items-center overflow-hidden rounded-site border bg-background px-4 font-mono text-xs whitespace-nowrap sm:text-sm">
              <span data-typed>{repositoryUrl}</span>
              <span
                data-caret
                className="ml-0.5 inline-block h-4 w-px bg-foreground opacity-0"
              />
            </div>
            <div
              data-generate
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground"
            >
              {generator.submitLabel}
            </div>
          </div>
          <p
            data-status
            className="-my-3 flex items-center gap-2 font-mono text-xs text-muted opacity-0"
          >
            <LoaderCircle className="size-3.5 animate-spin" />
            {generator.submittingLabel}
          </p>
          <div
            data-card
            className="w-full max-w-[380px] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: cardMarkup }}
          />
          <div
            data-snippet
            className="relative rounded-site border bg-background p-4 pr-24 font-mono text-xs leading-relaxed break-all text-muted"
          >
            {snippet}
            <span
              data-copied
              className="absolute top-3 right-3 translate-y-1 rounded-full bg-accent px-2.5 py-1 font-sans text-[11px] font-semibold text-accent-foreground opacity-0"
            >
              {landing.copiedExampleLabel}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
