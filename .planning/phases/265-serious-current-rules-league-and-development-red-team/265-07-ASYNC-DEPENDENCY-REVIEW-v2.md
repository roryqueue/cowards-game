---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
reviewed: 2026-10-02T07:10:25Z
depth: standard
iteration: 1
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
base_commit: 195aff3ad74e37fc76b5a4b237e7b5a74504df33
source_commit: 5c8dbc720cba3462b64c0a0a41d7c6e6a6a849c6
checkout_head: 5c8dbc720cba3462b64c0a0a41d7c6e6a6a849c6
six_file_diff_sha256: cdb8dc0c28c4ab98419cef7891a117b02bbeaf173faa60d3fed809ca9211f005
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Plan 265-07 asynchronous dependency repair: exact-source rereview v2

## Summary

One remaining **BLOCKER**: the public runner can still replace an initiating runtime/retention error with a secondary failure-record publication error. Fix before the root-owned source gate or subsequent measurement. CR-01 is corrected; CR-02's owned-provider cleanup and response-production sites are corrected, but its original-error requirement is not yet satisfied through the public runner boundary.

This is the independent six-file supplemental source review, not a replacement of the phase-wide historical verdict. The prior full-file/diff inspection is carried forward with exact repaired-file, fix-diff and cross-file caller/error-path inspection. Reviewed context includes AGENTS.md, current STATE, the checked repair plan/check-v2, execution-v1, preserved review-v1 and the uncommitted review-fix-v1. Both source fix commits (`d713817400f72f3063fb50c3bf8eb58d107b6921` and `5c8dbc720cba3462b64c0a0a41d7c6e6a6a849c6`) are included. No structural findings were supplied.

## Narrative Findings (AI reviewer)

### CR-03 — BLOCKER: public runner failure publication still replaces the initiating error

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:738-743`, `:784-789`, `:808-815`.

**Issue:** The repaired ordinary `LeagueConnectedSession.execute` catch and `produceLeagueResponse` catch now preserve the original error after settlement and secondary storage failures. Their caller still loses it. Both response-job catches perform unguarded `red-team-process-failure` and `red-team-terminal` writes before `throw error`. If either write fails, the enclosing runner catch receives that secondary error instead. The final runner catch also performs unguarded per-start failure/terminal writes and the final `run-failure` append. An error there escapes directly to `runSeriousLeague`/the CLI, replacing the error preserved by the inner repair.

Concrete ordinary path: an invocation's first dependency fsync rejects with error A, its sibling settles, the graph latches dispatch failure, and the fixed session catch attempts every owned close and rethrows A despite persistent secondary storage error B. `runSeriousLeague` catches A, then line 814 attempts `run-failure`; B rejects the public runner. Concrete response path: `produceLeagueResponse` correctly preserves A, but lines 740/786 can throw B before their original-error rethrow, and lines 811-814 can replace it again. Even a transient inner failure-record fault can result in an otherwise durable final failure head recording B instead of A.

This is a reachable error-order defect within Task 3's ordinary/response catch audit, not a new gameplay, resource or certification requirement. Settlement/actual provider cleanup now happens first; the remaining defect is the initiating-error handoff through the already-in-scope caller.

**Fix:** After the existing settlement gate, guard secondary failure/terminal evidence in both response-job catches and always rethrow their initiating error. In the outer runner catch, keep the existing successfully retained `process_invalid` result behavior, but if failure/terminal/final-head retention cannot complete, rethrow that catch's initiating error instead of a secondary publication error. Do not fabricate a head or terminal, overwrite residue, refund charges, bypass guards, retry dispatch or add free-form secondary diagnostics. Retain the successful publication sequence.

**Regression required:** Exercise the actual `runSeriousLeague` boundary, not only `session.matrix` or `produceLeagueResponse`. Use bounded source-only injected fixtures: delay both real dependency fsyncs, reject one with A, enable secondary failure publication faults, then settle the sibling. Assert no premature guest/close/failure/terminal effects; every owned provider receives its close attempt; the public rejection is the identical A; no usable invocation or forged terminal/head is returned; charges/residue stay conservative. Cover development and independent response-job failure/terminal publication plus final `run-failure`, and retain the normal successful failure-head behavior. Existing CR-02 ordinary regressions stop at `session.matrix` (runner test line 197), and response regressions stop at `produceLeagueResponse`, so they do not establish this caller boundary.

## Disposition of preserved v1 findings

- **CR-01 corrected in source:** `appendInvocation` now catches preparation and eligible multi-chunk synchronous fallback faults; both invocation kinds latch graph-wide dispatch failure. The pending/concurrent refusal guard stays outside that catch. Only the owning async invocation releases its gate. Non-invocation synchronous routing remains unchanged. Added regression assertions cover preparation/grouping/canonical/file/directory faults, fresh-wrapper refusal and a concurrent refusal that must not poison the successful owner.
- **CR-02 corrected at its reported inner sites:** Ordinary cleanup independently attempts actual closes and guards cleanup/failure/journal publication. Response cleanup completes remaining close attempts before propagating the first cleanup/retention fault when no primary error exists, and preserves an existing primary error otherwise. Response production failure and factory-terminal publication are guarded. The remaining caller handoff is CR-03 above.
- **No additional finding in the bounded durability/issuance inspection:** Owned two-input snapshots and ordered precharges precede async file work; all launched work settles before fd closure/error handoff; dependency publication/barrier precedes the serial descriptor/final barrier. Real default fsync delegation, exclusive no-follow temporaries, no-overwrite target links, failed residue/charges, graph pending guards, optional response capability/getter forwarding, whole-wrapper guard and awaited retention before WeakMap issuance remain present. No successful root/byte/accounting or synchronous/large-path change was introduced by these two fix commits.

## Independently measured exact source identity

Raw SHA-256 measured read-only from the current checkout, not copied from the author note:

| File | SHA-256 |
| --- | --- |
| `packages/strategy-lab/src/league/repository.ts` | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| `packages/strategy-lab/src/league/repository.test.ts` | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| `scripts/run-v1-38-serious-league.ts` | `d968ded785d0bd7adb65da679e5886bcc011c2cf797ad3499eab0706a9abddc4` |
| `scripts/run-v1-38-serious-league.test.ts` | `804a863cc74d297b109b128fb6ae76799a217076cc7858fba93f2382dfb42efc` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `ad75540ffe6853728b69acff058948537ddda564018a540abec1fc2290944c92` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `57bb57d6bd9315ae305684bda5b0736584c76274220d4d97a63218047a39fcfa` |

The diff hash is SHA-256 of raw `git diff 195aff3a HEAD --` with the six paths in frontmatter order. The six-file range is 596 insertions/53 deletions. Tracked source is clean at the stated HEAD; unrelated untracked files and the author's new fix note were preserved.

## Evidence and authority limits

Author-reported focused RED/GREEN tests and strict types/build results are recorded in review-fix-v1; none was independently rerun by this reviewer. This review used source/filesystem/git reads and wrote only this new report. No source edit, import, test, typecheck, build, profiling, retained verification, capacity measurement, provider/model/Docker call, Match execution, commit or push occurred. No claimed speedup, empirical completion, full-gate pass, LEAG completion, freeze/holdout/formation eligibility, renewed closed-route authority, new human literal or production certificate follows from this report. Historical reviews, failed routes and completed profilers remain immutable.

_Reviewer: gsd-code-reviewer; standard scoped source rereview; reviewed 2026-10-02T07:10:25Z._
