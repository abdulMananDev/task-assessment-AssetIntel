import { describe, expect, it } from "vitest";
import { formatWeekLabel, getUpcomingWeeks } from "../src/data/schedule";

describe("getUpcomingWeeks", () => {
  it("includes the current week and returns Monday anchors", () => {
    const wednesday = new Date(2026, 9, 7);
    expect(getUpcomingWeeks(4, wednesday)).toEqual([
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
      "2026-10-26",
    ]);
  });

  it("snaps a Sunday back to its own week's Monday", () => {
    const sunday = new Date(2026, 8, 27);
    expect(getUpcomingWeeks(2, sunday)).toEqual(["2026-09-21", "2026-09-28"]);
  });

  it("keeps a Monday as the first anchor", () => {
    const monday = new Date(2026, 9, 5);
    expect(getUpcomingWeeks(2, monday)).toEqual(["2026-10-05", "2026-10-12"]);
  });

  it("rolls over the year correctly", () => {
    const lateDecember = new Date(2026, 11, 30);
    expect(getUpcomingWeeks(3, lateDecember)).toEqual([
      "2026-12-28",
      "2027-01-04",
      "2027-01-11",
    ]);
  });

  it("honours the requested count", () => {
    expect(getUpcomingWeeks(1, new Date(2026, 9, 7))).toEqual(["2026-10-05"]);
  });
});

describe("formatWeekLabel", () => {
  it("produces a locale-tolerant 'Week of <date>' label", () => {
    expect(formatWeekLabel("2026-10-05")).toMatch(
      /^Week of ([A-Z][a-z]{2} \d{1,2}|\d{1,2} [A-Z][a-z]{2})$/,
    );
  });
});
