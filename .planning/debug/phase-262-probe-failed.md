---
status: diagnosed
trigger: "Plan188 preflight-v6 over source 4c5b6700 completed in approximately 5.5 seconds as non_pass/probe_failed, with zero Matches, no marker, and no authorization; seven review categories otherwise passed."
created: 2026-09-08
updated: 2026-09-08T19:42:00-04:00
---

# Phase 262 preflight probe failure

## Symptoms

- Expected: the bounded, non-consuming container preflight completes successfully without running Matches.
- Actual: preflight-v6 terminated after approximately 5.5 seconds with `non_pass/probe_failed`.
- Error: canonical output intentionally retained only the bounded failure classification.
- Timeline: observed in Plan 188 over source `4c5b6700`.
- Reproduction: diagnose through a separate safe, non-Match instrumentation path; do not consume the one authorized fresh preflight.

## Current Focus

- hypothesis: confirmed — the hard-coded exact Docker absence predicate rejects the installed Docker 29.4 absent-object response, so preflight cannot create its first session
- test: real diagnostic session plus direct bounded observation of the identical inspect command
- expecting: satisfied — actual status/stdout/stderr differs deterministically from the fabricated unit-test tuple
- next_action: return diagnose-only root cause; production repair and the one fresh preflight remain for the parent workflow
- reasoning_checkpoint:
- tdd_checkpoint:

## Evidence

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

- hypothesis: the default Worker/BROKER persistent stream fails during startup, framing, or first method execution
  evidence: the real diagnostic failed in the initial name/absence inspection before container create, streamFactory invocation, broker startup, or adapter.execute
  timestamp: 2026-09-08T19:38:00-04:00

- hypothesis: starter fixture output or preflight probe input produces a Strategy violation
  evidence: no Strategy request executed; session creation stopped at the initial absent-name gate
  timestamp: 2026-09-08T19:38:00-04:00

## Resolution

- root_cause: At scripts/lib/v1-38-lean-container-match-session.ts:114, exactAbsent hard-codes an absent-container response of status 1, empty stdout, and uppercase `Error: No such object: <name>\n`. The installed compatible Docker returns status 1 but writes a newline to stdout and lowercase `error: no such object: <name>\n`. Therefore a truly absent preflight container is classified unknown, createLeanContainerMatchSession throws LEAN_CONTAINER_SESSION_NAME_CHECK_FAILED before create, and the preflight writer collapses that LEAN_CONTAINER_SESSION_* failure to probe_failed.
- fix: Not applied in diagnose-only mode. Repair direction is to define and test the exact accepted Docker 29.4 absent response actually emitted by the pinned environment (including stream bytes/case), without weakening other fail-closed status/error branches, then use the separately authorized fresh preflight.
- verification: Confirmed with one unique non-Match real-Docker session diagnostic and one bounded read-only inspect observation; no container was created, no Strategy method ran, and no preflight or Match selector was invoked.
- files_changed: []
