---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16-source-only-supplement
status: proposed_source_only
autonomous: true
authorizing: false
---

# Accepted diagnostic audit deduplication: existing Plan16 supplement

## Research and fixed scope

The new v10-1 diagnostic passed; the conditional baseline was stopped by resource_threshold before any charge. Its unique terminal-only check is closed. The exact initiating native allocation remains unknown. Static diagnosis in `.planning/debug/v10-baseline-precharge-memory.md` confirms redundant full audits: baseline request and predecessor consumers each call both authenticateLeanSupervisorDiagnosticCheck and authenticateLeanRetryClosureV8; the latter already calls the former and validates its full acceptance/FINAL/reader-close joins. This repeats materializing retained replay work, not merely digest comparisons.

## Recommended repair

For exact v10-1 only, derive the accepted-check primitive metadata from the already fully authenticated accepted closure. Authenticate that closure exactly once per consumer; it must still derive and compare its immutable persisted body and perform the existing full accepted diagnostic audit. Existing consumer comparisons must remain unchanged or be proven equivalent: exact extension/ordinal/accepted/FINAL, source/allocation/check roots, actual reader-close time, request lineage and charge counts. No persistent/global cache, caller-issued proof, byte-custody bypass, relaxed source/HEAD check, skipped full audit, threshold or cap change. v8/v9/legacy paths remain byte-for-byte behaviorally unchanged. No broad caching or lifetime-spanning receipt redesign in this repair.

## Tasks and gates

1. Independent plan check of the equivalence and safety boundary. If the closure cannot supply every previously validated field, stop with a concrete finding instead of removing a check.
2. RED/GREEN focused tests for the exact accepted-closure adapter and rejection of nonaccepted/nonFINAL/null or mismatched check/reader/source/allocation/extension/ordinal fields. Wire only the v10-1 baseline request, predecessor and terminal-carry consumers; retain legacy dual-auth paths. Use existing actual composed fixtures for lineage/admission regressions. Synthetic evidence is not empirical feasibility.
3. Independent source review/fix; MAIN focused suite, configured lab types, shell syntax, diff and boundary checks in proportion to changed source; source-only verification of all three joins and unchanged legacy dispatch. Commit/push reviewed safe work.

## Stop and evidence rules

This supplement authorizes NO request, prepare, allocation, Match, ordinary historical reader or retry. Preserve all consumed source snapshots, artifact/authority/request/allocation/ledger/result/check/reservation bytes. No old accepted diagnostic may become authority under changed source. Record exact new source and tests/review limits. Do not claim a native memory reduction or guarantee the full36 fits without a fresh independently reviewed prospective route. The original93.6Mms/15GB/300 caps and all32 charged/cost carry remain unchanged; only a direct human decision can authorize another empirical route or change them. No LEAG/phase/freeze/formation/holdout/public/counted/production completion.
