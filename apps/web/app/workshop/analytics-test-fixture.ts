import {
  ANALYTICS_PROFILE_SCHEMA_VERSION,
  ANALYTICS_RUN_SCHEMA_VERSION,
  ANALYTICS_SUMMARY_SCHEMA_VERSION,
  type AnalyticsCompatibilitySummary,
  type AnalyticsGauntletProfile,
  type AnalyticsGauntletProfileRun,
  type AnalyticsMatchupRecord,
  type WorkshopAnalyticsSnapshot,
} from "@cowards/spec"

const candidate = {
  revisionId: "strategy-revision:test-candidate",
  label: "Test Candidate",
  sourceHash: "sha256:test-candidate",
  tags: ["test"],
}

const compatibility: AnalyticsCompatibilitySummary = {
  hash: "sha256:test-analytics-compatibility",
  key: {
    profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
    candidateRevisionIds: [candidate.revisionId],
    opponentRevisionIds: [
      "strategy-revision:starter",
      "strategy-revision:advanced-thin",
      "strategy-revision:advanced-degraded",
      "strategy-revision:advanced-system",
    ],
    presetId: "standard-v1",
    seeds: ["seed:test"],
    mirrorSides: true,
    scoringPolicyVersion: "matchset-scoring-v1",
    ruleVersion: "rules-v1.6",
    chronicleVersion: "chronicle-v1.4",
    runtimeAdapter: "runtime-js",
    runtimeVersion: "runtime-js-v1",
    matrixOrder: [],
  },
  equivalent: true,
  mismatches: [],
}

const matchup = (
  opponentId: string,
  tier: "starter" | "advanced",
  points: number,
  band: AnalyticsMatchupRecord["evidence"]["band"],
  counted: boolean,
  replayBacked: boolean,
): AnalyticsMatchupRecord => ({
  candidate,
  opponent: {
    opponentId,
    revisionId: `strategy-revision:${opponentId}`,
    label: opponentId,
    sourceHash: `sha256:${opponentId}`,
    tags: [tier],
    tier,
    archetypeTags: [tier === "starter" ? "baseline" : "pressure"],
  },
  matchSetId: `match-set:${opponentId}`,
  matchIds: [`match:${opponentId}:1`],
  wins: points > 0 ? 1 : 0,
  losses: points === 0 ? 1 : 0,
  draws: 0,
  points,
  failureCount:
    band === "system_failed" || band === "degraded_non_counted" ? 1 : 0,
  sideBias: counted ? "balanced" : "insufficient",
  evidence: {
    band,
    counted,
    completedCount: band === "system_failed" ? 0 : 1,
    replayBackedCount: replayBacked ? 1 : 0,
    totalCount: 1,
    failureCount: band === "degraded_non_counted" ? 1 : 0,
    systemFailureCount: band === "system_failed" ? 1 : 0,
    notes: [`${band} fixture`],
  },
  replayReferences: replayBacked
    ? [
        {
          matchId: `match:${opponentId}:1`,
          momentType: "DECISIVE_PUSH",
          sequence: 1,
          label: "Fixture replay",
          side: "bottom",
          fallbackState: "available",
          href: `/matches/${encodeURIComponent(`match:${opponentId}:1`)}/replay`,
        },
      ]
    : [],
})

export const createWorkshopAnalyticsStateTestSnapshot =
  (): WorkshopAnalyticsSnapshot => {
    const profile: AnalyticsGauntletProfile = {
      id: "analytics-profile:test",
      ownerUserId: "user:local",
      name: "Test Analytics Profile",
      status: "active",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
      definition: {
        profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
        candidates: [candidate],
        opponents: [],
        presetId: "standard-v1",
        seeds: ["seed:test"],
        mirrorSides: true,
        scoringPolicyVersion: "matchset-scoring-v1",
        ruleVersion: "rules-v1.6",
        chronicleVersion: "chronicle-v1.4",
        runtimeAdapter: "runtime-js",
        runtimeVersion: "runtime-js-v1",
        matrixOrder: [],
      },
      compatibility,
    }
    const matchupRecords = [
      matchup("advanced-system", "advanced", 0, "system_failed", false, false),
      matchup("advanced-thin", "advanced", 3, "thin", true, true),
      matchup(
        "advanced-degraded",
        "advanced",
        0,
        "degraded_non_counted",
        false,
        false,
      ),
      matchup("starter-strong", "starter", 6, "strong", true, true),
    ]
    const run: AnalyticsGauntletProfileRun = {
      id: "analytics-run:test",
      profileId: profile.id,
      ownerUserId: profile.ownerUserId,
      runIndex: 0,
      createdAt: "2026-05-22T00:00:00.000Z",
      completedAt: "2026-05-22T00:01:00.000Z",
      summary: {
        summarySchemaVersion: ANALYTICS_SUMMARY_SCHEMA_VERSION,
        profileId: profile.id,
        runId: "analytics-run:test",
        ownerUserId: profile.ownerUserId,
        lifecycleStatus: "complete",
        compatibility,
        totals: {
          wins: 2,
          losses: 2,
          draws: 0,
          points: 9,
          matchups: matchupRecords.length,
          completedMatches: 3,
          failedMatches: 2,
        },
        matchupRecords,
        provenance: {
          matchSetIds: matchupRecords.map((record) => record.matchSetId),
          generatedAt: "2026-05-22T00:01:00.000Z",
          runSchemaVersion: ANALYTICS_RUN_SCHEMA_VERSION,
        },
        privacy: {
          ownerSafe: true,
          publicFieldsExcluded: [
            "Strategy source",
            "StrategyMemory",
            "SoldierMemory",
            "objective payloads",
            "owner debug",
            "private runtime internals",
          ],
        },
      },
    }

    return {
      profiles: [profile],
      runs: [run],
      selectedProfileId: profile.id,
      selectedRunId: run.id,
    }
  }
