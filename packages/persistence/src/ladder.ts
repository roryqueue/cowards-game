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
  countedEntryEligibilityDecision,
  describeStrategyRuntimeProductSemantics,
  EXHIBITION_SCORING_POLICY_V1,
  evaluateStrategyRuntimeCountedEligibility,
  getCountedEntryEligibilityPublicCopy,
  isCountedEntrySupportedLane,
  normalizeStrategyRuntimeMetadata,
  projectTrialSeasonWindows,
  STRATEGY_RUNTIME_ABI_VERSION,
  trialSeasonOutcome,
  trialSeasonPublicLinks,
  validateRuntimeBrokerRegistryMatch,
  type CompetitionEntrantSnapshot,
  type CountedEntryEligibilityCategory,
  type CountedEntryEligibilityDecision,
  type LadderMatchSetCountedStatus,
  type LadderNonCountedReason,
  type PublicLadderMatchSetSummaryDto,
  type PublicStandingDto,
  type PublicTrialLadderSeasonDto,
  type StrategyRevisionId,
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
import { insertMatchSetWithMatrixOnClient } from "./matchset-service.js"
import { refreshMatchSetStatus } from "./matchset-status.js"
import { createRepositories } from "./repositories.js"
import { createDevelopmentSeedData } from "./seed.js"
import type { MatchSetStatus } from "./schema.js"
import type { MatchSetStrategyScore } from "./scoring.js"

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

export const scheduleTrialLadderSeason = async (
  pool: Pool,
  input: { seasonId: string; actorUserId?: UserId | undefined },
): Promise<{
  scheduleRunId: string
  createdMatchSetIds: string[]
  leftoverEntryIds: string[]
}> => {
  await ensureCompetitionArenas(pool)
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
    if (season.status === "open") {
      await setTrialLadderSeasonStatusOnClient(client, {
        seasonId: input.seasonId,
        status: "scheduling",
        actorUserId: input.actorUserId,
        reason: "Froze counted entries for deterministic scheduling.",
      })
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

    const createdMatchSetIds: string[] = []
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
      await insertMatchSetWithMatrixOnClient(client, {
        id: matchSetId,
        matches,
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
          lockedAt: new Date(),
        },
        competitionEntrants: entrants.map((entrant) => ({
          id: `${matchSetId}:${entrant.entryId}`,
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

const classifyCountedStatus = (row: {
  status: MatchSetStatus
  counted_status: LadderMatchSetCountedStatus
  public_counted_reason: LadderNonCountedReason | null
  chronicle_count: number
  match_count: number
}): {
  countedStatus: LadderMatchSetCountedStatus
  publicReason?: LadderNonCountedReason | undefined
  publicExplanation: string
} => {
  if (
    row.counted_status === "invalid" ||
    row.counted_status === "non_competitive" ||
    row.counted_status === "under_review" ||
    row.counted_status === "non_counted"
  ) {
    return {
      countedStatus: row.counted_status,
      ...(row.public_counted_reason
        ? { publicReason: row.public_counted_reason }
        : {}),
      publicExplanation:
        row.counted_status === "under_review"
          ? "Result is under review and excluded until review completes."
          : "Result does not count for standings.",
    }
  }
  if (row.status === "complete" && row.chronicle_count === row.match_count) {
    return {
      countedStatus: "counted",
      publicExplanation: "Counts for trial ladder standings.",
    }
  }
  if (row.status === "failed_system" || row.status === "degraded") {
    return {
      countedStatus: "non_counted",
      publicReason: "system_failure",
      publicExplanation:
        "System failure prevented complete evidence; this result is excluded.",
    }
  }
  return {
    countedStatus: row.status === "running" ? "retrying" : "pending",
    publicReason: "incomplete_evidence",
    publicExplanation: "Waiting for complete replay-backed evidence.",
  }
}

const addScore = (
  totals: Map<string, MatchSetStrategyScore>,
  entry: MatchSetStrategyScore,
): void => {
  const current = totals.get(entry.strategyRevisionId) ?? {
    ...entry,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    penaltyPoints: 0,
    penalties: [],
    failedSystemMatches: 0,
    survivingSoldiers: 0,
    survivalTurns: 0,
  }
  current.wins += entry.wins
  current.losses += entry.losses
  current.draws += entry.draws
  current.points += entry.points
  current.penaltyPoints += entry.penaltyPoints
  current.penalties.push(...entry.penalties)
  current.failedSystemMatches += entry.failedSystemMatches
  current.survivingSoldiers += entry.survivingSoldiers
  current.survivalTurns += entry.survivalTurns
  totals.set(entry.strategyRevisionId, current)
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
    counted_status: LadderMatchSetCountedStatus
    public_counted_reason: LadderNonCountedReason | null
    public_counted_explanation: string | null
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
        ms.public_counted_reason,
        ms.public_counted_explanation,
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
  const totals = new Map<string, MatchSetStrategyScore>()
  const matchSets: PublicLadderMatchSetSummaryDto[] = []
  for (const row of matchSetRows.rows) {
    const refreshed = await refreshMatchSetStatus(pool, row.id)
    const classification = classifyCountedStatus({
      ...row,
      status: refreshed.status,
      chronicle_count: row.chronicle_count,
      match_count: row.match_count,
    })
    if (classification.countedStatus === "counted") {
      for (const ranking of refreshed.scoring.rankings) {
        addScore(totals, ranking)
      }
    }
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
    matchSets.push({
      matchSetId: row.id,
      seasonId: season.id,
      ...(row.ladder_schedule_run_id
        ? { scheduleRunId: row.ladder_schedule_run_id }
        : {}),
      ...(row.ladder_pod_index === null
        ? {}
        : { podIndex: row.ladder_pod_index }),
      status: mapMatchSetStatus(refreshed.status),
      countedStatus: classification.countedStatus,
      ...(classification.publicReason
        ? { publicReason: classification.publicReason }
        : {}),
      publicExplanation:
        classification.countedStatus === "counted"
          ? classification.publicExplanation
          : (row.public_counted_explanation ??
            classification.publicExplanation),
      entrantIds: entrantRows.rows.map((entrant) => entrant.snapshot.entryId),
      ...(row.replay_match_id
        ? {
            replayHref: `/matches/${encodeURIComponent(row.replay_match_id)}/replay`,
          }
        : {}),
      resultHref: `/matchsets/${encodeURIComponent(row.id)}`,
    })
  }
  const entrantByRevision = new Map(
    entries.map((entry) => [entry.strategyRevisionId, entry]),
  )
  const standings: PublicStandingDto[] = [...totals.values()]
    .sort(
      (left, right) =>
        right.points - left.points ||
        right.wins - left.wins ||
        right.survivingSoldiers - left.survivingSoldiers ||
        right.survivalTurns - left.survivalTurns ||
        left.strategyRevisionId.localeCompare(right.strategyRevisionId),
    )
    .map((entry, index) => {
      const entrant = entrantByRevision.get(entry.strategyRevisionId)
      return {
        rank: index + 1,
        entrantId: entrant?.entryId ?? entry.strategyRevisionId,
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
