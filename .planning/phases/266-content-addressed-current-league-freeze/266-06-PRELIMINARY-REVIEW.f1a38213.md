---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-10-01T12:46:32Z
reviewer: /root/review_266_06_repairs
depth: standard
status: issues_found
source_commit: f1a38213be2a2d996df58a178edc976cb0cfac24
source_tree: 412d990b11d9d7aeb4140fff012ef554d4412442
diff_base: c7418124b24df0cbfe7d6905a13bb8acc0d2015b
files_reviewed: 2
files_reviewed_list:
  - scripts/fixtures/current-freeze-assessed-payoff-parent-fixture.ts
  - scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
task3_complete: false
qualifying_48_workload_history_verified: false
full_positive_map_verified: false
empirical_authority: false
---

# Plan 266-06 preliminary payoff-parent repair rereview: f1a38213

## Scope and authentication

Fresh independent standard-depth STATIC review of both COMPLETE pinned files: the 134-line payoff-parent helper and complete 683-line shared test. The GSD skill/workflow, AGENTS, authoritative main Plan266-06 and partial handoff govern this exact two-file constituent review. Relevant unchanged candidate-closure, repository observer, graph/journal and payoff/composed-parent contracts were traced as references, not broadly reapproved. No previous clean disposition is carried forward.

Authenticated clean isolated HEAD `f1a38213be2a2d996df58a178edc976cb0cfac24`, tree `412d990b11d9d7aeb4140fff012ef554d4412442`, direct parent/diff base `c7418124b24df0cbfe7d6905a13bb8acc0d2015b`. The delta is exactly the two scoped paths and 52 insertions, with no deletions. Paths are nonignored and whitespace checking passes. Repo-local skill directories and `.codexignore` remain absent.

| File | Lines | Git blob | SHA-256 |
|---|---:|---|---|
| `scripts/fixtures/current-freeze-assessed-payoff-parent-fixture.ts` | 134 | `469de57527e7509afb972ae9d20e7c88bbedad70` | `796d2bbe2262815c000a8fc1851a8c24af2fac29a35de748d8b8b838b236da2f` |
| `scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts` | 683 | `858429771ac8d677fd46a2584e30cd42bd90b22d` | `3cbd6f53c251423baed22e3062f246a6f21cda7254207907b68e964bafd608ab` |

The c741 issues-found report remains unchanged, authenticated SHA-256 `15fb1b12c05730eb1075535543bf63ff1bc05d15a830849e4ff73fccbe0f1a88`. Its pre-review 16/16 epoch is preserved. The exact repair adds a seven-line repository-observer presence gate and one 45-line canary; all sixteen prior check bodies, setup, teardown, deadlines, other helpers and production semantics remain unchanged.

No test, constructor, assessor, replay/profile, artifact/store reader, directory getter, observer callback or operational action was executed by the reviewer. No source/state edit or commit was made. The sole write is this new report. Root and owner remained quiescent on related work. Root QA below is reported evidence, not independent reproduction.

## Narrative Findings (AI reviewer)

One remaining BLOCKER in the same read-only callback boundary. The repair correctly rejects already-present observer properties but does not establish stable callback-free repositories for subsequent reads. No other actionable finding was established in the bounded scope.

### CR-01 closure mapping

| Previous concern | New evidence | Disposition |
|---|---|---|
| c741 CR-01: directly supplied factory/league observer callbacks execute during a claimed read-only read | Helper lines 48-54 reject observer property presence at all supplied repositories; test lines 639-681 cover 32 own/hidden/inherited/accessor cases and zero callback/getter/reader calls. | Direct, already-present cases closed; overall read-only boundary remains unresolved because checked caller repositories are reused and may acquire the callback afterward. |

## Critical Issues

### CR-01: Observer absence is checked once, then mutable caller repository objects are read again

**Classification:** BLOCKER — a caller repository can install an observer after the new presence gate and mutate a generated store while the helper still reports `storeWritten:false`.

**File:** `/Users/roryquinlan/.codex/worktrees/phase266-context/cowards-game/scripts/fixtures/current-freeze-assessed-payoff-parent-fixture.ts:51`

**Additional affected lines:** 53, 59, 63-64, 73, 76, 81, 98, 119 and 121.

**Issue:** `"onVerifiedArtifactRead" in repository` correctly detects own, hidden, inherited and accessor properties without evaluating their values. However, it is only a point-in-time check. The helper does not require repository fields to be own data descriptors or snapshot directory strings into private read views. It subsequently evaluates caller-supplied `directory` properties and passes the original repositories into physical closure, graph, journal and composed-payoff readers.

A concrete static bypass does not require a Proxy, forged root, changed admission or changed directory:

1. Supply a frozen outer held clone with a cloned candidate closure repository. At the presence gate, that repository has no `onVerifiedArtifactRead` property.
2. Its `directory` property is an accessor that returns the original valid generated history path and installs an observer on the repository before returning. The helper does not require this inner repository to be frozen and does not inspect the directory descriptor.
3. The gate passes at lines 51-54. At line 73, `readCandidateClosure` passes that original repository to `readFactoryArtifact`. The unchanged artifact reader evaluates `repository.directory` first (factory repository line 66), so the getter installs the callback before the observer check/invocation at lines 68-69.
4. The callback can once append an unrelated valid generated artifact and return normally. Existing publication/source bytes and every admission/path/tuple/runtime/hash join remain valid. No complete history artifact union is checked by this constituent, so it can finish with `storeWritten:false` despite that write.

The equivalent league-directory accessor runs during helper line 59's path checks, after the presence gate but before graph reading at line 81. The unchanged league reader evaluates its directory at repository line 103 and invokes any now-present observer at lines 105-106. An unrelated valid league artifact does not change the 28 journal bijection or 24 selected matrix results; graph traversal is reachability-based and journal reopening skips well-formed unrelated artifact filenames. The read-only result can therefore remain positive. A callback that throws after a mutation likewise cannot undo the mutation.

The outer `Object.isFrozen(held)` check is not a brand and does not freeze these nested repositories. The problem is not the ordinary observer API: it is reusing caller-owned objects after checking their absence of an executable capability. All of this follows from the pinned static call paths; no getter/callback or store reader was run to establish the finding.

**Conservative scoped fix:** Before evaluating any repository directory, require an own DATA descriptor whose value is a string; reject accessor/inherited directory bindings without invoking them. Capture and independently validate those directory strings and construct fresh frozen directory-only, callback-free private read views, without a repository constructor, mkdir, caller options or recovery. Use the captured views for every factory closure read and every league graph/journal/payoff/composed read. Do not forward original repository objects or reread their operational fields after admission. Preserve the observer presence denials, ordinary production repository semantics, exact parent/source checks, limits and all false authority flags.

Add inert directory-accessor and late observer-installation canaries. They should reject before any artifact reader, with zero directory-getter/observer calls and all three generated stores byte-stable. A directory getter or observer's own throw must not satisfy the expected denial. Reuse the established shared setup and deadlines; no actual destructive/operational callback body is needed. Obtain a newly pinned serialized gate and fresh review afterward. Preserve both this epoch and the c741 report rather than relabelling either scoped-clean.

## Repair checks and remaining source analysis

The new gate inspects league and response repositories plus every candidate's factory and closure repository before `readCandidateClosure` is called (helper lines 51-54 versus first artifact reader at line 73). For ordinary stable objects with a preexisting observer, the `in` operator does not read that observer getter/value, so direct callback inheritance is denied early. The last-candidate cases correctly guard against an early valid row reaching a reader before a later supplied repository is inspected.

The new test exercises two inert behaviors, four property placements and four locations. Its callback's error `INERT_OBSERVER_THROW_MUST_NOT_CAUSE_DENIAL` is distinct from the exact expected `...REPOSITORY_OBSERVER` error. It separately requires observer/getter zero calls for every case and cumulative zero calls to six actual artifact/closure/graph/journal readers, then checks filename/length/SHA-256 snapshots of all three generated stores and restores spies in `finally` (test lines 639-681). These are sound checks for their 32 static-property cases. They freeze all supplied clones and do not exercise a directory accessor or observer introduced after the gate, so they cannot close the residual bypass above.

The complete helper otherwise retains exact request admission, generated-path/declaration/roster/physical source-publication/tuple/runtime joins (lines 42-47, 55-80). It authenticates the retained matrix and graph, reconciles all 28 graph starts/results with durable journals, requires each result terminal to equal a persisted terminal, and only then selects the exact matrix24 roster (lines 81-110). The unchanged semantic payoff checker independently re-enumerates canonical cells/order, recomputes the complete snapshot and canonical solver rows/domain root, and compares exact transport bytes/physical descriptor or chunks (line 119). No operational metadata, fabricated terminal, constructor, kernel replay, assessor, trust brand or raised policy/cap is introduced by this repair.

The full shared test still includes normal writer/byte-stability assertions, true order/snapshot/parent/hash-valid payoff canaries, stale matrix-only head coverage, missing-byte no-repair assertions, exact generated-path cleanup/restoration and all preceding source/round/probe tests. It adds only the observer canary; no old check or deadline is weakened. The adapter's issued/checked-map/kernel-replay/empirical/freeze/source/compiler/native/custody/clock and operational flags remain false (helper lines 120-132), but those flags do not make CR-01's inherited read capability safe.

## Independent checks

Read-only commands included exact HEAD/tree/parent and clean-status checks, the two-path diff and stat, `git ls-tree`, complete `git show ... | nl -ba` reads, SHA-256 checks of both complete Git files, nonignored-path checks, exact-delta `git diff --check`, unchanged c741 report hashing, and pinned reference-contract reads. Pins, scope, hashes, whitespace and the preserved prior report authenticate. No QA, callback/getter, constructor or store reader was independently executed.

## Root-reported QA: preserved repair epoch, not closure evidence

Root reports the sole serialized shared-setup one-test-file gate on exact f1 bytes passed 17/17, exit 0, in 1453.16 seconds:

```sh
pnpm exec vitest run scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts --maxWorkers=1 --reporter=verbose --disableConsoleIntercept
```

The new 32-case observer canary took 1161 ms under the unchanged default 5000 ms; valid payoff parent reading took 46551 ms; wrong order/snapshot/parent/hash-valid payoff negatives took 2666 ms under the unchanged default 5000 ms; stale-head/missing-byte checks took 86108 ms within the established 600000 ms ceiling. All sixteen prior check bodies/setup/deadlines remain unchanged. Root reports extra-strict non-emitting TypeScript, whitespace and lab boundaries pass (1363 files, zero violations).

These are root-reported ordinary/static-observer-case results, not independent reproduction or a late-mutation/accessor denial. They remain preserved as the f1 pre-review epoch. The c741 16/16 pre-review result and earlier constituent gates/failures remain separate; no aggregate/full applicable suite or source approval is claimed.

## Disposition and release

`issues_found`: one unresolved BLOCKER, CR-01's residual mutable-repository bypass. Direct already-present observer cases are repaired, but unconditional read-only closure is not established at f1 bytes. No source fix or commit was made by this reviewer.

This is not qualifying operational history, emitted Strategy/compiler/native/custody/clock proof, actual response/league execution/closure, complete probes/evaluation/report/marker graph, whole-map derivation/rederivation, complete physical store union, full applicable repository suite, final Plan06 Task3, Plan02 consumption or empirical/freeze approval. Operational Match/provider/Strategy/model/route/allocation/reservation/live preflight, private-store/holdout/formation/public/counted/production actions remain closed. Root reports source isolated/unmerged/unpushed, consumed Plan265-07/09 and exact human Plan265-12 authority unchanged.

All old reports are preserved. Review slot and related source/read/edit/test freeze are released when this new report is returned for the next scoped fix -> fresh pinned gate -> fresh independent review.
