---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T05:07:32Z
depth: deep
reviewed_source_commit: a9ec2cb7c60017c4a08d803f8111042d385c01a5
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

# Phase 262 Plan 61: Code Review Report V6

**Reviewed:** 2026-08-24T05:07:32Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V5 correction truthfully treats the execution-context alias bypass and
calibration result as A9 findings, closes successful-output schemas, correctly
attributes descriptor writes and operation outcomes, removes volatile host
metadata from semantic roots, fixes synthetic Git identities and dates, expands
the review wrapper, and permits only the expected summary candidate path.

The reviewer is still not freezeable. Its filesystem observer captures content-
bound operation details, but the canonical event projection discards those
details and never compares observed effects with an allowed per-command policy.
Transient writes to protected files and unexpected create/delete effects can
therefore become accepted expected evidence. The advertised full custody wrapper
also strips the exact deterministic B9 and publication commits, trees, blobs, and
roots, along with call/output proof, before both the two-fresh comparison and the
report binding. The new tests exercise helper shapes rather than these exact
production gates.

The literal `V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS` and
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` findings are truthful A9 source
findings and are not reviewer-tool defects.

## Prior Finding Resolution Audit

| V5 finding | Status | Evidence |
|---|---|---|
| CR-01 actual CLI alias and exact results | **RESOLVED** | The actual CLI delegate is authenticated and recorded as a dedicated A9 source finding; output schemas and dispositions are closed. |
| CR-02 descriptor attribution and outcome-aware ledger | **PARTIAL** | Descriptor attribution/outcomes are correct, but the semantic event projection drops content-bound details and has no allowed-effects gate; CR-01. |
| CR-03 deterministic semantic roots/fixed synthetic Git | **PARTIAL** | Volatile metadata is excluded and fixed commit dates are used, but two-fresh compares a projection that omits the exact synthetic Git custody; CR-02. |
| CR-04 full custody/report wrapper | **PARTIAL** | Predecessor, convergence, lifecycle, R3, terminal review/fix, and normalized report content are bound, but exact B9/publication and route call/output custody are discarded; CR-02. |
| CR-05 scoped candidate cleanliness | **RESOLVED** | Candidate modes allow only the exact expected summary path; committed modes remain globally clean and one-path bound. |
| WR-01 gate-level tests and protected mode contract | **PARTIAL** | The mode/output/fd helper tests pass, but exact effect-policy, full-custody, and real CLI candidate gates remain untested; WR-01. |

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Observed filesystem content and forbidden transient effects are discarded before review

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:784-790,923-933,1357-1400`

**Issue:** The observer records `beforeState`, `afterState`, and a content-bound
`detailRoot`, but the canonical event row keeps only operation name, path,
outcome, error code, and the two state *types*. The SHA-256 values, byte lengths,
modes, open flags, and `detailRoot` are discarded. Route-mutable files are also
explicitly reduced to mode and byte length in endpoint inventories. No later gate
compares operation paths or operation kinds to an allowed side-effect set for the
manifest command. A handler can therefore transiently overwrite and restore a
protected file, create and delete an unexpected file, or write different
same-length canonical bytes; the before/after roots remain unchanged and those
operations merely become part of the expected event list. This violates the
required fail-closed transient-write, closed-inventory, and ordered-effect
contract.

**Fix:** Preserve each operation's exact content/mode state and `detailRoot` in
the semantic event ledger. Define and enforce a closed per-command effect policy
covering the destination, atomic temporary/reservation paths, allowed operation
order, and expected content roots. Reject any write-capable operation against a
protected path and any unlisted transient path even when final bytes are
restored. Add a real handler/observer mutation that writes and restores protected
bytes and assert a dedicated production-gate rejection.

### CR-02 [BLOCKER]: The full custody wrapper omits exact B9/publication and route call/output identities

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1683-1704,1743-1779`

**Issue:** `deterministicRouteCustody` deliberately drops `sourceB9`, both
publication commit/tree/blob/review-root identities, and most route-proof fields
(`outputRoot`, `outputByteLength`, `callTraceRoot`, `functionRangeRoot`, and
`callCount`). The two-fresh check compares only that stripped projection, and the
report custody wrapper embeds the same projection. Although fixed synthetic Git
dates likely make the omitted OIDs repeatable, neither repeatability nor the
exact Git custody is machine-bound. A canonical report can therefore omit or
substitute the exact B9/publication identities and route call/output proof while
passing the production comparison. This is not the full publication/B9/R3 review
custody required by the plan.

**Fix:** Put exact B9 and prerequisite/post-execution publication commit, parent,
tree, changed paths, review/report blobs, and byte roots into the custody wrapper.
Also bind bounded output and authenticated call-trace fields for every route.
Compare those complete normalized objects across two fresh derivations and bind
the same object into the report manifest. Add individual exact-gate mutations for
every omitted OID/root and a test proving all fixed synthetic OIDs match across
two independent runs.

## Warnings

### WR-01 [WARNING]: New tests validate helpers instead of the claimed production gates

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:509-569,571-657`

**Issue:** The fd test confirms attribution but never passes its records through
the canonical event/effect gate or attempts a forbidden transient write. The
two-fresh test compares the stripped `deterministicRouteCustody` projection, so it
cannot detect unstable or substituted B9/publication OIDs. The custody-wrapper
test uses a toy object with a generic equality helper. Candidate tests call
cleanliness/publication helpers with `# candidate` rather than invoking the exact
Plan-61 and Plan-62 candidate CLI modes with their real receipt, review, report,
and summary schemas. These tests stay green with CR-01 and CR-02 present.

**Fix:** Add repository-backed tests at the exact exported/CLI gates: forbidden
write-and-restore plus unexpected transient creation, two-fresh full Git custody,
individual report-wrapper OID/root mutations, and real Plan-61/62 candidate then
commit sequences.

## Verification Performed

- Confirmed source commit `a9ec2cb7c60017c4a08d803f8111042d385c01a5` has tree `e3317098a50f6540b9ead42c0dafb9b6eba023fe`, sole parent `644bc02bf40d59605ed64a8ef7f21339712bce1c`, trailer `Plan-262-61-Reviewer-Tool: codex-plan-262-61-r3-v6`, Git mode `100644` on both files, and exactly the two scoped source paths.
- Read the full Plan 262-61 contract, all V1-V5 reports, and the uncommitted iteration-5 REVIEW-FIX before reviewing the source.
- `pnpm exec tsc --noEmit --pretty false` passed.
- Targeted V5 remediation suite passed: 1 file, 12 passed, 37 skipped (fd outcome/unknown descriptor, candidate helper, normalized report helper, summary helper mutations, bounded output, and hypothetical review mutations).
- `git diff --check a9ec2cb7^ a9ec2cb7` passed.
- Traced the shared review-v3 validator: it compares supplied event/snapshot claims but has no operation-effect policy and cannot recover fields omitted by the Plan-61 projection.
- The long real-route and two-fresh runs were not repeated in this review; the uncommitted REVIEW-FIX records prior fixer runs, and the defects above are in the projection and production bindings after route execution.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal, B9, route, or live path was modified by this review.

---

_Reviewed: 2026-08-24T05:07:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
