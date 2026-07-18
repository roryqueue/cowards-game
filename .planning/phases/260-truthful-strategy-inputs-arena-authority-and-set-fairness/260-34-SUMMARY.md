---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "34"
subsystem: conformance-activation
tags: [corpus, independent-review, activation-audit, dependency-isolation]
requires:
  - phase: 260-31
    provides: Exact five-selector activation inventory and isolated candidate model
provides:
  - Closed exact v2/v3 active corpus-review admission
  - Package-manager-inert disposable activation seam gates
  - Clone-local dependency isolation with complete mutation detection
affects: [260-35, 260-33, 260-14]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 34: Corpus Admission and Isolated Gate Summary

**Active corpus evidence is now admitted through a closed version-aware policy, and isolated activation gates cannot install packages, mutate the main dependency tree, or hide clone-local dependency/untracked mutations.**

## Accomplishments

- Replaced the v2-shaped active-review predicate with exact closed v2 and v3 branches.
- Preserved immutable v2 behavior-preserving review facts and immutable v3 approved-inactive observation-candidate review facts without relabeling either review.
- Bound v3 to its exact candidate pin, review and semantic-diff bytes, inventories, D01-D08 dispositions, protected surfaces, and approved changed paths.
- Bound v2 to its exact reviewed corpus root and file hash as well as its review hash and zero-change policy.
- Replaced writable main-tree dependency symlinks with clone-local dependency materialization and clone-root link validation.
- Added complete clone dependency content/symlink hashing and full tracked/untracked mutation inventory.
- Preserved direct clone-local Vitest execution, no package-manager invocation, unconditional disposal, protected baseline checks, and exact main-tree allowlisting.
- Routed the newly exposed shared v1.19 fixture omission to bounded Plan 260-35 rather than broadening this repair.

## Commits

- `8aff82e` — `fix(260-34): close corpus review admission`
- `1437318` — `fix(260-34): isolate reviewed corpus gates`

## Verification

- Corpus/generator suites: 29/29 passed.
- Clean-clone adversarial isolation: 3/3 passed.
- Pure seam inventory/validator assertions: 7/7 passed.
- Golden typecheck/build and Spec build passed.
- Independent code review converged to PASS after all findings were fixed.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Development selection head remained `active-v1.17-bootstrap`, revision `0`, with no pending intent or activation schema.

## Boundary disposition

No Match state, Action legality, event order, outcome, Strategy observation value, runtime ownership, public output, Chronicle, selector, or historical evidence changed. Plan 34 made no activation database transition.
