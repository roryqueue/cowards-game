import { describe, expect, it } from "vitest"
import {
  COMPETITION_SEASON_PUBLIC_POLICY,
  TRIAL_SEASON_LIFECYCLE_STATUSES,
  assertCompetitionSeasonPublicLeakSafe,
  assertTrialSeasonTransition,
  canTrialSeasonTransition,
  projectTrialSeasonWindows,
  trialSeasonOutcome,
  trialSeasonPublicLinks,
} from "./competition-season-policy.js"
import { PublicTrialLadderSeasonDtoSchema } from "./schemas.js"

describe("competition Season policy", () => {
  it("classifies every lifecycle status pair deterministically", () => {
    const allowed = new Set([
      "draft:open",
      "open:scheduling",
      "open:completed",
      "scheduling:active",
      "scheduling:completed",
      "active:completed",
      "completed:archived",
    ])
    for (const from of TRIAL_SEASON_LIFECYCLE_STATUSES) {
      for (const to of TRIAL_SEASON_LIFECYCLE_STATUSES) {
        const expected = from === to || allowed.has(`${from}:${to}`)
        expect(canTrialSeasonTransition(from, to)).toBe(expected)
        if (expected) {
          expect(() => assertTrialSeasonTransition(from, to)).not.toThrow()
        } else {
          expect(() => assertTrialSeasonTransition(from, to)).toThrow(
            `Trial Season cannot move from ${from} to ${to}.`,
          )
        }
      }
    }
  })

  it("projects entry and scheduling windows from lifecycle evidence", () => {
    expect(projectTrialSeasonWindows({ status: "draft" })).toMatchObject({
      entryWindow: { state: "not_started" },
      schedulingWindow: { state: "not_started" },
    })
    expect(
      projectTrialSeasonWindows({
        status: "scheduling",
        openedAt: "2026-07-11T00:00:00.000Z",
        closedAt: "2026-07-12T00:00:00.000Z",
        scheduledAt: "2026-07-12T00:00:00.000Z",
      }),
    ).toMatchObject({
      entryWindow: { state: "closed" },
      schedulingWindow: { state: "open" },
    })
    expect(projectTrialSeasonWindows({ status: "archived" })).toMatchObject({
      entryWindow: { state: "closed" },
      schedulingWindow: { state: "closed" },
    })
  })

  it("uses honest scheduled and insufficient-evidence outcomes", () => {
    expect(trialSeasonOutcome("scheduled").publicExplanation).toContain(
      "resettable Season-scoped standings",
    )
    expect(
      trialSeasonOutcome("insufficient_evidence").publicExplanation,
    ).toContain("no counted MatchSets")
    expect(COMPETITION_SEASON_PUBLIC_POLICY.durableRatingPromise).toBe(
      "no durable permanent rating promise",
    )
  })

  it("builds stable encoded Season and standings links", () => {
    expect(trialSeasonPublicLinks("season:Summer Trial")).toEqual({
      seasonHref: "/ladder/season%3ASummer%20Trial",
      standingsHref: "/ladder/season%3ASummer%20Trial#standings",
    })
  })

  it("parses archived public Season evidence with stable links", () => {
    expect(() =>
      PublicTrialLadderSeasonDtoSchema.parse({
        seasonId: "season:archive",
        slug: "archive",
        name: "Archived Trial",
        status: "archived",
        statusLabel: "Archived",
        seasonSeed: "archive-seed",
        entryWindow: {
          state: "closed",
          publicLabel: "Counted entries closed",
        },
        schedulingWindow: {
          state: "closed",
          publicLabel: "Scheduling window closed",
        },
        outcome: trialSeasonOutcome("scheduled"),
        links: trialSeasonPublicLinks("archive"),
        policy: {
          oneEntryPerUser: true,
          replacementPolicy: "next-season-only",
          staleRevisionPolicy: "locked snapshot remains active",
          standingsReset: true,
          noPermanentRatings: true,
          minimumEntries: 4,
          targetPodSize: 4,
        },
        entries: [],
        standings: [],
        matchSets: [],
        publication: {
          publicEntries: true,
          publicStandings: true,
          publicReplayEvidence: true,
          privateFieldsExcluded: [],
        },
      }),
    ).not.toThrow()
  })

  it("keeps Season public policy leak-safe", () => {
    expect(() => assertCompetitionSeasonPublicLeakSafe()).not.toThrow()
  })
})
