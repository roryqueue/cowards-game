import { describe, expect, it } from "vitest"
import { LEAGUE_EVALUATION_FIXTURES } from "./fixtures.js"

describe("Phase 265 injected evaluation reference corpus", () => {
  it("indexes every required source-only group with a rooted disposition", () => {
    expect(LEAGUE_EVALUATION_FIXTURES).toHaveLength(16)
    expect(LEAGUE_EVALUATION_FIXTURES.map((fixture) => fixture.id)).toEqual([
      "complete-alias-aware-matrix",
      "matrix-fault-families",
      "invalid-and-system-terminals",
      "degenerate-solver",
      "permutation-and-numeric-boundary",
      "repeat-layout-and-replay",
      "round-targets",
      "accepted-counter-reentry",
      "charged-outcomes",
      "clone-and-novelty",
      "mixture-and-portfolio",
      "robust-pure-pass",
      "no-finalist",
      "nine-probes",
      "hostile-runtime",
      "safe-projection-denial",
    ])
    for (const fixture of LEAGUE_EVALUATION_FIXTURES) {
      expect(fixture.evidenceClass).toBe("injected_fixture")
      expect(fixture.empiricalRequirementsComplete).toBe(false)
      expect(fixture.root).toMatch(/^sha256:[0-9a-f]{64}$/u)
      expect(fixture.expectedDisposition.length).toBeGreaterThan(0)
      expect(fixture.prohibitedActions).toContain("empirical_dispatch")
    }
  })
})
