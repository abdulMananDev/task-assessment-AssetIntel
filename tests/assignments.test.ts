import { describe, expect, it } from "vitest";
import { addToWeek, partitionAssignment } from "../src/state/assignments";
import type { TaskQueueEntry } from "../src/types";

const WEEK_A = "2026-10-05";
const WEEK_B = "2026-10-12";

function entry(
  week: string,
  assetIds: string[],
  id = `task-${week}`,
): TaskQueueEntry {
  return { id, assetIds, week, createdAt: "2026-01-01T00:00:00.000Z" };
}

describe("partitionAssignment", () => {
  it("assigns everything when the queue is empty", () => {
    const result = partitionAssignment(["GW-101", "GW-103"], [], WEEK_A);
    expect(result).toEqual({
      assignable: ["GW-101", "GW-103"],
      skippedAssetIds: [],
    });
  });

  it("skips assets already scheduled for the same week", () => {
    const queue = [entry(WEEK_A, ["GW-101"])];
    const result = partitionAssignment(["GW-101", "GW-103"], queue, WEEK_A);
    expect(result).toEqual({
      assignable: ["GW-103"],
      skippedAssetIds: ["GW-101"],
    });
  });

  it("allows assets scheduled in a different week", () => {
    const queue = [entry(WEEK_A, ["GW-101"])];
    const result = partitionAssignment(["GW-101"], queue, WEEK_B);
    expect(result).toEqual({ assignable: ["GW-101"], skippedAssetIds: [] });
  });

  it("deduplicates within the incoming batch", () => {
    const result = partitionAssignment(["GW-101", "GW-101"], [], WEEK_A);
    expect(result.assignable).toEqual(["GW-101"]);
  });
});

describe("addToWeek", () => {
  it("creates a new entry from the provided draft with sorted ids", () => {
    const result = addToWeek([], WEEK_A, ["GW-103", "GW-101"], {
      id: "task-new",
      createdAt: "2026-10-05T09:00:00.000Z",
    });
    expect(result).toEqual([
      {
        id: "task-new",
        assetIds: ["GW-101", "GW-103"],
        week: WEEK_A,
        createdAt: "2026-10-05T09:00:00.000Z",
      },
    ]);
  });

  it("merges into the existing week entry, keeping its id and createdAt", () => {
    const queue = [entry(WEEK_A, ["GW-101"]), entry(WEEK_B, ["GW-107"])];
    const result = addToWeek(queue, WEEK_A, ["GW-101", "GW-103"], {
      id: "task-unused",
      createdAt: "2026-10-05T09:00:00.000Z",
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(entry(WEEK_A, ["GW-101", "GW-103"]));
    expect(result[1]).toEqual(entry(WEEK_B, ["GW-107"]));
  });

  it("returns the queue unchanged for an empty batch", () => {
    const queue = [entry(WEEK_A, ["GW-101"])];
    expect(
      addToWeek(queue, WEEK_B, [], { id: "task-x", createdAt: "x" }),
    ).toEqual(queue);
  });
});
