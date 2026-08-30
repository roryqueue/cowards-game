---
phase: 262-foundation-admission-measurement-custody-and-containment-con
fixed_at: 2026-08-30T01:18:53Z
review_path: .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-114-CODE-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 262 Plan 114 Code Review Fix Report

All five critical findings are fixed. Original v1 payload, REVIEW, carrier, and publication commit `ab539ab2` remain immutable history. Corrected v2 was published only after six actual non-live modes and post-observation canonical reauthentication.

## Fixed Issues

### CR-01: Reviewer delegates custody to Plan 113

**Commit:** `d404a7f0`
**Applied fix:** Added a Plan-114-owned source-separated derivation over raw Git modes/blobs/current bytes, recursive imports, portable and local installed/toolchain manifests, native inputs, Git executable/arguments, object-store identity, and local execution facts. The reviewer imports no Plan-113 custody derivation, acceptance, or root helper.

### CR-02: Value modes use subject acceptance decisions as their oracle

**Commit:** `eadbbca0`
**Applied fix:** Added an independent Plan-114 semantic oracle for complete bounded outcome topology and reproduction-v17 keys, receipt root, privacy, authority, and journal joins. Subject functions are executed only as observations and their complete outputs are compared with the independent results.

### CR-03: Semantic defects cannot produce blocked evidence

**Commit:** `4ed41fe3`
**Applied fix:** Classified observable custody/history/semantic drift into deterministic findings while retaining unclassified process-integrity failures as no-publication exceptions. Real executable-mode and current-byte mutations now produce stable sorted blocked payload/REVIEW/carrier bytes.

### CR-04: Cached foundation can go stale during observation

**Commit:** `2a272965`
**Applied fix:** Removed the repository-path foundation cache. The writer captures the complete foundation before observations, fully reauthenticates immediately afterward, compares the two, and aborts before publication on any drift. A real post-authentication byte mutation proves the second check fails.

### CR-05: Publication auth follows symlinks and accepts only literal zero

**Commit:** `dfeb17bc`
**Applied fix:** Current trio authentication now uses `lstat`, `O_NOFOLLOW`, stable `fstat` identity/size, regular non-executable mode checks, and raw committed blob equality. Corrected v2 stores the exact sorted finding set and linked observation evidence root, allowing the authenticator to independently re-render either zero or blocked verdicts.

## Corrected Publication

- Publication commit: `34bc94ec4e348f71e6055a091d60a505cffc0d79`
- Payload/review/carrier roots: `sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac` / `sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee` / `sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26`
- Verdict: zero findings; actual modes: 6/6; Plan-109-only eligibility: true
- Live/readiness invoked: false/false; fresh charged/accepted: 0/0; downstream authority: denied

## Verification

- Source-separated custody reproduced reviewed root `sha256:8929dd2d2d8c9c72c293a7b9e41e722ef274a1296160e877685ce0956969b852`.
- Real mode, byte, post-observation, symlink, blocked-render, and independent-oracle focused tests passed.
- The corrected `--write-review` pass completed six disposable modes, then full reauthentication, before writing v2.
- Committed v2 `--check-review` passed exact no-follow current/blob custody and exact zero-verdict re-render.
- No supplement, readiness, producer, live, or downstream artifact was created.

---

_Fixed: 2026-08-30T01:18:53Z_
_Fixer: the agent (gsd-code-fixer)_
