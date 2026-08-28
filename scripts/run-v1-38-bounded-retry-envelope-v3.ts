import { Buffer } from "node:buffer"
import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs"
import { arch, cpus, platform, release } from "node:os"
import path from "node:path"
import { setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_POLICY,
  V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  appendV138RetryV3JournalRecord,
  checkV138InactiveRetryV3Envelope,
  checkV138ProtectedHistoryV3,
  createV138InactiveRetryV3Envelope,
  deriveV138RetryV3State,
  encodeV138RetryV3CanonicalJson,
  requireV138RetryV3DestinationAbsent,
  type V138DerivedRetryV3State,
  type V138InactiveRetryV3Envelope,
  type V138RetryV3CalibrationIdentity,
  type V138RetryV3JournalEvent,
  type V138RetryV3JournalRecord,
  type V138RetryV3ReproductionIdentity,
  type V138RetryV3RouteIdentity,
  type V138RetrySha256,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  calibrateV138ParallelMatrix,
  createV138SubprocessShardRunner,
  enumerateV138CurrentMatrix,
  executeV138ParallelMatrix,
} from "./lib/v1-38-current-matrix-reproduction.js"
import {
  MEMORY_PRESSURE_Q_REQUEST,
  observeDarwinHeadroomOwned,
  type MemoryPressureQCommandResult,
} from "./lib/v1-38-darwin-headroom.js"
import {
  V138_SECURE_BATCH_PROTOCOL_V6,
  V138_SECURE_READER_EXECUTION_ASSURANCE_V6,
  readV138WorkspaceBatch,
  sha256V138Secure,
} from "./lib/v1-38-secure-workspace-path-v6.js"
import { V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2 } from "./lib/v1-38-private-native-bootstrap-v2.js"
import {
  acquireV138RetryV3NativeOwnerLease,
  applyV138RetryV3NativeLifecycle,
  authenticateV138RetryV3ExecutionClosure,
  publishV138RetryV3NativePair,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
  type V138RetryV3ExecutionClosure,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): V138RetrySha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = encodeV138RetryV3CanonicalJson

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_BOUNDED_RETRY_V3_PATHS = Object.freeze({
  sourceSummary: `${PHASE_DIR}/262-98-SUMMARY.md`,
  sourceController: "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  sourceModel: "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  sourceNativeCustody:
    "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  sourceOwnerLock:
    "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  sourceTests: "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  sourceReview:
    ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
  sourceReviewReport: `${PHASE_DIR}/262-101-REVIEW.md`,
  protectedHistoryCorrection:
    ".planning/artifacts/v1.38-phase-262-review-fix-correction-v10.json",
  historicalReceiptManifest:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json",
  historicalEnvelope:
    ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
  historicalJournal:
    ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
  historicalTerminal:
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
  historicalSeal: ".planning/artifacts/v1.38-successor-source-seal-v12.json",
  historicalDisposition:
    ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
  historicalLifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  localSeal:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  receiptManifest:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json",
  disposition:
    ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  correction:
    ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  activation:
    ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  readiness:
    ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  lifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
})

export const V138_BOUNDED_RETRY_V3_PRODUCTION_MODES = Object.freeze([
  "--check-source-only",
  "--derive-seal-envelope-no-publish",
  "--publish-sealed-inactive-envelope",
  "--check-sealed-inactive-envelope",
  "--check-live-transition",
  "--check-terminal-envelope",
  "--run-bounded-live-envelope",
] as const)

export const V138_BOUNDED_RETRY_V3_CUSTODY = Object.freeze({
  schemaVersion: "v1.38-bounded-retry-v3-custody-v1" as const,
  retainedRootProtocol: V138_SECURE_BATCH_PROTOCOL_V6,
  retainedRootAssurance: V138_SECURE_READER_EXECUTION_ASSURANCE_V6,
  privateNativeAssurance: V138_PRIVATE_NATIVE_EXECUTION_ASSURANCE_V2,
  correctionV10Root:
    V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.correctionV10Root,
  coherentRequiredLeafAndAbsenceBatch: true as const,
  exactBoundedLeafReads: true as const,
  postReadLeafGenerationCheck: true as const,
  postReadParentGenerationCheck: true as const,
  retainedRootInodeLock: true as const,
  gitHooksDisabled: true as const,
  gitReplacementObjectsDisabled: true as const,
  gitSystemAndGlobalConfigDisabled: true as const,
  installedRuntimeClosureAuthenticated: true as const,
  pnpmDistributionClosureAuthenticated: true as const,
  nativeHelperClosureAuthenticated: true as const,
  nativePublication: true as const,
  executedCheckoutBytesBoundToGitBlobs: true as const,
  executionClosureEnforcedBeforeAndAfter: true as const,
  nativePairLifecyclePublication: true as const,
  rulesAuthority: "MATCH_KERNEL" as const,
  liveInvoked: false as const,
  downstreamAuthority: "denied" as const,
})

export const V138_RETRY_V3_CLOSED_DIRECT_DEFECTS = Object.freeze([
  "AMBIENT_GIT_EXECUTION",
  "CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED",
  "EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED",
  "NATIVE_PUBLICATION_NOT_ENFORCED",
  "PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED",
  "ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE",
] as const)

export const V138_RETRY_V3_PASSED_OBSERVATIONS = Object.freeze([
  "crash-cleanup",
  "executed-checkout-bytes",
  "git-isolation",
  "installed-runtime-closure",
  "native-publication",
] as const)

const V138_RETRY_V3_EXECUTED_SOURCE_PATHS = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.sourceModel,
  V138_BOUNDED_RETRY_V3_PATHS.sourceNativeCustody,
  V138_BOUNDED_RETRY_V3_PATHS.sourceOwnerLock,
  V138_BOUNDED_RETRY_V3_PATHS.sourceController,
  V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
])

type V138ReviewedExecutionClosureV2 = Readonly<{
  schemaVersion: "v1.38-reviewed-execution-closure-v2"
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutByteManifestRoot: V138RetrySha256
  installedClosureRoot: V138RetrySha256
  gitExecutable: "/usr/bin/git"
  gitExecutableSha256: V138RetrySha256
  gitIsolationRoot: V138RetrySha256
  nodeSha256: V138RetrySha256
  pnpmDistributionSha256: V138RetrySha256
  nativeSourcesRoot: V138RetrySha256
  pathnameLaunchReplacementResistanceClaimed: false
}>

const V138_REVIEWED_EXECUTION_CLOSURE_KEYS = Object.freeze([
  "schemaVersion",
  "sourceCommit",
  "sourceTree",
  "sourceParent",
  "checkoutByteManifestRoot",
  "installedClosureRoot",
  "gitExecutable",
  "gitExecutableSha256",
  "gitIsolationRoot",
  "nodeSha256",
  "pnpmDistributionSha256",
  "nativeSourcesRoot",
  "pathnameLaunchReplacementResistanceClaimed",
] as const)

const exactKeys = (
  value: unknown,
  expected: readonly string[],
): value is Record<string, unknown> =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  canonical(Object.keys(value as Record<string, unknown>).sort()) ===
    canonical([...expected].sort())

const isSha256 = (value: unknown): value is V138RetrySha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isCommit = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)

export const V138_PLAN_262_101_REVIEW_DOMAINS = Object.freeze({
  portable: "v1.38:plan-262-101:git-object-byte-custody:portable:v5",
  result: "v1.38:plan-262-101:git-object-byte-custody:root:v5",
  review: "v1.38:plan-262-101:git-object-byte-custody:review:v5",
  finding: "v1.38:plan-262-101:git-object-byte-custody:finding:v5",
} as const)

export const computeV138Plan262101PortableRoot = (
  body: V138ReviewedExecutionClosureV2,
): V138RetrySha256 =>
  sha256(`${V138_PLAN_262_101_REVIEW_DOMAINS.portable}\0${canonical(body)}`)

export const computeV138Plan262101FindingRoot = (
  findings: readonly unknown[],
): V138RetrySha256 =>
  sha256(`${V138_PLAN_262_101_REVIEW_DOMAINS.finding}\0${canonical(findings)}`)

export const computeV138Plan262101ReviewRoot = (
  reviewBytes: Uint8Array,
): V138RetrySha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(`${V138_PLAN_262_101_REVIEW_DOMAINS.review}\0`),
      Buffer.from(reviewBytes),
    ]),
  )

export const computeV138Plan262101ResultRoot = (
  candidate: unknown,
): V138RetrySha256 => {
  if (candidate === null || typeof candidate !== "object" || Array.isArray(candidate))
    fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const body = JSON.parse(JSON.stringify(candidate)) as Record<string, unknown>
  delete body.resultRoot
  return sha256(`${V138_PLAN_262_101_REVIEW_DOMAINS.result}\0${canonical(body)}`)
}

const PLAN_262_101_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "protocol",
  "status",
  "correctedSource",
  "protectedHistory",
  "execution",
  "reviewedExecutionClosure",
  "findings",
  "findingCount",
  "findingRoot",
  "sourceReviewPassed",
  "identityClaims",
  "authority",
  "reviewRoot",
  "resultRoot",
] as const)

const PLAN_262_101_AUTHORITY_KEYS = Object.freeze([
  "plan26292Eligible",
  "authorizesExecution",
  "authorizationCreated",
  "sealV13Created",
  "retryEnvelopeV3Created",
  "journalV3Created",
  "receiptsV3Created",
  "terminalV3Created",
  "reproductionV17Created",
  "dispositionV3Created",
  "correctionV11Created",
  "route11ActivationCreated",
  "readinessV3Created",
  "lifecycleV3Created",
  "liveInvoked",
  "localSecretAccessed",
  "lifecycleMutated",
  "freshCharged",
  "freshAccepted",
  "phase263PlanningAuthorized",
  "phase263ExecutionAuthorized",
  "candidateSearchAuthorized",
  "formationMaterializationAuthorized",
  "holdoutOpeningAuthorized",
  "publicAuthorized",
  "productAuthorized",
  "activationAuthorized",
  "productionAuthorized",
  "countedPlayAuthorized",
  "gameplayChangeAuthorized",
  "archiveAuthorized",
  "tagAuthorized",
] as const)

const PLAN_262_101_IDENTITY_KEYS = Object.freeze([
  "independentPersonClaimed",
  "externalIdentityClaimed",
  "cryptographicReviewerIdentityClaimed",
  "independentCustodyClaimed",
  "separatePermissioningClaimed",
  "maliciousOperatorResistanceClaimed",
  "hostileSameUidResistanceClaimed",
  "pathnameLaunchReplacementResistanceClaimed",
] as const)

const validatePlan262101Envelope = (
  candidate: unknown,
  reviewReportBytes: Buffer,
): any => {
  if (!exactKeys(candidate, PLAN_262_101_TOP_LEVEL_KEYS))
    fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const review = candidate as any
  if (
    review.schemaVersion !==
      "v1.38-plan-262-101-git-object-byte-custody-rereview-v5" ||
    review.protocol !== "git-object-byte-custody-v1"
  )
    fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const corrected = review.correctedSource
  const protectedHistory = review.protectedHistory
  const plan98 = protectedHistory?.plan98
  const plan99 = protectedHistory?.plan99
  const execution = review.execution
  if (
    review.status !== "zero_findings" ||
    review.findingCount !== 0 ||
    !Array.isArray(review.findings) ||
    review.findings.length !== 0 ||
    review.findingRoot !== computeV138Plan262101FindingRoot([]) ||
    review.sourceReviewPassed !== true ||
    review.reviewRoot !== computeV138Plan262101ReviewRoot(reviewReportBytes) ||
    review.resultRoot !== computeV138Plan262101ResultRoot(review) ||
    new Set([
      review.reviewedExecutionClosure?.reviewedExecutionClosureRoot,
      review.resultRoot,
      review.reviewRoot,
      review.findingRoot,
    ]).size !== 4 ||
    !exactKeys(corrected, ["commit", "tree", "parent", "noLaterRewrite", "summaryTrustedAsVerdict", "files"]) ||
    !isCommit(corrected.commit) ||
    !isCommit(corrected.tree) ||
    !isCommit(corrected.parent) ||
    corrected.noLaterRewrite !== true ||
    corrected.summaryTrustedAsVerdict !== false ||
    !Array.isArray(corrected.files) ||
    corrected.files.length !== 3 ||
    canonical(corrected.files.map((item: any) => item.path).sort()) !== canonical([
      V138_BOUNDED_RETRY_V3_PATHS.sourceNativeCustody,
      V138_BOUNDED_RETRY_V3_PATHS.sourceController,
      V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
    ].sort()) ||
    corrected.files.some((item: unknown) =>
      !exactKeys(item, ["path", "mode", "blob", "byteLength", "sha256"]) ||
      ![
        V138_BOUNDED_RETRY_V3_PATHS.sourceNativeCustody,
        V138_BOUNDED_RETRY_V3_PATHS.sourceController,
        V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
      ].includes((item as any).path) ||
      !["100644", "100755"].includes((item as any).mode) ||
      !isCommit((item as any).blob) ||
      !Number.isSafeInteger((item as any).byteLength) ||
      (item as any).byteLength <= 0 ||
      !isSha256((item as any).sha256)
    ) ||
    !exactKeys(protectedHistory, ["provisionalPairReinterpreted", "plan98", "plan99"]) ||
    protectedHistory.provisionalPairReinterpreted !== false ||
    !exactKeys(plan98, ["sourceCommit", "sourceTree", "sourceParent", "summarySha256"]) ||
    plan98.sourceCommit !== "702bfa5216e3b0e15b4816ce28c98dbcdee38517" ||
    plan98.sourceTree !== "4a4ea89f5392c250d32a39abde0bcf9b98aa079f" ||
    plan98.sourceParent !== "266c977a657c04c32a54b2293d01cf6fab1edf10" ||
    plan98.summarySha256 !== "sha256:0d42f4833cce41f80e66d2343b4427e2b8149942c070a211338ffc0cc04dfe99" ||
    !exactKeys(plan99, [
      "provisionalPairCommit", "artifactSha256", "reviewSha256", "summarySha256",
      "provisionalFindingCount", "provisionalFindingRoot", "provisionalReviewRoot",
      "blockedFindingCode", "blockedFindingRoot", "blockedReviewRoot",
      "plan26292Eligible", "freshCharged", "freshAccepted",
    ]) ||
    plan99.provisionalPairCommit !== "19a6eb53a2ad2c0188009d095103c42718aa3214" ||
    plan99.artifactSha256 !== "sha256:b52599fcbcf53f3eac8e435f87ad85d6d8cc4512dcfa18fe029d5670127aaa34" ||
    plan99.reviewSha256 !== "sha256:f0fe8877f1b33132b101aaa4e475d06fc462e0ce19af22785e0049daff338b34" ||
    plan99.summarySha256 !== "sha256:0ab477151ea5a272987c7f83567c172ab540ec9c979b84501f1bc7cb45fbd294" ||
    plan99.provisionalFindingCount !== 0 ||
    plan99.provisionalFindingRoot !== "sha256:f42b8afbcf35570b2c5be6bee0e7b06548deb19b4f533260bf16c56d0c7a4b9c" ||
    plan99.provisionalReviewRoot !== "sha256:9d5a3f650a34e3074c49ceb61072ba361932af20a5a1bf7b8fb61e197d345f4a" ||
    plan99.blockedFindingCode !== "GIT_SHOW_BYTES_TRIMMED" ||
    plan99.blockedFindingRoot !== "sha256:05a090e72cb43224683b190bca9b27ac81fed4cbef2792a9cb39d8d78e233b77" ||
    plan99.blockedReviewRoot !== "sha256:332855378479e0bceee3f82a4e5445039d476345ab4d1d9b019d5c435a57664b" ||
    plan99.plan26292Eligible !== false ||
    plan99.freshCharged !== 0 ||
    plan99.freshAccepted !== 0 ||
    !exactKeys(execution, [
      "focusedTestsPassed", "sourceOnlyPassed", "checkoutBytesMatchedBefore",
      "checkoutBytesMatchedAfter", "executionClosureMatchedBeforeAfter",
      "actualConsumerStatus", "actualConsumerCandidateJsonSha256",
      "actualConsumerCandidateReviewSha256", "destinationsUnchanged",
      "cleanupComplete", "canonicalWrites", "liveInvoked", "freshCharged",
      "freshAccepted", "localSecretAccessed", "identityConsumed",
    ]) ||
    !Number.isSafeInteger(execution.focusedTestsPassed) ||
    execution.focusedTestsPassed < 0 ||
    execution.sourceOnlyPassed !== true ||
    execution.checkoutBytesMatchedBefore !== true ||
    execution.checkoutBytesMatchedAfter !== true ||
    execution.executionClosureMatchedBeforeAfter !== true ||
    execution.actualConsumerStatus !== "passed" ||
    !isSha256(execution.actualConsumerCandidateJsonSha256) ||
    !isSha256(execution.actualConsumerCandidateReviewSha256) ||
    execution.destinationsUnchanged !== true ||
    execution.cleanupComplete !== true ||
    execution.canonicalWrites !== 0 ||
    execution.liveInvoked !== false ||
    execution.freshCharged !== 0 ||
    execution.freshAccepted !== 0 ||
    execution.localSecretAccessed !== false ||
    execution.identityConsumed !== false ||
    !exactKeys(review.identityClaims, PLAN_262_101_IDENTITY_KEYS) ||
    Object.values(review.identityClaims).some((value) => value !== false) ||
    !exactKeys(review.authority, PLAN_262_101_AUTHORITY_KEYS) ||
    review.authority.plan26292Eligible !== true ||
    review.authority.freshCharged !== 0 ||
    review.authority.freshAccepted !== 0 ||
    Object.entries(review.authority).some(([key, value]) =>
      !["plan26292Eligible", "freshCharged", "freshAccepted"].includes(key) && value !== false
    )
  ) fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  return review
}

export const validateV138Plan262101ReviewedExecutionClosure = (
  candidate: unknown,
  current: V138RetryV3ExecutionClosure,
  reviewReportBytes: Buffer,
): V138RetryV3ExecutionClosure => {
  const review = validatePlan262101Envelope(candidate, reviewReportBytes)
  const portable = review.reviewedExecutionClosure
  if (!exactKeys(portable, [...V138_REVIEWED_EXECUTION_CLOSURE_KEYS, "reviewedExecutionClosureRoot"]))
    fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const body = Object.fromEntries(
    V138_REVIEWED_EXECUTION_CLOSURE_KEYS.map((key) => [key, portable[key]]),
  ) as V138ReviewedExecutionClosureV2
  if (
    body.schemaVersion !== "v1.38-reviewed-execution-closure-v2" ||
    !isCommit(body.sourceCommit) ||
    !isCommit(body.sourceTree) ||
    !isCommit(body.sourceParent) ||
    body.gitExecutable !== "/usr/bin/git" ||
    body.pathnameLaunchReplacementResistanceClaimed !== false ||
    [body.checkoutByteManifestRoot, body.installedClosureRoot, body.gitExecutableSha256,
      body.gitIsolationRoot, body.nodeSha256, body.pnpmDistributionSha256,
      body.nativeSourcesRoot].some((value) => !isSha256(value)) ||
    portable.reviewedExecutionClosureRoot !== computeV138Plan262101PortableRoot(body) ||
    portable.reviewedExecutionClosureRoot === portable.installedClosureRoot ||
    portable.reviewedExecutionClosureRoot === current.executionClosureRoot ||
    review.correctedSource.commit !== body.sourceCommit ||
    review.correctedSource.tree !== body.sourceTree ||
    review.correctedSource.parent !== body.sourceParent
  ) fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  for (const key of V138_REVIEWED_EXECUTION_CLOSURE_KEYS) {
    if (key === "schemaVersion") continue
    if (current[key] !== body[key])
      fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_MISMATCH")
  }
  return current
}

const authenticateCurrentExecutionClosure = (
  repoRoot: string,
  expectedRoot?: V138RetrySha256,
): V138RetryV3ExecutionClosure =>
  authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: git(repoRoot, ["rev-parse", "HEAD"]),
    checkoutPaths: V138_RETRY_V3_EXECUTED_SOURCE_PATHS,
    ...(expectedRoot === undefined ? {} : { executionClosureRoot: expectedRoot }),
  })

const authenticateReviewedExecutionClosure = (
  repoRoot: string,
): V138RetryV3ExecutionClosure => {
  const review = readJsonNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_V3_PATHS.sourceReview,
  )
  if (
    review === null ||
    typeof review !== "object" ||
    Array.isArray(review) ||
    (review as any).schemaVersion !==
      "v1.38-plan-262-101-git-object-byte-custody-rereview-v5" ||
    !isCommit((review as any).reviewedExecutionClosure?.sourceCommit)
  ) fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const current = authenticateV138RetryV3ExecutionClosure(repoRoot, {
    sourceCommit: (review as any).reviewedExecutionClosure.sourceCommit,
    checkoutPaths: V138_RETRY_V3_EXECUTED_SOURCE_PATHS,
  })
  const validated = validateV138Plan262101ReviewedExecutionClosure(
    review,
    current,
    readNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport),
  )
  for (const expected of (review as any).correctedSource.files) {
    const actual = authenticateV138CommittedRegularFile(
      repoRoot,
      (review as any).correctedSource.commit,
      expected.path,
    )
    if (
      actual.mode !== expected.mode ||
      actual.oid !== expected.blob ||
      actual.byteLength !== expected.byteLength ||
      sha256(actual.bytes) !== expected.sha256
    )
      fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  }
  const protectedHistory = (review as any).protectedHistory
  for (const [repoPath, expected] of [
    [
      `${PHASE_DIR}/262-98-SUMMARY.md`,
      protectedHistory.plan98.summarySha256,
    ],
    [
      ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
      protectedHistory.plan99.artifactSha256,
    ],
    [`${PHASE_DIR}/262-99-REVIEW.md`, protectedHistory.plan99.reviewSha256],
    [`${PHASE_DIR}/262-99-SUMMARY.md`, protectedHistory.plan99.summarySha256],
  ] as const)
    if (sha256(readNoFollow(repoRoot, repoPath)) !== expected)
      fail("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID")
  return validated
}

type PreflightResult =
  | Readonly<{
      available: true
      effectiveAvailableBasisPoints: number
    }>
  | Readonly<{ available: false }>

export interface V138BoundedRetryV3ControllerEffects {
  readonly monotonicMilliseconds: () => number
  readonly waitUntil: (targetMilliseconds: number) => Promise<void>
  readonly observePreflight: () => Promise<PreflightResult>
  readonly runCalibration: (
    input: Readonly<{
      routeIdentity: V138RetryV3RouteIdentity
      identities: readonly V138RetryV3CalibrationIdentity[]
    }>,
  ) => Promise<
    Readonly<{
      status: "admitted" | "system_failure"
      completeCleanup: boolean
      supervisionRoot?: V138RetrySha256
    }>
  >
  readonly runReproduction: (
    input: Readonly<{
      routeIdentity: V138RetryV3RouteIdentity
      identities: readonly V138RetryV3ReproductionIdentity[]
    }>,
  ) => Promise<
    Readonly<{
      status: "passed_exact" | "system_failure"
      acceptedCells: number
      completeCleanup: boolean
      reproductionRoot?: V138RetrySha256
      artifact?: unknown
    }>
  >
  readonly appendDurableRecord: (record: V138RetryV3JournalRecord) => void
}

export interface V138BoundedRetryV3ControllerResult {
  readonly records: readonly V138RetryV3JournalRecord[]
  readonly state: Readonly<V138DerivedRetryV3State>
  readonly reproductionArtifact?: unknown
}

const recordFor = <K extends V138RetryV3JournalEvent["kind"]>(
  records: readonly V138RetryV3JournalRecord[],
  kind: K,
) =>
  records.filter(
    (record): record is Extract<V138RetryV3JournalRecord, { kind: K }> =>
      record.kind === kind,
  )

const waitTarget = (records: readonly V138RetryV3JournalRecord[]): number => {
  const observations = recordFor(records, "observe_preflight")
  const lastRefusal = observations
    .filter(
      ({ effectiveAvailableBasisPoints }) =>
        effectiveAvailableBasisPoints < 2_500,
    )
    .at(-1)
  const calibrationFailure = recordFor(records, "finish_calibration")
    .filter(
      ({ status, completeCleanup }) =>
        status === "system_failure" && completeCleanup,
    )
    .at(-1)
  return Math.max(
    lastRefusal === undefined
      ? 0
      : lastRefusal.atMilliseconds +
          V138_BOUNDED_RETRY_V3_POLICY.refusalSpacingMilliseconds,
    calibrationFailure === undefined
      ? 0
      : calibrationFailure.atMilliseconds +
          V138_BOUNDED_RETRY_V3_POLICY.calibrationFailureBackoffMilliseconds,
  )
}

export const runV138BoundedRetryV3Controller = async (
  input: Readonly<{
    envelope: unknown
    owner: string
    records: readonly V138RetryV3JournalRecord[]
    effects: V138BoundedRetryV3ControllerEffects
  }>,
): Promise<Readonly<V138BoundedRetryV3ControllerResult>> => {
  const envelope = checkV138InactiveRetryV3Envelope(input.envelope)
  let records = [...input.records] as readonly V138RetryV3JournalRecord[]
  let reproductionArtifact: unknown
  const append = (event: V138RetryV3JournalEvent): void => {
    const next = appendV138RetryV3JournalRecord(
      records,
      event,
      input.effects.monotonicMilliseconds(),
      envelope.envelopeRoot,
    )
    const record = next.at(-1)!
    input.effects.appendDurableRecord(record)
    records = next
  }
  const finish = (): Readonly<V138BoundedRetryV3ControllerResult> =>
    Object.freeze({
      records: Object.freeze([...records]),
      state: deriveV138RetryV3State(envelope, records),
      ...(reproductionArtifact === undefined ? {} : { reproductionArtifact }),
    })
  const deadlineGuard = (): boolean => {
    const state = deriveV138RetryV3State(envelope, records)
    if (state.disposition !== "active") return true
    if (state.firstObservationMilliseconds === null) return false
    const now = input.effects.monotonicMilliseconds()
    if (
      now <
      state.firstObservationMilliseconds +
        V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds
    ) {
      return false
    }
    append({
      kind: "time_window_expired",
      owner: input.owner,
      reason: "time_window_expired",
    })
    return true
  }

  // A prior invocation may have died only after its durable reservation.
  // Reconciliation charges the work and fails closed; it never relaunches the
  // same identity or asserts cleanup that the journal cannot prove.
  const pendingReproduction = recordFor(records, "reserve_reproduction").find(
    ({ routeIdentity }) =>
      !recordFor(records, "finish_reproduction").some(
        (terminal) => terminal.routeIdentity === routeIdentity,
      ),
  )
  if (pendingReproduction !== undefined) {
    append({
      kind: "finish_reproduction",
      routeIdentity: pendingReproduction.routeIdentity,
      owner: pendingReproduction.owner,
      status: "system_failure",
      acceptedCells: 0,
      completeCleanup: false,
    })
  } else {
    const pendingCalibration = recordFor(records, "reserve_calibration").find(
      ({ routeIdentity }) =>
        !recordFor(records, "finish_calibration").some(
          (terminal) => terminal.routeIdentity === routeIdentity,
        ),
    )
    if (pendingCalibration !== undefined) {
      append({
        kind: "finish_calibration",
        routeIdentity: pendingCalibration.routeIdentity,
        owner: pendingCalibration.owner,
        status: "system_failure",
        completeCleanup: false,
      })
    } else {
      const pendingRoute = recordFor(records, "reserve_route").find(
        ({ identity }) =>
          !recordFor(records, "reserve_calibration").some(
            (reservation) => reservation.routeIdentity === identity,
          ),
      )
      if (pendingRoute !== undefined) {
        const routeOrdinal = V138_BOUNDED_RETRY_V3_IDENTITIES.routes.indexOf(
          pendingRoute.identity,
        )
        const identities = V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.slice(
          routeOrdinal * 8,
          routeOrdinal * 8 + 8,
        )
        if (deadlineGuard()) return finish()
        append({
          kind: "reserve_calibration",
          routeIdentity: pendingRoute.identity,
          owner: pendingRoute.owner,
          identities,
        })
        if (deadlineGuard()) return finish()
        append({
          kind: "finish_calibration",
          routeIdentity: pendingRoute.identity,
          owner: pendingRoute.owner,
          status: "system_failure",
          completeCleanup: false,
        })
      }
      const pendingPreflight =
        pendingRoute === undefined
          ? recordFor(records, "reserve_preflight").find(
              ({ identity }) =>
                !recordFor(records, "observe_preflight").some(
                  (observation) => observation.identity === identity,
                ),
            )
          : undefined
      if (pendingPreflight !== undefined) {
        if (deadlineGuard()) return finish()
        append({
          kind: "observe_preflight",
          identity: pendingPreflight.identity,
          owner: pendingPreflight.owner,
          effectiveAvailableBasisPoints: 0,
        })
      }
    }
  }

  if (deadlineGuard()) return finish()

  const admittedAwaitingReproduction = recordFor(
    records,
    "finish_calibration",
  ).find(
    ({ routeIdentity, status, completeCleanup }) =>
      status === "admitted" &&
      completeCleanup &&
      !recordFor(records, "reserve_reproduction").some(
        (reservation) => reservation.routeIdentity === routeIdentity,
      ),
  )
  if (
    deriveV138RetryV3State(envelope, records).disposition === "active" &&
    admittedAwaitingReproduction !== undefined
  ) {
    const routeIdentity = admittedAwaitingReproduction.routeIdentity
    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_reproduction",
      routeIdentity,
      owner: admittedAwaitingReproduction.owner,
      identities: V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryV3ControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction,
      })
    } catch {
      reproduction = {
        status: "system_failure",
        acceptedCells: 0,
        completeCleanup: false,
      }
    }
    reproductionArtifact = reproduction.artifact
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_reproduction",
      routeIdentity,
      owner: admittedAwaitingReproduction.owner,
      status: reproduction.status,
      acceptedCells: reproduction.acceptedCells,
      completeCleanup: reproduction.completeCleanup,
      ...(reproduction.reproductionRoot === undefined
        ? {}
        : { reproductionRoot: reproduction.reproductionRoot }),
    })
  }

  while (deriveV138RetryV3State(envelope, records).disposition === "active") {
    if (deadlineGuard()) return finish()
    const state = deriveV138RetryV3State(envelope, records)
    if (state.nextPreflightIdentity === null) break
    const target = waitTarget(records)
    if (input.effects.monotonicMilliseconds() < target) {
      await input.effects.waitUntil(target)
    }
    if (deadlineGuard()) return finish()
    const preflightIdentity = state.nextPreflightIdentity
    append({
      kind: "reserve_preflight",
      identity: preflightIdentity,
      owner: input.owner,
    })
    if (deadlineGuard()) return finish()
    let observation: PreflightResult
    try {
      observation = await input.effects.observePreflight()
    } catch {
      observation = { available: false }
    }
    if (deadlineGuard()) return finish()
    const basisPoints = observation.available
      ? observation.effectiveAvailableBasisPoints
      : 0
    append({
      kind: "observe_preflight",
      identity: preflightIdentity,
      owner: input.owner,
      effectiveAvailableBasisPoints: basisPoints,
    })
    if (basisPoints < 2_500) continue

    const admittedState = deriveV138RetryV3State(envelope, records)
    const routeIdentity = admittedState.nextRouteIdentity
    if (routeIdentity === null) break
    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_route",
      identity: routeIdentity,
      owner: input.owner,
      preflightIdentity,
    })
    const routeOrdinal =
      V138_BOUNDED_RETRY_V3_IDENTITIES.routes.indexOf(routeIdentity)
    const calibrationIdentities =
      V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.slice(
        routeOrdinal * 8,
        routeOrdinal * 8 + 8,
      )
    append({
      kind: "reserve_calibration",
      routeIdentity,
      owner: input.owner,
      identities: calibrationIdentities,
    })
    if (deadlineGuard()) return finish()
    let calibration: Awaited<
      ReturnType<V138BoundedRetryV3ControllerEffects["runCalibration"]>
    >
    try {
      calibration = await input.effects.runCalibration({
        routeIdentity,
        identities: calibrationIdentities,
      })
    } catch {
      calibration = { status: "system_failure", completeCleanup: false }
    }
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_calibration",
      routeIdentity,
      owner: input.owner,
      status: calibration.status,
      completeCleanup: calibration.completeCleanup,
      ...(calibration.supervisionRoot === undefined
        ? {}
        : { supervisionRoot: calibration.supervisionRoot }),
    })
    if (calibration.status !== "admitted" || !calibration.completeCleanup) {
      continue
    }

    if (deadlineGuard()) return finish()
    append({
      kind: "reserve_reproduction",
      routeIdentity,
      owner: input.owner,
      identities: V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction,
    })
    if (deadlineGuard()) return finish()
    let reproduction: Awaited<
      ReturnType<V138BoundedRetryV3ControllerEffects["runReproduction"]>
    >
    try {
      reproduction = await input.effects.runReproduction({
        routeIdentity,
        identities: V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction,
      })
    } catch {
      reproduction = {
        status: "system_failure",
        acceptedCells: 0,
        completeCleanup: false,
      }
    }
    reproductionArtifact = reproduction.artifact
    if (deadlineGuard()) return finish()
    append({
      kind: "finish_reproduction",
      routeIdentity,
      owner: input.owner,
      status: reproduction.status,
      acceptedCells: reproduction.acceptedCells,
      completeCleanup: reproduction.completeCleanup,
      ...(reproduction.reproductionRoot === undefined
        ? {}
        : { reproductionRoot: reproduction.reproductionRoot }),
    })
  }
  return finish()
}

const safeStatus = (
  target: string,
): "missing" | "regular" | "directory" | "unsafe" => {
  try {
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") return "missing"
    throw error
  }
}

const containedRepoTarget = (repoRoot: string, repoPath: string): string => {
  const root = path.resolve(repoRoot)
  const target = path.resolve(root, repoPath)
  const relative = path.relative(root, target)
  if (
    relative.length === 0 ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    fail("V138_RETRY_V3_PATH_ESCAPE")
  }
  let current = root
  const rootStatus = lstatSync(current)
  if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) {
    fail("V138_RETRY_V3_PARENT_UNSAFE")
  }
  for (const component of relative.split(path.sep).slice(0, -1)) {
    current = path.join(current, component)
    const status = lstatSync(current)
    if (!status.isDirectory() || status.isSymbolicLink()) {
      fail("V138_RETRY_V3_PARENT_UNSAFE")
    }
  }
  return target
}

const readNoFollowWithMode = (
  repoRoot: string,
  repoPath: string,
): Readonly<{ bytes: Buffer; mode: number }> => {
  const target = containedRepoTarget(repoRoot, repoPath)
  if (safeStatus(target) !== "regular") fail("V138_RETRY_INPUT_UNSAFE")
  const before = lstatSync(target)
  const descriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const opened = fstatSync(descriptor)
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino
    )
      fail("V138_RETRY_INPUT_UNSAFE")
    return Object.freeze({ bytes: readFileSync(descriptor), mode: opened.mode })
  } finally {
    closeSync(descriptor)
  }
}

const readNoFollow = (repoRoot: string, repoPath: string): Buffer =>
  readNoFollowWithMode(repoRoot, repoPath).bytes

export const parseV138RetryV3RegularBlobTreeEntry = (
  bytes: Buffer,
  repoPath: string,
): Readonly<{ mode: "100644" | "100755"; oid: string }> => {
  if (
    path.isAbsolute(repoPath) ||
    repoPath.includes("\0") ||
    repoPath.split("/").some((part) => !part || part === "." || part === "..")
  )
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  const terminator = bytes.indexOf(0)
  if (terminator !== bytes.length - 1 || terminator < 0)
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  const record = bytes.subarray(0, terminator)
  const separator = record.indexOf(0x09)
  if (separator <= 0 || record.indexOf(0x09, separator + 1) !== -1)
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  const metadataBytes = record.subarray(0, separator)
  if ([...metadataBytes].some((value) => value > 0x7f))
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  const metadata = metadataBytes.toString("ascii")
  const match = /^(100644|100755) blob ([0-9a-f]{40})$/u.exec(metadata)
  if (
    match === null ||
    !record.subarray(separator + 1).equals(Buffer.from(repoPath))
  )
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  return Object.freeze({
    mode: match[1] as "100644" | "100755",
    oid: match[2]!,
  })
}

export const authenticateV138CommittedRegularFile = (
  repoRoot: string,
  sourceCommit: string,
  repoPath: string,
): Readonly<{
  mode: "100644" | "100755"
  oid: string
  bytes: Buffer
  byteLength: number
}> => {
  if (!/^[0-9a-f]{40}$/u.test(sourceCommit))
    fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  try {
    const entry = parseV138RetryV3RegularBlobTreeEntry(
      runV138RetryV3IsolatedGitBytes(repoRoot, [
        "ls-tree",
        "-z",
        sourceCommit,
        "--",
        repoPath,
      ]),
      repoPath,
    )
    const committed = runV138RetryV3IsolatedGitBytes(repoRoot, [
      "cat-file",
      "blob",
      entry.oid,
    ])
    const working = readNoFollowWithMode(repoRoot, repoPath)
    const workingMode = (working.mode & 0o111) === 0 ? "100644" : "100755"
    if (entry.mode !== workingMode || !committed.equals(working.bytes))
      fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
    return Object.freeze({
      ...entry,
      bytes: committed,
      byteLength: committed.length,
    })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "V138_RETRY_SOURCE_CUSTODY_INVALID"
    )
      throw error
    return fail("V138_RETRY_SOURCE_CUSTODY_INVALID")
  }
}

const readJsonNoFollow = (repoRoot: string, repoPath: string): unknown => {
  try {
    return JSON.parse(readNoFollow(repoRoot, repoPath).toString("utf8"))
  } catch (error) {
    if (error instanceof Error && error.message === "V138_RETRY_INPUT_UNSAFE")
      throw error
    return fail("V138_RETRY_INPUT_INVALID")
  }
}

const v138RetryTerminalResult = (
  result: Readonly<V138BoundedRetryV3ControllerResult>,
) => {
  if (result.state.disposition === "active") {
    fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  }
  return Object.freeze({
    schemaVersion: "v1.38-current-matrix-retry-terminal-v3" as const,
    terminalReason: result.state.terminalReason,
    journalRoot: result.state.journalRoot,
    stateRoot: result.state.stateRoot,
    disposition: result.state.disposition,
    counters: Object.freeze({
      preflightObservationsConsumed: result.state.preflightObservationsConsumed,
      routeStartsConsumed: result.state.routeStartsConsumed,
      calibrationIdentitiesCharged: result.state.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged: result.state.reproductionIdentitiesCharged,
      acceptedCells: result.state.acceptedCells,
    }),
    freshAccepted: result.state.acceptedCells,
    completeCleanup: result.state.completeCleanup,
    downstreamAuthority: "denied" as const,
    productionAuthorized: false as const,
  })
}

export const publishV138RetryV3TerminalResult = (
  repoRoot: string,
  result: Readonly<V138BoundedRetryV3ControllerResult>,
): void => {
  publishV138RetryV3NativePair(repoRoot, {
    transactionId: "v3-terminal-only",
    intentPath: ".planning/artifacts/v1.38-v3-terminal-only.intent",
    members: [
      {
        target: V138_BOUNDED_RETRY_V3_PATHS.terminal,
        bytes: canonical(v138RetryTerminalResult(result)),
      },
      {
        target: `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/terminal-only.commit`,
        bytes: "committed\n",
      },
    ],
  })
}

export interface V138RetryV3PublicationHooks {
  readonly afterReproductionWrite?: () => void
  readonly afterReproductionParentFsync?: () => void
  readonly afterTerminalWrite?: () => void
  readonly afterTerminalParentFsync?: () => void
}

const validateSuccessArtifact = (
  result: Readonly<V138BoundedRetryV3ControllerResult>,
  artifact: any,
): void => {
  const terminal = result.records.findLast(
    (record) => record.kind === "finish_reproduction",
  )
  if (
    result.state.disposition !== "succeeded" ||
    terminal?.kind !== "finish_reproduction" ||
    terminal.status !== "passed_exact" ||
    terminal.reproductionRoot === undefined ||
    artifact?.receiptRoot !== terminal.reproductionRoot ||
    artifact?.status !== "passed_exact" ||
    artifact?.acceptedCellCount !== 540 ||
    artifact?.completeCleanup !== true
  )
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
}

export const publishV138RetryV3Outcome = (args: {
  repoRoot: string
  terminalTarget: string
  reproductionTarget: string
  result: Readonly<V138BoundedRetryV3ControllerResult>
  hooks?: V138RetryV3PublicationHooks
}): void => {
  const { result, hooks = {} } = args
  if (result.state.disposition === "active")
    fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  if (result.state.disposition === "succeeded") {
    const reproductionStatus = safeStatus(args.reproductionTarget)
    if (reproductionStatus === "missing") {
      validateSuccessArtifact(result, result.reproductionArtifact)
      publishV138RetryV3NativePair(args.repoRoot, {
        transactionId: "v3-reproduction-terminal",
        intentPath: ".planning/artifacts/v1.38-v3-reproduction-terminal.intent",
        members: [
          {
            target: V138_BOUNDED_RETRY_V3_PATHS.reproduction,
            bytes: canonical(result.reproductionArtifact),
          },
          {
            target: V138_BOUNDED_RETRY_V3_PATHS.terminal,
            bytes: canonical(v138RetryTerminalResult(result)),
          },
        ],
      })
      hooks.afterReproductionWrite?.()
      hooks.afterReproductionParentFsync?.()
      hooks.afterTerminalWrite?.()
      hooks.afterTerminalParentFsync?.()
      return
    } else if (reproductionStatus === "regular") {
      const artifact = JSON.parse(readFileSync(args.reproductionTarget, "utf8"))
      validateSuccessArtifact(result, artifact)
      if (
        result.reproductionArtifact !== undefined &&
        canonical(artifact) !== canonical(result.reproductionArtifact)
      )
        fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
    } else fail("V138_RETRY_DESTINATION_UNSAFE")
  } else if (safeStatus(args.reproductionTarget) !== "missing") {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }

  const terminalStatus = safeStatus(args.terminalTarget)
  if (terminalStatus === "missing") {
    publishV138RetryV3TerminalResult(args.repoRoot, result)
    hooks.afterTerminalWrite?.()
    hooks.afterTerminalParentFsync?.()
  } else if (
    terminalStatus !== "regular" ||
    readFileSync(args.terminalTarget, "utf8") !==
      canonical(v138RetryTerminalResult(result))
  ) {
    fail("V138_RETRY_DUPLICATE_INVOCATION_INVALID")
  }
}

const fsyncParent = (target: string): void => {
  const descriptor = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export interface V138SuccessorSourceSealV13 {
  readonly schemaVersion: "v1.38-successor-source-seal-v13"
  readonly sourceBaseCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0"
  readonly researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly directParentCommit: string
  readonly sourceRoot: V138RetrySha256
  readonly reviewRoot: V138RetrySha256
  readonly reviewCommit: string
  readonly localSealVerificationRoot: V138RetrySha256
  readonly protectedHistoryRoot: V138RetrySha256
  readonly directChild: true
  readonly assuranceClass: "single_operator_local_seal_v1"
  readonly productionAuthorized: false
  readonly downstreamAuthority: "denied"
  readonly sealRoot: V138RetrySha256
}

export interface V138DerivedV3SealEnvelope {
  readonly seal: Readonly<V138SuccessorSourceSealV13>
  readonly envelope: Readonly<V138InactiveRetryV3Envelope>
}

const git = (repoRoot: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(repoRoot, args)

const requireExactV3Lineage = (repoRoot: string): void => {
  const expected = checkV138ProtectedHistoryV3(
    V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY,
  )
  if (
    git(repoRoot, ["rev-parse", `${expected.preResearchBaselineCommit}^{tree}`]) !==
      "e5895149ca186ea72e961860a03a950c8c488b72" ||
    git(repoRoot, ["rev-parse", `${expected.researchCommit}^{tree}`]) !==
      "e09e272f0d436d79bc22cbed2fe758fc68a2aa21" ||
    git(repoRoot, ["show", "-s", "--format=%P", expected.researchCommit]) !==
      expected.preResearchBaselineCommit
  ) {
    fail("V138_RETRY_V3_LINEAGE_INVALID")
  }
}

const requireProtectedV1Bytes = (repoRoot: string): void => {
  const expected = V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY
  const forbidden = [
    V138_BOUNDED_RETRY_V3_PATHS.seal,
    V138_BOUNDED_RETRY_V3_PATHS.envelope,
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
  ]
  const batch = readV138WorkspaceBatch(
    repoRoot,
    expected.protectedFiles.map(([repoPath]) => repoPath),
    forbidden,
  )
  for (const [repoPath, digest] of expected.protectedFiles)
    if (sha256V138Secure(batch.bytes[repoPath]!) !== digest)
      fail("V138_RETRY_V3_PROTECTED_HISTORY_INVALID")
  const correction = JSON.parse(
    batch.bytes[V138_BOUNDED_RETRY_V3_PATHS.protectedHistoryCorrection]!.toString(
      "utf8",
    ),
  ) as Record<string, any>
  if (
    correction.correctionRoot !== expected.correctionV10Root ||
    correction.status !== "integrity_non_pass" ||
    correction.remediation?.coherentManifestBatch !== true ||
    correction.remediation?.executedCheckoutBytesBoundToGitBlobs !== true ||
    correction.remediation?.gitConfigHooksAndReplacementsDisabled !== true ||
    correction.remediation?.installedRuntimeClosureAuthenticated !== true ||
    correction.empiricalOutcome?.freshAccepted !== 0 ||
    correction.empiricalOutcome?.requiredAccepted !== 540 ||
    sha256V138Secure(encodeV138RetryV3CanonicalJson({
      correctionRoot: correction.correctionRoot,
      dispositionRoot: expected.dispositionV2Root,
      lifecycleRoot: expected.lifecycleV2Root,
    })).length !== 71
  ) {
    fail("V138_RETRY_V3_PROTECTED_HISTORY_INVALID")
  }
}

export const deriveV138V3SealedInactiveEnvelope = (
  repoRoot: string,
  directParentCommit = git(repoRoot, ["rev-parse", "HEAD"]),
): Readonly<V138DerivedV3SealEnvelope> => {
  const executionBefore = authenticateReviewedExecutionClosure(repoRoot)
  requireExactV3Lineage(repoRoot)
  requireProtectedV1Bytes(repoRoot)
  const sourcePaths = [
    V138_BOUNDED_RETRY_V3_PATHS.sourceSummary,
    V138_BOUNDED_RETRY_V3_PATHS.sourceController,
    V138_BOUNDED_RETRY_V3_PATHS.sourceModel,
    V138_BOUNDED_RETRY_V3_PATHS.sourceNativeCustody,
    V138_BOUNDED_RETRY_V3_PATHS.sourceOwnerLock,
    V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
  ]
  const custodyPaths = [
    ...sourcePaths,
    V138_BOUNDED_RETRY_V3_PATHS.sourceReview,
    V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport,
    V138_BOUNDED_RETRY_V3_PATHS.localSeal,
    V138_BOUNDED_RETRY_V3_PATHS.protectedHistoryCorrection,
    V138_BOUNDED_RETRY_V3_PATHS.historicalReceiptManifest,
    V138_BOUNDED_RETRY_V3_PATHS.historicalEnvelope,
    V138_BOUNDED_RETRY_V3_PATHS.historicalJournal,
    V138_BOUNDED_RETRY_V3_PATHS.historicalTerminal,
    V138_BOUNDED_RETRY_V3_PATHS.historicalSeal,
    V138_BOUNDED_RETRY_V3_PATHS.historicalDisposition,
    V138_BOUNDED_RETRY_V3_PATHS.historicalLifecycle,
  ]
  if (git(repoRoot, ["status", "--porcelain", "--", ...custodyPaths]) !== "") {
    fail("V138_RETRY_SOURCE_DIRTY")
  }
  for (const repoPath of custodyPaths) {
    authenticateV138CommittedRegularFile(repoRoot, directParentCommit, repoPath)
  }
  const reviewBytes = readNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.sourceReview)
  const review = JSON.parse(reviewBytes.toString("utf8")) as Record<string, unknown>
  if (
    review.findingCount !== 0 ||
    !["passed", "passed_exact", "zero_findings"].includes(String(review.status)) ||
    review.productionAuthorized === true
  ) fail("V138_RETRY_REVIEW_INVALID")
  const reviewRoot =
    typeof review.reviewRoot === "string" && /^sha256:[0-9a-f]{64}$/u.test(review.reviewRoot)
      ? (review.reviewRoot as V138RetrySha256)
      : sha256(reviewBytes)
  const localSeal = readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.localSeal) as Record<string, unknown>
  if (
    localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    localSeal.satisfiesRevisedSeal01 !== true ||
    localSeal.independentCustodyClaimed !== false ||
    typeof localSeal.verificationRoot !== "string" ||
    !/^sha256:[0-9a-f]{64}$/u.test(localSeal.verificationRoot)
  ) fail("V138_RETRY_LOCAL_SEAL_INVALID")
  const sourceBytes = sourcePaths.map((repoPath) => ({
    repoPath,
    sha256: sha256(readNoFollow(repoRoot, repoPath)),
  }))
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13" as const,
    sourceBaseCommit:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.preResearchBaselineCommit,
    researchCommit: V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.researchCommit,
    sourceCommit: directParentCommit,
    sourceTree: git(repoRoot, ["rev-parse", `${directParentCommit}^{tree}`]),
    directParentCommit,
    sourceRoot: sha256(canonical(sourceBytes)),
    reviewRoot,
    reviewCommit: git(repoRoot, [
      "rev-list",
      "-1",
      directParentCommit,
      "--",
      V138_BOUNDED_RETRY_V3_PATHS.sourceReview,
      V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport,
    ]),
    localSealVerificationRoot: localSeal.verificationRoot as V138RetrySha256,
    protectedHistoryRoot:
      V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedHistoryRoot,
    directChild: true as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    productionAuthorized: false as const,
    downstreamAuthority: "denied" as const,
  }
  const seal = Object.freeze({
    ...body,
    sealRoot: sha256(`v138-successor-source-seal-v13\0${canonical(body)}`),
  })
  const result = Object.freeze({
    seal,
    envelope: createV138InactiveRetryV3Envelope({
      sourceRoot: seal.sourceRoot,
      reviewRoot: seal.reviewRoot,
      sealRoot: seal.sealRoot,
      protectedHistoryRoot: seal.protectedHistoryRoot,
      protectedHistoricalIdentities:
        V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY.protectedIdentities,
    }),
  })
  const executionAfter = authenticateReviewedExecutionClosure(repoRoot)
  if (executionAfter.executionClosureRoot !== executionBefore.executionClosureRoot)
    fail("V138_RETRY_V3_EXECUTION_CLOSURE_CHANGED")
  return result
}

const publishPair = (
  repoRoot: string,
  artifacts: V138DerivedV3SealEnvelope,
): void => {
  const seal = path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.seal)
  const envelope = path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.envelope)
  for (const target of [seal, envelope]) {
    const status = safeStatus(target)
    if (status === "unsafe") fail("V138_RETRY_DESTINATION_UNSAFE")
    if (status !== "missing") fail("V138_RETRY_DESTINATION_PRESENT")
  }
  publishV138RetryV3NativePair(repoRoot, {
    transactionId: "v3-seal-envelope",
    intentPath: ".planning/artifacts/v1.38-v3-seal-envelope.intent",
    members: [
      {
        target: V138_BOUNDED_RETRY_V3_PATHS.seal,
        bytes: canonical(artifacts.seal),
      },
      {
        target: V138_BOUNDED_RETRY_V3_PATHS.envelope,
        bytes: canonical(artifacts.envelope),
      },
    ],
  })
}

const checkPublishedPair = (
  repoRoot: string,
  injectedDerivation?: () => Readonly<V138DerivedV3SealEnvelope>,
): Readonly<V138DerivedV3SealEnvelope> => {
  const sealValue = readJsonNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_V3_PATHS.seal,
  ) as V138SuccessorSourceSealV13
  const envelopeValue = checkV138InactiveRetryV3Envelope(
    readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.envelope),
  )
  let expected: Readonly<V138DerivedV3SealEnvelope>
  if (injectedDerivation !== undefined) expected = injectedDerivation()
  else {
    if (!/^[0-9a-f]{40}$/u.test(String(sealValue.directParentCommit))) {
      fail("V138_RETRY_SEALED_ENVELOPE_INVALID")
    }
    expected = deriveV138V3SealedInactiveEnvelope(
      repoRoot,
      sealValue.directParentCommit,
    )
    const sealCommit = git(repoRoot, [
      "rev-list",
      "-1",
      "HEAD",
      "--",
      V138_BOUNDED_RETRY_V3_PATHS.seal,
    ])
    if (
      git(repoRoot, [
        "status",
        "--porcelain",
        "--",
        V138_BOUNDED_RETRY_V3_PATHS.seal,
        V138_BOUNDED_RETRY_V3_PATHS.envelope,
      ]) !== ""
    )
      fail("V138_RETRY_SEALED_ENVELOPE_DIRTY")
    const sealParent = git(repoRoot, [
      "show",
      "-s",
      "--format=%P",
      sealCommit,
    ]).split(" ")[0]
    if (
      sealParent !== sealValue.directParentCommit ||
      git(repoRoot, ["merge-base", "--is-ancestor", sealCommit, "HEAD"]) !== ""
    ) {
      fail("V138_RETRY_SEAL_DIRECT_CHILD_INVALID")
    }
  }
  if (
    canonical(sealValue) !== canonical(expected.seal) ||
    canonical(envelopeValue) !== canonical(expected.envelope)
  ) {
    fail("V138_RETRY_SEALED_ENVELOPE_INVALID")
  }
  return Object.freeze({ seal: sealValue, envelope: envelopeValue })
}

const executeMemoryPressure = (): Promise<MemoryPressureQCommandResult> =>
  new Promise((resolve) => {
    let stdout = Buffer.alloc(0)
    let stderr = Buffer.alloc(0)
    let timedOut = false
    const child = execFile(
      MEMORY_PRESSURE_Q_REQUEST.executable,
      [...MEMORY_PRESSURE_Q_REQUEST.args],
      {
        env: MEMORY_PRESSURE_Q_REQUEST.env,
        timeout: MEMORY_PRESSURE_Q_REQUEST.timeoutMilliseconds,
        maxBuffer: MEMORY_PRESSURE_Q_REQUEST.maximumOutputBytes,
        encoding: "buffer",
      },
      (error, out, err) => {
        stdout = Buffer.from(out ?? [])
        stderr = Buffer.from(err ?? [])
        const details = error as {
          killed?: boolean
          signal?: MemoryPressureQCommandResult["signal"]
          code?: string | number
        }
        timedOut = details?.killed === true
        resolve({
          stdout,
          stderr,
          exitCode:
            typeof details?.code === "number"
              ? details.code
              : error === null
                ? 0
                : null,
          signal: details?.signal ?? null,
          timedOut,
        })
      },
    )
    child.stdin?.end()
  })

const buildV138ReproductionV17 = (
  input: Readonly<{
    execution: Awaited<ReturnType<typeof executeV138ParallelMatrix>>
    admittedCalibrationRoot: V138RetrySha256
  }>,
): Readonly<Record<string, unknown>> => {
  const completeCleanup = input.execution.terminals.every(
    ({ cleanup }) =>
      cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
  )
  const passed =
    input.execution.status === "complete_pending_publication" &&
    input.execution.accounting.terminalAttemptCount === 540 &&
    input.execution.accounting.failedAttemptCount === 0 &&
    input.execution.accounting.cancelledAttemptCount === 0 &&
    input.execution.accounting.unlaunchedAttemptCount === 0 &&
    completeCleanup
  const body = {
    schemaVersion: "v1.38-current-matrix-reproduction-v17" as const,
    status: passed
      ? ("passed_exact" as const)
      : ("stopped_process_failure" as const),
    admittedCalibrationRoot: input.admittedCalibrationRoot,
    chargedAttemptCount: 540 as const,
    acceptedCellCount: passed ? (540 as const) : (0 as const),
    completeCleanup,
    executionRoot: sha256(canonical(input.execution)),
    runtimeRoute: "v1.18/v1.19/MATCH_KERNEL" as const,
    samplingMilliseconds: 200 as const,
    partialAcceptedEvidenceReusable: false as const,
    privacyProjection: Object.freeze({
      strategySourceIncluded: false as const,
      strategyMemoryIncluded: false as const,
      soldierMemoryIncluded: false as const,
      objectivePayloadIncluded: false as const,
      rawDiagnosticsIncluded: false as const,
    }),
    phase263PlanningAuthorized: false as const,
    candidateSearchAuthorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    productAuthorized: false as const,
    productionAuthorized: false as const,
  }
  return Object.freeze({
    ...body,
    receiptRoot: sha256(
      `v138-current-matrix-reproduction-v17\0${canonical(body)}`,
    ),
  })
}

export const createV138V3ProductionControllerEffects = (
  repoRoot: string,
  appendDurableRecord: (record: V138RetryV3JournalRecord) => void,
): V138BoundedRetryV3ControllerEffects => {
  let admittedCalibrationRoot: V138RetrySha256 | undefined
  return {
    monotonicMilliseconds: () => Number(process.hrtime.bigint() / 1_000_000n),
    waitUntil: async (target) => {
      const remaining = Math.max(
        0,
        target - Number(process.hrtime.bigint() / 1_000_000n),
      )
      await new Promise<void>((resolve) => setTimeout(resolve, remaining))
    },
    observePreflight: async () => {
      const result = await observeDarwinHeadroomOwned(executeMemoryPressure)
      return result.ok
        ? {
            available: true as const,
            effectiveAvailableBasisPoints:
              result.observation.observedBasisPoints,
          }
        : { available: false as const }
    },
    runCalibration: async () => {
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const receipt = await calibrateV138ParallelMatrix({
        inventory,
        runner: createV138SubprocessShardRunner(repoRoot, {
          useLegacyHostMemory: false,
        }),
        hardwareIdentity: {
          operatingSystem: `${platform()} ${release()}`,
          architecture: arch(),
          nodeVersion: process.version,
          cpuIdentity: cpus()[0]?.model ?? "unavailable",
        },
        sharedHeadroomObserver: () =>
          observeDarwinHeadroomOwned(executeMemoryPressure),
        repoRoot,
      })
      admittedCalibrationRoot =
        receipt.status === "admitted" ? receipt.calibrationRoot : undefined
      return {
        status:
          receipt.status === "admitted"
            ? ("admitted" as const)
            : ("system_failure" as const),
        completeCleanup: receipt.terminals.every(
          ({ cleanup }) =>
            cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
        ),
        supervisionRoot: receipt.calibrationRoot,
      }
    },
    runReproduction: async () => {
      if (admittedCalibrationRoot === undefined) {
        fail("V138_RETRY_ADMITTED_CALIBRATION_REQUIRED")
      }
      const inventory = enumerateV138CurrentMatrix(repoRoot)
      const result = await executeV138ParallelMatrix({
        inventory,
        admittedCalibrationRoot,
        runner: createV138SubprocessShardRunner(repoRoot, {
          useLegacyHostMemory: false,
        }),
        sharedHeadroomObserver: () =>
          observeDarwinHeadroomOwned(executeMemoryPressure),
        repoRoot,
      })
      const artifact = buildV138ReproductionV17({
        execution: result,
        admittedCalibrationRoot,
      })
      const passed = artifact.status === "passed_exact"
      return {
        status: passed
          ? ("passed_exact" as const)
          : ("system_failure" as const),
        acceptedCells: passed ? 540 : 0,
        completeCleanup: result.terminals.every(
          ({ cleanup }) =>
            cleanup.exitAwaited && cleanup.orphanProcessIds.length === 0,
        ),
        reproductionRoot: artifact.receiptRoot as V138RetrySha256,
        artifact,
      }
    },
    appendDurableRecord,
  }
}

const readJournal = (repoRoot: string): readonly V138RetryV3JournalRecord[] => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.journal)
  if (safeStatus(target) === "missing") return []
  const text = readNoFollow(
    repoRoot,
    V138_BOUNDED_RETRY_V3_PATHS.journal,
  ).toString("utf8")
  if (text.length === 0 || !text.endsWith("\n")) {
    fail("V138_RETRY_JOURNAL_INVALID")
  }
  try {
    return text
      .trimEnd()
      .split("\n")
      .map((line) => JSON.parse(line))
  } catch {
    return fail("V138_RETRY_JOURNAL_INVALID")
  }
}

const journalAppender = (
  repoRoot: string,
  privateTarget: string,
): ((record: V138RetryV3JournalRecord) => void) => {
  const target = path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.journal)
  if (safeStatus(target) === "missing") {
    publishV138RetryV3NativePair(repoRoot, {
      transactionId: "v3-journal-bootstrap",
      intentPath: ".planning/artifacts/v1.38-v3-journal-bootstrap.intent",
      members: [
        { target: V138_BOUNDED_RETRY_V3_PATHS.journal, bytes: "" },
        {
          target: `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/journal-bootstrap.commit`,
          bytes: "committed\n",
        },
      ],
    })
  }
  if (safeStatus(target) !== "regular") fail("V138_RETRY_JOURNAL_UNSAFE")
  return (record) => {
    const before = readFileSync(target, "utf8")
    const receiptRelative = `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/journal-record-${String(record.ordinal).padStart(4, "0")}.json`
    applyV138RetryV3NativeLifecycle(repoRoot, {
      transactionId: `v3-journal-${String(record.ordinal).padStart(4, "0")}`,
      intentPath: `.planning/artifacts/v1.38-v3-journal-${String(record.ordinal).padStart(4, "0")}.intent`,
      steps: [
        {
          id: `journal-${record.ordinal}`,
          target: V138_BOUNDED_RETRY_V3_PATHS.journal,
          beforeSha256: sha256(before),
          afterBytes: `${before}${canonical(record)}`,
        },
      ],
      lifecycle: { target: receiptRelative, bytes: canonical(record) },
    })
    if (!path.resolve(repoRoot, receiptRelative).startsWith(`${privateTarget}${path.sep}`))
      fail("V138_RETRY_PRIVATE_RECEIPT_INVALID")
  }
}

type V138RetryV3CrashBoundary =
  | "lock_acquired"
  | "journal_fsync"
  | "receipt_fsync"
  | "reproduction_write"
  | "reproduction_fsync"
  | "terminal_write"
  | "terminal_fsync"

export const acquireV138RetryV3OwnerLease = async (
  retainedRoot: string,
): Promise<
  Readonly<{
    pid: number
    waitForExit: () => Promise<number | null>
    release: () => Promise<void>
  }>
> => acquireV138RetryV3NativeOwnerLease(retainedRoot)

export const reconcileV138RetryV3PrivateReceipts = (
  repoRoot: string,
  privateTarget: string,
  records: readonly V138RetryV3JournalRecord[],
): number => {
  let restored = 0
  for (const record of records) {
    const receipt = path.join(
      privateTarget,
      `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
    )
    const expected = canonical(record)
    const status = safeStatus(receipt)
    if (status === "missing") {
      publishV138RetryV3NativePair(repoRoot, {
        transactionId: `v3-receipt-reconcile-${String(record.ordinal).padStart(4, "0")}`,
        intentPath: `.planning/artifacts/v1.38-v3-receipt-reconcile-${String(record.ordinal).padStart(4, "0")}.intent`,
        members: [
          {
            target: `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
            bytes: expected,
          },
          {
            target: `${V138_BOUNDED_RETRY_V3_PATHS.privateDir}/journal-record-${String(record.ordinal).padStart(4, "0")}.reconciled`,
            bytes: "reconciled\n",
          },
        ],
      })
      restored += 1
    } else if (
      status !== "regular" ||
      (statSync(receipt).mode & 0o777) !== 0o600 ||
      readFileSync(receipt, "utf8") !== expected
    ) {
      fail("V138_RETRY_PRIVATE_RECEIPT_INVALID")
    }
  }
  return restored
}

export const checkV138PublishedRetryV3Outcome = (
  repoRoot: string,
): Readonly<{
  disposition: V138DerivedRetryV3State["disposition"]
  journalRoot: V138RetrySha256
  stateRoot: V138RetrySha256
  completeCleanup: boolean
  reproductionPresent: boolean
  downstreamAuthority: "denied"
}> => {
  const { envelope } = checkPublishedPair(repoRoot)
  const records = readJournal(repoRoot)
  const state = deriveV138RetryV3State(envelope, records)
  if (state.disposition === "active") fail("V138_RETRY_TERMINAL_STATE_REQUIRED")
  const privateTarget = path.resolve(
    repoRoot,
    V138_BOUNDED_RETRY_V3_PATHS.privateDir,
  )
  if (
    safeStatus(privateTarget) !== "directory" ||
    (statSync(privateTarget).mode & 0o777) !== 0o700
  )
    fail("V138_RETRY_PRIVATE_DIR_UNSAFE")
  for (const record of records) {
    const receiptPath = path.join(
      privateTarget,
      `journal-record-${String(record.ordinal).padStart(4, "0")}.json`,
    )
    if (
      safeStatus(receiptPath) !== "regular" ||
      (statSync(receiptPath).mode & 0o777) !== 0o600 ||
      readFileSync(receiptPath, "utf8") !== canonical(record)
    )
      fail("V138_RETRY_PRIVATE_RECEIPT_INVALID")
  }
  const terminal = readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.terminal)
  if (
    canonical(terminal) !==
    canonical(v138RetryTerminalResult({ records, state }))
  )
    fail("V138_RETRY_TERMINAL_INVALID")
  const reproductionStatus = safeStatus(
    path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
  )
  if (
    (state.disposition === "succeeded") !==
    (reproductionStatus === "regular")
  )
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  if (reproductionStatus === "regular") {
    validateSuccessArtifact(
      { records, state },
      readJsonNoFollow(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
    )
  } else if (reproductionStatus !== "missing") {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }
  return Object.freeze({
    disposition: state.disposition,
    journalRoot: state.journalRoot,
    stateRoot: state.stateRoot,
    completeCleanup: state.completeCleanup,
    reproductionPresent: reproductionStatus === "regular",
    downstreamAuthority: "denied" as const,
  })
}

export const requireV138RetryV3ReproductionAbsent = (repoRoot: string): true => {
  try {
    requireV138RetryV3DestinationAbsent(
      repoRoot,
      V138_BOUNDED_RETRY_V3_PATHS.reproduction,
    )
  } catch {
    fail("V138_RETRY_REPRODUCTION_ARTIFACT_INVALID")
  }
  return true
}

export interface V138RetryV3ProductionOptions {
  readonly checkPair?: () => Readonly<V138DerivedV3SealEnvelope>
  readonly createEffects?: (
    append: (record: V138RetryV3JournalRecord) => void,
  ) => V138BoundedRetryV3ControllerEffects
  readonly crashBoundary?: (stage: V138RetryV3CrashBoundary) => void
  readonly validateInputs?: boolean
}

export const runV138V3ProductionLive = async (
  repoRoot: string,
  options: V138RetryV3ProductionOptions = {},
): Promise<void> => {
  const executionBefore =
    options.validateInputs === false
      ? undefined
      : authenticateReviewedExecutionClosure(repoRoot)
  const recheckExecution = (): void => {
    if (executionBefore !== undefined)
      authenticateV138RetryV3ExecutionClosure(repoRoot, {
        sourceCommit: executionBefore.sourceCommit,
        checkoutPaths: V138_RETRY_V3_EXECUTED_SOURCE_PATHS,
        executionClosureRoot: executionBefore.executionClosureRoot,
      })
  }
  const { envelope } = options.checkPair?.() ?? checkPublishedPair(repoRoot)
  for (const repoPath of [
    V138_BOUNDED_RETRY_V3_PATHS.journal,
    `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
    V138_BOUNDED_RETRY_V3_PATHS.terminal,
    V138_BOUNDED_RETRY_V3_PATHS.privateDir,
    V138_BOUNDED_RETRY_V3_PATHS.reproduction,
  ]) containedRepoTarget(repoRoot, repoPath)
  if (options.validateInputs !== false)
    for (const repoPath of [
      V138_BOUNDED_RETRY_V3_PATHS.sourceSummary,
      V138_BOUNDED_RETRY_V3_PATHS.sourceController,
      V138_BOUNDED_RETRY_V3_PATHS.sourceModel,
      V138_BOUNDED_RETRY_V3_PATHS.sourceTests,
      V138_BOUNDED_RETRY_V3_PATHS.sourceReview,
      V138_BOUNDED_RETRY_V3_PATHS.sourceReviewReport,
      V138_BOUNDED_RETRY_V3_PATHS.seal,
      V138_BOUNDED_RETRY_V3_PATHS.envelope,
      V138_BOUNDED_RETRY_V3_PATHS.localSeal,
      V138_BOUNDED_RETRY_V3_PATHS.protectedHistoryCorrection,
      V138_BOUNDED_RETRY_V3_PATHS.historicalReceiptManifest,
      V138_BOUNDED_RETRY_V3_PATHS.historicalEnvelope,
      V138_BOUNDED_RETRY_V3_PATHS.historicalJournal,
      V138_BOUNDED_RETRY_V3_PATHS.historicalTerminal,
      V138_BOUNDED_RETRY_V3_PATHS.historicalSeal,
      V138_BOUNDED_RETRY_V3_PATHS.historicalDisposition,
      V138_BOUNDED_RETRY_V3_PATHS.historicalLifecycle,
    ])
      readNoFollow(repoRoot, repoPath)
  const terminalTarget = path.resolve(
    repoRoot,
    V138_BOUNDED_RETRY_V3_PATHS.terminal,
  )
  const terminalStatus = safeStatus(terminalTarget)
  if (terminalStatus === "unsafe" || terminalStatus === "directory") {
    fail("V138_RETRY_DESTINATION_UNSAFE")
  }
  if (terminalStatus === "regular") {
    const ownership = await acquireV138RetryV3OwnerLease(repoRoot)
    try {
      const terminal = readJsonNoFollow(
        repoRoot,
        V138_BOUNDED_RETRY_V3_PATHS.terminal,
      ) as Record<string, unknown>
      const records = readJournal(repoRoot)
      const state = deriveV138RetryV3State(envelope, records)
      const expectedTerminal = v138RetryTerminalResult({ records, state })
      const reproductionStatus = safeStatus(
        path.resolve(repoRoot, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
      )
      if (
        canonical(terminal) !== canonical(expectedTerminal) ||
        state.disposition === "active" ||
        (state.disposition === "succeeded") !==
          (reproductionStatus === "regular") ||
        reproductionStatus === "unsafe" ||
        reproductionStatus === "directory"
      ) {
        fail("V138_RETRY_DUPLICATE_INVOCATION_INVALID")
      }
    } finally {
      await ownership.release()
    }
    recheckExecution()
    return
  }
  const ownership = await acquireV138RetryV3OwnerLease(repoRoot)
  try {
    options.crashBoundary?.("lock_acquired")
    const privateTarget = path.resolve(
      repoRoot,
      V138_BOUNDED_RETRY_V3_PATHS.privateDir,
    )
    if (safeStatus(privateTarget) === "missing")
      mkdirSync(privateTarget, { mode: 0o700 })
    if (
      safeStatus(privateTarget) !== "directory" ||
      (statSync(privateTarget).mode & 0o777) !== 0o700
    ) {
      fail("V138_RETRY_PRIVATE_DIR_UNSAFE")
    }
    const existing = readJournal(repoRoot)
    reconcileV138RetryV3PrivateReceipts(repoRoot, privateTarget, existing)
    const existingState = deriveV138RetryV3State(envelope, existing)
    const reproductionTarget = path.resolve(
      repoRoot,
      V138_BOUNDED_RETRY_V3_PATHS.reproduction,
    )
    if (safeStatus(reproductionTarget) === "regular") {
      publishV138RetryV3Outcome({
        repoRoot,
        terminalTarget,
        reproductionTarget,
        result: { records: existing, state: existingState },
      })
      recheckExecution()
      return
    }
    if (safeStatus(reproductionTarget) !== "missing")
      fail("V138_RETRY_DESTINATION_UNSAFE")
    const appendJournal = journalAppender(repoRoot, privateTarget)
    const append = (record: V138RetryV3JournalRecord): void => {
      appendJournal(record)
      options.crashBoundary?.("journal_fsync")
      options.crashBoundary?.("receipt_fsync")
    }
    const result = await runV138BoundedRetryV3Controller({
      envelope,
      owner: "repository_operator",
      records: existing,
      effects:
        options.createEffects?.(append) ??
        createV138V3ProductionControllerEffects(repoRoot, append),
    })
    publishV138RetryV3Outcome({
      repoRoot,
      terminalTarget,
      reproductionTarget,
      result,
      hooks: {
        afterReproductionWrite: () =>
          options.crashBoundary?.("reproduction_write"),
        afterReproductionParentFsync: () =>
          options.crashBoundary?.("reproduction_fsync"),
        afterTerminalWrite: () => options.crashBoundary?.("terminal_write"),
        afterTerminalParentFsync: () =>
          options.crashBoundary?.("terminal_fsync"),
      },
    })
    recheckExecution()
  } finally {
    await ownership.release()
  }
}

export interface V138BoundedRetryV3CliDependencies {
  readonly repoRoot: string
  readonly deriveArtifacts: () => Readonly<V138DerivedV3SealEnvelope>
  readonly publishArtifacts: (
    artifacts: Readonly<V138DerivedV3SealEnvelope>,
  ) => void
  readonly checkPair: () => void
  readonly runLive: () => Promise<void>
  readonly checkOutcome: () => ReturnType<typeof checkV138PublishedRetryV3Outcome>
  readonly authenticateClosure: () => V138RetryV3ExecutionClosure
}

export const executeV138BoundedRetryV3Cli = async (
  argv: readonly string[],
  injected?: Partial<V138BoundedRetryV3CliDependencies>,
): Promise<void> => {
  const repoRoot =
    injected?.repoRoot ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const deriveArtifacts =
    injected?.deriveArtifacts ??
    (() => deriveV138V3SealedInactiveEnvelope(repoRoot))
  const publishArtifacts =
    injected?.publishArtifacts ??
    ((artifacts: Readonly<V138DerivedV3SealEnvelope>) =>
      publishPair(repoRoot, artifacts))
  const checkPair =
    injected?.checkPair ??
    (() =>
      checkPublishedPair(
        repoRoot,
        injected?.deriveArtifacts === undefined ? undefined : deriveArtifacts,
      ))
  const runLive = injected?.runLive ?? (() => runV138V3ProductionLive(repoRoot))
  const checkOutcome =
    injected?.checkOutcome ?? (() => checkV138PublishedRetryV3Outcome(repoRoot))
  const authenticateClosure =
    injected?.authenticateClosure ??
    (() => authenticateCurrentExecutionClosure(repoRoot))
  const authenticateAuthorityClosure =
    injected?.authenticateClosure ??
    (() => authenticateReviewedExecutionClosure(repoRoot))
  const withUnchangedExecutionClosure = async <T>(
    action: () => T | Promise<T>,
  ): Promise<T> => {
    const before = authenticateAuthorityClosure()
    const result = await action()
    const after = authenticateAuthorityClosure()
    if (after.executionClosureRoot !== before.executionClosureRoot)
      fail("V138_RETRY_V3_EXECUTION_CLOSURE_CHANGED")
    return result
  }
  const command = argv[0]
  const rest = argv.slice(1)
  if (command === "--check-source-only" && rest.length === 0) {
    const executionBefore = authenticateClosure()
    if (
      V138_BOUNDED_RETRY_V3_POLICY.samplingMilliseconds !== 200 ||
      V138_BOUNDED_RETRY_V3_POLICY.minimumEffectiveAvailableBasisPoints !== 2500 ||
      V138_BOUNDED_RETRY_V3_IDENTITIES.routes.length !== 3 ||
      V138_BOUNDED_RETRY_V3_IDENTITIES.preflights.length !== 12 ||
      V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.length !== 24 ||
      V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction.length !== 540
    ) {
      fail("V138_RETRY_SOURCE_INVALID")
    }
    checkV138ProtectedHistoryV3(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY)
    requireExactV3Lineage(repoRoot)
    requireProtectedV1Bytes(repoRoot)
    for (const repoPath of [
      V138_BOUNDED_RETRY_V3_PATHS.seal,
      V138_BOUNDED_RETRY_V3_PATHS.envelope,
      V138_BOUNDED_RETRY_V3_PATHS.journal,
      `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
      V138_BOUNDED_RETRY_V3_PATHS.terminal,
      V138_BOUNDED_RETRY_V3_PATHS.privateDir,
      V138_BOUNDED_RETRY_V3_PATHS.reproduction,
      V138_BOUNDED_RETRY_V3_PATHS.receiptManifest,
      V138_BOUNDED_RETRY_V3_PATHS.disposition,
      V138_BOUNDED_RETRY_V3_PATHS.correction,
      V138_BOUNDED_RETRY_V3_PATHS.activation,
      V138_BOUNDED_RETRY_V3_PATHS.readiness,
      V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
    ]) {
      try {
        requireV138RetryV3DestinationAbsent(repoRoot, repoPath)
      } catch {
        fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
      }
    }
    const executionAfter = authenticateClosure()
    if (
      executionAfter.executionClosureRoot !==
      executionBefore.executionClosureRoot
    )
      fail("V138_RETRY_V3_EXECUTION_CLOSURE_CHANGED")
    process.stdout.write(
      `${JSON.stringify({
        status: "passed",
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
        phase263Authorized: false,
        candidateSearchAuthorized: false,
        formationMaterializationAuthorized: false,
        holdoutOpeningAuthorized: false,
        publicAuthorized: false,
        productAuthorized: false,
        productionAuthorized: false,
        gameplayChangeAuthorized: false,
        downstreamAuthority: "denied",
      })}\n`,
    )
    return
  }
  if (command === "--derive-seal-envelope-no-publish" && rest.length === 0) {
    const artifacts = await withUnchangedExecutionClosure(deriveArtifacts)
    process.stdout.write(
      `${JSON.stringify({
        sealRoot: artifacts.seal.sealRoot,
        envelopeRoot: artifacts.envelope.envelopeRoot,
        status: "sealed_inactive_not_published",
        freshCharged: 0,
        freshAccepted: 0,
        downstreamAuthority: "denied",
      })}\n`,
    )
    return
  }
  if (command === "--publish-sealed-inactive-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    await withUnchangedExecutionClosure(() =>
      publishArtifacts(deriveArtifacts()),
    )
    return
  }
  if (command === "--check-sealed-inactive-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    await withUnchangedExecutionClosure(() => {
      checkPair()
      for (const repoPath of [
        V138_BOUNDED_RETRY_V3_PATHS.journal,
        V138_BOUNDED_RETRY_V3_PATHS.terminal,
        V138_BOUNDED_RETRY_V3_PATHS.privateDir,
        V138_BOUNDED_RETRY_V3_PATHS.reproduction,
      ]) {
        try {
          requireV138RetryV3DestinationAbsent(repoRoot, repoPath)
        } catch {
          fail("V138_RETRY_LIVE_DESTINATION_PRESENT")
        }
      }
    })
    return
  }
  if (command === "--run-bounded-live-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    await withUnchangedExecutionClosure(runLive)
    return
  }
  if (command === "--check-live-transition") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    const checked = await withUnchangedExecutionClosure(checkOutcome)
    process.stdout.write(`${JSON.stringify(checked)}\n`)
    return
  }
  if (command === "--check-terminal-envelope") {
    if (rest.length !== 0) fail("V138_RETRY_ARGUMENTS_INVALID")
    const checked = await withUnchangedExecutionClosure(checkOutcome)
    process.stdout.write(`${JSON.stringify(checked)}\n`)
    return
  }
  fail("V138_RETRY_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  executeV138BoundedRetryV3Cli(process.argv.slice(2)).catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "V138_RETRY_FAILED"}\n`,
    )
    process.exitCode = 1
  })
}
