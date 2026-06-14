# Phase 243: Boundary Surface Inventory and Contract Lock - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 8 new/modified files
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/artifacts/v1.35-boundary-surface-inventory.md` | config | batch | `.planning/artifacts/v1.34-workshop-checker-inventory.md` | exact |
| `.planning/artifacts/v1.35-boundary-surface-inventory.json` | config | transform | `.planning/artifacts/v1.16-typescript-backend-inventory.json` via `scripts/generate-typescript-backend-inventory.ts` | role-match |
| `scripts/evaluate-v1-35-boundary-surface-inventory.ts` | utility | file-I/O, batch, transform | `scripts/generate-typescript-backend-inventory.ts` | exact |
| `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` | test | file-I/O, batch | `scripts/generate-typescript-backend-inventory.test.ts` | exact |
| `scripts/check-boundary-monitors.ts` | utility | batch | `scripts/check-boundary-monitors.ts` | exact existing modification |
| `scripts/check-boundary-monitors.test.ts` | test | batch | `scripts/check-boundary-monitors.test.ts` | exact existing modification |
| `package.json` | config | batch | `package.json` | exact existing modification |
| `apps/go-backend/runtime_service_client_test.go` | test | request-response | `apps/go-backend/runtime_service_client_test.go` | exact optional characterization |

## Pattern Assignments

### `.planning/artifacts/v1.35-boundary-surface-inventory.md` (config, batch)

**Analog:** `.planning/artifacts/v1.34-workshop-checker-inventory.md`

**Header and scope pattern** (lines 1-5):
```markdown
# v1.34 Workshop Checker Inventory

**Phase:** 238 - Workshop Checker Path Inventory and Public Contract
**Date:** 2026-06-01
**Scope:** TypeScript, Python, Rust, and Zig Workshop Validate source, submit/save, account save, and entry paths.
```

**Executive current-state pattern** (lines 7-16):
```markdown
## Executive Summary

Workshop validation is close to the provider model, but not yet contract-unified. The main parity gaps are:

- Workshop Validate source routes TypeScript, Rust, and Zig through runtime-service when configured, but Python still uses local Workshop validation.
- Workshop submit/save is stricter than Validate source because it requires runtime-service provider validation for all four languages before building a Workshop Revision.
- Account save through Go validates Python/Rust/Zig through runtime-service, but TypeScript is still locally validated in Go without TypeScript provider proof.
```

**Route/code inventory pattern** (lines 77-99):
```markdown
### Account Save

**App/API route**

- `apps/web/app/api/account/revisions/save/route.ts`
  - Delegates to `saveAccountRevisionFromRequest`.
- `apps/web/lib/account-revision-write-boundary.ts`
  - Validates only that `sourceFormat` is one of TypeScript/Python/Rust/Zig.
  - Delegates account revision creation to the selected Go backend client.

**Go backend path**

- `apps/go-backend/live_backend.go`
  - `createStrategyRevision` accepts TypeScript, Python, Rust, and Zig.
  - TypeScript uses local Go `validateSourceMetadata`, which is a source-size, substring, and forbidden-marker check. It does not call runtime-service and does not require TypeScript provider proof.
```

**Boundary and privacy notes pattern** (lines 186-192):
```markdown
## Boundary and Privacy Notes

- No inventory evidence showed Strategy execution moving into web/API/Go.
- Web/API and Go currently treat runtime-service/provider validation as external data, though the checker contract should require schema validation before returning provider output.
- Runtime-service success metadata may include artifact byte payloads for internal proof, but default/public checker output must not expose bytes or `bytesBase64`.
- Runtime-service and Go errors should become normalized public categories rather than exposing raw failure code/message strings by default.
- TinyGo is absent from Workshop production source-format lists and should remain absent.
```

**Use for Phase 243:** Copy this style, but expand rows to the locked v1.35 row contract: current owner, intended owner, trust boundary, public/private data class, affected requirement IDs, current behavior, disposition, required tests/proof, privacy risks, and downstream phase. Keep it an inventory and decision register. Do not recommend implementing Phase 244-248 behavior inside the artifact.

---

### `.planning/artifacts/v1.35-boundary-surface-inventory.json` (config, transform)

**Analog:** `scripts/generate-typescript-backend-inventory.ts`

**Typed row contract pattern** (lines 72-110):
```typescript
export interface TypeScriptBackendSurface {
  id: string
  path: string
  kind: SurfaceKind
  role: TypeScriptBackendRole
  retirementAction: RetirementAction
  owner: string
  reason: string
  gate: string
  risk: string
  futureMigration: string
  currentOwner: string
  normalBackendOwner: string
  fallbackPolicy: string
  privacyClass: string
  enforcementStatus: string
  routeMethods: readonly string[]
  routePath: string | null
  routeFamily: string
  goRouteIds: readonly string[]
  sourceRefs: readonly string[]
  scannerFindings: readonly ScannerFinding[]
}
```

**Artifact-level contract pattern** (lines 112-150):
```typescript
export interface TypeScriptBackendInventory {
  schemaVersion: typeof schemaVersion
  milestone: typeof milestone
  generatedAt: typeof generatedAt
  allowedRoles: readonly TypeScriptBackendRole[]
  baselineReferences: {
    goBackendBaselineArtifacts: readonly string[]
    goBackendBaselineCapabilities: readonly string[]
    typeScriptSurfaceSeed: string
  }
  globalPolicies: {
    normalTypeScriptBackendAllowed: false
    fallbackPolicy: "no_silent_typescript_backend_fallback"
    strategyRuntimeAbi: "strategy-runtime-abi-v1.14"
    runtimeExecutionService: "runtime-execution-service-v1.15"
    publicOutputForbiddenByDefault: readonly string[]
    nonGoals: readonly string[]
  }
  scanner: {
    generatedBy: "scripts/generate-typescript-backend-inventory.ts"
    roots: readonly string[]
    classificationSeed: string
  }
  surfaces: readonly TypeScriptBackendSurface[]
}
```

**JSON rendering pattern** (lines 1296-1298):
```typescript
export const renderTypeScriptBackendInventoryJson = (
  inventory: TypeScriptBackendInventory,
): string => `${JSON.stringify(inventory, null, 2)}\n`
```

**Use for Phase 243:** JSON should be monitor-friendly row data for the markdown inventory, not a separate source of truth unless the planner explicitly makes generation deterministic. Use schema fields equivalent to CONTEXT D-04/D-05 and include the required INV-01 surface groups.

---

### `scripts/evaluate-v1-35-boundary-surface-inventory.ts` (utility, file-I/O/batch/transform)

**Analog:** `scripts/generate-typescript-backend-inventory.ts`

**Imports and repo-root pattern** (lines 1-17):
```typescript
#!/usr/bin/env -S pnpm exec tsx
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
```

**Taxonomy constant pattern** (lines 19-34):
```typescript
export const schemaVersion = "v1.16-typescript-backend-inventory" as const
export const milestone = "v1.16" as const
export const generatedAt = "2026-05-24" as const

export const allowedRoles = [
  "frontend-only",
  "runtime-service",
  "runtime-adapter",
  "parity-only",
  "fixture-only",
  "test-only",
  "rollback-only",
  "deferred",
  "quarantined",
  "deleted",
] as const
```

**Validation pattern** (lines 1074-1097, 1105-1116, 1164-1169):
```typescript
export const validateTypeScriptBackendInventory = (
  inventory: TypeScriptBackendInventory,
): readonly string[] => {
  const errors: string[] = []
  if (inventory.schemaVersion !== schemaVersion) {
    errors.push(`schemaVersion must be ${schemaVersion}`)
  }
  const allowed = new Set(allowedRoles)
  const requiredFields = [
    "owner",
    "reason",
    "gate",
    "risk",
    "futureMigration",
  ] as const

  for (const surface of inventory.surfaces) {
    if (!allowed.has(surface.role)) {
      errors.push(`${surface.path} has invalid role ${surface.role}`)
    }
  }

  const paths = new Set(inventory.surfaces.map((surface) => surface.path))
  if (paths.size !== inventory.surfaces.length) {
    errors.push("surface paths must be unique")
  }
  return errors
}
```

**Markdown render pattern** (lines 1248-1293):
```typescript
const markdownEscape = (value: string | null | readonly string[]): string => {
  const text = Array.isArray(value) ? value.join(", ") : (value ?? "")
  return text.replaceAll("|", "\\|").replaceAll("\n", " ")
}

export const renderTypeScriptBackendInventoryMarkdown = (
  inventory: TypeScriptBackendInventory,
): string => {
  const rows = inventory.surfaces
    .map(
      (surface) =>
        `| ${markdownEscape(surface.id)} | ${markdownEscape(surface.path)} | ${markdownEscape(surface.kind)} | ${markdownEscape(surface.role)} | ${markdownEscape(surface.retirementAction)} | ${markdownEscape(surface.normalBackendOwner)} | ${markdownEscape(surface.fallbackPolicy)} | ${markdownEscape(surface.privacyClass)} | ${markdownEscape(surface.gate)} | ${markdownEscape(surface.risk)} | ${markdownEscape(surface.futureMigration)} | ${markdownEscape(surface.routeMethods)} | ${markdownEscape(surface.goRouteIds)} | ${markdownEscape(surface.sourceRefs)} |`,
    )
    .join("\n")
```

**Write/check/CLI pattern** (lines 1300-1377):
```typescript
const artifactPaths = {
  json: ".planning/artifacts/v1.16-typescript-backend-inventory.json",
  markdown: ".planning/artifacts/v1.16-typescript-backend-inventory.md",
} as const

export const checkTypeScriptBackendInventoryArtifacts = (
  options: GenerateTypeScriptBackendInventoryOptions = {},
): readonly string[] => {
  const root = options.repoRoot ?? repoRoot
  const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
  const expectedJson = renderTypeScriptBackendInventoryJson(inventory)
  const expectedMarkdown = renderTypeScriptBackendInventoryMarkdown(inventory)
  const checks = [
    [artifactPaths.json, expectedJson],
    [artifactPaths.markdown, expectedMarkdown],
  ] as const
  const failures: string[] = []
  for (const [relativePath, expected] of checks) {
    const absolutePath = path.join(root, relativePath)
    if (!existsSync(absolutePath)) {
      failures.push(`${relativePath} is missing`)
      continue
    }
    const actual = readFileSync(absolutePath, "utf8")
    if (actual !== expected) {
      failures.push(`${relativePath} is stale`)
    }
  }
  return failures
}
```

**Use for Phase 243:** Implement only static discovery, row validation, markdown/JSON rendering, and `--check`/`--write` behavior. Do not import runtime providers in a way that executes Strategy code. Do not make account-save, owner-debug, alias, sandbox-label, package-policy, or proof-gate behavior changes here.

---

### `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts` (test, file-I/O/batch)

**Analog:** `scripts/generate-typescript-backend-inventory.test.ts`

**Test imports and temp repo pattern** (lines 1-20, 22-52):
```typescript
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  checkTypeScriptBackendInventoryArtifacts,
  generateTypeScriptBackendInventory,
  validateTypeScriptBackendInventory,
} from "./generate-typescript-backend-inventory.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-ts-backend-inventory-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

const writeSource = (root: string, repoPath: string, source: string) => {
  const absolutePath = path.join(root, repoPath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, source)
}
```

**Route discovery test pattern** (lines 180-206):
```typescript
describe("TypeScript backend inventory generator", () => {
  it("discovers Next.js API route files and exported HTTP methods for BASE-01", () => {
    const root = createFixtureRepo()

    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
    const route = inventory.surfaces.find(
      (surface) => surface.path === "apps/web/app/api/exhibitions/route.ts",
    )

    expect(route).toMatchObject({
      kind: "next-api-route",
      routeMethods: ["GET", "POST"],
      routePath: "/exhibitions",
      role: "frontend-only",
      normalBackendOwner: "go_backend_when_selected",
    })
  })
})
```

**Required-field validation pattern** (lines 340-371):
```typescript
it("requires owner, reason, gate, risk, and future migration for deferred and rollback-only entries", () => {
  const root = createFixtureRepo()
  const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
  const rollback = inventory.surfaces.find(
    (surface) => surface.role === "rollback-only",
  )!

  expect(
    validateTypeScriptBackendInventory({
      ...inventory,
      surfaces: [{ ...rollback, owner: "", risk: "" }],
    }),
  ).toEqual(
    expect.arrayContaining([
      `${rollback.path} rollback-only entry missing owner`,
      `${rollback.path} rollback-only entry missing risk`,
    ]),
  )
})
```

**Stale artifact check pattern** (lines 374-431):
```typescript
it("detects stale JSON and markdown artifacts in check mode", () => {
  const root = createFixtureRepo()

  expect(checkTypeScriptBackendInventoryArtifacts({ repoRoot: root })).toEqual([
    ".planning/artifacts/v1.16-typescript-backend-inventory.json is missing",
    ".planning/artifacts/v1.16-typescript-backend-inventory.md is missing",
  ])

  const inventory = writeTypeScriptBackendInventoryArtifacts({ repoRoot: root })
  expect(checkTypeScriptBackendInventoryArtifacts({ repoRoot: root })).toEqual([])

  writeFileSync(
    path.join(root, ".planning/artifacts/v1.16-typescript-backend-inventory.md"),
    "# stale\n",
  )
  expect(checkTypeScriptBackendInventoryArtifacts({ repoRoot: root })).toEqual([
    ".planning/artifacts/v1.16-typescript-backend-inventory.md is stale",
  ])
})
```

**Use for Phase 243:** Test required INV-01 groups, exactly one disposition per row, required D-05 fields, no duplicate IDs/paths, missing/stale artifact detection, and forbidden public marker coverage. Use fixture repos or static fixture rows; do not require live runtime-service, Go backend, Docker, or browser services for the inventory check.

---

### `scripts/check-boundary-monitors.ts` (utility, batch)

**Analog:** existing `scripts/check-boundary-monitors.ts`

**Monitor result and layer pattern** (lines 50-70):
```typescript
type MonitorLayer =
  | "contract_drift"
  | "privacy"
  | "web_boundary"
  | "runtime_adapter"
  | "runtime_isolation"
  | "worker_quarantine"
  | "surface_labels"
  | "non_js_runtime"
  | "language_provider"
  | "go_parity"
  | "go_promotion"
  | "checker_contract"
  | "topology"

export interface BoundaryMonitorCheck {
  layer: MonitorLayer
  name: string
  ok: boolean
  detail: string
}
```

**Inline manifest contract pattern** (lines 431-445):
```typescript
export const selectedGoRouteManifest: SelectedGoRouteManifest = {
  schemaVersion: "v1.16-selected-go-route-manifest",
  milestone: "v1.16",
  fallbackPolicy: "no_typescript_backend_fallback",
  explicitlyOutOfScope: [
    "Workshop validation, submission, source, test, analytics, export, and runtime flows",
    "broader ladder scheduling and mutation routes",
    "governance and admin routes",
    "owner-debug/private Chronicle migration",
    "test-support routes and fixture generators",
    "rollback and parity paths",
    "migrations and schema ownership",
    "runtime service replacement or Runtime Broker implementation",
  ],
  routes: [
```

**Required route check pattern** (lines 1054-1089):
```typescript
export const validateSelectedGoRouteManifest = (
  manifest: SelectedGoRouteManifest,
): string => {
  if (manifest.schemaVersion !== "v1.16-selected-go-route-manifest") {
    throw new Error("v1.16 selected Go route manifest schema drifted")
  }
  const requiredRouteIds = new Set([
    "health",
    "authSession",
    "createSession",
    "listStrategyRevisions",
    "createStrategyRevision",
    "getStrategyRevisionSource",
    "createMatchSet",
    "getPublicReplayEvidence",
  ])
  const routeIds = new Set(manifest.routes.map((route) => route.routeId))
  for (const routeId of requiredRouteIds) {
    if (!routeIds.has(routeId)) {
      throw new Error(`v1.16 selected Go route manifest missing ${routeId}`)
    }
  }
```

**Monitor runner pattern** (lines 5434-5566):
```typescript
export const runBoundaryMonitorChecks = async (): Promise<
  BoundaryMonitorCheck[]
> => [
  await check("contract_drift", "OpenAPI public route artifact", () =>
    checkOpenApiContract(),
  ),
  await check("privacy", "public service route examples", () =>
    checkPublicServiceExamples(),
  ),
  await check(
    "checker_contract",
    "v1.34 Workshop checker provider boundary",
    () => checkV134WorkshopCheckerBoundary(),
  ),
  await check("go_parity", "Go route manifest metadata", () =>
    checkGoRouteManifest(),
  ),
]
```

**CLI print pattern** (lines 5568-5587):
```typescript
const run = async (): Promise<number> => {
  const checks = await runBoundaryMonitorChecks()
  console.log("Coward's Game v1.8 boundary monitors")
  for (const result of checks) {
    console.log(
      `[${result.ok ? "PASS" : "FAIL"}] [${result.layer}] ${result.name}: ${result.detail}`,
    )
  }
  return checks.every((result) => result.ok) ? 0 : 1
}
```

**Use for Phase 243:** If wiring is stable, add a narrowly named monitor check such as `v1.35 boundary surface inventory`. Keep it a stale/missing/contract check over artifacts. Do not add checks that require Phase 244-248 behavior to be fixed yet.

---

### `scripts/check-boundary-monitors.test.ts` (test, batch)

**Analog:** existing `scripts/check-boundary-monitors.test.ts`

**Manifest validation test pattern** (lines 219-288):
```typescript
it("validates the v1.16 selected Go route manifest contract", () => {
  expect(validateSelectedGoRouteManifest(selectedGoRouteManifest)).toContain(
    "v1.16 selected Go routes",
  )
  expect(selectedGoRouteManifest.schemaVersion).toBe(
    "v1.16-selected-go-route-manifest",
  )
  expect(
    selectedGoRouteManifest.routes.map((route) => route.routeId),
  ).toEqual(
    expect.arrayContaining([
      "authSession",
      "createStrategyRevision",
      "getStrategyRevisionSource",
      "createMatchSet",
      "getPublicReplayEvidence",
      "health",
    ]),
  )
  expect(() =>
    validateSelectedGoRouteManifest({
      ...selectedGoRouteManifest,
      routes: selectedGoRouteManifest.routes.concat({
        ...selectedGoRouteManifest.routes[0]!,
        routeId: "unexpectedRoute",
      }),
    }),
  ).toThrow(/unexpected route unexpectedRoute/)
})
```

**Privacy guard test pattern** (lines 290-295):
```typescript
it("uses the canonical public DTO leak guard", () => {
  expect(() => assertMonitorPublicPayload({ ok: true })).not.toThrow()
  expect(() =>
    assertMonitorPublicPayload({ privateDiagnostics: { stack: "nope" } }),
  ).toThrow(/private field/)
})
```

**Use for Phase 243:** Add tests only for the new inventory monitor helper if `check-boundary-monitors.ts` is touched. Assert missing rows, unexpected extra dispositions, stale artifacts, and privacy guard failures.

---

### `package.json` (config, batch)

**Analog:** existing `package.json`

**Script naming pattern** (lines 18-29):
```json
"typescript-backend:inventory": "pnpm exec tsx scripts/generate-typescript-backend-inventory.ts --write",
"typescript-backend:inventory:check": "pnpm exec tsx scripts/generate-typescript-backend-inventory.ts --check",
"tinygo-wasi:spike": "pnpm exec tsx scripts/evaluate-v1-33-tinygo-wasi-spike.ts",
"tinygo-wasi:spike:check": "pnpm exec tsx scripts/evaluate-v1-33-tinygo-wasi-spike.ts --check",
"v1.34:workshop-checker": "pnpm exec tsx scripts/evaluate-v1-34-workshop-checker.ts",
"v1.34:workshop-checker:check": "pnpm exec tsx scripts/evaluate-v1-34-workshop-checker.ts --check"
```

**Boundary monitor chain pattern** (lines 42-48):
```json
"public-discovery:check": "pnpm exec tsx scripts/check-public-discovery-boundary.ts",
"sandbox:evaluate": "pnpm exec tsx scripts/evaluate-runtime-sandbox.ts",
"sandbox:evaluate:check": "pnpm exec tsx scripts/evaluate-runtime-sandbox.ts --check",
"topology:check": "pnpm exec tsx scripts/check-local-topology.ts",
"boundary:monitors": "pnpm contract:check && pnpm contract:lint && pnpm boundary:imports && pnpm typescript-backend:inventory:check && pnpm go:parity && pnpm sandbox:evaluate:check && pnpm wasm-wasi:evaluate:check && pnpm wasm-wasi:beta-evaluate:check && pnpm runtime-abuse:evaluate:check && pnpm match-execution:trust:check && pnpm match-execution:intelligence:check && pnpm public-discovery:check && pnpm topology:check && pnpm exec tsx scripts/check-boundary-monitors.ts"
```

**Use for Phase 243:** If adding scripts, prefer a pair like `v1.35:boundary-inventory` and `v1.35:boundary-inventory:check`. Wire into `boundary:monitors` only if deterministic and not environment-sensitive.

---

### `apps/go-backend/runtime_service_client_test.go` (test, request-response)

**Analog:** existing `apps/go-backend/runtime_service_client_test.go`

**Go HTTP test pattern** (lines 45-79):
```go
func TestRuntimeServiceClientValidatesPythonProviderSource(t *testing.T) {
	source := "def select_activations(input):\n    return {\"activationOrders\": [], \"strategyMemory\": input[\"strategyMemory\"]}\n\ndef soldier_brain(input):\n    return {\"action\": {\"type\": \"TURN_TO_STONE\"}, \"soldierMemory\": input[\"soldierMemory\"]}\n"
	server := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, httpRequest *http.Request) {
		if httpRequest.URL.Path != "/validate-strategy" {
			t.Fatalf("unexpected path %s", httpRequest.URL.Path)
		}
		writeRuntimeServiceTestJSON(t, writer, runtimeServiceValidationResponse{
			OK:           true,
			Kind:         "strategyValidation",
			SourceFormat: "python",
			Runtime:      pythonRuntimeMetadata(),
		})
	}))
	defer server.Close()
	client := newRuntimeServiceClient(server.URL)

	response, failure := client.validateStrategy(context.Background(), "python", source, "strategy:python")
	if failure != nil {
		t.Fatalf("unexpected failure: %s", runtimeServiceFailureJSONSafe(failure))
	}
	if response == nil || !response.OK || response.SourceFormat != "python" {
		t.Fatalf("expected Python validation success, got %+v", response)
	}
}
```

**Current drift source to characterize, not fix in Phase 243** (`apps/go-backend/runtime_service_client.go` lines 178-181):
```go
func (client *runtimeServiceClient) validateStrategy(ctx context.Context, sourceFormat string, source string, strategyID string) (*runtimeServiceValidationResponse, *runtimeServiceFailure) {
	if sourceFormat != "python" && sourceFormat != "rust" && sourceFormat != "zig" {
		return nil, newRuntimeServiceFailure("RuntimeServiceContractMismatch", "Runtime service validation only supports Python, Rust, and Zig provider sources in v1.32", false, nil)
	}
```

**Current account-save source to characterize, not fix in Phase 243** (`apps/go-backend/live_backend.go` lines 553-620):
```go
func (server *LiveServer) createStrategyRevision(writer http.ResponseWriter, request *http.Request) {
	user, err := server.requireUser(writer, request)
	if err != nil || user == nil {
		return
	}
	var body struct {
		StrategyID   string `json:"strategyId"`
		Source       string `json:"source"`
		SourceFormat string `json:"sourceFormat"`
	}
	if body.SourceFormat == "" {
		body.SourceFormat = "typescript"
	}
	if body.SourceFormat != "typescript" && body.SourceFormat != "python" && body.SourceFormat != "rust" && body.SourceFormat != "zig" {
		writeServiceError(writer, http.StatusBadRequest, "VALIDATION_FAILED", "Unsupported Strategy source format.")
		return
	}
	if body.SourceFormat == "python" {
		validation, failure := server.orchestrator.runtime.validateStrategy(request.Context(), body.SourceFormat, body.Source, body.StrategyID)
		...
	}
	if body.SourceFormat == "rust" || body.SourceFormat == "zig" {
		validation, failure := server.orchestrator.runtime.validateStrategy(request.Context(), body.SourceFormat, body.Source, body.StrategyID)
		...
	}
```

**Use for Phase 243:** Only add a characterization test if the planner needs to freeze current TypeScript rejection/local-save drift before Phase 244. The test should assert current behavior and name Phase 244 as the owner of behavior correction. Do not change `runtime_service_client.go` or `live_backend.go` in Phase 243.

## Shared Patterns

### Inventory Row Taxonomy

**Source:** `243-CONTEXT.md` D-04/D-05 plus `scripts/generate-typescript-backend-inventory.ts` lines 72-150.

**Apply to:** Markdown inventory, JSON inventory, evaluator, evaluator tests.

Each v1.35 row should include:
```typescript
type V135BoundaryDisposition =
  | "fix-now"
  | "quarantine"
  | "deprecate-remove"
  | "document-only"
  | "future"

interface V135BoundarySurfaceRow {
  id: string
  surfaceGroup:
    | "account-save"
    | "account-source-read"
    | "owner-debug-replay"
    | "workshop-alias"
    | "competition-entry"
    | "go-read-write"
    | "provider-proof"
    | "sandbox-claim"
    | "package-policy"
    | "tinygo-visibility"
    | "privacy-monitor"
    | "evidence-artifact"
  codeReferences: readonly string[]
  currentOwner: string
  intendedOwner: string
  trustBoundary: string
  dataClass: "public" | "session" | "owner-private" | "internal-private"
  affectedRequirements: readonly string[]
  currentBehavior: string
  disposition: V135BoundaryDisposition
  requiredTestsOrProof: readonly string[]
  privacyRisks: readonly string[]
  downstreamPhase: 244 | 245 | 246 | 247 | 248 | "none"
}
```

### Public Privacy Guard

**Source:** `packages/spec/src/public-output-privacy.ts` lines 1-110.

**Apply to:** Public/default rows, artifact examples, monitor tests.

```typescript
export const PUBLIC_OUTPUT_FORBIDDEN_FIELDS = [
  "source",
  "sourceText",
  "bytesBase64",
  "artifactBytesBase64",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "ownerDebug",
  "ownerPrivate",
] as const

export const assertPublicOutputLeakSafe = (
  value: unknown,
  label = "Public output",
): void => {
  const visit = (node: unknown, path: string): void => {
    ...
  }
  visit(value, "$")
}
```

### Workshop Checker Contract Vocabulary

**Source:** `packages/spec/src/workshop-checker.ts` lines 15-170 and `.planning/artifacts/v1.34-workshop-checker-contract.md` lines 196-231.

**Apply to:** Provider-proof, package/dependency, runtime-service unavailable, TinyGo, privacy rows.

```typescript
export const WORKSHOP_CHECKER_CONTRACT_VERSION = "workshop-checker-v1.34"
export const WORKSHOP_CHECKER_VALIDATION_POLICY =
  "workshop-provider-checker-policy-v1.34"

export type WorkshopCheckerDiagnosticCategory =
  | "source_too_large"
  | "syntax_or_parse"
  | "strategy_api_shape"
  | "forbidden_capability"
  | "forbidden_import"
  | "package_or_dependency"
  | "compile_failed"
  | "artifact_missing"
  | "artifact_stale"
  | "artifact_mismatch"
  | "provenance_missing"
  | "provider_proof_invalid"
  | "runtime_service_unavailable"
  | "toolchain_unavailable"
  | "unsupported_provider"
```

### Owner-Debug Characterization

**Source:** `apps/web/app/matches/[matchId]/replay/owner-debug.test.ts` lines 7-80.

**Apply to:** Owner-debug/private replay inventory rows and optional characterization tests.

```typescript
describe("owner debug replay route options", () => {
  it("keeps public replay as the default", () => {
    expect(isOwnerDebugReplayEnabled({})).toBe(false)
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        {},
      ),
    ).toBeUndefined()
  })

  it("requires a trusted server-side requester identity", () => {
    expect(
      resolveOwnerDebugReplayOptions(
        { ownerDebug: "1", ownerPlayerId: "player:bottom" },
        { PLAYWRIGHT_TEST: "1" },
      ),
    ).toBeUndefined()
  })
})
```

### No Behavior-Change Boundary For Phase 243

**Source:** `243-CONTEXT.md` D-06 and research pitfalls.

**Apply to:** All plans using this pattern map.

Phase 243 may create or update:
- `.planning/artifacts/v1.35-boundary-surface-inventory.md`
- `.planning/artifacts/v1.35-boundary-surface-inventory.json`
- `scripts/evaluate-v1-35-boundary-surface-inventory.ts`
- focused inventory/characterization tests
- optional deterministic monitor command wiring

Phase 243 should not modify behavior in:
- `apps/go-backend/runtime_service_client.go`
- `apps/go-backend/live_backend.go`
- `apps/runtime-service/src/server.ts`
- account save route behavior
- owner-debug authorization behavior
- Workshop alias behavior
- sandbox label semantics
- package enforcement behavior
- provider-proof gates

If a serious leak or boundary violation is found, record it as a blocking inventory finding and assign it to Phase 244, 245, 246, 247, or 248.

## No Analog Found

None. All planned Phase 243 artifact, utility, config, and test files have close existing analogs.

## Metadata

**Analog search scope:** `.planning/artifacts`, `scripts`, `package.json`, `packages/spec/src`, `apps/web/app`, `apps/go-backend`
**Files scanned:** 377
**Pattern extraction date:** 2026-06-14
**Project-local skills:** none found under `.codex/skills/` or `.agents/skills/`
