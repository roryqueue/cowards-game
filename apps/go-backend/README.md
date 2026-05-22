# Coward's Game Go Backend Spike

This is a deliberately small v1.7 backend boundary spike. It proves a Go service can return DTO envelopes compatible with `SERVICE_API_VERSION` without taking over orchestration or Strategy execution.

Endpoints:

- `GET /health`
- `GET /public/matchsets/{matchSetId}/summary`
- `GET /public/replays/{matchId}/metadata`

Run locally when Go is installed:

```sh
go test ./...
go run .
```

The default address is `127.0.0.1:8087`; override it with `COWARDS_GO_BACKEND_ADDR`.
