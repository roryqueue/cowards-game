---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "54"
reviewed: 2026-08-15T01:28:59Z
depth: deep
source_base: 7c6e23f9e3c856198560093152df61f8ab614222
reviewed_source_commit: dee17ae4f34c48da6ae053e6dafd6b8d1bc8690a
reviewed_source_tree: af646e5056ad31267682eeb430e61496ad6d6ca1
docs_descendant: be2a7164dbf332f2295114ddaf563ee11013bf5a
files_reviewed: 4
files_reviewed_list:
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 4
  warning: 0
  info: 0
  total: 4
status: issues_found
---

# Phase 262 Plan 54: Code Review Report V3

**Reviewed:** 2026-08-15T01:28:59Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The corrected source custody is exact. `be2a7164dbf332f2295114ddaf563ee11013bf5a`
is a planning-only child of A7, A7 has the recorded tree and sole parent, the
thirteen-commit `sourceBase7..A7` range is linear, every range commit carries
the one recorded implementation-author trailer, its aggregate is exactly the
four declared paths, and the current four source/test bytes equal the recorded
A7 blobs. Authorization/seal/review and every route-7 canonical destination,
including the reservation directory, are absent from the canonical workspace.
B7 committed/supplied/worktree binding, permanent pre-start expiry, v11 charge
identities, exact disposition registration, and post-start context presence are
also implemented.

Four blockers remain. Reviewer separation is still authenticated only by Git
metadata that the same caller can mint. The protected-history terminal cannot
record a real protected-history failure because its exception validator first
re-derives the failing field, while its cache makes same-process observation
stale. The reservation gives cooperating route writers one winner but does not
atomically reserve the seven destination leaves. Finally, the shared scheduler
does not enforce either advertised timeout while an active runner promise is
unsettled, so an abort-ignoring child can hang the route indefinitely.

The safe selected proof passed: 2 files, 8 tests passed and 13 long tests were
skipped. The 1,500-second fixture was not rerun because its committed evidence
already reports 1,286 seconds and it is explicitly designed to exercise only
disposable injected dependencies. Its large budget is attributable to the
monolithic repeated Git/custody path; it does not fix the separate unbounded
production scheduler wait described in CR-04.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Reviewer separation remains self-asserted Git metadata

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5861-5878`; `scripts/evaluate-v1-38-successor-source-complete.test.ts:315-340`

**Issue:** Review custody requires a direct-child one-path commit, a different
name/email from the implementation commits, an email ending in the hard-coded
`.invalid` domain, and a different trailer. None of those values is
authenticated: the party creating authorization can set `user.name`,
`user.email`, and the trailer arbitrarily. The fixture demonstrates this exact
ability. It rejects the first self-authored commit only because that commit uses
the wrong email, then changes local Git config to the accepted domain, writes
the same generated zero-finding document, and treats it as an independent
review. This proves structural separation from the A7 commits, not reviewer
separation, so an implementation operator can still mint its own authorizing
review.

**Fix:** Bind Plan-262-55 review custody to evidence the implementation operator
cannot fabricate, such as a verified signature from an allowlisted reviewer
key or an externally supplied reviewer authorization whose trust root is frozen
before A7. Verify that credential over the exact review blob, A7, parent, and
reviewer run. If no trusted reviewer identity mechanism exists, keep the review
non-authorizing and fail closed instead of accepting name/email/trailer text.

### CR-02 [BLOCKER]: A real protected-history failure still cannot reach its terminal

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5134-5157,6029-6048`; `scripts/lib/v1-38-current-matrix-reproduction.ts:20054-20060,20275-20295`

**Issue:** The `protectedHistory` exception path calls
`v138Plan26256AuthorizationLiteral` and
`buildV138Plan26256AuthorizationV7` before omitting protected-history fields
from comparison. Both rebuild protected history, including its working-tree
absence checks. In a fresh CLI process, the actual protected-history failure
therefore throws before the mismatch proof can be derived. In a process that
already derived the route, `deriveV138ProtectedHistoryV6` returns its
module-global cached value before rechecking those paths, so the later
observation remains equal to the seal and the terminal rejects it as a
successful check. The fixture covers this branch only by supplying an arbitrary
`observedRootOverrides.protected_history_failed` hash; it never causes the real
protected-history observation to fail. Thus the original V2 reachability defect
survives for this advertised production disposition.

**Fix:** Implement a true immutable B7-anchor validator that never invokes the
failing protected-history derivation. Validate committed B7 bytes and every
unaffected authorization/seal field directly, then perform one uncached current
protected-history observation to derive the mismatch proof. Remove or
explicitly invalidate observation caches at this boundary. Add a fresh-process
test that creates the exact protected-history incompatibility and reaches both
terminal write and check without an injected observed-root override.

### CR-03 [BLOCKER]: The route reservation leaves a final cross-destination TOCTOU window

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:19069-19099`; `scripts/evaluate-v1-38-successor-source-complete.test.ts:395-404`

**Issue:** Exclusively creating the hidden reservation directory serializes
cooperating route-start writers, but it does not reserve or lock any of the
seven public destination leaves. After the loop finishes checking them absent
at lines 19080-19087, another process can create a later receipt, terminal, or
dangling symlink before route start is published at line 19097. The claim file
does not prevent that filesystem operation, and route start still succeeds.
The race test invokes `afterReservation` before the final scan, so it proves
only that the recheck notices an earlier mutation; it cannot exercise the
remaining check-to-publication window or the claimed concurrent one-winner
behavior across every destination.

**Fix:** Acquire ownership of every destination atomically before publishing
route start, for example by exclusively creating a private no-follow route
namespace that owns all stage leaves and publishing through directory-relative
handles, or by placing exclusive reservation sentinels at every destination
and requiring each later writer to atomically consume its exact sentinel.
Revalidate pinned parent identities at each transition. Add coordinated
concurrency tests that pause after the last freshness check, race every
non-start leaf and dangling/ancestor symlink, and prove route start cannot
publish; also run two starts concurrently and assert exactly one complete
winner with no partial claim.

### CR-04 [BLOCKER]: Runner promises can bypass both scheduler timeouts forever

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:1646-1683,1691-1714`

**Issue:** `maxShardMilliseconds` is checked only after a runner promise has
resolved, and `checkTotalTime()` is likewise called only during initial launch
or after a completion. With no shared observer, `Promise.race` contains only
the active runner promises and never wakes. With an observer, the 250 ms tick
wakes the loop, but the `completed === undefined` branch observes and
immediately continues without checking total time. Even if an observation or
parent abort calls `stop()`, an injected or subprocess runner that ignores the
abort signal remains in `active`, so the loop never exits. The advertised
600-second shard and 5,400-second total bounds therefore do not bound wall
time, allowing a stuck child to hang calibration/reproduction and preventing a
durable no-retry terminal.

**Fix:** Race active work against real monotonic shard and total deadline
timers regardless of observer presence. On expiry, abort all runners and await
their owned cleanup only under a second hard cleanup deadline; convert any
non-settling runner into explicit failed terminal/cleanup evidence rather than
waiting forever. Add fake-clock or short-deadline tests with a runner that never
settles and ignores abort, both with and without a shared observer, asserting
bounded return and the exact timeout/cleanup disposition.

---

_Reviewed: 2026-08-15T01:28:59Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
