---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "36"
subsystem: activation-audit
tags: [vitest, cache, dependency-integrity, isolation]
requires:
  - phase: 260-35
    provides: Exact-version-complete observation fixtures
provides:
  - Cache-inert direct Vitest activation gate
  - Exact clone dependency stability under the real selector simulation
affects: [260-37, 260-33]
requirements-completed: [STRAT-01, STRAT-02, STRAT-03, STRAT-04]
completed: 2026-07-18
status: complete
---

# Phase 260 Plan 36: Cache-Inert Activation Gate Summary

**The direct isolated Vitest gate now runs with caching disabled while complete dependency mutation detection remains strict.**

## Accomplishments

- Added Vitest's supported `--no-cache` flag to the exact declared activation-seam command.
- Updated the closed inventory command assertion to require the same flag.
- Proved the real five-selector simulation leaves the complete clone dependency preimage and postimage equal.
- Retained fail-closed injected dependency and untracked-file mutation detection, no package-manager invocation, and unconditional clone disposal.
- Advanced the audit to two separate substantive identity seams routed to Plan 260-37.

## Commit

- `efde5be` — `fix(260-36): disable isolated gate cache writes`

## Verification

- Pure seam command/validator contract: 7/7 focused tests passed.
- Real selector simulation produced equal clone dependency digests and no dependency mutation finding.
- Protected baseline remained exact; main dependency controls and development activation state were unchanged.
- Independent code review: PASS.

## Boundary disposition

No dependency cache was deleted or allowlisted, no digest invariant was weakened, and no selector, gameplay, Strategy observation, runtime ownership, public output, or historical evidence changed.
