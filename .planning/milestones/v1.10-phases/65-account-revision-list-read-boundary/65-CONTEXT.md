# Phase 65: Account Revision List Read Boundary - Context

**Gathered:** 2026-05-23  
**Status:** Ready for execution  
**Source:** Phase 64 scope lock

<domain>
## Phase Boundary

Phase 65 migrates only the account Strategy Revision list read boundary. It must make `/api/account/revisions` a strict service-backed read endpoint and keep Strategy Revision save, fork, source retrieval, validation, test execution, submission, MatchSet creation, analytics rerun, and export mutations outside the selected read closure.

</domain>

<decisions>
## Implementation Decisions

### Endpoint Shape
- `/api/account/revisions` is read-only for the selected boundary.
- Account save POST is separated to `/api/account/revisions/save` and remains a deferred write path.
- The Workshop client uses the separated save route for account saves.

### Service Ownership
- Account revision list data comes through `listAccountReadRevisions()` and `@cowards/service`.
- The route authorizes through the account read service boundary before returning owner data.
- The read endpoint returns metadata/hash/status/runtime/compatibility/lineage only; no Strategy source.

### Enforcement
- `apps/web/app/api/account/revisions/route.ts` is added to strict import enforcement.
- The old report-only fingerprint for that file is removed from boundary monitor baseline.
- The remaining deferred write route is not counted as a migrated read boundary.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/artifacts/v1.10-boundary-offense-classification.md` - selected account read offense and deferred write/source offenses.
- `apps/web/app/api/account/revisions/route.ts` - selected strict read endpoint.
- `apps/web/app/api/account/revisions/save/route.ts` - deferred account save route.
- `apps/web/lib/account-service-boundary.ts` - account read service boundary.
- `apps/web/lib/account-revision-write-boundary.ts` - deferred account save wrapper.
- `apps/web/app/workshop/workshop-client.tsx` - account save caller.
- `scripts/check-service-boundary-imports.ts` - strict migrated files.
- `scripts/check-boundary-monitors.ts` - report-only baseline.

</canonical_refs>

<deferred>
## Deferred Ideas

- Account fork routes.
- Account revision source retrieval.
- Service-owned account save commands.
- Auth command migration.
</deferred>

