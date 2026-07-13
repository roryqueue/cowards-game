import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto"
import { Buffer } from "node:buffer"
import {
  assertPublicMatchSetResultLeakSafe,
  assertTrialSeasonTransition,
  COMPATIBILITY_VERSIONS,
  classifyCompetitionCountedState,
  countedEntryEligibilityDecision,
  describeStrategyRuntimeProductSemantics,
  EXHIBITION_SCORING_POLICY_V1,
  evaluateStrategyRuntimeCountedEligibility,
  getCountedEntryEligibilityPublicCopy,
  hashExecutableLaneIdentity,
  hashRuntimeEvidenceAuthorityPayload,
  isCountedEntrySupportedLane,
  normalizeStrategyRuntimeMetadata,
  parseRuntimeEvidenceAuthorityPayloadBytes,
  projectTrialSeasonWindows,
  projectPublicCompetitionGovernance,
  STRATEGY_RUNTIME_ABI_VERSION,
  trialSeasonOutcome,
  trialSeasonPublicLinks,
  validateRuntimeBrokerRegistryMatch,
  type CompetitionEntrantSnapshot,
  type CountedEntryEligibilityCategory,
  type CountedEntryEligibilityDecision,
  type PublicLadderMatchSetSummaryDto,
  type PublicStandingDto,
  type PublicTrialLadderSeasonDto,
  type StrategyRevisionId,
  type RuntimeEvidenceAuthorityPayload,
  type TrialLadderEntrySnapshot,
  type TrialLadderEntryStatus,
  type TrialLadderSeasonStatus,
  type TrialSeasonOutcomeStatus,
  type UserId,
} from "@cowards/spec"
import type { Pool } from "pg"
import type { PoolClient } from "pg"
import { withTransaction } from "./db.js"
import { generateCompetitionPairwiseMatrix } from "./competition.js"
import {
  insertMatchSetWithMatrixOnClient,
  resolveMatchSetExecutionEvidence,
  type MatchSetExecutionEvidenceResolver,
} from "./matchset-service.js"
import { createRepositories } from "./repositories.js"
import { createDevelopmentSeedData } from "./seed.js"
import type { MatchSetStatus } from "./schema.js"
import type { MatchSetStrategyScore } from "./scoring.js"
import {
  recomputeSeasonStandings,
  type ClassifiedSeasonMatchSet,
} from "./standings-recompute.js"

export class LadderInputError extends Error {
  readonly category: CountedEntryEligibilityCategory | undefined
  readonly publicMessage: string
  readonly remediation: string | undefined

  constructor(
    message: string,
    eligibility?: {
      category: CountedEntryEligibilityCategory
      remediation: string
    },
  ) {
    super(message)
    this.name = "LadderInputError"
    this.category = eligibility?.category
    this.publicMessage = message
    this.remediation = eligibility?.remediation
  }
}

const ladderEligibilityError = (
  category: CountedEntryEligibilityCategory,
): LadderInputError => {
  const copy = getCountedEntryEligibilityPublicCopy(category)
  return new LadderInputError(copy.publicMessage, {
    category,
    remediation: copy.remediation,
  })
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

type LadderRuntimeEligibility =
  | {
      decision: CountedEntryEligibilityDecision
      runtime?: undefined
    }
  | {
      decision: CountedEntryEligibilityDecision & { ok: true }
      runtime: CompetitionEntrantSnapshot["runtime"]
    }

const runtimeEligibility = (
  runtime: unknown,
  provenance: {
    metadata?: unknown
    sourceHash?: string | undefined
    sourceBytes?: number | undefined
    engineCompatibility?: unknown
  } = {},
): LadderRuntimeEligibility => {
  const rawRuntime = isRecord(runtime) ? runtime : null
  const language = isRecord(rawRuntime?.language)
    ? rawRuntime.language.id
    : undefined

  if (language === "tinygo") {
    return {
      decision: countedEntryEligibilityDecision("hidden_unsupported_provider"),
    }
  }
  if (!isCountedEntrySupportedLane(language)) {
    return {
      decision: countedEntryEligibilityDecision("unsupported_source_format"),
    }
  }

  const packageMetadata = isRecord(rawRuntime?.package)
    ? rawRuntime.package
    : null
  if (packageMetadata?.mode !== undefined && packageMetadata.mode !== "none") {
    return {
      decision: countedEntryEligibilityDecision("package_policy_violation"),
    }
  }
  if (
    Array.isArray(rawRuntime?.requiredCapabilities) &&
    rawRuntime.requiredCapabilities.length > 0
  ) {
    return {
      decision: countedEntryEligibilityDecision("capability_policy_violation"),
    }
  }

  if (
    rawRuntime?.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
    packageMetadata?.mode !== "none" ||
    !Array.isArray(rawRuntime?.requiredCapabilities) ||
    validateRuntimeBrokerRegistryMatch(runtime).length > 0
  ) {
    return {
      decision: countedEntryEligibilityDecision(
        "incompatible_runtime_metadata",
      ),
    }
  }

  const countedRuntime = evaluateStrategyRuntimeCountedEligibility(runtime)
  if (!countedRuntime.ok) {
    return {
      decision: countedEntryEligibilityDecision(
        countedRuntime.code === "NON_COUNTED_RUNTIME"
          ? "runtime_service_unavailable"
          : "incompatible_runtime_metadata",
      ),
    }
  }

  if (
    provenance.engineCompatibility !== undefined &&
    (!isRecord(provenance.engineCompatibility) ||
      provenance.engineCompatibility.spec !== COMPATIBILITY_VERSIONS.spec ||
      provenance.engineCompatibility.engine !== COMPATIBILITY_VERSIONS.engine)
  ) {
    return {
      decision: countedEntryEligibilityDecision(
        "incompatible_runtime_metadata",
      ),
    }
  }

  const proofCategory = providerProofCategory({
    metadata: provenance.metadata,
    sourceHash: provenance.sourceHash,
    sourceBytes: provenance.sourceBytes,
    language,
  })
  if (proofCategory !== null) {
    return { decision: countedEntryEligibilityDecision(proofCategory) }
  }

  return {
    decision: countedEntryEligibilityDecision(
      "provider_validated",
    ) as CountedEntryEligibilityDecision & { ok: true },
    runtime: normalizeStrategyRuntimeMetadata(runtime),
  }
}

export const assertLadderEligibleRuntime = (
  runtime: unknown,
  provenance: {
    metadata?: unknown
    sourceHash?: string | undefined
    sourceBytes?: number | undefined
  } = {},
): CompetitionEntrantSnapshot["runtime"] => {
  const eligibility = runtimeEligibility(runtime, provenance)
  if (!eligibility.decision.ok || !eligibility.runtime) {
    throw ladderEligibilityError(eligibility.decision.category)
  }
  return eligibility.runtime
}

const providerProofCategory = (input: {
  metadata: unknown
  sourceHash: string | undefined
  sourceBytes: number | undefined
  language: "typescript" | "python" | "rust" | "zig"
}): CountedEntryEligibilityCategory | null => {
  if (!isRecord(input.metadata)) {
    return "provider_proof_missing"
  }
  const artifactKey =
    input.language === "typescript" || input.language === "python"
      ? "sourceArtifact"
      : "compiledArtifact"
  const artifact = input.metadata[artifactKey]
  const validation = input.metadata.providerValidation
  if (!isRecord(artifact) || !isRecord(validation)) {
    return "provider_proof_missing"
  }
  if (typeof validation.proof !== "string" || validation.proof.length === 0) {
    return "provider_proof_missing"
  }
  if (
    !input.sourceHash ||
    input.sourceBytes === undefined ||
    artifact.sourceHash !== input.sourceHash ||
    validation.sourceHash !== input.sourceHash ||
    validation.sourceBytes !== input.sourceBytes ||
    ((input.language === "typescript" || input.language === "python") &&
      artifact.sourceBytes !== input.sourceBytes)
  ) {
    return "provider_proof_stale"
  }

  if (input.language === "typescript" || input.language === "python") {
    const expectedFormat =
      input.language === "typescript"
        ? "transpiled-javascript"
        : "python-source-bundle"
    if (artifact.format !== expectedFormat) {
      return "unsupported_source_format"
    }
    if (
      artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION ||
      (isRecord(artifact.toolchain) &&
        artifact.toolchain.language !== input.language)
    ) {
      return "incompatible_runtime_metadata"
    }
  } else {
    const expectedTarget =
      input.language === "zig" ? "wasm32-wasi" : "wasm32-wasip1"
    if (
      artifact.targetTriple !== expectedTarget ||
      artifact.wasiProfile !== "preview1" ||
      artifact.abiEnvelope !== "stdin-stdout-json" ||
      artifact.abiVersion !== STRATEGY_RUNTIME_ABI_VERSION
    ) {
      return "incompatible_runtime_metadata"
    }
  }

  const matches =
    input.language === "typescript" || input.language === "python"
      ? sourceArtifactProviderValidationMatches(
          input.metadata,
          input.sourceHash,
          input.sourceBytes,
          input.language === "typescript"
            ? "strategy-language-provider-js-ts"
            : "strategy-language-provider-python",
          input.language,
        )
      : rustProviderValidationMatches(
          input.metadata,
          input.sourceHash,
          input.sourceBytes,
          input.language,
        )
  return matches ? null : "provider_proof_mismatched"
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

export const TRIAL_LADDER_PRESET_ID = "standard-exhibition-v1" as const
export const DEFAULT_LADDER_MINIMUM_ENTRIES = 4
export const DEFAULT_LADDER_TARGET_POD_SIZE = 4

export const trialLadderStatusLabel = (
  status: TrialLadderSeasonStatus,
): string => {
  switch (status) {
    case "draft":
      return "Preparing"
    case "open":
      return "Open for entries"
    case "scheduling":
      return "Scheduling matches"
    case "active":
      return "Matches running"
    case "completed":
      return "Complete"
    case "archived":
      return "Archived"
  }
}

const ensureCompetitionArenas = async (pool: Pool): Promise<void> => {
  const repositories = createRepositories(pool)
  for (const arena of createDevelopmentSeedData().arenas) {
    await repositories.upsertArenaVariant(arena)
  }
}

const stableEntryOrder = <
  T extends { id: string; snapshot: { sourceHash: string } },
>(
  entries: T[],
  seasonSeed: string,
): T[] =>
  entries
    .slice()
    .sort((left, right) =>
      `${seasonSeed}:${left.snapshot.sourceHash}:${left.id}`.localeCompare(
        `${seasonSeed}:${right.snapshot.sourceHash}:${right.id}`,
      ),
    )

export const createTrialLadderSeason = async (
  pool: Pool,
  input: {
    name: string
    slug: string
    description?: string | undefined
    seasonId?: string | undefined
    seasonSeed?: string | undefined
  },
): Promise<string> => {
  const id = input.seasonId ?? `trial-season:${randomUUID()}`
  const slug = input.slug.trim()
  const name = input.name.trim()
  if (!slug || !name) {
    throw new LadderInputError(
      "Trial ladder season name and slug are required.",
    )
  }
  await pool.query(
    `
      insert into trial_ladder_seasons (
        id, slug, name, description, status, season_seed,
        minimum_entries, target_pod_size
      )
      values ($1, $2, $3, $4, 'draft', $5, $6, $7)
    `,
    [
      id,
      slug,
      name,
      input.description ?? null,
      input.seasonSeed ?? slug,
      DEFAULT_LADDER_MINIMUM_ENTRIES,
      DEFAULT_LADDER_TARGET_POD_SIZE,
    ],
  )
  return id
}

type TrialLadderSeasonStatusChange = {
  seasonId: string
  status: TrialLadderSeasonStatus
  actorUserId?: UserId | undefined
  reason: string
}

const setTrialLadderSeasonStatusOnClient = async (
  client: PoolClient,
  input: TrialLadderSeasonStatusChange,
): Promise<void> => {
  if (!input.reason.trim()) {
    throw new LadderInputError("A reason is required for season changes.")
  }
  const existing = await client.query<{ status: TrialLadderSeasonStatus }>(
    "select status from trial_ladder_seasons where id = $1 for update",
    [input.seasonId],
  )
  const before = existing.rows[0]
  if (!before) {
    throw new LadderInputError(
      `Trial ladder season not found: ${input.seasonId}`,
    )
  }
  try {
    assertTrialSeasonTransition(before.status, input.status)
  } catch {
    throw new LadderInputError(
      `Trial Season cannot move from ${before.status} to ${input.status}.`,
    )
  }
  if (before.status === input.status) {
    return
  }
  const timestampColumn =
    input.status === "open"
      ? "opened_at"
      : input.status === "scheduling"
        ? "scheduled_at"
        : input.status === "completed"
          ? "completed_at"
          : input.status === "archived"
            ? "archived_at"
            : null
  await client.query(
    `
      update trial_ladder_seasons
      set status = $2,
          updated_at = now(),
          opened_at = case when $3 = 'opened_at' then coalesce(opened_at, now()) else opened_at end,
          scheduled_at = case when $3 = 'scheduled_at' then coalesce(scheduled_at, now()) else scheduled_at end,
          completed_at = case when $3 = 'completed_at' then coalesce(completed_at, now()) else completed_at end,
          archived_at = case when $3 = 'archived_at' then coalesce(archived_at, now()) else archived_at end,
          closed_at = case when $4 then coalesce(closed_at, now()) else closed_at end
      where id = $1
    `,
    [
      input.seasonId,
      input.status,
      timestampColumn,
      before.status === "open" && input.status !== "open",
    ],
  )
  await client.query(
    `
      insert into competition_audit_events (
        id, actor_user_id, action, target_type, target_id,
        before_state, after_state, reason, public_explanation
      )
      values ($1, $2, 'season_status_changed', 'trial_ladder_season', $3, $4, $5, $6, $7)
    `,
    [
      `audit:${randomUUID()}`,
      input.actorUserId ?? null,
      input.seasonId,
      { status: before.status },
      { status: input.status },
      input.reason,
      `Season moved to ${trialLadderStatusLabel(input.status)}.`,
    ],
  )
}

export const setTrialLadderSeasonStatus = async (
  pool: Pool,
  input: TrialLadderSeasonStatusChange,
): Promise<void> =>
  withTransaction(pool, (client) =>
    setTrialLadderSeasonStatusOnClient(client, input),
  )

export const enterTrialLadderSeason = async (
  pool: Pool,
  input: {
    seasonId: string
    userId: UserId
    revisionId: StrategyRevisionId
  },
): Promise<string> =>
  withTransaction(pool, async (client) => {
    const eligibility = await evaluateCountedEntryEligibilityDetails(
      client,
      input,
      true,
    )
    if (!eligibility.decision.ok || !eligibility.row || !eligibility.runtime) {
      throw ladderEligibilityError(eligibility.decision.category)
    }
    const row = eligibility.row
    const runtime = eligibility.runtime
    if (row.locked_at === null) {
      throw ladderEligibilityError("mutable_draft")
    }

    const entryId = `trial-entry:${randomUUID()}`
    const label = row.metadata.label ?? row.strategy_name
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const entryIndexResult = await client.query<{ entry_index: number }>(
        `
        select coalesce(max(entry_index), -1)::integer + 1 as entry_index
        from trial_ladder_entries
        where season_id = $1
      `,
        [input.seasonId],
      )
      const entryIndex = entryIndexResult.rows[0]?.entry_index ?? 0
      const snapshot: TrialLadderEntrySnapshot = {
        entrantId: entryId,
        entrantIndex: entryIndex,
        strategyRevisionId: input.revisionId,
        ownerUserId: row.owner_user_id,
        ownerHandle: row.handle,
        displayLabel: `@${row.handle} / "${label}" / ${row.source_hash.slice(0, 10)}`,
        sourceHash: row.source_hash,
        sourceBytes: row.source_bytes,
        runtime,
        runtimeSemantics: describeStrategyRuntimeProductSemantics(runtime),
        engineCompatibility: row.engine_compatibility,
        lockedAt:
          row.locked_at instanceof Date
            ? row.locked_at.toISOString()
            : row.locked_at,
        seasonId: input.seasonId,
        entryId,
        status: "active",
        strategyName: row.strategy_name,
        ...(row.strategy_description
          ? { strategyDescription: row.strategy_description }
          : {}),
        tags: row.strategy_tags.length
          ? row.strategy_tags
          : (row.metadata.tags ?? []),
      }

      try {
        await client.query("savepoint counted_entry_insert")
        await client.query(
          `
        insert into trial_ladder_entries (
          id, season_id, owner_user_id, owner_handle, strategy_id,
          strategy_revision_id, status, snapshot, entry_index
        )
        values ($1, $2, $3, $4, $5, $6, 'active', $7, $8)
      `,
          [
            entryId,
            input.seasonId,
            row.owner_user_id,
            row.handle,
            row.strategy_id,
            input.revisionId,
            snapshot,
            entryIndex,
          ],
        )
        await client.query("release savepoint counted_entry_insert")
        return entryId
      } catch (error) {
        if (!isRecord(error) || error.code !== "23505") {
          throw error
        }
        await client.query("rollback to savepoint counted_entry_insert")
        const constraint =
          typeof error.constraint === "string" ? error.constraint : ""
        if (constraint.includes("entry_index")) {
          continue
        }
        const existing = await findOwnerSeasonEntry(client, input)
        if (
          existing ||
          constraint.includes("owner_user_id") ||
          constraint.includes("strategy_revision_id")
        ) {
          throw ladderEligibilityError(
            existing && existing.status !== "active"
              ? "replacement_blocked"
              : "already_entered_season",
          )
        }
        throw error
      }
    }
    throw new Error("Counted entry index allocation did not converge.")
  })

type CountedEntryInput = {
  seasonId: string
  userId: UserId
  revisionId: StrategyRevisionId
}

type CountedEntryRevisionRow = {
  strategy_id: string
  strategy_name: string
  strategy_description: string | null
  strategy_tags: string[]
  source_hash: string
  source_bytes: number
  runtime: CompetitionEntrantSnapshot["runtime"]
  engine_compatibility: CompetitionEntrantSnapshot["engineCompatibility"]
  validation: { valid?: unknown }
  metadata: Record<string, unknown> & {
    label?: string
    notes?: string
    tags?: string[]
  }
  owner_user_id: UserId
  handle: string
  locked_at: Date | string | null
}

type CountedEntryEligibilityDetails = {
  decision: CountedEntryEligibilityDecision
  row?: CountedEntryRevisionRow
  runtime?: CompetitionEntrantSnapshot["runtime"]
}

export const evaluateStoredRevisionCountedEligibility = (input: {
  valid: boolean
  lockedAt: Date | string | null | undefined
  runtime: unknown
  metadata?: unknown
  sourceHash?: string | undefined
  sourceBytes?: number | undefined
  engineCompatibility?: unknown
}): CountedEntryEligibilityDecision => {
  if (!input.valid) {
    return countedEntryEligibilityDecision("invalid_strategy_revision")
  }
  if (!input.lockedAt) {
    return countedEntryEligibilityDecision("mutable_draft")
  }
  return runtimeEligibility(input.runtime, {
    metadata: input.metadata,
    sourceHash: input.sourceHash,
    sourceBytes: input.sourceBytes,
    engineCompatibility: input.engineCompatibility,
  }).decision
}

const findOwnerSeasonEntry = async (
  pool: Pool | PoolClient,
  input: Pick<CountedEntryInput, "seasonId" | "userId">,
): Promise<{ id: string; status: TrialLadderEntryStatus } | null> => {
  const result = await pool.query<{
    id: string
    status: TrialLadderEntryStatus
  }>(
    `
      select id, status
      from trial_ladder_entries
      where season_id = $1 and owner_user_id = $2
      limit 1
    `,
    [input.seasonId, input.userId],
  )
  return result.rows[0] ?? null
}

const evaluateCountedEntryEligibilityDetails = async (
  pool: Pool | PoolClient,
  input: CountedEntryInput,
  lockSeason = false,
): Promise<CountedEntryEligibilityDetails> => {
  const season = await pool.query<{
    status: TrialLadderSeasonStatus
  }>(
    `select status from trial_ladder_seasons where id = $1${lockSeason ? " for update" : ""}`,
    [input.seasonId],
  )
  if (season.rows[0]?.status !== "open") {
    return { decision: countedEntryEligibilityDecision("season_not_open") }
  }

  const existing = await findOwnerSeasonEntry(pool, input)
  if (existing) {
    return {
      decision: countedEntryEligibilityDecision(
        existing.status === "active"
          ? "already_entered_season"
          : "replacement_blocked",
      ),
    }
  }

  const rowResult = await pool.query<CountedEntryRevisionRow>(
    `
      select
        s.id as strategy_id,
        s.name as strategy_name,
        s.description as strategy_description,
        s.public_tags as strategy_tags,
        sr.source_hash,
        sr.source_bytes,
        sr.runtime,
        sr.engine_compatibility,
        sr.validation,
        sr.metadata,
        sr.locked_at,
        s.owner_user_id,
        u.handle
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      join users u on u.id = s.owner_user_id
      where sr.id = $1
        and s.owner_user_id = $2
    `,
    [input.revisionId, input.userId],
  )
  const row = rowResult.rows[0]
  if (!row) {
    return { decision: countedEntryEligibilityDecision("owner_mismatch") }
  }
  const revisionDecision = evaluateStoredRevisionCountedEligibility({
    valid: row.validation.valid === true,
    lockedAt: row.locked_at,
    runtime: row.runtime,
    metadata: row.metadata,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    engineCompatibility: row.engine_compatibility,
  })
  if (!revisionDecision.ok) {
    return { decision: revisionDecision }
  }
  const runtimeResult = runtimeEligibility(row.runtime, {
    metadata: row.metadata,
    sourceHash: row.source_hash,
    sourceBytes: row.source_bytes,
    engineCompatibility: row.engine_compatibility,
  })
  if (!runtimeResult.runtime) {
    return { decision: runtimeResult.decision }
  }
  return {
    decision: revisionDecision,
    row,
    runtime: runtimeResult.runtime,
  }
}

export const evaluateCountedEntryEligibility = async (
  pool: Pool,
  input: CountedEntryInput,
): Promise<CountedEntryEligibilityDecision> =>
  (await evaluateCountedEntryEligibilityDetails(pool, input)).decision

export const withdrawTrialLadderEntry = async (
  pool: Pool,
  input: { seasonId: string; userId: UserId },
): Promise<void> => {
  await pool.query(
    `
      update trial_ladder_entries
      set status = 'withdrawn', withdrawn_at = coalesce(withdrawn_at, now())
      where season_id = $1 and owner_user_id = $2 and status = 'active'
    `,
    [input.seasonId, input.userId],
  )
}

const readSeasonEntries = async (
  pool: Pool | PoolClient,
  seasonId: string,
): Promise<
  Array<{
    id: string
    status: TrialLadderEntryStatus
    snapshot: TrialLadderEntrySnapshot
  }>
> => {
  const result = await pool.query<{
    id: string
    status: TrialLadderEntryStatus
    snapshot: TrialLadderEntrySnapshot
  }>(
    `
      select id, status, snapshot
      from trial_ladder_entries
      where season_id = $1
      order by entry_index asc, id asc
    `,
    [seasonId],
  )
  return result.rows
}

type InstalledAuthoritySourceType =
  | "attestation"
  | "certificate"
  | "revocation"
  | "supersession"
  | "lane-control"

interface InstalledAuthoritySourceRow {
  type: InstalledAuthoritySourceType
  id: string
  recordHash: string
  currentRecordHash: string
}

interface InstalledAuthorityPublication {
  publicationId: string
  generation: string
  payloadSha256: string
  envelopeSha256: string
  sourceManifestHash: string
  semanticTupleManifestHash: string
  payload: Readonly<RuntimeEvidenceAuthorityPayload>
}

const AUTHORITY_SOURCE_DOMAIN =
  "cowards-game:runtime-evidence-authority-publication-sources:v1"
const AUTHORITY_ENVELOPE_DOMAIN =
  "cowards-game:runtime-evidence-authority-publication-envelope:v1"

const prefixedPublicationHash = (domain: string, bytes: Uint8Array): string =>
  `sha256:${createHash("sha256")
    .update(domain)
    .update("\0")
    .update(bytes)
    .digest("hex")}`

const exactStringArray = (value: unknown, label: string): string[] => {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.length === 0) ||
    new Set(value).size !== value.length
  ) {
    throw new LadderInputError(
      `Installed authority publication ${label} is invalid.`,
    )
  }
  return [...value]
}

const exactSourceRows = (value: unknown): InstalledAuthoritySourceRow[] => {
  if (!Array.isArray(value)) {
    throw new LadderInputError(
      "Installed authority publication source ledger is invalid.",
    )
  }
  return value.map((entry) => {
    if (
      !isRecord(entry) ||
      ![
        "attestation",
        "certificate",
        "revocation",
        "supersession",
        "lane-control",
      ].includes(String(entry.type)) ||
      typeof entry.id !== "string" ||
      typeof entry.recordHash !== "string" ||
      typeof entry.currentRecordHash !== "string"
    ) {
      throw new LadderInputError(
        "Installed authority publication source ledger is invalid.",
      )
    }
    return {
      type: entry.type as InstalledAuthoritySourceType,
      id: entry.id,
      recordHash: entry.recordHash,
      currentRecordHash: entry.currentRecordHash,
    }
  })
}

const sameStrings = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index])

const loadInstalledAuthorityPublication = async (
  client: PoolClient,
  evaluationInstant: string,
): Promise<InstalledAuthorityPublication> => {
  const head = await client.query<{ next_generation: string | number }>(
    `select next_generation
       from runtime_evidence_authority_publication_head
      where singleton = true
      for share`,
  )
  const nextGeneration = String(head.rows[0]?.next_generation ?? "")
  if (!/^[1-9][0-9]{0,15}$/u.test(nextGeneration)) {
    throw new LadderInputError(
      "Installed authority publication head is unavailable.",
    )
  }

  const publicationResult = await client.query<{
    id: string
    generation: string | number
    semantic_tuple_manifest_hash: string
    source_manifest_hash: string
    payload_sha256: string
    envelope_sha256: string
    payload_bytes: Buffer
    envelope_bytes: Buffer
    attestation_ids: unknown
    certificate_ids: unknown
    revocation_ids: unknown
    supersession_ids: unknown
    lane_control_ids: unknown
    receipt: unknown
    publication_sources: unknown
  }>(
    `select p.id, p.generation, p.semantic_tuple_manifest_hash,
            p.source_manifest_hash, p.payload_sha256, p.envelope_sha256,
            p.payload_bytes, p.envelope_bytes, p.attestation_ids,
            p.certificate_ids, p.revocation_ids, p.supersession_ids,
            p.lane_control_ids, installed_head.receipt,
            coalesce((
              select jsonb_agg(
                jsonb_build_object(
                  'type', source.source_type,
                  'id', source.source_id,
                  'recordHash', source.source_record_hash,
                  'currentRecordHash', case source.source_type
                    when 'attestation' then 'sha256:' || attestation.attestation_sha256
                    when 'certificate' then 'sha256:' || certificate.certificate_record_hash
                    when 'revocation' then 'sha256:' || revocation.envelope_hash
                    when 'supersession' then 'sha256:' || supersession.envelope_hash
                    when 'lane-control' then 'sha256:' || lane_control.envelope_hash
                  end
                ) order by source.source_type, source.source_id
              )
              from runtime_evidence_authority_publication_sources source
              left join runtime_evidence_verified_attestations attestation
                on source.source_type = 'attestation'
               and attestation.id = source.attestation_id
               and attestation.verification_status = 'passed'
              left join runtime_evidence_certificates certificate
                on source.source_type = 'certificate'
               and certificate.id = source.certificate_id
               and certificate.certificate_status = 'passed'
              left join runtime_evidence_certificate_revocations revocation
                on source.source_type = 'revocation'
               and revocation.id = source.revocation_id
               and revocation.verification_status = 'passed'
              left join runtime_evidence_certificate_supersessions supersession
                on source.source_type = 'supersession'
               and supersession.id = source.supersession_id
               and supersession.verification_status = 'passed'
              left join runtime_evidence_lane_controls lane_control
                on source.source_type = 'lane-control'
               and lane_control.id = source.lane_control_id
               and lane_control.verification_status = 'passed'
              where source.publication_id = p.id
            ), '[]'::jsonb) as publication_sources
       from runtime_evidence_authority_installed_head installed_head
       join runtime_evidence_authority_publications p
         on p.id = installed_head.publication_id
      where p.generation < $1::bigint
        and p.issued_at <= $2::timestamptz
        and p.valid_from <= $2::timestamptz
        and p.valid_until >= $2::timestamptz
      order by p.generation desc
      limit 1`,
    [nextGeneration, evaluationInstant],
  )
  const row = publicationResult.rows[0]
  if (!row) {
    throw new LadderInputError(
      "A current installed authority publication is required before scheduling.",
    )
  }

  const generation = String(row.generation)
  const payloadBytes = new Uint8Array(row.payload_bytes)
  const envelopeBytes = new Uint8Array(row.envelope_bytes)
  const payload = parseRuntimeEvidenceAuthorityPayloadBytes(payloadBytes)
  const sourceIds = {
    attestationIds: exactStringArray(row.attestation_ids, "attestation IDs"),
    certificateIds: exactStringArray(row.certificate_ids, "certificate IDs"),
    revocationIds: exactStringArray(row.revocation_ids, "revocation IDs"),
    supersessionIds: exactStringArray(row.supersession_ids, "supersession IDs"),
    laneControlIds: exactStringArray(row.lane_control_ids, "lane-control IDs"),
  }
  const receipt = row.receipt
  if (!isRecord(receipt) || !isRecord(receipt.sourceIds)) {
    throw new LadderInputError(
      "Installed authority publication receipt is invalid.",
    )
  }
  const receiptSourceIds = {
    attestationIds: exactStringArray(
      receipt.sourceIds.attestationIds,
      "receipt attestation IDs",
    ),
    certificateIds: exactStringArray(
      receipt.sourceIds.certificateIds,
      "receipt certificate IDs",
    ),
    revocationIds: exactStringArray(
      receipt.sourceIds.revocationIds,
      "receipt revocation IDs",
    ),
    supersessionIds: exactStringArray(
      receipt.sourceIds.supersessionIds,
      "receipt supersession IDs",
    ),
    laneControlIds: exactStringArray(
      receipt.sourceIds.laneControlIds,
      "receipt lane-control IDs",
    ),
  }
  if (
    receipt.schemaVersion !==
      "v1.37-runtime-evidence-authority-install-receipt-v1" ||
    receipt.generation !== generation ||
    receipt.payloadSha256 !== row.payload_sha256 ||
    receipt.envelopeSha256 !== row.envelope_sha256 ||
    receipt.sourceManifestHash !== row.source_manifest_hash ||
    payload.registryGeneration !== generation ||
    payload.semanticTupleManifestHash !== row.semantic_tuple_manifest_hash ||
    hashRuntimeEvidenceAuthorityPayload(payloadBytes) !== row.payload_sha256 ||
    prefixedPublicationHash(AUTHORITY_ENVELOPE_DOMAIN, envelopeBytes) !==
      row.envelope_sha256 ||
    !sameStrings(sourceIds.attestationIds, receiptSourceIds.attestationIds) ||
    !sameStrings(sourceIds.certificateIds, receiptSourceIds.certificateIds) ||
    !sameStrings(sourceIds.revocationIds, receiptSourceIds.revocationIds) ||
    !sameStrings(sourceIds.supersessionIds, receiptSourceIds.supersessionIds) ||
    !sameStrings(sourceIds.laneControlIds, receiptSourceIds.laneControlIds)
  ) {
    throw new LadderInputError(
      "Installed authority publication receipt or bytes drifted.",
    )
  }

  const sourceRows = exactSourceRows(row.publication_sources).sort(
    (left, right) =>
      left.type === right.type
        ? left.id.localeCompare(right.id)
        : left.type.localeCompare(right.type),
  )
  const expectedSources = [
    ...sourceIds.attestationIds.map((id) => ({
      type: "attestation" as const,
      id,
    })),
    ...sourceIds.certificateIds.map((id) => ({
      type: "certificate" as const,
      id,
    })),
    ...sourceIds.revocationIds.map((id) => ({
      type: "revocation" as const,
      id,
    })),
    ...sourceIds.supersessionIds.map((id) => ({
      type: "supersession" as const,
      id,
    })),
    ...sourceIds.laneControlIds.map((id) => ({
      type: "lane-control" as const,
      id,
    })),
  ].sort((left, right) =>
    left.type === right.type
      ? left.id.localeCompare(right.id)
      : left.type.localeCompare(right.type),
  )
  if (
    sourceRows.length !== expectedSources.length ||
    sourceRows.some(
      (source, index) =>
        source.type !== expectedSources[index]?.type ||
        source.id !== expectedSources[index]?.id ||
        source.recordHash !== source.currentRecordHash,
    )
  ) {
    throw new LadderInputError(
      "Installed authority publication source set drifted.",
    )
  }
  const sourceManifest = sourceRows.map(({ type, id, recordHash }) => ({
    type,
    id,
    recordHash,
  }))
  if (
    prefixedPublicationHash(
      AUTHORITY_SOURCE_DOMAIN,
      new TextEncoder().encode(JSON.stringify(sourceManifest)),
    ) !== row.source_manifest_hash
  ) {
    throw new LadderInputError(
      "Installed authority publication source manifest drifted.",
    )
  }

  return {
    publicationId: row.id,
    generation,
    payloadSha256: row.payload_sha256,
    envelopeSha256: row.envelope_sha256,
    sourceManifestHash: row.source_manifest_hash,
    semanticTupleManifestHash: row.semantic_tuple_manifest_hash,
    payload,
  }
}

const assertSchedulingIdentityMatchesInstalledPublication = (
  identity: Awaited<ReturnType<typeof resolveMatchSetExecutionEvidence>>,
  publication: InstalledAuthorityPublication,
  purpose: "counted" | "exhibition",
  evaluationInstant: string,
): void => {
  const payload = publication.payload
  const certificates = new Map(
    payload.certificates.map((certificate) => [
      certificate.certificateId,
      certificate,
    ]),
  )
  const revoked = new Set(
    payload.revocations.map(
      (entry) => `${entry.certificateId}\0${entry.certificateRecordHash}`,
    ),
  )
  const superseded = new Set(
    payload.supersessions.map((entry) => entry.certificateId),
  )
  const disabled = new Set(
    payload.operatorLaneDisables.map((entry) => entry.laneIdentityHash),
  )
  if (
    identity.registryGeneration !== publication.generation ||
    identity.authorityBundleHash !==
      publication.payloadSha256.slice("sha256:".length) ||
    identity.compatibility.tupleId !== publication.semanticTupleManifestHash
  ) {
    throw new LadderInputError(
      "Scheduling identity does not match the installed authority publication.",
    )
  }
  for (const entrant of Object.values(identity.executionEntrants)) {
    const laneIdentityHash = `sha256:${hashExecutableLaneIdentity(entrant.laneIdentity)}`
    const containment = certificates.get(
      entrant.containmentCertificateRef.certificateId,
    )
    const conformanceReference = entrant.conformanceCertificateRef
    const conformance = conformanceReference
      ? certificates.get(conformanceReference.certificateId)
      : undefined
    const certificateMatches = (
      certificate: typeof containment,
      kind: "containment" | "conformance",
      reference: {
        certificateId: string
        certificateVersion: string
        certificateRecordHash: string
      },
    ) =>
      certificate?.kind === kind &&
      certificate.certificateVersion === reference.certificateVersion &&
      certificate.certificateRecordHash ===
        `sha256:${reference.certificateRecordHash}` &&
      certificate.laneIdentityHash === laneIdentityHash &&
      !revoked.has(
        `${reference.certificateId}\0sha256:${reference.certificateRecordHash}`,
      ) &&
      !superseded.has(reference.certificateId)
    if (
      disabled.has(laneIdentityHash) ||
      !certificateMatches(
        containment,
        "containment",
        entrant.containmentCertificateRef,
      ) ||
      (purpose === "counted" &&
        (!conformanceReference ||
          !certificateMatches(
            conformance,
            "conformance",
            conformanceReference,
          ))) ||
      (purpose !== "counted" && conformanceReference !== undefined) ||
      entrant.schedulingDecision.evaluatedAt !== evaluationInstant ||
      entrant.schedulingDecision.registryGeneration !==
        publication.generation ||
      Date.parse(entrant.schedulingDecision.freshUntil) <
        Date.parse(evaluationInstant)
    ) {
      throw new LadderInputError(
        "Scheduling evidence is stale, revoked, disabled, or absent from the installed authority publication.",
      )
    }
  }
}

export const scheduleTrialLadderSeason = async (
  pool: Pool,
  input: {
    seasonId: string
    actorUserId?: UserId | undefined
    now?: Date | undefined
    evidenceResolver?: MatchSetExecutionEvidenceResolver | undefined
  },
): Promise<{
  scheduleRunId: string
  createdMatchSetIds: string[]
  leftoverEntryIds: string[]
}> => {
  return withTransaction(pool, async (client) => {
    const seasonResult = await client.query<{
      id: string
      status: TrialLadderSeasonStatus
      season_seed: string
      minimum_entries: number
      target_pod_size: number
    }>(
      `
        select id, status, season_seed, minimum_entries, target_pod_size
        from trial_ladder_seasons
        where id = $1
        for update
      `,
      [input.seasonId],
    )
    const season = seasonResult.rows[0]
    if (!season) {
      throw new LadderInputError(
        `Trial ladder season not found: ${input.seasonId}`,
      )
    }

    const existingRun = await client.query<{
      id: string
      created_match_set_ids: unknown
      leftover_entry_ids: unknown
    }>(
      `
        select id, created_match_set_ids, leftover_entry_ids
        from trial_ladder_schedule_runs
        where season_id = $1 and status in ('complete', 'no_op')
        order by run_index desc
        limit 1
      `,
      [input.seasonId],
    )
    const previous = existingRun.rows[0]
    if (previous) {
      return {
        scheduleRunId: previous.id,
        createdMatchSetIds: Array.isArray(previous.created_match_set_ids)
          ? previous.created_match_set_ids.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
        leftoverEntryIds: Array.isArray(previous.leftover_entry_ids)
          ? previous.leftover_entry_ids.filter(
              (value): value is string => typeof value === "string",
            )
          : [],
      }
    }

    if (season.status !== "open" && season.status !== "scheduling") {
      throw new LadderInputError(
        "Trial ladder season must be open or scheduling before MatchSets can be generated.",
      )
    }
    const entries = stableEntryOrder(
      (await readSeasonEntries(client, input.seasonId)).filter(
        (entry) => entry.status === "active",
      ),
      season.season_seed,
    )
    const podSize = season.target_pod_size || DEFAULT_LADDER_TARGET_POD_SIZE
    const fullPodCount = Math.floor(entries.length / podSize)
    const scheduleRunId = `trial-schedule:${randomUUID()}`

    if (entries.length < season.minimum_entries || fullPodCount === 0) {
      if (season.status === "open") {
        await setTrialLadderSeasonStatusOnClient(client, {
          seasonId: input.seasonId,
          status: "scheduling",
          actorUserId: input.actorUserId,
          reason: "Froze counted entries for deterministic scheduling.",
        })
      }
      const leftoverEntryIds = entries.map((entry) => entry.id)
      await client.query(
        `
          insert into trial_ladder_schedule_runs (
            id, season_id, run_index, status, created_match_set_ids, leftover_entry_ids
          )
          values ($1, $2, 0, 'no_op', '[]'::jsonb, $3::jsonb)
        `,
        [scheduleRunId, input.seasonId, JSON.stringify(leftoverEntryIds)],
      )
      const outcome = trialSeasonOutcome("insufficient_evidence")
      await client.query(
        `
          update trial_ladder_seasons
          set outcome_status = $2, public_outcome_explanation = $3
          where id = $1
        `,
        [input.seasonId, outcome.status, outcome.publicExplanation],
      )
      await setTrialLadderSeasonStatusOnClient(client, {
        seasonId: input.seasonId,
        status: "completed",
        actorUserId: input.actorUserId,
        reason: "Season closed without enough entrants for counted evidence.",
      })
      return {
        scheduleRunId,
        createdMatchSetIds: [],
        leftoverEntryIds,
      }
    }

    const now = input.now ?? new Date()
    const evaluationInstant = now.toISOString()
    const publication = await loadInstalledAuthorityPublication(
      client,
      evaluationInstant,
    )
    const preparedPods = []
    for (let podIndex = 0; podIndex < fullPodCount; podIndex += 1) {
      const pod = entries.slice(podIndex * podSize, (podIndex + 1) * podSize)
      const matchSetId = `match-set:trial:${input.seasonId}:0:${podIndex}`
      const entrants = pod.map((entry, index) => ({
        ...entry.snapshot,
        entrantIndex: index,
        entrantId: entry.id,
      }))
      const matches = generateCompetitionPairwiseMatrix({
        matchSetId,
        presetId: TRIAL_LADDER_PRESET_ID,
        entrants,
      })
      const integrityIdentity = await resolveMatchSetExecutionEvidence({
        resolver: input.evidenceResolver,
        purpose: "counted",
        evaluationInstant,
        entrants: entrants.map((entrant) => ({
          entrantKey: entrant.strategyRevisionId,
          strategyRevisionId: entrant.strategyRevisionId,
        })),
      })
      assertSchedulingIdentityMatchesInstalledPublication(
        integrityIdentity,
        publication,
        "counted",
        evaluationInstant,
      )
      preparedPods.push({
        podIndex,
        matchSetId,
        entrants,
        matches,
        integrityIdentity,
      })
    }

    if (season.status === "open") {
      await setTrialLadderSeasonStatusOnClient(client, {
        seasonId: input.seasonId,
        status: "scheduling",
        actorUserId: input.actorUserId,
        reason: "Froze counted entries for deterministic scheduling.",
      })
    }
    const repositories = createRepositories(client)
    for (const arena of createDevelopmentSeedData().arenas) {
      await repositories.upsertArenaVariant(arena)
    }

    const createdMatchSetIds: string[] = []
    for (const prepared of preparedPods) {
      const { podIndex, matchSetId, entrants, matches, integrityIdentity } =
        prepared
      await insertMatchSetWithMatrixOnClient(client, {
        id: matchSetId,
        matches,
        integrityIdentity,
        matchSet: {
          presetId: "standard-v1",
          presetVersion: "v1",
          competitionPresetId: TRIAL_LADDER_PRESET_ID,
          competitionPresetVersion: "v1",
          scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
          visibility: "public",
          entrantSnapshotSet: entrants,
          publicationPolicy: {
            publicResults: true,
            publicReplayEvidence: true,
            excludesPrivateStrategyData: true,
            trialLadder: true,
          },
          lockedAt: now,
        },
        competitionEntrants: entrants.map((entrant) => ({
          id: `${matchSetId}:${entrant.entryId}`,
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
      await client.query(
        `
          update match_sets
          set ladder_season_id = $2,
              ladder_schedule_run_id = $3,
              ladder_pod_index = $4,
              counted_status = 'pending',
              public_counted_explanation = 'Waiting for complete replay-backed evidence.'
          where id = $1
        `,
        [matchSetId, input.seasonId, scheduleRunId, podIndex],
      )
      createdMatchSetIds.push(matchSetId)
    }

    const leftoverEntryIds = entries
      .slice(fullPodCount * podSize)
      .map((entry) => entry.id)
    await client.query(
      `
        insert into trial_ladder_schedule_runs (
          id, season_id, run_index, status, created_match_set_ids, leftover_entry_ids
        )
        values ($1, $2, 0, 'complete', $3::jsonb, $4::jsonb)
      `,
      [
        scheduleRunId,
        input.seasonId,
        JSON.stringify(createdMatchSetIds),
        JSON.stringify(leftoverEntryIds),
      ],
    )
    const outcome = trialSeasonOutcome("scheduled")
    await client.query(
      `
        update trial_ladder_seasons
        set outcome_status = $2, public_outcome_explanation = $3
        where id = $1
      `,
      [input.seasonId, outcome.status, outcome.publicExplanation],
    )
    await setTrialLadderSeasonStatusOnClient(client, {
      seasonId: input.seasonId,
      status: "active",
      actorUserId: input.actorUserId,
      reason: "Created deterministic round-robin ladder pods.",
    })
    return { scheduleRunId, createdMatchSetIds, leftoverEntryIds }
  })
}

const mapMatchSetStatus = (
  status: MatchSetStatus,
): "queued" | "running" | "complete" | "degraded" | "failed" => {
  if (status === "pending") return "queued"
  if (status === "running") return "running"
  if (status === "complete") return "complete"
  if (status === "degraded") return "degraded"
  return "failed"
}

export const buildTrialLadderSeasonDto = async (
  pool: Pool,
  seasonIdOrSlug: string,
): Promise<PublicTrialLadderSeasonDto | null> => {
  const seasonResult = await pool.query<{
    id: string
    slug: string
    name: string
    description: string | null
    status: TrialLadderSeasonStatus
    season_seed: string
    minimum_entries: number
    target_pod_size: number
    stale_revision_policy: string
    opened_at: Date | null
    closed_at: Date | null
    scheduled_at: Date | null
    completed_at: Date | null
    archived_at: Date | null
    outcome_status: Exclude<TrialSeasonOutcomeStatus, "pending"> | null
    public_outcome_explanation: string | null
  }>(
    `
      select *
      from trial_ladder_seasons
      where id = $1 or slug = $1
    `,
    [seasonIdOrSlug],
  )
  const season = seasonResult.rows[0]
  if (!season) {
    return null
  }
  const entries = (await readSeasonEntries(pool, season.id)).map((entry) => ({
    ...entry.snapshot,
    status: entry.status,
  }))
  const matchSetRows = await pool.query<{
    id: string
    status: MatchSetStatus
    ladder_schedule_run_id: string | null
    ladder_pod_index: number | null
    counted_status: PublicLadderMatchSetSummaryDto["countedStatus"]
    public_counted_explanation: string | null
    review_status: "none" | "under_review" | "disputed" | "resolved"
    governance_changed_at: Date | null
    scoring: { rankings: MatchSetStrategyScore[] } | null
    chronicle_count: number
    match_count: number
    replay_match_id: string | null
  }>(
    `
      select
        ms.id,
        ms.status,
        ms.ladder_schedule_run_id,
        ms.ladder_pod_index,
        ms.counted_status,
        ms.public_counted_explanation,
        ms.review_status,
        ms.governance_changed_at,
        ms.scoring,
        count(distinct c.match_id)::integer as chronicle_count,
        count(distinct msm.match_id)::integer as match_count,
        min(case when c.match_id is not null then msm.match_id end) as replay_match_id
      from match_sets ms
      left join match_set_matches msm on msm.match_set_id = ms.id
      left join chronicles c on c.match_id = msm.match_id
      where ms.ladder_season_id = $1
      group by ms.id
      order by ms.created_at asc, ms.id asc
    `,
    [season.id],
  )
  const matchSets: PublicLadderMatchSetSummaryDto[] = []
  const recomputeInputs: ClassifiedSeasonMatchSet[] = []
  for (const row of matchSetRows.rows) {
    const countedState = classifyCompetitionCountedState({
      executionStatus: mapMatchSetStatus(row.status),
      storedState: row.counted_status,
      reviewState: row.review_status,
      origin: "trial",
      expectedMatchCount: row.match_count,
      chronicleMatchCount: row.chronicle_count,
      scoringAvailable: Array.isArray(row.scoring?.rankings),
    })
    const entrantRows = await pool.query<{
      snapshot: TrialLadderEntrySnapshot
    }>(
      `
        select snapshot
        from competition_entrants
        where match_set_id = $1
        order by entrant_index asc
      `,
      [row.id],
    )
    const entrantIds = entrantRows.rows.map(
      (entrant) => entrant.snapshot.entryId,
    )
    const strategyRevisionIds = entrantRows.rows.map(
      (entrant) => entrant.snapshot.strategyRevisionId,
    )
    const resultHref = `/matchsets/${encodeURIComponent(row.id)}`
    const replayHref = row.replay_match_id
      ? `/matches/${encodeURIComponent(row.replay_match_id)}/replay`
      : undefined
    const governance = projectPublicCompetitionGovernance({
      countedState,
      reviewState: row.review_status,
      ...(row.governance_changed_at
        ? { changedAt: row.governance_changed_at.toISOString() }
        : {}),
      replayAvailable: Boolean(replayHref),
    })
    recomputeInputs.push({
      matchSetId: row.id,
      strategyRevisionIds,
      countedState,
      scoring: row.scoring,
      resultHref,
      ...(replayHref ? { replayHref } : {}),
    })
    matchSets.push({
      matchSetId: row.id,
      seasonId: season.id,
      ...(row.ladder_schedule_run_id
        ? { scheduleRunId: row.ladder_schedule_run_id }
        : {}),
      ...(row.ladder_pod_index === null
        ? {}
        : { podIndex: row.ladder_pod_index }),
      status: mapMatchSetStatus(row.status),
      countedStatus: countedState.state,
      countedState,
      governance,
      ...(countedState.publicReason
        ? { publicReason: countedState.publicReason }
        : {}),
      publicExplanation: countedState.publicExplanation,
      entrantIds,
      ...(replayHref ? { replayHref } : {}),
      resultHref,
    })
  }
  const standings: PublicStandingDto[] = recomputeSeasonStandings({
    entrants: entries.map((entry) => ({
      entrantId: entry.entryId,
      strategyRevisionId: entry.strategyRevisionId,
      ownerHandle: entry.ownerHandle,
      displayLabel: entry.displayLabel,
      sourceHash: entry.sourceHash,
    })),
    matchSets: recomputeInputs,
  })
  const dto: PublicTrialLadderSeasonDto = {
    seasonId: season.id,
    slug: season.slug,
    name: season.name,
    status: season.status,
    statusLabel: trialLadderStatusLabel(season.status),
    ...(season.description ? { description: season.description } : {}),
    seasonSeed: season.season_seed,
    ...(season.opened_at ? { openedAt: season.opened_at.toISOString() } : {}),
    ...(season.closed_at ? { closedAt: season.closed_at.toISOString() } : {}),
    ...(season.scheduled_at
      ? { scheduledAt: season.scheduled_at.toISOString() }
      : {}),
    ...(season.completed_at
      ? { completedAt: season.completed_at.toISOString() }
      : {}),
    ...(season.archived_at
      ? { archivedAt: season.archived_at.toISOString() }
      : {}),
    ...projectTrialSeasonWindows({
      status: season.status,
      ...(season.opened_at ? { openedAt: season.opened_at.toISOString() } : {}),
      ...(season.closed_at ? { closedAt: season.closed_at.toISOString() } : {}),
      ...(season.scheduled_at
        ? { scheduledAt: season.scheduled_at.toISOString() }
        : {}),
    }),
    outcome: {
      ...trialSeasonOutcome(season.outcome_status ?? "pending"),
      ...(season.public_outcome_explanation
        ? { publicExplanation: season.public_outcome_explanation }
        : {}),
    },
    links: trialSeasonPublicLinks(season.slug),
    policy: {
      oneEntryPerUser: true,
      replacementPolicy: "next-season-only",
      staleRevisionPolicy: season.stale_revision_policy,
      standingsReset: true,
      noPermanentRatings: true,
      minimumEntries: season.minimum_entries,
      targetPodSize: season.target_pod_size,
    },
    entries,
    standings,
    matchSets,
    publication: {
      publicEntries: true,
      publicStandings: true,
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
  }
  assertPublicMatchSetResultLeakSafe(dto)
  return dto
}
