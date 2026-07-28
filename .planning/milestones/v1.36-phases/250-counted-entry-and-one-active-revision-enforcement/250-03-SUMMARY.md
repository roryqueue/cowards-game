---
phase: 250-counted-entry-and-one-active-revision-enforcement
plan: 03
subsystem: web-api-go
tags: [counted-entry, public-discovery, exhibitions, provider-readiness, privacy]

requires:
  - phase: 250-01
    provides: spec-owned counted entry categories and public copy
  - phase: 250-02
    provides: persistence-owned eligibility and one-owner-per-Season mutation
provides:
  - Category-shaped counted entry HTTP responses
  - Signed-in counted ladder entry projection and submission UI
  - Go provider-readiness category parity for current counted lanes
  - Explicit exhibition-only and no-standings-impact behavior
affects: [phase-251, phase-254, phase-255]

key-files:
  modified:
    - apps/web/app/competitive/http.ts
    - apps/web/app/competitive/server.ts
    - apps/web/lib/public-discovery-service.ts
    - apps/web/app/competitions/[competitionId]/enter/page.tsx
    - apps/web/app/exhibitions/new/exhibition-client.tsx
    - apps/go-backend/provider_readiness.go
  added:
    - apps/web/app/competitions/[competitionId]/enter/ladder-entry-client.tsx
    - apps/web/app/api/ladder/seasons/[seasonId]/entries/route.test.ts
    - apps/web/app/api/exhibitions/route.test.ts

requirements-completed: [ELIG-01, ELIG-02, ELIG-03, ELIG-06]

completed: 2026-07-11
---

# Phase 250 Plan 03 Summary

Counted ladder entry now projects the same spec-owned eligibility categories through HTTP, signed-in discovery, and the entry page, while persistence remains the mutation authority.

## Accomplishments

- Added leak-safe `{ ok: false, eligibility: { category, publicMessage, remediation } }` responses with stable status mapping for ownership, Season, provider, runtime, duplicate, and replacement failures.
- Added a counted ladder dashboard mode that renders eligible and ineligible immutable revisions and submits through the thin ladder entry route.
- Aligned Go readiness with TypeScript, Python, Rust, and Zig success plus distinct unsupported, TinyGo, invalid, incompatible, package, capability, missing-proof, mismatched-proof, stale-proof, and runtime-unavailable categories.
- Kept Go out of ladder entry mutation and kept exhibitions on the existing MatchSet backend.
- Clarified that same-player self-play and multiple account revisions are permitted in exhibitions, while every exhibition has no counted trial Season standings impact.

## Commits

1. `b891c78` - Project category-shaped counted entry API errors.
2. `68ec7ea` - Add signed-in counted ladder entry projection and UI.
3. `437b930` - Align Go provider readiness and exhibition policy.

## Verification

- `pnpm exec vitest run packages/persistence/src/competition.test.ts apps/web/lib/public-discovery-service.test.ts apps/web/app/api/exhibitions/route.test.ts` - passed, 19 tests.
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Provider.*Readiness|Test.*Counted' -count=1` - passed.
- Plan-level route, eligibility, ladder, policy, and privacy checks are recorded in the Phase 250 verification report.

## Deviations from Plan

- Added `apps/web/app/api/exhibitions/route.test.ts` because a route-level delegation assertion proves exhibition separation more directly than source scanning alone.
- Added the Go engine-compatibility field to readiness input so stored provider validation cannot silently discard the current engine evidence returned by the runtime service.

## Privacy and Runtime Boundaries

- Web and Go consume stored provider/runtime evidence only; neither executes Strategy code or installs packages.
- Public output contains coarse eligibility, remediation, evidence mode, and standings-impact fields only.
- No source, memory, objective payload, proof material, artifact bytes, paths, environment values, tokens, database details, or operator-only diagnostics are exposed.

## Self-Check: PASSED

- All task commits exist.
- Focused Go and Vitest suites pass.
- Counted ladder mutation remains persistence-owned.
- Exhibition same-player workflows remain permissive and cannot affect trial standings.
