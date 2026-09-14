import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryRepository, readFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
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
    expect(Buffer.from(reloaded.sourceBytes).toString("utf8")).toContain("export default")
    expect(readFactoryArtifact(repository, result.artifactRoot).byteLength).toBeLessThanOrEqual(262_144)
  })

  it("rejects fabricated producer labels and mismatched provenance before publication", async () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-ingest-test-"))); dirs.push(directory)
    const repository = createFactoryRepository(directory)
    await expect(ingestNamedFactoryPacket({ producerIdentity: "fixture", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: {} } as never, repository)).rejects.toThrow()
    expect(() => readFileSync(join(directory, `factory-artifact-${labRoot("missing", {}).slice(7)}.bin`))).toThrow()
  })
})
