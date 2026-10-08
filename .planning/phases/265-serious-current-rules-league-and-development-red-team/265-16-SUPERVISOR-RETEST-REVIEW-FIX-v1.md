---
phase: 265
fixed_at: 2026-10-08T11:52:30Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-SUPERVISOR-RETEST-SOURCE-REVIEW-v1.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 265: Supervisor Retest Review Fix

Source-only repair of the two Critical findings in the fresh v12 source review, not the older correction review. Both are fixed in source and focused regressions; each remains **fixed: requires human verification** through independent re-review, validation and verification. This report does not authorize requests, empirical admission or execution.

## Fixed issues

### CR-01: Selected closure filename in the strict accepted inventory

Commit `41fd1b64` changes only the existing retry-mode inventory entry to `leanRetryClosureFile(supervisor)`. V12 accepts its actual `retest-closure-v12.json`; older modes retain their prior filename. Full retained auditing remains enabled and unrelated files remain forbidden.

The new complete synthetic accepted diagnostic executes the production allocation/reason-v2 audit, closure publisher, saved closure reauthenticator, accepted-own-pair authenticator and baseline join. Host loading and inherited cold lineage are closed-world mocks, not actual historical readers; the closure authenticator is not mocked. Its saved closure reauthentication reproduced the reported ACCEPTED_INVENTORY failure before the fix. Borrowed check, closure, source and ordinal joins are rejected. Adding the old filename or an unrelated file is still rejected.

Files: `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts`.

### CR-02: Await the ordinary baseline reader inside the wrapper try

Commit `7b5b21f1` makes the v12 wrapper async and awaits exactly one selected ordinary reader inside its try before publishing terminal carry. Async rejection now enters the existing finite refusal branch after closed reader accounting. The async CLI caller already assimilates the returned promise; no caller edit or second ordinary reader was needed. Older/default v1 and v11 wrappers are unchanged.

Controlled pending baseline dependency tests execute the actual production wrapper, refusal publisher, carry derivation and hold seal against virtual host IO. While pending, the wrapper remains pending and emits no carry, refusal or seal. Fulfillment returns its check and emits closed-result carry/seal. Rejection preserves the original error and emits finite non-authorizing refusal then failed-result carry/seal after closed intervals. Each reader is called once. Both paths retain one current charge, 36 cumulative charges, the positive physical floor and 108000100 ms cumulative elapsed; no refund or unhandled rejection was observed.

Files: `scripts/lib/v1-38-lean-correction-retained.ts`, `scripts/lib/v1-38-lean-supervisor-retest-v12.test.ts`.

## Actual bounded checks

All Vitest runs used Node old-space 768 MiB, TSX_DISABLE_CACHE=1, NODE_DISABLE_COMPILE_CACHE=1, one worker, no file parallelism and a real 60000 ms process-group SIGKILL guard. No guard fired.

| Check | Actual result |
| --- | --- |
| CR-01 targeted RED | exit 1; 1 failed / 7 filtered skips; 6.29 s; saved reauthentication ACCEPTED_INVENTORY |
| CR-01 targeted GREEN | exit 0; 1 passed / 7 filtered skips; 6.90 s |
| CR-02 initial fixture wiring | exit 1; 2 failed / 8 filtered skips; 6.70 s; exact request constructor rejected excess fields; fixture corrected |
| CR-02 targeted RED | exit 1; 2 failed / 8 filtered skips; 7.22 s; action prematurely settled while reader pending |
| CR-02 targeted GREEN | exit 0; 2 passed / 8 filtered skips; 8.20 s |
| Final inspected v12 suite | exit 0; 10/10 passed; one file; 10.85 s |
| Strict TypeScript, including changed regression test | final exit 2; exactly six inherited errors; not PASS; none in changed files |
| Re-read changed sections and git diff --check | exit 0; intact selected filename/await/catch context |
| Actual source manifest generation | exit 0; 922 unique strictly sorted positive raw roots |

Strict check: `tsc --ignoreConfig --types node --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck` on correction.ts, correction-retained.ts, the new v12 test, baseline.ts and baseline-retained.ts. The first strict run also found two fixture typing errors; both were corrected before the final run. Inherited errors remain at feasibility-protocol.ts:52 and planner/missions.ts:52,60,66,68,69. They were not changed or labeled passes. Overlapping test runs are not additive independent coverage.

## Source handoff and preserved limits

Final source HEAD: `7b5b21f11483cb2f0b1bbe561966eee53bb741dc`, descended from reviewed MAIN `b7787391aec1acf20d130851bebb110d1eb2c30f`.

New actual reviewed-source manifest: `sha256:8e7956bdebbc1da5ffec6ddc8d9bfac6e77eee8a141851c3e63d6e0f98b2758c`, domain `lean-supervisor-retest-reviewed-source-v12`, 922 unique sorted entries. Prior review/source-summary roots are stale for this changed source; they were left immutable. This downstream repair report is not self-hashed source authority.

Work occurred in dedicated `/tmp/sv-265-reviewfix-v12-0SPhLs` (`/private/tmp` physical path), branch `gsd-reviewfix/265-v12-20261008`. Transactional integration uses only ff-only advancement of MAIN from b7787391 to 7b5b21f1, followed by removal of this exact worktree, deletion of its integrated branch and then its dedicated v12 recovery sentinel. Existing unrelated worktrees, markers, reports and untracked artifacts are preserved. The root orchestrator commits this additive report separately.

No actual canonical prospective v12 path, actual old accepted reader, helper, data review, request, allocation, preparation, Docker/provider or Match execution was invoked or published. New fixture credit is synthetic/source-only, not empirical evidence. Mocked baseline completion is wrapper lifecycle coverage, not full baseline-reader acceptance.

All elapsed work, scratch and temporary/worktree bytes remain positive costs; no refund is claimed. The exact approved clock remains 108000000 + max(0, now - 1791455941097), ceiling 136800000 ms and absolute deadline 2026-10-08T18:39:01.097Z. Prior 34 charges, 15 GB/300 Match ceiling, 2 GB scratch, 31-minute reserve and guest1000/host5000/startup2500/Match600000/parent250 ms remain unchanged. Authorization's five downstream semantic exclusions and inclusion of helper bytes are unchanged, as are game rules, privacy, custody and old actual v11 evidence.

Independent fresh re-review, validation and verification are still required before any empirical activation. No self-certification is claimed.

