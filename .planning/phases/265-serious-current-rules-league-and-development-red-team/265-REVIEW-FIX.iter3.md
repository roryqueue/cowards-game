---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-09-21T22:30:20Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 265: Code Review Fix Report

**Fixed at:** 2026-09-21T22:30:20Z  
**Source review:** `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-REVIEW.md`  
**Iteration:** 2

**Summary:** 2 findings in scope; 2 fixed; 0 skipped. Both are logic fixes with connected synthetic RED→GREEN verification. Independent re-review and the orchestrator's combined gate remain pending; neither is a human-only checkpoint.

## Fixed Issues

### CR-01: Post-terminal retention failure creates an honest prefix the reader rejects

**Files modified:** `scripts/lib/v1-38-league-response-runtime.ts`, `scripts/run-v1-38-serious-league.ts`, `scripts/run-v1-38-serious-league.test.ts`  
**Commit:** `06498604`  
**Applied fix:** Retain the already-published accepted Factory terminal and root-only candidate closure in the response-production failure record. Reopening authenticates the immutable journal terminal, published candidate closure, validation and independence graph roots, full charged response-Match prefix, and absence of a production-result record. Pre-terminal failures still require their system-failure terminal. No terminal is rewritten and no production result is manufactured.

**Connected regression:** 48/48 injected response Matches; result append denied after accepted Factory terminal; read-only reopening returns `process_invalid` and `empiricalRequirementsComplete: false`. A copied Factory store with a forged, validly rooted accepted terminal is denied. RED reproduced `RETAINED_RESPONSE_FAILURE_TERMINAL` (99.63 s); final GREEN passed (105.72 s).

### CR-02: A later report publication failure invalidates already retained partial reports

**Files modified:** `scripts/run-v1-38-serious-league.ts`, `scripts/run-v1-38-serious-league.test.ts`  
**Commit:** `5d554920`  
**Applied fix:** Authenticate retained selections and reports as an ordered seed prefix on a `run-failure` head. Recompute the closed ledger, each retained selection, report projection, artifact digest, matrix/selection bindings, and publication dependencies. A complete head still requires all seed reports. The failure result remains non-scorable `process_invalid`, with immutable first-seed publication and all 160 synthetic cell charges retained.

**Connected regression:** Two-seed injected run exhausts ordinary retention at the second report after the first report and both selections are durable. Read-only reopening succeeds only as `process_invalid`; a forged complete head is denied by report coverage and a tampered first-report artifact is denied by digest. RED reproduced `RETAINED_FAILURE_DISPOSITION` (144.23 s); final GREEN passed (165.02 s). Existing successful one-seed run/reopen regression passed (85.57 s).

**Compatibility note:** An intermediate extra comparison of a selection's auxiliary serialized `candidates` field with reconstructed candidate objects rejected the existing valid successful path. It was removed before commit. Run-start candidate content is already compared with imported candidate content, each admission and closure is revalidated, and the seed selection itself is recomputed from authenticated matrices and final candidates. The removed comparison added no scoring or evidence authentication.

## Verification

- Strict no-emit TypeScript check passed for both affected scripts, their connected test, and `packages/strategy-lab/src/league/{report,repository}.ts`.
- `git diff --check` passed before both commits; the source worktree is tracked-clean after them.
- All execution was through injected synthetic fixtures. No private historical store, Strategy, provider, model, author, teacher, empirical allocation, or full 29-suite gate was run.

---

_Fixed: 2026-09-21T22:30:20Z_  
_Fixer: gsd-code-fixer_  
_Iteration: 2_
