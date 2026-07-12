# Domain Pitfalls

**Domain:** Coward's Game v1.37 Rules Integrity and Strategy Evaluation Foundations
**Researched:** 2026-07-12
**Overall confidence:** HIGH

## Scope

v1.37 is an integrity milestone, not the v2.0 experimental-rules program. Its most dangerous failures are plausible-looking partial repairs: a clarification that changes a valid v1.4 Match; a Chronicle that validates shapes but not meaning; four adapters that share labels but not behavior; or a fair-looking mirrored Set that gives one entrant initiative every time. The roadmap should keep historical `cowards-rules-v1.4` evidence immutable, establish authority before refactoring, and close with service-backed proof rather than declaration.

Recommended phase shape used below:

1. **Counted Safety and Canonical Authority** — quarantine stale/unproved lanes; define the complete version tuple and ownership boundaries.
2. **Canonical Transition Kernel and v1.4 Semantic Integrity** — unify loops, add semantic invariants, fix reproduced lifecycle defects, and freeze compatibility rulings.
3. **Canonical JSON, Failure Semantics, and Artifact Identity** — bound parsing, preserve three-way results, reconcile bytes/manifests/toolchains, and define one ABI/budget envelope.
4. **Executable Four-Language and Chronicle Conformance** — execute full traces across languages; make Chronicle version-strict, per-slot, semantic, and reconstruction-equivalent.
5. **Strategy Inputs, Arena Authority, and Set Fairness** — expose truthful inputs, consolidate arenas, and schedule every side/initiative combination.
6. **Service-Backed Proof, Drift Guards, and Archive** — prove persistence/recompute/rollback/privacy/boundaries, rerun reproductions, audit one transition owner, archive, and tag.

This six-phase shape deliberately does not copy the proposal's 63 requirements or 13 phases. If implementation sizing requires a split, split within these integrity seams rather than importing deferred experiments.

## Critical Pitfalls

### Pitfall 1: A “clarification” silently changes valid v1.4 play

**What goes wrong:** Prose or tests are updated under a clarification label but change a valid state, Action legality, event order, outcome, terminal timing, or Strategy observation. High-risk examples are same-direction collision, successful-push reversal history, blocked MOVE/PUSH, Backstab timing, excess-order precedence, and post-Advance hold behavior.

**Warning signs:** Golden fixtures are re-recorded instead of compared; expected outputs change without a compatibility decision; a new ruling is justified by neatness or the toy Strategy matrix; old v1.4 Chronicles only pass after reinterpretation.

**Prevention:** Freeze current-HEAD differential fixtures before refactoring. Maintain an explicit compatibility-ruling ledger with literal prose and executable examples. Require a separate approval whenever state/event/observation hashes change. Treat conditional Cycle-start scan removal and `HOLD`/`END_ACTIVATION` as proof-gated experiments; defer them if equivalence fails.

**Roadmap phase:** Phase 2; rechecked in Phase 6.

### Pitfall 2: Two transition authorities survive behind different APIs

**What goes wrong:** The engine and Chronicle builder continue to implement Phase/Round/Cycle/Contraction sequencing independently, or a legacy contiguous-Activation API remains public and becomes a third route.

**Warning signs:** `runMatch` and Chronicle construction each own nested Match loops; lifecycle fixes require edits in multiple packages; engine and replay tests pass independently but disagree end to end; the stale `resolveActivation` route remains exported.

**Prevention:** Define one transition kernel that returns canonical transitions plus state. Engine execution consumes it; Chronicle records it; replay reconstructs it. Remove the stale public route and add structural monitors that reject new complete Match loops outside the kernel.

**Roadmap phase:** Phase 2; monitor in Phase 6.

### Pitfall 3: Shape validation is mistaken for semantic validation

**What goes wrong:** Zod/schema parsing accepts individually well-typed but impossible arenas or states: terrain on starting Soldiers, overlaps, inverted bounds, duplicate Soldier IDs, unknown owners, ACTIVE/STONE without positions, FALLEN occupancy, inconsistent initiative/version/outcome, or impossible terminal subjects.

**Warning signs:** Validators are only `safeParse`; state creation trusts an `ArenaVariantSchema.parse`; reconstruction accepts a state the engine could never produce; tests cover missing fields but not cross-field invariants.

**Prevention:** Add bounded semantic validators at arena, initial, every transition boundary, runtime-final, persisted-final, and reconstructed state boundaries. Centralize occupancy and identity checks. Property/mutation tests must generate cross-field-invalid states, not merely invalid JSON shapes.

**Roadmap phase:** Phase 2, then Chronicle enforcement in Phase 4.

### Pitfall 4: Recursive validation or serialization becomes a denial-of-service path

**What goes wrong:** Deep but byte-valid memory/objective/output causes `RangeError`, excessive CPU, or uncontrolled allocation before a clean player-violation result can be returned.

**Warning signs:** `JSON.stringify` or recursive schema descent runs before depth/node checks; only byte limits are documented; a 3,000-deep value throws instead of returning a typed result; adapters apply different traversal order.

**Prevention:** Define canonical byte, depth, node, string, collection, numeric, and Unicode limits. Use iterative bounded traversal and limit transport bytes before parsing where possible. Run identical boundary and bomb corpora in TypeScript, Python, Rust, and Zig.

**Roadmap phase:** Phase 3; cross-language proof in Phase 4.

### Pitfall 5: Adapters own gameplay classification

**What goes wrong:** A language adapter, runtime-service transport, worker, or Go layer decides that malformed output, timeout, crash, unavailable runtime, or protocol failure is a gameplay penalty.

**Warning signs:** Equivalent failures produce `RUNTIME_VIOLATION` in one lane and `systemFailure` in another; adapter code stones Soldiers or chooses winners; transport status codes determine Match consequences; retry policy and gameplay policy share an enum.

**Prevention:** Adapters return only canonical success, player violation, or system failure with public-safe categories. A central engine boundary alone decides consequences for valid player violations. System/infrastructure failures remain outside gameplay classification.

**Roadmap phase:** Phase 3; executable parity in Phase 4; boundary monitor in Phase 6.

### Pitfall 6: System failure mutates state or becomes a player loss

**What goes wrong:** A timeout, crash, host error, unavailable toolchain, stale artifact, malformed transport envelope, or persistence failure commits memory/action changes, stones a Soldier, awards a loss, or contaminates counted standings.

**Warning signs:** State is mutated before the runtime result is classified; retries resume from partially updated state; system failures appear as Chronicle gameplay violations; standings can count an incomplete/degraded Match.

**Prevention:** Stage runtime results and validate completely before committing a transition. Define an atomic no-mutation system-failure path, idempotency key, retry boundary, and rollback proof. Counted scheduling and standings must fail closed until a canonical completed result exists.

**Roadmap phase:** Phase 3; service/persistence/rollback proof in Phase 6.

### Pitfall 7: Source normalization creates multiple incompatible identities

**What goes wrong:** Original source bytes, normalized bytes, CRLF/LF forms, compiled artifacts, manifests, runtime metadata, and toolchain identity disagree while one layer still considers the revision current.

**Warning signs:** Python normalization changes bytes but revision hashes still identify originals ambiguously; a manifest binds a source hash but not normalization policy; artifact validation ignores runtime/toolchain identity; line-ending conversion silently regenerates evidence.

**Prevention:** Specify exact hash domains and cross-field bindings: original bytes/hash, normalization algorithm/version, normalized bytes/hash, artifact bytes/hash, manifest, provider, runtime, toolchain, ABI, and conformance-corpus hash. Reject missing, stale, mixed, or recomputed identities rather than guessing equivalence.

**Roadmap phase:** Phase 3; eligibility drift checks in Phases 4 and 6.

### Pitfall 8: Conformance remains declarative

**What goes wrong:** TypeScript, Python, Rust, and Zig advertise the same ABI/gate names while executing different subsets or comparing only final outcomes.

**Warning signs:** A matrix is generated from registry metadata; lanes share test names but not case artifacts; memory/objective/event/failure traces are omitted; unavailable toolchains are recorded as passes; negative cases run only against TypeScript.

**Prevention:** Use one immutable positive/negative corpus and require every counted lane to execute every applicable case. Compare normalized full state, events, StrategyMemory, SoldierMemory, objectives, and failure traces. Bind counted eligibility to the current passing conformance artifact hash and exact runtime/toolchain tuple.

**Roadmap phase:** Phase 4; fail-closed gate audited in Phase 6.

### Pitfall 9: Chronicle validation reinterprets historical evidence

**What goes wrong:** Tightening v1.37 Chronicle rules makes v1.4 evidence invalid, or historical `post-advance`/legacy boundary strings are silently treated as if emitted under the current grammar.

**Warning signs:** One validator accepts every boundary literal for every version; migrations rewrite old artifacts; replay labels old evidence with the new tuple; current rules are inferred from latest code rather than persisted versions.

**Prevention:** Dispatch validation by explicit Chronicle/rules tuple. Preserve immutable v1.4 grammar and interpretations. Apply new strict literals only to new evidence. Compatibility adapters may read historical evidence but must never relabel or rewrite it.

**Roadmap phase:** Phase 4; historical regression and archive proof in Phase 6.

### Pitfall 10: Chronicle grammar is global instead of per activation slot

**What goes wrong:** Interleaved Cycle events validate because global sequence numbers rise even when one slot duplicates, skips, reopens, or advances out of order.

**Warning signs:** Grammar tracks one `activeActivation`; `activationId` is metadata rather than a state-machine key; noncontiguous events cannot be reconstructed; terminal reason disagrees with the actor's state.

**Prevention:** Track each selected slot independently by `activationId`, expected Cycle, advanced flag, ended state, and terminal reason. Validate event subject/state consistency and require reconstruction-equivalent transition hashes.

**Roadmap phase:** Phase 4.

### Pitfall 11: Mixed version tuples pass because each component is individually supported

**What goes wrong:** A supported rules version is combined with a supported engine, ABI, Chronicle, arena pool, or Set policy that was never certified together.

**Warning signs:** Compatibility checks are independent membership tests; persisted Matches omit one tuple member; UI or services synthesize missing versions from current defaults; replay uses latest arena data.

**Prevention:** Make the full rules/engine/runtime-ABI/Chronicle/arena-pool/Set-policy tuple a canonical persisted value. Maintain an allowlist of certified complete tuples. Missing or mixed tuples fail before counted scheduling, execution, persistence, or replay.

**Roadmap phase:** Phase 1; enforced throughout Phases 3–6.

### Pitfall 12: Counted lanes are promoted by documentation or gate names

**What goes wrong:** A lane becomes counted because docs say “supported,” a readiness flag is true, or a conformance job exists, despite stale/missing containment and executable evidence for the current runtime/toolchain.

**Warning signs:** Eligibility reads display metadata or cached checker state; evidence has no expiry/drift inputs; a toolchain upgrade leaves eligibility unchanged; unavailable proof falls back locally.

**Prevention:** Quarantine first. Derive counted eligibility only from current executable containment and conformance artifacts bound to the complete identity tuple. Any relevant code, policy, runtime, toolchain, corpus, or artifact change invalidates the gate.

**Roadmap phase:** Phase 1; certified in Phase 4 and audited in Phase 6.

### Pitfall 13: Side swapping is confused with entrant-level initiative fairness

**What goes wrong:** Mirrored scheduling swaps bottom/top and flips seed parity in a way that lets the same entrant retain initiative in both Matches.

**Warning signs:** Tests assert only side swap and `:mirror` suffix; initiative is inferred indirectly from seed spelling; schedules report two Matches as fair without enumerating entrant conditions.

**Prevention:** Represent side and initial initiative explicitly in scenario identity. For each entrant, assert coverage of bottom/top and initiative/no-initiative, ideally as the four-cell Cartesian product. Test service, persistence, and Go scheduling outputs, not only an in-process helper.

**Roadmap phase:** Phase 5; service-backed proof in Phase 6.

### Pitfall 14: Duplicate empty arenas masquerade as diversity

**What goes wrong:** Smoke and Open Field count as separate scenarios despite identical geometry, while persistence, Go, UI, replay, and package definitions drift.

**Warning signs:** Diversity reports count IDs rather than canonical geometry hashes; the same arena exists in several codebases; renamed empty maps change reported sample size; replay resolves geometry from current presets.

**Prevention:** Establish one arena authority and versioned canonical geometry identity. Deduplicate evaluation conditions by semantic geometry hash. v1.37 may repair authority/fairness but must not add new official geometries.

**Roadmap phase:** Phase 5; drift monitor in Phase 6.

### Pitfall 15: Rollback or recomputation rewrites historical truth

**What goes wrong:** Invalidating suspect counted evidence deletes or mutates Chronicles/results, recomputation mixes semantics, or retry/rollback duplicates Match completion and standings effects.

**Warning signs:** Historical rows are updated in place; recomputation uses latest Set policy; caches are the only standings source; a retry can persist a second Chronicle; rollback cannot distinguish v1.4 from v1.37 evidence.

**Prevention:** Preserve append-only source evidence and explicit governance state. Recompute by persisted version tuple and Set policy. Prove idempotent completion, Chronicle uniqueness, cache rebuild, invalidation/reinstatement, interrupted persistence rollback, and unchanged v1.4 outputs.

**Roadmap phase:** Phase 6, with tuple prerequisites from Phase 1.

### Pitfall 16: Privacy leaks through “proof” rather than public APIs

**What goes wrong:** Generated conformance reports, Chronicle diagnostics, failure traces, manifests, logs, E2E artifacts, or boundary-monitor output expose source, artifacts, memory, objectives, Awareness details, host paths, environment, toolchain paths, tokens, database details, or security internals.

**Warning signs:** Public projections are scanned but generated `.planning/artifacts` are not; exception strings are copied verbatim; full manifests/artifacts appear in public evidence; system-failure traces are rendered to players.

**Prevention:** Maintain separate private diagnostic and public-safe evidence schemas. Scan APIs, pages, logs, generated reports, fixtures, proof JSON/Markdown, and failure paths using both key and value markers. Publish hashes/categories and evidence status, not raw sensitive inputs.

**Roadmap phase:** Every phase; comprehensive proof in Phase 6.

### Pitfall 17: Audit evidence goes stale during implementation

**What goes wrong:** Teams repair against the audited commit rather than current HEAD, delete reproductions once tests pass, or certify a runtime using evidence generated before the final change.

**Warning signs:** Reproduction output is pasted rather than executed; artifact metadata lacks commit/toolchain identity; focused probes disappear into broad suites; final proof does not rerun every persisted reproduction.

**Prevention:** Preserve reproductions as first-class regression inputs. Capture baseline at current HEAD, rerun after the owning phase and at the final gate, and bind evidence to commit, runtime, toolchain, corpus, and policy identities. An intentional compatibility ruling must be explicit rather than a changed expected value hidden in a test.

**Roadmap phase:** Baseline in Phase 2; rerun/certify in Phase 6.

### Pitfall 18: The roadmap copies the proposal instead of scoping the foundation

**What goes wrong:** v1.37 silently activates all 63 draft v2.0 requirements, 13 phases, metagame lab, Cycle-cap/start/facing/Backstab experiments, new arenas, or broad product migration.

**Warning signs:** Active requirements use `META-*` or experimental `RULE-*` wholesale; phases resemble 256–268 one-for-one; Strategy strength or anti-dominance becomes a release gate; deferred gameplay choices appear as implementation tasks.

**Prevention:** Trace every active requirement to the approved committed list. Keep only integrity foundations and truthful Strategy inputs. Record conditional simplifications separately with explicit equivalence gates; record all gameplay experiments as deferred. Use the compact six-phase dependency shape above.

**Roadmap phase:** Requirements/roadmap gate before Phase 1; scope audit in Phase 6.

## Moderate Pitfalls

### Pitfall 19: Canonical constants remain mutable through aliases

**What goes wrong:** A caller mutates bounds, directions, limits, arenas, or compatibility records imported as canonical constants and changes later Matches.

**Prevention:** Deep-freeze internal constants and clone at trust boundaries; add mutation tests that run Matches before and after hostile caller changes.

**Roadmap phase:** Phase 2.

### Pitfall 20: Canonical event vocabulary promises events no producer emits

**What goes wrong:** Consumers implement around `PUSH_ATTEMPTED` or another declared event that is never emitted, while producers use undocumented alternatives.

**Prevention:** Build an executable producer/consumer inventory. Every canonical event must have a reachable emission test and semantic validator or be removed through an approved compatibility decision.

**Roadmap phase:** Phase 2; Chronicle proof in Phase 4.

### Pitfall 21: Strategy inputs expose inferred rather than authoritative facts

**What goes wrong:** `hasInitiative` or `hasAdvancedThisActivation` is reconstructed differently by languages or inferred from movement/push history, contaminating later Strategy evaluation.

**Prevention:** Populate explicit fields from canonical scheduler state, serialize identically for every language, document the privacy/information boundary, and add symmetry/opaque-ID tests.

**Roadmap phase:** Phase 5, with ABI cases in Phase 4.

### Pitfall 22: Runtime budgets have equal numbers but unequal meaning

**What goes wrong:** Wall time, CPU time, fuel, output bytes, or memory caps share a label while adapters measure different scopes and include different startup/serialization costs.

**Prevention:** Define one semantic budget contract with measurement boundary, clock/fuel source, granularity, startup inclusion, cancellation behavior, and failure class. Document any lane-specific mechanism without claiming stronger equivalence than executable tests prove.

**Roadmap phase:** Phase 3; conformance in Phase 4.

## Roadmap Research Flags

| Phase | Risk level | Required deeper investigation |
| --- | --- | --- |
| 1. Counted Safety and Canonical Authority | High | Inventory every eligibility/version producer and consumer; decide evidence invalidation inputs before implementing gates. |
| 2. Canonical Transition Kernel and v1.4 Semantic Integrity | Critical | Differentially characterize all ambiguous rulings before refactoring; prove conditional simplifications separately. |
| 3. Canonical JSON, Failure Semantics, and Artifact Identity | Critical | Specify parser-independent limits, atomic failure behavior, hash domains, normalization, and resource-budget measurement. |
| 4. Executable Four-Language and Chronicle Conformance | Critical | Ensure every lane truly executes the same corpus and Chronicle validation is per-slot, semantic, versioned, and reconstructive. |
| 5. Strategy Inputs, Arena Authority, and Set Fairness | High | Model entrant-level side/initiative coverage explicitly and distinguish arena identity from semantic diversity. |
| 6. Service-Backed Proof, Drift Guards, and Archive | Critical | Exercise failure injection, persistence interruption, recomputation, rollback, privacy scans, historical compatibility, and evidence freshness before tag. |

## Sources

Primary evidence is repository-local and current as of 2026-07-12:

- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/artifacts/v2.0-core-rules-audit/reproduce-core-rule-gaps.ts`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/{PROPOSAL,REQUIREMENTS,ROADMAP}.md`
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`
- `.planning/seeds/SEED-001-v2-rules-integrity-and-metagame-renewal.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `CowardsGame_Technical_Architecture_Spec_v1.4.md`
- `.planning/{PROJECT,STATE,MILESTONES}.md`
- Current code seams in `packages/engine`, `packages/spec`, `packages/replay`, runtime/provider packages, persistence/service scheduling, worker orchestration, and `apps/go-backend`.

No external ecosystem claims were needed: these pitfalls arise from the committed audit artifacts, canonical specifications, current architecture, and approved milestone boundaries.
