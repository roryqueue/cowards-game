import { createHash } from "node:crypto"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { labRoot, type LabRoot } from "../contracts.js"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFromPacket, factoryValidationFixture } from "../factory/contracts.js"
import { deriveFactoryCandidateRoot, deriveFactoryOraclePacketRoot } from "../factory/identity.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact } from "../factory/repository.js"
import { createFactoryAttemptStart, createFactoryAttemptTerminal } from "../factory/ledger.js"
import { createLeagueCandidateAdmission, createLeagueMixture, createLeaguePopulation, LeagueCandidateAdmissionSchema } from "./contracts.js"
import { deriveLeaguePortfolio, selectRobustPure, countLinkedResponseIterations, type LeagueLinkedResponseIteration } from "./selection.js"
import { importedCandidateFixture } from "./contracts.test.js"

const dirs: string[] = []
const root = (label: string): LabRoot => labRoot("selection-test-root-v2", { label })
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source).digest("hex")}` as LabRoot
const repo = () => { const directory = realpathSync(mkdtempSync(join(tmpdir(), "factory-selection-test-"))); dirs.push(directory); return createFactoryRepository(directory) }
afterEach(() => { for (const directory of dirs.splice(0)) rmSync(directory, { recursive: true, force: true }) })

const candidate = (label: string, correlated = false, producerIdentity: "emitTacticalFactoryPacket" | "emitProfiledTacticalFactoryPacket" = "emitTacticalFactoryPacket") => {
  const repository = repo(), sourceUtf8 = `export default { selectActivations(){ return { activationOrders: [], strategyMemory: {} } }, soldierBrain(){ return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} } } }; // ${label}`, source = sourceRoot(sourceUtf8)
  const fixture = factoryOraclePacketFixture(), packetValue = { ...fixture, source: { ...fixture.source, root: source, sha256: source, byteLength: sourceUtf8.length } }, packet = { ...packetValue, root: deriveFactoryOraclePacketRoot(packetValue) }, proposal = factoryProposalFromPacket(packet), validation = factoryValidationFixture(proposal)
  const original = factoryCandidateFixture(proposal, validation, root(`supervision:${label}`)), candidateValue = { ...original, fingerprints: { sourceStructureRoot: root(`structure:${label}`), lineageRoot: root(`lineage:${label}`), dependencyRoot: root(`dependency:${label}`), legalInputDecisionRoot: root(`legal:${label}`), chronicleBehaviorRoot: root(`behavior:${label}`), matchupResponseRoot: root(`response:${label}`) } }
  const admittedCandidate = { ...candidateValue, root: deriveFactoryCandidateRoot(candidateValue) }
  const start = createFactoryAttemptStart({ taskRoot: root(`task:${label}`), budgetRoot: root(`budget:${label}`), candidateRoot: admittedCandidate.root, authoringMechanism: "automated-oracle", inputRoot: root(`input:${label}`), resourceAccountingRoot: root(`accounting:${label}`), retryParentRoot: null })
  const admission = createLeagueCandidateAdmission({ candidate: admittedCandidate, supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, fingerprintRoot: labRoot("factory-fingerprint-roots-v1", admittedCandidate.fingerprints), lineageRoot: labRoot("factory-lineage-v1", admittedCandidate.lineage), tupleRoot: proposal.build.compatibilityTupleRoot, runtimeRoot: proposal.nativeLane.runtimeProfileRoot, provenanceRoot: root(`provenance:${label}`), attemptStart: start, attemptTerminal: createFactoryAttemptTerminal({ startRoot: start.root, disposition: "accepted", outputRoot: root(`output:${label}`), validationRoot: root(`attempt-validation:${label}`), duplicateEvidenceRoot: root(`duplicate:${label}`), finalEvidenceRoot: root(`final:${label}`) }) })
  LeagueCandidateAdmissionSchema.parse(admission)
  const producerValue = { schemaVersion: "factory-ingestion-v1", privacy: "private_offline", producerIdentity, origin: "tactical-oracle", evidenceClass: "real_producer", packetRoot: packet.root, sourceRoot: source, runtimeProfileRoot: proposal.nativeLane.runtimeProfileRoot, nativeLane: proposal.nativeLane, packet, sourceUtf8, producerInput: {}, modelCompanion: null }
  const producer = { ...producerValue, root: labRoot("factory-ingestion-v1", producerValue) }, producerEncoded = admitCanonicalJsonValue(producer, { profile: "canonical-manifest" }); if (!producerEncoded.ok) throw new Error("producer"); const producerRoot = publishFactoryArtifact(repository, producerEncoded.canonicalBytes)
  const evidenceValue = { schemaVersion: "factory-fingerprint-evidence-v1", privacy: "private_offline", proposalRoot: proposal.root, validationRoot: validation.root, supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, producerIdentity, origin: "tactical-oracle", evidenceClass: "real_producer", producerArtifactRoot: producerRoot, authorshipRoots: [root(`author:${label}`)], lineageNodes: [{ root: root(`lineage-node:${label}`), artifactRoot: root(`lineage-artifact:${label}`), parents: [] }], dependencyNodes: [{ root: root(`dependency-node:${label}`), artifactRoot: root(`dependency-artifact:${label}`), dependencies: [] }], matchupResponses: [{ supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, conditionRoot: root(`condition-one:${label}`), opponentRoot: root(`opponent-one:${label}`), side: "bottom", initialInitiative: true, outcome: "draw", responseRoot: root(`matchup-one:${label}`) }, { supervisionReceiptRoot: admittedCandidate.supervisionReceiptRoot, conditionRoot: root(`condition-two:${label}`), opponentRoot: root(`opponent-two:${label}`), side: "top", initialInitiative: false, outcome: "bottom", responseRoot: root(`matchup-two:${label}`) }], counterfactualPairs: [{ leftRoot: root(`pair-left:${label}`), rightRoot: root(`pair-right:${label}`), relation: correlated ? "correlated" : "distinct" }], failureModes: ["accepted"] }
  const evidence = { ...evidenceValue, root: labRoot("factory-fingerprint-evidence-v1", evidenceValue) }, encoded = admitCanonicalJsonValue(evidence, { profile: "canonical-manifest" }); if (!encoded.ok) throw new Error("evidence")
  return { candidateAdmission: admission, factoryRepository: repository, fingerprintArtifactRoot: publishFactoryArtifact(repository, encoded.canonicalBytes) }
}

const selectionEvidence = (snapshotRoot: LabRoot, populationRoot: LabRoot, solverOutputRoot: LabRoot, candidates: readonly LabRoot[], selected: LabRoot, response = 56, probe = 61, redTeam = 59) => {
  const scores = (score: number, prefix: string) => [{ candidateAdmissionRoot: selected, conditionRoot: root(`${prefix}:one`), numerator: score, denominator: 100, evidenceRoot: root(`${prefix}:evidence-one`) }, { candidateAdmissionRoot: selected, conditionRoot: root(`${prefix}:two`), numerator: score, denominator: 100, evidenceRoot: root(`${prefix}:evidence-two`) }]
  const value = { schemaVersion: "league-selection-evidence-v2" as const, privacy: "private_offline" as const, snapshotRoot, populationRoot, policyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" as LabRoot, solverOutputRoot, responseRows: scores(response, "response"), probeRows: scores(probe, "probe"), redTeamRows: scores(redTeam, "red-team"), invarianceRows: ["side", "initiative", "symmetry", "opaque_ids", "soldier_order", "source_order", "repeat"].map((probeName) => ({ candidateAdmissionRoot: selected, probe: probeName as never, observations: 1, mismatches: 0, evidenceRoot: root(`invariance:${probeName}`) })), terminalRows: ["legality", "privacy", "runtime"].map((boundary) => ({ candidateAdmissionRoot: selected, boundary: boundary as never, disposition: "success" as const, processValidity: "process_valid" as const, evidenceRoot: root(`terminal:${boundary}`) })), worstCases: candidates.flatMap((candidateRoot, index) => candidates.map((opponentAdmissionRoot) => ({ candidateAdmissionRoot: candidateRoot, opponentAdmissionRoot, numerator: candidateRoot === selected ? 3 : index === 1 ? 2 : 1, denominator: 4, evidenceRoot: root(`worst:${candidateRoot}:${opponentAdmissionRoot}`) }))) }
  return { ...value, root: labRoot("league-selection-evidence-v2", value) }
}

describe("source-bound portfolio and robust-pure selection", () => {
  it("keeps profiled tactical responses in S01's family and out of independent family and core counts", async () => {
    const base = await importedCandidateFixture(1)
    const variants = [candidate("profile-a", false, "emitProfiledTacticalFactoryPacket"), candidate("profile-b", false, "emitProfiledTacticalFactoryPacket")]
    const snapshotRoot = root("profile-snapshot"), mixture = createLeagueMixture({ snapshotRoot, solverOutputRoot: root("profile-solver"), weightRoot: root("profile-weights") })
    const entries = [base, ...variants], portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries })
    expect(portfolio.portfolio.candidateAdmissionRoots).toHaveLength(1)
    expect(portfolio.portfolio.candidateAdmissionRoots).toEqual([base.candidateAdmission.root])
    expect(portfolio.rejections).toHaveLength(2)
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: variants })).toThrow("TACTICAL_BASE_MISSING")
    const population = createLeaguePopulation({ candidateAdmissionRoots: entries.map((entry) => entry.candidateAdmission.root).sort(), studyPolicyRoot: root("profile-study"), measurementPolicyRoot: root("profile-policy") })
    const selected = portfolio.portfolio.candidateAdmissionRoots[0]!
    const { root: _root, schemaVersion: _schema, ...baseEvidence } = selectionEvidence(snapshotRoot, population.root, mixture.solverOutputRoot, portfolio.portfolio.candidateAdmissionRoots, selected)
    const body = { ...baseEvidence, schemaVersion: "league-selection-evidence-v5", allocationRoot: root("profile-allocation"), seedBlocks: ["seed"], iterations: [] }
    const outcome = selectRobustPure({ snapshotRoot, populationRoot: population.root, mixture, portfolio: portfolio.portfolio, candidateAdmissionRoot: selected, population, populationCandidates: entries, evidence: { ...body, root: labRoot(body.schemaVersion, body) } })
    const representatives = [base.candidateAdmission.root]
    for (const id of ["behavioral_family_count", "independent_planner_core_count"]) {
      expect(outcome.gateReceiptRoots).toContain(labRoot("league-robust-pure-gate-v2", { id, value: representatives }))
    }
  }, 60000)
  it("keeps assessed S01 ahead of profile variants on both sides of its admission-root order", async () => {
    const base = await importedCandidateFixture(1), baseRoot = base.candidateAdmission.root
    let lower: ReturnType<typeof candidate> | undefined, higher: ReturnType<typeof candidate> | undefined
    for (let ordinal = 0; ordinal < 64 && (!lower || !higher); ordinal++) {
      const variant = candidate(`profile-root-order-${ordinal}`, false, "emitProfiledTacticalFactoryPacket")
      if (variant.candidateAdmission.root < baseRoot) lower ??= variant
      else higher ??= variant
    }
    expect(lower).toBeDefined(); expect(higher).toBeDefined()
    const snapshotRoot = root("profile-root-order-snapshot"), mixture = createLeagueMixture({ snapshotRoot, solverOutputRoot: root("profile-root-order-solver"), weightRoot: root("profile-root-order-weights") })
    for (const entries of [[higher!, base, lower!], [lower!, base, higher!]]) {
      const result = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries })
      expect(result.portfolio.candidateAdmissionRoots).toEqual([baseRoot])
      expect(result.rejections.map((row) => row.candidateAdmissionRoot).sort()).toEqual([lower!.candidateAdmission.root, higher!.candidateAdmission.root].sort())
      expect(result.rejections.every((row) => row.reason === "structural_family_duplicate")).toBe(true)
    }
  }, 60000)
  it("keeps the authentic three-base nine-control population comparison-only while fresh producers grow the inventory", async () => {
    const imported = await Promise.all(Array.from({ length: 12 }, (_, index) => importedCandidateFixture(index + 1)))
    const controls = imported.filter((row) => row.candidateAdmission.importEvidence!.qualification === "control_or_unresolved")
    expect(controls).toHaveLength(9)
    expect(controls.every((row) => row.fingerprint.evidenceClass === "mechanics_only" && row.fingerprint.producerArtifactRoot === null)).toBe(true)
    const retainedBytes = imported.map((row) => readFactoryArtifact(row.factoryRepository, row.fingerprintArtifactRoot))
    const snapshotRoot = root("actual-control-snapshot"), mixture = createLeagueMixture({ snapshotRoot, solverOutputRoot: root("control-solver"), weightRoot: root("control-weights") })
    for (const fresh of [[], Array.from({ length: 9 }, (_, index) => candidate(`fresh-inventory-${index}`))]) {
      const entries = [...imported, ...fresh], portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries }).portfolio, selected = portfolio.candidateAdmissionRoots[0]!
      expect(portfolio.candidateAdmissionRoots).toHaveLength(3 + fresh.length)
      expect(controls.every((row) => !portfolio.candidateAdmissionRoots.includes(row.candidateAdmission.root))).toBe(true)
      const population = createLeaguePopulation({ candidateAdmissionRoots: entries.map((row) => row.candidateAdmission.root).sort(), studyPolicyRoot: root("control-study"), measurementPolicyRoot: root("control-policy") })
      const { root: _root, schemaVersion: _schema, ...base } = selectionEvidence(snapshotRoot, population.root, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected), body = { ...base, schemaVersion: "league-selection-evidence-v5", allocationRoot: root("control-allocation"), seedBlocks: ["seed"], iterations: [] }
      const result = selectRobustPure({ snapshotRoot, populationRoot: population.root, mixture, portfolio, candidateAdmissionRoot: selected, population, populationCandidates: entries, evidence: { ...body, root: labRoot(body.schemaVersion, body) } })
      const real = entries.filter((row) => !row.candidateAdmission.importEvidence || row.candidateAdmission.importEvidence.qualification === "base_distinct").map((row) => row.candidateAdmission.root).sort()
      const countGate = labRoot("league-robust-pure-gate-v2", { id: "league_strategy_count", value: real })
      if (fresh.length) expect(result.gateReceiptRoots).not.toContain(countGate)
      else expect(result.gateReceiptRoots).toContain(countGate)
      expect(real).toHaveLength(3 + fresh.length)
      expect(result.kind).toBe("no_robust_pure_finalist_found")
    }
    expect(imported.map((row) => readFactoryArtifact(row.factoryRepository, row.fingerprintArtifactRoot))).toEqual(retainedBytes)
    const control = controls[0]!, { root: _root, ...fingerprint } = control.fingerprint
    const forged = { ...fingerprint, evidenceClass: "real_producer", producerArtifactRoot: root("forged-control-producer") }
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [{ ...control, fingerprintArtifactRoot: control.put({ ...forged, root: labRoot("factory-fingerprint-evidence-v1", forged) }) }] })).toThrow("IMPORTED_FINGERPRINT_REWRITE")
  }, 60000)
  it("requires distinct consecutive accepted responses linked through the updated pre-response population", () => {
    const allocationRoot = root("linked-allocation"), a = root("response-a"), b = root("response-b"), unrelated = root("unrelated")
    const row = (ordinal: number, candidateAdmissionRoot: LabRoot, targetCandidateAdmissionRoots: LabRoot[]): LeagueLinkedResponseIteration => ({ candidateAdmissionRoot, ordinal, allocationRoot, jobId: `job-${ordinal}`, startRoot: root(`start-${ordinal}`), productionRoot: root(`production-${ordinal}`), reentryRoot: root(`reentry-${ordinal}`), responseTerminals: [{ root: root(`terminal-${ordinal}`), disposition: "success", processValidity: "process_valid" }], blocks: [{ seed: "seed", roundRoot: root(`round-${ordinal}`), targetRoot: root(`target-${ordinal}`), snapshotRoot: root(`snapshot-${ordinal}`), nextSnapshotRoot: root(`snapshot-${ordinal + 1}`), targetCandidateAdmissionRoots, nextCandidateAdmissionRoots: [...targetCandidateAdmissionRoots, candidateAdmissionRoot].sort(), conditionRoots: [root(`condition-${ordinal}`)], terminalRoots: [root(`measurement-${ordinal}`)], numerator: 1, denominator: 1 }] })
    const first = row(0, a, [unrelated]), second = row(1, b, [unrelated, a].sort()), evidence = { allocationRoot, seedBlocks: ["seed"], iterations: [first, second] }
    expect(countLinkedResponseIterations(evidence, b)).toBe(2)
    expect(countLinkedResponseIterations(evidence, unrelated)).toBe(0)
    for (const changed of [{ ...second, ordinal: 2 }, { ...second, startRoot: first.startRoot }, { ...second, productionRoot: first.productionRoot }, { ...second, responseTerminals: first.responseTerminals }, { ...second, blocks: [{ ...second.blocks[0]!, snapshotRoot: root("contemporaneous") }] }, { ...second, blocks: [{ ...second.blocks[0]!, terminalRoots: first.blocks[0]!.terminalRoots }] }, { ...second, blocks: [{ ...second.blocks[0]!, targetCandidateAdmissionRoots: [unrelated] }] }, { ...second, blocks: [{ ...second.blocks[0]!, numerator: 55, denominator: 100 }] }]) expect(countLinkedResponseIterations({ ...evidence, iterations: [first, changed] }, b)).toBeLessThan(2)
  })
  it("does not turn twelve novel labels or fingerprint roots into six behavioral families or five independent cores", () => {
    const entries = Array.from({ length: 12 }, (_, ordinal) => candidate(`inventory-${ordinal}`)), population = createLeaguePopulation({ candidateAdmissionRoots: entries.map((row) => row.candidateAdmission.root).sort(), studyPolicyRoot: root("study"), measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" }), snapshotRoot = root("inventory-snapshot"), mixture = createLeagueMixture({ snapshotRoot, solverOutputRoot: root("inventory-solver"), weightRoot: root("weights") }), portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries }).portfolio, selected = entries[0]!.candidateAdmission.root
    const { root: _root, schemaVersion: _schema, ...base } = selectionEvidence(snapshotRoot, population.root, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected), allocationRoot = root("allocation"), body = { ...base, schemaVersion: "league-selection-evidence-v4", allocationRoot, seedBlocks: ["seed"], iterations: [] }, input = { snapshotRoot, populationRoot: population.root, mixture, portfolio, candidateAdmissionRoot: selected, population, populationCandidates: entries, evidence: { ...body, root: labRoot(body.schemaVersion, body) } }
    const result = selectRobustPure(input)
    expect(result.kind, "league-eval:no-finalist").toBe("no_robust_pure_finalist_found")
    const representative = [entries.map((row) => row.candidateAdmission.root).sort()[0]!]
    expect(result.gateReceiptRoots).toContain(labRoot("league-robust-pure-gate-v2", { id: "behavioral_family_count", value: representative }))
    expect(result.gateReceiptRoots).toContain(labRoot("league-robust-pure-gate-v2", { id: "independent_planner_core_count", value: representative }))
    expect(() => selectRobustPure({ ...input, populationCandidates: entries.slice(1) })).toThrow("INVENTORY_COVERAGE")
  })
  it("counts genuine consecutive iterations, never duplicate blocks or several jobs in one round", () => {
    const snapshotRoot = root("iteration-snapshot"), populationRoot = root("iteration-population"), mixture = createLeagueMixture({ solverOutputRoot: root("iteration-solver"), weightRoot: root("iteration-weights"), snapshotRoot }), entries = [candidate("iteration-one"), candidate("iteration-two"), candidate("iteration-three")], portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries }).portfolio, selected = entries[0]!.candidateAdmission.root, allocationRoot = root("iteration-allocation"), seedBlocks = ["seed-one", "seed-two"]
    const iteration = (ordinal: number) => ({ candidateAdmissionRoot: selected, ordinal, allocationRoot, blocks: seedBlocks.map((seed) => ({ seed, roundRoot: root(`round:${ordinal}:${seed}`), targetRoot: root(`target:${ordinal}:${seed}`), snapshotRoot: root(`snapshot:${ordinal}:${seed}`), conditionRoots: [root(`condition:${ordinal}:${seed}`)], terminalRoots: [root(`terminal:${ordinal}:${seed}`)], numerator: 56, denominator: 100 })), responseTerminals: [0, 1].map((job) => ({ root: root(`response:${ordinal}:${job}`), disposition: "legal_but_weak", processValidity: "process_valid" })) })
    const run = (iterations: ReturnType<typeof iteration>[]) => {
      const { root: _root, schemaVersion: _schema, ...base } = selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected), body = { ...base, schemaVersion: "league-selection-evidence-v3", allocationRoot, seedBlocks, iterations }
      return selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: { ...body, root: labRoot("league-selection-evidence-v3", body) } }).kind
    }
    expect(run([iteration(0), iteration(1)])).toBe("robust_pure_finalist")
    expect(run([iteration(0), iteration(0)])).toBe("no_robust_pure_finalist_found")
    expect(run([iteration(0)])).toBe("no_robust_pure_finalist_found")
    expect(run([iteration(0), iteration(2)])).toBe("no_robust_pure_finalist_found")
    expect(run([iteration(0), { ...iteration(1), blocks: [iteration(1).blocks[0]!, iteration(1).blocks[0]!] }])).toBe("no_robust_pure_finalist_found")
    expect(run([iteration(0), { ...iteration(1), responseTerminals: [{ root: root("failed"), disposition: "system_failure", processValidity: "process_invalid" }] }])).toBe("no_robust_pure_finalist_found")
  })
  it("uses candidate-specific assessed base edges without laundering an affirmative calibration's cosmetic controls", async () => {
    const entries = await Promise.all([1, 3, 5, 2].map(importedCandidateFixture)), snapshotRoot = root("import-snapshot"), mixture = createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot })
    const result = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries })
    expect(result.portfolio.candidateAdmissionRoots, "league-eval:clone-and-novelty").toEqual(entries.slice(0, 3).map((entry) => entry.candidateAdmission.root).sort())
    expect(result.rejections).toMatchObject([{ candidateAdmissionRoot: entries[3]!.candidateAdmission.root, reason: "clone_or_correlation" }])
    const first = entries[0]!
    const { importedAssessment: _assessment, ...withoutAssessment } = first
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [withoutAssessment] })).toThrow("IMPORTED_ASSESSMENT_MISSING")
    const { root: _root, ...body } = first.fingerprint, changed = { ...body, counterfactualPairs: [{ leftRoot: root("stale"), rightRoot: root("other"), relation: "distinct" }] }
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [{ ...first, fingerprintArtifactRoot: first.put({ ...changed, root: labRoot("factory-fingerprint-evidence-v1", changed) }) }] })).toThrow("IMPORTED_FINGERPRINT_REWRITE")
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [{ ...first, importedAssessment: { ...first.importedAssessment, verifyRetainedAssessment: entries[1]!.importedAssessment.verifyRetainedAssessment } }] })).toThrow("IMPORT_ASSESSMENT")
  })
  it("rejects arbitrary roots and independent labels, while only retained source-backed FactoryFingerprintEvidence can create a portfolio", () => {
    const snapshotRoot = root("snapshot"), mixture = createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot })
    expect(() => deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [{ candidateAdmission: { root: root("fake") }, factoryRepository: {} as never, fingerprintArtifactRoot: root("fake-evidence") }] })).toThrow("LEAGUE_")
    const first = candidate("first"), second = candidate("second", true), third = candidate("third")
    const portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: [first, second, third] })
    expect(portfolio.portfolio.candidateAdmissionRoots, "league-eval:mixture-and-portfolio").toEqual([first.candidateAdmission.root, third.candidateAdmission.root].sort())
    expect(portfolio.rejections).toMatchObject([{ candidateAdmissionRoot: second.candidateAdmission.root, reason: "clone_or_correlation" }])
  })

  it("recomputes strict frozen policy boundaries and qualified maximin rather than accepting pass flags or another candidate's proof", () => {
    const snapshotRoot = root("snapshot"), populationRoot = root("population"), mixture = createLeagueMixture({ solverOutputRoot: root("solver"), weightRoot: root("weights"), snapshotRoot })
    const entries = [candidate("one"), candidate("two"), candidate("three")], portfolio = deriveLeaguePortfolio({ snapshotRoot, mixture, candidates: entries }).portfolio, selected = entries[0]!.candidateAdmission.root
    const evidence = selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected)
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence }), "league-eval:robust-pure-pass").toMatchObject({ kind: "robust_pure_finalist", candidateAdmissionRoot: selected })
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected, 55) })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: selectionEvidence(snapshotRoot, populationRoot, mixture.solverOutputRoot, portfolio.candidateAdmissionRoots, selected, 56, 60) })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
    const stale = { ...evidence, responseRows: evidence.responseRows.map((row) => ({ ...row, candidateAdmissionRoot: entries[1]!.candidateAdmission.root })) }; const rerooted = { ...stale, root: labRoot("league-selection-evidence-v2", (() => { const { root: _root, ...body } = stale; return body })()) }
    expect(selectRobustPure({ snapshotRoot, populationRoot, mixture, portfolio, candidateAdmissionRoot: selected, evidence: rerooted })).toMatchObject({ kind: "no_robust_pure_finalist_found" })
  })
})
