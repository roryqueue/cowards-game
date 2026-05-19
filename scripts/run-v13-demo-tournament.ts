#!/usr/bin/env -S pnpm exec tsx
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
  "starter:corner-lurker",
  "starter:backstab-hunter",
  "starter:wall-press",
  "starter:ring-runner",
  "starter:center-turtle",
  "starter:aggro-chaser",
  "starter:escape-artist",
]

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
      where ms.ladder_season_id = 'trial-season:v13-demo'
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
      where ms.ladder_season_id = 'trial-season:v13-demo'
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
      where ms.ladder_season_id = 'trial-season:v13-demo'
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
      where ms.ladder_season_id = 'trial-season:v13-demo'
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
    "delete from match_sets where ladder_season_id = 'trial-season:v13-demo' or id like 'match-set:trial:trial-season:v13-demo:%'",
  )
  await pool.query("delete from trial_ladder_seasons where id = $1", [
    "trial-season:v13-demo",
  ])
  await pool.query(
    "delete from strategy_revisions where strategy_id like 'strategy:demo:%'",
  )
  await pool.query("delete from strategies where id like 'strategy:demo:%'")
  await pool.query("delete from users where id like 'user:demo:%'")
}

const main = async (): Promise<void> => {
  const pool = createDatabasePool()
  const runtimeConfig = createWorkerRuntimeConfig({
    strategyExecutionAdapter:
      process.env.STRATEGY_EXECUTION_ADAPTER ?? "subprocess",
  })
  try {
    await migrate(pool)
    await resetDemoTournament(pool)
    const repositories = createRepositories(pool)
    const seasonId = await createTrialLadderSeason(pool, {
      seasonId: "trial-season:v13-demo",
      slug: "v13-demo",
      name: "v1.3 Demo Trial Ladder",
      description:
        "Completed demo tournament using the eight strongest starter doctrines.",
      seasonSeed: "v13-demo-seed",
    }).catch(async (error: unknown) => {
      if (
        error instanceof Error &&
        /duplicate key|already exists/i.test(error.message)
      ) {
        return "trial-season:v13-demo"
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
        workerId: "worker:v13-demo",
        once: true,
        runtimeConfig,
      })
      if (status === "idle") break
    }
    const season = await buildTrialLadderSeasonDto(pool, seasonId)
    if (!season) throw new Error("Demo season was not created")
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
    console.log(
      JSON.stringify(
        {
          seasonUrl: `/ladder/${encodeURIComponent(completedSeason.slug)}`,
          seasonId,
          runtimeAdapter: runtimeConfig.metadata.id,
          runtimeBoundary: runtimeConfig.metadata.isolationBoundary,
          scheduled,
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
