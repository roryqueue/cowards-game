---
phase: 098-runtime-execution-service-boundary
reviewed: 2026-05-24T03:11:37Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - packages/spec/src/runtime-execution-service.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/index.ts
  - packages/spec/src/spec.test.ts
  - apps/runtime-service/package.json
  - apps/runtime-service/tsconfig.json
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/server.ts
  - apps/runtime-service/src/redaction.ts
  - apps/runtime-service/src/runtime-config.ts
  - apps/runtime-service/src/index.ts
  - apps/runtime-service/src/execute-match.test.ts
  - apps/go-backend/runtime_service_client.go
  - apps/go-backend/runtime_service_client_test.go
  - tsconfig.json
  - pnpm-lock.yaml
findings:
  critical: 3
  warning: 3
  info: 0
  total: 6
status: issues_found
---

# Phase 98: Code Review Report

**Reviewed:** 2026-05-24T03:11:37Z
**Depth:** deep
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the runtime execution service boundary, shared schemas, Go HTTP client, runtime-service package/config, and tests. The implementation keeps the TypeScript service DB-free in the reviewed source and preserves `strategy-runtime-abi-v1.14`, but the boundary is not ready to ship: valid self-play executions are rejected, Go tests do not exercise the actual TypeScript contract, and Go-side failure sanitization can leak sensitive values.

## Critical Issues

### CR-01: Valid Self-Play Matches Are Rejected By The v1.15 Request Schema

**File:** `packages/spec/src/schemas.ts:1879`
**Issue:** `RuntimeExecutionMatchInputSchema` rejects requests where `bottomStrategyRevisionId === topStrategyRevisionId`. The engine/runtime stack already supports this shape; `packages/runtime-js/src/integration.test.ts` runs a Match with the same Strategy Revision id on both sides. This blocks self-play, mirror/parity drills, and any MatchSet row where the same immutable revision legitimately appears in both slots. The failure is classified as `MALFORMED_REQUEST`, so runtime execution never starts.
**Fix:**
```ts
// Keep the player-id distinction if required, but allow the same revision
// to occupy both sides.
if (match.bottomPlayerId === match.topPlayerId) {
  ctx.addIssue({
    code: "custom",
    path: ["topPlayerId"],
    message: "bottomPlayerId and topPlayerId must differ",
  })
}
```
Add a schema/service test that builds one `StrategyRevision` and submits it as both `strategies.bottom` and `strategies.top`.

### CR-02: Go Client Tests Pass With Requests The TypeScript Service Would Reject

**File:** `apps/go-backend/runtime_service_client_test.go:179`
**Issue:** `validRuntimeServiceRequestForTest` is not a valid `runtime-execution-service-v1.15` request: the arena only has `id` (`:200`), runtime metadata only has `abiVersion` (`:189`), validation only has `valid` (`:191`), limits omit required fields (`:206`), and both strategy objects use id `strategy-revision:test` (`:185`) while the Match references `strategy-revision:bottom` and `strategy-revision:top` (`:203-204`). The fake HTTP server still returns success, and `validateRuntimeServiceRequest` only checks a shallow subset in `apps/go-backend/runtime_service_client.go:152`, so the Go suite proves behavior against a contract the real TypeScript service rejects.
**Fix:** Replace the hand-written fake request with a full golden fixture that is parsed by `RuntimeExecutionServiceRequestSchema` in TypeScript and unmarshaled by Go. Extend `validateRuntimeServiceRequest` to fail before transport when Match revision ids do not match the supplied Strategy Revision ids and when required arena/runtime/validation/limit fields are absent.

### CR-03: Go Failure Sanitization Allows Sensitive Scalar Values Through

**File:** `apps/go-backend/runtime_service_client.go:237`
**Issue:** Service failure details are delegated to `sanitizeMatchJobFailureDetails`, which allowlists keys such as `cause`, `status`, and nested `strategyExecutionSystemFailureDetails.cause` but copies scalar values without redacting them. `redactRuntimeServiceMessage` is also case-sensitive and misses lower-case keys like `strategyMemory`/`soldierMemory` (`apps/go-backend/runtime_service_client.go:241`). A runtime-service failure containing `{"cause":"export default ... strategyMemory ..."}` or a lower-case memory marker in `message` would survive Go sanitization and could be persisted through the job-failure lifecycle.
**Fix:**
```go
func redactRuntimeServiceMessage(message string) string {
	lower := strings.ToLower(message)
	for _, forbidden := range []string{
		"export default", "strategymemory", "soldiermemory",
		"objectivepayload", "objective payload", "stderr",
		"stack", "database_url", "postgres://", "postgresql://",
	} {
		if strings.Contains(lower, forbidden) {
			return "Runtime execution service failed with redacted diagnostics"
		}
	}
	return message
}
```
Apply the same redaction to every allowed string value in `sanitizeRuntimeServiceDetails` before returning it, and add a Go test with lower-case private markers inside both `message` and `diagnostics.cause`.

## Warnings

### WR-01: Success Responses Carry Private Runtime State Without An Explicit Internal-Only Guard

**File:** `packages/spec/src/runtime-execution-service.ts:63`
**Issue:** The success contract includes `strategyMemory` on players and `Soldier[]` with `soldierMemory` in `finalState` (`packages/spec/src/schemas.ts:1924`, `packages/spec/src/schemas.ts:1956`), and `executeParsedRequest` returns raw `chronicle` plus raw `finalState` (`apps/runtime-service/src/execute-match.ts:201`). `ChronicleSchema` also permits `private` sections. This may be intended for Go-owned persistence, but the contract does not mark the payload as internal/private or provide a leak-safe public projection. That makes accidental logging or public replay reuse much easier.
**Fix:** Either rename/split the result into explicit private/internal fields or return a public-safe projection by default and put private replay sections behind a separately named owner-private payload. Add a contract test using the existing private markers to assert no public/default response path contains `strategyMemory`, `soldierMemory`, `objective`, or `objectivePayload`.

### WR-02: Request-Controlled Runtime Limits Are Unbounded

**File:** `packages/spec/src/schemas.ts:1903`
**Issue:** The service accepts any positive `StrategyRuntimeLimits` and passes `request.limits.timeoutMs` and `request.limits.stdoutBytes` directly into `createRuntimeFromRevision` (`apps/runtime-service/src/execute-match.ts:176`). A caller can request extremely large timeouts or output caps and tie up the runtime-service process. This is a resource-control boundary, not just a preference, because the service executes hostile Strategy code.
**Fix:** Add service-side maximums and clamp or reject values above them, for example `timeoutMs <= DEFAULT_RUNTIME_LIMITS.timeoutMs` and `stdoutBytes <= DEFAULT_RUNTIME_LIMITS.stdoutBytes`, regardless of what the caller submits. Cover oversized limits with request-schema and service tests.

### WR-03: Runtime Service Defaults To The Local-Dev Worker-Thread Adapter

**File:** `apps/runtime-service/src/runtime-config.ts:9`
**Issue:** The dedicated runtime service defaults to `"worker-thread"` (`:9`, `:37-39`). The adapter metadata labels this boundary a local-dev fallback and states it is not production-grade hostile-code isolation. For a service whose purpose is to run hostile Strategy code behind a process boundary, silently defaulting to that adapter risks deploying the weakest isolation path in normal topology.
**Fix:** Require `STRATEGY_EXECUTION_ADAPTER` to be set for the runtime-service process, or default only in an explicit local-dev mode. Production/topology checks should fail closed unless the chosen adapter is the intended service isolation boundary.

---

_Reviewed: 2026-05-24T03:11:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## Resolution

All review findings were fixed:

- CR-01: `RuntimeExecutionMatchInputSchema` now allows the same Strategy Revision id on both sides while preserving distinct player ids; runtime-service tests cover self-play.
- CR-02: added `packages/spec/artifacts/runtime-execution-service-request.v1.15.json`, parsed by TypeScript schema tests and Go client tests; Go request validation now checks revision ids, arena shape, runtime metadata, validation metadata, and limits before transport.
- CR-03: Go runtime-service failure sanitization now redacts private markers case-insensitively in messages and allowed diagnostic string values.
- WR-01: success responses now mark the result payload as `privacy: "internal_runtime_result"` to avoid treating raw Chronicle/final-state payloads as public output.
- WR-02: request-controlled runtime limits are bounded by `DEFAULT_RUNTIME_LIMITS`.
- WR-03: runtime-service startup now requires an explicit `STRATEGY_EXECUTION_ADAPTER`, with local worker-thread fallback allowed only through an explicit local-dev flag.

Verification after fixes:

- `pnpm --filter @cowards/spec typecheck && pnpm --filter @cowards/spec lint && pnpm --filter @cowards/spec test`
- `pnpm --filter @cowards/runtime-service typecheck && pnpm --filter @cowards/runtime-service lint && pnpm --filter @cowards/runtime-service test && pnpm --filter @cowards/runtime-service build`
- `pnpm exec tsc -b --pretty false`
- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...`
- `pnpm boundary:imports`
- `pnpm exec tsx scripts/check-boundary-monitors.ts`
- `STRATEGY_EXECUTION_ADAPTER=worker-thread pnpm --filter @cowards/runtime-service start`
- `curl -sS http://127.0.0.1:3107/health`
- `git diff --check`
