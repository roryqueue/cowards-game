import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
  type V138RetryV3ProductionOptions,
  runV138V3ProductionLive,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
import {
  checkV138Plan262104CommittedInactivePair,
  type V138Plan262104Artifacts,
} from "./run-v1-38-bounded-retry-envelope-v3-review-v7.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
  type V138RetryV3ExecutionClosure,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_LIVE_V8_PATHS = Object.freeze({
  sourceAdapter: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts",
  sourceTests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.test.ts",
  plan93Stop: `${PHASE_DIR}/262-93-PRESTART-INTEGRITY-STOP.md`,
  plan108Payload:
    ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v8.json",
  plan108Review: `${PHASE_DIR}/262-108-REVIEW.md`,
  plan108Carrier:
    ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v1.json",
  supplement:
    ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
})

export const V138_LIVE_V8_MODES = Object.freeze([
  "--check-reviewed-live-ready",
  "--run-reviewed-bounded-live-envelope",
  "--check-post-run-custody",
] as const)

export const V138_LIVE_V8_EXECUTED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  V138_LIVE_V8_PATHS.sourceAdapter,
] as const)

const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT =
  "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT =
  "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT =
  "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const PLAN_93_STOP_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const PLAN_93_STOP_BLOB = "e9de1116995f32b3ec564c6bd0fb0d1a00de4e7d"
const PLAN_93_STOP_SHA256 =
  "sha256:ef19330651725dfcaf5a1de35435a27d4f270f54428b5f57e063ee58f041f1a3"

const ZERO_COUNTERS = Object.freeze({
  routeStartsConsumed: 0 as const,
  preflightObservationsConsumed: 0 as const,
  calibrationIdentitiesCharged: 0 as const,
  reproductionIdentitiesCharged: 0 as const,
  acceptedCells: 0 as const,
})

export type V138LiveV8Plan93Stop = Readonly<{
  attempt: 1
  status: "pre_start_integrity_stop"
  stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID"
  liveEffectBoundaryCrossed: false
  envelopeConsumed: false
  routeStarts: 0
  preflightObservations: 0
  calibrationCharged: 0
  reproductionCharged: 0
  freshAccepted: 0
  terminalPresent: false
  complete: false
}>

export type V138LiveV8ReviewPayloadBody = Readonly<{
  schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-payload-v8"
  reviewedSourceCommit: string
  reviewedSourceTree: string
  reviewedSourceParent: string
  checkoutPaths: readonly string[]
  executionClosureRoot: Sha
  findingCount: 0
  reviewStatus: "zero_findings"
  actualModesPassed: 4
  syntheticProducerCalls: 1
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  authorizesExecution: false
  downstreamAuthority: "denied"
}>

export type V138LiveV8ReviewPayload = V138LiveV8ReviewPayloadBody &
  Readonly<{ payloadRoot: Sha }>

export type V138LiveV8ReviewBundle = Readonly<{
  payload: V138LiveV8ReviewPayload
  review: Readonly<{
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v1"
    payloadRoot: Sha
    findingCount: 0
    verdict: "zero_findings"
    reviewRoot: Sha
  }>
  carrier: Readonly<{
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-carrier-v1"
    payloadRoot: Sha
    reviewRoot: Sha
    payloadMode: "100644"
    reviewMode: "100644"
    carrierMode: "100644"
    payloadSha256: Sha
    reviewSha256: Sha
    carrierRoot: Sha
    findingCount: 0
    authorizesExecution: false
    downstreamAuthority: "denied"
  }>
}>

export type V138LiveV8SupplementBody = Readonly<{
  schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v1"
  pairCommit: typeof PAIR_COMMIT
  sealRoot: typeof SEAL_ROOT
  envelopeRoot: typeof ENVELOPE_ROOT
  envelopeStatus: "sealed_inactive"
  counters: typeof ZERO_COUNTERS
  assuranceClass: "single_operator_local_seal_v1"
  protectedHistoryRoot: typeof PROTECTED_HISTORY_ROOT
  plan93: V138LiveV8Plan93Stop
  plan107: Readonly<{
    sourceCommit: string
    sourceTree: string
    sourceParent: string
    checkoutPaths: readonly string[]
    executionClosureRoot: Sha
  }>
  plan108: Readonly<{
    payloadRoot: Sha
    reviewRoot: Sha
    carrierRoot: Sha
    findingCount: 0
    verdict: "zero_findings"
  }>
  supersessionScope: "executable_source_custody_only"
  createsEnvelope: false
  createsCapacity: false
  resetsCounters: false
  authorizesExecution: false
  candidateSearchAuthorized: false
  formationAuthorized: false
  holdoutAuthorized: false
  publicAuthorized: false
  productAuthorized: false
  productionAuthorized: false
  countedPlayAuthorized: false
  gameplayChangeAuthorized: false
  archiveAuthorized: false
  tagAuthorized: false
  phase263Authorized: false
  downstreamAuthority: "denied"
}>

export type V138LiveV8Supplement = V138LiveV8SupplementBody &
  Readonly<{ supplementRoot: Sha }>

export const computeV138LiveV8ReviewPayloadRoot = (
  body: V138LiveV8ReviewPayloadBody,
): Sha => sha256(`v138-plan-262-108-live-controller-review-payload-v8\0${canonical(body)}`)

export const computeV138LiveV8ReviewCarrierRoot = (
  body: Omit<V138LiveV8ReviewBundle["carrier"], "carrierRoot">,
): Sha => sha256(`v138-plan-262-108-live-controller-review-carrier-v1\0${canonical(body)}`)

export const computeV138LiveV8SupplementRoot = (
  body: V138LiveV8SupplementBody,
): Sha => sha256(`v138-successor-executable-custody-supplement-v1\0${canonical(body)}`)

const assertExactKeys = (
  value: unknown,
  expected: readonly string[],
  code: string,
): void => {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    canonical(Object.keys(value).sort()) !== canonical([...expected].sort())
  )
    fail(code)
}

const readRegularNoFollow = (repoRoot: string, repoPath: string): Buffer => {
  if (path.isAbsolute(repoPath) || repoPath.split("/").some((part) => !part || part === "." || part === ".."))
    fail("V138_LIVE_V8_PATH_INVALID")
  const absolute = path.join(repoRoot, ...repoPath.split("/"))
  const status = lstatSync(absolute)
  if (!status.isFile() || status.isSymbolicLink() || (status.mode & 0o111) !== 0)
    fail(`V138_LIVE_V8_REGULAR_FILE_INVALID:${repoPath}`)
  return readFileSync(absolute)
}

const readJsonRegular = (repoRoot: string, repoPath: string): Record<string, unknown> => {
  let value: unknown
  try {
    value = JSON.parse(readRegularNoFollow(repoRoot, repoPath).toString("utf8"))
  } catch {
    fail(`V138_LIVE_V8_JSON_INVALID:${repoPath}`)
  }
  if (value === null || Array.isArray(value) || typeof value !== "object")
    fail(`V138_LIVE_V8_JSON_INVALID:${repoPath}`)
  return value as Record<string, unknown>
}

const assertCommittedWorkingFile = (
  repoRoot: string,
  repoPath: string,
  expectedMode = "100644",
): Readonly<{ bytes: Buffer; sha256: Sha }> => {
  const tree = runV138RetryV3IsolatedGit(repoRoot, ["ls-tree", "HEAD", "--", repoPath])
  const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(tree)
  if (match === null || match[1] !== expectedMode || match[3] !== repoPath)
    fail(`V138_LIVE_V8_COMMITTED_MODE_INVALID:${repoPath}`)
  const bytes = readRegularNoFollow(repoRoot, repoPath)
  const workingBlob = runV138RetryV3IsolatedGit(repoRoot, ["hash-object", "--no-filters", "--", repoPath])
  if (workingBlob !== match[2]) fail(`V138_LIVE_V8_COMMITTED_BYTES_INVALID:${repoPath}`)
  return Object.freeze({ bytes, sha256: sha256(bytes) })
}

const authenticatePlan93StopFromDisk = (repoRoot: string): V138LiveV8Plan93Stop => {
  const entry = runV138RetryV3IsolatedGit(repoRoot, [
    "ls-tree",
    PLAN_93_STOP_COMMIT,
    "--",
    V138_LIVE_V8_PATHS.plan93Stop,
  ])
  if (entry !== `100644 blob ${PLAN_93_STOP_BLOB}\t${V138_LIVE_V8_PATHS.plan93Stop}`)
    fail("V138_LIVE_V8_PLAN_93_COMMITTED_ENTRY_INVALID")
  const committed = runV138RetryV3IsolatedGitBytes(repoRoot, [
    "cat-file",
    "blob",
    `${PLAN_93_STOP_COMMIT}:${V138_LIVE_V8_PATHS.plan93Stop}`,
  ])
  const current = assertCommittedWorkingFile(repoRoot, V138_LIVE_V8_PATHS.plan93Stop)
  if (sha256(committed) !== PLAN_93_STOP_SHA256 || current.sha256 !== PLAN_93_STOP_SHA256)
    fail("V138_LIVE_V8_PLAN_93_BYTES_INVALID")
  if (
    runV138RetryV3IsolatedGit(repoRoot, [
      "log",
      "--format=%H",
      `${PLAN_93_STOP_COMMIT}..HEAD`,
      "--",
      V138_LIVE_V8_PATHS.plan93Stop,
    ]) !== ""
  )
    fail("V138_LIVE_V8_PLAN_93_REWRITTEN")
  const text = committed.toString("utf8")
  for (const required of [
    "status: pre_start_integrity_stop",
    "Live command invocations: `1`",
    "Live effect boundary crossed: `false`",
    "Route starts: `0/3`",
    "Fresh accepted: `0/540`",
    "Terminal-v3: absent",
    "Plan 93 is not complete",
  ])
    if (!text.includes(required)) fail("V138_LIVE_V8_PLAN_93_SEMANTICS_INVALID")
  return Object.freeze({
    attempt: 1,
    status: "pre_start_integrity_stop",
    stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
    liveEffectBoundaryCrossed: false,
    envelopeConsumed: false,
    routeStarts: 0,
    preflightObservations: 0,
    calibrationCharged: 0,
    reproductionCharged: 0,
    freshAccepted: 0,
    terminalPresent: false,
    complete: false,
  })
}

const authenticateReviewBundleFromDisk = (repoRoot: string): V138LiveV8ReviewBundle => {
  const payloadFile = assertCommittedWorkingFile(repoRoot, V138_LIVE_V8_PATHS.plan108Payload)
  const reviewFile = assertCommittedWorkingFile(repoRoot, V138_LIVE_V8_PATHS.plan108Review)
  assertCommittedWorkingFile(repoRoot, V138_LIVE_V8_PATHS.plan108Carrier)
  const payload = readJsonRegular(repoRoot, V138_LIVE_V8_PATHS.plan108Payload) as V138LiveV8ReviewPayload
  const carrier = readJsonRegular(repoRoot, V138_LIVE_V8_PATHS.plan108Carrier) as V138LiveV8ReviewBundle["carrier"]
  const { payloadRoot, ...payloadBody } = payload
  if (
    computeV138LiveV8ReviewPayloadRoot(payloadBody as V138LiveV8ReviewPayloadBody) !== payloadRoot ||
    carrier.payloadRoot !== payloadRoot ||
    carrier.payloadSha256 !== payloadFile.sha256 ||
    carrier.reviewSha256 !== reviewFile.sha256 ||
    carrier.payloadMode !== "100644" ||
    carrier.reviewMode !== "100644" ||
    carrier.carrierMode !== "100644"
  )
    fail("V138_LIVE_V8_REVIEW_RAW_CUSTODY_INVALID")
  const reviewText = reviewFile.bytes.toString("utf8")
  if (!reviewText.includes(carrier.reviewRoot) || !reviewText.includes("zero_findings"))
    fail("V138_LIVE_V8_REVIEW_DOCUMENT_INVALID")
  return Object.freeze({
    payload,
    review: Object.freeze({
      schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v1",
      payloadRoot,
      findingCount: carrier.findingCount,
      verdict: "zero_findings",
      reviewRoot: carrier.reviewRoot,
    }),
    carrier,
  })
}

const authenticateSupplementFromDisk = (repoRoot: string): V138LiveV8Supplement => {
  assertCommittedWorkingFile(repoRoot, V138_LIVE_V8_PATHS.supplement)
  return readJsonRegular(repoRoot, V138_LIVE_V8_PATHS.supplement) as V138LiveV8Supplement
}

const PROTECTED_SUCCESSOR_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts",
  "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts",
  ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
  `${PHASE_DIR}/262-101-REVIEW.md`,
  "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
  "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.ts",
  "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts",
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json",
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json",
  `${PHASE_DIR}/262-103-REVIEW.md`,
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts",
  "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.ts",
  "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.test.ts",
  ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json",
  `${PHASE_DIR}/262-105-REVIEW.md`,
] as const)

const assertProtectedHistoryUnchangedFromDisk = (repoRoot: string): void => {
  const later = runV138RetryV3IsolatedGit(repoRoot, [
    "log",
    "--format=%H",
    `${PAIR_COMMIT}..HEAD`,
    "--",
    ...PROTECTED_SUCCESSOR_PATHS,
  ])
  if (later !== "") fail("V138_LIVE_V8_PROTECTED_SUCCESSOR_HISTORY_REWRITTEN")
}

const forbiddenLiveDestinations = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.journal,
  `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
  V138_BOUNDED_RETRY_V3_PATHS.privateDir,
  V138_BOUNDED_RETRY_V3_PATHS.terminal,
  V138_BOUNDED_RETRY_V3_PATHS.reproduction,
  V138_BOUNDED_RETRY_V3_PATHS.receiptManifest,
  V138_BOUNDED_RETRY_V3_PATHS.disposition,
  V138_BOUNDED_RETRY_V3_PATHS.correction,
  V138_BOUNDED_RETRY_V3_PATHS.activation,
  V138_BOUNDED_RETRY_V3_PATHS.readiness,
  V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
] as const)

const assertDestinationsAbsentFromDisk = (repoRoot: string): void => {
  for (const repoPath of forbiddenLiveDestinations) {
    const absolute = path.join(repoRoot, ...repoPath.split("/"))
    try {
      lstatSync(absolute)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue
      throw error
    }
    fail(`V138_LIVE_V8_FORBIDDEN_DESTINATION_PRESENT:${repoPath}`)
  }
}

export interface V138LiveV8Dependencies {
  checkPair: (repoRoot: string) => V138Plan262104Artifacts & Readonly<{ pairCommit: string }>
  authenticatePlan93Stop: (repoRoot: string) => V138LiveV8Plan93Stop
  authenticateReviewBundle: (repoRoot: string) => V138LiveV8ReviewBundle
  authenticateSupplement: (repoRoot: string) => V138LiveV8Supplement
  authenticateExecutionClosure: typeof authenticateV138RetryV3ExecutionClosure
  assertProtectedHistoryUnchanged: (repoRoot: string) => void
  assertDestinationsAbsent: (repoRoot: string) => void
  runProducer: (repoRoot: string, options: V138RetryV3ProductionOptions) => Promise<void>
}

const defaultDependencies = (): V138LiveV8Dependencies => ({
  checkPair: checkV138Plan262104CommittedInactivePair,
  authenticatePlan93Stop: authenticatePlan93StopFromDisk,
  authenticateReviewBundle: authenticateReviewBundleFromDisk,
  authenticateSupplement: authenticateSupplementFromDisk,
  authenticateExecutionClosure: authenticateV138RetryV3ExecutionClosure,
  assertProtectedHistoryUnchanged: assertProtectedHistoryUnchangedFromDisk,
  assertDestinationsAbsent: assertDestinationsAbsentFromDisk,
  runProducer: runV138V3ProductionLive,
})

const mergeDependencies = (
  injected?: Partial<V138LiveV8Dependencies>,
): V138LiveV8Dependencies => ({ ...defaultDependencies(), ...injected })

const assertPlan93 = (value: V138LiveV8Plan93Stop): void => {
  if (
    canonical(value) !==
    canonical({
      attempt: 1,
      status: "pre_start_integrity_stop",
      stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
      liveEffectBoundaryCrossed: false,
      envelopeConsumed: false,
      routeStarts: 0,
      preflightObservations: 0,
      calibrationCharged: 0,
      reproductionCharged: 0,
      freshAccepted: 0,
      terminalPresent: false,
      complete: false,
    })
  )
    fail("V138_LIVE_V8_PLAN_93_STOP_INVALID")
}

const assertPair = (
  value: V138Plan262104Artifacts & Readonly<{ pairCommit: string }>,
): void => {
  const pair = value as unknown as Record<string, any>
  if (
    pair.pairCommit !== PAIR_COMMIT ||
    pair.seal?.sealRoot !== SEAL_ROOT ||
    pair.envelope?.sealRoot !== SEAL_ROOT ||
    pair.envelope?.envelopeRoot !== ENVELOPE_ROOT ||
    pair.seal?.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    pair.envelope?.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    pair.seal?.assuranceClass !== "single_operator_local_seal_v1" ||
    pair.envelope?.policy?.assuranceClass !== "single_operator_local_seal_v1" ||
    pair.envelope?.status !== "sealed_inactive" ||
    canonical(pair.envelope?.counters) !== canonical(ZERO_COUNTERS) ||
    pair.envelope?.policy?.maximumRouteStarts !== 3 ||
    pair.envelope?.policy?.maximumPreflightObservations !== 12 ||
    pair.envelope?.policy?.envelopeLifetimeMilliseconds !== 14_400_000 ||
    pair.envelope?.policy?.refusalSpacingMilliseconds !== 300_000 ||
    pair.envelope?.policy?.calibrationFailureBackoffMilliseconds !== 900_000 ||
    pair.envelope?.policy?.calibrationAttemptsPerRoute !== 8 ||
    pair.envelope?.policy?.calibrationShardCount !== 4 ||
    pair.envelope?.policy?.samplingMilliseconds !== 200 ||
    pair.envelope?.policy?.minimumEffectiveAvailableBasisPoints !== 2_500 ||
    pair.envelope?.policy?.maximumReproductionRuns !== 1 ||
    pair.envelope?.policy?.reproductionCellCount !== 540 ||
    pair.seal?.productionAuthorized !== false ||
    pair.seal?.downstreamAuthority !== "denied" ||
    pair.envelope?.policy?.productionAuthorized !== false ||
    pair.envelope?.policy?.publicAuthorized !== false ||
    pair.envelope?.policy?.productAuthorized !== false ||
    pair.envelope?.policy?.gameplayChangeAuthorized !== false ||
    pair.envelope?.policy?.phase263PlanningAuthorized !== false
  )
    fail("V138_LIVE_V8_PAIR_INVALID")
}

const assertReviewBundle = (bundle: V138LiveV8ReviewBundle): void => {
  assertExactKeys(bundle, ["payload", "review", "carrier"], "V138_LIVE_V8_REVIEW_KEYS_INVALID")
  assertExactKeys(bundle.payload, [
    "schemaVersion", "reviewedSourceCommit", "reviewedSourceTree", "reviewedSourceParent",
    "checkoutPaths", "executionClosureRoot", "findingCount", "reviewStatus",
    "actualModesPassed", "syntheticProducerCalls", "liveInvoked", "freshCharged",
    "freshAccepted", "authorizesExecution", "downstreamAuthority", "payloadRoot",
  ], "V138_LIVE_V8_REVIEW_PAYLOAD_KEYS_INVALID")
  assertExactKeys(bundle.review, [
    "schemaVersion", "payloadRoot", "findingCount", "verdict", "reviewRoot",
  ], "V138_LIVE_V8_REVIEW_DOCUMENT_KEYS_INVALID")
  assertExactKeys(bundle.carrier, [
    "schemaVersion", "payloadRoot", "reviewRoot", "payloadMode", "reviewMode",
    "carrierMode", "payloadSha256", "reviewSha256", "carrierRoot", "findingCount",
    "authorizesExecution", "downstreamAuthority",
  ], "V138_LIVE_V8_REVIEW_CARRIER_KEYS_INVALID")
  const { payloadRoot, ...body } = bundle.payload
  const { carrierRoot, ...carrierBody } = bundle.carrier
  if (
    computeV138LiveV8ReviewPayloadRoot(body) !== payloadRoot ||
    bundle.payload.schemaVersion !==
      "v1.38-plan-262-108-live-controller-custody-review-payload-v8" ||
    bundle.payload.findingCount !== 0 ||
    bundle.payload.reviewStatus !== "zero_findings" ||
    bundle.payload.actualModesPassed !== 4 ||
    bundle.payload.syntheticProducerCalls !== 1 ||
    bundle.payload.liveInvoked !== false ||
    bundle.payload.freshCharged !== 0 ||
    bundle.payload.freshAccepted !== 0 ||
    bundle.payload.authorizesExecution !== false ||
    bundle.payload.downstreamAuthority !== "denied" ||
    canonical(bundle.payload.checkoutPaths) !== canonical(V138_LIVE_V8_EXECUTED_SOURCE_PATHS) ||
    bundle.review.schemaVersion !==
      "v1.38-plan-262-108-live-controller-custody-review-v1" ||
    bundle.review.payloadRoot !== payloadRoot ||
    bundle.review.findingCount !== 0 ||
    bundle.review.verdict !== "zero_findings" ||
    bundle.carrier.schemaVersion !==
      "v1.38-plan-262-108-live-controller-custody-review-carrier-v1" ||
    bundle.carrier.payloadRoot !== payloadRoot ||
    bundle.carrier.reviewRoot !== bundle.review.reviewRoot ||
    bundle.carrier.payloadMode !== "100644" ||
    bundle.carrier.reviewMode !== "100644" ||
    bundle.carrier.carrierMode !== "100644" ||
    computeV138LiveV8ReviewCarrierRoot(carrierBody) !== carrierRoot ||
    bundle.carrier.findingCount !== 0 ||
    bundle.carrier.authorizesExecution !== false ||
    bundle.carrier.downstreamAuthority !== "denied"
  )
    fail("V138_LIVE_V8_REVIEW_BUNDLE_INVALID")
}

const assertSupplement = (
  value: V138LiveV8Supplement,
  stop: V138LiveV8Plan93Stop,
  review: V138LiveV8ReviewBundle,
): void => {
  assertExactKeys(value, [
    "schemaVersion", "pairCommit", "sealRoot", "envelopeRoot", "envelopeStatus",
    "counters", "assuranceClass", "protectedHistoryRoot", "plan93", "plan107",
    "plan108", "supersessionScope", "createsEnvelope", "createsCapacity",
    "resetsCounters", "authorizesExecution", "candidateSearchAuthorized",
    "formationAuthorized", "holdoutAuthorized", "publicAuthorized", "productAuthorized",
    "productionAuthorized", "countedPlayAuthorized", "gameplayChangeAuthorized",
    "archiveAuthorized", "tagAuthorized", "phase263Authorized", "downstreamAuthority",
    "supplementRoot",
  ], "V138_LIVE_V8_SUPPLEMENT_KEYS_INVALID")
  assertExactKeys(value.counters, [
    "routeStartsConsumed", "preflightObservationsConsumed", "calibrationIdentitiesCharged",
    "reproductionIdentitiesCharged", "acceptedCells",
  ], "V138_LIVE_V8_SUPPLEMENT_COUNTER_KEYS_INVALID")
  assertExactKeys(value.plan93, [
    "attempt", "status", "stopCode", "liveEffectBoundaryCrossed", "envelopeConsumed",
    "routeStarts", "preflightObservations", "calibrationCharged", "reproductionCharged",
    "freshAccepted", "terminalPresent", "complete",
  ], "V138_LIVE_V8_SUPPLEMENT_STOP_KEYS_INVALID")
  assertExactKeys(value.plan107, [
    "sourceCommit", "sourceTree", "sourceParent", "checkoutPaths", "executionClosureRoot",
  ], "V138_LIVE_V8_SUPPLEMENT_SOURCE_KEYS_INVALID")
  assertExactKeys(value.plan108, [
    "payloadRoot", "reviewRoot", "carrierRoot", "findingCount", "verdict",
  ], "V138_LIVE_V8_SUPPLEMENT_REVIEW_KEYS_INVALID")
  const { supplementRoot, ...body } = value
  if (
    computeV138LiveV8SupplementRoot(body) !== supplementRoot ||
    value.pairCommit !== PAIR_COMMIT ||
    value.sealRoot !== SEAL_ROOT ||
    value.envelopeRoot !== ENVELOPE_ROOT ||
    value.envelopeStatus !== "sealed_inactive" ||
    canonical(value.counters) !== canonical(ZERO_COUNTERS) ||
    value.assuranceClass !== "single_operator_local_seal_v1" ||
    value.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    canonical(value.plan93) !== canonical(stop) ||
    value.plan108.payloadRoot !== review.payload.payloadRoot ||
    value.plan108.reviewRoot !== review.review.reviewRoot ||
    value.plan108.carrierRoot !== review.carrier.carrierRoot ||
    value.plan108.findingCount !== 0 ||
    value.plan108.verdict !== "zero_findings" ||
    value.plan107.sourceCommit !== review.payload.reviewedSourceCommit ||
    value.plan107.sourceTree !== review.payload.reviewedSourceTree ||
    value.plan107.sourceParent !== review.payload.reviewedSourceParent ||
    value.plan107.executionClosureRoot !== review.payload.executionClosureRoot ||
    canonical(value.plan107.checkoutPaths) !== canonical(V138_LIVE_V8_EXECUTED_SOURCE_PATHS) ||
    value.supersessionScope !== "executable_source_custody_only" ||
    value.createsEnvelope !== false ||
    value.createsCapacity !== false ||
    value.resetsCounters !== false ||
    value.authorizesExecution !== false ||
    value.candidateSearchAuthorized !== false ||
    value.formationAuthorized !== false ||
    value.holdoutAuthorized !== false ||
    value.publicAuthorized !== false ||
    value.productAuthorized !== false ||
    value.productionAuthorized !== false ||
    value.countedPlayAuthorized !== false ||
    value.gameplayChangeAuthorized !== false ||
    value.archiveAuthorized !== false ||
    value.tagAuthorized !== false ||
    value.phase263Authorized !== false ||
    value.downstreamAuthority !== "denied"
  )
    fail("V138_LIVE_V8_SUPPLEMENT_INVALID")
}

export type V138LiveV8Ready = Readonly<{
  pairCommit: typeof PAIR_COMMIT
  sealRoot: typeof SEAL_ROOT
  envelopeRoot: typeof ENVELOPE_ROOT
  supplementRoot: Sha
  sourceCommit: string
  executionClosureRoot: Sha
  pair: V138Plan262104Artifacts & Readonly<{ pairCommit: string }>
  freshCharged: 0
  freshAccepted: 0
  liveInvoked: false
  downstreamAuthority: "denied"
}>

const authenticateReady = (
  repoRoot: string,
  injected: Partial<V138LiveV8Dependencies> | undefined,
  requireDestinationsAbsent: boolean,
): V138LiveV8Ready => {
  const deps = mergeDependencies(injected)
  const stop = deps.authenticatePlan93Stop(repoRoot)
  assertPlan93(stop)
  const pair = deps.checkPair(repoRoot)
  assertPair(pair)
  const review = deps.authenticateReviewBundle(repoRoot)
  assertReviewBundle(review)
  const supplement = deps.authenticateSupplement(repoRoot)
  assertSupplement(supplement, stop, review)
  deps.assertProtectedHistoryUnchanged(repoRoot)
  if (requireDestinationsAbsent) deps.assertDestinationsAbsent(repoRoot)
  const closure = deps.authenticateExecutionClosure(repoRoot, {
    sourceCommit: supplement.plan107.sourceCommit,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: supplement.plan107.executionClosureRoot,
  })
  if (
    closure.sourceCommit !== supplement.plan107.sourceCommit ||
    closure.sourceTree !== supplement.plan107.sourceTree ||
    closure.sourceParent !== supplement.plan107.sourceParent ||
    closure.executionClosureRoot !== supplement.plan107.executionClosureRoot
  )
    fail("V138_LIVE_V8_EXECUTION_CLOSURE_INVALID")
  return Object.freeze({
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    supplementRoot: supplement.supplementRoot,
    sourceCommit: closure.sourceCommit,
    executionClosureRoot: closure.executionClosureRoot,
    pair,
    freshCharged: 0,
    freshAccepted: 0,
    liveInvoked: false,
    downstreamAuthority: "denied",
  })
}

export const authenticateV138ReviewedLiveV8Ready = (
  repoRoot: string,
  injected?: Partial<V138LiveV8Dependencies>,
): V138LiveV8Ready => authenticateReady(repoRoot, injected, true)

export const runV138ReviewedBoundedLiveEnvelope = async (
  repoRoot: string,
  injected?: Partial<V138LiveV8Dependencies>,
): Promise<void> => {
  const deps = mergeDependencies(injected)
  const ready = authenticateReady(repoRoot, deps, true)
  await deps.runProducer(repoRoot, {
    validateInputs: false,
    checkPair: () => ({ seal: ready.pair.seal, envelope: ready.pair.envelope }),
  })
  deps.assertProtectedHistoryUnchanged(repoRoot)
  const after = deps.authenticateExecutionClosure(repoRoot, {
    sourceCommit: ready.sourceCommit,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: ready.executionClosureRoot,
  })
  if (after.executionClosureRoot !== ready.executionClosureRoot)
    fail("V138_LIVE_V8_POST_RUN_CUSTODY_CHANGED")
}

export interface V138LiveV8CliDependencies {
  repoRoot: string
  dependencies: Partial<V138LiveV8Dependencies>
  writeOutput: (value: string) => void
}

export const executeV138LiveV8Cli = async (
  argv: readonly string[],
  injected?: Partial<V138LiveV8CliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (argv.length !== 1 || !V138_LIVE_V8_MODES.includes(argv[0] as never))
    fail("V138_LIVE_V8_ARGUMENTS_INVALID")
  const command = argv[0]
  if (command === "--run-reviewed-bounded-live-envelope") {
    await runV138ReviewedBoundedLiveEnvelope(repoRoot, injected?.dependencies)
    writeOutput(`${JSON.stringify({ status: "reviewed_bounded_live_complete" })}\n`)
    return
  }
  const ready = authenticateReady(
    repoRoot,
    injected?.dependencies,
    command === "--check-reviewed-live-ready",
  )
  writeOutput(
    `${JSON.stringify({
      status:
        command === "--check-reviewed-live-ready"
          ? "reviewed_live_ready"
          : "post_run_custody_checked",
      pairCommit: ready.pairCommit,
      sealRoot: ready.sealRoot,
      envelopeRoot: ready.envelopeRoot,
      supplementRoot: ready.supplementRoot,
      executionClosureRoot: ready.executionClosureRoot,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })}\n`,
  )
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isEntrypoint)
  executeV138LiveV8Cli(process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
