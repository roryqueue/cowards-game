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
  critical: 2
  warning: 0
  info: 0
  total: 2
status: issues_found
---

# Phase 261: Code Review Report

**Reviewed:** 2026-07-22T00:00:00Z
**Depth:** deep
**Files Reviewed:** 67
**Status:** issues_found

## Summary

All six previously reported implementation defects have source-level fixes, and the focused readiness/tag/browser/rollback suites pass (17 tests). The final archive binding is still not release-ready: its required generated artifact is stale, and the independent post-tag verifier accepts a hand-authored manifest without validating the readiness contract that is supposed to authorize it.

## Critical Issues

### CR-01: Committed release-readiness artifact is stale against the mandatory archive manifest schema

**File:** `.planning/artifacts/v1.37-release-readiness.json:1`
**Issue:** `bed9347d` makes `archiveBlobSha256` a required top-level field in `validateV137ReleaseReadiness` (`scripts/evaluate-v1-37-release-readiness.ts:175-190`), but the committed readiness JSON still has the old nine-key shape and no manifest. The changed commit does not regenerate this artifact. A release/archive performed from the current source/artifact state therefore fails the tag check with `ARCHIVE_BLOB_MANIFEST_MISSING` (and the readiness check cannot validate the committed pair once prerequisites are supplied).

**Fix:** Re-run the canonical readiness write only after its prerequisite checks succeed, commit the resulting JSON/Markdown pair, then run the strict readiness and tag checks. Add a test or release gate that compares the committed artifact shape with the current validator after every schema change.

### CR-02: Post-tag verifier trusts a forged readiness manifest instead of validating readiness

**File:** `scripts/check-v1-37-release-tag.ts:37-53`
**Issue:** `verifyArchive` parses readiness as an unvalidated record and checks only `releaseState`, `releaseOperation.completion`, and the self-consistent `archiveBlobSha256` map. It never calls `validateV137ReleaseReadiness` or verifies the map's prearchive/audit/handoff entries against `prerequisiteHashes` and the archive blobs. An attacker can replace the readiness blob with a handcrafted `release-ready` object containing hashes of substituted required files, put those same arbitrary hashes in the tag message, and pass post-tag verification. This defeats the independent readiness-bound tuple/proof/audit/handoff join required for PROOF-08 closure.

**Fix:** Parse the archive readiness blob with `validateV137ReleaseReadiness`; require the prearchive, milestone-audit, and Strategy-foundation manifest entries to equal their corresponding `prerequisiteHashes`, and independently hash those archive blobs against those prerequisite values. Add a Git fixture that changes readiness prerequisite hashes and the archive manifest/tag message together; it must still fail.

---

_Reviewed: 2026-07-22T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
