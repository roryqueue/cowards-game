import { describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"

describe("bounded retry envelope v3 contract", () => {
  it("owns a fresh finite identity namespace and correction-aware history", () => {
    expect(V138_BOUNDED_RETRY_V3_POLICY).toMatchObject({
      schemaVersion: "retry-envelope:v3",
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 14_400_000,
      refusalSpacingMilliseconds: 300_000,
      calibrationFailureBackoffMilliseconds: 900_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
      rulesAuthority: "MATCH_KERNEL",
    })
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.routes).toEqual([
      "route:v3:0",
      "route:v3:1",
      "route:v3:2",
    ])
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations).toHaveLength(24)
    expect(V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY).toMatchObject({
      preResearchBaselineCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0",
      researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15",
      correctionV10Root:
        "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3",
      dispositionV2Root:
        "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f",
      lifecycleV2Root:
        "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6",
    })
  })
})
