import { compareIds } from "../lib/compare";
import type { IsoTimestamp, TaskQueueEntry, WeekAnchor } from "../types";

export interface AssignmentPartition {
  /** Assets that will actually be added to the week. */
  assignable: string[];
  /** Assets already scheduled for this exact week — reported back to the UI. */
  skippedAssetIds: string[];
}

/**
 * Splits a batch of asset IDs for assignment to `week`. Assets already in
 * that week are skipped; scheduling an asset into several different weeks
 * is allowed, so only exact same-week duplicates are filtered.
 */
export function partitionAssignment(
  assetIds: readonly string[],
  taskQueue: readonly TaskQueueEntry[],
  week: WeekAnchor,
): AssignmentPartition {
  const alreadyScheduled = new Set<string>();
  for (const entry of taskQueue) {
    if (entry.week === week) {
      for (const assetId of entry.assetIds) {
        alreadyScheduled.add(assetId);
      }
    }
  }

  const assignable: string[] = [];
  const skippedAssetIds: string[] = [];
  const seenInBatch = new Set<string>();
  for (const assetId of assetIds) {
    if (seenInBatch.has(assetId)) continue;
    seenInBatch.add(assetId);
    if (alreadyScheduled.has(assetId)) {
      skippedAssetIds.push(assetId);
    } else {
      assignable.push(assetId);
    }
  }
  return { assignable, skippedAssetIds };
}

function mergeSortedUnique(current: readonly string[], additions: readonly string[]): string[] {
  return [...new Set([...current, ...additions])].sort(compareIds);
}

/** Values for a not-yet-existing week entry, generated at dispatch time. */
export interface TaskEntryDraft {
  id: string;
  createdAt: IsoTimestamp;
}

/**
 * Adds assets to the entry for `week`, creating it from `entryDraft` if
 * needed. Kept sorted for deterministic rendering; entries never contain
 * duplicates. Pure — no Date or crypto calls.
 */
export function addToWeek(
  taskQueue: readonly TaskQueueEntry[],
  week: WeekAnchor,
  assetIds: readonly string[],
  entryDraft: TaskEntryDraft,
): TaskQueueEntry[] {
  if (assetIds.length === 0) return [...taskQueue];

  const existing = taskQueue.find((entry) => entry.week === week);
  if (existing === undefined) {
    const entry: TaskQueueEntry = {
      id: entryDraft.id,
      assetIds: [...assetIds].sort(compareIds),
      week,
      createdAt: entryDraft.createdAt,
    };
    return [...taskQueue, entry];
  }
  return taskQueue.map((entry) =>
    entry.week === week
      ? { ...entry, assetIds: mergeSortedUnique(entry.assetIds, assetIds) }
      : entry,
  );
}
