# Phase 265: Tactical Development Adaptation - Focused Research

**Researched:** 2026-09-22  
**Scope:** Plan 265-07 realism correction only; no allocation, live authoring, provider, Match, or artifact issuance was performed. [VERIFIED: task scope; git HEAD `cbdcad76`]
**Confidence:** HIGH for the defect/file map and retention path; MEDIUM for the new profile-selector shape because it is a prospective implementation recommendation.

## User Constraints (from CONTEXT.md)

### Locked Decisions

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

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; do not change game rules in React. [VERIFIED: AGENTS.md]
- Never execute hostile Strategy source in the coordinator, web/API/Go, or use Node `vm` as a security boundary. Validate runtime boundaries with schemas. [VERIFIED: AGENTS.md]
- Do not use nondeterministic clock/random/network/filesystem/database access inside engine logic; preserve canonical game terminology and immutable submitted Strategy Revisions. [VERIFIED: AGENTS.md]
- Keep private Strategy source, memories, and objective payloads out of public replay output. [VERIFIED: AGENTS.md]
- Runtime changes require invalid-output, timeout, capability, memory/source-limit, schema, and player-versus-system failure tests. [VERIFIED: AGENTS.md]

## Summary

`emitTacticalSource()` accepts no input and recompiles the same three authored tactical modules on every call. Factory ingestion calls it with no arguments, so each prospective tactical job emits the historical S01 controller; the job's 100 `searchNodes` are currently only a reservation. [VERIFIED: `packages/strategy-oracle-tactical/src/emit.ts:98-129`; `scripts/ingest-v1-38-factory-packet.ts:71-77`; `packages/strategy-lab/src/league/allocation.ts:152-158`]

The run already creates a private R0/R1/R2 target packet after the complete matrix and frozen solver target exist. That packet contains the weighted mixture, named strongest/vulnerable target, exact candidate source artifacts, and target identity, but the non-model authoring branches only check its presence; only model authoring appends it to a prompt. [VERIFIED: `scripts/run-v1-38-serious-league.ts:591-607`; `scripts/lib/v1-38-league-authoring.ts:89-102,137-143`]

**Primary recommendation:** implement one private, deterministic `tactical-adaptation-profile-v1` path for the three prospective tactical `development_response` jobs only. It must derive exactly 100 bounded offline evaluation units from the already-retained, target-relative legal observations of R0/R1/R2; compile the selected profile into operative activation and Action scoring constants; retain and rederive the target/projection/profile/source chain. This is a heuristic offline adaptation, not a claim that the selector itself found a best response. Any response-strength claim remains contingent on the existing supervised response Matches and unchanged PSRO admission rules. [RECOMMENDATION; VERIFIED: existing target/matrix/response gates]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Reconstruct target-relative legal inputs | private league coordinator | pure engine | Coordinator reads already-retained private execution; `MATCH_KERNEL` reconstructs requests without a provider or source execution. [VERIFIED: `scripts/run-v1-38-serious-league.ts:385-409`; `packages/strategy-lab/src/runtime-bridge.ts:27-83`] |
| Bounded profile selection | tactical oracle package | private league coordinator | A pure tactical helper scores a frozen corpus; coordinator only binds roots/retains evidence. [RECOMMENDATION] |
| Emit behaviorally operative source | tactical oracle package | factory ingestion | The emitted closed source embeds selected legal planner/scoring parameters; factory preserves the source and producer input. [RECOMMENDATION; VERIFIED: current tactical emitter/ingester] |
| Candidate execution and strength test | supervised runtime | league matrix/PSRO | Only host-issued providers execute source; existing 288 reserved Matches/job and frozen response checks determine admission. [VERIFIED: `scripts/lib/v1-38-league-response-runtime.ts:146-245`; `packages/strategy-lab/src/league/allocation.ts:157-158`] |

## Confirmed Defect and Reachable Data

### Current accounting

The approved prospective schedule has tactical jobs at flattened indices 0, 3, and 6, which are the development-response jobs in rounds R0, R1, and R2; each has exactly `searchNodes: 100`, `matches: 288`, no retry parent, and the unchanged 11-attempt/9-slot vector. The last two jobs are teacher/model independent evaluation and must remain target-free. [VERIFIED: `LEAGUE_APPROVED_PROSPECTIVE_POLICY` and prospective-job validation in `packages/strategy-lab/src/league/allocation.ts:104-112,152-163`]

`searchNodes` is a per-job reservation field and current terminal accounting records that value after authoring. The correction must therefore define one profile-vs-observation evaluation as exactly one search node and require a final count of exactly 100—not run a 100-node outer loop whose members invoke an unbounded or separately-counted planner. [VERIFIED: `packages/strategy-lab/src/league/allocation.ts:57-75,157-158`; `scripts/run-v1-38-serious-league.ts:648-652;` RECOMMENDATION]

The completed current-round matrix retains each `cell-result` execution before the response job starts. A `LabMatchExecution` contains the admitted final state/events, ordered canonical transitions, and supervised runtime accounting; a pure replay of the admitted `MATCH_KERNEL` can recover each effect request and its legal input without invoking candidate source, a provider, or a new Match. [VERIFIED: `scripts/run-v1-38-serious-league.ts:385-409`; `packages/strategy-lab/src/runtime-bridge.ts:22-83`]

The current target packet records mixture weights and named pure targets, but not a compact target-relative observation corpus. Add that corpus while constructing the development target packet, sourced only from the current `roundBlocks`/`matrix.results` graph records that already exist at that point. Do not use raw source hashes or mixture weights as entropy for a profile choice. [VERIFIED: `scripts/run-v1-38-serious-league.ts:457-490,591-607`; RECOMMENDATION]

### Exact corpus and objective

For each R0/R1/R2 tactical job, select the frozen target set as the existing mixture support plus strongest and vulnerable pure candidates. For each target candidate, replay only completed retained cells in which that candidate was the opponent; collect target-facing `selectActivations` requests with at least one ACTIVE Soldier and a positive activation count, plus the target's already-supervised output summary from the corresponding accounting entry. Canonically order and deduplicate by retained cell root, target candidate root, invocation root, and request root. [RECOMMENDATION; VERIFIED: target identities/weights and completed execution data are available in the cited run/runtime paths]

Select four distinct target-relative legal observations using the frozen mixture/strongest/vulnerable precedence and canonical ordering. Form a fixed 25-profile grid, then evaluate each profile once against each selected observation: **25 × 4 = exactly 100 search nodes**. A node may call the pure tactical profile scorer/one-node legal planner only; it must not execute target source, call a runtime/provider, simulate a Match, enumerate additional hidden search nodes, or read a later round. If four eligible observations cannot be derived, fail the charged attempt before ingestion as `system_failure`; do not substitute terminal boards, duplicate observations, source hashes, or synthetic targets. [RECOMMENDATION]

The score must be explicit and target-intelligible: lexicographically retain existing legality/survival ranks from `scoreTacticalMission`/`scoreTacticalAction`, then use a profile's declared pressure/screen/recover and MOVE/TURN/STONE weights against the target-relative pre-Activation observation and target's retained observed action/activation summary. The corpus itself—not a hash—therefore makes the target source's supervised historical behavior part of the objective. This measures a bounded heuristic response profile, not predicted game value or best-response strength. [RECOMMENDATION; VERIFIED: existing tactical scorer exposes mission/action ranks at `scoring.ts:52-108`]

## Recommended Same-Plan Repair

1. **Keep the historical emitter path immutable.** Retain `emitTacticalSource()` and `emitTacticalFactoryPacket(request-without-profile)` byte-for-byte. Add an optional, strict `TacticalAdaptationProfile` only to a new profiled branch; default compilation and `tacticalSourceManifest()` must retain existing output/root. [RECOMMENDATION; VERIFIED: historical calls/reload use zero-argument emitter at `emit.ts:121-142`; `ingest-v1-38-factory-packet.ts:148-150`]

2. **Create a pure tactical adaptation helper.** Place the strict profile/corpus/evaluation types and `deriveTacticalAdaptationProfile()` beside tactical scoring/search. It accepts only canonical data, enforces exactly four eligible observations, exactly 25 declared profiles and exactly 100 one-unit evaluations, canonical tie-breaks, fixed bounded coefficients, and emits a rooted compact selection record. It uses no `Date`, random source, filesystem, network, or candidate evaluation. [RECOMMENDATION]

3. **Make the emitted source operative.** Compile the selected profile as literal constants into a new profiled controller template. The profiled selector must use the constants to choose its bounded activation beam and to adjust action/movement/STONE ranking before the existing deterministic tie-break. A deterministic legal fixture must demonstrate at least one differing returned activation or Action between two selected profiles; a profile-root comment or unused literal is insufficient. [RECOMMENDATION; VERIFIED: current selector delegates activation/action selection to tactical search/scoring at `selector.ts:19-37`]

4. **Bind it at authoring time, not allocation preparation.** The allocation's producer request must remain immutable because the target artifact does not exist until the current matrix/round is complete. In `executeLeagueAuthoring`, for a prospective tactical development job with a target: parse the target corpus, derive the profile, publish a compact private profile-selection artifact, then pass a derived tactical producer input (`base request + profile`) to ingestion. The factory ingestion record stores that derived input; the original job request, target artifact root, profile-selection artifact root, input corpus root, output profile root, and emitted source root are retained in the authoring result. [RECOMMENDATION; VERIFIED: immutable request is read from `job.producerRequestArtifactRoot` before authoring, while target is created in the run after matrix completion]

5. **Fail closed and rederive.** `verifyRetainedLeagueAuthoring` must rebuild the profile from the retained target corpus and compare every rooted input/output plus the stored profiled source. `verifyRetainedLeagueRun` must independently prove that every corpus observation comes from the correct complete R0/R1/R2 matrix cell-result, target candidate, frozen target weight/role, and supervised accounting input/output. Any changed target, observation order, source/action summary, search count, profile, or source is a retained-verification failure. [RECOMMENDATION; VERIFIED: authoring and whole-run retained readers already separately validate targets and source artifacts at `scripts/lib/v1-38-league-authoring.ts:163-181`; `scripts/run-v1-38-serious-league.ts:995-1003`]

6. **Leave teacher unchanged in this correction.** Teacher authoring currently consumes declared canonical-match searches, distills their legal targets into a student, and emits source from that student; its development target is presently only presence-checked, like tactical. Repairing it would need a separate target-to-`TeacherSearchRequest` semantic contract, so it is not necessary to make the specifically approved three tactical jobs target-operative and would broaden this minimal correction. Independent teacher evaluation must remain target-free. [VERIFIED: `scripts/lib/v1-38-league-authoring.ts:47-50,137-141,176-181`; `packages/strategy-oracle-teacher/src/teacher.ts:205-348`; RECOMMENDATION]

## File and Function Map

| File | Change / role | Required guard |
|---|---|---|
| `packages/strategy-oracle-tactical/src/emit.ts` | Add strict profiled compile/emission branch while preserving zero-argument bytes. | Default source/manifest roots unchanged; profile changes actual controller behavior. [RECOMMENDATION] |
| `packages/strategy-oracle-tactical/src/scoring.ts`, `search.ts`, or new local `adaptation.ts` | Define canonical corpus, 25 profiles, exact 100-node evaluator, and rooted selection. | Pure only; no target execution; four distinct reachable observations required. [RECOMMENDATION] |
| `packages/strategy-oracle-tactical/src/selector.ts` | Supply profile constants to bounded activation/action ranking in profiled emitted source only. | Existing default behavior untouched. [RECOMMENDATION] |
| `packages/strategy-oracle-tactical/src/index.ts` | Export only the private helper needed by authoring/tests. | Do not create public/product export. [RECOMMENDATION] |
| `scripts/run-v1-38-serious-league.ts` | Build the private target observation corpus from current matrix cell-result executions before `produceLeagueResponse`; validate in retained run. | Current completed R0/R1/R2 records only; no extra Match/provider call. [RECOMMENDATION] |
| `scripts/lib/v1-38-league-authoring.ts` | Derive/persist profile for tactical development jobs and rederive it on retained read. | Require target; preserve teacher/model and non-development target semantics. [RECOMMENDATION] |
| `scripts/ingest-v1-38-factory-packet.ts` | Pass optional stored tactical profile into packet/source emission and reload. | Historical tactical ingestion/reload stays byte-identical. [RECOMMENDATION] |
| `packages/strategy-oracle-tactical/src/tactical.test.ts` | Unit proof for exact default compatibility, exact 100 units, corruption rejection, and observable behavior change. | No source execution. [RECOMMENDATION] |
| `scripts/lib/v1-38-league-authoring.test.ts` | Prospective tactical target/profile authoring and retained re-derivation tests. | In-memory canonical fixtures only; no provider. [RECOMMENDATION] |
| `scripts/run-v1-38-serious-league.test.ts` | Corpus is rooted from completed current matrix records; R0/R1/R2 mapping and retained tamper cases. | Injected host/runner only; no empirical run. [RECOMMENDATION] |

## Do Not Hand-Roll / Do Not Claim

| Problem | Use | Do not do |
|---|---|---|
| Recover reachable legal observations | Existing retained execution plus pure `MATCH_KERNEL` replay. [VERIFIED: runtime bridge] | Execute source, reconstruct rules independently, or create new Matches. |
| Test eventual response quality | Existing 288 supervised response Matches/job, target scoring, clone/novelty, and PSRO re-entry. [VERIFIED: allocation/run paths] | Label the offline profile score a best response, empirical win rate, new family, independent core, or accepted candidate. |
| Preserve historical tactical evidence | Zero-argument emitter/packet/reload path. [VERIFIED: tactical emitter/ingestion] | Backfill or rewrite S01, historical factory artifacts, or old source manifests. |
| Diversity | Existing fingerprint, clone, behavioral-family, independent-core, portfolio, and finalist gates. [VERIFIED: CONTEXT D-17–D-19] | Treat target-conditioned source variation as independent-core/family evidence. |

## Validation Architecture

| Requirement | Source-only test |
|---|---|
| Historical compatibility | Assert exact pre-change `emitTacticalSource()` and `emitTacticalFactoryPacket(legacyRequest)` bytes/roots and `readFactoryIngestion` reload. |
| Exact accounting | Valid corpus yields exactly 25 profiles × 4 observations = 100 retained evaluations; 99/101, duplicate/missing observation, invalid target role/weight, or added nested planning fails. |
| Target reality | Altering retained matrix result, target candidate/action summary, mixture weight, round root, or corpus ordering rejects; a root-only/entropy corpus has no accepted schema. |
| Behavioral operation | Two explicit profiled sources differ, pass closure, and produce a different deterministic legal activation/Action on a fixture; profile literals unused by output fail. |
| Authoring provenance | Tactical R0/R1/R2 authoring result binds original request, target, corpus, profile selection, derived producer input, packet/source; retained reader rederives all. |
| Frozen scope | Attempting profile use for legacy, teacher, independent evaluation, missing target, a wrong round, a fourth tactical job, a retry, provider call, or Match dispatch fails. |
| Existing gates | Run the focused tactical/authoring/run suites, then the named Plan 265-07 source gate and TypeScript checks. [VERIFIED: `265-07-PLAN.md` task-2 validation contract] |

## Decision Boundary

This correction is an ordinary implementation detail within the already approved three tactical jobs: it gives their already-reserved 100 searches a truthful, target-conditioned, behaviorally operative meaning while retaining existing source, target, and output provenance. It changes no rule, runtime, channel, retry/model/Match budget, population/family/core/finalist gate, or acceptance policy. [VERIFIED: approved policy/CONTEXT; RECOMMENDATION]

The only scientific limitation to state in code/report language is not a request for an operator choice: the profile selector is an offline heuristic over retained target behavior and legal observations, **not** evidence that it has computed a best response. The frozen supervised Match results, response-strength rule, fingerprints, and final gates remain the sole evidence for acceptance or any strength claim. [RECOMMENDATION; VERIFIED: CONTEXT D-14, D-17–D-21]

## Assumptions Log

| # | Claim | Risk if wrong |
|---|---|---|
| A1 | Four distinct target-relative reachable pre-Activation observations can be recovered from each complete R0/R1/R2 matrix by pure replay. [ASSUMED] | The job must fail charged before ingestion; no fallback observation/candidate is permitted. |
| A2 | A 25-profile fixed grid can produce an observable legal behavior difference on the deterministic fixture without changing default tactical source. [ASSUMED] | Keep the test RED until profile constants are actually operative; do not accept metadata-only variation. |

## Sources

- [VERIFIED: codebase] `packages/strategy-oracle-tactical/src/emit.ts`, `scoring.ts`, `search.ts`, `selector.ts` — static historical emission and pure tactical scorer/search boundaries.
- [VERIFIED: codebase] `scripts/ingest-v1-38-factory-packet.ts`, `scripts/lib/v1-38-league-authoring.ts`, `scripts/lib/v1-38-league-response-runtime.ts` — ingestion, target, authoring, and retained-proof paths.
- [VERIFIED: codebase] `scripts/run-v1-38-serious-league.ts`, `packages/strategy-lab/src/runtime-bridge.ts`, `packages/strategy-lab/src/league/matrix.ts` — complete matrix retention and pure replay-capable evidence.
- [VERIFIED: 265-CONTEXT.md; 265-LEAN-RUN-DECISION.md; 265-LEAN-AMENDMENT.md] — frozen limits, gates, schedule, and conditional no-dispatch authority.

