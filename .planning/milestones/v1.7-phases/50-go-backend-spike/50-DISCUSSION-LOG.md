# Phase 50: Go Backend Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 50-Go Backend Spike
**Areas discussed:** First Go Endpoint, Data Source For The Spike, Web Integration Shape, Go Module Location And Lifecycle

---

## First Go Endpoint

| Option | Description | Selected |
| --- | --- | --- |
| Health + public MatchSet summary | Implement `/health` and read-only public MatchSet summary endpoint. | ✓ |
| Health + replay metadata/page data | Implement replay metadata/page data first. | |
| Health + analytics summary | Implement v1.6 analytics summary endpoint first. | |
| Health + fixture echo/validation endpoint | Serve fixture-compatible data without product endpoint. | |

**User's choice:** Health + public MatchSet summary.
**Notes:** Best balance of Phase 45 alignment, privacy sensitivity, web integration usefulness, and bounded complexity.

---

## Data Source For The Spike

| Option | Description | Selected |
| --- | --- | --- |
| Golden fixtures first | Go reads committed `packages/golden` MatchSet fixtures and serves API shape. | |
| Direct PostgreSQL read | Go connects to DB and reads needed MatchSet summary data. | |
| TypeScript service proxy | Go calls TypeScript service and re-serves response. | |
| Fixture first, optional direct DB stretch | Required fixture path, optional DB read after stable. | ✓ |

**User's choice:** Fixture first, optional direct DB stretch.
**Notes:** Fixtures prove DTO parity; DB access can prove schema access only if low risk.

---

## Web Integration Shape

| Option | Description | Selected |
| --- | --- | --- |
| Dev/test flag for MatchSet page read path | Explicit flag lets one MatchSet summary read come from Go; default remains TypeScript. | ✓ |
| Test-only client integration | Tests call Go service but app page never routes to it. | |
| No web integration in Phase 50 | Go service only has tests. | |
| Default web path calls Go | Make Go the default backend for the page. | |

**User's choice:** Dev/test flag for MatchSet page read path.
**Notes:** Proves integration without premature rewrite.

---

## Go Module Location And Lifecycle

| Option | Description | Selected |
| --- | --- | --- |
| `apps/go-backend` with explicit spike scripts | Go module under apps, documented `go test`/`go run`, optional lightweight scripts. | ✓ |
| `services/go-backend` | New top-level services convention. | |
| `packages/go-backend` | Treat executable service like package. | |
| No checked-in Go module | Script/prototype only. | |

**User's choice:** `apps/go-backend` with explicit spike scripts.
**Notes:** Clear app boundary and no over-integration.

| Option | Description | Selected |
| --- | --- | --- |
| Documented commands plus optional root script | Reproducible local commands and optional `pnpm verify:go-spike`. | ✓ |
| Full CI integration | Add Go tests to normal verify pipeline. | |
| No root wiring | Only local instructions in `apps/go-backend`. | |

**User's choice:** Documented commands plus optional root script.
**Notes:** Reproducible without pretending the spike is production infrastructure.

## the agent's Discretion

- Exact Go endpoint paths.
- Exact dev/test flag name.
- Whether optional root script is worth adding after checking toolchain friction.

## Deferred Ideas

- Go orchestration/writes/jobs/runtime execution.
- Full Go deployment/CI pipeline.
- Go as DTO authority.
- Full replay metadata/page data endpoint unless trivial.
