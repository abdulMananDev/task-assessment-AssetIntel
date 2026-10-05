import type { WeekAnchor } from "../types";

export const UPCOMING_WEEK_COUNT = 4;

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * The next `count` scheduling weeks as Monday anchors. The current week is
 * included (dispatchers plan today); `from` is injectable for tests.
 */
export function getUpcomingWeeks(
  count: number = UPCOMING_WEEK_COUNT,
  from: Date = new Date(),
): WeekAnchor[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const weeks: WeekAnchor[] = [];
  for (let index = 0; index < count; index += 1) {
    const week = new Date(start);
    week.setDate(start.getDate() + index * 7);
    weeks.push(toIsoDate(week));
  }
  return weeks;
}

/** Human label for a week anchor, e.g. "Week of Oct 5". */
export function formatWeekLabel(week: WeekAnchor): string {
  const date = new Date(`${week}T00:00:00`);
  return `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
