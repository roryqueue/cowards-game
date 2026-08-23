---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "60"
reviewed: 2026-08-15T07:59:27Z
depth: deep
source_base: c8057dd1a4338b00a05771f88edb03a32128164c
reviewed_source_commit: c10aa9bd1462c8191305608715252eca12bc3751
reviewed_source_tree: dfcbcd4e0a9624cfd5011838bc89c8c658996632
files_reviewed: 8
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 6
  warning: 1
  info: 0
  total: 7
status: issues_found
---

# Phase 262 Plan 60: Code Review Report

**Reviewed:** 2026-08-15T07:59:27Z
**Depth:** deep
**Files Reviewed:** 8
**Status:** issues_found

## Summary

The exact four-commit A9 author run has the declared eight-path aggregate diff,
does not embed sourceBase9/A9/tree literals, deletes both reviewer-v2 files, and
keeps canonical review-v3, authorization-v9, seal-v9, B9, route, and live
artifacts absent. The v7/v8 CLI aliases also fail closed.

The production boundary is nevertheless not shippable. A recomputed-root review
with duplicate source blobs and duplicate command/handler records is accepted.
Authorization does not compare the review's source, publication, or protected
history claims with its independently derived observations. The real route is
then structurally incompatible with the v9 seal/custody objects and cannot start
or record its pre-observation failure dispositions. Source custody records the
wrong A9 parent, protected-history roots can be replaced from a mutable current
file, and the dependency analyzer reconstructs the deleted reviewer-v2 source
while dynamically suppressing every finding on the A9 boundary.

Both submitted production-focused test files fail in the reviewed state. The
dependency CLI still prints a zero-finding pass only because its A9 exemption
masks these defects.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Review-v3 accepts duplicated and semantically disconnected evidence

**Files:**

- `scripts/lib/v1-38-source-completeness-review-v3.ts:76-119`
- `scripts/lib/v1-38-successor-source-seal.ts:5791-5829`
- `scripts/lib/v1-38-successor-source-seal.ts:5982-6003`

**Issue:** The shared validator requires eight paths and eight blob-shaped
records, but never requires one unique blob record per path. It likewise accepts
ten copies of one command and ten copies of one handler observation, does not
join observations to commands, and only syntax-checks prior authorization and
snapshot records. Authorization independently locates a publication and derives
A9/history, but never compares those facts with `sourceCustody`, `publication`,
`protectedHistory`, `priorAuthorizationBytes`, snapshots, commands, or handlers
inside the zero-finding document. A safe local fixture replaced all eight blobs
with the first blob and all ten commands/handlers with duplicates, recomputed
`reviewV3Root`, and was accepted (`duplicateBlobPaths: 1`,
`duplicateCommands: 1`). A canonically rooted fabricated review can therefore
authorize v9.

**Fix:** Require the exact eight A9 paths, a bijection between paths and blob
records, unique exact command inventory, unique handler observations, and exact
command/observation joins. During authorization, compare every review custody,
publication, protected-history, authorization-byte, snapshot, and event claim
to independently derived Git/filesystem observations before accepting the
verdict.

### CR-02 [BLOCKER]: The real v9 route consumes fields that v9 custody and seal never return

**Files:**

- `scripts/lib/v1-38-successor-source-seal.ts:6039-6141`
- `scripts/lib/v1-38-current-matrix-reproduction.ts:19269-19345`

**Issue:** `checkV138SuccessorSealCommitV9` returns nested `authorization` and
`seal` plus B9 metadata. It does not return top-level `authorizationRoot`,
`sealRoot`, `sourceA9`, or `custodyRoot`. The production adapter immediately
compares the nonexistent top-level roots at lines 19285-19286, so every valid v9
route throws. If that were corrected, the context builder still reads
`route.custody.sourceA9`, `route.custody.custodyRoot`,
`route.seal.selectedRouteClosure`, and `route.seal.protectedHistory`, none of
which exist in the v9 shapes. The submitted source-complete suite reproduces the
result as `MATRIX_SUCCESSOR_CANONICAL_JSON_INVALID` while serializing the
undefined context fields.

**Fix:** Define one typed v9 route object and construct it explicitly from
`custody.authorization`, `custody.seal`, and derived v9 closure/history/tool/
formation records. Make all context/preflight/calibration/reproduction builders
consume that type, then exercise the actual authority checker through full valid
argv before accepting the manifest.

### CR-03 [BLOCKER]: Pre-observation terminal branches still execute the obsolete v7 anchor path

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:20098-20154,20351-20382`

**Issue:** Tool-identity, protected-history, and formation-absence terminal
evidence still calls `inspectV138...V7Anchor`,
`checkV138SuccessorSourceSealV7`, and `deriveV138ProtectedHistoryV7` with A9/B9.
The same path passes an `observationException` into the v9 authority adapter,
which unconditionally rejects every exception at lines 19273-19275. Thus the
route cannot truthfully close any pre-observation failure; those required
terminal dispositions are unreachable even after CR-02 is repaired.

**Fix:** Implement v9-specific observation anchors over the v9 authorization,
seal, B9 custody, protected history, tool identity, and formation-absence
records. Permit only the named failing observation to differ while all other v9
joins remain exact; remove v7 anchors from every active route-7 branch.

### CR-04 [BLOCKER]: Authorization records sourceBase9 as A9's parent

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5846-5884`

**Issue:** The author run is four commits:
`af052061 -> 8c3cab21 -> f3fb21d6 -> c10aa9bd`. A9's sole parent is
`f3fb21d6b0bdda0cdcba8cdbde79cf48439e90d4`, but the derivation returns
`sourceA9Parent: sourceBase9` (`c8057dd1...`). This contradicts Git and the
summary custody record, and any authorization emitted from the exact reviewed
range contains false lineage.

**Fix:** Return the actual sole parent of A9 (the final commit's verified parent),
retain sourceBase9 separately as the parent of the first author-run commit, and
compare both values to the review document's custody section.

### CR-05 [BLOCKER]: The dependency analyzer reactivates deleted reviewer-v2 bytes and dynamically exempts A9 source

**Files:**

- `scripts/check-v1-38-dependency-revision-boundaries.ts:652-752`
- `scripts/check-v1-38-dependency-revision-boundaries.ts:809-850`
- `scripts/check-v1-38-dependency-revision-boundaries.ts:1333-1361`

**Issue:** The frozen route-capable inventory still requires the deleted
reviewer-v2 checker. When the path is absent, collection silently loads its old
blob into the active source map. The A9 check then derives its accepted run from
whatever trailer-bearing commits are in current history and filters out every
policy finding whose path is in the eight-path A9 boundary. This makes changed
production route code define its own allowlist and lets the obsolete reviewer
continue participating in active analysis. The dependency CLI reports zero
findings, while the route suite fails at line 355 because `git show HEAD:` cannot
find the supposedly required reviewer-v2 path.

**Fix:** Remove reviewer-v2 from the active frozen inventory and inspect its
immutable object only in a separately named historical-custody check. Replace
the dynamic A9-wide finding suppression with exact detached A9/tree/blob
bindings supplied by the later carrier/reviewer, and always AST-scan changed A9
production bytes. Never suppress semantic findings merely because a path was in
the author run.

### CR-06 [BLOCKER]: Protected-history roots are accepted from a mutable current artifact

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5887-5933`

**Issue:** The v9 history derivation reads the current
`v1.38-plan-262-47-pre-execution-source-failure-v1.json`, checks only its A6/B6
IDs, forty charge IDs, and that `protectedRoots` is an object, then adopts every
root and hashes the current bytes. It never compares that artifact or its nested
roots to the exact sourceA9 blob or any frozen commit/blob/digest. A coherent
rewrite of `protectedRoots` therefore becomes the new v9 history, even though
the six authorization files are correctly pinned.

**Fix:** Pin the failure artifact's exact commit/blob/SHA-256 and exact nested
protected-root inventory, compare current and sourceA9 bytes to that immutable
object, and reject missing, extra, or changed roots before computing v9 history.

## Warnings

### WR-01 [WARNING]: The submitted tests do not exercise a valid v9 route and fail in their default runs

**Files:**

- `scripts/evaluate-v1-38-successor-route.test.ts:351-386,555-588`
- `scripts/evaluate-v1-38-successor-source-complete.test.ts:257-329`

**Issue:** The route test reads the deleted reviewer from `HEAD` and fails. Its
obsolete-path assertion expects two paths while production correctly lists four,
so that focused test also fails. The source-complete test constructs a v7-shaped
mock route for the v11 context and fails canonical serialization, while the only
large Git-backed writer exercise is skipped. Manifest dispatch merely increments
a stub and does not establish that full valid argv reaches a working v9 handler.
Consequently the reported focused green result is not reproducible and none of
CR-02/CR-03/CR-04 is covered.

**Fix:** Delete stale reviewer-v2 expectations, update the four-path v7/v8
denial assertion, and replace v7-shaped mocks with a real exact-A9 review
publication, authorization-v9, direct-child B9, and full valid argv fixture.
Keep malformed-argv tests as separate negative coverage and do not skip the only
end-to-end route fixture.

## Verification Performed

- Re-derived the exact four-commit sourceBase9..A9 run, eight changed paths,
  tree, sole parent, and author-run trailers from Git.
- Confirmed the two reviewer-v2 paths are deleted at A9 and remain reachable in
  Git history; no sourceBase9/A9/tree literal is embedded in A9 source.
- Confirmed canonical review-v3/authorization-v9/seal-v9/B9/route/live artifacts
  are absent at A9.
- Confirmed obsolete v7 and v8 CLI commands fail closed with
  `V138_PLAN_262_56_V7_V8_CLI_OBSOLETE`.
- Dependency analyzer CLI reported zero findings in `a9_complete_43_of_48`.
- Focused two-file suite failed in the route test because the deleted reviewer-v2
  path is still treated as active frozen source.
- Source-complete suite failed with `MATRIX_SUCCESSOR_CANONICAL_JSON_INVALID` in
  the v11 route context builder.
- The obsolete-path focused test failed because production lists all four v7/v8
  paths while the test expects only v7.
- A recomputed-root duplicate-blob/duplicate-command review-v3 document was
  incorrectly accepted.
- Workspace package typecheck passed 27/27, but root `scripts/` are not covered
  by those package typecheck tasks.
- `git diff --check sourceBase9..A9` passed.
- No source, canonical evidence, live destination, or external state was written.

---

_Reviewed: 2026-08-15T07:59:27Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
