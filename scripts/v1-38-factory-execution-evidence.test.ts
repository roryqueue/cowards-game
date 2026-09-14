import { describe, expect, it } from "vitest"
import { deriveFactoryNegativeWitness, deriveFactorySharedHelperAudit, readFactoryExecutionEvidence, verifyFactoryAuthoringRecords } from "./v1-38-factory-execution-evidence.js"
import { emitTacticalFactoryPacket, emitTacticalSource } from "../packages/strategy-oracle-tactical/src/emit.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryExecutionEvidenceFixture } from "./fixtures/factory-execution-evidence-fixture.js"
import { readFactoryArtifact, publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { admitCanonicalJsonValue } from "@cowards/spec"

const root = labRoot("fixture", "fixture")
const packet = emitTacticalFactoryPacket({ split: "development", doctrineFamily: "test", provider: { providerId: "test", modelId: "fixture", modelVersion: "fixture", settingsRoot: root, promptRoot: root, contextRoot: root }, build: { buildRoot: root, toolchainRoot: root }, lineage: { predecessorRoot: root, correctionRoot: null, retryParentRoot: null } })
const record = { packet, sourceUtf8: emitTacticalSource(), sourceRoot: packet.source.root, packetRoot: packet.root, root } as never

describe("factory empirical authorship prerequisite", () => {
  it("reopens the complete fake retained chain and rejects rerooted review, search, training, audit, and witness joins", async () => {
    const fixture = await createFactoryExecutionEvidenceFixture()
    expect(readFactoryExecutionEvidence(fixture.repository, fixture.executionEvidenceArtifactRoot, fixture.fresh)).toMatchObject({ schemaVersion: "factory-calibration-execution-evidence-v1" })
    const raw = JSON.parse(new TextDecoder().decode(readFactoryArtifact(fixture.repository, fixture.executionEvidenceArtifactRoot))) as Record<string, any>
    const encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok) throw new Error("encode"); return result.canonicalBytes }
    for (const key of ["sourceReviewArtifactRoot", "teacherSearchArtifactRoot", "teacherTrainingArtifactRoot", "sharedHelperAuditArtifactRoot"] as const) {
      const value = { ...raw, [key]: root }, { root: _old, ...body } = value
      const changed = publishFactoryArtifact(fixture.repository, encode({ ...body, root: labRoot("factory-calibration-execution-evidence-v1", body) }))
      expect(() => readFactoryExecutionEvidence(fixture.repository, changed, fixture.fresh)).toThrow()
    }
    const value = { ...raw, negativeWitnessArtifactRoots: { ...raw.negativeWitnessArtifactRoots, S01: root } }, { root: _old, ...body } = value
    const changed = publishFactoryArtifact(fixture.repository, encode({ ...body, root: labRoot("factory-calibration-execution-evidence-v1", body) }))
    expect(() => readFactoryExecutionEvidence(fixture.repository, changed, fixture.fresh)).toThrow()
  })
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
