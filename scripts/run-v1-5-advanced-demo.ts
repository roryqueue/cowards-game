#!/usr/bin/env -S pnpm exec tsx
import { mkdir, writeFile } from "node:fs/promises"
import { setTimeout as sleep } from "node:timers/promises"
import { buildTrialLadderSeasonDto } from "../packages/persistence/src/ladder.ts"
import { createDatabasePool } from "../packages/persistence/src/db.ts"
import { migrate } from "../packages/persistence/src/migrations.ts"
import {
  listAdvancedStrategies,
  type AdvancedStrategySummary,
} from "../packages/persistence/src/advanced-strategies.ts"
import { createRepositories } from "../packages/persistence/src/repositories.ts"
import { buildStrategyRevision } from "../packages/runtime-js/src/index.ts"
import {
  createTrialLadderSeason,
  enterTrialLadderSeason,
  setTrialLadderSeasonStatus,
} from "../packages/persistence/src/ladder.ts"
import {
  EXHIBITION_SCORING_POLICY_V1,
  normalizeStrategyRuntimeMetadata,
  type CompetitionEntrantSnapshot,
  type MatchId,
  type MatchSetId,
  type StrategyRevision,
  type StrategyRevisionId,
  type UserId,
} from "../packages/spec/src/index.ts"
import { buildPublicMatchSetResultDto } from "../packages/persistence/src/competition.ts"
import type { CreateMatchInput } from "../packages/persistence/src/match-service.ts"
import { createMatchSetService } from "../packages/persistence/src/matchset-service.ts"
import { refreshMatchSetStatus } from "../packages/persistence/src/matchset-status.ts"
import { runWorkerOnce } from "../apps/worker/src/runner.ts"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"

const DEMO_MATCH_LEASE_MS = 10 * 60 * 1000
const SEASON_ID = "trial-season:v1-5-demo"
const SEASON_SLUG = "v1-5-demo"
const REPORT_DIR = ".planning/phases/37-demo-and-regression-verification"
const REPORT_JSON = `${REPORT_DIR}/v1-5-demo-report.json`
const REPORT_MD = `${REPORT_DIR}/v1-5-demo-report.md`
const RULE_VERSION = "cowards-rules-v1.4"
const CHRONICLE_VERSION = "chronicle-v1.4"

const tournamentIds = [
  "advanced:vanguard-pressure",
  "advanced:recall-hunter",
  "advanced:stonewall-shear",
  "advanced:rear-guard-sentinel",
  "advanced:center-gravity",
  "advanced:snare-weaver",
  "advanced:mirror-key",
  "advanced:ghost-orbit",
]

const examplePairs = [
  {
    id: "anti-backstab-stress",
    label: "Anti-Backstab Stress Test",
    left: "advanced:rear-guard-sentinel",
    right: "advanced:recall-hunter",
  },
  {
    id: "wall-under-pressure",
    label: "Wall Control Under Pressure",
    left: "advanced:stonewall-shear",
    right: "advanced:vanguard-pressure",
  },
  {
    id: "center-vs-mobility",
    label: "Center Control vs Mobility",
    left: "advanced:center-gravity",
    right: "advanced:ghost-orbit",
  },
  {
    id: "trap-breakpoint",
    label: "Trap Breakpoint",
    left: "advanced:snare-weaver",
    right: "advanced:vanguard-pressure",
  },
  {
    id: "memory-mirror",
    label: "Memory Adaptation Mirror",
    left: "advanced:mirror-key",
    right: "advanced:last-light",
  },
] as const

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const advancedById = (): Map<string, AdvancedStrategySummary> =>
  new Map(listAdvancedStrategies().map((strategy) => [strategy.id, strategy]))

const resetDemo = async (
  pool: ReturnType<typeof createDatabasePool>,
): Promise<void> => {
  await pool.query(`
    with v15_match_sets as (
      select id from match_sets
      where ladder_season_id = 'trial-season:v1-5-demo'
         or id like 'match-set:v1-5:%'
         or id like 'match-set:trial:trial-season:v1-5-demo:%'
    ),
    v15_matches as (
      select match_id from match_set_matches where match_set_id in (select id from v15_match_sets)
    ),
    v15_jobs as (
      select id from match_jobs where match_id in (select match_id from v15_matches)
    )
    delete from match_job_attempts where job_id in (select id from v15_jobs)
  `)
  await pool.query(`
    with v15_match_sets as (
      select id from match_sets
      where ladder_season_id = 'trial-season:v1-5-demo'
         or id like 'match-set:v1-5:%'
         or id like 'match-set:trial:trial-season:v1-5-demo:%'
    ),
    v15_matches as (
      select match_id from match_set_matches where match_set_id in (select id from v15_match_sets)
    )
    delete from match_jobs where match_id in (select match_id from v15_matches)
  `)
  await pool.query(`
    with v15_match_sets as (
      select id from match_sets
      where ladder_season_id = 'trial-season:v1-5-demo'
         or id like 'match-set:v1-5:%'
         or id like 'match-set:trial:trial-season:v1-5-demo:%'
    ),
    v15_matches as (
      select match_id from match_set_matches where match_set_id in (select id from v15_match_sets)
    )
    delete from chronicles where match_id in (select match_id from v15_matches)
  `)
  await pool.query(`
    with v15_match_sets as (
      select id from match_sets
      where ladder_season_id = 'trial-season:v1-5-demo'
         or id like 'match-set:v1-5:%'
         or id like 'match-set:trial:trial-season:v1-5-demo:%'
    )
    delete from match_set_matches where match_set_id in (select id from v15_match_sets)
  `)
  await pool.query(`
    delete from matches
    where id like 'match:match-set:v1-5:%'
       or id like 'match:match-set:trial:trial-season:v1-5-demo:%'
  `)
  await pool.query(`
    delete from competition_entrants
    where match_set_id like 'match-set:v1-5:%'
       or match_set_id like 'match-set:trial:trial-season:v1-5-demo:%'
  `)
  await pool.query(
    "delete from match_sets where ladder_season_id = $1 or id like 'match-set:v1-5:%' or id like 'match-set:trial:trial-season:v1-5-demo:%'",
    [SEASON_ID],
  )
  await pool.query("delete from trial_ladder_entries where season_id = $1", [
    SEASON_ID,
  ])
  await pool.query("delete from trial_ladder_seasons where id = $1", [
    SEASON_ID,
  ])
  await pool.query(
    "delete from strategy_revisions where strategy_id like 'strategy:demo:v1-5:%'",
  )
  await pool.query(
    "delete from strategies where id like 'strategy:demo:v1-5:%'",
  )
  await pool.query("delete from users where id like 'user:demo:v1-5:%'")
}

const seedAdvanced = async (
  pool: ReturnType<typeof createDatabasePool>,
): Promise<Map<string, StrategyRevision>> => {
  const repositories = createRepositories(pool)
  const revisions = new Map<string, StrategyRevision>()
  for (const advanced of listAdvancedStrategies()) {
    const suffix = slugify(advanced.name)
    const userId = `user:demo:v1-5:${suffix}` as UserId
    await pool.query(
      `
        insert into users (id, username, handle, display_name, password_hash)
        values ($1, $2, $3, $4, 'demo')
        on conflict (id) do update
        set username = excluded.username,
            handle = excluded.handle,
            display_name = excluded.display_name
      `,
      [userId, `v15_${suffix}`, `v15-${suffix}`, advanced.name],
    )
    const strategyId = `strategy:demo:v1-5:${suffix}`
    await repositories.upsertStrategy({
      id: strategyId,
      ownerUserId: userId,
      name: advanced.name,
      metadata: {
        accountOwned: true,
        advancedLineage: {
          advancedId: advanced.id,
          advancedName: advanced.name,
          advancedVersion: advanced.version,
          archetype: advanced.primaryArchetype,
          sourceHash: advanced.sourceHash,
        },
      },
    })
    await pool.query(
      "update strategies set description = $2, public_tags = $3 where id = $1",
      [strategyId, advanced.description, advanced.tags],
    )
    const revision = buildStrategyRevision({
      source: advanced.source,
      strategyId,
      metadata: {
        createdBy: userId,
        label: advanced.name,
        notes: advanced.description,
        tags: advanced.tags,
        advancedLineage: {
          advancedId: advanced.id,
          advancedName: advanced.name,
          advancedVersion: advanced.version,
          archetype: advanced.primaryArchetype,
          sourceHash: advanced.sourceHash,
        },
      },
    })
    await repositories.insertStrategyRevision(revision)
    revisions.set(advanced.id, revision)
  }
  return revisions
}

const loadEntrant = async (
  pool: ReturnType<typeof createDatabasePool>,
  revisionId: StrategyRevisionId,
  index: number,
): Promise<CompetitionEntrantSnapshot> => {
  const result = await pool.query<{
    revision_id: StrategyRevisionId
    owner_user_id: UserId
    handle: string
    display_name: string
    strategy_name: string
    source_hash: string
    source_bytes: number
    runtime: CompetitionEntrantSnapshot["runtime"]
    engine_compatibility: CompetitionEntrantSnapshot["engineCompatibility"]
  }>(
    `
      select
        sr.id as revision_id,
        s.owner_user_id,
        u.handle,
        u.display_name,
        s.name as strategy_name,
        sr.source_hash,
        sr.source_bytes,
        sr.runtime,
        sr.engine_compatibility
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      join users u on u.id = s.owner_user_id
      where sr.id = $1
    `,
    [revisionId],
  )
  const row = result.rows[0]
  if (!row) throw new Error(`Revision not found for entrant: ${revisionId}`)
  return {
    entrantId: `entrant:${index}`,
    entrantIndex: index,
    strategyRevisionId: row.revision_id,
    ownerUserId: row.owner_user_id,
    ownerHandle: row.handle,
    displayLabel: `@${row.handle} / "${row.strategy_name}" / ${row.source_hash.slice(0, 10)}`,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    runtime: normalizeStrategyRuntimeMetadata(row.runtime),
    engineCompatibility: row.engine_compatibility,
    lockedAt: new Date("2026-05-20T00:00:00.000Z").toISOString(),
  }
}

const oneMatchMatrix = (
  matchSetId: MatchSetId,
  entrants: readonly CompetitionEntrantSnapshot[],
): CreateMatchInput[] => [
  {
    id: `match:${matchSetId}:0` as MatchId,
    bottomStrategyRevisionId: entrants[0]!.strategyRevisionId,
    topStrategyRevisionId: entrants[1]!.strategyRevisionId,
    arenaVariantId: "arena:smoke:v1",
    seed: `seed:${matchSetId}:0`,
    bottomPlayerId: `player:${matchSetId}:entrant:0`,
    topPlayerId: `player:${matchSetId}:entrant:1`,
  },
]

const singleSidePairwiseMatrix = (
  matchSetId: MatchSetId,
  entrants: readonly CompetitionEntrantSnapshot[],
): CreateMatchInput[] => {
  const matches: CreateMatchInput[] = []
  for (let left = 0; left < entrants.length; left += 1) {
    for (let right = left + 1; right < entrants.length; right += 1) {
      matches.push({
        id: `match:${matchSetId}:${matches.length}` as MatchId,
        bottomStrategyRevisionId: entrants[left]!.strategyRevisionId,
        topStrategyRevisionId: entrants[right]!.strategyRevisionId,
        arenaVariantId: "arena:smoke:v1",
        seed: `seed:${matchSetId}:pair:${left}-${right}`,
        bottomPlayerId: `player:${matchSetId}:entrant:${left}`,
        topPlayerId: `player:${matchSetId}:entrant:${right}`,
      })
    }
  }
  return matches
}

const createExampleMatchSets = async (
  pool: ReturnType<typeof createDatabasePool>,
  revisions: Map<string, StrategyRevision>,
): Promise<MatchSetId[]> => {
  const created: MatchSetId[] = []
  for (const [index, pair] of examplePairs.entries()) {
    const left = revisions.get(pair.left)
    const right = revisions.get(pair.right)
    if (!left || !right) throw new Error(`Missing example pair ${pair.id}`)
    const matchSetId = `match-set:v1-5:example:${pair.id}` as MatchSetId
    const entrants = [
      await loadEntrant(pool, left.id, 0),
      await loadEntrant(pool, right.id, 1),
    ]
    const matches = oneMatchMatrix(matchSetId, entrants)
    await createMatchSetService(pool).createFromMatrix({
      id: matchSetId,
      matches,
      matchSet: {
        presetId: "smoke-v1",
        presetVersion: "v1",
        competitionPresetId: "smoke-exhibition-v1",
        competitionPresetVersion: "v1",
        scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
        visibility: "public",
        entrantSnapshotSet: entrants,
        publicationPolicy: {
          publicResults: true,
          publicReplayEvidence: true,
          excludesPrivateStrategyData: true,
          example: true,
          label: pair.label,
        },
        duplicateKey: `v1-5-example:${index}:${pair.id}`,
        lockedAt: new Date("2026-05-20T00:00:00.000Z"),
      },
      competitionEntrants: entrants.map((entrant) => ({
        id: `${matchSetId}:${entrant.entrantId}`,
        entrantIndex: entrant.entrantIndex,
        strategyRevisionId: entrant.strategyRevisionId,
        ownerUserId: entrant.ownerUserId,
        ownerHandle: entrant.ownerHandle,
        displayLabel: entrant.displayLabel,
        sourceHash: entrant.sourceHash,
        sourceBytes: entrant.sourceBytes,
        runtime: entrant.runtime,
        engineCompatibility: entrant.engineCompatibility,
        snapshot: entrant,
      })),
    })
    created.push(matchSetId)
  }
  return created
}

const createTournamentMatchSet = async (
  pool: ReturnType<typeof createDatabasePool>,
  revisions: Map<string, StrategyRevision>,
): Promise<MatchSetId> => {
  const matchSetId = "match-set:v1-5:tournament:advanced-eight" as MatchSetId
  const entrants = await Promise.all(
    tournamentIds.map((advancedId, index) => {
      const revision = revisions.get(advancedId)
      if (!revision) throw new Error(`Missing tournament entrant ${advancedId}`)
      return loadEntrant(pool, revision.id, index)
    }),
  )
  const matches = singleSidePairwiseMatrix(matchSetId, entrants)
  await createMatchSetService(pool).createFromMatrix({
    id: matchSetId,
    matches,
    matchSet: {
      presetId: "smoke-v1",
      presetVersion: "v1",
      competitionPresetId: "smoke-exhibition-v1",
      competitionPresetVersion: "v1",
      scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
      visibility: "public",
      entrantSnapshotSet: entrants,
      publicationPolicy: {
        publicResults: true,
        publicReplayEvidence: true,
        excludesPrivateStrategyData: true,
        trialLadder: true,
        tournament: true,
        label: "v1.5 Advanced Seed Demo Tournament",
      },
      duplicateKey: "v1-5-demo-tournament:advanced-eight",
      lockedAt: new Date("2026-05-20T00:00:00.000Z"),
    },
    competitionEntrants: entrants.map((entrant) => ({
      id: `${matchSetId}:${entrant.entrantId}`,
      entrantIndex: entrant.entrantIndex,
      strategyRevisionId: entrant.strategyRevisionId,
      ownerUserId: entrant.ownerUserId,
      ownerHandle: entrant.ownerHandle,
      displayLabel: entrant.displayLabel,
      sourceHash: entrant.sourceHash,
      sourceBytes: entrant.sourceBytes,
      runtime: entrant.runtime,
      engineCompatibility: entrant.engineCompatibility,
      snapshot: entrant,
    })),
  })
  await pool.query(
    "update match_sets set ladder_season_id = $2 where id = $1",
    [matchSetId, SEASON_ID],
  )
  return matchSetId
}

const readJobCounts = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetIds: readonly string[],
) => {
  const rows = await pool.query<{ status: string; count: number }>(
    `
      select mj.status, count(*)::integer as count
      from match_jobs mj
      join match_set_matches msm on msm.match_id = mj.match_id
      where msm.match_set_id = any($1::text[])
      group by mj.status
    `,
    [matchSetIds],
  )
  const counts = Object.fromEntries(
    rows.rows.map((row) => [row.status, row.count]),
  )
  return {
    queued: counts.queued ?? 0,
    running: counts.running ?? 0,
    complete: counts.complete ?? 0,
    failedSystem: counts.failed_system ?? 0,
  }
}

const waitForJobsToSettle = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetIds: readonly string[],
): Promise<void> => {
  for (let poll = 0; poll < 180; poll += 1) {
    const counts = await readJobCounts(pool, matchSetIds)
    if (counts.failedSystem > 0) {
      throw new Error(`v1.5 demo worker jobs failed: ${JSON.stringify(counts)}`)
    }
    if (counts.queued === 0 && counts.running === 0) {
      return
    }
    await sleep(1_000)
  }
  throw new Error(
    `v1.5 demo worker jobs did not settle: ${JSON.stringify(
      await readJobCounts(pool, matchSetIds),
    )}`,
  )
}

const runWorkers = async (
  pool: ReturnType<typeof createDatabasePool>,
): Promise<void> => {
  const runtimeConfig = createWorkerRuntimeConfig({
    strategyExecutionAdapter:
      process.env.STRATEGY_EXECUTION_ADAPTER ?? "worker-thread",
  })
  for (let index = 0; index < 128; index += 1) {
    const status = await runWorkerOnce(pool, {
      workerId: "worker:v1-5-demo",
      once: true,
      leaseMs: DEMO_MATCH_LEASE_MS,
      runtimeConfig,
      jobOwnership: {
        lifecycleOwner: "go",
        workerPurpose: "parity",
      },
    })
    if (status === "idle") break
  }
}

const chronicleMetrics = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetIds: readonly string[],
) => {
  const rows = await pool.query<{
    match_id: MatchId
    schema_version: string
    artifact: {
      reproducibility?: { versions?: { spec?: string } }
      events?: Array<{ type?: string }>
    }
  }>(
    `
      select c.match_id, c.schema_version, c.artifact
      from chronicles c
      join match_set_matches msm on msm.match_id = c.match_id
      where msm.match_set_id = any($1::text[])
      order by c.match_id asc
    `,
    [matchSetIds],
  )
  const eventCounts = new Map<string, number>()
  const ruleVersions = new Set<string>()
  const schemaVersions = new Set<string>()
  for (const row of rows.rows) {
    schemaVersions.add(row.schema_version)
    const ruleVersion = row.artifact.reproducibility?.versions?.spec
    if (ruleVersion) ruleVersions.add(ruleVersion)
    for (const event of row.artifact.events ?? []) {
      if (event.type)
        eventCounts.set(event.type, (eventCounts.get(event.type) ?? 0) + 1)
    }
  }
  const count = (eventType: string) => eventCounts.get(eventType) ?? 0
  return {
    chronicleCount: rows.rowCount ?? 0,
    schemaVersions: [...schemaVersions].sort(),
    ruleVersions: [...ruleVersions].sort(),
    cycleStarted: count("CYCLE_STARTED"),
    activationSkipped: count("ACTIVATION_SKIPPED"),
    moveAdvanced: count("MOVE_ADVANCED"),
    moveBlocked: count("MOVE_BLOCKED"),
    backstabResolved: count("BACKSTAB_RESOLVED"),
    contractionResolved: count("CONTRACTION_RESOLVED"),
    matchEnded: count("MATCH_ENDED"),
    replaySamples: rows.rows.slice(0, 8).map((row) => ({
      matchId: row.match_id,
      replayHref: `/matches/${encodeURIComponent(row.match_id)}/replay`,
    })),
  }
}

const writeReport = async (report: unknown): Promise<void> => {
  await mkdir(REPORT_DIR, { recursive: true })
  await writeFile(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`)
  const data = report as {
    seasonUrl: string
    standings: Array<{
      rank: number
      entrant: string
      record: string
      points: number
    }>
    exampleMatchSets: Array<{ label: string; resultHref: string }>
    replaySamples: Array<{ replayHref: string }>
  }
  await writeFile(
    REPORT_MD,
    [
      "# v1.5 Advanced Strategy Demo Report",
      "",
      "This is deterministic local evidence, not a durable public rating.",
      "",
      `- Tournament: \`${data.seasonUrl}\``,
      "",
      "## Standings",
      "",
      ...data.standings.map(
        (standing) =>
          `- ${standing.rank}. ${standing.entrant} — ${standing.record}, ${standing.points} points`,
      ),
      "",
      "## Example MatchSets",
      "",
      ...data.exampleMatchSets.map(
        (matchSet) => `- ${matchSet.label}: \`${matchSet.resultHref}\``,
      ),
      "",
      "## Representative Replays",
      "",
      ...data.replaySamples.map((sample) => `- \`${sample.replayHref}\``),
      "",
    ].join("\n"),
  )
}

const getExampleMatchSetIds = (): MatchSetId[] =>
  examplePairs.map((pair) => `match-set:v1-5:example:${pair.id}` as MatchSetId)

const TOURNAMENT_MATCH_SET_ID =
  "match-set:v1-5:tournament:advanced-eight" as MatchSetId

const markCompleteEvidenceCounted = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetIds: readonly MatchSetId[],
): Promise<void> => {
  for (const matchSetId of matchSetIds) {
    const status = await refreshMatchSetStatus(pool, matchSetId)
    if (status.status !== "complete" || status.scoring.degraded) {
      throw new Error(
        `v1.5 MatchSet was not complete/counted: ${matchSetId} ${JSON.stringify(status)}`,
      )
    }
    await pool.query(
      `
        update match_sets
        set counted_status = 'counted',
            public_counted_reason = null,
            public_counted_explanation = 'Complete replay-backed v1.5 local demo evidence.'
        where id = $1
      `,
      [matchSetId],
    )
    const dto = await buildPublicMatchSetResultDto(pool, matchSetId)
    if (!dto || dto.metadata.countedStatus !== "counted") {
      throw new Error(`v1.5 public MatchSet is not counted: ${matchSetId}`)
    }
  }
}

const buildDemoReport = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetIds: readonly MatchSetId[],
) => {
  const advanced = advancedById()
  const completedSeason = await buildTrialLadderSeasonDto(pool, SEASON_ID)
  if (!completedSeason) throw new Error("v1.5 demo season was not created")
  const metrics = await chronicleMetrics(pool, matchSetIds)
  return {
    generatedAt: new Date().toISOString(),
    seasonId: SEASON_ID,
    seasonUrl: `/ladder/${encodeURIComponent(SEASON_SLUG)}`,
    scheduled: {
      createdMatchSetIds: [TOURNAMENT_MATCH_SET_ID],
      note: "v1.5 uses one deterministic 8-entrant smoke round robin MatchSet for the local demo tournament.",
    },
    tournamentEntrants: tournamentIds.map((id) => {
      const strategy = advanced.get(id)!
      return {
        advancedId: id,
        name: strategy.name,
        archetype: strategy.primaryArchetype,
        sourceHash: strategy.sourceHash,
        strategyHref: `/strategies/${encodeURIComponent(
          `strategy:demo:v1-5:${slugify(strategy.name)}`,
        )}`,
        playerHref: `/players/${encodeURIComponent(
          `v15-${slugify(strategy.name)}`,
        )}`,
      }
    }),
    standings: completedSeason.standings.map((standing) => ({
      rank: standing.rank,
      entrant: standing.displayLabel,
      points: standing.points,
      record: `${standing.wins}-${standing.losses}-${standing.draws}`,
    })),
    exampleMatchSets: examplePairs.map((pair) => ({
      id: `match-set:v1-5:example:${pair.id}`,
      label: pair.label,
      resultHref: `/matchsets/${encodeURIComponent(
        `match-set:v1-5:example:${pair.id}`,
      )}`,
    })),
    tournamentMatchSets: completedSeason.matchSets.map((matchSet) => ({
      matchSetId: matchSet.matchSetId,
      countedStatus: matchSet.countedStatus,
      resultHref: matchSet.resultHref,
    })),
    replaySamples: metrics.replaySamples,
    metrics,
  }
}

const main = async (): Promise<void> => {
  const pool = createDatabasePool()
  try {
    await migrate(pool)
    if (process.env.REUSE_V15_DEMO === "1") {
      const allMatchSetIds = [
        ...getExampleMatchSetIds(),
        TOURNAMENT_MATCH_SET_ID,
      ]
      await markCompleteEvidenceCounted(pool, allMatchSetIds)
      await setTrialLadderSeasonStatus(pool, {
        seasonId: SEASON_ID,
        status: "completed",
        reason: "All v1.5 demo MatchSets completed with counted evidence.",
      })
      const report = await buildDemoReport(pool, allMatchSetIds)
      await writeReport(report)
      console.log(JSON.stringify(report, null, 2))
      return
    }
    await resetDemo(pool)
    const advanced = advancedById()
    const revisions = await seedAdvanced(pool)
    const exampleMatchSetIds = await createExampleMatchSets(pool, revisions)
    const seasonId = await createTrialLadderSeason(pool, {
      seasonId: SEASON_ID,
      slug: SEASON_SLUG,
      name: "v1.5 Advanced Seed Demo Tournament",
      description:
        "Completed deterministic local demo tournament for the eight Advanced seeds most likely to win a Match.",
      seasonSeed: "v1-5-demo-seed",
    })
    await pool.query(
      "update trial_ladder_seasons set minimum_entries = 8, target_pod_size = 8 where id = $1",
      [seasonId],
    )
    await setTrialLadderSeasonStatus(pool, {
      seasonId,
      status: "open",
      reason: "Open v1.5 seeded demo tournament.",
    })
    for (const advancedId of tournamentIds) {
      const revision = revisions.get(advancedId)
      const strategy = advanced.get(advancedId)
      if (!revision || !strategy) throw new Error(`Missing ${advancedId}`)
      await enterTrialLadderSeason(pool, {
        seasonId,
        userId: revision.metadata.createdBy as UserId,
        revisionId: revision.id,
      })
    }
    const tournamentMatchSetId = await createTournamentMatchSet(pool, revisions)
    const allMatchSetIds = [...exampleMatchSetIds, tournamentMatchSetId]
    await runWorkers(pool)
    await waitForJobsToSettle(pool, allMatchSetIds)
    for (const matchSetId of allMatchSetIds) {
      const status = await refreshMatchSetStatus(pool, matchSetId)
      if (status.status !== "complete" || status.scoring.degraded) {
        throw new Error(
          `v1.5 MatchSet was not complete/counted: ${matchSetId} ${JSON.stringify(status)}`,
        )
      }
      await pool.query(
        `
          update match_sets
          set counted_status = 'counted',
              public_counted_reason = null,
              public_counted_explanation = 'Complete replay-backed v1.5 local demo evidence.'
          where id = $1
        `,
        [matchSetId],
      )
      const dto = await buildPublicMatchSetResultDto(pool, matchSetId)
      if (!dto || dto.metadata.countedStatus !== "counted") {
        throw new Error(`v1.5 public MatchSet is not counted: ${matchSetId}`)
      }
    }
    await setTrialLadderSeasonStatus(pool, {
      seasonId,
      status: "completed",
      reason: "All v1.5 demo MatchSets completed with counted evidence.",
    })
    const completedSeason = await buildTrialLadderSeasonDto(pool, seasonId)
    if (!completedSeason) throw new Error("v1.5 demo season was not created")
    const metrics = await chronicleMetrics(pool, allMatchSetIds)
    if (
      metrics.schemaVersions.length !== 1 ||
      metrics.schemaVersions[0] !== CHRONICLE_VERSION ||
      metrics.ruleVersions.length !== 1 ||
      metrics.ruleVersions[0] !== RULE_VERSION
    ) {
      throw new Error(
        `v1.5 demo versions are invalid: ${JSON.stringify(metrics)}`,
      )
    }
    if (
      metrics.cycleStarted === 0 ||
      metrics.moveAdvanced === 0 ||
      metrics.contractionResolved === 0 ||
      metrics.matchEnded !== metrics.chronicleCount
    ) {
      throw new Error(
        `v1.5 demo did not produce realistic signals: ${JSON.stringify(metrics)}`,
      )
    }
    const report = {
      generatedAt: new Date().toISOString(),
      seasonId,
      seasonUrl: `/ladder/${encodeURIComponent(SEASON_SLUG)}`,
      scheduled: {
        createdMatchSetIds: [tournamentMatchSetId],
        note: "v1.5 uses one deterministic 8-entrant smoke round robin MatchSet for the local demo tournament.",
      },
      tournamentEntrants: tournamentIds.map((id) => {
        const strategy = advanced.get(id)!
        return {
          advancedId: id,
          name: strategy.name,
          archetype: strategy.primaryArchetype,
          sourceHash: strategy.sourceHash,
          strategyHref: `/strategies/${encodeURIComponent(
            `strategy:demo:v1-5:${slugify(strategy.name)}`,
          )}`,
          playerHref: `/players/${encodeURIComponent(`v15-${slugify(strategy.name)}`)}`,
        }
      }),
      standings: completedSeason.standings.map((standing) => ({
        rank: standing.rank,
        entrant: standing.displayLabel,
        points: standing.points,
        record: `${standing.wins}-${standing.losses}-${standing.draws}`,
      })),
      exampleMatchSets: examplePairs.map((pair) => ({
        id: `match-set:v1-5:example:${pair.id}`,
        label: pair.label,
        resultHref: `/matchsets/${encodeURIComponent(
          `match-set:v1-5:example:${pair.id}`,
        )}`,
      })),
      tournamentMatchSets: completedSeason.matchSets.map((matchSet) => ({
        matchSetId: matchSet.matchSetId,
        countedStatus: matchSet.countedStatus,
        resultHref: matchSet.resultHref,
      })),
      replaySamples: metrics.replaySamples,
      metrics,
    }
    await writeReport(report)
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await pool.end()
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
