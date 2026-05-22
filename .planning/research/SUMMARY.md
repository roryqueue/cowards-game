# Research Summary: v1.7 Runtime and Backend Boundary Stabilization

**Date:** 2026-05-22
**Milestone:** v1.7 Runtime and Backend Boundary Stabilization

## Summary

v1.7 should be a contract-first, parity-first milestone. The existing TypeScript architecture is already decomposed well enough to avoid a rewrite: `@cowards/spec` can own service DTOs, runtime ABI schemas, adapter registry metadata, compatibility keys, and golden fixture validation while the existing web, worker, engine, replay, runtime-js, and persistence packages continue to do their current jobs.

## Stack Additions

- Extend `@cowards/spec` with service API DTO schemas, runtime ABI envelopes, adapter/language metadata, version negotiation, and privacy guards.
- Add golden fixtures under `packages/spec` and/or `packages/test-utils` for boundary parity.
- Add a typed service/client facade so Next route handlers and pages move away from direct persistence imports.
- Use standard Go first for the backend spike: `net/http`, `encoding/json`, and direct fixture/schema parity tests; add database access only for a narrow read-only endpoint.
- Use Python as the likely non-JS runtime spike for user reach unless the user chooses Go for backend/runtime symmetry.

## Feature Table Stakes

- Service Boundary Contract covering auth/session, Strategy Revisions, MatchSets, replay DTOs, analytics profiles/runs/exports, ladders, public pages, and health.
- Strategy Runtime ABI covering input JSON, output JSON, source/package metadata, memory/objective limits, timeouts, runtime violations, system failures, version negotiation, and deterministic capability restrictions.
- Golden Parity Harness covering engine outcomes, Chronicle projection, scoring, MatchSet summaries, analytics summaries, replay deep links, exports, runtime failures, privacy redaction, and deterministic ordering.
- Runtime Adapter Registry with language/runtime adapter metadata on Strategy Revisions and compatibility checks in MatchSets/analytics.
- One experimental second-language runtime spike through the same ABI.
- Minimal read-only Go backend spike against the frozen API shape.

## Recommended Build Order

1. Service Boundary Contract.
2. Strategy Runtime ABI.
3. Golden Parity Harness.
4. Runtime Adapter Registry.
5. One Non-JS Runtime Spike.
6. Go Backend Spike.

This order matches the user's proposed phase list and keeps the irreversible-looking spikes behind contracts and parity evidence.

## Decisions To Discuss During Phase Context

- Service contract source of truth: schema-first TypeScript with optional OpenAPI export versus OpenAPI-first.
- Service facade depth: route-level wrapper only versus shared service package with future remote-client shape.
- Runtime ABI source shape: raw source only versus source plus package metadata now.
- Runtime version negotiation strictness: fail-closed on any mismatch versus compatibility ranges.
- Golden fixture comparison mode: parsed canonical DTO equality versus byte-for-byte artifacts where hashes matter.
- Second runtime choice: Python for player reach versus Go for backend/runtime symmetry.
- Go backend first endpoint: health plus public MatchSet summary, replay metadata, or analytics summary.

## Watch Outs

- Do not rewrite orchestration in Go during v1.7.
- Do not weaken privacy boundaries while adding DTOs.
- Do not let the non-JS runtime spike imply production sandbox readiness.
- Do not compare raw JSON bytes unless serialization is part of the contract.
- Do not invoke runtime subprocesses through a shell or with inherited environment by default.

## Sources

- Go `encoding/json`: https://pkg.go.dev/encoding/json
- Go `net/http`: https://pkg.go.dev/net/http
- Python `subprocess`: https://docs.python.org/3/library/subprocess.html
- OpenAPI Specification: https://spec.openapis.org/oas/
