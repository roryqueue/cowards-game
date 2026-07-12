# Requirements: Coward's Game v1.37 Rules Integrity and Strategy Evaluation Foundations

**Defined:** 2026-07-12
**Core Value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under the canonical Coward's Game rules.

## v1.37 Requirements

### Counted Safety

- [ ] **SAFE-01**: Operators can count a runtime lane only when current executable containment and conformance evidence matches its exact provider, runtime, toolchain, adapter, policy, corpus, artifact, and compatibility-tuple identities.
- [ ] **SAFE-02**: Missing, stale, mismatched, downgraded, or unverifiable runtime evidence makes the affected lane explicitly non-counted before scheduling or execution.
- [ ] **SAFE-03**: Operators can inventory affected historical results, classify their evidence status, invalidate when necessary, and recompute derived standings without rewriting the original Match evidence.
- [ ] **SAFE-04**: Public and default safety output exposes only privacy-safe classifications and evidence identifiers, never Strategy source, artifact bytes, memory, objectives, raw diagnostics, host data, credentials, or security internals.

### Canonical Authority and Compatibility

- [ ] **AUTH-01**: Maintainers have one documented canonical owner for rules, transition semantics, runtime classification, Chronicle validation, arena authority, and Set scheduling policy.
- [ ] **AUTH-02**: Every new Match and persisted evidence record carries one atomic rules, engine, runtime ABI, Chronicle, arena-catalog, and Set-policy version tuple.
- [ ] **AUTH-03**: Scheduling, execution, persistence, replay, and standings reject missing, unknown, mixed, or uncertified version tuples rather than validating tuple members independently.
- [ ] **AUTH-04**: Existing v1.4 Chronicles and results remain immutable and are interpreted only through their original rules, Chronicle, and compatibility semantics.
- [ ] **AUTH-05**: Boundary monitors fail when duplicate Match schedulers, UI-owned rules, adapter-owned gameplay classification, duplicated arena authorities, or stale public execution entry points reappear.

### Transition and Semantic Integrity

- [ ] **KERN-01**: Direct Match execution and Chronicle production consume one engine-owned transition kernel instead of independently implementing the Phase, Round, Cycle, Activation, and Contraction loop.
- [ ] **KERN-02**: Chronicle construction records canonical kernel transitions without independently advancing gameplay.
- [ ] **KERN-03**: Arena, initial-state, transition-state, runtime-final-state, persisted-state, and reconstructed-state validation rejects inverted bounds, invalid terrain, duplicate identities or occupancy, unknown owners, invalid status/position/facing combinations, bad initiative, incompatible versions, and incoherent outcomes.
- [ ] **KERN-04**: No-Advance cleanup that removes a player's final active Soldier immediately produces the canonical outcome and exactly one matching terminal event.
- [ ] **KERN-05**: A Soldier stoned or fallen during Cycle-end Backstab has its activation slot closed with the exact approved terminal reason and cannot act again.
- [ ] **KERN-06**: Excess activation-order handling follows one literal documented precedence and tests valid, invalid, duplicate, unknown, and malformed entries inside and outside the retained prefix.
- [ ] **KERN-07**: The stale contiguous-Activation public entry point is removed, and structural checks prevent production or tests from bypassing Cycle-interleaved scheduling.
- [ ] **KERN-08**: Canonical constants are frozen or deeply cloned so caller mutation cannot affect later Matches, fixtures, or evidence.
- [ ] **KERN-09**: Every declared canonical event is produced under documented conditions or removed from the active vocabulary, with version-strict tests.
- [ ] **KERN-10**: Executable compatibility fixtures preserve current v1.4 behavior for same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, Backstab geometry/timing, and every other audited ambiguity.
- [ ] **KERN-11**: Any implementation finding that would change a valid Match state, Action legality, event order, outcome, terminal timing/reason, or Strategy observation stops for an explicit compatibility ruling before expectations are changed.

### Runtime ABI, JSON, Identity, and Failure Safety

- [ ] **RABI-01**: Strategy authors have one canonical JSON profile defining byte, depth, node/entry, string, collection, Unicode, duplicate-key, ordering, finite-number, safe-integer, negative-zero, and serialization limits.
- [ ] **RABI-02**: Canonical JSON validation is iterative and bounded so adversarial depth or size returns a typed result without recursion overflow or uncontrolled allocation.
- [ ] **RABI-03**: Every runtime boundary preserves exactly three outcomes: success, player violation, and system failure.
- [ ] **RABI-04**: Only the canonical engine boundary can convert a valid player violation into the approved v1.4 gameplay consequence; transports and language adapters cannot invent penalties.
- [ ] **RABI-05**: Timeout, crash, unavailable runtime/toolchain, transport failure, malformed envelope, stale artifact, and persistence failure remain system failures and never mutate gameplay state, StrategyMemory, SoldierMemory, standings, or player result.
- [ ] **RABI-06**: Original source bytes, normalized bytes, normalization policy/version, line endings, artifact bytes, manifest fields, provider, runtime, toolchain, ABI, policy, corpus, and evidence hashes have explicit identity domains and validated bindings.
- [ ] **RABI-07**: Counted evidence resolves and pins exact runtime and toolchain identity rather than relying on floating labels such as Rust `stable` or Wasmtime `latest`.
- [ ] **RABI-08**: TypeScript, Python, Rust, and Zig share one documented ABI envelope and one resource-budget contract with explicit units, measurement boundaries, and equivalent failure semantics.

### Executable Four-Language Conformance

- [ ] **CONF-01**: The real TypeScript, Python, Rust, and Zig adapters execute the same versioned, hash-addressed positive and negative conformance corpus.
- [ ] **CONF-02**: Conformance compares canonical full state, event sequence, StrategyMemory, SoldierMemory, objectives, terminal data, and failure trace rather than final outcome alone.
- [ ] **CONF-03**: The corpus executes boundary JSON, numeric, Unicode, depth, malformed-output, timeout, resource, stale-artifact, transport, deterministic-repeat, differential, property, and mutation cases across every supported lane.
- [ ] **CONF-04**: A relevant engine, adapter, runtime, toolchain, ABI, policy, corpus, or artifact identity change automatically makes prior conformance evidence stale.
- [ ] **CONF-05**: Counted eligibility is derived from a current passing conformance artifact hash; documentation, readiness flags, registry metadata, and gate names alone cannot promote a lane.

### Chronicle and Replay Trust

- [ ] **CHRN-01**: Chronicle grammar tracks lifecycle and next-Cycle state independently for every `activationId` in interleaved play.
- [ ] **CHRN-02**: Newly produced evidence accepts only event types, boundaries, payloads, and ordering valid for its exact Chronicle and rules versions.
- [ ] **CHRN-03**: Chronicle validation checks semantic subject/state agreement, slot lifecycle, versions, outcome, and transition postconditions in addition to schema shape.
- [ ] **CHRN-04**: Runtime-service and persistence invoke the full semantic Chronicle validator before accepting successful evidence.
- [ ] **CHRN-05**: Replay reconstruction produces the same canonical transition and trace hashes as engine execution.
- [ ] **CHRN-06**: Historical v1.4 evidence remains byte-immutable and readable through explicit historical dispatch without being relabeled, normalized, or reinterpreted as current evidence.

### Strategy Evaluation Inputs and Conditions

- [ ] **STRAT-01**: `StrategyInput` exposes explicit canonical initial-initiative information across every supported language envelope.
- [ ] **STRAT-02**: `SoldierBrainInput` exposes scheduler-owned `hasAdvancedThisActivation` state across every supported language envelope.
- [ ] **STRAT-03**: Direct execution, runtime-service, generated contracts, examples, and SDK/Workshop documentation agree on the same Strategy observation and budget contract.
- [ ] **STRAT-04**: Strategy execution remains behind runtime-service, Runtime Broker, and provider boundaries and never moves into web, API, or Go processes.

### Arena Authority and Set Fairness

- [ ] **SET-01**: Engine, persistence, Go, replay, UI, fixtures, and competition scheduling derive official arenas from one versioned canonical authority.
- [ ] **SET-02**: Canonical arena identity includes semantic geometry identity so duplicate empty geometries cannot count as distinct evaluation scenarios.
- [ ] **SET-03**: Every counted scenario has explicit identity and schedules each entrant on each side and in each initial-initiative state.
- [ ] **SET-04**: TypeScript, Go, persistence, and service-backed scheduling tests prove entrant-level side-by-initiative Cartesian coverage rather than inferring fairness from seed suffixes or side swaps.
- [ ] **SET-05**: Arena and Set authority repair does not introduce a new official geometry or change valid v1.4 gameplay.

### Integrated Proof and Release

- [ ] **PROOF-01**: Every persisted core-rules audit reproduction passes or has an explicitly approved compatibility ruling retained with the regression suite.
- [ ] **PROOF-02**: Engine, spec, replay, runtime-service, and TypeScript/Python/Rust/Zig conformance suites pass with deterministic repeated results.
- [ ] **PROOF-03**: Service-backed proof covers success, player violation, system failure, no-mutation failure behavior, Chronicle validation, reconstruction, and replay.
- [ ] **PROOF-04**: Service-backed proof covers explicit Set side/initiative fairness, persistence, standings/governance recomputation, idempotency, retry, rollback, and immutable historical evidence.
- [ ] **PROOF-05**: Privacy scans cover APIs, public/default views, logs, fixtures, generated contracts, and proof artifacts for source, artifacts, memories, objectives, diagnostics, host data, credentials, and security internals.
- [ ] **PROOF-06**: Boundary monitors detect duplicate transition ownership, mixed tuples, adapter-owned gameplay classification, stale evidence identity, unsupported event vocabulary, duplicate arena authority, unfair scheduling, unproved counted lanes, and private-output leakage.
- [ ] **PROOF-07**: The final milestone audit demonstrates one transition authority, complete requirements traceability, passing drift guards, and no unapproved gameplay change.
- [ ] **PROOF-08**: v1.37 is archived and tagged before the serious competitive Strategy milestone begins.

## Conditional Simplifications

These candidates are optional and are not required for v1.37 completion.

- **COND-01**: Remove Cycle-start Backstab scans only if reachable-state differential proof establishes identical canonical state, outcome, event sequence, terminal data, and Strategy observation behavior; otherwise defer unchanged.
- **COND-02**: Add `HOLD`/`END_ACTIVATION` after Advance only after separate approval and proof covering scheduling, Backstab, slot closure, Chronicle, replay, reachable outcomes, legality, and observations; otherwise move it to a later experimental-rules milestone.

## Deferred Requirements

- **RULE-01**: Evaluate Cycle caps 8, 6, 5, or 4 under equal-compute independent Strategy evidence.
- **RULE-02**: Evaluate starting Soldiers one row inward.
- **RULE-03**: Evaluate facing-only MOVE or removal of persistent reversal history.
- **RULE-04**: Evaluate attacker-facing or Advance-causal Backstab requirements.
- **META-01**: Build the competitive Strategy factory, independent doctrine families, response oracles, and sealed adversarial league.
- **ARENA-01**: Add new official arena geometries beyond authority and fairness repair.
- **OPS-01**: Add durable ratings, prizes, staffed moderation, or broad competition operations.
- **LANG-01**: Add new languages, promote TinyGo, or introduce package ecosystems.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hidden information, live randomness, adaptive rules, or per-Match rule mutation | Conflicts with the deterministic, replayable foundation and requires a separate approved rules program. |
| Gameplay changes justified only by the current toy Strategy matrix | Existing doctrines and duplicate arenas are insufficient balance evidence. |
| Broad UI redesign | Only contract-derived, privacy-safe truthfulness updates are part of this integrity milestone. |
| Strategy execution in web, API, or Go | Violates established hostile-runtime ownership boundaries. |
| Public raw source, artifacts, memory, objectives, diagnostics, host data, credentials, or security internals | Violates existing privacy and security boundaries. |
| Wholesale activation of the v2.0 proposal | Its 63 draft requirements and 13 phases include experimental work explicitly excluded from v1.37. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SAFE-01 | Phase 256 | Pending |
| SAFE-02 | Phase 256 | Pending |
| SAFE-03 | Phase 256 | Pending |
| SAFE-04 | Phase 256 | Pending |
| AUTH-01 | Phase 256 | Pending |
| AUTH-02 | Phase 256 | Pending |
| AUTH-03 | Phase 256 | Pending |
| AUTH-04 | Phase 256 | Pending |
| AUTH-05 | Phase 256 | Pending |
| KERN-01 | Phase 257 | Pending |
| KERN-02 | Phase 257 | Pending |
| KERN-03 | Phase 257 | Pending |
| KERN-04 | Phase 257 | Pending |
| KERN-05 | Phase 257 | Pending |
| KERN-06 | Phase 257 | Pending |
| KERN-07 | Phase 257 | Pending |
| KERN-08 | Phase 257 | Pending |
| KERN-09 | Phase 257 | Pending |
| KERN-10 | Phase 257 | Pending |
| KERN-11 | Phase 257 | Pending |
| RABI-01 | Phase 258 | Pending |
| RABI-02 | Phase 258 | Pending |
| RABI-03 | Phase 258 | Pending |
| RABI-04 | Phase 258 | Pending |
| RABI-05 | Phase 258 | Pending |
| RABI-06 | Phase 258 | Pending |
| RABI-07 | Phase 258 | Pending |
| RABI-08 | Phase 258 | Pending |
| CONF-01 | Phase 259 | Pending |
| CONF-02 | Phase 259 | Pending |
| CONF-03 | Phase 259 | Pending |
| CONF-04 | Phase 259 | Pending |
| CONF-05 | Phase 259 | Pending |
| CHRN-01 | Phase 259 | Pending |
| CHRN-02 | Phase 259 | Pending |
| CHRN-03 | Phase 259 | Pending |
| CHRN-04 | Phase 259 | Pending |
| CHRN-05 | Phase 259 | Pending |
| CHRN-06 | Phase 259 | Pending |
| STRAT-01 | Phase 260 | Pending |
| STRAT-02 | Phase 260 | Pending |
| STRAT-03 | Phase 260 | Pending |
| STRAT-04 | Phase 260 | Pending |
| SET-01 | Phase 260 | Pending |
| SET-02 | Phase 260 | Pending |
| SET-03 | Phase 260 | Pending |
| SET-04 | Phase 260 | Pending |
| SET-05 | Phase 260 | Pending |
| PROOF-01 | Phase 261 | Pending |
| PROOF-02 | Phase 261 | Pending |
| PROOF-03 | Phase 261 | Pending |
| PROOF-04 | Phase 261 | Pending |
| PROOF-05 | Phase 261 | Pending |
| PROOF-06 | Phase 261 | Pending |
| PROOF-07 | Phase 261 | Pending |
| PROOF-08 | Phase 261 | Pending |

**Coverage:**
- v1.37 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

---
*Requirements defined: 2026-07-12*
*Last updated: 2026-07-12 after roadmap drafting*
