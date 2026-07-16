---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "03"
subsystem: canonical-conformance-trace
tags: [conformance, full-trace, restricted-diff, privacy, oracle]

requires:
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "01"
    provides: Immutable reviewed v1.37 corpus identity and mandatory case inventory
  - phase: 259-executable-four-language-and-chronicle-conformance
    plan: "02"
    provides: RecordedCanonicalTransitionV137 and deterministic accumulated transition roots
provides:
  - Immutable language-neutral success and failure trace projection
  - Exact full-trace root covering runtime invocations, transitions, terminal data, outcomes, and failure semantics
  - Privacy-safe first-divergence comparison with quarantine and disputed-oracle suspension
  - Read-only package exports for candidate generation and real language runners
affects: [259-04, 259-language-runners, 259-certificate-authority, conformance-review]

tech-stack:
  added: []
  patterns:
    - Domain-separated canonical JSON trace roots with unsigned-64-bit framing
    - Closed-shape hash-only projections for private and host-sensitive evidence
    - Restricted first-divergence coordinates without raw compared values

key-files:
  created:
    - packages/golden/src/v1-37-conformance-trace.ts
  modified:
    - packages/golden/src/v1-37-conformance-trace.test.ts
    - packages/golden/src/index.ts

key-decisions:
  - "RecordedCanonicalTransitionV137 remains the sole transition shape; the golden package consumes it directly rather than defining a sibling schema."
  - "A reviewed expected trace with an invalid claimed root suspends the oracle, while an invalid or mismatching candidate is quarantined."
  - "Restricted diffs expose only stable case, invocation, transition, field, and hashed-value coordinates."
  - "The package entrypoint exports pure corpus and comparison contracts but no writer, approval, promotion, regeneration, private-preimage, or diagnostic authority."

patterns-established:
  - "D-05 oracle authority: committed reviewed trace roots are checked independently and never regenerated from a live TypeScript lane."
  - "D-06/D-07 equality: success and failure semantics are exact, transition-complete, hash-only, and host-nondeterminism-free."
  - "D-08 disposition: first mismatch quarantines; disputed reviewed evidence suspends instead of tolerating or replacing the oracle."

requirements-completed: [CONF-02]

coverage:
  - id: D1
    description: "Canonical equality covers every D-06 success dimension and D-07 failure dimension through one deterministic language-neutral root."
    requirement: CONF-02
    verification:
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#projects one immutable transition-complete hash-only success trace"
        status: pass
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#compares every negative failure dimension without messages or private values"
        status: pass
    human_judgment: false
  - id: D2
    description: "Every one-field mismatch reports the first privacy-safe coordinate, quarantines candidates, and suspends a corrupted reviewed oracle."
    requirement: CONF-02
    verification:
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#reports the first safe top-level and invocation divergence without values"
        status: pass
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#reports every transition terminal final and root dimension at its first coordinate"
        status: pass
      - kind: unit
        ref: "packages/golden/src/v1-37-conformance-trace.test.ts#exports one read-only corpus and trace contract without golden-writing authority"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 03: Canonical Full-Trace Equality Summary

**The golden package now defines one exact, language-neutral, privacy-safe full-trace oracle contract whose first mismatch quarantines a candidate and whose corrupted reviewed root suspends the oracle.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-07-16T11:40:14Z
- **Completed:** 2026-07-16T11:55:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added an immutable canonical trace projection that binds corpus identity, semantic tuple, invocation outputs, private-memory and objective hashes, every recorded transition field, final state, outcome, and complete failure semantics.
- Consumed `RecordedCanonicalTransitionV137` directly and independently validated every stored transition prefix root before trace admission.
- Added a domain-separated full-trace root and frozen-trace hash cache that preserves correctness while making repeated reviewed-oracle comparisons efficient.
- Added exhaustive one-field mutation coverage across top-level, invocation, transition, terminal, aggregate, and failure dimensions.
- Added restricted first-divergence output containing only stable coordinates and hashed values; raw source, artifact, memory, objective, event-private, diagnostics, stderr, path, timing, and host preimages cannot enter the closed projection.
- Exported the pure v1.37 corpus/projector/root/comparator surface without exposing golden-writing or promotion authority.

## Task Commits

1. **Task 1 RED: Specify exhaustive full-trace equality** — `a34ccfa` (test)
2. **Task 1 GREEN: Implement canonical projection, root, and restricted comparator** — `8a9227c` (feat)
3. **Task 2 RED: Require read-only package exports** — `69cf415` (test)
4. **Task 2 GREEN: Export the pure corpus and trace contract** — `5a7ff21` (feat)

## Files Created/Modified

- `packages/golden/src/v1-37-conformance-trace.ts` — Closed projector, validation, root, typed errors, and restricted comparator.
- `packages/golden/src/v1-37-conformance-trace.test.ts` — Full-Match projection, privacy rejection, exact mutation matrix, failure equality, oracle-dispute, and package-boundary tests.
- `packages/golden/src/index.ts` — Read-only corpus and trace exports.

## Decisions Made

- Kept live TypeScript execution out of oracle authority: this contract compares a candidate with separately reviewed trace material and has no golden update path.
- Used exact canonical JSON bytes with explicit framing for roots and divergence-value hashes.
- Treated system-failure and player-violation semantics as first-class equality dimensions rather than messages or host diagnostics.
- Cached only already-frozen trace objects, so mutable caller-owned candidates are always rehashed and cannot reuse stale identity.

## Deviations from Plan

None. The planned RED/GREEN implementation, export boundary, and verification were completed without scope changes.

## Issues Encountered

- Repeating the complete Match transition stream for every one-field mutation exceeded Vitest's default per-test budget. The projection test still exercises the entire recorded Match, while the exhaustive mutation table uses a valid compact `RecordedCanonicalTransitionV137` prefix with the same complete field surface. Focused runtime fell from more than 20 seconds with timeouts to 2.85 seconds with all assertions passing.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-04 can generate separately reviewed trace candidates against the exact exported projector/root contract.
- Real TypeScript, Python, Rust, and Zig runners can return the same transition-complete trace type and receive the same restricted comparison result.
- No gameplay state, Action legality, event order, terminal timing, outcome, Strategy observation, historical Chronicle, production trust, or counted-lane behavior changed.

## Self-Check: PASSED

- All three planned source/test/export files exist.
- RED/GREEN commits `a34ccfa`, `8a9227c`, `69cf415`, and `5a7ff21` exist in order.
- Focused trace suite passes: 1 file, 8 tests.
- Full `@cowards/golden` package suite passes: 3 files, 17 tests.
- Golden package typecheck, focused ESLint, Prettier check, and `git diff --check` pass.
- Protected milestone, project-state, and v1.4 specification files are unchanged.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
