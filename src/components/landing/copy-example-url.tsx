"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { COPY_CONFIRMATION_MS } from "@/components/landing/config";
import { cn } from "@/lib/utils";

type CopyExampleUrlProps = {
  url: string;
  copyLabel: string;
  copiedLabel: string;
};

export function CopyExampleUrl({
  url,
  copyLabel,
  copiedLabel,
}: CopyExampleUrlProps) {
  const [supported, setSupported] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator.clipboard?.writeText === "function");
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(
      () => setCopied(false),
      COPY_CONFIRMATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [copied]);

  if (!supported) return null;

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          .writeText(url)
          .then(() => setCopied(true))
          .catch(() => {});
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-site)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)]",
        copied && "text-[var(--color-accent)]",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
