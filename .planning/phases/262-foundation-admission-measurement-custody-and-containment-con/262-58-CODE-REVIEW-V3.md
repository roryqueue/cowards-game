---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "58"
reviewed: 2026-08-15T06:58:23Z
depth: deep
source_base: 5fa635ccebfcef6ff00cd05876401cec4688e64f
reviewed_source_commit: 2b05b6529f7213790e09e767e2710cb8f43c5b76
reviewed_source_tree: 92603fc9e9b79a8755651f289ab09bccab0e12a4
custody_carrier_commit: 30add7517b5a32442a281008e67ba16f743d0d0b
review_fix_commit: b620ed201287ba11464270d7b646d6ea5748f838
files_reviewed: 6
files_reviewed_list:
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts
  - scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts
  - scripts/lib/v1-38-successor-source-seal.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/check-v1-38-dependency-revision-boundaries.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 262 Plan 58: Code Review Report V3

**Reviewed:** 2026-08-15T06:58:23Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

The correction passes its serialized 28-test suite, the full dependency CLI,
the exact 47-plan substitution fixture, all six lifecycle fixtures, the
off-lineage publication fixture, and the off-branch B8 fixture. Those successes
do not close the source-review boundary.

Five blocker bypasses remain. The execution transcript promotes ten argument
validation failures as successful reachability evidence. A coherently rewritten
summary carrier can select arbitrary replacement bytes as A8. A committed
post-A8 source mutation is accepted when the worktree/index is restored to A8
bytes. Authorization-v8 accepts a committed, canonically rooted review whose
nested custody, transcript, protected history, snapshots, and route ordinal are
fabricated. Finally, the production route contract and manifest still consume
authorization-v7/seal-v7; the new v8 contract is a parallel constant used only
by tests and the successor-seal module.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Error-only CLI probes are promoted as successful handler reachability

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:343-375`

**Issue:** The detached A8 module is imported, but every call to `runReceiptCli`
receives only `node`, a script label, and the command. None receives the required
authorization, seal, source, target, mode, or receipt arguments. All ten probes
therefore fail before their named production handler can complete. The capture
then copies `reachedHandler`, prerequisite, destination, effect, and terminal
disposition from the manifest and treats any caught error as exit 64. The review
builder at lines 488-500 never rejects those errors or nonzero exits and emits a
zero-finding PASS. The exact committed fixture produced exit 64 for all ten
commands, including `MATRIX_PLAN_262_57_PRE_START_CLI_ARGUMENTS_INVALID`,
`MATRIX_PREFLIGHT_V11_CLI_ARGUMENTS_INVALID`, and
`MATRIX_REPRODUCTION_V12_CLI_ARGUMENTS_INVALID`.

**Fix:** Construct the complete valid argv and prerequisite fixture for each
command, instrument the actual named handler, and derive handler, destination,
effect, disposition, and output from observed calls. Reject unexpected errors,
nonzero exits, or a command that stops in argument validation. For example:

```ts
if (record.exitStatus !== 0 || record.observedError !== null ||
    observedHandler !== entry.handler) {
  throw new TypeError("V138_REVIEW_V2_HANDLER_EXECUTION_INVALID")
}
```

### CR-02 [BLOCKER]: The known immutable carrier and A8 are not actually frozen

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:127-183`

**Issue:** Only sourceBase8 is a code constant. The checker reads sourceA8,
tree, trailer value, blob OIDs, digests, lengths, and the alleged introducing
commit from the current summary bytes. It filters history for the carrier that
matches those same mutable bytes rather than binding the known carrier commit
`30add751...`, carrier blob, A8 `2b05b652...`, tree, and six fixed blobs. In a
disposable repository, six source files were changed over the real sourceBase8,
committed with the expected trailer, and followed by a rewritten one-path
summary carrier with recomputed metadata. `inspectV138SourceIdentityA8`
incorrectly accepted the attacker commit `c4e7e0e6...` as A8. The duplicate
derivations in `scripts/lib/v1-38-successor-source-seal.ts:5898-5960` and
`scripts/check-v1-38-dependency-revision-boundaries.ts:652-706` inherit the same
substitution weakness.

**Fix:** Freeze and verify the exact carrier commit/blob and the complete A8
identity independently of worktree summary literals. At minimum bind
`30add751...`, `2b05b652...`, tree `92603fc9...`, the sole parent, trailer value,
all six `100644` modes, blob OIDs, SHA-256 values, and byte lengths. Read the
carrier from that Git object and require the current file to match it exactly.

### CR-03 [BLOCKER]: Committed post-A8 source drift can be hidden by restoring worktree bytes

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts:137-181`

**Issue:** The history checks inspect later changes only to the summary. For
source paths, the checker compares A8 blobs directly to current worktree bytes
but never inspects `A8..HEAD` commits. A disposable fixture committed a malicious
change to the reviewer after the valid carrier, then restored the index/worktree
copy from A8 without removing the malicious HEAD commit. The checker accepted
the repository and returned A8 while current committed lineage contained drift
at `ddd861a0...`. This also lets the frozen policy allowlist see clean worktree
bytes while committed source history is different.

**Fix:** Reject every descendant commit that touches any of the six protected
source paths, independently of index/worktree state, and separately require a
clean index plus byte- and mode-identical worktree:

```ts
const laterSourceCommits = git(repoRoot, ["log", "--format=%H",
  `${EXACT_A8}..HEAD`, "--", ...EXACT_SOURCE_PATHS])
if (laterSourceCommits !== "") fail("V138_PLAN_262_58_SOURCE_HISTORY_DRIFT")
```

### CR-04 [BLOCKER]: Authorization-v8 accepts a canonically rooted but semantically fabricated review

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5725-5769`

**Issue:** `validateV138ReviewV2DocumentForAuthorization` checks only first-level
nested keys, five false identity flags, array cardinality, verdict fields, and
the caller-recomputed root. It does not recompute custody, reachability,
transcript records/events, protected history, snapshots, or their nested
schemas. `checkV138Plan26256ReviewV2Input` at lines 5792-5880 then treats an
exact two-path publication commit plus matching detached bytes as sufficient.
A disposable current-lineage publication containing fake source identities,
ten `{forged:true}` records, fake protected history, empty snapshots, and
`reachability.routeOrdinal: 999` was accepted by
`buildV138Plan26256AuthorizationV8`; the resulting authorization still claimed
route ordinal 7.

**Fix:** Refactor the reviewer derivation/validation into a shared immutable
module and require authorization to perform the same independent semantic
recomputation against exact A8 and the publication commit. Apply exact schemas
to every nested record/event, not only section keys. A publication commit and a
valid enclosing hash must never substitute for reviewer-v2 semantic validation.

### CR-05 [BLOCKER]: The production route remains wired to v7 while tests bless an unused v8 contract

**Files:**

- `scripts/evaluate-v1-38-successor-route.test.ts:496-529`
- `scripts/lib/v1-38-successor-source-seal.ts:5683-5700`
- `scripts/lib/v1-38-current-matrix-reproduction.ts:18999-19020,20878-20924`

**Issue:** The new `V138_PLAN_262_57_ROUTE_CONTRACT_V8` is declared in the
successor-seal module, but the production route checker returns
`V138_PLAN_262_57_ROUTE_CONTRACT`, whose authorization and seal schemas remain
v7. The production route manifest also explicitly requires
`authorization-v7/seal-v7` for readiness and route-start branches, and the CLI
continues to accept `--source-a7/--source-b7`. The corrected test calls the v7
production checker, then separately asserts the unused v8 object. Consequently
authorization-v8/B8 cannot connect to route ordinal 7 even though the lifecycle
checker reports versions 8, 8, 7, and 11/11/11/12 as coherent.

**Fix:** Make the production route contract, manifest prerequisites, CLI argv,
authority checker, and route evidence consume authorization-v8/seal-v8 and
sourceA8/sourceB8. Preserve route ordinal 7 and the v11/v12 receipt schemas.
Keep v7 only in explicitly historical readers; tests must assert that the
production checker itself returns the v8 contract.

## Warnings

### WR-01 [WARNING]: The corrective mutation suite does not exercise its claimed blocker families

**File:** `scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts:50-190`

**Issue:** The reviewer test file contains five broad tests. It does not assert
that transcript exits are successful, mutate the summary carrier to a coherent
replacement A8, commit a later source mutation with restored worktree bytes,
publish a nested forged review, test publication rollback/no-follow behavior,
or prove that the production route checker consumes v8. The lifecycle test
mutates a constructed input object rather than repository inventories, and the
single B8 test covers only the positive path. This is why 28/28 passes while the
five blocker fixtures above succeed.

**Fix:** Add a named recomputed-root/repository fixture for every CR-01 through
CR-09 and WR-01 subcase. Assert the specific rejection code for replacement A8,
descendant committed drift, nested review forgery, all-error dispatch,
off-lineage publication, partial publication rollback, symlink ancestors,
off-branch/competing B8, route-v7 wiring, frozen-source drift, and exact 47-plan
substitution. Keep the six real lifecycle states in repository-backed fixtures.

## Verification Performed

- Re-derived sourceBase8/A8 parent, tree, exact six paths, all `100644` modes,
  blob OIDs, SHA-256 values, byte lengths, carrier parent, and descendant source
  absence for the submitted repository.
- Serialized focused suite passed: 3 files, 28/28 tests.
- Full dependency analyzer and CLI passed with zero findings in
  `plan_58_complete_43_of_47`.
- A real 47-plan inventory substitution was rejected with
  `PLAN_DISCOVERY_DRIFT`.
- Repository-backed lifecycle fixtures resolved all six modes from 42/47
  through 47/47.
- Off-lineage review publication was rejected with
  `V138_REVIEW_V2_PUBLICATION_PARENT_INVALID`.
- Off-branch B8 was rejected with
  `V138_SUCCESSOR_SOURCE_SEAL_V8_CUSTODY_INVALID`; the positive exact-two-path
  B8 fixture also passed in the focused suite.
- A coherent replacement carrier/A8 was incorrectly accepted.
- A committed post-A8 source mutation hidden by restored worktree bytes was
  incorrectly accepted.
- A current-lineage, exact-two-path, canonically rooted but semantically forged
  review-v2 document was incorrectly accepted by authorization-v8.
- Exact detached execution capture returned exit 64 for all ten route commands
  yet still produced review evidence eligible for a zero-finding document.
- No network, secrets, live processes, canonical route artifacts, or source
  files were touched. Temporary fixtures were moved to Trash after use.

---

_Reviewed: 2026-08-15T06:58:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
