---
status: diagnosed
trigger: "Plan188 preflight-v6 over source 4c5b6700 completed in approximately 5.5 seconds as non_pass/probe_failed, with zero Matches, no marker, and no authorization; seven review categories otherwise passed."
created: 2026-09-08
updated: 2026-09-09T23:15:00-04:00
---

# Phase 262 preflight probe failure

## Symptoms

- Expected: the bounded, non-consuming container preflight completes successfully without running Matches.
- Actual: preflight-v6 terminated after approximately 5.5 seconds with `non_pass/probe_failed`.
- Error: canonical output intentionally retained only the bounded failure classification.
- Timeline: observed in Plan 188 over source `4c5b6700`.
- Reproduction: diagnose through a separate safe, non-Match instrumentation path; do not consume the one authorized fresh preflight.

## Current Focus

- hypothesis: confirmed — Plan190 reached `evaluateLeanContainerPreflight`, which rejected otherwise valid samples as `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE` because per-method Node subprocess startup dominates each call and the frozen worst-case projection exceeds both deadlines
- test: one uniquely named, separate non-Match diagnostic through the exact source/runtime path with only injected session identity and evaluator observation
- expecting: satisfied — all 12 samples were successful and both sessions cleaned up, then the evaluator emitted exactly `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE`; the recomputed 228,191 ms cell and 5,476,584 ms run projections exceed 45,000 ms and 900,000 ms
- next_action: return diagnose-only root cause and recommend a narrow runtime repair that amortizes guest startup while preserving the container boundary, method timeouts, frozen schedule, and all other bounds
- fault_tree:
  - OR: guest warm/probe evaluation returned non-ok
  - OR: container/session lifecycle or throughput exceeded a frozen bound
  - OR: aggregate sample shape/value failed evaluator validation
  - OR: evaluator rejected a valid aggregate because source/runtime identity did not match
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

- timestamp: 2026-09-08T20:58:00-04:00
  checked: Plan190 artifact, summary, exact source `d0193911`, writer classification, and evaluator control flow
  found: Plan190 persisted `evaluation_refused` after 11.46 seconds; that reason is emitted only for otherwise-unmapped `LEAN_CONTAINER_PREFLIGHT_*` errors. In this path Docker, image, adapter, fixture, probe, session, and cleanup failures map to other public reasons; the evaluator's remaining candidate errors are version, sample drift, observation missing, and infeasible projection.
  implication: because the run lasted long enough for the two-fixture sample loop and the exact environment/source identity passed independent review, `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE` is the leading falsifiable hypothesis; a bounded aggregate diagnostic can distinguish it without a Match or canonical artifact writer.

- timestamp: 2026-09-08T21:01:00-04:00
  checked: first diagnostic command setup
  found: module instantiation failed before execution because `createLeanContainerMatchSession` was imported from the runner rather than its defining library; Docker showed no owned containers afterward, tracked effects were limited to this debug record, and all 36 locks remained.
  implication: no diagnostic container, fixture evaluation, canonical preflight, or Match was invoked; correct the import and perform the authorized diagnostic attempt.

- timestamp: 2026-09-08T21:05:00-04:00
  checked: uniquely named diagnostic launched with `node --input-type=module`
  found: session startup failed because the diagnostic launcher's inherited ESM mode made `STREAM_WORKER_SOURCE` evaluate without CommonJS `require`; the diagnostic container was removed, no aggregate reached the evaluator, no repository effect was created, and all 36 locks remained.
  implication: this is a diagnostic-launcher mismatch, not evidence about the canonical Plan190 failure. Match the canonical CommonJS parent mode before testing the evaluator hypothesis.

- timestamp: 2026-09-08T20:57:47-04:00
  checked: one uniquely named CommonJS-mode non-Match diagnostic over the exact Plan189 runtime and evaluator
  found: all 12 measured calls returned ok and both lifecycle samples cleaned up. Select-activation latency was 120.419041-497.194717 ms (maximum 497.194717 ms); SoldierBrain latency was 115.821142-421.485917 ms (maximum 421.485917 ms); lifecycle maximum was 989.078735 ms. The evaluator emitted exactly `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE`.
  implication: probe correctness, cleanup, sample shape, observation coverage, Docker version, image identity, adapter identity, and controls all passed; rejection is exclusively the frozen deadline projection.

- timestamp: 2026-09-08T20:57:47-04:00
  checked: independent recomputation using the evaluator formula and observed maxima
  found: `ceil(5000 + 989.078735 + 2 * (20 * 497.194717 + 240 * 421.485917))` is 228,191 ms per cell; multiplied by 24 it is 5,476,584 ms per run. These are 5.07 times the 45,000 ms cell deadline and 6.09 times the 900,000 ms outer deadline.
  implication: the evaluator correctly refuses the measured implementation under unchanged frozen bounds; changing only the public classification or thresholds would hide rather than repair the cause.

- timestamp: 2026-09-08T20:57:47-04:00
  checked: container-session broker execution mechanism and post-diagnostic state
  found: the Docker stream is persistent, but `BROKER_SOURCE` calls `spawnSync(process.execPath, ...)` for every Strategy method request, paying a fresh Node process startup for every one of the projected 520 calls per cell. No owned container remained, no canonical writer or selector ran, no Match or marker was created, repository effects were limited to this debug record, and all 36 locks remained.
  implication: the direct mechanism behind infeasibility is per-method guest-process launch overhead inside the otherwise persistent Match-scoped container.

- timestamp: 2026-09-08T20:57:47-04:00
  checked: final zero-effect inventory after diagnosis
  found: Docker reported no container carrying the `v1.38-lean-owner` label; authorization-v8, invocation-v8, terminal-v8, adjudication-v8, and eligibility-v8 remained absent; Git showed only this debug record as tracked-modified; lock count remained exactly 36.
  implication: diagnosis stayed within the authorized non-consuming path and did not start or authorize any Match work.

- timestamp: 2026-09-08T12:00:00-04:00
  checked: canonical Plan188 outputs and source search
  found: preflight-v6 records source 4c5b6700, exact non_pass/probe_failed, one preflight invocation, zero Match invocations, no authorization; implementation entry points are scripts/run-v1-38-lean-runner-feasibility.ts and scripts/lib/v1-38-lean-container-match-session.ts
  implication: the diagnostic can remain entirely inside the non-consuming container/session probe boundary

- timestamp: 2026-09-08T12:00:00-04:00
  checked: failure classification mapping
  found: scripts/check-v1-38-lean-admission.ts maps LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED and every LEAN_CONTAINER_SESSION_* code to the single public probe_failed reason
  implication: the bounded artifact deliberately hides the underlying session failure, so the root cause must be recovered from isolated instrumentation or direct protocol inspection

- timestamp: 2026-09-08T19:31:16-04:00
  checked: exact source 4c5b6700 preflight and session implementations
  found: preflight creates a real session and immediately performs a warm adapter.execute for each method; any thrown LEAN_CONTAINER_SESSION_* error is collapsed to probe_failed by the writer, while a non-ok guest result is explicitly rethrown as LEAN_CONTAINER_PREFLIGHT_PROBE_FAILED
  implication: failure occurred no later than the first warm/probe request, consistent with the approximately 5.5-second runtime

- timestamp: 2026-09-08T19:31:16-04:00
  checked: persistent-stream tests at exact source 4c5b6700
  found: every session test injects a fake streamFactory; no test instantiates defaultStreamFactory, runs STREAM_WORKER_SOURCE, starts BROKER_SOURCE, or crosses a real docker exec stream
  implication: the production-only worker/broker integration is an untested boundary and is the highest-priority fault-tree branch

- timestamp: 2026-09-08T19:38:00-04:00
  checked: one bounded real default-session diagnostic using a unique non-Match identity
  found: session-open threw TypeError LEAN_CONTAINER_SESSION_NAME_CHECK_FAILED after 481.622 ms; no container was created and no request, fixture method, preflight selector, Match selector, or Match ran
  implication: the failure precedes worker creation, broker startup, framing, and Strategy execution; the default worker/broker hypothesis is falsified for the observed failure path

- timestamp: 2026-09-08T19:42:00-04:00
  checked: bounded direct observation of the exact initial docker inspect command for the diagnostic identity
  found: Docker returned status 1, signal null, no transport error, stdout one newline byte (base64 Cg==), and stderr `error: no such object: <exact-name>\n` in lowercase
  implication: the target is demonstrably absent, but exactAbsent requires zero stdout bytes and uppercase `Error: No such object: <exact-name>\n`, so it deterministically returns false

- timestamp: 2026-09-08T19:42:00-04:00
  checked: causal control flow and failure-code projection at exact source 4c5b6700
  found: exactAbsent false makes inspectOwner return unknown; createLeanContainerMatchSession then throws LEAN_CONTAINER_SESSION_NAME_CHECK_FAILED before Docker create; classifyLeanContainerPreflightFailure maps every LEAN_CONTAINER_SESSION_* message to probe_failed
  implication: this fully explains the committed non_pass/probe_failed artifact with zero Matches, no marker, and no authorization

## Eliminated

- hypothesis: Plan190 was refused because a fixture method returned a player/runtime violation or malformed response
  evidence: all 12 observed samples had `ok: true`, and the evaluator was reached with complete sample coverage
  timestamp: 2026-09-08T20:57:47-04:00

- hypothesis: Plan190 was refused because lifecycle cleanup was incomplete
  evidence: both diagnostic lifecycle samples reported cleanup complete and no owned container remained after the run
  timestamp: 2026-09-08T20:57:47-04:00

- hypothesis: Plan190 was refused because of Docker version, image, adapter, controls, sample-shape, or observation-coverage drift
  evidence: `evaluateLeanContainerPreflight` passed all preceding guards and threw the later, exact code `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE`
  timestamp: 2026-09-08T20:57:47-04:00

- hypothesis: the default Worker/BROKER persistent stream fails during startup, framing, or first method execution
  evidence: the real diagnostic failed in the initial name/absence inspection before container create, streamFactory invocation, broker startup, or adapter.execute
  timestamp: 2026-09-08T19:38:00-04:00

- hypothesis: starter fixture output or preflight probe input produces a Strategy violation
  evidence: no Strategy request executed; session creation stopped at the initial absent-name gate
  timestamp: 2026-09-08T19:38:00-04:00

## Resolution

- root_cause: The prior Docker-absence defect is repaired. Plan190's new `evaluation_refused` is the evaluator's exact `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE` decision. Although the Docker exec stream is persistent, `BROKER_SOURCE` in `scripts/lib/v1-38-lean-container-match-session.ts` starts a fresh Node subprocess with `spawnSync(process.execPath, ...)` for every Strategy method request. Observed method maxima of 497.194717 ms for selectActivations and 421.485917 ms for SoldierBrain, plus 989.078735 ms lifecycle, project through the frozen two-side 20/240 ceilings to 228,191 ms per cell and 5,476,584 ms for 24 cells, exceeding the unchanged 45,000 ms and 900,000 ms deadlines. The public writer correctly collapses this exact evaluator code to `evaluation_refused`.
- fix: Not applied in diagnose-only mode. Narrow repair direction: keep one Match-scoped digest-pinned container and the current fail-closed host supervision, but amortize guest startup by replacing the broker's per-method `spawnSync(node, harness)` with a persistent per-fixture guest execution channel inside that container (or an equivalently measured contained mechanism). Preserve exact request correlation, JSON/byte validation, deterministic source identity, method timeout/poison-and-remove behavior, cleanup proof, the 20/240 ceilings, and both frozen deadlines. Add a real-boundary regression proving bounded aggregate throughput before authorizing another preflight; do not raise deadlines or weaken the evaluator.
- verification: Confirmed by one uniquely named non-Match diagnostic using exact source/runtime/evaluator behavior: 12/12 calls succeeded, 2/2 sessions cleaned up, evaluator code was exactly `LEAN_CONTAINER_PREFLIGHT_INFEASIBLE`, no owned container remained, no canonical writer/live selector/Match/marker ran, and all 36 locks remained.
- files_changed: []

## Plan 262-199 actual-fixture stage diagnostic-v4 — 2026-09-10

- checked: one exact-image, exact-controls, actual-public-fixture stage diagnostic over Plan197 source `ebb2be95310b0371d00c472519e4fb5a86ce6b77`, consuming attempt 7 of 10
- found: the diagnostic traversed its owned container path once but the new v13 writer rejected the bounded in-memory result before exclusive persistence with `LEAN_ACTUAL_FIXTURE_STAGE_DIAGNOSTIC_V4_INVALID`
- diagnosed implementation defect: the diagnostic increments `requestCounts.attempted` before `adapter.execute`, but appends its aggregate timing only after `adapter.execute` returns; when the adapter throws, the writer produces fewer timing observations than attempts while the validator incorrectly requires equality
- effects: the diagnostic-v4 destination remains absent; zero preflight entry points and zero Matches were invoked; no authority or downstream effect was created; no owned container remains; all 36 successor locks remain
- implication: attempt 7 is consumed and must not be retried. A fresh additive successor may repair the diagnostic projection and use attempt 8 under the existing bounded authorization; three attempts remain.

## Plan 262-193 Worker lifecycle diagnostic — 2026-09-09

- checked: one authorized exact-image/exact-controls broker-only lifecycle diagnostic over committed source `04b2eee905cf84ba1440a3fb266e27ca07397f0c`
- found: the immutable aggregate artifact is `docker_unavailable` at canonical root `sha256:e849dd83d14888f2361ec830bf139ef2cddd7f67fd615aad1bfcd1fe4e2587a4`; it recorded zero successful broker requests, cleanup complete, zero preflight invocations, zero Match invocations, and all authority false
- isolated cause: the diagnostic used bare `docker inspect <name>`, for which Docker 29.4 returned status 1, stdout `[]\n`, and stderr `error: no such object: <name>\n`; its exact absence predicate intentionally accepted only the formatted-inspect tuples already used by the repaired session, so it refused before container creation
- implication: the Worker lifecycle repair itself remains unit-proven, but this Plan193 diagnostic is terminally non-passing and cannot admit Plan194. A fresh additive successor must use the session's exact formatted absence check before spending another broker-only diagnostic or preflight attempt. The committed diagnostic must not be rewritten or retried.

## Plan 262-195 exact-tuple repair and diagnostic-v2 — 2026-09-09

- checked: TDD-protected admission of only status 1, null signal, no transport error, stdout exactly `[]\n`, and uppercase requested-name absent-object stderr exactly terminated by LF, while retaining the two historical exact tuples
- found: focused admission and broker tests passed, TypeScript passed, and source-only v11 custody authenticated committed source `4b41459ddff8be9dde86840425e6cea10e4dc6a7` with all 36 successor locks and every fresh v11 effect absent
- checked: one fresh exact-image/exact-controls broker-only diagnostic-v2, bounded attempt 3 of 10
- found: the immutable aggregate disposition is `docker_unavailable`; zero broker requests succeeded, cleanup is complete, preflight invocations are zero, Match invocations are zero, and every authority bit is false
- implication: Plan196 remains ineligible on this lineage and no preflight or Match may run. The committed diagnostic intentionally does not persist raw Docker output, so any next repair must use a separately bounded non-consuming diagnostic path and must preserve both diagnostic denials byte-for-byte.

## Plan 262-197 bounded absence diagnosis — 2026-09-10

- checked: one read-only absent-name inspect over source `d4cce642`, recorded as diagnostic/repair attempt 4 of 10 and not as diagnostic-v3 or reusable evidence
- found: Docker returned status 1, signal null, no transport error, stdout exactly `[]\n`, and stderr exactly `error: no such object: <requested-name>\n`; the requested container name was represented only by this privacy-safe placeholder
- effects: no container was created, zero preflights ran, zero Matches ran, no canonical artifact or authority was produced, and all authority remains false
- implication: the observed lowercase Docker 29.4 tuple is outside the current closed allowlist; admit only these exact bytes additively, preserve diagnostic-v1 and diagnostic-v2 as immutable denials, and spend a separate attempt only after committed source custody passes

## Plan 262-197 Worker lifecycle diagnostic-v3 — 2026-09-10

- checked: one exact-image, exact-controls broker-only lifecycle diagnostic over committed v12 source `ebb2be95310b0371d00c472519e4fb5a86ce6b77`, recorded as diagnostic/repair attempt 5 of 10
- found: the immutable privacy-safe aggregate disposition is `pass`; one legacy and one v1.17 request both completed successfully, the broker stream closed cleanly after the request-bound completion, port-close, and natural Worker-exit lifecycle, and cleanup completed
- effects: exactly zero preflights and zero Matches ran, no authorization or downstream effect was created, all authority remains false, no owned container remained, and exactly 36 successor locks remained
- implication: Plan 262-198 is eligible to perform its separately bounded preflight-v11; diagnostic-v1 and diagnostic-v2 remain immutable `docker_unavailable` denials and this diagnostic grants no Match authority by itself
