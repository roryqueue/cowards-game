---
phase: 110-broker-registry-baseline-and-contract-hardening
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/spec/src/runtime.ts
  - packages/spec/src/runtime-execution-service.ts
  - packages/spec/src/spec.test.ts
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/execute-match.test.ts
  - apps/go-backend/runtime_service_client.go
  - apps/go-backend/runtime_service_client_test.go
  - .planning/artifacts/v1.17-runtime-broker-registry.json
  - .planning/artifacts/v1.17-runtime-broker-registry.md
autonomous: true
requirements: [BASE-01, BASE-02, BASE-03, BASE-04, BASE-05, BROKER-01, BROKER-02, BROKER-03, BROKER-04, BROKER-05, BROKER-06]
---

<objective>
Make the Runtime Broker registry concrete while preserving the v1.16 backend-retirement topology.
</objective>

<tasks>

1. Add a v1.17 broker registry contract in spec code that records language id/version, runtime target, adapter version, transport binding, limits, package policy, readiness, health/readiness semantics, and counted eligibility.
2. Generate `.planning/artifacts/v1.17-runtime-broker-registry.json` and `.md` as monitor-readable and human-readable evidence.
3. Refactor runtime-service selection behind a single broker/registry function that accepts JS/TS and fails closed on unknown language, unsupported adapter, ABI drift, or registry mismatch.
4. Add contract tests in spec, runtime-service, and Go client code proving exact registry matching and no fallback.
5. Preserve JS/TS runtime behavior and v1.16 topology labels.

</tasks>

<verification>

- `pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-service test`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`

</verification>

