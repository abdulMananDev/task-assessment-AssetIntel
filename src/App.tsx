import { useCallback, useMemo } from "react";
import { AssetTable } from "./components/AssetTable";
import { DetailDrawer } from "./components/DetailDrawer";
import { SelectionBar } from "./components/SelectionBar";
import { TaskQueuePanel } from "./components/TaskQueuePanel";
import { Toolbar } from "./components/Toolbar";
import { useInventoryState } from "./hooks/useInventoryState";
import { createSetHealthStatusAction } from "./state/actions";
import { selectLogsForAsset, selectVisibleAssets } from "./state/selectors";
import type { HealthStatus } from "./types";
import styles from "./App.module.css";

export default function App() {
  const [state, dispatch] = useInventoryState();

  const visibleAssets = useMemo(
    () => selectVisibleAssets(state.assets, state.filters, state.sort),
    [state.assets, state.filters, state.sort],
  );

  const openAsset = useMemo(
    () => state.assets.find((asset) => asset.id === state.openAssetId) ?? null,
    [state.assets, state.openAssetId],
  );

  const openAssetLogs = useMemo(
    () => (openAsset === null ? [] : selectLogsForAsset(state.logs, openAsset.id)),
    [state.logs, openAsset],
  );

  const handleStatusChange = useCallback(
    (assetId: string, next: HealthStatus) => {
      dispatch(createSetHealthStatusAction(assetId, next));
    },
    [dispatch],
  );

  const handleCloseDrawer = useCallback(() => {
    dispatch({ type: "CLOSE_ASSET" });
  }, [dispatch]);

  const drawerOpen = state.openAssetId !== null;

  return (
    <>
      <div className={styles.page} inert={drawerOpen || undefined}>
        <header className={styles.header}>
          <h1 className={styles.title}>Greenway Maintenance Planner</h1>
          <p className={styles.subtitle}>
            Filter the inventory, inspect assets, and dispatch weekly crews.
          </p>
        </header>

        <main className={styles.main}>
          <Toolbar filters={state.filters} dispatch={dispatch} />
          <SelectionBar
            selectedAssetIds={state.selectedAssetIds}
            result={state.lastAssignmentResult}
            dispatch={dispatch}
          />
          <p className={styles.count} aria-live="polite">
            Showing {visibleAssets.length} of {state.assets.length} assets
          </p>
          <div className={styles.content}>
            <AssetTable
              assets={visibleAssets}
              sort={state.sort}
              selectedAssetIds={state.selectedAssetIds}
              dispatch={dispatch}
              onStatusChange={handleStatusChange}
            />
            <TaskQueuePanel
              taskQueue={state.taskQueue}
              assets={state.assets}
              dispatch={dispatch}
            />
          </div>
        </main>
      </div>

      <DetailDrawer
        open={drawerOpen}
        asset={openAsset}
        logs={openAssetLogs}
        onClose={handleCloseDrawer}
        onStatusChange={handleStatusChange}
      />
    </>
  );
}
