---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "13"
subsystem: milestone-release
tags: [v1.37, archive, annotated-tag, proof-08]
status: release-ready-at-archive
---

# Phase 261 Plan 13: Terminal Release Operation Summary

This file is intentionally committed before the tag exists. It records the immutable pre-tag side of the terminal operation and does not claim PROOF-08 has passed.

## Archive Commit Contract

- Archive the exact release-ready roadmap, requirements, audit, and all six phase directories under `.planning/milestones/`.
- Preserve the active source blobs bound by `v1.37-release-readiness.json`; the post-tag checker validates those committed bytes and their archived counterparts.
- Keep 56 requirements traced as 55 passed plus PROOF-08 `ready_pending`, with zero gaps, zero overrides, and no predicted Git identity.
- Exclude `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` from the archive commit and preserve their captured baseline.
- Use the exact commit subject `chore: archive v1.37 milestone`.

## External Closure Contract

After the archive commit exists and passes `pnpm exec tsx scripts/check-v1-37-release-tag.ts --pretag-archive "$(git rev-parse HEAD)"`, create annotated local tag `v1.37` at that commit. Its message must include the readiness-bound semantic tuple, prearchive-proof hash, audit hash/path, Strategy-handoff hash, and readiness hash. The read-only post-tag checker, annotated object-type check, peeled-target check, and protected-baseline check are the only PROOF-08 closure evidence.

No worktree document is rewritten after the tag, the tag is not pushed, and the serious Strategy milestone remains unauthorized pending its own approval.

## Pre-Tag Evidence

- Code review: clean after nine fixed findings.
- Validation: every Plan 01-12 executable task covered; only this outer operation was pending.
- Security: 49/49 identified threats closed, zero open findings.
- UAT: all six milestone phases passed with zero pending scenarios.
- Integration audit: 56/56 mapped, 55 passed + one ready/pending, 8/8 integrations, 8/8 end-to-end flows, zero orphans.
- Strict boundaries: 8 public classes and 11 required artifacts passed; zero strict or ownership offenses.

## Auto-fixed During Pretag Validation

- **[Rule 1 - Release wiring]** Corrected Plan 13's nonexistent package alias and symbolic-ref invocation to the checker's existing tested direct CLI with an explicitly resolved commit hash. The first pretag attempt exposed the documentation/wiring mismatch; the tag remained absent, proof-bound source bytes were left unchanged, and the corrected plan plus this record were included by amending the still-untagged archive commit before repeating pretag validation.

## Self-Check: PRETAG READY

The archive commit containing this summary must be validated before any tag is created. Completion is deliberately established only by the immutable annotated tag and independent post-tag join.
