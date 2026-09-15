import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import {
  CompletePayoffSnapshotSchema,
  createLeagueSolverManifest,
  createLeagueSolverOutput,
  type CompletePayoffSnapshot,
  type LeagueSolverManifest,
  type LeagueSolverOutput,
} from "./contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const MAX_ENTRANTS = 16
const FP_ITERATIONS = 17

type Rational = Readonly<{ numerator: bigint; denominator: bigint }>
type Matrix = readonly (readonly Rational[])[]
type SolverName = "exact-rational-bounded-fictitious-play-v1" | "exact-rational-pivoted-restricted-v1"
export type LeagueSolverFailureCode = "SNAPSHOT_INCOMPLETE" | "PAYOFF_TRANSPORT_INVALID" | "PAYOFF_TRANSPORT_MISMATCH" | "MATRIX_INCOMPLETE" | "RESOURCE_BOUND" | "SOLVER_SELECTION_FAILED"

const abs = (value: bigint) => value < 0n ? -value : value
const gcd = (left: bigint, right: bigint): bigint => {
  let a = abs(left), b = abs(right)
  while (b !== 0n) [a, b] = [b, a % b]
  return a || 1n
}
const rational = (numerator: bigint, denominator = 1n): Rational => {
  if (denominator === 0n) throw new TypeError("LEAGUE_SOLVER_ZERO_DENOMINATOR")
  const sign = denominator < 0n ? -1n : 1n, divisor = gcd(numerator, denominator)
  return Object.freeze({ numerator: (numerator * sign) / divisor, denominator: (denominator * sign) / divisor })
}
const add = (left: Rational, right: Rational) => rational(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator)
const subtract = (left: Rational, right: Rational) => rational(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator)
const multiply = (left: Rational, right: Rational) => rational(left.numerator * right.numerator, left.denominator * right.denominator)
const compare = (left: Rational, right: Rational) => left.numerator * right.denominator < right.numerator * left.denominator ? -1 : left.numerator * right.denominator > right.numerator * left.denominator ? 1 : 0
const zero = rational(0n)
const one = rational(1n)
const nonNegativeUnit = (value: Rational) => compare(value, zero) >= 0 && compare(value, one) <= 0
const sum = (values: readonly Rational[]) => values.reduce(add, zero)
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const bytes = (value: unknown): value is Uint8Array => value instanceof Uint8Array && value.byteLength > 0 && value.byteLength <= 262144
const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("LEAGUE_SOLVER_CANONICAL")
  return admitted.canonicalBytes
}
const outputBytes = (value: unknown): Uint8Array => canonicalBytes(value)

export interface ExactWeight { readonly candidateRoot: LabRoot; readonly numerator: string; readonly denominator: string }
export interface LeagueSolverSelection {
  readonly algorithm: "exact-rational-pivoted-restricted-v1"
  readonly version: "1"
  readonly representation: "bigint-rational-half-points-v1"
  readonly normalization: "non-negative-unit-sum-v1"
  readonly tieBreak: "canonical-candidate-root-then-pivot-order-v1"
  readonly schedule: "bounded-support-pivot-v1"
  readonly failureCodes: readonly LeagueSolverFailureCode[]
}
export interface SolverComparison {
  readonly candidate: SolverName
  readonly golden: boolean
  readonly permutation: boolean
  readonly boundary: boolean
  readonly observed: readonly string[]
}
export type LeagueSolverSpike =
  | Readonly<{ status: "selected"; selection: LeagueSolverSelection; comparisons: readonly SolverComparison[]; root: LabRoot }>
  | Readonly<{ status: "failed"; failureCode: "SOLVER_SELECTION_FAILED"; comparisons: readonly SolverComparison[]; root: LabRoot }>

interface ParsedProjection { readonly entrantCandidateRoot: LabRoot; readonly opponentCandidateRoot: LabRoot; readonly projectionRoot: LabRoot; readonly halfPoints: 0 | 1 | 2 }
interface ParsedSnapshot { readonly snapshot: Readonly<CompletePayoffSnapshot>; readonly candidates: readonly LabRoot[]; readonly matrix: Matrix }

const validateProjection = (value: unknown): ParsedProjection | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join("\0") !== ["entrantCandidateRoot", "opponentCandidateRoot", "projectionRoot", "halfPoints"].sort().join("\0") || !root(record.entrantCandidateRoot) || !root(record.opponentCandidateRoot) || record.entrantCandidateRoot === record.opponentCandidateRoot || !root(record.projectionRoot) || ![0, 1, 2].includes(record.halfPoints as number)) return null
  return record as unknown as ParsedProjection
}

const canonicalProjectionOrder = (left: ParsedProjection, right: ParsedProjection) =>
  `${left.entrantCandidateRoot}:${left.opponentCandidateRoot}:${left.projectionRoot}`.localeCompare(`${right.entrantCandidateRoot}:${right.opponentCandidateRoot}:${right.projectionRoot}`)

/** Re-admit canonical bytes and copy them before any numeric work; JS freeze cannot protect typed-array elements. */
const parseSnapshot = (snapshotValue: unknown, transport: unknown): ParsedSnapshot | LeagueSolverFailureCode => {
  const raw = snapshotValue as Partial<CompletePayoffSnapshot> | null
  if (!raw || raw.completedCellCount !== raw.expectedCellCount) return "SNAPSHOT_INCOMPLETE"
  let snapshot: Readonly<CompletePayoffSnapshot>
  try { snapshot = CompletePayoffSnapshotSchema.parse(snapshotValue) } catch { return "SNAPSHOT_INCOMPLETE" }
  if (!bytes(transport)) return "PAYOFF_TRANSPORT_INVALID"
  const copy = new Uint8Array(transport)
  const admitted = admitCanonicalJsonBytes(copy, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || !Array.isArray(admitted.value)) return "PAYOFF_TRANSPORT_INVALID"
  const projections = admitted.value.map(validateProjection)
  if (projections.some((entry) => entry === null)) return "PAYOFF_TRANSPORT_INVALID"
  const ordered = [...projections as ParsedProjection[]].sort(canonicalProjectionOrder)
  if (new Set(ordered.map((entry) => entry.projectionRoot)).size !== ordered.length) return "PAYOFF_TRANSPORT_INVALID"
  if (labRoot("league-solver-payoffs-v1", ordered) !== snapshot.solverPayoffRoot) return "PAYOFF_TRANSPORT_MISMATCH"
  const candidates = [...new Set(ordered.flatMap((entry) => [entry.entrantCandidateRoot, entry.opponentCandidateRoot]))].sort()
  if (candidates.length < 2) return "MATRIX_INCOMPLETE"
  if (candidates.length > MAX_ENTRANTS) return "RESOURCE_BOUND"
  const index = new Map(candidates.map((candidate, ordinal) => [candidate, ordinal]))
  const matrix = Array.from({ length: candidates.length }, () => Array.from({ length: candidates.length }, () => zero))
  for (let left = 0; left < candidates.length - 1; left += 1) for (let right = left + 1; right < candidates.length; right += 1) {
    const a = candidates[left]!, b = candidates[right]!
    const pair = ordered.filter((entry) => (entry.entrantCandidateRoot === a && entry.opponentCandidateRoot === b) || (entry.entrantCandidateRoot === b && entry.opponentCandidateRoot === a))
    if (pair.length !== 8) return "MATRIX_INCOMPLETE"
    const payoff = rational(pair.reduce((total, entry) => total + BigInt(entry.halfPoints - 1) * (entry.entrantCandidateRoot === a ? 1n : -1n), 0n), BigInt(pair.length))
    matrix[index.get(a)!]![index.get(b)!] = payoff
    matrix[index.get(b)!]![index.get(a)!] = rational(-payoff.numerator, payoff.denominator)
  }
  return { snapshot, candidates, matrix }
}

const weightsFor = (candidates: readonly LabRoot[], values: readonly Rational[]): readonly ExactWeight[] => Object.freeze(candidates.map((candidateRoot, ordinal) => Object.freeze({ candidateRoot, numerator: values[ordinal]!.numerator.toString(), denominator: values[ordinal]!.denominator.toString() })))
const equalWeights = (left: readonly ExactWeight[], right: readonly ExactWeight[]) => JSON.stringify(left) === JSON.stringify(right)
const pureSolution = (matrix: Matrix): readonly Rational[] | null => {
  const rowMins = matrix.map((row) => row.reduce((minimum, value) => compare(value, minimum) < 0 ? value : minimum, row[0]!))
  const columnMaxes = matrix[0]!.map((_, column) => matrix.reduce((maximum, row) => compare(row[column]!, maximum) > 0 ? row[column]! : maximum, matrix[0]![column]!))
  const value = rowMins.reduce((maximum, entry) => compare(entry, maximum) > 0 ? entry : maximum, rowMins[0]!)
  if (!columnMaxes.some((entry) => compare(entry, value) === 0)) return null
  const chosen = rowMins.findIndex((entry) => compare(entry, value) === 0)
  return matrix.map((_, ordinal) => ordinal === chosen ? one : zero)
}
/** Exact 2x2 support pivot. Larger restricted games fail explicitly rather than manufacturing a convergence claim. */
const pivotedRestricted = (matrix: Matrix): readonly Rational[] | null => {
  const pure = pureSolution(matrix)
  if (pure) return pure
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) return null
  const [[a, b], [c, d]] = matrix as [[Rational, Rational], [Rational, Rational]]
  const denominator = add(subtract(a, b), subtract(d, c))
  if (compare(denominator, zero) === 0) return null
  const first = rational(subtract(d, c).numerator * denominator.denominator, subtract(d, c).denominator * denominator.numerator)
  if (!nonNegativeUnit(first)) return null
  return Object.freeze([first, subtract(one, first)])
}
const boundedFictitiousPlay = (matrix: Matrix): readonly Rational[] | null => {
  if (matrix.length !== 2 || matrix.some((row) => row.length !== 2)) return null
  const rowCounts = [0n, 0n], columnCounts = [0n, 0n]
  for (let iteration = 0; iteration < FP_ITERATIONS; iteration += 1) {
    const rowScores = matrix.map((row) => add(multiply(row[0]!, rational(columnCounts[0]!)), multiply(row[1]!, rational(columnCounts[1]!))))
    const row = compare(rowScores[0]!, rowScores[1]!) >= 0 ? 0 : 1
    rowCounts[row] = rowCounts[row]! + 1n
    const columnScores = [
      add(multiply(matrix[0]![0]!, rational(rowCounts[0]!)), multiply(matrix[1]![0]!, rational(rowCounts[1]!))),
      add(multiply(matrix[0]![1]!, rational(rowCounts[0]!)), multiply(matrix[1]![1]!, rational(rowCounts[1]!))),
    ]
    const column = compare(columnScores[0]!, columnScores[1]!) <= 0 ? 0 : 1
    columnCounts[column] = columnCounts[column]! + 1n
  }
  return Object.freeze(rowCounts.map((count) => rational(count, BigInt(FP_ITERATIONS))))
}

const corpus = Object.freeze([
  { id: "degenerate", matrix: [[0n, 0n], [0n, 0n]], expected: [rational(1n), rational(0n)] },
  { id: "tie", matrix: [[1n, -1n], [-1n, 1n]], expected: [rational(1n, 2n), rational(1n, 2n)] },
  { id: "boundary", matrix: [[1n, -1n], [-1n, 0n]], expected: [rational(1n, 3n), rational(2n, 3n)] },
])
const matrixFromCorpus = (values: readonly (readonly bigint[])[]): Matrix => Object.freeze(values.map((row) => Object.freeze(row.map((value) => rational(value)))))
const testCandidate = (candidate: SolverName): SolverComparison => {
  const solve = candidate === "exact-rational-pivoted-restricted-v1" ? pivotedRestricted : boundedFictitiousPlay
  const observed = corpus.map(({ id, matrix, expected }) => {
    const result = solve(matrixFromCorpus(matrix))
    return `${id}:${result !== null && result.length === expected.length && result.every((value, ordinal) => compare(value, expected[ordinal]!) === 0) ? "pass" : "fail"}`
  })
  const golden = observed.every((entry) => entry.endsWith(":pass"))
  const permutation = corpus.filter(({ id }) => id !== "degenerate").every(({ matrix, expected }) => {
    const reversed = matrix.map((row) => [...row].reverse()).reverse()
    const result = solve(matrixFromCorpus(reversed))
    return result !== null && result.every((value, ordinal) => compare(value, expected[expected.length - ordinal - 1]!) === 0)
  })
  const boundary = observed.find((entry) => entry.startsWith("boundary:"))?.endsWith(":pass") === true
  return Object.freeze({ candidate, golden, permutation, boundary, observed: Object.freeze(observed) })
}

/** The selection is data-derived from a bounded synthetic corpus and fails closed if its winner is not unique. */
export const runLeagueSolverSpike = (): LeagueSolverSpike => {
  const comparisons = Object.freeze<SolverComparison[]>([
    testCandidate("exact-rational-bounded-fictitious-play-v1"),
    testCandidate("exact-rational-pivoted-restricted-v1"),
  ])
  const winners = comparisons.filter((entry) => entry.golden && entry.permutation && entry.boundary)
  if (winners.length !== 1 || winners[0]!.candidate !== "exact-rational-pivoted-restricted-v1") {
    const value = { status: "failed" as const, failureCode: "SOLVER_SELECTION_FAILED" as const, comparisons }
    return freezeLabValue({ ...value, root: labRoot("league-solver-spike-v1", value) }) as LeagueSolverSpike
  }
  const selection: LeagueSolverSelection = freezeLabValue({
    algorithm: "exact-rational-pivoted-restricted-v1", version: "1", representation: "bigint-rational-half-points-v1",
    normalization: "non-negative-unit-sum-v1", tieBreak: "canonical-candidate-root-then-pivot-order-v1", schedule: "bounded-support-pivot-v1",
    failureCodes: ["SNAPSHOT_INCOMPLETE", "PAYOFF_TRANSPORT_INVALID", "PAYOFF_TRANSPORT_MISMATCH", "MATRIX_INCOMPLETE", "RESOURCE_BOUND", "SOLVER_SELECTION_FAILED"],
  })
  const value = { status: "selected" as const, selection, comparisons }
  return freezeLabValue({ ...value, root: labRoot("league-solver-spike-v1", value) }) as LeagueSolverSpike
}

export type LeagueSolverResult =
  | Readonly<{ status: "solved"; manifest: Readonly<LeagueSolverManifest>; output: Readonly<LeagueSolverOutput>; weights: readonly ExactWeight[]; strongestPureCandidateRoot: LabRoot; vulnerablePureCandidateRoot: LabRoot; canonicalBytes: Uint8Array }>
  | Readonly<{ status: "failed"; failureCode: LeagueSolverFailureCode; canonicalBytes: Uint8Array }>

const failed = (failureCode: LeagueSolverFailureCode): LeagueSolverResult => Object.freeze({ status: "failed" as const, failureCode, canonicalBytes: outputBytes({ status: "failed", failureCode }) }) as LeagueSolverResult

/** Solve one complete, rooted payoff snapshot only. Operational layout inputs are deliberately ignored. */
export const solveLeagueSnapshot = (input: { readonly snapshot: unknown; readonly solverPayoffBytes: unknown; readonly workerCount?: number; readonly shardOrder?: readonly number[]; readonly restart?: number }): LeagueSolverResult => {
  const parsed = parseSnapshot(input.snapshot, input.solverPayoffBytes)
  if (typeof parsed === "string") return failed(parsed)
  const spike = runLeagueSolverSpike()
  if (spike.status !== "selected") return failed("SOLVER_SELECTION_FAILED")
  const values = pivotedRestricted(parsed.matrix)
  if (!values) return failed("RESOURCE_BOUND")
  if (values.some((value) => !nonNegativeUnit(value)) || compare(sum(values), one) !== 0) return failed("RESOURCE_BOUND")
  const weights = weightsFor(parsed.candidates, values)
  const strongest = weights.filter((weight) => weight.numerator !== "0").sort((left, right) => left.candidateRoot.localeCompare(right.candidateRoot))[0]?.candidateRoot
  const vulnerable = [...weights].sort((left, right) => left.numerator === right.numerator ? left.candidateRoot.localeCompare(right.candidateRoot) : BigInt(left.numerator) * BigInt(right.denominator) < BigInt(right.numerator) * BigInt(left.denominator) ? -1 : 1)[0]?.candidateRoot
  if (!strongest || !vulnerable) return failed("RESOURCE_BOUND")
  const algorithmRoot = labRoot("league-solver-algorithm-v1", spike.selection)
  const numericPolicyRoot = labRoot("league-solver-numeric-policy-v1", { representation: spike.selection.representation, normalization: spike.selection.normalization, halfPointEncoding: [-1, 0, 1] })
  const resourcePolicyRoot = labRoot("league-solver-resource-policy-v1", { maxEntrants: MAX_ENTRANTS, schedule: spike.selection.schedule, failureCodes: spike.selection.failureCodes })
  const manifest = createLeagueSolverManifest({ snapshotRoot: parsed.snapshot.root, algorithmRoot, numericPolicyRoot, resourcePolicyRoot })
  const distributionRoot = labRoot("league-solver-distribution-v1", { snapshotRoot: parsed.snapshot.root, weights })
  const diagnosticsRoot = labRoot("league-solver-diagnostics-v1", { spikeRoot: spike.root, strongest, vulnerable, tieBreak: spike.selection.tieBreak })
  const output = createLeagueSolverOutput({ manifestRoot: manifest.root, snapshotRoot: parsed.snapshot.root, distributionRoot, diagnosticsRoot })
  const canonicalResult = { algorithm: spike.selection.algorithm, representation: spike.selection.representation, normalization: spike.selection.normalization, tieBreak: spike.selection.tieBreak, schedule: spike.selection.schedule, weights, strongestPureCandidateRoot: strongest, vulnerablePureCandidateRoot: vulnerable }
  return Object.freeze({ status: "solved" as const, manifest, output, weights, strongestPureCandidateRoot: strongest, vulnerablePureCandidateRoot: vulnerable, canonicalBytes: outputBytes(canonicalResult) }) as LeagueSolverResult
}
