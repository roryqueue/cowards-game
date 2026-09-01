import { describe, expect, it } from "vitest"
import {
  LEAN_AUTHORITY_FALSE,
  LEAN_CURRENT_FORMATION_ROOT,
  buildLeanSchedule,
  createLeanManifest,
  deriveAndValidateLeanTerminal,
  leanRequestRealismRoot,
  projectLeanV118Response,
  resolveLeanExecutionArena,
  reduceLeanExecutions,
  validateLeanManifest,
  type LeanExecutionRecord,
} from "./v1-38-lean-runner-feasibility.js"
import { CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"

const root = (value: string) => `sha256:${value.repeat(64).slice(0, 64)}` as const

const successfulRecords = (): LeanExecutionRecord[] =>
  buildLeanSchedule().map((cell) => ({
    ...cell,
    classification: "success",
    cleanupComplete: true,
    orphanedChild: false,
    boardRealism: true,
    integrityValid: true,
    requestRealismRoot: leanRequestRealismRoot(cell),
    currentFormationRoot: LEAN_CURRENT_FORMATION_ROOT,
    outcomeRoot: root(cell.cellId.includes("pass:a") ? "1" : "1"),
    finalStateRoot: root("2"),
    transitionEventRoot: root("3"),
    runtimeAccountingRoot: root("4"),
  }))

describe("lean schedule", () => {
  it("preserves declared alias cells while binding one active execution arena", () => {
    const openField = buildLeanSchedule().find(({ arenaId }) => arenaId === "arena:open-field:v1")!
    const smoke = buildLeanSchedule().find(({ arenaId }) => arenaId === "arena:smoke:v1")!
    expect(openField).toMatchObject({
      arenaId: "arena:open-field:v1",
      arenaLabel: "Open Field",
      executionArenaId: "arena:smoke:v1",
      executionArenaLabel: "Smoke",
      executionSemanticGeometryHash: openField.semanticGeometryHash,
    })
    expect(smoke).toMatchObject({
      arenaId: "arena:smoke:v1",
      arenaLabel: "Smoke",
      executionArenaId: "arena:smoke:v1",
      executionArenaLabel: "Smoke",
      executionSemanticGeometryHash: smoke.semanticGeometryHash,
    })
    expect(openField.baseCellId).toContain("arena:open-field:v1")
    expect(openField.chargedIdentity).toContain("arena:open-field:v1")
  })

  it.each([
    ["missing target", (catalog: any) => { catalog.arenas[2].aliasOf = "arena:missing:v1" }],
    ["chained alias", (catalog: any) => { catalog.arenas[0].status = "historical_alias"; catalog.arenas[0].schedulable = false; catalog.arenas[0].aliasOf = "arena:standard-cross:v1" }],
    ["inactive target", (catalog: any) => { catalog.arenas[0].status = "historical_alias"; catalog.arenas[0].schedulable = false }],
    ["unschedulable target", (catalog: any) => { catalog.arenas[0].schedulable = false }],
    ["geometry mismatch", (catalog: any) => { catalog.arenas[2].semanticGeometryHash = catalog.arenas[1].semanticGeometryHash }],
    ["cyclic alias", (catalog: any) => { catalog.arenas[0].status = "historical_alias"; catalog.arenas[0].schedulable = false; catalog.arenas[0].aliasOf = "arena:open-field:v1" }],
  ])("rejects %s before execution", (_label, mutate) => {
    const catalog = structuredClone(CANONICAL_ARENA_CATALOG_V1_37)
    mutate(catalog)
    expect(() => resolveLeanExecutionArena(catalog, "arena:open-field:v1")).toThrow(/LEAN_ARENA_/u)
  })

  it("pre-enumerates 12 cells twice in pass order", () => {
    const schedule = buildLeanSchedule()
    expect(schedule).toHaveLength(24)
    expect(new Set(schedule.map(({ baseCellId }) => baseCellId)).size).toBe(12)
    expect(schedule.slice(0, 12).every(({ pass }) => pass === "pass:a")).toBe(true)
    expect(schedule.slice(12).every(({ pass }) => pass === "pass:b")).toBe(true)
    expect(new Set(schedule.map(({ chargedIdentity }) => chargedIdentity)).size).toBe(24)
  })

  it("passes only complete identical successful evidence", () => {
    const passing = reduceLeanExecutions(successfulRecords())
    expect(passing.result).toBe("pass")
    expect(passing.counts).toEqual({
      success: 24,
      playerViolation: 0,
      systemFailure: 0,
      timeout: 0,
      cancelled: 0,
      unlaunched: 0,
    })
    expect(passing.determinism).toEqual({ comparedCells: 12, mismatchCount: 0 })
    expect(passing.historicalFullMatrix).toEqual({
      disposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reinterpreted: false,
    })
    expect(passing.authority).toEqual(LEAN_AUTHORITY_FALSE)
    expect(passing.evidence).toHaveLength(24)
    expect(deriveAndValidateLeanTerminal(passing)).toEqual(passing)
  })

  it.each([
    "player_violation",
    "system_failure",
    "timeout",
    "cancelled",
    "unlaunched",
  ] as const)("rejects %s", (classification) => {
    const records = successfulRecords()
    const original = records[4]!
    if (classification === "player_violation") records[4] = { ...original, classification }
    else {
      const { outcomeRoot: _outcome, finalStateRoot: _state, transitionEventRoot: _events, runtimeAccountingRoot: _accounting, requestRealismRoot: _request, currentFormationRoot: _formation, ...base } = original
      records[4] = { ...base, classification }
    }
    expect(reduceLeanExecutions(records).result).toBe("non_pass")
  })

  it("marks malformed coverage invalid and semantic drift non-pass", () => {
    const records = successfulRecords()
    expect(reduceLeanExecutions(records.slice(1)).result).toBe("invalid")
    expect(reduceLeanExecutions([...records, records[0]!]).result).toBe("invalid")
    records[12] = { ...records[12]!, outcomeRoot: root("9") }
    expect(reduceLeanExecutions(records).result).toBe("non_pass")
  })

  it("rejects equal but malformed semantic roots", () => {
    const records = successfulRecords()
    records[0] = { ...records[0]!, outcomeRoot: "not-a-sha" as never }
    records[12] = { ...records[12]!, outcomeRoot: "not-a-sha" as never }
    expect(reduceLeanExecutions(records).result).toBe("invalid")
  })

  it("requires cleanup and all four semantic roots", () => {
    for (const mutation of [
      { cleanupComplete: false },
      { orphanedChild: true },
      { boardRealism: false },
      { finalStateRoot: root("8") },
      { transitionEventRoot: root("8") },
      { runtimeAccountingRoot: root("8") },
    ]) {
      const records = successfulRecords()
      records[12] = { ...records[12]!, ...mutation }
      expect(reduceLeanExecutions(records).result).toBe(
        mutation.cleanupComplete === false || mutation.orphanedChild === true || mutation.boardRealism === false ? "invalid" : "non_pass",
      )
    }
  })

  it("rejects every claimed terminal field that contradicts rederived evidence", () => {
    const terminal = reduceLeanExecutions(successfulRecords())
    for (const mutation of [
      { result: "non_pass" },
      { counts: { ...terminal.counts, success: 23, systemFailure: 1 } },
      { determinism: { comparedCells: 11, mismatchCount: 0 } },
      { completeCleanup: false },
    ]) expect(() => deriveAndValidateLeanTerminal({ ...terminal, ...mutation })).toThrow(/LEAN_TERMINAL_DERIVATION_MISMATCH/u)
  })

  it("rejects missing, duplicate, extra, reordered, mischarged, and unsafe evidence", () => {
    const terminal = reduceLeanExecutions(successfulRecords())
    const mutations = [
      terminal.evidence.slice(1),
      [...terminal.evidence, terminal.evidence[0]],
      [...terminal.evidence.slice(0, 1), terminal.evidence[0], ...terminal.evidence.slice(1)],
      [terminal.evidence[1], terminal.evidence[0], ...terminal.evidence.slice(2)],
      terminal.evidence.map((cell, index) => index === 3 ? { ...cell, chargedIdentity: "lean-charge:forged" } : cell),
      terminal.evidence.map((cell, index) => index === 3 ? { ...cell, privateDiagnostics: "secret" } : cell),
    ]
    for (const evidence of mutations) expect(() => deriveAndValidateLeanTerminal({ ...terminal, evidence })).toThrow()
  })

  it("rejects false realism, malformed roots, and cross-pass semantic drift from evidence", () => {
    const terminal = reduceLeanExecutions(successfulRecords())
    for (const mutation of [
      { boardRealism: false },
      { requestRealismRoot: root("9") },
      { currentFormationRoot: root("9") },
      { outcomeRoot: "not-a-root" },
      { finalStateRoot: root("9") },
    ]) {
      const evidence = terminal.evidence.map((cell, index) => index === 12 ? { ...cell, ...mutation } : cell)
      expect(() => deriveAndValidateLeanTerminal({ ...terminal, evidence })).toThrow()
    }
  })
})

describe("lean manifest", () => {
  it("strictly preserves custody, history, formation absence, and authority", () => {
    const manifest = createLeanManifest({
      commit: "a".repeat(40),
      tree: "b".repeat(40),
      executableBlobs: { "scripts/example.ts": "c".repeat(40) },
    })
    expect(validateLeanManifest(manifest)).toEqual(manifest)
    expect(manifest.claimClass).toBe("fixture_feasibility_only")
    expect(manifest.formationMaterialized).toBe(false)
    expect(manifest.authority).toEqual(LEAN_AUTHORITY_FALSE)
    expect(() => validateLeanManifest({ ...manifest, extra: true })).toThrow()
    expect(() =>
      validateLeanManifest({
        ...manifest,
        historicalFullMatrix: { ...manifest.historicalFullMatrix, reinterpreted: true },
      }),
    ).toThrow()
    for (const key of Object.keys(manifest.authority)) {
      expect(() =>
        validateLeanManifest({
          ...manifest,
          authority: { ...manifest.authority, [key]: true },
        }),
      ).toThrow()
    }
  })

  it("projects only typed v1.18 receipt anchors without deleting semantic fields", () => {
    const response = {
      contractVersion: "runtime-execution-service-v1.18",
      ok: true,
      kind: "executionResult",
      requestId: "request:lean",
      matchId: "match:lean",
      result: {
        privacy: "public_receipt",
        chronicleCanonicalHash: root("1"),
        transitionTraceRoot: root("2"),
        finalStateCanonicalHash: root("3"),
        outcomeCanonicalHash: root("4"),
        terminal: { status: "complete", reason: "elimination" },
        accounting: {
          budgetProfileRoot: root("5"),
          ledgerPrestateRoot: root("6"),
          ledgerPoststateRoot: root("7"),
        },
        resultClass: "success",
        ownership: "gameplay",
        retryable: false,
        mutationStatus: "committed",
        semanticReceipt: { claim: {}, algorithm: "Ed25519", keyId: "fixture", signatureBase64: "" },
      },
    } as never
    expect(projectLeanV118Response(response)).toEqual({
      classification: "success",
      outcomeRoot: root("4"),
      finalStateRoot: root("3"),
      transitionEventRoot: expect.stringMatching(/^sha256:/u),
      runtimeAccountingRoot: expect.stringMatching(/^sha256:/u),
    })
  })
})
