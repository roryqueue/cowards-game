import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  classifyCompetitionCountedState,
  type CompetitionCountedStateProjection,
} from "@cowards/spec"
import {
  resolveCurrentStandingsIntegrityEvidence,
  resolveHistoricalIntegrityEvidence,
  type StandingsIntegrityResolution,
} from "./integrity-evidence.js"
import {
  recomputeSeasonStandings,
  type ClassifiedSeasonMatchSet,
  type SeasonStandingEntrant,
} from "./standings-recompute.js"

const entrants: SeasonStandingEntrant[] = [
  {
    entrantId: "entry:b",
    strategyRevisionId: "revision:b",
    ownerHandle: "bravo",
    displayLabel: "Bravo",
    sourceHash: "hash:b",
  },
  {
    entrantId: "entry:a",
    strategyRevisionId: "revision:a",
    ownerHandle: "alpha",
    displayLabel: "Alpha",
    sourceHash: "hash:a",
  },
]

const tupleRecord = CANONICAL_COMPATIBILITY_TUPLES[0]!
const historicalV14Tuple = {
  tupleId:
    "sha256:be54eb5317af0a87190433f649f9beef4490493d8c2a8815a323b082651b514c",
  tuple: {
    rules: "cowards-rules-v1.4",
    engine: "0.1.4",
    runtimeAbi: "strategy-runtime-abi-v1.14",
    chronicle: "chronicle-v1.4",
    arenaCatalog: "canonical-arena-catalog-v1.4",
    setPolicy: "canonical-set-policy-v1.4",
  },
} as const
const currentIntegrityInput = () => {
  const evidence = ["a", "b"].map((suffix, index) => ({
    entrantKey: `entrant:${suffix}`,
    strategyRevisionId: `revision:${suffix}`,
    laneIdentity: {
      providerId: `provider:${suffix}`,
      languageId: index === 0 ? "typescript" : "python",
      runtimeId: `runtime:${suffix}`,
      runtimeVersion: "1",
      toolchainId: `toolchain:${suffix}`,
      toolchainVersion: "1",
      adapterId: `adapter:${suffix}`,
      adapterVersion: "1",
      policyId: "policy:1",
      policyVersion: "1",
      corpusId: "corpus:1",
      corpusVersion: "1",
      artifactId: `artifact:${suffix}`,
      artifactSha256: createHash("sha256").update(`artifact:${suffix}`).digest("hex"),
      implementationId: `implementation:${suffix}`,
      buildId: `build:${suffix}`,
      semanticTupleId: tupleRecord.tupleId,
      semanticTuple: { ...tupleRecord.tuple },
    },
    containmentCertificateRef: {
      kind: "containment" as const,
      certificateId: `containment:${suffix}`,
      certificateVersion: "1",
      certificateRecordHash: createHash("sha256").update(`containment:${suffix}`).digest("hex"),
      registryGeneration: "generation:1",
    },
    conformanceCertificateRef: {
      kind: "conformance" as const,
      certificateId: `conformance:${suffix}`,
      certificateVersion: "1",
      certificateRecordHash: createHash("sha256").update(`conformance:${suffix}`).digest("hex"),
      registryGeneration: "generation:1",
    },
    schedulingDecision: {
      status: "counted" as const,
      reasonCode: "EVIDENCE_CURRENT" as const,
      evaluatedAt: "2026-07-12T12:00:00.000Z",
      freshUntil: "2026-08-12T12:00:00.000Z",
      registryGeneration: "generation:1",
    },
  }))
  return {
    compatibility: { tupleId: tupleRecord.tupleId, tuple: { ...tupleRecord.tuple } },
    authorityBundleHash: createHash("sha256").update("bundle").digest("hex"),
    registryGeneration: "generation:1",
    expectedEntrants: evidence.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants: evidence,
  }
}

const certifiedCurrent = () =>
  resolveCurrentStandingsIntegrityEvidence(currentIntegrityInput())

const projection = (
  state: Parameters<
    typeof classifyCompetitionCountedState
  >[0]["storedState"] = "counted",
): CompetitionCountedStateProjection =>
  classifyCompetitionCountedState({
    executionStatus:
      state === "retrying"
        ? "running"
        : state === "degraded_system_failure"
          ? "failed"
          : "complete",
    origin: "trial",
    expectedMatchCount: 2,
    chronicleMatchCount: state === "pending" ? 1 : 2,
    scoringAvailable: true,
    reviewState: "none",
    storedState: state,
  })

const matchSet = (
  id: string,
  countedState = projection("counted"),
  integrityResolution: Readonly<StandingsIntegrityResolution> = certifiedCurrent(),
): ClassifiedSeasonMatchSet => ({
  matchSetId: id,
  strategyRevisionIds: ["revision:a", "revision:b"],
  countedState,
  scoring: {
    rankings: [
      {
        strategyRevisionId: "revision:a",
        wins: 1,
        losses: 0,
        draws: 1,
        points: 4,
        penaltyPoints: 0,
        penalties: [],
        failedSystemMatches: 0,
        survivingSoldiers: 4,
        survivalTurns: 12,
      },
      {
        strategyRevisionId: "revision:b",
        wins: 0,
        losses: 1,
        draws: 1,
        points: 1,
        penaltyPoints: 0,
        penalties: [],
        failedSystemMatches: 0,
        survivingSoldiers: 2,
        survivalTurns: 8,
      },
    ],
  },
  resultHref: `/matchsets/${id}`,
  replayHref: `/matches/${id}:match/replay`,
  integrityResolution,
})

describe("Season standings recompute", () => {
  it("is byte-equivalent across repeated and permuted input", () => {
    const first = recomputeSeasonStandings({
      entrants,
      matchSets: [matchSet("matchset:2"), matchSet("matchset:1")],
    })
    const repeated = recomputeSeasonStandings({
      entrants: [...entrants].reverse(),
      matchSets: [matchSet("matchset:1"), matchSet("matchset:2")],
    })
    expect(JSON.stringify(repeated)).toBe(JSON.stringify(first))
    expect(first[0]).toMatchObject({
      strategyRevisionId: "revision:a",
      points: 8,
      competitionEvidence: {
        countedMatchSetCount: 2,
        excludedMatchSetCount: 0,
        evidenceAvailability: "available",
      },
    })
  })

  it.each([
    "degraded_system_failure",
    "pending",
    "retrying",
    "non_counted",
    "non_competitive",
    "under_review",
    "disputed",
    "invalid",
    "invalidated",
  ] as const)("keeps %s visible while excluding all score", (state) => {
    const standings = recomputeSeasonStandings({
      entrants,
      matchSets: [matchSet(`matchset:${state}`, projection(state))],
    })
    expect(standings.map((standing) => standing.points)).toEqual([0, 0])
    expect(standings[0]?.competitionEvidence).toMatchObject({
      countedMatchSetCount: 0,
      excludedMatchSetCount: 1,
      resultLinks: [`/matchsets/matchset:${state}`],
      replayLinks: [`/matches/matchset:${state}:match/replay`],
    })
  })

  it("uses the unchanged stable tie-break order", () => {
    const standings = recomputeSeasonStandings({ entrants, matchSets: [] })
    expect(standings.map((standing) => standing.strategyRevisionId)).toEqual([
      "revision:a",
      "revision:b",
    ])
    expect(standings[0]?.tieBreakerPath).toEqual([
      "points",
      "wins",
      "survivingSoldiers",
      "survivalTurns",
      "strategyRevisionId",
    ])
  })

  it.each(["missing", "unknown_tuple", "mixed_tuple", "uncertified"] as const)(
    "keeps rejected current %s identity visible but excludes points",
    (reason) => {
      const standings = recomputeSeasonStandings({
        entrants,
        matchSets: [
          matchSet("matchset:rejected", projection("counted"), {
            kind: "current_rejected",
            reason,
          }),
        ],
      })
      expect(standings.map((standing) => standing.points)).toEqual([0, 0])
      expect(standings[0]?.competitionEvidence).toMatchObject({
        countedMatchSetCount: 0,
        excludedMatchSetCount: 1,
      })
    },
  )

  it("retains only explicitly resolved v1.4 history under its original counted meaning", () => {
    const manifest = {
      manifestId: "release:v1.4",
      manifestHash: createHash("sha256").update("release:v1.4").digest("hex"),
      compatibility: historicalV14Tuple,
    }
    const source = (originalCounted: boolean, chronicleVersion: string | null) => ({
      matchSetId: "historical:v1.4",
      rulesVersion: "cowards-rules-v1.4",
      engineVersion: null,
      runtimeAbiVersion: null,
      chronicleVersion,
      arenaCatalogVersion: null,
      setPolicyVersion: null,
      originalCounted,
      originalOutcome: { winnerId: "player:bottom" },
    })
    const resolvedCounted = resolveHistoricalIntegrityEvidence({
      source: source(true, "chronicle-v1.4"),
      releaseManifests: [manifest],
    })
    const resolvedNonCounted = resolveHistoricalIntegrityEvidence({
      source: source(false, "chronicle-v1.4"),
      releaseManifests: [manifest],
    })
    const incomplete = resolveHistoricalIntegrityEvidence({
      source: source(true, null),
      releaseManifests: [manifest],
    })

    expect(
      recomputeSeasonStandings({ entrants, matchSets: [matchSet("history:counted", projection("counted"), resolvedCounted)] })[0]?.points,
    ).toBe(4)
    for (const [id, resolution] of [
      ["history:original-non-counted", resolvedNonCounted],
      ["history:incomplete", incomplete],
      ["history:unresolved", { kind: "unresolved", eligibleUnderOriginalSemantics: false }],
    ] as const) {
      expect(
        recomputeSeasonStandings({ entrants, matchSets: [matchSet(id, projection("counted"), resolution as never)] })[0]?.points,
      ).toBe(0)
    }
  })

  it("cannot include a MatchSet omitted from the Season input", () => {
    const otherSeason = matchSet("matchset:other-season")
    expect(
      recomputeSeasonStandings({ entrants, matchSets: [] }).some((standing) =>
        standing.competitionEvidence?.resultLinks.includes(
          otherSeason.resultHref,
        ),
      ),
    ).toBe(false)
  })
})
