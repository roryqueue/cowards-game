---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-23T23:52:23Z
depth: deep
reviewed_source_commit: 6ad229e8f0c6f84e518027c73a2b09d3a0df3dc9
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 8
  warning: 1
  info: 0
  total: 9
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V2

**Reviewed:** 2026-08-23T23:52:23Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The correction resolves the original dirty-index/restored-worktree A9 drift finding and materially improves immutable review-file and physical-path checks. It is still not a source-completeness reviewer of the kind required by Plan 262-61. The route exercise invokes only the shallow direct-entry selector and replaces `runReceiptCli` with a seam that returns an exported function name; none of the ten named production handlers receives the constructed argv or executes its success/terminal branch. The review document then promotes copied manifest dispositions and static blob inventories to observations.

The remaining custody gates are also incomplete. Protected files may be changed and restored in descendant history, lifecycle files may be replaced while preserving parsed frontmatter, source-fix history is self-asserted by REVIEW-FIX, receipt validation never consults the bounded agent-history entry, readiness omits the required temp/clone/candidate/hook inventory, Plan-62 separation modes do not exist, and generic immutable reads do not enforce Git/current mode equality.

## Prior Finding Resolution Audit

| Prior finding | Status | Evidence |
|---|---|---|
| CR-01 real handler execution/shared validation | **OPEN** | Shared validators are called, but real handlers are not; CR-01 and CR-02 below. |
| CR-02 committed A9 drift/dirty masking | **RESOLVED** | `requireCleanRepository`, first-parent descendant-path rejection, and exact current bytes/mode are enforced at lines 220-258. |
| CR-03 immutable protected history/authorizations | **OPEN** | Exact bytes are pinned, but post-A9 mutate-and-restore history is not rejected; CR-03 below. |
| CR-04 exact lifecycle | **OPEN** | Graph counts/frontmatter are pinned, but replacement bytes and summary lifecycle state are not; CR-04 below. |
| CR-05 immutable review convergence | **OPEN** | Terminal report is immutable, but earlier reports and source-fix commits are not authenticated; CR-05 below. |
| CR-06 receipt/readiness/summary custody | **OPEN** | Summary schema improved, but receipt/history, readiness inventory, and Plan-62 separation remain incomplete; CR-06 and CR-07 below. |
| CR-07 CLI/path confinement | **PARTIAL** | Exact argv, no-follow, owner and link-count checks exist; generic mode/Git-mode custody is still missing; CR-08 below. |
| WR-01 semantic mutation coverage | **OPEN** | The expanded suite does not distinguish dispatcher-name reachability from real handler execution and omits multiple mandated mutations; WR-01 below. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The route exercise still does not call any named production handler

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:589-619`

**Issue:** `dispatchV138CurrentMatrixDirectEntry` only distinguishes receipt commands from `--execute-shard`; its production `runReceipt` implementation is `runReceiptCli`. The reviewer replaces that implementation with a seam that looks up `routeModule[entry.handler]`, checks its JavaScript name, and returns `{ handler, argv }`. The named function is never invoked, `runReceiptCli` never parses the full argv, and no handler success or terminal branch executes. All observations are therefore forced to `exit: 0`, while `terminalDisposition` is copied from the route manifest. This is the same argument/name reachability substitution prohibited by Plan 262-61.

**Fix:** Invoke the exact-A9 `runReceiptCli` (or each exact exported handler through its actual typed dependency seam) with every full argv and complete disposable prerequisites. Observe the named handler call, exact terminal result, exit/output, and filesystem effects. Make the fixture fail if the handler is replaced by a same-name decoy, if argv parsing is bypassed, or if a terminal result is copied rather than returned.

### CR-02 [BLOCKER]: Snapshots, events, cleanup, and publication are claimed rather than observed

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:653-679`

**Issue:** Both snapshots are hashes of the same A9 source-blob array, not complete canonical/protected before-after inventories. Ordered events contain only the synthetic `dispatch:<name>` records created by the reviewer. `cleanup.complete`, empty residual paths, and the two-path publication are literal objects. No disposable review publication commit is created or inspected, no transient destination write/restoration is detectable, and route destinations are never part of the snapshots. Passing those same constructed objects as both claims and observations to the shared validator proves equality with themselves, not independent semantics.

**Fix:** Inventory every closed canonical/protected path before and after, record actual filesystem operations through observers, exercise a two-path disposable publication commit on the required lineage, and derive cleanup from verified temp/clone/destination absence after execution. Supply the shared validator with independently captured objects that cannot share the document's construction path.

### CR-03 [BLOCKER]: Protected history and authorizations accept post-A9 mutate-and-restore commits

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:323-345`

**Issue:** Current protected-history and authorization bytes must equal their frozen carrier and A9 blobs, but the history search ends at `SOURCE_A9`. Unlike A9 source custody, these paths are not checked for any descendant commit in `SOURCE_A9..HEAD`. A later commit may replace an authorization or source-failure record, a second commit may restore the frozen bytes, and this checker accepts the resulting rewritten protected history. That violates immutable protected-history custody and the original CR-03 fix contract.

**Fix:** For the source-failure path and all six authorization paths, reject every first-parent descendant commit touching the path after A9 (including a byte-restoring commit). Add named repository-backed mutate-then-restore tests and assert the dedicated protected-history/authorization rejection code.

### CR-04 [BLOCKER]: Lifecycle validation accepts content replacement that preserves frontmatter

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:390-413`

**Issue:** The exact graph is reduced to `plan:wave:depends_on`, archives to filenames, summaries to count/name presence, and lifecycle state is not parsed. Replacing a plan with arbitrary bytes that retain those three frontmatter fields passes. Replacing any completed summary's contents passes. A coordinated rename of a completed plan and its summary while retaining the original plan frontmatter can also preserve the derived graph and incomplete set. This does not reject replaced summary/lifecycle state as required.

**Fix:** Pin the exact ordered plan and summary path inventory plus committed blob/root (or a separately frozen canonical lifecycle manifest), validate each plan's active/archive/lifecycle status, and authenticate the expected summary-to-plan carrier. Add same-frontmatter plan replacement, summary-byte replacement, coordinated rename, archive-state, dependency, and wave mutations.

### CR-05 [BLOCKER]: REVIEW-FIX self-asserts the source-fix history and does not bind every report

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:455-535`

**Issue:** Only the terminal review gets an immutable commit/blob/root. Earlier reports are represented only by paths, and `sourceFixCommits` is copied from the candidate REVIEW-FIX manifest back into the expected object. Any array of syntactically valid OIDs, including empty or unrelated commits, passes. The checker does not prove those commits are ordered first-parent two-path R3 corrections, correspond to the prior finding reports, or culminate in the reviewed R3. It also does not freeze earlier report bytes. Thus REVIEW-FIX does not bind every report/fix as the plan requires.

**Fix:** Derive the ordered report commit/blob/root sequence from Git, derive each intervening exact two-path source-fix commit from first-parent history, and require a one-to-one report/fix progression ending at `sourceR3`. Compare the manifest against those derived values and add unrelated, missing, reordered, extra-path, rewritten-earlier-report, and empty-source-fix mutations.

### CR-06 [BLOCKER]: Immutable receipt validation is not bound to the bounded agent-history record

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:702-733`

**Issue:** Receipt rendering consults `.planning/agent-history.json`, but `inspectV138Plan26261Receipt` does not. It only verifies that the receipt's self-contained agent/time fields hash to its own `historyEntryRoot`. A malicious one-path receipt commit can choose any nonempty agent ID and timestamp and pass. The receipt contains no bounded history-snapshot root, and validation cannot detect zero/multiple completed Plan-61 entries or a mismatch with the Task-3 history snapshot.

**Fix:** Bind the receipt to an immutable bounded history snapshot/root captured at Task 3, and on validation recompute the unique completed phase-262/plan-61 entry from those exact bytes. Reject receipt commits whose agent, timestamp, phase, plan, or entry root differs from the selected record.

### CR-07 [BLOCKER]: Required readiness inventories and Plan-62 separation modes are absent

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:537-550,735-826`

**Issue:** `snapshotReadiness` contains only porcelain status and destination leaf types. It does not snapshot temp/clone inventory or command/candidate hooks, so unchanged leaked clones or invoked derivation hooks cannot be detected. The exhaustive CLI dispatch implements Plan-61 receipt/readiness/summary modes only; no Plan-62 author-history/separation/candidate/committed modes described by `agent_history_modes` exist. The generic `selectCompletedAgentHistory` unit test is not a Plan-62 custody gate and never compares the Plan-62 agent to the committed Plan-61 receipt.

**Fix:** Add explicit no-temp/no-clone/no-command/no-candidate readiness observations and verify them unchanged around the preflight. Implement the planned exact-argv Plan-62 history, author-separation, candidate, and committed checks, binding the unique completed Plan-62 record to inequality with the committed receipt agent and testing every cardinality/equality/root mismatch.

### CR-08 [BLOCKER]: Generic immutable artifact reads do not enforce expected Git/current mode

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:174-214,440-449`

**Issue:** The no-follow reader records the current mode but accepts any regular single-link mode, and `committedCurrentFile` compares bytes without comparing the committed Git mode or an expected `100644` mode. Review, REVIEW-FIX, receipt, and summary artifacts can therefore be committed/current as executable or otherwise mode-drifted files and still pass. The plan explicitly requires ownership/mode drift rejection across physical confinement, not only for the four A9 source paths.

**Fix:** Read the commit's `ls-tree` mode, require the canonical expected mode for each artifact, compare it to `fstat` mode, and reject mode changes before and after the read. Add executable-bit mutations for review, fix, receipt, history, and summary paths.

## Warnings

### WR-01 [WARNING]: The test suite still lacks the mandated semantic mutation families

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:136-174,335-384`

**Issue:** The route tests assert only handler-name prefixes, manifest argv shape, and ten zero exits, so they pass when no handler runs. The convergence fixture supplies its own `sourceFixCommits`; the receipt fixture has no agent-history file; readiness, summary candidate/commit, Plan-62 modes, transient-write restoration, event reordering, output leakage, disposable publication lineage, competing/later B9, post-A9 protected mutate/restore, same-frontmatter lifecycle replacement, and artifact mode drift are not exercised. The final generic canonicalization test does not prove any production checker consumes a recomputed mutated root.

**Fix:** Add one named repository-backed mutation per Plan-262-61 behavior family, assert the exact rejection code, and instrument actual handler calls/filesystem observations so a name-only dispatcher seam cannot satisfy the positive fixture.

## Verification Performed

- Confirmed source commit `6ad229e8f0c6f84e518027c73a2b09d3a0df3dc9` has tree `3c97b107bd8132c279c56ee07c62fd263a2b58d2`, sole parent `3a63735a603e85a605ce8ce2e82f1dbb0a78873d`, the required nonempty trailer, and exactly the two scoped source paths.
- `git diff --check` passed for the reviewed source commit.
- Traced the production direct-entry selector and `runReceiptCli`: the reviewed seam calls the selector but replaces the production receipt runner and never invokes the named handler.
- Traced the shared review-v3 validator: it compares supplied claims to supplied observations but cannot establish that both were independently derived.
- Attempted the focused suite from a clean detached clone. Repository-backed tests progressed through the route exercise; the spawned pnpm CLI subtest could not resolve the cloned workspace through the shared dependency installation, so no clean full-suite result is claimed by this review.
- No source file, REVIEW-FIX, receipt, summary, Plan-62 artifact, authority artifact, or live destination was modified by this review.

---

_Reviewed: 2026-08-23T23:52:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
