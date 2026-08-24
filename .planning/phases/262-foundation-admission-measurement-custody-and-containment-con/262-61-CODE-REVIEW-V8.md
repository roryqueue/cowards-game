---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T11:42:00Z
depth: deep
reviewed_source_commit: db975570a899ea5a583737672b77c363febccf35
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

# Phase 262 Plan 61: Code Review Report V8

**Reviewed:** 2026-08-24T11:42:00Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V7 fixes now require the declared per-command effect sequence and run two
physically separate derivations with distinct detached files, clones, inodes,
and physical execution-B9 commits. Those repairs close the literal empty-ledger
and shared-fixture defects.

The final reviewer evidence is still incomplete. Read-only route outputs accept
arbitrary well-shaped B9, authorization, and seal identities rather than joining
them to the independently constructed physical inputs. In addition, the
physical/logical projection ledger and physical execution custody that prove the
two-fresh claim are discarded by `deterministicRouteCustody`, so the canonical
Plan-262-62 custody wrapper retains only the logical synthetic B9 and cannot
audit the physical execution B9, independent clone/input proof, or complete
projection. The focused tests inspect those transient fields before projection
but do not require them in the persisted custody wrapper.

The literal `V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS` and
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` results remain truthful A9 source
findings, not reviewer-tool defects. The two historical-v1.4 replay failures are
outside the two reviewed paths and are treated as pre-existing based on the
unchanged failing files and the iteration-7 evidence; they were not waived as
Plan-61 success. The focused workflow-history failure is expected only while
this later V8 review is not yet committed.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Read-only route evidence does not bind exact B9/authorization/seal identities

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:1345-1369,1808-1876`

**Issue:** The readiness schema requires only that `sourceB9` is a 40-hex OID
and that `authorizationRoot` and `sealRoot` look like SHA-256 roots. It never
compares them with `executionSourceB9`, `physicalAuthorization.authorizationRoot`,
or `physicalSeal.sealRoot`. The read-only pre-start branch similarly recomputes
its disposition root from whatever embedded authorization/seal roots the output
contains, but does not join those roots to the physical inputs. Projection then
replaces known values when present and otherwise accepts a stable arbitrary
value. A direct diagnostic passed a readiness result containing all-zero B9 and
fabricated `11...`/`22...` roots. Two fresh runs with the same wrong output would
therefore compare equal and be admitted as exact route evidence.

**Fix:** Pass the independently constructed physical identity tuple into route
result validation and require exact equality for every branch that exposes or
embeds B9, authorization, or seal identity before projection. For derived
records, validate the embedded tuple separately from recomputing the record
root. Add mutations for each wrong-but-well-formed identity on every applicable
read-only and write route.

### CR-02 [BLOCKER]: The final custody wrapper discards the physical execution and projection proof

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2473-2510,2550-2581`

**Issue:** `observeV138Plan26261RouteDispatchPair` constructs and validates
`physicalIsolation`, including the physical execution B9, detached input,
obstruction input, per-group clone identities, and the full
`physicalToLogicalProjection` ledger. But `deterministicRouteCustody` omits all
of that material. The Plan-262-62 custody wrapper consequently preserves only
the logical synthetic B9, logical input summary, observations, events, and
publications. It cannot show which physical B9 actually executed, that the two
derivations used distinct physical inputs/clones, or that every physical root
was accounted for by the closed projection ledger. The runtime boolean checks
are not a durable content-addressed custody record and cannot be independently
re-audited from the published wrapper.

**Fix:** Add a deterministic physical-execution attestation to
`completeRouteCustody`: preserve each derivation's physical execution B9 and
validated physical custody under separately rooted run-specific records, plus a
stable projection manifest containing every label, logical identity, projection
kind, and validation result. Bind the pair relation and cleanup proof without
pretending volatile paths/inodes are equal. Require Plan-262-62 report
validation to retain and check these roots.

## Warnings

### WR-01 [WARNING]: Production-gate tests inspect transient proof but do not test the emitted custody contract

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:259-375,1046-1062`

**Issue:** The two-fresh test asserts `physicalIsolation` directly on the
ephemeral route objects, then compares a `deterministicRouteCustody` value that
does not contain those fields. Its custody mutation list has no physical-B9,
clone/isolation, obstruction, or projection-ledger entry. The route-result test
checks bounds and disposition only; it has no wrong-but-well-formed B9,
authorization-root, or seal-root negative. Thus both blockers above remain green.

**Fix:** Assert the final `completeRouteCustody` contains the independently
rooted physical/projection proof and mutate every retained field through the
actual Plan-262-62 report gate. Add exact-identity negatives for readiness,
pre-start, and every persisted route before logical projection.

## Verification Performed

- Confirmed source commit `db975570a899ea5a583737672b77c363febccf35`
  has sole parent `4fbb98207adeb366df2528c46c72ae8729bffbe2`, tree
  `72811290076a3596028b7b1592e3e9c5533b0af2`, the required reviewer-tool
  trailer, and exactly the two scoped source paths.
- Read project instructions, current milestone planning context, the full
  Plan-262-61 contract, V7 review, and iteration-7 REVIEW-FIX claim.
- `pnpm exec tsc --noEmit --pretty false` passed.
- Targeted production-gate suite passed: **15 passed, 49 skipped** (effect
  policy, logical volatility, derived-root recomputation, persisted-byte
  verification, and bounded route-result checks).
- Direct diagnostic confirmed a readiness output with all-zero B9 and
  fabricated well-shaped authorization/seal roots is accepted.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check`
  passed with 0 findings, 144 protected paths, 17 scanned sources, matrix
  admission blocked, and downstream authority denied.
- `git diff --check db975570^ db975570` passed.
- The 1,044-second two-fresh run and 2,150-second full focused run were not
  repeated; iteration-7 records the pair pass and exactly one expected
  workflow-history failure awaiting this V8 report commit.
- The full Turbo suite was not repeated. Iteration-7 records 228 replay passes
  and the same two `FROZEN_SOURCE_MISMATCH` failures in historical-v1.4 replay
  files; neither reviewed commit path modifies those files or their manifest.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal,
  B9, route, or live artifact was modified by this review.

---

_Reviewed: 2026-08-24T11:42:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
