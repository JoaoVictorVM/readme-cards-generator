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
      className="flex flex-col gap-4"
    >
      <h2
        id="generator-result-heading"
        className="text-xl font-semibold tracking-tight"
      >
        {dictionary.resultHeading}
      </h2>
      {/* The card must be the exact endpoint response a README embeds, so the
          image optimizer (which rejects SVG by default) is bypassed. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={pair}
        src={buildCardPath(owner, repo)}
        alt={pair}
        width={GENERATOR_IMAGE_WIDTH}
        height={GENERATOR_IMAGE_HEIGHT}
        loading="eager"
        decoding="async"
        className="h-auto max-w-full"
      />
      <div className="flex flex-col gap-2">
        <p
          id="generator-snippet-label"
          className="text-sm font-medium text-[var(--color-muted)]"
        >
          {dictionary.snippetLabel}
        </p>
        <pre
          ref={snippetRef}
          aria-labelledby="generator-snippet-label"
          tabIndex={0}
          className="overflow-x-auto rounded-[var(--radius-site)] border border-[var(--color-border)] px-4 py-3 font-mono text-sm break-all whitespace-pre-wrap"
        >
          {snippet}
        </pre>
        <CopyButton
          text={snippet}
          targetRef={snippetRef}
          dictionary={dictionary}
        />
      </div>
    </section>
  );
}
