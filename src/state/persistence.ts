import { ASSETS_BY_ID, ASSET_IDS, SEED_LOG_IDS } from "../data/assets";
import {
  ASSET_TYPES,
  HEALTH_STATUSES,
  LOG_SOURCES,
  SORT_DIRECTIONS,
  SORT_KEYS,
  ZONES,
  type Filters,
  type HealthStatus,
  type InventoryState,
  type MaintenanceLog,
  type PersistedEnvelope,
  type PersistedState,
  type SortState,
  type TaskQueueEntry,
} from "../types";
import { isOneOf } from "../lib/guards";
import { DEFAULT_FILTERS, DEFAULT_SORT } from "./defaults";

export const STORAGE_KEY = "greenway-planner:v1";
export const STORAGE_VERSION = 1;

const isString = (value: unknown): value is string => typeof value === "string";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (value: unknown): value is string =>
  isString(value) && ISO_DATE_PATTERN.test(value);

/**
 * Reads the persisted payload. Every failure path — storage unavailable,
 * corrupt JSON, unknown version, bad fields — degrades to defaults instead
 * of throwing.
 */
export function loadPersistedState(): PersistedState | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return validatePersistedState(parsed);
}

/** Best-effort write; quota errors and blocked storage are silently ignored. */
export function savePersistedState(state: InventoryState): void {
  try {
    const healthOverrides: Record<string, HealthStatus> = {};
    for (const asset of state.assets) {
      const baseline = ASSETS_BY_ID.get(asset.id);
      if (baseline !== undefined && baseline.healthStatus !== asset.healthStatus) {
        healthOverrides[asset.id] = asset.healthStatus;
      }
    }
    const envelope: PersistedEnvelope = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      state: {
        filters: state.filters,
        sort: state.sort,
        selectedAssetIds: state.selectedAssetIds,
        openAssetId: state.openAssetId,
        taskQueue: state.taskQueue,
        healthOverrides,
        userLogs: state.logs.filter((log) => !SEED_LOG_IDS.has(log.id)),
      },
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Persistence is best-effort; the app keeps working without it.
  }
}

function validatePersistedState(parsed: unknown): PersistedState | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const envelope = parsed as Record<string, unknown>;
  if (envelope.version !== STORAGE_VERSION) return null;

  const raw = envelope.state;
  if (typeof raw !== "object" || raw === null) return null;
  const fields = raw as Record<string, unknown>;

  return {
    filters: validateFilters(fields.filters) ?? DEFAULT_FILTERS,
    sort: validateSort(fields.sort) ?? DEFAULT_SORT,
    selectedAssetIds: validateAssetIdList(fields.selectedAssetIds) ?? [],
    openAssetId: validateOpenAsset(fields.openAssetId),
    taskQueue: validateTaskQueue(fields.taskQueue) ?? [],
    healthOverrides: validateHealthOverrides(fields.healthOverrides) ?? {},
    userLogs: validateLogs(fields.userLogs) ?? [],
  };
}

function pickWithAll<T extends string>(
  values: readonly T[],
  raw: unknown,
): T | "All" | null {
  if (raw === "All") return "All";
  return isOneOf(values, raw) ? raw : null;
}

function validateFilters(value: unknown): Filters | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!isString(raw.query)) return null;

  const zone = pickWithAll(ZONES, raw.zone);
  const healthStatus = pickWithAll(HEALTH_STATUSES, raw.healthStatus);
  const assetType = pickWithAll(ASSET_TYPES, raw.assetType);
  if (zone === null || healthStatus === null || assetType === null) return null;

  return { query: raw.query, zone, healthStatus, assetType };
}

function validateSort(value: unknown): SortState | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!isOneOf(SORT_KEYS, raw.key) || !isOneOf(SORT_DIRECTIONS, raw.direction)) {
    return null;
  }
  return { key: raw.key, direction: raw.direction };
}

/** Known asset IDs only, deduplicated; null when the value is not an array. */
function validateAssetIdList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return [
    ...new Set(value.filter((id): id is string => isString(id) && ASSET_IDS.has(id))),
  ];
}

function validateOpenAsset(value: unknown): string | null {
  return isString(value) && ASSET_IDS.has(value) ? value : null;
}

function validateTaskQueue(value: unknown): TaskQueueEntry[] | null {
  if (!Array.isArray(value)) return null;
  const entries: TaskQueueEntry[] = [];
  const seenWeeks = new Set<string>();
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Record<string, unknown>;
    if (!isString(raw.id) || !isIsoDate(raw.week) || seenWeeks.has(raw.week)) continue;
    const assetIds = validateAssetIdList(raw.assetIds);
    if (assetIds === null || assetIds.length === 0 || !isString(raw.createdAt)) continue;
    seenWeeks.add(raw.week);
    entries.push({ id: raw.id, assetIds, week: raw.week, createdAt: raw.createdAt });
  }
  return entries;
}

function validateHealthOverrides(
  value: unknown,
): Partial<Record<string, HealthStatus>> | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const overrides: Partial<Record<string, HealthStatus>> = {};
  for (const [assetId, status] of Object.entries(raw)) {
    if (ASSET_IDS.has(assetId) && isOneOf(HEALTH_STATUSES, status)) {
      overrides[assetId] = status;
    }
  }
  return overrides;
}

function validateLogs(value: unknown): MaintenanceLog[] | null {
  if (!Array.isArray(value)) return null;
  const logs: MaintenanceLog[] = [];
  const seenIds = new Set<string>();
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Record<string, unknown>;
    if (
      !isString(raw.id) ||
      !isString(raw.assetId) ||
      !ASSET_IDS.has(raw.assetId) ||
      !isString(raw.date) ||
      !isString(raw.summary) ||
      !isOneOf(LOG_SOURCES, raw.source) ||
      seenIds.has(raw.id)
    ) {
      continue;
    }
    seenIds.add(raw.id);
    logs.push({
      id: raw.id,
      assetId: raw.assetId,
      date: raw.date,
      summary: raw.summary,
      source: raw.source,
    });
  }
  return logs;
}
