---
phase: 101-public-evidence-delivery-and-web-cutover
reviewed: 2026-05-24T04:06:30Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - apps/go-backend/live_backend.go
  - apps/go-backend/matchset_status_test.go
  - apps/web/app/matches/server.ts
  - apps/web/app/matches/replay-ready.ts
  - apps/web/app/matches/server.test.ts
  - apps/web/lib/public-go-read-client.ts
  - apps/web/lib/public-go-read-client.test.ts
  - apps/web/lib/public-service-adapter.ts
  - apps/web/lib/public-service-adapter.test.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/service.ts
  - packages/spec/src/service-fixtures.ts
  - packages/spec/src/service-contract.test.ts
  - packages/spec/artifacts/service-api-v1.8.openapi.json
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: fixed
---

# Phase 101: Code Review Report

**Reviewed:** 2026-05-24T04:06:30Z
**Depth:** standard
**Files Reviewed:** 14
**Status:** fixed

## Summary

Reviewed the public replay evidence Go route, spec/service schemas, web Go read client and replay adapter, selected-Go replay path, privacy/no-fallback behavior, tests, and generated OpenAPI artifact. The main risk is that the new public replay evidence contract reuses the general Chronicle projection schema, so public clients and generated docs still allow owner-only projection data.

## Critical Issues

### CR-01: Public replay evidence contract allows owner-private projections

**File:** `packages/spec/src/schemas.ts:1289`

**Issue:** `PublicReplayEvidenceServiceDtoSchema` accepts `projection: ChronicleProjectionSchema`, and `ChronicleProjectionSchema` allows both owner viewers and `ownerPrivate` (`packages/spec/src/schemas.ts:2092`). The generated public OpenAPI response also documents `projection.ownerPrivate` (`packages/spec/artifacts/service-api-v1.8.openapi.json:1922`). The web Go client then accepts this schema for `/public/replays/{matchId}/evidence` (`apps/web/lib/public-go-read-client.ts:464`) and `buildReadyReplayFromPublicEvidence` returns the projection to the browser unchanged (`apps/web/app/matches/replay-ready.ts:547`). A Go/public evidence response containing an owner projection can therefore pass schema validation and be rendered as public replay data, violating the no-private-output boundary.

**Fix:**

Define and use a public-only projection schema for public evidence, and add runtime validation in the client/replay path:

```ts
export const PublicChronicleProjectionSchema = ChronicleProjectionSchema.omit({
  ownerPrivate: true,
}).extend({
  viewer: ChroniclePublicViewerSchema,
})

export const PublicReplayEvidenceServiceDtoSchema = z.object({
  apiVersion: z.literal(SERVICE_SCHEMA_API_VERSION),
  kind: z.literal("publicReplayEvidence"),
  matchId: z.string().min(1),
  metadata: /* existing metadata schema */,
  projection: PublicChronicleProjectionSchema,
})
```

Also update `PUBLIC_OUTPUT_FORBIDDEN_FIELDS`/contract tests to reject `ownerPrivate`, regenerate OpenAPI, and add a client test proving an owner projection is rejected before replay rendering.

**Resolution:** Fixed. Added `ownerPrivate` to public-output forbidden fields, introduced a public-only Chronicle projection schema, switched the public replay evidence DTO to that schema, regenerated OpenAPI, and added a client rejection test for owner-private projection data.

## Warnings

### WR-01: Replay evidence client does not verify response identity

**File:** `apps/web/lib/public-go-read-client.ts:456`

**Issue:** `getPublicReplayMetadata` and `getPublicReplayEvidence` parse the DTO but do not verify that `body.matchId` and `body.metadata.matchId` match the requested `matchId`. The selected-Go replay path then uses whatever evidence comes back (`apps/web/app/matches/server.ts:160`), so a backend/proxy/cache routing defect can render evidence for a different Match under the requested replay URL. Other public routes already perform route-specific divergence checks such as canonical href validation; replay routes need the same identity check.

**Fix:** Add route-specific `validate` callbacks for both replay methods:

```ts
validate: (dto, status, startedAt, endedAt) => {
  const expected = matchId
  if (dto.matchId !== expected || dto.metadata.matchId !== expected) {
    throw new PublicGoReadError(
      "Go public replay read returned divergent Match id",
      makeDiagnostic(routeId, "go_body_divergent", status, startedAt, endedAt),
    )
  }
}
```

Add tests for mismatched top-level and metadata Match ids.

**Resolution:** Fixed. Public replay metadata and evidence now validate returned Match identity against the requested route Match id, with tests for top-level and metadata divergence.

### WR-02: Service route id enum omits the new public replay evidence route

**File:** `packages/spec/src/schemas.ts:917`

**Issue:** `SERVICE_API_ROUTES` declares `getPublicReplayEvidence` (`packages/spec/src/service.ts:373`) and the OpenAPI artifact includes `/public/replays/{matchId}/evidence` (`packages/spec/artifacts/service-api-v1.8.openapi.json:3395`), but `SERVICE_SCHEMA_ROUTE_IDS` does not include `getPublicReplayEvidence`. Any consumer validating route IDs with `ServiceApiRouteIdSchema` will reject this new route even though it is part of the service contract.

**Fix:** Add `"getPublicReplayEvidence"` to `SERVICE_SCHEMA_ROUTE_IDS`, and extend the contract test to assert every `SERVICE_API_ROUTES` key parses through `ServiceApiRouteIdSchema`.

**Resolution:** Fixed. Added `getPublicReplayEvidence` to `SERVICE_SCHEMA_ROUTE_IDS` and extended service contract metadata tests to parse every route id through `ServiceApiRouteIdSchema`.

---

_Reviewed: 2026-05-24T04:06:30Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
