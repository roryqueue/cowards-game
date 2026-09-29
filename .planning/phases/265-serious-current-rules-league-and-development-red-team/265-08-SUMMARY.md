---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "08"
subsystem: strategy-lab-private-diagnostics
tags: [diagnostic-pilot, source-only, canonical-match, watchdog, source-gate]
requires:
  - phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
    provides: authenticated S01/S03 assessment and immutable candidate closure
  - phase: 265-serious-current-rules-league-and-development-red-team
    provides: canonical Match runner, supervised runtime, and retained process-invalid historical result
provides:
  - exact-root S01/S03 targeted reader and distinct diagnostic-only pilot allocation/ledger/verifier source
  - private precharged WeakMap-backed canonical Match adapter with pilot-only supervisor lifetime grant
  - parent-process watchdog, exact-owner cleanup, bounded private retention, and signed exact-source gate
affects: [265-09-conditional-diagnostic-pilot]
tech-stack:
  added: []
  patterns: [read-only historical authentication, durable precharge before private provider issuance, independent signed source gate]
key-files:
  created:
    - packages/strategy-lab/src/league/diagnostic-pilot.ts
    - packages/strategy-lab/src/league/diagnostic-pilot.test.ts
    - scripts/run-v1-38-diagnostic-pilot.ts
    - scripts/run-v1-38-diagnostic-pilot.test.ts
    - scripts/check-v1-38-diagnostic-pilot-boundaries.ts
    - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-SOURCE-REVIEW.md
    - .planning/phases/265-serious-current-rules-league-and-development-red-team/265-08-PILOT-GATE.json
  modified:
    - packages/strategy-lab/src/league/connected-runner.ts
    - scripts/lib/v1-38-factory-supervised-runtime.ts
    - scripts/lib/v1-38-planner-supervised-runtime.ts
key-decisions:
  - "Plan 08 is source-only: its signed gate has empiricalAuthority:false and cannot itself authorize a pilot allocation, reservation, provider, Strategy, model, or Match."
  - "Only independently reopened Phase 264 S01/S03 closure and a distinct durable diagnostic start may issue private pilot handles."
  - "A separate parent watchdog preempts blocked child work; unknown ownership, cleanup, publication, or retained evidence fails process validity."
patterns-established:
  - "Reviewer-signed source gate covers ten ordered executable/test/lock/CI files, required commands, reader ceiling, and zero-actionable review digest."
requirements-completed: []
duration: "6d 9h 35m elapsed across paused sessions; active time not measured"
completed: 2026-09-29
status: complete
---

# Phase 265 Plan 08: Source-only diagnostic pilot route Summary

**An independently reviewed, signed exact-source gate now guards a private four-cell diagnostic pilot route; no empirical pilot was created or run.**

## Performance

- **Started:** 2026-09-23T10:00:45Z (first RED commit)
- **Completed:** 2026-09-29T19:35:20Z
- **Elapsed:** about 6 days 9 hours across paused sessions; active work time was not measured
- **Tasks:** 3
- **Source files:** 8, plus the reviewed lockfile/CI definition in the closure; 2 review/gate artifacts

## Accomplishments

- Added strict diagnostic-only S01/S03 Smoke identity, direct byte/root authentication of the assessed Phase 264 closure, a targeted reader without whole-store replay, and separate durable allocation/cell/start/terminal/verifier contracts.
- Added a private pilot issuer/adapter whose real providers stay in `connected-runner.ts`'s WeakMap; an independently reopened durable pilot precharge precedes either seat's issuance, forged or legacy handles fail, and only the canonical Match runner is reachable after binding checks.
- Added authenticated nonserializable pilot-only 240,000-ms lifetime grants in both supervision layers while keeping ordinary 120,000-ms and per-method 1,000-ms limits. The separate parent watchdog enforces cell/overall windows with finite cleanup/publication reserves and exact-owner Docker cleanup; incomplete evidence remains process-invalid.
- Obtained an independent zero-actionable review and reviewer-signed gate for source closure `sha256:86d157dd8ca42de29a55e966e223263f9bf96eac21afa531489fe7d82c543059`, review digest `sha256:065b4f940a768883951be212eb593e68cbd932c9ba6f202f266b1c2b6b32ae27`, and gate root `sha256:a6848166b539d9885aed10825a1c3f36731b7fc32474abf0dea2a38eef5e5a76`.

## Source-only verification

All 11 exact commands in the signed gate exited 0 on the frozen closure. Focused tests passed 5 files/40 tests; the complete named Phase 265 CI command passed 29 files/357 tests; privacy-marker tests passed 4 files/101 tests. Strict package and script TypeScript, package build, serious/lab/factory/diagnostic AST boundaries, and service-import boundaries passed. The service-import checker retained 19 pre-existing report-only notices and zero strict/ownership offenses. The source-only `check-gate` command returned `diagnostic-pilot-gate: pass` after the reviewer signature.

Three separate fresh-process targeted-reader measurements were 14,739, 14,013, and 14,057 ms. The receipt's conservative ceiling is 44,739 ms (maximum plus 30,000 ms); this is not a cold-cache guarantee, and any future `run` repeats admission inside its 1,800,000-ms parent clock.

The pilot allocation, result, and reserved repository paths were absent at completion. No pilot allocation, repository reservation, provider, Strategy, model, or Match was created or invoked; old allocation-v2/result/repositories were not changed. No LEAG-01–09 or Phase 266/formation/holdout/public/counted credit follows from this plan. The independent reviewer also ran final `check-gate` on the signed receipt and observed exit 0 at the same gate root.

## Task Commits

1. **Task 1, exact-root reader and precharged adapter:** `eada3925` (RED tests), `6955402a` (GREEN source).
2. **Task 2, scoped lifetime and parent watchdog:** `684d1411` (RED tests), `ea8d24f5` (GREEN source), `a2e34fe0` (source-review safety repairs).
3. **Task 3, independent exact-source review and signed receipt:** `5a5d86b3` (review/gate artifacts).

## Deviations from Plan

### Auto-fixed issues

- **[Rule 1 — bug]** Review of Task 2 exposed duplicate issuance, temporary-file reopening, abnormal IPC cleanup, writer payload, auxiliary settlement, and partial/full retention cases. Fixed with injected source-only tests and bounded fail-closed handling in `a2e34fe0`.
- **[Rule 2 — missing critical safety]** Bound old evidence/result identity, failure-size limits, and signature admission into the source route before any future authority in `a2e34fe0`.

These repairs stayed inside the planned eight source/test/boundary files and preceded the frozen independent zero-finding review. Markdown hard-break spaces in the signed review are intentional; its digest is part of the gate.

## Known Stubs

None. Empty accumulators and nullable in-progress values found by the stub-pattern scan are runtime state, not placeholder outputs.

## Self-Check: PASSED

All eight source/test/boundary files, both review/gate artifacts, and this summary exist. All six Task 1–3 source/review commits resolve in Git. The signed gate and current source closure passed `check-gate`; the pilot allocation/result/repository remain absent.

## Next Phase Readiness

Plan 265-09 may independently decide whether to prepare one distinct pilot allocation and conditionally run under the approved envelope. This source receipt itself has `empiricalAuthority:false`; the old process-invalid full-league result remains immutable and no complete-league, formation, holdout, counted, or public authority is established.

---
*Phase: 265-serious-current-rules-league-and-development-red-team*
*Completed: 2026-09-29*
