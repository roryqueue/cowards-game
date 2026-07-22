---
phase: 261
fixed_at: 2026-07-22T17:47:00-04:00
review_path: .planning/phases/261-integrated-service-proof-drift-guards-and-release/261-REVIEW.md
iteration: 2
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 261: Code Review Fix Report

**Fixed at:** 2026-07-22T17:47:00-04:00
**Source review:** `.planning/phases/261-integrated-service-proof-drift-guards-and-release/261-REVIEW.md`
**Iteration:** 2

**Summary:**

- Findings in scope: 6
- Fixed: 6
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

---

_Fixed: 2026-07-22T17:47:00-04:00_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_
