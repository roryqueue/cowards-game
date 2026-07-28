---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "39"
subsystem: replay-recorder
tags: [chronicle, semantic-identity, replay, selector-independence]
requires:
  - phase: 260-38
    provides: Exact ABI-addressed kernel observation projection
provides:
  - Closed exact v1.17/v1.19 recorder identity admission
  - Selector-independent historical replay fixtures and assertions
affects: [260-33]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 39: Exact Recorder Identity Admission Summary

**The Chronicle recorder now admits exact v1.17 and v1.19 identities without consulting whichever tuple is current.**

## Accomplishments

- Replaced both current-dependent recorder tuple lookups with one closed exact v1.17/v1.19 resolver.
- Preserved exact-v1.19 candidate reproducibility gating and every downstream specific failure classification.
- Added closed-set negatives for v1.14, unknown, mixed, and one-field-mutated recorder metadata.
- Bound historical recorder expectations and optional-private-field execution to exact v1.17 while retaining a separate compact-current selector assertion.
- Drove the exact isolated v1.19 selector audit to zero findings with all declared tests passing.

## Commits

- `a559d3e` — `fix(260-39): close recorder tuple admission`
- `1ce8be0` — `docs(260): bind recorder fixtures to exact v1.17`
- `b422045` — `test(260-39): bind historical recorder fixtures`

## Verification

- Recorder suite passed 22/22 under the live v1.17 selector.
- Replay build, focused lint/format, and protected baseline passed.
- Exact v1.19 isolated simulation passed all 61 declared tests with zero findings and an unchanged dependency tree.
- Initial and amended independent code reviews: PASS.

## Boundary disposition

No Chronicle byte, event, state, trace root, private ownership rule, failure ownership, Match behavior, selector, or historical evidence changed. v1.14 remains accepted only through its separate immutable historical Chronicle path.
