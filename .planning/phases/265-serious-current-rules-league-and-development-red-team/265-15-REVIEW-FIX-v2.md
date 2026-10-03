---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-10-03T13:53:22Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-REVIEW-v2.md
iteration: 2
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 265-15: Code Review Fix Report

**Fixed at:** 2026-10-03T13:53:22Z
**Source review:** `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-REVIEW-v2.md`
**Iteration:** 2

**Summary:**
- Findings in scope: 1
- Fixed: 1
- Skipped: 0

## Fixed Issues

### CR-01: Caller-supplied charge ordinal can substitute the scheduled candidate

**Files modified:** `scripts/lib/v1-38-lean-experiment-authority.ts`, `scripts/run-v1-38-lean-experiment.test.ts`
**Commit:** `5a443160`
**Applied fix:** Reopen and resolve the retained charge before deriving the slot; compare the complete canonical charge value, including ordinal, then derive the slot and binding roots only from that retained charge. Added a regression that forges only ordinal on a genuine charge while supplying the alternate candidate/runtime and asserts authority issuance is denied. Existing valid closure and ordered-claim tests remain intact.
**Verification:** `pnpm exec vitest run scripts/run-v1-38-lean-experiment.test.ts packages/strategy-lab/src/league/lean-experiment.test.ts` — 15 tests passed across 2 files. `pnpm exec tsc --noEmit -p tsconfig.json` — passed. Inert source-manifest check — root `sha256:85e99c02067cbee273ae2eb1dcbc2a488cd5366163d9c3dc17732f93ab926116`, 861 entries.

---

_Fixed: 2026-10-03T13:53:22Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_
