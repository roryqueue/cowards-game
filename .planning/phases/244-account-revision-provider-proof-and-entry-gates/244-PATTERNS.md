# Phase 244: Account Revision Provider-Proof and Entry Gates - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 17
**Analogs found:** 14 / 14 likely touch files

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/go-backend/runtime_service_client.go` | service client | request-response | same file `validateStrategy`; `apps/runtime-service/src/server.ts` | exact |
| `apps/go-backend/runtime_service_client_test.go` | test | request-response | same file validation and failure tests | exact |
| `apps/go-backend/live_backend.go` | controller/service | CRUD + request-response | `packages/persistence/src/competition.ts`; `packages/persistence/src/ladder.ts` | role-match |
| `apps/go-backend/main_test.go` | test | CRUD + request-response | existing provider proof tests in same file | exact |
| `apps/runtime-service/src/server.test.ts` | test | request-response | existing Python/Rust/Zig `/validate-strategy` tests | exact |
| `packages/persistence/src/competition.test.ts` | test | CRUD + request-response | existing Python/Rust/Zig counted proof tests | exact |
| `packages/persistence/src/ladder.test.ts` | test | CRUD + request-response | existing Python/Rust/Zig ladder proof tests | exact |
| `scripts/check-boundary-monitors.ts` | monitor utility | batch/static scan | direct language/provider/checker monitors in same file | role-match |
| `scripts/check-boundary-monitors.test.ts` | test | batch/static scan | v1.35 inventory and direct-language monitor tests | exact |
| `apps/web/app/api/account/revisions/save/route.ts` | route/controller | request-response | same route thin transport pattern | exact |
| `apps/web/lib/account-revision-write-boundary.ts` | boundary adapter | request-response | same file unsupported source-format gate | exact |
| `packages/persistence/src/competition.ts` | service/reference | CRUD + request-response | stricter reference, avoid unless extracting helper | exact |
| `packages/persistence/src/ladder.ts` | service/reference | CRUD + request-response | stricter reference, avoid unless extracting helper | exact |
| `packages/persistence/src/account-revisions.ts` | read-model service | transform | provenance-aware semantics in same file | exact |

## Pattern Assignments

### `apps/go-backend/runtime_service_client.go` (service client, request-response)

**Analog:** `apps/runtime-service/src/server.ts`

**Use this contract source:** runtime-service already accepts all four source formats and returns provider proof metadata.

```typescript
// apps/runtime-service/src/server.ts lines 121-145
(body.sourceFormat !== "typescript" &&
  body.sourceFormat !== "python" &&
  body.sourceFormat !== "rust" &&
  body.sourceFormat !== "zig") ||
typeof body.source !== "string"
...
sourceFormat === "typescript"
  ? validateStrategySource(body.source)
  : sourceFormat === "python"
    ? validatePythonStrategySource(body.source)
```

**Provider proof response pattern:**

```typescript
// apps/runtime-service/src/server.ts lines 176-222
const contractVersion =
  provider?.contractVersion ?? "strategy-language-provider-contract-v1.33"
const artifact =
  sourceFormat === "rust" || sourceFormat === "zig"
    ? revision.metadata.compiledArtifact
    : revision.metadata.sourceArtifact
...
providerValidation: {
  providerId,
  contractVersion,
  sourceHash: validation.sourceHash,
  sourceBytes: validation.sourceBytes,
  ...(artifact === undefined ? {} : {
    artifactHash: artifact.hash,
    artifactBytes: artifact.bytes,
  }),
  proof: providerValidationProof(...)
}
```

**Go client pattern to extend, not replace:**

```go
// apps/go-backend/runtime_service_client.go lines 178-241
func (client *runtimeServiceClient) validateStrategy(ctx context.Context, sourceFormat string, source string, strategyID string) (*runtimeServiceValidationResponse, *runtimeServiceFailure) {
	if sourceFormat != "python" && sourceFormat != "rust" && sourceFormat != "zig" {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service validation only supports Python, Rust, and Zig provider sources in v1.32", false, nil)
	}
	...
	if decoded.OK {
		if decoded.Runtime == nil || decoded.Validation == nil || decoded.EngineCompatibility == nil || decoded.Metadata == nil || decoded.SourceHash == "" || decoded.SourceBytes <= 0 {
			return nil, newRuntimeServiceFailure("RuntimeServiceMalformedResponse", "Runtime service validation success response was incomplete", true, nil)
		}
		if decoded.SourceHash != hashStrategySourceForGo(source) || decoded.SourceBytes != len([]byte(source)) {
			return nil, newRuntimeServiceFailure("RuntimeServiceSourceMismatch", "Runtime service validation source identity mismatch", false, nil)
		}
	}
```

**Planner action:** Allow `"typescript"` in `validateStrategy`, keep bounded response reads, malformed/oversized/contract/source mismatch failures, and require success metadata. Do not add local TypeScript validation in Go.

### `apps/go-backend/live_backend.go` (controller/service, CRUD + entry gates)

**Analog:** persistence counted entry reference.

```typescript
// packages/persistence/src/competition.ts lines 50-109
const eligibility = evaluateStrategyRuntimeCountedEligibility(runtime)
if (!eligibility.ok) {
  throw new CompetitionInputError(
    eligibility.publicMessage ??
      "StrategyRevision runtime is not eligible for counted exhibition entry.",
  )
}
const normalized = normalizeStrategyRuntimeMetadata(runtime)
if (
  normalized.language.id === "typescript" &&
  !sourceArtifactProviderValidationMatches(
    provenance.metadata,
    provenance.sourceHash,
    provenance.sourceBytes,
    "strategy-language-provider-js-ts",
    "typescript",
  )
) {
  throw new CompetitionInputError(
    "TypeScript counted entry requires provider-validated artifact provenance.",
  )
}
```

**Go drift point to fix:**

```go
// apps/go-backend/live_backend.go lines 553-620
if body.SourceFormat == "python" {
	validation, failure := server.orchestrator.runtime.validateStrategy(...)
	...
}
if body.SourceFormat == "rust" || body.SourceFormat == "zig" {
	validation, failure := server.orchestrator.runtime.validateStrategy(...)
	...
}
```

**Entry gate drift point to fix:**

```go
// apps/go-backend/live_backend.go lines 2525-2563
} else if languageID == "typescript" {
	if adapterID != "runtime-js-worker-thread" && adapterID != "runtime-js-subprocess" {
		return false
	}
}
...
if stringValue(packageMetadata, "mode") != "none" {
	return false
}
return len(stringSliceFromAny(runtime["requiredCapabilities"])) == 0
```

**Provider proof helper already supports TypeScript if called with JS/TS provider id:**

```go
// apps/go-backend/live_backend.go lines 2569-2613
func sourceArtifactProviderValidationMatches(metadata map[string]any, sourceHash string, sourceBytes int, providerID string, languageID string) bool {
	...
	expectedFormat := "python-source-bundle"
	if languageID == "typescript" {
		expectedFormat = "transpiled-javascript"
	}
	...
	return subtle.ConstantTimeCompare(
		[]byte(stringValue(providerValidation, "proof")),
		[]byte(providerValidationProof(providerID, sourceHash, sourceBytes, artifactHash, artifactBytes)),
	) == 1
}
```

**Planner action:** Apply the same runtime-service validation block to TypeScript saves, persist successful runtime/validation/engineCompatibility/metadata from provider response, and require `sourceArtifactProviderValidationMatches(metadata, sourceHash, sourceBytes, "strategy-language-provider-js-ts", "typescript")` for TypeScript counted entry and readiness labels.

### `apps/go-backend/main_test.go` (Go tests, provider proof parity)

**Analog:** existing Python/Rust/Zig proof tests.

```go
// apps/go-backend/main_test.go lines 226-281
t.Setenv("COWARDS_PROVIDER_VALIDATION_SECRET", "cowards-provider-validation-test-secret-v1.33")
runtime := pythonRuntimeMetadata()
sourceHash := "sourcehash:python"
sourceBytes := 123
...
if runtimeSemanticsForRevision(runtime, nil, sourceHash, sourceBytes)["countedPlayEligible"] == true {
	t.Fatalf("Python revision semantics accepted missing provider validation")
}
if runtimeAllowsCountedPlay(runtime, nil, sourceHash, sourceBytes) ||
	runtimeAllowsCountedPlay(runtime, metadata, "other", sourceBytes) ||
	runtimeAllowsCountedPlay(runtime, metadata, sourceHash, sourceBytes+1) {
	t.Fatalf("Python counted gate accepted missing or stale provider validation")
}
```

**Planner action:** Add the missing TypeScript equivalent: sourceArtifact format `transpiled-javascript`, provider id `strategy-language-provider-js-ts`, toolchain language `typescript`, valid proof, and negative checks for missing/stale/mismatched proof.

### `apps/go-backend/runtime_service_client_test.go` (Go client tests)

**Analog:** current provider validation and failure-class tests.

```go
// apps/go-backend/runtime_service_client_test.go lines 45-79
server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, httpRequest *http.Request) {
	if httpRequest.URL.Path != "/validate-strategy" {
		t.Fatalf("unexpected path %s", httpRequest.URL.Path)
	}
	writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
		OK:           true,
		Kind:         "strategyValidation",
		SourceFormat: "python",
		Runtime:      pythonRuntimeMetadata(),
		Validation: map[string]any{
			"valid":       true,
			"sourceHash":  hashStrategySourceForGo(source),
			"sourceBytes": len([]byte(source)),
		},
		EngineCompatibility: engineCompatibility(),
		Metadata:            map[string]any{"tags": []string{"python", "counted", "provider"}},
		SourceHash:          hashStrategySourceForGo(source),
		SourceBytes:         len([]byte(source)),
	})
}))
```

```go
// apps/go-backend/runtime_service_client_test.go lines 141-192
t.Run("malformed response", ...)
t.Run("oversized response", ...)
t.Run("timeout", ...)
```

**Planner action:** Add TypeScript validation success and source mismatch tests. Keep failure assertions on `ErrorClass`, `Retryable`, and `assertRuntimeServiceFailureSafe`.

### `packages/persistence/src/competition.ts` and `packages/persistence/src/ladder.ts` (reference services)

**Analog:** these are the stricter semantics Go should copy.

```typescript
// packages/persistence/src/ladder.ts lines 42-100
export const assertLadderEligibleRuntime = (
  runtime: unknown,
  provenance: { metadata?: unknown; sourceHash?: string; sourceBytes?: number } = {},
) => {
  const eligibility = evaluateStrategyRuntimeCountedEligibility(runtime)
  if (!eligibility.ok) {
    throw new LadderInputError(...)
  }
  const normalized = normalizeStrategyRuntimeMetadata(runtime)
  if (
    normalized.language.id === "typescript" &&
    !sourceArtifactProviderValidationMatches(..., "strategy-language-provider-js-ts", "typescript")
  ) {
    throw new LadderInputError(
      "TypeScript trial ladder entry requires provider-validated artifact provenance.",
    )
  }
```

**Artifact/proof match pattern:**

```typescript
// packages/persistence/src/competition.ts lines 111-179
if (
  typeof artifact.hash !== "string" ||
  typeof artifact.bytes !== "number" ||
  typeof artifact.bytesBase64 !== "string" ||
  artifact.sourceHash !== sourceHash ||
  artifact.sourceBytes !== sourceBytes ||
  artifact.validationStatus !== "valid" ||
  !artifactBytesMatch(...)
) {
  return false
}
...
return (
  expected !== null &&
  safeEqual(validation.proof, expected) &&
  (artifact.toolchain as Record<string, unknown> | undefined)?.language === language
)
```

**Planner action:** Prefer copying these checks into Go parity rather than changing persistence. If shared TS tests are added, mirror the Python/Rust/Zig style in `competition.test.ts` and `ladder.test.ts`.

### `packages/persistence/src/account-revisions.ts` (read-model semantics)

**Analog:** owner-visible readiness labels already downgrade when proof is missing.

```typescript
// packages/persistence/src/account-revisions.ts lines 191-232
if (
  (revision.runtime.language.id !== "typescript" &&
    revision.runtime.language.id !== "python" &&
    revision.runtime.language.id !== "rust" &&
    revision.runtime.language.id !== "zig") ||
  sourceArtifactProviderValidationMatches(...) ||
  rustProviderValidationMatches(...)
) {
  return semantics
}
...
countedPlayEligible: false,
countedPlayLabel: "Not counted",
countedPlayReason: `${languageLabel} counted play requires provider-validated revision provenance.`,
```

**Planner action:** Use this as the label behavior for any non-execution draft. Avoid introducing "ready" or "entry eligible" labels from `sourceFormat` alone.

### `packages/spec/src/workshop-checker.ts` (public-safe diagnostics)

**Analog:** public-safe status, diagnostic categories, redaction vocabulary.

```typescript
// packages/spec/src/workshop-checker.ts lines 24-55
export type WorkshopCheckerStatus =
  | "not_checked"
  | "checking"
  | "ready"
  | "invalid"
  | "stale"
  | "runtime_service_unavailable"
  | "toolchain_unavailable"
  | "system_unavailable"

export type WorkshopCheckerDiagnosticCategory =
  | "artifact_missing"
  | "artifact_stale"
  | "artifact_mismatch"
  | "provenance_missing"
  | "provenance_mismatch"
  | "provenance_unverifiable"
  | "provider_proof_invalid"
  | "runtime_service_unavailable"
  | "unsupported_provider"
```

```typescript
// packages/spec/src/workshop-checker.ts lines 388-411
return value
  .replace(/\b(strategyMemory|StrategyMemory|strategy_memory|strategy memory)\b/gi, "private strategy memory")
  .replace(/\b(soldierMemory|SoldierMemory|soldier_memory|soldier memory)\b/gi, "private soldier memory")
  .replace(/\b(objectivePayload|objective_payload|objective payload)\b/gi, "private objective")
  .replace(/File "[^"]+"/g, "File [redacted]")
  .replace(/\/Users\/[^\s"'`),;]+/g, "[host path]")
  .replace(/postgres(?:ql)?:\/\/[^\s"'`),;]+/gi, "[database]")
```

**Planner action:** Use public categories in account-save/entry failures. Do not expose raw provider proof, source, artifact bytes, host paths, env, tokens, DB details, StrategyMemory, SoldierMemory, or objective payloads.

### `scripts/check-boundary-monitors.ts` and `.test.ts` (boundary monitor)

**Analog:** current monitor style is static, named checks added to `runBoundaryMonitorChecks`, with focused unit tests.

```typescript
// scripts/check-boundary-monitors.ts lines 718-846
const approvedLanguageSpecialCaseFiles = new Set<string>([
  "apps/web/app/api/workshop/revisions/route.ts",
  ...
  "apps/web/lib/account-revision-write-boundary.ts",
])
...
const checkDirectLanguageSpecialCases = (): string => {
  const offenses = findDirectLanguageSpecialCases()
  if (offenses.length > 0) {
    throw new Error(`direct product language special-cases outside approved boundaries: ...`)
  }
  return `${approvedLanguageSpecialCaseFiles.size} approved provider/adapter language boundaries checked`
}
```

```typescript
// scripts/check-boundary-monitors.ts lines 2956-3058
const checkV132SupportedLanguageProviders = (): string => {
  ...
  if (
    language.id === "typescript" &&
    (language.buildBehavior !== "transpile-source-artifact" ||
      provider.abiPosture !== "runtime-js-source-artifact" ||
      !provider.evidenceRequirements.includes(
        "typescript-transpiled-artifact-provenance",
      ))
  ) {
    throw new Error("TypeScript provider posture drifted")
  }
}
```

```typescript
// scripts/check-boundary-monitors.ts lines 5458-5475
await check("web_boundary", "direct product language special-case drift", () =>
  checkDirectLanguageSpecialCases(),
),
await check("language_provider", "v1.33 supported language providers", () =>
  checkV132SupportedLanguageProviders(),
),
await check("checker_contract", "v1.34 Workshop checker provider boundary", () =>
  checkV134WorkshopCheckerBoundary(),
),
await check("contract_drift", "v1.35 boundary surface inventory", () =>
  checkV135BoundarySurfaceInventoryMonitor(),
),
```

**Test style to copy:**

```typescript
// scripts/check-boundary-monitors.test.ts lines 516-556
it("detects direct product language branching outside approved boundaries", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-language-"))
  ...
  expect(findDirectLanguageSpecialCases({ repoRoot, files: [file], approvedFiles: new Set() })).toEqual([
    { path: file, line: 2, languageId: "python", snippet: "sourceFormat === 'python'" },
  ])
})
```

**Planner action:** Add a narrow Phase 244 monitor that fails if Go TypeScript save skips `runtime.validateStrategy`, if Go counted gate lacks JS/TS provider proof, or if public/default diagnostics include forbidden markers. Add tests by mutating temp source strings or small fixtures, not by requiring live services.

## Shared Patterns

### Provider Proof Payload

**Sources:** `apps/runtime-service/src/server.ts` lines 91-114; `packages/persistence/src/competition.ts` lines 267-293; `apps/go-backend/live_backend.go` lines 2672-2693.

```text
providerId
contractVersion
sourceHash
sourceBytes
artifactHash or ""
artifactBytes or ""
```

Proof format is `hmac-sha256:<hex>`. Compare with constant-time helpers (`timingSafeEqual` in TS, `subtle.ConstantTimeCompare` in Go).

### Entry Eligibility

**Sources:** `packages/spec/src/runtime.ts` lines 417-557 and 569-718; `packages/persistence/src/competition.ts` lines 50-109.

Use registry/provider metadata first, then proof. Required conditions for counted and entry-ready revisions:
- supported provider id for language
- provider contract `strategy-language-provider-contract-v1.33`
- runtime ABI `strategy-runtime-abi-v1.14`
- exact runtime adapter/language/package metadata
- package mode `none`
- no required capabilities
- valid validation status
- source hash and bytes match
- artifact hash and bytes match when artifact exists
- proof matches source and artifact identity

### Public-Safe Failures

**Sources:** `apps/go-backend/runtime_service_client.go` lines 400-522; `packages/spec/src/workshop-checker.ts` lines 155-170.

Use categories such as `unsupported_provider`, `invalid Strategy Revision`, `runtime_service_unavailable`, `provider proof invalid/missing/mismatched`, `incompatible runtime metadata`, and `package policy violation`. Redact source, artifact bytes, host paths, env values, tokens, DB details, signing material, private runtime internals, StrategyMemory, SoldierMemory, objective payloads, stderr, and stack traces.

## Likely Touch List

| File | Why |
|---|---|
| `apps/go-backend/runtime_service_client.go` | Add TypeScript to `/validate-strategy` client allowlist and keep fail-closed response validation. |
| `apps/go-backend/runtime_service_client_test.go` | Add TypeScript validation success and negative mismatch/malformed tests. |
| `apps/go-backend/live_backend.go` | Require provider validation for TypeScript account saves; require JS/TS provider proof in readiness and entry gates. |
| `apps/go-backend/main_test.go` | Add TypeScript provider-proof parity tests matching existing Python/Rust/Zig tests. |
| `apps/runtime-service/src/server.test.ts` | Add or verify TypeScript `/validate-strategy` proof response coverage. |
| `packages/persistence/src/competition.test.ts` | Add TypeScript counted proof test if missing; existing implementation is the reference. |
| `packages/persistence/src/ladder.test.ts` | Add TypeScript ladder proof test if missing; existing implementation is the reference. |
| `scripts/check-boundary-monitors.ts` | Add static Phase 244 parity/privacy monitor. |
| `scripts/check-boundary-monitors.test.ts` | Add monitor failure tests for missing Go validation/proof and public leakage markers. |

## Files Plans Should Usually Avoid

| File | Reason |
|---|---|
| `apps/web/app/api/account/revisions/save/route.ts` | Already a thin route with centralized error response. |
| `apps/web/lib/account-revision-write-boundary.ts` | Already transports allowed source formats to Go; avoid putting validation logic in web. |
| `apps/runtime-service/src/server.ts` | Runtime-service already validates TypeScript/Python/Rust/Zig and emits provider proof. Touch only if a test proves a contract bug. |
| `packages/persistence/src/competition.ts` | Stricter reference semantics; Go should converge to it. |
| `packages/persistence/src/ladder.ts` | Stricter reference semantics; Go should converge to it. |
| `packages/spec/src/runtime.ts` | Canonical registry/provider contract; avoid changing scope or labels in Phase 244. |
| `packages/spec/src/workshop-checker.ts` | Canonical public-safe vocabulary; reuse categories instead of changing the checker contract. |

## No Analog Found

None. Every expected Phase 244 change has an existing same-role or stricter reference analog.

## Metadata

**Analog search scope:** requested files plus `rg` across `apps/go-backend`, `apps/runtime-service`, `packages/persistence`, `packages/spec`, and `scripts`.
**Files scanned:** 17 requested files plus targeted `rg` matches.
**Pattern extraction date:** 2026-06-14
