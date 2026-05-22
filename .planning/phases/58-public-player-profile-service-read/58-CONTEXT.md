---
phase: 58
slug: public-player-profile-service-read
status: context
created: 2026-05-22
---

# Phase 58 Context — Public Player Profile Service Read

## Goal

Move the public player profile read behind `@cowards/service` while preserving public page behavior and shrinking direct web persistence debt.

## Decisions

- Use the existing public service boundary pattern from the public Strategy page.
- Add `CowardsService.getPublicPlayerPage(handle)` as the canonical service method.
- Keep the service envelope shape aligned with the existing `getPublicPlayerPage` route contract: `publicPage`, `page: "player"`, and a `PublicPlayerProfileDto` payload.
- Keep page rendering in `apps/web/app/players/[handle]/page.tsx`, with persistence lookup and DTO validation owned by `@cowards/service`.
- Remove the public player profile persistence import and facade method from `competitive/server`.
- Add the player page to strict service-boundary import enforcement.

## Guardrails

- Public player DTOs must be schema parsed and leak checked before return.
- The migrated page must not import `competitive/server`, persistence roots, migrations, workers, runtime adapters, or Strategy execution modules.
- The migration must reduce report-only broad web offenses from the Phase 57 baseline of 41.
- No game rules move into React, service DTO mappers, or web route code.
