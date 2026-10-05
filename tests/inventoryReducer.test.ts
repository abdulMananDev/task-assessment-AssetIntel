import { describe, expect, it } from "vitest";
import {
  createAssignTasksAction,
  createRemoveTaskAssetAction,
  createSetHealthStatusAction,
} from "../src/state/actions";
import { createInitialState, inventoryReducer } from "../src/state/inventoryReducer";
import type { InventoryState } from "../src/types";

const WEEK_A = "2026-10-05";
const WEEK_B = "2026-10-12";

function stateWithSelection(assetIds: string[]): InventoryState {
  let state = createInitialState();
  for (const assetId of assetIds) {
    state = inventoryReducer(state, { type: "TOGGLE_ASSET_SELECTION", assetId });
  }
  return state;
}

describe("inventoryReducer — filters", () => {
  it("sets the query", () => {
    const state = inventoryReducer(createInitialState(), {
      type: "SET_QUERY",
      query: "maple",
    });
    expect(state.filters.query).toBe("maple");
  });

  it("sets each filter field without touching the others", () => {
    let state = inventoryReducer(createInitialState(), {
      type: "SET_FILTER",
      field: "zone",
      value: "West Bank",
    });
    state = inventoryReducer(state, {
      type: "SET_FILTER",
      field: "healthStatus",
      value: "Critical",
    });
    state = inventoryReducer(state, {
      type: "SET_FILTER",
      field: "assetType",
      value: "Shrubbery",
    });
    expect(state.filters).toEqual({
      query: "",
      zone: "West Bank",
      healthStatus: "Critical",
      assetType: "Shrubbery",
    });
  });

  it("clears all filters", () => {
    let state = inventoryReducer(createInitialState(), { type: "SET_QUERY", query: "oak" });
    state = inventoryReducer(state, { type: "SET_FILTER", field: "zone", value: "East Park" });
    state = inventoryReducer(state, { type: "CLEAR_FILTERS" });
    expect(state.filters).toEqual(createInitialState().filters);
  });
});

describe("inventoryReducer — sorting", () => {
  it("toggles direction when the same key is clicked", () => {
    let state = inventoryReducer(createInitialState(), { type: "SET_SORT", key: "id" });
    expect(state.sort).toEqual({ key: "id", direction: "desc" });
    state = inventoryReducer(state, { type: "SET_SORT", key: "id" });
    expect(state.sort).toEqual({ key: "id", direction: "asc" });
  });

  it("uses the most useful default direction for a new key", () => {
    let state = inventoryReducer(createInitialState(), { type: "SET_SORT", key: "healthStatus" });
    expect(state.sort).toEqual({ key: "healthStatus", direction: "desc" });
    state = inventoryReducer(state, { type: "SET_SORT", key: "lastInspected" });
    expect(state.sort).toEqual({ key: "lastInspected", direction: "desc" });
    state = inventoryReducer(state, { type: "SET_SORT", key: "name" });
    expect(state.sort).toEqual({ key: "name", direction: "asc" });
  });
});

describe("inventoryReducer — selection", () => {
  it("toggles individual assets", () => {
    let state = inventoryReducer(createInitialState(), {
      type: "TOGGLE_ASSET_SELECTION",
      assetId: "GW-101",
    });
    expect(state.selectedAssetIds).toEqual(["GW-101"]);
    state = inventoryReducer(state, { type: "TOGGLE_ASSET_SELECTION", assetId: "GW-101" });
    expect(state.selectedAssetIds).toEqual([]);
  });

  it("select-visible adds hidden selections and toggle-off removes only the visible ones", () => {
    let state = stateWithSelection(["GW-101", "GW-107"]);
    state = inventoryReducer(state, {
      type: "SELECT_VISIBLE_ASSETS",
      assetIds: ["GW-101", "GW-103"],
    });
    expect(state.selectedAssetIds).toEqual(["GW-101", "GW-107", "GW-103"]);

    state = inventoryReducer(state, {
      type: "SELECT_VISIBLE_ASSETS",
      assetIds: ["GW-101", "GW-103"],
    });
    expect(state.selectedAssetIds).toEqual(["GW-107"]);
  });

  it("clears the selection", () => {
    const state = inventoryReducer(stateWithSelection(["GW-101"]), {
      type: "CLEAR_SELECTION",
    });
    expect(state.selectedAssetIds).toEqual([]);
  });
});

describe("inventoryReducer — drawer", () => {
  it("opens a known asset and ignores unknown ids", () => {
    const base = createInitialState();
    const opened = inventoryReducer(base, { type: "OPEN_ASSET", assetId: "GW-101" });
    expect(opened.openAssetId).toBe("GW-101");

    const unknown = inventoryReducer(base, { type: "OPEN_ASSET", assetId: "GW-999" });
    expect(unknown).toBe(base);
  });

  it("closes the drawer", () => {
    let state = inventoryReducer(createInitialState(), { type: "OPEN_ASSET", assetId: "GW-101" });
    state = inventoryReducer(state, { type: "CLOSE_ASSET" });
    expect(state.openAssetId).toBeNull();
  });
});

describe("inventoryReducer — health status", () => {
  it("updates the asset and prepends a dispatcher log", () => {
    const state = inventoryReducer(
      createInitialState(),
      createSetHealthStatusAction("GW-102", "Critical"),
    );
    const asset = state.assets.find((candidate) => candidate.id === "GW-102");
    expect(asset?.healthStatus).toBe("Critical");
    expect(state.logs).toHaveLength(createInitialState().logs.length + 1);
    expect(state.logs[0]?.summary).toContain("Critical");
    expect(state.logs[0]?.source).toBe("Dispatcher");
  });

  it("returns the same state when the status is unchanged", () => {
    const first = inventoryReducer(
      createInitialState(),
      createSetHealthStatusAction("GW-102", "Critical"),
    );
    const second = inventoryReducer(
      first,
      createSetHealthStatusAction("GW-102", "Critical"),
    );
    expect(second).toBe(first);
  });
});

describe("inventoryReducer — task assignment", () => {
  it("assigns a batch to a week, clears the assigned from selection, and reports the result", () => {
    const state = inventoryReducer(
      stateWithSelection(["GW-102", "GW-101"]),
      createAssignTasksAction(["GW-102", "GW-101"], WEEK_A),
    );

    expect(state.taskQueue).toHaveLength(1);
    expect(state.taskQueue[0]?.week).toBe(WEEK_A);
    expect(state.taskQueue[0]?.assetIds).toEqual(["GW-101", "GW-102"]);
    expect(state.selectedAssetIds).toEqual([]);
    expect(state.lastAssignmentResult).toEqual({
      week: WEEK_A,
      assignedCount: 2,
      skippedCount: 0,
      skippedAssetIds: [],
      at: expect.any(String),
    });
    expect(state.logs[0]?.summary).toMatch(/^Scheduled for Week of /);
  });

  it("skips assets already in the same week, keeps them selected, and reports them", () => {
    let state = inventoryReducer(
      createInitialState(),
      createAssignTasksAction(["GW-101"], WEEK_A),
    );
    state = inventoryReducer(state, { type: "TOGGLE_ASSET_SELECTION", assetId: "GW-101" });
    state = inventoryReducer(state, { type: "TOGGLE_ASSET_SELECTION", assetId: "GW-103" });

    state = inventoryReducer(state, createAssignTasksAction(["GW-101", "GW-103"], WEEK_A));

    expect(state.lastAssignmentResult?.assignedCount).toBe(1);
    expect(state.lastAssignmentResult?.skippedCount).toBe(1);
    expect(state.lastAssignmentResult?.skippedAssetIds).toEqual(["GW-101"]);
    expect(state.selectedAssetIds).toEqual(["GW-101"]);
    expect(state.taskQueue[0]?.assetIds).toEqual(["GW-101", "GW-103"]);
  });

  it("allows the same asset in a different week", () => {
    let state = inventoryReducer(
      createInitialState(),
      createAssignTasksAction(["GW-101"], WEEK_A),
    );
    state = inventoryReducer(state, createAssignTasksAction(["GW-101"], WEEK_B));

    expect(state.taskQueue).toHaveLength(2);
    expect(state.taskQueue.map((entry) => entry.week)).toEqual([WEEK_A, WEEK_B]);
  });

  it("filters unknown asset ids out of a batch", () => {
    const state = inventoryReducer(
      createInitialState(),
      createAssignTasksAction(["GW-101", "GW-999"], WEEK_A),
    );
    expect(state.taskQueue[0]?.assetIds).toEqual(["GW-101"]);
    expect(state.lastAssignmentResult?.assignedCount).toBe(1);
  });

  it("is a no-op for an empty batch", () => {
    const base = createInitialState();
    const state = inventoryReducer(base, createAssignTasksAction([], WEEK_A));
    expect(state).toBe(base);
  });

  it("dismisses the assignment result", () => {
    let state = inventoryReducer(
      createInitialState(),
      createAssignTasksAction(["GW-101"], WEEK_A),
    );
    state = inventoryReducer(state, { type: "DISMISS_ASSIGNMENT_RESULT" });
    expect(state.lastAssignmentResult).toBeNull();
  });
});

describe("inventoryReducer — task removal", () => {
  function stateWithQueue(): InventoryState {
    return inventoryReducer(
      createInitialState(),
      createAssignTasksAction(["GW-101", "GW-103"], WEEK_A),
    );
  }

  it("removes a single asset from a week entry", () => {
    const base = stateWithQueue();
    const taskId = base.taskQueue[0]?.id ?? "";
    const state = inventoryReducer(
      base,
      createRemoveTaskAssetAction(taskId, "GW-101", WEEK_A),
    );
    expect(state.taskQueue).toHaveLength(1);
    expect(state.taskQueue[0]?.assetIds).toEqual(["GW-103"]);
    expect(state.logs[0]?.summary).toContain("Removed from");
  });

  it("prunes the entry when its last asset is removed", () => {
    let state = stateWithQueue();
    const taskId = state.taskQueue[0]?.id ?? "";
    state = inventoryReducer(state, createRemoveTaskAssetAction(taskId, "GW-101", WEEK_A));
    state = inventoryReducer(state, createRemoveTaskAssetAction(taskId, "GW-103", WEEK_A));
    expect(state.taskQueue).toEqual([]);
  });

  it("is a no-op for unknown task ids or assets", () => {
    const base = stateWithQueue();
    const taskId = base.taskQueue[0]?.id ?? "";
    expect(
      inventoryReducer(base, createRemoveTaskAssetAction("task-404", "GW-101", WEEK_A)),
    ).toBe(base);
    expect(
      inventoryReducer(base, createRemoveTaskAssetAction(taskId, "GW-999", WEEK_A)),
    ).toBe(base);
  });
});

describe("inventoryReducer — reset and purity", () => {
  it("resets to the initial state", () => {
    let state = inventoryReducer(createInitialState(), { type: "SET_QUERY", query: "oak" });
    state = inventoryReducer(state, {
      type: "SET_HEALTH_STATUS",
      assetId: "GW-102",
      healthStatus: "Critical",
      log: {
        id: "log-1",
        assetId: "GW-102",
        date: "2026-10-05T00:00:00.000Z",
        summary: "Health status changed to Critical.",
        source: "Dispatcher",
      },
    });
    state = inventoryReducer(state, { type: "RESET_STATE" });
    expect(state).toEqual(createInitialState());
  });

  it("is pure: double-invoking the same action yields identical state (StrictMode)", () => {
    const action = createAssignTasksAction(["GW-101", "GW-102"], WEEK_A);
    const first = inventoryReducer(createInitialState(), action);
    const second = inventoryReducer(createInitialState(), action);
    expect(second).toEqual(first);
  });
});
