import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { LEAGUE_EVALUATION_FIXTURES } from "./fixtures.js"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..")

describe("Phase 265 injected evaluation reference corpus", () => {
  it("indexes every required source-only group with machine-readable production coverage", () => {
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
    expect(LEAGUE_EVALUATION_FIXTURES.map((fixture) => fixture.expectedDisposition)).toEqual([
      "complete", "blocked", "process_invalid", "solved", "byte_identical", "byte_identical", "declared", "reenter",
      "retained", "classify", "separate", "robust_pure_finalist", "no_robust_pure_finalist_found", "complete", "process_invalid", "reject",
    ])
    for (const fixture of LEAGUE_EVALUATION_FIXTURES) {
      expect(fixture.evidenceClass).toBe("injected_fixture")
      expect(fixture.empiricalRequirementsComplete).toBe(false)
      expect(fixture.expectedDisposition.length).toBeGreaterThan(0)
      expect(fixture.prohibitedActions).toContain("empirical_dispatch")
      expect(fixture.coverage.testFile).toMatch(/(?:\.test\.ts)$/u)
      expect(fixture.coverage.testName.length).toBeGreaterThan(12)
      expect(fixture.coverage.assertion.length).toBeGreaterThan(12)
      const source = readFileSync(resolve(repositoryRoot, fixture.coverage.testFile), "utf8")
      expect(source).toContain(`it("${fixture.coverage.testName}"`)
    }
  })
})
