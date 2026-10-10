# Two-Match additive Git-owner plan check v3

## ISSUES FOUND

Scope ONLY: additive bounded Git-owner integration supplement in TWO-MATCH-PLAN-v1, existing readLeanPrivateProbeGitV1 and relevant factory monitor loader rules. No ongoing six-path implementation inspected. No Git helper, tests, prepare, runtime, provider, Strategy, Match or reader invoked. Only this new report written; no source/history/STATE/previous reports edited, no commit/push. All commands closed; ownership released on delivery.

**1 BLOCKER:** the supplement adds `scripts/lib/v1-38-lean-container-match-session.ts` as a fourth production owner but still limits dirty checks to “exactly the three owned production paths.” That owner controls the new Git metadata boundary and must be included in fixed-source checks. Require exactly FOUR production paths (runner, authority, baseline composer, container-match-session) for prospective dirty/source-hold checks. Current-prefix committed-blob comparisons remain mandatory but do not justify explicitly excluding this new execution-owning path from the fixed-source dirty gate.

```yaml
issues:
  - plan: "265-16-two-match-private-feasibility-v1"
    dimension: key_links_planned
    severity: BLOCKER
    description: "New fourth production Git owner is excluded by the supplement's exactly-three-path dirty check, leaving the explicit fixed-source gate incomplete."
    fix_hint: "Change the finite dirty whitelist to exactly four production paths including scripts/lib/v1-38-lean-container-match-session.ts; preserve exact committed/current equality and source hold."
```

The architecture otherwise passes: existing probe API accepts only HEAD, parent lookup and its two exact allocation blobs; extending that predicate would widen old routes, whereas the separate `readLeanPrivateMatchGitV1` preserves it. The factory monitor already permits node:child_process solely at the existing session owner path (`scripts/check-v1-38-factory-boundaries.ts:149`); new runner/authority should import the finite metadata helper, not spawn Git or change monitor policy. Git-only1500ms, exact40hex commits, one canonical allocation, finite source prefix/100paths/16MiB, per-command output limits and current allocated-block debit are appropriate. Historical carry remains immutable; new allocation/store charged separately without self-hash recursion.

Implementation clarification within “safe scripts/.planning paths/reject unsupported arguments”: reject control/newline/NUL, colon, absolute paths, empty/dot/dotdot components, pathspec magic/wildcards and traversal; construct only the named Git commands/flags and enforce count/aggregate limits across the source-prefix read, not independently per unbounded caller loop. This is interpretation of the finite safe whitelist, not a new framework or scope.

Prior v2 compact-board scoped PASS remains unchanged except this new gate; no phase/LEAG/Chronicle qualification or empirical admission is granted. Once the four-path amendment is explicit, this narrow supplement has no remaining identified blocker.
