import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { readLeagueByteStream, type LeagueByteStream } from "./matrix.js"
import {
  CompletePayoffSnapshotSchema,
  createLeagueSolverManifest,
  createLeagueSolverOutput,
  type CompletePayoffSnapshot,
  type LeagueSolverManifest,
  type LeagueSolverOutput,
} from "./contracts.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const FP_ITERATIONS = 17
const MAX_PIVOT_OPERATIONS = 1_000_000

type Rational = Readonly<{ numerator: bigint; denominator: bigint }>
type Matrix = readonly (readonly Rational[])[]
type SolverName = "exact-rational-bounded-fictitious-play-v1" | "exact-rational-pivoted-restricted-v2"
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
  readonly algorithm: "exact-rational-pivoted-restricted-v2"
  readonly version: "2"
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
  let copy: Uint8Array
  try { copy = bytes(transport) ? new Uint8Array(transport) : readLeagueByteStream(transport as LeagueByteStream) }
  catch { return "PAYOFF_TRANSPORT_INVALID" }
  const admitted = admitCanonicalJsonBytes(copy, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!admitted.ok || !Array.isArray(admitted.value)) return "PAYOFF_TRANSPORT_INVALID"
  const projections = admitted.value.map(validateProjection)
  if (projections.some((entry) => entry === null)) return "PAYOFF_TRANSPORT_INVALID"
  const ordered = [...projections as ParsedProjection[]].sort(canonicalProjectionOrder)
  if (new Set(ordered.map((entry) => entry.projectionRoot)).size !== ordered.length) return "PAYOFF_TRANSPORT_INVALID"
  if (labRoot("league-solver-payoffs-v1", ordered) !== snapshot.solverPayoffRoot) return "PAYOFF_TRANSPORT_MISMATCH"
  const candidates = [...new Set(ordered.flatMap((entry) => [entry.entrantCandidateRoot, entry.opponentCandidateRoot]))].sort()
  if (candidates.length < 2 || ordered.length !== snapshot.expectedCellCount || snapshot.expectedCellCount !== 8 * ((candidates.length * (candidates.length - 1)) / 2)) return "MATRIX_INCOMPLETE"
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
interface SecuritySolution { readonly weights: readonly Rational[]; readonly value: Rational; readonly operations: number }
type RestrictedResult = Readonly<{ status: "solved"; weights: readonly Rational[]; securityResidual: Rational; operations: number }> | Readonly<{ status: "resource_exhausted"; operations: number }> | Readonly<{ status: "unsupported"; operations: number }>

const solveLinear = (equations: readonly (readonly Rational[])[]): readonly Rational[] | null => {
  const dimension = equations.length
  if (!dimension || equations.some((row) => row.length !== dimension + 1)) return null
  const table = equations.map((row) => [...row])
  for (let column = 0; column < dimension; column += 1) {
    const pivot = table.findIndex((row, index) => index >= column && compare(row[column]!, zero) !== 0)
    if (pivot < 0) return null
    ;[table[column], table[pivot]] = [table[pivot]!, table[column]!]
    const divisor = table[column]![column]!
    table[column] = table[column]!.map((value) => rational(value.numerator * divisor.denominator, value.denominator * divisor.numerator))
    for (let row = 0; row < dimension; row += 1) if (row !== column) {
      const factor = table[row]![column]!
      if (compare(factor, zero) !== 0) table[row] = table[row]!.map((value, index) => subtract(value, multiply(factor, table[column]![index]!)))
    }
  }
  return table.map((row) => row[dimension]!)
}
const combinations = function* (size: number, count: number, start = 0, chosen: number[] = []): Generator<readonly number[]> {
  if (chosen.length === count) { yield chosen; return }
  for (let next = start; next <= size - (count - chosen.length); next += 1) yield* combinations(size, count, next + 1, [...chosen, next])
}
const supportCost = (count: number) => (count + 1) ** 3
const supportSolution = (matrix: Matrix, rows: readonly number[], columns: readonly number[]): SecuritySolution | null => {
  if (rows.length !== columns.length) return null
  const equations: Rational[][] = columns.map((column) => [...rows.map((row) => matrix[row]![column]!), rational(-1n), zero])
  equations.push([...rows.map(() => one), zero, one])
  const solved = solveLinear(equations)
  if (!solved) return null
  const values = solved.slice(0, -1), value = solved.at(-1)!
  if (values.some((entry) => compare(entry, zero) < 0)) return null
  const full = matrix.map(() => zero)
  for (const [ordinal, row] of rows.entries()) full[row] = values[ordinal]!
  const columnValues = matrix[0]!.map((_, column) => sum(full.map((weight, row) => multiply(weight, matrix[row]![column]!))))
  if (columnValues.some((entry) => compare(entry, value) < 0)) return null
  return Object.freeze({ weights: Object.freeze(full), value, operations: supportCost(rows.length) })
}
const solveSecurity = (matrix: Matrix, budget: { readonly maximum: number; used: number }): SecuritySolution | "resource_exhausted" | null => {
  const pure = pureSolution(matrix)
  if (pure) {
    const value = matrix[pure.findIndex((entry) => compare(entry, one) === 0)]!.reduce((minimum, entry) => compare(entry, minimum) < 0 ? entry : minimum)
    return Object.freeze({ weights: pure, value, operations: 0 })
  }
  const trySupport = (rows: readonly number[], columns: readonly number[]) => {
    const cost = supportCost(rows.length)
    if (budget.used + cost > budget.maximum) return "resource_exhausted" as const
    budget.used += cost
    return supportSolution(matrix, rows, columns)
  }
  const all = Array.from({ length: matrix.length }, (_, ordinal) => ordinal)
  const full = trySupport(all, all)
  if (full === "resource_exhausted" || full) return full
  let best: SecuritySolution | null = null
  for (let count = 1; count < matrix.length; count += 1) for (const rows of combinations(matrix.length, count)) for (const columns of combinations(matrix.length, count)) {
    const candidate = trySupport(rows, columns)
    if (candidate === "resource_exhausted") return candidate
    if (candidate && (!best || compare(candidate.value, best.value) > 0)) best = candidate
  }
  return best
}
const negativeTranspose = (matrix: Matrix): Matrix => Object.freeze(matrix[0]!.map((_, row) => Object.freeze(matrix.map((column) => rational(-column[row]!.numerator, column[row]!.denominator)))))
/** Remove only policies that are strictly dominated for both row and column roles; no heuristic pruning is permitted. */
const reduceMutuallyDominated = (matrix: Matrix): Readonly<{ active: readonly number[]; matrix: Matrix }> => {
  const active = Array.from({ length: matrix.length }, (_, ordinal) => ordinal)
  let changed = true
  while (changed && active.length > 1) {
    changed = false
    for (const candidate of active) {
      const rowDominated = active.some((other) => other !== candidate && active.every((column) => compare(matrix[other]![column]!, matrix[candidate]![column]!) >= 0) && active.some((column) => compare(matrix[other]![column]!, matrix[candidate]![column]!) > 0))
      const columnDominated = active.some((other) => other !== candidate && active.every((row) => compare(matrix[row]![other]!, matrix[row]![candidate]!) <= 0) && active.some((row) => compare(matrix[row]![other]!, matrix[row]![candidate]!) < 0))
      if (rowDominated && columnDominated) { active.splice(active.indexOf(candidate), 1); changed = true; break }
    }
  }
  return Object.freeze({ active: Object.freeze(active), matrix: Object.freeze(active.map((row) => Object.freeze(active.map((column) => matrix[row]![column]!)))) })
}
/** Bounded exact rational support pivots solve both security LPs; failure is an explicit budget result, never an optimality claim. */
const pivotedRestricted = (matrix: Matrix, maximum = MAX_PIVOT_OPERATIONS): RestrictedResult => {
  if (!Number.isSafeInteger(maximum) || maximum < 0 || !matrix.length || matrix.some((row) => row.length !== matrix.length)) return Object.freeze({ status: "unsupported" as const, operations: 0 })
  const reduced = reduceMutuallyDominated(matrix), restrictedMatrix = reduced.matrix
  const pure = pureSolution(restrictedMatrix)
  if (pure) {
    const weights = matrix.map(() => zero)
    for (const [ordinal, index] of reduced.active.entries()) weights[index] = pure[ordinal]!
    return Object.freeze({ status: "solved" as const, weights: Object.freeze(weights), securityResidual: zero, operations: 0 })
  }
  const uniformCost = restrictedMatrix.length ** 2
  if (maximum < uniformCost) return Object.freeze({ status: "resource_exhausted" as const, operations: 0 })
  const rowTotals = restrictedMatrix.map(sum), columnTotals = restrictedMatrix[0]!.map((_, column) => sum(restrictedMatrix.map((row) => row[column]!)))
  if (rowTotals.every((value) => compare(value, rowTotals[0]!) === 0) && columnTotals.every((value) => compare(value, columnTotals[0]!) === 0) && compare(rowTotals[0]!, columnTotals[0]!) === 0) {
    const weights = matrix.map(() => zero)
    for (const index of reduced.active) weights[index] = rational(1n, BigInt(restrictedMatrix.length))
    return Object.freeze({ status: "solved" as const, weights: Object.freeze(weights), securityResidual: zero, operations: uniformCost })
  }
  const budget = { maximum, used: 0 }
  const row = solveSecurity(restrictedMatrix, budget)
  if (row === "resource_exhausted") return Object.freeze({ status: "resource_exhausted" as const, operations: budget.used })
  const column = solveSecurity(negativeTranspose(restrictedMatrix), budget)
  if (column === "resource_exhausted") return Object.freeze({ status: "resource_exhausted" as const, operations: budget.used })
  if (!row || !column || compare(row.value, rational(-column.value.numerator, column.value.denominator)) !== 0) return Object.freeze({ status: "unsupported" as const, operations: budget.used })
  const weights = matrix.map(() => zero)
  for (const [ordinal, index] of reduced.active.entries()) weights[index] = row.weights[ordinal]!
  const minimum = matrix[0]!.map((_, columnIndex) => sum(weights.map((weight, rowIndex) => multiply(weight, matrix[rowIndex]![columnIndex]!)))).reduce((current, value) => compare(value, current) < 0 ? value : current, matrix[0]![0]!)
  return Object.freeze({ status: "solved" as const, weights: Object.freeze(weights), securityResidual: subtract(row.value, minimum), operations: budget.used })
}
export const runExactRestrictedGameCandidate = (input: { readonly matrix: readonly (readonly number[])[]; readonly pivotBudget: number }): RestrictedResult => {
  if (!Array.isArray(input.matrix) || input.matrix.length < 2 || input.matrix.some((row) => !Array.isArray(row) || row.length !== input.matrix.length || row.some((value) => !Number.isSafeInteger(value) || value < -8 || value > 8))) return Object.freeze({ status: "unsupported" as const, operations: 0 })
  return pivotedRestricted(matrixFromCorpus(input.matrix.map((row) => row.map(BigInt))), input.pivotBudget)
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
  { id: "rps", matrix: [[0n, 1n, -1n], [-1n, 0n, 1n], [1n, -1n, 0n]], expected: [rational(1n, 3n), rational(1n, 3n), rational(1n, 3n)] },
  { id: "cyclic12", matrix: Array.from({ length: 12 }, (_, row) => Array.from({ length: 12 }, (_, column) => BigInt(column === (row + 1) % 12 ? 1 : column === (row + 11) % 12 ? -1 : 0))), expected: Array.from({ length: 12 }, () => rational(1n, 12n)) },
  { id: "asymmetric12", matrix: Array.from({ length: 12 }, (_, row) => Array.from({ length: 12 }, (_, column) => {
    if (row === column) return 0n
    const core = new Map([ ["0:1", 8n], ["1:2", 4n], ["2:0", 2n] ])
    const direct = core.get(`${row}:${column}`), reverse = core.get(`${column}:${row}`)
    if (direct !== undefined) return direct
    if (reverse !== undefined) return -reverse
    if (row < 3 && column >= 3) return 8n
    if (column < 3 && row >= 3) return -8n
    return 0n
  })), expected: [rational(2n, 7n), rational(1n, 7n), rational(4n, 7n), ...Array.from({ length: 9 }, () => zero)] },
])
const matrixFromCorpus = (values: readonly (readonly bigint[])[]): Matrix => Object.freeze(values.map((row) => Object.freeze(row.map((value) => rational(value)))))
const candidateWeights = (result: readonly Rational[] | RestrictedResult | null): readonly Rational[] | null => {
  if (result === null) return null
  if (Array.isArray(result)) return result as readonly Rational[]
  const restricted = result as RestrictedResult
  return restricted.status === "solved" ? restricted.weights : null
}
const testCandidate = (candidate: SolverName): SolverComparison => {
  const solve = candidate === "exact-rational-pivoted-restricted-v2" ? pivotedRestricted : boundedFictitiousPlay
  const observed = corpus.map(({ id, matrix, expected }) => {
    const result = candidate === "exact-rational-pivoted-restricted-v2" ? pivotedRestricted(matrixFromCorpus(matrix)) : solve(matrixFromCorpus(matrix))
    const weights = candidateWeights(result)
    return `${id}:${weights !== null && weights.length === expected.length && weights.every((value, ordinal) => compare(value, expected[ordinal]!) === 0) ? "pass" : "fail"}`
  })
  const golden = observed.every((entry) => entry.endsWith(":pass"))
  const permutation = corpus.filter(({ id }) => id !== "degenerate").every(({ matrix, expected }) => {
    const reversed = matrix.map((row) => [...row].reverse()).reverse()
    const result = candidate === "exact-rational-pivoted-restricted-v2" ? pivotedRestricted(matrixFromCorpus(reversed)) : solve(matrixFromCorpus(reversed))
    const weights = candidateWeights(result)
    return weights !== null && weights.every((value, ordinal) => compare(value, expected[expected.length - ordinal - 1]!) === 0)
  })
  const boundary = observed.find((entry) => entry.startsWith("boundary:"))?.endsWith(":pass") === true
  return Object.freeze({ candidate, golden, permutation, boundary, observed: Object.freeze(observed) })
}

/** The selection is data-derived from a bounded synthetic corpus and fails closed if its winner is not unique. */
export const runLeagueSolverSpike = (): LeagueSolverSpike => {
  const comparisons = Object.freeze<SolverComparison[]>([
    testCandidate("exact-rational-bounded-fictitious-play-v1"),
    testCandidate("exact-rational-pivoted-restricted-v2"),
  ])
  const winners = comparisons.filter((entry) => entry.golden && entry.permutation && entry.boundary)
  if (winners.length !== 1 || winners[0]!.candidate !== "exact-rational-pivoted-restricted-v2") {
    const value = { status: "failed" as const, failureCode: "SOLVER_SELECTION_FAILED" as const, comparisons }
    return freezeLabValue({ ...value, root: labRoot("league-solver-spike-v1", value) }) as LeagueSolverSpike
  }
  const selection: LeagueSolverSelection = freezeLabValue({
    algorithm: "exact-rational-pivoted-restricted-v2", version: "2", representation: "bigint-rational-half-points-v1",
    normalization: "non-negative-unit-sum-v1", tieBreak: "canonical-candidate-root-then-pivot-order-v1", schedule: "bounded-support-pivot-v1",
    failureCodes: ["SNAPSHOT_INCOMPLETE", "PAYOFF_TRANSPORT_INVALID", "PAYOFF_TRANSPORT_MISMATCH", "MATRIX_INCOMPLETE", "RESOURCE_BOUND", "SOLVER_SELECTION_FAILED"],
  })
  const value = { status: "selected" as const, selection, comparisons }
  return freezeLabValue({ ...value, root: labRoot("league-solver-spike-v1", value) }) as LeagueSolverSpike
}

export type LeagueSolverResult =
  | Readonly<{ status: "solved"; manifest: Readonly<LeagueSolverManifest>; output: Readonly<LeagueSolverOutput>; weights: readonly ExactWeight[]; securityResidual: Readonly<{ numerator: string; denominator: string }>; strongestPureCandidateRoot: LabRoot; vulnerablePureCandidateRoot: LabRoot; canonicalBytes: Uint8Array }>
  | Readonly<{ status: "failed"; failureCode: LeagueSolverFailureCode; canonicalBytes: Uint8Array }>

const failed = (failureCode: LeagueSolverFailureCode): LeagueSolverResult => Object.freeze({ status: "failed" as const, failureCode, canonicalBytes: outputBytes({ status: "failed", failureCode }) }) as LeagueSolverResult

/** Solve one complete, rooted payoff snapshot only. Operational layout inputs are deliberately ignored. */
export const solveLeagueSnapshot = (input: { readonly snapshot: unknown; readonly solverPayoffBytes: unknown; readonly workerCount?: number; readonly shardOrder?: readonly number[]; readonly restart?: number }): LeagueSolverResult => {
  const parsed = parseSnapshot(input.snapshot, input.solverPayoffBytes)
  if (typeof parsed === "string") return failed(parsed)
  const spike = runLeagueSolverSpike()
  if (spike.status !== "selected") return failed("SOLVER_SELECTION_FAILED")
  const restricted = pivotedRestricted(parsed.matrix)
  if (restricted.status !== "solved") return failed("RESOURCE_BOUND")
  const values = restricted.weights
  if (values.some((value) => !nonNegativeUnit(value)) || compare(sum(values), one) !== 0) return failed("RESOURCE_BOUND")
  const weights = weightsFor(parsed.candidates, values)
  const strongest = weights.filter((weight) => weight.numerator !== "0").sort((left, right) => left.candidateRoot.localeCompare(right.candidateRoot))[0]?.candidateRoot
  const vulnerable = [...weights].sort((left, right) => left.numerator === right.numerator ? left.candidateRoot.localeCompare(right.candidateRoot) : BigInt(left.numerator) * BigInt(right.denominator) < BigInt(right.numerator) * BigInt(left.denominator) ? -1 : 1)[0]?.candidateRoot
  if (!strongest || !vulnerable) return failed("RESOURCE_BOUND")
  const algorithmRoot = labRoot("league-solver-algorithm-v1", spike.selection)
  const numericPolicyRoot = labRoot("league-solver-numeric-policy-v1", { representation: spike.selection.representation, normalization: spike.selection.normalization, halfPointEncoding: [-1, 0, 1] })
  const resourcePolicyRoot = labRoot("league-solver-resource-policy-v1", { maximumPivotOperations: MAX_PIVOT_OPERATIONS, schedule: spike.selection.schedule, failureCodes: spike.selection.failureCodes })
  const manifest = createLeagueSolverManifest({ snapshotRoot: parsed.snapshot.root, algorithmRoot, numericPolicyRoot, resourcePolicyRoot })
  const distributionRoot = labRoot("league-solver-distribution-v1", { snapshotRoot: parsed.snapshot.root, weights })
  const diagnosticsRoot = labRoot("league-solver-diagnostics-v1", { spikeRoot: spike.root, strongest, vulnerable, tieBreak: spike.selection.tieBreak })
  const output = createLeagueSolverOutput({ manifestRoot: manifest.root, snapshotRoot: parsed.snapshot.root, distributionRoot, diagnosticsRoot })
  const securityResidual = { numerator: restricted.securityResidual.numerator.toString(), denominator: restricted.securityResidual.denominator.toString() }
  const canonicalResult = { algorithm: spike.selection.algorithm, representation: spike.selection.representation, normalization: spike.selection.normalization, tieBreak: spike.selection.tieBreak, schedule: spike.selection.schedule, weights, securityResidual, strongestPureCandidateRoot: strongest, vulnerablePureCandidateRoot: vulnerable }
  return Object.freeze({ status: "solved" as const, manifest, output, weights, securityResidual, strongestPureCandidateRoot: strongest, vulnerablePureCandidateRoot: vulnerable, canonicalBytes: outputBytes(canonicalResult) }) as LeagueSolverResult
}
