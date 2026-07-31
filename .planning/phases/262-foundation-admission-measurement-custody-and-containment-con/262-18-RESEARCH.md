# Phase 262 Plan 18: Stopped-Route Successor Repair, Custody, and Fresh Authority - Research

**Researched:** 2026-07-30
**Domain:** Fail-closed subprocess dispatch, attempt-identity accounting, immutable Git/evidence custody, and single-use Pattern C authority
**Confidence:** HIGH for the three source defects and immutable-route findings; MEDIUM for the recommended successor topology until a planner assigns final artifact names and a human grants fresh authority.

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

### the agent's Discretion
- Exact schema, module, command, storage, and typed-reason names are left to research and planning within the locked evidence and privacy boundaries.
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

Plan 262-16 did not establish that no subprocess was started. Its public-safe calibration:v5 projection reports eight charged identities, four shards, `childLaunchCount: 0`, `acceptedCellCount: 0`, and `supervisedCalibration: null`, while eleven shared headroom ticks each name all four active shards. The v5 adapter searches returned terminal outcomes using `calibration:v5:<index>`, but the scheduler creates execution IDs as `calibration:v5:<index>:<templateAttemptId>`. Every returned outcome is therefore missed and projected as `unfilled` with `childLaunched: false`. [VERIFIED: `scripts/lib/v1-38-current-matrix-reproduction.ts`] [VERIFIED: `.planning/artifacts/v1.38-current-matrix-calibration-v5.json`]

A second projection defect reconstructs shard IDs with `index % 4`, while the frozen calibration inventory assigns attempts in pairs with `Math.floor(index / 2)`. Even if the attempt-ID lookup were relaxed, the wrapper would still attribute attempts 1, 2, 3, 4, 5, and 6 to the wrong shards. [VERIFIED: `deriveV138ParallelCalibrationPolicy`] [VERIFIED: `writeV138ParallelCalibrationV5Receipt`]

A third deterministic defect exists in the child entrypoint. The module executes `await runReceiptCli()` before `runShardCli()`. For a child invoked with `--execute-shard`, `runReceiptCli()` reaches its unknown-command rejection before `runShardCli()` can process the payload. This explains a process-failure route independently of resource headroom, but the immutable public-safe calibration:v5 artifact deliberately discarded the stopped supervised receipt and its typed reason. The exact historical runtime failure cause therefore cannot be reconstructed solely from retained public-safe evidence; the safe conclusion is that reviewed A contains three sufficient defects and that the recorded zero-child/shard projection is not trustworthy as an OS-launch or attribution fact. [VERIFIED: `scripts/lib/v1-38-current-matrix-reproduction.ts`] [VERIFIED: `.planning/artifacts/v1.38-current-matrix-calibration-v5.json`]

The smallest realistic route is a three-stage successor: **Plan 262-18 fixes and injectively proves only subprocess dispatch, exact v5 attempt/shard projection, and the four failing test-isolation cases; freezes a newly reviewed source A2; obtains a fresh human authorization; and commits only the new authorization plus successor seal as direct child B2. Plan 262-19 owns one new Pattern C live attempt. Plan 262-20 independently checks the terminal and updates validation/verification/tracking.** Existing A, B, every stopped receipt/root, every charged allocation, and the expired terminal remain immutable protected predecessors. [RECOMMENDED] [VERIFIED: 262-CONTEXT.md]

**Primary recommendation:** Fix the three source defects and the test-isolation warning first, require a clean deep review and new A2/B2 custody, then grant one fresh exact authority whose bytes explicitly bind the prior expired route and cannot authorize any operation under Plan 262-15/16.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| CLI mode dispatch | Private lab coordinator CLI | Supervised shard adapter | The module must route `--execute-shard` to the shard handler before receipt-command validation; this is orchestration, not game logic. [VERIFIED: codebase] |
| Calibration attempt identity | Evidence/accounting contract | Supervised scheduler | The scheduler owns execution IDs and the receipt adapter must preserve those exact IDs without lossy reconstruction. [VERIFIED: codebase] |
| Host headroom observation | OS/host adapter | Private lab coordinator | The existing Apple memorystatus provider and inclusive 2,500 bp gate remain unchanged. [VERIFIED: successor seal v1] |
| Strategy execution | Supervised runtime service | Canonical `MATCH_KERNEL` | No repair may move hostile Strategy execution into the coordinator or change transition authority. [VERIFIED: AGENTS.md] |
| Source and evidence custody | Git object/evidence layer | Independent review | A2 binds reviewed source; B2 is its direct child containing only fresh authorization and seal artifacts. [RECOMMENDED] |
| Live attempt | Main orchestrator under Pattern C | Zero active executor agents | Live work must remain separated from source repair/review and independent interpretation. [VERIFIED: Plans 262-16/17] |
| Post-terminal interpretation | Independent verifier | Validation/tracking docs | A green checker over a stopped branch proves integrity, not empirical success. [VERIFIED: 262-VERIFICATION.md] |

## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| ADMIT-01 | Maintainers can begin authoritative v1.38 Strategy evaluation only when the v1.37 audit, archive commit, annotated tag, and independent post-tag checker all resolve and pass. | A2/B2 must retain the already verified predecessor join and bind all intervening terminal history rather than re-admit labels. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| ADMIT-02 | Every v1.38 research root resolves and records the exact selected rules, engine, runtime ABI, Chronicle, arena-catalog, Set-policy, canonical-JSON, provider, runtime, and conformance identities instead of trusting copied labels. | The successor seal must rederive the selected route at A2 and retain the unchanged semantic/runtime/provider tuple. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| ADMIT-03 | Researchers can reproduce the persisted current-rules audit matrix before candidate search and can use Starter and Advanced Strategies only as smoke, regression, and throughput fixtures rather than balance evidence. | The three source defects must be fixed before a new one-shot calibration can meaningfully gate a fresh exact 540-cell reproduction. [VERIFIED: `.planning/REQUIREMENTS.md`] |
| ADMIT-04 | A missing, stale, incompatible, or semantically drifting predecessor authority stops authoritative v1.38 work and returns the defect to the integrity foundation without repairing, normalizing, or changing canonical behavior inside this milestone. | Every A2/B2/old-root/fresh-target mismatch must terminate before observation, with old evidence untouched and no retry. [VERIFIED: `.planning/REQUIREMENTS.md`] |

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime tests must distinguish Strategy failure from system failure and cover invalid output, timeout, forbidden capability, memory/source limits, and schema validation. [VERIFIED: AGENTS.md]
- Planning documents are normally committed; this research task explicitly forbids committing. [VERIFIED: AGENTS.md] [VERIFIED: task scope]

## Root-Cause Analysis

### Defect 1: Lossy v5 attempt-identity projection

The calibration policy creates identities shaped `calibration:v1:<index>:<templateAttemptId>`. With `executionIdentityVersion: "v5"`, the scheduler replaces only the `calibration:v1:` prefix, yielding `calibration:v5:<index>:<templateAttemptId>`. [VERIFIED: `deriveV138ParallelCalibrationPolicy` and `calibrateV138ParallelMatrix`]

The v5 writer then searches for `calibration:v5:<index>` and emits its own simplified eight-element ledger. Because no scheduler outcome has that simplified ID, all eight searches return `undefined`, all outcomes become `unfilled`, and all `childLaunched` fields become false. [VERIFIED: `writeV138ParallelCalibrationV5Receipt`]

The artifact's eleven shared ticks list all four shard IDs. In the scheduler, shared observation returns immediately unless `active.size > 0`, so the ticks prove four assignments were active while observations ran. They do not by themselves prove successful OS child creation, but they contradict reading `childLaunchCount: 0` as “the scheduler never attempted work.” [VERIFIED: `runV138SupervisedAssignments`] [VERIFIED: calibration:v5 artifact]

**Required fix:** define one canonical v5 execution-attempt identity function and use it for both assignment creation and receipt lookup. The smallest compatible correction is to make v5 execution IDs exactly `calibration:v5:<index>` while retaining `templateAttemptId` separately on the assignment; do not parse or truncate IDs in the receipt writer. [RECOMMENDED]

### Defect 2: Wrapper reconstructs the wrong shard identities

The frozen calibration inventory assigns attempts 0–1 to shard 0, 2–3 to shard 1, 4–5 to shard 2, and 6–7 to shard 3 using `Math.floor(index / 2)`. The v5 wrapper instead emits `calibration-shard:${index % 4}`, producing the sequence 0,1,2,3,0,1,2,3. [VERIFIED: `deriveV138ParallelCalibrationPolicy`] [VERIFIED: `writeV138ParallelCalibrationV5Receipt`]

**Required fix:** never reconstruct shard ownership from an ordinal in the wrapper. Join each terminal outcome to the canonical policy inventory by exact execution-attempt ID and copy the inventory's exact `shardId`. Reject a missing, duplicate, conflicting, foreign, or wrong-shard outcome rather than fabricating `unfilled`. [RECOMMENDED]

### Defect 3: Receipt CLI intercepts the shard CLI

The subprocess runner invokes the same module with `--execute-shard`. At module bottom, `runReceiptCli()` is awaited before `runShardCli()`. The receipt CLI accepts a fixed command set that excludes `--execute-shard` and throws `MATRIX_RECEIPT_CLI_COMMAND_INVALID`; `runShardCli()` is therefore unreachable for this invocation. [VERIFIED: `scripts/lib/v1-38-current-matrix-reproduction.ts`]

**Required fix:** introduce one discriminator-first direct-entry dispatcher. When the direct command is `--execute-shard`, invoke only the shard handler; otherwise invoke only the receipt/checker handler. Unknown commands must still fail closed. Do not “fix” this by adding Strategy execution to tests or by weakening receipt-command validation. [RECOMMENDED]

### Historical conclusion boundary

The stopped public receipt sets `supervisedCalibration: null`, so it retains neither the scheduler's typed `reason` nor terminal stderr. That privacy-safe omission must not be retroactively repaired by editing the artifact or inventing a root-cause field. [VERIFIED: calibration:v5 artifact] [VERIFIED: D-01]

The three defects are sufficient to require source repair before another attempt. They are not sufficient to claim which low-level child event happened in the expired run, because raw diagnostics were intentionally not retained and cannot be regenerated under old authority. [VERIFIED: codebase and artifacts]

The truthful reinterpretation is narrow: calibration:v5 remains a valid immutable **stopped-process accounting artifact** proving eight charged allocation identities, zero accepted evidence, no reproduction, no retry, and expired authority. Its wrapper-produced `childLaunchCount`, per-attempt `childLaunched`, `unfilled` outcomes, and shard attribution are not reliable evidence of physical launch or correct assignment because their projection code is defective. Do not invalidate, overwrite, or “correct” the receipt; bind it as stopped history and add the new finding in successor lineage. [VERIFIED: calibration:v5 artifact] [VERIFIED: source audit] [RECOMMENDED]

## Test-Isolation Warning

Four artifact-presence tests clone the repository, write a synthetic `262-15-REVIEW.md`, and only then attempt `git checkout` of the older source-A fixture. Because that path is tracked and its synthetic bytes differ, Git refuses the checkout to protect the dirty file. [VERIFIED: `scripts/evaluate-v1-38-foundation-contract.test.ts`] [VERIFIED: `262-VALIDATION.md`]

The fix is mechanical: checkout the intended fixture commit before creating or replacing the synthetic review fixture. Each test must configure its clone, checkout the exact fixture, then create only the files needed for that branch. Cleanup remains in `finally`. [RECOMMENDED]

The clean Plan 262-15 deep review cannot waive this warning: the warning was discovered by later validation, and a new A2 review must include the corrected tests and a green artifact-presence selector. [VERIFIED: `262-15-REVIEW.md`] [VERIFIED: `262-VALIDATION.md`]

## Standard Stack

### Core

| Component | Version / identity | Purpose | Disposition |
|---|---|---|---|
| Existing TypeScript/Node module | A2-resolved blob | Fix CLI dispatch and attempt identity without changing game semantics. [VERIFIED: codebase] | Use; no new package. |
| Existing Vitest suite | `4.1.6` declared in repository | Injected regression and mutation tests. [VERIFIED: package metadata] | Use; no new package. |
| Existing Git object inspection | Repository Git | A2/B2 ancestry, trees, parents, blobs, aggregate delta, and direct-child proof. [VERIFIED: existing source seal] | Use. |
| Existing canonical JSON/domain-separated roots | Repository implementation | Versioned authorization, seal, terminal, and protected-evidence identities. [VERIFIED: codebase] | Use. |
| Existing Darwin headroom provider | `apple-memory-pressure-q-v1` | One shared bounded observation per tick. [VERIFIED: successor seal v1] | Preserve byte semantics and policy. |

### Supporting

| Component | Purpose | When to Use |
|---|---|---|
| Injected `V138ParallelShardRunner` | Produce synthetic success/failure terminals without Strategy or Match execution. [VERIFIED: codebase interface] | Source-fix tests and review only. |
| Injected argv/dispatch selector | Prove one and only one CLI handler owns each command. [RECOMMENDED] | Source-fix tests and mutation tests. |
| Existing terminal-first branch checkers | Verify required presence/absence without observation or writing. [VERIFIED: codebase] | Pre-authorization, pre-live, and independent post-terminal stages. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| New reviewed A2 | Reauthorize existing A/B | Rejected: it knowingly preserves both defects and the unresolved test warning. [VERIFIED: source audit] |
| Canonical v5 ID function | Make the receipt search by prefix | Rejected: prefix matching is ambiguous and can hide duplicates or conflicting template suffixes. [RECOMMENDED] |
| Explicit direct-entry dispatcher | Merely reorder the two bottom-level calls | Rejected: reordering can make receipt commands pass through shard handling and retains dual-dispatch ambiguity. [RECOMMENDED] |
| Injected proof | Execute a real calibration during source review | Rejected: review must not consume live authority or run Strategy/Match work. [VERIFIED: phase boundary] |
| New artifact paths | Overwrite v5/v6/Plan-262-16 artifacts | Rejected: violates immutable evidence and no-retry custody. [VERIFIED: D-01, D-05] |

**Installation:** none. No external package is required. [VERIFIED: codebase]

## Package Legitimacy Audit

No external package is introduced by the recommended repair, so the package-legitimacy gate is not applicable. [VERIFIED: recommended stack]

## Recommended Architecture

### System Architecture Diagram

```text
immutable stopped history
  A -> direct-child B -> context:v5 -> preflight:v5
                              -> calibration:v5(stopped, 8 charged)
                              -> terminal:262-16(expired)
                                      |
                                      v
Plan 262-18 sourceBase (descendant of all stopped-history commits)
  -> source/test repair commits
  -> injected tests + clean deep review
  -> final reviewed A2
       -> fresh human authorization over exact A2 and prior terminal root
       -> direct-child B2 containing only authorization + seal
            |
            v
Plan 262-19 Pattern C gate
  zero active executors?
    no -> terminal stop; expire
    yes
      -> check A2/B2 + every protected stopped root + fresh targets absent
      -> one context receipt
      -> one preflight
           unavailable/refused -> charge declared calibration allocation; terminal; expire
           admitted
             -> one 8-attempt / 4-shard calibration
                  stopped -> 8 charged, 0 accepted; terminal; expire
                  admitted
                    -> one fresh 540-cell reproduction
                         stopped -> 540 charged, 0 accepted; terminal; expire
                         passed -> 540 charged, 540 accepted; terminal; expire
                                      |
                                      v
Plan 262-20 independent read-only verification
  -> route gate may unblock Plan 262-03 only on checked reproduction_passed
```

### Recommended Project Structure

```text
scripts/
├── lib/
│   ├── v1-38-current-matrix-reproduction.ts  # dispatch, IDs, new route writers/checkers
│   └── v1-38-successor-source-seal.ts        # A2/B2 custody and old-root joins
└── evaluate-v1-38-foundation-contract.test.ts # injected proof and isolation repair

.planning/artifacts/
├── [new Plan-262-18 authorization path].json
├── [new successor source seal path].json
├── [new execution context path].json
├── [new preflight path].json
├── [new calibration path].json
├── [new reproduction path].json
└── [new Plan-262-19 terminal path].json
```

Every new artifact name and schema must be unique. The planner may choose the literal suffixes, but should use a monotonic route generation such as authorization `v2`, seal `v2`, context `v6`, preflight `v6`, calibration `v6`, reproduction `v7`, and a Plan-262-19 terminal. [RECOMMENDED]

## Immutable Lineage and Custody Contract

### A2 requirements

1. Record a full clean `sourceBase2` immediately before implementation. It must be a descendant of commit `f4ada68e...`, which already contains the Plan 262-16 stopped artifacts and Plan 262-17 verification. The research file and later plan commits may advance the actual full base; do not hard-code the abbreviated observed HEAD as future authority. [VERIFIED: Git history at research time] [RECOMMENDED]
2. The aggregate `sourceBase2..A2` delta should be exactly:
   - `scripts/lib/v1-38-current-matrix-reproduction.ts`
   - `scripts/lib/v1-38-successor-source-seal.ts`
   - `scripts/evaluate-v1-38-foundation-contract.test.ts`
   unless review identifies a necessary additional source path and explicitly restarts custody from a newly declared base. `v1-38-darwin-headroom.ts` should remain unchanged. [RECOMMENDED]
3. Preserve normal atomic candidate and review-fix commits. A2 is the final reviewed source tip, with exact tree, parent list, lineage, and per-path blob identities. [RECOMMENDED]
4. The selected-route static closure must be rederived at A2 from actual entrypoints; no copied path count is completeness authority. [VERIFIED: existing seal pattern]
5. A new clean deep review must cover dispatch exclusivity, canonical attempt IDs, accounting, cleanup, runtime/kernel route, raw-output privacy, terminal branching, and artifact isolation. Zero critical and zero warning findings are required before authority. [RECOMMENDED]

### B2 requirements

1. B2 must be the direct child of A2 and contain exactly two new files: the fresh authorization artifact and new successor seal artifact. [RECOMMENDED]
2. Review documents may be committed on the integration line separately, as in the A/B predecessor topology; their content roots must be bound by the seal without making B2 cease to be A2's direct child. [VERIFIED: existing Git topology] [RECOMMENDED]
3. B2 must bind full A2 custody plus explicit predecessor identities:
   - A `61d1c470e9a77ffa1f70538cb0c5173f6a792bfa`
   - B `1bfb413192f113ac7949cde676d7b55aea77f4fe`
   - prior authorization root `sha256:870e317f662d5f869c39c0257dd8e702dd0c8f3c30316bc8fd4c9c0534cc6a00`
   - calibration:v5 root `sha256:3c37ae3ef54318de78d2a014bd26b5574ad0bdc530bcccf60456ef70481c1d44`
   - Plan 262-16 terminal root `sha256:9fa253ddd5ee40d0ef464706172b99425f7ee2dfafd2fe071845daa9bc0a824c`
   - the prior context/preflight roots and reproduction:v6 canonical absence. [VERIFIED: artifacts]
4. The protected-evidence inventory must continue to bind all earlier stopped artifacts already covered by seal v1, including calibration:v2/v3/v4 and the stopped reproduction:v2, then add the full Plan 262-15/16/17 chain. Do not collapse differently shaped historical ledgers into invented uniform fields. [VERIFIED: seal v1 and artifact schemas]
5. Preserve each historical charge exactly as its own schema proves it. In particular, calibration:v5 retains exactly eight charged identities and zero accepted evidence. Do not relabel those attempts as free, retryable, or part of the successor's eight. [VERIFIED: calibration:v5 artifact] [VERIFIED: D-05]

## Exact Fresh-Authority Gate

The new authorization must be human-provided only after A2 and the clean review exist. Existing literal bytes or the expired Plan-262-15 authorization artifact are invalid inputs even if copied byte-for-byte. [VERIFIED: prior `expiresAt`, `singleUse`, and `noRetry`] [RECOMMENDED]

The literal and parsed artifact must bind:

- exact full A2 OID, tree, parent list, sourceBase2, aggregate changed paths, and selected-route closure root;
- exact B-predecessor OID, old authorization root, old terminal root, and a root over every protected stopped artifact;
- exact new route ordinal/schema and all canonical new destinations;
- one seal, one context, one preflight, exactly eight calibration identities across four shards, and at most one conditional fresh 540-cell reproduction;
- unchanged policy tuple, resource limits, runtime/kernel/request identities, privacy rule, formation absence, and protected-history root;
- `singleUse: true`, `noRetry: true`, and expiry at the first new seal refusal/failure or any Plan-262-19 terminal outcome;
- a statement that it grants no authority to mutate, replace, delete, reinterpret, retry, or consume Plan-262-15/16 artifacts and no authority to use old authorization bytes. [RECOMMENDED]

Before any live observation, the checker must require all of the following:

1. exact A2/B2 and old A/B joins pass;
2. all old protected roots and old canonical presences/absences match;
3. every new route destination is canonical and `ENOENT`;
4. the fresh authorization schema/root/literal/A2/route ordinal agree;
5. B2 is the exact direct child of A2 with only the two declared files;
6. the selected route at A2 recomputes exactly;
7. zero active executor agents and one main-orchestrator Pattern C owner are recorded;
8. no source, test, config, planning, or evidence drift exists in the protected union. [RECOMMENDED]

Any failure writes only the exclusive typed terminal allowed for that stage, expires authority, and authorizes no observation or retry. [RECOMMENDED] [VERIFIED: D-02]

## Safe Injected Proof Before A2

No test in Plan 262-18 should invoke `memory_pressure`, Strategy execution, a Match, calibration, reproduction, or an evidence writer against canonical destinations. [RECOMMENDED]

Required injected tests:

1. **Canonical v5 identity:** derive the eight exact execution IDs and assert uniqueness, order, pairwise shard membership `0,0,1,1,2,2,3,3`, and lossless equality between scheduler terminals and v5 charged attempts. [RECOMMENDED]
2. **Injected success:** a fake runner returns eight synthetic success outcomes; the built v5 receipt is admitted, records eight launched/eight accepted, and retains a checked supervised calibration. [RECOMMENDED]
3. **Injected system failure:** a fake runner returns a typed failure; all eight remain charged, accepted evidence is zero, and no retry/reproduction authorization appears. [RECOMMENDED]
4. **Duplicate/conflicting/missing/wrong-shard outcomes:** reject duplicates, conflicts, foreign IDs, missing declared outcomes, and any outcome whose joined inventory shard differs; none may masquerade as unlaunched work. Reserve `unfilled` only for an explicitly typed scheduler state whose identity and shard are still exact. [RECOMMENDED]
5. **Dispatcher exclusivity:** pure injected argv cases prove `--execute-shard` selects only the shard handler, receipt commands select only the receipt handler, and unknown commands select neither and fail closed. [RECOMMENDED]
6. **No actual Strategy execution:** inject the shard handler or child-process factory and assert call ownership/arguments; do not call `executeAttemptsInProcess`. [RECOMMENDED]
7. **Artifact-presence isolation:** all four formerly failing clone tests checkout the fixture before writing synthetic review bytes and pass without touching the real worktree. [RECOMMENDED]
8. **Historical custody:** mutation tests change each A/B/old-terminal/old-calibration root, charge, canonical absence, A2 blob, B2 parent, or new destination and prove refusal before observation. [RECOMMENDED]
9. **Old bytes rejected:** feeding the old literal/artifact to the new parser must fail on schema/ordinal/A2/predecessor-terminal binding before any provider callback. [RECOMMENDED]

## Policies That Must Remain Byte-Semantically Unchanged

| Policy | Frozen value |
|---|---|
| Minimum effective host headroom | inclusive `>= 2,500` basis points [VERIFIED: seal v1] |
| Host metric/provider/parser | `darwin-memorystatus-effective-available-basis-points-v1` / `apple-memory-pressure-q-v1` / `apple-memory-pressure-q-c-locale-parser-v1` [VERIFIED: seal v1] |
| Shared observation | one shared observation per scheduler tick [VERIFIED: seal v1] |
| Calibration | exactly 8 allocated attempts, 4 shards, concurrency 4 [VERIFIED: seal v1] |
| Reproduction | conditional one fresh allocation of exactly 540 cells; authoritative publication is exactly 0 or 540 [VERIFIED: seal v1] |
| Child/aggregate RSS | 2,097,152 KiB / 4,194,304 KiB [VERIFIED: seal v1] |
| Max attempts per shard | 4 [VERIFIED: seal v1] |
| Shard/total runtime | 600,000 ms / 5,400,000 ms [VERIFIED: seal v1] |
| Sampling/termination | 250 ms; 2,000 ms graceful; 2,000 ms forced [VERIFIED: seal v1] |
| Retry/reuse | no retry; partial accepted evidence is not reusable [VERIFIED: seal v1] |
| Runtime route | runtime service v1.18 / ABI v1.19 / canonical `MATCH_KERNEL` [VERIFIED: seal v1] |
| Accounting | every allocated attempt charged; stopped/system-failed work accepts zero evidence [VERIFIED: D-05, D-16] |
| Privacy | no Strategy source, StrategyMemory, SoldierMemory, or objective payload in public-safe/default outputs [VERIFIED: seal v1 and AGENTS.md] |
| Formation boundary | no executable formation namespace, state, manifest, prompt, cache, trace, replay, or result [VERIFIED: 262-CONTEXT.md] |
| Gameplay semantics | no rule, arena, runtime, request, kernel, fixture-purpose, or expected-predicate change [VERIFIED: D-03, D-06, D-10] |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Attempt correlation | Prefix matching or suffix stripping in the receipt writer | One canonical identity constructor shared by scheduler and receipt schema | Prevents silent “unfilled” projection of real terminals. [RECOMMENDED] |
| CLI routing | Two sequential handlers that each inspect argv | One discriminator-first dispatcher | Establishes exclusive command ownership. [RECOMMENDED] |
| Historical custody | A summary list of friendly labels | Exact artifact bytes, schema checkers, Git blobs, and domain-separated roots | Labels cannot prove immutability or charge preservation. [VERIFIED: established pattern] |
| Retry authority | Reuse of old authorization literal | Fresh human authorization bound to A2/B2 route generation | Old authority is explicitly expired and single-use. [VERIFIED: artifacts] |
| Root-cause reconstruction | Re-run old work or persist raw stderr | Injected reproduction of code paths plus honest uncertainty about historical low-level events | Protects privacy and no-retry semantics. [RECOMMENDED] |
| Strategy isolation | In-process test Match or Node `vm` | Injected runner/process factory and existing supervised runtime service for later authorized work | Strategy source remains hostile. [VERIFIED: AGENTS.md] |

## Common Pitfalls

### Pitfall 1: Treating `childLaunchCount: 0` as a physical fact

**What goes wrong:** Planning assumes no OS child was attempted and looks only for a pre-spawn gate. [VERIFIED: existing summaries]
**Why it happens:** v5 computes `childLaunched` from whether a lossy ID lookup found an outcome. [VERIFIED: codebase]
**How to avoid:** Rename or redefine the field only in a new schema and derive it from an explicit launch event/terminal contract, not receipt lookup success. Preserve the historical field unchanged. [RECOMMENDED]
**Warning signs:** active shared ticks coexist with zero projected launches. [VERIFIED: calibration:v5 artifact]

### Pitfall 2: Fixing only the ID mismatch

**What goes wrong:** The receipt becomes capable of finding outcomes, but attributes most attempts to the wrong shard and real child commands still fail before shard handling. [VERIFIED: codebase]
**How to avoid:** Fix and test exact attempt-ID joins, inventory-owned shard attribution, and dispatcher exclusivity in the same reviewed A2. [RECOMMENDED]

### Pitfall 3: Using safe injected proof as new empirical evidence

**What goes wrong:** Synthetic success is misreported as calibration or ADMIT-03 progress. [VERIFIED: phase boundary]
**How to avoid:** Label injected results test-only, write no canonical evidence, and require Plan 262-19 authority for the one live route. [RECOMMENDED]

### Pitfall 4: Silently replacing historical zero-child language

**What goes wrong:** Old summaries or receipts are edited to reflect the newly discovered projection defect. [VERIFIED: D-01]
**How to avoid:** Preserve old bytes and add a successor research/review finding that distinguishes recorded projection from physical launch truth. [RECOMMENDED]

### Pitfall 5: Making B2 an integration merge

**What goes wrong:** B2 gains extra parents or files and can no longer prove exact direct-child custody. [VERIFIED: prior B contract]
**How to avoid:** Create B2 directly from A2 with only two artifact files, then merge B2 into the integration line separately. [RECOMMENDED]

### Pitfall 6: Letting the old literal satisfy a new parser

**What goes wrong:** “Fresh authority” becomes a byte replay of an expired grant. [VERIFIED: old authorization single-use fields]
**How to avoid:** New schema/ordinal, A2 OID, prior-terminal root, destination set, and literal hash must all differ and be checked before provider invocation. [RECOMMENDED]

### Pitfall 7: Re-running the four flaky tests without fixing order

**What goes wrong:** The tests continue to dirty a tracked review path before checkout and produce false failures. [VERIFIED: validation warning]
**How to avoid:** Checkout first, then write fixtures inside the temporary clone. [RECOMMENDED]

## Runtime State Inventory

| Category | Items Found | Action Required |
|---|---|---|
| Stored data | Immutable v2-v5 calibration/reproduction receipts, A/B authorization/seal, context:v5, preflight:v5, Plan-262-16 terminal, and Plan-262-17 verification store the stopped history. [VERIFIED: repository artifacts] | No migration. Bind exact old bytes/roots in the new custody graph. |
| Live service config | No external service configuration is part of this private repository CLI route. [VERIFIED: codebase and architecture] | None; fail closed if implementation discovers one. |
| OS-registered state | No daemon, launchd job, systemd unit, or scheduled task owns this route. [VERIFIED: prior research and repository search] | None. The later live route observes but does not register the host tool. |
| Secrets/env vars | No secret name changes. Fixed C locale and bounded PATH remain provider inputs. [VERIFIED: seal v1] | Preserve; do not admit ambient locale/path semantics. |
| Build artifacts / installed packages | Test/transpilation caches are non-authoritative; no package change is recommended. [VERIFIED: repository structure] | Exclude caches from custody; bind source/config/lock blobs through the derived closure. |

**Canonical answer:** after source repair, all old runtime state remains immutable evidence. Nothing is rewritten, reclassified, or credited to the new allocation. [VERIFIED: D-01, D-05]

## Environment Availability

No live availability probe was run during this research because the task prohibited live commands. [VERIFIED: research execution boundary]

| Dependency | Required By | Available | Version / identity | Fallback |
|---|---|---|---|---|
| Node.js | source tests and later CLI | Previously used by checked route | exact future A2 runtime must be resealed | None; mismatch stops |
| Git | A2/B2 custody | Repository available for read-only research | exact object identities are route-specific | None; mismatch stops |
| `/usr/bin/memory_pressure` | later Plan 262-19 observation | Previously sealed in B | old tool identity is historical, not fresh authority | None; fresh seal mismatch stops |
| Vitest | injected proof | Declared in repository | 4.1.6 declared | None needed |

The planner must place a non-observing tool/source identity check before fresh authority and a fresh exact tool/host seal before live observation. The old tool hash may be compared as lineage but cannot substitute for the new route's checked identity. [RECOMMENDED]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest 4.1.6 [VERIFIED: repository package metadata] |
| Config file | Existing workspace/package configuration [VERIFIED: codebase] |
| Quick run command | `pnpm vitest run scripts/evaluate-v1-38-foundation-contract.test.ts -t "v1.38 plan 262-18|attempt identity|CLI dispatch|artifact presence"` [RECOMMENDED] |
| Full non-live suite command | existing focused contract test file with all live providers/writers injected or excluded [RECOMMENDED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated command | File exists? |
|---|---|---|---|---|
| ADMIT-01/02 | A2/B2/old-root joins and derived closure | integration/mutation | focused source-custody selector | ✅ extend existing file |
| ADMIT-03 | dispatcher and exact eight-ID calibration projection | unit/injected integration | focused attempt/dispatch selector | ❌ Wave 0 additions |
| ADMIT-04 | old literal, stale root, occupied target, or drift stops before callbacks | mutation | focused fresh-authority selector | ❌ Wave 0 additions |
| ADMIT-01..04 | temporary-clone artifact presence isolation | integration | focused artifact-presence selector | ✅ fix existing order |

### Sampling Rate

- **Per source/fix commit:** quick injected selector; no provider, writer, Match, calibration, or reproduction. [RECOMMENDED]
- **Before A2:** all non-live tests for the three authorized source/test paths, typecheck, and `git diff --check`. [RECOMMENDED]
- **After each review fix:** repeat all non-live tests and restart the clean-review verdict. [RECOMMENDED]
- **Before B2:** read-only A2 custody/closure/review checks only. [RECOMMENDED]
- **Plan 262-19 gate:** canonical read-only checks first, then exactly one authorized Pattern C branch. [RECOMMENDED]
- **Plan 262-20:** read-only checkers and independent verification only. [RECOMMENDED]

### Wave 0 Gaps

- [ ] Canonical v5 attempt identity helper and injected lossless-correlation tests.
- [ ] Discriminator-first direct-entry dispatcher and exclusive-routing tests.
- [ ] Four temporary-clone tests reordered to checkout before fixture writes.
- [ ] New authorization/seal/terminal schemas and mutation tests that reject old authority bytes.
- [ ] New protected-history checker binding all stopped roots and exact charge semantics.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control |
|---|---|---|
| V2 Authentication | yes, for operator authority | Exact human authorization literal bound to A2 and route generation; no ad hoc signing trust. [VERIFIED: context] |
| V3 Session Management | no | No web session is involved. [VERIFIED: architecture] |
| V4 Access Control | yes | Pattern C single owner, zero executor agents, canonical paths, and one-use operation cardinality. [VERIFIED: prior plans] |
| V5 Input Validation | yes | Exact-key schemas, canonical JSON, full OIDs, canonical roots, argv discriminator, and strict artifact presence/absence. [VERIFIED: codebase pattern] |
| V6 Cryptography | yes | Existing SHA-256/domain-separated roots and Git object identities; do not hand-roll signing. [VERIFIED: codebase and context] |

### Known Threat Patterns

| Pattern | STRIDE | Standard mitigation |
|---|---|---|
| Attempt-ID truncation hides launched failures as unfilled | Repudiation / Tampering | One canonical ID constructor, exact equality, duplicate/conflict rejection. [RECOMMENDED] |
| Modulo shard reconstruction misattributes charged work | Repudiation / Tampering | Copy shard ownership from exact joined policy inventory; never recompute it in the wrapper. [RECOMMENDED] |
| Dual CLI handlers intercept commands | Spoofing / Elevation of Privilege | One discriminator-first exclusive dispatcher. [RECOMMENDED] |
| Expired authorization replay | Spoofing | New schema/ordinal/A2/prior-terminal/destination binding and fresh human literal. [RECOMMENDED] |
| Historical charge omission | Repudiation | Protected old artifacts plus schema-specific charge joins. [RECOMMENDED] |
| Raw subprocess diagnostics leak | Information Disclosure | Retain only typed public-safe projections; zero owned buffers; no raw stderr/stdout in artifacts or summaries. [VERIFIED: existing privacy contract] |
| Dirty test fixture modifies real or cloned tracked state unexpectedly | Tampering | Isolated temporary clone, checkout first, fixture write second, `finally` cleanup. [RECOMMENDED] |
| Source drift after review | Tampering | A2/B2 blob checks and failed-closed independent review; never repair in live plan. [RECOMMENDED] |

## State of the Art

| Old approach | Current successor approach | Impact |
|---|---|---|
| Infer launch from successful outcome-ID lookup and recompute shard by modulo | Exact scheduler-to-inventory join with inventory-owned shard and explicit launch/terminal semantics | Prevents silent false-zero and wrong-shard projections. [RECOMMENDED] |
| Sequential receipt then shard CLI handlers | Single exclusive direct-entry dispatcher | Makes child execution reachable without weakening unknown-command rejection. [RECOMMENDED] |
| Treat test fixture setup order as incidental | Checkout immutable fixture before mutating clone-local tracked files | Removes four false failures and restores isolation. [RECOMMENDED] |
| Bind only the immediately prior source route | Bind A/B plus all stopped roots/charges as protected predecessor lineage | Prevents inconvenient failed work from disappearing. [RECOMMENDED] |

**Deprecated/outdated:**

- Existing Plan-262-15 authorization bytes: expired and never valid for the new route. [VERIFIED: authorization/terminal artifacts]
- Existing calibration:v5 `childLaunchCount` as a physical-process claim: preserve it as historical schema output, but do not use it to infer OS launches. [VERIFIED: source defect]
- Existing four failing artifact-presence test setups: replace their setup order in A2. [VERIFIED: validation]

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Final new artifact suffixes will follow the recommended v2/v6/v7 sequence. [ASSUMED] | Recommended Project Structure | Low; names can differ if all paths/schemas are unique and exactly bound. |
| A2 | The same repository operator will provide the fresh literal. [ASSUMED] | Fresh Authority | Medium; a different authorized human is acceptable but must be named and independently recorded. |

## Open Questions

1. **Who grants the fresh human authorization?**
   - What we know: the expired artifact names `roryquinlan-repository-operator`. [VERIFIED: old authorization artifact]
   - What's unclear: whether the same named operator remains the authorized actor for A2.
   - Recommendation: make this a blocking checkpoint after clean A2 review; never infer the actor in code. [RECOMMENDED]

2. **Should the new schema expose a public-safe typed stop reason?**
   - What we know: v5 discarded the stopped supervised receipt, preventing exact historical diagnosis. [VERIFIED: codebase/artifact]
   - What's unclear: the minimum allowlist that improves diagnosis without leaking raw diagnostics.
   - Recommendation: retain a closed typed reason enum and explicit launched/terminal counts/root, never raw stdout/stderr, PID, Strategy source, memory, or objective payload. [RECOMMENDED]

3. **Should v5 canonical IDs be simplified or should the receipt adopt full IDs?**
   - What we know: the current two shapes are inconsistent. [VERIFIED: codebase]
   - Recommendation: simplify execution IDs to `calibration:v5:<index>` and keep `templateAttemptId` as a separate bound field; this matches the declared eight allocation identities and minimizes schema changes. [RECOMMENDED]

## Sources

### Primary (HIGH confidence)

- `scripts/lib/v1-38-current-matrix-reproduction.ts` — scheduler identities, subprocess runner, direct-entry order, v5 adapter, writers, and terminal checker. [VERIFIED: codebase]
- `scripts/evaluate-v1-38-foundation-contract.test.ts` — four checkout-order isolation defects and existing injection seams. [VERIFIED: codebase]
- `.planning/artifacts/v1.38-current-matrix-calibration-v5.json` — immutable stopped projection, eleven active-shard ticks, eight charges, zero accepted evidence. [VERIFIED: artifact]
- `.planning/artifacts/v1.38-plan-262-16-terminal-v1.json` — expired no-retry terminal and exact roots. [VERIFIED: artifact]
- `.planning/artifacts/v1.38-plan-262-15-authorization-v1.json` and `.planning/artifacts/v1.38-successor-source-seal-v1.json` — A/B custody, policy, protected history, and old single-use authority. [VERIFIED: artifacts]
- `262-15-REVIEW.md`, `262-15-REVIEW-FIX.md`, `262-VALIDATION.md`, `262-VERIFICATION.md`, and Plans/Summaries 262-15..17 — review history, warning, route interpretation, and blocked gate. [VERIFIED: phase docs]
- Git history at research time — A/B topology and immutable terminal integration. [VERIFIED: git]

### Secondary (MEDIUM confidence)

- None. This was a focused codebase/evidence investigation; no external technology claim was needed.

### Tertiary (LOW confidence)

- Final artifact suffixes and future human actor, listed explicitly in the Assumptions Log.

## Metadata

**Confidence breakdown:**

- Root cause: HIGH — both defects are directly visible in reviewed source, and the public artifact confirms the lossy projection shape.
- Historical low-level event: MEDIUM — retained evidence does not include the stopped supervised reason or raw diagnostics, so the exact OS event must remain unknown.
- Architecture: HIGH — follows the already reviewed A/direct-child-B/Pattern-C/independent-verifier model.
- Custody: HIGH — exact old roots, Git topology, charges, and expired authority are present.
- Successor naming/operator: LOW until planner and human checkpoint finalize them.

**Research date:** 2026-07-30
**Valid until:** 2026-08-06, or immediately invalid if source, artifacts, Git topology, or Phase 262 decisions change.
