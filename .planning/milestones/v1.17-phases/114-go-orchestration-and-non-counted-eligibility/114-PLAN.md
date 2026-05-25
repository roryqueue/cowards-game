---
phase: 114-go-orchestration-and-non-counted-eligibility
plan: 1
type: execute
wave: 1
depends_on: [113]
files_modified:
  - apps/go-backend/runtime_service_client.go
  - apps/go-backend/runtime_service_client_test.go
  - packages/persistence/src/competition.ts
  - packages/persistence/src/competition.test.ts
  - apps/web/app/exhibitions/new/exhibition-client.tsx
  - apps/web/app/api/exhibitions/route.ts
autonomous: true
requirements: [GO-01, GO-02, GO-03, GO-04, GO-05]
---

<objective>
Allow Python only in explicit non-counted Workshop/exhibition paths while preserving Go orchestration and ranked/counted rejection.
</objective>

<tasks>

1. Harden Go runtime-service validation for exact Python runtime metadata through the existing envelope.
2. Add non-counted exhibition eligibility helpers that accept valid experimental Python without weakening counted gates.
3. Update exhibition creation UI/API to expose a normal unranked/non-counted mode and label Python as experimental.
4. Add tests proving Python is rejected from counted/ranked/ladder paths and fail-closed when runtime-service/registry mismatch occurs.

</tasks>

<verification>

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm --filter @cowards/persistence test`
- `pnpm --filter @cowards/web test`

</verification>

