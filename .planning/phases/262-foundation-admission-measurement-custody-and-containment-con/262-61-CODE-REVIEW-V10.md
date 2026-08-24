---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "61"
reviewed: 2026-08-24T14:46:29Z
depth: deep
reviewed_source_commit: c081b39716fa2f28ac08d347ac263ceb48278f5a
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

# Phase 262 Plan 61: Code Review Report V10

**Reviewed:** 2026-08-24T14:46:29Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The V10 source fixes the V9 report-substitution defect: when the expected report
contains pair custody, both top-level and nested copies are mandatory, all four
expected/candidate copies are structurally validated, and their canonical bytes
must exactly match. Omission, nested divergence, run swapping, and an otherwise
valid re-rooted pair substitution therefore fail at the report boundary.

The pair-audit object itself is still not the recursively derived physical
attestation claimed by the iteration-9 fix report. Detached-file, clone,
obstruction, and cleanup identity roots are checked only for root syntax and
cross-run inequality. The focused test explicitly constructs a new detached
`pathRoot`, recomputes the run and pair roots, and asserts that the production
pair validator accepts it. The same bypass applies to the other un-derived
physical identity fields.

Route projection and event custody also remains partially self-attested. Several
projection classes are checked only for an allowed command or for a destination
appearing in two asserted location arrays; their physical/logical values are not
joined to retained derived-root, persisted-byte, reservation, obstruction, or
authorization/seal byte evidence. Command-event result roots are self-hashes
with no join to the complete route event ledger, and event ordinals are not
globally one-to-one across commands. A re-rooted audit can therefore fabricate
these facts while satisfying the pair validator, even though the separate exact
expected-report comparison prevents simple post-publication replacement.

The literal `V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS` and
`MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID` outcomes remain truthful A9 source
findings, not defects in these two reviewed paths. The pending Plan-61 history
failure remains expected until a later clean review exists. The two historical
v1.4 replay failures remain pre-existing based on the iteration-9 evidence and
were not counted as Plan-61 findings.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01 [BLOCKER]: Physical custody roots remain forgeable after complete re-rooting

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2678-2714`

**Issue:** The closed shape is an improvement, but the validator accepts
`detachedInput.pathRoot`, `detachedInput.identityRoot`, every clone `pathRoot`
and `identityRoot`, the obstruction `pathRoot` and `identityRoot`, and
`cleanup.parentRoot` merely when they look like SHA-256 roots. It never
recomputes them from retained canonical path/inode/parent preimages or joins them
to another independently authenticated record. Cross-run inequality at lines
2918-2936 proves only that two assertions differ. This is not hypothetical: the
test at lines 421-426 changes the detached `pathRoot`, recomputes both enclosing
roots, and explicitly expects `validateV138Plan26261PairAudit` to return true.
Changing a clone, obstruction, or cleanup root to any fresh root works for the
same reason. Thus the published audit cannot independently prove that its
detached input, four clones, obstruction fixture, or cleanup parent ever existed
with the claimed physical identity.

**Fix:** Retain bounded, privacy-safe canonical preimages for each physical
identity (or a separately authenticated observation record containing them),
recompute every path/identity/cleanup root in the validator, and join each clone
to its exact physical B9 checkout and each obstruction to its exact clone and
file metadata. If raw host path and inode material cannot be published, define a
verifiable commitment protocol whose input commitments are authenticated
outside the pair rather than accepting opaque roots. Add re-rooted negatives for
every detached, clone, obstruction, and cleanup identity field; the pair
validator itself must reject them before the report exact-comparison gate runs.

### CR-02 [BLOCKER]: Projection and event records are not completely joined to route evidence

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts:2738-2915`

**Issue:** Only `execution-b9`, authorization/seal semantic roots, and the ten
route-output projections receive substantive value joins. The physical values
of `authorization-bytes-root` and `seal-bytes-root` are never compared with
physical authorization/seal bytes. Obstruction and derived-root projections are
accepted solely because their command is in an allowlist. Persisted-receipt and
reservation projections require only that an asserted destination appears in
the asserted event/changed-location arrays; neither projection value is compared
with a retained file or claim root. Likewise, each `commandEvents[].resultRoot`
is only syntax-checked and then covered by a self-recomputed
`eventEvidenceRoot`; it is never matched to the sibling complete route event
ledger. Event ordinals need increase only within one command, so the same
ordinal can be reused or orphaned across commands. `eventLocations` and
`changedLocations` can also contain extra repository-relative locations because
they are checked for sorted uniqueness, not exact derivation from the command
events and observation. An attacker can substitute arbitrary roots/locations,
recompute the event, run, logical-projection, and pair roots, and still obtain a
valid pair audit. Exact candidate-versus-expected report bytes make later report
tampering fail, but they do not make the expected audit independently auditable
or satisfy the promised complete physical-to-logical join.

**Fix:** Persist bounded canonical per-command evidence preimages for the
physical and logical authorization/seal bytes, derived records, persisted files,
reservation claims, obstruction metadata, and complete ordered event ledger.
Recompute every projection value from those preimages. Require an exact global
one-to-one mapping from every command event to the complete ledger, exact event
and changed-location sets, globally unique contiguous ordinals, and no orphan or
duplicate events. Validate exact expected physical/logical route tuples for all
ten commands after these joins, then compute enclosing roots. Add fully
re-rooted tests for each projection class, fabricated event result, duplicate
and orphan ordinal, extra location, and cross-command event reuse.

## Warnings

### WR-01 [WARNING]: The mutation suite treats one accepted custody forgery as a positive case

**File:** `scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts:390-485`

**Issue:** The expanded suite proves exact report copying and several closed
shape checks, but the only independently re-rooted valid mutation deliberately
changes `detachedInput.pathRoot` and expects the pair validator to accept it.
Most entries in `exactMutationPaths` still change a leaf without recomputing the
enclosing roots, so they prove hash-corruption detection rather than semantic
derivation. There are no re-rooted negatives for fabricated detached/clone/
obstruction roots, authorization/seal byte projections, derived/persisted/
reservation projection values, event result roots, global duplicate/orphan
event ordinals, extra event locations, or exact per-command file evidence.
Consequently the test can stay green while both blockers above remain.

**Fix:** Replace the accepted detached-root forgery with a rejection assertion
and add a helper that recomputes every affected leaf, event, route-identity,
run, logical-projection, and pair root. Use it to exercise each omitted semantic
join through `validateV138Plan26261PairAudit`, then carry at least one separately
valid re-rooted pair through `validatePlan26262ReportManifest` to retain the
already-correct exact-copy proof.

## Verification Performed

- Confirmed source commit `c081b39716fa2f28ac08d347ac263ceb48278f5a`
  has sole parent `89eaf637ad8b1872a8e95d72560adde914f44398`, tree
  `37be03c3032d3bc9446e09948ac4fa6d17ff4911`, the required reviewer-tool
  trailer, and exactly the two scoped source paths.
- Confirmed the working copies of both reviewed paths exactly match the source
  commit; the only working-tree entry was the requested uncommitted iteration-9
  `262-61-REVIEW-FIX.md`.
- Read project instructions, the full Plan-262-61 contract, V9 review, and
  iteration-9 REVIEW-FIX claim, then traced pair construction, pair validation,
  report validation, route observation, physical projection, event generation,
  and Plan-262-62 inspection call chains.
- `pnpm exec tsc --noEmit --pretty false` passed.
- Three targeted tests passed: normalized full-report binding, bounded
  per-command route results, and exact ten-route identity tuples.
- Source inspection confirmed all four expected/candidate pair-audit copies are
  mandatory and exact-compared when pair custody is expected.
- Source and test inspection confirmed a fully re-rooted fabricated detached
  `pathRoot` is intentionally accepted by the production pair validator.
- `pnpm exec tsx scripts/check-v1-38-dependency-revision-boundaries.ts --check`
  passed with 0 findings, 144 protected paths, 17 scanned sources, matrix
  admission blocked, and downstream authority denied.
- `git diff --check c081b397^ c081b397` passed. Canonical Plan-262-62 review,
  authorization-v9, seal-v9, route-start, reproduction-v12, and live outputs
  remain absent.
- The 15-minute two-fresh test and 35-minute full focused suite were not
  repeated. Iteration 9 records the former passing and the latter with only the
  expected later-review history failure plus a corrected test-only no-op; the
  findings above are deterministic validator gaps visible in the exact source
  and in an explicit positive assertion in the committed test.
- No source, REVIEW-FIX, receipt, summary, canonical review, authority, seal,
  B9, route, or live artifact was modified by this review.

---

_Reviewed: 2026-08-24T14:46:29Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
