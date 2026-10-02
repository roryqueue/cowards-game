---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
reviewed: 2026-10-02T15:41:13Z
depth: standard
reviewed_commit: 2d0462fb8ba59e4b599ca110a7d89991357f7ac9
checkout_head: 1a228dadbf999cbd2b9da5b07f91c8b415eeb88e
diff_base: 47ad36506bec2c60842baa7f596286833b25ba9c
diff_sha256: fbfc02c070530c2b345a74bd0d958bcf9c8f3d4d1f020c3a508f7cb8a019b0c6
files_reviewed: 11
files_reviewed_list:
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-league-prospective-lifetime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
source_acceptance: pending-fixes-and-final-source-gates
empirical_requirements_complete: false
---

# Phase 265 Plan 07: Prospective Lifetime Code Review

## Narrative Findings (AI reviewer)

Standard adversarial review of the eleven submitted source/test files and relevant private host, tactical authoring, inventory, journal and retained-reader dependencies. Two BLOCKERs and one WARNING require bounded source/test corrections. This report concerns the exact submitted source above, not later fixes.

Read AGENTS.md, the current STATE continuation, complete human lifetime approval, and the supplement plan/check/handoff sections relevant to this change. No project-local `.codex/skills/` or `.agents/skills/` directory exists. No structural pre-pass was supplied. Scope is the approved prospective private elapsed increase only; this review does not introduce resource decisions, a new plan, signing/custody work or another human checkpoint.

## Critical Issues

### CR-01: Prospective-v2 silently disables existing tactical adaptation

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:743` and `:1150`; dependency `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-tactical-corpus.ts:159`; authoring consumers `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-authoring.ts:106`, `:170`, `:183`.

**Issue:** The allocation union now admits prospective-v2, but `isProspectiveTacticalJob` still requires `schemaVersion === "league-prospective-execution-allocation-v1"`. Consequently it returns false for all v2 tactical development jobs at ordinals 0/3/6. The runner skips current-target tactical corpus formation, authoring skips `deriveTacticalAdaptationProfile` and `emitProfiledTacticalFactoryPacket`, and retained authoring/runner verification skips their corresponding target/corpus/envelope joins. V2 instead runs the unchanged base tactical request. This changes the experimental producer behavior, not just elapsed admission, and can survive retained verification because the same stale predicate is shared by producer and reader. Allocation producer admission permits the immutable base request at preflight, so it does not independently catch this substitution.

**Fix:** Generalize this transitive dependency to the shared prospective predicate after existing strict allocation admission. Keep legacy non-prospective behavior unchanged:

```ts
import { isProspectiveLeagueExecutionAllocation } from "../../packages/strategy-lab/src/league/allocation.js"

export const isProspectiveTacticalJob = (allocation: AdmittedLeagueExecutionAllocation, job: LeagueResponseJob): boolean =>
  isProspectiveLeagueExecutionAllocation(allocation) &&
  job.evaluationRole === "development_response" &&
  [0, 3, 6].includes(allocation.rounds.flatMap((round) => round.jobs).findIndex((row) => row.id === job.id))
```

**Focused regression:** Admitted v1 and v2 both select exactly the same three tactical jobs; legacy allocation and non-tactical/evaluation jobs remain false. Traverse the existing injected authoring/retained tactical seam with v2, asserting profiled producer/envelope/corpus identity and rejection of missing/crossed adaptation data. No real provider or Match is needed. Include this dependency's corrected bytes in the existing conservative source manifest and final fixed-source gates.

**Related scan:** One read-only `rg` scan of production `scripts/` and `packages/strategy-lab/src/` for both v1 discriminators found this as the only remaining stale prospective-v1-only consumer. Other matches are deliberately preserved v1 schema/readers and explicit matching-version preparation.

### CR-02: Inherited constructor override bypasses prospective empirical restriction

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-factory-supervised-runtime.ts:60`, `:73`, `:85`.

**Issue:** The new prospective guard uses `hasOwnProperty("createRuntime")`, but subsequent constructor selection uses `options.createRuntime`, which includes prototype lookup. With otherwise valid own options and an empirical issued authority, `Object.assign(Object.create({ createRuntime: injected }), validOptions)` bypasses line 60 and reaches the injected constructor at line 85. A replacement can return the checked source/image/budget/attempt identity without constructing the reviewed planner or claiming its once-only layer. The factory then accepts it at lines 88–89. This defeats the explicit prospective empirical no-constructor-override restriction and both-clock composition guarantee. This is a private options-boundary defect; no public exploit route or hostile Strategy access to the host is asserted.

**Fix:** Reject presence anywhere on the prototype chain on the empirical prospective branch, before reading the constructor or source; retain the deliberate injected-fixture seam:

```ts
"createRuntime" in supplied &&
  (!options.prospectiveLifetimeAuthority ||
   !isProspectiveLeagueLifetimeFixture(options.prospectiveLifetimeAuthority))
```

Use that expression in place of the own-property portion of the existing guard. Do not broaden ordinary/benchmark/diagnostic resource semantics.

**Focused regression:** An empirical-issued test-only authority plus inherited constructor function, inherited `undefined`, and inherited accessor must fail `PROSPECTIVE_CONSTRUCTOR_OVERRIDE` before source/accessor/default-planner/injected-constructor calls. Assert all counters remain zero and the authority's factory claim is unconsumed. Keep the allowed fixture constructor test and valid once-only nested claims. Existing source fixtures/mocks suffice; never open a real container.

## Warnings

### WR-01: Response lifetime regression reproduces intended wiring without exercising it

**Classification:** WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.test.ts:102-119`; production branch `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.ts:195-202`.

**Issue:** The new response score/self-play test manually synthesizes `response-match-start`, chooses attempt roots, and calls issuance/claims itself. It never calls `produceLeagueResponse`. The enumeration test also does not construct response providers. Therefore removing lifetime options from the actual response constructor, swapping actual measured/opposing attempt roots, or issuing before retention leaves both new tests green. Existing production-response integration cases use legacy allocation, so they do not exercise the new v2 branch either. The helper tests are useful, but they do not protect the claimed response host wiring.

**Fix:** Add a bounded v2 integration regression through `produceLeagueResponse` with injected author/run/host/retention seams. Capture actual provider requests after `response-match-start` returns; assert the returned charge root, correct measured red-team versus opponent charge attempt root, distinct seats in equal-source self-play, exact 600000 options and both once-only claims. Exercise score and both independence purposes with both sides. Stop synthetically after the relevant captures to avoid a large retained schedule; preserve the separate 72-condition enumeration assertion. Assert zero provider construction after a refused retention append and ensure changing/removing the production lifetime wiring would fail the regression.

## Review boundaries and remaining acceptance

The new allocation path compares the exact v2 policy, projects only elapsed duration back through unchanged v1 validators, and retains legacy/v1 discriminators and root domains. Capacity version selection still re-admits the matching allocation; six-category formula, tactical floors, logical/physical margins, receipt age and process headroom remain unchanged. Preparation, reservation, capacity, CLI and bounded retained paths were traced; the missing tactical selector is CR-01, not grounds to relax any gate.

The WeakMap-issued handle preserves independent once-only factory/planner claims and binding to source/attempt/Match/container identities. Main issuance follows retained cell start; response issuance follows response-match-start and preserves distinct measured/opposing attempts. Factory's pre/post elapsed checks and planner's pre-invocation check retain their existing meanings; nested setup and awaited retention continue to consume absolute elapsed time. Ordinary 120000 defaults, diagnostic-v4 240000 and benchmark 3600000 admission were inspected, not changed. None of these observations cancels the constructor leak or missing production regression.

The implementation handoff reports focused GREEN session 40355 (23 passing tests) and production types session 48446. This reviewer did not rerun them or launch any full suite. They are prior executor observations, not independent review acceptance. The full eight-command final-source gate remains pending and must follow fixes. No capacity observation, empirical allocation, model, provider, Match, active entry or retained verifier was launched. No LEAG/freeze/holdout/formation/public/counted/production credit is conferred.

Only this new report was written; no source, historical report/evidence or commit was modified by the reviewer. Existing unrelated untracked entries were preserved. A local Write tool was unavailable, so the report was created with the available patch tool, without shell writes.

## Exact reviewed file pins

SHA-256 of source bytes at reviewed commit 2d0462fb; the eleven worktree files matched that commit when pins were taken. The diff SHA above hashes the explicit eleven-file `git diff 47ad3650..2d0462fb` output.

| File | SHA-256 |
|---|---|
| packages/strategy-lab/src/league/allocation.ts | 02d3800a2078b5eebc4a7015f7cb036ed392441e011581454e257f40b72d72f4 |
| packages/strategy-lab/src/league/allocation.test.ts | 89e6da6f6ad2303d6146a43938a770955c1f810e01bb94c9a3d0e8032c781c9a |
| scripts/lib/v1-38-factory-supervised-runtime.ts | 63b16071176894f9f482057a3e16cafa649c52dc563261d6544f577969997f81 |
| scripts/lib/v1-38-factory-supervised-runtime.test.ts | c5e6294e9aa6423f41748972972b9d2a44caacbb7b92b5a9f0e1112b07a246dd |
| scripts/lib/v1-38-league-prospective-lifetime.ts | 9c6a5363c1953fb7273ba90e2e750cab6856b4725495dbca36cf8734d5f2b3b1 |
| scripts/lib/v1-38-planner-supervised-runtime.ts | fcfbbfe995c41286d04e4ef5d407455db9ea6174e5bdac55bdc85fca6367d800 |
| scripts/lib/v1-38-planner-supervised-runtime.test.ts | 2209d644d2393a06f7176e395a848c3fe1d0da6d20ab66cd2f9a8675ca90adfc |
| scripts/lib/v1-38-league-response-runtime.ts | 0b1468c336b8c02d6e28217e7a5d9d1853bd69b7fb2e1db705014a54897d48f9 |
| scripts/lib/v1-38-league-response-runtime.test.ts | 67c8d460d14c1064f3aaa7c647b6201436637fbb08edf083a725583d74334381 |
| scripts/run-v1-38-serious-league.ts | 5f192488fb69b214fa29828547071bdab4c3745bacfb14742c5549489e073815 |
| scripts/run-v1-38-serious-league.test.ts | d0be81935b06ca28ec0578f640727978d4e193a37c5f24ebdb7a435290991f41 |

Relevant transitive dependency pins: `scripts/lib/v1-38-league-tactical-corpus.ts` = `bbbc4ad7a6d9e980c326a8f6e83c7a8042e77317a55273cb384edc1a188fa178`; `scripts/lib/v1-38-league-authoring.ts` = `d990d8d264d9e7e3cc18270e21bfedd4d919e10042b39e346eb43945a4c198e4`. These contextual dependencies were not part of the original eleven-file diff. Any corrective source change invalidates this review's acceptance applicability and requires fixed-source re-review/gates.

_Reviewer: independent gsd-code-reviewer; no commit._
