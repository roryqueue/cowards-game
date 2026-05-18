---
phase: 01
status: fixed
depth: standard
reviewed_at: 2026-05-17T18:51:32.000Z
fixed_at: 2026-05-17T19:08:41.000Z
scope: phase-01-source-changes
files_reviewed: 34
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
fixed_findings:
  warning: 1
  info: 0
  total: 1
---

# Phase 01 Code Review

## Findings

### F-01: Shared ESLint override weakens package boundary rules

- Severity: warning
- Files: `eslint.config.mjs:65`, `eslint.config.mjs:105`, `eslint.config.mjs:123`
- Requirements: FOUND-04
- Status: fixed

The flat ESLint config defines strict package-specific `no-restricted-imports` rules for `packages/spec` and `packages/engine`, but the later shared override for `packages/{spec,engine,replay,map-configs,test-utils}/src/**/*` also sets `no-restricted-imports`. In ESLint flat config, the later matching rule replaces the earlier rule options. The effective printed config for both `packages/spec/src/index.ts` and `packages/engine/src/index.ts` now only blocks `@cowards/runtime-js/worker`, so `packages/spec` is no longer lint-blocked from importing `@cowards/engine`, `@cowards/replay`, or other workspace internals, and `packages/engine` is no longer lint-blocked from importing app/worker/web/runtime surfaces covered by the earlier override.

This undercuts the Phase 1 boundary guarantee even though `pnpm lint` still passes, because the intended forbidden imports are absent from the effective config.

Resolution: the worker-entrypoint ban is now merged into the stricter `packages/spec` and `packages/engine` rules, while the shared override only applies to packages that do not already define package-specific `no-restricted-imports` rules. Effective ESLint configs were checked with `pnpm exec eslint --print-config`.

## Verification

```bash
pnpm verify
```

Passed.
