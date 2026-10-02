---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplemental: true
reviewed: 2026-10-02T06:44:56Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - packages/strategy-lab/src/league/repository.ts
  - packages/strategy-lab/src/league/repository.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
findings:
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
base_commit: 195aff3ad74e37fc76b5a4b237e7b5a74504df33
source_commit: c58db8866452f907f871da1425026d6a3b70880b
checkout_head: 7f818787e473183b51e893e9d6e9501b687e4ceb
six_file_diff_sha256: de125476634718a3b6b9b835c093e1611f9343921d270ed131374e60ec1160a8
---

# Phase 265 Plan 07: Supplemental asynchronous dependency code review

## Narrative Findings (AI reviewer)

### Summary

Two BLOCKER findings remain in failure handling. This is an independent standard-depth, read-only inspection of the six complete source/test files and their bounded diff, with focused cross-file await/fault-order tracing. AGENTS.md, current STATE, the checked supplemental repair plan, check-v1/check-v2 and execution-v1 were read. No project-local `.codex/skills/` or `.agents/skills/` directory was present; the GSD code-review skill/workflow was used. No structural pre-pass was supplied.

No reviewer test, import, typecheck, build, profile, retained verifier, Match, provider/model/Docker or live-capacity invocation occurred. The executor's reported 32 repository, 20 selected runner and 8 selected host-bound passes plus strict types/build are handoff evidence, not independently rerun proof or the complete source gate. Source inspection and Git/filesystem reads established the identities below. Only this new review artifact was written; no source edit, commit or push occurred. Available file tools lacked dedicated Read/Write tools, so reads used the shell and this artifact used `apply_patch`.

### Critical Issues

#### CR-01: Invocation preparation and multi-chunk fallback bypass the graph failure latch

**Classification:** BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:118-132` (dispatch checks at lines 98-101; fallback publisher at lines 164-177).

**Issue:** `prepare()` and the `ordinal !== 1` synchronous fallback execute before the `try/catch` that sets `retentionFailed`. Consequently a genuine invocation-retention failure outside the small-pair path rejects the new `appendInvocation()` API without stopping graph-wide dispatch. For example, the already-supported `{ text: "A".repeat(140000) }` invocation takes the five-artifact fallback. If a file fsync, link or directory barrier fails there, line 123 throws before line 131 can set the latch. With adequate remaining budget, subsequent `beforeDispatch()` and `beforeInvocation()` still pass. The first wrapper's local retention latch blocks only that wrapper; a different provider wrapper sharing the graph can execute another guest after this genuine retention failure. Preparation failures, including failed synchronous record-links publication, have the same escape path.

This is a new failure-coverage gap in the graph API, not a request to alter successful synchronous fallback bytes or barrier order. Existing fallback coverage at `scripts/run-v1-38-serious-league.test.ts:116-127` tests successful fallbacks but does not assert fail-stop after their I/O rejection.

**Fix:** Keep the initial pending/concurrent-call refusal outside failure-latching handling, and keep non-invocation synchronous routing unchanged. For the two invocation kinds, enclose canonical preparation and eligible/ineligible invocation publication in failure handling that latches every genuine preparation/publication failure and rethrows the original error. Clear/release pending state only when owned work has settled. Preserve all existing fallback barriers, accounting and success roots. Add focused regressions for both invocation kinds using a multi-chunk payload with a failing sync-file/directory boundary and a preparation/link-group failure; assert original error identity, no credited invocation head, unchanged conservative charges, and graph-wide refusal of subsequent dispatch/invocation, including a different wrapper with zero additional guest calls. Also assert that a refused concurrent append does not prematurely mark the active operation failed.

#### CR-02: Outer failure retention is not exception-safe and can abort owned cleanup

**Classification:** BLOCKER

**Files:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-serious-league.ts:501-509` (particularly line 504); `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-league-response-runtime.ts:269-273`.

**Issue:** The newly guarded inner invocation catches preserve the initiating error, but the enclosing handlers still allow secondary retention faults to replace it. In ordinary `execute`, each `provider.close()` and successful cleanup append share one `try`; its catch immediately performs an unguarded `runtime-cleanup-failure` append. If recording cleanup fails and the fallback append also fails (for example, a persistent publication/barrier fault or exhausted emergency reserve), that exception exits the loop before remaining `opened` providers are even attempted, and the original settled invocation/issuance error is lost. `cell-issuance-failure` publication and journal reopening/publication can also replace it. In response production, an unguarded `response-production-failure` append or factory-terminal publication at lines 271-272 similarly replaces the original dependency error after cleanup.

These are retained pre-existing outer fault paths, not claimed regressions caused by overlapping fsyncs. They nevertheless remain in the supplemental Task 3's explicit catch/finally audit and violate its required initiating-error preservation and owned-cleanup contract. The controlled new race tests reject dependency syncs but allow all later failure/cleanup writes to succeed; they therefore do not expose this case. A storage failure cannot guarantee terminal persistence, but it must not prevent actual remaining provider cleanup or silently change the primary failure.

**Fix:** After the settlement gate, attempt actual close on every owned provider independently of any evidence write. Catch secondary cleanup/failure/journal-publication errors separately, retain conservative charges and residue, and preserve the initiating exception as the primary error (secondary diagnostics may be attached without replacing it or claiming successful cleanup/terminal publication). When no primary operation error exists, propagate cleanup/retention failure only after all close attempts. Guard the response outer failure-record/terminal sequence similarly. Add bounded tests combining an original invocation-retention error with later cleanup/failure-publication faults: every opened provider receives its close attempt, no cleanup occurs before pair settlement, no speculative success is recorded, and the original error object reaches the caller despite failed secondary retention.

### Reviewed boundary observations

The pair publisher copies and validates exactly two inputs before suspension, deduplicates roots, precharges fresh distinct targets synchronously in order, captures launch faults, observes all settlements, closes its own fds before error handoff, selects operation errors by input order and never overwrites target hardlinks or unlinks temporaries it failed to create. Failed/uncertain residue is not recovered or refunded. Its default seam delegates actual callback-based `node:fs.fsync`; dependency link publication/directory sync precedes the serial descriptor file sync and final directory barrier. Small fresh invocation publication retains three file syncs/two directory barriers.

Both invocation retention callbacks are awaited before root-array updates and WeakMap issuance. Whole-wrapper active guards, same-wrapper race settlement, optional response capability/live pending getter forwarding and synchronous pending-close refusals were traced through both adapters. These observations do not override the failure gaps above. No engine, public-output, formation, holdout or runtime-limit change was found in the bounded diff. Successful sync/large/stream paths retain their existing sequences; no throughput or full-Match success is inferred.

### Exact reviewed source identities

All raw hashes were measured read-only in this review and match execution-v1. The Git diff hash was independently reproduced using the six paths in the frontmatter order.

| File | Raw SHA-256 |
| --- | --- |
| `packages/strategy-lab/src/league/repository.ts` | `4ee61ed57a07d2d42e58a0e080c731deb8aae3ccdc8f72dcde1d53a54ea44599` |
| `packages/strategy-lab/src/league/repository.test.ts` | `a96cb2025f8e7e26b42d63a85a1796efec8fefe3eb667e8fe9784923a33d0b4b` |
| `scripts/run-v1-38-serious-league.ts` | `53534a6d7c467a2606714137096538f5b3698fbdbb31ec2a8705fb09dcfe11e3` |
| `scripts/run-v1-38-serious-league.test.ts` | `16766e9807d2c6c0c89309eb7eab289402e632f198255b307ea5aeed388f516a` |
| `scripts/lib/v1-38-league-response-runtime.ts` | `4ac4da2994bb02d57aeedec2396c00540b1083d7ae6dad7646297830d01e4756` |
| `scripts/lib/v1-38-league-response-runtime.test.ts` | `5d24ddb75818f4c34bdd5315e4bf4682a82d2a6f02917fcb0858d13bfc831584` |

Fix these actionable blockers within the bounded corrective loop before root's unchanged complete source gate, then independently re-review the exact repaired bytes. Prior phase-wide verdicts/history, consumed routes, unique verifiers and closed profilers remain unchanged. This review is not allocation/dispatch authority, a human-approval change, LEAG completion, freeze eligibility, a speedup result or production certification.

_Reviewed: 2026-10-02T06:44:56Z_
_Reviewer: independent gsd-code-reviewer_
_Depth: standard, focused cross-file await/fault-order tracing_
