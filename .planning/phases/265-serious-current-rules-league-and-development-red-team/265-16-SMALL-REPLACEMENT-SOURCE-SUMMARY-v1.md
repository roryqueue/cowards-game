# Phase 265 Plan 16 Source Summary — Startup Correction

Source-only implementation completed in two commits. The private-probe route now carries a non-serializable, ordered startup grant through factory → planner → session and selects the existing V8 startup supervisor only for the authenticated probe binding. The prospective v2 runner branch defines a one-case ordinal-0 allocation joined to the authenticated prior-v1 failure and its measured retained bytes; it is not an admission to run.

## Commits

- `5ee4e20d` — `fix(265-16): route private probes through V8 startup`
- `0b617ec9` — `fix(265-16): bind v2 retry to prior failure cost`

## Verification

- `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-probe.test.ts` — PASS, 8 tests.
- `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts -t 'private probe|non-Match probe branch|ordered claim'` — PASS, 15 tests; 249 skipped by filter.
- The unfiltered four-suite command completed 263/264 tests. The one failure is the planner cleanup-throws assertion `does not issue diagnostics from pre-issuance accounting when cleanup throws`; it is unrelated to the v2 branch and remains NOT PASS (not waived).
- Scoped strict TypeScript command from the plan completed with 11 diagnostics. The pre-edit baseline was captured as 13 diagnostics, but the diagnostic identity transcript was not retained, so no identity-level equality claim is made. During this work, two introduced errors were identified and corrected: probe-origin metadata no longer enters the ordinary Match observer, and the added planner fixture now uses branded roots. Remaining diagnostics are recorded as inherited/unresolved, not a clean typecheck.
- `git diff --check` — PASS for the final source changes.

## Bounded prior-v1 join

The v2 carry authenticator reads only the exact known v1 allocation, artifact, seven-file private store inventory, one debit row, and the identified allocation commit. It verifies the fixed raw hashes and canonical roots, the failed `system_failure` outcome, ordinal-0 debit/request/input joins, commit parent and committed artifact bytes, and observed allocated blocks. The measured carry is 32,768 allocated bytes including the old store and canonical allocation artifact; the debit is 436 bytes at offset 0. Missing or mismatched values fail closed. The old result remains a failure with `cleanupComplete: false`; its cause remains unknown.

## Scope and limitations

No prepare/entry/verify CLI, actual allocation, new private store, ledger, provider, container, Strategy, Match, runtime, or empirical reader was invoked. No old evidence was changed. Existing v1 four-case semantics and result schema remain intact; v2 is one case only. The guest/startup/host ceilings remain 1000/2500/5000 ms, with existing 600,000 ms match ceiling and resource limits unchanged. This source work establishes neither runtime feasibility nor LEAG, baseline, freeze, phase completion, or counted/production credit. Runtime admission remains closed.

## TDD chronology

No RED/GREEN claim: the focused source regression tests were run after implementation. The known unfiltered planner test failure is reported as NOT PASS above.
