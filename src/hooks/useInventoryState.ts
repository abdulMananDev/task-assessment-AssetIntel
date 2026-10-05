import { useEffect, useReducer, type Dispatch } from "react";
import { createInitialState, inventoryReducer } from "../state/inventoryReducer";
import { loadPersistedState, savePersistedState } from "../state/persistence";
import type { InventoryAction, InventoryState, MaintenanceLog } from "../types";

/** User logs first, then seeds; deduped by id, newest first. */
function mergeLogs(
  seedLogs: readonly MaintenanceLog[],
  userLogs: readonly MaintenanceLog[],
): MaintenanceLog[] {
  const seen = new Set<string>();
  const merged: MaintenanceLog[] = [];
  for (const log of [...userLogs, ...seedLogs]) {
    if (seen.has(log.id)) continue;
    seen.add(log.id);
    merged.push(log);
  }
  return merged.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Rebuilds full state from validated deltas. Health overrides are applied
 * over the pristine dataset, which stays the source of truth.
 */
function hydrateInitialState(): InventoryState {
  const base = createInitialState();
  const persisted = loadPersistedState();
  if (persisted === null) return base;

  const assets = base.assets.map((asset) => {
    const override = persisted.healthOverrides[asset.id];
    return override === undefined ? asset : { ...asset, healthStatus: override };
  });

  return {
    ...base,
    assets,
    logs: mergeLogs(base.logs, persisted.userLogs),
    filters: persisted.filters,
    sort: persisted.sort,
    selectedAssetIds: persisted.selectedAssetIds,
    openAssetId: persisted.openAssetId,
    taskQueue: persisted.taskQueue,
  };
}

/**
 * Single source of app state: reducer-driven, hydrated from localStorage
 * once on first render and persisted on every change.
 */
export function useInventoryState(): [InventoryState, Dispatch<InventoryAction>] {
  const [state, dispatch] = useReducer(
    inventoryReducer,
    undefined,
    hydrateInitialState,
  );

  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  return [state, dispatch];
}
