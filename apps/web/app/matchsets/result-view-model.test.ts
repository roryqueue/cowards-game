import { describe, expect, it } from "vitest"
import {
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
  type MatchExecutionLifecycleStateV1,
  type PublicMatchSetSummaryServiceDto,
} from "@cowards/spec"
import type { PublicReadMatchSetResultDto } from "../../lib/public-service-boundary.js"
import { buildResultWorkbenchViewModel } from "./result-view-model.js"

const readResult = (
  summary: PublicMatchSetSummaryServiceDto,
): PublicReadMatchSetResultDto => {
  const result = summary.result
  const contract =
    MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
      (fixture) => fixture.service.matchSetSummary === summary,
    )?.app.matchSetSummary ?? null
  if (!contract) {
    throw new Error(`Missing app contract for ${summary.matchSetId}`)
  }
  const entrantById = new Map(
    result.entrants.map((entrant) => [entrant.entrantId, entrant]),
  )
  return {
    ...result,
    contract,
    lifecycle: contract.lifecycle,
    currentUser: null,
    entrants: result.entrants.map((entrant) => ({
      ...entrant,
      shortHash: entrant.sourceHash.slice(0, 10),
      isOwner: false,
    })),
    matches: result.matches.map((match) => ({
      ...match,
      bottomLabel:
        entrantById.get(match.entrants.bottom)?.displayLabel ??
        match.entrants.bottom,
      topLabel:
        entrantById.get(match.entrants.top)?.displayLabel ?? match.entrants.top,
      ...(match.replayAvailable
        ? { replayHref: `/matches/${encodeURIComponent(match.matchId)}/replay` }
        : {}),
    })),
  }
}

const fixtureResult = (id: string): PublicReadMatchSetResultDto => {
  const fixture = MATCH_EXECUTION_CONTRACT_FIXTURES_V1.find(
    (candidate) => candidate.id === id,
  )
  if (!fixture?.service.matchSetSummary) {
    throw new Error(`Missing fixture result ${id}`)
  }
  return readResult(fixture.service.matchSetSummary)
}

describe("result workbench view model", () => {
  it("covers every frozen fixture lifecycle without private marker copy", () => {
    const forbidden = [
      "StrategyMemory",
      "SoldierMemory",
      "objective payloads",
      "raw diagnostics",
      "host paths",
      "env values",
      "tokens",
      "DB details",
      "package paths",
      "private runtime internals",
    ]

    for (const fixture of MATCH_EXECUTION_CONTRACT_FIXTURES_V1) {
      if (!fixture.service.matchSetSummary) {
        continue
      }
      const result = fixtureResult(fixture.id)
      const model = buildResultWorkbenchViewModel(result, [
        "JS/TS - counted eligible",
      ])
      const serialized = JSON.stringify(model)

      expect(model.sections.map((section) => section.id)).toEqual([
        "lifecycle",
        "availability",
        "failure",
        "runtime",
        "proof",
      ])
      expect(serialized.toLowerCase()).toContain(result.lifecycle.state)
      expect(serialized).not.toContain("undefined")
      for (const marker of forbidden) {
        expect(serialized).not.toContain(marker)
      }
    }
  })

  it("keeps accepted lifecycle copy explicit even without a committed fixture", () => {
    const result = fixtureResult("queued")
    const accepted = {
      ...result,
      lifecycle: {
        ...result.lifecycle,
        state: "accepted" as MatchExecutionLifecycleStateV1,
        publicMessageKey: "match_execution.accepted",
      },
      contract: {
        ...result.contract,
        lifecycle: {
          ...result.contract.lifecycle,
          state: "accepted" as MatchExecutionLifecycleStateV1,
          publicMessageKey: "match_execution.accepted",
        },
      },
    }

    const model = buildResultWorkbenchViewModel(accepted, [
      "JS/TS - counted eligible",
    ])

    expect(model.lifecycleSummary).toContain("Accepted")
    expect(model.statusTone).toBe("neutral")
  })

  it("prioritizes public failure reason over complete Match status tone", () => {
    const result = fixtureResult("complete")
    const match = result.matches[0]
    if (!match) {
      throw new Error("Missing complete fixture Match")
    }
    const model = buildResultWorkbenchViewModel(
      {
        ...result,
        matches: [
          {
            ...match,
            status: "complete",
            publicReason: "invalid_result",
          },
        ],
      },
      ["JS/TS - counted eligible"],
    )

    expect(model.matches[0]?.tone).toBe("danger")
  })
})
