---
phase: 265-serious-current-rules-league-and-development-red-team
fixed_at: 2026-10-03T19:41:47Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-15-IMPORT-CRASH-REVIEW-v3.md
iteration: 3
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
---

# Phase 265: Import-crash review fix, iteration 3

The one v3 source finding was fixed. `all_fixed` refers only to this code-review iteration; historical disk admission remains closed, and no pilot or phase result is claimed.

## Fixed issue

### CR-01 — Bounded import can allocate an oversized artifact before enforcing its byte cap

**Files modified:** `packages/strategy-lab/src/factory/repository.ts`, `packages/strategy-lab/src/factory/repository.test.ts`, `scripts/run-v1-38-serious-league.test.ts`  
**Source/test commit:** `ce7b849c`  
**Companion test-compatibility commit:** `60148fd5`  
**Status:** fixed: requires human verification.  
**Applied fix:** The shared factory reader now rejects an oversized named file before opening it, opens with `O_NOFOLLOW`, checks the opened descriptor's type and size, and reads only into a buffer of at most `CAP + 1` bytes. The extra byte and post-read `fstat` deny growth or size change. Valid artifact bytes still flow through the existing digest and canonical/attempt validation. Repository tests cover valid API compatibility and an oversized named artifact. A lean-import fixture with 48 syntactically valid attempt filename pairs and one oversized artifact proves rejection before whole-file read, body parse, or historical verifier work.

The companion commit converts the obsolete two-attempt mocked positive test into an explicit incomplete-inventory denial without weakening the 48-attempt guard. The existing genuine complete 48-cell fixture now observes the real verifier call counts: three ordinary calls versus one bounded lean call, with the original root-equality assertions retained.

## Verification and limits

- Direct factory repository suite: 7/7 passed.
- Targeted serious-league regressions: 3/3 passed (genuine full-48/two-candidate import, incomplete two-attempt denial, oversized-artifact pre-read denial). The incomplete test was rerun after its final two-attempt correction and passed.
- Scoped strict TypeScript and `git diff --check` passed. No broad legacy pipeline or private historical reader was run.
- All fixtures were inert and synthetic; no Strategy execution, preparation, provider, container, Match, model, or empirical entry occurred. Prior reports/history and untracked immutable reservations were preserved. The pending historical core/cache disk-accounting choice was not applied; v2 allocation still fails closed.

---

_Fixed: 2026-10-03T19:41:47Z_  
_Fixer: gsd-code-fixer_  
_Iteration: 3_
