---
phase: 127
status: passed-after-fixes
review_type: code
---

# Phase 127 Code Review

## Findings Fixed

| Severity | Finding | Resolution |
|---|---|---|
| BLOCKER | `pnpm sandbox:evaluate:runsc` could pass on binary availability without runsc probes. | Strict runsc lane now fails unless `runsc` is present and still fails until an executable runsc probe adapter exists. |
| BLOCKER | Default readiness artifacts could become machine-dependent on `runsc` availability. | Removed `runsc` probing from committed sandbox evaluation artifacts. |
| BLOCKER | Probe taxonomy mapped source size to package/import and process-exit blocking to crash coverage. | Added real package import, host path, and synthetic adapter crash probes; source size now uses `source_size`; `host_paths` is required. |

## Verification
- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected non-zero strict-lane failure
- `pnpm --filter @cowards/runtime-js test`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`

