import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState, inventoryReducer } from "../src/state/inventoryReducer";
import {
  loadPersistedState,
  savePersistedState,
  STORAGE_KEY,
  STORAGE_VERSION,
} from "../src/state/persistence";
import { createAssignTasksAction, createSetHealthStatusAction } from "../src/state/actions";

const WEEK_A = "2026-10-05";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("persistence — happy path", () => {
  it("round-trips filters, sort, selection, queue, and health deltas", () => {
    let state = createInitialState();
    state = inventoryReducer(state, { type: "SET_QUERY", query: "maple" });
    state = inventoryReducer(state, { type: "SET_SORT", key: "healthStatus" });
    state = inventoryReducer(state, { type: "TOGGLE_ASSET_SELECTION", assetId: "GW-101" });
    state = inventoryReducer(state, createAssignTasksAction(["GW-101"], WEEK_A));
    state = inventoryReducer(state, createSetHealthStatusAction("GW-102", "Critical"));

    savePersistedState(state);
    const restored = loadPersistedState();

    expect(restored).not.toBeNull();
    expect(restored?.filters.query).toBe("maple");
    expect(restored?.sort).toEqual({ key: "healthStatus", direction: "desc" });
    expect(restored?.selectedAssetIds).toEqual([]);
    expect(restored?.taskQueue).toHaveLength(1);
    expect(restored?.taskQueue[0]?.assetIds).toEqual(["GW-101"]);
    expect(restored?.healthOverrides).toEqual({ "GW-102": "Critical" });
    expect(restored?.userLogs.length).toBeGreaterThan(0);
  });

  it("excludes seed logs from userLogs", () => {
    savePersistedState(createInitialState());
    const restored = loadPersistedState();
    expect(restored?.userLogs).toEqual([]);
  });
});

describe("persistence — corrupt and foreign data", () => {
  it("returns null for corrupt JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadPersistedState()).toBeNull();
  });

  it("returns null for a foreign version", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION + 1, state: {} }),
    );
    expect(loadPersistedState()).toBeNull();
  });

  it("returns null for non-object envelopes", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadPersistedState()).toBeNull();
  });

  it("falls back per-field: bad filters default while valid sort survives", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        state: {
          filters: { query: 42, zone: "Nowhere" },
          sort: { key: "name", direction: "desc" },
          selectedAssetIds: ["GW-101", "GW-404", 7],
          taskQueue: [
            { id: "t1", assetIds: ["GW-101"], week: WEEK_A, createdAt: "2026-10-05T00:00:00.000Z" },
            { id: "t2", assetIds: ["GW-404"], week: "2026-10-12", createdAt: "2026-10-05T00:00:00.000Z" },
            "garbage",
          ],
          healthOverrides: { "GW-102": "Critical", "GW-404": "Healthy", "GW-101": "Meh" },
          userLogs: "nope",
        },
      }),
    );

    const restored = loadPersistedState();

    expect(restored?.filters).toEqual({
      query: "",
      zone: "All",
      healthStatus: "All",
      assetType: "All",
    });
    expect(restored?.sort).toEqual({ key: "name", direction: "desc" });
    expect(restored?.selectedAssetIds).toEqual(["GW-101"]);
    expect(restored?.taskQueue).toHaveLength(1);
    expect(restored?.taskQueue[0]?.id).toBe("t1");
    expect(restored?.healthOverrides).toEqual({ "GW-102": "Critical" });
    expect(restored?.userLogs).toEqual([]);
  });
});

describe("persistence — storage failures", () => {
  it("never throws when writing fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => savePersistedState(createInitialState())).not.toThrow();
  });

  it("returns null when reading fails", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("access denied");
    });
    expect(loadPersistedState()).toBeNull();
  });
});
