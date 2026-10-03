---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07-task-2-host-receipt-runtime"
subsystem: private-runtime
tags: [prospective-v3, host-response-receipt, opaque-authority, vitest, source-only]
requires:
  - phase: "265-07-task-1"
    provides: "Exact V3 policy/amendment/allocation and version-aware admission"
provides:
  - "Durable-start-bound one-use V3 host receipt authority and both actual stream modes"
  - "Main/response identity wiring, explicit V3 selectors, and source-only regression coverage"
affects: [265-07-task-3-independent-review-and-fixed-source-gate]
tech-stack:
  added: []
  patterns: [process-local-WeakMap-capability, durable-charge-before-issuance, separate-host-and-broker-clocks]
key-files:
  created: [scripts/lib/v1-38-league-host-receipt.ts, .planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-HOST-RECEIPT-RUNTIME-SUMMARY-v1.md]
  modified: [scripts/lib/v1-38-league-prospective-lifetime.ts, scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-container-match-session.test.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts, scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/run-v1-38-serious-league.ts, scripts/run-v1-38-serious-league.test.ts, scripts/lib/v1-38-league-response-runtime.ts, scripts/lib/v1-38-league-response-runtime.test.ts, .github/workflows/ci.yml]
key-decisions:
  - "Only a claimed V3 authority changes the parent stream.exchange response wait to 5000; no scalar grant is accepted."
  - "Preserve the selected legacy guest/broker 1000 ms and Match 600000 ms, plus the alternative ABI's actual signed 50 ms method and existing startup/cancellation aggregate."
  - "Preserve existing authenticated D system_failure/TIMEOUT and ambiguous receipt classification instead of changing the inactive ABI's meaning."
  - "Injected-fixture authority requires explicit mock constructor/control seams and cannot reach default live constructors."
requirements-completed: []
duration: "about 45 minutes"
completed: 2026-10-02
status: complete
---

# Phase 265 Plan 07 Task 2: Host-Receipt Runtime Summary

An opaque, durable-start-bound V3 capability now extends only the private parent receipt wait to 5,000 ms through factory, planner, and the real persistent session, with mock verification of both actual adapter paths.

## Scope and Outcome

Task 2 is complete as a source-and-mock slice. Task 3 independent review, the full fixed-source eight-command gate, and scoped verification remain the parent orchestrator's responsibility. This is not completion of Plan 07, Phase 265, any LEAG-01–09 requirement, empirical league evidence, or freeze.

The new module exports `ProspectiveLeagueHostReceiptAuthority`, `issueProspectiveLeagueHostReceiptAuthority`, and `claimProspectiveLeagueHostReceiptAuthority`. Its frozen, non-serializable WeakMap capability binds the exact admitted V3 allocation, amendment/policy, current implementation/source closure, reopened retained charge, Match, seat, attempt, complete runtime/factory identity, container, and owner. Issuance reopens the immutable cell/response record rather than trusting a caller's durability assertion. Response issuance also reopens and joins the retained parent production start. Each factory→planner→session layer claims once, in order; each provider receives a separate handle.

Main cell issuance follows the existing durable cell start and graph retention. Response issuance follows each retained response-match start and preserves separate measured-attempt and opponent charge roots across score, independence_left, independence_right, both seats, and equal-source self-play. Existing invocation charging, durable-before-return retention, poisoning, finite trusted failure origins, frame/correlation checks, and cleanup remain in place.

The lifetime bridge explicitly admits V2 or V3 while retaining the prior V2 handle/claim semantics and 600,000 ms value. V1 does not acquire these capabilities. Preparation explicitly selects V3; existing version-aware admission covers preflight/run/capacity/reservation, and main/response retained-reader conditions now explicitly include V3 with the existing current-source and provider joins. The source inventory semantics are unchanged and cover the new module.

Only the parent `stream.exchange` response timeout becomes 5,000 after the session claim. The legacy serialized broker request stays 1,000. V1.17's serialized request remains startup + its signed method budget + its existing cancellation grace; method/startup/cancellation fields are unchanged. Host wait expiry stays transport/system failure, never inferred Strategy timeout. The legacy planner retains its existing incomplete system-failure envelope and trusted `stream_exchange/wait_timeout`; the alternative lane retains the TRANSPORT_CRASH observation and may close as AMBIGUOUS_ATTRIBUTION when receipt accounting cannot be proven.

Public/default, scalar, copied/forged, crossed, stale empirical-source, reused, benchmark, diagnostic, and observer paths cannot obtain the allowance. Empirical authority forbids injected constructors/transports; admitted injected-fixture authority requires explicit mock constructor/control seams and cannot reach default live constructors. Test fixtures do not confer empirical authority.

CI adds the missing lean-session/planner suites only to the existing Phase 265 Vitest command and includes every touched runtime source/test plus the new authority module in its existing strict command. No CI command or test coverage was removed.

## TDD and Verification

- RED: `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-lean-container-match-session.test.ts -t 'host response receipt'` exited 1 because the planned authority module did not yet exist. Test-only commit `0b45e91f` preceded implementation. This RED was an absent-module/API gate, not a completed behavioral-test run.
- Final GREEN Task 2 command below: **5 files passed; 49 tests passed, 368 skipped; 108.54 s; exit 0**. The skipped existing tests were not run by this phrase-filtered source-only slice.
- Exact former feasibility fixture-root confirmation: **1 passed, 74 skipped; exit 0**. Both mapped input roots are asserted in the owned planner test.
- Source closure: `./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'prospective lifetime source closure inventories each changed production byte'` — **1 passed, 142 skipped; exit 0**.
- Exact augmented Task 3 touched-script strict command below — **exit 0**, including the final fixture mapping and new authority module.
- `git diff --check` passed. No tracked file deletion, new dependency, or new production stub was introduced.

```sh
./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-response-runtime.test.ts -t 'host response receipt'
```

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/check-v1-38-serious-league-boundaries.ts scripts/check-v1-38-serious-league-boundaries.test.ts scripts/lib/v1-38-league-host-receipt.ts scripts/lib/v1-38-league-prospective-lifetime.ts scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts
```

Coverage includes actual legacy execute/runMethod and executeV117/runMethod with a mocked native Worker/Atomics clock, late receipt acceptance/ambiguity under existing rules, exact 5,000 wait expiry, unchanged signed request fields, malformed/missing/crossed frame poisoning, cleanup, authority issuance/forgery/reuse/full-binding negatives, default-fixture isolation, charge-before-dispatch, main two-provider identities, all response purposes/seats/self-play, and V2 preservation.

## Deviations and Bounded Corrections

### Source-faithful inactive ABI correction (parent approved)

The Task 2 behavior text described V1.17 as startup + 1,000 ms method + cancellation. Its actual frozen raw invocation vector is **50 ms** (`packages/spec/src/runtime-abi-v1-17.ts:19`) with **100 ms** cancellation (`:64`). The session derives its broker aggregate from those signed guest fields (`scripts/lib/v1-38-lean-container-match-session.ts:316–319`). There is no natural API here for changing the frozen vector to 1,000. No bound was changed.

Likewise, authenticated D has pre-existing `system_failure/TIMEOUT` semantics (`packages/runtime-js/src/abi-bridge.ts:484`), and the observation classifier still requires receipt grace within the existing cancellation allowance (`packages/runtime-js/src/candidate-subprocess-observation.ts:200–242`). The test accepts the valid 51 ms D receipt as TIMEOUT; a receipt received at 1,200 ms retains AMBIGUOUS_ATTRIBUTION rather than extending guest/cancellation authority. Legacy selected production remains 1,000 ms. The parent explicitly directed preservation of this actual 50 ms vector and classification and owns reconciling the inactive-ABI plan wording before Task 3 review.

### [Rule 3 — Blocking] Owned test fixtures no longer pull unrelated strict failures into CI

Adding the previously omitted tests to strict CI exposed pre-existing transitive errors. The parent approved equivalent directly constructed/admitted fixtures while preserving assertions and real runtime paths; no unowned production file was edited or strict flag weakened.

Dependency paths were `lean-container-match-session.test.ts` → `run-v1-38-lean-runner-feasibility.ts` → lean admission/feasibility modules, and `planner-supervised-runtime.test.ts` → `feasibility-protocol.ts` → planner corpus/missions. A read-only TypeScript Compiler API diagnostic using the original two test files from `1d98b1d6` corroborated these errors:

| Unowned file | Exact locations and diagnostics |
|---|---|
| `packages/strategy-lab/src/feasibility-protocol.ts` | 52:139 TS2345: optional objective union fields are not JsonValue |
| `packages/strategy-lab/src/planner/missions.ts` | 52:39, 60:111, 66:131, 68:21, 69:100 TS2322: assigning undefined to SoldierSnapshot |
| `scripts/check-v1-38-lean-admission.ts` | 1186:10, 1340:10, 1525:11 TS2345: possibly undefined ConciseBody; 1311:94 TS2345: Statement/ConciseBody mismatch; 1423:19 TS2345 and 1501:169 TS2339: CallbackBinding/FunctionTarget mismatch; 2634:187 TS2345: artifact-path union mismatch; 3635:3 TS2741: missing plan192History; 3846:34 TS2769: optional artifact bytes; 3967:289 TS2322: boolean in string-only record |
| `scripts/lib/v1-38-lean-runner-feasibility.ts` | 427:18, 428:20, 429:21, 430:19, 431:21, 432:10/58, 433:10/61, 434:16/45, 440:24/41/70, 442:24/63, 445:10/49/100 TS18046: unknown value; 440:90 TS7006: implicit any arena |
| `scripts/run-v1-38-lean-runner-feasibility.ts` | 536:34 TS2769: optional artifact bytes; 670:52 TS2339: missing initialInitiativePlayerId; 1066:119 TS2345: missing record index signature |

The lean test now constructs the same Advanced source and container compilation with the actual Advanced/revision constructors, identical adapter/limits, validates it, and asserts unchanged authored sourceHash; it consumes only compiled artifact bytes, as before. The planner test constructs the same canonical first positive evacuation case and preserves its fixture-to-mission-paths-v2 memory/objective mapping. Its exact former `timing-input` roots are `sha256:629ef6500887e18a66edfe378c0a8dacf08d81e720e499d8e5b79ba2caf814f8` and `sha256:e312a34fb2b75be20a4847d5da07d93513a6bc72236172a854404499eec9f9f3`, confirmed against the former static corpus and asserted by the new test. Existing assertions and actual runtime paths remain.

Owned existing native mocks now set the startup shared-memory cell instead of using an overloaded Atomics.load spy (original lean test 71:67 and planner test 74:67 TS2322 bigint mismatch). Optional artifact bytes are explicitly checked (original lean test 122:22 TS2769). Owned factory mocks supply the required Match/container/owner identity and timing/accounting members instead of relying on incomplete interfaces. No ts-ignore or new cast-based type weakening was used to hide these errors. The unowned errors remain deferred outside this slice; the augmented actual production/test dependency graph passes strict TypeScript.

The final isolation check also requires explicit mock seams for fixture capabilities before constructor/control dispatch, completing the planned synthetic/default boundary mitigation.

## Commits and Handoff

- `0b45e91f` — `test(265-07): add failing host response receipt runtime tests`
- `929023fe` — `feat(265-07): wire prospective host receipt authority through private runtime`

No Task 1 API deficiency remains. No source/test process is running at handoff. The parent owns push, independent review, any bounded review fixes, all eight fixed-source gates, source-level verification, and planning-state updates. STATE/PROJECT/ROADMAP/REQUIREMENTS and the existing 265-07 summary were deliberately not edited.

No actual provider, guest Strategy, Docker/container, model, empirical Match, capacity observation, route/helper mode, empirical allocation publication, or retained empirical verifier was invoked. Only canonical/static construction and injected mock records in cleaned temporary directories were used. Consumed routes/artifacts remain immutable; V11 remains closed process-invalid, holdout unopened, formation absent, and public/counted/production authority absent. Empirical sufficiency of 5,000 ms is unknown.

## Self-Check: PASSED

The new authority module and this scoped summary exist; RED and GREEN commits are present in order; exact-path staging included only the 13 owned runtime/test/CI files; no tracked deletion occurred; tests/types above passed. No required Task 2 production stub or additional unplanned threat surface was found.
