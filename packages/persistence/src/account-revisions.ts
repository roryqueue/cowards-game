import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { buildStrategyRevision } from "@cowards/runtime-js"
import {
  describeStrategyRuntimeProductSemantics,
  normalizeStrategyRuntimeMetadata,
  STRATEGY_RUNTIME_ABI_VERSION,
} from "@cowards/spec"
import type {
  StrategyId,
  StrategyRevision,
  StrategyRevisionId,
  StrategyRuntimeProductSemantics,
  StrategyRevisionMetadata,
  UserId,
} from "@cowards/spec"
import type { Pool } from "pg"
import {
  findAdvancedStrategy,
  type AdvancedStrategyId,
} from "./advanced-strategies.js"
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
  advancedLineage?: StrategyRevisionMetadata["advancedLineage"] | undefined
  sourceHash: string
  sourceBytes: number
  valid: boolean
  runtime: StrategyRevision["runtime"]
  runtimeSemantics: StrategyRuntimeProductSemantics
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
  advancedLineage?: StrategyRevisionMetadata["advancedLineage"] | undefined
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
      ...(input.advancedLineage
        ? { advancedLineage: input.advancedLineage }
        : {}),
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
    advancedLineage?: StrategyRevisionMetadata["advancedLineage"] | undefined
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
      ...(input.advancedLineage
        ? { advancedLineage: input.advancedLineage }
        : {}),
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

  return result.rows.map((row) => {
    const runtime = normalizeStrategyRuntimeMetadata(row.runtime)
    const runtimeSemantics = describeStrategyRuntimeProductSemantics(
      row.runtime,
    )
    return {
      id: row.id,
      strategyId: row.strategy_id,
      label: row.metadata.label,
      notes: row.metadata.notes,
      tags: row.metadata.tags,
      starterLineage: row.metadata.starterLineage,
      advancedLineage: row.metadata.advancedLineage,
      sourceHash: row.source_hash,
      sourceBytes: row.source_bytes,
      valid: row.validation.valid,
      runtime,
      runtimeSemantics: provenanceAwareRuntimeSemantics(runtimeSemantics, {
        metadata: row.metadata,
        runtime,
        sourceHash: row.source_hash,
        sourceBytes: row.source_bytes,
      }),
      engineCompatibility: row.engine_compatibility,
      createdAt: row.created_at.toISOString(),
      ...(row.locked_at ? { lockedAt: row.locked_at.toISOString() } : {}),
    }
  })
}

const provenanceAwareRuntimeSemantics = (
  semantics: StrategyRuntimeProductSemantics,
  revision: {
    metadata: StrategyRevisionMetadata
    runtime: StrategyRevision["runtime"]
    sourceHash: string
    sourceBytes: number
  },
): StrategyRuntimeProductSemantics => {
  if (
    (revision.runtime.language.id !== "python" &&
      revision.runtime.language.id !== "rust") ||
    pythonProviderValidationMatches(
      revision.metadata,
      revision.sourceHash,
      revision.sourceBytes,
    ) ||
    rustProviderValidationMatches(
      revision.metadata,
      revision.sourceHash,
      revision.sourceBytes,
    )
  ) {
    return semantics
  }
  const languageLabel =
    revision.runtime.language.id === "rust" ? "Rust" : "Python"
  return {
    ...semantics,
    countedPlayEligible: false,
    countedPlayLabel: "Not counted",
    countedPlayReason:
      `${languageLabel} counted play requires provider-validated revision provenance.`,
  }
}

const pythonProviderValidationMatches = (
  metadata: StrategyRevisionMetadata,
  sourceHash: string,
  sourceBytes: number,
): boolean => {
  const validation = metadata.providerValidation
  if (
    validation?.providerId !== "strategy-language-provider-python" ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.32" ||
    validation.sourceHash !== sourceHash ||
    validation.sourceBytes !== sourceBytes
  ) {
    return false
  }
  const expected = pythonProviderValidationProof({
    providerId: validation.providerId,
    contractVersion: validation.contractVersion,
    sourceHash,
    sourceBytes,
  })
  return expected !== null && safeEqual(validation.proof, expected)
}

const rustProviderValidationMatches = (
  metadata: StrategyRevisionMetadata,
  sourceHash: string,
  sourceBytes: number,
): boolean => {
  const validation = metadata.providerValidation
  const artifact = metadata.compiledArtifact
  if (
    validation?.providerId !== "strategy-language-provider-rust-wasi" ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.32" ||
    validation.sourceHash !== sourceHash ||
    validation.sourceBytes !== sourceBytes ||
    artifact === undefined ||
    artifact.sourceHash !== sourceHash ||
    artifact.targetTriple !== "wasm32-wasip1" ||
    artifact.wasiProfile !== "preview1" ||
    artifact.abiEnvelope !== "stdin-stdout-json" ||
    artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    artifact.validationStatus !== "valid" ||
    validation.artifactHash !== artifact.hash ||
    validation.artifactBytes !== artifact.bytes
  ) {
    return false
  }
  const expected = pythonProviderValidationProof({
    providerId: validation.providerId,
    contractVersion: validation.contractVersion,
    sourceHash,
    sourceBytes,
    artifactHash: artifact.hash,
    artifactBytes: artifact.bytes,
  })
  return expected !== null && safeEqual(validation.proof, expected)
}

const providerValidationSecret = (): string =>
  process.env.COWARDS_PROVIDER_VALIDATION_SECRET?.trim() ?? ""

const pythonProviderValidationProof = (input: {
  providerId: string
  contractVersion: string
  sourceHash: string
  sourceBytes: number
  artifactHash?: string | undefined
  artifactBytes?: number | undefined
}): string | null => {
  const secret = providerValidationSecret()
  if (!secret) {
    return null
  }
  const payload = [
    input.providerId,
    input.contractVersion,
    input.sourceHash,
    String(input.sourceBytes),
    input.artifactHash ?? "",
    input.artifactBytes === undefined ? "" : String(input.artifactBytes),
  ].join("\n")
  return `hmac-sha256:${createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`
}

const safeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  )
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

export const forkAdvancedStrategyToAccount = async (
  pool: Pool,
  input: {
    userId: UserId
    advancedId: AdvancedStrategyId | string
  },
): Promise<StrategyRevision> => {
  const advanced = findAdvancedStrategy(input.advancedId)
  if (!advanced) {
    throw new AccountRevisionError(
      `Advanced Strategy not found: ${input.advancedId}`,
    )
  }
  if (!advanced.validation.valid) {
    throw new AccountRevisionError(
      `Advanced Strategy is not valid: ${advanced.name}`,
    )
  }
  return createAccountStrategyRevision(pool, {
    userId: input.userId,
    source: advanced.source,
    label: advanced.name,
    notes: advanced.description,
    tags: advanced.tags,
    strategyName: advanced.name,
    advancedLineage: {
      advancedId: advanced.id,
      advancedName: advanced.name,
      advancedVersion: advanced.version,
      archetype: advanced.primaryArchetype,
      sourceHash: advanced.sourceHash,
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
