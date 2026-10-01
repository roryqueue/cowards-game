---
phase: 266-content-addressed-current-league-freeze
plan: "06"
reviewed: 2026-10-01T12:05:39Z
reviewer: /root/review_266_06_repairs
depth: standard
status: issues_found
source_commit: c7418124b24df0cbfe7d6905a13bb8acc0d2015b
source_tree: 6557d4f8899a1588f6fed52b7fd5afa3ef987f78
diff_base: 141d0aa79823dc7d131fd7f70f371c606634b0a9
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

# Plan 266-06 preliminary payoff-parent constituent review: c7418124

## Scope

Fresh independent standard-depth STATIC review of the entire new 127-line payoff-parent helper and complete 638-line shared test. The GSD code-review skill and complete workflow, source/main AGENTS, authoritative main Plan266-06 and current partial handoff were read. Explicit two-file scope overrides phase-wide discovery; no fix/all/auto or structural pre-pass was requested. Repo-local skill directories and `.codexignore` are absent.

Necessary unchanged physical closure, prospective roster, graph, journal-bijection, repository observer, matrix/snapshot, solver-payoff and composed-parent contracts were traced as references only. No prior disposition was carried onto the new helper. All earlier reports remain unchanged.

No tests, constructors, assessors, replays, profiles, artifact/store readers or operational actions were executed by this reviewer. In particular, the callback case below was established by static call tracing: no canary callback or generated/private-store reader was run. No source/state edit or commit was made. The sole write is this report. Root and owner stopped related reads/edits/tests during review. Root QA below is reported evidence, not independent reproduction.

## Exact source authentication

Authenticated clean `codex/phase266-context` HEAD `c7418124b24df0cbfe7d6905a13bb8acc0d2015b`, tree `6557d4f8899a1588f6fed52b7fd5afa3ef987f78`, direct parent `141d0aa79823dc7d131fd7f70f371c606634b0a9`. The exact delta changes only the two scoped paths, with 221 insertions and one deletion. Both complete Git-file hashes/blobs match the supplied pins, both paths are nonignored, and whitespace checking passes.

| File | Lines | Git blob | SHA-256 |
|---|---:|---|---|
| `scripts/fixtures/current-freeze-assessed-payoff-parent-fixture.ts` | 127 | `392b1f361ecc5bb9b84da48858f77a7d0401b273` | `282371799444676cea96e3055079fb94ce9ef2199c928f443fe981c18f9a80af` |
| `scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts` | 638 | `f09f84180a7ea3cabbb826615fbb451f7bc7a5a2` | `a353f6e6f63f7a277361dcdd104015ece5bddd15c36c993c140bb3ca5b760012` |

The exact test diff preserves all thirteen old check bodies, shared setup, teardown and established deadlines; it adds the new imports and three payoff checks. Other helpers, parent checker, policies and repository behavior are unchanged.

## Narrative Findings (AI reviewer)

One actionable BLOCKER in the new helper's claimed read-only boundary. Root's ordinary-path 16/16 gate does not exercise or close it. No other actionable finding was established in this bounded review.

## Critical Issues

### CR-01: Caller-held repository callbacks execute inside the supposedly read-only constituent

**Classification:** BLOCKER — the consumer can mutate a generated store while reporting `storeWritten:false`; directory/hash/admission checks do not enforce its read-only contract.

**File:** `/Users/roryquinlan/.codex/worktrees/phase266-context/cowards-game/scripts/fixtures/current-freeze-assessed-payoff-parent-fixture.ts:56`

**Additional affected lines:** 66, 74, 91, 112 and 114. The first factory callback path starts at line 66; league graph/composed reads reuse the caller-held object from line 56.

**Issue:** The helper explicitly treats the frozen held wrapper as untrusted and promises that no publication or cleanup is called (lines 32-38), but it retains `matrix.input.repository` directly and passes each supplied `row.closure` directly into `readCandidateClosure`. Its path/declaration checks authenticate only directory strings, not a callback-free repository view. Both repository interfaces legitimately permit `onVerifiedArtifactRead`; actual artifact reads invoke that callback after digest verification. A frozen outer clone containing a repository clone with the original directory and an added callback passes every relevant path/allocation identity check.

The static call paths are concrete:

1. Helper line 66 -> unchanged `readCandidateClosure`, connected-runner lines 67-78 -> `readFactoryArtifact`, factory repository lines 65-70 -> supplied `onVerifiedArtifactRead`.
2. Helper lines 56/74 -> unchanged `readLeagueRecordGraph`, serious-league line 144 -> `readLeagueArtifact`, league repository lines 102-108 -> supplied `onVerifiedArtifactRead`.
3. Helper line 112 -> unchanged `checkSolverPayoffParent`, parent-context lines 1347-1350 -> composed artifact/physical-parent reads -> the same league callback.

For example, an observer on the cloned league repository can once publish an unrelated valid content-addressed artifact through the original repository and return normally. The read artifact remains digest-valid; graph traversal does not enumerate unrelated artifacts, and journal reopening intentionally skips well-formed `league-artifact-*.bin` filenames (repository line 163). All 28 journal joins and 24 payoff selections can therefore remain valid while the helper returns `storeWritten:false`. A factory observer can similarly append an unrelated artifact during physical candidate closure reads, with the source/admission joins unchanged. A callback that throws after a mutation makes the reader fail but does not undo the mutation either. No forged hash, mismatched admission, malformed path or empirical authority is needed for either path.

The ordinary repository observer seam is not itself the defect: it deliberately invokes an optional caller callback. The new read-only consumer must not inherit that capability from an unbranded held object. Its normal-path writer spies and byte snapshots only cover the genuine constructor's callback-free repositories; they do not cover accepted repository clones with observers.

**Conservative scoped fix:** After independently validating the generated directory identities, construct local callback-free repositories using the unchanged `createFactoryRepository(historyDirectory)` and `createLeagueRepository(leagueDirectory)` with no caller options. Use the local factory repository in every physical candidate closure passed to `readCandidateClosure`, and use the local league repository in graph, journal and payoff/composed-parent readers. Do not spread or forward caller repository callback/durability/publication options into these local read views. Alternatively, reject supplied observer-bearing repository objects before the first artifact read, including inherited/hidden observer properties, without invoking the observer. Preserve ordinary repository semantics, existing limits, source/parent checks and every false authority flag; do not introduce a new trust brand, operational metadata or recovery call.

Add focused factory- and league-observer canaries on same-directory frozen held clones. Use inert recording/throwing spies rather than actual destructive/operational callback bodies. Assert that the callbacks are never invoked, all three generated stores remain byte-stable, and all normal identity/parent checks still occur; a denial assertion must not be satisfiable by the callback's own throw. Any repair needs newly pinned bytes, the serialized affected gate and fresh independent review. This report and the pre-review 16/16 epoch must remain preserved.

## Other reviewed joins and test reliability

The request is admitted as a canonical exact three-field object with valid roots before use (helper lines 42-47). Held/generated directory, allocation/output path, candidate count, prospective base roster, parsed admission and physically reopened source/publication/packet/proposal/validation joins are explicit (lines 48-73). Those joins do not address CR-01, but no additional wrong-source association was established.

Graph transport authentication is bounded by the admitted declaration. The helper requires a reachable single complete-matrix record matching the held matrix/population/snapshot/solver, then includes all graph cell starts/results in durable-journal reconciliation, not just the original matrix24 (lines 74-93). Every result terminal must equal a persisted journal terminal; derived unterminated projections cannot pass (lines 94-97). The actual matrix descriptor selects exactly 24 distinct reachable result records, with ordinary matrix options/seed and successful persisted terminals (lines 98-109).

The unchanged `checkSolverPayoffParent` independently enumerates canonical cells, requires exact cell order/coverage, recomputes complete terminal projections/snapshot/domain root and compares exact retained payoff length/digest. Its composed consumer derives the precise descriptor/chunk identities from expected bytes (parent-context lines 1326-1362, 1406-1439). The new helper does not supply a fabricated operational run-start/reservation or ask that checker to waive one. `parentInputs` remains ordinary canary metadata, not an issuer brand or checked map.

The three appended tests correctly exercise normal read-only writer/snapshot assertions, genuine reversed-cell/snapshot/parent substitutions, a genuinely different hash-valid half-point payload, matrix-only stale-head journal coverage and missing physical payoff bytes (test lines 553-637). Inequality/absence assertions avoid no-op substitutions; the reader spy is not replaced by a throwing mock. The wrong direct artifact is constrained below 262144 bytes, asserted absent before publication, and removed only at its exact generated path in `finally`. Missing original bytes are restored at the exact original artifact root, with final filename/length/hash snapshots compared. None of this covers caller observer inheritance, so the positive tests cannot support a zero-actionable disposition yet.

The helper makes no kernel/replay/assessor/constructor or operational call and creates no new generated directory. Its flags deny source/compiler/native/custody/clocks, actual response/league closure, checked-map/full-map and empirical/freeze authority (lines 113-125). Those denials remain necessary; CR-01 is a narrower incorrect read-only behavior, not proof of empirical or operational qualification.

## Independent checks

Read-only source authentication included:

```text
git rev-parse HEAD HEAD^{tree} HEAD^
git branch --show-current
git status --short
git diff --name-status 141d0aa79823dc7d131fd7f70f371c606634b0a9..c7418124b24df0cbfe7d6905a13bb8acc0d2015b
git diff --stat 141d0aa79823dc7d131fd7f70f371c606634b0a9..c7418124b24df0cbfe7d6905a13bb8acc0d2015b
git ls-tree c7418124b24df0cbfe7d6905a13bb8acc0d2015b <both scoped paths>
git show c7418124b24df0cbfe7d6905a13bb8acc0d2015b:<each scoped path> | shasum -a 256
git show c7418124b24df0cbfe7d6905a13bb8acc0d2015b:<each scoped path> | nl -ba
git diff 141d0aa79823dc7d131fd7f70f371c606634b0a9..c7418124b24df0cbfe7d6905a13bb8acc0d2015b -- scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts
git check-ignore -v <both scoped paths>
git diff --check 141d0aa79823dc7d131fd7f70f371c606634b0a9..c7418124b24df0cbfe7d6905a13bb8acc0d2015b
```

Pins, exact scope/hashes, clean worktree, nonignored paths and whitespace authenticate. No test, TypeScript, boundary check, store reader or callback execution was independently rerun.

## Root-reported QA: preserved pre-review epoch

Root reports one sole serialized shared-setup one-test-file gate on exact c741 bytes passed 16/16, exit 0, in 1472.60 seconds:

```sh
pnpm exec vitest run scripts/fixtures/current-freeze-assessed-matrix-fixture.test.ts --maxWorkers=1 --reporter=verbose --disableConsoleIntercept
```

The new positive payoff read took 49987 ms; genuine semantic/identity/hash-valid payoff negatives took 3940 ms under the unchanged default 5000 ms; matrix-head coverage and missing-byte checks took 92915 ms within the established 600000 ms ceiling. All thirteen prior checks, shared setup and deadlines were retained. Root reports owned extra-strict non-emitting TypeScript, whitespace and lab boundaries pass (1363 files, zero violations). These are root-owned pre-review results, not independent reproductions, callback-boundary evidence, an aggregate/full applicable suite or source approval. The preceding 13/13 probe epoch and all earlier failures remain separately preserved.

## Disposition and remaining boundaries

`issues_found`: one unresolved BLOCKER, CR-01, at exact c741 bytes. Repair the caller-observer inheritance before presenting this constituent as read-only or scoped-clean. No source change or commit was performed by the reviewer.

This review does not approve qualifying operational history, emitted Strategy/compiler/native/custody/clock behavior, actual response/league execution/closure, complete probes/evaluation/report/marker graph, whole-map derivation/rederivation, complete physical store union, full applicable repository suite, final Plan06 Task3, Plan02 consumption, empirical or freeze authority. No operational Match/Strategy/provider/model/route/allocation/reservation/live preflight, private-store/holdout/formation/public/counted/production action occurred. Root reports the source remains isolated, unmerged and unpushed, with consumed Plan265-07/09 and exact human Plan265-12 authority unchanged.

All prior reports remain unchanged. Review slot/source freeze is released when this report is returned, allowing root's scoped fix -> fresh pinned gate -> fresh independent review sequence.
