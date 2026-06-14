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
  allowedRequirementIds,
  checkV135BoundarySurfaceInventoryArtifacts,
  generateV135BoundarySurfaceInventory,
  requiredSurfaceGroups,
  validateV135BoundarySurfaceInventory,
  writeV135BoundarySurfaceInventoryArtifacts,
  type V135BoundarySurfaceInventory,
  type V135BoundarySurfaceRow,
} from "./evaluate-v1-35-boundary-surface-inventory.ts"

const tempRoots: string[] = []

const createTempRepo = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "cowards-v135-inventory-"))
  tempRoots.push(root)
  mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

const baseRows = (): V135BoundarySurfaceRow[] => [
  {
    id: "account-save-go-typescript-proof",
    surfaceGroup: "account-save",
    codeReferences: [
      "apps/go-backend/live_backend.go#createStrategyRevision",
    ],
    currentOwner: "Go account revision write path",
    intendedOwner: "Go with runtime-service provider proof for execution-ready saves",
    trustBoundary: "session account request -> Go persistence write",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "ACCT-01"],
    currentBehavior:
      "TypeScript account save is inventoried as current drift and Phase 244 owns provider-proof parity.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 244 account-save provider proof tests"],
    privacyRisks: ["Source and provider diagnostics must remain private."],
    downstreamPhase: 244,
  },
  {
    id: "account-source-read-private",
    surfaceGroup: "account-source-read",
    codeReferences: [
      "apps/web/app/api/account/revisions/[revisionId]/source/route.ts",
    ],
    currentOwner: "Web API source read transport",
    intendedOwner: "Server-authorized account source read",
    trustBoundary: "session account request -> private source response",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "AUTH-02"],
    currentBehavior: "Private source read is inventoried for server authorization.",
    disposition: "quarantine",
    requiredTestsOrProof: ["Phase 245 account source authorization tests"],
    privacyRisks: ["Strategy source must not appear in public/default output."],
    downstreamPhase: 245,
  },
  {
    id: "owner-debug-replay-request",
    surfaceGroup: "owner-debug-replay",
    codeReferences: ["apps/web/app/matches/[matchId]/replay/owner-debug.ts"],
    currentOwner: "Replay route owner-debug request parser",
    intendedOwner: "Server-authorized owner-private replay projection",
    trustBoundary: "replay query request -> server authorization",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "PRIV-01"],
    currentBehavior: "Query parameters request owner view but cannot grant it.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 245 owner-debug authorization tests"],
    privacyRisks: ["Owner-debug payloads must be absent from public replay."],
    downstreamPhase: 245,
  },
  {
    id: "workshop-source-alias",
    surfaceGroup: "workshop-alias",
    codeReferences: ["apps/web/app/api/workshop/source/route.ts"],
    currentOwner: "Legacy Workshop source alias",
    intendedOwner: "Deprecated or migrated Workshop route policy",
    trustBoundary: "Workshop local route -> source payload",
    dataClass: "owner-private",
    affectedRequirements: ["INV-01", "INV-02", "API-01"],
    currentBehavior: "Alias is inventoried as a possible bypass until Phase 245 decides fate.",
    disposition: "deprecate-remove",
    requiredTestsOrProof: ["Phase 245 alias migration or removal tests"],
    privacyRisks: ["Source alias must not bypass account authorization."],
    downstreamPhase: 245,
  },
  {
    id: "competition-entry-proof",
    surfaceGroup: "competition-entry",
    codeReferences: ["apps/go-backend/live_backend.go#createExhibition"],
    currentOwner: "Go exhibition entry gate",
    intendedOwner: "Provider-proof-backed entry eligibility",
    trustBoundary: "account revision -> entry eligibility",
    dataClass: "session",
    affectedRequirements: ["INV-01", "INV-02", "ENTRY-01"],
    currentBehavior: "Entry gate drift is inventoried for Phase 244 provider proof.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 244 Go and persistence entry parity tests"],
    privacyRisks: ["Entry diagnostics must be public-safe."],
    downstreamPhase: 244,
  },
  {
    id: "go-read-write-account",
    surfaceGroup: "go-read-write",
    codeReferences: ["apps/go-backend/live_backend.go"],
    currentOwner: "Go selected backend routes",
    intendedOwner: "Go-owned account and public read/write boundary",
    trustBoundary: "HTTP API -> Go backend -> PostgreSQL",
    dataClass: "session",
    affectedRequirements: ["INV-01", "INV-02", "ACCT-02"],
    currentBehavior: "Go read/write surfaces are inventoried as the normal backend.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 244 Go route parity proof"],
    privacyRisks: ["Account writes must not emit raw diagnostics."],
    downstreamPhase: 244,
  },
  {
    id: "provider-proof-runtime-service",
    surfaceGroup: "provider-proof",
    codeReferences: ["apps/runtime-service/src/server.ts"],
    currentOwner: "Runtime-service provider validation",
    intendedOwner: "Runtime-service provider validation",
    trustBoundary: "provider validation request -> proof metadata",
    dataClass: "internal-private",
    affectedRequirements: ["INV-01", "INV-02", "PROOF-02"],
    currentBehavior: "Provider proof is evidence, not a sandbox certification claim.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 248 service-backed provider proof"],
    privacyRisks: ["Provider signing material must remain private."],
    downstreamPhase: 248,
  },
  {
    id: "sandbox-claim-contract",
    surfaceGroup: "sandbox-claim",
    codeReferences: ["packages/spec/src/runtime.ts"],
    currentOwner: "Spec runtime labels",
    intendedOwner: "Versioned sandbox-readiness contract",
    trustBoundary: "runtime metadata -> public/developer labels",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "SBOX-01"],
    currentBehavior:
      "Claims must say TypeScript/Python provenance-only, Rust/Zig immutable WASM/WASI Preview 1 artifact-backed, TinyGo spike-only/hidden, and no current lane certified.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 246 claim drift monitor"],
    privacyRisks: ["Public labels must not include private runtime internals."],
    downstreamPhase: 246,
  },
  {
    id: "package-policy-none",
    surfaceGroup: "package-policy",
    codeReferences: ["packages/spec/src/runtime.ts"],
    currentOwner: "Spec package policy",
    intendedOwner: "Production package mode none enforcement",
    trustBoundary: "strategy metadata -> validation and entry policy",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "PKG-01"],
    currentBehavior: "Current production package policy keeps package mode none.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 247 package mode none monitor"],
    privacyRisks: ["Package diagnostics must omit package paths and host paths."],
    downstreamPhase: 247,
  },
  {
    id: "tinygo-hidden-spike",
    surfaceGroup: "tinygo-visibility",
    codeReferences: [".planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md"],
    currentOwner: "Runtime evidence artifacts",
    intendedOwner: "TinyGo hidden spike-only policy",
    trustBoundary: "candidate runtime evidence -> production-visible labels",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "LABEL-01"],
    currentBehavior: "TinyGo remains spike-only and hidden from production surfaces.",
    disposition: "document-only",
    requiredTestsOrProof: ["Phase 246 TinyGo visibility monitor"],
    privacyRisks: ["Candidate evidence must not imply production visibility."],
    downstreamPhase: 246,
  },
  {
    id: "privacy-monitor-public-output",
    surfaceGroup: "privacy-monitor",
    codeReferences: ["packages/spec/src/public-output-privacy.ts"],
    currentOwner: "Spec public-output privacy monitor",
    intendedOwner: "v1.35 public/default privacy proof",
    trustBoundary: "private runtime/account data -> public/default projection",
    dataClass: "public",
    affectedRequirements: ["INV-01", "INV-02", "PROOF-03"],
    currentBehavior: "Public/default projection rows require privacy proof coverage.",
    disposition: "fix-now",
    requiredTestsOrProof: ["Phase 248 public/default privacy scan"],
    privacyRisks: ["Default outputs must redact private markers."],
    downstreamPhase: 248,
  },
]

const inventoryWithRows = (
  rows: readonly V135BoundarySurfaceRow[],
): V135BoundarySurfaceInventory =>
  generateV135BoundarySurfaceInventory({ rows })

describe("v1.35 boundary surface inventory evaluator", () => {
  it("rejects fixtures missing required INV-01 surface groups like account-save", () => {
    const rows = baseRows().filter((row) => row.surfaceGroup !== "account-save")

    expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining(["missing required surface group account-save"]),
    )
    expect(requiredSurfaceGroups).toContain("privacy-monitor")
  })

  it("rejects invalid disposition defer-later with the row ID for INV-02", () => {
    const rows = baseRows()
    rows[0] = { ...rows[0]!, disposition: "defer-later" as never }

    expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining([
        "account-save-go-typescript-proof has invalid disposition defer-later",
      ]),
    )
  })

  it("rejects missing D-05 fields including requiredTestsOrProof and privacyRisks for INV-02", () => {
    const rows = baseRows()
    rows[0] = {
      ...rows[0]!,
      currentOwner: "",
      trustBoundary: "",
      requiredTestsOrProof: [],
      privacyRisks: [],
    }

    expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
      expect.arrayContaining([
        "account-save-go-typescript-proof missing currentOwner",
        "account-save-go-typescript-proof missing trustBoundary",
        "account-save-go-typescript-proof missing requiredTestsOrProof",
        "account-save-go-typescript-proof missing privacyRisks",
      ]),
    )
  })

  it("accepts all v1.35 requirement IDs and rejects unknown requirement or downstream rows with only INV IDs for INV-01", () => {
    expect(allowedRequirementIds).toEqual(
      expect.arrayContaining([
        "ACCT-01",
        "ENTRY-01",
        "AUTH-01",
        "PRIV-01",
        "API-01",
        "SBOX-01",
        "LABEL-01",
        "PKG-01",
        "PROOF-01",
      ]),
    )

    const allRequirementRows = baseRows()
    allRequirementRows[0] = {
      ...allRequirementRows[0]!,
      affectedRequirements: allowedRequirementIds,
    }
    expect(
      validateV135BoundarySurfaceInventory(inventoryWithRows(allRequirementRows)),
    ).toEqual([])

    const unknownRequirementRows = baseRows()
    unknownRequirementRows[0] = {
      ...unknownRequirementRows[0]!,
      affectedRequirements: ["INV-01", "UNKNOWN-01" as never],
    }
    expect(
      validateV135BoundarySurfaceInventory(
        inventoryWithRows(unknownRequirementRows),
      ),
    ).toContain(
      "account-save-go-typescript-proof has unknown requirement UNKNOWN-01",
    )

    const onlyInvRows = baseRows()
    onlyInvRows[0] = {
      ...onlyInvRows[0]!,
      affectedRequirements: ["INV-01", "INV-02"],
    }
    expect(validateV135BoundarySurfaceInventory(inventoryWithRows(onlyInvRows))).toEqual(
      expect.arrayContaining([
        "account-save-go-typescript-proof downstreamPhase 244 requires ACCT-* or ENTRY-* traceability, not only INV IDs",
      ]),
    )
  })

  it("rejects overclaims: production sandbox certification, TypeScript/Python WASM isolation, TinyGo production support, package ecosystem, rich-package, host import", () => {
    for (const phrase of [
      "production sandbox certification",
      "TypeScript/Python WASM isolation",
      "TinyGo production support",
      "package ecosystem support",
      "rich-package support",
      "host import support",
      "package mode declared is production-supported",
    ]) {
      const rows = baseRows()
      rows[7] = { ...rows[7]!, currentBehavior: `Claims ${phrase}.` }

      expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([
          expect.stringContaining("forbidden overclaim"),
        ]),
      )
    }
  })

  it("rejects public/default leakage: raw diagnostics, source, artifact bytes, host paths, env values, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, objective payload", () => {
    for (const marker of [
      "raw diagnostics",
      "source",
      "artifact bytes",
      "host paths",
      "env values",
      "package paths",
      "tokens",
      "DB details",
      "private runtime internals",
      "StrategyMemory",
      "SoldierMemory",
      "objective payload",
    ]) {
      const rows = baseRows()
      rows[10] = {
        ...rows[10]!,
        currentBehavior: `Public/default output exposes ${marker}.`,
      }

      expect(validateV135BoundarySurfaceInventory(inventoryWithRows(rows))).toEqual(
        expect.arrayContaining([
          expect.stringContaining("forbidden public/default leakage"),
        ]),
      )
    }
  })

  it("rejects duplicate row IDs and duplicate code references for the same row family", () => {
    const duplicateIdRows = baseRows()
    duplicateIdRows[1] = {
      ...duplicateIdRows[1]!,
      id: duplicateIdRows[0]!.id,
    }
    expect(
      validateV135BoundarySurfaceInventory(inventoryWithRows(duplicateIdRows)),
    ).toContain("duplicate row id account-save-go-typescript-proof")

    const duplicateReferenceRows = baseRows()
    duplicateReferenceRows[1] = {
      ...duplicateReferenceRows[1]!,
      surfaceGroup: duplicateReferenceRows[0]!.surfaceGroup,
      codeReferences: duplicateReferenceRows[0]!.codeReferences,
    }
    expect(
      validateV135BoundarySurfaceInventory(
        inventoryWithRows(duplicateReferenceRows),
      ),
    ).toContain(
      "duplicate code reference apps/go-backend/live_backend.go#createStrategyRevision in surface group account-save",
    )
  })

  it("reports missing artifacts, then accepts writes, then reports stale markdown and JSON/markdown row-sync drift", () => {
    const root = createTempRepo()

    expect(
      checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.35-boundary-surface-inventory.json is missing",
      ".planning/artifacts/v1.35-boundary-surface-inventory.md is missing",
    ])

    writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
    expect(
      checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([])

    writeFileSync(
      path.join(
        root,
        ".planning/artifacts/v1.35-boundary-surface-inventory.md",
      ),
      "# stale\n",
    )
    expect(
      checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual([
      ".planning/artifacts/v1.35-boundary-surface-inventory.md is stale",
    ])

    writeV135BoundarySurfaceInventoryArtifacts({ repoRoot: root })
    const jsonPath = path.join(
      root,
      ".planning/artifacts/v1.35-boundary-surface-inventory.json",
    )
    const json = JSON.parse(readFileSync(jsonPath, "utf8")) as {
      rows: V135BoundarySurfaceRow[]
    }
    json.rows[0] = {
      ...json.rows[0]!,
      affectedRequirements: ["INV-01", "INV-02", "ACCT-02"],
    }
    writeFileSync(jsonPath, `${JSON.stringify(json, null, 2)}\n`)

    expect(
      checkV135BoundarySurfaceInventoryArtifacts({ repoRoot: root }),
    ).toEqual(
      expect.arrayContaining([
        ".planning/artifacts/v1.35-boundary-surface-inventory.json is stale",
        ".planning/artifacts/v1.35-boundary-surface-inventory.json and .planning/artifacts/v1.35-boundary-surface-inventory.md are desynchronized for account-save-go-typescript-proof affectedRequirements",
      ]),
    )
  })
})
