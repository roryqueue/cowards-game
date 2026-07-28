---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "06"
subsystem: historical-chronicle-interpretation
tags: [chronicle, historical, v1.4, immutable-bytes, replay]

requires:
  - phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
    provides: Explicit historical runtime dispatch and immutable historical proof posture
provides:
  - Frozen original-v1.4 Chronicle grammar and vocabulary validator
  - Frozen original-v1.4 replay transition interpreter and deterministic interpretation root
  - Strict manifest pinning annotated-tag fixtures, original sources, frozen sources, versions, tuple, and root
affects: [259-08, 259-14, historical-replay, version-dispatch]

tech-stack:
  added: []
  patterns:
    - Version-specific historical modules with no import edge to mutable current grammar or transition helpers
    - Git blob plus SHA-256 plus byte-length pins for archived and frozen source identity
    - Read-only interpretation proof with before/after byte equality

key-files:
  created:
    - packages/replay/src/historical-v1-4-grammar.ts
    - packages/replay/src/historical-v1-4-transition.ts
    - packages/replay/src/historical-v1-4.test.ts
    - packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json
  modified: []

key-decisions:
  - "Original profile historical-v1.4 remains typed unresolved_legacy; it is never guessed into a newer exact tuple."
  - "The manifest separately records the Phase-256 authoritative historical-v1.16 tuple without relabeling original v1.4 bytes."
  - "PUSH_ATTEMPTED and original Backstab boundary literals remain executable historical vocabulary only."

requirements-completed: [CHRN-02, CHRN-06]

coverage:
  - id: D1
    description: "Original v1.4 vocabulary, grammar, ordering, and transition semantics execute only through frozen historical symbols."
    requirement: CHRN-02
    verification:
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts#accepts original vocabulary, payloads, order, and boundaries"
        status: pass
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts#applies original transition semantics through historical-only symbols"
        status: pass
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts#has no dependency on mutable current grammar or transition helpers"
        status: pass
    human_judgment: false
  - id: D2
    description: "Archived fixtures and interpreter sources retain exact bytes before and after validation."
    requirement: CHRN-06
    verification:
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts#pins the strict archived and frozen source identity manifest"
        status: pass
      - kind: unit
        ref: "packages/replay/src/historical-v1-4.test.ts#leaves archived inputs and frozen sources byte-identical after reads"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-v1-36-historical-proof.ts"
        status: pass
    human_judgment: false

duration: 16min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 06: Frozen Historical v1.4 Interpretation Summary

**Original v1.4 Chronicle evidence now has a standalone executable grammar and transition interpreter whose source, fixture, and interpretation identities are byte-pinned.**

## Performance

- **Duration:** 16 min
- **Completed:** 2026-07-16
- **Tasks:** 2
- **Files created:** 4

## Accomplishments

- Added a historical-only vocabulary and grammar implementation preserving original singleton scheduling checks, payload/context rules, terminal timing, `PUSH_ATTEMPTED`, and original Backstab boundaries.
- Added a historical-only transition interpreter preserving original no-op, MOVE, TURN, PUSH, Backstab, stone, fall, Contraction, and outcome behavior.
- Added a domain-separated, order-sensitive historical interpretation root over exact events plus before/after replay state.
- Added import-isolation proof that neither frozen module calls current grammar, transition, validation, reconstruction, or migration helpers.
- Replaced live spec schemas, outcome parsing, scheduling constants, and Cycle limits with literal frozen v1.4 implementations in the pinned historical modules.
- Added a strict manifest pinning original v1.4 fixture/source blobs from the annotated `v1.4` tag, frozen interpreter blobs from commit `4fab0af`, literal historical versions, the authoritative exact tuple, and interpretation root.
- Independently anchored the expected frozen commit, blobs, SHA-256 digests, and byte lengths so a self-consistent manifest relabel or substitution fails closed.
- Routed historical validation through the frozen grammar so current initiative/snake checks cannot reinterpret valid v1.4 evidence.
- Resolved every test evidence path and Git read from the test module's deterministic repository root, making the same immutable proof portable across root and package-local invocations.
- Proved archived and working frozen bytes are unchanged before and after parsing, validation, transition interpretation, and manifest audit.

## Task Commits

1. **RED: Specify frozen historical vocabulary and transition behavior** — `0c63116` (test)
2. **GREEN: Implement frozen historical grammar and transition interpretation** — `9b59d05` (feat)
3. **RED: Specify strict byte/source/interpretation manifest proof** — `00ee3e9` (test)
4. **GREEN: Pin immutable historical evidence** — `e86cbaa` (test)
5. **Review fix CR-03: Freeze historical runtime dependencies** — `4fab0af` (fix)
6. **Review fix WR-01: Anchor historical source identities** — `4d647b4` (fix)
7. **Review fix CR-03: Route history through frozen grammar** — `8f7b3be` (fix)
8. **Portability fix: Resolve historical evidence module-relatively** — `c023ad4` (test)

## Files Created

- `packages/replay/src/historical-v1-4-grammar.ts` — Frozen schema admission, vocabulary, ordering, and original grammar behavior.
- `packages/replay/src/historical-v1-4-transition.ts` — Frozen replay transition semantics and interpretation root.
- `packages/replay/src/historical-v1-4.test.ts` — Interpretation vectors, isolation, resolver, manifest mutation, and read-only byte proof.
- `packages/replay/src/fixtures/historical-v1-4-chronicle-manifest.json` — Exact archive/frozen blob, byte, digest, tuple, version, and root identity.

## Decisions Made

- Used the annotated `v1.4` tag as the immutable original-byte authority. The pinned fixture sources are the original inline movement Chronicle and canonical replay-scenario source; no historical file is copied, normalized, or regenerated.
- Preserved `historical-v1.4` as `unresolved_legacy`, matching D-15. The exact Phase-256 authoritative tuple is recorded separately under the `historical-v1.16` profile rather than guessed onto original bytes.
- Kept original bytes and semantics immutable while routing historical admission immediately through the frozen grammar; later plans can extend exact tuple and reconstruction routing without depending on current grammar.

## Deviations from Plan

None.

## Issues Encountered

- The repository has source-backed v1.4 Chronicle fixtures rather than a standalone raw Chronicle JSON file at the tag. The manifest therefore pins the exact Git blobs containing the original inline Chronicle and scenario generators, alongside the original schema, grammar, and transition sources.
- The first combined current-event proof correctly detected that Plan 259-05 changed the grammar source hash. The vocabulary was unchanged; the current event-coverage artifact was regenerated and recorded in the updated Plan 259-05 summary.
- The package-local Vitest command changed `process.cwd()` to `packages/replay`, exposing root-relative fixture reads in the proof test. Module-relative paths and an explicit Git `cwd` now make both supported invocations identical.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-08 can route exact version identity to `validateHistoricalV14Grammar` without importing current grammar helpers.
- Plan 259-14 can route historical replay only to `applyHistoricalV14Transition` and compare the pinned interpretation root.
- Original v1.4 bytes, event names, payloads, ordering, outcomes, and interpretation remain unchanged.

## Self-Check: PASSED

- Historical focused tests passed 13/13.
- Historical plus current validate/reconstruct tests passed 57/57 serially.
- Full replay package tests passed 194/194 serially with `--maxWorkers=1`.
- Both package-local and repository-root full replay invocations passed 194/194 serially.
- Replay typecheck, lint, formatting, and diff checks passed.
- Phase-257 compatibility and kernel-contract tests passed 31/31.
- Current event-coverage tests passed 4/4 and the artifact check is byte-exact.
- Immutable v1.36 archived proof passed with 8 artifacts and 11 sources.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
