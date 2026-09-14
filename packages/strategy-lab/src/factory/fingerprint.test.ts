import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../contracts.js"
import { admitFactory, authorizeFactorySupervision, finalizeFactoryCandidate, superviseFactory, type FactoryAdmission, type FactorySupervisionProvider } from "./admission.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "./contracts.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot } from "./identity.js"
import { createFactoryRepository, publishFactoryArtifact } from "./repository.js"
import { createFactoryFingerprintEvidence, deriveFactoryFingerprints, deriveFactorySourceStructureRoot, requireIssuedFactoryIndependenceReceipt } from "./fingerprint.js"

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
const providerFor = (admission: FactoryAdmission): FactorySupervisionProvider => {
  const identity = {
    revisionId: "candidate", sourceRoot: admission.sourceRoot, executableRoot: sourceRoot, tupleId: "tuple", tupleRoot: root("1"),
    image: "image", harnessRoot: root("2"), budgetRoot: root("3"), attemptRoot: root("4"), runtimeLimitsRoot: admission.nativeLane.runtimeProfileRoot,
    nativeLane: admission.nativeLane, factoryPacketRoot: admission.packetRoot, factoryProposalRoot: admission.proposalRoot, factoryValidationRoot: admission.validationRoot,
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
const supervision = async (admission: FactoryAdmission) => superviseFactory(admission, "candidate", {
  match: { bottomPlayerId: "candidate", topPlayerId: "opponent" } as never,
  providers: { candidate: providerFor(admission) },
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
      events: [{ type: "ROUND_STARTED", sequence: 1, payload: { roundNumber: 1 }, privatePayload: { objective: "strip-me" } }],
      beforeState: { phaseNumber: 1 }, afterState: { phaseNumber: 1 }, beforeStateHash: root("6"), afterStateHash: root("7"),
      beforeMachineHash: root("8"), afterMachineHash: root("9"), terminalStatus: null, failureStatus: null,
    }],
    accounting: [evidence],
  } as never
})
const evidenceArtifact = (repo: ReturnType<typeof repository>, values: { proposalRoot: LabRoot; validationRoot: LabRoot; supervisionReceiptRoot: LabRoot }) => {
  const record = createFactoryFingerprintEvidence({
    ...values,
    producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer",
    authorshipRoots: [root("a")],
    lineageNodes: [{ root: values.proposalRoot, parents: [root("b")] }, { root: root("b"), parents: [] }],
    dependencyNodes: [{ root: root("c"), dependencies: [root("d")] }, { root: root("d"), dependencies: [] }],
    matchupResponses: [{ conditionRoot: root("e"), opponentRoot: root("f"), side: "bottom", initialInitiative: true, outcome: "draw", responseRoot: root("a") }],
    counterfactualPairs: [{ leftRoot: root("b"), rightRoot: root("c"), relation: "borderline" }],
    failureModes: ["accepted"],
  })
  const encoded = admitCanonicalJsonValue(record, { profile: "canonical-manifest" })
  if (!encoded.ok) throw new Error("test evidence encoding")
  return publishFactoryArtifact(repo, encoded.canonicalBytes)
}

describe("six derived factory fingerprints", () => {
  it("rederives every dimension from repository evidence and strips private request/result/event payloads", async () => {
    const { repo, proposal, validation, admission } = admitted(), receipt = await supervision(admission)
    const artifactRoot = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: receipt.root })
    const derived = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidenceArtifactRoot: artifactRoot })
    expect(Object.keys(derived.fingerprints).sort()).toEqual(["chronicleBehaviorRoot", "dependencyRoot", "legalInputDecisionRoot", "lineageRoot", "matchupResponseRoot", "sourceStructureRoot"].sort())
    expect(derived.status).toBe("unresolved")
    expect(derived.quarantined).toBe(true)
    expect(derived.reasons).toContain("calibration_thresholds_not_frozen")
    expect(JSON.stringify(derived)).not.toMatch(/strip-me|strategyMemory|privatePayload|objective/u)
    expect(requireIssuedFactoryIndependenceReceipt(derived)).toBe(derived)
  })

  it("normalizes comments, whitespace and local identifier renames but never promotes a label or borderline evidence", async () => {
    const first = admitted(), firstReceipt = await supervision(first.admission)
    const firstArtifact = evidenceArtifact(first.repo, { proposalRoot: first.proposal.root, validationRoot: first.validation.root, supervisionReceiptRoot: firstReceipt.root })
    const a = deriveFactoryFingerprints({ repository: first.repo, supervisionReceipt: firstReceipt, evidenceArtifactRoot: firstArtifact })

    const rewritten = new TextEncoder().encode("const renamed=(value)=>value.phaseNumber>0?[]:[];\nexport default {selectActivations(value){return {activationOrders:renamed(value),strategyMemory:{}}},soldierBrain(){return {action:{type:'TURN_TO_STONE'},soldierMemory:{}}}}")
    expect(deriveFactorySourceStructureRoot(rewritten)).toBe(a.fingerprints.sourceStructureRoot)
    expect(a.status).not.toBe("independent")
  })

  it("quarantines absent traces, conflicting evidence and caller-supplied dimension mismatches", async () => {
    const { repo, proposal, validation, admission } = admitted(), receipt = await supervision(admission)
    const artifactRoot = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: receipt.root })
    const mismatch = deriveFactoryFingerprints({ repository: repo, supervisionReceipt: receipt, evidenceArtifactRoot: artifactRoot, claimedFingerprints: { ...factoryCandidateFixture(proposal, validation).fingerprints, sourceStructureRoot: root("f") } })
    expect(mismatch.status).toBe("unresolved")
    expect(mismatch.reasons).toContain("claimed_fingerprint_mismatch")
    expect(() => deriveFactoryFingerprints({ repository: repo, supervisionReceipt: { ...receipt, traces: [] } as never, evidenceArtifactRoot: artifactRoot })).toThrow("FACTORY_FINGERPRINT_SUPERVISION_RECEIPT")
  })

  it("requires the exact issued derivation receipt before final candidate publication", async () => {
    const { repo, proposal, validation, admission } = admitted(), supervisionReceipt = await supervision(admission)
    const artifactRoot = evidenceArtifact(repo, { proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: supervisionReceipt.root })
    const independenceReceipt = deriveFactoryFingerprints({ repository: repo, supervisionReceipt, evidenceArtifactRoot: artifactRoot })
    const base = factoryCandidateFixture(proposal, validation, supervisionReceipt.root)
    const candidateValue = { ...base, fingerprints: independenceReceipt.fingerprints }
    const candidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }
    expect(() => finalizeFactoryCandidate({ receipt: supervisionReceipt, independenceReceipt: { ...independenceReceipt }, candidate, repository: repo })).toThrow()
    const finalized = finalizeFactoryCandidate({ receipt: supervisionReceipt, independenceReceipt, candidate, repository: repo })
    expect(finalized.independenceReceiptRoot).toBe(independenceReceipt.root)
    expect(finalized.independenceStatus).toBe("unresolved")
  })
})
