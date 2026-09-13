import { describe, expect, it } from "vitest"
import { createHash } from "node:crypto"
import { factoryCandidateFixture, factoryOraclePacketFixture, factoryProposalFixture, factoryValidationFixture } from "./contracts.js"
import { admitFactory, mapFactorySupervision } from "./admission.js"

const source = new TextEncoder().encode("export default {}")
const sourceRoot = `sha256:${createHash("sha256").update(source).digest("hex")}` as const

describe("hostile private candidate admission", () => {
  it("accepts bytes only as data and maps supervision failure to unscored private evidence", () => {
    const packet = factoryOraclePacketFixture()
    const proposal = factoryProposalFixture({ ...packet, source: { ...packet.source, root: sourceRoot, sha256: sourceRoot, byteLength: source.byteLength } })
    const validation = factoryValidationFixture(proposal)
    const candidate = factoryCandidateFixture(proposal, validation)
    expect(admitFactory({ packet, candidate, sourceBytes: source }).sourceRoot).toBe(sourceRoot)
    expect(mapFactorySupervision({ kind: "failure", privacy: "private_offline", transitions: [], unchangedState: null, failure: { classification: "system_failure", code: "DENIED" }, accounting: [] })).toMatchObject({ disposition: "system_failure", scoredAsGameplay: false })
  })

  it("rejects source mismatch and never converts failures into gameplay", () => {
    const packet = factoryOraclePacketFixture()
    const proposal = factoryProposalFixture(packet)
    const validation = factoryValidationFixture(proposal)
    expect(() => admitFactory({ packet, candidate: factoryCandidateFixture(proposal, validation), sourceBytes: source })).toThrow()
  })
})
