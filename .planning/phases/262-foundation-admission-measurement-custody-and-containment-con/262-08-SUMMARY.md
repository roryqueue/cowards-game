---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "08"
subsystem: integrity
tags: [historical-expectation, git-object-identity, canonical-predicate, matrix-reduction]

requires:
  - phase: 262-02
    provides: exact 540-attempt supervised matrix inventory, charged accounting, and canonical reducer
provides:
  - immutable independently derived historical matrix expectation bound to admitted pre-v1.38 Git evidence
  - exact historical predicate for leaders, third place, cycles, inventory, and per-Strategy arena equality
  - canonical reducer bindings for separate expectation, observed aggregate, accepted ledger, and source roots
affects: [262-09, 262-10, ADMIT-03, v1.38-foundation-contract]

tech-stack:
  added: []
  patterns:
    - derive expected predicates only from admitted immutable Git blobs
    - validate closed canonical expectation artifacts before evaluating observed results
    - keep expected predicate roots separate from observed aggregate and accepted-ledger roots

key-files:
  created:
    - .planning/artifacts/v1.38-historical-matrix-expectation.json
  modified:
    - scripts/lib/v1-38-current-matrix-reproduction.ts
    - scripts/evaluate-v1-38-foundation-contract.test.ts

key-decisions:
  - "Bind the expectation to the admitted v1.37 archive commit, exact README and runner Git blob objects and bytes, and a delimited derivation-code root; never use working-tree historical evidence or observed outcomes."
  - "Evaluate the documented historical predicate rather than inventing a stronger full aggregate root that does not exist in pre-v1.38 evidence."
  - "Retain ADMIT-03 as blocked until the separate supervised execution and resource gap plans produce a complete accepted 540-cell run."

patterns-established:
  - "Historical expectation loader re-derives from immutable Git and requires byte-canonical equality with the persisted artifact."
  - "Canonical reduction validates expectation provenance before testing observed inventory, records, cycles, and arena equality."

requirements-completed: []

coverage:
  - id: D1
    description: "Immutable historical expectation derived from exact pre-v1.38 Git objects and declarations"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#matrix expectation is reproduced only from immutable v1.37 Git evidence"
        status: pass
    human_judgment: false
  - id: D2
    description: "Mutation-detecting source, declaration, derivation, schema, and expectation-root validation"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#matrix expectation rejects mutated cases"
        status: pass
    human_judgment: false
  - id: D3
    description: "Independent exact predicate enforced with separate observed aggregate and accepted-ledger roots"
    requirement: ADMIT-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#v1.38 matrix reduction"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-07-29
status: complete
---

# Phase 262 Plan 08: Independent Historical Matrix Expectation Summary

**Content-addressed pre-v1.38 historical predicate rooted at `sha256:758c31a3…abdce`, with exact Git provenance and fail-closed canonical reduction**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-29T05:25:30Z
- **Completed:** 2026-07-29T05:34:16Z
- **Tasks:** 2
- **Files modified:** 3
- **Focused verification:** 24/24 selected tests passed
- **Workspace typecheck:** 27/27 tasks passed

## Accomplishments

- Persisted a non-zero historical expectation reconstructed only from admitted v1.37 commit `e704590d…35ad`, README blob `ab5c9fea…363`, and runner blob `3de4aa6f…a06`.
- Bound exact declared evidence: 540 Matches, both 62-44-2 leaders, the 57-51-0 third-place record, nine majority-edge cycles, and per-Strategy Smoke/Open Field record equality.
- Removed the all-zero expected aggregate placeholder and made canonical reduction validate the independent predicate before accepting observed results.
- Bound the expectation root and source identities separately from the observed aggregate root, charged-attempt ledger root, accepted-cell ledger root, and reducer source root.

## Task Commits

1. **Task 1 RED: Persist independent historical expectation tests** - `51fe2489` (test)
2. **Task 1 GREEN: Bind historical matrix expectation** - `6d3e183d` (feat)
3. **Task 2 RED: Enforce independent reduction tests** - `11bf46b8` (test)
4. **Task 2 GREEN: Enforce independent matrix predicate** - `92e44781` (feat)

## Evidence Identity

- **Historical expectation root:** `sha256:758c31a37318edfb1c94cb1d9715ae3cfe49cabdff13d906f155f00cc71abdce`
- **Derivation source root:** `sha256:a3d0cd5c66f9b8f60b0a2a03e543d0cb602fc359abd45f6dcbcacb71172c88d3`
- **Admitted archive commit:** `e704590df599b49d84745b0e828d5ab0f1d335ad`
- **Historical README blob:** `ab5c9feae17f28bd4eb8aeff90516a05c9633363`
- **Historical runner blob:** `3de4aa6f2397925d1d0de012cd8e749554455a06`

## Files Created/Modified

- `.planning/artifacts/v1.38-historical-matrix-expectation.json` - Canonical persisted expectation with Git provenance, exact declarations, and content root.
- `scripts/lib/v1-38-current-matrix-reproduction.ts` - Git-only derivation, closed validation, loader, exact predicate evaluator, per-arena aggregation, and receipt bindings.
- `scripts/evaluate-v1-38-foundation-contract.test.ts` - Source, object, bytes, derivation, declaration, ambiguity, schema, predicate, and observed-root mutation coverage.

## Decisions Made

- The historical runner is hashed evidence only. It is never loaded or executed, and the canonical supervised runtime-service / v1.19 kernel path remains unchanged.
- The README declarations are the strongest independently available pre-v1.38 expectation. The new observed run cannot create, normalize, override, or rewrite them.
- A mismatch throws `MATRIX_REPRODUCTION_MISMATCH`; no partial or synthetic observed aggregate becomes accepted evidence.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The sandbox initially prevented Git index writes. The required atomic commits were completed through the normal approval path with repository hooks intact.

## Known Stubs

None.

## Threat Flags

None. No network endpoint, authentication path, filesystem trust boundary outside the offline evidence evaluator, schema boundary, formation artifact, candidate artifact, or public/product surface was added.

## User Setup Required

None.

## Next Phase Readiness

- The non-circular expectation portion of ADMIT-03 is closed and ready for the bounded parallel supervised execution plans.
- ADMIT-03 itself remains blocked until a complete 540/540 accepted supervised run satisfies this predicate and the frozen resource/cleanup contract.
- Formation and candidate materialization remain unauthorized and absent.

## Self-Check: PASSED

- Created/modified implementation files and the persisted expectation exist.
- Task commits `51fe2489`, `6d3e183d`, `11bf46b8`, and `92e44781` exist.
- The persisted expectation re-derives byte-for-byte from immutable v1.37 Git evidence.
- Focused tests passed 24/24 and workspace typecheck passed 27/27.
- Stub, forbidden-loader, direct-engine, and formation/candidate artifact scans found no new prohibited surface.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-07-29*
