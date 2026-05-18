# Phase 9: Strict Chronicle Grammar and Compatibility - Research

**Researched:** 2026-05-18 [VERIFIED: system date]
**Domain:** TypeScript Chronicle semantic validation, replay projection privacy, compatibility gating, and Vitest validation architecture [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/project.ts]
**Confidence:** HIGH [VERIFIED: codebase inspection; VERIFIED: npm registry; CITED: https://zod.dev/v4; CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md]

<user_constraints>
## User Constraints (from CONTEXT.md)

Source for this entire section: [VERIFIED: .planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md]

### Locked Decisions
### Grammar Strictness
- **D-01:** Chronicle validation should be strict by default. Validated Chronicles must follow legal Match/Round/Activation/Cycle windows.
- **D-02:** Invalid or impossible sequences should fail closed before replay rendering. Compatibility escape hatches must be explicit and version-gated, not silent best-effort rendering.

### Board Transition Validation
- **D-03:** Validate impossible board transitions where snapshots/events provide enough information to prove impossibility.
- **D-04:** The validator should not become a full second engine and must not re-run Strategy source. It should use Chronicle data, snapshots, and event semantics.

### Compatibility Policy
- **D-05:** Support `chronicle-v1` and current compatibility versions.
- **D-06:** Unsupported future or legacy versions should produce explicit unsupported-version failure states until a migration exists.

### Privacy Tests
- **D-07:** Public projection privacy is a hard gate, not advisory coverage.
- **D-08:** Tests must prove public projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and private runtime details.
- **D-09:** Add negative fixtures that intentionally try to leak private data.

### Error Reporting
- **D-10:** Chronicle validation should return stable error codes for tests/planners and clear messages suitable for replay unavailable screens.
- **D-11:** Raw Zod-only messages should not be the primary user-facing failure output.

### the agent's Discretion
- The planner may choose the grammar validator internals, state-machine representation, fixture layout, and exact error code names as long as the behavior above is preserved.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRAM-01 | Developer can validate Chronicle event payload shape and semantic grammar before replay rendering accepts a Chronicle. | Add semantic grammar validation after `ChronicleSchema.safeParse` and before `createReplay` / replay DTO assembly. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |
| GRAM-02 | Invalid event order, missing required events, duplicate terminal events, and events outside legal Match/Round/Activation/Cycle windows fail with clear validation errors. | Extend `validateEventOrder` into an explicit Match/Round/Activation/Cycle state machine with stable error codes. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md] |
| GRAM-03 | Chronicle validation enforces required context fields and payload consistency for each event type. | Add event-specific context/payload consistency checks for `roundNumber`, `activationId`, `activationIndex`, `cycleIndex`, `actingPlayerId`, and `soldierId`. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/build.ts] |
| GRAM-04 | Chronicle validation enforces snapshot boundary rules for Match start/end, Round start/end, Activation start/end, Contraction, and terminal states. | Tighten `validateSnapshots` so each boundary kind attaches to the correct event type and expected context, not only an existing sequence. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/build.ts] |
| GRAM-05 | Chronicle validation rejects snapshots that reference missing event sequences or impossible board transitions where enough snapshot data exists to prove impossibility. | Reuse replay reconstruction/snapshot comparison helpers or extract shared board transition functions; do not re-run Strategy source. [VERIFIED: packages/replay/src/reconstruct.ts; VERIFIED: 09-CONTEXT.md] |
| GRAM-06 | Replay loading rejects unsupported Chronicle schema, engine, runtime, Strategy Revision, and Arena Variant compatibility versions with explicit failure messages. | Keep `chronicle-v1`; compare `reproducibility.versions` against `COMPATIBILITY_VERSIONS`; surface `VERSION_INCOMPATIBLE`/`UNSUPPORTED_MIGRATION`. [VERIFIED: packages/spec/src/versions.ts; VERIFIED: packages/replay/src/validate.ts] |
| GRAM-07 | Public replay projection excludes Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and private runtime details by default. | Expand projection privacy tests with hostile nested markers and fixture/web DTO paths. [VERIFIED: packages/replay/src/project.ts; VERIFIED: packages/replay/src/project.test.ts; VERIFIED: apps/web/app/matches/replay-fixture.test.ts] |
| GRAM-08 | Developer can run negative Chronicle grammar fixtures for corrupted, impossible, private-leaking, and version-incompatible Chronicles. | Add table-driven negative fixtures in replay/test-utils tests and include focused package commands in the phase gate. [VERIFIED: packages/replay/src/validate.test.ts; VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts; CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md] |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, or private runtime data by default. [VERIFIED: AGENTS.md; VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]
- Engine rules need focused unit tests and invariant/property-style tests; replay needs deterministic reconstruction and integrity tests. [VERIFIED: AGENTS.md]

## Summary

Phase 9 should make `packages/replay` the authoritative acceptance gate for Chronicles before any replay DTO or UI rendering path consumes them. [VERIFIED: .planning/ROADMAP.md; VERIFIED: apps/web/app/matches/replay-ready.ts] Existing validation already performs Zod shape parsing, version checks, contiguous sequence checks, required completed-event checks, snapshot existence checks, and optional hash checks. [VERIFIED: packages/replay/src/validate.ts] The missing implementation surface is semantic grammar: legal Match/Round/Activation/Cycle windows, context/payload consistency, boundary-specific snapshots, impossible transitions proven from snapshots/events, privacy-leak fixtures, and clear compatibility errors. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts]

Use a small explicit grammar validator in `packages/replay/src/validate.ts` or a sibling module called from `validateParsedChronicle`; keep Zod for shape and TypeScript inference, and keep reconstruction for board-state comparison. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts; CITED: https://zod.dev/v4] Do not re-run Strategy code and do not move rules into React; the validator should use event semantics, snapshots, and existing reconstructed state comparisons only where the Chronicle data is sufficient. [VERIFIED: 09-CONTEXT.md; VERIFIED: AGENTS.md; VERIFIED: packages/replay/src/reconstruct.ts]

**Primary recommendation:** Implement a post-Zod finite-state Chronicle grammar validator in `packages/replay`, add targeted error codes in `@cowards/spec`, and gate replay DTO assembly through `validateChronicle`/`createReplay` with table-driven negative fixtures. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts; VERIFIED: apps/web/app/matches/replay-ready.ts]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Chronicle schema shape | `packages/spec` | `packages/replay` | `ChronicleSchema`, event discriminated unions, snapshot schemas, and validation error schemas already live in spec. [VERIFIED: packages/spec/src/schemas.ts] |
| Semantic Chronicle grammar | `packages/replay` | `packages/spec` | Replay validation currently owns `validateChronicle`; spec should expose only stable error-code/schema contracts. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/spec/src/schemas.ts] |
| Snapshot and board transition checks | `packages/replay` | `packages/engine` as reference only | `reconstruct.ts` already applies replay events and compares boundary snapshots without StrategyRuntime execution. [VERIFIED: packages/replay/src/reconstruct.ts] |
| Compatibility/version policy | `packages/spec` | `packages/replay` | Current version constants are in `COMPATIBILITY_VERSIONS`; replay compares Chronicle versions against them. [VERIFIED: packages/spec/src/versions.ts; VERIFIED: packages/replay/src/validate.ts] |
| Public/owner projection privacy | `packages/replay` | `apps/web` tests | `projectPublicChronicle` and `projectOwnerChronicle` own projection; web should consume the projection path, not re-filter raw Chronicles. [VERIFIED: packages/replay/src/project.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Replay unavailable messaging | `apps/web` | `packages/replay` | Web converts replay validation/projection errors into unavailable DTOs; replay owns stable codes/messages. [VERIFIED: apps/web/app/matches/replay-ready.ts; VERIFIED: packages/replay/src/validate.ts] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.3, published 2026-04-16 | Shared types and package contracts. [VERIFIED: package.json; VERIFIED: npm registry] | Existing monorepo uses TypeScript across spec, replay, web, engine, worker, and test-utils. [VERIFIED: package.json] |
| Zod | 4.4.3, published 2026-05-04 | Runtime shape validation and inferred Chronicle/event types. [VERIFIED: package.json; VERIFIED: npm registry] | Existing `ChronicleSchema` uses Zod discriminated unions; Zod v4 supports discriminated unions and `safeParse`. [VERIFIED: packages/spec/src/schemas.ts; CITED: https://zod.dev/v4] |
| `@cowards/spec` | 0.1.0 workspace package | Canonical schema, compatibility versions, validation error-code contract. [VERIFIED: packages/spec/package.json; VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/spec/src/versions.ts] | It already exports Chronicle schemas, `COMPATIBILITY_VERSIONS`, and validation result schemas. [VERIFIED: packages/spec/src/index.ts] |
| `@cowards/replay` | 0.1.0 workspace package | Chronicle build, validate, reconstruct, hash, normalize, and project. [VERIFIED: packages/replay/package.json; VERIFIED: packages/replay/src/index.ts] | Replay validation/projection are already centralized here, matching the phase boundary. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/project.ts] |
| Vitest | 4.1.6, published 2026-05-11 | Unit/integration and negative fixture tests. [VERIFIED: package.json; VERIFIED: npm registry] | Existing packages use `vitest run`; Vitest supports parameterized `test.each` for fixture matrices. [VERIFIED: package.json; CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright | 1.60.0, published 2026-05-11 | Browser replay privacy/UI smoke and visual checks. [VERIFIED: package.json; VERIFIED: npm registry] | Use only for browser-level public projection/privacy regressions; keep grammar validation in package tests. [VERIFIED: apps/web/e2e/replay.fixture.spec.ts; VERIFIED: apps/web/e2e/replay.visual.spec.ts] |
| Next.js | 16.2.6, published 2026-05-07 | Web replay loading/unavailable DTOs. [VERIFIED: apps/web/package.json; VERIFIED: npm registry] | Touch only replay server/helper tests if validation errors need clearer unavailable messages. [VERIFIED: apps/web/app/matches/server.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing Zod + semantic validator | AJV/JSON Schema validator | Not recommended for this phase because Chronicle schemas and type inference already use Zod, and the missing work is semantic grammar beyond JSON shape. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts] |
| Replay event/snapshot comparison | A second engine simulator | Not recommended because phase decisions forbid a full second engine and forbid re-running Strategy source for validation. [VERIFIED: 09-CONTEXT.md] |
| Package-level negative fixtures | Browser-only invalid replay tests | Not recommended because invalid Chronicles must fail before rendering, while browser tests are a secondary projection/privacy guard. [VERIFIED: .planning/ROADMAP.md; VERIFIED: apps/web/app/matches/replay-ready.ts] |

**Installation:**
```bash
# No new package is required for Phase 9.
pnpm install
```
[VERIFIED: package.json; VERIFIED: packages/replay/package.json]

**Version verification:** `npm view zod version`, `npm view vitest version`, `npm view typescript version`, `npm view @playwright/test version`, and `npm view next version` were run during research. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```txt
Raw Chronicle input
  -> ChronicleSchema.safeParse
      -> fail SCHEMA_INVALID
  -> compatibility check against COMPATIBILITY_VERSIONS
      -> fail VERSION_INCOMPATIBLE / UNSUPPORTED_MIGRATION
  -> sequence and terminal checks
      -> fail EVENT_ORDER_INVALID / REQUIRED_EVENT_MISSING
  -> semantic grammar state machine
      -> fail EVENT_ORDER_INVALID / CONTEXT_MISSING / PAYLOAD_INCONSISTENT
  -> snapshot boundary validation
      -> fail SNAPSHOT_MISSING / SNAPSHOT_MISMATCH
  -> optional reconstruction/snapshot transition checks
      -> fail SNAPSHOT_MISMATCH
  -> optional integrity hash check
      -> fail HASH_MISMATCH
  -> projection
      -> public projection strips private payloads
      -> owner projection exposes only requested player private section
  -> replay DTO / unavailable DTO
```
[VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts; VERIFIED: packages/replay/src/project.ts; VERIFIED: apps/web/app/matches/replay-ready.ts]

### Recommended Project Structure

```txt
packages/replay/src/
├── validate.ts                 # public validateChronicle, migration, orchestration
├── grammar.ts                  # semantic event-window/context validator if validate.ts grows too large
├── grammar.test.ts             # negative grammar fixture matrix
├── validate.test.ts            # schema/version/hash/top-level validation
├── reconstruct.ts              # replay state application and snapshot comparison
└── project.test.ts             # public/owner privacy projection tests

packages/test-utils/src/
├── replay-scenarios.ts         # legal engine-generated canonical scenarios
├── replay-scenarios.legality.test.ts
└── chronicle-negative-fixtures.ts # shared corrupted/impossible/private-leaking fixture builders if reused
```
[VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts; VERIFIED: packages/replay/src/project.test.ts; VERIFIED: packages/test-utils/src/replay-scenarios.ts]

### Pattern 1: Validate Shape Before Semantics

**What:** Parse with `ChronicleSchema.safeParse`, then run semantic validators on the parsed `Chronicle`. [VERIFIED: packages/replay/src/validate.ts; CITED: https://zod.dev/v4]

**When to use:** Every public validation, migration, replay reconstruction, and replay DTO path. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts; VERIFIED: apps/web/app/matches/replay-ready.ts]

**Example:**
```typescript
const parsed = ChronicleSchema.safeParse(chronicle)
if (!parsed.success) {
  return { ok: false, errors: [schemaInvalid(parsed.error)] }
}
return validateParsedChronicle(parsed.data as Chronicle)
```
[VERIFIED: packages/replay/src/validate.ts]

### Pattern 2: Explicit Grammar State

**What:** Track Match/Round/Activation/Cycle state while iterating sorted events exactly once. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md]

**When to use:** Event windows such as `ACTION_EMITTED` requiring an open Activation/Cycle and `CONTRACTION_RESOLVED` occurring only after Round 4 / phase boundary. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md; VERIFIED: packages/replay/src/build.ts]

**Example:**
```typescript
for (const event of chronicle.events) {
  switch (event.type) {
    case "MATCH_STARTED":
      // require sequence 0 and unopened match
      break
    case "ROUND_STARTED":
      // require match open and no duplicate active round boundary
      break
    case "ACTION_EMITTED":
      // require activation open, soldier context, and matching cycleIndex
      break
  }
}
```
[VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/spec/src/schemas.ts]

### Pattern 3: Compare Snapshots at Canonical Boundaries

**What:** Boundary snapshots must reference an existing event, attach to compatible event types, and match reconstructed state when enough prior data exists. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts]

**When to use:** `MATCH_START`, `ROUND_START`, `ACTIVATION_START`, `ACTIVATION_END`, `ROUND_END`, `CONTRACTION`, `MATCH_END`, and `TERMINAL`. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/build.ts]

**Example:**
```typescript
const snapshotEvent = chronicle.events[snapshot.sequence]
if (!snapshotEvent) {
  errors.push(error("SNAPSHOT_MISSING", "Snapshot must reference an event."))
}
```
[VERIFIED: packages/replay/src/validate.ts]

### Anti-Patterns to Avoid

- **Raw Zod errors as replay UX:** Preserve Zod issue details under `actual`, but return stable error codes and clear user-facing messages. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: 09-CONTEXT.md]
- **Shadow engine:** Do not re-run Strategy source or duplicate all engine rules; validate only grammar and provable event/snapshot contradictions. [VERIFIED: AGENTS.md; VERIFIED: 09-CONTEXT.md]
- **React rule inference:** Replay components should render DTOs and not decide legal Chronicle grammar. [VERIFIED: AGENTS.md; VERIFIED: apps/web/app/matches/[matchId]/replay/replay-state.ts]
- **Silent best-effort rendering:** Unsupported versions or impossible Chronicles must produce unavailable/failure states before rendering. [VERIFIED: .planning/ROADMAP.md; VERIFIED: apps/web/app/matches/replay-ready.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime schema parsing | Custom JSON object validators | Zod schemas in `@cowards/spec` | Existing Chronicle/event/action schemas already define shape and inferred TypeScript types. [VERIFIED: packages/spec/src/schemas.ts; CITED: https://zod.dev/v4] |
| Chronicle hash normalization | Ad hoc stringify/hash logic | `createChronicleContentHash` and `normalizeChronicle` | Existing validator already uses package hash helpers for integrity checks. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/hash.ts] |
| Replay state reconstruction | A second rules engine | `createReplay`/shared transition helpers | Existing reconstruction applies Chronicle events and compares snapshots without StrategyRuntime. [VERIFIED: packages/replay/src/reconstruct.ts] |
| Public projection privacy | Web-layer string deletion | `projectPublicChronicle` with negative marker tests | Projection is centralized in `packages/replay`; web tests already assert fixture privacy through the shared path. [VERIFIED: packages/replay/src/project.ts; VERIFIED: apps/web/app/matches/replay-fixture.test.ts] |
| Negative fixture execution matrix | Repeated copy-paste tests | Vitest `test.each` / table-driven cases | Vitest documents parameterized tests for repeated fixture cases. [CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md] |

**Key insight:** Chronicle grammar is a replay trust contract, not a UI convenience; the validator should reject bad artifacts before React, persistence, or browser replay can make ambiguous states look authoritative. [VERIFIED: .planning/ROADMAP.md; VERIFIED: 09-CONTEXT.md; VERIFIED: apps/web/app/matches/replay-ready.ts]

## Common Pitfalls

### Pitfall 1: Schema-Valid But Semantically Impossible Chronicle

**What goes wrong:** `ChronicleSchema.safeParse` accepts events whose order, context, or board transition cannot happen in a legal Match. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts]

**Why it happens:** Zod validates object shape and discriminators, while semantic windows require state over multiple events. [VERIFIED: packages/spec/src/schemas.ts; CITED: https://zod.dev/v4]

**How to avoid:** Add a state-machine grammar pass and keep impossible transition fixtures in `packages/replay` or `packages/test-utils`. [VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts]

**Warning signs:** New tests only mutate payload shape or sequence numbers, not legal event windows or snapshot/event contradictions. [VERIFIED: packages/replay/src/validate.test.ts]

### Pitfall 2: Snapshot Presence Without Boundary Meaning

**What goes wrong:** A snapshot references an existing sequence but the event at that sequence is not the boundary implied by the snapshot kind. [VERIFIED: packages/replay/src/validate.ts]

**Why it happens:** Current validation checks whether the referenced sequence exists, not whether `CONTRACTION` attaches to `CONTRACTION_RESOLVED` or `TERMINAL` attaches to `MATCH_ENDED`. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/build.ts]

**How to avoid:** Maintain a snapshot-kind-to-event-type matrix and validate context equality for round/activation snapshots. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/build.ts]

**Warning signs:** A corrupted snapshot sequence passes `validateChronicle` but fails later in `createReplay` or UI rendering. [VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts; VERIFIED: packages/replay/src/reconstruct.ts]

### Pitfall 3: Privacy Tests Only Check Top-Level Keys

**What goes wrong:** Nested private markers in event payloads, runtime details, or private sections leak into public projection. [VERIFIED: packages/replay/src/project.ts; VERIFIED: packages/replay/src/project.test.ts]

**Why it happens:** Helpful debug fields can be nested under new names that are not included in the sanitizer denylist. [VERIFIED: packages/replay/src/project.ts; VERIFIED: .planning/research/PITFALLS.md]

**How to avoid:** Use hostile marker fixtures that place Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid details, and runtime details at multiple nesting depths, then assert serialized public DTO absence. [VERIFIED: packages/replay/src/project.test.ts; VERIFIED: 09-CONTEXT.md]

**Warning signs:** Projection tests assert only `projection.ownerPrivate` absence and do not scan serialized public output. [VERIFIED: packages/replay/src/project.test.ts]

### Pitfall 4: Error Codes Too Coarse For Planning And UI

**What goes wrong:** Multiple invalid Chronicle classes collapse into `EVENT_ORDER_INVALID` or `SNAPSHOT_MISMATCH`, making tests and replay unavailable screens hard to diagnose. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts]

**Why it happens:** Current enum has broad codes and no grammar-specific codes for context or payload consistency. [VERIFIED: packages/spec/src/schemas.ts]

**How to avoid:** Add stable codes such as `EVENT_WINDOW_INVALID`, `CONTEXT_MISSING`, `CONTEXT_MISMATCH`, `PAYLOAD_INCONSISTENT`, and `PRIVACY_LEAK_DETECTED`, or document why existing codes are sufficient before implementation. [VERIFIED: 09-CONTEXT.md; VERIFIED: packages/spec/src/schemas.ts]

**Warning signs:** Tests assert only `ok === false` or a generic code instead of exact code/message pairs. [VERIFIED: packages/replay/src/validate.test.ts]

## Code Examples

### Existing Validation Orchestration

```typescript
const errors = [
  ...validateVersion(chronicle),
  ...validateEventOrder(chronicle),
  ...validateRequiredEvents(chronicle),
  ...validateSnapshots(chronicle),
  ...validateHash(chronicle),
]
```
[VERIFIED: packages/replay/src/validate.ts]

### Existing Public Projection Sanitization

```typescript
const PRIVATE_PAYLOAD_KEYS = new Set([
  "awarenessGrid",
  "exactAwarenessGrid",
  "objective",
  "objectivePayload",
  "rawRuntimeDetails",
  "runtimeDetails",
  "soldierMemory",
  "source",
  "strategyMemory",
  "strategySource",
  "violation",
])
```
[VERIFIED: packages/replay/src/project.ts]

### Existing Fixture Legality Failure Pattern

```typescript
const message = chronicleError(scenarioId, errors).message
expect(message).toMatch(/^\[Chronicle validation\]/)
expect(errors.map((error) => error.code)).toEqual(
  expect.arrayContaining([expect.stringMatching(/^SNAPSHOT_(MISMATCH|MISSING)$/)]),
)
```
[VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-authored replay demos with guarded corrections | Engine-generated canonical replay scenarios in `packages/test-utils` | Phase 8 on 2026-05-18 | Phase 9 should reuse legal scenarios and mutate copies for negative fixtures. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md; VERIFIED: packages/test-utils/src/replay-scenarios.ts] |
| Shape/sequence/snapshot-presence validation | Add strict semantic grammar and compatibility checks before rendering | Phase 9 target | Invalid Chronicles fail closed with clear codes/messages before replay UI. [VERIFIED: .planning/ROADMAP.md; VERIFIED: packages/replay/src/validate.ts] |
| Projection privacy covered by package tests | Projection privacy also covered through generated fixture/web DTO paths | Phase 8 on 2026-05-18 | Phase 9 should turn privacy-leak negative fixtures into a hard gate. [VERIFIED: packages/replay/src/project.test.ts; VERIFIED: apps/web/app/matches/replay-fixture.test.ts; VERIFIED: 09-CONTEXT.md] |
| Zod v3-era discriminated union assumptions | Zod v4 discriminated unions and `safeParse` remain appropriate | Zod 4.4.3 verified 2026-05-18 | No schema library migration is needed for this phase. [VERIFIED: npm registry; CITED: https://zod.dev/v4] |

**Deprecated/outdated:**
- Treating parsed Chronicles as replay-trustworthy is outdated for v1.1 because requirements GRAM-01 through GRAM-08 require semantic grammar, version, privacy, and negative-fixture enforcement. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | No `[ASSUMED]` claims were used. | All sections | — |

## Open Questions

1. **Should new validation error codes be added to `ChronicleValidationErrorCodeSchema` or should existing broad codes be reused?** [VERIFIED: packages/spec/src/schemas.ts]
   - What we know: Context D-10 requires stable codes and current codes are broad. [VERIFIED: 09-CONTEXT.md; VERIFIED: packages/spec/src/schemas.ts]
   - What's unclear: The exact code names are discretionary. [VERIFIED: 09-CONTEXT.md]
   - Recommendation: Add grammar-specific codes rather than overloading `EVENT_ORDER_INVALID` and `SNAPSHOT_MISMATCH`. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts]
2. **Should grammar internals stay in `validate.ts` or move to `grammar.ts`?** [VERIFIED: packages/replay/src/validate.ts]
   - What we know: `validate.ts` is already the public validation entrypoint. [VERIFIED: packages/replay/src/validate.ts]
   - What's unclear: The final implementation size. [VERIFIED: 09-CONTEXT.md]
   - Recommendation: Keep orchestration in `validate.ts`; extract `grammar.ts` if semantic checks exceed a small helper set. [VERIFIED: packages/replay/src/validate.ts]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Package tests and scripts | Yes | v24.15.0 | None needed. [VERIFIED: local environment] |
| pnpm | Workspace scripts | Yes | 11.1.2 | npm is present but project scripts expect pnpm. [VERIFIED: local environment; VERIFIED: package.json] |
| npm | Registry version verification | Yes | 11.12.1 | None needed. [VERIFIED: local environment] |
| Git | Atomic research commit | Yes | 2.39.2 | None needed. [VERIFIED: local environment] |
| Docker | Not required for Phase 9 focused package tests | Yes | 29.4.3 | Skip for focused grammar work. [VERIFIED: local environment; VERIFIED: package.json] |

**Missing dependencies with no fallback:** None found for Phase 9 research/planning. [VERIFIED: local environment]

**Missing dependencies with fallback:** None found for Phase 9 research/planning. [VERIFIED: local environment]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 for package tests; Playwright 1.60.0 for browser replay checks. [VERIFIED: package.json; VERIFIED: npm registry] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts`. [VERIFIED: filesystem] |
| Quick run command | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts project.test.ts` [VERIFIED: packages/replay/package.json] |
| Full suite command | `pnpm --filter @cowards/replay test && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts && pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts && pnpm --filter @cowards/replay typecheck && pnpm --filter @cowards/web typecheck` [VERIFIED: package.json; VERIFIED: packages/replay/package.json; VERIFIED: packages/test-utils/package.json; VERIFIED: apps/web/package.json] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| GRAM-01 | Shape parse plus semantic grammar gate before replay rendering | unit/integration | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts` | `validate.test.ts` exists; `grammar.test.ts` Wave 0 gap. [VERIFIED: packages/replay/src/validate.test.ts; VERIFIED: filesystem] |
| GRAM-02 | Invalid event windows and duplicate/missing terminal events fail with clear codes | unit | `pnpm --filter @cowards/replay test -- grammar.test.ts` | Wave 0 gap. [VERIFIED: packages/replay/src/validate.test.ts] |
| GRAM-03 | Event context and payload consistency enforced | unit | `pnpm --filter @cowards/replay test -- grammar.test.ts` | Wave 0 gap. [VERIFIED: packages/spec/src/schemas.ts] |
| GRAM-04 | Snapshot boundary kind/sequence/context rules enforced | unit/integration | `pnpm --filter @cowards/replay test -- validate.test.ts reconstruct.test.ts` | Existing tests cover partial behavior; add cases. [VERIFIED: packages/replay/src/validate.test.ts; VERIFIED: packages/replay/src/reconstruct.test.ts] |
| GRAM-05 | Provably impossible board transitions rejected | integration | `pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts && pnpm --filter @cowards/replay test -- reconstruct.test.ts grammar.test.ts` | Existing legality tests cover push/contraction; add replay grammar fixtures. [VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts] |
| GRAM-06 | Unsupported schema/engine/runtime/StrategyRevision/ArenaVariant versions rejected explicitly | unit | `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts` | Existing version test covers one component; expand matrix. [VERIFIED: packages/replay/src/validate.test.ts; VERIFIED: packages/spec/src/versions.ts] |
| GRAM-07 | Public projection excludes private source/memory/objective/awareness/runtime details | unit/web integration | `pnpm --filter @cowards/replay test -- project.test.ts && pnpm --filter @cowards/web test -- replay-fixture.test.ts` | Existing tests cover many markers; add hostile negative fixture variants. [VERIFIED: packages/replay/src/project.test.ts; VERIFIED: apps/web/app/matches/replay-fixture.test.ts] |
| GRAM-08 | Negative fixture corpus covers corrupted, impossible, private-leaking, incompatible Chronicles | unit/integration | `pnpm --filter @cowards/replay test -- grammar.test.ts validate.test.ts project.test.ts && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts` | Wave 0 gap for centralized negative fixture builders. [VERIFIED: packages/replay/src/validate.test.ts; VERIFIED: packages/test-utils/src/replay-scenarios.legality.test.ts] |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/replay test -- validate.test.ts grammar.test.ts project.test.ts` [VERIFIED: packages/replay/package.json]
- **Per wave merge:** `pnpm --filter @cowards/replay test && pnpm --filter @cowards/test-utils test -- replay-scenarios.legality.test.ts && pnpm --filter @cowards/web test -- server.test.ts replay-fixture.test.ts` [VERIFIED: package.json]
- **Phase gate:** Focused package/web commands plus `pnpm --filter @cowards/replay typecheck && pnpm --filter @cowards/test-utils typecheck && pnpm --filter @cowards/web typecheck`; run `pnpm verify` if the pre-existing `apps/web/next-env.d.ts` Prettier warning is resolved. [VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md; VERIFIED: package.json]

### Wave 0 Gaps

- [ ] `packages/replay/src/grammar.test.ts` — table-driven event-window/context/snapshot-boundary negative fixtures for GRAM-01 through GRAM-06. [VERIFIED: filesystem]
- [ ] `packages/replay/src/chronicle-negative-fixtures.ts` or local test helpers — corrupted, impossible, private-leaking, and incompatible fixture builders for GRAM-08. [VERIFIED: filesystem]
- [ ] Expanded `packages/replay/src/project.test.ts` hostile nested privacy marker cases for GRAM-07. [VERIFIED: packages/replay/src/project.test.ts]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | No direct auth change in Phase 9 | Preserve owner-only projection inputs and do not broaden owner access in replay DTOs. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/replay/src/project.ts] |
| V3 Session Management | No direct session change in Phase 9 | No new session storage or cookies are needed for package-level grammar validation. [VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: packages/replay/package.json] |
| V4 Access Control | Yes | Public projection must not expose owner/private Chronicle data, and owner projection must return only requested player private section. [VERIFIED: packages/replay/src/project.ts; VERIFIED: packages/replay/src/project.test.ts; CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/] |
| V5 Validation, Sanitization and Encoding | Yes | Use Zod shape parsing plus semantic Chronicle grammar validation before replay rendering. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: packages/replay/src/validate.ts; CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/] |
| V6 Stored Cryptography | Limited | Preserve Chronicle integrity hash validation; do not introduce new cryptographic primitives. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/hash.ts; CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/] |

### Known Threat Patterns for TypeScript Chronicle Replay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered Chronicle event windows | Tampering | Fail closed in `validateChronicle` before `createReplay`/projection. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Unsupported future/legacy Chronicle version rendered as best effort | Tampering / Repudiation | Reject with `VERSION_INCOMPATIBLE` or `UNSUPPORTED_MIGRATION` until a migration exists. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: 09-CONTEXT.md] |
| Private debug data in public replay | Information Disclosure | Centralized public projection sanitizer plus hostile marker tests. [VERIFIED: packages/replay/src/project.ts; VERIFIED: packages/replay/src/project.test.ts] |
| Ambiguous validation failures | Repudiation | Stable validation error codes and clear unavailable messages. [VERIFIED: packages/spec/src/schemas.ts; VERIFIED: apps/web/app/matches/replay-ready.ts] |
| Snapshot/event contradiction accepted | Tampering | Boundary snapshot event-type/context matrix plus reconstruction comparison where data is sufficient. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: packages/replay/src/reconstruct.ts] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` — project constraints, non-negotiables, testing expectations. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — v1.1 and Phase 9 scope. [VERIFIED: .planning/PROJECT.md; VERIFIED: .planning/REQUIREMENTS.md; VERIFIED: .planning/ROADMAP.md; VERIFIED: .planning/STATE.md]
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md` — locked decisions and discretion. [VERIFIED: 09-CONTEXT.md]
- `.planning/research/SUMMARY.md`, `.planning/research/STACK.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/PITFALLS.md` — milestone research direction. [VERIFIED: .planning/research/SUMMARY.md; VERIFIED: .planning/research/STACK.md; VERIFIED: .planning/research/ARCHITECTURE.md; VERIFIED: .planning/research/PITFALLS.md]
- `CowardsGameSpec_Full_Consolidated_v1.md` and `CowardsGame_Technical_Architecture_Spec_V1.md` — Chronicle, determinism, memory/privacy, replay architecture, and Match semantics. [VERIFIED: CowardsGameSpec_Full_Consolidated_v1.md; VERIFIED: CowardsGame_Technical_Architecture_Spec_V1.md]
- `packages/spec/src/schemas.ts`, `packages/spec/src/versions.ts`, `packages/replay/src/validate.ts`, `packages/replay/src/reconstruct.ts`, `packages/replay/src/project.ts`, `packages/replay/src/build.ts` — current implementation. [VERIFIED: codebase]
- `packages/replay/src/*.test.ts`, `packages/test-utils/src/replay-scenarios*.ts`, `apps/web/app/matches/*test.ts` — current validation/projection/fixture tests. [VERIFIED: codebase]
- npm registry — current package versions and publish dates for Zod, Vitest, TypeScript, Playwright, and Next. [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)

- Zod v4 docs for discriminated unions and schema validation behavior. [CITED: https://zod.dev/v4]
- Vitest v4.1.6 docs for parameterized tests and fixtures. [CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/api/test.md; CITED: https://github.com/vitest-dev/vitest/blob/v4.1.6/docs/guide/learn/setup-teardown.md]
- OWASP ASVS Developer Guide for ASVS category names. [CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/]

### Tertiary (LOW confidence)

- None. [VERIFIED: research log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package versions and current code paths were verified from `package.json`, npm registry, and source files. [VERIFIED: package.json; VERIFIED: npm registry; VERIFIED: codebase]
- Architecture: HIGH — package boundaries and replay entrypoints were verified directly in source. [VERIFIED: packages/replay/src/index.ts; VERIFIED: apps/web/app/matches/replay-ready.ts]
- Pitfalls: HIGH — pitfalls map directly to existing validation gaps, context decisions, and Phase 8 validation evidence. [VERIFIED: packages/replay/src/validate.ts; VERIFIED: 09-CONTEXT.md; VERIFIED: .planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-VALIDATION.md]

**Research date:** 2026-05-18 [VERIFIED: system date]
**Valid until:** 2026-06-17 for stack/package guidance; revisit sooner if `@cowards/spec` compatibility versions change. [VERIFIED: packages/spec/src/versions.ts]
