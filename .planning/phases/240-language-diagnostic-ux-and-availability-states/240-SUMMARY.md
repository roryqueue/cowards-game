---
phase: 240
slug: language-diagnostic-ux-and-availability-states
status: complete
completed: 2026-06-14
requirements:
  - CHECKDIAG-01
  - CHECKDIAG-02
  - CHECKDIAG-03
  - CHECKDIAG-04
  - CHECKDIAG-05
key_files:
  created:
    - .planning/phases/240-language-diagnostic-ux-and-availability-states/240-UI-SPEC.md
  modified:
    - packages/spec/src/workshop-checker.ts
    - packages/spec/src/workshop-checker.test.ts
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client.test.tsx
---

# Phase 240 Summary

The shared checker contract now maps provider validation issues into public diagnostic categories for Python, Rust, and Zig, including forbidden imports/capabilities, package metadata, compile failures, no-std/helper misuse, runtime-service unavailable, toolchain unavailable, timeout/limit, invalid shape, and provenance mismatch states.

Workshop UI renders the normalized checker diagnostics with constraint, next action, actionability, reference, and safe line/column details where present. Runtime-service and toolchain unavailable states use calm copy that says the Strategy has not been judged invalid.

Public diagnostic text is sanitized for private runtime vocabulary, common lower-camel/snake-case memory/objective spellings, host paths, bearer tokens, and database URLs.

## Verification

- `pnpm --filter @cowards/spec test -- workshop-checker`
- `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client`
- `pnpm --filter @cowards/web typecheck`

## Surprises

The original privacy exclusion list named `StrategyMemory` and `SoldierMemory` directly; the proof scanner correctly flagged that. The final contract avoids those public marker spellings and sanitizes provider diagnostic text.
