---
phase: 131
status: executed
requirements: [EXIT-01, EXIT-02, EXIT-03, EXIT-04, EXIT-05]
---

# Phase 131 Plan

## Objective
Record the milestone promotion decision, archive requirements/roadmap/phases, remove active requirements, update state documents, and tag v1.19 after final verification and audit pass.

## Tasks
1. Preserve explicit decision: Python remains non-counted exhibition beta.
2. Preserve explicit decision: runtime isolation remains readiness evidence.
3. Verify runtime-js, runtime-python, spec, web, monitors, and artifacts.
4. Leave final archive/tag gate open until the user chooses to complete the milestone.

## Verification
- `pnpm sandbox:evaluate:check`
- `pnpm --filter @cowards/runtime-js test`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
- `pnpm --filter @cowards/web test -- matchset replay workshop-client.test.tsx`
- `pnpm --filter @cowards/spec test`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
