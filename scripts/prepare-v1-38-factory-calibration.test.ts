import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryCalibrationWorkload } from "../packages/strategy-lab/src/factory/calibration.js"
import { createFactoryRepository, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { ingestNamedFactoryPacket } from "./ingest-v1-38-factory-packet.js"
import { createFreshFactoryCalibrationCells, prepareFactoryCalibration } from "./prepare-v1-38-factory-calibration.js"

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
  it("binds the exact canonical decision to retained Phase264 protocol, allocation, policies, and ingestion", async () => {
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
    const result = prepareFactoryCalibration(`Plan 07 decision\n\n\`\`\`json\n${new TextDecoder().decode(encode(decision))}\n\`\`\``, repository)
    expect(result.manifest.authorizationRoot).toBe(decision.root)
    expect(result.manifest.protocolRoot).toBe(protocol.root)
    expect(result.manifest.allocationRoot).toBe(allocation.root)
    expect(result.manifest.workloads).toEqual([{ artifactRoot: workloadArtifactRoot, root: workload.root, candidateIngestionArtifactRoot: ingestion.artifactRoot, pairGroup: "prepare-pair" }])
    expect(() => prepareFactoryCalibration(`\`\`\`json\n${new TextDecoder().decode(encode({ ...decision, protocolArtifactRoot: root("9"), root: labRoot("factory-calibration-authorization-v1", { ...decisionValue, protocolArtifactRoot: root("9") }) }))}\n\`\`\``, repository)).toThrow()
  })
})
