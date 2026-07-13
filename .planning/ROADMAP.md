# Roadmap: Coward's Game

## Milestones

- **v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup** - Phases 243-248, shipped 2026-06-15 ([archive](milestones/v1.35-ROADMAP.md))
- **v1.36 Competition Maturity** - Phases 249-255, shipped 2026-07-12 ([archive](milestones/v1.36-ROADMAP.md))
- **v1.37 Rules Integrity and Strategy Evaluation Foundations** - Phases 256-261, planning

## v1.37 Rules Integrity and Strategy Evaluation Foundations — ACTIVE

## Overview

v1.37 establishes the smallest complete trust substrate needed before serious competitive Strategy development. It first prevents unproved runtime lanes and incompatible evidence from being counted, then converges Match execution on one semantically validated transition authority, hardens the language-neutral runtime and artifact contracts, proves executable four-language and Chronicle conformance, repairs Strategy observations and evaluation fairness, and closes with service-backed drift, privacy, compatibility, persistence, rollback, archive, and tag proof. Valid v1.4 gameplay and historical evidence remain immutable; experiments and optional simplifications are not required for completion.

## Phases

- [x] **Phase 256: Counted Safety and Canonical Authority** - Fail closed on unproved lanes and establish one atomic compatibility and ownership authority. (completed 2026-07-13)
- [ ] **Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity** - Make one validated kernel authoritative and close every confirmed rules-lifecycle defect without changing valid v1.4 behavior.
- [ ] **Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity** - Define a bounded language-neutral ABI with exact identity and atomic three-way failure behavior.
- [ ] **Phase 259: Executable Four-Language and Chronicle Conformance** - Prove full-trace parity through real adapters and version-strict, reconstruction-equivalent Chronicles.
- [ ] **Phase 260: Truthful Strategy Inputs, Arena Authority, and Set Fairness** - Give every Strategy truthful observations and every entrant explicit side-by-initiative evaluation coverage.
- [ ] **Phase 261: Integrated Service Proof, Drift Guards, and Release** - Prove the complete trust chain, audit compatibility and privacy, then archive and tag v1.37.

## Phase Details

### Phase 256: Counted Safety and Canonical Authority

**Goal:** Operators can trust that only currently proved runtime lanes and atomically compatible evidence enter counted competition while historical v1.4 evidence remains unchanged.
**Depends on:** Phase 255 (v1.36 complete)
**Requirements:** SAFE-01, SAFE-02, SAFE-03, SAFE-04, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Success Criteria** (what must be TRUE):

  1. A lane cannot be counted unless current executable containment and conformance evidence matches every exact provider, runtime, toolchain, adapter, policy, corpus, artifact, and compatibility identity; stale or unverifiable evidence fails closed before scheduling or execution.
  2. New Match and evidence records carry one atomic rules/engine/runtime-ABI/Chronicle/arena/Set-policy tuple, and every consumer rejects missing, unknown, mixed, or uncertified tuples.
  3. Operators can classify affected historical results, invalidate and recompute derived standings when needed, while the original Match evidence and v1.4 interpretation remain immutable.
  4. Public/default safety surfaces expose only safe classifications and evidence identifiers, and structural monitors reject duplicate authorities and stale execution entry points.

**Plans:** 19/19 plans complete

Plans:
**Wave 1**

- [x] 256-01-PLAN.md — Establish the immutable owner registry, semantic tuple, and generated hash vectors.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 256-02-PLAN.md — Derive lane status and safe projections from exact current containment and conformance evidence.
- [x] 256-19-PLAN.md — Retire every direct TypeScript worker purpose before claim and guard the boundary structurally.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 256-03-PLAN.md — Carry atomic tuple and evidence identity through shared execution and Match evidence contracts.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 256-04-PLAN.md — Add exact identity schema, immutable evidence storage, and PostgreSQL constraints.
- [x] 256-17-PLAN.md — Define the signed, atomically replaceable authority bundle independently verified by Node and Go.

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 256-15-PLAN.md — Admit certificates only through closed verified-attestation imports and keep production conformance empty.

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 256-05-PLAN.md — Migrate the active TypeScript Match and MatchSet creation writers transactionally.
- [x] 256-06-PLAN.md — Preserve exact identity through TypeScript completion and Chronicle insertion.
- [x] 256-07-PLAN.md — Resolve history read-only and apply append-only, compensatable governance.
- [x] 256-18-PLAN.md — Publish verified append-only evidence, authenticated certificate status, and lane controls through failure-safe signed installation.

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 256-08-PLAN.md — Enforce exact evidence at TypeScript entry, scheduling, and claim boundaries.
- [x] 256-09-PLAN.md — Revalidate exact independently signed authority around every runtime-service execution.
- [x] 256-10-PLAN.md — Prove Go tuple hashing and exact evidence-classification parity.
- [x] 256-16-PLAN.md — Migrate every TypeScript creation caller to complete per-entrant evidence and inventory future bypasses.

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 256-11-PLAN.md — Enforce exact evidence through Go claim, transport, completion, and Chronicle writes.
- [x] 256-12-PLAN.md — Make normal Go MatchSet creation exact, transactional, and database-proved.

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 256-13-PLAN.md — Project privacy-safe current, operator, and historical evidence through Go reads.

**Wave 10** *(blocked on Wave 9 completion)*

- [x] 256-14-PLAN.md — Install current and version-aware historical drift guards, persist the unchanged audit baseline, and run the full phase gate.

### Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity

**Goal:** Every canonical Match advances through one engine-owned, semantically validated transition authority that fixes confirmed defects while preserving valid v1.4 behavior.
**Depends on:** Phase 256
**Requirements:** KERN-01, KERN-02, KERN-03, KERN-04, KERN-05, KERN-06, KERN-07, KERN-08, KERN-09, KERN-10, KERN-11
**Success Criteria** (what must be TRUE):

  1. Direct execution and Chronicle production consume the same engine-owned transition kernel; Chronicle records transitions without scheduling gameplay, and no stale contiguous-Activation route can bypass Cycle-interleaved execution.
  2. Arena and Match states are semantically validated at initial, transition, runtime-final, persistence, and reconstruction boundaries, rejecting impossible geometry, identity, occupancy, ownership, status, initiative, version, and outcome combinations.
  3. Permanent regression cases prove immediate last-Soldier outcome, correct Cycle-end Backstab slot closure, literal excess-order precedence, immutable constants, and an emitted-or-removed version-strict event vocabulary.
  4. Executable compatibility fixtures preserve same-direction collision, successful-push reversal history, blocked MOVE/PUSH, terminal timing, Backstab behavior, and every other audited valid v1.4 ruling.
  5. If any clarification or refactor would change a valid state, Action legality, event order, outcome, terminal timing/reason, or Strategy observation, work stops for an explicit compatibility ruling before expectations change.

**Plans:** 16/22 plans executed

**Wave 1 — permanent RED and compatibility evidence**

- [x] 257-01-PLAN.md — Freeze pre-refactor authority evidence and one-kernel RED contracts.
- [x] 257-02-PLAN.md — Freeze approved lifecycle and excess-order repair RED cases.
- [x] 257-03-PLAN.md — Capture the complete valid-v1.4 compatibility corpus and companion addendum.
- [x] 257-04-PLAN.md — Establish cross-boundary semantic-integrity RED vectors with precise failure markers.

**Wave 2 — semantic contracts and reference ownership**

- [x] 257-05-PLAN.md — Implement bounded deterministic semantic validators and failure ownership.
- [x] 257-07-PLAN.md — Prepare an inactive semantic tuple/event/arena candidate without activating it.
- [x] 257-11-PLAN.md — Freeze the AST-aware executable-reference ownership inventory.

**Wave 3 — immutable admission and candidate event coverage**

- [x] 257-06-PLAN.md — Deep-freeze constants and enforce semantic initial-state admission.
- [x] 257-12-PLAN.md — Generate candidate-mode event producer/consumer/validator coverage.

**Wave 4 — one transition authority**

- [x] 257-08-PLAN.md — Implement the pure resumable kernel, effects-as-data, and sole Match driver.

**Wave 5 — approved repairs and recorder migration**

- [x] 257-09-PLAN.md — Implement only the approved lifecycle and excess-order repairs.
- [x] 257-10-PLAN.md — Add the public recorder and migrate its assigned caller group.

**Wave 6 — replay semantics and stale Activation callers**

- [x] 257-13-PLAN.md — Stage semantic replay validation/reconstruction with no scheduling authority.
- [x] 257-18-PLAN.md — Migrate exact contiguous-Activation callers and the permanent probe.

**Wave 7 — replay fixtures**

- [x] 257-14-PLAN.md — Migrate the bounded replay fixture/golden caller group.

**Wave 8 — runtime-service candidate**

- [x] 257-15-PLAN.md — Stage the candidate runtime-service execution path.

**Wave 9 — TypeScript and Go candidate persistence boundaries**

- [ ] 257-16-PLAN.md — Stage candidate-tuple TypeScript persistence admission and rollback after the runtime producer exists.
- [ ] 257-17-PLAN.md — Stage candidate-tuple semantic validation and rollback parity in Go after the candidate runtime-service producer exists.

**Wave 10 — indivisible current activation**

- [ ] 257-19-PLAN.md — Atomically activate tuple, contracts, artifacts, receipts, event coverage, callers, and retired definitions after the full compatibility gate.

**Wave 11 — structural and audit convergence**

- [ ] 257-20-PLAN.md — Replace known debt with structural negatives and persist the exact audit delta.

**Wave 12 — browser realism and privacy**

- [ ] 257-21-PLAN.md — Prove canonical board realism, terminal agreement, and public privacy in the root Playwright matrix.

**Wave 13 — final evaluator and default boundary chain**

- [ ] 257-22-PLAN.md — Persist deterministic Phase-257 proof and wire it into the serialized default boundary chain.

**Cross-cutting constraints:** preserve every valid v1.4 state/event/observation unless D-09 through D-15 expressly approve the delta; keep current identity unchanged until the one Plan-19 activation commit; any unexpected compatibility delta stops for KERN-11 approval; Cycle-start Backstab removal and HOLD/END_ACTIVATION remain deferred.

### Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity

**Goal:** Every supported runtime exchanges bounded canonical data, preserves exact provenance, and cannot turn infrastructure failure into gameplay or player penalty.
**Depends on:** Phase 257
**Requirements:** RABI-01, RABI-02, RABI-03, RABI-04, RABI-05, RABI-06, RABI-07, RABI-08
**Success Criteria** (what must be TRUE):

  1. Strategy authors and adapters share one canonical JSON profile whose iterative bounded validation returns typed errors for adversarial bytes, depth, nodes, strings, collections, Unicode, keys, ordering, and numeric values without recursion overflow or uncontrolled allocation.
  2. Every runtime boundary preserves exactly success, player violation, or system failure, and only the canonical engine can translate a valid player violation into the approved v1.4 gameplay consequence.
  3. Timeout, crash, runtime/toolchain unavailability, transport, malformed envelope, stale artifact, and persistence failures produce no gameplay, memory, standings, or player-result mutation.
  4. Evidence binds explicit source-byte, normalized-byte, normalization, line-ending, artifact, manifest, provider, runtime, toolchain, ABI, policy, corpus, and evidence identities, with exact pins for counted use.
  5. TypeScript, Python, Rust, and Zig expose the same ABI envelope, resource-budget units, measurement boundaries, and failure semantics.

**Plans:** TBD

### Phase 259: Executable Four-Language and Chronicle Conformance

**Goal:** Actual TypeScript, Python, Rust, and Zig execution and canonical Chronicle/replay processing produce equivalent, identity-bound full traces.
**Depends on:** Phase 258
**Requirements:** CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, CHRN-01, CHRN-02, CHRN-03, CHRN-04, CHRN-05, CHRN-06
**Success Criteria** (what must be TRUE):

  1. Real TypeScript, Python, Rust, and Zig adapters execute the same hash-addressed positive and negative corpus and agree on full state, event sequence, memories, objectives, terminal data, and failure traces.
  2. The corpus repeatedly covers boundary JSON, numeric, Unicode, depth, malformed output, timeout, resource, stale artifact, transport, differential, property, and mutation cases on every supported lane.
  3. Counted eligibility derives only from a current passing conformance artifact hash, and any relevant engine, adapter, runtime, toolchain, ABI, policy, corpus, or artifact change automatically stales prior evidence.
  4. Current Chronicles are version-strict and semantically validated per activation slot by runtime-service and persistence, including subject/state agreement, lifecycle, outcome, ordering, and transition postconditions.
  5. Replay reconstruction matches engine transition and trace hashes while historical v1.4 evidence remains byte-immutable and readable only through explicit historical dispatch; any discovered semantic delta stops for compatibility approval.

**Plans:** TBD

### Phase 260: Truthful Strategy Inputs, Arena Authority, and Set Fairness

**Goal:** Strategies observe the same authoritative evaluation facts in every language and counted Sets provide explicit, semantically distinct side-by-initiative coverage.
**Depends on:** Phase 259
**Requirements:** STRAT-01, STRAT-02, STRAT-03, STRAT-04, SET-01, SET-02, SET-03, SET-04, SET-05
**Success Criteria** (what must be TRUE):

  1. Every supported language receives explicit canonical initial initiative and scheduler-owned `hasAdvancedThisActivation`, with direct execution, services, generated contracts, examples, SDK, and Workshop documentation in agreement.
  2. Strategy execution remains behind runtime-service, Runtime Broker, and provider boundaries and never enters web, API, or Go processes.
  3. Engine, persistence, Go, replay, UI, fixtures, and scheduling derive official arenas from one versioned authority whose semantic geometry identity prevents duplicate empty arenas from masquerading as diversity.
  4. Each counted scenario explicitly schedules every entrant on each side and in each initial-initiative state, proved at entrant level through TypeScript, Go, persistence, and service-backed tests.
  5. Arena and Set repair adds no official geometry or valid v1.4 gameplay change; any change to Strategy observation or reachable Match semantics stops for explicit compatibility approval.

**Plans:** TBD

### Phase 261: Integrated Service Proof, Drift Guards, and Release

**Goal:** Maintainers have an end-to-end, privacy-safe proof that v1.37 has one transition authority, trustworthy runtime and replay evidence, fair Sets, and no unapproved gameplay change before release.
**Depends on:** Phase 260
**Requirements:** PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05, PROOF-06, PROOF-07, PROOF-08
**Success Criteria** (what must be TRUE):

  1. Every persisted audit reproduction passes or retains an explicit compatibility ruling, and deterministic engine, spec, replay, runtime-service, and four-language suites pass repeatedly.
  2. Service-backed proof covers success, player violation, system failure with no mutation, semantic Chronicle validation, reconstruction, replay, Set fairness, persistence, recomputation, idempotency, retry, rollback, and immutable historical evidence.
  3. Public/default APIs, views, logs, fixtures, contracts, and proof artifacts pass privacy scans for source, artifacts, memories, objectives, diagnostics, host data, credentials, and security internals.
  4. Boundary monitors detect duplicate transition ownership, mixed tuples, adapter-owned gameplay classification, stale identity, unsupported events, duplicate arenas, unfair scheduling, unproved counted lanes, and private-output leakage.
  5. The final audit proves complete 56/56 traceability, one transition authority, passing drift guards, and no unapproved gameplay change; v1.37 is then archived and tagged before serious Strategy work begins.

**Plans:** TBD

## Optional Compatibility-Gated Simplifications

These candidates are outside required completion and are not mapped to active phases:

- **COND-01**: Remove Cycle-start Backstab scans only after complete reachable-state, outcome, event, terminal, and Strategy-observation equivalence proof; otherwise defer unchanged.
- **COND-02**: Add `HOLD`/`END_ACTIVATION` after Advance only after separate approval and complete scheduling, Backstab, slot, Chronicle, replay, outcome, legality, and observation proof; otherwise defer.

Neither candidate may change a valid v1.4 state, Action legality, event order, outcome, terminal semantic, or Strategy observation without an explicit compatibility ruling.

## Deferred Beyond v1.37

Cycle-cap, inward-start, facing-only MOVE, reversal-history, attacker-facing/Advance-causal Backstab, competitive Strategy-factory, new-arena, durable-rating, prize, staffed-moderation, new-language, TinyGo, package, hidden-information, randomness, adaptive-rule, per-Match mutation, and broad-UI experiments remain outside all active phases.

## Progress

**Execution Order:** 256 → 257 → 258 → 259 → 260 → 261

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 256. Counted Safety and Canonical Authority | 19/19 | Complete    | 2026-07-13 |
| 257. Canonical Transition Kernel and v1.4 Semantic Integrity | 16/22 | In Progress|  |
| 258. Canonical JSON, Failure Semantics, and Artifact Identity | 0/TBD | Not started | - |
| 259. Executable Four-Language and Chronicle Conformance | 0/TBD | Not started | - |
| 260. Truthful Strategy Inputs, Arena Authority, and Set Fairness | 0/TBD | Not started | - |
| 261. Integrated Service Proof, Drift Guards, and Release | 0/TBD | Not started | - |
