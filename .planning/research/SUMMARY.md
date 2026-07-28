# Research Summary

**Project:** Coward's Game v1.37 Rules Integrity and Strategy Evaluation Foundations
**Researched:** 2026-07-12
**Scope:** Approved integrity foundation only; preserve valid v1.4 gameplay and historical evidence
**Overall confidence:** HIGH for repository-local findings and dependency order; MEDIUM for final phase sizing

## Executive Summary

v1.37 should establish the smallest complete trust substrate required before serious Strategy development. The repository already has the right broad ownership split—TypeScript spec/engine/replay, runtime-service and language adapters, Go orchestration/persistence, and public web projections—but its contracts and proof are not yet strong enough to prevent those layers from drifting independently.

The milestone should converge existing components onto one canonical transition authority rather than introduce a new rules stack. `@cowards/spec` should own an atomic rules/engine/runtime-ABI/Chronicle/arena/Set-policy tuple and bounded language-neutral contracts; `@cowards/engine` should own the only Match transition kernel; `@cowards/replay` should record and reconstruct kernel transitions without scheduling a second Match; adapters should report success, player violation, or system failure without deciding gameplay; Go should continue to own job lifecycle, persistence, Set scoring, rollback, and public-safe evidence.

The current-HEAD reproductions are the acceptance baseline. All seven persisted probes still reproduce, and audited production source has not changed since the audit snapshot. They must become permanent regression inputs, not be replaced by changed expectations. Valid v1.4 behavior—including same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, and other ambiguous rulings—must be frozen with executable fixtures before refactoring. Any change to a valid Match state, Action legality, event order, outcome, or Strategy observation requires a compatibility approval stop.

No new framework or third-party dependency is recommended. Use the existing pinned TypeScript, Zod, Vitest, Playwright, Go, PostgreSQL, runtime-service, and WASI infrastructure. Counted runtime eligibility must be derived from current executable containment and four-language conformance evidence tied to exact runtime, toolchain, adapter, policy, corpus, source, normalized-byte, artifact, and compatibility-tuple identities.

## Scope Boundary

### Committed Integrity Foundation

- Fail closed for counted lanes without current containment and executable conformance evidence bound to exact identity.
- Establish one canonical ownership and atomic version tuple for rules, engine, runtime ABI, Chronicle, arena catalog, and Set policy.
- Replace the engine and Chronicle Match loops with one transition kernel whose transitions are recorded, semantically validated, reconstructed, and hash-compared.
- Add bounded canonical JSON handling and semantic validation for arenas, all state boundaries, occupancy, ownership, bounds, status/position consistency, initiative, versions, and outcomes.
- Repair every confirmed audit lifecycle defect while preserving approved v1.4 semantics: immediate outcome after no-Advance cleanup, Cycle-end Backstab closure/reason, excess-order precedence, stale contiguous-Activation export removal, immutable/cloned constants, and emitted-or-removed event vocabulary.
- Preserve success, player violation, and system failure end to end; system failure cannot mutate gameplay, memory, standings, or become a player penalty.
- Reconcile original bytes, normalized bytes, line endings, manifests, artifacts, runtimes, toolchains, ABI, corpus, and evidence identity.
- Replace parity declarations with identical TypeScript/Python/Rust/Zig corpus execution and full state, event, memory, objective, and failure-trace comparison.
- Make Chronicle validation version-strict, semantic, per activation slot, reconstruction-equivalent, and historically routed without rewriting v1.4 evidence.
- Add explicit initiative and authoritative `hasAdvancedThisActivation`, one documented budget contract, and the same ABI envelope for every supported language.
- Consolidate arena authority, deduplicate semantically identical geometry for diversity claims, and schedule explicit side and entrant-level initiative coverage.
- Close with service-backed execution, failure, Chronicle, replay, persistence, fairness, rollback, privacy, and boundary-monitor proof.

### Proof-Gated Behavior-Preserving Simplifications

- Remove Cycle-start Backstab scans only if reachable-state differential proof establishes identical canonical state, outcome, event sequence, and Strategy observation behavior.
- Add `HOLD`/`END_ACTIVATION` after Advance only after a separate approval and proof that scheduling, Backstab, Chronicle, replay, reachable outcomes, and observations preserve the intended existing hold behavior.
- If either candidate changes any valid state, legality, event order, outcome, or observation, defer it. Neither is required to complete the integrity foundation.

### Deferred Experiments

- Cycle caps, inward starting rows, facing-only MOVE, reversal-history removal, attacker-facing or stronger Backstab rules.
- Hidden information, randomness, adaptive rules, per-Match mutation, and new official arena geometries beyond authority/fairness repair.
- Gameplay changes justified by the toy Strategy matrix, metagame selection machinery, or the proposal's broader experimental program.
- Durable ratings, prizes, staffed moderation, new languages, TinyGo promotion, package ecosystems, and broad UI redesign.
- The v2.0 proposal's full 63 requirements and 13 phases are source material only and must not be imported into active planning.

## Key Research Conclusions

### Architecture and Ownership

The safest architecture is a functional core with evidence adapters. The kernel accepts validated state plus explicit input and returns validated next state, canonical events, runtime requests/results, and terminal/failure status. Direct Match execution and Chronicle recording consume those same transition records. Replay validates and reconstructs them; it does not independently advance Phases, Rounds, Cycles, Activations, or Contractions.

The complete compatibility tuple must be treated atomically. Independent support checks for each version string are insufficient because individually supported components may never have been certified together. Missing, unknown, stale, or mixed tuples must fail before counted scheduling, execution, persistence, or replay. Historical v1.4 evidence routes through immutable original semantics and is never normalized to the latest tuple.

### Validation and Failure Safety

Shape validation is necessary but insufficient. Explicit semantic validators must cover cross-record invariants at arena admission, initial state, relevant transition postconditions, runtime final state, persistence, and Chronicle reconstruction. Canonical JSON limits must include bytes, depth, nodes/entries, strings, collections, Unicode, finite/safe numeric rules, duplicate keys, ordering/hashing, and serialization behavior. Traversal must be iterative and bounded so adversarial depth produces a typed result rather than `RangeError` or uncontrolled allocation.

All adapters must implement a common three-way result envelope. Only the canonical engine boundary may translate a valid player violation into the already-approved v1.4 consequence. Timeouts, crashes, unavailable runtimes/toolchains, transport errors, malformed envelopes, stale artifacts, and persistence failures remain system failures, produce zero gameplay/memory mutation, and follow Go-owned retry/rollback policy.

### Executable Language and Identity Proof

Language neutrality means equivalent observable ABI behavior, not four independent engines. One versioned, hash-addressed corpus should drive actual TypeScript, Python, Rust, and Zig adapters. It must compare complete canonical state transitions, events, StrategyMemory, SoldierMemory, objectives, failure classes, invalid/boundary JSON, timeouts/resource failures, stale artifacts, deterministic repeats, and exact runtime/toolchain identity.

Original source bytes, normalized bytes, normalization policy/version, line endings, artifact bytes, manifests, provider, runtime, toolchain, ABI, policy, corpus, and evidence hashes need explicit domains and bindings. Floating Rust `stable` or Wasmtime `latest` may support discovery but cannot identify counted evidence. A relevant dependency change must invalidate eligibility automatically.

### Chronicle, Strategy Inputs, and Competition Fairness

Chronicle grammar state must be keyed per `activationId`; a global increasing sequence cannot detect duplicated, skipped, reopened, or out-of-order interleaved slots. Current evidence should require version-strict literals, semantic subject/state agreement, and reconstruction-equivalent transition hashes, while immutable historical evidence remains readable only under its original rules and Chronicle semantics.

Strategy observations must expose canonical facts rather than language-specific inference: explicit initiative and scheduler-owned `hasAdvancedThisActivation`. Budget terms must name measurement boundaries and units rather than reuse equal numbers with different meanings across adapters.

Set fairness requires explicit scenario data. Swapping sides and changing a seed suffix can leave the same entrant with initiative in both Matches. Scheduling and service-backed proof must demonstrate that each entrant receives each side and each initial-initiative state. Arena diversity must be based on versioned semantic geometry identity, not duplicate IDs for the same empty geometry.

## Recommended Compact Roadmap

### Phase 1: Counted Safety and Canonical Authority

Quarantine unproved counted lanes; freeze current-HEAD audit evidence, valid v1.4 compatibility fixtures, privacy baselines, and rollback controls; define the ownership map, atomic compatibility tuple, historical routing, and evidence-derived eligibility. This phase prevents new untrusted evidence while later foundations are built.

### Phase 2: Canonical Transition Kernel and v1.4 Semantic Integrity

Add bounded arena/state/outcome validators and immutable/cloned constants; extract one transition kernel; route direct execution and Chronicle recording through it; remove the stale public contiguous-Activation route; repair the reproduced lifecycle, order, outcome, and event-vocabulary defects. Run differential compatibility fixtures throughout.

**Approval stop:** If any proposed clarification or refactor changes valid state, legality, event order, outcome, terminal reason/timing, or Strategy observation, stop and obtain an explicit compatibility ruling before changing expectations.

### Phase 3: Canonical JSON, Failure Semantics, and Artifact Identity

Define iterative JSON limits, common three-way results, no-mutation system-failure semantics, exact source/normalized/artifact/manifest/toolchain identity, and one documented runtime-budget and ABI envelope. Prove atomic failure behavior before broad conformance work.

### Phase 4: Executable Four-Language and Chronicle Conformance

Execute the identical positive/negative corpus through actual TypeScript, Python, Rust, and Zig adapters; compare complete traces; bind counted eligibility to fresh proof. Add version-strict per-slot Chronicle grammar, semantic validation, transition/reconstruction equality, and immutable historical routing.

### Phase 5: Truthful Strategy Inputs, Arena Authority, and Set Fairness

Add explicit initiative and authoritative Advance state across every language envelope; consolidate arena authority and semantic geometry identity; generate explicit side/initiative scenario matrices and prove entrant-level coverage in TypeScript, Go, persistence, and service-backed flows.

### Phase 6: Integrated Service Proof, Drift Guards, and Release

Rerun every persisted audit reproduction and all compatibility fixtures. Prove service-backed execution, failure classification, no-mutation behavior, Chronicle reconstruction, replay, persistence, recomputation, Set fairness, idempotency, rollback, privacy, and public boundaries. Add structural monitors for duplicate loops/arenas, mixed tuples, adapter-owned gameplay classification, stale identity, unsupported events, unproved counted lanes, and private-output leakage. Audit one transition authority, then archive and tag before beginning the serious-Strategy milestone.

This six-phase shape is dependency-ordered and intentionally smaller than the proposal. If implementation sizing requires a split, split within these integrity seams rather than importing deferred experimental phases.

## Acceptance and Approval Rules

- Treat the seven current-HEAD reproductions as permanent acceptance tests; every probe must pass or have an explicitly approved compatibility ruling.
- Freeze valid v1.4 state/event/observation fixtures before changing loops, validators, or Chronicle construction.
- Do not re-record golden outputs to conceal semantic drift.
- Do not count a runtime lane from documentation, registry metadata, readiness flags, or gate names. Require current executable proof bound to exact identity.
- Do not rewrite or relabel historical v1.4 Chronicles/results; route by persisted tuple and original semantics.
- Keep Strategy source, artifacts, memory, objectives, Awareness/private traces, raw diagnostics, host data, credentials, security internals, and proof secrets out of public/default output and generated public evidence.
- Treat the two behavior-preserving candidates as optional gated work. Failed equivalence defers the candidate and does not block the committed foundation.
- Final completion requires passing engine, spec, replay, runtime-service, four-language, privacy, boundary-monitor, and service-backed proof suites plus archive and tag.

## Recommended Stack Position

Retain the existing repository stack and package boundaries. Add contracts, validators, fixtures, generated artifacts, migrations, proof scripts, and exact CI pins as needed, but no new dependency is currently justified. TypeScript remains the canonical rules implementation; Go remains orchestration and persistence; the four Strategy languages share one data ABI behind runtime-service. WASI Preview 1 stdin/stdout JSON remains the Rust/Zig boundary for this milestone.

## Principal Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Compatibility drift disguised as clarification | Frozen differential fixtures and mandatory approval stop on any semantic delta |
| Two Match authorities survive | One kernel, recorder-only Chronicle builder, stale export removal, structural monitor |
| Shape-valid but impossible states | Explicit semantic validation at every trust boundary |
| Deep JSON causes crash/DoS | Iterative byte/depth/node/value limits and shared adversarial corpus |
| System failure becomes gameplay | Central three-way classification and atomic no-mutation tests |
| Stale or ambiguous artifact identity | Explicit hash domains and complete identity/evidence closure |
| Four-language parity remains declarative | Actual adapter execution with full-trace comparison |
| Historical Chronicle reinterpretation | Tuple/version router and immutable v1.4 fixtures |
| Apparent rather than real Set fairness | Explicit side/initiative Cartesian coverage per entrant |
| Privacy leak in proof artifacts | Separate private/public schemas and scans over APIs, logs, fixtures, and generated evidence |
| Scope expands to v2 experiments | Trace active requirements to committed integrity scope; keep conditional and deferred lists separate |

## Research Inputs

This synthesis uses the approved milestone summary; the committed core-rules audit, reproduction artifact, proposal documents, competitive Strategy research, seed, v1/v1.4 rules and architecture specs; current `.planning/PROJECT.md`, `.planning/STATE.md`, and `.planning/MILESTONES.md`; and the repository-focused stack, features, architecture, and pitfalls research. The proposal was used selectively as source material and not as authority to activate its experimental program.
