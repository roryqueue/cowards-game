---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "03"
subsystem: strategy-lab-league
tags: [private-offline, immutable-retention, host-issued-runtime, canonical-kernel]
dependency_graph:
  requires: [265-01-league-contracts, phase-264-factory-candidates, runtime-bridge]
  provides: [charged-league-retention, data-only-reopen, host-issued-provider-handoff]
  affects: [265-06-cli-wiring, league-matrix, league-psro, league-report]
tech_stack:
  added: []
  patterns: [content-addressed-private-evidence, charge-first-terminalization, host-composed-runtime-issuer, weakset-capability]
key_files:
  created:
    - packages/strategy-lab/src/league/repository.ts
    - packages/strategy-lab/src/league/repository.test.ts
    - packages/strategy-lab/src/league/connected-runner.ts
    - packages/strategy-lab/src/league/connected-runner.test.ts
  modified: []
decisions:
  - "League reopening recovers an uncertain charged start as one persisted system-failure terminal and returns only root-bound records with issued:false."
  - "The strategy-lab package accepts a narrow host runtime constructor, never a caller-created provider; Plan 06 CLI composition must bind that constructor to scripts/lib/v1-38-factory-supervised-runtime.ts#createFactorySupervisedRuntime."
  - "Source-level tests use a safe injected runtime and no empirical dispatch; actual provider, guest, and Match allocation remains for the reviewed later CLI path."
requirements-completed: [LEAG-01, LEAG-02, LEAG-09]
coverage:
  - id: D1
    description: "Immutable charge-first league evidence retention and bounded data-only reopening."
    requirement: LEAG-01
    verification:
      - kind: unit
        ref: packages/strategy-lab/src/league/repository.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: "Persisted factory closure is re-admitted into a module-private host-issued capability before canonical bridge execution."
    requirement: LEAG-02
    verification:
      - kind: integration
        ref: packages/strategy-lab/src/league/connected-runner.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: "Forged providers and runtime or cleanup failures remain charged non-payoff terminals."
    requirement: LEAG-09
    verification:
      - kind: integration
        ref: packages/strategy-lab/src/league/connected-runner.test.ts
        status: pass
    human_judgment: false
metrics:
  duration: "~13 minutes"
  completed_date: "2026-09-15"
status: complete
---

# Phase 265 Plan 03: Supervised Private League Execution and Reopening Summary

Private league cells now have immutable charged retention plus a source-closed, host-issued provider handoff that can reach only the canonical runtime bridge.

## Completed Tasks

1. Added an immutable, bounded league repository. Artifact publication is content-addressed, starts precede terminals, terminal replacement fails, uncertain starts terminalize conservatively, and reopened records are explicitly data-only (`issued: false`).
2. Added connected provider issuance and cell execution. The runner reads exact candidate-publication, source, packet, proposal, and validation artifacts from the factory repository; re-runs factory admission and authorization; keeps the issued provider in a module-private WeakMap; and maps only canonical bridge evidence into payoff or non-payoff terminals.

## Verification

- RED Task 1: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/repository.test.ts` failed as expected before the repository existed.
- GREEN Task 1: repository suite passed: 3 tests.
- RED Task 2: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/connected-runner.test.ts` failed as expected before the runner existed.
- GREEN Task 2 and exact regression suite passed: 6 files, 33 tests: repository, connected runner, runtime bridge, factory admission, supervision artifacts, and factory-supervised-runtime tests.
- `./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false` passed.

## Task Commits

1. Task 1 RED — `2e128e96` `test(265-03): add failing league repository coverage`
2. Task 1 GREEN — `cfb3da9d` `feat(265-03): retain immutable league evidence`
3. Task 2 RED — `ac9e5324` `test(265-03): add failing host-issued runner coverage`
4. Task 2 GREEN — `19389328` `feat(265-03): issue supervised league providers`

## Decisions Made

- The package does not import `scripts/`; Plan 06 must supply the host composition that calls the existing `createFactorySupervisedRuntime` adapter. The package validates the resulting identity and keeps the actual provider nonserializable and module-private.
- Source and injected-runtime proof intentionally performed no live allocation, provider, guest, or Match execution. A later reviewed CLI path is required for actual dispatch.
- Player violations, malformed bindings, system failures, and cleanup failure cannot enter a payoff snapshot.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided recursive freezing of non-empty source bytes**
- **Found during:** Task 2 GREEN verification.
- **Issue:** The shared recursive freezer rejects non-empty `Uint8Array` values when reopening source artifacts.
- **Fix:** Used a shallow-frozen closure envelope and copied source bytes again at the host boundary.
- **Files modified:** `packages/strategy-lab/src/league/connected-runner.ts`
- **Verification:** Focused runner tests, exact named regression suite, and strategy-lab TypeScript build passed.
- **Committed in:** `19389328`

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** Preserves immutable root validation and avoids an unrelated typed-array runtime exception; no execution or allocation semantics changed.

## Known Stubs

None.

## Next Phase Readiness

Plan 06 must compose the host constructor with `scripts/lib/v1-38-factory-supervised-runtime.ts#createFactorySupervisedRuntime` in the trusted CLI/runtime process. This source plan proves the boundary only with safe injected runtime evidence; it neither authorizes nor performs Phase 265 empirical allocation.

## Self-Check: PASSED

- All four owned source/test files exist.
- Task commits `2e128e96`, `cfb3da9d`, `ac9e5324`, and `19389328` exist.
- No task commit deletes tracked files.
