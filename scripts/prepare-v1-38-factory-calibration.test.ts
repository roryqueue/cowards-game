import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryCalibrationWorkload, admitFactoryCalibrationWorkload } from "../packages/strategy-lab/src/factory/calibration.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { ingestNamedFactoryPacket, readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"
import { createHash } from "node:crypto"
import { distillLegalStudent } from "../packages/strategy-oracle-teacher/src/distill.js"
import { deriveFrozenModelBundleRoot, deriveFrozenModelResponseRoot } from "../packages/strategy-oracle-model/src/bundle.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"
import { readFreshFactoryCalibration } from "./v1-38-factory-fresh-evidence.js"
import { createFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES, type FactorySourceSlot } from "./author-v1-38-factory-model-source.js"
import { createFreshFactoryCalibrationCells, prepareFactoryCalibration, prepareHistoricalFactoryCalibration, prepareFreshFactoryCalibration } from "./prepare-v1-38-factory-calibration.js"

const dirs: string[] = [], root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })
const encode = (value: unknown) => { const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!admitted.ok) throw new Error("encode"); return admitted.canonicalBytes }

describe("fresh factory calibration preparation", () => {
  it("predeclares exactly 48 two-geometry side-confounded one-phase cells before output", () => {
    const cells = createFreshFactoryCalibrationCells()
    expect(cells).toHaveLength(48)
    expect(new Set(cells.map((cell) => cell.root)).size).toBe(48)
    expect(new Set(cells.map((cell) => cell.slot))).toHaveLength(12)
    expect(cells.every((cell) => cell.seed === "factory-264-control-v1" && cell.maxPhases === 1)).toBe(true)
    expect(cells.filter((cell) => cell.block === "A").every((cell) => cell.arenaId === "arena:smoke:v1" && cell.candidateSide === "bottom")).toBe(true)
    expect(cells.filter((cell) => cell.block === "B").every((cell) => cell.arenaId === "arena:standard-cross:v1" && cell.candidateSide === "top")).toBe(true)
  })
  it("keeps historical mechanics separate and rejects its v1 decision at the fresh entrypoint", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-prepare-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const ingestion = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: "prepare-doctrine", provider: { providerId: "tactical-prepare", modelId: "local", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } } }, repository)
    if (ingestion.disposition !== "accepted") throw new Error("ingestion")
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }
    const protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const protocolArtifactRoot = publishFactoryArtifact(repository, encode(protocol))
    const allocationValue = { schemaVersion: "factory-calibration-allocation-v1", protocolRoot: protocol.root, phase: "264", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000 }
    const allocation = { ...allocationValue, root: labRoot("factory-calibration-allocation-v1", allocationValue) }
    const allocationArtifactRoot = publishFactoryArtifact(repository, encode(allocation))
    const workload = createFactoryCalibrationWorkload({ candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: "prepare-pair", pairAxis: "initialInitiative", condition: { arenaId: "arena:smoke:v1", seed: "prepare-seed", candidateSide: "bottom", initialInitiative: "candidate", maxPhases: 1 }, opponent: { kind: "fixed_mechanics", opponentId: "factory-fixed-mechanics-v1", identityRoot: root("8") }, budget: { maxInvocations: 64, maxLifetimeMs: 120_000 }, lineageManifestArtifactRoot: null, dependencyManifestArtifactRoot: null })
    const workloadArtifactRoot = publishFactoryArtifact(repository, encode(workload))
    const decisionValue = { schemaVersion: "factory-calibration-authorization-v1", status: "authorized", protocolArtifactRoot, allocationArtifactRoot, studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17", measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95", maxAttempts: 1, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000, supervision: { adapterId: "runtime-js-container-subprocess", runtimeAbi: "strategy-runtime-abi-v1.19", image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: ingestion.record.runtimeProfileRoot }, ingestionArtifactRoots: [ingestion.artifactRoot], workloadArtifactRoots: [workloadArtifactRoot] }
    const decision = { ...decisionValue, root: labRoot("factory-calibration-authorization-v1", decisionValue) }
    const result = prepareHistoricalFactoryCalibration(`Historical mechanics decision\n\n\`\`\`json\n${new TextDecoder().decode(encode(decision))}\n\`\`\``, repository)
    expect(() => prepareFactoryCalibration(encode(decision), repository)).toThrow("FRESH_INPUT")
    expect(result.manifest.authorizationRoot).toBe(decision.root)
    expect(result.manifest.protocolRoot).toBe(protocol.root)
    expect(result.manifest.allocationRoot).toBe(allocation.root)
    expect(result.manifest.workloads).toEqual([{ artifactRoot: workloadArtifactRoot, root: workload.root, candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: "prepare-pair" }])
    expect(() => prepareHistoricalFactoryCalibration(`\`\`\`json\n${new TextDecoder().decode(encode({ ...decision, protocolArtifactRoot: root("9"), root: labRoot("factory-calibration-authorization-v1", { ...decisionValue, protocolArtifactRoot: root("9") }) }))}\n\`\`\``, repository)).toThrow()
  })
  it("rejects twelve tactical packets masquerading as the full allocation", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-fresh-prepare-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory), slotIngestionArtifactRoots = {} as Record<FactorySourceSlot, LabRoot>
    for (const [index, slot] of (Object.keys(FACTORY_SOURCE_RECIPES) as FactorySourceSlot[]).entries()) {
      const ingestion = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: { split: "development", doctrineFamily: `fresh-${slot.toLowerCase()}`, provider: { providerId: `fresh-${slot.toLowerCase()}`, modelId: "local", modelVersion: "v1", settingsRoot: root(String(index % 10)), promptRoot: root("b"), contextRoot: root("c") }, build: { buildRoot: root("d"), toolchainRoot: root("e") }, lineage: { predecessorRoot: root("f"), correctionRoot: null, retryParentRoot: null } } }, repository)
      if (ingestion.disposition !== "accepted") throw new Error("ingestion")
      slotIngestionArtifactRoots[slot] = ingestion.artifactRoot
    }
    const input = { allocation: createFactoryAuthoringAllocation(), slotIngestionArtifactRoots, protocolRoot: root("1"), protocolArtifactRoot: root("2"), studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17" as LabRoot, measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" as LabRoot, opponentIdentityRoot: root("7"), supervision: { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot } }
    expect(() => prepareFreshFactoryCalibration(input, repository)).toThrow("FRESH_CONTROL_PROVENANCE")
    const missing = { ...slotIngestionArtifactRoots }; delete (missing as Partial<Record<FactorySourceSlot, LabRoot>>).S12
    expect(() => prepareFreshFactoryCalibration({ ...input, slotIngestionArtifactRoots: missing as Record<FactorySourceSlot, LabRoot> }, repository)).toThrow("FACTORY_PREPARE_FRESH_ALLOCATION")
    expect(() => prepareFreshFactoryCalibration({ ...input, slotIngestionArtifactRoots: { ...slotIngestionArtifactRoots, S13: root("9") } as Record<FactorySourceSlot, LabRoot> }, repository)).toThrow("FACTORY_PREPARE_FRESH_ALLOCATION")
    expect(() => prepareFreshFactoryCalibration({ ...input, allocation: { ...input.allocation, maxInvocations: 255 } }, repository)).toThrow("FACTORY_AUTHOR_ALLOCATION")
  })
  it("reopens three genuine named-emitter fixtures and nine derived controls as 24 opposite-initiative pairs", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-controls-prepare-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory), slots = {} as Record<FactorySourceSlot, LabRoot>
    const request = (kind: string) => ({ split: "development" as const, doctrineFamily: `test-${kind}`, provider: { providerId: `test-${kind}`, modelId: "unit-fixture", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } })
    const tactical = await ingestNamedFactoryPacket({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: request("tactical") }, repository)
    if (tactical.disposition !== "accepted") throw new Error("tactical")
    slots.S01 = tactical.artifactRoot
    // Static legal-input training fixture only; no search, guest or Match runs.
    const soldier = { id: "s", ownerPlayerId: "bottom", status: "ACTIVE", position: { x: 2, y: 11 }, facing: "UP", lastSuccessfulMoveDirection: null }
    const student = distillLegalStudent([{ kind: "activation", target: "press", input: { phaseNumber: 1, roundNumber: 1, activationCount: 2, board: { bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 }, soldiers: [soldier], terrainStones: [] }, mySoldiers: [soldier], enemySoldiers: [], strategyMemory: {}, initialInitiativePlayerId: "bottom", hasInitialInitiative: true, roundInitiativePlayerId: "bottom", hasRoundInitiative: true } }])
    const teacher = await ingestNamedFactoryPacket({ producerIdentity: "emitTeacherFactoryPacket", origin: "teacher-oracle", evidenceClass: "real_producer", producerInput: { student, request: request("teacher") } }, repository)
    if (teacher.disposition !== "accepted") throw new Error("teacher")
    slots.S03 = teacher.artifactRoot
    const source = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
    const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as LabRoot
    const modelRequest = request("model"), response = { format: "explicit-typescript-source" as const, source }
    const value = { schemaVersion: "frozen-model-bundle-v1" as const, privacy: "private_offline" as const, provider: modelRequest.provider, request: { root: root("7"), byteLength: 1, encoding: "utf8" as const }, response: { ...response, root: deriveFrozenModelResponseRoot(response) }, source: { root: sourceRoot, sha256: sourceRoot, byteLength: new TextEncoder().encode(source).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: 1, outputTokens: 1, tokenLimit: 2, elapsedMilliseconds: 1, resourceRoot: root("8") }, attempt: { attemptRoot: root("9"), budgetRoot: root("a"), ordinal: 0 }, nativeLane: { language: "typescript" as const, providerId: modelRequest.provider.providerId, runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const }, lineage: modelRequest.lineage }
    const model = await ingestNamedFactoryPacket({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { bundle: { ...value, root: deriveFrozenModelBundleRoot(value) }, request: { split: "development", doctrineFamily: "test-model", build: modelRequest.build, lineage: modelRequest.lineage } } }, repository)
    if (model.disposition !== "accepted") throw new Error("model")
    slots.S05 = model.artifactRoot
    for (const [slot, parent] of Object.entries(FACTORY_CONTROL_BASES)) {
      const control = await ingestNamedFactoryPacket({ producerIdentity: "materializeFactoryCalibrationControl", origin: "calibration-control", evidenceClass: "calibration_only", producerInput: { slot, baseIngestionArtifactRoot: slots[parent] } }, repository)
      if (control.disposition !== "accepted") throw new Error("control")
      slots[slot as FactoryControlSlot] = control.artifactRoot
      expect(readFactoryIngestion(repository, control.artifactRoot).evidenceClass).toBe("calibration_only")
    }
    const protocolValue = { schemaVersion: "factory-calibration-protocol-v1", phase: "264", purpose: "development-independence-calibration", split: "development" }
    const protocol = { ...protocolValue, root: labRoot("factory-calibration-protocol-v1", protocolValue) }
    const input = { allocation: createFactoryAuthoringAllocation(), slotIngestionArtifactRoots: slots, protocolRoot: protocol.root, protocolArtifactRoot: publishFactoryArtifact(repository, encode(protocol)), studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17" as LabRoot, measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" as LabRoot, opponentIdentityRoot: root("7"), supervision: { adapterId: "runtime-js-container-subprocess" as const, runtimeAbi: "strategy-runtime-abi-v1.19" as const, image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot } }
    const result = prepareFactoryCalibration(encode(input), repository)
    expect(readFreshFactoryCalibration(repository, result.manifest, input.opponentIdentityRoot)).toMatchObject({ allocation: input.allocation })
    expect(() => readFreshFactoryCalibration(repository, { ...result.manifest, maxAttempts: 47 }, input.opponentIdentityRoot)).toThrow("FRESH")
    expect(() => readFreshFactoryCalibration(repository, result.manifest, root("8"))).toThrow("FRESH")
    expect(result.manifest.workloads).toHaveLength(48)
    expect(result.manifest.ingestions.filter((entry) => entry.evidenceClass === "real_producer")).toHaveLength(3)
    const groups = new Map<string, string[]>()
    for (const entry of result.manifest.workloads) { const workload = admitFactoryCalibrationWorkload(JSON.parse(new TextDecoder().decode(readFactoryArtifact(repository, entry.artifactRoot)))); groups.set(workload.pairGroup, [...groups.get(workload.pairGroup) ?? [], workload.condition.initialInitiative]) }
    expect(groups.size).toBe(24)
    expect([...groups.values()].every((group) => group.length === 2 && new Set(group).size === 2)).toBe(true)
    expect(() => prepareFreshFactoryCalibration({ ...input, slotIngestionArtifactRoots: { ...slots, S02: slots.S09, S09: slots.S02 } }, repository)).toThrow("FRESH_CONTROL_PROVENANCE")
    expect(() => prepareFreshFactoryCalibration({ ...input, slotIngestionArtifactRoots: { ...slots, S01: slots.S03, S03: slots.S01 } }, repository)).toThrow("FRESH_BASE_MECHANISM")
    const retained = readFactoryIngestion(repository, slots.S07)
    const changed = { ...retained, sourceUtf8: `${retained.sourceUtf8}\n// substituted` }
    const { root: _root, ...withoutRoot } = changed
    const altered = publishFactoryArtifact(repository, encode({ ...withoutRoot, root: labRoot("factory-ingestion-v1", withoutRoot) }))
    expect(() => readFactoryIngestion(repository, altered)).toThrow("RELOAD_BINDING")
  }, 20_000)
})
