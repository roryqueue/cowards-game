import { admitCanonicalJsonValue } from "@cowards/spec"
import { describe, expect, it } from "vitest"
import { labRoot, type LabRoot } from "../contracts.js"
import { createCompletePayoffSnapshot } from "./contracts.js"
import { runLeagueSolverSpike, solveLeagueSnapshot } from "./solver.js"

const root = (letter: string): LabRoot => `sha256:${letter.repeat(64)}` as LabRoot
const encoder = new TextEncoder()

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

describe("frozen empirical-game solver", () => {
  it("selects only a decisive exact synthetic candidate with committed golden and boundary evidence", () => {
    const spike = runLeagueSolverSpike()
    expect(spike.status).toBe("selected")
    if (spike.status === "selected") {
      expect(spike.selection.algorithm).toBe("exact-rational-pivoted-restricted-v1")
      expect(spike.selection.representation).toBe("bigint-rational-half-points-v1")
      expect(spike.comparisons.every((comparison) => comparison.candidate !== "inconclusive")).toBe(true)
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
    expect(outputs.every((entry) => entry.status === "solved")).toBe(true)
    const bytes = outputs.map((entry) => entry.canonicalBytes)
    expect(bytes[1]).toEqual(bytes[0])
    expect(bytes[2]).toEqual(bytes[0])
    const solved = outputs[0]
    if (solved.status === "solved") {
      expect(solved.weights).toEqual([{ candidateRoot: root("a"), numerator: "1", denominator: "1" }, { candidateRoot: root("b"), numerator: "0", denominator: "1" }])
      expect(solved.manifest.snapshotRoot).toBe(forward.snapshot.root)
    }
  })

  it("does not trust a mutable typed-array transport and fails incomplete or tampered inputs explicitly", () => {
    const valid = snapshotFor(matchingPennies)
    const changed = snapshotFor(matchingPennies, { byteMutation: true })
    const incomplete = { ...valid.snapshot, completedCellCount: valid.snapshot.completedCellCount - 1 }
    expect(solveLeagueSnapshot({ snapshot: incomplete, solverPayoffBytes: valid.transport }).failureCode).toBe("SNAPSHOT_INCOMPLETE")
    expect(solveLeagueSnapshot({ snapshot: changed.snapshot, solverPayoffBytes: changed.transport }).failureCode).toBe("PAYOFF_TRANSPORT_INVALID")
    expect(() => encoder.decode(valid.transport)).not.toThrow()
  })
})
