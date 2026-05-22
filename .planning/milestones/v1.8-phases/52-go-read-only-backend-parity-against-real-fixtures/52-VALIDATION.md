---
phase: 52
slug: go-read-only-backend-parity-against-real-fixtures
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-22
last_verified: 2026-05-22T21:15:00-04:00
---

# Phase 52 — Validation Strategy

## Test Infrastructure

| Property | Value |
|---|---|
| Framework | Go `testing`; Vitest for TypeScript fixture/schema checks |
| Quick run command | `pnpm go:parity` |
| Full phase command | `pnpm go:parity && pnpm --filter @cowards/service test && pnpm --filter @cowards/spec test` |

## Per-Task Verification Map

| Task | Requirement | Automated Command | Status |
|---|---|---|---|
| Fixture generation and schema checks | GO-01, GO-03, GO-06 | `pnpm go:parity:generate && pnpm go:parity` | pass — fixtures regenerated, stale check passed, Go parity passed |
| TypeScript service analytics summary | GO-02, GO-03 | `pnpm --filter @cowards/service test` | pass — 8 service tests passed |
| Go read-only server parity | GO-01, GO-02, GO-03, GO-04, GO-06 | `pnpm go:parity` | pass — Go HTTP responses matched generated TypeScript service fixtures; mutation verbs failed closed; unauthenticated owner-route lookups fail before resource lookup; fixture override privacy/schema/checksum negatives passed, including an override that updates its copied manifest |
| Documentation | GO-05 | `rg -n 'TypeScript-owned|Strategy execution|persistence writes' apps/go-backend/README.md` | pass — README lists retained TypeScript ownership and local Go auth/fixture semantics |

## Additional Verification

| Command | Result |
|---|---|
| `pnpm --filter @cowards/spec test` | pass — 28 spec/schema/contract tests passed |
| `pnpm typecheck` | pass — 12 package typechecks passed |
| `pnpm contract:check && pnpm contract:lint && pnpm boundary:imports` | pass — OpenAPI artifact fresh and lint-valid; strict boundary offenses 0, report-only existing app debt 41 |

## Validation Sign-Off

- [x] All tasks have automated verification.
- [x] Go mutation/read-only guard has explicit tests.
- [x] Privacy checks cover degraded/system-failed fixture data.
- [x] Owner analytics reads require a configured bearer token identity rather than a caller-supplied owner id.
- [x] Fixture override tests fail startup for malformed DTO shapes, canonical private service keys, checksum drift from TypeScript-generated fixtures, and self-updated override manifests that do not match the embedded Go checksum reference.
- [x] Feedback latency is under 120 seconds for focused checks.
