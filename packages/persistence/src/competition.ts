import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import { Buffer } from "node:buffer"
import {
  assertPublicMatchSetResultLeakSafe,
  classifyCompetitionCountedState,
  projectPublicCompetitionGovernance,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  getCompetitionPreset,
  normalizeStrategyRuntimeMetadata,
  STRATEGY_RUNTIME_ABI_VERSION,
  type CompetitionEntrantSnapshot,
  type CompetitionPresetId,
  type LadderMatchSetCountedStatus,
  type PublicMatchSetResultDto,
  type PublicPenaltyReason,
  type PublicStandingDto,
  type UserId,
} from "@cowards/spec"
import type { Pool } from "pg"
import {
  createMatchSetService,
  generateCandidatePresetMatrixV119,
  resolveMatchSetExecutionEvidence,
  type MatchSetExecutionEvidenceResolver,
} from "./matchset-service.js"
import type { CreateMatchRecordInput } from "./match-service.js"
import {
  getMatchSetPresetV117,
  resolveFileCurrentSchedulingSemanticAuthority,
  type SchedulingSemanticAuthorityKey,
} from "./presets.js"
import { createRepositories } from "./repositories.js"
import { createDevelopmentSeedData } from "./seed.js"
import type { MatchSetStatus, MatchStatus } from "./schema.js"
import type { MatchSetScore } from "./scoring.js"

export const TYPESCRIPT_COMPETITION_PERSISTENCE_ROLE = {
  normalBackend: false,
  selectedNormalBackend: false,
  allowedRoles: ["rollback", "test", "parity", "fixture", "deferred"],
  quarantinedFunctions: [
    "createManualExhibitionMatchSet",
    "buildPublicMatchSetResultDto",
  ],
  selectedNormalOwner: "go",
  note: "TypeScript competition persistence is retained for rollback/parity/test/fixture/deferred use only; selected normal exhibition creation and public MatchSet DTO reads are Go-owned.",
} as const

export class CompetitionInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CompetitionInputError"
  }
}

export const runtimeAllowsCountedPlay = (
  runtime: unknown,
  provenance: {
    metadata?: unknown
    sourceHash?: string
    sourceBytes?: number
  } = {},
): CompetitionEntrantSnapshot["runtime"] => {
  const eligibility = evaluateStrategyRuntimeCountedEligibility(runtime)
  if (!eligibility.ok) {
    throw new CompetitionInputError(
      eligibility.publicMessage ??
        "StrategyRevision runtime is not eligible for counted exhibition entry.",
    )
  }
  const normalized = normalizeStrategyRuntimeMetadata(runtime)
  if (
    normalized.language.id === "typescript" &&
    !sourceArtifactProviderValidationMatches(
      provenance.metadata,
      provenance.sourceHash,
      provenance.sourceBytes,
      "strategy-language-provider-js-ts",
      "typescript",
    )
  ) {
    throw new CompetitionInputError(
      "TypeScript counted entry requires provider-validated artifact provenance.",
    )
  }
  if (
    normalized.language.id === "python" &&
    !sourceArtifactProviderValidationMatches(
      provenance.metadata,
      provenance.sourceHash,
      provenance.sourceBytes,
      "strategy-language-provider-python",
      "python",
    )
  ) {
    throw new CompetitionInputError(
      "Python counted entry requires provider-validated revision provenance.",
    )
  }
  if (
    (normalized.language.id === "rust" || normalized.language.id === "zig") &&
    !rustProviderValidationMatches(
      provenance.metadata,
      provenance.sourceHash,
      provenance.sourceBytes,
      normalized.language.id,
    )
  ) {
    const label = normalized.language.id === "zig" ? "Zig" : "Rust"
    throw new CompetitionInputError(
      `${label} counted entry requires provider-validated artifact provenance.`,
    )
  }
  return normalized
}

const sourceArtifactProviderValidationMatches = (
  metadata: unknown,
  sourceHash: string | undefined,
  sourceBytes: number | undefined,
  providerId: string,
  language: "typescript" | "python",
): boolean => {
  if (
    !sourceHash ||
    sourceBytes === undefined ||
    metadata === null ||
    typeof metadata !== "object"
  ) {
    return false
  }
  const providerValidation = (metadata as { providerValidation?: unknown })
    .providerValidation
  const sourceArtifact = (metadata as { sourceArtifact?: unknown })
    .sourceArtifact
  if (sourceArtifact === null || typeof sourceArtifact !== "object") {
    return false
  }
  const artifact = sourceArtifact as Record<string, unknown>
  if (
    typeof artifact.hash !== "string" ||
    typeof artifact.bytes !== "number" ||
    typeof artifact.bytesBase64 !== "string" ||
    artifact.sourceHash !== sourceHash ||
    artifact.sourceBytes !== sourceBytes ||
    artifact.validationStatus !== "valid" ||
    !artifactBytesMatch({
      bytesBase64: artifact.bytesBase64,
      hash: artifact.hash,
      bytes: artifact.bytes,
    })
  ) {
    return false
  }
  if (providerValidation === null || typeof providerValidation !== "object") {
    return false
  }
  const validation = providerValidation as Record<string, unknown>
  if (
    validation.providerId !== providerId ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.33" ||
    validation.sourceHash !== sourceHash ||
    validation.sourceBytes !== sourceBytes ||
    validation.artifactHash !== artifact.hash ||
    validation.artifactBytes !== artifact.bytes ||
    typeof validation.proof !== "string"
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
  return (
    expected !== null &&
    safeEqual(validation.proof, expected) &&
    (artifact.toolchain as Record<string, unknown> | undefined)?.language ===
      language
  )
}

const rustProviderValidationMatches = (
  metadata: unknown,
  sourceHash: string | undefined,
  sourceBytes: number | undefined,
  languageId: "rust" | "zig" = "rust",
): boolean => {
  const providerId =
    languageId === "zig"
      ? "strategy-language-provider-zig-wasi"
      : "strategy-language-provider-rust-wasi"
  const targetTriple = languageId === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
  if (
    !sourceHash ||
    sourceBytes === undefined ||
    metadata === null ||
    typeof metadata !== "object"
  ) {
    return false
  }
  const record = metadata as {
    providerValidation?: unknown
    compiledArtifact?: unknown
  }
  const artifact = record.compiledArtifact
  if (artifact === null || typeof artifact !== "object") {
    return false
  }
  const artifactRecord = artifact as Record<string, unknown>
  if (
    typeof artifactRecord.hash !== "string" ||
    typeof artifactRecord.bytes !== "number" ||
    artifactRecord.sourceHash !== sourceHash ||
    artifactRecord.targetTriple !== targetTriple ||
    artifactRecord.wasiProfile !== "preview1" ||
    artifactRecord.abiEnvelope !== "stdin-stdout-json" ||
    artifactRecord.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    artifactRecord.validationStatus !== "valid" ||
    typeof artifactRecord.bytesBase64 !== "string" ||
    !artifactBytesMatch({
      bytesBase64: artifactRecord.bytesBase64,
      hash: artifactRecord.hash,
      bytes: artifactRecord.bytes,
    })
  ) {
    return false
  }
  const providerValidation = record.providerValidation
  if (providerValidation === null || typeof providerValidation !== "object") {
    return false
  }
  const validation = providerValidation as Record<string, unknown>
  if (
    validation.providerId !== providerId ||
    validation.contractVersion !==
      "strategy-language-provider-contract-v1.33" ||
    validation.sourceHash !== sourceHash ||
    validation.sourceBytes !== sourceBytes ||
    validation.artifactHash !== artifactRecord.hash ||
    validation.artifactBytes !== artifactRecord.bytes ||
    typeof validation.proof !== "string"
  ) {
    return false
  }
  const expected = pythonProviderValidationProof({
    providerId,
    contractVersion: validation.contractVersion,
    sourceHash,
    sourceBytes,
    artifactHash: artifactRecord.hash,
    artifactBytes: artifactRecord.bytes,
  })
  return expected !== null && safeEqual(validation.proof, expected)
}

const artifactBytesMatch = (artifact: {
  bytesBase64: string
  hash: string
  bytes: number
}): boolean => {
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  return (
    bytes.byteLength === artifact.bytes &&
    createHash("sha256").update(bytes).digest("hex") === artifact.hash
  )
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

export class ExhibitionRateLimitError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super(
      `Too many exhibition creates. Retry after ${retryAfterSeconds} seconds.`,
    )
    this.name = "ExhibitionRateLimitError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class ActiveDuplicateExhibitionError extends Error {
  readonly activeMatchSetId: string

  constructor(activeMatchSetId: string) {
    super(`An active duplicate exhibition already exists: ${activeMatchSetId}`)
    this.name = "ActiveDuplicateExhibitionError"
    this.activeMatchSetId = activeMatchSetId
  }
}

export interface ExhibitionRateLimitPolicy {
  limit: number
  windowSeconds: number
}

export const DEFAULT_EXHIBITION_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 60 * 60,
} as const satisfies ExhibitionRateLimitPolicy

export const normalizeRevisionIdSet = (
  revisionIds: readonly string[],
): string[] => [...revisionIds].sort((left, right) => left.localeCompare(right))

export const buildExhibitionDuplicateKey = (input: {
  creatorUserId: UserId
  presetId: CompetitionPresetId
  revisionIds: readonly string[]
}): string =>
  [
    input.creatorUserId,
    input.presetId,
    ...normalizeRevisionIdSet(input.revisionIds),
  ].join("|")

export const validateManualExhibitionRevisionIds = (
  revisionIds: readonly string[],
): void => {
  if (revisionIds.length < 2 || revisionIds.length > 8) {
    throw new CompetitionInputError(
      "Manual exhibitions require 2-8 Strategy Revisions.",
    )
  }
  const distinct = new Set(revisionIds)
  if (distinct.size !== revisionIds.length) {
    throw new CompetitionInputError(
      "Manual exhibitions require distinct Strategy Revision ids.",
    )
  }
}

export const evaluateRateLimit = (input: {
  count: number
  oldestEventAt?: Date | undefined
  now: Date
  policy?: ExhibitionRateLimitPolicy | undefined
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } => {
  const policy = input.policy ?? DEFAULT_EXHIBITION_RATE_LIMIT
  if (input.count < policy.limit) {
    return { allowed: true }
  }
  const oldest = input.oldestEventAt
  const retryAfterSeconds = oldest
    ? Math.max(
        1,
        Math.ceil(
          (oldest.getTime() +
            policy.windowSeconds * 1000 -
            input.now.getTime()) /
            1000,
        ),
      )
    : policy.windowSeconds
  return { allowed: false, retryAfterSeconds }
}

export const assertExhibitionCreateRateLimit = async (
  pool: Pool,
  input: {
    userId: UserId
    now?: Date | undefined
    policy?: ExhibitionRateLimitPolicy | undefined
  },
): Promise<void> => {
  const policy = input.policy ?? DEFAULT_EXHIBITION_RATE_LIMIT
  const now = input.now ?? new Date()
  const result = await pool.query<{
    submission_count: number
    oldest_event_at: Date | null
  }>(
    `
      select
        count(*)::integer as submission_count,
        min(created_at) as oldest_event_at
      from competition_submission_events
      where user_id = $1
        and action = 'create_exhibition'
        and created_at >= $2::timestamptz - ($3::text || ' seconds')::interval
    `,
    [input.userId, now, policy.windowSeconds],
  )
  const row = result.rows[0]
  const decision = evaluateRateLimit({
    count: row?.submission_count ?? 0,
    oldestEventAt: row?.oldest_event_at ?? undefined,
    now,
    policy,
  })
  if (!decision.allowed) {
    throw new ExhibitionRateLimitError(decision.retryAfterSeconds)
  }
}

export const findActiveDuplicateExhibition = async (
  pool: Pool,
  input: {
    creatorUserId: UserId
    presetId: CompetitionPresetId
    revisionIds: readonly string[]
  },
): Promise<string | null> => {
  const duplicateKey = buildExhibitionDuplicateKey(input)
  const result = await pool.query<{ id: string }>(
    `
      select id
      from match_sets
      where creator_user_id = $1
        and competition_preset_id = $2
        and duplicate_key = $3
        and status in ('pending', 'running')
      order by created_at asc, id asc
      limit 1
    `,
    [input.creatorUserId, input.presetId, duplicateKey],
  )
  return result.rows[0]?.id ?? null
}

export const assertNoActiveDuplicateExhibition = async (
  pool: Pool,
  input: {
    creatorUserId: UserId
    presetId: CompetitionPresetId
    revisionIds: readonly string[]
  },
): Promise<void> => {
  const activeMatchSetId = await findActiveDuplicateExhibition(pool, input)
  if (activeMatchSetId) {
    throw new ActiveDuplicateExhibitionError(activeMatchSetId)
  }
}

export const generateCompetitionPairwiseMatrix = (input: {
  matchSetId: string
  presetId: CompetitionPresetId
  entrants: readonly CompetitionEntrantSnapshot[]
  semanticAuthorityKey?: SchedulingSemanticAuthorityKey | undefined
}): CreateMatchRecordInput[] => {
  if (
    input.semanticAuthorityKey !== undefined &&
    String(input.semanticAuthorityKey) !== "runtime-v1.17" &&
    String(input.semanticAuthorityKey) !== "runtime-v1.19"
  ) {
    throw new CompetitionInputError(
      "Unknown TypeScript competition scheduling semantic authority.",
    )
  }
  const resolvedSemanticAuthorityKey =
    input.semanticAuthorityKey ??
    resolveFileCurrentSchedulingSemanticAuthority().selection
      .semanticAuthorityKey
  const competitionPreset = getCompetitionPreset(input.presetId)
  if (resolvedSemanticAuthorityKey === "runtime-v1.19") {
    const sortedEntrants = [...input.entrants].sort((left, right) =>
      Buffer.compare(
        Buffer.from(left.strategyRevisionId, "utf8"),
        Buffer.from(right.strategyRevisionId, "utf8"),
      ),
    )
    if (
      new Set(
        sortedEntrants.map(({ strategyRevisionId }) => strategyRevisionId),
      ).size !== sortedEntrants.length
    ) {
      throw new CompetitionInputError(
        "runtime-v1.19 competition entrants must have distinct immutable Strategy Revision ids.",
      )
    }
    const matches: CreateMatchRecordInput[] = []
    for (let left = 0; left < sortedEntrants.length; left += 1) {
      for (let right = left + 1; right < sortedEntrants.length; right += 1) {
        const entrantA = sortedEntrants[left]!
        const entrantB = sortedEntrants[right]!
        const pairHash = createHash("sha256")
          .update(
            JSON.stringify([
              entrantA.strategyRevisionId,
              entrantB.strategyRevisionId,
            ]),
            "utf8",
          )
          .digest("hex")
        const playerIdFor = (strategyRevisionId: string): string =>
          `player:revision:sha256:${createHash("sha256")
            .update(strategyRevisionId, "utf8")
            .digest("hex")}`
        matches.push(
          ...generateCandidatePresetMatrixV119({
            id: `${input.matchSetId}:pair:sha256:${pairHash}`,
            semanticAuthorityKey: "runtime-v1.19",
            presetId: competitionPreset.matchSetPresetId,
            bottomStrategyRevisionId: entrantA.strategyRevisionId,
            topStrategyRevisionId: entrantB.strategyRevisionId,
            bottomPlayerId: playerIdFor(entrantA.strategyRevisionId),
            topPlayerId: playerIdFor(entrantB.strategyRevisionId),
          }),
        )
      }
    }
    return matches
  }
  const matchSetPreset = getMatchSetPresetV117(
    competitionPreset.matchSetPresetId,
  )
  const matches: CreateMatchRecordInput[] = []
  let index = 0

  for (let left = 0; left < input.entrants.length; left += 1) {
    for (let right = left + 1; right < input.entrants.length; right += 1) {
      const bottom = input.entrants[left]!
      const top = input.entrants[right]!
      for (const arenaVariantId of matchSetPreset.arenaVariantIds) {
        for (const seed of matchSetPreset.seeds) {
          matches.push({
            id: `match:${input.matchSetId}:${index}`,
            bottomStrategyRevisionId: bottom.strategyRevisionId,
            topStrategyRevisionId: top.strategyRevisionId,
            arenaVariantId,
            seed: `${seed}:pair:${left}-${right}`,
            bottomPlayerId: `player:${input.matchSetId}:entrant:${left}`,
            topPlayerId: `player:${input.matchSetId}:entrant:${right}`,
            bottomEntrantKey: bottom.strategyRevisionId,
            topEntrantKey: top.strategyRevisionId,
          })
          index += 1
          if (competitionPreset.mirroredPairwise) {
            matches.push({
              id: `match:${input.matchSetId}:${index}`,
              bottomStrategyRevisionId: top.strategyRevisionId,
              topStrategyRevisionId: bottom.strategyRevisionId,
              arenaVariantId,
              seed: `${seed}:pair:${left}-${right}:mirror`,
              bottomPlayerId: `player:${input.matchSetId}:entrant:${right}`,
              topPlayerId: `player:${input.matchSetId}:entrant:${left}`,
              bottomEntrantKey: top.strategyRevisionId,
              topEntrantKey: bottom.strategyRevisionId,
            })
            index += 1
          }
        }
      }
    }
  }

  return matches
}

const ensureCompetitionArenas = async (pool: Pool): Promise<void> => {
  const repositories = createRepositories(pool)
  for (const arena of createDevelopmentSeedData().arenas) {
    await repositories.upsertArenaVariant(arena)
  }
}

const loadOwnedRevisionSnapshots = async (
  pool: Pool,
  input: {
    userId: UserId
    revisionIds: readonly string[]
    lockedAt: Date
  },
): Promise<CompetitionEntrantSnapshot[]> => {
  const result = await pool.query<{
    id: string
    source_hash: string
    source_bytes: number
    runtime: CompetitionEntrantSnapshot["runtime"]
    engine_compatibility: CompetitionEntrantSnapshot["engineCompatibility"]
    validation: { valid: boolean }
    metadata: { label?: string | undefined }
    owner_user_id: UserId
    handle: string
  }>(
    `
      select
        sr.id,
        sr.source_hash,
        sr.source_bytes,
        sr.runtime,
        sr.engine_compatibility,
        sr.validation,
        sr.metadata,
        s.owner_user_id,
        u.handle
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      join users u on u.id = s.owner_user_id
      where sr.id = any($1::text[])
        and s.owner_user_id = $2
    `,
    [input.revisionIds, input.userId],
  )
  const byId = new Map(result.rows.map((row) => [row.id, row]))

  return input.revisionIds.map((revisionId, entrantIndex) => {
    const row = byId.get(revisionId)
    if (!row) {
      throw new CompetitionInputError(
        `StrategyRevision is not owned by the session User: ${revisionId}`,
      )
    }
    if (!row.validation.valid) {
      throw new CompetitionInputError(
        `StrategyRevision is not valid for exhibition entry: ${revisionId}`,
      )
    }
    const runtime = runtimeAllowsCountedPlay(row.runtime, {
      metadata: row.metadata,
      sourceHash: row.source_hash,
      sourceBytes: row.source_bytes,
    })
    const label = row.metadata.label ?? `Revision ${entrantIndex + 1}`
    const shortHash = row.source_hash.slice(0, 10)
    return {
      entrantId: `entrant:${entrantIndex}`,
      entrantIndex,
      strategyRevisionId: row.id,
      ownerUserId: row.owner_user_id,
      ownerHandle: row.handle,
      displayLabel: `@${row.handle} / "${label}" / ${shortHash}`,
      sourceHash: row.source_hash,
      sourceBytes: row.source_bytes,
      runtime,
      runtimeSemantics: describeStrategyRuntimeProductSemantics(runtime),
      engineCompatibility: row.engine_compatibility,
      lockedAt: input.lockedAt.toISOString(),
    }
  })
}

export const createManualExhibitionMatchSet = async (
  pool: Pool,
  input: {
    creatorUserId: UserId
    presetId: CompetitionPresetId
    revisionIds: readonly string[]
    matchSetId?: string | undefined
    now?: Date | undefined
    rateLimitPolicy?: ExhibitionRateLimitPolicy | undefined
    evidenceResolver?: MatchSetExecutionEvidenceResolver | undefined
    semanticAuthorityKey?: SchedulingSemanticAuthorityKey | undefined
  },
): Promise<{
  matchSetId: string
  matchIds: string[]
  entrants: CompetitionEntrantSnapshot[]
}> => {
  validateManualExhibitionRevisionIds(input.revisionIds)
  if (
    input.semanticAuthorityKey !== undefined &&
    String(input.semanticAuthorityKey) !== "runtime-v1.17" &&
    String(input.semanticAuthorityKey) !== "runtime-v1.19"
  ) {
    throw new CompetitionInputError(
      "Unknown manual exhibition scheduling semantic authority.",
    )
  }
  const resolvedSemanticAuthorityKey =
    input.semanticAuthorityKey ??
    resolveFileCurrentSchedulingSemanticAuthority().selection
      .semanticAuthorityKey
  const preset = getCompetitionPreset(input.presetId)
  const now = input.now ?? new Date()
  const integrityIdentity = await resolveMatchSetExecutionEvidence({
    resolver: input.evidenceResolver,
    purpose: "exhibition",
    evaluationInstant: now.toISOString(),
    entrants: input.revisionIds.map((strategyRevisionId) => ({
      entrantKey: strategyRevisionId,
      strategyRevisionId,
    })),
    semanticAuthorityKey: resolvedSemanticAuthorityKey,
  })
  await assertExhibitionCreateRateLimit(pool, {
    userId: input.creatorUserId,
    now,
    policy: input.rateLimitPolicy,
  })
  await assertNoActiveDuplicateExhibition(pool, {
    creatorUserId: input.creatorUserId,
    presetId: input.presetId,
    revisionIds: input.revisionIds,
  })
  await ensureCompetitionArenas(pool)

  const matchSetId = input.matchSetId ?? `match-set:exhibition:${randomUUID()}`
  const loadedEntrants = await loadOwnedRevisionSnapshots(pool, {
    userId: input.creatorUserId,
    revisionIds: input.revisionIds,
    lockedAt: now,
  })
  const entrants =
    resolvedSemanticAuthorityKey === "runtime-v1.19"
      ? [...loadedEntrants]
          .sort((left, right) =>
            Buffer.compare(
              Buffer.from(left.strategyRevisionId, "utf8"),
              Buffer.from(right.strategyRevisionId, "utf8"),
            ),
          )
          .map((entrant, entrantIndex) => ({
            ...entrant,
            entrantId: `entrant:revision:sha256:${createHash("sha256")
              .update(entrant.strategyRevisionId, "utf8")
              .digest("hex")}`,
            entrantIndex,
          }))
      : loadedEntrants
  const matches = generateCompetitionPairwiseMatrix({
    matchSetId,
    presetId: input.presetId,
    entrants,
    semanticAuthorityKey: resolvedSemanticAuthorityKey,
  })
  const duplicateKey = buildExhibitionDuplicateKey({
    creatorUserId: input.creatorUserId,
    presetId: input.presetId,
    revisionIds: input.revisionIds,
  })
  const created = await createMatchSetService(pool).createFromMatrix({
    id: matchSetId,
    ...(input.semanticAuthorityKey !== undefined
      ? { semanticAuthorityKey: input.semanticAuthorityKey }
      : {}),
    matches,
    integrityIdentity,
    matchSet: {
      presetId: preset.matchSetPresetId,
      ...(resolvedSemanticAuthorityKey === "runtime-v1.19"
        ? {}
        : { presetVersion: "v1" as const }),
      creatorUserId: input.creatorUserId,
      competitionPresetId: preset.id,
      competitionPresetVersion: preset.version,
      scoringPolicyVersion: preset.scoringPolicy.version,
      visibility: preset.visibility,
      entrantSnapshotSet: entrants,
      publicationPolicy: {
        publicResults: true,
        publicReplayEvidence: true,
        excludesPrivateStrategyData: true,
      },
      duplicateKey,
      lockedAt: now,
    },
    competitionEntrants: entrants.map((entrant) => ({
      id: `${matchSetId}:${entrant.entrantId}`,
      entrantIndex: entrant.entrantIndex,
      executionEntrantKey: entrant.strategyRevisionId,
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
    `
      insert into competition_submission_events (
        id, user_id, action, preset_id, match_set_id, metadata, created_at
      )
      values ($1, $2, 'create_exhibition', $3, $4, $5, $6)
    `,
    [
      `competition-event:${randomUUID()}`,
      input.creatorUserId,
      input.presetId,
      matchSetId,
      { revisionIds: normalizeRevisionIdSet(input.revisionIds) },
      now,
    ],
  )

  return {
    matchSetId: created.matchSetId,
    matchIds: created.matchIds,
    entrants,
  }
}

const mapStatus = (
  status: MatchSetStatus,
): PublicMatchSetResultDto["status"] => {
  switch (status) {
    case "pending":
      return "queued"
    case "running":
      return "running"
    case "complete":
      return "complete"
    case "degraded":
      return "degraded"
    case "failed_system":
    case "blocked":
      return "failed"
  }
}

const matchReason = (status: MatchStatus): PublicPenaltyReason | undefined =>
  status === "failed_system" ? "system_failure" : undefined

export const buildPublicMatchSetResultDto = async (
  pool: Pool,
  matchSetId: string,
): Promise<PublicMatchSetResultDto | null> => {
  const matchSetResult = await pool.query<{
    id: string
    status: MatchSetStatus
    competition_preset_id: CompetitionPresetId | null
    competition_preset_version: "v1" | null
    scoring_policy_version: string | null
    visibility: "public" | null
    scoring: MatchSetScore | null
    ladder_season_id: string | null
    counted_status: LadderMatchSetCountedStatus
    review_status: "none" | "under_review" | "disputed" | "resolved"
    governance_changed_at: Date | null
  }>(
    `
      select
        id,
        status,
        competition_preset_id,
        competition_preset_version,
        scoring_policy_version,
        visibility,
        scoring,
        ladder_season_id,
        counted_status,
        review_status,
        governance_changed_at
      from match_sets
      where id = $1
    `,
    [matchSetId],
  )
  const matchSet = matchSetResult.rows[0]
  if (!matchSet?.competition_preset_id) {
    return null
  }
  const preset = getCompetitionPreset(matchSet.competition_preset_id)
  const entrantsResult = await pool.query<{
    snapshot: CompetitionEntrantSnapshot
  }>(
    `
      select snapshot
      from competition_entrants
      where match_set_id = $1
      order by entrant_index asc
    `,
    [matchSetId],
  )
  const entrants = entrantsResult.rows.map((row) => {
    const runtime = normalizeStrategyRuntimeMetadata(row.snapshot.runtime)
    return {
      ...row.snapshot,
      runtime,
      runtimeSemantics:
        row.snapshot.runtimeSemantics ??
        describeStrategyRuntimeProductSemantics(runtime),
    }
  })
  const entrantByRevision = new Map(
    entrants.map((entrant) => [entrant.strategyRevisionId, entrant]),
  )
  const score = matchSet.scoring
  const standings: PublicStandingDto[] = (score?.rankings ?? []).map(
    (entry, index) => {
      const entrant = entrantByRevision.get(entry.strategyRevisionId)
      return {
        rank: index + 1,
        entrantId: entrant?.entrantId ?? entry.strategyRevisionId,
        strategyRevisionId: entry.strategyRevisionId,
        ownerHandle: entrant?.ownerHandle ?? "unknown",
        displayLabel: entrant?.displayLabel ?? entry.strategyRevisionId,
        sourceHash: entrant?.sourceHash ?? "",
        points: entry.points,
        wins: entry.wins,
        draws: entry.draws,
        losses: entry.losses,
        penalties: entry.penalties,
        survivingSoldiers: entry.survivingSoldiers,
        survivalTurns: entry.survivalTurns,
        tieBreakerPath: [
          "points",
          "wins",
          "survivingSoldiers",
          "survivalTurns",
          "strategyRevisionId",
        ],
      }
    },
  )
  const matchesResult = await pool.query<{
    match_id: string
    status: MatchStatus
    bottom_strategy_revision_id: string
    top_strategy_revision_id: string
    arena_variant_id: string
    hash: string | null
  }>(
    `
      select
        m.id as match_id,
        m.status,
        m.bottom_strategy_revision_id,
        m.top_strategy_revision_id,
        m.arena_variant_id,
        c.hash
      from match_set_matches msm
      join matches m on m.id = msm.match_id
      left join chronicles c on c.match_id = m.id
      where msm.match_set_id = $1
      order by msm.matrix_index asc
    `,
    [matchSetId],
  )
  const matches = matchesResult.rows.map((row) => ({
    matchId: row.match_id,
    entrants: {
      bottom:
        entrantByRevision.get(row.bottom_strategy_revision_id)?.entrantId ??
        row.bottom_strategy_revision_id,
      top:
        entrantByRevision.get(row.top_strategy_revision_id)?.entrantId ??
        row.top_strategy_revision_id,
    },
    status: row.status,
    replayAvailable: row.status === "complete" && row.hash !== null,
    ...(row.hash ? { chronicleHash: row.hash } : {}),
    ...(matchReason(row.status)
      ? { publicReason: matchReason(row.status) }
      : {}),
    arenaVariantId: row.arena_variant_id,
  }))
  const countedState = classifyCompetitionCountedState({
    executionStatus: mapStatus(matchSet.status),
    storedState: matchSet.counted_status,
    reviewState: matchSet.review_status,
    origin: matchSet.ladder_season_id ? "trial" : "non_competitive",
    expectedMatchCount: matches.length,
    chronicleMatchCount: matches.filter((match) => match.replayAvailable)
      .length,
    scoringAvailable: Array.isArray(score?.rankings),
  })
  const governance = projectPublicCompetitionGovernance({
    countedState,
    reviewState: matchSet.review_status,
    ...(matchSet.governance_changed_at
      ? { changedAt: matchSet.governance_changed_at.toISOString() }
      : {}),
    replayAvailable: matches.some((match) => match.replayAvailable),
  })
  const dto: PublicMatchSetResultDto = {
    matchSetId,
    preset: {
      id: preset.id,
      version: preset.version,
      label: preset.label,
    },
    status: mapStatus(matchSet.status),
    visibility: matchSet.visibility ?? "public",
    scoringPolicy: preset.scoringPolicy,
    entrants,
    standings,
    matches,
    provenance: {
      matchSetId,
      presetId: preset.id,
      scoringPolicyVersion:
        matchSet.scoring_policy_version ?? preset.scoringPolicy.version,
      entrantSnapshotIds: entrants.map((entrant) => entrant.entrantId),
      chronicleHashes: matchesResult.rows
        .map((row) => row.hash)
        .filter((hash): hash is string => hash !== null),
    },
    publication: {
      publicResults: true,
      publicReplayEvidence: true,
      privateFieldsExcluded: [
        "Strategy source",
        "StrategyMemory",
        "SoldierMemory",
        "objective payloads",
        "owner debug",
        "private runtime internals",
      ],
    },
    competition: {
      ...(matchSet.ladder_season_id
        ? { seasonId: matchSet.ladder_season_id }
        : {}),
      countedState,
      governance,
    },
  }
  assertPublicMatchSetResultLeakSafe(dto)
  return dto
}
