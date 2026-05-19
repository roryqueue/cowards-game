import { randomUUID } from "node:crypto"
import { buildStrategyRevision } from "@cowards/runtime-js"
import type {
  StrategyId,
  StrategyRevision,
  StrategyRevisionId,
  StrategyRevisionMetadata,
  UserId,
} from "@cowards/spec"
import type { Pool } from "pg"
import { createRepositories } from "./repositories.js"
import {
  findStarterStrategy,
  type StarterStrategyId,
} from "./starter-strategies.js"

export class AccountRevisionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AccountRevisionError"
  }
}

export interface AccountStrategyRevisionSummary {
  id: StrategyRevisionId
  strategyId: StrategyId
  label?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  starterLineage?: StrategyRevisionMetadata["starterLineage"] | undefined
  sourceHash: string
  sourceBytes: number
  valid: boolean
  runtime: StrategyRevision["runtime"]
  engineCompatibility: StrategyRevision["engineCompatibility"]
  createdAt: string
  lockedAt?: string | undefined
}

export const createAccountStrategyId = (
  userId: UserId,
  suffix: string = randomUUID(),
): StrategyId => `strategy:account:${userId}:${suffix}` as StrategyId

export const buildAccountStrategyRevision = (input: {
  userId: UserId
  source: string
  label?: string | undefined
  notes?: string | undefined
  tags?: string[] | undefined
  starterLineage?: StrategyRevisionMetadata["starterLineage"] | undefined
  strategyId?: StrategyId | undefined
}): StrategyRevision => {
  const strategyId = input.strategyId ?? createAccountStrategyId(input.userId)
  return buildStrategyRevision({
    source: input.source,
    strategyId,
    metadata: {
      createdBy: input.userId,
      ...(input.label ? { label: input.label } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.tags ? { tags: input.tags } : {}),
      ...(input.starterLineage ? { starterLineage: input.starterLineage } : {}),
    },
  })
}

export const createAccountStrategyRevision = async (
  pool: Pool,
  input: {
    userId: UserId
    source: string
    label?: string | undefined
    notes?: string | undefined
    tags?: string[] | undefined
    starterLineage?: StrategyRevisionMetadata["starterLineage"] | undefined
    strategyName?: string | undefined
    strategyId?: StrategyId | undefined
  },
): Promise<StrategyRevision> => {
  const revision = buildAccountStrategyRevision(input)
  const repositories = createRepositories(pool)
  await repositories.upsertStrategy({
    id: revision.strategyId!,
    ownerUserId: input.userId,
    name: input.strategyName ?? input.label ?? "Account Strategy",
    metadata: {
      accountOwned: true,
      ...(input.starterLineage ? { starterLineage: input.starterLineage } : {}),
    },
  })
  await repositories.insertStrategyRevision(revision)
  return revision
}

export const saveSourceToAccount = createAccountStrategyRevision

export const listAccountStrategyRevisions = async (
  pool: Pool,
  userId: UserId,
): Promise<AccountStrategyRevisionSummary[]> => {
  const result = await pool.query<{
    id: StrategyRevisionId
    strategy_id: StrategyId
    source_hash: string
    source_bytes: number
    runtime: StrategyRevision["runtime"]
    engine_compatibility: StrategyRevision["engineCompatibility"]
    validation: StrategyRevision["validation"]
    metadata: StrategyRevision["metadata"]
    created_at: Date
    locked_at: Date | null
  }>(
    `
      select
        sr.id,
        sr.strategy_id,
        sr.source_hash,
        sr.source_bytes,
        sr.runtime,
        sr.engine_compatibility,
        sr.validation,
        sr.metadata,
        sr.created_at,
        sr.locked_at
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      where s.owner_user_id = $1
      order by sr.created_at desc, sr.id desc
    `,
    [userId],
  )

  return result.rows.map((row) => ({
    id: row.id,
    strategyId: row.strategy_id,
    label: row.metadata.label,
    notes: row.metadata.notes,
    tags: row.metadata.tags,
    starterLineage: row.metadata.starterLineage,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    valid: row.validation.valid,
    runtime: row.runtime,
    engineCompatibility: row.engine_compatibility,
    createdAt: row.created_at.toISOString(),
    ...(row.locked_at ? { lockedAt: row.locked_at.toISOString() } : {}),
  }))
}

export const forkStarterStrategyToAccount = async (
  pool: Pool,
  input: {
    userId: UserId
    starterId: StarterStrategyId | string
  },
): Promise<StrategyRevision> => {
  const starter = findStarterStrategy(input.starterId)
  if (!starter) {
    throw new AccountRevisionError(
      `Starter Strategy not found: ${input.starterId}`,
    )
  }
  if (!starter.validation.valid) {
    throw new AccountRevisionError(
      `Starter Strategy is not valid: ${starter.name}`,
    )
  }
  return createAccountStrategyRevision(pool, {
    userId: input.userId,
    source: starter.source,
    label: starter.name,
    notes: starter.description,
    tags: starter.tags,
    strategyName: starter.name,
    starterLineage: {
      starterId: starter.id,
      starterName: starter.name,
      starterVersion: starter.version,
      sourceHash: starter.sourceHash,
    },
  })
}

export const getAccountStrategyRevisionSource = async (
  pool: Pool,
  input: {
    userId: UserId
    revisionId: StrategyRevisionId
  },
): Promise<string | null> => {
  const result = await pool.query<{ source: string }>(
    `
      select sr.source
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      where sr.id = $1
        and s.owner_user_id = $2
    `,
    [input.revisionId, input.userId],
  )
  return result.rows[0]?.source ?? null
}

export const assertAccountOwnsRevision = async (
  pool: Pool,
  input: {
    userId: UserId
    revisionId: StrategyRevisionId
  },
): Promise<void> => {
  const result = await pool.query<{ id: StrategyRevisionId }>(
    `
      select sr.id
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      where sr.id = $1
        and s.owner_user_id = $2
    `,
    [input.revisionId, input.userId],
  )
  if ((result.rowCount ?? 0) === 0) {
    throw new AccountRevisionError(
      `StrategyRevision is not owned by User: ${input.revisionId}`,
    )
  }
}
