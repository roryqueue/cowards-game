---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T02:13:46Z
iteration: 3
depth: standard
reviewed_commit: 9ffde3ffafd23c6508766e15c05b5004c0fe030f
diff_base: 18f68a5dfcb39c26a4be3f2f85993172c454689f
implementation_root: sha256:552bba3d794cf902d12282ac453434fe74569a9d56870a655ba5b9a3e61a0aa8
source_root: sha256:defe5024690baceb2128cbd370f6c24f86e8301dcec2e816eff57d1eabea73e2
production_source_entries: 858
files_reviewed: 15
files_reviewed_list:
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - scripts/lib/v1-38-league-host-receipt.ts
  - scripts/lib/v1-38-league-prospective-lifetime.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - .github/workflows/ci.yml
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
finding_ids: []
resolved_finding_ids:
  - CR-01
  - CR-02
  - WR-01
  - CR-03
status: clean
---

# Phase 265 host-receipt source re-review — iteration 3

## Summary

Independent GSD standard-depth re-review at exact held HEAD `9ffde3ffafd23c6508766e15c05b5004c0fe030f`. The reviewer is not the source author or fixer. No actionable new finding was established in the bounded 15-file review. CR-01, CR-02, WR-01 and CR-03 are resolved in inspected source. This is a clean source-review result, not production or empirical certification.

CR-03's source fix is `3e5ae142b4b309b429fd2247db879bb90f616fa6`. Relative to iteration 2, only the serious-league source and test changed within the 15-file scope; the other 13 files are byte-identical. Those diffs, surrounding failure lifecycle and retained-reader joins were rechecked, while the previously inspected capability/policy chains and original-fix evidence remain applicable. Prior reports are preserved in Git and the tracked iteration backups. This canonical report is the latest workflow result and remains uncommitted for the exact-HEAD source gate. Fallow remains disabled; no structural pre-pass was supplied.

## Narrative Findings (AI reviewer)

No unresolved BLOCKER or WARNING findings. The clean result is limited to the source, tests and cross-file chains inspected here; it does not establish the unrun full gate or live behavior.

## Resolution evidence

### CR-03 — RESOLVED: validation follows the actual failed-response lifecycle

**Inspected source:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:942`–`:970`, `:980`–`:1005`; lifecycle `scripts/lib/v1-38-league-response-runtime.ts:181`–`:188`, `:305`–`:309`.

The reader computes the charged prefix before selected validation. A produced, authenticated author with zero charges can now retain a legitimate failure before authoring publication, selected validation, or validation publication without fabricating successful validation/provider evidence. With any charge, exactly one valid selected validation is still required. Every available validation linked to the production start is inspected, including foreign-proposal records: proposal/source/revision/validation/native-lane bindings must equal a revision reconstructed from the authenticated authored bytes. Validation without a produced authenticated author is rejected.

The exception cannot turn a zero-charge prefix into an evidence-bearing accepted path. Existing runtime invocation/failure/cleanup records must join exactly one response charge at lines 901–903; V3 result/execution-failure records now have that same requirement at lines 904–906. Charges/count/reservation/conditions and completed-prefix coverage remain checked at lines 979–987. CR-02's available provider-identity checks remain before the no-execution continuation at line 1005. No successful result, payoff, guessed validation, or provider identity is created by this conditional relaxation.

**Inspected regression meaning:** the new source-only lifecycle cases exercise actual `produceLeagueResponse` failures at authoring append, validation publication, rejected selected revision, and valid validation before first charge. They assert zero host-constructor/Match-runner calls and zero runtime/result/charge records, and reopen their retained failure through the helper. Negative controls reject orphan runtime/result/execution-failure records, foreign available validation fields, and charged prefixes with missing or wrong validation. Existing charged issuance/execution/completed-prefix and provider-field mutation cases remain. Retained author verification is explicitly mocked; these tests do not prove the full authored/whole-run pipeline.

### CR-01 — RESOLVED: explicit fixture transport and stream seams precede claims

**Inspected unchanged source:** `scripts/lib/v1-38-planner-supervised-runtime.ts:83`–`:84`; `scripts/lib/v1-38-lean-container-match-session.ts:255`–`:257`.

V3 fixture authority requires both transport and stream seams to be callable before authority consumption or control/session construction. Missing, undefined or null stream values cannot fall through to the live default. The factory fixture constructor guard and prohibition on empirical injected overrides remain intact. The explicit test-only fixture stream constructor at session lines 224–226 uses the shared transaction logic with a supplied process-local Worker interface; the live default at line 222 still constructs its Worker. Unset native Worker mocks fail closed, and inspected missing-seam tests verify no dispatch and unconsumed claims. This establishes the bounded source/test isolation correction, not a live isolation probe.

### CR-02 — RESOLVED: retained failed-response identities keep exact admitted joins

**Inspected unchanged validator and current caller:** `scripts/lib/v1-38-league-response-runtime.ts:124`–`:130`; `scripts/run-v1-38-serious-league.ts:988`–`:1022`.

The shared V3 validator reconstructs the selected revision from authenticated source bytes and joins source/executable/revision, allocation budget, exact attempt, tuple ID/root, runtime limits, image and factory packet/proposal/validation roots. Reopened imported closures are selected by exact score/independence-left/independence-right purpose; measured and opposing attempts remain distinct for both seats and equal-source self-play.

Every available cleanup, original/admitted invocation, invocation-failure and execution-accounting identity is checked at lines 1001–1003 before the no-execution continuation. Completed supervision metadata is checked at lines 1020–1022. Successful V3 response metadata uses the same validator. Constructors that did not return do not acquire fabricated cleanup requirements. Historical V1/V2 paths remain outside the new validator. CR-03's zero-charge exception does not remove these checks.

The previously inspected focused tests exercise twelve changed binding fields across available record kinds and completed supervision metadata, with explicit historical cases. Their author-verifier mock and synthetic helper inputs are not whole-run proof.

### WR-01 — RESOLVED: V3 inner admission errors poison and preserve original error

**Inspected unchanged source:** `scripts/lib/v1-38-lean-container-match-session.ts:323`–`:329`.

Strict inner JSON/schema admission has a V3-only catch that poisons/attempts cleanup and rethrows the original origin-bearing error even if cleanup throws. Poisoning occurs before cleanup, so a second request cannot exchange another frame. The inspected malformed JSON/null/surplus-key/schema cases assert original error/private origin, one frame and no second dispatch. Historical no-grant behavior remains unchanged and explicitly tested.

## Scope and contract limits

The existing project instructions and planning authority, actual host-receipt approval, host-receipt plan/research, allocation/runtime summaries and updated uncommitted fix report were the scoped context. The latest review is bounded to the CR-03 correction and unchanged earlier fixes, not a repeated bulk review of consumed history.

- V3 still changes only the approved host-response receipt field to 5000 ms. Legacy guest/broker 1000 ms, Match 600000 ms and alternative V1.17 signed 50 ms method/100 ms cancellation/startup aggregate remain unchanged. The actual legacy adapter execute and alternative V1.17 parent wait are the scoped host-wait sites; encoded broker budgets/classification and authenticated D/system-failure/TIMEOUT behavior remain unchanged. Host expiry is not guessed Strategy timeout.
- Opaque one-use WeakMap authority and ordered factory → planner → session claims remain bound to admitted V3 allocation/source/implementation, durable reopened cell/response parent start, Match/seat/provider/attempt/runtime/container owner. Separate main/response purposes and score/left/right/both-seat/self-play joins remain. Explicit prepare/preflight/run/reservation/source-closure/capacity/retained selectors are unchanged.
- V1/V2 bytes and historical paths remain version-gated out of the new behavior. The CR-03 fix is V3-only. Existing resource limits, poison/cleanup/accounting and durable-before-return behavior are not expanded. Current gameplay, public privacy and counted/production authority remain unchanged.
- Exact fixture constructors/golden roots and complete interfaces remain; no cast-based strict-error suppression, assertion removal, or CI/strict-flag weakening was introduced. Tests with fixture seams are not claimed equivalent to empirical execution.
- The Task 3 plan-only consolidation removes duplicate executions, not commands or checks: the same eight CI gate commands remain, and unfiltered CI command 1 includes all six focused files and the source-closure regression once. The narrow PLAN-CHECK-v3 records PASSED. This source-neutral consolidation creates no new product/rules/resource decision or human-only checkpoint.

## Actual source identity and verification limits

Independently executed the existing safe source-only `factoryAssessmentImplementationManifest()` and `labRoot("league-reviewed-source-bytes-v1", manifest.entries)` at the held HEAD. The current production closure contains 858 entries and returned:

- Implementation: `sha256:552bba3d794cf902d12282ac453434fe74569a9d56870a655ba5b9a3e61a0aa8`
- Source: `sha256:defe5024690baceb2128cbd370f6c24f86e8301dcec2e816eff57d1eabea73e2`

These are actual computed closure identities, not placeholders or format-only checks; the existing source inventory semantics were not changed. HEAD was independently checked as `9ffde3ffafd23c6508766e15c05b5004c0fe030f`.

The current fixer report records RED 3 failed/1 passed/146 skipped and GREEN 7 passed/143 skipped (59.56 seconds), plus the unchanged exact augmented strict TypeScript pass. These are author-reported results, **not rerun** by this reviewer. Earlier reported 62 selected host-response tests/368 skipped and strict-pass evidence are likewise not independent reruns. No full suite/eight-command gate, provider/Worker/Docker/model/Match/capacity/route/helper/retained empirical verifier was launched by this review.

The earlier fix report acknowledges two unexpected native default construction attempts during its initial RED run. Docker-launch outcome remains unknown; later reported inspection found no lingering matching processes. This review performed no native probe and does not convert that incident into proof of no launch. Current CR-03 fixtures use explicit throwing host/run sentinels and mocked retained author verification.

Only this canonical review report was updated by the reviewer. Source, fix report, backups, other planning files, existing untracked artifacts and locks are preserved.

## Handoff

The source-review gate is clean at the exact reviewed commit and actual roots above. The parent may proceed with the already-authorized literal exact-HEAD check and unchanged eight-command source gate; those gates are not represented as already run here. Keep the report uncommitted until that check, then handle report commits per the plan.

No LEAG-01–09, league/freeze, empirical matrix/solver/response/red-team/portfolio/finalist or Phase 265 completion credit follows. V11 and all other consumed history remain immutable; holdout remains unopened; formation/public/counted/production authority remains absent.
