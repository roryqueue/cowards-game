---
phase: 104-isolated-runtime-service-boundary-hardening
reviewed: 2026-05-24T18:25:50Z
depth: deep
files_reviewed: 16
files_reviewed_list:
  - packages/spec/src/runtime-execution-service.ts
  - packages/spec/src/runtime.ts
  - packages/spec/src/spec.test.ts
  - packages/spec/src/schemas.ts
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/execute-match.test.ts
  - apps/runtime-service/src/redaction.ts
  - apps/runtime-service/src/redaction.test.ts
  - apps/runtime-service/src/server.ts
  - apps/runtime-service/src/server.test.ts
  - apps/go-backend/runtime_service_client.go
  - apps/go-backend/runtime_service_client_test.go
  - apps/go-backend/orchestrator.go
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-local-topology.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 104: Code Review Report

**Reviewed:** 2026-05-24T18:21:32Z
**Depth:** deep
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed Phase 104 commits `1844116`, `9051aba`, `3e7b173`, `8469463`, `c7d745d`, `bd8d0a2`, and `250e90f` from `490fe00..HEAD`, plus the runtime-service and Go call chain that consumes these boundaries. The TS runtime-service response path is mostly fail-closed, but the Go runtime service client still accepts unsafe failure text from the runtime boundary and can persist private markers that Phase 104 explicitly says must be denied.

Residual live topology risk is separate from the finding below: `104-VALIDATION.md` records `pnpm boundary:monitors` as partial because local web, Go, runtime-service, and auth-gated endpoints were not running. That remains an evidence gap even after this blocker is fixed.

## Critical Issues

### CR-01: Go Runtime Failure Redaction Misses D-17 Private Markers

**Classification:** BLOCKER

**File:** `apps/go-backend/runtime_service_client.go:254`

**Issue:** Phase 104 adds `TestRuntimeServiceClientSanitizesServiceFailure`, but the test only puts `sessionId`, `ownerDebug`, `mysql://...`, and `privateRuntimeInternals` in `diagnostics`, where `sanitizeMatchJobFailureDetails` drops those keys before `redactRuntimeServiceMessage` is exercised. The actual sanitizer still returns `failure.ErrorMessage` and `failure.PublicMessage` unchanged unless they match the narrower list at `apps/go-backend/runtime_service_client.go:268`. That list omits required D-17 markers including `session`, `owner debug` / `ownerDebug`, `mysql://`, and `private runtime internals`.

This crosses the runtime service trust boundary. A malformed, compromised, or drifted runtime service can return a schema-shaped `systemFailure` whose `message` is `sessionId=abc ownerDebug=... mysql://user:pass@host/db`; Go accepts it at `apps/go-backend/runtime_service_client.go:145`, sanitizes it without redaction, and then persists `failure.ErrorMessage` through `apps/go-backend/orchestrator.go:102-107`. That violates RT-05 / D-17 fail-closed redaction for unsafe diagnostics.

**Fix:**

Extend Go-side message redaction to cover the same D-17 denylist used by the TS service and add a test where the unsafe markers appear in `Code`, `message`, and `publicMessage`, not only in dropped diagnostics. The code should fail safe by replacing the entire message when any private marker is present.

```go
func redactRuntimeServiceMessage(message string) string {
	lower := strings.ToLower(message)
	for _, forbidden := range []string{
		"export default",
		"strategy source",
		"strategymemory",
		"soldiermemory",
		"objectivepayload",
		"objective payload",
		"ownerdebug",
		"owner debug",
		"raw awareness grid",
		"awareness grid",
		"stderr",
		"stack",
		"session",
		"database_url",
		"postgres://",
		"postgresql://",
		"mysql://",
		"token",
		"private runtime internals",
		"/users/",
		"/home/",
		"/tmp/",
	} {
		if strings.Contains(lower, forbidden) {
			return "Runtime execution service failed with redacted diagnostics"
		}
	}
	return message
}
```

Add a focused regression in `apps/go-backend/runtime_service_client_test.go` that returns a service failure with unsafe `message` and `publicMessage` values such as `sessionId`, `ownerDebug`, `mysql://...`, and `private runtime internals`, then assert `runtimeServiceFailureJSONSafe(failure)` contains none of the D-17 markers. Consider also normalizing unknown runtime-service failure codes to a known Go-side class unless the service code is one of the runtime execution contract codes.

---

_Reviewed: 2026-05-24T18:21:32Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_

## Re-Review: Fix Commit `0ca962f`

**Reviewed:** 2026-05-24T18:25:50Z
**Depth:** deep
**Files Re-Reviewed:** 16 Phase 104 touched source files, with focused inspection of `apps/go-backend/runtime_service_client.go` and `apps/go-backend/runtime_service_client_test.go`
**Fix Commit:** `0ca962f387ce46c23a67a6783a87a4d707221d49`
**Status:** issues_found

### Summary

The fix commit closes the original message-field leak for `systemFailure.message` and `systemFailure.publicMessage`: both fields now pass through `redactRuntimeServiceMessage`, and `TestRuntimeServiceClientSanitizesServiceFailure` puts D-17 markers directly in those fields instead of only in dropped diagnostics.

However, the runtime service `systemFailure.code` remains trusted free text in the Go client. The TypeScript contract defines a closed failure-code enum, but the Go response path never validates that enum before persisting `failure.Code` as both `error_class` and `strategyExecutionSystemFailureCode`. The original blocker is therefore only partially fixed.

### Verification Run

- `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient' -count=1` - PASS
- `pnpm exec vitest run apps/runtime-service/src/redaction.test.ts apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts` - PASS
- `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` - PASS

### CR-01: Runtime Service Failure Code Still Bypasses Redaction and Contract Validation

**Classification:** BLOCKER

**File:** `apps/go-backend/runtime_service_client.go:243`

**Issue:** `sanitizeRuntimeServiceFailure` still copies `failure.Code` into `Code` and `ErrorClass` without validating it against `RUNTIME_EXECUTION_SERVICE_SYSTEM_FAILURE_CODES` or applying the D-17 private marker denylist. The fix only redacts `failure.ErrorMessage` and `failure.PublicMessage` at `apps/go-backend/runtime_service_client.go:254-255`.

A drifted or compromised runtime service can return a struct-shaped JSON object with a private marker in `systemFailure.code`, for example `sessionId=abc ownerDebug=mysql://...`, while using safe message text. Go accepts the failure at `apps/go-backend/runtime_service_client.go:145-147`; `orchestrator.go` then persists that untrusted code through `ErrorClass: failure.Code` and `strategyExecutionSystemFailureCode: failure.Code` at `apps/go-backend/orchestrator.go:102-112`. That still violates D-17 / RT-05 because private runtime/session/database material can cross the service boundary and be stored in job failure state.

The new regression test does not catch this because it keeps `Code: "SubprocessSystemFailure"` at `apps/go-backend/runtime_service_client_test.go:206` and only injects private markers into message fields.

**Fix:**

Validate service-provided failure codes against the runtime execution service enum before persistence, and replace unsafe or unknown codes with a safe Go-side class such as `RuntimeServiceMalformedResponse` or `RuntimeServiceSystemFailure`. Keep the D-17 marker check on code text as defense in depth.

```go
func sanitizeRuntimeServiceFailureCode(code string) string {
	if code == "" || redactRuntimeServiceMessage(code) != code {
		return "RuntimeServiceMalformedResponse"
	}
	switch code {
	case "MALFORMED_REQUEST",
		"SOURCE_HASH_MISMATCH",
		"SOURCE_BYTES_MISMATCH",
		"UNSUPPORTED_RUNTIME_ADAPTER",
		"EXECUTION_EXCEPTION",
		"RESPONSE_SCHEMA_INVALID":
		return code
	default:
		return "RuntimeServiceMalformedResponse"
	}
}

func sanitizeRuntimeServiceFailure(failure runtimeServiceFailure) runtimeServiceFailure {
	code := failure.Code
	if code == "" {
		code = failure.ErrorClass
	}
	code = sanitizeRuntimeServiceFailureCode(code)
	return runtimeServiceFailure{
		Code:          code,
		ErrorClass:    code,
		ErrorMessage:  redactRuntimeServiceMessage(failure.ErrorMessage),
		PublicMessage: redactRuntimeServiceMessage(failure.PublicMessage),
		Retryable:     failure.Retryable,
		Details:       sanitizeRuntimeServiceDetails(failure.Details),
	}
}
```

Update the Go regression so the mocked runtime service returns unsafe markers in `code`, `message`, and `publicMessage`, then assert `runtimeServiceFailureJSONSafe(failure)` contains none of the D-17 markers and that `failure.Code` is a safe known value.

---

_Re-reviewed: 2026-05-24T18:25:50Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
