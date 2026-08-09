/* eslint-disable no-restricted-imports -- Offline regression admission must bind the selected runtime-service implementation without widening its production barrel. */
import { Buffer } from "node:buffer"
import {
  createHash,
  generateKeyPairSync,
  randomBytes,
  sign,
} from "node:crypto"
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  openSync,
  readFileSync,
  readSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import { arch, cpus, freemem, platform, release, totalmem } from "node:os"
import path from "node:path"
import {
  execFile,
  execFileSync,
  spawn,
  type ChildProcessWithoutNullStreams,
} from "node:child_process"
import { fileURLToPath } from "node:url"
import {
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES,
  decodeV138CurrentMatrixChildProtocolV2,
  encodeV138CurrentMatrixChildProtocolV2Ready,
  encodeV138CurrentMatrixChildProtocolV2Terminal,
  reduceV138CurrentMatrixChildProtocolV2Observation,
} from "./v1-38-current-matrix-child-protocol.js"
import {
  type V138FoundationAdmissionPassed,
} from "./v1-38-foundation-admission.js"
import {
  V138_DARWIN_HEADROOM_METRIC_ID,
  V138_DARWIN_HEADROOM_PARSER_ID,
  V138_DARWIN_HEADROOM_PROVIDER_ID,
  V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS,
  MEMORY_PRESSURE_Q_REQUEST,
  observeDarwinHeadroomOwned,
  type MemoryPressureQCommandResult,
  type V138DarwinHeadroomResult,
} from "./v1-38-darwin-headroom.js"
import {
  createPreparedRuntimeServiceDependenciesV118,
  executePreparedRuntimeServiceRequestV118,
  hashRuntimeAuthoritySchedulingDecisionReference,
  type PreparedRuntimeServiceExecutionV118,
} from "../../apps/runtime-service/src/execute-match.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  VerifiedMountedRuntimeEvidenceAuthority,
} from "../../apps/runtime-service/src/runtime-evidence-authority.js"
import { createRuntimeServiceConfig } from "../../apps/runtime-service/src/runtime-config.js"
import {
  ADVANCED_STRATEGY_DEFINITIONS,
  buildAdvancedStrategyRevision,
} from "../../packages/persistence/src/advanced-strategies.js"
import {
  CANONICAL_ARENA_CATALOG_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  DEFAULT_RUNTIME_LIMITS,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  RUNTIME_EXECUTION_SERVICE_VERSION,
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticTupleV118,
  createSetScenarioV137,
  hashExecutableLaneIdentity,
  hashCanonicalIdentity,
  encodeCanonicalJson,
  parseRuntimeEvidenceAuthorityPayload,
  type ExecutableLaneIdentity,
  type RuntimeEntrantAuthorityReference,
  type JsonValue,
  type RuntimeCertificateReferenceV118,
  type RuntimeExecutionServiceRequest,
  type RuntimeExecutionServiceRequestV118,
  type StrategyRevision,
} from "@cowards/spec"
import {
  checkV138Plan26221AuthorizationV3,
  checkV138Plan26218AuthorizationV2,
  checkV138CanonicalParentChain,
  checkV138Plan26215Authorization,
  checkV138SuccessorSealCommit,
  checkV138SuccessorSealCommitV2,
  checkV138SuccessorSealCommitV3,
  checkV138SuccessorSourceSeal,
  checkV138SuccessorSourceSealV2,
  checkV138SuccessorSourceSealV3,
  checkV138SealedWorktreeAtA2,
  checkV138SealedWorktreeAtA3,
  checkV138SealedWorktreeAtA4,
  checkV138Plan26224AuthorizationV4,
  checkV138SuccessorSealCommitV4,
  checkV138SuccessorSourceSealV4,
  checkV138SealedWorktreeAtA5,
  checkV138Plan26229AuthorizationV5,
  checkV138SuccessorSealCommitV5,
  checkV138SuccessorSourceSealV5,
  checkV138SuccessorSourceSealV5Except,
  inspectV138SuccessorSealCommitV5Anchor,
  deriveV138ToolIdentityRoot,
  deriveV138FormationAbsenceRoot,
  deriveV138ProtectedHistoryV5,
  registerV138Plan26222AuthoritativeBranchChecker,
  validateV138CanonicalParentChain,
  V138_PLAN_262_18_CANONICAL_PATHS,
  V138_PLAN_262_19_FRESH_DESTINATIONS,
  V138_PLAN_262_21_CANONICAL_PATHS,
  V138_PLAN_262_22_FRESH_DESTINATIONS,
  V138_PLAN_262_25_FRESH_DESTINATIONS,
  V138_PLAN_262_29_CANONICAL_PATHS,
  V138_PLAN_262_30_FRESH_DESTINATIONS,
  V138_PLAN_262_24_AUTHORIZATION_SCHEMA,
  V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA,
  V138_PLAN_262_29_AUTHORIZATION_SCHEMA,
  V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA,
  type V138Plan26218AuthorizationV2,
  type V138CanonicalParentChain,
  type V138Plan26215Authorization,
  type V138SourceB2Custody,
  type V138SourceBCustody,
  type V138SuccessorSourceSealV2,
  type V138SuccessorSourceSeal,
} from "./v1-38-successor-source-seal.js"

const FIXTURE_PURPOSE = "regression_throughput_only" as const
const HISTORICAL_MATRIX_SOURCE =
  ".planning/artifacts/v2.0-core-rules-audit/run-current-meta-matrix.ts"
const HISTORICAL_MATRIX_README =
  ".planning/artifacts/v2.0-core-rules-audit/README.md"
const HISTORICAL_EXPECTATION_ARTIFACT =
  ".planning/artifacts/v1.38-historical-matrix-expectation.json"
const MATRIX_SCHEMA_VERSION = "v1.38-current-matrix-inventory-v1" as const
const FIXED_EVALUATION_INSTANT = "2026-07-28T00:00:00.000Z"
const FIXED_AUTHORITY_GENERATION = "0"
const FIXED_AUTHORITY_BUNDLE_HASH = sha256Text(
  "v1.38-current-matrix-authority-v1",
)
const FIXED_PUBLICATION = {
  publicationId: "publication:v138-matrix:v1",
  installReceiptId: "install:v138-matrix:v1",
  payloadSha256: FIXED_AUTHORITY_BUNDLE_HASH,
  envelopeSha256: sha256Text("v1.38-matrix-authority-envelope-v1"),
  sourceManifestHash: sha256Text("v1.38-matrix-authority-source-manifest-v1"),
} as const
const FIXED_LEDGER_PRESTATE_ROOT = sha256Text("v1.38-matrix-ledger-prestate-v1")
function sha256Text(value: string): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`
}

const sha256 = (value: string | Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

type Sha256 = `sha256:${string}`

export interface V138HistoricalMatrixExpectation {
  readonly schemaVersion: "v1.38-historical-matrix-expectation-v1"
  readonly predicateVersion: "v1.38-historical-matrix-predicate-v1"
  readonly provenance: Readonly<{
    archiveCommit: string
    reviewedCodeSnapshot: string
    sourcePath: typeof HISTORICAL_MATRIX_README
    sourceBlobOid: string
    sourceSha256: Sha256
    runnerPath: typeof HISTORICAL_MATRIX_SOURCE
    runnerBlobOid: string
    runnerSourceSha256: Sha256
    derivationSourceRoot: Sha256
  }>
  readonly declaredResults: Readonly<{
    definitionCount: 10
    unorderedPairCount: 45
    configuredArenaCount: 3
    seedParityCount: 2
    mirroredSides: true
    totalMatchCount: 540
    leaders: readonly [
      Readonly<{
        strategyId: "advanced:stonewall-shear"
        wins: 62
        losses: 44
        draws: 2
      }>,
      Readonly<{
        strategyId: "advanced:vanguard-pressure"
        wins: 62
        losses: 44
        draws: 2
      }>,
    ]
    thirdPlace: Readonly<{
      strategyId: "advanced:rear-guard-sentinel"
      wins: 57
      losses: 51
      draws: 0
    }>
    majorityEdgeCycleCount: 9
    arenaRecordEquality: Readonly<{
      leftArenaLabel: "Smoke"
      rightArenaLabel: "Open Field"
      scope: "per_strategy_wins_losses_draws"
    }>
  }>
  readonly historicalExpectationRoot: Sha256
}

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  }).trim()

const gitBlob = (
  repoRoot: string,
  commit: string,
  repoPath: string,
): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], {
    cwd: repoRoot,
    maxBuffer: 8 * 1024 * 1024,
  })

const HISTORICAL_FOUNDATION_ADMISSION = Object.freeze({
  producingCommit: "d5bfb7e28112702ea0e37a4f6ffd3d9b781ac3ad",
  path: ".planning/artifacts/v1.38-foundation-admission.json",
  blob: "4f85041061488b3222ef37474ecc4ef75f9e271b",
  byteLength: 963,
  sha256:
    "sha256:1017d27d502ba27588479243613a7bd719a3ee6bb0bdf183d6aa3ade3c2dc196" as Sha256,
  admissionRoot:
    "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c" as Sha256,
})

export interface V138HistoricalAdmissionGitObjects {
  readonly resolveCommitPath: (input: Readonly<{
    producingCommit: string
    sourcePath: string
  }>) => Readonly<{ blob: string; content: Uint8Array }>
}

export const checkV138HistoricalFoundationAdmission = (
  repoRoot: string,
  gitObjects: V138HistoricalAdmissionGitObjects = {
    resolveCommitPath: ({ producingCommit, sourcePath }) => ({
      blob: git(repoRoot, ["rev-parse", `${producingCommit}:${sourcePath}`]),
      content: gitBlob(repoRoot, producingCommit, sourcePath),
    }),
  },
): V138FoundationAdmissionPassed => {
  try {
    const sealed = gitObjects.resolveCommitPath({
      producingCommit: HISTORICAL_FOUNDATION_ADMISSION.producingCommit,
      sourcePath: HISTORICAL_FOUNDATION_ADMISSION.path,
    })
    const headBlob = git(repoRoot, [
      "rev-parse",
      `HEAD:${HISTORICAL_FOUNDATION_ADMISSION.path}`,
    ])
    const target = path.resolve(repoRoot, HISTORICAL_FOUNDATION_ADMISSION.path)
    const pathStat = lstatSync(target)
    if (!pathStat.isFile() || pathStat.isSymbolicLink()) {
      throw new TypeError()
    }
    const descriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    let workingBytes: Buffer
    try {
      const opened = fstatSync(descriptor)
      if (
        !opened.isFile() ||
        opened.dev !== pathStat.dev ||
        opened.ino !== pathStat.ino
      ) throw new TypeError()
      workingBytes = readFileSync(descriptor)
    } finally {
      closeSync(descriptor)
    }
    const sealedBytes = Buffer.from(sealed.content)
    const parsed = JSON.parse(sealedBytes.toString("utf8")) as
      V138FoundationAdmissionPassed
    if (
      sealed.blob !== HISTORICAL_FOUNDATION_ADMISSION.blob ||
      headBlob !== HISTORICAL_FOUNDATION_ADMISSION.blob ||
      sealedBytes.byteLength !== HISTORICAL_FOUNDATION_ADMISSION.byteLength ||
      sha256(sealedBytes) !== HISTORICAL_FOUNDATION_ADMISSION.sha256 ||
      !workingBytes.equals(sealedBytes) ||
      parsed.schemaVersion !== "v1.38-foundation-admission-v1" ||
      parsed.status !== "passed_exact" ||
      parsed.admissionRoot !== HISTORICAL_FOUNDATION_ADMISSION.admissionRoot
    ) throw new TypeError()
    return deepFreeze(cloneCanonical(parsed))
  } catch {
    throw new TypeError("MATRIX_HISTORICAL_ADMISSION_INVALID")
  }
}

const verifiedFoundationAdmission = (
  repoRoot: string,
): V138FoundationAdmissionPassed =>
  checkV138HistoricalFoundationAdmission(path.resolve(repoRoot))

// BEGIN V1.38 HISTORICAL EXPECTATION DERIVATION SOURCE
const onlyMatch = (source: string, pattern: RegExp): RegExpMatchArray => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))]
  if (matches.length !== 1) {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_AMBIGUOUS")
  }
  return matches[0]!
}

const deriveHistoricalDeclarations = (
  readmeBytes: Uint8Array,
): V138HistoricalMatrixExpectation["declaredResults"] => {
  const source = Buffer.from(readmeBytes).toString("utf8")
  const reviewedCodeSnapshot = onlyMatch(
    source,
    /^Reviewed code snapshot: `([0-9a-f]{40})`$/mu,
  )[1]
  if (reviewedCodeSnapshot !== "38f4a83db9298502c12db44cd66d026878803d20") {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_DECLARATION_INVALID")
  }
  const exactLines = [
    "- 10 Advanced Strategy definitions",
    "- 45 unordered pairings",
    "- 3 configured arenas",
    "- 2 seed parities",
    "- mirrored sides",
    "- 540 total Matches",
  ]
  for (const line of exactLines) {
    onlyMatch(source, new RegExp(`^${line}$`, "mu"))
  }
  const rows = [
    onlyMatch(
      source,
      /^\| `advanced:stonewall-shear` \| 62-44-2 \| 57\.4% \|$/mu,
    ),
    onlyMatch(
      source,
      /^\| `advanced:vanguard-pressure` \| 62-44-2 \| 57\.4% \|$/mu,
    ),
    onlyMatch(
      source,
      /^\| `advanced:rear-guard-sentinel` \| 57-51-0 \| 52\.8% \|$/mu,
    ),
  ]
  if (rows.some((row) => row[0] === undefined)) {
    throw new TypeError("MATRIX_EXPECTATION_SOURCE_DECLARATION_INVALID")
  }
  onlyMatch(
    source,
    /^The matrix found nine majority-edge non-transitive three-cycles, but neither leading Strategy had a majority-losing matchup\. All detected cycles were below the leading pair\. Smoke and Open Field produced identical per-Strategy records because both are empty geometries\.$/mu,
  )
  return {
    definitionCount: 10,
    unorderedPairCount: 45,
    configuredArenaCount: 3,
    seedParityCount: 2,
    mirroredSides: true,
    totalMatchCount: 540,
    leaders: [
      {
        strategyId: "advanced:stonewall-shear",
        wins: 62,
        losses: 44,
        draws: 2,
      },
      {
        strategyId: "advanced:vanguard-pressure",
        wins: 62,
        losses: 44,
        draws: 2,
      },
    ],
    thirdPlace: {
      strategyId: "advanced:rear-guard-sentinel",
      wins: 57,
      losses: 51,
      draws: 0,
    },
    majorityEdgeCycleCount: 9,
    arenaRecordEquality: {
      leftArenaLabel: "Smoke",
      rightArenaLabel: "Open Field",
      scope: "per_strategy_wins_losses_draws",
    },
  }
}

const derivationSourceRoot = (): Sha256 => {
  const source = readFileSync(new URL(import.meta.url), "utf8")
  const match = source.match(
    /\/\/ BEGIN V1\.38 HISTORICAL EXPECTATION DERIVATION SOURCE\n([\s\S]*?)\/\/ END V1\.38 HISTORICAL EXPECTATION DERIVATION SOURCE/u,
  )
  if (match?.[1] === undefined) {
    throw new TypeError("MATRIX_EXPECTATION_DERIVATION_SOURCE_MISSING")
  }
  return sha256(match[1])
}

export const deriveV138HistoricalMatrixExpectation = (
  repoRoot: string,
): Readonly<V138HistoricalMatrixExpectation> => {
  const admission = verifiedFoundationAdmission(repoRoot)
  const archiveCommit = admission.archiveCommit
  const sourceBytes = gitBlob(repoRoot, archiveCommit, HISTORICAL_MATRIX_README)
  const runnerBytes = gitBlob(repoRoot, archiveCommit, HISTORICAL_MATRIX_SOURCE)
  const sourceBlobOid = git(repoRoot, [
    "rev-parse",
    `${archiveCommit}:${HISTORICAL_MATRIX_README}`,
  ])
  const runnerBlobOid = git(repoRoot, [
    "rev-parse",
    `${archiveCommit}:${HISTORICAL_MATRIX_SOURCE}`,
  ])
  const reviewedCodeSnapshot = onlyMatch(
    sourceBytes.toString("utf8"),
    /^Reviewed code snapshot: `([0-9a-f]{40})`$/mu,
  )[1]!
  const withoutRoot = {
    schemaVersion: "v1.38-historical-matrix-expectation-v1" as const,
    predicateVersion: "v1.38-historical-matrix-predicate-v1" as const,
    provenance: {
      archiveCommit,
      reviewedCodeSnapshot,
      sourcePath: HISTORICAL_MATRIX_README,
      sourceBlobOid,
      sourceSha256: sha256(sourceBytes),
      runnerPath: HISTORICAL_MATRIX_SOURCE,
      runnerBlobOid,
      runnerSourceSha256: sha256(runnerBytes),
      derivationSourceRoot: derivationSourceRoot(),
    },
    declaredResults: deriveHistoricalDeclarations(sourceBytes),
  }
  return deepFreeze({
    ...withoutRoot,
    historicalExpectationRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138HistoricalMatrixExpectation>
}
// END V1.38 HISTORICAL EXPECTATION DERIVATION SOURCE

export const validateV138HistoricalMatrixExpectation = (
  repoRoot: string,
  input: unknown,
): Readonly<V138HistoricalMatrixExpectation> => {
  const expected = deriveV138HistoricalMatrixExpectation(repoRoot)
  if (canonical(input) !== canonical(expected)) {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  return expected
}

export const loadV138HistoricalMatrixExpectation = (
  repoRoot: string,
): Readonly<V138HistoricalMatrixExpectation> => {
  const bytes = readFileSync(
    path.resolve(repoRoot, HISTORICAL_EXPECTATION_ARTIFACT),
    "utf8",
  )
  let parsed: unknown
  try {
    parsed = JSON.parse(bytes)
  } catch {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  const expectation = validateV138HistoricalMatrixExpectation(repoRoot, parsed)
  if (bytes !== `${canonical(expectation)}\n`) {
    throw new TypeError("MATRIX_EXPECTATION_INVALID")
  }
  return expectation
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

const PARALLEL_PROJECTION_SOURCE = [
  "baseProjectedMilliseconds=ceil(calibrationBatchWallMilliseconds*540/8)",
  "marginMilliseconds=ceil(baseProjectedMilliseconds*750/10000)",
  "projectedTotalMilliseconds=baseProjectedMilliseconds+marginMilliseconds+60000",
  "admittedByTime=projectedTotalMilliseconds<=5400000",
].join("\n")

const PARALLEL_AGGREGATION_RULES = deepFreeze({
  calibrationBatchWall:
    "ceil_parent_monotonic_first_spawn_through_cleanup_barrier_ms",
  perChildRss: "maximum_sample_per_child_kilobytes",
  aggregateChildRss:
    "maximum_tick_sum_of_all_active_children_kilobytes",
  hostHeadroom:
    "minimum_floor_free_over_total_basis_points_across_ticks",
} as const)

const PARALLEL_ROUNDING_RULES = deepFreeze({
  observedBatchWall: "ceil_integer_milliseconds",
  baseProjection: "ceil_integer_milliseconds",
  margin: "ceil_integer_milliseconds",
  hostHeadroom: "floor_integer_basis_points",
} as const)

export interface V138ParallelCalibrationPolicy {
  readonly schemaVersion: "v1.38-parallel-calibration-policy-v1"
  readonly sampleAttemptCount: 8
  readonly sampleShardCount: 4
  readonly attemptsPerShard: 2
  readonly concurrency: 4
  readonly authoritativeAttemptDenominator: 540
  readonly marginBasisPoints: 750
  readonly fixedOverheadMilliseconds: 60_000
  readonly maxProjectedTotalMilliseconds: 5_400_000
  readonly aggregationRules: typeof PARALLEL_AGGREGATION_RULES
  readonly roundingRules: typeof PARALLEL_ROUNDING_RULES
  readonly admissionComparator: "inclusive_less_than_or_equal"
  readonly projectionSourceRoot: Sha256
  readonly inventory: Readonly<{
    attempts: readonly Readonly<{
      calibrationAttemptId: string
      templateAttemptId: string
      shardId: string
      laneId: string
      ordinalInShard: number
      requestSha256: Sha256
    }>[]
    shards: readonly Readonly<{
      shardId: string
      laneId: string
      attemptIds: readonly string[]
    }>[]
    inventoryRoot: Sha256
  }>
  readonly policyRoot: Sha256
}

export interface V138CalibrationAttemptMapping {
  readonly publicAttemptId: string
  readonly executionAttemptId: string
  readonly templateAttemptId: string
  readonly inventoryOrdinal: number
  readonly shardId: string
}

export const deriveV138CalibrationAttemptMappings = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  version: "v5" | "v6" | "v7" | "v8" | "v9",
): readonly Readonly<V138CalibrationAttemptMapping>[] => {
  const policy = deriveV138ParallelCalibrationPolicy(inventory)
  const mappings = policy.inventory.attempts.map((attempt, index) => {
    if (
      attempt.ordinalInShard !== index % 2 ||
      attempt.shardId !== `calibration-shard:${Math.floor(index / 2)}` ||
      attempt.templateAttemptId !== inventory.attempts[index]?.attemptId
    ) {
      throw new TypeError("MATRIX_CALIBRATION_ATTEMPT_MAPPING_INVALID")
    }
    return Object.freeze({
      publicAttemptId: `calibration:${version}:${index}`,
      executionAttemptId: `calibration:${version}:${index}:${attempt.templateAttemptId}`,
      templateAttemptId: attempt.templateAttemptId,
      inventoryOrdinal: index,
      shardId: attempt.shardId,
    })
  })
  if (
    mappings.length !== 8 ||
    new Set(mappings.map(({ publicAttemptId }) => publicAttemptId)).size !== 8 ||
    new Set(mappings.map(({ executionAttemptId }) => executionAttemptId)).size !== 8
  ) {
    throw new TypeError("MATRIX_CALIBRATION_ATTEMPT_MAPPING_INVALID")
  }
  return Object.freeze(mappings)
}

const parallelPolicyWithoutRoot = (
  policy: V138ParallelCalibrationPolicy,
): Omit<V138ParallelCalibrationPolicy, "policyRoot"> => {
  const { policyRoot: _policyRoot, ...withoutRoot } = policy
  return withoutRoot
}

const invalidParallelCalibrationPolicy = (): never => {
  throw new TypeError("MATRIX_PARALLEL_CALIBRATION_POLICY_INVALID")
}

export const V138ParallelCalibrationPolicySchema = Object.freeze({
  parse(input: unknown): Readonly<V138ParallelCalibrationPolicy> {
    if (
      input === null ||
      typeof input !== "object" ||
      Array.isArray(input)
    ) {
      return invalidParallelCalibrationPolicy()
    }
    const policy = input as V138ParallelCalibrationPolicy
    if (
      canonical(Object.keys(policy)) !==
        canonical([
          "schemaVersion",
          "sampleAttemptCount",
          "sampleShardCount",
          "attemptsPerShard",
          "concurrency",
          "authoritativeAttemptDenominator",
          "marginBasisPoints",
          "fixedOverheadMilliseconds",
          "maxProjectedTotalMilliseconds",
          "aggregationRules",
          "roundingRules",
          "admissionComparator",
          "projectionSourceRoot",
          "inventory",
          "policyRoot",
        ]) ||
      policy.schemaVersion !== "v1.38-parallel-calibration-policy-v1" ||
      policy.sampleAttemptCount !== 8 ||
      policy.sampleShardCount !== 4 ||
      policy.attemptsPerShard !== 2 ||
      policy.concurrency !== 4 ||
      policy.authoritativeAttemptDenominator !== 540 ||
      policy.marginBasisPoints !== 750 ||
      policy.fixedOverheadMilliseconds !== 60_000 ||
      policy.maxProjectedTotalMilliseconds !== 5_400_000 ||
      canonical(policy.aggregationRules) !==
        canonical(PARALLEL_AGGREGATION_RULES) ||
      canonical(policy.roundingRules) !== canonical(PARALLEL_ROUNDING_RULES) ||
      policy.admissionComparator !== "inclusive_less_than_or_equal" ||
      policy.projectionSourceRoot !== sha256(PARALLEL_PROJECTION_SOURCE) ||
      policy.inventory === null ||
      typeof policy.inventory !== "object" ||
      canonical(Object.keys(policy.inventory)) !==
        canonical(["attempts", "shards", "inventoryRoot"]) ||
      !Array.isArray(policy.inventory.attempts) ||
      policy.inventory.attempts.length !== 8 ||
      !Array.isArray(policy.inventory.shards) ||
      policy.inventory.shards.length !== 4
    ) {
      return invalidParallelCalibrationPolicy()
    }
    const expectedAttempts = policy.inventory.attempts.map(
      (attempt, index) => {
        const shardOrdinal = Math.floor(index / 2)
        if (
          attempt === null ||
          typeof attempt !== "object" ||
          canonical(Object.keys(attempt)) !==
            canonical([
              "calibrationAttemptId",
              "templateAttemptId",
              "shardId",
              "laneId",
              "ordinalInShard",
              "requestSha256",
            ]) ||
          typeof attempt.templateAttemptId !== "string" ||
          attempt.calibrationAttemptId !==
            `calibration:v1:${index}:${attempt.templateAttemptId}` ||
          attempt.shardId !== `calibration-shard:${shardOrdinal}` ||
          attempt.laneId !== `lane:${shardOrdinal}` ||
          attempt.ordinalInShard !== index % 2 ||
          !/^sha256:[0-9a-f]{64}$/u.test(attempt.requestSha256)
        ) {
          return invalidParallelCalibrationPolicy()
        }
        return attempt
      },
    )
    const expectedShards = Array.from({ length: 4 }, (_, shardOrdinal) => ({
      shardId: `calibration-shard:${shardOrdinal}`,
      laneId: `lane:${shardOrdinal}`,
      attemptIds: expectedAttempts
        .slice(shardOrdinal * 2, shardOrdinal * 2 + 2)
        .map(({ calibrationAttemptId }) => calibrationAttemptId),
    }))
    if (
      canonical(policy.inventory.shards) !== canonical(expectedShards) ||
      policy.inventory.inventoryRoot !==
        sha256(canonical({ attempts: expectedAttempts, shards: expectedShards })) ||
      policy.policyRoot !==
        sha256(canonical(parallelPolicyWithoutRoot(policy)))
    ) {
      return invalidParallelCalibrationPolicy()
    }
    return deepFreeze(globalThis.structuredClone(policy))
  },
  safeParse(
    input: unknown,
  ):
    | { success: true; data: Readonly<V138ParallelCalibrationPolicy> }
    | { success: false; error: TypeError } {
    try {
      return { success: true, data: this.parse(input) }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof TypeError
            ? error
            : new TypeError("MATRIX_PARALLEL_CALIBRATION_POLICY_INVALID"),
      }
    }
  },
})

export const deriveV138ParallelCalibrationPolicy = (
  inventory: Readonly<V138CurrentMatrixInventory>,
): Readonly<V138ParallelCalibrationPolicy> => {
  if (
    inventory.attempts.length !== 540 ||
    new Set(inventory.attempts.map(({ attemptId }) => attemptId)).size !== 540
  ) {
    return invalidParallelCalibrationPolicy()
  }
  const attempts = inventory.attempts.slice(0, 8).map((attempt, index) => {
    const shardOrdinal = Math.floor(index / 2)
    return {
      calibrationAttemptId: `calibration:v1:${index}:${attempt.attemptId}`,
      templateAttemptId: attempt.attemptId,
      shardId: `calibration-shard:${shardOrdinal}`,
      laneId: `lane:${shardOrdinal}`,
      ordinalInShard: index % 2,
      requestSha256: sha256(canonical(attempt.request)),
    }
  })
  const shards = Array.from({ length: 4 }, (_, shardOrdinal) => ({
    shardId: `calibration-shard:${shardOrdinal}`,
    laneId: `lane:${shardOrdinal}`,
    attemptIds: attempts
      .slice(shardOrdinal * 2, shardOrdinal * 2 + 2)
      .map(({ calibrationAttemptId }) => calibrationAttemptId),
  }))
  const inventoryManifest = {
    attempts,
    shards,
    inventoryRoot: sha256(canonical({ attempts, shards })),
  }
  const withoutRoot = {
    schemaVersion: "v1.38-parallel-calibration-policy-v1" as const,
    sampleAttemptCount: 8 as const,
    sampleShardCount: 4 as const,
    attemptsPerShard: 2 as const,
    concurrency: 4 as const,
    authoritativeAttemptDenominator: 540 as const,
    marginBasisPoints: 750 as const,
    fixedOverheadMilliseconds: 60_000 as const,
    maxProjectedTotalMilliseconds: 5_400_000 as const,
    aggregationRules: PARALLEL_AGGREGATION_RULES,
    roundingRules: PARALLEL_ROUNDING_RULES,
    admissionComparator: "inclusive_less_than_or_equal" as const,
    projectionSourceRoot: sha256(PARALLEL_PROJECTION_SOURCE),
    inventory: inventoryManifest,
  }
  return V138ParallelCalibrationPolicySchema.parse({
    ...withoutRoot,
    policyRoot: sha256(canonical(withoutRoot)),
  })
}

export interface V138ParallelProjection {
  readonly schemaVersion: "v1.38-parallel-matrix-projection-v1"
  readonly policyRoot: Sha256
  readonly projectionSourceRoot: Sha256
  readonly calibrationBatchWallMilliseconds: number
  readonly childMaxRssKilobytes: readonly [number, number, number, number]
  readonly aggregateChildRssKilobytes: number
  readonly minimumHostHeadroomBasisPoints: number
  readonly baseProjectedMilliseconds: number
  readonly marginMilliseconds: number
  readonly projectedTotalMilliseconds: number
  readonly admittedByTime: boolean
  readonly projectionRoot: Sha256
}

export const isV138ParallelProjectedTotalAdmitted = (
  projectedTotalMilliseconds: number,
): boolean =>
  Number.isSafeInteger(projectedTotalMilliseconds) &&
  projectedTotalMilliseconds >= 0 &&
  projectedTotalMilliseconds <= 5_400_000

export const projectV138ParallelMatrix = (
  rawPolicy: Readonly<V138ParallelCalibrationPolicy>,
  observation: Readonly<{
    calibrationBatchWallMilliseconds: number
    childMaxRssKilobytes: readonly number[]
    aggregateChildRssKilobytes: number
    minimumHostHeadroomBasisPoints: number
  }>,
): Readonly<V138ParallelProjection> => {
  const policy = V138ParallelCalibrationPolicySchema.parse(rawPolicy)
  if (
    !Number.isSafeInteger(observation.calibrationBatchWallMilliseconds) ||
    observation.calibrationBatchWallMilliseconds < 0 ||
    !Array.isArray(observation.childMaxRssKilobytes) ||
    observation.childMaxRssKilobytes.length !== 4 ||
    !observation.childMaxRssKilobytes.every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    ) ||
    !Number.isSafeInteger(observation.aggregateChildRssKilobytes) ||
    observation.aggregateChildRssKilobytes < 0 ||
    !Number.isSafeInteger(observation.minimumHostHeadroomBasisPoints) ||
    observation.minimumHostHeadroomBasisPoints < 0 ||
    observation.minimumHostHeadroomBasisPoints > 10_000
  ) {
    throw new TypeError("MATRIX_PARALLEL_PROJECTION_INVALID")
  }
  const baseProjectedMilliseconds = Math.ceil(
    (observation.calibrationBatchWallMilliseconds *
      policy.authoritativeAttemptDenominator) /
      policy.sampleAttemptCount,
  )
  const marginMilliseconds = Math.ceil(
    (baseProjectedMilliseconds * policy.marginBasisPoints) / 10_000,
  )
  const projectedTotalMilliseconds =
    baseProjectedMilliseconds +
    marginMilliseconds +
    policy.fixedOverheadMilliseconds
  const withoutRoot = {
    schemaVersion: "v1.38-parallel-matrix-projection-v1" as const,
    policyRoot: policy.policyRoot,
    projectionSourceRoot: policy.projectionSourceRoot,
    calibrationBatchWallMilliseconds:
      observation.calibrationBatchWallMilliseconds,
    childMaxRssKilobytes: [
      observation.childMaxRssKilobytes[0]!,
      observation.childMaxRssKilobytes[1]!,
      observation.childMaxRssKilobytes[2]!,
      observation.childMaxRssKilobytes[3]!,
    ] as const,
    aggregateChildRssKilobytes: observation.aggregateChildRssKilobytes,
    minimumHostHeadroomBasisPoints:
      observation.minimumHostHeadroomBasisPoints,
    baseProjectedMilliseconds,
    marginMilliseconds,
    projectedTotalMilliseconds,
    admittedByTime: isV138ParallelProjectedTotalAdmitted(
      projectedTotalMilliseconds,
    ),
  }
  return deepFreeze({
    ...withoutRoot,
    projectionRoot: sha256(canonical(withoutRoot)),
  })
}

export interface V138ParallelMatrixPlan {
  readonly schemaVersion: "v1.38-parallel-matrix-plan-v1"
  readonly maxConcurrentShards: 4
  readonly maxAttemptsPerShard: 4
  readonly attemptCount: 540
  readonly inventoryRoot: Sha256
  readonly shards: readonly Readonly<{
    shardId: string
    laneId: "lane:0" | "lane:1" | "lane:2" | "lane:3"
    ordinal: number
    attemptIds: readonly string[]
    requestRoot: Sha256
  }>[]
  readonly planRoot: Sha256
}

export const planV138MatrixShards = (
  inventory: Readonly<V138CurrentMatrixInventory>,
): Readonly<V138ParallelMatrixPlan> => {
  const attemptIds = inventory.attempts.map(({ attemptId }) => attemptId)
  if (
    attemptIds.length !== 540 ||
    new Set(attemptIds).size !== 540
  ) {
    throw new TypeError("MATRIX_PARALLEL_PLAN_INVALID")
  }
  const shards = Array.from({ length: 135 }, (_, ordinal) => {
    const attempts = inventory.attempts.slice(ordinal * 4, ordinal * 4 + 4)
    const laneId = `lane:${ordinal % 4}` as const
    return {
      shardId: `matrix-shard:${String(ordinal).padStart(3, "0")}`,
      laneId,
      ordinal,
      attemptIds: attempts.map(({ attemptId }) => attemptId),
      requestRoot: sha256(
        canonical(
          attempts.map(({ attemptId, request }) => ({
            attemptId,
            request: canonical(request),
          })),
        ),
      ),
    }
  })
  const inventoryRoot = sha256(
    canonical(
      inventory.attempts.map(({ attemptId, request }) => ({
        attemptId,
        requestSha256: sha256(canonical(request)),
      })),
    ),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-parallel-matrix-plan-v1" as const,
    maxConcurrentShards: 4 as const,
    maxAttemptsPerShard: 4 as const,
    attemptCount: 540 as const,
    inventoryRoot,
    shards,
  }
  return deepFreeze({
    ...withoutRoot,
    planRoot: sha256(canonical(withoutRoot)),
  })
}

export type V138ParallelChargedOutcome =
  | V138CurrentMatrixAttemptOutcome
  | Readonly<{
      attemptId: string
      classification: "timeout" | "cancelled"
      code: string
    }>

export interface V138ParallelShardTerminal {
  readonly shardId: string
  readonly laneId: string
  readonly classification: "success" | "failed" | "cancelled"
  readonly elapsedMilliseconds: number
  readonly maxRssKilobytes: number
  readonly cleanup: Readonly<{
    gracefulTerminationSent: boolean
    forceTerminationSent: boolean
    exitAwaited: boolean
    orphanProcessIds: readonly number[]
  }>
  readonly outcomes: readonly V138ParallelChargedOutcome[]
}

const V138_PARALLEL_INTEGRITY_FAILURE_FAMILIES = new Set([
  "CHILD_BOOTSTRAP_FAILED",
  "CHILD_TRANSPORT_FAILED",
  "RUNTIME_EXECUTION_FAILED",
  "SHARD_COORDINATION_FAILED",
] as const)

/**
 * Produces the bounded operator/lab projection for a failed four-shard
 * calibration allocation. The ordinary receipts continue to expose only the
 * coarse SHARD_EXECUTION_FAILED reason; this projection deliberately contains
 * no child output, exception detail, process identity, or runtime payload.
 */
export const reduceV138ParallelIntegrityFailureProjection = (
  terminals: readonly Readonly<V138ParallelShardTerminal>[],
) => {
  const canonicalTerminals = [...terminals].sort((left, right) =>
    left.shardId.localeCompare(right.shardId),
  )
  const outcomes = canonicalTerminals.flatMap(({ outcomes: values }) => values)
  const familyOutcomes = outcomes.filter((outcome) =>
    outcome.classification === "system_failure" &&
      V138_PARALLEL_INTEGRITY_FAILURE_FAMILIES.has(outcome.code as never),
  )
  const families = new Set(familyOutcomes.map(({ code }) => code))
  const malformed =
    canonicalTerminals.length !== 4 ||
    new Set(canonicalTerminals.map(({ shardId }) => shardId)).size !== 4 ||
    outcomes.length !== 8 ||
    new Set(outcomes.map(({ attemptId }) => attemptId)).size !== 8 ||
    familyOutcomes.length === 0 ||
    outcomes.some(({ classification }) => classification === "success") ||
    canonicalTerminals.some(({ cleanup }) =>
      !cleanup.exitAwaited || cleanup.orphanProcessIds.length > 0,
    )
  const initiatingFamily = malformed || families.size !== 1
    ? "CHILD_TRANSPORT_FAILED"
    : [...families][0]!
  return deepFreeze({
    schemaVersion: "v1.38-parallel-integrity-failure-projection-v1" as const,
    publicStopReason: "SHARD_EXECUTION_FAILED" as const,
    initiatingFamily,
    initiatingFamilyCount: families.size,
    chargedAttemptCount: outcomes.length,
    terminalAttemptCount: outcomes.length,
    cancelledSiblingAttemptCount: outcomes.filter(
      ({ classification }) => classification === "cancelled",
    ).length,
    acceptedCellCount: 0 as const,
    completeCleanup: canonicalTerminals.length === 4 &&
      canonicalTerminals.every(({ cleanup }) =>
        cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
      ),
  })
}

const PRIOR_CHARGED_LINEAGE = deepFreeze({
  stoppedReceiptRoot:
    "sha256:bd64a793603ee444f8671e8391d5bd9bd4a2b494d32a2d09fce1864aed675a33",
  priorUnboundedRun: {
    classification: "system_failure_resource_pressure",
    elapsedSecondsAtTermination: 14_390,
    hostFreeMemoryPercentAtTermination: 9,
    completedAttemptCount: "unknown",
    partialResultsDiscarded: true,
  },
  priorSerialCalibration: {
    attemptCount: 1,
    elapsedMilliseconds: 35_812,
    maxRssKilobytes: 721_088,
    reusable: false,
  },
} as const)

export const reduceV138ParallelMatrixAccounting = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  plan: Readonly<V138ParallelMatrixPlan>
  terminals: readonly Readonly<V138ParallelShardTerminal>[]
  launchEvents: readonly Readonly<V138ParallelShardLaunchEvent>[]
  unlaunchedShardIds?: readonly string[]
}): Readonly<{
  schemaVersion: "v1.38-parallel-matrix-accounting-v1"
  declaredAttemptCount: 540
  launchedAttemptCount: number
  terminalAttemptCount: number
  successfulButUnacceptedCount: number
  failedAttemptCount: number
  cancelledAttemptCount: number
  unlaunchedAttemptCount: number
  acceptedCellsPublished: 0
  partialAcceptedEvidenceReusable: false
  allocationRoot: Sha256
  launchRoot: Sha256
  attemptRoot: Sha256
  shardTerminalRoot: Sha256
  progressRoot: Sha256
  cleanupRoot: Sha256
  chargedAttemptLedgerRoot: Sha256
  acceptedCellLedgerRoot: Sha256
  progressReceipts: readonly Readonly<Record<string, unknown>>[]
}> => {
  const expectedPlan = planV138MatrixShards(input.inventory)
  if (canonical(input.plan) !== canonical(expectedPlan)) {
    throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  }
  const shardById = new Map(
    expectedPlan.shards.map((shard) => [shard.shardId, shard]),
  )
  const launchByShardId = new Map<
    string,
    Readonly<V138ParallelShardLaunchEvent>
  >()
  for (const event of input.launchEvents) {
    const shard = shardById.get(event.shardId)
    if (
      shard === undefined ||
      launchByShardId.has(event.shardId) ||
      canonical(Object.keys(event)) !==
        canonical(["event", "shardId", "laneId", "executionAttemptIds"]) ||
      event.event !== "child_launched" ||
      event.laneId !== shard.laneId ||
      canonical(event.executionAttemptIds) !== canonical(shard.attemptIds)
    ) {
      throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
    }
    launchByShardId.set(event.shardId, event)
  }
  const canonicalLaunchEvents = expectedPlan.shards.flatMap((shard) => {
    const event = launchByShardId.get(shard.shardId)
    return event === undefined ? [] : [event]
  })
  const unlaunchedShardIds = [...(input.unlaunchedShardIds ?? [])]
  const terminalIds = input.terminals.map(({ shardId }) => shardId)
  const expectedUnlaunchedShardIds = expectedPlan.shards
    .filter(({ shardId }) =>
      !launchByShardId.has(shardId) && !terminalIds.includes(shardId),
    )
    .map(({ shardId }) => shardId)
  if (
    new Set(terminalIds).size !== terminalIds.length ||
    terminalIds.some((shardId) => !shardById.has(shardId)) ||
    [...launchByShardId.keys()].some(
      (shardId) => !terminalIds.includes(shardId),
    ) ||
    canonical(unlaunchedShardIds) !== canonical(expectedUnlaunchedShardIds)
  ) {
    throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
  }
  const terminalById = new Map<string, Readonly<V138ParallelShardTerminal>>()
  for (const terminal of input.terminals) {
    const shard = shardById.get(terminal.shardId)
    if (
      shard === undefined ||
      terminalById.has(terminal.shardId) ||
      canonical(Object.keys(terminal)) !==
        canonical([
          "shardId",
          "laneId",
          "classification",
          "elapsedMilliseconds",
          "maxRssKilobytes",
          "cleanup",
          "outcomes",
        ]) ||
      terminal.laneId !== shard.laneId ||
      !["success", "failed", "cancelled"].includes(terminal.classification) ||
      !Number.isSafeInteger(terminal.elapsedMilliseconds) ||
      terminal.elapsedMilliseconds < 0 ||
      !Number.isSafeInteger(terminal.maxRssKilobytes) ||
      terminal.maxRssKilobytes < 0 ||
      typeof terminal.cleanup.gracefulTerminationSent !== "boolean" ||
      typeof terminal.cleanup.forceTerminationSent !== "boolean" ||
      typeof terminal.cleanup.exitAwaited !== "boolean" ||
      !Array.isArray(terminal.cleanup.orphanProcessIds) ||
      canonical(Object.keys(terminal.cleanup)) !==
        canonical([
          "gracefulTerminationSent",
          "forceTerminationSent",
          "exitAwaited",
          "orphanProcessIds",
        ]) ||
      !terminal.cleanup.orphanProcessIds.every(
        (pid) => Number.isSafeInteger(pid) && pid > 0,
      ) ||
      terminal.outcomes.length !== shard.attemptIds.length
    ) {
      throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
    }
    for (const outcome of terminal.outcomes) {
      const expectedKeys =
        outcome.classification === "success"
          ? ["attemptId", "classification", "outcome"]
          : outcome.classification === "system_failure"
            ? ["attemptId", "classification", "code", "retryable"]
            : ["attemptId", "classification", "code"]
      if (
        canonical(Object.keys(outcome)) !== canonical(expectedKeys) ||
        typeof outcome.attemptId !== "string" ||
        (outcome.classification === "success"
          ? !["bottom_win", "top_win", "draw"].includes(outcome.outcome)
          : typeof outcome.code !== "string" || outcome.code.length === 0) ||
        (outcome.classification === "system_failure" &&
          typeof outcome.retryable !== "boolean")
      ) {
        throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
      }
    }
    const outcomeIds = terminal.outcomes.map(({ attemptId }) => attemptId)
    if (
      new Set(outcomeIds).size !== shard.attemptIds.length ||
      outcomeIds.some((attemptId) => !shard.attemptIds.includes(attemptId))
    ) {
      throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
    }
    const classifications = terminal.outcomes.map(
      ({ classification }) => classification,
    )
    if (
      (terminal.classification === "success" &&
        classifications.some((classification) => classification !== "success")) ||
      (terminal.classification === "cancelled" &&
        !classifications.includes("cancelled")) ||
      (terminal.classification === "failed" &&
        classifications.every((classification) => classification === "success"))
    ) {
      throw new TypeError("MATRIX_PARALLEL_ACCOUNTING_INVALID")
    }
    terminalById.set(terminal.shardId, terminal)
  }
  const canonicalTerminals = expectedPlan.shards.flatMap((shard) => {
    const terminal = terminalById.get(shard.shardId)
    if (terminal === undefined) return []
    const outcomeById = new Map(
      terminal.outcomes.map((outcome) => [outcome.attemptId, outcome]),
    )
    return [
      {
        ...terminal,
        outcomes: shard.attemptIds.map((attemptId) => outcomeById.get(attemptId)!),
      },
    ]
  })
  const outcomes = canonicalTerminals.flatMap(({ outcomes }) => outcomes)
  const launchedAttemptCount = canonicalLaunchEvents.reduce(
    (count, event) => count + event.executionAttemptIds.length,
    0,
  )
  const successfulButUnacceptedCount = outcomes.filter(
    ({ classification }) => classification === "success",
  ).length
  const cancelledAttemptCount = outcomes.filter(
    ({ classification }) => classification === "cancelled",
  ).length
  const failedAttemptCount =
    outcomes.length - successfulButUnacceptedCount - cancelledAttemptCount
  const unlaunchedAttemptCount = expectedPlan.shards
    .filter(({ shardId }) => unlaunchedShardIds.includes(shardId))
    .reduce((count, { attemptIds: ids }) => count + ids.length, 0)
  let cumulativeTerminalAttempts = 0
  let cumulativeFailedAttempts = 0
  let cumulativeCancelledAttempts = 0
  const progressReceipts = canonicalTerminals.map((terminal, index) => {
    cumulativeTerminalAttempts += terminal.outcomes.length
    cumulativeFailedAttempts += terminal.outcomes.filter(
      ({ classification }) =>
        classification !== "success" && classification !== "cancelled",
    ).length
    cumulativeCancelledAttempts += terminal.outcomes.filter(
      ({ classification }) => classification === "cancelled",
    ).length
    return {
      schemaVersion: "v1.38-parallel-matrix-progress-v1",
      sequence: index,
      shardId: terminal.shardId,
      attemptIds: terminal.outcomes.map(({ attemptId }) => attemptId),
      classification: terminal.classification,
      elapsedMilliseconds: terminal.elapsedMilliseconds,
      maxRssKilobytes: terminal.maxRssKilobytes,
      cumulativeLaunchedAttempts: launchedAttemptCount,
      cumulativeTerminalAttempts,
      cumulativeFailedAttempts,
      cumulativeCancelledAttempts,
      unlaunchedAttemptCount,
      acceptedCellsPublished: 0,
      partialAcceptedEvidenceReusable: false,
    }
  })
  const roots = {
    allocationRoot: expectedPlan.planRoot,
    launchRoot: sha256(canonical(canonicalLaunchEvents)),
    attemptRoot: sha256(canonical(outcomes)),
    shardTerminalRoot: sha256(canonical(canonicalTerminals)),
    progressRoot: sha256(canonical(progressReceipts)),
    cleanupRoot: sha256(
      canonical(
        canonicalTerminals.map(({ shardId, cleanup }) => ({ shardId, cleanup })),
      ),
    ),
  }
  const withoutChargedRoot = {
    schemaVersion: "v1.38-parallel-matrix-accounting-v1" as const,
    declaredAttemptCount: 540 as const,
    launchedAttemptCount,
    terminalAttemptCount: outcomes.length,
    successfulButUnacceptedCount,
    failedAttemptCount,
    cancelledAttemptCount,
    unlaunchedAttemptCount,
    acceptedCellsPublished: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
    priorChargedLineage: PRIOR_CHARGED_LINEAGE,
    ...roots,
    acceptedCellLedgerRoot: sha256(canonical([])),
    progressReceipts,
  }
  return deepFreeze({
    ...withoutChargedRoot,
    chargedAttemptLedgerRoot: sha256(canonical(withoutChargedRoot)),
  })
}

export const V138_PARALLEL_RESOURCE_POLICY = deepFreeze({
  policyId: "v1.38-parallel-matrix-resource-policy-v1",
  maxConcurrentShards: 4,
  maxAttemptsPerShard: 4,
  maxChildRssKilobytes: 2_097_152,
  maxAggregateChildRssKilobytes: 4_194_304,
  minHostFreeMemoryBasisPoints: 2_500,
  maxShardMilliseconds: 600_000,
  maxTotalRunMilliseconds: 5_400_000,
  resourceSampleMilliseconds: 250,
  gracefulTerminationMilliseconds: 2_000,
  forcedTerminationMilliseconds: 2_000,
  partialAcceptedEvidenceReusable: false,
} as const)

export interface V138ParallelShardAssignment {
  readonly kind: "calibration" | "authoritative"
  readonly shardId: string
  readonly laneId: string
  readonly ordinal: number
  readonly attempts: readonly Readonly<{
    executionAttemptId: string
    templateAttemptId: string
    request: RuntimeExecutionServiceRequestV118
  }>[]
}

export interface V138ParallelResourceSample {
  readonly childId: string
  readonly childRssKilobytes: number
  readonly hostTotalMemoryKilobytes: number
  readonly hostFreeMemoryKilobytes: number
}

export interface V138ParallelShardLaunchEvent {
  readonly event: "child_launched"
  readonly shardId: string
  readonly laneId: string
  readonly executionAttemptIds: readonly string[]
}

export interface V138SharedDarwinObservationTick {
  readonly tickId: string
  readonly observationRoot: Sha256
  readonly observedBasisPoints: number
  readonly shardIds: readonly string[]
  readonly fanout: readonly Readonly<{
    shardId: string
    observationRoot: Sha256
  }>[]
}

export type V138SharedDarwinHeadroomObserver = () =>
  Promise<V138DarwinHeadroomResult>

export interface V138ParallelShardRunControl {
  readonly signal: AbortSignal
  readonly onLaunch: (event: V138ParallelShardLaunchEvent) => void
  readonly onResourceSample: (sample: V138ParallelResourceSample) => void
}

export interface V138ParallelShardRunner {
  run(
    shard: Readonly<V138ParallelShardAssignment>,
    control: V138ParallelShardRunControl,
  ): Promise<Readonly<V138ParallelShardTerminal>>
}

export interface V138ParallelClock {
  monotonicMilliseconds(): number
}

const defaultParallelClock: V138ParallelClock = Object.freeze({
  monotonicMilliseconds: () => Number(process.hrtime.bigint()) / 1_000_000,
})

type V138ParallelStopReason =
  | "RESOURCE_SAMPLER_SPAWN_DENIED"
  | "RESOURCE_MEASUREMENT_UNAVAILABLE"
  | "RESOURCE_POLICY_CHILD_RSS"
  | "RESOURCE_POLICY_AGGREGATE_RSS"
  | "RESOURCE_POLICY_HOST_HEADROOM"
  | "RESOURCE_POLICY_SHARD_TIMEOUT"
  | "RESOURCE_POLICY_TOTAL_TIMEOUT"
  | "SHARD_EXECUTION_FAILED"
  | "SHARD_RUNNER_EXCEPTION"
  | "CLEANUP_PROOF_FAILED"
  | "PARENT_EXCEPTION"
  | "PARENT_INTERRUPT"

const V138_PUBLIC_STOP_REASONS = new Set<V138ParallelStopReason>([
  "RESOURCE_SAMPLER_SPAWN_DENIED",
  "RESOURCE_MEASUREMENT_UNAVAILABLE",
  "RESOURCE_POLICY_CHILD_RSS",
  "RESOURCE_POLICY_AGGREGATE_RSS",
  "RESOURCE_POLICY_HOST_HEADROOM",
  "RESOURCE_POLICY_SHARD_TIMEOUT",
  "RESOURCE_POLICY_TOTAL_TIMEOUT",
  "SHARD_EXECUTION_FAILED",
  "SHARD_RUNNER_EXCEPTION",
  "CLEANUP_PROOF_FAILED",
  "PARENT_EXCEPTION",
  "PARENT_INTERRUPT",
])

interface V138SupervisedAssignmentsResult {
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly launchEvents: readonly Readonly<V138ParallelShardLaunchEvent>[]
  readonly unlaunchedShardIds: readonly string[]
  readonly stopReason: V138ParallelStopReason | null
  readonly batchWallMilliseconds: number
  readonly childMaxRssKilobytes: readonly number[]
  readonly aggregateChildRssKilobytes: number
  readonly minimumHostHeadroomBasisPoints: number
  readonly sharedObservationTicks?:
    readonly Readonly<V138SharedDarwinObservationTick>[]
}

const runnerExceptionTerminal = (
  shard: Readonly<V138ParallelShardAssignment>,
): Readonly<V138ParallelShardTerminal> => ({
  shardId: shard.shardId,
  laneId: shard.laneId,
  classification: "failed",
  elapsedMilliseconds: 0,
  maxRssKilobytes: 0,
  cleanup: {
    gracefulTerminationSent: false,
    forceTerminationSent: false,
    exitAwaited: false,
    orphanProcessIds: [],
  },
  outcomes: shard.attempts.map(({ executionAttemptId }) => ({
    attemptId: executionAttemptId,
    classification: "system_failure",
    code: "SHARD_RUNNER_EXCEPTION",
    retryable: false,
  })),
})

const parentStopReason = (
  signal: AbortSignal,
): "PARENT_EXCEPTION" | "PARENT_INTERRUPT" =>
  signal.reason === "parent_interrupt"
    ? "PARENT_INTERRUPT"
    : "PARENT_EXCEPTION"

const runV138SupervisedAssignments = async (input: {
  assignments: readonly Readonly<V138ParallelShardAssignment>[]
  runner: V138ParallelShardRunner
  clock: V138ParallelClock
  parentSignal?: AbortSignal | undefined
  sharedHeadroomObserver?: V138SharedDarwinHeadroomObserver | undefined
}): Promise<Readonly<V138SupervisedAssignmentsResult>> => {
  const controllers = new Map<string, AbortController>()
  const active = new Map<
    string,
    Promise<{
      shardId: string
      terminal: Readonly<V138ParallelShardTerminal>
      runnerException: boolean
    }>
  >()
  const childIdsByShard = new Map<string, Set<string>>()
  const activeChildRss = new Map<string, number>()
  const maxChildRss = new Map<string, number>()
  const maxShardRss = new Map<string, number>()
  const terminals: V138ParallelShardTerminal[] = []
  const launchEvents: V138ParallelShardLaunchEvent[] = []
  const sharedObservationTicks: V138SharedDarwinObservationTick[] = []
  let nextAssignment = 0
  let firstSpawnMilliseconds: number | undefined
  let stopReason: V138ParallelStopReason | null = null
  let maxAggregateChildRssKilobytes = 0
  let minimumHostHeadroomBasisPoints = 10_000
  const startedMilliseconds = input.clock.monotonicMilliseconds()

  const stop = (reason: V138ParallelStopReason): void => {
    if (stopReason !== null) return
    stopReason = reason
    for (const controller of controllers.values()) controller.abort(reason)
  }
  const onParentAbort = (): void => {
    stop(parentStopReason(input.parentSignal!))
  }
  if (input.parentSignal?.aborted) onParentAbort()
  else input.parentSignal?.addEventListener("abort", onParentAbort, {
    once: true,
  })

  const checkTotalTime = (): void => {
    const elapsed =
      input.clock.monotonicMilliseconds() - startedMilliseconds
    if (elapsed > V138_PARALLEL_RESOURCE_POLICY.maxTotalRunMilliseconds) {
      stop("RESOURCE_POLICY_TOTAL_TIMEOUT")
    }
  }

  const observeSharedHeadroom = async (): Promise<void> => {
    if (
      input.sharedHeadroomObserver === undefined ||
      active.size === 0 ||
      stopReason !== null
    ) return
    const shardIds = [...active.keys()].sort()
    let result: V138DarwinHeadroomResult
    try {
      result = await input.sharedHeadroomObserver()
    } catch {
      stop("RESOURCE_MEASUREMENT_UNAVAILABLE")
      return
    }
    if (!result.ok) {
      stop("RESOURCE_MEASUREMENT_UNAVAILABLE")
      return
    }
    const observationRoot = sha256(canonical(result.observation))
    const tick = deepFreeze({
      tickId: `shared-darwin-tick:${sharedObservationTicks.length}`,
      observationRoot,
      observedBasisPoints: result.observation.observedBasisPoints,
      shardIds: Object.freeze(shardIds),
      fanout: Object.freeze(
        shardIds.map((shardId) => Object.freeze({ shardId, observationRoot })),
      ),
    })
    sharedObservationTicks.push(tick)
    minimumHostHeadroomBasisPoints = Math.min(
      minimumHostHeadroomBasisPoints,
      result.observation.observedBasisPoints,
    )
    if (
      result.observation.observedBasisPoints <
      V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
    ) stop("RESOURCE_POLICY_HOST_HEADROOM")
  }

  const launchAvailable = (): void => {
    checkTotalTime()
    while (
      stopReason === null &&
      active.size < V138_PARALLEL_RESOURCE_POLICY.maxConcurrentShards &&
      nextAssignment < input.assignments.length
    ) {
      const shard = input.assignments[nextAssignment]!
      nextAssignment += 1
      if (
        shard.attempts.length < 1 ||
        shard.attempts.length >
          V138_PARALLEL_RESOURCE_POLICY.maxAttemptsPerShard
      ) {
        stop("SHARD_EXECUTION_FAILED")
        break
      }
      if (firstSpawnMilliseconds === undefined) {
        firstSpawnMilliseconds = input.clock.monotonicMilliseconds()
      }
      const controller = new AbortController()
      controllers.set(shard.shardId, controller)
      childIdsByShard.set(shard.shardId, new Set())
      const onLaunch = (event: V138ParallelShardLaunchEvent): void => {
        if (
          canonical(Object.keys(event)) !==
            canonical(["event", "shardId", "laneId", "executionAttemptIds"]) ||
          event.event !== "child_launched" ||
          event.shardId !== shard.shardId ||
          event.laneId !== shard.laneId ||
          canonical(event.executionAttemptIds) !==
            canonical(shard.attempts.map(({ executionAttemptId }) => executionAttemptId)) ||
          launchEvents.some(({ shardId }) => shardId === event.shardId)
        ) {
          stop("SHARD_EXECUTION_FAILED")
          return
        }
        launchEvents.push(deepFreeze({
          event: "child_launched" as const,
          shardId: event.shardId,
          laneId: event.laneId,
          executionAttemptIds: Object.freeze([...event.executionAttemptIds]),
        }))
      }
      const onResourceSample = (sample: V138ParallelResourceSample): void => {
        if (
          typeof sample.childId !== "string" ||
          sample.childId.length === 0 ||
          !Number.isSafeInteger(sample.childRssKilobytes) ||
          sample.childRssKilobytes < 0 ||
          (input.sharedHeadroomObserver === undefined &&
            (!Number.isSafeInteger(sample.hostTotalMemoryKilobytes) ||
              sample.hostTotalMemoryKilobytes <= 0 ||
              !Number.isSafeInteger(sample.hostFreeMemoryKilobytes) ||
              sample.hostFreeMemoryKilobytes < 0 ||
              sample.hostFreeMemoryKilobytes >
                sample.hostTotalMemoryKilobytes))
        ) {
          stop("RESOURCE_MEASUREMENT_UNAVAILABLE")
          return
        }
        childIdsByShard.get(shard.shardId)!.add(sample.childId)
        activeChildRss.set(sample.childId, sample.childRssKilobytes)
        maxChildRss.set(
          sample.childId,
          Math.max(
            maxChildRss.get(sample.childId) ?? 0,
            sample.childRssKilobytes,
          ),
        )
        maxShardRss.set(
          shard.shardId,
          Math.max(
            maxShardRss.get(shard.shardId) ?? 0,
            sample.childRssKilobytes,
          ),
        )
        const aggregate = [...activeChildRss.values()].reduce(
          (sum, value) => sum + value,
          0,
        )
        maxAggregateChildRssKilobytes = Math.max(
          maxAggregateChildRssKilobytes,
          aggregate,
        )
        const headroomBasisPoints =
          input.sharedHeadroomObserver === undefined
            ? Math.floor(
                (sample.hostFreeMemoryKilobytes * 10_000) /
                  sample.hostTotalMemoryKilobytes,
              )
            : minimumHostHeadroomBasisPoints
        if (
          sample.childRssKilobytes >
          V138_PARALLEL_RESOURCE_POLICY.maxChildRssKilobytes
        ) {
          stop("RESOURCE_POLICY_CHILD_RSS")
        } else if (
          aggregate >
          V138_PARALLEL_RESOURCE_POLICY.maxAggregateChildRssKilobytes
        ) {
          stop("RESOURCE_POLICY_AGGREGATE_RSS")
        } else if (
          headroomBasisPoints <
          V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
        ) {
          stop("RESOURCE_POLICY_HOST_HEADROOM")
        }
      }
      const promise = Promise.resolve()
        .then(() =>
          input.runner.run(shard, {
            signal: controller.signal,
            onLaunch,
            onResourceSample,
          }),
        )
        .then(
          (terminal) => ({
            shardId: shard.shardId,
            terminal,
            runnerException: false,
          }),
          () => ({
            shardId: shard.shardId,
            terminal: runnerExceptionTerminal(shard),
            runnerException: true,
          }),
        )
      active.set(shard.shardId, promise)
    }
  }

  launchAvailable()
  await observeSharedHeadroom()
  while (active.size > 0) {
    const completed = await Promise.race([
      ...active.values(),
      ...(input.sharedHeadroomObserver === undefined
        ? []
        : [delayMilliseconds(
            V138_PARALLEL_RESOURCE_POLICY.resourceSampleMilliseconds,
          ).then(() => undefined)]),
    ])
    if (completed === undefined) {
      await observeSharedHeadroom()
      continue
    }
    active.delete(completed.shardId)
    controllers.delete(completed.shardId)
    for (const childId of childIdsByShard.get(completed.shardId) ?? []) {
      activeChildRss.delete(childId)
    }
    childIdsByShard.delete(completed.shardId)
    terminals.push(completed.terminal)
    if (completed.runnerException) {
      stop("SHARD_RUNNER_EXCEPTION")
    } else if (
      completed.terminal.elapsedMilliseconds >
      V138_PARALLEL_RESOURCE_POLICY.maxShardMilliseconds
    ) {
      stop("RESOURCE_POLICY_SHARD_TIMEOUT")
    } else if (
      !completed.terminal.cleanup.exitAwaited ||
      completed.terminal.cleanup.orphanProcessIds.length > 0
    ) {
      stop("CLEANUP_PROOF_FAILED")
    } else if (completed.terminal.classification === "failed") {
      stop("SHARD_EXECUTION_FAILED")
    } else if (
      completed.terminal.classification === "cancelled" &&
      stopReason === null
    ) {
      stop("SHARD_EXECUTION_FAILED")
    }
    checkTotalTime()
    launchAvailable()
  }
  input.parentSignal?.removeEventListener("abort", onParentAbort)
  const endMilliseconds = input.clock.monotonicMilliseconds()
  const terminalByShardId = new Map(
    terminals.map((terminal) => [terminal.shardId, terminal]),
  )
  const canonicalTerminals = input.assignments.flatMap((assignment) => {
    const terminal = terminalByShardId.get(assignment.shardId)
    return terminal === undefined ? [] : [terminal]
  })
  const launchedIds = new Set(launchEvents.map(({ shardId }) => shardId))
  const unlaunchedShardIds = input.assignments
    .filter(({ shardId }) =>
      !launchedIds.has(shardId) && !terminalByShardId.has(shardId),
    )
    .map(({ shardId }) => shardId)
  return deepFreeze({
    terminals: canonicalTerminals,
    launchEvents: Object.freeze(launchEvents),
    unlaunchedShardIds,
    stopReason,
    batchWallMilliseconds:
      firstSpawnMilliseconds === undefined
        ? 0
        : Math.ceil(Math.max(0, endMilliseconds - firstSpawnMilliseconds)),
    childMaxRssKilobytes: input.assignments.map(
      ({ shardId }) => maxShardRss.get(shardId) ?? 0,
    ),
    aggregateChildRssKilobytes: maxAggregateChildRssKilobytes,
    minimumHostHeadroomBasisPoints,
    sharedObservationTicks: Object.freeze(sharedObservationTicks),
  })
}

export interface V138ParallelCalibrationReceipt {
  readonly schemaVersion: "v1.38-parallel-calibration-receipt-v1"
  readonly status: "admitted" | "stopped_process_failure"
  readonly reason: V138ParallelStopReason | null
  readonly policyRoot: Sha256
  readonly projectionSourceRoot: Sha256
  readonly inventoryRoot: Sha256
  readonly hardwareIdentity: Readonly<{
    operatingSystem: string
    architecture: string
    nodeVersion: string
    cpuIdentity: string
  }>
  readonly rawObservation: Readonly<{
    calibrationBatchWallMilliseconds: number
    childMaxRssKilobytes: readonly [number, number, number, number]
    aggregateChildRssKilobytes: number
    minimumHostHeadroomBasisPoints: number
  }>
  readonly sharedObservationTicks:
    readonly Readonly<V138SharedDarwinObservationTick>[]
  readonly projection: Readonly<V138ParallelProjection>
  readonly terminalShardCount: number
  readonly attemptCount: 8
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly acceptedCellsPublished: 0
  readonly partialAcceptedEvidenceReusable: false
  readonly calibrationRoot: Sha256
}

const calibrationWithoutRoot = (
  receipt: V138ParallelCalibrationReceipt,
): Omit<V138ParallelCalibrationReceipt, "calibrationRoot"> => {
  const { calibrationRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

const sharedDarwinTicksAreValid = (
  ticks: readonly Readonly<V138SharedDarwinObservationTick>[] | undefined,
  minimumObservedBasisPoints: number,
  expectedShardIds: readonly string[],
): boolean => {
  if (ticks === undefined || ticks.length === 0) return false
  const expected = new Set(expectedShardIds)
  const observed = new Set<string>()
  const valid = ticks.every((tick, ordinal) => {
    const shardIds = [...tick.shardIds]
    shardIds.forEach((shardId) => observed.add(shardId))
    return (
      tick.tickId === `shared-darwin-tick:${ordinal}` &&
      /^sha256:[0-9a-f]{64}$/u.test(tick.observationRoot) &&
      Number.isSafeInteger(tick.observedBasisPoints) &&
      tick.observedBasisPoints >= 0 &&
      tick.observedBasisPoints <= 10_000 &&
      shardIds.length > 0 &&
      new Set(shardIds).size === shardIds.length &&
      shardIds.every((shardId) => expected.has(shardId)) &&
      canonical(tick.fanout) ===
        canonical(
          shardIds.map((shardId) => ({
            shardId,
            observationRoot: tick.observationRoot,
          })),
        )
    )
  })
  return valid &&
    observed.size === expected.size &&
    [...expected].every((shardId) => observed.has(shardId)) &&
    Math.min(...ticks.map(({ observedBasisPoints }) => observedBasisPoints)) ===
      minimumObservedBasisPoints
}

const calibrationReceiptIsValid = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  receipt: Readonly<V138ParallelCalibrationReceipt>,
): boolean => {
  const policy = deriveV138ParallelCalibrationPolicy(inventory)
  return (
    receipt.schemaVersion === "v1.38-parallel-calibration-receipt-v1" &&
    receipt.status === "admitted" &&
    receipt.reason === null &&
    receipt.policyRoot === policy.policyRoot &&
    receipt.projectionSourceRoot === policy.projectionSourceRoot &&
    receipt.inventoryRoot === policy.inventory.inventoryRoot &&
    receipt.attemptCount === 8 &&
    receipt.terminalShardCount === 4 &&
    receipt.acceptedCellsPublished === 0 &&
    receipt.partialAcceptedEvidenceReusable === false &&
    receipt.projection.admittedByTime &&
    receipt.projection.policyRoot === policy.policyRoot &&
    receipt.rawObservation.childMaxRssKilobytes.every(
      (rss) => rss <= V138_PARALLEL_RESOURCE_POLICY.maxChildRssKilobytes,
    ) &&
    receipt.rawObservation.aggregateChildRssKilobytes <=
      V138_PARALLEL_RESOURCE_POLICY.maxAggregateChildRssKilobytes &&
    receipt.rawObservation.minimumHostHeadroomBasisPoints >=
      V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints &&
    (receipt.sharedObservationTicks === undefined ||
      sharedDarwinTicksAreValid(
        receipt.sharedObservationTicks,
        receipt.rawObservation.minimumHostHeadroomBasisPoints,
        ["calibration-shard:0", "calibration-shard:1",
          "calibration-shard:2", "calibration-shard:3"],
      )) &&
    receipt.calibrationRoot ===
      sha256(canonical(calibrationWithoutRoot(receipt)))
  )
}

export const calibrateV138ParallelMatrix = async (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  policy?: Readonly<V138ParallelCalibrationPolicy> | undefined
  runner?: V138ParallelShardRunner | undefined
  hardwareIdentity: Readonly<{
    operatingSystem: string
    architecture: string
    nodeVersion: string
    cpuIdentity: string
  }>
  clock?: V138ParallelClock | undefined
  parentSignal?: AbortSignal | undefined
  sharedHeadroomObserver?: V138SharedDarwinHeadroomObserver | undefined
  repoRoot?: string | undefined
  executionIdentityVersion?:
    | "v1"
    | "v2"
    | "v3"
    | "v4"
    | "v5"
    | "v6"
    | "v7"
    | "v8"
    | "v9"
    | undefined
}): Promise<Readonly<V138ParallelCalibrationReceipt>> => {
  const policy = V138ParallelCalibrationPolicySchema.parse(
    input.policy ?? deriveV138ParallelCalibrationPolicy(input.inventory),
  )
  const expectedPolicy = deriveV138ParallelCalibrationPolicy(input.inventory)
  if (canonical(policy) !== canonical(expectedPolicy)) {
    throw new TypeError("MATRIX_PARALLEL_CALIBRATION_POLICY_INVALID")
  }
  if (
    canonical(Object.keys(input.hardwareIdentity)) !==
      canonical([
        "operatingSystem",
        "architecture",
        "nodeVersion",
        "cpuIdentity",
      ]) ||
    Object.values(input.hardwareIdentity).some(
      (value) => typeof value !== "string" || value.length === 0,
    )
  ) {
    throw new TypeError("MATRIX_PARALLEL_HARDWARE_IDENTITY_INVALID")
  }
  const attemptById = new Map(
    input.inventory.attempts.map((attempt) => [attempt.attemptId, attempt]),
  )
  const assignments = policy.inventory.shards.map((shard, ordinal) => ({
    kind: "calibration" as const,
    shardId: shard.shardId,
    laneId: shard.laneId,
    ordinal,
    attempts: shard.attemptIds.map((calibrationAttemptId) => {
      const record = policy.inventory.attempts.find(
        (attempt) =>
          attempt.calibrationAttemptId === calibrationAttemptId,
      )!
      const template = attemptById.get(record.templateAttemptId)
      if (
        template === undefined ||
        sha256(canonical(template.request)) !== record.requestSha256
      ) {
        throw new TypeError("MATRIX_PARALLEL_CALIBRATION_INVENTORY_INVALID")
      }
      const successorMapping =
        input.executionIdentityVersion === "v5" ||
          input.executionIdentityVersion === "v6" ||
          input.executionIdentityVersion === "v7" ||
          input.executionIdentityVersion === "v8" ||
          input.executionIdentityVersion === "v9"
          ? deriveV138CalibrationAttemptMappings(
              input.inventory,
              input.executionIdentityVersion,
            ).find(
              ({ templateAttemptId }) =>
                templateAttemptId === record.templateAttemptId,
            )
          : undefined
      if (
        (input.executionIdentityVersion === "v5" ||
          input.executionIdentityVersion === "v6" ||
          input.executionIdentityVersion === "v7" ||
          input.executionIdentityVersion === "v8" ||
          input.executionIdentityVersion === "v9") &&
        (successorMapping === undefined ||
          successorMapping.shardId !== shard.shardId)
      ) {
        throw new TypeError("MATRIX_CALIBRATION_ATTEMPT_MAPPING_INVALID")
      }
      return {
        executionAttemptId:
          input.executionIdentityVersion === "v2"
            ? record.calibrationAttemptId.replace(
                /^calibration:v1:/u,
                "calibration:v2:",
              )
            : input.executionIdentityVersion === "v3"
              ? record.calibrationAttemptId.replace(
                  /^calibration:v1:/u,
                  "calibration:v3:",
                )
              : input.executionIdentityVersion === "v4"
                ? record.calibrationAttemptId.replace(
                    /^calibration:v1:/u,
                    "calibration:v4:",
                  )
                : input.executionIdentityVersion === "v5" ||
                    input.executionIdentityVersion === "v6" ||
                    input.executionIdentityVersion === "v7" ||
                    input.executionIdentityVersion === "v8" ||
                    input.executionIdentityVersion === "v9"
                  ? successorMapping!.executionAttemptId
              : record.calibrationAttemptId,
        templateAttemptId: record.templateAttemptId,
        request: template.request,
      }
    }),
  }))
  const runner =
    input.runner ??
    createV138SubprocessShardRunner(
      input.repoRoot ??
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
    )
  const supervised = await runV138SupervisedAssignments({
    assignments,
    runner,
    clock: input.clock ?? defaultParallelClock,
    parentSignal: input.parentSignal,
    sharedHeadroomObserver: input.sharedHeadroomObserver,
  })
  const childMax = assignments.map((assignment) => {
    const sampled = supervised.childMaxRssKilobytes[assignment.ordinal]
    const terminal = supervised.terminals.find(
      ({ shardId }) => shardId === assignment.shardId,
    )
    return sampled ?? terminal?.maxRssKilobytes ?? 0
  }) as [number, number, number, number]
  const rawObservation = {
    calibrationBatchWallMilliseconds: supervised.batchWallMilliseconds,
    childMaxRssKilobytes: childMax,
    aggregateChildRssKilobytes: supervised.aggregateChildRssKilobytes,
    minimumHostHeadroomBasisPoints:
      supervised.minimumHostHeadroomBasisPoints,
  }
  const projection = projectV138ParallelMatrix(policy, rawObservation)
  const resourceAdmitted =
    childMax.every(
      (rss) => rss <= V138_PARALLEL_RESOURCE_POLICY.maxChildRssKilobytes,
    ) &&
    rawObservation.aggregateChildRssKilobytes <=
      V138_PARALLEL_RESOURCE_POLICY.maxAggregateChildRssKilobytes &&
    rawObservation.minimumHostHeadroomBasisPoints >=
      V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
  const admitted =
    supervised.stopReason === null &&
    supervised.terminals.length === 4 &&
    supervised.terminals.every(
      (terminal) => terminal.classification === "success",
    ) &&
    projection.admittedByTime &&
    resourceAdmitted
  const withoutRoot = {
    schemaVersion: "v1.38-parallel-calibration-receipt-v1" as const,
    status: admitted
      ? ("admitted" as const)
      : ("stopped_process_failure" as const),
    reason: admitted
      ? null
      : (supervised.stopReason ??
        (!projection.admittedByTime
          ? "RESOURCE_POLICY_TOTAL_TIMEOUT"
          : "SHARD_EXECUTION_FAILED")),
    policyRoot: policy.policyRoot,
    projectionSourceRoot: policy.projectionSourceRoot,
    inventoryRoot: policy.inventory.inventoryRoot,
    hardwareIdentity: input.hardwareIdentity,
    rawObservation,
    ...(input.sharedHeadroomObserver === undefined
      ? {}
      : { sharedObservationTicks: supervised.sharedObservationTicks }),
    projection,
    terminalShardCount: supervised.terminals.length,
    attemptCount: 8 as const,
    terminals: supervised.terminals,
    launchEvents: supervised.launchEvents,
    acceptedCellsPublished: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    calibrationRoot: sha256(canonical(withoutRoot)),
  })
}

/** Dedicated private operator/lab boundary. Public calibration callers use
 * calibrateV138ParallelMatrix and cannot inject diagnostic hooks. */
const calibrateV138ParallelMatrixWithOperatorEvidence = async (
  input: Parameters<typeof calibrateV138ParallelMatrix>[0],
) => {
  const receipt = await calibrateV138ParallelMatrix(input)
  const hasIntegrityFailure = receipt.terminals.some(({ outcomes }) =>
    outcomes.some((outcome) => outcome.classification === "system_failure" &&
      V138_PARALLEL_INTEGRITY_FAILURE_FAMILIES.has(outcome.code as never)))
  return deepFreeze({ receipt,
    integrityFailureProjection: receipt.status === "stopped_process_failure" &&
      hasIntegrityFailure ?
      reduceV138ParallelIntegrityFailureProjection(receipt.terminals) : null })
}

const emitV138OperatorIntegrityEvidence = (projection: ReturnType<
  typeof reduceV138ParallelIntegrityFailureProjection> | null): void => {
  if (projection === null) return
  const bytes = Buffer.from(`${canonical(projection)}\n`, "utf8")
  try { writeSync(3, bytes) } catch {
    // fd 3 is an optional private operator channel. Diagnostics must never
    // alter the deterministic public calibration outcome.
  } finally { bytes.fill(0) }
}

export type V138ParallelMatrixExecutionResult = Readonly<{
  schemaVersion: "v1.38-parallel-matrix-execution-v1"
  status: "complete_pending_publication" | "stopped_process_failure"
  reason: V138ParallelStopReason | null
  calibrationRoot: Sha256
  planRoot: Sha256
  terminals: readonly Readonly<V138ParallelShardTerminal>[]
  launchEvents: readonly Readonly<V138ParallelShardLaunchEvent>[]
  accounting: ReturnType<typeof reduceV138ParallelMatrixAccounting>
  canonicalOutcomes: readonly V138ParallelChargedOutcome[]
  batchWallMilliseconds: number
  sharedObservationTicks?:
    readonly Readonly<V138SharedDarwinObservationTick>[]
}>

export const executeV138ParallelMatrix = async (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  calibration?: Readonly<V138ParallelCalibrationReceipt> | undefined
  admittedCalibrationRoot?: Sha256 | undefined
  runner?: V138ParallelShardRunner | undefined
  clock?: V138ParallelClock | undefined
  parentSignal?: AbortSignal | undefined
  sharedHeadroomObserver?: V138SharedDarwinHeadroomObserver | undefined
  repoRoot?: string | undefined
  executionIdentityVersion?: "canonical" | "v3" | "v4" | "v5" | "v6" | "v7" | "v8" | "v9" | undefined
}): Promise<V138ParallelMatrixExecutionResult> => {
  const calibrationRoot =
    input.calibration === undefined
      ? input.admittedCalibrationRoot
      : calibrationReceiptIsValid(input.inventory, input.calibration)
        ? input.calibration.calibrationRoot
        : undefined
  if (
    calibrationRoot === undefined ||
    !/^sha256:[0-9a-f]{64}$/u.test(calibrationRoot) ||
    (input.calibration !== undefined &&
      input.admittedCalibrationRoot !== undefined &&
      input.admittedCalibrationRoot !== calibrationRoot)
  ) {
    throw new TypeError("MATRIX_PARALLEL_CALIBRATION_REQUIRED")
  }
  const plan = planV138MatrixShards(input.inventory)
  const attemptById = new Map(
    input.inventory.attempts.map((attempt) => [attempt.attemptId, attempt]),
  )
  const assignments: V138ParallelShardAssignment[] = plan.shards.map(
    (shard) => ({
      kind: "authoritative",
      shardId: shard.shardId,
      laneId: shard.laneId,
      ordinal: shard.ordinal,
      attempts: shard.attemptIds.map((attemptId) => {
        const attempt = attemptById.get(attemptId)!
        return {
          executionAttemptId:
            input.executionIdentityVersion === "v3"
              ? `reproduction:v3:${attemptId}`
              : input.executionIdentityVersion === "v4"
                ? `reproduction:v4:${attemptId}`
                : input.executionIdentityVersion === "v5" ||
                    input.executionIdentityVersion === "v6" ||
                    input.executionIdentityVersion === "v7" ||
                    input.executionIdentityVersion === "v8" ||
                    input.executionIdentityVersion === "v9"
                  ? `reproduction:${input.executionIdentityVersion}:${attemptId}`
                : attemptId,
          templateAttemptId: attemptId,
          request: attempt.request,
        }
      }),
    }),
  )
  const runner =
    input.runner ??
    createV138SubprocessShardRunner(
      input.repoRoot ??
        path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
    )
  const supervised = await runV138SupervisedAssignments({
    assignments,
    runner,
    clock: input.clock ?? defaultParallelClock,
    parentSignal: input.parentSignal,
    sharedHeadroomObserver: input.sharedHeadroomObserver,
  })
  const canonicalTerminalIds = supervised.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId:
        input.executionIdentityVersion === "v3"
          ? outcome.attemptId.replace(/^reproduction:v3:/u, "")
          : input.executionIdentityVersion === "v4"
            ? outcome.attemptId.replace(/^reproduction:v4:/u, "")
            : input.executionIdentityVersion === "v5" ||
                input.executionIdentityVersion === "v6" ||
                input.executionIdentityVersion === "v7" ||
                input.executionIdentityVersion === "v8" ||
                input.executionIdentityVersion === "v9"
              ? outcome.attemptId.replace(/^reproduction:v[56789]:/u, "")
            : outcome.attemptId,
    })),
  }))
  const canonicalLaunchEvents = supervised.launchEvents.map((event) => ({
    ...event,
    executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
      attemptId.replace(/^reproduction:v[3456789]:/u, ""),
    ),
  }))
  const accounting = reduceV138ParallelMatrixAccounting({
    inventory: input.inventory,
    plan,
    terminals: canonicalTerminalIds,
    launchEvents: canonicalLaunchEvents,
    unlaunchedShardIds: supervised.unlaunchedShardIds,
  })
  const canonicalOutcomes = supervised.terminals
    .flatMap(({ outcomes }) => outcomes)
    .sort(
      (left, right) =>
        plan.shards
          .flatMap(({ attemptIds }) => attemptIds)
          .indexOf(
            left.attemptId.replace(/^reproduction:v[3456789]:/u, ""),
          ) -
        plan.shards
          .flatMap(({ attemptIds }) => attemptIds)
          .indexOf(
            right.attemptId.replace(/^reproduction:v[3456789]:/u, ""),
          ),
    )
  const complete =
    supervised.stopReason === null &&
    accounting.terminalAttemptCount === 540 &&
    accounting.successfulButUnacceptedCount === 540 &&
    accounting.failedAttemptCount === 0 &&
    accounting.cancelledAttemptCount === 0 &&
    accounting.unlaunchedAttemptCount === 0
  return deepFreeze({
    schemaVersion: "v1.38-parallel-matrix-execution-v1" as const,
    status: complete
      ? ("complete_pending_publication" as const)
      : ("stopped_process_failure" as const),
    reason: complete ? null : supervised.stopReason ?? "SHARD_EXECUTION_FAILED",
    calibrationRoot,
    planRoot: plan.planRoot,
    terminals: supervised.terminals,
    launchEvents: supervised.launchEvents,
    accounting,
    canonicalOutcomes,
    batchWallMilliseconds: supervised.batchWallMilliseconds,
    ...(input.sharedHeadroomObserver === undefined
      ? {}
      : { sharedObservationTicks: supervised.sharedObservationTicks }),
  })
}

const RESOURCE_POLICY = deepFreeze({
  policyId: "v1.38-matrix-resource-policy-v1",
  calibrationAttemptCount: 1,
  maxProjectedTotalMilliseconds: 90 * 60 * 1_000,
  maxShardAttempts: 4,
  maxShardMilliseconds: 10 * 60 * 1_000,
  maxShardRssKilobytes: 2 * 1024 * 1024,
  progressEmission: "stderr_after_each_terminal_shard",
  partialAcceptedEvidenceReusable: false,
})

const revisionFor = (
  definition: (typeof ADVANCED_STRATEGY_DEFINITIONS)[number],
): StrategyRevision => {
  const base = buildAdvancedStrategyRevision(definition)
  return deepFreeze({
    ...base,
    metadata: {
      ...base.metadata,
      label: `${definition.name} — regression throughput fixture`,
      tags: [...(base.metadata.tags ?? []), FIXTURE_PURPOSE],
    },
  }) as StrategyRevision
}

const artifactHash = (revision: StrategyRevision): `sha256:${string}` => {
  const artifact =
    revision.metadata.sourceArtifact ?? revision.metadata.compiledArtifact
  if (artifact === undefined) {
    throw new TypeError("MATRIX_REVISION_ARTIFACT_MISSING")
  }
  return `sha256:${artifact.hash.replace(/^sha256:/u, "")}`
}

const laneIdentity = (
  revision: StrategyRevision,
  compatibility = CANONICAL_COMPATIBILITY_TUPLES.find(
    ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.19",
  )!,
): ExecutableLaneIdentity => ({
  providerId: "v1.38-matrix-typescript-provider",
  languageId: revision.runtime.language.id,
  runtimeId: "node",
  runtimeVersion:
    revision.metadata.sourceArtifact?.toolchain.runtimeVersion ??
    revision.validation.runtimeVersion,
  toolchainId:
    revision.metadata.sourceArtifact?.toolchain.language ?? "typescript",
  toolchainVersion:
    revision.metadata.sourceArtifact?.toolchain.runtimeVersion ??
    revision.runtime.language.version,
  adapterId: revision.runtime.adapter.id,
  adapterVersion: revision.runtime.adapter.version,
  policyId: "v1.38-matrix-package-none-policy",
  policyVersion: "v1",
  corpusId: "v1.38-historical-advanced-regression",
  corpusVersion: "v1",
  artifactId: `artifact:${revision.id}`,
  artifactSha256: artifactHash(revision).replace(/^sha256:/u, ""),
  implementationId: "runtime-execution-service-v1.18",
  buildId: "v1.38-matrix-reproduction-v1",
  semanticTupleId: compatibility.tupleId,
  semanticTuple: { ...compatibility.tuple },
})

const entrantEvidence = (input: {
  side: "bottom" | "top"
  attemptId: string
  entrantId: string
  revision: StrategyRevision
  compatibility: (typeof CANONICAL_COMPATIBILITY_TUPLES)[number]
}): RuntimeEntrantAuthorityReference => {
  const lane = laneIdentity(input.revision, input.compatibility)
  const entrant: RuntimeEntrantAuthorityReference = {
    entrantKey: input.entrantId,
    strategyRevisionId: input.revision.id,
    laneIdentityHash: `sha256:${hashExecutableLaneIdentity(lane)}`,
    effectiveStatus: "exhibition_only",
    schedulingDecisionId: `schedule:v138-matrix:${input.attemptId}:${input.side}`,
    schedulingDecisionHash: `sha256:${"0".repeat(64)}`,
    schedulingDecision: {
      status: "exhibition_only",
      reasonCode: "CONFORMANCE_MISSING",
      evaluatedAt: FIXED_EVALUATION_INSTANT,
      freshUntil: "2099-12-31T23:59:59.999Z",
      registryGeneration: FIXED_AUTHORITY_GENERATION,
    },
    containmentCertificateId: `certificate:v138-matrix:${input.attemptId}:${input.side}`,
    containmentCertificateHash: sha256(
      `v1.38-matrix-certificate\0${input.attemptId}\0${input.side}\0${input.revision.id}`,
    ),
  }
  return {
    ...entrant,
    schedulingDecisionHash: hashRuntimeAuthoritySchedulingDecisionReference({
      compatibilityTupleId: input.compatibility.tupleId,
      authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
      registryGeneration: FIXED_AUTHORITY_GENERATION,
      publication: FIXED_PUBLICATION,
      entrant,
    }),
  }
}

const certificateReference = (
  side: "bottom" | "top",
  attemptId: string,
  revision: StrategyRevision,
): RuntimeCertificateReferenceV118 => {
  const sourceDigest = sha256(revision.source)
  const laneIdentityHash =
    `sha256:${hashExecutableLaneIdentity(laneIdentity(revision))}` as const
  return {
    side,
    certificateId: `certificate:v138-matrix:${attemptId}:${side}`,
    certificateRecordHash: sha256(
      `v1.38-matrix-certificate\0${attemptId}\0${side}\0${revision.id}`,
    ),
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    lane: "typescript-worker-thread-regression",
    freshUntil: "2099-12-31T23:59:59.999Z",
    sourceIdentity: {
      side,
      strategyRevisionId: revision.id,
      originalSourceSha256: sourceDigest,
      normalizedSourceSha256: sha256(
        revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
      ),
      artifactSha256: artifactHash(revision),
      identityManifestRoot: laneIdentityHash,
      evidenceGraphRoot: sha256(`v1.38-matrix-supervision\0${revision.id}`),
      laneIdentityHash,
    },
  }
}

export interface V138CurrentMatrixAttempt {
  readonly attemptId: string
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly leftDefinitionId: string
  readonly rightDefinitionId: string
  readonly historicalArenaLabel: string
  readonly arenaId: string
  readonly semanticGeometryHash: `sha256:${string}`
  readonly seedLabel: "meta-even" | "meta-odd"
  readonly mirrored: boolean
  readonly bottomEntrantId: string
  readonly topEntrantId: string
  readonly initialInitiativeEntrantId: string
  readonly initialInitiativePlayerId: string
  readonly request: RuntimeExecutionServiceRequestV118
}

export interface V138CurrentMatrixInventory {
  readonly schemaVersion: typeof MATRIX_SCHEMA_VERSION
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly historicalSourceSha256: `sha256:${string}`
  readonly admissionRoot: `sha256:${string}`
  readonly definitions: readonly Readonly<{
    id: string
    sourceSha256: `sha256:${string}`
    revisionId: string
  }>[]
  readonly arenas: readonly Readonly<{
    historicalLabel: string
    arenaId: string
    semanticGeometryHash: `sha256:${string}`
    duplicateGeometryGroup: "empty-v1" | null
  }>[]
  readonly attempts: readonly V138CurrentMatrixAttempt[]
}

const admissionRoot = (repoRoot: string): `sha256:${string}` => {
  try {
    return verifiedFoundationAdmission(repoRoot).admissionRoot
  } catch {
    throw new TypeError("MATRIX_ADMISSION_INVALID")
  }
}

export const enumerateV138CurrentMatrix = (
  repoRoot: string,
): Readonly<V138CurrentMatrixInventory> => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES.find(
    ({ tuple }) => tuple.runtimeAbi === "strategy-runtime-abi-v1.19",
  )
  if (tuple === undefined) {
    throw new TypeError("MATRIX_SELECTED_TUPLE_MISSING")
  }
  const definitions = ADVANCED_STRATEGY_DEFINITIONS.map((definition) => ({
    definition,
    revision: revisionFor(definition),
  }))
  if (definitions.length !== 10) {
    throw new TypeError("MATRIX_DEFINITION_INVENTORY_INVALID")
  }
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas
  if (arenas.length !== 3) {
    throw new TypeError("MATRIX_ARENA_INVENTORY_INVALID")
  }

  const attempts: V138CurrentMatrixAttempt[] = []
  for (let leftIndex = 0; leftIndex < definitions.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < definitions.length;
      rightIndex += 1
    ) {
      const left = definitions[leftIndex]!
      const right = definitions[rightIndex]!
      for (const arena of arenas) {
        for (const seedLabel of ["meta-even", "meta-odd"] as const) {
          for (const mirrored of [false, true] as const) {
            const bottom = mirrored ? right : left
            const top = mirrored ? left : right
            const bottomEntrantId = `entrant:${bottom.definition.id}`
            const topEntrantId = `entrant:${top.definition.id}`
            const bottomPlayerId = `player:${bottom.definition.id}:bottom`
            const topPlayerId = `player:${top.definition.id}:top`
            const initialInitiativeEntrantId =
              seedLabel === "meta-even" ? bottomEntrantId : topEntrantId
            const initialInitiativePlayerId =
              seedLabel === "meta-even" ? bottomPlayerId : topPlayerId
            const scenario = createSetScenarioV137({
              arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
              arenaSemanticGeometryHash: arena.semanticGeometryHash,
              entrantA: {
                entrantKey: `entrant:${left.definition.id}`,
                playerId: mirrored ? topPlayerId : bottomPlayerId,
              },
              entrantB: {
                entrantKey: `entrant:${right.definition.id}`,
                playerId: mirrored ? bottomPlayerId : topPlayerId,
              },
              baseSeed: seedLabel,
            })
            const condition = scenario.conditions.find(
              (candidate) =>
                candidate.bottomEntrantKey === bottomEntrantId &&
                candidate.topEntrantKey === topEntrantId &&
                candidate.initialInitiativeEntrantKey ===
                  initialInitiativeEntrantId,
            )
            if (condition === undefined) {
              throw new TypeError("MATRIX_CONDITION_MISSING")
            }
            const attemptId =
              `p${leftIndex}-${rightIndex}:a${arena.id.split(":")[1]}:` +
              `${seedLabel === "meta-even" ? "e" : "o"}:` +
              `${mirrored ? "m" : "u"}`
            const evidenceSnapshot = {
              compatibility: {
                tupleId: tuple.tupleId,
                tuple: { ...tuple.tuple },
              },
              authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
              registryGeneration: FIXED_AUTHORITY_GENERATION,
              publication: FIXED_PUBLICATION,
              entrants: {
                bottom: entrantEvidence({
                  side: "bottom",
                  attemptId,
                  entrantId: bottomEntrantId,
                  revision: bottom.revision,
                  compatibility: tuple,
                }),
                top: entrantEvidence({
                  side: "top",
                  attemptId,
                  entrantId: topEntrantId,
                  revision: top.revision,
                  compatibility: tuple,
                }),
              },
            }
            const nestedRequest: RuntimeExecutionServiceRequest = {
              contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION,
              kind: "executeMatch",
              requestId: `request:v138-matrix:${attemptId}:nested`,
              match: {
                matchId: `match:v138-matrix:${attemptId}`,
                seed: seedLabel,
                arenaVariant: {
                  id: arena.id,
                  name: arena.name,
                  initialBounds: { ...arena.initialBounds },
                  terrainStones: arena.terrainStones.map((value) => ({
                    ...value,
                  })),
                },
                bottomPlayerId,
                topPlayerId,
                bottomStrategyRevisionId: bottom.revision.id,
                topStrategyRevisionId: top.revision.id,
                initialInitiativePlayerId,
                candidateMatch: {
                  semanticAuthorityKey: "runtime-v1.19",
                  matchId: `match:v138-matrix:${attemptId}`,
                  seed: seedLabel,
                  arenaVariantId: arena.id,
                  bottomStrategyRevisionId: bottom.revision.id,
                  topStrategyRevisionId: top.revision.id,
                  bottomPlayerId,
                  topPlayerId,
                  bottomEntrantKey: condition.bottomEntrantKey,
                  topEntrantKey: condition.topEntrantKey,
                  setPolicyVersion: scenario.setPolicyVersion,
                  scenarioId: scenario.scenarioId,
                  conditionId: condition.conditionId,
                  conditionOrdinal: condition.ordinal,
                  conditionSuffix: condition.suffix,
                  requestIdentity: condition.requestIdentity,
                  arenaCatalogVersion: scenario.arenaCatalogVersion,
                  arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
                  initialInitiativeEntrantKey:
                    condition.initialInitiativeEntrantKey,
                  initialInitiativePlayerId:
                    condition.initialInitiativePlayerId,
                },
              },
              strategies: {
                bottom: bottom.revision,
                top: top.revision,
              },
              limits: DEFAULT_RUNTIME_LIMITS,
              evidenceSnapshot,
            }
            const references = {
              bottom: certificateReference(
                "bottom",
                attemptId,
                bottom.revision,
              ),
              top: certificateReference("top", attemptId, top.revision),
            }
            const request: RuntimeExecutionServiceRequestV118 = {
              contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
              kind: "executeMatch",
              requestId: `request:v138-matrix:${attemptId}`,
              matchId: nestedRequest.match.matchId,
              semanticTuple: createRuntimeSemanticTupleV118(tuple.tuple),
              authorityGeneration: FIXED_AUTHORITY_GENERATION,
              evaluationInstant: FIXED_EVALUATION_INSTANT,
              certificateReferences: references,
              accounting: {
                budgetProfileRoot: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
                ledgerPrestateRoot: FIXED_LEDGER_PRESTATE_ROOT,
              },
              match: nestedRequest as unknown as JsonValue,
            }
            attempts.push(
              deepFreeze({
                attemptId,
                fixturePurpose: FIXTURE_PURPOSE,
                leftDefinitionId: left.definition.id,
                rightDefinitionId: right.definition.id,
                historicalArenaLabel: arena.name,
                arenaId: arena.id,
                semanticGeometryHash: arena.semanticGeometryHash,
                seedLabel,
                mirrored,
                bottomEntrantId,
                topEntrantId,
                initialInitiativeEntrantId,
                initialInitiativePlayerId,
                request,
              }) as V138CurrentMatrixAttempt,
            )
          }
        }
      }
    }
  }
  if (attempts.length !== 540) {
    throw new TypeError("MATRIX_ATTEMPT_INVENTORY_INVALID")
  }

  return deepFreeze({
    schemaVersion: MATRIX_SCHEMA_VERSION,
    fixturePurpose: FIXTURE_PURPOSE,
    historicalSourceSha256: sha256(
      readFileSync(path.resolve(repoRoot, HISTORICAL_MATRIX_SOURCE)),
    ),
    admissionRoot: admissionRoot(repoRoot),
    definitions: definitions.map(({ definition, revision }) => ({
      id: definition.id,
      sourceSha256: sha256(definition.source),
      revisionId: revision.id,
    })),
    arenas: arenas.map((arena) => ({
      historicalLabel: arena.name,
      arenaId: arena.id,
      semanticGeometryHash: arena.semanticGeometryHash,
      duplicateGeometryGroup:
        arena.semanticGeometryHash === arenas[0]!.semanticGeometryHash
          ? ("empty-v1" as const)
          : null,
    })),
    attempts,
  })
}

export type V138CurrentMatrixAttemptOutcome =
  | Readonly<{
      attemptId: string
      classification: "success"
      outcome: "bottom_win" | "top_win" | "draw"
    }>
  | Readonly<{
      attemptId: string
      classification: "player_violation"
      code: string
    }>
  | Readonly<{
      attemptId: string
      classification: "system_failure"
      code: string
      retryable: boolean
    }>

interface MatrixRecord {
  wins: number
  losses: number
  draws: number
}

type HistoricalArenaLabel = "Smoke" | "Standard Cross" | "Open Field"
type HistoricalArenaRecords = Record<HistoricalArenaLabel, MatrixRecord>
type MatrixAggregateRecord = MatrixRecord & {
  byHistoricalArena: HistoricalArenaRecords
}

export interface V138HistoricalMatrixObservedAggregate {
  readonly standings: readonly Readonly<
    MatrixRecord & {
      id: string
      winRateBasisPoints: number
      byHistoricalArena: HistoricalArenaRecords
    }
  >[]
  readonly nonTransitiveCycleCount: number
}

export interface V138CurrentMatrixReceipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v1"
  readonly status: "passed_exact"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly admissionRoot: `sha256:${string}`
  readonly historicalMatrixSourceSha256: `sha256:${string}`
  readonly historicalExpectationRoot: `sha256:${string}`
  readonly historicalPredicateVersion: "v1.38-historical-matrix-predicate-v1"
  readonly historicalExpectationSourceBindings: Readonly<{
    archiveCommit: string
    sourceBlobOid: string
    runnerBlobOid: string
    derivationSourceRoot: `sha256:${string}`
  }>
  readonly observedAggregateRoot: `sha256:${string}`
  readonly historicalPredicateMatched: true
  readonly arenaMapping: V138CurrentMatrixInventory["arenas"]
  readonly definitionCount: 10
  readonly unorderedPairCount: 45
  readonly historicalArenaLabelCount: 3
  readonly semanticGeometryCount: 2
  readonly seedParityCount: 2
  readonly mirroredSideCount: 2
  readonly attemptCount: 540
  readonly acceptedCellCount: 540
  readonly playerViolationCount: 0
  readonly systemFailureCount: 0
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly chargedAttemptLedgerRoot: `sha256:${string}`
  readonly acceptedCellLedgerRoot: `sha256:${string}`
  readonly reducerSourceRoot: `sha256:${string}`
  readonly aggregate: Readonly<V138HistoricalMatrixObservedAggregate>
  readonly receiptRoot: `sha256:${string}`
}

export interface V138CurrentMatrixStoppedReceipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v1"
  readonly status: "stopped_process_failure"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: "system_failure_resource_pressure"
  readonly admissionRoot: `sha256:${string}`
  readonly historicalMatrixSourceSha256: `sha256:${string}`
  readonly arenaMapping: V138CurrentMatrixInventory["arenas"]
  readonly declaredAttemptCount: 540
  readonly acceptedCellCount: 0
  readonly partialAcceptedEvidenceReusable: false
  readonly priorFailedRun: Readonly<{
    classification: "system_failure_resource_pressure"
    elapsedSecondsAtTermination: 14_390
    hostFreeMemoryPercentAtTermination: 9
    partialResultsDiscarded: true
    completedAttemptCount: "unknown"
  }>
  readonly resourcePolicy: typeof RESOURCE_POLICY
  readonly calibration: Readonly<{
    attemptCount: 1
    elapsedMilliseconds: number
    maxRssKilobytes: number
    projectedTotalMilliseconds: number
    withinTotalRunBudget: false
    withinShardMemoryBudget: boolean
    outcomeClassification: "success" | "player_violation" | "system_failure"
  }>
  readonly chargedAttemptLedgerRoot: `sha256:${string}`
  readonly acceptedCellLedgerRoot: `sha256:${string}`
  readonly reducerSourceRoot: `sha256:${string}`
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly receiptRoot: `sha256:${string}`
}

export type V138CurrentMatrixReproductionReceipt =
  | V138CurrentMatrixReceipt
  | V138CurrentMatrixStoppedReceipt

export interface V138ParallelCalibrationSuccessorReceipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v2"
  readonly status: "calibration_admitted" | "stopped_process_failure"
  readonly stage: "parallel_calibration"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: V138ParallelStopReason | null
  readonly predecessorReceiptRoot: Sha256
  readonly predecessorChargedAttemptLedgerRoot: Sha256
  readonly admissionRoot: Sha256
  readonly historicalExpectationRoot: Sha256
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly calibrationPolicyRoot: Sha256
  readonly calibrationInventoryRoot: Sha256
  readonly projectionSourceRoot: Sha256
  readonly authoritativePlanRoot: Sha256
  readonly resourcePolicyRoot: Sha256
  readonly schedulerSourceRoot: Sha256
  readonly reducerSourceRoot: Sha256
  readonly calibration: Readonly<V138ParallelCalibrationReceipt>
  readonly chargedCalibrationAttemptCount: 8
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0
  readonly fullRunLaunched: false
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const canonical = (value: unknown): string => JSON.stringify(value)

const hasExactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  canonical(Object.keys(value)) === canonical(expected)

const isRecord = (value: unknown): value is MatrixRecord =>
  hasExactKeys(value, ["wins", "losses", "draws"]) &&
  ["wins", "losses", "draws"].every((key) => {
    const count = value[key]
    return Number.isSafeInteger(count) && (count as number) >= 0
  })

const mismatch = (): never => {
  throw new TypeError("MATRIX_REPRODUCTION_MISMATCH")
}

export const evaluateV138HistoricalMatrixPredicate = (
  repoRoot: string,
  inventory: Readonly<V138CurrentMatrixInventory>,
  aggregate: unknown,
): Readonly<{
  matched: true
  predicateVersion: "v1.38-historical-matrix-predicate-v1"
  historicalExpectationRoot: Sha256
  sourceBindings: Readonly<{
    archiveCommit: string
    sourceBlobOid: string
    runnerBlobOid: string
    derivationSourceRoot: Sha256
  }>
}> => {
  let expectation: Readonly<V138HistoricalMatrixExpectation>
  try {
    expectation = loadV138HistoricalMatrixExpectation(repoRoot)
  } catch {
    return mismatch()
  }
  const declared = expectation.declaredResults
  const definitionIds = inventory.definitions.map(({ id }) => id)
  const unorderedPairs = new Set(
    inventory.attempts.map(
      ({ leftDefinitionId, rightDefinitionId }) =>
        `${leftDefinitionId}\0${rightDefinitionId}`,
    ),
  )
  if (
    inventory.definitions.length !== declared.definitionCount ||
    unorderedPairs.size !== declared.unorderedPairCount ||
    inventory.arenas.length !== declared.configuredArenaCount ||
    new Set(inventory.attempts.map(({ seedLabel }) => seedLabel)).size !==
      declared.seedParityCount ||
    new Set(inventory.attempts.map(({ mirrored }) => mirrored)).size !== 2 ||
    !declared.mirroredSides ||
    inventory.attempts.length !== declared.totalMatchCount ||
    !hasExactKeys(aggregate, ["standings", "nonTransitiveCycleCount"]) ||
    !Array.isArray(aggregate.standings) ||
    aggregate.standings.length !== declared.definitionCount ||
    aggregate.nonTransitiveCycleCount !== declared.majorityEdgeCycleCount
  ) {
    return mismatch()
  }
  const arenaLabels = inventory.arenas.map(
    ({ historicalLabel }) => historicalLabel,
  )
  if (
    canonical(arenaLabels) !==
    canonical(["Smoke", "Standard Cross", "Open Field"])
  ) {
    return mismatch()
  }
  const standings = aggregate.standings
  for (const standing of standings) {
    if (
      !hasExactKeys(standing, [
        "id",
        "wins",
        "losses",
        "draws",
        "winRateBasisPoints",
        "byHistoricalArena",
      ]) ||
      typeof standing.id !== "string" ||
      !isRecord({
        wins: standing.wins,
        losses: standing.losses,
        draws: standing.draws,
      }) ||
      !Number.isSafeInteger(standing.winRateBasisPoints) ||
      standing.wins + standing.losses + standing.draws !== 108 ||
      standing.winRateBasisPoints !==
        Math.round((standing.wins * 10_000) / 108) ||
      !hasExactKeys(standing.byHistoricalArena, arenaLabels)
    ) {
      return mismatch()
    }
    const byArena = standing.byHistoricalArena
    for (const label of arenaLabels) {
      const record = byArena[label]
      if (
        !isRecord(record) ||
        record.wins + record.losses + record.draws !== 36
      ) {
        return mismatch()
      }
    }
    const summed = arenaLabels.reduce(
      (record, label) => ({
        wins: record.wins + (byArena[label] as MatrixRecord).wins,
        losses: record.losses + (byArena[label] as MatrixRecord).losses,
        draws: record.draws + (byArena[label] as MatrixRecord).draws,
      }),
      { wins: 0, losses: 0, draws: 0 },
    )
    if (
      canonical(summed) !==
        canonical({
          wins: standing.wins,
          losses: standing.losses,
          draws: standing.draws,
        }) ||
      canonical(byArena[declared.arenaRecordEquality.leftArenaLabel]) !==
        canonical(byArena[declared.arenaRecordEquality.rightArenaLabel])
    ) {
      return mismatch()
    }
  }
  const sortedIds = [...standings]
    .sort(
      (left, right) =>
        (right.winRateBasisPoints as number) -
          (left.winRateBasisPoints as number) ||
        (left.id as string).localeCompare(right.id as string),
    )
    .map(({ id }) => id)
  if (
    canonical(standings.map(({ id }) => id)) !== canonical(sortedIds) ||
    canonical([...standings].map(({ id }) => id).sort()) !==
      canonical([...definitionIds].sort())
  ) {
    return mismatch()
  }
  const expectedLeadingRecords = [
    ...declared.leaders,
    declared.thirdPlace,
  ]
  for (const [index, expected] of expectedLeadingRecords.entries()) {
    const observed = standings[index]
    if (
      observed === undefined ||
      canonical({
        strategyId: observed.id,
        wins: observed.wins,
        losses: observed.losses,
        draws: observed.draws,
      }) !== canonical(expected)
    ) {
      return mismatch()
    }
  }
  const totals = standings.reduce(
    (result, standing) => ({
      wins: result.wins + (standing.wins as number),
      losses: result.losses + (standing.losses as number),
      draws: result.draws + (standing.draws as number),
    }),
    { wins: 0, losses: 0, draws: 0 },
  )
  if (totals.wins !== totals.losses || totals.wins * 2 + totals.draws !== 1080) {
    return mismatch()
  }
  return deepFreeze({
    matched: true as const,
    predicateVersion: expectation.predicateVersion,
    historicalExpectationRoot: expectation.historicalExpectationRoot,
    sourceBindings: {
      archiveCommit: expectation.provenance.archiveCommit,
      sourceBlobOid: expectation.provenance.sourceBlobOid,
      runnerBlobOid: expectation.provenance.runnerBlobOid,
      derivationSourceRoot: expectation.provenance.derivationSourceRoot,
    },
  })
}

const aggregateOutcomes = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  outcomes: readonly V138CurrentMatrixAttemptOutcome[],
) => {
  const records = new Map<string, MatrixAggregateRecord>(
    inventory.definitions.map(({ id }) => [
      id,
      {
        wins: 0,
        losses: 0,
        draws: 0,
        byHistoricalArena: Object.fromEntries(
          inventory.arenas.map(({ historicalLabel }) => [
            historicalLabel,
            { wins: 0, losses: 0, draws: 0 },
          ]),
        ) as HistoricalArenaRecords,
      },
    ]),
  )
  const matchupRecords = new Map<
    string,
    { left: string; right: string; leftWins: number; rightWins: number }
  >()
  const accepted = outcomes
    .filter(
      (
        outcome,
      ): outcome is Extract<
        V138CurrentMatrixAttemptOutcome,
        { classification: "success" }
      > => outcome.classification === "success",
    )
    .map((outcome) => {
      const attempt = inventory.attempts.find(
        ({ attemptId }) => attemptId === outcome.attemptId,
      )!
      const left = records.get(attempt.leftDefinitionId)!
      const right = records.get(attempt.rightDefinitionId)!
      const matchupKey = `${attempt.leftDefinitionId}\0${attempt.rightDefinitionId}`
      const matchup = matchupRecords.get(matchupKey) ?? {
        left: attempt.leftDefinitionId,
        right: attempt.rightDefinitionId,
        leftWins: 0,
        rightWins: 0,
      }
      if (outcome.outcome === "draw") {
        left.draws += 1
        right.draws += 1
        left.byHistoricalArena[
          attempt.historicalArenaLabel as HistoricalArenaLabel
        ].draws += 1
        right.byHistoricalArena[
          attempt.historicalArenaLabel as HistoricalArenaLabel
        ].draws += 1
      } else {
        const bottomWon = outcome.outcome === "bottom_win"
        const winnerId = bottomWon
          ? attempt.bottomEntrantId.replace(/^entrant:/u, "")
          : attempt.topEntrantId.replace(/^entrant:/u, "")
        const loserId =
          winnerId === attempt.leftDefinitionId
            ? attempt.rightDefinitionId
            : attempt.leftDefinitionId
        records.get(winnerId)!.wins += 1
        records.get(loserId)!.losses += 1
        records.get(winnerId)!.byHistoricalArena[
          attempt.historicalArenaLabel as HistoricalArenaLabel
        ].wins += 1
        records.get(loserId)!.byHistoricalArena[
          attempt.historicalArenaLabel as HistoricalArenaLabel
        ].losses += 1
        if (winnerId === attempt.leftDefinitionId) matchup.leftWins += 1
        else matchup.rightWins += 1
      }
      matchupRecords.set(matchupKey, matchup)
      return {
        attemptId: outcome.attemptId,
        outcome: outcome.outcome,
      }
    })

  const standings = [...records.entries()]
    .map(([id, record]) => ({
      id,
      ...record,
      winRateBasisPoints: Math.round(
        (record.wins * 10_000) /
          Math.max(1, record.wins + record.losses + record.draws),
      ),
    }))
    .sort(
      (left, right) =>
        right.winRateBasisPoints - left.winRateBasisPoints ||
        left.id.localeCompare(right.id),
    )
  const beats = new Set(
    [...matchupRecords.values()].flatMap((matchup) =>
      matchup.leftWins === matchup.rightWins
        ? []
        : [
            matchup.leftWins > matchup.rightWins
              ? `${matchup.left}>${matchup.right}`
              : `${matchup.right}>${matchup.left}`,
          ],
    ),
  )
  const ids = inventory.definitions.map(({ id }) => id)
  let nonTransitiveCycleCount = 0
  for (let first = 0; first < ids.length; first += 1) {
    for (let second = first + 1; second < ids.length; second += 1) {
      for (let third = second + 1; third < ids.length; third += 1) {
        const [a, b, c] = [ids[first]!, ids[second]!, ids[third]!]
        if (
          (beats.has(`${a}>${b}`) &&
            beats.has(`${b}>${c}`) &&
            beats.has(`${c}>${a}`)) ||
          (beats.has(`${a}>${c}`) &&
            beats.has(`${c}>${b}`) &&
            beats.has(`${b}>${a}`))
        ) {
          nonTransitiveCycleCount += 1
        }
      }
    }
  }
  return {
    accepted,
    aggregate: { standings, nonTransitiveCycleCount },
  }
}

export const reduceV138CurrentMatrix = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  outcomes: readonly V138CurrentMatrixAttemptOutcome[],
): Readonly<V138CurrentMatrixReceipt> => {
  const expectedIds = inventory.attempts.map(({ attemptId }) => attemptId)
  const actualIds = outcomes.map(({ attemptId }) => attemptId)
  if (
    outcomes.length !== 540 ||
    new Set(actualIds).size !== 540 ||
    canonical(actualIds) !== canonical(expectedIds)
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_MISMATCH")
  }
  const playerViolationCount = outcomes.filter(
    ({ classification }) => classification === "player_violation",
  ).length
  const systemFailureCount = outcomes.filter(
    ({ classification }) => classification === "system_failure",
  ).length
  const { accepted, aggregate } = aggregateOutcomes(inventory, outcomes)
  const chargedAttemptLedgerRoot = sha256(
    canonical(
      outcomes.map((outcome) =>
        outcome.classification === "success"
          ? {
              attemptId: outcome.attemptId,
              classification: outcome.classification,
              outcome: outcome.outcome,
            }
          : outcome,
      ),
    ),
  )
  const acceptedCellLedgerRoot = sha256(canonical(accepted))
  const observedAggregateRoot = sha256(
    canonical({ acceptedCellLedgerRoot, aggregate }),
  )
  if (
    playerViolationCount !== 0 ||
    systemFailureCount !== 0 ||
    accepted.length !== 540
  ) {
    throw new TypeError(
      `MATRIX_REPRODUCTION_MISMATCH:${observedAggregateRoot}:accepted=${accepted.length}:player=${playerViolationCount}:system=${systemFailureCount}:first=${outcomes.find(({ classification }) => classification !== "success")?.code ?? "none"}`,
    )
  }
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
  const predicate = evaluateV138HistoricalMatrixPredicate(
    repoRoot,
    inventory,
    aggregate,
  )
  const reducerSourceRoot = sha256(readFileSync(new URL(import.meta.url)))
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v1" as const,
    status: "passed_exact" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    admissionRoot: inventory.admissionRoot,
    historicalMatrixSourceSha256: inventory.historicalSourceSha256,
    historicalExpectationRoot: predicate.historicalExpectationRoot,
    historicalPredicateVersion: predicate.predicateVersion,
    historicalExpectationSourceBindings: predicate.sourceBindings,
    observedAggregateRoot,
    historicalPredicateMatched: true as const,
    arenaMapping: inventory.arenas,
    definitionCount: 10 as const,
    unorderedPairCount: 45 as const,
    historicalArenaLabelCount: 3 as const,
    semanticGeometryCount: 2 as const,
    seedParityCount: 2 as const,
    mirroredSideCount: 2 as const,
    attemptCount: 540 as const,
    acceptedCellCount: 540 as const,
    playerViolationCount: 0 as const,
    systemFailureCount: 0 as const,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot,
    reducerSourceRoot,
    aggregate,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138CurrentMatrixReceipt>
}

const authorityForAttempt = (
  attempt: V138CurrentMatrixAttempt,
): Readonly<VerifiedMountedRuntimeEvidenceAuthority> => {
  const nested = attempt.request
    .match as unknown as RuntimeExecutionServiceRequest
  const attestations = (["bottom", "top"] as const).map((side) => ({
    attestationId: `attestation:v138-matrix:${attempt.attemptId}:${side}`,
    attestationHash:
      attempt.request.certificateReferences[side].sourceIdentity
        .evidenceGraphRoot,
    verified: true as const,
    imports: [] as const,
  }))
  const certificates = (["bottom", "top"] as const).map((side, index) => {
    const entrant = nested.evidenceSnapshot.entrants[side]
    const revision = nested.strategies[side]
    return {
      kind: "containment" as const,
      certificateId: entrant.containmentCertificateId!,
      certificateVersion: "v1.38-matrix-containment-v1",
      certificateRecordHash: entrant.containmentCertificateHash!,
      laneIdentityHash: entrant.laneIdentityHash,
      laneIdentity: laneIdentity(revision),
      issuedAt: "2026-07-27T00:00:00.000Z",
      freshUntil: "2099-12-31T23:59:59.999Z",
      attestationIds: [attestations[index]!.attestationId],
    }
  })
  const payload = parseRuntimeEvidenceAuthorityPayload({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
    bundleVersion: "v1.38-matrix-regression-v1",
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    issuedAt: "2026-07-27T00:00:00.000Z",
    validFrom: "2026-07-27T00:00:00.000Z",
    validUntil: "2099-12-31T23:59:59.999Z",
    semanticTupleManifestHash: nested.evidenceSnapshot.compatibility.tupleId,
    attestations,
    certificates,
    revocations: [],
    supersessions: [],
    operatorLaneDisables: [],
  })
  return deepFreeze({
    authorityBundleHash: FIXED_AUTHORITY_BUNDLE_HASH,
    registryGeneration: FIXED_AUTHORITY_GENERATION,
    semanticTupleManifestHash: nested.evidenceSnapshot.compatibility.tupleId,
    trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    keyId: "v1.38-matrix-regression-authority",
    payload,
  }) as Readonly<VerifiedMountedRuntimeEvidenceAuthority>
}

const executeAttemptsInProcess = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  selectedAttempts: readonly V138CurrentMatrixAttempt[],
): V138CurrentMatrixAttemptOutcome[] => {
  let currentAuthority:
    | Readonly<VerifiedMountedRuntimeEvidenceAuthority>
    | undefined
  const authorityLoader: RuntimeEvidenceAuthorityLoader = {
    load: () => {
      if (currentAuthority === undefined) {
        throw new TypeError("MATRIX_AUTHORITY_NOT_MOUNTED")
      }
      return currentAuthority
    },
    current: () => currentAuthority,
  }
  const runtimeConfig = createRuntimeServiceConfig({
    strategyExecutionAdapter: "worker-thread",
    semanticReceiptSecret: "v1.38-matrix-regression-receipt-v1",
    resolveDeploymentLaneIdentity: laneIdentity,
  })
  const keys = generateKeyPairSync("ed25519")
  const dependencies = createPreparedRuntimeServiceDependenciesV118({
    runtimeConfig,
    authorityLoader,
    signer: {
      keyId: "v1.38-matrix-regression-signer",
      publicKeyPem: keys.publicKey.export({
        format: "pem",
        type: "spki",
      }) as string,
      sign: (bytes) => sign(null, bytes, keys.privateKey),
    },
    budgetProfileRoot: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
    ledgerPrestateRoot: FIXED_LEDGER_PRESTATE_ROOT,
    evaluationInstant: () => FIXED_EVALUATION_INSTANT,
  })
  const outcomes: V138CurrentMatrixAttemptOutcome[] = []
  for (const attempt of selectedAttempts) {
    currentAuthority = authorityForAttempt(attempt)
    let captured: PreparedRuntimeServiceExecutionV118 | undefined
    const response = executePreparedRuntimeServiceRequestV118(attempt.request, {
      ...dependencies,
      executeCurrentMatchWithAccounting: (request) => {
        captured = dependencies.executeCurrentMatchWithAccounting(request)
        return captured
      },
    })
    if (!response.ok || captured === undefined) {
      outcomes.push({
        attemptId: attempt.attemptId,
        classification: "system_failure",
        code: response.ok
          ? "EXECUTION_CAPTURE_MISSING"
          : response.systemFailure.code,
        retryable: response.ok ? false : response.systemFailure.retryable,
      })
      continue
    }
    const finalState = captured.response.ok
      ? captured.response.result.finalState
      : undefined
    const outcome = finalState?.outcome
    if (outcome === undefined || outcome.type === "FAILED") {
      outcomes.push({
        attemptId: attempt.attemptId,
        classification: "player_violation",
        code:
          outcome?.type === "FAILED" ? outcome.reason : "MISSING_MATCH_OUTCOME",
      })
      continue
    }
    outcomes.push({
      attemptId: attempt.attemptId,
      classification: "success",
      outcome:
        outcome.type === "DRAW"
          ? "draw"
          : outcome.winnerPlayerId ===
              (
                attempt.request
                  .match as unknown as RuntimeExecutionServiceRequest
              ).match.bottomPlayerId
            ? "bottom_win"
            : "top_win",
    })
  }
  return outcomes
}

interface ShardExecutionResult {
  outcomes: V138CurrentMatrixAttemptOutcome[]
  maxRssKilobytes: number
}

const isV138CurrentMatrixAttemptOutcome = (
  value: unknown,
): value is V138CurrentMatrixAttemptOutcome => {
  if (!hasExactKeys(value, ["attemptId", "classification", "outcome"]) &&
      !hasExactKeys(value, ["attemptId", "classification", "code"]) &&
      !hasExactKeys(value, [
        "attemptId",
        "classification",
        "code",
        "retryable",
      ])) {
    return false
  }
  if (typeof value.attemptId !== "string") return false
  if (value.classification === "success") {
    return (
      hasExactKeys(value, ["attemptId", "classification", "outcome"]) &&
      (value.outcome === "bottom_win" ||
        value.outcome === "top_win" ||
        value.outcome === "draw")
    )
  }
  if (value.classification === "player_violation") {
    return (
      hasExactKeys(value, ["attemptId", "classification", "code"]) &&
      typeof value.code === "string" &&
      value.code.length > 0
    )
  }
  return (
    value.classification === "system_failure" &&
    hasExactKeys(value, [
      "attemptId",
      "classification",
      "code",
      "retryable",
    ]) &&
    typeof value.code === "string" &&
    value.code.length > 0 &&
    typeof value.retryable === "boolean"
  )
}

const parseV138ShardExecutionResult = (
  value: unknown,
  expectedAttemptIds: readonly string[],
): ShardExecutionResult => {
  if (
    !hasExactKeys(value, ["outcomes", "maxRssKilobytes"]) ||
    !Array.isArray(value.outcomes) ||
    value.outcomes.length !== expectedAttemptIds.length ||
    !value.outcomes.every(isV138CurrentMatrixAttemptOutcome) ||
    !Number.isSafeInteger(value.maxRssKilobytes) ||
    (value.maxRssKilobytes as number) < 0 ||
    !value.outcomes.every(
      ({ attemptId }, index) => attemptId === expectedAttemptIds[index],
    )
  ) {
    throw new TypeError("invalid shard result")
  }
  return {
    outcomes: value.outcomes,
    maxRssKilobytes: value.maxRssKilobytes as number,
  }
}

export interface V138ShardProcessFactory {
  readonly spawn: (
    command: string,
    args: readonly string[],
    options: Readonly<{
      cwd: string
      detached: boolean
      env: Readonly<Record<string, string>>
      shell: false
      stdio: readonly ["ignore", "pipe", "pipe", "pipe"]
      windowsHide: true
    }>,
  ) => ChildProcessWithoutNullStreams
}

export interface V138RssCommandAdapter {
  readonly adapterId: string
  readonly command: "ps"
  readonly args: readonly ["-o", "rss=", "-p", "{pid}"]
  readonly units: "kilobytes"
  readonly execFile: (
    command: string,
    args: readonly string[],
    options: Readonly<{ encoding: "utf8"; timeout: 200 }>,
    callback: (
      error: NodeJS.ErrnoException | null,
      stdout: string,
      stderr: string,
    ) => void,
  ) => void
}

export type V138RssSample =
  | Readonly<{ status: "measured"; rssKilobytes: number }>
  | Readonly<{
      status: "unavailable"
      code:
        | "RESOURCE_SAMPLER_SPAWN_DENIED"
        | "RESOURCE_MEASUREMENT_UNAVAILABLE"
    }>

const V138_RSS_CHILD_EXIT_RACE = Symbol("v1.38-rss-child-exit-race")
type V138InternalRssSample = V138RssSample & Readonly<{
  [V138_RSS_CHILD_EXIT_RACE]?: true
}>
const childExitRaceSample = (): V138InternalRssSample =>
  Object.defineProperty(
    {
      status: "unavailable" as const,
      code: "RESOURCE_MEASUREMENT_UNAVAILABLE" as const,
    },
    V138_RSS_CHILD_EXIT_RACE,
    { value: true, enumerable: false, configurable: false, writable: false },
  )

const defaultV138RssCommandAdapter: V138RssCommandAdapter = Object.freeze({
  adapterId: "node-execfile-ps-rss-exact-pid-v1",
  command: "ps",
  args: ["-o", "rss=", "-p", "{pid}"],
  units: "kilobytes",
  execFile: (command, args, options, callback) => {
    execFile(command, [...args], options, (error, stdout, stderr) => {
      callback(
        error,
        typeof stdout === "string" ? stdout : stdout.toString("utf8"),
        typeof stderr === "string" ? stderr : stderr.toString("utf8"),
      )
    })
  },
})

const samplerFailureCode = (
  error: NodeJS.ErrnoException | null,
):
  | "RESOURCE_SAMPLER_SPAWN_DENIED"
  | "RESOURCE_MEASUREMENT_UNAVAILABLE" =>
  error?.code === "EPERM" || error?.code === "EACCES"
    ? "RESOURCE_SAMPLER_SPAWN_DENIED"
    : "RESOURCE_MEASUREMENT_UNAVAILABLE"

export const sampleV138ChildRss = (
  pid: number,
  adapter: V138RssCommandAdapter = defaultV138RssCommandAdapter,
): Promise<V138RssSample> =>
  new Promise((resolve) => {
    if (
      process.platform === "win32" ||
      !Number.isSafeInteger(pid) ||
      pid <= 0 ||
      adapter.command !== "ps" ||
      canonical(adapter.args) !== canonical(["-o", "rss=", "-p", "{pid}"]) ||
      adapter.units !== "kilobytes"
    ) {
      resolve({
        status: "unavailable",
        code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
      })
      return
    }
    let callbackCount = 0
    let settled = false
    const settle = (sample: V138InternalRssSample): void => {
      queueMicrotask(() => {
        if (settled) return
        settled = true
        resolve(
          callbackCount === 1
            ? sample
            : {
                status: "unavailable",
                code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
              },
        )
      })
    }
    try {
      adapter.execFile(
        adapter.command,
        ["-o", "rss=", "-p", String(pid)],
        { encoding: "utf8", timeout: 200 },
        (error, stdout) => {
          callbackCount += 1
          if (error !== null) {
            const exitCode = (error as { code?: unknown }).code
            const closedPidNoRow = typeof exitCode === "number" &&
              exitCode !== 0 && /^\s*$/u.test(stdout)
            settle(
              error.code === "ESRCH" || closedPidNoRow
                ? childExitRaceSample()
                : { status: "unavailable", code: samplerFailureCode(error) },
            )
            return
          }
          const trimmed = stdout.trim()
          if (!/^[1-9][0-9]*$/u.test(trimmed)) {
            settle(
              /^\s*$/u.test(stdout)
                ? childExitRaceSample()
                : {
                    status: "unavailable",
                    code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
                  },
            )
            return
          }
          const rssKilobytes = Number(trimmed)
          settle(
            Number.isSafeInteger(rssKilobytes)
              ? { status: "measured", rssKilobytes }
              : {
                  status: "unavailable",
                  code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
                },
          )
        },
      )
    } catch (error) {
      callbackCount = 1
      settle({
        status: "unavailable",
        code: samplerFailureCode(error as NodeJS.ErrnoException),
      })
    }
  })

const processGroupSignal = (
  child: ChildProcessWithoutNullStreams,
  signal: NodeJS.Signals,
): boolean => {
  if (child.pid === undefined) return false
  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, signal)
      return true
    } catch {
      // Fall through to the direct child signal for platforms without groups.
    }
  }
  try {
    return child.kill(signal)
  } catch {
    return false
  }
}

const probeV138ProcessGroup = (
  pid: number,
): Readonly<{ completed: boolean; orphanProcessIds: readonly number[] }> => {
  try {
    process.kill(process.platform === "win32" ? pid : -pid, 0)
    return { completed: true, orphanProcessIds: [pid] }
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH"
      ? { completed: true, orphanProcessIds: [] }
      : { completed: false, orphanProcessIds: [-1] }
  }
}

const delayMilliseconds = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

export function createV138SubprocessShardRunner(
  repoRoot: string,
  options: Readonly<{
    rssCommandAdapter?: V138RssCommandAdapter | undefined
    shardProcessFactory?: V138ShardProcessFactory | undefined
    useLegacyHostMemory?: boolean | undefined
    legacyHostMemorySampler?: (() => Readonly<{
      totalKilobytes: number
      freeKilobytes: number
    }>) | undefined
    onOutputBuffersZeroed?: (
      buffers: readonly Readonly<Buffer>[],
    ) => void
  }> = {},
): V138ParallelShardRunner {
  return {
    run: async (shard, control) => {
      const started = process.hrtime.bigint()
      const templateAttemptIds = shard.attempts.map(
        ({ templateAttemptId }) => templateAttemptId,
      )
      if (control.signal.aborted) {
        return {
          shardId: shard.shardId,
          laneId: shard.laneId,
          classification: "cancelled",
          elapsedMilliseconds: 0,
          maxRssKilobytes: 0,
          cleanup: {
            gracefulTerminationSent: false,
            forceTerminationSent: false,
            exitAwaited: true,
            orphanProcessIds: [],
          },
          outcomes: shard.attempts.map(({ executionAttemptId }) => ({
            attemptId: executionAttemptId,
            classification: "cancelled",
            code: "CANCELLED_BEFORE_SPAWN",
          })),
        }
      }
      const childArguments = [
          "--import",
          "tsx",
          fileURLToPath(import.meta.url),
          "--execute-shard",
          Buffer.from(
            JSON.stringify({ repoRoot, attemptIds: templateAttemptIds }),
            "utf8",
          ).toString("base64"),
        ]
      const childOptions = {
          cwd: repoRoot,
          detached: process.platform !== "win32",
          env: {
            NODE_ENV: "production",
            PATH: process.env.PATH ?? "",
          },
          shell: false,
          stdio: ["ignore", "pipe", "pipe", "pipe"] as const,
          windowsHide: true,
        } as const
      const child =
        options.shardProcessFactory?.spawn(
          process.execPath,
          childArguments,
          childOptions,
        ) ??
        spawn(process.execPath, childArguments, childOptions)
      let spawned = false
      child.once("spawn", () => {
        spawned = true
        control.onLaunch?.({
          event: "child_launched",
          shardId: shard.shardId,
          laneId: shard.laneId,
          executionAttemptIds: shard.attempts.map(
            ({ executionAttemptId }) => executionAttemptId,
          ),
        })
      })
      const stdout: Buffer[] = []
      const stderr: Buffer[] = []
      const controlFrames: Buffer[] = []
      let concatenatedStdout: Buffer | undefined
      let concatenatedControl: Buffer | undefined
      let stdoutBytes = 0
      let stderrBytes = 0
      let controlBytes = 0
      let maximumRssKilobytes = 0
      let outputOverflow = false
      let controlOverflow = false
      let spawnError = false
      let timedOut = false
      let gracefulTerminationSent = false
      let forceTerminationSent = false
      let closed = false
      let status: number | null = null
      let closeSignal: NodeJS.Signals | null = null
      let terminalEventCaptured = false
      let resourceSamplingOpen = true
      let resourceSamplingGeneration = 0
      let pendingRssSample: Promise<void> | undefined
      let resourceSampleInterval: NodeJS.Timeout | undefined
      let hasValidExternalRssSample = false
      let samplerCode:
        | "RESOURCE_SAMPLER_SPAWN_DENIED"
        | "RESOURCE_MEASUREMENT_UNAVAILABLE"
        | undefined
      let terminationPromise: Promise<void> | undefined
      const terminate = (): Promise<void> => {
        if (terminationPromise !== undefined) return terminationPromise
        terminationPromise = (async () => {
          if (closed) return
          gracefulTerminationSent = processGroupSignal(child, "SIGTERM")
          await Promise.race([
            new Promise<void>((resolve) => child.once("close", () => resolve())),
            delayMilliseconds(
              V138_PARALLEL_RESOURCE_POLICY.gracefulTerminationMilliseconds,
            ),
          ])
          if (!closed) {
            forceTerminationSent = processGroupSignal(child, "SIGKILL")
            await Promise.race([
              new Promise<void>((resolve) =>
                child.once("close", () => resolve()),
              ),
              delayMilliseconds(
                V138_PARALLEL_RESOURCE_POLICY.forcedTerminationMilliseconds,
              ),
            ])
          }
        })()
        return terminationPromise
      }
      const onAbort = (): void => {
        void terminate()
      }
      control.signal.addEventListener("abort", onAbort, { once: true })
      const closeReceipt = new Promise<void>((resolve) => {
        child.on("error", () => {
          resourceSamplingOpen = false
          if (resourceSampleInterval !== undefined) {
            clearInterval(resourceSampleInterval)
          }
          spawnError = true
          terminalEventCaptured = true
          resolve()
        })
        child.on("close", (exitStatus, signal) => {
          closed = true
          resourceSamplingOpen = false
          if (resourceSampleInterval !== undefined) {
            clearInterval(resourceSampleInterval)
          }
          terminalEventCaptured = true
          status = exitStatus
          closeSignal = signal
          resolve()
        })
      })
      const append = (
        target: Buffer[],
        value: Buffer,
        stream: "stdout" | "stderr",
      ): void => {
        const maximumBytes = 4 * 1024 * 1024
        const current = stream === "stdout" ? stdoutBytes : stderrBytes
        const remaining = Math.max(0, maximumBytes + 1 - current)
        if (remaining > 0) target.push(value.subarray(0, remaining))
        if (stream === "stdout") stdoutBytes += value.byteLength
        else stderrBytes += value.byteLength
        if (current + value.byteLength > maximumBytes) {
          outputOverflow = true
          void terminate()
        }
      }
      child.stdout.on("data", (value: Buffer) =>
        append(stdout, Buffer.from(value), "stdout"),
      )
      child.stderr.on("data", (value: Buffer) =>
        append(stderr, Buffer.from(value), "stderr"),
      )
      child.stdio?.[3]?.on("data", (value: Buffer) => {
        const bytes = Buffer.from(value)
        const remaining = Math.max(
          0,
          V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES + 1 - controlBytes,
        )
        if (remaining > 0) controlFrames.push(bytes.subarray(0, remaining))
        controlBytes += bytes.byteLength
        if (controlBytes > V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES) {
          controlOverflow = true
          void terminate()
        }
      })
      const sample = (): Promise<void> => {
        if (
          !resourceSamplingOpen ||
          closed ||
          child.pid === undefined
        ) return Promise.resolve()
        if (pendingRssSample !== undefined) return pendingRssSample
        const generation = resourceSamplingGeneration
        const ownedSample = (async (): Promise<void> => {
          const rss = await sampleV138ChildRss(
            child.pid!,
            options.rssCommandAdapter ?? defaultV138RssCommandAdapter,
          )
          if (generation !== resourceSamplingGeneration) return
          const legacyHostMemory =
            options.useLegacyHostMemory === false
              ? { totalKilobytes: 1, freeKilobytes: 1 }
              : (options.legacyHostMemorySampler?.() ?? {
                  totalKilobytes: Math.floor(totalmem() / 1024),
                  freeKilobytes: Math.floor(freemem() / 1024),
                })
          if (rss.status === "unavailable") {
            if (
              closed &&
              hasValidExternalRssSample &&
              (rss as V138InternalRssSample)[V138_RSS_CHILD_EXIT_RACE] === true
            ) return
            samplerCode = rss.code
            control.onResourceSample({
              childId: `pid:${child.pid}`,
              childRssKilobytes: -1,
              hostTotalMemoryKilobytes: legacyHostMemory.totalKilobytes,
              hostFreeMemoryKilobytes: legacyHostMemory.freeKilobytes,
            })
            await terminate()
            return
          }
          hasValidExternalRssSample = true
          maximumRssKilobytes = Math.max(
            maximumRssKilobytes,
            rss.rssKilobytes,
          )
          control.onResourceSample({
            childId: `pid:${child.pid}`,
            childRssKilobytes: rss.rssKilobytes,
            hostTotalMemoryKilobytes: legacyHostMemory.totalKilobytes,
            hostFreeMemoryKilobytes: legacyHostMemory.freeKilobytes,
          })
        })()
        const trackedSample = ownedSample.finally(() => {
          if (pendingRssSample === trackedSample) pendingRssSample = undefined
        })
        pendingRssSample = trackedSample
        return pendingRssSample
      }
      try {
      await sample()
      resourceSampleInterval = closed || samplerCode !== undefined
        ? undefined
        : setInterval(() => {
            void sample()
          }, V138_PARALLEL_RESOURCE_POLICY.resourceSampleMilliseconds)
      const timeout = setTimeout(() => {
        timedOut = true
        void terminate()
      }, V138_PARALLEL_RESOURCE_POLICY.maxShardMilliseconds)
      await closeReceipt
      resourceSamplingOpen = false
      if (resourceSampleInterval !== undefined) {
        clearInterval(resourceSampleInterval)
      }
      if (pendingRssSample !== undefined) await pendingRssSample
      resourceSamplingGeneration += 1
      clearTimeout(timeout)
      control.signal.removeEventListener("abort", onAbort)
      if (terminationPromise !== undefined) await terminationPromise
      const elapsedMilliseconds = Math.ceil(
        Number(process.hrtime.bigint() - started) / 1_000_000,
      )
      const pid = child.pid
      let orphanProbe =
        pid === undefined
          ? { completed: false, orphanProcessIds: [-1] as readonly number[] }
          : probeV138ProcessGroup(pid)
      if (pid !== undefined && orphanProbe.orphanProcessIds.length > 0) {
        forceTerminationSent = processGroupSignal(child, "SIGKILL")
        await delayMilliseconds(25)
        orphanProbe = probeV138ProcessGroup(pid)
      }
      const cancelled = control.signal.aborted
      const resourceFailureCode = outputOverflow
        ? "RESOURCE_POLICY_SHARD_OUTPUT_INVALID"
        : samplerCode
      concatenatedControl = Buffer.concat(controlFrames)
      let decodedControlState:
        | ReturnType<typeof decodeV138CurrentMatrixChildProtocolV2>
        | undefined
      if (!controlOverflow) {
        try {
          decodedControlState = decodeV138CurrentMatrixChildProtocolV2(
            concatenatedControl,
          )
        } catch {
          decodedControlState = undefined
        }
      }
      const protocolClassification = cancelled ||
          resourceFailureCode !== undefined
        ? undefined
        : reduceV138CurrentMatrixChildProtocolV2Observation({
            spawned: spawned && !spawnError,
            controlBytes: controlOverflow
              ? Buffer.alloc(
                  V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_MAX_BYTES + 1,
                )
              : concatenatedControl,
            stderrBytes: Buffer.concat(stderr),
            exitStatus: status,
            signal: closeSignal,
            timedOut,
          })
      let parsed: ShardExecutionResult | undefined
      if (!cancelled && resourceFailureCode === undefined &&
          protocolClassification?.classification === "success" &&
          decodedControlState?.terminal === "success") {
        try {
          concatenatedStdout = Buffer.concat(stdout)
          parsed = parseV138ShardExecutionResult(
            JSON.parse(concatenatedStdout.toString("utf8")),
            templateAttemptIds,
          )
          maximumRssKilobytes = Math.max(
            maximumRssKilobytes,
            parsed.maxRssKilobytes,
          )
        } catch {
          parsed = undefined
        }
      }
      const effectiveFailure = cancelled
        ? undefined
        : resourceFailureCode !== undefined
          ? {
              classification: "system_failure" as const,
              code: resourceFailureCode,
              retryable: false as const,
            }
          : protocolClassification?.classification === "system_failure"
            ? protocolClassification
            : parsed === undefined
              ? {
                  classification: "system_failure" as const,
                  code: "CHILD_TRANSPORT_FAILED" as const,
                  retryable: false as const,
                }
              : undefined
      const mappedOutcomes: V138ParallelChargedOutcome[] = shard.attempts.map(
        ({ executionAttemptId }, index) => {
          if (cancelled) {
            return {
              attemptId: executionAttemptId,
              classification: "cancelled",
              code: "CANCELLED_AFTER_HARD_FAILURE",
            }
          }
          if (effectiveFailure !== undefined) {
            return {
              attemptId: executionAttemptId,
              ...effectiveFailure,
            }
          }
          const outcome = parsed!.outcomes[index]!
          return { ...outcome, attemptId: executionAttemptId }
        },
      )
      return {
        shardId: shard.shardId,
        laneId: shard.laneId,
        classification: cancelled
          ? "cancelled"
          : effectiveFailure !== undefined ||
              mappedOutcomes.some(
                ({ classification }) => classification !== "success",
              )
            ? "failed"
            : "success",
        elapsedMilliseconds,
        maxRssKilobytes: maximumRssKilobytes,
        cleanup: {
          gracefulTerminationSent,
          forceTerminationSent,
          exitAwaited: terminalEventCaptured,
          orphanProcessIds: orphanProbe.completed
            ? orphanProbe.orphanProcessIds
            : [-1],
        },
        outcomes: mappedOutcomes,
      }
      } finally {
        for (const chunk of stdout) chunk.fill(0)
        for (const chunk of stderr) chunk.fill(0)
        for (const chunk of controlFrames) chunk.fill(0)
        concatenatedStdout?.fill(0)
        concatenatedControl?.fill(0)
        options.onOutputBuffersZeroed?.(
          Object.freeze([
            ...stdout,
            ...stderr,
            ...controlFrames,
            ...(concatenatedStdout === undefined ? [] : [concatenatedStdout]),
            ...(concatenatedControl === undefined
              ? []
              : [concatenatedControl]),
          ]),
        )
        stdout.length = 0
        stderr.length = 0
        controlFrames.length = 0
      }
    },
  }
}

const stoppedForResourcePolicy = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  calibration: Readonly<{
    elapsedMilliseconds: number
    maxRssKilobytes: number
    projectedTotalMilliseconds: number
    withinShardMemoryBudget: boolean
    outcomeClassification: "success" | "player_violation" | "system_failure"
  }>,
): Readonly<V138CurrentMatrixStoppedReceipt> => {
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorFailedRun: {
        classification: "system_failure_resource_pressure",
        elapsedSecondsAtTermination: 14_390,
        hostFreeMemoryPercentAtTermination: 9,
        partialResultsDiscarded: true,
        completedAttemptCount: "unknown",
      },
      calibration,
    }),
  )
  const acceptedCellLedgerRoot = sha256(canonical([]))
  const reducerSourceRoot = sha256(readFileSync(new URL(import.meta.url)))
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v1" as const,
    status: "stopped_process_failure" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    reason: "system_failure_resource_pressure" as const,
    admissionRoot: inventory.admissionRoot,
    historicalMatrixSourceSha256: inventory.historicalSourceSha256,
    arenaMapping: inventory.arenas,
    declaredAttemptCount: 540 as const,
    acceptedCellCount: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
    priorFailedRun: {
      classification: "system_failure_resource_pressure" as const,
      elapsedSecondsAtTermination: 14_390 as const,
      hostFreeMemoryPercentAtTermination: 9 as const,
      partialResultsDiscarded: true as const,
      completedAttemptCount: "unknown" as const,
    },
    resourcePolicy: RESOURCE_POLICY,
    calibration: {
      attemptCount: 1 as const,
      ...calibration,
      withinTotalRunBudget: false as const,
    },
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot,
    reducerSourceRoot,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  }) as Readonly<V138CurrentMatrixStoppedReceipt>
}

export const reproduceV138CurrentMatrix = (
  repoRoot: string,
): Readonly<V138CurrentMatrixReproductionReceipt> => {
  const persisted = JSON.parse(
    readFileSync(
      path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-reproduction.json",
      ),
      "utf8",
    ),
  ) as V138CurrentMatrixReproductionReceipt
  if (
    persisted.schemaVersion !== "v1.38-current-matrix-reproduction-v1" ||
    persisted.fixturePurpose !== FIXTURE_PURPOSE ||
    persisted.receiptRoot !==
      sha256(
        canonical(
          Object.fromEntries(
            Object.entries(persisted).filter(([key]) => key !== "receiptRoot"),
          ),
        ),
      )
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_MISMATCH")
  }
  return deepFreeze(persisted)
}

export const renderV138CurrentMatrixReceipt = (
  receipt: Readonly<V138CurrentMatrixReproductionReceipt>,
): string => `${JSON.stringify(receipt)}\n`

const PLAN_262_10_PREDECESSOR = Object.freeze({
  path: ".planning/artifacts/v1.38-current-matrix-reproduction.json",
  fileSha256:
    "sha256:ac890d84767a09265265b21d80852ff6c63615ea9d4a0cc9fbf549f520f5aeec",
  gitBlob: "166fbe91525623fa99fc7035462c76301f98785d",
  producingCommit: "c5665b756f7e9f3ec1e8c57e5c64ad6f2a136c66",
  receiptRoot:
    "sha256:99187d35b9a14e263be6cc35a6335bdd3957d5fede647345326c8e015891b280",
} as const)

const assertPlan26210Predecessor = (
  repoRoot: string,
): typeof PLAN_262_10_PREDECESSOR => {
  const predecessorPath = path.resolve(
    repoRoot,
    PLAN_262_10_PREDECESSOR.path,
  )
  const bytes = readFileSync(predecessorPath)
  const parsed = JSON.parse(bytes.toString("utf8")) as { receiptRoot?: unknown }
  if (
    sha256(bytes) !== PLAN_262_10_PREDECESSOR.fileSha256 ||
    git(repoRoot, ["hash-object", PLAN_262_10_PREDECESSOR.path]) !==
      PLAN_262_10_PREDECESSOR.gitBlob ||
    parsed.receiptRoot !== PLAN_262_10_PREDECESSOR.receiptRoot ||
    git(repoRoot, [
      "rev-list",
      "--all",
      "--objects",
    ]).length === 0
  ) {
    throw new TypeError("MATRIX_PLAN_262_10_PREDECESSOR_INVALID")
  }
  const producingBytes = gitBlob(
    repoRoot,
    PLAN_262_10_PREDECESSOR.producingCommit,
    PLAN_262_10_PREDECESSOR.path,
  )
  if (
    sha256(producingBytes) !== PLAN_262_10_PREDECESSOR.fileSha256 ||
    sha256(bytes) !== sha256(producingBytes)
  ) {
    throw new TypeError("MATRIX_PLAN_262_10_PREDECESSOR_INVALID")
  }
  return PLAN_262_10_PREDECESSOR
}

export interface V138MatrixDiagnosticV2Receipt {
  readonly schemaVersion: "v1.38-current-matrix-diagnostic-v2"
  readonly status: "diagnostic_complete"
  readonly predecessor: typeof PLAN_262_10_PREDECESSOR
  readonly declaredIdentityIds: readonly string[]
  readonly executedIdentityIds: readonly string[]
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly samplerPolicy: Readonly<{
    authorization: null
    adapterId: string
    command: "ps"
    args: readonly ["-o", "rss=", "-p", "{pid}"]
    units: "kilobytes"
  }>
  readonly sourceRoots: Readonly<{
    implementation: Sha256
    resourcePolicy: Sha256
    samplerAdapter: Sha256
  }>
  readonly chargedRoot: Sha256
  readonly acceptedCellCount: 0
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const diagnosticV2WithoutRoot = (
  receipt: V138MatrixDiagnosticV2Receipt,
): Omit<V138MatrixDiagnosticV2Receipt, "receiptRoot"> => {
  const { receiptRoot: _receiptRoot, ...withoutRoot } = receipt
  return withoutRoot
}

const diagnosticAssignments = (
  inventory: Readonly<V138CurrentMatrixInventory>,
): readonly Readonly<V138ParallelShardAssignment>[] => {
  const selected = inventory.attempts.slice(0, 5)
  return selected.map((attempt, ordinal) => ({
    kind: "calibration" as const,
    shardId:
      ordinal === 0
        ? "diagnostic_test:v2:single"
        : `diagnostic_test:v2:wide:${ordinal - 1}`,
    laneId: `diagnostic_test:v2:lane:${Math.max(0, ordinal - 1)}`,
    ordinal,
    attempts: [{
      executionAttemptId: `diagnostic_test:v2:${ordinal}:${attempt!.attemptId}`,
      templateAttemptId: attempt!.attemptId,
      request: attempt!.request,
    }],
  }))
}

const runDiagnosticAssignment = (
  runner: V138ParallelShardRunner,
  assignment: Readonly<V138ParallelShardAssignment>,
): Promise<Readonly<V138ParallelShardTerminal>> =>
  runner.run(assignment, {
    signal: new AbortController().signal,
    onResourceSample: () => undefined,
  })

export const buildV138MatrixDiagnosticV2Receipt = (input: {
  repoRoot: string
  terminals: readonly Readonly<V138ParallelShardTerminal>[]
}): Readonly<V138MatrixDiagnosticV2Receipt> => {
  const predecessor = assertPlan26210Predecessor(input.repoRoot)
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  const assignments = diagnosticAssignments(inventory)
  const declaredIdentityIds = assignments.flatMap(({ attempts }) =>
    attempts.map(({ executionAttemptId }) => executionAttemptId),
  )
  const terminalByShard = new Map(
    input.terminals.map((terminal) => [terminal.shardId, terminal]),
  )
  const terminals = assignments.map((assignment) => {
    const terminal = terminalByShard.get(assignment.shardId)
    if (terminal === undefined) {
      throw new TypeError("MATRIX_DIAGNOSTIC_V2_TERMINAL_MISSING")
    }
    return terminal
  })
  const executedIdentityIds = terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  if (
    canonical(declaredIdentityIds) !== canonical(executedIdentityIds) ||
    new Set(executedIdentityIds).size !== executedIdentityIds.length ||
    terminals.some(
      ({ cleanup }) =>
        !cleanup.exitAwaited || cleanup.orphanProcessIds.length > 0,
    )
  ) {
    throw new TypeError("MATRIX_DIAGNOSTIC_V2_ACCOUNTING_INVALID")
  }
  const sourceRoots = {
    implementation: sha256(
      canonical({
        implementationId: "v1.38-matrix-diagnostic-v2-boundary-v1",
        samplerContract:
          "exact-positive-integer-kilobytes-for-bound-pid-or-public-safe-unavailable",
        cleanupContract:
          "idempotent-group-signal-terminal-event-and-completed-orphan-probe",
        receiptContract:
          "exact-diagnostic-identities-observed-terminals-and-charged-zero-publication",
      }),
    ),
    resourcePolicy: sha256(canonical(V138_PARALLEL_RESOURCE_POLICY)),
    samplerAdapter: sha256(
      canonical({
        adapterId: defaultV138RssCommandAdapter.adapterId,
        command: defaultV138RssCommandAdapter.command,
        args: defaultV138RssCommandAdapter.args,
        units: defaultV138RssCommandAdapter.units,
      }),
    ),
  }
  const chargedRoot = sha256(
    canonical({
      predecessorReceiptRoot: predecessor.receiptRoot,
      declaredIdentityIds,
      executedIdentityIds,
      terminals,
      sourceRoots,
      acceptedCellCount: 0,
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-diagnostic-v2" as const,
    status: "diagnostic_complete" as const,
    predecessor,
    declaredIdentityIds,
    executedIdentityIds,
    terminals,
    samplerPolicy: {
      authorization: null,
      adapterId: defaultV138RssCommandAdapter.adapterId,
      command: defaultV138RssCommandAdapter.command,
      args: defaultV138RssCommandAdapter.args,
      units: defaultV138RssCommandAdapter.units,
    },
    sourceRoots,
    chargedRoot,
    acceptedCellCount: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138MatrixDiagnosticV2Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138MatrixDiagnosticV2Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138MatrixDiagnosticV2Receipt
    const expected = buildV138MatrixDiagnosticV2Receipt({
      repoRoot,
      terminals: receipt.terminals,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_DIAGNOSTIC_V2_RECEIPT_INVALID")
  }
}

export const writeV138MatrixDiagnosticV2Receipt = async (
  repoRoot: string,
  targetPath: string,
): Promise<Readonly<V138MatrixDiagnosticV2Receipt>> => {
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const assignments = diagnosticAssignments(inventory)
  const runner = createV138SubprocessShardRunner(repoRoot)
  const single = await runDiagnosticAssignment(runner, assignments[0]!)
  const wide = await Promise.all(
    assignments.slice(1).map((assignment) =>
      runDiagnosticAssignment(runner, assignment),
    ),
  )
  const receipt = buildV138MatrixDiagnosticV2Receipt({
    repoRoot,
    terminals: [single, ...wide],
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

const PLAN_262_11_LITERAL_AUTHORIZATION =
  "Authorize Plan 262-11 to use unsandboxed `ps` RSS sampling under the existing frozen resource policy, then run calibration:v2 and—only if admitted—the fresh 540-Match reproduction:v3."

export interface V138SamplerAuthorization {
  readonly selection: "authorized-unsandboxed-ps"
  readonly literalAuthorization: typeof PLAN_262_11_LITERAL_AUTHORIZATION
  readonly permissionBoundary:
    "exact-read-only-ps-rss-and-process-group-orphan-probe"
  readonly policyRoot: Sha256
}

export const parseV138SamplerAuthorization = (
  selection: string,
): Readonly<V138SamplerAuthorization> => {
  if (selection !== "authorized-unsandboxed-ps") {
    throw new TypeError("MATRIX_SAMPLER_AUTHORIZATION_REQUIRED")
  }
  const withoutRoot = {
    selection,
    literalAuthorization: PLAN_262_11_LITERAL_AUTHORIZATION,
    permissionBoundary:
      "exact-read-only-ps-rss-and-process-group-orphan-probe" as const,
  }
  return deepFreeze({
    ...withoutRoot,
    policyRoot: sha256(canonical(withoutRoot)),
  })
}

export interface V138ParallelCalibrationV2SuccessorReceipt {
  readonly schemaVersion: "v1.38-current-matrix-calibration-v2"
  readonly status: "calibration_admitted" | "stopped_process_failure"
  readonly stage: "parallel_calibration_v2"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: V138ParallelStopReason | null
  readonly diagnosticV2ReceiptRoot: Sha256
  readonly diagnosticV2ChargedRoot: Sha256
  readonly diagnosticV2SourceRoots: V138MatrixDiagnosticV2Receipt["sourceRoots"]
  readonly authorization: Readonly<V138SamplerAuthorization>
  readonly samplerPolicy: Readonly<{
    adapterId: string
    command: "ps"
    args: readonly ["-o", "rss=", "-p", "{pid}"]
    units: "kilobytes"
  }>
  readonly predecessor: typeof PLAN_262_10_PREDECESSOR
  readonly priorChargedLineage: Readonly<{
    predecessorReceiptRoot: Sha256
    predecessorChargedAttemptLedgerRoot: Sha256
    predecessorCalibrationV1Root: Sha256
    diagnosticV2ChargedRoot: Sha256
  }>
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly resourcePolicyRoot: Sha256
  readonly calibration: Readonly<V138ParallelCalibrationReceipt>
  readonly chargedCalibrationAttemptCount: 8
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0
  readonly fullRunLaunched: false
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const calibrationV2WithoutRoot = (
  receipt: V138ParallelCalibrationV2SuccessorReceipt,
): Omit<V138ParallelCalibrationV2SuccessorReceipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138ParallelCalibrationV2SuccessorReceipt = (input: {
  repoRoot: string
  diagnostic: Readonly<V138MatrixDiagnosticV2Receipt>
  authorization: Readonly<V138SamplerAuthorization>
  calibration: Readonly<V138ParallelCalibrationReceipt>
}): Readonly<V138ParallelCalibrationV2SuccessorReceipt> => {
  const predecessor = assertPlan26210Predecessor(input.repoRoot)
  const checkedDiagnostic = checkV138MatrixDiagnosticV2Receipt(
    input.repoRoot,
    input.diagnostic,
  )
  const checkedAuthorization = parseV138SamplerAuthorization(
    input.authorization.selection,
  )
  if (canonical(input.authorization) !== canonical(checkedAuthorization)) {
    throw new TypeError("MATRIX_SAMPLER_AUTHORIZATION_REQUIRED")
  }
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  validateParallelCalibrationReceipt(inventory, input.calibration, "v2")
  const predecessorReceipt = JSON.parse(
    readFileSync(
      path.resolve(input.repoRoot, PLAN_262_10_PREDECESSOR.path),
      "utf8",
    ),
  ) as V138ParallelCalibrationSuccessorReceipt
  const priorChargedLineage = {
    predecessorReceiptRoot: predecessor.receiptRoot,
    predecessorChargedAttemptLedgerRoot:
      predecessorReceipt.chargedAttemptLedgerRoot,
    predecessorCalibrationV1Root: predecessorReceipt.calibration.calibrationRoot,
    diagnosticV2ChargedRoot: checkedDiagnostic.chargedRoot,
  }
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorChargedLineage,
      calibrationV2Root: input.calibration.calibrationRoot,
      calibrationV2Outcomes: input.calibration.terminals.flatMap(
        ({ outcomes }) => outcomes,
      ),
      acceptedCellCount: 0,
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-calibration-v2" as const,
    status:
      input.calibration.status === "admitted"
        ? ("calibration_admitted" as const)
        : ("stopped_process_failure" as const),
    stage: "parallel_calibration_v2" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    reason: input.calibration.reason,
    diagnosticV2ReceiptRoot: checkedDiagnostic.receiptRoot,
    diagnosticV2ChargedRoot: checkedDiagnostic.chargedRoot,
    diagnosticV2SourceRoots: checkedDiagnostic.sourceRoots,
    authorization: checkedAuthorization,
    samplerPolicy: {
      adapterId: defaultV138RssCommandAdapter.adapterId,
      command: defaultV138RssCommandAdapter.command,
      args: defaultV138RssCommandAdapter.args,
      units: defaultV138RssCommandAdapter.units,
    },
    predecessor,
    priorChargedLineage,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    resourcePolicyRoot: sha256(canonical(V138_PARALLEL_RESOURCE_POLICY)),
    calibration: input.calibration,
    chargedCalibrationAttemptCount: 8 as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot: sha256(canonical([])),
    acceptedCellCount: 0 as const,
    fullRunLaunched: false as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138ParallelCalibrationV2Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138ParallelCalibrationV2SuccessorReceipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138ParallelCalibrationV2SuccessorReceipt
    const diagnostic = checkV138MatrixDiagnosticV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const expected = buildV138ParallelCalibrationV2SuccessorReceipt({
      repoRoot,
      diagnostic,
      authorization: receipt.authorization,
      calibration: receipt.calibration,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_CALIBRATION_V2_RECEIPT_INVALID")
  }
}

export const writeV138ParallelCalibrationV2Receipt = async (
  repoRoot: string,
  targetPath: string,
  selection: string,
): Promise<Readonly<V138ParallelCalibrationV2SuccessorReceipt>> => {
  const authorization = parseV138SamplerAuthorization(selection)
  const diagnostic = checkV138MatrixDiagnosticV2Receipt(
    repoRoot,
    JSON.parse(
      readFileSync(
        path.resolve(
          repoRoot,
          ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
        ),
        "utf8",
      ),
    ),
  )
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = await calibrateV138ParallelMatrix({
    inventory,
    policy: deriveV138ParallelCalibrationPolicy(inventory),
    hardwareIdentity: {
      operatingSystem: `${platform()} ${release()}`,
      architecture: arch(),
      nodeVersion: process.version,
      cpuIdentity: cpus()[0]?.model ?? "unavailable",
    },
    repoRoot,
    executionIdentityVersion: "v2",
  })
  const receipt = buildV138ParallelCalibrationV2SuccessorReceipt({
    repoRoot,
    diagnostic,
    authorization,
    calibration,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export const PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL =
  "One Plan 262-12 headroom-preflight:v3, one eight-attempt calibration:v3 set, and—only if calibration is admitted—one 540-cell reproduction:v4, using the unchanged frozen unsandboxed `ps` sampler policy. The authorization is single-use and expires at Plan 262-12’s first terminal outcome." as const

const PLAN_262_11_SAMPLER_POLICY_ROOT =
  "sha256:cf3104a41dc7e34ec698a2f187fa0f3785d402549af28fdb60d091b2600339d9" as const
const V138_RESOURCE_POLICY_ROOT =
  "sha256:ba5ea05c5067be4aaf996d3fe67cc7f8d13931b7a19301cc1429f185e72747a7" as const

export interface V138Plan26212ExecutionAuthorization {
  readonly literalAuthorization: typeof PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL
  readonly planId: "262-12"
  readonly headroomPreflightCount: 1
  readonly calibrationSetCount: 1
  readonly calibrationAttemptCount: 8
  readonly reproductionCount: 1
  readonly reproductionCellCount: 540
  readonly reproductionConditionalOnCalibrationAdmission: true
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly singleUse: true
  readonly expiresAtFirstTerminalOutcome: true
  readonly consumed: false
  readonly terminalOutcome: null
  readonly executionAuthorizationRoot: Sha256
}

export const parseV138Plan26212ExecutionAuthorization = (
  literalAuthorization: string,
  usage: Readonly<{
    consumed: boolean
    terminalOutcome: "passed_exact" | "stopped_process_failure" | null
  }> = { consumed: false, terminalOutcome: null },
): Readonly<V138Plan26212ExecutionAuthorization> => {
  if (literalAuthorization !== PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL) {
    throw new TypeError(
      "MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_REQUIRED",
    )
  }
  if (usage.terminalOutcome !== null) {
    throw new TypeError("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_EXPIRED")
  }
  if (usage.consumed) {
    throw new TypeError("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_CONSUMED")
  }
  const authority = {
    literalAuthorization: PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
    planId: "262-12" as const,
    headroomPreflightCount: 1 as const,
    calibrationSetCount: 1 as const,
    calibrationAttemptCount: 8 as const,
    reproductionCount: 1 as const,
    reproductionCellCount: 540 as const,
    reproductionConditionalOnCalibrationAdmission: true as const,
    samplerPolicyRoot: PLAN_262_11_SAMPLER_POLICY_ROOT,
    singleUse: true as const,
    expiresAtFirstTerminalOutcome: true as const,
    consumed: false as const,
    terminalOutcome: null,
  }
  const executionAuthorizationRoot = sha256(canonical(authority))
  if (executionAuthorizationRoot === PLAN_262_11_SAMPLER_POLICY_ROOT) {
    throw new TypeError(
      "MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_ROOT_COLLISION",
    )
  }
  return deepFreeze({ ...authority, executionAuthorizationRoot })
}

const PLAN_262_11_IMMUTABLE_LINEAGE = deepFreeze({
  diagnosticV2: {
    path: ".planning/artifacts/v1.38-current-matrix-diagnostic-v2.json",
    fileSha256:
      "sha256:c630bac6fcfeb10fecc04771405830ddcb13019b16daaf855550101fc17bd8ab" as Sha256,
    gitBlob: "a8b3c67764a06df9585b85b6161dfd92adb2fa50",
    producingCommit: "73e1476bb6594d96c01ebe8ab133d461758e1ad6",
    receiptRoot:
      "sha256:22cb82ef705821c647fa2dd4d5d1b8c532316c2d1623058d1c5870b0e0b0ea24" as Sha256,
    chargedRoot:
      "sha256:9a6f3834c30235b7d29d76ae9b5e54635f878fc3d5abc5ce5461f1dd594dfb07" as Sha256,
  },
  calibrationV2: {
    path: ".planning/artifacts/v1.38-current-matrix-calibration-v2.json",
    fileSha256:
      "sha256:834e29a012c9444ddea3e6a131126888b1da7a89626c2a9acbeb5acb69320f93" as Sha256,
    gitBlob: "d6a7865e94a070f2a4f12f2f61fc4d4a6765f966",
    producingCommit: "76de8eaef63ce8720ac7d2e3908114eb21168094",
    receiptRoot:
      "sha256:12444f25d0b00717cfd087783f7d7cafb1f390fecdc717dc8dc89cfdafa0794b" as Sha256,
    chargedRoot:
      "sha256:ebbd946fdd98400ed678cbbfe1b374182ae5786472f7db6ecfdcc342b00bb0fa" as Sha256,
  },
})

const assertImmutableArtifactIdentity = (
  repoRoot: string,
  identity: Readonly<{
    path: string
    fileSha256: Sha256
    gitBlob: string
    producingCommit: string
    receiptRoot: Sha256
    chargedRoot: Sha256
  }>,
  chargedKey: "chargedRoot" | "chargedAttemptLedgerRoot",
): void => {
  const bytes = readFileSync(path.resolve(repoRoot, identity.path))
  const parsed = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>
  if (
    sha256(bytes) !== identity.fileSha256 ||
    git(repoRoot, ["hash-object", identity.path]) !== identity.gitBlob ||
    sha256(gitBlob(repoRoot, identity.producingCommit, identity.path)) !==
      identity.fileSha256 ||
    parsed.receiptRoot !== identity.receiptRoot ||
    parsed[chargedKey] !== identity.chargedRoot
  ) {
    throw new TypeError("MATRIX_PLAN_262_11_LINEAGE_INVALID")
  }
}

const assertPlan26212Predecessors = (
  repoRoot: string,
): Readonly<{
  diagnosticV2: typeof PLAN_262_11_IMMUTABLE_LINEAGE.diagnosticV2
  calibrationV2: typeof PLAN_262_11_IMMUTABLE_LINEAGE.calibrationV2
  plan26210: typeof PLAN_262_10_PREDECESSOR
  orderedChargedLineage: readonly Sha256[]
}> => {
  assertImmutableArtifactIdentity(
    repoRoot,
    PLAN_262_11_IMMUTABLE_LINEAGE.diagnosticV2,
    "chargedRoot",
  )
  assertImmutableArtifactIdentity(
    repoRoot,
    PLAN_262_11_IMMUTABLE_LINEAGE.calibrationV2,
    "chargedAttemptLedgerRoot",
  )
  const plan26210 = assertPlan26210Predecessor(repoRoot)
  const plan26210Receipt = JSON.parse(
    readFileSync(path.resolve(repoRoot, plan26210.path), "utf8"),
  ) as V138ParallelCalibrationSuccessorReceipt
  if (
    plan26210Receipt.chargedAttemptLedgerRoot !==
      "sha256:e7830ae825f24b784ab7fea70228ca3f7074006d7442b4e88032daf1f7dcc61e" ||
    plan26210Receipt.calibration.calibrationRoot !==
      "sha256:a5e51cbb2c895d02f7101c1d2433046b05819492b28e19105be7019c069cba47" ||
    PRIOR_CHARGED_LINEAGE.stoppedReceiptRoot !==
      "sha256:bd64a793603ee444f8671e8391d5bd9bd4a2b494d32a2d09fce1864aed675a33"
  ) {
    throw new TypeError("MATRIX_PLAN_262_10_CHARGED_LINEAGE_INVALID")
  }
  return deepFreeze({
    diagnosticV2: PLAN_262_11_IMMUTABLE_LINEAGE.diagnosticV2,
    calibrationV2: PLAN_262_11_IMMUTABLE_LINEAGE.calibrationV2,
    plan26210,
    orderedChargedLineage: [
      PRIOR_CHARGED_LINEAGE.stoppedReceiptRoot,
      plan26210Receipt.calibration.calibrationRoot,
      plan26210Receipt.chargedAttemptLedgerRoot,
      PLAN_262_11_IMMUTABLE_LINEAGE.diagnosticV2.chargedRoot,
      PLAN_262_11_IMMUTABLE_LINEAGE.calibrationV2.chargedRoot,
    ],
  })
}

export interface V138HostHeadroomPreflightV3Receipt {
  readonly schemaVersion: "v1.38-current-matrix-headroom-preflight-v3"
  readonly status: "preflight_complete"
  readonly chargedIdentityId: "preflight:v3:0"
  readonly hostTotalMemoryKilobytes: number
  readonly hostFreeMemoryKilobytes: number
  readonly hostHeadroomBasisPoints: number
  readonly requiredHostHeadroomBasisPoints: 2500
  readonly disposition: "preflight_admitted" | "preflight_refused"
  readonly resourcePolicyRoot: typeof V138_RESOURCE_POLICY_ROOT
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly executionAuthorizationRoot: Sha256
  readonly sourceRoot: Sha256
  readonly predecessorRoots: Readonly<{
    diagnosticV2ReceiptRoot: Sha256
    calibrationV2ReceiptRoot: Sha256
    plan26210ReceiptRoot: Sha256
    orderedChargedLineage: readonly Sha256[]
  }>
  readonly chargedRoot: Sha256
  readonly receiptRoot: Sha256
}

const preflightV3WithoutRoot = (
  receipt: V138HostHeadroomPreflightV3Receipt,
): Omit<V138HostHeadroomPreflightV3Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138HostHeadroomPreflightV3Receipt = (input: {
  repoRoot: string
  executionAuthorization: Readonly<V138Plan26212ExecutionAuthorization>
  hostTotalMemoryKilobytes: number
  hostFreeMemoryKilobytes: number
}): Readonly<V138HostHeadroomPreflightV3Receipt> => {
  const authorization = parseV138Plan26212ExecutionAuthorization(
    input.executionAuthorization.literalAuthorization,
  )
  if (
    canonical(input.executionAuthorization) !== canonical(authorization) ||
    !Number.isSafeInteger(input.hostTotalMemoryKilobytes) ||
    input.hostTotalMemoryKilobytes <= 0 ||
    !Number.isSafeInteger(input.hostFreeMemoryKilobytes) ||
    input.hostFreeMemoryKilobytes < 0 ||
    input.hostFreeMemoryKilobytes > input.hostTotalMemoryKilobytes
  ) {
    throw new TypeError("MATRIX_HEADROOM_PREFLIGHT_V3_INPUT_INVALID")
  }
  const predecessors = assertPlan26212Predecessors(input.repoRoot)
  const hostHeadroomBasisPoints = Math.floor(
    (input.hostFreeMemoryKilobytes * 10_000) /
      input.hostTotalMemoryKilobytes,
  )
  const sourceRoot = sha256(readFileSync(new URL(import.meta.url)))
  const predecessorRoots = {
    diagnosticV2ReceiptRoot: predecessors.diagnosticV2.receiptRoot,
    calibrationV2ReceiptRoot: predecessors.calibrationV2.receiptRoot,
    plan26210ReceiptRoot: predecessors.plan26210.receiptRoot,
    orderedChargedLineage: predecessors.orderedChargedLineage,
  }
  const chargedFrame = {
    chargedIdentityId: "preflight:v3:0" as const,
    hostTotalMemoryKilobytes: input.hostTotalMemoryKilobytes,
    hostFreeMemoryKilobytes: input.hostFreeMemoryKilobytes,
    hostHeadroomBasisPoints,
    requiredHostHeadroomBasisPoints: 2_500 as const,
    resourcePolicyRoot: V138_RESOURCE_POLICY_ROOT,
    samplerPolicyRoot: authorization.samplerPolicyRoot,
    executionAuthorizationRoot: authorization.executionAuthorizationRoot,
    sourceRoot,
    predecessorRoots,
  }
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v3" as const,
    status: "preflight_complete" as const,
    ...chargedFrame,
    disposition:
      hostHeadroomBasisPoints >= 2_500
        ? ("preflight_admitted" as const)
        : ("preflight_refused" as const),
    chargedRoot: sha256(canonical(chargedFrame)),
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138HostHeadroomPreflightV3Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138HostHeadroomPreflightV3Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138HostHeadroomPreflightV3Receipt
    const expected = buildV138HostHeadroomPreflightV3Receipt({
      repoRoot,
      executionAuthorization: parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      ),
      hostTotalMemoryKilobytes: receipt.hostTotalMemoryKilobytes,
      hostFreeMemoryKilobytes: receipt.hostFreeMemoryKilobytes,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_HEADROOM_PREFLIGHT_V3_RECEIPT_INVALID")
  }
}

const exactSuccessorTarget = (
  repoRoot: string,
  targetPath: string,
  expectedRelativePath: string,
): void => {
  if (
    path.resolve(targetPath) !== path.resolve(repoRoot, expectedRelativePath) ||
    existsSync(targetPath)
  ) {
    throw new TypeError("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
  }
}

export const writeV138HostHeadroomPreflightV3Receipt = (
  repoRoot: string,
  targetPath: string,
  literalAuthorization: string,
): Readonly<V138HostHeadroomPreflightV3Receipt> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
  )
  const authorization = parseV138Plan26212ExecutionAuthorization(
    literalAuthorization,
  )
  const receipt = buildV138HostHeadroomPreflightV3Receipt({
    repoRoot,
    executionAuthorization: authorization,
    hostTotalMemoryKilobytes: Math.floor(totalmem() / 1024),
    hostFreeMemoryKilobytes: Math.floor(freemem() / 1024),
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export interface V138ParallelCalibrationV3Receipt {
  readonly schemaVersion: "v1.38-current-matrix-calibration-v3"
  readonly status: "calibration_admitted" | "stopped_process_failure"
  readonly stage: "parallel_calibration_v3"
  readonly reason: V138ParallelStopReason | null
  readonly preflightV3ReceiptRoot: Sha256
  readonly preflightV3ChargedRoot: Sha256
  readonly executionAuthorization: Readonly<{
    root: Sha256
    consumed: true
    expired: boolean
    terminalOutcome: "stopped_process_failure" | null
  }>
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly resourcePolicyRoot: typeof V138_RESOURCE_POLICY_ROOT
  readonly predecessorRoots: V138HostHeadroomPreflightV3Receipt["predecessorRoots"]
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly declaredCalibrationIdentityIds: readonly string[]
  readonly chargedDispositions: readonly Readonly<{
    attemptId: string
    disposition:
      | "terminal_calibration_outcome"
      | "unfilled_resource_preflight_refusal"
  }>[]
  readonly calibration: Readonly<V138ParallelCalibrationReceipt> | null
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly chargedCalibrationAttemptCount: 8
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0
  readonly fullRunLaunched: false
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const calibrationV3WithoutRoot = (
  receipt: V138ParallelCalibrationV3Receipt,
): Omit<V138ParallelCalibrationV3Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

const declaredCalibrationV3Ids = (
  repoRoot: string,
): readonly string[] => {
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  return deriveV138ParallelCalibrationPolicy(inventory).inventory.attempts.map(
    ({ calibrationAttemptId }) =>
      calibrationAttemptId.replace(/^calibration:v1:/u, "calibration:v3:"),
  )
}

export const buildV138ParallelCalibrationV3Receipt = (input: {
  repoRoot: string
  preflight: Readonly<V138HostHeadroomPreflightV3Receipt>
  executionAuthorization: Readonly<V138Plan26212ExecutionAuthorization>
  calibration?: Readonly<V138ParallelCalibrationReceipt> | undefined
}): Readonly<V138ParallelCalibrationV3Receipt> => {
  const authorization = parseV138Plan26212ExecutionAuthorization(
    input.executionAuthorization.literalAuthorization,
  )
  if (canonical(authorization) !== canonical(input.executionAuthorization)) {
    throw new TypeError("MATRIX_PLAN_262_12_EXECUTION_AUTHORIZATION_REQUIRED")
  }
  const preflight = checkV138HostHeadroomPreflightV3Receipt(
    input.repoRoot,
    input.preflight,
  )
  if (
    preflight.executionAuthorizationRoot !==
    authorization.executionAuthorizationRoot
  ) {
    throw new TypeError("MATRIX_PREFLIGHT_AUTHORIZATION_ROOT_MISMATCH")
  }
  const declaredCalibrationIdentityIds = declaredCalibrationV3Ids(
    input.repoRoot,
  )
  const refused = preflight.disposition === "preflight_refused"
  if (refused !== (input.calibration === undefined)) {
    throw new TypeError("MATRIX_CALIBRATION_V3_BRANCH_INVALID")
  }
  if (input.calibration !== undefined) {
    validateParallelCalibrationReceipt(
      enumerateV138CurrentMatrix(input.repoRoot),
      input.calibration,
      "v3",
    )
  }
  const calibration = input.calibration ?? null
  const actualIds =
    calibration?.terminals.flatMap(({ outcomes }) =>
      outcomes.map(({ attemptId }) => attemptId),
    ) ?? []
  if (
    calibration !== null &&
    (canonical(actualIds) !== canonical(declaredCalibrationIdentityIds) ||
      new Set(actualIds).size !== 8)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V3_IDENTITIES_INVALID")
  }
  const admitted = calibration?.status === "admitted"
  const status = admitted
    ? ("calibration_admitted" as const)
    : ("stopped_process_failure" as const)
  const reason = refused
    ? ("RESOURCE_POLICY_HOST_HEADROOM" as const)
    : (calibration?.reason ?? null)
  const chargedDispositions = declaredCalibrationIdentityIds.map(
    (attemptId) => ({
      attemptId,
      disposition: refused
        ? ("unfilled_resource_preflight_refusal" as const)
        : ("terminal_calibration_outcome" as const),
    }),
  )
  const executionAuthorization = {
    root: authorization.executionAuthorizationRoot,
    consumed: true as const,
    expired: !admitted,
    terminalOutcome: admitted
      ? null
      : ("stopped_process_failure" as const),
  }
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorChargedLineage: preflight.predecessorRoots.orderedChargedLineage,
      preflightChargedRoot: preflight.chargedRoot,
      declaredCalibrationIdentityIds,
      chargedDispositions,
      calibrationRoot: calibration?.calibrationRoot ?? null,
      terminals: calibration?.terminals ?? [],
      executionAuthorization,
      acceptedCellCount: 0,
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-calibration-v3" as const,
    status,
    stage: "parallel_calibration_v3" as const,
    reason,
    preflightV3ReceiptRoot: preflight.receiptRoot,
    preflightV3ChargedRoot: preflight.chargedRoot,
    executionAuthorization,
    samplerPolicyRoot: authorization.samplerPolicyRoot,
    resourcePolicyRoot: V138_RESOURCE_POLICY_ROOT,
    predecessorRoots: preflight.predecessorRoots,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    declaredCalibrationIdentityIds,
    chargedDispositions,
    calibration,
    terminals: calibration?.terminals ?? [],
    chargedCalibrationAttemptCount: 8 as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot: sha256(canonical([])),
    acceptedCellCount: 0 as const,
    fullRunLaunched: false as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138ParallelCalibrationV3Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138ParallelCalibrationV3Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138ParallelCalibrationV3Receipt
    const preflight = checkV138HostHeadroomPreflightV3Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
          ),
          "utf8",
        ),
      ),
    )
    const expected = buildV138ParallelCalibrationV3Receipt({
      repoRoot,
      preflight,
      executionAuthorization: parseV138Plan26212ExecutionAuthorization(
        PLAN_262_12_EXECUTION_AUTHORIZATION_LITERAL,
      ),
      ...(receipt.calibration === null
        ? {}
        : { calibration: receipt.calibration }),
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_CALIBRATION_V3_RECEIPT_INVALID")
  }
}

export const writeV138ParallelCalibrationV3Receipt = async (
  repoRoot: string,
  targetPath: string,
  preflightPath: string,
  literalAuthorization: string,
): Promise<Readonly<V138ParallelCalibrationV3Receipt>> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
  )
  const authorization = parseV138Plan26212ExecutionAuthorization(
    literalAuthorization,
  )
  const preflight = checkV138HostHeadroomPreflightV3Receipt(
    repoRoot,
    JSON.parse(readFileSync(preflightPath, "utf8")),
  )
  const calibration =
    preflight.disposition === "preflight_admitted"
      ? await calibrateV138ParallelMatrix({
          inventory: enumerateV138CurrentMatrix(repoRoot),
          hardwareIdentity: {
            operatingSystem: `${platform()} ${release()}`,
            architecture: arch(),
            nodeVersion: process.version,
            cpuIdentity: cpus()[0]?.model ?? "unavailable",
          },
          repoRoot,
          executionIdentityVersion: "v3",
        })
      : undefined
  const receipt = buildV138ParallelCalibrationV3Receipt({
    repoRoot,
    preflight,
    executionAuthorization: authorization,
    ...(calibration === undefined ? {} : { calibration }),
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export interface V138AuthoritativeMatrixV3Receipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v3"
  readonly status: "passed_exact" | "stopped_process_failure"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: V138ParallelStopReason | null
  readonly calibrationV2ReceiptRoot: Sha256
  readonly calibrationV2ChargedAttemptLedgerRoot: Sha256
  readonly diagnosticV2ReceiptRoot: Sha256
  readonly predecessorReceiptRoot: Sha256
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly execution: V138ParallelMatrixExecutionResult
  readonly executionIdentityRoot: Sha256
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0 | 540
  readonly fullRunLaunched: true
  readonly totalWallMilliseconds: number
  readonly maximumChildRssKilobytes: number
  readonly historicalPredicateMatched: boolean
  readonly canonicalReceipt: Readonly<V138CurrentMatrixReceipt> | null
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const v3WithoutRoot = (
  receipt: V138AuthoritativeMatrixV3Receipt,
): Omit<V138AuthoritativeMatrixV3Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138AuthoritativeMatrixV3Receipt = (input: {
  repoRoot: string
  calibrationV2: Readonly<V138ParallelCalibrationV2SuccessorReceipt>
  execution: V138ParallelMatrixExecutionResult
}): Readonly<V138AuthoritativeMatrixV3Receipt> => {
  const calibrationV2 = checkV138ParallelCalibrationV2Receipt(
    input.repoRoot,
    input.calibrationV2,
  )
  if (calibrationV2.status !== "calibration_admitted") {
    throw new TypeError("MATRIX_CALIBRATION_V2_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  const plan = planV138MatrixShards(inventory)
  const expectedV3Ids = inventory.attempts.map(
    ({ attemptId }) => `reproduction:v3:${attemptId}`,
  )
  const actualV3Ids = input.execution.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  const canonicalTerminals = input.execution.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId: outcome.attemptId.replace(/^reproduction:v3:/u, ""),
    })),
  }))
  const recomputedAccounting = reduceV138ParallelMatrixAccounting({
    inventory,
    plan,
    terminals: canonicalTerminals,
    launchEvents: input.execution.launchEvents.map((event) => ({
      ...event,
      executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
        attemptId.replace(/^reproduction:v3:/u, ""),
      ),
    })),
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.launchEvents.some(
            (event) => event.shardId === shardId,
          ),
      )
      .map(({ shardId }) => shardId),
  })
  if (
    canonical(input.execution.accounting) !== canonical(recomputedAccounting) ||
    input.execution.batchWallMilliseconds >
      V138_PARALLEL_RESOURCE_POLICY.maxTotalRunMilliseconds ||
    (input.execution.status === "complete_pending_publication" &&
      canonical(actualV3Ids) !== canonical(expectedV3Ids))
  ) {
    throw new TypeError("MATRIX_AUTHORITATIVE_V3_EXECUTION_INVALID")
  }
  const canonicalOutcomes = input.execution.canonicalOutcomes.map((outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v3:/u, ""),
  })) as V138CurrentMatrixAttemptOutcome[]
  const passed = input.execution.status === "complete_pending_publication"
  const canonicalReceipt = passed
    ? reduceV138CurrentMatrix(inventory, canonicalOutcomes)
    : null
  const executionIdentityRoot = sha256(canonical(actualV3Ids))
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      calibrationV2ChargedAttemptLedgerRoot:
        calibrationV2.chargedAttemptLedgerRoot,
      executionIdentityRoot,
      execution: input.execution,
      canonicalChargedAttemptLedgerRoot:
        canonicalReceipt?.chargedAttemptLedgerRoot ?? sha256(canonical([])),
    }),
  )
  const acceptedCellLedgerRoot =
    canonicalReceipt?.acceptedCellLedgerRoot ?? sha256(canonical([]))
  const maximumChildRssKilobytes = Math.max(
    0,
    ...input.execution.terminals.map(({ maxRssKilobytes }) => maxRssKilobytes),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v3" as const,
    status: passed
      ? ("passed_exact" as const)
      : ("stopped_process_failure" as const),
    fixturePurpose: FIXTURE_PURPOSE,
    reason: passed ? null : input.execution.reason,
    calibrationV2ReceiptRoot: calibrationV2.receiptRoot,
    calibrationV2ChargedAttemptLedgerRoot:
      calibrationV2.chargedAttemptLedgerRoot,
    diagnosticV2ReceiptRoot: calibrationV2.diagnosticV2ReceiptRoot,
    predecessorReceiptRoot: calibrationV2.predecessor.receiptRoot,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    execution: input.execution,
    executionIdentityRoot,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot,
    acceptedCellCount: passed ? (540 as const) : (0 as const),
    fullRunLaunched: true as const,
    totalWallMilliseconds: input.execution.batchWallMilliseconds,
    maximumChildRssKilobytes,
    historicalPredicateMatched: canonicalReceipt !== null,
    canonicalReceipt,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138AuthoritativeMatrixV3Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138AuthoritativeMatrixV3Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138AuthoritativeMatrixV3Receipt
    const calibrationV2 = checkV138ParallelCalibrationV2Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-calibration-v2.json",
          ),
          "utf8",
        ),
      ),
    )
    const expected = buildV138AuthoritativeMatrixV3Receipt({
      repoRoot,
      calibrationV2,
      execution: receipt.execution,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_AUTHORITATIVE_V3_RECEIPT_INVALID")
  }
}

export const writeV138AuthoritativeMatrixV3Receipt = async (
  repoRoot: string,
  targetPath: string,
  calibrationPath: string,
): Promise<Readonly<V138AuthoritativeMatrixV3Receipt>> => {
  const calibrationV2 = checkV138ParallelCalibrationV2Receipt(
    repoRoot,
    JSON.parse(readFileSync(calibrationPath, "utf8")),
  )
  if (calibrationV2.status !== "calibration_admitted") {
    throw new TypeError("MATRIX_CALIBRATION_V2_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const execution = await executeV138ParallelMatrix({
    inventory,
    calibration: calibrationV2.calibration,
    repoRoot,
    executionIdentityVersion: "v3",
  })
  const receipt = buildV138AuthoritativeMatrixV3Receipt({
    repoRoot,
    calibrationV2,
    execution,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export const checkV138SuccessorV2V3Branch = (
  repoRoot: string,
  calibrationInput: unknown,
  v3Input: unknown | undefined,
): Readonly<{
  calibration: V138ParallelCalibrationV2SuccessorReceipt
  reproduction: V138AuthoritativeMatrixV3Receipt | null
}> => {
  const calibration = checkV138ParallelCalibrationV2Receipt(
    repoRoot,
    calibrationInput,
  )
  if (calibration.status === "stopped_process_failure") {
    if (v3Input !== undefined) {
      throw new TypeError("MATRIX_STOPPED_CALIBRATION_V3_FORBIDDEN")
    }
    return deepFreeze({ calibration, reproduction: null })
  }
  if (v3Input === undefined) {
    throw new TypeError("MATRIX_ADMITTED_CALIBRATION_V3_REQUIRED")
  }
  return deepFreeze({
    calibration,
    reproduction: checkV138AuthoritativeMatrixV3Receipt(repoRoot, v3Input),
  })
}

export interface V138AuthoritativeMatrixV4Receipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v4"
  readonly status: "passed_exact" | "stopped_process_failure"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: V138ParallelStopReason | null
  readonly calibrationV3ReceiptRoot: Sha256
  readonly calibrationV3ChargedAttemptLedgerRoot: Sha256
  readonly preflightV3ReceiptRoot: Sha256
  readonly executionAuthorizationRoot: Sha256
  readonly executionAuthorizationExpired: true
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly execution: V138ParallelMatrixExecutionResult
  readonly executionIdentityRoot: Sha256
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0 | 540
  readonly fullRunLaunched: true
  readonly totalWallMilliseconds: number
  readonly maximumChildRssKilobytes: number
  readonly historicalPredicateMatched: boolean
  readonly canonicalReceipt: Readonly<V138CurrentMatrixReceipt> | null
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const v4WithoutRoot = (
  receipt: V138AuthoritativeMatrixV4Receipt,
): Omit<V138AuthoritativeMatrixV4Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138AuthoritativeMatrixV4Receipt = (input: {
  repoRoot: string
  calibrationV3: Readonly<V138ParallelCalibrationV3Receipt>
  execution: V138ParallelMatrixExecutionResult
}): Readonly<V138AuthoritativeMatrixV4Receipt> => {
  const calibrationV3 = input.calibrationV3
  if (
    calibrationV3.receiptRoot !==
      sha256(canonical(calibrationV3WithoutRoot(calibrationV3))) ||
    calibrationV3.status !== "calibration_admitted" ||
    calibrationV3.calibration === null ||
    calibrationV3.executionAuthorization.expired
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V3_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  validateParallelCalibrationReceipt(
    inventory,
    calibrationV3.calibration,
    "v3",
  )
  const plan = planV138MatrixShards(inventory)
  const expectedV4Ids = inventory.attempts.map(
    ({ attemptId }) => `reproduction:v4:${attemptId}`,
  )
  const actualV4Ids = input.execution.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  const canonicalTerminals = input.execution.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId: outcome.attemptId.replace(/^reproduction:v4:/u, ""),
    })),
  }))
  const recomputedAccounting = reduceV138ParallelMatrixAccounting({
    inventory,
    plan,
    terminals: canonicalTerminals,
    launchEvents: input.execution.launchEvents.map((event) => ({
      ...event,
      executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
        attemptId.replace(/^reproduction:v4:/u, ""),
      ),
    })),
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.launchEvents.some(
            (event) => event.shardId === shardId,
          ),
      )
      .map(({ shardId }) => shardId),
  })
  if (
    canonical(input.execution.accounting) !== canonical(recomputedAccounting) ||
    input.execution.batchWallMilliseconds >
      V138_PARALLEL_RESOURCE_POLICY.maxTotalRunMilliseconds ||
    actualV4Ids.some((id) => !id.startsWith("reproduction:v4:")) ||
    (input.execution.status === "complete_pending_publication" &&
      canonical(actualV4Ids) !== canonical(expectedV4Ids))
  ) {
    throw new TypeError("MATRIX_AUTHORITATIVE_V4_EXECUTION_INVALID")
  }
  const canonicalOutcomes = input.execution.canonicalOutcomes.map((outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v4:/u, ""),
  })) as V138CurrentMatrixAttemptOutcome[]
  const passed = input.execution.status === "complete_pending_publication"
  const canonicalReceipt = passed
    ? reduceV138CurrentMatrix(inventory, canonicalOutcomes)
    : null
  const executionIdentityRoot = sha256(canonical(actualV4Ids))
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorChargedLineage:
        calibrationV3.predecessorRoots.orderedChargedLineage,
      preflightV3ChargedRoot: calibrationV3.preflightV3ChargedRoot,
      calibrationV3ChargedAttemptLedgerRoot:
        calibrationV3.chargedAttemptLedgerRoot,
      executionIdentityRoot,
      execution: input.execution,
      canonicalChargedAttemptLedgerRoot:
        canonicalReceipt?.chargedAttemptLedgerRoot ?? sha256(canonical([])),
    }),
  )
  const maximumChildRssKilobytes = Math.max(
    0,
    ...input.execution.terminals.map(({ maxRssKilobytes }) => maxRssKilobytes),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v4" as const,
    status: passed
      ? ("passed_exact" as const)
      : ("stopped_process_failure" as const),
    fixturePurpose: FIXTURE_PURPOSE,
    reason: passed ? null : input.execution.reason,
    calibrationV3ReceiptRoot: calibrationV3.receiptRoot,
    calibrationV3ChargedAttemptLedgerRoot:
      calibrationV3.chargedAttemptLedgerRoot,
    preflightV3ReceiptRoot: calibrationV3.preflightV3ReceiptRoot,
    executionAuthorizationRoot: calibrationV3.executionAuthorization.root,
    executionAuthorizationExpired: true as const,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    execution: input.execution,
    executionIdentityRoot,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot:
      canonicalReceipt?.acceptedCellLedgerRoot ?? sha256(canonical([])),
    acceptedCellCount: passed ? (540 as const) : (0 as const),
    fullRunLaunched: true as const,
    totalWallMilliseconds: input.execution.batchWallMilliseconds,
    maximumChildRssKilobytes,
    historicalPredicateMatched: canonicalReceipt !== null,
    canonicalReceipt,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138AuthoritativeMatrixV4Receipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138AuthoritativeMatrixV4Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138AuthoritativeMatrixV4Receipt
    const calibrationV3 = checkV138ParallelCalibrationV3Receipt(
      repoRoot,
      JSON.parse(
        readFileSync(
          path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
          ),
          "utf8",
        ),
      ),
    )
    const expected = buildV138AuthoritativeMatrixV4Receipt({
      repoRoot,
      calibrationV3,
      execution: receipt.execution,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected)
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_AUTHORITATIVE_V4_RECEIPT_INVALID")
  }
}

export const writeV138AuthoritativeMatrixV4Receipt = async (
  repoRoot: string,
  targetPath: string,
  calibrationPath: string,
): Promise<Readonly<V138AuthoritativeMatrixV4Receipt>> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-reproduction-v4.json",
  )
  const calibrationV3 = checkV138ParallelCalibrationV3Receipt(
    repoRoot,
    JSON.parse(readFileSync(calibrationPath, "utf8")),
  )
  if (
    calibrationV3.status !== "calibration_admitted" ||
    calibrationV3.calibration === null
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V3_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const execution = await executeV138ParallelMatrix({
    inventory,
    calibration: calibrationV3.calibration,
    repoRoot,
    executionIdentityVersion: "v4",
  })
  const receipt = buildV138AuthoritativeMatrixV4Receipt({
    repoRoot,
    calibrationV3,
    execution,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export const checkV138SuccessorV3V4Branch = (
  repoRoot: string,
  calibrationInput: unknown,
  v4Input: unknown | undefined,
): Readonly<{
  calibration: V138ParallelCalibrationV3Receipt
  reproduction: V138AuthoritativeMatrixV4Receipt | null
}> => {
  const preflightPath = path.resolve(
    repoRoot,
    ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
  )
  const calibration = existsSync(preflightPath)
    ? checkV138ParallelCalibrationV3Receipt(repoRoot, calibrationInput)
    : (() => {
        const receipt = calibrationInput as V138ParallelCalibrationV3Receipt
        if (
          receipt === null ||
          typeof receipt !== "object" ||
          Array.isArray(receipt) ||
          receipt.receiptRoot !==
            sha256(canonical(calibrationV3WithoutRoot(receipt)))
        ) {
          throw new TypeError("MATRIX_CALIBRATION_V3_RECEIPT_INVALID")
        }
        return receipt
      })()
  if (calibration.status === "stopped_process_failure") {
    if (
      calibration.acceptedCellCount !== 0 ||
      calibration.fullRunLaunched ||
      v4Input !== undefined
    ) {
      throw new TypeError("MATRIX_STOPPED_CALIBRATION_V4_FORBIDDEN")
    }
    return deepFreeze({ calibration, reproduction: null })
  }
  if (v4Input === undefined) {
    throw new TypeError("MATRIX_ADMITTED_CALIBRATION_V4_REQUIRED")
  }
  const reproduction = checkV138AuthoritativeMatrixV4Receipt(
    repoRoot,
    v4Input,
  )
  if (
    reproduction.status !== "passed_exact" ||
    reproduction.acceptedCellCount !== 540
  ) {
    throw new TypeError("MATRIX_AUTHORITATIVE_V4_NOT_PASSED_EXACT")
  }
  return deepFreeze({ calibration, reproduction })
}

const PLAN_262_13_REPO_ROOT = "/Users/roryquinlan/runtime/cowards-game" as const
const PLAN_262_13_CLAIM_SCOPE =
  "plan_scoped_orchestrator_registry_not_os_global" as const
const PLAN_262_13_COMMAND_FAMILY = [
  "--write-execution-context-v4-receipt",
  "--check-execution-context-v4-receipt",
  "--write-headroom-preflight-v4-receipt",
  "--check-headroom-preflight-v4-receipt",
  "--calibrate-parallel-v4-receipt",
  "--check-calibration-v4-receipt",
  "--write-authoritative-v5-receipt",
  "--check-successor-v4-v5-branch",
] as const

const PLAN_262_13_SOURCE_PREDECESSORS = deepFreeze({
  implementation: {
    path: "scripts/lib/v1-38-current-matrix-reproduction.ts" as const,
    predecessorSha256:
      "sha256:e9f0bd91000dd4d089e627d9c6b7d93249ba58bd62724fbc413c450ca5c2ae84" as Sha256,
    predecessorGitBlob: "3eb530a64fc899810237d3fdf1b65202e6891627",
    predecessorProducingCommit:
      "02e25166652263fd6187937a1e02d81fb59a590d",
  },
  test: {
    path: "scripts/evaluate-v1-38-foundation-contract.test.ts" as const,
    predecessorSha256:
      "sha256:dcbe73205d4d49cf5ea7e223a379bf0c64865d4069929499798700a5fc184352" as Sha256,
    predecessorGitBlob: "e76cd133de615d6b7bf89ff91103f76699ee2849",
    predecessorProducingCommit:
      "f27f3165083f8c2cdc7c45b441ec1386191234ac",
  },
})

const PLAN_262_13_SEALED_PRODUCING_OBJECTS = deepFreeze({
  producingCommit: "622449af7087d6f8715dee47efcedd62ce461326",
  receipt: {
    path: ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
    blob: "16812805999c59f3c83e393412d4d39f3a6dc5a2",
    sha256:
      "sha256:693629bfdced2eecf5564d691cc0310fb5eabf428be944e721802417bce8ba24" as Sha256,
  },
  implementation: {
    path: "scripts/lib/v1-38-current-matrix-reproduction.ts",
    blob: "39de34dd1db9e6c90dfb2e62db9542c903e94d32",
    sha256:
      "sha256:c5a4040aea969b7ab2737251ad1520ebb096b53831c0a0451115571f5987943d" as Sha256,
  },
  test: {
    path: "scripts/evaluate-v1-38-foundation-contract.test.ts",
    blob: "41a79d91b652004204ff6c9adc6f4b85bc729ccb",
    sha256:
      "sha256:79d25c47222a0468ee1a3c9d41ed219bfb8fff807528a25801b0e84e1f41919e" as Sha256,
  },
})

export interface V138ProducingGitObjectContract {
  readonly resolveCommitPath: (input: Readonly<{
    producingCommit: string
    sourcePath: string
  }>) => Readonly<{
    blob: string
    content: Uint8Array
  }>
}

const defaultProducingGitObjects = (
  repoRoot: string,
): V138ProducingGitObjectContract => ({
  resolveCommitPath: ({ producingCommit, sourcePath }) => ({
    blob: git(repoRoot, ["rev-parse", `${producingCommit}:${sourcePath}`]),
    content: gitBlob(repoRoot, producingCommit, sourcePath),
  }),
})

type V138Plan26213TerminalAgentStatus = "completed" | "failed" | "cancelled"

export interface V138Plan26213AgentRegistryProjection {
  readonly planId: "262-13"
  readonly agents: readonly Readonly<{
    agentId: string
    taskName: string
    agentType: string
    status: V138Plan26213TerminalAgentStatus
  }>[]
  readonly activePlan26213AgentCount: 0
  readonly activePlan26213GsdExecutorCount: 0
  readonly claimScope: typeof PLAN_262_13_CLAIM_SCOPE
}

export interface V138ExecutionContextV4Receipt {
  readonly schemaVersion: "v1.38-current-matrix-execution-context-v4"
  readonly status: "execution_context_confirmed"
  readonly planId: "262-13"
  readonly mode: "gsd-pattern-c-inline-main"
  readonly executionOwner: "lean-main-orchestrator"
  readonly cwd: typeof PLAN_262_13_REPO_ROOT
  readonly commandFamily: typeof PLAN_262_13_COMMAND_FAMILY
  readonly claimScope: typeof PLAN_262_13_CLAIM_SCOPE
  readonly planAgentSnapshot: Readonly<V138Plan26213AgentRegistryProjection>
  readonly implementationSource: Readonly<
    typeof PLAN_262_13_SOURCE_PREDECESSORS.implementation & {
      currentSha256: Sha256
    }
  >
  readonly testSource: Readonly<
    typeof PLAN_262_13_SOURCE_PREDECESSORS.test & {
      currentSha256: Sha256
    }
  >
  readonly receiptRoot: Sha256
}

const executionContextV4WithoutRoot = (
  receipt: V138ExecutionContextV4Receipt,
): Omit<V138ExecutionContextV4Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

const assertPlan26213SourcePredecessor = (
  gitObjects: V138ProducingGitObjectContract,
  identity:
    | typeof PLAN_262_13_SOURCE_PREDECESSORS.implementation
    | typeof PLAN_262_13_SOURCE_PREDECESSORS.test,
): void => {
  const committed = gitObjects.resolveCommitPath({
    producingCommit: identity.predecessorProducingCommit,
    sourcePath: identity.path,
  })
  if (
    sha256(committed.content) !== identity.predecessorSha256 ||
    committed.blob !== identity.predecessorGitBlob
  ) {
    throw new TypeError("MATRIX_PLAN_262_13_SOURCE_PREDECESSOR_INVALID")
  }
}

const validatePlan26213AgentSnapshot = (
  input: unknown,
): Readonly<V138Plan26213AgentRegistryProjection> => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("MATRIX_PLAN_262_13_AGENT_SNAPSHOT_INVALID")
  }
  const snapshot = input as V138Plan26213AgentRegistryProjection
  if (
    canonical(Object.keys(snapshot)) !==
      canonical([
        "planId",
        "agents",
        "activePlan26213AgentCount",
        "activePlan26213GsdExecutorCount",
        "claimScope",
      ]) ||
    snapshot.planId !== "262-13" ||
    !Array.isArray(snapshot.agents) ||
    snapshot.activePlan26213AgentCount !== 0 ||
    snapshot.activePlan26213GsdExecutorCount !== 0 ||
    snapshot.claimScope !== PLAN_262_13_CLAIM_SCOPE
  ) {
    throw new TypeError("MATRIX_PLAN_262_13_AGENT_SNAPSHOT_INVALID")
  }
  const seen = new Set<string>()
  for (const agent of snapshot.agents) {
    if (
      agent === null ||
      typeof agent !== "object" ||
      Array.isArray(agent) ||
      canonical(Object.keys(agent)) !==
        canonical(["agentId", "taskName", "agentType", "status"]) ||
      typeof agent.agentId !== "string" ||
      agent.agentId.length === 0 ||
      seen.has(agent.agentId) ||
      typeof agent.taskName !== "string" ||
      agent.taskName.length === 0 ||
      typeof agent.agentType !== "string" ||
      agent.agentType.length === 0 ||
      !["completed", "failed", "cancelled"].includes(agent.status)
    ) {
      throw new TypeError("MATRIX_PLAN_262_13_AGENT_SNAPSHOT_INVALID")
    }
    seen.add(agent.agentId)
  }
  const safeProjection = JSON.stringify(snapshot)
  if (
    /(?:prompt|message|process(?:es)?|pid|commandLine|environment|StrategyMemory|SoldierMemory|objective)/iu.test(
      safeProjection,
    )
  ) {
    throw new TypeError("MATRIX_PLAN_262_13_AGENT_SNAPSHOT_UNSAFE")
  }
  return deepFreeze(cloneCanonical(snapshot))
}

const cloneCanonical = <T>(value: T): T =>
  JSON.parse(canonical(value)) as T

export const buildV138ExecutionContextV4Receipt = (input: {
  repoRoot: string
  mode: string
  cwd: string
  planAgentSnapshot: unknown
}): Readonly<V138ExecutionContextV4Receipt> => {
  if (
    path.resolve(input.repoRoot) !== PLAN_262_13_REPO_ROOT ||
    input.mode !== "gsd-pattern-c-inline-main" ||
    input.cwd !== PLAN_262_13_REPO_ROOT
  ) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V4_INPUT_INVALID")
  }
  const gitObjects = defaultProducingGitObjects(input.repoRoot)
  assertPlan26213SourcePredecessor(
    gitObjects,
    PLAN_262_13_SOURCE_PREDECESSORS.implementation,
  )
  assertPlan26213SourcePredecessor(
    gitObjects,
    PLAN_262_13_SOURCE_PREDECESSORS.test,
  )
  const planAgentSnapshot = validatePlan26213AgentSnapshot(
    input.planAgentSnapshot,
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-execution-context-v4" as const,
    status: "execution_context_confirmed" as const,
    planId: "262-13" as const,
    mode: "gsd-pattern-c-inline-main" as const,
    executionOwner: "lean-main-orchestrator" as const,
    cwd: PLAN_262_13_REPO_ROOT,
    commandFamily: PLAN_262_13_COMMAND_FAMILY,
    claimScope: PLAN_262_13_CLAIM_SCOPE,
    planAgentSnapshot,
    implementationSource: {
      ...PLAN_262_13_SOURCE_PREDECESSORS.implementation,
      currentSha256: sha256(
        readFileSync(
          path.resolve(
            input.repoRoot,
            PLAN_262_13_SOURCE_PREDECESSORS.implementation.path,
          ),
        ),
      ),
    },
    testSource: {
      ...PLAN_262_13_SOURCE_PREDECESSORS.test,
      currentSha256: sha256(
        readFileSync(
          path.resolve(
            input.repoRoot,
            PLAN_262_13_SOURCE_PREDECESSORS.test.path,
          ),
        ),
      ),
    },
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

const validateV138ExecutionContextV4Structure = (
  input: unknown,
): Readonly<V138ExecutionContextV4Receipt> => {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError()
  }
  const receipt = input as V138ExecutionContextV4Receipt
  const snapshot = validatePlan26213AgentSnapshot(receipt.planAgentSnapshot)
  const sourceKeys = canonical([
    "path",
    "predecessorSha256",
    "predecessorGitBlob",
    "predecessorProducingCommit",
    "currentSha256",
  ])
  if (
    canonical(Object.keys(receipt)) !==
      canonical([
        "schemaVersion",
        "status",
        "planId",
        "mode",
        "executionOwner",
        "cwd",
        "commandFamily",
        "claimScope",
        "planAgentSnapshot",
        "implementationSource",
        "testSource",
        "receiptRoot",
      ]) ||
    receipt.schemaVersion !== "v1.38-current-matrix-execution-context-v4" ||
    receipt.status !== "execution_context_confirmed" ||
    receipt.planId !== "262-13" ||
    receipt.mode !== "gsd-pattern-c-inline-main" ||
    receipt.executionOwner !== "lean-main-orchestrator" ||
    receipt.cwd !== PLAN_262_13_REPO_ROOT ||
    canonical(receipt.commandFamily) !==
      canonical(PLAN_262_13_COMMAND_FAMILY) ||
    receipt.claimScope !== PLAN_262_13_CLAIM_SCOPE ||
    canonical(receipt.planAgentSnapshot) !== canonical(snapshot) ||
    canonical(Object.keys(receipt.implementationSource)) !== sourceKeys ||
    canonical(Object.keys(receipt.testSource)) !== sourceKeys ||
    receipt.implementationSource.path !==
      PLAN_262_13_SOURCE_PREDECESSORS.implementation.path ||
    receipt.implementationSource.predecessorSha256 !==
      PLAN_262_13_SOURCE_PREDECESSORS.implementation.predecessorSha256 ||
    receipt.implementationSource.predecessorGitBlob !==
      PLAN_262_13_SOURCE_PREDECESSORS.implementation.predecessorGitBlob ||
    receipt.implementationSource.predecessorProducingCommit !==
      PLAN_262_13_SOURCE_PREDECESSORS.implementation.predecessorProducingCommit ||
    receipt.testSource.path !== PLAN_262_13_SOURCE_PREDECESSORS.test.path ||
    receipt.testSource.predecessorSha256 !==
      PLAN_262_13_SOURCE_PREDECESSORS.test.predecessorSha256 ||
    receipt.testSource.predecessorGitBlob !==
      PLAN_262_13_SOURCE_PREDECESSORS.test.predecessorGitBlob ||
    receipt.testSource.predecessorProducingCommit !==
      PLAN_262_13_SOURCE_PREDECESSORS.test.predecessorProducingCommit ||
    !/^sha256:[0-9a-f]{64}$/u.test(receipt.implementationSource.currentSha256) ||
    !/^sha256:[0-9a-f]{64}$/u.test(receipt.testSource.currentSha256) ||
    receipt.receiptRoot !==
      sha256(canonical(executionContextV4WithoutRoot(receipt)))
  ) {
    throw new TypeError()
  }
  return deepFreeze(cloneCanonical(receipt))
}

export const checkV138ExecutionContextV4Receipt = (
  repoRoot: string,
  input: unknown,
  gitObjects: V138ProducingGitObjectContract =
    defaultProducingGitObjects(repoRoot),
): Readonly<V138ExecutionContextV4Receipt> => {
  try {
    const receipt = validateV138ExecutionContextV4Structure(input)
    const sealed = PLAN_262_13_SEALED_PRODUCING_OBJECTS
    const receiptObject = gitObjects.resolveCommitPath({
      producingCommit: sealed.producingCommit,
      sourcePath: sealed.receipt.path,
    })
    const implementationObject = gitObjects.resolveCommitPath({
      producingCommit: sealed.producingCommit,
      sourcePath: sealed.implementation.path,
    })
    const testObject = gitObjects.resolveCommitPath({
      producingCommit: sealed.producingCommit,
      sourcePath: sealed.test.path,
    })
    assertPlan26213SourcePredecessor(
      gitObjects,
      PLAN_262_13_SOURCE_PREDECESSORS.implementation,
    )
    assertPlan26213SourcePredecessor(
      gitObjects,
      PLAN_262_13_SOURCE_PREDECESSORS.test,
    )
    if (
      receiptObject.blob !== sealed.receipt.blob ||
      sha256(receiptObject.content) !== sealed.receipt.sha256 ||
      canonical(JSON.parse(Buffer.from(receiptObject.content).toString("utf8"))) !==
        canonical(receipt) ||
      implementationObject.blob !== sealed.implementation.blob ||
      sha256(implementationObject.content) !== sealed.implementation.sha256 ||
      receipt.implementationSource.currentSha256 !==
        sealed.implementation.sha256 ||
      testObject.blob !== sealed.test.blob ||
      sha256(testObject.content) !== sealed.test.sha256 ||
      receipt.testSource.currentSha256 !== sealed.test.sha256
    ) {
      throw new TypeError()
    }
    return receipt
  } catch {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V4_RECEIPT_INVALID")
  }
}

export const writeV138ExecutionContextV4Receipt = (
  repoRoot: string,
  targetPath: string,
  mode: string,
  cwd: string,
  planAgentSnapshot: unknown,
): Readonly<V138ExecutionContextV4Receipt> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
  )
  const receipt = buildV138ExecutionContextV4Receipt({
    repoRoot,
    mode,
    cwd,
    planAgentSnapshot,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export const PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL =
  "Authorize Plan 262-13 for exactly one lean-orchestrator headroom-preflight:v4, exactly one calibration:v4 eight-attempt set, and—only if calibration:v4 is admitted—at most one reproduction:v5 540-cell run, using the unchanged frozen authorized-unsandboxed-ps sampler policy. This authorization is single-use and expires at the first terminal Plan 262-13 outcome." as const

const PLAN_262_13_AUTHORIZATION_SELECTION =
  "authorize-plan-262-13-lean-single-run" as const
const PLAN_262_12_AUTHORIZATION_ROOT =
  "sha256:a903e1e58315aec0751db4e5df99ce8cf31a4b4e92536d0291a25aa31ce484c4" as const

export interface V138Plan26213ExecutionAuthorization {
  readonly literalAuthorization: typeof PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL
  readonly planId: "262-13"
  readonly leanOrchestratorOnly: true
  readonly headroomPreflightCount: 1
  readonly calibrationSetCount: 1
  readonly calibrationAttemptCount: 8
  readonly reproductionMaximumCount: 1
  readonly reproductionCellCount: 540
  readonly reproductionConditionalOnCalibrationAdmission: true
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly singleUse: true
  readonly expiresAtFirstTerminalOutcome: true
  readonly consumed: false
  readonly terminalOutcome: null
  readonly executionAuthorizationRoot: Sha256
}

export const parseV138Plan26213ExecutionAuthorization = (
  literalAuthorization: string,
  usage: Readonly<{
    consumed: boolean
    terminalOutcome: "passed_exact" | "stopped_process_failure" | null
  }> = { consumed: false, terminalOutcome: null },
): Readonly<V138Plan26213ExecutionAuthorization> => {
  if (literalAuthorization !== PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL) {
    throw new TypeError(
      "MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_REQUIRED",
    )
  }
  if (usage.terminalOutcome !== null) {
    throw new TypeError("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_EXPIRED")
  }
  if (usage.consumed) {
    throw new TypeError("MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_CONSUMED")
  }
  const authority = {
    literalAuthorization: PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    planId: "262-13" as const,
    leanOrchestratorOnly: true as const,
    headroomPreflightCount: 1 as const,
    calibrationSetCount: 1 as const,
    calibrationAttemptCount: 8 as const,
    reproductionMaximumCount: 1 as const,
    reproductionCellCount: 540 as const,
    reproductionConditionalOnCalibrationAdmission: true as const,
    samplerPolicyRoot: PLAN_262_11_SAMPLER_POLICY_ROOT,
    singleUse: true as const,
    expiresAtFirstTerminalOutcome: true as const,
    consumed: false as const,
    terminalOutcome: null,
  }
  const executionAuthorizationRoot = sha256(canonical(authority))
  if (
    executionAuthorizationRoot === PLAN_262_11_SAMPLER_POLICY_ROOT ||
    executionAuthorizationRoot === PLAN_262_12_AUTHORIZATION_ROOT
  ) {
    throw new TypeError(
      "MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_ROOT_COLLISION",
    )
  }
  return deepFreeze({ ...authority, executionAuthorizationRoot })
}

const parseV138Plan26213AuthorizationSelection = (
  selection: string,
): Readonly<V138Plan26213ExecutionAuthorization> => {
  if (selection !== PLAN_262_13_AUTHORIZATION_SELECTION) {
    throw new TypeError(
      "MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_REQUIRED",
    )
  }
  return parseV138Plan26213ExecutionAuthorization(
    PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
  )
}

const PLAN_262_12_IMMUTABLE_LINEAGE = deepFreeze({
  preflight: {
    path: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v3.json",
    fileSha256:
      "sha256:b432f5640bb23f6ce66d3705f292151fdff8ff09c961b5693e30c25fc5f5420f" as Sha256,
    gitBlob: "252c996fe64ed117964e542235a6af20698c3c74",
    producingCommit: "f27f3165083f8c2cdc7c45b441ec1386191234ac",
    receiptRoot:
      "sha256:4e52cccbc6384cda9bef1c26c9e4f36d666e26506f760f749b4f0195677cb20d" as Sha256,
    chargedRoot:
      "sha256:8703f882e659a24d29b4e51e6e45a172afc35389b955038d6da83d304ca22de7" as Sha256,
    executionAuthorizationRoot: PLAN_262_12_AUTHORIZATION_ROOT,
    disposition: "preflight_refused" as const,
  },
  calibration: {
    path: ".planning/artifacts/v1.38-current-matrix-calibration-v3.json",
    fileSha256:
      "sha256:29a406e67f7163152c99c07c0f75ed5a0af8840b6c34372668265f2df10bc79d" as Sha256,
    gitBlob: "41e78c25f341c190a306f794355e7e732811c881",
    producingCommit: "f27f3165083f8c2cdc7c45b441ec1386191234ac",
    receiptRoot:
      "sha256:911a6bbc700036f9d3916ac9b171b246a676b2b7dd33f24c8b85a8c4dbdb3ffd" as Sha256,
    chargedRoot:
      "sha256:2103fbb3bbc98427fdd81b8435f42e7d8c13ee2d2a995be4da463e02efcb4e35" as Sha256,
    disposition: "stopped_process_failure" as const,
  },
})

const assertPlan26212ImmutableLineage = (
  repoRoot: string,
): Readonly<{
  plan26212Preflight: typeof PLAN_262_12_IMMUTABLE_LINEAGE.preflight
  plan26212Calibration: typeof PLAN_262_12_IMMUTABLE_LINEAGE.calibration
  orderedChargedLineage: readonly Sha256[]
}> => {
  const preflightBytes = readFileSync(
    path.resolve(repoRoot, PLAN_262_12_IMMUTABLE_LINEAGE.preflight.path),
  )
  const calibrationBytes = readFileSync(
    path.resolve(repoRoot, PLAN_262_12_IMMUTABLE_LINEAGE.calibration.path),
  )
  const preflight = JSON.parse(preflightBytes.toString("utf8")) as
    V138HostHeadroomPreflightV3Receipt
  const calibration = JSON.parse(calibrationBytes.toString("utf8")) as
    V138ParallelCalibrationV3Receipt
  const identities = [
    [PLAN_262_12_IMMUTABLE_LINEAGE.preflight, preflightBytes],
    [PLAN_262_12_IMMUTABLE_LINEAGE.calibration, calibrationBytes],
  ] as const
  for (const [identity, bytes] of identities) {
    if (
      sha256(bytes) !== identity.fileSha256 ||
      git(repoRoot, ["hash-object", identity.path]) !== identity.gitBlob ||
      sha256(gitBlob(repoRoot, identity.producingCommit, identity.path)) !==
        identity.fileSha256
    ) {
      throw new TypeError("MATRIX_PLAN_262_12_LINEAGE_INVALID")
    }
  }
  if (
    preflight.receiptRoot !==
      PLAN_262_12_IMMUTABLE_LINEAGE.preflight.receiptRoot ||
    preflight.chargedRoot !==
      PLAN_262_12_IMMUTABLE_LINEAGE.preflight.chargedRoot ||
    preflight.executionAuthorizationRoot !==
      PLAN_262_12_IMMUTABLE_LINEAGE.preflight.executionAuthorizationRoot ||
    preflight.disposition !==
      PLAN_262_12_IMMUTABLE_LINEAGE.preflight.disposition ||
    calibration.receiptRoot !==
      PLAN_262_12_IMMUTABLE_LINEAGE.calibration.receiptRoot ||
    calibration.chargedAttemptLedgerRoot !==
      PLAN_262_12_IMMUTABLE_LINEAGE.calibration.chargedRoot ||
    calibration.status !==
      PLAN_262_12_IMMUTABLE_LINEAGE.calibration.disposition ||
    calibration.executionAuthorization.root !== PLAN_262_12_AUTHORIZATION_ROOT ||
    !calibration.executionAuthorization.expired
  ) {
    throw new TypeError("MATRIX_PLAN_262_12_LINEAGE_INVALID")
  }
  return deepFreeze({
    plan26212Preflight: PLAN_262_12_IMMUTABLE_LINEAGE.preflight,
    plan26212Calibration: PLAN_262_12_IMMUTABLE_LINEAGE.calibration,
    orderedChargedLineage: [
      ...calibration.predecessorRoots.orderedChargedLineage,
      preflight.chargedRoot,
      calibration.chargedAttemptLedgerRoot,
    ],
  })
}

export interface V138HostHeadroomPreflightV4Receipt {
  readonly schemaVersion: "v1.38-current-matrix-headroom-preflight-v4"
  readonly status: "preflight_complete"
  readonly chargedIdentityId: "preflight:v4:0"
  readonly hostTotalMemoryKilobytes: number
  readonly hostFreeMemoryKilobytes: number
  readonly hostHeadroomBasisPoints: number
  readonly requiredHostHeadroomBasisPoints: 2500
  readonly disposition: "preflight_admitted" | "preflight_refused"
  readonly executionContextV4ReceiptRoot: Sha256
  readonly resourcePolicyRoot: typeof V138_RESOURCE_POLICY_ROOT
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly executionAuthorizationRoot: Sha256
  readonly sourceRoot: Sha256
  readonly predecessorRoots: Readonly<{
    plan26212Preflight: typeof PLAN_262_12_IMMUTABLE_LINEAGE.preflight
    plan26212Calibration: typeof PLAN_262_12_IMMUTABLE_LINEAGE.calibration
    orderedChargedLineage: readonly Sha256[]
  }>
  readonly chargedRoot: Sha256
  readonly receiptRoot: Sha256
}

const preflightV4WithoutRoot = (
  receipt: V138HostHeadroomPreflightV4Receipt,
): Omit<V138HostHeadroomPreflightV4Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138HostHeadroomPreflightV4Receipt = (input: {
  repoRoot: string
  executionContext: Readonly<V138ExecutionContextV4Receipt>
  executionAuthorization: Readonly<V138Plan26213ExecutionAuthorization>
  hostTotalMemoryKilobytes: number
  hostFreeMemoryKilobytes: number
}): Readonly<V138HostHeadroomPreflightV4Receipt> => {
  const executionContext = validateV138ExecutionContextV4Structure(
    input.executionContext,
  )
  const authorization = parseV138Plan26213ExecutionAuthorization(
    input.executionAuthorization.literalAuthorization,
  )
  if (
    canonical(input.executionAuthorization) !== canonical(authorization) ||
    !Number.isSafeInteger(input.hostTotalMemoryKilobytes) ||
    input.hostTotalMemoryKilobytes <= 0 ||
    !Number.isSafeInteger(input.hostFreeMemoryKilobytes) ||
    input.hostFreeMemoryKilobytes < 0 ||
    input.hostFreeMemoryKilobytes > input.hostTotalMemoryKilobytes
  ) {
    throw new TypeError("MATRIX_HEADROOM_PREFLIGHT_V4_INPUT_INVALID")
  }
  const predecessors = assertPlan26212ImmutableLineage(input.repoRoot)
  const hostHeadroomBasisPoints = Math.floor(
    (input.hostFreeMemoryKilobytes * 10_000) /
      input.hostTotalMemoryKilobytes,
  )
  const chargedFrame = {
    chargedIdentityId: "preflight:v4:0" as const,
    hostTotalMemoryKilobytes: input.hostTotalMemoryKilobytes,
    hostFreeMemoryKilobytes: input.hostFreeMemoryKilobytes,
    hostHeadroomBasisPoints,
    requiredHostHeadroomBasisPoints: 2_500 as const,
    executionContextV4ReceiptRoot: executionContext.receiptRoot,
    resourcePolicyRoot: V138_RESOURCE_POLICY_ROOT,
    samplerPolicyRoot: authorization.samplerPolicyRoot,
    executionAuthorizationRoot: authorization.executionAuthorizationRoot,
    sourceRoot: executionContext.implementationSource.currentSha256,
    predecessorRoots: predecessors,
  }
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v4" as const,
    status: "preflight_complete" as const,
    ...chargedFrame,
    disposition:
      hostHeadroomBasisPoints >= 2_500
        ? ("preflight_admitted" as const)
        : ("preflight_refused" as const),
    chargedRoot: sha256(canonical(chargedFrame)),
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138HostHeadroomPreflightV4Receipt = (
  repoRoot: string,
  input: unknown,
  executionContextInput?: unknown,
): Readonly<V138HostHeadroomPreflightV4Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138HostHeadroomPreflightV4Receipt
    const context =
      executionContextInput === undefined
        ? checkV138ExecutionContextV4Receipt(
            repoRoot,
            JSON.parse(
              readFileSync(
                path.resolve(
                  repoRoot,
                  ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
                ),
                "utf8",
              ),
            ),
          )
        : validateV138ExecutionContextV4Structure(executionContextInput)
    const expected = buildV138HostHeadroomPreflightV4Receipt({
      repoRoot,
      executionContext: context,
      executionAuthorization: parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
      ),
      hostTotalMemoryKilobytes: receipt.hostTotalMemoryKilobytes,
      hostFreeMemoryKilobytes: receipt.hostFreeMemoryKilobytes,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected) ||
      receipt.receiptRoot !== sha256(canonical(preflightV4WithoutRoot(receipt)))
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_HEADROOM_PREFLIGHT_V4_RECEIPT_INVALID")
  }
}

export const writeV138HostHeadroomPreflightV4Receipt = (
  repoRoot: string,
  targetPath: string,
  executionContextPath: string,
  authorizationSelection: string,
): Readonly<V138HostHeadroomPreflightV4Receipt> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
  )
  const executionContext = checkV138ExecutionContextV4Receipt(
    repoRoot,
    JSON.parse(readFileSync(executionContextPath, "utf8")),
  )
  const receipt = buildV138HostHeadroomPreflightV4Receipt({
    repoRoot,
    executionContext,
    executionAuthorization: parseV138Plan26213AuthorizationSelection(
      authorizationSelection,
    ),
    hostTotalMemoryKilobytes: Math.floor(totalmem() / 1024),
    hostFreeMemoryKilobytes: Math.floor(freemem() / 1024),
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export interface V138ParallelCalibrationV4Receipt {
  readonly schemaVersion: "v1.38-current-matrix-calibration-v4"
  readonly status: "calibration_admitted" | "stopped_process_failure"
  readonly stage: "parallel_calibration_v4"
  readonly reason: V138ParallelStopReason | null
  readonly executionContextV4ReceiptRoot: Sha256
  readonly preflightV4ReceiptRoot: Sha256
  readonly preflightV4ChargedRoot: Sha256
  readonly executionAuthorization: Readonly<{
    root: Sha256
    consumed: true
    expired: boolean
    terminalOutcome: "stopped_process_failure" | null
  }>
  readonly samplerPolicyRoot: typeof PLAN_262_11_SAMPLER_POLICY_ROOT
  readonly resourcePolicyRoot: typeof V138_RESOURCE_POLICY_ROOT
  readonly predecessorRoots: V138HostHeadroomPreflightV4Receipt["predecessorRoots"]
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly declaredCalibrationIdentityIds: readonly string[]
  readonly chargedDispositions: readonly Readonly<{
    attemptId: string
    disposition:
      | "terminal_calibration_outcome"
      | "unfilled_resource_preflight_refusal"
  }>[]
  readonly calibration: Readonly<V138ParallelCalibrationReceipt> | null
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly chargedCalibrationAttemptCount: 8
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0
  readonly fullRunLaunched: false
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const calibrationV4WithoutRoot = (
  receipt: V138ParallelCalibrationV4Receipt,
): Omit<V138ParallelCalibrationV4Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

const declaredCalibrationV4Ids = (repoRoot: string): readonly string[] =>
  deriveV138ParallelCalibrationPolicy(enumerateV138CurrentMatrix(repoRoot))
    .inventory.attempts.map(
      ({ calibrationAttemptId, templateAttemptId }, ordinal) =>
        `calibration:v4:${ordinal}:${templateAttemptId}`,
    )

export const buildV138ParallelCalibrationV4Receipt = (input: {
  repoRoot: string
  executionContext: Readonly<V138ExecutionContextV4Receipt>
  preflight: Readonly<V138HostHeadroomPreflightV4Receipt>
  executionAuthorization: Readonly<V138Plan26213ExecutionAuthorization>
  calibration?: Readonly<V138ParallelCalibrationReceipt> | undefined
}): Readonly<V138ParallelCalibrationV4Receipt> => {
  const executionContext = validateV138ExecutionContextV4Structure(
    input.executionContext,
  )
  const authorization = parseV138Plan26213ExecutionAuthorization(
    input.executionAuthorization.literalAuthorization,
  )
  if (canonical(input.executionAuthorization) !== canonical(authorization)) {
    throw new TypeError(
      "MATRIX_PLAN_262_13_EXECUTION_AUTHORIZATION_REQUIRED",
    )
  }
  const expectedPreflight = buildV138HostHeadroomPreflightV4Receipt({
    repoRoot: input.repoRoot,
    executionContext,
    executionAuthorization: authorization,
    hostTotalMemoryKilobytes: input.preflight.hostTotalMemoryKilobytes,
    hostFreeMemoryKilobytes: input.preflight.hostFreeMemoryKilobytes,
  })
  if (canonical(input.preflight) !== canonical(expectedPreflight)) {
    throw new TypeError("MATRIX_PREFLIGHT_V4_RECEIPT_INVALID")
  }
  const policyAttempts = deriveV138ParallelCalibrationPolicy(
    enumerateV138CurrentMatrix(input.repoRoot),
  ).inventory.attempts
  const declaredCalibrationIdentityIds = declaredCalibrationV4Ids(
    input.repoRoot,
  )
  const refused = input.preflight.disposition === "preflight_refused"
  if (refused !== (input.calibration === undefined)) {
    throw new TypeError("MATRIX_CALIBRATION_V4_BRANCH_INVALID")
  }
  if (input.calibration !== undefined) {
    validateParallelCalibrationReceipt(
      enumerateV138CurrentMatrix(input.repoRoot),
      input.calibration,
      "v4",
    )
  }
  const calibration = input.calibration ?? null
  const actualIds =
    calibration?.terminals.flatMap(({ outcomes }) =>
      outcomes.map(({ attemptId }) => attemptId),
    ) ?? []
  const runnerIdsToDeclared = actualIds.map((attemptId) => {
    const recordIndex = policyAttempts.findIndex(
      ({ calibrationAttemptId }) =>
        attemptId ===
        calibrationAttemptId.replace(/^calibration:v1:/u, "calibration:v4:"),
    )
    return recordIndex < 0
      ? attemptId
      : declaredCalibrationIdentityIds[recordIndex]!
  })
  if (
    calibration !== null &&
    (canonical(runnerIdsToDeclared) !==
      canonical(declaredCalibrationIdentityIds) ||
      new Set(actualIds).size !== 8)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V4_IDENTITIES_INVALID")
  }
  const admitted = calibration?.status === "admitted"
  const chargedDispositions = declaredCalibrationIdentityIds.map(
    (attemptId) => ({
      attemptId,
      disposition: refused
        ? ("unfilled_resource_preflight_refusal" as const)
        : ("terminal_calibration_outcome" as const),
    }),
  )
  const executionAuthorization = {
    root: authorization.executionAuthorizationRoot,
    consumed: true as const,
    expired: !admitted,
    terminalOutcome: admitted
      ? null
      : ("stopped_process_failure" as const),
  }
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorChargedLineage:
        input.preflight.predecessorRoots.orderedChargedLineage,
      preflightV4ChargedRoot: input.preflight.chargedRoot,
      declaredCalibrationIdentityIds,
      chargedDispositions,
      calibrationRoot: calibration?.calibrationRoot ?? null,
      terminals: calibration?.terminals ?? [],
      executionAuthorization,
      acceptedCellCount: 0,
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-calibration-v4" as const,
    status: admitted
      ? ("calibration_admitted" as const)
      : ("stopped_process_failure" as const),
    stage: "parallel_calibration_v4" as const,
    reason: refused
      ? ("RESOURCE_POLICY_HOST_HEADROOM" as const)
      : (calibration?.reason ?? null),
    executionContextV4ReceiptRoot: executionContext.receiptRoot,
    preflightV4ReceiptRoot: input.preflight.receiptRoot,
    preflightV4ChargedRoot: input.preflight.chargedRoot,
    executionAuthorization,
    samplerPolicyRoot: authorization.samplerPolicyRoot,
    resourcePolicyRoot: V138_RESOURCE_POLICY_ROOT,
    predecessorRoots: input.preflight.predecessorRoots,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    declaredCalibrationIdentityIds,
    chargedDispositions,
    calibration,
    terminals: calibration?.terminals ?? [],
    chargedCalibrationAttemptCount: 8 as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot: sha256(canonical([])),
    acceptedCellCount: 0 as const,
    fullRunLaunched: false as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138ParallelCalibrationV4Receipt = (
  repoRoot: string,
  input: unknown,
  suppliedEvidence?: Readonly<{
    executionContext: unknown
    preflight: unknown
  }>,
): Readonly<V138ParallelCalibrationV4Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138ParallelCalibrationV4Receipt
    const context =
      suppliedEvidence === undefined
        ? checkV138ExecutionContextV4Receipt(
            repoRoot,
            JSON.parse(
              readFileSync(
                path.resolve(
                  repoRoot,
                  ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
                ),
                "utf8",
              ),
            ),
          )
        : validateV138ExecutionContextV4Structure(
            suppliedEvidence.executionContext,
          )
    const preflight =
      suppliedEvidence === undefined
        ? checkV138HostHeadroomPreflightV4Receipt(
            repoRoot,
            JSON.parse(
              readFileSync(
                path.resolve(
                  repoRoot,
                  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
                ),
                "utf8",
              ),
            ),
          )
        : checkV138HostHeadroomPreflightV4Receipt(
            repoRoot,
            suppliedEvidence.preflight,
            context,
          )
    const expected = buildV138ParallelCalibrationV4Receipt({
      repoRoot,
      executionContext: context,
      preflight,
      executionAuthorization: parseV138Plan26213ExecutionAuthorization(
        PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
      ),
      ...(receipt.calibration === null
        ? {}
        : { calibration: receipt.calibration }),
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected) ||
      receipt.receiptRoot !==
        sha256(canonical(calibrationV4WithoutRoot(receipt)))
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_CALIBRATION_V4_RECEIPT_INVALID")
  }
}

export const writeV138ParallelCalibrationV4Receipt = async (
  repoRoot: string,
  targetPath: string,
  preflightPath: string,
  executionContextPath: string,
): Promise<Readonly<V138ParallelCalibrationV4Receipt>> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
  )
  const executionContext = checkV138ExecutionContextV4Receipt(
    repoRoot,
    JSON.parse(readFileSync(executionContextPath, "utf8")),
  )
  const preflight = checkV138HostHeadroomPreflightV4Receipt(
    repoRoot,
    JSON.parse(readFileSync(preflightPath, "utf8")),
  )
  const calibration =
    preflight.disposition === "preflight_admitted"
      ? await calibrateV138ParallelMatrix({
          inventory: enumerateV138CurrentMatrix(repoRoot),
          hardwareIdentity: {
            operatingSystem: `${platform()} ${release()}`,
            architecture: arch(),
            nodeVersion: process.version,
            cpuIdentity: cpus()[0]?.model ?? "unavailable",
          },
          repoRoot,
          executionIdentityVersion: "v4",
        })
      : undefined
  const receipt = buildV138ParallelCalibrationV4Receipt({
    repoRoot,
    executionContext,
    preflight,
    executionAuthorization: parseV138Plan26213ExecutionAuthorization(
      PLAN_262_13_EXECUTION_AUTHORIZATION_LITERAL,
    ),
    ...(calibration === undefined ? {} : { calibration }),
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export interface V138AuthoritativeMatrixV5Receipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v5"
  readonly status: "passed_exact" | "stopped_process_failure"
  readonly fixturePurpose: typeof FIXTURE_PURPOSE
  readonly reason: V138ParallelStopReason | null
  readonly executionContextV4ReceiptRoot: Sha256
  readonly calibrationV4ReceiptRoot: Sha256
  readonly calibrationV4ChargedAttemptLedgerRoot: Sha256
  readonly preflightV4ReceiptRoot: Sha256
  readonly executionAuthorizationRoot: Sha256
  readonly executionAuthorizationExpired: true
  readonly runtimeServiceVersion: "runtime-execution-service-v1.18"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly matchKernel: "engine-kernel-v1.37-candidate-1"
  readonly execution: V138ParallelMatrixExecutionResult
  readonly executionIdentityRoot: Sha256
  readonly chargedAttemptLedgerRoot: Sha256
  readonly acceptedCellLedgerRoot: Sha256
  readonly acceptedCellCount: 0 | 540
  readonly fullRunLaunched: true
  readonly totalWallMilliseconds: number
  readonly maximumChildRssKilobytes: number
  readonly historicalPredicateMatched: boolean
  readonly canonicalReceipt: Readonly<V138CurrentMatrixReceipt> | null
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const v5WithoutRoot = (
  receipt: V138AuthoritativeMatrixV5Receipt,
): Omit<V138AuthoritativeMatrixV5Receipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

export const buildV138AuthoritativeMatrixV5Receipt = (input: {
  repoRoot: string
  executionContext: Readonly<V138ExecutionContextV4Receipt>
  calibrationV4: Readonly<V138ParallelCalibrationV4Receipt>
  execution: V138ParallelMatrixExecutionResult
}): Readonly<V138AuthoritativeMatrixV5Receipt> => {
  const executionContext = validateV138ExecutionContextV4Structure(
    input.executionContext,
  )
  const calibrationV4 = input.calibrationV4
  if (
    calibrationV4.receiptRoot !==
      sha256(canonical(calibrationV4WithoutRoot(calibrationV4))) ||
    calibrationV4.status !== "calibration_admitted" ||
    calibrationV4.calibration === null ||
    calibrationV4.executionAuthorization.expired ||
    calibrationV4.executionContextV4ReceiptRoot !== executionContext.receiptRoot
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V4_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  validateParallelCalibrationReceipt(inventory, calibrationV4.calibration, "v4")
  const plan = planV138MatrixShards(inventory)
  const expectedV5Ids = inventory.attempts.map(
    ({ attemptId }) => `reproduction:v5:${attemptId}`,
  )
  const actualV5Ids = input.execution.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  const canonicalTerminals = input.execution.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId: outcome.attemptId.replace(/^reproduction:v5:/u, ""),
    })),
  }))
  const recomputedAccounting = reduceV138ParallelMatrixAccounting({
    inventory,
    plan,
    terminals: canonicalTerminals,
    launchEvents: input.execution.launchEvents.map((event) => ({
      ...event,
      executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
        attemptId.replace(/^reproduction:v5:/u, ""),
      ),
    })),
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.launchEvents.some(
            (event) => event.shardId === shardId,
          ),
      )
      .map(({ shardId }) => shardId),
  })
  if (
    canonical(input.execution.accounting) !== canonical(recomputedAccounting) ||
    input.execution.batchWallMilliseconds >
      V138_PARALLEL_RESOURCE_POLICY.maxTotalRunMilliseconds ||
    actualV5Ids.some((id) => !id.startsWith("reproduction:v5:")) ||
    new Set(actualV5Ids).size !== actualV5Ids.length ||
    (input.execution.status === "complete_pending_publication" &&
      canonical(actualV5Ids) !== canonical(expectedV5Ids))
  ) {
    throw new TypeError("MATRIX_AUTHORITATIVE_V5_EXECUTION_INVALID")
  }
  const canonicalOutcomes = input.execution.canonicalOutcomes.map((outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v5:/u, ""),
  })) as V138CurrentMatrixAttemptOutcome[]
  const passed = input.execution.status === "complete_pending_publication"
  const canonicalReceipt = passed
    ? reduceV138CurrentMatrix(inventory, canonicalOutcomes)
    : null
  const executionIdentityRoot = sha256(canonical(actualV5Ids))
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      priorChargedLineage:
        calibrationV4.predecessorRoots.orderedChargedLineage,
      preflightV4ChargedRoot: calibrationV4.preflightV4ChargedRoot,
      calibrationV4ChargedAttemptLedgerRoot:
        calibrationV4.chargedAttemptLedgerRoot,
      executionIdentityRoot,
      execution: input.execution,
      canonicalChargedAttemptLedgerRoot:
        canonicalReceipt?.chargedAttemptLedgerRoot ?? sha256(canonical([])),
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v5" as const,
    status: passed
      ? ("passed_exact" as const)
      : ("stopped_process_failure" as const),
    fixturePurpose: FIXTURE_PURPOSE,
    reason: passed ? null : input.execution.reason,
    executionContextV4ReceiptRoot: executionContext.receiptRoot,
    calibrationV4ReceiptRoot: calibrationV4.receiptRoot,
    calibrationV4ChargedAttemptLedgerRoot:
      calibrationV4.chargedAttemptLedgerRoot,
    preflightV4ReceiptRoot: calibrationV4.preflightV4ReceiptRoot,
    executionAuthorizationRoot: calibrationV4.executionAuthorization.root,
    executionAuthorizationExpired: true as const,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    execution: input.execution,
    executionIdentityRoot,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot:
      canonicalReceipt?.acceptedCellLedgerRoot ?? sha256(canonical([])),
    acceptedCellCount: passed ? (540 as const) : (0 as const),
    fullRunLaunched: true as const,
    totalWallMilliseconds: input.execution.batchWallMilliseconds,
    maximumChildRssKilobytes: Math.max(
      0,
      ...input.execution.terminals.map(
        ({ maxRssKilobytes }) => maxRssKilobytes,
      ),
    ),
    historicalPredicateMatched: canonicalReceipt !== null,
    canonicalReceipt,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138AuthoritativeMatrixV5Receipt = (
  repoRoot: string,
  input: unknown,
  suppliedEvidence?: Readonly<{
    executionContext: unknown
    preflight: unknown
    calibration: unknown
  }>,
): Readonly<V138AuthoritativeMatrixV5Receipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138AuthoritativeMatrixV5Receipt
    const context =
      suppliedEvidence === undefined
        ? checkV138ExecutionContextV4Receipt(
            repoRoot,
            JSON.parse(
              readFileSync(
                path.resolve(
                  repoRoot,
                  ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
                ),
                "utf8",
              ),
            ),
          )
        : validateV138ExecutionContextV4Structure(
            suppliedEvidence.executionContext,
          )
    const calibrationV4 =
      suppliedEvidence === undefined
        ? checkV138ParallelCalibrationV4Receipt(
            repoRoot,
            JSON.parse(
              readFileSync(
                path.resolve(
                  repoRoot,
                  ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
                ),
                "utf8",
              ),
            ),
          )
        : checkV138ParallelCalibrationV4Receipt(
            repoRoot,
            suppliedEvidence.calibration,
            {
              executionContext: context,
              preflight: suppliedEvidence.preflight,
            },
          )
    const expected = buildV138AuthoritativeMatrixV5Receipt({
      repoRoot,
      executionContext: context,
      calibrationV4,
      execution: receipt.execution,
    })
    if (
      canonical(Object.keys(receipt)) !== canonical(Object.keys(expected)) ||
      canonical(receipt) !== canonical(expected) ||
      receipt.receiptRoot !== sha256(canonical(v5WithoutRoot(receipt)))
    ) {
      throw new TypeError()
    }
    return expected
  } catch {
    throw new TypeError("MATRIX_AUTHORITATIVE_V5_RECEIPT_INVALID")
  }
}

export const writeV138AuthoritativeMatrixV5Receipt = async (
  repoRoot: string,
  targetPath: string,
  calibrationPath: string,
  executionContextPath: string,
): Promise<Readonly<V138AuthoritativeMatrixV5Receipt>> => {
  exactSuccessorTarget(
    repoRoot,
    targetPath,
    ".planning/artifacts/v1.38-current-matrix-reproduction-v5.json",
  )
  const executionContext = checkV138ExecutionContextV4Receipt(
    repoRoot,
    JSON.parse(readFileSync(executionContextPath, "utf8")),
  )
  const calibrationV4 = checkV138ParallelCalibrationV4Receipt(
    repoRoot,
    JSON.parse(readFileSync(calibrationPath, "utf8")),
  )
  if (
    calibrationV4.status !== "calibration_admitted" ||
    calibrationV4.calibration === null
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V4_NOT_ADMITTED")
  }
  const execution = await executeV138ParallelMatrix({
    inventory: enumerateV138CurrentMatrix(repoRoot),
    calibration: calibrationV4.calibration,
    repoRoot,
    executionIdentityVersion: "v5",
  })
  const receipt = buildV138AuthoritativeMatrixV5Receipt({
    repoRoot,
    executionContext,
    calibrationV4,
    execution,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

export type V138V4V5BranchVerificationContract =
  | Readonly<{
      branchSource: "persisted"
      executionContextPath: string
      preflightPath: string
      calibrationPath: string
      reproductionV5Path: string
    }>
  | Readonly<{
      branchSource: "supplied"
      executionContext: unknown
      preflight: unknown
    }>

const readOptionalJson = (targetPath: string): unknown | undefined => {
  try {
    return JSON.parse(readFileSync(targetPath, "utf8"))
  } catch (error) {
    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return undefined
    }
    throw error
  }
}

export const checkV138SuccessorV4V5Branch = (
  repoRoot: string,
  verification: V138V4V5BranchVerificationContract,
  calibrationInput: unknown,
  v5Input: unknown | undefined,
): Readonly<{
  calibration: V138ParallelCalibrationV4Receipt
  reproduction: V138AuthoritativeMatrixV5Receipt | null
}> => {
  if (
    verification === null ||
    typeof verification !== "object" ||
    !["persisted", "supplied"].includes(verification.branchSource)
  ) {
    throw new TypeError("MATRIX_V4_V5_BRANCH_SOURCE_INVALID")
  }
  let context: Readonly<V138ExecutionContextV4Receipt>
  let preflight: Readonly<V138HostHeadroomPreflightV4Receipt>
  let calibration: Readonly<V138ParallelCalibrationV4Receipt>
  let reproductionInput = v5Input
  if (verification.branchSource === "persisted") {
    const expectedPaths = {
      executionContextPath: path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
      ),
      preflightPath: path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
      ),
      calibrationPath: path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-calibration-v4.json",
      ),
      reproductionV5Path: path.resolve(
        repoRoot,
        ".planning/artifacts/v1.38-current-matrix-reproduction-v5.json",
      ),
    }
    if (
      canonical(Object.keys(verification)) !==
        canonical(["branchSource", ...Object.keys(expectedPaths)]) ||
      Object.entries(expectedPaths).some(
        ([key, expected]) =>
          path.resolve(
            verification[key as keyof typeof expectedPaths],
          ) !== expected,
      )
    ) {
      throw new TypeError("MATRIX_PERSISTED_V4_V5_PATH_INVALID")
    }
    context = checkV138ExecutionContextV4Receipt(
      repoRoot,
      JSON.parse(readFileSync(verification.executionContextPath, "utf8")),
    )
    preflight = checkV138HostHeadroomPreflightV4Receipt(
      repoRoot,
      JSON.parse(readFileSync(verification.preflightPath, "utf8")),
      context,
    )
    const persistedCalibration = JSON.parse(
      readFileSync(verification.calibrationPath, "utf8"),
    )
    if (canonical(calibrationInput) !== canonical(persistedCalibration)) {
      throw new TypeError("MATRIX_PERSISTED_CALIBRATION_V4_ROOT_MISMATCH")
    }
    calibration = checkV138ParallelCalibrationV4Receipt(
      repoRoot,
      calibrationInput,
      { executionContext: context, preflight },
    )
    const persistedV5 = readOptionalJson(verification.reproductionV5Path)
    if (
      (persistedV5 === undefined && v5Input !== undefined) ||
      (persistedV5 !== undefined &&
        canonical(v5Input) !== canonical(persistedV5))
    ) {
      throw new TypeError("MATRIX_PERSISTED_REPRODUCTION_V5_ROOT_MISMATCH")
    }
    reproductionInput = persistedV5
  } else {
    if (
      canonical(Object.keys(verification)) !==
        canonical(["branchSource", "executionContext", "preflight"])
    ) {
      throw new TypeError("MATRIX_SUPPLIED_V4_V5_BRANCH_INVALID")
    }
    context = validateV138ExecutionContextV4Structure(
      verification.executionContext,
    )
    preflight = checkV138HostHeadroomPreflightV4Receipt(
      repoRoot,
      verification.preflight,
      context,
    )
    calibration = checkV138ParallelCalibrationV4Receipt(
      repoRoot,
      calibrationInput,
      { executionContext: context, preflight },
    )
  }
  if (calibration.status === "stopped_process_failure") {
    if (
      reproductionInput !== undefined ||
      calibration.chargedDispositions.length !== 8 ||
      !calibration.executionAuthorization.expired ||
      calibration.executionAuthorization.terminalOutcome !==
        "stopped_process_failure" ||
      calibration.acceptedCellCount !== 0 ||
      calibration.fullRunLaunched ||
      calibration.partialAcceptedEvidenceReusable
    ) {
      throw new TypeError("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
    }
    if (preflight.disposition === "preflight_refused") {
      if (
        calibration.calibration !== null ||
        calibration.terminals.length !== 0 ||
        calibration.chargedDispositions.some(
          ({ disposition }) =>
            disposition !== "unfilled_resource_preflight_refusal",
        )
      ) {
        throw new TypeError("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
      }
    } else if (
      calibration.calibration === null ||
      calibration.calibration.status === "admitted" ||
      calibration.terminals.length === 0 ||
      canonical(calibration.terminals) !==
        canonical(calibration.calibration.terminals) ||
      calibration.chargedDispositions.some(
        ({ disposition }) =>
          disposition !== "terminal_calibration_outcome",
      )
    ) {
      throw new TypeError("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
    }
    return deepFreeze({ calibration, reproduction: null })
  }
  if (reproductionInput === undefined) {
    throw new TypeError("MATRIX_ADMITTED_CALIBRATION_V5_REQUIRED")
  }
  const reproduction = checkV138AuthoritativeMatrixV5Receipt(
    repoRoot,
    reproductionInput,
    { executionContext: context, preflight, calibration },
  )
  if (
    reproduction.receiptRoot !== sha256(canonical(v5WithoutRoot(reproduction))) ||
    reproduction.status !== "passed_exact" ||
    reproduction.acceptedCellCount !== 540 ||
    !reproduction.fullRunLaunched ||
    !reproduction.executionAuthorizationExpired ||
    reproduction.partialAcceptedEvidenceReusable
  ) {
    throw new TypeError("MATRIX_AUTHORITATIVE_V5_NOT_PASSED_EXACT")
  }
  return deepFreeze({ calibration, reproduction })
}

const calibrationSuccessorWithoutRoot = (
  receipt: Readonly<V138ParallelCalibrationSuccessorReceipt>,
): Omit<V138ParallelCalibrationSuccessorReceipt, "receiptRoot"> => {
  const { receiptRoot: _root, ...withoutRoot } = receipt
  return withoutRoot
}

const currentSourceRoot = (): Sha256 =>
  sha256(readFileSync(new URL(import.meta.url)))

const assertLegacyStoppedPredecessor = (
  predecessor: Readonly<V138CurrentMatrixReproductionReceipt>,
): asserts predecessor is Readonly<V138CurrentMatrixStoppedReceipt> => {
  if (
    predecessor.status !== "stopped_process_failure" ||
    predecessor.receiptRoot !== PRIOR_CHARGED_LINEAGE.stoppedReceiptRoot ||
    predecessor.acceptedCellCount !== 0 ||
    predecessor.partialAcceptedEvidenceReusable !== false ||
    predecessor.admissionRoot !==
      "sha256:eb881964ed2cf8b8cf2d24c35a2d8eb6a744917f2659bef8fd41b6f3c7ab491c"
  ) {
    throw new TypeError("MATRIX_CALIBRATION_PREDECESSOR_INVALID")
  }
}

const validateParallelCalibrationReceipt = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  receipt: Readonly<V138ParallelCalibrationReceipt>,
  executionIdentityVersion:
    | "v1"
    | "v2"
    | "v3"
    | "v4"
    | "v5"
    | "v6"
    | "v7" = "v1",
): void => {
  const policy = deriveV138ParallelCalibrationPolicy(inventory)
  const projection = projectV138ParallelMatrix(policy, receipt.rawObservation)
  const expectedAttemptIds =
    executionIdentityVersion === "v5" ||
    executionIdentityVersion === "v6" ||
    executionIdentityVersion === "v7"
      ? deriveV138CalibrationAttemptMappings(
          inventory,
          executionIdentityVersion,
        ).map(({ executionAttemptId }) => executionAttemptId)
      : policy.inventory.shards
          .flatMap(({ attemptIds }) => attemptIds)
          .map((attemptId) =>
            executionIdentityVersion === "v2"
              ? attemptId.replace(/^calibration:v1:/u, "calibration:v2:")
              : executionIdentityVersion === "v3"
                ? attemptId.replace(/^calibration:v1:/u, "calibration:v3:")
                : executionIdentityVersion === "v4"
                  ? attemptId.replace(/^calibration:v1:/u, "calibration:v4:")
                  : attemptId,
          )
  const actualAttemptIds = receipt.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  const cleanupComplete = receipt.terminals.every(
    ({ cleanup }) =>
      cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
  )
  const allSuccessful =
    receipt.terminals.length === 4 &&
    receipt.terminals.every(
      ({ classification, outcomes }) =>
        classification === "success" &&
        outcomes.every(({ classification: outcome }) => outcome === "success"),
    )
  const resourcesAdmitted =
    receipt.rawObservation.childMaxRssKilobytes.every(
      (rss) => rss <= V138_PARALLEL_RESOURCE_POLICY.maxChildRssKilobytes,
    ) &&
    receipt.rawObservation.aggregateChildRssKilobytes <=
      V138_PARALLEL_RESOURCE_POLICY.maxAggregateChildRssKilobytes &&
    receipt.rawObservation.minimumHostHeadroomBasisPoints >=
      V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
  const shouldAdmit =
    allSuccessful &&
    cleanupComplete &&
    projection.admittedByTime &&
    resourcesAdmitted
  const sharedTicksValid =
    (executionIdentityVersion !== "v5" &&
      executionIdentityVersion !== "v6" &&
      executionIdentityVersion !== "v7") ||
    (receipt.status === "stopped_process_failure" &&
      receipt.reason === "RESOURCE_MEASUREMENT_UNAVAILABLE" &&
      receipt.sharedObservationTicks?.length === 0) ||
    sharedDarwinTicksAreValid(
      receipt.sharedObservationTicks,
      receipt.rawObservation.minimumHostHeadroomBasisPoints,
      ["calibration-shard:0", "calibration-shard:1",
        "calibration-shard:2", "calibration-shard:3"],
    )
  if (
    receipt.schemaVersion !== "v1.38-parallel-calibration-receipt-v1" ||
    receipt.policyRoot !== policy.policyRoot ||
    receipt.projectionSourceRoot !== policy.projectionSourceRoot ||
    receipt.inventoryRoot !== policy.inventory.inventoryRoot ||
    receipt.attemptCount !== 8 ||
    receipt.terminalShardCount !== receipt.terminals.length ||
    receipt.acceptedCellsPublished !== 0 ||
    receipt.partialAcceptedEvidenceReusable !== false ||
    !sharedTicksValid ||
    canonical(receipt.projection) !== canonical(projection) ||
    receipt.calibrationRoot !==
      sha256(canonical(calibrationWithoutRoot(receipt))) ||
    new Set(actualAttemptIds).size !== actualAttemptIds.length ||
    actualAttemptIds.some((attemptId) => !expectedAttemptIds.includes(attemptId)) ||
    (receipt.status === "admitted") !== shouldAdmit ||
    (receipt.status === "admitted"
      ? receipt.reason !== null ||
        canonical([...actualAttemptIds].sort()) !==
          canonical([...expectedAttemptIds].sort())
      : receipt.reason === null)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_RECEIPT_INVALID")
  }
}

export const buildV138ParallelCalibrationSuccessorReceipt = (input: {
  repoRoot: string
  inventory: Readonly<V138CurrentMatrixInventory>
  predecessor: Readonly<V138CurrentMatrixReproductionReceipt>
  calibration: Readonly<V138ParallelCalibrationReceipt>
}): Readonly<V138ParallelCalibrationSuccessorReceipt> => {
  assertLegacyStoppedPredecessor(input.predecessor)
  validateParallelCalibrationReceipt(input.inventory, input.calibration)
  const policy = deriveV138ParallelCalibrationPolicy(input.inventory)
  const expectation = loadV138HistoricalMatrixExpectation(input.repoRoot)
  const sourceRoot = currentSourceRoot()
  const chargedAttemptLedgerRoot = sha256(
    canonical({
      predecessorReceiptRoot: input.predecessor.receiptRoot,
      predecessorChargedAttemptLedgerRoot:
        input.predecessor.chargedAttemptLedgerRoot,
      calibrationRoot: input.calibration.calibrationRoot,
      calibrationAttemptIds: input.calibration.terminals.flatMap(({ outcomes }) =>
        outcomes.map(({ attemptId, classification }) => ({
          attemptId,
          classification,
        })),
      ),
      chargedCalibrationAttemptCount: 8,
      acceptedCellCount: 0,
    }),
  )
  const withoutRoot = {
    schemaVersion: "v1.38-current-matrix-reproduction-v2" as const,
    status:
      input.calibration.status === "admitted"
        ? ("calibration_admitted" as const)
        : ("stopped_process_failure" as const),
    stage: "parallel_calibration" as const,
    fixturePurpose: FIXTURE_PURPOSE,
    reason: input.calibration.reason,
    predecessorReceiptRoot: input.predecessor.receiptRoot,
    predecessorChargedAttemptLedgerRoot:
      input.predecessor.chargedAttemptLedgerRoot,
    admissionRoot: input.inventory.admissionRoot,
    historicalExpectationRoot: expectation.historicalExpectationRoot,
    runtimeServiceVersion: "runtime-execution-service-v1.18" as const,
    runtimeAbiVersion: "strategy-runtime-abi-v1.19" as const,
    matchKernel: "engine-kernel-v1.37-candidate-1" as const,
    calibrationPolicyRoot: policy.policyRoot,
    calibrationInventoryRoot: policy.inventory.inventoryRoot,
    projectionSourceRoot: policy.projectionSourceRoot,
    authoritativePlanRoot: planV138MatrixShards(input.inventory).planRoot,
    resourcePolicyRoot: sha256(canonical(V138_PARALLEL_RESOURCE_POLICY)),
    schedulerSourceRoot: sourceRoot,
    reducerSourceRoot: sourceRoot,
    calibration: input.calibration,
    chargedCalibrationAttemptCount: 8 as const,
    chargedAttemptLedgerRoot,
    acceptedCellLedgerRoot: sha256(canonical([])),
    acceptedCellCount: 0 as const,
    fullRunLaunched: false as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    receiptRoot: sha256(canonical(withoutRoot)),
  })
}

export const checkV138ParallelCalibrationSuccessorReceipt = (
  repoRoot: string,
  input: unknown,
): Readonly<V138ParallelCalibrationSuccessorReceipt> => {
  try {
    if (input === null || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError()
    }
    const receipt = input as V138ParallelCalibrationSuccessorReceipt
    const inventory = enumerateV138CurrentMatrix(repoRoot)
    const predecessor = JSON.parse(
      gitBlob(
        repoRoot,
        "724388c3",
        ".planning/artifacts/v1.38-current-matrix-reproduction.json",
      ).toString("utf8"),
    ) as V138CurrentMatrixReproductionReceipt
    const expected = buildV138ParallelCalibrationSuccessorReceipt({
      repoRoot,
      inventory,
      predecessor,
      calibration: receipt.calibration,
    })
    if (canonical(receipt) !== canonical(expected)) throw new TypeError()
    return expected
  } catch {
    throw new TypeError("MATRIX_CALIBRATION_RECEIPT_INVALID")
  }
}

export interface V138ImmutableReceiptPublicationOptions {
  readonly writeTemporaryFile?: (
    fileDescriptor: number,
    bytes: Uint8Array,
  ) => void
  readonly linkTemporaryFile?: (
    temporaryPath: string,
    targetPath: string,
  ) => void
  readonly fsyncDirectory?: (
    directoryDescriptor: number,
    phase: "publication" | "cleanup",
  ) => void
  readonly fsyncRollbackDirectory?: (directoryDescriptor: number) => void
  readonly unlinkTemporaryFile?: (temporaryPath: string) => void
  readonly closeTemporaryFile?: (fileDescriptor: number) => void
}

const errorCode = (error: unknown): string | undefined =>
  error !== null &&
  typeof error === "object" &&
  "code" in error &&
  typeof error.code === "string"
    ? error.code
    : undefined

const combineReceiptPublicationFailures = (
  primaryFailure: unknown,
  secondaryFailure: unknown,
  secondaryCode: string,
): unknown => {
  const classifiedSecondary = new TypeError(secondaryCode, {
    cause: secondaryFailure,
  })
  return primaryFailure === undefined
    ? classifiedSecondary
    : new AggregateError(
        [primaryFailure, classifiedSecondary],
        secondaryCode,
      )
}

const createExclusiveReceiptTemporaryFile = (
  targetPath: string,
): Readonly<{ fileDescriptor: number; temporaryPath: string }> => {
  const directory = path.dirname(targetPath)
  const basename = path.basename(targetPath)
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const temporaryPath = path.join(
      directory,
      `.${basename}.${process.pid}.${randomBytes(16).toString("hex")}.tmp`,
    )
    try {
      return {
        fileDescriptor: openSync(temporaryPath, "wx", 0o600),
        temporaryPath,
      }
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error
    }
  }
  throw new TypeError("MATRIX_SUCCESSOR_TEMPORARY_FILE_UNAVAILABLE")
}

export const writeV138ImmutableReceipt = (
  targetPath: string,
  receipt: unknown,
  options: V138ImmutableReceiptPublicationOptions = {},
): void => {
  const resolvedTarget = path.resolve(targetPath)
  const bytes = Buffer.from(`${canonical(receipt)}\n`, "utf8")
  let fileDescriptor: number | undefined
  let temporaryPath: string | undefined
  let failure: unknown
  const fsyncContainingDirectory = (
    phase: "publication" | "cleanup",
  ): void => {
    const directoryDescriptor = openSync(path.dirname(resolvedTarget), "r")
    try {
      if (options.fsyncDirectory === undefined) {
        fsyncSync(directoryDescriptor)
      } else {
        options.fsyncDirectory(directoryDescriptor, phase)
      }
    } finally {
      closeSync(directoryDescriptor)
    }
  }
  try {
    const temporary = createExclusiveReceiptTemporaryFile(resolvedTarget)
    fileDescriptor = temporary.fileDescriptor
    temporaryPath = temporary.temporaryPath
    ;(options.writeTemporaryFile ?? ((descriptor, completeBytes) => {
      writeFileSync(descriptor, completeBytes)
    }))(fileDescriptor, bytes)
    fsyncSync(fileDescriptor)
    ;(options.closeTemporaryFile ?? closeSync)(fileDescriptor)
    fileDescriptor = undefined
    const persisted = readFileSync(temporaryPath)
    if (
      persisted.byteLength !== bytes.byteLength ||
      !persisted.equals(bytes)
    ) {
      throw new TypeError("MATRIX_SUCCESSOR_TEMPORARY_WRITE_INCOMPLETE")
    }

    try {
      ;(options.linkTemporaryFile ?? linkSync)(
        temporaryPath,
        resolvedTarget,
      )
    } catch (error) {
      if (errorCode(error) === "EEXIST") {
        throw new TypeError("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
      }
      throw error
    }

    try {
      fsyncContainingDirectory("publication")
    } catch {
      // The canonical hard link may already be durable. Preserve it and
      // distinguish this indeterminate publication from a safe fresh retry.
      throw new TypeError(
        "MATRIX_SUCCESSOR_PUBLICATION_DURABILITY_INDETERMINATE",
      )
    }
  } catch (error) {
    failure = error
  }
  if (fileDescriptor !== undefined) {
    try {
      ;(options.closeTemporaryFile ?? closeSync)(fileDescriptor)
    } catch (error) {
      failure = combineReceiptPublicationFailures(
        failure,
        error,
        "MATRIX_SUCCESSOR_DESCRIPTOR_CLEANUP_FAILED",
      )
    }
  }
  if (temporaryPath !== undefined) {
    let temporaryUnlinked = false
    try {
      ;(options.unlinkTemporaryFile ?? unlinkSync)(temporaryPath)
      temporaryUnlinked = true
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        temporaryUnlinked = false
      } else {
        failure = combineReceiptPublicationFailures(
          failure,
          error,
          "MATRIX_SUCCESSOR_TEMPORARY_CLEANUP_FAILED",
        )
      }
    }
    if (temporaryUnlinked) {
      try {
        fsyncContainingDirectory("cleanup")
      } catch (error) {
        failure = combineReceiptPublicationFailures(
          failure,
          error,
          "MATRIX_SUCCESSOR_CLEANUP_DURABILITY_INDETERMINATE",
        )
      }
    }
  }
  if (failure !== undefined) throw failure
}

export const assertV138FreshImmutableTarget = (targetPath: string): void => {
  const resolvedTarget = path.resolve(targetPath)
  try {
    lstatSync(resolvedTarget)
    throw new TypeError("MATRIX_SUCCESSOR_TARGET_NOT_FRESH")
  } catch (error) {
    if (error instanceof TypeError) throw error
    if (errorCode(error) !== "ENOENT") throw error
  }
}

const writeReceiptAtomically = writeV138ImmutableReceipt

export const runV138ParallelMatrixCalibration = async (
  repoRoot: string,
  targetPath: string,
): Promise<Readonly<V138ParallelCalibrationSuccessorReceipt>> => {
  const predecessor = reproduceV138CurrentMatrix(repoRoot)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = await calibrateV138ParallelMatrix({
    inventory,
    policy: deriveV138ParallelCalibrationPolicy(inventory),
    hardwareIdentity: {
      operatingSystem: `${platform()} ${release()}`,
      architecture: arch(),
      nodeVersion: process.version,
      cpuIdentity: cpus()[0]?.model ?? "unavailable",
    },
    repoRoot,
  })
  const receipt = buildV138ParallelCalibrationSuccessorReceipt({
    repoRoot,
    inventory,
    predecessor,
    calibration,
  })
  writeReceiptAtomically(targetPath, receipt)
  return receipt
}

const runShardCli = (): void => {
  if (
    process.argv[1] !== fileURLToPath(import.meta.url) ||
    process.argv[2] !== "--execute-shard"
  ) {
    return
  }

  const emitControl = (
    bytes: Buffer,
  ): void => {
    try {
      writeSync(3, bytes)
    } finally {
      bytes.fill(0)
    }
  }
  const failChild = (
    family: "RUNTIME_EXECUTION_FAILED" | "SHARD_COORDINATION_FAILED",
  ): void => {
    emitControl(encodeV138CurrentMatrixChildProtocolV2Terminal(family))
    process.exitCode = 1
  }

  emitControl(encodeV138CurrentMatrixChildProtocolV2Ready())
  let inventory: Readonly<V138CurrentMatrixInventory>
  let attempts: V138CurrentMatrixAttempt[]
  try {
    const decoded = JSON.parse(
      Buffer.from(process.argv[3] ?? "", "base64").toString("utf8"),
    ) as { repoRoot: string; attemptIds: string[] }
    if (!hasExactKeys(decoded, ["repoRoot", "attemptIds"]) ||
        typeof decoded.repoRoot !== "string" ||
        !Array.isArray(decoded.attemptIds) ||
        !decoded.attemptIds.every((value) => typeof value === "string")) {
      throw new TypeError("MATRIX_SHARD_REQUEST_INVALID")
    }
    inventory = enumerateV138CurrentMatrix(decoded.repoRoot)
    const byId = new Map(
      inventory.attempts.map((attempt) => [attempt.attemptId, attempt]),
    )
    attempts = decoded.attemptIds.map((attemptId) => {
      const attempt = byId.get(attemptId)
      if (attempt === undefined) {
        throw new TypeError("MATRIX_SHARD_ATTEMPT_UNKNOWN")
      }
      return attempt
    })
  } catch {
    failChild("SHARD_COORDINATION_FAILED")
    return
  }

  let outcomes: V138CurrentMatrixAttemptOutcome[]
  try {
    outcomes = executeAttemptsInProcess(inventory, attempts)
  } catch {
    failChild("RUNTIME_EXECUTION_FAILED")
    return
  }

  try {
    const result = {
      outcomes,
      maxRssKilobytes: process.resourceUsage().maxRSS,
    }
    parseV138ShardExecutionResult(
      result,
      attempts.map(({ attemptId }) => attemptId),
    )
    process.stdout.write(JSON.stringify(result))
    emitControl(encodeV138CurrentMatrixChildProtocolV2Terminal("success"))
  } catch {
    failChild("SHARD_COORDINATION_FAILED")
  }
}

const v138SuccessorCanonicalBytes = (value: unknown): Uint8Array => {
  const encoded = encodeCanonicalJson(value as JsonValue, {
    context: "canonical-manifest",
  })
  if (encoded.ok === false) {
    throw new TypeError("MATRIX_SUCCESSOR_CANONICAL_JSON_INVALID")
  }
  return encoded.bytes
}

export const v138SuccessorRoot = (
  domain:
    | "evidenceBundle"
    | "containmentPolicy"
    | "budgetProfile"
    | "artifactManifest"
    | "canonicalJsonProfile",
  schemaVersion: string,
  value: unknown,
): Sha256 =>
  `sha256:${hashCanonicalIdentity(domain, [
    Buffer.from(schemaVersion, "utf8"),
    v138SuccessorCanonicalBytes(value),
  ])}`

const isV138CanonicalSha256 = (candidate: unknown): candidate is Sha256 =>
  typeof candidate === "string" &&
  /^sha256:[0-9a-f]{64}$/u.test(candidate) &&
  !/^sha256:([0-9a-f])\1{63}$/u.test(candidate)

const exactRecord = (
  value: unknown,
  keys: readonly string[],
  code: string,
): Record<string, unknown> => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !hasExactKeys(value as Record<string, unknown>, keys)
  ) throw new TypeError(code)
  return value as Record<string, unknown>
}

export interface V138ExecutionContextV5Receipt {
  readonly schemaVersion: "v1.38-current-matrix-execution-context-v5"
  readonly mode: "gsd-pattern-c-inline-main"
  readonly cwd: "/Users/roryquinlan/runtime/cowards-game"
  readonly terminalAgentRegistry: Readonly<{
    schemaVersion: "v1.38-plan-262-16-terminal-agent-registry-v1"
    activeExecutorCount: 0
    agents: readonly Readonly<{ id: string; status: "completed" | "failed" }>[]
  }>
  readonly sourceA: string
  readonly sourceB: string
  readonly sourceBCustody: Readonly<V138SourceBCustody>
  readonly sourceBCustodyRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly selectedRouteClosureRoot: Sha256
  readonly frozenPolicyRoot: Sha256
  readonly toolIdentityRoot: Sha256
  readonly hostIdentityRoot: Sha256
  readonly patternCOwnership: "main_orchestrator_only"
  readonly formationAbsenceBound: true
  readonly runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138ExecutionContextV5Receipt = (input: {
  readonly repoRoot: string
  readonly authorization: V138Plan26215Authorization
  readonly seal: V138SuccessorSourceSeal
  readonly mode: "gsd-pattern-c-inline-main"
  readonly cwd: "/Users/roryquinlan/runtime/cowards-game"
  readonly terminalAgentRegistry: V138ExecutionContextV5Receipt["terminalAgentRegistry"]
  readonly sourceBCustody?: Readonly<V138SourceBCustody>
}): Readonly<V138ExecutionContextV5Receipt> => {
  const authorization = checkV138Plan26215Authorization(
    input.repoRoot,
    input.authorization,
  )
  const seal = checkV138SuccessorSourceSeal(
    input.repoRoot,
    input.seal,
    authorization,
  )
  const registry = exactRecord(
    input.terminalAgentRegistry,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V5_REGISTRY_INVALID",
  )
  if (
    registry.schemaVersion !==
      "v1.38-plan-262-16-terminal-agent-registry-v1" ||
    registry.activeExecutorCount !== 0 ||
    !Array.isArray(registry.agents) ||
    registry.agents.some((agent) => {
      const row = exactRecord(
        agent,
        ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V5_REGISTRY_INVALID",
      )
      return (
        typeof row.id !== "string" ||
        row.id.length === 0 ||
        (row.status !== "completed" && row.status !== "failed")
      )
    })
  ) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V5_REGISTRY_INVALID")
  const injectedOid = createHash("sha1")
    .update(`injected-successor:${authorization.sourceA}`)
    .digest("hex")
  const sourceBCustody = input.sourceBCustody ?? (() => {
    const custodyBody = {
      schemaVersion: "v1.38-source-b-custody-v1" as const,
      sourceA: authorization.sourceA,
      sourceB: injectedOid,
      sourceBTree: createHash("sha1").update(`tree:${injectedOid}`).digest("hex"),
      sourceBParent: authorization.sourceA,
      changedPaths: Object.freeze([
        ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
        ".planning/artifacts/v1.38-successor-source-seal-v1.json",
      ]),
      blobs: Object.freeze([
        {
          path: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
          blobOid: createHash("sha1").update(`auth:${injectedOid}`).digest("hex"),
          byteLength: 1,
          sha256: sha256("injected-authorization"),
        },
        {
          path: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
          blobOid: createHash("sha1").update(`seal:${injectedOid}`).digest("hex"),
          byteLength: 1,
          sha256: sha256("injected-seal"),
        },
      ]),
    }
    return deepFreeze({
      ...custodyBody,
      custodyRoot: v138SuccessorRoot(
        "containmentPolicy",
        custodyBody.schemaVersion,
        custodyBody,
      ),
    })
  })()
  const body = {
    schemaVersion: "v1.38-current-matrix-execution-context-v5" as const,
    mode: input.mode,
    cwd: input.cwd,
    terminalAgentRegistry: input.terminalAgentRegistry,
    sourceA: authorization.sourceA,
    sourceB: sourceBCustody.sourceB,
    sourceBCustody,
    sourceBCustodyRoot: sourceBCustody.custodyRoot,
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot,
    selectedRouteClosureRoot: seal.selectedRouteClosure.closureRoot,
    frozenPolicyRoot: v138SuccessorRoot(
      "budgetProfile",
      "v1.38-current-matrix-frozen-policy-v5",
      seal.frozenPolicy,
    ),
    toolIdentityRoot: v138SuccessorRoot(
      "artifactManifest",
      "v1.38-current-matrix-tool-identity-v5",
      seal.toolIdentity,
    ),
    hostIdentityRoot: v138SuccessorRoot(
      "containmentPolicy",
      "v1.38-current-matrix-host-identity-v5",
      seal.hostIdentity,
    ),
    patternCOwnership: "main_orchestrator_only" as const,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot(
      "evidenceBundle",
      body.schemaVersion,
      body,
    ),
  })
}

export const checkV138ExecutionContextV5Receipt = (
  value: unknown,
  expectedCustody?: Readonly<V138SourceBCustody>,
): Readonly<V138ExecutionContextV5Receipt> => {
  const record = exactRecord(
    value,
    [
      "schemaVersion", "mode", "cwd", "terminalAgentRegistry",
      "sourceA", "sourceB", "sourceBCustody", "sourceBCustodyRoot",
      "authorizationRoot", "sealRoot",
      "selectedRouteClosureRoot", "frozenPolicyRoot", "toolIdentityRoot",
      "hostIdentityRoot", "patternCOwnership", "formationAbsenceBound",
      "runtimeRoute", "acceptedCellCount", "noRetry", "receiptRoot",
    ],
    "MATRIX_EXECUTION_CONTEXT_V5_INVALID",
  ) as unknown as V138ExecutionContextV5Receipt
  const { receiptRoot, ...body } = record
  const custody = exactRecord(
    record.sourceBCustody,
    [
      "schemaVersion", "sourceA", "sourceB", "sourceBTree", "sourceBParent",
      "changedPaths", "blobs", "custodyRoot",
    ],
    "MATRIX_EXECUTION_CONTEXT_V5_INVALID",
  )
  const { custodyRoot, ...custodyBody } = custody
  const custodyBlobs = Array.isArray(custody.blobs)
    ? custody.blobs.map((blob) =>
        exactRecord(blob, ["path", "blobOid", "byteLength", "sha256"],
          "MATRIX_EXECUTION_CONTEXT_V5_INVALID"))
    : []
  const registry = exactRecord(
    record.terminalAgentRegistry,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V5_INVALID",
  )
  if (
    record.schemaVersion !== "v1.38-current-matrix-execution-context-v5" ||
    record.mode !== "gsd-pattern-c-inline-main" ||
    record.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    registry.schemaVersion !==
      "v1.38-plan-262-16-terminal-agent-registry-v1" ||
    registry.activeExecutorCount !== 0 ||
    !Array.isArray(registry.agents) ||
    registry.agents.some((agent) => {
      const row = exactRecord(
        agent,
        ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V5_INVALID",
      )
      return (
        typeof row.id !== "string" ||
        row.id.length === 0 ||
        (row.status !== "completed" && row.status !== "failed")
      )
    }) ||
    !/^[0-9a-f]{40}$/u.test(record.sourceA) ||
    !/^[0-9a-f]{40}$/u.test(record.sourceB) ||
    custody.schemaVersion !== "v1.38-source-b-custody-v1" ||
    custody.sourceA !== record.sourceA ||
    custody.sourceB !== record.sourceB ||
    custody.sourceBParent !== record.sourceA ||
    typeof custody.sourceBTree !== "string" ||
    !/^[0-9a-f]{40}$/u.test(custody.sourceBTree) ||
    canonical(custody.changedPaths) !== canonical([
      ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
      ".planning/artifacts/v1.38-successor-source-seal-v1.json",
    ]) ||
    custodyBlobs.length !== 2 ||
    custodyBlobs.some((blob, index) =>
      blob.path !== [
        ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
        ".planning/artifacts/v1.38-successor-source-seal-v1.json",
      ][index] ||
      typeof blob.blobOid !== "string" ||
      !/^[0-9a-f]{40}$/u.test(blob.blobOid) ||
      !Number.isSafeInteger(blob.byteLength) ||
      Number(blob.byteLength) <= 0 ||
      typeof blob.sha256 !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(blob.sha256)) ||
    custodyRoot !== v138SuccessorRoot(
      "containmentPolicy", "v1.38-source-b-custody-v1", custodyBody) ||
    record.sourceBCustodyRoot !== custodyRoot ||
    (expectedCustody !== undefined &&
      canonical(expectedCustody) !== canonical(record.sourceBCustody)) ||
    !isV138CanonicalSha256(record.selectedRouteClosureRoot) ||
    !isV138CanonicalSha256(record.frozenPolicyRoot) ||
    !isV138CanonicalSha256(record.toolIdentityRoot) ||
    !isV138CanonicalSha256(record.hostIdentityRoot) ||
    record.patternCOwnership !== "main_orchestrator_only" ||
    record.formationAbsenceBound !== true ||
    record.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    record.acceptedCellCount !== 0 ||
    record.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle", record.schemaVersion, body)
  ) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V5_INVALID")
  return record
}

export interface V138HostHeadroomPreflightV5Receipt {
  readonly schemaVersion: "v1.38-current-matrix-headroom-preflight-v5"
  readonly sourceB: string
  readonly sourceBCustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly status: "preflight_complete" | "preflight_unavailable"
  readonly chargedIdentityId: "preflight:v5:0"
  readonly metricId: typeof V138_DARWIN_HEADROOM_METRIC_ID
  readonly providerId: typeof V138_DARWIN_HEADROOM_PROVIDER_ID
  readonly parserId: typeof V138_DARWIN_HEADROOM_PARSER_ID
  readonly requiredHostHeadroomBasisPoints: 2500
  readonly observation: Readonly<Record<string, number | Sha256>> | null
  readonly disposition:
    | "preflight_admitted"
    | "preflight_refused"
    | "preflight_unavailable"
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138HostHeadroomPreflightV5Receipt = (
  input:
    | V138DarwinHeadroomResult
    | Readonly<{
        result: V138DarwinHeadroomResult
        executionContext: V138ExecutionContextV5Receipt
      }>,
): Readonly<V138HostHeadroomPreflightV5Receipt> => {
  const wrapped = "result" in input
  const result = wrapped ? input.result : input
  const context = wrapped
    ? checkV138ExecutionContextV5Receipt(input.executionContext)
    : undefined
  const body = {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v5" as const,
    sourceB: context?.sourceB ??
      createHash("sha1").update("injected-preflight-source-b").digest("hex"),
    sourceBCustodyRoot: context?.sourceBCustodyRoot ??
      sha256("injected-preflight-source-b-custody"),
    executionContextRoot:
      context?.receiptRoot ?? sha256("injected-preauthorization-test-context-v5"),
    authorizationRoot:
      context?.authorizationRoot ?? sha256("injected-preauthorization-test-authority-v5"),
    sealRoot: context?.sealRoot ?? sha256("injected-preauthorization-test-seal-v5"),
    status: result.ok ? "preflight_complete" as const : "preflight_unavailable" as const,
    chargedIdentityId: "preflight:v5:0" as const,
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    requiredHostHeadroomBasisPoints: V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS,
    observation: result.ok
      ? {
          stdoutByteLength: result.observation.stdoutByteLength,
          stdoutSha256: result.observation.stdoutSha256,
          totalBytes: result.observation.totalBytes,
          pageCount: result.observation.pageCount,
          pageSizeBytes: result.observation.pageSizeBytes,
          percentage: result.observation.percentage,
          observedBasisPoints: result.observation.observedBasisPoints,
        }
      : null,
    disposition: result.ok
      ? result.observation.disposition
      : "preflight_unavailable" as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot(
      "canonicalJsonProfile",
      body.schemaVersion,
      body,
    ),
  })
}

export const buildV138ParallelCalibrationV5PreflightTerminal = (
  preflightInput: unknown,
) => {
  const preflight = checkV138HostHeadroomPreflightV5Receipt(preflightInput)
  if (preflight.disposition === "preflight_admitted") {
    throw new TypeError("MATRIX_CALIBRATION_V5_LIVE_EXECUTION_REQUIRED")
  }
  const reason =
    preflight.disposition === "preflight_refused"
      ? "unfilled_resource_preflight_refusal"
      : "unfilled_resource_measurement_unavailable"
  const chargedAttempts = Array.from({ length: 8 }, (_, index) =>
    deepFreeze({
      attemptId: `calibration:v5:${index}`,
      shardId: `calibration-shard:${index % 4}`,
      outcome: reason,
      childLaunched: false as const,
      accepted: false as const,
    }),
  )
  const body = {
    schemaVersion: "v1.38-current-matrix-calibration-v5" as const,
    sourceB: preflight.sourceB,
    sourceBCustodyRoot: preflight.sourceBCustodyRoot,
    executionContextRoot: preflight.executionContextRoot,
    preflightRoot: preflight.receiptRoot,
    status: "stopped_process_failure" as const,
    chargedAttemptCount: 8 as const,
    chargedAttempts,
    shardCount: 4 as const,
    samplerMode: "one_shared_observation_per_tick" as const,
    sharedObservationTicks: Object.freeze([]),
    supervisedCalibration: null,
    childLaunchCount: 0 as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot("budgetProfile", body.schemaVersion, body),
  })
}

export const checkV138HostHeadroomPreflightV5Receipt = (
  value: unknown,
): Readonly<V138HostHeadroomPreflightV5Receipt> => {
  const record = exactRecord(
    value,
    [
      "schemaVersion", "sourceB", "sourceBCustodyRoot",
      "executionContextRoot", "authorizationRoot", "sealRoot",
      "status", "chargedIdentityId", "metricId", "providerId", "parserId",
      "requiredHostHeadroomBasisPoints", "observation", "disposition",
      "acceptedCellCount", "noRetry", "receiptRoot",
    ],
    "MATRIX_PREFLIGHT_V5_INVALID",
  ) as unknown as V138HostHeadroomPreflightV5Receipt
  const { receiptRoot, ...body } = record
  const observation =
    record.observation === null
      ? null
      : exactRecord(
          record.observation,
          [
            "stdoutByteLength",
            "stdoutSha256",
            "totalBytes",
            "pageCount",
            "pageSizeBytes",
            "percentage",
            "observedBasisPoints",
          ],
          "MATRIX_PREFLIGHT_V5_INVALID",
        )
  const available =
    observation !== null &&
    Number.isSafeInteger(observation.stdoutByteLength) &&
    Number(observation.stdoutByteLength) > 0 &&
    Number(observation.stdoutByteLength) <= 4_096 &&
    typeof observation.stdoutSha256 === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(observation.stdoutSha256) &&
    Number.isSafeInteger(observation.totalBytes) &&
    Number(observation.totalBytes) > 0 &&
    Number.isSafeInteger(observation.pageCount) &&
    Number(observation.pageCount) > 0 &&
    Number.isSafeInteger(observation.pageSizeBytes) &&
    Number(observation.pageSizeBytes) > 0 &&
    Number.isSafeInteger(
      Number(observation.pageCount) * Number(observation.pageSizeBytes),
    ) &&
    Number(observation.totalBytes) ===
      Number(observation.pageCount) * Number(observation.pageSizeBytes) &&
    Number.isSafeInteger(observation.percentage) &&
    Number(observation.percentage) >= 0 &&
    Number(observation.percentage) <= 100 &&
    observation.observedBasisPoints === Number(observation.percentage) * 100
  const expectedDisposition = available
    ? Number(observation!.observedBasisPoints) >= 2_500
      ? "preflight_admitted"
      : "preflight_refused"
    : "preflight_unavailable"
  const isCanonicalRoot = (candidate: unknown): candidate is Sha256 =>
    typeof candidate === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(candidate) &&
    !/^sha256:([0-9a-f])\1{63}$/u.test(candidate)
  if (
    record.schemaVersion !== "v1.38-current-matrix-headroom-preflight-v5" ||
    !/^[0-9a-f]{40}$/u.test(record.sourceB) ||
    !isCanonicalRoot(record.sourceBCustodyRoot) ||
    !isCanonicalRoot(record.executionContextRoot) ||
    !isCanonicalRoot(record.authorizationRoot) ||
    !isCanonicalRoot(record.sealRoot) ||
    record.metricId !== V138_DARWIN_HEADROOM_METRIC_ID ||
    record.providerId !== V138_DARWIN_HEADROOM_PROVIDER_ID ||
    record.parserId !== V138_DARWIN_HEADROOM_PARSER_ID ||
    record.requiredHostHeadroomBasisPoints !== 2_500 ||
    record.chargedIdentityId !== "preflight:v5:0" ||
    record.acceptedCellCount !== 0 ||
    record.noRetry !== true ||
    (record.observation === null) !==
      (record.status === "preflight_unavailable" &&
        record.disposition === "preflight_unavailable") ||
    (record.observation !== null && !available) ||
    record.disposition !== expectedDisposition ||
    record.status !==
      (expectedDisposition === "preflight_unavailable"
        ? "preflight_unavailable"
        : "preflight_complete") ||
    receiptRoot !==
      v138SuccessorRoot("canonicalJsonProfile", record.schemaVersion, body)
  ) throw new TypeError("MATRIX_PREFLIGHT_V5_INVALID")
  return record
}

export const checkV138ParallelCalibrationV5Receipt = (
  value: unknown,
  repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
): Readonly<Record<string, unknown>> => {
  const record = exactRecord(
    value,
    [
      "schemaVersion", "sourceB", "sourceBCustodyRoot",
      "executionContextRoot", "preflightRoot", "status",
      "chargedAttemptCount", "chargedAttempts", "shardCount", "samplerMode",
      "sharedObservationTicks", "supervisedCalibration", "childLaunchCount", "acceptedCellCount",
      "noRetry", "receiptRoot",
    ],
    "MATRIX_CALIBRATION_V5_INVALID",
  )
  const { receiptRoot, ...body } = record
  const attempts = record.chargedAttempts
  const expectedIds = Array.from(
    { length: 8 },
    (_, index) => `calibration:v5:${index}`,
  )
  const parsedAttempts = Array.isArray(attempts)
    ? attempts.map((attempt) =>
        exactRecord(
          attempt,
          ["attemptId", "shardId", "outcome", "childLaunched", "accepted"],
          "MATRIX_CALIBRATION_V5_INVALID",
        ),
      )
    : []
  const allowedOutcomes = new Set([
    "accepted",
    "player_violation",
    "system_failure",
    "unfilled",
    "unfilled_resource_preflight_refusal",
    "unfilled_resource_measurement_unavailable",
  ])
  const ticks = Array.isArray(record.sharedObservationTicks)
    ? record.sharedObservationTicks.map((tick) =>
        exactRecord(
          tick,
          [
            "tickId",
            "observationRoot",
            "observedBasisPoints",
            "shardIds",
            "fanout",
          ],
          "MATRIX_CALIBRATION_V5_INVALID",
        ),
      )
    : []
  const launchedCount = parsedAttempts.filter(
    (attempt) => attempt.childLaunched === true,
  ).length
  const admitted = record.status === "admitted"
  const supervised = record.supervisedCalibration as
    | V138ParallelCalibrationReceipt
    | null
  const supervisedOutcomes = supervised?.terminals
    .flatMap((terminal) => terminal.outcomes)
    .sort((left, right) => left.attemptId.localeCompare(right.attemptId))
  const isCanonicalRoot = (candidate: unknown): candidate is Sha256 =>
    typeof candidate === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(candidate) &&
    !/^sha256:([0-9a-f])\1{63}$/u.test(candidate)
  if (
    record.schemaVersion !== "v1.38-current-matrix-calibration-v5" ||
    typeof record.sourceB !== "string" ||
    !/^[0-9a-f]{40}$/u.test(record.sourceB) ||
    !isCanonicalRoot(record.sourceBCustodyRoot) ||
    !isCanonicalRoot(record.executionContextRoot) ||
    !isCanonicalRoot(record.preflightRoot) ||
    record.chargedAttemptCount !== 8 ||
    record.shardCount !== 4 ||
    record.samplerMode !== "one_shared_observation_per_tick" ||
    !["admitted", "stopped_process_failure"].includes(String(record.status)) ||
    parsedAttempts.length !== 8 ||
    canonical(parsedAttempts.map((attempt) => attempt.attemptId)) !==
      canonical(expectedIds) ||
    parsedAttempts.some(
      (attempt, index) =>
        attempt.shardId !== `calibration-shard:${index % 4}` ||
        typeof attempt.childLaunched !== "boolean" ||
        typeof attempt.accepted !== "boolean" ||
        !allowedOutcomes.has(String(attempt.outcome)) ||
        (attempt.accepted === true &&
          (attempt.outcome !== "accepted" || attempt.childLaunched !== true)),
    ) ||
    record.childLaunchCount !== launchedCount ||
    (admitted
      ? record.acceptedCellCount !== 8 ||
        launchedCount !== 8 ||
        parsedAttempts.some(
          (attempt) =>
            attempt.outcome !== "accepted" || attempt.accepted !== true,
        ) ||
        ticks.length === 0
      : record.acceptedCellCount !== 0 ||
        parsedAttempts.some((attempt) => attempt.accepted === true)) ||
    ticks.some(
      (tick) =>
        typeof tick.tickId !== "string" ||
        !/^sha256:[0-9a-f]{64}$/u.test(String(tick.observationRoot)) ||
        !Number.isSafeInteger(tick.observedBasisPoints) ||
        Number(tick.observedBasisPoints) < 0 ||
        Number(tick.observedBasisPoints) > 10_000 ||
        !Array.isArray(tick.shardIds) ||
        tick.shardIds.length === 0 ||
        new Set(tick.shardIds).size !== tick.shardIds.length ||
        tick.shardIds.some(
          (id) =>
            typeof id !== "string" ||
            !/^calibration-shard:[0-3]$/u.test(id),
        ) ||
        !Array.isArray(tick.fanout) ||
        canonical(tick.fanout) !==
          canonical(
            (tick.shardIds as string[]).map((shardId) => ({
              shardId,
              observationRoot: tick.observationRoot,
            })),
          ),
    ) ||
    (admitted &&
      new Set(ticks.flatMap((tick) => tick.shardIds as string[])).size !== 4) ||
    (admitted
      ? record.supervisedCalibration === null ||
        (() => {
          try {
            validateParallelCalibrationReceipt(
              enumerateV138CurrentMatrix(repoRoot),
              record.supervisedCalibration as V138ParallelCalibrationReceipt,
              "v5",
            )
            return false
          } catch {
            return true
          }
        })() ||
        canonical(ticks) !==
          canonical(supervised?.sharedObservationTicks ?? []) ||
        canonical(
          parsedAttempts.map((attempt) => ({
            attemptId: attempt.attemptId,
            outcome: attempt.outcome,
          })),
        ) !==
          canonical(
            supervisedOutcomes?.map((outcome) => ({
              attemptId: outcome.attemptId,
              outcome: outcome.classification === "success"
                ? "accepted"
                : outcome.classification,
            })) ?? [],
          )
      : record.supervisedCalibration !== null) ||
    record.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("budgetProfile", String(record.schemaVersion), body)
  ) throw new TypeError("MATRIX_CALIBRATION_V5_INVALID")
  return deepFreeze(record)
}

export const buildV138ParallelCalibrationV5Receipt = (input: {
  readonly preflight: V138HostHeadroomPreflightV5Receipt
  readonly attempts: readonly Readonly<{
    attemptId: string
    shardId: string
    outcome:
      | "accepted"
      | "player_violation"
      | "system_failure"
      | "unfilled"
    childLaunched: boolean
    accepted: boolean
  }>[]
  readonly sharedObservationTicks:
    readonly Readonly<V138SharedDarwinObservationTick>[]
  readonly supervisedCalibration?: Readonly<V138ParallelCalibrationReceipt>
}): Readonly<Record<string, unknown>> => {
  const preflight = checkV138HostHeadroomPreflightV5Receipt(input.preflight)
  if (preflight.disposition !== "preflight_admitted") {
    throw new TypeError("MATRIX_CALIBRATION_V5_PREFLIGHT_NOT_ADMITTED")
  }
  if (
    input.attempts.length !== 8 ||
    input.attempts.some(
      (attempt, index) =>
        attempt.attemptId !== `calibration:v5:${index}` ||
        attempt.shardId !== `calibration-shard:${index % 4}`,
    )
  ) throw new TypeError("MATRIX_CALIBRATION_V5_ATTEMPT_INVENTORY_INVALID")
  const accepted = input.attempts.filter((attempt) => attempt.accepted).length
  const admitted =
    accepted === 8 &&
    input.attempts.every((attempt) => attempt.outcome === "accepted")
  const chargedAttempts = input.attempts.map((attempt) =>
    Object.freeze({
      ...attempt,
      accepted: admitted && attempt.accepted,
    }),
  )
  const body = {
    schemaVersion: "v1.38-current-matrix-calibration-v5" as const,
    sourceB: preflight.sourceB,
    sourceBCustodyRoot: preflight.sourceBCustodyRoot,
    executionContextRoot: preflight.executionContextRoot,
    preflightRoot: preflight.receiptRoot,
    status: admitted ? "admitted" as const : "stopped_process_failure" as const,
    chargedAttemptCount: 8 as const,
    chargedAttempts: Object.freeze(chargedAttempts),
    shardCount: 4 as const,
    samplerMode: "one_shared_observation_per_tick" as const,
    sharedObservationTicks: Object.freeze([...input.sharedObservationTicks]),
    supervisedCalibration: admitted
      ? input.supervisedCalibration ?? null
      : null,
    childLaunchCount: input.attempts.filter((attempt) => attempt.childLaunched).length,
    acceptedCellCount: admitted ? 8 as const : 0 as const,
    noRetry: true as const,
  }
  const receipt = deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot("budgetProfile", body.schemaVersion, body),
  })
  return checkV138ParallelCalibrationV5Receipt(receipt)
}

export type V138CalibrationMappedOutcome =
  | Readonly<{
      publicAttemptId: string
      executionAttemptId: string
      templateAttemptId: string
      inventoryOrdinal: number
      shardId: string
      state: "terminal_success"
      classification: "success"
      outcome: "bottom_win" | "top_win" | "draw"
      childLaunched: boolean
      terminalObserved: true
    }>
  | Readonly<{
      publicAttemptId: string
      executionAttemptId: string
      templateAttemptId: string
      inventoryOrdinal: number
      shardId: string
      state: "terminal_player_violation" | "terminal_system_failure"
      classification: "player_violation" | "system_failure"
      code: "PLAYER_VIOLATION" | "SYSTEM_FAILURE"
      childLaunched: boolean
      terminalObserved: true
    }>

export const mapV138CalibrationTerminalOutcomes = (input: {
  readonly mappings: readonly Readonly<V138CalibrationAttemptMapping>[]
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
  readonly launchEvents?: readonly Readonly<V138ParallelShardLaunchEvent>[]
}): readonly Readonly<V138CalibrationMappedOutcome>[] => {
  const expectedByExecutionId = new Map(
    input.mappings.map((mapping) => [mapping.executionAttemptId, mapping]),
  )
  const expectedShardIds = [...new Set(
    input.mappings.map(({ shardId }) => shardId),
  )].sort()
  const actualShardIds = input.terminals.map(({ shardId }) => shardId).sort()
  if (
    input.mappings.length !== 8 ||
    expectedByExecutionId.size !== 8 ||
    new Set(input.mappings.map(({ publicAttemptId }) => publicAttemptId)).size !== 8 ||
    input.terminals.length !== 4 ||
    new Set(actualShardIds).size !== 4 ||
    canonical(actualShardIds) !== canonical(expectedShardIds) ||
    input.terminals.some(
      ({ shardId, laneId }) =>
        laneId !== `lane:${shardId.split(":").at(-1)}`,
    )
  ) {
    throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
  }
  const launchedExecutionIds = new Set(
    (input.launchEvents ?? []).flatMap((event) => {
      const mapping = input.mappings.filter(({ executionAttemptId }) =>
          event.executionAttemptIds.includes(executionAttemptId),
      )
      if (
        event.event !== "child_launched" ||
        mapping.length !== event.executionAttemptIds.length ||
        mapping.some(
          ({ shardId }) =>
            shardId !== event.shardId ||
            event.laneId !== `lane:${event.shardId.split(":").at(-1)}`,
        )
      ) {
        throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
      }
      return event.executionAttemptIds
    }),
  )
  if (
    (input.launchEvents?.length ?? 0) > 4 ||
    new Set(input.launchEvents?.map(({ shardId }) => shardId)).size !==
      (input.launchEvents?.length ?? 0) ||
        input.launchEvents?.some(({ shardId, executionAttemptIds }) => {
          const expected = input.mappings
            .filter((mapping) => mapping.shardId === shardId)
            .map(({ executionAttemptId }) => executionAttemptId)
          return (
        !expectedShardIds.includes(shardId) ||
            executionAttemptIds.length !== 2 ||
            canonical([...executionAttemptIds].sort()) !==
              canonical(expected.sort())
          )
    }) ||
    launchedExecutionIds.size !==
    (input.launchEvents ?? []).reduce(
      (count, event) => count + event.executionAttemptIds.length,
      0,
    )
  ) {
    throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
  }
  const observed = new Map<
    string,
    Readonly<{
      terminal: Readonly<V138ParallelShardTerminal>
      outcome: Readonly<V138ParallelChargedOutcome>
    }>
  >()
  for (const terminal of input.terminals) {
    const classifications = terminal.outcomes.map(
      ({ classification }) => classification,
    )
    if (
      (terminal.classification === "success" &&
        classifications.some((classification) => classification !== "success")) ||
      (terminal.classification === "cancelled" &&
        !classifications.includes("cancelled")) ||
      (terminal.classification === "failed" &&
        classifications.every((classification) => classification === "success"))
    ) {
      throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
    }
    for (const outcome of terminal.outcomes) {
      const mapping = expectedByExecutionId.get(outcome.attemptId)
      if (
        mapping === undefined ||
        terminal.shardId !== mapping.shardId ||
        observed.has(outcome.attemptId)
      ) {
        throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
      }
      observed.set(outcome.attemptId, { terminal, outcome })
    }
  }
  if (
    observed.size !== input.mappings.length ||
    [...expectedByExecutionId.keys()].some((id) => !observed.has(id))
  ) {
    throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
  }
  return Object.freeze(
    input.mappings.map((mapping) => {
      const outcome = observed.get(mapping.executionAttemptId)!.outcome
      const identity = {
        ...mapping,
        childLaunched: launchedExecutionIds.has(mapping.executionAttemptId),
        terminalObserved: true as const,
      }
      if (outcome.classification === "success") {
        return Object.freeze({
          ...identity,
          state: "terminal_success" as const,
          classification: "success" as const,
          outcome: outcome.outcome,
        })
      }
      if (outcome.classification === "player_violation") {
        return Object.freeze({
          ...identity,
          state: "terminal_player_violation" as const,
          classification: "player_violation" as const,
          code: "PLAYER_VIOLATION" as const,
        })
      }
      if (outcome.classification === "system_failure") {
        return Object.freeze({
          ...identity,
          state: "terminal_system_failure" as const,
          classification: "system_failure" as const,
          code: "SYSTEM_FAILURE" as const,
        })
      }
      if (
        outcome.classification === "timeout" ||
        outcome.classification === "cancelled"
      ) {
        return Object.freeze({
          ...identity,
          state: "terminal_system_failure" as const,
          classification: "system_failure" as const,
          code: "SYSTEM_FAILURE" as const,
        })
      }
      throw new TypeError("MATRIX_CALIBRATION_OUTCOME_MAPPING_INVALID")
    }),
  )
}

export interface V138ParallelCalibrationV6Receipt {
  readonly schemaVersion: "v1.38-current-matrix-calibration-v6"
  readonly sourceB2: string
  readonly sourceB2CustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly preflightRoot: Sha256
  readonly status:
    | "admitted"
    | "stopped_process_failure"
    | "preflight_refused"
    | "preflight_unavailable"
  readonly chargedAttemptCount: 8
  readonly chargedAttempts: readonly Readonly<
    | V138CalibrationMappedOutcome
    | (V138CalibrationAttemptMapping & {
        state:
          | "not_launched_preflight_refused"
          | "not_launched_preflight_unavailable"
        childLaunched: false
        terminalObserved: false
      })
    | (V138CalibrationAttemptMapping & {
        state: "unknown_after_consumption"
        childLaunched: null
        terminalObserved: null
      })
  >[]
  readonly shardCount: 4
  readonly observationMode: "exact" | "unknown_after_consumption"
  readonly childLaunchCount: number | null
  readonly terminalOutcomeCount: number | null
  readonly acceptedCellCount: 0 | 8
  readonly publicStopReason: V138ParallelStopReason | null
  readonly supervisionRoot: Sha256 | null
  readonly shardProof: readonly Readonly<{
    shardId: string
    laneId: string
    childLaunched: boolean | null
    terminalObserved: boolean | null
    classification:
      | "success"
      | "failed"
      | "cancelled"
      | "unobserved"
      | "unknown"
    cleanupComplete: boolean
  }>[]
  readonly sharedTickProof: readonly Readonly<{
    tickId: string
    shardIds: readonly string[]
    observationRoot: Sha256
  }>[]
  readonly policyAdmitted: boolean
  readonly completeCleanup: boolean
  readonly noRetry: true
  readonly partialAcceptedEvidenceReusable: false
  readonly receiptRoot: Sha256
}

const V138_CALIBRATION_V6_KEYS = Object.freeze([
  "schemaVersion",
  "sourceB2",
  "sourceB2CustodyRoot",
  "executionContextRoot",
  "preflightRoot",
  "status",
  "chargedAttemptCount",
  "chargedAttempts",
  "shardCount",
  "observationMode",
  "childLaunchCount",
  "terminalOutcomeCount",
  "acceptedCellCount",
  "publicStopReason",
  "supervisionRoot",
  "shardProof",
  "sharedTickProof",
  "policyAdmitted",
  "completeCleanup",
  "noRetry",
  "partialAcceptedEvidenceReusable",
  "receiptRoot",
] as const)

export const buildV138ParallelCalibrationV6Receipt = (input: {
  readonly inventory: Readonly<V138CurrentMatrixInventory>
  readonly sourceB2: string
  readonly sourceB2CustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly preflightRoot: Sha256
  readonly preflightDisposition:
    | "preflight_admitted"
    | "preflight_refused"
    | "preflight_unavailable"
  readonly calibration?: Readonly<V138ParallelCalibrationReceipt> | undefined
  readonly callbackFailureAfterConsumption?: true | undefined
}): Readonly<V138ParallelCalibrationV6Receipt> => {
  const mappings = deriveV138CalibrationAttemptMappings(input.inventory, "v6")
  const preflightAdmitted = input.preflightDisposition === "preflight_admitted"
  if (
    preflightAdmitted !==
      (input.calibration !== undefined ||
        input.callbackFailureAfterConsumption === true) ||
    (input.calibration !== undefined &&
      input.callbackFailureAfterConsumption === true)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_PREFLIGHT_JOIN_INVALID")
  }
  let chargedAttempts: V138ParallelCalibrationV6Receipt["chargedAttempts"]
  if (input.callbackFailureAfterConsumption === true) {
    chargedAttempts = Object.freeze(
      mappings.map((mapping) =>
        Object.freeze({
          ...mapping,
          state: "unknown_after_consumption" as const,
          childLaunched: null,
          terminalObserved: null,
        }),
      ),
    )
  } else if (input.calibration === undefined) {
    const state =
      input.preflightDisposition === "preflight_refused"
        ? "not_launched_preflight_refused" as const
        : "not_launched_preflight_unavailable" as const
    chargedAttempts = Object.freeze(
      mappings.map((mapping) =>
        Object.freeze({
          ...mapping,
          state,
          childLaunched: false as const,
          terminalObserved: false as const,
        }),
      ),
    )
  } else {
    validateParallelCalibrationReceipt(input.inventory, input.calibration, "v6")
    chargedAttempts = mapV138CalibrationTerminalOutcomes({
      mappings,
      terminals: input.calibration.terminals,
      launchEvents: input.calibration.launchEvents,
    })
  }
  const admitted =
    input.calibration?.status === "admitted" &&
    chargedAttempts.every(
      (attempt) =>
        attempt.state === "terminal_success" &&
        attempt.classification === "success" &&
        attempt.childLaunched === true &&
        attempt.terminalObserved === true,
    )
  const launchedShardIds = new Set(
    input.calibration?.launchEvents.map(({ shardId }) => shardId) ?? [],
  )
  const terminalByShardId = new Map(
    input.calibration?.terminals.map((terminal) => [terminal.shardId, terminal]) ??
      [],
  )
  const completeCleanup =
    input.callbackFailureAfterConsumption !== true &&
    [...launchedShardIds].every((shardId) => {
      const terminal = terminalByShardId.get(shardId)
      return terminal !== undefined &&
        terminal.cleanup.exitAwaited &&
        terminal.cleanup.orphanProcessIds.length === 0
    }) &&
    (input.calibration?.terminals.every(({ shardId }) =>
      launchedShardIds.has(shardId)
    ) ?? true)
  const shardProof = Object.freeze(
    Array.from({ length: 4 }, (_, ordinal) => {
      const shardId = `calibration-shard:${ordinal}`
      const launch = input.calibration?.launchEvents.find(
        (event) => event.shardId === shardId,
      )
      const terminal = input.calibration?.terminals.find(
        (candidate) => candidate.shardId === shardId,
      )
      const unknown = input.callbackFailureAfterConsumption === true
      return Object.freeze({
        shardId,
        laneId: `lane:${ordinal}`,
        childLaunched: unknown ? null : launch !== undefined,
        terminalObserved: unknown ? null : terminal !== undefined,
        classification: unknown
          ? ("unknown" as const)
          : (terminal?.classification ?? ("unobserved" as const)),
        cleanupComplete:
          !unknown &&
          terminal !== undefined &&
          terminal.cleanup.exitAwaited &&
          terminal.cleanup.orphanProcessIds.length === 0,
      })
    }),
  )
  const sharedTickProof = Object.freeze(
    (input.calibration?.sharedObservationTicks ?? []).map((tick) =>
      Object.freeze({
        tickId: tick.tickId,
        shardIds: Object.freeze([...tick.shardIds]),
        observationRoot: tick.observationRoot,
      })
    ),
  )
  const policyAdmitted =
    input.calibration?.projection.admittedByTime === true &&
    input.calibration.rawObservation.childMaxRssKilobytes.every(
      (rss) => rss <= V138_PARALLEL_RESOURCE_POLICY.maxChildRssKilobytes,
    ) &&
    input.calibration.rawObservation.aggregateChildRssKilobytes <=
      V138_PARALLEL_RESOURCE_POLICY.maxAggregateChildRssKilobytes &&
    input.calibration.rawObservation.minimumHostHeadroomBasisPoints >=
      V138_PARALLEL_RESOURCE_POLICY.minHostFreeMemoryBasisPoints
  const safeSupervision =
    input.calibration === undefined &&
    input.callbackFailureAfterConsumption !== true
      ? null
      : {
          shardProof,
          sharedTickProof,
          chargedAttempts,
          observationMode:
            input.callbackFailureAfterConsumption === true
              ? ("unknown_after_consumption" as const)
              : ("exact" as const),
          policyAdmitted,
          status:
            input.callbackFailureAfterConsumption === true
              ? ("stopped_process_failure" as const)
              : input.calibration!.status,
          reason:
            input.callbackFailureAfterConsumption === true
              ? ("PARENT_EXCEPTION" as const)
              : input.calibration!.reason,
        }
  const status = admitted
    ? "admitted" as const
    : input.preflightDisposition === "preflight_refused"
      ? "preflight_refused" as const
      : input.preflightDisposition === "preflight_unavailable"
        ? "preflight_unavailable" as const
        : "stopped_process_failure" as const
  const body = {
    schemaVersion: "v1.38-current-matrix-calibration-v6" as const,
    sourceB2: input.sourceB2,
    sourceB2CustodyRoot: input.sourceB2CustodyRoot,
    executionContextRoot: input.executionContextRoot,
    preflightRoot: input.preflightRoot,
    status,
    chargedAttemptCount: 8 as const,
    chargedAttempts,
    shardCount: 4 as const,
    observationMode:
      input.callbackFailureAfterConsumption === true
        ? ("unknown_after_consumption" as const)
        : ("exact" as const),
    childLaunchCount:
      input.callbackFailureAfterConsumption === true
        ? null
        : chargedAttempts.filter(({ childLaunched }) => childLaunched).length,
    terminalOutcomeCount:
      input.callbackFailureAfterConsumption === true
        ? null
        : chargedAttempts.filter(({ terminalObserved }) => terminalObserved)
            .length,
    acceptedCellCount: admitted ? (8 as const) : (0 as const),
    publicStopReason: admitted
      ? null
      : input.callbackFailureAfterConsumption === true
        ? ("PARENT_EXCEPTION" as const)
        : (input.calibration?.reason ?? null),
    supervisionRoot:
      safeSupervision === null
      ? null
      : v138SuccessorRoot(
          "evidenceBundle",
          "v1.38-current-matrix-calibration-v6-supervision-v1",
          safeSupervision,
        ),
    shardProof,
    sharedTickProof,
    policyAdmitted,
    completeCleanup,
    noRetry: true as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  const receipt = deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot(
      "budgetProfile",
      body.schemaVersion,
      body,
    ),
  })
  return checkV138ParallelCalibrationV6Receipt(input.inventory, receipt)
}

export const checkV138ParallelCalibrationV6Receipt = (
  inventory: Readonly<V138CurrentMatrixInventory>,
  value: unknown,
): Readonly<V138ParallelCalibrationV6Receipt> => {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    canonical(Object.keys(value)) !== canonical(V138_CALIBRATION_V6_KEYS)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
  }
  const receipt = value as V138ParallelCalibrationV6Receipt
  const { receiptRoot: _root, ...body } = receipt
  if (
    receipt.schemaVersion !== "v1.38-current-matrix-calibration-v6" ||
    !/^[0-9a-f]{40}$/u.test(receipt.sourceB2) ||
    !/^sha256:[0-9a-f]{64}$/u.test(receipt.sourceB2CustodyRoot) ||
    !/^sha256:[0-9a-f]{64}$/u.test(receipt.executionContextRoot) ||
    !/^sha256:[0-9a-f]{64}$/u.test(receipt.preflightRoot) ||
    receipt.chargedAttemptCount !== 8 ||
    receipt.shardCount !== 4 ||
    receipt.noRetry !== true ||
    receipt.partialAcceptedEvidenceReusable !== false ||
    receipt.receiptRoot !==
      v138SuccessorRoot("budgetProfile", receipt.schemaVersion, body)
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
  }
  const expectedMappings = deriveV138CalibrationAttemptMappings(inventory, "v6")
  if (
    receipt.chargedAttempts.length !== 8 ||
    receipt.chargedAttempts.some((attempt, index) => {
      const expected = expectedMappings[index]!
      const identityKeys = [
        "publicAttemptId",
        "executionAttemptId",
        "templateAttemptId",
        "inventoryOrdinal",
        "shardId",
        "state",
        "childLaunched",
        "terminalObserved",
      ]
      const keys =
        attempt.state === "terminal_success"
          ? [...identityKeys, "classification", "outcome"]
          : attempt.state === "terminal_player_violation" ||
              attempt.state === "terminal_system_failure"
            ? [...identityKeys, "classification", "code"]
            : identityKeys
      return (
        canonical(Object.keys(attempt).sort()) !== canonical(keys.sort()) ||
        attempt.publicAttemptId !== expected.publicAttemptId ||
        attempt.executionAttemptId !== expected.executionAttemptId ||
        attempt.templateAttemptId !== expected.templateAttemptId ||
        attempt.inventoryOrdinal !== expected.inventoryOrdinal ||
        attempt.shardId !== expected.shardId ||
        (attempt.state === "terminal_success"
          ? attempt.classification !== "success" ||
            !["bottom_win", "top_win", "draw"].includes(attempt.outcome) ||
            typeof attempt.childLaunched !== "boolean" ||
            attempt.terminalObserved !== true
          : attempt.state === "terminal_player_violation"
            ? attempt.classification !== "player_violation" ||
              attempt.code !== "PLAYER_VIOLATION" ||
              typeof attempt.childLaunched !== "boolean" ||
              attempt.terminalObserved !== true
            : attempt.state === "terminal_system_failure"
              ? attempt.classification !== "system_failure" ||
                attempt.code !== "SYSTEM_FAILURE" ||
                typeof attempt.childLaunched !== "boolean" ||
                attempt.terminalObserved !== true
              : attempt.state === "not_launched_preflight_refused" ||
                  attempt.state === "not_launched_preflight_unavailable"
                ? attempt.childLaunched !== false ||
                  attempt.terminalObserved !== false
                : attempt.state === "unknown_after_consumption"
                  ? attempt.childLaunched !== null ||
                    attempt.terminalObserved !== null
                : true)
      )
    }) ||
    !["exact", "unknown_after_consumption"].includes(receipt.observationMode) ||
    (receipt.observationMode === "exact"
      ? receipt.childLaunchCount !==
          receipt.chargedAttempts.filter(({ childLaunched }) => childLaunched)
        .length ||
        receipt.terminalOutcomeCount !==
          receipt.chargedAttempts.filter(
            ({ terminalObserved }) => terminalObserved,
          ).length
      : receipt.childLaunchCount !== null ||
        receipt.terminalOutcomeCount !== null ||
        receipt.chargedAttempts.some(
          ({ state }) => state !== "unknown_after_consumption",
        )) ||
    (receipt.publicStopReason !== null &&
      !V138_PUBLIC_STOP_REASONS.has(receipt.publicStopReason))
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
  }
  const expectedShardIds = Array.from(
    { length: 4 },
    (_, ordinal) => `calibration-shard:${ordinal}`,
  )
  const shardProofValid =
    receipt.shardProof.length === 4 &&
    receipt.shardProof.every((shard, ordinal) => {
      const attempts = receipt.chargedAttempts.filter(
        ({ shardId }) => shardId === shard.shardId,
      )
      return (
        canonical(Object.keys(shard)) ===
          canonical([
            "shardId",
            "laneId",
            "childLaunched",
            "terminalObserved",
            "classification",
            "cleanupComplete",
        ]) &&
        shard.shardId === expectedShardIds[ordinal] &&
        shard.laneId === `lane:${ordinal}` &&
        (typeof shard.childLaunched === "boolean" ||
          shard.childLaunched === null) &&
        (typeof shard.terminalObserved === "boolean" ||
          shard.terminalObserved === null) &&
        ["success", "failed", "cancelled", "unobserved", "unknown"].includes(
          shard.classification,
        ) &&
        typeof shard.cleanupComplete === "boolean" &&
        attempts.length === 2 &&
        attempts.every(
          (attempt) =>
            attempt.childLaunched === shard.childLaunched &&
            attempt.terminalObserved === shard.terminalObserved,
        ) &&
        (shard.terminalObserved === null
          ? shard.classification === "unknown" &&
            shard.childLaunched === null &&
            shard.cleanupComplete === false
          : shard.terminalObserved
          ? shard.classification !== "unobserved"
          : shard.classification === "unobserved" &&
            shard.cleanupComplete === false)
      )
    })
  const tickProofValid =
    receipt.sharedTickProof.every(
      (tick, ordinal) =>
        canonical(Object.keys(tick)) ===
          canonical(["tickId", "shardIds", "observationRoot"]) &&
      tick.tickId === `shared-darwin-tick:${ordinal}` &&
      isV138CanonicalSha256(tick.observationRoot) &&
      tick.shardIds.length > 0 &&
      new Set(tick.shardIds).size === tick.shardIds.length &&
        tick.shardIds.every((shardId) => expectedShardIds.includes(shardId)),
    ) &&
    (receipt.sharedTickProof.length === 0 ||
      expectedShardIds.every((shardId) =>
        receipt.sharedTickProof.some((tick) => tick.shardIds.includes(shardId))
      ))
  const safeSupervision =
    receipt.supervisionRoot === null
    ? null
    : {
        shardProof: receipt.shardProof,
        sharedTickProof: receipt.sharedTickProof,
        chargedAttempts: receipt.chargedAttempts,
          observationMode: receipt.observationMode,
        policyAdmitted: receipt.policyAdmitted,
          status:
            receipt.status === "admitted"
          ? "admitted"
          : "stopped_process_failure",
        reason: receipt.publicStopReason,
      }
  if (
    !shardProofValid ||
    !tickProofValid ||
    typeof receipt.policyAdmitted !== "boolean" ||
    (safeSupervision !== null &&
      receipt.supervisionRoot !==
        v138SuccessorRoot(
        "evidenceBundle",
        "v1.38-current-matrix-calibration-v6-supervision-v1",
        safeSupervision,
      ))
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
  }
  if (receipt.supervisionRoot !== null) {
    if (
      !/^sha256:[0-9a-f]{64}$/u.test(receipt.supervisionRoot) ||
      typeof receipt.completeCleanup !== "boolean" ||
      (receipt.observationMode === "unknown_after_consumption"
        ? receipt.status !== "stopped_process_failure" ||
          receipt.acceptedCellCount !== 0 ||
          receipt.publicStopReason !== "PARENT_EXCEPTION" ||
          receipt.policyAdmitted !== false ||
          receipt.sharedTickProof.length !== 0 ||
          receipt.completeCleanup !== false ||
          receipt.chargedAttempts.some(
            ({ state, childLaunched, terminalObserved }) =>
              state !== "unknown_after_consumption" ||
              childLaunched !== null ||
              terminalObserved !== null,
          )
        : receipt.status === "admitted"
        ? receipt.acceptedCellCount !== 8 ||
          receipt.childLaunchCount !== 8 ||
          receipt.terminalOutcomeCount !== 8 ||
          receipt.publicStopReason !== null ||
          receipt.policyAdmitted !== true ||
          receipt.sharedTickProof.length === 0 ||
          receipt.completeCleanup !== true ||
          receipt.chargedAttempts.some(
            (attempt) =>
              attempt.state !== "terminal_success" ||
              attempt.classification !== "success" ||
              attempt.childLaunched !== true ||
              attempt.terminalObserved !== true,
          )
        : receipt.status !== "stopped_process_failure" ||
          receipt.acceptedCellCount !== 0 ||
          receipt.publicStopReason === null ||
          (receipt.sharedTickProof.length === 0 &&
            receipt.publicStopReason !== "RESOURCE_MEASUREMENT_UNAVAILABLE"))
    ) {
      throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
    }
  } else if (
    !["preflight_refused", "preflight_unavailable"].includes(receipt.status) ||
    receipt.childLaunchCount !== 0 ||
    receipt.terminalOutcomeCount !== 0 ||
    receipt.observationMode !== "exact" ||
    receipt.acceptedCellCount !== 0 ||
    receipt.publicStopReason !== null ||
    receipt.shardProof.some(
      (shard) =>
        shard.childLaunched ||
        shard.terminalObserved ||
        shard.classification !== "unobserved" ||
        shard.cleanupComplete,
    ) ||
    receipt.sharedTickProof.length !== 0 ||
    receipt.policyAdmitted !== false ||
    receipt.completeCleanup !== true ||
    receipt.chargedAttempts.some(
      ({ state }) =>
        state !==
        (receipt.status === "preflight_refused"
          ? "not_launched_preflight_refused"
          : "not_launched_preflight_unavailable"),
    )
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V6_INVALID")
  }
  return deepFreeze(receipt)
}

export interface V138ExecutionContextV6Receipt {
  readonly schemaVersion: "v1.38-current-matrix-execution-context-v6"
  readonly mode: "gsd-pattern-c-inline-main"
  readonly cwd: "/Users/roryquinlan/runtime/cowards-game"
  readonly terminalAgentRegistry: Readonly<{
    schemaVersion: "v1.38-plan-262-19-terminal-agent-registry-v2"
    activeExecutorCount: 0
    agents: readonly Readonly<{ id: string; status: "completed" | "failed" }>[]
  }>
  readonly sourceA2: string
  readonly sourceB2: string
  readonly sourceB2Custody: Readonly<V138SourceB2Custody>
  readonly sourceB2CustodyRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly selectedRouteClosureRoot: Sha256
  readonly protectedHistoryRoot: Sha256
  readonly frozenPolicyRoot: Sha256
  readonly toolIdentityRoot: Sha256
  readonly hostIdentityRoot: Sha256
  readonly patternCOwnership: "main_orchestrator_only"
  readonly formationAbsenceBound: true
  readonly runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

const V138_CONTEXT_V6_KEYS = [
  "schemaVersion", "mode", "cwd", "terminalAgentRegistry", "sourceA2",
  "sourceB2", "sourceB2Custody", "sourceB2CustodyRoot", "authorizationRoot",
  "sealRoot", "selectedRouteClosureRoot", "protectedHistoryRoot",
  "frozenPolicyRoot", "toolIdentityRoot", "hostIdentityRoot",
  "patternCOwnership", "formationAbsenceBound", "runtimeRoute",
  "acceptedCellCount", "noRetry", "receiptRoot",
] as const

const checkV138TerminalRegistryV2 = (
  value: unknown,
): V138ExecutionContextV6Receipt["terminalAgentRegistry"] => {
  const registry = exactRecord(
    value,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V6_REGISTRY_INVALID",
  )
  if (
    registry.schemaVersion !== "v1.38-plan-262-19-terminal-agent-registry-v2" ||
    registry.activeExecutorCount !== 0 ||
    !Array.isArray(registry.agents) ||
    registry.agents.some((agent) => {
      const row = exactRecord(
        agent,
        ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V6_REGISTRY_INVALID",
      )
      return (
        typeof row.id !== "string" ||
        row.id.length === 0 ||
        (row.status !== "completed" && row.status !== "failed")
      )
    })
  ) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V6_REGISTRY_INVALID")
  }
  return registry as unknown as V138ExecutionContextV6Receipt["terminalAgentRegistry"]
}

export const buildV138ExecutionContextV6Receipt = (input: {
  readonly repoRoot: string
  readonly authorization: V138Plan26218AuthorizationV2
  readonly seal: V138SuccessorSourceSealV2
  readonly sourceB2Custody: Readonly<V138SourceB2Custody>
  readonly mode: V138ExecutionContextV6Receipt["mode"]
  readonly cwd: V138ExecutionContextV6Receipt["cwd"]
  readonly terminalAgentRegistry: V138ExecutionContextV6Receipt["terminalAgentRegistry"]
}): Readonly<V138ExecutionContextV6Receipt> => {
  const authorization = checkV138Plan26218AuthorizationV2(
    input.repoRoot,
    input.authorization,
  )
  const seal = checkV138SuccessorSourceSealV2(
    input.repoRoot,
    input.seal,
    authorization,
  )
  const registry = checkV138TerminalRegistryV2(input.terminalAgentRegistry)
  const custody = input.sourceB2Custody
  if (
    input.mode !== "gsd-pattern-c-inline-main" ||
    input.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    custody.sourceA2 !== authorization.sourceCustody.sourceA2 ||
    seal.sourceCustody.sourceA2 !== custody.sourceA2 ||
    seal.authorizationRoot !== authorization.authorizationRoot
  ) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V6_ROUTE_INVALID")
  }
  const body = {
    schemaVersion: "v1.38-current-matrix-execution-context-v6" as const,
    mode: input.mode,
    cwd: input.cwd,
    terminalAgentRegistry: registry,
    sourceA2: custody.sourceA2,
    sourceB2: custody.sourceB2,
    sourceB2Custody: custody,
    sourceB2CustodyRoot: custody.custodyRoot,
    authorizationRoot: authorization.authorizationRoot,
    sealRoot: seal.sealRoot,
    selectedRouteClosureRoot: seal.selectedRouteClosure.closureRoot,
    protectedHistoryRoot: seal.protectedHistory.protectedHistoryRoot,
    frozenPolicyRoot: v138SuccessorRoot(
      "budgetProfile",
      "v1.38-current-matrix-frozen-policy-v6",
      seal.frozenPolicy,
    ),
    toolIdentityRoot: v138SuccessorRoot(
      "artifactManifest",
      "v1.38-current-matrix-tool-identity-v6",
      seal.toolIdentity,
    ),
    hostIdentityRoot: v138SuccessorRoot(
      "containmentPolicy",
      "v1.38-current-matrix-host-identity-v6",
      seal.hostIdentity,
    ),
    patternCOwnership: "main_orchestrator_only" as const,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle", body.schemaVersion, body),
  })
}

export const checkV138ExecutionContextV6Receipt = (
  value: unknown,
  expected?: Readonly<{
    authorization: V138Plan26218AuthorizationV2
    seal: V138SuccessorSourceSealV2
    sourceB2Custody: Readonly<V138SourceB2Custody>
    repoRoot: string
  }>,
): Readonly<V138ExecutionContextV6Receipt> => {
  const receipt = exactRecord(
    value,
    V138_CONTEXT_V6_KEYS,
    "MATRIX_EXECUTION_CONTEXT_V6_INVALID",
  ) as unknown as V138ExecutionContextV6Receipt
  checkV138TerminalRegistryV2(receipt.terminalAgentRegistry)
  const { receiptRoot, ...body } = receipt
  if (
    receipt.schemaVersion !== "v1.38-current-matrix-execution-context-v6" ||
    receipt.mode !== "gsd-pattern-c-inline-main" ||
    receipt.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    !/^[0-9a-f]{40}$/u.test(receipt.sourceA2) ||
    !/^[0-9a-f]{40}$/u.test(receipt.sourceB2) ||
    receipt.sourceB2Custody.sourceA2 !== receipt.sourceA2 ||
    receipt.sourceB2Custody.sourceB2 !== receipt.sourceB2 ||
    receipt.sourceB2CustodyRoot !== receipt.sourceB2Custody.custodyRoot ||
    !isV138CanonicalSha256(receipt.authorizationRoot) ||
    !isV138CanonicalSha256(receipt.sealRoot) ||
    !isV138CanonicalSha256(receipt.selectedRouteClosureRoot) ||
    !isV138CanonicalSha256(receipt.protectedHistoryRoot) ||
    !isV138CanonicalSha256(receipt.frozenPolicyRoot) ||
    !isV138CanonicalSha256(receipt.toolIdentityRoot) ||
    !isV138CanonicalSha256(receipt.hostIdentityRoot) ||
    receipt.patternCOwnership !== "main_orchestrator_only" ||
    receipt.formationAbsenceBound !== true ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.acceptedCellCount !== 0 ||
    receipt.noRetry !== true ||
    receiptRoot !==
      v138SuccessorRoot("evidenceBundle", receipt.schemaVersion, body)
  ) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V6_INVALID")
  }
  if (expected !== undefined) {
    const rebuilt = buildV138ExecutionContextV6Receipt({
      repoRoot: expected.repoRoot,
      authorization: expected.authorization,
      seal: expected.seal,
      sourceB2Custody: expected.sourceB2Custody,
      mode: receipt.mode,
      cwd: receipt.cwd,
      terminalAgentRegistry: receipt.terminalAgentRegistry,
    })
    if (canonical(rebuilt) !== canonical(receipt)) {
      throw new TypeError("MATRIX_EXECUTION_CONTEXT_V6_ROUTE_INVALID")
    }
  }
  return deepFreeze(receipt)
}

export interface V138HostHeadroomPreflightV6Receipt {
  readonly schemaVersion: "v1.38-current-matrix-headroom-preflight-v6"
  readonly sourceA2: string
  readonly sourceB2: string
  readonly sourceB2CustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly status: "preflight_complete" | "preflight_unavailable"
  readonly chargedIdentityId: "preflight:v6:0"
  readonly metricId: typeof V138_DARWIN_HEADROOM_METRIC_ID
  readonly providerId: typeof V138_DARWIN_HEADROOM_PROVIDER_ID
  readonly parserId: typeof V138_DARWIN_HEADROOM_PARSER_ID
  readonly requiredHostHeadroomBasisPoints: 2500
  readonly observation: Readonly<Record<string, number | Sha256>> | null
  readonly disposition:
    | "preflight_admitted"
    | "preflight_refused"
    | "preflight_unavailable"
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138HostHeadroomPreflightV6Receipt = (input: {
  readonly result: V138DarwinHeadroomResult
  readonly executionContext: V138ExecutionContextV6Receipt
}): Readonly<V138HostHeadroomPreflightV6Receipt> => {
  const context = checkV138ExecutionContextV6Receipt(input.executionContext)
  const body = {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v6" as const,
    sourceA2: context.sourceA2,
    sourceB2: context.sourceB2,
    sourceB2CustodyRoot: context.sourceB2CustodyRoot,
    executionContextRoot: context.receiptRoot,
    authorizationRoot: context.authorizationRoot,
    sealRoot: context.sealRoot,
    status: input.result.ok
      ? "preflight_complete" as const
      : "preflight_unavailable" as const,
    chargedIdentityId: "preflight:v6:0" as const,
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    requiredHostHeadroomBasisPoints:
      V138_DARWIN_HEADROOM_THRESHOLD_BASIS_POINTS,
    observation: input.result.ok
      ? {
          stdoutByteLength: input.result.observation.stdoutByteLength,
          stdoutSha256: input.result.observation.stdoutSha256,
          totalBytes: input.result.observation.totalBytes,
          pageCount: input.result.observation.pageCount,
          pageSizeBytes: input.result.observation.pageSizeBytes,
          percentage: input.result.observation.percentage,
          observedBasisPoints: input.result.observation.observedBasisPoints,
        }
      : null,
    disposition: input.result.ok
      ? input.result.observation.disposition
      : "preflight_unavailable" as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot(
      "canonicalJsonProfile",
      body.schemaVersion,
      body,
    ),
  })
}

export const checkV138HostHeadroomPreflightV6Receipt = (
  value: unknown,
  executionContext: V138ExecutionContextV6Receipt,
): Readonly<V138HostHeadroomPreflightV6Receipt> => {
  const receipt = exactRecord(
    value,
    [
      "schemaVersion", "sourceA2", "sourceB2", "sourceB2CustodyRoot",
      "executionContextRoot", "authorizationRoot", "sealRoot", "status",
      "chargedIdentityId", "metricId", "providerId", "parserId",
      "requiredHostHeadroomBasisPoints", "observation", "disposition",
      "acceptedCellCount", "noRetry", "receiptRoot",
    ],
    "MATRIX_PREFLIGHT_V6_INVALID",
  ) as unknown as V138HostHeadroomPreflightV6Receipt
  const context = checkV138ExecutionContextV6Receipt(executionContext)
  const { receiptRoot, ...body } = receipt
  const observation =
    receipt.observation === null
    ? null
    : exactRecord(
        receipt.observation,
        [
            "stdoutByteLength",
            "stdoutSha256",
            "totalBytes",
            "pageCount",
            "pageSizeBytes",
            "percentage",
            "observedBasisPoints",
        ],
        "MATRIX_PREFLIGHT_V6_INVALID",
      )
  const available =
    observation !== null &&
    Number.isSafeInteger(observation.stdoutByteLength) &&
    Number(observation.stdoutByteLength) > 0 &&
    Number(observation.stdoutByteLength) <= 4_096 &&
    isV138CanonicalSha256(observation.stdoutSha256) &&
    Number.isSafeInteger(observation.totalBytes) &&
    Number(observation.totalBytes) > 0 &&
    Number.isSafeInteger(observation.pageCount) &&
    Number(observation.pageCount) > 0 &&
    Number.isSafeInteger(observation.pageSizeBytes) &&
    Number(observation.pageSizeBytes) > 0 &&
    Number.isSafeInteger(
      Number(observation.pageCount) * Number(observation.pageSizeBytes),
    ) &&
    Number(observation.totalBytes) ===
      Number(observation.pageCount) * Number(observation.pageSizeBytes) &&
    Number.isSafeInteger(observation.percentage) &&
    Number(observation.percentage) >= 0 &&
    Number(observation.percentage) <= 100 &&
    Number.isSafeInteger(observation.observedBasisPoints) &&
    observation.observedBasisPoints === Number(observation.percentage) * 100
  const expectedDisposition = available
    ? Number(observation!.observedBasisPoints) >= 2_500
      ? "preflight_admitted"
      : "preflight_refused"
    : "preflight_unavailable"
  if (
    receipt.schemaVersion !== "v1.38-current-matrix-headroom-preflight-v6" ||
    receipt.sourceA2 !== context.sourceA2 ||
    receipt.sourceB2 !== context.sourceB2 ||
    receipt.sourceB2CustodyRoot !== context.sourceB2CustodyRoot ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.authorizationRoot !== context.authorizationRoot ||
    receipt.sealRoot !== context.sealRoot ||
    receipt.chargedIdentityId !== "preflight:v6:0" ||
    receipt.metricId !== V138_DARWIN_HEADROOM_METRIC_ID ||
    receipt.providerId !== V138_DARWIN_HEADROOM_PROVIDER_ID ||
    receipt.parserId !== V138_DARWIN_HEADROOM_PARSER_ID ||
    receipt.requiredHostHeadroomBasisPoints !== 2500 ||
    receipt.acceptedCellCount !== 0 ||
    receipt.noRetry !== true ||
    receipt.disposition !== expectedDisposition ||
    receipt.status !==
      (available ? "preflight_complete" : "preflight_unavailable") ||
    (receipt.observation === null) !== !available ||
    receiptRoot !==
      v138SuccessorRoot("canonicalJsonProfile", receipt.schemaVersion, body)
  ) {
    throw new TypeError("MATRIX_PREFLIGHT_V6_INVALID")
  }
  return deepFreeze(receipt)
}

export interface V138AuthoritativeMatrixV6Receipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v6"
  readonly sourceB: string
  readonly sourceBCustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly calibrationRoot: Sha256
  readonly status: "passed_exact" | "stopped_process_failure"
  readonly chargedAttemptCount: 540
  readonly acceptedCellCount: 0 | 540
  readonly attemptLedgerRoot: Sha256
  readonly acceptedCellRoot: Sha256 | null
  readonly execution: V138ParallelMatrixExecutionResult
  readonly runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"
  readonly partialAcceptedEvidenceReusable: false
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138AuthoritativeMatrixV6Receipt = (input: {
  readonly repoRoot: string
  readonly executionContext: V138ExecutionContextV5Receipt
  readonly calibration: Record<string, unknown>
  readonly execution: V138ParallelMatrixExecutionResult
}): Readonly<V138AuthoritativeMatrixV6Receipt> => {
  const context = checkV138ExecutionContextV5Receipt(input.executionContext)
  const calibration = checkV138ParallelCalibrationV5Receipt(
    input.calibration,
    input.repoRoot,
  )
  if (
    calibration.status !== "admitted" ||
    calibration.acceptedCellCount !== 8 ||
    calibration.executionContextRoot !== context.receiptRoot ||
    calibration.sourceB !== context.sourceB ||
    calibration.sourceBCustodyRoot !== context.sourceBCustodyRoot
  ) throw new TypeError("MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED")
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  const expectedIds = inventory.attempts.map(
    ({ attemptId }) => `reproduction:v5:${attemptId}`,
  )
  const actualIds = input.execution.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId),
  )
  const canonicalTerminals = input.execution.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId: outcome.attemptId.replace(/^reproduction:v5:/u, ""),
    })),
  }))
  const plan = planV138MatrixShards(inventory)
  const recomputedAccounting = reduceV138ParallelMatrixAccounting({
    inventory,
    plan,
    terminals: canonicalTerminals,
    launchEvents: input.execution.launchEvents.map((event) => ({
      ...event,
      executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
        attemptId.replace(/^reproduction:v5:/u, ""),
      ),
    })),
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.launchEvents.some(
            (event) => event.shardId === shardId,
          ),
      )
      .map(({ shardId }) => shardId),
  })
  if (
    canonical(input.execution.accounting) !== canonical(recomputedAccounting) ||
    actualIds.some((id) => !id.startsWith("reproduction:v5:")) ||
    new Set(actualIds).size !== actualIds.length ||
    (input.execution.status === "complete_pending_publication" &&
      canonical(actualIds) !== canonical(expectedIds))
  )
    throw new TypeError("MATRIX_REPRODUCTION_V6_EXECUTION_INVALID")
  const canonicalOutcomes = input.execution.canonicalOutcomes.map(
    (outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v5:/u, ""),
    }),
  ) as V138CurrentMatrixAttemptOutcome[]
  const canonicalReceipt =
    input.execution.status === "complete_pending_publication"
      ? reduceV138CurrentMatrix(inventory, canonicalOutcomes)
      : null
  const passed = canonicalReceipt !== null
  const attemptLedgerRoot = sha256(
    canonical({
      calibrationRoot: calibration.receiptRoot,
      execution: input.execution,
      canonicalChargedAttemptLedgerRoot:
        canonicalReceipt?.chargedAttemptLedgerRoot ?? sha256(canonical([])),
    }),
  )
  const body = {
    schemaVersion: "v1.38-current-matrix-reproduction-v6" as const,
    sourceB: context.sourceB,
    sourceBCustodyRoot: context.sourceBCustodyRoot,
    executionContextRoot: context.receiptRoot,
    calibrationRoot: calibration.receiptRoot as Sha256,
    status: passed
      ? "passed_exact" as const
      : "stopped_process_failure" as const,
    chargedAttemptCount: 540 as const,
    acceptedCellCount: passed ? 540 as const : 0 as const,
    attemptLedgerRoot,
    acceptedCellRoot: canonicalReceipt?.acceptedCellLedgerRoot ?? null,
    execution: input.execution,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    partialAcceptedEvidenceReusable: false as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle", body.schemaVersion, body),
  })
}

export const checkV138AuthoritativeMatrixV6Receipt = (
  value: unknown,
  suppliedEvidence?: Readonly<{
    repoRoot: string
    executionContext: V138ExecutionContextV5Receipt
    calibration: Record<string, unknown>
  }>,
): Readonly<V138AuthoritativeMatrixV6Receipt> => {
  const record = exactRecord(
    value,
    [
      "schemaVersion", "sourceB", "sourceBCustodyRoot",
      "executionContextRoot", "calibrationRoot", "status",
      "chargedAttemptCount", "acceptedCellCount", "attemptLedgerRoot",
      "acceptedCellRoot", "execution", "runtimeRoute", "partialAcceptedEvidenceReusable",
      "noRetry", "receiptRoot",
    ],
    "MATRIX_REPRODUCTION_V6_INVALID",
  ) as unknown as V138AuthoritativeMatrixV6Receipt
  const { receiptRoot, ...body } = record
  const passed = record.status === "passed_exact"
  const isCanonicalRoot = (candidate: unknown): candidate is Sha256 =>
    typeof candidate === "string" &&
    /^sha256:[0-9a-f]{64}$/u.test(candidate) &&
    !/^sha256:([0-9a-f])\1{63}$/u.test(candidate)
  if (
    record.schemaVersion !== "v1.38-current-matrix-reproduction-v6" ||
    !/^[0-9a-f]{40}$/u.test(record.sourceB) ||
    !isCanonicalRoot(record.sourceBCustodyRoot) ||
    !["passed_exact", "stopped_process_failure"].includes(record.status) ||
    !isCanonicalRoot(record.executionContextRoot) ||
    !isCanonicalRoot(record.calibrationRoot) ||
    !isCanonicalRoot(record.attemptLedgerRoot) ||
    (record.acceptedCellRoot !== null &&
      !isCanonicalRoot(record.acceptedCellRoot)) ||
    record.chargedAttemptCount !== 540 ||
    record.acceptedCellCount !== (passed ? 540 : 0) ||
    (passed ? record.acceptedCellRoot === null : record.acceptedCellRoot !== null) ||
    record.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    record.partialAcceptedEvidenceReusable !== false ||
    record.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle", record.schemaVersion, body)
  ) throw new TypeError("MATRIX_REPRODUCTION_V6_INVALID")
  if (suppliedEvidence === undefined) {
    throw new TypeError("MATRIX_REPRODUCTION_V6_EVIDENCE_REQUIRED")
  }
  const expected = buildV138AuthoritativeMatrixV6Receipt({
    repoRoot: suppliedEvidence.repoRoot,
    executionContext: suppliedEvidence.executionContext,
    calibration: suppliedEvidence.calibration,
    execution: record.execution,
  })
  if (canonical(expected) !== canonical(record)) {
    throw new TypeError("MATRIX_REPRODUCTION_V6_INVALID")
  }
  return expected
}

export interface V138AuthoritativeMatrixV7Receipt {
  readonly schemaVersion: "v1.38-current-matrix-reproduction-v7"
  readonly sourceA2: string
  readonly sourceB2: string
  readonly sourceB2CustodyRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly preflightRoot: Sha256
  readonly calibrationRoot: Sha256
  readonly status: "passed_exact" | "stopped_process_failure"
  readonly chargedAttemptCount: 540
  readonly observationMode: "exact" | "unknown_after_consumption"
  readonly childLaunchCount: number | null
  readonly terminalOutcomeCount: number | null
  readonly acceptedCellCount: 0 | 540
  readonly completeCleanup: boolean
  readonly publicStopReason: V138ParallelStopReason | null
  readonly executionRoot: Sha256
  readonly planRoot: Sha256
  readonly accountingRoot: Sha256
  readonly launchRoot: Sha256
  readonly terminalRoot: Sha256
  readonly attemptLedgerRoot: Sha256
  readonly acceptedCellRoot: Sha256 | null
  readonly attempts: readonly Readonly<{
    executionAttemptId: string
    templateAttemptId: string
    shardId: string
    laneId: string
    childLaunched: boolean | null
    terminalObserved: boolean | null
    classification:
      | "success"
      | "player_violation"
      | "system_failure"
      | "timeout"
      | "cancelled"
      | "unlaunched"
      | "unknown"
    result:
      | "bottom_win"
      | "top_win"
      | "draw"
      | "PLAYER_VIOLATION"
      | "SYSTEM_FAILURE"
      | "TIMEOUT"
      | "CANCELLED"
      | null
    cleanupComplete: boolean
  }>[]
  readonly runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"
  readonly privacyProjection: "closed_public_safe_fields_only"
  readonly partialAcceptedEvidenceReusable: false
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138AuthoritativeMatrixV7Receipt = (input: {
  readonly repoRoot: string
  readonly executionContext: V138ExecutionContextV6Receipt
  readonly preflight: V138HostHeadroomPreflightV6Receipt
  readonly calibration: V138ParallelCalibrationV6Receipt
  readonly execution?: V138ParallelMatrixExecutionResult | undefined
  readonly callbackFailureAfterConsumption?: true | undefined
}): Readonly<V138AuthoritativeMatrixV7Receipt> => {
  const context = checkV138ExecutionContextV6Receipt(input.executionContext)
  const preflight = checkV138HostHeadroomPreflightV6Receipt(
    input.preflight,
    context,
  )
  const calibration = checkV138ParallelCalibrationV6Receipt(
    enumerateV138CurrentMatrix(input.repoRoot),
    input.calibration,
  )
  if (
    preflight.disposition !== "preflight_admitted" ||
    calibration.status !== "admitted" ||
    calibration.acceptedCellCount !== 8 ||
    calibration.childLaunchCount !== 8 ||
    calibration.terminalOutcomeCount !== 8 ||
    calibration.sourceB2 !== context.sourceB2 ||
    calibration.sourceB2CustodyRoot !== context.sourceB2CustodyRoot ||
    calibration.executionContextRoot !== context.receiptRoot ||
    calibration.preflightRoot !== preflight.receiptRoot
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_CALIBRATION_NOT_ADMITTED")
  }
  const inventory = enumerateV138CurrentMatrix(input.repoRoot)
  const plan = planV138MatrixShards(inventory)
  if (
    (input.execution === undefined) !==
      (input.callbackFailureAfterConsumption === true)
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_EXECUTION_INVALID")
  }
  if (input.callbackFailureAfterConsumption === true) {
    const attempts = Object.freeze(
      plan.shards.flatMap((shard) =>
        shard.attemptIds.map((templateAttemptId) =>
          Object.freeze({
            executionAttemptId: `reproduction:v6:${templateAttemptId}`,
            templateAttemptId,
            shardId: shard.shardId,
            laneId: shard.laneId,
            childLaunched: null,
            terminalObserved: null,
            classification: "unknown" as const,
            result: null,
            cleanupComplete: false,
          })
        )
      ),
    )
    const launchProjection = {
      observationMode: "unknown_after_consumption" as const,
      attempts: attempts.map(
        ({ executionAttemptId, templateAttemptId, shardId, laneId }) => ({
          executionAttemptId,
          templateAttemptId,
          shardId,
          laneId,
          childLaunched: null,
        }),
      ),
    }
    const terminalProjection = {
      observationMode: "unknown_after_consumption" as const,
      attempts: attempts.map(
        ({
          executionAttemptId,
          templateAttemptId,
          shardId,
          laneId,
          terminalObserved,
          classification,
          result,
          cleanupComplete,
        }) => ({
          executionAttemptId,
          templateAttemptId,
          shardId,
          laneId,
          terminalObserved,
          classification,
          result,
          cleanupComplete,
        }),
      ),
    }
    const accountingProjection = {
      observationMode: "unknown_after_consumption" as const,
      childLaunchCount: null,
      terminalOutcomeCount: null,
      acceptedCellCount: 0 as const,
      completeCleanup: false,
    }
    const attemptLedgerRoot = v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-attempt-ledger-v1",
      {
        calibrationRoot: calibration.receiptRoot,
        attempts,
      },
    )
    const body = {
      schemaVersion: "v1.38-current-matrix-reproduction-v7" as const,
      sourceA2: context.sourceA2,
      sourceB2: context.sourceB2,
      sourceB2CustodyRoot: context.sourceB2CustodyRoot,
      executionContextRoot: context.receiptRoot,
      preflightRoot: preflight.receiptRoot,
      calibrationRoot: calibration.receiptRoot,
      status: "stopped_process_failure" as const,
      chargedAttemptCount: 540 as const,
      observationMode: "unknown_after_consumption" as const,
      childLaunchCount: null,
      terminalOutcomeCount: null,
      acceptedCellCount: 0 as const,
      completeCleanup: false,
      publicStopReason: "PARENT_EXCEPTION" as const,
      executionRoot: v138SuccessorRoot(
        "evidenceBundle",
        "v1.38-parallel-matrix-execution-v1",
        {
          observationMode: "unknown_after_consumption" as const,
          status: "stopped_process_failure" as const,
          reason: "PARENT_EXCEPTION" as const,
          calibrationRoot: calibration.supervisionRoot,
          planRoot: plan.planRoot,
          attempts,
        },
      ),
      planRoot: plan.planRoot,
      accountingRoot: v138SuccessorRoot(
        "evidenceBundle",
        "v1.38-current-matrix-reproduction-v7-accounting-v1",
        accountingProjection,
      ),
      launchRoot: v138SuccessorRoot(
        "evidenceBundle",
        "v1.38-current-matrix-reproduction-v7-launch-v1",
        launchProjection,
      ),
      terminalRoot: v138SuccessorRoot(
        "evidenceBundle",
        "v1.38-current-matrix-reproduction-v7-terminal-v1",
        terminalProjection,
      ),
      attemptLedgerRoot,
      acceptedCellRoot: null,
      attempts,
      runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
      privacyProjection: "closed_public_safe_fields_only" as const,
      partialAcceptedEvidenceReusable: false as const,
      noRetry: true as const,
    }
    return deepFreeze({
      ...body,
      receiptRoot: v138SuccessorRoot("evidenceBundle", body.schemaVersion, body),
    })
  }
  const execution = input.execution
  if (
    execution === undefined ||
    execution.calibrationRoot !== calibration.supervisionRoot
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_CALIBRATION_NOT_ADMITTED")
  }
  const expectedExecutionIds = plan.shards.flatMap(({ attemptIds }) =>
    attemptIds.map((attemptId) => `reproduction:v6:${attemptId}`),
  )
  const canonicalLaunchEvents = execution.launchEvents.map((event) => ({
    ...event,
    executionAttemptIds: event.executionAttemptIds.map((attemptId) =>
      attemptId.replace(/^reproduction:v6:/u, ""),
    ),
  }))
  const canonicalTerminals = execution.terminals.map((terminal) => ({
    ...terminal,
    outcomes: terminal.outcomes.map((outcome) => ({
      ...outcome,
      attemptId: outcome.attemptId.replace(/^reproduction:v6:/u, ""),
    })),
  }))
  const unlaunchedShardIds = plan.shards
    .filter(
      ({ shardId }) =>
        !execution.launchEvents.some(
          (event) => event.shardId === shardId,
        ),
    )
    .map(({ shardId }) => shardId)
  const recomputedAccounting = reduceV138ParallelMatrixAccounting({
    inventory,
    plan,
    terminals: canonicalTerminals,
    launchEvents: canonicalLaunchEvents,
    unlaunchedShardIds,
  })
  const launchedAttemptIds = execution.launchEvents.flatMap(
    ({ executionAttemptIds }) => executionAttemptIds,
  )
  const terminalOutcomeCount = execution.terminals.reduce(
    (count, { outcomes }) => count + outcomes.length,
    0,
  )
  const launchedShardIds = new Set(
    execution.launchEvents.map(({ shardId }) => shardId),
  )
  const terminalByShardId = new Map(
    execution.terminals.map((terminal) => [terminal.shardId, terminal]),
  )
  const completeCleanup =
    [...launchedShardIds].every((shardId) => {
      const terminal = terminalByShardId.get(shardId)
      return (
        terminal !== undefined &&
        terminal.cleanup.exitAwaited &&
        terminal.cleanup.orphanProcessIds.length === 0
      )
    }) &&
    execution.terminals.every(({ shardId }) =>
      launchedShardIds.has(shardId),
    )
  const terminalOutcomes = execution.terminals.flatMap(
    ({ outcomes }) => outcomes,
  )
  const expectedCanonicalOutcomes = plan.shards.flatMap((shard) => {
    const terminal = execution.terminals.find(
      ({ shardId }) => shardId === shard.shardId,
    )
    const byId = new Map(
      terminal?.outcomes.map((outcome) => [outcome.attemptId, outcome]) ?? [],
    )
    return shard.attemptIds.flatMap((attemptId) => {
      const outcome = byId.get(`reproduction:v6:${attemptId}`)
      return outcome === undefined ? [] : [outcome]
    })
  })
  const allSuccessful =
    terminalOutcomes.length === 540 &&
    terminalOutcomes.every(
      ({ classification }) => classification === "success",
    )
  const structuralValid =
    execution.planRoot === plan.planRoot &&
    canonical(execution.accounting) === canonical(recomputedAccounting) &&
    canonical(execution.canonicalOutcomes) ===
      canonical(expectedCanonicalOutcomes) &&
    launchedAttemptIds.length === new Set(launchedAttemptIds).size &&
    launchedAttemptIds.every((attemptId) =>
      expectedExecutionIds.includes(attemptId)
    ) &&
    terminalOutcomeCount === recomputedAccounting.terminalAttemptCount
  const exactComplete =
    structuralValid &&
    execution.terminals.length === plan.shards.length &&
    canonical(
      execution.terminals.map(({ shardId, laneId }) => ({
      shardId,
      laneId,
      })),
    ) ===
      canonical(
        plan.shards.map(({ shardId, laneId }) => ({ shardId, laneId })),
      ) &&
    launchedAttemptIds.length === 540 &&
    new Set(launchedAttemptIds).size === 540 &&
    canonical(launchedAttemptIds) === canonical(expectedExecutionIds) &&
    terminalOutcomeCount === 540 &&
    recomputedAccounting.launchedAttemptCount === 540 &&
    recomputedAccounting.terminalAttemptCount === 540 &&
    recomputedAccounting.unlaunchedAttemptCount === 0 &&
    allSuccessful &&
    completeCleanup
  if (
    !structuralValid ||
    (execution.status === "complete_pending_publication") !==
      exactComplete ||
    (exactComplete
      ? execution.reason !== null
      : execution.reason === null)
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_EXECUTION_INVALID")
  }
  const canonicalOutcomes = expectedCanonicalOutcomes.map((outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v6:/u, ""),
  })) as V138CurrentMatrixAttemptOutcome[]
  const canonicalReceipt = exactComplete
      ? reduceV138CurrentMatrix(inventory, canonicalOutcomes)
      : null
  const passed = canonicalReceipt !== null
  const launchByShard = new Map(
    execution.launchEvents.map((event) => [event.shardId, event]),
  )
  const terminalByShard = new Map(
    execution.terminals.map((terminal) => [terminal.shardId, terminal]),
  )
  const attempts = Object.freeze(
    plan.shards.flatMap((shard) => {
      const launch = launchByShard.get(shard.shardId)
      const terminal = terminalByShard.get(shard.shardId)
      const outcomeById = new Map(
        terminal?.outcomes.map((outcome) => [outcome.attemptId, outcome]) ?? [],
      )
      return shard.attemptIds.map((templateAttemptId) => {
        const executionAttemptId = `reproduction:v6:${templateAttemptId}`
        const outcome = outcomeById.get(executionAttemptId)
        return Object.freeze({
          executionAttemptId,
          templateAttemptId,
          shardId: shard.shardId,
          laneId: shard.laneId,
          childLaunched:
            launch?.executionAttemptIds.includes(executionAttemptId) ?? false,
          terminalObserved: outcome !== undefined,
          classification: outcome?.classification ?? ("unlaunched" as const),
          result:
            outcome === undefined
            ? null
            : outcome.classification === "success"
              ? outcome.outcome
              : outcome.classification === "player_violation"
                  ? ("PLAYER_VIOLATION" as const)
                : outcome.classification === "system_failure"
                    ? ("SYSTEM_FAILURE" as const)
                  : outcome.classification === "timeout"
                      ? ("TIMEOUT" as const)
                      : ("CANCELLED" as const),
          cleanupComplete:
            terminal !== undefined &&
            terminal.cleanup.exitAwaited &&
            terminal.cleanup.orphanProcessIds.length === 0,
        })
      })
    }),
  )
  const launchProjection = {
    observationMode: "exact" as const,
    events: attempts
      .filter(({ childLaunched }) => childLaunched)
      .map(({ executionAttemptId, templateAttemptId, shardId, laneId }) => ({
        executionAttemptId, templateAttemptId, shardId, laneId,
      })),
  }
  const terminalProjection = {
    observationMode: "exact" as const,
    outcomes: attempts
      .filter(({ terminalObserved }) => terminalObserved)
      .map(
      ({
        executionAttemptId,
        templateAttemptId,
        shardId,
        laneId,
        classification,
        result,
        cleanupComplete,
    }) => ({
        executionAttemptId,
        templateAttemptId,
        shardId,
        laneId,
        classification,
        result,
        cleanupComplete,
      }),
      ),
  }
  const accountingProjection = {
    observationMode: "exact" as const,
    childLaunchCount: launchProjection.events.length,
    terminalOutcomeCount: terminalProjection.outcomes.length,
    acceptedCellCount: passed ? 540 : 0,
    completeCleanup,
  }
  const attemptLedgerRoot = v138SuccessorRoot(
    "evidenceBundle",
    "v1.38-current-matrix-reproduction-v7-attempt-ledger-v1",
    {
      calibrationRoot: calibration.receiptRoot,
      attempts,
    },
  )
  const body = {
    schemaVersion: "v1.38-current-matrix-reproduction-v7" as const,
    sourceA2: context.sourceA2,
    sourceB2: context.sourceB2,
    sourceB2CustodyRoot: context.sourceB2CustodyRoot,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot,
    calibrationRoot: calibration.receiptRoot,
    status: passed
      ? "passed_exact" as const
      : "stopped_process_failure" as const,
    chargedAttemptCount: 540 as const,
    observationMode: "exact" as const,
    childLaunchCount: launchedAttemptIds.length,
    terminalOutcomeCount,
    acceptedCellCount: passed ? 540 as const : 0 as const,
    completeCleanup,
    publicStopReason: execution.reason,
    executionRoot: v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-parallel-matrix-execution-v1",
      {
        observationMode: "exact" as const,
        status: execution.status,
        reason: execution.reason,
        calibrationRoot: execution.calibrationRoot,
        planRoot: execution.planRoot,
        attempts,
      },
    ),
    planRoot: execution.planRoot,
    accountingRoot: v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-accounting-v1",
      accountingProjection,
    ),
    launchRoot: v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-launch-v1",
      launchProjection,
    ),
    terminalRoot: v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-terminal-v1",
      terminalProjection,
    ),
    attemptLedgerRoot,
    acceptedCellRoot: canonicalReceipt?.acceptedCellLedgerRoot ?? null,
    attempts,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    privacyProjection: "closed_public_safe_fields_only" as const,
    partialAcceptedEvidenceReusable: false as const,
    noRetry: true as const,
  }
  return deepFreeze({
    ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle", body.schemaVersion, body),
  })
}

export const checkV138AuthoritativeMatrixV7Receipt = (
  value: unknown,
  evidence: Readonly<{
    repoRoot: string
    executionContext: V138ExecutionContextV6Receipt
    preflight: V138HostHeadroomPreflightV6Receipt
    calibration: V138ParallelCalibrationV6Receipt
  }>,
): Readonly<V138AuthoritativeMatrixV7Receipt> => {
  const receipt = exactRecord(
    value,
    [
      "schemaVersion", "sourceA2", "sourceB2", "sourceB2CustodyRoot",
      "executionContextRoot", "preflightRoot", "calibrationRoot", "status",
      "chargedAttemptCount", "observationMode", "childLaunchCount",
      "terminalOutcomeCount",
      "acceptedCellCount", "completeCleanup", "publicStopReason",
      "executionRoot", "planRoot", "accountingRoot", "launchRoot",
      "terminalRoot", "attemptLedgerRoot", "acceptedCellRoot",
      "attempts",
      "runtimeRoute", "privacyProjection",
      "partialAcceptedEvidenceReusable", "noRetry", "receiptRoot",
    ],
    "MATRIX_REPRODUCTION_V7_INVALID",
  ) as unknown as V138AuthoritativeMatrixV7Receipt
  const context = checkV138ExecutionContextV6Receipt(evidence.executionContext)
  const preflight = checkV138HostHeadroomPreflightV6Receipt(
    evidence.preflight,
    context,
  )
  const calibration = checkV138ParallelCalibrationV6Receipt(
    enumerateV138CurrentMatrix(evidence.repoRoot),
    evidence.calibration,
  )
  const expectedPlan = planV138MatrixShards(
    enumerateV138CurrentMatrix(evidence.repoRoot),
  )
  const expectedAttempts = expectedPlan.shards.flatMap((shard) =>
    shard.attemptIds.map((templateAttemptId) => ({
      executionAttemptId: `reproduction:v6:${templateAttemptId}`,
      templateAttemptId,
      shardId: shard.shardId,
      laneId: shard.laneId,
    }))
  )
  const attemptProjectionValid =
    receipt.attempts.length === 540 &&
    receipt.attempts.every((attempt, ordinal) => {
      const expected = expectedAttempts[ordinal]!
      return (
        canonical(Object.keys(attempt)) ===
          canonical([
            "executionAttemptId",
            "templateAttemptId",
            "shardId",
            "laneId",
            "childLaunched",
            "terminalObserved",
            "classification",
            "result",
          "cleanupComplete",
        ]) &&
        attempt.executionAttemptId === expected.executionAttemptId &&
        attempt.templateAttemptId === expected.templateAttemptId &&
        attempt.shardId === expected.shardId &&
        attempt.laneId === expected.laneId &&
        (typeof attempt.childLaunched === "boolean" ||
          attempt.childLaunched === null) &&
        (typeof attempt.terminalObserved === "boolean" ||
          attempt.terminalObserved === null) &&
        typeof attempt.cleanupComplete === "boolean" &&
        ["success", "player_violation", "system_failure", "timeout",
          "cancelled", "unlaunched", "unknown"].includes(
            attempt.classification,
          ) &&
        (attempt.classification === "unknown"
          ? attempt.result === null &&
            attempt.childLaunched === null &&
            attempt.terminalObserved === null &&
            attempt.cleanupComplete === false
          : attempt.classification === "unlaunched"
          ? attempt.result === null && attempt.terminalObserved === false
          : attempt.classification === "success"
            ? ["bottom_win", "top_win", "draw"].includes(attempt.result ?? "") &&
              attempt.terminalObserved === true
            : attempt.result === (
                attempt.classification === "player_violation"
                  ? "PLAYER_VIOLATION"
                  : attempt.classification === "system_failure"
                    ? "SYSTEM_FAILURE"
                    : attempt.classification === "timeout"
                      ? "TIMEOUT"
                      : "CANCELLED"
              ) &&
              attempt.terminalObserved === true) &&
        (!attempt.terminalObserved ? attempt.cleanupComplete === false : true)
      )
    })
  const exactLaunchEvents = receipt.attempts
    .filter(({ childLaunched }) => childLaunched === true)
    .map(({ executionAttemptId, templateAttemptId, shardId, laneId }) => ({
      executionAttemptId, templateAttemptId, shardId, laneId,
    }))
  const exactTerminalOutcomes = receipt.attempts
    .filter(({ terminalObserved }) => terminalObserved === true)
    .map(
      ({
        executionAttemptId,
        templateAttemptId,
        shardId,
        laneId,
        classification,
        result,
        cleanupComplete,
    }) => ({
        executionAttemptId,
        templateAttemptId,
        shardId,
        laneId,
        classification,
        result,
        cleanupComplete,
      }),
    )
  const launchProjection =
    receipt.observationMode === "exact"
      ? {
          observationMode: "exact" as const,
          events: exactLaunchEvents,
        }
      : {
          observationMode: "unknown_after_consumption" as const,
          attempts: receipt.attempts.map(
            ({
              executionAttemptId,
              templateAttemptId,
              shardId,
              laneId,
              childLaunched,
            }) => ({
              executionAttemptId,
              templateAttemptId,
              shardId,
              laneId,
              childLaunched,
            }),
          ),
        }
  const terminalProjection =
    receipt.observationMode === "exact"
      ? {
          observationMode: "exact" as const,
          outcomes: exactTerminalOutcomes,
        }
      : {
          observationMode: "unknown_after_consumption" as const,
          attempts: receipt.attempts.map(
            ({
              executionAttemptId,
              templateAttemptId,
              shardId,
              laneId,
              terminalObserved,
              classification,
              result,
              cleanupComplete,
            }) => ({
              executionAttemptId,
              templateAttemptId,
              shardId,
              laneId,
              terminalObserved,
              classification,
              result,
              cleanupComplete,
            }),
          ),
        }
  const derivedCleanup =
    receipt.observationMode === "exact" &&
    receipt.attempts.every(
      ({ childLaunched, terminalObserved, cleanupComplete }) =>
        childLaunched !== true ||
        (terminalObserved === true && cleanupComplete),
    ) &&
    receipt.attempts.every(
      ({ childLaunched, terminalObserved }) =>
        terminalObserved !== true || childLaunched === true,
    )
  const derivedPassed = receipt.attempts.every(
      ({
      childLaunched,
      terminalObserved,
      classification,
      result,
        cleanupComplete,
      }) =>
        childLaunched === true &&
        terminalObserved === true &&
        classification === "success" &&
        ["bottom_win", "top_win", "draw"].includes(result ?? "") &&
        cleanupComplete,
    )
  const publicOutcomes = derivedPassed
    ? receipt.attempts.map(({ templateAttemptId, result }) => ({
        attemptId: templateAttemptId,
        classification: "success" as const,
        outcome: result as "bottom_win" | "top_win" | "draw",
      }))
    : []
  const acceptedReceipt = derivedPassed
    ? reduceV138CurrentMatrix(
        enumerateV138CurrentMatrix(evidence.repoRoot),
        publicOutcomes,
      )
    : null
  const accountingProjection = {
    observationMode: receipt.observationMode,
    childLaunchCount:
      receipt.observationMode === "exact" ? exactLaunchEvents.length : null,
    terminalOutcomeCount:
      receipt.observationMode === "exact" ? exactTerminalOutcomes.length : null,
    acceptedCellCount: derivedPassed ? 540 : 0,
    completeCleanup: derivedCleanup,
  }
  const expectedExecutionRoot = v138SuccessorRoot(
    "evidenceBundle",
    "v1.38-parallel-matrix-execution-v1",
    {
      observationMode: receipt.observationMode,
      status:
        receipt.status === "passed_exact"
        ? "complete_pending_publication"
        : "stopped_process_failure",
      reason: receipt.publicStopReason,
      calibrationRoot: calibration.supervisionRoot,
      planRoot: receipt.planRoot,
      attempts: receipt.attempts,
    },
  )
  const { receiptRoot: _root, ...body } = receipt
  const roots = [
    receipt.sourceB2CustodyRoot,
    receipt.executionContextRoot,
    receipt.preflightRoot,
    receipt.calibrationRoot,
    receipt.executionRoot,
    receipt.planRoot,
    receipt.accountingRoot,
    receipt.launchRoot,
    receipt.terminalRoot,
    receipt.attemptLedgerRoot,
  ]
  if (
    receipt.schemaVersion !== "v1.38-current-matrix-reproduction-v7" ||
    receipt.sourceA2 !== context.sourceA2 ||
    receipt.sourceB2 !== context.sourceB2 ||
    receipt.sourceB2CustodyRoot !== context.sourceB2CustodyRoot ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receipt.calibrationRoot !== calibration.receiptRoot ||
    receipt.planRoot !== expectedPlan.planRoot ||
    !attemptProjectionValid ||
    preflight.disposition !== "preflight_admitted" ||
    calibration.status !== "admitted" ||
    roots.some((root) => !/^sha256:[0-9a-f]{64}$/u.test(root)) ||
    receipt.chargedAttemptCount !== 540 ||
    !["exact", "unknown_after_consumption"].includes(
      receipt.observationMode,
    ) ||
    (receipt.observationMode === "exact"
      ? !Number.isSafeInteger(receipt.childLaunchCount) ||
        !Number.isSafeInteger(receipt.terminalOutcomeCount) ||
        receipt.childLaunchCount! < 0 ||
        receipt.childLaunchCount! > 540 ||
        receipt.terminalOutcomeCount! < 0 ||
        receipt.terminalOutcomeCount! > 540
      : receipt.childLaunchCount !== null ||
        receipt.terminalOutcomeCount !== null ||
        receipt.attempts.some(
          ({
            childLaunched,
            terminalObserved,
            classification,
            result,
            cleanupComplete,
          }) =>
            childLaunched !== null ||
            terminalObserved !== null ||
            classification !== "unknown" ||
            result !== null ||
            cleanupComplete !== false,
        )) ||
    typeof receipt.completeCleanup !== "boolean" ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.privacyProjection !== "closed_public_safe_fields_only" ||
    receipt.partialAcceptedEvidenceReusable !== false ||
    receipt.noRetry !== true ||
    (receipt.publicStopReason !== null &&
      !V138_PUBLIC_STOP_REASONS.has(receipt.publicStopReason)) ||
    (receipt.observationMode === "exact" &&
      (receipt.childLaunchCount !== exactLaunchEvents.length ||
        receipt.terminalOutcomeCount !== exactTerminalOutcomes.length)) ||
    receipt.completeCleanup !== derivedCleanup ||
    receipt.executionRoot !== expectedExecutionRoot ||
    receipt.accountingRoot !==
      v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-accounting-v1",
      accountingProjection,
    ) ||
    receipt.launchRoot !==
      v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-launch-v1",
      launchProjection,
    ) ||
    receipt.terminalRoot !==
      v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-terminal-v1",
      terminalProjection,
    ) ||
    receipt.attemptLedgerRoot !==
      v138SuccessorRoot(
      "evidenceBundle",
      "v1.38-current-matrix-reproduction-v7-attempt-ledger-v1",
        {
          calibrationRoot: calibration.receiptRoot,
          attempts: receipt.attempts,
        },
    ) ||
    receipt.acceptedCellRoot !==
      (acceptedReceipt?.acceptedCellLedgerRoot ?? null) ||
    (receipt.status === "passed_exact"
      ? receipt.observationMode !== "exact" ||
        receipt.childLaunchCount !== 540 ||
        receipt.terminalOutcomeCount !== 540 ||
        receipt.acceptedCellCount !== 540 ||
        receipt.completeCleanup !== true ||
        receipt.publicStopReason !== null ||
        !derivedPassed ||
        !/^sha256:[0-9a-f]{64}$/u.test(receipt.acceptedCellRoot ?? "")
      : receipt.status !== "stopped_process_failure" ||
        receipt.acceptedCellCount !== 0 ||
        receipt.publicStopReason === null ||
        derivedPassed ||
        receipt.acceptedCellRoot !== null ||
        (receipt.observationMode === "unknown_after_consumption" &&
          (receipt.publicStopReason !== "PARENT_EXCEPTION" ||
            receipt.completeCleanup !== false))) ||
    receipt.receiptRoot !==
      v138SuccessorRoot("evidenceBundle", receipt.schemaVersion, body)
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_INVALID")
  }
  return deepFreeze(receipt)
}

const executeOwnedMemoryPressureQ = async (
  request: typeof MEMORY_PRESSURE_Q_REQUEST,
): Promise<MemoryPressureQCommandResult> =>
  await new Promise((resolve) => {
    let timedOut = false
    const child = execFile(
      request.executable,
      [...request.args],
      {
        encoding: "buffer",
        env: { ...request.env },
        timeout: request.timeoutMilliseconds,
        maxBuffer: request.maximumOutputBytes,
        shell: request.shell,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        const processError = error as
          | (NodeJS.ErrnoException & { killed?: boolean; signal?: NodeJS.Signals })
          | null
        timedOut =
          timedOut ||
          processError?.killed === true ||
          processError?.code === "ETIMEDOUT"
        resolve({
          stdout: Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout),
          stderr: Buffer.isBuffer(stderr) ? stderr : Buffer.from(stderr),
          exitCode:
            processError === null
            ? 0
            : typeof child.exitCode === "number"
              ? child.exitCode
              : null,
          signal: child.signalCode ?? processError?.signal ?? null,
          timedOut,
        })
      },
    )
    child.once("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ETIMEDOUT") timedOut = true
    })
  })

const checkV138ExecutionContextSealJoin = (input: {
  context: Readonly<V138ExecutionContextV5Receipt>
  authorization: Readonly<V138Plan26215Authorization>
  seal: Readonly<V138SuccessorSourceSeal>
  sourceBCustody: Readonly<V138SourceBCustody>
  failureCode: string
}): void => {
  if (
    input.context.authorizationRoot !== input.authorization.authorizationRoot ||
    input.context.sealRoot !== input.seal.sealRoot ||
    input.context.sourceA !== input.authorization.sourceA ||
    input.context.sourceB !== input.sourceBCustody.sourceB ||
    input.context.sourceBCustodyRoot !== input.sourceBCustody.custodyRoot ||
    input.context.selectedRouteClosureRoot !==
      input.seal.selectedRouteClosure.closureRoot ||
    input.context.frozenPolicyRoot !==
      v138SuccessorRoot(
        "budgetProfile",
        "v1.38-current-matrix-frozen-policy-v5",
        input.seal.frozenPolicy,
      ) ||
    input.context.toolIdentityRoot !==
      v138SuccessorRoot(
        "artifactManifest",
        "v1.38-current-matrix-tool-identity-v5",
        input.seal.toolIdentity,
      ) ||
    input.context.hostIdentityRoot !==
      v138SuccessorRoot(
        "containmentPolicy",
        "v1.38-current-matrix-host-identity-v5",
        input.seal.hostIdentity,
      )
  ) throw new TypeError(input.failureCode)
}

const checkedV138AuthorizationSealRoutes = new Map<
  string,
  Readonly<{
    authorization: Readonly<V138Plan26215Authorization>
    seal: Readonly<V138SuccessorSourceSeal>
  }>
>()

const checkV138AuthorizationSealRoute = (input: {
  repoRoot: string
  authorizationValue: unknown
  sealValue: unknown
  sourceBCustody: Readonly<V138SourceBCustody>
  failureCode: string
}) => {
  const key = `${path.resolve(input.repoRoot)}\0${input.sourceBCustody.sourceA}\0${input.sourceBCustody.sourceB}`
  const cached = checkedV138AuthorizationSealRoutes.get(key)
  if (cached !== undefined) {
    if (
      !Buffer.from(v138SuccessorCanonicalBytes(input.authorizationValue)).equals(
        Buffer.from(v138SuccessorCanonicalBytes(cached.authorization)),
      ) ||
      !Buffer.from(v138SuccessorCanonicalBytes(input.sealValue)).equals(
        Buffer.from(v138SuccessorCanonicalBytes(cached.seal)),
      )
    ) throw new TypeError(input.failureCode)
    return cached
  }
  const authorization = checkV138Plan26215Authorization(
    input.repoRoot,
    input.authorizationValue,
  )
  if (authorization.sourceA !== input.sourceBCustody.sourceA) {
    throw new TypeError(input.failureCode)
  }
  const seal = checkV138SuccessorSourceSeal(
    input.repoRoot,
    input.sealValue,
    authorization,
  )
  const checked = Object.freeze({ authorization, seal })
  checkedV138AuthorizationSealRoutes.set(key, checked)
  return checked
}

const checkV138LiveWriterContextRoute = (input: {
  repoRoot: string
  executionContextPath: string
  authorizationPath: string
  sealPath: string
  sourceA: string
  sourceB: string
  failureCode: string
}) => {
  const sourceBCustody = checkV138SuccessorSealCommit(input)
  const authorizationValue = plan26216Read(
    plan26216Path(input.repoRoot, input.authorizationPath, "authorization"),
    true,
  )!.value
  const sealValue = plan26216Read(
    plan26216Path(input.repoRoot, input.sealPath, "seal"),
    true,
  )!.value
  const { authorization, seal } = checkV138AuthorizationSealRoute({
    repoRoot: input.repoRoot,
    authorizationValue,
    sealValue,
    sourceBCustody,
    failureCode: input.failureCode,
  })
  const context = checkV138ExecutionContextV5Receipt(
    plan26216Read(
      plan26216Path(input.repoRoot, input.executionContextPath, "context"),
      true,
    )!.value,
    sourceBCustody,
  )
  checkV138ExecutionContextSealJoin({
    context,
    authorization,
    seal,
    sourceBCustody,
    failureCode: input.failureCode,
  })
  return { sourceBCustody, authorization, seal, context }
}

const checkV138LiveWriterPreflightRoute = (input: {
  preflightValue: unknown
  route: ReturnType<typeof checkV138LiveWriterContextRoute>
  failureCode: string
}) => {
  const preflight = checkV138HostHeadroomPreflightV5Receipt(
    input.preflightValue,
  )
  if (
    preflight.authorizationRoot !== input.route.authorization.authorizationRoot ||
    preflight.sealRoot !== input.route.seal.sealRoot ||
    preflight.executionContextRoot !== input.route.context.receiptRoot ||
    preflight.sourceB !== input.route.sourceBCustody.sourceB ||
    preflight.sourceBCustodyRoot !== input.route.sourceBCustody.custodyRoot
  ) throw new TypeError(input.failureCode)
  return preflight
}

const checkV138LiveWriterCalibrationRoute = (input: {
  repoRoot: string
  calibrationValue: unknown
  route: ReturnType<typeof checkV138LiveWriterContextRoute>
  preflight: Readonly<V138HostHeadroomPreflightV5Receipt>
  failureCode: string
}) => {
  const calibration = checkV138ParallelCalibrationV5Receipt(
    input.calibrationValue,
    input.repoRoot,
  )
  if (
    input.preflight.disposition !== "preflight_admitted" ||
    calibration.status !== "admitted" ||
    calibration.preflightRoot !== input.preflight.receiptRoot ||
    calibration.executionContextRoot !== input.route.context.receiptRoot ||
    calibration.sourceB !== input.route.sourceBCustody.sourceB ||
    calibration.sourceBCustodyRoot !== input.route.sourceBCustody.custodyRoot ||
    calibration.supervisedCalibration === null
  ) throw new TypeError(input.failureCode)
  return calibration
}

export const writeV138ExecutionContextV5Receipt = (
  repoRoot: string,
  targetPath: string,
  mode: string,
  cwd: string,
  terminalAgentRegistry: unknown,
  authorizationPath: string,
  sealPath: string,
  sourceA: string,
  sourceB: string,
): Readonly<V138ExecutionContextV5Receipt> => {
  assertV138Plan26216AuthorityOpen(repoRoot)
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  const target = plan26216Path(repoRoot, targetPath, "context")
  const authorizationArtifact = plan26216Read(
    plan26216Path(repoRoot, authorizationPath, "authorization"),
    true,
  )!
  const authorization = checkV138Plan26215Authorization(
    repoRoot,
    authorizationArtifact.value,
  )
  const seal = checkV138SuccessorSourceSeal(
    repoRoot,
    plan26216Read(plan26216Path(repoRoot, sealPath, "seal"), true)!.value,
    authorization,
  )
  const receipt = buildV138ExecutionContextV5Receipt({
    repoRoot,
    authorization,
    seal,
    mode: mode as V138ExecutionContextV5Receipt["mode"],
    cwd: cwd as V138ExecutionContextV5Receipt["cwd"],
    terminalAgentRegistry:
      terminalAgentRegistry as V138ExecutionContextV5Receipt["terminalAgentRegistry"],
    sourceBCustody,
  })
  writeV138ImmutableReceipt(target, receipt)
  return receipt
}

export const writeV138HostHeadroomPreflightV5Receipt = async (
  repoRoot: string,
  targetPath: string,
  executionContextPath: string,
  authorizationPath: string,
  sealPath: string,
  sourceA: string,
  sourceB: string,
  observeHeadroom: () => Promise<V138DarwinHeadroomResult> = () =>
    observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
): Promise<Readonly<V138HostHeadroomPreflightV5Receipt>> => {
  assertV138Plan26216AuthorityOpen(repoRoot)
  const target = plan26216Path(repoRoot, targetPath, "preflight")
  assertV138FreshImmutableTarget(target)
  const route = checkV138LiveWriterContextRoute({
    repoRoot,
    executionContextPath,
    authorizationPath,
    sealPath,
    sourceA,
    sourceB,
    failureCode: "MATRIX_PREFLIGHT_V5_CONTEXT_JOIN_INVALID",
  })
  const receipt = buildV138HostHeadroomPreflightV5Receipt({
    result: await observeHeadroom(),
    executionContext: route.context,
  })
  writeV138ImmutableReceipt(target, receipt)
  return receipt
}

export const writeV138ParallelCalibrationV5Receipt = async (
  repoRoot: string,
  targetPath: string,
  preflightPath: string,
  executionContextPath: string,
  sourceA: string,
  sourceB: string,
  runCalibration: typeof calibrateV138ParallelMatrix =
    calibrateV138ParallelMatrix,
): Promise<Readonly<Record<string, unknown>>> => {
  assertV138Plan26216AuthorityOpen(repoRoot)
  const target = plan26216Path(repoRoot, targetPath, "calibration")
  assertV138FreshImmutableTarget(target)
  const route = checkV138LiveWriterContextRoute({
    repoRoot,
    executionContextPath,
    authorizationPath: PLAN_262_16_PATHS.authorization,
    sealPath: PLAN_262_16_PATHS.seal,
    sourceA,
    sourceB,
    failureCode: "MATRIX_CALIBRATION_V5_CONTEXT_JOIN_INVALID",
  })
  const preflight = checkV138LiveWriterPreflightRoute({
    preflightValue: plan26216Read(
      plan26216Path(repoRoot, preflightPath, "preflight"),
      true,
    )!.value,
    route,
    failureCode: "MATRIX_CALIBRATION_V5_CONTEXT_JOIN_INVALID",
  })
  let receipt: Readonly<Record<string, unknown>>
  if (preflight.disposition !== "preflight_admitted") {
    receipt = buildV138ParallelCalibrationV5PreflightTerminal(preflight)
  } else {
    const calibration = await runCalibration({
      inventory: enumerateV138CurrentMatrix(repoRoot),
      runner: createV138SubprocessShardRunner(repoRoot, {
        useLegacyHostMemory: false,
      }),
      sharedHeadroomObserver: () =>
        observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
      hardwareIdentity: {
        operatingSystem: `${platform()} ${release()}`,
        architecture: arch(),
        nodeVersion: process.version,
        cpuIdentity: cpus()[0]?.model ?? "unavailable",
      },
      repoRoot,
      executionIdentityVersion: "v5",
    })
    const outcomes = calibration.terminals
      .flatMap((terminal) => terminal.outcomes)
      .sort((left, right) => left.attemptId.localeCompare(right.attemptId))
    const attempts = Array.from({ length: 8 }, (_, index) => {
      const outcome = outcomes.find(
        (candidate) => candidate.attemptId === `calibration:v5:${index}`,
      )
      return {
        attemptId: `calibration:v5:${index}`,
        shardId: `calibration-shard:${index % 4}`,
        outcome:
          outcome === undefined
            ? ("unfilled" as const)
          : outcome.classification === "success"
              ? ("accepted" as const)
            : outcome.classification,
        childLaunched: outcome !== undefined,
        accepted: outcome?.classification === "success",
      }
    })
    receipt = buildV138ParallelCalibrationV5Receipt({
      preflight,
      attempts,
      sharedObservationTicks: calibration.sharedObservationTicks ?? [],
      supervisedCalibration: calibration,
    })
  }
  writeV138ImmutableReceipt(target, receipt)
  return receipt
}

export const writeV138AuthoritativeMatrixV6Receipt = async (
  repoRoot: string,
  targetPath: string,
  calibrationPath: string,
  executionContextPath: string,
  sourceA: string,
  sourceB: string,
  runReproduction: typeof executeV138ParallelMatrix =
    executeV138ParallelMatrix,
): Promise<Readonly<V138AuthoritativeMatrixV6Receipt>> => {
  assertV138Plan26216AuthorityOpen(repoRoot)
  const target = plan26216Path(repoRoot, targetPath, "reproduction")
  assertV138FreshImmutableTarget(target)
  const route = checkV138LiveWriterContextRoute({
    repoRoot,
    executionContextPath,
    authorizationPath: PLAN_262_16_PATHS.authorization,
    sealPath: PLAN_262_16_PATHS.seal,
    sourceA,
    sourceB,
    failureCode: "MATRIX_REPRODUCTION_V6_CONTEXT_JOIN_INVALID",
  })
  const preflight = checkV138LiveWriterPreflightRoute({
    preflightValue: plan26216Read(
      plan26216Path(repoRoot, PLAN_262_16_PATHS.preflight, "preflight"),
      true,
    )!.value,
    route,
    failureCode: "MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED",
  })
  const calibration = checkV138LiveWriterCalibrationRoute({
    repoRoot,
    calibrationValue: plan26216Read(
      plan26216Path(repoRoot, calibrationPath, "calibration"),
      true,
    )!.value,
    route,
    preflight,
    failureCode: "MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED",
  })
  const execution = await runReproduction({
    inventory: enumerateV138CurrentMatrix(repoRoot),
    calibration:
      calibration.supervisedCalibration as V138ParallelCalibrationReceipt,
    runner: createV138SubprocessShardRunner(repoRoot, {
      useLegacyHostMemory: false,
    }),
    sharedHeadroomObserver: () =>
      observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
    repoRoot,
    executionIdentityVersion: "v5",
  })
  const built = buildV138AuthoritativeMatrixV6Receipt({
    repoRoot,
    executionContext: route.context,
    calibration,
    execution,
  })
  const receipt = checkV138AuthoritativeMatrixV6Receipt(built, {
    repoRoot,
    executionContext: route.context,
    calibration,
  })
  writeV138ImmutableReceipt(target, receipt)
  return receipt
}

export type V138Plan26216TerminalDisposition =
  | "tool_identity_failed"
  | "protected_history_failed"
  | "formation_absence_failed"
  | "pattern_c_ownership_failed"
  | "preflight_unavailable"
  | "preflight_refused"
  | "calibration_stopped"
  | "reproduction_stopped"
  | "reproduction_passed"

const PLAN_262_16_PATHS = {
  authorization: ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v1.json",
  context: ".planning/artifacts/v1.38-current-matrix-execution-context-v5.json",
  preflight: ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v5.json",
  calibration: ".planning/artifacts/v1.38-current-matrix-calibration-v5.json",
  reproduction: ".planning/artifacts/v1.38-current-matrix-reproduction-v6.json",
  terminal: ".planning/artifacts/v1.38-plan-262-16-terminal-v1.json",
} as const

const assertV138Plan26216AuthorityOpen = (repoRoot: string): void =>
  assertV138TerminalAuthorityOpen(
    repoRoot,
    [PLAN_262_16_PATHS.terminal],
    "MATRIX_PLAN_262_16_AUTHORITY_EXPIRED",
  )

type Plan26216Paths = Readonly<Record<keyof typeof PLAN_262_16_PATHS, string>>

const plan26216Path = (
  repoRoot: string,
  supplied: string,
  key: keyof typeof PLAN_262_16_PATHS,
): string => {
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, PLAN_262_16_PATHS[key])) {
    throw new TypeError("MATRIX_PLAN_262_16_CANONICAL_PATH_REQUIRED")
  }
  return resolved
}

const plan26216Read = (
  target: string,
  required: boolean,
):
  | Readonly<{
  value: Record<string, unknown>
  bytes: Buffer
  root: Sha256
    }>
  | undefined => {
  try {
    const stat = lstatSync(target)
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_TYPE_INVALID")
    }
    if (!required) throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_MUST_BE_ABSENT")
    const descriptor = openSync(
      target,
      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
    )
    try {
      const opened = fstatSync(descriptor)
      if (!opened.isFile() || opened.dev !== stat.dev || opened.ino !== stat.ino) {
        throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_IDENTITY_INVALID")
      }
      const bytes = readFileSync(descriptor)
      if (bytes.byteLength > 16 * 1024 * 1024) {
        throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_SIZE_INVALID")
      }
      const parsed: unknown = JSON.parse(bytes.toString("utf8"))
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_INVALID")
      }
      return {
        value: parsed as Record<string, unknown>,
        bytes,
        root: sha256(bytes),
      }
    } finally {
      closeSync(descriptor)
    }
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error as NodeJS.ErrnoException).code !== "ENOENT"
    ) throw error
    if (required) throw new TypeError("MATRIX_PLAN_262_16_ARTIFACT_REQUIRED")
    return undefined
  }
}

const PLAN_262_19_PATHS = {
  authorization: V138_PLAN_262_18_CANONICAL_PATHS.authorization,
  seal: V138_PLAN_262_18_CANONICAL_PATHS.seal,
  context: V138_PLAN_262_19_FRESH_DESTINATIONS[0],
  preflight: V138_PLAN_262_19_FRESH_DESTINATIONS[1],
  calibration: V138_PLAN_262_19_FRESH_DESTINATIONS[2],
  reproduction: V138_PLAN_262_19_FRESH_DESTINATIONS[3],
  terminal: V138_PLAN_262_19_FRESH_DESTINATIONS[4],
} as const

const assertV138TerminalAuthorityOpen = (
  repoRoot: string,
  terminalPaths: readonly string[],
  failureCode: string,
): void => {
  for (const terminalPath of terminalPaths) {
    try {
      lstatSync(path.resolve(repoRoot, terminalPath))
      throw new TypeError(failureCode)
    } catch (error) {
      if (error instanceof TypeError) throw error
      if (errorCode(error) !== "ENOENT") throw error
    }
  }
}

const assertV138Plan26219AuthorityOpen = (repoRoot: string): void =>
  assertV138TerminalAuthorityOpen(
    repoRoot,
    [
      ".planning/artifacts/v1.38-plan-262-18-terminal-v2.json",
      PLAN_262_19_PATHS.terminal,
    ],
    "MATRIX_PLAN_262_19_AUTHORITY_EXPIRED",
  )

const assertV138Plan26218TerminalAbsent = (repoRoot: string): void =>
  assertV138TerminalAuthorityOpen(
    repoRoot,
    [".planning/artifacts/v1.38-plan-262-18-terminal-v2.json"],
    "MATRIX_PLAN_262_18_AUTHORITY_EXPIRED",
  )

const captureV138PrerequisiteRoots = (
  paths: readonly string[],
): readonly Readonly<{ path: string; root: Sha256 }>[] =>
  Object.freeze(
    paths.map((artifactPath) =>
      Object.freeze({
    path: artifactPath,
    root: plan26216Read(artifactPath, true)!.root,
      }),
    ),
  )

const checkV138PrerequisiteRoots = (
  captured: readonly Readonly<{ path: string; root: Sha256 }>[],
): void => {
  if (
    captured.some(
    ({ path: artifactPath, root }) =>
      plan26216Read(artifactPath, true)!.root !== root,
    )
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_PREREQUISITE_DRIFT")
  }
}

type Plan26219Paths = Readonly<Record<keyof typeof PLAN_262_19_PATHS, string>>

const plan26219Path = (
  repoRoot: string,
  supplied: string,
  key: keyof typeof PLAN_262_19_PATHS,
): string => {
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, PLAN_262_19_PATHS[key])) {
    throw new TypeError("MATRIX_PLAN_262_19_CANONICAL_PATH_REQUIRED")
  }
  checkV138CanonicalParentChain(
    validateV138CanonicalParentChain(repoRoot, resolved),
  )
  return resolved
}

export const writeV138Plan26219Immutable = (
  target: string,
  parentChain: Readonly<V138CanonicalParentChain>,
  receipt: Readonly<Record<string, unknown>>,
  options: V138ImmutableReceiptPublicationOptions = {},
): void => {
  checkV138CanonicalParentChain(parentChain)
  try {
    writeV138ImmutableReceipt(target, receipt, options)
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message ===
        "MATRIX_SUCCESSOR_PUBLICATION_DURABILITY_INDETERMINATE"
    ) {
      const expected = Buffer.from(`${canonical(receipt)}\n`, "utf8")
      const descriptor = openSync(
        target,
        constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
      )
      try {
        const actual = readFileSync(descriptor)
        if (!actual.equals(expected)) {
          throw new TypeError(
            "MATRIX_PLAN_262_19_PUBLICATION_INDETERMINATE_BYTES",
          )
        }
      } finally {
        closeSync(descriptor)
      }
      try {
        unlinkSync(target)
        const directoryDescriptor = openSync(path.dirname(target), "r")
        try {
          ;(options.fsyncRollbackDirectory ?? fsyncSync)(
            directoryDescriptor,
          )
        } finally {
          closeSync(directoryDescriptor)
        }
        checkV138CanonicalParentChain(parentChain)
      } catch {
        throw new TypeError(
          "MATRIX_PLAN_262_19_ROLLBACK_INDETERMINATE",
        )
      }
      throw new TypeError(
        "MATRIX_PLAN_262_19_PUBLICATION_DURABLY_ROLLED_BACK",
      )
    }
    throw error
  }
  checkV138CanonicalParentChain(parentChain)
}

export const consumeV138Plan26219Stage = (input: {
  repoRoot: string
  stage: "preflight" | "calibration" | "reproduction"
  context: V138ExecutionContextV6Receipt
  predecessorRoot: Sha256
  chargedAttemptIds: readonly string[]
}): Sha256 => {
  const index =
    input.stage === "preflight" ? 5 : input.stage === "calibration" ? 6 : 7
  const target = path.resolve(
    input.repoRoot,
    V138_PLAN_262_19_FRESH_DESTINATIONS[index]!,
  )
  const parentChain = validateV138CanonicalParentChain(input.repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const body = {
    schemaVersion: "v1.38-plan-262-19-consumption-v1",
    stage: input.stage,
    sourceA2: input.context.sourceA2,
    sourceB2: input.context.sourceB2,
    authorizationRoot: input.context.authorizationRoot,
    sealRoot: input.context.sealRoot,
    executionContextRoot: input.context.receiptRoot,
    predecessorRoot: input.predecessorRoot,
    chargedAttemptRoot: v138SuccessorRoot(
      "artifactManifest",
      `v1.38-plan-262-19-${input.stage}-charged-attempts-v1`,
      input.chargedAttemptIds,
    ),
    noRetry: true,
  }
  const marker = deepFreeze({
    ...body,
    markerRoot: v138SuccessorRoot("evidenceBundle", body.schemaVersion, body),
  })
  writeV138Plan26219Immutable(target, parentChain, marker)
  return marker.markerRoot
}

interface V138Plan26219ConsumptionMarker {
  readonly schemaVersion: "v1.38-plan-262-19-consumption-v1"
  readonly stage: "preflight" | "calibration" | "reproduction"
  readonly sourceA2: string
  readonly sourceB2: string
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly executionContextRoot: Sha256
  readonly predecessorRoot: Sha256
  readonly chargedAttemptRoot: Sha256
  readonly noRetry: true
  readonly markerRoot: Sha256
}

export const checkV138Plan26219ConsumptionMarker = (input: {
  repoRoot: string
  stage: V138Plan26219ConsumptionMarker["stage"]
  context: V138ExecutionContextV6Receipt
  predecessorRoot: Sha256
  chargedAttemptIds: readonly string[]
}): Readonly<V138Plan26219ConsumptionMarker> => {
  const index =
    input.stage === "preflight" ? 5 : input.stage === "calibration" ? 6 : 7
  const artifact = plan26216Read(
    path.resolve(input.repoRoot, V138_PLAN_262_19_FRESH_DESTINATIONS[index]!),
    true,
  )!
  const marker = exactRecord(
    artifact.value,
    [
      "schemaVersion",
      "stage",
      "sourceA2",
      "sourceB2",
      "authorizationRoot",
      "sealRoot",
      "executionContextRoot",
      "predecessorRoot",
      "chargedAttemptRoot",
      "noRetry",
      "markerRoot",
    ],
    "MATRIX_PLAN_262_19_CONSUMPTION_MARKER_INVALID",
  ) as unknown as V138Plan26219ConsumptionMarker
  const { markerRoot, ...body } = marker
  const chargedAttemptRoot = v138SuccessorRoot(
    "artifactManifest",
    `v1.38-plan-262-19-${input.stage}-charged-attempts-v1`,
    input.chargedAttemptIds,
  )
  if (
    marker.schemaVersion !== "v1.38-plan-262-19-consumption-v1" ||
    marker.stage !== input.stage ||
    marker.sourceA2 !== input.context.sourceA2 ||
    marker.sourceB2 !== input.context.sourceB2 ||
    marker.authorizationRoot !== input.context.authorizationRoot ||
    marker.sealRoot !== input.context.sealRoot ||
    marker.executionContextRoot !== input.context.receiptRoot ||
    marker.predecessorRoot !== input.predecessorRoot ||
    marker.chargedAttemptRoot !== chargedAttemptRoot ||
    marker.noRetry !== true ||
    marker.markerRoot !==
      v138SuccessorRoot("evidenceBundle", marker.schemaVersion, body) ||
    artifact.root !== sha256(`${canonical(marker)}\n`)
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_CONSUMPTION_MARKER_INVALID")
  }
  return deepFreeze(marker)
}

const checkV138Plan26219AuthorityRoute = (input: {
  repoRoot: string
  authorizationValue: unknown
  sealValue: unknown
  sourceA2: string
  sourceB2: string
}) => {
  const custody = checkV138SuccessorSealCommitV2({
    repoRoot: input.repoRoot,
    sourceA2: input.sourceA2,
    sourceB2: input.sourceB2,
  })
  const authorization = checkV138Plan26218AuthorizationV2(
    input.repoRoot,
    input.authorizationValue,
  )
  const seal = checkV138SuccessorSourceSealV2(
    input.repoRoot,
    input.sealValue,
    authorization,
  )
  if (
    authorization.sourceCustody.sourceA2 !== custody.sourceA2 ||
    seal.sourceCustody.sourceA2 !== custody.sourceA2
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_AUTHORITY_JOIN_INVALID")
  }
  return { custody, authorization, seal }
}

export const writeV138ExecutionContextV6Receipt = (
  repoRoot: string,
  targetPath: string,
  mode: string,
  cwd: string,
  terminalAgentRegistry: unknown,
  authorizationPath: string,
  sealPath: string,
  sourceA2: string,
  sourceB2: string,
): Readonly<V138ExecutionContextV6Receipt> => {
  assertV138Plan26219AuthorityOpen(repoRoot)
  const target = plan26219Path(repoRoot, targetPath, "context")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(repoRoot, authorizationPath, "authorization"),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, sealPath, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const receipt = buildV138ExecutionContextV6Receipt({
    repoRoot,
    authorization: route.authorization,
    seal: route.seal,
    sourceB2Custody: route.custody,
    mode: mode as V138ExecutionContextV6Receipt["mode"],
    cwd: cwd as V138ExecutionContextV6Receipt["cwd"],
    terminalAgentRegistry:
      terminalAgentRegistry as V138ExecutionContextV6Receipt["terminalAgentRegistry"],
  })
  writeV138Plan26219Immutable(target, parentChain, receipt)
  return receipt
}

export const writeV138HostHeadroomPreflightV6Receipt = async (
  repoRoot: string,
  targetPath: string,
  executionContextPath: string,
  authorizationPath: string,
  sealPath: string,
  sourceA2: string,
  sourceB2: string,
  observeHeadroom: () => Promise<V138DarwinHeadroomResult> = () =>
    observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
): Promise<Readonly<V138HostHeadroomPreflightV6Receipt>> => {
  assertV138Plan26219AuthorityOpen(repoRoot)
  const target = plan26219Path(repoRoot, targetPath, "preflight")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(repoRoot, authorizationPath, "authorization"),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, sealPath, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const context = checkV138ExecutionContextV6Receipt(
    plan26216Read(
      plan26219Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
    {
      repoRoot,
      authorization: route.authorization,
      seal: route.seal,
      sourceB2Custody: route.custody,
    },
  )
  const prerequisiteRoots = captureV138PrerequisiteRoots([
    path.resolve(repoRoot, authorizationPath),
    path.resolve(repoRoot, sealPath),
    path.resolve(repoRoot, executionContextPath),
  ])
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  consumeV138Plan26219Stage({
    repoRoot,
    stage: "preflight",
    context,
    predecessorRoot: context.receiptRoot,
    chargedAttemptIds: ["preflight:v6:0"],
  })
  let observedHeadroom: V138DarwinHeadroomResult
  try {
    observedHeadroom = await observeHeadroom()
  } catch {
    observedHeadroom = {
      ok: false,
      reason: "resource_measurement_unavailable",
    }
  }
  assertV138Plan26219AuthorityOpen(repoRoot)
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  checkV138PrerequisiteRoots(prerequisiteRoots)
  checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      path.resolve(repoRoot, authorizationPath),
      true,
    )!.value,
    sealValue: plan26216Read(path.resolve(repoRoot, sealPath), true)!.value,
    sourceA2,
    sourceB2,
  })
  const receipt = buildV138HostHeadroomPreflightV6Receipt({
    result: observedHeadroom,
    executionContext: context,
  })
  writeV138Plan26219Immutable(target, parentChain, receipt)
  return receipt
}

export const writeV138ParallelCalibrationV6Receipt = async (
  repoRoot: string,
  targetPath: string,
  preflightPath: string,
  executionContextPath: string,
  sourceA2: string,
  sourceB2: string,
  runCalibration: typeof calibrateV138ParallelMatrix =
    calibrateV138ParallelMatrix,
): Promise<Readonly<V138ParallelCalibrationV6Receipt>> => {
  assertV138Plan26219AuthorityOpen(repoRoot)
  const target = plan26219Path(repoRoot, targetPath, "calibration")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(
        repoRoot,
        PLAN_262_19_PATHS.authorization,
        "authorization",
      ),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, PLAN_262_19_PATHS.seal, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const context = checkV138ExecutionContextV6Receipt(
    plan26216Read(
      plan26219Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
    {
      repoRoot,
      authorization: route.authorization,
      seal: route.seal,
      sourceB2Custody: route.custody,
    },
  )
  if (context.sourceA2 !== sourceA2 || context.sourceB2 !== sourceB2) {
    throw new TypeError("MATRIX_CALIBRATION_V6_CONTEXT_JOIN_INVALID")
  }
  const preflight = checkV138HostHeadroomPreflightV6Receipt(
    plan26216Read(
      plan26219Path(repoRoot, preflightPath, "preflight"),
      true,
    )!.value,
    context,
  )
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const prerequisiteRoots = captureV138PrerequisiteRoots([
    path.resolve(repoRoot, PLAN_262_19_PATHS.authorization),
    path.resolve(repoRoot, PLAN_262_19_PATHS.seal),
    path.resolve(repoRoot, executionContextPath),
    path.resolve(repoRoot, preflightPath),
  ])
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  consumeV138Plan26219Stage({
    repoRoot,
    stage: "calibration",
    context,
    predecessorRoot: preflight.receiptRoot,
    chargedAttemptIds: deriveV138CalibrationAttemptMappings(
      inventory,
      "v6",
    ).map(({ executionAttemptId }) => executionAttemptId),
  })
  let calibration: Readonly<V138ParallelCalibrationReceipt> | undefined
  let callbackFailureAfterConsumption: true | undefined
  if (preflight.disposition === "preflight_admitted") {
    try {
      calibration = await runCalibration({
          inventory,
          runner: createV138SubprocessShardRunner(repoRoot, {
            useLegacyHostMemory: false,
          }),
          sharedHeadroomObserver: () =>
            observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
          hardwareIdentity: {
            operatingSystem: `${platform()} ${release()}`,
            architecture: arch(),
            nodeVersion: process.version,
            cpuIdentity: cpus()[0]?.model ?? "unavailable",
          },
          repoRoot,
          executionIdentityVersion: "v6",
        })
    } catch {
      callbackFailureAfterConsumption = true
    }
  }
  assertV138Plan26219AuthorityOpen(repoRoot)
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  checkV138PrerequisiteRoots(prerequisiteRoots)
  checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      path.resolve(repoRoot, PLAN_262_19_PATHS.authorization),
      true,
    )!.value,
    sealValue: plan26216Read(
      path.resolve(repoRoot, PLAN_262_19_PATHS.seal),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const receipt = buildV138ParallelCalibrationV6Receipt({
    inventory,
    sourceB2,
    sourceB2CustodyRoot: context.sourceB2CustodyRoot,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot,
    preflightDisposition: preflight.disposition,
    calibration,
    callbackFailureAfterConsumption,
  })
  writeV138Plan26219Immutable(target, parentChain, receipt)
  return receipt
}

export const writeV138AuthoritativeMatrixV7Receipt = async (
  repoRoot: string,
  targetPath: string,
  calibrationPath: string,
  executionContextPath: string,
  sourceA2: string,
  sourceB2: string,
  runReproduction: typeof executeV138ParallelMatrix =
    executeV138ParallelMatrix,
): Promise<Readonly<V138AuthoritativeMatrixV7Receipt>> => {
  assertV138Plan26219AuthorityOpen(repoRoot)
  const target = plan26219Path(repoRoot, targetPath, "reproduction")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(
        repoRoot,
        PLAN_262_19_PATHS.authorization,
        "authorization",
      ),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, PLAN_262_19_PATHS.seal, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const context = checkV138ExecutionContextV6Receipt(
    plan26216Read(
      plan26219Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
    {
      repoRoot,
      authorization: route.authorization,
      seal: route.seal,
      sourceB2Custody: route.custody,
    },
  )
  if (context.sourceA2 !== sourceA2 || context.sourceB2 !== sourceB2) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_CONTEXT_JOIN_INVALID")
  }
  const preflight = checkV138HostHeadroomPreflightV6Receipt(
    plan26216Read(
      plan26219Path(repoRoot, PLAN_262_19_PATHS.preflight, "preflight"),
      true,
    )!.value,
    context,
  )
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = checkV138ParallelCalibrationV6Receipt(
    inventory,
    plan26216Read(
      plan26219Path(repoRoot, calibrationPath, "calibration"),
      true,
    )!.value,
  )
  if (
    calibration.status !== "admitted" ||
    calibration.supervisionRoot === null
  ) {
    throw new TypeError("MATRIX_REPRODUCTION_V7_CALIBRATION_NOT_ADMITTED")
  }
  const prerequisiteRoots = captureV138PrerequisiteRoots([
    path.resolve(repoRoot, PLAN_262_19_PATHS.authorization),
    path.resolve(repoRoot, PLAN_262_19_PATHS.seal),
    path.resolve(repoRoot, executionContextPath),
    path.resolve(repoRoot, PLAN_262_19_PATHS.preflight),
    path.resolve(repoRoot, calibrationPath),
  ])
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  consumeV138Plan26219Stage({
    repoRoot,
    stage: "reproduction",
    context,
    predecessorRoot: calibration.receiptRoot,
    chargedAttemptIds: planV138MatrixShards(inventory).shards.flatMap(
      ({ attemptIds }) =>
        attemptIds.map((attemptId) => `reproduction:v6:${attemptId}`),
    ),
  })
  let execution: V138ParallelMatrixExecutionResult | undefined
  let callbackFailureAfterConsumption: true | undefined
  try {
    execution = await runReproduction({
    inventory,
    admittedCalibrationRoot: calibration.supervisionRoot,
    runner: createV138SubprocessShardRunner(repoRoot, {
      useLegacyHostMemory: false,
    }),
    sharedHeadroomObserver: () =>
      observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
    repoRoot,
    executionIdentityVersion: "v6",
    })
  } catch {
    callbackFailureAfterConsumption = true
  }
  assertV138Plan26219AuthorityOpen(repoRoot)
  checkV138SealedWorktreeAtA2(repoRoot, route.seal)
  checkV138PrerequisiteRoots(prerequisiteRoots)
  checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      path.resolve(repoRoot, PLAN_262_19_PATHS.authorization),
      true,
    )!.value,
    sealValue: plan26216Read(
      path.resolve(repoRoot, PLAN_262_19_PATHS.seal),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const receipt = buildV138AuthoritativeMatrixV7Receipt({
    repoRoot,
    executionContext: context,
    preflight,
    calibration,
    execution,
    callbackFailureAfterConsumption,
  })
  writeV138Plan26219Immutable(target, parentChain, receipt)
  return receipt
}

export type V138Plan26219TerminalDisposition =
  | "tool_identity_failed"
  | "protected_history_failed"
  | "formation_absence_failed"
  | "pattern_c_ownership_failed"
  | "fresh_destination_failed"
  | "consumed_stage_interrupted"
  | "preflight_unavailable"
  | "preflight_refused"
  | "calibration_stopped"
  | "reproduction_stopped"
  | "reproduction_passed"

export interface V138Plan26219TerminalV2 {
  readonly schemaVersion: "v1.38-plan-262-19-terminal-v2"
  readonly disposition: V138Plan26219TerminalDisposition
  readonly sourceA2: string
  readonly sourceB2: string
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly executionContextRoot: Sha256 | null
  readonly preflightRoot: Sha256 | null
  readonly calibrationRoot: Sha256 | null
  readonly reproductionRoot: Sha256 | null
  readonly consumptionMarkerRoots: Readonly<{
    preflight: Sha256 | null
    calibration: Sha256 | null
    reproduction: Sha256 | null
  }>
  readonly obstructionProof: Readonly<{
    stage: "context" | "preflight" | "calibration" | "reproduction"
    path: string
    type: "file" | "directory" | "symlink" | "other"
    metadataRoot: Sha256
  }> | null
  readonly interruptionProof: Readonly<{
    stage: "preflight" | "calibration" | "reproduction"
    markerRoot: Sha256
    chargedAttemptCount: 1 | 8 | 540
    observationMode: "unknown_after_consumption"
    childLaunchCount: null
    terminalOutcomeCount: null
    completeCleanup: false
  }> | null
  readonly chargedCalibrationAttemptCount: 0 | 8
  readonly chargedReproductionAttemptCount: 0 | 540
  readonly acceptedCellCount: 0 | 540
  readonly completeCleanup: boolean
  readonly authorityExpired: true
  readonly noRetry: true
  readonly partialAcceptedEvidenceReusable: false
  readonly terminalRoot: Sha256
}

const plan26219Needs = (
  disposition: V138Plan26219TerminalDisposition,
  obstructionStage?: "context" | "preflight" | "calibration" | "reproduction",
  interruptedStage?: "preflight" | "calibration" | "reproduction",
) => {
  const beforeObservation = [
    "tool_identity_failed",
    "protected_history_failed",
    "formation_absence_failed",
    "pattern_c_ownership_failed",
  ].includes(disposition)
  if (disposition === "fresh_destination_failed") {
    return {
      context:
        obstructionStage === "preflight" ||
        obstructionStage === "calibration" ||
        obstructionStage === "reproduction",
      preflight:
        obstructionStage === "calibration" ||
        obstructionStage === "reproduction",
      calibration: obstructionStage === "reproduction",
      reproduction: false,
    }
  }
  if (disposition === "consumed_stage_interrupted") {
    return {
      context: true,
      preflight:
        interruptedStage === "calibration" ||
        interruptedStage === "reproduction",
      calibration: interruptedStage === "reproduction",
      reproduction: false,
    }
  }
  return {
    context: !beforeObservation,
    preflight: !beforeObservation,
    calibration: !beforeObservation,
    reproduction:
      disposition === "reproduction_stopped" ||
      disposition === "reproduction_passed",
  }
}

const plan26219MarkerNeeds = (
  disposition: V138Plan26219TerminalDisposition,
  artifactNeeds: ReturnType<typeof plan26219Needs>,
  interruptedStage?: "preflight" | "calibration" | "reproduction",
) =>
  disposition === "consumed_stage_interrupted"
    ? {
        preflight: true,
        calibration:
          interruptedStage === "calibration" ||
          interruptedStage === "reproduction",
        reproduction: interruptedStage === "reproduction",
      }
    : {
        preflight: artifactNeeds.preflight,
        calibration: artifactNeeds.calibration,
        reproduction: artifactNeeds.reproduction,
      }

export const buildV138Plan26219TerminalV2 = (input: {
  readonly disposition: V138Plan26219TerminalDisposition
  readonly authorization: V138Plan26218AuthorizationV2
  readonly seal: V138SuccessorSourceSealV2
  readonly sourceA2: string
  readonly sourceB2: string
  readonly context?: V138ExecutionContextV6Receipt | undefined
  readonly preflight?: V138HostHeadroomPreflightV6Receipt | undefined
  readonly calibration?: V138ParallelCalibrationV6Receipt | undefined
  readonly reproduction?: V138AuthoritativeMatrixV7Receipt | undefined
  readonly consumptionMarkerRoots?: V138Plan26219TerminalV2["consumptionMarkerRoots"]
  readonly obstructionProof?: V138Plan26219TerminalV2["obstructionProof"]
  readonly interruptionProof?: V138Plan26219TerminalV2["interruptionProof"]
}): Readonly<V138Plan26219TerminalV2> => {
  const needs = plan26219Needs(
    input.disposition,
    input.obstructionProof?.stage,
    input.interruptionProof?.stage,
  )
  const markerNeeds = plan26219MarkerNeeds(
    input.disposition,
    needs,
    input.interruptionProof?.stage,
  )
  if (
    (input.context !== undefined) !== needs.context ||
    (input.preflight !== undefined) !== needs.preflight ||
    (input.calibration !== undefined) !== needs.calibration ||
    (input.reproduction !== undefined) !== needs.reproduction ||
    input.consumptionMarkerRoots === undefined ||
    (input.consumptionMarkerRoots.preflight !== null) !== markerNeeds.preflight ||
    (input.consumptionMarkerRoots.calibration !== null) !==
      markerNeeds.calibration ||
    (input.consumptionMarkerRoots.reproduction !== null) !==
      markerNeeds.reproduction ||
    (input.disposition === "fresh_destination_failed") !==
      (input.obstructionProof !== undefined &&
        input.obstructionProof !== null) ||
    (input.disposition === "consumed_stage_interrupted") !==
      (input.interruptionProof !== undefined &&
        input.interruptionProof !== null) ||
    (input.disposition === "consumed_stage_interrupted" &&
      input.interruptionProof!.markerRoot !==
        input.consumptionMarkerRoots[
          input.interruptionProof!.stage
        ]) ||
    input.authorization.sourceCustody.sourceA2 !== input.sourceA2 ||
    input.seal.sourceCustody.sourceA2 !== input.sourceA2 ||
    input.seal.authorizationRoot !== input.authorization.authorizationRoot
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_PRESENCE_INVALID")
  }
  const context =
    input.context === undefined
    ? undefined
    : checkV138ExecutionContextV6Receipt(input.context)
  const preflight =
    input.preflight === undefined || context === undefined
      ? undefined
      : checkV138HostHeadroomPreflightV6Receipt(input.preflight, context)
  const calibration = input.calibration
  const reproduction = input.reproduction
  if (
    (context !== undefined &&
      (context.sourceA2 !== input.sourceA2 ||
        context.sourceB2 !== input.sourceB2)) ||
    (calibration !== undefined &&
      (calibration.sourceB2 !== input.sourceB2 ||
        calibration.sourceB2CustodyRoot !== context?.sourceB2CustodyRoot ||
        calibration.executionContextRoot !== context?.receiptRoot ||
        calibration.preflightRoot !== preflight?.receiptRoot)) ||
    (reproduction !== undefined &&
      (reproduction.sourceA2 !== input.sourceA2 ||
        reproduction.sourceB2 !== input.sourceB2 ||
        reproduction.executionContextRoot !== context?.receiptRoot ||
        reproduction.preflightRoot !== preflight?.receiptRoot ||
        reproduction.calibrationRoot !== calibration?.receiptRoot))
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_SOURCE_JOIN_INVALID")
  }
  if (
    (input.disposition === "preflight_unavailable" &&
      (preflight?.disposition !== "preflight_unavailable" ||
        calibration?.status !== "preflight_unavailable")) ||
    (input.disposition === "preflight_refused" &&
      (preflight?.disposition !== "preflight_refused" ||
        calibration?.status !== "preflight_refused")) ||
    (input.disposition === "calibration_stopped" &&
      (preflight?.disposition !== "preflight_admitted" ||
        calibration?.status !== "stopped_process_failure")) ||
    ((input.disposition === "reproduction_stopped" ||
      input.disposition === "reproduction_passed") &&
      (calibration?.status !== "admitted" ||
        reproduction?.status !==
          (input.disposition === "reproduction_passed"
            ? "passed_exact"
            : "stopped_process_failure")))
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_DISPOSITION_INVALID")
  }
  const acceptedCellCount =
    input.disposition === "reproduction_passed" ? 540 as const : 0 as const
  const calibrationCleanup = calibration?.completeCleanup ?? true
  const completeCleanup =
    calibrationCleanup &&
    (reproduction === undefined || reproduction.completeCleanup)
  const body = {
    schemaVersion: "v1.38-plan-262-19-terminal-v2" as const,
    disposition: input.disposition,
    sourceA2: input.sourceA2,
    sourceB2: input.sourceB2,
    authorizationRoot: input.authorization.authorizationRoot,
    sealRoot: input.seal.sealRoot,
    executionContextRoot: context?.receiptRoot ?? null,
    preflightRoot: preflight?.receiptRoot ?? null,
    calibrationRoot: calibration?.receiptRoot ?? null,
    reproductionRoot: reproduction?.receiptRoot ?? null,
    consumptionMarkerRoots: input.consumptionMarkerRoots,
    obstructionProof: input.obstructionProof ?? null,
    interruptionProof: input.interruptionProof ?? null,
    chargedCalibrationAttemptCount:
      calibration === undefined &&
        input.interruptionProof?.stage !== "calibration" &&
        input.interruptionProof?.stage !== "reproduction"
        ? 0 as const
        : 8 as const,
    chargedReproductionAttemptCount:
      reproduction === undefined &&
        input.interruptionProof?.stage !== "reproduction"
        ? 0 as const
        : 540 as const,
    acceptedCellCount,
    completeCleanup:
      input.disposition === "consumed_stage_interrupted"
        ? false
        : completeCleanup,
    authorityExpired: true as const,
    noRetry: true as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...body,
    terminalRoot: v138SuccessorRoot(
      "canonicalJsonProfile",
      body.schemaVersion,
      body,
    ),
  })
}

export const checkV138Plan26219TerminalV2 = (
  value: unknown,
): Readonly<V138Plan26219TerminalV2> => {
  const terminal = exactRecord(
    value,
    [
      "schemaVersion",
      "disposition",
      "sourceA2",
      "sourceB2",
      "authorizationRoot",
      "sealRoot",
      "executionContextRoot",
      "preflightRoot",
      "calibrationRoot",
      "reproductionRoot",
      "consumptionMarkerRoots",
      "obstructionProof",
      "interruptionProof",
      "chargedCalibrationAttemptCount", "chargedReproductionAttemptCount",
      "acceptedCellCount", "completeCleanup", "authorityExpired", "noRetry",
      "partialAcceptedEvidenceReusable", "terminalRoot",
    ],
    "MATRIX_PLAN_262_19_TERMINAL_INVALID",
  ) as unknown as V138Plan26219TerminalV2
  const { terminalRoot, ...body } = terminal
  const needs = plan26219Needs(
    terminal.disposition,
    terminal.obstructionProof?.stage,
    terminal.interruptionProof?.stage,
  )
  const markerNeeds = plan26219MarkerNeeds(
    terminal.disposition,
    needs,
    terminal.interruptionProof?.stage,
  )
  const obstruction = terminal.obstructionProof
  const interruption = terminal.interruptionProof
  const markerRoots = exactRecord(
    terminal.consumptionMarkerRoots,
    ["preflight", "calibration", "reproduction"],
    "MATRIX_PLAN_262_19_TERMINAL_INVALID",
  )
  const obstructionValid =
    obstruction !== null &&
    canonical(Object.keys(obstruction)) ===
      canonical(["stage", "path", "type", "metadataRoot"]) &&
    ["context", "preflight", "calibration", "reproduction"].includes(
      obstruction.stage,
    ) &&
    (obstruction.stage === "context"
      ? [V138_PLAN_262_19_FRESH_DESTINATIONS[0]]
      : obstruction.stage === "preflight"
        ? [
            V138_PLAN_262_19_FRESH_DESTINATIONS[1],
            V138_PLAN_262_19_FRESH_DESTINATIONS[5],
          ]
        : obstruction.stage === "calibration"
          ? [
              V138_PLAN_262_19_FRESH_DESTINATIONS[2],
              V138_PLAN_262_19_FRESH_DESTINATIONS[6],
            ]
          : [
              V138_PLAN_262_19_FRESH_DESTINATIONS[3],
              V138_PLAN_262_19_FRESH_DESTINATIONS[7],
            ]
    ).includes(obstruction.path as never) &&
    ["file", "directory", "symlink", "other"].includes(obstruction.type) &&
    isV138CanonicalSha256(obstruction.metadataRoot)
  const interruptionValid =
    interruption !== null &&
    canonical(Object.keys(interruption)) ===
      canonical([
        "stage",
        "markerRoot",
        "chargedAttemptCount",
        "observationMode",
        "childLaunchCount",
        "terminalOutcomeCount",
        "completeCleanup",
      ]) &&
    ["preflight", "calibration", "reproduction"].includes(
      interruption.stage,
    ) &&
    isV138CanonicalSha256(interruption.markerRoot) &&
    interruption.chargedAttemptCount ===
      (interruption.stage === "preflight"
        ? 1
        : interruption.stage === "calibration"
          ? 8
          : 540) &&
    interruption.observationMode === "unknown_after_consumption" &&
    interruption.childLaunchCount === null &&
    interruption.terminalOutcomeCount === null &&
    interruption.completeCleanup === false &&
    interruption.markerRoot === markerRoots[interruption.stage]
  if (terminal.disposition === "fresh_destination_failed" && !obstructionValid) {
    throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_INVALID")
  }
  const artifactRoots = [
    terminal.executionContextRoot,
    terminal.preflightRoot,
    terminal.calibrationRoot,
    terminal.reproductionRoot,
  ]
  if (
    terminal.schemaVersion !== "v1.38-plan-262-19-terminal-v2" ||
    ![
      "tool_identity_failed", "protected_history_failed",
      "formation_absence_failed", "pattern_c_ownership_failed",
      "fresh_destination_failed", "consumed_stage_interrupted",
      "preflight_unavailable",
      "preflight_refused", "calibration_stopped", "reproduction_stopped",
      "reproduction_passed",
    ].includes(terminal.disposition) ||
    !/^[0-9a-f]{40}$/u.test(terminal.sourceA2) ||
    !/^[0-9a-f]{40}$/u.test(terminal.sourceB2) ||
    !isV138CanonicalSha256(terminal.authorizationRoot) ||
    !isV138CanonicalSha256(terminal.sealRoot) ||
    artifactRoots.some(
      (root) => root !== null && !isV138CanonicalSha256(root),
    ) ||
    ![0, 8].includes(terminal.chargedCalibrationAttemptCount) ||
    ![0, 540].includes(terminal.chargedReproductionAttemptCount) ||
    ![0, 540].includes(terminal.acceptedCellCount) ||
    (terminal.executionContextRoot !== null) !== needs.context ||
    (terminal.preflightRoot !== null) !== needs.preflight ||
    (terminal.calibrationRoot !== null) !== needs.calibration ||
    (terminal.reproductionRoot !== null) !== needs.reproduction ||
    (markerRoots.preflight !== null) !== markerNeeds.preflight ||
    (markerRoots.calibration !== null) !== markerNeeds.calibration ||
    (markerRoots.reproduction !== null) !== markerNeeds.reproduction ||
    Object.values(markerRoots).some(
      (root) => root !== null && !isV138CanonicalSha256(root),
    ) ||
    (terminal.disposition === "fresh_destination_failed"
      ? !obstructionValid
      : obstruction !== null) ||
    (terminal.disposition === "consumed_stage_interrupted"
      ? !interruptionValid
      : interruption !== null) ||
    terminal.chargedReproductionAttemptCount !==
      (terminal.disposition === "consumed_stage_interrupted" &&
          terminal.interruptionProof?.stage === "reproduction" ||
        needs.reproduction
        ? 540
        : 0) ||
    terminal.chargedCalibrationAttemptCount !==
      (terminal.disposition === "consumed_stage_interrupted" &&
        (terminal.interruptionProof?.stage === "calibration" ||
          terminal.interruptionProof?.stage === "reproduction") ||
        needs.calibration
        ? 8
        : 0) ||
    terminal.acceptedCellCount !==
      (terminal.disposition === "reproduction_passed" ? 540 : 0) ||
    typeof terminal.completeCleanup !== "boolean" ||
    terminal.authorityExpired !== true ||
    terminal.noRetry !== true ||
    terminal.partialAcceptedEvidenceReusable !== false ||
    (terminal.disposition === "consumed_stage_interrupted" &&
      terminal.completeCleanup !== false) ||
    terminalRoot !==
      v138SuccessorRoot("canonicalJsonProfile", terminal.schemaVersion, body)
  ) {
    throw new TypeError("MATRIX_PLAN_262_19_TERMINAL_INVALID")
  }
  return deepFreeze(terminal)
}

const readV138Plan26219BranchArtifacts = (
  repoRoot: string,
  supplied: Plan26219Paths,
) => {
  const terminal = checkV138Plan26219TerminalV2(
    plan26216Read(
      plan26219Path(repoRoot, supplied.terminal, "terminal"),
      true,
    )!.value,
  )
  const needs = plan26219Needs(
    terminal.disposition,
    terminal.obstructionProof?.stage,
    terminal.interruptionProof?.stage,
  )
  const read = <
    K extends "context" | "preflight" | "calibration" | "reproduction",
  >(
    key: K,
  ) => {
    if (
      terminal.disposition === "fresh_destination_failed" &&
      terminal.obstructionProof?.path === supplied[key]
    ) return undefined
    return plan26216Read(
      plan26219Path(repoRoot, supplied[key], key),
      needs[key],
    )?.value
  }
  return {
    terminal,
    context: read("context"),
    preflight: read("preflight"),
    calibration: read("calibration"),
    reproduction: read("reproduction"),
  }
}

export const checkV138Plan26219TerminalBranch = (
  repoRoot: string,
  supplied: Plan26219Paths,
  sourceA2: string,
  sourceB2: string,
): V138Plan26219TerminalDisposition => {
  assertV138Plan26218TerminalAbsent(repoRoot)
  const branch = readV138Plan26219BranchArtifacts(repoRoot, supplied)
  if (branch.terminal.disposition === "fresh_destination_failed") {
    const proof = branch.terminal.obstructionProof!
    const stat = lstatSync(path.resolve(repoRoot, proof.path))
    const type = stat.isSymbolicLink()
      ? "symlink" as const
      : stat.isFile()
        ? "file" as const
        : stat.isDirectory()
          ? "directory" as const
          : "other" as const
    const metadataRoot = v138SuccessorRoot(
      "artifactManifest",
      "v1.38-plan-262-19-obstruction-metadata-v1",
      {
        type,
        mode: stat.mode,
        size: stat.size,
        modifiedMilliseconds: Math.trunc(stat.mtimeMs),
      },
    )
    if (type !== proof.type || metadataRoot !== proof.metadataRoot) {
      throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_INVALID")
    }
    const stageOrder = ["context", "preflight", "calibration", "reproduction"]
    const stagePaths = {
      context: [supplied.context],
      preflight: [supplied.preflight, V138_PLAN_262_19_FRESH_DESTINATIONS[5]!],
      calibration: [
        supplied.calibration,
        V138_PLAN_262_19_FRESH_DESTINATIONS[6]!,
      ],
      reproduction: [
        supplied.reproduction,
        V138_PLAN_262_19_FRESH_DESTINATIONS[7]!,
      ],
    } as const
    const stageIndex = stageOrder.indexOf(proof.stage)
    for (const [index, stage] of stageOrder.entries()) {
      for (const candidate of stagePaths[stage as keyof typeof stagePaths]) {
        if (
          index > stageIndex ||
          (index === stageIndex && candidate !== proof.path)
        ) {
          plan26216Read(path.resolve(repoRoot, candidate), false)
        }
      }
    }
  }
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(repoRoot, supplied.authorization, "authorization"),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, supplied.seal, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const context =
    branch.context === undefined
    ? undefined
    : checkV138ExecutionContextV6Receipt(branch.context, {
        repoRoot,
        authorization: route.authorization,
        seal: route.seal,
        sourceB2Custody: route.custody,
      })
  const preflight =
    branch.preflight === undefined || context === undefined
      ? undefined
      : checkV138HostHeadroomPreflightV6Receipt(branch.preflight, context)
  const calibration =
    branch.calibration === undefined
    ? undefined
    : checkV138ParallelCalibrationV6Receipt(
        enumerateV138CurrentMatrix(repoRoot),
        branch.calibration,
      )
  const reproduction =
    branch.reproduction === undefined ||
    context === undefined ||
    preflight === undefined ||
    calibration === undefined
      ? undefined
      : checkV138AuthoritativeMatrixV7Receipt(branch.reproduction, {
          repoRoot,
          executionContext: context,
          preflight,
          calibration,
        })
  if (branch.terminal.disposition === "fresh_destination_failed") {
    const proof = branch.terminal.obstructionProof!
    const obstructionValue = plan26216Read(
      path.resolve(repoRoot, proof.path),
      true,
    )!.value
    let validCanonicalStage = false
    try {
      if (proof.path === supplied.context) {
        checkV138ExecutionContextV6Receipt(obstructionValue, {
          repoRoot,
          authorization: route.authorization,
          seal: route.seal,
          sourceB2Custody: route.custody,
        })
        validCanonicalStage = true
      } else if (proof.path === supplied.preflight && context !== undefined) {
        checkV138HostHeadroomPreflightV6Receipt(obstructionValue, context)
        validCanonicalStage = true
      } else if (proof.path === supplied.calibration) {
        checkV138ParallelCalibrationV6Receipt(
          enumerateV138CurrentMatrix(repoRoot),
          obstructionValue,
        )
        validCanonicalStage = true
      } else if (
        proof.path === supplied.reproduction &&
        context !== undefined &&
        preflight !== undefined &&
        calibration !== undefined
      ) {
        checkV138AuthoritativeMatrixV7Receipt(obstructionValue, {
          repoRoot,
          executionContext: context,
          preflight,
          calibration,
        })
        validCanonicalStage = true
      }
    } catch {
      validCanonicalStage = false
    }
    if (validCanonicalStage) {
      throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_MISCLASSIFIED")
    }
  }
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const markerNeeds = plan26219MarkerNeeds(
    branch.terminal.disposition,
    plan26219Needs(
      branch.terminal.disposition,
      branch.terminal.obstructionProof?.stage,
      branch.terminal.interruptionProof?.stage,
    ),
    branch.terminal.interruptionProof?.stage,
  )
  const consumptionMarkerRoots = {
    preflight:
      !markerNeeds.preflight || context === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "preflight",
            context,
            predecessorRoot: context.receiptRoot,
            chargedAttemptIds: ["preflight:v6:0"],
          }).markerRoot,
    calibration:
      !markerNeeds.calibration ||
      context === undefined ||
      preflight === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "calibration",
            context,
            predecessorRoot: preflight.receiptRoot,
            chargedAttemptIds: deriveV138CalibrationAttemptMappings(
              inventory,
              "v6",
            ).map(({ executionAttemptId }) => executionAttemptId),
          }).markerRoot,
    reproduction:
      !markerNeeds.reproduction ||
      context === undefined ||
      calibration === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "reproduction",
            context,
            predecessorRoot: calibration.receiptRoot,
            chargedAttemptIds: planV138MatrixShards(inventory).shards.flatMap(
              ({ attemptIds }) =>
                attemptIds.map((attemptId) => `reproduction:v6:${attemptId}`),
            ),
          }).markerRoot,
  } as const
  if (branch.terminal.disposition === "consumed_stage_interrupted") {
    const stage = branch.terminal.interruptionProof!.stage
    const stageOrder = ["preflight", "calibration", "reproduction"] as const
    const publicPaths = {
      preflight: supplied.preflight,
      calibration: supplied.calibration,
      reproduction: supplied.reproduction,
    } as const
    const markerPaths = {
      preflight: V138_PLAN_262_19_FRESH_DESTINATIONS[5]!,
      calibration: V138_PLAN_262_19_FRESH_DESTINATIONS[6]!,
      reproduction: V138_PLAN_262_19_FRESH_DESTINATIONS[7]!,
    } as const
    const stageIndex = stageOrder.indexOf(stage)
    for (const [index, candidateStage] of stageOrder.entries()) {
      if (index >= stageIndex) {
        plan26216Read(
          path.resolve(repoRoot, publicPaths[candidateStage]),
          false,
        )
      }
      if (index > stageIndex) {
        plan26216Read(
          path.resolve(repoRoot, markerPaths[candidateStage]),
          false,
        )
      }
    }
  }
  if (branch.terminal.disposition === "fresh_destination_failed") {
    const proof = branch.terminal.obstructionProof!
    let validCanonicalMarker = false
    try {
      if (
        proof.path === V138_PLAN_262_19_FRESH_DESTINATIONS[5] &&
        context !== undefined
      ) {
        checkV138Plan26219ConsumptionMarker({
          repoRoot,
          stage: "preflight",
          context,
          predecessorRoot: context.receiptRoot,
          chargedAttemptIds: ["preflight:v6:0"],
        })
        validCanonicalMarker = true
      } else if (
        proof.path === V138_PLAN_262_19_FRESH_DESTINATIONS[6] &&
        context !== undefined &&
        preflight !== undefined
      ) {
        checkV138Plan26219ConsumptionMarker({
          repoRoot,
          stage: "calibration",
          context,
          predecessorRoot: preflight.receiptRoot,
          chargedAttemptIds: deriveV138CalibrationAttemptMappings(
            inventory,
            "v6",
          ).map(({ executionAttemptId }) => executionAttemptId),
        })
        validCanonicalMarker = true
      } else if (
        proof.path === V138_PLAN_262_19_FRESH_DESTINATIONS[7] &&
        context !== undefined &&
        calibration !== undefined
      ) {
        checkV138Plan26219ConsumptionMarker({
          repoRoot,
          stage: "reproduction",
          context,
          predecessorRoot: calibration.receiptRoot,
          chargedAttemptIds: planV138MatrixShards(inventory).shards.flatMap(
            ({ attemptIds }) =>
              attemptIds.map((attemptId) => `reproduction:v6:${attemptId}`),
          ),
        })
        validCanonicalMarker = true
      }
    } catch {
      validCanonicalMarker = false
    }
    if (validCanonicalMarker) {
      throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_MISCLASSIFIED")
    }
  }
  const expected = buildV138Plan26219TerminalV2({
    disposition: branch.terminal.disposition,
    authorization: route.authorization,
    seal: route.seal,
    sourceA2,
    sourceB2,
    context,
    preflight,
    calibration,
    reproduction,
    consumptionMarkerRoots,
    obstructionProof: branch.terminal.obstructionProof,
    interruptionProof: branch.terminal.interruptionProof,
  })
  if (canonical(expected) !== canonical(branch.terminal)) {
    throw new TypeError("MATRIX_PLAN_262_19_TERMINAL_JOIN_INVALID")
  }
  return expected.disposition
}

export const writeV138Plan26219TerminalV2 = (
  repoRoot: string,
  supplied: Plan26219Paths,
  disposition: V138Plan26219TerminalDisposition,
  sourceA2: string,
  sourceB2: string,
): Readonly<V138Plan26219TerminalV2> => {
  assertV138Plan26218TerminalAbsent(repoRoot)
  const target = plan26219Path(repoRoot, supplied.terminal, "terminal")
  const parentChain = validateV138CanonicalParentChain(repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const obstructionProof =
    disposition !== "fresh_destination_failed"
      ? undefined
      : (() => {
          const stagedCandidates = [
            {
              stage: "context" as const,
              paths: [supplied.context],
            },
            {
              stage: "preflight" as const,
              paths: [
            supplied.preflight,
                V138_PLAN_262_19_FRESH_DESTINATIONS[5]!,
              ],
            },
            {
              stage: "calibration" as const,
              paths: [
            supplied.calibration,
                V138_PLAN_262_19_FRESH_DESTINATIONS[6]!,
              ],
            },
            {
              stage: "reproduction" as const,
              paths: [
            supplied.reproduction,
                V138_PLAN_262_19_FRESH_DESTINATIONS[7]!,
              ],
            },
          ].map(({ stage, paths }) => ({
            stage,
            candidates: paths.flatMap((repoPath) => {
            try {
              const stat = lstatSync(path.resolve(repoRoot, repoPath))
              const type = stat.isSymbolicLink()
                  ? ("symlink" as const)
                : stat.isFile()
                    ? ("file" as const)
                  : stat.isDirectory()
                      ? ("directory" as const)
                      : ("other" as const)
                return [
                  {
                    stage,
                path: repoPath,
                type,
                metadataRoot: v138SuccessorRoot(
                  "artifactManifest",
                  "v1.38-plan-262-19-obstruction-metadata-v1",
                  {
                    type,
                    mode: stat.mode,
                    size: stat.size,
                    modifiedMilliseconds: Math.trunc(stat.mtimeMs),
                  },
                ),
                  },
                ]
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT")
                  return []
              throw error
            }
            }),
          }))
          const active = stagedCandidates
            .filter(({ candidates }) => candidates.length > 0)
            .at(-1)
          if (active === undefined || active.candidates.length !== 1) {
            throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_INVALID")
          }
          for (const later of stagedCandidates.slice(
            stagedCandidates.indexOf(active) + 1,
          )) {
            if (later.candidates.length !== 0) {
            throw new TypeError("MATRIX_PLAN_262_19_OBSTRUCTION_INVALID")
          }
          }
          return Object.freeze(active.candidates[0]!)
        })()
  const interruptedStage =
    disposition !== "consumed_stage_interrupted"
      ? undefined
      : (() => {
          const stages = [
            {
              stage: "preflight" as const,
              publicPath: supplied.preflight,
              markerPath: V138_PLAN_262_19_FRESH_DESTINATIONS[5]!,
            },
            {
              stage: "calibration" as const,
              publicPath: supplied.calibration,
              markerPath: V138_PLAN_262_19_FRESH_DESTINATIONS[6]!,
            },
            {
              stage: "reproduction" as const,
              publicPath: supplied.reproduction,
              markerPath: V138_PLAN_262_19_FRESH_DESTINATIONS[7]!,
            },
          ]
          const exists = (repoPath: string) => {
            try {
              lstatSync(path.resolve(repoRoot, repoPath))
              return true
            } catch (error) {
              if ((error as NodeJS.ErrnoException).code === "ENOENT")
                return false
              throw error
            }
          }
          const candidates = stages.filter(
            ({ publicPath, markerPath }) =>
              !exists(publicPath) && exists(markerPath),
          )
          const active = candidates.at(-1)
          if (active === undefined) {
            throw new TypeError("MATRIX_PLAN_262_19_INTERRUPTION_INVALID")
          }
          const activeIndex = stages.findIndex(
            ({ stage }) => stage === active.stage,
          )
          for (const later of stages.slice(activeIndex + 1)) {
            if (exists(later.publicPath) || exists(later.markerPath)) {
              throw new TypeError("MATRIX_PLAN_262_19_INTERRUPTION_INVALID")
            }
          }
          return active.stage
        })()
  const needs = plan26219Needs(
    disposition,
    obstructionProof?.stage,
    interruptedStage,
  )
  const route = checkV138Plan26219AuthorityRoute({
    repoRoot,
    authorizationValue: plan26216Read(
      plan26219Path(repoRoot, supplied.authorization, "authorization"),
      true,
    )!.value,
    sealValue: plan26216Read(
      plan26219Path(repoRoot, supplied.seal, "seal"),
      true,
    )!.value,
    sourceA2,
    sourceB2,
  })
  const value = (key: "context" | "preflight" | "calibration" | "reproduction") =>
    obstructionProof?.path === supplied[key]
      ? undefined
      : plan26216Read(
      plan26219Path(repoRoot, supplied[key], key),
      needs[key],
    )?.value
  const contextValue = value("context")
  const context =
    contextValue === undefined
    ? undefined
    : checkV138ExecutionContextV6Receipt(contextValue, {
        repoRoot,
        authorization: route.authorization,
        seal: route.seal,
        sourceB2Custody: route.custody,
      })
  const preflightValue = value("preflight")
  const preflight =
    preflightValue === undefined || context === undefined
      ? undefined
      : checkV138HostHeadroomPreflightV6Receipt(preflightValue, context)
  const calibrationValue = value("calibration")
  const calibration =
    calibrationValue === undefined
    ? undefined
    : checkV138ParallelCalibrationV6Receipt(
        enumerateV138CurrentMatrix(repoRoot),
        calibrationValue,
      )
  const reproductionValue = value("reproduction")
  const reproduction =
    reproductionValue === undefined ||
    context === undefined ||
    preflight === undefined ||
    calibration === undefined
      ? undefined
      : checkV138AuthoritativeMatrixV7Receipt(reproductionValue, {
          repoRoot,
          executionContext: context,
          preflight,
          calibration,
        })
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const markerNeeds = plan26219MarkerNeeds(
    disposition,
    needs,
    interruptedStage,
  )
  const consumptionMarkerRoots = {
    preflight:
      !markerNeeds.preflight || context === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "preflight",
            context,
            predecessorRoot: context.receiptRoot,
            chargedAttemptIds: ["preflight:v6:0"],
          }).markerRoot,
    calibration:
      !markerNeeds.calibration ||
      context === undefined ||
      preflight === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "calibration",
            context,
            predecessorRoot: preflight.receiptRoot,
            chargedAttemptIds: deriveV138CalibrationAttemptMappings(
              inventory,
              "v6",
            ).map(({ executionAttemptId }) => executionAttemptId),
          }).markerRoot,
    reproduction:
      !markerNeeds.reproduction ||
      context === undefined ||
      calibration === undefined
        ? null
        : checkV138Plan26219ConsumptionMarker({
            repoRoot,
            stage: "reproduction",
            context,
            predecessorRoot: calibration.receiptRoot,
            chargedAttemptIds: planV138MatrixShards(inventory).shards.flatMap(
              ({ attemptIds }) =>
                attemptIds.map((attemptId) => `reproduction:v6:${attemptId}`),
            ),
          }).markerRoot,
  } as const
  const interruptionProof =
    interruptedStage === undefined
      ? undefined
      : Object.freeze({
          stage: interruptedStage,
          markerRoot: consumptionMarkerRoots[interruptedStage]!,
          chargedAttemptCount:
            interruptedStage === "preflight"
              ? 1 as const
              : interruptedStage === "calibration"
                ? 8 as const
                : 540 as const,
          observationMode: "unknown_after_consumption" as const,
          childLaunchCount: null,
          terminalOutcomeCount: null,
          completeCleanup: false as const,
        })
  const terminal = buildV138Plan26219TerminalV2({
    disposition,
    authorization: route.authorization,
    seal: route.seal,
    sourceA2,
    sourceB2,
    context,
    preflight,
    calibration,
    reproduction,
    consumptionMarkerRoots,
    obstructionProof,
    interruptionProof,
  })
  writeV138Plan26219Immutable(target, parentChain, terminal)
  return terminal
}

const plan26216Needs = (disposition: V138Plan26216TerminalDisposition) => {
  const beforeObservation = [
    "tool_identity_failed",
    "protected_history_failed",
    "formation_absence_failed",
    "pattern_c_ownership_failed",
  ].includes(disposition)
  return {
    context: !beforeObservation,
    preflight: !beforeObservation,
    calibration: !beforeObservation,
    reproduction:
      disposition === "reproduction_stopped" ||
      disposition === "reproduction_passed",
  }
}

export const checkV138Plan26216TerminalBranch = (
  repoRoot: string,
  supplied: Plan26216Paths,
  sourceA: string,
  sourceB: string,
  inspection: Readonly<{
    readArtifact?: typeof plan26216Read
    checkSourceB?: typeof checkV138SuccessorSealCommit
    onInspection?: (
      event:
        | Readonly<{ kind: "artifact"; target: string }>
        | Readonly<{ kind: "sourceB" }>,
    ) => void
  }> = {},
): V138Plan26216TerminalDisposition => {
  const resolved = Object.fromEntries(
    (Object.keys(PLAN_262_16_PATHS) as Array<keyof typeof PLAN_262_16_PATHS>)
      .map((key) => [key, plan26216Path(repoRoot, supplied[key], key)]),
  ) as Record<keyof typeof PLAN_262_16_PATHS, string>
  const readArtifact = (target: string, required: boolean) => {
    inspection.onInspection?.({ kind: "artifact", target })
    return (inspection.readArtifact ?? plan26216Read)(target, required)
  }
  // Discriminator first: no evidence path is inspected before this read.
  const terminal = readArtifact(resolved.terminal, true)!
  const terminalValue = terminal.value
  const disposition = terminalValue.disposition
  const allowed = [
    "tool_identity_failed",
    "protected_history_failed",
    "formation_absence_failed",
    "pattern_c_ownership_failed",
    "preflight_unavailable",
    "preflight_refused",
    "calibration_stopped",
    "reproduction_stopped",
    "reproduction_passed",
  ]
  if (
    !hasExactKeys(terminalValue, [
      "schemaVersion",
      "disposition",
      "sourceB",
      "sourceBCustodyRoot",
      "authorityExpired",
      "noRetry",
      "artifactRoots",
      "terminalRoot",
    ]) ||
    terminalValue.schemaVersion !== "v1.38-plan-262-16-terminal-v1" ||
    terminalValue.sourceB !== sourceB ||
    !/^[0-9a-f]{40}$/u.test(String(terminalValue.sourceB)) ||
    !isV138CanonicalSha256(terminalValue.sourceBCustodyRoot) ||
    typeof disposition !== "string" ||
    !allowed.includes(disposition) ||
    terminalValue.authorityExpired !== true ||
    terminalValue.noRetry !== true
  ) throw new TypeError("MATRIX_PLAN_262_16_TERMINAL_INVALID")
  const { terminalRoot, ...terminalBody } = terminalValue
  if (
    terminalRoot !==
    v138SuccessorRoot(
      "canonicalJsonProfile",
      "v1.38-plan-262-16-terminal-v1",
      terminalBody,
    )
  ) throw new TypeError("MATRIX_PLAN_262_16_TERMINAL_INVALID")
  const typed = disposition as V138Plan26216TerminalDisposition
  const needs = plan26216Needs(typed)
  const artifactRoots = exactRecord(
    terminalValue.artifactRoots,
    [
      "authorization", "seal", "context", "preflight", "calibration",
      "reproduction",
    ],
    "MATRIX_PLAN_262_16_TERMINAL_ROOTS_INVALID",
  )
  const requiredRoots = {
    authorization: true,
    seal: true,
    context: needs.context,
    preflight: needs.preflight,
    calibration: needs.calibration,
    reproduction: needs.reproduction,
  }
  if (
    Object.entries(requiredRoots).some(([key, required]) =>
      required
        ? !isV138CanonicalSha256(artifactRoots[key])
        : artifactRoots[key] !== null,
    )
  ) throw new TypeError("MATRIX_PLAN_262_16_TERMINAL_ROOTS_INVALID")
  inspection.onInspection?.({ kind: "sourceB" })
  const sourceBCustody = (
    inspection.checkSourceB ?? checkV138SuccessorSealCommit
  )({ repoRoot, sourceA, sourceB })
  if (
    terminalValue.sourceB !== sourceBCustody.sourceB ||
    terminalValue.sourceBCustodyRoot !== sourceBCustody.custodyRoot
  ) throw new TypeError("MATRIX_PLAN_262_16_TERMINAL_INVALID")
  const authorizationArtifact = readArtifact(resolved.authorization, true)!
  const sealArtifact = readArtifact(resolved.seal, true)!
  const { authorization, seal } = checkV138AuthorizationSealRoute({
    repoRoot,
    authorizationValue: authorizationArtifact.value,
    sealValue: sealArtifact.value,
    sourceBCustody,
    failureCode: "MATRIX_PLAN_262_16_SEAL_JOIN_INVALID",
  })
  const contextArtifact = readArtifact(resolved.context, needs.context)
  const preflightArtifact = readArtifact(resolved.preflight, needs.preflight)
  const calibrationArtifact = readArtifact(
    resolved.calibration,
    needs.calibration,
  )
  const reproductionArtifact = readArtifact(
    resolved.reproduction,
    needs.reproduction,
  )
  const context =
    contextArtifact === undefined
    ? undefined
      : checkV138ExecutionContextV5Receipt(
          contextArtifact.value,
          sourceBCustody,
        )
  const preflight =
    preflightArtifact === undefined
    ? undefined
    : checkV138HostHeadroomPreflightV5Receipt(preflightArtifact.value)
  const calibration =
    calibrationArtifact === undefined
    ? undefined
      : checkV138ParallelCalibrationV5Receipt(
          calibrationArtifact.value,
          repoRoot,
        )
  const reproduction =
    reproductionArtifact === undefined
    ? undefined
    : checkV138AuthoritativeMatrixV6Receipt(reproductionArtifact.value, {
        repoRoot,
        executionContext: context!,
        calibration: calibration!,
      })
  if (context !== undefined) {
    checkV138ExecutionContextSealJoin({
      context,
      authorization,
      seal,
      sourceBCustody,
      failureCode: "MATRIX_PLAN_262_16_CONTEXT_JOIN_INVALID",
    })
  }
  if (
    preflight !== undefined &&
    (preflight.executionContextRoot !== context?.receiptRoot ||
      preflight.authorizationRoot !== authorization.authorizationRoot ||
      preflight.sealRoot !== seal.sealRoot ||
      preflight.sourceB !== sourceBCustody.sourceB ||
      preflight.sourceBCustodyRoot !== sourceBCustody.custodyRoot)
  ) throw new TypeError("MATRIX_PLAN_262_16_PREFLIGHT_JOIN_INVALID")
  if (
    calibration !== undefined &&
    (calibration.preflightRoot !== preflight?.receiptRoot ||
      calibration.executionContextRoot !== context?.receiptRoot ||
      calibration.sourceB !== sourceBCustody.sourceB ||
      calibration.sourceBCustodyRoot !== sourceBCustody.custodyRoot)
  ) throw new TypeError("MATRIX_PLAN_262_16_CALIBRATION_JOIN_INVALID")
  if (
    (typed === "preflight_unavailable" || typed === "preflight_refused") &&
    calibration?.childLaunchCount !== 0
  ) throw new TypeError("MATRIX_PLAN_262_16_CHILD_COUNT_INVALID")
  if (
    reproduction !== undefined &&
    (reproduction.executionContextRoot !== context?.receiptRoot ||
      reproduction.calibrationRoot !== calibration?.receiptRoot ||
      reproduction.sourceB !== sourceBCustody.sourceB ||
      reproduction.sourceBCustodyRoot !== sourceBCustody.custodyRoot)
  ) throw new TypeError("MATRIX_PLAN_262_16_REPRODUCTION_JOIN_INVALID")
  const dispositionValid =
    (typed === "preflight_unavailable" &&
      preflight?.disposition === "preflight_unavailable" &&
      calibration?.status === "stopped_process_failure") ||
    (typed === "preflight_refused" &&
      preflight?.disposition === "preflight_refused" &&
      calibration?.status === "stopped_process_failure") ||
    (typed === "calibration_stopped" &&
      preflight?.disposition === "preflight_admitted" &&
      calibration?.status === "stopped_process_failure") ||
    (typed === "reproduction_stopped" &&
      calibration?.status === "admitted" &&
      reproduction?.status === "stopped_process_failure") ||
    (typed === "reproduction_passed" &&
      calibration?.status === "admitted" &&
      reproduction?.status === "passed_exact") ||
    (
      [
      "tool_identity_failed",
      "protected_history_failed",
      "formation_absence_failed",
      "pattern_c_ownership_failed",
      ] as string[]
    ).includes(typed)
  if (!dispositionValid) {
    throw new TypeError("MATRIX_PLAN_262_16_DISPOSITION_JOIN_INVALID")
  }
  const actualRoots = {
    authorization: authorizationArtifact.root,
    seal: sealArtifact.root,
    context: contextArtifact?.root ?? null,
    preflight: preflightArtifact?.root ?? null,
    calibration: calibrationArtifact?.root ?? null,
    reproduction: reproductionArtifact?.root ?? null,
  }
  if (canonical(artifactRoots) !== canonical(actualRoots)) {
    throw new TypeError("MATRIX_PLAN_262_16_TERMINAL_ROOTS_INVALID")
  }
  return typed
}

export const writeV138Plan26216Terminal = (
  repoRoot: string,
  supplied: Plan26216Paths,
  disposition: V138Plan26216TerminalDisposition,
  sourceA: string,
  sourceB: string,
) => {
  const sourceBCustody = checkV138SuccessorSealCommit({
    repoRoot,
    sourceA,
    sourceB,
  })
  if (
    ![
    "tool_identity_failed",
    "protected_history_failed",
    "formation_absence_failed",
    "pattern_c_ownership_failed",
    "preflight_unavailable",
    "preflight_refused",
    "calibration_stopped",
    "reproduction_stopped",
    "reproduction_passed",
    ].includes(disposition)
  ) {
    throw new TypeError("MATRIX_PLAN_262_16_DISPOSITION_INVALID")
  }
  const needs = plan26216Needs(disposition)
  const rootFor = (key: keyof typeof PLAN_262_16_PATHS, required: boolean) => {
    const target = plan26216Path(repoRoot, supplied[key], key)
    const value = plan26216Read(target, required)
    return value?.root ?? null
  }
  const body = {
    schemaVersion: "v1.38-plan-262-16-terminal-v1" as const,
    disposition,
    sourceB: sourceBCustody.sourceB,
    sourceBCustodyRoot: sourceBCustody.custodyRoot,
    authorityExpired: true as const,
    noRetry: true as const,
    artifactRoots: {
      authorization: rootFor("authorization", true),
      seal: rootFor("seal", true),
      context: rootFor("context", needs.context),
      preflight: rootFor("preflight", needs.preflight),
      calibration: rootFor("calibration", needs.calibration),
      reproduction: rootFor("reproduction", needs.reproduction),
    },
  }
  const terminal = deepFreeze({
    ...body,
    terminalRoot: v138SuccessorRoot(
      "canonicalJsonProfile",
      body.schemaVersion,
      body,
    ),
  })
  writeV138ImmutableReceipt(
    plan26216Path(repoRoot, supplied.terminal, "terminal"),
    terminal,
  )
  checkV138Plan26216TerminalBranch(repoRoot, supplied, sourceA, sourceB)
  return terminal
}

const V138_RECEIPT_DIRECT_COMMANDS = Object.freeze(
  new Set([
  "--write-execution-context-v9-receipt",
  "--write-headroom-preflight-v9-receipt",
  "--calibrate-parallel-v9-receipt",
  "--write-authoritative-v10-receipt",
  "--write-plan-262-30-terminal-v1",
  "--check-plan-262-30-terminal-v1",
  "--write-execution-context-v8-receipt",
  "--write-headroom-preflight-v8-receipt",
  "--calibrate-parallel-v8-receipt",
  "--write-authoritative-v9-receipt",
  "--write-plan-262-25-terminal-v1",
  "--check-plan-262-25-terminal-v1",
  "--check-plan-262-25-preflight-v8",
  "--write-execution-context-v7-receipt",
  "--write-headroom-preflight-v7-receipt",
  "--calibrate-parallel-v7-receipt",
  "--write-authoritative-v8-receipt",
  "--write-plan-262-22-terminal-v1",
  "--check-plan-262-22-terminal-v1",
  "--write-execution-context-v6-receipt",
  "--write-headroom-preflight-v6-receipt",
  "--calibrate-parallel-v6-receipt",
  "--write-authoritative-v7-receipt",
  "--write-plan-262-19-terminal-v2",
  "--check-plan-262-19-terminal-v2",
  "--write-execution-context-v5-receipt",
  "--write-headroom-preflight-v5-receipt",
  "--calibrate-parallel-v5-receipt",
  "--write-authoritative-v6-receipt",
  "--write-plan-262-16-terminal-v1",
  "--check-plan-262-16-terminal",
  "--write-diagnostic-v2-receipt",
  "--check-diagnostic-v2-receipt",
  "--write-execution-context-v4-receipt",
  "--check-execution-context-v4-receipt",
  "--write-headroom-preflight-v4-receipt",
  "--check-headroom-preflight-v4-receipt",
  "--calibrate-parallel-v4-receipt",
  "--check-calibration-v4-receipt",
  "--write-authoritative-v5-receipt",
  "--check-successor-v4-v5-branch",
  "--write-headroom-preflight-v3-receipt",
  "--check-headroom-preflight-v3-receipt",
  "--calibrate-parallel-v3-receipt",
  "--check-calibration-v3-receipt",
  "--write-authoritative-v4-receipt",
  "--check-authoritative-v4-receipt",
  "--check-successor-v3-v4-branch",
  "--calibrate-parallel-v2-receipt",
  "--check-calibration-v2-receipt",
  "--write-authoritative-v3-receipt",
  "--check-authoritative-v3-receipt",
  "--check-successor-v2-v3-branch",
  "--calibrate-parallel-receipt",
  "--check-calibration-receipt",
  "--require-calibration-admitted",
  "--require-stopped-process-failure",
  ]),
)

export const V138_PLAN_262_25_DISPOSITIONS = Object.freeze([
  "tool_identity_failed", "protected_history_failed",
  "formation_absence_failed", "pattern_c_ownership_failed",
  "fresh_destination_failed", "consumed_stage_interrupted",
  "preflight_unavailable", "preflight_refused", "calibration_stopped",
  "reproduction_stopped", "reproduction_passed",
] as const)

export const V138_PLAN_262_25_ROUTE_CONTRACT = Object.freeze({
  schemaVersion: "v1.38-plan-262-25-route-contract-v1" as const,
  routeOrdinal: 4 as const,
  authorizationSchema: V138_PLAN_262_24_AUTHORIZATION_SCHEMA,
  sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V4_SCHEMA,
  executionContextSchema:
    "v1.38-current-matrix-execution-context-v8" as const,
  preflightSchema:
    "v1.38-current-matrix-headroom-preflight-v8" as const,
  calibrationSchema: "v1.38-current-matrix-calibration-v8" as const,
  reproductionSchema: "v1.38-current-matrix-reproduction-v9" as const,
  consumptionSchema: "v1.38-plan-262-25-consumption-v1" as const,
  terminalSchema: "v1.38-plan-262-25-terminal-v1" as const,
  terminalDispositions: V138_PLAN_262_25_DISPOSITIONS,
  failureProtocolSchema: V138_CURRENT_MATRIX_CHILD_PROTOCOL_SCHEMA,
  resourceSampleMilliseconds: 200 as const,
  requiredHostHeadroomBasisPoints: 2500 as const,
  calibrationAttemptCount: 8 as const,
  calibrationShardCount: 4 as const,
  reproductionCellCount: 540 as const,
  canonicalDestinations: V138_PLAN_262_25_FRESH_DESTINATIONS,
  noRetry: true as const,
  partialAcceptedEvidenceReusable: false as const,
})

export const checkV138Plan26225RouteContract = (value: unknown) => {
  if (canonical(value) !== canonical(V138_PLAN_262_25_ROUTE_CONTRACT)) {
    throw new TypeError("MATRIX_PLAN_262_25_ROUTE_CONTRACT_INVALID")
  }
  return V138_PLAN_262_25_ROUTE_CONTRACT
}

const PLAN_262_25_PATHS = Object.freeze({
  authorization: ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v4.json",
  context: V138_PLAN_262_25_FRESH_DESTINATIONS[0],
  preflight: V138_PLAN_262_25_FRESH_DESTINATIONS[1],
  calibration: V138_PLAN_262_25_FRESH_DESTINATIONS[2],
  reproduction: V138_PLAN_262_25_FRESH_DESTINATIONS[3],
  terminal: V138_PLAN_262_25_FRESH_DESTINATIONS[4],
  preflightMarker: V138_PLAN_262_25_FRESH_DESTINATIONS[5],
  calibrationMarker: V138_PLAN_262_25_FRESH_DESTINATIONS[6],
  reproductionMarker: V138_PLAN_262_25_FRESH_DESTINATIONS[7],
})

const plan26225Path = (repoRoot: string, supplied: string,
  key: keyof typeof PLAN_262_25_PATHS): string => {
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, PLAN_262_25_PATHS[key])) {
    throw new TypeError("MATRIX_PLAN_262_25_PATH_INVALID")
  }
  return resolved
}

const readPlan26225 = (repoRoot: string, key: keyof typeof PLAN_262_25_PATHS,
  required = true): unknown => {
  const target = path.resolve(repoRoot, PLAN_262_25_PATHS[key])
  if (!existsSync(target)) {
    if (required) throw new TypeError(`MATRIX_PLAN_262_25_${key.toUpperCase()}_REQUIRED`)
    return undefined
  }
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError(`MATRIX_PLAN_262_25_${key.toUpperCase()}_INVALID`)
  }
  try { return JSON.parse(readFileSync(target, "utf8")) } catch {
    throw new TypeError(`MATRIX_PLAN_262_25_${key.toUpperCase()}_INVALID`)
  }
}

const checkV138Plan26224AuthorityRoute = (input: { repoRoot: string;
  sourceA4: string; sourceB4: string; authorizationValue: unknown;
  sealValue: unknown }) => {
  const custody = checkV138SuccessorSealCommitV4({ repoRoot: input.repoRoot,
    sourceA4: input.sourceA4, sourceB4: input.sourceB4,
    allowPlan26225Artifacts: true })
  const authorization = checkV138Plan26224AuthorizationV4(input.repoRoot,
    input.authorizationValue)
  const seal = checkV138SuccessorSourceSealV4(input.repoRoot, input.sealValue,
    authorization)
  checkV138SealedWorktreeAtA4(input.repoRoot, seal)
  if (custody.authorizationRoot !== authorization.authorizationRoot ||
    custody.sealRoot !== seal.sealRoot) {
    throw new TypeError("MATRIX_PLAN_262_25_AUTHORITY_JOIN_INVALID")
  }
  return { custody, authorization, seal }
}

type V138Route4 = ReturnType<typeof checkV138Plan26224AuthorityRoute>

const checkRegistryV4 = (value: unknown) => {
  const registry = exactRecord(value,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V8_REGISTRY_INVALID")
  if (registry.schemaVersion !==
    "v1.38-plan-262-25-terminal-agent-registry-v1" ||
    registry.activeExecutorCount !== 0 || !Array.isArray(registry.agents) ||
    registry.agents.some((entry) => {
      const agent = exactRecord(entry, ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V8_REGISTRY_INVALID")
      return typeof agent.id !== "string" || agent.id.length === 0 ||
        !["completed", "failed"].includes(String(agent.status))
    })) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V8_REGISTRY_INVALID")
  return registry
}

export const buildV138ExecutionContextV8Receipt = (input: { route: V138Route4;
  mode: string; cwd: string; terminalAgentRegistry: unknown }) => {
  if (input.mode !== "gsd-pattern-c-inline-main" ||
    input.cwd !== "/Users/roryquinlan/runtime/cowards-game") {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V8_ROUTE_INVALID")
  }
  const body = { schemaVersion:
    "v1.38-current-matrix-execution-context-v8" as const,
    mode: input.mode, cwd: input.cwd,
    terminalAgentRegistry: checkRegistryV4(input.terminalAgentRegistry),
    sourceA4: input.route.custody.sourceA4,
    sourceB4: input.route.custody.sourceB4,
    sourceB4Custody: input.route.custody,
    sourceB4CustodyRoot: input.route.custody.custodyRoot,
    authorizationRoot: input.route.authorization.authorizationRoot,
    sealRoot: input.route.seal.sealRoot,
    selectedRouteClosureRoot: input.route.seal.selectedRouteClosure.closureRoot,
    protectedHistoryRoot:
      input.route.seal.protectedHistory.protectedHistoryRoot,
    priorAuthorizationBytes:
      input.route.seal.protectedHistory.priorAuthorizationBytes,
    patternCOwnership: "main_orchestrator_only" as const,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    resourceSampleMilliseconds: 200 as const, acceptedCellCount: 0 as const,
    noRetry: true as const }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const checkV138ExecutionContextV8Receipt = (value: unknown,
  route?: V138Route4) => {
  const receipt = exactRecord(value, ["schemaVersion", "mode", "cwd",
    "terminalAgentRegistry", "sourceA4", "sourceB4", "sourceB4Custody",
    "sourceB4CustodyRoot", "authorizationRoot", "sealRoot",
    "selectedRouteClosureRoot", "protectedHistoryRoot",
    "priorAuthorizationBytes", "patternCOwnership", "formationAbsenceBound",
    "runtimeRoute", "resourceSampleMilliseconds", "acceptedCellCount",
    "noRetry", "receiptRoot"], "MATRIX_EXECUTION_CONTEXT_V8_INVALID")
  checkRegistryV4(receipt.terminalAgentRegistry)
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-execution-context-v8" ||
    receipt.mode !== "gsd-pattern-c-inline-main" ||
    receipt.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    receipt.patternCOwnership !== "main_orchestrator_only" ||
    receipt.formationAbsenceBound !== true ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.resourceSampleMilliseconds !== 200 ||
    receipt.acceptedCellCount !== 0 || receipt.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body) || route !== undefined && (
      receipt.sourceA4 !== route.custody.sourceA4 ||
      receipt.sourceB4 !== route.custody.sourceB4 ||
      canonical(receipt.sourceB4Custody) !== canonical(route.custody) ||
      receipt.authorizationRoot !== route.authorization.authorizationRoot ||
      receipt.sealRoot !== route.seal.sealRoot ||
      receipt.selectedRouteClosureRoot !==
        route.seal.selectedRouteClosure.closureRoot ||
      receipt.protectedHistoryRoot !==
        route.seal.protectedHistory.protectedHistoryRoot ||
      canonical(receipt.priorAuthorizationBytes) !== canonical(
        route.seal.protectedHistory.priorAuthorizationBytes))) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V8_INVALID")
  }
  return deepFreeze(receipt)
}

export const buildV138HostHeadroomPreflightV8Receipt = (input: {
  result: V138DarwinHeadroomResult; context: Record<string, unknown> }) => {
  const context = checkV138ExecutionContextV8Receipt(input.context)
  const observation = input.result.ok ? {
    stdoutByteLength: input.result.observation.stdoutByteLength,
    stdoutSha256: input.result.observation.stdoutSha256,
    totalBytes: input.result.observation.totalBytes,
    pageCount: input.result.observation.pageCount,
    pageSizeBytes: input.result.observation.pageSizeBytes,
    percentage: input.result.observation.percentage,
    observedBasisPoints: input.result.observation.observedBasisPoints,
  } : null
  const body = { schemaVersion:
    "v1.38-current-matrix-headroom-preflight-v8" as const,
    sourceA4: context.sourceA4, sourceB4: context.sourceB4,
    executionContextRoot: context.receiptRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    chargedIdentityId: "preflight:v8:0" as const,
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    requiredHostHeadroomBasisPoints: 2500 as const, observation,
    disposition: input.result.ok ? input.result.observation.disposition :
      "preflight_unavailable" as const,
    acceptedCellCount: 0 as const, noRetry: true as const }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body) })
}

export const checkV138HostHeadroomPreflightV8Receipt = (value: unknown,
  contextValue: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV8Receipt(contextValue)
  const receipt = exactRecord(value, ["schemaVersion", "sourceA4", "sourceB4",
    "executionContextRoot", "authorizationRoot", "sealRoot",
    "chargedIdentityId", "metricId", "providerId", "parserId",
    "requiredHostHeadroomBasisPoints", "observation", "disposition",
    "acceptedCellCount", "noRetry", "receiptRoot"],
  "MATRIX_PREFLIGHT_V8_INVALID")
  const observed = receipt.observation === null ? null : exactRecord(
    receipt.observation, ["stdoutByteLength", "stdoutSha256", "totalBytes",
      "pageCount", "pageSizeBytes", "percentage", "observedBasisPoints"],
    "MATRIX_PREFLIGHT_V8_INVALID")
  const expectedDisposition = observed === null ? "preflight_unavailable" :
    Number(observed.observedBasisPoints) >= 2500 ? "preflight_admitted" :
      "preflight_refused"
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !==
    "v1.38-current-matrix-headroom-preflight-v8" ||
    receipt.sourceA4 !== context.sourceA4 ||
    receipt.sourceB4 !== context.sourceB4 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.authorizationRoot !== context.authorizationRoot ||
    receipt.sealRoot !== context.sealRoot ||
    receipt.chargedIdentityId !== "preflight:v8:0" ||
    receipt.metricId !== V138_DARWIN_HEADROOM_METRIC_ID ||
    receipt.providerId !== V138_DARWIN_HEADROOM_PROVIDER_ID ||
    receipt.parserId !== V138_DARWIN_HEADROOM_PARSER_ID ||
    receipt.requiredHostHeadroomBasisPoints !== 2500 ||
    receipt.disposition !== expectedDisposition ||
    receipt.acceptedCellCount !== 0 || receipt.noRetry !== true ||
    observed !== null && (!Number.isSafeInteger(observed.stdoutByteLength) ||
      Number(observed.stdoutByteLength) <= 0 ||
      Number(observed.stdoutByteLength) > 4096 ||
      !isV138CanonicalSha256(observed.stdoutSha256) ||
      !Number.isSafeInteger(observed.totalBytes) ||
      Number(observed.totalBytes) <= 0 ||
      !Number.isSafeInteger(observed.pageCount) ||
      Number(observed.pageCount) <= 0 ||
      !Number.isSafeInteger(observed.pageSizeBytes) ||
      Number(observed.pageSizeBytes) <= 0 ||
      !Number.isSafeInteger(Number(observed.pageCount) *
        Number(observed.pageSizeBytes)) ||
      Number(observed.totalBytes) !== Number(observed.pageCount) *
        Number(observed.pageSizeBytes) ||
      !Number.isSafeInteger(observed.percentage) ||
      Number(observed.percentage) < 0 || Number(observed.percentage) > 100 ||
      !Number.isSafeInteger(observed.observedBasisPoints) ||
      Number(observed.observedBasisPoints) !==
        Number(observed.percentage) * 100) ||
    receiptRoot !== v138SuccessorRoot("canonicalJsonProfile",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_PREFLIGHT_V8_INVALID")
  }
  return deepFreeze(receipt)
}

const writeV138Plan26225Marker = (repoRoot: string, stage: "preflight" |
  "calibration" | "reproduction", context: Record<string, unknown>,
  predecessorRoot: unknown, chargedAttemptIds: readonly string[]) => {
  const key = `${stage}Marker` as "preflightMarker" | "calibrationMarker" |
    "reproductionMarker"
  const target = plan26225Path(repoRoot, PLAN_262_25_PATHS[key], key)
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const body = { schemaVersion: "v1.38-plan-262-25-consumption-v1" as const,
    stage, sourceA4: context.sourceA4, sourceB4: context.sourceB4,
    sourceB4CustodyRoot: context.sourceB4CustodyRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    executionContextRoot: context.receiptRoot, predecessorRoot,
    chargedAttemptCount: chargedAttemptIds.length,
    chargedAttemptRoot: v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-25-${stage}-charged-attempts-v1`, chargedAttemptIds),
    noRetry: true as const }
  const marker = deepFreeze({ ...body, markerRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body) })
  writeV138Plan26219Immutable(target, chain, marker)
  return marker
}

export const checkV138Plan26225ConsumptionMarker = (repoRoot: string,
  stage: "preflight" | "calibration" | "reproduction",
  context: Record<string, unknown>, predecessorRoot: unknown,
  chargedAttemptIds: readonly string[]) => {
  const checkedContext = checkV138ExecutionContextV8Receipt(context)
  const key = `${stage}Marker` as "preflightMarker" | "calibrationMarker" |
    "reproductionMarker"
  const value = readPlan26225(repoRoot, key)
  const marker = exactRecord(value, ["schemaVersion", "stage", "sourceA4",
    "sourceB4", "sourceB4CustodyRoot", "authorizationRoot", "sealRoot",
    "executionContextRoot", "predecessorRoot", "chargedAttemptCount",
    "chargedAttemptRoot", "noRetry", "markerRoot"],
  "MATRIX_PLAN_262_25_CONSUMPTION_MARKER_INVALID")
  const { markerRoot, ...body } = marker
  if (marker.schemaVersion !== "v1.38-plan-262-25-consumption-v1" ||
    marker.stage !== stage || marker.sourceA4 !== checkedContext.sourceA4 ||
    marker.sourceB4 !== checkedContext.sourceB4 ||
    marker.sourceB4CustodyRoot !== checkedContext.sourceB4CustodyRoot ||
    marker.authorizationRoot !== checkedContext.authorizationRoot ||
    marker.sealRoot !== checkedContext.sealRoot ||
    marker.executionContextRoot !== checkedContext.receiptRoot ||
    marker.predecessorRoot !== predecessorRoot ||
    marker.chargedAttemptCount !== chargedAttemptIds.length ||
    marker.chargedAttemptRoot !== v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-25-${stage}-charged-attempts-v1`, chargedAttemptIds) ||
    marker.noRetry !== true || markerRoot !== v138SuccessorRoot(
      "evidenceBundle", String(marker.schemaVersion), body)) {
    throw new TypeError("MATRIX_PLAN_262_25_CONSUMPTION_MARKER_INVALID")
  }
  return deepFreeze(marker)
}

const assertV138Plan26225AuthorityOpen = (repoRoot: string) => {
  if (existsSync(path.resolve(repoRoot, PLAN_262_25_PATHS.terminal))) {
    throw new TypeError("MATRIX_PLAN_262_25_AUTHORITY_EXPIRED")
  }
}

const assertV138Plan26225PublicationRoute = (repoRoot: string,
  sourceA4: string, sourceB4: string, expectedRoute: V138Route4): V138Route4 => {
  assertV138Plan26225AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4,
    sourceB4, authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  if (canonical(currentRoute) !== canonical(expectedRoute)) {
    throw new TypeError("MATRIX_PLAN_262_25_AUTHORITY_CHANGED")
  }
  return currentRoute
}

export const checkV138Plan26225PrerequisiteRoots = (
  expected: Readonly<Record<string, unknown>>,
  current: Readonly<Record<string, unknown>>,
): true => {
  const keys = Object.keys(expected)
  if (keys.length !== Object.keys(current).length || keys.some((key) =>
    !Object.hasOwn(current, key) || expected[key] !== current[key])) {
    throw new TypeError("MATRIX_PLAN_262_25_PREREQUISITE_CHANGED")
  }
  return true
}

export const writeV138ExecutionContextV8Receipt = (repoRoot: string,
  targetPath: string, mode: string, cwd: string,
  terminalAgentRegistry: unknown, authorizationPath: string, sealPath: string,
  sourceA4: string, sourceB4: string) => {
  assertV138Plan26225AuthorityOpen(repoRoot)
  for (const repoPath of V138_PLAN_262_25_FRESH_DESTINATIONS) {
    if (existsSync(path.resolve(repoRoot, repoPath))) {
      throw new TypeError("MATRIX_PLAN_262_25_DESTINATION_NOT_FRESH")
    }
  }
  const target = plan26225Path(repoRoot, targetPath, "context")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  plan26225Path(repoRoot, authorizationPath, "authorization")
  plan26225Path(repoRoot, sealPath, "seal")
  const receipt = checkV138ExecutionContextV8Receipt(
    buildV138ExecutionContextV8Receipt({ route, mode, cwd,
      terminalAgentRegistry }), route)
  assertV138Plan26225PublicationRoute(repoRoot, sourceA4, sourceB4, route)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const writeV138HostHeadroomPreflightV8Receipt = async (
  repoRoot: string, targetPath: string, contextPath: string,
  authorizationPath: string, sealPath: string, sourceA4: string,
  sourceB4: string, observe: () => Promise<V138DarwinHeadroomResult> = () =>
    observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ)) => {
  assertV138Plan26225AuthorityOpen(repoRoot)
  const target = plan26225Path(repoRoot, targetPath, "preflight")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26225Path(repoRoot, contextPath, "context")
  plan26225Path(repoRoot, authorizationPath, "authorization")
  plan26225Path(repoRoot, sealPath, "seal")
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const context = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), route)
  writeV138Plan26225Marker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v8:0"])
  let result: V138DarwinHeadroomResult
  try { result = await observe() } catch {
    result = { ok: false, reason: "resource_measurement_unavailable" }
  }
  assertV138Plan26225AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4,
    sourceB4, authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), currentRoute)
  checkV138Plan26225PrerequisiteRoots({ context: context.receiptRoot },
    { context: currentContext.receiptRoot })
  checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v8:0"])
  const receipt = checkV138HostHeadroomPreflightV8Receipt(
    buildV138HostHeadroomPreflightV8Receipt({ result,
      context: currentContext }), currentContext)
  assertV138Plan26225PublicationRoute(repoRoot, sourceA4, sourceB4,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const checkV138Plan26225PreflightV8 = (repoRoot: string,
  sourceA4: string, sourceB4: string) => {
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const context = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(
    readPlan26225(repoRoot, "preflight"), context)
  const marker = checkV138Plan26225ConsumptionMarker(repoRoot, "preflight",
    context, context.receiptRoot, ["preflight:v8:0"])
  return deepFreeze({ routeOrdinal: 4 as const, contextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot, markerRoot: marker.markerRoot,
    disposition: preflight.disposition })
}

type V138Route3 = ReturnType<typeof checkV138Plan26221AuthorityRoute>

const PLAN_262_22_PATHS = Object.freeze({
  authorization: V138_PLAN_262_21_CANONICAL_PATHS.authorization,
  seal: V138_PLAN_262_21_CANONICAL_PATHS.seal,
  context: V138_PLAN_262_22_FRESH_DESTINATIONS[0],
  preflight: V138_PLAN_262_22_FRESH_DESTINATIONS[1],
  calibration: V138_PLAN_262_22_FRESH_DESTINATIONS[2],
  reproduction: V138_PLAN_262_22_FRESH_DESTINATIONS[3],
  terminal: V138_PLAN_262_22_FRESH_DESTINATIONS[4],
  preflightMarker: V138_PLAN_262_22_FRESH_DESTINATIONS[5],
  calibrationMarker: V138_PLAN_262_22_FRESH_DESTINATIONS[6],
  reproductionMarker: V138_PLAN_262_22_FRESH_DESTINATIONS[7],
})

const plan26222Path = (
  repoRoot: string,
  supplied: string,
  key: keyof typeof PLAN_262_22_PATHS,
): string => {
  const expected = PLAN_262_22_PATHS[key]
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, expected)) {
    throw new TypeError("MATRIX_PLAN_262_22_PATH_INVALID")
  }
  return resolved
}

const readPlan26222 = (target: string, required = true): unknown => {
  if (!existsSync(target)) {
    if (required) throw new TypeError("MATRIX_PLAN_262_22_ARTIFACT_REQUIRED")
    return undefined
  }
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError("MATRIX_PLAN_262_22_ARTIFACT_INVALID")
  }
  return JSON.parse(readFileSync(target, "utf8"))
}

const assertV138Plan26222AuthorityOpen = (repoRoot: string): void => {
  if (existsSync(path.resolve(repoRoot, PLAN_262_22_PATHS.terminal))) {
    throw new TypeError("MATRIX_PLAN_262_22_AUTHORITY_EXPIRED")
  }
}

const checkV138Plan26221AuthorityRoute = (input: {
  repoRoot: string
  authorizationValue: unknown
  sealValue: unknown
  sourceA3: string
  sourceB3: string
}) => {
  const custody = checkV138SuccessorSealCommitV3({
    repoRoot: input.repoRoot,
    sourceA3: input.sourceA3,
    sourceB3: input.sourceB3,
  })
  const authorization = checkV138Plan26221AuthorizationV3(
    input.repoRoot,
    input.authorizationValue,
  )
  const seal = checkV138SuccessorSourceSealV3(
    input.repoRoot,
    input.sealValue,
    authorization,
  )
  if (
    authorization.sourceCustody.sourceA3 !== custody.sourceA3 ||
    seal.sourceCustody.sourceA3 !== custody.sourceA3
  ) throw new TypeError("MATRIX_PLAN_262_22_AUTHORITY_JOIN_INVALID")
  return { custody, authorization, seal }
}

type V138Plan26222Stage = "preflight" | "calibration" | "reproduction"
const plan26222MarkerKey = (stage: V138Plan26222Stage) =>
  stage === "preflight" ? "preflightMarker" as const :
    stage === "calibration" ? "calibrationMarker" as const :
      "reproductionMarker" as const

export const consumeV138Plan26222Stage = (input: {
  repoRoot: string
  stage: V138Plan26222Stage
  context: V138ExecutionContextV7Receipt
  predecessorRoot: Sha256
  chargedAttemptIds: readonly string[]
}): Sha256 => {
  const context = checkV138ExecutionContextV7Receipt(input.context)
  if (input.stage !== "preflight") {
    const preflight = checkV138HostHeadroomPreflightV7Receipt(readPlan26222(
      path.resolve(input.repoRoot, PLAN_262_22_PATHS.preflight)), context)
    checkV138Plan26222ConsumptionMarker({ repoRoot: input.repoRoot,
      stage: "preflight", context, predecessorRoot: context.receiptRoot,
      chargedAttemptIds: ["preflight:v7:0"] })
    if (input.stage === "calibration" &&
      input.predecessorRoot !== preflight.receiptRoot) {
      throw new TypeError("MATRIX_PLAN_262_22_PREDECESSOR_INVALID")
    }
    if (input.stage === "reproduction") {
      const inventory = enumerateV138CurrentMatrix(input.repoRoot)
      const calibration = checkV138ParallelCalibrationV7Receipt(inventory,
        readPlan26222(path.resolve(input.repoRoot,
          PLAN_262_22_PATHS.calibration)), context, preflight)
      const calibrationIds = deriveV138CalibrationAttemptMappings(inventory,
        "v7").map(({ executionAttemptId }) => executionAttemptId)
      checkV138Plan26222ConsumptionMarker({ repoRoot: input.repoRoot,
        stage: "calibration", context,
        predecessorRoot: preflight.receiptRoot,
        chargedAttemptIds: calibrationIds })
      if (calibration.status !== "admitted" ||
        input.predecessorRoot !== calibration.receiptRoot) {
        throw new TypeError("MATRIX_PLAN_262_22_PREDECESSOR_INVALID")
      }
    }
  }
  const key = plan26222MarkerKey(input.stage)
  const target = plan26222Path(input.repoRoot, PLAN_262_22_PATHS[key], key)
  const chain = validateV138CanonicalParentChain(input.repoRoot, target)
  assertV138FreshImmutableTarget(target)
  const body = {
    schemaVersion: "v1.38-plan-262-22-consumption-v1" as const,
    stage: input.stage,
    sourceA3: context.sourceA3,
    sourceB3: context.sourceB3,
    sourceB3CustodyRoot: context.sourceB3CustodyRoot,
    authorizationRoot: context.authorizationRoot,
    sealRoot: context.sealRoot,
    executionContextRoot: context.receiptRoot,
    predecessorRoot: input.predecessorRoot,
    chargedAttemptCount: input.chargedAttemptIds.length,
    chargedAttemptRoot: v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-22-${input.stage}-charged-attempts-v1`,
      input.chargedAttemptIds),
    noRetry: true as const,
  }
  const marker = deepFreeze({ ...body, markerRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
  writeV138Plan26219Immutable(target, chain, marker)
  return marker.markerRoot
}

export const checkV138Plan26222ConsumptionMarker = (input: {
  repoRoot: string
  stage: V138Plan26222Stage
  context: V138ExecutionContextV7Receipt
  predecessorRoot: Sha256
  chargedAttemptIds: readonly string[]
}) => {
  const context = checkV138ExecutionContextV7Receipt(input.context)
  const key = plan26222MarkerKey(input.stage)
  const value = readPlan26222(plan26222Path(input.repoRoot,
    PLAN_262_22_PATHS[key], key))
  const marker = exactRecord(value, ["schemaVersion", "stage", "sourceA3",
    "sourceB3", "sourceB3CustodyRoot", "authorizationRoot", "sealRoot",
    "executionContextRoot", "predecessorRoot", "chargedAttemptCount",
    "chargedAttemptRoot", "noRetry", "markerRoot"],
  "MATRIX_PLAN_262_22_CONSUMPTION_MARKER_INVALID")
  const { markerRoot, ...body } = marker
  if (marker.schemaVersion !== "v1.38-plan-262-22-consumption-v1" ||
    marker.stage !== input.stage || marker.sourceA3 !== context.sourceA3 ||
    marker.sourceB3 !== context.sourceB3 ||
    marker.sourceB3CustodyRoot !== context.sourceB3CustodyRoot ||
    marker.authorizationRoot !== context.authorizationRoot ||
    marker.sealRoot !== context.sealRoot ||
    marker.executionContextRoot !== context.receiptRoot ||
    marker.predecessorRoot !== input.predecessorRoot ||
    marker.chargedAttemptCount !== input.chargedAttemptIds.length ||
    marker.chargedAttemptRoot !== v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-22-${input.stage}-charged-attempts-v1`,
      input.chargedAttemptIds) || marker.noRetry !== true ||
    markerRoot !== v138SuccessorRoot("evidenceBundle",
      String(marker.schemaVersion), body)) {
    throw new TypeError("MATRIX_PLAN_262_22_CONSUMPTION_MARKER_INVALID")
  }
  return deepFreeze(marker)
}

export interface V138ExecutionContextV7Receipt {
  readonly schemaVersion: "v1.38-current-matrix-execution-context-v7"
  readonly mode: "gsd-pattern-c-inline-main"
  readonly cwd: "/Users/roryquinlan/runtime/cowards-game"
  readonly terminalAgentRegistry: Readonly<{
    schemaVersion: "v1.38-plan-262-22-terminal-agent-registry-v1"
    activeExecutorCount: 0
    agents: readonly Readonly<{ id: string; status: "completed" | "failed" }>[]
  }>
  readonly sourceA3: string
  readonly sourceB3: string
  readonly sourceB3Custody: Readonly<Record<string, unknown>>
  readonly sourceB3CustodyRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly selectedRouteClosureRoot: Sha256
  readonly protectedHistoryRoot: Sha256
  readonly patternCOwnership: "main_orchestrator_only"
  readonly formationAbsenceBound: true
  readonly runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"
  readonly resourceSampleMilliseconds: 200
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

const checkRegistryV3 = (
  value: unknown,
): V138ExecutionContextV7Receipt["terminalAgentRegistry"] => {
  const registry = exactRecord(value,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V7_REGISTRY_INVALID")
  if (registry.schemaVersion !==
    "v1.38-plan-262-22-terminal-agent-registry-v1" ||
    registry.activeExecutorCount !== 0 || !Array.isArray(registry.agents) ||
    registry.agents.some((entry) => {
      const agent = exactRecord(entry, ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V7_REGISTRY_INVALID")
      return typeof agent.id !== "string" || agent.id.length === 0 ||
        (agent.status !== "completed" && agent.status !== "failed")
    })) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V7_REGISTRY_INVALID")
  return registry as unknown as V138ExecutionContextV7Receipt["terminalAgentRegistry"]
}

export const buildV138ExecutionContextV7Receipt = (input: {
  readonly route: V138Route3
  readonly mode: string
  readonly cwd: string
  readonly terminalAgentRegistry: unknown
}) => {
  const registry = checkRegistryV3(input.terminalAgentRegistry)
  if (input.mode !== "gsd-pattern-c-inline-main" ||
    input.cwd !== "/Users/roryquinlan/runtime/cowards-game") {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V7_ROUTE_INVALID")
  }
  const body = {
    schemaVersion: "v1.38-current-matrix-execution-context-v7" as const,
    mode: input.mode as V138ExecutionContextV7Receipt["mode"],
    cwd: input.cwd as V138ExecutionContextV7Receipt["cwd"],
    terminalAgentRegistry: registry,
    sourceA3: input.route.custody.sourceA3,
    sourceB3: input.route.custody.sourceB3,
    sourceB3Custody: input.route.custody,
    sourceB3CustodyRoot: input.route.custody.custodyRoot,
    authorizationRoot: input.route.authorization.authorizationRoot,
    sealRoot: input.route.seal.sealRoot,
    selectedRouteClosureRoot: input.route.seal.selectedRouteClosure.closureRoot,
    protectedHistoryRoot:
      input.route.seal.protectedHistory.protectedHistoryRoot,
    patternCOwnership: "main_orchestrator_only" as const,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    resourceSampleMilliseconds: 200 as const,
    acceptedCellCount: 0 as const,
    noRetry: true as const,
  }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

export const checkV138ExecutionContextV7Receipt = (
  value: unknown,
  expectedRoute?: V138Route3,
): Readonly<V138ExecutionContextV7Receipt> => {
  const receipt = exactRecord(value, ["schemaVersion", "mode", "cwd",
    "terminalAgentRegistry", "sourceA3", "sourceB3", "sourceB3Custody",
    "sourceB3CustodyRoot", "authorizationRoot", "sealRoot",
    "selectedRouteClosureRoot", "protectedHistoryRoot", "patternCOwnership",
    "formationAbsenceBound", "runtimeRoute", "resourceSampleMilliseconds",
    "acceptedCellCount", "noRetry", "receiptRoot"],
  "MATRIX_EXECUTION_CONTEXT_V7_INVALID") as unknown as V138ExecutionContextV7Receipt
  checkRegistryV3(receipt.terminalAgentRegistry)
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-execution-context-v7" ||
    receipt.mode !== "gsd-pattern-c-inline-main" ||
    receipt.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    !/^[0-9a-f]{40}$/u.test(receipt.sourceA3) ||
    !/^[0-9a-f]{40}$/u.test(receipt.sourceB3) ||
    receipt.sourceB3CustodyRoot !==
      (receipt.sourceB3Custody as { custodyRoot?: unknown }).custodyRoot ||
    receipt.patternCOwnership !== "main_orchestrator_only" ||
    receipt.formationAbsenceBound !== true ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.resourceSampleMilliseconds !== 200 ||
    receipt.acceptedCellCount !== 0 || receipt.noRetry !== true ||
    (expectedRoute !== undefined && (
      receipt.sourceA3 !== expectedRoute.custody.sourceA3 ||
      receipt.sourceB3 !== expectedRoute.custody.sourceB3 ||
      canonical(receipt.sourceB3Custody) !== canonical(expectedRoute.custody) ||
      receipt.sourceB3CustodyRoot !== expectedRoute.custody.custodyRoot ||
      receipt.authorizationRoot !== expectedRoute.authorization.authorizationRoot ||
      receipt.sealRoot !== expectedRoute.seal.sealRoot ||
      receipt.selectedRouteClosureRoot !==
        expectedRoute.seal.selectedRouteClosure.closureRoot ||
      receipt.protectedHistoryRoot !==
        expectedRoute.seal.protectedHistory.protectedHistoryRoot
    )) ||
    receiptRoot !== v138SuccessorRoot(
      "evidenceBundle", receipt.schemaVersion, body,
    )) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V7_INVALID")
  return deepFreeze(receipt)
}

export interface V138HostHeadroomPreflightV7Receipt {
  readonly schemaVersion: "v1.38-current-matrix-headroom-preflight-v7"
  readonly sourceA3: string
  readonly sourceB3: string
  readonly executionContextRoot: Sha256
  readonly authorizationRoot: Sha256
  readonly sealRoot: Sha256
  readonly chargedIdentityId: "preflight:v7:0"
  readonly metricId: typeof V138_DARWIN_HEADROOM_METRIC_ID
  readonly providerId: typeof V138_DARWIN_HEADROOM_PROVIDER_ID
  readonly parserId: typeof V138_DARWIN_HEADROOM_PARSER_ID
  readonly requiredHostHeadroomBasisPoints: 2500
  readonly observation: Readonly<Record<string, number | Sha256>> | null
  readonly disposition: "preflight_admitted" | "preflight_refused" |
    "preflight_unavailable"
  readonly acceptedCellCount: 0
  readonly noRetry: true
  readonly receiptRoot: Sha256
}

export const buildV138HostHeadroomPreflightV7Receipt = (input: {
  result: V138DarwinHeadroomResult
  executionContext: V138ExecutionContextV7Receipt
}) => {
  const context = checkV138ExecutionContextV7Receipt(input.executionContext)
  const observation = input.result.ok ? {
    stdoutByteLength: input.result.observation.stdoutByteLength,
    stdoutSha256: input.result.observation.stdoutSha256,
    totalBytes: input.result.observation.totalBytes,
    pageCount: input.result.observation.pageCount,
    pageSizeBytes: input.result.observation.pageSizeBytes,
    percentage: input.result.observation.percentage,
    observedBasisPoints: input.result.observation.observedBasisPoints,
  } : null
  const body = {
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v7" as const,
    sourceA3: context.sourceA3, sourceB3: context.sourceB3,
    executionContextRoot: context.receiptRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    chargedIdentityId: "preflight:v7:0" as const,
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    requiredHostHeadroomBasisPoints: 2500 as const,
    observation,
    disposition: input.result.ok ? input.result.observation.disposition :
      "preflight_unavailable" as const,
    acceptedCellCount: 0 as const, noRetry: true as const,
  }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body,
  ) })
}

export const checkV138HostHeadroomPreflightV7Receipt = (
  value: unknown,
  contextValue: V138ExecutionContextV7Receipt,
) => {
  const context = checkV138ExecutionContextV7Receipt(contextValue)
  const receipt = exactRecord(value, ["schemaVersion", "sourceA3", "sourceB3",
    "executionContextRoot", "authorizationRoot", "sealRoot",
    "chargedIdentityId", "metricId", "providerId", "parserId",
    "requiredHostHeadroomBasisPoints",
    "observation", "disposition", "acceptedCellCount", "noRetry",
    "receiptRoot"], "MATRIX_PREFLIGHT_V7_INVALID")
  const { receiptRoot, ...body } = receipt
  const observed = receipt.observation === null ? null : exactRecord(
    receipt.observation, ["stdoutByteLength", "stdoutSha256", "totalBytes",
      "pageCount", "pageSizeBytes", "percentage", "observedBasisPoints"],
    "MATRIX_PREFLIGHT_V7_INVALID")
  const expectedDisposition = observed === null ? "preflight_unavailable" :
    Number(observed.observedBasisPoints) >= 2500 ? "preflight_admitted" :
      "preflight_refused"
  const observationValid = observed === null ||
    Number.isSafeInteger(observed.stdoutByteLength) &&
    Number(observed.stdoutByteLength) > 0 &&
    Number(observed.stdoutByteLength) <= 4_096 &&
    isV138CanonicalSha256(observed.stdoutSha256) &&
    Number.isSafeInteger(observed.totalBytes) && Number(observed.totalBytes) > 0 &&
    Number.isSafeInteger(observed.pageCount) && Number(observed.pageCount) > 0 &&
    Number.isSafeInteger(observed.pageSizeBytes) &&
    Number(observed.pageSizeBytes) > 0 &&
    Number.isSafeInteger(Number(observed.pageCount) *
      Number(observed.pageSizeBytes)) &&
    Number(observed.totalBytes) === Number(observed.pageCount) *
      Number(observed.pageSizeBytes) &&
    Number.isSafeInteger(observed.percentage) &&
    Number(observed.percentage) >= 0 && Number(observed.percentage) <= 100 &&
    Number.isSafeInteger(observed.observedBasisPoints) &&
    Number(observed.observedBasisPoints) === Number(observed.percentage) * 100
  if (receipt.schemaVersion !==
    "v1.38-current-matrix-headroom-preflight-v7" ||
    receipt.sourceA3 !== context.sourceA3 ||
    receipt.sourceB3 !== context.sourceB3 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.authorizationRoot !== context.authorizationRoot ||
    receipt.sealRoot !== context.sealRoot ||
    receipt.chargedIdentityId !== "preflight:v7:0" ||
    receipt.metricId !== V138_DARWIN_HEADROOM_METRIC_ID ||
    receipt.providerId !== V138_DARWIN_HEADROOM_PROVIDER_ID ||
    receipt.parserId !== V138_DARWIN_HEADROOM_PARSER_ID ||
    receipt.requiredHostHeadroomBasisPoints !== 2500 ||
    !observationValid ||
    receipt.disposition !== expectedDisposition || receipt.acceptedCellCount !== 0 ||
    receipt.noRetry !== true || receiptRoot !== v138SuccessorRoot(
      "canonicalJsonProfile", String(receipt.schemaVersion), body,
    )) throw new TypeError("MATRIX_PREFLIGHT_V7_INVALID")
  return deepFreeze(receipt) as unknown as Readonly<V138HostHeadroomPreflightV7Receipt>
}

export const buildV138ParallelCalibrationV7Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  executionContext: V138ExecutionContextV7Receipt
  preflight: V138HostHeadroomPreflightV7Receipt
  calibration?: Readonly<V138ParallelCalibrationReceipt>
  callbackFailureAfterConsumption?: true
}) => {
  const context = checkV138ExecutionContextV7Receipt(input.executionContext)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(
    input.preflight, context,
  )
  const mappings = deriveV138CalibrationAttemptMappings(input.inventory, "v7")
  const actual = input.calibration
  if (actual !== undefined) validateParallelCalibrationReceipt(
    input.inventory, actual, "v7",
  )
  const terminalById = new Map(actual?.terminals.flatMap((terminal) =>
    terminal.outcomes.map((outcome) => [outcome.attemptId,
      { terminal, outcome }] as const)) ?? [])
  const launched = new Set((actual as (V138ParallelCalibrationReceipt & {
    launchEvents?: readonly V138ParallelShardLaunchEvent[]
  }) | undefined)?.launchEvents?.flatMap(
    ({ executionAttemptIds }) => executionAttemptIds) ?? [])
  const unknown = input.callbackFailureAfterConsumption === true
  const attempts = mappings.map((mapping) => {
    const terminal = terminalById.get(mapping.executionAttemptId)
    return Object.freeze({ ...mapping,
      childLaunched: unknown ? null : launched.has(mapping.executionAttemptId),
      terminalObserved: unknown ? null : terminal !== undefined,
      classification: unknown ? "unknown" :
        terminal?.outcome.classification ?? "unlaunched",
      cleanupComplete: unknown ? false : terminal !== undefined &&
        terminal.terminal.cleanup.exitAwaited &&
        terminal.terminal.cleanup.orphanProcessIds.length === 0,
    })
  })
  const admitted = preflight.disposition === "preflight_admitted" &&
    actual?.status === "admitted"
  const status = preflight.disposition !== "preflight_admitted" ?
    preflight.disposition : admitted ? "admitted" : "stopped_process_failure"
  const body = {
    schemaVersion: "v1.38-current-matrix-calibration-v7" as const,
    sourceA3: context.sourceA3, sourceB3: context.sourceB3,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot,
    status, chargedAttemptCount: 8 as const,
    calibrationShardCount: 4 as const,
    observationMode: unknown ? "unknown_after_consumption" as const :
      "exact" as const,
    childLaunchCount: unknown ? null : launched.size,
    terminalOutcomeCount: unknown ? null : terminalById.size,
    acceptedCellCount: admitted ? 8 as const : 0 as const,
    completeCleanup: unknown ? false : attempts.every((attempt) =>
      attempt.childLaunched !== true || attempt.cleanupComplete),
    publicStopReason: admitted ? null :
      actual?.reason ?? (unknown ? "PARENT_EXCEPTION" : null),
    supervisionRoot: admitted ? actual!.calibrationRoot : null,
    attempts: Object.freeze(attempts),
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    privacyProjection: "closed_public_safe_fields_only" as const,
    noRetry: true as const,
  }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

export const checkV138ParallelCalibrationV7Receipt = (
  inventory: Readonly<V138CurrentMatrixInventory>, value: unknown,
  contextValue: V138ExecutionContextV7Receipt,
  preflightValue: V138HostHeadroomPreflightV7Receipt,
) => {
  const context = checkV138ExecutionContextV7Receipt(contextValue)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(preflightValue,
    context)
  const receipt = exactRecord(value, ["schemaVersion", "sourceA3", "sourceB3",
    "executionContextRoot", "preflightRoot", "status", "chargedAttemptCount",
    "calibrationShardCount", "observationMode", "childLaunchCount",
    "terminalOutcomeCount", "acceptedCellCount", "completeCleanup",
    "publicStopReason", "supervisionRoot", "attempts", "runtimeRoute",
    "privacyProjection", "noRetry", "receiptRoot"],
  "MATRIX_CALIBRATION_V7_INVALID")
  const { receiptRoot, ...body } = receipt
  const mappings = deriveV138CalibrationAttemptMappings(inventory, "v7")
  if (preflight.disposition !== "preflight_admitted") {
    const expected = buildV138ParallelCalibrationV7Receipt({
      inventory,
      executionContext: context,
      preflight,
    })
    if (canonical(receipt) !== canonical(expected)) {
      throw new TypeError("MATRIX_CALIBRATION_V7_INVALID")
    }
    return deepFreeze(receipt)
  }
  if (!Array.isArray(receipt.attempts) || receipt.attempts.length !== 8) {
    throw new TypeError("MATRIX_CALIBRATION_V7_INVALID")
  }
  const attempts = receipt.attempts.map((entry, index) => {
    const attempt = exactRecord(entry, ["publicAttemptId",
      "executionAttemptId", "templateAttemptId", "inventoryOrdinal",
      "shardId", "childLaunched", "terminalObserved", "classification",
      "cleanupComplete"], "MATRIX_CALIBRATION_V7_INVALID")
    const mapping = mappings[index]!
    if (attempt.publicAttemptId !== mapping.publicAttemptId ||
      attempt.executionAttemptId !== mapping.executionAttemptId ||
      attempt.templateAttemptId !== mapping.templateAttemptId ||
      attempt.inventoryOrdinal !== mapping.inventoryOrdinal ||
      attempt.shardId !== mapping.shardId) {
      throw new TypeError("MATRIX_CALIBRATION_V7_INVALID")
    }
    return attempt
  })
  const unknown = receipt.observationMode === "unknown_after_consumption"
  const exact = receipt.observationMode === "exact"
  const classifications = new Set(["success", "player_violation",
    "system_failure", "timeout", "cancelled", "unlaunched"])
  if ((!unknown && !exact) || attempts.some((attempt) => unknown ?
    attempt.childLaunched !== null || attempt.terminalObserved !== null ||
      attempt.classification !== "unknown" || attempt.cleanupComplete !== false :
    typeof attempt.childLaunched !== "boolean" ||
      typeof attempt.terminalObserved !== "boolean" ||
      typeof attempt.cleanupComplete !== "boolean" ||
      !classifications.has(String(attempt.classification)) ||
      (attempt.terminalObserved === true && attempt.childLaunched !== true) ||
      (attempt.terminalObserved !== true && attempt.cleanupComplete !== false) ||
      (attempt.terminalObserved === false &&
        attempt.classification !== "unlaunched") ||
      (attempt.terminalObserved === true &&
        attempt.classification === "unlaunched"))) {
    throw new TypeError("MATRIX_CALIBRATION_V7_INVALID")
  }
  const childLaunchCount = unknown ? null : attempts.filter(
    ({ childLaunched }) => childLaunched === true).length
  const terminalOutcomeCount = unknown ? null : attempts.filter(
    ({ terminalObserved }) => terminalObserved === true).length
  const completeCleanup = !unknown && attempts.every((attempt) =>
    attempt.childLaunched !== true || attempt.cleanupComplete === true)
  if (receipt.schemaVersion !== "v1.38-current-matrix-calibration-v7" ||
    receipt.sourceA3 !== context.sourceA3 || receipt.sourceB3 !== context.sourceB3 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receipt.chargedAttemptCount !== 8 || receipt.calibrationShardCount !== 4 ||
    receipt.childLaunchCount !== childLaunchCount ||
    receipt.terminalOutcomeCount !== terminalOutcomeCount ||
    receipt.completeCleanup !== completeCleanup ||
    !["admitted", "stopped_process_failure"].includes(String(receipt.status)) ||
    (receipt.status === "admitted" ? receipt.acceptedCellCount !== 8 ||
      receipt.childLaunchCount !== 8 || receipt.terminalOutcomeCount !== 8 ||
      receipt.completeCleanup !== true || receipt.observationMode !== "exact" ||
      attempts.some((attempt) => attempt.childLaunched !== true ||
        attempt.terminalObserved !== true || attempt.classification !== "success" ||
        attempt.cleanupComplete !== true) || receipt.publicStopReason !== null ||
      !isV138CanonicalSha256(receipt.supervisionRoot) :
      receipt.acceptedCellCount !== 0 || receipt.supervisionRoot !== null ||
      (unknown ? receipt.publicStopReason !== "PARENT_EXCEPTION" ||
        receipt.childLaunchCount !== null || receipt.terminalOutcomeCount !== null :
        !V138_PUBLIC_STOP_REASONS.has(receipt.publicStopReason as
          V138ParallelStopReason))) ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.privacyProjection !== "closed_public_safe_fields_only" ||
    receipt.noRetry !== true || receiptRoot !== v138SuccessorRoot(
      "evidenceBundle", String(receipt.schemaVersion), body,
    )) throw new TypeError("MATRIX_CALIBRATION_V7_INVALID")
  return deepFreeze(receipt)
}

export const buildV138AuthoritativeMatrixV8Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  context: V138ExecutionContextV7Receipt
  preflight: V138HostHeadroomPreflightV7Receipt
  calibration: Record<string, unknown>
  execution?: V138ParallelMatrixExecutionResult
  callbackFailureAfterConsumption?: true
}) => {
  const context = checkV138ExecutionContextV7Receipt(input.context)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(input.preflight,
    context)
  const calibration = checkV138ParallelCalibrationV7Receipt(input.inventory,
    input.calibration, context, preflight)
  if (calibration.status !== "admitted") {
    throw new TypeError("MATRIX_REPRODUCTION_V8_CALIBRATION_NOT_ADMITTED")
  }
  const plan = planV138MatrixShards(input.inventory)
  const expectedIds = plan.shards.flatMap(({ attemptIds }) =>
    attemptIds.map((id) => `reproduction:v7:${id}`))
  const actualIds = input.execution?.terminals.flatMap(({ outcomes }) =>
    outcomes.map(({ attemptId }) => attemptId)) ?? []
  const launched = input.execution?.launchEvents.flatMap(
    ({ executionAttemptIds }) => executionAttemptIds) ?? []
  const completeCleanup = input.execution !== undefined &&
    input.execution.terminals.every(({ cleanup }) => cleanup.exitAwaited &&
      cleanup.orphanProcessIds.length === 0)
  const terminalById = new Map(input.execution?.terminals.flatMap((terminal) =>
    terminal.outcomes.map((outcome) => [outcome.attemptId,
      { terminal, outcome }] as const)) ?? [])
  const launchedSet = new Set(launched)
  const unknown = input.callbackFailureAfterConsumption === true
  const attempts = Object.freeze(plan.shards.flatMap((shard) =>
    shard.attemptIds.map((templateAttemptId) => {
      const executionAttemptId = `reproduction:v7:${templateAttemptId}`
      const terminal = terminalById.get(executionAttemptId)
      return Object.freeze({ executionAttemptId, templateAttemptId,
        shardId: shard.shardId, laneId: shard.laneId,
        childLaunched: unknown ? null : launchedSet.has(executionAttemptId),
        terminalObserved: unknown ? null : terminal !== undefined,
        classification: unknown ? "unknown" as const :
          terminal?.outcome.classification ?? "unlaunched" as const,
        cleanupComplete: unknown ? false : terminal !== undefined &&
          terminal.terminal.cleanup.exitAwaited &&
          terminal.terminal.cleanup.orphanProcessIds.length === 0 })
    })))
  const passed = input.callbackFailureAfterConsumption !== true &&
    input.execution?.status === "complete_pending_publication" &&
    canonical(actualIds) === canonical(expectedIds) &&
    canonical(launched) === canonical(expectedIds) && completeCleanup &&
    input.execution.terminals.every(({ outcomes }) => outcomes.every(
      ({ classification }) => classification === "success"))
  const body = {
    schemaVersion: "v1.38-current-matrix-reproduction-v8" as const,
    sourceA3: context.sourceA3, sourceB3: context.sourceB3,
    executionContextRoot: context.receiptRoot, preflightRoot: preflight.receiptRoot,
    calibrationRoot: calibration.receiptRoot,
    status: passed ? "passed_exact" as const :
      "stopped_process_failure" as const,
    chargedAttemptCount: 540 as const,
    observationMode: unknown ? "unknown_after_consumption" as const :
      "exact" as const,
    childLaunchCount: input.callbackFailureAfterConsumption ? null : launched.length,
    terminalOutcomeCount: input.callbackFailureAfterConsumption ? null : actualIds.length,
    acceptedCellCount: passed ? 540 as const : 0 as const,
    completeCleanup: passed ? true as const : completeCleanup,
    publicStopReason: passed ? null : input.callbackFailureAfterConsumption ?
      "PARENT_EXCEPTION" : input.execution?.reason ?? "PARENT_EXCEPTION",
    planRoot: plan.planRoot,
    attempts,
    attemptLedgerRoot: v138SuccessorRoot("evidenceBundle",
      "v1.38-current-matrix-reproduction-v8-attempt-ledger-v1",
      { calibrationRoot: calibration.receiptRoot, planRoot: plan.planRoot,
        attempts }),
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    privacyProjection: "closed_public_safe_fields_only" as const,
    partialAcceptedEvidenceReusable: false as const,
    noRetry: true as const,
  }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body,
  ) })
}

export const checkV138AuthoritativeMatrixV8Receipt = (
  value: unknown,
  evidence: { inventory: Readonly<V138CurrentMatrixInventory>
    context: V138ExecutionContextV7Receipt
    preflight: V138HostHeadroomPreflightV7Receipt
    calibration: Record<string, unknown> },
) => {
  const context = checkV138ExecutionContextV7Receipt(evidence.context)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(
    evidence.preflight, context)
  const calibration = checkV138ParallelCalibrationV7Receipt(
    evidence.inventory, evidence.calibration, context, preflight)
  const receipt = exactRecord(value, ["schemaVersion", "sourceA3", "sourceB3",
    "executionContextRoot", "preflightRoot", "calibrationRoot", "status",
    "chargedAttemptCount", "observationMode", "childLaunchCount", "terminalOutcomeCount",
    "acceptedCellCount", "completeCleanup", "publicStopReason",
    "planRoot", "attempts", "attemptLedgerRoot", "runtimeRoute", "privacyProjection",
    "partialAcceptedEvidenceReusable", "noRetry", "receiptRoot"],
  "MATRIX_REPRODUCTION_V8_INVALID")
  const { receiptRoot, ...body } = receipt
  const plan = planV138MatrixShards(evidence.inventory)
  const expectedAttempts = plan.shards.flatMap((shard) =>
    shard.attemptIds.map((templateAttemptId) => ({ templateAttemptId,
      executionAttemptId: `reproduction:v7:${templateAttemptId}`,
      shardId: shard.shardId, laneId: shard.laneId })))
  if (!Array.isArray(receipt.attempts) || receipt.attempts.length !== 540) {
    throw new TypeError("MATRIX_REPRODUCTION_V8_INVALID")
  }
  const attempts = receipt.attempts.map((entry, index) => {
    const attempt = exactRecord(entry, ["executionAttemptId",
      "templateAttemptId", "shardId", "laneId", "childLaunched",
      "terminalObserved", "classification", "cleanupComplete"],
    "MATRIX_REPRODUCTION_V8_INVALID")
    const expected = expectedAttempts[index]!
    if (attempt.executionAttemptId !== expected.executionAttemptId ||
      attempt.templateAttemptId !== expected.templateAttemptId ||
      attempt.shardId !== expected.shardId || attempt.laneId !== expected.laneId) {
      throw new TypeError("MATRIX_REPRODUCTION_V8_INVALID")
    }
    return attempt
  })
  const unknown = receipt.observationMode === "unknown_after_consumption"
  const exact = receipt.observationMode === "exact"
  const classifications = new Set(["success", "player_violation",
    "system_failure", "timeout", "cancelled", "unlaunched"])
  if ((!unknown && !exact) || attempts.some((attempt) => unknown ?
    attempt.childLaunched !== null || attempt.terminalObserved !== null ||
      attempt.classification !== "unknown" || attempt.cleanupComplete !== false :
    typeof attempt.childLaunched !== "boolean" ||
      typeof attempt.terminalObserved !== "boolean" ||
      typeof attempt.cleanupComplete !== "boolean" ||
      !classifications.has(String(attempt.classification)) ||
      (attempt.terminalObserved === true && attempt.childLaunched !== true) ||
      (attempt.terminalObserved !== true && attempt.cleanupComplete !== false) ||
      (attempt.terminalObserved === false &&
        attempt.classification !== "unlaunched") ||
      (attempt.terminalObserved === true &&
        attempt.classification === "unlaunched"))) {
    throw new TypeError("MATRIX_REPRODUCTION_V8_INVALID")
  }
  const childLaunchCount = unknown ? null : attempts.filter(
    ({ childLaunched }) => childLaunched === true).length
  const terminalOutcomeCount = unknown ? null : attempts.filter(
    ({ terminalObserved }) => terminalObserved === true).length
  const completeCleanup = !unknown && attempts.every((attempt) =>
    attempt.childLaunched !== true || attempt.cleanupComplete === true)
  if (receipt.schemaVersion !== "v1.38-current-matrix-reproduction-v8" ||
    receipt.sourceA3 !== context.sourceA3 || receipt.sourceB3 !== context.sourceB3 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receipt.calibrationRoot !== calibration.receiptRoot ||
    receipt.chargedAttemptCount !== 540 ||
    receipt.planRoot !== plan.planRoot ||
    receipt.childLaunchCount !== childLaunchCount ||
    receipt.terminalOutcomeCount !== terminalOutcomeCount ||
    receipt.completeCleanup !== completeCleanup ||
    receipt.attemptLedgerRoot !== v138SuccessorRoot("evidenceBundle",
      "v1.38-current-matrix-reproduction-v8-attempt-ledger-v1",
      { calibrationRoot: calibration.receiptRoot, planRoot: plan.planRoot,
        attempts: receipt.attempts }) ||
    (receipt.status === "passed_exact" ? receipt.acceptedCellCount !== 540 ||
      receipt.childLaunchCount !== 540 || receipt.terminalOutcomeCount !== 540 ||
      receipt.completeCleanup !== true || receipt.publicStopReason !== null ||
      receipt.observationMode !== "exact" || attempts.some((attempt) =>
        attempt.classification !== "success" ||
        attempt.cleanupComplete !== true) :
      receipt.status !== "stopped_process_failure" ||
      receipt.acceptedCellCount !== 0 || (unknown ?
        receipt.publicStopReason !== "PARENT_EXCEPTION" ||
        receipt.childLaunchCount !== null || receipt.terminalOutcomeCount !== null :
        !V138_PUBLIC_STOP_REASONS.has(receipt.publicStopReason as
          V138ParallelStopReason))) ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.privacyProjection !== "closed_public_safe_fields_only" ||
    receipt.partialAcceptedEvidenceReusable !== false || receipt.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_REPRODUCTION_V8_INVALID")
  }
  return deepFreeze(receipt)
}

const assertV138Plan26222PublicationRoute = (
  repoRoot: string, sourceA3: string, sourceB3: string,
  expectedRoute: V138Route3,
): void => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3,
    sourceB3, authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)), sealValue: readPlan26222(
      path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, currentRoute.seal)
  if (canonical(currentRoute) !== canonical(expectedRoute)) {
    throw new TypeError("MATRIX_PLAN_262_22_AUTHORITY_CHANGED")
  }
}

export const writeV138ExecutionContextV7Receipt = (
  repoRoot: string, targetPath: string, mode: string, cwd: string,
  terminalAgentRegistry: unknown, authorizationPath: string, sealPath: string,
  sourceA3: string, sourceB3: string,
) => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const target = plan26222Path(repoRoot, targetPath, "context")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3, sourceB3,
    authorizationValue: readPlan26222(plan26222Path(repoRoot,
      authorizationPath, "authorization")),
    sealValue: readPlan26222(plan26222Path(repoRoot, sealPath, "seal")) })
  checkV138SealedWorktreeAtA3(repoRoot, route.seal)
  const receipt = buildV138ExecutionContextV7Receipt({ route, mode, cwd,
    terminalAgentRegistry })
  checkV138ExecutionContextV7Receipt(receipt, route)
  assertV138Plan26222PublicationRoute(repoRoot, sourceA3, sourceB3, route)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const writeV138HostHeadroomPreflightV7Receipt = async (
  repoRoot: string, targetPath: string, contextPath: string,
  authorizationPath: string, sealPath: string, sourceA3: string,
  sourceB3: string,
  observe: () => Promise<V138DarwinHeadroomResult> = () =>
    observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ),
) => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const target = plan26222Path(repoRoot, targetPath, "preflight")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3, sourceB3,
    authorizationValue: readPlan26222(plan26222Path(repoRoot,
      authorizationPath, "authorization")),
    sealValue: readPlan26222(plan26222Path(repoRoot, sealPath, "seal")) })
  checkV138SealedWorktreeAtA3(repoRoot, route.seal)
  const context = checkV138ExecutionContextV7Receipt(readPlan26222(
    plan26222Path(repoRoot, contextPath, "context")), route)
  consumeV138Plan26222Stage({ repoRoot, stage: "preflight", context,
    predecessorRoot: context.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  let result: V138DarwinHeadroomResult
  try { result = await observe() } catch {
    result = { ok: false, reason: "resource_measurement_unavailable" }
  }
  assertV138Plan26222AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3,
    sourceB3, authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)), sealValue: readPlan26222(
      path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, currentRoute.seal)
  const currentContext = checkV138ExecutionContextV7Receipt(readPlan26222(
    path.resolve(repoRoot, PLAN_262_22_PATHS.context)), currentRoute)
  if (currentContext.receiptRoot !== context.receiptRoot) {
    throw new TypeError("MATRIX_PLAN_262_22_PREREQUISITE_CHANGED")
  }
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight",
    context: currentContext, predecessorRoot: currentContext.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  const receipt = checkV138HostHeadroomPreflightV7Receipt(
    buildV138HostHeadroomPreflightV7Receipt({ result,
      executionContext: currentContext }), currentContext)
  assertV138Plan26222PublicationRoute(repoRoot, sourceA3, sourceB3,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const writeV138ParallelCalibrationV7Receipt = async (
  repoRoot: string, targetPath: string, preflightPath: string,
  contextPath: string, sourceA3: string, sourceB3: string,
  run: typeof calibrateV138ParallelMatrix = calibrateV138ParallelMatrix,
) => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const target = plan26222Path(repoRoot, targetPath, "calibration")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3, sourceB3,
    authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)),
    sealValue: readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, route.seal)
  const context = checkV138ExecutionContextV7Receipt(readPlan26222(
    plan26222Path(repoRoot, contextPath, "context")), route)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(readPlan26222(
    plan26222Path(repoRoot, preflightPath, "preflight")), context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v7")
    .map(({ executionAttemptId }) => executionAttemptId)
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight", context,
    predecessorRoot: context.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  consumeV138Plan26222Stage({ repoRoot, stage: "calibration", context,
    predecessorRoot: preflight.receiptRoot, chargedAttemptIds: calibrationIds })
  let calibration: Readonly<V138ParallelCalibrationReceipt> | undefined
  let callbackFailureAfterConsumption: true | undefined
  if (preflight.disposition === "preflight_admitted") {
    try { calibration = await run({ inventory,
      runner: createV138SubprocessShardRunner(repoRoot,
        { useLegacyHostMemory: false }),
      sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
        executeOwnedMemoryPressureQ),
      hardwareIdentity: { operatingSystem: `${platform()} ${release()}`,
        architecture: arch(), nodeVersion: process.version,
        cpuIdentity: cpus()[0]?.model ?? "unavailable" },
      repoRoot, executionIdentityVersion: "v7" })
    } catch { callbackFailureAfterConsumption = true }
  }
  assertV138Plan26222AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3,
    sourceB3, authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)), sealValue: readPlan26222(
      path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, currentRoute.seal)
  const currentContext = checkV138ExecutionContextV7Receipt(readPlan26222(
    path.resolve(repoRoot, PLAN_262_22_PATHS.context)), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV7Receipt(
    readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.preflight)),
    currentContext)
  if (currentContext.receiptRoot !== context.receiptRoot ||
    currentPreflight.receiptRoot !== preflight.receiptRoot) {
    throw new TypeError("MATRIX_PLAN_262_22_PREREQUISITE_CHANGED")
  }
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "calibration",
    context: currentContext, predecessorRoot: currentPreflight.receiptRoot,
    chargedAttemptIds: calibrationIds })
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight",
    context: currentContext, predecessorRoot: currentContext.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  const receipt = checkV138ParallelCalibrationV7Receipt(inventory,
    buildV138ParallelCalibrationV7Receipt({ inventory,
      executionContext: currentContext, preflight: currentPreflight, calibration,
      callbackFailureAfterConsumption }), currentContext, currentPreflight)
  assertV138Plan26222PublicationRoute(repoRoot, sourceA3, sourceB3,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const writeV138AuthoritativeMatrixV8Receipt = async (
  repoRoot: string, targetPath: string, calibrationPath: string,
  contextPath: string, sourceA3: string, sourceB3: string,
  run: typeof executeV138ParallelMatrix = executeV138ParallelMatrix,
) => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const target = plan26222Path(repoRoot, targetPath, "reproduction")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3, sourceB3,
    authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)),
    sealValue: readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, route.seal)
  const context = checkV138ExecutionContextV7Receipt(readPlan26222(
    plan26222Path(repoRoot, contextPath, "context")), route)
  const preflight = checkV138HostHeadroomPreflightV7Receipt(readPlan26222(
    path.resolve(repoRoot, PLAN_262_22_PATHS.preflight)), context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = checkV138ParallelCalibrationV7Receipt(inventory,
    readPlan26222(plan26222Path(repoRoot, calibrationPath, "calibration")),
    context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V8_CALIBRATION_NOT_ADMITTED")
  }
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v7:${id}`))
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v7")
    .map(({ executionAttemptId }) => executionAttemptId)
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight", context,
    predecessorRoot: context.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "calibration", context,
    predecessorRoot: preflight.receiptRoot,
    chargedAttemptIds: calibrationIds })
  consumeV138Plan26222Stage({ repoRoot, stage: "reproduction", context,
    predecessorRoot: calibration.receiptRoot as Sha256,
    chargedAttemptIds: reproductionIds })
  let execution: V138ParallelMatrixExecutionResult | undefined
  let callbackFailureAfterConsumption: true | undefined
  try { execution = await run({ inventory,
    admittedCalibrationRoot: calibration.supervisionRoot as Sha256,
    runner: createV138SubprocessShardRunner(repoRoot,
      { useLegacyHostMemory: false }),
    sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
      executeOwnedMemoryPressureQ), repoRoot, executionIdentityVersion: "v7" })
  } catch { callbackFailureAfterConsumption = true }
  assertV138Plan26222AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3,
    sourceB3, authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)), sealValue: readPlan26222(
      path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  checkV138SealedWorktreeAtA3(repoRoot, currentRoute.seal)
  const currentContext = checkV138ExecutionContextV7Receipt(readPlan26222(
    path.resolve(repoRoot, PLAN_262_22_PATHS.context)), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV7Receipt(
    readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.preflight)),
    currentContext)
  const currentCalibration = checkV138ParallelCalibrationV7Receipt(inventory,
    readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.calibration)),
    currentContext, currentPreflight)
  if (currentContext.receiptRoot !== context.receiptRoot ||
    currentPreflight.receiptRoot !== preflight.receiptRoot ||
    currentCalibration.receiptRoot !== calibration.receiptRoot) {
    throw new TypeError("MATRIX_PLAN_262_22_PREREQUISITE_CHANGED")
  }
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "reproduction",
    context: currentContext,
    predecessorRoot: currentCalibration.receiptRoot as Sha256,
    chargedAttemptIds: reproductionIds })
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight",
    context: currentContext, predecessorRoot: currentContext.receiptRoot,
    chargedAttemptIds: ["preflight:v7:0"] })
  checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "calibration",
    context: currentContext, predecessorRoot: currentPreflight.receiptRoot,
    chargedAttemptIds: calibrationIds })
  const receipt = checkV138AuthoritativeMatrixV8Receipt(
    buildV138AuthoritativeMatrixV8Receipt({ inventory,
      context: currentContext, preflight: currentPreflight,
      calibration: currentCalibration, execution,
      callbackFailureAfterConsumption }), { inventory, context: currentContext,
      preflight: currentPreflight, calibration: currentCalibration })
  assertV138Plan26222PublicationRoute(repoRoot, sourceA3, sourceB3,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

type V138Plan26222TerminalDisposition =
  | "tool_identity_failed" | "protected_history_failed"
  | "formation_absence_failed" | "pattern_c_ownership_failed"
  | "fresh_destination_failed" | "consumed_stage_interrupted"
  | "preflight_unavailable"
  | "preflight_refused" | "calibration_stopped"
  | "reproduction_stopped" | "reproduction_passed"
type V138Plan26222ObstructionProof = Readonly<{
  stage: "context" | "preflight" | "calibration" | "reproduction"
  path: string
  type: "file" | "directory" | "symlink" | "other"
  metadataRoot: Sha256
}>
type V138Plan26222InterruptionProof = Readonly<{
  stage: "preflight" | "calibration" | "reproduction"
  markerRoot: Sha256
  chargedAttemptCount: 1 | 8 | 540
  chargedIdentityId: "preflight:v7:0" | null
  observationMode: "unknown_after_consumption"
  childLaunchCount: null
  terminalOutcomeCount: null
  completeCleanup: false
}>

const plan26222Needs = (disposition: V138Plan26222TerminalDisposition,
  obstructionStage?: V138Plan26222ObstructionProof["stage"],
  interruptedStage?: V138Plan26222InterruptionProof["stage"]) => {
  if (disposition === "fresh_destination_failed") return {
    context: obstructionStage !== "context",
    preflight: obstructionStage === "calibration" ||
      obstructionStage === "reproduction",
    calibration: obstructionStage === "reproduction",
    reproduction: false,
  }
  if (disposition === "consumed_stage_interrupted") return {
    context: true,
    preflight: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    calibration: interruptedStage === "reproduction",
    reproduction: false,
  }
  const preObservation = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"].includes(
      disposition)
  return { context: !preObservation, preflight: !preObservation,
    calibration: !preObservation,
    reproduction: disposition === "reproduction_stopped" ||
      disposition === "reproduction_passed" }
}

const plan26222MarkerNeeds = (disposition: V138Plan26222TerminalDisposition,
  needs: ReturnType<typeof plan26222Needs>,
  interruptedStage?: V138Plan26222InterruptionProof["stage"]) => disposition ===
  "consumed_stage_interrupted" ? { preflight: true,
    calibration: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    reproduction: interruptedStage === "reproduction" } : disposition ===
  "fresh_destination_failed" ? { preflight: needs.preflight,
    calibration: needs.calibration, reproduction: false } : {
    preflight: needs.preflight, calibration: needs.calibration,
    reproduction: needs.reproduction }

export const buildV138Plan26222TerminalV1 = (input: {
  disposition: V138Plan26222TerminalDisposition
  sourceA3: string
  sourceB3: string
  context?: V138ExecutionContextV7Receipt
  preflight?: V138HostHeadroomPreflightV7Receipt
  calibration?: Record<string, unknown>
  reproduction?: Record<string, unknown>
  consumptionMarkerRoots?: Readonly<{
    preflight: Sha256 | null
    calibration: Sha256 | null
    reproduction: Sha256 | null
  }>
  obstructionProof?: V138Plan26222ObstructionProof
  interruptionProof?: V138Plan26222InterruptionProof
  authorizationRoot: Sha256
  sealRoot: Sha256
}) => {
  const needs = plan26222Needs(input.disposition,
    input.obstructionProof?.stage, input.interruptionProof?.stage)
  const markerNeeds = plan26222MarkerNeeds(input.disposition, needs,
    input.interruptionProof?.stage)
  const roots = { context: input.context?.receiptRoot ?? null,
    preflight: input.preflight?.receiptRoot ?? null,
    calibration: input.calibration?.receiptRoot ?? null,
    reproduction: input.reproduction?.receiptRoot ?? null }
  const consumptionMarkerRoots = input.consumptionMarkerRoots ?? {
    preflight: null, calibration: null, reproduction: null }
  if ((input.context !== undefined) !== needs.context ||
    (input.preflight !== undefined) !== needs.preflight ||
    (input.calibration !== undefined) !== needs.calibration ||
    (input.reproduction !== undefined) !== needs.reproduction ||
    (consumptionMarkerRoots.preflight !== null) !== markerNeeds.preflight ||
    (consumptionMarkerRoots.calibration !== null) !== markerNeeds.calibration ||
    (consumptionMarkerRoots.reproduction !== null) !== markerNeeds.reproduction ||
    (input.disposition === "fresh_destination_failed") !==
      (input.obstructionProof !== undefined) ||
    (input.disposition === "consumed_stage_interrupted") !==
      (input.interruptionProof !== undefined) ||
    (input.interruptionProof !== undefined &&
      input.interruptionProof.markerRoot !==
        consumptionMarkerRoots[input.interruptionProof.stage])) {
    throw new TypeError("MATRIX_PLAN_262_22_PRESENCE_INVALID")
  }
  const calibrationCharged = input.calibration?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "calibration" ||
      input.interruptionProof?.stage === "reproduction" ? 8 : 0)
  const reproductionCharged = input.reproduction?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "reproduction" ? 540 : 0)
  const accepted = input.reproduction?.acceptedCellCount ?? 0
  const body = { schemaVersion: "v1.38-plan-262-22-terminal-v1" as const,
    disposition: input.disposition, sourceA3: input.sourceA3,
    sourceB3: input.sourceB3, authorizationRoot: input.authorizationRoot,
    sealRoot: input.sealRoot, artifactRoots: roots,
    consumptionMarkerRoots,
    obstructionProof: input.obstructionProof ?? null,
    interruptionProof: input.interruptionProof ?? null,
    chargedCalibrationAttemptCount: calibrationCharged,
    chargedReproductionAttemptCount: reproductionCharged,
    acceptedCellCount: accepted,
    completeCleanup: input.disposition === "consumed_stage_interrupted" ?
      false as const : (input.calibration === undefined ||
        input.calibration.completeCleanup === true) &&
        (input.reproduction === undefined ||
          input.reproduction.completeCleanup === true),
    authorityExpired: true as const,
    noRetry: true as const, partialAcceptedEvidenceReusable: false as const }
  return deepFreeze({ ...body, terminalRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body,
  ) })
}

export const checkV138Plan26222TerminalV1 = (
  value: unknown,
  evidence: { sourceA3: string; sourceB3: string; authorizationRoot: Sha256;
    sealRoot: Sha256; context?: V138ExecutionContextV7Receipt;
    preflight?: V138HostHeadroomPreflightV7Receipt;
    calibration?: Record<string, unknown>; reproduction?: Record<string, unknown>;
    consumptionMarkerRoots?: Readonly<{ preflight: Sha256 | null;
      calibration: Sha256 | null; reproduction: Sha256 | null }>;
    obstructionProof?: V138Plan26222ObstructionProof;
    interruptionProof?: V138Plan26222InterruptionProof },
) => {
  const terminal = exactRecord(value, ["schemaVersion", "disposition",
    "sourceA3", "sourceB3", "authorizationRoot", "sealRoot", "artifactRoots",
    "consumptionMarkerRoots", "obstructionProof", "interruptionProof",
    "chargedCalibrationAttemptCount", "chargedReproductionAttemptCount",
    "acceptedCellCount", "completeCleanup", "authorityExpired", "noRetry",
    "partialAcceptedEvidenceReusable", "terminalRoot"],
  "MATRIX_PLAN_262_22_TERMINAL_INVALID")
  const expected = buildV138Plan26222TerminalV1({ ...evidence,
    disposition: String(terminal.disposition) as
      V138Plan26222TerminalDisposition })
  if (canonical(terminal) !== canonical(expected)) {
    throw new TypeError("MATRIX_PLAN_262_22_TERMINAL_INVALID")
  }
  const disposition = terminal.disposition
  const preObservation = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(String(disposition))
  const markerRoots = evidence.consumptionMarkerRoots ?? {
    preflight: null, calibration: null, reproduction: null }
  const preObservationEmpty = evidence.context === undefined &&
    evidence.preflight === undefined && evidence.calibration === undefined &&
    evidence.reproduction === undefined && markerRoots.preflight === null &&
    markerRoots.calibration === null && markerRoots.reproduction === null &&
    terminal.chargedCalibrationAttemptCount === 0 &&
    terminal.chargedReproductionAttemptCount === 0 &&
    terminal.acceptedCellCount === 0
  const obstruction = terminal.obstructionProof === null ? null : exactRecord(
    terminal.obstructionProof, ["stage", "path", "type", "metadataRoot"],
    "MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
  const obstructionValid = obstruction !== null &&
    ["context", "preflight", "calibration", "reproduction"].includes(
      String(obstruction.stage)) &&
    (obstruction.stage === "context" ? [PLAN_262_22_PATHS.context] :
      obstruction.stage === "preflight" ? [PLAN_262_22_PATHS.preflight,
        PLAN_262_22_PATHS.preflightMarker] :
        obstruction.stage === "calibration" ? [PLAN_262_22_PATHS.calibration,
          PLAN_262_22_PATHS.calibrationMarker] :
          [PLAN_262_22_PATHS.reproduction,
            PLAN_262_22_PATHS.reproductionMarker])
      .includes(String(obstruction.path)) &&
    ["file", "directory", "symlink", "other"].includes(
      String(obstruction.type)) && isV138CanonicalSha256(
        obstruction.metadataRoot)
  const interruption = terminal.interruptionProof === null ? null : exactRecord(
    terminal.interruptionProof, ["stage", "markerRoot", "chargedAttemptCount",
      "chargedIdentityId", "observationMode", "childLaunchCount",
      "terminalOutcomeCount", "completeCleanup"],
    "MATRIX_PLAN_262_22_INTERRUPTION_INVALID")
  const interruptionValid = interruption !== null &&
    ["preflight", "calibration", "reproduction"].includes(
      String(interruption.stage)) &&
    isV138CanonicalSha256(interruption.markerRoot) &&
    interruption.markerRoot === markerRoots[interruption.stage as
      "preflight" | "calibration" | "reproduction"] &&
    interruption.chargedAttemptCount === (interruption.stage === "preflight" ?
      1 : interruption.stage === "calibration" ? 8 : 540) &&
    interruption.chargedIdentityId === (interruption.stage === "preflight" ?
      "preflight:v7:0" : null) &&
    interruption.observationMode === "unknown_after_consumption" &&
    interruption.childLaunchCount === null &&
    interruption.terminalOutcomeCount === null &&
    interruption.completeCleanup === false
  const valid = (preObservation && preObservationEmpty && obstruction === null) ||
    (disposition === "fresh_destination_failed" && obstructionValid &&
      (obstruction?.stage !== "reproduction" ||
        evidence.preflight?.disposition === "preflight_admitted" &&
        evidence.calibration?.status === "admitted")) ||
    (disposition === "consumed_stage_interrupted" && interruptionValid &&
      evidence.reproduction === undefined && terminal.completeCleanup === false) ||
    (["preflight_unavailable", "preflight_refused"].includes(String(disposition)) &&
      evidence.context !== undefined && evidence.preflight !== undefined &&
      evidence.calibration !== undefined && evidence.reproduction === undefined &&
      evidence.preflight.disposition === disposition &&
      evidence.calibration.status === disposition &&
      markerRoots.preflight !== null && markerRoots.calibration !== null &&
      markerRoots.reproduction === null) ||
    (disposition === "calibration_stopped" && evidence.calibration?.status ===
      "stopped_process_failure" && evidence.reproduction === undefined &&
      evidence.preflight?.disposition === "preflight_admitted" &&
      markerRoots.preflight !== null && markerRoots.calibration !== null &&
      markerRoots.reproduction === null) ||
    (disposition === "reproduction_stopped" && evidence.calibration?.status ===
      "admitted" && evidence.reproduction?.status === "stopped_process_failure" &&
      evidence.preflight?.disposition === "preflight_admitted" &&
      markerRoots.preflight !== null && markerRoots.calibration !== null &&
      markerRoots.reproduction !== null) ||
    (disposition === "reproduction_passed" && evidence.calibration?.status ===
      "admitted" && evidence.reproduction?.status === "passed_exact" &&
      evidence.reproduction.acceptedCellCount === 540 &&
      evidence.preflight?.disposition === "preflight_admitted" &&
      markerRoots.preflight !== null && markerRoots.calibration !== null &&
      markerRoots.reproduction !== null)
  if (!valid) throw new TypeError("MATRIX_PLAN_262_22_DISPOSITION_JOIN_INVALID")
  return deepFreeze(terminal)
}

const plan26222StagePaths = Object.freeze({
  context: [PLAN_262_22_PATHS.context],
  preflight: [PLAN_262_22_PATHS.preflight, PLAN_262_22_PATHS.preflightMarker],
  calibration: [PLAN_262_22_PATHS.calibration,
    PLAN_262_22_PATHS.calibrationMarker],
  reproduction: [PLAN_262_22_PATHS.reproduction,
    PLAN_262_22_PATHS.reproductionMarker],
})
const plan26222StageOrder = ["context", "preflight", "calibration",
  "reproduction"] as const

const inspectV138Plan26222Obstruction = (repoRoot: string, repoPath: string,
  stage: V138Plan26222ObstructionProof["stage"]):
  V138Plan26222ObstructionProof | undefined => {
  try {
    const stat = lstatSync(path.resolve(repoRoot, repoPath))
    const type = stat.isSymbolicLink() ? "symlink" as const : stat.isFile() ?
      "file" as const : stat.isDirectory() ? "directory" as const :
        "other" as const
    return Object.freeze({ stage, path: repoPath, type,
      metadataRoot: v138SuccessorRoot("artifactManifest",
        "v1.38-plan-262-22-obstruction-metadata-v1", { type, mode: stat.mode,
          size: stat.size, modifiedMilliseconds: Math.trunc(stat.mtimeMs) }) })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined
    throw error
  }
}

export const deriveV138Plan26222Obstruction = (repoRoot: string) => {
  const stages = plan26222StageOrder.map((stage) => ({ stage,
    candidates: plan26222StagePaths[stage].flatMap((repoPath) => {
      const candidate = inspectV138Plan26222Obstruction(repoRoot, repoPath,
        stage)
      return candidate === undefined ? [] : [candidate]
    }) }))
  const active = stages.filter(({ candidates }) => candidates.length > 0).at(-1)
  if (active === undefined || active.candidates.length !== 1) {
    throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
  }
  const activeIndex = stages.indexOf(active)
  if (stages.slice(activeIndex + 1).some(({ candidates }) =>
    candidates.length !== 0)) {
    throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
  }
  return active.candidates[0]!
}

export const checkV138Plan26222Obstruction = (repoRoot: string,
  proof: V138Plan26222ObstructionProof): true => {
  const current = inspectV138Plan26222Obstruction(repoRoot, proof.path,
    proof.stage)
  if (current === undefined || canonical(current) !== canonical(proof)) {
    throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
  }
  for (const repoPath of plan26222StagePaths[proof.stage]) {
    if (repoPath !== proof.path && inspectV138Plan26222Obstruction(repoRoot,
      repoPath, proof.stage) !== undefined) {
      throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
    }
  }
  const stageIndex = plan26222StageOrder.indexOf(proof.stage)
  for (const stage of plan26222StageOrder.slice(stageIndex + 1)) {
    for (const repoPath of plan26222StagePaths[stage]) {
      if (inspectV138Plan26222Obstruction(repoRoot, repoPath, stage) !==
        undefined) throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
    }
  }
  return true
}

export const deriveV138Plan26222InterruptionProof = (repoRoot: string):
  V138Plan26222InterruptionProof | undefined => {
  const stages = [
    { stage: "preflight" as const, publicPath: PLAN_262_22_PATHS.preflight,
      markerPath: PLAN_262_22_PATHS.preflightMarker },
    { stage: "calibration" as const, publicPath: PLAN_262_22_PATHS.calibration,
      markerPath: PLAN_262_22_PATHS.calibrationMarker },
    { stage: "reproduction" as const,
      publicPath: PLAN_262_22_PATHS.reproduction,
      markerPath: PLAN_262_22_PATHS.reproductionMarker },
  ]
  const exists = (repoPath: string) => {
    try { lstatSync(path.resolve(repoRoot, repoPath)); return true } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
      throw error
    }
  }
  const active = stages.filter(({ publicPath, markerPath }) =>
    !exists(publicPath) && exists(markerPath)).at(-1)
  if (active === undefined) return undefined
  const activeIndex = stages.indexOf(active)
  if (stages.slice(activeIndex + 1).some(({ publicPath, markerPath }) =>
    exists(publicPath) || exists(markerPath))) {
    return undefined
  }
  let marker: unknown
  try { marker = readPlan26222(path.resolve(repoRoot, active.markerPath)) } catch {
    return undefined
  }
  if (marker === null || typeof marker !== "object" || Array.isArray(marker) ||
    !isV138CanonicalSha256((marker as { markerRoot?: unknown }).markerRoot)) {
    return undefined
  }
  return Object.freeze({ stage: active.stage,
    markerRoot: (marker as { markerRoot: Sha256 }).markerRoot,
    chargedAttemptCount: active.stage === "preflight" ? 1 as const :
      active.stage === "calibration" ? 8 as const : 540 as const,
    chargedIdentityId: active.stage === "preflight" ?
      "preflight:v7:0" as const : null,
    observationMode: "unknown_after_consumption" as const,
    childLaunchCount: null, terminalOutcomeCount: null,
    completeCleanup: false as const })
}

const plan26222Evidence = (
  repoRoot: string,
  sourceA3: string,
  sourceB3: string,
  disposition: V138Plan26222TerminalDisposition,
  obstructionProof?: V138Plan26222ObstructionProof,
  interruptionProof?: V138Plan26222InterruptionProof,
  sealedRoute?: V138Route3,
) => {
  const route = sealedRoute ?? checkV138Plan26221AuthorityRoute({ repoRoot, sourceA3, sourceB3,
    authorizationValue: readPlan26222(path.resolve(repoRoot,
      PLAN_262_22_PATHS.authorization)),
    sealValue: readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS.seal)) })
  if (sealedRoute === undefined) {
    checkV138SealedWorktreeAtA3(repoRoot, route.seal)
  }
  const preObservation = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(disposition)
  const needs = plan26222Needs(disposition, obstructionProof?.stage,
    interruptionProof?.stage)
  const markerNeeds = plan26222MarkerNeeds(disposition, needs,
    interruptionProof?.stage)
  if (disposition === "fresh_destination_failed") {
    if (obstructionProof === undefined) {
      throw new TypeError("MATRIX_PLAN_262_22_OBSTRUCTION_INVALID")
    }
    checkV138Plan26222Obstruction(repoRoot, obstructionProof)
  }
  if (disposition === "consumed_stage_interrupted") {
    const current = deriveV138Plan26222InterruptionProof(repoRoot)
    if (interruptionProof === undefined || current === undefined ||
      canonical(current) !== canonical(interruptionProof)) {
      throw new TypeError("MATRIX_PLAN_262_22_INTERRUPTION_INVALID")
    }
  }
  if (preObservation) {
    for (const key of ["context", "preflight", "calibration", "reproduction",
      "preflightMarker", "calibrationMarker", "reproductionMarker"] as const) {
      if (existsSync(path.resolve(repoRoot, PLAN_262_22_PATHS[key]))) {
        throw new TypeError("MATRIX_PLAN_262_22_PRE_OBSERVATION_EVIDENCE_INVALID")
      }
    }
  }
  const value = (key: "context" | "preflight" | "calibration" |
    "reproduction") => obstructionProof?.path === PLAN_262_22_PATHS[key] ?
    undefined : readPlan26222(path.resolve(repoRoot, PLAN_262_22_PATHS[key]),
      needs[key])
  const contextValue = preObservation ? undefined : value("context")
  const context = contextValue === undefined ? undefined :
    checkV138ExecutionContextV7Receipt(contextValue, route)
  const preflightValue = preObservation ? undefined : value("preflight")
  const preflight = preflightValue === undefined || context === undefined ?
    undefined : checkV138HostHeadroomPreflightV7Receipt(preflightValue, context)
  const calibrationValue = preObservation ? undefined : value("calibration")
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = calibrationValue === undefined || context === undefined ||
    preflight === undefined ? undefined : checkV138ParallelCalibrationV7Receipt(
      inventory, calibrationValue, context, preflight)
  const reproductionRequired = needs.reproduction
  const reproductionValue = preObservation ? undefined : value("reproduction")
  const reproduction = reproductionValue === undefined || context === undefined ||
    preflight === undefined || calibration === undefined ? undefined :
    checkV138AuthoritativeMatrixV8Receipt(reproductionValue, { inventory,
      context, preflight, calibration })
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v7")
    .map(({ executionAttemptId }) => executionAttemptId)
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v7:${id}`))
  const preflightMarker = !markerNeeds.preflight || context === undefined ||
    obstructionProof?.path === PLAN_262_22_PATHS.preflightMarker ? undefined :
    checkV138Plan26222ConsumptionMarker({ repoRoot, stage: "preflight",
      context, predecessorRoot: context.receiptRoot,
      chargedAttemptIds: ["preflight:v7:0"] })
  const calibrationMarker = !markerNeeds.calibration || context === undefined ||
    preflight === undefined || obstructionProof?.path ===
      PLAN_262_22_PATHS.calibrationMarker ? undefined :
    checkV138Plan26222ConsumptionMarker({
      repoRoot, stage: "calibration", context,
      predecessorRoot: preflight.receiptRoot,
      chargedAttemptIds: calibrationIds })
  const reproductionMarker = !markerNeeds.reproduction || context === undefined ||
    calibration === undefined || obstructionProof?.path ===
      PLAN_262_22_PATHS.reproductionMarker ? undefined :
    checkV138Plan26222ConsumptionMarker({
      repoRoot, stage: "reproduction", context,
      predecessorRoot: calibration.receiptRoot as Sha256,
      chargedAttemptIds: reproductionIds })
  return { route, context, preflight,
    calibration: calibration as Record<string, unknown> | undefined,
    reproduction: reproduction as Record<string, unknown> | undefined,
    obstructionProof,
    interruptionProof,
    consumptionMarkerRoots: {
      preflight: (preflightMarker?.markerRoot as Sha256 | undefined) ?? null,
      calibration: (calibrationMarker?.markerRoot as Sha256 | undefined) ?? null,
      reproduction: (reproductionMarker?.markerRoot as Sha256 | undefined) ?? null,
    } }
}

export const writeV138Plan26222TerminalV1 = (
  repoRoot: string, targetPath: string,
  disposition: V138Plan26222TerminalDisposition,
  sourceA3: string, sourceB3: string,
) => {
  assertV138Plan26222AuthorityOpen(repoRoot)
  const target = plan26222Path(repoRoot, targetPath, "terminal")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  let effectiveDisposition = disposition
  let interruptionProof = disposition === "fresh_destination_failed" ||
    disposition === "consumed_stage_interrupted" ?
    deriveV138Plan26222InterruptionProof(repoRoot) : undefined
  let interruptionEvidence: ReturnType<typeof plan26222Evidence> | undefined
  if (interruptionProof !== undefined) {
    try {
      interruptionEvidence = plan26222Evidence(repoRoot, sourceA3, sourceB3,
        "consumed_stage_interrupted", undefined, interruptionProof)
      effectiveDisposition = "consumed_stage_interrupted"
    } catch (error) {
      if (disposition === "consumed_stage_interrupted") throw error
      interruptionProof = undefined
    }
  } else if (disposition === "consumed_stage_interrupted") {
    throw new TypeError("MATRIX_PLAN_262_22_INTERRUPTION_INVALID")
  }
  const obstructionProof = effectiveDisposition === "fresh_destination_failed" ?
    deriveV138Plan26222Obstruction(repoRoot) : undefined
  const evidence = interruptionEvidence ?? plan26222Evidence(repoRoot, sourceA3,
    sourceB3, effectiveDisposition, obstructionProof, interruptionProof)
  const terminal = buildV138Plan26222TerminalV1({
    disposition: effectiveDisposition, sourceA3,
    sourceB3, authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction,
    consumptionMarkerRoots: evidence.consumptionMarkerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof })
  checkV138Plan26222TerminalV1(terminal, { sourceA3, sourceB3,
    authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction,
    consumptionMarkerRoots: evidence.consumptionMarkerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof })
  writeV138Plan26219Immutable(target, chain, terminal)
  return terminal
}

export const checkV138Plan26222TerminalBranch = (
  repoRoot: string, sourceA3: string, sourceB3: string,
) => {
  const terminalValue = readPlan26222(path.resolve(repoRoot,
    PLAN_262_22_PATHS.terminal))
  if (terminalValue === null || typeof terminalValue !== "object" ||
    Array.isArray(terminalValue) || typeof (terminalValue as {
      disposition?: unknown }).disposition !== "string") {
    throw new TypeError("MATRIX_PLAN_262_22_TERMINAL_INVALID")
  }
  const terminalRecord = terminalValue as Record<string, unknown>
  const disposition = terminalRecord.disposition as
    V138Plan26222TerminalDisposition
  const obstructionProof = terminalRecord.obstructionProof === null ? undefined :
    terminalRecord.obstructionProof as V138Plan26222ObstructionProof
  const interruptionProof = terminalRecord.interruptionProof === null ? undefined :
    terminalRecord.interruptionProof as V138Plan26222InterruptionProof
  const evidence = plan26222Evidence(repoRoot, sourceA3, sourceB3,
    disposition, obstructionProof, interruptionProof)
  return checkV138Plan26222TerminalV1(terminalValue, { sourceA3, sourceB3,
    authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction,
    consumptionMarkerRoots: evidence.consumptionMarkerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof })
}

export const checkV138Plan26222TerminalBranchFromSealedRoute = (
  repoRoot: string, sourceA3: string, sourceB3: string,
  sealedRoute: V138Route3,
) => {
  const terminalValue = readPlan26222(path.resolve(repoRoot,
    PLAN_262_22_PATHS.terminal))
  const terminalRecord = exactRecord(terminalValue, ["schemaVersion",
    "disposition", "sourceA3", "sourceB3", "authorizationRoot", "sealRoot",
    "artifactRoots", "consumptionMarkerRoots", "obstructionProof",
    "interruptionProof", "chargedCalibrationAttemptCount",
    "chargedReproductionAttemptCount", "acceptedCellCount",
    "completeCleanup", "authorityExpired", "noRetry",
    "partialAcceptedEvidenceReusable", "terminalRoot"],
  "MATRIX_PLAN_262_22_TERMINAL_INVALID")
  const dispositions: readonly string[] = ["tool_identity_failed",
    "protected_history_failed", "formation_absence_failed",
    "pattern_c_ownership_failed", "fresh_destination_failed",
    "consumed_stage_interrupted", "preflight_unavailable",
    "preflight_refused", "calibration_stopped", "reproduction_stopped",
    "reproduction_passed"]
  if (!dispositions.includes(String(terminalRecord.disposition))) {
    throw new TypeError("MATRIX_PLAN_262_22_TERMINAL_INVALID")
  }
  const obstructionProof = terminalRecord.obstructionProof === null ?
    undefined : terminalRecord.obstructionProof as V138Plan26222ObstructionProof
  const interruptionProof = terminalRecord.interruptionProof === null ?
    undefined : terminalRecord.interruptionProof as V138Plan26222InterruptionProof
  const evidence = plan26222Evidence(repoRoot, sourceA3, sourceB3,
    terminalRecord.disposition as V138Plan26222TerminalDisposition,
    obstructionProof, interruptionProof, sealedRoute)
  return checkV138Plan26222TerminalV1(terminalValue, { sourceA3, sourceB3,
    authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction,
    consumptionMarkerRoots: evidence.consumptionMarkerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof })
}

registerV138Plan26222AuthoritativeBranchChecker(
  checkV138Plan26222TerminalBranchFromSealedRoute as unknown as (
    repoRoot: string, sourceA3: string, sourceB3: string,
    sealedRoute: Readonly<Record<string, unknown>>,
  ) => Readonly<Record<string, unknown>>,
)

export const dispatchV138CurrentMatrixDirectEntry = async <T>(
  command: string | undefined,
  handlers: Readonly<{
    runShard: () => T | Promise<T>
    runReceipt: () => T | Promise<T>
  }>,
): Promise<T> => {
  if (command === "--execute-shard") return handlers.runShard()
  if (command !== undefined && V138_RECEIPT_DIRECT_COMMANDS.has(command)) {
    return handlers.runReceipt()
  }
  throw new TypeError("MATRIX_RECEIPT_CLI_COMMAND_INVALID")
}

const runReceiptCli = async (): Promise<void> => {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return
  const command = process.argv[2]
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
  if (["--write-execution-context-v9-receipt",
    "--write-headroom-preflight-v9-receipt",
    "--calibrate-parallel-v9-receipt",
    "--write-authoritative-v10-receipt"].includes(String(command))) {
    let output: Record<string, unknown>
    if (command === "--write-execution-context-v9-receipt") {
      if (process.argv.length !== 18 || process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--terminal-agent-registry-json" ||
        process.argv[10] !== "--authorization" ||
        process.argv[12] !== "--seal" || process.argv[14] !== "--source-a5" ||
        process.argv[16] !== "--source-b5") {
        throw new TypeError("MATRIX_EXECUTION_CONTEXT_V9_CLI_ARGUMENTS_INVALID")
      }
      output = writeV138ExecutionContextV9Receipt(repoRoot, process.argv[3]!,
        process.argv[5]!, process.argv[7]!, JSON.parse(process.argv[9]!),
        process.argv[11]!, process.argv[13]!, process.argv[15]!,
        process.argv[17]!)
    } else if (command === "--write-headroom-preflight-v9-receipt") {
      if (process.argv.length !== 14 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization" || process.argv[8] !== "--seal" ||
        process.argv[10] !== "--source-a5" || process.argv[12] !== "--source-b5") {
        throw new TypeError("MATRIX_PREFLIGHT_V9_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138HostHeadroomPreflightV9Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!, process.argv[13]!)
    } else if (command === "--calibrate-parallel-v9-receipt") {
      if (process.argv.length !== 12 || process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a5" || process.argv[10] !== "--source-b5") {
        throw new TypeError("MATRIX_CALIBRATION_V9_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV9Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    } else {
      if (process.argv.length !== 12 || process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a5" || process.argv[10] !== "--source-b5") {
        throw new TypeError("MATRIX_REPRODUCTION_V10_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV10Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    }
    process.stdout.write(`${canonical({ schemaVersion: output.schemaVersion,
      disposition: output.disposition ?? null,
      receiptRoot: output.receiptRoot })}\n`)
    return
  }
  if (command === "--write-plan-262-30-terminal-v1" ||
    command === "--check-plan-262-30-terminal-v1") {
    const write = command === "--write-plan-262-30-terminal-v1"
    const args = process.argv.slice(3)
    const target = write ? args.shift() : undefined
    const flags = new Map<string, string>()
    while (args.length > 0) {
      const flag = args.shift(); const value = args.shift()
      if (flag === undefined || value === undefined || flags.has(flag)) {
        throw new TypeError("MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID")
      }
      flags.set(flag, value)
    }
    const expectedFlags = new Set(write ? ["--authorization", "--seal",
      "--context", "--preflight", "--calibration", "--reproduction",
      "--source-a5", "--source-b5", "--disposition"] :
      ["--authorization", "--seal", "--context", "--preflight",
        "--calibration", "--reproduction", "--terminal", "--source-a5",
        "--source-b5"])
    if (write && (target === undefined || target === "") ||
      flags.size !== expectedFlags.size ||
      [...flags.keys()].some((flag) => !expectedFlags.has(flag))) {
      throw new TypeError("MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID")
    }
    for (const [flag, key] of [["--authorization", "authorization"],
      ["--seal", "seal"], ["--context", "context"],
      ["--preflight", "preflight"], ["--calibration", "calibration"],
      ["--reproduction", "reproduction"], ["--terminal", "terminal"]] as const) {
      if (!write || key !== "terminal") {
        plan26230Path(repoRoot, flags.get(flag) ?? "", key)
      }
    }
    const sourceA5 = flags.get("--source-a5")
    const sourceB5 = flags.get("--source-b5")
    const disposition = flags.get("--disposition")
    if (sourceA5 === undefined || sourceB5 === undefined || write &&
      (disposition === undefined ||
        !V138_PLAN_262_30_ROUTE_CONTRACT.terminalDispositions.includes(
          disposition as never))) {
      throw new TypeError("MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID")
    }
    let patternCObservation: V138Plan26230PatternCObservation | undefined
    const effectiveDisposition = write ? disposition : (() => {
      const terminalValue = readPlan26230(repoRoot, "terminal")
      return terminalValue !== null && typeof terminalValue === "object" &&
        !Array.isArray(terminalValue) ?
        (terminalValue as { disposition?: unknown }).disposition : undefined
    })()
    if (effectiveDisposition === "pattern_c_ownership_failed") {
      const bytes = Buffer.alloc(4097)
      try {
        let length = 0
        while (length < bytes.length) {
          const count = readSync(0, bytes, length, bytes.length - length, null)
          if (count === 0) break
          length += count
        }
        if (length === 0 || length > 4096) {
          throw new TypeError("MATRIX_PLAN_262_30_PATTERN_C_STDIN_INVALID")
        }
        patternCObservation = JSON.parse(bytes.subarray(0, length)
          .toString("utf8"))
      } catch {
        throw new TypeError("MATRIX_PLAN_262_30_CLI_ARGUMENTS_INVALID")
      } finally {
        bytes.fill(0)
      }
    }
    const result = write ? writeV138Plan26230TerminalV1(repoRoot, target!,
      disposition as V138Plan26230Disposition, sourceA5, sourceB5,
      patternCObservation) : checkV138Plan26230TerminalBranch(repoRoot,
        sourceA5, sourceB5, patternCObservation)
    process.stdout.write(`${canonical({ disposition: result.disposition,
      terminalRoot: result.terminalRoot })}\n`)
    return
  }
  if (["--write-execution-context-v8-receipt",
    "--write-headroom-preflight-v8-receipt",
    "--calibrate-parallel-v8-receipt",
    "--write-authoritative-v9-receipt"].includes(String(command))) {
    let output: Record<string, unknown>
    if (command === "--write-execution-context-v8-receipt") {
      if (process.argv.length !== 18 || process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--terminal-agent-registry-json" ||
        process.argv[10] !== "--authorization" ||
        process.argv[12] !== "--seal" || process.argv[14] !== "--source-a4" ||
        process.argv[16] !== "--source-b4") {
        throw new TypeError("MATRIX_EXECUTION_CONTEXT_V8_CLI_ARGUMENTS_INVALID")
      }
      output = writeV138ExecutionContextV8Receipt(repoRoot, process.argv[3]!,
        process.argv[5]!, process.argv[7]!, JSON.parse(process.argv[9]!),
        process.argv[11]!, process.argv[13]!, process.argv[15]!,
        process.argv[17]!)
    } else if (command === "--write-headroom-preflight-v8-receipt") {
      if (process.argv.length !== 14 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization" || process.argv[8] !== "--seal" ||
        process.argv[10] !== "--source-a4" || process.argv[12] !== "--source-b4") {
        throw new TypeError("MATRIX_PREFLIGHT_V8_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138HostHeadroomPreflightV8Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!, process.argv[13]!)
    } else if (command === "--calibrate-parallel-v8-receipt") {
      if (process.argv.length !== 12 || process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a4" || process.argv[10] !== "--source-b4") {
        throw new TypeError("MATRIX_CALIBRATION_V8_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV8Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    } else {
      if (process.argv.length !== 12 || process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a4" || process.argv[10] !== "--source-b4") {
        throw new TypeError("MATRIX_REPRODUCTION_V9_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV9Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    }
    process.stdout.write(`${canonical({ schemaVersion: output.schemaVersion,
      disposition: output.disposition ?? null,
      receiptRoot: output.receiptRoot })}\n`)
    return
  }
  if (command === "--check-plan-262-25-preflight-v8") {
    const flags = new Map<string, string>()
    const args = process.argv.slice(3)
    while (args.length > 0) {
      const flag = args.shift(); const value = args.shift()
      if (flag === undefined || value === undefined || flags.has(flag)) {
        throw new TypeError("MATRIX_PLAN_262_25_CLI_ARGUMENTS_INVALID")
      }
      flags.set(flag, value)
    }
    for (const [flag, key] of [["--authorization", "authorization"],
      ["--seal", "seal"], ["--context", "context"],
      ["--preflight", "preflight"], ["--marker", "preflightMarker"]] as const) {
      plan26225Path(repoRoot, flags.get(flag) ?? "", key)
    }
    const sourceA4 = flags.get("--source-a4")
    const sourceB4 = flags.get("--source-b4")
    if (sourceA4 === undefined || sourceB4 === undefined || flags.size !== 7) {
      throw new TypeError("MATRIX_PLAN_262_25_CLI_ARGUMENTS_INVALID")
    }
    process.stdout.write(`${canonical(checkV138Plan26225PreflightV8(repoRoot,
      sourceA4, sourceB4))}\n`)
    return
  }
  if (command === "--write-plan-262-25-terminal-v1" ||
    command === "--check-plan-262-25-terminal-v1") {
    const write = command === "--write-plan-262-25-terminal-v1"
    const args = process.argv.slice(3)
    const target = write ? args.shift() : undefined
    const flags = new Map<string, string>()
    while (args.length > 0) {
      const flag = args.shift(); const value = args.shift()
      if (flag === undefined || value === undefined || flags.has(flag)) {
        throw new TypeError("MATRIX_PLAN_262_25_CLI_ARGUMENTS_INVALID")
      }
      flags.set(flag, value)
    }
    for (const [flag, key] of [["--authorization", "authorization"],
      ["--seal", "seal"], ["--context", "context"],
      ["--preflight", "preflight"], ["--calibration", "calibration"],
      ["--reproduction", "reproduction"], ["--terminal", "terminal"]] as const) {
      if (!write || key !== "terminal") {
        plan26225Path(repoRoot, flags.get(flag) ?? "", key)
      }
    }
    const sourceA4 = flags.get("--source-a4")
    const sourceB4 = flags.get("--source-b4")
    const disposition = flags.get("--disposition")
    if (sourceA4 === undefined || sourceB4 === undefined || write &&
      (disposition === undefined ||
        !V138_PLAN_262_25_ROUTE_CONTRACT.terminalDispositions.includes(
          disposition as never)) || flags.size !== 9) {
      throw new TypeError("MATRIX_PLAN_262_25_CLI_ARGUMENTS_INVALID")
    }
    const result = write ? writeV138Plan26225TerminalV1(repoRoot, target!,
      disposition as V138Plan26225Disposition, sourceA4, sourceB4) :
      checkV138Plan26225TerminalBranch(repoRoot, sourceA4, sourceB4)
    process.stdout.write(`${canonical({ disposition: result.disposition,
      terminalRoot: result.terminalRoot })}\n`)
    return
  }
  if (
    command === "--write-execution-context-v7-receipt" ||
    command === "--write-headroom-preflight-v7-receipt" ||
    command === "--calibrate-parallel-v7-receipt" ||
    command === "--write-authoritative-v8-receipt"
  ) {
    let output: unknown
    if (command === "--write-execution-context-v7-receipt") {
      if (process.argv.length !== 18 || process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--terminal-agent-registry-json" ||
        process.argv[10] !== "--authorization" ||
        process.argv[12] !== "--seal" || process.argv[14] !== "--source-a3" ||
        process.argv[16] !== "--source-b3") {
        throw new TypeError("MATRIX_EXECUTION_CONTEXT_V7_CLI_ARGUMENTS_INVALID")
      }
      output = writeV138ExecutionContextV7Receipt(repoRoot, process.argv[3]!,
        process.argv[5]!, process.argv[7]!, JSON.parse(process.argv[9]!),
        process.argv[11]!, process.argv[13]!, process.argv[15]!,
        process.argv[17]!)
    } else if (command === "--write-headroom-preflight-v7-receipt") {
      if (process.argv.length !== 14 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization" || process.argv[8] !== "--seal" ||
        process.argv[10] !== "--source-a3" || process.argv[12] !== "--source-b3") {
        throw new TypeError("MATRIX_PREFLIGHT_V7_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138HostHeadroomPreflightV7Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!, process.argv[13]!)
    } else if (command === "--calibrate-parallel-v7-receipt") {
      if (process.argv.length !== 12 || process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a3" || process.argv[10] !== "--source-b3") {
        throw new TypeError("MATRIX_CALIBRATION_V7_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV7Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    } else {
      if (process.argv.length !== 12 || process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a3" || process.argv[10] !== "--source-b3") {
        throw new TypeError("MATRIX_REPRODUCTION_V8_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV8Receipt(repoRoot,
        process.argv[3]!, process.argv[5]!, process.argv[7]!, process.argv[9]!,
        process.argv[11]!)
    }
    const receipt = output as Record<string, unknown>
    process.stdout.write(`${canonical({ schemaVersion: receipt.schemaVersion,
      status: receipt.status ?? null, receiptRoot: receipt.receiptRoot,
      acceptedCellCount: receipt.acceptedCellCount ?? 0 })}\n`)
    return
  }
  if (command === "--write-plan-262-22-terminal-v1" ||
    command === "--check-plan-262-22-terminal-v1") {
    const write = command === "--write-plan-262-22-terminal-v1"
    const args = process.argv.slice(3)
    const target = write ? args.shift() : undefined
    const flags = new Map<string, string>()
    while (args.length > 0) {
      const flag = args.shift()
      const value = args.shift()
      if (flag === undefined || value === undefined || flags.has(flag)) {
        throw new TypeError("MATRIX_PLAN_262_22_CLI_ARGUMENTS_INVALID")
      }
      flags.set(flag, value)
    }
    const sourceA3 = flags.get("--source-a3")
    const sourceB3 = flags.get("--source-b3")
    const disposition = flags.get("--disposition")
    const dispositions: readonly string[] = ["tool_identity_failed",
      "protected_history_failed", "formation_absence_failed",
      "pattern_c_ownership_failed", "fresh_destination_failed",
      "consumed_stage_interrupted",
      "preflight_unavailable", "preflight_refused", "calibration_stopped",
      "reproduction_stopped", "reproduction_passed"]
    if (sourceA3 === undefined || sourceB3 === undefined || write &&
      !dispositions.includes(String(disposition))) {
      throw new TypeError("MATRIX_PLAN_262_22_CLI_ARGUMENTS_INVALID")
    }
    const result = write ? writeV138Plan26222TerminalV1(repoRoot, target!,
      disposition as V138Plan26222TerminalDisposition, sourceA3, sourceB3) :
      checkV138Plan26222TerminalBranch(repoRoot, sourceA3, sourceB3)
    process.stdout.write(`${canonical({ disposition: result.disposition })}\n`)
    return
  }
  if (
    command === "--write-execution-context-v6-receipt" ||
    command === "--write-headroom-preflight-v6-receipt" ||
    command === "--calibrate-parallel-v6-receipt" ||
    command === "--write-authoritative-v7-receipt"
  ) {
    let output: unknown
    if (command === "--write-execution-context-v6-receipt") {
      if (
        process.argv.length !== 18 ||
        process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--terminal-agent-registry-json" ||
        process.argv[10] !== "--authorization" ||
        process.argv[12] !== "--seal" ||
        process.argv[14] !== "--source-a2" ||
        process.argv[16] !== "--source-b2"
      ) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V6_CLI_ARGUMENTS_INVALID")
      output = writeV138ExecutionContextV6Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        JSON.parse(process.argv[9]!),
        process.argv[11]!,
        process.argv[13]!,
        process.argv[15]!,
        process.argv[17]!,
      )
    } else if (command === "--write-headroom-preflight-v6-receipt") {
      if (
        process.argv.length !== 14 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization" ||
        process.argv[8] !== "--seal" ||
        process.argv[10] !== "--source-a2" ||
        process.argv[12] !== "--source-b2"
      ) throw new TypeError("MATRIX_PREFLIGHT_V6_CLI_ARGUMENTS_INVALID")
      output = await writeV138HostHeadroomPreflightV6Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
        process.argv[13]!,
      )
    } else if (command === "--calibrate-parallel-v6-receipt") {
      if (
        process.argv.length !== 12 ||
        process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a2" ||
        process.argv[10] !== "--source-b2"
      ) throw new TypeError("MATRIX_CALIBRATION_V6_CLI_ARGUMENTS_INVALID")
      output = await writeV138ParallelCalibrationV6Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
      )
    } else {
      if (
        process.argv.length !== 12 ||
        process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a2" ||
        process.argv[10] !== "--source-b2"
      ) throw new TypeError("MATRIX_REPRODUCTION_V7_CLI_ARGUMENTS_INVALID")
      output = await writeV138AuthoritativeMatrixV7Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
      )
    }
    const receipt = output as Record<string, unknown>
    process.stdout.write(
      `${canonical({
      schemaVersion: receipt.schemaVersion,
      status: receipt.status ?? null,
      receiptRoot: receipt.receiptRoot,
      acceptedCellCount: receipt.acceptedCellCount ?? 0,
      })}\n`,
    )
    return
  }
  if (
    command === "--write-plan-262-19-terminal-v2" ||
    command === "--check-plan-262-19-terminal-v2"
  ) {
    const write = command === "--write-plan-262-19-terminal-v2"
    const flags = write
      ? ["--disposition", "--authorization", "--seal", "--context", "--preflight", "--calibration", "--reproduction", "--source-a2", "--source-b2"]
      : ["--authorization", "--seal", "--context", "--preflight", "--calibration", "--reproduction", "--terminal", "--source-a2", "--source-b2"]
    if (process.argv.length !== (write ? 22 : 21)) {
      throw new TypeError("MATRIX_PLAN_262_19_CLI_ARGUMENTS_INVALID")
    }
    const values = new Map<string, string>()
    if (write) values.set("--terminal", process.argv[3]!)
    const offset = write ? 4 : 3
    for (const [index, flag] of flags.entries()) {
      if (process.argv[offset + index * 2] !== flag) {
        throw new TypeError("MATRIX_PLAN_262_19_CLI_ARGUMENTS_INVALID")
      }
      values.set(flag, process.argv[offset + index * 2 + 1]!)
    }
    const supplied: Plan26219Paths = {
      authorization: values.get("--authorization")!,
      seal: values.get("--seal")!,
      context: values.get("--context")!,
      preflight: values.get("--preflight")!,
      calibration: values.get("--calibration")!,
      reproduction: values.get("--reproduction")!,
      terminal: values.get("--terminal")!,
    }
    const disposition = write
      ? writeV138Plan26219TerminalV2(
          repoRoot,
          supplied,
          values.get("--disposition") as V138Plan26219TerminalDisposition,
          values.get("--source-a2")!,
          values.get("--source-b2")!,
        ).disposition
      : checkV138Plan26219TerminalBranch(
          repoRoot,
          supplied,
          values.get("--source-a2")!,
          values.get("--source-b2")!,
        )
    process.stdout.write(`${canonical({ disposition })}\n`)
    return
  }
  if (
    command === "--write-execution-context-v5-receipt" ||
    command === "--write-headroom-preflight-v5-receipt" ||
    command === "--calibrate-parallel-v5-receipt" ||
    command === "--write-authoritative-v6-receipt"
  ) {
    let output: unknown
    if (command === "--write-execution-context-v5-receipt") {
      if (
        process.argv.length !== 18 ||
        process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--terminal-agent-registry-json" ||
        process.argv[10] !== "--authorization" ||
        process.argv[12] !== "--seal" ||
        process.argv[14] !== "--source-a" ||
        process.argv[16] !== "--source-b"
      ) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V5_CLI_ARGUMENTS_INVALID")
      output = writeV138ExecutionContextV5Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        JSON.parse(process.argv[9]!),
        process.argv[11]!,
        process.argv[13]!,
        process.argv[15]!,
        process.argv[17]!,
      )
    } else if (command === "--write-headroom-preflight-v5-receipt") {
      if (
        process.argv.length !== 14 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization" ||
        process.argv[8] !== "--seal" ||
        process.argv[10] !== "--source-a" ||
        process.argv[12] !== "--source-b"
      ) throw new TypeError("MATRIX_PREFLIGHT_V5_CLI_ARGUMENTS_INVALID")
      output = await writeV138HostHeadroomPreflightV5Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
        process.argv[13]!,
      )
    } else if (command === "--calibrate-parallel-v5-receipt") {
      if (
        process.argv.length !== 12 ||
        process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a" ||
        process.argv[10] !== "--source-b"
      ) throw new TypeError("MATRIX_CALIBRATION_V5_CLI_ARGUMENTS_INVALID")
      output = await writeV138ParallelCalibrationV5Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
      )
    } else {
      if (
        process.argv.length !== 12 ||
        process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context" ||
        process.argv[8] !== "--source-a" ||
        process.argv[10] !== "--source-b"
      ) throw new TypeError("MATRIX_REPRODUCTION_V6_CLI_ARGUMENTS_INVALID")
      output = await writeV138AuthoritativeMatrixV6Receipt(
        repoRoot,
        process.argv[3]!,
        process.argv[5]!,
        process.argv[7]!,
        process.argv[9]!,
        process.argv[11]!,
      )
    }
    const receipt = output as Record<string, unknown>
    process.stdout.write(
      `${canonical({
      schemaVersion: receipt.schemaVersion,
      status: receipt.status ?? null,
      disposition: receipt.disposition ?? null,
      receiptRoot: receipt.receiptRoot,
      acceptedCellCount: receipt.acceptedCellCount,
      })}\n`,
    )
    return
  }
  if (
    command === "--write-plan-262-16-terminal-v1" ||
    command === "--check-plan-262-16-terminal"
  ) {
    const write = command === "--write-plan-262-16-terminal-v1"
    const flags = write
      ? ["--disposition", "--authorization", "--seal", "--context", "--preflight", "--calibration", "--reproduction", "--source-a", "--source-b"]
      : ["--authorization", "--seal", "--context", "--preflight", "--calibration", "--reproduction", "--terminal", "--source-a", "--source-b"]
    if (process.argv.length !== (write ? 22 : 21)) {
      throw new TypeError("MATRIX_PLAN_262_16_CLI_ARGUMENTS_INVALID")
    }
    const values = new Map<string, string>()
    if (write) values.set("--terminal", process.argv[3]!)
    const offset = write ? 4 : 3
    for (const [index, flag] of flags.entries()) {
      if (process.argv[offset + index * 2] !== flag) {
        throw new TypeError("MATRIX_PLAN_262_16_CLI_ARGUMENTS_INVALID")
      }
      values.set(flag, process.argv[offset + index * 2 + 1]!)
    }
    const supplied = {
      authorization: values.get("--authorization")!,
      seal: values.get("--seal")!,
      context: values.get("--context")!,
      preflight: values.get("--preflight")!,
      calibration: values.get("--calibration")!,
      reproduction: values.get("--reproduction")!,
      terminal: values.get("--terminal")!,
    }
    const disposition = write
      ? writeV138Plan26216Terminal(
          repoRoot,
          supplied,
          values.get("--disposition") as V138Plan26216TerminalDisposition,
          values.get("--source-a")!,
          values.get("--source-b")!,
        ).disposition
      : checkV138Plan26216TerminalBranch(
          repoRoot,
          supplied,
          values.get("--source-a")!,
          values.get("--source-b")!,
        )
    process.stdout.write(`${canonical({ disposition })}\n`)
    return
  }
  if (
    command === "--write-diagnostic-v2-receipt" ||
    command === "--check-diagnostic-v2-receipt"
  ) {
    if (process.argv.length !== 4 || process.argv[3] === undefined) {
      throw new TypeError("MATRIX_DIAGNOSTIC_V2_CLI_ARGUMENTS_INVALID")
    }
    const targetPath = path.resolve(repoRoot, process.argv[3])
    const receipt =
      command === "--write-diagnostic-v2-receipt"
        ? await writeV138MatrixDiagnosticV2Receipt(repoRoot, targetPath)
        : checkV138MatrixDiagnosticV2Receipt(
            repoRoot,
            JSON.parse(readFileSync(targetPath, "utf8")),
          )
    process.stdout.write(
      `${canonical({
        status: receipt.status,
        receiptRoot: receipt.receiptRoot,
        chargedRoot: receipt.chargedRoot,
        diagnosticIdentityCount: receipt.executedIdentityIds.length,
        acceptedCellCount: receipt.acceptedCellCount,
      })}\n`,
    )
    return
  }
  if (
    [
      "--write-execution-context-v4-receipt",
      "--check-execution-context-v4-receipt",
      "--write-headroom-preflight-v4-receipt",
      "--check-headroom-preflight-v4-receipt",
      "--calibrate-parallel-v4-receipt",
      "--check-calibration-v4-receipt",
      "--write-authoritative-v5-receipt",
      "--check-successor-v4-v5-branch",
    ].includes(command ?? "")
  ) {
    let output: unknown
    if (command === "--write-execution-context-v4-receipt") {
      if (
        process.argv.length !== 10 ||
        process.argv[4] !== "--mode" ||
        process.argv[6] !== "--cwd" ||
        process.argv[8] !== "--plan-agent-snapshot-json"
      ) {
        throw new TypeError(
          "MATRIX_EXECUTION_CONTEXT_V4_CLI_ARGUMENTS_INVALID",
        )
      }
      output = writeV138ExecutionContextV4Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        process.argv[5]!,
        process.argv[7]!,
        JSON.parse(process.argv[9]!),
      )
    } else if (command === "--check-execution-context-v4-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError(
          "MATRIX_EXECUTION_CONTEXT_V4_CLI_ARGUMENTS_INVALID",
        )
      }
      output = checkV138ExecutionContextV4Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--write-headroom-preflight-v4-receipt") {
      if (
        process.argv.length !== 8 ||
        process.argv[4] !== "--execution-context" ||
        process.argv[6] !== "--authorization"
      ) {
        throw new TypeError("MATRIX_PREFLIGHT_V4_CLI_ARGUMENTS_INVALID")
      }
      output = writeV138HostHeadroomPreflightV4Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
        process.argv[7]!,
      )
    } else if (command === "--check-headroom-preflight-v4-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_PREFLIGHT_V4_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138HostHeadroomPreflightV4Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--calibrate-parallel-v4-receipt") {
      if (
        process.argv.length !== 8 ||
        process.argv[4] !== "--preflight" ||
        process.argv[6] !== "--execution-context"
      ) {
        throw new TypeError("MATRIX_CALIBRATION_V4_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV4Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
        path.resolve(repoRoot, process.argv[7]!),
      )
    } else if (command === "--check-calibration-v4-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_CALIBRATION_V4_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138ParallelCalibrationV4Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--write-authoritative-v5-receipt") {
      if (
        process.argv.length !== 8 ||
        process.argv[4] !== "--calibration" ||
        process.argv[6] !== "--execution-context"
      ) {
        throw new TypeError("MATRIX_AUTHORITATIVE_V5_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV5Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
        path.resolve(repoRoot, process.argv[7]!),
      )
    } else {
      if (process.argv.length !== 5) {
        throw new TypeError("MATRIX_SUCCESSOR_BRANCH_CLI_ARGUMENTS_INVALID")
      }
      const calibrationPath = path.resolve(repoRoot, process.argv[3]!)
      const v5Path = path.resolve(repoRoot, process.argv[4]!)
      output = checkV138SuccessorV4V5Branch(
        repoRoot,
        {
          branchSource: "persisted",
          executionContextPath: path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-execution-context-v4.json",
          ),
          preflightPath: path.resolve(
            repoRoot,
            ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v4.json",
          ),
          calibrationPath,
          reproductionV5Path: v5Path,
        },
        JSON.parse(readFileSync(calibrationPath, "utf8")),
        readOptionalJson(v5Path),
      )
    }
    const receipt = output as {
      status?: unknown
      receiptRoot?: unknown
      acceptedCellCount?: unknown
      hostHeadroomBasisPoints?: unknown
      disposition?: unknown
      calibration?: { status?: unknown }
      reproduction?: {
        status?: unknown
        receiptRoot?: unknown
        acceptedCellCount?: unknown
      } | null
    }
    process.stdout.write(
      `${canonical({
        status:
          receipt.status ??
          receipt.reproduction?.status ??
          receipt.calibration?.status,
        disposition: receipt.disposition ?? null,
        receiptRoot:
          receipt.receiptRoot ?? receipt.reproduction?.receiptRoot ?? null,
        hostHeadroomBasisPoints:
          receipt.hostHeadroomBasisPoints ?? null,
        acceptedCellCount:
          receipt.acceptedCellCount ??
          receipt.reproduction?.acceptedCellCount ??
          0,
      })}\n`,
    )
    return
  }
  if (
    [
      "--write-headroom-preflight-v3-receipt",
      "--check-headroom-preflight-v3-receipt",
      "--calibrate-parallel-v3-receipt",
      "--check-calibration-v3-receipt",
      "--write-authoritative-v4-receipt",
      "--check-authoritative-v4-receipt",
      "--check-successor-v3-v4-branch",
    ].includes(command ?? "")
  ) {
    let output: unknown
    if (command === "--write-headroom-preflight-v3-receipt") {
      if (process.argv.length !== 5) {
        throw new TypeError("MATRIX_PREFLIGHT_V3_CLI_ARGUMENTS_INVALID")
      }
      output = writeV138HostHeadroomPreflightV3Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        process.argv[4]!,
      )
    } else if (command === "--check-headroom-preflight-v3-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_PREFLIGHT_V3_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138HostHeadroomPreflightV3Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--calibrate-parallel-v3-receipt") {
      if (
        process.argv.length !== 7 ||
        process.argv[4] !== "--preflight"
      ) {
        throw new TypeError("MATRIX_CALIBRATION_V3_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV3Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
        process.argv[6]!,
      )
    } else if (command === "--check-calibration-v3-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_CALIBRATION_V3_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138ParallelCalibrationV3Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--write-authoritative-v4-receipt") {
      if (
        process.argv.length !== 6 ||
        process.argv[4] !== "--calibration"
      ) {
        throw new TypeError("MATRIX_AUTHORITATIVE_V4_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV4Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
      )
    } else if (command === "--check-authoritative-v4-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_AUTHORITATIVE_V4_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138AuthoritativeMatrixV4Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else {
      if (process.argv.length !== 5) {
        throw new TypeError("MATRIX_SUCCESSOR_BRANCH_CLI_ARGUMENTS_INVALID")
      }
      const calibrationPath = path.resolve(repoRoot, process.argv[3]!)
      const v4Path = path.resolve(repoRoot, process.argv[4]!)
      output = checkV138SuccessorV3V4Branch(
        repoRoot,
        JSON.parse(readFileSync(calibrationPath, "utf8")),
        existsSync(v4Path)
          ? JSON.parse(readFileSync(v4Path, "utf8"))
          : undefined,
      )
    }
    const receipt = output as {
      status?: unknown
      receiptRoot?: unknown
      acceptedCellCount?: unknown
      hostHeadroomBasisPoints?: unknown
      disposition?: unknown
      calibration?: { status?: unknown }
      reproduction?: {
        status?: unknown
        receiptRoot?: unknown
        acceptedCellCount?: unknown
      } | null
    }
    process.stdout.write(
      `${canonical({
        status:
          receipt.status ??
          receipt.reproduction?.status ??
          receipt.calibration?.status,
        disposition: receipt.disposition ?? null,
        receiptRoot:
          receipt.receiptRoot ?? receipt.reproduction?.receiptRoot ?? null,
        hostHeadroomBasisPoints:
          receipt.hostHeadroomBasisPoints ?? null,
        acceptedCellCount:
          receipt.acceptedCellCount ??
          receipt.reproduction?.acceptedCellCount ??
          0,
      })}\n`,
    )
    return
  }
  if (
    [
      "--calibrate-parallel-v2-receipt",
      "--check-calibration-v2-receipt",
      "--write-authoritative-v3-receipt",
      "--check-authoritative-v3-receipt",
      "--check-successor-v2-v3-branch",
    ].includes(command ?? "")
  ) {
    let output: unknown
    if (command === "--calibrate-parallel-v2-receipt") {
      if (process.argv.length !== 5) {
        throw new TypeError("MATRIX_CALIBRATION_V2_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138ParallelCalibrationV2Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        process.argv[4]!,
      )
    } else if (command === "--check-calibration-v2-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_CALIBRATION_V2_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138ParallelCalibrationV2Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else if (command === "--write-authoritative-v3-receipt") {
      if (
        process.argv.length !== 6 ||
        process.argv[4] !== "--calibration"
      ) {
        throw new TypeError("MATRIX_AUTHORITATIVE_V3_CLI_ARGUMENTS_INVALID")
      }
      output = await writeV138AuthoritativeMatrixV3Receipt(
        repoRoot,
        path.resolve(repoRoot, process.argv[3]!),
        path.resolve(repoRoot, process.argv[5]!),
      )
    } else if (command === "--check-authoritative-v3-receipt") {
      if (process.argv.length !== 4) {
        throw new TypeError("MATRIX_AUTHORITATIVE_V3_CLI_ARGUMENTS_INVALID")
      }
      output = checkV138AuthoritativeMatrixV3Receipt(
        repoRoot,
        JSON.parse(
          readFileSync(path.resolve(repoRoot, process.argv[3]!), "utf8"),
        ),
      )
    } else {
      if (process.argv.length !== 5) {
        throw new TypeError("MATRIX_SUCCESSOR_BRANCH_CLI_ARGUMENTS_INVALID")
      }
      const calibrationPath = path.resolve(repoRoot, process.argv[3]!)
      const v3Path = path.resolve(repoRoot, process.argv[4]!)
      output = checkV138SuccessorV2V3Branch(
        repoRoot,
        JSON.parse(readFileSync(calibrationPath, "utf8")),
        existsSync(v3Path)
          ? JSON.parse(readFileSync(v3Path, "utf8"))
          : undefined,
      )
    }
    const receipt = output as {
      status?: unknown
      receiptRoot?: unknown
      acceptedCellCount?: unknown
      calibration?: { status?: unknown }
      reproduction?: {
        status?: unknown
        receiptRoot?: unknown
        acceptedCellCount?: unknown
      } | null
    }
    process.stdout.write(
      `${canonical({
        status:
          receipt.status ??
          receipt.reproduction?.status ??
          receipt.calibration?.status,
        receiptRoot:
          receipt.receiptRoot ?? receipt.reproduction?.receiptRoot ?? null,
        acceptedCellCount:
          receipt.acceptedCellCount ??
          receipt.reproduction?.acceptedCellCount ??
          0,
      })}\n`,
    )
    return
  }
  if (
    ![
      "--calibrate-parallel-receipt",
      "--check-calibration-receipt",
      "--require-calibration-admitted",
      "--require-stopped-process-failure",
    ].includes(command ?? "")
  ) {
    throw new TypeError("MATRIX_RECEIPT_CLI_COMMAND_INVALID")
  }
  if (process.argv.length !== 4 || process.argv[3] === undefined) {
    throw new TypeError("MATRIX_CALIBRATION_CLI_ARGUMENTS_INVALID")
  }
  const targetPath = path.resolve(repoRoot, process.argv[3])
  const receipt =
    command === "--calibrate-parallel-receipt"
      ? await runV138ParallelMatrixCalibration(repoRoot, targetPath)
      : checkV138ParallelCalibrationSuccessorReceipt(
          repoRoot,
          JSON.parse(readFileSync(targetPath, "utf8")),
        )
  if (
    command === "--require-calibration-admitted" &&
    receipt.status !== "calibration_admitted"
  ) {
    throw new TypeError("MATRIX_PARALLEL_CALIBRATION_NOT_ADMITTED")
  }
  if (
    command === "--require-stopped-process-failure" &&
    receipt.status !== "stopped_process_failure"
  ) {
    throw new TypeError("MATRIX_PARALLEL_CALIBRATION_NOT_STOPPED")
  }
  process.stdout.write(
    `${canonical({
      status: receipt.status,
      receiptRoot: receipt.receiptRoot,
      calibrationRoot: receipt.calibration.calibrationRoot,
      projectedTotalMilliseconds:
        receipt.calibration.projection.projectedTotalMilliseconds,
      acceptedCellCount: receipt.acceptedCellCount,
    })}\n`,
  )
  if (
    command === "--calibrate-parallel-receipt" &&
    receipt.status === "stopped_process_failure"
  ) {
    process.exitCode = 1
  }
}

const replaceVersionStrings = (value: unknown, from: string,
  to: string): unknown => typeof value === "string" ? value.split(from).join(to) :
  Array.isArray(value) ? value.map((entry) => replaceVersionStrings(entry,
    from, to)) : value !== null && typeof value === "object" ?
    Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
      replaceVersionStrings(entry, from, to)])) : value

const route4ContextAsV7 = (value: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV8Receipt(value)
  const body = { schemaVersion:
    "v1.38-current-matrix-execution-context-v7" as const,
    mode: context.mode, cwd: context.cwd,
    terminalAgentRegistry: { ...(context.terminalAgentRegistry as object),
      schemaVersion: "v1.38-plan-262-22-terminal-agent-registry-v1" },
    sourceA3: context.sourceA4, sourceB3: context.sourceB4,
    sourceB3Custody: context.sourceB4Custody,
    sourceB3CustodyRoot: context.sourceB4CustodyRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    selectedRouteClosureRoot: context.selectedRouteClosureRoot,
    protectedHistoryRoot: context.protectedHistoryRoot,
    patternCOwnership: context.patternCOwnership,
    formationAbsenceBound: context.formationAbsenceBound,
    runtimeRoute: context.runtimeRoute,
    resourceSampleMilliseconds: context.resourceSampleMilliseconds,
    acceptedCellCount: context.acceptedCellCount, noRetry: context.noRetry }
  return checkV138ExecutionContextV7Receipt({ ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(body.schemaVersion), body) })
}

const route4PreflightAsV7 = (value: Record<string, unknown>,
  contextV8: Record<string, unknown>) => {
  const preflight = checkV138HostHeadroomPreflightV8Receipt(value, contextV8)
  const contextV7 = route4ContextAsV7(contextV8)
  const body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v7" as const,
    sourceA3: preflight.sourceA4, sourceB3: preflight.sourceB4,
    executionContextRoot: contextV7.receiptRoot,
    authorizationRoot: preflight.authorizationRoot,
    sealRoot: preflight.sealRoot,
    chargedIdentityId: preflight.chargedIdentityId,
    metricId: preflight.metricId, providerId: preflight.providerId,
    parserId: preflight.parserId,
    requiredHostHeadroomBasisPoints:
      preflight.requiredHostHeadroomBasisPoints,
    observation: preflight.observation, disposition: preflight.disposition,
    acceptedCellCount: preflight.acceptedCellCount,
    noRetry: preflight.noRetry }, ":v8:", ":v7:") as
    Record<string, unknown>
  return checkV138HostHeadroomPreflightV7Receipt({ ...body,
    receiptRoot: v138SuccessorRoot("canonicalJsonProfile",
      String(body.schemaVersion), body) }, contextV7)
}

export const buildV138ParallelCalibrationV8Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>;
  context: Record<string, unknown>; preflight: Record<string, unknown>;
  calibration?: Readonly<V138ParallelCalibrationReceipt>;
  callbackFailureAfterConsumption?: true }) => {
  const context = checkV138ExecutionContextV8Receipt(input.context)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(input.preflight,
    context)
  const contextV7 = route4ContextAsV7(context)
  const preflightV7 = route4PreflightAsV7(preflight, context)
  const calibrationV7Body = input.calibration === undefined ? undefined :
    replaceVersionStrings(calibrationWithoutRoot(input.calibration),
      ":v8:", ":v7:") as Omit<V138ParallelCalibrationReceipt,
        "calibrationRoot">
  const calibrationV7 = calibrationV7Body === undefined ? undefined :
    deepFreeze({ ...calibrationV7Body,
      calibrationRoot: sha256(canonical(calibrationV7Body)) })
  const v7 = buildV138ParallelCalibrationV7Receipt({ inventory: input.inventory,
    executionContext: contextV7, preflight: preflightV7,
    calibration: calibrationV7,
    callbackFailureAfterConsumption: input.callbackFailureAfterConsumption })
  const body = replaceVersionStrings({ ...v7,
    schemaVersion: "v1.38-current-matrix-calibration-v8",
    sourceA4: context.sourceA4, sourceB4: context.sourceB4,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot }, ":v7:", ":v8:") as
    Record<string, unknown>
  delete body.sourceA3; delete body.sourceB3; delete body.receiptRoot
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", String(body.schemaVersion), body) })
}

export const checkV138ParallelCalibrationV8Receipt = (inventory:
  Readonly<V138CurrentMatrixInventory>, value: unknown,
  contextValue: Record<string, unknown>, preflightValue: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV8Receipt(contextValue)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(preflightValue,
    context)
  const receipt = exactRecord(value, ["schemaVersion",
    "executionContextRoot", "preflightRoot", "status", "chargedAttemptCount",
    "calibrationShardCount", "observationMode", "childLaunchCount",
    "terminalOutcomeCount", "acceptedCellCount", "completeCleanup",
    "publicStopReason", "supervisionRoot", "attempts", "runtimeRoute",
    "privacyProjection", "noRetry", "sourceA4", "sourceB4", "receiptRoot"],
  "MATRIX_CALIBRATION_V8_INVALID")
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-calibration-v8" ||
    receipt.sourceA4 !== context.sourceA4 || receipt.sourceB4 !== context.sourceB4 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_CALIBRATION_V8_INVALID")
  }
  const contextV7 = route4ContextAsV7(context)
  const preflightV7 = route4PreflightAsV7(preflight, context)
  const v7Body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-calibration-v7",
    sourceA3: contextV7.sourceA3, sourceB3: contextV7.sourceB3,
    executionContextRoot: contextV7.receiptRoot,
    preflightRoot: preflightV7.receiptRoot, status: receipt.status,
    chargedAttemptCount: receipt.chargedAttemptCount,
    calibrationShardCount: receipt.calibrationShardCount,
    observationMode: receipt.observationMode,
    childLaunchCount: receipt.childLaunchCount,
    terminalOutcomeCount: receipt.terminalOutcomeCount,
    acceptedCellCount: receipt.acceptedCellCount,
    completeCleanup: receipt.completeCleanup,
    publicStopReason: receipt.publicStopReason,
    supervisionRoot: receipt.supervisionRoot, attempts: receipt.attempts,
    runtimeRoute: receipt.runtimeRoute,
    privacyProjection: receipt.privacyProjection,
    noRetry: receipt.noRetry }, ":v8:", ":v7:") as
    Record<string, unknown>
  checkV138ParallelCalibrationV7Receipt(inventory, { ...v7Body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(v7Body.schemaVersion), v7Body) }, contextV7, preflightV7)
  return deepFreeze(receipt)
}

export const writeV138ParallelCalibrationV8Receipt = async (repoRoot: string,
  targetPath: string, preflightPath: string, contextPath: string,
  sourceA4: string, sourceB4: string,
  run: typeof calibrateV138ParallelMatrix = calibrateV138ParallelMatrix) => {
  assertV138Plan26225AuthorityOpen(repoRoot)
  const target = plan26225Path(repoRoot, targetPath, "calibration")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26225Path(repoRoot, preflightPath, "preflight")
  plan26225Path(repoRoot, contextPath, "context")
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const context = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(
    readPlan26225(repoRoot, "preflight"), context)
  checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v8:0"])
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v8")
    .map(({ executionAttemptId }) => executionAttemptId)
  writeV138Plan26225Marker(repoRoot, "calibration", context,
    preflight.receiptRoot, calibrationIds)
  let calibration: Readonly<V138ParallelCalibrationReceipt> | undefined
  let callbackFailureAfterConsumption: true | undefined
  if (preflight.disposition === "preflight_admitted") {
    try { calibration = await run({ inventory,
      runner: createV138SubprocessShardRunner(repoRoot,
        { useLegacyHostMemory: false }),
      sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
        executeOwnedMemoryPressureQ),
      hardwareIdentity: { operatingSystem: `${platform()} ${release()}`,
        architecture: arch(), nodeVersion: process.version,
        cpuIdentity: cpus()[0]?.model ?? "unavailable" },
      repoRoot, executionIdentityVersion: "v8" })
    } catch { callbackFailureAfterConsumption = true }
  }
  assertV138Plan26225AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4,
    sourceB4, authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV8Receipt(
    readPlan26225(repoRoot, "preflight"), currentContext)
  checkV138Plan26225PrerequisiteRoots({ context: context.receiptRoot,
    preflight: preflight.receiptRoot }, { context: currentContext.receiptRoot,
    preflight: currentPreflight.receiptRoot })
  checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v8:0"])
  checkV138Plan26225ConsumptionMarker(repoRoot, "calibration", currentContext,
    currentPreflight.receiptRoot, calibrationIds)
  const receipt = checkV138ParallelCalibrationV8Receipt(inventory,
    buildV138ParallelCalibrationV8Receipt({ inventory, context: currentContext,
      preflight: currentPreflight, calibration,
      callbackFailureAfterConsumption }), currentContext, currentPreflight)
  assertV138Plan26225PublicationRoute(repoRoot, sourceA4, sourceB4,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

const route4CalibrationAsV7 = (inventory: Readonly<V138CurrentMatrixInventory>,
  value: Record<string, unknown>, context: Record<string, unknown>,
  preflight: Record<string, unknown>) => {
  const checked = checkV138ParallelCalibrationV8Receipt(inventory, value,
    context, preflight)
  const contextV7 = route4ContextAsV7(context)
  const preflightV7 = route4PreflightAsV7(preflight, context)
  const body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-calibration-v7",
    sourceA3: contextV7.sourceA3, sourceB3: contextV7.sourceB3,
    executionContextRoot: contextV7.receiptRoot,
    preflightRoot: preflightV7.receiptRoot, status: checked.status,
    chargedAttemptCount: checked.chargedAttemptCount,
    calibrationShardCount: checked.calibrationShardCount,
    observationMode: checked.observationMode,
    childLaunchCount: checked.childLaunchCount,
    terminalOutcomeCount: checked.terminalOutcomeCount,
    acceptedCellCount: checked.acceptedCellCount,
    completeCleanup: checked.completeCleanup,
    publicStopReason: checked.publicStopReason,
    supervisionRoot: checked.supervisionRoot, attempts: checked.attempts,
    runtimeRoute: checked.runtimeRoute,
    privacyProjection: checked.privacyProjection,
    noRetry: checked.noRetry }, ":v8:", ":v7:") as
    Record<string, unknown>
  return checkV138ParallelCalibrationV7Receipt(inventory, { ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(body.schemaVersion), body) }, contextV7, preflightV7)
}

export const buildV138AuthoritativeMatrixV9Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>;
  context: Record<string, unknown>; preflight: Record<string, unknown>;
  calibration: Record<string, unknown>;
  execution?: V138ParallelMatrixExecutionResult;
  callbackFailureAfterConsumption?: true }) => {
  const context = checkV138ExecutionContextV8Receipt(input.context)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(input.preflight,
    context)
  const calibration = checkV138ParallelCalibrationV8Receipt(input.inventory,
    input.calibration, context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V9_CALIBRATION_NOT_ADMITTED")
  }
  const contextV7 = route4ContextAsV7(context)
  const preflightV7 = route4PreflightAsV7(preflight, context)
  const calibrationV7 = route4CalibrationAsV7(input.inventory, calibration,
    context, preflight)
  const executionV7 = input.execution === undefined ? undefined :
    replaceVersionStrings(input.execution, ":v8:", ":v7:") as
      V138ParallelMatrixExecutionResult
  const v8 = buildV138AuthoritativeMatrixV8Receipt({ inventory: input.inventory,
    context: contextV7, preflight: preflightV7, calibration: calibrationV7,
    execution: executionV7,
    callbackFailureAfterConsumption: input.callbackFailureAfterConsumption })
  const body = replaceVersionStrings({ ...v8,
    schemaVersion: "v1.38-current-matrix-reproduction-v9",
    sourceA4: context.sourceA4, sourceB4: context.sourceB4,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot,
    calibrationRoot: calibration.receiptRoot }, ":v7:", ":v8:") as
    Record<string, unknown>
  delete body.sourceA3; delete body.sourceB3; delete body.receiptRoot
  const attempts = body.attempts
  body.attemptLedgerRoot = v138SuccessorRoot("evidenceBundle",
    "v1.38-current-matrix-reproduction-v9-attempt-ledger-v1",
    { calibrationRoot: calibration.receiptRoot, planRoot: body.planRoot,
      attempts })
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", String(body.schemaVersion), body) })
}

export const checkV138AuthoritativeMatrixV9Receipt = (value: unknown,
  evidence: { inventory: Readonly<V138CurrentMatrixInventory>;
    context: Record<string, unknown>; preflight: Record<string, unknown>;
    calibration: Record<string, unknown> }) => {
  const context = checkV138ExecutionContextV8Receipt(evidence.context)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(evidence.preflight,
    context)
  const calibration = checkV138ParallelCalibrationV8Receipt(evidence.inventory,
    evidence.calibration, context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V9_CALIBRATION_NOT_ADMITTED")
  }
  const receipt = exactRecord(value, ["schemaVersion",
    "executionContextRoot", "preflightRoot", "calibrationRoot", "status",
    "chargedAttemptCount", "observationMode", "childLaunchCount",
    "terminalOutcomeCount", "acceptedCellCount", "completeCleanup",
    "publicStopReason", "planRoot", "attempts", "attemptLedgerRoot",
    "runtimeRoute", "privacyProjection", "partialAcceptedEvidenceReusable",
    "noRetry", "sourceA4", "sourceB4", "receiptRoot"],
  "MATRIX_REPRODUCTION_V9_INVALID")
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-reproduction-v9" ||
    receipt.sourceA4 !== context.sourceA4 || receipt.sourceB4 !== context.sourceB4 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receipt.calibrationRoot !== calibration.receiptRoot ||
    receipt.attemptLedgerRoot !== v138SuccessorRoot("evidenceBundle",
      "v1.38-current-matrix-reproduction-v9-attempt-ledger-v1",
      { calibrationRoot: calibration.receiptRoot, planRoot: receipt.planRoot,
        attempts: receipt.attempts }) ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_REPRODUCTION_V9_INVALID")
  }
  const contextV7 = route4ContextAsV7(context)
  const preflightV7 = route4PreflightAsV7(preflight, context)
  const calibrationV7 = route4CalibrationAsV7(evidence.inventory, calibration,
    context, preflight)
  const v8Body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-reproduction-v8",
    sourceA3: contextV7.sourceA3, sourceB3: contextV7.sourceB3,
    executionContextRoot: contextV7.receiptRoot,
    preflightRoot: preflightV7.receiptRoot,
    calibrationRoot: calibrationV7.receiptRoot, status: receipt.status,
    chargedAttemptCount: receipt.chargedAttemptCount,
    observationMode: receipt.observationMode,
    childLaunchCount: receipt.childLaunchCount,
    terminalOutcomeCount: receipt.terminalOutcomeCount,
    acceptedCellCount: receipt.acceptedCellCount,
    completeCleanup: receipt.completeCleanup,
    publicStopReason: receipt.publicStopReason, planRoot: receipt.planRoot,
    attempts: receipt.attempts, attemptLedgerRoot: receipt.attemptLedgerRoot,
    runtimeRoute: receipt.runtimeRoute,
    privacyProjection: receipt.privacyProjection,
    partialAcceptedEvidenceReusable:
      receipt.partialAcceptedEvidenceReusable,
    noRetry: receipt.noRetry }, ":v8:", ":v7:") as
    Record<string, unknown>
  v8Body.attemptLedgerRoot = v138SuccessorRoot("evidenceBundle",
    "v1.38-current-matrix-reproduction-v8-attempt-ledger-v1",
    { calibrationRoot: calibrationV7.receiptRoot,
      planRoot: v8Body.planRoot, attempts: v8Body.attempts })
  checkV138AuthoritativeMatrixV8Receipt({ ...v8Body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(v8Body.schemaVersion), v8Body) }, { inventory: evidence.inventory,
    context: contextV7, preflight: preflightV7, calibration: calibrationV7 })
  return deepFreeze(receipt)
}

export const writeV138AuthoritativeMatrixV9Receipt = async (repoRoot: string,
  targetPath: string, calibrationPath: string, contextPath: string,
  sourceA4: string, sourceB4: string,
  run: typeof executeV138ParallelMatrix = executeV138ParallelMatrix) => {
  assertV138Plan26225AuthorityOpen(repoRoot)
  const target = plan26225Path(repoRoot, targetPath, "reproduction")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26225Path(repoRoot, calibrationPath, "calibration")
  plan26225Path(repoRoot, contextPath, "context")
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const context = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV8Receipt(
    readPlan26225(repoRoot, "preflight"), context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = checkV138ParallelCalibrationV8Receipt(inventory,
    readPlan26225(repoRoot, "calibration"), context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V9_CALIBRATION_NOT_ADMITTED")
  }
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v8")
    .map(({ executionAttemptId }) => executionAttemptId)
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v8:${id}`))
  checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v8:0"])
  checkV138Plan26225ConsumptionMarker(repoRoot, "calibration", context,
    preflight.receiptRoot, calibrationIds)
  writeV138Plan26225Marker(repoRoot, "reproduction", context,
    calibration.receiptRoot, reproductionIds)
  let execution: V138ParallelMatrixExecutionResult | undefined
  let callbackFailureAfterConsumption: true | undefined
  try { execution = await run({ inventory,
    admittedCalibrationRoot: calibration.supervisionRoot as Sha256,
    runner: createV138SubprocessShardRunner(repoRoot,
      { useLegacyHostMemory: false }),
    sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
      executeOwnedMemoryPressureQ), repoRoot, executionIdentityVersion: "v8" })
  } catch { callbackFailureAfterConsumption = true }
  assertV138Plan26225AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4,
    sourceB4, authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV8Receipt(
    readPlan26225(repoRoot, "context"), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV8Receipt(
    readPlan26225(repoRoot, "preflight"), currentContext)
  const currentCalibration = checkV138ParallelCalibrationV8Receipt(inventory,
    readPlan26225(repoRoot, "calibration"), currentContext, currentPreflight)
  checkV138Plan26225PrerequisiteRoots({ context: context.receiptRoot,
    preflight: preflight.receiptRoot, calibration: calibration.receiptRoot },
  { context: currentContext.receiptRoot,
    preflight: currentPreflight.receiptRoot,
    calibration: currentCalibration.receiptRoot })
  checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v8:0"])
  checkV138Plan26225ConsumptionMarker(repoRoot, "calibration", currentContext,
    currentPreflight.receiptRoot, calibrationIds)
  checkV138Plan26225ConsumptionMarker(repoRoot, "reproduction", currentContext,
    currentCalibration.receiptRoot, reproductionIds)
  const receipt = checkV138AuthoritativeMatrixV9Receipt(
    buildV138AuthoritativeMatrixV9Receipt({ inventory, context: currentContext,
      preflight: currentPreflight, calibration: currentCalibration, execution,
      callbackFailureAfterConsumption }), { inventory, context: currentContext,
      preflight: currentPreflight, calibration: currentCalibration })
  assertV138Plan26225PublicationRoute(repoRoot, sourceA4, sourceB4,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

type V138Plan26225Disposition =
  typeof V138_PLAN_262_25_DISPOSITIONS[number]
export type V138Plan26225ObstructionProof = Readonly<{
  stage: "context" | "preflight" | "calibration" | "reproduction"
  path: string; type: "file" | "directory" | "symlink" | "other"
  metadataRoot: Sha256
}>
export type V138Plan26225InterruptionProof = Readonly<{
  stage: "preflight" | "calibration" | "reproduction"
  markerRoot: Sha256; chargedAttemptCount: 1 | 8 | 540
  chargedIdentityId: "preflight:v8:0" | null
  observationMode: "unknown_after_consumption"
  childLaunchCount: null; terminalOutcomeCount: null; completeCleanup: false
}>

const checkV138Plan26225Disposition = (value: unknown):
  V138Plan26225Disposition => {
  if (typeof value !== "string" ||
    !V138_PLAN_262_25_DISPOSITIONS.includes(value as never)) {
    throw new TypeError("MATRIX_PLAN_262_25_DISPOSITION_INVALID")
  }
  return value as V138Plan26225Disposition
}

const plan26225Needs = (disposition: V138Plan26225Disposition,
  obstructionStage?: V138Plan26225ObstructionProof["stage"],
  interruptedStage?: V138Plan26225InterruptionProof["stage"]) => {
  if (disposition === "fresh_destination_failed") return {
    context: obstructionStage !== "context",
    preflight: obstructionStage === "calibration" ||
      obstructionStage === "reproduction",
    calibration: obstructionStage === "reproduction", reproduction: false }
  if (disposition === "consumed_stage_interrupted") return {
    context: true, preflight: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    calibration: interruptedStage === "reproduction", reproduction: false }
  const pre = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(disposition)
  return { context: !pre, preflight: !pre,
    calibration: ["calibration_stopped", "reproduction_stopped",
      "reproduction_passed"].includes(disposition),
    reproduction: ["reproduction_stopped", "reproduction_passed"]
      .includes(disposition) }
}

const plan26225MarkerNeeds = (disposition: V138Plan26225Disposition,
  needs: ReturnType<typeof plan26225Needs>,
  interruptedStage?: V138Plan26225InterruptionProof["stage"]) => disposition ===
  "consumed_stage_interrupted" ? { preflight: true,
    calibration: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    reproduction: interruptedStage === "reproduction" } : disposition ===
  "fresh_destination_failed" ? { preflight: needs.preflight,
    calibration: needs.calibration, reproduction: false } : {
    preflight: needs.preflight, calibration: needs.calibration,
    reproduction: needs.reproduction }

const plan26225StagePaths = Object.freeze({
  context: [PLAN_262_25_PATHS.context],
  preflight: [PLAN_262_25_PATHS.preflight, PLAN_262_25_PATHS.preflightMarker],
  calibration: [PLAN_262_25_PATHS.calibration,
    PLAN_262_25_PATHS.calibrationMarker],
  reproduction: [PLAN_262_25_PATHS.reproduction,
    PLAN_262_25_PATHS.reproductionMarker],
})
const plan26225StageOrder = ["context", "preflight", "calibration",
  "reproduction"] as const

const inspectV138Plan26225Obstruction = (repoRoot: string, repoPath: string,
  stage: V138Plan26225ObstructionProof["stage"]):
  V138Plan26225ObstructionProof | undefined => {
  try {
    const stat = lstatSync(path.resolve(repoRoot, repoPath))
    const type = stat.isSymbolicLink() ? "symlink" as const : stat.isFile() ?
      "file" as const : stat.isDirectory() ? "directory" as const :
        "other" as const
    return Object.freeze({ stage, path: repoPath, type,
      metadataRoot: v138SuccessorRoot("artifactManifest",
        "v1.38-plan-262-25-obstruction-metadata-v1", { type, mode: stat.mode,
          size: stat.size, modifiedMilliseconds: Math.trunc(stat.mtimeMs) }) })
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return undefined
    throw error
  }
}

export const deriveV138Plan26225Obstruction = (repoRoot: string) => {
  const stages = plan26225StageOrder.map((stage) => ({ stage,
    candidates: plan26225StagePaths[stage].flatMap((repoPath) => {
      const candidate = inspectV138Plan26225Obstruction(repoRoot, repoPath, stage)
      return candidate === undefined ? [] : [candidate]
    }) }))
  const active = stages.filter(({ candidates }) => candidates.length > 0).at(-1)
  if (active === undefined || active.candidates.length !== 1) {
    throw new TypeError("MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
  }
  return active.candidates[0]!
}

export const checkV138Plan26225Obstruction = (repoRoot: string,
  proof: V138Plan26225ObstructionProof): true => {
  const current = inspectV138Plan26225Obstruction(repoRoot, proof.path,
    proof.stage)
  if (current === undefined || canonical(current) !== canonical(proof)) {
    throw new TypeError("MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
  }
  for (const repoPath of plan26225StagePaths[proof.stage]) {
    if (repoPath !== proof.path && inspectV138Plan26225Obstruction(repoRoot,
      repoPath, proof.stage) !== undefined) {
      throw new TypeError("MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
    }
  }
  const stageIndex = plan26225StageOrder.indexOf(proof.stage)
  for (const stage of plan26225StageOrder.slice(stageIndex + 1)) {
    for (const repoPath of plan26225StagePaths[stage]) {
      if (inspectV138Plan26225Obstruction(repoRoot, repoPath, stage) !==
        undefined) throw new TypeError("MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
    }
  }
  return true
}

export const deriveV138Plan26225InterruptionProof = (repoRoot: string):
  V138Plan26225InterruptionProof | undefined => {
  const stages = [
    { stage: "preflight" as const, publicPath: PLAN_262_25_PATHS.preflight,
      markerPath: PLAN_262_25_PATHS.preflightMarker },
    { stage: "calibration" as const, publicPath: PLAN_262_25_PATHS.calibration,
      markerPath: PLAN_262_25_PATHS.calibrationMarker },
    { stage: "reproduction" as const,
      publicPath: PLAN_262_25_PATHS.reproduction,
      markerPath: PLAN_262_25_PATHS.reproductionMarker },
  ]
  const present = (repoPath: string) => {
    try { lstatSync(path.resolve(repoRoot, repoPath)); return true } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return false
      throw error
    }
  }
  const active = stages.filter(({ publicPath, markerPath }) =>
    !present(publicPath) && present(markerPath)).at(-1)
  if (active === undefined) return undefined
  const activeIndex = stages.indexOf(active)
  if (stages.slice(activeIndex + 1).some(({ publicPath, markerPath }) =>
    present(publicPath) || present(markerPath))) return undefined
  let marker: unknown
  try { marker = readPlan26225(repoRoot,
    `${active.stage}Marker` as "preflightMarker" | "calibrationMarker" |
      "reproductionMarker") } catch { return undefined }
  if (marker === null || typeof marker !== "object" || Array.isArray(marker) ||
    !isV138CanonicalSha256((marker as { markerRoot?: unknown }).markerRoot)) {
    return undefined
  }
  return Object.freeze({ stage: active.stage,
    markerRoot: (marker as { markerRoot: Sha256 }).markerRoot,
    chargedAttemptCount: active.stage === "preflight" ? 1 as const :
      active.stage === "calibration" ? 8 as const : 540 as const,
    chargedIdentityId: active.stage === "preflight" ?
      "preflight:v8:0" as const : null,
    observationMode: "unknown_after_consumption" as const,
    childLaunchCount: null, terminalOutcomeCount: null,
    completeCleanup: false as const })
}

const plan26225Evidence = (repoRoot: string, sourceA4: string,
  sourceB4: string, dispositionValue: V138Plan26225Disposition,
  obstructionProof?: V138Plan26225ObstructionProof,
  interruptionProof?: V138Plan26225InterruptionProof) => {
  const disposition = checkV138Plan26225Disposition(dispositionValue)
  const route = checkV138Plan26224AuthorityRoute({ repoRoot, sourceA4, sourceB4,
    authorizationValue: readPlan26225(repoRoot, "authorization"),
    sealValue: readPlan26225(repoRoot, "seal") })
  const preObservation = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(disposition)
  const needs = plan26225Needs(disposition, obstructionProof?.stage,
    interruptionProof?.stage)
  const markerNeeds = plan26225MarkerNeeds(disposition, needs,
    interruptionProof?.stage)
  if (disposition === "fresh_destination_failed") {
    if (obstructionProof === undefined) {
      throw new TypeError("MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
    }
    checkV138Plan26225Obstruction(repoRoot, obstructionProof)
  }
  if (disposition === "consumed_stage_interrupted") {
    const current = deriveV138Plan26225InterruptionProof(repoRoot)
    if (interruptionProof === undefined || current === undefined ||
      canonical(current) !== canonical(interruptionProof)) {
      throw new TypeError("MATRIX_PLAN_262_25_INTERRUPTION_INVALID")
    }
  }
  if (preObservation) {
    for (const key of ["context", "preflight", "calibration", "reproduction",
      "preflightMarker", "calibrationMarker", "reproductionMarker"] as const) {
      if (existsSync(path.resolve(repoRoot, PLAN_262_25_PATHS[key]))) {
        throw new TypeError("MATRIX_PLAN_262_25_PRE_OBSERVATION_EVIDENCE_INVALID")
      }
    }
  }
  for (const [key, required] of [["context", needs.context],
    ["preflight", needs.preflight], ["calibration", needs.calibration],
    ["reproduction", needs.reproduction],
    ["preflightMarker", markerNeeds.preflight],
    ["calibrationMarker", markerNeeds.calibration],
    ["reproductionMarker", markerNeeds.reproduction]] as const) {
    const obstructed = obstructionProof?.path === PLAN_262_25_PATHS[key]
    if (!required && !obstructed &&
      existsSync(path.resolve(repoRoot, PLAN_262_25_PATHS[key]))) {
      throw new TypeError(`MATRIX_PLAN_262_25_${key.toUpperCase()}_MUST_BE_ABSENT`)
    }
  }
  const value = (key: "context" | "preflight" | "calibration" |
    "reproduction") => obstructionProof?.path === PLAN_262_25_PATHS[key] ?
    undefined : readPlan26225(repoRoot, key, needs[key])
  const contextValue = preObservation ? undefined : value("context")
  const context = contextValue === undefined ? undefined :
    checkV138ExecutionContextV8Receipt(contextValue, route)
  const preflightValue = preObservation ? undefined : value("preflight")
  const preflight = preflightValue === undefined || context === undefined ?
    undefined : checkV138HostHeadroomPreflightV8Receipt(preflightValue, context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationValue = preObservation ? undefined : value("calibration")
  const calibration = calibrationValue === undefined || context === undefined ||
    preflight === undefined ? undefined : checkV138ParallelCalibrationV8Receipt(
      inventory, calibrationValue, context, preflight)
  const reproductionValue = preObservation ? undefined : value("reproduction")
  const reproduction = reproductionValue === undefined || context === undefined ||
    preflight === undefined || calibration === undefined ? undefined :
    checkV138AuthoritativeMatrixV9Receipt(reproductionValue, { inventory,
      context, preflight, calibration })
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v8")
    .map(({ executionAttemptId }) => executionAttemptId)
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v8:${id}`))
  const preflightMarker = !markerNeeds.preflight || context === undefined ||
    obstructionProof?.path === PLAN_262_25_PATHS.preflightMarker ? undefined :
    checkV138Plan26225ConsumptionMarker(repoRoot, "preflight", context,
      context.receiptRoot, ["preflight:v8:0"])
  const calibrationMarker = !markerNeeds.calibration ||
    context === undefined ||
    obstructionProof?.path === PLAN_262_25_PATHS.calibrationMarker ||
    preflight === undefined ? undefined : checkV138Plan26225ConsumptionMarker(
      repoRoot, "calibration", context, preflight.receiptRoot, calibrationIds)
  const reproductionMarker = !markerNeeds.reproduction ||
    context === undefined ||
    calibration === undefined || obstructionProof?.path ===
      PLAN_262_25_PATHS.reproductionMarker ? undefined :
    checkV138Plan26225ConsumptionMarker(
      repoRoot, "reproduction", context, calibration.receiptRoot,
      reproductionIds)
  return { route, context, preflight, calibration, reproduction,
    obstructionProof, interruptionProof,
    markerRoots: { preflight: preflightMarker?.markerRoot ?? null,
      calibration: calibrationMarker?.markerRoot ?? null,
      reproduction: reproductionMarker?.markerRoot ?? null } }
}

export const buildV138Plan26225TerminalV1 = (input: {
  disposition: V138Plan26225Disposition; sourceA4: string; sourceB4: string;
  authorizationRoot: unknown; sealRoot: unknown;
  context?: Record<string, unknown>; preflight?: Record<string, unknown>;
  calibration?: Record<string, unknown>; reproduction?: Record<string, unknown>;
  markerRoots: Readonly<{ preflight: unknown; calibration: unknown;
    reproduction: unknown }>
  obstructionProof?: V138Plan26225ObstructionProof
  interruptionProof?: V138Plan26225InterruptionProof }) => {
  const disposition = checkV138Plan26225Disposition(input.disposition)
  const needs = plan26225Needs(disposition, input.obstructionProof?.stage,
    input.interruptionProof?.stage)
  const markerNeeds = plan26225MarkerNeeds(disposition, needs,
    input.interruptionProof?.stage)
  if ((input.context !== undefined) !== needs.context ||
    (input.preflight !== undefined) !== needs.preflight ||
    (input.calibration !== undefined) !== needs.calibration ||
    (input.reproduction !== undefined) !== needs.reproduction ||
    (input.markerRoots.preflight !== null) !== markerNeeds.preflight ||
    (input.markerRoots.calibration !== null) !== markerNeeds.calibration ||
    (input.markerRoots.reproduction !== null) !== markerNeeds.reproduction ||
    (disposition === "fresh_destination_failed") !==
      (input.obstructionProof !== undefined) ||
    (disposition === "consumed_stage_interrupted") !==
      (input.interruptionProof !== undefined) ||
    (input.interruptionProof !== undefined &&
      input.interruptionProof.markerRoot !==
        input.markerRoots[input.interruptionProof.stage])) {
    throw new TypeError("MATRIX_PLAN_262_25_PRESENCE_INVALID")
  }
  if ((disposition === "reproduction_stopped" ||
      disposition === "reproduction_passed") &&
    input.calibration?.status !== "admitted") {
    throw new TypeError("MATRIX_PLAN_262_25_DISPOSITION_JOIN_INVALID")
  }
  const calibrationCharged = input.calibration?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "calibration" ||
      input.interruptionProof?.stage === "reproduction" ? 8 : 0)
  const reproductionCharged = input.reproduction?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "reproduction" ? 540 : 0)
  const body = { schemaVersion: "v1.38-plan-262-25-terminal-v1" as const,
    disposition, sourceA4: input.sourceA4,
    sourceB4: input.sourceB4, authorizationRoot: input.authorizationRoot,
    sealRoot: input.sealRoot,
    artifactRoots: { context: input.context?.receiptRoot ?? null,
      preflight: input.preflight?.receiptRoot ?? null,
      calibration: input.calibration?.receiptRoot ?? null,
      reproduction: input.reproduction?.receiptRoot ?? null },
    consumptionMarkerRoots: input.markerRoots,
    obstructionProof: input.obstructionProof ?? null,
    interruptionProof: input.interruptionProof ?? null,
    chargedCalibrationAttemptCount: calibrationCharged,
    chargedReproductionAttemptCount: reproductionCharged,
    acceptedCellCount: input.reproduction?.acceptedCellCount ?? 0,
    completeCleanup: disposition === "consumed_stage_interrupted" ?
      false as const : (input.calibration === undefined ||
      input.calibration.completeCleanup === true) &&
      (input.reproduction === undefined ||
        input.reproduction.completeCleanup === true),
    authorityExpired: true as const, noRetry: true as const,
    partialAcceptedEvidenceReusable: false as const }
  return deepFreeze({ ...body, terminalRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body) })
}

export const checkV138Plan26225TerminalV1 = (value: unknown,
  evidence: ReturnType<typeof plan26225Evidence>, disposition:
  V138Plan26225Disposition) => {
  const terminal = exactRecord(value, ["schemaVersion", "disposition",
    "sourceA4", "sourceB4", "authorizationRoot", "sealRoot", "artifactRoots",
    "consumptionMarkerRoots", "obstructionProof", "interruptionProof",
    "chargedCalibrationAttemptCount",
    "chargedReproductionAttemptCount", "acceptedCellCount", "completeCleanup",
    "authorityExpired", "noRetry", "partialAcceptedEvidenceReusable",
    "terminalRoot"], "MATRIX_PLAN_262_25_TERMINAL_INVALID")
  checkV138Plan26225Disposition(disposition)
  const expected = buildV138Plan26225TerminalV1({ disposition,
    sourceA4: evidence.route.custody.sourceA4,
    sourceB4: evidence.route.custody.sourceB4,
    authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction, markerRoots: evidence.markerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof })
  const obstruction = terminal.obstructionProof === null ? null : exactRecord(
    terminal.obstructionProof, ["stage", "path", "type", "metadataRoot"],
    "MATRIX_PLAN_262_25_OBSTRUCTION_INVALID")
  const interruption = terminal.interruptionProof === null ? null : exactRecord(
    terminal.interruptionProof, ["stage", "markerRoot", "chargedAttemptCount",
      "chargedIdentityId", "observationMode", "childLaunchCount",
      "terminalOutcomeCount", "completeCleanup"],
    "MATRIX_PLAN_262_25_INTERRUPTION_INVALID")
  const obstructionValid = obstruction !== null &&
    ["context", "preflight", "calibration", "reproduction"].includes(
      String(obstruction.stage)) &&
    (obstruction.stage === "context" ? [PLAN_262_25_PATHS.context] :
      obstruction.stage === "preflight" ? [PLAN_262_25_PATHS.preflight,
        PLAN_262_25_PATHS.preflightMarker] : obstruction.stage === "calibration" ?
        [PLAN_262_25_PATHS.calibration, PLAN_262_25_PATHS.calibrationMarker] :
        [PLAN_262_25_PATHS.reproduction,
          PLAN_262_25_PATHS.reproductionMarker])
      .includes(String(obstruction.path)) &&
    ["file", "directory", "symlink", "other"].includes(
      String(obstruction.type)) && isV138CanonicalSha256(obstruction.metadataRoot)
  const interruptionValid = interruption !== null &&
    ["preflight", "calibration", "reproduction"].includes(
      String(interruption.stage)) &&
    isV138CanonicalSha256(interruption.markerRoot) &&
    interruption.markerRoot === evidence.markerRoots[interruption.stage as
      "preflight" | "calibration" | "reproduction"] &&
    interruption.chargedAttemptCount === (interruption.stage === "preflight" ?
      1 : interruption.stage === "calibration" ? 8 : 540) &&
    interruption.chargedIdentityId === (interruption.stage === "preflight" ?
      "preflight:v8:0" : null) &&
    interruption.observationMode === "unknown_after_consumption" &&
    interruption.childLaunchCount === null &&
    interruption.terminalOutcomeCount === null &&
    interruption.completeCleanup === false
  if (canonical(terminal) !== canonical(expected) ||
    disposition === "fresh_destination_failed" && (!obstructionValid ||
      obstruction?.stage === "reproduction" &&
        (evidence.preflight?.disposition !== "preflight_admitted" ||
          evidence.calibration?.status !== "admitted")) ||
    disposition === "consumed_stage_interrupted" &&
      (!interruptionValid || evidence.reproduction !== undefined ||
        terminal.completeCleanup !== false) ||
    disposition === "preflight_unavailable" &&
      evidence.preflight?.disposition !== "preflight_unavailable" ||
    disposition === "preflight_refused" &&
      evidence.preflight?.disposition !== "preflight_refused" ||
    disposition === "calibration_stopped" &&
      evidence.calibration?.status !== "stopped_process_failure" ||
    disposition === "reproduction_stopped" &&
      (evidence.calibration?.status !== "admitted" ||
        evidence.reproduction?.status !== "stopped_process_failure") ||
    disposition === "reproduction_passed" && (
      evidence.calibration?.status !== "admitted" ||
      evidence.reproduction?.status !== "passed_exact" ||
      evidence.reproduction?.acceptedCellCount !== 540)) {
    throw new TypeError("MATRIX_PLAN_262_25_TERMINAL_INVALID")
  }
  return deepFreeze(terminal)
}

export const writeV138Plan26225TerminalV1 = (repoRoot: string,
  targetPath: string, disposition: V138Plan26225Disposition,
  sourceA4: string, sourceB4: string) => {
  checkV138Plan26225Disposition(disposition)
  assertV138Plan26225AuthorityOpen(repoRoot)
  const target = plan26225Path(repoRoot, targetPath, "terminal")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  let effectiveDisposition = disposition
  let interruptionProof = disposition === "fresh_destination_failed" ||
    disposition === "consumed_stage_interrupted" ?
    deriveV138Plan26225InterruptionProof(repoRoot) : undefined
  let interruptionEvidence: ReturnType<typeof plan26225Evidence> | undefined
  if (interruptionProof !== undefined) {
    try {
      interruptionEvidence = plan26225Evidence(repoRoot, sourceA4, sourceB4,
        "consumed_stage_interrupted", undefined, interruptionProof)
      effectiveDisposition = "consumed_stage_interrupted"
    } catch (error) {
      if (disposition === "consumed_stage_interrupted") throw error
      interruptionProof = undefined
    }
  } else if (disposition === "consumed_stage_interrupted") {
    throw new TypeError("MATRIX_PLAN_262_25_INTERRUPTION_INVALID")
  }
  const obstructionProof = effectiveDisposition === "fresh_destination_failed" ?
    deriveV138Plan26225Obstruction(repoRoot) : undefined
  const evidence = interruptionEvidence ?? plan26225Evidence(repoRoot, sourceA4,
    sourceB4, effectiveDisposition, obstructionProof, interruptionProof)
  const terminal = checkV138Plan26225TerminalV1(
    buildV138Plan26225TerminalV1({ disposition: effectiveDisposition,
      sourceA4, sourceB4,
      authorizationRoot: evidence.route.authorization.authorizationRoot,
      sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
      preflight: evidence.preflight, calibration: evidence.calibration,
      reproduction: evidence.reproduction, markerRoots: evidence.markerRoots,
      obstructionProof: evidence.obstructionProof,
      interruptionProof: evidence.interruptionProof }),
    evidence, effectiveDisposition)
  writeV138Plan26219Immutable(target, chain, terminal)
  return terminal
}

export const checkV138Plan26225TerminalBranch = (repoRoot: string,
  sourceA4: string, sourceB4: string) => {
  const terminal = exactRecord(readPlan26225(repoRoot, "terminal"),
    ["schemaVersion", "disposition", "sourceA4", "sourceB4",
      "authorizationRoot", "sealRoot", "artifactRoots",
      "consumptionMarkerRoots", "obstructionProof", "interruptionProof",
      "chargedCalibrationAttemptCount",
      "chargedReproductionAttemptCount", "acceptedCellCount",
      "completeCleanup", "authorityExpired", "noRetry",
      "partialAcceptedEvidenceReusable", "terminalRoot"],
    "MATRIX_PLAN_262_25_TERMINAL_INVALID")
  const disposition = checkV138Plan26225Disposition(terminal.disposition)
  const obstructionProof = terminal.obstructionProof === null ? undefined :
    terminal.obstructionProof as V138Plan26225ObstructionProof
  const interruptionProof = terminal.interruptionProof === null ? undefined :
    terminal.interruptionProof as V138Plan26225InterruptionProof
  return checkV138Plan26225TerminalV1(terminal,
    plan26225Evidence(repoRoot, sourceA4, sourceB4, disposition,
      obstructionProof, interruptionProof), disposition)
}

export const V138_PLAN_262_30_DISPOSITIONS = Object.freeze([
  "tool_identity_failed", "protected_history_failed",
  "formation_absence_failed", "pattern_c_ownership_failed",
  "fresh_destination_failed", "consumed_stage_interrupted",
  "preflight_unavailable", "preflight_refused", "calibration_stopped",
  "reproduction_stopped", "reproduction_passed",
] as const)

export const V138_PLAN_262_30_ROUTE_CONTRACT = Object.freeze({
  schemaVersion: "v1.38-plan-262-30-route-contract-v1" as const,
  routeOrdinal: 5 as const,
  authorizationSchema: V138_PLAN_262_29_AUTHORIZATION_SCHEMA,
  sealSchema: V138_SUCCESSOR_SOURCE_SEAL_V5_SCHEMA,
  executionContextSchema:
    "v1.38-current-matrix-execution-context-v9" as const,
  preflightSchema:
    "v1.38-current-matrix-headroom-preflight-v9" as const,
  calibrationSchema: "v1.38-current-matrix-calibration-v9" as const,
  reproductionSchema: "v1.38-current-matrix-reproduction-v10" as const,
  consumptionSchema: "v1.38-plan-262-30-consumption-v1" as const,
  terminalSchema: "v1.38-plan-262-30-terminal-v1" as const,
  terminalDispositions: V138_PLAN_262_30_DISPOSITIONS,
  failureProtocolSchema: V138_CURRENT_MATRIX_CHILD_PROTOCOL_V2_SCHEMA,
  resourceSampleMilliseconds: 200 as const,
  requiredHostHeadroomBasisPoints: 2500 as const,
  calibrationAttemptCount: 8 as const,
  calibrationShardCount: 4 as const,
  reproductionCellCount: 540 as const,
  canonicalDestinations: V138_PLAN_262_30_FRESH_DESTINATIONS,
  noRetry: true as const,
  partialAcceptedEvidenceReusable: false as const,
})

export const checkV138Plan26230RouteContract = (value: unknown) => {
  if (canonical(value) !== canonical(V138_PLAN_262_30_ROUTE_CONTRACT)) {
    throw new TypeError("MATRIX_PLAN_262_30_ROUTE_CONTRACT_INVALID")
  }
  return V138_PLAN_262_30_ROUTE_CONTRACT
}

const PLAN_262_30_PATHS = Object.freeze({
  authorization: ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v5.json",
  context: V138_PLAN_262_30_FRESH_DESTINATIONS[0],
  preflight: V138_PLAN_262_30_FRESH_DESTINATIONS[1],
  calibration: V138_PLAN_262_30_FRESH_DESTINATIONS[2],
  reproduction: V138_PLAN_262_30_FRESH_DESTINATIONS[3],
  terminal: V138_PLAN_262_30_FRESH_DESTINATIONS[4],
  preflightMarker: V138_PLAN_262_30_FRESH_DESTINATIONS[5],
  calibrationMarker: V138_PLAN_262_30_FRESH_DESTINATIONS[6],
  reproductionMarker: V138_PLAN_262_30_FRESH_DESTINATIONS[7],
})

const plan26230Path = (repoRoot: string, supplied: string,
  key: keyof typeof PLAN_262_30_PATHS): string => {
  const resolved = path.resolve(repoRoot, supplied)
  if (resolved !== path.resolve(repoRoot, PLAN_262_30_PATHS[key])) {
    throw new TypeError("MATRIX_PLAN_262_30_PATH_INVALID")
  }
  return resolved
}

const readPlan26230 = (repoRoot: string, key: keyof typeof PLAN_262_30_PATHS,
  required = true): unknown => {
  const target = path.resolve(repoRoot, PLAN_262_30_PATHS[key])
  if (!existsSync(target)) {
    if (required) throw new TypeError(`MATRIX_PLAN_262_30_${key.toUpperCase()}_REQUIRED`)
    return undefined
  }
  const stat = lstatSync(target)
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError(`MATRIX_PLAN_262_30_${key.toUpperCase()}_INVALID`)
  }
  try { return JSON.parse(readFileSync(target, "utf8")) } catch {
    throw new TypeError(`MATRIX_PLAN_262_30_${key.toUpperCase()}_INVALID`)
  }
}

const checkV138Plan26229AuthorityRoute = (input: { repoRoot: string;
  sourceA5: string; sourceB5: string; authorizationValue: unknown;
  sealValue: unknown }) => {
  const custody = checkV138SuccessorSealCommitV5({ repoRoot: input.repoRoot,
    sourceA5: input.sourceA5, sourceB5: input.sourceB5,
    allowPlan26230Artifacts: true })
  const authorization = checkV138Plan26229AuthorizationV5(input.repoRoot,
    input.authorizationValue)
  const seal = checkV138SuccessorSourceSealV5(input.repoRoot, input.sealValue,
    authorization)
  checkV138SealedWorktreeAtA5(input.repoRoot, seal)
  if (custody.authorizationRoot !== authorization.authorizationRoot ||
    custody.sealRoot !== seal.sealRoot) {
    throw new TypeError("MATRIX_PLAN_262_30_AUTHORITY_JOIN_INVALID")
  }
  return { custody, authorization, seal }
}

type V138Route5 = ReturnType<typeof checkV138Plan26229AuthorityRoute>

const checkRegistryV5 = (value: unknown) => {
  const registry = exactRecord(value,
    ["schemaVersion", "activeExecutorCount", "agents"],
    "MATRIX_EXECUTION_CONTEXT_V9_REGISTRY_INVALID")
  if (registry.schemaVersion !==
    "v1.38-plan-262-30-terminal-agent-registry-v1" ||
    registry.activeExecutorCount !== 0 || !Array.isArray(registry.agents) ||
    registry.agents.some((entry) => {
      const agent = exactRecord(entry, ["id", "status"],
        "MATRIX_EXECUTION_CONTEXT_V9_REGISTRY_INVALID")
      return typeof agent.id !== "string" || agent.id.length === 0 ||
        !["completed", "failed"].includes(String(agent.status))
    })) throw new TypeError("MATRIX_EXECUTION_CONTEXT_V9_REGISTRY_INVALID")
  return registry
}

export const checkV138PatternCOwnershipV9 = (input: {
  mode: unknown; cwd: unknown; terminalAgentRegistry: unknown
}) => {
  const registry = checkRegistryV5(input.terminalAgentRegistry)
  if (input.mode !== "gsd-pattern-c-inline-main" ||
    input.cwd !== "/Users/roryquinlan/runtime/cowards-game") {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V9_ROUTE_INVALID")
  }
  return deepFreeze({ mode: input.mode, cwd: input.cwd,
    terminalAgentRegistry: registry })
}

export const buildV138ExecutionContextV9Receipt = (input: { route: V138Route5;
  mode: string; cwd: string; terminalAgentRegistry: unknown }) => {
  const ownership = checkV138PatternCOwnershipV9(input)
  const body = { schemaVersion:
    "v1.38-current-matrix-execution-context-v9" as const,
    mode: ownership.mode, cwd: ownership.cwd,
    terminalAgentRegistry: ownership.terminalAgentRegistry,
    sourceA5: input.route.custody.sourceA5,
    sourceB5: input.route.custody.sourceB5,
    sourceB5Custody: input.route.custody,
    sourceB5CustodyRoot: input.route.custody.custodyRoot,
    authorizationRoot: input.route.authorization.authorizationRoot,
    sealRoot: input.route.seal.sealRoot,
    selectedRouteClosureRoot: input.route.seal.selectedRouteClosure.closureRoot,
    protectedHistoryRoot:
      input.route.seal.protectedHistory.protectedHistoryRoot,
    priorAuthorizationBytes:
      input.route.seal.protectedHistory.priorAuthorizationBytes,
    patternCOwnership: "main_orchestrator_only" as const,
    formationAbsenceBound: true as const,
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    resourceSampleMilliseconds: 200 as const, acceptedCellCount: 0 as const,
    noRetry: true as const }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

export const checkV138ExecutionContextV9Receipt = (value: unknown,
  route?: V138Route5) => {
  const receipt = exactRecord(value, ["schemaVersion", "mode", "cwd",
    "terminalAgentRegistry", "sourceA5", "sourceB5", "sourceB5Custody",
    "sourceB5CustodyRoot", "authorizationRoot", "sealRoot",
    "selectedRouteClosureRoot", "protectedHistoryRoot",
    "priorAuthorizationBytes", "patternCOwnership", "formationAbsenceBound",
    "runtimeRoute", "resourceSampleMilliseconds", "acceptedCellCount",
    "noRetry", "receiptRoot"], "MATRIX_EXECUTION_CONTEXT_V9_INVALID")
  checkRegistryV5(receipt.terminalAgentRegistry)
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-execution-context-v9" ||
    receipt.mode !== "gsd-pattern-c-inline-main" ||
    receipt.cwd !== "/Users/roryquinlan/runtime/cowards-game" ||
    receipt.patternCOwnership !== "main_orchestrator_only" ||
    receipt.formationAbsenceBound !== true ||
    receipt.runtimeRoute !== "v1.18/v1.19/MATCH_KERNEL" ||
    receipt.resourceSampleMilliseconds !== 200 ||
    receipt.acceptedCellCount !== 0 || receipt.noRetry !== true ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body) || route !== undefined && (
      receipt.sourceA5 !== route.custody.sourceA5 ||
      receipt.sourceB5 !== route.custody.sourceB5 ||
      canonical(receipt.sourceB5Custody) !== canonical(route.custody) ||
      receipt.authorizationRoot !== route.authorization.authorizationRoot ||
      receipt.sealRoot !== route.seal.sealRoot ||
      receipt.selectedRouteClosureRoot !==
        route.seal.selectedRouteClosure.closureRoot ||
      receipt.protectedHistoryRoot !==
        route.seal.protectedHistory.protectedHistoryRoot ||
      canonical(receipt.priorAuthorizationBytes) !== canonical(
        route.seal.protectedHistory.priorAuthorizationBytes))) {
    throw new TypeError("MATRIX_EXECUTION_CONTEXT_V9_INVALID")
  }
  return deepFreeze(receipt)
}

export const buildV138HostHeadroomPreflightV9Receipt = (input: {
  result: V138DarwinHeadroomResult; context: Record<string, unknown> }) => {
  const context = checkV138ExecutionContextV9Receipt(input.context)
  const observation = input.result.ok ? {
    stdoutByteLength: input.result.observation.stdoutByteLength,
    stdoutSha256: input.result.observation.stdoutSha256,
    totalBytes: input.result.observation.totalBytes,
    pageCount: input.result.observation.pageCount,
    pageSizeBytes: input.result.observation.pageSizeBytes,
    percentage: input.result.observation.percentage,
    observedBasisPoints: input.result.observation.observedBasisPoints,
  } : null
  const body = { schemaVersion:
    "v1.38-current-matrix-headroom-preflight-v9" as const,
    sourceA5: context.sourceA5, sourceB5: context.sourceB5,
    executionContextRoot: context.receiptRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    chargedIdentityId: "preflight:v9:0" as const,
    metricId: V138_DARWIN_HEADROOM_METRIC_ID,
    providerId: V138_DARWIN_HEADROOM_PROVIDER_ID,
    parserId: V138_DARWIN_HEADROOM_PARSER_ID,
    requiredHostHeadroomBasisPoints: 2500 as const, observation,
    disposition: input.result.ok ? input.result.observation.disposition :
      "preflight_unavailable" as const,
    acceptedCellCount: 0 as const, noRetry: true as const }
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body) })
}

export const checkV138HostHeadroomPreflightV9Receipt = (value: unknown,
  contextValue: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV9Receipt(contextValue)
  const receipt = exactRecord(value, ["schemaVersion", "sourceA5", "sourceB5",
    "executionContextRoot", "authorizationRoot", "sealRoot",
    "chargedIdentityId", "metricId", "providerId", "parserId",
    "requiredHostHeadroomBasisPoints", "observation", "disposition",
    "acceptedCellCount", "noRetry", "receiptRoot"],
  "MATRIX_PREFLIGHT_V9_INVALID")
  const observed = receipt.observation === null ? null : exactRecord(
    receipt.observation, ["stdoutByteLength", "stdoutSha256", "totalBytes",
      "pageCount", "pageSizeBytes", "percentage", "observedBasisPoints"],
    "MATRIX_PREFLIGHT_V9_INVALID")
  const expectedDisposition = observed === null ? "preflight_unavailable" :
    Number(observed.observedBasisPoints) >= 2500 ? "preflight_admitted" :
      "preflight_refused"
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !==
    "v1.38-current-matrix-headroom-preflight-v9" ||
    receipt.sourceA5 !== context.sourceA5 ||
    receipt.sourceB5 !== context.sourceB5 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.authorizationRoot !== context.authorizationRoot ||
    receipt.sealRoot !== context.sealRoot ||
    receipt.chargedIdentityId !== "preflight:v9:0" ||
    receipt.metricId !== V138_DARWIN_HEADROOM_METRIC_ID ||
    receipt.providerId !== V138_DARWIN_HEADROOM_PROVIDER_ID ||
    receipt.parserId !== V138_DARWIN_HEADROOM_PARSER_ID ||
    receipt.requiredHostHeadroomBasisPoints !== 2500 ||
    receipt.disposition !== expectedDisposition ||
    receipt.acceptedCellCount !== 0 || receipt.noRetry !== true ||
    observed !== null && (!Number.isSafeInteger(observed.stdoutByteLength) ||
      Number(observed.stdoutByteLength) <= 0 ||
      Number(observed.stdoutByteLength) > 4096 ||
      !isV138CanonicalSha256(observed.stdoutSha256) ||
      !Number.isSafeInteger(observed.totalBytes) ||
      Number(observed.totalBytes) <= 0 ||
      !Number.isSafeInteger(observed.pageCount) ||
      Number(observed.pageCount) <= 0 ||
      !Number.isSafeInteger(observed.pageSizeBytes) ||
      Number(observed.pageSizeBytes) <= 0 ||
      !Number.isSafeInteger(Number(observed.pageCount) *
        Number(observed.pageSizeBytes)) ||
      Number(observed.totalBytes) !== Number(observed.pageCount) *
        Number(observed.pageSizeBytes) ||
      !Number.isSafeInteger(observed.percentage) ||
      Number(observed.percentage) < 0 || Number(observed.percentage) > 100 ||
      !Number.isSafeInteger(observed.observedBasisPoints) ||
      Number(observed.observedBasisPoints) !==
        Number(observed.percentage) * 100) ||
    receiptRoot !== v138SuccessorRoot("canonicalJsonProfile",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_PREFLIGHT_V9_INVALID")
  }
  return deepFreeze(receipt)
}

const writeV138Plan26230Marker = (repoRoot: string, stage: "preflight" |
  "calibration" | "reproduction", context: Record<string, unknown>,
  predecessorRoot: unknown, chargedAttemptIds: readonly string[]) => {
  const key = `${stage}Marker` as "preflightMarker" | "calibrationMarker" |
    "reproductionMarker"
  const target = plan26230Path(repoRoot, PLAN_262_30_PATHS[key], key)
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const body = { schemaVersion: "v1.38-plan-262-30-consumption-v1" as const,
    stage, sourceA5: context.sourceA5, sourceB5: context.sourceB5,
    sourceB5CustodyRoot: context.sourceB5CustodyRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    executionContextRoot: context.receiptRoot, predecessorRoot,
    chargedAttemptCount: chargedAttemptIds.length,
    chargedAttemptRoot: v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-30-${stage}-charged-attempts-v1`, chargedAttemptIds),
    noRetry: true as const }
  const marker = deepFreeze({ ...body, markerRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body) })
  writeV138Plan26219Immutable(target, chain, marker)
  return marker
}

export const checkV138Plan26230ConsumptionMarker = (repoRoot: string,
  stage: "preflight" | "calibration" | "reproduction",
  context: Record<string, unknown>, predecessorRoot: unknown,
  chargedAttemptIds: readonly string[]) => {
  const checkedContext = checkV138ExecutionContextV9Receipt(context)
  const key = `${stage}Marker` as "preflightMarker" | "calibrationMarker" |
    "reproductionMarker"
  const value = readPlan26230(repoRoot, key)
  const marker = exactRecord(value, ["schemaVersion", "stage", "sourceA5",
    "sourceB5", "sourceB5CustodyRoot", "authorizationRoot", "sealRoot",
    "executionContextRoot", "predecessorRoot", "chargedAttemptCount",
    "chargedAttemptRoot", "noRetry", "markerRoot"],
  "MATRIX_PLAN_262_30_CONSUMPTION_MARKER_INVALID")
  const { markerRoot, ...body } = marker
  if (marker.schemaVersion !== "v1.38-plan-262-30-consumption-v1" ||
    marker.stage !== stage || marker.sourceA5 !== checkedContext.sourceA5 ||
    marker.sourceB5 !== checkedContext.sourceB5 ||
    marker.sourceB5CustodyRoot !== checkedContext.sourceB5CustodyRoot ||
    marker.authorizationRoot !== checkedContext.authorizationRoot ||
    marker.sealRoot !== checkedContext.sealRoot ||
    marker.executionContextRoot !== checkedContext.receiptRoot ||
    marker.predecessorRoot !== predecessorRoot ||
    marker.chargedAttemptCount !== chargedAttemptIds.length ||
    marker.chargedAttemptRoot !== v138SuccessorRoot("artifactManifest",
      `v1.38-plan-262-30-${stage}-charged-attempts-v1`, chargedAttemptIds) ||
    marker.noRetry !== true || markerRoot !== v138SuccessorRoot(
      "evidenceBundle", String(marker.schemaVersion), body)) {
    throw new TypeError("MATRIX_PLAN_262_30_CONSUMPTION_MARKER_INVALID")
  }
  return deepFreeze(marker)
}

const assertV138Plan26230AuthorityOpen = (repoRoot: string) => {
  if (existsSync(path.resolve(repoRoot, PLAN_262_30_PATHS.terminal))) {
    throw new TypeError("MATRIX_PLAN_262_30_AUTHORITY_EXPIRED")
  }
}

const assertV138Plan26230PublicationRoute = (repoRoot: string,
  sourceA5: string, sourceB5: string, expectedRoute: V138Route5): V138Route5 => {
  assertV138Plan26230AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5,
    sourceB5, authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  if (canonical(currentRoute) !== canonical(expectedRoute)) {
    throw new TypeError("MATRIX_PLAN_262_30_AUTHORITY_CHANGED")
  }
  return currentRoute
}

export const checkV138Plan26230PrerequisiteRoots = (
  expected: Readonly<Record<string, unknown>>,
  current: Readonly<Record<string, unknown>>,
): true => {
  const keys = Object.keys(expected)
  if (keys.length !== Object.keys(current).length || keys.some((key) =>
    !Object.hasOwn(current, key) || expected[key] !== current[key])) {
    throw new TypeError("MATRIX_PLAN_262_30_PREREQUISITE_CHANGED")
  }
  return true
}

export const writeV138ExecutionContextV9Receipt = (repoRoot: string,
  targetPath: string, mode: string, cwd: string,
  terminalAgentRegistry: unknown, authorizationPath: string, sealPath: string,
  sourceA5: string, sourceB5: string) => {
  assertV138Plan26230AuthorityOpen(repoRoot)
  for (const repoPath of V138_PLAN_262_30_FRESH_DESTINATIONS) {
    if (existsSync(path.resolve(repoRoot, repoPath))) {
      throw new TypeError("MATRIX_PLAN_262_30_DESTINATION_NOT_FRESH")
    }
  }
  const target = plan26230Path(repoRoot, targetPath, "context")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  const route = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  plan26230Path(repoRoot, authorizationPath, "authorization")
  plan26230Path(repoRoot, sealPath, "seal")
  const receipt = checkV138ExecutionContextV9Receipt(
    buildV138ExecutionContextV9Receipt({ route, mode, cwd,
      terminalAgentRegistry }), route)
  assertV138Plan26230PublicationRoute(repoRoot, sourceA5, sourceB5, route)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const writeV138HostHeadroomPreflightV9Receipt = async (
  repoRoot: string, targetPath: string, contextPath: string,
  authorizationPath: string, sealPath: string, sourceA5: string,
  sourceB5: string, observe: () => Promise<V138DarwinHeadroomResult> = () =>
    observeDarwinHeadroomOwned(executeOwnedMemoryPressureQ)) => {
  assertV138Plan26230AuthorityOpen(repoRoot)
  const target = plan26230Path(repoRoot, targetPath, "preflight")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26230Path(repoRoot, contextPath, "context")
  plan26230Path(repoRoot, authorizationPath, "authorization")
  plan26230Path(repoRoot, sealPath, "seal")
  const route = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const context = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), route)
  writeV138Plan26230Marker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v9:0"])
  let result: V138DarwinHeadroomResult
  try { result = await observe() } catch {
    result = { ok: false, reason: "resource_measurement_unavailable" }
  }
  assertV138Plan26230AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5,
    sourceB5, authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), currentRoute)
  checkV138Plan26230PrerequisiteRoots({ context: context.receiptRoot },
    { context: currentContext.receiptRoot })
  checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v9:0"])
  const receipt = checkV138HostHeadroomPreflightV9Receipt(
    buildV138HostHeadroomPreflightV9Receipt({ result,
      context: currentContext }), currentContext)
  assertV138Plan26230PublicationRoute(repoRoot, sourceA5, sourceB5,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

export const checkV138Plan26230PreflightV9 = (repoRoot: string,
  sourceA5: string, sourceB5: string) => {
  const route = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const context = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(
    readPlan26230(repoRoot, "preflight"), context)
  const marker = checkV138Plan26230ConsumptionMarker(repoRoot, "preflight",
    context, context.receiptRoot, ["preflight:v9:0"])
  return deepFreeze({ routeOrdinal: 5 as const, contextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot, markerRoot: marker.markerRoot,
    disposition: preflight.disposition })
}

const route5ContextAsV8 = (value: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV9Receipt(value)
  const body = { schemaVersion:
    "v1.38-current-matrix-execution-context-v8" as const,
    mode: context.mode, cwd: context.cwd,
    terminalAgentRegistry: { ...(context.terminalAgentRegistry as object),
      schemaVersion: "v1.38-plan-262-25-terminal-agent-registry-v1" },
    sourceA4: context.sourceA5, sourceB4: context.sourceB5,
    sourceB4Custody: context.sourceB5Custody,
    sourceB4CustodyRoot: context.sourceB5CustodyRoot,
    authorizationRoot: context.authorizationRoot, sealRoot: context.sealRoot,
    selectedRouteClosureRoot: context.selectedRouteClosureRoot,
    protectedHistoryRoot: context.protectedHistoryRoot,
    patternCOwnership: context.patternCOwnership,
    formationAbsenceBound: context.formationAbsenceBound,
    runtimeRoute: context.runtimeRoute,
    resourceSampleMilliseconds: context.resourceSampleMilliseconds,
    acceptedCellCount: context.acceptedCellCount, noRetry: context.noRetry }
  return checkV138ExecutionContextV8Receipt({ ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(body.schemaVersion), body) })
}

const route5PreflightAsV8 = (value: Record<string, unknown>,
  contextV9: Record<string, unknown>) => {
  const preflight = checkV138HostHeadroomPreflightV9Receipt(value, contextV9)
  const contextV8 = route5ContextAsV8(contextV9)
  const body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-headroom-preflight-v8" as const,
    sourceA4: preflight.sourceA5, sourceB4: preflight.sourceB5,
    executionContextRoot: contextV8.receiptRoot,
    authorizationRoot: preflight.authorizationRoot,
    sealRoot: preflight.sealRoot,
    chargedIdentityId: preflight.chargedIdentityId,
    metricId: preflight.metricId, providerId: preflight.providerId,
    parserId: preflight.parserId,
    requiredHostHeadroomBasisPoints:
      preflight.requiredHostHeadroomBasisPoints,
    observation: preflight.observation, disposition: preflight.disposition,
    acceptedCellCount: preflight.acceptedCellCount,
    noRetry: preflight.noRetry }, ":v9:", ":v8:") as
    Record<string, unknown>
  return checkV138HostHeadroomPreflightV8Receipt({ ...body,
    receiptRoot: v138SuccessorRoot("canonicalJsonProfile",
      String(body.schemaVersion), body) }, contextV8)
}

export const buildV138ParallelCalibrationV9Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>;
  context: Record<string, unknown>; preflight: Record<string, unknown>;
  calibration?: Readonly<V138ParallelCalibrationReceipt>;
  callbackFailureAfterConsumption?: true }) => {
  const context = checkV138ExecutionContextV9Receipt(input.context)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(input.preflight,
    context)
  const contextV8 = route5ContextAsV8(context)
  const preflightV8 = route5PreflightAsV8(preflight, context)
  const calibrationV8Body = input.calibration === undefined ? undefined :
    replaceVersionStrings(calibrationWithoutRoot(input.calibration),
      ":v9:", ":v8:") as Omit<V138ParallelCalibrationReceipt,
        "calibrationRoot">
  const calibrationV8 = calibrationV8Body === undefined ? undefined :
    deepFreeze({ ...calibrationV8Body,
      calibrationRoot: sha256(canonical(calibrationV8Body)) })
  const v8 = buildV138ParallelCalibrationV8Receipt({ inventory: input.inventory,
    context: contextV8, preflight: preflightV8,
    calibration: calibrationV8,
    callbackFailureAfterConsumption: input.callbackFailureAfterConsumption })
  const body = replaceVersionStrings({ ...v8,
    schemaVersion: "v1.38-current-matrix-calibration-v9",
    sourceA5: context.sourceA5, sourceB5: context.sourceB5,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot }, ":v8:", ":v9:") as
    Record<string, unknown>
  delete body.sourceA4; delete body.sourceB4; delete body.receiptRoot
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", String(body.schemaVersion), body) })
}

export const checkV138ParallelCalibrationV9Receipt = (inventory:
  Readonly<V138CurrentMatrixInventory>, value: unknown,
  contextValue: Record<string, unknown>, preflightValue: Record<string, unknown>) => {
  const context = checkV138ExecutionContextV9Receipt(contextValue)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(preflightValue,
    context)
  const receipt = exactRecord(value, ["schemaVersion",
    "executionContextRoot", "preflightRoot", "status", "chargedAttemptCount",
    "calibrationShardCount", "observationMode", "childLaunchCount",
    "terminalOutcomeCount", "acceptedCellCount", "completeCleanup",
    "publicStopReason", "supervisionRoot", "attempts", "runtimeRoute",
    "privacyProjection", "noRetry", "sourceA5", "sourceB5", "receiptRoot"],
  "MATRIX_CALIBRATION_V9_INVALID")
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-calibration-v9" ||
    receipt.sourceA5 !== context.sourceA5 || receipt.sourceB5 !== context.sourceB5 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_CALIBRATION_V9_INVALID")
  }
  const contextV8 = route5ContextAsV8(context)
  const preflightV8 = route5PreflightAsV8(preflight, context)
  const v8Body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-calibration-v8",
    sourceA4: contextV8.sourceA4, sourceB4: contextV8.sourceB4,
    executionContextRoot: contextV8.receiptRoot,
    preflightRoot: preflightV8.receiptRoot, status: receipt.status,
    chargedAttemptCount: receipt.chargedAttemptCount,
    calibrationShardCount: receipt.calibrationShardCount,
    observationMode: receipt.observationMode,
    childLaunchCount: receipt.childLaunchCount,
    terminalOutcomeCount: receipt.terminalOutcomeCount,
    acceptedCellCount: receipt.acceptedCellCount,
    completeCleanup: receipt.completeCleanup,
    publicStopReason: receipt.publicStopReason,
    supervisionRoot: receipt.supervisionRoot, attempts: receipt.attempts,
    runtimeRoute: receipt.runtimeRoute,
    privacyProjection: receipt.privacyProjection,
    noRetry: receipt.noRetry }, ":v9:", ":v8:") as
    Record<string, unknown>
  checkV138ParallelCalibrationV8Receipt(inventory, { ...v8Body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(v8Body.schemaVersion), v8Body) }, contextV8, preflightV8)
  return deepFreeze(receipt)
}

export const writeV138ParallelCalibrationV9Receipt = async (repoRoot: string,
  targetPath: string, preflightPath: string, contextPath: string,
  sourceA5: string, sourceB5: string,
  run: typeof calibrateV138ParallelMatrix = calibrateV138ParallelMatrix) => {
  assertV138Plan26230AuthorityOpen(repoRoot)
  const target = plan26230Path(repoRoot, targetPath, "calibration")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26230Path(repoRoot, preflightPath, "preflight")
  plan26230Path(repoRoot, contextPath, "context")
  const route = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const context = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(
    readPlan26230(repoRoot, "preflight"), context)
  checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v9:0"])
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v9")
    .map(({ executionAttemptId }) => executionAttemptId)
  writeV138Plan26230Marker(repoRoot, "calibration", context,
    preflight.receiptRoot, calibrationIds)
  let calibration: Readonly<V138ParallelCalibrationReceipt> | undefined
  let callbackFailureAfterConsumption: true | undefined
  if (preflight.disposition === "preflight_admitted") {
    try {
      const calibrationInput = { inventory,
        runner: createV138SubprocessShardRunner(repoRoot,
          { useLegacyHostMemory: false }),
        sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
          executeOwnedMemoryPressureQ),
        hardwareIdentity: { operatingSystem: `${platform()} ${release()}`,
          architecture: arch(), nodeVersion: process.version,
          cpuIdentity: cpus()[0]?.model ?? "unavailable" },
        repoRoot, executionIdentityVersion: "v9" as const }
      if (run === calibrateV138ParallelMatrix) {
        const operatorEvidence =
          await calibrateV138ParallelMatrixWithOperatorEvidence(calibrationInput)
        calibration = operatorEvidence.receipt
        emitV138OperatorIntegrityEvidence(
          operatorEvidence.integrityFailureProjection)
      } else {
        calibration = await run(calibrationInput)
      }
    } catch { callbackFailureAfterConsumption = true }
  }
  assertV138Plan26230AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5,
    sourceB5, authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV9Receipt(
    readPlan26230(repoRoot, "preflight"), currentContext)
  checkV138Plan26230PrerequisiteRoots({ context: context.receiptRoot,
    preflight: preflight.receiptRoot }, { context: currentContext.receiptRoot,
    preflight: currentPreflight.receiptRoot })
  checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v9:0"])
  checkV138Plan26230ConsumptionMarker(repoRoot, "calibration", currentContext,
    currentPreflight.receiptRoot, calibrationIds)
  const receipt = checkV138ParallelCalibrationV9Receipt(inventory,
    buildV138ParallelCalibrationV9Receipt({ inventory, context: currentContext,
      preflight: currentPreflight, calibration,
      callbackFailureAfterConsumption }), currentContext, currentPreflight)
  assertV138Plan26230PublicationRoute(repoRoot, sourceA5, sourceB5,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

const route5CalibrationAsV8 = (inventory: Readonly<V138CurrentMatrixInventory>,
  value: Record<string, unknown>, context: Record<string, unknown>,
  preflight: Record<string, unknown>) => {
  const checked = checkV138ParallelCalibrationV9Receipt(inventory, value,
    context, preflight)
  const contextV8 = route5ContextAsV8(context)
  const preflightV8 = route5PreflightAsV8(preflight, context)
  const body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-calibration-v8",
    sourceA4: contextV8.sourceA4, sourceB4: contextV8.sourceB4,
    executionContextRoot: contextV8.receiptRoot,
    preflightRoot: preflightV8.receiptRoot, status: checked.status,
    chargedAttemptCount: checked.chargedAttemptCount,
    calibrationShardCount: checked.calibrationShardCount,
    observationMode: checked.observationMode,
    childLaunchCount: checked.childLaunchCount,
    terminalOutcomeCount: checked.terminalOutcomeCount,
    acceptedCellCount: checked.acceptedCellCount,
    completeCleanup: checked.completeCleanup,
    publicStopReason: checked.publicStopReason,
    supervisionRoot: checked.supervisionRoot, attempts: checked.attempts,
    runtimeRoute: checked.runtimeRoute,
    privacyProjection: checked.privacyProjection,
    noRetry: checked.noRetry }, ":v9:", ":v8:") as
    Record<string, unknown>
  return checkV138ParallelCalibrationV8Receipt(inventory, { ...body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(body.schemaVersion), body) }, contextV8, preflightV8)
}

export const buildV138AuthoritativeMatrixV10Receipt = (input: {
  inventory: Readonly<V138CurrentMatrixInventory>;
  context: Record<string, unknown>; preflight: Record<string, unknown>;
  calibration: Record<string, unknown>;
  execution?: V138ParallelMatrixExecutionResult;
  callbackFailureAfterConsumption?: true }) => {
  const context = checkV138ExecutionContextV9Receipt(input.context)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(input.preflight,
    context)
  const calibration = checkV138ParallelCalibrationV9Receipt(input.inventory,
    input.calibration, context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V10_CALIBRATION_NOT_ADMITTED")
  }
  const contextV8 = route5ContextAsV8(context)
  const preflightV8 = route5PreflightAsV8(preflight, context)
  const calibrationV8 = route5CalibrationAsV8(input.inventory, calibration,
    context, preflight)
  const executionV8 = input.execution === undefined ? undefined :
    replaceVersionStrings(input.execution, ":v9:", ":v8:") as
      V138ParallelMatrixExecutionResult
  const v9 = buildV138AuthoritativeMatrixV9Receipt({ inventory: input.inventory,
    context: contextV8, preflight: preflightV8, calibration: calibrationV8,
    execution: executionV8,
    callbackFailureAfterConsumption: input.callbackFailureAfterConsumption })
  const body = replaceVersionStrings({ ...v9,
    schemaVersion: "v1.38-current-matrix-reproduction-v10",
    sourceA5: context.sourceA5, sourceB5: context.sourceB5,
    executionContextRoot: context.receiptRoot,
    preflightRoot: preflight.receiptRoot,
    calibrationRoot: calibration.receiptRoot }, ":v8:", ":v9:") as
    Record<string, unknown>
  delete body.sourceA4; delete body.sourceB4; delete body.receiptRoot
  const attempts = body.attempts
  body.attemptLedgerRoot = v138SuccessorRoot("evidenceBundle",
    "v1.38-current-matrix-reproduction-v10-attempt-ledger-v1",
    { calibrationRoot: calibration.receiptRoot, planRoot: body.planRoot,
      attempts })
  return deepFreeze({ ...body, receiptRoot: v138SuccessorRoot(
    "evidenceBundle", String(body.schemaVersion), body) })
}

export const checkV138AuthoritativeMatrixV10Receipt = (value: unknown,
  evidence: { inventory: Readonly<V138CurrentMatrixInventory>;
    context: Record<string, unknown>; preflight: Record<string, unknown>;
    calibration: Record<string, unknown> }) => {
  const context = checkV138ExecutionContextV9Receipt(evidence.context)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(evidence.preflight,
    context)
  const calibration = checkV138ParallelCalibrationV9Receipt(evidence.inventory,
    evidence.calibration, context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V10_CALIBRATION_NOT_ADMITTED")
  }
  const receipt = exactRecord(value, ["schemaVersion",
    "executionContextRoot", "preflightRoot", "calibrationRoot", "status",
    "chargedAttemptCount", "observationMode", "childLaunchCount",
    "terminalOutcomeCount", "acceptedCellCount", "completeCleanup",
    "publicStopReason", "planRoot", "attempts", "attemptLedgerRoot",
    "runtimeRoute", "privacyProjection", "partialAcceptedEvidenceReusable",
    "noRetry", "sourceA5", "sourceB5", "receiptRoot"],
  "MATRIX_REPRODUCTION_V10_INVALID")
  const { receiptRoot, ...body } = receipt
  if (receipt.schemaVersion !== "v1.38-current-matrix-reproduction-v10" ||
    receipt.sourceA5 !== context.sourceA5 || receipt.sourceB5 !== context.sourceB5 ||
    receipt.executionContextRoot !== context.receiptRoot ||
    receipt.preflightRoot !== preflight.receiptRoot ||
    receipt.calibrationRoot !== calibration.receiptRoot ||
    receipt.attemptLedgerRoot !== v138SuccessorRoot("evidenceBundle",
      "v1.38-current-matrix-reproduction-v10-attempt-ledger-v1",
      { calibrationRoot: calibration.receiptRoot, planRoot: receipt.planRoot,
        attempts: receipt.attempts }) ||
    receiptRoot !== v138SuccessorRoot("evidenceBundle",
      String(receipt.schemaVersion), body)) {
    throw new TypeError("MATRIX_REPRODUCTION_V10_INVALID")
  }
  const contextV8 = route5ContextAsV8(context)
  const preflightV8 = route5PreflightAsV8(preflight, context)
  const calibrationV8 = route5CalibrationAsV8(evidence.inventory, calibration,
    context, preflight)
  const v9Body = replaceVersionStrings({
    schemaVersion: "v1.38-current-matrix-reproduction-v9",
    sourceA4: contextV8.sourceA4, sourceB4: contextV8.sourceB4,
    executionContextRoot: contextV8.receiptRoot,
    preflightRoot: preflightV8.receiptRoot,
    calibrationRoot: calibrationV8.receiptRoot, status: receipt.status,
    chargedAttemptCount: receipt.chargedAttemptCount,
    observationMode: receipt.observationMode,
    childLaunchCount: receipt.childLaunchCount,
    terminalOutcomeCount: receipt.terminalOutcomeCount,
    acceptedCellCount: receipt.acceptedCellCount,
    completeCleanup: receipt.completeCleanup,
    publicStopReason: receipt.publicStopReason, planRoot: receipt.planRoot,
    attempts: receipt.attempts, attemptLedgerRoot: receipt.attemptLedgerRoot,
    runtimeRoute: receipt.runtimeRoute,
    privacyProjection: receipt.privacyProjection,
    partialAcceptedEvidenceReusable:
      receipt.partialAcceptedEvidenceReusable,
    noRetry: receipt.noRetry }, ":v9:", ":v8:") as
    Record<string, unknown>
  v9Body.attemptLedgerRoot = v138SuccessorRoot("evidenceBundle",
    "v1.38-current-matrix-reproduction-v9-attempt-ledger-v1",
    { calibrationRoot: calibrationV8.receiptRoot,
      planRoot: v9Body.planRoot, attempts: v9Body.attempts })
  checkV138AuthoritativeMatrixV9Receipt({ ...v9Body,
    receiptRoot: v138SuccessorRoot("evidenceBundle",
      String(v9Body.schemaVersion), v9Body) }, { inventory: evidence.inventory,
    context: contextV8, preflight: preflightV8, calibration: calibrationV8 })
  return deepFreeze(receipt)
}

export const writeV138AuthoritativeMatrixV10Receipt = async (repoRoot: string,
  targetPath: string, calibrationPath: string, contextPath: string,
  sourceA5: string, sourceB5: string,
  run: typeof executeV138ParallelMatrix = executeV138ParallelMatrix) => {
  assertV138Plan26230AuthorityOpen(repoRoot)
  const target = plan26230Path(repoRoot, targetPath, "reproduction")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  plan26230Path(repoRoot, calibrationPath, "calibration")
  plan26230Path(repoRoot, contextPath, "context")
  const route = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const context = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), route)
  const preflight = checkV138HostHeadroomPreflightV9Receipt(
    readPlan26230(repoRoot, "preflight"), context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibration = checkV138ParallelCalibrationV9Receipt(inventory,
    readPlan26230(repoRoot, "calibration"), context, preflight)
  if (calibration.status !== "admitted" ||
    typeof calibration.supervisionRoot !== "string") {
    throw new TypeError("MATRIX_REPRODUCTION_V10_CALIBRATION_NOT_ADMITTED")
  }
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v9")
    .map(({ executionAttemptId }) => executionAttemptId)
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v9:${id}`))
  checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", context,
    context.receiptRoot, ["preflight:v9:0"])
  checkV138Plan26230ConsumptionMarker(repoRoot, "calibration", context,
    preflight.receiptRoot, calibrationIds)
  writeV138Plan26230Marker(repoRoot, "reproduction", context,
    calibration.receiptRoot, reproductionIds)
  let execution: V138ParallelMatrixExecutionResult | undefined
  let callbackFailureAfterConsumption: true | undefined
  try { execution = await run({ inventory,
    admittedCalibrationRoot: calibration.supervisionRoot as Sha256,
    runner: createV138SubprocessShardRunner(repoRoot,
      { useLegacyHostMemory: false }),
    sharedHeadroomObserver: () => observeDarwinHeadroomOwned(
      executeOwnedMemoryPressureQ), repoRoot, executionIdentityVersion: "v9" })
  } catch { callbackFailureAfterConsumption = true }
  assertV138Plan26230AuthorityOpen(repoRoot)
  const currentRoute = checkV138Plan26229AuthorityRoute({ repoRoot, sourceA5,
    sourceB5, authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") })
  const currentContext = checkV138ExecutionContextV9Receipt(
    readPlan26230(repoRoot, "context"), currentRoute)
  const currentPreflight = checkV138HostHeadroomPreflightV9Receipt(
    readPlan26230(repoRoot, "preflight"), currentContext)
  const currentCalibration = checkV138ParallelCalibrationV9Receipt(inventory,
    readPlan26230(repoRoot, "calibration"), currentContext, currentPreflight)
  checkV138Plan26230PrerequisiteRoots({ context: context.receiptRoot,
    preflight: preflight.receiptRoot, calibration: calibration.receiptRoot },
  { context: currentContext.receiptRoot,
    preflight: currentPreflight.receiptRoot,
    calibration: currentCalibration.receiptRoot })
  checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", currentContext,
    currentContext.receiptRoot, ["preflight:v9:0"])
  checkV138Plan26230ConsumptionMarker(repoRoot, "calibration", currentContext,
    currentPreflight.receiptRoot, calibrationIds)
  checkV138Plan26230ConsumptionMarker(repoRoot, "reproduction", currentContext,
    currentCalibration.receiptRoot, reproductionIds)
  const receipt = checkV138AuthoritativeMatrixV10Receipt(
    buildV138AuthoritativeMatrixV10Receipt({ inventory, context: currentContext,
      preflight: currentPreflight, calibration: currentCalibration, execution,
      callbackFailureAfterConsumption }), { inventory, context: currentContext,
      preflight: currentPreflight, calibration: currentCalibration })
  assertV138Plan26230PublicationRoute(repoRoot, sourceA5, sourceB5,
    currentRoute)
  writeV138Plan26219Immutable(target, chain, receipt)
  return receipt
}

type V138Plan26230Disposition =
  typeof V138_PLAN_262_30_DISPOSITIONS[number]
export type V138Plan26230ObstructionProof = Readonly<{
  stage: "context" | "preflight" | "calibration" | "reproduction"
  path: string; type: "file" | "directory" | "symlink" | "other"
  metadataRoot: Sha256
}>
export type V138Plan26230InterruptionProof = Readonly<{
  stage: "preflight" | "calibration" | "reproduction"
  markerRoot: Sha256; chargedAttemptCount: 1 | 8 | 540
  chargedIdentityId: "preflight:v9:0" | null
  observationMode: "unknown_after_consumption"
  childLaunchCount: null; terminalOutcomeCount: null; completeCleanup: false
}>
export type V138Plan26230PatternCObservation = Readonly<{
  mode: unknown; cwd: unknown; terminalAgentRegistry: unknown
}>
export type V138Plan26230PreObservationProof = Readonly<{
  schemaVersion: "v1.38-plan-262-30-pre-observation-proof-v1"
  disposition: "tool_identity_failed" | "protected_history_failed" |
    "formation_absence_failed" | "pattern_c_ownership_failed"
  sealedRoot: Sha256 | null
  observedRoot: Sha256
  expectedContractRoot: Sha256 | null
  proofRoot: Sha256
}>

const V138_PLAN_262_30_PRE_OBSERVATION = new Set([
  "tool_identity_failed", "protected_history_failed",
  "formation_absence_failed", "pattern_c_ownership_failed",
] as const)

const plan26230ObservedRoot = (schema: string, derive: () => Sha256): Sha256 => {
  try { return derive() } catch (error) {
    return v138SuccessorRoot("artifactManifest", schema, { errorCode:
      error instanceof Error ? error.message : "UNKNOWN_DERIVATION_FAILURE" })
  }
}

export const deriveV138Plan26230PreObservationProof = (input: {
  repoRoot: string; sourceA5: string;
  anchor: ReturnType<typeof inspectV138SuccessorSealCommitV5Anchor>;
  disposition: V138Plan26230PreObservationProof["disposition"];
  patternCObservation?: V138Plan26230PatternCObservation | undefined
}): V138Plan26230PreObservationProof => {
  const seal = input.anchor.seal
  checkV138SuccessorSourceSealV5Except(input.repoRoot, seal,
    input.anchor.authorization,
    input.disposition === "tool_identity_failed" ? "toolIdentity" :
      input.disposition === "protected_history_failed" ? "protectedHistory" :
        input.disposition === "formation_absence_failed" ?
          "formationAbsence" : null)
  let sealedRoot: Sha256 | null = null
  let observedRoot: Sha256
  let expectedContractRoot: Sha256 | null = null
  if (input.disposition === "tool_identity_failed") {
    sealedRoot = v138SuccessorRoot("artifactManifest",
      "v1.38-tool-identity-observation-v1", seal.toolIdentity)
    observedRoot = plan26230ObservedRoot(
      "v1.38-tool-identity-observation-failure-v1",
      deriveV138ToolIdentityRoot)
  } else if (input.disposition === "protected_history_failed") {
    const history = exactRecord(seal.protectedHistory,
      ["schemaVersion", "sourceA2", "sourceB2", "sourceA3", "sourceB3",
        "sourceA4", "sourceB4", "protectedV4Root", "artifacts",
        "priorAuthorizationBytes", "cumulativeChargedPublicAttemptIds",
        "reproductionV9Absent", "reproductionV9ConsumptionMarkerAbsent",
        "terminalDisposition", "acceptedEvidenceCount",
        "protectedHistoryRoot"],
      "MATRIX_PLAN_262_30_PRE_OBSERVATION_PROOF_INVALID")
    if (!isV138CanonicalSha256(history.protectedHistoryRoot)) {
      throw new TypeError("MATRIX_PLAN_262_30_PRE_OBSERVATION_PROOF_INVALID")
    }
    sealedRoot = history.protectedHistoryRoot
    observedRoot = plan26230ObservedRoot(
      "v1.38-protected-history-observation-failure-v1", () =>
        deriveV138ProtectedHistoryV5(input.repoRoot, input.sourceA5)
          .protectedHistoryRoot)
  } else if (input.disposition === "formation_absence_failed") {
    sealedRoot = v138SuccessorRoot("artifactManifest",
      "v1.38-formation-absence-observation-v1", seal.formationAbsence)
    observedRoot = plan26230ObservedRoot(
      "v1.38-formation-absence-observation-failure-v1", () =>
        deriveV138FormationAbsenceRoot(input.repoRoot, input.sourceA5))
  } else {
    if (input.patternCObservation === undefined) {
      throw new TypeError("MATRIX_PLAN_262_30_PATTERN_C_OBSERVATION_REQUIRED")
    }
    const observation = exactRecord(input.patternCObservation,
      ["mode", "cwd", "terminalAgentRegistry"],
      "MATRIX_PLAN_262_30_PATTERN_C_OBSERVATION_INVALID")
    try {
      checkV138PatternCOwnershipV9({ mode: observation.mode,
        cwd: observation.cwd,
        terminalAgentRegistry: observation.terminalAgentRegistry })
      throw new TypeError("MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED")
    } catch (error) {
      if (error instanceof Error && error.message ===
        "MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED") throw error
    }
    observedRoot = v138SuccessorRoot("artifactManifest",
      "v1.38-pattern-c-ownership-observation-v1", observation)
    expectedContractRoot = v138SuccessorRoot("containmentPolicy",
      "v1.38-pattern-c-ownership-contract-v1", {
        mode: "gsd-pattern-c-inline-main",
        cwd: "/Users/roryquinlan/runtime/cowards-game",
        registrySchema:
          "v1.38-plan-262-30-terminal-agent-registry-v1",
        activeExecutorCount: 0 })
  }
  if (sealedRoot !== null && sealedRoot === observedRoot) {
    throw new TypeError("MATRIX_PLAN_262_30_PRE_OBSERVATION_CHECK_SUCCEEDED")
  }
  const body = { schemaVersion:
    "v1.38-plan-262-30-pre-observation-proof-v1" as const,
    disposition: input.disposition, sealedRoot, observedRoot,
    expectedContractRoot }
  return deepFreeze({ ...body, proofRoot: v138SuccessorRoot(
    "evidenceBundle", body.schemaVersion, body) })
}

const checkV138Plan26230Disposition = (value: unknown):
  V138Plan26230Disposition => {
  if (typeof value !== "string" ||
    !V138_PLAN_262_30_DISPOSITIONS.includes(value as never)) {
    throw new TypeError("MATRIX_PLAN_262_30_DISPOSITION_INVALID")
  }
  return value as V138Plan26230Disposition
}

const plan26230Needs = (disposition: V138Plan26230Disposition,
  obstructionStage?: V138Plan26230ObstructionProof["stage"],
  interruptedStage?: V138Plan26230InterruptionProof["stage"]) => {
  if (disposition === "fresh_destination_failed") return {
    context: obstructionStage !== "context",
    preflight: obstructionStage === "calibration" ||
      obstructionStage === "reproduction",
    calibration: obstructionStage === "reproduction", reproduction: false }
  if (disposition === "consumed_stage_interrupted") return {
    context: true, preflight: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    calibration: interruptedStage === "reproduction", reproduction: false }
  const pre = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(disposition)
  return { context: !pre, preflight: !pre,
    calibration: ["calibration_stopped", "reproduction_stopped",
      "reproduction_passed"].includes(disposition),
    reproduction: ["reproduction_stopped", "reproduction_passed"]
      .includes(disposition) }
}

const plan26230MarkerNeeds = (disposition: V138Plan26230Disposition,
  needs: ReturnType<typeof plan26230Needs>,
  interruptedStage?: V138Plan26230InterruptionProof["stage"]) => disposition ===
  "consumed_stage_interrupted" ? { preflight: true,
    calibration: interruptedStage === "calibration" ||
      interruptedStage === "reproduction",
    reproduction: interruptedStage === "reproduction" } : disposition ===
  "fresh_destination_failed" ? { preflight: needs.preflight,
    calibration: needs.calibration, reproduction: false } : {
    preflight: needs.preflight, calibration: needs.calibration,
    reproduction: needs.reproduction }

const plan26230StagePaths = Object.freeze({
  context: [PLAN_262_30_PATHS.context],
  preflight: [PLAN_262_30_PATHS.preflight, PLAN_262_30_PATHS.preflightMarker],
  calibration: [PLAN_262_30_PATHS.calibration,
    PLAN_262_30_PATHS.calibrationMarker],
  reproduction: [PLAN_262_30_PATHS.reproduction,
    PLAN_262_30_PATHS.reproductionMarker],
})
const plan26230StageOrder = ["context", "preflight", "calibration",
  "reproduction"] as const

const inspectV138Plan26230Obstruction = (repoRoot: string, repoPath: string,
  stage: V138Plan26230ObstructionProof["stage"]):
  V138Plan26230ObstructionProof | undefined => {
  try {
    const stat = lstatSync(path.resolve(repoRoot, repoPath))
    const type = stat.isSymbolicLink() ? "symlink" as const : stat.isFile() ?
      "file" as const : stat.isDirectory() ? "directory" as const :
        "other" as const
    return Object.freeze({ stage, path: repoPath, type,
      metadataRoot: v138SuccessorRoot("artifactManifest",
        "v1.38-plan-262-30-obstruction-metadata-v1", { type, mode: stat.mode,
          size: stat.size, modifiedMilliseconds: Math.trunc(stat.mtimeMs) }) })
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return undefined
    throw error
  }
}

export const deriveV138Plan26230Obstruction = (repoRoot: string) => {
  const stages = plan26230StageOrder.map((stage) => ({ stage,
    candidates: plan26230StagePaths[stage].flatMap((repoPath) => {
      const candidate = inspectV138Plan26230Obstruction(repoRoot, repoPath, stage)
      return candidate === undefined ? [] : [candidate]
    }) }))
  const active = stages.filter(({ candidates }) => candidates.length > 0).at(-1)
  if (active === undefined || active.candidates.length !== 1) {
    throw new TypeError("MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
  }
  return active.candidates[0]!
}

export const checkV138Plan26230Obstruction = (repoRoot: string,
  proof: V138Plan26230ObstructionProof): true => {
  const current = inspectV138Plan26230Obstruction(repoRoot, proof.path,
    proof.stage)
  if (current === undefined || canonical(current) !== canonical(proof)) {
    throw new TypeError("MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
  }
  for (const repoPath of plan26230StagePaths[proof.stage]) {
    if (repoPath !== proof.path && inspectV138Plan26230Obstruction(repoRoot,
      repoPath, proof.stage) !== undefined) {
      throw new TypeError("MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
    }
  }
  const stageIndex = plan26230StageOrder.indexOf(proof.stage)
  for (const stage of plan26230StageOrder.slice(stageIndex + 1)) {
    for (const repoPath of plan26230StagePaths[stage]) {
      if (inspectV138Plan26230Obstruction(repoRoot, repoPath, stage) !==
        undefined) throw new TypeError("MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
    }
  }
  return true
}

export const deriveV138Plan26230InterruptionProof = (repoRoot: string):
  V138Plan26230InterruptionProof | undefined => {
  const stages = [
    { stage: "preflight" as const, publicPath: PLAN_262_30_PATHS.preflight,
      markerPath: PLAN_262_30_PATHS.preflightMarker },
    { stage: "calibration" as const, publicPath: PLAN_262_30_PATHS.calibration,
      markerPath: PLAN_262_30_PATHS.calibrationMarker },
    { stage: "reproduction" as const,
      publicPath: PLAN_262_30_PATHS.reproduction,
      markerPath: PLAN_262_30_PATHS.reproductionMarker },
  ]
  const present = (repoPath: string) => {
    try { lstatSync(path.resolve(repoRoot, repoPath)); return true } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return false
      throw error
    }
  }
  const active = stages.filter(({ publicPath, markerPath }) =>
    !present(publicPath) && present(markerPath)).at(-1)
  if (active === undefined) return undefined
  const activeIndex = stages.indexOf(active)
  if (stages.slice(activeIndex + 1).some(({ publicPath, markerPath }) =>
    present(publicPath) || present(markerPath))) return undefined
  let marker: unknown
  try { marker = readPlan26230(repoRoot,
    `${active.stage}Marker` as "preflightMarker" | "calibrationMarker" |
      "reproductionMarker") } catch { return undefined }
  if (marker === null || typeof marker !== "object" || Array.isArray(marker) ||
    !isV138CanonicalSha256((marker as { markerRoot?: unknown }).markerRoot)) {
    return undefined
  }
  return Object.freeze({ stage: active.stage,
    markerRoot: (marker as { markerRoot: Sha256 }).markerRoot,
    chargedAttemptCount: active.stage === "preflight" ? 1 as const :
      active.stage === "calibration" ? 8 as const : 540 as const,
    chargedIdentityId: active.stage === "preflight" ?
      "preflight:v9:0" as const : null,
    observationMode: "unknown_after_consumption" as const,
    childLaunchCount: null, terminalOutcomeCount: null,
    completeCleanup: false as const })
}

const plan26230Evidence = (repoRoot: string, sourceA5: string,
  sourceB5: string, dispositionValue: V138Plan26230Disposition,
  obstructionProof?: V138Plan26230ObstructionProof,
  interruptionProof?: V138Plan26230InterruptionProof,
  patternCObservation?: V138Plan26230PatternCObservation,
  claimedPreObservationProof?: V138Plan26230PreObservationProof) => {
  const disposition = checkV138Plan26230Disposition(dispositionValue)
  const preObservation = ["tool_identity_failed", "protected_history_failed",
    "formation_absence_failed", "pattern_c_ownership_failed"]
    .includes(disposition)
  const anchor = preObservation ? inspectV138SuccessorSealCommitV5Anchor({
    repoRoot, sourceA5, sourceB5 }) : undefined
  const route = anchor === undefined ? checkV138Plan26229AuthorityRoute({
    repoRoot, sourceA5, sourceB5,
    authorizationValue: readPlan26230(repoRoot, "authorization"),
    sealValue: readPlan26230(repoRoot, "seal") }) : {
      custody: { sourceA5: anchor.sourceA5, sourceB5: anchor.sourceB5,
        custodyRoot: anchor.anchorRoot },
      authorization: anchor.authorization,
      seal: anchor.seal,
    }
  const preObservationProof = !preObservation ? undefined :
    deriveV138Plan26230PreObservationProof({ repoRoot, sourceA5, anchor: anchor!,
      disposition: disposition as V138Plan26230PreObservationProof["disposition"],
      patternCObservation })
  if (claimedPreObservationProof !== undefined &&
    canonical(claimedPreObservationProof) !== canonical(preObservationProof)) {
    throw new TypeError("MATRIX_PLAN_262_30_PRE_OBSERVATION_PROOF_INVALID")
  }
  const needs = plan26230Needs(disposition, obstructionProof?.stage,
    interruptionProof?.stage)
  const markerNeeds = plan26230MarkerNeeds(disposition, needs,
    interruptionProof?.stage)
  if (disposition === "fresh_destination_failed") {
    if (obstructionProof === undefined) {
      throw new TypeError("MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
    }
    checkV138Plan26230Obstruction(repoRoot, obstructionProof)
  }
  if (disposition === "consumed_stage_interrupted") {
    const current = deriveV138Plan26230InterruptionProof(repoRoot)
    if (interruptionProof === undefined || current === undefined ||
      canonical(current) !== canonical(interruptionProof)) {
      throw new TypeError("MATRIX_PLAN_262_30_INTERRUPTION_INVALID")
    }
  }
  if (preObservation) {
    for (const key of ["context", "preflight", "calibration", "reproduction",
      "preflightMarker", "calibrationMarker", "reproductionMarker"] as const) {
      if (existsSync(path.resolve(repoRoot, PLAN_262_30_PATHS[key]))) {
        throw new TypeError("MATRIX_PLAN_262_30_PRE_OBSERVATION_EVIDENCE_INVALID")
      }
    }
  }
  for (const [key, required] of [["context", needs.context],
    ["preflight", needs.preflight], ["calibration", needs.calibration],
    ["reproduction", needs.reproduction],
    ["preflightMarker", markerNeeds.preflight],
    ["calibrationMarker", markerNeeds.calibration],
    ["reproductionMarker", markerNeeds.reproduction]] as const) {
    const obstructed = obstructionProof?.path === PLAN_262_30_PATHS[key]
    if (!required && !obstructed &&
      existsSync(path.resolve(repoRoot, PLAN_262_30_PATHS[key]))) {
      throw new TypeError(`MATRIX_PLAN_262_30_${key.toUpperCase()}_MUST_BE_ABSENT`)
    }
  }
  const value = (key: "context" | "preflight" | "calibration" |
    "reproduction") => obstructionProof?.path === PLAN_262_30_PATHS[key] ?
    undefined : readPlan26230(repoRoot, key, needs[key])
  const contextValue = preObservation ? undefined : value("context")
  const context = contextValue === undefined ? undefined :
    checkV138ExecutionContextV9Receipt(contextValue, route)
  const preflightValue = preObservation ? undefined : value("preflight")
  const preflight = preflightValue === undefined || context === undefined ?
    undefined : checkV138HostHeadroomPreflightV9Receipt(preflightValue, context)
  const inventory = enumerateV138CurrentMatrix(repoRoot)
  const calibrationValue = preObservation ? undefined : value("calibration")
  const calibration = calibrationValue === undefined || context === undefined ||
    preflight === undefined ? undefined : checkV138ParallelCalibrationV9Receipt(
      inventory, calibrationValue, context, preflight)
  const reproductionValue = preObservation ? undefined : value("reproduction")
  const reproduction = reproductionValue === undefined || context === undefined ||
    preflight === undefined || calibration === undefined ? undefined :
    checkV138AuthoritativeMatrixV10Receipt(reproductionValue, { inventory,
      context, preflight, calibration })
  const calibrationIds = deriveV138CalibrationAttemptMappings(inventory, "v9")
    .map(({ executionAttemptId }) => executionAttemptId)
  const reproductionIds = planV138MatrixShards(inventory).shards.flatMap(
    ({ attemptIds }) => attemptIds.map((id) => `reproduction:v9:${id}`))
  const preflightMarker = !markerNeeds.preflight || context === undefined ||
    obstructionProof?.path === PLAN_262_30_PATHS.preflightMarker ? undefined :
    checkV138Plan26230ConsumptionMarker(repoRoot, "preflight", context,
      context.receiptRoot, ["preflight:v9:0"])
  const calibrationMarker = !markerNeeds.calibration ||
    context === undefined ||
    obstructionProof?.path === PLAN_262_30_PATHS.calibrationMarker ||
    preflight === undefined ? undefined : checkV138Plan26230ConsumptionMarker(
      repoRoot, "calibration", context, preflight.receiptRoot, calibrationIds)
  const reproductionMarker = !markerNeeds.reproduction ||
    context === undefined ||
    calibration === undefined || obstructionProof?.path ===
      PLAN_262_30_PATHS.reproductionMarker ? undefined :
    checkV138Plan26230ConsumptionMarker(
      repoRoot, "reproduction", context, calibration.receiptRoot,
      reproductionIds)
  return { route, context, preflight, calibration, reproduction,
    obstructionProof, interruptionProof, preObservationProof,
    markerRoots: { preflight: preflightMarker?.markerRoot ?? null,
      calibration: calibrationMarker?.markerRoot ?? null,
      reproduction: reproductionMarker?.markerRoot ?? null } }
}

export const buildV138Plan26230TerminalV1 = (input: {
  disposition: V138Plan26230Disposition; sourceA5: string; sourceB5: string;
  authorizationRoot: unknown; sealRoot: unknown;
  context?: Record<string, unknown>; preflight?: Record<string, unknown>;
  calibration?: Record<string, unknown>; reproduction?: Record<string, unknown>;
  markerRoots: Readonly<{ preflight: unknown; calibration: unknown;
    reproduction: unknown }>
  obstructionProof?: V138Plan26230ObstructionProof
  interruptionProof?: V138Plan26230InterruptionProof
  preObservationProof?: V138Plan26230PreObservationProof }) => {
  const disposition = checkV138Plan26230Disposition(input.disposition)
  const needs = plan26230Needs(disposition, input.obstructionProof?.stage,
    input.interruptionProof?.stage)
  const markerNeeds = plan26230MarkerNeeds(disposition, needs,
    input.interruptionProof?.stage)
  if ((input.context !== undefined) !== needs.context ||
    (input.preflight !== undefined) !== needs.preflight ||
    (input.calibration !== undefined) !== needs.calibration ||
    (input.reproduction !== undefined) !== needs.reproduction ||
    (input.markerRoots.preflight !== null) !== markerNeeds.preflight ||
    (input.markerRoots.calibration !== null) !== markerNeeds.calibration ||
    (input.markerRoots.reproduction !== null) !== markerNeeds.reproduction ||
    (disposition === "fresh_destination_failed") !==
      (input.obstructionProof !== undefined) ||
    (disposition === "consumed_stage_interrupted") !==
      (input.interruptionProof !== undefined) ||
    V138_PLAN_262_30_PRE_OBSERVATION.has(disposition as never) !==
      (input.preObservationProof !== undefined) ||
    input.preObservationProof !== undefined &&
      input.preObservationProof.disposition !== disposition ||
    (input.interruptionProof !== undefined &&
      input.interruptionProof.markerRoot !==
        input.markerRoots[input.interruptionProof.stage])) {
    throw new TypeError("MATRIX_PLAN_262_30_PRESENCE_INVALID")
  }
  if ((disposition === "reproduction_stopped" ||
      disposition === "reproduction_passed") &&
    input.calibration?.status !== "admitted") {
    throw new TypeError("MATRIX_PLAN_262_30_DISPOSITION_JOIN_INVALID")
  }
  const calibrationCharged = input.calibration?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "calibration" ||
      input.interruptionProof?.stage === "reproduction" ? 8 : 0)
  const reproductionCharged = input.reproduction?.chargedAttemptCount ??
    (input.interruptionProof?.stage === "reproduction" ? 540 : 0)
  const body = { schemaVersion: "v1.38-plan-262-30-terminal-v1" as const,
    disposition, sourceA5: input.sourceA5,
    sourceB5: input.sourceB5, authorizationRoot: input.authorizationRoot,
    sealRoot: input.sealRoot,
    artifactRoots: { context: input.context?.receiptRoot ?? null,
      preflight: input.preflight?.receiptRoot ?? null,
      calibration: input.calibration?.receiptRoot ?? null,
      reproduction: input.reproduction?.receiptRoot ?? null },
    consumptionMarkerRoots: input.markerRoots,
    obstructionProof: input.obstructionProof ?? null,
    interruptionProof: input.interruptionProof ?? null,
    preObservationProof: input.preObservationProof ?? null,
    chargedCalibrationAttemptCount: calibrationCharged,
    chargedReproductionAttemptCount: reproductionCharged,
    acceptedCellCount: input.reproduction?.acceptedCellCount ?? 0,
    completeCleanup: disposition === "consumed_stage_interrupted" ?
      false as const : (input.calibration === undefined ||
      input.calibration.completeCleanup === true) &&
      (input.reproduction === undefined ||
        input.reproduction.completeCleanup === true),
    authorityExpired: true as const, noRetry: true as const,
    partialAcceptedEvidenceReusable: false as const }
  return deepFreeze({ ...body, terminalRoot: v138SuccessorRoot(
    "canonicalJsonProfile", body.schemaVersion, body) })
}

export const checkV138Plan26230TerminalV1 = (value: unknown,
  evidence: ReturnType<typeof plan26230Evidence>, disposition:
  V138Plan26230Disposition) => {
  const terminal = exactRecord(value, ["schemaVersion", "disposition",
    "sourceA5", "sourceB5", "authorizationRoot", "sealRoot", "artifactRoots",
    "consumptionMarkerRoots", "obstructionProof", "interruptionProof",
    "preObservationProof",
    "chargedCalibrationAttemptCount",
    "chargedReproductionAttemptCount", "acceptedCellCount", "completeCleanup",
    "authorityExpired", "noRetry", "partialAcceptedEvidenceReusable",
    "terminalRoot"], "MATRIX_PLAN_262_30_TERMINAL_INVALID")
  checkV138Plan26230Disposition(disposition)
  const expected = buildV138Plan26230TerminalV1({ disposition,
    sourceA5: evidence.route.custody.sourceA5,
    sourceB5: evidence.route.custody.sourceB5,
    authorizationRoot: evidence.route.authorization.authorizationRoot,
    sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
    preflight: evidence.preflight, calibration: evidence.calibration,
    reproduction: evidence.reproduction, markerRoots: evidence.markerRoots,
    obstructionProof: evidence.obstructionProof,
    interruptionProof: evidence.interruptionProof,
    preObservationProof: evidence.preObservationProof })
  const obstruction = terminal.obstructionProof === null ? null : exactRecord(
    terminal.obstructionProof, ["stage", "path", "type", "metadataRoot"],
    "MATRIX_PLAN_262_30_OBSTRUCTION_INVALID")
  const interruption = terminal.interruptionProof === null ? null : exactRecord(
    terminal.interruptionProof, ["stage", "markerRoot", "chargedAttemptCount",
      "chargedIdentityId", "observationMode", "childLaunchCount",
      "terminalOutcomeCount", "completeCleanup"],
    "MATRIX_PLAN_262_30_INTERRUPTION_INVALID")
  const preObservation = terminal.preObservationProof === null ? null :
    exactRecord(terminal.preObservationProof, ["schemaVersion", "disposition",
      "sealedRoot", "observedRoot", "expectedContractRoot", "proofRoot"],
    "MATRIX_PLAN_262_30_PRE_OBSERVATION_PROOF_INVALID")
  const preObservationBody = preObservation === null ? undefined : {
    schemaVersion: preObservation.schemaVersion,
    disposition: preObservation.disposition,
    sealedRoot: preObservation.sealedRoot,
    observedRoot: preObservation.observedRoot,
    expectedContractRoot: preObservation.expectedContractRoot }
  const preObservationValid = preObservation !== null &&
    preObservation.schemaVersion ===
      "v1.38-plan-262-30-pre-observation-proof-v1" &&
    preObservation.disposition === disposition &&
    (preObservation.sealedRoot === null ||
      isV138CanonicalSha256(preObservation.sealedRoot)) &&
    isV138CanonicalSha256(preObservation.observedRoot) &&
    (preObservation.expectedContractRoot === null ||
      isV138CanonicalSha256(preObservation.expectedContractRoot)) &&
    preObservation.proofRoot === v138SuccessorRoot("evidenceBundle",
      "v1.38-plan-262-30-pre-observation-proof-v1", preObservationBody)
  const obstructionValid = obstruction !== null &&
    ["context", "preflight", "calibration", "reproduction"].includes(
      String(obstruction.stage)) &&
    (obstruction.stage === "context" ? [PLAN_262_30_PATHS.context] :
      obstruction.stage === "preflight" ? [PLAN_262_30_PATHS.preflight,
        PLAN_262_30_PATHS.preflightMarker] : obstruction.stage === "calibration" ?
        [PLAN_262_30_PATHS.calibration, PLAN_262_30_PATHS.calibrationMarker] :
        [PLAN_262_30_PATHS.reproduction,
          PLAN_262_30_PATHS.reproductionMarker])
      .includes(String(obstruction.path)) &&
    ["file", "directory", "symlink", "other"].includes(
      String(obstruction.type)) && isV138CanonicalSha256(obstruction.metadataRoot)
  const interruptionValid = interruption !== null &&
    ["preflight", "calibration", "reproduction"].includes(
      String(interruption.stage)) &&
    isV138CanonicalSha256(interruption.markerRoot) &&
    interruption.markerRoot === evidence.markerRoots[interruption.stage as
      "preflight" | "calibration" | "reproduction"] &&
    interruption.chargedAttemptCount === (interruption.stage === "preflight" ?
      1 : interruption.stage === "calibration" ? 8 : 540) &&
    interruption.chargedIdentityId === (interruption.stage === "preflight" ?
      "preflight:v9:0" : null) &&
    interruption.observationMode === "unknown_after_consumption" &&
    interruption.childLaunchCount === null &&
    interruption.terminalOutcomeCount === null &&
    interruption.completeCleanup === false
  if (canonical(terminal) !== canonical(expected) ||
    V138_PLAN_262_30_PRE_OBSERVATION.has(disposition as never) !==
      preObservationValid ||
    disposition === "fresh_destination_failed" && (!obstructionValid ||
      obstruction?.stage === "reproduction" &&
        (evidence.preflight?.disposition !== "preflight_admitted" ||
          evidence.calibration?.status !== "admitted")) ||
    disposition === "consumed_stage_interrupted" &&
      (!interruptionValid || evidence.reproduction !== undefined ||
        terminal.completeCleanup !== false) ||
    disposition === "preflight_unavailable" &&
      evidence.preflight?.disposition !== "preflight_unavailable" ||
    disposition === "preflight_refused" &&
      evidence.preflight?.disposition !== "preflight_refused" ||
    disposition === "calibration_stopped" &&
      evidence.calibration?.status !== "stopped_process_failure" ||
    disposition === "reproduction_stopped" &&
      (evidence.calibration?.status !== "admitted" ||
        evidence.reproduction?.status !== "stopped_process_failure") ||
    disposition === "reproduction_passed" && (
      evidence.calibration?.status !== "admitted" ||
      evidence.reproduction?.status !== "passed_exact" ||
      evidence.reproduction?.acceptedCellCount !== 540)) {
    throw new TypeError("MATRIX_PLAN_262_30_TERMINAL_INVALID")
  }
  return deepFreeze(terminal)
}

export const writeV138Plan26230TerminalV1 = (repoRoot: string,
  targetPath: string, disposition: V138Plan26230Disposition,
  sourceA5: string, sourceB5: string,
  patternCObservation?: V138Plan26230PatternCObservation) => {
  checkV138Plan26230Disposition(disposition)
  assertV138Plan26230AuthorityOpen(repoRoot)
  const target = plan26230Path(repoRoot, targetPath, "terminal")
  const chain = validateV138CanonicalParentChain(repoRoot, target)
  let effectiveDisposition = disposition
  let interruptionProof = disposition === "fresh_destination_failed" ||
    disposition === "consumed_stage_interrupted" ?
    deriveV138Plan26230InterruptionProof(repoRoot) : undefined
  let interruptionEvidence: ReturnType<typeof plan26230Evidence> | undefined
  if (interruptionProof !== undefined) {
    try {
      interruptionEvidence = plan26230Evidence(repoRoot, sourceA5, sourceB5,
        "consumed_stage_interrupted", undefined, interruptionProof)
      effectiveDisposition = "consumed_stage_interrupted"
    } catch (error) {
      if (disposition === "consumed_stage_interrupted") throw error
      interruptionProof = undefined
    }
  } else if (disposition === "consumed_stage_interrupted") {
    throw new TypeError("MATRIX_PLAN_262_30_INTERRUPTION_INVALID")
  }
  const obstructionProof = effectiveDisposition === "fresh_destination_failed" ?
    deriveV138Plan26230Obstruction(repoRoot) : undefined
  const evidence = interruptionEvidence ?? plan26230Evidence(repoRoot, sourceA5,
    sourceB5, effectiveDisposition, obstructionProof, interruptionProof,
    patternCObservation)
  const terminal = checkV138Plan26230TerminalV1(
    buildV138Plan26230TerminalV1({ disposition: effectiveDisposition,
      sourceA5, sourceB5,
      authorizationRoot: evidence.route.authorization.authorizationRoot,
      sealRoot: evidence.route.seal.sealRoot, context: evidence.context,
      preflight: evidence.preflight, calibration: evidence.calibration,
      reproduction: evidence.reproduction, markerRoots: evidence.markerRoots,
      obstructionProof: evidence.obstructionProof,
      interruptionProof: evidence.interruptionProof,
      preObservationProof: evidence.preObservationProof }),
    evidence, effectiveDisposition)
  writeV138Plan26219Immutable(target, chain, terminal)
  return terminal
}

export const checkV138Plan26230TerminalBranch = (repoRoot: string,
  sourceA5: string, sourceB5: string,
  patternCObservation?: V138Plan26230PatternCObservation) => {
  const terminal = exactRecord(readPlan26230(repoRoot, "terminal"),
    ["schemaVersion", "disposition", "sourceA5", "sourceB5",
      "authorizationRoot", "sealRoot", "artifactRoots",
      "consumptionMarkerRoots", "obstructionProof", "interruptionProof",
      "preObservationProof",
      "chargedCalibrationAttemptCount",
      "chargedReproductionAttemptCount", "acceptedCellCount",
      "completeCleanup", "authorityExpired", "noRetry",
      "partialAcceptedEvidenceReusable", "terminalRoot"],
    "MATRIX_PLAN_262_30_TERMINAL_INVALID")
  const disposition = checkV138Plan26230Disposition(terminal.disposition)
  if ((disposition === "pattern_c_ownership_failed") !==
    (patternCObservation !== undefined)) {
    throw new TypeError("MATRIX_PLAN_262_30_PATTERN_C_OBSERVATION_INVALID")
  }
  const obstructionProof = terminal.obstructionProof === null ? undefined :
    terminal.obstructionProof as V138Plan26230ObstructionProof
  const interruptionProof = terminal.interruptionProof === null ? undefined :
    terminal.interruptionProof as V138Plan26230InterruptionProof
  const preObservationProof = terminal.preObservationProof === null ? undefined :
    terminal.preObservationProof as V138Plan26230PreObservationProof
  return checkV138Plan26230TerminalV1(terminal,
    plan26230Evidence(repoRoot, sourceA5, sourceB5, disposition,
      obstructionProof, interruptionProof, patternCObservation,
      preObservationProof), disposition)
}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await dispatchV138CurrentMatrixDirectEntry(process.argv[2], {
    runShard: async () => runShardCli(),
    runReceipt: runReceiptCli,
  })
}
