import { describe, expect, it } from "vitest"
import {
  publicSystemFailureMessage,
  redactedDiagnostics,
  redactedErrorMessage,
} from "./redaction.js"

const forbiddenMarkers = [
  "export default",
  "StrategyMemory",
  "strategyMemory",
  "SoldierMemory",
  "soldierMemory",
  "objectivePayload",
  "objective payload",
  "ownerDebug",
  "owner debug",
  "Awareness Grid",
  "stack trace",
  "stderr",
  "sessionId",
  "session secret",
  "token",
  "postgres://user:pass@localhost:5432/cowards",
  "mysql://user:pass@localhost:3306/cowards",
  "/Users/local/private.ts",
  "/home/local/private.ts",
  "private runtime internals",
] as const

describe("runtime service redaction", () => {
  it("redacts D-17 forbidden markers from serialized diagnostics", () => {
    const diagnostics = redactedDiagnostics(
      Object.fromEntries(
        forbiddenMarkers.map((marker, index) => [
          `field${index}`,
          `unsafe ${marker} diagnostic`,
        ]),
      ),
    )
    const text = JSON.stringify(diagnostics)

    for (const marker of forbiddenMarkers) {
      expect(text.toLowerCase()).not.toContain(marker.toLowerCase())
    }
    expect(text).toContain("[redacted]")
  })

  it("redacts D-17 forbidden markers from thrown error messages", () => {
    const message = redactedErrorMessage(
      new Error(`boom ${forbiddenMarkers.join(" | ")}`),
    )

    for (const marker of forbiddenMarkers) {
      expect(message.toLowerCase()).not.toContain(marker.toLowerCase())
    }
    expect(message).toContain("[redacted]")
  })

  it("uses a stable public failure message for every system failure code", () => {
    expect(publicSystemFailureMessage("MALFORMED_REQUEST")).toBe(
      "Runtime execution failed before completion.",
    )
    expect(publicSystemFailureMessage("EXECUTION_EXCEPTION")).toBe(
      "Runtime execution failed before completion.",
    )
  })
})
