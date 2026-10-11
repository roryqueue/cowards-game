---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-11T14:48:51Z
depth: standard
source_base: a1c8760e
source_commit: 75489aab
files_reviewed: 7
files_reviewed_list:
  - scripts/run-v1-38-lean-private-matches.ts
  - scripts/run-v1-38-lean-private-matches.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-match.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# One-Match diagnostic independent source review

## Narrative Findings (AI reviewer)

Reviewed the exact seven-path delta `a1c8760e..75489aab`, surrounding authority/composer/producer/reader logic, and connected inert fixtures. Approval, plan, plan check, research, validation and AGENTS instructions were preloaded. This is source review only, not empirical admission, retained verification, LEAG, baseline, freeze or Phase completion.

## Critical Issues

### CR-01 — BLOCKER: version-specific composer entry points accept the opposite route

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-match.ts:119-126`

**Issue:** Both exported private composer functions pass directly to the same dispatcher. The dispatcher selects V2 solely from the supplied admission's schemaVersion, irrespective of which export was called. A genuine V1 admission/debit passed to `runLeanPrivateFeasibilityMatchV2` therefore authenticates against the V1 WeakMaps and executes the V1 two-Match context; genuine V2 handles passed to the legacy export execute V2. TypeScript annotations do not enforce this runtime boundary. The separate authority owners correctly reject cross-version handles, but these public composition entry points silently select the matching owner instead of refusing the wrong route. This violates the explicit no-cross-version/no-old-route-reuse composition contract and changes the legacy entry point's accepted runtime behavior. It does not create new charges by itself; it is an incorrect route boundary.

**Fix:** Each private export must first authenticate exclusively through its named version's context reader (including opaque-handle validation), and pass an explicit authenticated route/context to the shared implementation. Refuse the opposite route before source validation or provider creation. Add genuine V1-to-V2 and V2-to-V1 export tests, not only structurally forged handles.

### CR-02 — BLOCKER: post-terminal close failure attempts an impossible exclusive rewrite and loses result closure

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-matches.ts:515-522`

**Issue:** The normal branch exclusively creates `terminal-0.json` and pushes it before calling `closeLeanPrivateMatchDebitV2`. That close operation performs JSON parsing and safe-fd reads and can throw. Such a throw enters the broad catch, which builds another terminal and calls `writeLeanPrivateMatchFileV1` at the same path. That writer uses `O_CREAT | O_EXCL`, so the second write necessarily throws `EEXIST` after a successfully committed first terminal. Entry then rejects before `result.json` is written; the immutable retained reader requires result.json and cannot accept this already-charged attempt. A throw after the first terminal's exclusive creation but during its fsync/read-back similarly leaves an existing file which the catch cannot replace. The failure-closure claim is therefore false on a post-terminal refusal, precisely where the approved one-shot diagnostic cannot retry.

**Fix:** Separate pre-terminal production failure from post-terminal close refusal. Once a terminal has been durably committed, preserve its bytes and record a finite failure/cleanup stop in the result without attempting a second terminal creation. For an uncertain partially committed terminal, use an explicit safe closure policy that never overwrites immutable evidence or pretends it was absent. Add an inert V2 entry fault fixture that throws from close after terminal creation and asserts one terminal, one durable charge, no second dispatch, and an actual reader-acceptable failure result.

## Other inspected boundaries and limitations

The V2 capacity/admission/debit WeakMaps are separate from V1; ordered two-seat issuance and one ordinal-0 debit are explicit. Window values match the fresh approval, historical charge carry is 41, pinned spent inventory/reader commitments are authenticated by bounded reads, and V1 predicates/window constants are not widened. Native guest/startup/host/Match limits and canonical kernel/source bindings remain in place. The existing composer invocation guard still enforces the Match ceiling.

The V2 diagnostic is issued through a private return WeakMap. Actual charged failed evidence is verified against its owner, finite native code survives missing origin, and authenticated origin uses its actual reason rather than the legacy derived stage-as-reason mapping. Producer/reader schemas join identity/invocation/request/input/method/ordinal to a unique charged failure and retain terminal/result raw anchors. Connected fixtures exercise the real composer return, real producer and real retained-store reader with inert provider/kernel/accessor doubles; finite code without origin, unavailable evidence, duplicate candidates, bad origin/code, joins, schema keys, stale result anchors, privacy sentinel removal and read-only retained reads are covered. These fixtures manually construct terminal/result records and do not exercise the V2 entry's post-terminal exception path implicated in CR-02.

No independent tests or source gates were run. Author-reported 68 test passes, runtime-js/boundary checks and 13 inherited strict diagnostics are not promoted to independent verification. No canonical metadata, preparation, allocation, provider/container/Strategy/Match, actual retained reader or historical scan occurred. No source or tests were changed, and no commit/push occurred. Only this report was written. All read commands are closed; review ownership/source hold is released to ROOT. Fixes and independent re-review are required before admission.
