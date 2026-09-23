# Phase 265: Post-failure diagnostic pilot — research

**Researched:** 2026-09-23  
**Domain:** private, supervised current-rules Match diagnostic  
**Confidence:** HIGH for source/retained identities; MEDIUM for host feasibility; LOW for unmeasured full-Match duration

<user_constraints>
## User Constraints (from CONTEXT.md and the approved pilot envelope)

### Locked Decisions

The new operator-approved envelope is: at most **four private current-rules Matches**, at most **240 seconds per Match**, at most **30 minutes overall**, and **zero retries**. It is diagnostic only: not LEAG-01–09 evidence and not a replacement, refund, or retry of consumed allocation-v2. Use existing current-rules candidates and the unchanged canonical engine/rules. Do not author a Strategy or call a model; do not do formation, holdout, public, or counted work. [VERIFIED: orchestrator-provided operator approval, 2026-09-23]

Carry-forward decisions below are copied verbatim from `265-CONTEXT.md`:

- **D-01:** All inputs and outputs are immutable and content-addressed. There is no mutable `latest`, implicit active population, or result selected by directory order.
- **D-02:** Missing, stale, contaminated, incomplete, conflicting, or identity-mismatched evidence fails closed. A process-valid disappointing empirical result is preserved as a valid finding; a process or integrity failure blocks the phase gate.
- **D-03:** Every Match advances through the exact admitted `MATCH_KERNEL`. The league may orchestrate work around the kernel but may not copy rules, introduce an alternate legality or transition loop, or use the historical direct-source matrix runner as an execution boundary.
- **D-04:** Candidate source is hostile and runs only through the supervised provider/runtime boundary established by Phases 263–264. No source executes in the league coordinator, web, API, Go backend, or a direct `new Function`/dynamic-import path.
- **D-05:** Every candidate attempt, retry, invalid output, rejection, clone decision, weak response, runtime or system failure, and unused allocation remains charged and represented in the evidence root. Reports cannot retain only successful attacks.
- **D-06:** Cycle cap, MOVE and reversal behavior, Backstab geometry and timing, activation counts, arena geometry, runtime rules, and every other production rule remain fixed. No formation namespace, state, candidate, prompt, cache, trace, replay, or result may exist in this phase.
- **D-07:** Canonically order each unordered entrant pair by immutable candidate identity, then enumerate the full four-condition entrant-side × entrant-level-initial-initiative policy for every semantically distinct active design arena.
- **D-08:** Key arena cells by `semanticGeometryHash`, not arena display ID. Smoke and Open Field share one empty geometry and can never count twice; a duplicate active semantic hash is a matrix-integrity failure rather than additional diversity.
- **D-09:** A population snapshot is solver-admissible only when every expected cell exists exactly once and agrees on population, entrant, condition, arena, tuple, runtime, and request identities. Missing, duplicate, conflicting, invalid, or system-failed cells block meta-solving and are never imputed as a win, loss, draw, or zero.
- **D-10:** Completion order, worker count, sharding, restart, and resume cannot affect cell identity, reduction order, payoff bytes, or the snapshot root. Any retry uses the same logical task identity and follows the frozen burn policy.
- **D-11:** Select the exact empirical-game solver only after the required numerical spike. The accepted solver must freeze its algorithm and version, exact numeric representation, canonical entrant ordering, iteration count or convergence schedule, normalization, tie-breaks, and failure behavior.
- **D-12:** Before real league use, the solver must pass committed golden vectors plus permutation, repeat, worker-count, shard-order, restart, and adversarial numeric-boundary tests with byte-identical outputs.
- **D-13:** The solver consumes only one immutable, complete population-and-payoff snapshot at a time. Later cells or candidates create a new snapshot and cannot retroactively change an earlier distribution or response target.
- **D-14:** Every declared PSRO/double-oracle round targets both the frozen meta-distribution and named strongest or vulnerable pure policies. A response enters the next snapshot only when it passes the frozen legal, independence/clone, novelty, positive-response, runtime, and evidence-completeness admission rule.
- **D-15:** Every successful counter found inside the development budget re-enters the declared response loop. The loop closes only under the precommitted iteration/budget/response rule; a convenient provisional leader cannot terminate it early.
- **D-16:** Meta-distributions are training and diagnostic artifacts only. They are never represented as one deployable Strategy and never cross the ordinary Strategy Revision promotion path.
- **D-17:** Preserve a diverse pure Strategy portfolio separately from every diagnostic mixture. Structural family, strategic-core, lineage, behavior, and response evidence must satisfy the frozen diversity gates; labels and source hashes alone are insufficient.
- **D-18:** Apply the precommitted robust-pure selection rule to mixture performance, strongest-pure targets, accepted counters, pure-policy worst case, independent probes, invariance, legality, privacy, and runtime evidence. Aggregate win rate cannot substitute for those gates.
- **D-19:** If no pure Strategy satisfies the frozen rule, record `no robust pure finalist found`. Do not deploy a mixture, silently lower thresholds, omit a counter, or pick the least-bad candidate and call it robust.
- **D-20:** Provisional leaders receive the complete frozen automated, model, human, and external development-red-team allocation. Leading evidence must remain stable across side, initiative, horizontal symmetry, opaque IDs, Soldier/source ordering, semantic arena identity, deterministic repeat, and source-order/tie-break probes.
- **D-21:** Publish complete iteration curves, matrices, distributions, best-response graphs, pure-policy worst cases, response gaps, red-team attempts, and finalist dispositions qualified by exact population, conditions, oracle families, budgets, solver, tuple, and artifact roots. Oracle-relative evidence cannot be described as Nash, exact exploitability, optimality, solved play, permanent balance, or a meta-free game.

### the agent's Discretion

- After the required numerical spike, research and planning may choose the exact deterministic solver algorithm, numeric representation, and internal module decomposition, provided D-11 and D-12 are satisfied without changing any frozen estimand, budget, or admission rule.
- Shard sizing, worker scheduling, storage chunking, and private report visualization are technical choices only when task identities, charged work, canonical reductions, privacy classes, and output roots remain invariant.
- Stable internal reason-code names and filenames are flexible if schemas preserve the locked three-way failure semantics and all required evidence remains machine-verifiable.

### Deferred Ideas (OUT OF SCOPE)

- Starting-formation materialization and production-unreachability proof begin only after a valid Phase 266 current-league freeze.
- Current-edge, inward, and bracket retraining belongs to Phase 268 and cannot borrow learned state from this league.
- Full ordinary product certification is reserved for exact eligible pre-formation current finalist hashes in Phase 269.
- Cycle-cap, MOVE/reversal, Backstab, scan-timing, arena, runtime, and combined-rule experiments require later separately approved work.

The four-Match pilot's 240-second lifetime is a **pilot-only operational exception** to the prior 120-second Match/provider allocation, not a canonical gameplay, runtime ABI, production, or allocation-v2 amendment. [VERIFIED: operator envelope; `265-07-PLAN.md`; `265-07-POSTFAILURE-ROUTE-ASSESSMENT.md`]
</user_constraints>

<phase_requirements>
## Phase Requirements

| IDs | Pilot relationship |
| --- | --- |
| LEAG-01–09 | **None may be claimed from this pilot.** It is a four-cell diagnostic subset, without both active arenas, complete population payoff matrices, PSRO/red-team budget, probes, portfolio, or finalist selection. [VERIFIED: `.planning/REQUIREMENTS.md:65-73`; `265-07-PLAN.md`; operator envelope] |
</phase_requirements>

## Summary

**Primary recommendation:** build a separate, single-purpose, four-cell diagnostic command around the existing authenticated Phase 264 candidate reader, host-issued supervised providers, `MATCH_KERNEL` bridge, and append-only private league repository; do not call `runSeriousLeague`, `prepare-prospective`, or the consumed allocation-v2 run command. [VERIFIED: `scripts/run-v1-38-serious-league.ts:229-275,404-465,610-665,1145-1178`; `packages/strategy-lab/src/league/connected-runner.ts:90-150`]

The current one-shot returned `process_invalid`, with exactly one charged S01/S03 Smoke cell, 452 successful supervised invocations, a TypeError on the next invocation, and no payoff. The read-only retained verifier preserves that classification. Timestamps near 120 seconds support a lifetime hypothesis but do not prove the precise error code. The old allocation and head are immutable and exhausted. [VERIFIED: `.planning/STATE.md:17-66`; `265-07-PROCESS-INVALID.md`; `265-07-POSTFAILURE-ROUTE-ASSESSMENT.md`; `.planning/artifacts/v1.38-phase-265-run-result.json`]

Four times 240 seconds is 960 seconds, leaving 840 seconds for *all* candidate validation, host admission, Match setup, retention, cleanup, and verification under a 1,800-second overall cap. This is mathematically possible but **not demonstrated** on the current source or host. A previous data-only three-base import took 1,394.27 seconds by itself, so repeating that exact traversal inside the 30-minute clock could leave too little room for four worst-case Matches. [VERIFIED: arithmetic; `.planning/STATE.md:119-130`; `265-07-EMPIRICAL-PREPARATION-v6.md`; confidence MEDIUM for runtime extrapolation]

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
| --- | --- | --- | --- |
| Pilot allocation, deadlines, charge ledger, retention | Private offline lab host | Private filesystem | No public or product route. [VERIFIED: `AGENTS.md`; Phase 265 context] |
| Strategy execution and cleanup | Supervised runtime host | Container boundary | Hostile source must not run in coordinator/web/API/Go. [VERIFIED: `AGENTS.md`; `connected-runner.ts`; `v1-38-factory-supervised-runtime.ts`] |
| State transitions | Pure engine `MATCH_KERNEL` | — | No alternate rule loop. [VERIFIED: `runtime-bridge.ts`; Phase 265 D-03] |
| Read-only diagnostic analysis | Private artifact reader | — | Duration/cost/failure codes only; no payoff-matrix promotion. [VERIFIED: `265-07-POSTFAILURE-ROUTE-ASSESSMENT.md`; operator envelope] |

## Exact pilot cell recommendation

Use the existing assessed **S01** and **S03** bases to exercise the same candidate *pair* as the failed cell, but with a new pilot namespace, seed, start roots, repository and ledger; this is a new diagnostic sample, not a rerun of the old cell. S01 has candidate root `sha256:58a001abf66ad174ab43804cde6b051591b110509b3f0835ec2a4fa61e481def`, admission root `sha256:850d8c03d00b6dd8791a68403801e55c37fcaf6f6f2f9c31105b782cbf9f26f5`, source root `sha256:3a49f15d3b0164e25106e44bd27f1e33c11a13bf0bfd6410c85e494dead823e2`, publication root `sha256:248a48e285a6f15da53ade90b1d8a66200fd35a33c46ce716017209eefd0ea9b`. S03 has candidate root `sha256:b0f982dbf499b9c76d14b47de35d17b1698999b366571f48a04655d139639289`, admission root `sha256:f5cd002a1cece02fb4f9a63ea1d952354dd57558307be2304326cd806274a774`, source root `sha256:19126911caf193808c53de111576986e80b26d9c2109dcb3d04edd3344b5e39f`, publication root `sha256:b53b00a5e92f0f696f40b20453a2821596f65be6fdc561d2b8bc44f351cf8de8`. Both close over `.strategy-lab/factory-264-fresh-20260914-approved-two`. [VERIFIED: authenticated retained `run-start` candidate records; allocation-v2 used **only as historical identity source**]

Select **Smoke** (`arena:smoke:v1`), active semantic hash `sha256:39aecc22c184660c1c08ab810fbfa3066da1a650b20e91d72a838ed7fb70a0e1`, matching the failed cell's geometry. Open Field is a non-schedulable alias of the same hash; Standard Cross is a different active hash and cannot fit a full four-condition set inside four Matches. This pilot is therefore not arena-balanced across the two active geometries. [VERIFIED: `packages/spec/src/arena-catalog-v1-37.ts:205-253`; `matrix.ts:179-191,237-314`; retained old `cell-start`]

Freeze new seed `league-265-postfailure-pilot-20260923-a` and derive conditions with `createSetScenarioV137`, not by manual seed parity. The read-only source calculation gives scenario `set-scenario:sha256:e0f70e74ccd4229ba6c78ddca08079dcf23a8c3d970acab1f001007fb7f842f1`. [VERIFIED: `set-condition-policy-v1-37.ts:10-115`; local read-only `tsx` calculation]

| Order | Canonical condition | Bottom | First initiative | Condition ID |
| --- | --- | --- | --- | --- |
| 0 | `a-bottom-a-first` | S01 | S01 | `set-condition:sha256:8c78a3488ff1b3bfe21231e8183fabdfb1428b3c40e8be0466cca17e51036bad` |
| 1 | `a-bottom-b-first` | S01 | S03 | `set-condition:sha256:51ded4d1bb28d7de00b00059b3fc0b66598785037ac907bb772f6aeecaf49aa5` |
| 2 | `a-top-a-first` | S03 | S01 | `set-condition:sha256:6da20d83323911acf4891eb6736ebd372138364762905268e340852f364cbf68` |
| 3 | `a-top-b-first` | S03 | S03 | `set-condition:sha256:bbec91404c09ac50622b0bc25b09fd8d20dbcd037d62e2fdd2c07f7ff17be7af` |

This is exactly two starts per side and two starts per entrant-level initial initiative, for one pair and one semantic arena. Any early stop leaves a diagnostic prefix only; it must not be described as a balanced observed result. [VERIFIED: canonical set rows and calculated scenario; confidence HIGH]

## Standard Stack and implementation seam

No package installation is needed. Reuse pinned local Node 24.15.0, TypeScript/`tsx` 4.22.0, `@cowards/spec` canonical Set/arena identities, the existing Phase 264 FactoryRepository, `issueLeagueProviderFromFactoryCandidate`, `createFactorySupervisedRuntime`, `runCanonicalLabMatch`, `MATCH_KERNEL`, and the private league repository/graph. The only new code should be a distinct pilot allocation/CLI, pilot-scoped lifetime/deadline guard, retention verifier, and focused tests. [VERIFIED: local tool versions; `scripts/run-v1-38-serious-league.ts` imports and candidate reader; `connected-runner.ts`; `runtime-bridge.ts`; confidence HIGH]

The existing `runSeriousLeague` route is unsuitable: its CLI admits full empirical allocation schemas, enforces the approved S01/S03/S05 initial population and full matrix/round/probe path, and binds the consumed allocation-v2 output directories and 120,000 ms per Match. `LeagueConnectedSession.matrix` dispatches all enumerated cells sequentially; it is not a subset selector. The old Phase 263 runner is a useful pattern for a monotonic global deadline, charged attempts and cleanup, but its exact 24-attempt manifest, 120-second Match guard, benchmark/validation stages and Starter/Advanced pair are not this pilot's executable route. [VERIFIED: `run-v1-38-serious-league.ts:463-465,610-665,1145-1178`; `allocation.ts:40-110`; `run-v1-38-planner-feasibility.ts:221-234,345-370,482-550`]

There are **three** 120-second source gates: the factory wrapper rejects `factoryLifetimeMs > 120_000`; the underlying `createPlannerSupervisedRuntime` defaults to a 120,000-ms lifetime and its existing override is **benchmark-only** (observer harness plus 2,200-call limit); and the league allocation validator rejects `perMatchMilliseconds > 120000`. Merely passing `240000` to either existing route fails or still expires in the underlying supervisor. A **pilot-only authenticated lifetime option across both supervised layers** must allow at most 240,000 ms without relaxing ordinary league/production defaults, the 24,800-invocation ceiling, or per-method/runtime ABI limits. Do not misuse `benchmarkLifetimeMs`: it changes evidence mode and is not a Match option. A cell-level monotonic timer must cover issuance, execution, evidence publication and cleanup, because the present `LeagueConnectedSession` checks its overall wall clock only *before* a cell and factory lifetime begins at provider construction rather than cell start. [VERIFIED: `v1-38-planner-supervised-runtime.ts:48-75`; `v1-38-factory-supervised-runtime.ts:48-79`; `allocation.ts:62`; `run-v1-38-serious-league.ts:404-448`; confidence HIGH]

### Required path before any dispatch

1. Read-only authenticate S01/S03 assessed publication, admission, source, tuple/runtime and exact closure from the Phase 264 repository. The existing `readLeagueInitialCandidates` can be reused with a **selection-only** input; never pass allocation-v2 to `runSeriousLeague` or use its start marker. Cache only immutable authenticated closure bytes within this one pilot process. [VERIFIED: `run-v1-38-serious-league.ts:229-275`]
2. Admit a new exact-key pilot manifest before side effects: unique pilot root/evidence class `diagnostic_only`, above pair/arena/seed/four ordered condition IDs, four reserved starts, `240000` ms cell ceiling, `1800000` ms overall ceiling, zero retries, pinned tuple/image/runtime limits, source/implementation roots, privacy class, and explicit `leagueRequirementsEvidence:false`, `formationAuthorized:false`, `counted:false`, `public:false`. Reject any old allocation/head/root as pilot authority. [RECOMMENDATION grounded in D-01–D-05 and operator envelope]
3. In the same bounded process, measure Docker image/daemon, 2-CPU/256-MB guest profile, available host memory, free bytes/inodes on the intended filesystem, expected per-invocation/Match artifact ceiling, terminal reserve and cleanup headroom; require an empty, mode-0700, separate pilot repository and no colliding owned containers. Fail before reservation if exact host/capacity or source/closure admission fails. [RECOMMENDATION grounded in existing capacity and host preflight code]
4. Reserve once in the pilot repository. Persist an append-only start/charge before each provider call, then issue both authenticated host providers and call only `runCanonicalLabMatch`. Retain success, system failure, violation, timeout, cleanup outcome, partial/uncertain work, elapsed timings, artifact bytes/records and all unused slots, with a rooted terminal and read-only reopen. The old allocation-v2 repository/result/ledger remain untouched. [VERIFIED: existing charge/retention patterns; RECOMMENDATION for pilot discriminator]
5. Stop on the first non-success, integrity mismatch, unsafe cleanup, retention or capacity breach, or deadline; no retry. Do not derive payoff, solver, complete matrix, finalist or LEAG evidence. If a failure arrives while publishing, reserve terminal space in advance and independently reopen the charged start, partial prefix and failure. [RECOMMENDATION grounded in D-02/D-05 and retained old failure]

## Environment Availability (read-only observations)

| Dependency | Observed now | Required before dispatch |
| --- | --- | --- |
| Docker daemon | Client/server 29.4.0; daemon reports 12 CPUs, 8,400,658,432 bytes RAM. [VERIFIED: local `docker version`/`docker info`] | Recheck same daemon and effective 2CPU/256MB isolation, no name collision. |
| Pinned image | Exact `node:24-alpine@sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14` present, amd64. [VERIFIED: local `docker image inspect`] | Recheck digest and required platform. |
| Host memory | `memory_pressure -Q` reported 74% of 16 GiB; old run-start observation was 13,056,700,579 available bytes. [VERIFIED: local command; retained `run-start`] | Use existing conservative parser and fresh receipt, not this stale observation. |
| Filesystem | `.strategy-lab` and Phase 264 factory store on device 16777222; `df -Pk` showed 217,027,260 KiB available. [VERIFIED: local `stat`/`df`] | Check pilot destination device, free bytes *and inodes*, exact projected physical bytes/record count, and reserved failure headroom. |
| Retained failed run | 1,410 artifact files, about 10,388 KiB on disk, for a 452-invocation incomplete cell plus setup records. [VERIFIED: local `find`/`du`] | Treat as a lower-bound observation, not a complete-Match or four-Match capacity estimate. |

The existing full-league capacity plan projects 167,418,829,480 physical bytes and 7,237,174 records for an entirely different 11,328-reservation allocation; it must not be reused or scaled casually to this pilot. [VERIFIED: `.planning/STATE.md:28-32`; `265-07-EMPIRICAL-PREPARATION-v6.md`]

## Common Pitfalls and stop semantics

| Pitfall | Required check |
| --- | --- |
| Treating this as allocation-v2 continuation | Distinct schema/root/paths/charge ledger; old result SHA/head unchanged before and after; no merge or import into league payoff graph. [VERIFIED: old failure and D-01/D-02] |
| Four 240-second Matches assumed to fit automatically | Start a monotonic 1,800-second clock before pilot static preflight; stop before first charge if remaining time cannot cover the planned four worst-case cells plus cleanup reserve. Check remaining time before and after every invocation, not only between cells. [RECOMMENDATION] |
| A timeout is silently converted to score | Keep `system_failure`/`process_invalid`, partial request/accounting and allowlisted supervisor code; no projection. [VERIFIED: `connected-runner.ts:105-150`; repaired retained verifier] |
| Supervisor cap changed globally | Scope the 240-second exception through both authenticated supervisor layers to the pilot identity; leave ordinary 120-second league allocation and 1-second method cap unchanged. [VERIFIED: `allocation.ts`; `v1-38-factory-supervised-runtime.ts`; `v1-38-planner-supervised-runtime.ts`] |
| Balanced labels mistaken for balanced evidence | Four starts are predeclared, but a prefix after failure has no complete side/initiative comparison and never covers Standard Cross. [VERIFIED: canonical Set policy; D-07–D-09] |
| Host paths or raw runtime data leak | Keep source bytes, memory/objectives, raw observations, errors/stacks, host paths, private timing and artifact internals out of public/default output. Private graph may retain bounded diagnostics; public projection is aggregate/non-identifying or absent. [VERIFIED: `AGENTS.md`; `.planning/PROJECT.md`; `run-v1-38-serious-league.ts:53-62,360`] |

## Validation Architecture

| Property | Value |
| --- | --- |
| Framework | Existing Vitest 4.1.6 and strict TypeScript. [VERIFIED: `.planning/research/SUMMARY.md`; `scripts/run-v1-38-serious-league.test.ts`] |
| Quick run | `./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts packages/strategy-lab/src/league/connected-runner.test.ts` [VERIFIED: existing test paths] |
| Full gate | Existing Phase 265 29-suite source gate plus private/public boundary monitors; no live Match in tests. [VERIFIED: `265-07-SOURCE-PROOF.md`; `265-07-PLAN.md`] |

Wave 0 needs a new pilot-only test module for exact manifest/seed/cell identity, denied allocation-v2 reuse, 240-second ceiling isolated from ordinary 120-second source, precharge/no-retry, every preflight failure before provider issuance, monotonic deadlines (including cleanup), interrupted publication, read-only reopen, private-field denial, and unchanged old result bytes. Fake clock/provider tests must be labeled injected fixtures, not empirical. [RECOMMENDATION; confidence HIGH]

## Security Domain and project constraints

`AGENTS.md` requires a pure deterministic side-effect-free engine, no Strategy execution in web/API, no `Math.random`/time/FS/network/DB in engine, no Node `vm` security claim, schema validation at every hostile runtime boundary, immutable Strategy Revisions, canonical terminology, and default public replay exclusion of source, StrategyMemory, SoldierMemory and objectives. Runtime tests must distinguish Strategy failure from system failure. Pilot planning must preserve each directive. [VERIFIED: `AGENTS.md`]

Applicable ASVS-style categories are V4 access control (private-only repository and no public/counted route), V5 input validation (exact schema/root/identity and hostile output), V6 cryptography (repository canonical hashes rather than invented crypto), and runtime containment/cleanup; V2 authentication and V3 sessions are not new pilot surfaces. This is an architectural mapping, not an external ASVS certification. [RECOMMENDATION from code boundaries; confidence MEDIUM]

## Don't Hand-Roll

| Problem | Reuse |
| --- | --- |
| Game transitions and legal Actions | `MATCH_KERNEL` through `runCanonicalLabMatch`; no second game loop. [VERIFIED: D-03; `runtime-bridge.ts`] |
| Side/initiative fairness | `createSetScenarioV137` canonical four rows. [VERIFIED: `set-condition-policy-v1-37.ts`] |
| Hostile Strategy containment | Existing host-issued factory-supervised provider and Docker runtime; pilot-specific cap wrapper only. [VERIFIED: `connected-runner.ts`; `v1-38-factory-supervised-runtime.ts`] |
| Candidate provenance | Existing assessed Phase 264 reader/closure verifier. [VERIFIED: `run-v1-38-serious-league.ts:229-275`] |
| Canonical hashing and private retention | Existing lab identity/repository primitives, with new pilot domain tags and separate path. [VERIFIED: `run-v1-38-serious-league.ts:53-170`] |

## Open Questions for the planner

1. Does the 30-minute clock include the full historical candidate re-import? Recommend **yes** from pilot command start; if the preflight consumes too much time, stop before charging a Match. A separate read-only cache preparation may be permissible, but it must not create an authorization token or hide work outside the approved clock. [ASSUMED policy interpretation; requires operator confirmation if changed]
2. What exact pilot physical-byte/record ceiling and cleanup reserve will be frozen? Derive it from the repository's source-enforced per-invocation bounds and retained samples, then admission-test it against the *fresh* host; the incomplete 10 MiB failed cell is insufficient. [VERIFIED gap; RECOMMENDATION]
3. Should any system failure terminate the remaining pilot starts? Recommend **yes**—zero retries, preserve unused slots and seek an explanatory prefix, not a partial competitive result. [RECOMMENDATION; confidence MEDIUM]
4. The 240-second exception needs independent review that it changes both supervised lifetime layers **only for pilot identity**, plus the pilot cell/overall guard, not the 1-second per-method timing, ABI, isolation profile, rule semantics or ordinary 120-second league admission. [VERIFIED source gap]

## Assumptions Log

| # | Claim | Risk if wrong |
| --- | --- | --- |
| A1 | The 30-minute clock starts before pilot static preflight. [ASSUMED] | Later clock start could conceal significant diagnostic work outside the approved envelope. |
| A2 | Stop after the first non-success rather than spending remaining starts. [ASSUMED] | Fewer than four durations, but less risk and no misleading balanced claim. |

## Sources and confidence

Primary source evidence: `AGENTS.md`; `.planning/STATE.md`; `.planning/REQUIREMENTS.md`; `265-CONTEXT.md`; `265-07-PLAN.md`; `265-07-POSTFAILURE-ROUTE-ASSESSMENT.md`; `265-07-PROCESS-INVALID.md`; `265-07-EMPIRICAL-PREPARATION-v6.md`; canonical retained allocation/result and old repository `run-start`/`cell-start`; `scripts/run-v1-38-serious-league.ts`; `scripts/run-v1-38-planner-feasibility.ts`; `scripts/lib/v1-38-factory-supervised-runtime.ts`; `packages/strategy-lab/src/league/{allocation,connected-runner,matrix}.ts`; `packages/strategy-lab/src/runtime-bridge.ts`; canonical arena and Set policy modules. All were inspected locally and no internet/package source was needed. [VERIFIED: local file inspection]

**Confidence breakdown:** exact roots/condition identities and present source limitations HIGH; current host availability MEDIUM because it must be refreshed; completion within 30 minutes LOW until four real diagnostic durations and artifact costs are observed. **No Match, provider, Strategy or model was run for this research.** [VERIFIED: research operations]
