import { createHash } from "node:crypto"
import { isDeepStrictEqual } from "node:util"
import type { Pool, PoolClient, QueryResultRow } from "pg"

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_OBJECT = /^[0-9a-f]{40,64}$/u
const ACTIVATION_ID = /^activation:[A-Za-z0-9._:-]{1,160}$/u
const COMPENSATION_ID = /^compensation:[A-Za-z0-9._:-]{1,156}$/u

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonical(
            (value as Record<string, unknown>)[key],
          )}`,
      )
      .join(",")}}`
  }
  return JSON.stringify(value)
}

const hashDomainValue = (domain: string, value: unknown): `sha256:${string}` =>
  `sha256:${createHash("sha256")
    .update(domain)
    .update("\0")
    .update(canonical(value))
    .digest("hex")}`

export interface CompleteSemanticAuthoritySelection {
  schemaVersion: "semantic-authority-selection-v1"
  semanticAuthorityKey: "runtime-v1.17" | "runtime-v1.19"
  tupleId: `sha256:${string}`
  rulesVersion: string
  engineVersion: string
  runtimeAbiVersion: string
  chronicleVersion: string
  conformanceCertificateVersion: string
  conformanceCorpusVersion: string
  conformanceCorpusRoot: `sha256:${string}`
  conformanceTraceVersion: string
  conformanceTraceRoot: `sha256:${string}`
  workshopContractVersion: string
  workshopContractRoot: `sha256:${string}`
  arenaCatalogVersion: string
  setPolicyVersion: string
  strategyRevisionEvidencePolicy: string
}

export const ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION = deepFreeze({
  schemaVersion: "semantic-authority-selection-v1",
  semanticAuthorityKey: "runtime-v1.17",
  tupleId:
    "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
  rulesVersion: "cowards-rules-v1.4",
  engineVersion: "engine-kernel-v1.37-candidate-1",
  runtimeAbiVersion: "strategy-runtime-abi-v1.17",
  chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1",
  conformanceCertificateVersion: "runtime-conformance-certificate-v1.17",
  conformanceCorpusVersion: "v2",
  conformanceCorpusRoot:
    "sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2",
  conformanceTraceVersion: "v1.37-conformance-trace-v3",
  conformanceTraceRoot:
    "sha256:53ac4a34b8ea3a52b65b566dfb1da94cbc36ce220c590fe46c0bf43489668696",
  workshopContractVersion: "workshop-contract-v1.17",
  workshopContractRoot:
    "sha256:1bed9b99ce512da13a3aa37554dc9b279f51dca619280ff3cbd85cc773ce18d3",
  arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1",
  setPolicyVersion: "canonical-set-policy-v1.4",
  strategyRevisionEvidencePolicy: "phase259-explicit-current-evidence-v1",
} as const satisfies CompleteSemanticAuthoritySelection)

export const REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION = deepFreeze({
  schemaVersion: "semantic-authority-selection-v1",
  semanticAuthorityKey: "runtime-v1.19",
  tupleId:
    "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
  rulesVersion: "cowards-rules-v1.4",
  engineVersion: "engine-kernel-v1.37-candidate-1",
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  chronicleVersion: "chronicle-recorder-current-events-v1.37-candidate-1",
  conformanceCertificateVersion: "runtime-conformance-certificate-v1.19",
  conformanceCorpusVersion: "v3",
  conformanceCorpusRoot:
    "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
  conformanceTraceVersion: "v1.37-observation-trace-v4",
  conformanceTraceRoot:
    "sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a",
  workshopContractVersion: "workshop-contract-v1.19",
  workshopContractRoot:
    "sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d",
  arenaCatalogVersion: "canonical-arena-catalog-v1.37",
  setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
  strategyRevisionEvidencePolicy: "strategy-revision-v1.19-revalidation-v1",
} as const satisfies CompleteSemanticAuthoritySelection)

export const ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT =
  "sha256:fd2cc24a345c0cb94dde9966262f128c663a4430022574729eb4a902177c4b5a" as const
export const REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT =
  "sha256:17954660f17c83e60e5d7df0b589cd89cf6b00eba4d4963e2d4bf43bc71c6ea2" as const

const SELECTION_KEYS = Object.freeze(
  Object.keys(ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION).sort(),
)

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort())

export const resolveExactSemanticAuthoritySelection = (
  value: unknown,
  root: unknown,
): Readonly<CompleteSemanticAuthoritySelection> | undefined => {
  if (!exactKeys(value, SELECTION_KEYS) || typeof root !== "string") {
    return undefined
  }
  if (
    root === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT &&
    isDeepStrictEqual(value, ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION)
  ) {
    return ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
  }
  if (
    root === REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT &&
    isDeepStrictEqual(value, REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION)
  ) {
    return REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
  }
  return undefined
}

export interface SemanticAuthoritySelectorManifestEntry {
  path: string
  sha256: `sha256:${string}`
}

export const SEMANTIC_AUTHORITY_SELECTOR_PATHS = Object.freeze([
  "apps/go-backend/current_semantic_authority_generated.go",
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
  "packages/golden/src/v1-37-conformance-corpus-pin.ts",
  "packages/spec/src/current-semantic-authority-source.ts",
] as const)

const normalizeSelectorManifest = (
  value: unknown,
): readonly Readonly<SemanticAuthoritySelectorManifestEntry>[] | undefined => {
  if (!Array.isArray(value) || value.length !== 5) return undefined
  const entries: SemanticAuthoritySelectorManifestEntry[] = []
  for (const member of value) {
    if (
      !exactKeys(member, ["path", "sha256"]) ||
      typeof member.path !== "string" ||
      typeof member.sha256 !== "string" ||
      !SHA256.test(member.sha256)
    ) {
      return undefined
    }
    entries.push({
      path: member.path,
      sha256: member.sha256 as `sha256:${string}`,
    })
  }
  entries.sort((left, right) => left.path.localeCompare(right.path))
  if (
    !isDeepStrictEqual(
      entries.map((entry) => entry.path),
      [...SEMANTIC_AUTHORITY_SELECTOR_PATHS],
    )
  ) {
    return undefined
  }
  return deepFreeze(entries)
}

export const hashSemanticAuthoritySelectorManifest = (
  value: unknown,
): `sha256:${string}` => {
  const manifest = normalizeSelectorManifest(value)
  if (manifest === undefined) {
    fail("MANIFEST", "Selector manifest is invalid.")
  }
  return hashDomainValue(
    "cowards-game:semantic-authority-selector-manifest:v1",
    manifest,
  )
}

export type SemanticAuthoritySelectionHeadState =
  | "active-v1.17-bootstrap"
  | "pending-precommit"
  | "active-v1.19-finalized"
  | "pending-compensation"
  | "active-v1.17-compensated"

export interface ForwardSemanticAuthorityPendingIntent {
  direction: "forward"
  activationId: string
  expectedOldRoot: typeof ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
  targetSelection: typeof REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
  targetRoot: typeof REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT
  parentHead: string
  selectorManifest: readonly Readonly<SemanticAuthoritySelectorManifestEntry>[]
  selectorManifestRoot: `sha256:${string}`
  proofPreimageRoot: `sha256:${string}`
}

export interface ReverseSemanticAuthorityPendingIntent {
  direction: "reverse"
  activationId: string
  sourceActivationId: string
  expectedOldRoot: typeof REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT
  targetSelection: typeof ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
  targetRoot: typeof ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
  parentHead: string
  selectorManifest: readonly Readonly<SemanticAuthoritySelectorManifestEntry>[]
  selectorManifestRoot: `sha256:${string}`
  proofPreimageRoot: `sha256:${string}`
}

export type SemanticAuthorityPendingIntent =
  | ForwardSemanticAuthorityPendingIntent
  | ReverseSemanticAuthorityPendingIntent

export interface SemanticAuthorityFinalization {
  activationId: string
  proofDigest: `sha256:${string}`
  commitSha: string
  treeSha: string
  selectorManifestRoot: `sha256:${string}`
}

export interface SemanticAuthorityCompensation {
  activationId: string
  sourceActivationId: string
  recoveryReceiptDigest: `sha256:${string}`
  commitSha: string
  treeSha: string
  selectorManifestRoot: `sha256:${string}`
}

export interface SemanticAuthoritySelectionHead {
  state: SemanticAuthoritySelectionHeadState
  revision: number
  activeSelection: Readonly<CompleteSemanticAuthoritySelection>
  activeSelectionRoot:
    | typeof ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
    | typeof REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT
  pendingIntent: Readonly<SemanticAuthorityPendingIntent> | null
  finalization: Readonly<SemanticAuthorityFinalization> | null
  compensation: Readonly<SemanticAuthorityCompensation> | null
}

export type SemanticAuthoritySelectionHeadErrorCode =
  | "ABSENT"
  | "INVALID_HEAD"
  | "INVALID_SELECTION"
  | "MANIFEST"
  | "STALE"
  | "STATE"
  | "INTENT"
  | "BINDING"
  | "UNAVAILABLE"
  | "MISMATCH"

export class SemanticAuthoritySelectionHeadError extends Error {
  readonly code: SemanticAuthoritySelectionHeadErrorCode

  constructor(code: SemanticAuthoritySelectionHeadErrorCode, message: string) {
    super(message)
    this.name = "SemanticAuthoritySelectionHeadError"
    this.code = code
  }

  toJSON(): Readonly<{ name: string; code: string; message: string }> {
    return Object.freeze({
      name: this.name,
      code: this.code,
      message: this.message,
    })
  }
}

const fail = (
  code: SemanticAuthoritySelectionHeadErrorCode,
  message: string,
): never => {
  throw new SemanticAuthoritySelectionHeadError(code, message)
}

interface HeadRow extends QueryResultRow {
  state: string
  revision: string | number
  active_selection: unknown
  active_selection_root: string
  pending_intent: unknown
  finalization: unknown
  compensation: unknown
}

const exactSha = (value: unknown): value is `sha256:${string}` =>
  typeof value === "string" && SHA256.test(value)
const exactGit = (value: unknown): value is string =>
  typeof value === "string" && GIT_OBJECT.test(value)

const parseFinalization = (
  value: unknown,
): Readonly<SemanticAuthorityFinalization> | null => {
  if (value === null) return null
  if (
    !exactKeys(value, [
      "activationId",
      "proofDigest",
      "commitSha",
      "treeSha",
      "selectorManifestRoot",
    ]) ||
    typeof value.activationId !== "string" ||
    !ACTIVATION_ID.test(value.activationId) ||
    !exactSha(value.proofDigest) ||
    !exactGit(value.commitSha) ||
    !exactGit(value.treeSha) ||
    !exactSha(value.selectorManifestRoot)
  ) {
    fail("INVALID_HEAD", "Semantic authority finalization is invalid.")
  }
  const record = value as Record<string, unknown>
  return deepFreeze({
    activationId: record.activationId as string,
    proofDigest: record.proofDigest as `sha256:${string}`,
    commitSha: record.commitSha as string,
    treeSha: record.treeSha as string,
    selectorManifestRoot: record.selectorManifestRoot as `sha256:${string}`,
  })
}

const parseCompensation = (
  value: unknown,
): Readonly<SemanticAuthorityCompensation> | null => {
  if (value === null) return null
  if (
    !exactKeys(value, [
      "activationId",
      "sourceActivationId",
      "recoveryReceiptDigest",
      "commitSha",
      "treeSha",
      "selectorManifestRoot",
    ]) ||
    typeof value.activationId !== "string" ||
    !COMPENSATION_ID.test(value.activationId) ||
    typeof value.sourceActivationId !== "string" ||
    !ACTIVATION_ID.test(value.sourceActivationId) ||
    !exactSha(value.recoveryReceiptDigest) ||
    !exactGit(value.commitSha) ||
    !exactGit(value.treeSha) ||
    !exactSha(value.selectorManifestRoot)
  ) {
    fail("INVALID_HEAD", "Semantic authority compensation is invalid.")
  }
  const record = value as Record<string, unknown>
  return deepFreeze({
    activationId: record.activationId as string,
    sourceActivationId: record.sourceActivationId as string,
    recoveryReceiptDigest: record.recoveryReceiptDigest as `sha256:${string}`,
    commitSha: record.commitSha as string,
    treeSha: record.treeSha as string,
    selectorManifestRoot: record.selectorManifestRoot as `sha256:${string}`,
  })
}

const parsePending = (
  value: unknown,
): Readonly<SemanticAuthorityPendingIntent> | null => {
  if (value === null) return null
  if (
    value === undefined ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    fail("INVALID_HEAD", "Semantic authority pending intent is invalid.")
  }
  const record = value as Record<string, unknown>
  if (record.direction !== "forward" && record.direction !== "reverse") {
    fail("INVALID_HEAD", "Semantic authority pending intent is invalid.")
  }
  const direction = record.direction as "forward" | "reverse"
  const expectedKeys =
    direction === "forward"
      ? [
          "direction",
          "activationId",
          "expectedOldRoot",
          "targetSelection",
          "targetRoot",
          "parentHead",
          "selectorManifest",
          "selectorManifestRoot",
          "proofPreimageRoot",
        ]
      : [
          "direction",
          "activationId",
          "sourceActivationId",
          "expectedOldRoot",
          "targetSelection",
          "targetRoot",
          "parentHead",
          "selectorManifest",
          "selectorManifestRoot",
          "proofPreimageRoot",
        ]
  if (!exactKeys(record, expectedKeys)) {
    fail("INVALID_HEAD", "Semantic authority pending intent is invalid.")
  }
  const manifest = normalizeSelectorManifest(record.selectorManifest)
  if (
    manifest === undefined ||
    !exactSha(record.selectorManifestRoot) ||
    hashSemanticAuthoritySelectorManifest(manifest) !==
      record.selectorManifestRoot ||
    !exactSha(record.proofPreimageRoot) ||
    !exactGit(record.parentHead)
  ) {
    fail("INVALID_HEAD", "Semantic authority pending binding is invalid.")
  }
  const exactManifest =
    manifest as readonly Readonly<SemanticAuthoritySelectorManifestEntry>[]
  if (
    direction === "forward" &&
    typeof record.activationId === "string" &&
    ACTIVATION_ID.test(record.activationId) &&
    record.expectedOldRoot === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT &&
    resolveExactSemanticAuthoritySelection(
      record.targetSelection,
      record.targetRoot,
    ) === REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
  ) {
    return deepFreeze({
      direction,
      activationId: record.activationId,
      expectedOldRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      targetSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
      targetRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      parentHead: record.parentHead as string,
      selectorManifest: exactManifest,
      selectorManifestRoot: record.selectorManifestRoot as `sha256:${string}`,
      proofPreimageRoot: record.proofPreimageRoot as `sha256:${string}`,
    })
  }
  if (
    direction === "reverse" &&
    typeof record.activationId === "string" &&
    COMPENSATION_ID.test(record.activationId) &&
    typeof record.sourceActivationId === "string" &&
    ACTIVATION_ID.test(record.sourceActivationId) &&
    record.expectedOldRoot ===
      REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT &&
    resolveExactSemanticAuthoritySelection(
      record.targetSelection,
      record.targetRoot,
    ) === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
  ) {
    return deepFreeze({
      direction,
      activationId: record.activationId,
      sourceActivationId: record.sourceActivationId,
      expectedOldRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      targetSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
      targetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
      parentHead: record.parentHead as string,
      selectorManifest: exactManifest,
      selectorManifestRoot: record.selectorManifestRoot as `sha256:${string}`,
      proofPreimageRoot: record.proofPreimageRoot as `sha256:${string}`,
    })
  }
  return fail(
    "INVALID_HEAD",
    "Semantic authority pending transition is invalid.",
  )
}

const parseHeadRow = (
  row: HeadRow | undefined,
): Readonly<SemanticAuthoritySelectionHead> => {
  if (row === undefined)
    fail("ABSENT", "Semantic authority head is unavailable.")
  const exactRow = row as HeadRow
  const revision = Number(exactRow.revision)
  const selection = resolveExactSemanticAuthoritySelection(
    exactRow.active_selection,
    exactRow.active_selection_root,
  )
  if (
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    selection === undefined
  ) {
    fail("INVALID_HEAD", "Semantic authority head is invalid.")
  }
  const exactSelection =
    selection as Readonly<CompleteSemanticAuthoritySelection>
  const pendingIntent = parsePending(exactRow.pending_intent)
  const finalization = parseFinalization(exactRow.finalization)
  const compensation = parseCompensation(exactRow.compensation)
  const state = exactRow.state as SemanticAuthoritySelectionHeadState
  const valid =
    (state === "active-v1.17-bootstrap" &&
      exactSelection === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION &&
      pendingIntent === null &&
      finalization === null &&
      compensation === null) ||
    (state === "pending-precommit" &&
      exactSelection === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION &&
      pendingIntent?.direction === "forward" &&
      finalization === null &&
      compensation === null) ||
    (state === "active-v1.19-finalized" &&
      exactSelection === REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION &&
      pendingIntent === null &&
      finalization !== null &&
      compensation === null) ||
    (state === "pending-compensation" &&
      exactSelection === REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION &&
      pendingIntent?.direction === "reverse" &&
      finalization !== null &&
      pendingIntent.sourceActivationId === finalization.activationId &&
      compensation === null) ||
    (state === "active-v1.17-compensated" &&
      exactSelection === ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION &&
      pendingIntent === null &&
      finalization !== null &&
      compensation !== null &&
      compensation.sourceActivationId === finalization.activationId)
  if (!valid) fail("INVALID_HEAD", "Semantic authority head state is invalid.")
  return deepFreeze({
    state,
    revision,
    activeSelection: exactSelection,
    activeSelectionRoot: exactRow.active_selection_root as
      | typeof ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
      | typeof REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
    pendingIntent,
    finalization,
    compensation,
  })
}

const readHeadWithClient = async (
  client: PoolClient,
  lock: boolean,
): Promise<Readonly<SemanticAuthoritySelectionHead>> => {
  const result = await client.query<HeadRow>(
    `select state, revision, active_selection, active_selection_root,
            pending_intent, finalization, compensation
       from semantic_authority_selection_head
      where singleton = true${lock ? " for update" : ""}`,
  )
  if (result.rowCount !== 1) {
    fail("ABSENT", "Semantic authority head is unavailable.")
  }
  return parseHeadRow(result.rows[0])
}

export const lockSemanticAuthoritySelectionHead = (
  client: PoolClient,
): Promise<Readonly<SemanticAuthoritySelectionHead>> =>
  readHeadWithClient(client, true)

export const readSemanticAuthoritySelectionHead = async (
  pool: Pool,
): Promise<Readonly<SemanticAuthoritySelectionHead>> => {
  const client = await pool.connect()
  try {
    return await readHeadWithClient(client, false)
  } finally {
    client.release()
  }
}

const withSerializableHeadTransaction = async <T>(
  pool: Pool,
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = await pool.connect()
    try {
      await client.query("begin isolation level serializable")
      await client.query(
        "select pg_advisory_xact_lock(hashtext('semantic-authority-selection-head-v1'))",
      )
      const result = await operation(client)
      await client.query("commit")
      return result
    } catch (error) {
      await client.query("rollback")
      if (
        attempt < 3 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "40001"
      ) {
        continue
      }
      throw error
    } finally {
      client.release()
    }
  }
  return fail("STALE", "Semantic authority transaction retry exhausted.")
}

export interface SemanticAuthorityTransitionHooks {
  afterHeadWrite?(): void | Promise<void>
}

const installTransitionPermission = (client: PoolClient): Promise<unknown> =>
  client.query(
    "select set_config('cowards.semantic_authority_transition','phase260-plan28',true)",
  )

const insertHistory = async (
  client: PoolClient,
  transitionKind: string,
  activationId: string,
): Promise<void> => {
  await client.query(
    `insert into semantic_authority_selection_history (
       transition_kind, state, revision, activation_id, active_selection,
       active_selection_root, pending_intent, finalization, compensation
     )
     select $1, state, revision, $2, active_selection, active_selection_root,
            pending_intent, finalization, compensation
       from semantic_authority_selection_head where singleton = true`,
    [transitionKind, activationId],
  )
}

export interface PrepareForwardSemanticAuthoritySelectionInput {
  direction: "forward"
  activationId: string
  expectedRevision: number
  expectedActiveRoot: string
  targetSelection: unknown
  targetRoot: string
  parentHead: string
  selectorManifest: unknown
  selectorManifestRoot: string
  proofPreimageRoot: string
}

export interface PrepareReverseSemanticAuthoritySelectionInput {
  direction: "reverse"
  activationId: string
  sourceActivationId: string
  expectedRevision: number
  expectedActiveRoot: string
  targetSelection: unknown
  targetRoot: string
  parentHead: string
  selectorManifest: unknown
  selectorManifestRoot: string
  proofPreimageRoot: string
}

export type PrepareSemanticAuthoritySelectionInput =
  | PrepareForwardSemanticAuthoritySelectionInput
  | PrepareReverseSemanticAuthoritySelectionInput

export const prepareSemanticAuthoritySelectionTransition = async (
  pool: Pool,
  input: PrepareSemanticAuthoritySelectionInput,
  hooks: SemanticAuthorityTransitionHooks = {},
): Promise<Readonly<SemanticAuthoritySelectionHead>> => {
  const manifest = normalizeSelectorManifest(input.selectorManifest)
  if (
    manifest === undefined ||
    !exactSha(input.selectorManifestRoot) ||
    hashSemanticAuthoritySelectorManifest(manifest) !==
      input.selectorManifestRoot ||
    !exactSha(input.proofPreimageRoot) ||
    !exactGit(input.parentHead)
  ) {
    fail("MANIFEST", "Semantic authority selector manifest is invalid.")
  }
  const exactManifest =
    manifest as readonly Readonly<SemanticAuthoritySelectorManifestEntry>[]
  return withSerializableHeadTransaction(pool, async (client) => {
    const head = await readHeadWithClient(client, true)
    if (head.revision !== input.expectedRevision) {
      fail("STALE", "Semantic authority revision is stale.")
    }
    if (head.pendingIntent !== null) {
      fail("STATE", "Another semantic authority intent is pending.")
    }

    let state: SemanticAuthoritySelectionHeadState
    let pending: SemanticAuthorityPendingIntent
    let transitionKind: string
    if (input.direction === "forward") {
      if (
        head.state !== "active-v1.17-bootstrap" ||
        input.expectedActiveRoot !== head.activeSelectionRoot
      ) {
        fail("STATE", "Forward semantic authority direction is unavailable.")
      }
      if (
        !ACTIVATION_ID.test(input.activationId) ||
        resolveExactSemanticAuthoritySelection(
          input.targetSelection,
          input.targetRoot,
        ) !== REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
      ) {
        fail("INVALID_SELECTION", "Forward target selection is invalid.")
      }
      state = "pending-precommit"
      transitionKind = "prepared"
      pending = {
        direction: "forward",
        activationId: input.activationId,
        expectedOldRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        targetSelection: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION,
        targetRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        parentHead: input.parentHead,
        selectorManifest: exactManifest,
        selectorManifestRoot: input.selectorManifestRoot as `sha256:${string}`,
        proofPreimageRoot: input.proofPreimageRoot as `sha256:${string}`,
      }
    } else {
      if (
        head.state !== "active-v1.19-finalized" ||
        input.expectedActiveRoot !== head.activeSelectionRoot ||
        head.finalization === null ||
        input.sourceActivationId !== head.finalization.activationId
      ) {
        fail("STATE", "Reverse semantic authority direction is unavailable.")
      }
      if (
        !COMPENSATION_ID.test(input.activationId) ||
        resolveExactSemanticAuthoritySelection(
          input.targetSelection,
          input.targetRoot,
        ) !== ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
      ) {
        fail("INVALID_SELECTION", "Reverse target selection is invalid.")
      }
      state = "pending-compensation"
      transitionKind = "compensation-prepared"
      pending = {
        direction: "reverse",
        activationId: input.activationId,
        sourceActivationId: input.sourceActivationId,
        expectedOldRoot: REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        targetSelection: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION,
        targetRoot: ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT,
        parentHead: input.parentHead,
        selectorManifest: exactManifest,
        selectorManifestRoot: input.selectorManifestRoot as `sha256:${string}`,
        proofPreimageRoot: input.proofPreimageRoot as `sha256:${string}`,
      }
    }

    await installTransitionPermission(client)
    await client.query(
      `update semantic_authority_selection_head
          set state = $1, revision = revision + 1, pending_intent = $2,
              updated_at = now()
        where singleton = true and revision = $3`,
      [state, JSON.stringify(pending), input.expectedRevision],
    )
    await hooks.afterHeadWrite?.()
    await insertHistory(client, transitionKind, input.activationId)
    return readHeadWithClient(client, false)
  })
}

export interface FinalizeForwardSemanticAuthoritySelectionInput {
  direction: "forward"
  activationId: string
  expectedRevision: number
  expectedParentHead: string
  expectedTargetRoot: string
  expectedSelectorManifestRoot: string
  proofDigest: string
  commitSha: string
  treeSha: string
}

export interface FinalizeReverseSemanticAuthoritySelectionInput {
  direction: "reverse"
  activationId: string
  sourceActivationId: string
  expectedRevision: number
  expectedParentHead: string
  expectedTargetRoot: string
  expectedSelectorManifestRoot: string
  recoveryReceiptDigest: string
  commitSha: string
  treeSha: string
}

export type FinalizeSemanticAuthoritySelectionInput =
  | FinalizeForwardSemanticAuthoritySelectionInput
  | FinalizeReverseSemanticAuthoritySelectionInput

const isIdempotentFinalization = (
  head: Readonly<SemanticAuthoritySelectionHead>,
  input: FinalizeSemanticAuthoritySelectionInput,
): boolean =>
  input.direction === "forward"
    ? head.state === "active-v1.19-finalized" &&
      head.finalization?.activationId === input.activationId &&
      head.finalization.proofDigest === input.proofDigest &&
      head.finalization.commitSha === input.commitSha &&
      head.finalization.treeSha === input.treeSha &&
      head.finalization.selectorManifestRoot ===
        input.expectedSelectorManifestRoot
    : head.state === "active-v1.17-compensated" &&
      head.compensation?.activationId === input.activationId &&
      head.compensation.sourceActivationId === input.sourceActivationId &&
      head.compensation.recoveryReceiptDigest === input.recoveryReceiptDigest &&
      head.compensation.commitSha === input.commitSha &&
      head.compensation.treeSha === input.treeSha &&
      head.compensation.selectorManifestRoot ===
        input.expectedSelectorManifestRoot

const recordedPendingMatches = async (
  client: PoolClient,
  input: FinalizeSemanticAuthoritySelectionInput,
): Promise<boolean> => {
  const result = await client.query<{ pending_intent: unknown }>(
    `select pending_intent
       from semantic_authority_selection_history
      where activation_id = $1 and transition_kind = $2
      order by sequence desc limit 1`,
    [
      input.activationId,
      input.direction === "forward" ? "prepared" : "compensation-prepared",
    ],
  )
  const pending = parsePending(result.rows[0]?.pending_intent)
  return (
    pending?.direction === input.direction &&
    pending.activationId === input.activationId &&
    pending.parentHead === input.expectedParentHead &&
    pending.targetRoot === input.expectedTargetRoot &&
    pending.selectorManifestRoot === input.expectedSelectorManifestRoot
  )
}

export const finalizeSemanticAuthoritySelectionTransition = async (
  pool: Pool,
  input: FinalizeSemanticAuthoritySelectionInput,
  hooks: SemanticAuthorityTransitionHooks = {},
): Promise<Readonly<SemanticAuthoritySelectionHead>> =>
  withSerializableHeadTransaction(pool, async (client) => {
    const head = await readHeadWithClient(client, true)
    if (isIdempotentFinalization(head, input)) {
      if (!(await recordedPendingMatches(client, input))) {
        fail("BINDING", "Semantic authority recovery binding does not match.")
      }
      return head
    }
    if (head.revision !== input.expectedRevision) {
      fail("STALE", "Semantic authority revision is stale.")
    }
    const pending = head.pendingIntent
    if (
      pending === null ||
      pending.direction !== input.direction ||
      pending.activationId !== input.activationId
    ) {
      fail("INTENT", "Semantic authority pending intent does not match.")
    }
    const exactPending = pending as Readonly<SemanticAuthorityPendingIntent>
    if (
      exactPending.parentHead !== input.expectedParentHead ||
      exactPending.targetRoot !== input.expectedTargetRoot ||
      exactPending.selectorManifestRoot !== input.expectedSelectorManifestRoot
    ) {
      fail("BINDING", "Semantic authority finalization binding does not match.")
    }
    if (!exactGit(input.commitSha) || !exactGit(input.treeSha)) {
      fail("BINDING", "Semantic authority Git binding is invalid.")
    }

    let state: SemanticAuthoritySelectionHeadState
    let activeSelection: CompleteSemanticAuthoritySelection
    let activeRoot: string
    let finalization: SemanticAuthorityFinalization | null
    let compensation: SemanticAuthorityCompensation | null
    let transitionKind: string
    if (input.direction === "forward") {
      if (head.state !== "pending-precommit" || !exactSha(input.proofDigest)) {
        fail("BINDING", "Semantic authority proof binding is invalid.")
      }
      state = "active-v1.19-finalized"
      activeSelection = REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION
      activeRoot = REVIEWED_V1_19_SEMANTIC_AUTHORITY_SELECTION_ROOT
      finalization = {
        activationId: input.activationId,
        proofDigest: input.proofDigest as `sha256:${string}`,
        commitSha: input.commitSha,
        treeSha: input.treeSha,
        selectorManifestRoot:
          input.expectedSelectorManifestRoot as `sha256:${string}`,
      }
      compensation = null
      transitionKind = "finalized"
    } else {
      if (
        head.state !== "pending-compensation" ||
        head.finalization === null ||
        input.sourceActivationId !== head.finalization.activationId ||
        !exactSha(input.recoveryReceiptDigest)
      ) {
        fail("BINDING", "Semantic authority recovery binding is invalid.")
      }
      state = "active-v1.17-compensated"
      activeSelection = ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION
      activeRoot = ACTIVE_V1_17_SEMANTIC_AUTHORITY_SELECTION_ROOT
      finalization = head.finalization
      compensation = {
        activationId: input.activationId,
        sourceActivationId: input.sourceActivationId,
        recoveryReceiptDigest:
          input.recoveryReceiptDigest as `sha256:${string}`,
        commitSha: input.commitSha,
        treeSha: input.treeSha,
        selectorManifestRoot:
          input.expectedSelectorManifestRoot as `sha256:${string}`,
      }
      transitionKind = "compensated"
    }

    await installTransitionPermission(client)
    await client.query(
      `update semantic_authority_selection_head
          set state = $1, revision = revision + 1, active_selection = $2,
              active_selection_root = $3, pending_intent = null,
              finalization = $4, compensation = $5, updated_at = now()
        where singleton = true and revision = $6`,
      [
        state,
        JSON.stringify(activeSelection),
        activeRoot,
        finalization === null ? null : JSON.stringify(finalization),
        compensation === null ? null : JSON.stringify(compensation),
        input.expectedRevision,
      ],
    )
    await hooks.afterHeadWrite?.()
    await insertHistory(client, transitionKind, input.activationId)
    return readHeadWithClient(client, false)
  })

export interface AbortSemanticAuthoritySelectionInput {
  direction: "forward" | "reverse"
  activationId: string
  expectedRevision: number
  expectedParentHead?: string
  expectedSelectorManifestRoot?: string
}

const lastAbortMatches = async (
  client: PoolClient,
  input: AbortSemanticAuthoritySelectionInput,
): Promise<boolean> => {
  const result = await client.query<{ transition_kind: string }>(
    `select transition_kind
       from semantic_authority_selection_history
      where activation_id = $1
      order by sequence desc limit 1`,
    [input.activationId],
  )
  const expected =
    input.direction === "forward" ? "aborted" : "compensation-aborted"
  return result.rows[0]?.transition_kind === expected
}

export const abortSemanticAuthoritySelectionTransition = async (
  pool: Pool,
  input: AbortSemanticAuthoritySelectionInput,
  hooks: SemanticAuthorityTransitionHooks = {},
): Promise<Readonly<SemanticAuthoritySelectionHead>> =>
  withSerializableHeadTransaction(pool, async (client) => {
    const head = await readHeadWithClient(client, true)
    if (
      head.pendingIntent === null &&
      (await lastAbortMatches(client, input))
    ) {
      return head
    }
    if (head.revision !== input.expectedRevision) {
      fail("STALE", "Semantic authority revision is stale.")
    }
    if (
      head.pendingIntent?.direction !== input.direction ||
      head.pendingIntent.activationId !== input.activationId
    ) {
      fail("INTENT", "Semantic authority abort intent does not match.")
    }
    const exactPending =
      head.pendingIntent as Readonly<SemanticAuthorityPendingIntent>
    if (
      (input.expectedParentHead !== undefined &&
        exactPending.parentHead !== input.expectedParentHead) ||
      (input.expectedSelectorManifestRoot !== undefined &&
        exactPending.selectorManifestRoot !==
          input.expectedSelectorManifestRoot)
    ) {
      fail("BINDING", "Semantic authority abort binding does not match.")
    }

    const forward = input.direction === "forward"
    await installTransitionPermission(client)
    await client.query(
      `update semantic_authority_selection_head
          set state = $1, revision = revision + 1, pending_intent = null,
              updated_at = now()
        where singleton = true and revision = $2`,
      [
        forward ? "active-v1.17-bootstrap" : "active-v1.19-finalized",
        input.expectedRevision,
      ],
    )
    await hooks.afterHeadWrite?.()
    await insertHistory(
      client,
      forward ? "aborted" : "compensation-aborted",
      input.activationId,
    )
    return readHeadWithClient(client, false)
  })

export type RecoverSemanticAuthoritySelectionInput =
  | (AbortSemanticAuthoritySelectionInput & {
      disposition: "precommit"
      expectedParentHead: string
      expectedSelectorManifestRoot: string
    })
  | (FinalizeSemanticAuthoritySelectionInput & {
      disposition: "committed"
    })

export const recoverSemanticAuthoritySelectionTransition = async (
  pool: Pool,
  input: RecoverSemanticAuthoritySelectionInput,
  hooks: SemanticAuthorityTransitionHooks = {},
): Promise<Readonly<SemanticAuthoritySelectionHead>> => {
  if (input.disposition === "committed") {
    return finalizeSemanticAuthoritySelectionTransition(pool, input, hooks)
  }
  const head = await readSemanticAuthoritySelectionHead(pool)
  if (
    head.pendingIntent !== null &&
    (head.pendingIntent.direction !== input.direction ||
      head.pendingIntent.activationId !== input.activationId ||
      head.pendingIntent.parentHead !== input.expectedParentHead ||
      head.pendingIntent.selectorManifestRoot !==
        input.expectedSelectorManifestRoot)
  ) {
    fail("BINDING", "Semantic authority recovery binding does not match.")
  }
  return abortSemanticAuthoritySelectionTransition(pool, input, hooks)
}

export const assertCountedSemanticAuthoritySelection = (
  head: Readonly<SemanticAuthoritySelectionHead> | undefined,
  expectedSelection: unknown,
  expectedRoot: unknown,
): Readonly<CompleteSemanticAuthoritySelection> => {
  if (
    head === undefined ||
    head.pendingIntent !== null ||
    head.state === "pending-precommit" ||
    head.state === "pending-compensation"
  ) {
    fail("UNAVAILABLE", "Counted semantic authority is unavailable.")
  }
  const exactHead = head as Readonly<SemanticAuthoritySelectionHead>
  const expected = resolveExactSemanticAuthoritySelection(
    expectedSelection,
    expectedRoot,
  )
  if (
    expected === undefined ||
    expected !== exactHead.activeSelection ||
    expectedRoot !== exactHead.activeSelectionRoot
  ) {
    fail("MISMATCH", "Counted semantic authority has a file/head mismatch.")
  }
  return expected as Readonly<CompleteSemanticAuthoritySelection>
}
