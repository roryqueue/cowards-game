import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37, defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "@cowards/runtime-js"
import { afterEach, describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { deriveFactoryOraclePacketRoot } from "../factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "../factory/repository.js"
import type { FactorySupervisionProvider } from "../factory/admission.js"
import { createLeagueCell } from "./contracts.js"
import { issueDiagnosticOneCellProviderFromFactoryCandidate, issueDiagnosticPilotProviderFromFactoryCandidate, issueLeagueProviderFromFactoryCandidate, runDiagnosticOneCellCell, runLeagueCell, type FactorySupervisedRuntimeHost } from "./connected-runner.js"
import { DIAGNOSTIC_ONE_CELL_STORE, createDiagnosticOneCellAllocation, createDiagnosticOneCellCell, createDiagnosticOneCellStart, createDiagnosticOneCellStage, createDiagnosticOneCellLifetimeGrant, openDiagnosticOneCellLedger, runAndRetainCanonicalDiagnosticOneCell } from "./diagnostic-one-cell.js"
import { DIAGNOSTIC_PILOT_PHASE264_STORE, createDiagnosticPilotAllocation, readDiagnosticPilotAssessedPair } from "./diagnostic-pilot.js"
import { createLeagueRepository, type LeagueCellStart } from "./repository.js"

const directories: string[] = []
const originalCwd = process.cwd()
const root = (value: string): LabRoot => labRoot("connected-runner-test-v1", value)
const canonical = (value: unknown) => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new Error("fixture canonicalization")
  return admitted.canonicalBytes
}
const temporary = (prefix: string) => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
  directories.push(directory)
  return directory
}
afterEach(() => { process.chdir(originalCwd); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const fixture = (name: string) => {
  const factoryRepository = createFactoryRepository(temporary("factory-league-test-"))
  const sourceBytes = new TextEncoder().encode(`// ${name}\nexport default { selectActivations(input) { return { activationOrders: [], strategyMemory: {} }; }, soldierBrain() { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} }; } }`)
  const sourceRoot = `sha256:${createHash("sha256").update(sourceBytes).digest("hex")}` as LabRoot
  const base = factoryOraclePacketFixture()
  const draft = { ...base, source: { ...base.source, root: sourceRoot, sha256: sourceRoot, byteLength: sourceBytes.byteLength } }
  const packet = { ...draft, root: deriveFactoryOraclePacketRoot(draft) }
  const proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  const candidate = factoryCandidateFixture(proposal, validation, root(`${name}:receipt`))
  const descriptorValue = { schemaVersion: "factory-candidate-publication-v1", privacy: "private_offline", candidate, independenceReceipt: { root: root(`${name}:independence`) }, supervisionReceiptRoot: candidate.supervisionReceiptRoot, independenceStatus: "unresolved" }
  const descriptor = { ...descriptorValue, root: labRoot("factory-candidate-publication-v1", descriptorValue) }
  return {
    factoryRepository, candidate,
    candidatePublicationArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(descriptor)),
    sourceArtifactRoot: publishFactoryArtifact(factoryRepository, sourceBytes),
    packetArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(packet)),
    proposalArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(proposal)),
    validationArtifactRoot: publishFactoryArtifact(factoryRepository, canonical(validation)),
  }
}

const providerHost = (): FactorySupervisedRuntimeHost => ({
  createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot, budgetRoot, executableRoot }) {
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    const identity = {
      revisionId: revision.id,
      sourceRoot: admission.sourceRoot,
      executableRoot,
      tupleId: "candidate-kernel-v1.19",
      tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
      image: LAB_ADMITTED_ROOTS.image,
      harnessRoot: root("harness"), budgetRoot, attemptRoot,
      runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
      nativeLane: admission.nativeLane,
      factoryPacketRoot: admission.packetRoot,
      factoryProposalRoot: admission.proposalRoot,
      factoryValidationRoot: admission.validationRoot,
    }
    return { identity, invoke() { throw new Error("safe injected runtime must not execute source") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } } as FactorySupervisionProvider
  },
})

describe("host-issued connected league runner", () => {
  it("re-admits persisted candidate closures, marks host-issued providers privately, and terminalizes a full-kernel result", async () => {
    const bottom = fixture("bottom"), top = fixture("top"), leagueRepository = createLeagueRepository(temporary("league-runner-test-"))
    const cell = createLeagueCell({ populationRoot: root("population"), pairRoot: root("pair"), entrantCandidateRoot: bottom.candidate.root, opponentCandidateRoot: top.candidate.root, conditionRoot: root("condition"), semanticGeometryHash: root("arena"), tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, requestRoot: root("request") })
    const start: LeagueCellStart = { root: labRoot("league-cell-start-v1", { cellRoot: cell.root, allocationRoot: root("allocation") }), cellRoot: cell.root, allocationRoot: root("allocation") }
    const issue = (value: ReturnType<typeof fixture>) => issueLeagueProviderFromFactoryCandidate({ ...value, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })
    const issuedBottom = issue(bottom), issuedTop = issue(top)
    expect(issuedBottom.producerBuildRoot).toBe(bottom.candidate.proposal.build.buildRoot)
    expect(issuedBottom.identity.executableRoot).not.toBe(issuedBottom.producerBuildRoot)
    expect(() => issueLeagueProviderFromFactoryCandidate({ ...bottom, host: { createFactorySupervisedRuntime(input) { const provider = providerHost().createFactorySupervisedRuntime(input); return { ...provider, identity: { ...provider.identity, executableRoot: bottom.candidate.proposal.build.buildRoot } } } }, cell, start, allocationRoot: start.allocationRoot })).toThrow("PROVIDER_IDENTITY")
    const result = await runLeagueCell({ repository: leagueRepository, start, cell, bottom: issuedBottom, top: issuedTop, requestRoot: cell.requestRoot, match: { matchId: "safe-fixture", seed: "safe-seed", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!, initialInitiativePlayerId: "bottom", bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }, runCanonicalLabMatch: async () => ({ kind: "completed", privacy: "private_offline", transitions: [], accounting: [], result: { state: { outcome: { type: "DRAW" } }, events: [{ type: "MATCH_ENDED", payload: { type: "DRAW" } }] } }) as never })
    expect(result).toMatchObject({ disposition: "success", processValidity: "process_valid", cellRoot: cell.root })
  })

  it("rejects a forged closure or caller-created provider, and preserves cleanup failure as charged non-payoff evidence", async () => {
    const bottom = fixture("bottom"), top = fixture("top"), leagueRepository = createLeagueRepository(temporary("league-runner-test-"))
    const cell = createLeagueCell({ populationRoot: root("population-2"), pairRoot: root("pair-2"), entrantCandidateRoot: bottom.candidate.root, opponentCandidateRoot: top.candidate.root, conditionRoot: root("condition-2"), semanticGeometryHash: root("arena-2"), tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, requestRoot: root("request-2") })
    const start: LeagueCellStart = { root: labRoot("league-cell-start-v1", { cellRoot: cell.root, allocationRoot: root("allocation-2") }), cellRoot: cell.root, allocationRoot: root("allocation-2") }
    expect(() => issueLeagueProviderFromFactoryCandidate({ ...bottom, packetArtifactRoot: bottom.proposalArtifactRoot, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })).toThrow()
    const issue = (value: ReturnType<typeof fixture>) => issueLeagueProviderFromFactoryCandidate({ ...value, host: providerHost(), cell, start, allocationRoot: start.allocationRoot })
    const issuedBottom = issue(bottom), issuedTop = issue(top)
    const result = await runLeagueCell({ repository: leagueRepository, start, cell, bottom: { ...issuedBottom } as never, top: issuedTop, requestRoot: cell.requestRoot, match: { matchId: "safe-fixture-2", seed: "safe-seed-2", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!, initialInitiativePlayerId: "bottom", bottomPlayerId: "bottom", topPlayerId: "top", bottomStrategyRevisionId: issuedBottom.identity.revisionId, topStrategyRevisionId: issuedTop.identity.revisionId }, runCanonicalLabMatch: async () => ({ kind: "failure", privacy: "private_offline", transitions: [], accounting: [], unchangedState: null, failure: { classification: "system_failure", code: "LAB_CLEANUP_INCOMPLETE" } }) })
    expect(result, "league-eval:hostile-runtime").toMatchObject({ disposition: "system_failure", processValidity: "process_invalid" })
  })
})

const historicalPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../", DIAGNOSTIC_PILOT_PHASE264_STORE)
const historicalIt = existsSync(historicalPath) ? it : it.skip
historicalIt("binds a distinct v3 precharge and opaque handles; rejects both old pilot admission directions", async () => {
  expect(Object.hasOwn(await import("./connected-runner.js"), "requireDiagnosticOneCellOpaquePair")).toBe(false)
  const testRoot = temporary("one-cell-connected-test-")
  mkdirSync(join(testRoot, ".strategy-lab"), { mode: 0o700 })
  mkdirSync(join(testRoot, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 })
  process.chdir(testRoot)
  const baseline = { oldAllocationV2: root("old-v2"), oldAllocationUnversioned: root("old-v1"), oldResult: root("old-result"), oldLeagueTree: root("old-league"), oldFactoryTree: root("old-factory") }
  const allocation = createDiagnosticOneCellAllocation({ sourceClosureRoot: root("one-source"), implementationRoot: root("one-implementation"), gateRoot: root("one-gate"), oldEvidenceBaseline: baseline })
  const cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  const repository = createFactoryRepository(historicalPath), pair = readDiagnosticPilotAssessedPair(repository)
  const called: string[] = []
  const host: FactorySupervisedRuntimeHost = { createFactorySupervisedRuntime({ admission, sourceBytes, attemptRoot, budgetRoot, executableRoot, oneCellLifetimeGrant }) {
    expect(ledger.readStart(start.root)).toEqual(start)
    expect(oneCellLifetimeGrant?.startRoot).toBe(start.root)
    called.push(attemptRoot)
    const defaults = defaultRuntimeMetadata("typescript")
    const revision = buildStrategyRevision({ source: new TextDecoder().decode(sourceBytes), runtime: { ...defaults, adapter: { ...defaults.adapter, id: "runtime-js-container-subprocess" } } })
    return { identity: { revisionId: revision.id, sourceRoot: admission.sourceRoot, executableRoot, tupleId: "candidate-kernel-v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: root("inert-harness"), budgetRoot, attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot }, invoke() { throw new Error("inert identity only") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } } as FactorySupervisionProvider
  } }
  const issue = (entry: typeof pair[number]) => { const seat = entry.candidate.root === cell.bottomCandidateRoot ? "bottom" : "top"; const oneCellLifetimeGrant = createDiagnosticOneCellLifetimeGrant(ledger, allocation, cell, start, seat); return issueDiagnosticOneCellProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: entry, oneCellLifetimeGrant }) }
  expect(() => issue(pair[0])).toThrow("PRECHARGE_ABSENT")
  expect(called).toHaveLength(0)
  ledger.writeStart(start)
  const bottom = issue(pair[0]), top = issue(pair[1])
  expect(called).toEqual([start.root, start.root])
  expect(bottom.identity.attemptRoot).toBe(start.root)
  expect(top.identity.budgetRoot).toBe(allocation.root)
  expect(() => JSON.stringify(bottom)).toThrow("NON_SERIALIZABLE")
  const request = { ledger, allocation, cell, start, requestRoot: cell.requestRoot, bottom, top, match: {} as never, onKernelEntry: () => {}, onEvidenceStart: () => {} }
  await expect(runDiagnosticOneCellCell({ ...request, bottom: { ...bottom } as never })).rejects.toThrow("UNISSUED_PROVIDER")
  await expect(runDiagnosticOneCellCell({ ...request, bottom: top as never })).rejects.toThrow("ONE_CELL_MATCH_REQUEST")
  const old = createDiagnosticPilotAllocation({ sourceClosureRoot: root("old-source"), implementationRoot: root("old-implementation"), gateRoot: root("old-gate"), oldEvidenceBaseline: baseline })
  expect(() => issueDiagnosticPilotProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger: ledger as never, allocation: allocation as never, cell: cell as never, start: start as never, requestRoot: cell.requestRoot, assessed: pair[0], pilotLifetimeGrant: {} as never })).toThrow()
  expect(() => issueDiagnosticOneCellProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger, allocation: old as never, cell, start, requestRoot: cell.requestRoot, assessed: pair[0], oneCellLifetimeGrant: {} as never })).toThrow()
  expect(() => issue(pair[0])).toThrow("ALREADY_ISSUED")
  const wrongSeed = { matchId: "source-only-wrong-seed", seed: "wrong", arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((entry) => entry.id === "arena:smoke:v1")!, bottomPlayerId: `league-${cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${cell.topCandidateRoot.slice(7)}`, initialInitiativePlayerId: `league-${cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }
  await expect(runDiagnosticOneCellCell({ ...request, match: wrongSeed })).rejects.toThrow("ONE_CELL_MATCH_BINDING")
  expect(ledger.readRunAttempt(start.root)).toBeNull()
  for (let ordinal = 0; ordinal < 3; ordinal++) ledger.writeStage(createDiagnosticOneCellStage(start, ordinal, ["bottom_issuance", "top_issuance", "pre_kernel_binding"][ordinal] as never))
  const runPermit = ledger.writeRunAttempt(start)
  await expect(runAndRetainCanonicalDiagnosticOneCell({ ledger, allocation, cell, start, runPermit, bridgePermit: {} as never, onKernelEntry: () => {}, onEvidenceStart: () => {} })).rejects.toThrow("ONE_CELL_BRIDGE_PERMIT")
  await expect(runAndRetainCanonicalDiagnosticOneCell({ ledger, allocation, cell, start, runPermit, bridgePermit: {} as never, onKernelEntry: () => {}, onEvidenceStart: () => {} })).rejects.toThrow("RUN_PERMIT")
}, 60_000)

historicalIt("snapshots the admitted v3 Match before a mutating kernel-entry callback, without running a Match", async () => {
  const testRoot = temporary("one-cell-match-snapshot-test-")
  mkdirSync(join(testRoot, ".strategy-lab"), { mode: 0o700 })
  mkdirSync(join(testRoot, DIAGNOSTIC_ONE_CELL_STORE), { mode: 0o700 })
  process.chdir(testRoot)
  const baseline = { oldAllocationV2: root("snapshot-old-v2"), oldAllocationUnversioned: root("snapshot-old-v1"), oldResult: root("snapshot-old-result"), oldLeagueTree: root("snapshot-old-league"), oldFactoryTree: root("snapshot-old-factory") }
  const allocation = createDiagnosticOneCellAllocation({ sourceClosureRoot: root("snapshot-one-source"), implementationRoot: root("snapshot-one-implementation"), gateRoot: root("snapshot-one-gate"), oldEvidenceBaseline: baseline })
  const cell = createDiagnosticOneCellCell(allocation, 0), start = createDiagnosticOneCellStart(allocation, cell), ledger = openDiagnosticOneCellLedger(DIAGNOSTIC_ONE_CELL_STORE)
  const repository = createFactoryRepository(historicalPath), pair = readDiagnosticPilotAssessedPair(repository), host = providerHost()
  ledger.writeStart(start)
  for (let ordinal = 0; ordinal < 3; ordinal++) ledger.writeStage(createDiagnosticOneCellStage(start, ordinal, ["bottom_issuance", "top_issuance", "pre_kernel_binding"][ordinal] as never))
  const issue = (entry: typeof pair[number]) => {
    const seat = entry.candidate.root === cell.bottomCandidateRoot ? "bottom" : "top"
    return issueDiagnosticOneCellProviderFromFactoryCandidate({ host, factoryRepository: repository, ledger, allocation, cell, start, requestRoot: cell.requestRoot, assessed: entry, oneCellLifetimeGrant: createDiagnosticOneCellLifetimeGrant(ledger, allocation, cell, start, seat) })
  }
  const bottom = issue(pair[0]), top = issue(pair[1])
  const smoke = CANONICAL_ARENA_CATALOG_V1_37.arenas.find((entry) => entry.id === "arena:smoke:v1")!
  const mutableMatch = { matchId: `one-cell-${cell.requestRoot.slice(7)}`, seed: String(allocation.seed), arenaVariant: structuredClone(smoke), bottomPlayerId: `league-${cell.bottomCandidateRoot.slice(7)}`, topPlayerId: `league-${cell.topCandidateRoot.slice(7)}`, initialInitiativePlayerId: `league-${cell.initialInitiativeCandidateRoot.slice(7)}`, bottomStrategyRevisionId: bottom.identity.revisionId, topStrategyRevisionId: top.identity.revisionId }
  const originalArenaRoot = labRoot("diagnostic-one-cell-arena-v3", mutableMatch.arenaVariant)
  let callbackEntered = false
  await expect(runDiagnosticOneCellCell({ ledger, allocation, cell, start, requestRoot: cell.requestRoot, bottom, top, match: mutableMatch, onKernelEntry(admittedMatch) {
    callbackEntered = true
    expect(admittedMatch).not.toBe(mutableMatch)
    expect(admittedMatch.arenaVariant).not.toBe(mutableMatch.arenaVariant)
    mutableMatch.seed = "forged-seed"
    mutableMatch.arenaVariant.initialBounds.minX = 99
    mutableMatch.arenaVariant.terrainStones.push({ x: 2, y: 2 })
    ;(mutableMatch as Record<string, unknown>).startingFormation = "forged-bracket"
    expect(admittedMatch.seed).toBe(allocation.seed)
    expect(labRoot("diagnostic-one-cell-arena-v3", admittedMatch.arenaVariant)).toBe(originalArenaRoot)
    expect(Object.isFrozen(admittedMatch)).toBe(true)
    expect(Object.isFrozen(admittedMatch.arenaVariant.initialBounds)).toBe(true)
    expect(Object.isFrozen(admittedMatch.arenaVariant.terrainStones)).toBe(true)
    expect(Object.hasOwn(admittedMatch, "startingFormation")).toBe(false)
    throw new Error("STOP_BEFORE_CANONICAL_MATCH")
  }, onEvidenceStart: () => { throw new Error("evidence must not begin") } })).rejects.toThrow("STOP_BEFORE_CANONICAL_MATCH")
  expect(callbackEntered).toBe(true)
  expect(ledger.readRunAttempt(start.root)).not.toBeNull()
  expect(ledger.listNames().some((name) => name.includes(".evidence-"))).toBe(false)
}, 60_000)
