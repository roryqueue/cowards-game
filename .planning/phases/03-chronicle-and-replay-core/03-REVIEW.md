---
phase: 03-chronicle-and-replay-core
status: issues_found
depth: standard
reviewed_at: 2026-05-17T19:13:51Z
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
  blocker: 2
  warning: 0
  info: 0
  total: 2
---

# Phase 3: Code Review Report

**Reviewed:** 2026-05-17T19:13:51Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

Reviewed the Phase 3 Chronicle/replay contract, builder, validation, reconstruction, projection, and tests. Replay package tests currently pass, but the implementation still has two ship-blocking correctness/privacy defects in exported replay APIs.

## Critical Issues

### CR-01: BLOCKER - Public Projection Can Leak Extra Private Payload Fields

**File:** `packages/replay/src/project.ts:75`

**Issue:** `projectPublicChronicle` projects the caller-provided `Chronicle` object directly and only removes a denylist of private-looking keys via `sanitizeJson`. This is not a safe privacy boundary for persisted or externally loaded Chronicle JSON. `validateChronicle()` parses with Zod, but it returns only `{ ok: true }`, not a sanitized parsed object; a caller can validate a raw Chronicle that has schema-unknown extra fields, then pass that same raw object into `projectPublicChronicle`, and those extra fields survive unless their key is in `PRIVATE_PAYLOAD_KEYS`. That violates the Phase 3 requirement that public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or raw runtime details by default.

**Fix:** Project from a canonical parsed/sanitized Chronicle or whitelist event payload fields by event type. For example:

```ts
import { ChronicleSchema } from "@cowards/spec"

const canonicalChronicle = (chronicle: Chronicle): Chronicle =>
  ChronicleSchema.parse(chronicle) as Chronicle

export const projectPublicChronicle = (
  chronicle: Chronicle,
): ChronicleProjection => {
  const canonical = canonicalChronicle(chronicle)
  return {
    schemaVersion: canonical.schemaVersion,
    viewer: { access: "public" },
    reproducibility: cloneJson(canonical.reproducibility),
    events: canonical.events.map(projectEvent),
    snapshots: cloneJson(canonical.snapshots),
  }
}
```

Add a regression test where a validated raw Chronicle contains an extra nested private marker in an event payload under an unrecognized key, and assert public projection omits it.

### CR-02: BLOCKER - `buildChronicleFromResult` Returns Chronicles That Normal Replay Validation Rejects

**File:** `packages/replay/src/build.ts:175`

**Issue:** `buildChronicleFromResult` is exported as a Chronicle builder and returns `BuildChronicleFromMatchResult`, but it appends a full engine result event stream while creating only `MATCH_START`, `MATCH_END`, and `TERMINAL` snapshots. Any normal result containing `ROUND_STARTED` or `ACTIVATION_STARTED` events then fails `validateChronicle()` because `validateSnapshots()` requires `ROUND_START`/`ROUND_END` and `ACTIVATION_START`/`ACTIVATION_END` snapshots for those events. This produces a schema-shaped `Chronicle` that cannot be replayed by `createReplay`, so callers adapting an existing `runMatch` result can persist a broken replay artifact.

**Fix:** Do one of the following before shipping:

```ts
// Prefer: remove this adapter from the public API until a result carries snapshots.
export { buildChronicleFromMatch } from "./build.js"
```

Or change the return contract to make the limitation explicit and non-replayable:

```ts
export type BuildChronicleFromResultResult =
  | { ok: true; chronicle: Chronicle; finalState: GameState }
  | { ok: false; errors: ChronicleValidationError[] }
```

Then validate the produced artifact before returning `ok: true`. Also add a test that adapts a real `runMatch(...)` result and asserts the returned Chronicle passes `validateChronicle()` and `createReplay()`, or that the adapter returns a typed failure instead of a broken Chronicle.

---

_Reviewed: 2026-05-17T19:13:51Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
