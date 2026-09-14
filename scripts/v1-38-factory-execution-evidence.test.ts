import { describe, expect, it } from "vitest"
import { deriveFactoryNegativeWitness, deriveFactorySharedHelperAudit, readFactoryExecutionEvidence, verifyFactoryAuthoringRecords } from "./v1-38-factory-execution-evidence.js"
import { emitTacticalFactoryPacket, emitTacticalSource } from "../packages/strategy-oracle-tactical/src/emit.js"
import { labRoot } from "../packages/strategy-lab/src/contracts.js"
import { createFactoryExecutionEvidenceFixture } from "./fixtures/factory-execution-evidence-fixture.js"
import { publishFactoryArtifact } from "../packages/strategy-lab/src/factory/repository.js"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"

const root = labRoot("fixture", "fixture")
const packet = emitTacticalFactoryPacket({ split: "development", doctrineFamily: "test", provider: { providerId: "test", modelId: "fixture", modelVersion: "fixture", settingsRoot: root, promptRoot: root, contextRoot: root }, build: { buildRoot: root, toolchainRoot: root }, lineage: { predecessorRoot: root, correctionRoot: null, retryParentRoot: null } })
const record = { packet, sourceUtf8: emitTacticalSource(), sourceRoot: packet.source.root, packetRoot: packet.root, root } as never

describe("factory empirical authorship prerequisite", () => {
  it("covers admission, ledger and identity dependencies in the reviewed source snapshot",()=>{
    const paths=factoryAssessmentImplementationManifest().entries.map(entry=>entry.path)
    for(const name of ["ledger","contracts","identity"])expect(paths).toContain(`packages/strategy-lab/src/factory/${name}.ts`)
    expect(paths.some(path=>path.startsWith(".planning/")||path.startsWith(".strategy-lab/"))).toBe(false)
  })
  it("reopens the complete fake retained chain and rejects rerooted review, search, training, audit, and witness joins", async () => {
    const fixture = await createFactoryExecutionEvidenceFixture()
    expect(readFactoryExecutionEvidence(fixture.repository, fixture.executionEvidenceArtifactRoot, fixture.fresh)).toMatchObject({ schemaVersion: "factory-calibration-execution-evidence-v1" })
    const encode = (value: unknown) => { const result = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!result.ok) throw new Error("encode"); return result.canonicalBytes }
    const rooted = (domain: string, value: Record<string, unknown>) => publishFactoryArtifact(fixture.repository, encode({ ...value, root: labRoot(domain, value) }))
    const withLink = (key: string, artifactRoot: string) => {
      const body = { ...fixture.values.executionValue, [key]: artifactRoot }
      return rooted("factory-calibration-execution-evidence-v1", body)
    }
    const changedReview = rooted("factory-source-review-v1", { ...fixture.values.reviewValue, sourceCommit: "b".repeat(40) })
    expect(() => readFactoryExecutionEvidence(fixture.repository, withLink("sourceReviewArtifactRoot", changedReview), fixture.fresh)).toThrow("REVIEW")
    const changedImplementation = rooted("factory-source-review-v1",{...fixture.values.reviewValue,implementationRoot:labRoot("changed-implementation","ledger-admission-changed")})
    expect(()=>readFactoryExecutionEvidence(fixture.repository,withLink("sourceReviewArtifactRoot",changedImplementation),fixture.fresh)).toThrow("REVIEW")
    const changedSearch = rooted("factory-teacher-search-evidence-v1", { ...fixture.values.searchValue, receipt: { ...fixture.values.searchValue.receipt, selectedOutcomeRoot: root } })
    expect(() => readFactoryExecutionEvidence(fixture.repository, withLink("teacherSearchArtifactRoot", changedSearch), fixture.fresh)).toThrow("TEACHER_SEARCH")
    const changedTraining = rooted("factory-teacher-training-evidence-v1", { ...fixture.values.trainingValue, student: { bogus: true } })
    expect(() => readFactoryExecutionEvidence(fixture.repository, withLink("teacherTrainingArtifactRoot", changedTraining), fixture.fresh)).toThrow("TEACHER_TRAINING")
    const { root: _auditRoot, ...auditBody } = fixture.values.audit
    const changedAudit = rooted("factory-shared-helper-audit-v1", { ...auditBody, strategicSharingViolations: Number(auditBody.strategicSharingViolations) + 1 })
    expect(() => readFactoryExecutionEvidence(fixture.repository, withLink("sharedHelperAuditArtifactRoot", changedAudit), fixture.fresh)).toThrow("SHARED_HELPER_AUDIT")
    const { root: _witnessRoot, ...witnessBody } = fixture.values.witnesses.S01
    const changedWitness = rooted("factory-negative-admission-witness-v1", { ...witnessBody, runtimeExecuted: true })
    const body = { ...fixture.values.executionValue, negativeWitnessArtifactRoots: { ...fixture.values.executionValue.negativeWitnessArtifactRoots, S01: changedWitness } }
    expect(() => readFactoryExecutionEvidence(fixture.repository, rooted("factory-calibration-execution-evidence-v1", body), fixture.fresh)).toThrow("NEGATIVE_WITNESS")
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
