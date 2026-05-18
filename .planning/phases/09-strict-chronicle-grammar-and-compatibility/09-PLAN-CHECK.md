# Phase 9 Plan Check: BLOCK

**Checked:** 2026-05-18
**Phase:** Strict Chronicle Grammar and Compatibility
**Result:** BLOCK

## Summary

Phase 9 planning is close, but it should not execute yet. The five-plan wave structure covers GRAM-01 through GRAM-08 at the manifest level, dependencies are acyclic, same-wave file ownership is safe, and the non-negotiables are mostly respected: grammar remains in `packages/replay`, no rules move into React, and no Strategy execution is planned in the web/API process.

Docker/local service setup is not required for this phase. The phase is package-level replay/spec/web validation work, and `09-RESEARCH.md` explicitly records Docker as available but not required.

## Blockers

### 1. [research_resolution] `09-RESEARCH.md` still has unresolved Open Questions

- **Severity:** BLOCKER
- **File:** `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-RESEARCH.md`
- **Location:** `## Open Questions`
- **Problem:** The research file has an `## Open Questions` section without a `(RESOLVED)` suffix, and the listed questions are not marked `RESOLVED`. The plans appear to choose answers, but the research artifact still records them as open.
- **Impact:** The execution plan can proceed with decisions that are not locked in the research record.
- **Fix:** Mark the section as `## Open Questions (RESOLVED)` and add explicit resolution text for:
  - whether grammar-specific validation error codes are added to `ChronicleValidationErrorCodeSchema`;
  - whether grammar internals are implemented in `grammar.ts` with orchestration in `validate.ts`.

### 2. [nyquist_compliance] Validation architecture exists but phase `VALIDATION.md` is missing

- **Severity:** BLOCKER
- **File:** `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-RESEARCH.md`
- **Location:** `## Validation Architecture`
- **Problem:** Phase 9 research includes a Validation Architecture section, but there is no `.planning/phases/09-strict-chronicle-grammar-and-compatibility/*-VALIDATION.md`.
- **Impact:** The Nyquist validation gate has no phase validation artifact to bind automated checks, Wave 0 gaps, and sampling continuity before execution.
- **Fix:** Add `09-VALIDATION.md` or rerun the planning research flow that generates it. It should explicitly account for the new test files (`grammar.test.ts`, `snapshot-boundaries.test.ts`, `replay-transition.test.ts`) and confirm each plan task has an automated command.

### 3. [requirement_coverage] GRAM-04 is incomplete for `ROUND_END` and `ACTIVATION_END` boundary attachment

- **Severity:** BLOCKER
- **Plan:** `09-04`
- **Task:** Task 1 and Task 2
- **File:** `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-04-PLAN.md`
- **Problem:** Task 1 defines snapshot-kind-to-event-type rules for `MATCH_START`, `ROUND_START`, `ACTIVATION_START`, `CONTRACTION`, `MATCH_END`, and `TERMINAL`, but not for `ROUND_END` or `ACTIVATION_END`. Task 2 checks context consistency for `ROUND_END` and `ACTIVATION_END`, but context matching alone does not prove the snapshot is attached to the actual end boundary.
- **Impact:** GRAM-04 requires snapshot boundary validation for Round end and Activation end. As written, an executor could implement a validator that accepts a `ROUND_END` or `ACTIVATION_END` snapshot attached to an arbitrary in-window event with matching context.
- **Fix:** Extend `09-04` with executable acceptance criteria and tests that reject mid-round or mid-activation `ROUND_END`/`ACTIVATION_END` snapshots. Since there are no explicit `ROUND_ENDED` or `ACTIVATION_ENDED` event types, define the expected sequence relationship, for example:
  - `ACTIVATION_END` attaches to the last event in that activation before the next activation, round end, or match end boundary;
  - `ROUND_END` attaches to the last event in that round before the next round, contraction, or match end boundary;
  - wrong end-boundary sequence with otherwise matching context fails with `SNAPSHOT_BOUNDARY_INVALID`.

## Passed Checks

| Check | Status | Rationale |
| --- | --- | --- |
| GRAM-01 | Covered | Shape parsing, semantic grammar, and final `validateChronicle` integration are planned in `09-01`, `09-03`, and `09-05`. |
| GRAM-02 | Covered | Event order, duplicate terminal events, required terminal shape, and illegal windows are planned in `09-03` and integrated in `09-05`. |
| GRAM-03 | Covered | Context requirements and payload consistency are planned in `09-03`. |
| GRAM-04 | Blocked | Start/terminal/contraction boundaries are covered, but Round end and Activation end attachment rules are incomplete. |
| GRAM-05 | Covered | Missing snapshot sequences and provable event/snapshot board contradictions are planned in `09-04` and `09-05`. |
| GRAM-06 | Covered | Compatibility version matrix and replay-unavailable handling are planned in `09-01`. |
| GRAM-07 | Covered | Public projection privacy hard gate is planned in `09-02`. |
| GRAM-08 | Covered | Negative corrupted, impossible, private-leaking, and incompatible fixture coverage is split across all plans. |
| Dependencies/waves | Pass | Wave 1 (`09-01`, `09-02`), Wave 2 (`09-03`, `09-04`), Wave 3 (`09-05`) is acyclic and dependency-consistent. |
| Parallel ownership | Pass | Same-wave plans do not modify the same source files. Shared files are modified in later dependent waves. |
| Non-negotiables | Pass | Plans keep rules out of React, keep grammar in replay/spec packages, and explicitly avoid Strategy execution, filesystem, network, persistence, and shadow-engine validation. |
| Docker/local requirements | Pass | Not relevant for this package-level Phase 9 plan; absence of Docker work is acceptable. |

## Structured Issues

```yaml
issues:
  - plan: null
    dimension: research_resolution
    severity: blocker
    description: "09-RESEARCH.md has an unresolved ## Open Questions section."
    file: ".planning/phases/09-strict-chronicle-grammar-and-compatibility/09-RESEARCH.md"
    fix_hint: "Mark Open Questions as resolved and record the chosen decisions for error-code extension and grammar module placement."
  - plan: null
    dimension: nyquist_compliance
    severity: blocker
    description: "Validation Architecture exists but no phase *-VALIDATION.md artifact is present."
    file: ".planning/phases/09-strict-chronicle-grammar-and-compatibility/09-RESEARCH.md"
    fix_hint: "Add 09-VALIDATION.md or rerun the planning research flow that generates it, including automated checks for all new test files."
  - plan: "09-04"
    dimension: requirement_coverage
    severity: blocker
    task: "Task 1, Task 2"
    description: "GRAM-04 boundary attachment is incomplete for ROUND_END and ACTIVATION_END snapshots."
    file: ".planning/phases/09-strict-chronicle-grammar-and-compatibility/09-04-PLAN.md"
    fix_hint: "Add executable tests and acceptance criteria for end-boundary sequence relationships and reject mid-round/mid-activation end snapshots with SNAPSHOT_BOUNDARY_INVALID."
```

## Recommendation

Revise the planning artifacts before execution. The likely fix is small: resolve the research questions, add the missing validation artifact, and tighten `09-04` acceptance criteria for Round end and Activation end boundaries.
