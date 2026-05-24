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
  allowedRoles,
  checkTypeScriptBackendInventoryArtifacts,
  generateTypeScriptBackendInventory,
  renderTypeScriptBackendInventoryJson,
  renderTypeScriptBackendInventoryMarkdown,
  validateTypeScriptBackendInventory,
  writeTypeScriptBackendInventoryArtifacts,
  type TypeScriptBackendInventory,
} from "./generate-typescript-backend-inventory.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-ts-backend-inventory-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  writeFileSync(
    path.join(root, ".planning/artifacts/v1.15-typescript-surface-labels.json"),
    `${JSON.stringify(
      {
        surfaces: [
          {
            surface: "apps/web/app/api/exhibitions/route.ts",
            role: "frontend",
            normalBackendOwner: "go_backend_when_selected",
            fallbackPolicy: "fail_closed_without_COWARDS_GO_BACKEND_URL",
          },
        ],
      },
      null,
      2,
    )}\n`,
  )
  return root
}

const writeSource = (root: string, repoPath: string, source: string) => {
  const absolutePath = path.join(root, repoPath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, source)
}

const createFixtureRepo = (): string => {
  const root = createTempRepo()
  writeSource(
    root,
    "apps/web/app/api/exhibitions/route.ts",
    `import { competitiveServer } from "../../competitive/server.js"
export async function GET() { return Response.json({ ok: true }) }
export const POST = async () => Response.json({ ok: true })
`,
  )
  writeSource(
    root,
    "apps/web/app/api/workshop/submit/route.ts",
    `export { POST } from "../revisions/route.js"
`,
  )
  writeSource(
    root,
    "apps/web/app/api/workshop/revisions/route.ts",
    `export const POST = async () => Response.json({ ok: true })
`,
  )
  writeSource(
    root,
    "apps/web/app/competitive/server.ts",
    `import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsService } from "@cowards/service"
export const competitiveServer = { createDatabasePool, createCowardsService }
`,
  )
  writeSource(
    root,
    "apps/web/app/matches/server.ts",
    `import { createPostgresChronicleStore } from "@cowards/persistence/chronicle-store"
export const loadReplay = () => createPostgresChronicleStore
`,
  )
  writeSource(
    root,
    "apps/web/app/workshop/server.ts",
    `import { validateWorkshopSource } from "@cowards/persistence/workshop"
export const workshopServer = { validateWorkshopSource }
`,
  )
  writeSource(
    root,
    "apps/web/lib/public-service-adapter.ts",
    `import { createCowardsService } from "@cowards/service"
export const createPublicAdapter = () => createCowardsService
`,
  )
  writeSource(
    root,
    "apps/web/lib/workshop-read-service-adapter.ts",
    `import { createDatabasePool } from "@cowards/persistence/db"
import { createCowardsService } from "@cowards/service"
export const createWorkshopReadAdapter = () => [createDatabasePool, createCowardsService]
`,
  )
  writeSource(
    root,
    "apps/worker/src/runner.ts",
    `import { claimNextMatchJob, completeMatch } from "@cowards/persistence/quarantine-lifecycle"
export const runWorkerOnce = () => [claimNextMatchJob, completeMatch]
`,
  )
  writeSource(
    root,
    "apps/runtime-service/src/server.ts",
    `import { executeMatch } from "./execute-match.js"
export const startRuntimeService = () => executeMatch
`,
  )
  writeSource(
    root,
    "apps/runtime-service/src/execute-match.ts",
    `import { executeStrategyRuntimeAbiV114 } from "@cowards/runtime-js"
export const executeMatch = () => executeStrategyRuntimeAbiV114
`,
  )
  writeSource(
    root,
    "packages/runtime-js/src/abi-bridge.ts",
    `export const executeStrategyRuntimeAbiV114 = () => ({ ok: true })
`,
  )
  writeSource(
    root,
    "packages/persistence/src/jobs.ts",
    `export const claimNextMatchJob = () => "claim"
`,
  )
  writeSource(
    root,
    "packages/persistence/src/complete-match.ts",
    `export const completeMatch = () => "complete"
`,
  )
  writeSource(
    root,
    "packages/persistence/src/chronicle-store.ts",
    `export const createPostgresChronicleStore = () => "chronicle"
`,
  )
  writeSource(
    root,
    "packages/persistence/src/workshop.ts",
    `export const validateWorkshopSource = () => "workshop"
`,
  )
  writeSource(
    root,
    "packages/service/src/index.ts",
    `import { createPostgresChronicleStore } from "@cowards/persistence/chronicle-store"
export const createCowardsService = () => createPostgresChronicleStore
`,
  )
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

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

    expect(
      inventory.surfaces.find(
        (surface) =>
          surface.path === "apps/web/app/api/workshop/submit/route.ts",
      ),
    ).toMatchObject({
      routeMethods: ["POST"],
      routePath: "/workshop/submit",
    })
  })

  it("discovers backend-like imports through direct imports and local import chains for BASE-01", () => {
    const root = createFixtureRepo()

    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
    const route = inventory.surfaces.find(
      (surface) => surface.path === "apps/web/app/api/exhibitions/route.ts",
    )
    const worker = inventory.surfaces.find(
      (surface) => surface.path === "apps/worker/src/runner.ts",
    )
    const runtime = inventory.surfaces.find(
      (surface) => surface.path === "apps/runtime-service/src/execute-match.ts",
    )

    expect(route?.localBackendImports).toContain(
      "apps/web/app/competitive/server.ts",
    )
    expect(worker).toMatchObject({
      role: "rollback-only",
      usesDatabase: true,
      claimsJobs: true,
      completesMatches: true,
    })
    expect(worker?.imports.map((entry) => entry.source)).toContain(
      "@cowards/persistence/quarantine-lifecycle",
    )
    expect(runtime).toMatchObject({
      role: "runtime-service",
      executesStrategy: true,
      usesDatabase: false,
    })
    expect(
      inventory.surfaces.find(
        (surface) =>
          surface.path === "apps/web/lib/workshop-read-service-adapter.ts",
      ),
    ).toMatchObject({
      role: "deferred",
      usesDatabase: true,
      normalBackendOwner: "deferred_until_workshop_go_migration",
    })
    expect(
      inventory.surfaces.some(
        (surface) => surface.path === "packages/runtime-js/src/abi-bridge.ts",
      ),
    ).toBe(true)
  })

  it("validates only the strict Phase 103 role taxonomy for BASE-02", () => {
    const root = createFixtureRepo()
    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })

    expect(inventory.allowedRoles).toEqual(allowedRoles)
    expect(validateTypeScriptBackendInventory(inventory)).toEqual([])
    expect(
      validateTypeScriptBackendInventory({
        ...inventory,
        surfaces: [
          {
            ...inventory.surfaces[0]!,
            role: "typescript-backend",
          },
        ],
      } as unknown as TypeScriptBackendInventory),
    ).toContain(
      `${inventory.surfaces[0]!.path} has invalid role typescript-backend`,
    )
    expect(
      validateTypeScriptBackendInventory({
        ...inventory,
        allowedRoles: ["frontend-only", "legacy"],
      } as unknown as TypeScriptBackendInventory),
    ).toContain("allowedRoles contains a role outside the Phase 103 taxonomy")
    expect(
      validateTypeScriptBackendInventory({
        ...inventory,
        surfaces: [
          {
            ...inventory.surfaces.find(
              (surface) =>
                surface.path ===
                "apps/web/lib/workshop-read-service-adapter.ts",
            )!,
            role: "frontend-only",
          },
        ],
      }),
    ).toContain(
      "apps/web/lib/workshop-read-service-adapter.ts frontend-only row claims TypeScript backend imports or database access",
    )
  })

  it("labels Phase 106 quarantine lifecycle modules as non-normal lifecycle support", () => {
    const root = createFixtureRepo()
    writeSource(
      root,
      "packages/persistence/src/quarantine-lifecycle.ts",
      `export { claimNextMatchJob } from "./jobs.js"
export { completeMatch } from "./complete-match.js"
export const TYPE_SCRIPT_LIFECYCLE_QUARANTINE = { normalBackend: false }
`,
    )

    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
    const quarantine = inventory.surfaces.find(
      (surface) =>
        surface.path === "packages/persistence/src/quarantine-lifecycle.ts",
    )

    expect(quarantine).toMatchObject({
      role: "quarantined",
      normalBackendOwner: "go_backend",
      fallbackPolicy: "no_silent_typescript_backend_fallback",
      claimsJobs: true,
      completesMatches: true,
    })
    expect(quarantine?.gate).toContain("quarantine")
  })

  it("keeps Phase 103 artifacts free of token-bearing command values", () => {
    const phaseArtifacts = [
      ".planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-SUMMARY.md",
      ".planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-REVIEW.md",
      ".planning/phases/103-typescript-backend-inventory-and-retirement-contract/103-VALIDATION.md",
    ]
      .map((file) => readFileSync(file, "utf8"))
      .join("\n")

    expect(phaseArtifacts).not.toMatch(/TOKENS?=[^<\s][^\s]*/i)
    expect(phaseArtifacts).not.toContain(["local", "owner", "token"].join("-"))
  })

  it("requires owner, reason, gate, risk, and future migration for deferred and rollback-only entries", () => {
    const root = createFixtureRepo()
    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })
    const rollback = inventory.surfaces.find(
      (surface) => surface.role === "rollback-only",
    )!
    const deferred = inventory.surfaces.find(
      (surface) => surface.role === "deferred",
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
    expect(
      validateTypeScriptBackendInventory({
        ...inventory,
        surfaces: [{ ...deferred, gate: "", futureMigration: "" }],
      }),
    ).toEqual(
      expect.arrayContaining([
        `${deferred.path} deferred entry missing gate`,
        `${deferred.path} deferred entry missing futureMigration`,
      ]),
    )
  })

  it("detects stale JSON and markdown artifacts in check mode", () => {
    const root = createFixtureRepo()

    expect(
      checkTypeScriptBackendInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.16-typescript-backend-inventory.json is missing",
      ".planning/artifacts/v1.16-typescript-backend-inventory.md is missing",
    ])

    const inventory = writeTypeScriptBackendInventoryArtifacts({
      repoRoot: root,
    })
    expect(
      checkTypeScriptBackendInventoryArtifacts({ repoRoot: root }),
    ).toEqual([])

    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.16-typescript-backend-inventory.md",
      ),
      "# stale\n",
    )
    expect(
      checkTypeScriptBackendInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.16-typescript-backend-inventory.md is stale",
    ])

    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.16-typescript-backend-inventory.json",
      ),
      renderTypeScriptBackendInventoryJson(inventory),
    )
    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.16-typescript-backend-inventory.md",
      ),
      renderTypeScriptBackendInventoryMarkdown(inventory),
    )
    expect(
      JSON.parse(
        readFileSync(
          path.join(
            root,
            ".planning/artifacts/v1.16-typescript-backend-inventory.json",
          ),
          "utf8",
        ),
      ).schemaVersion,
    ).toBe("v1.16-typescript-backend-inventory")
    expect(
      checkTypeScriptBackendInventoryArtifacts({ repoRoot: root }),
    ).toEqual([])
  })

  it("records BASE-02 through BASE-06 monitor-ready global contract fields", () => {
    const root = createFixtureRepo()

    const inventory = generateTypeScriptBackendInventory({ repoRoot: root })

    expect(inventory.schemaVersion).toBe("v1.16-typescript-backend-inventory")
    expect(inventory.milestone).toBe("v1.16")
    expect(inventory.globalPolicies.normalTypeScriptBackendAllowed).toBe(false)
    expect(inventory.baselineReferences.goBackendBaselineCapabilities).toEqual(
      expect.arrayContaining([
        "normal orchestration",
        "persistence-facing API behavior",
        "Match lifecycle",
        "Chronicle persistence handoff",
        "MatchSet scoring/status refresh",
        "selected exhibition creation",
        "public MatchSet summary",
        "public replay metadata",
        "selected public replay evidence",
      ]),
    )
    expect(inventory.globalPolicies.nonGoals.join("\n")).toContain(
      "No Runtime Broker implementation.",
    )
    expect(inventory.surfaces[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        path: expect.any(String),
        kind: expect.any(String),
        role: expect.any(String),
        retirementAction: expect.any(String),
        owner: expect.any(String),
        reason: expect.any(String),
        gate: expect.any(String),
        risk: expect.any(String),
        futureMigration: expect.any(String),
        currentOwner: expect.any(String),
        normalBackendOwner: expect.any(String),
        fallbackPolicy: expect.any(String),
        privacyClass: expect.any(String),
        enforcementStatus: expect.any(String),
        routeMethods: expect.any(Array),
        goRouteIds: expect.any(Array),
        sourceRefs: expect.any(Array),
      }),
    )
  })

  it("keeps the committed v1.16 artifact synchronized with every scanner root for BASE-01", () => {
    const inventory = JSON.parse(
      readFileSync(
        ".planning/artifacts/v1.16-typescript-backend-inventory.json",
        "utf8",
      ),
    ) as TypeScriptBackendInventory
    const generated = generateTypeScriptBackendInventory()

    expect(inventory.surfaces.map((surface) => surface.path).sort()).toEqual(
      generated.surfaces.map((surface) => surface.path).sort(),
    )
    expect(inventory.surfaces.length).toBeGreaterThan(0)
    expect(
      inventory.surfaces.some((surface) => surface.kind === "next-api-route"),
    ).toBe(true)
    expect(
      inventory.surfaces.some((surface) => surface.kind === "worker-module"),
    ).toBe(true)
    expect(
      inventory.surfaces.some(
        (surface) => surface.kind === "runtime-service-module",
      ),
    ).toBe(true)
    expect(
      inventory.surfaces.some(
        (surface) => surface.kind === "persistence-module",
      ),
    ).toBe(true)
    expect(
      inventory.surfaces.some((surface) => surface.kind === "service-module"),
    ).toBe(true)
    expect(
      inventory.surfaces.find(
        (surface) => surface.path === "apps/web/app/matches/replay-fixture.ts",
      ),
    ).toMatchObject({
      role: "fixture-only",
      usesDatabase: true,
    })
  })

  it("keeps the committed v1.16 artifact on the BASE-03, BASE-05, and BASE-06 contract", () => {
    const inventory = JSON.parse(
      readFileSync(
        ".planning/artifacts/v1.16-typescript-backend-inventory.json",
        "utf8",
      ),
    ) as TypeScriptBackendInventory

    expect(inventory.baselineReferences.goBackendBaselineArtifacts).toEqual(
      expect.arrayContaining([
        ".planning/artifacts/v1.15-lifecycle-ownership-manifest.json",
        ".planning/artifacts/v1.15-typescript-surface-labels.json",
        ".planning/artifacts/v1.15-live-web-go-runtime-topology.json",
        ".planning/artifacts/v1.15-failure-drills.json",
        ".planning/artifacts/v1.15-promotion-decision.md",
        ".planning/artifacts/v1.15-boundary-baseline.md",
      ]),
    )
    expect(inventory.baselineReferences.goBackendBaselineCapabilities).toEqual(
      expect.arrayContaining([
        "normal orchestration",
        "persistence-facing API behavior",
        "Match lifecycle",
        "Chronicle persistence handoff",
        "MatchSet scoring/status refresh",
        "selected exhibition creation",
        "public MatchSet summary",
        "public replay metadata",
        "selected public replay evidence",
      ]),
    )
    expect(inventory.globalPolicies).toMatchObject({
      normalTypeScriptBackendAllowed: false,
      goExecutesStrategyCode: false,
      webExecutesStrategyCode: false,
      nodeVmSecurityBoundaryAllowed: false,
      nodeWasiUntrustedSandboxAllowed: false,
      productionSandboxReplacementInScope: false,
      runtimeBrokerImplementationInScope: false,
      countedNonJsPlayInScope: false,
      goMigrationSchemaOwnershipInScope: false,
      cloudDeploymentInScope: false,
    })
    expect(inventory.globalPolicies.publicOutputForbiddenByDefault).toEqual(
      expect.arrayContaining([
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
        "tokens",
        "DB DSNs",
      ]),
    )
  })

  it("does not label runtime persistence imports as frontend-only for BASE-04", () => {
    const inventory = JSON.parse(
      readFileSync(
        ".planning/artifacts/v1.16-typescript-backend-inventory.json",
        "utf8",
      ),
    ) as TypeScriptBackendInventory

    const frontendRowsWithRuntimePersistenceImports = inventory.surfaces
      .filter((surface) => surface.role === "frontend-only")
      .filter((surface) =>
        surface.persistenceImports.some(
          (entry) => !entry.statementText.trimStart().startsWith("import type"),
        ),
      )
      .map((surface) => surface.path)

    expect(frontendRowsWithRuntimePersistenceImports).toEqual([])
  })
})
