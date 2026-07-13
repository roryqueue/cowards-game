import { createHash, randomUUID } from "node:crypto"
import {
  classifyCompetitionCountedState,
  competitionGovernanceActionPolicy,
  normalizeCompetitionReportDetail,
  type CompetitionGovernanceAction,
  type CompetitionGovernanceCategory,
  type CompetitionReportCategory,
  type CompetitionReportSubmissionType,
  type LadderMatchSetCountedStatus,
  type LadderNonCountedReason,
  type UserId,
} from "@cowards/spec"
import type { Pool, PoolClient, QueryResultRow } from "pg"
import { withTransaction } from "./db.js"
import type { MatchSetStatus } from "./schema.js"
import {
  recomputeSeasonStandings,
  type EffectiveIntegrityClassification,
} from "./standings-recompute.js"

type Queryable = Pick<Pool | PoolClient, "query">

export class GovernanceInputError extends Error {
  readonly status: number
  readonly retryAfterSeconds?: number | undefined

  constructor(
    message: string,
    options: { status?: number; retryAfterSeconds?: number } = {},
  ) {
    super(message)
    this.name = "GovernanceInputError"
    this.status = options.status ?? 400
    this.retryAfterSeconds = options.retryAfterSeconds
  }
}

export interface CompetitionReportReceipt {
  submissionId: string
  disposition: "created" | "already_open"
  publicMessage: string
}

const reportMessage = (type: CompetitionReportSubmissionType): string =>
  type === "dispute"
    ? "Dispute received. This result is held out of standings while reviewed."
    : "Report received. Reports are reviewed without changing standings automatically."

const executionStatus = (
  status: MatchSetStatus,
): "queued" | "running" | "complete" | "degraded" | "failed" => {
  if (status === "pending") return "queued"
  if (status === "running") return "running"
  if (status === "complete") return "complete"
  if (status === "degraded") return "degraded"
  return "failed"
}

export const submitCompetitionReport = async (
  pool: Pool,
  input: {
    matchSetId: string
    reporterUserId: UserId
    submissionType: CompetitionReportSubmissionType
    category: CompetitionReportCategory
    privateDetail?: unknown
    now?: Date | undefined
  },
): Promise<CompetitionReportReceipt> => {
  const privateDetail = normalizeCompetitionReportDetail(input.privateDetail)
  const now = input.now ?? new Date()
  return withTransaction(pool, async (client) => {
    const reporter = await client.query<{ id: string }>(
      "select id from users where id = $1 for update",
      [input.reporterUserId],
    )
    if (!reporter.rows[0]) {
      throw new GovernanceInputError("Sign in is required.", { status: 401 })
    }

    const target = await client.query<{
      id: string
      status: MatchSetStatus
      ladder_season_id: string | null
      is_entrant: boolean
    }>(
      `
        select ms.id, ms.status, ms.ladder_season_id,
          exists (
            select 1 from competition_entrants ce
            where ce.match_set_id = ms.id and ce.owner_user_id = $2
          ) as is_entrant
        from match_sets ms
        where ms.id = $1
        for update of ms
      `,
      [input.matchSetId, input.reporterUserId],
    )
    const matchSet = target.rows[0]
    if (!matchSet || !matchSet.ladder_season_id) {
      throw new GovernanceInputError("Competition result not found.", {
        status: 404,
      })
    }
    if (
      !["complete", "degraded", "failed_system", "blocked"].includes(
        matchSet.status,
      )
    ) {
      throw new GovernanceInputError(
        "Wait for the MatchSet to reach a result before reporting it.",
        { status: 409 },
      )
    }
    if (input.submissionType === "dispute" && !matchSet.is_entrant) {
      throw new GovernanceInputError(
        "Only an entrant owner can dispute this result.",
        { status: 403 },
      )
    }

    const existing = await client.query<{ id: string }>(
      `
        select id from competition_reports
        where match_set_id = $1 and reporter_user_id = $2
          and submission_type = $3 and category = $4 and status = 'open'
      `,
      [
        input.matchSetId,
        input.reporterUserId,
        input.submissionType,
        input.category,
      ],
    )
    if (existing.rows[0]) {
      return {
        submissionId: existing.rows[0].id,
        disposition: "already_open",
        publicMessage: "An open report already exists for this category.",
      }
    }

    const recent = await client.query<{ count: number }>(
      `
        select count(*)::integer as count from competition_reports
        where reporter_user_id = $1 and created_at >= $2::timestamptz - interval '10 minutes'
      `,
      [input.reporterUserId, now],
    )
    if ((recent.rows[0]?.count ?? 0) >= 5) {
      throw new GovernanceInputError(
        "Report intake is temporarily limited. Please try again shortly.",
        { status: 429, retryAfterSeconds: 600 },
      )
    }

    const submissionId = `competition-report:${randomUUID()}`
    const inserted = await client.query<{ id: string }>(
      `
        insert into competition_reports (
          id, match_set_id, reporter_user_id, submission_type,
          category, private_detail, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (match_set_id, reporter_user_id, submission_type, category)
          where status = 'open' do nothing
        returning id
      `,
      [
        submissionId,
        input.matchSetId,
        input.reporterUserId,
        input.submissionType,
        input.category,
        privateDetail ?? null,
        now,
      ],
    )
    const acceptedId = inserted.rows[0]?.id
    if (!acceptedId) {
      const raced = await client.query<{ id: string }>(
        `select id from competition_reports
         where match_set_id = $1 and reporter_user_id = $2
           and submission_type = $3 and category = $4 and status = 'open'`,
        [
          input.matchSetId,
          input.reporterUserId,
          input.submissionType,
          input.category,
        ],
      )
      return {
        submissionId: raced.rows[0]?.id ?? submissionId,
        disposition: "already_open",
        publicMessage: "An open report already exists for this category.",
      }
    }

    if (input.submissionType === "dispute") {
      const policy = competitionGovernanceActionPolicy(
        "under_review",
        "entrant_dispute",
      )
      await client.query(
        `
          update match_sets set
            counted_status = 'disputed', review_status = 'disputed',
            public_counted_reason = 'disputed',
            public_counted_explanation = $2,
            governance_changed_at = $3
          where id = $1
        `,
        [input.matchSetId, policy.publicExplanation, now],
      )
      await writeCompetitionAuditEvent(client, {
        actorUserId: input.reporterUserId,
        action: "entrant_dispute_opened",
        targetType: "match_set",
        targetId: input.matchSetId,
        beforeState: {},
        afterState: { countedStatus: "disputed", reviewStatus: "disputed" },
        reason: "Entrant submitted a result dispute.",
        publicExplanation: policy.publicExplanation,
        privateNote: privateDetail,
      })
    }

    return {
      submissionId: acceptedId,
      disposition: "created",
      publicMessage: reportMessage(input.submissionType),
    }
  })
}

export const assertAdminUser = async (
  pool: Queryable,
  userId: UserId,
): Promise<void> => {
  const result = await pool.query<{ is_admin: boolean }>(
    "select is_admin from users where id = $1",
    [userId],
  )
  if (result.rows[0]?.is_admin !== true) {
    throw new GovernanceInputError("Admin authorization is required.", {
      status: 403,
    })
  }
}

export const INTEGRITY_COHORT_PREDICATE_VERSION =
  "integrity-cohort-predicate-v1" as const

export interface IntegrityCohortPredicate {
  version: typeof INTEGRITY_COHORT_PREDICATE_VERSION
  operator: "match_set_ids"
  matchSetIds: readonly string[]
}

export interface IntegrityCohortSourceRecord {
  matchSetId: string
  originalClassification: string
  compatibilityTupleId: string | null
  executionEvidenceSetHash: string | null
}

export interface IntegrityCohortPreview {
  predicate: Readonly<IntegrityCohortPredicate>
  count: number
  previewHash: string
  sampleMatchSetIds: readonly string[]
}

export type IntegrityEvidenceReferenceKind =
  | "match_execution"
  | "chronicle"
  | "runtime_failure"
  | "identity_proof"
  | "documentation"

export interface IntegrityEvidenceReference {
  kind: IntegrityEvidenceReferenceKind
  referenceId: string
  sha256: string
}

export interface IntegrityClassificationEventProjection {
  eventId: string
  sequence: number
  predicate: Readonly<IntegrityCohortPredicate>
  classification: EffectiveIntegrityClassification
}

export interface IntegrityCompensationEventProjection {
  compensationEventId: string
  classificationEventId: string
  compensatesEventId: string
}

type StandingsInput = Parameters<typeof recomputeSeasonStandings>[0]

const integrityFramedHash = (domain: string, values: readonly string[]): string => {
  const hash = createHash("sha256")
  hash.update(domain, "utf8")
  hash.update("\0", "utf8")
  for (const value of values) {
    const bytes = Buffer.from(value, "utf8")
    hash.update(String(bytes.byteLength), "utf8")
    hash.update("\0", "utf8")
    hash.update(bytes)
    hash.update("\0", "utf8")
  }
  return hash.digest("hex")
}

const requiredGovernanceText = (value: unknown, label: string): string => {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new GovernanceInputError(`${label} must be a non-empty string.`)
  }
  return value
}

const normalizeIntegrityPredicate = (
  predicate: IntegrityCohortPredicate,
): Readonly<IntegrityCohortPredicate> => {
  if (
    !predicate ||
    predicate.version !== INTEGRITY_COHORT_PREDICATE_VERSION ||
    predicate.operator !== "match_set_ids" ||
    !Array.isArray(predicate.matchSetIds)
  ) {
    throw new GovernanceInputError("Integrity cohort predicate is unsupported.")
  }
  const matchSetIds = predicate.matchSetIds
    .map((id) => requiredGovernanceText(id, "Cohort MatchSet ID"))
    .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
  if (
    matchSetIds.length === 0 ||
    matchSetIds.length > 10_000 ||
    new Set(matchSetIds).size !== matchSetIds.length
  ) {
    throw new GovernanceInputError(
      "Integrity cohort predicate requires 1-10000 unique MatchSet ids.",
    )
  }
  return Object.freeze({
    version: INTEGRITY_COHORT_PREDICATE_VERSION,
    operator: "match_set_ids",
    matchSetIds: Object.freeze(matchSetIds),
  })
}

export const createIntegrityCohortPreview = (
  sourceRecords: readonly IntegrityCohortSourceRecord[],
  rawPredicate: IntegrityCohortPredicate,
): Readonly<IntegrityCohortPreview> => {
  const predicate = normalizeIntegrityPredicate(rawPredicate)
  const byId = new Map(sourceRecords.map((record) => [record.matchSetId, record]))
  const selected = predicate.matchSetIds.map((id) => {
    const record = byId.get(id)
    if (!record) {
      throw new GovernanceInputError(
        "Integrity cohort predicate did not resolve every exact MatchSet.",
        { status: 409 },
      )
    }
    return record
  })
  const previewHash = integrityFramedHash(
    "cowards-game:integrity-cohort-preview:v1",
    [
      predicate.version,
      predicate.operator,
      ...selected.flatMap((record) => [
        record.matchSetId,
        record.originalClassification,
        record.compatibilityTupleId ?? "<null>",
        record.executionEvidenceSetHash ?? "<null>",
      ]),
    ],
  )
  return Object.freeze({
    predicate,
    count: selected.length,
    previewHash,
    sampleMatchSetIds: Object.freeze(
      selected.slice(0, 20).map((record) => record.matchSetId),
    ),
  })
}

const normalizeEvidenceReferences = (
  references: readonly IntegrityEvidenceReference[],
): readonly Readonly<IntegrityEvidenceReference>[] => {
  if (!Array.isArray(references) || references.length === 0 || references.length > 100) {
    throw new GovernanceInputError(
      "A reproducible integrity evidence reference is required.",
    )
  }
  const normalized = references.map((reference) => {
    if (
      !reference ||
      ![
        "match_execution",
        "chronicle",
        "runtime_failure",
        "identity_proof",
        "documentation",
      ].includes(reference.kind) ||
      !/^[0-9a-f]{64}$/u.test(reference.sha256)
    ) {
      throw new GovernanceInputError("Integrity evidence reference is malformed.")
    }
    return Object.freeze({
      kind: reference.kind,
      referenceId: requiredGovernanceText(
        reference.referenceId,
        "Integrity evidence reference ID",
      ),
      sha256: reference.sha256,
    })
  })
  if (normalized.every((reference) => reference.kind === "documentation")) {
    throw new GovernanceInputError(
      "Documentation alone is not reproducible Match integrity evidence.",
    )
  }
  return Object.freeze(
    normalized.sort(
      (left, right) =>
        left.kind.localeCompare(right.kind) ||
        left.referenceId.localeCompare(right.referenceId) ||
        left.sha256.localeCompare(right.sha256),
    ),
  )
}

const hashEvidenceReferences = (
  references: readonly Readonly<IntegrityEvidenceReference>[],
): string =>
  integrityFramedHash(
    "cowards-game:integrity-evidence-references:v1",
    references.flatMap((reference) => [
      reference.kind,
      reference.referenceId,
      reference.sha256,
    ]),
  )

const assertPreviewEqual = (
  expected: IntegrityCohortPreview,
  actual: IntegrityCohortPreview,
): void => {
  if (
    expected.previewHash !== actual.previewHash ||
    expected.count !== actual.count ||
    JSON.stringify(expected.sampleMatchSetIds) !==
      JSON.stringify(actual.sampleMatchSetIds) ||
    JSON.stringify(normalizeIntegrityPredicate(expected.predicate)) !==
      JSON.stringify(actual.predicate)
  ) {
    throw new GovernanceInputError(
      "Integrity cohort preview drifted; preview again before applying.",
      { status: 409 },
    )
  }
}

const loadIntegrityCohortSources = async (
  pool: Queryable,
  predicate: IntegrityCohortPredicate,
  lock: boolean,
): Promise<IntegrityCohortSourceRecord[]> => {
  const normalized = normalizeIntegrityPredicate(predicate)
  const rows = await pool.query<{
    id: string
    counted_status: string
    compatibility_tuple_id: string | null
    execution_evidence_set_hash: string | null
  }>(
    `select id, counted_status, compatibility_tuple_id,
            execution_evidence_set_hash
       from match_sets
      where id = any($1::text[])
      order by id${lock ? " for update" : ""}`,
    [normalized.matchSetIds],
  )
  return rows.rows.map((row) => ({
    matchSetId: row.id,
    originalClassification: row.counted_status,
    compatibilityTupleId: row.compatibility_tuple_id,
    executionEvidenceSetHash: row.execution_evidence_set_hash,
  }))
}

export const previewIntegrityCohortClassification = async (
  pool: Queryable,
  predicate: IntegrityCohortPredicate,
): Promise<Readonly<IntegrityCohortPreview>> =>
  createIntegrityCohortPreview(
    await loadIntegrityCohortSources(pool, predicate, false),
    predicate,
  )

const sequenceFromEventId = (eventId: string): number => {
  const match = /^integrity-classification:(\d+):/u.exec(eventId)
  if (!match) throw new GovernanceInputError("Integrity event sequence is malformed.")
  const sequence = Number(match[1])
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new GovernanceInputError("Integrity event sequence is invalid.")
  }
  return sequence
}

const nextIntegritySequence = async (client: Queryable): Promise<number> => {
  const result = await client.query<{ id: string }>(
    "select id from integrity_cohort_classification_events order by id desc limit 1",
  )
  return result.rows[0] ? sequenceFromEventId(result.rows[0].id) + 1 : 1
}

const loadIntegrityEventFold = async (client: Queryable): Promise<{
  events: IntegrityClassificationEventProjection[]
  compensations: IntegrityCompensationEventProjection[]
}> => {
  const events = await client.query<{
    id: string
    predicate: unknown
    classification: EffectiveIntegrityClassification
  }>(
    "select id, predicate, classification from integrity_cohort_classification_events order by id",
  )
  const compensations = await client.query<{
    id: string
    classification_event_id: string
    compensates_event_id: string
  }>(
    "select id, classification_event_id, compensates_event_id from integrity_compensation_events order by id",
  )
  return {
    events: events.rows.map((row) => {
      const envelope = row.predicate as { ast?: IntegrityCohortPredicate }
      return {
        eventId: row.id,
        sequence: sequenceFromEventId(row.id),
        predicate: normalizeIntegrityPredicate(envelope.ast ?? (row.predicate as IntegrityCohortPredicate)),
        classification: row.classification,
      }
    }),
    compensations: compensations.rows.map((row) => ({
      compensationEventId: row.id,
      classificationEventId: row.classification_event_id,
      compensatesEventId: row.compensates_event_id,
    })),
  }
}

export const foldEffectiveIntegrityClassifications = (
  events: readonly IntegrityClassificationEventProjection[],
  compensations: readonly IntegrityCompensationEventProjection[],
): Readonly<Record<string, EffectiveIntegrityClassification>> => {
  const compensated = new Set(
    compensations.map((event) => event.compensatesEventId),
  )
  const effective = Object.create(null) as Record<
    string,
    EffectiveIntegrityClassification
  >
  for (const event of [...events].sort((left, right) => left.sequence - right.sequence)) {
    if (compensated.has(event.eventId)) continue
    const predicate = normalizeIntegrityPredicate(event.predicate)
    for (const matchSetId of predicate.matchSetIds) {
      effective[matchSetId] = event.classification
    }
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(effective).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  )
}

const appendIntegrityClassification = async (
  client: Queryable,
  input: {
    sequence: number
    preview: IntegrityCohortPreview
    adminUserId: UserId
    classification: EffectiveIntegrityClassification
    reason: string
    evidenceReferences: readonly Readonly<IntegrityEvidenceReference>[]
  },
): Promise<IntegrityClassificationEventProjection> => {
  const evidenceHash = hashEvidenceReferences(input.evidenceReferences)
  const eventHash = integrityFramedHash(
    "cowards-game:integrity-classification-event:v1",
    [
      String(input.sequence),
      input.preview.previewHash,
      evidenceHash,
      input.classification,
      input.reason,
      input.adminUserId,
    ],
  )
  const eventId = `integrity-classification:${String(input.sequence).padStart(20, "0")}:${eventHash}`
  await client.query(
    `insert into integrity_cohort_classification_events (
       id, predicate_version, predicate, preview_hash, preview_count,
       evidence_hash, classification, reason, actor_user_id
     ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      eventId,
      input.preview.predicate.version,
      {
        ast: input.preview.predicate,
        sampleMatchSetIds: input.preview.sampleMatchSetIds,
        evidenceReferences: input.evidenceReferences,
      },
      input.preview.previewHash,
      input.preview.count,
      evidenceHash,
      input.classification,
      input.reason,
      input.adminUserId,
    ],
  )
  return Object.freeze({
    eventId,
    sequence: input.sequence,
    predicate: input.preview.predicate,
    classification: input.classification,
  })
}

export const applyIntegrityCohortClassification = async (
  pool: Pool,
  input: {
    preview: IntegrityCohortPreview
    adminUserId: UserId
    classification: EffectiveIntegrityClassification
    reason: string
    evidenceReferences: readonly IntegrityEvidenceReference[]
    standingsInput: StandingsInput
  },
) => {
  const references = normalizeEvidenceReferences(input.evidenceReferences)
  const reason = requiredGovernanceText(input.reason.trim(), "Integrity finding reason")
  return withTransaction(pool, async (client) => {
    await assertAdminUser(client, input.adminUserId)
    await client.query("select pg_advisory_xact_lock(hashtext('cowards-game:integrity-cohort-governance:v1'))")
    const current = createIntegrityCohortPreview(
      await loadIntegrityCohortSources(client, input.preview.predicate, true),
      input.preview.predicate,
    )
    assertPreviewEqual(input.preview, current)
    const event = await appendIntegrityClassification(client, {
      sequence: await nextIntegritySequence(client),
      preview: current,
      adminUserId: input.adminUserId,
      classification: input.classification,
      reason,
      evidenceReferences: references,
    })
    const fold = await loadIntegrityEventFold(client)
    const effectiveIntegrityClassifications =
      foldEffectiveIntegrityClassifications(fold.events, fold.compensations)
    const standings = recomputeSeasonStandings({
      ...input.standingsInput,
      effectiveIntegrityClassifications,
    })
    return Object.freeze({ event, effectiveIntegrityClassifications, standings })
  })
}

export const compensateIntegrityCohortClassification = async (
  pool: Pool,
  input: {
    preview: IntegrityCohortPreview
    adminUserId: UserId
    compensatesEventId: string
    restoredClassification: EffectiveIntegrityClassification
    reason: string
    evidenceReferences: readonly IntegrityEvidenceReference[]
    standingsInput: StandingsInput
  },
) => {
  const references = normalizeEvidenceReferences(input.evidenceReferences)
  const reason = requiredGovernanceText(input.reason.trim(), "Compensation reason")
  return withTransaction(pool, async (client) => {
    await assertAdminUser(client, input.adminUserId)
    await client.query("select pg_advisory_xact_lock(hashtext('cowards-game:integrity-cohort-governance:v1'))")
    const target = await client.query<{
      id: string
      predicate: unknown
    }>(
      "select id, predicate from integrity_cohort_classification_events where id = $1 for update",
      [input.compensatesEventId],
    )
    const targetRow = target.rows[0]
    if (!targetRow) {
      throw new GovernanceInputError("Compensated integrity event was not found.", {
        status: 404,
      })
    }
    const priorCompensation = await client.query<{ id: string }>(
      "select id from integrity_compensation_events where compensates_event_id = $1",
      [input.compensatesEventId],
    )
    if (priorCompensation.rows[0]) {
      throw new GovernanceInputError("Integrity event was already compensated.", {
        status: 409,
      })
    }
    const envelope = targetRow.predicate as { ast?: IntegrityCohortPredicate }
    const predicate = normalizeIntegrityPredicate(
      envelope.ast ?? (targetRow.predicate as IntegrityCohortPredicate),
    )
    const current = createIntegrityCohortPreview(
      await loadIntegrityCohortSources(client, predicate, true),
      predicate,
    )
    assertPreviewEqual(input.preview, current)
    const sequence = await nextIntegritySequence(client)
    const event = await appendIntegrityClassification(client, {
      sequence,
      preview: current,
      adminUserId: input.adminUserId,
      classification: input.restoredClassification,
      reason,
      evidenceReferences: references,
    })
    const compensationHash = integrityFramedHash(
      "cowards-game:integrity-compensation-event:v1",
      [event.eventId, input.compensatesEventId, hashEvidenceReferences(references), reason],
    )
    const compensationEventId = `integrity-compensation:${String(sequence).padStart(20, "0")}:${compensationHash}`
    await client.query(
      `insert into integrity_compensation_events (
         id, classification_event_id, compensates_event_id,
         evidence_hash, reason, actor_user_id
       ) values ($1, $2, $3, $4, $5, $6)`,
      [
        compensationEventId,
        event.eventId,
        input.compensatesEventId,
        hashEvidenceReferences(references),
        reason,
        input.adminUserId,
      ],
    )
    const fold = await loadIntegrityEventFold(client)
    const effectiveIntegrityClassifications =
      foldEffectiveIntegrityClassifications(fold.events, fold.compensations)
    const standings = recomputeSeasonStandings({
      ...input.standingsInput,
      effectiveIntegrityClassifications,
    })
    return Object.freeze({
      event,
      compensation: Object.freeze({
        compensationEventId,
        classificationEventId: event.eventId,
        compensatesEventId: input.compensatesEventId,
      }),
      effectiveIntegrityClassifications,
      standings,
    })
  })
}

interface GovernanceTarget extends QueryResultRow {
  id: string
  status: MatchSetStatus
  ladder_season_id: string | null
  counted_status: LadderMatchSetCountedStatus
  review_status: "none" | "under_review" | "disputed" | "resolved"
  scoring_available: boolean
  match_count: number
  chronicle_count: number
}

export const applyCompetitionGovernanceAction = async (
  pool: Pool,
  input: {
    matchSetIds: string[]
    adminUserId: UserId
    action: CompetitionGovernanceAction
    category: CompetitionGovernanceCategory
    privateReason: string
    now?: Date | undefined
  },
): Promise<void> => {
  if (
    input.action === "counted" ||
    input.action === "non_counted" ||
    input.action === "invalid" ||
    input.action === "invalidated"
  ) {
    throw new GovernanceInputError(
      "Integrity correction requires an exact cohort preview, reproducible evidence, and append-only classification service.",
      { status: 409 },
    )
  }
  const ids = [...new Set(input.matchSetIds)].sort()
  if (
    !ids.length ||
    ids.length > 100 ||
    ids.length !== input.matchSetIds.length
  ) {
    throw new GovernanceInputError("Provide 1-100 unique MatchSet ids.")
  }
  const privateReason = input.privateReason.trim()
  if (privateReason.length < 3 || privateReason.length > 1000) {
    throw new GovernanceInputError(
      "A private reason of 3-1000 characters is required.",
    )
  }
  const policy = competitionGovernanceActionPolicy(input.action, input.category)
  const now = input.now ?? new Date()

  await withTransaction(pool, async (client) => {
    await assertAdminUser(client, input.adminUserId)
    const targets: GovernanceTarget[] = []
    for (const id of ids) {
      const result = await client.query<GovernanceTarget>(
        `
          select ms.id, ms.status, ms.ladder_season_id, ms.counted_status,
            ms.review_status, (ms.scoring is not null) as scoring_available,
            (select count(*)::integer from match_set_matches msm where msm.match_set_id = ms.id) as match_count,
            (select count(*)::integer from match_set_matches msm join chronicles c on c.match_id = msm.match_id where msm.match_set_id = ms.id) as chronicle_count
          from match_sets ms where ms.id = $1 for update of ms
        `,
        [id],
      )
      const target = result.rows[0]
      if (!target || !target.ladder_season_id) {
        throw new GovernanceInputError(
          "Every target must be a trial MatchSet.",
          {
            status: 404,
          },
        )
      }
      if (input.action === "counted") {
        const counted = classifyCompetitionCountedState({
          executionStatus: executionStatus(target.status),
          storedState: "counted",
          reviewState: "resolved",
          origin: "trial",
          expectedMatchCount: target.match_count,
          chronicleMatchCount: target.chronicle_count,
          scoringAvailable: target.scoring_available,
        })
        if (counted.state !== "counted") {
          throw new GovernanceInputError(
            "Complete scoring and replay evidence are required before counting this result.",
            { status: 409 },
          )
        }
      }
      targets.push(target)
    }

    for (const target of targets) {
      const reviewStatus =
        input.action === "under_review" ? "under_review" : "resolved"
      await client.query(
        `
          update match_sets set counted_status = $2, review_status = $3,
            public_counted_reason = $4, public_counted_explanation = $5,
            governance_changed_at = $6 where id = $1
        `,
        [
          target.id,
          input.action,
          reviewStatus,
          policy.publicReason ?? null,
          policy.publicExplanation,
          now,
        ],
      )
      await writeCompetitionAuditEvent(client, {
        actorUserId: input.adminUserId,
        action: "match_set_governance_changed",
        targetType: "match_set",
        targetId: target.id,
        beforeState: {
          countedStatus: target.counted_status,
          reviewStatus: target.review_status,
        },
        afterState: { countedStatus: input.action, reviewStatus },
        reason: privateReason,
        publicExplanation: policy.publicExplanation,
        privateNote: privateReason,
      })
    }
  })
}

export const flagMatchSetResult = async (
  pool: Pool,
  input: { matchSetId: string; userId: UserId; note: string },
): Promise<string> =>
  (
    await submitCompetitionReport(pool, {
      matchSetId: input.matchSetId,
      reporterUserId: input.userId,
      submissionType: "dispute",
      category: "result_integrity",
      privateDetail: input.note,
    })
  ).submissionId

export const markMatchSetGovernanceStatus = async (
  pool: Pool,
  input: {
    matchSetId: string
    adminUserId: UserId
    countedStatus: Extract<
      LadderMatchSetCountedStatus,
      "counted" | "invalid" | "non_competitive" | "non_counted"
    >
    publicReason?: LadderNonCountedReason | undefined
    reason: string
    publicExplanation: string
    privateNote?: string | undefined
  },
): Promise<void> => {
  const category: CompetitionGovernanceCategory =
    input.countedStatus === "counted"
      ? "review_resolved_counted"
      : input.countedStatus === "invalid"
        ? "result_invalid"
        : input.countedStatus === "non_competitive"
          ? "competition_policy"
          : "evidence_incomplete"
  await applyCompetitionGovernanceAction(pool, {
    matchSetIds: [input.matchSetId],
    adminUserId: input.adminUserId,
    action: input.countedStatus,
    category,
    privateReason: input.privateNote ?? input.reason,
  })
}

export const writeCompetitionAuditEvent = async (
  pool: Queryable,
  input: {
    actorUserId?: UserId | undefined
    action: string
    targetType: string
    targetId: string
    beforeState: unknown
    afterState: unknown
    reason: string
    publicExplanation?: string | undefined
    privateNote?: string | undefined
  },
): Promise<void> => {
  await pool.query(
    `
      insert into competition_audit_events (
        id, actor_user_id, action, target_type, target_id,
        before_state, after_state, reason, public_explanation, private_note
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      `audit:${randomUUID()}`,
      input.actorUserId ?? null,
      input.action,
      input.targetType,
      input.targetId,
      input.beforeState,
      input.afterState,
      input.reason,
      input.publicExplanation ?? null,
      input.privateNote ?? null,
    ],
  )
}
