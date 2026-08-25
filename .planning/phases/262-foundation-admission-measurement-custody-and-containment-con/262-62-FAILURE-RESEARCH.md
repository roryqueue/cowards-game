# Plan 262-62 Pre-Review Failure — Successor Research

**Researched:** 2026-08-25  
**Status:** planning-only; no authority, route, review derivation, or live work authorized  
**Confidence:** HIGH (local Git, source, test, and planning artifacts inspected)

## Finding

The active R3 lifecycle guard is stale for the current repository state. Its implementation requires exactly 48 active plans and 43 summaries, then requires the entire lifecycle-path set and bytes to equal the fixed `3a63735…` baseline. [VERIFIED: codebase grep — `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:447-528`]

Plan 262-61 subsequently added its seven-line immutable custody summary in commit `ad5c57c9…`, making the current valid summary total 44. [VERIFIED: Git history — `git show ad5c57c9`; `262-61-SUMMARY.md`]

Plan 262-62 was then archived, not reviewed: commit `00187acb…` renamed the active plan to `archived/262-62-HISTORICAL.md`; its current SHA-256 is `438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a`. The archive therefore also makes the active-plan inventory 47 rather than R3's frozen 48. [VERIFIED: Git history and SHA-256 — `git show 00187acb`; `archived/262-62-HISTORICAL.md`]

The R3 test repeats the stale 43-summary assertion and calls the full review-capable module elsewhere in the suite. [VERIFIED: codebase grep — `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:338-348,1128-1144`]

No review-v3 JSON/report, authorization-v9, seal-v9, B9, route start, or live authority was created; `ADMIT-03` remains blocked at `0/540`. [VERIFIED: planning state — `.planning/ROADMAP.md:55`; `.planning/STATE.md:34-44`]

## Recommended Successor Scope

Create one fresh, non-authorizing lifecycle-reconciliation plan (a new Plan number; do not revive 262-62) with exactly these outputs:

1. A **new, lifecycle-only successor checker and focused test**, separate from frozen R3. It must not import or call `deriveV138Plan26261NoPublish`, route dispatch, publication, authorization, seal, runtime, provider, RSS, or Matrix code. [HIGH confidence recommendation]
2. A versioned, reviewable lifecycle contract with three explicit allowed states:
   - the current archived state: 47 active plans, 44 summaries, absent active `262-62-PLAN.md`, and the exact archived Plan-262-62 hash;
   - the fresh successor's pre-summary state; and
   - that same successor's post-summary state, where only its declared immutable summary carrier may be added. [HIGH confidence recommendation]
3. A strict immutable-prefix manifest for the R3 source commit, its reviewed source blobs, the committed 262-61 summary carrier, and the exact 262-62 archive/rename evidence; a separately declared extension entry binds the fresh successor's plan/summary paths, blob identities, graph edge, and allowed transition. [HIGH confidence recommendation]
4. An independently authored code-review/fix chain for the new checker. It may conclude only that the lifecycle contract is ready for a later review; it must set all execution, candidate, formation, holdout, public, production, and live authority fields to `false`. [VERIFIED constraint: `.planning/STATE.md:22,42`; HIGH confidence recommendation]

The successor must validate exact membership and ordered graph identities, not merely replace `43` with `44`. The current function's baseline equality caught substitutions and rewrite-then-restore history; the new contract should retain those protections while allowing only the declared archive transition and the one declared successor summary transition. [VERIFIED: code/test — `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:485-528`; `…test.ts:1222-1255`]

## Immutable Constraints

| Item | Required treatment |
|---|---|
| A9 | Read-only historical/source identity; no edit, rebasing, new commit attribution, or reinterpretation. [VERIFIED: archived Plan 262-62 frontmatter/prohibitions] |
| R3 checker and R3 test | Preserve their committed bytes and historic meaning. Do not patch the `43` assertion in place or represent a successor result as R3. [VERIFIED: current R3 source/test] |
| Plan 262-62 archive | Keep only at `archived/262-62-HISTORICAL.md`, byte-identical at the recorded SHA-256; do not restore an active 262-62 plan. [VERIFIED: `.planning/ROADMAP.md:55`; `.planning/STATE.md:42`]
| Plan 262-61 summary | Treat its committed carrier as a valid prior lifecycle event, not a defect to delete or rewrite. [VERIFIED: `ad5c57c9…`; `262-61-SUMMARY.md`]
| Status/authority | Keep `review_v3_root: null`, `ADMIT-03: blocked`, `fresh_accepted: 0`, and all downstream authorization booleans false. [VERIFIED: `.planning/STATE.md:22,42,44`]

## Test and Verification Strategy

The correction plan should run only a narrow, serialized successor-lifecycle test and static Git/file checks. The test matrix must include:

- exact recognition of the archived 47-plan/44-summary state;
- rejection of an extra active plan, unknown summary, substituted plan/summary pair, changed immutable-prefix byte, changed archive byte, unexpected archive removal, and rewrite-then-restore history;
- acceptance only of the named fresh-plan pending state and its named post-summary transition;
- proof that no canonical review/report destination exists before and after the focused test; and
- static source scan proving the successor module contains no route/authority/derive imports or command strings. [HIGH confidence recommendation]

Do **not** run the existing full R3 Vitest file during correction work: it intentionally exercises `deriveV138Plan26261NoPublish` and route-dispatch code, and it is currently expected to fail its stale lifecycle assertion. [VERIFIED: `…test.ts:1128-1144`; `…ts:2521-2530`]

After the reconciliation plan is committed and independently reviewed, later planning may create a separately named reviewer (for example, R4) whose own source, test baseline, author receipt, and independent-review chain are new. That later reviewer must not claim that it is R3 or that R3's stale full suite passed. [HIGH confidence recommendation]

## Risks and Controls

| Risk | Control |
|---|---|
| A blind `43 → 44` edit masks the archived-plan mismatch and weakens substitution detection. | Replace count-only checking with exact versioned state membership, immutable prefix, and bounded transitions. |
| Editing R3 retroactively changes reviewed evidence. | Leave R3/R3 tests untouched; add a distinct successor module and review chain. |
| A correction accidentally triggers review derivation or creates authority. | Keep the module lifecycle-only; fail CI on any derive/route/authority import or destination write; leave all authority fields false. |
| A future reviewer mistakes the archive for a valid R3 review result. | Require archive hash/path and explicit `pre_review_failed_archived`; require a fresh reviewer identity and fresh independent review later. |
| The new successor's own summary makes another stale count. | Model pending and completed states explicitly, with the sole allowed summary transition bound to its carrier. |

## Exact No-Go Boundaries

- Do not restore, rewrite, rename again, or summarize archived Plan 262-62.
- Do not modify A9, R3, the R3 test, 262-61 summary/review/fix carriers, or historical artifacts.
- Do not invoke `--derive-no-publish`, route dispatch, route start, authorization/seal/B9 generation, RSS sampling, Strategy/runtime/provider/Matrix execution, or any live work.
- Do not publish a review-v3 document/report or imply that a review occurred.
- Do not change `ADMIT-03`, accepted-cell counts, candidate-search/Phase-263/formation/holdout/public/activation/production status, or rule/product behavior.

## Planning Decision

**Recommended:** plan a fresh, additive, lifecycle-only reconciliation followed by a later independently reviewed successor reviewer. This is the smallest repair that preserves the historical evidence boundary, fails closed on unrecognized future drift, and avoids treating a stale R3 fixture as authority.

## Evidence Consulted

- `.planning/ROADMAP.md` — current pre-review failure and successor instruction.
- `.planning/STATE.md` — 44 trustworthy summaries, archive hash, and all authority denials.
- `archived/262-62-HISTORICAL.md` — immutable prior plan and its locked prohibitions.
- `262-61-SUMMARY.md`, `262-61-REVIEW-FIX.md`, `262-61-CODE-REVIEW.md` — R3 custody/convergence context.
- `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts` and `.test.ts` — stale lifecycle implementation and test coverage.
