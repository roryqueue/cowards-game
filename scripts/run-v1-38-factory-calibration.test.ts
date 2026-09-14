import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { admitCanonicalJsonValue, BOTTOM_STARTING_POSITIONS, CANONICAL_ARENA_CATALOG_V1_37, TOP_STARTING_POSITIONS } from "@cowards/spec"
import { MATCH_KERNEL } from "../packages/engine/src/index.js"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryCalibrationManifest, createFactoryCalibrationWorkload } from "../packages/strategy-lab/src/factory/calibration.js"
import { readFactorySupervisionArtifactRecords } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, resumeFactoryAttemptInventory } from "../packages/strategy-lab/src/factory/repository.js"
import { ingestNamedFactoryPacket } from "./ingest-v1-38-factory-packet.js"
import { boundFactoryWorkloadProviders, buildFactoryCalibrationMatchInput, deriveFactoryCalibrationOutcome, deriveFixedMechanicsOpponentIdentityRoot, runFactoryCalibration } from "./run-v1-38-factory-calibration.js"
import * as freshEvidence from "./v1-38-factory-fresh-evidence.js"
import * as executionEvidence from "./v1-38-factory-execution-evidence.js"
import * as assessor from "./assess-v1-38-factory-independence.js"

const dirs: string[] = [], root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
it("shares one finite invocation and time budget across both providers", () => {
  const invoke=vi.fn(()=>({})), raw={identity:{},invoke,verify:()=>true,close:()=>({cleanupComplete:true,orphanedChild:false})} as never
  const providers=boundFactoryWorkloadProviders({bottom:raw,top:raw},2,Date.now()+10000)
  providers.bottom!.invoke({} as never,{} as never)
  providers.top!.invoke({} as never,{} as never)
  expect(()=>providers.bottom!.invoke({} as never,{} as never)).toThrow("WORKLOAD_BUDGET_EXHAUSTED")
  expect(invoke).toHaveBeenCalledTimes(2)
  expect(()=>boundFactoryWorkloadProviders({bottom:raw},2,0).bottom!.invoke({} as never,{} as never)).toThrow("WORKLOAD_BUDGET_EXHAUSTED")
})
const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw new Error("encode"); return admitted.canonicalBytes }
const publishWorkload = (
  repository: ReturnType<typeof createFactoryRepository>,
  candidateIngestionArtifactRoot: LabRoot,
  pairGroup = "pair-a",
  initialInitiative: "candidate" | "opponent" = "candidate",
) => {
  const workload = createFactoryCalibrationWorkload({
    candidateIngestionArtifactRoot,
    pairGroup,
    pairAxis: "initialInitiative",
    condition: {
      arenaId: "arena:smoke:v1",
      seed: `seed-${pairGroup}`,
      candidateSide: "bottom",
      initialInitiative,
      maxPhases: 1,
    },
    opponent: {
      kind: "fixed_mechanics",
      opponentId: "factory-fixed-mechanics-v1",
      identityRoot: deriveFixedMechanicsOpponentIdentityRoot(),
    },
    budget: { maxInvocations: 64, maxLifetimeMs: 120_000 },
    lineageManifestArtifactRoot: null,
    dependencyManifestArtifactRoot: null,
  })
  return {
    workload,
    artifactRoot: publishFactoryArtifact(repository, encode(workload)),
  }
}
const publishMockFreshManifest = (
  repository: ReturnType<typeof createFactoryRepository>,
) => {
  const protocolValue = {
      schemaVersion: "factory-calibration-protocol-v1",
      phase: "264",
      purpose: "development-independence-calibration",
      split: "development",
    },
    protocol = {
      ...protocolValue,
      root: labRoot("factory-calibration-protocol-v1", protocolValue),
    }
  const protocolArtifactRoot = publishFactoryArtifact(
    repository,
    encode(protocol),
  )
  const allocationValue = {
      schemaVersion: "factory-calibration-allocation-v1",
      protocolRoot: protocol.root,
      phase: "264",
      maxAttempts: 1,
      maxInvocationsPerAttempt: 64,
      maxLifetimeMs: 120_000,
    },
    allocation = {
      ...allocationValue,
      root: labRoot("factory-calibration-allocation-v1", allocationValue),
    }
  const allocationArtifactRoot = publishFactoryArtifact(
    repository,
    encode(allocation),
  )
  const ingestion = {
    artifactRoot: root("5"),
    packetRoot: root("6"),
    sourceRoot: root("7"),
    producerIdentity: "emitTacticalFactoryPacket" as const,
    origin: "tactical-oracle" as const,
    evidenceClass: "real_producer" as const,
  }
  const workload = publishWorkload(repository, ingestion.artifactRoot)
  const authorizationValue = {
      schemaVersion: "factory-calibration-authorization-v2",
      status: "authorized",
      allocationRoot: allocation.root,
      sourceSlots: ["S01"],
      slotIngestionArtifactRoots: { S01: ingestion.artifactRoot },
      cellRoots: [workload.workload.root],
      workloadArtifactRoots: [workload.artifactRoot],
      geometryDesign: "two_geometry_side_confounded_pilot",
      competitiveClaim: "none",
    },
    authorization = {
      ...authorizationValue,
      root: labRoot("factory-calibration-authorization-v2", authorizationValue),
    }
  const authorizationArtifactRoot = publishFactoryArtifact(
    repository,
    encode(authorization),
  )
  const supervision = {
    adapterId: "runtime-js-container-subprocess" as const,
    runtimeAbi: "strategy-runtime-abi-v1.19" as const,
    image: LAB_ADMITTED_ROOTS.image,
    runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
  }
  const manifest = createFactoryCalibrationManifest({
    authorizationRoot: authorization.root,
    authorizationArtifactRoot,
    protocolRoot: protocol.root,
    protocolArtifactRoot,
    allocationRoot: allocation.root,
    allocationArtifactRoot,
    studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",
    measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",
    maxAttempts: 1,
    maxInvocationsPerAttempt: 64,
    maxLifetimeMs: 120_000,
    supervision,
    ingestions: [ingestion],
    workloads: [
      {
        artifactRoot: workload.artifactRoot,
        root: workload.workload.root,
        candidateIngestionArtifactRoot: ingestion.artifactRoot,
        pairGroup: workload.workload.pairGroup,
      },
    ],
  })
  return publishFactoryArtifact(repository, encode(manifest))
}
afterEach(() => {
  vi.restoreAllMocks()
  for (const directory of dirs.splice(0))
    rmSync(directory, { recursive: true, force: true })
})

describe("factory calibration runner retention", () => {
  it("validates fresh execution evidence before charging and maps the direct assessment", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-fresh-run-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory), manifestArtifactRoot = publishMockFreshManifest(repository), evidenceRoot = root("a")
    vi.spyOn(freshEvidence, "readFreshFactoryCalibration").mockReturnValue({} as never)
    vi.spyOn(executionEvidence, "readFactoryExecutionEvidence").mockImplementation(() => { throw new TypeError("FACTORY_EXECUTION_BAD") })
    await expect(runFactoryCalibration(manifestArtifactRoot, repository, { executionEvidenceArtifactRoot: evidenceRoot })).rejects.toThrow("FACTORY_EXECUTION_BAD")
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(0)
    vi.mocked(executionEvidence.readFactoryExecutionEvidence).mockReturnValue({} as never)
    vi.spyOn(assessor, "assessFactoryIndependence").mockReturnValue({ status: "affirmed", reasons: [], assessmentRoot: root("b"), assessmentArtifactRoot: root("c"), thresholdArtifactRoot: root("d"), manifestRoot: root("e"), allocationRoot: root("f") })
    vi.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValueOnce(5_395_000)
    const result = await runFactoryCalibration(manifestArtifactRoot, repository, { executionEvidenceArtifactRoot: evidenceRoot })
    expect(result.readiness).toBe("affirmed")
    expect(assessor.assessFactoryIndependence).toHaveBeenCalledOnce()
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(0)
    expect(vi.mocked(assessor.assessFactoryIndependence).mock.calls[0]![1].windowTerminalArtifactRoot).toMatch(/^sha256:/u)
  })
  it("materializes only the declared canonical arena, positions, side, initiative, and one-phase bound", () => {
    const workload = createFactoryCalibrationWorkload({ candidateIngestionArtifactRoot: root("1"), pairGroup: "realism-pair", pairAxis: "initialInitiative", condition: { arenaId: "arena:smoke:v1", seed: "realism-seed", candidateSide: "top", initialInitiative: "opponent", maxPhases: 1 }, opponent: { kind: "fixed_mechanics", opponentId: "factory-fixed-mechanics-v1", identityRoot: deriveFixedMechanicsOpponentIdentityRoot() }, budget: { maxInvocations: 64, maxLifetimeMs: 120_000 }, lineageManifestArtifactRoot: null, dependencyManifestArtifactRoot: null })
    const match = buildFactoryCalibrationMatchInput(workload, "candidate-revision", root("2"))
    const state = MATCH_KERNEL.createMachineV119(match).state
    expect(match.topPlayerId).toBe("factory-candidate")
    expect(match.initialInitiativePlayerId).toBe("factory-fixed-mechanics-v1")
    expect(match.maxPhases).toBe(1)
    expect(state.bounds).toEqual(match.arenaVariant.initialBounds)
    expect(state.terrainStones).toEqual(match.arenaVariant.terrainStones)
    expect(state.soldiers.filter((soldier) => soldier.ownerPlayerId === match.bottomPlayerId).map((soldier) => soldier.position)).toEqual(BOTTOM_STARTING_POSITIONS)
    expect(state.soldiers.filter((soldier) => soldier.ownerPlayerId === match.topPlayerId).map((soldier) => soldier.position)).toEqual(TOP_STARTING_POSITIONS)
    expect(state.soldiers).toHaveLength(16)
    expect(deriveFactoryCalibrationOutcome({ kind: "completed", privacy: "private_offline", result: { state: { outcome: { type: "WIN", winnerPlayerId: match.topPlayerId } } }, transitions: [], accounting: [] } as never, match)).toBe("top")
    expect(deriveFactoryCalibrationOutcome({ kind: "completed", privacy: "private_offline", result: { state: { outcome: { type: "DRAW" } } }, transitions: [], accounting: [] } as never, match)).toBe("draw")
    expect(() => deriveFactoryCalibrationOutcome({ kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [] } as never, match)).toThrow("MATCH_OUTCOME")
  })
  it("durably records a terminal even when packet validation fails after start", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-run-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }, protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const protocolArtifactRoot = publishFactoryArtifact(repository, encode(protocol))
    const allocationValue = { schemaVersion: "factory-calibration-allocation-v1", protocolRoot: protocol.root, phase: "264", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000 }, allocation = { ...allocationValue, root: labRoot("factory-calibration-allocation-v1", allocationValue) }
    const allocationArtifactRoot = publishFactoryArtifact(repository, encode(allocation))
    const ingestion = { artifactRoot: root("5"), packetRoot: root("6"), sourceRoot: root("7"), producerIdentity: "emitTacticalFactoryPacket" as const, origin: "tactical-oracle" as const, evidenceClass: "real_producer" as const }
    const supervision = { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
    const workload = publishWorkload(repository, ingestion.artifactRoot)
    const authorizationValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestionArtifactRoots: [ingestion.artifactRoot], workloadArtifactRoots: [workload.artifactRoot] }, authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v1", authorizationValue) }
    const authorizationArtifactRoot = publishFactoryArtifact(repository, encode(authorization))
    const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: protocol.root, protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: authorizationValue.studyPolicyRoot, measurementPolicyRoot: authorizationValue.measurementPolicyRoot, maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestions: [ingestion], workloads: [{ artifactRoot: workload.artifactRoot, root: workload.workload.root, candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: workload.workload.pairGroup }] })
    const manifestArtifactRoot = publishFactoryArtifact(repository, encode(manifest))
    const validate = vi.fn(), plan = vi.fn()
    await expect(runFactoryCalibration(manifestArtifactRoot, repository, { plan } as never)).rejects.toThrow("FACTORY_RUN_LEGACY_MECHANICS_HOOKS")
    const result = await runFactoryCalibration(manifestArtifactRoot, repository, { legacyMechanics: true, validate, plan } as never)
    expect(result.readiness).toBe("not_ready")
    expect(result.terminalRoots).toHaveLength(1)
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(1)
    expect(validate).not.toHaveBeenCalled()
    expect(plan).not.toHaveBeenCalled()
    await expect(runFactoryCalibration(manifestArtifactRoot, repository)).rejects.toThrow("FACTORY_RUN_ALLOCATION_CONSUMED")
  })

  it("connects a real named ingestion to injected selected supervision, retained records, and unresolved readiness", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-run-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const ingestionResult = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: "runner-doctrine", provider: { providerId: "tactical-runner", modelId: "local", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } } }, repository)
    if (ingestionResult.disposition !== "accepted") throw new Error("ingestion")
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }, protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const protocolArtifactRoot = publishFactoryArtifact(repository, encode(protocol))
    const allocationValue = { schemaVersion: "factory-calibration-allocation-v1", protocolRoot: protocol.root, phase: "264", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000 }, allocation = { ...allocationValue, root: labRoot("factory-calibration-allocation-v1", allocationValue) }
    const allocationArtifactRoot = publishFactoryArtifact(repository, encode(allocation))
    const supervision = { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
    const workload = publishWorkload(repository, ingestionResult.artifactRoot)
    const authorizationValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestionArtifactRoots: [ingestionResult.artifactRoot], workloadArtifactRoots: [workload.artifactRoot] }, authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v1", authorizationValue) }
    const authorizationArtifactRoot = publishFactoryArtifact(repository, encode(authorization))
    const ingestion = { artifactRoot: ingestionResult.artifactRoot, packetRoot: ingestionResult.packetRoot, sourceRoot: ingestionResult.sourceRoot, producerIdentity: "emitTacticalFactoryPacket" as const, origin: "tactical-oracle" as const, evidenceClass: "real_producer" as const }
    const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: protocol.root, protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: authorizationValue.studyPolicyRoot, measurementPolicyRoot: authorizationValue.measurementPolicyRoot, maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestions: [ingestion], workloads: [{ artifactRoot: workload.artifactRoot, root: workload.workload.root, candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: workload.workload.pairGroup }] })
    const manifestArtifactRoot = publishFactoryArtifact(repository, encode(manifest))
    const issued = new WeakSet<object>()
    const close = vi.fn(() => ({ cleanupComplete: true, orphanedChild: false }))
    const createRuntime = vi.fn((options: any) => {
      const identity = { revisionId: options.revision.id, sourceRoot: ingestion.sourceRoot, executableRoot: root("7"), tupleId: "cowards-game:v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: options.image, harnessRoot: root("8"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
      return { identity, invoke(request: any) { const evidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: labRoot("factory-runner-test-invocation-v1", request.requestId), charged: true, completed: true, outputBytes: 16, result: { ok: true, value: { activationOrders: [], strategyMemory: null } } }; issued.add(evidence); return evidence }, verify(evidence: object) { return issued.has(evidence) }, close }
    })
    const opponent = { identity: { revisionId: "opponent", sourceRoot: root("9"), executableRoot: root("a"), tupleId: "cowards-game:v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: root("b"), budgetRoot: root("c"), attemptRoot: root("d"), runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }, invoke() { throw new Error("unreachable") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } }
    const result = await runFactoryCalibration(manifestArtifactRoot, repository, { runtimeOptions: { createRuntime }, plan(_admission, provider) { return { candidatePlayerId: "candidate", input: { match: { bottomPlayerId: "candidate", topPlayerId: "opponent", initialInitiativePlayerId: "candidate" } as never, providers: { candidate: provider, opponent } }, async run({ providers }) { const candidate = providers.candidate!; const input = { phaseNumber: 1, roundNumber: 1, activationCount: 0, board: { bounds: {}, soldiers: [], terrainStones: [] }, mySoldiers: [], enemySoldiers: [], initialInitiativePlayerId: "candidate", hasInitialInitiative: true, roundInitiativePlayerId: "candidate", hasRoundInitiative: true }; const evidence = await candidate.invoke({ kind: "selectActivations", requestId: "request-1", semanticTupleId: candidate.identity.tupleId, input } as never, candidate.identity); return { kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [evidence] } as never } } } })
    expect(result.readiness).toBe("not_ready")
    expect(result.terminalRoots).toHaveLength(1)
    expect(createRuntime).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    expect(result.supervisionArtifactRoots).toHaveLength(1)
    const reopened = readFactorySupervisionArtifactRecords(repository, result.supervisionArtifactRoots[0]!, { maxBytes: 1_000_000, maxRecords: 100 })
    expect(reopened.issued).toBe(false)
    expect(reopened.records.some((record) => record.kind === "trace")).toBe(true)
  })

  it("charges each exact predeclared initiative pair workload once before retained pairing", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-pair-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const ingestionResult = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: "paired-doctrine", provider: { providerId: "tactical-pair", modelId: "local", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } } }, repository)
    if (ingestionResult.disposition !== "accepted") throw new Error("ingestion")
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }, protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const protocolArtifactRoot = publishFactoryArtifact(repository, encode(protocol))
    const allocationValue = { schemaVersion: "factory-calibration-allocation-v1", protocolRoot: protocol.root, phase: "264", maxAttempts: 2, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000 }, allocation = { ...allocationValue, root: labRoot("factory-calibration-allocation-v1", allocationValue) }
    const allocationArtifactRoot = publishFactoryArtifact(repository, encode(allocation))
    const first = publishWorkload(repository, ingestionResult.artifactRoot, "initiative-pair", "candidate"), second = publishWorkload(repository, ingestionResult.artifactRoot, "initiative-pair", "opponent")
    const supervision = { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
    const authorizationValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 2, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestionArtifactRoots: [ingestionResult.artifactRoot], workloadArtifactRoots: [first.artifactRoot, second.artifactRoot] }, authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v1", authorizationValue) }
    const authorizationArtifactRoot = publishFactoryArtifact(repository, encode(authorization))
    const ingestion = { artifactRoot: ingestionResult.artifactRoot, packetRoot: ingestionResult.packetRoot, sourceRoot: ingestionResult.sourceRoot, producerIdentity: "emitTacticalFactoryPacket" as const, origin: "tactical-oracle" as const, evidenceClass: "real_producer" as const }
    const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: protocol.root, protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: authorizationValue.studyPolicyRoot, measurementPolicyRoot: authorizationValue.measurementPolicyRoot, maxAttempts: 2, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestions: [ingestion], workloads: [first, second].map(({ workload, artifactRoot }) => ({ artifactRoot, root: workload.root, candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: workload.pairGroup })) })
    const manifestArtifactRoot = publishFactoryArtifact(repository, encode(manifest))
    const issued = new WeakSet<object>()
    const result = await runFactoryCalibration(manifestArtifactRoot, repository, { runtimeOptions: { createRuntime(options: any) { const identity = { revisionId: options.revision.id, sourceRoot: ingestion.sourceRoot, executableRoot: root("7"), tupleId: "cowards-game:v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: options.image, harnessRoot: root("8"), budgetRoot: options.budgetRoot, attemptRoot: options.attemptRoot, runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }; return { identity, invoke(request: any) { const evidence = { identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0, invocationRoot: labRoot("factory-pair-invocation-v1", { requestId: request.requestId, attemptRoot: options.attemptRoot }), charged: true, completed: true, outputBytes: 16, result: { ok: true, value: { activationOrders: [], strategyMemory: null } } }; issued.add(evidence); return evidence }, verify(evidence: object) { return issued.has(evidence) }, close() { return { cleanupComplete: true, orphanedChild: false } } } } }, plan(_admission, provider, _startRoot, workload) { const opponent = { identity: { revisionId: workload.opponent.opponentId, sourceRoot: root("9"), executableRoot: root("a"), tupleId: "cowards-game:v1.19", tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, image: LAB_ADMITTED_ROOTS.image, harnessRoot: root("b"), budgetRoot: root("c"), attemptRoot: root("d"), runtimeLimitsRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }, invoke() { throw new Error("unreachable") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } } }; const initialInitiativePlayerId = workload.condition.initialInitiative === "candidate" ? "candidate" : workload.opponent.opponentId; return { candidatePlayerId: "candidate", input: { match: { matchId: `pair-${workload.root.slice(7, 15)}`, seed: workload.condition.seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas.find((arena) => arena.id === workload.condition.arenaId)!, bottomPlayerId: "candidate", topPlayerId: workload.opponent.opponentId, bottomStrategyRevisionId: provider.identity.revisionId, topStrategyRevisionId: workload.opponent.opponentId, initialInitiativePlayerId, maxPhases: 1 }, providers: { candidate: provider, [workload.opponent.opponentId]: opponent } }, async run({ providers }) { const candidate = providers.candidate!; const input = { phaseNumber: 1, roundNumber: 1, activationCount: 0, board: { bounds: {}, soldiers: [], terrainStones: [] }, mySoldiers: [], enemySoldiers: [], initialInitiativePlayerId, hasInitialInitiative: initialInitiativePlayerId === "candidate", roundInitiativePlayerId: initialInitiativePlayerId, hasRoundInitiative: initialInitiativePlayerId === "candidate" }; const evidence = await candidate.invoke({ kind: "selectActivations", requestId: `request-${workload.root}`, semanticTupleId: candidate.identity.tupleId, input } as never, candidate.identity); return { kind: "completed", privacy: "private_offline", result: { state: { outcome: { type: "DRAW" } } }, transitions: [], accounting: [evidence] } as never } } } })
    expect(result.terminalRoots).toHaveLength(2)
    expect(resumeFactoryAttemptInventory(repository).completedAttemptRoots).toHaveLength(2)
    const readiness = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, result.readinessArtifactRoot)))
    expect(readiness.pairingArtifactRoots).toHaveLength(1)
    expect(readiness.candidateArtifactRoots).toHaveLength(2)
    const pairing = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, readiness.pairingArtifactRoots[0])))
    expect(pairing.status).toBe("paired")
    const descriptor = JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, readiness.candidateArtifactRoots[0])))
    expect(descriptor.independenceReceipt.reasons).toContain("counterfactual_materiality_borderline")
  })
})
