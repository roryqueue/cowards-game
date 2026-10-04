import { labRoot, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { runExactRestrictedGameCandidate } from "../../packages/strategy-lab/src/league/solver.js"
export interface LeanMeasuredPair {
  readonly ordinal: number
  readonly bottomSourceRoot: LabRoot
  readonly topSourceRoot: LabRoot
  readonly outcome: "bottom" | "top" | "DRAW"
  readonly executionRoot: LabRoot
  readonly semanticRoot: LabRoot
}
const fail = (): never => { throw new TypeError("LEAN_BASELINE_ANALYSIS") }
const root = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
export const analyseLeanDistinctPairs = (sources: readonly LabRoot[], cells: readonly LeanMeasuredPair[]) => {
  if (sources.length < 2 || sources.length > 3 || new Set(sources).size !== sources.length || !sources.every(root)) return fail()
  const ordered = [...sources].sort()
  const expected = 4 * ordered.length * (ordered.length - 1) / 2
  if (cells.length !== expected || new Set(cells.map(c => c.ordinal)).size !== expected || new Set(cells.map(c => c.executionRoot)).size !== expected || cells.some(c => !Number.isSafeInteger(c.ordinal) || !["bottom", "top", "DRAW"].includes(c.outcome) || !root(c.semanticRoot) || !root(c.executionRoot) || !ordered.includes(c.bottomSourceRoot) || !ordered.includes(c.topSourceRoot) || c.bottomSourceRoot === c.topSourceRoot)) return fail()
  const payoff = ordered.map(() => ordered.map(() => 0))
  const means = ordered.map(() => ordered.map(() => 1))
  const pairDenominators: Array<{ left: LabRoot; right: LabRoot; matches: 4 }> = []
  for (let left = 0; left < ordered.length; left++) for (let right = left + 1; right < ordered.length; right++) {
    const pair = cells.filter(c => [c.bottomSourceRoot, c.topSourceRoot].includes(ordered[left]!) && [c.bottomSourceRoot, c.topSourceRoot].includes(ordered[right]!))
    if (pair.length !== 4) return fail()
    const points = pair.reduce((sum, c) => sum + (c.outcome === "DRAW" ? 1 : (c.outcome === "bottom" ? c.bottomSourceRoot : c.topSourceRoot) === ordered[left] ? 2 : 0), 0)
    payoff[left]![right] = points - 4; payoff[right]![left] = 4 - points
    means[left]![right] = points / 4; means[right]![left] = (8 - points) / 4
    pairDenominators.push({ left: ordered[left]!, right: ordered[right]!, matches: 4 })
  }
  // Existing exact numeric restricted-game mechanism, not a historical full
  // snapshot certificate (that format requires eight Matches per pair).
  const solved = runExactRestrictedGameCandidate({ matrix: payoff, pivotBudget: 10000 })
  const mixture = solved.status === "solved" ? solved.weights.map((weight, ordinal) => ({ sourceRoot: ordered[ordinal]!, numerator: weight.numerator.toString(), denominator: weight.denominator.toString() })) : null
  const pure = ordered.map((sourceRoot, index) => {
    const opponents = means[index]!.filter((_, other) => other !== index)
    return { sourceRoot, minimumHalfPoints: Math.min(...opponents), meanHalfPoints: opponents.reduce((sum, value) => sum + value, 0) / opponents.length }
  }).sort((a, b) => b.minimumHalfPoints - a.minimumHalfPoints || b.meanHalfPoints - a.meanHalfPoints || a.sourceRoot.localeCompare(b.sourceRoot))
  const body = { schemaVersion: "lean-small-pool-analysis-v1", sources: ordered, matrixCellCount: cells.length, pairDenominators, payoffHalfPointSums: payoff, exactNumericalSolver: solved.status, operations: solved.operations, mixture, pure, selectedPureRoot: pure[0]!.sourceRoot, historicalFullSnapshotCredit: false, claim: "no_robust_pure_claimed" }
  return Object.freeze({ ...body, root: labRoot("lean-small-pool-analysis-v1", body) })
}

export const selectLeanMixtureTarget = (mixture: readonly { sourceRoot: LabRoot; numerator: string; denominator: string }[], ordinal: number): LabRoot => {
  if (!Number.isSafeInteger(ordinal) || ordinal < 0 || !mixture.length || mixture.some(w => !root(w.sourceRoot) || !/^\d{1,100}$/u.test(w.numerator) || !/^[1-9]\d{0,99}$/u.test(w.denominator))) return fail()
  // Four fixed deterministic quantiles, no random source or extra Match.
  const point = BigInt(2 * (ordinal % 4) + 1), denominator = 8n
  let totalN = 0n, totalD = 1n
  const ordered = [...mixture].sort((a, b) => a.sourceRoot.localeCompare(b.sourceRoot))
  let chosen: LabRoot | null = null
  for (const weight of ordered) {
    const n = BigInt(weight.numerator), d = BigInt(weight.denominator)
    if (n > d) return fail()
    totalN = totalN * d + n * totalD; totalD *= d
    if (chosen === null && point * totalD < totalN * denominator) chosen = weight.sourceRoot
  }
  if (totalN !== totalD || !chosen) return fail()
  return chosen
}
