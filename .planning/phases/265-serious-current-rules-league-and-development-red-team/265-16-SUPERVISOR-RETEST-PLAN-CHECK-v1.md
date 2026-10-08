---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-supervisor-retest-supplement
artifact: independent-plan-check
status: issues_found
checked_plan: 265-16-SUPERVISOR-RETEST-PLAN-v1.md
checked_plan_sha256: 957839b6002cacb8404982285e0f08930912ed2ab6dd4594bb7c6ec5ace366ea
approval: 265-16-SUPERVISOR-REPAIR-RETEST-APPROVAL-20261008.md
approval_sha256: afcf21517053fae1828b33936543e5a78d3ccb93eae794161d24e895156210cb
research: 265-16-SUPERVISOR-RETEST-RESEARCH-v1.md
research_sha256: bad63bfb287d059313cb36e20ca4ea50e087913c7dd92ccadbf6307f766aac69
debug_sources:
  - path: .planning/debug/supervisor-sampling-repair.md
    sha256: 312d13066392cd490750317d0c191aefb658f93a1c9c2850e3fcf1b5166c2636
  - path: .planning/debug/v11-2-resource-sampling.md
    sha256: fe191224cb2bb6641abe918d08fd1c03345e4847a64660b0d81e22d0cf01ec0e
source_reviewed: false
source_verified: false
empirical_admission: false
---

# Independent plan check — supervisor retest v12-1

## Verdict

**BLOCKED before source edits.** The plan has one blocking dependency-cycle defect in its request/review root graph. Amend the plan’s root derivation rule before execution, then re-check the exact revised plan. This is a plan-contract finding only; no source tests, source edits, allocations, providers, or empirical actions were performed.

## Blocker

**[BLOCKER] The declared `requestDataRoot` includes the data-review identity that the data-review bytes must themselves bind.** The request schema includes both `dataReviewPath` and `dataReviewRoot` (plan §Exact new route and contract specification). The plan then says to derive `requestDataRoot` by removing only `authorizationRoot` and `helperReviewRoot`. Thus the data-review root remains an input to `requestDataRoot`, while Task 2 requires the independent data-review bytes to bind `requestDataRoot`; the resulting graph is circular and cannot be constructed as specified. The plan’s assertion that “Review→helper→authorization root graph is acyclic” does not resolve the data-review self-reference.

This is confirmed against the existing seam rather than inferred from wording: `leanCorrectionRequestDataRoot` in `scripts/run-v1-38-lean-correction.ts` removes `dataReviewPath` and `dataReviewRoot` before hashing; the existing v11 helper-review identity additionally excludes `helperReviewPath` and `helperReviewRoot` plus `authorizationRoot`, while retaining helper bytes as the plan requires. The focused request-root test at `scripts/run-v1-38-lean-correction.test.ts` verifies that changing data-review, helper-review, and authorization roots does not change the semantic request root. The new v12 contract should follow this acyclic pattern, with exact v12-domain/schema keys and the required helper-byte binding.

**Required amendment:** Define the v12 semantic request root as excluding `dataReviewPath`, `dataReviewRoot`, `authorizationRoot`, `helperReviewPath`, and `helperReviewRoot` (or an equally explicit acyclic construction); keep `helperPath` and `helperBytesRoot` inside the semantic input as stipulated. State the construction order: semantic request → helper bytes → independent data/helper review bytes over semantic root and helper bytes → authorization over those reviews → finalized request over canonical authorization bytes. Add a test that changing either review path/root or authorization root leaves `requestDataRoot` stable, while changing helper bytes changes it; verify strict canonical validators bind each excluded field at its later, correct seam.

## Coverage verified

- The supplemental plan is additive to existing Plan 16 and has an acyclic execution sequence: source task and independent source gates precede MAIN-owned authoring and the single diagnostic opportunity; only that diagnostic’s own accepted check plus actual accepted `FINAL` permits its conditional baseline.
- The cap and accounting contract matches the fresh approval: prior 108,000,000 ms debit plus exactly 28,800,000 ms; continuous floor from `1791455941097`; cumulative cap `136800000` ms; deadline `2026-10-08T18:39:01.097Z`; 34 spent charges; 15 GB/300 Matches; 1,860,000 ms reserve; 2 GB scratch, external bytes/guard and 768 MiB old-space. It preserves the 250 ms parent cadence and explicitly excludes the unrelated Phase 262 200 ms sampler.
- The route is limited to `v12-1`, ordinal 1, with exact route-specific new destinations and explicit rejection of v12-2, ordinal 2, and old/new cross-family material. Task 1 connects mode, cap, CLI/shell, allocation, setup, parent entry and ordinary/terminal retained consumers rather than merely defining helpers.
- The reason-v2 contract is additive and finite; v1 remains unchanged. It preserves sticky uncertainty, first-throw attribution, kill attempts, fail-closed behavior and the 4096-byte bound; unknown provenance remains refused. The plan does not infer the historical native cause or promise an RSS cure.
- Historical v11-2 carry `2cb8f651` is expressly finite accounting custody only: no old ordinary reader, accepted authority, current-source reinterpretation, invented entry/result, or modified old bytes. New admission requires the current source identity and fresh reviews.
- Task 2 spells out the unique diagnostic and one appropriate actual-result/terminal-only check, forbids checker replay, and holds exact source/HEAD through terminal and that check. A baseline has its own fresh data/helper review, allocation, store and capacity gate and cannot run absent the diagnostic’s own full accepted closure and actual `FINAL`.
- The v12 manifest includes the check artifact by path, so after this finding is amended the new manifest must bind the revised check report bytes and exact plan bytes without a self-hash. Existing and supplemental dependencies are serial; no cycle was found in the plan execution graph. The identified cycle is specifically in the data/review identity graph.

## Warning

**[WARNING] Task 1 spans 12 implementation/test files plus new reports and couples parent instrumentation, strict readers, routing, and source closure.** This is a large single task, although the plan explicitly keeps the cross-cutting contract together and requires bounded focused validation. Keep execution to its stated seams and stop rather than broadening it.

## Scope and authority

No plan requirement was silently reduced; no conflict with the stated frozen bounds or fail-closed project constraints was found. No `source_reviewed`, `source_verified`, or empirical status is claimed by this artifact. The checker inspected plan, approval, research, debug notes, the existing Plan 16 source gate, and the live request-root helper/test only to resolve the specified dependency concern. No application execution or tests were run.

## Structured issues

```yaml
issues:
  - plan: "16-supervisor-retest-supplement"
    dimension: "cross_plan_data_contracts"
    severity: "blocker"
    description: "requestDataRoot includes dataReviewRoot although data-review bytes bind requestDataRoot, creating an impossible self-referential root graph."
    fix_hint: "Exclude dataReviewPath/dataReviewRoot as well as authorizationRoot and helperReviewPath/helperReviewRoot from semantic requestDataRoot; retain helperBytesRoot; specify downstream binding order and add root-mutation tests."
  - plan: "16-supervisor-retest-supplement"
    dimension: "scope_sanity"
    severity: "warning"
    description: "Task 1 lists 12 implementation/test files and combines several connected supervisor/admission seams in one task."
    fix_hint: "Keep changes within the listed bounded seam and focused checks; do not expand scope."
```

**Recommendation:** Return the plan for the root-graph amendment. Do not begin source edits until the revised plan passes this check.
