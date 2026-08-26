---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-08-26T05:32:48Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-69-route-8-source.ts
  - scripts/check-v1-38-plan-262-69-route-8-source.test.ts
findings:
  critical: 7
  warning: 1
  info: 0
  total: 8
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-08-26T05:32:48Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The submitted lifecycle normalizer and sentinel are not safe to run. The focused six-test suite and TypeScript check pass, but the sentinel trusts an unchecked binder, synthesizes its own verifier result, accepts contradictory obstruction/PASS dispositions, hard-codes rather than proves the 56/55 topology, and exposes write paths outside the repository. Failure and rerun behavior can also leave false or stale lifecycle carriers that the result checker accepts.

Verification performed: `pnpm exec vitest run scripts/check-v1-38-plan-262-69-route-8-source.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=180000 --bail=1` (6/6 passed), `pnpm exec tsc --noEmit --pretty false` (passed), and `git diff --check` (passed). These green checks do not cover the adversarial paths below.

## Narrative Findings (AI reviewer)

### Critical Issues

#### CR-01: Sentinel trusts arbitrary binder JSON and never runs the required provenance-aware verifier

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:250-268`
**Issue:** `runV138Plan26274Sentinel` calls only `readJson` on the binder. It never invokes `checkV138PostValidationBinder`, never recomputes `binderRoot`, never rechecks normalized validation/current carrier hashes, and never invokes an independent verifier. Instead it creates a PASS report locally from four attacker-controlled binder fields. A stale or forged JSON file can therefore cross the verification boundary and reach the PASS lifecycle path without authenticating the current repository state.
**Fix:** Reconstruct the full `LifecycleArgs` from the driver arguments, call `checkV138PostValidationBinder` before rendering input, and pass the checked binder into a separately implemented verifier that authenticates the exact input and returns a schema-checked report. Reject any binder field not obtained from the checker; do not derive verifier status inside the driver.

#### CR-02: Contradictory obstruction/PASS dispositions can complete Phase 262 without 540/540 evidence

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:171-186`
**Issue:** `buildMarker` treats every branch other than the literal obstruction string as terminal, accepts any object whose `status` is `passed` or `blocked`, derives ADMIT-03 from a free-standing string, and copies `phase263PlanningAuthorized` without validating schema, `dispositionRoot`, exact keys, branch/status correlation, terminal provenance, or fresh 540/540 counts. It also hard-codes `downstreamAuthorityDenied: true` without checking the eight denial fields. A disposition with `branch: "pre_start_obstruction"`, `status: "passed"`, `admit03: "passed"`, and `phase263PlanningAuthorized: true` is accepted when an activation file exists; the driver then takes PASS even though the branch is obstruction.
**Fix:** Validate the disposition by exact reconstruction from `deriveV138Route8Activation`, authenticate `dispositionRoot`, call `checkV138Plan26272Disposition`, and enforce the XOR branch. PASS must require terminal `reproduction_passed`, `freshCharged === 540`, `freshAccepted === 540`, `satisfiesAdmit03 === true`, the exact reduced-assurance seal, a matching checked activation root, and every downstream denial field false. Obstruction must require blocked/0/0/no activation/Phase-263 denied.

#### CR-03: The advertised exact 56-plan/55-summary topology is never enumerated

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:188-190`
**Issue:** Normalization checks only that summaries 69-73 exist and summary 74 does not. It never enumerates active `262-*-PLAN.md` or trustworthy `262-*-SUMMARY.md` identities. Missing earlier summaries, extra active plans, extra summaries, symlinked entries, or a different sole incomplete plan all pass while the marker simply asserts hard-coded counts of 56 and 55. The binder therefore does not prove its central lifecycle latch.
**Fix:** Enumerate no-follow regular files in the phase directory, compare the sorted plan and trustworthy-summary identity sets against the canonical phase index, require exactly 56 unique plans and exactly 55 unique summaries, and prove set difference is exactly `262-74`. Store and verify an identity-list digest rather than only numeric constants.

#### CR-04: Caller-controlled output paths can escape the repository

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:70-73, 188-190, 270-278`
**Issue:** `ensureWithin` performs only lexical containment and does not reject symlinked parent directories. Worse, summary and blocked paths use `path.resolve(root, args.phaseDir, ...)` directly, so an absolute `--phase-dir` discards `root` entirely. The CLI can consequently read or write outside the repository, and a symlinked in-repository parent can redirect supposedly contained normalization, verification, binder, summary, or blocked writes to an external target. Leaf-only `lstat` does not close either escape.
**Fix:** Reject absolute arguments, resolve every path through one containment helper, walk every existing parent with `lstat` and reject symlinks, and verify the nearest existing parent's `realpath` remains under the repository realpath before any read, create, rename, or removal. Apply the same helper to `phaseDir`-derived paths.

#### CR-05: Failed normalization can leave roadmap/state falsely claiming normalized provenance

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:188-198`
**Issue:** The function mutates ROADMAP first and STATE second before it parses/validates the disposition, reads all hash inputs, or validates the validation carrier. If STATE normalization, disposition parsing, activation selection, or validation reading fails, one or both authoritative lifecycle carriers remain changed to `route_8_post_validation_normalized` even though no valid normalized marker exists. Per-file atomic rename does not make the multi-carrier transition atomic.
**Fix:** Perform all reads, exact validations, topology checks, marker construction, and replacement rendering without writes first. Stage all replacement files in one owner-only repository-local transaction area, fsync as required, then install them in a recoverable commit protocol; on any pre-install failure, mutate nothing. At minimum, preserve original bytes and roll back every already-installed carrier on failure.

#### CR-06: A stale blocked sentinel is accepted as current evidence

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:234-246, 269-274`
**Issue:** On a gaps run, the driver writes `262-74-BLOCKED.md` only when it is absent. If a regular file already exists from an older binder, it is retained unchanged. `checkV138Plan26274Result` then checks only that the file is missing or regular; it never authenticates its binder root, branch, reason, or correlation with the installed verification report. A rerun can therefore report success while preserving stale blocked provenance.
**Fix:** Define an exact blocked artifact schema/root, render expected bytes from the checked verifier input/report, and require an existing file to be byte-identical. Otherwise fail before canonical writes or atomically replace it according to an explicit idempotency policy. Make the result checker recompute and compare the exact artifact.

#### CR-07: PASS closeout is non-idempotent and can strand a committed false lifecycle state

**Classification:** BLOCKER
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.ts:276-293`
**Issue:** The driver creates and commits the summary, then performs five independent mutating GSD queries and a second commit. Any failure after the first commit leaves a committed Plan-74 summary and possibly partially updated requirements/progress, but no completed phase. A retry immediately fails because `writeExclusive` rejects the existing summary. There is no journal, resume state, rollback, or exact-current-state reconciliation, so ordinary transient failure permanently destroys the sole-summary latch and violates the required deterministic idempotency/no-retry contract.
**Fix:** Add a checked closeout state machine with explicit preconditions and resumable steps. Existing artifacts must be accepted only when byte-identical and correlated to the checked PASS report. Either make all lifecycle edits in memory and commit them atomically with the summary/report, or persist a content-addressed journal that can safely resume each exact step without rerunning verification or consuming route authority.

### Warnings

#### WR-01: The only lifecycle test proves the happy obstruction path, not the regression contract

**Classification:** WARNING
**File:** `scripts/check-v1-38-plan-262-69-route-8-source.test.ts:136-159`
**Issue:** The new test builds only five summary placeholders and one nominal blocked disposition, then checks absence of the Plan-74 summary. It does not seed all 56 plan/55 summary identities, mutate counts or sole-incomplete identity, forge/tamper a binder, exercise contradictory obstruction/PASS fields, verify 540/540 provenance, test absolute or symlinked-parent paths, assert temporary-directory cleanup, test stale blocked bytes, or simulate failures between PASS lifecycle steps. It therefore passes while every blocker above remains reachable.
**Fix:** Add table-driven negative and fault-injection tests for every authenticated field and lifecycle boundary. Include exact full topology fixtures, no-follow parent traversal, forged/stale binder rejection, obstruction-never-PASS, 539/540 rejection, downstream-denial mutations, temp cleanup after throws, stale blocked artifact handling, and resumable failure at each GSD mutation/commit boundary.

---

_Reviewed: 2026-08-26T05:32:48Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
