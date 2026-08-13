# Phase 262: Single-Operator Local Sealed Holdout - Replan Research

**Researched:** 2026-08-12  
**Domain:** Repository-native precommitment, single-use local holdout opening, tamper-evident evidence, privacy, and honest trust claims  
**Confidence:** HIGH for repository behavior and contract changes; MEDIUM for protection against accidental/operator-process violations; explicitly NONE for independent custody or resistance to a malicious machine owner

<user_constraints>
## User Constraints

### Current operator decision (supersedes the external-custody prerequisite)

- We do not have an external custody system. Replan the milestone around that limitation. [VERIFIED: operator statement, 2026-08-12]
- The replacement must be a single-operator repository-native or local sealed-holdout model that preserves one-shot opening, precommitment, tamper evidence, access logging, fail-closed contamination, privacy boundaries, and no post-result tuning, while dropping every claim of independent or separately permissioned custody. [VERIFIED: current replan assignment]
- Prior terminal/defer artifacts remain truthful historical evidence and may be superseded only additively. [VERIFIED: current replan assignment; D-01]

### Locked decisions retained from 262-CONTEXT.md

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

#### Holdout and pre-formation containment retained after terminology revision
- **D-21:** Premature access, unauthorized query, commitment mismatch, uncertain evaluator state, or disclosure outside the frozen safe projection is contamination, not a diagnostic opportunity. It follows the precommitted invalidation/reporting path and cannot be repaired with a replacement or second holdout.
- **D-22:** Precommit the literal current-edge, full-inward, and edge-anchored-bracket coordinates, unchanged inward facings, equal-compute dimensions, telemetry, causal classifiers, and hard rejection logic now. Only profile-agnostic schemas, metric code, and synthetic positive/negative/mirrored/obfuscated fixtures may exist before the valid Phase 266 current-league freeze.

### Decisions that must be explicitly revised

- **D-19 is superseded:** replace “separately permissioned custodian” with one named repository operator using a restricted local holdout store and one closed opening command. The experiment coordinator sees only a public commitment before opening and one bounded safe receipt afterward. This is process separation, not independent custody. [VERIFIED: operator statement; existing local mechanics]
- **D-20 is superseded in role claims only:** retain profile-neutral lineage, frozen source/training/prompt/cache/opponent/schedule exclusions, opening/access/query ledger, safe projection, contamination response, retention, and retirement, but identify the role as `repository_operator` and the assurance class as `single_operator_local_seal_v1`. Do not say `custodian`, `separatelyPermissioned`, `independent`, or `externallyAuthenticated`. [RECOMMENDED from operator limitation and existing schema]

### the agent's Discretion retained

- Exact schema, module, command, storage, and typed-reason names remain planning discretion within the locked evidence and privacy boundaries. [VERIFIED: 262-CONTEXT.md]
- Exact commitment primitive and retention sampling remain planning discretion, but must use the already implemented Node cryptography/canonical-JSON stack; no new trust or package system is justified. [RECOMMENDED from repository stack]

### Deferred Ideas (OUT OF SCOPE)

- Planner and deterministic runner implementation belongs to Phase 263.
- Candidate factory, independent oracles, and quarantined intake belong to Phase 264.
- League execution and current-league freeze belong to Phases 265–266.
- Executable formation materialization, equal retraining, sealed opening, decision, certification, and release closure belong to Phases 267–270.
- Cap, MOVE, Backstab, scan-timing, arena, runtime, product, and combined-rule experiments require separately approved later work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Current disposition | Research support for replanning |
|---|---|---|
| ADMIT-01 | Complete | Preserve exact predecessor join and historical roots unchanged. [VERIFIED: REQUIREMENTS.md] |
| ADMIT-02 | Complete | Bind the local-seal protocol to the existing semantic/runtime and pre-search policy roots. [VERIFIED: current foundation artifacts] |
| ADMIT-03 | Blocked, independent of holdout model | A separately planned literal current-matrix reproduction still must pass before Phase 263. Replacing custody does not waive or infer it. [VERIFIED: REQUIREMENTS.md; STATE.md] |
| ADMIT-04 | Complete | Continue fail-closed handling of incompatible or drifting predecessor evidence. [VERIFIED: REQUIREMENTS.md] |
| MEAS-01..09 | Complete | Preserve frozen scientific, budget, claims, and reporting policy bytes/root. [VERIFIED: 262-39-SUMMARY.md] |
| MEAS-10 | Wording revision required, mechanics otherwise frozen | Replace “custody procedure” with “single-operator local sealing procedure”; retain precommitment, lineage exclusions, access/query policy, safe receipt, contamination, and non-authorization. [RECOMMENDED] |
| SEAL-01 | Contract revision required | Define a named operator-controlled local seal honestly, without separate permissioning, independent provenance, or malicious-owner resistance claims. [RECOMMENDED] |
| DECI-02 | Complete | Preserve frozen classifier and rejection logic unchanged. [VERIFIED: REQUIREMENTS.md] |
</phase_requirements>

## Summary

The realistic replacement is a **single-operator local sealed holdout**, not custody. Before any candidate or profile result is inspected, the repository operator creates the holdout bytes in a restricted store outside the repository, commits their canonical digest and the complete evaluation policy into Git, and publishes only that opaque commitment. After all three population/finalist/freeze roots exist, one closed command burns the sole opening authorization before evaluation begins, runs the common batch, emits only the allowlisted aggregate receipt, and terminalizes the local store as verified, contaminated, or retired. [VERIFIED: existing `scripts/lib/v1-38-custody.ts` mechanics; RECOMMENDED terminology/authority revision]

This model preserves procedural blindness, evidence immutability, one-shot behavior, tamper evidence, an application-level event ledger, safe projection, terminal contamination, and no-post-result-tuning checks. It does **not** provide independent custody, separate permissioning, non-collusion, comprehensive host access monitoring, or protection against an operator who deliberately reads or rewrites files outside the tool. Those are removed claims, not hidden weaknesses. [VERIFIED: single-operator threat model; existing local filesystem implementation]

The prior terminal disposition remains historically correct: at that time the approved contract required external custody and none existed. A new approved contract branch may additively supersede that prerequisite without deleting or rewriting Plan 262-40, Plan 262-42, the terminal artifact, stopped matrix routes, charges, or roots. Phase 262 still cannot complete until a separately planned ADMIT-03 reproduction passes. [VERIFIED: D-01; current ROADMAP/STATE/REQUIREMENTS]

**Primary recommendation:** Amend the milestone contract first, then reclassify and harden the existing synthetic mechanics into `single_operator_local_seal_v1`, independently verify the mechanics and claim boundary, and only afterward plan a fresh ADMIT-03 route and activation join. [RECOMMENDED]

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|---|---|---|---|
| Holdout preimage creation and storage | Offline operator tooling | Local filesystem | Preimages must never enter product, runtime, Git, or public/default paths. [VERIFIED: D-04; existing custody module] |
| Commitment and freeze identity | Offline operator tooling | Git evidence | Canonical roots are repository-visible while secrets/preimages remain local. [VERIFIED: D-01; canonical identity helpers] |
| One-shot open/evaluate/project | Offline operator tooling | Supervised runtime boundary | The operator command orchestrates; hostile Strategies still execute only through runtime-service/Runtime Broker. [VERIFIED: D-03] |
| Access/query event ledger | Local seal store | Git-safe receipt root | Full events stay private; only bounded roots/status cross into evidence. [RECOMMENDED from privacy boundary] |
| Contamination and retirement | Offline operator tooling | Planning/evidence status | Any violation terminalizes the claim and cannot be repaired with a second holdout. [VERIFIED: D-21; existing state machine] |
| Public/default surfaces | Production boundary monitors | — | They must reject or omit all local-seal preimages, paths, secrets, evaluator state, and raw ledger events. [VERIFIED: AGENTS.md; D-04] |

## Assurance Model and Honest Claims

### Claims this model may make

- `assuranceClass: single_operator_local_seal_v1`. [RECOMMENDED]
- The committed bytes and policy matched at the time of the single opening. [VERIFIED: HMAC/digest and timing-safe verification already implemented]
- The application command recorded one accepted opening and rejected a second opening through its closed API. [VERIFIED: existing one-open state machine and tests]
- The released receipt matched a frozen field allowlist/cardinality/byte bound. [VERIFIED: existing safe-projection mechanics]
- Frozen source, candidate, finalist, thresholds, metrics, classifier, and analysis roots were checked before the opening receipt was accepted. [RECOMMENDED successor integration]
- Any observed mismatch, forbidden projection, repeated command, missing/extra ledger record, unexpected local state, or operator-declared premature access invalidated the sealed claim. [VERIFIED: existing fail-closed mechanics; RECOMMENDED expanded contamination schema]

### Claims this model must never make

- Independent, external, third-party, separately permissioned, or separately controlled custody. [VERIFIED: operator statement]
- Protection from a malicious or colluding repository/machine owner. [VERIFIED: single-operator threat model]
- Comprehensive host-level access logging. The ledger records only accesses and commands made through the sealed-holdout tool. [VERIFIED: implementation boundary]
- Proof that the operator never copied, inspected, or altered a preimage through another program. The process relies on operator declaration plus tamper evidence, not hardware-enforced isolation. [VERIFIED: local filesystem authority model]
- Cryptographic erasure merely because the tool retired the store. [VERIFIED: local copies cannot be ruled out]
- “Custody satisfied” or a `custodyRoot`. Use `localSealStatus`, `localSealCommitmentRoot`, and `localSealReceiptRoot`. [RECOMMENDED]

## Recommended Local-Seal Architecture

```text
profile-agnostic holdout constructor
  -> canonical sealed bundle in operator-only local store (outside repo)
  -> secret-salted commitment + policy/freeze roots
  -> public commitment record committed to Git

current league + three profile branches freeze
  -> exact roots checked against precommitted request
  -> exclusive open marker created and fsynced BEFORE evaluation
  -> one common batch through canonical kernel/runtime boundary
  -> bounded allowlisted aggregate receipt
  -> terminal verified / contaminated / retired state

Git/public evidence receives:
  commitment root + frozen request root + event-ledger root + bounded receipt root

Git/public evidence never receives:
  preimages + salts/keys + local paths + raw queries + evaluator state + Strategy private data
```

Every transition creates or appends canonical bytes with an exclusive or append-only write and fsync before authority advances. The open token is consumed before launching the evaluation so a crash or system failure burns the one permitted opening rather than enabling a retry. [RECOMMENDED from D-02/D-05/D-21 and existing file primitives]

### Required state machine

| State | Permitted next action | Fail-closed behavior |
|---|---|---|
| `empty` | `commit` | Existing store/object causes refusal; never overwrite. [VERIFIED: existing exclusive writes] |
| `committed` | `armOpen` after all freeze checks | Any root mismatch contaminates or refuses before opening. [RECOMMENDED] |
| `open_armed` | `consumeAndEvaluate` exactly once | Write/fsync consumed marker first; any later invocation is terminal rejection. [RECOMMENDED hardening] |
| `open_consumed` | evaluate and project once | Crash/system failure remains charged and terminal; no rerun. [RECOMMENDED] |
| `projected` | `verify` | Receipt outside allowlist/limits contaminates terminally. [VERIFIED: existing mechanics] |
| `verified` | `retire` | No new query, projection, result, or diagnostic operation. [VERIFIED: existing mechanics] |
| `contaminated` | `retire` only | Sealed claim is invalid; no replacement holdout. [VERIFIED: D-21; existing mechanics] |
| `retired` | none | All commands fail terminally. [VERIFIED: existing mechanics] |

The current module records `opened` before result projection, but the successor should make the irreversible consumption marker an explicit pre-launch state so a process crash cannot be interpreted as permission to reopen. [VERIFIED: current event order; RECOMMENDED hardening]

### Access logging boundary

Use a hash-chained canonical NDJSON event ledger with sequence number, previous-event hash, command, outcome, stable reason code, state, request root, and resulting state root. Do not include actor identities, host paths, secrets, queries, preimages, raw diagnostics, or exact holdout labels in the repository-safe projection. [RECOMMENDED from current append-only ledger and D-04]

The tool should expose no generic `read`, `get`, `query`, `list`, or debug API. Every rejected command must append a stable rejection event when safe to do so. A direct filesystem read outside the tool is not detectable; the opening manifest therefore requires an explicit operator declaration of no premature access, and any declared or suspected bypass sets `contaminated`. [VERIFIED: current closed export test; RECOMMENDED honest limitation]

### Precommitment and no-post-result tuning

The public commitment record must bind: holdout bundle digest, profile-neutral construction code/root, selected semantic tuple, canonical kernel/runtime identities, evaluation schema, exact frozen metric/classifier/threshold/interpretation roots, common opponent/schedule construction root, equal-compute policy root, receipt allowlist root, one-open policy, contamination policy, and retention/retirement policy. [RECOMMENDED from MEAS-10/SEAL-02..04]

The batch request must bind the exact three branch freeze roots and preselected finalist hashes before opening. The receipt is accepted only if those roots equal the precommitted request. After `open_consumed`, any changed Git tree, candidate, finalist, threshold, metric, classifier, interpretation, prompt, or analysis code is a different branch and cannot inherit the same sealed claim. [VERIFIED: D-01; SEAL-02..04]

### Privacy and retention

- Keep sealed bytes and keyed material in an absolute out-of-repository directory with `0700` directories, `0600` regular files, no symlinks, bounded reads, and exclusive writes. [VERIFIED: current implementation]
- Use one concrete secret-file interface: before `commit`, the repository operator creates `input/commitment-secret.bin` inside the already validated absolute out-of-repository local-seal root. The root and `input/` directory are owner-only `0700`; the secret is a current-effective-UID-owned, regular, non-symlink `0600` file with a bounded 32..4096-byte payload. The tool opens it with `O_NOFOLLOW`, verifies ownership/mode/type/size before reading, reads it once during commitment, derives the domain-separated commitment, closes the descriptor, zero-fills its in-process Buffer in `finally`, unlinks the authoritative secret file, and fsyncs the parent directory before reporting success. Permission, ownership, type, symlink, size, short-read, unlink, or fsync uncertainty fails closed. Secret bytes never enter CLI arguments, environment variables, Git, test snapshots, CI, logs, receipts, artifacts, or public/default output. Buffer zeroization and unlink are best-effort process/storage hygiene, not proof against OS copies, swap, backups, forensic recovery, or a malicious owner. [DECIDED: operator-approved local-seal model; concrete planning choice]
- Commit only opaque roots, bounded counts, coarse status, and approved aggregate metrics. [VERIFIED: D-04; current safe receipt]
- Retirement deletes the authoritative local store only after the receipt and audit roots are fixed, but the report must call this `local_store_retired`, not “cryptographically erased.” [RECOMMENDED honest claim]
- Synthetic tests continue to use synthetic non-holdout bytes and must never access real holdout material. [VERIFIED: existing tests]

## Exact Contract and Planning Updates Required

### 1. Binding activation prompt

Update `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md` before any mechanics are reclassified. [RECOMMENDED]

- Stage 1: replace “sealed holdouts” with “a precommitted single-operator local sealed holdout and its explicit assurance limits.”
- Stage 4: retain freezing of the holdout policy before alternate profiles.
- Stage 6: replace “common sealed arena/opponent holdout” with “common operator-sealed local arena/opponent holdout”; retain exactly one batch and no tuning after disclosure.
- Add a hard claim boundary: no independent custody, separate permissioning, third-party non-collusion, comprehensive host-access monitoring, or malicious-owner resistance is claimed.
- Retain every production, runtime, lab-only, equal-compute, formation, privacy, verification, audit, archive, and tag boundary unchanged.

### 2. REQUIREMENTS.md

Revise only the custody/seal wording; do not change unrelated checkbox states or empirical thresholds. [RECOMMENDED]

- **MEAS-10:** change `holdout commitment and custody procedure` to `holdout commitment and single-operator local sealing procedure`; retain access/query policy, safe receipt, contamination, lineage exclusions, and non-authorization.
- **SEAL-01 replacement text:** “A named repository operator controls a restricted out-of-repository local holdout store and one closed opening command. The immutable protocol binds secret-salted commitment material, pre-open freeze checks, application-level access/query events, one consumed opening before evaluation launch, bounded safe aggregate projection, terminal contamination, retention, and retirement. The evidence explicitly identifies `single_operator_local_seal_v1` and makes no independent-custody, separate-permissioning, comprehensive-host-monitoring, or malicious-owner-resistance claim.” [RECOMMENDED]
- **SEAL-02..07:** replace role words such as `custodian`/`custody` only where they imply separate control; retain freeze verification, one common batch, no post-open mutation, invariance, privacy, and invalidation semantics.
- **CLOSE-01/02/03/07:** replace custody-receipt/private-root terminology with local-seal receipt/commitment roots while keeping preimages absent from clean-checkout reproduction.

### 3. ROADMAP.md

- Rename Phase 262 to “Foundation Admission, Measurement, Local Seal, and Containment Contract.” [RECOMMENDED]
- Rewrite Phase 262 goal and success criterion 4 around the named operator/local seal and its honest limitations.
- Add successor plans after historical 262-42; move 262-43 to `archived/262-43-HISTORICAL.md` without a completion summary and record that it was truthful under the former external-custody contract. [RECOMMENDED additive supersession]
- Keep Phase 262 unchecked until both revised SEAL-01 and ADMIT-03 pass; keep Phases 263–270 blocked meanwhile. [VERIFIED: phase dependency]
- In Phases 266, 269, and 270 replace custody language with local-seal language without weakening one-open, freeze, contamination, privacy, or independent verification of evidence. Independent verification remains allowed; independent custody does not. [RECOMMENDED]

### 4. STATE.md

Append, do not rewrite, a decision that the operator-approved contract now accepts `single_operator_local_seal_v1` and explicitly supersedes decisions 171–175 only for future routing. Preserve the old decisions, terminal roots, hashes, and stopped-route history as historical facts. [RECOMMENDED from D-01]

Update Current Position/Blockers to distinguish:

- external custody: unavailable and no longer required by the revised contract;
- local-seal mechanics: pending implementation/verification;
- SEAL-01: pending under revised wording;
- ADMIT-03: still blocked and requiring a fresh separately planned literal pass;
- downstream authority: false until both latches and the exact activation join pass. [RECOMMENDED]

### 5. Phase context and research carriers

- Add a dated “Decision Revision: single-operator local seal” section to `262-CONTEXT.md` defining D-19R and D-20R and declaring D-19/D-20 historical/superseded for future work. Do not silently edit the old decision text. [RECOMMENDED]
- Keep `262-NO-EXTERNAL-CUSTODY-RESEARCH.md`, `262-42-SUMMARY.md`, archived Plan 262-40, and `.planning/artifacts/v1.38-phase-262-terminal-deferment.json` byte-preserved as historical evidence. [VERIFIED: current replan assignment]
- Add this research file as the current replan input and update `262-VERIFICATION.md` only during execution to reflect the new pending path. [RECOMMENDED]
- Synchronize `.planning/research/SUMMARY.md`, `.planning/research/competitive-strategy-factory-and-adversarial-league.md`, and `.planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md` so no active handoff still promises separate custody. [RECOMMENDED from milestone artifact consistency]

## Staged Successor Plan

### Plan 262-44 — Contract and decision revision only

**Purpose:** Amend the approved milestone contract and planning carriers before code claims change. [RECOMMENDED]

**Files:** activation prompt, REQUIREMENTS, ROADMAP, STATE, 262-CONTEXT, research summary/handoff/seed, supersession manifest/monitor, archival move for 262-43. [RECOMMENDED]

**Must prove:** historical terminal artifacts/hashes unchanged; no executable formation/candidate/live route; revised terms contain no independent/separate-custody claim; ADMIT-03 and revised SEAL-01 remain unchecked; Phase 262/downstream remain incomplete. [RECOMMENDED]

### Plan 262-45 — Local-seal contract and TDD mechanics

**Purpose:** Reclassify the synthetic mechanics as real operator-local sealing mechanics and harden one-shot consumption before evaluation launch. [RECOMMENDED]

**Implementation seams:** rename `v1-38-custody.ts` concepts to local-seal terms or introduce a compatibility-free new module; use domain-separated canonical identities; replace `synthetic_non_holdout` only in the new real contract; add hash-chained events, explicit `open_consumed`, closed command schema, root joins, strict privacy projection, and a public commitment reference with `assuranceClass`. [RECOMMENDED]

**Must prove:** exclusive create, no-follow bounded reads, restricted modes, deterministic roots, one-open burn before launch, crash/system-failure terminality, no retry/replacement, tamper detection, invalid-projection contamination, no debug/read/query API, and no secret/path/private-data output. [VERIFIED existing baseline; RECOMMENDED gaps]

### Plan 262-46 — Clean-checkout independent mechanics and claim verification

**Purpose:** Have a verifier who did not author Plan 262-45 reproduce the non-secret roots and adversarially test the mechanics and wording. This is independent verification of evidence, not independent custody. [RECOMMENDED]

**Must prove:** exact contract/root joins, mutated bundle/commitment/event/request/receipt rejection, second-open rejection, dirty-tree/freeze mismatch rejection, seeded privacy leaks detected, misleading custody claims linted, historical terminal evidence unchanged, and no production/formation reachability. [RECOMMENDED]

### Plan 262-47 — Fresh ADMIT-03 route plan

**Purpose:** Separately plan one literal current-matrix reproduction successor from the reviewed current source while preserving every expired route, charged attempt, terminal root, and no-retry fact. The local-seal revision grants no matrix retry authority by itself. [VERIFIED: current ADMIT-03 blocker]

**Gate:** This plan requires its own explicit bounded execution authority and resource preflight. It may produce one new content-addressed branch only; it cannot mutate or reuse v5–v9 calibration/reproduction evidence. [RECOMMENDED from D-01/D-05]

### Plan 262-48 — Foundation activation join and phase verification

**Purpose:** Only if Plans 262-45/46 pass revised SEAL-01 and Plan 262-47 passes ADMIT-03, create the exact activation root binding policy, reproduction, local-seal, containment, and semantic/runtime identities. [RECOMMENDED]

**Must prove:** Phase 263 authority is the exact conjunction; policy readiness or local seal alone cannot compensate for failed ADMIT-03; formation remains separately blocked until Phase 266 freeze; all public/product authority remains false. [VERIFIED: dormant activation contract pattern]

If any plan fails, record the failure as terminal evidence and stop. Do not resurrect archived Plan 262-40, dormant 262-41, terminal Plan 262-42, or sentinel 262-43 as executable authority. [RECOMMENDED from D-01/D-02]

## Standard Stack

No new dependency, service, signer, database, cloud store, or package is required. Use Node's existing `node:crypto` and `node:fs` primitives, repository canonical-JSON/domain-separated identity helpers, Vitest, Git commits/hashes, and the existing boundary/privacy checkers. [VERIFIED: repository implementation and package manifests]

### Existing reusable pieces

| Piece | Reuse | Required change |
|---|---|---|
| `scripts/lib/v1-38-custody.ts` | Restricted store, exclusive writes, HMAC commitment, timing-safe compare, one-open state, event log, bounded projection, contamination, retirement. [VERIFIED: code] | Rename/reframe; add explicit pre-launch consumption, hash-chain/root joins, real local-seal data class, honest assurance fields. [RECOMMENDED] |
| `scripts/evaluate-v1-38-custody.test.ts` | Mutation, mode, symlink, traversal, second-open, mismatch, projection, and closed-export tests. [VERIFIED: tests] | Add crash-before-result, event deletion/reorder/fork, dirty freeze, claim-lint, and direct assurance-boundary tests. [RECOMMENDED] |
| `scripts/check-v1-38-authorized-custody-handoff.ts` | Exact validation pattern. [VERIFIED: code] | Do not adapt the external-approval schema; replace it with a distinct local-seal schema so old external claims cannot accidentally pass. [RECOMMENDED] |
| `v1.38-synthetic-custody-mechanics.json` | Mechanical baseline evidence. [VERIFIED: artifact] | Preserve unchanged as synthetic historical evidence; emit a new artifact/root for the real local-seal protocol. [RECOMMENDED] |
| pre-search policy/containment checkers | Root and authority conjunction patterns. [VERIFIED: existing tools] | Bind new local-seal roots without changing frozen metric/classifier/policy bytes. [RECOMMENDED] |

## Don't Hand-Roll

| Problem | Do not build | Use instead | Why |
|---|---|---|---|
| False organizational separation | Fake second user, role label, self-signed “external” envelope, or two directories controlled by the same operator | Explicit `single_operator_local_seal_v1` | Honest assurance is a core result. [VERIFIED: operator limitation] |
| New cryptographic stack | Custom cipher/signature/KMS emulation | Existing HMAC-SHA-256, SHA-256, timing-safe compare, canonical identity domains | Already implemented and tested; no package/trust expansion. [VERIFIED: code] |
| Mutable “latest” evidence | Overwritten receipt or store | Content-addressed commitment/request/receipt roots and new branch per change | Required by D-01. [VERIFIED: D-01] |
| Retry after crash | Reopen if no receipt appeared | Burn opening before launch and terminalize failure | One-shot claims must include failed execution. [RECOMMENDED from D-05/D-21] |
| Host surveillance claim | Pretend application logs observe all filesystem access | Bound claim to tool-mediated events plus operator declaration | A local process cannot attest all actions by its owner. [VERIFIED: threat model] |
| Secret retention in Git | Encrypted or salted preimages beside code | Restricted out-of-repo local store; Git receives opaque roots only | Keeps preimages and secrets outside public/default evidence. [VERIFIED: D-04] |

## Common Pitfalls

### Pitfall 1: Renaming custody without revising the binding contract

The activation prompt and REQUIREMENTS currently require separate permissioning. Code cannot satisfy revised SEAL-01 until those approved words change first. [VERIFIED: current activation prompt/REQUIREMENTS]

### Pitfall 2: Treating filesystem permissions as operator separation

Modes `0700`/`0600` prevent ordinary peer-user access but do not restrict the owning operator. Report them as accidental-exposure controls, not independent custody. [VERIFIED: POSIX ownership model as exercised by current code]

### Pitfall 3: Writing “opened” after work starts

If the process crashes before durable consumption, a second run could appear permissible. Persist and fsync `open_consumed` before launching the batch. [RECOMMENDED]

### Pitfall 4: Keeping raw access details in public evidence

Paths, usernames, actor IDs, queries, filenames, host details, and failure diagnostics can reveal the holdout or machine. Publish only allowlisted roots, counts, coarse status, and approved aggregates. [VERIFIED: D-04; AGENTS.md]

### Pitfall 5: Letting the local-seal revision waive ADMIT-03

The current-rules matrix reproduction is a separate Phase 262 latch. Revised SEAL-01 may pass while Phase 262 remains blocked. [VERIFIED: REQUIREMENTS/ROADMAP]

### Pitfall 6: Deleting the terminal pause history

Plan 262-42 truthfully recorded the old contract's impossibility. Preserve it and add a supersession edge from the newly approved contract; do not rewrite history. [VERIFIED: D-01; current assignment]

## Validation Architecture

Nyquist validation remains enabled. [VERIFIED: `.planning/config.json`]

### Test Framework

| Property | Value |
|---|---|
| Framework | Existing Vitest workspace and exact TypeScript checkers. [VERIFIED: repository] |
| Quick command | `pnpm exec vitest run scripts/evaluate-v1-38-local-seal.test.ts --maxWorkers=1` [RECOMMENDED] |
| Boundary command | `pnpm exec tsx scripts/check-v1-38-local-seal.ts --check && pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check` [RECOMMENDED] |
| Type command | `pnpm turbo typecheck --concurrency=1` [VERIFIED: repository workflow] |
| Phase gate | Exact revised requirements, local-seal root, ADMIT-03 root, containment/policy roots, absence/privacy scans, and phase-plan index all pass. [RECOMMENDED] |

### Requirement-to-test map

| Requirement | Automated proof |
|---|---|
| MEAS-10 | Exact policy/root equality plus changed-wording contract test; no metric/budget/threshold mutation. [RECOMMENDED] |
| SEAL-01 | State-machine, one-shot burn, event-chain, tamper, contamination, safe projection, privacy, and claim-lint tests. [RECOMMENDED] |
| ADMIT-03 | Separately planned canonical 540-cell reproduction; no credit from local-seal tests. [VERIFIED: requirement separation] |
| D-01/history | Protected-hash/supersession monitor covers Plans 262-40/42/43 and terminal artifact unchanged. [RECOMMENDED] |
| D-03/D-04 | Import/reachability/privacy scans prove no product/runtime/formation/preimage path. [VERIFIED: project boundary] |

### Wave 0 gaps

- [ ] New local-seal schemas, module, CLI, tests, artifact, and claim lint. [RECOMMENDED]
- [ ] Explicit `open_consumed` pre-launch state and crash/system-failure tests. [RECOMMENDED]
- [ ] Hash-chained event validation with deletion/reorder/fork tests. [RECOMMENDED]
- [ ] Contract consistency checker across activation prompt, REQUIREMENTS, ROADMAP, STATE, context, research handoff, and seed. [RECOMMENDED]
- [ ] Additive supersession monitor that preserves all terminal-pause hashes while archiving Plan 262-43. [RECOMMENDED]

## Security Domain

### Applicable ASVS categories

| Category | Applies | Control |
|---|---|---|
| V2 Authentication | Limited | One named repository operator; no claim of separate authenticated custodian. Local command authorization is process gating only. [RECOMMENDED] |
| V3 Session Management | No | No product session is introduced. [VERIFIED: scope] |
| V4 Access Control | Yes, limited assurance | Restricted local store, closed command surface, exclusive opening marker; explicitly not owner-resistant. [VERIFIED: mechanics; threat model] |
| V5 Input Validation | Yes | Exact-key bounded schemas for every commitment, request, event, receipt, and command. [VERIFIED: existing pattern] |
| V6 Cryptography | Yes | Existing HMAC/SHA-256/timing-safe compare; no custom crypto or signing trust. [VERIFIED: code] |
| V7 Error Handling | Yes | Stable typed reasons; failures charged; public projection remains coarse. [VERIFIED: D-05; privacy boundary] |
| V8 Data Protection | Yes | Preimages/secrets/paths/raw events stay out of Git and public/default output. [VERIFIED: D-04] |
| V12 Files and Resources | Yes | Absolute out-of-repo root, no-follow reads, restricted modes, bounded bytes, exclusive writes, fsync, no symlinks. [VERIFIED: code] |

### Threat register

| Threat | STRIDE | Mitigation | Residual truth |
|---|---|---|---|
| Post-commit bundle mutation | Tampering | Digest/HMAC verification, canonical bytes, exclusive writes, event root | Detected when tool verifies; owner could replace all local state and conceal it, so no malicious-owner claim. [VERIFIED/RECOMMENDED] |
| Second opening | Elevation of Privilege | Pre-launch consumed marker, exact ordinal 1, terminal state | Tool-mediated second open is rejected. [RECOMMENDED] |
| Event deletion/reorder | Tampering/Repudiation | Sequence plus previous-event hash and committed final ledger root | Detected at verification. [RECOMMENDED] |
| Premature operator inspection | Information Disclosure | Closed API, local permissions, operator declaration, contamination path | Deliberate out-of-tool access cannot be proven absent. [VERIFIED: threat model] |
| Post-result tuning | Tampering | Exact freeze roots in request/receipt; changed branch cannot inherit claim | Enforced for repository evidence. [RECOMMENDED] |
| Receipt leak | Information Disclosure | Exact allowlist, size/cardinality limits, privacy scanner, terminal invalid projection | Raw details never become accepted evidence. [VERIFIED existing mechanics] |
| Fake independent-custody claim | Spoofing | Schema forbids such fields; claim lint scans docs/artifacts | Independent custody remains unclaimed. [RECOMMENDED] |
| Local-store loss | Denial of Service | Treat as terminal process failure; no replacement/retry | Availability is sacrificed to preserve one-shot integrity. [RECOMMENDED] |

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. The local-seal filesystem tooling stays outside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Preserve the roadmap order and testing expectations; no Phase 263+ work begins until Phase 262 passes. [VERIFIED: AGENTS.md; ROADMAP]
- Keep planning documents committed when updated. [VERIFIED: AGENTS.md]

## Runtime State Inventory

| Category | Items found | Action required |
|---|---|---|
| Stored data | No real holdout store exists yet; only synthetic temporary-store tests and a synthetic mechanics artifact exist. [VERIFIED: repository scan] | Create the real store only in the later sealed-evaluation phase, never during Phase 262 mechanics tests. |
| Live service config | No external custody service exists. [VERIFIED: operator statement] | Remove it as a prerequisite; do not simulate it. |
| OS-registered state | None required. [VERIFIED: proposed architecture] | None. |
| Secrets/env vars | No approved external handoff or trust verifier exists. Commitment secret bytes enter only through `<absolute-local-seal-root>/input/commitment-secret.bin`, validated as owner-only and consumed once during commitment; they never enter CLI/env/log/artifact output. [DECIDED] | Fail closed if the restricted file contract or cleanup cannot be proved. |
| Build artifacts/packages | Existing Node/TypeScript workspace is sufficient. [VERIFIED: current code] | No installation. |

## Environment Availability

| Dependency | Required by | Available | Fallback |
|---|---|---|---|
| Node.js `crypto`/`fs` | Local seal | Yes; already compiled/tested in repository. [VERIFIED: code/tests] | None needed. |
| Git | Content-addressed public evidence | Yes; repository active. [VERIFIED: current checkout] | None. |
| Local filesystem outside repository | Private store | Yes in current environment, but real store path remains operator-local and unrecorded. [VERIFIED: existing tests create such stores] | Terminal failure if unavailable. |
| External custody/KMS/signer | None under revised model | Unavailable by operator statement. [VERIFIED] | Explicitly not required. |

## Assumptions Log

| # | Claim | Risk if wrong |
|---|---|---|
| A1 | The user's explicit instruction authorizes changing the future contract from external custody to `single_operator_local_seal_v1`. [VERIFIED: operator instruction] | None; the reduced assurance and exclusions remain binding. |
| A2 | The single-operator procedural seal is accepted despite its stated inability to resist a malicious machine owner. [VERIFIED: operator instruction] | None; implementations must not widen the accepted claim. |

## Resolved Decisions

1. **Revised assurance sufficiency:** the operator's explicit instruction accepts `single_operator_local_seal_v1` as the future SEAL-01 assurance model. It remains truthful only with every limitation above and does not retroactively change the former external-custody terminal history. [VERIFIED]
2. **Secret ingress:** use only `<absolute-local-seal-root>/input/commitment-secret.bin` under the exact owner/type/mode/size/no-follow/read-once/zero-fill/unlink/fsync contract above. Secret bytes never enter CLI, environment, logs, Git, tests, artifacts, or output. [DECIDED]
3. **Downstream sequencing:** local-seal verification does not unblock the milestone alone. ADMIT-03 remains a separate unmet latch and requires its own fresh route; activation is the exact conjunction. [VERIFIED: REQUIREMENTS/STATE]

## Sources

### Primary (HIGH confidence)

- Operator statement and current replan assignment, 2026-08-12.
- `AGENTS.md` — project boundaries and testing requirements.
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, and `.planning/config.json` — active milestone truth.
- `262-CONTEXT.md`, `262-NO-EXTERNAL-CUSTODY-RESEARCH.md`, `262-42-SUMMARY.md`, and `262-43-PLAN.md` — locked decisions and truthful terminal/sentinel history.
- `scripts/lib/v1-38-custody.ts`, `scripts/evaluate-v1-38-custody.test.ts`, and `scripts/check-v1-38-authorized-custody-handoff.ts` — existing local mechanics and former external handoff boundary.
- `.planning/artifacts/v1.38-synthetic-custody-mechanics.json` and `.planning/artifacts/v1.38-phase-262-terminal-deferment.json` — current mechanical and terminal evidence.
- v1.38 activation prompt, research summary, detailed handoff, and SEED-002 — contract surfaces requiring synchronization.

### Secondary (MEDIUM confidence)

- None. This is a repository-specific trust-model and contract decision; external product/library research is not needed.

### Tertiary (LOW confidence)

- None; A1–A2 and the secret-ingress choice are resolved by the operator instruction and this replan.

## Metadata

**Confidence breakdown:**

- Existing mechanics: HIGH — read directly from implementation and tests.
- Required contract edits: HIGH — exact conflicting text exists in active artifacts.
- Local-seal procedural guarantees: MEDIUM — enforceable through the tool but not against the owning operator.
- Independent custody/malicious-owner guarantees: NONE — explicitly excluded.
- ADMIT-03 disposition: HIGH — separately unmet in REQUIREMENTS/ROADMAP/STATE.

**Research date:** 2026-08-12  
**Valid until:** the operator changes the accepted trust model, the binding contract is revised differently, or Phase 262 implementation materially changes the local-seal mechanics.
