# Phase 265 Plan 16 — Post-v14 resource-window research

**Status:** Source-only planning supplement; not a new plan, route approval, or execution authorization.
**Evidence basis:** Repository source and the approved records named below; no external dependencies.

## Decision and scope

The replacement window is approved prospectively for source/contract implementation: resume anchor `2026-10-09T14:38:33Z` / `1791556713000`; cumulative elapsed cap `223171903ms`; absolute deadline `2026-10-09T18:38:33Z`. ALL wall time since `1791455941097` remains charged, including research, review and idle time. Preserve the 31-minute terminal reserve, FULL108M, and 600000ms per-Match ceiling. These values come from the approved replacement record, not a newly calculated or rolling window. [VERIFIED: 265-16-POST-V14-REPLACEMENT-WINDOW-APPROVAL-20261009.md]

Approved private aggregate-memory ceiling is `3000000000B` for parent RSS + child RSS + unchanged `512000000B` external reserve + `335544320B` guard. It is not a disk allowance. Keep disk scratch `2000000000B`, retained `12000000000B`, total `15000000000B`, oldspace 768MiB, guest/host/startup `1000/5000/2500ms`, sampling 250ms, and all Match/gameplay/runtime/privacy limits unchanged. Keep exactly four unused pairs after consumed v14-1 and its immutable 36 cumulative charges. Each future ordinal requires authentic v14-1 carry and its own successor chain, accepted own diagnostic/FINAL before its own conditional baseline, full fresh audits, and new source/data/helper review and immutable allocation. The first fully accepted baseline or budget exhaustion ends the experiment. No feasibility or completion promise follows. [VERIFIED: 265-16-POST-V14-REPLACEMENT-WINDOW-APPROVAL-20261009.md; 265-16-POST-V14-MEMORY-AND-TIME-DECISION-v1.md]

The diagnosis says v14-1's baseline died pre-charge with SIGKILL/resource-threshold; cumulative charges remain 36 and its diagnostic remains accepted. Static control-flow analysis infers the aggregate RSS guard branch from the saved reason and v8 time-budget guard, but no simultaneous RSS operands or initiating native allocation were captured. Treat the cause and whether the full 36-cell baseline fits as unknown. Do not rerun v14-1, relax the v14-2..5 fail-closed guard by itself, or bypass audits. [VERIFIED: .planning/debug/v14-baseline-precharge-rss.md]

**Primary recommendation:** Implement a separate, authenticated prospective successor family/policy binding scoped to the four unused ordinals. Carry the approved elapsed cap/deadline and aggregate RAM threshold in that binding while preserving all disk fields and historical policies. Ensure capacity admission, live sampling/kill-or-refuse guard, parent and child admission/audits, retained evidence readers, and terminal verification all interpret the same explicit memory policy. Keep old policy paths and default behavior unchanged. Source reachability/repeat-monitor findings are inherited limitations until a specific test/receipt establishes their coverage; do not call them a pass.

## Source responsibility map

| Capability | Primary owner | Relevant source seam | Planning implication |
|---|---|---|---|
| Authenticated mode, policy constants, caps, route names and allocation admission | strategy-lab contract | `packages/strategy-lab/src/league/lean-experiment.ts` | Add separate policy identity/types/caps/paths; preserve v14 constants and routes as historical. |
| Source admission, continuation and carry lineage, own accepted diagnostic join, startup witness, allocation/entry | correction orchestrator | `scripts/run-v1-38-lean-correction.ts` | New ordinals need concrete distinct successor-chain authentication, not a permissive ordinal regex. Require own accepted check and FINAL for baseline. |
| Parent baseline capacity, memory sampling, child fork, repeat parent guards/audits | baseline runner | `scripts/run-v1-38-lean-baseline.ts` | Every existing parent guard and child capacity gate must agree with new binding. Preserve inherited repeated admission/audit work. |
| Retained evidence admission and post-run resource assertions | correction retained reader and resource assertion helpers | `scripts/lib/v1-38-lean-correction-retained.ts` and callers in correction/baseline | Authenticate the explicit memory policy and maintain unchanged physical disk/retained/total checks. |
| Contract/behavior regression coverage | adjacent Vitest suites | `packages/strategy-lab/src/league/lean-experiment.test.ts`, `scripts/run-v1-38-lean-correction*.test.ts`, `scripts/run-v1-38-lean-baseline*.test.ts` | Test admission, lineage, source holds, parent/child and retained-reader agreement without Match/provider execution. |

## Recommended implementation contract

1. Define a new versioned successor family rather than altering `isLeanPostV13FivePairMode`, `LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION`, `LEAN_POST_V13_FIVE_PAIR_V14_CAPS`, or default `LEAN_CAPS`. Explicitly bind its approved memory ceiling, unchanged reserves, exact approved elapsed cap/deadline, and disk limits into content-addressed allocation/request/entry/evidence identity. Use only the four unused pair ordinals; reject unknown modes and all unbound/forged policy values.
2. Preserve chain integrity: successor ordinal 2 must authenticate the closed v14-1 carry (accepted diagnostic, terminal closure, all 36 charges, elapsed/disk history) and name its own source/review/data/helper/provenance roots. Later ordinals continue from their authentic predecessor and cannot reset charges, elapsed time, retained bytes, or unique attempt identity. Every diagnostic can enable only its matching baseline after its own accepted-check and FINAL join.
3. Trace and update every consumer of the limit: same-process capacity probe; parent and child precharge checks; aggregate live RSS calculation and refusal/kill sampling; report/owned-write guards where memory is sampled; `leanCapsForAllocation` or its successor policy lookup; retained-history readers and resource assertions; route setup/continuation validation; allocation and report readers. A memory-only threshold must never flow into `scratchBytes`, `bufferBytes`, physical disk high-water, retained bytes, or total disk arithmetic. Existing disk assertions stay at 2B scratch/12B retained/15B total, with prior retained bytes included.
4. Keep full accepted diagnostic/baseline authentication and source/HEAD holding. Do not skip parent or child repeated guards/audits, make a cache waiver, weaken source scope, start a provider before passing same-process capacity, or infer a native-memory cause from the prior RSS diagnosis.
5. Keep activation/proof prerequisites explicit: source/contract update, independent fixed-source review, fresh author/reviewer data and helper gates, new committed immutable allocation, empty 0700 store, same-process capacity success before charge/provider, held source/HEAD, and unique actual terminal verification. A passing unit test is not a route authorization.

## Required focused tests

Add deterministic source-only red/green tests using existing public contract surfaces and error conventions (do not invent a new entry API in the plan):

- New authenticated family accepts only its explicitly assigned unused ordinals; reject unknown modes, v14-2..5 old-family attempts, forged/altered binding, and any policy/root mismatch. Prove old v14-1 binding and ordinary allocations remain unchanged.
- Boundary table for aggregate RAM: values below and exactly `3000000000B` accepted if otherwise eligible; one byte above rejected. Verify the calculation includes parent + child + fixed external reserve + guard and covers both same-process capacity and ongoing guard decisions.
- Independent disk boundary: `2000000000B` scratch exact-boundary behavior matches existing policy; one byte above rejects. Confirm the new RAM ceiling cannot make scratch, retained, or total disk checks pass when they otherwise fail.
- Chain tests: authentic closed v14-1 carry accepted at successor ordinal 2; fabricated carry, missing one of the 36 charges, stale/mismatched FINAL, reused/consumed ordinal, skipped predecessor, altered source/HEAD, or accepted baseline before own accepted diagnostic are rejected. Verify later successor ordinals preserve the chain and cannot reset history.
- Time tests use the exact approved resume anchor and cumulative cap/deadline, ensure all elapsed wall remains charged, reserve remains 31 minutes, 600000ms Match headroom remains, and no reset/refund/idle exclusion occurs. Avoid system-time-dependent tests; inject supplied fixed observations in tests.
- Retained-reader/resource assertions accept the explicit prospective memory identity but continue to enforce unchanged disk accounting and full report/root/identity integrity.
- Negative route test proves source-only validation does not start an entry process, allocate/store a route, charge a Match, contact a provider, or create empirical credit.

## Validation architecture

Repository tests use Vitest (`pnpm exec vitest run ...`); package root declares Vitest and tests adjacent to these modules. Focused commands recommended:

```sh
pnpm exec vitest run packages/strategy-lab/src/league/lean-experiment.test.ts
pnpm exec vitest run scripts/run-v1-38-lean-correction.test.ts scripts/run-v1-38-lean-correction-bytes.test.ts scripts/run-v1-38-lean-baseline.test.ts
```

The current focused correction/baseline suites are `scripts/run-v1-38-lean-correction.test.ts`, `scripts/run-v1-38-lean-correction-bytes.test.ts`, and `scripts/run-v1-38-lean-baseline.test.ts`; `scripts/run-v1-38-lean-experiment.test.ts` is an additional broader suite. Run relevant suites after focused changes, then the repository's required validation workflow. Tests must be inert; do not invoke the consumed v14-1 route, a live Match/provider, or full historical scans as part of this bounded source assessment.

## Non-goals and constraints

- No external packages/tools or network research are needed; no package-legitimacy audit applies.
- Do not change game rules, Match/Strategy semantics, old allocations, old artifacts, canonical v14 policies, Phase state, helper/entry route, or time/disk limits outside the approved prospective values.
- No source-only test proves that a full accepted 36-Match baseline fits 3GB. If it fails again, preserve an honest `feasibility_not_established`/`gaps_found` outcome; no further bound increase, credit, freeze, holdout, formation, public/counting/production authority.
- Keep current-rules freeze before formation, sealed holdout unopened, and no public/counting/production authority. Historical larger-scale gates remain suspended/deferred as specified by current approved phase decisions.

## Project constraints

From `AGENTS.md`: keep engine pure/deterministic/serializable/side-effect free; never run hostile Strategy source in web/API or use Node `vm` as its security boundary; validate runtime boundaries with schemas; keep canonical Soldier/Match/Phase/Round/Activation/Cycle/Action/Advance/STONE/FALLEN/Chronicle terminology; submitted Strategy Revisions are immutable; public replay excludes source, StrategyMemory, SoldierMemory, and objective payloads by default. No engine/game-rule/UI changes are in this bounded task. Testing expectations require focused tests and distinguish strategy failures from system failures; replay/Match creation also requires board-realism and local browser checks, but this research proposes no Match or replay creation.

## Sources and confidence

- HIGH — `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-REPLACEMENT-WINDOW-APPROVAL-20261009.md`: adopted window, accounting, memory/disk/runtime bounds, four pairs and gates.
- HIGH — `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-MEMORY-AND-TIME-DECISION-v1.md`: rationale, prior limits and requirement not to bypass preserved audits.
- HIGH — `.planning/debug/v14-baseline-precharge-rss.md`: closed diagnosis, known source inference and explicit unknown causal operands.
- HIGH — `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-baseline.ts`, and `scripts/lib/v1-38-lean-correction-retained.ts`: existing v14 mode/cap/path/admission/carry/readers and resource guards.
- HIGH — `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md` and `265-16-PLAN.md`: active lean scope and test/phase boundaries; obsolete larger scale language remains superseded by approved lean dispositions.

**Confidence:** Policy values and current source topology HIGH; compatibility/fit of a new successor implementation MEDIUM until independently reviewed and tested; cause of prior native memory pressure and full-baseline feasibility LOW/unknown.
