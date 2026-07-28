import { describe, expect, it } from "vitest"
import {
  MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1,
  getMatchExecutionContractFixtureByMatchSetId,
} from "@cowards/spec"
import {
  createMatchExecutionFixturePublicReadClient,
  isMatchExecutionFixtureEnabled,
} from "./match-execution-fixture-adapter.js"

describe("match execution fixture adapter", () => {
  it("is disabled outside explicit test or fixture modes", () => {
    expect(isMatchExecutionFixtureEnabled({})).toBe(false)
    expect(
      isMatchExecutionFixtureEnabled({
        NODE_ENV: "production",
        COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES: "1",
      }),
    ).toBe(false)
    expect(createMatchExecutionFixturePublicReadClient({})).toBeNull()
  })

  it("is enabled by test mode and serves schema-valid MatchSet fixtures", async () => {
    const client = createMatchExecutionFixturePublicReadClient({
      NODE_ENV: "test",
    })
    const fixture = getMatchExecutionContractFixtureByMatchSetId(
      "match-set:fixture:timeout",
    )
    expect(fixture?.app.matchSetSummary?.lifecycle.failureCategory).toBe(
      "timeout",
    )

    await expect(
      client?.getPublicMatchSetSummary("match-set%3Afixture%3Atimeout"),
    ).resolves.toEqual(fixture?.service.matchSetSummary)
  })

  it("covers required fixtures without production fallback", async () => {
    const client = createMatchExecutionFixturePublicReadClient({
      COWARDS_ENABLE_MATCH_EXECUTION_FIXTURES: "1",
    })
    expect(MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1).toContain(
      "public-safe-replay",
    )
    expect(MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1).not.toContain(
      "missing-chronicle",
    )
    expect(MATCH_EXECUTION_CONTRACT_FIXTURE_IDS_V1).not.toContain("no-result")
    await expect(
      client?.getPublicMatchSetSummary("match-set:does-not-exist"),
    ).resolves.toBeNull()
    await expect(
      client?.getPublicReplayMetadata("match:runtime-service:golden"),
    ).resolves.toMatchObject({
      kind: "publicReplayMetadata",
      matchId: "match:runtime-service:golden",
      metadata: {
        hash: "sha256:e6122e9111f64940929216db472648e7489a953af05bfbd6c0fdd91a9139b3f5",
        eventCount: 31,
        snapshotCount: 12,
        arenaVariantId: "arena-empty-12x12",
      },
    })
    await expect(
      client?.getPublicReplayMetadata("match:fixture:public-safe-replay"),
    ).resolves.toMatchObject({
      kind: "publicReplayMetadata",
      matchId: "match:runtime-service:golden",
      metadata: {
        eventCount: 31,
        snapshotCount: 12,
      },
    })
    await expect(
      client?.getPublicReplayEvidence("match:runtime-service:golden"),
    ).resolves.toMatchObject({
      kind: "publicReplayEvidence",
      matchId: "match:runtime-service:golden",
      metadata: {
        hash: "sha256:e6122e9111f64940929216db472648e7489a953af05bfbd6c0fdd91a9139b3f5",
        eventCount: 31,
        snapshotCount: 12,
        arenaVariantId: "arena-empty-12x12",
        outcome: { type: "DRAW" },
      },
      projection: {
        reproducibility: {
          matchId: "match:runtime-service:golden",
          arenaVariantId: "arena-empty-12x12",
        },
      },
    })
    const evidence = await client?.getPublicReplayEvidence(
      "match:runtime-service:golden",
    )
    expect(evidence?.projection.events).toHaveLength(31)
    expect(evidence?.projection.events[0]).toMatchObject({
      type: "MATCH_STARTED",
      sequence: 0,
    })
    expect(evidence?.projection.events[13]).toMatchObject({
      type: "CONTRACTION_RESOLVED",
      sequence: 13,
    })
    expect(evidence?.projection.snapshots).toHaveLength(12)
    expect(evidence?.projection.snapshots[0]?.board.soldiers).toHaveLength(16)
    expect(
      evidence?.projection.events.filter(
        (event) => event.type === "MATCH_ENDED",
      ),
    ).toEqual([evidence?.projection.events.at(-1)])
    await expect(
      client?.getPublicReplayCompetitionContext("match:runtime-service:golden"),
    ).resolves.toMatchObject({
      matchSetId: "match-set:fixture:public-safe-replay",
      countedState: {
        state: "non_competitive",
        evidenceAvailability: "partial",
      },
      governance: {
        status: "non_competitive",
        replayAvailable: true,
      },
    })
    await expect(
      client?.getPublicMatchSetSummary("match-set:fixture:public-safe-replay"),
    ).resolves.toMatchObject({
      result: {
        entrants: [
          {
            runtimeSemantics: {
              countedPlayEligible: false,
              countedPlayLabel: "Not counted",
              validationIssueCodes: ["NON_COUNTED_RUNTIME"],
            },
          },
          {
            runtimeSemantics: {
              countedPlayEligible: false,
              countedPlayLabel: "Not counted",
              validationIssueCodes: ["NON_COUNTED_RUNTIME"],
            },
          },
        ],
      },
    })
    await expect(
      client?.getPublicMatchSetSummary("match-set:fixture:missing-chronicle"),
    ).resolves.toMatchObject({
      matchSetId: "match-set:fixture:missing-chronicle",
      result: {
        status: "failed",
      },
    })
    await expect(
      client?.getPublicMatchSetSummary("match-set:fixture:no-result"),
    ).resolves.toMatchObject({
      matchSetId: "match-set:fixture:no-result",
      result: {
        status: "degraded",
      },
    })
    await expect(
      client?.getPublicReplayState("match:fixture:missing-chronicle"),
    ).resolves.toMatchObject({
      lifecycle: {
        failureCategory: "missing_chronicle",
        replayAvailability: "missing",
      },
    })
    await expect(
      client?.getPublicReplayState("match:fixture:no-result"),
    ).resolves.toMatchObject({
      lifecycle: {
        failureCategory: "no_result",
        replayAvailability: "none",
      },
    })
  })
})
