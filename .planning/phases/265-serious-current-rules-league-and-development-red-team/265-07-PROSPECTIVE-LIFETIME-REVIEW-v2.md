---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: prospective-lifetime-v1
reviewed: 2026-10-02T16:08:40Z
depth: standard
reviewed_commit: bb98878ec996ec63529093a45d9e55ed89e64610
checkout_head: a929d2ab2d9a9cbfafb46b01d42c8868158c78ba
diff_base: 47ad36506bec2c60842baa7f596286833b25ba9c
diff_sha256: b860d619ffb8a6c6c7df71181c7d49d675de8eda867822e5a812f8c50d5b0916
implementation_root: sha256:d6872b1615cf06c1f7c667d5e58d7ddddfb96e1f296a84a52c5cab7df4a1bf33
source_root: sha256:e64686c2c927a5a0f54d786198df2149c215f8e9e7eab71284b36a1cdcece0ed
files_reviewed: 13
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
  - scripts/lib/v1-38-league-tactical-corpus.ts
  - scripts/lib/v1-38-league-tactical-corpus.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
source_acceptance: pending-final-fixed-source-gates
empirical_requirements_complete: false
---

# Phase 265 Plan 07: Prospective Lifetime Re-review

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING identified in the cumulative thirteen-file supplement at `bb98878ec996ec63529093a45d9e55ed89e64610`. Standard adversarial review covered every listed source/test file, the cumulative diff from `47ad36506bec2c60842baa7f596286833b25ba9c`, and relevant authoring, provider, source-inventory, capacity, reservation and retained-reader call sites. This is a scoped source review, not a broad historical audit or empirical success claim.

Read `AGENTS.md`, the current STATE continuation, the human approval dated 2026-10-02, the supplement plan v1, prior review v1, and completed fix report v1. The GSD code-review skill supplied the review/report contract. No project-local `.codex/skills/` or `.agents/skills/` directory or `.codexignore` exists; none of the thirteen files is Git-ignored. No structural pre-pass was supplied.

## Prior finding disposition

### CR-01 — resolved: tactical adaptation and retained authoring

`scripts/lib/v1-38-league-tactical-corpus.ts:159` now uses `isProspectiveLeagueExecutionAllocation`, selecting both admitted prospective versions and preserving development-only ordinals 0/3/6. Legacy, evaluation jobs and non-jobs remain excluded. The runner's corpus formation at `scripts/run-v1-38-serious-league.ts:740` and retained tactical checks at `:1159`, plus actual authoring/profile emission and retained envelope/selection checks in `scripts/lib/v1-38-league-authoring.ts:106` and `:183`, now take the same v2 path.

The new regression at `scripts/lib/v1-38-league-tactical-corpus.test.ts:75` calls actual authoring and retained verification using inert recorded-kernel data. It asserts profiled producer identity, 100 selected rows, source/profile/envelope joins, and rejection of missing/crossed target, corpus and envelope data. The separate selector test at `:65` compares v1/v2 against legacy and non-tactical cases. The corrected production dependency is present in the existing conservative implementation/source manifest. A production discriminator scan finds only intentional v1 schema/admission definitions, explicit matching-version preparation and v2-specific lifetime/retained checks; no remaining stale v1-only consumer was found in this closure.

### CR-02 — resolved: inherited constructor override

`scripts/lib/v1-38-factory-supervised-runtime.ts:60` checks `"createRuntime" in supplied`, rejecting own or inherited constructor presence on the empirical prospective path before source access, revision construction or constructor lookup. The fixture exception uses the issued WeakMap classification, not a caller-controlled label on the authority. Inherited benchmark, observer, transport, stream and diagnostic-option presence is also denied on that branch. The response fix introduces no constructor-override option.

The empirical-issued unit cases at `scripts/lib/v1-38-factory-supervised-runtime.test.ts:64` cover inherited function, `undefined` and accessor values. They assert zero source/getter, injected-constructor and default-planner calls, then successfully claim the same authority at both layers, proving refusal did not consume either claim. The admission classification mock is confined to issuing the test-only empirical handle and restored before construction; issuance and claims remain the real implementation. Allowed fixture construction, crossed/copied/forged authority rejection, factory-before-planner order and once-only claims remain covered.

### WR-01 — resolved: actual response wiring regression

`scripts/lib/v1-38-league-response-runtime.ts:203` constructs one runtime-options object for both the real factory and existing fixture host. The fixture adds only its pre-existing executable-root request field. The real branch still invokes `createFactorySupervisedRuntime`, which threads the issued authority into the nested planner. `produceLeagueResponse` still rejects any fixture on empirical allocation at `:147`; the new factoring cannot turn the test seam into empirical override authority.

The added test at `scripts/lib/v1-38-league-response-runtime.test.ts:145` invokes actual `produceLeagueResponse`. It stops synthetically at the tenth pre-dispatch check after nine cells/18 mock-provider captures. Captures verify the returned retained Match-charge root, measured red-team attempt versus opposing charge attempt, both sides, score and both independence purposes, distinct seats/handles in equal-source self-play, source/admission/runtime/Match/container bindings, exact 600000-ms options, and both once-only layer claims. The refused `response-match-start` append case proves zero provider construction, runs and closes. The independent 72-condition enumeration assertion remains. These assertions protect actual production wiring instead of only reproducing the intended helper calls.

## Cumulative policy and boundary checks

- `allocation.ts:176-209` admits a separately rooted prospective-v2 policy with exactly 600000-ms per-Match elapsed lifetime. It compares the entire exact policy and projects only that elapsed dimension through unchanged v1 validators. Legacy and prospective-v1 remain 120000-ms policies with their original domains and meanings; no historical allocation is upgraded or reclassified.
- All other policy dimensions remain unchanged: 96-hour overall stop, 18-hour attempt cap, 24800 provider invocations, 1000-ms guest method timeout, 2 CPU/256m runtime, disabled cache, source/output/objective/memory limits, eleven attempts/zero retries, Match/opportunity/schedule/probe/selection bounds, artifact/terminal budgets, durability barriers, cleanup and privacy/holdout/formation gates. The helper issues only v2 handles; an unissued scalar or forged/crossed/copied handle cannot select the new lifetime.
- Main providers are issued only after `recordLeagueCellStart` and graph `cell-start` retention (`run-v1-38-serious-league.ts:465-482`). Response providers are issued after the returned `response-match-start` retention (`v1-38-league-response-runtime.ts:182-205`). Both seats retain their existing attempt identities, including reversed main construction order and response self-play. Factory admission consumes its independent claim before the real planner consumes its claim.
- Factory begins before nested runtime setup, retains pre/post-invocation expiry checks and closes at the boundary. Planner begins before session setup and retains its existing pre-invocation elapsed check. Awaited evidence retention and between-invocation time remain part of absolute elapsed time; neither clock resets. Ordinary 120000 defaults, diagnostic-v4 240000 and the planner's distinct benchmark/3600000 scalar admission semantics remain unchanged.
- Preparation explicitly dispatches on amendment version and rejects unknown versions. Initial-base qualification, static source/producer validation, fresh same-process capacity admission, supplied-receipt no-refresh behavior, allocation-only exclusive reservation, CLI alternatives and per-dispatch/invocation headroom guards apply to both prospective versions. Six-category costs, tactical capacity floors, physical/logical margins, receipt age and process headroom are unchanged.
- Retained v2 validation checks current implementation/source roots, matching capacity/allocation/amendment roots, once-used reservation and provider identities, with the existing bounded journal/graph and tactical authoring readers. The v2 current-source check is not applied retroactively to legacy/v1 history. The source inventory naturally includes allocation, the new helper, both supervisors, runner, response, tactical corpus and authoring; no exclusion or mutable historical root was added.

## Verification and remaining acceptance

Independently performed here: source/diff inspection; `git diff --check 47ad3650..bb98878e`; exact worktree-versus-reviewed-commit comparison for all thirteen files; raw SHA-256 pins; and read-only invocation of the existing source-manifest derivation. Both Git checks passed. The manifest invocation only read source/configuration; it launched no capacity observation or runtime.

The fix report records focused GREEN sessions 66692 (tactical), 73198 (restored regressions), 44083 (response and production strict types), and defect-restoration RED session 72814 with expected failures. Those are prior fixer observations, not tests rerun by this reviewer. Inspection found no concrete ambiguity requiring another run. The unique full fixed-source gate and applicable scoped regressions/build remain PENDING for the root workflow. `status: clean` describes this review's zero findings, not completed source acceptance.

No full suite, provider, model, Docker/container, Strategy execution, capacity observation, empirical allocation/Match, entry or retained verifier was launched. No LEAG, freeze, phase completion, holdout, formation, public, counted or production credit is conferred. No new numbered plan, certification/custody work, resource decision or human checkpoint is introduced.

## Exact reviewed file pins

Every listed worktree file matched `bb98878e` when pinned. The diff SHA hashes `git diff 47ad3650..bb98878e -- packages scripts`, whose changed-file scope is exactly the thirteen files below. Checkout `a929d2ab` adds planning documentation, not different reviewed source bytes.

| File | SHA-256 |
|---|---|
| packages/strategy-lab/src/league/allocation.ts | 02d3800a2078b5eebc4a7015f7cb036ed392441e011581454e257f40b72d72f4 |
| packages/strategy-lab/src/league/allocation.test.ts | 89e6da6f6ad2303d6146a43938a770955c1f810e01bb94c9a3d0e8032c781c9a |
| scripts/lib/v1-38-factory-supervised-runtime.ts | c7841584d1af7208cb4cdca7c5b13eb8a7905393a8a4bb4734e558a94ae8f98e |
| scripts/lib/v1-38-factory-supervised-runtime.test.ts | 492dbd9465e7ba044962a1e6058e291536ae057272cb232cdc4082758aed9999 |
| scripts/lib/v1-38-league-prospective-lifetime.ts | 9c6a5363c1953fb7273ba90e2e750cab6856b4725495dbca36cf8734d5f2b3b1 |
| scripts/lib/v1-38-planner-supervised-runtime.ts | fcfbbfe995c41286d04e4ef5d407455db9ea6174e5bdac55bdc85fca6367d800 |
| scripts/lib/v1-38-planner-supervised-runtime.test.ts | 2209d644d2393a06f7176e395a848c3fe1d0da6d20ab66cd2f9a8675ca90adfc |
| scripts/lib/v1-38-league-response-runtime.ts | 9af46765615524a6d741b0e886f9bbc002eb96cf7312ede7d333b92de9c9cac9 |
| scripts/lib/v1-38-league-response-runtime.test.ts | bbb139ce2c4cb3fe4b053ed75f3cd62323ee793935abfadabb3179de6571767d |
| scripts/lib/v1-38-league-tactical-corpus.ts | 9c618294fd85ddc54800ddb4c4897820b3a83e50581943e1996dd9a930e2945c |
| scripts/lib/v1-38-league-tactical-corpus.test.ts | 66bfdd80111290cbff83ed0573cb3baf901ebbf4dba527a1fcf65dbe82a4ac27 |
| scripts/run-v1-38-serious-league.ts | 5f192488fb69b214fa29828547071bdab4c3745bacfb14742c5549489e073815 |
| scripts/run-v1-38-serious-league.test.ts | d0be81935b06ca28ec0578f640727978d4e193a37c5f24ebdb7a435290991f41 |

Context dependency pins: `scripts/lib/v1-38-league-authoring.ts` = `d990d8d264d9e7e3cc18270e21bfedd4d919e10042b39e346eb43945a4c198e4`; `scripts/v1-38-factory-implementation.ts` = `e72a107de64f573b58723797ab559b1c293623e21036f65c1b9634e173ad389f`.

Only this new review report was written; prior reports, source and unrelated untracked files were preserved. No commit was made. A local Write tool is unavailable; the available patch tool created the report without shell writes. Any later corrective production change requires review/gates on its new source identity.

_Reviewer: independent gsd-code-reviewer; standard depth; no commit._
