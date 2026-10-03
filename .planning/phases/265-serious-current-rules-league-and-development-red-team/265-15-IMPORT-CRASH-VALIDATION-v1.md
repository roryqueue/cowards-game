# Import/crash repair validation checkpoint

Status: **gaps found**, source-only. This is not Plan 265-15 completion, empirical admission, a capacity receipt or phase verification.

## Passing evidence

- Genuine synthetic 48-cell historical assessment/default-versus-bounded equality and two-candidate admission-root equality: author and iteration-2 focused regressions passed; independent fixture review has zero findings.
- Iteration-2 focused four-file regressions: 5 passed; full inert lean-runner suite: 12 passed, as recorded in its fix report.
- Root strategy-lab project typecheck, scoped strict TypeScript for the changed runners/assessment/observations, shell syntax and whitespace checks passed on source `817ab595`.
- Root lab, factory and serious-league source-boundary scans each reported zero violations across 1,362 files.
- The root reduced redundant lower-level parser repetitions from 48 to three distinct multi-chunk streams because a separate genuine fixture covers the full 48-cell assessment. Its focused test passed: 1 passed, 5 filtered, total 2.90 seconds. Ordinary/bounded root equality and insufficient preparse-capacity denial remain covered. The unchanged >8 MiB aggregate/oversized-record test was not weakened or removed.

## Honest nonpasses and remaining work

Two broad seven-file, single-worker runs were interrupted (exit 143); neither is a passing suite. An additional verbose run excluded the unchanged >8 MiB legacy stress test and was interrupted after the independent review identified a remaining production blocker. That run observed a failing obsolete mock test, `lean import authenticates one selected assessment for two candidate closures without changing legacy roots`, with `FACTORY_ASSESSMENT_IMPORT_ATTEMPT_COUNT`; its incomplete fixture no longer satisfies the new 48-attempt preflight. The real full-48 historical verifier and genuine two-candidate test both passed in that same run. Update the obsolete mock honestly and retain a real verifier-call-count assertion, rather than bypassing the preflight or deleting substantive coverage.

The v3 source review identifies a shared repository-reader defect: it loads a whole file before checking its byte cap. Fix it with a genuinely bounded file read, cover oversized files and preserve legitimate legacy reads. Prefer directly relevant regressions over another repeat of unrelated expensive historical pipeline cases.

Historical cache/core peak usage is still unestablished. The approved time-accounting amendment does not approve the separately proposed retained-disk accounting change. Preparation remains closed; no empirical route or ordinary retained reader was invoked by this repair checkpoint. Old failed artifacts and reservations remain unchanged.
