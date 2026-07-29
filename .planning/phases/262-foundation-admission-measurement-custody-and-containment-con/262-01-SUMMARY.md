---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "01"
subsystem: integrity
tags: [admission, canonical-json, git-tag, runtime-authority, fail-closed]

requires:
  - phase: v1.37-release-closure
    provides: immutable audit, archive commit, annotated tag, post-tag checker, and selected semantic/runtime authority
provides:
  - exact machine-resolved v1.37 predecessor admission evaluator
  - typed fail-closed dispositions for stale, missing, mismatched, incompatible, or drifting authority
  - immutable public-safe v1.38 foundation admission receipt
affects: [262-02, phase-263, v1.38-foundation-contract]

tech-stack:
  added: []
  patterns:
    - exact-key bounded authority admission
    - domain-separated canonical roots
    - immutable tag authority with separately bound correction lineage
    - IPC-free TypeScript subprocess execution through the Node tsx import hook

key-files:
  created:
    - scripts/evaluate-v1-38-foundation-contract.test.ts
    - scripts/lib/v1-38-foundation-admission.ts
    - .planning/artifacts/v1.38-foundation-admission.json
  modified:
    - scripts/check-v1-37-audit-reproduction.ts

key-decisions:
  - "Resolve the v1.37 archive and annotated tag from Git, then independently join them to the correction record rather than trusting a copied release label."
  - "Bind the full tagged runtime authority, current generated semantic authority, retained audit reproduction, source digests, and non-semantic correction lineage under distinct domain-separated roots."

patterns-established:
  - "Admission results are a closed passed_exact or stopped_integrity_foundation union; stopped results expose only a stable reason, false repair authorization, and bounded input digest."
  - "Generated public receipts contain only scalar identities, hashes, booleans, and a content-addressed root."

requirements-completed: [ADMIT-01, ADMIT-02, ADMIT-04]

coverage:
  - id: D1
    description: "Exact v1.37 audit, archive, annotated tag, post-tag result, and correction lineage join"
    requirement: ADMIT-01
    verification:
      - kind: integration
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#admission accepts only the resolved immutable v1.37 authority"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exact selected semantic tuple and runtime/conformance authority binding"
    requirement: ADMIT-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#admission stops for semantic tuple drift and runtime authority drift"
        status: pass
    human_judgment: false
  - id: D3
    description: "Typed fail-closed stop without waiver, repair, tag mutation, or authoritative root"
    requirement: ADMIT-04
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-foundation-contract.test.ts#admission stopped results expose no waiver, repair, tag mutation, or root"
        status: pass
    human_judgment: false
  - id: D4
    description: "Byte-stable public-safe immutable admission receipt"
    requirement: ADMIT-01
    verification:
      - kind: integration
        ref: "node --import tsx scripts/lib/v1-38-foundation-admission.ts --check"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-07-29
status: complete
---

# Phase 262 Plan 01: Exact v1.37 Foundation Admission Summary

**Machine-resolved v1.37 audit, archive, tag, post-tag, semantic, runtime, source, and correction authority joined into a deterministic fail-closed v1.38 admission receipt**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-29T00:17:51Z
- **Completed:** 2026-07-29T00:35:18Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added a mutation-heavy shared Wave 0 admission suite that pins released v1.37 identities only in tests and derives the repository root from `import.meta.url`.
- Implemented an exact-key, bounded evaluator that resolves live Git/tag/checker evidence and joins it to the selected semantic/runtime authority without repair, waiver, normalization, or tag mutation.
- Generated a deterministic public-safe receipt rooted at `sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c`.
- Made retained audit reproduction deterministic in restricted clean runners by replacing the tsx CLI IPC path with Node's `--import tsx` hook.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the Wave 0 admission and mutation-test harness** - `8d3f3161` (test)
2. **Task 2: Implement the exact predecessor join and immutable receipt** - `d3893cc2` (feat)
3. **Post-wave correction: Make audit reproduction IPC-free** - `d5bfb7e2` (fix)

## Files Created/Modified

- `scripts/evaluate-v1-38-foundation-contract.test.ts` - Shared Phase 262 admission selector with exact-pass, mutation, bounded-input, and safe-stop coverage.
- `scripts/lib/v1-38-foundation-admission.ts` - Machine authority resolver, exact admission evaluator, domain-separated roots, and immutable write/check command.
- `scripts/check-v1-37-audit-reproduction.ts` - Executes the same retained historical source through Node's tsx import hook without a CLI IPC server.
- `.planning/artifacts/v1.38-foundation-admission.json` - Public-safe content-addressed admission receipt.

## Decisions Made

- The correction record provides the independent archive identity and exact two-commit non-semantic correction lineage; the Git tag target must join it exactly.
- Runtime authority is derived from the tagged v1.37 Strategy foundation artifact while current semantic authority is resolved from the generated package owner, so drift between released and current authority stops.
- Source bindings include the admission implementation itself but exclude the generated receipt, avoiding a circular self-digest while still binding the checker.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed tsx CLI IPC dependence from retained audit reproduction**

- **Found during:** Post-wave clean verification after Task 2
- **Issue:** `runV137AuditReproductionGate` spawned `pnpm exec tsx`, whose CLI opens a local IPC server. Restricted clean runners reject that socket with `listen EPERM`, so suite setup stopped with `V137_AUDIT_REPRODUCTION_FAILED` and skipped all admission tests.
- **Fix:** Invoke the exact same immutable historical TypeScript source with `process.execPath --import tsx`, which uses the installed loader without opening the CLI IPC server. Added a regression that removes `PATH` and still requires the exact audit receipt.
- **Files modified:** `scripts/check-v1-37-audit-reproduction.ts`, `scripts/evaluate-v1-38-foundation-contract.test.ts`, `.planning/artifacts/v1.38-foundation-admission.json`
- **Verification:** Exact admission command passed twice from a clean working tree with 17/17 tests; artifact check and 27/27 typecheck tasks passed.
- **Committed in:** `d5bfb7e2`

---

**Total deviations:** 1 auto-fixed (1 blocking issue)
**Impact on plan:** The correction changes only the TypeScript loader invocation. It preserves the exact historical source bytes, observation analyzer, authority joins, and fail-closed behavior.

## Issues Encountered

- The first verification incorrectly treated the tsx CLI socket failure as sandbox-only and relied on an elevated rerun. Clean post-wave verification exposed that as a reproducibility defect. The retained gate now passes without elevation or an alternate authority path.

## Known Stubs

None.

## User Setup Required

None - no external custody inputs or service configuration are required by this plan.

## Next Phase Readiness

- Plan 262-02 can bind this admission root before reproducing the historical current-rules matrix through the supervised runtime path.
- No formation, profile, candidate, prompt, cache, trace, replay, or result artifact was created.
- There are no blockers or custody dependencies for the next plan.

## Self-Check: PASSED

- Created files exist: test harness, admission evaluator, and immutable receipt.
- Task/fix commits exist: `8d3f3161`, `d3893cc2`, and `d5bfb7e2`.
- The exact focused admission command passed twice from a clean working tree with 17/17 tests each time.
- Artifact check passed with admission root `sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c`.
- Workspace typecheck passed 27/27 tasks.

---
*Phase: 262-foundation-admission-measurement-custody-and-containment-con*
*Completed: 2026-07-29*
