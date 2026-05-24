# Phase 93: JS Runtime Adapter Conformance - Discussion Log

**Date:** 2026-05-23  
**Milestone:** v1.14 Generic Strategy Artifact and Runtime Boundary Contract  
**Phase:** 93 - JS Runtime Adapter Conformance

## Discussion Summary

Phase 93 discussion confirmed that the runtime adapter work should be conformance evidence, not a runtime rewrite. The user approved keeping Strategy execution in the worker/runtime-js boundary and allowing a single explicit ABI conformance bridge if it is tested and monitored.

## Decisions

### 1. Runtime Architecture

Decision: do not rewrite runtime architecture in Phase 93.

Rationale: correctness of the boundary comes before optimizing or migrating runtime architecture.

### 2. Conformance Bridge

Decision: allow one explicit v1.14 ABI conformance bridge around the existing adapter interface if direct adapter conversion is too invasive.

Rationale: a named bridge can make the public ABI strict without forcing unrelated runtime churn into this phase.

### 3. Adapter Coverage

Decision: prove worker-thread, subprocess, and container-subprocess conformance through the same bridge/envelope tests.

Rationale: adapter behavior should be comparable across runtime boundaries even when their isolation strength differs.

### 4. Limit Alignment

Decision: align limits across spec, runtime-js guards, worker config, subprocess IPC, container adapter metadata, sandbox probes, and boundary monitors.

Rationale: mismatched limits are behavior-significant and can break determinism, fairness, or privacy.

### 5. Failure Classification

Decision: player-caused runtime violations complete the Match/Chronicle path, while infrastructure/system failures remain retryable or system-classified.

Rationale: system failures must not be converted into player losses or public Strategy diagnostics.

### 6. Hostile/Determinism Probes

Decision: run probes for time, randomness, filesystem, network, environment, shell/dynamic code, stdio caps, memory/source/objective caps, malformed output, and timeout.

Rationale: conformance must include hostile-code behavior, not just happy-path envelope validation.

### 7. Container Status

Decision: keep container-subprocess evidence-only and non-counted in v1.14.

Rationale: production hostile-code isolation promotion remains a later gate.

### 8. Executable API Absence

Decision: monitor that executable runtime APIs remain absent from web/API and Go backend packages.

Rationale: v1.14 must keep runtime execution out of processes that are not the Strategy worker/runtime boundary.

## Deferred Ideas

None.
