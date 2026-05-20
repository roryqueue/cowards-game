#!/usr/bin/env -S pnpm exec tsx
import { setTimeout as sleep } from "node:timers/promises"
import {
  createDatabasePool,
  migrate,
} from "../packages/persistence/src/index.ts"
import { createRepositories } from "../packages/persistence/src/repositories.ts"
import {
  buildTrialLadderSeasonDto,
  createTrialLadderSeason,
  enterTrialLadderSeason,
  scheduleTrialLadderSeason,
  setTrialLadderSeasonStatus,
} from "../packages/persistence/src/ladder.ts"
import {
  findStarterStrategy,
  type StarterStrategyId,
} from "../packages/persistence/src/starter-strategies.ts"
import { buildStrategyRevision } from "../packages/runtime-js/src/index.ts"
import { runWorkerOnce } from "../apps/worker/src/runner.ts"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"
import type { StrategyId, UserId } from "@cowards/spec"

const seedStarters: StarterStrategyId[] = [
  "starter:centerline-bully",
  "starter:backstab-hunter",
  "starter:wall-press",
  "starter:ring-runner",
  "starter:mirror-breaker",
  "starter:aggro-chaser",
  "starter:escape-artist",
  "starter:trap-setter",
]

const DEMO_MATCH_LEASE_MS = 10 * 60 * 1000
const ACTIVE_SEASON_ID = "trial-season:v1-4-demo"
const HISTORICAL_SEASON_ID = "trial-season:v13-demo"
const ACTIVE_RULE_VERSION = "cowards-rules-v1.4"
const ACTIVE_CHRONICLE_VERSION = "chronicle-v1.4"

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const resetDemoTournament = async (
  pool: ReturnType<typeof createDatabasePool>,
): Promise<void> => {
  await pool.query(`
    with demo_matches as (
      select msm.match_id
      from match_set_matches msm
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id in ('trial-season:v1-4-demo', 'trial-season:v13-demo')
        or ms.id like 'match-set:trial:trial-season:v1-4-demo:%'
        or ms.id like 'match-set:trial:trial-season:v13-demo:%'
    ),
    demo_jobs as (
      select id
      from match_jobs
      where match_id in (select match_id from demo_matches)
    )
    delete from match_job_attempts
    where job_id in (select id from demo_jobs)
  `)
  await pool.query(`
    with demo_matches as (
      select msm.match_id
      from match_set_matches msm
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id in ('trial-season:v1-4-demo', 'trial-season:v13-demo')
        or ms.id like 'match-set:trial:trial-season:v1-4-demo:%'
        or ms.id like 'match-set:trial:trial-season:v13-demo:%'
    )
    delete from match_jobs
    where match_id in (select match_id from demo_matches)
  `)
  await pool.query(`
    with demo_matches as (
      select msm.match_id
      from match_set_matches msm
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id in ('trial-season:v1-4-demo', 'trial-season:v13-demo')
        or ms.id like 'match-set:trial:trial-season:v1-4-demo:%'
        or ms.id like 'match-set:trial:trial-season:v13-demo:%'
    )
    delete from chronicles
    where match_id in (select match_id from demo_matches)
  `)
  await pool.query(`
    with demo_matches as (
      select msm.match_id
      from match_set_matches msm
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id in ('trial-season:v1-4-demo', 'trial-season:v13-demo')
        or ms.id like 'match-set:trial:trial-season:v1-4-demo:%'
        or ms.id like 'match-set:trial:trial-season:v13-demo:%'
    )
    delete from match_set_matches
    where match_id in (select match_id from demo_matches)
  `)
  await pool.query(`
    delete from matches
    where bottom_strategy_revision_id in (
        select id from strategy_revisions where strategy_id like 'strategy:demo:%'
      )
      or top_strategy_revision_id in (
        select id from strategy_revisions where strategy_id like 'strategy:demo:%'
      )
  `)
  await pool.query(
    "delete from match_sets where ladder_season_id in ('trial-season:v1-4-demo', 'trial-season:v13-demo') or id like 'match-set:trial:trial-season:v1-4-demo:%' or id like 'match-set:trial:trial-season:v13-demo:%'",
  )
  await pool.query("delete from trial_ladder_seasons where id in ($1, $2)", [
    ACTIVE_SEASON_ID,
    HISTORICAL_SEASON_ID,
  ])
  await pool.query(
    "delete from strategy_revisions where strategy_id like 'strategy:demo:%'",
  )
  await pool.query("delete from strategies where id like 'strategy:demo:%'")
  await pool.query("delete from users where id like 'user:demo:%'")
}

const readChronicleMetrics = async (
  pool: ReturnType<typeof createDatabasePool>,
  seasonId: string,
) => {
  const rows = await pool.query<{
    match_id: string
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
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id = $1
      order by c.match_id asc
    `,
    [seasonId],
  )
  const eventCounts = new Map<string, number>()
  const ruleVersions = new Set<string>()
  const schemaVersions = new Set<string>()
  for (const row of rows.rows) {
    schemaVersions.add(row.schema_version)
    const ruleVersion = row.artifact.reproducibility?.versions?.spec
    if (ruleVersion) {
      ruleVersions.add(ruleVersion)
    }
    for (const event of row.artifact.events ?? []) {
      if (event.type) {
        eventCounts.set(event.type, (eventCounts.get(event.type) ?? 0) + 1)
      }
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
    replaySamples: rows.rows.slice(0, 3).map((row) => ({
      matchId: row.match_id,
      replayHref: `/matches/${encodeURIComponent(row.match_id)}/replay`,
    })),
  }
}

const readDemoJobCounts = async (
  pool: ReturnType<typeof createDatabasePool>,
  seasonId: string,
) => {
  const rows = await pool.query<{ status: string; count: number }>(
    `
      select mj.status, count(*)::integer as count
      from match_jobs mj
      join match_set_matches msm on msm.match_id = mj.match_id
      join match_sets ms on ms.id = msm.match_set_id
      where ms.ladder_season_id = $1
      group by mj.status
    `,
    [seasonId],
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

const waitForDemoJobsToSettle = async (
  pool: ReturnType<typeof createDatabasePool>,
  seasonId: string,
): Promise<void> => {
  for (let poll = 0; poll < 120; poll += 1) {
    const counts = await readDemoJobCounts(pool, seasonId)
    if (counts.failedSystem > 0) {
      throw new Error(`Demo worker jobs failed: ${JSON.stringify(counts)}`)
    }
    if (counts.queued === 0 && counts.running === 0) {
      return
    }
    await sleep(1_000)
  }
  throw new Error(
    `Demo worker jobs did not settle: ${JSON.stringify(
      await readDemoJobCounts(pool, seasonId),
    )}`,
  )
}

const main = async (): Promise<void> => {
  const pool = createDatabasePool()
  const runtimeConfig = createWorkerRuntimeConfig({
    strategyExecutionAdapter:
      process.env.STRATEGY_EXECUTION_ADAPTER ?? "worker-thread",
  })
  try {
    await migrate(pool)
    await resetDemoTournament(pool)
    const repositories = createRepositories(pool)
    const seasonId = await createTrialLadderSeason(pool, {
      seasonId: ACTIVE_SEASON_ID,
      slug: "v1-4-demo",
      name: "v1.4 Demo Trial Ladder",
      description:
        "Completed demo tournament using the eight strongest starter doctrines.",
      seasonSeed: "v1-4-demo-seed",
    }).catch(async (error: unknown) => {
      if (
        error instanceof Error &&
        /duplicate key|already exists/i.test(error.message)
      ) {
        return ACTIVE_SEASON_ID
      }
      throw error
    })
    await setTrialLadderSeasonStatus(pool, {
      seasonId,
      status: "open",
      reason: "Open seeded demo trial ladder.",
    })

    for (const starterId of seedStarters) {
      const starter = findStarterStrategy(starterId)
      if (!starter) throw new Error(`Missing starter ${starterId}`)
      const suffix = slugify(starter.name)
      const userId = `user:demo:${suffix}` as UserId
      await pool.query(
        `
          insert into users (id, username, handle, display_name, password_hash)
          values ($1, $2, $3, $4, 'demo')
          on conflict (id) do update
          set username = excluded.username,
              handle = excluded.handle,
              display_name = excluded.display_name
        `,
        [userId, `demo_${suffix}`, suffix, starter.name],
      )
      const strategyId = `strategy:demo:${suffix}` as StrategyId
      await repositories.upsertStrategy({
        id: strategyId,
        ownerUserId: userId,
        name: starter.name,
        metadata: {
          accountOwned: true,
          starterLineage: {
            starterId: starter.id,
            starterName: starter.name,
            starterVersion: starter.version,
            sourceHash: starter.sourceHash,
          },
        },
      })
      await pool.query(
        "update strategies set description = $2, public_tags = $3 where id = $1",
        [strategyId, starter.description, starter.tags],
      )
      const revision = buildStrategyRevision({
        source: starter.source,
        strategyId,
        metadata: {
          createdBy: userId,
          label: starter.name,
          notes: starter.description,
          tags: starter.tags,
          starterLineage: {
            starterId: starter.id,
            starterName: starter.name,
            starterVersion: starter.version,
            sourceHash: starter.sourceHash,
          },
        },
      })
      await repositories.insertStrategyRevision(revision)
      await enterTrialLadderSeason(pool, {
        seasonId,
        userId,
        revisionId: revision.id,
      }).catch((error: unknown) => {
        if (
          error instanceof Error &&
          /duplicate key|one active/i.test(error.message)
        ) {
          return "existing"
        }
        throw error
      })
    }

    const scheduled = await scheduleTrialLadderSeason(pool, { seasonId })
    const maxJobs = 256
    for (let index = 0; index < maxJobs; index += 1) {
      const status = await runWorkerOnce(pool, {
        workerId: "worker:v1-4-demo",
        once: true,
        leaseMs: DEMO_MATCH_LEASE_MS,
        runtimeConfig,
      })
      if (status === "idle") break
    }
    await waitForDemoJobsToSettle(pool, seasonId)
    const season = await buildTrialLadderSeasonDto(pool, seasonId)
    if (!season) throw new Error("Demo season was not created")
    if (season.entries.length < 8) {
      throw new Error(`Demo tournament requires at least 8 entrants.`)
    }
    const incomplete = season.matchSets.filter(
      (matchSet) => matchSet.countedStatus !== "counted",
    )
    if (incomplete.length > 0) {
      throw new Error(
        `Demo tournament has non-counted MatchSets: ${incomplete
          .map((matchSet) => `${matchSet.matchSetId}:${matchSet.countedStatus}`)
          .join(", ")}`,
      )
    }
    await setTrialLadderSeasonStatus(pool, {
      seasonId,
      status: "completed",
      reason: "All seeded demo MatchSets completed with counted evidence.",
    })
    const completedSeason = await buildTrialLadderSeasonDto(pool, seasonId)
    if (!completedSeason) throw new Error("Demo season was not completed")
    const metrics = await readChronicleMetrics(pool, seasonId)
    if (
      metrics.schemaVersions.length !== 1 ||
      metrics.schemaVersions[0] !== ACTIVE_CHRONICLE_VERSION
    ) {
      throw new Error(
        `Demo Chronicles are not all ${ACTIVE_CHRONICLE_VERSION}: ${metrics.schemaVersions.join(", ")}`,
      )
    }
    if (
      metrics.ruleVersions.length !== 1 ||
      metrics.ruleVersions[0] !== ACTIVE_RULE_VERSION
    ) {
      throw new Error(
        `Demo Chronicles are not all ${ACTIVE_RULE_VERSION}: ${metrics.ruleVersions.join(", ")}`,
      )
    }
    if (
      metrics.cycleStarted === 0 ||
      metrics.moveAdvanced === 0 ||
      metrics.contractionResolved === 0 ||
      metrics.matchEnded !== metrics.chronicleCount
    ) {
      throw new Error(
        `Demo tournament did not produce realistic v1.4 signals: ${JSON.stringify(metrics)}`,
      )
    }
    console.log(
      JSON.stringify(
        {
          seasonUrl: `/ladder/${encodeURIComponent(completedSeason.slug)}`,
          seasonId,
          runtimeAdapter: runtimeConfig.metadata.id,
          runtimeBoundary: runtimeConfig.metadata.isolationBoundary,
          scheduled,
          entrants: completedSeason.entries.map((entry) => ({
            label: entry.displayLabel,
            rules: entry.engineCompatibility.spec,
            sourceHash: entry.sourceHash.slice(0, 10),
          })),
          metrics,
          standings: completedSeason.standings.map((standing) => ({
            rank: standing.rank,
            entrant: standing.displayLabel,
            points: standing.points,
            record: `${standing.wins}-${standing.losses}-${standing.draws}`,
          })),
          matchSets: completedSeason.matchSets.map((matchSet) => ({
            matchSetId: matchSet.matchSetId,
            countedStatus: matchSet.countedStatus,
            resultHref: matchSet.resultHref,
          })),
        },
        null,
        2,
      ),
    )
  } finally {
    await pool.end()
  }
}

void main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
