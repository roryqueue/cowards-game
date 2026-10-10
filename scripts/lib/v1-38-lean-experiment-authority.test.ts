import { describe, expect, it } from "vitest"
import * as authority from "./v1-38-lean-experiment-authority.js"

describe("private probe authority surface", () => {
  it("exports a distinct admission opener, debit issuer, and ordered claim", () => {
    expect(authority.openLeanPrivateProbeAdmissionV1).toBeTypeOf("function")
    expect(authority.recordAndIssueLeanPrivateProbeRuntimeAuthorityV1).toBeTypeOf("function")
    expect(authority.claimLeanPrivateProbeRuntimeAuthority).toBeTypeOf("function")
  })

  it("does not treat caller-created capability-shaped objects as authority", () => {
    const fabricated = { schemaVersion: "lean-private-probe-runtime-authority-v1" }
    expect(() => authority.claimLeanPrivateProbeRuntimeAuthority(fabricated as never, {} as never, "factory")).toThrow("LEAN_PRIVATE_PROBE_AUTHORITY")
  })
})
