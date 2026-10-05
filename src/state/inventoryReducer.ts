import { SEED_LOGS } from "../data/assets";
import type {
  AssignmentResult,
  Filters,
  InventoryAction,
  InventoryState,
  MaintenanceLog,
  SortKey,
  SortState,
} from "../types";
import { addToWeek, partitionAssignment } from "./assignments";
import { DEFAULT_DIRECTIONS, DEFAULT_FILTERS, DEFAULT_SORT } from "./defaults";
import { INITIAL_ASSETS } from "../data/initialAssets";
export function createInitialState(): InventoryState {
  return {
    assets: [...INITIAL_ASSETS],
    logs: SEED_LOGS,
    filters: DEFAULT_FILTERS,
    sort: DEFAULT_SORT,
    selectedAssetIds: [],
    openAssetId: null,
    taskQueue: [],
    lastAssignmentResult: null,
  };
}

/** Correlates field and value via the discriminated SET_FILTER variants. */
function applyFilter(
  filters: Filters,
  action: Extract<InventoryAction, { type: "SET_FILTER" }>,
): Filters {
  switch (action.field) {
    case "zone":
      return { ...filters, zone: action.value };
    case "healthStatus":
      return { ...filters, healthStatus: action.value };
    case "assetType":
      return { ...filters, assetType: action.value };
  }
}

function toggleSort(sort: SortState, key: SortKey): SortState {
  if (sort.key === key) {
    return { key, direction: sort.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: DEFAULT_DIRECTIONS[key] };
}

/**
 * Pure state transition: every ID and timestamp arrives inside the action
 * (see state/actions.ts), so double invocation yields identical state.
 */
export function inventoryReducer(
  state: InventoryState,
  action: InventoryAction,
): InventoryState {
  switch (action.type) {
    case "SET_QUERY":
      return { ...state, filters: { ...state.filters, query: action.query } };

    case "SET_FILTER":
      return { ...state, filters: applyFilter(state.filters, action) };

    case "CLEAR_FILTERS":
      return { ...state, filters: DEFAULT_FILTERS };

    case "SET_SORT":
      return { ...state, sort: toggleSort(state.sort, action.key) };

    case "TOGGLE_ASSET_SELECTION": {
      const selectedAssetIds = state.selectedAssetIds.includes(action.assetId)
        ? state.selectedAssetIds.filter((id) => id !== action.assetId)
        : [...state.selectedAssetIds, action.assetId];
      return { ...state, selectedAssetIds };
    }

    case "SELECT_VISIBLE_ASSETS": {
      const incoming = new Set(action.assetIds);
      const allSelected = action.assetIds.every((id) =>
        state.selectedAssetIds.includes(id),
      );
      const selectedAssetIds = allSelected
        ? state.selectedAssetIds.filter((id) => !incoming.has(id))
        : [...new Set([...state.selectedAssetIds, ...action.assetIds])];
      return { ...state, selectedAssetIds };
    }

    case "CLEAR_SELECTION":
      return { ...state, selectedAssetIds: [] };

    case "OPEN_ASSET": {
      const exists = state.assets.some((asset) => asset.id === action.assetId);
      return exists ? { ...state, openAssetId: action.assetId } : state;
    }

    case "CLOSE_ASSET":
      return { ...state, openAssetId: null };

    case "SET_HEALTH_STATUS": {
      const asset = state.assets.find(
        (candidate) => candidate.id === action.assetId,
      );
      if (asset === undefined || asset.healthStatus === action.healthStatus) {
        return state;
      }
      const assets = state.assets.map((candidate) =>
        candidate.id === action.assetId
          ? { ...candidate, healthStatus: action.healthStatus }
          : candidate,
      );
      return { ...state, assets, logs: [action.log, ...state.logs] };
    }

    case "ASSIGN_TASKS": {
      const knownIds = new Set(state.assets.map((asset) => asset.id));
      const requested = action.assetIds.filter((id) => knownIds.has(id));
      const { assignable, skippedAssetIds } = partitionAssignment(
        requested,
        state.taskQueue,
        action.week,
      );
      if (assignable.length === 0 && skippedAssetIds.length === 0) return state;

      const logByAssetId = new Map(
        action.logs.map((log) => [log.assetId, log]),
      );
      const newLogs = assignable
        .map((assetId) => logByAssetId.get(assetId))
        .filter((log): log is MaintenanceLog => log !== undefined);

      const taskQueue = addToWeek(state.taskQueue, action.week, assignable, {
        id: action.newEntryId,
        createdAt: action.dispatchedAt,
      });
      const assignedSet = new Set(assignable);
      const selectedAssetIds = state.selectedAssetIds.filter(
        (id) => !assignedSet.has(id),
      );
      const result: AssignmentResult = {
        week: action.week,
        assignedCount: assignable.length,
        skippedCount: skippedAssetIds.length,
        skippedAssetIds,
        at: action.dispatchedAt,
      };
      return {
        ...state,
        taskQueue,
        logs: [...newLogs, ...state.logs],
        selectedAssetIds,
        lastAssignmentResult: result,
      };
    }

    case "REMOVE_TASK_ASSET": {
      const entry = state.taskQueue.find(
        (candidate) => candidate.id === action.taskId,
      );
      if (entry === undefined || !entry.assetIds.includes(action.assetId)) {
        return state;
      }
      const assetIds = entry.assetIds.filter((id) => id !== action.assetId);
      const taskQueue =
        assetIds.length === 0
          ? state.taskQueue.filter(
              (candidate) => candidate.id !== action.taskId,
            )
          : state.taskQueue.map((candidate) =>
              candidate.id === action.taskId
                ? { ...candidate, assetIds }
                : candidate,
            );
      return { ...state, taskQueue, logs: [action.log, ...state.logs] };
    }

    case "DISMISS_ASSIGNMENT_RESULT":
      return { ...state, lastAssignmentResult: null };

    case "RESET_STATE":
      return createInitialState();

    default: {
      action satisfies never;
      return state;
    }
  }
}
