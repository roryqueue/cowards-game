---
phase: 244-account-revision-provider-proof-and-entry-gates
verified: 2026-06-15T00:01:55Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 4/5
  gaps_closed:
    - "Go and persistence eligibility outcomes now agree for TypeScript provider proof by requiring private sourceArtifact.bytesBase64 on Go account-save/readiness and persistence competition/ladder paths while keeping runtime-service public validation metadata redacted by default."
    - "Private sourceArtifact.bytesBase64 now requires internal runtime-service authorization; unauthorized includePrivateArtifact requests return a public-safe 403 response without source or artifact bytes."
    - "Go now treats runtime-service 403 private artifact authorization failure as a fail-loud RuntimeServicePrivateArtifactUnauthorized failure before account-save draft assembly or insert can run."
  gaps_remaining: []
  regressions: []
human_verification: []
---

# Phase 244: Account Revision Provider-Proof and Entry Gates Verification Report

**Phase Goal:** Users can save and enter account-owned Strategy Revisions only under honest provider-proof-backed readiness states.
**Verified:** 2026-06-15T00:01:55Z
**Status:** passed
**Re-verification:** Yes - after audit-fix closure of TypeScript `bytesBase64` Go/persistence parity blocker, private artifact authorization fix, and Go 403 fail-loud fix.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can save an execution-ready TypeScript account-owned Strategy Revision through Go only when runtime-service/provider validation supplies current proof matching source/artifact identity and engine/runtime compatibility. | VERIFIED | `apps/go-backend/live_backend.go:563` routes account saves through `runtime.validateStrategy`; the Go client requests private artifact evidence with `includePrivateArtifact: true` and sends `x-cowards-private-artifact-token` only when `COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN` is configured (`apps/go-backend/runtime_service_client.go:193`, `apps/go-backend/runtime_service_client.go:214`). Runtime-service 403 is classified as `RuntimeServicePrivateArtifactUnauthorized` (`apps/go-backend/runtime_service_client.go:233`), and account save returns on any validation failure before `accountRevisionInsertFromProviderValidation` or `insertAccountRevision` can run (`apps/go-backend/live_backend.go:586`). |
| 2 | User can distinguish provider-validated execution-ready revisions from invalid revisions, unavailable/system states, and explicitly allowed non-execution draft storage with no readiness or eligibility claim. | VERIFIED | `classifyRevisionReadiness` still separates execution-ready, invalid, non-execution draft, and unavailable states. The re-verification test matrix now includes `D-02 TypeScript provider proof with private artifact bytes is execution ready` and `D-04 public-redacted artifact identity is not execution ready` in `apps/go-backend/provider_readiness_test.go:33` and `apps/go-backend/provider_readiness_test.go:47`. |
| 3 | User cannot enter counted Go exhibitions, persistence competitions, or ladder paths unless TypeScript, Python, Rust, and Zig revisions have current provider-grade proof where execution readiness is required. | VERIFIED | Go `sourceArtifactProviderValidationMatches` now requires `bytesBase64`, decodes it, checks byte length, and hashes it before accepting source-artifact proof (`apps/go-backend/live_backend.go:2652`). Persistence competition and ladder already require the same private bytes shape, and tests now prove TypeScript public-redacted artifacts are rejected. |
| 4 | User cannot use unsupported providers, hidden TinyGo, stale/missing/mismatched artifacts, incompatible runtime metadata, non-`none` package mode, invalid owner/revision state, or silent fallback to pass non-counted exhibition gates. | VERIFIED | Quick regression: existing Go provider/readiness and entry-gate tests pass. `runtimeAllowsNonCountedExhibition` still delegates to the same proof matchers as counted play for provider languages, so public-redacted TypeScript metadata is not promoted through the non-counted path. |
| 5 | Go and persistence eligibility outcomes agree across eligible, draft, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, package-declared, unavailable-runtime, and TinyGo cases, with public-safe errors by default. | VERIFIED | Prior parity blocker remains closed and the private artifact surface is authorization-gated. Runtime-service public validation redacts `sourceArtifact.bytesBase64` and `compiledArtifact.bytesBase64` (`apps/runtime-service/src/server.ts:143`). Private bytes are returned only after `includePrivateArtifact` passes `privateArtifactRequestAuthorized`, which requires a configured token and timing-safe matching header (`apps/runtime-service/src/server.ts:98`, `apps/runtime-service/src/server.ts:347`). Unauthorized private artifact requests return 403 without source or `bytesBase64` (`apps/runtime-service/src/server.test.ts:149`); Go converts that 403 into non-retryable `RuntimeServicePrivateArtifactUnauthorized`, so it fails loud instead of flowing into non-execution draft assembly (`apps/go-backend/runtime_service_client_test.go:155`). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `apps/runtime-service/src/server.ts` | Public default redaction plus internally authorized private artifact response | VERIFIED | `publicValidationMetadata` removes `bytesBase64` from source/compiled artifacts by default. `includePrivateArtifact === true` is honored only when `x-cowards-private-artifact-token` matches the configured private artifact token via `timingSafeEqual`; otherwise the handler returns 403 before emitting metadata. |
| `apps/runtime-service/src/server.test.ts` | Runtime-service redaction/private authorization coverage | VERIFIED | Default TypeScript validation asserts no `bytesBase64`; unauthorized private request asserts 403 and no source/`bytesBase64`; authorized private request asserts `sourceArtifact.bytesBase64` exists and source text is still not echoed. |
| `apps/runtime-service/src/redaction.ts` / `apps/runtime-service/src/redaction.test.ts` | Runtime-service diagnostic redaction includes credential-like tokens | VERIFIED | Redaction patterns now cover OpenAI-style keys, GitHub tokens, and JWT-like tokens; tests assert those markers are removed from serialized diagnostics and thrown error messages. |
| `apps/go-backend/runtime_service_client.go` | Go account-save validation asks runtime-service for private artifact material with internal token and fails loud on unauthorized 403 | VERIFIED | `validateStrategy` request body includes `includePrivateArtifact: true` for provider source validation, sends `x-cowards-private-artifact-token` when `COWARDS_RUNTIME_SERVICE_PRIVATE_ARTIFACT_TOKEN` is configured, and maps HTTP 403 to `RuntimeServicePrivateArtifactUnauthorized` before decoding a validation body. |
| `apps/go-backend/live_backend.go` | Go provider-proof matchers require private artifact bytes | VERIFIED | `sourceArtifactProviderValidationMatches` and `rustProviderValidationMatches` now fail if artifact `bytesBase64` is missing, malformed, size-mismatched, or hash-mismatched. |
| `apps/go-backend/provider_readiness_test.go` | Go readiness rejects public-redacted TypeScript metadata | VERIFIED | Test matrix accepts private TypeScript artifact bytes and rejects public-redacted artifact identity as `provider_proof_mismatched`. |
| `packages/persistence/src/competition.test.ts` / `packages/persistence/src/ladder.test.ts` | Persistence parity tests require private TypeScript artifact bytes | VERIFIED | New tests accept private bytes-bearing metadata and reject the same metadata after `bytesBase64` is removed. |
| `.planning/artifacts/v1.35-account-provider-entry-proof.{md,json}` | Phase proof artifacts reflect private/public artifact split | VERIFIED | Proof artifacts now state Go account-save requests private artifact material while public/default validation remains redacted; monitor check passes. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `createStrategyRevision` | Go runtime-service client | `runtime.validateStrategy(... body.SourceFormat, body.Source, body.StrategyID)` | WIRED | Account save still calls the runtime-service validation boundary before insert and returns immediately on any failure (`apps/go-backend/live_backend.go:586`), so a 403 authorization failure cannot reach draft assembly or `insertAccountRevision`. |
| Go runtime-service client | Runtime-service private validation | JSON request field `includePrivateArtifact: true` plus optional internal token header | WIRED | Client sends the private artifact request and test asserts both `includePrivateArtifact` and `x-cowards-private-artifact-token` (`apps/go-backend/runtime_service_client_test.go:88`, `apps/go-backend/runtime_service_client_test.go:95`). |
| Runtime-service validation | Public/private metadata contract | Authorization check before `validateStrategyRequest(... includePrivateArtifact)` | WIRED | Default public responses redact artifact bytes; unauthorized private requests return 403 without metadata bytes; authorized private account-save responses include bytes. |
| Go account-save assembly | Go readiness classifier | `accountRevisionInsertFromProviderValidation` then `classifyRevisionReadiness` | WIRED | Metadata from the validation response, including private artifact bytes when returned, is cloned into the insert payload before classification (`apps/go-backend/live_backend.go:651`). |
| Go proof matcher | Persistence proof matcher | Shared requirement that TypeScript `sourceArtifact.bytesBase64` must be present and hash-valid | WIRED | Go and persistence now agree that public-redacted artifact metadata is not execution-ready/counted-eligible. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| Runtime-service default validation | `responseMetadata` | `publicValidationMetadata(metadata)` | Yes - returns provider proof identity but strips raw artifact bytes | FLOWING |
| Runtime-service private validation | `responseMetadata` | `metadata` when request has `includePrivateArtifact === true` and passes token authorization | Yes - includes `sourceArtifact.bytesBase64` for TypeScript only for authorized internal callers | FLOWING |
| Runtime-service unauthorized private request | 403 response | `includePrivateArtifact === true` with missing/invalid internal token | Yes - produces public-safe denial without source or `bytesBase64` | FLOWING |
| Go unauthorized private artifact response | `RuntimeServicePrivateArtifactUnauthorized` | Runtime-service HTTP 403 | Yes - non-retryable validation failure returns before account-save insert/draft assembly | FLOWING |
| Go runtime-service client | `requestBody.includePrivateArtifact`, token header | Constant `true` in `validateStrategy` request body and env-backed private artifact token header | Yes - runtime-service receives an internally authorizable private account-save request | FLOWING |
| Go account-save insert | `input.Metadata` | Validation response metadata cloned into account revision insert | Yes - private bytes-bearing source artifact reaches readiness classification and persistence insert path | FLOWING |
| Go/persistence entry gates | `metadata.sourceArtifact.bytesBase64` | Stored private revision metadata | Yes - both Go and persistence require bytes to verify artifact hash and proof | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Runtime-service public redaction, unauthorized denial, authorized private TypeScript artifact response, and credential redaction | `pnpm --filter @cowards/runtime-service exec vitest run src/server.test.ts src/redaction.test.ts` | 2 files passed, 12 tests passed | PASS |
| Go client private request/token header, 403 fail-loud behavior, Go proof matchers, readiness public-redacted rejection | `cd apps/go-backend && go test ./... -count=1 -run 'TestRuntimeServiceClientRejectsTypeScriptValidationDriftD02D04D09D10|TestRuntimeServiceClientValidatesTypeScriptProviderSourceD01D02D09D10|TestProviderReadiness|TestTypeScriptRuntimeMetadataRequiresProviderProofForCountedPlay'` | `ok github.com/cowards-game/go-backend 1.950s` | PASS |
| Persistence competition/ladder private TypeScript artifact bytes parity | `pnpm --filter @cowards/persistence test -- competition.test.ts ladder.test.ts` | 12 files passed, 62 tests passed, 1 skipped | PASS |
| Phase 244 proof artifact monitor | `pnpm v1.35:account-provider-entry-proof:check` | Exit 0 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| ACCT-01 | 244-01, 244-04 | Go runtime-service validation can request and accept TypeScript provider validation. | SATISFIED | Go client allows `typescript`, sends private artifact request to `/validate-strategy`, and supplies the internal private artifact token header when configured; focused Go client tests pass. |
| ACCT-02 | 244-02, 244-04 | Execution-ready account save stores provider runtime, validation, compatibility, source/artifact identity, and proof metadata. | SATISFIED | Account-save assembly copies runtime-service metadata into insert payload; private TypeScript artifact bytes now participate in readiness proof. |
| ACCT-03 | 244-02, 244-04 | Account save distinguishes ready, invalid, unavailable, and draft states. | SATISFIED | Readiness tests cover private bytes ready state, public-redacted invalid state, invalid draft, unavailable, package violation, and TinyGo hidden provider. Runtime-service private artifact authorization failure is not represented as a draft; Go returns a validation failure before readiness assembly. |
| ACCT-04 | 244-01, 244-02, 244-04 | Unavailable/stale/missing/mismatched/malformed/unverifiable/incompatible proof fails closed or non-execution draft. | SATISFIED | Go proof matcher fails missing/malformed/mismatched artifact bytes; client rejects malformed, oversized, mismatched, incomplete, unsupported, and unauthorized private-artifact validation responses. Unauthorized 403 is fail-loud, non-retryable, and does not save as draft. |
| ACCT-05 | 244-01, 244-02, 244-04 | Account-save validation errors are public-safe. | SATISFIED | Runtime-service default response redacts artifact bytes and tests assert no source, paths, env markers, private memory names, objective payloads, or DB URL. Unauthorized private artifact requests return a stable public 403 without source or `bytesBase64`; redaction now also covers credential-like tokens. Private artifact material is only returned for an internally authorized account-save request. |
| ENTRY-01 | 244-03, 244-04 | Counted Go exhibition, persistence competition, and ladder require provider proof. | SATISFIED | Go, competition, and ladder paths require hash-verified artifact bytes plus provider proof for TypeScript/Python/Rust/Zig. |
| ENTRY-02 | 244-03, 244-04 | Non-counted exhibition rejects unsupported/hidden/stale/missing/package/invalid/fallback cases. | SATISFIED | Non-counted Go gate uses the same provider-proof checks for provider languages; quick regression tests pass. |
| ENTRY-03 | 244-03, 244-04 | Go and persistence eligibility checks agree across the matrix. | SATISFIED | Prior TypeScript public-redacted/private-bytes parity gap is closed by making Go require private bytes and making Go account-save request them explicitly. |
| ENTRY-04 | 244-02, 244-03, 244-04 | Account/entry/public labels derive readiness from proof and registry policy. | SATISFIED | Readiness metadata remains written from classifier output; public Strategy/result/replay label wiring was quick-regression checked from the prior verification and no related diff regressed it. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| None | - | - | - | No blocker or warning anti-patterns found in the audit-fix diff. Test fixture literals and empty arrays are setup data, not implementation stubs. |

### Human Verification Required

None. The prior blocker, private artifact authorization fix, and Go 403 fail-loud fix are programmatically verifiable with focused unit/helper tests.

### Gaps Summary

No remaining gaps. The previous Go/persistence TypeScript bytes parity blocker remains closed, and the latest private artifact authorization/fail-loud behavior is verified: runtime-service redacts artifact bytes by default, unauthorized `includePrivateArtifact` requests return 403 without source or `bytesBase64`, Go maps that 403 to `RuntimeServicePrivateArtifactUnauthorized` and returns before draft assembly or insert, Go account-save sends an env-backed internal token when requesting private artifact material, Go proof matching requires `bytesBase64`, Go readiness rejects public-redacted metadata, and persistence competition/ladder tests require the same private TypeScript artifact bytes.

---

_Verified: 2026-06-15T00:01:55Z_
_Verifier: the agent (gsd-verifier)_
