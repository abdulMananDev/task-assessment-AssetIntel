import type { Dispatch } from "react";
import { isOneOf } from "../../lib/guards";
import {
  ASSET_TYPES,
  HEALTH_STATUSES,
  ZONES,
  type Filters,
  type InventoryAction,
} from "../../types";
import styles from "./Toolbar.module.css";

interface ToolbarProps {
  filters: Filters;
  dispatch: Dispatch<InventoryAction>;
}

export function Toolbar({ filters, dispatch }: ToolbarProps) {
  const hasActiveFilters =
    filters.query !== "" ||
    filters.zone !== "All" ||
    filters.healthStatus !== "All" ||
    filters.assetType !== "All";

  return (
    <section className={styles.toolbar} aria-label="Search and filters">
      <input
        type="search"
        className={styles.search}
        value={filters.query}
        onChange={(event) =>
          dispatch({ type: "SET_QUERY", query: event.target.value })
        }
        placeholder="Search by name or ID"
        aria-label="Search assets by name or ID"
      />
      <div className={styles.controls}>
        <select
          className={styles.select}
          value={filters.zone}
          aria-label="Filter by zone"
          onChange={(event) => {
            const value = event.target.value;
            if (value === "All" || isOneOf(ZONES, value)) {
              dispatch({ type: "SET_FILTER", field: "zone", value });
            }
          }}
        >
          <option value="All">All zones</option>
          {ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.healthStatus}
          aria-label="Filter by health status"
          onChange={(event) => {
            const value = event.target.value;
            if (value === "All" || isOneOf(HEALTH_STATUSES, value)) {
              dispatch({ type: "SET_FILTER", field: "healthStatus", value });
            }
          }}
        >
          <option value="All">All statuses</option>
          {HEALTH_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className={styles.select}
          value={filters.assetType}
          aria-label="Filter by asset type"
          onChange={(event) => {
            const value = event.target.value;
            if (value === "All" || isOneOf(ASSET_TYPES, value)) {
              dispatch({ type: "SET_FILTER", field: "assetType", value });
            }
          }}
        >
          <option value="All">All types</option>
          {ASSET_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => dispatch({ type: "CLEAR_FILTERS" })}
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
