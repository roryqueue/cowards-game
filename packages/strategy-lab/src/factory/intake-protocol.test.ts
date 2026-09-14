import { describe, expect, it } from "vitest"
import { labRoot } from "../contracts.js"
import { admitFrozenIntakeProtocol, blockedIntakeConfiguration } from "./intake-protocol.js"
describe("frozen intake protocol", () => it("fails closed without a complete root-bound authorization", () => {
  expect(blockedIntakeConfiguration("incomplete_protocol").reason).toBe("incomplete_protocol")
  expect(() => admitFrozenIntakeProtocol({})).toThrow("INTAKE_PROTOCOL")
  const value = { schemaVersion: "frozen-intake-protocol-v1" as const, root: "sha256:" + "0".repeat(64), authorization: labRoot("auth", {}), disclosure: "source-and-provenance" as const, submissionLimit: 1, timeLimitMinutes: 1, reviewerLimit: 1, reviewerReuseLimit: 1, conflictsDeclared: true, confidentiality: "private" as const, provenanceRequired: true as const, validationRequired: true as const, acceptanceBudget: 1 }
  expect(() => admitFrozenIntakeProtocol(value)).toThrow()
}))
