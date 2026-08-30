import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  checkV138SupplementV3AdapterSourceOnly,
  V138_SUPPLEMENT_V3_ADAPTER_SELECTORS,
} from "./run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.js"

const repoRoot = path.resolve(import.meta.dirname, "..")

describe("Plan 262-115 source-only supplement-v3 adapter", () => {
  it("proves the historical Plan-114 and live-v10 CLIs remain unchanged and lack supplement selectors", () => {
    for (const repoPath of [
      "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts",
      "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
    ]) {
      const source = readFileSync(path.join(repoRoot, repoPath), "utf8")
      expect(source).not.toContain('args[0] === "--write-supplement-v3"')
      expect(source).not.toContain('args[0] === "--check-supplement-v3"')
    }
  })

  it("exposes exactly source, exclusive-write, and committed-check selectors", () => {
    expect(V138_SUPPLEMENT_V3_ADAPTER_SELECTORS).toEqual([
      "--check-source-only",
      "--write-supplement-v3",
      "--check-supplement-v3",
    ])
    const source = readFileSync(path.join(
      repoRoot,
      "scripts/run-v1-38-bounded-retry-envelope-v3-supplement-v3-adapter-v1.ts",
    ), "utf8")
    expect(source).not.toMatch(/check-reviewed-live-ready|run-reviewed-bounded-live-envelope/)
    expect(source).not.toMatch(/runV138V3ProductionLive|runV138ReviewedBoundedLiveEnvelope/)
    expect(source).not.toMatch(/injected|writeOutput|generic-output/)
    expect(source).not.toMatch(/from ["'].+plan-262-114|from ["'].+live-v10/)
  })

  it("independently authenticates authoritative v2, final-clean custody, and exact zero pair", () => {
    expect(checkV138SupplementV3AdapterSourceOnly(repoRoot)).toMatchObject({
      status: "source_only_checked",
      plan114PublicationCommit: "34bc94ec4e348f71e6055a091d60a505cffc0d79",
      plan114PayloadRoot: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac",
      plan114ReviewRoot: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee",
      plan114CarrierRoot: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26",
      finalCleanReviewCommit: "92415ea08ccddd2c8fae3c8fc922078d14c589c9",
      plan109Eligible: true,
      envelopeStatus: "sealed_inactive",
      counters: {
        acceptedCells: 0,
        calibrationIdentitiesCharged: 0,
        preflightObservationsConsumed: 0,
        reproductionIdentitiesCharged: 0,
        routeStartsConsumed: 0,
      },
      createsEnvelope: false,
      createsCapacity: false,
      resetsCounters: false,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })
  }, 180_000)
})
