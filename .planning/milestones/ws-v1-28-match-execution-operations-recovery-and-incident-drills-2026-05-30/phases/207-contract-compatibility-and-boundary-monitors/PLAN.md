---
phase: 207
name: Contract Compatibility and Boundary Monitors
status: complete
milestone: v1.28
created: 2026-05-30
---

# Phase 207 Plan

## Goal

Prove every public operations outcome remains compatible with `match-execution-app-v1` and wire that proof into boundary monitors.

## Steps

1. Extend the v1.28 operations proof with an explicit public compatibility matrix.
2. Keep private marker source checks while ensuring generated proof artifacts use public-safe labels.
3. Add a v1.28 operations proof check to `scripts/check-boundary-monitors.ts`.
4. Regenerate the operations proof artifacts.
5. Run the operations proof and boundary monitor script.
6. Mark COMPAT requirements complete and advance the workstream to Phase 208.

## Verification

- `pnpm match-execution:operations:check`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `gsd-tools state validate`
