import { useMemo, type Dispatch } from "react";
import { formatWeekLabel } from "../../data/schedule";
import { createRemoveTaskAssetAction } from "../../state/actions";
import type { Asset, InventoryAction, TaskQueueEntry } from "../../types";
import styles from "./TaskQueuePanel.module.css";

interface TaskQueuePanelProps {
  taskQueue: TaskQueueEntry[];
  assets: Asset[];
  dispatch: Dispatch<InventoryAction>;
}

export function TaskQueuePanel({ taskQueue, assets, dispatch }: TaskQueuePanelProps) {
  const assetsById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset] as const)),
    [assets],
  );
  const entries = useMemo(
    () => [...taskQueue].sort((a, b) => a.week.localeCompare(b.week)),
    [taskQueue],
  );
  const totalScheduled = entries.reduce((sum, entry) => sum + entry.assetIds.length, 0);

  return (
    <section className={styles.panel} aria-label="Maintenance queue">
      <header className={styles.header}>
        <h2 className={styles.title}>Maintenance queue</h2>
        <span className={styles.total}>
          {totalScheduled} scheduled
        </span>
      </header>

      {entries.length === 0 ? (
        <p className={styles.empty}>
          Nothing scheduled yet. Select assets in the table and assign them to a
          week.
        </p>
      ) : (
        <ul className={styles.entryList}>
          {entries.map((entry) => (
            <li key={entry.id} className={styles.entry}>
              <p className={styles.week}>{formatWeekLabel(entry.week)}</p>
              <ul className={styles.assetList}>
                {entry.assetIds.map((assetId) => {
                  const asset = assetsById.get(assetId);
                  if (asset === undefined) return null;
                  return (
                    <li key={assetId} className={styles.assetRow}>
                      <span className={styles.assetName}>{asset.name}</span>
                      <button
                        type="button"
                        className={styles.removeButton}
                        aria-label={`Remove ${asset.name} from ${formatWeekLabel(entry.week)}`}
                        onClick={() =>
                          dispatch(
                            createRemoveTaskAssetAction(entry.id, assetId, entry.week),
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
