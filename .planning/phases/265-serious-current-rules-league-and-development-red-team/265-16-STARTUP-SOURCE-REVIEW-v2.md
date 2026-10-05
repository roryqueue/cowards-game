---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-startup-v5-source
reviewed: 2026-10-05T22:40:20Z
depth: standard
scope: focused_source_only_crossfile_re_review
diff_base: a4b372f0
source_commit: 33c0243bb4ae3551212695716f20cb7a720cfee1
source_root: sha256:55f49cc0a3dfd9a6664e07df21632fb049d03611d01a9b350645d9e0b2efa31d
independently_reviewed: true
reviewer_agent: /root/review_265_startup_v5_fixed
files_reviewed: 12
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-lean-startup-v5.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
execution_authorized: false
empirical_credit: false
phase_complete: false
---

# Phase 265: Startup v5 source re-review

## Summary

No remaining concrete BLOCKER or WARNING found in this focused re-review of the original twelve-file scope at `33c0243b`, including fixes `f5f1fc2d`, `2041a988` and `33c0243b`. Initial CR-01, CR-02 and WR-01 are closed for this source gate. This is not native lifecycle certification, startup-sufficiency proof or empirical admission.

Context: project AGENTS.md and active planning overlays, Phase265 context, startup approval and checked supplement, initial source review, fix report, source validation and source summary. No project-local skills or structural pre-pass were supplied. Historical planning paragraphs were not treated as current authority. The earlier validation/summary's 28-fixture and missing-positive-fixture statements describe the pre-fix source; the fix report supersedes those specific limitations with 36 reported synthetic fixtures.

## Narrative Findings (AI reviewer)

No new findings. The following records disposition of existing findings, not additional findings or a blanket correctness guarantee.

- **CR-01 (previous BLOCKER), closed:** `scripts/lib/v1-38-lean-container-match-session.ts:264-322` embeds explicit closure-free JavaScript. The exported fake-host supervisor compiles that exact fixed trusted string, and the broker embeds it without serializing a loader-transformed function. Independent inert `node --import tsx` import/build observed `undefinedHelper=false`, one embedded supervisor and 40,733 broker characters. No broker or guest was evaluated. The control string has no captured module helper.
- **CR-02 (previous BLOCKER), closed:** `packages/strategy-lab/src/league/lean-experiment.ts:976-1015`, `scripts/run-v1-38-lean-correction.ts:93-117`, and `scripts/lib/v1-38-lean-correction-retained.ts:203-236,298-300` distinguish raw authenticated admission observations from effective `ledgerCloseMs`. Reader-close starts at the returned effective verifier close; historical gap import retains its authenticated endpoints and closing work is timed separately. V5 close debits the maximum of nonnegative wall delta and rounded monotonic delta; backwards wall observations cannot refund that debit. `lean-experiment.ts:1099-1103` closes terminal custody at the terminal's authenticated monotonic observation, with subsequent work assigned to admission finalization. Exact joins remain enforced; old receipt schemas and old-version branches remain separate. The added fixtures cover same-wall/+1ns, monotonic-ahead, rollback, terminal snapshot and complete accepted diagnostic closure.
- **WR-01 (previous WARNING), closed:** `scripts/run-v1-38-lean-startup-v5.test.ts:268-314` now builds exact synthetic filesystem request, setup witness, source/data reviews and execution authorization bytes, reaches the real request reader and then real accepted-diagnostic authenticator. Authorization/request-data/policy/source-review/cap/HEAD/terminal-allocation/charge/effective-close mutations are individually refused. The old cold-reuse authentication and OS/identity observations are explicitly synthetic, not empirical proof. The positive check is synthesized from the real audit and closed ledger; this is not an actual ordinary reader invocation or a native diagnostic.

## Cross-file checks and preservation

Strict admitted v5 cap selection reaches allocation admission, charge/checkpoint and current elapsed guards, correction resource/admission guards, actual bounded-parent deadline/periodic guard, both source publishers, the charge-bound issuer and retained predicates. A serialized/copy authority cannot acquire startup; ordered WeakMap claims remain factory → planner → session. Public scalar startup options do not grant the allowance. Source/HEAD/request/policy/allocation/charge joins remain explicit.

Trusted READY/GO precedes the original hostile import/evaluation path. Startup2500, guest1000, cancellation≤100 and receipt reconciliation share the host's remaining absolute5000 deadline; session acceptance rechecks after frame and inner-response parsing. Match600000 is unchanged. Finite origins are private, exact-key and bound to actual request/source/input/seat/allocation/charge/harness identities; lifecycle/termination uncertainty does not acquire native-signal proof or clean cleanup. Failures poison/close the session.

Only exact admitted v5 selects43200000ms. Global old28800000ms,15GB/300, prior23 charges and surviving-file debits remain unchanged. The setup/predecessor path carries26634447ms and subsequent active segments; baseline custody requires an accepted diagnostic at24 cumulative charges, closed reader/gap/finalization and later elapsed cost. Complete baseline still requires36 fresh cells; old10-cell partial evidence is not imported. Historical peaks remain unknown.

Independent inert AST initializer comparison against `a4b372f0` found exact byte identity for `LEAN_CONTAINER_BROKER_SOURCE`, `buildLeanCorrectionOriginBrokerSource` and `buildLeanAuthenticatedHarnessSource`; the original `worker-harness.ts` file is unchanged. Old origin-v1 has a separate strict validator. No engine/rules, solver/search/cold procedure, consumed artifact or ordinary historical reader is modified by the reviewed diff. Freeze-before-formation and unopened holdout/public/counting/production restrictions remain.

## Independent observations and limits

Only read-only source/Git inspection, whitespace checking, inert source imports/string construction and inert AST byte comparison were performed. No tests, Strategy/guest/generated-broker execution, native Worker/child/Docker/provider/Match, allocation preparation, capacity admission, ordinary retained reader or private-history payload scan was run. Source files and unrelated worktree files were not modified; only this report is created, without commit.

The execution-loader manifest independently recomputed888 entries and matches the fix report:

- sourceRoot: `sha256:55f49cc0a3dfd9a6664e07df21632fb049d03611d01a9b350645d9e0b2efa31d`
- harnessRoot: `sha256:ce33dc1d4eaba6eed31362f533a4dcc2e2b6091f16b5c34efae085af1e7188f2`
- brokerRoot: `sha256:60e65349ce3095943d5fc65b6e90ae40e126a4c359365c98342275ae78bceb0e`

The author's36/36 synthetic fixture passes and scoped type/syntax results were inspected, not rerun. Nine inherited script-inclusive type diagnostics remain disclosed; this is not a global type pass. Root identities are not authorization, and the original v4 initiating cause remains UNKNOWN.

Source verification and independently reviewed final machine carriers still precede at mostONE new diagnostic. Conditional at mostONE fresh36 baseline requires complete accepted diagnostic, carried costs/files/charges and fresh passing SAMEPROCESS capacity. No retry or downstream authority follows from this report. Phase265 remains incomplete; no empirical/LEAG/freeze/formation/holdout/public/counted/production credit.

---

_Reviewer: /root/review_265_startup_v5_fixed; focused standard source-only re-review._
