import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  MATCH_EXECUTION_CONTRACT_FIXTURES_V1,
  projectMatchExecutionPublicResultV119,
  type MatchExecutionContractFixtureV1,
  type MatchExecutionLifecycleStateV1,
} from "@cowards/spec"
import type { PublicReadMatchSetResultDto } from "../../lib/public-service-boundary.js"
import { toPublicMatchSetSummaryFixture } from "../../lib/match-execution-fixture-adapter.js"
import {
  buildCandidateResultWorkbenchViewModel,
  buildResultWorkbenchViewModel,
} from "./result-view-model.js"

const readResult = (
  fixture: MatchExecutionContractFixtureV1,
): PublicReadMatchSetResultDto => {
  const fixtureSummary = fixture.service.matchSetSummary
  if (!fixtureSummary) {
    throw new Error(`Missing fixture summary for ${fixture.id}`)
  }
  const summary = toPublicMatchSetSummaryFixture(fixtureSummary)
  const result = summary.result
  const contract = fixture.app.matchSetSummary ?? null
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
  return readResult(fixture)
}

const candidateResult = () => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    (candidate) => candidate.id === "arena:smoke:v1",
  )
  if (!arena) {
    throw new Error("Missing canonical Smoke arena")
  }
  return projectMatchExecutionPublicResultV119({
    matchSetId: "match-set:candidate-result",
    matchId: "match:candidate-result:a-bottom-b-first",
    publicationStatus: "pending",
    counted: false,
    arena: {
      variantId: arena.id,
      catalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
      catalogStatus: arena.status,
      semanticGeometryHash: arena.semanticGeometryHash,
    },
    condition: {
      scenarioId: `set-scenario:sha256:${"4".repeat(64)}`,
      conditionId: `set-condition:sha256:${"5".repeat(64)}`,
      ordinal: 1,
      label: "a-bottom-b-first",
      sides: {
        bottomEntrantKey: "entrant:a",
        topEntrantKey: "entrant:b",
      },
      initialInitiativeEntrantKey: "entrant:b",
    },
  })
}

describe("result workbench view model", () => {
  it("renders candidate result labels mechanically from the strict public DTO", () => {
    const result = candidateResult()

    expect(buildCandidateResultWorkbenchViewModel(result)).toEqual({
      status: "candidate",
      profile: "runtime-v1.19-candidate",
      candidate: true,
      current: false,
      publishable: false,
      matchSetId: result.matchSetId,
      matchId: result.matchId,
      publicationStatus: result.publicationStatus,
      counted: result.counted,
      labels: {
        arena: result.arena.variantId,
        arenaCatalog: result.arena.catalogVersion,
        arenaCatalogStatus: result.arena.catalogStatus,
        condition: result.condition.label,
        bottom: result.condition.sides.bottomEntrantKey,
        top: result.condition.sides.topEntrantKey,
        initialInitiative: result.condition.initialInitiativeEntrantKey,
      },
    })
  })

  it.each([
    ["missing", undefined],
    [
      "unknown arena",
      {
        ...candidateResult(),
        arena: {
          ...candidateResult().arena,
          variantId: "arena:unknown:v1",
        },
      },
    ],
    [
      "mixed contract",
      {
        ...candidateResult(),
        contractVersion: "match-execution-app-v1",
      },
    ],
  ])("fails closed for %s candidate result data", (_label, result) => {
    expect(buildCandidateResultWorkbenchViewModel(result)).toEqual({
      status: "unavailable",
      profile: "runtime-v1.19-candidate",
      candidate: true,
      current: false,
      publishable: false,
      reason: "candidate-data-unavailable",
    })
  })

  it("keeps candidate projection free of semantic derivation and execution imports", () => {
    const source = readFileSync(
      new URL("./result-view-model.ts", import.meta.url),
      "utf8",
    )
    const start = source.indexOf(
      "export const buildCandidateResultWorkbenchViewModel",
    )
    const end = source.indexOf(
      "export const buildResultWorkbenchViewModel",
      start,
    )
    const candidateProjection = source.slice(start, end)

    expect(start).toBeGreaterThan(-1)
    expect(end).toBeGreaterThan(start)
    expect(source).not.toMatch(
      /from ["'](?:@cowards\/engine|@cowards\/runtime|@cowards\/runtime-service)/u,
    )
    for (const forbidden of [
      "semanticGeometryHash",
      "CANONICAL_SET_CONDITION",
      "createSetScenario",
      "baseSeed",
      "hashCanonical",
      "Math.random",
      "Date.now",
    ]) {
      expect(candidateProjection).not.toContain(forbidden)
    }
  })

  it("leaves the Phase-259 current view model exact after candidate dispatch", () => {
    const result = fixtureResult("complete")
    const labels = ["JS/TS - counted eligible"]
    const before = buildResultWorkbenchViewModel(result, labels)

    buildCandidateResultWorkbenchViewModel(candidateResult())

    expect(buildResultWorkbenchViewModel(result, labels)).toEqual(before)
    expect(Object.keys(before)).toEqual([
      "statusLabel",
      "statusTone",
      "lifecycleSummary",
      "availabilitySummary",
      "privacySummary",
      "intelligence",
      "sections",
      "matches",
    ])
  })

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

  it("uses the typed competition projection instead of legacy metadata", () => {
    const result = fixtureResult("complete")
    const projection = {
      state: "non_counted" as const,
      publicLabel: "Non-counted",
      publicReason: "non_counted" as const,
      publicExplanation: "This exhibition does not affect Season standings.",
      standingsEffect: "excluded" as const,
      evidenceAvailability: "available" as const,
    }
    const model = buildResultWorkbenchViewModel(
      {
        ...result,
        competition: { countedState: projection },
        metadata: { countedStatus: "counted" },
      },
      ["JS/TS - counted eligible"],
    )

    expect(
      model.sections.find((section) => section.id === "runtime")?.metrics,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: expect.stringContaining("0 counted entrants"),
        }),
      ]),
    )
  })
})
