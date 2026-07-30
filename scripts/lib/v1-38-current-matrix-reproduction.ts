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
  unlinkSync,
  writeFileSync,
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
  checkV138Plan26215Authorization,
  checkV138SuccessorSealCommit,
  checkV138SuccessorSourceSeal,
  type V138Plan26215Authorization,
  type V138SourceBCustody,
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
  const unlaunchedShardIds = [...(input.unlaunchedShardIds ?? [])]
  const terminalIds = input.terminals.map(({ shardId }) => shardId)
  const allDispositionIds = [...terminalIds, ...unlaunchedShardIds]
  if (
    new Set(allDispositionIds).size !== expectedPlan.shards.length ||
    allDispositionIds.length !== expectedPlan.shards.length ||
    allDispositionIds.some((shardId) => !shardById.has(shardId))
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
      cumulativeLaunchedAttempts: outcomes.length,
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
    launchRoot: sha256(canonical(canonicalTerminals.map(({ shardId }) => shardId))),
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
    launchedAttemptCount: outcomes.length,
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

interface V138SupervisedAssignmentsResult {
  readonly terminals: readonly Readonly<V138ParallelShardTerminal>[]
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
    orphanProcessIds: [-1],
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
  const launchedIds = new Set(canonicalTerminals.map(({ shardId }) => shardId))
  const unlaunchedShardIds = input.assignments
    .filter(({ shardId }) => !launchedIds.has(shardId))
    .map(({ shardId }) => shardId)
  return deepFreeze({
    terminals: canonicalTerminals,
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
): boolean =>
  ticks !== undefined &&
  ticks.length > 0 &&
  ticks.every((tick, ordinal) => {
    const shardIds = [...tick.shardIds]
    return (
      tick.tickId === `shared-darwin-tick:${ordinal}` &&
      /^sha256:[0-9a-f]{64}$/u.test(tick.observationRoot) &&
      Number.isSafeInteger(tick.observedBasisPoints) &&
      tick.observedBasisPoints >= 0 &&
      tick.observedBasisPoints <= 10_000 &&
      shardIds.length > 0 &&
      new Set(shardIds).size === shardIds.length &&
      canonical(tick.fanout) ===
        canonical(
          shardIds.map((shardId) => ({
            shardId,
            observationRoot: tick.observationRoot,
          })),
        )
    )
  }) &&
  Math.min(...ticks.map(({ observedBasisPoints }) => observedBasisPoints)) ===
    minimumObservedBasisPoints

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
  executionIdentityVersion?: "v1" | "v2" | "v3" | "v4" | "v5" | undefined
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
                : input.executionIdentityVersion === "v5"
                  ? record.calibrationAttemptId.replace(
                      /^calibration:v1:/u,
                      "calibration:v5:",
                    )
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
    acceptedCellsPublished: 0 as const,
    partialAcceptedEvidenceReusable: false as const,
  }
  return deepFreeze({
    ...withoutRoot,
    calibrationRoot: sha256(canonical(withoutRoot)),
  })
}

export type V138ParallelMatrixExecutionResult = Readonly<{
  schemaVersion: "v1.38-parallel-matrix-execution-v1"
  status: "complete_pending_publication" | "stopped_process_failure"
  reason: V138ParallelStopReason | null
  calibrationRoot: Sha256
  planRoot: Sha256
  terminals: readonly Readonly<V138ParallelShardTerminal>[]
  accounting: ReturnType<typeof reduceV138ParallelMatrixAccounting>
  canonicalOutcomes: readonly V138ParallelChargedOutcome[]
  batchWallMilliseconds: number
  sharedObservationTicks?:
    readonly Readonly<V138SharedDarwinObservationTick>[]
}>

export const executeV138ParallelMatrix = async (input: {
  inventory: Readonly<V138CurrentMatrixInventory>
  calibration: Readonly<V138ParallelCalibrationReceipt>
  runner?: V138ParallelShardRunner | undefined
  clock?: V138ParallelClock | undefined
  parentSignal?: AbortSignal | undefined
  sharedHeadroomObserver?: V138SharedDarwinHeadroomObserver | undefined
  repoRoot?: string | undefined
  executionIdentityVersion?: "canonical" | "v3" | "v4" | "v5" | undefined
}): Promise<V138ParallelMatrixExecutionResult> => {
  if (!calibrationReceiptIsValid(input.inventory, input.calibration)) {
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
                : input.executionIdentityVersion === "v5"
                  ? `reproduction:v5:${attemptId}`
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
            : input.executionIdentityVersion === "v5"
              ? outcome.attemptId.replace(/^reproduction:v5:/u, "")
            : outcome.attemptId,
    })),
  }))
  const accounting = reduceV138ParallelMatrixAccounting({
    inventory: input.inventory,
    plan,
    terminals: canonicalTerminalIds,
    unlaunchedShardIds: supervised.unlaunchedShardIds,
  })
  const canonicalOutcomes = supervised.terminals
    .flatMap(({ outcomes }) => outcomes)
    .sort(
      (left, right) =>
        plan.shards
          .flatMap(({ attemptIds }) => attemptIds)
          .indexOf(
            left.attemptId.replace(/^reproduction:v[34]:/u, ""),
          ) -
        plan.shards
          .flatMap(({ attemptIds }) => attemptIds)
          .indexOf(
            right.attemptId.replace(/^reproduction:v[34]:/u, ""),
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
    calibrationRoot: input.calibration.calibrationRoot,
    planRoot: plan.planRoot,
    terminals: supervised.terminals,
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
      stdio: readonly ["ignore", "pipe", "pipe"]
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
    options: Readonly<{ encoding: "utf8"; timeout: 1_000 }>,
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
    const settle = (sample: V138RssSample): void => {
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
        { encoding: "utf8", timeout: 1_000 },
        (error, stdout) => {
          callbackCount += 1
          if (error !== null) {
            settle({ status: "unavailable", code: samplerFailureCode(error) })
            return
          }
          const trimmed = stdout.trim()
          if (!/^[1-9][0-9]*$/u.test(trimmed)) {
            settle({
              status: "unavailable",
              code: "RESOURCE_MEASUREMENT_UNAVAILABLE",
            })
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
          stdio: ["ignore", "pipe", "pipe"] as const,
          windowsHide: true,
        } as const
      const child =
        options.shardProcessFactory?.spawn(
          process.execPath,
          childArguments,
          childOptions,
        ) ??
        spawn(process.execPath, childArguments, childOptions)
      const stdout: Buffer[] = []
      const stderr: Buffer[] = []
      let stdoutBytes = 0
      let stderrBytes = 0
      let maximumRssKilobytes = 0
      let outputOverflow = false
      let spawnError = false
      let gracefulTerminationSent = false
      let forceTerminationSent = false
      let closed = false
      let status: number | null = null
      let closeSignal: NodeJS.Signals | null = null
      let terminalEventCaptured = false
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
          spawnError = true
          terminalEventCaptured = true
          resolve()
        })
        child.on("close", (exitStatus, signal) => {
          closed = true
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
      const sample = async (): Promise<void> => {
        if (closed || child.pid === undefined) return
        const rss = await sampleV138ChildRss(
          child.pid,
          options.rssCommandAdapter ?? defaultV138RssCommandAdapter,
        )
        const legacyHostMemory =
          options.useLegacyHostMemory === false
            ? { totalKilobytes: 1, freeKilobytes: 1 }
            : (options.legacyHostMemorySampler?.() ?? {
                totalKilobytes: Math.floor(totalmem() / 1024),
                freeKilobytes: Math.floor(freemem() / 1024),
              })
        if (rss.status === "unavailable") {
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
      }
      await sample()
      const interval = closed || samplerCode !== undefined
        ? undefined
        : setInterval(() => {
            void sample()
          }, V138_PARALLEL_RESOURCE_POLICY.resourceSampleMilliseconds)
      const timeout = setTimeout(() => {
        void terminate()
      }, V138_PARALLEL_RESOURCE_POLICY.maxShardMilliseconds)
      await closeReceipt
      if (interval !== undefined) clearInterval(interval)
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
      const failureCode = outputOverflow
        ? "RESOURCE_POLICY_SHARD_OUTPUT_INVALID"
        : elapsedMilliseconds >
            V138_PARALLEL_RESOURCE_POLICY.maxShardMilliseconds
          ? "RESOURCE_POLICY_SHARD_TIMEOUT"
          : spawnError
            ? "RESOURCE_POLICY_SHARD_SPAWN_FAILED"
            : samplerCode !== undefined
              ? samplerCode
            : status !== 0 || closeSignal !== null
              ? "RESOURCE_POLICY_SHARD_FAILED"
              : undefined
      let parsed: ShardExecutionResult | undefined
      if (!cancelled && failureCode === undefined) {
        try {
          parsed = parseV138ShardExecutionResult(
            JSON.parse(Buffer.concat(stdout).toString("utf8")),
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
      const effectiveFailureCode =
        failureCode ??
        (cancelled
          ? undefined
          : parsed === undefined
            ? "RESOURCE_POLICY_SHARD_OUTPUT_INVALID"
            : undefined)
      const mappedOutcomes: V138ParallelChargedOutcome[] = shard.attempts.map(
        ({ executionAttemptId }, index) => {
          if (cancelled) {
            return {
              attemptId: executionAttemptId,
              classification: "cancelled",
              code: "CANCELLED_AFTER_HARD_FAILURE",
            }
          }
          if (effectiveFailureCode !== undefined) {
            return {
              attemptId: executionAttemptId,
              classification: "system_failure",
              code: effectiveFailureCode,
              retryable: false,
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
          : effectiveFailureCode !== undefined ||
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
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.terminals.some(
            (terminal) => terminal.shardId === shardId,
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
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.terminals.some(
            (terminal) => terminal.shardId === shardId,
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
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.terminals.some(
            (terminal) => terminal.shardId === shardId,
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
  executionIdentityVersion: "v1" | "v2" | "v3" | "v4" | "v5" = "v1",
): void => {
  const policy = deriveV138ParallelCalibrationPolicy(inventory)
  const projection = projectV138ParallelMatrix(policy, receipt.rawObservation)
  const expectedAttemptIds = policy.inventory.shards
    .flatMap(({ attemptIds }) => attemptIds)
    .map((attemptId) =>
      executionIdentityVersion === "v2"
        ? attemptId.replace(/^calibration:v1:/u, "calibration:v2:")
        : executionIdentityVersion === "v3"
          ? attemptId.replace(/^calibration:v1:/u, "calibration:v3:")
          : executionIdentityVersion === "v4"
            ? attemptId.replace(/^calibration:v1:/u, "calibration:v4:")
          : executionIdentityVersion === "v5"
            ? attemptId.replace(/^calibration:v1:/u, "calibration:v5:")
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
    executionIdentityVersion !== "v5" ||
    sharedDarwinTicksAreValid(
      receipt.sharedObservationTicks,
      receipt.rawObservation.minimumHostHeadroomBasisPoints,
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
  try {
    const decoded = JSON.parse(
      Buffer.from(process.argv[3] ?? "", "base64").toString("utf8"),
    ) as { repoRoot: string; attemptIds: string[] }
    const inventory = enumerateV138CurrentMatrix(decoded.repoRoot)
    const byId = new Map(
      inventory.attempts.map((attempt) => [attempt.attemptId, attempt]),
    )
    const attempts = decoded.attemptIds.map((attemptId) => {
      const attempt = byId.get(attemptId)
      if (attempt === undefined) {
        throw new TypeError("MATRIX_SHARD_ATTEMPT_UNKNOWN")
      }
      return attempt
    })
    const outcomes = executeAttemptsInProcess(inventory, attempts)
    process.stdout.write(
      JSON.stringify({
        outcomes,
        maxRssKilobytes: process.resourceUsage().maxRSS,
      }),
    )
  } catch {
    process.exitCode = 1
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
    Number(observation.pageCount) ===
      Math.floor(Number(observation.totalBytes) / Number(observation.pageSizeBytes)) &&
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
    unlaunchedShardIds: plan.shards
      .filter(
        ({ shardId }) =>
          !input.execution.terminals.some(
            (terminal) => terminal.shardId === shardId,
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
  ) throw new TypeError("MATRIX_REPRODUCTION_V6_EXECUTION_INVALID")
  const canonicalOutcomes = input.execution.canonicalOutcomes.map((outcome) => ({
    ...outcome,
    attemptId: outcome.attemptId.replace(/^reproduction:v5:/u, ""),
  })) as V138CurrentMatrixAttemptOutcome[]
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
          exitCode: processError === null
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
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  const target = plan26216Path(repoRoot, targetPath, "preflight")
  const authorization = checkV138Plan26215Authorization(
    repoRoot,
    plan26216Read(
      plan26216Path(repoRoot, authorizationPath, "authorization"),
      true,
    )!.value,
  )
  if (authorization.sourceA !== sourceBCustody.sourceA) {
    throw new TypeError("MATRIX_PREFLIGHT_V5_SOURCE_CUSTODY_JOIN_INVALID")
  }
  const seal = checkV138SuccessorSourceSeal(
    repoRoot,
    plan26216Read(plan26216Path(repoRoot, sealPath, "seal"), true)!.value,
    authorization,
  )
  const context = checkV138ExecutionContextV5Receipt(
    plan26216Read(
      plan26216Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
  )
  if (
    context.authorizationRoot !== authorization.authorizationRoot ||
    context.sealRoot !== seal.sealRoot ||
    context.sourceB !== sourceBCustody.sourceB ||
    context.sourceBCustodyRoot !== sourceBCustody.custodyRoot
  ) throw new TypeError("MATRIX_PREFLIGHT_V5_CONTEXT_JOIN_INVALID")
  const receipt = buildV138HostHeadroomPreflightV5Receipt({
    result: await observeHeadroom(),
    executionContext: context,
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
): Promise<Readonly<Record<string, unknown>>> => {
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  const target = plan26216Path(repoRoot, targetPath, "calibration")
  const context = checkV138ExecutionContextV5Receipt(
    plan26216Read(
      plan26216Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
    sourceBCustody,
  )
  const preflight = checkV138HostHeadroomPreflightV5Receipt(
    plan26216Read(
      plan26216Path(repoRoot, preflightPath, "preflight"),
      true,
    )!.value,
  )
  if (
    preflight.executionContextRoot !== context.receiptRoot ||
    preflight.sourceB !== context.sourceB ||
    preflight.sourceBCustodyRoot !== context.sourceBCustodyRoot
  ) {
    throw new TypeError("MATRIX_CALIBRATION_V5_CONTEXT_JOIN_INVALID")
  }
  let receipt: Readonly<Record<string, unknown>>
  if (preflight.disposition !== "preflight_admitted") {
    receipt = buildV138ParallelCalibrationV5PreflightTerminal(preflight)
  } else {
    const calibration = await calibrateV138ParallelMatrix({
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
        outcome: outcome === undefined
          ? "unfilled" as const
          : outcome.classification === "success"
            ? "accepted" as const
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
): Promise<Readonly<V138AuthoritativeMatrixV6Receipt>> => {
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  const target = plan26216Path(repoRoot, targetPath, "reproduction")
  const context = checkV138ExecutionContextV5Receipt(
    plan26216Read(
      plan26216Path(repoRoot, executionContextPath, "context"),
      true,
    )!.value,
    sourceBCustody,
  )
  const calibration = checkV138ParallelCalibrationV5Receipt(
    plan26216Read(
      plan26216Path(repoRoot, calibrationPath, "calibration"),
      true,
    )!.value,
    repoRoot,
  )
  if (
    calibration.status !== "admitted" ||
    calibration.executionContextRoot !== context.receiptRoot ||
    calibration.sourceB !== context.sourceB ||
    calibration.sourceBCustodyRoot !== context.sourceBCustodyRoot ||
    calibration.supervisedCalibration === null
  ) throw new TypeError("MATRIX_REPRODUCTION_V6_CALIBRATION_NOT_ADMITTED")
  const execution = await executeV138ParallelMatrix({
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
    executionContext: context,
    calibration,
    execution,
  })
  const receipt = checkV138AuthoritativeMatrixV6Receipt(built, {
    repoRoot,
    executionContext: context,
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
): Readonly<{
  value: Record<string, unknown>
  bytes: Buffer
  root: Sha256
}> | undefined => {
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
): V138Plan26216TerminalDisposition => {
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  const resolved = Object.fromEntries(
    (Object.keys(PLAN_262_16_PATHS) as Array<keyof typeof PLAN_262_16_PATHS>)
      .map((key) => [key, plan26216Path(repoRoot, supplied[key], key)]),
  ) as Record<keyof typeof PLAN_262_16_PATHS, string>
  // Discriminator first: no evidence path is inspected before this read.
  const terminal = plan26216Read(resolved.terminal, true)!
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
    terminalValue.sourceB !== sourceBCustody.sourceB ||
    terminalValue.sourceBCustodyRoot !== sourceBCustody.custodyRoot ||
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
  const authorizationArtifact = plan26216Read(resolved.authorization, true)!
  const authorization = checkV138Plan26215Authorization(
    repoRoot,
    authorizationArtifact.value,
  )
  const sealArtifact = plan26216Read(resolved.seal, true)!
  const seal = checkV138SuccessorSourceSeal(
    repoRoot,
    sealArtifact.value,
    authorization,
  )
  const needs = plan26216Needs(typed)
  const contextArtifact = plan26216Read(resolved.context, needs.context)
  const preflightArtifact = plan26216Read(resolved.preflight, needs.preflight)
  const calibrationArtifact = plan26216Read(resolved.calibration, needs.calibration)
  const reproductionArtifact = plan26216Read(resolved.reproduction, needs.reproduction)
  const context = contextArtifact === undefined
    ? undefined
    : checkV138ExecutionContextV5Receipt(contextArtifact.value, sourceBCustody)
  const preflight = preflightArtifact === undefined
    ? undefined
    : checkV138HostHeadroomPreflightV5Receipt(preflightArtifact.value)
  const calibration = calibrationArtifact === undefined
    ? undefined
    : checkV138ParallelCalibrationV5Receipt(calibrationArtifact.value, repoRoot)
  const reproduction = reproductionArtifact === undefined
    ? undefined
    : checkV138AuthoritativeMatrixV6Receipt(reproductionArtifact.value, {
        repoRoot,
        executionContext: context!,
        calibration: calibration!,
      })
  if (
    context !== undefined &&
    (context.authorizationRoot !== authorization.authorizationRoot ||
      context.sealRoot !== seal.sealRoot ||
      context.sourceB !== sourceBCustody.sourceB ||
      context.sourceBCustodyRoot !== sourceBCustody.custodyRoot)
  ) throw new TypeError("MATRIX_PLAN_262_16_CONTEXT_JOIN_INVALID")
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
    ([
      "tool_identity_failed",
      "protected_history_failed",
      "formation_absence_failed",
      "pattern_c_ownership_failed",
    ] as string[]).includes(typed)
  if (!dispositionValid) {
    throw new TypeError("MATRIX_PLAN_262_16_DISPOSITION_JOIN_INVALID")
  }
  const artifactRoots = exactRecord(
    terminalValue.artifactRoots,
    [
      "authorization", "seal", "context", "preflight", "calibration",
      "reproduction",
    ],
    "MATRIX_PLAN_262_16_TERMINAL_ROOTS_INVALID",
  )
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
  const sourceBCustody = checkV138SuccessorSealCommit({ repoRoot, sourceA, sourceB })
  if (![
    "tool_identity_failed",
    "protected_history_failed",
    "formation_absence_failed",
    "pattern_c_ownership_failed",
    "preflight_unavailable",
    "preflight_refused",
    "calibration_stopped",
    "reproduction_stopped",
    "reproduction_passed",
  ].includes(disposition)) {
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

const runReceiptCli = async (): Promise<void> => {
  if (process.argv[1] !== fileURLToPath(import.meta.url)) return
  const command = process.argv[2]
  const repoRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  )
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
    process.stdout.write(`${canonical({
      schemaVersion: receipt.schemaVersion,
      status: receipt.status ?? null,
      disposition: receipt.disposition ?? null,
      receiptRoot: receipt.receiptRoot,
      acceptedCellCount: receipt.acceptedCellCount,
    })}\n`)
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

await runReceiptCli()
runShardCli()
