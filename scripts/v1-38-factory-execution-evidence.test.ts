import { describe, expect, it } from "vitest"
import { deriveFactoryNegativeWitness, deriveFactorySharedHelperAudit, verifyFactoryAuthoringRecords } from "./v1-38-factory-execution-evidence.js"
import { emitTacticalFactoryPacket, emitTacticalSource } from "../packages/strategy-oracle-tactical/src/emit.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"

const root = labRoot("fixture", "fixture")
const packet = emitTacticalFactoryPacket({ split: "development", doctrineFamily: "test", provider: { providerId: "test", modelId: "fixture", modelVersion: "fixture", settingsRoot: root, promptRoot: root, contextRoot: root }, build: { buildRoot: root, toolchainRoot: root }, lineage: { predecessorRoot: root, correctionRoot: null, retryParentRoot: null } })
const record = { packet, sourceUtf8: emitTacticalSource(), sourceRoot: packet.source.root, packetRoot: packet.root, root } as never

describe("factory empirical authorship prerequisite", () => {
  it("derives a charged negative witness from actual source and packet without runtime", () => {
    expect(deriveFactoryNegativeWitness(record)).toMatchObject({ sourceRoot: packet.source.root, packetRoot: packet.root, charged: true, allocation: "none", runtimeExecuted: false, disposition: "rejected", mutation: "append-newline-source-mismatch" })
  })
  it("flags shared substantial source bodies rather than trusting separate labels", () => {
    expect(deriveFactorySharedHelperAudit({ S01: record, S03: record, S05: record })).toMatchObject({ sourceRoots: { S01: packet.source.root, S03: packet.source.root, S05: packet.source.root } })
    expect(Number(deriveFactorySharedHelperAudit({ S01: record, S03: record, S05: record }).strategicSharingViolations)).toBeGreaterThan(0)
  })
  it("rejects missing author attempts rather than counting a model label", () => {
    expect(() => verifyFactoryAuthoringRecords({} as never, [], {})).toThrow("FACTORY_EXECUTION_AUTHOR_ATTEMPTS")
  })
  it("rejects a fifth attempt before opening any evidence", () => {
    expect(() => verifyFactoryAuthoringRecords({} as never, Array(5).fill({}), {})).toThrow("FACTORY_EXECUTION_AUTHOR_ATTEMPTS")
  })
})
