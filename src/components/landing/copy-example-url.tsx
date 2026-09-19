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
        "inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-site border px-4 text-sm font-medium transition-colors hover:border-foreground",
        copied && "border-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-4" />
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
