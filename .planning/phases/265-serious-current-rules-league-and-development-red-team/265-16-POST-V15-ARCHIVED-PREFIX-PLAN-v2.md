---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: post-v15-archived-prefix-v2
type: execute
wave: 14
depends_on: [265-16-POST-V15-CHECKPOINT-REPAIR]
execution_owner: source_only_ROOT_scheduled
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
files_modified:
  - scripts/lib/v1-38-lean-resource-window-v15.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-resource-window-v15.test.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - packages/strategy-lab/src/league/lean-resource-window-v15.test.ts
must_haves:
  truths:
    - The exact 11-record pin inventory is read-only verified before coding and then represented as source-controlled raw-byte and canonical-object roots; cost-only predecessor preserves refused outcome, current 1/cumulative 37, elapsed/debit and survivor floors.
    - The distinct `fresh_synchronous_checkpoint_observation_v15` contract is selected only for v15-3 and is bound to exact call-chain semantics, current source root, and a fresh independent v4 review receipt.
    - v15-2 refusal, prior v14-1 accepted contract, legacy/default behavior and v15-4/5 dormant refusal remain unchanged; none of the new history can authorize a route.
    - All report paths are finite; plans/checks/research/pins/timing decision are source inputs, and generated reports plus selected review are excluded only from functional hash while remaining in physical debit.
  artifacts:
    - path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md
      provides: exact raw-byte digests, canonical pin roots, embedded roots and field roles for the refused prefix
    - path: scripts/lib/v1-38-lean-resource-window-v15.ts
      provides: additive v15-3 cost-only raw-prefix authenticator and v15-3-only distinction join
    - path: scripts/run-v1-38-lean-resource-window-v15.test.ts
      provides: actual reader/producer/consumer fixture matrix for pin custody, source review, mode selection and authority refusal
    - path: packages/strategy-lab/src/league/lean-experiment.ts
      provides: exact finite report inventory and no-refund accounting for every listed path
  key_links:
    - from: exact 11-path raw pin inventory
      to: cost-only predecessor
      via: SHA-256 of exact bytes, fixed canonical pin root domain, schema embedded-root validation where present, exact field-role joins
    - from: v15-3 actual checkpoint call chain
      to: v15-3 continuation and request consumer
      via: `fresh_synchronous_checkpoint_observation_v15` semantic predicate plus exact current source root and selected v4 raw report root
    - from: report inventory
      to: source manifest and physical debit
      via: explicit path list, pre-source report ordering, exact cyclic hash exclusions, all output blocks still charged
---

<objective>
Add an additive v15-3-only contract representing the immutable refused v15-2 37-charge prefix as cost-only custody and bind it to the concrete checked checkpoint-repair semantics and a fresh independent review.

Purpose: Resolve the documented source dependency without relaxing historical acceptance, changing old artifacts, or granting route authority.
Output: Exact pin verification, cost-only predecessor schema, concrete semantic distinction/review join, adversarial consumer tests, finite source/physical inventory.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
@/Users/roryquinlan/.codex/gsd-core/templates/summary.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-CHECKPOINT-REPAIR-PLAN-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-CHECKPOINT-REPAIR-SOURCE-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v3.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v1.md
@scripts/lib/v1-38-lean-resource-window-v15.ts
@scripts/run-v1-38-lean-correction.ts
</context>

<fixed_constraints>
The exact raw inventory and field-role map is `265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md`. Before any implementation, independently recompute every listed raw SHA-256 and `canonical_pin_root` using the fixed domain `lean-resource-window-archived-v15-2-pin-v1`; recompute each existing embedded `labRoot(schemaVersion, record_without_root)` where shown. Any mismatch/unavailable path stops this source plan and is reported; never refresh a pin, discover substitutes, use wildcard scans, or invoke an old reader/authenticator. The request/entry/child-terminal records have no embedded root; their complete canonical pin root is required. Field values must be read through the explicit role map only, excluding private error strings, Strategy/source payloads, compressed/IO material.

v15-2 remains refused: ROOT 73583 closed 0, ordinary reader 58084 closed 1/refused, current charge 1/cumulative 37. Preserve elapsed/debit/survivor costs, refused ROOT closure, ordinary refusal, and separate operator-error hold-refusal. The extra hold-refusal is never a hold authenticator. No reruns/refunds/acceptance promotion and no claim about the initiating throw.

The failed v15-2 functional source baseline is commit `7250223f67620ccc274a3a2fc80d099718ea58ea`, source root `sha256:2d499dc06ae7a95b12c11c4d96a0ce8f0033e20fcaaf8a484b5279c86215059e` / 950 entries. The completed checkpoint repair is commit `47425b37ee8d4a9ebdf0851667689d6d5ec0713e`, root `sha256:6f843d8614f3397403e613367cf751e89032dd8cc28b0fe5e322a679fd513742` / 955 entries; this is repair evidence but is NOT the failed-source comparison base. The exact v3 review is historical baseline evidence only; it reviews that completed repair identity, not this successor. New selected review is exactly `265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v4.md`, generated independently only after final source commit/root. Preserve existing strict source-review frontmatter: exact `source_commit`, `source_root`, `source_entries`, `diff_base`, `author_agent`, `reviewer_agent`, `independently_reviewed: true`, `files_reviewed`, `files_reviewed_list`, `findings_open: 0`, and `status: clean`; reviewer must pass the existing independent-reviewer allowlist. `reviewRoot` is SHA-256 of exact v4 bytes. The v4 narrative explicitly compares failed base `7250223f...` with current source and attests actual callback invariants plus connected-test evidence for the distinction. The runtime consumer checks exact selected path, raw receipt root, source root/manifest and commit joins; it does not parse arbitrary source text or pretend an AST diff proves semantic correctness. Reject self-review, stale v3, wrong actor, root drift, open findings, or mismatched paths.

The exact semantic distinction is `fresh_synchronous_checkpoint_observation_v15`: in the selected v15 correction child, every pre- and post-`native.invoke` checkpoint synchronously obtains a new invocation-local observation through `checkpoint-observation-v15.ts`; the actual prefix/correction/disk guards consume the same fresh measured operands and projection; no observation object crosses a checkpoint or await; the closure-local monotone high-water scalar is not reused as a later measurement. The distinction does NOT claim a measured speedup or explain the earlier failure. Review v4 compares failed source base `7250223f...` (not repair commit `47425b37...`) and inspects selector/callsites/guard operands and connected tests across exactly eight paths: `scripts/run-v1-38-lean-correction.ts`, `scripts/run-v1-38-lean-baseline.ts`, `scripts/lib/v1-38-lean-checkpoint-observation-v15.ts`, `scripts/run-v1-38-lean-checkpoint-observation-v15.test.ts`, `packages/strategy-lab/src/league/lean-experiment.ts`, `scripts/lib/v1-38-lean-resource-window-v15.ts`, `scripts/run-v1-38-lean-resource-window-v15.test.ts`, `packages/strategy-lab/src/league/lean-resource-window-v15.test.ts`. The v3 review is not a substitute.

Budget and authority: hard stop 2026-10-09T18:38:33Z, fixed cap 223171903 ms, reserve 1860000 ms, anchor 1791455941097 plus fixed 108000000 ms floor. The entry cutoff 17:57:33 UTC is CLOSED at the supplied 17:58 UTC. Pending `265-16-POST-V15-TIMING-DECISION-v1.md` proposes extra eight hours or inconclusive closure but is NOT approved. No route, preparation, conditional data/helper, authorization, allocation, store, capacity, provider, Strategy, or Match is enabled by this plan. No execution promise. All planning, source work, tests, review and cleanup debit the original clock; stop at reserve/deadline and report partial/inconclusive.
</fixed_constraints>

<finite_inventory>
Exact paths in `LEAN_RESOURCE_WINDOW_V15_REPORT_PATHS`; all remain physically debited. Before implementation, ROOT adds these paths in a finite scheduled source amendment and independently checks the exact hash inclusion/exclusion order.

| Path | Functional source hash | Physical debit | Role |
|---|---|---|---|
| `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v1.md` | include | include | immutable earlier draft |
| `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-v2.md` | include | include | checked successor plan |
| `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v1.md` | include | include | immutable initial checker result |
| `265-16-POST-V15-ARCHIVED-PREFIX-PLAN-CHECK-v2.md` | include | include | independent revised-plan checker result, completed before source work |
| `265-16-POST-V15-ARCHIVED-PREFIX-RESEARCH-v1.md` | include | include | research contract |
| `265-16-POST-V15-ARCHIVED-PREFIX-PIN-INVENTORY-v1.md` | include | include | immutable exact raw pins |
| `265-16-POST-V15-TIMING-DECISION-v1.md` | include | include | pending/unapproved decision input only |
| `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-SUMMARY-v1.md` | exclude exact path only | include | generated execution summary |
| `265-16-POST-V15-ARCHIVED-PREFIX-REVIEW-FIX-v1.md` | exclude exact path only | include | generated pre-final-review fix record |
| `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-REVIEW-v1.md` | exclude exact path only | include | intermediate independent review record |
| `265-16-POST-V15-ARCHIVED-PREFIX-VALIDATION-v1.md` | exclude exact path only | include | generated validation record |
| `265-16-POST-V15-ARCHIVED-PREFIX-SOURCE-VERIFICATION-v1.md` | exclude exact path only | include | generated independent source verification |
| `265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v4.md` | exclude exact path only | include | selected fresh independent source review; never self-hash |

No glob, prefix-wide exclusion, wildcard version selector, or mutable overwrite is permitted. The existing v3 review remains part of prior history, not selected receipt. Any extra report requires a new exact ROOT inventory addition and review before creation.

Ordering: (1) plan v2, pin inventory, research, pending timing decision, and both plan-check files are finite source inputs; checker v2 closes before code. (2) ROOT schedules exact report inventory and named hash exclusions before coding. (3) source/tests change; any pre-final-review fix record closes; final source commit and manifest/root derive over included paths. (4) independent reviewer creates v4 against that final commit/root and exact eight-file closure; v4 is the exact excluded review receipt consumed by validation, but remains physically debited. If review finds a source defect, fix before final source commit/root and v4; do not overwrite v4 or invent an unlisted version. (5) summary, validation, and independent verification run against unchanged source/root/review; exact exclusions remain physically charged. Source hash is not recomputed from a report that references it.
</finite_inventory>

<tasks>
<task type="auto" tdd="true">
  <name>Task 1: Add v15-3-only pinned cost-prefix custody without acceptance authority</name>
  <files>scripts/lib/v1-38-lean-resource-window-v15.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts</files>
  <behavior>
    - Verify all 11 exact inventory rows using exact raw digest, canonical pin domain, and embedded root when present; fail on missing/mismatch without refreshing pins.
    - Compose refused v15-2 cost-only predecessor preserving current 1/cumulative 37, elapsed/debit/survivors and unknown peaks; no accepted/final-close/hold-authentication property exists.
    - Preserve roles of allocation, request, entry, terminal, result, ROOT closure, ordinary refusal, carry, complete hold, operator-error hold-refusal, pair closure; cross-record roots/counters must agree.
    - Legacy accepted v14-1 reader/authenticator path remains unchanged; v15-2 and v15-4/5 do not select the new cost-only contract.
  </behavior>
  <action>Before changing code, independently recompute each row from the exact path in the pin inventory with a bounded read-only hash script; compare all byte lengths, raw digests, fixed-domain canonical roots, and existing embedded roots. Stop/report mismatch rather than investigating substitute artifacts. Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, implement a distinct exact-key parser/return type for a `v15-2-failed-prefix-cost-only-v1` predecessor. Add a v15-3-only byte-map seam so the exported `readLeanResourceWindowPriorPairV15` selection can be tested in memory without invoking the old `authenticateLeanResourceWindowPriorPairV15`, any old ordinary reader, or accepted join. Match the inventory’s field-role joins and fail closed on any disagreement. Keep charge=37 as a floor, carry elapsed/debit/survivor floors monotonically, and keep historical peak values unknown. Preserve refusal bits and hold refusal as separate, non-authorizing records; the type and constructor must not contain acceptance or final-reader-close claims. Do not modify old pins/bytes/semantics, prior authenticators, route preparation, or any empirical path.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <done>All exact pin recomputations match; the new distinct v15-3 cost path validates only the listed refused history and is structurally non-authorizing; previous accepted v14-1 behavior is unchanged.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Bind concrete checkpoint distinction, exact fresh review v4, and inventory at the real consumer</name>
  <files>scripts/run-v1-38-lean-correction.ts, packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-resource-window-v15.test.ts, packages/strategy-lab/src/league/lean-resource-window-v15.test.ts</files>
  <behavior>
    - Positive fixture exercises `readLeanResourceWindowPriorPairV15` byte-map seam, `createLeanResourceWindowContinuationV15`, `createLeanResourceWindowRequestDraftV15`, and actual `validateLeanResourceWindowContinuationV15` with v15-3 exact cost prefix, exact semantic tag, source root, and fresh v4 receipt.
    - Negative fixtures reject v3 substituted as current review, wrong/stale v4 root/commit/source entries/actor/status/findings/path list, altered semantic tag/call-chain coverage, identity-only source drift, pin mismatch, refusal promotion, and nonmonotonic cost.
    - Compatibility matrix: accepted v14-1 fixtures retain existing route; legacy/default input retains old path; v15-2 does not use this successor; v15-4 and v15-5 fail closed absent independent immediate-prefix contracts.
    - Exact finite report inventory includes all 13 listed paths; source-hash includes/excludes match the table and every excluded report remains in physical debit.
  </behavior>
  <action>Per D-01/D-02/D-05/D-22/D-25/D-27/D-28, encode only `fresh_synchronous_checkpoint_observation_v15` as the v15-3 prospective distinction. The semantic proof is independently reviewer-attested against failed base `7250223f67620ccc274a3a2fc80d099718ea58ea`; repair commit `47425b37ee8d4a9ebdf0851667689d6d5ec0713e` is prior repair evidence, not the failed-source comparator. Require v4 to attest actual selector/callback/guard invariants and connected tests; do not invent an AST certificate or ask the runtime validator to interpret source prose. Select exact `265-16-POST-V14-RESOURCE-WINDOW-SOURCE-REVIEW-v4.md`; v3 is baseline-only. Require the existing strict frontmatter fields specified above. In tests call actual exported `readLeanResourceWindowPriorPairV15` through the new injected-byte seam, `createLeanResourceWindowContinuationV15`, `createLeanResourceWindowRequestDraftV15`, and actual `validateLeanResourceWindowContinuationV15`; no old authenticator invocation is permitted in new fixtures. Positive v15-3 fixture must join all four. Negative matrix separately proves accepted v14-1 path unchanged, legacy/default unchanged, v15-2 not selecting successor, and v15-4/v15-5 refusing without their own checked immediate-prefix contracts. Add every exact inventory path to the finite physical report list; mark only exact generated outputs (`SOURCE-SUMMARY-v1`, `REVIEW-FIX-v1`, `SOURCE-REVIEW-v1`, `VALIDATION-v1`, `SOURCE-VERIFICATION-v1`, and selected review v4) as exact functional-hash exclusions while preserving physical debit. No other path is excluded. Keep old bytes/joins unchanged; do not create data/helper reviews, attestation, authorization, setup, allocation, or route artifacts.</action>
  <verify><automated>node_modules/.bin/vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts packages/strategy-lab/src/league/lean-resource-window-v15.test.ts --testTimeout 30000</automated></verify>
  <done>The real consumer accepts only the exact v15-3 cost prefix plus concrete distinction and current fresh v4 review; all compatibility and dormant-mode fixtures pass, and finite inventory/hash/debit membership is exact.</done>
</task>
</tasks>

<threat_model>
## Trust boundaries
| Boundary | Description |
|---|---|
| Archived bytes → cost authenticator | Exact paths/bytes and canonical roots are untrusted until all finite pins match. |
| Cost-only prefix → continuation/request | Failed historical facts must not become acceptance or execution authority. |
| Current source → review/distinction consumer | Review must be independent and bind the exact final source commit/root and real call chain. |

## STRIDE Threat Register
| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-AP-01 | Tampering | Raw pin set | high | mitigate | Exact 11 records, dual raw/canonical roots, existing embedded roots, mismatch refusal. |
| T-265-AP-02 | Repudiation | Refused history | high | mitigate | Preserve 37 charges/refusal bits and distinct reader/hold roles; no old reader rerun or acceptance promotion. |
| T-265-AP-03 | Elevation of privilege | v15-3 consumer | critical | mitigate | Only exact semantic tag plus fresh independent v4 and source-root joins; later modes fail closed. |
| T-265-AP-04 | Information disclosure | Metadata inventory | high | mitigate | Whitelist metadata roles only; exclude Strategy, private errors, compressed/IO payloads. |
| T-265-AP-SC | Supply-chain tampering | Dependencies | low | accept | No installs or new dependencies. |
</threat_model>

<verification>
Focused commands from both tasks, changed-module configured typecheck, shell syntax, diff check, exact source manifest derivation, fresh v4 consumer check, and independent source verification. Keep every receipt attributed; the v4 reviewer inspects the exact eight files above and concrete call chain. Strict inherited checks remain their own statuses. No full suite, old reader/authenticator, provider, Strategy, Match, route, helper, or empirical result is run. If the fixed reserve/deadline blocks completion, preserve source-only/incomplete status and no-entry.
</verification>

<success_criteria>
All 11 pins are independently confirmed and consumed as a non-authorizing refused cost prefix; only the defined v15-3 call-chain distinction with an exact fresh source-bound v4 review reaches the continuation consumer; accepted v14-1 and legacy behavior are unchanged; v15-2 and v15-4/5 remain closed; all paths are physically debited and source-hash exclusions are exact. No empirical, league, Phase 265, freeze, formation, holdout, public, counted, or production credit follows.
</success_criteria>

<output>
Use only the exact finite output inventory in this plan. The pending timing decision stays unapproved and merely counted. Do not create conditional DATA/HELPER reports, authorization, setup, allocation, store, capacity, route, provider, or Match artifacts. No STATE/ROADMAP/history edit or commit is part of this delegated plan drafting scope.
</output>
