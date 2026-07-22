---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "31"
subsystem: runtime-workspace-wiring
tags: [runtime-supervisor, pnpm, typescript-project-references, public-boundaries]

requires:
  - phase: 259-25
    provides: Public package-free @cowards/runtime-supervisor contract and project registration
provides:
  - Explicit public runtime-supervisor dependencies for TypeScript, Python, and WASM/WASI adapters
  - TypeScript project ordering from every counted runtime to spec and supervisor
  - One offline-generated frozen workspace lock after all consumer manifests were complete
affects: [259-10, 259-11, 259-12, runtime-adapters, conformance-execution]

tech-stack:
  added: []
  patterns:
    - counted runtime packages depend on public workspace entrypoints only
    - one final offline lockfile closure follows complete consumer manifests

key-files:
  created: []
  modified:
    - packages/runtime-js/package.json
    - packages/runtime-js/tsconfig.json
    - packages/runtime-python/package.json
    - packages/runtime-python/tsconfig.json
    - packages/runtime-wasm-wasi/package.json
    - packages/runtime-wasm-wasi/tsconfig.json
    - pnpm-lock.yaml

key-decisions:
  - "All three counted runtime packages declare @cowards/runtime-supervisor as a production workspace dependency and reference its composite TypeScript project."
  - "The lockfile was regenerated only after all three consumer manifests were complete, entirely from the offline package store."
  - "Production consumers may use only @cowards/spec and @cowards/runtime-supervisor public entrypoints; workspace src subpaths remain forbidden."

patterns-established:
  - "Supervisor consumer ordering is encoded twice: package dependencies for runtime resolution and TypeScript project references for build ordering."

requirements-completed: [CONF-01, CONF-04]

coverage:
  - id: D1
    description: "TypeScript, Python, and WASM/WASI runtimes explicitly resolve the public supervisor package after spec and supervisor builds."
    requirement: CONF-01
    verification:
      - kind: integration
        ref: "pnpm --filter @cowards/runtime-supervisor build && pnpm --filter @cowards/runtime-js typecheck && pnpm --filter @cowards/runtime-python typecheck && pnpm --filter @cowards/runtime-wasm-wasi typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "The final workspace lock is offline/frozen-clean and no counted runtime imports spec or supervisor source subpaths."
    requirement: CONF-04
    verification:
      - kind: integration
        ref: "pnpm install --lockfile-only --offline && pnpm install --frozen-lockfile --offline"
        status: pass
      - kind: integration
        ref: "negative rg source-subpath boundary scan across packages/runtime-js, runtime-python, and runtime-wasm-wasi"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 31: Counted Runtime Supervisor Workspace Wiring Summary

**Every counted runtime now resolves the shared supervisor through public workspace boundaries with deterministic project ordering and one offline-frozen final lockfile.**

## Performance

- **Duration:** 9 min
- **Completed:** 2026-07-16
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added `@cowards/runtime-supervisor: workspace:*` to the production dependencies of runtime-js, runtime-python, and runtime-wasm-wasi.
- Added `../runtime-supervisor` composite project references while preserving each package's existing spec and engine ordering.
- Regenerated the sole authorized workspace lock only after every consumer manifest was complete, then proved an offline frozen install.
- Proved all three runtime typechecks and an exact negative scan for workspace `src` imports.

## Task Commits

1. **Task 1: Register TypeScript and Python supervisor dependencies and references** — `074bc7e`
2. **Task 2: Register Wasmtime dependency and close the offline workspace lock** — `3362ae4`

## Files Created/Modified

- `packages/runtime-js/package.json`, `packages/runtime-js/tsconfig.json` — public supervisor dependency and build reference.
- `packages/runtime-python/package.json`, `packages/runtime-python/tsconfig.json` — public supervisor dependency and build reference.
- `packages/runtime-wasm-wasi/package.json`, `packages/runtime-wasm-wasi/tsconfig.json` — public supervisor dependency and build reference.
- `pnpm-lock.yaml` — final workspace importers for supervisor and all three consumers.

## Decisions Made

- Kept wiring declarative: this plan does not implement adapter behavior or activate any production lane.
- Used the existing `packages/*` workspace and public package exports without new subpath exports, dependencies, install hooks, or downloads.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- The first typecheck in the clean worktree materialized the already-locked dependency graph from the local pnpm store. No packages were downloaded; the final lock was regenerated only after all three manifests were complete.

## Known Stubs

None. Supervised adapter behavior remains intentionally owned by Plans 259-10 through 259-12.

## Next Phase Readiness

- Plans 259-10 through 259-12 can import only `@cowards/runtime-supervisor` and `@cowards/spec` while TypeScript and Turbo order their owners first.
- Plan 259-26 remains responsible for the executable native Linux supervisor and does not receive counted authority from workspace wiring alone.

## Self-Check: PASSED

- All seven declared modified files exist.
- Both task commits exist in order.
- Offline lock-only and frozen installs, supervisor build, three runtime typechecks, source-subpath scan, and `git diff --check` passed.
- No protected, native-supervisor, production-activation, or global planning file changed.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Plan: 31*
*Completed: 2026-07-16*
