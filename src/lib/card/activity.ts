import {
  AMBER_BAND_MAX_DAYS,
  DAY_MS,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  GREEN_BAND_MAX_DAYS,
  HOUR_MS,
  MAX_MONTHS,
} from "@/lib/card/config";
import type { Activity, DotBand } from "@/lib/card/types";

function bandFor(days: number): DotBand {
  if (days < GREEN_BAND_MAX_DAYS) return "green";
  if (days < AMBER_BAND_MAX_DAYS) return "amber";
  return "gray";
}

export function computeActivity(pushedAt: string, now: number): Activity {
  const pushed = Date.parse(pushedAt);
  if (!Number.isFinite(pushed)) return { known: false, band: "gray" };

  const elapsed = Math.max(now - pushed, 0);
  const days = elapsed / DAY_MS;
  const band = bandFor(days);

  if (elapsed < DAY_MS) {
    const hours = Math.max(Math.floor(elapsed / HOUR_MS), 1);
    return { known: true, unit: "hour", count: hours, band };
  }
  if (days < DAYS_PER_MONTH) {
    return { known: true, unit: "day", count: Math.floor(days), band };
  }
  if (days < DAYS_PER_YEAR) {
    const months = Math.min(Math.floor(days / DAYS_PER_MONTH), MAX_MONTHS);
    return { known: true, unit: "month", count: months, band };
  }
  return {
    known: true,
    unit: "year",
    count: Math.floor(days / DAYS_PER_YEAR),
    band,
  };
}
