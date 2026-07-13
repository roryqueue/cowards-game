import { describe, expect, it } from "vitest"
import { importVerifiedRuntimeEvidenceAttestation } from "./runtime-evidence-import.js"

describe("verified runtime evidence import", () => {
  it("exposes one verifier-backed certificate import path", () => {
    expect(importVerifiedRuntimeEvidenceAttestation).toBeTypeOf("function")
  })
})
