# Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity - Pattern Map

**Mapped:** 2026-07-13  
**Repository HEAD analyzed:** `180140f`  
**Scope:** 53 expected source, test, generated-artifact, and documentation surfaces  
**Primary analogs:** 13 concrete implementation/test patterns

This map is intentionally prescriptive about dependency direction and intentionally non-prescriptive about the exact private kernel type names. The planner should keep shared semantic contracts in `@cowards/spec`, the only scheduling authority in `@cowards/engine`, and Chronicle/runtime/persistence/Go/web code as validating consumers. The dirty user-owned `CowardsGameSpec_Full_Consolidated_v1.md` is an input only and must not be edited.

## File Classification

| New/modified file or file family | Role | Data flow | Closest current analog | Match |
|---|---|---|---|---|
| `packages/spec/src/semantic-integrity.ts` | utility/model | deterministic transform | `packages/replay/src/validate.ts:36-58,212-238` plus `packages/engine/src/invariants.test.ts:34-90` | role-match |
| `packages/spec/src/semantic-integrity.test.ts` | test | table-driven transform | `packages/spec/src/integrity-authority.test.ts:30-140` | role-match |
| `packages/spec/src/compatibility.ts` (if split) and `packages/spec/src/integrity-authority.ts` | model/utility | exact byte encoding and lookup | `packages/spec/src/integrity-authority.ts:184-260` | exact |
| `packages/spec/src/versions.ts` | config/model | immutable lookup | `packages/spec/src/versions.ts:3-14` | exact |
| `packages/spec/src/constants.ts` | config | immutable lookup/clone source | `packages/spec/src/runtime-evidence.ts:128-202` | role-match |
| `packages/spec/src/types.ts`, `packages/spec/src/schemas.ts`, `packages/spec/src/index.ts` | model/schema/barrel | validation/transform | `packages/spec/src/types.ts:470-605`; `schemas.ts:2045-2250`; `index.ts:1-25` | exact |
| `packages/spec/artifacts/v1.37-integrity-authority*.json` and generated service/OpenAPI contract | generated artifact | file I/O | `scripts/generate-v1-37-integrity-authority.ts:30-125` | exact |
| `packages/engine/src/kernel/types.ts` | model | event-driven state machine | `packages/engine/src/types.ts:43-81,83-134` | role-match |
| `packages/engine/src/kernel/validate.ts` | utility | deterministic transform | `packages/replay/src/validate.ts:36-58,212-238` | role-match |
| `packages/engine/src/kernel/step.ts` | service/utility | one event-driven transition | `packages/engine/src/activation.ts:310-548` and `movement.ts:21-237` | extraction |
| `packages/engine/src/kernel/driver.ts` | service | request-response plus runtime effects | `packages/engine/src/match.ts:42-148` | extraction |
| `packages/engine/src/kernel/*.test.ts` | test | deterministic transition matrix | `packages/engine/src/match.test.ts:22-89`; `invariants.test.ts:34-90` | role-match |
| `packages/engine/src/match.ts` | public facade | request-response | current `match.ts:100-148`, reduced to driver/export facade | migration |
| `packages/engine/src/activation.ts` | utility | transition primitives | current `activation.ts:63-213,227-261,310-592` | migration |
| `packages/engine/src/state.ts` | factory | transform | current `state.ts:44-107` | exact |
| `packages/engine/src/types.ts`, `packages/engine/src/index.ts` | model/barrel | API surface | current `types.ts:43-161`; `index.ts:1-10` | exact |
| `packages/engine/src/{movement,backstab,outcome,contraction}.ts` | rule primitives | deterministic transform | their current implementations; especially `movement.ts:67-218`, `backstab.ts:16-61` | preserve |
| `packages/engine/src/compatibility-fixtures.test.ts` and fixture data | differential test | batch transform | `packages/golden/src/parity.test.ts:102-188` | exact |
| existing engine `match/activation/backstab/movement/state/invariants` tests | tests | unit/regression | current colocated tests | exact |
| `packages/replay/src/record.ts` | recorder/service | transition stream to Chronicle | non-loop portions of `packages/replay/src/build.ts:42-165` | extraction |
| `packages/replay/src/build.ts` and `build.test.ts` | obsolete service/test | duplicate scheduling loop | `build.ts:185-292` is the anti-pattern to delete, not copy | delete |
| `packages/replay/src/{validate,grammar,replay-transition,snapshot-boundaries,reconstruct,index}.ts` | validator/consumer/barrel | event stream reconstruction | current files; `replay-transition.ts:467-552`, `validate.ts:144-238` | exact |
| corresponding replay tests | tests | grammar/reconstruction/differential | `validate.test.ts`, `grammar.test.ts`, `replay-transition.test.ts`, `snapshot-boundaries.test.ts` | exact |
| `apps/runtime-service/src/execute-match.ts` | service/controller | request-response plus engine effects | current `execute-match.ts:635-849` | migration |
| runtime-service `execute-match.test.ts`, `counted-safety.test.ts` | tests | request-response/failure | `execute-match.test.ts:606-708` | exact |
| `packages/persistence/src/complete-match.ts` | service | transactional CRUD | current `complete-match.ts:172-343` | exact |
| `packages/persistence/src/chronicle-store.ts` | store | transactional CRUD | current `chronicle-store.ts:171-199,241-368` | exact |
| persistence completion/Chronicle tests | integration tests | PostgreSQL CRUD/rollback | `complete-match.test.ts:219+` and Chronicle store tests | exact |
| `apps/go-backend/semantic_integrity.go` | boundary validator | deterministic transform | `runtime_service_client.go:306-387,487-510` plus `completion.go:593-738` | role-match |
| `apps/go-backend/semantic_integrity_test.go` | test | shared-vector transform | `runtime_service_client_test.go:45-68,287-398` | role-match |
| `apps/go-backend/runtime_service_client.go` | HTTP client/validator | request-response | current `runtime_service_client.go:175-230,487-510` | exact |
| `apps/go-backend/orchestrator.go`, `completion.go` | service/store | request-response then transaction | `orchestrator.go:380-392`; `completion.go:438-478,593-738` | exact |
| corresponding Go tests | tests | HTTP/DB rejection and rollback | current `runtime_service_client_test.go`, `completion_test.go`, `orchestrator_test.go` | exact |
| `apps/web/app/match-intelligence.ts`, `matches/replay-ready.ts`, replay board model/tests | consumer/component tests | event projection | current exhaustive event switches and `Record<ChronicleEventType,...>` | exact |
| `packages/test-utils/src/replay-scenarios.ts` and tests | fixture builder | batch transform | current `replay-scenarios.ts:185-221` | exact |
| `packages/golden/src/parity.test.ts`, parity fixture modules | differential tests | batch transform | current `parity.test.ts:102-188` | exact |
| `scripts/generate-go-parity-fixtures.ts` | artifact generator | file I/O/batch | `scripts/generate-v1-37-integrity-authority.ts:30-125` | role-match |
| `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` | regression probe | batch transform | its current seven independent probes at lines 60-213 | migration |
| new Phase-257 audit result/delta JSON and Markdown | generated evidence | file I/O | Phase-256 baseline handling in `check-v1-37-integrity-boundaries.ts:119-452` | exact |
| `scripts/check-v1-37-integrity-boundaries.ts` and test | structural guard | AST/file-I/O/batch | current `check-v1-37-integrity-boundaries.ts:455-994`; test lines 58-234 | exact |
| `scripts/generate-v1-37-event-coverage.ts` and test | artifact/guard generator | AST/file-I/O | `generate-v1-37-integrity-authority.ts:30-125` plus boundary AST walker `:502-647` | role-match |
| root `package.json` | config | command dispatch | existing v1.37 scripts at lines 52-54 and `boundary:monitors` at line 75 | exact |
| TypeScript inventory/surface-label generated artifacts | generated evidence | file I/O | `generate-typescript-backend-inventory.ts:199-247`; `generate-typescript-surface-labels.ts:169-183` | exact |
| current compatibility addendum/companion document (planner chooses path) | documentation | immutable ruling record | `CowardsGameSpec_CycleInterleaved_v1.4.md` as semantic style; do not edit consolidated spec | role-match |
| `apps/web/e2e/replay.fixture.spec.ts`, `replay.visual.spec.ts`, and a Phase-257 realism proof if added | browser tests | request-response/UI | `v1-36-competition-trust-proof.spec.ts:17-80`; replay visual lines 204-341 | exact |

## Pattern Assignments

### 1. Semantic integrity contract and stable issues

**Apply to:** `packages/spec/src/semantic-integrity.ts`, its test, engine kernel validation, replay/service/persistence/Go adapters.

Use the repository's existing typed-error constructor pattern from `packages/replay/src/validate.ts:36-58`, but define a new bounded invariant vocabulary rather than reusing Chronicle error codes:

```ts
const error = (
  code: ChronicleValidationError["code"],
  message: string,
  details: Omit<ChronicleValidationError, "code" | "message"> = {},
): ChronicleValidationError => ({ code, message, ...details })

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
```

The closest invariant test is `packages/engine/src/invariants.test.ts:34-90`:

```ts
const occupied = state.soldiers
  .filter((entry) => entry.status !== "FALLEN" && entry.position !== null)
  .map((entry) => positionKey(entry.position!))
expect(new Set(occupied).size, "occupancy uniqueness").toBe(occupied.length)
```

Lift this from an assertion into production validation covering arena bounds/overlap, unique IDs/occupancy, owner/player membership, status-position consistency, initiative, tuple, phase/round/activation coherence, and terminal outcome. Emit every applicable issue in a fixed precedence list; never depend on `Set`, object insertion order, locale comparison, or Zod issue ordering. Bound issue count, path length, and metadata size. Only the public top-level category crosses public output.

### 2. Kernel types: explicit commands, effects, resumes, and records

**Apply to:** `packages/engine/src/kernel/types.ts` and `packages/engine/src/types.ts`.

The current discriminated runtime result in `packages/engine/src/types.ts:69-81` is the shape convention to extend:

```ts
export interface TransitionResult<TState = GameState> {
  state: TState
  events: TransitionEventSummary[]
}

export type RuntimeResult<T> =
  | { ok: true; value: T }
  | { ok: false; violation: RuntimeViolation }
```

Model the kernel result as mutually exclusive `transition`, `effect`, `completed`, and `failure` branches. Runtime resumes must distinguish `success`, `playerViolation`, and `systemFailure`, and bind a unique effect/request identity so a duplicated, stale, or wrong-kind resume is an integrity failure. A transition record carries transition kind, exact tuple, lifecycle coordinates, validated result classification, ordered events, before/after hashes, and terminal/failure status; full private `GameState`, memories, objectives, source, and diagnostics stay outside the record.

Preserve `.js` suffix imports and type-only imports, following current engine conventions (`match.ts:1-23`). Do not expose the private cursor or raw step reducer from the package barrel unless tests prove there is no scheduling bypass.

### 3. One pure step and one effect-interpreting driver

**Apply to:** `kernel/step.ts`, `kernel/driver.ts`, `match.ts`, and kernel tests.

Extract lifecycle ordering from the existing only legitimate engine loop in `packages/engine/src/match.ts:42-148`:

```ts
while (!state.outcome && phasesRun < (input.maxPhases ?? 100)) {
  for (const roundNumber of [1, 2, 3, 4] as const) {
    const round = resolveRound(state, input.runtime)
    state = round.state
    events.push(...round.events)
  }
  if (!state.outcome) {
    const contraction = resolveContraction(state)
    state = contraction.state
    events.push(...contraction.events)
  }
}
```

Do not copy the loop literally into multiple modules. `stepMatch(machine, commandOrResume)` advances exactly one lifecycle/runtime-response edge. Its commit discipline is:

1. semantically validate incoming state/cursor/command;
2. derive a candidate without invoking I/O;
3. semantically validate candidate state/events/tuple;
4. on any issue, return the original machine and typed integrity failure;
5. only then expose the next machine/record.

`runMatch` is the single loop/effect interpreter: call `stepMatch`, invoke the injected Strategy runtime only for an effect, resume with the exact request identity, and return completed result plus transition stream and controlled recorder material. The deterministic test convention is `packages/engine/src/match.test.ts:22-55`: run identical inputs twice, compare full results/streams, and assert exactly one `MATCH_ENDED`.

### 4. Activation fixes and preserved v1.4 primitives

**Apply to:** kernel step extraction, `activation.ts`, focused regression tests, permanent audit probe.

The excess-order defect is at `activation.ts:130-196`: it shape-parses the complete Strategy result before `validOrders` caps entries. The replacement must literally slice raw orders to `state.activationCount` before validating retained entries. Invalid retained entries are player violations; the ignored suffix is never parsed and cannot backfill a bad prefix.

No-Advance ordering currently lives at `activation.ts:227-260`:

```ts
if (soldier?.status === "ACTIVE" && !slot.advanced) {
  current = replaceSoldier(current, { ...soldier, status: "STONE" })
  events.push(event("SOLDIER_STONED", { soldierId: slot.soldierId, reason: "NO_ADVANCE" }))
}
events.push(event("ACTIVATION_ENDED", { soldierId: slot.soldierId, reason: terminalReason }))
```

Keep that order, then immediately run outcome evaluation before scheduling/skipped-slot events. For Cycle-end Backstab, keep simultaneous resolution from `backstab.ts:42-60`, then re-read the actor after `activation.ts:495-513`, emit `CYCLE_ENDED`, close the slot once with `BACKSTABBED`, and evaluate outcome immediately.

Preserve, fixture-for-fixture, the current movement semantics in `movement.ts:67-218`: same-direction collision emits `MOVE_BLOCKED/ACTIVE_SOLDIER`; successful push changes only the pusher's `lastSuccessfulMoveDirection`; blocked MOVE/PUSH is non-terminal; immediate reversal remains terminal. Preserve victim-rear geometry and no attacker-facing condition in `backstab.ts:16-35`. Keep Cycle-start scans at `activation.ts:352-385`.

Delete `resolveActivation` at `activation.ts:551-592`, delete its export/callers, and provide no alias or test-only copy.

### 5. Immutable constants and atomic tuple mint

**Apply to:** `constants.ts`, `state.ts`, `versions.ts`, `integrity-authority.ts`, generated authority artifacts.

`state.ts:75-106` currently aliases `COMPATIBILITY_VERSIONS`, the parsed arena, starting positions, and terrain arrays. Use the established frozen-clone pattern from `integrity-authority.ts:215-252`:

```ts
const freezeTuple = (tuple: CanonicalCompatibilityTuple) =>
  Object.freeze({ ...tuple })

const frozenTuple = freezeTuple(tuple)
return Object.freeze({ tupleId: `sha256:${sha256}`, tuple: frozenTuple })
```

Deep-freeze nested canonical constants internally and clone nested positions/arrays into every new Match. Tests must attempt mutation through imported constants, caller arena input, returned state, and a completed first Match, then prove a second Match and the committed hashes remain pristine.

Keep rules identity at v1.4. Mint engine, Chronicle, and arena-catalog components together because the approved lifecycle fixes, event removal, and semantic arena admission change those contracts. Runtime ABI and Set policy remain unchanged unless actual bytes change. Follow fixed-order length-framed hashing at `integrity-authority.ts:184-230` and deterministic write/check at `scripts/generate-v1-37-integrity-authority.ts:83-125`. Regenerate all authority/install/inventory/surface artifacts atomically; do not mutate historical evidence or existing immutable Strategy Revision compatibility.

### 6. Chronicle recorder consumes execution; it never schedules

**Apply to:** new `packages/replay/src/record.ts`, removal of `build.ts`, replay callers and tests.

Retain the event/private-recording mechanics from `build.ts:72-165`:

```ts
for (const summary of summaries) {
  const sequence = events.length
  const context = { ...fallbackContext, ...(summary.context ?? {}) }
  // store owner-private payload by reference
  events.push({
    type: summary.type,
    sequence,
    context,
    privacy: summary.privacy ?? "public",
    payload: summary.payload,
  })
}
```

Delete the scheduling loop at `build.ts:185-292`. Replace `buildChronicleFromMatch` with `recordChronicleFromExecution({ result, transitions, recorderMaterial, metadata })`; it must not accept a `StrategyRuntime`, call `runMatch`, or import resolution/scheduling helpers. Migrate runtime-service, persistence tests, golden/parity, test-utils, replay tests, and `generate-go-parity-fixtures.ts` to call the engine driver once and then record that returned execution.

Replay reconstruction remains a consumer: `replay-transition.ts:499-552` applies events between ordered snapshots and compares reconstructed state. Extend this to semantic validation and terminal equivalence without choosing the next action or lifecycle edge.

### 7. Current event vocabulary and generated coverage

**Apply to:** spec types/schemas, replay grammar/reconstruction, web consumers, generated OpenAPI/contracts, new event coverage generator.

Remove `PUSH_ATTEMPTED` from current declarations at `types.ts:470-492` and `schemas.ts:2059-2082,2215-2220`; remove its cases from replay and these exhaustive consumers:

- `packages/replay/src/grammar.ts:27-77,768-770`
- `packages/replay/src/replay-transition.ts:180-255`
- `apps/web/app/match-intelligence.ts:332-354`
- `apps/web/app/matches/replay-ready.ts:45-54`
- `apps/web/app/matches/[matchId]/replay/replay-board-model.ts:270-272,346-369`

No committed Chronicle instance exists, so do not add a current compatibility branch. Historical v1.4 remains routed through immutable tag/blob dispatch only.

Build `generate-v1-37-event-coverage.ts` like `generate-v1-37-integrity-authority.ts:30-125`: pure `build...Artifact`, canonical `render`, fixed output list, `--write`, and byte-exact `--check`. Use the TypeScript AST-walker pattern at `check-v1-37-integrity-boundaries.ts:502-647`, not regex-only declarations. Every current declared event needs at least one engine producer and one explicit replay/web validator or consumer disposition.

### 8. Runtime-service calls only the driver and fails closed

**Apply to:** `apps/runtime-service/src/execute-match.ts` and its tests.

The service dependency-injection and schema-safe failure pattern is current `execute-match.ts:635-849`. Change the dependency from `buildChronicleFromMatch` to the public engine driver plus recorder/validator. Keep the three authority checks and source/artifact gates. After driver completion, validate final state/tuple, record transitions, validate Chronicle/reconstruction equivalence, then build the response.

On kernel/system/integrity failure, return the existing safe system-failure envelope and never record a canonical Chronicle or apply no-Advance/player cleanup. Follow `execute-match.test.ts:606-660`: inject an exception or malformed internal result, assert the stable system-failure code, retryability, and absence of source, token, host path, stack, stderr, memories, objectives, and diagnostics. Structural tests at `execute-match.test.ts:662-709` should additionally forbid replay-owned execution and direct resolution/scheduling imports.

### 9. Validate before deriving or writing in TypeScript persistence

**Apply to:** `complete-match.ts`, `chronicle-store.ts`, tests.

`complete-match.ts:172-343` already uses a transaction and locked evidence identity, but currently derives fields before semantic validation. New order:

1. validate exact tuple, final state, terminal outcome, Chronicle, and reconstruction equivalence;
2. derive completion fields only from validated data;
3. enter/lock the transaction and revalidate locked identity;
4. insert Chronicle and update Match/job atomically.

Keep the stable system-failure posture from `complete-match.ts:30-39,42-80`, and Chronicle-before-write validation from `chronicle-store.ts:171-199`. PostgreSQL tests must snapshot row counts/canonical values before invalid arena/state/tuple/Chronicle inputs and prove zero inserts/updates after rollback. Never translate these failures into player penalties or standings results.

### 10. Go mirrors boundary meanings, never gameplay scheduling

**Apply to:** `semantic_integrity.go`, runtime client/orchestrator/completion, Go tests.

Use strict HTTP decoding and bounded transport from `runtime_service_client.go:175-230` (`DisallowUnknownFields`, response byte cap, explicit system failure). Extend `validateRuntimeServiceResponse` at lines 487-510 to require semantic final-state/Chronicle/tuple validation before success. Use the existing stable failure constructor/redaction at lines 517-639.

The new Go semantic validator consumes generated TypeScript vectors and returns the same invariant codes/order. It may validate maps at the service/persistence boundary but must not implement Phase/Round/Cycle/Activation scheduling. Replace the shape-only completion seam at `completion.go:593-696`; retain compatibility/ownership checks at `completion.go:438-478` and transaction rollback. `orchestrator.go:380-392` must reject a malformed semantic payload before calling completion.

Follow table/subtest style in `runtime_service_client_test.go:287-398`: detect failure before transport when possible, assert the server/DB was not called, and assert public-safe failure details.

### 11. Differential compatibility corpus

**Apply to:** engine `compatibility-fixtures.test.ts`, golden/replay fixtures, audit result.

The closest full-flow analog is `packages/golden/src/parity.test.ts:102-188`: execute twice, compare deterministic event order, create a Chronicle, reconstruct terminal state, and separately scan public projection. Expand comparisons beyond outcome to initial state, every transition record, ordered event payload/context/privacy disposition, runtime call/observation sequence, Strategy/Soldier memory handoff, objective order, final state, outcome, and hashes.

Name independent fixtures for same-direction collision, successful-push history, every blocked movement category, illegal reversal, Cycle-interleaved snake order, Cycle-start/end/simultaneous/mutual Backstab, push/TURN boundary eligibility, contraction/final 2x2, player violation vs system failure, observation/memory/objective sequence, and exactly-one-terminal behavior.

Only D-09 through D-15 may appear in the compatibility-delta allowlist. A golden update is not a fix. Any other valid-input delta is a hard approval trigger.

### 12. Structural and audit drift guards

**Apply to:** `scripts/check-v1-37-integrity-boundaries.ts`, test, audit probe/result, package scripts.

Convert the temporary accepted-debt fingerprints at `check-v1-37-integrity-boundaries.ts:69-76` into negative guards. The existing analysis/test convention is `check-v1-37-integrity-boundaries.test.ts:58-234`: mutate one synthetic source string, run the analyzer, and assert the exact finding code/path.

Guards must prove:

- engine has the one allowed driver/lifecycle loop;
- `resolveActivation` and `buildChronicleFromMatch` are absent from exports and repository callers;
- replay has no engine scheduling/resolution imports;
- runtime-service enters through only `runMatch` then recorder/validator;
- tests, probes, golden utilities, Go, web, and persistence contain no alternate Match loop;
- every event has generated producer/consumer/validator coverage;
- public/default output rejects restricted keys recursively using the existing pattern at script lines 78-117.

Keep `.planning/artifacts/v1.37-core-rules-audit-baseline.{json,md}` immutable. Update the permanent probe to the new public kernel/driver test seam and write a separate Phase-257 result/delta artifact naming original baseline, implementation HEAD, exact tuple, expected approved deltas, and unchanged later-phase probes. Use deterministic JSON/Markdown write/check and privacy scans patterned after the existing baseline checker at script lines 119-452.

### 13. Browser realism and public privacy

**Apply to:** replay fixture/visual tests and any Phase-257 live proof.

Use the compact real-page pattern at `apps/web/e2e/v1-36-competition-trust-proof.spec.ts:58-80`: navigate to the replay, require a visible/nonblank canvas, assert it is framed, require visible Soldiers/status, and scan public body text. For stronger clipping proof reuse `replay.visual.spec.ts:204-232`, which checks nonblank/ink pixels on both halves, and its accessible event selection at lines 250-293.

The Phase-257 realism run should start from a canonical semantically admitted arena, execute a plausible complete Match through the service path when available, open its replay, and assert all visible Soldier/terrain positions are within declared bounds. Public output must not contain source/artifacts, memories, objectives, raw diagnostics, host/security data, or owner-debug content; `replay.fixture.spec.ts:15-25,77-154` is the privacy pattern.

## Shared Patterns

### Dependency direction

`@cowards/spec` owns semantic invariant codes/results and exact compatibility identity. `@cowards/engine` owns state transitions and the sole runtime-effect driver. `@cowards/replay` records/validates/reconstructs. Runtime-service invokes engine then replay. TypeScript/Go persistence validate before writes. Web only projects events. No dependency may point back upward to execute rules.

### Failure ownership

- Invalid Strategy output at the canonical legality boundary: player violation under existing v1.4 cleanup.
- Invalid arena/state/tuple/cursor/resume/transition/event/Chronicle/persisted evidence: system/integrity failure.
- System/integrity failure returns unchanged pre-transition gameplay state, creates no canonical partial Chronicle, performs no DB/result/standings mutation, and never penalizes a player.
- Restricted diagnostic evidence is bounded to stable codes, transition kind, hashes, bounded paths, and safe metadata.

### Determinism

Use fixed arrays for field/invariant/event precedence, explicit UTF-8 length-framed hashing for controlled projections, contiguous sequence assignment at recording time, and byte-exact generators. Avoid locale sort, incidental map/set traversal, time, randomness, filesystem/network/database access in engine logic, and a general recursive canonical JSON encoder (Phase 258).

### Testing cadence

Colocate Vitest tests and use `.js` imports. Every RED/GREEN task should run the narrow package test; each plan closes with affected package/service/DB tests and the structural guard. The final phase gate adds serialized repository tests, real PostgreSQL Go tests, authority/inventory/event checks, permanent audit delta, privacy boundaries, historical proof, and Playwright replay realism.

## No Direct Analog / Planner Must Specify Carefully

| Surface | Why no exact analog | Required basis |
|---|---|---|
| Resumable pure Match kernel with effect identity | Repository currently has two imperative loops and no resumable state machine | Locked D-01 through D-04 and commit-after-validation research example |
| Full `GameState` semantic validator with stable bounded multi-issue order | Current Zod and replay checks are shape/Chronicle-oriented | KERN-03, D-05 through D-08, invariant matrix |
| Full transition record with before/after hashes and controlled recorder material | Current engine returns only state/events | D-02, privacy constraints, tuple hash framing |
| Generated producer/consumer/validator event-coverage artifact | No current event-coverage generator exists | D-16 and existing deterministic generator/AST patterns |
| Phase-257 compatibility addendum | Protected consolidated spec cannot be edited; no established v1.37 addendum filename | D-09 through D-15 and exact compatibility corpus; planner selects a non-overlapping companion path |

## Planner Guardrails

- Do not plan edits to `CowardsGameSpec_Full_Consolidated_v1.md`.
- Do not preserve aliases for `resolveActivation` or `buildChronicleFromMatch`.
- Do not remove Cycle-start Backstab scans or add HOLD/END_ACTIVATION.
- Do not solve Phase-258 adversarial canonical JSON limits or Phase-259 four-language full conformance here.
- Do not mutate historical v1.4 Chronicles/results, Phase-256 audit baseline, or immutable Strategy Revision compatibility.
- Stop only for an unapproved valid-v1.4 semantic delta or another explicit trigger in `257-RESEARCH.md`.

## Metadata

**Analog search scope:** `packages/spec`, `packages/engine`, `packages/replay`, `packages/persistence`, `packages/golden`, `packages/test-utils`, `apps/runtime-service`, `apps/go-backend`, `apps/web`, `scripts`, generated artifacts, and permanent audit inputs.  
**Primary analog quality:** 7 exact, 5 extraction/migration, 1 composite role-match.  
**Pattern extraction date:** 2026-07-13.  
**Ready for planning:** yes.
