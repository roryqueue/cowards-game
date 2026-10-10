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

## Startup-correction source review follow-up

Commit `4715a3b1` addresses reviewer findings CR01 and CR02. The V8 private-probe broker validator now requires the exact V1.19 request shape including `outputByteLimit: 262144`; its probe binding checks a safe case ordinal from 0 through 3 and the matching ordinal-suffixed execution owner. The session forwards the authority binding's ordinal. The prospective v2 allocation and debit remain ordinal 0. An inert test constructs the request with the actual V1.19 encoder and checks the generated broker predicate; it does not spawn the V8 broker or invoke runtime execution.

The authority regression adds temporary synthetic Git repositories and mode-restricted temporary stores. It exercises the production v1 ordinal-1 admission/debit/ordered claims and the v2 prior-v1 carry authentication, ordinal-0 admission, debit write/fsync, ordered factory/planner/session grant claims, and retained request/result/debit join verifier. The temporary store contains only synthetic allocation, request, entry, and ledger files and is removed by the test. The v1 carry authentication reads only the already identified immutable prior-v1 inputs. These fixtures do not write the canonical allocation/store/ledger or create runtime evidence; no provider, container, Strategy, Match, or actual run route was invoked. Thus the connected source coverage is improved, but it is not evidence of broker execution or physical runtime feasibility.

## Review-fix verification

- `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts -t 'genuine v1 ordinal-1|v2 ordinal-0 debit|actual encoded V1.19 output cap|builds syntactically valid correction broker source'` — PASS, 4 tests; 131 skipped by filter.
- The one unfiltered four-suite regression run completed 266/267 tests. The remaining failure is the existing planner cleanup-throws assertion `does not issue diagnostics from pre-issuance accounting when cleanup throws`; status remains NOT PASS and it is not waived.
- Final scoped strict TypeScript command — 10 diagnostics remain. The prior review-fix test's `SourceFile.parseDiagnostics` typing error was corrected; no clean typecheck is claimed, and no identity-level comparison to the earlier baseline is claimed.
- `git diff --check` — PASS before source commit `4715a3b1`.
