/**
 * Natural ordering for asset IDs: GW-9 → GW-100 → GW-101 → GW-102.
 * Numeric collation, locale-independent — the stable contract tests rely on.
 */
export function compareIds(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}
