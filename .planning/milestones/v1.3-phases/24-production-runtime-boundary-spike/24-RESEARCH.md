# Phase 24 Research: Production Runtime Boundary Spike

## Findings

- Worker threads are useful for local compatibility but are not a production security boundary for hostile Strategy code.
- Node `vm` remains explicitly unsuitable as the trust boundary.
- A containerized subprocess path is the most practical v1.3 production-candidate boundary because it preserves the existing JS Strategy API while adding process, filesystem, network, pid, CPU, and memory controls.

## Decision

Prototype `container-subprocess` behind `StrategyExecutionAdapter`, retain `subprocess` and `worker-thread` adapters, and expand hostile regression coverage.

