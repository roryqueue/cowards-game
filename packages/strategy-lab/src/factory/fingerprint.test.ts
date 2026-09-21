import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import { LAB_ADMITTED_ROOTS, labRoot, type LabRoot } from "../contracts.js"
import { admitFactory, authorizeFactorySupervision, deriveFactoryExecutionCommitment, finalizeFactoryCandidate, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider, type FactorySupervisionReceipt } from "./admission.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "./contracts.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot } from "./identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "./repository.js"
import { createFactoryFingerprintEvidence, createFactoryGraphNodeArtifact, createLeagueAuthorizedFactoryFingerprintEvidence, deriveFactoryFingerprints, deriveFactorySourceStructureRoot, isFactoryProducerAuthorized, issueFactoryPairedCommitment, requireIssuedFactoryIndependenceReceipt, verifyRetainedLeagueFactoryFingerprints } from "./fingerprint.js"
import { publishFactorySupervisionArtifacts } from "./supervision-artifacts.js"
import { allocationFixture } from "../league/allocation.test.js"
import { createLeagueExecutionAllocation } from "../league/allocation.js"
import { declareRedTeamAllocation, startRedTeamAttempt } from "../league/red-team.js"

const dirs: string[] = []
const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const sourceText = "// cosmetic\nconst choose = (input) => input.phaseNumber > 0 ? [] : []; export default { selectActivations(input) { return { activationOrders: choose(input), strategyMemory: {} } }, soldierBrain() { return { action: { type: 'TURN_TO_STONE' }, soldierMemory: {} } } }"
const source = new TextEncoder().encode(sourceText)
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as LabRoot
const repository = () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-fingerprint-test-")))
  dirs.push(directory)
  return createFactoryRepository(directory)
}
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const admitted = () => {
  const fixture = factoryOraclePacketFixture()
  const packetValue = { ...fixture, source: { ...fixture.source, root: sourceRoot, sha256: sourceRoot, byteLength: source.byteLength } }
  const packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }
  const proposal = factoryProposalFromPacket(packet)
  const validation = factoryValidationFixture(proposal)
  const repo = repository()
  const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: source, repository: repo }), validation, repository: repo })
  return { repo, packet, proposal, validation, admission }
}
const providerFor = (admission: FactoryAdmission, bindings?: { attemptRoot: LabRoot; budgetRoot: LabRoot }): FactorySupervisionProvider => {
  const identity = {
    revisionId: "candidate", sourceRoot: admission.sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: root("1"),
    image: "image", harnessRoot: root("2"), budgetRoot: root("3"), attemptRoot: root("4"), runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
    nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
    ...bindings,
  }
  return {
    identity,
    invoke(request) {
      return {
        identity, requestId: request.requestId, method: request.kind, inputRoot: labRoot("runtime-input", request.input), ordinal: 0,
        invocationRoot: root("5"), charged: true, completed: true, outputBytes: 2,
        result: { ok: true, value: { activationOrders: [], strategyMemory: { secret: true } } },
      }
    },
    verify() { return true }, close() { return { cleanupComplete: true, orphanedChild: false } },
  }
}
const supervision = async (admission: FactoryAdmission, bindings?: { attemptRoot: LabRoot; budgetRoot: LabRoot }, syntheticOrdinal?: number) => superviseFactory(admission, "candidate", {
  match: { bottomPlayerId: "candidate", topPlayerId: "opponent" } as never,
  providers: { candidate: providerFor(admission, bindings) },
}, async ({ providers }) => {
  const request = {
    kind: "selectActivations", requestId: "factory:1", semanticTupleId: "tuple",
    coordinates: { phaseNumber: 1, roundNumber: 1, stage: "select_bottom", ordinal: 0, actingPlayerId: "candidate" },
    input: {
      phaseNumber: 1, roundNumber: 1, activationCount: 1,
      board: { bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }, soldiers: [], terrainStones: [] },
      mySoldiers: [], enemySoldiers: [], strategyMemory: { private: "strip-me" },
      initialInitiativePlayerId: "candidate", hasInitialInitiative: true, roundInitiativePlayerId: "candidate", hasRoundInitiative: true,
    },
  }
  const evidence = await providers.candidate!.invoke(request as never, providers.candidate!.identity)
  return {
    kind: "completed", privacy: "private_offline",
    result: { state: {}, events: [] },
    transitions: [{
      transitionKind: "runtime_resume", semanticTupleId: "tuple", semanticTuple: {},
      coordinates: request.coordinates, classification: "success",
      events: [{ type: "ROUND_STARTED", sequence: 1, payload: { roundNumber: 1 }, privatePayload: { objective: "strip-me", ...(syntheticOrdinal === undefined ? {} : { synthetic: String.fromCharCode(65 + syntheticOrdinal).repeat(100000) }) } }],
      beforeState: { phaseNumber: 1 }, afterState: { phaseNumber: 1 }, beforeStateHash: root("6"), afterStateHash: root("7"),
      beforeMachineHash: root("8"), afterMachineHash: root("9"), terminalStatus: null, failureStatus: null,
    }],
    accounting: [evidence],
  } as never
})
const verifiedSupervision = async (admission: FactoryAdmission, seed: string) => {
  const opponent = {
    identity: { revisionId: "opponent", sourceRoot: root("1"), executableRoot: root("2"), tupleId: "tuple", tupleRoot: root("3"), image: "image", harnessRoot: root("4"), budgetRoot: root("5"), attemptRoot: root("6"), runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot },
    invoke() { throw new Error("unreachable") }, verify() { return false }, close() { return { cleanupComplete: true, orphanedChild: false } },
  }
  return superviseFactory(admission, "candidate", {
    match: { matchId: `match-${seed}`, seed, arenaVariant: CANONICAL_ARENA_CATALOG_V1_37.arenas[0]!, bottomPlayerId: "candidate", topPlayerId: "opponent", bottomStrategyRevisionId: "candidate", topStrategyRevisionId: "opponent", initialInitiativePlayerId: "candidate", maxPhases: 1 },
    providers: { candidate: providerFor(admission), opponent },
  }, async ({ providers }) => {
    const request = { kind: "selectActivations", requestId: `factory:${seed}`, semanticTupleId: "tuple", input: { phaseNumber: 1, roundNumber: 1, activationCount: 1, board: { bounds: { minX: 0, maxX: 1, minY: 0, maxY: 1 }, soldiers: [], terrainStones: [] }, mySoldiers: [], enemySoldiers: [], strategyMemory: null, initialInitiativePlayerId: "candidate", hasInitialInitiative: true, roundInitiativePlayerId: "candidate", hasRoundInitiative: true } }
    const evidence = await providers.candidate!.invoke(request as never, providers.candidate!.identity)
    return { kind: "completed", privacy: "private_offline", result: { state: {}, events: [] }, transitions: [], accounting: [evidence] } as never
  })
}
const evidenceArtifact = (repo: ReturnType<typeof repository>, values: { proposalRoot: LabRoot; validationRoot: LabRoot; receipt: FactorySupervisionReceipt }) => {
  const lineageNodes = [{ root: values.proposalRoot, parents: [root("b")] }, { root: root("b"), parents: [] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repo, { kind: "lineage", nodeRoot: node.root, links: node.parents }) }))
  const dependencyNodes = [{ root: root("c"), dependencies: [root("d")] }, { root: root("d"), dependencies: [] }].map((node) => ({ ...node, artifactRoot: createFactoryGraphNodeArtifact(repo, { kind: "dependency", nodeRoot: node.root, links: node.dependencies }) }))
  const matchup = { supervisionReceiptRoot: values.receipt.root, conditionRoot: root("e"), opponentRoot: root("f"), side: "bottom" as const, initialInitiative: true, outcome: "draw" as const }
  const record = createFactoryFingerprintEvidence({
    proposalRoot: values.proposalRoot, validationRoot: values.validationRoot, supervisionReceiptRoot: values.receipt.root,
    producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "mechanics_only", producerArtifactRoot: null,
    authorshipRoots: [root("a")],
    lineageNodes, dependencyNodes,
    matchupResponses: [{ ...matchup, responseRoot: labRoot("factory-issued-matchup-response-v1", { ...matchup, execution: deriveFactoryExecutionCommitment(values.receipt.execution) }) }],
    counterfactualPairs: [{ leftRoot: root("b"), rightRoot: root("c"), relation: "borderline" }],
    failureModes: ["accepted"],
  })
  const encoded = admitCanonicalJsonValue(record, { profile: "canonical-manifest" })
  if (!encoded.ok) throw new Error("test evidence encoding")
  return { evidence: record, artifactRoot: publishFactoryArtifact(repo, encoded.canonicalBytes) }
}

describe("six derived factory fingerprints", () => {
  it("issues a separate prospective league producer branch only for the exact charged source and fresh receipt", async () => {
    const { repo, packet, proposal, validation, admission } = admitted()
    const put = (value: unknown) => { const encoded = admitCanonicalJsonValue(value, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("test encoding"); return publishFactoryArtifact(repo, encoded.canonicalBytes) }
    const fixture = allocationFixture(), reservation = { ...fixture.channels[0]!.perAttempt, matches: 48, effortMilliseconds: 1 }
    const requestArtifactRoot = put({ producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", producerInput: {} })
    const job = { id: "tactical-one", channel: "automated" as const, evaluationRole: "development_response" as const, operation: "produce" as const, producerRequestArtifactRoot: requestArtifactRoot, disclosureArtifactRoot: root("b"), provenanceArtifactRoot: root("c"), reviewArtifactRoot: root("d"), participantId: "author", reviewerId: "reviewer", reservation, retryParentJobId: null }
    const allocation = createLeagueExecutionAllocation({ ...fixture, outputDirectories: { ...fixture.outputDirectories, responseFactory: repo.directory }, opportunities: { ...fixture.opportunities, attemptedCandidates: 1 }, channels: fixture.channels.map((channel) => channel.channel === "automated" ? { ...channel, disposition: "allocated", opportunities: 1, ceilings: reservation, perAttempt: reservation, participants: ["author"], reviewers: ["reviewer"] } : channel), rounds: [{ ordinal: 0, acceptedSlots: 0, jobs: [job] }, fixture.rounds[1]!] })
    const ledger = declareRedTeamAllocation({ phase: 265, evidenceClass: allocation.evidenceClass, authorityRoot: allocation.root, channels: allocation.channels, probes: allocation.probes })
    const started = startRedTeamAttempt({ ledger, channel: "automated", roundRoot: root("e"), candidateRoot: root("f"), participantId: job.participantId, reviewerId: job.reviewerId, disclosureRoot: job.disclosureArtifactRoot, provenanceRoot: job.provenanceArtifactRoot, inputRoot: job.producerRequestArtifactRoot, retryParentRoot: null, reservation })
    const start = started.starts[0]!, receipt = await supervision(admission, { attemptRoot: start.root, budgetRoot: allocation.root })
    const producerValue = { schemaVersion: "factory-ingestion-v1", privacy: "private_offline", producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer", packetRoot: packet.root, sourceRoot, runtimeProfileRoot: packet.nativeLane.runtimeProfileRoot, nativeLane: packet.nativeLane, packet, sourceUtf8: sourceText, producerInput: {}, modelCompanion: null }
    const producerArtifactRoot = put({ ...producerValue, root: labRoot("factory-ingestion-v1", producerValue) })
    const base = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt }).evidence
    const { schemaVersion: _schema, privacy: _privacy, root: _root, ...value } = base
    const input = { repository: repo, allocationArtifactRoot: put(allocation), startArtifactRoot: put(start), supervisionReceipt: receipt, value: { ...value, evidenceClass: "real_producer" as const, producerArtifactRoot } }
    const evidence = createLeagueAuthorizedFactoryFingerprintEvidence(input)
    const derived = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence, evidenceArtifactRoot: put(evidence) })
    expect(derived.status).toBe("unresolved")
    const candidateValue = { ...factoryCandidateFixture(proposal, validation, receipt.root), fingerprints: derived.fingerprints }, candidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }, retained = { repository: repo, allocationArtifactRoot: input.allocationArtifactRoot, startArtifactRoot: input.startArtifactRoot, authoringArtifactRoot: put({ fixture: "source-only-authoring" }), evidenceArtifactRoot: put(evidence), candidate, scoreSupervisionArtifactRoots: [publishFactorySupervisionArtifacts(repo, receipt).artifactRoot], counterfactualPairs: evidence.counterfactualPairs, maxBytes: 1000000, maxRecords: 1000 }
    expect(verifyRetainedLeagueFactoryFingerprints(retained)).toMatchObject({ issued: false, fingerprints: derived.fingerprints })
    // Each extra score carries a distinct large private payload. Keep only artifact
    // roots and host-issued compact commitments in this test, as the retained
    // reader must do; neither path needs an array of full executions.
    const scoreRoots = [...retained.scoreSupervisionArtifactRoots]
    const pairedCommitments = [issueFactoryPairedCommitment(receipt)]
    for (let ordinal = 0; ordinal < 12; ordinal += 1) {
      const score = await supervision(admission, { attemptRoot: start.root, budgetRoot: allocation.root }, ordinal)
      pairedCommitments.push(issueFactoryPairedCommitment(score))
      scoreRoots.push(publishFactorySupervisionArtifacts(repo, score).artifactRoot)
    }
    const many = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, pairedCommitments, evidence, evidenceArtifactRoot: retained.evidenceArtifactRoot })
    const manyValue = { ...candidateValue, fingerprints: many.fingerprints }
    const manyRetained = { ...retained, candidate: { ...manyValue, root: deriveFactoryCandidateRoot(manyValue) }, scoreSupervisionArtifactRoots: scoreRoots }
    const reopened = verifyRetainedLeagueFactoryFingerprints(manyRetained)
    expect(reopened).toMatchObject({ issued: false, fingerprints: many.fingerprints })
    expect(() => requireIssuedFactoryIndependenceReceipt(reopened as never)).toThrow("UNISSUED_RECEIPT")
    expect(() => verifyRetainedLeagueFactoryFingerprints({ ...manyRetained, scoreSupervisionArtifactRoots: [...scoreRoots, scoreRoots[1]!] })).toThrow("RETAINED_EVIDENCE_BINDING")
    expect(() => verifyRetainedLeagueFactoryFingerprints({ ...manyRetained, scoreSupervisionArtifactRoots: [...scoreRoots].reverse() })).toThrow("RETAINED_EVIDENCE_BINDING")
    expect(() => verifyRetainedLeagueFactoryFingerprints({ ...manyRetained, candidate })).toThrow("RETAINED_FINGERPRINT_MISMATCH")
    const rewrittenValue = { ...candidateValue, fingerprints: { ...candidateValue.fingerprints, legalInputDecisionRoot: root("f") } }
    expect(() => verifyRetainedLeagueFactoryFingerprints({ ...retained, candidate: { ...rewrittenValue, root: deriveFactoryCandidateRoot(rewrittenValue) } })).toThrow("RETAINED_FINGERPRINT_MISMATCH")
    expect(() => verifyRetainedLeagueFactoryFingerprints({ ...retained, counterfactualPairs: [] })).toThrow("RETAINED_EVIDENCE_BINDING")
    expect(() => createLeagueAuthorizedFactoryFingerprintEvidence({ ...input, supervisionReceipt: { ...receipt } })).toThrow("LEAGUE_SUPERVISION")
    const other = createLeagueExecutionAllocation({ ...fixture, operatorDecision: "foreign" })
    expect(() => createLeagueAuthorizedFactoryFingerprintEvidence({ ...input, allocationArtifactRoot: put(other) })).toThrow("LEAGUE_")
    expect(() => createLeagueAuthorizedFactoryFingerprintEvidence({ ...input, allocationArtifactRoot: put({ ...allocation, tupleRoot: root("a") }) })).toThrow()
    const changedProducer = { ...producerValue, sourceUtf8: `${sourceText}\n// changed` }
    expect(() => createLeagueAuthorizedFactoryFingerprintEvidence({ ...input, value: { ...input.value, producerArtifactRoot: put({ ...changedProducer, root: labRoot("factory-ingestion-v1", changedProducer) }) } })).toThrow("LEAGUE_PRODUCER")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: { ...evidence }, evidenceArtifactRoot: put(evidence) })).toThrow("UNISSUED_EVIDENCE")
    writeFileSync(join(repo.directory, `factory-artifact-${scoreRoots[1]!.slice(7)}.bin`), new Uint8Array([65]))
    expect(() => verifyRetainedLeagueFactoryFingerprints(manyRetained)).toThrow()
  })
  it("accepts an exact fresh-v2 producer authorization and rejects a coherently rerooted slot substitution", () => {
    const producerArtifactRoot = root("a")
    const value = { schemaVersion: "factory-calibration-authorization-v2", status: "authorized", allocationRoot: root("b"), sourceSlots: ["S01"], slotIngestionArtifactRoots: { S01: producerArtifactRoot }, cellRoots: [root("c")], workloadArtifactRoots: [root("d")], geometryDesign: "two_geometry_side_confounded_pilot", competitiveClaim: "none" }
    const authorization = { ...value, root: labRoot("factory-calibration-authorization-v2", value) }
    expect(isFactoryProducerAuthorized(authorization, authorization.root, producerArtifactRoot)).toBe(true)
    const changed = { ...value, slotIngestionArtifactRoots: { S01: root("e") } }
    const rerooted = { ...changed, root: labRoot("factory-calibration-authorization-v2", changed) }
    expect(isFactoryProducerAuthorized(rerooted, rerooted.root, producerArtifactRoot)).toBe(false)
  })
  it("rederives every dimension from repository evidence and strips private request/result/event payloads", async () => {
    const { repo, proposal, validation, admission } = admitted(), receipt = await supervision(admission)
    const evidence = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt })
    const derived = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: evidence.evidence, evidenceArtifactRoot: evidence.artifactRoot })
    expect(Object.keys(derived.fingerprints).sort()).toEqual(["chronicleBehaviorRoot", "dependencyRoot", "legalInputDecisionRoot", "lineageRoot", "matchupResponseRoot", "sourceStructureRoot"].sort())
    expect(derived.status).toBe("unresolved")
    expect(derived.quarantined).toBe(true)
    expect(derived.reasons).toContain("calibration_thresholds_not_frozen")
    expect(JSON.stringify(derived)).not.toMatch(/strip-me|strategyMemory|privatePayload|objective/u)
    expect(requireIssuedFactoryIndependenceReceipt(derived)).toBe(derived)
  })

  it("normalizes comments, whitespace and local identifier renames but never promotes a label or borderline evidence", async () => {
    const first = admitted(), firstReceipt = await supervision(first.admission)
    const firstArtifact = evidenceArtifact(first.repo, { proposalRoot: first.proposal.root, validationRoot: first.validation.root, receipt: firstReceipt })
    const a = deriveFactoryFingerprints({ repository: first.repo, supervisionReceipt: firstReceipt, evidence: firstArtifact.evidence, evidenceArtifactRoot: firstArtifact.artifactRoot })

    const rewritten = new TextEncoder().encode("const renamed=(value)=>value.phaseNumber>0?[]:[];\nexport default {selectActivations(value){return {activationOrders:renamed(value),strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}")
    expect(deriveFactorySourceStructureRoot(rewritten)).toBe(a.fingerprints.sourceStructureRoot)
    expect(a.status).not.toBe("independent")
  })

  it("preserves shorthand property keys even when their local value binding is renamed", () => {
    const alpha = new TextEncoder().encode("const alpha = 1; const decision = { alpha };")
    const beta = new TextEncoder().encode("const beta = 1; const decision = { beta };")
    expect(deriveFactorySourceStructureRoot(alpha)).not.toBe(deriveFactorySourceStructureRoot(beta))
    const alphaBinding = new TextEncoder().encode("const { alpha } = input; consume(alpha);")
    const betaBinding = new TextEncoder().encode("const { beta } = input; consume(beta);")
    expect(deriveFactorySourceStructureRoot(alphaBinding)).not.toBe(deriveFactorySourceStructureRoot(betaBinding))
  })

  it("quarantines absent traces, conflicting evidence and caller-supplied dimension mismatches", async () => {
    const { repo, proposal, validation, admission } = admitted(), receipt = await supervision(admission)
    const artifact = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt })
    const mismatch = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot, claimedFingerprints: { ...factoryCandidateFixture(proposal, validation).fingerprints, sourceStructureRoot: root("f") } })
    expect(mismatch.status).toBe("unresolved")
    expect(mismatch.reasons).toContain("claimed_fingerprint_mismatch")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: { ...receipt, traces: [] } as never, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })).toThrow("FACTORY_FINGERPRINT_SUPERVISION_RECEIPT")
    expect(() => createFactoryFingerprintEvidence({ ...artifact.evidence, evidenceClass: "real_producer", producerArtifactRoot: root("1") } as never)).toThrow("FACTORY_FINGERPRINT_CALLER_REAL_PRODUCER")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: { ...artifact.evidence }, evidenceArtifactRoot: artifact.artifactRoot })).toThrow("FACTORY_FINGERPRINT_UNISSUED_EVIDENCE")

    const { root: _evidenceRoot, schemaVersion: _schemaVersion, privacy: _privacy, ...evidenceValue } = artifact.evidence
    const changedResponse = createFactoryFingerprintEvidence({ ...evidenceValue, matchupResponses: artifact.evidence.matchupResponses.map((response) => ({ ...response, conditionRoot: root("1"), responseRoot: root("2") })) })
    const encoded = admitCanonicalJsonValue(changedResponse, { profile: "canonical-manifest" })
    if (!encoded.ok) throw new Error("changed response encoding")
    const changed = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: changedResponse, evidenceArtifactRoot: publishFactoryArtifact(repo, encoded.canonicalBytes) })
    expect(changed.fingerprints.matchupResponseRoot).toBe(mismatch.fingerprints.matchupResponseRoot)
    expect(changed.reasons).toContain("matchup_metadata_unavailable")

    const forgedLineageValue = { schemaVersion: "factory-lineage-manifest-v1", proposalArtifactRoot: admission.artifacts.proposal, nodeArtifactRoots: [admission.artifacts.proposal] }
    const forgedLineage = { ...forgedLineageValue, root: labRoot("factory-lineage-manifest-v1", forgedLineageValue) }
    const forgedEncoded = admitCanonicalJsonValue(forgedLineage, { profile: "canonical-manifest" })
    if (!forgedEncoded.ok) throw new Error("forged lineage encoding")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot, lineageManifestArtifactRoot: publishFactoryArtifact(repo, forgedEncoded.canonicalBytes) })).toThrow("FACTORY_FINGERPRINT_LINEAGE_GRAPH")
  })

  it("derives paired matchup metadata only from the snapshotted issued executions", async () => {
    const { repo, proposal, validation, admission } = admitted()
    const first = await verifiedSupervision(admission, "first"), second = await verifiedSupervision(admission, "second")
    expect(first.matchup.status).toBe("verified")
    expect(second.matchup.status).toBe("verified")
    const artifact = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt: first })
    const single = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: first, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })
    const paired = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: first, pairedSupervisionReceipts: [first, second], evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })
    const compact = [issueFactoryPairedCommitment(first), issueFactoryPairedCommitment(second)]
    const compactPaired = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: first, pairedCommitments: compact, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })
    expect(compactPaired.fingerprints).toEqual(paired.fingerprints)
    expect(compactPaired.root).toBe(paired.root)
    expect("transitions" in compact[0]!.execution).toBe(true)
    expect("execution" in compact[0]!.execution).toBe(false)
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: first, pairedCommitments: [{ ...compact[0]! }, compact[1]!], evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })).toThrow("FACTORY_FINGERPRINT_PAIRED_RECEIPT")
    expect(paired.fingerprints.matchupResponseRoot).not.toBe(single.fingerprints.matchupResponseRoot)
    expect(paired.reasons).not.toContain("paired_counterfactual_unavailable")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: first, pairedSupervisionReceipts: [first, first], evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })).toThrow("FACTORY_FINGERPRINT_PAIRED_RECEIPT_DUPLICATE")
  })

  it("optionally rederives lineage and locked dependencies from closed retained manifests", async () => {
    const repo = repository()
    const toolchainValue = { schemaVersion: "factory-locked-package-manifest-v1", packageId: "toolchain:ts", dependencies: [] }, toolchainEncoded = admitCanonicalJsonValue(toolchainValue, { profile: "canonical-manifest" }); if (!toolchainEncoded.ok) throw new Error("toolchain")
    const toolchainRoot = publishFactoryArtifact(repo, toolchainEncoded.canonicalBytes)
    const buildValue = { schemaVersion: "factory-locked-package-manifest-v1", packageId: "./helper.js", dependencies: ["toolchain:ts"] }, buildEncoded = admitCanonicalJsonValue(buildValue, { profile: "canonical-manifest" }); if (!buildEncoded.ok) throw new Error("build")
    const buildRoot = publishFactoryArtifact(repo, buildEncoded.canonicalBytes)
    const importedSource = new TextEncoder().encode(`import helper from "./helper.js"; ${sourceText}`), importedSourceRoot = `sha256:${createHash("sha256").update(importedSource).digest("hex")}` as LabRoot
    const fixture = factoryOraclePacketFixture()
    const packetValue = { ...fixture, source: { ...fixture.source, root: importedSourceRoot, sha256: importedSourceRoot, byteLength: importedSource.byteLength }, build: { ...fixture.build, buildRoot, toolchainRoot }, lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null } }
    const packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }, proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
    const admission = authorizeFactorySupervision({ sourceAdmission: admitFactory({ packet, proposal, sourceBytes: importedSource, repository: repo }), validation, repository: repo })
    const receipt = await supervision(admission), evidence = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt })
    const anchor = { schemaVersion: "factory-lineage-anchor-v1", root: LAB_ADMITTED_ROOTS.currentStartRoot, parents: [] }
    const anchorBytes = admitCanonicalJsonValue(anchor, { profile: "canonical-manifest" }); if (!anchorBytes.ok) throw new Error("anchor")
    const anchorArtifactRoot = publishFactoryArtifact(repo, anchorBytes.canonicalBytes)
    const lineageValue = { schemaVersion: "factory-lineage-manifest-v1", proposalArtifactRoot: admission.artifacts.proposal, nodeArtifactRoots: [admission.artifacts.proposal, anchorArtifactRoot] }
    const lineage = { ...lineageValue, root: labRoot("factory-lineage-manifest-v1", lineageValue) }, lineageBytes = admitCanonicalJsonValue(lineage, { profile: "canonical-manifest" }); if (!lineageBytes.ok) throw new Error("lineage")
    const dependencyNodes = [
      { specifier: "$source", contentRoot: importedSourceRoot, artifactRoot: admission.artifacts.source, dependencies: [buildRoot] },
      { specifier: "./helper.js", contentRoot: buildRoot, artifactRoot: buildRoot, dependencies: [toolchainRoot] },
      { specifier: "toolchain:ts", contentRoot: toolchainRoot, artifactRoot: toolchainRoot, dependencies: [] },
    ]
    const dependencyValue = { schemaVersion: "factory-locked-dependency-manifest-v1", proposalArtifactRoot: admission.artifacts.proposal, sourceArtifactRoot: admission.artifacts.source, nodes: dependencyNodes }
    const dependency = { ...dependencyValue, root: labRoot("factory-locked-dependency-manifest-v1", dependencyValue) }, dependencyBytes = admitCanonicalJsonValue(dependency, { profile: "canonical-manifest" }); if (!dependencyBytes.ok) throw new Error("dependency")
    const derived = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: evidence.evidence, evidenceArtifactRoot: evidence.artifactRoot, lineageManifestArtifactRoot: publishFactoryArtifact(repo, lineageBytes.canonicalBytes), dependencyManifestArtifactRoot: publishFactoryArtifact(repo, dependencyBytes.canonicalBytes) })
    expect(derived.reasons).not.toContain("lineage_parent_artifacts_unverified")
    expect(derived.reasons).not.toContain("recursive_dependency_manifest_unverified")
    expect(derived.status).toBe("unresolved")
    const repointedValue = { ...dependencyValue, nodes: dependencyNodes.map((node, index) => index === 0 ? { ...node, dependencies: [toolchainRoot] } : node) }
    const repointed = { ...repointedValue, root: labRoot("factory-locked-dependency-manifest-v1", repointedValue) }, repointedBytes = admitCanonicalJsonValue(repointed, { profile: "canonical-manifest" }); if (!repointedBytes.ok) throw new Error("repointed")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidence: evidence.evidence, evidenceArtifactRoot: evidence.artifactRoot, dependencyManifestArtifactRoot: publishFactoryArtifact(repo, repointedBytes.canonicalBytes) })).toThrow("FACTORY_FINGERPRINT_DEPENDENCY_EDGE_MISMATCH")
  })

  it("requires the exact issued derivation receipt before final candidate publication", async () => {
    const { repo, proposal, validation, admission } = admitted(), supervisionReceipt = await supervision(admission)
    const artifact = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, receipt: supervisionReceipt })
    const independenceReceipt = deriveFactoryFingerprints({ repository: repo, supervisionReceipt, evidence: artifact.evidence, evidenceArtifactRoot: artifact.artifactRoot })
    const base = factoryCandidateFixture(proposal, validation, supervisionReceipt.root)
    const candidateValue = { ...base, fingerprints: independenceReceipt.fingerprints }
    const candidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }
    expect(() => finalizeFactoryCandidate({ receipt: supervisionReceipt, independenceReceipt: { ...independenceReceipt }, candidate, repository: repo })).toThrow()
    const finalized = finalizeFactoryCandidate({ receipt: supervisionReceipt, independenceReceipt, candidate, repository: repo })
    expect(finalized.independenceReceiptRoot).toBe(independenceReceipt.root)
    expect(finalized.independenceStatus).toBe("unresolved")
  })
})
