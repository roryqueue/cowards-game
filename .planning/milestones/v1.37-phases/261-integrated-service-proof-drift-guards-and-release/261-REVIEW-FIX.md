---
phase: 261
fixed_at: 2026-07-22T18:15:00-04:00
review_path: .planning/phases/261-integrated-service-proof-drift-guards-and-release/261-REVIEW.md
iteration: 3
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 261: Code Review Fix Report

**Fixed at:** 2026-07-22T18:15:00-04:00
**Source review:** `.planning/phases/261-integrated-service-proof-drift-guards-and-release/261-REVIEW.md`
**Iteration:** 3

**Summary:**

- Findings in scope: 9
- Fixed: 9
- Skipped: 0

## Fixed Issues

### CR-01: Browser proof check does not validate restricted evidence or the current service handoff

**Files modified:** `scripts/run-v1-37-browser-proof.ts`, `scripts/run-v1-37-browser-proof.test.ts`
**Commit:** b91a91c2
**Applied fix:** Requires exactly one receipt-matched restricted record, verifies it through the release evidence store, and recomputes the validated service handoff digest. Added inventory, object-deletion, and handoff-divergence mutations.

### CR-02: Browser collection writes private handoff data to an unvalidated root

**Files modified:** `scripts/run-v1-37-browser-proof.ts`, `scripts/run-v1-37-browser-proof.test.ts`
**Commit:** 57f0b35e
**Applied fix:** Initializes the restricted store before private handoff writes and uses root-confined no-follow control-file reads/writes that reject symlinked roots, directories, and files.

### CR-03: Rollback proof check follows evidence symlinks instead of the restricted-store verifier

**Files modified:** `scripts/run-v1-37-rollback-proof.ts`, `scripts/run-v1-37-rollback-proof.test.ts`, `scripts/lib/v1-37-restricted-evidence-store.ts`
**Commit:** 292becb4
**Applied fix:** Routes rollback release evidence checks through `requireReleaseEvidence`, including access-log validation and parent-directory no-symlink checks. Added object, attestation, access-log, and parent-directory symlink mutations.

### CR-04: Post-tag verification accepts a tag on any passing historical commit

**Files modified:** `scripts/check-v1-37-release-tag.ts`, `scripts/check-v1-37-release-tag.test.ts`
**Commit:** de97c6fc
**Applied fix:** Post-tag validation now defaults its expected archive to `HEAD` and supports an explicit expected archive commit; tags targeting older commits fail closed.

### CR-05: Release-tag archive protection omits `.planning/config.json`

**Files modified:** `scripts/check-v1-37-release-tag.ts`, `scripts/check-v1-37-release-tag.test.ts`
**Commit:** 16ff7aa1
**Applied fix:** Uses one closed protected-path list for both the consolidated spec and `.planning/config.json`, with non-root archive mutation coverage for each path.

### CR-06: Tag checker permits an archive with substituted proof and audit artifacts

**Files modified:** `scripts/evaluate-v1-37-release-readiness.ts`, `scripts/evaluate-v1-37-release-readiness.test.ts`, `scripts/check-v1-37-release-tag.ts`, `scripts/check-v1-37-release-tag.test.ts`
**Commit:** bed9347d
**Applied fix:** Adds a required closed, non-self-referential archive blob manifest to readiness, verifies it exactly at tag time, and rejects absent, unknown, missing, or digest-divergent archive blobs. Added a substitution fixture for every required blob.

### CR-07: Post-tag verifier trusts a forged readiness manifest instead of validating readiness

**Files modified:** `scripts/check-v1-37-release-tag.ts`, `scripts/check-v1-37-release-tag.test.ts`
**Commit:** e262efba
**Applied fix:** Parses archived readiness with the canonical validator and verifies that its prearchive, audit, and Strategy-foundation prerequisite hashes exactly join the manifest and archived blobs. Added a forged-readiness/tag fixture.

### CR-08: Committed release-readiness artifact is stale against the mandatory archive manifest schema

**Files modified:** `.planning/artifacts/v1.37-release-readiness.json`, `.planning/artifacts/v1.37-release-readiness.md`, and their commit-bound prerequisite proof/audit/handoff artifacts
**Commits:** `8d2e079d`, `52b08f93`, `58447c4a`, `d1dadc03`, `9e729cdf`, `42b0e287`, `4d176694`
**Applied fix:** Rebuilt the executable, Phase 260, integrated, prearchive, audit, Strategy-handoff, and readiness chain in the main checkout where the protected working-tree baseline is authoritative. The canonical readiness check now passes with the required closed archive manifest, 55 passed requirements, and PROOF-08 pending.

### CR-09: Phase 260 CLI did not dispatch under `tsx`

**Files modified:** `scripts/evaluate-v1-37-truthful-inputs-set-fairness.ts`, `scripts/v1-37-cli-dispatch.test.ts`
**Commit:** `45b3ba2e`
**Applied fix:** Replaced the path-string direct-entry check with the same realpath-based identity guard used by the other proof CLIs, added direct conflicting-mode coverage, and added imported-module isolation coverage. The focused dispatch suite passes.

---

_Fixed: 2026-07-22T18:15:00-04:00_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 3_
