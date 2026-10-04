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

const gcd = (left: bigint, right: bigint): bigint => right === 0n ? left : gcd(right, left % right)
const add = (left: readonly [bigint, bigint], right: readonly [bigint, bigint]): readonly [bigint, bigint] => {
  const numerator = left[0] * right[1] + right[0] * left[1], denominator = left[1] * right[1]
  const divisor = gcd(numerator, denominator)
  return [numerator / divisor, denominator / divisor]
}
/** The eight new response cells are scored against the *frozen* initial
 * mixture, not an equally weighted security diagnostic. The original pure's
 * own fresh score against both of those opponents would need a self-pair;
 * the approved distinct-pair schedule has no such allocation. */
export const analyseLeanResponseAdmission = (input: {
  readonly initialSources: readonly LabRoot[]
  readonly frozenMixture: readonly { sourceRoot: LabRoot; numerator: string; denominator: string }[]
  readonly strongestPureRoot: LabRoot
  readonly strongestInitialMinimumHalfPoints: number
  readonly responseRoot: LabRoot
  readonly responseCells: readonly LeanMeasuredPair[]
}) => {
  const initial = [...input.initialSources].sort()
  if (initial.length !== 2 || new Set(initial).size !== 2 || !initial.every(root) || !root(input.responseRoot) || initial.includes(input.responseRoot) ||
      !initial.includes(input.strongestPureRoot) || !Number.isFinite(input.strongestInitialMinimumHalfPoints) ||
      input.responseCells.length !== 8 || new Set(input.responseCells.map(c => c.ordinal)).size !== 8 || new Set(input.responseCells.map(c => c.executionRoot)).size !== 8 ||
      input.frozenMixture.length !== 2 || new Set(input.frozenMixture.map(w => w.sourceRoot)).size !== 2 ||
      input.frozenMixture.some(w => !initial.includes(w.sourceRoot) || !/^\d{1,100}$/u.test(w.numerator) || !/^[1-9]\d{0,99}$/u.test(w.denominator))) return fail()
  const pointsByOpponent = initial.map(opponent => {
    const cells = input.responseCells.filter(c => c.bottomSourceRoot === opponent || c.topSourceRoot === opponent)
    if (cells.length !== 4 || cells.some(c => !root(c.executionRoot) || !root(c.semanticRoot) || !["bottom", "top", "DRAW"].includes(c.outcome) ||
      !(c.bottomSourceRoot === input.responseRoot && c.topSourceRoot === opponent || c.topSourceRoot === input.responseRoot && c.bottomSourceRoot === opponent))) return fail()
    return { sourceRoot: opponent, points: cells.reduce((sum, c) => sum + (c.outcome === "DRAW" ? 1 : (c.outcome === "bottom" ? c.bottomSourceRoot : c.topSourceRoot) === input.responseRoot ? 2 : 0), 0) }
  })
  let weightSum: readonly [bigint, bigint] = [0n, 1n], weighted: readonly [bigint, bigint] = [0n, 1n]
  for (const row of pointsByOpponent) {
    const weight = input.frozenMixture.find(w => w.sourceRoot === row.sourceRoot)!
    const fraction: readonly [bigint, bigint] = [BigInt(weight.numerator), BigInt(weight.denominator)]
    if (fraction[0] > fraction[1]) return fail()
    weightSum = add(weightSum, fraction)
    weighted = add(weighted, [fraction[0] * BigInt(row.points), fraction[1] * 8n])
  }
  if (weightSum[0] !== weightSum[1]) return fail()
  const totalPoints = pointsByOpponent.reduce((sum, row) => sum + row.points, 0)
  const unweightedMeanHalfPoints = totalPoints / 8
  const frozenMixtureThresholdPassed = weighted[0] * 20n > weighted[1] * 11n
  const strongestPureFreshComparator = {
    status: "unsupported" as const,
    reason: "strongest_pure_self_pair_not_allocated" as const,
    missingOpponentRoot: input.strongestPureRoot,
    requiredFreshPairings: 8,
    allocatedComparablePairings: 4,
  }
  return Object.freeze({
    freshPairings: 8 as const,
    perOpponent: pointsByOpponent.map(row => ({ ...row, matches: 4 as const, normalizedScore: row.points / 8 })),
    unweightedSecurityDiagnostic: { responseMeanHalfPoints: unweightedMeanHalfPoints, strongestInitialMinimumHalfPoints: input.strongestInitialMinimumHalfPoints, gapHalfPoints: unweightedMeanHalfPoints - input.strongestInitialMinimumHalfPoints, comparator: "unweighted_initial_security_floor_not_admission" as const },
    frozenMixtureNormalizedScore: { numerator: weighted[0].toString(), denominator: weighted[1].toString(), approximate: Number(weighted[0] * 1_000_000n / weighted[1]) / 1_000_000, strictThreshold: "11/20" as const, passed: frozenMixtureThresholdPassed },
    strongestPureFreshComparator,
    admitted: false as const,
    disposition: frozenMixtureThresholdPassed ? "fresh_strongest_pure_comparator_unsupported" as const : "frozen_mixture_threshold_not_met" as const,
  })
}
