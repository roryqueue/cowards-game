import { createHash } from "node:crypto"
import { lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
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

export const V138_LIVE_V8_PROTECTED_BRANCHES = Object.freeze([
  { plan: 90, lineageCommit: "32f53bb743db799810dff820b8b7eb309b6a6629", paths: [
    `${PHASE_DIR}/262-90-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3.ts", "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  ] },
  { plan: 91, lineageCommit: "d64f048c12440978f449a5e2e655c33f55adc4ce", paths: [
    `${PHASE_DIR}/262-91-SUMMARY.md`, `${PHASE_DIR}/262-91-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json",
    "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts",
    "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.test.ts",
  ] },
  { plan: 96, lineageCommit: "82ed28eee2377fd31680a20fdf0a6c6ebba9c1a8", paths: [
    `${PHASE_DIR}/262-96-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
    "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  ] },
  { plan: 97, lineageCommit: "24d759a9c95499d56d483ff23c1e9bfbe0356f30", paths: [
    `${PHASE_DIR}/262-97-SUMMARY.md`, `${PHASE_DIR}/262-97-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json",
    "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts",
    "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.test.ts",
  ] },
  { plan: 98, lineageCommit: "c3ed45c7a4ec54f456ae21d04095ab898df870db", paths: [
    `${PHASE_DIR}/262-98-SUMMARY.md`,
  ] },
  { plan: 99, lineageCommit: "497ba238e789d6f32252bde291ced9438b05a190", paths: [
    `${PHASE_DIR}/262-99-SUMMARY.md`, `${PHASE_DIR}/262-99-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.ts",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.test.ts",
  ] },
  { plan: 100, lineageCommit: "1e071bdb087e7360ee27e6558f6e717180d4d4a9", paths: [
    `${PHASE_DIR}/262-100-SUMMARY.md`,
  ] },
  { plan: 101, lineageCommit: "72e62d480a38f7c853a9010fd2918a0396118e07", paths: [
    `${PHASE_DIR}/262-101-SUMMARY.md`, `${PHASE_DIR}/262-101-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts",
  ] },
  { plan: 102, lineageCommit: "66fa1358daf8005fab4b1b90b2831ccb60d1ca3e", paths: [
    `${PHASE_DIR}/262-102-SUMMARY.md`, "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
  ] },
  { plan: 103, lineageCommit: "658e3149a25a2af8f0511f5845936f23fe574fc5", paths: [
    `${PHASE_DIR}/262-103-SUMMARY.md`, `${PHASE_DIR}/262-103-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json",
    ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json",
    "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.ts",
    "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts",
  ] },
  { plan: 104, lineageCommit: "126a72e52d6c83e15cacf31a5ef46753c0fcce37", paths: [
    `${PHASE_DIR}/262-104-SUMMARY.md`, "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts",
  ] },
  { plan: 105, lineageCommit: "250c152d3b2c8d7c1e7808985b61626bc3290883", paths: [
    `${PHASE_DIR}/262-105-SUMMARY.md`, `${PHASE_DIR}/262-105-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json",
    "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.ts",
    "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.test.ts",
  ] },
] as const)

export const authenticateV138LiveV8ProtectedHistory = (
  repoRoot: string,
): Readonly<{
  branchCount: 12
  protectedHistoryRoot: typeof PROTECTED_HISTORY_ROOT
  expandedManifestRoot: Sha
}> => {
  const records: string[] = []
  for (const branch of V138_LIVE_V8_PROTECTED_BRANCHES) {
    records.push(...authenticateProtectedBranch(repoRoot, branch))
  }
  return Object.freeze({
    branchCount: 12,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    expandedManifestRoot: sha256(`v138-live-v8-expanded-protected-history-v1\0${records.sort().join("\n")}`),
  })
}

const authenticateProtectedBranch = (
  repoRoot: string,
  branch: (typeof V138_LIVE_V8_PROTECTED_BRANCHES)[number],
): readonly string[] => {
  try {
    runV138RetryV3IsolatedGit(repoRoot, [
      "merge-base", "--is-ancestor", branch.lineageCommit, PAIR_COMMIT,
    ])
  } catch {
    fail(`V138_LIVE_V8_PROTECTED_LINEAGE_INVALID:${branch.plan}`)
  }
  const records: string[] = []
  for (const repoPath of branch.paths) {
    const entry = runV138RetryV3IsolatedGit(repoRoot, ["ls-tree", PAIR_COMMIT, "--", repoPath])
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
    if (match === null || match[3] !== repoPath)
      fail(`V138_LIVE_V8_PROTECTED_COMMITTED_ENTRY_INVALID:${branch.plan}:${repoPath}`)
    const [, mode, blob] = match
    records.push(`${branch.plan}\0${branch.lineageCommit}\0${mode}\0${repoPath}\0${blob}`)
    const current = path.join(repoRoot, ...repoPath.split("/"))
    const status = lstatSync(current)
    if (!status.isFile() || status.isSymbolicLink() || (mode === "100755") !== ((status.mode & 0o111) !== 0))
      fail(`V138_LIVE_V8_PROTECTED_CURRENT_MODE_INVALID:${repoPath}`)
    const expectedBytes = runV138RetryV3IsolatedGitBytes(repoRoot, ["cat-file", "blob", `${PAIR_COMMIT}:${repoPath}`])
    if (!readFileSync(current).equals(expectedBytes))
      fail(`V138_LIVE_V8_PROTECTED_CURRENT_BYTES_INVALID:${repoPath}`)
    const later = runV138RetryV3IsolatedGit(repoRoot, ["log", "--format=%H", `${PAIR_COMMIT}..HEAD`, "--", repoPath])
    if (later !== "") fail(`V138_LIVE_V8_PROTECTED_SUCCESSOR_HISTORY_REWRITTEN:${repoPath}`)
  }
  return records
}

export const authenticateV138LiveV8ProtectedBranchForReview = (
  repoRoot: string,
  plan: (typeof V138_LIVE_V8_PROTECTED_BRANCHES)[number]["plan"],
): true => {
  const branch = V138_LIVE_V8_PROTECTED_BRANCHES.find((candidate) => candidate.plan === plan)
  if (branch === undefined) fail("V138_LIVE_V8_PROTECTED_PLAN_INVALID")
  authenticateProtectedBranch(repoRoot, branch)
  return true
}

const assertProtectedHistoryUnchangedFromDisk = (repoRoot: string): void => {
  authenticateV138LiveV8ProtectedHistory(repoRoot)
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

type V138LiveV8ClosureIdentity = Readonly<
  Pick<
    V138RetryV3ExecutionClosure,
    "sourceCommit" | "sourceTree" | "sourceParent" | "executionClosureRoot"
  >
>

export type V138LiveV8SyntheticCustody = Readonly<{
  stop: V138LiveV8Plan93Stop
  pair: V138Plan262104Artifacts & Readonly<{ pairCommit: string }>
  review: V138LiveV8ReviewBundle
  supplement: V138LiveV8Supplement
  closure: V138LiveV8ClosureIdentity
}>

const checkCustodyValues = (
  input: V138LiveV8SyntheticCustody,
): V138LiveV8Ready => {
  assertPlan93(input.stop)
  assertPair(input.pair)
  assertReviewBundle(input.review)
  assertSupplement(input.supplement, input.stop, input.review)
  if (
    input.closure.sourceCommit !== input.supplement.plan107.sourceCommit ||
    input.closure.sourceTree !== input.supplement.plan107.sourceTree ||
    input.closure.sourceParent !== input.supplement.plan107.sourceParent ||
    input.closure.executionClosureRoot !== input.supplement.plan107.executionClosureRoot
  )
    fail("V138_LIVE_V8_EXECUTION_CLOSURE_INVALID")
  return Object.freeze({
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    supplementRoot: input.supplement.supplementRoot,
    sourceCommit: input.closure.sourceCommit,
    executionClosureRoot: input.closure.executionClosureRoot,
    pair: input.pair,
    freshCharged: 0,
    freshAccepted: 0,
    liveInvoked: false,
    downstreamAuthority: "denied",
  })
}

export const checkV138LiveV8SyntheticCustodyForReview = (
  input: V138LiveV8SyntheticCustody,
): V138LiveV8Ready & Readonly<{ producerWouldInvoke: true }> =>
  Object.freeze({ ...checkCustodyValues(input), producerWouldInvoke: true })

const authenticateReady = (
  repoRoot: string,
  requireDestinationsAbsent: boolean,
): V138LiveV8Ready => {
  const stop = authenticatePlan93StopFromDisk(repoRoot)
  const pair = checkV138Plan262104CommittedInactivePair(repoRoot)
  const review = authenticateReviewBundleFromDisk(repoRoot)
  const supplement = authenticateSupplementFromDisk(repoRoot)
  assertProtectedHistoryUnchangedFromDisk(repoRoot)
  if (requireDestinationsAbsent) assertDestinationsAbsentFromDisk(repoRoot)
  const closure = authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: supplement.plan107.sourceCommit,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: supplement.plan107.executionClosureRoot,
  })
  return checkCustodyValues({
    stop,
    pair,
    review,
    supplement,
    closure,
  })
}

export const authenticateV138ReviewedLiveV8Ready = (
  repoRoot: string,
): V138LiveV8Ready => authenticateReady(repoRoot, true)

export const runV138ReviewedBoundedLiveEnvelope = async (
  repoRoot: string,
): Promise<void> => {
  const ready = authenticateReady(repoRoot, true)
  await runV138V3ProductionLive(repoRoot, {
    validateInputs: false,
    checkPair: () => ({ seal: ready.pair.seal, envelope: ready.pair.envelope }),
  })
  assertProtectedHistoryUnchangedFromDisk(repoRoot)
  const after = authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: ready.sourceCommit,
    checkoutPaths: V138_LIVE_V8_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: ready.executionClosureRoot,
  })
  if (after.executionClosureRoot !== ready.executionClosureRoot)
    fail("V138_LIVE_V8_POST_RUN_CUSTODY_CHANGED")
}

export interface V138LiveV8CliDependencies {
  repoRoot: string
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
    await runV138ReviewedBoundedLiveEnvelope(repoRoot)
    writeOutput(`${JSON.stringify({ status: "reviewed_bounded_live_complete" })}\n`)
    return
  }
  const ready = authenticateReady(
    repoRoot,
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
