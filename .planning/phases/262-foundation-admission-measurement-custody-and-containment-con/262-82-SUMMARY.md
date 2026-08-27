---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "82"
subsystem: private-execution-control
tags: [bounded-retry, durable-journal, expiry, crash-recovery, tdd]
requires:
  - phase: 262-77
    provides: immutable blocked review root and TIME_WINDOW_EXPIRY_NOT_TERMINALIZED finding over Plan-76 source
provides:
  - Previous-root-linked time_window_expired journal transition with inclusive four-hour validity
  - Controller deadline guards that persist expiry before returning or launching later work
  - Synthetic crash, restart, idempotence, stale-concurrency, no-reuse, and terminal-publication proof
affects: [262-83, 262-78, bounded-retry-sealing]
tech-stack:
  added: []
  patterns: [journal-owned terminal reason, durable-before-memory append, deadline guard before irreversible work]
key-files:
  created:
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-82-SUMMARY.md
  modified:
    - scripts/lib/v1-38-bounded-retry-envelope.ts
    - scripts/run-v1-38-bounded-retry-envelope.ts
    - scripts/run-v1-38-bounded-retry-envelope.test.ts
key-decisions:
  - "Represent four-hour expiry as one immutable journal event with the sole reason time_window_expired; wall-clock state alone never establishes terminality."
  - "Treat Plan 77 as exact protected blocked history and require the future Plan-83 pair as the sole corrected-source sealing prerequisite."
  - "Keep ADMIT-03 blocked at fresh 0/540 and grant no live, sealing, lifecycle, or downstream authority from this correction."
patterns-established:
  - "A single deadline guard runs on entry, after reconciliation, around waits, and before irreversible work; it appends durably before advancing in-memory records."
  - "Terminal replay exposes zero remaining route/preflight capacity and repeated invocation returns the same journal-derived state without another append."
requirements-completed: []
coverage:
  - id: D1
    description: Inclusive four-hour expiry is represented, validated, replayed, and enforced as one immutable terminal journal fact.
    requirement: ADMIT-04
    verification:
      - kind: unit
        ref: "scripts/run-v1-38-bounded-retry-envelope.test.ts#records inclusive time-window expiry once as an immutable exhausted journal fact"
        status: pass
    human_judgment: false
  - id: D2
    description: Controller expiry persists before normal return and survives crash, restart, repetition, waits, and stale concurrent ownership without identity reuse.
    requirement: MEAS-04
    verification:
      - kind: integration
        ref: "scripts/run-v1-38-bounded-retry-envelope.test.ts#bounded retry controller and CLI containment"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-08-27
status: complete
---

# Phase 262 Plan 82: Durable Inclusive Expiry Terminalization Summary

**Inclusive four-hour expiry now appends one immutable chained terminal before controller return, with crash-safe replay, zero identity reuse, and Plan-77 history preserved exactly**

## Performance

- **Duration:** 10 min
- **Started:** 2026-08-27T13:30:37Z
- **Completed:** 2026-08-27T13:40:25Z
- **Tasks:** 2
- **Files modified:** 3 source/test files, summary, and deferred-item log

## Accomplishments

- Added `time_window_expired` to the closed journal event model. It is valid exactly once at or after `firstObservationMilliseconds + 14_400_000`, remains previous-root-linked, and replays to `exhausted` with no reusable preflight or route identity.
- Added one controller deadline guard used on entry, after reconciliation, around waits, and before irreversible observation/calibration/reproduction transitions. The durable writer completes before the in-memory record list advances.
- Added owned synthetic proofs for exact/post-boundary expiry, pre-boundary rejection, crash on both sides of durable append, restart, repeated invocation, stale concurrent append rejection, wait-crossing, zero work after deadline, and exclusive immutable terminal-result publication.
- Rewired future sealing/live custody to the corrected Plan-82 summary and Plan-83 re-review pair. The exact Plan-77 JSON/report/summary hashes and blocked finding remain authenticated protected history only.

## Task Commits

Each TDD gate was committed atomically:

1. **Task 1 RED: immutable inclusive-expiry model tests** - `75b97b1e` (test)
2. **Task 1 GREEN: immutable expiry terminal model** - `80f0f640` (feat)
3. **Task 2 RED: controller durability and publication tests** - `3727f73f` (test)
4. **Task 2 GREEN: durable controller terminalization** - `e844279f` (fix)

## Corrected Source Custody

- Source commit: `e844279f62192c41175fb3e7a08910493c6f24ab`
- Source tree: `360a10e6767cd3e9c899b0b07ea54a5bf7faac65`
- Sole parent: `3727f73f09c6ec33f48d3072b3569d562d71c20d`
- `scripts/lib/v1-38-bounded-retry-envelope.ts`: blob `5150350135ecbf5834bdbf879ec3517800b4e797`, SHA-256 `e740d926fb5866f8237b5093e05dd1a2f8e53491453367e0217bf92c04da9c56`
- `scripts/run-v1-38-bounded-retry-envelope.ts`: blob `5534a54804bf92f51d2fe792d088e47ab2ccf88f`, SHA-256 `d9365b912609a9b3bd8f2c03423f52d407627fad0bb35005eda9a4b447d480e9`
- `scripts/run-v1-38-bounded-retry-envelope.test.ts`: blob `af58ad0570baf3ae28bb6ec71577320bef4cba9e`, SHA-256 `2432df4954f5cf199acb5739b9b4389c3d91c1237639d3f73116703a273685a3`

## Verification

- Focused bounded-retry suite: 26/26 passed with one worker, no file parallelism, and 180-second timeout.
- Turbo typecheck: 27/27 tasks passed.
- ESLint, Prettier, and `git diff --check` passed for all three source/test files.
- Full serialized Turbo suite was attempted. It stopped at the unrelated replay package: 228/230 replay tests passed, while two historical-v1.4 manifest checks reported pre-existing frozen-source mismatches in untouched replay files. The issue is recorded in `deferred-items.md` and was not repaired here.
- Plan-77 JSON/report/summary SHA-256 values remain exactly `76d0c0ee...ed54f8`, `82de7269...234b2`, and `e84302fa...f36a7`; review root remains `sha256:1d58e184...aade8f3` with the one historical finding unchanged.
- No seal, inactive envelope, canonical journal, terminal, reproduction-v15, Route-9 activation, or other live destination exists.

## Decisions Made

- The deadline is inclusive for ordinary work: at the exact boundary, ordinary events fail and only the explicit expiry terminal may close an active envelope.
- The terminal reason and exhausted capacity derive only from committed journal bytes; mutable clock inspection is used solely to decide whether to append that fact.
- The obsolete Plan-77 checker is not rerun as authority over corrected bytes. Plan 77 remains truthful for Plan-76 source, and Plan 83 alone may independently review the corrected commit.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The full repository suite exposed two unrelated `@cowards/replay` frozen-manifest failures for `historical-v1-4-grammar.ts` and `historical-v1-4-transition.ts`. These paths were not modified by Plan 262-82; the finding was isolated, recorded in `deferred-items.md`, and left untouched.
- The Plan-77 canonical checker rejects current corrected bytes with `V138_PLAN_262_77_SOURCE_IDENTITY_INVALID`, as expected for immutable historical review evidence. Exact artifact/report/summary hashes were verified directly instead; Plan 83 owns the fresh review.

## Known Stubs

None. Empty arrays and nullable derived fields are bounded journal/test initialization and closed-state representations, not unwired production or UI data.

## Threat Flags

None beyond the planned monotonic-receipt, journal, durable-restart, and corrected-source review boundaries. No endpoint, auth path, schema migration, live execution, or new secret/file ingress was added.

## Authentication Gates

None.

## User Setup Required

None - no external service, secret, package, or live environment was accessed.

## Next Phase Readiness

- Plan 262-83 is the sole next action and must independently review commit `e844279f62192c41175fb3e7a08910493c6f24ab` plus this committed summary ancestry.
- Plan 262-78 remains ineligible until Plan 83 publishes exact zero findings. No seal, envelope, live work, ADMIT-03 credit, lifecycle mutation, Phase 263, candidate, formation, holdout, public, product, activation, production, counted-play, or gameplay-change authority exists.

## TDD Gate Compliance

- Task 1 RED `75b97b1e` precedes GREEN `80f0f640`.
- Task 2 RED `3727f73f` precedes GREEN `e844279f`.

## Self-Check: PASSED

- All three corrected source/test paths exist and match the recorded commit tree, modes, blobs, and SHA-256 values.
- All four TDD commits exist on the current first-parent lineage.
- Focused tests, typecheck, lint, formatting, immutable Plan-77 hashes, and canonical-destination absence checks passed.
- The full-suite replay failure is isolated to untouched pre-existing frozen-source identity drift and is explicitly deferred without scope expansion.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-08-27*
