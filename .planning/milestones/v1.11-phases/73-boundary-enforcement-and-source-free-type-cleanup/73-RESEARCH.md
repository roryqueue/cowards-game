# Phase 73 Research: Boundary Enforcement and Source-Free Type Cleanup

## Findings

- `pnpm boundary:imports` walks `apps/web/app` for report-only offenses and follows local dependency closure from `strictMigratedFiles`.
- The Phase 71/72 route imports are not existing report-only offenses because `workshop/server` is not a forbidden pattern.
- Strict-gating the migrated routes proves the safe route/helper closure but does not by itself reduce `report_only_offenses`.
- The only Workshop type-level report-only fingerprint is `apps/web/app/workshop/types.ts`, which imports Workshop types directly from `@cowards/persistence/workshop`.
- Removing the direct persistence type import from `apps/web/app/workshop/types.ts` is the most direct source-free/type-cleanup path to reduce the count below 30 without moving runtime or write behavior.

## Implementation Notes

- Promote the migrated routes and safe helper closure to strict enforcement.
- Keep adapter persistence allowlisting narrow.
- Replace direct Workshop persistence type imports in web Workshop types with local web-owned interfaces and spec-owned DTOs where applicable.
- Update the known baseline in `scripts/check-boundary-monitors.ts` only after fresh `pnpm boundary:imports` proves the count drop.

