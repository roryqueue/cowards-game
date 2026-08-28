# Phase 262: Non-Recursive Review Integrity Correction and Fresh Consumer Re-review - Research

**Researched:** 2026-08-28
**Domain:** additive evidence-protocol correction, canonical preimage roots, external Git/file custody, pre-publication final-consumer review
**Confidence:** HIGH — the exact Plan-100 producer, Plan-101 checker/tests/canonical pair/review/summary, pending Plan 92, current Git lineage, prior repository circularity corrections, and destination absence were inspected directly; byte hashing and Git blob behavior were cross-checked against official Node.js and Git documentation. [VERIFIED: codebase and Git; CITED: https://nodejs.org/api/crypto.html, https://git-scm.com/docs/git-cat-file, https://git-scm.com/docs/gitdatamodel.html]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Milestone-wide integrity charter
- **D-01:** Evidence is immutable and content-addressed. There is no mutable `latest`; a changed input, policy, implementation, or result creates a new branch with a new root.
- **D-02:** Missing, stale, incompatible, contaminated, incomplete, mismatched, or non-reproducible evidence fails closed. Process/integrity failure is distinct from a process-valid empirical failure and blocks authoritative progress.
- **D-03:** The exact selected canonical `MATCH_KERNEL` remains the only transition authority, and hostile Strategy source remains behind the supervised runtime-service / Runtime Broker boundary. No copied rules, alternate scheduler, or Strategy execution in the coordinator, web, API, or Go is permitted.
- **D-04:** Lab evidence remains private and unreachable from production registration, persistence, scheduling, Chronicle, replay, standings, and public/default surfaces. Only exact eligible pre-formation current-league source hashes may later enter ordinary certification.
- **D-05:** Every attempt, retry, rejection, invalid output, duplicate, failure, system failure, and unused allocation remains charged and visible in its proper evidence ledger; accepted evidence cannot omit inconvenient work.
- **D-06:** Cycle-cap, MOVE/reversal, Backstab geometry/timing, scan timing, arena, runtime, product/public, and combined-rule changes remain unavailable in v1.38.

### Exact predecessor admission
- **D-07:** Authoritative v1.38 work begins only after a machine-checked join resolves the v1.37 audit, exact archive commit, annotated `v1.37` tag, independent post-tag result, and exact selected semantic/runtime authority tuple. Copied labels are not authority.
- **D-08:** The immutable v1.37 archive commit remains the release authority. Later non-semantic corrections are recorded as separate lineage and may inform current correctness checks, but they do not move, recreate, or silently reinterpret the tag or archived evidence.
- **D-09:** Any failed join, stale certificate, incompatible identity, semantic drift, or unexplained reproduction mismatch emits an explicit stop disposition back to the integrity foundation. Phase 262 must not normalize or repair the predecessor inside v1.38.
- **D-10:** Reproduce the persisted current-rules matrix's declared shape and expected results through the selected canonical kernel and supervised execution path. The audit script's `new Function` loader is historical reproduction material, not an execution mechanism to reuse. Starter and Advanced Strategies remain smoke, regression, and throughput fixtures only.

### Frozen measurement and budget contract
- **D-11:** Before inspecting candidate output, freeze one immutable contract for the primary estimand—separately adapted formation-specific metagames under the fixed factory—and the bracket/current, inward/current, and bracket/inward contrasts. Fixed-policy transfer is explicitly secondary screening.
- **D-12:** The contract fixes complete cells, scoring, draw value, both sides, both entrant-level initiative states, semantically distinct design arenas, all splits and opponent fields, matched root-seed blocks, stopping and response admission, finalist eligibility/cardinality, portfolio selection, robust-pure selection, and permitted claims.
- **D-13:** Freeze a multi-resource opportunity vector rather than a single fungible compute scalar: attempted candidates, accepted response slots and unfilled-slot disposition, response rounds, search/teacher/distillation work, Matches, model attempts/tokens, human effort/submissions, replay review, cache policy, retries, hardware class, runtime, source, objective, memory, and output limits.
- **D-14:** Contained profile-neutral calibration spikes may refine structural work units, denominators, retry/burn rules, and starting numeric gates before search. Direct Strategy work must be distinguished from provider, orchestration, and infrastructure overhead. Candidate outcomes may not influence calibration.
- **D-15:** The activation prompt's 64 KB hard source cap, preferred under-48 KB target, below-5 ms p99 starting target, population/core/finalist counts, response thresholds, probe threshold, red-team threshold, and Advanced-library regression threshold are calibration inputs. Any replacement value and its exact denominator must be justified and frozen before candidate output is inspected.
- **D-16:** Zero accepted runtime violations, system failures, legal-information violations, private-data leaks, missing cells, duplicate/conflicting results, or unproved identity joins is a hard evidence condition. System-failed work remains charged but can never be converted into gameplay or an accepted cell.
- **D-17:** Metric code, canonicalization, normalization, denominators, replication treatment, materiality thresholds, hard versus compensating gates, classifier fixtures, response/finalist rules, and report language are hashed with the contract. A composite result cannot override a mandatory integrity or rejection gate.
- **D-18:** Reports maintain separate fields for `process_status`, current-rules outcome, formation rejection/pass, and holdout contamination. A valid empirical failure is publishable evidence; threshold softening, selective failure omission, or stronger-than-oracle-relative claims are not.

### Holdout custody and pre-formation containment
- **D-19:** A separately permissioned custodian and private store control the holdout preimages and commitment material. The iterative experiment coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt after the authorized batch.
- **D-20:** Holdout lineage must prove that source data, training data, prompts, caches, opponent construction, and schedule construction contain no profile-conditioned or current-trained input. Custody records the named role, authorized opening actor, access/query ledger, storage identity, safe projection, contamination response, retention, and retirement.
- **D-21:** Premature access, unauthorized query, commitment mismatch, uncertain evaluator state, or disclosure outside the frozen safe projection is contamination, not a diagnostic opportunity. It follows the precommitted invalidation/reporting path and cannot be repaired with a replacement or second holdout.
- **D-22:** Precommit the literal current-edge, full-inward, and edge-anchored-bracket coordinates, unchanged inward facings, equal-compute dimensions, telemetry, causal classifiers, and hard rejection logic now. Only profile-agnostic schemas, metric code, and synthetic positive/negative/mirrored/obfuscated fixtures may exist before the valid Phase 266 current-league freeze.

### Decision Revision: single-operator local seal (2026-08-12)
- **D-19R:** For future routing, D-19 is superseded by the operator-approved `single_operator_local_seal_v1` assurance class. One named `repository_operator` controls a restricted out-of-repository local holdout store and one closed opening command. The coordinator receives only a profile-agnostic commitment before opening and one bounded safe receipt afterward. This is process separation, not independent custody, and it makes no independent/third-party custody, separate-permissioning, non-collusion, comprehensive-host-monitoring, cryptographic-erasure, forensic-deletion, or malicious-owner-resistance claim.
- **D-20R:** For future routing, D-20 retains the profile-neutral lineage, frozen source/training/prompt/cache/opponent/schedule exclusions, tool-mediated access/query ledger, safe projection, terminal contamination, retention, and retirement requirements while naming the role `repository_operator`. Commitment-secret ingress is only `<absolute-local-seal-root>/input/commitment-secret.bin`, under owner-only `0700` ancestors as an effective-UID-owned regular non-symlink `0600` file of 32..4096 bytes. It is opened no-follow, validated, read once during commitment, zero-filled in process, unlinked, and followed by parent fsync before success; uncertainty fails closed and bytes never enter CLI, environment, logs, Git, tests, receipts, artifacts, or output.
- D-19 and D-20 remain visible above as truthful historical requirements and continue to describe the terminal Plan 262-40/42/43 branch. D-19R and D-20R supersede them only for successor Plans 262-44 through 262-48; they grant no ADMIT-03, SEAL-01, candidate-search, Phase 263, formation, holdout-opening, public, activation, or production authority.
- ADMIT-03 remains blocked and revised SEAL-01 remains pending until independently verified local-seal mechanics and one fresh literal 540/540 reproduction pass are joined exactly.

### Decision Revision: bounded standing retry authority (2026-08-27)
- **D-23R:** The operator authorizes an additive successor retry route and supersedes the prior no-retry admission rule for future Phase 262 work. This is standing authority for the precommitted bounded retry envelope selected by research and planning; it does not require a new operator literal for each route ordinal or attempt inside that envelope.
- **D-24R:** Every prior authorization, route, calibration identity, consumption marker, terminal result, and charged allocation remains immutable, non-retryable, and non-reusable. The successor contract must use fresh versioned destinations and attempt identities, preserve cumulative accounting, and bind the exact source and policy lineage before any execution.
- **D-25R:** The retry envelope must be finite and frozen before its first live attempt. It must terminate on the first literal 540/540 accepted reproduction, any integrity or contamination failure, or exhaustion of its declared attempt/resource/time bounds. It may not soften the 200 ms sampling rule, inclusive 2,500-basis-point gate, eight-attempt/four-shard calibration allocation, conditional 540-cell reproduction, canonical runtime/kernel predicates, or any gameplay, privacy, and formation-absence bound after observing results.
- **D-26R:** The assurance class remains `single_operator_local_seal_v1`; the retry revision makes no independent-custody claim. No candidate search, Phase 263 work, formation materialization, holdout opening, public/canonical publication, activation, production, or counted-play authority exists until an independently checked successor joins a valid seal with a fresh literal 540/540 result.
- **D-27R:** The completed Plan 262-74 obstruction and all earlier route branches remain truthful archived history. The successor must be planned and reviewed additively and must not revive Plan 262-62, its obsolete review paths, or any consumed no-retry authorization bytes.

### Decision Revision: one additional bounded envelope (2026-08-27)
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

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ADMIT-03 | Reproduce the persisted current-rules audit matrix before candidate search; Starter and Advanced remain non-balance fixtures. [VERIFIED: `.planning/REQUIREMENTS.md`] | Repair only the review-integrity gate before the still-inactive envelope; Plans 102/103 create no Match, cell, reproduction, or empirical credit. [PRESCRIPTIVE] |
| ADMIT-04 | Missing, stale, incompatible, or drifting authority stops work without in-milestone normalization. [VERIFIED: `.planning/REQUIREMENTS.md`] | Preserve Plans 100/101 and their blocked v5 carrier exactly; require a new source commit, schema, carrier, and independent review. [PRESCRIPTIVE] |
| MEAS-02 | Preserve frozen budget, retry, runtime, source, and hardware identities. [VERIFIED: `.planning/REQUIREMENTS.md`] | Change only review-integrity representation and the successor consumer path; D-29R policy, capacity identities, runtime/kernel, and v3 live destinations remain unchanged. [PRESCRIPTIVE] |
| MEAS-04 | Accepted evidence requires zero system, privacy, and identity defects. [VERIFIED: `.planning/REQUIREMENTS.md`] | Require consumer/reviewer canonical-preimage agreement, exact external file SHA/blob custody, full closure equality, actual final-consumer success, and literal zero findings. [PRESCRIPTIVE] |
| MEAS-09 | Distinguish integrity failure from clean empirical non-pass/pass. [VERIFIED: `.planning/REQUIREMENTS.md`] | Plan 101 remains a one-finding integrity stop at `0/0`; Plans 102/103 do not convert it into empirical evidence. [VERIFIED: Plan-101 closeout; PRESCRIPTIVE] |
| MEAS-10 | Preserve private, profile-neutral, non-authorizing procedure. [VERIFIED: `.planning/REQUIREMENTS.md`] | Plan 102 is source/synthetic only and Plan 103 is isolated review only; neither accesses Strategy, formation, holdout, secret, or live inputs. [PRESCRIPTIVE] |
| SEAL-01 | Preserve the `single_operator_local_seal_v1` claim boundary. [VERIFIED: `.planning/REQUIREMENTS.md`] | No custody claim changes and no seal is created; revised Plan 92 remains the first inactive seal/envelope publication. [PRESCRIPTIVE] |
</phase_requirements>

## Summary

Plan 101 correctly stopped because `execution.actualConsumerCandidateJsonSha256` was required to equal the SHA-256 of the final candidate JSON while that digest was itself a field in those same final bytes. Its checker therefore substituted a deterministic sentinel, published the exact blocked v5 pair, exercised the expected rejection branch, and kept Plan 92 ineligible at fresh `0/0`. [VERIFIED: `scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts`; `262-101-REVIEW.md`; `262-101-SUMMARY.md`; canonical v5 JSON]

The correction must not edit any Plan-100 or Plan-101 file. Plan 100's three source files are explicitly recorded with `noLaterRewrite:true`, and Plan 101 says any continuation requires a separately planned additive protocol/source correction and fresh review at new immutable destinations. The current main lineage ends at the Plan-101 summary commit, while seal-v13, retry-envelope:v3, and every live/downstream destination remain absent. [VERIFIED: Plan-100/101 artifacts and summaries; Git `HEAD` `72e62d48`; destination scan]

The minimal satisfiable replacement is a directed two-layer integrity graph. The inner candidate carries a domain-separated `candidatePayloadRoot` computed over its canonical object with only `candidatePayloadRoot` omitted; it contains no claim about its own whole-file SHA-256 or Git blob. The outer review carrier, whose bytes are created only after the candidate bytes exist, records the candidate's exact path, mode, byte length, SHA-256, Git blob OID, payload root, report custody, actual-consumer observation, protected Plan-100/101 history, literal-zero finding state, and Plan-92-only eligibility. The outer carrier has its own domain-separated `carrierRoot` computed over the carrier with only `carrierRoot` omitted; it does not contain its own file SHA/blob. [PRESCRIPTIVE; repository pattern VERIFIED: `scripts/run-v1-38-bounded-retry-envelope-v3.ts` result-root exclusion and `.planning/STATE.md:291-300`; byte behavior CITED: https://nodejs.org/api/crypto.html, https://git-scm.com/docs/gitdatamodel.html]

**Primary recommendation:** execute `Plan 101 blocked history -> Plan 102 additive source/synthetic non-recursive consumer -> Plan 103 fresh independent v6 review with an actual disposable-commit final-consumer pass -> revised Plan 92`. Publish the new candidate JSON, REVIEW, and external carrier together only after the actual consumer has accepted byte-identical candidates in the owner-only isolated clone; any disagreement or finding publishes a new blocked Plan-103 result and stops. [PRESCRIPTIVE]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Canonical semantic review identity | Offline evidence/control plane | Node byte hashing | The candidate owns semantic review content and one non-recursive domain-separated preimage root, not whole-file self-custody. [PRESCRIPTIVE] |
| Exact candidate file custody | External review carrier | Git object store | SHA-256, blob OID, mode, byte length, and path are knowable only after candidate bytes exist and therefore belong outside the candidate. [PRESCRIPTIVE; CITED: https://git-scm.com/docs/gitdatamodel.html] |
| Consumer/reviewer agreement | Plan-102 consumer plus Plan-103 independent checker | Synthetic fixtures | Both implementations must produce the same preimage bytes/root and reject one-byte, key-set, domain, canonicalization, and exclusion drift. [PRESCRIPTIVE] |
| Actual final-consumer observation | Plan-103 isolated review | Plan-102 production consumer | The exact production no-publish derivation runs against a disposable commit containing the exact candidate trio before canonical zero publication. [PRESCRIPTIVE; pattern VERIFIED: Plan 101] |
| Inactive seal/envelope publication | Revised Plan 92 only | Git custody | Plans 102/103 establish review eligibility only and cannot publish seal, envelope, live, or downstream evidence. [VERIFIED: pending Plan 92 semantics; PRESCRIPTIVE] |

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, side-effect free, and free of `Math.random`, `Date.now`, system time, filesystem, network, and database access. This correction stays in offline evidence tooling and does not touch engine logic. [VERIFIED: `AGENTS.md`; scoped inference]
- Do not put game rules in React, execute Strategy code in web/API/Go, or use Node `vm` as a security boundary. Plans 102/103 touch none of those surfaces. [VERIFIED: `AGENTS.md`; scoped inference]
- Treat Strategy code as hostile, validate every runtime boundary with schemas, preserve canonical terminology, and preserve immutable submitted Strategy Revisions. The new review schema remains strict and closed. [VERIFIED: `AGENTS.md`; PRESCRIPTIVE]
- Public replay must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads. The proposed artifacts contain only evidence metadata, roots, exact source/reviewer custody, and false broader-authority fields. [VERIFIED: `AGENTS.md`; PRESCRIPTIVE]
- Engine, replay, runtime, worker, and end-to-end test expectations remain binding but are not invoked because this is source/synthetic offline evidence work with no Match or replay creation. [VERIFIED: `AGENTS.md`; scoped inference]
- Follow roadmap order and keep updated planning documents committed. [VERIFIED: `AGENTS.md`]

## Root-Cause Analysis

### Exact impossible edge

The v5 candidate builder assigns `actualConsumerCandidateJsonSha256` a sentinel because the required exact value would change the candidate bytes whose digest is being computed. The final candidate validation then requires the same sentinel, while the production consumer requires a literal zero-finding/eligible v5 shape and rejects the blocked object. [VERIFIED: Plan-101 checker `candidateCorrelation`, `buildReview`, and validator; Plan-100 consumer `validatePlan262101Envelope`]

The defect is representational, not a failure of SHA-256, raw Git custody, or canonical JSON. Plan 101 authenticated Plan-100 raw blob/mode behavior and then truthfully found that the schema placed exact file custody inside the file being custodied. [VERIFIED: Plan-101 REVIEW and SUMMARY]

### Repository-consistent correction

Earlier Phase 262 work already established the applicable rule: production source must not predict its own commit or summary carrier; a later reviewer supplies and authenticates detached immutable identity. That branch used exact carrier commit/tree/path/blob/mode/SHA/length records to avoid circular source identity. [VERIFIED: `.planning/STATE.md:291-300`; `262-60-PLAN.md`; Plan-60 code-review history]

The same rule should now be applied one level lower: a candidate may authenticate its canonical semantics, but its exact final file hash/blob must be supplied by a later external carrier. [PRESCRIPTIVE]

## Recommended Additive Plan Topology

| Plan | Wave | Depends on | Exact responsibility | Authority result |
|---|---:|---|---|---|
| 262-102 | 84 | 262-101 | Add new versioned non-recursive consumer/protocol source and focused synthetic tests without editing any Plan-100/101 path. [PRESCRIPTIVE] | No review verdict, canonical artifact, seal, envelope, live action, charge, acceptance, lifecycle mutation, or downstream authority. [PRESCRIPTIVE] |
| 262-103 | 85 | 262-102 | Fresh independent exact-source review at new v6 candidate/carrier destinations; run the actual new no-publish consumer in an owner-only isolated committed checkout before canonical zero publication. [PRESCRIPTIVE] | Literal zero may make only Plan 92 eligible; any finding publishes a blocked v6 carrier and stops. [PRESCRIPTIVE] |
| 262-92 | 86 | 262-103 | Revise the pending plan to consume Plan-102 source and Plan-103 carrier while preserving Plans 98-101 as protected non-authorizing history. [PRESCRIPTIVE] | Plan-93-only eligibility, inactive and zero-consumption. [VERIFIED: pending Plan-92 semantics] |
| 262-93 | 87 | 262-92 | Existing sole bounded live owner, revised only for new reviewed-source custody. [VERIFIED: existing Plan 93] | Live evidence only; no independent admission. [VERIFIED: existing plan] |
| 262-94 | 88 | 262-93 | Existing independent adjudication and exact-pass-only reproduction/Route-11 publication. [VERIFIED: existing Plan 94] | Branch-dependent evidence; no broader authority without exact clean pass. [VERIFIED: existing plan] |
| 262-95 | 89 | 262-94 | Existing validation/verification/lifecycle closeout. [VERIFIED: existing Plan 95] | Only the exact joined pass may complete Phase 262. [VERIFIED: existing plan] |

Current active discovery is 82 plans and 78 summaries; adding Plans 102/103 makes 84 active plans, and completing both before the four pending plans yields a final 84-summary topology. The planner must update lifecycle fixtures and status carriers to those exact counts rather than merely shifting wave numbers. [VERIFIED: ROADMAP/STATE current counts; PRESCRIPTIVE]

## Standard Stack

### Core

| Component | Version / identity | Purpose | Why standard here |
|---|---|---|---|
| Node.js | existing repository runtime | Hash exact canonical `Buffer` preimages and execute TypeScript tooling | `Hash.update` accepts `Buffer`/typed bytes, so roots can be computed without text normalization. [CITED: https://nodejs.org/api/crypto.html] |
| Existing canonical JSON encoder | Plan-100 controller implementation | Produce the unique candidate and carrier preimage byte sequence | Reuse the exact existing canonicalization rules; the correction changes field ownership, not encoding. [VERIFIED: `encodeV138RetryV3CanonicalJson` usage] |
| Git `/usr/bin/git` | authenticated existing executable | Commit disposable candidates and authenticate blob OIDs/raw bytes/modes | Git stores file content as blobs and identifies objects by cryptographic hash of type/content; `cat-file blob` returns raw uncompressed content. [CITED: https://git-scm.com/docs/gitdatamodel.html, https://git-scm.com/docs/git-cat-file] |
| Existing raw Git custody helper | exact Plan-100 blob | Preserve raw committed bytes and tracked regular-file modes | Plan 101 found no defect in the corrected raw-byte/mode seam; it may be reused unchanged by the new versioned consumer. [VERIFIED: Plan-101 REVIEW/SUMMARY] |
| TypeScript, Vitest, tsx | installed project dependencies | Strict schemas, adversarial fixtures, and actual CLI exercise | Existing repository stack; no package installation or upgrade is required. [VERIFIED: `package.json`, Plan-100/101 commands] |

### Supporting

| Component | Purpose | When to use |
|---|---|---|
| Domain-separated candidate payload root | Authenticate canonical semantic content without self-file custody | Inner candidate only; omit exactly `candidatePayloadRoot` from the preimage and reject every other omission. [PRESCRIPTIVE] |
| External review carrier | Bind candidate/report path, mode, byte length, SHA-256, Git blob, roots, consumer observation, history, and eligibility | Create only after exact candidate/report bytes exist; do not include the carrier's own file SHA/blob. [PRESCRIPTIVE] |
| Owner-only `git clone --no-local --no-checkout` | Disposable exact candidate commit | Run the actual Plan-102 final no-publish consumer before publishing a zero carrier. [VERIFIED: Plan-101 pattern; PRESCRIPTIVE] |
| Cross-implementation golden fixtures | Prove reviewer and consumer agree | Cover reordered keys, nested values, omitted/extra keys, one-byte drift, wrong domain, wrong exclusion set, binary report bytes, and external SHA/blob mismatch. [PRESCRIPTIVE] |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| Inner payload root plus outer carrier | Search for a whole-file SHA-256 fixed point | Rejected: it is computationally inappropriate and unnecessary; evidence schemas should form an acyclic dependency graph. [PRESCRIPTIVE; root cause VERIFIED: Plan 101] |
| New Plan-102 source paths | Edit the Plan-100 controller/test in place | Rejected: Plan 100 records `noLaterRewrite:true`, and Plan 101 requires a separately planned additive correction. [VERIFIED: canonical v5 JSON and Plan-101 SUMMARY] |
| New v6 carrier | Reinterpret the blocked v5 pair as zero findings | Rejected by D-01/D-02/D-24R and the explicit Plan-101 blocked verdict. [VERIFIED: CONTEXT and Plan-101 closeout] |
| External carrier file | Put a placeholder/zeroed self-hash field in the candidate and hash normalized bytes | Rejected: placeholder normalization creates a bespoke hidden preimage rule and can diverge between reviewer and consumer. [PRESCRIPTIVE] |
| Exact candidate SHA plus Git blob | Record only Git blob OID | Rejected for this repository contract: both SHA-256 and Git blob identity are already used as complementary custody facts, and the SHA-256 is portable outside Git's object-format choice. [VERIFIED: existing source custody records; PRESCRIPTIVE] |
| Independent checker implementation | Import only the consumer's root function and trust it | Rejected as sole verification: shared-code agreement can reproduce the same exclusion/domain bug. The reviewer should independently compute the root and cross-check golden preimages. [PRESCRIPTIVE] |

**Installation:** none. Plans 102/103 must use only existing Node, Git, TypeScript, tsx, Vitest, canonical JSON, and raw custody components. [PRESCRIPTIVE]

## Package Legitimacy Audit

No external package installation is required, so the package-legitimacy gate is not applicable. [VERIFIED: recommended stack uses installed project/toolchain components]

## Architecture Patterns

### System Architecture Diagram

```text
Immutable protected history
Plan 100 source + Plan 101 blocked v5 JSON/REVIEW/SUMMARY
                         |
                         v
Plan 102 additive source/synthetic consumer (new paths only)
  |-- canonical candidate preimage = candidate minus candidatePayloadRoot
  |-- candidatePayloadRoot = SHA256(candidate-domain || NUL || canonical(preimage))
  |-- no candidate whole-file SHA/blob field
  `-- external-carrier validation + unchanged seal/envelope derivation core
                         |
                         v
Plan 103 fresh independent reviewer in owner-only isolated clone
  |-- independently derive exact candidate preimage/root
  |-- render REVIEW without candidate file SHA or candidatePayloadRoot recursion
  |-- serialize exact candidate bytes
  |-- derive candidate SHA-256 + Git blob OID + mode + byte length
  |-- build external carrier and carrierRoot (carrier minus carrierRoot)
  |-- commit exact candidate + REVIEW + carrier in disposable clone
  |-- run actual Plan-102 --derive-seal-envelope-no-publish
  |      |-- reject/disagree -> publish blocked v6 carrier; STOP
  |      `-- exact success + unchanged destinations/closure
  `-- only then publish byte-identical zero candidate/REVIEW/carrier
                         |
                         v
Revised Plan 92 -> Plan 93 -> Plan 94 -> Plan 95
inactive pair       live       judge       lifecycle
```

No edge enters engine logic, Strategy execution, a holdout store, public replay, or Phase 263. [VERIFIED: scoped source and requested boundaries; PRESCRIPTIVE]

### Recommended Project Structure

```text
scripts/
├── lib/
│   └── v1-38-plan-262-103-nonrecursive-review-contract-v1.ts
├── run-v1-38-bounded-retry-envelope-v3-review-v6.ts
├── run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts
├── check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.ts
└── check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts
.planning/
├── artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json
├── artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json
└── phases/.../
    ├── 262-103-REVIEW.md
    └── 262-103-SUMMARY.md
```

Plan 102 owns the first three new source/test files and modifies no existing Plan-100/101 path. Plan 103 owns the two new checker files plus the new candidate/carrier/report destinations. Exact names may be shortened by the planner, but schema/path/domain literals must be unique and fixed before implementation. [PRESCRIPTIVE]

### Pattern 1: Explicit canonical preimage, not normalized self-hash

**What:** clone the complete candidate object, delete exactly `candidatePayloadRoot`, canonicalize the remainder, prepend one frozen domain and NUL separator, then hash those exact bytes. Reject a candidate containing `candidateJsonSha256`, `fileSha256`, `blobOid`, or any alternate exclusion list. [PRESCRIPTIVE]

**When to use:** candidate semantic identity in both Plan-102 consumer and Plan-103 checker. [PRESCRIPTIVE]

### Pattern 2: External exact-file custody

**What:** after candidate/report bytes exist, compute their exact SHA-256, byte length, Git blob OID, and regular mode, then put those values in a separate carrier. Compute `carrierRoot` over the canonical carrier with only `carrierRoot` omitted. Never require the carrier to contain its own whole-file digest or commit OID. [PRESCRIPTIVE; Git behavior CITED: https://git-scm.com/docs/gitdatamodel.html]

**When to use:** Plan-103 candidate publication and every revised Plan-92 custody check. [PRESCRIPTIVE]

### Pattern 3: Candidate-first actual final-consumer gate

**What:** build the exact three candidate files in memory, commit them in the isolated clone, verify raw Git blobs equal the intended bytes, run the actual new no-publish consumer, re-check the full local closure and every forbidden destination, then publish the same bytes canonically only on literal success. [PRESCRIPTIVE; pattern VERIFIED: Plan 101]

**When to use:** the only zero-finding Plan-103 publication branch. A failed actual consumer produces a new blocked v6 carrier with Plan-92 eligibility false. [PRESCRIPTIVE]

### Anti-Patterns to Avoid

- **Placeholder self-hash normalization:** zeroing/removing an arbitrary nested file-hash field creates another bespoke implicit preimage. Use one named top-level payload-root exclusion and external file custody. [PRESCRIPTIVE]
- **Carrier records its own SHA/blob/commit:** that recreates the same circularity at the outer layer. Later plans or Git history may custody the carrier externally. [PRESCRIPTIVE]
- **Edit Plan-100/101 source or evidence:** current working paths as well as Git history must stay exact. Use only new versioned source and artifact paths. [VERIFIED constraint: Plan-101 SUMMARY]
- **Reviewer calls consumer helper for both expected and actual roots:** this is not an independent agreement test. Use separate implementations plus shared golden bytes. [PRESCRIPTIVE]
- **Publish zero then probe:** Plan 99/101 show that post-publication discovery strands another immutable invalid carrier. The actual final-consumer run must precede canonical zero publication. [VERIFIED: Plan-99/101 history]
- **Treat Plan-101 blocked consumer success as evidence:** its expected rejection proves fail-closed behavior only; it grants no credit toward the new review. [VERIFIED: Plan-101 closeout]

## Exact Integrity Contract

### Inner candidate v6

Required shape: one closed top-level object containing the existing corrected-source, protected-history, execution-closure, findings, identity-claims, and false broader-authority semantics; `candidatePayloadRoot` is its only self-derived root field. [PRESCRIPTIVE]

Root equation: `SHA256("v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6\0" || canonical(candidate without candidatePayloadRoot))`. The `without` operation removes exactly one own top-level property; it does not blank values, remove the execution object, or ignore unknown fields. [PRESCRIPTIVE]

The candidate must omit exact whole-file SHA-256, Git blob OID, and candidate commit identity. It may retain domain-separated finding, report, portable-closure, and semantic result roots when their preimages are acyclic and exactly specified. [PRESCRIPTIVE]

### Outer carrier v1

Required carrier entries for the candidate and REVIEW are `path`, `mode`, `byteLength`, `sha256`, and `blobOid`; candidate custody also records `candidatePayloadRoot`. The carrier additionally records exact Plan-102 source commit/tree/parent/files, exact Plan-100/101 protected history, literal findings/status, the actual consumer's deterministic output/observation root, before/after closure equality, destination equality, cleanup, zero writes, zero charge/acceptance, Plan-92-only eligibility, and exhaustive false broader authority. [PRESCRIPTIVE]

Carrier equation: `SHA256("v1.38:plan-262-103:git-object-byte-custody:carrier:v1\0" || canonical(carrier without carrierRoot))`. The carrier must not contain `carrierSha256`, `carrierBlobOid`, or its own commit identity. [PRESCRIPTIVE]

### Agreement gate

The Plan-102 consumer and Plan-103 reviewer must independently yield byte-identical candidate preimages and the same `candidatePayloadRoot`. The consumer must then authenticate the outer carrier's exact candidate/report SHA/blob/mode/length against the committed disposable checkout before it reaches seal/envelope derivation. [PRESCRIPTIVE]

The actual no-publish derivation output must equal the reviewer's expected deterministic result, must write zero canonical files, must preserve the full execution-closure root before/after, and must leave every seal/envelope/live/downstream destination absent. Only that conjunction permits the canonical zero carrier. [PRESCRIPTIVE]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Exact byte hashing | Stringified/trimmed digest helpers | Node `createHash("sha256").update(Buffer)` | Exact byte inputs avoid encoding normalization. [CITED: https://nodejs.org/api/crypto.html] |
| Git blob identity | Filename-only or worktree-only identity | Existing raw `ls-tree -z` / `cat-file blob` custody | It authenticates type, mode, object identity, and exact committed bytes. [VERIFIED: Plan-100 source; CITED: https://git-scm.com/docs/git-cat-file] |
| Canonical JSON | A second serializer or JSON replacer convention | Existing v3 canonical encoder | One encoder avoids reviewer/consumer ordering and number/string drift. [VERIFIED: repository source] |
| Self-file integrity | Fixed-point search or placeholder normalization | Inner canonical payload root plus outer exact-file carrier | The dependency graph is acyclic and every value is constructible in order. [PRESCRIPTIVE] |
| Review isolation | Linked worktree or mutable main checkout | Existing owner-only no-local clone pattern | It isolates object storage and candidate commits while keeping canonical destinations untouched. [VERIFIED: Plan-101 implementation] |

**Key insight:** semantic identity and physical file custody are different layers. The candidate may own the former; only a later carrier can own the latter without recursion. [PRESCRIPTIVE]

## Runtime State Inventory

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | None — this correction reads repository artifacts and Git objects only; no database/datastore key is renamed or migrated. [VERIFIED: scoped source and plans] | None. [VERIFIED] |
| Live service config | None — no service/UI-held configuration participates in Plans 102/103. [VERIFIED: requested source/synthetic/review scope] | None. [VERIFIED] |
| OS-registered state | None — no launchd/systemd/task/process registration contains the protocol names. [VERIFIED: scoped dependency inventory] | None. [VERIFIED] |
| Secrets/env vars | No new secret or environment variable; local-secret access must remain false and the isolated environment remains hardened. [VERIFIED: Plan-101 pattern; PRESCRIPTIVE] | Preserve current denial and mutation coverage. [PRESCRIPTIVE] |
| Build artifacts / installed packages | Existing Node modules/toolchain only; no package or generated build artifact requires migration. [VERIFIED: package and plan inspection] | Run typecheck/focused tests; install nothing. [PRESCRIPTIVE] |

## Common Pitfalls

### Pitfall 1: Moving the recursion instead of removing it
**What goes wrong:** the outer carrier is required to contain its own file digest/blob/commit. [PRESCRIPTIVE risk]
**Why it happens:** file custody and semantic root are treated as one layer. [PRESCRIPTIVE analysis]
**How to avoid:** carrier root excludes only itself; its own exact file custody belongs to revised Plan 92 or later Git lineage. [PRESCRIPTIVE]
**Warning signs:** names such as `carrierSha256`, `selfBlob`, or `carrierCommit` inside the carrier schema. [PRESCRIPTIVE]

### Pitfall 2: Candidate/report root cycle
**What goes wrong:** REVIEW text includes `candidatePayloadRoot` while the candidate includes `reviewRoot`, so each changes the other. [PRESCRIPTIVE risk]
**Why it happens:** report rendering order is not specified. [PRESCRIPTIVE analysis]
**How to avoid:** render REVIEW from semantic roots that do not depend on `candidatePayloadRoot`; compute `reviewRoot`, then compute `candidatePayloadRoot`, then let the outer carrier record both. [PRESCRIPTIVE]
**Warning signs:** iterative report/candidate rendering or a loop attempting to stabilize roots. [PRESCRIPTIVE]

### Pitfall 3: Shared implementation masquerades as agreement
**What goes wrong:** reviewer and consumer call the same buggy exclusion/root helper and tests pass. [PRESCRIPTIVE risk]
**Why it happens:** deduplication is valued over independent verification. [PRESCRIPTIVE analysis]
**How to avoid:** retain a small normative schema module if useful, but independently compute reviewer and consumer roots and compare exact golden preimage bytes. [PRESCRIPTIVE]
**Warning signs:** mutation tests change the shared helper and both expected/actual values change together. [PRESCRIPTIVE]

### Pitfall 4: Whole-file digest from worktree only
**What goes wrong:** external SHA matches current bytes but not the committed candidate blob/mode. [PRESCRIPTIVE risk]
**Why it happens:** Git custody is reduced to filesystem hashing. [PRESCRIPTIVE analysis]
**How to avoid:** require path/mode/blob/length/SHA and raw committed-to-working `Buffer.equals`. [VERIFIED pattern: Plan 100; PRESCRIPTIVE]
**Warning signs:** no `ls-tree -z`, `cat-file blob`, or no-follow comparison in the final consumer. [PRESCRIPTIVE]

### Pitfall 5: Zero publication precedes real consumer success
**What goes wrong:** a syntactically valid zero carrier is committed before the production derivation rejects it. [VERIFIED historical risk: Plan 99]
**Why it happens:** helper tests are treated as equivalent to actual consumer execution. [VERIFIED: Plan-99/101 history]
**How to avoid:** disposable exact commit, real no-publish CLI, before/after full-root check, destination snapshot, then canonical publication. [PRESCRIPTIVE]
**Warning signs:** the canonical write occurs before `spawnSync`/subprocess status and output correlation are checked. [PRESCRIPTIVE]

## Code Examples

Verified/prescriptive patterns for planning:

### Candidate semantic root

```typescript
// Source behavior: https://nodejs.org/api/crypto.html
// Domain/schema are prescriptive for the successor contract.
const candidatePayloadRoot = (candidate: Record<string, unknown>): Sha256 => {
  const preimage = structuredClone(candidate)
  delete preimage.candidatePayloadRoot
  return sha256(Buffer.concat([
    Buffer.from("v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6\0"),
    Buffer.from(canonical(preimage)),
  ]))
}
```

The validator must first enforce the exact closed key set and exactly one root-field exclusion; otherwise an unknown field or alternate exclusion could evade the intended identity. [PRESCRIPTIVE]

### External file carrier record

```typescript
// Git blob behavior: https://git-scm.com/docs/git-cat-file
const candidateFile = Object.freeze({
  path: candidatePath,
  mode: "100644",
  byteLength: candidateBytes.byteLength,
  sha256: sha256(candidateBytes),
  blobOid: gitBlobOidFromCommittedTree,
  candidatePayloadRoot: candidate.candidatePayloadRoot,
})
```

The consumer must verify every field against the exact committed tree entry/raw blob and the no-follow working bytes; the record is not accepted merely because it is internally well-formed. [PRESCRIPTIVE]

### Carrier root without carrier self-custody

```typescript
const carrierRoot = (carrier: Record<string, unknown>): Sha256 => {
  const preimage = structuredClone(carrier)
  delete preimage.carrierRoot
  return sha256(Buffer.concat([
    Buffer.from("v1.38:plan-262-103:git-object-byte-custody:carrier:v1\0"),
    Buffer.from(canonical(preimage)),
  ]))
}
```

No `carrierSha256`, `carrierBlobOid`, or `carrierCommit` field belongs in this object. [PRESCRIPTIVE]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| v5 candidate embeds exact own file SHA requirement | v6 candidate owns canonical semantic payload root; outer carrier owns exact file SHA/blob | Required after Plan 101 on 2026-08-28 [VERIFIED: Plan-101 closeout] | Removes the unsatisfiable fixed-point edge without weakening exact byte custody. [PRESCRIPTIVE] |
| Existing Plan-100 source path revised again | New versioned Plan-102 consumer paths | Required by Plan-101 immutable continuation rule [VERIFIED] | Preserves all Plan-100/101 current and historical bytes. [PRESCRIPTIVE] |
| Zero pair may be committed before actual consumer result | Exact disposable candidate commit and actual final consumer before zero publication | Established by Plan 101 [VERIFIED] | Prevents another provisional zero carrier from becoming invalid after publication. [PRESCRIPTIVE] |
| Source predicts own identity | Later external carrier binds exact predecessor bytes | Established earlier in Phase 262 [VERIFIED: STATE lines 291-300] | Supplies a repository-consistent non-circular custody pattern. [VERIFIED/PRESCRIPTIVE] |

**Deprecated/outdated:**
- v5 `actualConsumerCandidateJsonSha256` inside the candidate: preserve only as blocked Plan-101 history; never accept it as current authority. [VERIFIED: Plan-101 artifacts; PRESCRIPTIVE]
- Plan-101 schema/path/domains as Plan-92 input: preserve exactly, but revised Plan 92 must consume only the new Plan-103 carrier as current review authority. [PRESCRIPTIVE]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | None. All descriptive claims were verified from the repository or official documentation; recommendations are explicitly marked prescriptive. | — | — |

## Open Questions — RESOLVED

1. **Should the candidate use a placeholder-normalized whole-file hash or an explicit payload root?**
   - What we know: placeholder normalization would introduce another special preimage rule, while existing repository roots already omit one named root field before canonical hashing. [VERIFIED: current controller root functions]
   - Recommendation: use one explicit `candidatePayloadRoot` exclusion and external exact-file custody. [PRESCRIPTIVE]

2. **Where should exact candidate SHA/blob live?**
   - What we know: those values are constructible after candidate bytes exist, and Git blob identity is content-derived. [CITED: https://git-scm.com/docs/gitdatamodel.html]
   - Recommendation: place them in the Plan-103 outer carrier, never in the candidate. [PRESCRIPTIVE]

3. **Can Plan 100 be patched?**
   - What we know: Plan 100 asserts no later rewrite and Plan 101 requires a separately planned additive source correction. [VERIFIED: canonical v5 JSON and Plan-101 SUMMARY]
   - Recommendation: no; Plan 102 uses new versioned source/test paths. [PRESCRIPTIVE]

4. **When may zero findings be published?**
   - What we know: Plan 101 established a disposable exact-candidate consumer exercise and Plan 99 demonstrated the danger of publishing first. [VERIFIED: Plan-99/101 history]
   - Recommendation: only after the real new no-publish consumer succeeds on the exact disposable committed candidate trio. [PRESCRIPTIVE]

## Environment Availability

| Dependency | Required By | Available | Version / identity | Fallback |
|---|---|---|---|---|
| Node.js | Hashing, consumer, reviewer | ✓ | Existing Plan-100/101 execution runtime [VERIFIED: prior focused runs] | None required. |
| `/usr/bin/git` | Blob/mode custody and isolated clone | ✓ | Exact authenticated executable in current closure [VERIFIED: canonical v5 JSON] | None; mismatch fails closed. [PRESCRIPTIVE] |
| pnpm | Focused commands | ✓ | Existing repository package manager [VERIFIED: Plan-101 commands] | None required. |
| TypeScript / tsx / Vitest | Source, CLI, focused tests | ✓ | Existing project dependencies [VERIFIED: `package.json`] | None required. |
| External service, database, holdout store | Not required | N/A | None [VERIFIED: scope] | Keep absent. [PRESCRIPTIVE] |

**Missing dependencies with no fallback:** none. [VERIFIED: no new dependencies]

**Missing dependencies with fallback:** none. [VERIFIED: no new dependencies]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest, existing repository version [VERIFIED: `package.json`] |
| Config file | Existing repository Vitest configuration/package scripts [VERIFIED: repository] |
| Quick run command | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1` [PRESCRIPTIVE] |
| Full correction command | Both new Plan-102/103 suites, `pnpm exec tsc --noEmit --pretty false`, Plan-102 source-only check, Plan-103 actual-consumer branch check, destination absence, and `git diff --check`. [PRESCRIPTIVE] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| ADMIT-04 / MEAS-04 | Closed candidate schema, one exact exclusion, domain-separated root, consumer/reviewer golden-preimage agreement | unit/property-style mutation | Plan-102 and Plan-103 focused Vitest suites [PRESCRIPTIVE] | ❌ Wave 0 |
| MEAS-02 | Frozen seal/envelope/runtime/kernel/policy derivation remains byte-for-behavior unchanged after only review input changes | integration | Plan-102 synthetic derivation fixtures [PRESCRIPTIVE] | ❌ Wave 0 |
| MEAS-09 | Plan-101 blocked history remains exact and cannot become current eligibility | integration | Plan-102/103 protected-history mutation tests [PRESCRIPTIVE] | ❌ Wave 0 |
| MEAS-10 | Source/synthetic and isolated-review paths access no secret/live/Strategy/formation/holdout input and write no canonical destination before authorization | integration | source-only CLI plus destination snapshot tests [PRESCRIPTIVE] | ❌ Wave 0 |
| SEAL-01 | No seal/envelope publication; all independent-custody/identity claims remain false | integration | Plan-103 consumer branch and destination/authority assertions [PRESCRIPTIVE] | ❌ Wave 0 |
| ADMIT-03 | No reproduction credit in Plans 102/103 | integration | Assert fresh charged/accepted `0/0`, reproduction absent, Plan-92-only eligibility [PRESCRIPTIVE] | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** focused new suite with one worker and no file parallelism. [PRESCRIPTIVE]
- **Per wave merge:** both new suites plus TypeScript no-emit and source-only/consumer-branch CLIs. [PRESCRIPTIVE]
- **Phase gate:** revised Plan 92 remains denied unless Plan 103 has literal zero findings, exact carrier custody, and actual final-consumer success. [PRESCRIPTIVE]

### Wave 0 Gaps
- [ ] `scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts` — candidate/carrier roots, source-only consumer, frozen derivation semantics, protected history, destination absence. [PRESCRIPTIVE]
- [ ] `scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts` — independent root oracle, exact external SHA/blob custody, disposable actual consumer, blocked/zero branches, unique publication carrier. [PRESCRIPTIVE]
- [ ] Golden fixture bytes shared as data, not shared expected-value code, including key order, Unicode/string escapes, arrays, nested objects, one-byte drift, extra/missing keys, wrong domain, wrong exclusion, report drift, blob/mode drift, and carrier self-field rejection. [PRESCRIPTIVE]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | No user or service authentication changes. [VERIFIED: scope] |
| V3 Session Management | no | No sessions. [VERIFIED: scope] |
| V4 Access Control | yes, local evidence authority | Closed schemas, exact Plan-92-only eligibility, exhaustive false downstream authority, and unique Git lineage. [PRESCRIPTIVE] |
| V5 Input Validation | yes | Exact keys/types/domains/paths/modes/lengths/SHA/blob/root validation and canonical rerender. [PRESCRIPTIVE] |
| V6 Cryptography | yes | Built-in SHA-256 over exact `Buffer` preimages; no custom hash primitive or signing system. [CITED: https://nodejs.org/api/crypto.html; CONTEXT constraint VERIFIED] |
| V8 Data Protection | yes | No secret, Strategy, holdout, runtime-private, or public payload; owner-only temp clone and cleanup. [VERIFIED: scope; PRESCRIPTIVE] |
| V10 Malicious Code | yes, supply/lineage custody | Exact source commits/blobs/modes, no-later-rewrite, raw Git object equality, and independent mutation review. [PRESCRIPTIVE] |

### Known Threat Patterns for the Evidence Stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Self-referential digest field | Tampering / Repudiation | Acyclic inner payload root plus external file carrier. [PRESCRIPTIVE] |
| Coherent candidate/carrier substitution | Spoofing | Exact Plan-102 source identity, strict schema/domain, independent reviewer, Git blob/mode/SHA/length, unique publication lineage, no later rewrite. [PRESCRIPTIVE] |
| Reviewer/consumer canonicalization drift | Tampering | Independent implementations and byte-level golden preimage/root fixtures. [PRESCRIPTIVE] |
| Worktree differs from committed candidate | Tampering | Raw `cat-file blob` to no-follow working `Buffer.equals` plus exact mode. [VERIFIED pattern: Plan 100] |
| Premature zero publication | Elevation of Privilege | Actual final no-publish consumer success before canonical zero writes. [PRESCRIPTIVE] |
| Plan-101 blocked pair reinterpreted | Elevation of Privilege | Exact protected-history fields and `plan26292Eligible:false`; only new Plan-103 carrier may be current. [VERIFIED/PRESCRIPTIVE] |
| Carrier recursively claims its own file identity | Tampering | Schema forbids own SHA/blob/commit; revised Plan 92 externally custodies the carrier. [PRESCRIPTIVE] |
| Private data enters review artifact | Information Disclosure | Closed public-safe metadata schema, source/synthetic-only inputs, and mutation scans. [PRESCRIPTIVE] |

## Sources

### Primary (HIGH confidence)
- `scripts/run-v1-38-bounded-retry-envelope-v3.ts` — exact v5 consumer schema, current result-root exclusion pattern, raw custody, seal/envelope derivation, and destination behavior. [VERIFIED: codebase]
- `scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts` and test — sentinel correlation, isolated clone, exact candidate commit, expected rejection, pair validation, and publication lineage. [VERIFIED: codebase]
- `.planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json`, `262-101-REVIEW.md`, and `262-101-SUMMARY.md` — exact blocked finding, roots, source identity, protected history, `0/0`, and continuation rule. [VERIFIED: codebase]
- `262-100-PLAN.md`, `262-100-SUMMARY.md`, and exact source commit `a879bfc6...` — no-later-rewrite source custody and source/synthetic boundary. [VERIFIED: Git/codebase]
- `262-92-PLAN.md` — pending inactive pair semantics and downstream chain. [VERIFIED: codebase]
- `.planning/STATE.md:291-300,332-342` — repository precedent for detached external identity and current blocked topology. [VERIFIED: codebase]
- `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md`, and `262-CONTEXT.md` — project, requirement, topology, authority, privacy, and locked-decision constraints. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- https://nodejs.org/api/crypto.html — `Hash.update` accepts byte buffers and `digest` covers supplied data. [CITED: official Node.js docs; confidence classified MEDIUM by research seam]
- https://git-scm.com/docs/git-cat-file — explicit-type `cat-file` returns raw uncompressed object contents. [CITED: official Git docs; confidence classified MEDIUM by research seam]
- https://git-scm.com/docs/gitdatamodel.html — Git object identity hashes type and content, and file contents are stored as blobs. [CITED: official Git docs; confidence classified MEDIUM by research seam]

### Tertiary (LOW confidence)
- None. [VERIFIED: no tertiary sources used]

## Metadata

**Confidence breakdown:**
- Root cause: HIGH — exact impossible field relationship and blocked execution were read from current source and canonical evidence. [VERIFIED: Plan 101]
- Architecture: HIGH — the recommended acyclic graph follows existing repository root-exclusion and later-carrier identity patterns. [VERIFIED: codebase; PRESCRIPTIVE]
- Stack: HIGH — no new package or service; existing exact tools are reused. [VERIFIED: repository]
- Plan topology: HIGH — only two new additive plans are needed before the unchanged pending live chain. [PRESCRIPTIVE based on verified dependencies]
- Pitfalls/security: HIGH — each maps to the observed v5 failure or an existing repository custody control. [VERIFIED/PRESCRIPTIVE]

**Research date:** 2026-08-28
**Valid until:** 2026-09-27, or immediately stale if any Plan-100/101 byte, pending Plan-92 destination, or current Git lineage changes. [PRESCRIPTIVE]
