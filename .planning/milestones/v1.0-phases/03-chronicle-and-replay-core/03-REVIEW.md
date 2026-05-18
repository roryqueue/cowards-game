---
phase: 03-chronicle-and-replay-core
status: fixed
depth: standard
reviewed_at: 2026-05-17T19:13:51Z
fixed_at: 2026-05-17T19:20:24.000Z
scope: Phase 3 changed source/config/test/docs files from 03-01 through 03-05 summaries
files_reviewed:
  - packages/engine/src/activation.ts
  - packages/engine/src/types.ts
  - packages/replay/package.json
  - packages/replay/tsconfig.json
  - packages/replay/README.md
  - packages/replay/src/build.ts
  - packages/replay/src/build.test.ts
  - packages/replay/src/determinism.test.ts
  - packages/replay/src/hash.ts
  - packages/replay/src/index.ts
  - packages/replay/src/integration.test.ts
  - packages/replay/src/integrity.test.ts
  - packages/replay/src/normalize.ts
  - packages/replay/src/project.ts
  - packages/replay/src/project.test.ts
  - packages/replay/src/reconstruct.ts
  - packages/replay/src/reconstruct.test.ts
  - packages/replay/src/validate.ts
  - packages/replay/src/validate.test.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/spec.test.ts
  - packages/spec/src/types.ts
finding_counts:
  blocker: 0
  warning: 0
  info: 0
  total: 0
fixed_findings:
  blocker: 2
  warning: 0
  info: 0
  total: 2
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-17T19:13:51Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** fixed

## Summary

Reviewed the Phase 3 Chronicle/replay contract, builder, validation, reconstruction, projection, and tests. Replay package tests currently pass, but the implementation still has two ship-blocking correctness/privacy defects in exported replay APIs.

## Critical Issues

### CR-01: BLOCKER - Public Projection Can Leak Extra Private Payload Fields

**File:** `packages/replay/src/project.ts:75`
**Status:** fixed

**Issue:** `projectPublicChronicle` projects the caller-provided `Chronicle` object directly and only removes a denylist of private-looking keys via `sanitizeJson`. This is not a safe privacy boundary for persisted or externally loaded Chronicle JSON. `validateChronicle()` parses with Zod, but it returns only `{ ok: true }`, not a sanitized parsed object; a caller can validate a raw Chronicle that has schema-unknown extra fields, then pass that same raw object into `projectPublicChronicle`, and those extra fields survive unless their key is in `PRIVATE_PAYLOAD_KEYS`. That violates the Phase 3 requirement that public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or raw runtime details by default.

**Resolution:** Public and owner projections now first parse through `ChronicleSchema`, so schema-unknown payload fields are stripped before projection. Added a regression test for an unrecognized private marker in an event payload.

### CR-02: BLOCKER - `buildChronicleFromResult` Returns Chronicles That Normal Replay Validation Rejects

**File:** `packages/replay/src/build.ts:175`
**Status:** fixed

**Issue:** `buildChronicleFromResult` is exported as a Chronicle builder and returns `BuildChronicleFromMatchResult`, but it appends a full engine result event stream while creating only `MATCH_START`, `MATCH_END`, and `TERMINAL` snapshots. Any normal result containing `ROUND_STARTED` or `ACTIVATION_STARTED` events then fails `validateChronicle()` because `validateSnapshots()` requires `ROUND_START`/`ROUND_END` and `ACTIVATION_START`/`ACTIVATION_END` snapshots for those events. This produces a schema-shaped `Chronicle` that cannot be replayed by `createReplay`, so callers adapting an existing `runMatch` result can persist a broken replay artifact.

**Resolution:** `buildChronicleFromResult` now returns a typed `ok: false` result with `SNAPSHOT_MISSING` instead of returning a broken Chronicle. Added a regression test using a real `runMatch(...)` result.

---

_Reviewed: 2026-05-17T19:13:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
