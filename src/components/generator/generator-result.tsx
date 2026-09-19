"use client";

import { useRef } from "react";
import { CopyButton } from "@/components/generator/copy-button";
import type { Dictionary } from "@/i18n/types";
import {
  buildCardPath,
  buildMarkdownSnippet,
  GENERATOR_IMAGE_HEIGHT,
  GENERATOR_IMAGE_WIDTH,
} from "@/lib/generator";

type GeneratorResultProps = {
  owner: string;
  repo: string;
  cardOrigin: string;
  dictionary: Dictionary["generator"];
};

export function GeneratorResult({
  owner,
  repo,
  cardOrigin,
  dictionary,
}: GeneratorResultProps) {
  const snippetRef = useRef<HTMLPreElement>(null);
  const pair = `${owner}/${repo}`;
  const snippet = buildMarkdownSnippet(cardOrigin, owner, repo);

  return (
    <section
      aria-labelledby="generator-result-heading"
      data-testid="generator-result"
      className="flex flex-col gap-6 border-t pt-10"
    >
      <h2
        id="generator-result-heading"
        className="text-2xl font-semibold tracking-tight"
      >
        {dictionary.resultHeading}
      </h2>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={pair}
        src={buildCardPath(owner, repo)}
        alt={pair}
        width={GENERATOR_IMAGE_WIDTH}
        height={GENERATOR_IMAGE_HEIGHT}
        loading="eager"
        decoding="async"
        className="hero-rise h-auto max-w-full"
      />
      <div className="flex max-w-2xl flex-col gap-3">
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
