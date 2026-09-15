import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  createLeaguePortfolio,
  LeagueMixtureSchema,
  LeaguePortfolioSchema,
  type LeagueMixture,
  type LeaguePortfolio,
  type RobustPureDisposition,
} from "./contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (code: string): never => { throw new TypeError(`LEAGUE_SELECTION_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => exactLabKeys(value, keys)

export interface LeagueSelectionReceipt {
  readonly schemaVersion: "league-selection-receipt-v1"
  readonly privacy: "private_offline"
  readonly candidateAdmissionRoot: LabRoot
  readonly structuralFamilyRoot: LabRoot
  readonly strategicCoreRoot: LabRoot
  readonly lineageRoot: LabRoot
  readonly dependencyRoot: LabRoot
  readonly legalInputDecisionRoot: LabRoot
  readonly chronicleBehaviorRoot: LabRoot | null
  readonly matchupResponseRoot: LabRoot
  readonly noveltyRoot: LabRoot
  readonly cloneDecision: "accepted" | "clone" | "unresolved"
  readonly independence: "independent" | "correlated" | "unresolved"
  readonly responseEvidence: "complete" | "incomplete"
}

export interface LeaguePortfolioCandidate {
  readonly candidateAdmissionRoot: LabRoot
  readonly receipt: LeagueSelectionReceipt
}

export interface LeaguePortfolioDerivation {
  readonly portfolio: LeaguePortfolio
  readonly rejections: readonly Readonly<{ candidateAdmissionRoot: LabRoot; reason: LeaguePortfolioRejectionReason; receiptRoot: LabRoot }>[]
}

export type LeaguePortfolioRejectionReason =
  | "structural_family_duplicate"
  | "strategic_core_duplicate"
  | "lineage_duplicate"
  | "behavior_duplicate"
  | "response_duplicate"
  | "correlated_candidate"
  | "missing_behavioral_evidence"
  | "clone_decision_incomplete"
  | "clone_rejected"
  | "response_evidence_incomplete"

const receiptRoot = (receipt: LeagueSelectionReceipt): LabRoot => labRoot("league-selection-receipt-v1", receipt)
const admitReceipt = (value: unknown): Readonly<LeagueSelectionReceipt> => {
  const keys = ["schemaVersion", "privacy", "candidateAdmissionRoot", "structuralFamilyRoot", "strategicCoreRoot", "lineageRoot", "dependencyRoot", "legalInputDecisionRoot", "chronicleBehaviorRoot", "matchupResponseRoot", "noveltyRoot", "cloneDecision", "independence", "responseEvidence"]
  if (!exact(value, keys) || value.schemaVersion !== "league-selection-receipt-v1" || value.privacy !== "private_offline" ||
      ![value.candidateAdmissionRoot, value.structuralFamilyRoot, value.strategicCoreRoot, value.lineageRoot, value.dependencyRoot, value.legalInputDecisionRoot, value.matchupResponseRoot, value.noveltyRoot].every(isRoot) ||
      !(value.chronicleBehaviorRoot === null || isRoot(value.chronicleBehaviorRoot)) ||
      !["accepted", "clone", "unresolved"].includes(String(value.cloneDecision)) ||
      !["independent", "correlated", "unresolved"].includes(String(value.independence)) ||
      !["complete", "incomplete"].includes(String(value.responseEvidence))) return fail("RECEIPT")
  return freezeLabValue(value as unknown as LeagueSelectionReceipt)
}

/** A portfolio is a pure-only diversity artifact. Its solver mixture stays diagnostic and is never an entrant. */
export const deriveLeaguePortfolio = (input: { readonly snapshotRoot: LabRoot; readonly mixture: unknown; readonly candidates: readonly LeaguePortfolioCandidate[] }): Readonly<LeaguePortfolioDerivation> => {
  if (!isRoot(input.snapshotRoot) || !Array.isArray(input.candidates) || !input.candidates.length) return fail("PORTFOLIO_INPUT")
  const mixture = LeagueMixtureSchema.parse(input.mixture)
  if (mixture.snapshotRoot !== input.snapshotRoot) return fail("MIXTURE_BINDING")
  const seenCandidates = new Set<LabRoot>(), seenStructuralFamilies = new Set<LabRoot>(), seenCores = new Set<LabRoot>(), seenLineages = new Set<LabRoot>(), seenBehaviors = new Set<LabRoot>(), seenResponses = new Set<LabRoot>()
  const accepted: LabRoot[] = [], receipts: LabRoot[] = [], rejections: LeaguePortfolioDerivation["rejections"][number][] = []
  for (const candidate of [...input.candidates].sort((left, right) => left.candidateAdmissionRoot.localeCompare(right.candidateAdmissionRoot))) {
    if (!candidate || !isRoot(candidate.candidateAdmissionRoot) || seenCandidates.has(candidate.candidateAdmissionRoot)) return fail("CANDIDATE_DUPLICATE")
    seenCandidates.add(candidate.candidateAdmissionRoot)
    const receipt = admitReceipt(candidate.receipt)
    if (receipt.candidateAdmissionRoot !== candidate.candidateAdmissionRoot) return fail("CANDIDATE_BINDING")
    const root = receiptRoot(receipt)
    const reject = (reason: LeaguePortfolioRejectionReason) => rejections.push(freezeLabValue({ candidateAdmissionRoot: candidate.candidateAdmissionRoot, reason, receiptRoot: root }))
    if (receipt.cloneDecision === "unresolved") { reject("clone_decision_incomplete"); continue }
    if (receipt.cloneDecision === "clone") { reject("clone_rejected"); continue }
    if (receipt.independence !== "independent") { reject("correlated_candidate"); continue }
    if (receipt.chronicleBehaviorRoot === null) { reject("missing_behavioral_evidence"); continue }
    if (receipt.responseEvidence !== "complete") { reject("response_evidence_incomplete"); continue }
    if (seenStructuralFamilies.has(receipt.structuralFamilyRoot)) { reject("structural_family_duplicate"); continue }
    if (seenCores.has(receipt.strategicCoreRoot)) { reject("strategic_core_duplicate"); continue }
    if (seenLineages.has(receipt.lineageRoot)) { reject("lineage_duplicate"); continue }
    if (seenBehaviors.has(receipt.chronicleBehaviorRoot)) { reject("behavior_duplicate"); continue }
    if (seenResponses.has(receipt.matchupResponseRoot)) { reject("response_duplicate"); continue }
    seenStructuralFamilies.add(receipt.structuralFamilyRoot); seenCores.add(receipt.strategicCoreRoot); seenLineages.add(receipt.lineageRoot); seenBehaviors.add(receipt.chronicleBehaviorRoot); seenResponses.add(receipt.matchupResponseRoot)
    accepted.push(candidate.candidateAdmissionRoot); receipts.push(root)
  }
  if (!accepted.length) return fail("NO_DIVERSE_PURE")
  const diversityReceiptRoot = labRoot("league-portfolio-diversity-v1", { snapshotRoot: input.snapshotRoot, mixtureRoot: mixture.root, accepted, receipts, rejections })
  return freezeLabValue({ portfolio: createLeaguePortfolio({ candidateAdmissionRoots: accepted, diversityReceiptRoot, mixtureRoot: mixture.root }), rejections }) as LeaguePortfolioDerivation
}

export type RobustPureGateId =
  | "distinct_finalist_count" | "consecutive_response_count" | "response_set_score" | "independent_probe_set_score" | "fresh_red_team_set_score"
  | "maximin_oracle_relative_pure" | "mixture_performance" | "strongest_pure_targets" | "accepted_counters" | "invariance" | "legality" | "privacy" | "runtime" | "diversity"
export interface RobustPureGateEvidence { readonly gateId: RobustPureGateId; readonly status: "passed" | "failed"; readonly proofRoot: LabRoot }
const HARD_GATES: readonly RobustPureGateId[] = ["distinct_finalist_count", "consecutive_response_count", "response_set_score", "independent_probe_set_score", "fresh_red_team_set_score", "maximin_oracle_relative_pure", "mixture_performance", "strongest_pure_targets", "accepted_counters", "invariance", "legality", "privacy", "runtime", "diversity"]

/** This reducer deliberately evaluates proof dispositions, never a numeric score or a mixture weight. */
export const selectRobustPure = (input: { readonly snapshotRoot: LabRoot; readonly mixture: unknown; readonly portfolio: unknown; readonly candidateAdmissionRoot: LabRoot; readonly gateEvidence: readonly RobustPureGateEvidence[] }): Readonly<RobustPureDisposition> => {
  if (!isRoot(input.snapshotRoot) || !isRoot(input.candidateAdmissionRoot) || !Array.isArray(input.gateEvidence)) return fail("FINALIST_INPUT")
  const mixture = LeagueMixtureSchema.parse(input.mixture), portfolio = LeaguePortfolioSchema.parse(input.portfolio)
  if (mixture.snapshotRoot !== input.snapshotRoot || portfolio.mixtureRoot !== mixture.root || !portfolio.candidateAdmissionRoots.includes(input.candidateAdmissionRoot)) return fail("FINALIST_BINDING")
  const gates = new Map<RobustPureGateId, RobustPureGateEvidence>()
  for (const gate of input.gateEvidence) {
    if (!gate || !HARD_GATES.includes(gate.gateId) || !["passed", "failed"].includes(String(gate.status)) || !isRoot(gate.proofRoot) || gates.has(gate.gateId)) return fail("GATE_EVIDENCE")
    gates.set(gate.gateId, freezeLabValue({ ...gate }) as RobustPureGateEvidence)
  }
  if (gates.size !== HARD_GATES.length || HARD_GATES.some((id) => !gates.has(id))) return fail("HARD_GATES")
  const failed = HARD_GATES.filter((id) => gates.get(id)!.status === "failed").map((id) => gates.get(id)!.proofRoot)
  const value = failed.length
    ? { schemaVersion: "league-robust-pure-disposition-v1" as const, privacy: "private_offline" as const, portfolioRoot: portfolio.root, kind: "no_robust_pure_finalist_found" as const, candidateAdmissionRoot: null, gateReceiptRoots: failed }
    : { schemaVersion: "league-robust-pure-disposition-v1" as const, privacy: "private_offline" as const, portfolioRoot: portfolio.root, kind: "robust_pure_finalist" as const, candidateAdmissionRoot: input.candidateAdmissionRoot, gateReceiptRoots: HARD_GATES.map((id) => gates.get(id)!.proofRoot) }
  return freezeLabValue({ ...value, root: labRoot("league-robust-pure-disposition-v1", value) }) as RobustPureDisposition
}
