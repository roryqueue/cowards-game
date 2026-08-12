---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 35
subsystem: measurement-policy
tags: [study-contract, opportunity-accounting, canonical-json, fail-closed, non-authorizing]
requires:
  - phase: 262-34
    provides: capability-separated acceptance, literal blocked ADMIT-03, and cross-wave boundary monitoring
provides:
  - exact adapted-metagame study, contrast, cell, split, opponent, and selection schemas
  - structural non-fungible opportunity vector and fail-closed two-ledger accounting closure
  - canonical ready-but-non-authorizing pre-search study policy artifact
affects: [262-36, 262-39, MEAS-01, MEAS-02, MEAS-03, MEAS-04]
tech-stack:
  added: []
  patterns: [exact-key readonly schemas, domain-separated canonical roots, charged-versus-accepted ledgers]
key-files:
  created:
    - scripts/lib/v1-38-study-contract.ts
    - scripts/evaluate-v1-38-study-contract.test.ts
    - .planning/artifacts/v1.38-pre-search-study-policy.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-35-SUMMARY.md
  modified: []
key-decisions:
  - "Keep fixed-policy transfer mechanically secondary-screening-only and ineligible for primary evidence or finalist selection."
  - "Represent every resource as a distinct bounded opportunity dimension; no fungible aggregate compute scalar exists."
  - "Make policy readiness explicit while retaining blocked admission, unmet custody, and false downstream authority fields."
patterns-established:
  - "Two-ledger closure: every allocation remains charged while only unique process-valid complete cells enter accepted evidence."
  - "Self-bound policy artifact: schema, source, test, input-policy, and generator bytes all affect domain-separated roots."
requirements-completed: [MEAS-01, MEAS-02, MEAS-03, MEAS-04]
coverage:
  - id: D1
    description: "Exact pre-search estimand, paired contrasts, conditions, arenas, splits, opponents, and secondary-only transfer policy."
    requirement: MEAS-01
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-study-contract.test.ts#Phase 262 pre-search study and opportunity contract"
        status: pass
    human_judgment: false
  - id: D2
    description: "Complete bounded structural opportunity vector without a fungible aggregate scalar."
    requirement: MEAS-02
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-study-contract.test.ts#keeps every opportunity dimension structural, bounded, and non-fungible"
        status: pass
    human_judgment: false
  - id: D3
    description: "Frozen complete-cell, stopping, response-admission, finalist, portfolio, robust-pure, and bounded-claim rules."
    requirement: MEAS-03
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-study-contract.test.ts#accepts only the complete primary study, paired contrasts, and secondary transfer role"
        status: pass
    human_judgment: false
  - id: D4
    description: "Fail-closed charged-versus-accepted accounting excludes failures, duplicates, missing cells, and unproved joins."
    requirement: MEAS-04
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-study-contract.test.ts#Phase 262 two-ledger accounting and study artifact"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
duration: 9min
completed: 2026-08-12
status: complete
---

# Phase 262 Plan 35: Pre-Search Study and Accounting Policy Summary

**Exact adapted-metagame study schemas and two-ledger accounting now render a content-addressed ready policy that grants no admission, custody, candidate, formation, Phase 263, live-work, or production authority.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-08-12T21:37:06Z
- **Completed:** 2026-08-12T21:46:20Z
- **Tasks:** 2/2
- **Files modified:** 3 implementation/test/artifact files plus this summary

## Accomplishments

- Froze the primary separately adapted fixed-factory estimand, three paired contrasts, scoring, four fairness conditions, semantic arena identities, all four splits and opponent fields, matched root-seed blocks, complete-cell identity, stopping, selection, and oracle-relative claim scope.
- Defined every opportunity unit independently, including candidate/slot/round/search/teacher/distillation/Match/model/human/replay/cache/retry/hardware/runtime/source/objective/memory/output dimensions, with exact-key and bounded validation and no aggregate scalar.
- Enforced charged-versus-accepted closure across accepted, rejected, invalid, duplicate, conflicting, player-violating, system-failed, retried, unfilled, and unused allocations.
- Rendered canonical policy root `sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17` with explicit blocked ADMIT-03, unmet SEAL-01, and five false downstream authority capabilities.

## Task Commits

Each TDD gate was committed independently:

1. **Task 1 RED: study and opportunity contract tests** - `df72ad10` (test)
2. **Task 1 GREEN: exact study and opportunity schemas** - `524f0491` (feat)
3. **Task 2 RED: accounting and artifact mutation tests** - `716a44c3` (test)
4. **Task 2 GREEN: accounting closure and canonical policy artifact** - `1fd02618` (feat)

## Files Created/Modified

- `scripts/lib/v1-38-study-contract.ts` - Exact study/opportunity/accounting schemas, closure validator, canonical policy builder, and renderer.
- `scripts/evaluate-v1-38-study-contract.test.ts` - Unit/property/mutation proof for complete fields, non-fungibility, two ledgers, source-bound roots, and denials.
- `.planning/artifacts/v1.38-pre-search-study-policy.json` - Canonical non-authorizing MEAS-01..04 policy artifact.

## Automated Evidence

- Focused Vitest: 6 passed, 0 failed.
- Dependency-revision boundary monitor: `passed_absence`; 148 protected paths, two new sources scanned, matrix admission `blocked`, downstream authority `denied`.
- Standalone TypeScript check: passed for the study contract and focused test.
- Artifact regeneration: byte-identical with exact source, test, canonical input-policy, and generator bytes.
- Root mutation proof: source, test, or valid input-policy mutation changes the policy root; forbidden candidate/profile/holdout/route fields fail exact input validation.

## Decisions Made

- Semantic arena cells use the two distinct canonical v1.37 geometry hashes; the Smoke/Open Field label alias cannot create an extra cell.
- The opportunity artifact freezes structural dimensions only; numeric gate values and denominator provenance remain owned by Plan 262-36.
- A conflicting duplicate is charged and terminal, while an identical duplicate remains charged but excluded; neither can become an accepted cell.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed standalone TypeScript narrowing error**
- **Found during:** Task 1 GREEN verification
- **Issue:** Loop-based integer validation did not narrow the later comparison of accepted and unfilled response-slot fields under standalone TypeScript checking.
- **Fix:** Preserved the validated numeric values in explicit local bindings before comparing them.
- **Files modified:** `scripts/lib/v1-38-study-contract.ts`
- **Verification:** The exact focused suite, boundary monitor, and standalone TypeScript command pass.
- **Committed in:** `524f0491`

---

**2. [Rule 1 - Bug] Corrected stale and invalid generated planning state**
- **Found during:** Plan close-out
- **Issue:** The state helper advanced the plan but wrote `percent: 0` and retained stale Plan 262-34/262-35 narrative and successor fields.
- **Fix:** Corrected STATE and ROADMAP to 30/35, 86%, Plan 262-36 next, and the exact ready policy root while preserving blocked admission and unmet custody.
- **Files modified:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Verification:** Frontmatter, progress text, successor markers, plan checklist, and roadmap table all agree.
- **Committed in:** Plan metadata commit

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs).  
**Impact on plan:** Both fixes preserve the planned policy semantics and truthful fail-closed metadata; neither alters authority, scope, or protected history.

## Issues Encountered

None beyond the auto-fixed TypeScript narrowing issue.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Live Truth Preserved

Route 5 remains `calibration_stopped`; no stopped-route outcome calibrated policy. Fresh charged/accepted evidence remains 0/0, ADMIT-03 remains blocked, SEAL-01 remains unmet, and no authorization artifact, candidate output, formation state, holdout opening, provider/database work, or product path was created or consumed.

## Next Phase Readiness

Plan 262-36 may bind its profile-neutral numeric and claim policy to this study-policy root and exact opportunity identities. It receives no matrix admission, custody, candidate-search, Phase 263, formation, live-work, or production authority.

## Self-Check: PASSED

All three created implementation/test/artifact files exist; commits `df72ad10`, `524f0491`, `716a44c3`, and `1fd02618` resolve in Git; the exact focused tests, boundary monitor, standalone TypeScript check, artifact regeneration, root mutations, and explicit denial projection pass.
