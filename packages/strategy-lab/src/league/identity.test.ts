import { describe, expect, it } from "vitest"
import { deriveLeaguePopulationRoot, deriveLeagueSnapshotRoot, deriveLeagueUnorderedPairRoot, validateLeagueRoot } from "./identity.js"

const root = (letter: string) => `sha256:${letter.repeat(64)}` as const

describe("league identity spine", () => {
  it("derives equal roots for equal values and changes roots for semantic changes or domains", () => {
    const population = { root: root("0"), candidateAdmissionRoots: [root("a"), root("b")], studyPolicyRoot: root("c"), measurementPolicyRoot: root("d") }
    expect(deriveLeaguePopulationRoot(population)).toBe(deriveLeaguePopulationRoot({ ...population }))
    expect(deriveLeaguePopulationRoot({ ...population, measurementPolicyRoot: root("e") })).not.toBe(deriveLeaguePopulationRoot(population))
    expect(deriveLeaguePopulationRoot(population)).not.toBe(deriveLeagueSnapshotRoot(population))
  })

  it("normalizes an unordered pair using only immutable candidate roots", () => {
    const a = { candidateRoots: [root("b"), root("a")], displayIds: ["late", "early"], completionOrder: 9 }
    const b = { candidateRoots: [root("a"), root("b")], displayIds: ["anything", "else"], completionOrder: 0 }
    expect(deriveLeagueUnorderedPairRoot(a)).toBe(deriveLeagueUnorderedPairRoot(b))
  })

  it("rejects a supplied root that does not rederive for its league domain", () => {
    const value = { root: root("f"), snapshotRoot: root("a"), algorithmRoot: root("b"), numericPolicyRoot: root("c"), resourcePolicyRoot: root("d") }
    expect(() => validateLeagueRoot("league-solver-manifest-v1", value)).toThrow()
  })
})
