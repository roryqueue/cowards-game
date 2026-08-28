# Phase 262: Additive Retry-v3 Source Correction and Re-review - Research

**Researched:** 2026-08-28
**Domain:** additive source-assurance correction, native filesystem custody, committed-byte re-review
**Confidence:** HIGH — the recommendation is derived from the exact Plan-90 source, the immutable 11-finding Plan-91 pair, correction-v10, the v6 custody helpers, and the repository's Plan-82/83 correction pattern. [VERIFIED: codebase and Git]

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
| ADMIT-03 | Reproduce the persisted current-rules audit matrix before candidate search; Starter and Advanced remain non-balance fixtures. [VERIFIED: `.planning/REQUIREMENTS.md`] | The correction restores only the source gate needed before the still-inactive envelope can be sealed and later consumed; it produces no accepted cell. [VERIFIED: Plans 90–95 contract] |
| ADMIT-04 | Stale, incompatible, or drifting authority stops work without in-milestone normalization. [VERIFIED: `.planning/REQUIREMENTS.md`] | Exact corrected-source/re-review custody and fail-closed mutations replace the blocked review only as the Plan-92 prerequisite. [VERIFIED: Plans 82/83/78 pattern] |
| MEAS-02 | Preserve the frozen structural units, budgets, runtime, source, retry, and hardware contract. [VERIFIED: `.planning/REQUIREMENTS.md`] | Plan 96 changes assurance mechanics only; the v3 reducer identities and D-29R bounds remain unchanged. [VERIFIED: Plan-90 model and CONTEXT.md] |
| MEAS-04 | Accepted evidence requires zero runtime/system/privacy/identity defects. [VERIFIED: `.planning/REQUIREMENTS.md`] | Installed closure, executed bytes, native publication, cleanup, Git isolation, and lock launch become enforced preconditions rather than declared booleans. [VERIFIED: Plan-91 findings] |
| MEAS-09 | Keep integrity failure distinct from clean empirical non-pass and later pass. [VERIFIED: `.planning/REQUIREMENTS.md`] | Plan 91 remains a blocked integrity result; Plan 97 is a separate source review and cannot rewrite Plan 91 or claim empirical status. [VERIFIED: D-01/D-02; Plan-83 pattern] |
| MEAS-10 | Preserve the precommitted private, profile-neutral, non-authorizing procedure. [VERIFIED: `.planning/REQUIREMENTS.md`] | Source correction and re-review remain synthetic/offline, with no Strategy, holdout, or formation work. [VERIFIED: requested scope; Plans 90/91] |
| SEAL-01 | Preserve the exact `single_operator_local_seal_v1` claim boundary. [VERIFIED: `.planning/REQUIREMENTS.md`] | Native bootstrap and pathname-launch controls explicitly retain the no-hostile-same-UID limitation and make no independent-custody claim. [VERIFIED: private native bootstrap v2] |
</phase_requirements>

## Summary

Plan 91 truthfully blocked the exact Plan-90 source commit `32f53bb743db799810dff820b8b7eb309b6a6629` with exactly 11 critical findings: six direct source defects and five failed observations. Its canonical JSON, REVIEW, summary, finding root `sha256:99ceec74a141e228b2e027c6f0b5d85ddfed8d917ad74e7a493e6d8257f8701a`, and review root `sha256:08938c5eb520b041e2b74ac07b7906d14e52197e3788ec97ff6f29350bbdf80d` are immutable non-authorizing history. Plan 92 is ineligible, and no seal-v13, retry-envelope:v3, live evidence, reproduction-v17, disposition-v3, correction-v11, Route-11, or lifecycle-v3 exists. [VERIFIED: `262-91-REVIEW.md`, canonical Plan-91 JSON, `262-91-SUMMARY.md`, filesystem]

The smallest safe correction is the already established Phase-262 shape: Plan 262-96 corrects the source additively without live/canonical publication; Plan 262-97 uses a freshly authored checker to re-review the committed Plan-96 closure while preserving Plan 91 as blocked history; only a literal zero-finding Plan-97 pair makes Plan 262-92 eligible. This mirrors Plan 82 source correction -> Plan 83 fresh re-review -> Plan 78 sealing and avoids both self-attestation and historical rewriting. [VERIFIED: `262-82-PLAN.md`, `262-83-PLAN.md`, `262-78-PLAN.md`]

Plans 92–95 retain their artifact paths, frozen v3 semantics, publication/live/adjudication/lifecycle ownership, and downstream denials. They require topology and custody edits: replace Plan-90-as-current-source and Plan-91-as-passing-review with Plan-96 corrected source and Plan-97 zero-finding closure, while adding the exact Plan-90/91 blocked branch to protected history. The reserved `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json` path remains unchanged because it is absent, already fixed by the authorized v3 contract, and has never carried live or canonical authority. [VERIFIED: Plans 92–95; filesystem; D-30R]

**Primary recommendation:** plan the exact chain `262-91 -> 262-96 -> 262-97 -> 262-92 -> 262-93 -> 262-94 -> 262-95`, with waves 78–83, no Plan-90/91 edits, and no live or authority artifact before a committed zero-finding Plan-97 closure. [PRESCRIPTIVE]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, side-effect free, and free of `Math.random`, `Date.now`, system time, filesystem, network, and database access. The correction belongs to the offline evidence/control plane, not engine logic. [VERIFIED: `AGENTS.md`]
- Keep game rules out of React and execute hostile Strategy source only through the supervised runtime-service boundary; no web/API/Go Strategy execution and no Node `vm` security boundary. [VERIFIED: `AGENTS.md`]
- Validate every hostile runtime boundary with schemas and preserve canonical game terminology. [VERIFIED: `AGENTS.md`]
- Keep submitted Strategy Revisions immutable and keep Strategy source, StrategyMemory, SoldierMemory, and objective payloads out of public replay output. [VERIFIED: `AGENTS.md`]
- Runtime tests must cover invalid output, timeout, forbidden capability, memory/source limits, schema validation, and distinguish Strategy failure from system failure. [VERIFIED: `AGENTS.md`]
- Replay/Match changes would require deterministic reconstruction and board-realism tests, but this correction makes no replay or Match change. [VERIFIED: `AGENTS.md`; scoped inference]
- Keep updated planning documents committed. This research writes only the requested research artifact; later planning must preserve the normal GSD commit workflow. [VERIFIED: `AGENTS.md`; requested scope]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Frozen v3 reducer and identity semantics | Offline evidence/control plane | — | Pure replay and counter semantics remain in `v1-38-bounded-retry-envelope-v3.ts`; no rule change is authorized. [VERIFIED: Plan-90 source] |
| Git, checkout-byte, and installed-closure authentication | Offline evidence/control plane | Git object store / installed package tree | Authority-sensitive modes must derive exact current execution inputs rather than assert booleans. [VERIFIED: Plan-91 findings; historical checkout v4] |
| Root ownership and durable publication | Native helper boundary | Offline TypeScript controller | Retained descriptors, root inode locking, and durable multi-path mutation are OS responsibilities exposed through a narrow native bridge. [VERIFIED: successor controller/helper v6] |
| Fresh independent re-review | Independent offline checker | Git object store | Plan 97 derives committed custody and runs disposable observations without importing producer verdict logic. [VERIFIED: Plan-83 pattern] |
| Seal/envelope publication | Plan 92 only | Git custody | It remains downstream of zero findings and owns no live execution. [VERIFIED: `262-92-PLAN.md`] |
| Live retry consumption | Plan 93 only | Supervised runtime-service | No live observation crosses the corrected-source gate before seal and envelope publication. [VERIFIED: `262-93-PLAN.md`] |

## Recommended Additive Plan Topology

| Plan | Wave | Depends on | Responsibility | Authority result |
|---|---:|---|---|---|
| 262-96 | 78 | 262-91 | Correct the v3 source and complete the full synthetic adversarial matrix. [PRESCRIPTIVE] | No review pass, seal, envelope, live work, accepted cell, or downstream authority. [PRESCRIPTIVE] |
| 262-97 | 79 | 262-96 | Fresh independent committed-byte re-review of Plan-96 source; publish a zero-finding-or-blocked review pair. [PRESCRIPTIVE] | Zero findings make only Plan 262-92 eligible; all other authority remains false. [PRESCRIPTIVE] |
| 262-92 | 80 | 262-97 | Existing seal-v13/inactive-envelope publication, revised to consume Plan-97 zero findings over Plan-96 source. [PRESCRIPTIVE] | Inactive Plan-93-only eligibility; zero live consumption. [VERIFIED: existing Plan 92 semantics] |
| 262-93 | 81 | 262-92 | Existing sole bounded live owner. [VERIFIED: existing Plan 93] | Live evidence only; no independent admission or downstream authority. [VERIFIED: existing Plan 93] |
| 262-94 | 82 | 262-93 | Existing independent disposition and exact-pass-only reproduction/Route-11 publication. [VERIFIED: existing Plan 94] | Branch-dependent non-authorizing evidence; only exact clean pass narrows later eligibility. [VERIFIED: existing Plan 94] |
| 262-95 | 83 | 262-94 | Existing two-stage validation/verification/lifecycle closeout. [VERIFIED: existing Plan 95] | Only exact joined pass may complete Phase 262 and expose Phase-263 planning eligibility. [VERIFIED: existing Plan 95] |

Do not renumber Plans 92–95 and do not insert Plan 96 after them in dependency order. Their current unexecuted bytes may be edited by the planner, but the Plan-90/91 executed history may not. [PRESCRIPTIVE; VERIFIED: Git status and summaries]

## Standard Stack

### Core

| Component | Version / identity | Purpose | Why standard here |
|---|---|---|---|
| Node.js | 24.15.0 | TypeScript control-plane execution | Current installed runtime; Plan 97 must record and authenticate the executed binary identity, not merely the version string. [VERIFIED: local probe; historical toolchain v4 pattern] |
| TypeScript | `^6.0.3` | Closed schemas and deterministic reducers | Existing project dependency; no new package is needed. [VERIFIED: `package.json`] |
| Vitest | `^4.1.6` | Focused synthetic, mutation, subprocess, and crash tests | Existing test runner; the installed transitive closure is itself an authenticated input. [VERIFIED: `package.json`; Plan-91 reviewer] |
| Git | 2.50.1 Apple Git-155 at `/usr/bin/git` | Commit/tree/blob/mode/ancestry custody | The repository already uses isolated `/usr/bin/git` with hardened config flags for authoritative checks. [VERIFIED: local probe; Plan-91 reviewer] |
| Apple clang | 21.0.0 | Compile one-shot reviewed native helpers in private owner-only directories | Existing private native bootstrap authenticates compiler and reproduced executable bytes under the reduced assurance boundary. [VERIFIED: local probe; private native bootstrap v2] |
| Native helper v6 | reviewed source SHA-256 `643d5c7a...261a` | Descriptor-relative root lock and pair/lifecycle transactions | It already implements `openat`, `O_NOFOLLOW`, retained-root `flock`, intent recovery, fsync, and exact pair/lifecycle operations. [VERIFIED: successor transaction helper v6] |
| Secure reader v6 | reviewed source SHA-256 `fe1915...ffc1` | Coherent required-leaf and absence batch | It revalidates required leaves, directory generations, root identity, and forbidden absences. [VERIFIED: secure reader v6 and protected-history manifest] |

### Supporting

| Component | Purpose | When to use |
|---|---|---|
| `v1-38-private-native-bootstrap-v2.ts` | Private compilation, compiler/source/output authentication, and cleanup | Every native publication or native lock-holder launch. [VERIFIED: private native bootstrap v2] |
| `run-v1-38-phase-262-historical-correction-checkouts-v4.ts` patterns | Isolated Git environment, hardened arguments, installed closure, checkout-byte manifest | Copy/adapt the narrow pure authentication logic into the v3 correction closure; do not import historical verdict authority. [VERIFIED: source inspection] |
| `v1-38-bounded-retry-successor-controller-v6.ts` patterns | One-shot token/capability, retained root fd, native transaction recovery, bootstrap cleanup | Implement the v3 native mutation bridge without weakening the helper's private non-exported mutation surface. [VERIFIED: source inspection] |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|---|---|---|
| Fresh Plan-96/97 correction branch | Edit Plan 90 or Plan 91 | Rejected: it destroys exact blocked history and violates D-01/D-24R. [VERIFIED: CONTEXT; Plan-83 pattern] |
| Authenticated native lock holder | Continue `/usr/bin/lockf` by pathname | Rejected: this is one of the six canonical source defects. [VERIFIED: Plan-91 review] |
| Native pair/lifecycle publication | Node `open(O_EXCL)` plus fsync | Rejected for authority paths: it does not satisfy the correction-v10 native publication contract or atomic crash recovery. [VERIFIED: Plan-91 review; helper v6] |
| Fresh Plan-97 checker | Reuse Plan-91 verdict as pass after source changes | Rejected: Plan 91 reviewed only Plan-90 commit and remains blocked history. [VERIFIED: Plan-91 custody; D-01] |

**Installation:** none. No package may be added or upgraded in Plans 96–97. [PRESCRIPTIVE]

## Package Legitimacy Audit

No external package installation is required, so the package-legitimacy gate is not applicable. [VERIFIED: recommended stack uses existing repository/toolchain components]

## Architecture Patterns

### System Architecture Diagram

```text
Plan-90 committed source + Plan-91 blocked JSON/REVIEW/SUMMARY
                              |
                              v protected immutable history
Plan 262-96 source correction (offline, synthetic only)
  |-- isolated /usr/bin/git + exact checkout-byte manifest
  |-- authenticated Node/pnpm/Vitest installed closure
  |-- secure-reader-v6 retained-root batch
  |-- private compiled native owner lock
  `-- helper-v6 pair/lifecycle publication + crash recovery tests
                              |
                              v committed corrected source + 262-96 summary
Plan 262-97 fresh checker in owner-only detached checkout
  |-- derive exact commit/tree/parent/blob/mode custody
  |-- rerun full adversarial matrix and disposable observations
  |-- findings > 0 --------------------> blocked; no Plan 92
  `-- findings = 0 --------------------> Plan-92 eligibility only
                                               |
                                               v
                          existing 92 -> 93 -> 94 -> 95 chain
                          seal       live   judge  lifecycle
```

The diagram is the required control-plane flow; no step enters engine logic, React, public replay, or Phase 263. [VERIFIED: AGENTS.md; Plans 92–95]

### Recommended Project Structure

```text
scripts/
├── lib/
│   ├── v1-38-bounded-retry-envelope-v3.ts                 # corrected protected-history/model joins
│   └── v1-38-bounded-retry-v3-native-custody-v1.ts        # new narrow native/authentication bridge
├── native/
│   └── v1-38-bounded-retry-v3-owner-lock-v1.c             # new retained-root long-lived lock holder
├── run-v1-38-bounded-retry-envelope-v3.ts                  # corrected gates and native publication
├── run-v1-38-bounded-retry-envelope-v3.test.ts             # complete adversarial/crash matrix
├── check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts
└── check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.test.ts
.planning/
├── artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json
└── phases/.../262-97-REVIEW.md
```

The new native-custody module and lock-holder source are the smallest clean additive seam because correction-v10 helper v6 is immutable and its mutation entry point is intentionally private; editing it or exporting its private mutation surface would invalidate protected history. [VERIFIED: protected file hashes; `checkV138SuccessorControllerV4Source` export prohibition; PRESCRIPTIVE]

### Pattern 1: Executed inputs, not declaration booleans

`V138_BOUNDED_RETRY_V3_CUSTODY` currently declares Git isolation, installed closure, native publication, and checkout binding as literal `true`, but the authority-sensitive modes do not derive those facts. Plan 96 must introduce an immutable execution-closure value returned by a real gate and thread its roots into source derivation, seal derivation, live pre-start, journal/terminal joins, and checks. [VERIFIED: Plan-90 controller; Plan-91 findings]

Recommended symbols: [PRESCRIPTIVE]

```typescript
type V138RetryV3ExecutionClosure = Readonly<{
  gitExecutableSha256: `sha256:${string}`
  gitIsolationRoot: `sha256:${string}`
  sourceCommit: string
  checkoutByteManifestRoot: `sha256:${string}`
  installedClosureRoot: `sha256:${string}`
  nodeSha256: `sha256:${string}`
  pnpmDistributionSha256: `sha256:${string}`
  nativeSourcesRoot: `sha256:${string}`
}>

authenticateV138RetryV3ExecutionClosure(repoRoot, reviewedSource)
```

Use `/usr/bin/git`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_OPTIONAL_LOCKS=0`, `core.hooksPath=/dev/null`, disabled fsmonitor, fixed attributes/EOL/symlink settings, and owner-only temporary HOME/XDG config roots. [VERIFIED: Plan-91 reviewer and historical checkout v4]

### Pattern 2: Native mutation is one capability-bound operation

The new bridge should adapt `compileOneShotNative`/`invokeNative` from controller v6: authenticate the reviewed C source, compile twice through `compileV138PrivateNativeV2`, bind a random controller token and nonce, pass capability/root descriptors on fixed fds, recheck executable digest immediately before pathname launch, use a minimal environment, wait for native handshake, and always remove the private helper in every error/exit path. [VERIFIED: successor controller v6; private native bootstrap v2]

Use helper-v6 `PAIR` for seal/envelope and success reproduction/terminal pair publication; use helper-v6 `LIFE` for journal plus private receipt and terminal transitions so intent recovery is authoritative. Do not keep `exclusiveWrite`, `publishPair`, `journalAppender`, `publishV138RetryV3TerminalResult`, or `publishV138RetryV3Outcome` as Node-owned authority mutation paths. [PRESCRIPTIVE; VERIFIED: Plan-91 native-publication findings]

### Pattern 3: Long-lived owner lock uses authenticated private native bytes

Replace `acquireV138RetryV3OwnerLease`'s `/usr/bin/lockf` child with a small reviewed C lock holder. It receives an already-open retained root fd and capability fd, verifies root/capability identity, acquires nonblocking `flock(LOCK_EX)` on the retained root inode, signals readiness, and holds the lock until its controller pipe closes. The TypeScript wrapper authenticates source/compiler/output and cleanup exactly like the existing private bootstrap. [PRESCRIPTIVE; VERIFIED: helper-v6 root-lock pattern and Plan-91 pathname finding]

The claim remains `single_operator_local_seal_v1`; because Darwin lacks acceptable descriptor execution for these helpers, Plan 96 must retain `pathnameLaunchReplacementResistanceClaimed:false` and never upgrade hostile-same-UID resistance. [VERIFIED: private native bootstrap v2]

### Pattern 4: Review correction as protected history, not verdict replacement

Plan 96 changes current source paths but adds the exact Plan-90 summary and Plan-91 JSON/REVIEW/SUMMARY hashes and roots to protected history. Plan 97 derives the unique corrected Plan-96 source carrier from Git, proves no later rewrite, and records Plan 91 as an exact blocked predecessor over Plan-90 bytes only. Plan 97 must not import the Plan-91 reviewer as verdict authority. [PRESCRIPTIVE; VERIFIED: Plans 82/83]

### Anti-Patterns to Avoid

- **Token-only remediation:** adding strings such as `installedClosureManifest(` or `hash-object` to satisfy Plan-91 inspection without enforcing their results recreates self-attestation. Plan 97 must use behavioral mutations and independent roots. [VERIFIED: Plan-91 source inspector; PRESCRIPTIVE]
- **Ambient `pnpm exec tsx` inside authority code:** the controller must use authenticated `process.execPath`/resolved installed entrypoints or same-process calls; PATH labels do not establish executed closure. [VERIFIED: correction-v10; Plan-91 detached exercise]
- **Partial native adoption:** native pair publication with Node journal/terminal writes still leaves native publication and crash recovery incomplete. All authority mutations need one native transaction model. [VERIFIED: Plan-91 findings; helper-v6 operations]
- **Plan-91 repurposing:** changing its JSON status, findings, reviewer, report, or summary would falsify the exact Plan-90 review. [VERIFIED: D-01; Plan-91 roots]
- **Correction-v11 misuse:** correction-v11 remains the Plan-94 additive artifact for a newly discovered v3 assurance defect after live evidence; it is not the source-correction carrier for Plans 96–97. [VERIFIED: `262-94-PLAN.md`]

## Exact Plan 262-96 Remediation Contract

### Files

| File | Required change |
|---|---|
| `scripts/lib/v1-38-bounded-retry-envelope-v3.ts` | Preserve all reducer identities/bounds; add exact Plan-90/91 blocked-history custody to `protectedHistoryBody.protectedFiles`/root and keep the reserved envelope path unchanged. [PRESCRIPTIVE] |
| `scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts` | New narrow bridge for isolated Git, installed closure, checkout manifest, private native compilation, native pair/lifecycle calls, and authenticated owner lease. [PRESCRIPTIVE] |
| `scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c` | New reviewed retained-root lock-holder child; no filesystem path mutation beyond its capability protocol. [PRESCRIPTIVE] |
| `scripts/run-v1-38-bounded-retry-envelope-v3.ts` | Replace ambient `git`, Node publication, Node journal append, and `/usr/bin/lockf`; require the derived execution closure in every authority-sensitive CLI mode; switch current review/summary inputs to future Plan 97/96 while protecting Plan 91/90 history. [PRESCRIPTIVE] |
| `scripts/run-v1-38-bounded-retry-envelope-v3.test.ts` | Expand from 40 declarative/synthetic cases to the complete adversarial and subprocess crash matrix. [PRESCRIPTIVE] |
| `262-96-SUMMARY.md` | Normal summary only, recording corrected source commit/tree/blobs, test counts, zero live/canonical writes, and Plan-97-only next action. [PRESCRIPTIVE] |

The immutable blocked-history entries added to the corrected protected manifest should use these exact current bytes: [VERIFIED: `shasum -a 256`; `git hash-object`]

| Protected path | SHA-256 | Git blob |
|---|---|---|
| `.planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json` | `c4dbbfa56bf903b2cb302c7a86acb87359da3f2ac696dbc2ca783376604a5232` | `eff3f1fea4719131f7ced617df7b0a1d4c89d4d2` |
| `262-91-REVIEW.md` | `fb82e3be073f896a1514ddfc4d16fc84a478342f8375ab6002e7598d72275272` | `73596b860c06c6a477960fe8936053b1006e1edd` |
| `262-91-SUMMARY.md` | `1db0d52a482f3ce954c03da3b59d22549ca6a913290b2d03ce87c80cb045cbf0` | `2070f4dd0444c28623c4fbc0270b70a654ea92a1` |
| `262-90-SUMMARY.md` | `4daded12537692e2e180ee9ccd34b8de54b425398d9a68b9923fcfa8b27988b7` | `ff882bbadc057c0e0786d9251fb942095155db72` |

Plan 97 must also bind Plan-90 source commit/tree/parent and the Plan-91 finding/review roots already listed in the Summary; these identities describe the blocked branch and never become a passing prerequisite. [PRESCRIPTIVE]

### Direct-defect mapping

| Plan-91 direct defect | Concrete remediation | Required proof |
|---|---|---|
| `AMBIENT_GIT_EXECUTION` | Delete the ambient `git()` implementation; call exact `/usr/bin/git` only through hardened args and isolated environment, authenticate repository config safety, and bind the Git executable digest into the execution closure. [PRESCRIPTIVE; analog VERIFIED: Plan-91 reviewer] | Mutate PATH `git`, global/system config, hooks, fsmonitor, attributes, and replacement objects; every mutation must fail before derivation/publication/live effects. [PRESCRIPTIVE] |
| `CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED` | Compute the current Node/pnpm/Vitest recursive installed-closure root before `--derive-seal-envelope-no-publish`, `--publish-sealed-inactive-envelope`, checks, and live mode; compare it with the Plan-97-reviewed closure and recheck after execution. [PRESCRIPTIVE] | Modify a closure file, symlink target, executable bit, dependency resolution, runner bytes, Node bytes, pnpm distribution, and tsx entrypoint; each blocks. [PRESCRIPTIVE] |
| `EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED` | Compute exact working regular-file/symlink manifest for the reviewed Plan-96 source closure, derive Git blobs/modes with isolated Git, and require byte equality immediately before and after authority-sensitive execution. [PRESCRIPTIVE] | Modify controller/model/test/native/helper bytes in the checkout after review; each blocks without output. [PRESCRIPTIVE] |
| `NATIVE_PUBLICATION_NOT_ENFORCED` | Route seal/envelope, journal/receipt, reproduction/terminal, and terminal-only publication through capability-bound helper-v6 `PAIR`/`LIFE` transactions; remove Node authority writes. [PRESCRIPTIVE] | Crash or kill at every intent/stage/link/fsync boundary; restart must recover one complete valid state or fail closed, never partial authority. [PRESCRIPTIVE] |
| `PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED` | Replace `/usr/bin/lockf` with the new private compiled reviewed lock holder bound to capability and retained root descriptors. [PRESCRIPTIVE] | Substitute source, compiler, output, launch path, capability, root inode, and lock entry; each blocks and cleans the private bootstrap. [PRESCRIPTIVE] |
| `ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE` | Add the exact matrix below, using owner-only disposable roots and actual subprocess/native observation rather than booleans. [PRESCRIPTIVE] | Plan 97 independently reruns the matrix and maps any missing/failed observation to a deterministic critical finding. [PRESCRIPTIVE] |

### Five failed-observation closure

| Failed observation | Closure condition |
|---|---|
| crash cleanup | SIGKILL/process-exit tests at lock acquisition, native bootstrap stages, journal intent/fsync, receipt fsync, reproduction stage/fsync, terminal stage/fsync; restart proves no helper/staging/intent orphan with ambiguous authority and no identity reuse. [PRESCRIPTIVE] |
| executed checkout bytes | Independent before/after checkout manifest equals the exact reviewed Git blobs/modes and includes every executed TS/C/helper path. [PRESCRIPTIVE] |
| Git isolation | Ambient PATH/config/hooks/replacement-object mutations cannot affect derived Git results; exact `/usr/bin/git` and isolated config are root-bound. [PRESCRIPTIVE] |
| installed runtime closure | Recursive Vitest/tsx/runtime/pnpm closure roots are authenticated before and after execution, with runner and binary digests recorded. [PRESCRIPTIVE] |
| native publication | Disposable publication exercises actual helper-v6 transactions and recovery across every durable boundary; no Node fallback is accepted. [PRESCRIPTIVE] |

### Complete adversarial matrix

At minimum, the Plan-96 tests and Plan-97 independent observations must cover: required-leaf symlink, directory, FIFO, oversize/truncation, parent replacement, root replacement, generation race, forbidden-path concurrent creation, secure-reader source/executable substitution, helper-v6 source/executable substitution, owner-lock source/executable substitution, compiler substitution, capability mismatch, retained-root fd mismatch, lock-entry replacement, root-lock contention, Git PATH substitution, hooks, global/system config, fsmonitor/attributes drift, replacement objects, dirty source, changed executed checkout bytes, changed installed package file/symlink/mode/dependency, changed Node/pnpm/Vitest/tsx bytes, partial pair publication, every pair/lifecycle crash boundary, journal/receipt crash ordering, all `reproduction_write` through `terminal_fsync` boundaries, bootstrap failure cleanup, spawn failure cleanup, repeated invocation, stale owner, privacy projections, and all authority-field mutations. [PRESCRIPTIVE; families VERIFIED: correction-v10, secure reader v6 tests, successor controller v6 tests, Plan-91 reviewer]

## Exact Plan 262-97 Re-review Contract

### Files and symbols

| File | Required content |
|---|---|
| `scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts` | New checker exporting path constants, custody inspection, protected Plan-90/91 inspection, detached exercise, observation evaluator, canonical root computation, pair validator, write/check CLI modes, and destination snapshot. [PRESCRIPTIVE] |
| `scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.test.ts` | Tests exact corrected custody, every direct-defect mutation, every observation failure/incompletion, historical tampering, false-authority tampering, deterministic roots, and no-publish derivation. [PRESCRIPTIVE] |
| `.planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json` | Canonical zero-finding-or-blocked result bound to Plan-96 source and exact Plan-91 blocked history. [PRESCRIPTIVE] |
| `262-97-REVIEW.md` | Safe deterministic projection of the canonical JSON. [PRESCRIPTIVE] |
| `262-97-SUMMARY.md` | Normal summary and unique review-closure carrier used by Plan 92. [PRESCRIPTIVE] |

Recommended exported symbols are `V138_PLAN_262_97_SOURCE_PATHS`, `V138_PLAN_262_97_REVIEW_PATH`, `V138_PLAN_262_97_REPORT_PATH`, `inspectV138Plan26297CorrectedSource`, `inspectV138Plan26297BlockedHistory`, `runV138Plan26297DetachedExercise`, `evaluateV138Plan26297Observations`, `deriveV138Plan26297NoPublish`, `computeV138Plan26297ReviewRoot`, `validateV138Plan26297Review`, and `snapshotV138Plan26297Destinations`. [PRESCRIPTIVE]

The re-review must derive the unique Plan-96 source-completion commit from `262-96-SUMMARY.md`, bind the exact source/model/test/native-custody/native-lock files and modes, prove the summary's sole carrier and ancestry, and prove no later rewrite. Summary prose remains evidence input only and is never trusted as verdict. [PRESCRIPTIVE; analog VERIFIED: Plan-83]

The canonical result should use `status: zero_findings | blocked`, `sourceReviewPassed === (findingCount === 0)`, `authority.plan26292Eligible === (findingCount === 0)`, and every live/downstream/identity claim false. It must carry exact Plan-91 review/finding roots and hashes as `blockedHistory`, with `historicalResultReinterpreted:false`. [PRESCRIPTIVE]

## Downstream Plan 92–95 Revision Audit

### Plan 92: required edits, unchanged artifacts

Revise wave to 80 and dependency to `[262-97]`. Replace context/read-first/check commands for Plan 91 with Plan 97 and replace current-source custody from Plan 90 with Plan 96. Rename internal topology labels from the old `R1` passing closure to a fresh Plan-97 closure such as `R2`; the seal/envelope pair remains the first v3 publication commit and may retain `B3` if the planner uses that label consistently. Add exact Plan-90/91 blocked bytes/roots to protected history and require Plan-97 zero findings. [PRESCRIPTIVE]

Keep these paths and semantics unchanged: [PRESCRIPTIVE]

- `.planning/artifacts/v1.38-successor-source-seal-v13.json`
- `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json`
- exact two-path direct-child publication
- `sealed_inactive`, zero counters, Plan-93-only eligibility
- D-29R limits and every downstream denial
- native exclusive publication and canonical rerender checks

The Plan-90 name in the reserved envelope path is historical provenance, not a claim that uncorrected Plan-90 bytes passed. The seal fields must explicitly bind Plan-96 source commit/root and Plan-97 review root/closure so the path cannot be misread as source authority. [PRESCRIPTIVE]

### Plan 93: input edits only

Revise wave to 81. Keep dependency `[262-92]`, live artifact paths, single-invocation semantics, frozen limits, private receipt policy, and no-reproduction/no-authority boundary unchanged. Replace the Plan-91 review input/read-first and pre-start join with Plan-97; require seal-v13 to bind Plan-96/97 and exact Plan-90/91 blocked history. [PRESCRIPTIVE; existing semantics VERIFIED: Plan 93]

### Plan 94: source/review custody edits only

Revise wave to 82. Keep dependency `[262-93]`, checker/artifact names, branch semantics, correction-v11 meaning, and exact-pass-only reproduction-v17/Route-11 publication unchanged. Its new checker/tests must derive Plan-96 corrected source and Plan-97 zero-finding roots rather than Plan-90/91-as-passing inputs, while authenticating Plan 91 as protected blocked history. [PRESCRIPTIVE; existing semantics VERIFIED: Plan 94]

### Plan 95: topology wording only

Revise wave to 83. Keep dependency `[262-94]`, two-stage summary latch, readiness/lifecycle paths, branch rules, and allowed lifecycle mutations unchanged. Its seal-v13/zero-findings checks must resolve the Plan-96/97 lineage carried by Plan 94; no new source or review artifact belongs to Plan 95. [PRESCRIPTIVE; existing semantics VERIFIED: Plan 95]

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---|---|---|---|
| Coherent workspace snapshot | Repeated `existsSync`/`readFileSync` calls | `readV138WorkspaceBatch` / secure reader v6 | Required/forbidden leaves and parent generations need one retained-root session. [VERIFIED: correction-v10] |
| Durable multi-path publication | Node exclusive writes with best-effort rollback | helper-v6 `PAIR`/`LIFE` transaction protocol | It owns intents, descriptor locks, staging, fsync, recovery, and root lock. [VERIFIED: helper v6] |
| Native compiler trust | Ambient `cc`/`clang` or installed cached helper | `compileV138PrivateNativeV2` | It authenticates compiler/source/reproduced output and cleans owner-only helpers. [VERIFIED: bootstrap v2] |
| Git isolation | PATH `git` with inherited HOME/config | Exact `/usr/bin/git` plus hardened args/environment | Hooks, config, attributes, fsmonitor, and replacement objects otherwise alter custody. [VERIFIED: Plan-91 reviewer] |
| Source re-review | Producer self-check or old verdict reuse | Fresh Plan-97 checker | Changed source requires a distinct review root and pair. [VERIFIED: D-01; Plan-83 pattern] |

**Key insight:** the reducer is not the blocker; the missing layer is enforced execution and publication custody. Preserve the v3 state machine and replace asserted assurance booleans with authenticated roots and native operations. [VERIFIED: all 11 Plan-91 findings]

## Runtime State Inventory

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | None in scope — Plan 90/91 and Plans 96/97 use Git files, owner-only disposable roots, and absent canonical destinations; no database/datastore is read or mutated. [VERIFIED: source and plans] | None. [VERIFIED] |
| Live service config | None — no runtime-service configuration, UI-held configuration, or external service is changed; runtime-service remains only a later Plan-93 execution dependency. [VERIFIED: source and requested scope] | None. [VERIFIED] |
| OS-registered state | None — no launchd/systemd/pm2/task registration is used. The native owner lock is process-scoped and kernel-released. [VERIFIED: source pattern; PRESCRIPTIVE] | Ensure crash tests prove no surviving child/lock owner. [PRESCRIPTIVE] |
| Secrets/env vars | No secret key change. Git isolation uses ephemeral HOME/XDG and fixed environment values; local-seal secret ingress remains untouched and must not be accessed. [VERIFIED: Plan-91 reviewer; CONTEXT] | Test inherited hostile Git variables/config cannot affect custody; never access local seal. [PRESCRIPTIVE] |
| Build artifacts / installed packages | Current `node_modules`, Node/pnpm/Vitest/tsx bytes, and private compiled native helpers are execution state. [VERIFIED: Plan-91 findings; bootstrap v2] | Authenticate installed closure before/after; clean every private compiler/helper directory on success, failure, spawn error, and crash recovery. [PRESCRIPTIVE] |

## Common Pitfalls

### Pitfall 1: Making Plan 97 pass by matching Plan-91 token heuristics

**What goes wrong:** source contains expected strings but authority modes still do not enforce the derived roots. [VERIFIED: Plan-91 inspector structure]

**How to avoid:** Plan 97 must behaviorally mutate Git, checkout, installed closure, native helpers, lock launch, and crash boundaries, then independently verify no destinations changed. [PRESCRIPTIVE]

### Pitfall 2: Authenticating detached review closure but not later execution closure

**What goes wrong:** Plan 97 proves its own detached checkout, while Plan 92/93 execute from a different mutable installed tree. [VERIFIED: distinction exposed by `CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED`]

**How to avoid:** the producer itself authenticates the current closure against the review-bound expected roots immediately before and after every authority-sensitive mode. [PRESCRIPTIVE]

### Pitfall 3: Holding one lock while publishing through another namespace

**What goes wrong:** pathname lock replacement or root rename splits ownership from mutation. [VERIFIED: helper-v6 comments/tests]

**How to avoid:** owner lock and transaction helper both lock the retained root inode; target locks are descriptor-relative beneath that same root. [PRESCRIPTIVE]

### Pitfall 4: Treating native helper cleanup as cosmetic

**What goes wrong:** a crash leaves reusable executable/capability/staging material or ambiguous publication. [VERIFIED: Plan-91 crash observation; controller-v6 bootstrap cleanup tests]

**How to avoid:** cleanup is part of the verdict. Unknown cleanup terminalizes/fails closed; restart reconciles intents and never reruns a charged identity. [PRESCRIPTIVE]

### Pitfall 5: Renaming the reserved envelope path after source correction

**What goes wrong:** a new pathname can look like an unauthorized third envelope or drift from D-30R's already frozen destination set. [VERIFIED: CONTEXT and Plan-90 research]

**How to avoid:** keep the absent Plan-90-named v3 destination and make corrected source/re-review lineage explicit inside seal/envelope custody. [PRESCRIPTIVE]

## Code Examples

### Isolated Git invocation

```typescript
// Source: existing Plan-91 independent reviewer pattern
const env = {
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  HOME: ownerOnlyTemporaryRoot,
  XDG_CONFIG_HOME: ownerOnlyTemporaryRoot,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
}
execFileSync("/usr/bin/git", hardenedGitArgs(args), { cwd: repoRoot, env })
```

The implementation must also bind the executable digest and returned object identities into the execution-closure root. [PRESCRIPTIVE]

### Fail-closed re-review eligibility

```typescript
// Source: established Plan-83/Plan-91 review schema pattern
const zero = findings.length === 0
const review = {
  status: zero ? "zero_findings" : "blocked",
  sourceReviewPassed: zero,
  findingCount: findings.length,
  authority: {
    plan26292Eligible: zero,
    authorizesExecution: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
  },
}
```

The real schema must keep every remaining authority and identity claim explicitly false. [PRESCRIPTIVE]

## State of the Art

| Old approach in Plan 90 | Corrected approach | Impact |
|---|---|---|
| Literal custody booleans | Derived execution-closure roots checked before/after modes | Assurance becomes enforced evidence. [VERIFIED: Plan-91 finding rationale] |
| Ambient `git` | Exact isolated `/usr/bin/git` | Git config/PATH/replacement drift fails closed. [VERIFIED: Plan-91 reviewer] |
| Node exclusive writes | Native capability-bound pair/lifecycle transactions | Publication and recovery use retained-root semantics. [VERIFIED: helper v6] |
| `/usr/bin/lockf` pathname child | Private compiled reviewed root-lock holder | Lock launch closure is authenticated within the declared reduced assurance. [PRESCRIPTIVE] |
| 40 incomplete synthetic tests | Full adversarial/native/subprocess/crash matrix | The five failed observations become independently executable proof. [VERIFIED: Plan-91 findings] |
| Plan-91 as expected pass input | Plan-91 protected blocked history + Plan-97 fresh result | Historical truth and current eligibility are separated. [VERIFIED: Plan-83 pattern] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| — | None. All descriptive claims are derived from repository files or local tool probes; prescriptive design choices are labeled `[PRESCRIPTIVE]`. | — | — |

## Open Questions

1. **Exact Plan-96 source carrier commit and hashes**
   - What we know: Plan 96 must commit corrected source and its summary separately under normal execution. [VERIFIED: established plan workflow]
   - What's unclear: commit/tree/blob/root values do not exist until execution. [VERIFIED: current Git]
   - Recommendation: Plan 97 derives them from Git; do not predeclare them in planning. [PRESCRIPTIVE]

2. **Final corrected test count**
   - What we know: Plan 90 has 40 focused tests and Plan 91 proved the matrix incomplete. [VERIFIED: summaries/review]
   - What's unclear: the exact count after parameterized adversarial/crash cases. [VERIFIED: not yet implemented]
   - Recommendation: plan named matrix coverage and require Plan 97 to report the observed count; do not freeze a guessed count. [PRESCRIPTIVE]

## Environment Availability

| Dependency | Required By | Available | Version / identity | Fallback |
|---|---|---:|---|---|
| Node.js | Plan-96/97 TypeScript and tests | ✓ | 24.15.0 | None; identity mismatch blocks. [VERIFIED: local probe] |
| pnpm | Existing scripts/test invocation | ✓ | 11.1.2 | Direct authenticated entrypoints inside evidence code; no ambient fallback. [VERIFIED: local probe] |
| Git | Source/review custody | ✓ | `/usr/bin/git`, Apple Git 2.50.1 | None; exact tool required. [VERIFIED: local probe] |
| Apple clang | Private native compilation | ✓ | 21.0.0 | None under current bootstrap contract. [VERIFIED: local probe] |
| codesign | Compiler/helper identity checks | ✓ | `/usr/bin/codesign` on macOS 26.5.1 | None under current bootstrap contract. [VERIFIED: local probe] |
| Darwin kernel | `flock`, `openat`, no-follow, fsync semantics | ✓ | Darwin 25.5.0 x86_64 | No cross-platform fallback is authorized. [VERIFIED: local probe; helper sources] |

**Missing dependencies with no fallback:** none detected. [VERIFIED: local probes]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest `^4.1.6` [VERIFIED: `package.json`] |
| Config file | package scripts / repository defaults; focused files are invoked directly. [VERIFIED: existing plans] |
| Quick run command | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --hookTimeout=180000 --bail=1` [VERIFIED: Plan 90/91 command pattern] |
| Full source-correction gate | focused Plan-96 suite, focused Plan-97 suite, Plan-97 `--check-review`, `pnpm exec tsc --noEmit --pretty false`, and `git diff --check`, run serially. [PRESCRIPTIVE] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| ADMIT-03 | No accepted/live work; corrected gate remains pre-reproduction | integration/absence | Plan-96 focused suite plus destination snapshot | Existing file, new cases required. [VERIFIED/PRESCRIPTIVE] |
| ADMIT-04 | Git/source/review drift blocks | mutation/integration | Plan-97 focused suite | No — Wave 0. [PRESCRIPTIVE] |
| MEAS-02 | All D-29R bounds/identities unchanged | unit/mutation | Plan-96 focused suite | Existing file, retain cases. [VERIFIED] |
| MEAS-04 | Closure/native/crash/privacy failures cannot become accepted evidence | subprocess/native integration | Plan-96 and Plan-97 focused suites | Partial — Wave 0 expansion. [VERIFIED/PRESCRIPTIVE] |
| MEAS-09 | Blocked Plan 91 remains distinct from fresh Plan 97 result | schema/mutation | Plan-97 focused suite | No — Wave 0. [PRESCRIPTIVE] |
| MEAS-10 | No formation/holdout/public authority | absence/schema mutation | Both focused suites | Partial — expand protected history. [PRESCRIPTIVE] |
| SEAL-01 | Exact reduced-assurance claim and native custody | native integration/mutation | Both focused suites | Partial — Wave 0 lock-holder/native bridge. [PRESCRIPTIVE] |

### Sampling Rate

- **Per Plan-96 task commit:** Plan-96 focused suite, serialized. [PRESCRIPTIVE]
- **Per Plan-97 task commit:** Plan-97 focused suite, serialized. [PRESCRIPTIVE]
- **Per wave merge:** both focused suites plus typecheck and source-only/no-publish checks. [PRESCRIPTIVE]
- **Phase gate:** latest committed Plan-97 pair validates with exact zero findings before Plan 92; otherwise stop. [PRESCRIPTIVE]

### Wave 0 Gaps

- [ ] `scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts` and native bridge tests through the main Plan-96 suite. [PRESCRIPTIVE]
- [ ] `scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c` plus substitution/contention/cleanup tests. [PRESCRIPTIVE]
- [ ] Complete Plan-96 adversarial and subprocess crash cases. [PRESCRIPTIVE]
- [ ] Fresh Plan-97 checker and test file. [PRESCRIPTIVE]
- [ ] Plan-97 canonical JSON/REVIEW pair validation and no-publish derivation. [PRESCRIPTIVE]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no for users; yes for evidence identity | Exact Git/toolchain/source/closure roots, not account authentication. [VERIFIED: phase domain] |
| V3 Session Management | no | No user/session surface. [VERIFIED: scope] |
| V4 Access Control | yes | Owner-only `0700` roots, `0600` private files, capability fd, retained root fd, nonblocking root lock. [VERIFIED: bootstrap/helper patterns] |
| V5 Input Validation | yes | Closed TypeScript schemas, canonical JSON, bounded native protocol, exact path normalization, no-follow regular-file checks. [VERIFIED: existing sources] |
| V6 Cryptography | yes | SHA-256 content addressing and OS code-sign verification; no custom signing trust system. [VERIFIED: sources and CONTEXT discretion] |
| V7 Error/Logging | yes | Typed bounded reasons and privacy-safe roots; no raw diagnostics/Strategy/memory/objective payloads. [VERIFIED: Plan-90 privacy model; AGENTS.md] |
| V8 Data Protection | yes | Owner-only disposable/private roots and public-safe projections. [VERIFIED: reviewer/bootstrap patterns] |
| V10 Malicious Code | yes | Installed dependency closure, executed bytes, native source/output, Git replacement/hook/config isolation. [VERIFIED: Plan-91 findings] |
| V12 Files/Resources | yes | Retained-root `openat`, `O_NOFOLLOW`, generation checks, bounded reads, fsync, atomic native transactions. [VERIFIED: native reader/helper v6] |
| V13 API/Web Service | no | No API endpoint or web surface changes. [VERIFIED: scope] |

### Known Threat Patterns for the Stack

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| PATH/config/replacement-object Git spoofing | Spoofing/Tampering | Exact `/usr/bin/git`, isolated config/environment, hardened flags, executable/root binding. [VERIFIED: Plan-91 reviewer] |
| Installed dependency or runner substitution | Tampering | Recursive closure manifests before/after execution. [PRESCRIPTIVE; need VERIFIED by Plan 97] |
| Checkout byte drift after review | Tampering/Repudiation | Exact Git blob/mode-to-working-byte manifest before/after. [PRESCRIPTIVE; analog VERIFIED: historical checkout v4] |
| Symlink/FIFO/parent/root replacement | Tampering/Disclosure | Retained descriptors, no-follow, regular-file enforcement, generation revalidation. [VERIFIED: secure reader v6] |
| Partial publication after crash | Tampering/Repudiation | Native intent-backed PAIR/LIFE transaction and restart recovery. [VERIFIED: helper/controller v6] |
| Pathname child substitution | Spoofing/Elevation | Private compiled authenticated helper plus immediate prelaunch digest; retain reduced assurance claim. [VERIFIED: bootstrap v2; PRESCRIPTIVE use] |
| Historical result rewriting | Repudiation | Exact Plan-91 roots/hashes in protected history and separate Plan-97 namespace. [VERIFIED: D-01; Plan-83 pattern] |

## Sources

### Primary (HIGH confidence)

- `262-91-REVIEW.md`, `262-91-SUMMARY.md`, and `.planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json` — exact 11 findings, roots, custody, and non-authority. [VERIFIED: codebase]
- `scripts/run-v1-38-bounded-retry-envelope-v3.ts`, its model and tests — exact defect sites and current 40-test source closure. [VERIFIED: codebase]
- `scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts` and test — finding rules, detached closure, installed manifest, checkout binding, and failed observations. [VERIFIED: codebase]
- `scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts`, `scripts/native/v1-38-successor-transaction-helper-v6.c`, `scripts/lib/v1-38-secure-workspace-path-v6.ts`, and native reader v6 — hardened analogs. [VERIFIED: codebase]
- `scripts/lib/v1-38-private-native-bootstrap-v2.ts` — exact reduced assurance and private compiler/helper authentication. [VERIFIED: codebase]
- Plans 82, 83, and 78 — established additive correction, fresh re-review, then seal pattern. [VERIFIED: codebase]
- Plans 92–95 — current reserved paths and downstream ownership semantics. [VERIFIED: codebase]
- `AGENTS.md`, `262-CONTEXT.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json` — constraints, requirements, Nyquist/security settings. [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- None. No external documentation was needed; this is a codebase-specific custody correction. [VERIFIED: research scope]

### Tertiary (LOW confidence)

- None. [VERIFIED: assumptions log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — current binaries and package declarations were probed locally. [VERIFIED: local probes]
- Architecture: HIGH — source defects map directly to existing hardened v6 implementations and an established correction/re-review topology. [VERIFIED: codebase]
- Downstream revisions: HIGH — Plans 92–95 explicitly separate source/review inputs from their artifact paths and lifecycle roles. [VERIFIED: plan files]
- Pitfalls/security: HIGH — derived from the canonical 11 findings and existing adversarial helpers/tests. [VERIFIED: codebase]

**Research date:** 2026-08-28
**Valid until:** 2026-09-27, or immediately stale if any Plan-90/91 historical byte, correction-v10 helper byte, or Plan-92–95 contract changes. [PRESCRIPTIVE]
