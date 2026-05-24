# Phase 101: Public Evidence Delivery and Web Cutover - Plan

**Status:** Ready for execution
**Research:** `101-RESEARCH.md`
**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06

## Objective

Cut selected normal web/product workflows to Go-owned contracts: exhibition creation, public MatchSet summary/evidence, public replay metadata, and selected public replay evidence.

## Tasks

1. Harden Go-selected exhibition creation.
   - Verify web frontend -> Next route -> Go backend queued response with no TypeScript backend fallback.
   - Add tests for missing Go URL fail-closed behavior.

2. Harden public MatchSet summary/evidence through Go.
   - Ensure web selected public MatchSet reads call Go.
   - Ensure Go public standings preserve Go scoring output, penalties, degraded status, replay availability, and privacy.

3. Add selected public replay evidence contract.
   - Keep React replay UI as renderer.
   - Move normal replay data access behind Go-owned public/evidence contract where selected.
   - Keep owner-debug replay projection labeled deferred/owner-debug only.

4. Label remaining TypeScript surfaces.
   - Update v1.15 manifest/monitor artifacts for frontend, parity-only, rollback-only, test-only, runtime-only, and deferred surfaces.
   - Keep workshop internals, admin/ladder/governance mutation, and test support explicit.

5. Add privacy/no-fallback checks.
   - Public/account/workshop/replay/evidence outputs must omit private Strategy/runtime/session/host/DB internals.
   - Go-selected failures fail closed with schema-validated public errors.

6. Write `101-SUMMARY.md`, `101-VERIFICATION.md`, and `101-VALIDATION.md`.

## UI Spec

No new UI design contract is required unless implementation changes replay page visuals. Existing React replay UI remains the renderer.

## Verification

- Web adapter and route tests
- Go backend public route tests
- Replay realism/browser smoke for changed replay evidence path
- `pnpm boundary:imports`
- `git diff --check`

## Exit Criteria

- Selected normal workflows use Go when selected, do not silently fallback, and expose only public-safe evidence.
