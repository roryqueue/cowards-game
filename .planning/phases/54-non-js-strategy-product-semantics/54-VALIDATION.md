---
phase: 54
slug: non-js-strategy-product-semantics
status: approved
nyquist_compliant: true
created: 2026-05-22
last_verified: 2026-05-22T18:14:00-04:00
---

# Phase 54 — Validation Strategy

## Commands

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-js test`
- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`
- `pnpm typecheck`
- `pnpm exec prettier --check <changed files>`

## Verification Targets

- [x] Runtime semantic helpers classify JS/TS as counted and Python as experimental/non-counted.
- [x] Runtime validation messages include required non-JS and boundary issue codes.
- [x] JS/TS validation behavior remains unchanged by default.
- [x] Competition and ladder eligibility fail closed for experimental runtime metadata.
- [x] Account, exhibition, Workshop validation, and public Strategy surfaces can render compact runtime semantics and references.

## Results

| Command | Result |
|---|---|
| `pnpm --filter @cowards/spec test` | pass — 30 tests |
| `pnpm --filter @cowards/runtime-js test` | pass — 182 tests |
| `pnpm --filter @cowards/persistence test` | pass — 52 passed, 1 skipped |
| `pnpm --filter @cowards/web test` | pass — 94 tests |
| `pnpm typecheck` | pass — 12 packages |
