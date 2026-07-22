---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "04"
subsystem: release-proof
tags: [postgresql, go, rollback, compatibility, historical-evidence, restricted-evidence]

requires:
  - phase: 261-01
    provides: Closed integrated proof manifest and restricted evidence store
  - phase: 261-03
    provides: Released shared service and database ownership after real four-language proof
  - phase: 257
    provides: Retained exact core-rules result, compatibility rulings, and immutable historical dispatch
provides:
  - Exact non-overridable seven-probe audit reproduction release gate
  - Real PostgreSQL and Go D-11 rollback, compensation, recomputation, and mixed-tuple proof
  - Restricted-first 17-scenario rollback and historical receipt with read-only checks
affects: [261-05, 261-06, 261-07, prearchive-proof, release-boundaries]

tech-stack:
  added: []
  patterns:
    - Structured command receipt normalization excludes volatile timing and paths
    - Release tests compose production owners instead of copying rules or adding mutation endpoints
    - Restricted raw evidence is joined to closed public-safe hashes and limitation codes

key-files:
  created:
    - scripts/check-v1-37-audit-reproduction.ts
    - scripts/check-v1-37-audit-reproduction.test.ts
    - apps/go-backend/v1_37_release_rollback_test.go
    - packages/persistence/src/v1-37-release-rollback.test.ts
    - scripts/run-v1-37-rollback-proof.ts
    - scripts/run-v1-37-rollback-proof.test.ts
  modified:
    - package.json

key-decisions:
  - "The depth-3000 repair is admitted only through the exact Phase-258 bounded-JSON ruling; all six gameplay observations and successful-push history remain byte-exact to retained evidence."
  - "D-11 proof composes existing Go lifecycle/completion/scoring and persistence transaction/compensation/recompute owners; release tooling adds no gameplay or proof-only production authority."
  - "Deterministic equality compares normalized structured test identities, while volatile timing, paths, and raw diagnostics remain restricted evidence."
  - "v1.4, explicit v1.17, and annotated v1.36 evidence remain reachable only through their original historical dispatches."

patterns-established:
  - "Exact release join: source bytes, fresh structured result, retained result/ruling bytes, and protected historical inputs all contribute to one safe hash receipt."
  - "Read-only proof check: validate control, input root, object and attestation digests, and original write records without updating evidence or access logs."

requirements-completed: [PROOF-01, PROOF-03, PROOF-04]

coverage:
  - id: D1
    description: Exact seven-probe audit reproduction and compatibility-ruling release gate
    requirement: PROOF-01
    verification:
      - kind: integration
        ref: scripts/check-v1-37-audit-reproduction.test.ts and direct checker
        status: pass
    human_judgment: false
  - id: D2
    description: Real PostgreSQL and Go rollback, compensation, recomputation, retry, and mixed-tuple matrix
    requirement: PROOF-03
    verification:
      - kind: integration
        ref: packages/persistence/src/v1-37-release-rollback.test.ts and TestV137ReleaseRollback
        status: pass
    human_judgment: false
  - id: D3
    description: Restricted-first rollback and immutable-history receipts with repeated deterministic roots
    requirement: PROOF-04
    verification:
      - kind: integration
        ref: scripts/run-v1-37-rollback-proof.test.ts plus rollback-proof write/check/check
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-07-22
status: complete
---

# Phase 261 Plan 04: Persistence, Rollback, and Compatibility Proof Summary

**Exact seven-probe compatibility gating plus real PostgreSQL/Go rollback evidence and a restricted 17-scenario audit, D-11, and immutable-history receipt**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-22T11:44:29Z
- **Completed:** 2026-07-22T12:07:49Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Made the permanent audit reproduction a non-overridable exact release gate: seven probes only, immutable retained/result/source hashes, exact ruling scope, and no waiver or manual-pass shape.
- Proved the closed D-11 matrix through real database owners: schedule/claim staleness, kill switches, transaction faults, exact retry, append-only invalidation/compensation, standings recomputation, explicit tuple rollback, and mixed-state rejection.
- Captured 17 audit, rollback, and historical scenarios restricted-first; two fresh normalized roots agreed and two consecutive read-only checks returned aggregate `sha256:13308106f789cdb59cddaf091394124cfdee115e71440b8b53b7178384313179`.
- Revalidated immutable v1.4, explicit v1.17, and annotated v1.36 dispatch without rewriting historical bytes; the protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## Task Commits

Each TDD task was committed atomically:

1. **Task 1: Exact audit reproduction gate** — `16a163a1` (RED), `abfd1ed9` (GREEN)
2. **Task 2: Real Go/PostgreSQL D-11 scenarios** — `505471d1` (RED), `c1948704` (GREEN)
3. **Task 3: Restricted rollback and historical receipts** — `ac7f661c` (RED), `9d97cedb` (GREEN)

## Files Created/Modified

- `scripts/check-v1-37-audit-reproduction.ts` — Executes and joins the exact seven-probe result to retained rulings and protected inputs.
- `scripts/check-v1-37-audit-reproduction.test.ts` — Mutation tests for missing/changed probes, rewritten evidence, generic waivers, and insufficient rulings.
- `apps/go-backend/v1_37_release_rollback_test.go` — Composes real Go lifecycle, completion, scoring, authority rollback, and mixed-head owners.
- `packages/persistence/src/v1-37-release-rollback.test.ts` — Executes five real PostgreSQL owner suites for the 13-row D-11 inventory.
- `scripts/run-v1-37-rollback-proof.ts` — Runs two structured proof passes, writes restricted raw receipts, and exposes a read-only safe checker.
- `scripts/run-v1-37-rollback-proof.test.ts` — Receipt schema, mutation, missing/stale evidence, and read-only checker tests.
- `package.json` — Adds the sole mutating `v1.37:rollback-proof:write` collector and read-only `v1.37:rollback-proof:check` command.

## Decisions Made

- The bounded JSON repair is an exact prior non-gameplay ruling: Match state, Action legality, canonical event order, outcome, terminal semantics, and Strategy observations remain unchanged.
- Existing lifecycle, persistence, correction, and scoring owners remain authoritative. The release layer only composes and hashes their structured results.
- Raw command receipts, timing, paths, and database details stay in the restricted store; the safe receipt exposes only closed status, tuple disposition, limitation code, and opaque hashes.
- Checks are genuinely read-only and therefore do not append verification events or update control bytes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reused the existing Go string-slice equality helper**

- **Found during:** Task 2 Green verification
- **Issue:** The new test initially declared `equalStrings`, colliding with the package's existing helper and blocking compilation.
- **Fix:** Removed the duplicate declaration and reused the package-owned helper.
- **Files modified:** `apps/go-backend/v1_37_release_rollback_test.go`
- **Verification:** `go test ./... -run TestV137ReleaseRollback -count=1` passed.
- **Committed in:** `c1948704`

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** Compile-only correction; no semantic, architectural, or scope change.

## Issues Encountered

None beyond the auto-fixed helper collision. No compatibility checkpoint was required because no valid Match state, legality, event order, outcome, terminal semantic, Strategy observation, or historical interpretation changed.

## Known Stubs

None. Empty arrays in the proof implementation are accumulator initializers or explicit zero-result checks, not UI or data-source placeholders.

## User Setup Required

None. Verification used the provided healthy PostgreSQL/Redis services, explicit DSNs, Go path, integrated-proof flag, and restricted evidence root.

## Next Phase Readiness

- PROOF-01/03/04 inputs are ready for later Phase-261 rollups and strict release-boundary joins.
- The rollback control and restricted evidence remain at `/tmp/cowards-v1-37-restricted-evidence`; later collectors should consume the safe receipt by its checked aggregate hash.
- No blockers remain. Plans after 261-04 were not executed.

## Self-Check: PASSED

All seven created/modified implementation and test files exist, all six TDD task commits are reachable, the protected baseline is exact, and the focused audit/database/Go/history/receipt/typecheck verification passed.

---
*Phase: 261-integrated-service-proof-drift-guards-and-release*
*Completed: 2026-07-22*
