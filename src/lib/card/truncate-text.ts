import { ELLIPSIS } from "@/lib/card/config";

export function characterBudget(
  widthPx: number,
  fontSize: number,
  ratio: number,
): number {
  return Math.floor(widthPx / (fontSize * ratio));
}

export function truncateText(value: string, budget: number): string {
  const characters = Array.from(value);
  if (characters.length <= budget) return value;
  if (budget < 2) return ELLIPSIS;
  return characters.slice(0, budget - 1).join("") + ELLIPSIS;
}
