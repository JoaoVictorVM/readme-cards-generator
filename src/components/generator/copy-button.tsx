"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import type { Dictionary } from "@/i18n/types";
import { GENERATOR_COPY_FEEDBACK_MS } from "@/lib/generator";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "fallback";

type CopyButtonProps = {
  text: string;
  targetRef: RefObject<HTMLElement | null>;
  dictionary: Dictionary["generator"];
};

function selectContents(element: HTMLElement | null) {
  const selection = window.getSelection?.();
  if (!element || !selection) return;
  selection.removeAllRanges();
  selection.selectAllChildren(element);
}

export function CopyButton({ text, targetRef, dictionary }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  // Bumped on every successful write so a click during the confirmation
  // restarts the feedback timer instead of being swallowed.
  const [confirmations, setConfirmations] = useState(0);

  useEffect(() => {
    if (state !== "copied") return;
    const timer = window.setTimeout(
      () => setState("idle"),
      GENERATOR_COPY_FEEDBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state, confirmations]);

  const fallback = () => {
    selectContents(targetRef.current);
    setState("fallback");
  };

  const copy = () => {
    const writeText = navigator.clipboard?.writeText;
    if (typeof writeText !== "function") {
      fallback();
      return;
    }
    writeText
      .call(navigator.clipboard, text)
      .then(() => {
        setState("copied");
        setConfirmations((count) => count + 1);
      })
      .catch(fallback);
  };

  const Icon = state === "copied" ? Check : Copy;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-site)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)]",
          state === "copied" && "text-[var(--color-accent)]",
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
        {state === "copied" ? dictionary.copiedLabel : dictionary.copyLabel}
      </button>
      <p role="status" className="text-sm text-[var(--color-muted)]">
        {state === "fallback" ? dictionary.copyFallbackLabel : null}
      </p>
    </div>
  );
}
