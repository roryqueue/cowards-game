import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  assertMonitorPublicPayload,
  assertReportOnlyBoundaryOffenseCount,
  checkV135AccountProviderEntryProofMonitor,
  checkV135BoundarySurfaceInventoryMonitor,
  checkV136CompetitionPolicyMonitor,
  checkRuntimeAdapterBridge,
  findDirectLanguageSpecialCases,
  findUnknownReportOnlyOffenses,
  runBoundaryMonitorChecks,
  selectedGoRouteManifest,
  validateV137ExecutableConformanceMonitorWiring,
  validateSelectedGoRouteManifest,
  validateV116FinalTypeScriptSurfaceLabels,
  validateV115LifecycleOwnershipManifest,
  validateV116NoTypeScriptBackendTopologyArtifact,
  validateV116TypeScriptWorkerQuarantineArtifact,
  validateV116RuntimeServiceBoundaryArtifact,
} from "./check-boundary-monitors.ts"
import {
  generateV135BoundarySurfaceInventory,
  writeV135BoundarySurfaceInventoryArtifacts,
  type V135BoundarySurfaceRow,
} from "./evaluate-v1-35-boundary-surface-inventory.ts"
import {
  generateV136CompetitionSurfaceInventory,
  writeV136CompetitionSurfaceInventoryArtifacts,
  type V136CompetitionSurfaceRow,
} from "./evaluate-v1-36-competition-policy.ts"

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

const createV116FinalTypeScriptSurfaceLabels = () =>
  JSON.parse(
    readFileSync(
      ".planning/artifacts/v1.16-final-typescript-surface-labels.json",
      "utf8",
    ),
  ) as Record<string, unknown>

const createV116NoTypeScriptBackendTopologyArtifact = () =>
  JSON.parse(
    readFileSync(
      ".planning/artifacts/v1.16-no-typescript-backend-topology.json",
      "utf8",
    ),
  ) as Record<string, unknown>

const createTempRepo = () => mkdtempSync(path.join(tmpdir(), "cowards-v135-"))

const writeTempFile = (
  root: string,
  relativePath: string,
  text: string,
): void => {
  const absolutePath = path.join(root, relativePath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, text)
}

const clearPostureRequirement = (
  row: V136CompetitionSurfaceRow,
): V136CompetitionSurfaceRow => ({
  ...row,
  postureLabelRequired: false,
  requiredPostureCopy: "",
  requiredResetNoDurableCopy: "",
})

describe("boundary drift monitors", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("wires v1.35 boundary inventory package scripts into monitor commands", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts["v1.35:boundary-inventory"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --write",
    )
    expect(packageJson.scripts["v1.35:boundary-inventory:check"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-35-boundary-surface-inventory.ts --check",
    )
    expect(packageJson.scripts["v1.35:account-provider-entry-proof"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-35-account-provider-entry-proof.ts --write",
    )
    expect(
      packageJson.scripts["v1.35:account-provider-entry-proof:check"],
    ).toBe(
      "pnpm exec tsx scripts/evaluate-v1-35-account-provider-entry-proof.ts --check",
    )
    expect(packageJson.scripts["boundary:monitors"]).toContain(
      "pnpm v1.35:boundary-inventory:check",
    )
    expect(packageJson.scripts["boundary:monitors"]).toContain(
      "pnpm v1.35:account-provider-entry-proof:check",
    )
    expect(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.35:boundary-inventory:check",
      ),
    ).toBeLessThan(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm exec tsx scripts/check-boundary-monitors.ts",
      ),
    )
    expect(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.35:account-provider-entry-proof:check",
      ),
    ).toBeLessThan(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm exec tsx scripts/check-boundary-monitors.ts",
      ),
    )
  })

  it("dispatches v1.36 history by tag and active v1.37 checks after v1.35", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts["v1.36:competition-policy"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-36-competition-policy.ts --write",
    )
    expect(packageJson.scripts["v1.36:competition-policy:check"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-36-competition-policy.ts --check",
    )
    expect(packageJson.scripts["v1.36:historical-proof:check"]).toBe(
      "pnpm exec tsx scripts/check-v1-36-historical-proof.ts",
    )
    expect(packageJson.scripts["v1.36:competition-boundaries:check"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-36-competition-boundaries.ts --check",
    )
    expect(packageJson.scripts["v1.36:final-proof:check"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-36-final-proof.ts --check",
    )
    expect(packageJson.scripts["v1.37:integrity-authority:write"]).toBe(
      "pnpm exec tsx scripts/generate-v1-37-integrity-authority.ts --write",
    )
    expect(packageJson.scripts["v1.37:integrity-authority:check"]).toBe(
      "pnpm exec tsx scripts/generate-v1-37-integrity-authority.ts --check",
    )
    expect(packageJson.scripts["v1.37:worker-retirement:check"]).toBe(
      "pnpm exec tsx scripts/check-v1-37-worker-retirement.ts",
    )
    expect(packageJson.scripts["v1.37:integrity-boundaries:check"]).toBe(
      "pnpm exec tsx scripts/check-v1-37-integrity-boundaries.ts",
    )
    expect(packageJson.scripts["v1.37:kernel-integrity:write"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-37-kernel-integrity.ts --write --run-browser",
    )
    expect(packageJson.scripts["v1.37:kernel-integrity:check"]).toBe(
      "pnpm exec tsx scripts/evaluate-v1-37-kernel-integrity.ts --check",
    )
    expect(packageJson.scripts["boundary:monitors"]).not.toContain(
      "pnpm v1.36:competition-policy:check",
    )
    expect(packageJson.scripts["boundary:monitors"]).not.toContain(
      "pnpm v1.36:competition-boundaries:check",
    )
    expect(packageJson.scripts["boundary:monitors"]).not.toContain(
      "pnpm v1.36:final-proof:check",
    )
    expect(packageJson.scripts["boundary:monitors"]).toContain(
      "pnpm v1.36:historical-proof:check && pnpm v1.37:integrity-authority:check && pnpm v1.37:worker-retirement:check && pnpm v1.37:integrity-boundaries:check && pnpm v1.37:kernel-integrity:check && pnpm v1.37:executable-conformance:check && pnpm exec tsx scripts/check-boundary-monitors.ts",
    )
    expect(
      packageJson.scripts["boundary:monitors"].match(
        /pnpm v1\.37:kernel-integrity:check/gu,
      ),
    ).toHaveLength(1)
    expect(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.37:integrity-boundaries:check",
      ),
    ).toBeLessThan(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.37:kernel-integrity:check",
      ),
    )
    expect(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.37:kernel-integrity:check",
      ),
    ).toBeLessThan(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm exec tsx scripts/check-boundary-monitors.ts",
      ),
    )
    expect(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.35:final-proof:check",
      ),
    ).toBeLessThan(
      packageJson.scripts["boundary:monitors"].indexOf(
        "pnpm v1.36:historical-proof:check",
      ),
    )
  })

  it("serializes the pure executable conformance check exactly once", () => {
    expect(validateV137ExecutableConformanceMonitorWiring()).toContain(
      "exactly once",
    )
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>
    }
    const boundary = packageJson.scripts["boundary:monitors"]!
    expect(boundary).not.toContain("v1.37:executable-conformance:write")
    expect(
      boundary.match(/pnpm v1\.37:executable-conformance:check/gu),
    ).toHaveLength(1)
  })

  it("checks v1.35 account provider entry proof artifacts without live dependencies", () => {
    expect(checkV135AccountProviderEntryProofMonitor()).toBe(
      "v1.35 account provider entry proof artifacts are current",
    )
  })

  it("checks v1.35 boundary inventory artifacts without live dependencies", () => {
    const root = createTempRepo()
    try {
      writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })

      expect(checkV135BoundarySurfaceInventoryMonitor({ repoRoot: root })).toBe(
        "v1.35 boundary surface inventory artifacts are current",
      )
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it("fails v1.35 boundary inventory monitor on missing and stale artifacts", () => {
    const root = createTempRepo()
    try {
      expect(() =>
        checkV135BoundarySurfaceInventoryMonitor({ repoRoot: root }),
      ).toThrow(
        ".planning/artifacts/v1.35-boundary-surface-inventory.json is missing",
      )

      writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
      writeFileSync(
        path.join(
          root,
          ".planning/artifacts/v1.35-boundary-surface-inventory.md",
        ),
        "# stale inventory artifact\n",
      )

      expect(() =>
        checkV135BoundarySurfaceInventoryMonitor({ repoRoot: root }),
      ).toThrow(
        ".planning/artifacts/v1.35-boundary-surface-inventory.md is stale",
      )
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it("fails v1.35 boundary inventory monitor on row ID, disposition, downstream phase, and affected requirements drift", () => {
    const root = createTempRepo()
    try {
      writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
      const jsonPath = path.join(
        root,
        ".planning/artifacts/v1.35-boundary-surface-inventory.json",
      )
      const artifact = JSON.parse(readFileSync(jsonPath, "utf8")) as {
        rows: V135BoundarySurfaceRow[]
        surfaces: V135BoundarySurfaceRow[]
      }
      const driftedRow = {
        ...artifact.rows[0]!,
        id: "v135-account-save-go-typescript-proof-drifted",
        disposition: "quarantine" as const,
        downstreamPhase: 245 as const,
        affectedRequirements: ["INV-01", "INV-02", "AUTH-01"] as const,
      }
      artifact.rows = [driftedRow, ...artifact.rows.slice(1)]
      artifact.surfaces = artifact.rows
      writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`)

      expect(() =>
        checkV135BoundarySurfaceInventoryMonitor({ repoRoot: root }),
      ).toThrow(/row presence|disposition|downstreamPhase|affectedRequirements/)
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it("fails v1.35 boundary inventory monitor on forbidden overclaim patterns", () => {
    const rows = [
      "production sandbox certification",
      "TinyGo production support",
      "package ecosystem support",
      "rich-package support",
      "host import support",
      "TypeScript/Python WASM isolation",
    ].map((claim) => ({
      ...generateV135BoundarySurfaceInventory().rows[0]!,
      currentBehavior: `Claims ${claim}.`,
    }))

    for (const row of rows) {
      expect(() =>
        checkV135BoundarySurfaceInventoryMonitor({ rows: [row] }),
      ).toThrow(/forbidden overclaim/)
    }
  })

  it("fails v1.35 boundary inventory monitor on public/default leakage markers", () => {
    const markers = [
      "raw diagnostics",
      "source",
      "artifact bytes",
      "host paths",
      "env values",
      "tokens",
      "DB details",
      "private runtime internals",
      "StrategyMemory",
      "SoldierMemory",
      "objective payload",
    ] as const

    for (const marker of markers) {
      expect(() =>
        checkV135BoundarySurfaceInventoryMonitor({
          rows: [
            {
              ...generateV135BoundarySurfaceInventory().rows[0]!,
              dataClass: "public",
              currentBehavior: `Returns ${marker}.`,
            },
          ],
        }),
      ).toThrow(/forbidden public\/default leakage/)
    }
  })

  it("checks v1.36 competition policy artifacts and calibrated public beta trial competition copy", () => {
    const root = createTempRepo()
    try {
      const rows = generateV136CompetitionSurfaceInventory().rows.map(
        clearPostureRequirement,
      )
      writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root, rows })
      writeTempFile(
        root,
        "apps/web/app/competitions/page.tsx",
        "public beta trial competition with resettable Season-scoped standings; no durable permanent rating promise",
      )

      expect(
        checkV136CompetitionPolicyMonitor({
          repoRoot: root,
          rows,
        }),
      ).toBe("v1.36 competition policy artifacts are current")
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it("fails v1.36 competition policy monitor on durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, and private-runtime overclaims", () => {
    const root = createTempRepo()
    try {
      writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root })
      const rows = generateV136CompetitionSurfaceInventory().rows.map(
        clearPostureRequirement,
      )

      writeTempFile(
        root,
        "apps/web/app/competitions/page.tsx",
        [
          "Coward's Game has durable permanent ratings.",
          "All runtime lanes provide production sandbox certification.",
          "Strategies can use the full npm ecosystem.",
          "TinyGo is a production Strategy lane.",
          "Public results show raw runtime diagnostics.",
          "Public pages expose private runtime internals.",
        ].join("\n"),
      )

      expect(() =>
        checkV136CompetitionPolicyMonitor({
          repoRoot: root,
          rows,
          includeDefaultSuppressions: false,
        }),
      ).toThrow(
        /durable-rating|production-sandbox|package-ecosystem|tinygo-production|raw-diagnostic|private-runtime/,
      )
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  })

  it("fails v1.36 competition policy monitor when posture-required inventory references lack required labels", () => {
    const root = createTempRepo()
    try {
      const rows = generateV136CompetitionSurfaceInventory().rows.map(
        clearPostureRequirement,
      )
      rows[0] = {
        ...rows[0]!,
        references: ["apps/web/app/competitions/page.tsx"],
        postureLabelRequired: true,
        requiredPostureCopy: "public beta trial competition",
        requiredResetNoDurableCopy:
          "resettable Season-scoped standings; no durable permanent rating promise",
      }
      writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root, rows })
      writeTempFile(root, "apps/web/app/competitions/page.tsx", "Competition")

      expect(() =>
        checkV136CompetitionPolicyMonitor({
          repoRoot: root,
          rows,
          includeDefaultSuppressions: false,
        }),
      ).toThrow(
        /public beta trial competition|resettable Season-scoped standings/,
      )
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
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

  it("fails report-only baseline count growth", () => {
    expect(() =>
      assertReportOnlyBoundaryOffenseCount(22, new Set(["one", "two"])),
    ).toThrow(/report-only offense baseline grew/)
    expect(() =>
      assertReportOnlyBoundaryOffenseCount(1, new Set(["one", "two"])),
    ).not.toThrow()
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
    expect(() =>
      assertMonitorPublicPayload({ reporterUserId: "user:private" }),
    ).toThrow(/private field/i)
    expect(() =>
      assertMonitorPublicPayload({ recoveryEvidence: "private" }),
    ).toThrow(/private field/i)
  })

  it("fails worker quarantine artifacts that contain private markers", () => {
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: { token: "secret", strategyMemory: {} },
      }),
    ).toThrow(/artifact private field/)
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: {
          note: "owner debug details",
          environment: "DATABASE_URL",
          sourceText: "hidden",
        },
      }),
    ).toThrow(/artifact privacy marker|artifact private field/)
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: {
          connection: "postgres://example",
          source: "strategy code",
        },
      }),
    ).toThrow(/artifact privacy marker|artifact private field/)
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: {
          owner_debug: true,
          databaseUrl: "postgresql://example",
          accessToken: "secret",
        },
      }),
    ).toThrow(/artifact privacy marker|artifact private field/)
    expect(() =>
      validateV116TypeScriptWorkerQuarantineArtifact({
        ...createV116WorkerQuarantineArtifact(),
        diagnosticExample: {
          "owner-debug": true,
          databaseURL: "POSTGRESQL://example",
          access_token: "secret",
          strategy_memory: {},
        },
      }),
    ).toThrow(/artifact privacy marker|artifact private field/)
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

  it("detects direct product language branching outside approved boundaries", () => {
    const repoRoot = mkdtempSync(path.join(tmpdir(), "cowards-language-"))
    try {
      const file = "apps/web/app/account/unsafe-language-branch.ts"
      const absolutePath = path.join(repoRoot, file)
      mkdirSync(path.dirname(absolutePath), { recursive: true })
      writeFileSync(
        absolutePath,
        [
          "export const label = (sourceFormat: string) => {",
          "  if (sourceFormat === 'python') return 'PY'",
          "  return 'TS'",
          "}",
        ].join("\n"),
      )

      expect(
        findDirectLanguageSpecialCases({
          repoRoot,
          files: [file],
          approvedFiles: new Set(),
        }),
      ).toEqual([
        {
          path: file,
          line: 2,
          languageId: "python",
          snippet: "sourceFormat === 'python'",
        },
      ])
      expect(
        findDirectLanguageSpecialCases({
          repoRoot,
          files: [file],
          approvedFiles: new Set([file]),
        }),
      ).toEqual([])
    } finally {
      rmSync(repoRoot, { force: true, recursive: true })
    }
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

  it("validates the v1.16 no-TypeScript-backend topology artifact", () => {
    const artifact = createV116NoTypeScriptBackendTopologyArtifact()

    expect(validateV116NoTypeScriptBackendTopologyArtifact(artifact)).toContain(
      "v1.16 no-TypeScript-backend topology artifact checked",
    )
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact({
        ...artifact,
        allowedTypeScriptProcesses: [
          "web_frontend",
          "isolated_js_ts_runtime_service",
          "typescript_service_backend",
        ],
      }),
    ).toThrow(/allowed TypeScript processes/)
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact({
        ...artifact,
        strictTopologyMode: {
          ...(artifact.strictTopologyMode as Record<string, unknown>),
          requires: ["web_health"],
        },
      }),
    ).toThrow(/representative_page_smoke/)
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact({
        ...artifact,
        failureDrills: {
          ...(artifact.failureDrills as Record<string, unknown>),
          stoppedGo: {
            failClosed: true,
            typescriptFallbackObserved: true,
          },
        },
      }),
    ).toThrow(/stopped-Go/)
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact({
        ...artifact,
        monitorMode: {
          ...(artifact.monitorMode as Record<string, unknown>),
          requiredLiveTopology: "v1.15_lifecycle",
        },
      }),
    ).toThrow(/live monitor topology/)
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact({
        ...artifact,
        pageSmoke: {
          ...(artifact.pageSmoke as Record<string, unknown>),
          representativeMajorPageTypesRequired: false,
        },
      }),
    ).toThrow(/representativeMajorPageTypesRequired/)
    expect(() =>
      validateV116NoTypeScriptBackendTopologyArtifact(
        artifact,
        "token DATABASE_URL Strategy source",
      ),
    ).toThrow(/private marker|private field/)
  })

  it("validates the final v1.16 TypeScript surface labels contract", () => {
    const artifact = createV116FinalTypeScriptSurfaceLabels()
    expect(validateV116FinalTypeScriptSurfaceLabels(artifact)).toContain(
      "final TypeScript surface labels",
    )
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        capabilityGroups: {
          ...(artifact.capabilityGroups as Record<string, unknown>),
          Workshop: undefined,
        },
      }),
    ).toThrow(/missing capability group Workshop/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        sourceInventorySurfaceCount: 1,
      }),
    ).toThrow(/source inventory count/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: [
          ...(artifact.surfaces as Array<Record<string, unknown>>).slice(1),
          {
            ...(artifact.surfaces as Array<Record<string, unknown>>)[0],
            path: "apps/web/app/not-in-inventory.ts",
          },
        ],
      }),
    ).toThrow(/not in source inventory|missing final label/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  taxonomyRole: "deferred",
                  selectedNormal: true,
                }
              : surface,
        ),
      }),
    ).toThrow(/selectedNormal/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.surfaceLabel === "private-owner-debug-replay"
              ? { ...surface, gate: "debug query only" }
              : surface,
        ),
      }),
    ).toThrow(/owner-debug/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.surfaceLabel === "test-support-route"
              ? { ...surface, gate: "open route" }
              : surface,
        ),
      }),
    ).toThrow(/test-support/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.path === "packages/persistence/src/workshop.ts"
              ? {
                  ...surface,
                  surfaceLabel: "deferred-service-support",
                  capabilityGroup: "owner-debug",
                }
              : surface,
        ),
      }),
    ).toThrow(/workshop\.ts semantic label/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.path === "packages/persistence/src/ladder.ts"
              ? {
                  ...surface,
                  surfaceLabel: "private-owner-debug-replay",
                  capabilityGroup: "owner-debug",
                }
              : surface,
        ),
      }),
    ).toThrow(/ladder\.ts semantic label/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.path === "packages/persistence/src/governance.ts"
              ? {
                  ...surface,
                  surfaceLabel: "deferred-service-support",
                  capabilityGroup: "owner-debug",
                }
              : surface,
        ),
      }),
    ).toThrow(/governance\.ts semantic label/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.path === "packages/persistence/src/ladder.ts"
              ? {
                  ...surface,
                  privacyClass: "public",
                }
              : surface,
        ),
      }),
    ).toThrow(/privacyClass/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface) =>
            surface.path === "packages/persistence/src/ladder.ts"
              ? {
                  ...surface,
                  publicOutputPrivacy: "public",
                }
              : surface,
        ),
      }),
    ).toThrow(/publicOutputPrivacy/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  publicOutputExample: { token: "Bearer secret" },
                }
              : surface,
        ),
      }),
    ).toThrow(/public output\/shareable label leak/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  reason: "contains DATABASE_URL",
                }
              : surface,
        ),
      }),
    ).toThrow(/privacyClass|shareable label leak/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  privacyClass: "DATABASE_URL",
                }
              : surface,
        ),
      }),
    ).toThrow(/privacyClass|shareable label leak/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  taxonomyRole: "DATABASE_URL",
                  selectedNormal: false,
                }
              : surface,
        ),
      }),
    ).toThrow(/taxonomyRole|shareable label leak/)
    expect(() =>
      validateV116FinalTypeScriptSurfaceLabels({
        ...artifact,
        surfaces: (artifact.surfaces as Array<Record<string, unknown>>).map(
          (surface, index) =>
            index === 0
              ? {
                  ...surface,
                  publicOutputPrivacy: "DATABASE_URL",
                }
              : surface,
        ),
      }),
    ).toThrow(/publicOutputPrivacy|shareable label leak/)
  })

  it("passes the live repository monitor checks", async () => {
    const previousLiveTopology = process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY
    process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY = "1"
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("127.0.0.1:3107/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "runtime-execution-service-v1.17",
            runtimeAbiVersion: "strategy-runtime-abi-v1.17",
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
        return new Response(
          "<h1>Public Strategy card</h1><p>Go Parity Sentinel</p>",
          { status: 200 },
        )
      }
      if (url.startsWith("http://localhost:3000/")) {
        return new Response(
          [
            "Strategy Workshop",
            "Competitive account",
            "Competitive Alpha",
            "Sign in",
            "Create account",
            "Evidence Explorer",
            "Player profile",
            "Go Parity Player",
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

    try {
      const checks = await runBoundaryMonitorChecks()
      expect(checks.filter((check) => !check.ok)).toEqual([])
      expect(checks.map((check) => check.layer)).toEqual(
        expect.arrayContaining([
          "contract_drift",
          "privacy",
          "web_boundary",
          "language_provider",
          "checker_contract",
          "runtime_adapter",
          "runtime_isolation",
          "non_js_runtime",
          "go_parity",
          "topology",
          "surface_labels",
        ]),
      )
      const topology = checks.find(
        (check) => check.name === "live v1.15 topology diagnostics",
      )
      expect(topology?.detail).toContain(
        "required live v1.16 no-TypeScript-backend topology diagnostics checked",
      )
      const inventory = checks.find(
        (check) => check.name === "v1.35 boundary surface inventory",
      )
      expect(inventory).toMatchObject({
        layer: "contract_drift",
        ok: true,
        detail: "v1.35 boundary surface inventory artifacts are current",
      })
      const v136History = checks.find(
        (check) => check.name === "v1.36 immutable historical proof",
      )
      expect(v136History).toMatchObject({
        layer: "contract_drift",
        ok: true,
        detail: "validated 8 artifacts against 11 archived source blobs",
      })
      expect(checks.map((check) => check.name)).toEqual(
        expect.arrayContaining([
          "v1.35 boundary surface inventory",
          "v1.36 immutable historical proof",
          "v1.37 direct worker retirement",
          "v1.37 integrity creation inventory",
        ]),
      )
    } finally {
      if (previousLiveTopology === undefined) {
        delete process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY
      } else {
        process.env.COWARDS_REQUIRE_LIVE_TOPOLOGY = previousLiveTopology
      }
    }
  }, 60_000)
})
