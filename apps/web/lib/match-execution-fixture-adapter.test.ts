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
    await expect(
      client?.getPublicMatchSetSummary("match-set:does-not-exist"),
    ).resolves.toBeNull()
    await expect(
      client?.getPublicReplayMetadata("match:fixture:public-safe-replay"),
    ).resolves.toMatchObject({
      kind: "publicReplayMetadata",
      matchId: "match:fixture:public-safe-replay",
    })
    await expect(
      client?.getPublicReplayEvidence("match:fixture:public-safe-replay"),
    ).resolves.toMatchObject({
      kind: "publicReplayEvidence",
      matchId: "match:fixture:public-safe-replay",
    })
  })
})
