import { describe, expect, it } from "vitest"
import { defaultRuntimeMetadata } from "@cowards/spec"
import {
  buildExhibitionDuplicateKey,
  evaluateRateLimit,
  generateCompetitionPairwiseMatrix,
  validateManualExhibitionRevisionIds,
} from "./competition.js"

const entrants = [
  {
    entrantId: "entrant:0",
    entrantIndex: 0,
    strategyRevisionId: "strategy-revision:a",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / A / hash-a",
    sourceHash: "hash-a",
    sourceBytes: 120,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    entrantId: "entrant:1",
    entrantIndex: 1,
    strategyRevisionId: "strategy-revision:b",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / B / hash-b",
    sourceHash: "hash-b",
    sourceBytes: 128,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
  {
    entrantId: "entrant:2",
    entrantIndex: 2,
    strategyRevisionId: "strategy-revision:c",
    ownerUserId: "user:alpha",
    ownerHandle: "alpha",
    displayLabel: "@alpha / C / hash-c",
    sourceHash: "hash-c",
    sourceBytes: 136,
    runtime: defaultRuntimeMetadata(),
    engineCompatibility: { spec: "spec-v1", engine: "engine-v1" },
    lockedAt: "2026-05-19T00:00:00.000Z",
  },
]

describe("competition helpers", () => {
  it("allows 2-8 distinct owned revisions for manual exhibitions", () => {
    expect(() =>
      validateManualExhibitionRevisionIds([
        "strategy-revision:a",
        "strategy-revision:b",
      ]),
    ).not.toThrow()
    expect(() =>
      validateManualExhibitionRevisionIds(["strategy-revision:a"]),
    ).toThrow(/2-8/)
    expect(() =>
      validateManualExhibitionRevisionIds([
        "strategy-revision:a",
        "strategy-revision:a",
      ]),
    ).toThrow(/distinct/)
  })

  it("builds duplicate keys independent of selected revision order", () => {
    expect(
      buildExhibitionDuplicateKey({
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:b", "strategy-revision:a"],
      }),
    ).toBe(
      buildExhibitionDuplicateKey({
        creatorUserId: "user:alpha",
        presetId: "smoke-exhibition-v1",
        revisionIds: ["strategy-revision:a", "strategy-revision:b"],
      }),
    )
  })

  it("generates mirrored pairwise Match matrices without collapsing same-user entrants", () => {
    const matches = generateCompetitionPairwiseMatrix({
      matchSetId: "match-set:exhibition:test",
      presetId: "smoke-exhibition-v1",
      entrants,
    })

    expect(matches).toHaveLength(6)
    expect(
      matches.map((match) => [
        match.bottomStrategyRevisionId,
        match.topStrategyRevisionId,
      ]),
    ).toEqual([
      ["strategy-revision:a", "strategy-revision:b"],
      ["strategy-revision:b", "strategy-revision:a"],
      ["strategy-revision:a", "strategy-revision:c"],
      ["strategy-revision:c", "strategy-revision:a"],
      ["strategy-revision:b", "strategy-revision:c"],
      ["strategy-revision:c", "strategy-revision:b"],
    ])
  })

  it("returns retry-after information once exhibition create limits are exceeded", () => {
    const now = new Date("2026-05-19T00:10:00.000Z")
    expect(
      evaluateRateLimit({
        count: 4,
        now,
        policy: { limit: 5, windowSeconds: 600 },
      }),
    ).toEqual({ allowed: true })
    expect(
      evaluateRateLimit({
        count: 5,
        oldestEventAt: new Date("2026-05-19T00:05:00.000Z"),
        now,
        policy: { limit: 5, windowSeconds: 600 },
      }),
    ).toEqual({ allowed: false, retryAfterSeconds: 300 })
  })
})
