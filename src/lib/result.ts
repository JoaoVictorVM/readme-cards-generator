export type Ok<T> = { ok: true; data: T };

export type Failure<E extends string, D = undefined> = {
  ok: false;
  error: E;
  detail?: D;
};

export type Result<T, E extends string> = Ok<T> | Failure<E, unknown>;

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data };
}

export function fail<E extends string, D = undefined>(
  error: E,
  detail?: D,
): Failure<E, D> {
  return detail === undefined
    ? { ok: false, error }
    : { ok: false, error, detail };
}

export function isOk<T, E extends string>(
  result: Result<T, E>,
): result is Ok<T> {
  return result.ok;
}
