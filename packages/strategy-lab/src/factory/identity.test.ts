import { describe, expect, it } from "vitest"
import {
  FactoryCandidateSchema,
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFixture,
  factoryValidationFixture,
} from "./contracts.js"
import {
  deriveFactoryCandidateRoot,
  deriveFactoryOraclePacketRoot,
  deriveFactoryProposalRoot,
  deriveFactoryValidationRoot,
} from "./identity.js"

describe("factory domain-separated roots", () => {
  it("is stable for canonical input and changes for source, provider, prompt, validation, correction, or lineage", () => {
    const packet = factoryOraclePacketFixture()
    expect(deriveFactoryOraclePacketRoot(packet)).toBe(deriveFactoryOraclePacketRoot(structuredClone(packet)))
    expect(deriveFactoryOraclePacketRoot({ ...packet, provider: { ...packet.provider, providerId: "provider-b" } })).not.toBe(deriveFactoryOraclePacketRoot(packet))
    expect(deriveFactoryOraclePacketRoot({ ...packet, provider: { ...packet.provider, promptRoot: `sha256:${"b".repeat(64)}` } })).not.toBe(deriveFactoryOraclePacketRoot(packet))

    const proposal = factoryProposalFixture(packet)
    expect(deriveFactoryProposalRoot({ ...proposal, source: { ...proposal.source, sha256: `sha256:${"c".repeat(64)}`, root: `sha256:${"c".repeat(64)}` } })).not.toBe(deriveFactoryProposalRoot(proposal))
    const validation = factoryValidationFixture(proposal)
    expect(deriveFactoryValidationRoot({ ...validation, validationRoot: `sha256:${"d".repeat(64)}` })).not.toBe(deriveFactoryValidationRoot(validation))
    const candidate = FactoryCandidateSchema.parse(factoryCandidateFixture(proposal, validation))
    expect(deriveFactoryCandidateRoot({ ...candidate, lineage: { ...candidate.lineage, correctionRoot: `sha256:${"e".repeat(64)}` } })).not.toBe(deriveFactoryCandidateRoot(candidate))
  })
})
