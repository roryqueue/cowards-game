# Phase 262: Git Object Byte-Custody Correction and Fresh Final-Consumer Review - Research

**Researched:** 2026-08-28
**Domain:** byte-exact Git object custody, additive source correction, independent pre-publication consumer review
**Confidence:** HIGH — the producer, tests, reviewer, canonical/provisional pair, invalidation carrier, Git lineage, pending Plan 92, and local toolchain were inspected directly; raw process and Git-object behavior was cross-checked against official Node.js and Git documentation. [VERIFIED: codebase, Git, and official documentation]

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
| ADMIT-03 | Reproduce the persisted current-rules audit matrix before candidate search; Starter and Advanced remain non-balance fixtures. [VERIFIED: `.planning/REQUIREMENTS.md`] | Restore only the source-custody gate needed before the still-inactive envelope can be sealed; Plans 100/101 create no Match, cell, or empirical credit. [PRESCRIPTIVE] |
| ADMIT-04 | Missing, stale, incompatible, or drifting authority stops work without in-milestone normalization. [VERIFIED: `.planning/REQUIREMENTS.md`] | Preserve the Plan-99 failure and provisional pair as immutable invalid history; require a new exact-commit review. [PRESCRIPTIVE] |
| MEAS-02 | Preserve frozen budget, retry, runtime, source, and hardware identities. [VERIFIED: `.planning/REQUIREMENTS.md`] | Change only committed-byte retrieval, mode authentication, and review lineage; D-29R policy and v3 capacity identities remain untouched. [PRESCRIPTIVE] |
| MEAS-04 | Accepted evidence requires zero system, privacy, and identity defects. [VERIFIED: `.planning/REQUIREMENTS.md`] | Raw blob bytes, exact modes, portable-member equality, and unchanged before/after full local closure become mandatory gates. [PRESCRIPTIVE] |
| MEAS-09 | Distinguish integrity failure from clean empirical non-pass/pass. [VERIFIED: `.planning/REQUIREMENTS.md`] | `GIT_SHOW_BYTES_TRIMMED` remains a one-finding integrity stop with `0/0`, never an empirical result. [VERIFIED: Plan-99 closeout] |
| MEAS-10 | Preserve private, profile-neutral, non-authorizing procedure. [VERIFIED: `.planning/REQUIREMENTS.md`] | Plans 100/101 remain source, synthetic, and review-only; no Strategy, formation, holdout, secret, or live input is accessed. [PRESCRIPTIVE] |
| SEAL-01 | Preserve the `single_operator_local_seal_v1` claim boundary. [VERIFIED: `.planning/REQUIREMENTS.md`] | No custody claim changes and no seal is created; Plan 92 remains the first possible inactive pair publication. [PRESCRIPTIVE] |
</phase_requirements>

## Summary

Plan 99 correctly discovered one critical defect after its provisional zero-finding pair had already been committed: `deriveV138V3SealedInactiveEnvelope` calls the string-returning isolated Git helper for `git show <commit>:<path>`, that helper requests UTF-8 output and calls `.trim()`, and the controller then re-encodes the trimmed string with `Buffer.from(...)` before comparing it to unchanged working bytes. A newline-terminated committed file therefore fails exact custody; binary or invalid-UTF-8 content could be re-encoded, and embedded NUL bytes cannot be treated as safe text. The actual `--derive-seal-envelope-no-publish` consumer stopped with `V138_RETRY_SOURCE_CUSTODY_INVALID` before writing anything. [VERIFIED: `scripts/run-v1-38-bounded-retry-envelope-v3.ts:1212-1223`; `scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts:103-121`; `262-99-SUMMARY.md`]

The Plan-98 producer/test blobs, Plan-99 checker/test, provisional JSON/REVIEW pair, and Plan-99 invalidation/closeout bytes must remain unchanged. The provisional review root and portable closure root remain historical data, but `plan26292Eligible:true` from that pair is invalid and cannot be consumed. No canonical blocked replacement pair exists; the blocked finding/root is carried by the immutable Plan-99 summary and STATE closeout. [VERIFIED: Plan-99 artifact, REVIEW, SUMMARY, STATE, and Git commits `19a6eb53`, `275cdbaf`, `497ba238`]

The minimal safe continuation is exactly two additive plans. Plan 262-100 changes only the v3 Git-custody source and its focused tests: add a raw-Buffer isolated Git path, authenticate each committed tree entry as one regular blob with exact Git mode, read the blob through Git plumbing without decoding/trimming, and compare the raw stdout `Buffer` to the no-follow working-file `Buffer` with `Buffer.equals`. Plan 262-101 then authors a fresh independent checker and new versioned JSON/REVIEW pair over the exact Plan-100 source commit. Before publishing that pair, it must create a disposable committed candidate in an owner-only detached checkout and run the actual final no-publish consumer against those exact candidate bytes; only a successful consumer run and zero mutation findings permit canonical publication. [PRESCRIPTIVE; official behavior CITED: https://nodejs.org/api/child_process.html, https://nodejs.org/api/buffer.html, https://git-scm.com/docs/git-cat-file, https://git-scm.com/docs/git-ls-tree]

**Primary recommendation:** implement `Plan 99 -> Plan 100 source-only byte correction -> Plan 101 fresh pre-publication consumer re-review -> revised Plan 92`, retaining the existing seal-v13 and retry-envelope:v3 destinations because they are still absent. Do not patch Plan 98/99, do not reinterpret the provisional pair, and do not let Plan 92 consume a review that has not passed the real consumer in a disposable committed checkout. [PRESCRIPTIVE; VERIFIED: destination absence and pending Plan-92 contract]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Isolated Git command execution | Offline evidence/control plane | `/usr/bin/git` process boundary | Existing hardening authenticates the exact executable and strips ambient Git configuration; Plan 100 adds a Buffer-returning sibling without weakening it. [VERIFIED: native-custody-v1 source] |
| Committed blob and mode custody | Git object store | Offline TypeScript controller | Git owns blob contents and tree modes; the controller must authenticate both before comparing to no-follow working files. [CITED: https://git-scm.com/docs/git-cat-file, https://git-scm.com/docs/git-ls-tree] |
| Working-file custody | Offline TypeScript controller | Filesystem | Existing `readNoFollow` supplies working bytes; Plan 100 must additionally validate the regular-file/executable-mode projection against the committed tree entry. [VERIFIED: controller and native-custody source] |
| Portable reviewed closure | Plan-101 independent checker | Git/runtime/toolchain inputs | Cross-checkout members may be published, but `gitObjectRoot` and the environment-bound full root remain excluded. [VERIFIED: Plan-98/99 schema and review] |
| Full local execution closure | Actual v3 consumer | Local Git object store and installed toolchain | The consumer freshly derives the complete local root before and after and requires equality; it is not a portable review artifact. [VERIFIED: controller lines 1184 and 1288-1290] |
| Inactive seal/envelope publication | Plan 92 only | Git custody | Plans 100/101 may establish eligibility only; they create no seal, envelope, live, or downstream artifact. [VERIFIED: pending Plan 92; PRESCRIPTIVE] |

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, side-effect free, and free of `Math.random`, `Date.now`, system time, filesystem, network, and database access. This correction remains in the offline evidence/control plane, not engine logic. [VERIFIED: `AGENTS.md`]
- Do not put game rules in React, execute Strategy code in web/API/Go, or use Node `vm` as a security boundary. Plans 100/101 touch none of those surfaces. [VERIFIED: `AGENTS.md`; scoped inference]
- Treat Strategy source as hostile, validate every runtime boundary with schemas, preserve canonical terminology, and preserve immutable submitted Strategy Revisions. [VERIFIED: `AGENTS.md`]
- Public replay must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads. This correction publishes only source-custody metadata and false authority fields. [VERIFIED: `AGENTS.md`; scoped inference]
- Engine changes require unit and invariant/property tests; replay changes require reconstruction, integrity, board-bounds, canonical-start, and browser realism checks; runtime changes require invalid-output, timeout, forbidden-capability, memory/source-limit, schema, and strategy-versus-system-failure coverage. Plans 100/101 change no engine, Match, replay, or Strategy runtime behavior. [VERIFIED: `AGENTS.md`; scoped inference]
- End-to-end product tests cover edit -> revision -> MatchSet -> execute -> replay, but this source-only correction must not invoke that product flow or live reproduction. [VERIFIED: `AGENTS.md`; requested scope]
- Follow roadmap order and keep updated planning documents committed. [VERIFIED: `AGENTS.md`]

## Recommended Additive Plan Topology

| Plan | Wave | Depends on | Exact responsibility | Authority result |
|---|---:|---|---|---|
| 262-100 | 82 | 262-99 | Source-only raw Git-object byte and mode correction plus adversarial focused tests. Preserve all Plan-98/99/provisional/invalidation bytes. [PRESCRIPTIVE] | No review verdict, seal, envelope, live action, charge, acceptance, lifecycle mutation, or downstream authority. [PRESCRIPTIVE] |
| 262-101 | 83 | 262-100 | Fresh independent exact-commit review at new v5 destinations; run the actual no-publish consumer on a disposable committed candidate before canonical pair publication. [PRESCRIPTIVE] | Zero findings may make only Plan 92 eligible; any finding publishes a blocked new pair and stops. [PRESCRIPTIVE] |
| 262-92 | 84 | 262-101 | Existing seal-v13 plus inactive retry-envelope:v3 publication, revised to consume Plan-100 source and Plan-101 review while retaining Plan 98/99 as protected failed history. [PRESCRIPTIVE] | Plan-93-only eligibility, zero live consumption. [VERIFIED: existing Plan-92 semantics] |
| 262-93 | 85 | 262-92 | Existing sole bounded live owner. [VERIFIED: `262-93-PLAN.md`] | Live evidence only; no independent admission. [VERIFIED: existing plan] |
| 262-94 | 86 | 262-93 | Existing independent adjudication and exact-pass-only reproduction/Route-11 publication. [VERIFIED: `262-94-PLAN.md`] | Branch-dependent evidence; no broader authority without exact clean pass. [VERIFIED: existing plan] |
| 262-95 | 87 | 262-94 | Existing validation/verification/lifecycle closeout. [VERIFIED: `262-95-PLAN.md`] | Only the exact joined pass may complete Phase 262. [VERIFIED: existing plan] |

Plan 92 currently has wave 82 and depends on Plan 99; Plans 93–95 currently occupy waves 83–85. The planner must revise those unexecuted plan bytes to the table above and replace every current-authority reference to Plan 98/99 with Plan 100/101, while preserving Plan 98/99 as non-authorizing protected history. [VERIFIED: Plans 92–95; PRESCRIPTIVE]

## Standard Stack

### Core

| Component | Version / identity | Purpose | Why standard here |
|---|---|---|---|
| Node.js | 24.15.0 | Execute TypeScript custody and review tooling | `execFileSync` returns raw `Buffer` stdout when encoding is omitted or set to `buffer`; no dependency is required. [VERIFIED: local probe; CITED: https://nodejs.org/api/child_process.html] |
| Node `Buffer` | built in | Preserve and compare arbitrary bytes | `Buffer.equals` compares exact bytes, including length, NULs, invalid UTF-8, and final-newline presence. [CITED: https://nodejs.org/api/buffer.html] |
| Git | 2.50.1 Apple Git-155, authenticated `/usr/bin/git` | Resolve tree modes/blob OIDs and return raw blob contents | `ls-tree` exposes mode/type/OID/path; `cat-file blob` returns raw uncompressed object contents without `--textconv` or `--filters`. [VERIFIED: local probe; CITED: https://git-scm.com/docs/git-ls-tree, https://git-scm.com/docs/git-cat-file] |
| TypeScript | `^6.0.3` | Closed result schemas and typed custody helpers | Existing repository dependency; no installation or upgrade is needed. [VERIFIED: `package.json`] |
| Vitest | 4.1.6 | Synthetic repositories, byte fixtures, mutation tests, and consumer probes | Existing focused test runner on Node 24.15.0. [VERIFIED: `package.json`; local probe] |
| tsx | `^4.22.0` | Run actual review/consumer CLIs | Existing repository dependency and current Plan-99/92 command surface. [VERIFIED: `package.json`; Plan-99 summary] |

### Supporting

| Component | Purpose | When to use |
|---|---|---|
| `runV138RetryV3IsolatedGit` | Existing text-only metadata helper | Continue using for trusted ASCII metadata such as commit IDs/status only; never use it for blob payload bytes. [VERIFIED: native-custody-v1 source; PRESCRIPTIVE] |
| New `runV138RetryV3IsolatedGitBytes` | Same executable/config/environment hardening with raw `Buffer` stdout and no `.trim()` | Use for `ls-tree -z` records and `cat-file blob <oid>` payloads. [PRESCRIPTIVE; CITED: Node/Git docs] |
| `readNoFollow` / no-follow descriptor read | Read the working regular file without following symlinks | Compare working bytes and mode projection to the committed entry. [VERIFIED: controller pattern] |
| Owner-only detached checkout | Disposable committed candidate for fresh review | Exercise the actual final consumer before publishing the Plan-101 canonical pair. [VERIFIED: Plan-99 detached-review pattern; PRESCRIPTIVE] |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| Raw `cat-file blob` Buffer | Keep `git show` through the string helper | Rejected: `.trim()` changes newline bytes and UTF-8 conversion cannot preserve arbitrary blobs. [VERIFIED: actual Plan-99 failure; CITED: Node docs] |
| Add a byte-returning sibling helper | Change the existing helper to return `Buffer` everywhere | Rejected as non-minimal: dozens of metadata consumers expect trimmed strings, increasing correction surface and regression risk. [VERIFIED: codebase grep; PRESCRIPTIVE] |
| Exact Buffer comparison | Compare hashes only | Rejected for this custody seam: hashes are useful evidence, but the required direct assertion is committed `Buffer.equals(working)` plus authenticated blob/mode metadata. [PRESCRIPTIVE; CITED: Node Buffer docs] |
| New Plan-101 pair | Amend or delete the Plan-99 provisional pair | Rejected by D-01/D-24R and the explicit Plan-99 invalidation contract. [VERIFIED: CONTEXT.md, STATE, Plan-99 summary] |
| Pre-publication disposable consumer run | Publish the pair and probe afterward | Rejected: Plan 99 demonstrated that this ordering can strand another invalid immutable provisional pair. [VERIFIED: Plan-99 history] |

**Installation:** none. Plans 100/101 must use only existing Node, Git, TypeScript, tsx, and Vitest components. [PRESCRIPTIVE]

## Package Legitimacy Audit

No external package installation is required, so the package-legitimacy gate is not applicable. [VERIFIED: recommended stack uses installed project/toolchain components]

## Architecture Patterns

### System Architecture Diagram

```text
Immutable Plan-98 source + immutable Plan-99 provisional pair/invalidation
                              |
                              v protected non-authorizing history
Plan 262-100 exact source commit (no evidence publication)
  |-- isolated /usr/bin/git metadata helper remains text-only
  |-- new isolated raw-Buffer helper: no encoding, trim, or re-encode
  |-- ls-tree -z -> exact regular blob + 100644/100755 mode
  |-- cat-file blob <oid> -> exact committed Buffer
  `-- no-follow working Buffer + mode ---- Buffer.equals ----+
                                                            |
                                         mismatch ----------+--> fail closed
                                                            |
                                                            v
Plan 262-101 independent reviewer in owner-only detached checkout
  |-- exact Plan-100 commit/tree/parent/blob/mode custody
  |-- newline/no-newline/binary/NUL/mode mutation matrix
  |-- derive candidate v5 JSON/REVIEW bytes in memory
  |-- disposable commit of exact candidate bytes
  |-- actual --derive-seal-envelope-no-publish consumer
  |      |-- portable members == fresh full-local members
  |      `-- full local root before == full local root after
  |-- any finding/failure -----------> new blocked v5 pair; stop
  `-- literal zero ------------------> publish new canonical v5 pair
                                               |
                                               v
                              revised Plan 92 -> 93 -> 94 -> 95
                              inactive seal     live  judge lifecycle
```

No edge in this flow enters engine logic, Strategy execution, a holdout store, public replay, or Phase 263. [VERIFIED: scoped files and AGENTS.md; PRESCRIPTIVE]

### Recommended Project Structure

```text
scripts/
├── lib/
│   └── v1-38-bounded-retry-v3-native-custody-v1.ts        # add raw isolated Git Buffer helper
├── run-v1-38-bounded-retry-envelope-v3.ts                  # exact blob/mode custody + Plan-101 consumer schema
├── run-v1-38-bounded-retry-envelope-v3.test.ts             # byte/mode/actual-consumer regression matrix
├── check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts
└── check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts
.planning/
├── artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json
└── phases/.../
    ├── 262-101-REVIEW.md
    └── 262-101-SUMMARY.md
```

Plan 100 should modify exactly the three existing source/test files shown first; its normal summary may record the exact source completion commit but must not be treated as a verdict. Plan 101 owns the two new checker files and new versioned review/report pair. [PRESCRIPTIVE; pattern VERIFIED: Plans 96–99]

### Pattern 1: Separate text metadata from raw object bytes

**What:** keep the existing string helper for line-oriented Git metadata, and add a sibling returning `Buffer` with the identical authenticated executable, hardened arguments, isolated environment, maximum buffer, and cleanup. Never call `.trim()`, `.toString()`, or `Buffer.from(string)` on blob stdout. [PRESCRIPTIVE; CITED: https://nodejs.org/api/child_process.html]

**When to use:** every committed-file payload comparison, including JSON, Markdown, JSONL, TypeScript, C, empty files, files without final newline, and binary/NUL-containing fixtures. [PRESCRIPTIVE]

**Example:**

```typescript
// Sources: https://nodejs.org/api/child_process.html
//          https://nodejs.org/api/buffer.html
const gitBytes = (repoRoot: string, args: readonly string[]): Buffer =>
  execFileSync("/usr/bin/git", hardenedGitArgs(args), {
    cwd: repoRoot,
    env: cleanEnvironment(isolationRoot),
    maxBuffer: 64 * 1024 * 1024,
    encoding: "buffer",
  })

const committed = gitBytes(repoRoot, ["cat-file", "blob", blobOid])
if (!workingBytes.equals(committed)) fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
```

The actual implementation must retain the existing executable digest check and `finally` cleanup around the isolated home. [VERIFIED: existing helper; PRESCRIPTIVE]

### Pattern 2: Authenticate tree entry before reading its blob

**What:** request exactly one NUL-terminated `ls-tree -z` record for `<commit> -- <repoPath>`, validate the fixed-format ASCII metadata and exact path, require type `blob`, require mode `100644` or `100755`, then read the returned OID with `cat-file blob`. Reject absent, duplicate, symlink (`120000`), gitlink (`160000`), tree, malformed, or unexpected-path records. [PRESCRIPTIVE; CITED: https://git-scm.com/docs/git-ls-tree, https://git-scm.com/docs/git-cat-file]

**When to use:** every member of the producer's `custodyPaths` set. [VERIFIED: controller custody loop]

**Mode rule:** project fixed paths must be regular files; compare only Git's tracked executable projection: `100755` iff the working regular file has an executable bit, otherwise `100644`. Do not pretend Git records all POSIX permission bits. [PRESCRIPTIVE; Git mode behavior VERIFIED: current checkout manifest implementation]

### Pattern 3: Pre-publication actual-consumer review

**What:** Plan 101 derives candidate v5 JSON and Markdown deterministically, creates an owner-only disposable detached checkout at the exact Plan-100 source lineage, commits those exact candidate bytes only in that disposable checkout, and invokes the production `--derive-seal-envelope-no-publish` path. It verifies no seal/envelope/live/downstream destination appears, cleanup completes, portable fields equal the fresh local closure fields, and the complete local root is identical before and after. Only then may the byte-identical candidate pair be published canonically. [PRESCRIPTIVE]

**When to use:** before writing the Plan-101 canonical review pair. Run the consumer again against the committed canonical pair before summary closeout as a confirmation, but the disposable committed run is the publication gate. [PRESCRIPTIVE]

### Anti-Patterns to Avoid

- **Blob payload through the text helper:** `.trim()`, UTF-8 decoding, newline splitting, Unicode replacement, EOL normalization, or string re-encoding changes custody semantics. [VERIFIED: Plan-99 failure; CITED: Node docs]
- **`git show` without mode authentication:** content equality alone does not prove the committed path is a regular file with the expected executable projection. [VERIFIED: current gap; PRESCRIPTIVE]
- **Hash-only proof:** a digest does not replace the required exact `Buffer.equals` assertion at the final consumer boundary. [PRESCRIPTIVE]
- **Portable/full root alias:** `reviewedExecutionClosureRoot`, `installedClosureRoot`, and `executionClosureRoot` are three distinct domains; none may substitute for another. [VERIFIED: Plan-99 schema and controller]
- **Post-publication-only probe:** it recreates the exact failure ordering that invalidated Plan 99. [VERIFIED: Plan-99 history]
- **Review imports producer verdict:** Plan 101 must independently inspect source patterns, committed bytes/modes, mutations, and observations; it may invoke the producer only as the final consumer under test. [PRESCRIPTIVE; pattern VERIFIED: Plan 99]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Raw child stdout capture | Custom stream-to-string/base64 protocol | `execFileSync(..., {encoding: "buffer"})` | Built-in Buffer output preserves arbitrary bytes and exit semantics. [CITED: https://nodejs.org/api/child_process.html] |
| Git object decoding | Parse loose/pack object files | `git ls-tree -z` + `git cat-file blob` | Git already resolves packed/delta objects and returns raw uncompressed blob contents. [CITED: Git docs] |
| Byte equality | Unicode/string equality or manual loops | `Buffer.equals` | Exact byte and length equality is the documented operation. [CITED: https://nodejs.org/api/buffer.html] |
| Mode derivation | Infer committed mode from file suffix/content | Git tree mode plus filesystem executable projection | Mode is tree metadata, not blob content. [CITED: https://git-scm.com/docs/git-ls-tree] |
| Review publication transaction | Ad hoc overwrite/rewrite of Plan 99 | New versioned Plan-101 destinations and existing exclusive publication pattern | Preserves immutable evidence and avoids mutable latest semantics. [VERIFIED: D-01 and Plan-99 closeout] |

**Key insight:** bytes, object identity, path, and mode are separate custody facts. The final gate must authenticate all four without translating blob contents into text. [PRESCRIPTIVE; supported by official Git/Node docs]

## Runtime State Inventory

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | Plan-98 producer/test Git blobs and Plan-99 checker/test, provisional pair, REVIEW, SUMMARY, and STATE closeout are committed immutable evidence. [VERIFIED: Git and filesystem] | No data migration. Preserve exact bytes; add Plan-100/101 commits and roots only. [PRESCRIPTIVE] |
| Live service config | None — verified by scope and destination inventory; the failure occurred in the offline no-publish consumer before any service/live invocation. [VERIFIED: Plan-99 summary and destination absence] | None. Do not start runtime-service, Match work, or live retry. [PRESCRIPTIVE] |
| OS-registered state | None — no launchd, scheduler, daemon, or process registration is owned by this source correction. [VERIFIED: scoped source/plan inspection] | None. Disposable processes/checkouts must terminate and clean up. [PRESCRIPTIVE] |
| Secrets/env vars | No secret was accessed; the isolated Git helper deliberately replaces ambient Git/home/config variables. [VERIFIED: helper source and Plan-99 zero-consumption facts] | Preserve isolation; never read commitment-secret or holdout input. [PRESCRIPTIVE] |
| Build artifacts / installed packages | Existing Node/pnpm/Vitest closure is environment-bound and included in the full execution closure; no new package/build output is required. [VERIFIED: closure source and local probes] | No reinstall or migration. Recompute the full local closure before/after; clean disposable checkout/test outputs. [PRESCRIPTIVE] |

After every repository file is corrected, no external runtime system retains the trimmed string; the remaining authoritative state is Git history, where old bytes must intentionally remain. [VERIFIED: inventory above]

## Common Pitfalls

### Pitfall 1: Correct bytes but ignore mode

**What goes wrong:** a regular executable/non-executable flip or symlink substitution can pass a payload-only comparison. [PRESCRIPTIVE risk; mode gap VERIFIED: controller custody loop]

**Why it happens:** blob contents do not include the tree entry mode. [CITED: https://git-scm.com/docs/git-ls-tree]

**How to avoid:** authenticate one exact tree record, restrict to `100644|100755 blob`, compare path/OID, require working regular no-follow status, and compare the executable projection. [PRESCRIPTIVE]

**Warning signs:** `cat-file` or `show` is called without a preceding exact mode/type/path check; tests lack `100644`, `100755`, and symlink rejection. [PRESCRIPTIVE]

### Pitfall 2: A raw helper that still decodes on one branch

**What goes wrong:** the happy path returns Buffer, but error, batch, fixture, or wrapper code calls `.toString("utf8")`, `.trim()`, normalizes CRLF, or reconstructs with `Buffer.from(text)`. [PRESCRIPTIVE risk]

**How to avoid:** mutation-test each transform and assert byte lengths/digests plus `Buffer.equals` on newline, no-newline, invalid-UTF8/binary, and embedded-NUL blobs. [PRESCRIPTIVE]

### Pitfall 3: Testing a helper but not the actual consumer

**What goes wrong:** synthetic unit tests pass while the final producer path still routes through an older text helper, as happened in Plan 99. [VERIFIED: Plan-99 history]

**How to avoid:** Plan 101 must invoke the exact production no-publish CLI against a disposable committed candidate before canonical publication. [PRESCRIPTIVE]

### Pitfall 4: Publishing environment-bound closure state

**What goes wrong:** a detached checkout's `gitObjectRoot` or full `executionClosureRoot` is embedded in the portable review, or `installedClosureRoot` is treated as equivalent. [VERIFIED: prevented by Plan-99 schema]

**How to avoid:** publish only the v5 portable tuple/root; compare each portable member with a fresh current full closure and retain only the local before/after full-root equality observation. [PRESCRIPTIVE]

### Pitfall 5: Treating the Plan-99 zero array as current truth

**What goes wrong:** Plan 92 consumes `plan26292Eligible:true` from the invalid provisional artifact and bypasses the later finding. [VERIFIED: current Plan-92 stale dependency]

**How to avoid:** Plan 92 must depend exclusively on the Plan-101 v5 pair; Plan-98/99 identities enter only a protected-history/invalidation branch with `provisionalPairReinterpreted:false`. [PRESCRIPTIVE]

## Code Examples

Verified patterns from official sources:

### Read committed blob bytes without text conversion

```typescript
// Sources: https://nodejs.org/api/child_process.html
//          https://git-scm.com/docs/git-cat-file
const committed: Buffer = execFileSync(
  "/usr/bin/git",
  ["cat-file", "blob", blobOid],
  { cwd: repoRoot, env: isolatedEnv, encoding: "buffer" },
)
```

### Compare exact bytes

```typescript
// Source: https://nodejs.org/api/buffer.html
if (!working.equals(committed)) {
  throw new TypeError("V138_RETRY_SOURCE_CUSTODY_INVALID")
}
```

### Required adversarial fixture matrix

```typescript
// Prescriptive test data: bytes must never be routed through strings.
const fixtures = [
  { name: "newline", bytes: Buffer.from("line\n") },
  { name: "no-newline", bytes: Buffer.from("line") },
  { name: "nul-binary", bytes: Buffer.from([0x00, 0xff, 0x0a, 0x80, 0x00]) },
  { name: "empty", bytes: Buffer.alloc(0) },
] as const
```

Each fixture must be committed in a synthetic repository, read through the production raw Git helper, compared byte-for-byte, and re-run under both regular mode classes where meaningful. [PRESCRIPTIVE]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| `git show` -> UTF-8 string -> `.trim()` -> `Buffer.from` | `ls-tree -z` mode/OID authentication -> `cat-file blob` raw Buffer -> `Buffer.equals` | Plan 262-100 | Preserves final newline, no-newline, binary, invalid UTF-8, and NUL bytes while validating mode. [PRESCRIPTIVE; official docs cited] |
| Unit/reviewer suite before final real consumer | Disposable committed candidate runs actual final consumer before verdict publication | Plan 262-101 | Prevents another synthetically green but consumer-invalid immutable pair. [PRESCRIPTIVE; failure pattern VERIFIED: Plan 99] |
| Plan-99 v4 pair as Plan-92 prerequisite | Plan-101 v5 pair as sole current prerequisite; v4 retained as invalid history | Plan 262-101 / revised Plan 92 | Restores additive evidence lineage without rewriting history. [PRESCRIPTIVE] |

**Deprecated/outdated:**

- Plan-99 `plan26292Eligible:true`: invalidated and non-authorizing; retain only as historical bytes. [VERIFIED: STATE and Plan-99 summary]
- Any blob read through `runV138RetryV3IsolatedGit`: forbidden because that API is deliberately text/trim oriented. [PRESCRIPTIVE; source VERIFIED]
- Plan-92 dependency `[262-99]` and wave 82: stale after the custody finding. [VERIFIED: pending Plan-92 header]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | None. All factual claims were verified from the repository/toolchain or cited official documentation; prescriptive recommendations are labeled. | — | — |

## Open Questions

1. **Disposable review commit mechanism**
   - What we know: Plan 99 already uses an owner-only detached checkout and exact committed-byte observations. [VERIFIED: Plan-99 checker/summary]
   - What's unclear: whether Plan 101 should use a detached worktree commit or a fully isolated temporary clone/object store. [VERIFIED: implementation not yet planned]
   - Recommendation: use the existing Plan-99 owner-only detached-checkout pattern unless it cannot commit exact candidate review paths without contaminating canonical refs; in either case require cleanup and destination absence. [PRESCRIPTIVE]

2. **Exact Plan-101 protocol names**
   - What we know: new versioned destinations are mandatory and the current sequence naturally advances v4 to v5. [VERIFIED: D-01 and prior naming]
   - What's unclear: final planner-selected schema/protocol constants. [VERIFIED: not yet implemented]
   - Recommendation: use `v1.38-plan-262-101-bounded-retry-source-rereview-v5` and `fresh-independent-plan-100-byte-preserving-rereview-v5`, updating the producer's strict consumer schema in Plan 100. [PRESCRIPTIVE]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | raw Buffer process capture and TypeScript CLIs | ✓ | 24.15.0 | none needed [VERIFIED: local probe] |
| `/usr/bin/git` | blob/mode custody and detached candidate commit | ✓ | 2.50.1 Apple Git-155 | none; exact authenticated path is contractual [VERIFIED: local probe and source] |
| pnpm | focused test/tsx commands | ✓ | 11.1.2 | none needed [VERIFIED: local probe] |
| Vitest | byte/mode/mutation suites | ✓ | 4.1.6 | none needed [VERIFIED: local probe] |
| tsx | actual consumer/reviewer CLI | ✓ | `^4.22.0` installed by project | none needed [VERIFIED: `package.json`] |

**Missing dependencies with no fallback:** none. [VERIFIED: local probes]

**Missing dependencies with fallback:** none. [VERIFIED: local probes]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.6 [VERIFIED: local probe] |
| Config file | existing workspace/package configuration; focused files run directly [VERIFIED: current Plan-98/99 commands] |
| Quick run command | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3.test.ts` [PRESCRIPTIVE] |
| Review run command | `pnpm exec vitest run scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts` [PRESCRIPTIVE] |
| Full source/review command | both focused files, then `pnpm exec tsc --noEmit --pretty false` [PRESCRIPTIVE; pattern VERIFIED: Plan-99 closeout] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| ADMIT-03 / ADMIT-04 | Exact source custody fails closed and creates no authority | integration | Plan-101 review test plus actual no-publish consumer | ❌ Wave 0 |
| MEAS-02 | Frozen v3 policy/identities unchanged | unit | producer focused suite | ✅ extend existing |
| MEAS-04 | Newline/no-newline/binary/NUL/mode drift detected | unit + synthetic Git integration | producer focused suite | ✅ extend existing |
| MEAS-09 | Finding remains integrity stop with `0/0` | unit | Plan-101 review suite | ❌ Wave 0 |
| MEAS-10 / SEAL-01 | No secret/live/downstream path touched | integration | Plan-101 prepublication consumer and destination snapshot | ❌ Wave 0 |

### Sampling Rate

- **Per Plan-100 task commit:** producer focused suite for raw helper/mode/custody tests. [PRESCRIPTIVE]
- **Per Plan-101 task commit:** reviewer focused suite plus deterministic no-publish derivation. [PRESCRIPTIVE]
- **Pre-publication gate:** disposable committed candidate must pass the actual final consumer with every canonical/live destination absent. [PRESCRIPTIVE]
- **Per wave merge:** combined producer + reviewer suites and TypeScript no-emit check. [PRESCRIPTIVE]
- **Phase gate before Plan 92:** committed canonical Plan-101 pair must validate, actual no-publish consumer must pass again, worktree must be clean, and all seal/envelope/live destinations must remain absent. [PRESCRIPTIVE]

### Wave 0 Gaps

- [ ] Extend `scripts/run-v1-38-bounded-retry-envelope-v3.test.ts` with raw Git Buffer, final-newline, no-final-newline, empty, binary/invalid-UTF8, embedded-NUL, 100644, 100755, symlink, missing, malformed, duplicate, and byte/mode-drift cases. [PRESCRIPTIVE]
- [ ] Create `scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts` with exact Plan-100 custody, every trim/decode/re-encode/bypass mutation, protected Plan-98/99 history, strict v5 schema/root, disposable actual-consumer, destination-absence, and blocked/zero branches. [PRESCRIPTIVE]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | No user authentication surface changes. [VERIFIED: scope] |
| V3 Session Management | no | No session state exists in this offline correction. [VERIFIED: scope] |
| V4 Access Control | yes, local evidence boundary | Owner-only detached checkout, exact `/usr/bin/git`, no-follow file reads, false authority fields, and exclusive destinations. [VERIFIED: existing patterns; PRESCRIPTIVE] |
| V5 Input Validation | yes | Exact fixed paths, NUL-delimited tree parsing, closed mode/type/OID grammar, Buffer equality, strict v5 JSON keys/roots, and fail-closed findings. [PRESCRIPTIVE] |
| V6 Cryptography | yes | Existing Node SHA-256/Git object identities; never hand-roll hashing or object parsing. [VERIFIED: source; PRESCRIPTIVE] |

### Known Threat Patterns for Node/Git custody tooling

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Text normalization changes committed bytes | Tampering | Raw Buffer stdout, no trim/decode/re-encode, exact `Buffer.equals`. [CITED: Node docs; PRESCRIPTIVE] |
| Tree mode/path substituted while content stays equal | Spoofing/Tampering | Exact one-record `ls-tree -z` mode/type/OID/path validation plus no-follow working status. [CITED: Git docs; PRESCRIPTIVE] |
| Ambient Git config/hooks/replacements alter resolution | Tampering | Preserve exact executable digest and isolated hardened Git environment. [VERIFIED: native-custody-v1] |
| Portable/full/installed roots aliased | Spoofing | Separate hash domains, strict schema, per-member join, unchanged full root before/after. [VERIFIED: Plan-98/99 contract] |
| Invalid provisional pair reused | Elevation of Privilege | Plan-101-only eligibility and explicit protected Plan-99 invalidation join. [PRESCRIPTIVE] |
| Review pair published before consumer exercise | Repudiation/Tampering | Disposable committed candidate actual-consumer gate before canonical publication. [PRESCRIPTIVE; failure history VERIFIED] |

## Sources

### Primary (HIGH confidence)

- `scripts/run-v1-38-bounded-retry-envelope-v3.ts` — actual custody loop, strict portable/full joins, and before/after full-root gate. [VERIFIED: codebase]
- `scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts` — isolated Git text helper and execution-closure mode/blob implementation. [VERIFIED: codebase]
- `scripts/run-v1-38-bounded-retry-envelope-v3.test.ts` — Plan-98 tests and current missing byte-object matrix. [VERIFIED: codebase]
- Plan-99 checker/test/artifact/REVIEW/SUMMARY and STATE closeout — exact finding, provisional pair, invalidation, roots, zero consumption, and destination absence. [VERIFIED: codebase and Git]
- Pending Plans 92–95 — current stale dependency/waves and downstream responsibilities. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- https://nodejs.org/api/child_process.html — `execFileSync` Buffer/string return and default buffer encoding. [CITED: official Node.js docs]
- https://nodejs.org/api/buffer.html — exact-byte semantics of `Buffer.equals`. [CITED: official Node.js docs]
- https://git-scm.com/docs/git-cat-file — raw uncompressed blob contents and no-filter plumbing behavior. [CITED: official Git docs]
- https://git-scm.com/docs/git-ls-tree — tree entry mode/type/OID/path output. [CITED: official Git docs]

### Tertiary (LOW confidence)

- None. [VERIFIED: no tertiary source used]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — installed versions and source usage were probed locally; byte APIs were checked in official docs. [VERIFIED/CITED]
- Architecture: HIGH — exact failure path, closure domains, producer/reviewer seams, and dependency chain were inspected directly. [VERIFIED: codebase]
- Pitfalls: HIGH — primary pitfall reproduced in actual history; adjacent byte/mode risks follow directly from official API/object semantics and current coverage gaps. [VERIFIED/CITED]

**Graph context:** unavailable because project graphify is disabled; no semantic graph claims were used. [VERIFIED: `gsd-tools graphify status`]

**Research date:** 2026-08-28
**Valid until:** 2026-09-27, or immediately invalid if Plan-98/99 protected bytes, Plan-100/101 topology, producer custody API, or pending Plan-92 contract changes. [PRESCRIPTIVE]
