# Phase 97: Go Job Lifecycle and Persistence Contracts - Validation

**Validated:** 2026-05-24
**Nyquist status:** Compliant for lifecycle contract phase

## Test Infrastructure

| Layer | Tool | Command |
| --- | --- | --- |
| Go unit and skipped integration | Go test | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` |
| Go DB integration | Go test + local Postgres | `cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL='postgresql://cowards:cowards@localhost:5432/cowards_game' PATH=/usr/local/go/bin:$PATH go test ./...` |
| TypeScript worker guard | Vitest | `pnpm exec vitest run apps/worker/src/runner.test.ts` |
| Boundary imports | TSX script | `pnpm boundary:imports` |
| Patch hygiene | Git | `git diff --check` |

## Requirement Coverage

| Requirement | Automated/Artifact Coverage | Status |
| --- | --- | --- |
| ORCH-01 | DB integration claims queued jobs, prevents duplicate unexpired claims, and reclaims expired running jobs. | COVERED |
| ORCH-02 | DB integration verifies heartbeat rejects mismatched leases and accepts active leases only. | COVERED |
| ORCH-03 | DB integration verifies retry queueing, exhaustion, attempt updates, and Match `failed_system`; unit test verifies diagnostic redaction. | COVERED |
| ORCH-04 | Go SQL mirrors TypeScript oracle; TS worker tests exercise ABI-realistic runtime inputs after the ownership guard change. | COVERED |
| ORCH-05 | TS worker tests verify Go-selected and unspecified normal modes block before claim, explicit TypeScript normal ownership passes, and explicit rollback/test/parity modes pass. | COVERED |
| ORCH-06 | Summary documents no-fallback rollback sequencing and lease recovery behavior. | COVERED |
| ORCH-07 | `TestSanitizeMatchJobFailureDetails` verifies common private payloads are stripped from stored details. | COVERED |
| ORCH-08 | Go integration tests cover claim, empty allowlist idle, duplicate prevention, lease mismatch, expired reclaim, retry queueing, exhaustion, invalid lease failure recording, and terminal stale failure rejection. | COVERED |

## Manual-Only Items

No browser/UI validation is required for Phase 97. Full local topology validation remains for Phase 102 after runtime invocation, Match completion, scoring, and public evidence routing are Go-owned.
