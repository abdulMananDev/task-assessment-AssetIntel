import type { Asset, MaintenanceLog } from "../types";

/**
 * Embedded dataset from the problem statement, typed as Asset[] so every
 * zone, type, and health status is compile-time checked against the
 * vocabulary unions in types.ts — a typo here fails the build.
 */
export const ASSETS: Asset[] = [
  { id: "GW-101", name: "Maple Canopy 1", type: "Tree", zone: "North Sector", healthStatus: "Healthy", lastInspected: "2023-10-12" },
  { id: "GW-102", name: "Oak Ridge Cluster", type: "Tree", zone: "North Sector", healthStatus: "Attention Required", lastInspected: "2023-09-28" },
  { id: "GW-103", name: "Central Plaza Fountain", type: "Fixture", zone: "Central Plaza", healthStatus: "Healthy", lastInspected: "2023-11-01" },
  { id: "GW-104", name: "Willow Brook Buffer", type: "Shrubbery", zone: "West Bank", healthStatus: "Critical", lastInspected: "2023-08-15" },
  { id: "GW-105", name: "Pine Grove Row", type: "Tree", zone: "East Park", healthStatus: "Healthy", lastInspected: "2023-10-05" },
  { id: "GW-106", name: "Bicycle Rack Alpha", type: "Fixture", zone: "Central Plaza", healthStatus: "Attention Required", lastInspected: "2023-07-20" },
  { id: "GW-107", name: "Cherry Blossom Alley", type: "Tree", zone: "North Sector", healthStatus: "Healthy", lastInspected: "2023-09-14" },
  { id: "GW-108", name: "Riverbank Reeds", type: "Shrubbery", zone: "West Bank", healthStatus: "Healthy", lastInspected: "2023-10-30" },
];

/** Seed maintenance logs so the detail drawer has history out of the box. */
export const SEED_LOGS: MaintenanceLog[] = [
  { id: "SL-GW-101-1", assetId: "GW-101", date: "2023-10-12T09:30:00.000Z", summary: "Routine inspection — canopy full, no pests or dieback observed.", source: "System" },
  { id: "SL-GW-101-2", assetId: "GW-101", date: "2023-05-18T14:00:00.000Z", summary: "Mulch ring refreshed and deep-watered during dry spell.", source: "System" },
  { id: "SL-GW-102-1", assetId: "GW-102", date: "2023-09-28T10:15:00.000Z", summary: "Inspection flagged early leaf discolouration; monitoring for chlorosis.", source: "System" },
  { id: "SL-GW-102-2", assetId: "GW-102", date: "2023-07-02T13:45:00.000Z", summary: "Soil samples taken around the root zone for nutrient analysis.", source: "System" },
  { id: "SL-GW-103-1", assetId: "GW-103", date: "2023-11-01T08:50:00.000Z", summary: "Pump and basin checked; fountain running within normal parameters.", source: "System" },
  { id: "SL-GW-103-2", assetId: "GW-103", date: "2023-04-11T11:20:00.000Z", summary: "Winter shroud removed and basin cleaned ahead of spring.", source: "System" },
  { id: "SL-GW-104-1", assetId: "GW-104", date: "2023-08-15T15:05:00.000Z", summary: "Severe dieback along the western buffer; immediate intervention requested.", source: "System" },
  { id: "SL-GW-104-2", assetId: "GW-104", date: "2023-06-20T09:40:00.000Z", summary: "Yellowing leaves and thinning growth recorded during walk-through.", source: "System" },
  { id: "SL-GW-105-1", assetId: "GW-105", date: "2023-10-05T10:00:00.000Z", summary: "Routine inspection — new growth healthy, no pest activity.", source: "System" },
  { id: "SL-GW-105-2", assetId: "GW-105", date: "2023-03-30T14:25:00.000Z", summary: "Deadwood cleared from lower branches.", source: "System" },
  { id: "SL-GW-106-1", assetId: "GW-106", date: "2023-07-20T16:10:00.000Z", summary: "Mounting bolts loosening; rack wobbles under load.", source: "System" },
  { id: "SL-GW-106-2", assetId: "GW-106", date: "2023-02-08T12:35:00.000Z", summary: "Surface rust treated and frame repainted.", source: "System" },
  { id: "SL-GW-107-1", assetId: "GW-107", date: "2023-09-14T09:05:00.000Z", summary: "Post-bloom assessment — branches healthy, no canker signs.", source: "System" },
  { id: "SL-GW-107-2", assetId: "GW-107", date: "2023-04-26T13:55:00.000Z", summary: "Spring fertiliser applied along the alley.", source: "System" },
  { id: "SL-GW-108-1", assetId: "GW-108", date: "2023-10-30T11:45:00.000Z", summary: "Routine inspection — reeds dense and establishing well.", source: "System" },
  { id: "SL-GW-108-2", assetId: "GW-108", date: "2023-05-05T15:30:00.000Z", summary: "Bank erosion check after heavy rains; no action needed.", source: "System" },
];

export const ASSET_IDS: ReadonlySet<string> = new Set(ASSETS.map((asset) => asset.id));

export const ASSETS_BY_ID: ReadonlyMap<string, Asset> = new Map(
  ASSETS.map((asset) => [asset.id, asset] as const),
);

export const SEED_LOG_IDS: ReadonlySet<string> = new Set(SEED_LOGS.map((log) => log.id));
