# Phase 134 Code Review

**Status:** Passed after fixes
**Date:** 2026-05-25

## Findings

### Fixed: Hostile evidence staleness

- **Severity:** Blocker
- **Files:** `scripts/check-boundary-monitors.ts`
- **Issue:** Hostile probe/no-fallback evidence could become stale relative to `runtime-sandbox-evaluation.json`.
- **Fix:** Boundary monitors now compare default and strict hostile lane status/summary counts against their matching sandbox reports.

### Fixed: Public-safety denylist gaps

- **Severity:** Warning
- **File:** `packages/runtime-js/src/sandbox-evaluation.ts`
- **Issue:** Public-safety markers missed several canonical lower/camel-case private field names.
- **Fix:** Added markers for `strategyMemory`, `soldierMemory`, `objectivePayload`, `awarenessGrid`, `rawRuntimeDetails`, `privateRuntime`, `runtimeInternals`, traceback, stderr/stack labels, session ids, and access tokens.

## Verification

- `pnpm sandbox:evaluate` passed.
- `pnpm sandbox:evaluate:container` passed.
- `pnpm sandbox:evaluate:runsc` failed loudly as expected.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts packages/runtime-js/src/container-subprocess-adapter.test.ts` passed.
- Final re-review reported no findings and confirmed default hostile evidence is portable while strict container evidence remains in `.container` artifacts.
