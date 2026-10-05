import { ASSETS } from "./assets";
import { generateAssets } from "./generateAssets";
import type { Asset } from "../types";

function getInitialAssets(): readonly Asset[] {
  if (!import.meta.env.DEV) return ASSETS;
  const rows = Number(new URLSearchParams(window.location.search).get("rows"));
  return rows > 0 ? generateAssets(rows) : ASSETS;
}

export const INITIAL_ASSETS = getInitialAssets();
