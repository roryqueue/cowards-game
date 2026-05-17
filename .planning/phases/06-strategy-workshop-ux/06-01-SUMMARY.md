---
phase: 6
plan: 06-01
subsystem: strategy-workshop-ux
tags:
  - workshop
  - api
  - persistence
requires: []
provides:
  - Workshop server facade
  - Workshop API route foundation
  - Workshop persistence service
affects:
  - apps/web
  - packages/persistence
  - packages/spec
tech-stack:
  added:
    - "@cowards/runtime-js"
    - "@cowards/persistence"
    - "@monaco-editor/react"
    - "monaco-editor"
  patterns:
    - Next route handlers call a narrow Workshop server facade
    - Web imports persistence through bundle-safe subpaths
key-files:
  created:
    - apps/web/app/api/workshop/route.ts
    - apps/web/app/api/workshop/source/route.ts
    - apps/web/app/api/workshop/submit/route.ts
    - apps/web/app/api/workshop/test/route.ts
    - apps/web/app/api/workshop/test/[matchSetId]/route.ts
    - apps/web/app/workshop/server.ts
    - apps/web/app/workshop/types.ts
    - apps/web/app/workshop/server.test.ts
    - packages/persistence/src/workshop.ts
    - packages/persistence/src/workshop.test.ts
  modified:
    - apps/web/package.json
    - apps/web/next.config.mjs
    - apps/web/tsconfig.json
    - apps/web/next-env.d.ts
    - packages/persistence/package.json
    - packages/persistence/src/index.ts
    - packages/persistence/src/seed.ts
    - packages/spec/src/types.ts
    - packages/spec/src/schemas.ts
    - packages/spec/src/spec.test.ts
    - tsconfig.base.json
    - pnpm-lock.yaml
key-decisions:
  - Keep Workshop API imports narrow by using persistence subpaths for db and workshop modules.
  - Store Workshop Strategy Revisions through the existing immutable revision service and expose summaries without source text.
  - Validate Strategy source in the web/API process but do not import engine, replay, or runtime worker modules there.
requirements-completed:
  - UX-01
  - UX-02
  - UX-03
  - UX-04
  - UX-05
  - UX-06
duration: "00:26"
completed: "2026-05-17"
---

# Phase 6 Plan 06-01: Workshop Data and API Foundation Summary

Workshop API/data foundation implemented with persisted Strategy Revisions, UI-safe Workshop DTOs, source validation/submission endpoints, revision source retrieval, and test match launch/status endpoints.

## Execution

- Start: 2026-05-17 16:09 America/New_York
- End: 2026-05-17 16:16 America/New_York
- Duration: 00:26
- Tasks completed: 4
- Files changed: 21

## Completed Tasks

- Added web dependencies for runtime validation, persistence access, and Monaco editor support.
- Added optional Strategy Revision notes metadata to the spec schema/types/tests.
- Added a persistence Workshop service for seed data, template source, revision summaries, opponent/preset summaries, match set creation, and test status summaries.
- Added Next route handlers and a server facade for initial data, source fetch, source submission, test launch, and test status.
- Added persistence and web facade tests covering Workshop contracts and invalid-source behavior.

## Verification

- `pnpm --filter @cowards/spec test`: passed
- `pnpm --filter @cowards/persistence typecheck`: passed
- `pnpm --filter @cowards/persistence test`: passed, with the existing skipped DB smoke test
- `pnpm --filter @cowards/web typecheck`: passed
- `pnpm --filter @cowards/web test`: passed
- `pnpm --filter @cowards/web build`: passed
- `rg '@cowards/(engine|replay)|@cowards/runtime-js/worker' apps/web`: no forbidden imports found

## Issues Encountered

- Next build initially tried to bundle persistence migration file-system code through the package root export. Fixed by adding narrow persistence subpath exports and updating web imports to use only `@cowards/persistence/db` and `@cowards/persistence/workshop`.

## Next Phase Readiness

Ready for 06-02.

## Self-Check: PASSED
