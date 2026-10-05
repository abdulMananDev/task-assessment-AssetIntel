import { ASSETS } from "./assets";
import type { Asset } from "../types";

export function generateAssets(count: number): Asset[] {
  return Array.from({ length: count }, (_, i): Asset => {
    const base = ASSETS[i % ASSETS.length]!;
    return { ...base, id: `GW-${1000 + i}`, name: `${base.name} ${i + 1}` };
  });
}
