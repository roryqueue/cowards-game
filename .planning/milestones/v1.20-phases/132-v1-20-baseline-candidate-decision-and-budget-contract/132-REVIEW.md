# Phase 132 Code Review

**Status:** Passed after fixes
**Date:** 2026-05-25
**Depth:** Standard

## Findings

### Fixed: Container image mismatch

- **Severity:** Blocker
- **Files:** `scripts/evaluate-runtime-sandbox.ts`, `packages/runtime-js/src/sandbox-evaluation.ts`, `packages/runtime-js/src/container-subprocess-adapter.ts`
- **Issue:** Preflight evidence could report `COWARDS_CONTAINER_SANDBOX_IMAGE` while the actual adapter used its default image.
- **Fix:** Exported the adapter default image and threaded the selected image into `createContainerSubprocessStrategyExecutionAdapter({ image })`.

### Fixed: Synthetic probes counted as live evidence

- **Severity:** Blocker
- **File:** `packages/runtime-js/src/sandbox-evaluation.ts`
- **Issue:** Malformed IPC and adapter-crash probes were synthetic but indistinguishable from live adapter probes in artifacts.
- **Fix:** Added `evidenceKind: live | preflight | synthetic` to each probe result and summary counts for live, synthetic, and preflight evidence.

### Fixed: Source-size evidence counted as live adapter evidence

- **Severity:** Blocker
- **File:** `packages/runtime-js/src/sandbox-evaluation.ts`
- **Issue:** Source-size rejection happens before adapter execution.
- **Fix:** Source-size evidence is now explicitly marked `preflight`.

### Fixed: stdout/stderr cap wording overclaimed stream-cap evidence

- **Severity:** Warning
- **File:** `packages/runtime-js/src/sandbox-evaluation.ts`
- **Issue:** Probes block `console` as forbidden capability rather than testing raw stream caps.
- **Fix:** Renamed labels to "console output capability block" and "console diagnostic capability block."

## Fix Verification

- `pnpm sandbox:evaluate` passed.
- `pnpm sandbox:evaluate:check` passed.
- `pnpm exec vitest run packages/runtime-js/src/container-subprocess-adapter.test.ts scripts/check-boundary-monitors.test.ts` passed.

## Re-Review

The follow-up `gsd-code-reviewer` pass reported no remaining findings and verified the four prior issues were resolved.
