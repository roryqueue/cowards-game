# Draft Requirements: v2.0 Rules Integrity and Metagame Renewal

**Defined:** 2026-07-12
**Status:** Proposed; not active
**Core value:** Players can design, run, replay, and understand deterministic autonomous doctrines competing under one canonical, language-neutral Coward’s Game ruleset.

These 63 requirements are draft input to `$gsd-new-milestone`. Checkboxes indicate proposed work, not an active commitment.

## Safety

- [ ] **SAFE-01:** New counted execution refuses any adapter without current containment and conformance evidence tied to the active runtime/toolchain hash.
- [ ] **SAFE-02:** Stale, missing, mismatched, or downgraded runtime evidence cannot produce a counted result.
- [ ] **SAFE-03:** Authorized operators can inventory, classify, invalidate when necessary, and recompute potentially affected historical results auditably rather than silently changing them.
- [ ] **SAFE-04:** Public and operator handling remains privacy-safe and does not expose sensitive reproduction details, source, artifacts, memory, diagnostics, host data, or security internals.

## Authority and compatibility

- [ ] **AUTH-01:** Players and operators can identify one canonical owner for core rules, transitions, events, runtime classification, replay validation, arenas, and counted scheduling.
- [ ] **AUTH-02:** Every persisted Match records and validates its rules, engine, Chronicle, runtime ABI, arena-pool, and Set-policy versions.
- [ ] **AUTH-03:** Players can read one standalone v2 specification while v1.4 remains immutable historical authority rather than an overlay interpreted through v2.
- [ ] **AUTH-04:** Unsupported or mixed version tuples fail closed before counted execution.
- [ ] **AUTH-05:** Maintainers receive failing boundary checks when duplicate Match loops, stale public execution entry points, UI-owned rules, adapter-owned gameplay classification, or duplicated arena authorities reappear.

## Canonical transition kernel

- [ ] **KERN-01:** Match execution and Chronicle production consume one transition driver and cannot independently implement the complete Phase/Round/Contraction loop.
- [ ] **KERN-02:** Arena, initial, intermediate, runtime-final, and reconstructed states reject overlaps, inverted bounds, duplicate identity, unknown owners, invalid status/position combinations, and other impossible semantics.
- [ ] **KERN-03:** Players receive an immediate Match outcome after every operation that changes Soldier status or active count, including no-Advance cleanup.
- [ ] **KERN-04:** Slot termination, Cycle-end stoning/Backstab behavior, runtime termination, and excess-order precedence are deterministic and match explicit compatibility decisions.
- [ ] **KERN-05:** Maintainers have no public stale contiguous-Activation route, canonical constants cannot be mutated through aliases, and every declared canonical event is either emitted or removed from the contract.

## Runtime ABI

- [ ] **RABI-01:** Strategy authors have one canonical JSON profile defining finite numbers, safe integers, negative zero, Unicode, duplicate keys, depth, node count, and byte size.
- [ ] **RABI-02:** Every runtime preserves three distinct outcomes: success, player violation, and system failure.
- [ ] **RABI-03:** Strategy output legality is classified centrally; transports and language adapters cannot invent gameplay penalties.
- [ ] **RABI-04:** A system failure never mutates gameplay state or memory and never becomes a player loss.
- [ ] **RABI-05:** Timeout, memory, output, depth, node, and instruction/fuel budgets have equivalent documented semantics across counted lanes.
- [ ] **RABI-06:** Source and artifact byte identity plus manifest cross-field validation are exact across languages, including line endings, source/runtime identity, format, toolchain, and provenance.

## Executable cross-language conformance

- [ ] **CONF-01:** Every claimed language executes the same real positive and negative conformance corpus.
- [ ] **CONF-02:** Conformance compares normalized state, events, StrategyMemory, SoldierMemory, objectives, and failure traces—not only final outcome.
- [ ] **CONF-03:** Differential, property, mutation, numeric, Unicode, depth, malformed-output, timeout, memory, artifact, and transport-failure cases execute across all lanes.
- [ ] **CONF-04:** Counted eligibility derives from a current passing conformance artifact hash and fails closed when implementation, runtime, toolchain, policy, or corpus changes.

## Metagame measurement

- [ ] **META-01:** Balance evaluation uses independently authored doctrines and implementation families rather than parameter variants of one generator.
- [ ] **META-02:** Design and sealed-holdout pools contain genuinely distinct, schema-valid, symmetry-balanced arena families.
- [ ] **META-03:** Every evaluation mirrors entrant sides and gives each entrant both initial-initiative states, producing a complete payoff matrix and best-response graph.
- [ ] **META-04:** Anti-dominance, first-contact, pacing, interaction incidence, runtime cost, and rules-complexity thresholds are committed before candidate results are inspected.
- [ ] **META-05:** Published reports distinguish observed practical anti-dominance from any impossible claim that a frozen deterministic game can never develop a meta.

## Rules convergence

- [ ] **RULE-01:** Designers compare Cycle caps `12`, `8`, `6`, `5`, and `4` under identical paired scenarios, beginning with cap 6 as the safest challenger and accepting only the least aggressive reduction that improves Contraction relevance without unacceptable inactivity, contact delay, jams, or draws.
- [ ] **RULE-02:** Designers evaluate one-row-inward starts independently at the selected Cycle cap and reject them if safe unselected reserves or turtling outweigh reduced evacuation scripting.
- [ ] **RULE-03:** Designers evaluate facing-only MOVE and deletion of persistent reversal history independently, retesting the chosen Cycle cap and larger neighboring caps because TURN consumes movement budget.
- [ ] **RULE-04:** Designers first test post-Action-only Backstab scanning with current geometry, then independently test attacker-facing under both current and any surviving facing-only MOVE profile; attacker-facing fails if it suppresses deliberate engagement or creates evasive loops without compensating tactical play.
- [ ] **RULE-05:** Designers evaluate an explicit `END_ACTIVATION`/`HOLD` Action legal after an Advance and explicit initial-initiative Strategy input.
- [ ] **RULE-06:** Players receive literal executable rulings for same-direction collision, push/reversal history, excess-order precedence, terminal timing, blocked MOVE/PUSH, and promised-but-missing event semantics.
- [ ] **RULE-07:** Players receive only the smallest causally supported rule subset, with accepted and rejected candidates recorded in a complexity ledger and one standalone v2 specification.

## v2 engine

- [ ] **ENG-01:** The selected v2 rules execute only through the canonical transition kernel.
- [ ] **ENG-02:** Semantic invalid states fail before execution and cannot be certified by final-state or evidence schemas.
- [ ] **ENG-03:** Final state, outcome, terminal reason, slot lifecycle, and canonical events agree after every transition.
- [ ] **ENG-04:** Executable-spec, example, model, property, differential, and mutation tests cover the selected rule profile and rejected edge cases.

## Chronicle v2

- [ ] **CHRN-01:** Chronicle v2 has version-strict event boundaries and independently tracked per-slot activation/Cycle context.
- [ ] **CHRN-02:** Runtime-service and persistence call the full semantic Chronicle validator rather than stopping at shape parsing.
- [ ] **CHRN-03:** Replay reconstruction produces the same canonical transition and trace hashes as engine execution.
- [ ] **CHRN-04:** v1.4 Chronicles remain readable and immutable; migrations are explicit, versioned, and never reinterpret historical events as v2.

## Arenas and counted Sets

- [ ] **SET-01:** The counted result unit is a deterministic mirrored multi-arena Set rather than an isolated one-sided Match.
- [ ] **SET-02:** Every arena scenario gives each entrant each side and each initial-initiative state; scenario identity is explicit rather than inferred from seed suffixes.
- [ ] **SET-03:** Official arenas come from one canonical authority and are distinct, symmetry-balanced, schema-valid, and versioned; duplicate geometries cannot masquerade as diversity.
- [ ] **SET-04:** Strategy Revisions are frozen before scheduling or arena reveal and cannot adapt between Matches within a Set.
- [ ] **SET-05:** Starter, Advanced, and benchmark baselines have honest lineage plus measured source and behavioral distinctness.

## Backend migration

- [ ] **BACK-01:** Go, runtime-service, persistence, workers, and generated contracts reject incompatible version tuples consistently.
- [ ] **BACK-02:** Counted eligibility binds the current engine, ABI, Chronicle, provider, artifact, containment, and conformance evidence.
- [ ] **BACK-03:** Standings and governance recompute from v2 Set semantics while historical v1.36 evidence remains unchanged and separately interpretable.
- [ ] **BACK-04:** Retry, idempotency, canonical evidence, ownership, failure classification, privacy, and rollback guarantees survive migration.

## Product migration

- [ ] **PROD-01:** SDK and Workshop expose the selected v2 Strategy input and Action contract accurately for every supported language.
- [ ] **PROD-02:** Learn, rules, trust, and public competition copy derive from canonical authority rather than recreating enforcement rules in UI code.
- [ ] **PROD-03:** Results and replay correctly distinguish, validate, and render v1.4 and v2 evidence.
- [ ] **PROD-04:** Every existing Strategy Revision is explicitly v1.4-only, revalidated for v2, migrated through an approved transformation, or ineligible; compatibility is never inferred.

## Final proof

- [ ] **PROOF-01:** All confirmed rule-gap reproductions and the complete engine semantic/property suite pass.
- [ ] **PROOF-02:** TypeScript, Python, Rust, and Zig produce equal canonical traces and failure classifications over the complete conformance corpus.
- [ ] **PROOF-03:** Each counted runtime passes the approved containment threat model; any lane that fails remains exhibition-only.
- [ ] **PROOF-04:** The unopened metagame holdout clears the precommitted practical anti-dominance, first-contact, pacing, interaction, and complexity gates.
- [ ] **PROOF-05:** Service-backed v2 Set execution proves entry through scheduling, execution, evidence, standings, result, replay, governance, and privacy.
- [ ] **PROOF-06:** Migration, rollback, historical replay, entrant-level initiative fairness, no-mixed-version, recomputation, and public-output audits pass.

## Out of scope

| Feature | Reason |
|---|---|
| Durable ratings, prizes, staffed moderation, appeals SLAs, full account recovery | Separate operational/governance milestones |
| New Strategy languages, TinyGo promotion, package ecosystems | Would dilute rules/runtime parity work |
| Unrelated direct-export, Component Model, or WIT migration | ABI technology is not the goal; semantic parity is |
| Live randomness, LLM inference, adaptive/per-Match rules | Conflicts with deterministic autonomous play |
| Hidden enemy positions | Only a separately approved contingency if minimal changes fail |
| User-authored counted arenas | Requires a separate validation/governance design |
| Broad visual redesign | Product migration should remain contract-focused |
| Silent v1.4 result rewriting or inferred v2 compatibility | Historical evidence must remain interpretable |
| Production-sandbox claims beyond evidence | A failing lane remains exhibition-only |

## Traceability

| Requirement range | Phase | Status |
|---|---:|---|
| SAFE-01–SAFE-04 | 256 | Proposed |
| AUTH-01–AUTH-05 | 257 | Proposed |
| KERN-01–KERN-05 | 258 | Proposed |
| RABI-01–RABI-06 | 259 | Proposed |
| CONF-01–CONF-04 | 260 | Proposed |
| META-01–META-05 | 261 | Proposed |
| RULE-01–RULE-07 | 262 | Proposed |
| ENG-01–ENG-04 | 263 | Proposed |
| CHRN-01–CHRN-04 | 264 | Proposed |
| SET-01–SET-05 | 265 | Proposed |
| BACK-01–BACK-04 | 266 | Proposed |
| PROD-01–PROD-04 | 267 | Proposed |
| PROOF-01–PROOF-06 | 268 | Proposed |

**Coverage:** 63 proposed requirements; 63 mapped exactly once; 0 unmapped.

---
*Last updated: 2026-07-12 after rules-audit review and Cycle/Backstab experiment correction.*
