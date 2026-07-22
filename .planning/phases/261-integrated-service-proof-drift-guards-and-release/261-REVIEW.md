---
phase: 261-integrated-service-proof-drift-guards-and-release
reviewed: 2026-07-22T00:00:00Z
depth: deep
files_reviewed: 67
files_reviewed_list:
  - apps/go-backend/v1_37_release_rollback_test.go
  - apps/runtime-service/src/execute-match-v1-18.test.ts
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/index.ts
  - apps/runtime-service/src/pinned-python-container-runtime.ts
  - apps/runtime-service/src/pinned-wasmtime-container-runtime.ts
  - apps/runtime-service/src/production-runtime-config.ts
  - apps/runtime-service/src/runtime-config-current-selection.test.ts
  - apps/runtime-service/src/runtime-config.ts
  - apps/web/e2e/v1-37-integrated-service-proof.spec.ts
  - eslint.config.mjs
  - package.json
  - packages/persistence/src/runtime-evidence-authority-publisher.ts
  - packages/persistence/src/v1-37-release-rollback.test.ts
  - packages/runtime-js/src/abi-bridge.ts
  - packages/runtime-js/src/executor.test.ts
  - packages/runtime-js/src/executor.ts
  - packages/runtime-js/src/worker.ts
  - packages/runtime-wasm-wasi/src/index.ts
  - packages/runtime-wasm-wasi/src/revision-v1-19.test.ts
  - packages/runtime-wasm-wasi/src/validation.ts
  - packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.test.ts
  - packages/runtime-wasm-wasi/src/wasm-wasi-subprocess-adapter.ts
  - packages/spec/src/index.ts
  - packages/spec/src/runtime-containment-trusted-producers-v1-37.ts
  - packages/spec/src/runtime-evidence-attestation.test.ts
  - packages/spec/src/runtime-evidence-attestation.ts
  - playwright.config.ts
  - scripts/activate-v1-37-proof-local-runtime-authority.ts
  - scripts/capture-v1-37-protected-baseline.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-v1-36-historical-proof.ts
  - scripts/check-v1-37-audit-reproduction.test.ts
  - scripts/check-v1-37-audit-reproduction.ts
  - scripts/check-v1-37-release-boundaries.test.ts
  - scripts/check-v1-37-release-boundaries.ts
  - scripts/check-v1-37-release-tag.test.ts
  - scripts/check-v1-37-release-tag.ts
  - scripts/evaluate-v1-37-executable-conformance.ts
  - scripts/evaluate-v1-37-integrated-service-proof.test.ts
  - scripts/evaluate-v1-37-integrated-service-proof.ts
  - scripts/evaluate-v1-37-prearchive-proof.test.ts
  - scripts/evaluate-v1-37-prearchive-proof.ts
  - scripts/evaluate-v1-37-release-readiness.test.ts
  - scripts/evaluate-v1-37-release-readiness.ts
  - scripts/evaluate-v1-37-truthful-inputs-set-fairness.ts
  - scripts/generate-v1-37-milestone-audit.test.ts
  - scripts/generate-v1-37-milestone-audit.ts
  - scripts/generate-v1-37-strategy-foundation-handoff.test.ts
  - scripts/generate-v1-37-strategy-foundation-handoff.ts
  - scripts/lib/v1-37-integrated-proof-manifest.test.ts
  - scripts/lib/v1-37-integrated-proof-manifest.ts
  - scripts/lib/v1-37-pinned-wasmtime.test.ts
  - scripts/lib/v1-37-pinned-wasmtime.ts
  - scripts/lib/v1-37-restricted-evidence-store.test.ts
  - scripts/lib/v1-37-restricted-evidence-store.ts
  - scripts/run-v1-37-browser-proof.test.ts
  - scripts/run-v1-37-browser-proof.ts
  - scripts/run-v1-37-integrated-service-proof.test.ts
  - scripts/run-v1-37-integrated-service-proof.ts
  - scripts/run-v1-37-real-language-lane.ts
  - scripts/run-v1-37-rollback-proof-cli.ts
  - scripts/run-v1-37-rollback-proof.test.ts
  - scripts/run-v1-37-rollback-proof.ts
  - scripts/v1-37-cli-dispatch.test.ts
  - scripts/v1-37-linux-language-probe.ts
findings:
  critical: 5
  warning: 0
  info: 0
  total: 5
status: issues_found
---

# Phase 261: Code Review Report

**Reviewed:** 2026-07-22T00:00:00Z
**Depth:** deep
**Files Reviewed:** 67
**Status:** issues_found

## Summary

The phase has extensive source and fixture coverage, but its evidence and release closure gates are not fail-closed as claimed. In particular, the browser proof can pass after its restricted evidence or service-handoff binding has been removed, and the post-tag verifier can close PROOF-08 for an arbitrary historical commit. These defects undermine the proof chain rather than merely its diagnostics.

## Critical Issues

### CR-01: Browser proof check does not validate restricted evidence or the current service handoff

**File:** `scripts/run-v1-37-browser-proof.ts:93-96`
**Issue:** `checkV137BrowserProof` only loads the control JSON, compares a source-only `inputRootSha256`, and validates the public receipt shape. It neither checks `control.records` nor opens/verifies the referenced restricted object and attestation. It also never recomputes the current service handoff or compares it with `receipt.proofDataHandoffDigest`. Consequently, deleting/replacing browser evidence, setting `records` to an empty array, or replacing the service handoff with another valid digest can still produce a passed browser check; the aggregate evaluator then accepts that result at `evaluate-v1-37-integrated-service-proof.ts:104-111`.

**Fix:** Make check mode use the restricted-store no-follow verification for the exact one browser record, require its reference to equal `receipt.browserProofReceiptRef`, and recompute the service handoff through the already-validated service receipt. Reject a missing, extra, mismatched, deleted, or digest-divergent record/handoff. Add mutation tests for each condition.

### CR-02: Browser collection writes private handoff data to an unvalidated root

**File:** `scripts/run-v1-37-browser-proof.ts:140-146`
**Issue:** The collector accepts `COWARDS_V1_37_RESTRICTED_EVIDENCE_ROOT` and immediately writes the private handoff descriptor beneath it. Validation by `createV137RestrictedEvidenceStore` does not happen until line 154, after Playwright runs and after the private write. A root inside the repository, a symlinked root/control directory, or an attacker-selected path can therefore receive the private descriptor before the store rejects it, violating the restricted-first/outside-Git boundary.

**Fix:** Initialize and validate the restricted store before resolving or writing the handoff. Use a no-follow, root-confined control-file helper for both the handoff and observations paths, rejecting a repository-contained root and symlinked root/parents/files before any private bytes are written.

### CR-03: Rollback proof check follows evidence symlinks instead of the restricted-store verifier

**File:** `scripts/run-v1-37-rollback-proof.ts:419-427`
**Issue:** Although the store rejects symlinks, the release-time rollback checker directly calls `readFileSync` for the access log, object, and attestation. It never checks their parent/file types or opens them with `O_NOFOLLOW`. A symlink to matching bytes outside the restricted store therefore passes the digest checks, defeating the store's confinement and no-symlink guarantees during a strict release check.

**Fix:** Construct the restricted store in check mode and call its release-evidence verifier for every record; use its validated access-log API rather than direct reads. Add object, attestation, access-log, and parent-directory symlink mutations that must fail.

### CR-04: Post-tag verification accepts a tag on any passing historical commit

**File:** `scripts/check-v1-37-release-tag.ts:43-55`
**Issue:** In post-tag mode the checker assigns the tag's peeled target to `archive` and validates that target in isolation. It never requires that target to be the just-created archive commit (for the live command, `HEAD`) or otherwise receives and checks the expected archive commit. An annotated tag pointing to any older commit containing the listed files and a superficially valid readiness blob closes PROOF-08, even if later archive/release changes were never tagged.

**Fix:** Resolve the expected archive commit explicitly (default to `HEAD` for post-tag verification, or require a `--post-tag-archive <commit>` argument) and reject when `v1.37^{}` differs. Add fixtures with a valid older archive followed by a newer archive/current `HEAD`; only the latter may pass.

### CR-05: Release-tag archive protection omits `.planning/config.json`

**File:** `scripts/check-v1-37-release-tag.ts:40`
**Issue:** The archive checker rejects a delta for `CowardsGameSpec_Full_Consolidated_v1.md` but does not protect `.planning/config.json`, despite both being protected user-owned paths for this phase. An archive commit can therefore include a user configuration change and still pass the pretag and post-tag checks.

**Fix:** Maintain one closed protected-path list containing both files and reject any archive delta touching either one. Cover both paths in the Git fixtures, including a root/non-root archive commit case.

---

_Reviewed: 2026-07-22T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
