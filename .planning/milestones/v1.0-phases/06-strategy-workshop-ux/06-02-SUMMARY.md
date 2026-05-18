---
phase: 6
plan: 06-02
subsystem: strategy-workshop-ux
tags:
  - workshop
  - monaco
  - validation
requires:
  - 06-01
provides:
  - Workshop first screen
  - Browser-only Monaco wrapper
  - Live/manual source validation UI
affects:
  - apps/web
  - packages/persistence
tech-stack:
  added: []
  patterns:
    - Dynamic homepage for persistence-backed Workshop data
    - Client workbench component with debounced validation
    - Pure validation formatting helpers covered by Vitest
key-files:
  created:
    - apps/web/app/globals.css
    - apps/web/app/api/workshop/validate/route.ts
    - apps/web/app/workshop/monaco-editor.tsx
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.test.tsx
  modified:
    - apps/web/app/layout.tsx
    - apps/web/app/page.tsx
    - apps/web/app/workshop/server.ts
    - apps/web/app/workshop/types.ts
    - apps/web/next-env.d.ts
    - eslint.config.mjs
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
    - vitest.config.ts
key-decisions:
  - Keep Monaco isolated in a client-only dynamic wrapper so App Router builds do not SSR editor code.
  - Add a dedicated `/api/workshop/validate` route for draft validation instead of overloading submission.
  - Keep full component interaction coverage for the later browser plan, and cover validation state formatting with pure tests now.
requirements-completed:
  - UX-01
  - UX-02
  - UX-03
duration: "00:20"
completed: "2026-05-17"
---

# Phase 6 Plan 06-02: Monaco Workbench, Templates, and Live Validation Summary

The scaffold homepage is now the Strategy Workshop: a compact workbench with validated templates, Monaco source editing, live/manual validation, and first-pass disabled operational panels for revision submission and test launch.

## Execution

- Start: 2026-05-17 16:17 America/New_York
- End: 2026-05-17 16:27 America/New_York
- Duration: 00:20
- Tasks completed: 4
- Files changed: 15

## Completed Tasks

- Added the UI-SPEC color tokens, responsive workbench grid, controls, chips, validation rows, and editor sizing in `globals.css`.
- Added a browser-only Monaco wrapper with `ssr: false`, TypeScript language mode, dark editor theme, and stable loading state.
- Added starter templates from persistence (`Cautious`, `Reckless`, `Sentinel`) and exposed valid template data to the Workshop.
- Replaced the homepage with a dynamic persistence-backed Workshop screen.
- Added `/api/workshop/validate` and routed web validation through the persistence facade to preserve web package boundaries.
- Added validation formatting/state helpers plus tests for `Strategy Workshop` status labels and `ERROR · MISSING_DEFAULT_EXPORT` rows.

## Verification

- `pnpm --filter @cowards/web test -- workshop-client.test.tsx`: passed
- `pnpm --filter @cowards/web typecheck`: passed
- `pnpm --filter @cowards/web build`: passed
- `pnpm verify`: passed
- `pnpm turbo test --force --filter=@cowards/web`: passed, confirming the new `.test.tsx` file is included

## Issues Encountered

- `next build` rewrites `apps/web/next-env.d.ts` with a semicolon that Prettier removes. The verification flow is stable when build is followed by formatting before `pnpm verify`.
- The repo test include initially ignored `.test.tsx`; updated `vitest.config.ts` to include TSX tests.
- ESLint was linting `apps/web/.next` output after local builds; updated ignores to exclude nested `.next` directories.

## Next Phase Readiness

Ready for 06-03.

## Self-Check: PASSED
