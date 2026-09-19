import type { Dictionary } from "@/i18n/types";
import { GENERATOR_IMAGE_HEIGHT, GENERATOR_IMAGE_WIDTH } from "@/lib/generator";

type GeneratorEmptyStateProps = {
  dictionary: Dictionary["generator"];
};

export function GeneratorEmptyState({ dictionary }: GeneratorEmptyStateProps) {
  return (
    <div className="flex flex-col gap-6 border-t pt-10">
      <p
        style={{
          width: GENERATOR_IMAGE_WIDTH,
          aspectRatio: `${GENERATOR_IMAGE_WIDTH} / ${GENERATOR_IMAGE_HEIGHT}`,
        }}
        className="flex max-w-full items-center justify-center rounded-xl border border-dashed font-mono text-xs text-muted"
      >
        {dictionary.emptyState}
      </p>
    </div>
  );
}
