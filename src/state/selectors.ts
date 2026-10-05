import { compareIds } from "../lib/compare";
import type {
  Asset,
  Filters,
  HealthStatus,
  MaintenanceLog,
  SortKey,
  SortState,
} from "../types";

/** Severity order so health sorting is operational, not alphabetical. */
const HEALTH_RANK: Record<HealthStatus, number> = {
  Healthy: 0,
  "Attention Required": 1,
  Critical: 2,
};

function matchesQuery(asset: Asset, query: string): boolean {
  return (
    asset.name.toLowerCase().includes(query) ||
    asset.id.toLowerCase().includes(query)
  );
}

export function filterAssets(
  assets: readonly Asset[],
  filters: Filters,
): Asset[] {
  const query = filters.query.trim().toLowerCase();
  return assets.filter((asset) => {
    if (filters.zone !== "All" && asset.zone !== filters.zone) return false;
    if (
      filters.healthStatus !== "All" &&
      asset.healthStatus !== filters.healthStatus
    )
      return false;
    if (filters.assetType !== "All" && asset.type !== filters.assetType)
      return false;
    if (query !== "" && !matchesQuery(asset, query)) return false;
    return true;
  });
}

function compareBySortKey(a: Asset, b: Asset, key: SortKey): number {
  switch (key) {
    case "id":
      return compareIds(a.id, b.id);
    case "name":
      return a.name.localeCompare(b.name);
    case "type":
      return a.type.localeCompare(b.type);
    case "zone":
      return a.zone.localeCompare(b.zone);
    case "healthStatus":
      return HEALTH_RANK[a.healthStatus] - HEALTH_RANK[b.healthStatus];
    case "lastInspected":
      return a.lastInspected.localeCompare(b.lastInspected);
  }
}

export function sortAssets(assets: readonly Asset[], sort: SortState): Asset[] {
  return [...assets].sort((a, b) => {
    const primary = compareBySortKey(a, b, sort.key);
    const ordered = sort.direction === "asc" ? primary : -primary;
    return ordered !== 0 ? ordered : compareIds(a.id, b.id);
  });
}

/**
 * Pure derivation of the table view. Memoized with useMemo at the call
 * site — the filtered list is never stored in state.
 */
export function selectVisibleAssets(
  assets: readonly Asset[],
  filters: Filters,
  sort: SortState,
): Asset[] {
  return sortAssets(filterAssets(assets, filters), sort);
}

/** Logs for one asset, newest first, ready for the drawer timeline. */
export function selectLogsForAsset(
  logs: readonly MaintenanceLog[],
  assetId: string,
): MaintenanceLog[] {
  return logs
    .filter((log) => log.assetId === assetId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
