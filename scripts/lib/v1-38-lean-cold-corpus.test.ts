import { describe, it, expect } from "vitest"
import { SoldierBrainInputV119Schema } from "@cowards/spec"
import { buildLeanColdCorpus } from "./v1-38-lean-cold-corpus.js"
describe("nonlearned current-rules cold corpus", () => {
  it("retains 64 legal canonical prefix observations and an actual bounded teacher receipt", () => {
    const corpus = buildLeanColdCorpus("lean-source-test")
    expect(corpus.tacticalInputs).toHaveLength(64)
    expect(corpus.tacticalInputs.every(v => SoldierBrainInputV119Schema.safeParse(v).success)).toBe(true)
    expect(corpus.teacherSearchReceipts[0]?.nodesVisited).toBe(64)
    expect(corpus.teacherSearchReceipts[0]?.selectedLegalTargets.length).toBeGreaterThan(0)
    expect(buildLeanColdCorpus("lean-source-test").corpusRoot).toBe(corpus.corpusRoot)
  })
})
