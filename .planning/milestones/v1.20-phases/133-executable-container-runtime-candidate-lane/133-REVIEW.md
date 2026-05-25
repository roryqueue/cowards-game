# Phase 133 Code Review

**Status:** Passed after fixes
**Date:** 2026-05-25

## Findings

### Fixed: Host-dependent default artifacts

- **Severity:** Blocker
- **Files:** `scripts/evaluate-runtime-sandbox.ts`, generated artifacts
- **Issue:** Default `sandbox:evaluate` auto-enabled container evidence on hosts with Docker/image, making committed artifacts host-dependent.
- **Fix:** Default artifacts remain deterministic with container skipped. Strict container evidence is written to `.container` artifacts when `COWARDS_RUN_CONTAINER_SANDBOX=1` or `--require-container` is used.

### Fixed: Derivative artifact staleness

- **Severity:** Blocker
- **Files:** `scripts/check-boundary-monitors.ts`
- **Issue:** Monitors did not compare readiness/hostile derivative claims against the base sandbox reports.
- **Fix:** Boundary monitors now compare `generatedAt`, ABI, container status, local support, and summary counts across default and strict container artifacts.

### Fixed: Docker control overclaim

- **Severity:** Warning
- **Files:** `scripts/evaluate-runtime-sandbox.ts`, readiness artifacts
- **Issue:** Container controls could read like kernel-level proof.
- **Fix:** Artifact now labels them as requested adapter argv/metadata controls, not production sandbox certification.

## Verification

- `pnpm sandbox:evaluate` passed.
- `pnpm sandbox:evaluate:container` passed.
- `pnpm sandbox:evaluate:check` passed.
- `COWARDS_RUN_CONTAINER_SANDBOX=1 pnpm exec tsx scripts/evaluate-runtime-sandbox.ts --check` passed.
- `pnpm exec tsx scripts/check-boundary-monitors.ts` passed.
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts packages/runtime-js/src/container-subprocess-adapter.test.ts` passed.
- Final re-review reported no findings and confirmed live container evidence is confined to `.container` artifacts.
