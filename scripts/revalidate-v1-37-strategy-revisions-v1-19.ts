import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  STRATEGY_RUNTIME_ABI_VERSION,
  SoldierBrainResultSchema,
  StrategyResultSchema,
  encodeCanonicalJson,
  type JsonValue,
} from "@cowards/spec"
// Candidate transport remains intentionally inactive until Plan 260-14.
// eslint-disable-next-line no-restricted-imports
import {
  createCandidateObservationTransportRequestV119,
  type CandidateObservationTransportResultV119,
} from "../packages/runtime-js/src/revision-v1-19.js"
// Plan 260-26 is the runtime-service-owned revalidation boundary.
// eslint-disable-next-line no-restricted-imports
import {
  REQUIRED_REVISION_REVALIDATION_PROBES_V1_19,
  revalidateStrategyRevisionV119,
  type RealProviderRevalidationExecutionInputV119,
  type RevisionRevalidationCandidatePinsV119,
  type RevisionRevalidationProbeV119,
  type StrategyRevisionRevalidationReceiptV119,
  type StrategyRevisionRevalidationResultV119,
} from "../apps/runtime-service/src/revalidate-strategy-revision-v1-19.js"
// The worker is the existing real TypeScript guest lane, not a script evaluator.
// eslint-disable-next-line no-restricted-imports
import { workerThreadStrategyExecutionAdapter } from "../packages/runtime-js/src/worker-thread-adapter.js"
// Plan 260-04 owns the append-only persistence API consumed here.
// eslint-disable-next-line no-restricted-imports
import {
  createRepositories,
  type Queryable,
  type StrategyRevisionV119Admission,
  type StrategyRevisionV119RevalidationInput,
} from "../packages/persistence/src/repositories.js"
// Database construction stays in the persistence package.
// eslint-disable-next-line no-restricted-imports
import { createDatabasePool } from "../packages/persistence/src/db.js"

type Sha256 = `sha256:${string}`
type SupportedLanguage = "typescript" | "python" | "rust" | "zig"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const outputPath = path.join(
  repoRoot,
  ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
)
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const SOURCE_HASH = /^[0-9a-f]{64}$/u
const PRE_V119_INVENTORY_QUERY = `
  select id, source, source_hash, source_bytes, runtime, metadata,
         compiled_artifact, locked_at, created_at
    from strategy_revisions
   where runtime->>'abiVersion' is distinct from 'strategy-runtime-abi-v1.19'
   order by id
   for share
`

const authorityByLanguage = Object.freeze({
  typescript: Object.freeze({
    providerId: "strategy-language-provider-js-ts",
    laneId: "lane:typescript:v1.19",
  }),
  python: Object.freeze({
    providerId: "strategy-language-provider-python",
    laneId: "lane:python:v1.19",
  }),
  rust: Object.freeze({
    providerId: "strategy-language-provider-rust-wasi",
    laneId: "lane:rust:v1.19",
  }),
  zig: Object.freeze({
    providerId: "strategy-language-provider-zig-wasi",
    laneId: "lane:zig:v1.19",
  }),
} as const)

const candidateFileByLanguage = Object.freeze({
  typescript:
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
  python:
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
  rust: ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
  zig: ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
} as const)

export interface StrategyRevisionInventoryDatabaseRowV119 {
  readonly id: string
  readonly source: string
  readonly source_hash: string
  readonly source_bytes: number
  readonly runtime: unknown
  readonly metadata: unknown
  readonly compiled_artifact: unknown
  readonly locked_at: Date | string | null
  readonly created_at: Date | string
}

export interface FrozenStrategyRevisionInventoryRowV119 {
  readonly strategyRevisionId: string
  readonly createdAt: string
  readonly lockedAt: string | null
  readonly immutable: boolean
  readonly priorRuntimeAbiVersion: string
  readonly languageId: string
  readonly providerId: string | null
  readonly laneId: string | null
  readonly sourceHash: string
  readonly sourceBytes: number
  readonly artifactSha256: Sha256 | null
  readonly artifactBytes: number | null
  readonly identityValid: boolean
}

export interface FrozenStrategyRevisionInventoryV119 {
  readonly schemaVersion: "v1.37-pre-v1.19-strategy-revision-inventory-v1"
  readonly count: number
  readonly rootSha256: Sha256
  readonly rows: readonly Readonly<FrozenStrategyRevisionInventoryRowV119>[]
}

interface ArtifactRecordBase {
  readonly strategyRevisionId: string
  readonly sourceHash: string
  readonly sourceBytes: number
  readonly artifactSha256: Sha256 | null
  readonly artifactBytes: number | null
  readonly languageId: string
  readonly providerId: string | null
  readonly laneId: string | null
}

interface RevalidatedArtifactRecord extends ArtifactRecordBase {
  readonly outcome: "revalidated"
  readonly countedCandidateEligible: true
  readonly revalidationId: string
  readonly executionRequestRoot: Sha256
  readonly executionResultRoot: Sha256
  readonly executionEvidenceRoot: Sha256
  readonly executionReceiptRoot: Sha256
}

interface NonCountedArtifactRecord extends ArtifactRecordBase {
  readonly outcome: "non_counted"
  readonly countedCandidateEligible: false
  readonly dispositionCode:
    | "REVISION_NOT_IMMUTABLE"
    | "REVISION_IDENTITY_INVALID"
    | "REAL_CANDIDATE_LANE_UNAVAILABLE"
    | "PLAYER_VIOLATION"
    | "SYSTEM_FAILURE"
  readonly retryable: boolean
}

export type StrategyRevisionRevalidationArtifactRecordV119 =
  | RevalidatedArtifactRecord
  | NonCountedArtifactRecord

export interface StrategyRevisionRevalidationArtifactV119 {
  readonly schemaVersion: "v1.37-observation-v1.19-strategy-revision-revalidation-v1"
  readonly status: "complete_inactive_candidate"
  readonly current: false
  readonly selectorActivated: false
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly semanticRuntimeVersion: "runtime-v1.19"
  readonly semanticTupleId: string
  readonly executionKind: "real_service_execution_or_explicit_non_counted"
  readonly inventory: Readonly<{
    count: number
    rootSha256: Sha256
  }>
  readonly candidatePinSet: Readonly<{
    corpusVersion: "v3"
    corpusRootSha256: Sha256
    traceVersion: "v4"
    traceRootSha256: Sha256
    workshopVersion: "v1.19"
    workshopRootSha256: Sha256
    certificates: readonly Readonly<{
      languageId: SupportedLanguage
      certificateId: string
      certificateSha256: Sha256
      providerId: string
      laneId: string
    }>[]
  }>
  readonly records: readonly Readonly<StrategyRevisionRevalidationArtifactRecordV119>[]
  readonly totals: Readonly<{
    revalidated: number
    nonCounted: number
  }>
  readonly privacy: Readonly<{
    publicSafe: true
    sourceBytesIncluded: false
    artifactBytesIncluded: false
    memoriesIncluded: false
    objectivesIncluded: false
    diagnosticsIncluded: false
    hostDataIncluded: false
  }>
}

interface CandidateFile {
  readonly status: "reviewed_unsigned_candidate"
  readonly languageId: SupportedLanguage
  readonly candidatePayloadSha256: Sha256
  readonly candidateBindings: {
    readonly corpus: {
      readonly version: "v3"
      readonly rootSha256: Sha256
      readonly pinFileSha256: Sha256
      readonly current: false
    }
    readonly trace: {
      readonly rootSha256: Sha256
      readonly pinFileSha256: Sha256
      readonly current: false
    }
    readonly workshop: {
      readonly rootSha256: Sha256
      readonly pinFileSha256: Sha256
      readonly current: false
    }
    readonly semanticTuple: {
      readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
      readonly tupleId: string
      readonly current: false
    }
  }
  readonly candidatePayload: {
    readonly certificateVersion: "runtime-conformance-certificate-v1.19"
    readonly certificateId: string
    readonly status: "inactive-candidate"
    readonly identity: {
      readonly languageId: SupportedLanguage
      readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
      readonly runtimeExecutableSha256: Sha256
      readonly toolchainSha256: Sha256
      readonly adapterBuildSha256: Sha256
      readonly containmentPolicySha256: Sha256
    }
  }
}

const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: JsonValue): Uint8Array => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok)
    throw new TypeError("Revalidation value is not canonical JSON")
  return encoded.bytes
}

const canonicalHash = (domain: string, value: JsonValue): Sha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(`cowards-game:${domain}:v1.19\0`, "utf8"),
      Buffer.from(canonicalBytes(value)),
    ]),
  )

const record = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null

const iso = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.valueOf()))
    throw new TypeError("Invalid revision timestamp")
  return date.toISOString()
}

const supportedLanguage = (value: unknown): value is SupportedLanguage =>
  value === "typescript" ||
  value === "python" ||
  value === "rust" ||
  value === "zig"

const artifactFor = (
  row: StrategyRevisionInventoryDatabaseRowV119,
  languageId: string,
): { bytes: Uint8Array; sha256: Sha256 } | null => {
  const metadata = record(row.metadata)
  const artifact = record(
    languageId === "typescript" || languageId === "python"
      ? metadata?.sourceArtifact
      : (record(row.compiled_artifact) ?? metadata?.compiledArtifact),
  )
  if (
    artifact === null ||
    typeof artifact.bytesBase64 !== "string" ||
    typeof artifact.hash !== "string" ||
    typeof artifact.bytes !== "number" ||
    !SOURCE_HASH.test(artifact.hash)
  ) {
    return null
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  if (
    bytes.byteLength !== artifact.bytes ||
    sha256(bytes) !== `sha256:${artifact.hash}`
  ) {
    return null
  }
  return { bytes, sha256: `sha256:${artifact.hash}` }
}

export const freezePreV119StrategyRevisionInventory = (
  databaseRows: readonly StrategyRevisionInventoryDatabaseRowV119[],
): Readonly<FrozenStrategyRevisionInventoryV119> => {
  const ids = new Set<string>()
  const rows = databaseRows
    .map((databaseRow): FrozenStrategyRevisionInventoryRowV119 => {
      if (ids.has(databaseRow.id))
        throw new TypeError("Duplicate Strategy Revision inventory row")
      ids.add(databaseRow.id)
      const runtime = record(databaseRow.runtime)
      const language = record(runtime?.language)
      const languageId =
        typeof language?.id === "string" ? language.id : "unknown"
      const priorRuntimeAbiVersion =
        typeof runtime?.abiVersion === "string" ? runtime.abiVersion : "unknown"
      if (priorRuntimeAbiVersion === "strategy-runtime-abi-v1.19") {
        throw new TypeError("Frozen inventory cannot contain a v1.19 revision")
      }
      const authority = supportedLanguage(languageId)
        ? authorityByLanguage[languageId]
        : undefined
      const artifact = artifactFor(databaseRow, languageId)
      const sourceBytes = Buffer.from(databaseRow.source, "utf8")
      const identityValid =
        SOURCE_HASH.test(databaseRow.source_hash) &&
        databaseRow.source_hash === sha256(sourceBytes).slice(7) &&
        databaseRow.source_bytes === sourceBytes.byteLength &&
        artifact !== null
      return {
        strategyRevisionId: databaseRow.id,
        createdAt: iso(databaseRow.created_at),
        lockedAt:
          databaseRow.locked_at === null ? null : iso(databaseRow.locked_at),
        immutable: databaseRow.locked_at !== null,
        priorRuntimeAbiVersion,
        languageId,
        providerId: authority?.providerId ?? null,
        laneId: authority?.laneId ?? null,
        sourceHash: databaseRow.source_hash,
        sourceBytes: databaseRow.source_bytes,
        artifactSha256: artifact?.sha256 ?? null,
        artifactBytes: artifact?.bytes.byteLength ?? null,
        identityValid,
      }
    })
    .sort((left, right) =>
      left.strategyRevisionId.localeCompare(right.strategyRevisionId),
    )
  const rootSha256 = canonicalHash(
    "pre-v1.19-strategy-revision-inventory",
    rows as unknown as JsonValue,
  )
  return Object.freeze({
    schemaVersion: "v1.37-pre-v1.19-strategy-revision-inventory-v1",
    count: rows.length,
    rootSha256,
    rows: Object.freeze(rows.map((row) => Object.freeze(row))),
  })
}

const loadCandidateFile = (languageId: SupportedLanguage): CandidateFile => {
  const parsed = JSON.parse(
    readFileSync(
      path.join(repoRoot, candidateFileByLanguage[languageId]),
      "utf8",
    ),
  ) as CandidateFile
  const authority = authorityByLanguage[languageId]
  if (
    parsed.status !== "reviewed_unsigned_candidate" ||
    parsed.languageId !== languageId ||
    parsed.candidatePayload.status !== "inactive-candidate" ||
    parsed.candidatePayload.certificateVersion !==
      "runtime-conformance-certificate-v1.19" ||
    parsed.candidatePayload.identity.languageId !== languageId ||
    parsed.candidatePayload.identity.runtimeAbiVersion !==
      "strategy-runtime-abi-v1.19" ||
    parsed.candidateBindings.corpus.version !== "v3" ||
    parsed.candidateBindings.corpus.current !== false ||
    parsed.candidateBindings.trace.current !== false ||
    parsed.candidateBindings.workshop.current !== false ||
    parsed.candidateBindings.semanticTuple.current !== false ||
    parsed.candidateBindings.semanticTuple.tupleId !==
      CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID ||
    parsed.candidateBindings.semanticTuple.runtimeAbiVersion !==
      "strategy-runtime-abi-v1.19" ||
    ![
      parsed.candidatePayloadSha256,
      parsed.candidateBindings.corpus.rootSha256,
      parsed.candidateBindings.corpus.pinFileSha256,
      parsed.candidateBindings.trace.rootSha256,
      parsed.candidateBindings.trace.pinFileSha256,
      parsed.candidateBindings.workshop.rootSha256,
      parsed.candidateBindings.workshop.pinFileSha256,
      parsed.candidatePayload.identity.runtimeExecutableSha256,
      parsed.candidatePayload.identity.toolchainSha256,
      parsed.candidatePayload.identity.adapterBuildSha256,
      parsed.candidatePayload.identity.containmentPolicySha256,
    ].every((value) => SHA256.test(value)) ||
    authority.providerId.length === 0
  ) {
    throw new TypeError(`Invalid inactive ${languageId} candidate authority`)
  }
  return parsed
}

const pinsFor = (
  languageId: SupportedLanguage,
): RevisionRevalidationCandidatePinsV119 => {
  const candidate = loadCandidateFile(languageId)
  const authority = authorityByLanguage[languageId]
  return {
    candidateStatus: "inactive-candidate",
    current: false,
    pinSource: "explicit-candidate-pins",
    resolvedFromCurrentRegistry: false,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    semanticRuntimeVersion: "runtime-v1.19",
    semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
    corpusVersion: "v3",
    corpusRootSha256: candidate.candidateBindings.corpus.rootSha256,
    corpusPinSha256: candidate.candidateBindings.corpus.pinFileSha256,
    traceVersion: "v4",
    traceRootSha256: candidate.candidateBindings.trace.rootSha256,
    tracePinSha256: candidate.candidateBindings.trace.pinFileSha256,
    workshopVersion: "v1.19",
    workshopRootSha256: candidate.candidateBindings.workshop.rootSha256,
    workshopPinSha256: candidate.candidateBindings.workshop.pinFileSha256,
    certificateVersion: "runtime-conformance-certificate-v1.19",
    certificateId: candidate.candidatePayload.certificateId,
    certificateSha256: candidate.candidatePayloadSha256,
    certificateStatus: "reviewed-inactive-candidate",
    certificateLanguageId: languageId,
    certificateProviderId: authority.providerId,
    certificateLaneId: authority.laneId,
    runtimeIdentityRoot:
      candidate.candidatePayload.identity.runtimeExecutableSha256,
    toolchainIdentityRoot: candidate.candidatePayload.identity.toolchainSha256,
    adapterIdentityRoot: candidate.candidatePayload.identity.adapterBuildSha256,
    containmentEvidenceRoot:
      candidate.candidatePayload.identity.containmentPolicySha256,
  }
}

const soldier = Object.freeze({
  id: "soldier:bottom:1",
  ownerPlayerId: "player:bottom",
  status: "ACTIVE" as const,
  position: Object.freeze({ x: 4, y: 9 }),
  facing: "UP" as const,
  lastSuccessfulMoveDirection: null,
})

const strategyInput = (
  hasInitialInitiative: boolean,
  hasRoundInitiative: boolean,
) => ({
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [soldier],
    terrainStones: [],
  },
  mySoldiers: [soldier],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: hasInitialInitiative
    ? "player:bottom"
    : "player:top",
  hasInitialInitiative,
  roundInitiativePlayerId: hasRoundInitiative ? "player:bottom" : "player:top",
  hasRoundInitiative,
})

const brainInput = (hasAdvancedThisActivation: boolean) => ({
  self: soldier,
  awarenessGrid: {
    cells: [-2, -1, 0, 1, 2].flatMap((dy) =>
      [-2, -1, 0, 1, 2].map((dx) => ({
        dx,
        dy,
        absoluteX: 4 + dx,
        absoluteY: 9 + dy,
        contents: "EMPTY" as const,
      })),
    ),
  },
  cycleIndex: hasAdvancedThisActivation ? 1 : 0,
  maxCycles: 12,
  soldierMemory: null,
  hasAdvancedThisActivation,
})

const probes = (): readonly RevisionRevalidationProbeV119[] => [
  ...(
    [
      ["select-initial-false-round-false", false, false],
      ["select-initial-false-round-true", false, true],
      ["select-initial-true-round-false", true, false],
      ["select-initial-true-round-true", true, true],
    ] as const
  ).map(([probeId, initial, round]) => ({
    probeId,
    request: createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: `effect:revision-revalidation:${probeId}`,
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      entrantPlayerIds: ["player:bottom", "player:top"],
      observingPlayerId: "player:bottom",
      input: strategyInput(initial, round),
    }),
  })),
  ...([false, true] as const).map((advanced) => {
    const probeId = advanced ? "brain-advanced-true" : "brain-advanced-false"
    return {
      probeId,
      request: createCandidateObservationTransportRequestV119({
        method: "soldierBrain",
        kernelRequestId: `effect:revision-revalidation:${probeId}`,
        semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        entrantPlayerIds: ["player:bottom", "player:top"],
        observingPlayerId: "player:bottom",
        input: brainInput(advanced),
      }),
    } as RevisionRevalidationProbeV119
  }),
]

const providerEvidence = (
  input: RealProviderRevalidationExecutionInputV119,
  output: JsonValue,
) => {
  const resultRoot = canonicalHash("revision-provider-result", {
    probeId: input.probeId,
    output,
  })
  const evidenceRoot = canonicalHash("revision-provider-evidence", {
    strategyRevisionId: input.revision.strategyRevisionId,
    sourceHash: input.revision.sourceHash,
    artifactSha256: input.revision.artifactSha256,
    languageId: input.revision.languageId,
    providerId: input.revision.providerId,
    laneId: input.revision.laneId,
    candidatePinsRoot: input.candidatePinsRoot,
    probeId: input.probeId,
    method: input.observation.method,
    inputSha256: input.inputSha256,
    resultRoot,
    guestStarted: true,
    guestCompleted: true,
  })
  return {
    schemaVersion: "runtime-provider-revalidation-evidence-v1.19" as const,
    executionKind: "real_service_execution" as const,
    syntheticEvidence: false as const,
    strategyRevisionId: input.revision.strategyRevisionId,
    sourceHash: input.revision.sourceHash,
    artifactSha256: input.revision.artifactSha256,
    languageId: input.revision.languageId,
    providerId: input.revision.providerId,
    laneId: input.revision.laneId,
    runtimeAbiVersion: input.pins.runtimeAbiVersion,
    semanticRuntimeVersion: input.pins.semanticRuntimeVersion,
    semanticTupleId: input.pins.semanticTupleId,
    candidatePinsRoot: input.candidatePinsRoot,
    probeId: input.probeId,
    method: input.observation.method,
    inputSha256: input.inputSha256,
    guestStarted: true as const,
    guestCompleted: true as const,
    resultRoot,
    evidenceRoot,
  }
}

const executeTypeScriptProvider = (
  input: RealProviderRevalidationExecutionInputV119,
): CandidateObservationTransportResultV119<{
  output: JsonValue
  evidence: ReturnType<typeof providerEvidence>
}> => {
  let executableSource: string
  try {
    executableSource = new TextDecoder("utf-8", { fatal: true }).decode(
      input.revision.artifactBytes,
    )
  } catch {
    return {
      kind: "player_violation",
      violation: {
        code: "INVALID_ARTIFACT",
        publicMessage: "Strategy revision did not pass candidate revalidation.",
      },
    }
  }
  const result = workerThreadStrategyExecutionAdapter.execute({
    source: executableSource,
    methodName: input.observation.method,
    input: input.observation.input,
    timeoutMs: 10_000,
    outputByteLimit: 262_144,
  })
  if (!result.ok) {
    if ("systemFailure" in result) {
      return {
        kind: "system_failure",
        failure: {
          code: "ADAPTER_CRASH",
          publicMessage: "Runtime system failure.",
          retryable: result.systemFailure.retryable,
        },
      }
    }
    return {
      kind: "player_violation",
      violation: {
        code: result.violation.type,
        publicMessage: "Strategy revision did not pass candidate revalidation.",
      },
    }
  }
  const parsed =
    input.observation.method === "selectActivations"
      ? StrategyResultSchema.safeParse(result.value)
      : SoldierBrainResultSchema.safeParse(result.value)
  if (!parsed.success) {
    return {
      kind: "player_violation",
      violation: {
        code: "INVALID_OUTPUT",
        publicMessage: "Strategy revision did not pass candidate revalidation.",
      },
    }
  }
  const output = parsed.data as unknown as JsonValue
  return {
    kind: "success",
    value: { output, evidence: providerEvidence(input, output) },
  }
}

export const executeTypeScriptRevisionCandidateV119 = (
  inventoryRow: Readonly<FrozenStrategyRevisionInventoryRowV119>,
  databaseRow: StrategyRevisionInventoryDatabaseRowV119,
): StrategyRevisionRevalidationResultV119 => {
  const artifact = artifactFor(databaseRow, inventoryRow.languageId)
  if (
    inventoryRow.strategyRevisionId !== databaseRow.id ||
    inventoryRow.languageId !== "typescript" ||
    inventoryRow.providerId !== authorityByLanguage.typescript.providerId ||
    inventoryRow.laneId !== authorityByLanguage.typescript.laneId ||
    inventoryRow.lockedAt === null ||
    artifact === null
  ) {
    throw new TypeError(
      "Revision-specific TypeScript candidate identity is invalid",
    )
  }
  return revalidateStrategyRevisionV119({
    revision: {
      strategyRevisionId: inventoryRow.strategyRevisionId,
      lockedAt: inventoryRow.lockedAt,
      sourceBytes: Buffer.from(databaseRow.source, "utf8"),
      sourceHash: inventoryRow.sourceHash,
      artifactBytes: artifact.bytes,
      artifactSha256: artifact.sha256,
      languageId: "typescript",
      providerId: authorityByLanguage.typescript.providerId,
      laneId: authorityByLanguage.typescript.laneId,
    },
    pins: pinsFor("typescript"),
    probes: probes(),
    executeProvider: executeTypeScriptProvider,
  })
}

type MinimalSuccessfulExecution = Readonly<{
  kind: "success"
  receipt: Partial<StrategyRevisionRevalidationReceiptV119> &
    Readonly<{
      strategyRevisionId: string
      executionReceiptRoot: Sha256
    }>
}>

type RevisionExecutionResult =
  | StrategyRevisionRevalidationResultV119
  | MinimalSuccessfulExecution

export interface BuildRevisionRevalidationArtifactV119Input {
  readonly databaseRows: readonly StrategyRevisionInventoryDatabaseRowV119[]
  readonly executeRevision?: (
    inventoryRow: Readonly<FrozenStrategyRevisionInventoryRowV119>,
    databaseRow: StrategyRevisionInventoryDatabaseRowV119,
  ) => RevisionExecutionResult
  readonly appendSuccess: (
    inventoryRow: Readonly<FrozenStrategyRevisionInventoryRowV119>,
    receipt: Readonly<StrategyRevisionRevalidationReceiptV119>,
  ) => Promise<void>
}

const baseRecord = (
  row: Readonly<FrozenStrategyRevisionInventoryRowV119>,
): ArtifactRecordBase => ({
  strategyRevisionId: row.strategyRevisionId,
  sourceHash: row.sourceHash,
  sourceBytes: row.sourceBytes,
  artifactSha256: row.artifactSha256,
  artifactBytes: row.artifactBytes,
  languageId: row.languageId,
  providerId: row.providerId,
  laneId: row.laneId,
})

const completeReceipt = (
  value: MinimalSuccessfulExecution["receipt"],
): value is StrategyRevisionRevalidationReceiptV119 =>
  value.schemaVersion === "runtime-semantic-receipt-v1.19" &&
  value.outcome === "success" &&
  value.admissible === true &&
  value.executionKind === "real_service_execution" &&
  value.syntheticEvidence === false &&
  value.runtimeAbiVersion === "strategy-runtime-abi-v1.19" &&
  value.semanticRuntimeVersion === "runtime-v1.19" &&
  value.semanticTupleId === CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID &&
  value.probeCount === REQUIRED_REVISION_REVALIDATION_PROBES_V1_19.length &&
  SHA256.test(value.executionRequestRoot ?? "") &&
  SHA256.test(value.executionResultRoot ?? "") &&
  SHA256.test(value.executionEvidenceRoot ?? "") &&
  SHA256.test(value.executionReceiptRoot)

export const buildRevisionRevalidationArtifactV119 = async (
  input: BuildRevisionRevalidationArtifactV119Input,
): Promise<Readonly<StrategyRevisionRevalidationArtifactV119>> => {
  if (String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.19") {
    throw new Error(
      "v1.19 selector activation is owned exclusively by Plan 260-14",
    )
  }
  const inventory = freezePreV119StrategyRevisionInventory(input.databaseRows)
  const byId = new Map(input.databaseRows.map((row) => [row.id, row]))
  const receiptRoots = new Set<Sha256>()
  const records: StrategyRevisionRevalidationArtifactRecordV119[] = []
  for (const inventoryRow of inventory.rows) {
    const databaseRow = byId.get(inventoryRow.strategyRevisionId)
    if (!databaseRow)
      throw new Error("Frozen revision inventory drifted during execution")
    if (!inventoryRow.immutable) {
      records.push({
        ...baseRecord(inventoryRow),
        outcome: "non_counted",
        countedCandidateEligible: false,
        dispositionCode: "REVISION_NOT_IMMUTABLE",
        retryable: false,
      })
      continue
    }
    if (!inventoryRow.identityValid) {
      records.push({
        ...baseRecord(inventoryRow),
        outcome: "non_counted",
        countedCandidateEligible: false,
        dispositionCode: "REVISION_IDENTITY_INVALID",
        retryable: false,
      })
      continue
    }
    if (inventoryRow.languageId !== "typescript") {
      records.push({
        ...baseRecord(inventoryRow),
        outcome: "non_counted",
        countedCandidateEligible: false,
        dispositionCode: "REAL_CANDIDATE_LANE_UNAVAILABLE",
        retryable: false,
      })
      continue
    }
    const result =
      input.executeRevision?.(inventoryRow, databaseRow) ??
      executeTypeScriptRevisionCandidateV119(inventoryRow, databaseRow)
    if (result.kind === "success") {
      if (
        result.receipt.strategyRevisionId !== inventoryRow.strategyRevisionId ||
        !completeReceipt(result.receipt) ||
        receiptRoots.has(result.receipt.executionReceiptRoot)
      ) {
        throw new Error(
          "Revision-specific receipt rejected: sibling, copied, partial, or synthetic receipt",
        )
      }
      receiptRoots.add(result.receipt.executionReceiptRoot)
      await input.appendSuccess(inventoryRow, result.receipt)
      records.push({
        ...baseRecord(inventoryRow),
        outcome: "revalidated",
        countedCandidateEligible: true,
        revalidationId: `revalidation:v1.19:${result.receipt.executionReceiptRoot.slice(7)}`,
        executionRequestRoot: result.receipt.executionRequestRoot,
        executionResultRoot: result.receipt.executionResultRoot,
        executionEvidenceRoot: result.receipt.executionEvidenceRoot,
        executionReceiptRoot: result.receipt.executionReceiptRoot,
      })
      continue
    }
    if (result.kind === "player_violation") {
      records.push({
        ...baseRecord(inventoryRow),
        outcome: "non_counted",
        countedCandidateEligible: false,
        dispositionCode: "PLAYER_VIOLATION",
        retryable: false,
      })
      continue
    }
    records.push({
      ...baseRecord(inventoryRow),
      outcome: "non_counted",
      countedCandidateEligible: false,
      dispositionCode: "SYSTEM_FAILURE",
      retryable: result.failure.retryable,
    })
  }

  const candidates = (["typescript", "python", "rust", "zig"] as const).map(
    (languageId) => ({ languageId, candidate: loadCandidateFile(languageId) }),
  )
  const first = candidates[0]!.candidate
  for (const { candidate } of candidates.slice(1)) {
    if (
      candidate.candidateBindings.corpus.rootSha256 !==
        first.candidateBindings.corpus.rootSha256 ||
      candidate.candidateBindings.trace.rootSha256 !==
        first.candidateBindings.trace.rootSha256 ||
      candidate.candidateBindings.workshop.rootSha256 !==
        first.candidateBindings.workshop.rootSha256
    ) {
      throw new Error("Candidate language authorities do not share exact pins")
    }
  }
  const artifact: StrategyRevisionRevalidationArtifactV119 = {
    schemaVersion: "v1.37-observation-v1.19-strategy-revision-revalidation-v1",
    status: "complete_inactive_candidate",
    current: false,
    selectorActivated: false,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19",
    semanticRuntimeVersion: "runtime-v1.19",
    semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
    executionKind: "real_service_execution_or_explicit_non_counted",
    inventory: {
      count: inventory.count,
      rootSha256: inventory.rootSha256,
    },
    candidatePinSet: {
      corpusVersion: "v3",
      corpusRootSha256: first.candidateBindings.corpus.rootSha256,
      traceVersion: "v4",
      traceRootSha256: first.candidateBindings.trace.rootSha256,
      workshopVersion: "v1.19",
      workshopRootSha256: first.candidateBindings.workshop.rootSha256,
      certificates: candidates.map(({ languageId, candidate }) => ({
        languageId,
        certificateId: candidate.candidatePayload.certificateId,
        certificateSha256: candidate.candidatePayloadSha256,
        providerId: authorityByLanguage[languageId].providerId,
        laneId: authorityByLanguage[languageId].laneId,
      })),
    },
    records,
    totals: {
      revalidated: records.filter((entry) => entry.outcome === "revalidated")
        .length,
      nonCounted: records.filter((entry) => entry.outcome === "non_counted")
        .length,
    },
    privacy: {
      publicSafe: true,
      sourceBytesIncluded: false,
      artifactBytesIncluded: false,
      memoriesIncluded: false,
      objectivesIncluded: false,
      diagnosticsIncluded: false,
      hostDataIncluded: false,
    },
  }
  return Object.freeze(artifact)
}

const admissionMatches = (
  admission: Readonly<StrategyRevisionV119Admission>,
  row: Readonly<FrozenStrategyRevisionInventoryRowV119>,
  receipt: Readonly<StrategyRevisionRevalidationReceiptV119>,
): boolean =>
  admission.strategyRevisionId === row.strategyRevisionId &&
  admission.sourceHash === receipt.sourceHash &&
  admission.sourceBytes === receipt.sourceBytes &&
  admission.artifactSha256 === receipt.artifactSha256 &&
  admission.artifactBytes === receipt.artifactBytes &&
  admission.languageId === receipt.languageId &&
  admission.providerId === receipt.providerId &&
  admission.laneId === receipt.laneId &&
  admission.runtimeAbiVersion === receipt.runtimeAbiVersion &&
  admission.semanticRuntimeVersion === receipt.semanticRuntimeVersion &&
  admission.semanticTupleId === receipt.semanticTupleId &&
  admission.executionRequestRoot === receipt.executionRequestRoot &&
  admission.executionResultRoot === receipt.executionResultRoot &&
  admission.executionReceiptRoot === receipt.executionReceiptRoot &&
  admission.reviewedCertificateId === receipt.certificateId &&
  admission.reviewedCertificateSha256 === receipt.certificateSha256

const appendOrVerify = async (
  client: Queryable,
  write: boolean,
  row: Readonly<FrozenStrategyRevisionInventoryRowV119>,
  receipt: Readonly<StrategyRevisionRevalidationReceiptV119>,
): Promise<void> => {
  const repositories = createRepositories(client)
  const existing = await repositories.getStrategyRevisionV119Admission(
    row.strategyRevisionId,
  )
  if (existing) {
    if (!admissionMatches(existing, row, receipt)) {
      throw new Error(
        "Existing revision revalidation evidence does not match exact receipt",
      )
    }
    return
  }
  if (!write) {
    throw new Error(
      "Exact append-only revision revalidation evidence is missing",
    )
  }
  const input: StrategyRevisionV119RevalidationInput = {
    id: `revalidation:v1.19:${receipt.executionReceiptRoot.slice(7)}`,
    strategyRevisionId: row.strategyRevisionId,
    sourceHash: receipt.sourceHash,
    sourceBytes: receipt.sourceBytes,
    artifactSha256: receipt.artifactSha256,
    artifactBytes: receipt.artifactBytes,
    languageId: receipt.languageId,
    providerId: receipt.providerId,
    laneId: receipt.laneId,
    runtimeAbiVersion: receipt.runtimeAbiVersion,
    semanticRuntimeVersion: receipt.semanticRuntimeVersion,
    semanticTupleId: receipt.semanticTupleId,
    executionKind: receipt.executionKind,
    syntheticEvidence: receipt.syntheticEvidence,
    executionRequestRoot: receipt.executionRequestRoot,
    executionResultRoot: receipt.executionResultRoot,
    executionReceiptRoot: receipt.executionReceiptRoot,
    serviceReceiptVersion: receipt.schemaVersion,
    reviewedCertificateId: receipt.certificateId,
    reviewedCertificateSha256: receipt.certificateSha256,
    reviewStatus: "reviewed",
    evidenceStatus: "passed",
    evidenceCreatedAt: new Date().toISOString(),
  }
  const appended =
    await repositories.appendStrategyRevisionV119Revalidation(input)
  if (!admissionMatches(appended, row, receipt)) {
    throw new Error(
      "Appended revision revalidation evidence failed exact admission",
    )
  }
}

const run = async (): Promise<void> => {
  const write = process.argv.includes("--write")
  const check = process.argv.includes("--check")
  if (!write && !check) {
    throw new Error("Use --write, --check, or --write --check")
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required")
  const pool = createDatabasePool({ connectionString })
  const client = await pool.connect()
  let artifact: Readonly<StrategyRevisionRevalidationArtifactV119>
  try {
    await client.query("begin isolation level serializable")
    const result = await client.query<StrategyRevisionInventoryDatabaseRowV119>(
      PRE_V119_INVENTORY_QUERY,
    )
    artifact = await buildRevisionRevalidationArtifactV119({
      databaseRows: result.rows,
      appendSuccess: (row, receipt) =>
        appendOrVerify(client, write, row, receipt),
    })
    const finalResult =
      await client.query<StrategyRevisionInventoryDatabaseRowV119>(
        PRE_V119_INVENTORY_QUERY,
      )
    const finalInventory = freezePreV119StrategyRevisionInventory(
      finalResult.rows,
    )
    if (
      finalInventory.rootSha256 !== artifact.inventory.rootSha256 ||
      finalInventory.count !== artifact.inventory.count
    ) {
      throw new Error("Strategy Revision inventory drifted during revalidation")
    }
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
    await pool.end()
  }

  const bytes = Buffer.from(canonicalBytes(artifact as unknown as JsonValue))
  if (write) writeFileSync(outputPath, bytes)
  if (check) {
    const current = readFileSync(outputPath)
    if (!current.equals(bytes)) {
      throw new Error("Strategy Revision revalidation artifact is stale")
    }
  }
  const serialized = bytes.toString("utf8")
  for (const forbidden of [
    "bytesBase64",
    "strategyMemory",
    "soldierMemory",
    "privateDiagnostics",
    "hostPath",
  ]) {
    if (serialized.includes(forbidden)) {
      throw new Error("Revalidation artifact crossed a private output boundary")
    }
  }
  process.stdout.write(
    `${JSON.stringify({
      status: "passed",
      current: artifact.current,
      inventory: artifact.inventory.count,
      revalidated: artifact.totals.revalidated,
      nonCounted: artifact.totals.nonCounted,
    })}\n`,
  )
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await run()
}
