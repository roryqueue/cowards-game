---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 34
subsystem: integrity
tags: [admission, authority, supersession, containment, canonical-json]
requires:
  - phase: 262-33
    provides: immutable calibration_stopped route-5 verdict with fresh 0/0 and expired no-retry authority
provides:
  - capability-separated policy, matrix-admission, custody, and downstream-authority statuses
  - literal fresh-only ADMIT-03 admission gate with deny-by-default conjunction
  - canonical historical-plan supersession manifest and cross-wave boundary monitor
affects: [262-35, 262-36, 262-37, 262-38, 262-39, 262-40, ADMIT-03, SEAL-01]
tech-stack:
  added: []
  patterns: [closed status schemas, non-compensating authority conjunction, baseline Git byte custody, AST boundary monitoring]
key-files:
  created:
    - scripts/lib/v1-38-policy-authority.ts
    - scripts/check-v1-38-dependency-revision-boundaries.ts
    - scripts/evaluate-v1-38-dependency-revision.test.ts
    - .planning/artifacts/v1.38-phase-262-plan-supersession.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-34-SUMMARY.md
  modified: []
key-decisions:
  - "Grant downstream authority only when policy is ready, literal fresh matrix admission passed, genuine custody is authorized, containment passed, and identities join exactly."
  - "Treat route-5/A6/historical/policy evidence only as immutable constraints; none can satisfy matrix admission."
  - "Bind the additive 262-34..40 graph while keeping 262-03..07 historical and 262-41 dormant and non-discoverable."
patterns-established:
  - "Capability-separated authority: policy readiness, empirical admission, custody, and downstream authority cannot compensate for one another."
  - "Protected-history baseline: compare exact current bytes with the pre-execution Git tree and fail on edit or deletion."
requirements-completed: [ADMIT-01, ADMIT-02, ADMIT-04]
coverage:
  - id: D1
    description: "Closed acceptance statuses and a non-compensating downstream-authority evaluator preserve literal blocked admission."
    requirement: ADMIT-04
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-dependency-revision.test.ts#Phase 262 dependency-revision acceptance"
        status: pass
      - kind: other
        ref: "pnpm exec tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --types node --skipLibCheck scripts/lib/v1-38-policy-authority.ts scripts/check-v1-38-dependency-revision-boundaries.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Canonical supersession mapping and static monitor preserve historical bytes, omit dormant plans from discovery, and reject authority/privacy/live-work/formation bypasses."
    requirement: ADMIT-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-dependency-revision.test.ts#Phase 262 dependency-revision supersession boundaries"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-08-12
status: complete
---

# Phase 262 Plan 34: Capability-Separated Acceptance and Supersession Summary

**Closed acceptance schemas, literal fresh-only matrix admission, and a canonical supersession monitor preserve all stopped-route evidence while granting no downstream authority.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-12T21:25:37Z
- **Completed:** 2026-08-12T21:32:38Z
- **Tasks:** 2/2
- **Files modified:** 4 implementation/test/artifact files plus this summary

## Accomplishments

- Defined exact policy, matrix-admission, custody, and downstream-authority statuses with an all-inputs-must-pass conjunction and strict extra-key rejection.
- Required literal fresh `reproduction_passed` evidence with exact 540 charged/540 accepted, zero integrity failures, and exact predecessor identities; A6, route 5, historical matrices, old calibrations, and policy roots remain blocked.
- Canonically mapped historical Plans 262-03..07 to active Plans 262-34..40, retained dormant 262-41 as non-executable, and bound all six exact archival hashes.
- Added a cross-wave AST/path/Git monitor covering 148 protected paths, plan discovery, route reuse, authority writers, live work, candidate/formation namespaces, product imports, privacy fields, mutable aliases, and the separately attributed frozen replay dependency.

## Task Commits

Each TDD gate was committed independently:

1. **Task 1 RED: capability-separated acceptance tests** - `eaebc7f2` (test)
2. **Task 1 GREEN: separated admission authority** - `c9827265` (feat)
3. **Task 2 RED: supersession boundary mutations** - `e385af69` (test)
4. **Task 2 GREEN: supersession manifest and monitor** - `f8817200` (feat)

## Files Created/Modified

- `scripts/lib/v1-38-policy-authority.ts` - Closed schemas, immutable predecessor/stopped facts, fresh-only matrix admission, and downstream conjunction.
- `scripts/check-v1-38-dependency-revision-boundaries.ts` - Canonical manifest generator/checker plus protected-history, AST, path, discovery, and replay-dependency monitor.
- `scripts/evaluate-v1-38-dependency-revision.test.ts` - Exact schema, conjunction, admission, supersession, protected-byte, and seeded-bypass tests.
- `.planning/artifacts/v1.38-phase-262-plan-supersession.json` - Content-addressed additive graph with explicit denials and dormant activation contract.

## Verification

- Focused Vitest: 8 passed, 0 failed.
- Boundary monitor: `passed_absence`; 148 protected paths, one new production source scanned, matrix admission `blocked`, downstream authority `denied`.
- Standalone strict TypeScript check: passed for both new production modules.
- Archived Plans 262-03..07 and dormant 262-41 SHA-256 values exactly match their frozen values.
- `phase-plan-index 262`: no 262-03..07 or 262-41 IDs in `incomplete` or `waves`.
- Frozen replay test and manifest still name unreachable commit `4fab0afc058232f37ba11506b5d04a1d59b2f4e0`; no repair or substitution was made.

## Decisions Made

- Policy readiness is explicitly non-authorizing and cannot substitute for ADMIT-03 or SEAL-01.
- The immutable predecessor join remains valid authority input, while any failed future join returns `stopped_integrity_foundation` rather than repairing or relabeling evidence.
- The monitor uses the exact Plan-262-34 starting Git commit as its protected-history baseline, so later additive files do not redefine historical custody.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Repaired stale generated dependency-tree metadata**
- **Found during:** Task 1 RED verification
- **Issue:** The prior Plan-262-33 temporary checkout left root `node_modules` links and `virtualStoreDir` metadata pointing at a deleted temporary directory, causing the exact `pnpm exec` command to abort before Vitest.
- **Fix:** Repointed only generated/ignored dependency links and metadata to the already-present local virtual store; pnpm then reconciled the existing lockfile without changing tracked dependencies.
- **Files modified:** Ignored `node_modules` metadata only
- **Verification:** The plan's exact `pnpm exec vitest ...` and `pnpm exec tsx ... --check` commands pass.
- **Committed in:** Not applicable; generated ignored environment repair

**2. [Rule 1 - Bug] Closed standalone TypeScript typing gaps**
- **Found during:** Task 2 GREEN verification
- **Issue:** Package-level Turbo typecheck does not include root scripts; a direct TypeScript invocation found literal widening, flat-map inference, void-return, and AST binding-name narrowing defects.
- **Fix:** Preserved literal baseline types, used an explicit protected-history loop, returned `void` explicitly, and narrowed declaration names safely.
- **Files modified:** `scripts/check-v1-38-dependency-revision-boundaries.ts`
- **Verification:** Standalone strict TypeScript command passes.
- **Committed in:** `f8817200`

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking environment issue, 1 Rule 1 implementation bug).  
**Impact on plan:** Both fixes were required to execute the declared checks; neither expanded authority or changed protected project artifacts.

## Issues Encountered

The first exact pnpm invocation was blocked by stale generated dependency metadata from a deleted temporary checkout. It was repaired without package changes or tracked-file mutation.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Live Truth Preserved

Route 5 remains `calibration_stopped`; fresh charged and accepted counts remain 0/0; authority remains expired with no retry. ADMIT-03 remains blocked, SEAL-01 remains unmet, candidate search and Phase 263 remain denied, and formation/product authorization remains false.

## Next Phase Readiness

Plan 262-35 may consume the non-authorizing status and supersession contracts to freeze study/accounting policy. It receives no matrix admission, custody, candidate, formation, Phase 263, or production authority.

## Self-Check: PASSED

All four created implementation/test/artifact files exist; commits `eaebc7f2`, `c9827265`, `e385af69`, and `f8817200` resolve in Git; the exact focused tests, static monitor, strict TypeScript check, frozen hashes, and plan-index exclusions pass.
