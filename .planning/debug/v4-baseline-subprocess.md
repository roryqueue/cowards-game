---
status: inconclusive
trigger: "Continue the approved v1.38 milestone; diagnose the new v4 baseline failure"
created: 2026-10-05
updated: 2026-10-05
goal: find_root_cause_only
---

## Symptoms

Expected: complete the 36-Match reduced private baseline within existing frozen limits, or report honest partial results.
Actual: unique baseline entry84983 and retained reader26989 both closed exit0; check accepted retained integrity but incomplete10/36, nine successes and one system failure.
Error: observation9 cell.compact code SUPERVISOR_FAILURE, elapsed7358ms, invocationCount2; finite cell.diagnostic SUBPROCESS_SIGNAL/native_response/executor/selectActivations/ordinal0.
Timeline: reviewed source31e0e379 / manifestcf9096c6; held HEAD74e072c1 throughout route and its unique reader. Diagnostic passed before baseline.
Reproduction: consumed v4 evidence only; no empirical reproduction authorized.

## Current Focus

hypothesis: the selected TypeScript legacy broker emitted a synthetic signal sentinel after deadline/completion failure; the initiating reason remains unknown
test: bounded static source inspection and finite allowlisted metadata from NEW baseline v4 only (completed)
expecting: prospective finite provenance repair can distinguish broker deadline/completion from observed signal, but does not establish a performance fix
next_action: parent review of diagnosis-only recommendation; no implementation or execution authority

## Boundaries

No provider, Strategy, Match, importer, helper mode, historical scan, old ordinary reader, or new route. No mutation of consumed requests, allocation, result, check, journals, evidence or authority. No raw private source/objectives/memory/IO/stdio/errors in output. Synthetic tests permitted only if useful and no actual native execution. Own this debug file and a safe diagnosis report in Phase265; no implementation or commits by diagnosis agent. All costs carry from24910444ms at1791229625398 under existing15GB/eight-hour/300Match caps. No scope/resource/rules changes; four-hour proposal unapproved.

## Evidence

- Observation9 metadata disproves the speculative ten-minute Match-ceiling hypothesis: failed cell elapsed7358ms, not600000ms.
- Top-level observation diagnostic is absent; actual finite diagnostic resides under cell.diagnostic. Do not infer broadcatch solely from normalized compact SUPERVISOR_FAILURE.
- timestamp: 2026-10-05T19:57:04Z
  checked: NEW v4 observation9 finite allowlisted metadata only
  found: cell.diagnostic code SUBPROCESS_SIGNAL, method selectActivations, ordinal0, reason executor, stage native_response; compact system_failure/SUPERVISOR_FAILURE/7358ms/invocationCount2/cleanupComplete true. Diagnostic has no broker branch, wait disposition or signal-buffer state.
- timestamp: 2026-10-05T19:57:04Z
  checked: selected TypeScript persistent container broker static routing
  found: scripts/lib/v1-38-lean-container-match-session.ts:140-142 creates synthetic SIGKILL after Atomics.wait deadline or non-ready completion flag; :368-380 maps a received non-null signal to SUBPROCESS_SIGNAL. Actual stream child exit and stream timeout use distinct paths (:233, :253-255). No actual OS signal or OOM is established.
- timestamp: 2026-10-05T19:57:04Z
  checked: diagnostic propagation static routing
  found: scripts/lib/v1-38-planner-supervised-runtime.ts:155-159 falls back to executor/unknown for unregistered exception provenance; scripts/lib/v1-38-lean-baseline-match.ts:180 projects native_response/executor; scripts/run-v1-38-lean-experiment.ts:170-174 normalizes system failure to compact SUPERVISOR_FAILURE.
- timestamp: 2026-10-05T19:57:04Z
  checked: guest and host timeout wiring in selected lean authority/session
  found: lean authority receiptMs5000 is installed at session:302-305 and used at host stream.exchange:368; broker request:363 independently carries guest1000 used by broker:140-142. No host5000-to1000 defect established.

## Eliminated

- hypothesis: this failed Match exhausted its ten-minute lifetime
  evidence: retained compact elapsed7358ms
- hypothesis: SUBPROCESS_SIGNAL proves an observed operating-system signal or OOM
  evidence: the selected broker creates a synthetic SIGKILL sentinel; retained finite fields lack underlying cause telemetry
- hypothesis: compact SUPERVISOR_FAILURE proves a hidden broadcatch exception
  evidence: finite cell.diagnostic is present and follows an explicit system-failure normalization path

## Resolution

root_cause: initiating cause unknown; definite provenance limitation conflates synthetic broker deadline/completion sentinel with observed subprocess signal
fix: not applied; recommend prospective finite origin retention only, preserving system failure and unchanged limits/schemas/privacy
verification: one bounded static investigation plus finite NEW v4 metadata; no tests, native execution, ordinary reader or empirical reproduction
files_changed: debug session and 265-16-V4-SUBPROCESS-DIAGNOSIS-v1.md only
