import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes } from "@cowards/spec"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../factory/repository.js"
import { createLeaguePortfolio, importAssessedFactoryCandidate, LeagueCandidateAdmissionSchema, LeagueMixtureSchema, LeaguePortfolioSchema, type LeagueCandidateAdmission, type LeaguePortfolio, type RobustPureDisposition } from "./contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const FROZEN_POLICY_ROOT = "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95" as LabRoot
const fail = (code: string): never => { throw new TypeError(`LEAGUE_SELECTION_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => exactLabKeys(value, keys)
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot

export interface LeaguePortfolioCandidate {
  readonly candidateAdmission: unknown
  readonly factoryRepository: FactoryRepository
  readonly fingerprintArtifactRoot: LabRoot
  readonly importedAssessment?: Pick<Parameters<typeof importAssessedFactoryCandidate>[0], "maxBytes" | "maxRecords" | "verifyRetainedAssessment">
}
interface BoundCandidate { readonly admission: LeagueCandidateAdmission; readonly familyRoot: LabRoot; readonly coreRoot: LabRoot; readonly cloneRoot: LabRoot; readonly correlationFree: boolean }
type PortfolioReason = "factory_evidence_incomplete" | "clone_or_correlation" | "structural_family_duplicate" | "strategic_core_duplicate" | "lineage_duplicate" | "behavior_duplicate" | "response_duplicate"
export interface LeaguePortfolioDerivation { readonly portfolio: LeaguePortfolio; readonly rejections: readonly Readonly<{ candidateAdmissionRoot: LabRoot; reason: PortfolioReason; receiptRoot: LabRoot }>[] }

/** Re-admit actual retained FactoryFingerprintEvidence bytes and bind it to its immutable league admission. */
const admitBoundCandidate = (value: LeaguePortfolioCandidate): Readonly<BoundCandidate> => {
  if (!value?.factoryRepository || !isRoot(value.fingerprintArtifactRoot)) return fail("CANDIDATE_INPUT")
  const admission = LeagueCandidateAdmissionSchema.parse(value.candidateAdmission)
  let importedQualification: "base_distinct" | "control_or_unresolved" | undefined
  if (admission.importEvidence) {
    if (!value.importedAssessment) return fail("IMPORTED_ASSESSMENT_MISSING")
    const imported = importAssessedFactoryCandidate({ repository: value.factoryRepository, ...admission.importEvidence, ...value.importedAssessment, attemptStart: admission.attemptStart, attemptTerminal: admission.attemptTerminal })
    if (imported.root !== admission.root) return fail("IMPORTED_ASSESSMENT_BINDING")
    importedQualification = imported.importEvidence!.qualification
  }
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(value.factoryRepository, value.fingerprintArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "privacy", "root", "proposalRoot", "validationRoot", "supervisionReceiptRoot", "producerIdentity", "origin", "evidenceClass", "producerArtifactRoot", "authorshipRoots", "lineageNodes", "dependencyNodes", "matchupResponses", "counterfactualPairs", "failureModes"])) return fail("FINGERPRINT_BYTES")
  const evidence = parsed.value, { root, ...evidenceValue } = evidence
  if (admission.importEvidence) {
    const publication = admitCanonicalJsonBytes(readFactoryArtifact(value.factoryRepository, admission.importEvidence.publicationArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    const independence = publication.ok ? (publication.value as { independenceReceipt?: { evidenceRoot?: unknown; evidenceArtifactRoot?: unknown } }).independenceReceipt : undefined
    if (!independence || independence.evidenceRoot !== root || independence.evidenceArtifactRoot !== value.fingerprintArtifactRoot) return fail("IMPORTED_FINGERPRINT_REWRITE")
  }
  if (evidence.schemaVersion !== "factory-fingerprint-evidence-v1" || evidence.privacy !== "private_offline" || !isRoot(root) || root !== labRoot("factory-fingerprint-evidence-v1", evidenceValue) || evidence.proposalRoot !== admission.candidate.proposal.root || evidence.validationRoot !== admission.candidate.validation.root || evidence.supervisionReceiptRoot !== admission.supervisionReceiptRoot || evidence.evidenceClass !== "real_producer" || !isRoot(evidence.producerArtifactRoot) || !Array.isArray(evidence.lineageNodes) || !Array.isArray(evidence.dependencyNodes) || !Array.isArray(evidence.matchupResponses) || !Array.isArray(evidence.counterfactualPairs) || !Array.isArray(evidence.failureModes) || !evidence.lineageNodes.length || !evidence.dependencyNodes.length || evidence.matchupResponses.length < (importedQualification ? 1 : 2) || !evidence.counterfactualPairs.length || !evidence.failureModes.includes("accepted")) return fail("FINGERPRINT_BINDING")
  const producerParsed = admitCanonicalJsonBytes(readFactoryArtifact(value.factoryRepository, evidence.producerArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!producerParsed.ok || !exact(producerParsed.value, ["schemaVersion", "privacy", "root", "producerIdentity", "origin", "evidenceClass", "packetRoot", "sourceRoot", "runtimeProfileRoot", "nativeLane", "packet", "sourceUtf8", "producerInput", "modelCompanion"])) return fail("PRODUCER_BYTES")
  const producer = producerParsed.value, { root: producerRoot, ...producerValue } = producer
  if (producer.schemaVersion !== "factory-ingestion-v1" || producer.privacy !== "private_offline" || producerRoot !== labRoot("factory-ingestion-v1", producerValue) || producer.evidenceClass !== "real_producer" || producer.producerIdentity !== evidence.producerIdentity || producer.origin !== evidence.origin || producer.sourceRoot !== admission.candidate.proposal.source.root || typeof producer.sourceUtf8 !== "string" || byteRoot(new TextEncoder().encode(producer.sourceUtf8)) !== producer.sourceRoot) return fail("PRODUCER_BINDING")
  const pairs = evidence.counterfactualPairs as readonly Readonly<{ relation?: unknown }>[]
  if (pairs.some((pair) => !pair || !["distinct", "correlated", "borderline"].includes(String(pair.relation))) || (evidence.matchupResponses as readonly Readonly<{ outcome?: unknown }>[]).some((row) => !row || row.outcome === "failure")) return fail("FINGERPRINT_INCOMPLETE")
  const fingerprints = admission.candidate.fingerprints
  return freezeLabValue({
    admission,
    familyRoot: labRoot("league-structural-family-v1", { doctrineFamily: admission.candidate.proposal.doctrineFamily, sourceStructureRoot: fingerprints.sourceStructureRoot }),
    coreRoot: labRoot("league-strategic-core-v1", { sourceStructureRoot: fingerprints.sourceStructureRoot, dependencyRoot: fingerprints.dependencyRoot, legalInputDecisionRoot: fingerprints.legalInputDecisionRoot }),
    cloneRoot: labRoot("league-clone-decision-v1", { evidenceRoot: root, counterfactualPairs: pairs, ...(admission.importEvidence ? { assessmentRoot: admission.importEvidence.assessmentRoot, sourceSlot: admission.importEvidence.sourceSlot, qualification: importedQualification } : {}) }),
    correlationFree: importedQualification ? importedQualification === "base_distinct" : pairs.every((pair) => pair.relation === "distinct"),
  }) as BoundCandidate
}

/** A diagnostic mixture stays separate; portfolios contain only re-admitted, source-backed pure candidates. */
export const deriveLeaguePortfolio = (input: { readonly snapshotRoot: LabRoot; readonly mixture: unknown; readonly candidates: readonly LeaguePortfolioCandidate[] }): Readonly<LeaguePortfolioDerivation> => {
  if (!isRoot(input.snapshotRoot) || !Array.isArray(input.candidates) || !input.candidates.length) return fail("PORTFOLIO_INPUT")
  const mixture = LeagueMixtureSchema.parse(input.mixture)
  if (mixture.snapshotRoot !== input.snapshotRoot) return fail("MIXTURE_BINDING")
  const bound = input.candidates.map(admitBoundCandidate).sort((left, right) => left.admission.root.localeCompare(right.admission.root))
  if (new Set(bound.map((entry) => entry.admission.root)).size !== bound.length) return fail("CANDIDATE_DUPLICATE")
  const family = new Set<LabRoot>(), core = new Set<LabRoot>(), lineage = new Set<LabRoot>(), behavior = new Set<LabRoot>(), response = new Set<LabRoot>(), accepted: LabRoot[] = [], receipts: LabRoot[] = [], rejections: LeaguePortfolioDerivation["rejections"][number][] = []
  for (const entry of bound) {
    const fingerprints = entry.admission.candidate.fingerprints, root = entry.admission.root
    const reject = (reason: PortfolioReason) => rejections.push(freezeLabValue({ candidateAdmissionRoot: root, reason, receiptRoot: entry.cloneRoot }))
    if (!entry.correlationFree) { reject("clone_or_correlation"); continue }
    if (family.has(entry.familyRoot)) { reject("structural_family_duplicate"); continue }
    if (core.has(entry.coreRoot)) { reject("strategic_core_duplicate"); continue }
    if (lineage.has(fingerprints.lineageRoot)) { reject("lineage_duplicate"); continue }
    if (behavior.has(fingerprints.chronicleBehaviorRoot)) { reject("behavior_duplicate"); continue }
    if (response.has(fingerprints.matchupResponseRoot)) { reject("response_duplicate"); continue }
    family.add(entry.familyRoot); core.add(entry.coreRoot); lineage.add(fingerprints.lineageRoot); behavior.add(fingerprints.chronicleBehaviorRoot); response.add(fingerprints.matchupResponseRoot); accepted.push(root); receipts.push(entry.cloneRoot)
  }
  if (!accepted.length) return fail("NO_DIVERSE_PURE")
  return freezeLabValue({ portfolio: createLeaguePortfolio({ candidateAdmissionRoots: accepted, diversityReceiptRoot: labRoot("league-portfolio-diversity-v2", { snapshotRoot: input.snapshotRoot, mixtureRoot: mixture.root, candidateAdmissionRoots: accepted, receipts, rejections }), mixtureRoot: mixture.root }), rejections }) as LeaguePortfolioDerivation
}

type ScoreRow = Readonly<{ candidateAdmissionRoot: LabRoot; conditionRoot: LabRoot; numerator: number; denominator: number; evidenceRoot: LabRoot }>
interface SelectionEvidence {
  readonly schemaVersion: "league-selection-evidence-v2"; readonly privacy: "private_offline"; readonly root: LabRoot; readonly snapshotRoot: LabRoot; readonly populationRoot: LabRoot; readonly policyRoot: LabRoot; readonly solverOutputRoot: LabRoot
  readonly responseRows: readonly ScoreRow[]; readonly probeRows: readonly ScoreRow[]; readonly redTeamRows: readonly ScoreRow[]
  readonly invarianceRows: readonly Readonly<{ candidateAdmissionRoot: LabRoot; probe: "side" | "initiative" | "symmetry" | "opaque_ids" | "soldier_order" | "source_order" | "repeat"; observations: number; mismatches: number; evidenceRoot: LabRoot }>[]
  readonly terminalRows: readonly Readonly<{ candidateAdmissionRoot: LabRoot; boundary: "legality" | "privacy" | "runtime"; disposition: "success" | "player_violation" | "system_failure"; processValidity: "process_valid" | "process_invalid"; evidenceRoot: LabRoot }>[]
  readonly worstCases: readonly Readonly<{ candidateAdmissionRoot: LabRoot; opponentAdmissionRoot: LabRoot; numerator: number; denominator: number; evidenceRoot: LabRoot }>[]
}
const positive = (numerator: unknown, denominator: unknown): numerator is number => Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator) && (numerator as number) >= 0 && (denominator as number) > 0 && (numerator as number) <= (denominator as number)
const scorePasses = (row: ScoreRow, comparator: "gt55" | "gt60" | "lt60") => comparator === "gt55" ? row.numerator * 100 > row.denominator * 55 : comparator === "gt60" ? row.numerator * 100 > row.denominator * 60 : row.numerator * 100 < row.denominator * 60
const gateRoot = (id: string, value: unknown) => labRoot("league-robust-pure-gate-v2", { id, value })
const issuedDispositions = new WeakSet<object>()
/** A report may consume only a disposition emitted by this re-admitting reducer, never a caller-constructed root. */
export const requireIssuedRobustPureDisposition = (value: unknown): Readonly<RobustPureDisposition> => {
  const disposition = value as RobustPureDisposition
  if (!disposition || !issuedDispositions.has(disposition)) return fail("UNISSUED_DISPOSITION")
  return disposition
}

/** Recompute frozen .55/.60 comparisons and complete oracle-relative maximin from raw evidence rows, never pass flags. */
export const selectRobustPure = (input: { readonly snapshotRoot: LabRoot; readonly populationRoot: LabRoot; readonly mixture: unknown; readonly portfolio: unknown; readonly candidateAdmissionRoot: LabRoot; readonly evidence: unknown }): Readonly<RobustPureDisposition> => {
  const mixture = LeagueMixtureSchema.parse(input.mixture), portfolio = LeaguePortfolioSchema.parse(input.portfolio)
  if (!isRoot(input.snapshotRoot) || !isRoot(input.populationRoot) || !isRoot(input.candidateAdmissionRoot) || mixture.snapshotRoot !== input.snapshotRoot || portfolio.mixtureRoot !== mixture.root || !portfolio.candidateAdmissionRoots.includes(input.candidateAdmissionRoot)) return fail("FINALIST_BINDING")
  if (!exact(input.evidence, ["schemaVersion", "privacy", "root", "snapshotRoot", "populationRoot", "policyRoot", "solverOutputRoot", "responseRows", "probeRows", "redTeamRows", "invarianceRows", "terminalRows", "worstCases"])) return fail("EVIDENCE")
  const evidence = input.evidence as unknown as SelectionEvidence, { root, ...body } = evidence
  if (evidence.schemaVersion !== "league-selection-evidence-v2" || evidence.privacy !== "private_offline" || root !== labRoot("league-selection-evidence-v2", body) || evidence.snapshotRoot !== input.snapshotRoot || evidence.populationRoot !== input.populationRoot || evidence.policyRoot !== FROZEN_POLICY_ROOT || evidence.solverOutputRoot !== mixture.solverOutputRoot || ![evidence.responseRows, evidence.probeRows, evidence.redTeamRows, evidence.invarianceRows, evidence.terminalRows, evidence.worstCases].every(Array.isArray)) return fail("EVIDENCE_BINDING")
  const rows = [...evidence.responseRows, ...evidence.probeRows, ...evidence.redTeamRows]
  if (rows.some((row) => !row || !isRoot(row.candidateAdmissionRoot) || !isRoot(row.conditionRoot) || !isRoot(row.evidenceRoot) || !positive(row.numerator, row.denominator)) || evidence.worstCases.some((row) => !row || !isRoot(row.candidateAdmissionRoot) || !isRoot(row.opponentAdmissionRoot) || !isRoot(row.evidenceRoot) || !positive(row.numerator, row.denominator))) return fail("EVIDENCE_ROWS")
  const only = (rowsFor: readonly ScoreRow[]) => rowsFor.filter((row) => row.candidateAdmissionRoot === input.candidateAdmissionRoot)
  const response = only(evidence.responseRows), probe = only(evidence.probeRows), redTeam = only(evidence.redTeamRows), population = portfolio.candidateAdmissionRoots
  const completeWorst = (candidate: LabRoot) => population.every((opponent) => evidence.worstCases.some((row) => row.candidateAdmissionRoot === candidate && row.opponentAdmissionRoot === opponent))
  const min = (candidate: LabRoot) => evidence.worstCases.filter((row) => row.candidateAdmissionRoot === candidate).reduce<readonly [number, number] | null>((previous, row) => !previous || row.numerator * previous[1] < previous[0] * row.denominator ? [row.numerator, row.denominator] : previous, null)
  const selectedMin = completeWorst(input.candidateAdmissionRoot) ? min(input.candidateAdmissionRoot) : null
  const maximin = selectedMin !== null && population.every((candidate) => { const other = completeWorst(candidate) ? min(candidate) : null; return other !== null && selectedMin[0] * other[1] >= other[0] * selectedMin[1] })
  const probes = ["side", "initiative", "symmetry", "opaque_ids", "soldier_order", "source_order", "repeat"] as const
  const invariant = probes.every((probeName) => evidence.invarianceRows.some((row) => row.candidateAdmissionRoot === input.candidateAdmissionRoot && row.probe === probeName && Number.isSafeInteger(row.observations) && row.observations > 0 && row.mismatches === 0 && isRoot(row.evidenceRoot)))
  const boundary = (name: "legality" | "privacy" | "runtime") => evidence.terminalRows.some((row) => row.candidateAdmissionRoot === input.candidateAdmissionRoot && row.boundary === name && row.disposition === "success" && row.processValidity === "process_valid" && isRoot(row.evidenceRoot))
  const gates = [
    ["distinct_finalist_count", population.length >= 3, population], ["consecutive_response_count", response.length >= 2 && response.every((row) => scorePasses(row, "gt55")), response], ["response_set_score", response.length > 0 && response.every((row) => scorePasses(row, "gt55")), response],
    ["independent_probe_set_score", probe.length > 0 && probe.every((row) => scorePasses(row, "gt60")), probe], ["fresh_red_team_set_score", redTeam.length > 0 && redTeam.every((row) => scorePasses(row, "lt60")), redTeam], ["maximin_oracle_relative_pure", maximin, evidence.worstCases.filter((row) => row.candidateAdmissionRoot === input.candidateAdmissionRoot)],
    ["invariance", invariant, evidence.invarianceRows], ["legality", boundary("legality"), evidence.terminalRows], ["privacy", boundary("privacy"), evidence.terminalRows], ["runtime", boundary("runtime"), evidence.terminalRows],
  ] as const
  const failed = gates.filter(([, passed]) => !passed).map(([id, , payload]) => gateRoot(id, payload))
  const value = failed.length ? { schemaVersion: "league-robust-pure-disposition-v1" as const, privacy: "private_offline" as const, portfolioRoot: portfolio.root, kind: "no_robust_pure_finalist_found" as const, candidateAdmissionRoot: null, gateReceiptRoots: failed } : { schemaVersion: "league-robust-pure-disposition-v1" as const, privacy: "private_offline" as const, portfolioRoot: portfolio.root, kind: "robust_pure_finalist" as const, candidateAdmissionRoot: input.candidateAdmissionRoot, gateReceiptRoots: gates.map(([id, , payload]) => gateRoot(id, payload)) }
  const disposition = freezeLabValue({ ...value, root: labRoot("league-robust-pure-disposition-v1", value) }) as RobustPureDisposition
  issuedDispositions.add(disposition)
  return disposition
}
