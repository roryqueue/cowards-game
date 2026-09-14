import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { readFactorySupervisionArtifactRecords } from "../packages/strategy-lab/src/factory/supervision-artifacts.js"
import { createFactoryRepository, publishFactoryArtifact, resumeFactoryAttemptInventory } from "../packages/strategy-lab/src/factory/repository.js"
import { ingestNamedFactoryPacket } from "./ingest-v1-38-factory-packet.js"
import { runFactoryCalibration } from "./run-v1-38-factory-calibration.js"

const dirs: string[] = [], root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw new Error("encode"); return admitted.canonicalBytes }
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

describe("factory calibration runner retention", () => {
  it("durably records a terminal even when packet validation fails after start", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-run-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }, protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const protocolArtifactRoot = publishFactoryArtifact(repository, encode(protocol))
    const allocationValue = { schemaVersion: "factory-calibration-allocation-v1", protocolRoot: protocol.root, phase: "264", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000 }, allocation = { ...allocationValue, root: labRoot("factory-calibration-allocation-v1", allocationValue) }
    const allocationArtifactRoot = publishFactoryArtifact(repository, encode(allocation))
    const ingestion = { artifactRoot: root("5"), packetRoot: root("6"), sourceRoot: root("7"), producerIdentity: "emitTacticalFactoryPacket" as const, origin: "tactical-oracle" as const, evidenceClass: "real_producer" as const }
    const supervision = { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot }
    const authorizationValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestionArtifactRoots: [ingestion.artifactRoot] }, authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v1", authorizationValue) }
    const authorizationArtifactRoot = publishFactoryArtifact(repository, encode(authorization))
    const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: protocol.root, protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: authorizationValue.studyPolicyRoot, measurementPolicyRoot: authorizationValue.measurementPolicyRoot, maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestions: [ingestion] })
    const manifestArtifactRoot = publishFactoryArtifact(repository, encode(manifest))
    const validate = vi.fn(), plan = vi.fn()
    const result = await runFactoryCalibration(manifestArtifactRoot, repository, { validate, plan } as never)
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
    const authorizationValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestionArtifactRoots: [ingestionResult.artifactRoot] }, authorization = { ...authorizationValue, root: labRoot("factory-calibration-authorization-v1", authorizationValue) }
    const authorizationArtifactRoot = publishFactoryArtifact(repository, encode(authorization))
    const ingestion = { artifactRoot: ingestionResult.artifactRoot, packetRoot: ingestionResult.packetRoot, sourceRoot: ingestionResult.sourceRoot, producerIdentity: "emitTacticalFactoryPacket" as const, origin: "tactical-oracle" as const, evidenceClass: "real_producer" as const }
    const manifest = createFactoryCalibrationManifest({ authorizationRoot: authorization.root, authorizationArtifactRoot, protocolRoot: protocol.root, protocolArtifactRoot, allocationRoot: allocation.root, allocationArtifactRoot, studyPolicyRoot: authorizationValue.studyPolicyRoot, measurementPolicyRoot: authorizationValue.measurementPolicyRoot, maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision, ingestions: [ingestion] })
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
})
