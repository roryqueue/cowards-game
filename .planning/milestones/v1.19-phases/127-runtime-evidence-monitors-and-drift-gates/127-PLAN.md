---
phase: 127
status: executed
requirements: [MON-01, MON-02, MON-03, MON-04, MON-05, MON-06]
---

# Phase 127 Plan

## Objective
Teach boundary monitors to guard v1.19 readiness evidence without requiring Docker/runsc for ordinary monitor runs.

## Tasks
1. Keep `pnpm boundary:monitors` default-friendly.
2. Add monitor checks for v1.19 readiness JSON/Markdown, lanes, no-fallback drills, and no-promotion wording.
3. Add source checks for v1.19 exhibition trust surfaces.
4. Preserve privacy and no-runtime-ownership-drift gates.

## Verification
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `pnpm sandbox:evaluate:check`

