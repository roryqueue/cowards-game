import { describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS } from "../contracts.js"
import { FACTORY_CALIBRATION_CORPUS, createFactoryCalibrationReport, createFactoryCalibrationManifest } from "./calibration.js"

const root = (letter: string) => `sha256:${letter.repeat(64)}` as const

describe("factory independence calibration contracts", () => {
  it("labels the complete development-only mechanics corpus without inventing thresholds", () => {
    expect(FACTORY_CALIBRATION_CORPUS.map((entry) => entry.caseKind).sort()).toEqual([
      "expected_false_positive", "latent_divergence", "near_identical_behavior", "semantic_rewrite", "shared_selector_variant", "symmetry_opaque_id_variant",
    ].sort())
    expect(FACTORY_CALIBRATION_CORPUS.every((entry) => entry.evidenceClass === "mechanics_only" && entry.split === "development")).toBe(true)
    const report = createFactoryCalibrationReport(FACTORY_CALIBRATION_CORPUS.map((entry) => ({ caseId: entry.caseId, dimensionRoots: [root("a"), root("b")] })))
    expect(report.thresholds).toBeNull()
    expect(report.readiness).toBe("authorization_required")
  })

  it("accepts only a fresh roots-only authorized manifest with finite bounds", () => {
    const manifest = createFactoryCalibrationManifest({
      authorizationRoot: root("1"), authorizationArtifactRoot: root("a"), protocolRoot: root("2"), protocolArtifactRoot: root("b"), allocationRoot: root("3"), allocationArtifactRoot: root("c"),
      studyPolicyRoot: "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",
      measurementPolicyRoot: "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",
      maxAttempts: 4, maxInvocationsPerAttempt: 64, maxLifetimeMs: 120_000,
      supervision: { adapterId: "runtime-js-container-subprocess", runtimeAbi: "strategy-runtime-abi-v1.19", image: LAB_ADMITTED_ROOTS.image, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot },
      ingestions: [{ artifactRoot: root("5"), packetRoot: root("6"), sourceRoot: root("7"), producerIdentity: "emitTacticalFactoryPacket", origin: "tactical-oracle", evidenceClass: "real_producer" }],
    })
    expect(manifest.root).toMatch(/^sha256:/u)
    expect(JSON.stringify(manifest)).not.toMatch(/threshold|selector|phase263/iu)
    expect(() => createFactoryCalibrationManifest({ ...manifest, maxAttempts: Number.POSITIVE_INFINITY } as never)).toThrow()
  })
})
