# Phase 265 Lean Reset - Research

**Researched:** 2026-10-03  
**Domain:** Bounded private Strategy-league experiment, canonical Match execution, compact evidence retention  
**Confidence:** MEDIUM (repository paths and contracts directly inspected; empirical time/disk feasibility remains unmeasured)

## User Constraints

### Approved prospective experiment charter (verbatim)

- Total additional disk cap: **15,000,000,000 bytes**, including evidence, working files and buffers. Do not carry forward the old 167 GB forecast or two 20 GiB reserves into this new envelope.
- A small candidate pool, one adversarial improvement round and a few hundred Matches at most, rather than thousands. Fix exact balanced allocations after measuring a small pilot and before observing comparative outcomes.
- Retain compact results and accounting for every Match; retain compressed replays for a preselected sample and failures. Exhaustive invocation transcripts are not required for the new exploratory evidence format.
- Measure a small pilot first. All new empirical execution shares a single **eight-hour execution cap**; failed prospective attempts consume this time and Match budget rather than resetting either. Stop with an honest partial or inconclusive result if necessary.
- Preserve canonical rules, private runtime isolation, Strategy/system failure distinctions, balanced comparisons and the current-rules baseline before formation experiments.
- Retrain separately for each formation profile with equal doctrine, candidate, oracle, model/human, search-node, Match, side, initiative, arena, holdout and replay-review budgets. A passing bracket is a decision packet for a later rules milestone, not a shipped rule.
- Keep the private holdout unopened until the planned populations are frozen. No public, counted or production authority; no combined cap/MOVE/Backstab/scan-timing changes.

### Non-negotiables and project directives

- Keep the engine pure, deterministic, serializable, and side-effect free; no game rules in React; no Strategy execution in web/API; no `Math.random`, clock, filesystem, network, or database inside engine logic; no Node `vm` security boundary. Treat Strategy source as hostile and schema-check runtime boundaries. Preserve canonical terminology and immutable submitted Revisions. Public replay excludes source, StrategyMemory, SoldierMemory, and objective payloads by default. [VERIFIED: `AGENTS.md`]
- Do not alter canonical rules or the approved runtime ceilings: guest method 1,000 ms, host 5,000 ms, Match 600,000 ms; new experiment wall-clock cap is eight hours, not a replacement runtime limit. [VERIFIED: `packages/spec/src/runtime.ts` `DEFAULT_RUNTIME_LIMITS`; allocation references in `packages/strategy-lab/src/league/allocation.ts`]
- Existing allocations, consumed routes, failed results, empty reservations, authorization bytes, private stores, and verification history are immutable. Do not launch V14 or try to reclaim/credit prior evidence. [VERIFIED: approved charter and current top of `.planning/STATE.md`]

## Summary

Use a new, separately versioned private experiment path rather than adapting the legacy full-league selector/allocation or its 11,328-match policy. Reuse the actual current-kernel execution boundary and validated factory-supervised runtime issuance, but build a small allocation/retention contract that commits all schedules, identities, byte/time ledgers, and compact projections before any outcomes are observed. [VERIFIED: `265-07-PLAN.md` legacy amendment; `packages/strategy-lab/src/runtime-bridge.ts`; `packages/strategy-lab/src/league/connected-runner.ts`; `packages/strategy-lab/src/league/allocation.ts`]

Recommended ceiling: three profiles (current edge baseline, inward rank, bracket shield), **three initial candidates plus one reserved response slot/profile** (four maximum final candidates), and one adversarial round. For each profile, round 0 evaluates the three initial candidates: 6 unordered-with-replacement pairs × 8 condition/arena cells = 48 Matches. The one accepted response adds four pairs (three existing candidates plus itself) × 8 = 32 new Matches; prior cells are reused, not rerun. Therefore the main experiment is **80 Matches/profile, 240 total**, plus the 8-Match pilot = **248 total**. Set a stricter local hard allocation ceiling of **300 total Matches including pilot and failures**, within the charter's “few hundred at most”; unused room is not an instruction to expand. If exact repository condition semantics require additional cells, reduce candidates before allocation, never exceed 300. [VERIFIED: cardinality derived from `CANONICAL_SET_CONDITION_ROWS_V1_37` and active semantic-arena decisions in `265-CONTEXT.md`; candidate count is recommendation]

First run an eight-Match current-rules pilot (one assessed pair × four conditions × two distinct active geometries) through the canonical host-issued path. Record elapsed wall time and actual additional bytes, including temporary workspace high-water estimate and fixed terminal allowance. Then freeze a conservative ≤300-match allocation that fits both 15,000,000,000 additional bytes and the one shared eight-hour cap with substantial headroom. If pilot or static source inspection cannot establish that fit, do not dispatch the experiment; report infeasible/inconclusive, not a more complex checkpoint chain. [ASSUMED: eight-match pilot is sufficiently representative to estimate resource feasibility; pilot cannot demonstrate strategy quality]

**Primary recommendation:** a small, matched, three-profile comparative experiment with a compact all-Match accounting ledger and a separately authenticated compressed replay sample, using only the existing canonical Match transition and supervised runtime boundary. No legacy full-league gate is satisfied by this exploratory run.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Strategy invocation and Match progression | Runtime / canonical engine | Private lab coordinator | Existing `runCanonicalLabMatch` advances the admitted `MATCH_KERNEL`; Strategy calls come from supervised providers, not coordinator execution. |
| Candidate identity, response admission, profile freeze | Private strategy-lab | Factory artifact repository | Existing immutable factory contracts provide source closure, validation, and identity; new allocation must bind profile-specific retraining and equal budgets. |
| Schedule/accounting and outcome projection | Private lab coordinator | League contracts/repository | Deterministic identities and per-Match terminals can be reused; legacy all-execution graph is too large for this charter. |
| Replay sampling and retention | Private lab storage | Canonical replay reconstruction | Store full replay only for precommitted sample/failures; every Match still has compact result, accounting, provenance, and status. |
| Holdout | Restricted private evaluation boundary | None | Keep unopened until all three population roots, schedules, and response admissions are frozen. |
| Production/public/counted surfaces | No ownership in this phase | — | All such authority remains false; no new registration or exposure path. |

## Minimum Reusable Execution Path

1. Re-admit each immutable factory candidate source/validation/packet closure using the existing `readCandidateClosure` / candidate admission path; obtain providers only via host issuance (`issueLeagueProviderFromFactoryCandidate` family in `packages/strategy-lab/src/league/connected-runner.ts`). Do not accept provider objects from caller input or execute source in the coordinator.
2. Construct each Match input with the canonical scenario and explicit condition row, exact active arena semantic identity, immutable candidate roots, deterministic seed derived from allocation-root + profile-root + cell identity, and unchanged runtime tuple. Keep `Smoke`/`Open Field` as a single semantic geometry; count active catalog geometries, not historical labels. [VERIFIED: `265-CONTEXT.md` D-07/D-08; `packages/spec/src/arena-catalog-v1-37.ts`]
3. Dispatch through host-issued supervised runtime providers into `runCanonicalLabMatch` in `packages/strategy-lab/src/runtime-bridge.ts`; that bridge calls `MATCH_KERNEL`, retains full execution in memory for projection, and distinguishes `system_failure` from candidate/player violations. Close both providers in all terminal paths.
4. Publish one compact private per-Match record immediately: allocation/profile/population/candidate/cell/arena/condition/seed/runtime roots; result or failure classification; score/outcome, Match length and compact domain metrics; byte counts; accounting digest/root; replay disposition; cleanup/system-failure status. Preserve empty/unlaunched reservations and failure rows. Verify exact schedule bijection after run.
5. For replay-selected cells only, encode the existing execution into a compressed container whose manifest authenticates the uncompressed canonical stream root, compressed-byte root, codec/version, and lengths. For all other cells discard detailed transition/event arrays after accounting extraction and record-root validation.

The available legacy fallback `LeagueRecordGraph` in `scripts/run-v1-38-serious-league.ts` chunks but retains/hydrates all execution details and has its own heavy graph/verifier joins. It is useful as a source for canonical identity, publication, and validation seams—not as the experiment’s whole retention format. Existing `league-execution-stream-v2` is an authenticated complete stream and must remain complete; do not change old readers to treat partial samples as complete old league evidence. Create a new explicit schema/version and reader that rejects cross-version substitution. [VERIFIED: code inspection of `LeagueRecordGraph`, `readLeagueRecordGraph`, and `scripts/lib/v1-38-league-execution-stream.ts`]

## Recommended Frozen Schedule and Caps

| Item | Recommendation |
|---|---|
| Profiles | Current edge-rank baseline, inward-rank control, bracket-shield treatment; separate retraining and population roots. |
| Baseline order | Build, evaluate, red-team, and freeze the current-rules edge population first; only then materialize either experimental initial-state profile. Freeze and retain the baseline root before formation-specific artifacts exist. |
| Candidate pool | Three initial candidates/profile, matched by doctrine/oracle strata; freeze all initial populations before opening holdout. One response round permits at most one accepted response/profile, making four final candidates/profile maximum. |
| Arena set | Exactly the distinct active semantic geometries in the canonical v1.37 catalog (Smoke/Standard Cross); aliases never double-count. |
| Balance | Three candidates yield 3×4/2 = 6 unordered-with-replacement pairs/profile and 48 cells/profile. Add one response and only its four new pairings for 32 more cells/profile: 80/profile, 240 total main experiment. This includes self-pairs. |
| Response round | One bounded response against frozen mixture and named strongest/vulnerable pure targets. Reuse old pair outcomes; evaluate all new response pairings in the same four-condition/two-arena schedule. Maximum one accepted response per profile. |
| Pilot | Eight current-rules Matches before profile experiment: one assessed pair × four conditions × two arenas. Pilot consumes the same global Match/time/disk envelope; it does not reset it. |
| Replay | Preselect four cells/profile (12 total) using deterministic schedule hash before results; include all failures and any integrity/cleanup failure replay material required for diagnosis. If failures push storage above budget, stop; never overwrite the sample or every-Match compact ledger. |
| Human/model/oracle | Small exact profile-equal fixed budget, ideally one bounded independent response attempt per profile and identical zero/nonzero human/model allocations. If required independence cannot be supported in the time cap, mark that channel unused equally and downgrade claim; do not imply complete red-team coverage. |
| Shared caps | One durable cumulative counter across pilot, all profiles, all failed attempts and any authorized retries: recommended allocation is 248 total Match slots (8 pilot + 240 main), hard ceiling 300 inclusive of pilot/failures, ≤15,000,000,000 additional bytes including scratch/buffers, and ≤8 elapsed execution hours. Any failure burns its actual time and Match count; a failure does not reset any ledger. |

Freeze the exact resource allocation after the pilot and before observing comparative profile results. The recommended 248 total leaves at most 52 Match slots below the local hard 300 cap as contingency, not discretionary scope. Do not spend contingency without a reviewed allocation revision that remains within the same approved envelope; simplest stop behavior is preferred. [VERIFIED: arithmetic; use is recommendation]

## Matched Metrics and Interpretation

Use paired profile differences on same logical seed, opponent/doctrine pairing, side, initiative, arena, and budget stratum. Report per profile and paired differences with raw denominators and uncertainty intervals; small pools are descriptive, not certification. Minimum useful metrics:

- entrant half-point score and win/draw/loss plus failure class;
- Match length, ACTIVE survival, first interaction, first-Contraction evacuations and reserves left unselected;
- opening activation entropy using fixed bins, Backstab timing/cause, push/block, no-Advance STONE;
- behavior labels for center-rush, wing-guard, convoy, and turtle, with deterministic label procedure and counts;
- response result against the same frozen mixture and strongest/vulnerable pure targets; worst observed pure-policy outcome and oracle-relative response gap, explicitly **not** Nash/exploitability/optimality;
- side/initiative/arena/symmetry and deterministic-repeat deltas, plus runtime invocations, timeouts, invalid/player outputs, system failures, cleanup completeness;
- per-profile candidate/family/independence statuses and exact evidence roots.

Reject or mark inconclusive if any profile has unmatched candidate/oracle/Match/replay-review budgets; an incomplete or duplicate schedule; any unexplained system failure or incomplete cleanup; Strategy-source leakage; holdout opened early; baseline not frozen before formation artifacts; a population/profile/seed/runtime identity mismatch; a deterministic-repeat mismatch; or resource cap exhaustion. Bracket-specific adverse signals (scripted opening convergence, convoy/STONE-shield turtle, materially lower interaction, worse oracle-relative response results) should yield “not supported” for a later rules proposal, not a retroactive threshold change.

## Standard Stack / Don't Hand-Roll

No new external package is needed or recommended. Use the existing TypeScript monorepo and Vitest tests; project tests already run through `pnpm --filter @cowards/strategy-lab test` and `pnpm --filter @cowards/spec test`. [VERIFIED: `package.json`, `packages/strategy-lab/package.json`]

| Need | Reuse | Avoid |
|---|---|---|
| Match rules | `runCanonicalLabMatch` → `MATCH_KERNEL` | Any league-local transition copy, direct-source matrix runner, or alternate engine. |
| Runtime isolation | `FactorySupervisedRuntimeHost`/provider issuance and runtime bridge | `new Function`, Node `vm`, caller-supplied provider, web/API/coordinator execution. |
| Canonical identity | `labRoot`, canonical JSON admission, existing spec condition and arena semantic hashes | Directory ordering, display arena IDs as geometry identity, seed parity as initiative policy. |
| Candidate assessment | Factory source closure, validation and immutable candidate artifacts | Starter/Advanced fixtures or the historical V2.0 matrix as strategy-strength evidence. |
| Full replay sample | Existing execution shape plus new explicit sampled-replay container schema | Modifying `league-execution-stream-v2` or accepting incomplete streams as complete historical evidence. |

## Validation Architecture

Project validation is enabled (`workflow.nyquist_validation: true`). [VERIFIED: `.planning/config.json`]

| Test layer | Command / scope | Required new assertions |
|---|---|---|
| Contract unit tests | `pnpm --filter @cowards/strategy-lab test` | Allocation rejects >300 total Matches, >15GB bytes, >8h; cumulative charge across profiles and failed attempts cannot reset; exact equality of profile budgets; sample selection committed before outcomes. |
| Canonical runner tests | Existing `packages/strategy-lab/src/league/connected-runner.test.ts` and runtime bridge tests | Only host-issued providers; exact condition, seed, arena/runtime roots; canonical kernel entry; guest/host/Match caps unchanged; close and preserve failure class. |
| Retention tests | New lean evidence module tests alongside `scripts/lib/v1-38-league-execution-stream.test.ts` | Every scheduled Match has one compact terminal/accounting row; sampled replay round-trips and authenticates compressed/uncompressed roots; non-sampled details absent; all failures retained; legacy full-stream reader rejects the new sampled schema and vice versa. |
| Schedule/reduction tests | `packages/strategy-lab/src/league/{contracts,matrix,allocation}.test.ts` | 3 profiles × 2 semantic arenas × 4 conditions × unordered-with-replacement pairs; no alias double count; stable order/roots under permutation; exact paired conditions. |
| Boundary/security tests | `scripts/check-v1-38-serious-league-boundaries.test.ts` plus focused AST/import tests | No profile/formation data reaches product, public, counted, ordinary revision, web/API, or worker registration; replay projection excludes source, StrategyMemory, SoldierMemory, objective payload. |
| Pilot/runtime source validation | Source-only fixture tests; actual 8-Match pilot only after reviewed allocation | Pilot measures actual bytes/time; synthetic tests never grant empirical authority; no launch if statically forecast disk/time exceeds caps. |

Do not start with full `pnpm test:fast`; use focused package and boundary commands while iterating. Full repository validation belongs to the ordinary phase source gate before any authorized empirical execution.

## Security and Failure Accounting

- Private-only, offline evidence; filesystem work is restricted to the private lab repository and must not happen inside engine transitions. Use restrictive directory permissions and reject symlinks/path escapes as repository code does. [VERIFIED: `packages/strategy-lab/src/league/repository.ts`]
- Every Match status distinguishes `success`, Strategy/player violation, `system_failure`, timeout, cancelled, and unlaunched. A supervisor/transport timeout cannot be relabeled as Strategy loss. Keep a compact safe error code and root, not unrestricted exception or Strategy source in report projections. [VERIFIED: `packages/strategy-lab/src/runtime-bridge.ts`, runtime failure contracts]
- Preserve exact source and runtime roots in private provenance records, never public report or sampled replay export. Replay bundles need a strict private classification; redact source and memory/objective values even in non-source diagnostic summaries.
- Holdout commitment may exist in the frozen allocation, but contents/access token and evaluator data remain unopened until all candidate populations, response decisions, metrics, and analysis code are frozen. One opening only; no retraining afterward.
- Keep initiative conditions explicit; do not infer from RNG/seed. Randomness for deterministic schedule ordering must be seeded from committed allocation and fixed before outcomes.
- If system/resource failure leaves uncertainty about partial publication, burn that Match/time charge and stop/reconcile; never retry/reuse a consumed allocation or overwrite any prior route.

## Common Pitfalls

1. **Treating lean execution as old gate completion.** Existing LEAG-01…09 and 265-07 full population/diversity/matrix/response/red-team gates remain unfulfilled when not met. The approved charter explicitly supersedes/defer them for exploratory scope; planner must create separate proportional criteria and clearly name old gates deferred, not passed.
2. **Starting with oversized legacy policy.** `LEAGUE_APPROVED_PROSPECTIVE_POLICY_V2` retains 11,328 Matches and 96h wall-clock; never feed it to the new run. [VERIFIED: `packages/strategy-lab/src/league/allocation.ts`]
3. **Compact ledger silently drops failures.** Define one terminal row per allocated Match including unlaunched/empty reservation and cleanup; only detailed replay retention is sampled.
4. **Compression weakens integrity or compatibility.** Hash canonical uncompressed bytes and compressed bytes independently; pin codec/version; use a new schema and reader. Never alter a prior reader to make a partial replay look complete.
5. **Pilot results become comparative evidence.** Pilot is only throughput/storage feasibility; do not use it to tune strategy or reveal profile outcomes. Freeze exact main allocation and analysis before comparative execution.
6. **Unequal retraining.** Equalize candidate attempts, accepted slots, doctrine families, oracle/model/human/search work, Match conditions, holdout policy, and replay-review minutes per profile. A failed attempt consumes budget symmetrically.
7. **Claim inflation from tiny N.** Report observed sample, oracle-relative gaps, and uncertainty/limitations; do not call it strongest strategy, certification, exploitability proof, solved play, or definitive balance.

## Open Questions

1. **Can the existing provider issuance/runtime envelope produce a compact per-Match result without retaining full execution artifacts?** Existing runner currently persists broad execution graphs. Implement a narrow projection callback and tests; if it cannot be safely separated, stop as infeasible instead of keeping unbounded detailed outputs.
2. **What is actual bytes/Match and throughput on the approved host?** The eight-cell current-rules pilot must measure this. Do not invent storage compression ratio or run time. Apply conservative headroom and reduce allocations if necessary.
3. **Does there exist a frozen four-candidate-per-profile starting population with one response slot while satisfying equal independent-oracle budgets?** If not, choose a smaller exact count before allocation, and still retain one shared adversarial round only where feasible; never replace genuine independence with labels.
4. **What deterministic, non-gameplay profile boundary is already available for bracket/inward?** Research/implementation must inspect lab-only initial-state code; if none exists, add a versioned lab-only initializer and prove non-importability into production/count paths. Do not modify canonical rules or initial state globally.

## Sources

### Direct project sources (HIGH confidence for repository facts)
- `AGENTS.md` — project boundaries, build order, and testing requirements.
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/LEAN-EXPERIMENT-20261003.md` — approved current cap and scientific limitations.
- `.planning/STATE.md` (top current-continuation section only) — active continuation and immutable-history constraints.
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md` — canonical current phase contracts and old full scope to supersede/defer, not silently claim.
- `265-07-PLAN.md`, `265-AI-SPEC.md` — existing implementation contracts and retained gates; treated as predecessor plan subject to new approval.
- `packages/strategy-lab/src/runtime-bridge.ts`, `packages/strategy-lab/src/league/connected-runner.ts`, `packages/strategy-lab/src/league/allocation.ts`, `packages/strategy-lab/src/league/repository.ts` — canonical execution, host issuance, old allocation, private durable storage.
- `scripts/run-v1-38-serious-league.ts`, `scripts/lib/v1-38-league-execution-stream.ts`, `scripts/run-v1-38-lean-runner-feasibility.ts` — legacy full graph, complete replay stream, and bounded fixture runner patterns.
- `packages/spec/src/runtime.ts`, `.planning/config.json`, `package.json`, `packages/strategy-lab/package.json` — runtime defaults, validation setting, and test commands.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | Eight Matches adequately characterize resource feasibility enough to set a conservative run ceiling; it does not characterize strategic performance. | Summary / Schedule | Higher execution tail or artifact size may exceed estimates; allocation must retain headroom and stop if actual use diverges. |
| A2 | Three initial candidates plus one response per profile is enough for a useful exploratory matched comparison. | Schedule | May yield weak response/candidate diversity; report limitation rather than enlarge beyond cap. |
| A3 | Four preselected replays per profile plus every failure provides useful qualitative review under storage cap. | Schedule | Rare events may be missed; aggregate metrics still need all-Match compact data. |

**Confidence breakdown:** Standard stack HIGH (existing repository modules); architecture MEDIUM (path is present, compact adapter is not); resource feasibility LOW until pilot; statistical/strategic interpretation MEDIUM-LOW given tiny pool.

**Valid until:** 2026-11-02, or immediately upon changes to the approved charter, runtime limits, or Phase 265 source contracts.
