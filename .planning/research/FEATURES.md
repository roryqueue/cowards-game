# Feature Research

**Domain:** Deterministic programmable-strategy rules integrity and evaluation foundations
**Researched:** 2026-07-12
**Confidence:** HIGH for repository-local behavior, audit findings, and milestone scope; MEDIUM for implementation cost until plans inspect the affected packages and service contracts

## Executive Recommendation

v1.37 should ship the smallest complete trust substrate required before serious Strategy development: fail-closed counted lanes, a single versioned authority model, one transition kernel, semantic validation, exact runtime and artifact identity, language-neutral failure semantics, executable four-language conformance, Chronicle reconstruction equivalence, truthful Strategy inputs, fair Set scheduling, and service-backed proof.

This is foundation work, not a rules-renewal experiment. Preserve valid `cowards-rules-v1.4` behavior and immutable v1.4 evidence. The proposed v2.0 milestone's 63 requirements and 13 phases are useful source material, but its metagame lab, rule selection, v2 migration, and experimental profiles are not active scope. The current-HEAD reproducer still demonstrates all seven persisted gaps, and no audited production source changed since the audited snapshot, so the reproductions remain the concrete acceptance baseline.

## Feature Landscape

### Table Stakes (Users Expect These)

These are non-negotiable integrity features. Missing any of them makes competitive Strategy evidence untrustworthy even if ordinary Matches appear to run.

| Feature | Why Expected | Complexity | Testable behavior |
|---------|--------------|------------|-------------------|
| Fail-closed counted runtime eligibility | A counted result cannot rely on documentation, stale gate names, or mismatched toolchain evidence. | HIGH | A lane is counted only when current containment and executable conformance evidence match its exact provider, runtime, toolchain, artifact, ABI, engine, and policy identities; otherwise it is explicitly non-counted/exhibition-only. |
| Canonical ownership and version tuple | Rules, engine, ABI, Chronicle, arena, and Set policy cannot be allowed to version independently without compatibility checks. | HIGH | Every new Match and evidence record carries a validated tuple; incompatible or mixed tuples are rejected before execution, persistence, replay, or standings use. |
| One canonical transition authority | Duplicate engine and Chronicle loops are a direct drift mechanism. | HIGH | Engine execution owns transitions; Chronicle records them. Monitors reject any second Match scheduler or adapter-owned gameplay transition/classification path. |
| Semantic arena and Match-state validation | Shape-valid JSON can still describe impossible gameplay. | HIGH | Initial, intermediate, and final states validate bounds, unique occupancy, ownership, status/position/facing consistency, initiative, versions, arena authority, and outcome coherence at every trust boundary. |
| Confirmed lifecycle and precedence repairs | Persisted reproductions prove outcome, slot-closure, precedence, constants, entry-point, and event gaps. | HIGH | Last-Soldier cleanup ends immediately; Cycle-end Backstab closes the stoned actor's slot with an exact terminal reason; excess-order precedence is literal and tested; stale contiguous-Activation API is absent; canonical constants cannot be mutated; every canonical event is emitted or removed. |
| Explicit v1.4 compatibility rulings | Refactoring without locked rulings can silently change valid Matches. | MEDIUM | Same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, Backstab boundaries, and every discovered ambiguity have prose, fixtures, and differential tests preserving current valid behavior. |
| Canonical JSON and resource limits | Equivalent Strategy behavior must not depend on host parser recursion or language-specific serialization. | HIGH | Numeric, Unicode, duplicate-key, byte, depth, and node limits produce the same canonical decision in all lanes without uncaught host failures. |
| Three-way execution result taxonomy | System faults must never be converted into player faults or gameplay. | HIGH | Success, player violation, and system failure survive runtime, broker, engine, Chronicle, service, persistence, and public projection; system failure causes no board/memory mutation and no player penalty. |
| Exact source, artifact, runtime, and toolchain identity | Original bytes, normalized bytes, line endings, manifests, and runtime identity currently can disagree. | HIGH | Original/normalized bytes and hashes, artifact hash, manifest, provider, runtime, and toolchain form an internally consistent, validated evidence chain including CRLF cases. |
| Executable four-language conformance | TypeScript, Python, Rust, and Zig support is meaningful only when their behavior is directly compared. | HIGH | All four run the same positive and negative corpus and compare canonical state, events, StrategyMemory, SoldierMemory, objectives, and failure traces; eligibility expires on relevant drift. |
| Per-slot, semantic Chronicle validation | Interleaved v1.4 slots cannot be validated by one global Activation cursor or boundary strings alone. | HIGH | Grammar tracks each `activationId`, validates Cycle progress and terminal states, enforces exact version vocabulary, validates semantics, and reconstructs the engine's canonical transition/trace hash. |
| Immutable historical compatibility | Existing v1.4 Chronicles and results are evidence, not migration input to reinterpret. | HIGH | Historical evidence remains byte-immutable and readable only under its original rules/Chronicle semantics; any migration is explicit, versioned, and non-relabeling. |
| Truthful Strategy observation contract | Strong Strategy evaluation cannot rely on guessing initiative or whether the Soldier has Advanced. | MEDIUM | `StrategyInput` explicitly includes initiative; `SoldierBrainInput` includes authoritative `hasAdvancedThisActivation`; every supported language receives the same documented ABI envelope. |
| One runtime budget contract | Conflicting 50/10/100ms prose and approximately 1000ms enforcement contaminate performance and failure evidence. | HIGH | One documented budget/fuel contract has equivalent meanings and failure classifications across every supported lane and direct/service execution. |
| Canonical arena authority | Duplicate geometry presented under different names is not evaluation diversity. | MEDIUM | Persistence, Go, engine, replay, UI, and tests derive official arenas from one versioned authority; duplicate empty geometries cannot count as distinct scenarios. |
| Entrant-level side and initiative fairness | Seed suffixes and alternating Match initiative do not prove both entrants receive all conditions. | HIGH | Each entrant receives each side and each initial-initiative state for every counted scenario, with explicit scenario identity and regression tests. |
| Privacy and ownership preservation | Trust proof cannot expose the hostile code and private state it is intended to contain. | HIGH | Public/default outputs and generated proof omit source, artifacts, StrategyMemory, SoldierMemory, objectives, raw diagnostics, host data, tokens, security internals, and other private runtime data; Strategy execution remains outside web/API/Go. |
| Service-backed proof and rollback | Unit parity is insufficient across runtime, Chronicle, persistence, scheduling, and governance boundaries. | HIGH | Proof covers execution, player/system failures, reconstruction, replay, Set fairness, persistence, idempotency/retry, rollback, privacy, and standings/governance effects through real service boundaries. |

### Differentiators (Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Reconstruction-equivalent evidence | A replay is independently verifiable evidence of the same transitions, not a plausible animation. | HIGH | Compare canonical transition and trace hashes between engine execution and Chronicle reconstruction. |
| Executable drift guards | Future changes fail at the authority boundary instead of producing subtly incompatible evidence. | HIGH | Guard duplicate loops, tuple drift, event-vocabulary drift, arena copies, adapter-owned semantics, and stale conformance. |
| Language-neutral failure traces | Strategy authors compete under the same semantics despite radically different runtime technologies. | HIGH | Compare not just successful Actions but memory, objective, malformed-output, timeout/budget, unavailable-runtime, transport, and stale-artifact traces. |
| Evidence-bound counted status | Counted eligibility becomes a derived, revocable fact rather than a configuration label. | HIGH | Bind eligibility to immutable evidence hashes and current runtime/toolchain identity. |
| Historically honest replay | The product can improve current integrity without rewriting what old Matches meant. | MEDIUM | Version dispatch preserves `chronicle-v1.4` boundary acceptance only for historical evidence. |
| Strategy-ready observation symmetry | Future competitive controllers can plan against the actual scheduler without hidden API disadvantages. | MEDIUM | Initiative and Advance-state fields remove inference defects; every language sees the same envelope. |
| Condition-complete deterministic Sets | Evaluation distinguishes actual scenario diversity from aliases and controls side/initiative confounders. | HIGH | Explicit condition matrix becomes reusable by the next Strategy milestone. |

### Conditionally Behavior-Preserving Simplifications

These are not table stakes and must not be bundled into the foundation merely because they simplify code.

| Candidate | Why Consider | Required Gate | Disposition if Gate Fails |
|-----------|--------------|---------------|---------------------------|
| Remove Cycle-start Backstab scans | Could remove a redundant transition boundary and simplify kernel/event grammar. | Reachable-state differential proof must show identical state, outcome, and canonical-event behavior for all valid reachable states. | Defer unchanged; do not reinterpret v1.4 evidence. |
| Add `HOLD` / `END_ACTIVATION` after an Advance | Gives Strategies an explicit safe way to stop after satisfying the no-Advance rule. | Exact scheduling, Backstab, slot closure, Chronicle, replay, and observation semantics require approval plus proof of equivalence to intended existing hold behavior. | Move to a later experimental-rules milestone if any reachable outcome, event order, legality, or observation changes. |

### Anti-Features (Deferred Experiments and Scope Traps)

| Feature | Why Requested | Why Problematic in v1.37 | Alternative |
|---------|---------------|--------------------------|-------------|
| Cycle caps 8, 6, 5, or 4 | May improve pacing or interaction. | Changes reachable states and needs independently retrained Strategies and sealed evaluation. | Keep cap 12; evaluate later with equal-compute rule experiments. |
| Starting Soldiers one row inward | May reduce forced opening evacuation. | Changes openings, contact timing, contraction pressure, and valid evidence. | First build the trustworthy current-rules evaluation substrate. |
| Facing-only MOVE or removed reversal history | May simplify movement or alter tempo. | Directly changes Action legality and successful-push history semantics. | Preserve and test current persistent reversal behavior. |
| Attacker-facing or Advance-causal Backstab | May feel more intuitive. | Changes geometry, timing, outcomes, and tactical information. | Preserve v1.4 position-triggered simultaneous boundaries. |
| Hidden information, live randomness, adaptive/per-Match rules | May resist optimization. | Conflicts with deterministic replay and immutable Strategy contracts. | Use frozen rules, sealed conditions, and adversarial Strategy evaluation. |
| New official arenas | More names suggest more diversity. | New geometry is a gameplay change and duplicate geometry creates false evidence. | Consolidate authority and prove fairness using existing valid geometry. |
| Gameplay changes based on the toy Strategy matrix | Current results appear measurable. | Shared Strategy skeletons and duplicate arenas make the 540-Match matrix a regression fixture, not balance proof. | Defer changes until an independent adversarial Strategy league exists. |
| Durable ratings, prizes, staffed moderation | Could make competition feel mature. | Adds governance and operational obligations unrelated to rules integrity. | Preserve resettable public-beta trial competition. |
| New languages, TinyGo promotion, packages | Broader ecosystem appeal. | Expands the conformance and containment problem before existing lanes are trustworthy. | Repair and prove TypeScript/Python/Rust/Zig with package mode `none`. |
| Broad UI redesign | Integrity work touches public labels. | Dilutes authority, engine, runtime, and evidence work. | Make only contract-derived, privacy-safe surface updates needed for truthfulness. |
| Strategy execution in web/API/Go | Could simplify orchestration. | Violates established hostile-runtime ownership boundaries. | Keep execution behind runtime-service / Runtime Broker / provider boundaries. |
| Public raw diagnostics or artifacts | More transparency can appear trustworthy. | Exposes private Strategy and security/runtime internals. | Publish safe classifications and verifiable hashes, not sensitive payloads. |

## Testable Feature Groupings

### 1. Safety and Authority Foundation

- Fail-closed counted runtime gate.
- Canonical ownership register and version tuple.
- Compatibility rejection before execution and persistence.
- Immutable v1.4 authority/evidence boundary.

### 2. Transition Kernel and Semantic Correctness

- One transition kernel consumed by engine execution and Chronicle recording.
- Arena, input, intermediate, and final-state semantic validators.
- All persisted lifecycle reproductions repaired.
- Literal compatibility rulings and differential v1.4 fixtures.
- Canonical constants and emitted event vocabulary.

### 3. ABI, Identity, and Failure Semantics

- Canonical JSON byte/depth/node/numeric/Unicode contract.
- One resource-budget contract.
- Success/player-violation/system-failure preservation.
- Source normalization, artifact, manifest, runtime, and toolchain identity chain.
- System-failure no-mutation/no-penalty invariants.

### 4. Four-Language Executable Conformance

- Identical positive/negative corpus for TypeScript, Python, Rust, and Zig.
- Full-state, event, memory, objective, and failure-trace comparisons.
- Differential/property/mutation cases.
- Evidence-hash-bound counted eligibility and automatic staleness.

### 5. Chronicle and Replay Trust

- Per-activation-slot grammar and semantic validation.
- Strict version vocabulary.
- Transition/trace reconstruction equivalence.
- Runtime-service and persistence validation gates.
- Immutable v1.4 historical dispatch.

### 6. Strategy Evaluation Inputs and Conditions

- Initiative in `StrategyInput`.
- Authoritative `hasAdvancedThisActivation` in `SoldierBrainInput`.
- Same documented ABI envelope in all four languages.
- Canonical arena authority with duplicate-geometry rejection.
- Explicit side × initiative scheduling for every entrant and scenario.

### 7. Integrated Proof and Release Gate

- Persisted reproduction suite.
- Engine/spec/replay/runtime-service/four-language suites.
- Privacy scans and ownership/boundary monitors.
- Service-backed execution, failure, reconstruction, replay, fairness, persistence, governance, and rollback.
- Final one-transition-authority audit, archive, and tag before Strategy development.

## Feature Dependencies

```text
Fail-Closed Runtime Gate
  -> Canonical Ownership + Version Tuple
       -> Canonical Transition Kernel
            -> Semantic State Validation
            -> Lifecycle Repairs + v1.4 Differential Proof
            -> Chronicle Transition Recording

Canonical Ownership + Version Tuple
  -> Canonical JSON + Failure Taxonomy + Identity Chain
       -> Four-Language Executable Conformance
            -> Evidence-Bound Counted Eligibility

Canonical Transition Kernel
  -> Per-Slot Chronicle Semantics
       -> Reconstruction Equivalence
            -> Service/Persistence/Replay Proof

Canonical ABI Envelope
  -> Truthful Strategy Inputs
       -> Strategy-Ready Evaluation Contract

Canonical Arena Authority
  -> Explicit Side/Initiative Scenario Matrix
       -> Fair Set Scheduling Proof

All Foundation Groups
  -> Privacy + Boundary Monitors
       -> Service-Backed Final Audit
            -> Archive + Tag
                 -> Serious Strategy Milestone

Cycle-Start Backstab Removal --conflicts unless equivalent--> v1.4 Preservation
HOLD/END_ACTIVATION --conflicts unless approved equivalent--> v1.4 Preservation
Deferred Rule Experiments --conflict--> Foundation-Only v1.37 Scope
```

### Dependency Notes

- **Fail-closed eligibility precedes long-running repair work:** the project must stop producing new suspect counted evidence before relying on it for validation.
- **The version tuple precedes new evidence:** transition, ABI, Chronicle, arena, and Set artifacts need a shared compatibility identity before implementation can safely diverge into parallel surfaces.
- **Kernel precedes Chronicle convergence:** Chronicle must record authoritative transitions; designing it against a duplicate loop preserves the drift defect.
- **ABI/failure semantics precede conformance:** four-language parity is not testable until canonical JSON, budgets, identities, and the three-way result taxonomy are fixed.
- **Conformance precedes counted promotion:** gate names and documentation are not evidence; eligibility must derive from a current passing artifact.
- **Semantic Chronicle validation precedes service/replay proof:** byte-valid events cannot be trusted until slot lifecycle and reconstructed state are checked.
- **Truthful Strategy inputs and fair conditions precede serious Strategy research:** hidden initiative, inferred Advance state, unequal ABI fields, and incomplete Set mirroring contaminate evaluation.
- **Conditional simplifications remain isolated:** neither may sit on the critical path or be accepted because a refactor becomes easier.

## Milestone Definition

### Launch With (v1.37)

- [ ] Fail-closed counted runtime posture tied to exact current evidence.
- [ ] Canonical authority/version tuple and compatibility matrix.
- [ ] One transition kernel plus complete semantic validators.
- [ ] All seven persisted reproduction observations repaired or covered by an explicitly approved compatibility ruling.
- [ ] Locked v1.4 ambiguity rulings and differential fixtures.
- [ ] Canonical JSON, budget, identity, and three-way failure contracts.
- [ ] Executable TypeScript/Python/Rust/Zig conformance.
- [ ] Per-slot, version-strict Chronicle validation and reconstruction equivalence.
- [ ] Initiative, Advance-state, and equal-language ABI inputs.
- [ ] Canonical arena authority and entrant-level side/initiative Set fairness.
- [ ] Privacy, boundary-monitor, service-backed, persistence, rollback, archive, and tag proof.

### Add Only After Explicit Equivalence Approval

- [ ] Remove Cycle-start Backstab scans — only after exhaustive reachable-state equivalence including canonical events.
- [ ] Add `HOLD` / `END_ACTIVATION` — only after separately approved scheduling and replay semantics prove no gameplay change.

### Future Consideration

- [ ] Serious competitive Strategy factory and adversarial league — starts only after v1.37 archive/tag.
- [ ] Isolated equal-compute rules experiments — Cycle caps, starts, movement, and Backstab changes require the later Strategy evidence substrate.
- [ ] New arena geometries — separate gameplay and governance decision.
- [ ] Durable ratings, prizes, operations, new languages, TinyGo, packages, and broad UI work — separate milestones.

## Feature Prioritization Matrix

| Feature grouping | User/Research Value | Implementation Cost | Priority |
|------------------|---------------------|---------------------|----------|
| Safety and authority foundation | HIGH | HIGH | P1 |
| Transition kernel and semantic correctness | HIGH | HIGH | P1 |
| ABI, identity, and failure semantics | HIGH | HIGH | P1 |
| Four-language executable conformance | HIGH | HIGH | P1 |
| Chronicle and replay trust | HIGH | HIGH | P1 |
| Strategy evaluation inputs and conditions | HIGH | MEDIUM/HIGH | P1 |
| Integrated proof and release gate | HIGH | HIGH | P1 |
| Cycle-start scan removal | LOW | MEDIUM/HIGH | P3 / conditional |
| `HOLD` / `END_ACTIVATION` | MEDIUM | HIGH | P3 / conditional |
| Experimental gameplay changes | Deferred | VERY HIGH | Not v1.37 |

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Active milestone scope | HIGH | Approved milestone summary and updated PROJECT/STATE boundaries. |
| Current defects | HIGH | Persisted reproducer revalidated at current HEAD with all seven observations; audited production source unchanged since the audit snapshot. |
| v1.4 behavior to preserve | HIGH | Canonical consolidated spec plus v1.4 Cycle-interleaving and technical-architecture amendments. |
| Runtime and language prerequisites | HIGH | Audit findings, shipped four-language/runtime milestones, and Strategy-factory handoff agree on the gaps. |
| Feature dependency order | HIGH | Authority, transition, ABI, Chronicle, and proof dependencies are structural. |
| Detailed implementation cost | MEDIUM | Cross-package and service impact is clear, but plan-level source inspection is still required. |
| Conditional simplification equivalence | LOW until proved | Both candidates can alter canonical events or reachable behavior and must fail closed. |

## Sources

Primary committed inputs:

- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/MILESTONES.md`
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/ROADMAP.md`
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`
- `.planning/seeds/SEED-001-v2-rules-integrity-and-metagame-renewal.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `CowardsGame_Technical_Architecture_Spec_v1.4.md`

Current-HEAD evidence supplied at the approval checkpoint:

- HEAD `14e1035`; all seven focused reproductions persisted.
- No `packages/`, `apps/`, or `go/` changes between audited snapshot `38f4a83` and current HEAD.

---
*Feature research for: Coward's Game v1.37 Rules Integrity and Strategy Evaluation Foundations*
*Researched: 2026-07-12*
