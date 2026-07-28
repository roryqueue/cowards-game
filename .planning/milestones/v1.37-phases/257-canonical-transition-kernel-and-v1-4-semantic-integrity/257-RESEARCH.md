# Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity — Research

**Researched:** 2026-07-13  
**HEAD revalidated:** `180140f`  
**Confidence:** HIGH for repository architecture, current defects, and prescribed implementation; all recommendations derive from locked Phase 257 decisions and current repository evidence. [VERIFIED: `git rev-parse --short HEAD`; `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md`; repository inspection]

<user_constraints>
## User Constraints

### Kernel transition contract
- **D-01:** One kernel step is one explicit validated state-machine transition at a lifecycle or runtime-response boundary. An engine-owned driver repeatedly invokes the kernel for a complete Match.
- **D-02:** Each authoritative transition record contains transition kind, semantic compatibility tuple, lifecycle coordinates, validated input/result classification, ordered canonical events, before/after state hashes, and terminal/failure status. Full private state remains in controlled execution context rather than the event envelope.
- **D-03:** Runtime calls are effects-as-data. The pure kernel yields a typed request; the engine driver invokes the runtime boundary and resumes the kernel with success, player violation, or system failure.
- **D-04:** One public engine Match driver returns both canonical result and transition stream. Direct execution and runtime-service call it; Chronicle records its transitions and never runs a second Match loop.

### Semantic-validation behavior
- **D-05:** Full semantic validation runs on incoming state/command and outgoing state/events for every kernel transition in every environment, then again at runtime-service, persistence, and reconstruction trust boundaries.
- **D-06:** Classify validation failures by ownership. Invalid canonical state, arena, tuple, transition output, or persisted evidence is a system/integrity failure. Only invalid Strategy output at the canonical legality boundary may become a player violation.
- **D-07:** A failed transition returns the unchanged pre-transition state and a typed failure. No invalid or partial Chronicle becomes canonical Match evidence; a restricted diagnostic record may retain hashes, transition kind, stable codes, and safe metadata.
- **D-08:** Validators return a deterministic bounded set of stable invariant codes in canonical order. Operator detail uses bounded paths and metadata; public output receives a safe top-level category.

### Exact compatibility rulings
- **D-09:** Cap the raw activation-order list at the Round quota before validation. Validate every retained-prefix entry for shape, identity, ownership, status, and duplication; ignored excess entries cannot invalidate the prefix.
- **D-10:** If Cycle-end Backstab stones/falls the actor, finish the simultaneous scan and Backstab events, close the slot with explicit terminal reason `BACKSTABBED`, then evaluate Match outcome immediately.
- **D-11:** If no-Advance cleanup removes the final active Soldier, canonical ordering is status-change event, activation-slot closure with the no-Advance reason, then immediate Match outcome before any further scheduling/skipped-slot event.
- **D-12:** Preserve the approved v1.4 bundle: same-direction rear approach blocks; successful push updates the pusher's successful-move history to the attempted direction and preserves the pushed Soldier's prior history; blocked MOVE/PUSH is non-terminal; outcome follows every active-count/status change; Backstab uses the victim rear square without attacker-facing; Cycle-start scans remain unless the optional later equivalence proof passes.

### API and event cleanup
- **D-13:** Remove the contiguous `resolveActivation` public export and internal wrapper completely. Provide no compatibility alias or test-only copy; rewrite callers and tests onto kernel transitions or the canonical Match driver.
- **D-14:** Remove `PUSH_ATTEMPTED` from the current event vocabulary because canonical resolved/blocked effects already cover it. Retain a historical-only decoder branch only if committed evidence actually contains it.
- **D-15:** Removing a declared event is a semantic contract change: mint/certify the corresponding current tuple component version rather than calling it documentation cleanup. Historical v1.4 decoding remains untouched.
- **D-16:** Structural guards forbid replay imports of scheduling/resolution functions, restrict runtime-service to the Match driver, snapshot package exports, require current event producer/consumer/validator coverage, and detect duplicate Phase/Round/Cycle/Activation/Contraction loops outside engine authority.

### the agent's Discretion
- Kernel command/type names, transition hashing encoding, validation module layout, and exact stable code names are left to research and planning within these locked semantics.

### Deferred Ideas
- Removing Cycle-start Backstab scans remains optional and requires complete reachable-state, event, terminal, and observation equivalence proof.
- Adding `HOLD`/`END_ACTIVATION` remains outside required completion and requires separate approval plus semantic equivalence proof.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Requirement | Research support |
|---|---|---|
| KERN-01 | Direct Match execution and Chronicle production consume one engine-owned transition kernel instead of independently implementing the Phase, Round, Cycle, Activation, and Contraction loop. | Replace the two schedulers with `stepMatch` plus one `runMatch` driver; make duplicate-loop guards debt-negative. |
| KERN-02 | Chronicle construction records canonical kernel transitions without independently advancing gameplay. | Replace `buildChronicleFromMatch` with a recorder that accepts completed driver output/transition stream and cannot import scheduling functions. |
| KERN-03 | Arena, initial-state, transition-state, runtime-final-state, persisted-state, and reconstructed-state validation rejects inverted bounds, invalid terrain, duplicate identities or occupancy, unknown owners, invalid status/position/facing combinations, bad initiative, incompatible versions, and incoherent outcomes. | Add one stable invariant vocabulary and validators at construction, every kernel edge, runtime-service, TypeScript/Go persistence, and replay reconstruction. |
| KERN-04 | No-Advance cleanup that removes a player's final active Soldier immediately produces the canonical outcome and exactly one matching terminal event. | Make slot closure return status change, closure, then terminal evaluation; freeze an exact event-order regression. |
| KERN-05 | A Soldier stoned or fallen during Cycle-end Backstab has its activation slot closed with the exact approved terminal reason and cannot act again. | Re-read actor status after simultaneous Cycle-end Backstab, close with `BACKSTABBED`, then evaluate outcome. |
| KERN-06 | Excess activation-order handling follows one literal documented precedence and tests valid, invalid, duplicate, unknown, and malformed entries inside and outside the retained prefix. | Slice the untrusted raw list to quota before per-entry parsing/semantic checks; never scan beyond the prefix to fill quota. |
| KERN-07 | The stale contiguous-Activation public entry point is removed, and structural checks prevent production or tests from bypassing Cycle-interleaved scheduling. | Delete wrapper/export, migrate all tests/probes, snapshot exports, and reject lifecycle loop signatures outside the engine kernel/driver. |
| KERN-08 | Canonical constants are frozen or deeply cloned so caller mutation cannot affect later Matches, fixtures, or evidence. | Deep-freeze internal constants and clone nested arrays/objects at all outward construction boundaries; add mutation isolation tests. |
| KERN-09 | Every declared canonical event is produced under documented conditions or removed from the active vocabulary, with version-strict tests. | Remove current `PUSH_ATTEMPTED`, mint the affected current compatibility component, and generate executable producer/consumer/validator coverage. |
| KERN-10 | Executable compatibility fixtures preserve current v1.4 behavior for same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, Backstab geometry/timing, and every other audited ambiguity. | Capture full-state/event/observation fixtures before refactor and compare them byte-for-byte except for explicitly approved D-09 through D-15 deltas. |
| KERN-11 | Any implementation finding that would change a valid Match state, Action legality, event order, outcome, terminal timing/reason, or Strategy observation stops for an explicit compatibility ruling before expectations are changed. | Add a compatibility-delta checkpoint before updating any fixture; do not re-record unexplained goldens. |

The wording above is the active milestone requirement text. [VERIFIED: `.planning/REQUIREMENTS.md:25-35`; `.planning/ROADMAP.md:89-105`]
</phase_requirements>

## Summary

Phase 257 should be planned as an authority migration with semantic gates, not as a local bug-fix batch. Today `packages/engine/src/match.ts#runMatch` and `packages/replay/src/build.ts#buildChronicleFromMatch` independently schedule Phase/Round/Activation/Cycle/Contraction behavior, while runtime-service delegates Match execution to the replay-owned loop. The stale `resolveActivation` wrapper provides a third, contiguous-Activation route used by tests and the permanent probe. [VERIFIED: `packages/engine/src/match.ts`; `packages/replay/src/build.ts`; `apps/runtime-service/src/execute-match.ts`; `packages/engine/src/activation.ts`; `rg 'resolveActivation|buildChronicleFromMatch|runMatch'`]

The prescriptive target is a functional core in `@cowards/engine`: a pure resumable `stepMatch` transition, an engine-owned `runMatch` effect driver, and a canonical transition stream. Replay becomes a recorder and reconstruction validator; it must not decide what happens next. Runtime-service invokes only `runMatch`. Persistence and reconstruction independently revalidate evidence but never reproduce gameplay scheduling. [VERIFIED: Phase 257 D-01 through D-05 and D-16; `.planning/research/SUMMARY.md`]

At HEAD `180140f`, all seven permanent audit observations reproduce exactly and match the persisted Phase 256 baseline. Four observations are Phase 257 defects, two are explicitly owned by later phases, and successful-push history is a v1.4 preservation case. This gives planning a trustworthy RED baseline and proves there has been no silent semantic drift since the audit. [VERIFIED: `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`; `.planning/artifacts/v1.37-core-rules-audit-baseline.json`; command executed 2026-07-13]

No external dependency is required. Use the existing TypeScript/Zod/Vitest/workspace stack and Node SHA-256 support. Phase 258 owns the adversarial bounded canonical-JSON profile, so Phase 257 must centralize a deterministic domain projection for state hashes without claiming the broader Phase 258 envelope is complete. [VERIFIED: root and package `package.json` files; `.planning/ROADMAP.md` Phase 258; Phase 257 D-02]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: `AGENTS.md`]
- Never place game rules in React components or execute Strategy code in web/API processes. [VERIFIED: `AGENTS.md`]
- Engine logic must not use `Math.random`, `Date.now`, system time, filesystem, network, or database access. [VERIFIED: `AGENTS.md`]
- Do not use Node `vm` as a hostile-code boundary; treat Strategy code as hostile and schema-validate runtime boundaries. [VERIFIED: `AGENTS.md`]
- Preserve canonical terms: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, and Chronicle. [VERIFIED: `AGENTS.md`]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: `AGENTS.md`]
- Public replay output must not reveal Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: `AGENTS.md`]
- Engine work needs focused and invariant/property-style tests; replay work needs deterministic reconstruction and integrity tests. [VERIFIED: `AGENTS.md`]
- Replay/Match creation changes require board-realism checks: visible positions within bounds, canonical starts admitted, and a plausible unclipped full-Match start in local browser validation. [VERIFIED: `AGENTS.md`]
- Runtime tests must cover invalid output, timeout, forbidden capabilities, memory/source limits, and schema validation; worker tests must separate player/Strategy failure from system failure. [VERIFIED: `AGENTS.md`]
- End-to-end coverage should exercise edit, submit revision, MatchSet creation, execution, and replay. [VERIFIED: `AGENTS.md`]

The working tree already contains user-owned modifications to `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md`. Plans must preserve both. Read the committed consolidated spec with `git show HEAD:CowardsGameSpec_Full_Consolidated_v1.md` when exact committed bytes are required, and document v1.37 clarifications in an addendum or an unmodified canonical companion spec unless the user later authorizes overlap. [VERIFIED: `git status --short`; parent task edit boundary]

## Revalidated Audit Baseline

| Probe | HEAD observation | Phase owner | Required post-Phase-257 observation |
|---|---|---|---|
| No-Advance removes final Soldier | `STONE`, `outcome: null`, zero `MATCH_ENDED` | 257 defect | `STONE`, approved winner/outcome, exactly one `MATCH_ENDED`; status event then slot closure then terminal event |
| Cycle-end Backstab removes actor | actor `STONE`, slot not ended, terminal reason `null` | 257 defect | simultaneous Backstab events finish; slot ends once with `BACKSTABBED`; immediate outcome evaluation |
| Malformed excess activation order | retained valid orders `0`, violation events `1` | 257 defect | with quota one and valid first entry: retained orders `1`, violation events `0`; ignored suffix is not parsed |
| Deep nested runtime JSON | `RangeError` | 258 | unchanged in this phase; Phase 257 must not claim bounded JSON completion |
| Overlapping arena/start admitted | `true` | 257 defect | rejected with deterministic semantic invariant code(s) |
| Historical Chronicle boundary accepted | `true` | 259 | unchanged in this phase; immutable v1.4 evidence remains historically routed |
| Successful push pusher history | `RIGHT` | 257 preservation | remains `RIGHT`; pushed Soldier history remains unchanged |

The current output is byte-equivalent to the persisted baseline after canonical JSON comparison. [VERIFIED: permanent probe execution at HEAD `180140f`; `.planning/artifacts/v1.37-core-rules-audit-baseline.{json,md}`]

Do not overwrite the Phase 256 baseline to make repaired behavior look historical. Preserve it as immutable before-state evidence, update the permanent reproduction to use the new kernel/driver after `resolveActivation` is deleted, and add a Phase 257 result/delta artifact that names both the original baseline and new tuple. Convert `scripts/check-v1-37-integrity-boundaries.ts` from known-debt fingerprint acceptance to guards that reject reintroduced duplicate loops/wrappers and verify the new result. [VERIFIED: `scripts/check-v1-37-integrity-boundaries.ts:65-78,185-255`; D-13 and D-16]

## Architectural Responsibility Map

| Concern | Canonical owner after Phase 257 | Consumers | Forbidden duplication |
|---|---|---|---|
| Lifecycle scheduling and action resolution | `@cowards/engine` kernel/driver | runtime-service, tests, probes | replay, persistence, web/API, Go |
| Runtime effect request/resume classification | engine types and driver | runtime adapters/runtime-service | Chronicle recorder deciding penalties or turns |
| State/arena semantic invariants and stable codes | shared contract surface plus engine transition checks | engine, replay, runtime-service, TS persistence, Go service validator | different code meanings or precedence per boundary |
| Canonical transition evidence | engine driver output | Chronicle recorder, restricted diagnostics | replay synthesizing transitions from a second run |
| Current Chronicle recording/grammar/reconstruction | `@cowards/replay` | runtime-service, persistence, viewers | scheduling or calling `resolveRound`/`resolveActivationCycle` |
| Persistence admission | TypeScript and Go service boundaries | repositories/transactions | trusting typed maps or deriving writes before semantic validation |
| Historical v1.4 decoding | immutable tag/blob-aware historical dispatcher | replay reads | current-source reinterpretation or rewritten historical evidence |
| Public projection | existing service/public contracts | web/API | private state, source, memories, objectives, raw diagnostics, host/security data |

This split follows the tuple authority established in Phase 256: transition authority is currently named `@cowards/engine#runMatch`, and the tuple independently names rules, engine, runtime ABI, Chronicle, arena catalog, and Set policy. Keep the public driver name `runMatch` unless the Phase 256 authority artifact is atomically regenerated. [VERIFIED: `packages/spec/src/integrity-authority.ts`; `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md`]

## Standard Stack

### Required existing stack

| Layer | Use | Repository version/evidence |
|---|---|---|
| TypeScript | Kernel, contracts, validators, recorder migration, structural guards | `6.0.3` resolved; root `package.json` requests `^6.0.3` [VERIFIED: `pnpm exec tsc --version`; `package.json`] |
| Zod | Shape validation at untrusted TypeScript boundaries before semantic validation | `4.4.3` resolved [VERIFIED: `pnpm list zod -r`; `packages/spec/package.json`] |
| Vitest | Focused, invariant, differential, export-surface, and integration tests | `4.1.6` resolved [VERIFIED: `pnpm exec vitest --version`; package scripts] |
| Node `node:crypto` SHA-256 | Domain-separated deterministic state/transition evidence hashes | Node `v26.0.0`; repository already uses `createHash("sha256")` in integrity scripts [VERIFIED: `node --version`; `scripts/check-v1-37-integrity-boundaries.ts`] |
| Go standard library/testing | Go runtime-service response and persistence semantic gate | Go `1.26.3` available [VERIFIED: `go version`; `apps/go-backend`] |
| PostgreSQL test database | Transaction/no-write verification for invalid evidence | PostgreSQL client `16.14`; configured test DSN accepted during environment check [VERIFIED: `psql --version`; `psql postgresql://cowards:cowards@localhost:5432/cowards_game -c 'select 1'`] |
| Existing pnpm/Turbo workspace | Package-scoped and repository gates | pnpm `11.1.2` [VERIFIED: `pnpm --version`; `package.json`; `pnpm-workspace.yaml`] |

### Dependency decision

Install nothing. The phase requires no new registry package, so no package-legitimacy audit or lockfile change is warranted. Use existing workspace dependencies and standard libraries only. [VERIFIED: package dependency graph; prescribed architecture]

## Architecture Patterns

### Pattern 1: Resumable validated kernel plus a single effect driver

Represent the private machine cursor explicitly. One `stepMatch` call consumes a validated machine and either an engine command or an exact response to its pending runtime request. It returns exactly one of: successful transition, runtime-effect yield, terminal result, or typed integrity/system failure. The kernel never invokes a runtime itself. [VERIFIED: D-01, D-03, D-07]

```ts
type MatchStepResult =
  | { kind: "transition"; machine: MatchMachine; record: MatchTransition }
  | { kind: "runtime_request"; machine: MatchMachine; request: RuntimeRequest }
  | { kind: "terminal"; machine: MatchMachine; record: MatchTransition }
  | { kind: "failure"; machine: MatchMachine; failure: IntegrityFailure }

const before = machine
const stepped = stepMatch(machine, commandOrResume)
// Every failure result carries `before` unchanged; only validated success advances.
```

The driver owns the loop and external invocation:

```ts
while (!isTerminal(machine)) {
  const stepped = stepMatch(machine, resume)
  if (stepped.kind === "failure") return failedAttempt(stepped)
  if (stepped.kind === "runtime_request") {
    resume = awaitRuntimeEffect(stepped.request) // injected boundary, not kernel I/O
    continue
  }
  appendValidatedRecord(stepped.record)
  machine = stepped.machine
}
return { result: projectMatchResult(machine), transitions }
```

The code sketch is a recommended type shape; exact names are discretionary, but the one-edge semantics and three-way runtime resume are locked. [VERIFIED: D-01 through D-04]

### Pattern 2: Effects-as-data with exact resume identity

Each request must include a deterministic request identifier, effect kind (`selectActivations` or `soldierBrain`), lifecycle coordinates, tuple, and only the private input required by the controlled runtime. A resume must match the pending request identity and classify as `success`, `player_violation`, or `system_failure`. Mismatched, duplicate, or out-of-order resumes are integrity failures with unchanged state. [VERIFIED: D-02, D-03, D-06, D-07; existing runtime methods in `packages/engine/src/types.ts`]

Phase 257 introduces the internal three-way contract required by the kernel. Phase 258 remains responsible for bounded language-neutral JSON, exact cross-language ABI envelopes, resource-budget semantics, and end-to-end transport hardening. Do not broaden this phase into four-language certification. [VERIFIED: `.planning/ROADMAP.md` Phases 258-259]

### Pattern 3: Shape first, semantics second, deterministic errors

At untrusted boundaries, parse structural shape first and run semantic invariants only on typed data. Semantic validation returns a bounded array in fixed code-precedence order; never depend on object traversal or insertion order for which error is first. Bound error count, path segments, and metadata values. [VERIFIED: current Zod schemas in `packages/spec/src/schemas.ts`; D-05 and D-08]

Recommended invariant families, in fixed family/code order:

1. `TUPLE_*`: complete and exact current tuple; no mixed component versions.
2. `ARENA_*`: canonical/in-order bounds, unique in-bounds terrain, no terrain/start overlap, canonical starts admitted.
3. `PLAYER_*` / `SOLDIER_*`: exactly two unique players/sides, unique Soldier IDs, known owners, valid ownership counts.
4. `POSITION_*`: unique occupancy for positioned Soldiers, in-bounds locations, no terrain overlap, FALLEN means `position: null`, ACTIVE/STONE position/facing consistency.
5. `LIFECYCLE_*`: legal Phase/Round/Activation/Cycle cursor, selection quota, initiative player, activation counters, pending effect identity.
6. `OUTCOME_*`: phase/outcome/active-count coherence, winner/draw coherence, no continuation after terminal state, exactly one terminal event.
7. `TRANSITION_*`: allowed state delta for transition kind, ordered event correspondence, before/after hash coherence.

Exact code spellings are discretionary; their meanings, bounds, and ordering become contract and test-vector data. [VERIFIED: KERN-03; D-05 through D-08; current state/schema fields]

### Pattern 4: Domain projection for Phase 257 hashes

Hash one centralized, versioned projection of canonical game state, prefixed with a domain string and tuple identity. Encode fields in a fixed declared order and sort keyed collections by code-point comparison, never locale-sensitive ordering. Do not hash private runtime source, memory/objective payloads, diagnostics, or host metadata into the public transition envelope. [VERIFIED: D-02; `AGENTS.md` public privacy boundary; existing integrity SHA-256 practice]

If projection/encoding cannot represent a value, return a typed integrity/system failure with unchanged state. Do not add an unbounded recursive general-purpose canonical JSON encoder here; adversarial depth/node/string/collection/Unicode/number behavior is Phase 258. [VERIFIED: permanent `deepValidation` probe; Phase 258 success criteria]

### Pattern 5: Recorder consumes execution, never runtime

Replace `buildChronicleFromMatch(input)` with a recorder such as `recordChronicleFromExecution({ execution, metadata })`. Its input is the validated result/transition stream from `runMatch`; it may project Chronicle events and boundary snapshots, but has no runtime and no scheduling/resolution imports. Remove the old name rather than aliasing it, so callsites cannot accidentally retain the duplicate authority. [VERIFIED: D-04 and D-16; current `packages/replay/src/build.ts`]

If Chronicle requires private boundary snapshots that are not safe in the public transition envelope, return them as a separate controlled recorder material from `runMatch`. Public service projection continues to strip private source, memories, objective payloads, diagnostics, and host/security metadata. [VERIFIED: D-02; `AGENTS.md`; `scripts/check-v1-37-integrity-boundaries.ts#restrictedPublicKeys`]

### Pattern 6: Validate before deriving or writing persistence fields

TypeScript `completeMatch` must semantically validate final state/tuple/Chronicle equivalence before deriving result fields or opening the canonical write transaction. The Go path must similarly validate runtime-service response, final-state semantics, Chronicle terminal equivalence, and tuple before persistence. Any failure is system/integrity and causes no canonical write or player penalty. [VERIFIED: D-05 through D-07; `packages/persistence/src/complete-match.ts`; `apps/go-backend/internal/matchrunner/runtime_service_client.go`; `orchestrator.go`; `completion.go`]

The Go validator may mirror the stable invariant vocabulary and consume generated test vectors, but it must not schedule gameplay. Cross-language scheduling authority remains exclusively TypeScript engine code in this phase. [VERIFIED: D-04 and D-16]

### Recommended source layout

```text
packages/spec/src/
  semantic-integrity.ts       # stable codes, bounded result contracts, shared state/arena invariants
  compatibility.ts            # current tuple/component constants and exact contract identity
packages/engine/src/
  kernel/types.ts             # private cursor, command, effect, resume, transition record
  kernel/validate.ts          # engine-transition/cursor invariants
  kernel/step.ts              # one pure lifecycle/runtime-response edge
  kernel/driver.ts            # public runMatch; invokes injected runtime effects
  compatibility-fixtures.test.ts
packages/replay/src/
  record.ts                   # execution/transition stream -> Chronicle
  validate.ts                 # strict current/historical routing plus semantic checks
  replay-transition.ts        # reconstruction consumer, no scheduling
scripts/
  check-v1-37-integrity-boundaries.ts
  generate-v1-37-event-coverage.ts
apps/go-backend/internal/.../
  semantic_integrity.go       # response/final/persistence gate only
```

The exact directories are discretionary. Keep shared invariant contracts below engine in the dependency graph; engine already depends only on spec, while replay/persistence/runtime-service depend on engine/spec. [VERIFIED: package `package.json` dependency graph]

## Prescriptive Implementation Waves

### Wave 0 — Freeze RED evidence and compatibility corpus

1. Preserve `.planning/artifacts/v1.37-core-rules-audit-baseline.*` unchanged and record the current probe output/hash at HEAD `180140f`. [VERIFIED: current probe and baseline]
2. Add RED tests for D-09 through D-11, overlapping arena rejection, constant mutation isolation, and current event coverage. [VERIFIED: revalidated defects]
3. Capture valid v1.4 full-state, ordered-event, terminal, runtime-call, Strategy-observation, and memory/objective-order fixtures before refactoring. Do not rely on outcome-only snapshots. [VERIFIED: KERN-10 and KERN-11]
4. Add a compatibility-delta test that permits only the explicitly approved D-09 through D-15 changes. Any other delta is a hard human checkpoint. [VERIFIED: KERN-11]

### Wave 1 — Semantic contracts, constants, tuple mint

1. Define stable bounded invariant codes/results and arena/state validators in the lowest dependency layer. [VERIFIED: D-05 and D-08]
2. Deep-freeze internal compatibility/arena/start constants and clone every nested object/array emitted into a Match state. Add caller-to-state and Match-to-Match mutation tests. [VERIFIED: `packages/engine/src/state.ts`; `packages/spec/src/constants.ts`; KERN-08]
3. Mint affected current tuple components atomically. Keep rules identity at v1.4; mint the engine component for lifecycle/kernel behavior, Chronicle component for current event vocabulary/recording, and arena-catalog component for semantic arena admission. Leave runtime ABI and Set policy unchanged unless implementation proves their contract bytes change. [VERIFIED: Phase 256 tuple decisions; D-15; Phase 257 scope]
4. Regenerate current authority artifacts, install receipts, TypeScript backend inventory, and surface labels as one atomic tuple migration. Never rewrite historical v1.4 evidence. [VERIFIED: Phase 256 integrity authority flow and root package scripts]

The exact new version strings are planner discretion, but partial publication is forbidden. Existing Strategy Revisions use exact engine compatibility; do not mutate locked revisions to make them current. Revalidate into a new immutable revision/attestation or keep them quarantined from current execution until the existing compatibility workflow can issue exact current evidence. [VERIFIED: Strategy revision compatibility checks in runtime-service and Phase 256 immutability decisions]

### Wave 2 — Pure kernel and driver

1. Introduce explicit private lifecycle cursor, pending runtime effect, command/resume unions, transition records, and failure unions. [VERIFIED: D-01 through D-03]
2. Extract one lifecycle edge at a time from `resolveRound`, `resolveActivationSelection`, `resolveActivationCycle`, contraction, and Match-end helpers into `stepMatch`; retain action primitives where their behavior is already covered. [VERIFIED: `packages/engine/src/match.ts`; `activation.ts`; `movement.ts`; `backstab.ts`]
3. Validate incoming state/cursor/command and outgoing state/events on every edge. Commit state only after output validation succeeds. [VERIFIED: D-05 and D-07]
4. Implement `runMatch` as the only loop and effect interpreter; return result plus ordered transition stream/controlled recorder material. [VERIFIED: D-04]
5. Prove system failure at each effect edge leaves pre-transition gameplay state unchanged and produces no canonical partial Chronicle. [VERIFIED: D-06 and D-07]

### Wave 3 — Approved semantic fixes and stale API removal

1. Slice raw activation order to quota before parsing each retained entry. Cover valid, invalid, duplicate, unknown, and malformed entries on both sides of the prefix boundary; never scan the ignored suffix to replace an invalid retained item. [VERIFIED: D-09]
2. Implement exact no-Advance last-Soldier order: status event, slot closure/no-Advance reason, immediate outcome/one terminal event. [VERIFIED: D-11]
3. After simultaneous Cycle-end Backstab events, re-read actor status, close once with `BACKSTABBED`, and immediately evaluate outcome. [VERIFIED: D-10]
4. Delete `resolveActivation`, its export, and every test/probe caller. Add an export-surface snapshot and negative source guard; do not retain a test-only copy. [VERIFIED: D-13]
5. Re-run compatibility corpus after each behavior fix; stop on any unapproved valid-state, legality, event, outcome, terminal, or Strategy-observation delta. [VERIFIED: KERN-11]

### Wave 4 — Chronicle recorder and event vocabulary migration

1. Make replay record `runMatch` transitions and delete replay lifecycle scheduling. Migrate runtime-service, replay/golden/test utilities, persistence tests, and scripts. [VERIFIED: current callsite inventory from `rg 'buildChronicleFromMatch'`]
2. Remove `PUSH_ATTEMPTED` from current spec types/schemas, replay grammar/reconstruction, OpenAPI/generated contracts, and web event consumers. Repository-wide committed history contains declarations/consumers but no committed Chronicle event instance, so no current historical branch is needed. [VERIFIED: `git grep PUSH_ATTEMPTED`; D-14]
3. Add generated current-event coverage proving each declared current event has a producer and a consumer/validator disposition. [VERIFIED: D-16]
4. Route old v1.4 evidence only through the immutable historical dispatcher/tag/blob path; do not relax current grammar. [VERIFIED: Phase 256 historical decisions; D-15]

### Wave 5 — Runtime-service, reconstruction, and persistence trust boundaries

1. Restrict runtime-service imports/dependencies to the public `runMatch` execution route plus replay recorder/validator; forbid replay-owned execution. [VERIFIED: D-04 and D-16]
2. Validate runtime final state and tuple before Chronicle recording/service success. A system/integrity failure must not be translated into Strategy violation or gameplay cleanup. [VERIFIED: D-05 through D-07]
3. Semantically validate every replay boundary and reconstructed terminal state; require reconstruction equivalence to the engine terminal projection/hash. [VERIFIED: KERN-03; existing `packages/replay/src/replay-transition.ts`]
4. Gate TypeScript and Go persistence before derived writes, then prove invalid state/Chronicle/tuple yields zero writes and unchanged prior canonical data. [VERIFIED: KERN-03; persistence paths]
5. Generate shared invariant code/test-vector artifacts and cross-check Go meanings/order against TypeScript without implementing a Go Match loop. [VERIFIED: D-08 and D-16]

### Wave 6 — Structural convergence and full proof

1. Flip Phase 256 known-debt fingerprints into negative guards: no stale wrapper, no replay scheduler, only one lifecycle loop authority, runtime-service calls only driver. [VERIFIED: `scripts/check-v1-37-integrity-boundaries.ts`]
2. Update the permanent reproduction to the new public API and persist a Phase 257 delta/result artifact without modifying the original baseline. [VERIFIED: D-13; definition-of-done input]
3. Run package, service, persistence, privacy, boundary-monitor, reconstruction, browser-realism, and full repository gates. [VERIFIED: `AGENTS.md`; root scripts]
4. Keep Cycle-start Backstab scans. Record the optional simplification as deferred unless a separate exhaustive proof establishes identical state, event, terminal, and Strategy-observation behavior for all reachable inputs. [VERIFIED: D-12; Deferred Ideas]

## Exact Compatibility Corpus

The corpus should include at least these independently named scenarios and compare initial state, every transition, event order/payload, runtime observation sequence, memory/objective handoff, final state, outcome, and hashes where applicable. [VERIFIED: KERN-10; D-12]

- Same-direction rear approach blocks; head-to-head and occupied-target distinctions remain separate. [VERIFIED: `packages/engine/src/movement.ts` and tests]
- Successful push updates only the pusher's successful-move history to the attempted direction; pushed Soldier history is unchanged. [VERIFIED: current permanent probe; D-12]
- Blocked MOVE against terrain, STONE, active Soldier, same-direction case, or failed push is non-terminal and does not counterfeit successful history. [VERIFIED: `movement.ts`; `activation.test.ts`; D-12]
- Illegal reversal remains terminal under current v1.4 behavior; blocked MOVE/PUSH does not become terminal. [VERIFIED: current engine tests; D-12]
- Cycle-interleaved snake scheduling, initiative order, slot coordinates, and skipped/removal behavior remain exact. [VERIFIED: `packages/engine/src/match.ts`; Cycle-interleaved v1.4 spec]
- Cycle-start and Cycle-end Backstab both remain; simultaneous/mutual/multi-victim cases preserve event order, victim-rear geometry, and lack of attacker-facing requirement. [VERIFIED: `packages/engine/src/backstab.ts`; D-12]
- Push or TURN interactions that make a Soldier eligible/ineligible at a boundary preserve existing scan timing. [VERIFIED: `activation.ts`; `backstab.test.ts`]
- Contraction ordering, final 2x2 behavior, status changes, and outcome evaluation after every active-count change remain exact. [VERIFIED: `packages/engine/src/match.ts`; D-12]
- Runtime player violation follows current approved gameplay cleanup, while system failure performs no gameplay mutation. [VERIFIED: D-06 and D-07; Phase 256 failure ownership]
- StrategyInput/SoldierBrainInput observations, fresh-memory boundaries, objective ordering, and runtime call count/order remain byte-equivalent for preserved cases. [VERIFIED: KERN-11; current runtime interfaces]
- Exactly one `MATCH_ENDED` occurs and nothing schedules after terminal outcome. [VERIFIED: KERN-04/KERN-05; D-10 through D-12]

Never update a golden merely because the new kernel emits something different. First classify the delta as one of D-09 through D-15; every other valid-input delta is a blocking compatibility question for the user. [VERIFIED: KERN-11]

## Validation Architecture

### Test layers and fast feedback

| Layer | Required proof | Suggested command |
|---|---|---|
| Spec/contracts | invariant code order/bounds, semantic arena/state vectors, current event union, tuple exactness | `pnpm --filter @cowards/spec test` |
| Engine focused | one-edge kernel, unchanged-on-failure, lifecycle defects, order prefix, constant isolation, compatibility corpus | `pnpm --filter @cowards/engine test` |
| Replay | recorder purity, grammar/version strictness, reconstruction equivalence, boundary semantic checks | `pnpm --filter @cowards/replay test` |
| Runtime-service | only-driver route, three-way effect results, no Chronicle on system failure, safe projection | `pnpm --filter @cowards/runtime-service test` |
| Persistence | semantic rejection before derive/write, transaction rollback, tuple/Chronicle equivalence | `pnpm --filter @cowards/persistence test` |
| Go boundary | response/final/Chronicle semantic gate, stable code vectors, zero-write failure | `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL=postgresql://cowards:cowards@localhost:5432/cowards_game go test ./... -count=1` |
| Permanent audit | seven scenarios with Phase 257 expected deltas only | `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` |
| Structural/privacy | one authority, no wrapper/scheduler bypass, no restricted output | `pnpm v1.37:integrity-boundaries:check && pnpm boundary:imports && pnpm public-discovery:check` |
| Generated drift | current authority/inventory/surface/event coverage are clean | `pnpm v1.37:integrity-authority:check && pnpm typescript-backend:inventory:check && pnpm typescript-surface-labels:check` |
| Full repository | formatting, lint, typecheck, unit/integration suite | `pnpm test:fast` |
| Board realism/browser | plausible full Match start and replay after service execution | `PLAYWRIGHT_TEST=1 pnpm e2e -- replay.fixture.spec.ts replay.visual.spec.ts` |

Package scripts and commands above exist except the new event-coverage check, which Wave 4 must add. [VERIFIED: root/package `package.json`; existing Playwright config/tests]

### Requirement-to-proof matrix

| Requirement | Minimum automated evidence |
|---|---|
| KERN-01/02 | Static import guard plus instrumented Match proving direct execution and Chronicle receive one identical transition stream and runtime call sequence. |
| KERN-03 | Table-driven invalid arena/state fixtures at initial, every transition side, runtime-final, TS/Go persistence, and reconstruction; each asserts stable code order and no write/mutation. |
| KERN-04 | Exact event sequence and one terminal event; next-step attempt is rejected/terminal without scheduling. |
| KERN-05 | Actor removed at Cycle-end cannot resume; simultaneous victims/events complete before `ACTIVATION_ENDED(BACKSTABBED)` and outcome. |
| KERN-06 | Cartesian table of inside/outside prefix with valid, malformed, duplicate, unknown, wrong owner/status; suffix never parsed and prefix never backfilled. |
| KERN-07 | Export snapshot, repository source guard, and no lifecycle-loop AST/signature outside allowed engine files. |
| KERN-08 | Attempt mutation through constants, arena input, returned state, and first Match; second Match/fixture/hash remains pristine. |
| KERN-09 | Generated declared-event coverage, no current `PUSH_ATTEMPTED`, exact current tuple rejection, historical tag still reconstructs immutable evidence. |
| KERN-10 | Full-state/event/observation differential corpus before/after with approved-delta allowlist. |
| KERN-11 | CI gate fails with a human-readable unapproved semantic delta and forbids golden regeneration as a passing path. |

### Nyquist sampling rule

Every implementation task should name its shortest RED/GREEN command, then every plan closes with the package suite and cross-boundary proof relevant to its edits. The phase-level final plan runs the full matrix, permanent probe, structural checks, privacy scan, service-backed database proof, and browser realism. [VERIFIED: `.planning/config.json` has Nyquist validation enabled when read; `AGENTS.md` test expectations]

## Runtime State Inventory

This is a rename/refactor phase, so all five runtime-state categories must be migrated explicitly. [VERIFIED: researcher protocol; D-01 through D-04]

| Category | Current state | Required migration/proof |
|---|---|---|
| 1. Persistent data | Match/Chronicle/result rows are written from TypeScript and Go completion paths; Strategy Revisions retain exact compatibility metadata. | No schema rewrite is assumed. Validate before derive/write, preserve old rows/evidence, prove rollback/no write, and never mutate immutable revision compatibility. [VERIFIED: persistence/Go paths; Phase 256 decisions] |
| 2. In-memory application state | `GameState` and loop-local Round/Activation/Cycle variables are distributed across engine and replay loops; constants are aliased into states. | Consolidate lifecycle cursor/pending effect into private `MatchMachine`; deep clone/freeze constants; prove failed steps return the identical prestate value graph semantically and do not contaminate later Matches. [VERIFIED: `match.ts`; `replay/build.ts`; `state.ts`] |
| 3. Runtime/process state | Runtime invocations currently occur through injected `StrategyRuntime`; runtime-service calls replay's Match builder. | Driver alone invokes effects; requests/resumes carry exact identity and three-way result; runtime-service calls driver, then recorder. System failure aborts the attempt without gameplay mutation. [VERIFIED: engine types; runtime-service execute path; D-03/D-04] |
| 4. Cached/derived state | Generated authority artifacts, TypeScript backend inventory/surface labels, audit debt fingerprints, Chronicle boundary snapshots, and evidence receipts derive from code/tuple state. | Regenerate current artifacts atomically after tuple mint; preserve historical/baseline artifacts; replace debt fingerprints with negative guards; validate recorder material and snapshot/hash equivalence. [VERIFIED: root scripts; integrity boundary script; replay build] |
| 5. External/service state | PostgreSQL stores canonical results/evidence; service/API returns public projections; historical dispatcher resolves immutable tag/blob evidence. | Prove invalid semantic evidence causes zero DB/public canonical mutation, public projections remain privacy-safe, and current changes never reinterpret historical evidence. [VERIFIED: `AGENTS.md`; Phase 256 historical posture; persistence/service paths] |

## Security Domain

Phase 257 crosses hostile Strategy runtime, service, replay, and persistence trust boundaries even though security-enforcement planning is not enabled as a separate workflow. Treat the phase as integrity/security sensitive. [VERIFIED: `AGENTS.md`; `.planning/config.json` inspected]

Applicable verification categories:

- Input validation: shape plus semantic validation for every runtime and evidence boundary; stable bounded error output. [VERIFIED: D-05/D-08]
- Fail-safe behavior: system/integrity failure leaves gameplay unchanged and never becomes a player penalty. [VERIFIED: D-06/D-07]
- Data protection: transition/public output excludes source/artifact bytes, memories, objectives, raw diagnostics, host paths, credentials, and security internals. [VERIFIED: D-02; `scripts/check-v1-37-integrity-boundaries.ts#restrictedPublicKeys`]
- Integrity and non-repudiation: before/after hashes bind transition kind, tuple, lifecycle coordinates, ordered events, and result classification; historical evidence remains tag/blob pinned. [VERIFIED: D-02; Phase 256 historical decisions]
- Architectural separation: hostile Strategy code remains outside web/API/engine and replay never becomes an alternate rules executor. [VERIFIED: `AGENTS.md`; D-04/D-16]
- Error handling/logging: public errors use safe top-level categories; restricted operator evidence uses bounded stable codes/paths/metadata only. [VERIFIED: D-07/D-08]

Threat-focused tests must include forged tuple, invalid owner/occupancy/status/outcome, mismatched/duplicate resume identity, invalid runtime final state, replay reconstruction mismatch, persistence rejection, and attempts to place restricted keys/host paths in public payloads. [VERIFIED: D-05 through D-08; existing public integrity scanner]

## Code Examples

### Literal retained-prefix precedence

```ts
const retainedRaw = rawActivationOrder.slice(0, roundQuota)
const retained = retainedRaw.map((entry, index) =>
  parseAndValidateRetainedActivation(entry, { index, state, playerId }),
)
```

Do not parse the complete array first, and do not filter for validity before slicing; either ordering would change D-09 semantics. [VERIFIED: D-09; current reproduction]

### Commit-after-validation transition discipline

```ts
const before = machine
const candidate = reduceLifecycleEdge(before, input)
const issues = validateTransition({ before, input, candidate })

if (issues.length > 0) {
  return {
    kind: "failure",
    machine: before,
    failure: restrictedIntegrityFailure(issues),
  }
}

return { kind: "transition", machine: candidate.machine, record: candidate.record }
```

The returned failure state is the incoming machine, not a partially reduced clone. Tests should compare canonical hashes and deep state equality and prove no recorder/persistence call occurred. [VERIFIED: D-07]

### Recorder dependency direction

```ts
const execution = runMatch(matchInput, runtimeBoundary)
if (execution.kind !== "completed") return execution

const chronicle = recordChronicleFromExecution({
  result: execution.result,
  transitions: execution.transitions,
  recorderMaterial: execution.recorderMaterial,
})
```

`recordChronicleFromExecution` must not accept `StrategyRuntime`, invoke `runMatch`, or import resolution/scheduling helpers. [VERIFIED: D-04/D-16]

## State of the Art in This Repository

| Current pattern | Phase 257 replacement |
|---|---|
| Two imperative full-Match loops | One resumable engine kernel plus one driver |
| Replay owns execution to obtain snapshots | Engine emits validated transition/controlled recorder material; replay records it |
| Runtime interface effectively success/player violation | Exact success/player-violation/system-failure resume union |
| Shape-valid state treated as canonical | Shape parse followed by bounded semantic invariants at every trust edge |
| Known-debt fingerprints permit duplicate authority | Negative structural guards reject duplicate authority and stale exports |
| Declared unused event retained indefinitely | Generated producer/consumer/validator coverage and current tuple mint on removal |
| Audit expected values overwritten in place risk | Immutable before-baseline plus tuple-bound Phase 257 result/delta |

The replacement column is prescribed by the locked Phase 257 decisions, not by a new external framework. [VERIFIED: D-01 through D-16]

## Assumptions Log

No unverified assumptions are required for planning. All architectural prescriptions are derived from locked context, committed project documents, current source, or commands executed against HEAD `180140f`. [VERIFIED: research source list]

## Don't Hand-Roll

- Do not build a second scheduler in replay, a test helper, the probe, runtime-service, Go, or persistence. All full-Match behavior must traverse the engine driver. [VERIFIED: KERN-01/KERN-02/KERN-07]
- Do not create compatibility aliases for `resolveActivation` or `buildChronicleFromMatch`; aliases preserve the bypass. [VERIFIED: D-13/D-16]
- Do not use JSON stringify of arbitrary runtime values as the Phase 258 canonical JSON solution. Phase 257 hashes only a controlled, validated state projection. [VERIFIED: deep-validation probe; Phase 258 scope]
- Do not infer semantic validity from TypeScript types or Zod shape schemas. Ownership, occupancy, geometry, initiative, tuple, lifecycle, and outcome coherence require explicit semantic checks. [VERIFIED: current `schemas.ts`; KERN-03]
- Do not translate system/integrity validation failure into an invalid Strategy output or no-Advance penalty. [VERIFIED: D-06/D-07]
- Do not scan past the retained activation prefix to find replacement valid entries. Slice first, then validate each retained entry. [VERIFIED: D-09]
- Do not mutate existing Strategy Revision compatibility ranges, Phase 256 audit baseline, historical Chronicles, or archived/tagged evidence. [VERIFIED: `AGENTS.md`; Phase 256 historical decisions]
- Do not remove Cycle-start Backstab scans or add HOLD/END_ACTIVATION in required Phase 257 work. [VERIFIED: D-12; Deferred Ideas]
- Do not claim all-language ABI/failure conformance, bounded JSON, or version-strict historical Chronicle completion; those are Phases 258-259. [VERIFIED: roadmap boundaries]
- Do not add a package for hashing, deep freeze, state machines, or validation orchestration. Existing language/workspace facilities are sufficient. [VERIFIED: Standard Stack and current dependency graph]

## Common Pitfalls

### Updating the old audit baseline instead of recording the repair

The Phase 256 baseline intentionally proves the defects existed at a specific implementation head. Rewriting its expected values destroys provenance. Keep it immutable and add a Phase 257 result linked to the new tuple and updated probe implementation. [VERIFIED: baseline metadata; current integrity monitor]

### Minting only Chronicle identity for an engine behavior change

D-10/D-11 change terminal behavior for defective reachable states, arena semantic admission changes accepted inputs, and D-14 changes current event vocabulary. Publish the affected engine/Chronicle/arena-catalog components as one exact tuple migration while retaining v1.4 rules identity; never leave mixed generated artifacts or receipts. [VERIFIED: D-10/D-11/D-15; Phase 256 tuple policy]

### Breaking every existing immutable Strategy Revision silently

Runtime-service checks exact engine compatibility. A new engine component can make old revisions ineligible for current execution. Preserve their immutable metadata and use explicit revalidation/new revision or quarantine rather than widening/mutating compatibility. Test the migration path before enabling current Match execution. [VERIFIED: runtime-service compatibility checks; `AGENTS.md` immutability]

### Producing partial canonical evidence on system failure

The driver may have accumulated restricted attempt diagnostics before a runtime/system failure. Those records are not a canonical Chronicle and must not reach result/standings persistence. Make the return type distinguish completed canonical execution from failed attempt evidence. [VERIFIED: D-07]

### Validating only terminal state

An invalid intermediate state can be hidden by later events. Validate both sides of every transition and again at service/persistence/reconstruction boundaries; test the invariant code at the first invalid edge. [VERIFIED: D-05]

### Letting the recorder require private state in public transition records

Chronicle may need controlled boundary material, but D-02 forbids full private state in the event envelope. Return a separate private recorder material or privacy-safe snapshots from the engine driver and scan the public projection. [VERIFIED: D-02; `AGENTS.md` privacy rule]

### Treating replay semantic validation as another engine

Replay must validate event grammar and reconstructed states without deciding the next legal action or scheduling lifecycle. Structural guards should allow state invariant imports but reject engine scheduling/resolution imports. [VERIFIED: D-04/D-16]

### Locale- or insertion-order-dependent evidence hashes/errors

Use explicit field order, code-point sorting, and fixed invariant precedence. Never use locale-sensitive comparison or incidental object/set traversal to establish canonical evidence order. [VERIFIED: D-08; deterministic engine constraint]

### Accidentally fixing later-phase probes

Deep recursive JSON and the historical Chronicle boundary belong to Phases 258 and 259. Their current observations remain explicit in the Phase 257 result; changing them here expands scope and obscures later acceptance. [VERIFIED: roadmap]

### Editing the protected consolidated spec

`CowardsGameSpec_Full_Consolidated_v1.md` is dirty user-owned work. Use committed bytes for research and place approved v1.37 compatibility clarifications in a non-overlapping addendum/companion document. [VERIFIED: `git status --short`; parent edit boundary]

## Code-Seam Findings

- `packages/engine/src/match.ts` owns one full scheduling loop today through `resolveRound` and `runMatch`. [VERIFIED: repository inspection]
- `packages/replay/src/build.ts` owns a second full loop and states that intermediate snapshots require `buildChronicleFromMatch`. This is the loop to delete, not generalize. [VERIFIED: `packages/replay/src/build.ts:171-260`]
- `apps/runtime-service/src/execute-match.ts` imports and calls `buildChronicleFromMatch`, so counted execution currently enters through replay. [VERIFIED: `execute-match.ts:22,636-770`]
- `resolveActivation` loops up to 12 contiguous cycles for one slot and is used only by engine/backstab tests and the permanent probe, making complete removal feasible once those fixtures target the kernel/driver. [VERIFIED: `activation.ts:551-592`; repository `rg`]
- Activation selection parses the whole runtime result before capping/filtering, which causes malformed ignored excess to invalidate the retained prefix. [VERIFIED: `activation.ts:130-190`; permanent probe]
- No-Advance closure emits the status and closure but performs no immediate Match-end evaluation. [VERIFIED: `activation.ts#closeSlot`; permanent probe]
- Cycle-end Backstab is followed by `CYCLE_ENDED` and outcome checking, but terminal reason derives from action/exhaustion without re-reading the actor's post-Backstab status. [VERIFIED: `activation.ts#resolveActivationCycle`; permanent probe]
- Backstab evaluates a simultaneous active-soldier snapshot using the victim rear square and does not require attacker facing. Preserve this. [VERIFIED: `packages/engine/src/backstab.ts`; D-12]
- Movement already preserves same-direction blocking, successful-push pusher history, unchanged pushed-Soldier history, and non-terminal blocked movement. Preserve these primitives and surround them with differential fixtures. [VERIFIED: `packages/engine/src/movement.ts` and tests]
- `createInitialGameState` aliases `COMPATIBILITY_VERSIONS`, arena terrain arrays, and nested start positions into output state; compile-time `as const` does not prevent runtime mutation. [VERIFIED: `packages/engine/src/state.ts`; `packages/spec/src/constants.ts`]
- Current schemas validate shape but not the full cross-field semantic requirements in KERN-03. [VERIFIED: `packages/spec/src/schemas.ts`]
- `PUSH_ATTEMPTED` is declared/handled in current spec, replay grammar/reconstruction, and consumers, but committed source/history search found no persisted canonical event instance. Remove it from current sources; no historical branch is justified by present evidence. [VERIFIED: `git grep PUSH_ATTEMPTED`; D-14]
- Replay reconstruction applies events to board snapshots and compares derived values, but it is not full `GameState` semantic validation/reconstruction equivalence. [VERIFIED: `packages/replay/src/replay-transition.ts`; `validate.ts`]
- TypeScript persistence derives completion values from typed final state without a fresh semantic parse; Go accepts map-shaped runtime-service final state and derives persistence values after mostly shape-oriented checks. Both are KERN-03 trust boundaries. [VERIFIED: `packages/persistence/src/complete-match.ts`; Go runtime service client/orchestrator/completion files]

## Open Questions and Approval Triggers

There is no research blocker before planning. Exact type names, invariant code spellings, module layout, and component version strings are planner discretion within the locked semantics. [VERIFIED: CONTEXT discretion]

Implementation must stop and ask the user only if one of these occurs:

1. A preserved valid v1.4 fixture changes state, Action legality, event order/payload, outcome, terminal timing/reason, runtime call sequence, or Strategy observation beyond D-09 through D-15. [VERIFIED: KERN-11]
2. Removing Cycle-start Backstab scans is desired without complete reachable-state/state-event-terminal-observation equivalence proof. [VERIFIED: D-12]
3. HOLD/END_ACTIVATION is needed or changes any reachable behavior. [VERIFIED: Deferred Ideas]
4. Committed historical evidence containing `PUSH_ATTEMPTED` is discovered after the current exhaustive committed search; then add only a version-routed historical decoder and obtain a compatibility ruling if routing is ambiguous. [VERIFIED: D-14/D-15]
5. Tuple minting cannot be made atomic without mutating immutable Strategy Revisions or historical evidence. [VERIFIED: Phase 256 tuple/immutability policy]

## Environment Availability

| Capability | Status |
|---|---|
| Node | `v26.0.0` available [VERIFIED: `node --version`] |
| pnpm | `11.1.2` available [VERIFIED: `pnpm --version`] |
| TypeScript | `6.0.3` available [VERIFIED: `pnpm exec tsc --version`] |
| Vitest | `4.1.6` available [VERIFIED: `pnpm exec vitest --version`] |
| Go | `go1.26.3` available [VERIFIED: `go version`] |
| Docker | `29.4.0` available [VERIFIED: `docker --version`] |
| PostgreSQL client/test DSN | client `16.14`; local Cowards Game DSN accepted [VERIFIED: `psql --version`; test query] |
| Project graph | No usable `.planning/graphs` output was present; research used direct repository seams. [VERIFIED: graph lookup during research] |
| Project-local skills/rules | No repository-local skill/rule directory applicable to this phase was found. [VERIFIED: project skill discovery scan] |

## Research Sources

### Primary repository sources

- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — locked decisions and deferrals. [VERIFIED]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/research/SUMMARY.md` — milestone boundaries, requirements, architecture. [VERIFIED]
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` and Phase 256 authority artifacts — inherited tuple/failure/history posture. [VERIFIED]
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` and `.planning/artifacts/v2.0-core-rules-audit/*` — defect descriptions and permanent reproduction. [VERIFIED]
- `.planning/artifacts/v1.37-core-rules-audit-baseline.{json,md}` — immutable Phase 256 current-HEAD observation. [VERIFIED]
- `CowardsGameSpec_CycleInterleaved_v1.4.md`, `CowardsGame_Technical_Architecture_Spec_v1.4.md`, and committed HEAD bytes of `CowardsGameSpec_Full_Consolidated_v1.md` — v1.4 semantic baseline. [VERIFIED]
- Engine/replay/spec/runtime-service/persistence/Go source paths named above — live implementation seams. [VERIFIED]
- `AGENTS.md` — project non-negotiables and test expectations. [VERIFIED]

### Commands executed

- `git rev-parse --short HEAD` → `180140f`. [VERIFIED]
- `pnpm exec tsx .planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts` → all seven observations matched the Phase 256 baseline. [VERIFIED]
- `rg`/`git grep` callsite, event-vocabulary, scheduling-loop, and committed evidence searches. [VERIFIED]
- Local tool/version and PostgreSQL availability checks summarized above. [VERIFIED]

No external documentation search was necessary: this phase is governed by repository-specific locked semantics, current code seams, and committed audit evidence, and it installs no packages. [VERIFIED: research scope and dependency decision]

## Metadata

**Research readiness:** READY FOR PLANNING  
**Recommended plan count:** 10–14 atomic plans across six dependency waves  
**Primary risk:** unapproved semantic drift hidden by the architectural refactor  
**Secondary risks:** partial tuple publication, immutable Strategy Revision incompatibility, partial canonical evidence on failure, and destruction of historical audit provenance  
**Required human checkpoint:** only on a KERN-11 compatibility delta or another approval trigger listed above  
