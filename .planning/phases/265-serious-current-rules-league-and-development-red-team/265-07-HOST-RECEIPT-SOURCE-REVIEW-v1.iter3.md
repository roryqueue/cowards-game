---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T01:54:13Z
iteration: 2
depth: standard
reviewed_commit: 18f68a5dfcb39c26a4be3f2f85993172c454689f
diff_base: b3962fdd3148eb4d8ee151c00cabccd853f74bcf
implementation_root: sha256:2057bf8c431c47de7cfdd2e1918ed8f75589dc3b0bf879175071e762ab5874dc
source_root: sha256:e60e7da1d9cfd67efd17dcbfb5e5c2a4a6f2d50264dddce958a4f80bc5740409
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
  critical: 1
  warning: 0
  info: 0
  total: 1
finding_ids:
  - CR-03
resolved_finding_ids:
  - CR-01
  - CR-02
  - WR-01
status: issues_found
---

# Phase 265 host-receipt source re-review — iteration 2

## Summary

Independent GSD standard-depth re-review of the same 15-file scope at exact held HEAD `18f68a5dfcb39c26a4be3f2f85993172c454689f`, including the factory → planner → session capability chain and retained failure-reader chain. The reviewer is not the source author or fixer. The original three findings are resolved in inspected source; one new BLOCKER, CR-03, prevents a clean-review gate.

The source fixes are `a4b07d61` (CR-01), `a78a3d35` (WR-01), and `f77d3ede` (CR-02). The subsequent HEAD changes only planning state/review backup; production source matches `f77d3ede`. The original issues report is preserved in Git and `265-07-HOST-RECEIPT-SOURCE-REVIEW-v1.iter2.md`; this canonical report is the workflow's latest result. Fallow remains disabled, with no structural pre-pass supplied.

## Narrative Findings (AI reviewer)

### CR-03 — BLOCKER: V3 failed-response reader requires successful validation before any Match/provider exists

**Primary file/line:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:949`.

**Related evidence:** same file `:944`–`:956`, `:967`–`:970`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.ts:181`–`:188`, `:305`–`:309`; new retained-failure tests in `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.test.ts:48`.

**Causal failure:** CR-02's fix unconditionally reconstructs an authored provider source and requires exactly one valid `response-validation` record whenever a V3 failure's author disposition is `produced`. That is stronger than the execution lifecycle: the author result is assigned at response-runtime line 181, before the authoring graph append at line 182, selected revision validation at line 186, and validation-record publication at line 188. A legitimate error at any of those intervening boundaries leaves a produced author but no validation record, zero charged response Matches and no provider identities. The existing catch can still retain its honest production-failure record and matching system-failure terminal using reserved failure capacity. The new reader rejects that prefix at line 949 before reaching the already-permitted zero-charge coverage case.

**Bounded reproduction construction, not executed:** use a valid source-current V3 allocation/start/target and an author whose authentic produced result/ingestion has been retained. Inject a work-publication/capacity refusal specifically for the `response-authoring` append, while allowing the existing production-failure record and factory/red-team failure terminals. `produceLeagueResponse` then retains `author.disposition: produced`, `matchCount: 0`, no `response-match-start`, no `response-validation`, and no runtime record. Reopen that otherwise valid failed prefix. The author/artifact/start/terminal joins can pass, but line 949 throws `SERIOUS_LEAGUE_RETAINED_FAILED_RESPONSE_VALIDATION`. A failure publishing the validation record itself has the same result. A selected-source validation rejection before that record is published likewise must not acquire fabricated successful validation evidence.

This is a new false rejection of honest process-invalid evidence, not a new successful-payoff or LEAG-credit path. It violates the existing charged-prefix/failure-accounting behavior that the approved V3 amendment must preserve.

**Fix:** make successful authored-provider validation conditional on reaching the relevant charged/provider-evidence stage. Compute response charges early (or lazily derive the expected authored provider only when checking available identities). With zero Match charges and no provider/result evidence, retain the existing authenticated author/start/target/terminal checks but do not demand or invent a successful validation record. For charged Matches and every available provider identity/completed prefix, keep CR-02's exact admitted joins mandatory; do not permit omission of required validation or wrong provider roots. Existing validation evidence, when present, should still be checked appropriately. Add a focused source-only regression for produced-author/zero-charge failure before authoring append and at validation publication, plus a negative proving charged provider evidence cannot use the exception. V1/V2 behavior and failure disposition must remain unchanged.

**Test gap:** the new helper-level cases all reach successful validation first: “issuance” means the second provider constructor fails after the first Match charge, “execution” means one Match, and “prefix” means nine completed synthetic Matches followed by issuance failure. None exercises a produced author failing before validation/first charge. The author validator is explicitly mocked in these fixtures; their passes do not establish whole-run retained correctness.

## Resolution of original findings

### CR-01 — RESOLVED: explicit fixture control and stream seams precede claims

Inspected `scripts/lib/v1-38-planner-supervised-runtime.ts:83`–`:84` and `scripts/lib/v1-38-lean-container-match-session.ts:255`–`:257`: fixture V3 authority requires both seams to be callable before authority consumption or control/session construction. Missing, undefined and null stream values cannot reach the nullish live default. Empirical injected overrides remain denied, and factory's explicit fixture-constructor guard remains intact.

The transaction logic is shared by a private launch abstraction; the live default still constructs the same Worker at session line 222, while explicit `createLeanContainerFixtureStreamFactory` at lines 224–226 substitutes a supplied process-local Worker interface without constructing a Worker/child. Its use is test-environment guarded. New session/planner regressions reject missing/undefined/null streams before dispatch and show claims remain available for legitimate subsequent use. Native Worker mocks now throw when unset instead of falling through to native construction. These are inspected source/mock assertions, not a live isolation probe.

### CR-02 — RESOLVED: available failed-response identities receive admitted V3 joins

Inspected shared `verifyRetainedV3ResponseProvider` in `scripts/lib/v1-38-league-response-runtime.ts:124`–`:130` and the failure helper in `scripts/run-v1-38-serious-league.ts:978`–`:1012`. It rebuilds the selected revision from authenticated source bytes and joins source/executable/revision, allocation budget, exact attempt, tuple ID/root, runtime limits, image, and factory packet/proposal/validation roots. Imported source closures are reopened and selected by exact score/independence-left/independence-right purpose; measured and opposing attempts remain distinct for both seats and equal-source self-play.

Every available cleanup, original/admitted invocation, invocation-failure and execution-accounting identity is checked before the no-execution continuation at line 995. Completed-prefix supervision metadata is checked too, and the successful V3 response metadata uses the same validator. Providers whose constructors did not return do not acquire fabricated cleanup requirements. V1/V2 checks are gated out of the new validator. CR-03 separately reports the newly overbroad requirement for zero-provider pre-validation failures; it does not reopen the original missing-provider-join finding.

The new focused tests inspect actual retained failure-helper behavior, twelve changed binding fields across available record kinds, and completed supervision metadata. They remain isolated synthetic helper tests with author verification mocked, not an author/whole-run proof.

### WR-01 — RESOLVED: V3 inner admission errors poison while preserving original error

Inspected `scripts/lib/v1-38-lean-container-match-session.ts:323`–`:329`: strict inner JSON/schema admission now has a V3-only catch. It poisons/attempts cleanup and rethrows the original origin-bearing error even if cleanup itself throws. Session state is set poisoned before cleanup, so the second request cannot exchange another frame. New tests cover malformed JSON, null, surplus keys and invalid schema, with original MALFORMED_IPC/private origin, one frame, one close/removal and no second dispatch. Historical no-grant inner-error behavior is explicitly retained and asserted.

## Scope and contract recheck

The 15-file review scope is unchanged. Seven files have fix diffs; the other eight scoped files are byte-identical to the previously inspected source at `b3962fdd` (allocation/source authority/lifetime/factory sources and relevant tests/CI). The new diffs and surrounding call chains were rechecked without repeating bulk old-history scans.

- The exact rooted V3 5000 ms field/approval, legacy guest/broker 1000 ms, Match 600000 ms, and V1.17 signed 50 ms method/100 ms cancellation/startup aggregate are unchanged by the fixes. Host expiry remains a system/transport observation, never guessed Strategy timeout; authenticated D and late ambiguous attribution handling are unchanged.
- The private WeakMap authority and ordered one-use source/durable-start/provider bindings are unchanged. Main and response score/left/right provider issuance still follows existing durable charges. Preparation/preflight/run/reservation/source/capacity and retained V3 selectors remain explicit.
- V1/V2 allocation bytes/selectors and default/native transaction behavior are preserved by version guards and the shared transaction extraction. Public privacy, current gameplay, capacity, accounting, retention-before-return and resource limits were not expanded. CR-03 limits the claim of V3 honest failure-prefix preservation.
- Existing canonical fixture constructors/golden input/source roots and complete provider interfaces remain. No new CI removal, cast-based strict-error suppression, or flag weakening was introduced by the fixes. The test-only seams are not asserted equivalent to real provider execution.

Current AGENTS/state, the actual host approval, checked host-receipt plan/research and allocation/runtime summaries remain the scoped authority. The fix report was read, including its explicit limitations and unexpected initial native-construction attempts. Generic “requires human verification” fixer labels do not create a new human-only checkpoint; this independent review is the requested same-scope check. CR-03 is an actual source blocker.

## Actual source identity and verification limits

The existing safe source-only `factoryAssessmentImplementationManifest()` and `labRoot("league-reviewed-source-bytes-v1", manifest.entries)` were executed to compute the current 858-entry production closure. They returned exactly:

- Implementation: `sha256:2057bf8c431c47de7cfdd2e1918ed8f75589dc3b0bf879175071e762ab5874dc`
- Source: `sha256:e60e7da1d9cfd67efd17dcbfb5e5c2a4a6f2d50264dddce958a4f80bc5740409`

These are actual computed identities, not placeholders, and source inventory semantics are unchanged. HEAD was checked as `18f68a5dfcb39c26a4be3f2f85993172c454689f`. Only this canonical review report is updated by the reviewer and is left uncommitted for the parent; no source, fix report, backup, other planning file, existing untracked artifact or lock was changed.

The fixer reports 62 host-response-selected tests passed/368 skipped and the exact augmented strict TypeScript pass at `f77d3ede`, plus the focused failure-helper/historical cases. These results were **not rerun** by this reviewer. No full suite, eight-command CI gate, native/process/Docker/model/provider/Match/capacity/route/helper/retained empirical verifier was launched.

The fix report acknowledges two unexpected native default construction attempts during its initial RED run; Docker-launch outcome is unknown, and its later process inspection reported no lingering matching processes. This review does not reinterpret that event as proof of no Docker launch, and performed no follow-up native probe.

## Handoff

Resolve CR-03 with the bounded conditional failure-stage fix and focused regression, then independently re-review the resulting exact HEAD/actual roots before the fixed-source gate. This `issues_found` report cannot admit the clean gate.

No LEAG-01–09, league/freeze, empirical matrix/solver/response/red-team/portfolio/finalist or Phase 265 completion credit follows. V11 and all other consumed history stay immutable; holdout remains unopened; formation/public/counted/production authority remains absent.
