---
phase: 104-isolated-runtime-service-boundary-hardening
reviewed: 2026-05-24T18:21:32Z
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
