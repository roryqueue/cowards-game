# Phase 133: Executable Container Runtime Candidate Lane - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Make the Docker/runc container subprocess lane inspectable as a real executable candidate with controls, preflight taxonomy, side-by-side candidate comparison, and strict fail-loud behavior.

## Tasks

1. Extend v1.20 readiness evidence with container controls and candidate comparison details.
2. Ensure strict container evidence runs through the real `container-subprocess` adapter and cannot silently substitute another lane.
3. Preserve fail-loud runsc behavior.
4. Verify artifact checks and container adapter tests.

## Verification

- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:container`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected fail-loud
- `pnpm exec vitest run packages/runtime-js/src/container-subprocess-adapter.test.ts scripts/check-boundary-monitors.test.ts`
