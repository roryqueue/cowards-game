import { describe, expect, it } from "vitest"
import {
  PublicCompetitionDetailDtoSchema,
  PublicHomeDiscoveryDtoSchema,
  assertPublicDiscoveryDtoLeakSafe,
  isSafePublicDiscoveryHref,
  publicDiscoveryBoundary,
} from "./public-discovery.js"

describe("public discovery DTOs", () => {
  it("declares a namespace separate from match-execution-app-v1", () => {
    const boundary = publicDiscoveryBoundary()

    expect(boundary.apiNamespace).toBe("public-discovery")
    expect(boundary.executionContract).toBe("not-match-execution-app-v1")
    expect(boundary.privateFieldsExcluded).toEqual(
      expect.arrayContaining([
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
      ]),
    )
  })

  it("validates home discovery without extending public execution DTOs", () => {
    const dto = PublicHomeDiscoveryDtoSchema.parse({
      kind: "publicHomeDiscovery",
      boundary: publicDiscoveryBoundary(),
      competitions: [],
      latestEvidence: [],
      players: [],
      strategies: [],
      learnLinks: [{ label: "Rules", href: "/learn#rules" }],
      emptyStates: ["No public discovery rows yet."],
    })

    expect(() => assertPublicDiscoveryDtoLeakSafe(dto)).not.toThrow()
  })

  it("rejects unsafe public discovery hrefs", () => {
    expect(isSafePublicDiscoveryHref("/watch")).toBe(true)
    expect(isSafePublicDiscoveryHref("/matches/match%3Ademo/replay")).toBe(true)

    for (const href of [
      "javascript:alert(1)",
      "https://example.invalid/watch",
      "//example.invalid/watch",
      "/watch\\evil",
      "/watch\u0000evil",
    ]) {
      expect(isSafePublicDiscoveryHref(href)).toBe(false)
      expect(() =>
        PublicHomeDiscoveryDtoSchema.parse({
          kind: "publicHomeDiscovery",
          boundary: publicDiscoveryBoundary(),
          competitions: [],
          latestEvidence: [],
          players: [],
          strategies: [],
          learnLinks: [{ label: "Unsafe", href }],
          emptyStates: [],
        }),
      ).toThrow(/safe relative public path/)
    }
  })

  it("validates safe competition standing evidence links", () => {
    const detail = {
      kind: "publicCompetitionDetail",
      boundary: publicDiscoveryBoundary(),
      competition: {
        competitionId: "ladder:season:test",
        title: "Test Season",
        kind: "ladder",
        status: "active",
        statusLabel: "Active",
        href: "/competitions/ladder%3Aseason%3Atest",
        origin: "configured-public-read",
      },
      entrants: [],
      standings: [
        {
          rank: 1,
          label: "Alpha",
          points: 3,
          record: "1-0-0",
          competitionEvidence: {
            countedMatchSetCount: 1,
            excludedMatchSetCount: 2,
            evidenceAvailability: "partial",
            resultLinks: ["/matchsets/match-set%3Atest"],
            replayLinks: ["/matches/match%3Atest/replay"],
          },
        },
      ],
      matchSets: [],
      replayCoverage: {
        replayReadyCount: 1,
        matchCount: 3,
        label: "Partial replay coverage.",
      },
      scheduleLabel: "Schedule published.",
    } as const

    expect(
      PublicCompetitionDetailDtoSchema.parse(detail).standings[0],
    ).toMatchObject(detail.standings[0])
    expect(() =>
      PublicCompetitionDetailDtoSchema.parse({
        ...detail,
        standings: [
          {
            ...detail.standings[0],
            competitionEvidence: {
              ...detail.standings[0].competitionEvidence,
              resultLinks: ["https://example.invalid/private-result"],
            },
          },
        ],
      }),
    ).toThrow(/safe relative public path/)
  })

  it("fails leak-safe validation for private fields", () => {
    expect(() =>
      assertPublicDiscoveryDtoLeakSafe({
        kind: "publicHomeDiscovery",
        strategyMemory: "hidden",
      }),
    ).toThrow(/private field/)
  })
})
