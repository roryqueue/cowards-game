---
phase: 241
slug: checker-ergonomics-caching-and-boundary-monitors
status: complete
completed: 2026-06-14
requirements:
  - CHECKERG-01
  - CHECKERG-02
  - CHECKERG-03
  - CHECKERG-04
key_files:
  created:
    - .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-UI-SPEC.md
    - .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-UI-REVIEW.md
  modified:
    - apps/web/app/api/workshop/validate/route.ts
    - apps/web/app/workshop/workshop-client-state.ts
    - apps/web/app/workshop/workshop-client.tsx
    - apps/web/app/workshop/workshop-client.test.tsx
    - apps/web/app/globals.css
    - scripts/check-boundary-monitors.ts
    - scripts/check-boundary-monitors.test.ts
---

# Phase 241 Summary

Workshop checker calls now use a short server-side TTL cache and in-flight coalescing keyed by contract version, language, provider id, source hash/bytes, and validation policy. The route validates runtime-service response identity before caching so stale service output cannot be reused for the current draft.

The Workshop UI preserves previous diagnostics as stale while blocking submit/save until a current `ready` checker envelope matches the current validation identity. Stale, checking, unavailable, invalid, and ready states have distinct copy, and warning/unavailable panels now receive warning styling.

Boundary monitors include a v1.34 checker contract layer that verifies the production checker allowlist stays TypeScript/Python/Rust/Zig, TinyGo remains hidden, and web route code does not import runtime packages or `node:vm`.

## Verification

- `pnpm --filter @cowards/web test -- app/api/workshop/validate app/api/workshop/revisions workshop-client`
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts --reporter=dot`
- `pnpm --filter @cowards/web typecheck`

## Surprises

The UI review caught that a valid legacy validation report could still enable Submit revision while the current checker was stale/checking/unavailable. The final helper now requires a current `ready` checker matching validation source hash/bytes.
