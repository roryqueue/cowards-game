import { describe, expect, it } from "vitest"
import { verifyFactoryAuthoringRecords } from "./v1-38-factory-execution-evidence.js"

describe("factory empirical authorship prerequisite", () => {
  it("rejects missing author attempts rather than counting a model label", () => {
    expect(() => verifyFactoryAuthoringRecords({} as never, [], {})).toThrow("FACTORY_EXECUTION_AUTHOR_ATTEMPTS")
  })
  it("rejects a fifth attempt before opening any evidence", () => {
    expect(() => verifyFactoryAuthoringRecords({} as never, Array(5).fill({}), {})).toThrow("FACTORY_EXECUTION_AUTHOR_ATTEMPTS")
  })
})
