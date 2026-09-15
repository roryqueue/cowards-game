import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"

type Rooted = Record<string, unknown> & { root: LabRoot }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const fail = (): never => { throw new TypeError("LEAGUE_IDENTITY") }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const withoutRoot = (value: unknown): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !("root" in value)) return fail()
  const { root: _root, ...rest } = value as Rooted
  return rest
}
const derive = (domain: string, value: unknown): LabRoot => labRoot(domain, withoutRoot(value))
const PAIR_DOMAIN = "league-unordered-pair-v1"

/** Canonicalize entrants by immutable candidate root; UI labels and operational layout are deliberately ignored. */
export const canonicalLeaguePair = (value: unknown): Readonly<{ candidateRoots: readonly [LabRoot, LabRoot] }> => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !Array.isArray((value as Record<string, unknown>).candidateRoots)) fail()
  const roots = (value as { candidateRoots: unknown[] }).candidateRoots
  if (roots.length !== 2 || !roots.every(isRoot) || roots[0] === roots[1]) fail()
  return freezeLabValue({ candidateRoots: [...roots].sort() as [LabRoot, LabRoot] })
}
export const deriveLeagueUnorderedPairRoot = (value: unknown): LabRoot => labRoot(PAIR_DOMAIN, canonicalLeaguePair(value))
export const deriveLeaguePopulationRoot = (value: unknown): LabRoot => derive("league-population-v1", value)
export const deriveLeagueConditionRoot = (value: unknown): LabRoot => derive("league-condition-v1", value)
export const deriveLeagueCellRoot = (value: unknown): LabRoot => derive("league-cell-v1", value)
export const deriveLeagueCellTerminalRoot = (value: unknown): LabRoot => derive("league-cell-terminal-v1", value)
export const deriveLeagueSnapshotRoot = (value: unknown): LabRoot => derive("league-payoff-snapshot-v1", value)
export const deriveLeagueSolverManifestRoot = (value: unknown): LabRoot => derive("league-solver-manifest-v1", value)
export const deriveLeagueSolverOutputRoot = (value: unknown): LabRoot => derive("league-solver-output-v1", value)
export const deriveLeagueRoundRoot = (value: unknown): LabRoot => derive("league-round-v1", value)
export const deriveLeagueTargetRoot = (value: unknown): LabRoot => derive("league-target-v1", value)
export const deriveLeagueResponseAdmissionRoot = (value: unknown): LabRoot => derive("league-response-admission-v1", value)
export const deriveLeagueAllocationRoot = (value: unknown): LabRoot => derive("league-allocation-v1", value)
export const deriveLeagueAttemptRoot = (value: unknown): LabRoot => derive("league-attempt-v1", value)
export const deriveLeagueInvarianceReceiptRoot = (value: unknown): LabRoot => derive("league-invariance-receipt-v1", value)
export const deriveLeagueMixtureRoot = (value: unknown): LabRoot => derive("league-mixture-v1", value)
export const deriveLeaguePortfolioRoot = (value: unknown): LabRoot => derive("league-portfolio-v1", value)
export const deriveRobustPureDispositionRoot = (value: unknown): LabRoot => derive("league-robust-pure-disposition-v1", value)
export const deriveLeagueReportDescriptorRoot = (value: unknown): LabRoot => derive("league-report-descriptor-v1", value)
export const deriveLeagueCandidateAdmissionRoot = (value: unknown): LabRoot => derive("league-candidate-admission-v1", value)
export const deriveLeaguePayoffProjectionRoot = (value: unknown): LabRoot => derive("league-payoff-projection-v1", value)

const derivations: Readonly<Record<string, (value: unknown) => LabRoot>> = Object.freeze({
  "league-candidate-admission-v1": deriveLeagueCandidateAdmissionRoot,
  "league-population-v1": deriveLeaguePopulationRoot,
  "league-cell-v1": deriveLeagueCellRoot,
  "league-cell-terminal-v1": deriveLeagueCellTerminalRoot,
  "league-payoff-projection-v1": deriveLeaguePayoffProjectionRoot,
  "league-payoff-snapshot-v1": deriveLeagueSnapshotRoot,
  "league-solver-manifest-v1": deriveLeagueSolverManifestRoot,
  "league-solver-output-v1": deriveLeagueSolverOutputRoot,
  "league-round-v1": deriveLeagueRoundRoot,
  "league-target-v1": deriveLeagueTargetRoot,
  "league-response-admission-v1": deriveLeagueResponseAdmissionRoot,
  "league-allocation-v1": deriveLeagueAllocationRoot,
  "league-attempt-v1": deriveLeagueAttemptRoot,
  "league-invariance-receipt-v1": deriveLeagueInvarianceReceiptRoot,
  "league-mixture-v1": deriveLeagueMixtureRoot,
  "league-portfolio-v1": deriveLeaguePortfolioRoot,
  "league-robust-pure-disposition-v1": deriveRobustPureDispositionRoot,
  "league-report-descriptor-v1": deriveLeagueReportDescriptorRoot,
})
/** Re-derive a declared league root at every serializable boundary. */
export const validateLeagueRoot = (domain: keyof typeof derivations, value: unknown): LabRoot => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !isRoot((value as Record<string, unknown>).root)) fail()
  const deriveForDomain = derivations[domain]
  if (typeof deriveForDomain !== "function") return fail()
  const actual = deriveForDomain(value)
  if ((value as Rooted).root !== actual) fail()
  return actual
}
