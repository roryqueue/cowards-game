---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T13:02:23Z
depth: deep
reviewed_source_commit: 28b4b828d870f80544467edff00ff4b8106ff2c0
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

# Phase 262 Plan 61: Code Review Report V9

**Reviewed:** 2026-08-24T13:02:23Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V8 successor now captures two physical execution-B9 OIDs and adds a rooted
pair-audit object, but the emitted Plan-262-62 report gate does not authenticate
that object against the independently derived expected pair. It validates the
candidate pair in isolation and then deletes both candidate and expected pair
audits before equality comparison. A completely different, re-rooted,
well-formed pair audit is accepted, and the duplicate pair audit inside the
custody wrapper may be omitted entirely.

The pair-audit validator is also an open, self-attested schema. It accepts
incomplete or fabricated detached-input, clone, obstruction, route-identity,
projection, and cleanup records as long as their enclosing hashes are
recomputed. Its privacy scan misses ordinary Darwin host paths and arbitrary
private fields, and it has no size bound. Consequently the final emitted
custody still does not provide independently auditable physical-to-logical
lineage for the ten route outputs or safe bounded retention for Plan 262-62.

The literal `V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS` and
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` results remain truthful A9 source
findings rather than defects in the reviewed tool. The focused history failure
is expected while this V9 report is not yet committed. The two historical-v1.4
replay failures remain outside the two reviewed paths based on the unchanged
iteration-8 evidence and were not treated as Plan-61 success.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Plan-262-62 report validation discards the pair audit instead of binding it

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2696-2717`

**Issue:** `validatePlan26262ReportManifest` validates only the candidate's
top-level `pairAudit`, conditionally compares it with a second candidate copy,
then deletes the candidate and expected pair audits before comparing the rest of
the report. It never compares the candidate pair root or bytes with the expected
pair root or an immutable publication-time pair identity. The nested
`custody.completeRouteCustody.pairAudit` is optional because equality is checked
only when it exists. A direct production-function diagnostic built two distinct,
internally valid pair audits, confirmed their `pairAuditRoot` values differed,
and observed `validatePlan26262ReportManifest(fabricated, expected) === true`.
The same diagnostic removed the nested custody copy and it was also accepted.
Thus a final report can replace both physical execution-B9 identities, every
detached/clone/obstruction record, every route root, and the full projection
ledger without breaking the Plan-262-62 gate.

**Fix:** Retain one immutable publication-time pair-audit root/bytes identity in
the expected report contract and require exact candidate equality at both the
top-level and nested custody locations. If later verification must use fresh
volatile physical identities, authenticate the published audit as the prior
run's content-addressed attestation and separately record the new run; do not
delete either side before comparison. Require both copies to exist and be
byte-identical. Add a negative that substitutes a separately built, fully
re-rooted valid pair audit and another that omits either copy.

### CR-02 [BLOCKER]: Pair-audit roots authenticate self-assertions, not the physical route evidence

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2535-2640`

**Issue:** The validator checks only a few flags, collection lengths, labels,
root syntax, pairwise inequality, and self-recomputed enclosing hashes. It does
not enforce closed schemas or exact values for detached input
`regularFile/linkCount/mode/bytesSha256/byteLength`, clone
`sourceB9/logicalSourceB9`, obstruction bytes/mode/validation, or the physical
route-identity preimages. It does not join `executionSourceB9` to the
`execution-b9` projection, join the ten `physicalRouteIdentityRoot` values to
their command/output/handler/authorization/seal bodies, or join each labeled
projection entry to the corresponding physical and logical route, derived-root,
persisted-byte, reservation, authorization, or seal record. The two physical B9
OIDs are not even required to differ in the persisted validator. The booleans
`hostPathsExposed: false` and `privateRuntimeDataExposed: false` are assertions;
the regex misses paths such as `/var/folders/...`, permits arbitrary extra
private fields, and no serialized-size bound exists.

A direct production-function diagnostic passed a pair containing only
`pathRoot`, `identityRoot`, and `independentlyValidated` for detached custody;
an obstruction with the non-root string `garbage`; an unverified
`/var/folders/leaked-host-path`; and an arbitrary `secretPayload`. Because all
outer roots were recomputed, `validateV138Plan26261PairAudit` returned `true`.
This permits fabricated B9/auth/seal/route roots, omitted custody facts, reused
or relabeled evidence, private host data, and unbounded payloads to be emitted
as supposedly independently validated physical evidence.

**Fix:** Define exact closed schemas and bounds for the pair, run, detached,
clone, obstruction, route-identity, projection, and cleanup records. Retain the
complete physical route-identity preimage for each of the ten commands and
recompute its root. Validate exact per-label joins to the physical route output,
derived root, persisted bytes, reservation claim, B9, authorization, seal, and
their logical counterparts. Require both execution-B9 OIDs to be distinct and
each clone/source record to reference its run's exact B9. Reject unknown keys,
all absolute paths rather than a short path regex, sensitive-key/value families,
and over-budget canonical bytes. Recompute every enclosing root only after all
semantic joins pass.

## Warnings

### WR-01 [WARNING]: Mutation tests invalidate hashes but do not exercise re-rooted semantic forgeries

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:347-456`

**Issue:** The emitted-custody mutations change one leaf without recomputing the
run and pair roots, so they prove only that hash corruption is detected. The
synthetic positive at lines 402-428 itself omits the production detached and
clone custody fields and uses arbitrary projection strings, yet calls the pair
valid. There is no test that constructs a second internally consistent audit,
recomputes every enclosing root, substitutes it through the actual report gate,
or omits the nested custody copy. The route-identity unit similarly passes
`observed: identities` from the same fixture as `expected`, so it does not prove
that the observed tuple was extracted from each real route output or persisted
record.

**Fix:** Add full semantic-forgery tests that rebuild run, logical-projection,
and pair roots after every B9/auth/seal/output/clone/obstruction/relabel/reuse
mutation and pass the result through `validatePlan26262ReportManifest`. Assert
that missing or extra fields and either missing duplicate copy fail. For all ten
commands, derive the observed identity tuple from the actual emitted output,
persisted bytes, argv, and route-identity preimage rather than assigning the
expected fixture object to `observed`.

## Verification Performed

- Confirmed source commit `28b4b828d870f80544467edff00ff4b8106ff2c0`
  has sole parent `fd0c0017a47da7b2943608321bdcfc8cd5e94233`, tree
  `61878a27be38e867fc4d878ad70e69b11cb6b6eb`, the required reviewer-tool
  trailer, and exactly the two scoped source paths.
- Read project instructions, current milestone planning context, the full
  Plan-262-61 contract, V8 review, and iteration-8 REVIEW-FIX claim.
- `pnpm exec tsc --noEmit --pretty false` passed.
- Four targeted tests passed: pair isolation, report-content binding, ten-route
  identity tuple, and read-only well-formed identity substitution.
- Direct diagnostic confirmed a separately built and re-rooted valid pair audit
  with a different pair root is accepted by the actual report validator.
- Direct diagnostic confirmed omission of the nested custody pair audit is
  accepted by the actual report validator.
- Direct diagnostic confirmed the pair validator accepts incomplete custody,
  a non-root obstruction byte identity, an unrecognized Darwin host path, and
  an arbitrary private payload when enclosing roots are recomputed.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check`
  passed with 0 findings, 144 protected paths, 17 scanned sources, matrix
  admission blocked, and downstream authority denied.
- `git diff --check 28b4b828^ 28b4b828` passed; canonical Plan-262-62 review,
  authorization-v9, seal-v9, and live artifacts remain absent.
- The full two-fresh derivation and full focused suite were not repeated because
  iteration 8 records 65 passes and only the expected uncommitted-review history
  failure; the defects above are deterministic direct validator bypasses.
- No source, REVIEW-FIX, receipt, summary, authority, canonical review, seal,
  B9, route, or live artifact was modified by this review.

---

_Reviewed: 2026-08-24T13:02:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
