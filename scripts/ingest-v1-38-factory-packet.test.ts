import { createHash } from "node:crypto"
import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, readFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { deriveFrozenModelBundleRoot, deriveFrozenModelResponseRoot } from "../packages/strategy-oracle-model/src/bundle.js"
import { ingestNamedFactoryPacket, readFactoryIngestion } from "./ingest-v1-38-factory-packet.js"

const dirs: string[] = []
const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

describe("named private factory ingestion", () => {
  it("materializes and reloads the real tactical leaf emitter without executing its source", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const result = await ingestNamedFactoryPacket({
      producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer",
      producerInput: { split: "development", doctrineFamily: "test-doctrine", provider: { providerId: "tactical-test", modelId: "local", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, build: { buildRoot: root("4"), toolchainRoot: root("5") }, lineage: { predecessorRoot: root("6"), correctionRoot: null, retryParentRoot: null } },
    }, repository)
    expect(result.disposition).toBe("accepted")
    if (result.disposition !== "accepted") throw new Error("expected accepted ingestion")
    const reloaded = readFactoryIngestion(repository, result.artifactRoot)
    expect(reloaded.packet.root).toBe(result.packetRoot)
    expect(reloaded.packet.source.root).toBe(result.sourceRoot)
    expect(reloaded.producerIdentity).toBe("emitTacticalFactoryPacket")
    expect(reloaded.sourceUtf8).toContain("export default")
    expect(readFactoryArtifact(repository, result.artifactRoot).byteLength).toBeLessThanOrEqual(262_144)
  })

  it("rejects fabricated producer labels and mismatched provenance before publication", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    await expect(ingestNamedFactoryPacket({ producerIdentity: "fixture", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: {} } as never, repository)).rejects.toThrow()
    expect(() => readFileSync(join(directory, `factory-artifact-${labRoot("missing", {}).slice(7)}.bin`))).toThrow()
  })

  it("retains unavailable intake configuration without fabricating an attempt", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const result = await ingestNamedFactoryPacket({ producerIdentity: "admitQuarantinedIntakePacket", origin: "human-external-intake", evidenceClass: "real_producer", producerInput: { protocol: {} } }, createFactoryRepository(directory))
    expect(result).toMatchObject({ disposition: "blocked_configuration", attemptRoot: null, authorized: false, allocation: "none" })
  })

  it("retains the full admitted model companion and re-admits it on reload", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    const modelSource = "export default {selectActivations(){return {activationOrders:[],strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}"
    const hash = (value: string): LabRoot => `sha256:${createHash("sha256").update(value).digest("hex")}` as LabRoot
    const responseValue = { format: "explicit-typescript-source" as const, source: modelSource }
    const bundleValue = { schemaVersion: "frozen-model-bundle-v1" as const, privacy: "private_offline" as const, provider: { providerId: "frozen-provider", modelId: "frozen-model", modelVersion: "v1", settingsRoot: root("1"), promptRoot: root("2"), contextRoot: root("3") }, request: { root: root("4"), byteLength: 1, encoding: "utf8" as const }, response: { ...responseValue, root: deriveFrozenModelResponseRoot(responseValue) }, source: { root: hash(modelSource), sha256: hash(modelSource), byteLength: new TextEncoder().encode(modelSource).byteLength, encoding: "utf8" as const }, accounting: { inputTokens: 1, outputTokens: 1, tokenLimit: 2, elapsedMilliseconds: 1, resourceRoot: root("5") }, attempt: { attemptRoot: root("6"), budgetRoot: root("7"), ordinal: 0 }, nativeLane: { language: "typescript" as const, providerId: "frozen-provider", runtimeAbi: "strategy-runtime-abi-v1.19" as const, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const }, lineage: { predecessorRoot: root("8"), correctionRoot: null, retryParentRoot: null } }
    const bundle = { ...bundleValue, root: deriveFrozenModelBundleRoot(bundleValue) }
    const result = await ingestNamedFactoryPacket({ producerIdentity: "emitModelFactoryPacket", origin: "model-oracle", evidenceClass: "real_producer", producerInput: { bundle, request: { split: "development", doctrineFamily: "model-test", build: { buildRoot: root("9"), toolchainRoot: root("a") }, lineage: bundle.lineage } } }, repository)
    if (result.disposition !== "accepted") throw new Error("model ingestion")
    const reloaded = readFactoryIngestion(repository, result.artifactRoot)
    expect(reloaded.modelCompanion?.bundle).toEqual(bundle)
    expect(reloaded.modelCompanion?.packetRoot).toBe(reloaded.packetRoot)
  })
})
