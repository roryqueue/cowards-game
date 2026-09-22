---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-amendment"
reviewed: 2026-09-22T11:56:12Z
depth: standard
review_scope: incremental-seven-file-lean-amendment-plus-eight-fix-paths
reviewed_head: 86650982b1e008a72b1a90ccb5f67ca6379f5aee
fix_commits:
  - e1c805ad89447af6654a2b27e7fd87bf961442c1
  - d8359de002cca1687db63f78695d1b557dfa0666
  - 86650982b1e008a72b1a90ccb5f67ca6379f5aee
files_reviewed: 10
files_reviewed_list:
  - packages/strategy-lab/src/factory/fingerprint.ts
  - packages/strategy-lab/src/league/allocation.test.ts
  - packages/strategy-lab/src/league/allocation.ts
  - packages/strategy-lab/src/league/probes.ts
  - packages/strategy-lab/src/league/red-team.ts
  - scripts/lib/v1-38-league-authoring.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/run-v1-38-serious-league.test.ts
  - scripts/run-v1-38-serious-league.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
empirical_authority: false
---

# Phase 265: Lean Amendment Independent Re-review (Iteration 2)

**Reviewed:** 2026-09-22T11:56:12Z
**Depth:** standard, with targeted import/reservation/dispatch call-path tracing
**Files Reviewed:** 10
**Status:** clean

## Summary

Technical independent re-review passed for the original lean-amendment scope and
the eight changed fix paths at `86650982`. No new actionable correctness,
security, or robustness defect was found in this bounded review.

This is not human UAT, the complete 29-suite gate, an empirical preflight,
allocation, provider/model/Match execution, or Phase 265 completion. The
prospective route remains private, single-operator representative accounting;
it is not a formal external-custody or worst-case-capacity certification.

## Narrative Findings (AI reviewer)

### Resolution of prior CR-01: eager red-team policy initialization

**Status:** resolved.

`LEAGUE_PROBES` now lives in dependency-free `league/probes.ts`.
`red-team.ts` re-exports it without changing its public API, while
`allocation.ts` imports it directly. This removes the eager read across the
previous `red-team`/factory/allocation cycle. The new fresh-process test covers
both red-team-first and allocation-first entry order and preserves the exact
nine-probe policy tuple.

### Resolution of prior CR-02: receipt-refreshable reservation key

**Status:** resolved.

Prospective reservation bytes and their exclusive artifact name now bind only
the immutable allocation root. The separately retained run marker authenticates
both that reservation root and the capacity-receipt root. A receipt refresh
therefore cannot create a second reservation; complete and deliberately partial
reservation artifacts both cause the later `wx` reservation to reject before
provider issuance. Retained verification checks both marker and reservation.
Legacy V1 marker bytes and filenames remain on their original branch.

### Resolution of prior CR-03: response/coordinator capacity checks after charge

**Status:** resolved.

`beforeDispatch()` is now required by the response-retention interface and is
called before each response Match charge, start record, or provider
construction. The coordinator calls the same guard before either development
or independent producer attempt is started. The existing invocation-time guard
remains in place. A failed guard latches the retention budget, prevents further
dispatch, and leaves terminal/failure evidence on the separate reserve.

## Verification Notes

- `git diff --check 9739e36b..HEAD` passed.
- Targeted source-only regression:
  `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts -t 'initializes both policy APIs from a fresh'`
  passed: 1 file, 2 tests, 8 skipped.
- Direct review traced prospective root admission, reservation/run-marker
  authentication, retained verification, capacity checks before producer and
  response dispatch, and terminal evidence paths. It also checked that the
  fixed paths do not alter the V1 allocation root/schema branch or approved
  private/final-gate constraints.
- No structural pre-pass was provided. The initial review and its fix report
  remain preserved and were not rewritten.

_Reviewer: independent gsd-code-reviewer_
_Scope: source-only incremental re-review; no source files changed and no commit created._
