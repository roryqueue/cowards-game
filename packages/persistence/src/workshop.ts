import { randomUUID } from "node:crypto"
import {
  buildStrategyRevision,
  validateStrategySource,
  type StrategyRevisionValidationReport,
} from "@cowards/runtime-js"
import type {
  MatchId,
  MatchSetId,
  PlayerId,
  StrategyId,
  StrategyRevision,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"
import { createMatchSetService } from "./matchset-service.js"
import {
  listMatchStatusesForSet,
  refreshMatchSetStatus,
} from "./matchset-status.js"
import { getMatchSetPreset, type MatchSetPresetId } from "./presets.js"
import { createRepositories } from "./repositories.js"
import type { MatchSetScore } from "./scoring.js"
import {
  cautiousSource,
  createDevelopmentSeedData,
  recklessSource,
} from "./seed.js"
import type { MatchSetStatus, MatchStatus } from "./schema.js"

export const WORKSHOP_USER_ID = "user:local"
export const WORKSHOP_STRATEGY_ID = "strategy:local-workshop" as StrategyId
export const WORKSHOP_PLAYER_ID = "player:workshop-local" as PlayerId
export const WORKSHOP_MATCH_SET_PREFIX = "match-set:workshop:"

export const workshopTemplateSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

export const sentinelSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { hold: true } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const forward = input.self.facing ?? "UP"
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction: forward }
        : { type: "TURN_TO_STONE" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const cautiousOpponentRevision = buildStrategyRevision({
  source: cautiousSource,
  strategyId: "strategy:cautious",
  metadata: { createdBy: WORKSHOP_USER_ID, label: "Cautious" },
})

const recklessOpponentRevision = buildStrategyRevision({
  source: recklessSource,
  strategyId: "strategy:reckless",
  metadata: { createdBy: WORKSHOP_USER_ID, label: "Reckless" },
})

export const WORKSHOP_OPPONENTS = [
  {
    id: "opponent:cautious",
    label: "Cautious",
    strategyId: "strategy:cautious" as StrategyId,
    playerId: "player:opponent:cautious" as PlayerId,
    revisionId: cautiousOpponentRevision.id,
  },
  {
    id: "opponent:reckless",
    label: "Reckless",
    strategyId: "strategy:reckless" as StrategyId,
    playerId: "player:opponent:reckless" as PlayerId,
    revisionId: recklessOpponentRevision.id,
  },
] as const

export interface WorkshopRevisionSummary {
  id: StrategyRevisionId
  strategyId: StrategyId
  label?: string | undefined
  notes?: string | undefined
  createdBy?: string | undefined
  sourceHash: string
  sourceBytes: number
  valid: boolean
  validation: StrategyRevisionValidationReport
  metadata: StrategyRevision["metadata"]
  createdAt: string
  usedInMatches: number
}

export interface WorkshopPresetSummary {
  id: MatchSetPresetId
  label: string
  matchCount: number
  arenaVariantIds: string[]
  seeds: string[]
  mirrorSides: boolean
}

export interface WorkshopOpponentSummary {
  id: (typeof WORKSHOP_OPPONENTS)[number]["id"]
  label: string
  revisionId: StrategyRevisionId
}

export interface WorkshopTemplateSummary {
  id: "template:cautious" | "template:reckless" | "template:sentinel"
  label: string
  source: string
  validation: StrategyRevisionValidationReport
}

export interface WorkshopTestSummary {
  matchSetId: MatchSetId
  status: MatchSetStatus
  matchCount: number
  matchIds?: MatchId[] | undefined
  matches: Array<{ matchId: MatchId; status: MatchStatus }>
  scoring: MatchSetScore
}

export interface WorkshopSnapshot {
  templateSource: string
  templateValidation: StrategyRevisionValidationReport
  revisions: WorkshopRevisionSummary[]
  presets: WorkshopPresetSummary[]
  opponents: WorkshopOpponentSummary[]
  templates: WorkshopTemplateSummary[]
}

const presetLabels: Record<MatchSetPresetId, string> = {
  "smoke-v1": "Smoke",
  "standard-v1": "Standard",
  "stress-v1": "Stress",
}

export const LIST_WORKSHOP_REVISIONS_SQL = `
  select
    sr.id,
    sr.strategy_id,
    sr.source_hash,
    sr.source_bytes,
    sr.validation,
    sr.metadata,
    sr.created_at,
    (
      select count(*)::integer
      from matches m
      where m.bottom_strategy_revision_id = sr.id
         or m.top_strategy_revision_id = sr.id
    ) as used_in_matches
  from strategy_revisions sr
  where sr.strategy_id = $1
  order by sr.created_at desc, sr.id desc
`

export const GET_WORKSHOP_REVISION_SOURCE_SQL = `
  select source
  from strategy_revisions
  where id = $1
    and strategy_id = $2
`

export const listWorkshopPresets = (): WorkshopPresetSummary[] =>
  (["smoke-v1", "standard-v1", "stress-v1"] as const).map((presetId) => {
    const preset = getMatchSetPreset(presetId)
    return {
      id: preset.id,
      label: presetLabels[preset.id],
      matchCount:
        preset.arenaVariantIds.length *
        preset.seeds.length *
        (preset.mirrorSides ? 2 : 1),
      arenaVariantIds: preset.arenaVariantIds,
      seeds: preset.seeds,
      mirrorSides: preset.mirrorSides,
    }
  })

export const listWorkshopOpponents = (): WorkshopOpponentSummary[] =>
  WORKSHOP_OPPONENTS.map((opponent) => ({
    id: opponent.id,
    label: opponent.label,
    revisionId: opponent.revisionId,
  }))

export const listWorkshopTemplates = (): WorkshopTemplateSummary[] => [
  {
    id: "template:cautious",
    label: "Cautious",
    source: cautiousSource,
    validation: validateStrategySource(cautiousSource),
  },
  {
    id: "template:reckless",
    label: "Reckless",
    source: recklessSource,
    validation: validateStrategySource(recklessSource),
  },
  {
    id: "template:sentinel",
    label: "Sentinel",
    source: sentinelSource,
    validation: validateStrategySource(sentinelSource),
  },
]

export const validateWorkshopSource = (
  source: string,
): StrategyRevisionValidationReport => validateStrategySource(source)

export const ensureWorkshopSeed = async (pool: Pool): Promise<void> => {
  const seed = createDevelopmentSeedData()
  await withTransaction(pool, async (client) => {
    const repositories = createRepositories(client)

    for (const user of seed.users) {
      await repositories.upsertUser(user)
    }
    await repositories.upsertStrategy({
      id: WORKSHOP_STRATEGY_ID,
      ownerUserId: WORKSHOP_USER_ID,
      name: "Workshop Strategy",
    })
    for (const strategy of seed.strategies) {
      await repositories.upsertStrategy(strategy)
    }
    for (const revision of seed.revisions) {
      await repositories.insertStrategyRevision(revision)
    }
    for (const arena of seed.arenas) {
      await repositories.upsertArenaVariant(arena)
    }
  })
}

export const listWorkshopRevisions = async (
  pool: Pool,
): Promise<WorkshopRevisionSummary[]> => {
  await ensureWorkshopSeed(pool)
  const result = await pool.query<{
    id: StrategyRevisionId
    strategy_id: StrategyId
    source_hash: string
    source_bytes: number
    validation: StrategyRevisionValidationReport
    metadata: StrategyRevision["metadata"]
    created_at: Date
    used_in_matches: number
  }>(LIST_WORKSHOP_REVISIONS_SQL, [WORKSHOP_STRATEGY_ID])

  return result.rows.map((row) => ({
    id: row.id,
    strategyId: row.strategy_id,
    label: row.metadata.label,
    notes: row.metadata.notes,
    createdBy: row.metadata.createdBy,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    valid: row.validation.valid,
    validation: row.validation,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
    usedInMatches: row.used_in_matches,
  }))
}

export const insertWorkshopRevision = async (
  pool: Pool,
  revision: StrategyRevision,
): Promise<StrategyRevision> => {
  if (revision.strategyId !== WORKSHOP_STRATEGY_ID) {
    throw new Error("Workshop revisions must use the Workshop strategy id")
  }
  await ensureWorkshopSeed(pool)
  await createRepositories(pool).insertStrategyRevision(revision)
  return revision
}

export const getWorkshopRevisionSource = async (
  pool: Pool,
  revisionId: StrategyRevisionId,
): Promise<string | null> => {
  const result = await pool.query<{ source: string }>(
    GET_WORKSHOP_REVISION_SOURCE_SQL,
    [revisionId, WORKSHOP_STRATEGY_ID],
  )
  return result.rows[0]?.source ?? null
}

export const buildWorkshopRevision = (input: {
  source: string
  label?: string | undefined
  notes?: string | undefined
}): StrategyRevision =>
  buildStrategyRevision({
    source: input.source,
    strategyId: WORKSHOP_STRATEGY_ID,
    metadata: {
      createdBy: WORKSHOP_USER_ID,
      ...(input.label ? { label: input.label } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    },
  })

const createWorkshopMatchSetId = (): MatchSetId =>
  `${WORKSHOP_MATCH_SET_PREFIX}${randomUUID()}` as MatchSetId

const findWorkshopOpponent = (
  opponentId: WorkshopOpponentSummary["id"],
): (typeof WORKSHOP_OPPONENTS)[number] => {
  const opponent = WORKSHOP_OPPONENTS.find(
    (candidate) => candidate.id === opponentId,
  )
  if (!opponent) {
    throw new Error(`Unknown Workshop opponent: ${opponentId}`)
  }
  return opponent
}

export const createWorkshopTestMatchSet = async (
  pool: Pool,
  input: {
    revisionId: StrategyRevisionId
    opponentId: WorkshopOpponentSummary["id"]
    presetId: MatchSetPresetId
    matchSetId?: MatchSetId | undefined
  },
): Promise<WorkshopTestSummary & { matchIds: MatchId[] }> => {
  await ensureWorkshopSeed(pool)
  const opponent = findWorkshopOpponent(input.opponentId)
  const created = await createMatchSetService(pool).createFromPreset({
    id: input.matchSetId ?? createWorkshopMatchSetId(),
    presetId: input.presetId,
    bottomStrategyRevisionId: input.revisionId,
    topStrategyRevisionId: opponent.revisionId,
    bottomPlayerId: WORKSHOP_PLAYER_ID,
    topPlayerId: opponent.playerId,
  })
  return {
    matchSetId: created.matchSetId,
    status: "pending",
    matchIds: created.matchIds,
    matchCount: created.matchIds.length,
    matches: created.matchIds.map((matchId) => ({
      matchId,
      status: "pending",
    })),
    scoring: { complete: false, degraded: false, rankings: [] },
  }
}

export const getWorkshopTestSummary = async (
  pool: Pool,
  matchSetId: MatchSetId,
): Promise<WorkshopTestSummary | null> => {
  const matchSet = await createRepositories(pool).getMatchSet(matchSetId)
  if (!matchSet) {
    return null
  }
  const [statusResult, matches] = await Promise.all([
    refreshMatchSetStatus(pool, matchSetId),
    listMatchStatusesForSet(pool, matchSetId),
  ])
  return {
    matchSetId,
    status: statusResult.status,
    matchCount: matches.length,
    matches,
    scoring: statusResult.scoring,
  }
}

export const getWorkshopSnapshot = async (
  pool: Pool,
): Promise<WorkshopSnapshot> => ({
  templateSource: workshopTemplateSource,
  templateValidation: validateWorkshopSource(workshopTemplateSource),
  revisions: await listWorkshopRevisions(pool),
  presets: listWorkshopPresets(),
  opponents: listWorkshopOpponents(),
  templates: listWorkshopTemplates(),
})
