# Architecture Patterns: v1.37 Rules Integrity and Strategy Evaluation Foundations

**Domain:** Deterministic programmable-game transition, runtime-conformance, replay, and competition evidence architecture
**Researched:** 2026-07-12
**Overall confidence:** HIGH for current repository boundaries and required dependency order; MEDIUM for final contract names until requirements and roadmap are approved

## Executive Recommendation

Build v1.37 as a convergence onto existing owners, not as a parallel rules stack. `@cowards/spec` should own one immutable compatibility tuple and the language-neutral contracts; `@cowards/engine` should own one pure transition kernel; `@cowards/replay` should record, validate, and reconstruct those transitions without running a second Match loop; runtime-service and language adapters should translate hostile invocation results into a central three-way classification without deciding gameplay; Go should retain orchestration, persistence handoff, scoring, rollback, and public evidence ownership. The web remains a projection consumer.

The critical structural change is to replace the two current top-level loops—`runMatch` in the engine and `buildChronicleFromMatch` in replay—with one transition driver that emits typed transition records. Chronicle construction subscribes to those records and adds snapshots/private references; it does not call `resolveRound`, `resolveContraction`, or maintain Phase/Round progression itself. Replay reconstruction applies the same transition semantics or a deliberately smaller event reducer and proves equal transition/trace hashes.

Version and evidence identity must be first-class Match input, not metadata assembled after execution. One tuple should bind rules, engine kernel, runtime ABI, Chronicle grammar, arena pool/scenario, and Set policy. Counted scheduling admits only supported complete tuples plus current containment/conformance evidence bound to exact runtime, adapter, toolchain, corpus, policy, source bytes, normalized bytes, and artifact identity. Missing or mismatched evidence fails before execution; it never becomes an in-game penalty.

This milestone preserves `cowards-rules-v1.4` behavior and immutable historical evidence. The lifecycle repairs correct implementation defects against v1.4 intent. Same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, excess-order precedence, and every other ambiguity need compatibility rulings plus executable fixtures before refactoring. Removing Cycle-start Backstab scans is permitted only after reachable-state differential equivalence. `HOLD`/`END_ACTIVATION` is not part of the foundation unless separately approved and proved not to alter reachable outcomes or observations.

## Recommended Architecture

```text
Canonical authority (@cowards/spec)
  CompatibilityTuple + canonical JSON + state/event/runtime/scenario contracts
          |
          v
Pure transition authority (@cowards/engine)
  semantic preconditions -> one transition kernel -> semantic postconditions
          |                         |
          | typed transition record | invocation request/result
          v                         v
Chronicle recorder            Strategy Execution Service / Runtime Broker
(@cowards/replay)              adapters: TS / Python / Rust / Zig
  versioned events/snapshots     success | player violation | system failure
          |                         |
          +------------+------------+
                       v
             Go orchestration and persistence
       tuple gate, jobs, retry, Chronicle handoff, Set scoring,
       historical routing, rollback, public-safe evidence
                       |
                       v
              Web/result/replay projections
```

### Authority Rules

1. `@cowards/spec` defines data contracts, version compatibility, canonical JSON limits, semantic error vocabulary, and the public/private projection boundary. It must not implement a Match loop.
2. `@cowards/engine` is the only gameplay transition authority. It decides legal Actions, state mutation, slot closure, Backstab timing, cleanup, contraction, and outcome.
3. Runtime adapters report invocation facts. They do not decide stoning, penalties, Match outcomes, retry policy, or counted eligibility.
4. `@cowards/replay` records and verifies engine transitions. It does not recreate Phase/Round/Contraction scheduling.
5. Go owns normal job lifecycle, retry/idempotency, persistence, Match completion, MatchSet refresh/scoring, and rollback. It validates the tuple and evidence but does not execute Strategy code or reinterpret gameplay.
6. Persistence stores immutable versioned evidence. The web consumes public-safe projections and must not recreate rules or eligibility logic.

## Component Boundaries

| Component | Status | Responsibility | Communicates With |
| --- | --- | --- | --- |
| `packages/spec/src/versions.ts` evolved into a canonical compatibility contract | Modified | Define and validate the rules/engine/runtime ABI/Chronicle/arena-pool/Set-policy tuple; route v1.4 historical tuples separately | Engine, runtime-service, replay, persistence, Go, generated contracts |
| Canonical JSON profile in `@cowards/spec` | New | Iterative byte/depth/node/string/number/Unicode validation; original and normalized byte identity; stable hashing rules | Providers, runtime adapters, engine input gates, conformance harness |
| Semantic arena/state validators in `@cowards/spec` or a spec-owned validation module | New | Validate bounds, uniqueness, occupancy, ownership, position/status consistency, initiative, versions, and outcomes without executing gameplay | Engine boundaries, runtime-service response gate, Chronicle/reconstruction gate, persistence |
| `@cowards/engine` transition kernel | Modified/new internal seam | Own initialization, selection, slot opportunities, Action resolution, cleanup, outcome, round advance, contraction, and terminal failure transitions | Spec contracts, runtime invocation port, recorder interface |
| `runMatch` | Modified facade | Drive the kernel to completion and collect final state/transitions; no separate semantics | Kernel only |
| `resolveActivation` contiguous helper | Remove from public API | Preserve targeted testing through kernel fixtures/builders, not a stale alternate execution route | Tests only through internal helpers if needed |
| Chronicle recorder in `@cowards/replay` | Modified | Convert kernel transition records into versioned Chronicle events/snapshots/private references | Kernel output, spec event schemas |
| Chronicle validators/reconstructor | Modified | Version-route, validate per activation slot and semantic state, reconstruct, compare trace hashes | Chronicle store, service, replay UI |
| Central invocation classifier | New | Represent `success`, `playerViolation`, and `systemFailure`; apply legality only after successful transport/runtime output | Engine runtime port, runtime-service, all adapters, Go |
| TypeScript/Python/Rust/Zig adapters | Modified | Execute immutable revision/artifact, enforce equivalent envelope/budgets, return raw canonical invocation classification and identity | Runtime Broker, conformance corpus |
| Conformance corpus/runner | New | Execute the same positive and negative cases in all four lanes; compare state/event/memory/objective/failure traces | Providers, adapters, eligibility gate, CI |
| Arena catalog and scenario scheduler | Modified | Make `@cowards/map-configs` (or a successor spec artifact) the sole geometry authority; assign explicit side and initiative scenario fields | Persistence, Go, replay metadata, Set policy |
| Persistence and Go tuple/evidence gates | Modified | Store/reject tuples, bind conformance/containment evidence, preserve retry/idempotency/rollback, keep v1.4 immutable | Spec artifacts, runtime-service, Chronicle validator, database |
| Boundary monitors and proof manifests | Modified/new | Reject duplicate loops/arenas/rule copies, adapter gameplay classification, mixed tuples, privacy leaks, stale evidence, and unproved counted lanes | Repository, generated artifacts, service-backed proof |

## Canonical Data Contracts

### Compatibility Tuple

Use one atomic value rather than independent permissive strings:

```typescript
interface MatchCompatibilityTuple {
  rulesVersion: "cowards-rules-v1.4"
  engineKernelVersion: string
  runtimeAbiVersion: string
  chronicleVersion: "chronicle-v1.4"
  arenaPoolVersion: string
  setPolicyVersion: string
}
```

The exact labels may differ, but the invariants should not: a supported tuple is allow-listed atomically, persisted on the Match and Chronicle, included in hashes/proofs, and rejected before counted execution if incomplete or mixed. Do not normalize an unknown value into the current version. Historical v1.4 evidence routes to the immutable v1.4 validator/reconstructor even after newer contracts exist.

### Transition Record

The kernel should return a record rich enough for execution, Chronicle, replay, and differential proof:

```typescript
interface CanonicalTransition {
  tuple: MatchCompatibilityTuple
  transitionIndex: number
  kind: string
  context: {
    phaseNumber?: number
    roundNumber?: number
    activationId?: string
    cycleIndex?: number
  }
  beforeHash: string
  afterHash: string
  events: CanonicalEvent[]
  state: GameState
}
```

The concrete implementation can avoid storing a full state per record in production, but tests and recorder hooks need deterministic before/after identity. Events are effects of transitions, not instructions that a second loop interprets to decide gameplay.

### Three-Way Invocation Result

The engine-facing port must distinguish:

```typescript
type InvocationResult<T> =
  | { kind: "success"; value: T; evidence: InvocationEvidence }
  | { kind: "playerViolation"; violation: CanonicalViolation; evidence: InvocationEvidence }
  | { kind: "systemFailure"; failure: CanonicalSystemFailure; evidence: InvocationEvidence }
```

Only `success` proceeds to canonical JSON/schema/Action legality checks. A player violation can trigger the already-approved v1.4 gameplay consequence through the kernel. A system failure terminates or suspends orchestration according to service policy with zero board, StrategyMemory, or SoldierMemory mutation and no player loss. Adapters and Go may map transport errors into `systemFailure`; they may not turn them into `playerViolation`.

### Strategy Observations

Modify the canonical input contracts and every language envelope together:

- `StrategyInput` receives explicit initiative information sufficient to derive the exact current Round schedule.
- `SoldierBrainInput` receives authoritative `hasAdvancedThisActivation` from slot state.
- TypeScript, Python, Rust, and Zig receive the same documented fields, JSON profile, limits, and failure semantics.
- The runtime budget contract names each unit—per invocation, per Activation/Match if retained, transport timeout, instruction/fuel, memory, output—and prevents one timeout from silently standing in for another.

These are observation-contract additions, not authorization for gameplay changes.

## Data Flow

### Counted Match Admission

1. Scheduler resolves an explicit scenario: arena identity/version, bottom/top assignment, and initial-initiative assignment. It does not infer fairness from a seed suffix.
2. Go/persistence assembles the exact compatibility tuple and immutable Strategy Revision/artifact identities.
3. Eligibility checks current containment and full conformance evidence hashes against runtime, adapter, toolchain, policy, corpus, source/artifact manifest, and tuple.
4. Any missing/stale/mismatched fact makes the lane non-counted before a job is created or claimed.
5. Public output exposes only safe eligibility/counting status, never source, artifacts, private diagnostics, memory, objectives, host data, or security internals.

### Match Execution

1. Runtime-service validates the request shape, tuple, arena semantics, revision/artifact identity, and canonical limits without mutation.
2. The engine initializes a semantically valid state and yields kernel transitions.
3. When a transition needs Strategy output, the Runtime Broker invokes the selected language adapter and returns the three-way result.
4. The kernel alone converts a valid player violation into approved v1.4 slot/gameplay consequences. System failure returns out of the gameplay transaction without mutating state or memory.
5. Each state-changing operation passes postcondition validation and immediate outcome evaluation.
6. The Chronicle recorder observes the same transitions; it never advances rounds or contracts the board itself.
7. Runtime-service validates final state, Chronicle semantics, and reconstruction/trace equivalence before returning an internal result to Go.

### Completion and Persistence

1. Go validates the service envelope and tuple, then treats system failure as job/orchestration failure with the established retry/idempotency policy.
2. Successful evidence is semantically validated again at the trust boundary before Chronicle persistence and Match completion.
3. Chronicle, final-state identity, tuple, scenario identity, runtime/toolchain evidence, and conformance evidence hashes persist atomically or through the existing idempotent completion boundary.
4. MatchSet scoring consumes only completed, compatible evidence. Rollback can disable the new tuple/gate without rewriting historical v1.4 records.

### Replay and Historical Routing

1. Replay reads the persisted Chronicle version and full tuple.
2. Immutable v1.4 evidence uses v1.4 grammar and semantics; newer validators never reinterpret historical boundary literals.
3. Current v1.37-produced v1.4 evidence uses stricter per-slot grammar, semantic state validation, and reconstruction equality while preserving the original valid gameplay meaning.
4. Public projection strips Strategy source, artifacts, StrategyMemory, SoldierMemory, objectives, Awareness details, diagnostics, host/security data, and private runtime evidence.

## Patterns to Follow

### Pattern 1: Functional Core, Evidence Adapters

Keep the kernel pure and deterministic. Runtime invocation and recording are ports around it. This permits direct-engine tests, runtime-service execution, Chronicle generation, and replay verification to share semantics without sharing infrastructure.

### Pattern 2: Validate at Every Trust Boundary

Use iterative semantic validation at arena admission, initial state, every kernel postcondition in test/debug lanes, runtime final state, reconstruction, and persistence. Validation must be total: deeply nested JSON produces a bounded rejection, never `RangeError`.

### Pattern 3: Compatibility Router, Not In-Place Migration

Treat `(tuple, Chronicle version)` as a router key. Add strict current validation while retaining the historical reader. Never rewrite old Chronicles or infer new compatibility for existing Strategy Revisions.

### Pattern 4: Evidence-Derived Eligibility

Counted status is derived from a signed/hashed evidence manifest whose dependency closure includes implementation, runtime, toolchain, policy, corpus, source/artifact identity, containment result, and tuple. Any relevant change invalidates the manifest automatically.

### Pattern 5: Scenario Matrix as Data

Represent arena, side, and initial initiative directly. A fair pair is a cross-product assignment, not `swap sides + append :mirror`. This makes fairness auditable in TypeScript and Go and keeps seed spelling from acquiring hidden rules meaning.

### Pattern 6: Differential Compatibility Harness

Freeze valid v1.4 fixtures before refactoring. Run old and new drivers against identical runtime transcripts and compare canonical state, event sequence, observations, memory, outcome, and terminal reasons. Keep the seven audit probes as permanent regression cases; separately flag compatibility rulings where the probe exposes ambiguity rather than a confirmed defect.

## Anti-Patterns to Avoid

### A Second “v1.37” Match Loop

Do not leave `runMatch` and Chronicle building as separate schedulers or introduce a third service-owned loop. One driver must serve both direct and recorded execution.

### Tuple Fields Without Atomic Compatibility

Independent strings that are normalized to current defaults reproduce drift. Reject incomplete/unknown tuples; do not repair them during counted execution.

### Adapter-Owned Gameplay Penalties

Timeouts, transport errors, crashes, toolchain failures, and unavailable runtimes are system failures. They cannot be encoded as invalid Actions, stoning, forfeits, or losses by an adapter.

### Shape-Only Validation

Zod/type shape success does not prove non-overlap, valid owners, in-bounds occupancy, consistent status/position, legal initiative, possible outcome, valid slot progression, or reconstruction equivalence.

### Documentation-Only Conformance

Shared gate names, provider metadata, or a declared ABI do not certify four-language parity. Every lane must execute the identical corpus and produce comparable traces.

### Seed-Suffix Fairness

Appending `:mirror` while swapping sides can preserve the same entrant's initiative. Explicit assignments and matrix coverage are required.

### Arena Copies as Convenience

Persistence seeds, Go presets, UI IDs, and replay fixtures should reference/export one catalog. Copies invite drift; Smoke and Open Field must not count as distinct geometry.

### New Behavior Hidden as Clarification

Any change to a valid state, Action legality, event order, outcome, or Strategy observation requires explicit approval. A cleaner implementation is not evidence of semantic equivalence.

## Recommended Dependency Order

1. **Safety quarantine and current-HEAD baseline** — fail closed for unproved counted lanes; freeze audit probes, valid v1.4 differential fixtures, ownership map, privacy baseline, and rollback switch.
2. **Authority and compatibility tuple** — define owners, atomic tuple, historical router, canonical event vocabulary decision, and drift monitors before producing new evidence.
3. **Semantic validation foundation** — add total canonical JSON plus arena/state/outcome validators and immutable/cloned constants. This foundation protects every later boundary.
4. **Canonical transition kernel** — extract one driver, route direct execution and Chronicle recording through it, remove the public contiguous-Activation entry point, and repair lifecycle/outcome/slot/order defects under frozen v1.4 compatibility tests.
5. **Runtime classification and identity** — install the central three-way result, exact bytes/manifests/toolchain identity, common budgets, and truthful Strategy observations across the ABI.
6. **Four-language executable conformance** — run identical TS/Python/Rust/Zig state/event/memory/objective/failure cases; derive counted eligibility from the current proof hash.
7. **Chronicle/replay convergence** — enforce version-strict per-slot grammar, semantic validation, transition/reconstruction hash equality, and immutable v1.4 routing.
8. **Arena authority and Set fairness** — consolidate the catalog, collapse duplicate-geometry diversity claims, and schedule every entrant across both sides and both initiative states.
9. **Service/persistence migration** — thread the tuple, scenario, evidence manifests, classifications, validation, idempotency, and rollback through runtime-service, Go, generated contracts, persistence, scoring, and public projections.
10. **Service-backed final proof** — cover admission, execution, player violation, system failure with zero gameplay mutation, Chronicle reconstruction, replay, Set fairness, persistence, rollback, privacy, and boundary monitors; archive and tag before Strategy development.

The conditional Cycle-start Backstab simplification should be evaluated after the kernel/differential harness exists and before final Chronicle vocabulary freezes. `HOLD`/`END_ACTIVATION` should remain deferred unless a separate approval and equivalence decision occurs; otherwise it would contaminate the compatibility baseline.

## Drift Guards

Add executable repository checks that fail when:

- a package outside the engine advances the complete Match lifecycle;
- replay calls Round/Contraction scheduling rather than consuming transitions;
- `resolveActivation` or another contiguous alternate path is publicly exported;
- an adapter or Go path maps system failure to player violation/gameplay penalty;
- arena geometry is redefined outside the canonical catalog;
- side/initiative fairness is inferred from seed spelling;
- constants expose mutable aliases;
- a declared canonical event lacks a producer or an emitted event lacks a schema/validator/reconstructor rule;
- a current Chronicle bypasses full semantic validation before persistence;
- a counted lane lacks a current exact evidence-manifest match;
- public/default DTOs include source, artifact, memory, objectives, Awareness details, diagnostics, host data, provider/security internals, or private runtime evidence.

## Verification Architecture

| Proof layer | Required evidence |
| --- | --- |
| Spec | Executable ambiguity rulings, tuple compatibility table, JSON boundary corpus, immutable constants, event producer/consumer inventory |
| Engine | Audit reproductions, semantic/property/mutation tests, old/new differential fixtures, immediate outcome and slot-lifecycle checks |
| Runtime | Three-way classification, zero-mutation system failure, exact identity/manifest checks, equivalent budget semantics |
| Four-language | Same corpus executed in TS/Python/Rust/Zig with full normalized state/event/memory/objective/failure trace equality |
| Chronicle/replay | Per-slot grammar, strict version literals, semantic snapshots, reconstruction/transition hash equality, immutable historical reads |
| Scheduling | Canonical arena references, no duplicate-geometry diversity claim, entrant-by-side-by-initiative coverage |
| Service/persistence | Go -> runtime-service -> kernel -> Chronicle -> persistence -> scoring/replay; retries, idempotency, rollback, mixed-version rejection |
| Privacy/boundaries | Public DTO scans, owner/private authorization, topology and import monitors, no Strategy execution in web/API/Go |

## Scalability Considerations

This milestone is correctness-bound, not user-count-bound. Use canonical hashes and immutable manifests so validation can be cached by content identity, but never allow a cache key that omits tuple/runtime/toolchain/policy/corpus identity. Full semantic validation should remain iterative and resource-bounded. Transition records may be streamed to the Chronicle recorder to avoid retaining duplicate full states, while the conformance/debug harness can retain richer before/after snapshots. Service-backed proof is expensive and should certify the final foundation; direct-engine/property/differential tests provide the fast inner loop.

## Sources

Primary repository evidence (HIGH confidence):

- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/{PROPOSAL,REQUIREMENTS,ROADMAP}.md` (source material only)
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`
- `.planning/seeds/SEED-001-v2-rules-integrity-and-metagame-renewal.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `CowardsGame_Technical_Architecture_Spec_v1.4.md`
- `.planning/{PROJECT,STATE,MILESTONES}.md`
- Current engine/spec/replay/runtime-service/runtime/persistence/Go code, especially `packages/engine/src/{match,activation,state,runtime-inputs}.ts`, `packages/replay/src/{build,validate,grammar,reconstruct,replay-transition}.ts`, `packages/spec/src/{versions,runtime,runtime-execution-service}.ts`, `packages/map-configs/src/index.ts`, `packages/persistence/src/{chronicle-store,matchset-service,competition}.ts`, `apps/runtime-service/src/{server,execute-match}.ts`, and `apps/go-backend/{orchestrator,runtime_service_client}.go`.

No external ecosystem lookup was needed: this is a repository-specific architecture convergence problem, and the committed audit plus current code are the authoritative evidence.
