# Phase 262 Plan 84: Additional Bounded Retry Envelope - Research

**Researched:** 2026-08-27

**Domain:** Additive, crash-safe, correction-aware empirical admission retry

**Confidence:** HIGH for repository facts and prescribed design; no external packages or services are introduced

<user_constraints>
## User Constraints (from CONTEXT.md)

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

## Summary

The authorized work should be implemented as a wholly additive `retry-envelope:v2`, not by editing, resetting, or parameterizing the exhausted v1 evidence path. The current post-run correction authenticates the historical v1 source blobs, journal, terminal, 15 private receipts, seal, envelope, Plan-80 disposition, and review lineage; changing the historical v1 source files would break that custody join. [VERIFIED: Git and `v1.38-plan-262-post-run-audit-correction-v2.json`]

The correct lineage has two separate joins. First, source base `9e7087b34f0bd6fa12d8b265f09d4c656eb044b0` is the sole parent of operator-authorization commit `453a33a10c247fb9c75e969ed4ab63646b16b488`. Second, after v2 source and an independent non-authorizing review are committed, the seal/envelope publication commit must be the direct child of that completed reviewed-source head. The seal must record both joins rather than treating the authorization commit as the reviewed-source parent. [VERIFIED: Git]

The existing v1 controller supplies the proven behavioral pattern: durable journal reservation before work, per-record fsync, private receipt reconciliation, `lockf` kernel ownership, crash recovery, no identity reuse, exact success publication recovery, no-follow final-component reads, and branch-safe terminal publication. The v2 implementation should reproduce these properties in new files and fresh destinations while strengthening absence checks to include parent-path containment. [VERIFIED: codebase grep and focused tests]

**Primary recommendation:** Plan an additive six-plan chain, Plans 262-84 through 262-89: v2 source and synthetic tests; independent source review; direct-child seal and inactive envelope; one live envelope; independent admission disposition; then lifecycle/validation/verification closeout. [VERIFIED: current Plan 75-83 lifecycle pattern]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; this retry controller must remain outside engine logic. [VERIFIED: `AGENTS.md`]
- Do not put game rules in React and do not execute Strategy code in web/API/Go. [VERIFIED: `AGENTS.md`]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. Controller timing/filesystem work is offline orchestration, not engine logic. [VERIFIED: `AGENTS.md`]
- Do not use Node `vm` as a security boundary; hostile Strategy execution remains supervised behind the runtime-service boundary. [VERIFIED: `AGENTS.md`]
- Validate runtime boundaries with schemas and preserve canonical terminology. [VERIFIED: `AGENTS.md`]
- Strategy Revisions remain immutable and public replay output remains private-data safe. [VERIFIED: `AGENTS.md`]
- Runtime changes require invalid-output, timeout, forbidden-capability, size-limit, schema, and system-failure distinctions; worker tests must distinguish Strategy failure from system failure. [VERIFIED: `AGENTS.md`]
- Keep planning documents committed. [VERIFIED: `AGENTS.md`]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ADMIT-03 | Reproduce the persisted current-rules audit matrix before candidate search; Starter/Advanced remain fixtures only. | Exact 540/540 pass gate and pass-only activation; all other outcomes remain blocked. [VERIFIED: `REQUIREMENTS.md`] |
| ADMIT-04 | Missing, stale, incompatible, or drifting predecessor authority fails closed without repair inside v1.38. | Git/blob custody over source base, authorization, reviewed source, v1 history, and v2 artifacts. [VERIFIED: `REQUIREMENTS.md`] |
| MEAS-02 | Freeze retries, hardware/runtime limits, and named resource units. | Exact inherited envelope limits and immutable v2 identities. [VERIFIED: `REQUIREMENTS.md`] |
| MEAS-04 | Zero runtime/integrity/privacy failures in accepted evidence; system failures stay charged. | Durable reservation, full charging, cleanup truth, and terminal failure logic. [VERIFIED: `REQUIREMENTS.md`] |
| MEAS-09 | Keep process, empirical, formation, and contamination outcomes distinct; no post-result softening. | Typed pass/non-pass/terminal-failure/lifecycle dispositions. [VERIFIED: `REQUIREMENTS.md`] |
| MEAS-10 | Preserve precommitted protocol, equal-compute, local seal, safe receipt, contamination, and non-authorization semantics. | Correction-aware protected history and zero formation/holdout/product reachability. [VERIFIED: `REQUIREMENTS.md`] |
| SEAL-01 | Use only `single_operator_local_seal_v1` with explicit reduced-assurance claims. | Seal binds the existing checked local-seal verification root and claims no independent custody. [VERIFIED: `REQUIREMENTS.md`] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Envelope state machine | Offline operator CLI | Immutable artifact model | The controller owns timing and orchestration; the pure model derives state from records. [VERIFIED: v1 source] |
| Strategy execution | Runtime service / Runtime Broker | Canonical `MATCH_KERNEL` | The CLI delegates and never evaluates hostile Strategy source itself. [VERIFIED: v1 source and CONTEXT D-03] |
| Evidence custody | Git + content-addressed artifacts | Owner-only private receipts | Git authenticates committed bytes; private receipts mirror durable journal records. [VERIFIED: correction v2 and receipt manifest] |
| Concurrency ownership | Darwin kernel `lockf` | Controller process | Kernel-held advisory ownership avoids stale-file takeover races and releases on process death. [VERIFIED: code review and tests] |
| Admission decision | Independent post-run checker | Lifecycle driver | The controller cannot authorize its own outcome; only the checked 540/540 conjunction may produce activation. [VERIFIED: Plans 80-81] |
| Product/public surfaces | None | Denial checks only | The envelope is private admission infrastructure and must create no product reachability. [VERIFIED: CONTEXT D-04/D-32R] |

## Established Baseline and Lineage

| Item | Required v2 treatment |
|---|---|
| Source base | Bind commit `9e7087b34f0bd6fa12d8b265f09d4c656eb044b0`, tree `98e633df3870c944adaa9c5dc553a6df367da354`. [VERIFIED: Git] |
| Authorization | Bind commit `453a33a10c247fb9c75e969ed4ab63646b16b488`, tree `32626e7f24b7262e461cb1e12c3efb691dbb5739`, sole parent `9e7087b3...`, and the exact D-28R..D-32R bytes. [VERIFIED: Git] |
| Historical envelope | Preserve envelope root `sha256:229c1c3e33ee055448b4b8ac7dc2bb53efd84774416d51d984044b2a7f35f153` and file SHA-256 `3683a02d...d9f4`. [VERIFIED: v1 envelope/correction] |
| Historical run | Preserve journal SHA-256 `14e66af5...7a14`, terminal SHA-256 `b79dc330...8ac3`, 15-receipt manifest root `sha256:cbafd7aa...a4b7`, 3 starts, 24 calibration charges, and 0/540. [VERIFIED: receipt manifest/terminal/correction] |
| Effective historical assurance | Bind correction-v2 root `sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026`; it supersedes the old clean conclusion with `integrity_non_pass` without changing historical bytes. [VERIFIED: correction v2] |
| Current lifecycle | Bind lifecycle status root `sha256:3b13e8656208643f4ce339bdab2f29bf56e38b00938afd49cfbc88164595a8b0`, Phase 262 incomplete, Phase 263 denied. [VERIFIED: lifecycle status v1] |
| Pass-only historical paths | Require reproduction-v15 and Route-9 activation to remain absent using no-follow, parent-contained checks. [VERIFIED: current lifecycle/correction tests] |

The protected-history root for v2 must be newly derived over exact Git blobs and canonical roots, not copied from the old v1 envelope. It must include every v1 seal/envelope/journal/terminal/private-receipt/disposition/correction/lifecycle artifact and every earlier charged identity. The old Plan-83 zero-finding artifact is historical only because correction v2 records the strengthened effective review as blocked with 13 findings. [VERIFIED: correction v2]

## Standard Stack

### Core

| Tool/library | Version | Purpose | Why standard here |
|---|---:|---|---|
| Node.js | 24.15.0 | TypeScript CLI process, filesystem, subprocess control | Existing repository runtime. [VERIFIED: local command] |
| TypeScript | 6.0.3 | Typed envelope, journal, and checker contracts | Existing repository compiler. [VERIFIED: local package] |
| tsx | 4.22.0 | Execute TypeScript checkers and controller | Existing repository runner. [VERIFIED: local package] |
| Vitest | 4.1.6 | Focused deterministic and subprocess tests | Existing Phase-262 test framework. [VERIFIED: local package and VALIDATION] |
| Git | 2.50.1 Apple Git-155 | Commit/tree/blob/parent custody | Existing evidence authority mechanism. [VERIFIED: local command] |
| `/usr/bin/lockf` | Darwin system utility | Kernel-owned single-controller exclusion | Already used and race-tested by v1. [VERIFIED: local command, code review] |
| Node built-ins | current Node runtime | `crypto`, `fs`, `child_process`, `path`, `os` | No new dependency is needed. [VERIFIED: v1 imports] |

### Supporting

| Component | Purpose | Use |
|---|---|---|
| Existing canonical matrix adapter | Exactly eight-attempt/four-shard calibration and conditional 540-cell run | Invoke unchanged behind v2 effects. [VERIFIED: v1 source] |
| Existing local-seal verification v3 | Bind `single_operator_local_seal_v1` assurance | Read-only seal prerequisite; do not open the holdout. [VERIFIED: v1 seal] |
| Canonical JSON/domain-separated SHA-256 | Stable artifact and journal roots | Use in all v2 schemas and manifests. [VERIFIED: v1 source] |

**Installation:** none. No package, database, service, signing system, or external custody mechanism should be added. [VERIFIED: task boundary]

## Package Legitimacy Audit

Not applicable. The recommended implementation installs no external package and uses only already-installed repository tooling plus Node/Darwin system facilities. [VERIFIED: repository and environment audit]

## Recommended Fresh Namespace and Destinations

### Identities

- Envelope: `retry-envelope:v2`. [PRESCRIPTIVE]
- Routes: `route:v2:0` through `route:v2:2`. [PRESCRIPTIVE]
- Preflights: `preflight:v2:0` through `preflight:v2:11`. [PRESCRIPTIVE]
- Calibrations: `calibration:v2:{routeOrdinal}:{0..7}`. The full identity is distinct from older historical calibration strings because it is envelope-scoped and structurally different. [PRESCRIPTIVE; VERIFIED: repository identity search]
- Reproduction: `reproduction:v2:{0..539}`. [PRESCRIPTIVE]

### Canonical destinations

| Role | Destination |
|---|---|
| v2 source review | `.planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json` |
| direct-child source seal | `.planning/artifacts/v1.38-successor-source-seal-v12.json` |
| inactive envelope | `.planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json` |
| live journal | `.planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl` |
| owner lock | `.planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl.lock` (ephemeral, absent after owner exit) |
| private receipts | `.planning/artifacts/v1.38-current-matrix-retry-private-v2/journal-record-{0000...}.json` |
| terminal | `.planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json` |
| successful reproduction only | `.planning/artifacts/v1.38-current-matrix-reproduction-v16.json` |
| historical receipt manifest | `.planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json` |
| independent disposition | `.planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json` |
| post-run correction, only if needed | `.planning/artifacts/v1.38-plan-262-post-run-audit-correction-v3.json` |
| lifecycle readiness | `.planning/artifacts/v1.38-plan-262-89-lifecycle-driver-readiness-v2.json` |
| current lifecycle supersession | `.planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json` |
| exact-pass activation only | `.planning/artifacts/v1.38-foundation-activation-root-route10.json` |

These names are additive and absent at research time. The correction-v3 path is reserved, not pre-created: a correction is evidence of a discovered assurance defect, not a routine success artifact. [VERIFIED: filesystem search; PRESCRIPTIVE]

## Architecture Patterns

### System Architecture Diagram

```text
sourceBase 9e7087b3
  -> authorization 453a33a1 (sole parent join)
  -> Plan 84 v2 source + synthetic tests (no live work)
  -> Plan 85 independent non-authorizing review
  -> reviewed-source completion commit A2
  -> Plan 86 direct-child seal/envelope commit B2
  -> read-only pre-live join
       |- mismatch / occupied destination -> blocked, no observation
       `- exact -> Plan 87 kernel-owned controller
                    -> v2 journal + private receipts
                    -> terminal + optional reproduction-v16
  -> Plan 88 independent disposition
       |- exact verified 540/540 -> Route-10 activation
       `- anything else -> non-pass, activation absent
  -> Plan 89 validation / verification / lifecycle
       |- exact pass -> ADMIT-03 and Phase-263 planning gate
       `- non-pass -> gaps_found, no lifecycle completion
```

### Recommended Project Structure

```text
scripts/
├── lib/v1-38-bounded-retry-envelope-v2.ts
├── run-v1-38-bounded-retry-envelope-v2.ts
├── run-v1-38-bounded-retry-envelope-v2.test.ts
├── check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts
├── check-v1-38-plan-262-85-bounded-retry-source-review-v2.test.ts
├── check-v1-38-plan-262-88-bounded-retry-admission-v2.ts
├── check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts
├── check-v1-38-plan-262-89-lifecycle-v2.ts
└── check-v1-38-plan-262-89-lifecycle-v2.test.ts
```

Do not modify the three historical v1 source/test files authenticated by correction v2. A new generic core can be introduced only if v1 never imports it and all v2 semantics remain independently reviewed; the simplest safe approach is a new v2 implementation that reuses only stable canonical/runtime adapters, not v1 evidence writers or destinations. [VERIFIED: correction v2 source-blob custody; PRESCRIPTIVE]

### Pattern 1: Pure replay state from an append-only journal

Every v2 counter and next identity must be derived from ordered, previous-root-linked journal records. CLI input may select only a mode; it cannot supply counters, remaining capacity, route ordinals, time origins, or accepted counts. [VERIFIED: v1 model]

```typescript
// Repository pattern: scripts/lib/v1-38-bounded-retry-envelope.ts
const state = deriveV2RetryState(envelope, records)
if (state.nextRouteIdentity !== "route:v2:1") fail("V138_RETRY_V2_STATE_INVALID")
```

### Pattern 2: Durable reservation before effects

Reserve a preflight, route, all eight calibration identities, or all 540 reproduction identities in the fsynced journal before starting the associated effect. A process crash charges the reserved identity; recovery reconciles private receipts from the journal and never reclaims work. [VERIFIED: v1 source/tests]

### Pattern 3: Kernel-owned exclusion

Use `/usr/bin/lockf -t 0` on the fresh v2 lock path. Do not implement PID files, stale timestamps, rename/unlink takeover, or lease reclamation in application code. Process death must release kernel ownership; a synchronized two-process test must prove exactly one owner acquires. [VERIFIED: code review finding CR-02 and v1 tests]

### Pattern 4: Ancestor-aware no-follow handling

Before reading or claiming absence, resolve the repository root once, require each ancestor from the root to the target parent to be a real directory and not a symlink, then use `lstat` plus `O_NOFOLLOW` for a present final component. For required absence, only `ENOENT` at the exact contained final component counts as absent; a symlink, directory, FIFO, socket, inaccessible component, escaped real path, or lookup uncertainty fails closed. [PRESCRIPTIVE from D-02/D-20R and current final-component checks]

### Pattern 5: Recoverable success publication

On exact success, validate the in-memory 540-cell artifact, exclusive-write and fsync reproduction-v16, fsync its parent, then exclusive-write and fsync terminal-v2. A restart with a valid reproduction but absent terminal must verify the existing artifact and publish only the matching terminal without rerunning reproduction. [VERIFIED: v1 success crash tests]

### Pattern 6: Independent outcome authority

The live controller always reports downstream authority denied. Plan 88 independently recomputes envelope, journal, receipt, terminal, reproduction, Git, runtime/kernel, cleanup, privacy, and absence joins. Only that checker may write the Route-10 activation root. [VERIFIED: Plans 80-81]

### Anti-Patterns to Avoid

- **Editing the v1 controller/model/tests:** breaks correction-aware historical custody. [VERIFIED: correction v2]
- **Treating correction v2 as a source review for v2:** it reviews the historical run and strengthened historical source, not future v2 bytes. [VERIFIED: correction schema]
- **Reusing Plan-83 zero findings:** its effective historical conclusion is superseded by the strengthened blocked review; v2 requires a fresh review. [VERIFIED: correction v2]
- **Mutable destination maps or CLI-provided paths in live mode:** can redirect evidence into historical or public paths. Use exact compiled destinations and exact flag equality. [VERIFIED: v1 tests]
- **Time-only stale lock recovery:** recreates the race closed by `lockf`. [VERIFIED: code review]
- **Publishing a routine correction artifact:** correction-v3 should exist only if an independent post-run audit finds an assurance defect. [PRESCRIPTIVE]
- **Counting cleanup-uncertain work as a process-valid calibration failure:** unknown cleanup is integrity failure and immediately terminal, not a 15-minute retry branch. [VERIFIED: MEAS-04 and v1 fixes]
- **Letting the four-hour deadline start late:** the first durable preflight observation fixes the time origin; it cannot reset on restart or route change. [VERIFIED: D-29R]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Process ownership | PID/stale-file lease protocol | Darwin `/usr/bin/lockf` | Kernel release closes stale-owner races. [VERIFIED: review CR-02] |
| Strategy execution | In-process evaluator, `new Function`, Node `vm` | Existing supervised runtime-service path | Preserves hostile-code boundary and canonical kernel. [VERIFIED: CONTEXT/AGENTS] |
| Matrix definition | New scheduler or expected-result table | Existing canonical matrix adapter | Prevents semantic drift. [VERIFIED: ADMIT-03/04] |
| Evidence counters | Mutable JSON counters | Journal replay | Prevents reclaim, omission, and CLI forgery. [VERIFIED: v1 model] |
| Custody | Labels or copied hashes | Git commit/tree/blob plus canonical SHA-256 joins | Proves exact bytes and ancestry. [VERIFIED: correction v2] |
| Atomic success | Overwrite-in-place output | `O_EXCL`, fsync, parent fsync, replay validation | Survives process death without duplicate work. [VERIFIED: v1 tests] |

## Exact State and Terminal Semantics

### Preflight and calibration

1. Before the first observation, recheck source base, authorization, current reviewed-source commit, direct-child seal, envelope, local-seal root, protected v1 history/correction, exact paths, and absence of every v2 live destination. Any mismatch is a pre-start integrity stop and consumes no v2 observation. [PRESCRIPTIVE]
2. Reserve the next preflight identity durably. If a crash leaves it pending, recovery must terminalize the envelope as integrity failure or durably complete that same observation without selecting a new identity; it may never leave an unbounded pre-observation limbo. [PRESCRIPTIVE]
3. The first durable `observe_preflight` record fixes `firstObservationMilliseconds`; the inclusive deadline is `now >= firstObservationMilliseconds + 14_400_000`. [VERIFIED: D-29R; PRESCRIPTIVE boundary]
4. A value below 2,500bp is a refusal, charges the preflight observation only, and requires at least 300,000ms before the next observation. Equality at 2,500bp is admitted. [VERIFIED: D-29R]
5. On admission, reserve one route and exactly eight calibration identities across four shards before launch. [VERIFIED: D-29R]
6. A process-valid calibration system failure with complete cleanup charges all eight identities and permits another route only after at least 900,000ms, remaining capacity, and remaining time. [VERIFIED: D-29R]
7. Missing/uncertain cleanup, identity mismatch, runtime/kernel drift, privacy leak, contamination, malformed receipt, or any integrity error is immediately terminal and permits no further route. [VERIFIED: D-02/D-25R/MEAS-04]

### Reproduction

1. Only an admitted calibration with complete cleanup may atomically reserve the sole 540-identity reproduction allocation. [VERIFIED: D-25R]
2. Run all 540 cells fresh through the unchanged supervised runtime and `MATCH_KERNEL`; partial prior/v1/v2 calibration evidence is never reusable. [VERIFIED: D-03/D-24R]
3. Exact pass requires 540 unique expected cell identities, 540 accepted, zero system/player/integrity/privacy failures, complete cleanup, matching runtime/kernel/policy/source roots, and one canonical reproduction root. [VERIFIED: ADMIT-03/MEAS-04]
4. Any reproduction system failure, incomplete/duplicate/mismatched cell set, accepted count other than 540, cleanup uncertainty, or publication uncertainty is terminal. No second reproduction is allowed. [VERIFIED: D-25R/D-31R]

### Outcome table

| Observed outcome | Terminal/disposition | Reproduction | Activation/lifecycle |
|---|---|---|---|
| Exact independently verified 540/540 | `succeeded` / `pass` | reproduction-v16 present and checked | Route-10 activation present; Plan 89 may complete ADMIT-03 and permit Phase-263 planning only. [PRESCRIPTIVE] |
| Three process-valid calibration failures | `exhausted` / `non_pass` | absent | activation absent; `gaps_found`; Phase 262 incomplete. [VERIFIED: v1 behavior] |
| Twelve refusals | `exhausted` / `non_pass` | absent | activation absent; `gaps_found`. [PRESCRIPTIVE] |
| Four-hour inclusive deadline | `exhausted` / `non_pass` | absent unless a prior invalid partial exists, which is terminal failure | activation absent; `gaps_found`. [PRESCRIPTIVE] |
| Integrity/contamination/cleanup uncertainty | `terminal_failure` / `non_pass` | absent or quarantined invalid, never accepted | activation absent; no further route. [VERIFIED: D-02/D-31R] |
| Reproduction not exactly 540/540 | `terminal_failure` / `non_pass` | no accepted canonical reproduction | activation absent; no retry. [VERIFIED: D-31R] |

Even on pass, the Route-10 activation should authorize only the next normal GSD Phase-263 planning/execution gate defined by the roadmap. It must not directly authorize candidate execution, formation materialization, holdout opening, public/product/production use, counted play, gameplay change, milestone archive, or tag. [PRESCRIPTIVE from D-32R]

## Concrete Plan Sequence

### Plan 262-84 — v2 source, historical binder, and synthetic proof

- Create new v2 model/controller/tests and a correction-aware protected-history manifest rooted at source base `9e7087b3` plus authorization `453a33a1`. [PRESCRIPTIVE]
- Implement fresh identities/destinations, exact frozen policy, parent-contained no-follow helpers, journal replay, `lockf`, crash recovery, and pass/non-pass publication. [PRESCRIPTIVE]
- Run fake-effect and detached temporary-root tests only; create no seal, envelope, journal, terminal, private receipt, reproduction, disposition, correction, lifecycle, or activation artifact. [PRESCRIPTIVE]

### Plan 262-85 — independent non-authorizing source review

- Independently derive the Plan-84 source commit/tree/parent/modes/blobs and execute committed bytes in owner-only disposable roots. [PRESCRIPTIVE]
- Mutation-test every bound, Git join, v1 historical root, correction status, OS-lock race, crash boundary, no-follow/ancestor escape, privacy marker, authority field, and destination. [PRESCRIPTIVE]
- Publish one immutable zero-finding-or-blocked review pair. Zero findings makes only Plan 86 eligible. [PRESCRIPTIVE]

### Plan 262-86 — direct-child v12 seal and inactive envelope-v2

- Require exact zero findings, clean reviewed source paths, sourceBase/authorization ancestry, and current v1 history. [PRESCRIPTIVE]
- Publish source-seal-v12 and Plan-86 retry-envelope-v2 together in a commit whose sole parent is the completed Plan-85 reviewed-source head. [PRESCRIPTIVE]
- Leave all counters zero and every live destination absent. [PRESCRIPTIVE]

### Plan 262-87 — one bounded live envelope-v2

- Main orchestrator invokes the exact compiled live command once; internal crash recovery/re-entry is allowed only for already-reserved state, never as a new envelope. [PRESCRIPTIVE]
- Produce the v2 journal/private receipts/terminal and, only on exact success, reproduction-v16. [PRESCRIPTIVE]
- Commit immutable outcome evidence; no admission or lifecycle conclusion is authored by the live controller. [PRESCRIPTIVE]

### Plan 262-88 — independent disposition and optional correction

- Independently reconstruct every v2 record, receipt, counter, cell, Git blob, cleanup fact, runtime/kernel join, policy bound, privacy projection, and v1 historical preservation. [PRESCRIPTIVE]
- Publish disposition-v2 on both branches. Publish Route-10 activation only for exact verified 540/540. [PRESCRIPTIVE]
- If the independent review discovers an assurance defect, preserve all live bytes and publish additive correction-v3; correction status forces non-pass. Do not create correction-v3 on a clean pass or clean empirical non-pass. [PRESCRIPTIVE]

### Plan 262-89 — validation, verification, and lifecycle closeout

- Refresh `262-VALIDATION.md`, `262-VERIFICATION.md`, requirements/roadmap/state projections, and lifecycle-status-v2 from the independent disposition. [PRESCRIPTIVE]
- Use the same two-stage summary latch: pre-summary readiness first, normal Plan-89 summary second, root-only post-summary driver last. [VERIFIED: Plan 81]
- Exact pass may check ADMIT-03, complete Phase 262, and admit Phase-263 planning. Every other branch records `gaps_found` and performs zero completion mutation. [PRESCRIPTIVE]

No UI phase is necessary because the work is private CLI/evidence infrastructure and must not create a product surface. [VERIFIED: scope]

## Common Pitfalls

### Pitfall 1: Historical source mutation
**What goes wrong:** A v2 refactor edits v1 source files and invalidates correction-v2 source-blob custody. [VERIFIED: correction v2]

**Avoidance:** New files and new destinations only; v1 files are read-only protected history. [PRESCRIPTIVE]

### Pitfall 2: Self-review or obsolete-review reuse
**What goes wrong:** Source derives its own verdict, or Plan-83's historical zero findings are treated as current eligibility despite the strengthened blocked correction. [VERIFIED: correction v2]

**Avoidance:** Fresh Plan-85 reviewer over committed v2 bytes; incomplete observation is a finding. [PRESCRIPTIVE]

### Pitfall 3: Direct-child ambiguity
**What goes wrong:** The seal is made a child of the authorization commit before review, or the decision join is omitted from a later reviewed-source seal. [VERIFIED: Git/current pattern]

**Avoidance:** Record both joins: 9e7087b3 -> 453a33a1 and reviewed-source head A2 -> seal commit B2. [PRESCRIPTIVE]

### Pitfall 4: Lock ownership regression
**What goes wrong:** An application removes or reclaims another process's lock. [VERIFIED: prior CR-02]

**Avoidance:** `lockf`, synchronized contenders, and real SIGKILL tests at each durable boundary. [PRESCRIPTIVE]

### Pitfall 5: False absence
**What goes wrong:** A symlink, directory, or escaped parent path is treated as absent. [VERIFIED: prior CR-04 covered final component]

**Avoidance:** Ancestor containment plus exact final-component no-follow status for every pass-only and forbidden destination. [PRESCRIPTIVE]

### Pitfall 6: Cleanup reclassified as retryable
**What goes wrong:** Pending/unknown child cleanup is called a process-valid failure and another route starts. [VERIFIED: prior CR-01]

**Avoidance:** Only authenticated `completeCleanup:true` system failure enters the 15-minute retry branch; uncertainty is terminal. [PRESCRIPTIVE]

### Pitfall 7: Lifecycle count theater
**What goes wrong:** Matching plan/summary counts are mistaken for admission. [VERIFIED: Plan 81]

**Avoidance:** Require exact independent pass disposition and Route-10 activation in addition to filesystem-derived topology. [PRESCRIPTIVE]

## Code Examples

### Fresh immutable policy

```typescript
// Derived from the repository's v1 model; all values are locked by D-29R.
export const RETRY_V2_POLICY = Object.freeze({
  schemaVersion: "retry-envelope:v2",
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

### Fail-closed success conjunction

```typescript
// Repository pattern: independent disposition owns activation, never live source.
const passed =
  terminal.disposition === "succeeded" &&
  terminal.freshAccepted === 540 &&
  terminal.completeCleanup === true &&
  reproduction.acceptedCellCount === 540 &&
  reproduction.uniqueExpectedCellCount === 540 &&
  independentFindingCount === 0

if (!passed) requireExactNoFollowAbsence(ROUTE_10_ACTIVATION)
```

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | controller/checkers | yes | 24.15.0 | none needed [VERIFIED: local] |
| pnpm | test/typecheck runner | yes | 11.1.2 | none needed [VERIFIED: local] |
| TypeScript | typecheck | yes | 6.0.3 | none needed [VERIFIED: local] |
| Vitest | focused tests | yes | 4.1.6 | none needed [VERIFIED: local] |
| Git | custody | yes | 2.50.1 Apple Git-155 | none [VERIFIED: local] |
| `/usr/bin/lockf` | owner exclusion | yes | Darwin system utility | no safe in-scope fallback; block if missing [VERIFIED: local] |
| Darwin memorystatus/runtime tools | live preflight/calibration | existing v1 path | bound by frozen runtime predicates | fail closed; do not substitute [VERIFIED: v1 source] |

**Missing dependencies with no fallback:** none on the current host. [VERIFIED: local probes]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.6 [VERIFIED: local package] |
| Config | repository workspace defaults; focused files are invoked explicitly [VERIFIED: current commands] |
| Quick command | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v2.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1` [PRESCRIPTIVE] |
| Typecheck | `pnpm exec tsc --noEmit --pretty false` [VERIFIED: current review] |

### Phase Requirements -> Test Map

| Req | Behavior | Test type | Automated command/file | Exists? |
|---|---|---|---|---|
| ADMIT-03 | exact 540 inventory and pass-only activation | integration | Plan-88 admission-v2 test | Wave 0 gap |
| ADMIT-04 | source/decision/history drift fails closed | mutation/integration | Plan-85 review-v2 test | Wave 0 gap |
| MEAS-02 | exact immutable bounds/identities | unit | v2 model test | Wave 0 gap |
| MEAS-04 | charges, cleanup, system/integrity distinctions | unit/subprocess | v2 controller test | Wave 0 gap |
| MEAS-09 | pass/non-pass/contamination classification | unit | Plan-88 admission-v2 test | Wave 0 gap |
| MEAS-10 | containment and forbidden destinations | mutation/integration | Plan-85 review-v2 test | Wave 0 gap |
| SEAL-01 | exact reduced assurance and no holdout open | integration | v2 seal/review test | Wave 0 gap |

### Required behavioral matrix

- Exact caps: 3 starts, 12 observations, 24 maximum calibration identities, one 540 allocation. [PRESCRIPTIVE]
- Threshold equality 2,500 admitted; 2,499 refused. [PRESCRIPTIVE]
- Exact 5-minute/15-minute/inclusive 4-hour boundaries. [PRESCRIPTIVE]
- Crash/SIGKILL at lock acquisition, journal fsync, receipt fsync, reproduction write/fsync, terminal write/fsync. [VERIFIED: v1 pattern]
- Synchronized two-process lock contention and process-death release. [VERIFIED: v1 pattern]
- Pending reservation reconciliation without reuse. [PRESCRIPTIVE]
- Regular file/symlink/directory/FIFO/escaped-parent injection for all absent or private destinations. [PRESCRIPTIVE]
- Historical v1 artifact/blob/root mutation for every correction-aware input. [PRESCRIPTIVE]
- Reproduction duplicate/missing/unexpected/partial cell sets and every accepted count other than 540. [PRESCRIPTIVE]
- Privacy-marker injection and false authority fields. [PRESCRIPTIVE]
- Synthetic pass and every non-pass lifecycle branch. [VERIFIED: Plan 81 pattern]

### Sampling rate

- Per task commit: focused v2 file with one fork worker and no file parallelism. [VERIFIED: Phase-262 VALIDATION pattern]
- Per plan wave: all v2 source/review/disposition/lifecycle files serialized. [PRESCRIPTIVE]
- Phase gate: v2 focused suite, TypeScript, canonical read-only checks, privacy scan, validation, verification, and audit. [PRESCRIPTIVE]

### Wave 0 Gaps

- `scripts/run-v1-38-bounded-retry-envelope-v2.test.ts`. [PRESCRIPTIVE]
- `scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.test.ts`. [PRESCRIPTIVE]
- `scripts/check-v1-38-plan-262-88-bounded-retry-admission-v2.test.ts`. [PRESCRIPTIVE]
- `scripts/check-v1-38-plan-262-89-lifecycle-v2.test.ts`. [PRESCRIPTIVE]

## Security Domain

### Applicable ASVS Categories

| Category | Applies | Control |
|---|---:|---|
| V2 Authentication | no external user auth | Git/operator custody identifies the local execution actor; no new identity claim. [VERIFIED: scope] |
| V3 Session Management | no | No web/session surface. [VERIFIED: scope] |
| V4 Access Control | yes | Exact modes, repository containment, owner-only private directory, compiled allowlisted modes/destinations. [VERIFIED: v1 pattern] |
| V5 Input Validation | yes | Canonical schemas, exact enums/counts/roots, no-follow reads, Git blob checks. [VERIFIED: v1 pattern] |
| V6 Cryptography | yes | Node SHA-256 and existing local-seal commitment only; no ad hoc signing. [VERIFIED: CONTEXT] |
| V8 Data Protection | yes | Private receipts, safe projections, forbidden marker scans, no holdout access. [VERIFIED: CONTEXT] |
| V10 Malicious Code | yes | Hostile Strategy execution remains supervised and outside coordinator/web/API/Go. [VERIFIED: AGENTS/CONTEXT] |

### Threats and mitigations

| Threat | STRIDE | Mitigation |
|---|---|---|
| Spoofed authorization/source ancestry | Spoofing | Exact commit/tree/sole-parent/blob joins for 9e7087b3, 453a33a1, reviewed source, and seal. [PRESCRIPTIVE] |
| Reclaimed historical identities | Tampering | Protected-history manifest plus fresh v2 namespaces; journal-derived counters. [PRESCRIPTIVE] |
| Concurrent live owners | Elevation/repudiation | Kernel `lockf`, synchronized contention, SIGKILL recovery. [VERIFIED: v1 pattern] |
| Symlink/path escape | Tampering/disclosure | Ancestor-aware containment, `lstat`, `O_NOFOLLOW`, exact absence. [PRESCRIPTIVE] |
| Private runtime leakage | Information disclosure | Owner-only receipts and bounded canonical public-safe projections; marker scans. [VERIFIED: v1 pattern] |
| Self-authorized success | Elevation | Independent Plan-88 verifier exclusively owns activation. [PRESCRIPTIVE] |
| Correction used to erase history | Repudiation | Additive correction only; all live bytes and charges immutable. [VERIFIED: correction-v2 pattern] |

## Assumptions Log

| # | Claim | Risk if wrong |
|---|---|---|
| — | None. The plan-critical claims were derived from committed repository evidence, Git, and local tool probes. | — |

## Open Questions

None require user input. Exact schema/type/reason names remain implementation discretion, but the proposed names are safe and additive. The independent review may refine names before the seal as long as every destination and root is frozen before Plan 86 publication. [VERIFIED: CONTEXT discretion]

## Sources

### Primary (HIGH confidence repository authority)

- `262-CONTEXT.md` — D-01..D-32R, discretion, and deferred scope. [VERIFIED: committed file]
- `262-75-RESEARCH.md` and Plans/Summaries 75-83 — v1 envelope design and lifecycle pattern. [VERIFIED: committed files]
- `scripts/lib/v1-38-bounded-retry-envelope.ts`, `scripts/run-v1-38-bounded-retry-envelope.ts`, and tests — state, journal, lock, crash, publication, and no-follow implementation. [VERIFIED: committed source]
- `v1.38-plan-262-post-run-audit-correction-v2.json` and historical receipt manifest — correction-aware v1 custody and effective non-pass. [VERIFIED: canonical checkers and Git]
- `262-REVIEW.md`, `262-REVIEW-FIX.md`, `262-VALIDATION.md`, and `262-VERIFICATION.md` — closed race/custody/absence findings, test evidence, and remaining 0/540 blocker. [VERIFIED: committed reports]
- Git commits `9e7087b3` and `453a33a1` — source-base and authorization parentage. [VERIFIED: Git]

### External sources

None. This is repository-specific evidence protocol research; external web results would not establish the project's immutable roots, decisions, or implementation behavior. [VERIFIED: task scope]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — locally probed and already used. [VERIFIED: local/repository]
- Architecture: HIGH — derived from current committed controller, correction, review, and lifecycle. [VERIFIED: repository]
- Pitfalls: HIGH — each major pitfall corresponds to a prior concrete review finding or locked decision. [VERIFIED: reports/CONTEXT]
- Live empirical outcome: UNKNOWN by design — research performs no live work and does not predict admission. [VERIFIED: task boundary]

**Research date:** 2026-08-27

**Valid until:** the first change to source base, authorization, protected v1 history/correction, frozen policy, runtime/kernel predicate, or local-seal verification root.

## Research Recommendation

Proceed with Plans **262-84 through 262-89** in strict sequence. Plan 84 must be source/synthetic only; Plan 85 must be independently authored and non-authorizing; Plan 86 must publish the direct-child v12 seal and inactive v2 envelope; Plan 87 alone may consume the bounded live authority; Plan 88 independently decides pass/non-pass and owns the pass-only Route-10 activation; Plan 89 refreshes validation/verification and mutates lifecycle only after an exact pass. Any non-pass preserves the full result, leaves ADMIT-03 blocked, and grants no third envelope or downstream authority. [PRESCRIPTIVE from D-28R..D-32R]
