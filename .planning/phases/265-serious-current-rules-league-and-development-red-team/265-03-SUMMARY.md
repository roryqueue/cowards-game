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
  - "League reopening is strictly read-only: uncertain starts receive an in-memory derived failure projection and partial publications remain invalid remnant evidence."
  - "The strategy-lab package accepts a narrow host runtime constructor, never a caller-created provider; Plan 06 CLI composition must bind that constructor to scripts/lib/v1-38-factory-supervised-runtime.ts#createFactorySupervisedRuntime."
  - "Source-level tests use a safe injected runtime and no empirical dispatch; actual provider, guest, and Match allocation remains for the reviewed later CLI path."
requirements-covered-source: [LEAG-01, LEAG-02, LEAG-09]
scope_status: source_only_not_empirically_complete
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

1. Added an immutable, bounded league repository. Artifact publication is content-addressed, starts precede terminals, terminal replacement fails, and reopen remains strictly read-only: uncertain starts become explicit in-memory charged-failure projections while partial files remain invalid remnant evidence. Reopened records are explicitly data-only (`issued: false`).
2. Added connected provider issuance and cell execution. The runner reads exact candidate-publication, source, packet, proposal, and validation artifacts from the factory repository; re-runs factory admission and authorization; keeps the issued provider in a module-private WeakMap; and maps only canonical bridge evidence into payoff or non-payoff terminals.

## Verification

- RED Task 1: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/repository.test.ts` failed as expected before the repository existed.
- GREEN Task 1: repository suite passed: 3 tests, including exact directory-byte snapshots proving normal, uncertain, temporary-remnant, and low-budget reopen calls perform no write, deletion, or durability sync.
- RED Task 2: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/connected-runner.test.ts` failed as expected before the runner existed.
- GREEN Task 2 and exact regression suite passed: 6 files, 33 tests: repository, connected runner, runtime bridge, factory admission, supervision artifacts, and factory-supervised-runtime tests.
- `./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false` passed.

## Task Commits

1. Task 1 RED — `2e128e96` `test(265-03): add failing league repository coverage`
2. Task 1 GREEN — `cfb3da9d` `feat(265-03): retain immutable league evidence`
3. Task 2 RED — `ac9e5324` `test(265-03): add failing host-issued runner coverage`
4. Task 2 GREEN — `19389328` `feat(265-03): issue supervised league providers`
5. Read-only reopen correction — `89130cbb` `fix(265-03): keep league reopen read-only`

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

**2. [Rule 1 - Bug] Removed mutation from reopening private league evidence**
- **Found during:** Post-plan source acceptance review.
- **Issue:** Reopen removed temporary files and published recovery terminals, violating the data-only reopen boundary.
- **Fix:** Reopen now performs no filesystem write, deletion, or durability sync. It retains unfinished charges as explicit derived-but-not-persisted failure projections and exposes well-formed partial files as bounded invalid remnants.
- **Files modified:** `packages/strategy-lab/src/league/repository.ts`, `packages/strategy-lab/src/league/repository.test.ts`
- **Verification:** Exact directory names/bytes are unchanged for normal, uncertain, leftover-temporary, and low-budget reopen calls; mutating durability callback count remains zero. Exact named suite and typecheck pass.
- **Committed in:** `89130cbb`

**Total deviations:** 2 auto-fixed (Rule 1). **Impact:** Preserves source-only evidence semantics, immutable root validation, and strictly non-authorizing reopening; no execution or allocation semantics changed.

## Known Stubs

None.

## Next Phase Readiness

Plan 06 must compose the host constructor with `scripts/lib/v1-38-factory-supervised-runtime.ts#createFactorySupervisedRuntime` in the trusted CLI/runtime process. This source-only plan covers implementation paths for LEAG-01, LEAG-02, and LEAG-09; it does not complete their empirical evidence, authorize, or perform Phase 265 allocation.

## Self-Check: PASSED

- All four owned source/test files exist.
- Task/correction commits `2e128e96`, `cfb3da9d`, `ac9e5324`, `19389328`, and `89130cbb` exist.
- No task commit deletes tracked files.
