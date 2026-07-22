---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "01"
subsystem: runtime-abi-contract
tags: [canonical-json, budgets, failure-ownership, identity, calibration]
requires:
  - phase: 257-19
    provides: Activated one-kernel authority and immutable current semantic tuple
  - phase: 257-20
    provides: Immutable insertion-ordered v1.16 wire golden and independent Go verifier
provides:
  - Closed hash-pinned calibration input manifest with privacy and historical denylist
  - Executable exact canonical JSON ceilings, field caps, units, and boundary probes
  - Inactive typed runtime ABI, service, and receipt v1.17 successor contract
  - Exact budget, failure ownership, identity, migration, and uncertified-lane registry
affects: [258-02, 258-03, 258-04, 258-06, 258-12, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Closed tracked input manifests validated before evaluator reads
    - Candidate registries checked directly against executable calibration receipts
    - Missing equivalent meters or executable pins produce machine-readable uncertified status
key-files:
  created:
    - scripts/calibrate-v1-37-runtime-abi.ts
    - scripts/calibrate-v1-37-runtime-abi.test.ts
    - packages/spec/artifacts/runtime-abi-v1.17-calibration-inputs.json
    - packages/spec/src/runtime-abi-v1-17.ts
    - packages/spec/src/runtime-abi-v1-17.test.ts
    - packages/spec/artifacts/runtime-abi-v1.17-contract.json
    - .planning/artifacts/v1.37-runtime-abi-calibration.json
    - .planning/artifacts/v1.37-runtime-abi-calibration.md
  modified: []
key-decisions:
  - "The v1.17 global parser ceilings are 8 MiB raw UTF-8, depth 64, 262144 nodes, 6 MiB decoded string UTF-8, and 65536 entries per array or object."
  - "Per-Match budget arithmetic binds 20 selectActivations and 240 SoldierBrain invocations while preflight remains a separate non-Match budget domain."
  - "The v1.17 registry is candidate-only and every current lane remains uncertified until every equivalent meter and exact executable identity pin is proved."
  - "v1.16 insertion-ordered bytes, Go verification, and migration 0017 remain immutable and dispatchable under their original semantics."
patterns-established:
  - "Generated ABI contracts fail when their calibrated ceilings, lower field caps, or input-manifest hash diverge."
  - "Identity hashing uses fixed full domain tags plus unsigned 64-bit big-endian frames and SHA-256."
requirements-completed: [RABI-01, RABI-03, RABI-06, RABI-07, RABI-08]
coverage:
  - id: D1
    description: "A closed tracked manifest and executable evaluator freeze exact parser ceilings, lower field caps, byte units, observed maxima, and typed boundary probes."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: "scripts/calibrate-v1-37-runtime-abi.test.ts (11/11)"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/calibrate-v1-37-runtime-abi.ts --write --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "The inactive v1.17 registry freezes mutually exclusive outcomes, exact invocation/Match/preflight budgets, and fail-closed equivalent-meter posture."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-abi-v1-17.test.ts (7/7)"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D3
    description: "Length-framed identity domains and the atomic migration map preserve every protected v1.16 byte while keeping local tool versions and incomplete lanes uncertified."
    requirement: RABI-08
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-abi-v1-17.test.ts#covers every locked decision and preserves all protected v1.16 bytes during generation"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/calibrate-v1-37-runtime-abi.ts --check"
        status: pass
    human_judgment: false
duration: 17min
completed: 2026-07-13
status: complete
---

# Phase 258 Plan 01: Runtime ABI Calibration and Contract Freeze Summary

**A closed executable calibration now governs one inactive v1.17 canonical JSON, budget, ownership, and identity registry while v1.16 evidence remains byte-immutable.**

## Performance

- **Duration:** 17 min
- **Started:** 2026-07-13T23:17:09-04:00
- **Completed:** 2026-07-13T23:33:33-04:00
- **Tasks:** 2 TDD tasks
- **Files modified:** 8

## Accomplishments

- Froze a 13-row tracked, non-symlinked, hash/length-pinned manifest; only current-valid contract and fixture rows establish maxima, while historical controls and hostile probes cannot.
- Calibrated 8 MiB raw input, depth 64, 262,144 nodes, 6 MiB decoded strings, and 65,536 entries per array/object with N-1/N/N+1 evidence and typed depth-3000 rejection.
- Minted an inactive runtime ABI/service/receipt v1.17 registry with exclusive outcomes, exact per-method/Match/preflight vectors, complete D-01..D-16 ownership, and fail-closed certification assessment.
- Bound original/normalized source, artifact, executable, tuple, policy, corpus, budget, canonical profile, and evidence identities to fixed length-framed SHA-256 domains while preserving six protected v1.16 inputs exactly.

## Task Commits

1. **Task 1 RED: Add failing runtime ABI calibration gates** — `1ad355c` (test)
2. **Task 1 GREEN: Calibrate canonical JSON ceilings** — `047ac9b` (feat)
3. **Task 2 RED: Add failing successor ABI contract gates** — `28a3655` (test)
4. **Task 2 GREEN: Freeze runtime ABI v1.17 contract** — `37a8e37` (feat)
5. **Review fix: Bind registry to calibration receipt** — `151148c` (fix)

## Verification

- Calibration tests: 11/11 passed; successor contract tests: 7/7 passed.
- Both `--write --check` and pure `--check` calibration/contract gates passed.
- Spec typecheck passed and the complete spec package suite passed 73/73.
- Protected `.planning/config.json` and consolidated-spec byte/binary-diff hashes remained exactly unchanged; all six v1.16 golden/verifier/migration hashes matched the frozen registry.

## Decisions Made

- Calibration outputs contain measurements, hashes, classes, and reasons but never copy raw input payloads, private runtime logs, toolchain paths, or local tool versions.
- Counted certification requires every exact meter and executable identity pin; omission is always `uncertified`.
- The successor remains inactive until Plan 258-14; Plan 01 changes no package, gameplay path, current ABI constant, current serializer, Go verifier, or persistence migration.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Correctness] Generated contract initially lacked an executable calibration parity edge.**
   - **Found during:** Post-task diff review
   - **Issue:** Contract and calibration tests independently froze the same values, but the evaluator did not yet reject cross-artifact ceiling, field-cap, or manifest-hash drift.
   - **Fix:** Added direct `RUNTIME_ABI_V1_17` parity checks before contract generation or validation.
   - **Files modified:** `scripts/calibrate-v1-37-runtime-abi.ts`
   - **Verification:** Combined 18/18 focused tests, artifact check, and spec typecheck passed.
   - **Committed in:** `151148c`

**Total deviations:** 1 auto-fixed (1 correctness). **Impact:** Stronger single-registry enforcement with no scope expansion or activation.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-02 can generate the byte-exact positive/negative corpus against one exact parser profile. Later plans have no discretion to reinterpret units, failure owners, identity domains, migration posture, or v1.16 bytes.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-13*
