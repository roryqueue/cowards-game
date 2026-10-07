# Plan 16: Two-pair v11 supplement — source research

**Scope:** Read-only implementation mapping for additive v11-1/v11-2 private diagnostic/conditional-baseline routes. Source findings are verified against the current repository; this document does not authorize preparation, allocation, admission, a Match, or any reader invocation.

## Approved constraints (must remain invariant)

- Two distinct fresh private diagnostic/conditional36-cell-baseline pairs are approved and unused (0/2); no repeated per-pair approval literal. Only that pair's new accepted diagnostic check plus actual FINAL may admit its baseline. [VERIFIED: `265-16-TWO-PAIR-APPROVAL-20261007.md`]
- Four-hour prospective extension: actual MAIN start `1791409410738` (`2026-10-07T21:43:30.738Z`), old 93,600,000 ms fully debited, cumulative cap 108,000,000 ms, deadline `2026-10-08T01:43:30.738Z`; all later wall time counts. [VERIFIED: `265-16-TWO-PAIR-TIME-APPROVAL-20261007.md`]
- Preserve 15,000,000,000 B / 300 Matches, all 32 historical charges and costs/files, 1,860,000 ms reserve, guest 1,000 ms, host 5,000 ms, startup 2,500 ms, Match 600,000 ms, scratch 2,000,000,000 B, and all other existing bounds. No 36-cell fit guarantee. [VERIFIED: same approval]
- Source-only work, independent reviews, tests, and verification must precede fresh actual MAIN data/helper review, immutable allocation commit, unique entry, and SAME-PROCESS capacity check. Hold source and HEAD through terminal and exactly one appropriate independent verification. No Match/provider/allocation/private payload/raw error in this supplement. [VERIFIED: same approval]

## Summary and recommended route

Add two successor identities (`v11-1`, `v11-2`) through explicit additive route tables and CLI/shell branches. Do not alter v10 constants, request bytes, historical pins, old terminal verifier, or v10 source manifest. The existing `LeanRetryMode` currently ends at `v10-1`; v10's `LEAN_TWENTY_SIX_V10_EXTENSION`, predecessor inspector, baseline terminal-only verifier, and path selection all assume one v10 attempt and fixed consumed history. A safe v11 should use its own extension/mode discriminant, request/allocation namespaces, and terminal-custody verifier.

For v11-1's predecessor, reuse only two narrow source-only facts: (1) the already accepted v10 diagnostic's authenticated closure/check metadata (`accepted`, actual FINAL, reader-close, roots, cumulative charge count), and (2) the v10 baseline's closed terminal-only custody showing zero new charge/result/accepted check. Do not rerun `verifyLeanCorrectionRetained` or call ordinary historical readers. Preserve the existing one-full-accepted-closure-audit-per-consumer rule: a consumer obtains its full accepted closure once and derives check metadata from it, with no global/persistent cache. v11-2 is a separately approved fresh pair and does not require v11-1 diagnostic success. It must account for v11-1's closed outcome and all costs/files in its predecessor, regardless of whether pair 1 succeeded, failed, or was refused. For either pair, only that pair's own newly accepted diagnostic check plus actual FINAL admits its baseline; a diagnostic failure/refusal can close that pair and the next unused distinct pair may proceed under the same aggregate limits.

## Source map: additive changes likely required

| Area | Current seam / analog | v11 implementation mapping |
|---|---|---|
| Mode/type and constants | `packages/strategy-lab/src/league/lean-experiment.ts`: `LeanRetryMode` (line 73), `isLeanTwentySixMode`/prospective binding (76-77, 121), extension schemas (115-120), `leanCorrectionRoutePaths` (781), writable paths (793), survivor validation (933-945) | Add explicit v11-1/v11-2 discriminants and an immutable v11 timebox binding carrying the approved 108M cap, exact MAIN start and unchanged caps; add distinct per-ordinal diagnostic/baseline paths, setup/authorization/continuation/report identities, writable-path handling, and survivor validation. Never repoint existing v10 names/constants to new values. Ensure elapsed accounting is based on start bound + all elapsed costs, with old 93.6M fully carried and no idle exclusion.
| CLI/source manifest | `scripts/run-v1-38-lean-correction.ts`: `parseLeanCorrectionCommand` (around 288), `leanCorrectionChildSupervisor` (around 1236), source-manifest/version dispatch; `scripts/run-v1-38-lean-correction.sh`: case table | Add exact v11-1/v11-2 command grammar and fixed request paths, child command mapping, and shell temp routing. Keep argument count and literal `--request` requirements; reject unknown mode/route. Bind source manifest to fixed v11 HEAD/review identities rather than modifying v10 manifest behavior.
| Requests and authorization | runner's `readLeanRemainingRequestV9`/`readLeanRemainingRequestWithPurposeV9`; `readLeanRetryRequestV8`; setup witness and request-data-root checks | Add dedicated v11 request/authorization readers enforcing distinct ordinal, extension root, source root, request-data root, review/data/helper review roots, continuation root, and previous pair's terminal state. Diagnostic request has no accepted-check capability; baseline request must be bound to that same pair's newly accepted check and actual FINAL. No old request may authenticate under v11.
| Accepted diagnostic custody | `authenticateLeanRetryAcceptedJoinV10` (around 446), v10 predecessor `inspectLeanTwentySixPredecessorV10` (around 820), accepted-closure path noted in `265-16-V10-AUDIT-DEDUP-REPAIR-v1.md` | Extract a narrowly typed v11 accepted-closure join/adapter. Each baseline-request, predecessor, and carry consumer should authenticate the accepted closure once, deriving check root/bytes root, source/allocation roots, HEAD, ordinal, accepted/final flags, reader-close and charge counts from that closure. Keep every existing equality check; reject null/nonaccepted/nonFINAL/mismatched metadata. No cache and no second full `authenticateLeanSupervisorDiagnosticCheck` call beside closure auth. Leave v8/v9/v10 behavior unchanged.
| Predecessor and historical carry | `inspectLeanTwentySixPredecessorV10` and `authenticateLeanTwentySixHistoricalCustodyV10`/pins in `scripts/lib/v1-38-lean-correction-retained.ts` (around 653-704); v10 audit-dedup repair note | Create a v11-specific finite source-only custody snapshot over already-consumed v10 accepted diagnostic + baseline terminal-only evidence, then carry each new pair's closed outcome into the next pair's predecessor whether accepted, failed, or refused. Pin exact files/roots, validate any accepted check + closure joins and terminal-only evidence, and emit non-authorizing accounting metadata only (all 32 historical charges plus every new cost/file carried). Do not expose old acceptance as v11 authority. Do not read Strategy/private payload, invoke old ordinary reader, or scan broad history. Include explicit absent-destination checks for both fresh ordinals and stores.
| Terminal-only verification | retained `verifyLeanRetryTerminalOnlyV8` and v10-specific `verifyLeanTwentySixBaselineTerminalOnlyV10` (around 437, 475); runner `verify-terminal` dispatch | Add separate v11 diagnostic and baseline terminal-only verification paths, each bound to exact v11 request/allocation/source/HEAD and unique terminal. For missing entry use the pre-entry terminal-only path; for an actual entry with no result, validate entry/terminal and admission markers without manufacturing a result-reader input. A baseline can be admitted only after a new accepted diagnostic closure and actual FINAL; a terminal-only baseline outcome cannot count as success/acceptance.
| Route lifecycle | runner prepare/run/verify dispatch; retained `verifyLeanCorrectionRetained`; same-process capacity gate | Wire only new v11 identities. Preserve fresh real 0700 store, immutable allocation committed before unique MAIN entry, per-charge SAME-PROCESS capacity, source+HEAD hold until terminal and one appropriate verification. Existing v10 resource constants and admission semantics remain unchanged. No concurrent heavy work, commit, or source edits during hold.

## Test analogs and required regression coverage

- `scripts/run-v1-38-lean-correction.test.ts`: CLI grammar, exact request path, malformed mode/route and required `--request` analogs.
- `scripts/lib/v1-38-lean-correction-retained.test.ts`: terminal-only custody and no-result/no-check guards; use focused fixtures, not consumed ordinary readers.
- `scripts/run-v1-38-lean-host-stage-v8.test.ts`: closure authentication and rejected accepted-check/closure joins; existing test demonstrates forbidding both old readers where a closure-only result is intended.
- `scripts/run-v1-38-lean-correction.test.ts` plus v10 audit-dedup repair focused regression: instrument one full accepted closure audit per consumer and prove no duplicate full check audit/no caching. Preserve v8/v9/legacy dispatch behavior.
- Add source-bound route tests for unique v11-1/v11-2 paths, distinct immutable allocations, spent-destination rejection, exact 32-charge carry, full 108M accounting, unchanged memory/disk/Match caps, and source/HEAD mismatch rejection. Synthetic fixtures establish guard behavior only, never empirical fit or acceptance.

## Critical pitfalls / stop conditions

1. **Do not widen v10 in place.** Its extension encodes the prior 26-hour approval and one attempt; changing those bytes/constants would invalidate closed allocation/history authority.
2. **Do not use ordinary readers to rebuild consumed history.** The accepted v10 diagnostic has already been fully checked; the failed/stopped v10 baseline requires terminal-only verification only. Never fabricate a result or invoke a full retained result reader.
3. **Avoid redundant full audits.** Accepted closure derivation already fully audits its persisted diagnostic check. Each consumer should reuse derived fields locally for that call; do not add process-wide/global cache or skip byte custody.
4. **Pair 2 is independently approved, not conditional on pair 1 success.** After pair 1 reaches a closed outcome, account for its terminal/cost/file carry; the next unused distinct pair may proceed even if pair 1's diagnostic was refused or failed. Within each pair, its baseline remains conditional on that pair's own accepted diagnostic and actual FINAL. Two unsuccessful pairs or insufficient remaining time ends honestly.
5. **No hidden cap drift.** Current actual resource totals/peaks remain unknown where not measured; do not claim full 36-cell feasibility, RSS reduction, cause attribution, or phase/league/freeze/formation/holdout/public/counting/production completion.

## Confidence

| Area | Confidence | Basis |
|---|---|---|
| Approval and accounting constraints | HIGH | Direct approval records and current `.planning/STATE.md` |
| Route/plumbing boundaries | HIGH | Exact current TypeScript mode, runner, retained-reader, and shell dispatch inspected |
| Minimal custody design | MEDIUM | Derived from existing v10 audit-dedup and terminal-only patterns; exact v11 schema/path bytes remain implementation decisions for the checked plan |

## Sources

- `.planning/STATE.md` (current top-of-file authority/status)
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-PAIR-APPROVAL-20261007.md`
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-TWO-PAIR-TIME-APPROVAL-20261007.md`
- `.planning/phases/265-serious-current-rules-league-and-development-red-team/265-16-V10-AUDIT-DEDUP-REPAIR-v1.md`
- `packages/strategy-lab/src/league/lean-experiment.ts`
- `scripts/run-v1-38-lean-correction.ts` and `.sh`
- `scripts/lib/v1-38-lean-correction-retained.ts`
- Focused test analogs listed above
