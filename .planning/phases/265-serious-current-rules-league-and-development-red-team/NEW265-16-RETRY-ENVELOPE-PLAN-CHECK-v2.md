# Plan Check — NEW265-16 Retry Envelope v2

**Status: ISSUES FOUND**  
**Scope:** Recheck of the revised plan against v1's three blockers only. Source inventory was limited to the actual authority, baseline, and closure owners/tests named below. No implementation, tests, runtime, Match, private payload, or history scan was performed.

## Resolved from v1

- **Closure lifecycle:** The plan now distinguishes three mutually exclusive cases: accepted result/head with one reader and accepted check; present result/head with one refusing reader and a non-authorizing refusal receipt; and absent result/head with terminal-only validation. It explicitly bars terminal-only validation for present-result refusal, defines which closure can authorize a successor, and reserves baseline authorization for the accepted-check plus same-attempt reader-close case. The referenced production closure owner is `scripts/lib/v1-38-lean-correction-retained.ts`, whose current v7 terminal-only validator checks actual result absence.
- **Worker/MAIN sequencing and commit authority:** Task 3 now assigns the source inventory, final worker handoff, source/test/planning-doc commits and push to the worker; MAIN alone performs independent review/fix, re-manifest/commit, validation, then source verification, with post-repair gates bound to the final identity. It explicitly authorizes source commits while reserving empirical/allocation commits to MAIN's later gate. This resolves the previous ambiguity.
- **Primary authority/baseline owners:** Task 2 now assigns `scripts/lib/v1-38-lean-experiment-authority.ts`, `scripts/lib/v1-38-lean-baseline-source.ts`, and `scripts/run-v1-38-lean-baseline.ts`, plus their authority/source/executor tests.

## Blocker

1. **[BLOCKER — artifact_completeness / key_links_planned] Baseline retained verification remains outside the implementation and test ownership.** The actual baseline retained consumer is `scripts/lib/v1-38-lean-baseline-retained.ts`, called by `scripts/run-v1-38-lean-baseline.ts`; its corresponding connected test is `scripts/lib/v1-38-lean-baseline-retained.test.ts`. Neither file is listed in Task 2's `<files>`, despite Task 2's claims that ordinal and accepted-check/final-close joins are proven at the baseline reader, and that every inventoried consumer rejects stale or caller-asserted authority. Task 3's generic inventory/manifest does not assign implementation of that consumer. This leaves a real authorization/readback path without an owned ordinal/eligibility change or direct regression test. **Fix:** add both files to Task 2 and include them in the explicit producer-to-retained-reader test and Task 3 final test/manifest coverage.

## Structured issue

```yaml
issues:
  - plan: NEW265-16-RETRY-ENVELOPE-PLAN-v1
    dimension: artifact_completeness
    severity: blocker
    description: "The actual baseline retained verifier and its test are not assigned to an implementation task, although the plan requires the baseline reader to enforce ordinal and accepted-check/final-close authority."
    files:
      - scripts/lib/v1-38-lean-baseline-retained.ts
      - scripts/lib/v1-38-lean-baseline-retained.test.ts
    fix_hint: "Add both files to Task 2 and require connected baseline producer-to-retained-reader eligibility coverage in the final verification manifest."
```

**Recommendation:** Revise the plan once more to assign the retained baseline verifier and its test before execution. The other two v1 blockers are resolved.
