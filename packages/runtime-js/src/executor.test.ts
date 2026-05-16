import { describe, expect, it } from "vitest"
import {
  createRuntimeViolation,
  toInvalidOutputViolation,
  toOversizedOutputViolation,
  toThrownExceptionViolation,
} from "./guards.js"

describe("runtime guard helpers", () => {
  it("maps ordinary exceptions to THROWN_EXCEPTION", () => {
    expect(toThrownExceptionViolation(new Error("boom")).type).toBe(
      "THROWN_EXCEPTION",
    )
  })

  it("maps forbidden runtime errors to FORBIDDEN_CAPABILITY", () => {
    expect(
      toThrownExceptionViolation(new Error("FORBIDDEN_CAPABILITY: process"))
        .type,
    ).toBe("FORBIDDEN_CAPABILITY")
  })

  it("maps invalid output and oversized output violations", () => {
    expect(toInvalidOutputViolation("bad output").type).toBe("INVALID_OUTPUT")
    expect(toOversizedOutputViolation("too large").type).toBe(
      "OVERSIZED_OUTPUT",
    )
  })

  it("creates typed runtime violations", () => {
    expect(createRuntimeViolation("TIMEOUT", "too slow")).toEqual({
      type: "TIMEOUT",
      message: "too slow",
    })
  })
})
