import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import {
  FactoryCandidateSchema,
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFromPacket,
  factoryValidationFixture,
} from "./contracts.js"
import { admitFactory, authorizeFactorySupervision, mapFactorySupervision, superviseFactory, type FactorySupervisionProvider } from "./admission.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot, deriveFactoryProposalRoot } from "./identity.js"

const source = new TextEncoder().encode("export default {}")
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as const
const admittedPacket = () => {
  const fixture = factoryOraclePacketFixture()
  const packet = { ...fixture, source: { ...fixture.source, root: sourceRoot, sha256: sourceRoot, byteLength: source.byteLength } }
  return { ...packet, root: deriveFactoryOraclePacketRoot(packet) }
}
const admittedCandidate = () => {
  const packet = admittedPacket(), proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  return { packet, proposal, validation, candidate: factoryCandidateFixture(proposal, validation) }
}
const changedProposal = (proposal: ReturnType<typeof factoryProposalFromPacket>, change: Record<string, unknown>) => {
  const value = { ...proposal, ...change }
  return { ...value, root: deriveFactoryProposalRoot(value) }
}

describe("hostile private candidate admission", () => {
  it("accepts a complete projection from the same packet and rejects an unbound receipt", () => {
    const { packet, proposal, validation } = admittedCandidate()
    const sourceAdmission = admitFactory({ packet, proposal, sourceBytes: source })
    const admission = authorizeFactorySupervision({ sourceAdmission, validation })
    expect(admission.sourceRoot).toBe(sourceRoot)
    expect(() => mapFactorySupervision({
      admission,
      execution: { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "DENIED" }, accounting: [] },
      root: sourceRoot,
    })).toThrow("FACTORY_ADMISSION")
  })

  it("rejects every packet/proposal projection conflict and all lineage substitutions before publication", () => {
    const { packet, proposal, validation } = admittedCandidate()
    const replacement = `sha256:${"e".repeat(64)}` as const
    const changes: readonly Record<string, unknown>[] = [
      { source: { ...proposal.source, root: replacement, sha256: replacement } },
      { build: { ...proposal.build, buildRoot: replacement } },
      { build: { ...proposal.build, toolchainRoot: replacement } },
      { build: { ...proposal.build, compatibilityTupleRoot: replacement } },
      { versions: { ...proposal.versions, algorithm: "other-strategy-v2" } },
      { oracleFamily: "other-oracle" }, { doctrineFamily: "other-doctrine" }, { split: "probe" },
      { nativeLane: { ...proposal.nativeLane, providerId: "other-provider" } },
      { lineage: { ...proposal.lineage, predecessorRoot: replacement } },
      { lineage: { ...proposal.lineage, correctionRoot: replacement } },
      { lineage: { ...proposal.lineage, retryParentRoot: replacement } },
    ]
    for (const [index, change] of changes.entries()) {
      const conflicting = changedProposal(proposal, change)
      expect(() => admitFactory({ packet, proposal: conflicting, sourceBytes: source }), `projection case ${index}`).toThrow()
    }
    const candidate = factoryCandidateFixture(proposal, validation)
    const changedLineage = { ...candidate, lineage: { ...candidate.lineage, predecessorRoot: replacement } }
    expect(() => FactoryCandidateSchema.parse({ ...changedLineage, root: deriveFactoryCandidateRoot(changedLineage) })).toThrow()
  })

  it("rejects another source, lane, validation, or candidate before invoking supervision", async () => {
    const { packet, proposal, validation } = admittedCandidate()
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: source }), validation })
    let invoked = false
    const provider = (change: Record<string, unknown> = {}): FactorySupervisionProvider => ({
      identity: {
        revisionId: "candidate", sourceRoot: admission.sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: packet.build.compatibilityTupleRoot,
        image: "image", harnessRoot: sourceRoot, budgetRoot: sourceRoot, attemptRoot: sourceRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
        nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
        ...change,
      },
      async invoke() { invoked = true; throw new Error("must not invoke") },
      verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } },
    })
    const input = { match: {} as Parameters<typeof superviseFactory>[2]["match"], providers: { candidate: provider() } }
    for (const change of [
      { sourceRoot: `sha256:${"1".repeat(64)}` }, { nativeLane: { ...admission.nativeLane, providerId: "wrong-provider" } },
      { factoryPacketRoot: `sha256:${"2".repeat(64)}` }, { factoryValidationRoot: `sha256:${"3".repeat(64)}` },
      { factoryProposalRoot: `sha256:${"4".repeat(64)}` },
    ]) await expect(superviseFactory(admission, "candidate", { ...input, providers: { candidate: provider(change) } })).rejects.toThrow("FACTORY_ADMISSION")
    expect(invoked).toBe(false)
  })

  it("rechecks the issued identity after every provider invocation", async () => {
    const { packet, proposal, validation } = admittedCandidate()
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: source }), validation })
    let invoked = false
    const provider: FactorySupervisionProvider = {
      identity: {
        revisionId: "candidate", sourceRoot: admission.sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: packet.build.compatibilityTupleRoot,
        image: "image", harnessRoot: sourceRoot, budgetRoot: sourceRoot, attemptRoot: sourceRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
        nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
      },
      async invoke() {
        invoked = true
        return { identity: { ...this.identity, sourceRoot: `sha256:${"a".repeat(64)}` } } as never
      },
      verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } },
    }
    const input = { match: {} as Parameters<typeof superviseFactory>[2]["match"], providers: { candidate: provider } }
    await expect(superviseFactory(admission, "candidate", input, async ({ providers }) => {
      const selected = providers.candidate
      if (!selected) throw new Error("missing candidate provider")
      await selected.invoke({} as never, selected.identity)
      return { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "TEST" }, accounting: [] }
    })).rejects.toThrow("FACTORY_ADMISSION")
    expect(invoked).toBe(true)
  })
})
