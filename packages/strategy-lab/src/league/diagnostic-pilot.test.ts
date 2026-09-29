import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { afterEach, describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot } from "../contracts.js"
import type { FactorySupervisionProvider } from "../factory/admission.js"
import { createFactoryRepository } from "../factory/repository.js"
import { createLeagueCell } from "./contracts.js"
import { issueDiagnosticPilotProviderFromFactoryCandidate, issueLeagueProviderFromFactoryCandidate, runDiagnosticPilotCell, type FactorySupervisedRuntimeHost } from "./connected-runner.js"
import {
  DIAGNOSTIC_PILOT_PHASE264_STORE,
  DIAGNOSTIC_PILOT_STORE,
  admitDiagnosticPilotAllocation,
  createDiagnosticPilotAllocation,
  createDiagnosticPilotCell,
  createDiagnosticPilotStart,
  createDiagnosticPilotTerminal,
  createDiagnosticPilotLifetimeGrant,
  openDiagnosticPilotLedger,
  readDiagnosticPilotAssessedPair,
  reopenDiagnosticPilotLedger,
  verifyDiagnosticPilotLedger,
} from "./diagnostic-pilot.js"

const allocation = () => createDiagnosticPilotAllocation({
  implementationRoot: labRoot("pilot-test", "implementation"),
  sourceClosureRoot: labRoot("pilot-test", "source"),
  gateRoot: labRoot("pilot-test", "gate"),
})

describe("diagnostic-only pilot identity and precharge", () => {
  it("admits exactly four canonical S01/S03 Smoke conditions under a distinct root", () => {
    const admitted = admitDiagnosticPilotAllocation(allocation())
    expect(admitted.evidenceClass).toBe("diagnostic_only")
    expect(admitted.cells).toHaveLength(4)
    expect(admitted.cells.map((cell) => cell.conditionId)).toEqual([
      "set-condition:sha256:8c78a3488ff1b3bfe21231e8183fabdfb1428b3c40e8be0466cca17e51036bad",
      "set-condition:sha256:51ded4d1bb28d7de00b00059b3fc0b66598785037ac907bb772f6aeecaf49aa5",
      "set-condition:sha256:6da20d83323911acf4891eb6736ebd372138364762905268e340852f364cbf68",
      "set-condition:sha256:bbec91404c09ac50622b0bc25b09fd8d20dbcd037d62e2fdd2c07f7ff17be7af",
    ])
    expect(admitted.perMatchMilliseconds).toBe(240_000)
    expect(admitted.overallMilliseconds).toBe(1_800_000)
    expect(admitted.retryCount).toBe(0)
    expect(admitted.leagueRequirementsEvidence).toBe(false)
    expect(() => admitDiagnosticPilotAllocation({ ...admitted, public: true })).toThrow()
    expect(() => admitDiagnosticPilotAllocation({ ...admitted, cells: admitted.cells.slice(0, 3) })).toThrow()
    expect(() => admitDiagnosticPilotAllocation({ schemaVersion: "league-prospective-execution-allocation-v1", root: admitted.root })).toThrow()
  })

  it("treats an unpersisted start as uncertain, not provider authority", () => {
    const admitted = allocation()
    const cell = createDiagnosticPilotCell(admitted, 0)
    const start = createDiagnosticPilotStart(admitted, cell)
    expect(() => verifyDiagnosticPilotLedger({ readStart: () => null, readTerminal: () => null }, admitted, cell, start)).toThrow()
  })
})

const historicalPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../", DIAGNOSTIC_PILOT_PHASE264_STORE)
const historicalIt = existsSync(historicalPath) ? it : it.skip
const temporaryRoots: string[] = []
const originalCwd = process.cwd()
afterEach(() => { process.chdir(originalCwd); for (const path of temporaryRoots.splice(0)) rmSync(path, { recursive: true, force: true }) })

/** Every runtime is an injected inert identity provider. Phase 264 is read-only;
 * the durable ledger is under a disposable test directory, never the reserved pilot store. */
historicalIt("reopens the exact S01/S03 closure without whole-store replay", () => {
  const pair = readDiagnosticPilotAssessedPair(createFactoryRepository(historicalPath))
  expect(pair.map((entry) => [entry.slot, entry.admission.root])).toEqual([
    ["S01", "sha256:850d8c03d00b6dd8791a68403801e55c37fcaf6f6f2f9c31105b782cbf9f26f5"],
    ["S03", "sha256:f5cd002a1cece02fb4f9a63ea1d952354dd57558307be2304326cd806274a774"],
  ])
}, 30_000)

historicalIt("reopens one durable pilot charge before either issuance in both orders; rejects forged and legacy handles", async () => {
  const factoryRepository = createFactoryRepository(historicalPath)
  const assessed = readDiagnosticPilotAssessedPair(factoryRepository)
  const allocated = allocation(), cell = createDiagnosticPilotCell(allocated, 0), start = createDiagnosticPilotStart(allocated, cell)
  const log: string[] = []
  const testRoot = realpathSync(mkdtempSync(join(tmpdir(), "diagnostic-pilot-test-")))
  temporaryRoots.push(testRoot)
  mkdirSync(join(testRoot, ".strategy-lab"), { mode: 0o700 })
  const ledgerDirectory = join(testRoot, DIAGNOSTIC_PILOT_STORE)
  mkdirSync(ledgerDirectory, { mode: 0o700 })
  process.chdir(testRoot)
  const ledger = openDiagnosticPilotLedger(ledgerDirectory)
  const host: FactorySupervisedRuntimeHost = {
    createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot, budgetRoot, executableRoot }) {
      if (attemptRoot === start.root) {
        expect(ledger.readStart(start.root)).toEqual(start)
        log.push(`reopen:${start.root}`)
        log.push("pilot-provider")
      } else log.push("legacy-provider")
      const defaults = defaultRuntimeMetadata("typescript")
      const revision = buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
      return {
        identity: { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: labRoot("pilot-test", "harness"), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot },
        invoke() { throw new Error("inert injected provider must not execute") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } },
      } as FactorySupervisionProvider
    },
  }
  const issue = (entry: typeof assessed[number]) => {
    const seat = cell.bottomCandidateRoot === entry.candidate.root ? "bottom" : "top"
    const pilotLifetimeGrant = createDiagnosticPilotLifetimeGrant(ledger, allocated, cell, start, seat)
    return issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository, ledger, allocation: allocated, cell, start, requestRoot: cell.requestRoot, assessed: entry, pilotLifetimeGrant })
  }
  expect(() => issue(assessed[0])).toThrow("PRECHARGE_ABSENT")
  expect(log).not.toContain("pilot-provider")
  ledger.writeStart(start)
  log.push("durable-precharge")
  expect(reopenDiagnosticPilotLedger(ledger, allocated).records[0]).toMatchObject({ processValidity: "process_invalid", terminal: null })
  for (const [iteration, order] of ([[0, 1], [1, 0]] as const).entries()) {
    const first = issue(assessed[order[0]]), second = issue(assessed[order[1]])
    const handles = first.seat === "bottom" ? { bottom: first, top: second } : { bottom: second, top: first }
    expect(first.identity.attemptRoot).toBe(start.root)
    expect(second.identity.budgetRoot).toBe(allocated.root)
    expect(log.filter((entry) => entry === "pilot-provider")).toHaveLength(2 * (iteration + 1))
    expect(() => JSON.stringify(first)).toThrow("NON_SERIALIZABLE")
    const request = { ledger, allocation: allocated, cell, start, requestRoot: cell.requestRoot, bottom: handles.bottom, top: handles.top, match: {} as never }
    await expect(runDiagnosticPilotCell({ ...request, bottom: { ...handles.bottom } as never })).rejects.toThrow("PILOT_UNISSUED_PROVIDER")
    await expect(runDiagnosticPilotCell({ ...request, bottom: { ...handles.top } as never })).rejects.toThrow("PILOT_UNISSUED_PROVIDER")
    const legacyCell = createLeagueCell({ populationRoot: labRoot("pilot-test", "population"), pairRoot: labRoot("pilot-test", "pair"), entrantCandidateRoot: assessed[0].candidate.root, opponentCandidateRoot: assessed[1].candidate.root, conditionRoot: labRoot("pilot-test", "condition"), semanticGeometryHash: cell.semanticGeometryHash, tupleRoot: cell.tupleRoot, runtimeRoot: cell.runtimeRoot, requestRoot: cell.requestRoot })
    const legacyStart = { cellRoot: legacyCell.root, allocationRoot: allocated.root, root: labRoot("league-cell-start-v1", { cellRoot: legacyCell.root, allocationRoot: allocated.root }) }
    const legacy = issueLeagueProviderFromFactoryCandidate({ ...assessed[0].closure, host, cell: legacyCell, start: legacyStart, allocationRoot: allocated.root })
    await expect(runDiagnosticPilotCell({ ...request, bottom: legacy as never })).rejects.toThrow("PILOT_UNISSUED_PROVIDER")
  }
  expect(log[0]).toBe("durable-precharge")
  const providerIndexes = log.flatMap((entry, index) => entry === "pilot-provider" ? [index] : [])
  expect(providerIndexes).toHaveLength(4)
  for (const index of providerIndexes) expect(log[index - 1]).toBe(`reopen:${start.root}`)
  const pilotLifetimeGrant = createDiagnosticPilotLifetimeGrant(ledger, allocated, cell, start, "bottom")
  expect(() => issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository, ledger, allocation: { ...allocated, evidenceClass: "empirical" } as never, cell, start, requestRoot: cell.requestRoot, assessed: assessed[0], pilotLifetimeGrant })).toThrow("ALLOCATION_MISMATCH")
  expect(() => issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository, ledger, allocation: allocated, cell, start: { ...start, root: labRoot("pilot-test", "wrong") }, requestRoot: cell.requestRoot, assessed: assessed[0], pilotLifetimeGrant })).toThrow("START_MISMATCH")
  expect(() => issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository, ledger, allocation: allocated, cell, start, requestRoot: cell.requestRoot, assessed: { ...assessed[0] }, pilotLifetimeGrant })).toThrow("UNAUTHENTICATED_CLOSURE")
  expect(log.filter((entry) => entry === "pilot-provider")).toHaveLength(4)
  expect(CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.id === "arena:smoke:v1")).toBe(true)
  const failed = createDiagnosticPilotTerminal(start, { disposition: "system_failure", processValidity: "process_invalid", evidenceRoot: null, cleanupComplete: true, elapsedMilliseconds: 1, artifactBytes: 0, artifactRecords: 0, code: "system_failure" })
  ledger.writeTerminal(failed)
  expect(reopenDiagnosticPilotLedger(ledger, allocated).records[0]?.terminal?.root).toBe(failed.root)
  expect(JSON.stringify(failed)).not.toMatch(/sourceBytes|strategyMemory|soldierMemory|objectivePayload/u)
  expect(() => issue(assessed[0])).toThrow("PRECHARGE_ALREADY_TERMINAL")
}, 60_000)
