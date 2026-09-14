import { describe, expect, it } from "vitest"
import { LAB_ADMITTED_ROOTS } from "../contracts.js"
import { createFactoryCalibrationManifest, createFactoryCalibrationReport, evaluateFactoryCalibrationCorpus } from "./calibration.js"

const root = (letter: string) => `sha256:${letter.repeat(64)}` as const

describe("factory independence calibration contracts", () => {
  it("labels the complete development-only mechanics corpus without inventing thresholds", () => {
    const observations = evaluateFactoryCalibrationCorpus()
    expect(observations.map((entry) => entry.caseId).sort()).toEqual([
      "expected-false-positive", "latent-divergence", "near-identical-behavior", "semantic-rewrite", "shared-selector", "symmetry-opaque-id",
    ].sort())
    expect(observations.every((entry) => entry.evidenceClass === "mechanics_only" && entry.independence === "unresolved")).toBe(true)
    const report = createFactoryCalibrationReport(observations)
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
      workloads: [{ artifactRoot: root("8"), root: root("9"), candidateIngestionArtifactRoot: root("5"), pairGroup: "pair-a" }],
    })
    expect(manifest.root).toMatch(/^sha256:/u)
    expect(JSON.stringify(manifest)).not.toMatch(/threshold|selector|phase263/iu)
    expect(() => createFactoryCalibrationManifest({ ...manifest, maxAttempts: Number.POSITIVE_INFINITY } as never)).toThrow()
    expect(() => createFactoryCalibrationReport(structuredClone(evaluateFactoryCalibrationCorpus()))).toThrow("UNISSUED")
  })
})
