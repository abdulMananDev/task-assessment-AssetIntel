/**
 * Domain model for the greenway maintenance planner.
 *
 * Unions are derived from const tuples so the option lists used by UI
 * controls, the accepted values in state, and the localStorage validation
 * guards can never drift apart.
 */

export const HEALTH_STATUSES = ["Healthy", "Attention Required", "Critical"] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export const ASSET_TYPES = ["Tree", "Fixture", "Shrubbery"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const ZONES = ["North Sector", "Central Plaza", "West Bank", "East Park"] as const;
export type Zone = (typeof ZONES)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const SORT_KEYS = [
  "id",
  "name",
  "type",
  "zone",
  "healthStatus",
  "lastInspected",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const LOG_SOURCES = ["System", "Dispatcher"] as const;
export type LogSource = (typeof LOG_SOURCES)[number];

/** ISO date string, e.g. "2023-10-12". */
export type IsoDate = string;

/** ISO timestamp, e.g. "2026-10-05T14:30:00.000Z". */
export type IsoTimestamp = string;

/** Anchor date (a Monday, "YYYY-MM-DD") identifying one scheduling week. */
export type WeekAnchor = IsoDate;

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  zone: Zone;
  healthStatus: HealthStatus;
  lastInspected: IsoDate;
}

export interface MaintenanceLog {
  id: string;
  assetId: string;
  date: IsoTimestamp;
  summary: string;
  source: LogSource;
}

export interface TaskQueueEntry {
  id: string;
  assetIds: string[];
  week: WeekAnchor;
  createdAt: IsoTimestamp;
}

export type FilterField = "zone" | "healthStatus" | "assetType";

export interface Filters {
  query: string;
  zone: Zone | "All";
  healthStatus: HealthStatus | "All";
  assetType: AssetType | "All";
}

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

/** Outcome of a batch assignment, surfaced to the UI as feedback. */
export interface AssignmentResult {
  week: WeekAnchor;
  assignedCount: number;
  skippedCount: number;
  skippedAssetIds: string[];
  at: IsoTimestamp;
}

/**
 * Source-of-truth state only — filtered/sorted views are derived in
 * selectors, never stored here.
 */
export interface InventoryState {
  assets: Asset[];
  logs: MaintenanceLog[];
  filters: Filters;
  sort: SortState;
  /** IDs of assets ticked for batch scheduling. */
  selectedAssetIds: string[];
  /** Asset currently shown in the detail drawer, if any. */
  openAssetId: string | null;
  taskQueue: TaskQueueEntry[];
  /** Feedback from the most recent ASSIGN_TASKS, for the UI notice. */
  lastAssignmentResult: AssignmentResult | null;
}

/**
 * Discriminated union of every state transition. The reducer switches on
 * `type`, and exhaustive checking guarantees a new action cannot be added
 * without handling it.
 */
export type InventoryAction =
  | { type: "SET_QUERY"; query: string }
  | { type: "SET_FILTER"; field: "zone"; value: Zone | "All" }
  | { type: "SET_FILTER"; field: "healthStatus"; value: HealthStatus | "All" }
  | { type: "SET_FILTER"; field: "assetType"; value: AssetType | "All" }
  | { type: "CLEAR_FILTERS" }
  | { type: "SET_SORT"; key: SortKey }
  | { type: "TOGGLE_ASSET_SELECTION"; assetId: string }
  /** Toggle-all for the current visible set; dispatched with the memoized visible IDs. */
  | { type: "SELECT_VISIBLE_ASSETS"; assetIds: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "OPEN_ASSET"; assetId: string }
  | { type: "CLOSE_ASSET" }
  /** `log` is pre-generated at dispatch time so the reducer stays pure. */
  | {
      type: "SET_HEALTH_STATUS";
      assetId: string;
      healthStatus: HealthStatus;
      log: MaintenanceLog;
    }
  /**
   * Reducer skips assets already scheduled for this exact week. `logs`,
   * `dispatchedAt`, and `newEntryId` are generated at dispatch time so the
   * reducer never touches Date or crypto (StrictMode double-invokes it).
   */
  | {
      type: "ASSIGN_TASKS";
      assetIds: string[];
      week: WeekAnchor;
      dispatchedAt: IsoTimestamp;
      /** One candidate log per requested asset; only assigned ones are used. */
      logs: MaintenanceLog[];
      newEntryId: string;
    }
  /**
   * Per-asset removal from a scheduled week; the entry is pruned when its
   * last asset is removed. `log` is pre-generated at dispatch time.
   */
  | {
      type: "REMOVE_TASK_ASSET";
      taskId: string;
      assetId: string;
      log: MaintenanceLog;
    }
  | { type: "DISMISS_ASSIGNMENT_RESULT" }
  | { type: "RESET_STATE" };

/**
 * Deltas persisted to localStorage — the dataset itself is never stored.
 * Each field is validated independently on hydrate; an invalid field falls
 * back to its default alone instead of discarding the whole payload.
 */
export interface PersistedState {
  filters: Filters;
  sort: SortState;
  selectedAssetIds: string[];
  openAssetId: string | null;
  taskQueue: TaskQueueEntry[];
  healthOverrides: Partial<Record<string, HealthStatus>>;
  userLogs: MaintenanceLog[];
}

export interface PersistedEnvelope {
  version: number;
  savedAt: IsoTimestamp;
  state: PersistedState;
}
