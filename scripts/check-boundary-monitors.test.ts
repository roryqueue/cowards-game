import { describe, expect, it } from "vitest"
import {
  assertMonitorPublicPayload,
  assertReportOnlyBoundaryOffenseCount,
  checkRuntimeAdapterBridge,
  findUnknownReportOnlyOffenses,
  runBoundaryMonitorChecks,
  validateV115LifecycleOwnershipManifest,
} from "./check-boundary-monitors.ts"

const requiredV115PublicOutputForbidden = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "owner debug",
  "raw Awareness Grid",
  "stack traces",
  "stderr",
  "sessions",
  "tokens",
  "host paths",
  "DB DSNs",
  "private runtime internals",
] as const

const createV115Manifest = () => ({
  schemaVersion: "v1.15-lifecycle-ownership-manifest" as const,
  milestone: "v1.15" as const,
  decision: "go-backend-lifecycle-ownership-completion" as const,
  typeScriptRole: "frontend_parity_runtime_rollback_test_or_deferred_only",
  allowedTypeScriptRoles: [
    "frontend",
    "parity_only",
    "rollback_only",
    "test_only",
    "runtime_only",
    "deferred",
  ] as const,
  monitorBaseline: {
    strictOffenses: 0,
    reportOnlyOffenses: 29,
    source: "test",
  },
  globalPolicies: {
    fallbackPolicy: "no_silent_typescript_backend_fallback",
    mixedDbCompletingOwnersAllowed: false,
    runtimeAbiVersion: "strategy-runtime-abi-v1.14",
    goExecutesStrategyCode: false,
    nodeVmSecurityBoundaryAllowed: false,
    productionSandboxPromotionInScope: false,
    typescriptRuntimeRetirementInScope: false,
  },
  publicOutputForbiddenByDefault: requiredV115PublicOutputForbidden,
  surfaces: [
    "publicReads",
    "accountAndExhibitionRoutes",
    "matchJobLifecycle",
    "matchCompletion",
    "chroniclePersistence",
    "matchSetScoring",
    "publicEvidenceDelivery",
  ]
    .map((surfaceId) => ({
      surfaceId,
      surfaceKind: "test",
      capability: "test capability",
      currentOwner: "typescript_persistence",
      selectedOwner: "go_backend",
      typeScriptRole: "parity_only" as const,
      fallbackPolicy: "no_silent_typescript_backend_fallback",
      rollbackOwner: "typescript_service",
      stoppedGoBehavior: "fail_closed",
      stoppedRuntimeBehavior: "not_applicable",
      codeReferences: ["test.ts"],
      evidenceRequired: ["test"],
      disallowedScopes:
        surfaceId === "matchJobLifecycle" || surfaceId === "matchCompletion"
          ? ["mixed_db_completing_owners"]
          : ["private_runtime_internals"],
    }))
    .concat([
      {
        surfaceId: "runtimeExecutionService",
        surfaceKind: "runtime_boundary",
        capability: "test capability",
        currentOwner: "typescript_worker_runtime_js",
        selectedOwner: "typescript_runtime_service",
        typeScriptRole: "runtime_only" as const,
        fallbackPolicy: "no_silent_typescript_backend_fallback",
        rollbackOwner: "typescript_worker_runtime_only",
        stoppedGoBehavior: "not_applicable",
        stoppedRuntimeBehavior: "go_records_system_failure",
        codeReferences: ["runtime.ts"],
        evidenceRequired: ["abi"],
        disallowedScopes: [
          "db_job_claiming",
          "match_completion",
          "chronicle_persistence",
          "matchset_scoring",
          "product_api_fallback",
        ],
      },
      {
        surfaceId: "workshopAndAdminDeferred",
        surfaceKind: "deferred_scope",
        capability: "test capability",
        currentOwner: "typescript_web_api",
        selectedOwner: "typescript_web_api",
        typeScriptRole: "deferred" as const,
        fallbackPolicy: "not_selected_for_go_in_v1.15",
        rollbackOwner: "typescript_web_api",
        stoppedGoBehavior: "not_applicable",
        stoppedRuntimeBehavior: "not_applicable",
        codeReferences: ["workshop.ts"],
        evidenceRequired: ["label"],
        disallowedScopes: ["normal_go_backend_claim"],
      },
      {
        surfaceId: "topologyAndPromotionGate",
        surfaceKind: "topology",
        capability: "test capability",
        currentOwner: "planning_and_scripts",
        selectedOwner: "planning_and_scripts",
        typeScriptRole: "test_only" as const,
        fallbackPolicy: "no_silent_typescript_backend_fallback",
        rollbackOwner: "operator_documented",
        stoppedGoBehavior: "fail_closed",
        stoppedRuntimeBehavior: "record_system_failure",
        codeReferences: ["check.ts"],
        evidenceRequired: ["topology"],
        disallowedScopes: ["private_runtime_internals"],
      },
    ]),
})

describe("boundary drift monitors", () => {
  it("allows removed baseline web offenses but fails unknown new ones", () => {
    expect(findUnknownReportOnlyOffenses([])).toEqual([])
    expect(
      findUnknownReportOnlyOffenses([
        {
          path: "apps/web/app/api/auth/sign-in/route.ts",
          line: 1,
          pattern: "competitive/server",
          statementText:
            'import { competitiveServer } from "../../../competitive/server.js"',
        },
        {
          path: "apps/web/app/api/new-runtime/route.ts",
          line: 1,
          pattern: "@cowards/runtime-js",
        },
      ]),
    ).toEqual(["apps/web/app/api/new-runtime/route.ts:1:@cowards/runtime-js"])
  })

  it("fails report-only baseline count drift", () => {
    expect(() =>
      assertReportOnlyBoundaryOffenseCount(29, new Set(["one", "two"])),
    ).toThrow(/report-only offense baseline drifted/)
  })

  it("uses the canonical public DTO leak guard", () => {
    expect(() => assertMonitorPublicPayload({ ok: true })).not.toThrow()
    expect(() =>
      assertMonitorPublicPayload({ privateDiagnostics: { stack: "nope" } }),
    ).toThrow(/private field/)
  })

  it("detects runtime registry and adapter metadata drift", () => {
    expect(
      checkRuntimeAdapterBridge({
        selector: "worker-thread",
        specAdapterId: "runtime-js-worker-thread",
      }),
    ).toContain("worker-thread")
    expect(() =>
      checkRuntimeAdapterBridge({
        selector: "worker-thread",
        specAdapterId: "runtime-js-subprocess",
      }),
    ).toThrow(/drifted/)
  })

  it("validates the v1.15 lifecycle ownership manifest contract", () => {
    expect(
      validateV115LifecycleOwnershipManifest(createV115Manifest()),
    ).toContain("v1.15 lifecycle ownership surfaces")
    expect(() =>
      validateV115LifecycleOwnershipManifest({
        ...createV115Manifest(),
        surfaces: createV115Manifest().surfaces.filter(
          (surface) => surface.surfaceId !== "matchJobLifecycle",
        ),
      }),
    ).toThrow(/matchJobLifecycle/)
    expect(() =>
      validateV115LifecycleOwnershipManifest({
        ...createV115Manifest(),
        surfaces: createV115Manifest().surfaces.map((surface) =>
          surface.surfaceId === "runtimeExecutionService"
            ? {
                ...surface,
                typeScriptRole: "parity_only" as const,
              }
            : surface,
        ),
      }),
    ).toThrow(/runtimeExecutionService must stay runtime_only/)
    expect(() =>
      validateV115LifecycleOwnershipManifest({
        ...createV115Manifest(),
        publicOutputForbiddenByDefault:
          requiredV115PublicOutputForbidden.filter(
            (marker) => marker !== "StrategyMemory",
          ),
      }),
    ).toThrow(/denylist missing StrategyMemory/)
    expect(() =>
      validateV115LifecycleOwnershipManifest({
        ...createV115Manifest(),
        surfaces: createV115Manifest().surfaces.map((surface) =>
          surface.surfaceId === "runtimeExecutionService"
            ? {
                ...surface,
                disallowedScopes: ["db_job_claiming"],
              }
            : surface,
        ),
      }),
    ).toThrow(/missing runtime-only prohibition match_completion/)
    expect(() =>
      validateV115LifecycleOwnershipManifest({
        ...createV115Manifest(),
        surfaces: createV115Manifest().surfaces.map((surface) =>
          surface.surfaceId === "matchCompletion"
            ? {
                ...surface,
                disallowedScopes: ["private_runtime_internals"],
              }
            : surface,
        ),
      }),
    ).toThrow(/matchCompletion missing mixed DB owner prohibition/)
  })

  it("passes the live repository monitor checks", async () => {
    const checks = await runBoundaryMonitorChecks()
    expect(checks.every((check) => check.ok)).toBe(true)
    expect(checks.map((check) => check.layer)).toEqual(
      expect.arrayContaining([
        "contract_drift",
        "privacy",
        "web_boundary",
        "runtime_adapter",
        "runtime_isolation",
        "non_js_runtime",
        "go_parity",
        "topology",
      ]),
    )
  })
})
