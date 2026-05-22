import { describe, expect, it } from "vitest"
import {
  EXHIBITION_SCORING_POLICY_V1,
  type PublicMatchSetResultDto,
} from "@cowards/spec"
import { createCowardsLocalService } from "./index.js"

const publicResult = {
  matchSetId: "match-set:demo",
  preset: {
    id: "smoke-exhibition-v1",
    version: "v1",
    label: "Smoke exhibition",
  },
  status: "complete",
  visibility: "public",
  scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  entrants: [],
  standings: [],
  matches: [],
  provenance: {
    matchSetId: "match-set:demo",
    presetId: "smoke-exhibition-v1",
    scoringPolicyVersion: "v1",
    entrantSnapshotIds: [],
    chronicleHashes: [],
  },
  publication: {
    publicResults: true,
    publicReplayEvidence: true,
    privateFieldsExcluded: ["Strategy source"],
  },
} satisfies PublicMatchSetResultDto

describe("createCowardsLocalService", () => {
  it("returns stable health metadata", () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
    })

    expect(service.health()).toEqual({
      ok: true,
      service: "cowards-service",
      version: "service-api-v1.7",
    })
  })

  it("wraps public MatchSet summaries in a service envelope", async () => {
    const service = createCowardsLocalService({
      withPool: async (fn) => fn({} as never),
      buildPublicMatchSetResult: async (_pool, _matchSetId) => publicResult,
    })

    await expect(
      service.getPublicMatchSetSummary("match-set:demo"),
    ).resolves.toEqual({
      apiVersion: "service-api-v1.7",
      kind: "publicMatchSetSummary",
      matchSetId: "match-set:demo",
      result: publicResult,
    })
  })
})
