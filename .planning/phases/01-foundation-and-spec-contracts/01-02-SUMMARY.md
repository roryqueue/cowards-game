---
phase: 1
plan: 01-02
title: Package and App Skeleton Boundaries
requirements:
  - FOUND-02
  - FOUND-04
  - FOUND-05
implementation_commit: 2303a50
status: completed
---

# Summary: Package and App Skeleton Boundaries

Created the initial app and package topology with strict package boundaries and inert exports for future implementation phases.

## Completed

- Added `apps/web` as a minimal Next app and `apps/worker` as a minimal worker entrypoint.
- Added packages for `spec`, `engine`, `runtime-js`, `replay`, `map-configs`, and `test-utils`.
- Configured TypeScript project references and package exports.
- Enforced key package-boundary constraints in ESLint, including `packages/spec` isolation and no `@cowards/runtime-js` import from the web app.

## Verification

- `pnpm verify` passed across all packages and apps.
- Acceptance checks confirmed `packages/spec` has no internal workspace dependencies.
- Acceptance checks confirmed `apps/web` does not import `@cowards/runtime-js`.

## Deviations

- Package bodies outside `packages/spec` remain intentionally skeletal per Phase 1 scope.
