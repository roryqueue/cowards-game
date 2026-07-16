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
  - "Comparator equality is available only after both projected traces pass closed semantic admission; a semantically invalid reviewed trace suspends the oracle and an invalid candidate remains quarantined."
  - "Every system-failure trace has exactly one referenced system-failure invocation with unchanged state, memory, and objective hashes."
  - "Every invalid candidate semantic is reduced to one bounded traceSemantics quarantine before candidate hashing or field-level diffing."
  - "Top-level result class owns exactly one matching negative invocation or transition, with no stray or dual failure evidence."
  - "Adjacent gameplay-state hashes and the final-state hash are continuous; machine hashes remain boundary commitments because runtime effect/resume gaps are intentional."

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
- **Files modified:** 5

## Accomplishments

- Added an immutable canonical trace projection that binds corpus identity, semantic tuple, invocation outputs, private-memory and objective hashes, every recorded transition field, final state, outcome, and complete failure semantics.
- Consumed `RecordedCanonicalTransitionV137` directly and independently validated every stored transition prefix root before trace admission.
- Added a domain-separated full-trace root and frozen-trace hash cache that preserves correctness while making repeated reviewed-oracle comparisons efficient.
- Added exhaustive one-field mutation coverage across top-level, invocation, transition, terminal, aggregate, and failure dimensions.
- Added restricted first-divergence output containing only stable coordinates and hashed values; raw source, artifact, memory, objective, event-private, diagnostics, stderr, path, timing, and host preimages cannot enter the closed projection.
- Exported the pure v1.37 corpus/projector/root/comparator surface without exposing golden-writing or promotion authority.
- Closed three adversarial review gaps: caller-owned shallow freezes can no longer create stale-root false equality, event payloads/contexts must survive the canonical public Chronicle schema without stripped fields, and system-failure summaries must prove no mutation while matching their referenced invocation.
- Closed three independent rereview gaps: self-rehashed invalid prefix/derived roots cannot become an equal oracle, system-failure invocations are unique and reference-strict across result classes, and transition stage/outcome/event/terminal hashes are replay-owned and semantically revalidated before equality.
- Closed the final independent blocker set: owner-private events require commitments while public events forbid them, event sequences are globally contiguous across transitions, terminal evidence is final-only and exactly matches the final `MATCH_ENDED`, and every player violation is bound to exact invocation or transition evidence.
- Closed the post-integration review blockers: every invalid candidate semantic now quarantines before hashing, success/system/player result classes reconcile all nested evidence with exactly one negative owner, and transition/final gameplay-state hashes form one continuous chain.

## Task Commits

1. **Task 1 RED: Specify exhaustive full-trace equality** — `a34ccfa` (test)
2. **Task 1 GREEN: Implement canonical projection, root, and restricted comparator** — `8a9227c` (feat)
3. **Task 2 RED: Require read-only package exports** — `69cf415` (test)
4. **Task 2 GREEN: Export the pure corpus and trace contract** — `5a7ff21` (feat)
5. **Review CR-01: Remove shallow-freeze trace-root caching** — `f6cff37` (fix)
6. **Review CR-02: Reject private event preimages through canonical event validation** — `3d3e078` (fix)
7. **Review CR-03: Enforce no-mutation failure consistency** — `8fe7716` (fix)
8. **Rereview RED: Reproduce semantic-admission gaps** — `368c82e` (test)
9. **Rereview CR-04/CR-05/CR-06: Close projected trace admission** — `8289633` (fix)
10. **Rereview CR-04: Quarantine structurally malformed candidates safely** — `b79f709` (fix)
11. **Final rereview RED: Reproduce owner, chronology, terminal, and violation-ownership gaps** — `4417707` (test)
12. **Final rereview CR-07/CR-08/CR-09: Close final trace admission gaps** — `0fd55f1` (fix)
13. **Post-integration RED: Reproduce final trace review blockers** — `19919e3` (test)
14. **Post-integration BL-01: Quarantine invalid candidate semantics before hashing** — `149f508` (fix)
15. **Post-integration BL-02: Reconcile result class and exact negative ownership** — `aa6eb0b` (fix)
16. **Post-integration BL-03: Enforce state chronology and final-state ownership** — `ae093db` (fix)
17. **Post-integration formatting** — `ba6b21a` (style)

## Files Created/Modified

- `packages/golden/src/v1-37-conformance-trace.ts` — Closed projector, validation, root, typed errors, and restricted comparator.
- `packages/golden/src/v1-37-conformance-trace.test.ts` — Full-Match projection, privacy rejection, exact mutation matrix, failure equality, oracle-dispute, and package-boundary tests.
- `packages/golden/src/index.ts` — Read-only corpus and trace exports.
- `packages/replay/src/record.ts` — Replay-owned canonical output, ordered-event, and terminal hash helpers used by both recording and trace verification.
- `packages/engine/src/index.ts` — Public type-only `KernelStage` export for exhaustive compile-checked stage admission.

## Decisions Made

- Kept live TypeScript execution out of oracle authority: this contract compares a candidate with separately reviewed trace material and has no golden update path.
- Used exact canonical JSON bytes with explicit framing for roots and divergence-value hashes.
- Treated system-failure and player-violation semantics as first-class equality dimensions rather than messages or host diagnostics.
- Rehash every caller-supplied trace instead of trusting shallow `Object.freeze` as evidence of recursive immutability.
- Admit recorded events only when their payload and context are unchanged by the canonical current Chronicle event schema; schema-stripped unknown data is a typed trace rejection.
- Require referenced failure summaries to agree with invocation class, stable code, boundary, mutation flags, terminal effect, and retryability; system failures additionally prove unchanged state, memory, and objective hashes.
- Revalidate the complete closed projected trace before comparator equality, including exact stage vocabulary, event/output hashes, outcome schema, terminal hash coherence, prefix roots, derived transition root, and failure ownership.
- Require every owner-private event to carry a private-payload commitment and every public event to carry none.
- Treat Chronicle event sequence as one flattened global stream beginning at zero; a transition-local ordering claim cannot mask a cross-transition gap or duplicate.
- Admit terminal evidence only on the final transition, with exactly one final `MATCH_ENDED` whose public payload canonically equals the terminal status.
- Bind transition-owned player violations to one exact `RUNTIME_VIOLATION` stable code, the referenced transition kind, derived gameplay mutation, rejected private-memory mutation, terminal effect, and non-retryability; invocation-owned violations retain the same exact field-by-field check.
- Return a bounded `traceSemantics` quarantine result for structurally malformed candidate objects instead of hashing or traversing unsafe shapes.
- Return that same bounded `traceSemantics` quarantine for every invalid candidate semantic before computing a candidate root or restricted field diff.
- Require success traces to contain no negative evidence, and system/player failures to contain exactly one matching invocation-or-transition owner with no ambiguous dual ownership.
- Require adjacent transition gameplay-state hashes and the top-level final-state hash to agree exactly; do not require raw machine-hash adjacency across intentional runtime effect/resume boundaries.
- Carry before/after objective hashes alongside memory hashes so system failure proves no objective mutation rather than relying on a single unpaired digest.

## Deviations from Plan

### Review-driven hardening

- Added replay-owned hash helpers instead of duplicating recorder domains in the golden package.
- Added a type-only engine export so exact kernel-stage validation remains compile-time exhaustive without copying gameplay behavior.
- Expanded invocation evidence with before/after objective hashes to prove system-failure no-mutation semantics.
- These changes preserve gameplay and public privacy behavior while making the planned equality and failure-safety claims executable.

## Issues Encountered

- Repeating the complete Match transition stream for every one-field mutation exceeded Vitest's default per-test budget. The projection test still exercises the entire recorded Match, while the exhaustive mutation table uses a valid compact `RecordedCanonicalTransitionV137` prefix with the same complete field surface. Focused runtime fell from more than 20 seconds with timeouts to 2.85 seconds with all assertions passing.
- Adversarial review showed that shallow freezing is not a safe cache eligibility signal and that closed top-level event keys do not make nested payloads closed. Both assumptions were replaced with executable fail-closed checks.
- Independent rereview showed that an outer self-hash is not semantic admission: derived roots, stage/outcome schemas, terminal coherence, and unique failure ownership must all pass before equal-root short-circuiting.
- Final rereview showed that transition-local event monotonicity was insufficient for Chronicle reconstruction and that a nullable private commitment made owner evidence indistinguishable from missing evidence. Both are now closed at projection admission.
- Post-integration probing showed that semantically invalid but non-canonical candidate values could still throw while hashing, and that success traces could contain unowned player-violation evidence. Both paths now fail closed before equality.
- Full-Match probing also showed that machine hashes intentionally differ across runtime effect/resume boundaries. The final validator therefore enforces gameplay-state continuity and final-state ownership without inventing a false machine-adjacency invariant.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-04 can generate separately reviewed trace candidates against the exact exported projector/root contract.
- Real TypeScript, Python, Rust, and Zig runners can return the same transition-complete trace type and receive the same restricted comparison result.
- No gameplay state, Action legality, event order, terminal timing, outcome, Strategy observation, historical Chronicle, production trust, or counted-lane behavior changed.

## Self-Check: PASSED

- All three planned source/test/export files and both review-owned shared authority updates exist.
- RED/GREEN commits `a34ccfa`, `8a9227c`, `69cf415`, and `5a7ff21` exist in order.
- Focused trace suite passes: 1 file, 17 tests.
- Full `@cowards/golden` package suite passes: 3 files, 26 tests.
- Joined replay recorder and trace regression passes: 2 files, 35 tests.
- Golden package typecheck, focused ESLint, Prettier check, and `git diff --check` pass.
- Protected milestone, project-state, and v1.4 specification files are unchanged.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
