---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-supervisor-retest-supplement
artifact: independent-plan-check
revision: 2
status: issues_found
checked_plan: 265-16-SUPERVISOR-RETEST-PLAN-v1.md
checked_plan_sha256: 79939b01b219e61aef979a627048f72d33b70c4d9418a0c695f3e01cb5f697aa
prior_check: 265-16-SUPERVISOR-RETEST-PLAN-CHECK-v1.md
prior_check_sha256: 1bb2564e80d80ef525a0f5c86792c3fb6827681f47556e5b04612c2b87358514
approval: 265-16-SUPERVISOR-REPAIR-RETEST-APPROVAL-20261008.md
approval_sha256: afcf21517053fae1828b33936543e5a78d3ccb93eae794161d24e895156210cb
research: 265-16-SUPERVISOR-RETEST-RESEARCH-v1.md
research_sha256: bad63bfb287d059313cb36e20ca4ea50e087913c7dd92ccadbf6307f766aac69
source_reviewed: false
source_verified: false
empirical_admission: false
---

# Independent plan check v2 — supervisor retest v12-1

## Verdict

**BLOCKED.** The revised request/review root graph is acyclic as specified, and the approval bounds remain unchanged and exact, but the plan still points its pre-source-edit gate and positive source inventory at the blocked v1 check artifact. Amend those references to the latest passing plan-check artifact, then re-check the exact revised plan. The prior v1 check artifact remains preserved.

## Root-graph recheck

The plan now defines `requestDataRoot` by excluding exactly `authorizationRoot`, `dataReviewPath`, `dataReviewRoot`, `helperReviewPath`, and `helperReviewRoot`. It retains `helperPath` and `helperBytesRoot` in the semantic input. The excluded paths are still constrained to canonical route-specific destinations by the strict request reader; the final request, authorization, and allocation bind the actual review roots and bytes downstream.

The construction order is now explicit and acyclic: construct semantic inputs and fixed helper paths; produce helper bytes and their hash without embedding their own hash or downstream roots; derive `requestDataRoot`; bind that root and exact helper bytes in independent reviews; bind the actual helper review in authorization; then bind both actual review roots and canonical authorization bytes in the finalized request. The added regression covers placeholder-to-real replacement of all excluded fields, confirms semantic/helper-byte mutations change the request root, and requires changed final review bytes to fail strict custody.

The previously observed implementation pattern remains an appropriate reference: `leanCorrectionRequestDataRoot` removes `dataReviewPath` and `dataReviewRoot`; the existing v11 path also removes helper-review fields and authorization from the semantic root. The revised v12 contract is explicit and does not claim an implementation has been changed or tested.

## Additional blocker: stale plan-check gate and inventory path

The plan still says `265-16-SUPERVISOR-RETEST-PLAN-CHECK-v1.md` must pass before source edits (line 88), although that exact artifact is preserved with `status: issues_found`. Its source manifest also positively includes `PLAN-CHECK-v1` (line 145), omitting this current v2 check. The workflow therefore has no valid executable gate as written and does not inventory the latest plan-check evidence.

**Required minimal amendment:** Point the pre-source-edit gate to the current/latest passing check artifact and positively include that exact current check artifact in the v12 source manifest. Do not overwrite v1. This is a path/inventory correction only; it does not require a new approval, source change, or resource change. The revised plan will have a new raw hash, so it requires a fresh plan-check artifact bound to that revised hash before source edits. The manifest can include the plan-check artifact by path/raw bytes without a self-hash loop: the check binds the plan hash, while the plan names the check path and does not embed its output hash.

## Approval-bound recheck

Compared against `265-16-SUPERVISOR-REPAIR-RETEST-APPROVAL-20261008.md` (unchanged SHA-256 recorded above):

- Prior allowance is fully debited at 108,000,000 ms; new allowance is exactly 28,800,000 ms; cumulative ceiling is 136,800,000 ms.
- Continuous start is `1791455941097`; deadline is `2026-10-08T18:39:01.097Z`; no reset, idle subtraction, refund, or extension is specified.
- All 34 prior charges and surviving files/costs are carried. The plan retains the 15,000,000,000-byte/300-Match bounds and 1,860,000 ms reserve.
- Guest/host/startup/Match limits remain 1,000/5,000/2,500/600,000 ms; scratch remains 2,000,000,000 bytes; external allowance and guard remain 512,000,000 + 335,544,320 bytes; Node old-space remains 768 MiB.
- Parent sampling remains 250 ms. The unrelated Phase 262 200 ms sampler is explicitly excluded.
- Only v12-1 ordinal 1 is in scope: at most one diagnostic and only its own conditional one 36-cell baseline. A baseline requires that diagnostic’s full accepted check and actual accepted `FINAL`. Refusal, failure, or inadequate reserve/time closes the pair.
- Fresh distinct author/reviewer, fresh route-specific data/helper reviews, committed immutable allocation, fresh empty owned mode-0700 store, fresh same-process capacity before each charge/provider, and exact source/HEAD hold through terminal and exactly one appropriate independent check are required.
- The v11-2 carry `2cb8f651` remains historical, finite, nonauthorizing custody. The plan prohibits old ordinary readers, accepted-authority reuse, current-source reinterpretation, fabricated entry/result, or mutation of consumed artifacts. It claims neither a native-memory cure nor a 36-cell-fit result.

## Other checks and acknowledged warning

The plan remains an additive supplement to Plan 16. Its execution dependency is serial: source implementation and independent source gates precede MAIN-owned actual request/helper/allocation work; one diagnostic’s own accepted closure and `FINAL` alone can permit the conditional baseline. The v12 reason envelope remains additive, finite, privacy-safe, and fail-closed; legacy v1 behavior is explicitly preserved. No new game-rule behavior or deferred scope was identified.

The v1 scope warning (Task 1 spans 12 implementation/test files and multiple connected seams) is acknowledged and nonblocking for this approved bounded work. The plan says not to expand into unrelated phase/rules/resource changes and keeps the supervisor/admission contract connected.

No tests, source edits, commits, application runs, allocations, or empirical actions were performed for this recheck. `source_reviewed`, `source_verified`, and empirical admission remain false.

## Structured issue

```yaml
issues:
  - plan: "16-supervisor-retest-supplement"
    dimension: "dependency_correctness"
    severity: "blocker"
    description: "The pre-edit gate and positive source inventory still name PLAN-CHECK-v1, which is blocked, and omit the current v2 check."
    fix_hint: "Reference the latest plan-check artifact in the pre-edit gate and positively include that exact artifact in the source manifest; preserve v1 and re-check the revised plan hash."
```
