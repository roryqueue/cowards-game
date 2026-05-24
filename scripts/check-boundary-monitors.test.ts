import { readFileSync } from "node:fs"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  assertMonitorPublicPayload,
  assertReportOnlyBoundaryOffenseCount,
  checkRuntimeAdapterBridge,
  findUnknownReportOnlyOffenses,
  runBoundaryMonitorChecks,
  selectedGoRouteManifest,
  validateSelectedGoRouteManifest,
  validateV115LifecycleOwnershipManifest,
  validateV116TypeScriptWorkerQuarantineArtifact,
  validateV116RuntimeServiceBoundaryArtifact,
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

const createV116RuntimeBoundaryArtifact = () =>
  JSON.parse(
    readFileSync(
      ".planning/artifacts/v1.16-runtime-service-boundary.json",
      "utf8",
    ),
  ) as Record<string, unknown>

const createV116WorkerQuarantineArtifact = () =>
  JSON.parse(
    readFileSync(
      ".planning/artifacts/v1.16-typescript-worker-quarantine.json",
      "utf8",
    ),
  ) as Record<string, unknown>

describe("boundary drift monitors", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("allows removed baseline web offenses but fails unknown new ones", () => {
    expect(findUnknownReportOnlyOffenses([])).toEqual([])
    expect(
      findUnknownReportOnlyOffenses([
        {
          path: "apps/web/app/api/admin/matchsets/[matchSetId]/governance/route.ts",
          line: 1,
          pattern: "competitive/server",
          statementText:
            'import { competitiveServer, getCurrentCompetitiveUser, } from "../../../../../competitive/server.js"',
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
      assertReportOnlyBoundaryOffenseCount(22, new Set(["one", "two"])),
    ).toThrow(/report-only offense baseline drifted/)
  })

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
        "createSession",
        "signUp",
        "revokeSession",
        "listStrategyRevisions",
        "createStrategyRevision",
        "getStrategyRevisionSource",
        "forkStarterStrategy",
        "forkAdvancedStrategy",
        "createMatchSet",
        "getPublicStrategyPage",
        "getPublicPlayerPage",
        "getPublicLadderSeason",
        "getPublicMatchSetSummary",
        "getPublicReplayMetadata",
        "getPublicReplayEvidence",
        "health",
      ]),
    )
    expect(() =>
      validateSelectedGoRouteManifest({
        ...selectedGoRouteManifest,
        routes: selectedGoRouteManifest.routes.map((route) =>
          route.routeId === "createMatchSet"
            ? { ...route, fallbackPolicy: "typescript_fallback_allowed" }
            : route,
        ),
      }),
    ).toThrow(/createMatchSet fallback policy/)
    expect(() =>
      validateSelectedGoRouteManifest({
        ...selectedGoRouteManifest,
        routes: selectedGoRouteManifest.routes.map((route) =>
          route.routeId === "authSession"
            ? { ...route, nextPath: "/api/auth/missing-session" }
            : route,
        ),
      }),
    ).toThrow(/authSession missing Next route\/page/)
    expect(() =>
      validateSelectedGoRouteManifest({
        ...selectedGoRouteManifest,
        routes: selectedGoRouteManifest.routes.map((route) =>
          route.routeId === "createSession"
            ? { ...route, nextPath: "/api/auth/session" }
            : route,
        ),
      }),
    ).toThrow(/createSession selected Next route\/page missing boundary token/)
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

  it("uses the canonical public DTO leak guard", () => {
    expect(() => assertMonitorPublicPayload({ ok: true })).not.toThrow()
    expect(() =>
      assertMonitorPublicPayload({ privateDiagnostics: { stack: "nope" } }),
    ).toThrow(/private field/)
  })

  it("fails worker quarantine artifacts that contain private markers", () => {
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: { token: "secret", strategyMemory: {} },
      }),
    ).toThrow(/artifact private field/)
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

  it("validates the v1.16 runtime service boundary artifact contract", () => {
    const artifact = createV116RuntimeBoundaryArtifact()

    expect(validateV116RuntimeServiceBoundaryArtifact(artifact)).toContain(
      "Strategy Execution Service / Runtime Broker",
    )
    expect(() =>
      validateV116RuntimeServiceBoundaryArtifact({
        ...artifact,
        currentImplementation: {
          ...(artifact.currentImplementation as Record<string, unknown>),
          notBackend: false,
        },
      }),
    ).toThrow(/not a backend/)
    expect(() =>
      validateV116RuntimeServiceBoundaryArtifact({
        ...artifact,
        runtimeAbi: {
          ...(artifact.runtimeAbi as Record<string, unknown>),
          strategyRuntimeAbiVersion: "strategy-runtime-abi-v0",
        },
      }),
    ).toThrow(/runtime ABI/)
    expect(() =>
      validateV116RuntimeServiceBoundaryArtifact({
        ...artifact,
        failurePrivacy: {
          ...(artifact.failurePrivacy as Record<string, unknown>),
          privateDenylist: ["Strategy source"],
        },
      }),
    ).toThrow(/denylist missing StrategyMemory/)
    expect(() =>
      validateV116RuntimeServiceBoundaryArtifact({
        ...artifact,
        nonPromotion: {
          ...(artifact.nonPromotion as Record<string, unknown>),
          nodeWasiAcceptedAsSandbox: true,
        },
      }),
    ).toThrow(/node:wasi/)
  })

  it("validates the v1.16 TypeScript worker quarantine artifact contract", () => {
    const artifact = createV116WorkerQuarantineArtifact()

    expect(validateV116TypeScriptWorkerQuarantineArtifact(artifact)).toContain(
      "single owner",
    )
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...artifact,
        globalPolicies: {
          ...(artifact.globalPolicies as Record<string, unknown>),
          mixedGoAndTypeScriptOwnersAllowed: true,
        },
      }),
    ).toThrow(/mixed Go and TypeScript owners/)
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...artifact,
        rollbackStates: {
          queued_jobs: {},
        },
      }),
    ).toThrow(/running_jobs/)
  })

  it("passes the live repository monitor checks", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("127.0.0.1:3107/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "runtime-execution-service-v1.15",
            runtimeAbiVersion: "strategy-runtime-abi-v1.14",
            adapter: "runtime-js-worker-thread",
          }),
          { status: 200 },
        )
      }
      if (url.includes("/api/service/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "cowards-service",
            version: "service-api-v1.8",
          }),
          { status: 200 },
        )
      }
      if (url.includes("127.0.0.1:8087/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "cowards-service",
            version: "service-api-v1.8",
          }),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/players/") ||
        url.includes("127.0.0.1:8087/public/ladders/")
      ) {
        const fixture = url.includes("/public/players/")
          ? "public-player-page.json"
          : "public-ladder-page.json"
        return new Response(
          readFileSync(
            `apps/go-backend/testdata/service-fixtures/${fixture}`,
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/replays/") &&
        url.endsWith("/evidence")
      ) {
        return new Response(
          readFileSync(
            "apps/go-backend/testdata/service-fixtures/public-replay-evidence.json",
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/matchsets/") ||
        url.includes("127.0.0.1:8087/public/replays/") ||
        url.includes("127.0.0.1:8087/public/strategies/")
      ) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      if (url.includes("127.0.0.1:8087/analytics/runs/")) {
        return new Response(
          JSON.stringify({
            code: "FORBIDDEN",
            message: "Forbidden.",
            publicSafe: true,
            status: 403,
          }),
          { status: 403 },
        )
      }
      if (url.includes("/strategies/strategy%3Ago-parity%3Asentinel")) {
        return new Response("<h1>Go Parity Sentinel</h1>", { status: 200 })
      }
      if (url.startsWith("http://localhost:3000/")) {
        return new Response(
          [
            "Competitive account",
            "Competitive Alpha",
            "Player profile",
            "Local Player",
            "Public Strategy card",
            "Go Parity Sentinel",
            "Competition Trust Beta",
            "Demo Trial Ladder",
            "Smoke exhibition",
            "Replay",
            "golden:v1-7:match",
          ].join(" "),
          { status: 200 },
        )
      }
      throw new Error(`unexpected fetch ${url}`)
    })

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
  }, 30_000)
})
