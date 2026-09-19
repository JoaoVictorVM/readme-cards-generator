"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent as ReactFormEvent,
} from "react";
import { GeneratorEmptyState } from "@/components/generator/generator-empty-state";
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
    <div className="flex flex-col gap-12" lang={locale}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex w-full max-w-2xl flex-col gap-3"
      >
        <label
          htmlFor={INPUT_ID}
          className="font-mono text-xs tracking-wide text-muted uppercase"
        >
          {dictionary.urlFieldLabel}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
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
              "h-12 w-full min-w-0 rounded-site border bg-surface px-4 font-mono text-sm outline-none placeholder:text-muted/60 focus-visible:border-foreground focus-visible:outline-none sm:flex-1",
              error !== null && "border-warning",
            )}
          />
          <button
            type="submit"
            disabled={validating || coolingDown}
            className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
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
          <p
            id={ERROR_ID}
            role="alert"
            className="flex items-center gap-2 text-sm"
          >
            <TriangleAlert
              aria-hidden="true"
              className="size-4 shrink-0 text-warning"
            />
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
      ) : (
        <GeneratorEmptyState dictionary={dictionary} />
      )}
    </div>
  );
}
