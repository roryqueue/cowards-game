---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T01:22:13Z
depth: standard
reviewed_commit: 50a104041e947d901fd5a39f2c836bea494c6fbd
diff_base: 5b87bb91
implementation_root: sha256:479051f331a48a3d20d346d00eb36f335ee31dbc910aa765f32768200f9e6eb1
source_root: sha256:2d4e1ba9e9a8f5aa336eb7f2a5808e399863dc891aa03ddb92ffa7c52b00b594
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
  critical: 2
  warning: 1
  info: 0
  total: 3
finding_ids:
  - CR-01
  - CR-02
  - WR-01
status: issues_found
---

# Phase 265 host-receipt source review

## Summary

Independent adversarial review of the fixed source commit above, at standard depth with the factory → planner → session capability chain and main/response retained call chains included. The reviewer is not the source author. Two BLOCKER findings and one WARNING remain; the clean-review gate must not pass at this commit.

Fallow was not configured and was disabled; no structural pre-pass was supplied. This is a source-only review, not production certification or empirical league validation.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: fixture host-receipt authority can construct the live native stream

**Primary file/line:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:247`.

**Related evidence:** same file `:253`, `:277`, `:191`, `:174`–`:177`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.ts:83` and `:113`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-factory-supervised-runtime.ts:67`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.test.ts:8` and `:98`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.test.ts:7` and its native-parent-expiry test.

**Causal failure:** the V3 fixture guard requires an injected control `transport`, but does not require an injected `streamFactory`. The subsequent nullish default therefore chooses `defaultStreamFactory` when the fixture omits the stream constructor or supplies `undefined`. After mock inspect/create/start responses, line 277 invokes that default with `docker exec -i <containerId> node ...`; the default creates a native Worker, whose source calls `child_process.spawn`. Thus a fixture-authorized 5000 ms grant reaches native process construction. Requiring an injected factory `createRuntime` does not seal the chain: that callback may invoke the real planner with only a mock control transport, and planner line 83 accepts it.

**Bounded reproduction construction, not executed:** issue a genuine fixture V3 authority from a durable temporary `cell-start`, make the factory/planner claims, and invoke the session with the exact binding plus a mock control transport returning absent/created/started state, but no `streamFactory`. This is exactly the constructor shape in the new session test at line 98. Without the module-wide Worker mock, it reaches native `spawn`; whether Docker subsequently succeeds is irrelevant to the prohibited launch. No live probe was performed.

**Test reliability:** the new native tests globally replace Worker while `nativeStreamMock.worker` is populated, so the accepted default-constructor configuration does not actually launch in those tests. Passing them proves the mocked native transaction's wait argument, not fixture/default-live isolation. The planner test deliberately sets `streamFactory: undefined`, reproducing the same gap under its Worker mock.

**Fix:** reject fixture V3 authority unless both control transport and an explicit fixture stream constructor are present, at planner/session entry before claims or construction. Keep empirical injected overrides denied. To test the real native transaction logic, provide a narrow process-local test-only Worker/transaction seam or extract that logic for explicit injection; do not let a fixture grant select the live default constructor. Add missing/undefined stream regressions with native/control constructor sentinels proving zero dispatch. This repair can be V3-only, preserving V1/V2/default semantics.

### CR-02 — BLOCKER: retained failed V3 responses skip admitted provider-root joins

**Primary file/line:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:955`.

**Related evidence:** same file `:899`–`:901`, `:967`–`:972`, `:1186`, `:1234`–`:1236`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.ts:358`, `:76`–`:93`, `:238`, `:263`–`:266`, `:297`–`:301`.

**Causal failure:** the successful-response reader explicitly checks V3 tuple ID/root, runtime-limits root, image, and factory packet/proposal/validation roots against the admitted allocation and the selected source closure. Failed production is instead verified by `verifyRetainedProductionFailures`. That path only requires runtime records to link to a response charge. A charged issuance failure with no result/execution reaches line 955 and skips all provider-identity validation, even when cleanup records exist. With execution evidence, lines 967–969 check source/attempt/budget/revision but never the tuple/image/limits/factory joins. Lines 961–962 only establish mutually consistent raw/accounting evidence and kernel behavior; `verifyRetainedLeagueProbeInvocations` has no expected allocation/provider argument. For prior completed Matches in a subsequently failed production, line 972 also lacks the prospective checks from successful-response line 358.

**Accepted-path construction, not executed:** start from a source-current fixture V3 run with a valid marker/reservation/capacity, imported candidates, preceding round/ledger records, a valid `response-production-start`, and one valid ordinal-0 `response-match-start`. Have the first source-only fixture provider return a normal source/attempt/budget/revision identity but a different image or runtime-limits root, and the second fixture constructor throw before any Match runs. The response catch/finally retains the first provider's cleanup, `matchCount: 1`, a production-failure record, and the matching system-failure factory/red-team terminals. In the retained reader, the cleanup passes the charge-link check at lines 899–901; the normal start/author/target/terminal joins remain intact; charges=1/results=0 passes lines 947 and 952; no execution/invocation-failure permits line 955's `continue`. The caller invokes this reader at line 1186 and can return `issued: false, processValidity: process_invalid` at line 1236 without rejecting that wrong provider root. A coherent retained-graph rewrite of only that cleanup identity has the same omission, provided graph/terminal content roots are recomputed normally.

This is a failure-evidence attribution defect, **not** a route to a successful payoff, re-entry, freeze, or LEAG credit. It matters here because the approved V3 contract requires admitted provider/source/runtime joins on retained main/response paths, including honest charged failure prefixes. The omission predates V3 in the old failure helper; the new V3 selector exposes it to the newly approved route.

**Fix:** add V3-only expected-provider checks before the no-execution `continue`, for every available cleanup/invocation/failure identity. Derive the measured/opposing source closure for the exact purpose/seat (including `independence_right` and equal-source self-play), bind attempt/budget/revision plus admitted tuple ID/root, limits root, image, executable source and factory closure roots, and apply the same checks to supervision metadata in completed prefixes of failed production. Do not require fabricated cleanup for a provider whose constructor never returned. Share a small expected-binding validator with the successful V3 response path where practical. Add source-only negative fixtures for wrong image/limits/factory roots in both no-execution issuance failure and execution/completed-prefix failure; preserve existing V1/V2 history and process-invalid disposition.

### WR-01 — WARNING: malformed inner legacy response leaves the direct session active

**Primary file/line:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:314`.

**Related evidence:** same file `:230`–`:237`, `:309`–`:310`, `:279`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.ts:149`–`:153`; the session's private inner-response tests and planner malformed-inner tests.

**Causal failure:** `runMethod` poisons on outer/frame/transport failure, but returns before `strictJsonResponse` runs. A correctly correlated status-0 outer response containing inner `null`, invalid JSON, surplus keys, or a schema-invalid runtime result throws outside the poisoning catch. The direct session therefore remains `active` and permits a second exchange after malformed IPC. The real planner catches this error and closes its session, which limits the production impact; the direct session contract still does not enforce the claimed fail-closed behavior itself. This is pre-existing adapter behavior inherited by V3, not a new deadline-classification change.

**Bounded reproduction construction, not executed:** use a genuine fixture V3 grant and explicit mock transports; return a valid outer frame whose canonical base64 stdout decodes to `null`. Catch `adapter.execute`'s MALFORMED_IPC error, then inspect `session.state` or call `execute` again. The first parse error does not reach line 310's catch, so the state is still active and the second request can dispatch. Existing inner-response tests check diagnostic origins/explicit close but do not assert immediate poisoned state and zero second dispatch.

**Fix:** for the authorized V3 legacy path, include inner JSON/schema admission in the poison-on-failure boundary, preserve the original error/private origin, and add a one-frame/one-cleanup/no-second-dispatch regression for valid-outer/invalid-inner responses. Do not reinterpret it as a Strategy timeout. Keep historical no-grant behavior unchanged unless separately authorized.

## Inspected contract evidence and limits

- Allocation V3 adds the exact `operations.hostResponseReceiptMilliseconds: 5000` and the exact host approval identifier. Its projection removes only that field before delegating to the existing V2/V1 admission logic; Match remains 600000 ms and the other approved policy bounds are not numerically changed. This is static constructor/diff evidence, not a fresh empirical allocation.
- Explicit V3 selection is present in preparation, admitted allocation unions, capacity/reservation/source-current logic, main/response issuance and the successful retained joins. CR-02 limits the retained-failure claim.
- The host authority is issued into a private WeakMap, freezes cloned bindings, reopens durable main/response records, checks the response production parent, and requires ordered one-use factory/planner/session claims. Empirical issuance/claims compare the actual source inventory. Main issuance follows durable cell start; response issuance follows Match charge and uses distinct measured/opposing attempts for score/left/right purposes, both seats and self-play. CR-01 limits fixture isolation.
- The encoded legacy broker request remains 1000 ms; `stream.exchange` alone receives the authorized 5000. The alternative V1.17 request still encodes its signed 50 ms method, existing 100 ms cancellation grace and unchanged startup-plus-method-plus-grace aggregate. The unchanged observer's bounded authenticated D/late-receipt logic and the adapter's TRANSPORT_CRASH system-failure path were inspected; no host-wait-only Strategy-timeout inference was found. WR-01 limits direct legacy malformed-inner poisoning.
- Planner accounting is charged before dispatch; wrapper retention is awaited before issuance/return, and the inspected cleanup/error handoffs remain present. No test/CI gate removal or strict-TypeScript flag weakening was found in the diff. The native tests' isolation gap is part of CR-01, not dismissed as test style.
- Replacement fixtures use the canonical game/input constructors or the exact factory packet/proposal/validation fixtures, with the former planner input golden roots and canonical source-hash assertions retained. Complete fake-provider timing/accounting interfaces were inspected. Their reported successful type checks are not an independent execution result from this review.

## Identity computation and verification performed

The production closure was actually recomputed twice using the existing safe source-only `factoryAssessmentImplementationManifest()` and `labRoot("league-reviewed-source-bytes-v1", manifest.entries)`. Its 858 sorted production/config entries exclude tests, planning, dependencies and generated outputs under the existing inventory rules. Both calls returned exactly the frontmatter roots. The new host-receipt source entry was present with raw-byte hash `sha256:7cce7b6a98fac43386b751bd440dcaff019da98eff982d2dc42285427de0b324`.

The only executed TypeScript operation was that read-only inventory/hash computation, not an executable CLI mode. HEAD was checked before and after source inspection and remained `50a104041e947d901fd5a39f2c836bea494c6fbd`. Source files were not edited. The report is the only new review output and is left uncommitted for the parent.

Context consulted: AGENTS and current PROJECT/REQUIREMENTS/STATE/ROADMAP/research SUMMARY; Phase 265 CONTEXT; HOST-RECEIPT PLAN/RESEARCH; actual `265-PROSPECTIVE-HOST-RECEIPT-APPROVAL-20261002.md`; ALLOCATION/RUNTIME summaries. Relevant imported inventory, runtime observation and admission/retention context was inspected without reopening old empirical routes.

Authors' summaries report allocation 17 passing tests/type checks; runtime five-file focused selection 49 passed/368 skipped in 108.54 s; golden fixture selection 1 passed/74 skipped; source-closure selection 1 passed/142 skipped; and augmented strict TypeScript success. These are **reported, not rerun**. No tests, all-eight CI gate, provider/model/process/Docker/Match/capacity/route/helper/retained empirical verifier was launched by the reviewer. Static mock assertions are not empirical equivalence or default-constructor isolation proof.

## Handoff boundary

Fix the findings within the approved source-only scope, commit source under parent control, and independently re-review the resulting exact HEAD/actual roots before the full fixed-source gate. This report cannot satisfy a `status: clean` gate.

No LEAG-01–09, league/freeze, matrix/solver/response closure, portfolio/finalist or Phase 265 completion credit follows from this review. V11 and other consumed artifacts remain immutable; holdout was not opened; no formation/public/counted/production authority was created. Existing untracked empty/result-v8/recovery/cache/lock files were preserved.
