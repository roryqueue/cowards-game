---
phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness
plan: "48"
subsystem: persistence-replay
tags: [semantic-authority, historical-compatibility, persistence, replay, chronicle]
requires: [260-47]
provides:
  - selected-current persistence fixtures derived from the exact file and database authority
  - immutable v1.17 integrity, replay, Match-completion, and Chronicle-storage routes after v1.19 selection
  - exact v1.19 candidate Match reproducibility fixtures and revision-admission rows
affects: [260-49, 260-14, 260-15]
tech-stack:
  added: []
  patterns:
    - explicit versioned compatibility resolver beside strict selected-current resolver
    - recorder re-materialization for immutable historical replay admission
    - exact selected-current database-head and arena-catalog fixtures
key-files:
  created:
    - packages/persistence/src/test-current-semantic-authority.ts
  modified:
    - packages/persistence/src/matchset-service.ts
    - packages/persistence/src/integrity-evidence.ts
    - packages/persistence/src/complete-match.ts
    - packages/persistence/src/chronicle-store.ts
    - packages/replay/src/validate.ts
    - packages/replay/src/reconstruct.ts
    - packages/replay/src/replay-transition.ts
key-decisions:
  - "A selected-current schema remains strict; immutable v1.17 evidence uses an explicit versioned resolver rather than being added to the current allowlist."
  - "Valid v1.17 completion is replayed from its trusted recorded transitions, hashes, grammar, boundaries, terminal state, and exact v1.17 vocabulary without invoking mutable selected-current state schemas."
  - "New v1.17 development fixture certification fails closed after v1.19 selection; the test proves zero MatchSet mutation instead of minting a historical certificate through current authority."
  - "v1.19 persistence fixtures include exact arena catalog rows, four-condition Set membership, candidate Chronicle authority, and revision-specific admission evidence."
patterns-established:
  - "Versioned historical paths identify the tuple first, then use only that tuple's resolver and event vocabulary."
  - "Disposable-candidate progress to the next gate is the proof that the complete prior package passed."
requirements-completed: [STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05]
duration: multi-session
completed: 2026-07-18
---

# Phase 260 Plan 48 Summary

The full persistence package now passes both released v1.17 and disposable selected v1.19. Valid v1.17 scheduling, integrity evidence, Match completion, replay reconstruction, event vocabulary, and Chronicle persistence remain available through explicit immutable routes after current selection changes; selected-current v1.19 remains strict and requires its exact Set, arena, initiative, Chronicle, and revision-admission authority.

## Work completed

- Split selected-current test fixtures from explicit historical v1.17 fixtures, including exact database-head and noncurrent-head rows.
- Routed legacy presets, competition, ladder, Workshop, and development inputs through explicit v1.17 selectors where they claim historical semantics.
- Added exact v1.19 candidate arena-catalog and revision-revalidation fixtures instead of bypassing admission.
- Added version-pinned v1.17 integrity snapshot parsing and persisted-row reconstruction.
- Preserved v1.17 Match completion after selection through versioned replay reconstruction, recorder re-materialization, exact event vocabulary, and versioned Chronicle storage.
- Added v1.19 candidate Match reproducibility to the selected-current semantic-integrity recorder fixture.
- Kept new historical development certification fail-closed after activation and proved it cannot create a MatchSet.

## Verification

- Released persistence: 24 files passed, 328 tests passed.
- Released replay focused suite: 3 files passed, 88 tests passed.
- Released Chronicle/Match completion: 2 files passed, 22 tests passed.
- Disposable selected-v1.19 coordinator: cleared the complete persistence gate and advanced to runtime-service, where Plan 49 is now routed.
- Targeted disposable selected-v1.19 completion proof: historical v1.17 player-violation persistence and rollback/idempotence both passed.
- Full workspace typecheck: 27/27 tasks passed.
- Full workspace lint: 15/15 tasks passed.
- Protected baseline remained `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.
- Database head remained exact preactivation v1.17 with no pending intent, finalization, or compensation.

## Commits

- `40c0151` — separate current and historical persistence seams
- `a4f35b5` — complete candidate persistence authority fixtures
- `1bf6ded` — pin historical persistence authority resolution
- `8e42b45` — preserve v1.17 persistence after selection
- `db4a769` — freeze v1.17 replay admission after selection
- `7533338` — freeze v1.17 event vocabulary resolution
- `9505832` — persist admitted v1.17 Chronicles after selection

## Surprise

The stale tests exposed real production drift, not only fixture drift: generic integrity, replay, and Chronicle-storage helpers had been tied to whichever tuple was current. Selecting v1.19 would therefore reject valid queued or persisted v1.17 evidence. The repair keeps the current path strict and adds explicit immutable v1.17 routes, avoiding any gameplay or outcome change.

## Next gate

The coordinator next reported 25 runtime-service failures, primarily stale v1.17 default assertions and missing v1.19 candidate Chronicle reproducibility. Those failures are isolated in Plan 49; no activation mutation occurred.
