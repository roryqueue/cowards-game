---
phase: 263-legal-planner-and-deterministic-runner-feasibility
plan: "04"
subsystem: strategy-lab-runtime
tags: [canonical-kernel, selected-v119, private-observer, synthetic-only]
requires:
  - phase: 263-01
    provides: Private contracts, immutable corpus and fixed allocation
provides:
  - Canonical public-effect pump with exact private host result binding and rollback
  - Selected ABI-v1.19 container-session host with predispatch charging and lifecycle cleanup
  - Opt-in method-only observer and fixed authenticated benchmark reducer
affects: [263-03, 263-06, 263-07]
tech-stack:
  added: []
  patterns: [closure-owned evidence, opt-in source builder, immutable timing provenance]
key-files:
  created:
    - packages/strategy-lab/src/runtime-bridge.ts
    - packages/strategy-lab/src/runtime-bridge.test.ts
    - scripts/lib/v1-38-planner-supervised-runtime.ts
    - scripts/lib/v1-38-planner-supervised-runtime.test.ts
    - packages/strategy-lab/src/benchmark.ts
    - packages/strategy-lab/src/benchmark.test.ts
    - packages/runtime-js/src/planner-benchmark-observer.test.ts
  modified:
    - scripts/lib/v1-38-lean-container-match-session.ts
    - scripts/lib/v1-38-lean-container-match-session.test.ts
    - packages/runtime-js/src/worker-harness.ts
key-decisions:
  - Keep synthetic transport provenance permanently non-empirical even when its timing calculation passes.
  - Bind harness identity to actual authenticated-wrapper worker bytes, not the pre-wrapper source template.
  - Machine metadata is frozen by the trusted coordinator and bound into host-issued timing evidence; it is not a hardware attestation.
requirements-completed: []
requirements-covered: [FACT-02, PLAN-04, PLAN-06]
duration: 27min
completed: 2026-09-09
status: complete
coverage:
  - id: public-effect-pump
    description: Canonical transition parity and private failure rollback
    requirement: FACT-02
    verification: [{kind: unit, ref: packages/strategy-lab/src/runtime-bridge.test.ts, status: pass}]
    human_judgment: false
  - id: selected-supervisor
    description: Exact selected executor and opt-in owned timing transport
    requirement: PLAN-04
    verification: [{kind: unit, ref: scripts/lib/v1-38-planner-supervised-runtime.test.ts, status: pass}]
    human_judgment: false
  - id: benchmark-protocol
    description: Fixed sample and provenance gate, not an empirical result
    requirement: PLAN-06
    verification: [{kind: unit, ref: packages/strategy-lab/src/benchmark.test.ts, status: pass}]
    human_judgment: false
---

# Phase 263 Plan 04: Canonical Runtime Bridge and Private Timing Summary

The private lab can pump canonical effects through the actual selected ABI-v1.19 container-session executor and evaluate strictly bound method-only observations without changing historical harness behavior or claiming a synthetic empirical pass.

## Task Commits

1. Canonical bridge: RED `25fc7ff1`; GREEN `614838cc`.
2. Selected host/session: RED `c637d196`; GREEN `a903a846`; binding correction `96f35cf3`.
3. Observer/benchmark: RED `35cb83be`; GREEN `5b61bfdf`.

All changes stay within the ten owned implementation/test files. No dependencies, barrels, apps, engine logic, historical evidence, locks, source selectors or public DTOs were changed. Shared STATE/ROADMAP/REQUIREMENTS updates are reserved to the orchestrator, which owns concurrent plan tracking.

## Delivered APIs

- `runCanonicalLabMatch({match, providers})` in `runtime-bridge.ts`: `match` is the exact `MATCH_KERNEL.createMachineV119` input; `providers` is indexed by player ID. `LabSupervisedProvider` exposes immutable identity, `invoke(request, admittedIdentity)`, exact-object `verify(evidence)` and `close()`. No source evaluator is accepted. Every transition comes from `MATCH_KERNEL.stepMatch`; failures return empty transitions and unchanged initial gameplay. The output is explicitly `private_offline`, not a Chronicle certificate.
- `createPlannerSupervisedRuntime(options)` / `closePlannerRuntime(host)`: requires immutable revision, attemptRoot, budgetRoot and fresh Match/container/owner IDs plus exact admitted image. Rebuilds/checks source/artifact admission; invokes `createSelectedCurrentRuntimeFromRevisionV119` with `session.adapter`, timeout1000 and stdout262144. The selected executor owns output/memory normalization. Every dispatch is charged before the call; replay, wrong binding, interruption, deadline, transport failure and cleanup uncertainty stop further dispatch.
- Optional `observerHarness: {source, expectedRoot, machineRoot}`: `source` comes from `buildPlannerBenchmarkObserverHarness()`. `expectedRoot` is raw SHA256 of `buildLeanAuthenticatedHarnessSource(source)`, prefixed `sha256:`. The coordinator must freeze actual machine metadata/root before dispatch. Default host identity likewise hashes actual wrapped default worker bytes.
- `host.timing(runtimeEvidence)` / `host.verifyTiming(timingEvidence)`: timing is accepted only from the owned completion path, with one receipt/close/natural-exit lifecycle, exact invocation/source/executable/input/method/tuple/harness/profile binding, bounded duration and independent2048-byte timing cap. Session strips timing before ordinary result parsing. Host records actual stream-exchange and total executor latency separately.
- `runPlannerBenchmark({provider, commitment, corpus})`: consumes exactly100 warmups then1000 measured calls per method when successful, with fresh input/memory copies, no retries, and early stop on failed/missing observations. Commitment binds corpus/source/executable/harness/profile/budget/attempt/machine roots. `evaluatePlannerBenchmark` additionally takes `observedCommitment`, observations and cleanupComplete, and requires host exact-object issuance. Serialized caller timing is not accepted. Each nearest-rank sample990 must be strictly below5ms.
- Timing from any injected transport/stream is permanently `synthetic_transport`. Reducer may report `protocolPassed:true` for its calculation but always reports `passed:false, empirical:false`. Warmups and failed calls stay charged. Benchmark semantic IDs exclude duration and hardware metadata.

## Verification

- Task1 focused RED failed on absent module; GREEN passed11/11 in1.50s.
- Task2 focused RED failed on absent host; injected session timing RED failed on the expected surplus-field rejection.
- Final selected host plus new private session tests:20/20 passed;51 pre-existing session tests excluded by the synthetic-only execution boundary. Command: `./node_modules/.bin/vitest run --maxWorkers=1 scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts -t 'planner selected|private observer synthetic'` (4.89s).
- Task3 RED: absent reducer/builder. Final combined bridge/benchmark/observer suite:23/23 passed in25.93s. Command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/runtime-bridge.test.ts packages/strategy-lab/src/benchmark.test.ts packages/runtime-js/src/planner-benchmark-observer.test.ts`.
- `./node_modules/.bin/tsc -b packages/strategy-lab`: passed after parallel agent implementation became available.
- Standalone strict NodeNext typecheck of `scripts/lib/v1-38-planner-supervised-runtime.ts` and `packages/runtime-js/src/planner-benchmark-observer.test.ts`: passed using local tsc, `--noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --skipLibCheck --strict --types node --ignoreConfig`.
- `git diff --check`: passed. Stub-marker scan of new implementation files: none. No tracked deletions in plan commits.
- Observer tests parse source without executing it and prove the entire pre-existing worker-harness source file is retained as an exact prefix. Session tests compare the default broker byte string and AST-derived authenticated-wrapper replacement against actual identity calculation.

## Deviations and Corrections

- [Rule3 - Tooling] Root scripts cannot resolve the engine package as a runtime import; host uses the existing source-module convention. The session's erased type import was corrected to the same source path for standalone typechecking. No production export was widened.
- [Rule1 - Binding] Final seam inspection found that broker authentication wraps harness source. Corrected the host hash to actual wrapped worker bytes and froze synthetic provenance/machine binding; separate task2 correction commit `96f35cf3`.
- [Rule1 - Observer] Captured the numeric conversion function alongside the monotonic clock before Strategy import, so guest mutation of ambient Number cannot alter measured duration.
- [Rule3 - Test latency] Initial benchmark tests redundantly rehashed identical large corpus inputs and exceeded5s per test (139s suite). Cached immutable canonical expected-input hashes, retaining corpus admission and every result binding check. Final combined suite is25.93s; no benchmark scientific count, timing region or threshold changed.
- [Scope] Existing session tests include actual guest-source execution via local broker processes. They were intentionally not run because this dispatch allows only synthetic injected supervision/source-shape tests. No live container, emitted candidate source, preflight, Match or benchmark was executed.

## Honest Limitations and Handoff

- No empirical feasibility, hostile-runtime certification, runtime availability, tactical planner success, formation, holdout, factory-scale, counted-play or production claim is made. PLAN-04/PLAN-06 stay globally pending until downstream actual-source validation and reviewed empirical gates.
- Task1's differential Match fixture uses fixed empty selection outputs; canonical board starts cover both geometries and host roundtrip tests cover both methods. Broader deployed planner/nonempty-action and legal-information cases remain downstream tests, not results implied by this fixture.
- The trusted coordinator must provide the reviewed observer builder's exact source, actual captured machine identity and frozen commitment. These bindings are local private evidence, not external attestation. The enclosing60-minute overall deadline and shared allocation are coordinator responsibilities; each host retains120-second lifetime and maximum24800 calls (optionally narrowed).
- Exact-object verification is intentionally in-process. Serialized benchmark observations cannot be re-admitted as genuine host issuance simply by loading JSON; downstream artifact verification must bind the producer's retained result and provenance under the existing private artifact contract.
- No full historical session suite was executed. Default source-byte invariance and new injected transport tests are the completed regression evidence here; live supervision proof remains the separately reviewed gate.

## Threat Flags

| Flag | File | Description |
|---|---|---|
| threat_flag: runtime-observer | worker-harness.ts; lean-container-match-session.ts | Planned opt-in private timing trust boundary; exact owned-channel binding and non-empirical synthetic provenance tested, actual hostile execution unmeasured. |

## Self-Check: PASSED

All ten owned deliverables exist; the seven task/correction commits listed above exist. Final focused tests and typechecks pass. No shared planning state, parallel agent edits, historical route artifacts or36successor locks were modified.
