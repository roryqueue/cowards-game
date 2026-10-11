---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-11T14:56:16Z
depth: standard
source_base: 75489aab
source_commit: dc60ba20
files_reviewed: 4
files_reviewed_list:
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/run-v1-38-lean-private-matches.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
---

# One-Match diagnostic independent source re-review v2

## Narrative Findings (AI reviewer)

No remaining blocker or warning found in the exact four-source-path fix delta `75489aab..dc60ba20` and its surrounding composer/entry/retained-reader control flow. This scoped disposition closes the two findings from SOURCE-REVIEW-v1; that report remains unchanged. It is not a full Phase review, test pass, empirical admission or retained verification.

### CR-01 disposition: closed by source inspection

The named V1 and V2 private exports now authenticate through their own opaque context reader before calling the shared composer. The shared composer receives a private explicit authenticated version/context instead of choosing an owner from a caller's schemaVersion. Genuine opposite-version handles therefore reach the wrong version's WeakMap lookup and refuse before source/provider work. The amended real authority fixture obtains genuine capacity/admission/debit handles for both versions, invokes the opposite named export, and asserts refusal with no source validation or provider creation. This covers both directions, not only structurally forged handles.

### CR-02 disposition: closed by source inspection

The V2 entry now marks terminal publication before the exclusive writer. If that writer throws before a completed terminal is recorded, entry refuses closed and its finally block still closes registered providers: no terminal rewrite, result fabrication or retry. If terminal publication completed and debit close then throws, the committed terminal is retained unchanged, stopCode becomes CLEANUP_STOP, no second terminal writer is called, and result closure can proceed. The actual reader's feasibilityEstablished predicate requires a null stopCode, so this closure cannot receive feasibility credit even if the preserved terminal's Match evidence describes success.

The added inert fixtures invoke the actual entry with the real composer/producer and actual retained reader, while mocking authority/provider/kernel side effects. The close-refusal fixture asserts one debit, two inert providers, one canonical composition, one unchanged terminal, one ledger row, finite retained output, CLEANUP_STOP and no feasibility credit. The uncertain-publication fixture throws after the real writer creates the terminal and asserts one writer attempt, one debit, no result, no close call and unchanged bytes. This explicitly distinguishes a committed close refusal from uncertain immutable publication; it does not promise a reader-acceptable result when durable publication itself is uncertain.

## Scope and release

The two production changes do not alter the reviewed finite diagnostic, true origin.reason projection, missing-origin code retention, carry/window/resource policy, V2 authority owner, V1 parser/default, current rules or runtime limits. Those original seven-path findings and context remain in v1; this report reviews the narrow fixes, not a new seven-path audit.

No tests, source gates, runtime, metadata, preparation, allocation, Strategy/provider/container/Match or actual retained-reader commands were run by this reviewer. The isolated-worktree test collection limitation and ROOT's pending main-checkout validation are not represented as passing tests. No source/test edits, historical scans, commits or pushes occurred. Only this new report was written. All read commands are closed and review ownership/source hold is released to ROOT. ROOT validation and distinct source verification remain mandatory before any admission, within the unchanged 14:58:43 UTC entry frontier and 15:39:43 UTC hard stop. No LEAG/baseline/full-Chronicle/freeze/formation/holdout/public/counting/production/Phase or milestone completion follows.
