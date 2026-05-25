# Phase 134: Hostile Probe and No-Fallback Parity Across Subprocess and Container - Plan

**Status:** Ready for execution
**Date:** 2026-05-25

## Objective

Produce v1.20 hostile-probe and no-fallback parity evidence across host subprocess and container subprocess where practical, with honest evidence-kind labels and public-safe diagnostics.

## Tasks

1. Add a v1.20 hostile probe/no-fallback evidence artifact in JSON and Markdown.
2. Include subprocess and container lane summaries with live/preflight/synthetic counts.
3. Expand no-fallback drills to separate Docker unavailable, image unavailable, runsc unavailable, stale artifacts, and candidate substitution.
4. Update boundary monitors to check the new artifact and public-safe redaction rules.
5. Run sandbox and monitor checks.

## Verification

- `pnpm sandbox:evaluate`
- `pnpm sandbox:evaluate:container`
- `pnpm sandbox:evaluate:check`
- `pnpm sandbox:evaluate:runsc` expected fail-loud
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts`
