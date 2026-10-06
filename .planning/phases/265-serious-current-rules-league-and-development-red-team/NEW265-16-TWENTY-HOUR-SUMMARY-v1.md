---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: twenty-hour-prospective-timebox-source-only
subsystem: private-strategy-lab-accounting
tags: [v8, prospective-timebox, source-only, tdd]
status: complete
scope: source_supplement_only
phase_complete: false
plan_16_complete: false
requirements-completed: []
requires:
  - phase: 265
    provides: Previously reviewed unstarted v8 retry routes and the exact approved twenty-hour supplement
provides:
  - Separately rooted opt-in twenty-hour timebox binding through existing v8 consumers
  - Connected inert producer/consumer regressions and a complete 904-entry source inventory
affects: [265-independent-source-gates, 265-fresh-main-empirical-gates]
tech-stack:
  added: []
  patterns: [exact-key additive authority, authenticated cumulative carry, immutable source handoff]
key-files:
  created:
    - NEW265-16-TWENTY-HOUR-SOURCE-INVENTORY-v1.json
    - NEW265-16-TWENTY-HOUR-SUMMARY-v1.md
  modified:
    - packages/strategy-lab/src/league/lean-experiment.ts
    - scripts/run-v1-38-lean-correction.ts
    - scripts/lib/v1-38-lean-correction-retained.ts
    - scripts/lib/v1-38-lean-baseline-source.ts
    - scripts/lib/v1-38-lean-baseline-retained.ts
    - scripts/lib/v1-38-lean-experiment-authority.ts
    - scripts/run-v1-38-lean-baseline.ts
    - scripts/run-v1-38-lean-baseline.test.ts
    - scripts/run-v1-38-lean-host-stage-v8.test.ts
    - scripts/run-v1-38-lean-retry-envelope-source-manifest.ts
key-decisions:
  - Preserve old v8 policy/carry and approval/plan bytes; authenticate one optional exact extension object at existing boundaries.
  - Reuse the unchanged v7 schedule validator internally, then bind the separately admitted prospective v8 cap and original predecessor.
  - Keep the pure baseline join helper contract; full allocation admission belongs to the actual baseline authority owner.
completed: 2026-10-06
duration: approximately 18 minutes
source_commit: 6cade0e237fe976051a71248f3f291166af3e769
author_agent: /root/execute_265_twenty_hour
independently_reviewed: false
empirical_authority: false
---

# Phase 265 Plan 16: Prospective twenty-hour source supplement

An exact opt-in v8 extension carries 56,000,917 ms from epoch 1,791,326,194,166 and selects 72,000,000 ms through setup/request/authorization, allocation, runner, retained closure, source publication, and conditional baseline authority. Legacy v8 remains 57,600,000 ms.

## Task commits

1. Task 1 RED — `fb418104`: failing connected extension regression (failed because the new extension did not exist).
2. Task 1 GREEN — `5ee48a1b`: prospective binding and connected actual-consumer regressions.
3. Task 2 source inventory producer — `6cade0e2`: complete extension-bound inventory and all three ordinal source roots.

The metadata-only inventory/summary commit is reported by the executor handoff. The inventory's source commit is the latest commit touching its source-member paths, so it remains stable across this metadata-only commit.

## Accomplishments

- Exact new approval/plan/schema/root/carry/start identity propagates through the existing ordinal layout. Wrong, missing, stale, or cross-root bindings cannot raise a legacy cap. Request admission also requires predecessor closure extension equality.
- Approved whole-turn elapsed floor is `56,000,917 + max(0, observedMs - 1,791,326,194,166)`. Setup uses the approved turn and event-custody source. Every subsequent setup/preparation/entry/gap/terminal/reader/closure consumer uses the selected binding.
- The actual standalone bounded parent authenticates the allocation-selected cap, refuses insufficient next-Match reserve before child creation, and uses that cap in sampling/deadline consumers. Connected inert tests cover admission, timeout, stale/missing/cross-root denial, and unchanged disk refusal.
- Actual accepted diagnostic check plus FINAL reader close remains mandatory at the selected baseline owner, source publisher, and runtime authority issuer. Extended accepted/refused/absent and zero-charge pre-entry closures are covered without native execution.
- Startup remains wire v7. 15,000,000,000 bytes, 300 cumulative Matches, 29 historical charges, guest/host/startup/Match ceilings, and the 1,860,000-ms reserve remain unchanged.

## Exact source handoff

- Extension root: `sha256:c9093818eca6b9a3967d8c4732871cb925b2880f48a971c7276e6800fd52e96a`.
- Approval raw root: `sha256:a60a562ea5697055e5f949c47234587c6c89109c9e97de0ddeb3f1e2109bf043`.
- Supplement plan raw root: `sha256:7c6438011ac1316ea78b00a77a78bedfc32075907277f6a2b6e78c948e9580d4`.
- New inventory: `NEW265-16-TWENTY-HOUR-SOURCE-INVENTORY-v1.json`, 904 unique entries.
- Inventory root: `sha256:0d24a57c1818b42b61ca963e12830974ce6e0af7986b3e88f195c586745d930d`.
- Ordinal 1: `sha256:9ba555e78f094004ea29229672d587f7d08a3ace06974d26219d61727a1441a6`.
- Ordinal 2: `sha256:8ead22da99076d1658b94a0d7d189527f06adca9499926dc8c1b0bfb3e46b441`.
- Ordinal 3: `sha256:66e342863528423a9bf1de7ada88b5339d75471eb2720784640b570203d38a20`.

The predecessor 901-entry inventory was not overwritten; its raw SHA-256 remains `287bdba44086249607cb061a522c0b4590262bf6f9eea16296670b58c92510b3`. Old v8 approval/plan/carry/policy source lines were compared byte-for-byte with `d7f104d5` and remain unchanged. No historical artifact, result, cache, sentinel, or old verifier was modified.

## Verification actually performed

- Planned nine-file focused run: 190 passed, one failed, across 191 tests / 9 files. The failure was the pure baseline-join contract described below.
- After the narrow fix, affected real ordinal-2 request and accepted-baseline consumers plus the selected baseline-join fixture: **8 passed**, 28 skipped, across two files. No repeated full historical gate was run.
- Actual standalone baseline-parent focused cases: **6 passed**, 23 skipped. The full baseline runner suite passed within the nine-file run.
- Configured lab typecheck: `node node_modules/typescript/bin/tsc -b packages/strategy-lab` passed, including after the final fix.
- Both correction and baseline shell syntax checks passed; `git diff --check` passed.
- Manifest CLI ran once against source commit `6cade0e2`; its exact full inventory is saved separately, not substituted by this summary.
- Read-only existence check at 2026-10-06T23:03:40Z confirmed all three v8 routes remain unstarted: no live request, setup witness, allocation, store, prepare-start, or run-start.

Tests used inert synthetic fixtures only. They establish no actual request/helper review, setup/allocation, live reader/capacity observation, runtime/provider/Strategy execution, Match, empirical result, accepted diagnostic check, or baseline authority.

## Deviations and issues encountered

**[Rule 1 - Bug] Preserve the pure selected-join helper contract.** Full allocation admission initially rejected an existing lightweight join fixture. Exact extension admission remains in the pure helper; full allocation admission was moved to the actual baseline authority owner. The eight affected regressions pass. This adds no scope or authority.

An earlier host-only run had one source-hold fixture failure while source edits were still in flight. The fixed-tree nine-file run superseded it; all host v8 tests passed there. A timer-spy ordering issue in the new inert parent test was corrected before that run.

## Deferred issues

A standalone, non-project-configured TypeScript invocation reported unchanged errors in `packages/strategy-lab/src/feasibility-protocol.ts:52` and `packages/strategy-lab/src/planner/missions.ts:52,60,66,68,69`. No unrelated fixes were made. It also exposed one introduced allocation-union narrowing error at the retained source-hold call; that call was corrected. The configured lab typecheck passes. The standalone invocation is not claimed as a passing full script typecheck.

## Known stubs

None added to production. Empty streams/maps and synthetic roots in tests are deliberately inert fixtures, not empirical data or accepted authority.

## MAIN-owned next gates

1. Independent review/fix against the final source/HEAD; regenerate and commit the inventory if source changes.
2. Serial validation and source verification against the final fixed identity. This executor performed no independent review.
3. Only afterward: fresh actual MAIN request/helper authorship, distinct-agent independent review, immutable allocation committed before unique MAIN entry, fresh empty real 0700 store, passing same-process capacity and all other approval gates.
4. At most three distinct fresh diagnostics; a failed diagnostic spends its own ordinal. A conditional fresh 36-cell baseline requires that diagnostic's actual accepted retained check and FINAL close. Stop at three unaccepted diagnostics, baseline failure, insufficient time/capacity, or a materially new human-only decision.

All current-turn planning/source/review/setup/run/check/replay time counts from the approved epoch. No reset, refund, retrocredit, or newly inferred idle exclusion is permitted. Historical peak disk/RSS remains unknown.

Plan 16, Phase 265, and all LEAG requirements remain incomplete. STATE/ROADMAP/REQUIREMENTS advancement and independent verification belong to MAIN and were not modified by this source-only executor.

## Self-Check: PASSED

All 904 saved inventory entries match current raw bytes; the inventory root reconstructs exactly. Both output files exist, and all three task commits exist. No tracked deletion occurred. The source-only completion does not advance Plan 16, the phase, or LEAG requirements.
