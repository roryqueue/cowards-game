---
phase: 240
slug: language-diagnostic-ux-and-availability-states
status: verified
verified: 2026-06-14
---

# Phase 240 Verification

Goal-backward result: verified.

The implementation provides language-specific public checker diagnostics and unavailable-state UX for Python, Rust, and Zig. The UI renders normalized diagnostics rather than raw compiler/runtime output, and the checker contract sanitizes private runtime markers before public/default output.

Evidence:
- `pnpm --filter @cowards/spec test -- workshop-checker`
- `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client`
- `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts --reporter=dot`

No verification gaps remain.
