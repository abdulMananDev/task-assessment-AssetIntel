import type { IsoDate, IsoTimestamp } from "../types";

export function formatDate(date: IsoDate): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

export function formatTimestamp(timestamp: IsoTimestamp): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
