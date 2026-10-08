/** Source-only gates: no empirical reader, provider, allocation or dispatch. */
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { leanTwoPairDocumentsV11, leanCorrectionSourceManifest, authenticateLeanCorrectionReview } from "./run-v1-38-lean-correction.js"
import { LEAN_REMAINING_V9_PHASE, LEAN_TWO_PAIR_V11_EXTENSION, LEAN_TWO_PAIR_V11_REPORT_PATHS, leanBytesRoot } from "../packages/strategy-lab/src/league/lean-experiment.js"

describe("v11 compile-once prospective source gate", () => {
  it("preserves mode-one old review mapping and requires fresh mode-two review v3", () => {
    for (const route of ["diagnostic", "baseline"] as const) {
      expect(leanTwoPairDocumentsV11(route, "v11-1").review).toBe(`${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-SOURCE-REVIEW-v2.md`)
      expect(leanTwoPairDocumentsV11(route, "v11-2").review).toBe(`${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-SOURCE-REVIEW-v3.md`)
    }
  })
  it("positively inventories every new source gate report without replacing old custody", () => {
    for (const name of ["SOURCE-REVIEW-v2", "SOURCE-REVIEW-v3", "COMPILE-ONCE-RESEARCH-v1", "COMPILE-ONCE-PLAN-v1", "COMPILE-ONCE-PLAN-CHECK-v1", "COMPILE-ONCE-SOURCE-SUMMARY-v1", "COMPILE-ONCE-REVIEW-v1", "COMPILE-ONCE-VALIDATION-v1", "COMPILE-ONCE-SOURCE-VERIFICATION-v1"]) {
      expect(LEAN_TWO_PAIR_V11_REPORT_PATHS).toContain(`${LEAN_REMAINING_V9_PHASE}265-16-TWO-PAIR-${name}.md`)
    }
    expect(new Set(LEAN_TWO_PAIR_V11_REPORT_PATHS).size).toBe(LEAN_TWO_PAIR_V11_REPORT_PATHS.length)
  })
  it("binds both ordinals to exact source and rejects old review under changed source", () => {
    const one = leanCorrectionSourceManifest("v11-1", LEAN_TWO_PAIR_V11_EXTENSION), two = leanCorrectionSourceManifest("v11-2", LEAN_TWO_PAIR_V11_EXTENSION)
    expect(two).toEqual(one)
    expect(one.entries.map(row => row.path)).toContain("packages/runtime-js/src/revision-compile-once.test.ts")
    expect(one.entries.map(row => row.path)).toContain("scripts/run-v1-38-lean-compile-once.test.ts")
    const path = leanTwoPairDocumentsV11("diagnostic", "v11-1").review, bytes = readFileSync(path)
    expect(() => authenticateLeanCorrectionReview(path, leanBytesRoot(bytes), two.root, null, undefined, "v11-2", LEAN_TWO_PAIR_V11_EXTENSION)).toThrow("REVIEW")
  })
})
