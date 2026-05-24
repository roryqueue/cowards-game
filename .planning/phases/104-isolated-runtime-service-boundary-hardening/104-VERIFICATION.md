---
phase: 104-isolated-runtime-service-boundary-hardening
verified: 2026-05-24T18:44:42Z
status: passed
score: 7/7 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Full live web -> Go -> isolated runtime-service topology evidence was not collected during Phase 104 verification."
    addressed_in: "Phase 108 and Phase 109"
    evidence: "Phase 108 success criteria require strict no-TypeScript-backend topology and representative page-load smoke; Phase 109 success criteria require final v1.16 verification suite including topology strict mode and boundary monitors."
---

# Phase 104: Isolated Runtime Service Boundary Hardening Verification Report

**Phase Goal:** Developers can verify the runtime service is a narrow hostile-code execution service invoked by Go through a broker-ready Strategy Execution Service / Runtime Broker public runtime ABI contract and not a backend.
**Verified:** 2026-05-24T18:44:42Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | RT-01 broker-ready runtime boundary is inspectable. | VERIFIED | `.planning/artifacts/v1.16-runtime-service-boundary.json`, `.planning/artifacts/v1.16-runtime-service-boundary.md`, and `packages/spec/src/runtime-execution-service.ts` define Strategy Execution Service / Runtime Broker, HTTP+JSON binding, runtime ABI, schemas, limits, failure privacy, no-fallback, and future-broker replacement policy. |
| 2 | RT-02 JS/TS Strategy execution stays only in runtime service/runtime adapter boundary. | VERIFIED | `apps/runtime-service/src/execute-match.ts` calls `createRuntimeFromRevision` behind runtime-service request validation; `scripts/check-boundary-monitors.ts` scans 108 Go/web files for forbidden runtime execution imports. |
| 3 | RT-03 runtime service has no DB/job/API/public evidence/backend fallback authority. | VERIFIED | `apps/runtime-service/src/server.ts` exposes only `/health` and `/execute-match`; `/health` returns `backendAuthority:false`; runtime-service authority tests and monitors reject persistence, jobs, sessions, scoring, public evidence, and fallback markers. |
| 4 | RT-04 Go invokes through `runtime-execution-service-v1.15` and `strategy-runtime-abi-v1.14`. | VERIFIED | `apps/go-backend/runtime_service_client.go` hard-codes and validates both versions; spec metadata and monitor checks assert the same values. |
| 5 | RT-05 schemas/fail-closed behavior cover drift, malformed input, source mismatch, oversized payload, timeout, invalid output, diagnostics, privacy, and submission artifact checks. | VERIFIED | Runtime-service tests cover malformed requests, source hash/byte mismatch, oversized limits/body, runtime violations, execution exceptions, and invalid response schema. Go client tests cover timeout, stopped service, oversized response, unknown failure codes, non-contract fields, redaction, and source validation. |
| 6 | RT-06 Go and web/API do not import/evaluate/transpile/execute Strategy source or use Node `vm` as a hostile-code boundary. | VERIFIED | Direct grep found no forbidden execution markers outside `apps/runtime-service`/`packages/runtime-js`; `pnpm boundary:monitors` no-execution lane passed for 108 Go/web files. |
| 7 | RT-07 runtime readiness labels remain explicit and do not promote production sandbox or counted non-JS play. | VERIFIED | `packages/spec/src/runtime.ts` keeps worker-thread/subprocess/container/non-JS/WASM/WASI/component-model as readiness or evaluation labels; monitors enforce no Node `node:wasi` sandbox acceptance, no counted non-JS promotion, and no production sandbox replacement. |

**Score:** 7/7 truths verified

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
| --- | --- | --- | --- |
| 1 | Full live topology evidence for web -> Go -> runtime-service was not collected in this turn. | Phase 108 / Phase 109 | `pnpm boundary:monitors` passed non-live lanes, then failed live topology because local web, Go, runtime-service, and auth-gated endpoints were not running. Phase 108/109 own strict topology and final live suite. |

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `.planning/artifacts/v1.16-runtime-service-boundary.json` | Machine-readable boundary contract | VERIFIED | Contains required top-level sections and D-01..D-18 decision coverage. |
| `.planning/artifacts/v1.16-runtime-service-boundary.md` | Human-readable boundary contract | VERIFIED | Names Strategy Execution Service / Runtime Broker and labels current implementation as isolated JS/TS runtime service, not backend. |
| `packages/spec/src/runtime-execution-service.ts` | Runtime execution contract metadata/types | VERIFIED | Exports service version, ABI-linked contract metadata, authority policy, failure codes, and request/response types. |
| `apps/runtime-service/src/execute-match.ts` | Runtime request validation and execution boundary | VERIFIED | Parses schema, validates source hash/bytes, executes through runtime-js adapter, returns schema-valid success/failure. |
| `apps/runtime-service/src/server.ts` | Narrow HTTP binding | VERIFIED | Only `/health` and `/execute-match`; health carries boundary metadata and `backendAuthority:false`. |
| `apps/go-backend/runtime_service_client.go` | Go client contract boundary | VERIFIED | Validates request/source metadata, response version/ABI, closed failure-code enum, unknown fields, byte caps, timeout, redaction, and no fallback. |
| `scripts/check-boundary-monitors.ts` | Boundary drift monitor | VERIFIED | Checks artifact, runtime authority, no Go/web Strategy execution, ABI drift, non-JS/sandbox non-promotion, and topology. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `packages/spec/src/runtime-execution-service.ts` | `apps/runtime-service/src/execute-match.ts` | `RuntimeExecutionServiceRequestSchema` / `RuntimeExecutionServiceResponseSchema` | WIRED | Runtime service parses requests and responses against spec schemas. |
| `apps/go-backend/runtime_service_client.go` | `apps/runtime-service/src/server.ts` | HTTP+JSON `POST /execute-match` | WIRED | Go client posts to `/execute-match` and validates service contract/ABI response. |
| `.planning/artifacts/v1.16-runtime-service-boundary.json` | `scripts/check-boundary-monitors.ts` | `validateV116RuntimeServiceBoundaryArtifact` | WIRED | Monitor consumes the artifact and fails on naming, authority, privacy, ABI, no-fallback, and non-promotion drift. |
| `packages/spec/src/runtime.ts` | `scripts/check-boundary-monitors.ts` | adapter readiness / non-JS guardrails | WIRED | Monitor validates JS/TS adapter bridge readiness and experimental non-JS guardrails. |

### Data-Flow Trace

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| `apps/runtime-service/src/execute-match.ts` | `request.strategies` and `request.match` | RuntimeExecutionServiceRequestSchema-validated HTTP body | Yes | FLOWING |
| `apps/runtime-service/src/execute-match.ts` | runtime execution result | `buildChronicleFromMatch` using runtime-js adapter dispatch | Yes | FLOWING |
| `apps/go-backend/runtime_service_client.go` | `runtimeServiceResponse` / `runtimeServiceFailure` | HTTP response from runtime service | Yes, with strict decode/validation/redaction | FLOWING |
| `scripts/check-boundary-monitors.ts` | runtime boundary artifact | `.planning/artifacts/v1.16-runtime-service-boundary.json` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Spec boundary artifacts and D-01..D-18 coverage | `pnpm exec vitest run packages/spec/src/spec.test.ts` | 33 tests passed | PASS |
| OpenAPI/service contract remains current | `pnpm --filter @cowards/spec contract:check` | Exit 0 | PASS |
| Runtime boundary JSON has required sections | `node -e "...v1.16-runtime-service-boundary.json..."` | `artifact keys ok` | PASS |
| Runtime-service schema/redaction/HTTP tests | `pnpm exec vitest run apps/runtime-service/src/execute-match.test.ts apps/runtime-service/src/server.test.ts apps/runtime-service/src/redaction.test.ts` | 18 tests passed | PASS |
| Runtime-service typecheck | `pnpm --filter @cowards/runtime-service typecheck` | Exit 0 | PASS |
| Go runtime service client contract tests | `cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -run 'RuntimeServiceClient' -count=1` | Pass | PASS |
| Boundary monitor unit tests | `pnpm exec vitest run scripts/check-boundary-monitors.test.ts` | 7 tests passed | PASS |
| TypeScript backend inventory current | `pnpm typescript-backend:inventory:check` | Current | PASS |
| Full boundary monitors | `pnpm boundary:monitors` | Non-live lanes passed; live topology failed because services were not running | WARNING |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| RT-01 | 104-PLAN | Broker-ready runtime service boundary | SATISFIED | Contract metadata, JSON/markdown artifacts, spec tests. |
| RT-02 | 104-PLAN | JS/TS execution only inside runtime boundary | SATISFIED | Runtime-service execution path and no-execution monitor. |
| RT-03 | 104-PLAN | Runtime service is not backend authority | SATISFIED | Route allowlist, `backendAuthority:false`, authority scans. |
| RT-04 | 104-PLAN | Go invokes runtime service through fixed contract/ABI | SATISFIED | Go/spec constants and contract tests. |
| RT-05 | 104-PLAN | Schema, drift, failure, redaction, artifact checks | SATISFIED | Runtime-service and Go client tests. |
| RT-06 | 104-PLAN | No Go/web Strategy execution or Node `vm` boundary | SATISFIED | Monitor and direct grep evidence. |
| RT-07 | 104-PLAN | Readiness labels remain non-promoted | SATISFIED | Runtime registry and monitor guardrails. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `scripts/check-boundary-monitors.ts` | 1552 | `console.log` | INFO | CLI output only, expected for monitor script. |
| `packages/spec/src/runtime.ts` | 678, 720, 733 | `return null` | INFO | Intentional lookup/helper miss path, not a stub. |

### Human Verification Required

None for Phase 104. The live topology warning is explicitly deferred to Phase 108/109 and does not invalidate the Phase 104 runtime boundary contract.

### Gaps Summary

No Phase 104 blocking gaps found. The implementation achieves the runtime boundary hardening goal against RT-01 through RT-07 and D-01 through D-18. The only residual warning is live topology evidence, which requires running local services and is owned by later milestone gates.

---

_Verified: 2026-05-24T18:44:42Z_
_Verifier: the agent (gsd-verifier)_
