# Phase 135: Timeout, Latency, and Reliability Budget Model - Research

**Status:** Complete
**Date:** 2026-05-25

## Findings

- Go runtime-service HTTP timeout is already configurable via `COWARDS_RUNTIME_SERVICE_HTTP_TIMEOUT_MS` and defaults to 90 seconds.
- Strategy call caps are runtime-owned and should remain unchanged.
- Match job retry behavior is Go-owned in `apps/go-backend/job_lifecycle.go`.
- MatchSet degraded/running/complete status exists in Go and TypeScript persistence parity code.
- Phase 132 introduced the initial v1.20 budget artifact; Phase 135 should enrich it with measurement placeholders and local evidence expectations.

## Planning Implications

- Add artifact fields for local measurement evidence without forcing live signed-in proof yet.
- Keep budget names stable so UI/proof phases can display them.
- Add tests around retry/system failure classification rather than changing deterministic caps.
