"use client";

import { useRef } from "react";
import { CopyButton } from "@/components/generator/copy-button";
import { gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import { Tilt } from "@/components/motion/tilt";
import type { Dictionary } from "@/i18n/types";
import {
  buildCardPath,
  buildMarkdownSnippet,
  GENERATOR_IMAGE_HEIGHT,
  GENERATOR_IMAGE_WIDTH,
} from "@/lib/generator";
import { cn } from "@/lib/utils";

type GeneratorResultProps = {
  owner: string;
  repo: string;
  cardOrigin: string;
  dictionary: Dictionary["generator"];
  pending?: boolean;
};

export function GeneratorResult({
  owner,
  repo,
  cardOrigin,
  dictionary,
  pending = false,
}: GeneratorResultProps) {
  const root = useRef<HTMLElement>(null);
  const snippetRef = useRef<HTMLPreElement>(null);
  const pair = `${owner}/${repo}`;
  const snippet = buildMarkdownSnippet(cardOrigin, owner, repo);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap
          .timeline({ defaults: { ease: "expo.out" } })
          .from(q("h2"), { y: 16, opacity: 0, duration: 0.7 })
          .fromTo(
            q("[data-result-card]"),
            { clipPath: "inset(0 100% 0 0 round 12px)", y: 12 },
            {
              clipPath: "inset(0 0% 0 0 round 12px)",
              y: 0,
              duration: 1.1,
              clearProps: "clipPath",
            },
            "-=0.5",
          )
          .from(
            q("[data-result-snippet]"),
            { y: 20, opacity: 0, duration: 0.8 },
            "-=0.7",
          );
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="generator-result-heading"
      aria-busy={pending || undefined}
      data-testid="generator-result"
      className={cn(
        "flex flex-col gap-6 border-t pt-10 transition-opacity duration-300",
        pending && "opacity-50",
      )}
    >
      <h2
        id="generator-result-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        {dictionary.resultHeading}
      </h2>
      <div data-result-card className="w-fit max-w-full [perspective:1000px]">
        <Tilt>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pair}
            src={buildCardPath(owner, repo)}
            alt={pair}
            width={GENERATOR_IMAGE_WIDTH}
            height={GENERATOR_IMAGE_HEIGHT}
            loading="eager"
            decoding="async"
            className="block h-auto max-w-full"
          />
        </Tilt>
      </div>
      <div data-result-snippet className="flex max-w-2xl flex-col gap-3">
        <p
          id="generator-snippet-label"
          className="font-mono text-xs tracking-wide text-muted uppercase"
        >
          {dictionary.snippetLabel}
        </p>
        <div className="flex flex-col gap-4 rounded-site border bg-surface p-4">
          <pre
            ref={snippetRef}
            aria-labelledby="generator-snippet-label"
            tabIndex={0}
            className="overflow-x-auto font-mono text-sm leading-relaxed break-all whitespace-pre-wrap"
          >
            {snippet}
          </pre>
          <CopyButton
            text={snippet}
            targetRef={snippetRef}
            dictionary={dictionary}
          />
        </div>
      </div>
    </section>
  );
}
