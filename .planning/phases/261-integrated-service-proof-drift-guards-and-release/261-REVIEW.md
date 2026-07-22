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
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 261: Code Review Report

**Reviewed:** 2026-07-22T00:00:00Z
**Depth:** deep
**Files Reviewed:** 67
**Status:** issues_found

## Summary

The five previously reported blockers are addressed: browser checks now validate the exact restricted record and bound handoff, browser writes validate the restricted root before private output, rollback verification uses the no-follow store API, tag targets are bound to the expected archive commit, and both protected paths are rejected. The focused fix suites pass. One critical release-closure bypass remains because the archive checker still verifies only that required files exist, not that their committed bytes match readiness-bound values.

## Critical Issues

### CR-01: Tag checker permits an archive with substituted proof and audit artifacts

**File:** `scripts/check-v1-37-release-tag.ts:37-41`
**Issue:** `verifyArchive` only compares `archiveBlobSha256` when that optional property exists. The canonical readiness validator explicitly rejects any extra top-level key at `scripts/evaluate-v1-37-release-readiness.ts:164-175`, and the checked readiness artifact has no `archiveBlobSha256`. Therefore the tag gate only checks that each required file exists; it does not bind the archive's prearchive proof, audit, or handoff bytes to the readiness hashes. A commit can retain a syntactically `release-ready` readiness JSON and tag-message fields while replacing the other required archive files with arbitrary content, then pass both archive verification and post-tag closure.

**Fix:** Add a required, closed `archiveBlobSha256` map to the readiness schema (or derive an equivalent mandatory manifest from already trusted readiness prerequisites), populate it before archive, and make `verifyArchive` reject its absence, unknown paths, missing paths, and every digest mismatch. Add Git fixtures that replace each required archive blob while preserving the readiness file and tag message; each must fail.

---

_Reviewed: 2026-07-22T00:00:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
