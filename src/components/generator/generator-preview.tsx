"use client";

import { useRef } from "react";
import { gsap, MOTION, useGSAP } from "@/components/motion/gsap";
import type { Dictionary } from "@/i18n/types";
import {
  GENERATOR_IMAGE_HEIGHT,
  GENERATOR_IMAGE_WIDTH,
  type RepositoryPair,
} from "@/lib/generator";
import { cn } from "@/lib/utils";

export type PreviewState =
  | { kind: "empty" }
  | { kind: "detected"; pair: RepositoryPair }
  | { kind: "validating" };

type GeneratorPreviewProps = {
  state: PreviewState;
  dictionary: Dictionary["generator"];
};

function stateKey(state: PreviewState): string {
  if (state.kind === "detected") {
    return `detected:${state.pair.owner}/${state.pair.repo}`;
  }
  return state.kind;
}

const BLOCKS = [
  "left-[5.3%] top-[13.3%] h-[37.3%] w-[14.7%] rounded-[14px]",
  "left-[24.2%] top-[20%] h-[8%] w-[30%] rounded-full",
  "left-[24.2%] top-[37%] h-[6%] w-[42%] rounded-full",
  "left-[5.3%] top-[62.7%] h-[24%] w-[89.4%] rounded-lg",
];

export function GeneratorPreview({ state, dictionary }: GeneratorPreviewProps) {
  const root = useRef<HTMLDivElement>(null);
  const key = stateKey(state);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION, () => {
        gsap.from(root.current!.querySelectorAll("[data-preview-content]"), {
          opacity: 0,
          y: 8,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
        });
      });
    },
    { scope: root, dependencies: [key], revertOnUpdate: true },
  );

  const validating = state.kind === "validating";

  return (
    <div
      ref={root}
      data-hero-fade
      className="flex flex-col gap-6 border-t pt-10"
    >
      <div
        data-testid="generator-preview"
        data-state={state.kind}
        aria-hidden={validating || undefined}
        style={{
          width: GENERATOR_IMAGE_WIDTH,
          aspectRatio: `${GENERATOR_IMAGE_WIDTH} / ${GENERATOR_IMAGE_HEIGHT}`,
        }}
        className={cn(
          "relative flex max-w-full items-center justify-center overflow-hidden rounded-xl border transition-colors duration-500",
          validating ? "border-solid bg-surface" : "border-dashed",
          state.kind === "detected" && "border-foreground/40",
        )}
      >
        {state.kind === "empty" ? (
          <p data-preview-content className="font-mono text-xs text-muted">
            {dictionary.emptyState}
          </p>
        ) : null}

        {state.kind === "detected" ? (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <p
              data-preview-content
              data-testid="generator-preview-pair"
              className="max-w-full truncate font-mono text-sm text-foreground sm:text-base"
            >
              {state.pair.owner}/{state.pair.repo}
            </p>
            <p
              data-preview-content
              className="font-mono text-[11px] tracking-wide text-muted uppercase"
            >
              {dictionary.previewReady}
            </p>
          </div>
        ) : null}

        {validating ? (
          <>
            {BLOCKS.map((block) => (
              <span
                key={block}
                data-preview-content
                className={cn("absolute bg-border/60", block)}
              />
            ))}
            <span className="skeleton-shimmer pointer-events-none absolute inset-0" />
          </>
        ) : null}
      </div>
    </div>
  );
}
