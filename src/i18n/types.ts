import type ptBR from "./dictionaries/pt-BR";

type Widen<T> = T extends string
  ? string
  : { -readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ptBR>;

export type Namespace = keyof Dictionary;
