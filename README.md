# Greenway Maintenance Planner

A responsive control center for urban greenway dispatchers to filter park assets, inspect their history, update health status, and plan weekly maintenance crews.

## Setup & Run

Requirements: Node.js 18+

    npm install
    npm run dev       # start dev server
    npm run build     # type-check + production build
    npm test          # run Vitest suite

Open the local URL printed by Vite. All data is local; no backend or environment variables are needed.

## Features

- Sortable asset table with search (name or ID) and Zone, Health and Type filters
- Inline health status control, also available in the detail drawer
- Detail drawer with metadata and a maintenance log timeline (Esc or backdrop to close, focus returns to the row)
- Multi-select and batch assignment to the next four weekly schedules
- Task queue grouped by week, with per-asset removal
- Filters, selections, health changes, logs and the queue persist across reloads
- Responsive layout and light/dark mode

## Decisions & Trade-offs

**Stack: React + TypeScript (strict) + Vite, CSS Modules with design tokens.** Typed data and actions caught several AI mistakes at compile time. CSS Modules keep styles scoped per component, and all colours come from tokens, so dark mode is a single override block.

**State: one useReducer in App, props passed down.** The app is small and the component tree is shallow, so a single predictable store with typed, exhaustive actions was enough. Context would remove some prop passing but hides data flow; I'd add it if the tree grew deeper. No Redux or Zustand, as 8 assets don't justify an external library.

**Pure reducer.** IDs and timestamps for log entries are generated when the action is dispatched, not inside the reducer, so the reducer is deterministic and easy to test.

**Visible rows are derived, not stored.** Filtering and sorting are pure selectors memoised with useMemo, so there is one source of truth and no stale copies when status or filters change.

**Fixed vocabulary for zones, types and statuses.** Defined as typed tuples rather than derived from the data, so a typo in the dataset fails at compile time instead of creating a fake filter option. Adding a zone is a one-line change.

**Sorting.** Health sorts by severity (Critical first or last), not alphabetically. IDs sort in natural order (GW-102 before GW-1010). Ties break by ID so the table order stays stable.

**Persistence: deltas only, versioned.** Only user changes (health overrides, logs, filters, selection, queue) are saved and merged over the dataset on load, so the dataset stays the source of truth. A versioned key with per-field validation means corrupt, old or foreign data falls back to defaults instead of crashing, and stale filters are dropped.

**Scheduling rules.** An asset can be scheduled in multiple weeks (e.g. an inspection, then a follow-up); only same-week duplicates are skipped and reported ("2 assigned, 1 already scheduled"). Assigned assets leave the selection after a batch. Assignments and removals are both written to the maintenance log for a full audit trail.

**Selections hidden by filters.** [Selected assets stay selected when filtered out, and the selection bar shows "N hidden by filters", so batch assign is never a surprise.]

**Colour has one meaning.** Green is reserved for health status; row hover and selection use neutral tokens.

**Maintenance logs are mocked.** The dataset has no logs, so seed entries are keyed by asset ID. In production these would load from an API when the drawer opens.

## What I Skipped

- **Map simulation.** The overview mentions map controls but the requirements don't, so I prioritised the required features. [A lightweight zone overview was / was not added.]
- **"Clear this week" action.** Only per-asset removal is implemented; a bulk clear wasn't required.
- **Backend and auth.** All state is local, per the brief.
- **Dev-time vocabulary check** that every zone in the list appears in the data.

## What I'd Do Next

- A real map (e.g. Leaflet) with asset markers and zone boundaries
- Fetch assets and logs from an API, with loading and error states
- "Clear this week" and drag-and-drop between weeks
- Virtualised table for thousands of assets
- End-to-end tests (Playwright) for the main dispatcher flows

## Working with the AI Assistant

I used the provided assistant (GLM 5.3 Flash in OpenCode) as a pair programmer, not an autopilot:

- **Plan first, then build.** I approved an architecture plan in Plan mode, then built step by step in Build mode, reviewing and committing after each step.
- **I set the constraints.** TypeScript instead of the proposed JS, derived rows instead of stored state, fixed vocabulary, deltas-only persistence and scheduling rules were my decisions.
- **I reviewed the output and corrected it.** For example, I caught that the reducer generated IDs and dates internally (impure), asked for per-asset removal when the queue only supported removing whole weeks, and requested natural ID sorting.
- **I fixed some UI issues myself.** I replaced a row hover colour that clashed with the "Healthy" status, and fixed dropdown options inheriting the pill colour.
- **I verified everything.** Type-check and build after each step, [Vitest tests for the reducer and selectors,] and a manual browser pass of every required flow.
- **Setup note.** The Windows install script failed (a `\bin` path was turned into a hidden backspace character), so I installed via the macOS script in Git Bash and reported the issue.
