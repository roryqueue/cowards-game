---
phase: 03-chronicle-and-replay-core
status: passed
verified_at: 2026-05-17T23:10:54Z
score: 8/8 requirements verified
requirements:
  - id: REPLAY-01
    status: verified
  - id: REPLAY-02
    status: verified
  - id: REPLAY-03
    status: verified
  - id: REPLAY-04
    status: verified
  - id: REPLAY-05
    status: verified
  - id: REPLAY-06
    status: verified
  - id: REPLAY-07
    status: verified
  - id: TEST-03
    status: verified
gaps: []
---

# Phase 3 Verification: Chronicle and Replay Core

## Verdict

**Passed.** Phase 3's goal, "Make every Match reproducible, inspectable, and safe to project publicly," is achieved in the codebase.

This is a re-verification against the actual source after the existing `03-VERIFICATION.md` and later `03-REVIEW.md`. The prior review recorded two blocker defects as fixed: public projection leakage through schema-unknown payload fields, and `buildChronicleFromResult` returning invalid partial Chronicles. Both fixes are present and covered by tests.

## Goal Check

| Goal Truth | Status | Evidence |
|---|---:|---|
| Engine-backed Match execution can produce a versioned Chronicle. | Verified | `buildChronicleFromMatch` creates `schemaVersion: "chronicle-v1"` and reproducibility metadata, runs the deterministic engine flow, and emits events/snapshots in `packages/replay/src/build.ts:157` and `packages/replay/src/build.ts:189`. Worker integration uses it for Match execution in `apps/worker/src/runner.ts:104`. |
| Chronicles are inspectable and replayable without rerunning strategies. | Verified | `createReplay` validates Chronicles, exposes `stateAt` and `iterateReplay`, and applies public semantic event effects from Chronicle data in `packages/replay/src/reconstruct.ts:32`, `packages/replay/src/reconstruct.ts:173`, and `packages/replay/src/reconstruct.ts:541`. |
| Public projection is privacy-safe by default. | Verified | Public projection parses through `ChronicleSchema`, strips private refs/sections and private payload keys, and omits integrity hash commitments in `packages/replay/src/project.ts:12`, `packages/replay/src/project.ts:82`, and `packages/replay/src/project.ts:85`. |
| Owner projection exposes only the selected player's private debug data. | Verified | `projectOwnerChronicle` attaches only `canonical.private.byPlayerId[playerId]` in `packages/replay/src/project.ts:98`. Tests prove each owner sees their markers and not the opponent's in `packages/replay/src/project.test.ts:244`. |

## Required Artifacts

| Artifact | Status | Evidence |
|---|---:|---|
| Chronicle contracts and schemas | Verified | Canonical Chronicle, private sections, validation errors, viewer/projection types exist in `packages/spec/src/types.ts:235` through `packages/spec/src/types.ts:370`; schemas exist in `packages/spec/src/schemas.ts:311` through `packages/spec/src/schemas.ts:570`. |
| Chronicle builder | Verified | Private refs are deterministic (`private:event:{sequence}`), private payloads are recorded by owner, boundary snapshots are captured, and terminal snapshots are emitted in `packages/replay/src/build.ts:108`, `packages/replay/src/build.ts:141`, and `packages/replay/src/build.ts:345`. |
| Normalization and hashing | Verified | `normalizeChronicle` excludes storage metadata/integrity and `createChronicleContentHash` uses stable key-sorted SHA-256 in `packages/replay/src/normalize.ts:3` and `packages/replay/src/hash.ts:27`. |
| Validation and migration hook | Verified | Validation covers schema, version, event order, required events, snapshot requirements, hash mismatch, and unsupported migration in `packages/replay/src/validate.ts:44`, `packages/replay/src/validate.ts:119`, `packages/replay/src/validate.ts:197`, `packages/replay/src/validate.ts:221`, and `packages/replay/src/validate.ts:326`. |
| Reconstruction API | Verified | `stateAt` and `iterateReplay` are exported through `createReplay`; reconstruction applies movement, push, Backstab, stoning, fall, contraction, and match-end effects in `packages/replay/src/reconstruct.ts:173` through `packages/replay/src/reconstruct.ts:424`. |
| Projection API | Verified | Public/owner projection APIs are implemented and exported in `packages/replay/src/project.ts:85`, `packages/replay/src/project.ts:98`, and `packages/replay/src/project.ts:120`. |

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---:|---|
| REPLAY-01 | Verified | Determinism tests compare normalized Chronicles and content hashes for identical inputs, and prove seed/revision changes alter the hash in `packages/replay/src/determinism.test.ts:67`. |
| REPLAY-02 | Verified | Required Chronicle event types are in the spec union/schema; engine producers emit movement, push, Backstab, stoning, fall, contraction, runtime violation, and match end events. Builder tests assert the core completed-match event set in `packages/replay/src/build.test.ts:88`. Strict exhaustive grammar remains explicitly deferred by the roadmap, so this phase verifies event vocabulary/producers rather than every possible event in every Match. |
| REPLAY-03 | Verified | Integration test builds, validates, replays final state, and matches final outcome without passing a runtime to replay in `packages/replay/src/integration.test.ts:67`; reconstruction imports spec/validation/hash helpers, not runtime execution APIs. |
| REPLAY-04 | Verified | Snapshot kinds include match, round, activation, contraction, terminal boundaries; builder captures these snapshots in `packages/replay/src/build.ts:195`, `packages/replay/src/build.ts:224`, `packages/replay/src/build.ts:281`, `packages/replay/src/build.ts:292`, `packages/replay/src/build.ts:318`, and `packages/replay/src/build.ts:345`. |
| REPLAY-05 | Verified | Validation returns typed errors for incompatible versions, invalid order, missing required events/snapshots, hash mismatch, and unsupported migration in `packages/replay/src/validate.ts`; tests cover these paths in `packages/replay/src/validate.test.ts` and `packages/replay/src/integrity.test.ts`. |
| REPLAY-06 | Verified | Public projection privacy tests assert absence of private refs, exact Awareness Grid data, objective payloads, StrategyMemory, SoldierMemory, strategy source, raw runtime details, and unknown extra private payload fields in `packages/replay/src/project.test.ts:163` and `packages/replay/src/project.test.ts:216`. |
| REPLAY-07 | Verified | Owner projection tests prove player-specific private markers are included for the owner and excluded for the opponent in `packages/replay/src/project.test.ts:244`. |
| TEST-03 | Verified | Replay package has build, determinism, integration, integrity, projection, reconstruction, and validation tests. `pnpm --filter @cowards/replay test` passed: 7 files, 24 tests. Full `pnpm verify` also passed. |

## Integration/Data Flow

| Flow | Status | Evidence |
|---|---:|---|
| Engine summaries -> Chronicle events | Verified | Engine transition summaries carry context/privacy/private payload fields in `packages/engine/src/types.ts:55`; activation records strategy memory, Awareness Grid, objectives, soldier memory, and runtime violations as owner-private payload candidates in `packages/engine/src/activation.ts:82`, `packages/engine/src/activation.ts:190`, and `packages/engine/src/activation.ts:257`. |
| Engine run -> Chronicle builder -> persisted Match completion | Verified | Worker calls `buildChronicleFromMatch(input)` and passes the resulting Chronicle/final state to completion in `apps/worker/src/runner.ts:124`. |
| Chronicle -> replay viewer data | Verified | Web server projects stored Chronicles with public/owner projection and builds replay timeline through `createReplay` in `apps/web/app/matches/server.ts:115`. |
| Private payload -> public/owner boundaries | Verified | Builder writes private payloads under owner-specific `private.byPlayerId` refs; public projection removes refs/private data; owner projection exposes only selected owner data in `packages/replay/src/build.ts:120` and `packages/replay/src/project.ts:98`. |
| Existing `runMatch` result adaptation | Verified with typed limitation | `buildChronicleFromResult` now returns `{ ok: false, SNAPSHOT_MISSING }` instead of a partial invalid Chronicle in `packages/replay/src/build.ts:171`; regression test covers this in `packages/replay/src/build.test.ts:154`. Main production flow uses `buildChronicleFromMatch`. |

## Automated Checks

| Command | Result |
|---|---:|
| `pnpm --filter @cowards/replay test` | Passed: 7 files, 24 tests |
| `pnpm --filter @cowards/spec test -- spec.test.ts` | Passed: 1 file, 9 tests |
| `pnpm --filter @cowards/engine test -- activation.test.ts match.test.ts` | Passed: 8 files, 38 tests |
| `pnpm --filter @cowards/replay typecheck` | Passed |
| `pnpm verify` | Passed: format, lint, typecheck, and all package tests |
| Anti-pattern scan | No blocker patterns found in Phase 3 implementation files. Matches were typed empty-array returns in validation helpers, not stubs. |

## Residual Risk

Strict exhaustive Chronicle grammar is not implemented in Phase 3 and is explicitly deferred in the roadmap. Current validation requires the core completed-match event set and snapshot classes, while event-specific coverage comes from engine producers and focused tests.

No live services were required for this phase verification. Phase 5/7 storage and UI flows consume the replay APIs, but Phase 3 itself is library code.

## Gaps Summary

No blocking gaps found. The previous code-review blockers are closed in source and covered by regression tests. Phase 3 can remain passed.

---

_Verified: 2026-05-17T23:10:54Z_
_Verifier: Codex gsd-verifier_
