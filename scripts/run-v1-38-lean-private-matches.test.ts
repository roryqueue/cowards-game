import { describe, expect, it } from "vitest"
import * as route from "./run-v1-38-lean-private-matches.js"

describe("dedicated private two-Match HOST route", () => {
  it("requires an explicit command and refuses default execution", () => {
    expect(() => route.parseLeanPrivateMatchesArgsV1([])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["run"])).toThrow()
    expect(() => route.parseLeanPrivateMatchesArgsV1(["metadata", "--source-store", "elsewhere"])).toThrow()
  })
  it("exports concrete public-board producer and independent compact reader", () => {
    expect(route.projectLeanPrivateBoardV1).toBeTypeOf("function")
    expect(route.produceLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
    expect(route.verifyLeanPrivateMatchEvidenceV1).toBeTypeOf("function")
  })
})
