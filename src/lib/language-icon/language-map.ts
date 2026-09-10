import type { LanguageEntry } from "@/lib/language-icon/types";

export const LANGUAGE_TABLE: readonly LanguageEntry[] = [
  {
    language: "JavaScript",
    slug: "javascript",
    variant: "original",
    color: "#f1e05a",
  },
  {
    language: "TypeScript",
    slug: "typescript",
    variant: "original",
    color: "#3178c6",
  },
  { language: "Python", slug: "python", variant: "original", color: "#3572a5" },
  { language: "Java", slug: "java", variant: "original", color: "#b07219" },
  { language: "Go", slug: "go", variant: "original", color: "#00add8" },
  { language: "Rust", slug: "rust", variant: "original", color: "#dea584" },
  { language: "C", slug: "c", variant: "original", color: "#555555" },
  { language: "C++", slug: "cplusplus", variant: "original", color: "#f34b7d" },
  { language: "C#", slug: "csharp", variant: "original", color: "#178600" },
  { language: "PHP", slug: "php", variant: "original", color: "#4f5d95" },
  { language: "Ruby", slug: "ruby", variant: "original", color: "#701516" },
  { language: "Swift", slug: "swift", variant: "original", color: "#f05138" },
  { language: "Kotlin", slug: "kotlin", variant: "original", color: "#a97bff" },
  { language: "Dart", slug: "dart", variant: "original", color: "#00b4ab" },
  { language: "Shell", slug: "bash", variant: "original", color: "#89e051" },
  { language: "HTML", slug: "html5", variant: "original", color: "#e34c26" },
  { language: "CSS", slug: "css3", variant: "original", color: "#663399" },
  { language: "Vue", slug: "vuejs", variant: "original", color: "#41b883" },
  { language: "Elixir", slug: "elixir", variant: "original", color: "#6e4a7e" },
  { language: "Scala", slug: "scala", variant: "original", color: "#c22d40" },
  { language: "Lua", slug: "lua", variant: "original", color: "#000080" },
  { language: "R", slug: "r", variant: "original", color: "#198ce7" },
  {
    language: "Haskell",
    slug: "haskell",
    variant: "original",
    color: "#5e5086",
  },
  { language: "Perl", slug: "perl", variant: "original", color: "#0298c3" },
  {
    language: "Objective-C",
    slug: "objectivec",
    variant: "plain",
    color: "#438eff",
  },
  {
    language: "Clojure",
    slug: "clojure",
    variant: "original",
    color: "#db5855",
  },
  { language: "Erlang", slug: "erlang", variant: "original", color: "#b83998" },
  { language: "Julia", slug: "julia", variant: "original", color: "#a270ba" },
  { language: "Zig", slug: "zig", variant: "original", color: "#ec915c" },
  { language: "Nim", slug: "nim", variant: "original", color: "#ffc200" },
  { language: "SCSS", slug: "sass", variant: "original", color: "#c6538c" },
  { language: "Svelte", slug: "svelte", variant: "original", color: "#ff3e00" },
  { language: "Astro", slug: "astro", variant: "original", color: "#ff5a03" },
  {
    language: "Solidity",
    slug: "solidity",
    variant: "original",
    color: "#aa6746",
  },
  { language: "Groovy", slug: "groovy", variant: "original", color: "#4298b8" },
  {
    language: "PowerShell",
    slug: "powershell",
    variant: "original",
    color: "#012456",
  },
  {
    language: "CoffeeScript",
    slug: "coffeescript",
    variant: "original",
    color: "#244776",
  },
  { language: "OCaml", slug: "ocaml", variant: "original", color: "#ef7a08" },
  { language: "F#", slug: "fsharp", variant: "original", color: "#b845fc" },
  {
    language: "Crystal",
    slug: "crystal",
    variant: "original",
    color: "#000100",
  },
  { language: "TeX", slug: "latex", variant: "original", color: "#3d6117" },
  {
    language: "Dockerfile",
    slug: "docker",
    variant: "original",
    color: "#384d54",
  },
  {
    language: "Jupyter Notebook",
    slug: "jupyter",
    variant: "plain",
    color: "#da5b0b",
  },
];

const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  "objective-c++": "Objective-C",
  sass: "SCSS",
  latex: "TeX",
  bash: "Shell",
  "html+erb": "HTML",
  "vue.js": "Vue",
  "c++17": "C++",
  "c++20": "C++",
  jupyter: "Jupyter Notebook",
};

const BY_KEY = new Map<string, LanguageEntry>(
  LANGUAGE_TABLE.map((entry) => [entry.language.toLowerCase(), entry]),
);

export function lookupLanguage(
  language: string | null | undefined,
): LanguageEntry | null {
  if (typeof language !== "string") return null;
  const key = language.trim().toLowerCase();
  if (key.length === 0) return null;
  const aliased = LANGUAGE_ALIASES[key];
  if (aliased !== undefined) {
    return BY_KEY.get(aliased.toLowerCase()) ?? null;
  }
  return BY_KEY.get(key) ?? null;
}
