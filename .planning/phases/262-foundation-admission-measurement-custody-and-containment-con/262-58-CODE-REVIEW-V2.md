---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "58"
reviewed: 2026-08-15T05:56:00Z
depth: deep
source_base: 9fb6b12f190ff5a79e423efafbfaae01c1037b5d
reviewed_source_commit: ba567987e7a64239b93ebc40ad9d280231172a44
reviewed_source_tree: c5abb22112fec8c3a47f3b3260dd3b4d5c7f4ec3
files_reviewed: 6
files_reviewed_list:
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/check-v1-38-dependency-revision-boundaries.ts
findings:
  critical: 9
  warning: 1
  info: 0
  total: 10
status: issues_found
---

# Phase 262 Plan 58: Code Review Report V2

**Reviewed:** 2026-08-15T05:56:00Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The correction does not close the review trust boundary. The focused suite passes
28/28 and the dependency CLI reports zero findings in the current checkout, but
those successes are compatible with fabricated custody, a nonexecuted dispatch
transcript, an invented review-v2 document, committed authority-writer drift, and
replacement of a required lifecycle plan.

Three bypasses were reproduced in disposable repositories. First, a new commit
whose only changes were executable-bit flips on the six paths and whose trailer
was attacker-selected was accepted as A8. Second, appending and committing
`writeV138ProductionAuthority` to the successor-seal module was dynamically
admitted as the frozen source and returned zero policy findings. Third, replacing
Plan 262-02 with Plan 262-03 and updating its dependencies preserved the five
terminal waves and was accepted by the live lifecycle checker. In addition, the
committed positive authorization test explicitly proves that empty custody,
reachability, transcript, protected-history, and snapshot objects are accepted as
a real review-v2 input.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: The owned transcript still does not execute the reviewed commands or handlers

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:236-281`

**Issue:** The disposable clone is not the code used for dispatch. The checker
calls `checkV138Route7SourceCompleteness` and
`dispatchV138CurrentMatrixDirectEntry` imported from the ambient reviewer
process, and each dispatch stops at a `runReceipt` stub that simply returns the
manifest's handler string. The recorded prerequisite, destination, effect,
disposition, exit status, and output digest are copied from that same manifest;
no production handler is invoked. The only child process runs an existing test
file, while `fs.watch` records unrelated TMPDIR traffic. Therefore an owned but
nonexecuted transcript is still promoted to zero findings.

**Fix:** Load the dispatcher and manifest from the detached exact-A8 clone, invoke
every real CLI branch with injected production observers/runners, and derive each
record from handler output and ordered filesystem events. Reject any record that
is copied from expected metadata instead of observed execution.

### CR-02 [BLOCKER]: Protected history and authorization inventories remain self-derived from mutable inputs

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:151-175`

**Issue:** The exact forty charge IDs and protected roots are copied from the
Plan-262-47 failure artifact, and the six authorization paths are whichever
tracked filenames match a regex. Only cardinality and uniqueness are checked.
The same pattern is duplicated in the authorization builder at
`scripts/lib/v1-38-successor-source-seal.ts:5856-5884`. Worktree hashes are paired
with `HEAD` blob IDs without proving that those bytes match. A coherently rewritten
failure artifact, substituted forty-value list, or different six authorization
files therefore becomes the new protected history.

**Fix:** Rebuild every exact charge ID, authorization path/blob/bytes record, and
protected root from immutable authoritative commits and schemas. Compare worktree
bytes to the cited Git blobs and fail on any missing, extra, renamed, or rewritten
input.

### CR-03 [BLOCKER]: A8 custody accepts an attacker-selected replacement commit

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:87-148`

**Issue:** Custody searches `HEAD` for any commit carrying the trailer key and an
exact six-path diff; it does not bind sourceBase8, A8, tree, trailer value, or the
six blob identities to the frozen values. The supposed Plan-58 predecessor check
at lines 100-103 has an empty body and cannot reject anything. This was reproduced:
an attacker commit over the real source base containing only mode changes on the
six paths and trailer `attacker-controlled` was accepted as A8
`8ba9aed0185cdb71edd1c65f6cdc1a616a28b6c5`. The authorization implementation
repeats the same selector at `scripts/lib/v1-38-successor-source-seal.ts:5812-5853`.

**Fix:** Bind exact sourceBase8 `9fb6b12f...`, A8 `ba567987...`, tree
`c5abb221...`, trailer value, sole parent, file modes, and all six blob OIDs and
SHA-256 values. Derive the boundary from immutable Plan-58 evidence rather than a
grep over caller-controlled history.

### CR-04 [BLOCKER]: Authorization-v8 accepts a fabricated review-v2 document and a false external-identity claim

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5760-5787`

**Issue:** Detached-file handling now checks real filesystem and Git bytes, but it
does not validate the review semantics with reviewer-v2. It accepts arbitrary
`custody`, `reachability`, `transcript`, `protectedHistory`, and `snapshots`
objects so long as the top-level root is recomputed and the verdict says zero.
It also omits `externalIdentityClaimed` from the false-claim checks. The committed
positive test at
`scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts:143-172`
constructs those five objects as `{}` and successfully builds authorization-v8.
Thus a real detached file can contain a wholly fabricated review and still
authorize the successor.

**Fix:** Export and call an immutable, side-effect-free reviewer-v2 document
validator that enforces exact nested keys and independently recomputes custody,
transcript, protected history, snapshots, all five false identity claims, and the
review root. The authorization test must consume a real artifact emitted by the
reviewer, not a hand-built zero-verdict object.

### CR-05 [BLOCKER]: The live route contract still requires obsolete v7 authority while v7 entry points fail closed

**File:** `scripts/evaluate-v1-38-successor-source-complete.test.ts:207-231`

**Issue:** The corrected tests explicitly require the route contract's
authorization and seal schemas to remain v7 and assert that they differ from v8.
The production route contract consequently still names v7, while the corrected
writers and CLI reject every v7 operation and the lifecycle checker separately
claims authorization/seal version 8. Downstream route readiness therefore cannot
connect the new v8 authority to route ordinal 7, and the green tests bless this
contradiction rather than detecting it.

**Fix:** Update the route-7 contract and its authorization/seal consumers to the
distinct v8 schemas and A8/B8 fields while preserving route ordinal 7 and the
v11/v12 execution destinations. Keep historical v7 readers isolated and make all
future v7 writer/CLI paths fail closed.

### CR-06 [BLOCKER]: The dependency allowlist dynamically trusts the current commit, including malicious committed code

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:652-664`

**Issue:** `V138_FROZEN_ROUTE_CAPABLE_SOURCE_SHA256` is computed from
`git show HEAD:path` at module load. It is therefore not frozen: any committed
mutation defines its own expected hash and is skipped by semantic analysis. This
was reproduced by appending and committing
`export const writeV138ProductionAuthority = true`; the supposedly frozen
allowlist adopted the new hash and `analyzeV138PolicySourcesWithFrozenRouteAllowlist`
returned zero findings.

**Fix:** Store immutable reviewed blob IDs/SHA-256 values for exact A8 (and the
separately protected unchanged sources). Resolve those fixed Git objects, compare
current bytes against them, and always AST-scan drifted bytes in addition to
reporting drift.

### CR-07 [BLOCKER]: Lifecycle validation no longer verifies the exact 47-plan inventory

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:824-832`

**Issue:** `planDiscoveryFindings` returns immediately after the lightweight live
lifecycle check, leaving the exact inventory analysis below it unreachable. The
live checker validates only the total count, summary count, five final waves, and
the corrective incomplete set. It never compares all plan IDs. A disposable
repository replacing completed Plan 262-02 with Plan 262-03 and updating
dependencies retained 47 plans and the expected waves 43-47; the checker accepted
`plan_58_complete_43_of_47`. The full analyzer emitted no
`PLAN_DISCOVERY_DRIFT` for the replacement.

**Fix:** Remove the early return and compare the complete ordered plan-ID,
dependency, wave, archive, summary, and incomplete inventories in every lifecycle
mode. Add real repository fixtures for missing, extra, duplicate, substituted,
and reordered plans rather than testing only an already-constructed input object.

### CR-08 [BLOCKER]: Review publication accepts detached/off-branch custody and can partially or externally write

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:353-393`

**Issue:** Publication searches `--all` for any exact two-path commit but never
requires that commit to descend from A8 or be an ancestor of `HEAD`. An off-branch
commit plus matching untracked worktree bytes can therefore masquerade as the
canonical publication, and `commit..HEAD` does not establish later-history
immutability when the histories are unrelated. Publication also checks only the
two leaf paths, then performs two independent writes without no-follow ancestor
validation or rollback; a symlinked ancestor can redirect writes outside the
repository, and failure of the report write leaves a partial artifact.

**Fix:** Require the unique publication commit to be the direct allowed descendant
of exact A8 and an ancestor of `HEAD`, bind its exact blobs, and inspect all later
history. Validate and pin every ancestor no-follow, stage both files in a private
directory, and publish atomically or cleanly roll back on failure.

### CR-09 [BLOCKER]: B8 verification does not require B8 to be in the current custody chain

**File:** `scripts/lib/v1-38-successor-source-seal.ts:6041-6068`

**Issue:** The checker resolves a real commit and validates its A8 parent and two
paths, but never proves `sourceB8` is an ancestor of `HEAD` or the unique canonical
B8. Its later-modification query assumes ancestry. A two-path commit on a detached
branch can be supplied while identical files are placed in the A8 worktree; the
byte comparisons pass and `sourceB8..HEAD` contains no later path commit because
the histories diverge. This permits fabricated publication custody even though
the OID itself exists.

**Fix:** Require exact B8 to be the unique direct A8 child on the current
first-parent chain, require `merge-base --is-ancestor B8 HEAD`, derive the
introducing commit from the canonical paths rather than a caller OID, and reject
any competing/off-branch two-path commit or later modification.

## Warnings

### WR-01 [WARNING]: The mutation suite still does not exercise the claimed finding families

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts:50-198`

**Issue:** The reviewer suite contains five broad tests, no recomputed-root
mutation per CR-01 through CR-08/WR-01, no fake-A8 rejection, no committed-source
allowlist attack, no real lifecycle inventory fixtures, no external-identity
mutation, no off-branch publication/B8 case, and no publication symlink or partial
write case. Its authorization positive fixture is intentionally fabricated.
Additionally, `scripts/evaluate-v1-38-successor-source-complete.test.ts:393-401`
returns immediately after the v7 denial assertions, making the rest of that test's
route/custody checks unreachable. Passing 28 tests therefore does not substantiate
the review claims.

**Fix:** Add one named semantic mutation for every finding and subcase, recompute
all enclosing roots, and assert the specific rejection. Use exact detached Git
fixtures for A8, publication, B8, lifecycle, path aliases, later rewrites, and
false identity claims; remove unreachable legacy test code.

## Verification Performed

- Re-derived exact sourceBase8/A8 parent, tree, six paths, and six blob OIDs from Git.
- Focused three-file suite passed: 28/28 tests.
- Dependency analyzer plus lifecycle CLI reported zero findings in the current checkout.
- Obsolete v7 CLI invocation failed closed with `V138_PLAN_262_56_V7_CLI_OBSOLETE`.
- Fabricated six-path A8 was incorrectly accepted.
- Committed production-authority writer was incorrectly admitted by the dynamic frozen allowlist with zero findings.
- Replaced Plan-262-02 lifecycle inventory was incorrectly accepted by the live lifecycle checker.
- `git diff --check sourceBase8..A8` passed.

---

_Reviewed: 2026-08-15T05:56:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
