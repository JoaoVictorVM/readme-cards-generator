import { describe, expect, test } from "bun:test";
import { computeActivity } from "@/lib/card/activity";
import { DAY_MS, HOUR_MS } from "@/lib/card/config";

const NOW = Date.parse("2026-09-08T00:00:00Z");

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe("computeActivity", () => {
  test("under one hour is one hour green", () => {
    expect(computeActivity(ago(30 * 60 * 1000), NOW)).toEqual({
      known: true,
      unit: "hour",
      count: 1,
      band: "green",
    });
  });

  test("hours band", () => {
    expect(computeActivity("2026-09-07T05:00:00Z", NOW)).toEqual({
      known: true,
      unit: "hour",
      count: 19,
      band: "green",
    });
  });

  test("days band", () => {
    expect(computeActivity("2026-08-28T14:03:11Z", NOW)).toEqual({
      known: true,
      unit: "day",
      count: 10,
      band: "green",
    });
  });

  test("thirty days is one month amber", () => {
    expect(computeActivity("2026-08-09T00:00:00Z", NOW)).toEqual({
      known: true,
      unit: "month",
      count: 1,
      band: "amber",
    });
  });

  test("just under thirty days is green", () => {
    expect(computeActivity(ago(30 * DAY_MS - 1000), NOW)).toEqual({
      known: true,
      unit: "day",
      count: 29,
      band: "green",
    });
  });

  test("months band amber under six months", () => {
    expect(computeActivity("2026-06-01T00:00:00Z", NOW)).toEqual({
      known: true,
      unit: "month",
      count: 3,
      band: "amber",
    });
  });

  test("one hundred eighty days is gray", () => {
    expect(computeActivity(ago(180 * DAY_MS), NOW)).toEqual({
      known: true,
      unit: "month",
      count: 6,
      band: "gray",
    });
    expect(computeActivity(ago(180 * DAY_MS - 1000), NOW).band).toBe("amber");
  });

  test("seven months example is gray", () => {
    expect(computeActivity("2026-01-15T09:00:00Z", NOW)).toEqual({
      known: true,
      unit: "month",
      count: 7,
      band: "gray",
    });
  });

  test("months capped at eleven", () => {
    expect(computeActivity(ago(364 * DAY_MS), NOW)).toEqual({
      known: true,
      unit: "month",
      count: 11,
      band: "gray",
    });
  });

  test("years band", () => {
    expect(computeActivity("2024-03-01T00:00:00Z", NOW)).toEqual({
      known: true,
      unit: "year",
      count: 2,
      band: "gray",
    });
    expect(computeActivity(ago(365 * DAY_MS), NOW)).toMatchObject({
      unit: "year",
    });
  });

  test("future timestamp is one hour green", () => {
    expect(computeActivity(ago(-5 * HOUR_MS), NOW)).toEqual({
      known: true,
      unit: "hour",
      count: 1,
      band: "green",
    });
  });

  test("unparseable timestamp is unknown gray", () => {
    expect(computeActivity("not-a-date", NOW)).toEqual({
      known: false,
      band: "gray",
    });
    expect(computeActivity("", NOW)).toEqual({ known: false, band: "gray" });
  });

  test("uses injected now", () => {
    const pushed = "2026-09-07T05:00:00Z";
    const later = NOW + 10 * DAY_MS;
    expect(computeActivity(pushed, NOW)).toMatchObject({ unit: "hour" });
    expect(computeActivity(pushed, later)).toMatchObject({ unit: "day" });
  });
});
