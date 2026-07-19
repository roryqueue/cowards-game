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
- [x] **Phase 257: Canonical Transition Kernel and v1.4 Semantic Integrity** - Make one validated kernel authoritative and close every confirmed rules-lifecycle defect without changing valid v1.4 behavior. (completed 2026-07-13)
- [x] **Phase 258: Canonical JSON, Failure Semantics, and Artifact Identity** - Define a bounded language-neutral ABI with exact identity and atomic three-way failure behavior. (completed 2026-07-16)
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

**Plans:** 22/22 plans executed

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

- [x] 257-16-PLAN.md — Stage candidate-tuple TypeScript persistence admission and rollback after the runtime producer exists.
- [x] 257-17-PLAN.md — Stage candidate-tuple semantic validation and rollback parity in Go after the candidate runtime-service producer exists.

**Wave 10 — indivisible current activation**

- [x] 257-19-PLAN.md — Atomically activate tuple, contracts, artifacts, receipts, event coverage, callers, and retired definitions after the full compatibility gate.

**Wave 11 — structural and audit convergence**

- [x] 257-20-PLAN.md — Replace known debt with structural negatives and persist the exact audit delta.

**Wave 12 — browser realism and privacy**

- [x] 257-21-PLAN.md — Prove canonical board realism, terminal agreement, and public privacy in the root Playwright matrix.

**Wave 13 — final evaluator and default boundary chain**

- [x] 257-22-PLAN.md — Persist deterministic Phase-257 proof and wire it into the serialized default boundary chain.

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

**Plans:** 14 plans

**Wave 1 — calibration and contract freeze**

- [x] 258-01-PLAN.md — Calibrate and freeze exact JSON, budget, ownership, version, and identity limits.

**Wave 2 — shared raw corpus**

- [x] 258-02-PLAN.md — Generate the byte-exact positive/negative corpus and named TypeScript/Go RED consumers.

**Wave 3 — bounded scanner/parser subsets with expected RED**

- [x] 258-03-PLAN.md — Implement the iterative raw scanner/parser with typed bounded failures.

**Wave 4 — complete TypeScript codec and retire its RED**

- [x] 258-04-PLAN.md — Implement canonical encoding, domain-framed hashes, and the identity manifest.

**Wave 5 — ABI ownership**

- [x] 258-06-PLAN.md — Define the exclusive three-way invocation ABI and adapter-owned envelope.

**Wave 6 — bounded boundary integration**

- [x] 258-05-PLAN.md — Integrate bounded JSON into the Plan-06 spec/service boundary and permanent deep audit.

**Wave 7 — transition ownership**

- [x] 258-07-PLAN.md — Enforce engine-only penalties, no-mutation system failure, and identical system retry.

**Wave 8 — language adapters and exact source persistence**

- [x] 258-08-PLAN.md — Migrate TypeScript worker/subprocess/container paths to the common raw ABI.
- [x] 258-09-PLAN.md — Migrate Python and preserve original-versus-normalized source identity.
- [x] 258-10-PLAN.md — Migrate Rust/Zig/WASM with host-owned envelopes and exact toolchain/settings identity.

**Wave 9 — Go and persistence**

- [x] 258-11-PLAN.md — Prove Go canonical parity, signed retry binding, rollback, and no mutation.

**Wave 10 — exact budget posture**

- [x] 258-12-PLAN.md — Enforce runtime/preflight ledgers and publish fail-closed cross-lane capabilities.

**Wave 11 — evidence graph and successor receipt**

- [x] 258-13-PLAN.md — Close the identity DAG and mint v1.17 while preserving immutable v1.16 dispatch.

**Wave 12 — preactivation, small atomic flip, then final proof**

- [x] 258-14-PLAN.md — Prepare exact candidates/tests, atomically flip the small default set, then generate final hashes and service-backed proof.

**Cross-cutting constraints:** no host JSON conversion before raw duplicate/limit checks; no adapter or transport gameplay penalties; no mutation on system failure; no manufactured legacy source bytes; no false resource-meter equivalence; no v1.16 serializer rewrite; no production trusted producer before Phase 259.

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

**Plans:** 31 plans in 10 waves

**Wave 1 — immutable inputs and protected baseline**

- [x] 259-01-PLAN.md — Freeze the mandatory executable corpus and audited four-language fixtures.
- [x] 259-02-PLAN.md — Record the canonical transition stream for trace and reconstruction proof.
- [x] 259-05-PLAN.md — Replace the singleton Chronicle cursor with per-activation-slot lifecycle state.
- [x] 259-06-PLAN.md — Freeze immutable v1.4 Chronicle interpretation and explicit historical dispatch.
- [x] 259-07-PLAN.md — Define fail-closed per-lane conformance certificates.
- [x] 259-24-PLAN.md — Define additive v1.18 budget, ABI, and evidence policy.
- [x] 259-29-PLAN.md — Capture the exact protected working-tree baseline.

**Wave 2 — trace, Chronicle semantics, identity, and supervisor protocol**

- [x] 259-03-PLAN.md — Install the language-neutral full-trace oracle and safe divergence contract.
- [x] 259-08-PLAN.md — Make Chronicle admission version-strict, per-slot, and semantic.
- [x] 259-09-PLAN.md — Join Phase-259 certificates to the Phase-258 identity DAG.
- [x] 259-25-PLAN.md — Create the package-free shared supervisor protocol and verifier.

**Wave 3 — review gates, service API, workspace wiring, and native meter**

- [x] 259-04-PLAN.md — Separate golden candidates, semantic diffs, and independent review.
- [x] 259-14-PLAN.md — Prove transition-by-transition reconstruction equality and historical compatibility.
- [x] 259-26-PLAN.md — Build the pinned Linux cgroup-v2 native supervisor and hardened Docker delegation path.
- [x] 259-31-PLAN.md — Wire counted runtime packages to public supervisor/spec workspace boundaries.

**Wave 4 — real language adapters and authenticated service receipt**

- [x] 259-10-PLAN.md — Make supervised subprocess execution the sole counted TypeScript path.
- [x] 259-11-PLAN.md — Run Python under the same quantitative and failure-safe boundary.
- [x] 259-12-PLAN.md — Run real Rust and Zig artifacts under the common supervisor.
- [x] 259-15-PLAN.md — Create the additive Chronicle/certificate-bound service receipt.
- [x] 259-27-PLAN.md — Apply the compatibility gate to reviewed golden candidates.

**Wave 5 — all-lane differential execution and public spec contract**

- [x] 259-13-PLAN.md — Execute the complete corpus through all four real adapters.
- [x] 259-30-PLAN.md — Publish the v1.18 service/receipt contract as the sole public spec API.

**Wave 6 — certificate production and shared semantic admission**

- [x] 259-16-PLAN.md — Produce fresh-process certificates for all four real languages.
- [x] 259-17-PLAN.md — Require Chronicle semantics and reconstruction at runtime-service success.
- [x] 259-18-PLAN.md — Require the same evidence for durable Match completion.

**Wave 7 — evidence ledger and independent Go verification**

- [x] 259-19-PLAN.md — Extend the append-only evidence ledger and publisher.
- [x] 259-20-PLAN.md — Add independent Go v1.18 receipt verification.

**Wave 8 — Go completion authority and import trust bootstrap**

- [x] 259-21-PLAN.md — Route Go completion through authenticated shared semantic admission.
- [x] 259-28-PLAN.md — Bootstrap the existing plural operator import trust roots.

**Wave 9 — managed signing and reviewed trust activation**

- [x] 259-22-PLAN.md — Sign, verify, import, and promote artifact-derived certificates.

**Wave 10 — integrated conformance closure**

- [x] 259-23-PLAN.md — Close CONF-01..05 and CHRN-01..06 with one exact executable proof.

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

**Plans:** 47/49 plans executed

**Wave 1 — immutable semantic authorities**

- [x] 260-01-PLAN.md — Freeze the successor observation ABI, arena catalog, and four-condition Set policy.

**Wave 2 *(blocked on Wave 1 completion)* — inactive tuple and selector registration**

- [x] 260-02-PLAN.md — Register the complete inactive successor tuple and compact TypeScript selector.

**Wave 3 *(blocked on Wave 2 completion)* — data projections and persistence substrate**

- [x] 260-04-PLAN.md — Add the historical-safe arena, condition, and revision-evidence database substrate.
- [x] 260-16-PLAN.md — Generate the candidate Go authority and Phase-259-preserving current selector.
- [x] 260-17-PLAN.md — Stage public spec and map-config candidate dispatch without current behavior change.

**Wave 4 *(blocked on Wave 3 completion)* — pure kernel observations**

- [x] 260-03-PLAN.md — Derive initiative and pre-Action Advance observation from kernel state under successor dispatch.

**Wave 5 *(blocked on Wave 4 completion)* — candidate scheduling and runtime transport**

- [x] 260-05-PLAN.md — Stage the TypeScript four-condition scheduler candidate.
- [x] 260-06-PLAN.md — Stage the generated-authority Go scheduler candidate.
- [x] 260-10-PLAN.md — Transport the v1.19 observation contract through all runtime lanes.

**Wave 6 *(blocked on Wave 5 completion)* — completion, replay, corpus, public contract, and revalidation service**

- [x] 260-07-PLAN.md — Stage exact TypeScript completion, retry, status, and scoring.
- [x] 260-08-PLAN.md — Stage exact Go completion, retry, status, and scoring.
- [x] 260-09-PLAN.md — Stage candidate replay recording and validation.
- [x] 260-11-PLAN.md — Create and independently review the pinned corpus-v3 candidate.
- [x] 260-18-PLAN.md — Stage pinned v1.19 Workshop and SDK examples without changing defaults.
- [x] 260-23-PLAN.md — Stage the privacy-safe public result contract candidate.
- [x] 260-26-PLAN.md — Build revision-specific real v1.19 revalidation service.

**Wave 7 *(blocked on Wave 6 completion)* — trace review and mechanical rendering**

- [x] 260-12-PLAN.md — Generate and independently review the fixed-schema trace-v4 candidate.
- [x] 260-24-PLAN.md — Stage mechanical replay/result rendering without UI authority.

**Wave 8 *(blocked on Wave 7 completion)* — real lane execution and permanent ownership guard**

- [x] 260-19-PLAN.md — Run and inventory twelve fresh real-language candidate executions.
- [x] 260-25-PLAN.md — Install permanent no-execution and no-semantic-derivation monitors.

**Wave 9 *(blocked on Wave 8 completion)* — certificates and revision inventory proof**

- [x] 260-13-PLAN.md — Verify, sign, and import four inactive successor certificates.
- [x] 260-20-PLAN.md — Execute D-04 revalidation over the frozen Strategy Revision inventory.

**Wave 10 *(blocked on Wave 9 completion)* — complete preactivation proof**

- [x] 260-21-PLAN.md — Prove successor readiness while every Phase-259 current selector remains exact.

**Wave 11 *(blocked on Wave 10 completion)* — postactivation evaluator preparation**

- [x] 260-22-PLAN.md — Prepare the distinct full activated-state and rollback evaluator.

**Wave 12 *(blocked on Wave 11 completion)* — authority inversion and generator decoupling**

- [x] 260-27-PLAN.md — Make the compact source the sole current authority and decouple current Go projection from candidate evidence.

**Wave 13 *(blocked on Wave 12 completion)* — transactional database selection head**

- [x] 260-28-PLAN.md — Add one complete serializable semantic-authority selection-head row.

**Wave 14 *(blocked on Wave 13 completion)* — default-consumer delegation**

- [x] 260-29-PLAN.md — Delegate TypeScript runtime and Workshop defaults while keeping runtime-service database-free.
- [x] 260-30-PLAN.md — Delegate Go scheduling/completion to the compact selector and database head.
- [x] 260-32-PLAN.md — Enforce the active database head across every TypeScript scheduling and competition entry point.

**Wave 15 *(blocked on Wave 14 completion)* — corrected proof inventory**

- [x] 260-31-PLAN.md — Rebuild pre/postactivation evaluators around five selector files and one database head.

**Wave 16 *(blocked on Wave 15 completion)* — bounded active-review admission repair**

- [x] 260-34-PLAN.md — Admit only exact reviewed v2/v3 corpus evidence and make the isolated auditor package-manager inert.

**Wave 17 *(blocked on Wave 16 completion)* — closed-version fixture completeness**

- [x] 260-35-PLAN.md — Complete shared observation fixtures for exact v1.17 stripping and v1.19 retention.

**Wave 18 *(blocked on Wave 17 completion)* — cache-inert isolated gate**

- [x] 260-36-PLAN.md — Disable Vitest cache writes without weakening complete dependency mutation detection.

**Wave 19 *(blocked on Wave 18 completion)* — selector-independent immutable identities**

- [x] 260-37-PLAN.md — Recheck v3 from immutable v2 and bind historical fixture runtime requests to exact v1.17.

**Wave 20 *(blocked on Wave 19 completion)* — exact runtime-input projection**

- [x] 260-38-PLAN.md — Resolve explicit historical and successor observations from their addressed runtime ABI.

**Wave 21 *(blocked on Wave 20 completion)* — exact recorder identity admission**

- [x] 260-39-PLAN.md — Admit exact v1.17/v1.19 recorder identities independently of current selection.

**Wave 22 *(blocked on Wave 21 completion)* — bounded readiness-evidence repair**

- [x] 260-40-PLAN.md — Refresh the approved released-v1.17 source pin and make preactivation gate receipts tamper-evident.

**Wave 23 *(blocked on Wave 22 completion)* — derived boundary and evidence-chain refresh**

- [x] 260-41-PLAN.md — Repair candidate lifecycle classification, refresh the TypeScript backend overlay, and close the masked current-event evidence chain without semantic drift.

**Wave 24 *(blocked on Wave 23 completion)* — isolated seam audit and refreshed readiness**

- [x] 260-33-PLAN.md — Prove zero stale seams and regenerate the exact preactivation proof.

**Wave 25 *(blocked on Wave 24 completion)* — bounded candidate-gate compatibility repair**

- [x] 260-42-PLAN.md — Repair stale historical/current spec assertions, expand the seam inventory, and re-prove readiness without production changes.

**Wave 26 *(blocked on Wave 25 completion)* — selector-independent Go parity generation**

- [x] 260-43-PLAN.md — Pin immutable Go parity Chronicle generation to explicit v1.17 dispatch and extend readiness coverage.

**Wave 27 *(blocked on Wave 26 completion)* — deterministic activation-gate timing**

- [x] 260-44-PLAN.md — Give the cryptographic receipt/deep-clone persistence assertion its established bounded integration-test timeout.

**Wave 28 *(blocked on Wave 27 completion)* — deterministic queued-job eligibility time**

- [x] 260-45-PLAN.md — Derive the PostgreSQL claim time from the persisted job `run_after` rather than an earlier wall-clock sample.

**Wave 29 *(blocked on Wave 28 completion)* — clone-local activation dependencies**

- [x] 260-46-PLAN.md — Materialize candidate dependency trees so workspace packages resolve the candidate selectors, and add the runtime-service oracle as the ninth selector seam.

**Wave 30 *(blocked on Wave 29 completion)* — selected-current engine facade repair**

- [x] 260-47-PLAN.md — Align unversioned current engine construction/dispatch with v1.19 while retaining explicit immutable v1.4 evidence.

**Wave 31 *(blocked on Wave 30 completion)* — selected-current persistence test repair**

- [x] 260-48-PLAN.md — Make persistence and replay explicit about historical v1.17 versus selected-current v1.19 semantics.

**Wave 32 *(blocked on Wave 31 completion)* — selected-current runtime-service repair**

- [x] 260-49-PLAN.md — Separate immutable v1.17 service requests from selected-v1.19 defaults and exact successor Chronicle authority.

**Wave 33 *(blocked on Wave 32 completion)* — atomic activation**

- [x] 260-14-PLAN.md — Activate five selector files and one transactional database selection head in one proved commit.

**Wave 34 *(blocked on Wave 33 completion)* — integrated closure**

- [ ] 260-15-PLAN.md — Close Phase 260 with one executable proof and permanent drift monitors.

**Cross-cutting constraints:** all preactivation work is versioned candidate-only; Phase-259 current selectors, corpus/trace pins, Workshop defaults, certificates, and historical evidence remain exact until the single activation commit; initiative and Advance observations are kernel-owned; Set fairness is explicit four-condition identity rather than seed parsing; no valid v1.4 gameplay, official geometry, Strategy execution ownership, or public privacy boundary changes.

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
| 257. Canonical Transition Kernel and v1.4 Semantic Integrity | 22/22 | Complete | 2026-07-13 |
| 258. Canonical JSON, Failure Semantics, and Artifact Identity | 14/14 | Complete | 2026-07-16 |
| 259. Executable Four-Language and Chronicle Conformance | 31/31 | Complete | 2026-07-16 |
| 260. Truthful Strategy Inputs, Arena Authority, and Set Fairness | 48/49 | In Progress|  |
| 261. Integrated Service Proof, Drift Guards, and Release | 0/TBD | Not started | - |
