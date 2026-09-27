"use client";

import { useRef } from "react";
import { CopyButton } from "@/components/generator/copy-button";
import { GeneratorStage } from "@/components/generator/generator-preview";
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
  const snippetRef = useRef<HTMLPreElement>(null);
  const pair = `${owner}/${repo}`;
  const snippet = buildMarkdownSnippet(cardOrigin, owner, repo);

  return (
    <section
      aria-labelledby="generator-result-heading"
      aria-busy={pending || undefined}
      data-testid="generator-result"
      className="flex flex-col gap-8"
    >
      <h2 id="generator-result-heading" className="sr-only">
        {dictionary.resultHeading}
      </h2>
      <GeneratorStage>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={pair}
          src={buildCardPath(owner, repo)}
          alt={pair}
          width={GENERATOR_IMAGE_WIDTH}
          height={GENERATOR_IMAGE_HEIGHT}
          loading="eager"
          decoding="async"
          className={cn(
            "card-enter card-frame block h-auto max-w-full transition-opacity duration-200",
            pending && "opacity-40",
          )}
        />
        {pending ? <span className="shine" /> : null}
      </GeneratorStage>
      <div className="card-enter flex max-w-2xl flex-col gap-3">
        <p id="generator-snippet-label" className="eyebrow">
          {dictionary.snippetLabel}
        </p>
        <div className="flex flex-col gap-4 rounded-2xl border bg-surface p-5">
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
