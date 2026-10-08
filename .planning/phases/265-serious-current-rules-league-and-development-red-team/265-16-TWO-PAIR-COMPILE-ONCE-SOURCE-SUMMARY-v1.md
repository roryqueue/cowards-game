---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
subsystem: runtime
tags: [typescript, compile-once, source-only, v11-2]
status: complete
scope: source-implementation-only
author_agent: /root/execute_v11_compile_once
source_commit: 31091283
source_root: sha256:84b80756789cedde6db22e365a7826d47f277ba592fcae710ad296aad77444ba
source_entries: 915
requires:
  - phase: 265
    provides: checked compile-once addendum and immutable closed pair-one history
provides:
  - one real local transpilation per default TypeScript revision build
  - fresh ordinal-two review-v3 mapping and positive report inventory
affects: [265-source-review, 265-source-verification, v11-2-prospective-gates]
tech-stack:
  added: []
  patterns: [local real compilation reuse without public injection or cache]
key-files:
  created: [packages/runtime-js/src/revision-compile-once.test.ts, scripts/run-v1-38-lean-compile-once.test.ts]
  modified: [packages/runtime-js/src/revision.ts, packages/runtime-js/src/validation.ts, packages/runtime-js/src/source-artifact.ts, scripts/run-v1-38-lean-correction.ts, packages/strategy-lab/src/league/lean-experiment.ts]
key-decisions:
  - Internal validation computes its real compilation and returns it with the complete unchanged report.
  - Public validation and artifact signatures and package exports remain unchanged.
  - Review commits remain pinned through exact current manifest and source-file diff; source-equivalent administrative commits remain possible.
requirements-completed: []
duration: approximately 11min
completed: 2026-10-08
---

# Phase 265 Plan 16: Compile-once Source Summary

One locally computed TypeScript compilation now supplies both full revision validation and deterministic artifact construction; only unused v11-2 maps to fresh source review v3.

This records completion of the source implementation portion only. Independent review, source validation/verification and all empirical admission gates remain pending. Existing Plan 16, Phase 265 and LEAG requirements are not marked complete.

## Task Commits

1. RED focused proofs: `0d704fb9` — `test(265-16): pin compile-once and prospective v11-2 source gate`.
2. GREEN source implementation: `31091283` — `perf(265-16): compile revisions once and gate fresh v11-2 source`.

RED produced seven intended failures: four demonstrated two compiler calls instead of one; three demonstrated old ordinal-two mapping and missing prospective inventory/test identity. Three existing standalone/override/failure contracts passed.

## Accomplishments

- Internal `validateStrategySourceWithCompilation` accepts only source and existing validation options, computes the actual compilation itself in the original validation sequence, and returns report plus that compilation. Revision construction forwards that local result to the internal artifact factory. No public caller can inject output; neither internal seam appears in package exports.
- Public standalone validation still performs its own compilation. Public standalone artifact construction also independently compiles. All existing validation checks and diagnostic ordering remain; metadata artifacts, non-TypeScript revisions, invalid syntax, forbidden capabilities, compiler-reported failure and thrown failure retain their outcomes.
- Focused tests compare full validation reports and artifact objects against standalone output, pin valid artifact SHA-256/byte count/revision identity, check immutability and independently count the real unmocked compilation seam on success/security/syntax branches. Compiler failure branches use test-only mocks, not production injection.
- Both routes for `v11-1` still map to immutable `265-16-TWO-PAIR-SOURCE-REVIEW-v2.md`; both `v11-2` routes map to new `...SOURCE-REVIEW-v3.md`. Old review fails under the changed manifest. Fresh-review tests exercise genuine reviewed commit argument and complete source-file diff; only their synthetic review I/O/git result is mocked.
- Positive report inventory now includes review-v3, compile-once research/plan/check/summary/review/validation/verification. Exact functional source inventory adds the new runtime/runner proof files and research/plan/check. Self-referential summary/review/validation reports are physical inventory, not functional source inputs. Report growth is positively debited; shrink/deletion cannot refund.

## Verification

Final focused command:

`pnpm exec vitest run packages/runtime-js/src/revision-compile-once.test.ts packages/runtime-js/src/revision.test.ts packages/runtime-js/src/validation.test.ts packages/runtime-js/src/transpile.test.ts scripts/run-v1-38-lean-compile-once.test.ts packages/strategy-lab/src/league/lean-experiment.test.ts --maxWorkers=1`

Result: **95/95 PASS**, six files, zero skips, 14.24s final run. Prior final-content run also passed 95/95 in 15.98s.

- `pnpm --filter @cowards/runtime-js build`: PASS.
- `pnpm --filter @cowards/strategy-lab typecheck`: PASS.
- `bash -n scripts/run-v1-38-lean-correction.sh`: PASS.
- `git diff --check`: PASS; no tracked deletions.
- Both ordinal manifests independently recomputed equal: `sha256:84b80756789cedde6db22e365a7826d47f277ba592fcae710ad296aad77444ba`, **915 entries**.
- Strict affected-script command with TypeScript 6 `--ignoreConfig --types node --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --noEmit` reports exactly **six inherited errors**, not a pass: feasibility-protocol.ts:52 and planner/missions.ts:52,60,66,68,69. No changed-file diagnostics. Earlier incomplete CLI invocations lacked required configuration/types and are not verification evidence.

## Connected Custody Evidence and Limits

The existing isolated v11 retained suite initially returned 9 PASS / 1 FAIL / 47 filter-excluded: `v11 reauthenticates accepted own diagnostic and no-ledger baseline refusal after actual pair2 start` failed `LEAN_CORRECTION_RETAINED_ACCEPTED_CHECK_CUSTODY` while builds/source formatting were also in progress. Exact failure causality is not established. No guard was weakened and no retained production source was changed.

A single rerun of that same connected test against stable final source returned **1 PASS / 56 filter-excluded**, 50.93s (46.94s test). This is a real isolated producer/audit/FINAL/refusal/carry/accounting fixture, stronger than a shape-only carry test, but it is **not** the actual historical entered-result diagnostic plus entered-without-result baseline path under a changed manifest. A new connected authentic fixture for that exact finite historical pair was not added within the bounded task. MAIN must separately verify the actual finite closed carry non-admittingly; no ordinary historical reader, payload inspection or relabeling is authorized.

## Deviations and Issues

- Two test-only setup issues were corrected inline: optional artifact bytes needed explicit non-null typing; ESM built-in spies required test-local module facades. No production behavior expansion.
- The temporary current-HEAD-equals-review-commit restriction was removed before GREEN because the established exact manifest/source diff contract must allow source-equivalent administrative commits. Actual entry continues to bind and hold its own HEAD.
- Shared STATE/ROADMAP/requirements are deliberately left to MAIN under the assigned source-file ownership boundary; no full-plan advancement or LEAG credit is warranted by this addendum.

## Boundaries and Next Step

No new package, public API, cache, security bypass, Strategy rule, provider, Match, empirical helper, allocation, private payload inspection or ordinary old reader was introduced/run. All earlier consumed files, route identities and reports remain unchanged. Pre-existing untracked historical files/locks were preserved. Source hold was already released before this task; no empirical hold began here.

The same continuous deadline `2026-10-08T01:43:30.738Z`, cumulative 108,000,000 ms with full old 93,600,000 ms debit, 1,860,000 ms reserve, 15 GB/300 Matches/all 33 spent charges and all runtime limits remain unchanged. Pair two is unused. Native RSS benefit, threshold cure, first-charge feasibility and complete 36-cell fit remain **unestablished**.

Next: independent exact-source review/fix, validation and verification, then only separately gated prospective data/helper/allocation/SAME-PROCESS capacity work if time safely remains. No Phase 265/freeze/formation/holdout/public/counting/production credit.

## Self-Check: PASSED

Both created test files exist; RED `0d704fb9` and GREEN `31091283` exist in git history; no tracked deletions. Changed production code introduces no new network/auth/file-access/schema trust boundary or goal-blocking stub. Test-only empty values are intentional synthetic fixtures, not production UI stubs.
