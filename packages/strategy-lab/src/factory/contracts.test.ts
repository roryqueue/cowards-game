import { describe, expect, it } from "vitest"
import {
  FactoryCandidateSchema,
  FactoryOraclePacketSchema,
  FactoryProposalSchema,
  FactoryValidationEvidenceSchema,
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFixture,
  factoryValidationFixture,
} from "./contracts.js"

describe("private factory contracts", () => {
  it("admits a strictly bounded private packet through the noncircular candidate stages", () => {
    const packet = FactoryOraclePacketSchema.parse(factoryOraclePacketFixture())
    const proposal = FactoryProposalSchema.parse(factoryProposalFixture(packet))
    const validation = FactoryValidationEvidenceSchema.parse(factoryValidationFixture(proposal))
    const candidate = FactoryCandidateSchema.parse(factoryCandidateFixture(proposal, validation))

    expect(candidate.proposal.root).toBe(proposal.root)
    expect(candidate.validation.root).toBe(validation.root)
    expect(Object.isFrozen(candidate.fingerprints)).toBe(true)
  })

  it("rejects mutable aliases, lane translations, missing lineage, unknown keys, and malformed identities", () => {
    const packet = factoryOraclePacketFixture()
    expect(() => FactoryOraclePacketSchema.parse({ ...packet, latest: "mutable" })).toThrow()
    expect(() => FactoryOraclePacketSchema.parse({ ...packet, source: { ...packet.source, sha256: "sha256:not-a-root" } })).toThrow()

    const proposal = factoryProposalFixture(FactoryOraclePacketSchema.parse(packet))
    expect(() => FactoryProposalSchema.parse({ ...proposal, nativeLane: { ...proposal.nativeLane, translation: "translated" } })).toThrow()
    const validation = FactoryValidationEvidenceSchema.parse(factoryValidationFixture(FactoryProposalSchema.parse(proposal)))
    const candidate = factoryCandidateFixture(FactoryProposalSchema.parse(proposal), validation)
    expect(() => FactoryCandidateSchema.parse({ ...candidate, lineage: { ...candidate.lineage, predecessorRoot: undefined } })).toThrow()
    expect(() => FactoryCandidateSchema.parse({ ...candidate, productionRevisionId: "forbidden" })).toThrow()
  })
})
