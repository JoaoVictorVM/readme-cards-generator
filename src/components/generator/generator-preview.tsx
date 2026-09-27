import type { HTMLAttributes } from "react";
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

const BLOCKS = [
  "left-[5.3%] top-[13.3%] h-[37.3%] w-[14.7%] rounded-[14px]",
  "left-[24.2%] top-[20%] h-[8%] w-[30%] rounded-full",
  "left-[24.2%] top-[37%] h-[6%] w-[42%] rounded-full",
  "left-[5.3%] top-[62.7%] h-[24%] w-[89.4%] rounded-lg",
];

export function GeneratorStage({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "card-frame stage-grid relative flex min-h-[15rem] w-full max-w-2xl items-center justify-center overflow-hidden border bg-surface p-6 sm:min-h-[18rem] sm:p-10",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function stateKey(state: PreviewState): string {
  if (state.kind === "detected") {
    return `detected:${state.pair.owner}/${state.pair.repo}`;
  }
  return state.kind;
}

export function GeneratorPreview({ state, dictionary }: GeneratorPreviewProps) {
  const validating = state.kind === "validating";

  return (
    <GeneratorStage
      data-testid="generator-preview"
      data-state={state.kind}
      aria-hidden={validating || undefined}
      className="gen-rise-2"
    >
      <div key={stateKey(state)} className="card-enter">
        {state.kind === "empty" ? (
          <p className="caption">{dictionary.emptyState}</p>
        ) : null}

        {state.kind === "detected" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <p
              data-testid="generator-preview-pair"
              className="max-w-full truncate font-mono text-sm text-foreground sm:text-base"
            >
              {state.pair.owner}/{state.pair.repo}
            </p>
            <p className="eyebrow">{dictionary.previewReady}</p>
          </div>
        ) : null}

        {validating ? (
          <div
            style={{
              width: GENERATOR_IMAGE_WIDTH,
              aspectRatio: `${GENERATOR_IMAGE_WIDTH} / ${GENERATOR_IMAGE_HEIGHT}`,
            }}
            className="relative max-w-full rounded-xl border bg-background"
          >
            {BLOCKS.map((block) => (
              <span
                key={block}
                className={cn("absolute bg-surface-hover", block)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {validating ? <span className="shine" /> : null}
    </GeneratorStage>
  );
}
