import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type MouseEvent,
} from "react";
import { formatDate } from "../../lib/format";
import { cx } from "../../lib/cx";
import type {
  Asset,
  HealthStatus,
  InventoryAction,
  SortKey,
  SortState,
} from "../../types";
import { EmptyState } from "../EmptyState";
import { StatusControl } from "../StatusControl";
import styles from "./AssetTable.module.css";

const SORT_LABELS: Record<SortKey, string> = {
  id: "ID",
  name: "Name",
  type: "Type",
  zone: "Zone",
  healthStatus: "Health",
  lastInspected: "Last inspected",
};

interface SortHeaderCellProps {
  sortKey: SortKey;
  sort: SortState;
  dispatch: Dispatch<InventoryAction>;
}

function SortHeaderCell({ sortKey, sort, dispatch }: SortHeaderCellProps) {
  const active = sort.key === sortKey;
  return (
    <th
      scope="col"
      className={styles.th}
      aria-sort={
        active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
      }
    >
      <button
        type="button"
        className={styles.sortButton}
        onClick={() => dispatch({ type: "SET_SORT", key: sortKey })}
      >
        {SORT_LABELS[sortKey]}
        <span className={styles.sortIcon} aria-hidden="true">
          {active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}

interface AssetTableProps {
  assets: Asset[];
  sort: SortState;
  selectedAssetIds: string[];
  dispatch: Dispatch<InventoryAction>;
  onStatusChange: (assetId: string, next: HealthStatus) => void;
}

export function AssetTable({
  assets,
  sort,
  selectedAssetIds,
  dispatch,
  onStatusChange,
}: AssetTableProps) {
  const selectedSet = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds]);
  const allVisibleSelected =
    assets.length > 0 && assets.every((asset) => selectedSet.has(asset.id));
  const someVisibleSelected = assets.some((asset) => selectedSet.has(asset.id));
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (headerCheckboxRef.current !== null) {
      headerCheckboxRef.current.indeterminate =
        someVisibleSelected && !allVisibleSelected;
    }
  }, [someVisibleSelected, allVisibleSelected]);

  if (assets.length === 0) {
    return (
      <EmptyState
        title="No assets match your filters"
        hint="Try a different search term, or reset the filters to see the full inventory."
        action={
          <button
            type="button"
            className={styles.resetButton}
            onClick={() => dispatch({ type: "CLEAR_FILTERS" })}
          >
            Clear filters
          </button>
        }
      />
    );
  }

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, assetId: string) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, label, a")) return;
    dispatch({ type: "OPEN_ASSET", assetId });
  };

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={cx(styles.th, styles.checkboxColumn)}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                className={styles.checkbox}
                checked={allVisibleSelected}
                onChange={() =>
                  dispatch({
                    type: "SELECT_VISIBLE_ASSETS",
                    assetIds: assets.map((asset) => asset.id),
                  })
                }
                aria-label="Select all visible assets"
              />
            </th>
            <SortHeaderCell sortKey="id" sort={sort} dispatch={dispatch} />
            <SortHeaderCell sortKey="name" sort={sort} dispatch={dispatch} />
            <SortHeaderCell sortKey="type" sort={sort} dispatch={dispatch} />
            <SortHeaderCell sortKey="zone" sort={sort} dispatch={dispatch} />
            <SortHeaderCell sortKey="healthStatus" sort={sort} dispatch={dispatch} />
            <SortHeaderCell sortKey="lastInspected" sort={sort} dispatch={dispatch} />
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              className={styles.row}
              onClick={(event) => handleRowClick(event, asset.id)}
            >
              <td className={styles.td}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedSet.has(asset.id)}
                  onChange={() =>
                    dispatch({ type: "TOGGLE_ASSET_SELECTION", assetId: asset.id })
                  }
                  aria-label={`Select ${asset.name} for scheduling`}
                />
              </td>
              <td className={cx(styles.td, styles.idCell)}>{asset.id}</td>
              <td className={styles.td}>
                {/* Focus-return target when the drawer closes (see DetailDrawer). */}
                <button
                  type="button"
                  id={`open-asset-${asset.id}`}
                  className={styles.nameButton}
                  onClick={() => dispatch({ type: "OPEN_ASSET", assetId: asset.id })}
                >
                  {asset.name}
                </button>
              </td>
              <td className={cx(styles.td, styles.muted)}>{asset.type}</td>
              <td className={cx(styles.td, styles.muted)}>{asset.zone}</td>
              <td className={styles.td}>
                <StatusControl
                  assetId={asset.id}
                  value={asset.healthStatus}
                  onStatusChange={onStatusChange}
                />
              </td>
              <td className={cx(styles.td, styles.muted)}>
                {formatDate(asset.lastInspected)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
