---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T08:16:46Z
depth: deep
reviewed_source_commit: e0ff043aa2d9273755efd2149f01f9cd2c4ed41b
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts
  - scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts
findings:
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
---

# Phase 262 Plan 61: Code Review Report V7

**Reviewed:** 2026-08-24T08:16:46Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V6 remediation materially improves the event ledger, binds complete B9 and
publication identities, authenticates one real handler call per route, and adds
real candidate/committed CLI coverage. The exact source remains unfit to freeze.

The closed effect gate accepts an empty operation ledger for every command,
including commands whose frozen manifest requires a receipt write. This permits
a missing, bypassed, or unobserved write to become valid evidence. The advertised
two-fresh proof also shares the detached authorization input and a mutable
obstruction clone between its left and right runs, so exact B9 equality and route
equality are conditional on shared physical state rather than independent fresh
derivation. The focused tests encode both weaknesses.

The literal `V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS` and
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` results remain truthful A9 source
findings and are not reviewer-tool defects. The separately documented
`frozen_replay_commit_unreachable` failure was not introduced by either reviewed
path and is not classified as a regression here.

## Prior Finding Resolution Audit

| V6 finding | Status | Evidence |
|---|---|---|
| CR-01 closed filesystem effect policy | **PARTIAL** | Exact state and order are bound when operations exist, but the gate treats an empty ledger as the exact permitted policy for every command; CR-01. |
| CR-02 full custody wrapper | **PARTIAL** | The previously omitted fields are now carried, but two-run equality is obtained with shared physical inputs and a reused mutable clone; CR-02. |
| WR-01 production-gate tests | **PARTIAL** | Real observer/CLI tests were added, but no test rejects missing required effects or proves physically independent derivations; WR-01. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Required write commands pass the production effect gate with no effects

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:986-1014`

**Issue:** `validateV138Plan26261RouteEffects` receives `sideEffect` but never
uses it. Line 1012 defines the permitted sequence as `[]` whenever the observed
operation list is empty, so the equality check at lines 1013-1014 passes. This is
true for all ten manifest commands, including `fixture-write-only`,
`injected-headroom`, and `injected-child-runner` routes. A direct invocation
during this review confirmed that every manifest entry returns an effect-policy
root for `operations=[]`. Consequently, a removed handler write, a dispatch path
that returns a schema-valid success without publication, or an observer blind
spot can be accepted as exact effect evidence. Two repeated derivations with the
same omission also compare equal, so later custody equality does not repair the
gap.

**Fix:** Derive the allowed operation sequence from the command's exact
terminal branch and `sideEffect`, not from whether any operations happened.
Require the full publication sequence for every successful write-producing
branch, require zero operations only for declared read-only branches or exact
pre-write failures, and explicitly bind the expected destination state/change.
Add a mutation that supplies a schema-valid successful write-route result with
an empty ledger and require a dedicated rejection.

### CR-02 [BLOCKER]: The two-fresh proof reuses physical state across both derivations

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1305-1318,1380-1398,1593-1605`

**Issue:** `observeV138Plan26261RouteDispatchPair` creates one shared detached
review path and one shared obstruction clone, then passes both to the left and
right runs. The detached file's physical identity feeds authorization/seal/B9
construction. The obstruction clone is not merely a common immutable input: the
first run writes into it, and the second run reuses it after selectively deleting
only the generated obstruction result. Thus matching authorization blobs, B9
OIDs, route outputs, and effect roots demonstrate repeatability under shared
path/inode and residual clone state, not two independent fresh derivations. A
bug dependent on that shared identity or on unreset clone metadata can pass both
runs identically. This violates the plan's fresh-derivation, fresh-clone, and
cleanup claims.

**Fix:** Give each derivation its own detached input and every route group its
own freshly created clone, and compare only after both have been independently
cleaned. If absolute path/inode fields make exact synthetic B9 OIDs inherently
different, remove or canonicalize those volatile fields in the synthetic
authorization construction (without changing protected A9 semantics), or bind
them as explicitly shared immutable prerequisite custody while comparing a
separate invariant semantic identity. Do not call the result two independent
fresh derivations while either mutable clone is reused.

## Warnings

### WR-01 [WARNING]: The new tests assert equality without testing the two production failure modes

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:252-310,661-691`

**Issue:** The test named “two independent fresh derivations” calls the shared
pair helper and therefore cannot detect cross-run state reuse. Its OID/root
mutations are passed to a generic whole-object equality helper rather than
re-deriving the production evidence from isolated inputs. The filesystem tests
prove that unexpected nonempty ledgers are rejected, but never assert that a
required write command rejects an empty ledger. The suite therefore stays green
with both blockers above.

**Fix:** Add an isolation assertion proving distinct detached paths/inodes and
distinct per-route clone roots for the two runs, verify complete cleanup for
each run separately, and add an empty-ledger negative for every write-producing
terminal branch. Exercise the committed report check with independently derived
custody rather than only mutating an expected object before generic equality.

## Verification Performed

- Confirmed source commit `e0ff043aa2d9273755efd2149f01f9cd2c4ed41b`
  has sole parent `1ef5daf996255c4c2b5a88044d7c8a9210384539`, tree
  `e79308e645529a4d7c7fe6775367a17ef39e404c`, trailer
  `Plan-262-61-Reviewer-Tool: codex-plan-262-61-r3-v7`, Git mode `100644`
  on both files, and exactly the two scoped source paths.
- Read the full Plan 262-61 contract, V6 report, iteration-6 REVIEW-FIX claim,
  project instructions, and current milestone planning context before review.
- `pnpm exec tsc --noEmit --pretty false` passed.
- Targeted production-gate suite passed: **4 passed, 47 skipped** (real
  Plan-61 candidate/committed CLI, protected write/restore, unexpected transient
  create/delete, and bounded route output).
- A direct production-gate diagnostic showed `operations=[]` passes for all ten
  manifest commands, including every non-`none` side-effect class.
- `git diff --check e0ff043aa2^ e0ff043aa2` passed.
- The 988-second shared-pair proof and 523-second external no-publish proof were
  not repeated; the iteration-6 report records their prior results, while both
  blockers are directly established by the reviewed production paths.
- The full serialized suite was not repeated because the documented unchanged
  replay dependency stops at `frozen_replay_commit_unreachable`; no reviewed
  source path touches that replay manifest or frozen source.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal,
  B9, route, or live artifact was modified by this review.

---

_Reviewed: 2026-08-24T08:16:46Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
