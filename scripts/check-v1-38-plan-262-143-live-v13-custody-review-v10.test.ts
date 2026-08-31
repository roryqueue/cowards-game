import { describe, expect, it } from "vitest"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  inspectV138Plan143Source, inspectV138Plan143Runtime, checkV138Plan143Absence,
  validateV138Plan143Execution, buildV138Plan143Review, authenticateV138Plan143Batch,
} from "./check-v1-38-plan-262-143-live-v13-custody-review-v10.js"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
describe("Plan143 independently authored custody reviewer", () => {
  it("independently authenticates exact closed Plan142 custody", () => {
    const value = inspectV138Plan143Source(ROOT)
    expect(value.sourceCommit).toBe("61c8ff9e8a28cb51c07d8aa1cacc9524cc83f7f3")
    expect(value.trackingCommit).toBe("7edcac4f5977ea8f006b1369536414c8006e64bd")
    expect(value.plan110Eligible).toBe(false)
  })
  it("independently discovers and pins every semantic runtime implementation byte", () => {
    const value = inspectV138Plan143Runtime(ROOT)
    expect(value.entries).toHaveLength(3931)
    expect(value.semanticRuntimeRoot).toBe("sha256:132282ee554dc0f2ade43cf4917c3049abab6eb64991be6d7daed0776b67754e")
  })
  it("requires descriptor-bound absence of all eleven destinations", () => {
    expect(checkV138Plan143Absence(ROOT)).toBe(true)
  })
  it("never treats fabricated execution or empty batch as evidence", () => {
    expect(() => validateV138Plan143Execution({}, "sha256:" + "0".repeat(64), "sha256:" + "0".repeat(64))).toThrow()
    expect(() => authenticateV138Plan143Batch([], ROOT)).toThrow()
    expect(typeof buildV138Plan143Review).toBe("function")
  })
})
