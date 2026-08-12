---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: 36
subsystem: measurement-policy
tags: [numeric-gates, report-states, claim-lint, canonical-json, non-authorizing]
requires:
  - phase: 262-35
    provides: exact study/opportunity/accounting policy and non-authorizing study-policy root
provides:
  - profile-neutral starting gates with exact denominators and provenance
  - orthogonal process/current-rules/formation/holdout report grammar
  - ordered non-compensating gate evaluation and bounded oracle-relative claim lint
  - canonical non-authorizing pre-search measurement policy artifact
affects: [262-37, 262-39, MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09]
tech-stack:
  added: []
  patterns: [exact-key validation, denominator-bound gates, exhaustive state tables, ordered hard gates]
key-files:
  created:
    - scripts/lib/v1-38-measurement.ts
    - scripts/evaluate-v1-38-measurement.test.ts
    - .planning/artifacts/v1.38-pre-search-measurement-policy.json
    - .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-36-SUMMARY.md
  modified: []
key-decisions:
  - "Use the activation-prompt values when no bounded profile-neutral calibration replacement exists, with exact denominator and root identities on every gate."
  - "Enumerate 16 valid report-state tuples so process, current-rules, formation, and contamination outcomes remain independent and fail closed."
  - "Keep Advanced-library evidence regression-only and require every permitted robustness claim to name frozen oracle, budget, population, condition, identity, and version scope."
patterns-established:
  - "Gate provenance: only declared fallback or bounded profile-neutral calibration may set a value; candidate, formation, holdout, and stopped-route outcomes are rejected."
  - "Ordered interpretation: integrity failures stop before empirical evaluation, and no average or composite can compensate for a failed hard gate."
requirements-completed: [MEAS-05, MEAS-06, MEAS-07, MEAS-08, MEAS-09]
coverage:
  - id: D1
    description: "Finite source, runtime, population, diversity, finalist, response, probe, red-team, and regression gates bind exact denominators and allowed provenance."
    requirement: MEAS-05, MEAS-06, MEAS-07
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-measurement.test.ts#Phase 262 profile-neutral measurement gates"
        status: pass
    human_judgment: false
  - id: D2
    description: "Advanced evidence is regression-only and claim lint requires complete oracle-relative qualification."
    requirement: MEAS-08
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-measurement.test.ts#allows only qualified oracle-relative claims and rejects overclaim or omission"
        status: pass
    human_judgment: false
  - id: D3
    description: "Exhaustive orthogonal report states and ordered non-compensating gate evaluation preserve honest failure and contamination outcomes."
    requirement: MEAS-09
    verification:
      - kind: unit
        ref: "scripts/evaluate-v1-38-measurement.test.ts#Phase 262 orthogonal reporting and non-compensating interpretation"
        status: pass
      - kind: integration
        ref: "pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check"
        status: pass
    human_judgment: false
duration: 7min
completed: 2026-08-12
status: complete
---

# Phase 262 Plan 36: Profile-Neutral Measurement and Claim Policy Summary

**Exact-denominator starting gates, exhaustive orthogonal report states, and oracle-relative claim lint now freeze interpretation without consuming empirical output or granting admission, custody, formation, holdout, live-work, Phase 263, or production authority.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-08-12T21:50:10Z
- **Completed:** 2026-08-12T21:57:10Z
- **Tasks:** 2/2
- **Files modified:** 3 implementation/test/artifact files plus this summary

## Accomplishments

- Froze the 64 KiB hard source cap, preferred under-48 KiB target, under-5 ms p99 benchmark target, 12-Strategy/six-family/five-core population, three distinct finalists, two above-55% response iterations, above-60% probe result, below-60% fresh-red-team or declared adaptation branch, and above-70% Advanced regression threshold.
- Bound every value to a denominator type, replication unit, eligible-inventory root, implementation root, benchmark identity, hardware identity, and exact fallback or bounded calibration provenance.
- Rejected late, ambiguous, non-finite, root-mismatched, candidate-informed, formation-informed, holdout-informed, and stopped-route-informed threshold inputs.
- Enumerated exactly 16 valid combinations across process status, current-rules outcome, formation outcome, and holdout status, including honest current-rules failure, no robust pure finalist, later formation rejection, and terminal contamination.
- Evaluated seven integrity gates before empirical gates, made attractive composites irrelevant to hard-gate outcomes, and kept every returned downstream-authority field false.
- Required oracle-relative claims to name frozen oracles, budgets, populations, conditions, identities, and versions while rejecting threshold softening, selective omission, production authorization, solved-game, exact-exploitability, optimality, permanent-balance, unexploitable, Nash, and meta-free language.
- Rendered canonical policy root `sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95`, bound to study-policy root `sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17`, with blocked ADMIT-03, unmet SEAL-01, and six explicit false authority capabilities.

## Task Commits

Each TDD gate was committed independently:

1. **Task 1 RED: exact-denominator starting-gate tests** - `b2b07f2a` (test)
2. **Task 1 GREEN: profile-neutral gate freeze** - `bcd9401b` (feat)
3. **Task 2 RED: report-state, hard-gate, claim, and artifact tests** - `0f22f478` (test)
4. **Task 2 GREEN: bounded reports, claims, and canonical artifact** - `c77c4c3d` (feat)

## Files Created/Modified

- `scripts/lib/v1-38-measurement.ts` - Exact-denominator freeze, ordered gate evaluator, exhaustive report-state validator, bounded claim lint, and canonical artifact builder.
- `scripts/evaluate-v1-38-measurement.test.ts` - Table, mutation, non-compensation, overclaim, privacy, and deterministic-render proof.
- `.planning/artifacts/v1.38-pre-search-measurement-policy.json` - Canonical MEAS-05..09 policy with explicit admission, custody, and authority denials.

## Automated Evidence

- Focused Vitest: 8 passed, 0 failed.
- Dependency-revision boundary monitor: `passed_absence`; 148 protected paths, three new production sources scanned, matrix admission `blocked`, downstream authority `denied`.
- Standalone TypeScript check: passed for the measurement module and focused test.
- Artifact regeneration: byte-identical; 12 gates, 16 report states, six false authority fields.
- Privacy and forbidden-input scan: zero StrategyMemory, SoldierMemory, objective payload, host-path, raw-diagnostic, candidate, formation, holdout-preimage, or stopped-route terms in the artifact.

## Decisions Made

- The preferred source threshold is strict under 49,152 bytes, while the canonical hard cap remains 65,536 bytes; direct p99 and score thresholds retain their strict comparator semantics.
- Profile-neutral calibration may replace a named gate only with the exact predeclared denominator, inventory root, implementation root, benchmark/hardware identity, calibration root, and justification; all unmodified gates retain the activation-prompt fallback.
- Holdout contamination remains a separate terminal field rather than rewriting process, current-rules, or formation outcomes.
- A process-valid empirical failure remains publishable evidence, but it never grants downstream authority.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed standalone TypeScript narrowing gaps**
- **Found during:** Task 1 GREEN verification
- **Issue:** Composite exact-key checks did not retain narrowing for unknown replacement arrays and values under standalone TypeScript compilation.
- **Fix:** Preserved validated records, arrays, numeric values, and gate identifiers in explicitly narrowed local bindings.
- **Files modified:** `scripts/lib/v1-38-measurement.ts`
- **Verification:** Focused Vitest, boundary monitor, and standalone TypeScript command pass.
- **Committed in:** `bcd9401b`

---

**Total deviations:** 1 auto-fixed (1 Rule 1 implementation bug).  
**Impact on plan:** The fix tightened type safety only; it did not change thresholds, evidence scope, authority, protected history, or runtime behavior.

## Issues Encountered

None beyond the auto-fixed TypeScript narrowing issue.

## Authentication Gates

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None.

## Live Truth Preserved

Route 5 remains `calibration_stopped`; no stopped-route timing or outcome influenced a threshold. Fresh charged/accepted evidence remains 0/0, ADMIT-03 remains blocked, SEAL-01 remains unmet, and candidate search, Phase 263, formation materialization, holdout opening, live work, and production authorization remain false. No candidate output, profile result, holdout result, provider/database work, protected-history change, or frozen replay-manifest repair was created or consumed.

## Next Phase Readiness

Plan 262-37 may consume the non-authorizing study and measurement policies for profile-agnostic classifier/protocol work. It receives no empirical admission, custody, candidate-search, formation, holdout, Phase 263, live-work, or production authority.

## Self-Check: PASSED

All four created implementation/test/artifact/summary files exist; commits `b2b07f2a`, `bcd9401b`, `0f22f478`, and `c77c4c3d` resolve in Git; focused tests, strict typecheck, byte-stable regeneration, privacy scan, and protected-history boundary monitor pass.
