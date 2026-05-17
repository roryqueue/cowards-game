import { describe, expect, it } from "vitest"
import {
  formatValidationIssueHeading,
  getDraftStatusLabel,
  validationStateFromReport,
} from "./workshop-client-state.js"

describe("Strategy Workshop validation helpers", () => {
  it("formats the Strategy Workshop status labels", () => {
    expect(getDraftStatusLabel("not-checked")).toBe("Not checked")
    expect(getDraftStatusLabel("checking")).toBe("Checking...")
    expect(getDraftStatusLabel("valid")).toBe("Valid draft")
    expect(getDraftStatusLabel("invalid")).toBe("Invalid draft")
  })

  it("formats validation rows as ERROR · MISSING_DEFAULT_EXPORT", () => {
    expect(
      formatValidationIssueHeading({
        code: "MISSING_DEFAULT_EXPORT",
        severity: "error",
        message: "Strategy source must contain export default",
      }),
    ).toBe("ERROR · MISSING_DEFAULT_EXPORT")
  })

  it("derives invalid state from a failed validation report", () => {
    expect(
      validationStateFromReport(
        {
          valid: false,
          errors: [
            {
              code: "MISSING_DEFAULT_EXPORT",
              severity: "error",
              message: "Strategy source must contain export default",
            },
          ],
          warnings: [],
          sourceBytes: 17,
          forbiddenPatterns: [],
          sourceHash: "sourceHash",
          runtimeVersion: "runtime-js-v1",
          engineCompatibility: {
            spec: "spec-v1",
            engine: "engine-v1",
          },
        },
        false,
      ),
    ).toBe("invalid")
  })
})
