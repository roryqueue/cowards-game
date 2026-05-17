---
phase: 01
status: issues_found
depth: standard
reviewed_at: 2026-05-17T18:51:32.000Z
scope: phase-01-source-changes
files_reviewed: 34
findings:
  critical: 0
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
- Status: open

The flat ESLint config defines strict package-specific `no-restricted-imports` rules for `packages/spec` and `packages/engine`, but the later shared override for `packages/{spec,engine,replay,map-configs,test-utils}/src/**/*` also sets `no-restricted-imports`. In ESLint flat config, the later matching rule replaces the earlier rule options. The effective printed config for both `packages/spec/src/index.ts` and `packages/engine/src/index.ts` now only blocks `@cowards/runtime-js/worker`, so `packages/spec` is no longer lint-blocked from importing `@cowards/engine`, `@cowards/replay`, or other workspace internals, and `packages/engine` is no longer lint-blocked from importing app/worker/web/runtime surfaces covered by the earlier override.

This undercuts the Phase 1 boundary guarantee even though `pnpm lint` still passes, because the intended forbidden imports are absent from the effective config.

Recommended fix: merge the shared worker-entrypoint ban into each package-specific rule, or replace `no-restricted-imports` with additive `boundaries/element-types` rules so later overrides cannot erase earlier restrictions. Add a small boundary regression fixture or ESLint RuleTester coverage if practical.

## Verification

Review-only update. No tests were run.
