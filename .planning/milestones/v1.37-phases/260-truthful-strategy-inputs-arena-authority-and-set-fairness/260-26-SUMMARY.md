---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "26"
subsystem: runtime-service
tags: [strategy-revalidation, runtime-v1.19, provider-execution, privacy, fail-closed]

requires:
  - phase: 260-04
    provides: Immutable revision-scoped runtime-v1.19 persistence evidence substrate
  - phase: 260-10
    provides: Exact candidate observation transport and runtime-service dispatch
provides:
  - Real revision-specific six-probe v1.19 provider execution service
  - Deterministic privacy-safe receipt bound to exact revision, provider lane, candidate pins, and execution roots
  - Fail-closed rejection of inferred, substituted, incomplete, malformed, player-violating, and system-failed claims
affects: [260-20, strategy-revision-revalidation, runtime-service]

tech-stack:
  added: []
  patterns: [exact-byte admission, explicit-candidate-pins, hostile-provider-output, fixed-receipt-allowlist]

key-files:
  created:
    - apps/runtime-service/src/revalidate-strategy-revision-v1-19.ts
    - apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts
  modified: []

key-decisions:
  - "Revalidation executes four initiative combinations and both activation-Advance states through the existing candidate observation dispatch; partial or reordered probe sets are inadmissible."
  - "The service hashes original source and exact artifact bytes before execution and binds the reviewed inactive certificate to the same language, provider, and lane."
  - "Only complete real-service success emits an admissible receipt; player violations and system failures preserve classification but receive no receipt."
  - "Malformed provider output is hostile input and always collapses to a generic, non-retryable evidence-mismatch system failure without diagnostics."

requirements-completed: [STRAT-03, STRAT-04]

coverage:
  - id: D1
    description: "One immutable revision executes the complete v1.19 observation matrix through its exact hostile provider lane and produces deterministic identity-bound roots."
    requirement: STRAT-03
    verification:
      - kind: integration
        ref: "apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts#runs the complete exact observation matrix in the revision's real provider lane"
        status: pass
      - kind: integration
        ref: "pnpm exec vitest run apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts apps/runtime-service/src/execute-match-v1-19.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Changed revision bytes, sibling/old/current certificate claims, compile-only or synthetic evidence, and partial probes cannot produce admissible D-04 evidence."
    requirement: STRAT-03
    verification:
      - kind: security
        ref: "apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts#rejects provider claims and pre-execution substitutions"
        status: pass
    human_judgment: false
  - id: D3
    description: "Success, player violation, and system failure remain distinct while malformed provider output and recursive poison remain receipt- and diagnostic-safe."
    requirement: STRAT-04
    verification:
      - kind: security
        ref: "apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts#preserves player violation and system failure without creating admissible evidence"
        status: pass
      - kind: security
        ref: "apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts#fails closed on malformed provider output"
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-07-17
status: complete
---

# Phase 260 Plan 26: Revision-Specific Real v1.19 Revalidation Summary

**Immutable Strategy Revisions now earn candidate compatibility only by completing six exact v1.19 observations in their own reviewed real provider lane; all other claims fail closed without an admissible receipt.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-07-17T06:59:00Z
- **Completed:** 2026-07-17T07:13:00Z
- **Tasks:** 2 TDD tasks plus 2 review hardenings
- **Files modified:** 2

## Accomplishments

- Added a thin runtime-service revalidation boundary over the existing v1.19 candidate transport. It admits exactly four initial/round initiative combinations and both `hasAdvancedThisActivation` states, then invokes the supplied service-owned hostile provider lane for every probe.
- Recomputed original source and artifact hashes from restricted exact bytes, required immutable revision identity, exact language/provider/lane ownership, explicit corpus-v3/trace-v4/Workshop-v1.19 pins, exact successor tuple, runtime/toolchain/adapter/containment roots, and a reviewed inactive v1.19 certificate bound to that same lane.
- Produced one frozen deterministic allowlisted receipt with request, result, evidence, and receipt roots. Raw source, artifact bytes, outputs, memories, objectives, diagnostics, and host data never cross the returned boundary.
- Rejected source/artifact drift, sibling evidence, old ABI/tuple/certificate, current-registry substitution, partial or duplicate probes, compile-only/synthetic execution, wrong lane/provider, guest non-start/non-completion, malformed envelopes, player violation, and system failure as admissible evidence.

## Task Commits

1. **Task 1 RED: real revision receipt contract** — `82020f6`
2. **Task 1 GREEN: exact six-probe provider execution** — `f7ed5e8`
3. **Task 2 RED: substitution and inference matrix** — `3b8515c`
4. **Task 2 GREEN: fail-closed exact candidate pins** — `d01fbec`
5. **Review RED: malformed hostile provider envelopes** — `ca50d07`
6. **Review GREEN: total fail-closed provider boundary** — `647f489`
7. **Review RED: certificate lane substitution** — `d417923`
8. **Review GREEN: certificate language/provider/lane binding** — `35819c2`

## Files Created/Modified

- `apps/runtime-service/src/revalidate-strategy-revision-v1-19.ts` — Exact revision/pin/probe admission, real provider orchestration, evidence validation, deterministic roots, and privacy-safe three-way result.
- `apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts` — Success, idempotency, six-probe completeness, substitution/inference, malformed output, three-way failure, and privacy matrix.

## Decisions Made

- Complete observation revalidation is six explicit requests, not a compile check or one generic invocation. This catches omitted initiative combinations and both values of scheduler-owned Advance state even when Strategy source ignores them.
- The reviewed certificate is not merely hash-shaped: its declared language, provider, and lane must equal the immutable revision's selected lane, preventing sibling or language-level evidence inheritance.
- Provider output is untrusted data. Any malformed shape or thrown inspection fails closed as `REVALIDATION_EVIDENCE_MISMATCH`, returns no receipt, and exposes no provider detail.
- Exact reruns are deterministic because receipts contain no wall-clock or host-local values; inventory orchestration can compare receipt bytes and roots idempotently.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Malformed provider envelopes could escape the service boundary**
- **Found during:** Post-task code review
- **Issue:** The typed provider dependency could return malformed runtime data at execution time, causing property-access exceptions or a non-boolean retry field to escape the fail-closed contract.
- **Fix:** Wrapped the public boundary in total failure conversion and added runtime validation for player/system envelopes before projecting them.
- **Files modified:** Both Plan-26 files.
- **Verification:** Five malformed-envelope cases pass without throws or private data.
- **Committed in:** `ca50d07`, `647f489`

**2. [Rule 2 - Missing critical functionality] Certificate roots were not explicitly lane-scoped**
- **Found during:** Post-task security review
- **Issue:** A valid-looking inactive v1.19 certificate hash could be supplied for a sibling language/provider lane.
- **Fix:** Required explicit certificate language, provider, and lane fields and exact equality with the immutable revision.
- **Files modified:** Both Plan-26 files.
- **Verification:** Sibling language, provider, and lane substitutions fail before provider execution.
- **Committed in:** `d417923`, `35819c2`

---

**Total deviations:** 2 auto-fixed missing critical integrity safeguards.
**Impact:** Both changes strengthen the declared fail-closed and revision-specific boundary without expanding execution ownership or activating v1.19.

## Issues Encountered

None.

## User Setup Required

None.

## Verification

- Focused Plan-26 plus candidate dispatch: 2 files, 34 tests passed.
- Full `@cowards/runtime-service` test suite: passed serially with one worker.
- Runtime-service typecheck: passed.
- Runtime-service ESLint: passed.
- Runtime-service build: passed.
- Protected baseline: passed at `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Stub scan and `git diff --check`: passed.

## TDD Gate Compliance

- Task 1 RED `82020f6` precedes GREEN `f7ed5e8`.
- Task 2 RED `3b8515c` precedes GREEN `d01fbec`.
- Both review hardenings also use RED/GREEN commit pairs.

## Next Phase Readiness

- Plan 260-20 can use this service for each frozen inventory row and persist only exact successful receipt roots through the Plan-04 append-only evidence API.
- Failed, unsupported, player-violating, or system-failed revisions receive explicit non-counted dispositions and cannot inherit sibling, language-level, old, current-registry, or synthetic evidence.
- The service remains candidate-only; current Phase-259 selectors, certificates, and execution defaults are unchanged.

## Self-Check: PASSED

- Both planned files exist and all eight Plan-26 commits are present.
- Focused, full-package, typecheck, lint, build, privacy, deterministic rerun, malformed-envelope, and protected-baseline gates pass.
- Only the two protected pre-existing user files remain dirty after concurrent plan work is excluded.

---
*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Completed: 2026-07-17*
