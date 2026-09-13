"use client";

import { LoaderCircle } from "lucide-react";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent as ReactFormEvent,
} from "react";
import { GeneratorResult } from "@/components/generator/generator-result";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  formReducer,
  INITIAL_FORM_STATE,
  parseRepositoryUrl,
  requestValidation,
  type FormEvent,
  type FormState,
  type RepositoryPair,
  type RequestValidation,
  type ValidationErrorKind,
} from "@/lib/generator";
import { cn } from "@/lib/utils";

type GeneratorFormProps = {
  locale: Locale;
  dictionary: Dictionary["generator"];
  cardOrigin: string;
  validate?: RequestValidation;
};

const INPUT_ID = "generator-url";
const ERROR_ID = "generator-url-error";

const ERROR_KEYS: Record<ValidationErrorKind, keyof Dictionary["generator"]> = {
  invalid_url: "errorInvalidUrl",
  not_found: "errorNotFound",
  quota_exhausted: "errorQuotaExhausted",
  too_many_requests: "errorTooManyRequests",
  could_not_verify: "errorCouldNotVerify",
};

function reduceNow(state: FormState, event: FormEvent): FormState {
  return formReducer(state, event, Date.now());
}

function visiblePair(state: FormState): RepositoryPair | null {
  if (state.status === "success") {
    return { owner: state.owner, repo: state.repo };
  }
  if (state.status === "validating") return state.previous;
  return null;
}

export function GeneratorForm({
  locale,
  dictionary,
  cardOrigin,
  validate = requestValidation,
}: GeneratorFormProps) {
  const [value, setValue] = useState("");
  const [state, dispatch] = useReducer(reduceNow, INITIAL_FORM_STATE);
  const sequenceRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    return () => controller.abort();
  }, []);

  const cooldownUntil = state.status === "error" ? state.cooldownUntil : null;

  useEffect(() => {
    if (cooldownUntil === null) return;
    const remaining = Math.max(0, cooldownUntil - Date.now());
    const timer = window.setTimeout(
      () => dispatch({ type: "COOLDOWN_ENDED" }),
      remaining,
    );
    return () => window.clearTimeout(timer);
  }, [cooldownUntil]);

  const validating = state.status === "validating";
  const coolingDown = cooldownUntil !== null && cooldownUntil > Date.now();
  const error = state.status === "error" ? state.kind : null;
  const pair = visiblePair(state);

  const handleSubmit = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validating || coolingDown) return;

    const parsed = parseRepositoryUrl(value);
    if (!parsed.ok) {
      dispatch({ type: "REJECT_INPUT" });
      return;
    }

    const sequence = ++sequenceRef.current;
    dispatch({ type: "SUBMIT", sequence });
    void validate(parsed.data.owner, parsed.data.repo, {
      signal: abortRef.current?.signal,
    }).then((resolution) => {
      if (resolution.status === "aborted") return;
      dispatch({ type: "RESOLVE", sequence, resolution });
    });
  };

  return (
    <div className="flex flex-col gap-8" lang={locale}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full max-w-2xl flex-col gap-2"
      >
        <label htmlFor={INPUT_ID} className="text-sm font-medium">
          {dictionary.urlFieldLabel}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={INPUT_ID}
            name="repository"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={dictionary.urlFieldPlaceholder}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={error !== null ? "true" : undefined}
            aria-describedby={error !== null ? ERROR_ID : undefined}
            className={cn(
              "min-w-0 flex-1 rounded-[var(--radius-site)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-base outline-none focus-visible:border-[var(--color-accent)]",
              error !== null && "border-red-400",
            )}
          />
          <button
            type="submit"
            disabled={validating || coolingDown}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-site)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {validating ? (
              <LoaderCircle
                aria-hidden="true"
                data-testid="generator-spinner"
                className="size-4 animate-spin"
              />
            ) : null}
            {dictionary.submitLabel}
          </button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {validating ? dictionary.submittingLabel : null}
        </p>
        {error !== null ? (
          <p id={ERROR_ID} role="alert" className="text-sm text-red-400">
            {dictionary[ERROR_KEYS[error]]}
          </p>
        ) : null}
      </form>
      {pair ? (
        <GeneratorResult
          owner={pair.owner}
          repo={pair.repo}
          cardOrigin={cardOrigin}
          dictionary={dictionary}
        />
      ) : null}
    </div>
  );
}
