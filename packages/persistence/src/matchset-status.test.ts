import { describe, expect, it } from "vitest"
import { determineSuccessorMatchSetStatusV119 } from "./matchset-status.js"

describe("runtime-v1.19 MatchSet status", () => {
  it("distinguishes exact countable, retryable pending, and exhausted degraded matrices", () => {
    expect(
      determineSuccessorMatchSetStatusV119({
        canonicalConditionCount: 4,
        validTerminalConditionCount: 4,
        retryableSystemFailure: false,
        exhaustedSystemFailure: false,
        invalidRevisionEvidence: false,
      }),
    ).toEqual({ status: "complete", counted: true })
    expect(
      determineSuccessorMatchSetStatusV119({
        canonicalConditionCount: 4,
        validTerminalConditionCount: 3,
        retryableSystemFailure: true,
        exhaustedSystemFailure: false,
        invalidRevisionEvidence: false,
      }),
    ).toEqual({ status: "pending", counted: false })
    expect(
      determineSuccessorMatchSetStatusV119({
        canonicalConditionCount: 4,
        validTerminalConditionCount: 3,
        retryableSystemFailure: false,
        exhaustedSystemFailure: true,
        invalidRevisionEvidence: false,
      }),
    ).toEqual({ status: "degraded", counted: false })
    expect(
      determineSuccessorMatchSetStatusV119({
        canonicalConditionCount: 4,
        validTerminalConditionCount: 4,
        retryableSystemFailure: false,
        exhaustedSystemFailure: false,
        invalidRevisionEvidence: true,
      }),
    ).toEqual({ status: "pending", counted: false })
  })
})
