import { formatWeekLabel } from "../data/schedule";
import { createId } from "../lib/id";
import type {
  HealthStatus,
  InventoryAction,
  IsoTimestamp,
  MaintenanceLog,
  WeekAnchor,
} from "../types";

const now = (): IsoTimestamp => new Date().toISOString();

/**
 * Dispatch-time creators for actions that carry generated values. Calling
 * Date/crypto here — in the event handler — keeps the reducer pure, so
 * StrictMode double-invocation produces identical state.
 */

export function createSetHealthStatusAction(
  assetId: string,
  healthStatus: HealthStatus,
): InventoryAction {
  return {
    type: "SET_HEALTH_STATUS",
    assetId,
    healthStatus,
    log: {
      id: createId(),
      assetId,
      date: now(),
      summary: `Health status changed to "${healthStatus}".`,
      source: "Dispatcher",
    },
  };
}

export function createAssignTasksAction(
  assetIds: readonly string[],
  week: WeekAnchor,
): InventoryAction {
  const dispatchedAt = now();
  return {
    type: "ASSIGN_TASKS",
    assetIds: [...assetIds],
    week,
    dispatchedAt,
    logs: assetIds.map(
      (assetId): MaintenanceLog => ({
        id: createId(),
        assetId,
        date: dispatchedAt,
        summary: `Scheduled for ${formatWeekLabel(week)}.`,
        source: "Dispatcher",
      }),
    ),
    newEntryId: createId(),
  };
}

export function createRemoveTaskAssetAction(
  taskId: string,
  assetId: string,
  week: WeekAnchor,
): InventoryAction {
  return {
    type: "REMOVE_TASK_ASSET",
    taskId,
    assetId,
    log: {
      id: createId(),
      assetId,
      date: now(),
      summary: `Removed from ${formatWeekLabel(week)}.`,
      source: "Dispatcher",
    },
  };
}
