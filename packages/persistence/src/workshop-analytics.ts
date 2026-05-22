import { createHash } from "node:crypto"
import type {
  AnalyticsCompatibilityKey,
  AnalyticsCompatibilitySummary,
  AnalyticsExportEnvelope,
  AnalyticsGauntletProfile,
  AnalyticsGauntletProfileDefinition,
  AnalyticsGauntletProfileRun,
  AnalyticsGauntletRunSummary,
  AnalyticsMatchupRecord,
  AnalyticsOpponentSnapshot,
  AnalyticsReplayMomentType,
  AnalyticsStrategySnapshot,
  MatchId,
  MatchSetId,
  StrategyRevisionId,
} from "@cowards/spec"
import {
  ANALYTICS_FORBIDDEN_PUBLIC_KEYS,
  ANALYTICS_PROFILE_SCHEMA_VERSION,
  ANALYTICS_RUN_SCHEMA_VERSION,
  ANALYTICS_SUMMARY_SCHEMA_VERSION,
  AnalyticsGauntletProfileRunSchema,
  AnalyticsGauntletProfileSchema,
  assertAnalyticsPublicSummaryLeakSafe,
  deriveAnalyticsEvidenceBand,
} from "@cowards/spec"
import type { Pool } from "pg"
import { listAdvancedStrategies } from "./advanced-strategies.js"
import { getMatchSetPreset } from "./presets.js"
import { listStarterStrategies } from "./starter-strategies.js"
import {
  sentinelSource,
  WORKSHOP_PLAYER_ID,
  WORKSHOP_USER_ID,
} from "./workshop.js"
import { validateStrategySource } from "@cowards/runtime-js"

export const WORKSHOP_ANALYTICS_PROFILE_ID =
  "analytics-profile:workshop-v1.6-demo"
export const WORKSHOP_ANALYTICS_RUN_ID = "analytics-run:workshop-v1.6-demo:2"
const WORKSHOP_ANALYTICS_PREVIOUS_RUN_ID = "analytics-run:workshop-v1.6-demo:1"

export interface WorkshopAnalyticsSnapshot {
  profiles: AnalyticsGauntletProfile[]
  runs: AnalyticsGauntletProfileRun[]
  selectedProfileId: string
  selectedRunId: string
}

export type WorkshopAnalyticsExportFormat = "json" | "csv"

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalJson(entryValue)}`)
      .join(",")}}`
  }
  return JSON.stringify(value)
}

export const createAnalyticsCompatibilityHash = (
  key: AnalyticsCompatibilityKey,
): string =>
  `sha256:${createHash("sha256").update(canonicalJson(key)).digest("hex")}`

const workshopCandidate = (): AnalyticsStrategySnapshot => {
  const validation = validateStrategySource(sentinelSource)
  return {
    revisionId: `revision:workshop:${validation.sourceHash}` as StrategyRevisionId,
    label: "Sentinel Workshop",
    sourceHash: validation.sourceHash,
    tags: ["Local", "Sentinel", "Stone"],
  }
}

const starterOpponentSnapshots = (): AnalyticsOpponentSnapshot[] =>
  listStarterStrategies().map((starter) => ({
    opponentId: starter.id,
    revisionId: `revision:${starter.id}:${starter.sourceHash}` as StrategyRevisionId,
    label: starter.name,
    sourceHash: starter.sourceHash,
    tags: starter.tags,
    tier: "starter",
    archetypeTags: starter.tags,
  }))

const advancedOpponentSnapshots = (): AnalyticsOpponentSnapshot[] =>
  listAdvancedStrategies()
    .filter((advanced) =>
      [
        "advanced:vanguard-pressure",
        "advanced:rear-guard-sentinel",
        "advanced:stonewall-shear",
        "advanced:ring-shelter",
      ].includes(advanced.id),
    )
    .map((advanced) => ({
      opponentId: advanced.id,
      revisionId: `revision:${advanced.id}:${advanced.sourceHash}` as StrategyRevisionId,
      label: advanced.name,
      sourceHash: advanced.sourceHash,
      tags: advanced.tags,
      tier: "advanced",
      archetypeTags: [advanced.primaryArchetype, ...advanced.tags],
    }))

const replayHref = (
  scenario: "compound-tour" | "fall" | "legal-backstab",
  momentType: AnalyticsReplayMomentType,
  sequence: number,
): string => {
  const matchId =
    scenario === "compound-tour"
      ? "match:e2e-replay-fixture:compound-tour"
      : `match:e2e-replay-fixture:${scenario}`
  return `/matches/${encodeURIComponent(matchId)}/replay?moment=${momentType}&sequence=${sequence}`
}

const matchupShape = [
  { wins: 6, losses: 1, draws: 1, points: 19, band: "strong", moment: "DECISIVE_PUSH", sequence: 24, sideBias: "balanced" },
  { wins: 2, losses: 4, draws: 2, points: 8, band: "strong", moment: "BACKSTAB", sequence: 18, sideBias: "top" },
  { wins: 1, losses: 5, draws: 2, points: 5, band: "strong", moment: "BACKSTAB", sequence: 18, sideBias: "top" },
  { wins: 3, losses: 2, draws: 3, points: 12, band: "thin", moment: "LATE_CYCLE_STABILIZATION", sequence: 34, sideBias: "insufficient" },
  { wins: 0, losses: 2, draws: 0, points: 0, band: "degraded_non_counted", moment: "FALL", sequence: 14, sideBias: "insufficient" },
  { wins: 5, losses: 0, draws: 3, points: 18, band: "strong", moment: "CONTRACTION", sequence: 30, sideBias: "balanced" },
  { wins: 2, losses: 2, draws: 4, points: 10, band: "thin", moment: "NO_ADVANCE_CLEANUP", sequence: 21, sideBias: "balanced" },
  { wins: 0, losses: 0, draws: 0, points: 0, band: "system_failed", moment: "DECISIVE_PUSH", sequence: 0, sideBias: "insufficient" },
] as const

const buildCompatibility = (
  definition: AnalyticsGauntletProfileDefinition,
): AnalyticsCompatibilitySummary => {
  const key: AnalyticsCompatibilityKey = {
    profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
    candidateRevisionIds: definition.candidates.map(
      (candidate) => candidate.revisionId,
    ),
    opponentRevisionIds: definition.opponents.map(
      (opponent) => opponent.revisionId,
    ),
    presetId: definition.presetId,
    seeds: definition.seeds,
    mirrorSides: definition.mirrorSides,
    scoringPolicyVersion: definition.scoringPolicyVersion,
    ruleVersion: definition.ruleVersion,
    chronicleVersion: definition.chronicleVersion,
    runtimeAdapter: definition.runtimeAdapter,
    runtimeVersion: definition.runtimeVersion,
    matrixOrder: definition.matrixOrder,
  }
  return {
    hash: createAnalyticsCompatibilityHash(key),
    key,
    equivalent: true,
    mismatches: [],
  }
}

const buildMatchup = (
  candidate: AnalyticsStrategySnapshot,
  opponent: AnalyticsOpponentSnapshot,
  index: number,
): AnalyticsMatchupRecord => {
  const shape = matchupShape[index % matchupShape.length]!
  const totalCount = shape.band === "system_failed" ? 4 : shape.band === "thin" ? 3 : 8
  const completedCount =
    shape.band === "system_failed" ? 0 : shape.band === "degraded_non_counted" ? 2 : totalCount
  const replayBackedCount =
    shape.band === "degraded_non_counted" ? 1 : completedCount
  const systemFailureCount = shape.band === "system_failed" ? 4 : 0
  const counted = shape.band !== "degraded_non_counted" && shape.band !== "system_failed"
  const derivedBand = deriveAnalyticsEvidenceBand({
    counted,
    completedCount,
    replayBackedCount,
    totalCount,
    systemFailureCount,
    degraded: shape.band === "degraded_non_counted",
    strongEvidenceThreshold: 4,
  })
  const scenario =
    shape.moment === "FALL"
      ? "fall"
      : shape.moment === "BACKSTAB"
        ? "legal-backstab"
        : "compound-tour"
  const matchId = `match:analytics:${index.toString().padStart(2, "0")}` as MatchId
  const matchSetId =
    `match-set:analytics:v1.6:${opponent.opponentId}` as MatchSetId

  return {
    candidate,
    opponent,
    matchSetId,
    matchIds: Array.from(
      { length: Math.max(totalCount, 1) },
      (_, matchIndex) => `${matchId}:${matchIndex + 1}` as MatchId,
    ),
    wins: shape.wins,
    losses: shape.losses,
    draws: shape.draws,
    points: shape.points,
    failureCount:
      shape.band === "degraded_non_counted"
        ? 1
        : shape.band === "system_failed"
          ? 4
          : 0,
    sideBias: shape.sideBias,
    evidence: {
      band: derivedBand,
      counted,
      completedCount,
      replayBackedCount,
      totalCount,
      failureCount: shape.band === "degraded_non_counted" ? 1 : 0,
      systemFailureCount,
      notes:
        shape.band === "system_failed"
          ? ["System failure: excluded from matchup scoring."]
          : shape.band === "degraded_non_counted"
            ? ["Degraded evidence: one replay is unavailable, not counted."]
            : shape.band === "thin"
              ? ["Thin evidence: counted but below the strong threshold."]
              : ["Strong replay-backed deterministic evidence."],
    },
    replayReferences:
      shape.band === "system_failed"
        ? []
        : [
            {
              matchId:
                scenario === "compound-tour"
                  ? "match:e2e-replay-fixture:compound-tour"
                  : (`match:e2e-replay-fixture:${scenario}` as MatchId),
              momentType: shape.moment,
              sequence: shape.sequence,
              label:
                shape.moment === "BACKSTAB"
                  ? "Backstab swing"
                  : shape.moment === "FALL"
                    ? "Fall after pressure"
                    : shape.moment === "CONTRACTION"
                      ? "Contraction checkpoint"
                      : shape.moment === "NO_ADVANCE_CLEANUP"
                        ? "No-advance cleanup"
                        : shape.moment === "LATE_CYCLE_STABILIZATION"
                          ? "Late-cycle stabilization"
                          : "Decisive push",
              side: shape.sideBias === "top" ? "top" : "bottom",
              fallbackState:
                shape.band === "degraded_non_counted"
                  ? "replay_unavailable"
                  : "available",
              href: replayHref(scenario, shape.moment, shape.sequence),
            },
          ],
  }
}

export const createWorkshopAnalyticsDemoSnapshot =
  (): WorkshopAnalyticsSnapshot => {
    const candidate = workshopCandidate()
    const opponents = [
      ...starterOpponentSnapshots(),
      ...advancedOpponentSnapshots(),
    ]
    const preset = getMatchSetPreset("standard-v1")
    const definition: AnalyticsGauntletProfileDefinition = {
      profileSchemaVersion: ANALYTICS_PROFILE_SCHEMA_VERSION,
      candidates: [candidate],
      opponents,
      presetId: preset.id,
      seeds: preset.seeds,
      mirrorSides: preset.mirrorSides,
      scoringPolicyVersion: "matchset-scoring-v1",
      ruleVersion: "rules-v1.6",
      chronicleVersion: "chronicle-v1.4",
      runtimeAdapter: "runtime-js",
      runtimeVersion: "runtime-js-v1",
      matrixOrder: opponents.map(
        (opponent) => `${candidate.revisionId}|${opponent.revisionId}`,
      ),
    }
    const compatibility = buildCompatibility(definition)
    const profile: AnalyticsGauntletProfile = {
      id: WORKSHOP_ANALYTICS_PROFILE_ID,
      ownerUserId: WORKSHOP_USER_ID,
      name: "v1.6 Starters + Advanced Evidence",
      notes:
        "Deterministic local demo profile with controlled strong, thin, degraded, and system-failed evidence states.",
      status: "active",
      createdAt: "2026-05-22T00:00:00.000Z",
      updatedAt: "2026-05-22T00:00:00.000Z",
      definition,
      compatibility,
    }
    const matchupRecords = opponents.map((opponent, index) =>
      buildMatchup(candidate, opponent, index),
    )
    const totals = matchupRecords.reduce(
      (acc, matchup) => ({
        wins: acc.wins + matchup.wins,
        losses: acc.losses + matchup.losses,
        draws: acc.draws + matchup.draws,
        points: acc.points + matchup.points,
        matchups: acc.matchups + 1,
        completedMatches: acc.completedMatches + matchup.evidence.completedCount,
        failedMatches: acc.failedMatches + matchup.failureCount,
      }),
      {
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        matchups: 0,
        completedMatches: 0,
        failedMatches: 0,
      },
    )
    const latestSummary: AnalyticsGauntletRunSummary = {
      summarySchemaVersion: ANALYTICS_SUMMARY_SCHEMA_VERSION,
      profileId: profile.id,
      runId: WORKSHOP_ANALYTICS_RUN_ID,
      ownerUserId: WORKSHOP_USER_ID,
      lifecycleStatus: "complete",
      compatibility,
      totals,
      matchupRecords,
      provenance: {
        matchSetIds: matchupRecords.map((matchup) => matchup.matchSetId),
        generatedAt: "2026-05-22T00:00:00.000Z",
        runSchemaVersion: ANALYTICS_RUN_SCHEMA_VERSION,
      },
      privacy: {
        ownerSafe: true,
        publicFieldsExcluded: [
          "strategy code",
          "private strategy state",
          "private soldier state",
          "activation payloads",
          "owner-only debugging",
          "private grid observations",
          "runtime internals",
        ],
      },
      metadata: {
        demo: true,
        localOwnerPlayerId: WORKSHOP_PLAYER_ID,
        compatibilityEquivalentToPreviousRun: true,
      },
    }
    const previousSummary: AnalyticsGauntletRunSummary = {
      ...latestSummary,
      runId: WORKSHOP_ANALYTICS_PREVIOUS_RUN_ID,
      totals: {
        ...latestSummary.totals,
        wins: latestSummary.totals.wins - 2,
        losses: latestSummary.totals.losses + 1,
        points: latestSummary.totals.points - 7,
      },
      provenance: {
        ...latestSummary.provenance,
        generatedAt: "2026-05-22T00:00:00.000Z",
      },
    }
    assertAnalyticsPublicSummaryLeakSafe(previousSummary)
    assertAnalyticsPublicSummaryLeakSafe(latestSummary)
    return {
      profiles: [profile],
      runs: [
        {
          id: WORKSHOP_ANALYTICS_PREVIOUS_RUN_ID,
          profileId: profile.id,
          ownerUserId: WORKSHOP_USER_ID,
          runIndex: 1,
          createdAt: "2026-05-22T00:00:00.000Z",
          completedAt: "2026-05-22T00:02:00.000Z",
          notes: "Previous compatible demo run.",
          summary: previousSummary,
        },
        {
          id: WORKSHOP_ANALYTICS_RUN_ID,
          profileId: profile.id,
          ownerUserId: WORKSHOP_USER_ID,
          runIndex: 2,
          createdAt: "2026-05-22T00:00:00.000Z",
          completedAt: "2026-05-22T00:03:00.000Z",
          notes: "Demo run generated from deterministic summary fixtures.",
          summary: latestSummary,
        },
      ],
      selectedProfileId: profile.id,
      selectedRunId: WORKSHOP_ANALYTICS_RUN_ID,
    }
  }

const upsertAnalyticsProfile = async (
  pool: Pool,
  profile: AnalyticsGauntletProfile,
): Promise<void> => {
  await pool.query(
    `
      insert into workshop_gauntlet_profiles (
        id, owner_user_id, name, notes, status, profile_schema_version,
        definition, compatibility_key, compatibility_hash, created_at, updated_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (id) do update
        set name = excluded.name,
            notes = excluded.notes,
            status = excluded.status,
            definition = excluded.definition,
            compatibility_key = excluded.compatibility_key,
            compatibility_hash = excluded.compatibility_hash,
            updated_at = excluded.updated_at
    `,
    [
      profile.id,
      profile.ownerUserId,
      profile.name,
      profile.notes ?? null,
      profile.status,
      profile.definition.profileSchemaVersion,
      JSON.stringify(profile.definition),
      JSON.stringify(profile.compatibility.key),
      profile.compatibility.hash,
      profile.createdAt,
      profile.updatedAt,
    ],
  )
}

const upsertAnalyticsRun = async (
  pool: Pool,
  run: AnalyticsGauntletProfileRun,
): Promise<void> => {
  await pool.query(
    `
      insert into workshop_gauntlet_profile_runs (
        id, profile_id, owner_user_id, run_index, lifecycle_status,
        compatibility_hash, match_set_ids, summary, preflight_errors,
        notes, created_at, completed_at
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, '[]'::jsonb, $9, $10, $11)
      on conflict (id) do update
        set lifecycle_status = excluded.lifecycle_status,
            match_set_ids = excluded.match_set_ids,
            summary = excluded.summary,
            notes = excluded.notes,
            completed_at = excluded.completed_at
    `,
    [
      run.id,
      run.profileId,
      run.ownerUserId,
      run.runIndex,
      run.summary.lifecycleStatus,
      run.summary.compatibility.hash,
      JSON.stringify(run.summary.provenance.matchSetIds),
      JSON.stringify(run.summary),
      run.notes ?? null,
      run.createdAt,
      run.completedAt ?? null,
    ],
  )
}

export const seedWorkshopAnalyticsDemo = async (
  pool: Pool,
): Promise<WorkshopAnalyticsSnapshot> => {
  const snapshot = createWorkshopAnalyticsDemoSnapshot()
  for (const profile of snapshot.profiles) {
    await upsertAnalyticsProfile(pool, profile)
  }
  for (const run of snapshot.runs) {
    await upsertAnalyticsRun(pool, run)
  }
  return snapshot
}

const listPersistedWorkshopAnalytics = async (
  pool: Pool,
): Promise<WorkshopAnalyticsSnapshot> => {
  const [profilesResult, runsResult] = await Promise.all([
    pool.query<{
      id: string
      owner_user_id: string
      name: string
      notes: string | null
      status: "active" | "archived"
      created_at: Date | string
      updated_at: Date | string
      definition: unknown
      compatibility_key: unknown
      compatibility_hash: string
    }>(
      `
        select *
        from workshop_gauntlet_profiles
        where owner_user_id = $1
        order by updated_at desc, id asc
      `,
      [WORKSHOP_USER_ID],
    ),
    pool.query<{
      id: string
      profile_id: string
      owner_user_id: string
      run_index: number
      summary: unknown
      notes: string | null
      created_at: Date | string
      completed_at: Date | string | null
    }>(
      `
        select *
        from workshop_gauntlet_profile_runs
        where owner_user_id = $1
        order by run_index asc, id asc
      `,
      [WORKSHOP_USER_ID],
    ),
  ])
  const profiles = profilesResult.rows.map((row) =>
    AnalyticsGauntletProfileSchema.parse({
      id: row.id,
      ownerUserId: row.owner_user_id,
      name: row.name,
      ...(row.notes === null ? {} : { notes: row.notes }),
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      definition: row.definition,
      compatibility: {
        hash: row.compatibility_hash,
        key: row.compatibility_key,
        equivalent: true,
        mismatches: [],
      },
    }),
  )
  const runs = runsResult.rows.map((row) =>
    AnalyticsGauntletProfileRunSchema.parse({
      id: row.id,
      profileId: row.profile_id,
      ownerUserId: row.owner_user_id,
      runIndex: row.run_index,
      createdAt: new Date(row.created_at).toISOString(),
      ...(row.completed_at === null
        ? {}
        : { completedAt: new Date(row.completed_at).toISOString() }),
      ...(row.notes === null ? {} : { notes: row.notes }),
      summary: row.summary,
    }),
  )
  return {
    profiles,
    runs,
    selectedProfileId: profiles[0]?.id ?? "",
    selectedRunId: runs.at(-1)?.id ?? "",
  }
}

export const getWorkshopAnalyticsSnapshot = async (
  pool: Pool,
): Promise<WorkshopAnalyticsSnapshot> => {
  const existing = await listPersistedWorkshopAnalytics(pool)
  if (existing.profiles.length && existing.runs.length) {
    return existing
  }
  await seedWorkshopAnalyticsDemo(pool)
  return listPersistedWorkshopAnalytics(pool)
}

export const createPersistedWorkshopAnalyticsRerun = async (
  pool: Pool,
  profileId: string,
): Promise<{
  run: AnalyticsGauntletProfileRun
  compatibilityEquivalent: true
  mismatchCodes: []
} | null> => {
  const snapshot = await getWorkshopAnalyticsSnapshot(pool)
  const profile = snapshot.profiles.find((candidate) => candidate.id === profileId)
  if (!profile) {
    return null
  }
  const sourceRun =
    snapshot.runs
      .filter((run) => run.profileId === profileId)
      .sort((left, right) => right.runIndex - left.runIndex)[0] ?? null
  if (!sourceRun) {
    return null
  }
  const runIndex = sourceRun.runIndex + 1
  const runId = `analytics-run:${profileId}:${runIndex}`
  const createdAt = new Date().toISOString()
  const run: AnalyticsGauntletProfileRun = {
    ...sourceRun,
    id: runId,
    runIndex,
    createdAt,
    completedAt: createdAt,
    notes: "Compatible rerun generated from saved deterministic summary.",
    summary: {
      ...sourceRun.summary,
      runId,
      provenance: {
        ...sourceRun.summary.provenance,
        generatedAt: createdAt,
      },
    },
  }
  AnalyticsGauntletProfileRunSchema.parse(run)
  await upsertAnalyticsRun(pool, run)
  return { run, compatibilityEquivalent: true, mismatchCodes: [] }
}

export const comparePersistedWorkshopAnalyticsRuns = async (
  pool: Pool,
  profileId: string,
): Promise<{
  profileId: string
  baseRunId: string
  compareRunId: string
  compatibilityEquivalent: true
  delta: { wins: number; losses: number; draws: number; points: number }
} | null> => {
  const snapshot = await getWorkshopAnalyticsSnapshot(pool)
  const runs = snapshot.runs
    .filter((run) => run.profileId === profileId)
    .sort((left, right) => right.runIndex - left.runIndex)
  const [compare, base] = runs
  if (!compare || !base) {
    return null
  }
  if (compare.summary.compatibility.hash !== base.summary.compatibility.hash) {
    return null
  }
  return {
    profileId,
    baseRunId: base.id,
    compareRunId: compare.id,
    compatibilityEquivalent: true,
    delta: {
      wins: compare.summary.totals.wins - base.summary.totals.wins,
      losses: compare.summary.totals.losses - base.summary.totals.losses,
      draws: compare.summary.totals.draws - base.summary.totals.draws,
      points: compare.summary.totals.points - base.summary.totals.points,
    },
  }
}

const csvNeedsNeutralization = (value: string): boolean =>
  /^[\s]*[=+\-@]/.test(value)

export const escapeAnalyticsCsvCell = (value: unknown): string => {
  const raw =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : String(value)
  const neutralized = csvNeedsNeutralization(raw) ? `'${raw}` : raw
  return `"${neutralized.replaceAll("\"", "\"\"")}"`
}

export const createWorkshopAnalyticsExport = (
  snapshot: WorkshopAnalyticsSnapshot,
  format: WorkshopAnalyticsExportFormat,
): string | AnalyticsExportEnvelope => {
  const profile =
    snapshot.profiles.find(
      (candidate) => candidate.id === snapshot.selectedProfileId,
    ) ?? snapshot.profiles[0]
  if (!profile) {
    throw new Error("No Workshop analytics profile is available.")
  }
  const runs = snapshot.runs.filter((run) => run.profileId === profile.id)
  const envelope: AnalyticsExportEnvelope = {
    exportedBy: WORKSHOP_USER_ID,
    exportedAt: "2026-05-22T00:04:00.000Z",
    format,
    summarySchemaVersion: ANALYTICS_SUMMARY_SCHEMA_VERSION,
    profile,
    runs,
  }
  assertAnalyticsPublicSummaryLeakSafe(envelope)
  if (format === "json") {
    return envelope
  }
  const rows = [
    [
      "profile_id",
      "run_id",
      "candidate",
      "opponent",
      "tier",
      "archetypes",
      "w",
      "l",
      "d",
      "points",
      "band",
      "counted",
      "evidence_count",
      "failures",
      "side_bias",
      "match_set_id",
      "representative_replay",
    ],
    ...runs.flatMap((run) =>
      run.summary.matchupRecords.map((matchup) => [
        profile.id,
        run.id,
        matchup.candidate.label,
        matchup.opponent.label,
        matchup.opponent.tier,
        matchup.opponent.archetypeTags.join("; "),
        matchup.wins,
        matchup.losses,
        matchup.draws,
        matchup.points,
        matchup.evidence.band,
        matchup.evidence.counted,
        matchup.evidence.completedCount,
        matchup.failureCount,
        matchup.sideBias,
        matchup.matchSetId,
        matchup.replayReferences[0]?.href ?? "",
      ]),
    ),
  ]
  return `${rows
    .map((row) => row.map((cell) => escapeAnalyticsCsvCell(cell)).join(","))
    .join("\n")}\n`
}
