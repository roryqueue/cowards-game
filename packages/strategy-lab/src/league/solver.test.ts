import { admitCanonicalJsonValue } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { createCompletePayoffSnapshot } from "./contracts.js"
import { runExactRestrictedGameCandidate, runLeagueSolverSpike, solveLeagueSnapshot } from "./solver.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot

const canonical = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("TEST_CANONICAL")
  return admitted.canonicalBytes
}

type Pair = readonly [LabRoot, LabRoot, 0 | 1 | 2]
const snapshotFor = (pairs: readonly Pair[], options: { readonly reverse?: boolean; readonly byteMutation?: boolean } = {}) => {
  const projections = pairs.flatMap(([entrantCandidateRoot, opponentCandidateRoot, halfPoints], pairOrdinal) =>
    Array.from({ length: 8 }, (_, conditionOrdinal) => ({
      entrantCandidateRoot,
      opponentCandidateRoot,
      projectionRoot: root("0123456789abcdef"[(pairOrdinal * 8 + conditionOrdinal) % 16]!),
      halfPoints,
    })),
  )
  const canonicalProjections = [...projections].sort((left, right) =>
    `${left.entrantCandidateRoot}:${left.opponentCandidateRoot}:${left.projectionRoot}`.localeCompare(`${right.entrantCandidateRoot}:${right.opponentCandidateRoot}:${right.projectionRoot}`),
  )
  const transport = canonical(options.reverse ? [...projections].reverse() : projections)
  const snapshot = createCompletePayoffSnapshot({
    populationRoot: root("f"),
    cellChunkRoots: [root("e")],
    solverPayoffRoot: labRoot("league-solver-payoffs-v1", canonicalProjections),
    expectedCellCount: projections.length,
    completedCellCount: projections.length,
  })
  if (options.byteMutation) transport[0] = transport[0]! ^ 1
  return { snapshot, transport }
}

const matchingPennies: readonly Pair[] = [
  [root("a"), root("b"), 2],
]

const cyclicMatrix = (size: number): number[][] => Array.from({ length: size }, (_, row) =>
  Array.from({ length: size }, (_, column) => column === (row + 1) % size ? 1 : column === (row + size - 1) % size ? -1 : 0),
)
const snapshotFromMatrix = (matrix: readonly (readonly number[])[], reverse = false) => {
  const candidates = matrix.map((_, ordinal) => labRoot("solver-test-candidate-v1", { ordinal }))
  const projections = matrix.flatMap((row, left) => row.flatMap((payoff, right) => left < right
    ? Array.from({ length: 8 }, (_, conditionOrdinal) => ({ entrantCandidateRoot: candidates[left]!, opponentCandidateRoot: candidates[right]!, projectionRoot: labRoot("solver-test-projection-v1", { left, right, conditionOrdinal }), halfPoints: (payoff + 1) as 0 | 1 | 2 }))
    : []))
  const ordered = [...projections].sort((left, right) => `${left.entrantCandidateRoot}:${left.opponentCandidateRoot}:${left.projectionRoot}`.localeCompare(`${right.entrantCandidateRoot}:${right.opponentCandidateRoot}:${right.projectionRoot}`))
  const snapshot = createCompletePayoffSnapshot({ populationRoot: root("d"), cellChunkRoots: [root("e")], solverPayoffRoot: labRoot("league-solver-payoffs-v1", ordered), expectedCellCount: ordered.length, completedCellCount: ordered.length })
  return { snapshot, transport: canonical(reverse ? [...projections].reverse() : projections), candidates }
}

describe("frozen empirical-game solver", () => {
  it("selects only a decisive exact synthetic candidate with committed golden and boundary evidence", () => {
    const spike = runLeagueSolverSpike()
    expect(spike.status).toBe("selected")
    if (spike.status === "selected") {
      expect(spike.selection.algorithm).toBe("exact-rational-pivoted-restricted-v1")
      expect(spike.selection.representation).toBe("bigint-rational-half-points-v1")
      expect(spike.comparisons).toHaveLength(2)
      expect(spike.comparisons.some((comparison) => comparison.candidate === spike.selection.algorithm && comparison.golden && comparison.permutation && comparison.boundary)).toBe(true)
    }
  })

  it("emits canonical exact output across repeat, source-order, worker, shard, and restart probes", () => {
    const forward = snapshotFor(matchingPennies)
    const reverse = snapshotFor(matchingPennies, { reverse: true })
    const outputs = [
      solveLeagueSnapshot({ snapshot: forward.snapshot, solverPayoffBytes: forward.transport, workerCount: 1, shardOrder: [0], restart: 0 }),
      solveLeagueSnapshot({ snapshot: forward.snapshot, solverPayoffBytes: forward.transport, workerCount: 4, shardOrder: [3, 1, 0, 2], restart: 1 }),
      solveLeagueSnapshot({ snapshot: reverse.snapshot, solverPayoffBytes: reverse.transport, workerCount: 2, shardOrder: [1, 0], restart: 2 }),
    ]
    expect(outputs.map((entry) => entry.status === "solved" ? entry.status : entry.failureCode)).toEqual(["solved", "solved", "solved"])
    const bytes = outputs.map((entry) => entry.canonicalBytes)
    expect(bytes[1]).toEqual(bytes[0])
    expect(bytes[2]).toEqual(bytes[0])
    const solved = outputs[0]
    if (!solved || solved.status !== "solved") throw new TypeError("TEST_SOLVER_FAILURE")
    expect(solved.weights).toEqual([{ candidateRoot: root("a"), numerator: "1", denominator: "1" }, { candidateRoot: root("b"), numerator: "0", denominator: "1" }])
    expect(solved.manifest.snapshotRoot).toBe(forward.snapshot.root)
  })

  it("does not trust a mutable typed-array transport and fails incomplete or tampered inputs explicitly", () => {
    const valid = snapshotFor(matchingPennies)
    const changed = snapshotFor(matchingPennies, { byteMutation: true })
    const incomplete = { ...valid.snapshot, completedCellCount: valid.snapshot.completedCellCount - 1 }
    const incompleteResult = solveLeagueSnapshot({ snapshot: incomplete, solverPayoffBytes: valid.transport })
    const changedResult = solveLeagueSnapshot({ snapshot: changed.snapshot, solverPayoffBytes: changed.transport })
    if (incompleteResult.status !== "failed" || changedResult.status !== "failed") throw new TypeError("TEST_SOLVER_SUCCESS")
    expect(incompleteResult.failureCode).toBe("SNAPSHOT_INCOMPLETE")
    expect(changedResult.failureCode).toBe("PAYOFF_TRANSPORT_INVALID")
  })

  it("solves 3x3 RPS and a full 12-entrant cyclic snapshot with exact normalized rational weights", () => {
    const rps = snapshotFromMatrix([[0, 1, -1], [-1, 0, 1], [1, -1, 0]])
    const twelve = snapshotFromMatrix(cyclicMatrix(12), true)
    const rpsResult = solveLeagueSnapshot({ snapshot: rps.snapshot, solverPayoffBytes: rps.transport })
    const twelveResult = solveLeagueSnapshot({ snapshot: twelve.snapshot, solverPayoffBytes: twelve.transport })
    if (rpsResult.status !== "solved" || twelveResult.status !== "solved") throw new TypeError("TEST_FULL_RESTRICTED_SOLVER")
    expect(rpsResult.weights).toEqual(rps.candidates.map((candidateRoot) => ({ candidateRoot, numerator: "1", denominator: "3" })))
    expect(twelveResult.weights).toEqual(twelve.candidates.map((candidateRoot) => ({ candidateRoot, numerator: "1", denominator: "12" })))
    expect(twelveResult.canonicalBytes).toEqual(solveLeagueSnapshot({ snapshot: twelve.snapshot, solverPayoffBytes: twelve.transport, workerCount: 12, shardOrder: [11, 0, 4], restart: 3 }).canonicalBytes)
  })

  it("reports a real exhausted pivot budget separately from malformed or incomplete matrix evidence", () => {
    const exhausted = runExactRestrictedGameCandidate({ matrix: [[0, 1, -1], [-1, 0, 1], [1, -1, 0]], pivotBudget: 0 })
    expect(exhausted.status).toBe("resource_exhausted")
  })
})
