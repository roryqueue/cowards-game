---
phase: 128
status: executed
requirements: [BETA-01, BETA-02, BETA-03, BETA-04, BETA-05, BETA-06]
---

# Phase 128 Plan

## Objective
Make Python exhibition beta authoring clearer and more credible while keeping JS/TS behavior unchanged.

## Tasks
1. Keep compact persistent Python labels.
2. Remove stale v1.18-only validation wording.
3. Add credible safe Python samples that use only Strategy input data.
4. Verify JS/TS sample and Workshop tests still pass.

## Verification
- `pnpm --filter @cowards/persistence test -- workshop.test.ts`
- `pnpm --filter @cowards/runtime-python test`
- `pnpm --filter @cowards/web test -- matchset replay workshop-client.test.tsx`

