import { useEffect, useState, type Dispatch } from "react";
import { formatWeekLabel, getUpcomingWeeks } from "../../data/schedule";
import { cx } from "../../lib/cx";
import { createAssignTasksAction } from "../../state/actions";
import type { AssignmentResult, InventoryAction } from "../../types";
import styles from "./SelectionBar.module.css";

interface SelectionBarProps {
  selectedAssetIds: string[];
  result: AssignmentResult | null;
  dispatch: Dispatch<InventoryAction>;
}

const RESULT_VISIBLE_MS = 5000;

export function SelectionBar({ selectedAssetIds, result, dispatch }: SelectionBarProps) {
  const weeks = getUpcomingWeeks();
  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(weeks[0]);

  useEffect(() => {
    if (result === null) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "DISMISS_ASSIGNMENT_RESULT" }),
      RESULT_VISIBLE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [result, dispatch]);

  if (selectedAssetIds.length === 0 && result === null) return null;

  const handleAssign = () => {
    if (selectedWeek === undefined || selectedAssetIds.length === 0) return;
    dispatch(createAssignTasksAction(selectedAssetIds, selectedWeek));
  };

  const resultMessage =
    result === null
      ? null
      : result.assignedCount === 0
        ? `All ${result.skippedCount} selected assets are already scheduled for ${formatWeekLabel(result.week)}`
        : `Assigned ${result.assignedCount} to ${formatWeekLabel(result.week)}${
            result.skippedCount > 0
              ? ` · ${result.skippedCount} skipped — already scheduled`
              : ""
          }`;

  return (
    <section className={styles.bar} aria-label="Batch scheduling">
      {resultMessage !== null && (
        <p className={styles.notice} role="status">
          <span>{resultMessage}</span>
          <button
            type="button"
            className={styles.dismissButton}
            aria-label="Dismiss notification"
            onClick={() => dispatch({ type: "DISMISS_ASSIGNMENT_RESULT" })}
          >
            ✕
          </button>
        </p>
      )}

      {selectedAssetIds.length > 0 && (
        <div className={styles.controls}>
          <span className={styles.countLabel}>
            {selectedAssetIds.length} selected
          </span>
          <select
            className={styles.weekSelect}
            value={selectedWeek ?? ""}
            aria-label="Assign to week"
            onChange={(event) => setSelectedWeek(event.target.value)}
          >
            {weeks.map((week) => (
              <option key={week} value={week}>
                {formatWeekLabel(week)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cx(styles.button, styles.assignButton)}
            onClick={handleAssign}
          >
            Assign
          </button>
          <button
            type="button"
            className={cx(styles.button, styles.clearButton)}
            onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
          >
            Clear
          </button>
        </div>
      )}
    </section>
  );
}
