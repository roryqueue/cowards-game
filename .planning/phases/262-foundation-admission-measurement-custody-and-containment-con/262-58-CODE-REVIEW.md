---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "58"
reviewed: 2026-08-15T05:10:45Z
depth: deep
source_base: a4c8c8108cc3acf639407fd5fc77a98326e3595d
reviewed_source_commit: da8b33942edbc0900ebeba616e459a2a0d2f92ae
files_reviewed: 6
files_reviewed_list:
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/check-v1-38-dependency-revision-boundaries.ts
findings:
  critical: 8
  warning: 1
  info: 0
  total: 9
status: issues_found
---

# Phase 262 Plan 58: Code Review Report

**Reviewed:** 2026-08-15T05:10:45Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Exact A8 has the advertised sole parent and exact six-path diff, and the focused
tests pass. The new trust boundary does not, however, perform the independent
review it claims. The positive reviewer fixture is a hand-built object with
fake handlers, fake roots, fake charge IDs, and no executed commands; production
accepts it. Authorization-v8 likewise accepts a nonexistent detached path and
arbitrary well-shaped Git identities, while the seal accepts arbitrary B8
metadata without inspecting Git. The lifecycle CLI is more immediately unsafe:
it now omits the pre-existing dependency boundary analysis and exits zero even
though calling that analysis directly reports 162 findings in the current
workspace.

The implementation also retains all obsolete v7 writer/checker entry points as
aliases that target v8 paths, contrary to the no-compatibility-alias contract.
These defects permit a self-authored review and fabricated custody document to
be promoted toward authority, so Plan 262-59 must not consume this checker.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Reviewer-v2 accepts a forged transcript instead of deriving execution evidence

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:53-81`

**Issue:** `validateReviewV2Candidate` validates only the values supplied by the
candidate. It never invokes the exact-A8 CLI, authenticates a transcript, or
cross-checks a record against a handler result. Any ten records pass when they
repeat the expected command strings and provide arbitrary nonempty handler,
prerequisite, and destination strings, a digest-shaped string, and success
booleans. The committed positive test demonstrates the bypass: its handlers are
`handler-0` through `handler-9`, destinations are `destination-0` through
`destination-9`, roots are repeated digits, and no command is executed. The
five-entry event ledger is also a fixed string list rather than observed
open/write/lstat/cleanup events. A forged, nonexecuted transcript therefore
receives a zero-finding validation.

**Fix:** Make the checker own an exact-A8 disposable clone and invoke every
actual dispatch branch with injected runners/observers. Record output, reached
export, prerequisites, destination, effects, terminal disposition, and ordered
filesystem events from those calls. Validate captured evidence against the
imported production manifest and reject caller-supplied transcript facts.

### CR-02 [BLOCKER]: Reachability, protected history, snapshots, publication, and confinement are self-attested

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:82-134`

**Issue:** Every remaining review boundary is reduced to candidate literals.
The export inventory may be any ten unique strings; sourceBase8/A8 may be any
40-hex strings; the forty charges may be `charge:0` through `charge:39`; prior
authorization paths and roots may be invented; snapshots need only repeat a
digest-shaped string; publication may name any two distinct paths; and all path
security checks are accepted as booleans. None is derived from production
exports/dispatch, Git objects, authoritative protected artifacts, the filesystem
event ledger, publication commits/blobs, or no-follow path inspection. Extra
nested keys are also accepted because there is no exact-key validation. This
recreates CR-02 and CR-04 through CR-08 from the failed v1 checker under new
field names.

**Fix:** Independently derive each inventory. Import and exercise the actual
manifest/dispatch/exports; rebuild the exact forty IDs, six authorization byte
records, and protected roots from committed authorities; snapshot a closed path
inventory and event stream; inspect the unique two-path publication commit and
later history; and canonicalize/lstat/open every path. Apply exact-key schemas
at every level.

### CR-03 [BLOCKER]: `--check-review-v2` trusts the candidate artifact as its own proof and fabricates PASS output

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:253-260`

**Issue:** The immutable-check mode reads the canonical candidate, calls the
self-attestation validator, then unconditionally prints `findingCount: 0` and
`sourceCompletenessPassed: true`. It neither reruns the review nor binds the
artifact to an independently captured immutable transcript. There is no
exclusive publication API at all; `publication.mode`, unique commit count,
blob immutability, and later modification count exist only inside the candidate
being trusted. Consequently Plan 262-59 could publish a forged candidate and
obtain an apparently authoritative PASS from the production CLI.

**Fix:** Separate generation/publication/checking. Generate only from owned
observations, publish artifact and report with exclusive creation after a
zero-finding gate, and have immutable check mode derive the unique introducing
commit, exact two blobs, parent/path shape, and absence of later modifications.
Never turn candidate fields directly into a PASS projection.

### CR-04 [BLOCKER]: A8 custody is not bound to the exact boundary or maximal source run

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:199-223`

**Issue:** The default search selects any unique commit anywhere in `--all`
history whose one-commit diff happens to contain the six paths. The optional
argument accepts any caller-selected commit with that shape. The function does
not bind the exact sourceBase8/A8 pair, derive the RED boundary or maximal run,
check an implementation-run trailer, verify that later descendants are
planning-only, or reject an unrelated replacement six-path commit. The separate
candidate validator is weaker still and accepts arbitrary OIDs plus a
`planningDescendantsOnly: true` assertion.

**Fix:** Derive the initial RED boundary from the frozen Plan-262-58 predecessor,
walk the complete linear source-only run, require exact parent/path/blob/trailer
custody and exact `a4c8c810.../da8b3394...`, then inspect every descendant that
touches summary/review paths and prove it is planning-only. Remove the arbitrary
source-A8 selector from the authoritative path.

### CR-05 [BLOCKER]: Authorization-v8 accepts nonexistent detached input and fabricated Git/protected custody

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5717-5850`

**Issue:** The detached review validator never opens or stats
`absolutePath`. It trusts `readOnly`, owner, regular-file, symlink, link-count,
pre/post digest, and no-follow identity fields supplied by the caller. The
committed passing test deliberately uses a nonexistent `/private/tmp/...` path
and fake commit/blob IDs. The review document is not checked by reviewer-v2 and
its `reviewRoot` is not objectively recomputed. Likewise sourceBase8, A8, tree,
parent, per-path blobs, protected-history root, and the invalid-disposition hash
are only syntax-checked; no Git object or authoritative byte is read. The
authorization also omits the required exact forty charges, six prior
authorization bytes, and earlier protected roots behind one arbitrary digest.

**Fix:** Accept only the named detached absolute file, pin its parent chain,
open no-follow, compare pre/post fstat identity and bytes, enforce owner/mode/link
count, and validate its exact canonical reviewer-v2 schema/root. Independently
derive A8 tree/parent/path/blob custody and all protected-history components from
Git and canonical artifacts; do not take those facts as builder parameters.

### CR-06 [BLOCKER]: Seal-v8 does not verify B8 Git custody or immutable authorization bytes

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5853-5899`

**Issue:** `buildV138SuccessorSourceSealV8` accepts arbitrary 40-hex B8/tree
values, checks only that a supplied parent equals the equally unverified A8,
and sorts a supplied two-path list. `checkV138SuccessorSourceSealV8` simply
rebuilds that self-authored shape. It does not resolve B8, require a sole parent,
derive its changed paths/tree/blob OIDs, prove the paths were absent at A8,
compare committed authorization/seal bytes to supplied/worktree bytes, or reject
later modification. Thus a fabricated B8 and arbitrary authorization can pass
without either Git object existing.

**Fix:** Inspect the actual B8 commit and its sole parent, exact two-path diff,
tree and blob OIDs; validate exclusive creation at those paths; bind the exact
committed authorization and seal bytes to supplied detached inputs; and reject
later path modifications or mutable aliases.

### CR-07 [BLOCKER]: Obsolete v7 public APIs and CLI commands remain active as v8 aliases

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5659-5666,5901-5907,6395-6417,7441-7486`

**Issue:** Instead of removing v7 compatibility, the patch changes
`V138_SUCCESSOR_SOURCE_SEAL_V7_SCHEMA` and the old canonical-path object to v8
values while retaining `build/write/check...V7` functions and the
`--render/--write/--check-...-v7` CLI branches. Those old branches now target the
v8 canonical destinations but still derive the archived review-v1/A7 contract.
The tests explicitly bless the alias equality. This violates the plan's
no-compatibility-alias rule and creates an alternate route that can write v8
named artifacts without the new review-v2/A8 checks.

**Fix:** Restore historical v7 constants solely for immutable historical
verification, make every obsolete v7 future writer/CLI mode fail closed, and add
distinct v8 renderer/writer/checker entry points that exclusively use the
review-v2/A8 contract. Tests must reject, not endorse, every v7 command and
destination.

### CR-08 [BLOCKER]: Dependency `--check` bypasses the boundary analyzer and reports a false pass

**File:** `scripts/check-v1-38-dependency-revision-boundaries.ts:1248-1266`

**Issue:** The previous CLI called `checkV138DependencyRevisionBoundaries()`
and failed on its findings. The replacement calls only
`checkV138Plan26258LiveLifecycle()` and prints `passed_lifecycle`. This was
reproduced directly: `pnpm exec tsx ... --check` exited zero, while importing
and calling `checkV138DependencyRevisionBoundaries()` against the same workspace
returned 162 findings, including plan-discovery and route-reuse violations.
The advertised dependency gate therefore silently ignores all protected
history, policy-source, path, authority-artifact, manifest, and tooling checks.
Within the lifecycle helper, authorization/seal versions, route ordinal, and
execution versions are also hardcoded as expected values rather than derived
from source/artifacts (lines 1084-1095), so those mutations cannot be observed.

**Fix:** Run both analyses in `--check`, fail if either produces a finding, and
print success only after the full boundary set is empty. Derive schema versions,
route ordinal, execution destinations, exact plan IDs/order/waves, disposition,
archive state, and incomplete set from the live index and committed artifacts;
never pass expected literals into the evaluator as if they were observations.

## Warnings

### WR-01 [WARNING]: The mutation suite is a four-test synthetic tautology and does not cover the promised attacks

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts:59-163,187-254`

**Issue:** The suite constructs the same fabricated candidate the production
validator expects and mutates only one field per finding family. It never builds
an exact-A8 Git fixture, executes a CLI command or terminal branch, observes an
event, tests transient writes/cleanup, derives protected inputs, or exercises
publication history. Lifecycle coverage mutates only the incomplete list; it
does not test missing/extra/duplicate/reordered plans, obsolete v7 dispatch,
wrong destinations/versions, early summaries, or stale counts. Authorization
tests pass nonexistent files and fake Git IDs, and no test proves a v8 renderer,
writer, immutable input reader, or B8 commit check. Passing 4/4 therefore gives
no evidence for the detailed acceptance claims in the plan and summary.

**Fix:** Replace the fabricated positive fixture with an owned exact-A8 clone
and actual production dispatch. Add independent recomputed-root mutations for
every enumerated subcase, all six live lifecycle fixtures, real detached-file
metadata/byte mutations, exact protected-history mutations, v7-denial tests,
and a real exact-two-path B8 Git custody test.

## Verification Performed

- Exact A8 diff/tree/parent and six blob identities were re-derived from Git.
- Focused reviewer-v2 suite: 1 file, 4 tests passed; the passing positive values
  are fabricated rather than observed.
- Focused v8 route/source schema selectors: 2 tests passed, 21 skipped.
- Dependency CLI `--check`: exited zero with `passed_lifecycle`.
- Direct `checkV138DependencyRevisionBoundaries()`: returned 162 findings in the
  same workspace, proving the CLI bypass.
- `git diff --check sourceBase8..A8`: passed.

---

_Reviewed: 2026-08-15T05:10:45Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
