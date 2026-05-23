# Coward's Game Go Read-Only Backend

This is a deliberately small read-only backend boundary. It proves a Go service can serve DTO envelopes from generated TypeScript parity fixtures without taking over orchestration, persistence ownership, or Strategy execution.

Endpoints:

- `GET /health`
- `GET /public/matchsets/{matchSetId}/summary`
- `GET /public/replays/{matchId}/metadata`
- `GET /public/strategies/{strategyId}`
- `GET /analytics/runs/{runId}/summary` with an operator-configured bearer token mapped to the fixture owner

The service loads committed fixture JSON from `testdata/service-fixtures`, validates the top-level DTO shape, checks every served file against the TypeScript-generated `fixture-manifest.json` SHA-256 manifest, and rejects fixtures containing canonical private service fields before serving. Regenerate and check those fixtures from the repository root:

```sh
pnpm go:parity:generate
pnpm go:parity
```

Run locally when Go is installed:

```sh
go test ./...
go run .
```

The default address is `127.0.0.1:8087`; override it with `COWARDS_GO_BACKEND_ADDR`.
The default fixture directory is `testdata/service-fixtures`; override it with `COWARDS_GO_BACKEND_FIXTURE_DIR`.
Owner-scoped analytics reads are disabled until a bearer token is configured with `COWARDS_GO_BACKEND_OWNER_TOKENS`, using comma-separated `token=ownerUserId` pairs. The token resolves a viewer identity locally; callers cannot authorize by sending an owner id header.

## Ownership Boundary

Go remains read-only. TypeScript still owns auth mutation, Strategy submission, Strategy source retrieval, MatchSet creation, Match orchestration, job claiming, migrations, persistence writes, and Strategy execution. The analytics summary endpoint is owner-scoped parity evidence only; the Go service requires a locally configured bearer-token identity for that route and does not promote a public analytics product route.
