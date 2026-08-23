---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-23T20:29:44Z
depth: deep
source_base: f4d25b38ed1e23d1d575b3f0d0fd6bb587d848b0
reviewed_source_commit: 8e32ae56a6a61a1c8553c769514b8e17f5833737
reviewed_source_tree: f7b6adbbb2b6c62c0f3f6115297d0f340ed39dae
files_reviewed: 6
files_reviewed_list:
  - scripts/check-v1-38-dependency-revision-boundaries.ts
  - scripts/evaluate-v1-38-successor-route.test.ts
  - scripts/evaluate-v1-38-successor-source-complete.test.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
  - scripts/lib/v1-38-source-completeness-review-v3.ts
  - scripts/lib/v1-38-successor-source-seal.ts
findings:
  critical: 4
  warning: 1
  info: 0
  total: 5
status: issues_found
---

# Phase 262 Plan 60: Code Review Report V3

**Reviewed:** 2026-08-23T20:29:44Z
**Depth:** deep
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Git confirms the submitted correction is one sole-parent commit from `f4d25b38ed1e23d1d575b3f0d0fd6bb587d848b0` to `8e32ae56a6a61a1c8553c769514b8e17f5833737`, with tree `f7b6adbbb2b6c62c0f3f6115297d0f340ed39dae`, trailer `codex-plan-262-60-a9-review-fix-v2`, and exactly six modified paths. The focused suite reports 29/29 passing with no skips, the dependency analyzer reports zero findings, Turbo typecheck reports 27/27 tasks, and canonical/live destinations remain absent.

The correction is still not shippable. Production review and custody validation remain hard-coded to the prior v1 correction run, while only the analyzer recognizes v2. The command evidence is fabricated rather than independently executed and even its required route-start argv is invalid. The same-domain tool root fixes the former false-positive branch, but a genuine mismatch invalidates authorization before the failure terminal can be produced. Historical deletion records are exact objects but are not required to be ancestors of the reviewed source. The native helper closes the prior race/truncation defects, but leaks temporary directories and executable helpers.

## Narrative Findings (AI reviewer)

### Prior-review disposition

| Prior issue | V3 disposition |
|---|---|
| Original CR-01 and V2 CR-01, review evidence joins | **Still blocked.** Exact manifest fields are checked, but observations remain caller-copied claims and the command records are not executable (CR-02). |
| Original CR-02, normalized v9 route shape | Fixed for the old v1 fixture. |
| Original CR-03, obsolete v7 pre-observation anchors | v7 calls are removed, but V2's replacement still cannot close a real tool-identity mismatch (CR-03). |
| Original CR-04, wrong sole parent | Fixed. |
| Original CR-05, active reviewer-v2/dynamic exemption | Reviewer-v2 is historical-only, but the analyzer now authenticates v2 while production still authenticates v1 and nevertheless reports zero findings (CR-01). |
| Original CR-06, mutable protected history | Fixed. |
| Original WR-01, stale/skipped focused suite | The suite is green with no skips, but its real-v9 fixture deliberately selects the old v1 run and fabricates command records (CR-01/CR-02). |
| V2 CR-02, six-path versus historical deletion custody | Six current paths and two deletion records are now separated, but deletion ancestry is not authenticated (CR-04). |
| V2 CR-04, detached ancestor race/truncation hang | Race and truncation rejection are fixed; helper cleanup remains defective (WR-01). |

## Critical Issues

### CR-01: Production authorization rejects the exact corrected v2 A9 while the analyzer reports it complete

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5810-5820`

**Related files:** `scripts/lib/v1-38-source-completeness-review-v3.ts:239-256`, `scripts/lib/v1-38-successor-source-seal.ts:6030-6036`, `scripts/check-v1-38-dependency-revision-boundaries.ts:1353-1370`, `scripts/evaluate-v1-38-successor-source-complete.test.ts:342-358`

**Issue:** The exact submitted commit carries trailer `codex-plan-262-60-a9-review-fix-v2`, but production custody, review-v3 validation, and the derived `sourceCustody.authorRun` still require `codex-plan-262-60-a9-review-fix-v1`. Directly calling `inspectV138SourceA9Custody` with the submitted `f4d25b38..8e32ae56` range reproduces `V138_PLAN_262_56_AUTHORIZATION_V9_CUSTODY_INVALID`. The analyzer alone searches for v2 and reports `a9_complete_43_of_48` with zero findings. The 29-test integration fixture avoids the defect by explicitly selecting the old v1 run and checking it out. Thus neither the green suite nor analyzer proves that the corrected A9 can publish review-v3, authorization-v9, or a route.

**Fix:** Define one exported correction-run identifier and use it in the review schema, source-custody derivation, authorization observation, analyzer, fixtures, and summary verification. Change the real-v9 fixture to use the exact submitted sourceBase9/sourceA9 and assert the expected tree, parent, six paths, and v2 trailer before building review-v3. Add an analyzer cross-check that the production custody validator accepts the same run the analyzer marks complete.

### CR-02: “Independent” command observations are fabricated, temporally circular, and contain invalid argv

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-source-completeness-review-v3.ts:179-218`

**Related files:** `scripts/lib/v1-38-source-completeness-review-v3.ts:286-333`, `scripts/lib/v1-38-source-completeness-review-v3.ts:392-418`, `scripts/evaluate-v1-38-successor-source-complete.test.ts:379-444`, `scripts/lib/v1-38-current-matrix-reproduction.ts:19307-19326`

**Issue:** The command builder emits terminal registry JSON with `{schemaVersion, activeExecutors: []}`, while the route requires exact keys `{schemaVersion, activeExecutorCount: 0, agents: []}`. Direct ownership validation of the generated argv reproduces `MATRIX_EXECUTION_CONTEXT_V9_REGISTRY_INVALID`. The integration test never executes the ten claimed commands: it assigns every record exit status 0 and identical bytes `captured command output`, then passes the document's same arrays back as the supposedly independent observations. It only executes route-start later with a different, correct registry. There is also a custody cycle: review-v3 is the prerequisite for authorization/seal/B9, yet every claimed argv requires authorization, seal, and sourceB9; the test substitutes sourceBase9 as sourceB9. These records cannot be command-execution evidence for the publication they authorize.

**Fix:** Separate static source-manifest evidence from executable route evidence. If execution is required, produce it only after a real authorization/seal/B9 in isolated clones and bind each independently captured argv/status/stdout/stderr record to that exact B9; it cannot be a prerequisite for creating the same authorization. Correct the registry schema and execute every claimed argv in tests. If Plan 262-60 only needs static completeness, remove exit status/output claims and validate the manifest against the actual dispatch table instead of accepting caller-supplied duplicate arrays.

### CR-03: A genuine tool-identity change cannot produce `tool_identity_failed`

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-successor-source-seal.ts:6082-6116`

**Related files:** `scripts/lib/v1-38-current-matrix-reproduction.ts:20127-20143`, `scripts/lib/v1-38-current-matrix-reproduction.ts:20364-20382`, `scripts/evaluate-v1-38-successor-source-complete.test.ts:455-466`

**Issue:** Authorization now stores the correct same-domain tool identity root. However, every authorization check rebuilds the entire authorization with the current `deriveV138ToolIdentityRoot()` before a route anchor is returned. If the tool actually changes after authorization, the rebuild differs and throws `V138_PLAN_262_56_AUTHORIZATION_V9_INVALID`; `deriveV138Plan26257PreObservationProof` is never reached. The test's mismatch branch succeeds only by injecting `observedRootOverrides` after constructing a healthy route. Production CLI supplies no independent mismatch observation. The required `tool_identity_failed` terminal therefore remains unreachable for the real condition it is intended to record.

**Fix:** Validate the immutable authorization and seal against their originally committed expected root, then independently observe the current tool root at the named pre-observation boundary. Permit only that observation to differ while every other authorization/seal/B9 join stays exact, and build the failure proof from expected versus observed. Test by changing the actual observed tool-identity provider after authorization, not by passing a root override directly to the proof builder.

### CR-04: Historical deletion custody does not prove the deletion belongs to the reviewed lineage

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-successor-source-seal.ts:5839-5865`

**Related file:** `scripts/check-v1-38-dependency-revision-boundaries.ts:1375-1394`

**Issue:** The implementation authenticates the deletion commit, parent, tree/trailer, exact `D` statuses, prior blobs, and endpoint absences. It never requires the deletion commit to be an ancestor—preferably a first-parent ancestor—of sourceBase9 and sourceA9. Because source identity is externally supplied, a repository can contain the fixed deletion object as an unrelated or dangling object and present another six-path source chain where the two paths merely happen to be absent. Authorization will label that unrelated object as the source's deletion history. The current repository happens to have the correct ancestry, but the boundary does not enforce it.

**Fix:** Require `git merge-base --is-ancestor <deletionCommit> <sourceBase9>` and `<sourceA9>`, and verify the deletion commit occurs exactly once on the expected first-parent lineage before accepting deletion history. Mirror the same relation in the analyzer and add an alternate-branch/dangling-object rejection fixture.

## Warnings

### WR-01: The native detached-file helper leaks temporary directories and executables

**Classification:** WARNING

**File:** `scripts/lib/v1-38-source-completeness-review-v3.ts:567-578`

**Related file:** `scripts/evaluate-v1-38-successor-route.test.ts:218-265`

**Issue:** Cleanup is registered only after compilation and only on `process`'s `exit` event. Compilation failure leaks the newly created directory, and worker/forced termination does not reliably run the hook. After the reproduced verification runs, the system temp directory contained ten `v138-openat-*` directories, including retained executable `read-detached` helpers and a race-test fixture. The race/truncation assertions pass, but the claimed cleanup behavior does not.

**Fix:** Wrap compilation in `try/finally` that removes the directory on failure. Provide explicit helper disposal in test teardown and CLI completion, with signal handlers as a fallback; do not rely solely on process exit. Add an assertion that the helper and race-fixture directories are absent after each test worker completes.

## Verification Reproduced

- Exact Git range: one commit, six modified paths, submitted tree and sole parent match, v2 trailer present.
- Focused serialized Vitest: 2 files, 29 tests passed, 0 skipped; the integration fixture selects v1 rather than the submitted v2 A9.
- Direct submitted-custody call: rejected with `V138_PLAN_262_56_AUTHORIZATION_V9_CUSTODY_INVALID`.
- Direct generated-registry validation: rejected with `MATRIX_EXECUTION_CONTEXT_V9_REGISTRY_INVALID`.
- Dependency analyzer: passed with zero findings and `a9_complete_43_of_48`, despite production rejecting that A9.
- Turbo typecheck: 27/27 tasks passed from cache; root scripts remain runtime-validated rather than package-typechecked.
- `git diff --check f4d25b38..8e32ae56`: passed.
- Historical deletion object: actual repository ancestry is valid, but neither production nor analyzer enforces it.
- Native helper: ancestor swap and truncation tests pass; ten helper/fixture temp directories remained afterward.
- Canonical review-v3/report, authorization-v9, seal-v9, route-start, preflight, calibration, reproduction, terminal, and live destinations remained absent.
- No source files or canonical/live artifacts were modified by this review.

---

_Reviewed: 2026-08-23T20:29:44Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
