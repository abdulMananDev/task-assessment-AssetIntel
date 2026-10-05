import { describe, expect, it } from "vitest";
import { compareIds } from "../src/lib/compare";
import { selectLogsForAsset, selectVisibleAssets, sortAssets } from "../src/state/selectors";
import type { Asset, MaintenanceLog } from "../src/types";

function asset(overrides: Partial<Asset> & Pick<Asset, "id" | "name">): Asset {
  return {
    type: "Tree",
    zone: "North Sector",
    healthStatus: "Healthy",
    lastInspected: "2023-10-12",
    ...overrides,
  };
}

const FIXTURES: Asset[] = [
  asset({ id: "GW-100", name: "Birch pair", healthStatus: "Attention Required", lastInspected: "2023-10-01" }),
  asset({ id: "GW-101", name: "Maple Canopy 1", type: "Fixture", zone: "Central Plaza", lastInspected: "2023-11-01" }),
  asset({ id: "GW-9", name: "Alder row", type: "Shrubbery", healthStatus: "Critical", lastInspected: "2023-09-09" }),
];

const DEFAULT_FILTERS = {
  query: "",
  zone: "All" as const,
  healthStatus: "All" as const,
  assetType: "All" as const,
};

describe("selectVisibleAssets — filtering", () => {
  it("matches the query against name and id, case-insensitively", () => {
    const byName = selectVisibleAssets(FIXTURES, { ...DEFAULT_FILTERS, query: "maple" }, { key: "id", direction: "asc" });
    expect(byName.map((asset) => asset.id)).toEqual(["GW-101"]);

    const byId = selectVisibleAssets(FIXTURES, { ...DEFAULT_FILTERS, query: "gw-9" }, { key: "id", direction: "asc" });
    expect(byId.map((asset) => asset.id)).toEqual(["GW-9"]);
  });

  it("trims the query and returns nothing for non-matches", () => {
    const trimmed = selectVisibleAssets(FIXTURES, { ...DEFAULT_FILTERS, query: "  alder  " }, { key: "id", direction: "asc" });
    expect(trimmed.map((asset) => asset.id)).toEqual(["GW-9"]);

    const none = selectVisibleAssets(FIXTURES, { ...DEFAULT_FILTERS, query: "zzz" }, { key: "id", direction: "asc" });
    expect(none).toEqual([]);
  });

  it("combines filters with AND logic", () => {
    const state = {
      ...DEFAULT_FILTERS,
      zone: "North Sector" as const,
      healthStatus: "Critical" as const,
    };
    const result = selectVisibleAssets(FIXTURES, state, { key: "id", direction: "asc" });
    expect(result.map((asset) => asset.id)).toEqual(["GW-9"]);
  });
});

describe("selectVisibleAssets — sorting", () => {
  it("orders ids numerically, not lexicographically", () => {
    const asc = selectVisibleAssets(FIXTURES, DEFAULT_FILTERS, { key: "id", direction: "asc" });
    expect(asc.map((asset) => asset.id)).toEqual(["GW-9", "GW-100", "GW-101"]);
  });

  it("uses severity rank for health, not alphabetical order", () => {
    const asc = selectVisibleAssets(FIXTURES, DEFAULT_FILTERS, { key: "healthStatus", direction: "asc" });
    expect(asc.map((asset) => asset.healthStatus)).toEqual([
      "Healthy",
      "Attention Required",
      "Critical",
    ]);
  });

  it("sorts dates as strings and reverses on desc", () => {
    const asc = selectVisibleAssets(FIXTURES, DEFAULT_FILTERS, { key: "lastInspected", direction: "asc" });
    expect(asc.map((asset) => asset.id)).toEqual(["GW-9", "GW-100", "GW-101"]);

    const desc = selectVisibleAssets(FIXTURES, DEFAULT_FILTERS, { key: "lastInspected", direction: "desc" });
    expect(desc.map((asset) => asset.id)).toEqual(["GW-101", "GW-100", "GW-9"]);
  });

  it("breaks ties deterministically by id", () => {
    const tied = [
      asset({ id: "GW-102", name: "Alder row" }),
      asset({ id: "GW-9", name: "Alder row" }),
    ];
    const sorted = sortAssets(tied, { key: "name", direction: "asc" });
    expect(sorted.map((asset) => asset.id)).toEqual(["GW-9", "GW-102"]);
  });

  it("never mutates the input array", () => {
    const original = [...FIXTURES];
    sortAssets(FIXTURES, { key: "id", direction: "desc" });
    expect(FIXTURES).toEqual(original);
  });
});

describe("compareIds", () => {
  it("defines the stable numeric contract", () => {
    expect(compareIds("GW-9", "GW-100")).toBeLessThan(0);
    expect(compareIds("GW-100", "GW-101")).toBeLessThan(0);
    expect(compareIds("GW-101", "GW-100")).toBeGreaterThan(0);
    expect(compareIds("GW-101", "GW-101")).toBe(0);
  });
});

describe("selectLogsForAsset", () => {
  const logs: MaintenanceLog[] = [
    { id: "l1", assetId: "GW-101", date: "2026-01-01T00:00:00.000Z", summary: "older", source: "System" },
    { id: "l2", assetId: "GW-102", date: "2026-02-01T00:00:00.000Z", summary: "other asset", source: "System" },
    { id: "l3", assetId: "GW-101", date: "2026-03-01T00:00:00.000Z", summary: "newer", source: "Dispatcher" },
  ];

  it("filters to one asset, newest first", () => {
    const result = selectLogsForAsset(logs, "GW-101");
    expect(result.map((log) => log.id)).toEqual(["l3", "l1"]);
  });

  it("returns an empty array for assets without logs", () => {
    expect(selectLogsForAsset(logs, "GW-999")).toEqual([]);
  });
});
