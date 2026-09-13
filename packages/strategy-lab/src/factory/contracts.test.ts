import { describe, expect, it } from "vitest"
import {
  FactoryCandidateSchema,
  FactoryOraclePacketSchema,
  FactoryProposalSchema,
  FactoryValidationEvidenceSchema,
  factoryCandidateFixture,
  factoryOraclePacketFixture,
  factoryProposalFromPacket,
  factoryProposalFixture,
  factoryValidationFixture,
} from "./contracts.js"
import { deriveFactoryOraclePacketRoot } from "./identity.js"

describe("private factory contracts", () => {
  it("admits a strictly bounded private packet through the noncircular candidate stages", () => {
    const packet = FactoryOraclePacketSchema.parse(factoryOraclePacketFixture())
    const proposal = factoryProposalFromPacket(packet)
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

  it("requires the actual inherited engine and runtime authority while allowing oracle-specific algorithms", () => {
    const packet = factoryOraclePacketFixture()
    const withAlgorithm = { ...packet, versions: { ...packet.versions, algorithm: "different-oracle-strategy-v2" } }
    expect(FactoryOraclePacketSchema.parse({ ...withAlgorithm, root: deriveFactoryOraclePacketRoot(withAlgorithm) }).versions.algorithm).toBe("different-oracle-strategy-v2")

    for (const [field, replacement] of [
      ["admittedRoot", `sha256:${"1".repeat(64)}`],
      ["sourceClosureRoot", `sha256:${"2".repeat(64)}`],
      ["compatibilityTupleRoot", `sha256:${"3".repeat(64)}`],
      ["runtimeProfileRoot", `sha256:${"4".repeat(64)}`],
      ["runtimeAbi", "unapproved-runtime-abi"],
      ["labSchema", "unapproved-lab-schema"],
    ] as const) {
      const changed = {
        ...packet,
        inheritedAuthority: { ...packet.inheritedAuthority, [field]: replacement },
      }
      expect(() => FactoryOraclePacketSchema.parse({ ...changed, root: deriveFactoryOraclePacketRoot(changed) })).toThrow()
    }
    const changedBuild = {
      ...packet,
      build: { ...packet.build, compatibilityTupleRoot: `sha256:${"5".repeat(64)}` },
    }
    expect(() => FactoryOraclePacketSchema.parse({ ...changedBuild, root: deriveFactoryOraclePacketRoot(changedBuild) })).toThrow()
    const changedRuntime = {
      ...packet,
      nativeLane: { ...packet.nativeLane, runtimeProfileRoot: `sha256:${"6".repeat(64)}` },
    }
    expect(() => FactoryOraclePacketSchema.parse({ ...changedRuntime, root: deriveFactoryOraclePacketRoot(changedRuntime) })).toThrow()
  })
})
