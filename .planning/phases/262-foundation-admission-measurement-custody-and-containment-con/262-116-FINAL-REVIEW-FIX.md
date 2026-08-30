---
phase: 262
fixed_at: 2026-08-30T15:15:22Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-116-FINAL-REVIEW.md
iteration: 3
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 262 Plan 116: Final Review Fix Report

### CR-01: Canonical zero-v3 fresh replay still fails its committed observation contract

**Commits:** RED `d629a0f0`; fix `9713e513`; additive v4 publication `f03f0e05`; regression `65b05d23`.

**Diagnosis:** All committed v3 observations, observation root, and disposable root reproduced exactly. The failure occurred later during rerender because v3 recorded a worktree-specific local root. That root differed while the Git-derived reviewed root remained equal. The reviewed root also included ambient runtime metadata.

**Applied fix:** V4 derives reviewed and disposable identities only from pinned Git subject/tree/dependency/package inputs and ordered modes. Current local custody is still independently checked but is not publication identity. V1-v3 remain immutable and ineligible.

**Verification:** Canonical v4 authentication passed after publication. A detached worktree then added and committed unrelated documentation; authentication still passed with fresh replay. Repaired blocked history still authenticates without eligibility, while persistent drift still fails closed. No supplement, readiness, live, producer, or downstream effect exists.

_Fixed: 2026-08-30T15:15:22Z_
_Fixer: the agent (gsd-code-fixer)_
