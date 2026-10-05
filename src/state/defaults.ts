import type { Filters, SortDirection, SortKey, SortState } from "../types";

export const DEFAULT_FILTERS: Filters = {
  query: "",
  zone: "All",
  healthStatus: "All",
  assetType: "All",
};

export const DEFAULT_SORT: SortState = { key: "id", direction: "asc" };

/** First click on a column header lands on the most useful direction. */
export const DEFAULT_DIRECTIONS: Record<SortKey, SortDirection> = {
  id: "asc",
  name: "asc",
  type: "asc",
  zone: "asc",
  healthStatus: "desc",
  lastInspected: "desc",
};
