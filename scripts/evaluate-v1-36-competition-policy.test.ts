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
  COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS,
  COMPETITION_POLICY_V1_36_POSTURE,
} from "../packages/spec/src/competition-policy-v1-36.js"
import {
  allowedDispositions,
  checkV136CompetitionSurfaceInventoryArtifacts,
  checkV136CompetitionPolicyScan,
  defaultScanRoots,
  generateV136CompetitionSurfaceInventory,
  requiredSurfaceGroups,
  scanFileExtensions,
  scanV136CompetitionPolicyTextRoots,
  validateV136CompetitionSurfaceInventory,
  type V136CompetitionPolicyScanSuppression,
  writeV136CompetitionSurfaceInventoryArtifacts,
  type V136CompetitionSurfaceInventory,
  type V136CompetitionSurfaceRow,
} from "./evaluate-v1-36-competition-policy.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v136-inventory-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

const writeTempFile = (root: string, relativePath: string, text: string): void => {
  const absolutePath = path.join(root, relativePath)
  mkdirSync(path.dirname(absolutePath), { recursive: true })
  writeFileSync(absolutePath, text)
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

const baseRows = (): V136CompetitionSurfaceRow[] => [
  {
    id: "competition-index-route",
    surfaceGroup: "routes",
    references: ["apps/web/app/competitions/page.tsx"],
    owner: "Web public competition route",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior: "Displays public competition discovery only.",
    replayEvidenceRequirement: "Links to public result and replay evidence.",
    privacyRisk: "Public route must keep private entrant details excluded.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes: "Public copy surface for the v1.36 trust UX phase.",
  },
  {
    id: "competition-policy-spec",
    surfaceGroup: "spec-dtos",
    references: ["packages/spec/src/competition-policy-v1-36.ts"],
    owner: "Spec competition policy contract",
    authorityOwner: "specContract",
    dataClass: "public",
    countedBehavior: "Defines public projection vocabulary only.",
    replayEvidenceRequirement: "Declares public evidence labels for later DTOs.",
    privacyRisk: "Policy payload must stay public-safe.",
    postureLabelRequired: true,
    requiredPostureCopy: COMPETITION_POLICY_V1_36_POSTURE.publicLabel,
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-03", "POST-04"],
    disposition: "lock-now",
    notes: "POST-03 source policy imported by the evaluator.",
  },
  {
    id: "ladder-persistence-policy",
    surfaceGroup: "persistence",
    references: ["packages/persistence/src/ladder.ts"],
    owner: "Persistence trial ladder policy",
    authorityOwner: "persistence",
    dataClass: "session",
    countedBehavior: "Existing eligibility and Season helpers are inventoried.",
    replayEvidenceRequirement: "Later phases must bind standings to evidence.",
    privacyRisk: "Session decisions must emit public-safe categories.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-250",
    notes: "Entry eligibility handoff row.",
  },
  {
    id: "go-provider-readiness",
    surfaceGroup: "go-backend",
    references: ["apps/go-backend/provider_readiness.go"],
    owner: "Go provider readiness projection",
    authorityOwner: "goBackendOrchestration",
    dataClass: "session",
    countedBehavior: "Readiness evidence informs counted entry later.",
    replayEvidenceRequirement: "Provider readiness must be reproducible.",
    privacyRisk: "Go readiness output must remain coarse.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "fix-in-250",
    notes: "POST-04 backend inventory row.",
  },
  {
    id: "season-page-trust-copy",
    surfaceGroup: "web-pages",
    references: ["apps/web/app/ladder/[seasonId]/page.tsx"],
    owner: "Web Season page",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior: "Shows Season standings and MatchSet links.",
    replayEvidenceRequirement: "Must link included rows to public replay evidence.",
    privacyRisk: "Public page must avoid private runtime details.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-251",
    notes: "Completed and archived Season copy remains trial/resettable.",
  },
  {
    id: "posture-copy-fixture",
    surfaceGroup: "ui-copy",
    references: ["apps/web/app/competitions/[competitionId]/page.tsx"],
    owner: "Web trust copy",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior: "Displays counted status explanations.",
    replayEvidenceRequirement: "Explains evidence availability near results.",
    privacyRisk: "Copy cannot overstate evidence or moderation maturity.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes: "POST-01 and POST-02 copy row.",
  },
  {
    id: "phase-docs-policy",
    surfaceGroup: "docs",
    references: [
      ".planning/phases/249-competition-surface-inventory-and-policy-lock/249-CONTEXT.md",
    ],
    owner: "Phase 249 planning docs",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior: "Locks the policy decisions for downstream plans.",
    replayEvidenceRequirement: "Documents evidence expectations only.",
    privacyRisk: "Planning docs must avoid private payload examples.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "lock-now",
    notes: "D-05 through D-08 source row.",
  },
  {
    id: "boundary-monitor-hook",
    surfaceGroup: "monitors",
    references: ["scripts/check-boundary-monitors.ts"],
    owner: "Static boundary monitor hub",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior: "Checks artifact drift and copy posture later.",
    replayEvidenceRequirement: "Monitors must fail loud on stale evidence.",
    privacyRisk: "Monitor output should report file paths and categories only.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04", "POST-05"],
    disposition: "prove-in-255",
    notes: "Phase 249-03 wires POST-05 checks.",
  },
  {
    id: "inventory-proof-script",
    surfaceGroup: "proof-scripts",
    references: ["scripts/evaluate-v1-36-competition-policy.ts"],
    owner: "Phase 249 inventory evaluator",
    authorityOwner: "staticMonitorProof",
    dataClass: "internal-private",
    countedBehavior: "Generates policy inventory artifacts.",
    replayEvidenceRequirement: "Generated artifacts must be deterministic.",
    privacyRisk: "Script must not embed private competition payloads.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "lock-now",
    notes: "POST-04 evaluator row.",
  },
  {
    id: "v135-proof-baseline",
    surfaceGroup: "proof-artifacts",
    references: [".planning/artifacts/v1.35-boundary-surface-inventory.json"],
    owner: "v1.35 baseline evidence",
    authorityOwner: "staticMonitorProof",
    dataClass: "artifact-private",
    countedBehavior: "Provides baseline runtime and privacy constraints.",
    replayEvidenceRequirement: "Used as prior evidence only.",
    privacyRisk: "Artifacts must remain sanitized for planning use.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-04"],
    disposition: "future/defer",
    notes: "Future milestones can consume archived proof context.",
  },
  {
    id: "inventory-tests",
    surfaceGroup: "tests",
    references: ["scripts/evaluate-v1-36-competition-policy.test.ts"],
    owner: "Vitest inventory coverage",
    authorityOwner: "staticMonitorProof",
    dataClass: "public",
    countedBehavior: "Pins row contract and artifact sync checks.",
    replayEvidenceRequirement: "Tests generated artifact integrity.",
    privacyRisk: "Fixtures must not include private payload examples.",
    postureLabelRequired: false,
    requiredPostureCopy: "",
    requiredResetNoDurableCopy: "",
    affectedRequirements: ["POST-01", "POST-02", "POST-03", "POST-04"],
    disposition: "lock-now",
    notes: "POST-01 POST-02 POST-03 POST-04 coverage.",
  },
  {
    id: "competition-copy-fixtures",
    surfaceGroup: "fixtures",
    references: ["apps/web/app/matchsets/result-view-model.ts"],
    owner: "Public result fixtures",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior: "Fixture-backed results must label counted evidence honestly.",
    replayEvidenceRequirement: "Fixtures must preserve plausible replay links.",
    privacyRisk: "Fixture payloads must not expose private markers.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes: "Fixture row for public copy snapshots.",
  },
  {
    id: "competition-copy-snapshots",
    surfaceGroup: "snapshots",
    references: ["apps/web/app/strategies/[strategyId]/page.tsx"],
    owner: "Public Strategy page snapshots",
    authorityOwner: "webProjection",
    dataClass: "public",
    countedBehavior: "Snapshots must distinguish trial evidence from exhibitions.",
    replayEvidenceRequirement: "Snapshot evidence must point to public replays.",
    privacyRisk: "Snapshots must stay public projection only.",
    postureLabelRequired: true,
    requiredPostureCopy: "public beta trial competition",
    requiredResetNoDurableCopy:
      "resettable Season-scoped standings; no durable permanent rating promise",
    affectedRequirements: ["POST-01", "POST-02", "POST-04"],
    disposition: "fix-in-254",
    notes: "Snapshot row for later POST-05 monitor scope.",
  },
]

const inventoryWithRows = (
  rows: readonly V136CompetitionSurfaceRow[],
): V136CompetitionSurfaceInventory =>
  generateV136CompetitionSurfaceInventory({ rows })

describe("v1.36 competition surface inventory evaluator", () => {
  it("rejects POST-04 fixtures missing required surface groups: routes, spec-dtos, persistence, go-backend, web-pages, ui-copy, docs, monitors, proof-scripts, proof-artifacts, tests, fixtures, snapshots", () => {
    for (const group of requiredSurfaceGroups) {
      const rows = baseRows().filter((row) => row.surfaceGroup !== group)
      expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([`missing required surface group ${group}`]),
      )
    }
  })

  it("rejects invalid dispositions for POST-04 and only accepts lock-now, fix-in-250, fix-in-251, fix-in-252, fix-in-253, fix-in-254, prove-in-255, and future/defer", () => {
    expect(allowedDispositions).toEqual([
      "lock-now",
      "fix-in-250",
      "fix-in-251",
      "fix-in-252",
      "fix-in-253",
      "fix-in-254",
      "prove-in-255",
      "future/defer",
    ])

    const rows = baseRows()
    rows[0] = { ...rows[0]!, disposition: "maybe-later" as never }
    expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining([
        "competition-index-route has invalid disposition maybe-later",
      ]),
    )
  })

  it("rejects POST-04 rows missing owner, public/private data class, counted behavior, replay evidence requirement, privacy risk, posture-label requirement, affected requirement IDs, references, and exactly one downstream disposition", () => {
    const rows = baseRows()
    rows[0] = {
      ...rows[0]!,
      references: [],
      owner: "",
      authorityOwner: "",
      dataClass: "" as never,
      countedBehavior: "",
      replayEvidenceRequirement: "",
      privacyRisk: "",
      postureLabelRequired: undefined as never,
      affectedRequirements: [],
      disposition: "" as never,
    }

    expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining([
        "competition-index-route missing references",
        "competition-index-route missing owner",
        "competition-index-route missing authorityOwner",
        "competition-index-route has invalid dataClass ",
        "competition-index-route missing countedBehavior",
        "competition-index-route missing replayEvidenceRequirement",
        "competition-index-route missing privacyRisk",
        "competition-index-route missing postureLabelRequired",
        "competition-index-route missing affectedRequirements",
        "competition-index-route missing disposition",
      ]),
    )
  })

  it("rejects POST-02 forbidden claims and private markers using competition-policy-v1.36 categories: durable-rating, production-sandbox, package-ecosystem, tinygo-production, raw-diagnostic, private-runtime", () => {
    expect(
      COMPETITION_POLICY_V1_36_FORBIDDEN_CLAIMS.map(
        (claim) => claim.category,
      ),
    ).toEqual(
      expect.arrayContaining([
        "durable-rating",
        "production-sandbox",
        "package-ecosystem",
        "tinygo-production",
        "raw-diagnostic",
        "private-runtime",
      ]),
    )

    for (const category of [
      "durable-rating",
      "production-sandbox",
      "package-ecosystem",
      "tinygo-production",
      "raw-diagnostic",
      "private-runtime",
    ]) {
      const rows = baseRows()
      rows[0] = {
        ...rows[0]!,
        notes: `This row makes a forbidden ${category} claim.`,
      }
      expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`forbidden claim category: ${category}`),
        ]),
      )
    }

    for (const [copy, category] of [
      ["Players now receive permanent ratings in public beta.", "durable-rating"],
      ["TinyGo strategies are now production eligible.", "tinygo-production"],
    ] as const) {
      const rows = baseRows()
      rows[0] = {
        ...rows[0]!,
        notes: copy,
      }
      expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`forbidden claim category: ${category}`),
        ]),
      )
    }

    for (const marker of [
      "Strategy source",
      "artifact bytes",
      "raw diagnostics",
      "host paths",
      "env values",
      "package paths",
      "tokens",
      "DB details",
      "private runtime internals",
      "StrategyMemory",
      "SoldierMemory",
      "objective payloads",
    ]) {
      const rows = baseRows()
      rows[0] = {
        ...rows[0]!,
        notes: `Public/default output exposes ${marker}.`,
      }
      expect(validateV136CompetitionSurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([
          expect.stringContaining("forbidden private marker"),
        ]),
      )
    }
  })

  it("requires POST-01 and POST-02 exact posture copy: public beta trial competition, resettable Season-scoped standings, and no durable permanent rating promise", () => {
    const missingPosture = baseRows()
    missingPosture[0] = {
      ...missingPosture[0]!,
      requiredPostureCopy: "public beta",
    }
    expect(
      validateV136CompetitionSurfaceInventory(
        inventoryWithRows(missingPosture),
      ),
    ).toEqual(
      expect.arrayContaining([
        "competition-index-route must require exact posture copy public beta trial competition",
      ]),
    )

    const missingReset = baseRows()
    missingReset[0] = {
      ...missingReset[0]!,
      requiredResetNoDurableCopy: "resettable standings",
    }
    expect(
      validateV136CompetitionSurfaceInventory(inventoryWithRows(missingReset)),
    ).toEqual(
      expect.arrayContaining([
        "competition-index-route must require resettable Season-scoped standings and no durable permanent rating promise copy",
      ]),
    )
  })

  it("reports missing artifacts, accepts generated artifacts, and reports stale markdown, stale JSON, invalid JSON, row-sync drift, and desynchronized rows for POST-04", () => {
    const root = createTempRepo()

    expect(
      checkV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.36-competition-surface-inventory.json is missing",
      ".planning/artifacts/v1.36-competition-surface-inventory.md is missing",
    ])

    writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root })
    expect(
      checkV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([])

    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.36-competition-surface-inventory.md",
      ),
      "# stale markdown\n",
    )
    expect(
      checkV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.36-competition-surface-inventory.md is stale",
    ])

    writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root })
    const jsonPath = path.join(
      root,
      ".planning/artifacts/v1.36-competition-surface-inventory.json",
    )
    writeFileSync(jsonPath, "{ invalid JSON")
    expect(
      checkV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.36-competition-surface-inventory.json is invalid JSON",
    ])

    writeV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root })
    const json = JSON.parse(readFileSync(jsonPath, "utf8")) as {
      rows: V136CompetitionSurfaceRow[]
    }
    json.rows[0] = {
      ...json.rows[0]!,
      disposition: "fix-in-252",
    }
    writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`)

    expect(
      checkV136CompetitionSurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual(
      expect.arrayContaining([
        ".planning/artifacts/v1.36-competition-surface-inventory.json is stale",
        ".planning/artifacts/v1.36-competition-surface-inventory.json and .planning/artifacts/v1.36-competition-surface-inventory.md are desynchronized for competition-index-route disposition row-sync drift",
      ]),
    )
  })
})

describe("v1.36 competition policy text scanner", () => {
  it("uses defaultScanRoots for .planning, packages, apps, and scripts and includes fixture and __snapshots__ text paths", () => {
    const root = createTempRepo()
    expect(defaultScanRoots).toEqual([".planning", "packages", "apps", "scripts"])

    writeTempFile(
      root,
      ".planning/notes.md",
      "public beta trial competition with resettable Season-scoped standings and no durable permanent rating promise",
    )
    writeTempFile(root, "packages/spec/src/policy.ts", "allowed package text")
    writeTempFile(root, "apps/web/app/fixtures/result.json", "{\"ok\": true}")
    writeTempFile(root, "scripts/__snapshots__/copy.snap", "snapshot text")

    const scan = scanV136CompetitionPolicyTextRoots({
      repoRoot: root,
      rows: baseRows().map((row) => ({ ...row, postureLabelRequired: false })),
      includeDefaultSuppressions: false,
    })

    expect(scan.scannedRoots).toEqual(
      expect.arrayContaining([
        ".planning",
        "packages",
        "apps",
        "scripts",
        "apps/web/app/fixtures",
        "scripts/__snapshots__",
      ]),
    )
    expect(scan.scannedFiles.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        ".planning/notes.md",
        "packages/spec/src/policy.ts",
        "apps/web/app/fixtures/result.json",
        "scripts/__snapshots__/copy.snap",
      ]),
    )
  })

  it("filters supported text extensions and skips node_modules, .next, dist, build, coverage, .git, lockfiles, images, archives, and binary null-byte files", () => {
    const root = createTempRepo()
    const allowedExtensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".md",
      ".mdx",
      ".json",
      ".jsonl",
      ".txt",
      ".go",
      ".yaml",
      ".yml",
      ".snap",
      ".html",
    ]
    expect(scanFileExtensions).toEqual(allowedExtensions)
    for (const extension of allowedExtensions) {
      writeTempFile(root, `packages/copy/file${extension}`, "allowed text")
    }
    for (const ignored of [
      "packages/node_modules/pkg/index.ts",
      "apps/web/.next/server/page.js",
      "packages/spec/dist/index.js",
      "packages/spec/build/index.js",
      "coverage/report.json",
      ".git/config",
      "pnpm-lock.yaml",
      "apps/web/public/image.png",
      "apps/web/archive.zip",
    ]) {
      writeTempFile(root, ignored, "TinyGo production support is available")
    }
    writeTempFile(root, "scripts/binary.ts", "allowed\u0000TinyGo production support is available")

    const scan = scanV136CompetitionPolicyTextRoots({
      repoRoot: root,
      rows: baseRows().map((row) => ({ ...row, postureLabelRequired: false })),
      includeDefaultSuppressions: false,
    })
    const scanned = scan.scannedFiles.map((file) => file.path)
    expect(scanned).toEqual(
      expect.arrayContaining(
        allowedExtensions.map((extension) => `packages/copy/file${extension}`),
      ),
    )
    expect(scanned).not.toEqual(
      expect.arrayContaining([
        "packages/node_modules/pkg/index.ts",
        "apps/web/.next/server/page.js",
        "packages/spec/dist/index.js",
        "packages/spec/build/index.js",
        "coverage/report.json",
        ".git/config",
        "pnpm-lock.yaml",
        "apps/web/public/image.png",
        "apps/web/archive.zip",
        "scripts/binary.ts",
      ]),
    )
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows: baseRows().map((row) => ({ ...row, postureLabelRequired: false })),
      includeDefaultSuppressions: false,
    })).toEqual([])
  })

  it("detects forbidden and private markers across durable-rating, production-sandbox, package-ecosystem, TinyGo-production, raw-diagnostic, and private-runtime copy", () => {
    const root = createTempRepo()
    writeTempFile(root, "apps/web/copy.ts", [
      "Coward's Game has durable permanent ratings.",
      "Players now receive permanent ratings in public beta.",
      "Coward's Game publishes all-time rankings.",
      "Invalidated Matches refund permanent rating.",
      "Every dispute receives staffed moderation review.",
      "All runtime lanes provide production sandbox certification.",
      "Strategies can use the full npm ecosystem.",
      "TinyGo is a production Strategy lane.",
      "TinyGo strategies are now production eligible.",
      "Public results show raw runtime diagnostics.",
      "Public pages expose private runtime internals.",
      "Public replay includes Strategy source.",
    ].join("\n"))

    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows: baseRows().map((row) => ({ ...row, postureLabelRequired: false })),
      includeDefaultSuppressions: false,
    })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/durable-rating/),
        expect.stringMatching(/all-time-ranking/),
        expect.stringMatching(/rating-refund/),
        expect.stringMatching(/mature-staffed-moderation/),
        expect.stringMatching(/production-sandbox/),
        expect.stringMatching(/package-ecosystem/),
        expect.stringMatching(/tinygo-production/),
        expect.stringMatching(/raw-diagnostic/),
        expect.stringMatching(/private-runtime/),
        expect.stringMatching(/private marker.*Strategy source/),
      ]),
    )
  })

  it("does not let a separate negated phrase hide a clear durable-rating or TinyGo-production overclaim on the same line", () => {
    const root = createTempRepo()
    writeTempFile(root, "apps/web/copy.ts", [
      "The product is not permanent, but players now receive permanent ratings.",
      "This is not public; TinyGo strategies are production eligible.",
      "The product is not permanent, players now receive permanent ratings.",
      "This is not public and TinyGo strategies are production eligible.",
      "There are no permanent ratings, permanent ratings are live now.",
      "TinyGo strategies are not production eligible; TinyGo strategies are production eligible.",
      "TinyGo strategies are not production eligible.",
      "TinyGo is not hidden; TinyGo strategies are production eligible.",
      "This contract does not provide production sandbox certification.",
    ].join("\n"))

    const failures = checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows: baseRows().map((row) => ({ ...row, postureLabelRequired: false })),
      includeDefaultSuppressions: false,
    })

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/durable-rating/),
        expect.stringMatching(/tinygo-production/),
      ]),
    )
    expect(failures).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/production-sandbox/),
      ]),
    )
  })

  it("requires public beta trial competition plus resettable Season-scoped standings and no durable permanent rating promise for posture-required references", () => {
    const root = createTempRepo()
    const rows = baseRows()
    rows[0] = {
      ...rows[0]!,
      references: ["apps/web/app/competitions/page.tsx"],
      postureLabelRequired: true,
    }
    writeTempFile(root, "apps/web/app/competitions/page.tsx", "Competition page")

    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
    })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/missing required posture label/),
        expect.stringMatching(/missing required reset\/no-durable copy/),
      ]),
    )

    writeTempFile(
      root,
      "apps/web/app/competitions/page.tsx",
      "public beta trial competition uses resettable Season-scoped standings; no durable permanent rating promise",
    )
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      includeDefaultSuppressions: false,
    })).toEqual([])
  })

  it("requires documented V136CompetitionPolicyScanSuppression fields and exact suppression category/path/matchedPhrase matches", () => {
    const root = createTempRepo()
    writeTempFile(
      root,
      "packages/spec/src/copy.ts",
      [
        "Fixture quote: Coward's Game has durable permanent ratings.",
        "Players receive permanent ratings now.",
      ].join("\n"),
    )
    writeTempFile(
      root,
      "packages/spec/src/sandbox.ts",
      "This contract does not provide production sandbox certification.",
    )
    const rows = baseRows().map((row) => ({
      ...row,
      postureLabelRequired: false,
    }))
    const durableSuppression: V136CompetitionPolicyScanSuppression = {
      path: "packages/spec/src/copy.ts",
      category: "durable-rating",
      matchedPhrase: "Coward's Game has durable permanent ratings",
      rationale: "documents a false positive phrase in a static test fixture",
      owner: "Phase 249 monitor tests",
      expiry: "2026-12-31",
    }

    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      suppressions: [durableSuppression],
      includeDefaultSuppressions: false,
    })).toEqual(expect.arrayContaining([expect.stringMatching(/permanent ratings/)]))
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      suppressions: [
        durableSuppression,
        {
          ...durableSuppression,
          matchedPhrase: "permanent ratings",
        },
      ],
      includeDefaultSuppressions: false,
    })).toEqual([])
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      suppressions: [{ ...durableSuppression, category: "production-sandbox" }],
      includeDefaultSuppressions: false,
    })).toEqual(expect.arrayContaining([expect.stringMatching(/clear violation|durable-rating/)]))
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      suppressions: [{ ...durableSuppression, path: "packages/spec/src/other.ts" }],
      includeDefaultSuppressions: false,
    })).toEqual(expect.arrayContaining([expect.stringMatching(/suppression path|durable-rating/)]))
    expect(checkV136CompetitionPolicyScan({
      repoRoot: root,
      rows,
      suppressions: [
        {
          path: "packages/spec/src/sandbox.ts",
          category: "production-sandbox",
          matchedPhrase: "production sandbox certification",
          rationale: "",
          owner: "Phase 249 monitor tests",
          expiry: "2026-12-31",
        },
      ],
      includeDefaultSuppressions: false,
    })).toEqual(expect.arrayContaining([expect.stringMatching(/invalid suppression/)]))
  })
})
