# Independent check: v10 accepted-audit dedup supplement

**Result: PASS for the proposed bounded source repair; no empirical authority is created.**

## Evidence checked

- `265-16-V10-AUDIT-DEDUP-REPAIR-v1.md`
- `.planning/debug/v10-baseline-precharge-memory.md`
- `authenticateLeanSupervisorDiagnosticCheck` and `deriveLeanRetryClosureV8` / `authenticateLeanRetryClosureV8` in `scripts/lib/v1-38-lean-correction-retained.ts`
- The v10-1 baseline request, predecessor, and terminal-carry consumers in `scripts/run-v1-38-lean-correction.ts`

## Equivalence finding

For the accepted v10-1 route, `authenticateLeanRetryClosureV8("v10-1")` does not merely trust the persisted receipt. It re-derives it and requires exact equality; the accepted derivation calls `authenticateLeanSupervisorDiagnosticCheck`, which performs the full retained accepted-check audit. The resulting authenticated closure carries the fields the three identified v10-1 consumers need: `root`, `checkRoot`, `checkBytesRoot`, `allocationRoot`, `sourceRoot`, `head`, `requestBytesRoot`, `timeboxExtension`, `attemptOrdinal`, `closureClass`, `finalReaderClose`, `acceptedCheckAbsent`, `readerCloseMs`, `cumulativeCharged`, and `currentCharges`.

Accordingly, those consumers can use a single authenticated closure and derive/check the accepted check root and allocation / reader-close values from it. This removes the direct-check-plus-closure duplicate audit pair while retaining the closure's full accepted audit. The request consumer must still compare the request's accepted-check and accepted-reader-close roots against closure fields; the predecessor consumer must retain route, extension, accepted/final, 32 cumulative charges, one current charge, and close-before-`atMs` checks; terminal-carry must retain extension, ordinal, accepted/final/non-absent status, request roots, allocation/source binding, actual reader close and preparation-time ordering, and exact charge checks.

No missing field was found for these equivalence checks. The full validation remains bounded to this exact v10-1 consumer set; this is not evidence that the entire parent audit becomes one pass, nor that the duplicate work caused the earlier SIGKILL.

## Required execution constraints

The supplement is correctly limited to v10-1 and keeps legacy v8/v9 dispatch and behavior unchanged. Preserve source-manifest and request-byte checks, immutable check-byte custody (`checkBytesRoot`), exact allocation/source/HEAD lineage, null/nonaccepted/non-FINAL rejection, reader-close joins, extension/ordinal checks, and all charge/cap guards. Do not replace the full accepted audit with cached state, caller proof, a persistent receipt, or omitted authentication. Keep dual-auth calls on all non-v10 paths.

Before implementation is considered complete, tests should demonstrate both equivalence and rejection: matching accepted closure succeeds; null/missing, refused, absent, non-FINAL, wrong check/check-bytes root, allocation/source/request, extension, ordinal, reader-close, or charge values fail; exact v10-1 consumers use the closure fields; legacy v8/v9 continue their prior dual-auth paths. Exercise existing composed lineage/admission regressions, not only synthetic field fixtures. The plan's review, focused suite, configured type checks, shell syntax, diff/boundary checks, and source-only verification are appropriate gates. No heavy test or empirical retry is authorized by this review.

## Scope / authority

No blocker or warning found in the supplement's stated source-only repair. The terminal-carry verification is not new authorization to prepare, allocate, run, read historical ordinary results, or retry. The root cause remains unproven, and no memory reduction or full-36 feasibility claim follows from this plan check.
