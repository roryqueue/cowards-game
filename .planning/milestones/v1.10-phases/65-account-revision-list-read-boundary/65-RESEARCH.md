# Phase 65 Research: Account Revision List Read Boundary

**Researched:** 2026-05-23  
**Status:** Complete

## Findings

`apps/web/app/api/account/revisions/route.ts` previously mixed:

- `GET` revision list, already using `listAccountReadRevisions()`.
- `POST` account save, using `competitiveServer.saveAccountRevision()`.

Because the file statically imported `competitive/server`, the already-service-backed read path remained a report-only offense. Next.js route files cannot split handlers by method at the same path, so v1.10 separates the save endpoint and keeps the selected `/api/account/revisions` path read-only.

## Implementation Approach

- Keep `/api/account/revisions` as the account revision-list GET route.
- Move account save POST to `/api/account/revisions/save`.
- Update Workshop account-save fetch to the new route.
- Add `/api/account/revisions/route.ts` to strict service-boundary import enforcement.
- Remove the old report-only baseline fingerprint for the mixed route.

## Risks

- Client callers using the old POST endpoint would fail. Repo search found the Workshop client as the relevant account-save caller and it was updated.
- The save route remains a deferred write path. It must not be mistaken for a service-backed read migration.

