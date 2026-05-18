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
  RuntimeViolationType,
  StrategyId,
  StrategyRevision,
  StrategyRevisionValidationCode,
  StrategyRevisionId,
} from "@cowards/spec"
import type { Pool } from "pg"
import { withTransaction } from "./db.js"
import { createMatchSetService } from "./matchset-service.js"
import { generatePresetMatrix } from "./matchset-service.js"
import {
  listMatchStatusesForSet,
  type MatchSetMatchSummary,
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
import type { MatchSetStatus } from "./schema.js"

export const WORKSHOP_USER_ID = "user:local"
export const WORKSHOP_STRATEGY_ID = "strategy:local-workshop" as StrategyId
export const WORKSHOP_PLAYER_ID = "player:workshop-local" as PlayerId
export const WORKSHOP_MATCH_SET_PREFIX = "match-set:workshop:"

export class WorkshopInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "WorkshopInputError"
  }
}

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

interface WorkshopSampleBase {
  id: `sample:${string}`
  label: string
  description: string
  categories: string[]
  source: string
  validation: StrategyRevisionValidationReport
}

export type WorkshopSampleSummary =
  | (WorkshopSampleBase & {
      sampleKind: "starter"
      expectedValidationCode?: undefined
      expectedRuntimeViolationType?: undefined
    })
  | (WorkshopSampleBase & {
      sampleKind: "failure-mode"
      expectedValidationCode?: StrategyRevisionValidationCode | undefined
      expectedRuntimeViolationType?: RuntimeViolationType | undefined
    })

export interface WorkshopTestSummary {
  matchSetId: MatchSetId
  status: MatchSetStatus
  matchCount: number
  matchIds?: MatchId[] | undefined
  matches: MatchSetMatchSummary[]
  scoring: MatchSetScore
}

export interface WorkshopSnapshot {
  templateSource: string
  templateValidation: StrategyRevisionValidationReport
  revisions: WorkshopRevisionSummary[]
  presets: WorkshopPresetSummary[]
  opponents: WorkshopOpponentSummary[]
  templates: WorkshopTemplateSummary[]
  samples: WorkshopSampleSummary[]
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

const basicAdvanceTurnSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "advance-turn" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const forward = input.self.facing ?? "UP"
    return {
      action: input.cycleIndex === 0
        ? { type: "MOVE", direction: forward }
        : { type: "TURN", direction: forward },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const pushSetupSampleSource = `
const directionPriority = ["UP", "RIGHT", "DOWN", "LEFT"]

const firstVisibleEnemyDirection = (grid) => {
  const target = grid.cells.find((cell) => cell.contents === "ENEMY_ACTIVE")
  if (!target) return "UP"
  if (target.dy < 0) return "UP"
  if (target.dx > 0) return "RIGHT"
  if (target.dy > 0) return "DOWN"
  if (target.dx < 0) return "LEFT"
  return directionPriority[0]
}

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "push-setup" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const direction = firstVisibleEnemyDirection(input.awarenessGrid)
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction }
        : { type: "MOVE", direction },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const backstabSetupSampleSource = `
const behindDirection = (self) =>
  self.lastSuccessfulMoveDirection ?? self.facing ?? "UP"

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({
          soldierId: soldier.id,
          objective: { drill: "backstab-setup", lastMove: soldier.lastSuccessfulMoveDirection }
        })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    const direction = behindDirection(input.self)
    return {
      action: input.cycleIndex === 0
        ? { type: "TURN", direction }
        : { type: "MOVE", direction },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const stoningBlockingSampleSource = `
const hasAdjacentEnemy = (grid) =>
  grid.cells.some((cell) =>
    cell.contents === "ENEMY_ACTIVE" &&
    ((cell.dx === 0 && (cell.dy === -1 || cell.dy === 1)) ||
      (cell.dy === 0 && (cell.dx === -1 || cell.dx === 1)))
  )

export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers
        .filter((soldier) => soldier.status === "ACTIVE")
        .slice(0, input.activationCount)
        .map((soldier) => ({ soldierId: soldier.id, objective: { drill: "stone-block" } })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain(input) {
    return {
      action: hasAdjacentEnemy(input.awarenessGrid)
        ? { type: "TURN_TO_STONE" }
        : { type: "TURN", direction: input.self.facing ?? "UP" },
      soldierMemory: input.soldierMemory
    }
  }
}
`.trim()

const forbiddenClockSampleSource = `
export default {
  selectActivations(input) {
    Date.now()
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
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

const invalidOutputSampleSource = `
export default {
  selectActivations() {
    return { activationOrders: "everyone", strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "DANCE" }, soldierMemory: {} }
  }
}
`.trim()

const thrownExceptionSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain() {
    throw new Error("Intentional sample failure")
  }
}
`.trim()

const runtimeTimeoutSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({ soldierId: soldier.id })),
      strategyMemory: input.strategyMemory
    }
  },
  soldierBrain() {
    while (true) {}
  }
}
`.trim()

const doNothingSampleSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: [],
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

const sample = <T extends Omit<WorkshopSampleSummary, "validation">>(
  input: T,
): T & { validation: StrategyRevisionValidationReport } => ({
  ...input,
  validation: validateStrategySource(input.source),
})

export const listWorkshopSamples = (): WorkshopSampleSummary[] => [
  sample({
    id: "sample:basic-advance-turn",
    label: "Basic advance and turn",
    sampleKind: "starter",
    description:
      "Advance when clear, otherwise turn to keep facing useful space.",
    categories: ["Movement"],
    source: basicAdvanceTurnSampleSource,
  }),
  sample({
    id: "sample:push-setup",
    label: "Push setup",
    sampleKind: "starter",
    description: "Demonstrates positioning for Push resolution.",
    categories: ["Push"],
    source: pushSetupSampleSource,
  }),
  sample({
    id: "sample:backstab-setup",
    label: "Backstab setup",
    sampleKind: "starter",
    description: "Shows facing and adjacency needed for Backstab.",
    categories: ["Backstab"],
    source: backstabSetupSampleSource,
  }),
  sample({
    id: "sample:stoning-blocking",
    label: "Stone and blocking",
    sampleKind: "starter",
    description: "Uses STONE to create blocking pressure.",
    categories: ["Stone"],
    source: stoningBlockingSampleSource,
  }),
  sample({
    id: "sample:failure-forbidden-clock",
    label: "Failure: forbidden clock",
    sampleKind: "failure-mode",
    description: "Demonstrates that Strategy source cannot read system time.",
    categories: ["Runtime violation"],
    source: forbiddenClockSampleSource,
    expectedValidationCode: "FORBIDDEN_PATTERN",
  }),
  sample({
    id: "sample:failure-runtime-timeout",
    label: "Failure: runtime timeout",
    sampleKind: "failure-mode",
    description: "Demonstrates a Strategy that exceeds the runtime limit.",
    categories: ["Runtime violation"],
    source: runtimeTimeoutSampleSource,
    expectedRuntimeViolationType: "TIMEOUT",
  }),
  sample({
    id: "sample:failure-invalid-output",
    label: "Failure: invalid output",
    sampleKind: "failure-mode",
    description:
      "Demonstrates runtime rejection of invalid Strategy API output.",
    categories: ["Invalid output"],
    source: invalidOutputSampleSource,
    expectedRuntimeViolationType: "INVALID_OUTPUT",
  }),
  sample({
    id: "sample:failure-thrown-exception",
    label: "Failure: thrown exception",
    sampleKind: "failure-mode",
    description:
      "Demonstrates a SoldierBrain exception becoming a runtime violation.",
    categories: ["Runtime violation"],
    source: thrownExceptionSampleSource,
    expectedRuntimeViolationType: "THROWN_EXCEPTION",
  }),
  sample({
    id: "sample:failure-do-nothing",
    label: "Failure: do nothing",
    sampleKind: "failure-mode",
    description: "Selects no useful Activations so Soldiers remain idle.",
    categories: ["Do nothing"],
    source: doNothingSampleSource,
  }),
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
    throw new WorkshopInputError(`Unknown Workshop opponent: ${opponentId}`)
  }
  return opponent
}

export const assertWorkshopRevisionCanBeTested = (
  revision: StrategyRevision | null,
  revisionId: StrategyRevisionId,
): StrategyRevision => {
  if (!revision) {
    throw new WorkshopInputError(`Workshop revision not found: ${revisionId}`)
  }
  if (revision.strategyId !== WORKSHOP_STRATEGY_ID) {
    throw new WorkshopInputError(
      "Workshop tests require a local Workshop revision",
    )
  }
  if (!revision.validation.valid) {
    throw new WorkshopInputError(
      "Workshop tests require a valid Strategy revision",
    )
  }
  return revision
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
  const repositories = createRepositories(pool)
  assertWorkshopRevisionCanBeTested(
    await repositories.getStrategyRevision(input.revisionId),
    input.revisionId,
  )
  const opponent = findWorkshopOpponent(input.opponentId)
  const matchSetId = input.matchSetId ?? createWorkshopMatchSetId()
  const matrix = generatePresetMatrix({
    id: matchSetId,
    presetId: input.presetId,
    bottomStrategyRevisionId: input.revisionId,
    topStrategyRevisionId: opponent.revisionId,
    bottomPlayerId: WORKSHOP_PLAYER_ID,
    topPlayerId: opponent.playerId,
  })
  const created = await createMatchSetService(pool).createFromPreset({
    id: matchSetId,
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
    matches: matrix.map((match) => ({
      matchId: match.id,
      status: "pending",
      bottomPlayerId: match.bottomPlayerId,
      topPlayerId: match.topPlayerId,
      hasReplay: false,
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
  samples: listWorkshopSamples(),
})

export const getWorkshopStaticSnapshot = (): WorkshopSnapshot => ({
  templateSource: workshopTemplateSource,
  templateValidation: validateWorkshopSource(workshopTemplateSource),
  revisions: [],
  presets: listWorkshopPresets(),
  opponents: listWorkshopOpponents(),
  templates: listWorkshopTemplates(),
  samples: listWorkshopSamples(),
})
