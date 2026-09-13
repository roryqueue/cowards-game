import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import {
  FactoryCandidateSchema,
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFromPacket,
  factoryValidationFixture,
} from "./contracts.js"
import { admitFactory, authorizeFactorySupervision, finalizeFactoryCandidate, mapFactorySupervision, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider } from "./admission.js"
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
const matchParticipants = { bottomPlayerId: "candidate", topPlayerId: "opponent" } as Parameters<typeof superviseFactory>[2]["match"]
const providerFor = (admission: FactoryAdmission, result: unknown = { ok: true, value: {} }, identityChange: Record<string, unknown> = {}): FactorySupervisionProvider => {
  const identity = {
    revisionId: "candidate", sourceRoot: admission.sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: `sha256:${"0".repeat(64)}`,
    image: "image", harnessRoot: sourceRoot, budgetRoot: sourceRoot, attemptRoot: sourceRoot, runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
    nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
    ...identityChange,
  }
  return {
    identity,
    async invoke() { return { identity, requestId: "request", method: "SoldierBrain", inputRoot: sourceRoot, ordinal: 0, invocationRoot: `sha256:${"d".repeat(64)}`, charged: true, completed: true, outputBytes: 1, result } as never },
    verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } },
  }
}
const runCandidateOnce = async ({ providers }: Parameters<typeof superviseFactory>[2]) => {
  const candidate = providers.candidate
  if (!candidate) throw new Error("missing candidate provider")
  const evidence = await candidate.invoke({} as never, candidate.identity)
  return { kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [evidence] } as never
}
const authorized = () => {
  const { packet, proposal, validation } = admittedCandidate()
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: source }), validation })
  return { packet, proposal, validation, admission }
}

describe("hostile private candidate admission", () => {
  it("accepts a complete projection from the same packet and rejects an unbound receipt", () => {
    const { packet, proposal, validation } = admittedCandidate()
    const sourceAdmission = admitFactory({ packet, proposal, sourceBytes: source })
    expect(() => authorizeFactorySupervision({ sourceAdmission: { ...sourceAdmission }, validation })).toThrow("FACTORY_ADMISSION")
    const admission = authorizeFactorySupervision({ sourceAdmission, validation })
    expect(admission.sourceRoot).toBe(sourceRoot)
    expect(() => mapFactorySupervision({
      admission,
      execution: { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "DENIED" }, accounting: [] },
      root: sourceRoot,
    } as never)).toThrow("FACTORY_ADMISSION")
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
    const input = { match: matchParticipants, providers: { candidate: provider() } }
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
    const input = { match: matchParticipants, providers: { candidate: provider } }
    await expect(superviseFactory(admission, "candidate", input, async ({ providers }) => {
      const selected = providers.candidate
      if (!selected) throw new Error("missing candidate provider")
      await selected.invoke({} as never, selected.identity)
      return { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "TEST" }, accounting: [] }
    })).rejects.toThrow("FACTORY_ADMISSION")
    expect(invoked).toBe(true)
  })

  it("requires an issued successful receipt before it publishes a final candidate", async () => {
    const { proposal, validation, admission } = authorized()
    const unexecuted = factoryCandidateFixture(proposal, validation)
    expect(() => finalizeFactoryCandidate({ receipt: { admission } as never, candidate: unexecuted })).toThrow("FACTORY_ADMISSION")

    const failureReceipt = await superviseFactory(admission, "candidate", { match: matchParticipants, providers: { candidate: providerFor(admission) } }, async ({ providers }) => {
      const candidate = providers.candidate
      if (!candidate) throw new Error("missing candidate provider")
      const evidence = await candidate.invoke({} as never, candidate.identity)
      return { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "TEST" }, accounting: [evidence] } as never
    })
    expect(() => finalizeFactoryCandidate({ receipt: failureReceipt, candidate: factoryCandidateFixture(proposal, validation, failureReceipt.root) })).toThrow("FACTORY_ADMISSION")

    const successReceipt = await superviseFactory(admission, "candidate", { match: matchParticipants, providers: { candidate: providerFor(admission) } }, runCandidateOnce)
    const final = finalizeFactoryCandidate({ receipt: successReceipt, candidate: factoryCandidateFixture(proposal, validation, successReceipt.root) })
    expect(final.supervisionReceiptRoot).toBe(successReceipt.root)
  })

  it("rejects detached or uninvoked candidate providers and fabricated receipts", async () => {
    const { admission, proposal, validation } = authorized()
    let invoked = false
    const detached = providerFor(admission)
    detached.invoke = async () => { invoked = true; return {} as never }
    await expect(superviseFactory(admission, "detached", {
      match: matchParticipants,
      providers: { detached },
    }, runCandidateOnce)).rejects.toThrow("FACTORY_ADMISSION")
    expect(invoked).toBe(false)

    await expect(superviseFactory(admission, "candidate", {
      match: matchParticipants,
      providers: { candidate: providerFor(admission) },
    }, async () => ({ kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [] } as never))).rejects.toThrow("FACTORY_ADMISSION")

    const fabricated = {
      admission, candidatePlayerId: "candidate", candidateIdentity: providerFor(admission).identity,
      execution: { kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [] },
      root: sourceRoot,
    }
    expect(() => mapFactorySupervision(fabricated as never)).toThrow("FACTORY_ADMISSION")
  })

  it("classifies only the admitted candidate's violation while preserving any Match system failure", async () => {
    const { admission, proposal, validation } = authorized()
    const successProvider = providerFor(admission)
    const opponentIdentity = { ...successProvider.identity, revisionId: "opponent", sourceRoot: `sha256:${"b".repeat(64)}` }
    const opponentViolation = { identity: opponentIdentity, result: { ok: false, violation: { code: "OPPONENT_INVALID" } } } as never
    const opponentOnlyReceipt = await superviseFactory(admission, "candidate", { match: matchParticipants, providers: { candidate: successProvider } }, async ({ providers }) => {
      const candidate = providers.candidate
      if (!candidate) throw new Error("missing candidate provider")
      const evidence = await candidate.invoke({} as never, candidate.identity)
      return { kind: "completed", privacy: "private_offline", result: {}, transitions: [], accounting: [evidence, opponentViolation] } as never
    })
    const opponentOnlyOutcome = mapFactorySupervision(opponentOnlyReceipt)
    expect(opponentOnlyOutcome.candidateDisposition).toBe("accepted")
    expect(opponentOnlyOutcome.disposition).toBe("player_violation")
    expect(opponentOnlyOutcome.scoredAsGameplay).toBe(false)
    expect(() => finalizeFactoryCandidate({
      receipt: opponentOnlyReceipt,
      candidate: factoryCandidateFixture(proposal, validation, opponentOnlyReceipt.root),
    })).toThrow("FACTORY_ADMISSION")

    const candidateViolation = await superviseFactory(admission, "candidate", { match: matchParticipants, providers: { candidate: providerFor(admission, { ok: false, violation: { code: "CANDIDATE_INVALID" } }) } }, runCandidateOnce)
    expect(mapFactorySupervision(candidateViolation).disposition).toBe("player_violation")

    const systemFailure = await superviseFactory(admission, "candidate", { match: matchParticipants, providers: { candidate: providerFor(admission) } }, async ({ providers }) => {
      const candidate = providers.candidate
      if (!candidate) throw new Error("missing candidate provider")
      const evidence = await candidate.invoke({} as never, candidate.identity)
      return { kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "TEST" }, accounting: [evidence] } as never
    })
    expect(mapFactorySupervision(systemFailure).disposition).toBe("system_failure")
  })
})
