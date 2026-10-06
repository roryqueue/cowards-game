---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-06T16:15:33Z
depth: standard
source_commit: 1df78472446cb756aa060f279e96dc612e4885ee
diff_base: 2cdbfd4d
independently_reviewed: true
author_agent: /root/retry_envelope_worker
reviewer_agent: /root/review_265_retry_envelope
files_reviewed: 13
files_reviewed_list:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/lib/v1-38-lean-baseline-match.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/lib/v1-38-lean-baseline-source.ts
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/run-v1-38-lean-baseline.test.ts
  - scripts/run-v1-38-lean-baseline.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-host-stage-v8.test.ts
  - scripts/run-v1-38-lean-retry-envelope-source-manifest.ts
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
empirical_executed: false
---

# Phase 265 Plan 16: Retry Envelope Code Review

## Narrative Findings (AI reviewer)

### Summary

Reviewed the thirteen changed source/test files at fixed HEAD, tracing the v8 allocation, CLI, publisher, issuer, parent, actual retained reader, closure and selected baseline consumers. The sealed approval/plan and worker summary/source inventory establish the intended scope, not correctness. Three incorrect lifecycle/accounting behaviors block readiness. No source, test, consumed artifact or empirical/private payload was modified; no live reader, capacity, provider, Strategy, Match or native process was invoked, and no new test run is claimed by this review. MAIN owns any repairs and subsequent independent gates.

## Critical Issues

### CR-01: BLOCKER — Baseline authority requires the diagnostic's HEAD after a mandatory new allocation commit

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-retained.ts:26`

**Issue:** `closure.head !== head` compares the accepted diagnostic's immutable entry HEAD with the baseline's own entry HEAD. The baseline allocation can only be prepared after actual diagnostic acceptance, and must then be committed before its unique entry. That allocation commit necessarily changes HEAD. The actual parent authenticates `HEAD:<allocationPath>` and captures current HEAD (`scripts/run-v1-38-lean-baseline.ts:312-315`), so a legitimate baseline cannot reuse the diagnostic entry HEAD. Its first source publication calls this shared gate (`scripts/lib/v1-38-lean-baseline-source.ts:106`), the issuer calls it too (`scripts/lib/v1-38-lean-experiment-authority.ts:76`), and its retained owner calls it at line 39. All refuse the valid handoff despite unchanged reviewed source bytes. This consumes/fails the sole conditional baseline before useful execution.

**Fix:** Authenticate the closure HEAD against the diagnostic's own immutable entry/check custody. Independently authenticate the baseline entry HEAD against its committed allocation and unchanged reviewed source manifest, with appropriate committed lineage/source comparison between diagnostic and baseline. Do not require the two distinct allocation commits to have identical HEAD, and do not weaken either route's fixed-HEAD hold. Add an inert connected regression with distinct diagnostic and baseline allocation HEADs and the actual publisher/issuer/selected reader joins.

### CR-02: BLOCKER — V8 reader adds a wall gap already included in its cumulative wall floor

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:278`

**Related locations:** Same file lines 300, 334 and 381; `/Users/roryquinlan/runtime/cowards-game/packages/strategy-lab/src/league/lean-experiment.ts:1112`.

**Issue:** For v8, `currentLeanElapsedMs` already takes the maximum of journal accounting and the entire approved task span `49,150,573 + now - 1,791,299,252,280`. That span includes the interval from actual run-close to reader-start. The ordinary-reader guard and published check nevertheless add `gap.gapMs` again; the terminal-only reader does the same. Thus a real elapsed total of 57,500,000 ms with a 200,000 ms run-to-reader gap is evaluated as at least 57,700,000 ms and refused under the 57,600,000 ms ceiling, even when the actual remaining reader work fits. The accepted-check validator explicitly permits the inflated report, so this is not corrected downstream. Under the remaining timebox this can falsely end an otherwise eligible attempt or baseline.

**Fix:** Preserve all v1-v7 gap semantics. For v8, compare/report `max(journalElapsed + any not-yet-imported gap, approvedTaskWallFloor)` rather than adding a gap to a maximum that already includes that same span. Keep the actual gap journal import and real reader-close work; debit each interval once. Test both nonzero-gap within-cap acceptance and actual over-cap refusal using realistic post-task-start clocks, for ordinary and terminal-only readers.

### CR-03: BLOCKER — Spent admission/entry failures before child publication have no authenticatable closure

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-correction-retained.ts:373`

**Related locations:** Same file lines 343 and 371; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-correction.ts:769`, `:897`, `:359`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-baseline.ts:327`.

**Issue:** The durable `admission-prepare-start.json` marker is created before scope/request/predecessor validation and ledger creation. The durable `admission-run-start.json` marker is likewise created before scope, allocation checks and parent admission. These markers irrevocably spend the attempt, but the absent-result validator requires an existing ledger and calls `readLeanChildTerminal` before spending its own reader identity; closure derivation also unconditionally requires a real child entry and terminal. A prepare failure before ledger creation, a child-ready failure, or post-ready prefix-capacity failure at parent lines 327-333 leaves no such entry/terminal. Parent cleanup closes real admission accounting but does not publish a child terminal on these pre-entry paths. The attempt cannot be retried in place, cannot use an ordinary reader, and cannot produce the closure demanded by the next ordinal. Consequently a bounded zero-Match failure permanently strands the remaining approved opportunities rather than closing the spent ordinal with truthful finite custody.

**Fix:** Give the result-absent path an explicit authenticatable MAIN-owned finite admission/entry-failure terminal based on the actual durable admission start/close and observed cleanup/accounting. Distinguish genuinely absent child entry/terminal from corrupted or incomplete custody. Allow successor custody only after this actual nonauthorizing closure is independently checked. Never fabricate a child entry, child terminal, HEAD, accepted check or ordinary reader. Add inert parent/admission fixtures for failure before ledger creation and failure before child entry publication, proving zero charges, immutable spent ordinal, truthful absence, and successor refusal until real closure exists.

## Warnings

### WR-01: WARNING — Connected fixtures omit actual successor admission and a viable baseline lifecycle

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-host-stage-v8.test.ts:132`

**Related locations:** Same file lines 159-188, 198-204; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-baseline-retained.test.ts:20`.

**Issue:** The connected reader fixture mocks the actual request reader, uses only ordinal 1, and uses clocks 1000-1003, earlier than the approved task start. The baseline fixture reuses the diagnostic HEAD and intentionally ends at `TERMINAL_ONLY_REQUIRED` for an absent baseline result. The summary accurately discloses that boundary; it is not a complete-baseline success claim. Nevertheless these fixtures do not exercise real ordinal-2/3 request/authorization/continuation/predecessor admission, realistic wall-floor gaps, or the required new baseline allocation commit at publisher/issuer/reader. The tests therefore leave the central production handoffs unprotected and conceal CR-01 through CR-03.

**Fix:** Extend inert fixtures through actual v8 request and successor admission with finite synthetic custody, and through distinct diagnostic/baseline commit identities at publisher, issuer and selected owner. Include accepted/refused/absent prior closures, zero-charge pre-entry failure, skipped/parallel/spent ordinal rejection and realistic nonzero reader gaps. Keep native/runtime/gameplay dispatch denied. A finite baseline-result audit fixture may remain synthetic; do not claim it proves empirical 36-cell completion.

---

_Reviewer: /root/review_265_retry_envelope (gsd-code-reviewer)_
_Fixed reviewed HEAD: 1df78472446cb756aa060f279e96dc612e4885ee_
