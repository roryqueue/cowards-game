---
phase: 126
status: executed
requirements: [CAND-01, CAND-02, CAND-03, CAND-04, CAND-05, CAND-06]
---

# Phase 126 Plan

## Objective
Separate default runtime evidence from stricter candidate-specific evidence so local monitors stay usable while strict lanes fail loudly.

## Tasks
1. Keep hardened subprocess evidence in the default report.
2. Keep container evidence behind the existing required container command.
3. Add a runsc required lane that fails if runsc is unavailable or no executable runsc probe adapter exists.
4. Document what each candidate proves and does not prove in v1.19 artifacts.

## Verification
- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected strict-lane failure until runsc probes execute under a real adapter.
