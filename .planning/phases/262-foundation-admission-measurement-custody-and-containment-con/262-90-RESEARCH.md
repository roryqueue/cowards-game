# Phase 262 Plan 90: Additive Retry Envelope v3 - Research

**Researched:** 2026-08-28
**Domain:** Immutable admission evidence, bounded retry control, Git/filesystem custody, and fail-closed lifecycle projection
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md and current authorization)

### Locked Decisions

#### Milestone-wide integrity charter
- **D-01:** Evidence is immutable and content-addressed. There is no mutable `latest`; a changed input, policy, implementation, or result creates a new branch with a new root.
- **D-02:** Missing, stale, incompatible, contaminated, incomplete, mismatched, or non-reproducible evidence fails closed. Process/integrity failure is distinct from a process-valid empirical failure and blocks authoritative progress.
- **D-03:** The exact selected canonical `MATCH_KERNEL` remains the only transition authority, and hostile Strategy source remains behind the supervised runtime-service / Runtime Broker boundary. No copied rules, alternate scheduler, or Strategy execution in the coordinator, web, API, or Go is permitted.
- **D-04:** Lab evidence remains private and unreachable from production registration, persistence, scheduling, Chronicle, replay, standings, and public/default surfaces. Only exact eligible pre-formation current-league source hashes may later enter ordinary certification.
- **D-05:** Every attempt, retry, rejection, invalid output, duplicate, failure, system failure, and unused allocation remains charged and visible in its proper evidence ledger; accepted evidence cannot omit inconvenient work.
- **D-06:** Cycle-cap, MOVE/reversal, Backstab geometry/timing, scan timing, arena, runtime, product/public, and combined-rule changes remain unavailable in v1.38.

#### Exact predecessor admission
- **D-07:** Authoritative v1.38 work begins only after a machine-checked join resolves the v1.37 audit, exact archive commit, annotated `v1.37` tag, independent post-tag result, and exact selected semantic/runtime authority tuple. Copied labels are not authority.
- **D-08:** The immutable v1.37 archive commit remains the release authority. Later non-semantic corrections are recorded as separate lineage and may inform current correctness checks, but they do not move, recreate, or silently reinterpret the tag or archived evidence.
- **D-09:** Any failed join, stale certificate, incompatible identity, semantic drift, or unexplained reproduction mismatch emits an explicit stop disposition back to the integrity foundation. Phase 262 must not normalize or repair the predecessor inside v1.38.
- **D-10:** Reproduce the persisted current-rules matrix's declared shape and expected results through the selected canonical kernel and supervised execution path. The audit script's `new Function` loader is historical reproduction material, not an execution mechanism to reuse. Starter and Advanced Strategies remain smoke, regression, and throughput fixtures only.

#### Frozen measurement and budget contract
- **D-11:** Before inspecting candidate output, freeze one immutable contract for the primary estimand—separately adapted formation-specific metagames under the fixed factory—and the bracket/current, inward/current, and bracket/inward contrasts. Fixed-policy transfer is explicitly secondary screening.
- **D-12:** The contract fixes complete cells, scoring, draw value, both sides, both entrant-level initiative states, semantically distinct design arenas, all splits and opponent fields, matched root-seed blocks, stopping and response admission, finalist eligibility/cardinality, portfolio selection, robust-pure selection, and permitted claims.
- **D-13:** Freeze a multi-resource opportunity vector rather than a single fungible compute scalar: attempted candidates, accepted response slots and unfilled-slot disposition, response rounds, search/teacher/distillation work, Matches, model attempts/tokens, human effort/submissions, replay review, cache policy, retries, hardware class, runtime, source, objective, memory, and output limits.
- **D-14:** Contained profile-neutral calibration spikes may refine structural work units, denominators, retry/burn rules, and starting numeric gates before search. Direct Strategy work must be distinguished from provider, orchestration, and infrastructure overhead. Candidate outcomes may not influence calibration.
- **D-15:** The activation prompt's 64 KB hard source cap, preferred under-48 KB target, below-5 ms p99 starting target, population/core/finalist counts, response thresholds, probe threshold, red-team threshold, and Advanced-library regression threshold are calibration inputs. Any replacement value and its exact denominator must be justified and frozen before candidate output is inspected.
- **D-16:** Zero accepted runtime violations, system failures, legal-information violations, private-data leaks, missing cells, duplicate/conflicting results, or unproved identity joins is a hard evidence condition. System-failed work remains charged but can never be converted into gameplay or an accepted cell.
- **D-17:** Metric code, canonicalization, normalization, denominators, replication treatment, materiality thresholds, hard versus compensating gates, classifier fixtures, response/finalist rules, and report language are hashed with the contract. A composite result cannot override a mandatory integrity or rejection gate.
- **D-18:** Reports maintain separate fields for `process_status`, current-rules outcome, formation rejection/pass, and holdout contamination. A valid empirical failure is publishable evidence; threshold softening, selective failure omission, or stronger-than-oracle-relative claims are not.

#### Holdout custody and pre-formation containment
- **D-19:** A separately permissioned custodian and private store control the holdout preimages and commitment material. The iterative experiment coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt after the authorized batch.
- **D-20:** Holdout lineage must prove that source data, training data, prompts, caches, opponent construction, and schedule construction contain no profile-conditioned or current-trained input. Custody records the named role, authorized opening actor, access/query ledger, storage identity, safe projection, contamination response, retention, and retirement.
- **D-21:** Premature access, unauthorized query, commitment mismatch, uncertain evaluator state, or disclosure outside the frozen safe projection is contamination, not a diagnostic opportunity. It follows the precommitted invalidation/reporting path and cannot be repaired with a replacement or second holdout.
- **D-22:** Precommit the literal current-edge, full-inward, and edge-anchored-bracket coordinates, unchanged inward facings, equal-compute dimensions, telemetry, causal classifiers, and hard rejection logic now. Only profile-agnostic schemas, metric code, and synthetic positive/negative/mirrored/obfuscated fixtures may exist before the valid Phase 266 current-league freeze.

#### Decision Revision: single-operator local seal (2026-08-12)
- **D-19R:** For future routing, D-19 is superseded by the operator-approved `single_operator_local_seal_v1` assurance class. One named `repository_operator` controls a restricted out-of-repository local holdout store and one closed opening command. The coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt afterward. This is process separation, not independent custody, and it makes no independent/third-party custody, separate-permissioning, non-collusion, comprehensive-host-monitoring, cryptographic-erasure, forensic-deletion, or malicious-owner-resistance claim.
- **D-20R:** For future routing, D-20 retains the profile-neutral lineage, frozen source/training/prompt/cache/opponent/schedule exclusions, tool-mediated access/query ledger, safe projection, terminal contamination, retention, and retirement requirements while naming the role `repository_operator`. Commitment-secret ingress is only `<absolute-local-seal-root>/input/commitment-secret.bin`, under owner-only `0700` ancestors as an effective-UID-owned regular non-symlink `0600` file of 32..4096 bytes. It is opened no-follow, validated, read once during commitment, zero-filled in process, unlinked, and followed by parent fsync before success; uncertainty fails closed and bytes never enter CLI, environment, logs, Git, tests, receipts, artifacts, or output.
- D-19 and D-20 remain visible above as truthful historical requirements and continue to describe the terminal Plan 262-40/42/43 branch. D-19R and D-20R supersede them only for successor Plans 262-44 through 262-48; they grant no ADMIT-03, SEAL-01, candidate-search, Phase 263, formation, holdout-opening, public, activation, or production authority.
- ADMIT-03 remains blocked and revised SEAL-01 remains pending until independently verified local-seal mechanics and one fresh literal 540/540 reproduction pass are joined exactly.

#### Decision Revision: bounded standing retry authority (2026-08-27)
- **D-23R:** The operator authorizes an additive successor retry route and supersedes the prior no-retry admission rule for future Phase 262 work. This is standing authority for the precommitted bounded retry envelope selected by research and planning; it does not require a new operator literal for each route ordinal or attempt inside that envelope.
- **D-24R:** Every prior authorization, route, calibration identity, consumption marker, terminal result, and charged allocation remains immutable, non-retryable, and non-reusable. The successor contract must use fresh versioned destinations and attempt identities, preserve cumulative accounting, and bind the exact source and policy lineage before any execution.
- **D-25R:** The retry envelope must be finite and frozen before its first live attempt. It must terminate on the first literal 540/540 accepted reproduction, any integrity or contamination failure, or exhaustion of its declared attempt/resource/time bounds. It may not soften the 200 ms sampling rule, inclusive 2,500-basis-point gate, eight-attempt/four-shard calibration allocation, conditional 540-cell reproduction, canonical runtime/kernel predicates, or any gameplay, privacy, and formation-absence bound after observing results.
- **D-26R:** The assurance class remains `single_operator_local_seal_v1`; the retry revision makes no independent-custody claim. No candidate search, Phase 263 work, formation materialization, holdout opening, public/canonical publication, activation, production, or counted-play authority exists until an independently checked successor joins a valid seal with a fresh literal 540/540 result.
- **D-27R:** The completed Plan 262-74 obstruction and all earlier route branches remain truthful archived history. The successor must be planned and reviewed additively and must not revive Plan 262-62, its obsolete review paths, or any consumed no-retry authorization bytes.

#### Decision Revision: one additional bounded envelope (2026-08-27)
- **D-28R:** After the first finite successor envelope exhausted at fresh `0/540`, the operator authorizes exactly one additional additive bounded retry envelope under the existing frozen bounds. This is a new envelope, not an extension, retry, reinterpretation, or reuse of `retry-envelope:v1` or any prior authorization, route, observation, calibration, reproduction, receipt, journal, terminal, seal, correction, or charged identity.
- **D-29R:** The new envelope inherits unchanged: at most three route starts, at most twelve preflight observations, exactly eight calibration attempts across four shards per started route, at most one conditional exact 540-cell reproduction, a four-hour lifetime from its first preflight observation, at least five minutes after a preflight refusal, at least fifteen minutes after a process-valid calibration failure, 200 ms sampling, and the inclusive 2,500-basis-point headroom gate.
- **D-30R:** Planning derives the next versioned envelope, journal, terminal, private-receipt, reproduction, source-seal, disposition, correction, lifecycle, and activation destinations from the current clean committed lineage at source commit `9e7087b34f0bd6fa12d8b265f09d4c656eb044b0`. All v1 evidence remains byte-immutable and fully charged.
- **D-31R:** The authorization expires at the first literal 540/540 accepted result, the first terminal integrity/contamination/reproduction failure, exhaustion of three route starts or twelve observations, or the four-hour deadline. It grants no third envelope and no authority to weaken, reset, reclaim, or expand any frozen bound after observing results.
- **D-32R:** `single_operator_local_seal_v1` remains the exact assurance class. No candidate, Phase 263, formation, holdout-opening, public, product, production, counted-play, gameplay-change, archive, or tag authority exists unless a fresh independently verified 540/540 result produces a new pass-only activation root.

#### Current additive authorization (2026-08-28)
- One new bounded retry route/envelope is authorized under all existing frozen bounds, revising only the exhausted no-retry admission contract.
- Preserve `retry-envelope:v1`, `retry-envelope:v2`, and all historical routes byte-immutably.
- There is no candidate, Phase 263, formation, holdout, public, production, counted-play, gameplay, archive, or tag authority unless an independently verified literal fresh `540/540` pass is produced.
- The next envelope destination is `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json`; its journal and terminal use the v3 namespace.
- The clean starting commit is `dd7536c780a4d53199a949ef0cbd95d43414a4a0c`; research verified that this literal is the exact current `HEAD`.

### the agent's Discretion
- Exact schema, module, command, storage, and typed-reason names are left to research and planning within the locked evidence and privacy boundaries.
- The exact finite retry count, scheduling window, preflight cadence, and safe autonomous backoff are left to research and planning, provided they are frozen before execution and cannot be expanded after results are observed.
- Exact budget values, materiality thresholds, classifier cutoffs, commitment primitive, encrypted-storage mechanism, and retention sampling are chosen only after the required contained Phase 262 spikes, then frozen before candidate output is inspected.
- A managed signing identity may be used if one already exists; Phase 262 must not create an ad hoc signing trust system to simulate custody.

### Deferred Ideas (OUT OF SCOPE)
- Planner and deterministic runner implementation belongs to Phase 263.
- Candidate factory, independent oracles, and quarantined intake belong to Phase 264.
- League execution and current-league freeze belong to Phases 265–266.
- Executable formation materialization, equal retraining, sealed opening, decision, certification, and release closure belong to Phases 267–270.
- Cap, MOVE, Backstab, scan-timing, arena, runtime, product, and combined-rule experiments require separately approved later work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ADMIT-03 | Reproduce the persisted current-rules audit matrix before candidate search. | The v3 chain permits credit only from an independently reconstructed literal fresh 540/540 result and pass-only Route-11 activation. [VERIFIED: `.planning/REQUIREMENTS.md`; repository route sequence] |
| ADMIT-04 | Fail closed on stale, incompatible, or drifting predecessor authority. | The source, review, seal, live, adjudication, and lifecycle joins all bind exact Git blobs, correction-v10, disposition-v2, lifecycle-v2, runtime/kernel roots, and protected history. [VERIFIED: correction-v10; Plans 84-89] |
| MEAS-02 | Keep budgets, retries, timing, hardware, runtime, and cache behavior frozen. | The v3 policy repeats the exact 3/12/4h/5m/15m/8x4/200ms/2500bp/540 limits without caller-controlled counters. [VERIFIED: D-29R; envelope-v2] |
| MEAS-04 | Accepted evidence has zero system, integrity, privacy, identity, and completeness failures. | The terminal and adjudicator keep process-valid failure, integrity failure, contamination, reproduction failure, and exact pass separate. [VERIFIED: D-02/D-16; disposition-v2] |
| MEAS-09 | Report empirical non-pass separately from assurance failure and contamination. | Disposition-v3 must publish every terminal branch; correction-v11 exists only for newly found assurance defects. [VERIFIED: Plan 88 pattern; correction-v10] |
| MEAS-10 | Preserve containment and non-authorization semantics. | The chain creates private evidence only, asserts formation/holdout/public/product paths absent, and never treats current-edge geometry as product evidence. [VERIFIED: CONTEXT; AGENTS.md] |
| SEAL-01 | Preserve the exact single-operator local-seal claim boundary. | Seal-v13 names `single_operator_local_seal_v1` and correction-v10's narrower execution assurance without claiming independent custody or hostile-same-UID resistance. [VERIFIED: CONTEXT; correction-v10] |
</phase_requirements>

## Summary

The authorized change is narrow: add one fresh, finite `retry-envelope:v3` branch after clean `HEAD` `dd7536c780a4d53199a949ef0cbd95d43414a4a0c`, while leaving the completed v1/v2 evidence, correction-v10, disposition-v2, lifecycle-v2, and every historical route byte-immutable. Correction-v10 currently records the v3 destinations as forbidden under the previously exhausted contract; the new user authorization supersedes only that admission denial for this one envelope. It does not reinterpret correction-v10's empirical `0/540`, reduced-assurance boundary, or downstream denials. [VERIFIED: Git; correction-v10; current authorization]

Plan the work as six strictly ordered plans, **262-90 through 262-95**: source/synthetic proof, independent source review, direct-child seal plus inactive envelope, one live envelope, independent adjudication, then lifecycle closeout. Use a fresh namespace (`v3` identities, source-seal-v13, reproduction-v17, disposition-v3, lifecycle-v3, Route-11 activation) so no absent historical destination becomes ambiguously reused. [VERIFIED: Plans 84-89 and Route-9/Route-10 version progression; PRESCRIPTIVE]

The old v2 state machine is the semantic baseline, but the implementation must also incorporate the post-run integrity hardening authenticated by correction-v10: retained-root coherent batch reads, exact required-leaf generation checks, absence revalidation, native no-follow/openat publication, root inode locking, installed runtime/toolchain closure authentication, disabled Git hooks/config/replacement objects, no ambient `tsx` child, and executed-checkout-byte binding to Git blobs. [VERIFIED: correction-v10; secure workspace v6; successor controller/helper v6]

**Primary recommendation:** Build a wholly additive v3 producer and independently review it before publishing one inactive envelope at the exact reserved Plan-90 path; allow only Plan 262-93 to consume it and only Plan 262-94 to issue a pass-only Route-11 activation after literal fresh 540/540 reconstruction. [PRESCRIPTIVE]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Retry policy, identities, and journal replay | Offline evidence CLI | Git/filesystem custody | Pure deterministic reducers own bounds; committed bytes and roots own authority. [VERIFIED: v2 model/controller] |
| Headroom preflight and calibration | Offline evidence CLI | OS/runtime boundary | The controller schedules bounded effects; Darwin/runtime probes remain outside game-engine logic. [VERIFIED: v2 controller] |
| Match reproduction | Supervised runtime service | Pure `MATCH_KERNEL` engine | Hostile Strategy execution stays outside web/API/Go; the canonical kernel remains transition authority. [VERIFIED: AGENTS.md; CONTEXT] |
| Seal, source review, and artifact authentication | Independent offline checker | Git/filesystem custody | Review derives exact commits, blobs, modes, batch identities, and absence rather than trusting producer narration. [VERIFIED: Plans 85/88; correction-v10] |
| Admission adjudication | Independent offline checker | Lifecycle projection | Only independent reconstruction can classify pass/non-pass and create pass-only activation. [VERIFIED: Plan 88] |
| Phase status and Phase-263 planning gate | GSD lifecycle driver | Requirements/roadmap/state | The two-stage committed-summary latch owns lifecycle mutation; live code owns none. [VERIFIED: Plan 89] |
| Product/public/formation/holdout surfaces | None in this chain | — | These surfaces remain forbidden absent later independently authorized phases. [VERIFIED: current authorization; CONTEXT] |

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: `AGENTS.md`]
- Do not place game rules in React components or execute user Strategy code in web/API/Go. [VERIFIED: `AGENTS.md`]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. The evidence controller may use OS/filesystem facilities because it is outside the engine, but it must not move those effects into the kernel. [VERIFIED: `AGENTS.md`; repository architecture]
- Do not use Node `vm` as a hostile-code boundary; validate every runtime boundary with schemas. [VERIFIED: `AGENTS.md`]
- Preserve canonical terminology and Strategy Revision immutability. [VERIFIED: `AGENTS.md`]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads. This chain creates no replay/public output. [VERIFIED: `AGENTS.md`; scope]
- Runtime validation must distinguish invalid output, timeout, forbidden capabilities, limits, Strategy failure, and system failure. [VERIFIED: `AGENTS.md`]
- Keep planning docs committed when updated. [VERIFIED: `AGENTS.md`]

## Standard Stack

### Core

| Component | Version/Identity | Purpose | Why Standard |
|---|---|---|---|
| Node.js | 24.15.0 | TypeScript evidence CLI and checkers | Installed and used by the current repository. [VERIFIED: local probe] |
| TypeScript | 6.0.3 | Exact schemas, reducers, controllers, checkers | Pinned in `package.json`; no new package is needed. [VERIFIED: `package.json`; local probe] |
| Vitest | 4.1.6 | Serialized mutation, race, crash, and branch tests | Existing Phase-262 validation standard. [VERIFIED: `package.json`; Plans 84-89] |
| `tsx` | 4.22.x dependency range | Development/test invocation only | Existing runner; correction-v10 forbids relying on an ambient pathname-launched child for evidence authority. [VERIFIED: `package.json`; correction-v10] |
| Git | 2.50.1 Apple Git-155 | Commit/tree/blob/mode/parent custody | Current evidence patterns bind exact committed bytes and isolate Git configuration. [VERIFIED: local probe; correction-v10] |
| Native Darwin helpers | current authenticated source/toolchain closure | No-follow/openat reads, flock/lockf, atomic durable publication | The hardened successor uses descriptor-relative OS primitives unavailable as a complete security boundary in ordinary path-based JS calls. [VERIFIED: successor helper v6; secure reader v6] |

### Supporting Existing Modules

| Module | Purpose | How v3 Uses It |
|---|---|---|
| `scripts/lib/v1-38-bounded-retry-envelope-v2.ts` | Frozen finite identity and replay semantics | Read-only semantic analog; do not edit or use its v2 destinations as writable state. [VERIFIED: source/Git] |
| `scripts/run-v1-38-bounded-retry-envelope-v2.ts` | Lock, durable reservation, effect ordering, recovery | Read-only behavior analog; v3 gets new writers and destinations. [VERIFIED: source/Git] |
| `scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts` | Hardened one-shot/native transaction and lifecycle exercises | Incorporate its current integrity mechanisms into the v3 implementation. [VERIFIED: correction-v9/v10 lineage] |
| `scripts/lib/v1-38-secure-workspace-path-v6.ts` and native reader v6 | Retained-root coherent manifest batch and absence revalidation | Authenticate all required and forbidden v3 paths in one bounded evidence session. [VERIFIED: correction-v10] |
| `scripts/lib/v1-38-private-native-bootstrap-v2.ts` | Private native bootstrap/toolchain authentication | Use for controlled native helper creation; do not invent a new trust system. [VERIFIED: correction-v9] |
| `scripts/lib/v1-38-current-matrix-reproduction.ts` | Supervised current-matrix adapter | Invoke unchanged runtime/kernel path only after calibration admission. [VERIFIED: Plans 84/87; AGENTS.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Fresh v3 files | Parameterize and rewrite v2 | Rejected: rewriting v2 violates byte immutability and correction custody. [VERIFIED: authorization; correction-v10] |
| Native descriptor-relative helper | Path-only Node filesystem calls | Rejected for authority: current correction lineage requires stronger retained-root and no-follow generation guarantees. [VERIFIED: correction-v10] |
| Independent adjudicator | Let live controller declare pass | Rejected: producer self-authorization breaks the established source/live/adjudication split. [VERIFIED: Plans 87-88] |

**Installation:** none. This phase must add no external package. [VERIFIED: existing stack suffices]

## Package Legitimacy Audit

No external package installation is planned, so the legitimacy gate is not applicable. [VERIFIED: prescribed stack]

## Exact Versioned Destinations and Identities

### Canonical v3 destinations

| Class | Exact destination/version | Rule |
|---|---|---|
| Model/controller/tests | `scripts/lib/v1-38-bounded-retry-envelope-v3.ts`; `scripts/run-v1-38-bounded-retry-envelope-v3.ts`; matching test | New source only; v1/v2 source stays unchanged. [PRESCRIPTIVE] |
| Source review | `.planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json` and `262-91-REVIEW.md` | Non-authorizing; exact zero findings make only Plan 92 eligible. [PRESCRIPTIVE] |
| Source seal | `.planning/artifacts/v1.38-successor-source-seal-v13.json` | Fresh successor after v12. [VERIFIED: version progression; PRESCRIPTIVE] |
| Inactive envelope | `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json` | Exact user-reserved destination, published only with seal-v13 after review. [VERIFIED: current authorization] |
| Journal/lock/private receipts | `.planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl`, `.lock`, and `v1.38-current-matrix-retry-private-v3/` | Created only by Plan 93 live execution. [PRESCRIPTIVE] |
| Terminal | `.planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json` | One terminal result for all branches. [VERIFIED: current authorization; v2 pattern] |
| Reproduction | `.planning/artifacts/v1.38-current-matrix-reproduction-v17.json` | Fresh pass candidate; do not reuse absent v16. [VERIFIED: v15→v16 progression; PRESCRIPTIVE] |
| Receipt manifest | `.planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json` | Hash/length/blob/root metadata only; no payload projection. [VERIFIED: manifest-v2 pattern] |
| Disposition | `.planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json` | Always present after independent adjudication. [PRESCRIPTIVE] |
| Additive assurance correction | `.planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json` | Present only if Plan 94 finds a new v3 assurance defect; correction-v10 always remains immutable history. [VERIFIED: additive correction progression; PRESCRIPTIVE] |
| Pass-only activation | `.planning/artifacts/v1.38-plan-262-route-11-activation-v1.json` | Present only for independently verified literal fresh 540/540 with no new correction. [VERIFIED: Route-9→Route-10 progression; PRESCRIPTIVE] |
| Lifecycle readiness/status | `.planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json`; `.planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json` | Additively supersedes lifecycle-v2 only after the committed Plan-95 summary latch. [VERIFIED: Plan 89 pattern; PRESCRIPTIVE] |

### Fresh identity lineage

- Envelope identity: `retry-envelope:v3`. [PRESCRIPTIVE]
- Route identities: `route:v3:0`, `route:v3:1`, `route:v3:2`. These are structurally distinct from historical route ordinal records such as `route:v3` and from all `route:v1:*`/`route:v2:*` identities. [VERIFIED: envelope-v2 protected identity list; PRESCRIPTIVE]
- Preflight identities: `preflight:v3:0` through `preflight:v3:11`. [PRESCRIPTIVE]
- Calibration identities: `calibration:v3:{0|1|2}:{0..7}`, exactly 24 maximum charged identities. [VERIFIED: frozen 8x4/3-route bounds; PRESCRIPTIVE]
- Reproduction identities: `reproduction:v3:0` through `reproduction:v3:539`, allocated atomically at most once. [PRESCRIPTIVE]
- Cumulative accounting keeps all v1/v2 and older route charges visible but gives them zero v3 capacity or accepted credit. [VERIFIED: D-24R; disposition-v2]

### Git lineage

1. Baseline/authorization anchor `S0` is exact clean `dd7536c780a4d53199a949ef0cbd95d43414a4a0c`. [VERIFIED: Git]
2. Plan 90 produces a future source-completion commit `S1` containing only additive v3 source/tests and its summary; record exact tree, sole parent chain from `S0`, modes, blobs, and working-byte equality. [PRESCRIPTIVE]
3. Plan 91 independently reviews committed `S1`, then its committed review/report/summary closure becomes `R1`; `R1` is not source authority and not the seal. [VERIFIED: Plan 85 pattern; PRESCRIPTIVE]
4. Plan 92 publishes exactly seal-v13 plus the Plan-90 envelope-v3 artifact in immediate-child commit `B3`, whose sole parent is `R1`; no intervening commit is allowed. [VERIFIED: Plan 86 direct-child pattern; PRESCRIPTIVE]
5. Plan 93's sole live invocation rechecks `S0/S1/R1/B3`, correction-v10, disposition-v2, lifecycle-v2, runtime/kernel, protected histories, and all destination absences before the first observation. [PRESCRIPTIVE]
6. Plan 94 independently derives the live commit and every artifact/blob/root; Plan 95 binds the committed Plan-94 disposition and then uses the two-stage summary latch. [VERIFIED: Plans 88-89; PRESCRIPTIVE]

## Architecture Patterns

### System Architecture Diagram

```text
User-authorized one-envelope exception + clean S0/dd7536
                         |
                         v
Plan 90 additive v3 source + synthetic proof (no live files)
                         |
                         v
Plan 91 independent committed-byte review
             zero findings? ---- no ---> blocked, no seal/live
                         |
                        yes
                         v
Plan 92 immediate-child B3: seal-v13 + inactive envelope-v3
                         |
                         v
Plan 93 one live invocation
  preflight -> refusal/backoff -> next bounded observation
       | admitted
       v
  8-attempt/4-shard calibration -> clean system failure/backoff -> next route
       | admitted with complete cleanup
       v
  one fresh 540-cell supervised-runtime/MATCH_KERNEL reproduction
                         |
                         v
Plan 94 independent record/receipt/Git/runtime/privacy reconstruction
       | exact 540/540 + no defect       | every other branch
       v                                v
 Route-11 activation              activation absent
 disposition-v3 pass             disposition-v3 non_pass
       |                                |
       +---------------+----------------+
                       v
Plan 95 validation/verification + committed summary latch + lifecycle-v3
       | pass only                      | non-pass
       v                                v
ADMIT-03/Phase 262 complete,        gaps_found, no lifecycle mutation,
Phase-263 planning gate only        all downstream authority denied
```

### Recommended Project Structure

```text
scripts/
├── lib/v1-38-bounded-retry-envelope-v3.ts
├── run-v1-38-bounded-retry-envelope-v3.ts
├── run-v1-38-bounded-retry-envelope-v3.test.ts
├── check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts
├── check-v1-38-plan-262-91-bounded-retry-source-review-v3.test.ts
├── check-v1-38-plan-262-94-bounded-retry-admission-v3.ts
├── check-v1-38-plan-262-94-bounded-retry-admission-v3.test.ts
├── check-v1-38-plan-262-95-lifecycle-v3.ts
└── check-v1-38-plan-262-95-lifecycle-v3.test.ts
```

### Pattern 1: Immutable reducer before effects

Derive every next identity, counter, deadline, and branch from a previous-root-linked journal. Fsync the reservation before the effect. A reserved or indeterminate identity is permanently charged and may be reconciled but never rerun or returned to capacity. [VERIFIED: v2 controller/tests]

### Pattern 2: One coherent retained-root evidence batch

Authenticate required leaves, exact bounded reads, parent generations, forbidden-path absences, and the retained root in one native-backed session; revalidate leaf and parent generations after reads. Do not combine independent path reads into a synthetic snapshot claim. [VERIFIED: correction-v10; secure reader v6]

### Pattern 3: Producer, reviewer, adjudicator, lifecycle separation

The live producer can only publish journal/private receipts/terminal and optional reproduction. It always reports downstream authority denied. The independent Plan-94 checker owns disposition and conditional Route-11 activation. The Plan-95 post-summary driver exclusively owns lifecycle projection. [VERIFIED: Plans 87-89; PRESCRIPTIVE]

### Pattern 4: Correction-aware authority join

Correction-v10 remains present and immutable as the integrity carrier for the historical evidence batch. The new authorization narrowly overrides its old v3 destination denial; it does not turn correction-v10 into a pass. Plan 94 treats only a newly discovered v3 assurance defect as correction-v11, while still binding correction-v10 as predecessor history. [VERIFIED: correction-v10; current authorization; PRESCRIPTIVE]

### Anti-Patterns to Avoid

- **Editing v1/v2 writers or artifacts:** breaks byte custody and can invalidate correction roots. Use new v3 files only. [VERIFIED: D-24R; correction-v10]
- **Calling v3 an extension of v2:** would imply reclaimed capacity. It is a separately rooted envelope with fresh identities. [VERIFIED: current authorization]
- **Reusing reproduction-v16 or Route-10:** creates ambiguity with the exhausted v2 branch. Advance to v17 and Route-11. [VERIFIED: repository progression; PRESCRIPTIVE]
- **Launching authority code through ambient `tsx` path resolution:** correction-v10 explicitly closed that assurance gap. Bind executed bytes to Git blobs and authenticated runtime/toolchain closure. [VERIFIED: correction-v10]
- **Path-only absence checks:** symlink, parent replacement, or leaf-generation races can defeat them. Use retained descriptors and post-read revalidation. [VERIFIED: correction-v10]
- **Equating clean process failure with pass:** complete-cleanup calibration failure is charged and may permit bounded continuation, but accepts zero cells. [VERIFIED: terminal-v2/disposition-v2]
- **Letting topology counts compensate for 0/540:** summary counts never satisfy ADMIT-03. [VERIFIED: lifecycle-v2]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Canonical game execution | Copied scheduler/rules loop | Existing supervised runtime plus `MATCH_KERNEL` | Prevents semantic drift and keeps hostile Strategy code outside coordinator/web/API/Go. [VERIFIED: AGENTS.md; D-03] |
| Canonical JSON/root conventions | Ad hoc serialization/hash concatenation | Existing canonical/root patterns and domain separation | Avoids key-order ambiguity and cross-domain identity collisions. [VERIFIED: repository patterns] |
| Filesystem snapshot assurance | Repeated `existsSync`/`readFileSync` checks | Secure workspace v6/native reader pattern | Retains roots, validates generations, and rechecks absence coherently. [VERIFIED: correction-v10] |
| Concurrent ownership | Application lease/reclamation | Kernel `lockf`/retained inode lock pattern | Process death releases kernel ownership; stale application leases are unsafe. [VERIFIED: v2 tests; correction-v9] |
| Durable multi-file publication | Sequential rename with optimistic cleanup | Native transaction helper pattern | Provides intent, fsync, recovery, and no-follow descriptor-relative publication. [VERIFIED: successor helper v6] |
| Source trust | Current pathname bytes | Exact Git commit/tree/blob/mode plus executed-byte manifest | Pathnames can be replaced; authority requires exact committed execution bytes. [VERIFIED: correction-v10] |

**Key insight:** the difficult part is not scheduling another attempt; it is proving that every effect and conclusion belongs to exactly one finite, reviewed, immutable envelope without borrowing trust, capacity, bytes, or authority from exhausted history. [VERIFIED: Phase-262 review/correction history]

## Exact State and Terminal Semantics

### Pre-start gate

Before any v3 observation, require clean expected Git custody, exact S0/S1/R1/B3 lineage, correction-v10 root `sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3`, disposition-v2 root `sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f`, lifecycle-v2 root `sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6`, exact v1/v2 protected-history manifests, current runtime/kernel joins, and absence of every v3 live/pass-only destination. Any mismatch blocks without consuming an observation because the envelope never safely started. [VERIFIED: current artifacts; v2 pattern; PRESCRIPTIVE]

### Preflight and calibration

1. The first durable `observe_preflight` reservation fixes the four-hour lifetime origin. Deadline comparison is inclusive at `now >= firstObservation + 14_400_000`. [VERIFIED: D-29R; v2 policy]
2. Below 2,500 basis points is refusal; equality is admitted. A refusal charges one observation and requires at least 300,000ms before another. [VERIFIED: D-29R]
3. Admission atomically charges one route and eight calibration identities across four shards before effect launch. [VERIFIED: D-29R]
4. Only a process-valid calibration system failure with authenticated complete cleanup can continue after at least 900,000ms. Unknown cleanup, identity drift, privacy leakage, contamination, or integrity error is terminal. [VERIFIED: D-02/D-16; terminal-v2]
5. Exhaust at three route starts, twelve observations, or the inclusive deadline. The new authority grants no further envelope after v3. [VERIFIED: current authorization]

### Reproduction

1. Only admitted calibration with complete cleanup may reserve the sole 540-identity v3 reproduction allocation. [VERIFIED: D-25R]
2. Every cell must be fresh; no v1/v2 cell, calibration, receipt, or accepted count can be reused. [VERIFIED: D-24R; current authorization]
3. Literal pass requires exactly 540 expected unique identities, 540 accepted, zero system/player/integrity/privacy failures, complete cleanup, and exact policy/source/runtime/kernel roots. [VERIFIED: ADMIT-03/MEAS-04]
4. Partial, duplicate, missing, unexpected, mismatched, or cleanup-uncertain reproduction is terminal and non-authorizing; no second reproduction exists. [VERIFIED: D-25R; v2 checker]

### Outcome table

| Outcome | Terminal/disposition | Correction-v11 | Reproduction/activation | Lifecycle |
|---|---|---|---|---|
| Independently verified literal fresh 540/540 | `succeeded` / `pass` | absent | reproduction-v17 and Route-11 present | Plan 95 may complete ADMIT-03/Phase 262 and permit Phase-263 planning only. [PRESCRIPTIVE] |
| Three clean calibration failures | `exhausted` / `non_pass` | absent | both absent | `gaps_found`; all downstream denied. [VERIFIED: v2 branch] |
| Twelve refusals or four-hour expiry | `exhausted` / `non_pass` | absent | both absent | `gaps_found`; all downstream denied. [VERIFIED: frozen policy; PRESCRIPTIVE] |
| Integrity/contamination/cleanup uncertainty | `terminal_failure` / `non_pass` | present if independently confirmed as assurance defect | reproduction absent or quarantined invalid; activation absent | no further work. [VERIFIED: D-02; correction pattern] |
| Reproduction not exact 540/540 | `terminal_failure` / `non_pass` | only if an assurance defect exists | no accepted reproduction; activation absent | no further retry. [VERIFIED: D-25R; current authorization] |

Even the pass activation is only a narrow Phase-263 planning gate. Candidate execution, formation materialization, holdout opening, public/product/production use, counted play, gameplay change, archive, and tag remain separately gated by later plans/phases. [VERIFIED: current authorization; CONTEXT]

## Concrete Plan Sequence

### Plan 262-90 — v3 source and synthetic proof

- Add only the v3 model/controller/tests and bind baseline `dd7536c...`, correction-v10, disposition-v2, lifecycle-v2, protected v1/v2 artifacts, exact policy, and new destinations. [PRESCRIPTIVE]
- Combine the v2 finite reducer/controller behavior with correction-v10's hardened execution and coherent-manifest patterns. [VERIFIED: implementation analogs; PRESCRIPTIVE]
- Run fake-effect, temporary-root, mutation, contention, crash, and synthetic branch tests only. Create no seal, envelope, journal, receipt, terminal, reproduction, disposition, correction, activation, or lifecycle artifact. [PRESCRIPTIVE]

### Plan 262-91 — independent non-authorizing source review

- Derive the exact committed Plan-90 source completion commit/tree/parent/modes/blobs and executed-byte/toolchain closure in owner-only disposable roots. [VERIFIED: Plan 85/correction-v10 patterns; PRESCRIPTIVE]
- Mutation-test every frozen bound, identity, Git/root join, correction/disposition/lifecycle predecessor, native helper, retained-root batch, absence, crash, privacy, and authority field. [PRESCRIPTIVE]
- Publish an immutable review pair. Exact zero findings makes only Plan 92 eligible; review never grants live authority. [PRESCRIPTIVE]

### Plan 262-92 — direct-child seal-v13 and inactive Plan-90 envelope-v3

- Require the committed Plan-91 zero-finding closure and recheck all exact source and historical roots. [PRESCRIPTIVE]
- Publish exactly two paths—seal-v13 and `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json`—in immediate-child B3. [VERIFIED: user-reserved path; Plan 86 pattern]
- Counters remain zero and every v3 live/pass-only destination remains absent. [PRESCRIPTIVE]

### Plan 262-93 — sole bounded live v3 envelope

- Invoke the exact reviewed live command once. Re-entry is permitted only to reconcile an already reserved identity after crash; it is never a new envelope. [VERIFIED: v2 controller pattern]
- Produce v3 journal/private receipts/terminal and only on exact success reproduction-v17. [PRESCRIPTIVE]
- Commit immutable outcome evidence. The producer creates no disposition, correction, activation, lifecycle, or downstream authority. [PRESCRIPTIVE]

### Plan 262-94 — independent adjudication

- Independently replay all v3 records and verify Git blobs, toolchain/runtime closure, identities, counters, time/backoff, private receipts, cleanup, runtime/kernel, privacy, protected v1/v2 history, and correction-v10. [PRESCRIPTIVE]
- Publish manifest-v3 and disposition-v3 for every branch. Publish Route-11 only for exact fresh 540/540 with zero findings. [PRESCRIPTIVE]
- Publish correction-v11 only for a newly found v3 assurance defect; never use it to erase a clean empirical non-pass or alter correction-v10. [VERIFIED: correction pattern; PRESCRIPTIVE]

### Plan 262-95 — validation, verification, and lifecycle-v3

- Refresh `262-VALIDATION.md`, `262-VERIFICATION.md`, and a lifecycle-v3 branch model from the committed Plan-94 disposition. [VERIFIED: Plan 89 pattern; PRESCRIPTIVE]
- Use the same two-stage latch: tasks publish readiness-v3 with no mutation; ordinary workflow commits Plan-95 summary; root orchestrator then authenticates both and applies lifecycle-v3. [VERIFIED: Plan 89]
- Exact pass may check ADMIT-03, complete Phase 262, and permit Phase-263 planning only. Every other branch publishes truthful `gaps_found` and performs no completion/downstream mutation. [PRESCRIPTIVE]

No UI phase is needed because this is private evidence infrastructure and the authorization forbids product/public surface changes. [VERIFIED: scope]

## Common Pitfalls

### Pitfall 1: Treating correction-v10 as if it already authorizes v3
**What goes wrong:** Its committed bytes explicitly deny the v3 destinations under the old exhausted contract. [VERIFIED: correction-v10]

**Avoidance:** Preserve it unchanged and bind the new user authorization as the narrow successor exception; do not rewrite or reinterpret the correction artifact. [PRESCRIPTIVE]

### Pitfall 2: Reusing absent v2 pass-only names
**What goes wrong:** Reproduction-v16 and Route-10 are historically associated with v2, even though absent, and reuse obscures lineage. [VERIFIED: lifecycle-v2]

**Avoidance:** Use reproduction-v17 and Route-11. [PRESCRIPTIVE]

### Pitfall 3: Copying v2 before post-run hardening
**What goes wrong:** The original runner alone does not embody correction-v10's current execution-byte, toolchain, retained-root, and generation guarantees. [VERIFIED: correction-v10]

**Avoidance:** Treat v2 as state-machine semantics and the v6/correction-v10 sources as the integrity implementation standard. [PRESCRIPTIVE]

### Pitfall 4: Incomplete source review
**What goes wrong:** Reviewing TypeScript text but not native helpers, installed closure, Git configuration, or actual executed bytes recreates closed review findings. [VERIFIED: correction-v9/v10]

**Avoidance:** Review one coherent manifest batch and bind executed checkout bytes to committed blobs. [PRESCRIPTIVE]

### Pitfall 5: Retry after uncertain cleanup
**What goes wrong:** Unknown child state is misclassified as clean system failure and a new route begins. [VERIFIED: v2 review history]

**Avoidance:** Only authenticated complete cleanup reaches the 15-minute retry edge; uncertainty is terminal. [PRESCRIPTIVE]

### Pitfall 6: Lifecycle count theater
**What goes wrong:** 76/76 plans/summaries after Plan 95 are treated as admission despite no 540/540. [VERIFIED: lifecycle-v2 pattern]

**Avoidance:** Require disposition-v3 pass, reproduction-v17, correction-v11 absence, and Route-11 activation in addition to topology. [PRESCRIPTIVE]

## Code Examples

### Fresh immutable v3 policy

```typescript
// Derived from locked D-29R/current authorization; source files remain additive.
export const RETRY_V3_POLICY = Object.freeze({
  schemaVersion: "retry-envelope:v3",
  maximumRouteStarts: 3,
  maximumPreflightObservations: 12,
  envelopeLifetimeMilliseconds: 14_400_000,
  refusalSpacingMilliseconds: 300_000,
  calibrationFailureBackoffMilliseconds: 900_000,
  calibrationAttemptsPerRoute: 8,
  calibrationShardCount: 4,
  samplingMilliseconds: 200,
  minimumEffectiveAvailableBasisPoints: 2_500,
  reproductionCellCount: 540,
  maximumReproductionRuns: 1,
  assuranceClass: "single_operator_local_seal_v1",
})
```

### Independent pass conjunction

```typescript
const passed =
  terminal.disposition === "succeeded" &&
  terminal.freshAccepted === 540 &&
  terminal.completeCleanup === true &&
  reproduction.schemaVersion === "v1.38-current-matrix-reproduction-v17" &&
  reproduction.uniqueExpectedCellCount === 540 &&
  reproduction.acceptedCellCount === 540 &&
  independentFindingCount === 0 &&
  correctionV11Status === "absent"

if (!passed) requireContainedNoFollowAbsence(ROUTE_11_ACTIVATION)
```

These examples are prescriptive derivations from repository patterns, not copied external code. [VERIFIED: v2 source/checkers]

## State of the Art

| Old approach | Current required approach | Impact |
|---|---|---|
| v2 path/controller plus independent checker | Fresh v3 state machine plus correction-v10 hardened custody/execution | Preserves semantics while closing known execution-assurance gaps. [VERIFIED: correction-v10] |
| Independent reads and final-component no-follow | Retained-root coherent batch with leaf/parent generation and absence revalidation | Prevents synthetic snapshot claims across replaceable paths. [VERIFIED: secure reader v6] |
| Ambient TypeScript child execution | Same-process/native one-shot closure with executed-byte-to-Git binding | Avoids pathname substitution and unauthenticated runtime closure. [VERIFIED: correction-v10] |
| Route-10/reproduction-v16 hypothetical pass | Route-11/reproduction-v17 fresh branch | Keeps version and route lineage unambiguous. [VERIFIED: repository sequence; PRESCRIPTIVE] |

**Deprecated/outdated for new authority:** v1/v2 mutable writers, obsolete Plan-62 review paths, Route-8 protocol, Plan-74 obstruction dispatch, and any no-retry conclusion that predates the current one-envelope authorization. They remain immutable historical evidence. [VERIFIED: CONTEXT; current authorization]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | None. Plan-critical choices are derived from the current authorization, committed repository evidence, Git, and local probes. | — | — |

## Open Questions

None require user input. Exact future commit/tree/root values cannot exist until Plans 90-95 execute; each plan must derive and freeze them from the committed predecessor rather than invent them during planning. [VERIFIED: Git custody pattern]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | v3 source/checkers | yes | 24.15.0 | none needed. [VERIFIED: local probe] |
| pnpm | test/typecheck commands | yes | 11.1.2 | none needed. [VERIFIED: local probe] |
| TypeScript | typecheck | yes | 6.0.3 | none needed. [VERIFIED: `package.json`] |
| Vitest | focused tests | yes | 4.1.6 | none needed. [VERIFIED: `package.json`] |
| Git | custody | yes | 2.50.1 Apple Git-155 | none. [VERIFIED: local probe] |
| `/usr/bin/lockf` | exclusive live owner | yes | Darwin utility | no safe in-scope fallback; block if absent. [VERIFIED: local probe] |
| Native compiler/bootstrap closure | descriptor-relative helpers | existing authenticated repository path | correction-v10-bound | fail closed; do not substitute ambient tools. [VERIFIED: correction-v10] |
| Supervised runtime/MATCH_KERNEL | conditional reproduction | existing repository path | exact roots determined at execution | fail closed on drift. [VERIFIED: v2 implementation/AGENTS.md] |

**Missing dependencies with no fallback:** none found on the current host. [VERIFIED: local probes]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.6 [VERIFIED: `package.json`] |
| Config file | repository workspace defaults; explicit focused files [VERIFIED: Plans 84-89] |
| Quick command | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1` [PRESCRIPTIVE] |
| Full phase command | Serialized v3 source, review, adjudication, lifecycle tests plus `pnpm turbo typecheck --concurrency=1` [PRESCRIPTIVE] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command/File | Exists? |
|---|---|---|---|---|
| ADMIT-03 | Exact 540 inventory and Route-11 pass-only activation | integration/mutation | Plan-94 admission-v3 tests | ❌ Wave 0 |
| ADMIT-04 | Exact S0/S1/R1/B3, correction-v10, disposition-v2, lifecycle-v2, runtime/kernel joins | integration/mutation | Plan-91 source review and Plan-94 adjudicator | ❌ Wave 0 |
| MEAS-02 | Exact v3 identities, caps, thresholds, deadlines, backoffs | unit/boundary | v3 controller tests | ❌ Wave 0 |
| MEAS-04 | Durable charging, cleanup distinction, reproduction completeness | subprocess/integration | v3 controller and adjudicator tests | ❌ Wave 0 |
| MEAS-09 | Pass, empirical non-pass, integrity, contamination, correction branches | unit/integration | Plan-94/95 tests | ❌ Wave 0 |
| MEAS-10 | Parent-contained no-follow privacy and forbidden destinations | mutation/integration | Plan-91 review and secure-reader fixtures | ❌ Wave 0 |
| SEAL-01 | Exact reduced assurance, no independent custody claim | integration | seal-v13/review/adjudication tests | ❌ Wave 0 |

### Required behavioral matrix

- Boundaries: 2,499 refusal; 2,500 admission; exact 300,000ms/900,000ms spacing; inclusive 14,400,000ms deadline; 3/12/24/540 caps. [VERIFIED: frozen contract]
- Identity mutations: every v1/v2/v3 swap, reuse, duplicate, missing, out-of-order, or prior-root break. [PRESCRIPTIVE]
- Crash boundaries: root lock, reservation fsync, receipt fsync, reproduction publication, terminal publication, and recovery after SIGKILL. [VERIFIED: v2 pattern; PRESCRIPTIVE]
- Filesystem attacks: required/forbidden leaf symlink, directory, FIFO, parent replacement, reader/helper replacement, generation drift, escaped parent, and concurrent absence creation. [VERIFIED: correction-v10 findings; PRESCRIPTIVE]
- Git/toolchain attacks: hooks, global/system config, replacement objects, altered checkout bytes, altered installed closure, ambient runner, and native helper substitution. [VERIFIED: correction-v10; PRESCRIPTIVE]
- Reproduction attacks: 0..539 and 541 accepted, duplicate, missing, unexpected, mismatched root, partial publish, privacy marker, player/system failure, and cleanup uncertainty. [PRESCRIPTIVE]
- Lifecycle branches: exact pass; clean exhaustion; integrity; contamination; reproducibility failure; correction-v11 present; Route-11 missing; Route-11 injected on non-pass. [VERIFIED: Plan-89 pattern; PRESCRIPTIVE]

### Sampling Rate

- **Per task commit:** the focused serialized test for the file under change. [VERIFIED: repository pattern]
- **Per plan merge:** source plus that plan's independent checker tests, typecheck, formatting, and exact destination snapshot. [PRESCRIPTIVE]
- **Phase gate:** all v3 suites serialized, read-only canonical artifact checks, privacy scan, validation, verification, and lifecycle final check. [PRESCRIPTIVE]

### Wave 0 Gaps

- [ ] `scripts/run-v1-38-bounded-retry-envelope-v3.test.ts`
- [ ] `scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.test.ts`
- [ ] `scripts/check-v1-38-plan-262-94-bounded-retry-admission-v3.test.ts`
- [ ] `scripts/check-v1-38-plan-262-95-lifecycle-v3.test.ts`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---:|---|
| Authentication / Session Management | no | No web user/session surface is added. [VERIFIED: phase scope] |
| Access Control | yes | Owner-only private roots, exact modes, retained descriptors, kernel locks, no downstream authority. [VERIFIED: correction-v10] |
| Validation / File Handling | yes | Exact schemas/keys/enums/counts, bounded reads, regular-file/no-follow checks, parent generation validation. [CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/] |
| Cryptography / Integrity | yes | Existing SHA-256/domain-separated roots and authenticated native/toolchain closure; no ad hoc signing. [VERIFIED: repository; CONTEXT] |
| Data Protection | yes | Private receipt payloads remain owner-only; public-safe artifacts expose hashes/counts/roots only. [CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/] |
| Malicious Code / Business Logic | yes | Hostile Strategy execution remains supervised; exact pass gates cannot be bypassed by topology or producer claims. [VERIFIED: AGENTS.md; lifecycle-v2] |

### Known Threat Patterns for the Stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Substituted source/authorization history | Spoofing | Exact S0/S1/R1/B3 commit/tree/parent/blob joins. [PRESCRIPTIVE] |
| Reused v1/v2 identity or capacity | Tampering/repudiation | Fresh v3 namespace and cumulative non-fungible manifests. [VERIFIED: D-24R] |
| Symlink, parent, or generation replacement | Tampering/disclosure | Retained-root `openat`/`fstatat`/`O_NOFOLLOW`, exact bounded reads, post-read revalidation. [VERIFIED: correction-v10] |
| Competing live owner | Elevation/repudiation | Kernel lock plus retained root inode flock; no application lease reclamation. [VERIFIED: correction-v9/v10 lineage] |
| Ambient runner/toolchain substitution | Tampering | Authenticated installed closure, isolated Git config, native one-shot execution, executed-byte manifest. [VERIFIED: correction-v10] |
| Private receipt leakage | Information disclosure | `0700` directory, `0600` regular receipts, no payload projection, privacy marker scans. [VERIFIED: Plan 88] |
| Producer-created activation | Elevation | Plan-94 independent checker exclusively owns Route-11. [PRESCRIPTIVE] |
| Correction used to rewrite outcome | Repudiation | Additive correction-v11 only; live bytes and correction-v10 remain immutable. [VERIFIED: correction chain]

## Sources

### Primary (HIGH confidence)

- `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and `262-CONTEXT.md` — project, phase, requirement, and locked boundary authority. [VERIFIED: committed files]
- `262-84-RESEARCH.md` and Plans/Summaries 262-84 through 262-89 — exact v2 source/review/seal/live/adjudication/lifecycle pattern and observed clean exhaustion. [VERIFIED: committed files]
- `.planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json`, terminal-v2, disposition-v2, lifecycle-v2, and correction-v10 — current roots, counters, policy, assurance, and denial state. [VERIFIED: committed artifacts]
- v2 controller/checkers/tests — identity, journal, recovery, adjudication, and lifecycle behavior. [VERIFIED: committed source]
- secure workspace/native reader v6, successor controller/helper v6, private native bootstrap, and correction-v10 checker — current integrity hardening analogs. [VERIFIED: committed source and correction artifacts]
- Git `HEAD` `dd7536c780a4d53199a949ef0cbd95d43414a4a0c` — exact clean baseline. [VERIFIED: Git]

### Secondary (MEDIUM confidence)

- OWASP ASVS Developer Guide — security category taxonomy used to structure the security review. [CITED: https://devguide.owasp.org/en/03-requirements/05-asvs/]

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — installed versions and package pins were locally verified. [VERIFIED: local/package]
- Architecture: HIGH — directly derived from committed v2 and correction-v10 patterns. [VERIFIED: repository]
- Identifiers/plan chain: HIGH — follows explicit reserved v3 path and monotonic repository versions/route ordinals. [VERIFIED: current authorization/repository; PRESCRIPTIVE]
- Pitfalls: HIGH — each maps to a closed review finding or locked immutability rule. [VERIFIED: review/correction chain]
- Live empirical outcome: UNKNOWN by design — this research performs no live work and makes no pass prediction. [VERIFIED: task boundary]

**Research date:** 2026-08-28

**Valid until:** any change to baseline `dd7536c...`, current authorization, correction-v10, disposition-v2, lifecycle-v2, protected v1/v2 bytes, frozen policy, runtime/kernel roots, or assurance class.

## Research Recommendation

Proceed with Plans **262-90 through 262-95** in strict order. Plan 90 is source/synthetic only; Plan 91 independently reviews committed bytes; Plan 92 publishes the exact direct-child seal-v13 plus the reserved Plan-90 inactive envelope-v3; Plan 93 alone may consume the finite live authority; Plan 94 independently publishes disposition-v3 and owns pass-only reproduction-v17/Route-11 admission; Plan 95 applies the two-stage lifecycle-v3 closeout. Any result other than an independently verified literal fresh 540/540 preserves ADMIT-03 blocked, records `gaps_found`, and grants no further retry or downstream authority. [PRESCRIPTIVE from current authorization and repository evidence]
