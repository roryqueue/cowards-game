import { createHash } from "node:crypto"
import { closeSync, constants, existsSync, fstatSync, lstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
  checkV138PublishedRetryV3Outcome,
  runV138V3ProductionLive,
  type V138DerivedV3SealEnvelope,
  type V138SuccessorSourceSealV13,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
import {
  checkV138InactiveRetryV3Envelope,
  encodeV138RetryV3CanonicalJson,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import {
  checkV138PathStableCustodyForReview,
  deriveV138PathStableCustody,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"
import {
  V138_LIVE_V9_PROTECTED_BRANCHES,
  checkV138LiveV9PostRunOutputCustodyForReview,
  checkV138LiveV9ReproductionV17ForReview,
  computeV138LiveV9ReproductionV17ReceiptRoot,
  settleV138LiveV9ProducerOutcomeForReview,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v9.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const CORRECTED_PUBLICATION_COMMIT = "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const PLAN_111_SOURCE_COMMIT = "a301a06df0e4a3c038cf630f3485f8fb3a879c42"
const PLAN_112_V1_PUBLICATION_COMMIT = "29d4cf5c942d63fd767f658ec2506a5764ff19fa"
const PLAN_112_V2_PUBLICATION_COMMIT = "5b5ec60154bb82a3cfa3b25a03f8a2379010c829"
const PLAN_93_STOP_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const PLAN_93_STOP_SHA256 = "sha256:ef19330651725dfcaf5a1de35435a27d4f270f54428b5f57e063ee58f041f1a3"
const CORRECTED_ROOTS = Object.freeze({
  payload: "sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2",
  review: "sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db",
  carrier: "sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5",
})
const PLAN_112_V1_ROOTS = Object.freeze({
  payload: "sha256:abf5255241780c0774991fb3fbb282806475deb80c9d59d35f6669fa61fb3292",
  review: "sha256:7b2cc0f32be4d50ca0b5a7207f08a1c7d6bea9646731d84e07434d082d82b63c",
  carrier: "sha256:21af5983c3e64c01cfb62f6cf2e3404b6d3783914441bdd4c2f51bb490e9111e",
})
const PLAN_112_V2_ROOTS = Object.freeze({
  payload: "sha256:558d329e537dc4673dcaf216ce68faf651dfbbf1ce19536d54cacc3d76b9e194",
  review: "sha256:8aca84cbb80b000dd5cdeb1735367dd7cc51eb858a0ce2960c4ac33e849dc0e9",
  carrier: "sha256:06417e5f8b44a28e88bd20e746fa2319235250d687190ab1fa7a49f485d3a355",
})
const PLAN_112_V2_FINDINGS = Object.freeze([
  "MODE_POST_NO_EFFECT_FAILED",
  "MODE_PROSPECTIVE_CUSTODY_FAILED",
  "MODE_SOURCE_ONLY_FAILED",
])
const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
})
const PRODUCER_OUTPUTS = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.journal,
  `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
  V138_BOUNDED_RETRY_V3_PATHS.privateDir,
  V138_BOUNDED_RETRY_V3_PATHS.terminal,
  V138_BOUNDED_RETRY_V3_PATHS.reproduction,
])
const DOWNSTREAM_OUTPUTS = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.receiptManifest,
  V138_BOUNDED_RETRY_V3_PATHS.disposition,
  V138_BOUNDED_RETRY_V3_PATHS.correction,
  V138_BOUNDED_RETRY_V3_PATHS.activation,
  V138_BOUNDED_RETRY_V3_PATHS.readiness,
  V138_BOUNDED_RETRY_V3_PATHS.lifecycle,
])

export const V138_LIVE_V10_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.test.ts",
  correctedPayload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  correctedReview: `${PHASE_DIR}/262-108-REVIEW-FIX.md`,
  correctedCarrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
  plan112V1Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json",
  plan112V1Review: `${PHASE_DIR}/262-112-REVIEW.md`,
  plan112V1Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json",
  plan112V2Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v2.json",
  plan112V2Review: `${PHASE_DIR}/262-112-REVIEW-FIX.md`,
  plan112V2Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v2.json",
  plan93Stop: `${PHASE_DIR}/262-93-PRESTART-INTEGRITY-STOP.md`,
  plan114Payload: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json",
  plan114Review: `${PHASE_DIR}/262-114-REVIEW.md`,
  plan114Carrier: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json",
  supplementV1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplementV2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
  supplementV3: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
})

export const V138_LIVE_V10_MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-reviewed-live-ready",
  "--run-reviewed-bounded-live-envelope",
] as const)

const PLAN_111_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
] as const)
export const V138_LIVE_V10_REVIEWED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  V138_LIVE_V10_PATHS.source,
] as const)

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = encodeV138RetryV3CanonicalJson
const sha256 = (domain: string, value: unknown): Sha =>
  `sha256:${createHash("sha256").update(`${domain}\0${canonical(value)}`).digest("hex")}`
const bytesSha256 = (bytes: Buffer): Sha =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const target = (root: string, repoPath: string): string => {
  const resolved = path.resolve(root, repoPath)
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) fail("V138_LIVE_V10_PATH_INVALID")
  return resolved
}
const exactKeys = (value: Json, keys: readonly string[], code: string): void => {
  if (canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code)
}
const readRegularNoFollow = (root: string, repoPath: string, maximumBytes = 16 * 1024 * 1024): Buffer => {
  const absolute = target(root, repoPath)
  const before = lstatSync(absolute)
  if (!before.isFile() || before.isSymbolicLink() || before.size > maximumBytes)
    fail(`V138_LIVE_V10_FILE_UNSAFE:${repoPath}`)
  const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino ||
        opened.size !== before.size || opened.size > maximumBytes)
      fail(`V138_LIVE_V10_FILE_CHANGED:${repoPath}`)
    return readFileSync(fd)
  } finally { closeSync(fd) }
}
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["show", `${commit}:${repoPath}`])
const jsonAt = (root: string, commit: string, repoPath: string): Json => {
  const bytes = gitBytes(root, commit, repoPath)
  const parsed = JSON.parse(bytes.toString("utf8")) as Json
  if (!bytes.equals(Buffer.from(canonical(parsed)))) fail(`V138_LIVE_V10_NONCANONICAL:${repoPath}`)
  return parsed
}
const assertAncestor = (root: string, commit: string): void => {
  const result = runV138RetryV3IsolatedGit(root, ["merge-base", "--is-ancestor", commit, "HEAD"], true)
  if (result !== "") fail("V138_LIVE_V10_HISTORY_INVALID")
}
const assertExactAddPublication = (
  root: string,
  commit: string,
  repoPaths: readonly string[],
): void => {
  assertAncestor(root, commit)
  const actual = runV138RetryV3IsolatedGit(root, [
    "diff-tree", "--no-commit-id", "--name-status", "-r", commit,
  ]).split("\n").filter(Boolean).sort()
  const expected = repoPaths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_LIVE_V10_PUBLICATION_SCOPE_INVALID")
  for (const repoPath of repoPaths) {
    const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", commit, "--", repoPath])
    if (!entry.startsWith("100644 blob ")) fail("V138_LIVE_V10_PUBLICATION_MODE_INVALID")
    const current = readRegularNoFollow(root, repoPath)
    if (!current.equals(gitBytes(root, commit, repoPath))) fail("V138_LIVE_V10_HISTORY_REWRITTEN")
  }
  if (runV138RetryV3IsolatedGit(root, [
    "log", "--format=%H", `${commit}..HEAD`, "--", ...repoPaths,
  ]) !== "") fail("V138_LIVE_V10_SUCCESSOR_REWRITE")
}

const inspectProtectedHistory = (root: string): Sha => {
  const records: string[] = []
  const paths = new Set<string>()
  for (const branch of V138_LIVE_V9_PROTECTED_BRANCHES) {
    if (runV138RetryV3IsolatedGit(root, [
      "merge-base", "--is-ancestor", branch.lineageCommit, PAIR_COMMIT,
    ], true) !== "") fail("V138_LIVE_V10_PROTECTED_LINEAGE_INVALID")
    for (const repoPath of branch.paths) {
      const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", PAIR_COMMIT, "--", repoPath])
      const match = /^(100644|100755|120000) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
      if (match === null || match[3] !== repoPath)
        fail("V138_LIVE_V10_PROTECTED_ENTRY_INVALID")
      paths.add(repoPath)
      records.push(`${branch.plan}\0${branch.lineageCommit}\0${match[1]}\0${repoPath}\0${match[2]}`)
    }
  }
  if (runV138RetryV3IsolatedGit(root, [
    "log", "--format=%H", `${PAIR_COMMIT}..HEAD`, "--", ...[...paths].sort(),
  ]) !== "") fail("V138_LIVE_V10_PROTECTED_SUCCESSOR_REWRITE")
  return sha256("v138-plan-262-108-independent-protected-history-v1", records.sort().join("\n"))
}

const assertImmutableHistory = (root: string): void => {
  const corrected = [V138_LIVE_V10_PATHS.correctedPayload, V138_LIVE_V10_PATHS.correctedReview, V138_LIVE_V10_PATHS.correctedCarrier]
  const plan112V1 = [V138_LIVE_V10_PATHS.plan112V1Payload, V138_LIVE_V10_PATHS.plan112V1Review, V138_LIVE_V10_PATHS.plan112V1Carrier]
  const plan112V2 = [V138_LIVE_V10_PATHS.plan112V2Payload, V138_LIVE_V10_PATHS.plan112V2Review, V138_LIVE_V10_PATHS.plan112V2Carrier]
  assertExactAddPublication(root, CORRECTED_PUBLICATION_COMMIT, corrected)
  assertExactAddPublication(root, PLAN_112_V1_PUBLICATION_COMMIT, plan112V1)
  assertExactAddPublication(root, PLAN_112_V2_PUBLICATION_COMMIT, plan112V2)
  const correctedPayload = jsonAt(root, CORRECTED_PUBLICATION_COMMIT, corrected[0]!)
  const correctedCarrier = jsonAt(root, CORRECTED_PUBLICATION_COMMIT, corrected[2]!)
  const v1Payload = jsonAt(root, PLAN_112_V1_PUBLICATION_COMMIT, plan112V1[0]!)
  const v1Carrier = jsonAt(root, PLAN_112_V1_PUBLICATION_COMMIT, plan112V1[2]!)
  const v2Payload = jsonAt(root, PLAN_112_V2_PUBLICATION_COMMIT, plan112V2[0]!)
  const v2Carrier = jsonAt(root, PLAN_112_V2_PUBLICATION_COMMIT, plan112V2[2]!)
  if (
    correctedPayload.payloadRoot !== CORRECTED_ROOTS.payload || correctedCarrier.reviewRoot !== CORRECTED_ROOTS.review || correctedCarrier.carrierRoot !== CORRECTED_ROOTS.carrier ||
    v1Payload.payloadRoot !== PLAN_112_V1_ROOTS.payload || v1Carrier.reviewRoot !== PLAN_112_V1_ROOTS.review || v1Carrier.carrierRoot !== PLAN_112_V1_ROOTS.carrier ||
    v2Payload.payloadRoot !== PLAN_112_V2_ROOTS.payload || v2Carrier.reviewRoot !== PLAN_112_V2_ROOTS.review || v2Carrier.carrierRoot !== PLAN_112_V2_ROOTS.carrier ||
    v2Payload.supersedesPublicationCommit !== PLAN_112_V1_PUBLICATION_COMMIT || v2Payload.reviewStatus !== "blocked" ||
    v2Payload.findingCount !== 3 || canonical(v2Payload.findingCodes) !== canonical(PLAN_112_V2_FINDINGS) ||
    v2Payload.plan109Eligible !== false || v2Payload.liveInvoked !== false || v2Payload.producerCalls !== 0 ||
    v2Payload.authorizesExecution !== false || v2Payload.downstreamAuthority !== "denied"
  ) fail("V138_LIVE_V10_IMMUTABLE_HISTORY_INVALID")
}

const assertPairAndStop = (root: string): Readonly<V138DerivedV3SealEnvelope> => {
  assertExactAddPublication(root, PAIR_COMMIT, [V138_BOUNDED_RETRY_V3_PATHS.envelope, V138_BOUNDED_RETRY_V3_PATHS.seal])
  const seal = jsonAt(root, PAIR_COMMIT, V138_BOUNDED_RETRY_V3_PATHS.seal)
  const envelope = jsonAt(root, PAIR_COMMIT, V138_BOUNDED_RETRY_V3_PATHS.envelope)
  exactKeys(seal, [
    "assuranceClass", "directChild", "directParentCommit", "downstreamAuthority",
    "localSealVerificationRoot", "productionAuthorized", "protectedHistoryRoot",
    "researchCommit", "reviewCommit", "reviewRoot", "schemaVersion", "sealRoot",
    "sourceBaseCommit", "sourceCommit", "sourceRoot", "sourceTree",
  ], "V138_LIVE_V10_SEAL_KEYS_INVALID")
  const { sealRoot: storedSealRoot, ...sealBody } = seal
  if (sha256("v138-successor-source-seal-v13", sealBody) !== storedSealRoot)
    fail("V138_LIVE_V10_SEAL_ROOT_INVALID")
  const checkedEnvelope = checkV138InactiveRetryV3Envelope(envelope)
  assertAncestor(root, PLAN_93_STOP_COMMIT)
  const plan93Bytes = gitBytes(root, PLAN_93_STOP_COMMIT, V138_LIVE_V10_PATHS.plan93Stop)
  const plan93Text = plan93Bytes.toString("utf8")
  const currentPlan93 = readFileSync(target(root, V138_LIVE_V10_PATHS.plan93Stop))
  if (
    !currentPlan93.equals(plan93Bytes) ||
    runV138RetryV3IsolatedGit(root, [
      "log", "--format=%H", `${PLAN_93_STOP_COMMIT}..HEAD`, "--", V138_LIVE_V10_PATHS.plan93Stop,
    ]) !== "" ||
    [
      "status: pre_start_integrity_stop",
      "Live effect boundary crossed: `false`",
      "Route starts: `0/3`",
      "Fresh accepted: `0/540`",
      "Plan 93 is not complete",
    ].some((text) => !plan93Text.includes(text))
  ) fail("V138_LIVE_V10_PLAN_93_CUSTODY_INVALID")
  const expandedProtectedHistoryRoot = inspectProtectedHistory(root)
  if (
    seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied" ||
    envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
    envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
    canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
    envelope.policy.candidateSearchAuthorized !== false || envelope.policy.formationMaterializationAuthorized !== false ||
    envelope.policy.holdoutOpeningAuthorized !== false || envelope.policy.phase263PlanningAuthorized !== false ||
    envelope.policy.publicAuthorized !== false || envelope.policy.productAuthorized !== false ||
    envelope.policy.productionAuthorized !== false || envelope.policy.gameplayChangeAuthorized !== false ||
    bytesSha256(plan93Bytes) !== PLAN_93_STOP_SHA256 ||
    !/^sha256:[0-9a-f]{64}$/u.test(expandedProtectedHistoryRoot)
  ) fail("V138_LIVE_V10_PAIR_OR_STOP_INVALID")
  const checkedSeal: Readonly<V138SuccessorSourceSealV13> = Object.freeze({
    schemaVersion: seal.schemaVersion,
    sourceBaseCommit: seal.sourceBaseCommit,
    researchCommit: seal.researchCommit,
    sourceCommit: seal.sourceCommit,
    sourceTree: seal.sourceTree,
    directParentCommit: seal.directParentCommit,
    sourceRoot: seal.sourceRoot,
    reviewRoot: seal.reviewRoot,
    reviewCommit: seal.reviewCommit,
    localSealVerificationRoot: seal.localSealVerificationRoot,
    protectedHistoryRoot: seal.protectedHistoryRoot,
    directChild: seal.directChild,
    assuranceClass: seal.assuranceClass,
    productionAuthorized: seal.productionAuthorized,
    downstreamAuthority: seal.downstreamAuthority,
    sealRoot: seal.sealRoot,
  })
  return Object.freeze({ seal: checkedSeal, envelope: checkedEnvelope })
}

const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (existsSync(target(root, repoPath)))
    fail(`V138_LIVE_V10_FORBIDDEN_DESTINATION_PRESENT:${repoPath}`)
}

export type V138LiveV10SourceAdmission = Readonly<{
  correctedPublicationCommit: string
  correctedPayloadRoot: string
  correctedReviewRoot: string
  correctedCarrierRoot: string
  plan111SourceCommit: string
  plan112V1PublicationCommit: string
  plan112V1PayloadRoot: string
  plan112V1ReviewRoot: string
  plan112V1CarrierRoot: string
  plan112V2PublicationCommit: string
  plan112V2PayloadRoot: string
  plan112V2ReviewRoot: string
  plan112V2CarrierRoot: string
  plan112V2FindingCount: 3
  plan112V2FindingCodes: readonly string[]
  plan109Eligible: false
  plan93StopCommit: string
  pairCommit: string
  sealRoot: string
  envelopeRoot: string
  protectedHistoryRoot: string
  envelopeStatus: "sealed_inactive"
  counters: typeof ZERO_COUNTERS
  custody: V138PathStableCustody
  reviewedClosureRoot: Sha
  localExecutionClosureRoot: Sha
  pair: Readonly<V138DerivedV3SealEnvelope>
  liveInvoked: false
  downstreamAuthority: "denied"
}>

export const authenticateV138LiveV10SourceOnly = (rootInput: string): V138LiveV10SourceAdmission => {
  const root = path.resolve(rootInput)
  assertImmutableHistory(root)
  const pair = assertPairAndStop(root)
  assertAbsent(root, [
    V138_LIVE_V10_PATHS.plan114Payload, V138_LIVE_V10_PATHS.plan114Review,
    V138_LIVE_V10_PATHS.plan114Carrier, V138_LIVE_V10_PATHS.supplementV1,
    V138_LIVE_V10_PATHS.supplementV2, V138_LIVE_V10_PATHS.supplementV3,
  ])
  const custody = deriveV138PathStableCustody(root, {
    sourceCommit: PLAN_111_SOURCE_COMMIT,
    checkoutPaths: PLAN_111_SOURCE_PATHS,
  })
  return Object.freeze({
    correctedPublicationCommit: CORRECTED_PUBLICATION_COMMIT,
    correctedPayloadRoot: CORRECTED_ROOTS.payload,
    correctedReviewRoot: CORRECTED_ROOTS.review,
    correctedCarrierRoot: CORRECTED_ROOTS.carrier,
    plan111SourceCommit: PLAN_111_SOURCE_COMMIT,
    plan112V1PublicationCommit: PLAN_112_V1_PUBLICATION_COMMIT,
    plan112V1PayloadRoot: PLAN_112_V1_ROOTS.payload,
    plan112V1ReviewRoot: PLAN_112_V1_ROOTS.review,
    plan112V1CarrierRoot: PLAN_112_V1_ROOTS.carrier,
    plan112V2PublicationCommit: PLAN_112_V2_PUBLICATION_COMMIT,
    plan112V2PayloadRoot: PLAN_112_V2_ROOTS.payload,
    plan112V2ReviewRoot: PLAN_112_V2_ROOTS.review,
    plan112V2CarrierRoot: PLAN_112_V2_ROOTS.carrier,
    plan112V2FindingCount: 3,
    plan112V2FindingCodes: PLAN_112_V2_FINDINGS,
    plan109Eligible: false,
    plan93StopCommit: PLAN_93_STOP_COMMIT,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    envelopeStatus: "sealed_inactive",
    counters: ZERO_COUNTERS,
    custody,
    reviewedClosureRoot: custody.reviewedClosureRoot,
    localExecutionClosureRoot: custody.localExecutionClosureRoot,
    pair,
    liveInvoked: false,
    downstreamAuthority: "denied",
  })
}

const plan114PayloadRoot = (body: Json): Sha => sha256("v138-plan-262-114-live-v10-custody-review-payload-v1", body)
const plan114ReviewRoot = (body: Json): Sha => sha256("v138-plan-262-114-live-v10-custody-review-v1", body)
const plan114CarrierRoot = (body: Json): Sha => sha256("v138-plan-262-114-live-v10-custody-review-carrier-v1", body)
const supplementV3Root = (body: Json): Sha => sha256("v138-successor-source-seal-v13-executable-custody-supplement-v3", body)

const renderV138LiveV10ProspectiveContracts = (input: {
  source: V138LiveV10SourceAdmission
  reviewedClosure: V138PathStableCustody
  reviewedLocalExecutionClosureRoot: Sha
  plan114PublicationCommit: string
}) => {
  if (!/^[0-9a-f]{40}$/u.test(input.plan114PublicationCommit)) fail("V138_LIVE_V10_PLAN_114_COMMIT_INVALID")
  if (
    !/^[0-9a-f]{40}$/u.test(input.reviewedClosure.sourceCommit) ||
    canonical(input.reviewedClosure.checkoutPaths) !== canonical(V138_LIVE_V10_REVIEWED_SOURCE_PATHS) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.reviewedClosure.reviewedClosureRoot) ||
    !/^sha256:[0-9a-f]{64}$/u.test(input.reviewedLocalExecutionClosureRoot) ||
    input.reviewedClosure.pathnameLaunchReplacementResistanceClaimed !== false
  ) fail("V138_LIVE_V10_REVIEWED_CLOSURE_INVALID")
  const payloadBody = {
    schemaVersion: "v1.38-plan-262-114-live-v10-custody-review-payload-v1",
    reviewedSourceCommit: input.reviewedClosure.sourceCommit,
    reviewedClosureRoot: input.reviewedClosure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.reviewedLocalExecutionClosureRoot,
    correctedPublicationCommit: input.source.correctedPublicationCommit,
    correctedPayloadRoot: input.source.correctedPayloadRoot,
    correctedReviewRoot: input.source.correctedReviewRoot,
    correctedCarrierRoot: input.source.correctedCarrierRoot,
    plan112V1PublicationCommit: input.source.plan112V1PublicationCommit,
    plan112V1PayloadRoot: input.source.plan112V1PayloadRoot,
    plan112V1ReviewRoot: input.source.plan112V1ReviewRoot,
    plan112V1CarrierRoot: input.source.plan112V1CarrierRoot,
    plan112V2PublicationCommit: input.source.plan112V2PublicationCommit,
    plan112V2PayloadRoot: input.source.plan112V2PayloadRoot,
    plan112V2ReviewRoot: input.source.plan112V2ReviewRoot,
    plan112V2CarrierRoot: input.source.plan112V2CarrierRoot,
    plan112V2FindingCount: 3,
    plan112V2FindingCodes: PLAN_112_V2_FINDINGS,
    findingCount: 0,
    findingCodes: [],
    reviewStatus: "zero_findings",
    actualModesPassed: 6,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...payloadBody, payloadRoot: plan114PayloadRoot(payloadBody) })
  const reviewBody = {
    payloadRoot: payload.payloadRoot,
    reviewedClosureRoot: input.reviewedClosure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.reviewedLocalExecutionClosureRoot,
    findingCount: 0,
    actualModesPassed: 6,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const reviewRoot = plan114ReviewRoot(reviewBody)
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "114"\nreview_type: independent_live_v10_executable_custody_v1\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${reviewRoot}\n---\n\n# Phase 262 Plan 114 Independent Live-v10 Executable-Custody Review\n\n**ZERO FINDINGS.** Six actual non-live modes passed. Portable reviewed closure: \`${input.reviewedClosure.reviewedClosureRoot}\`. Linked-review local context: \`${input.reviewedLocalExecutionClosureRoot}\`. Live invoked: false. Downstream authority: denied.\n`)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-114-live-v10-custody-review-carrier-v1",
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: bytesSha256(Buffer.from(canonical(payload))),
    reviewSha256: bytesSha256(reviewBytes),
    findingCount: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: plan114CarrierRoot(carrierBody) })
  const supplementBody = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v3",
    supersessionScope: "executable_source_custody_only",
    plan114PublicationCommit: input.plan114PublicationCommit,
    plan114PayloadRoot: payload.payloadRoot,
    plan114ReviewRoot: reviewRoot,
    plan114CarrierRoot: carrier.carrierRoot,
    reviewedSourceCommit: input.reviewedClosure.sourceCommit,
    reviewedClosureRoot: input.reviewedClosure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.reviewedLocalExecutionClosureRoot,
    correctedPublicationCommit: input.source.correctedPublicationCommit,
    plan112V1PublicationCommit: input.source.plan112V1PublicationCommit,
    plan112V2PublicationCommit: input.source.plan112V2PublicationCommit,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    counters: ZERO_COUNTERS,
    createsEnvelope: false,
    createsCapacity: false,
    resetsCounters: false,
    authorizesExecution: false,
    phase263PlanningAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    downstreamAuthority: "denied",
  }
  const supplement = Object.freeze({ ...supplementBody, supplementRoot: supplementV3Root(supplementBody) })
  return Object.freeze({ plan114: Object.freeze({ payload, reviewBytes, carrier, reviewRoot }), supplement })
}

export const deriveV138LiveV10ProspectiveContractsForReview = (input: {
  repoRoot: string
  source: V138LiveV10SourceAdmission
  reviewedSourceCommit: string
  plan114PublicationCommit: string
}) => {
  const reviewedClosure = deriveV138PathStableCustody(input.repoRoot, {
    sourceCommit: input.reviewedSourceCommit,
    checkoutPaths: V138_LIVE_V10_REVIEWED_SOURCE_PATHS,
  })
  checkV138PathStableCustodyForReview(reviewedClosure, reviewedClosure)
  return renderV138LiveV10ProspectiveContracts({
    source: input.source,
    reviewedClosure,
    reviewedLocalExecutionClosureRoot: reviewedClosure.localExecutionClosureRoot,
    plan114PublicationCommit: input.plan114PublicationCommit,
  })
}

export const checkV138LiveV10ProspectiveCustodyForReview = (input: {
  source: V138LiveV10SourceAdmission
  reviewedClosure: V138PathStableCustody
  plan114PublicationCommit: string
  plan114: Readonly<{ payload: Json; reviewBytes: Buffer; carrier: Json; reviewRoot: Sha }>
  supplement: Json
}) => {
  checkV138PathStableCustodyForReview(input.reviewedClosure, input.reviewedClosure)
  const reviewedLocalExecutionClosureRoot = input.plan114.payload.reviewedLocalExecutionClosureRoot
  if (!/^sha256:[0-9a-f]{64}$/u.test(reviewedLocalExecutionClosureRoot))
    fail("V138_LIVE_V10_REVIEW_LOCAL_CONTEXT_INVALID")
  const exact = renderV138LiveV10ProspectiveContracts({
    source: input.source,
    reviewedClosure: input.reviewedClosure,
    reviewedLocalExecutionClosureRoot,
    plan114PublicationCommit: input.plan114PublicationCommit,
  })
  if (
    canonical(input.plan114.payload) !== canonical(exact.plan114.payload) ||
    !input.plan114.reviewBytes.equals(exact.plan114.reviewBytes) ||
    canonical(input.plan114.carrier) !== canonical(exact.plan114.carrier) ||
    input.plan114.reviewRoot !== exact.plan114.reviewRoot ||
    canonical(input.supplement) !== canonical(exact.supplement)
  ) fail("V138_LIVE_V10_PROSPECTIVE_CUSTODY_INVALID")
  return Object.freeze({
    producerWouldInvoke: true as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
    ...exact,
  })
}

export const checkV138LiveV10PostRunOutputCustodyForReview =
  checkV138LiveV9PostRunOutputCustodyForReview
export const computeV138LiveV10ReproductionV17ReceiptRoot =
  computeV138LiveV9ReproductionV17ReceiptRoot
export const checkV138LiveV10ReproductionV17ForReview =
  checkV138LiveV9ReproductionV17ForReview

const locateAddCommit = (root: string, repoPath: string): string => {
  const commits = runV138RetryV3IsolatedGit(root, ["log", "--diff-filter=A", "--format=%H", "--", repoPath])
    .split("\n").filter(Boolean)
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!))
    fail("V138_LIVE_V10_ADD_COMMIT_INVALID")
  return commits[0]!
}

const authenticateFutureCustody = (
  rootInput: string,
  requireSupplement: boolean,
  boundary: "pre" | "post" = "pre",
) => {
  const root = path.resolve(rootInput)
  const source = authenticateV138LiveV10SourceOnlyForFuture(root)
  const paths = [V138_LIVE_V10_PATHS.plan114Payload, V138_LIVE_V10_PATHS.plan114Review, V138_LIVE_V10_PATHS.plan114Carrier]
  const commit = locateAddCommit(root, paths[0]!)
  assertExactAddPublication(root, commit, paths)
  const plan114 = {
    payload: jsonAt(root, commit, paths[0]!),
    reviewBytes: gitBytes(root, commit, paths[1]!),
    carrier: jsonAt(root, commit, paths[2]!),
    reviewRoot: jsonAt(root, commit, paths[2]!).reviewRoot as Sha,
  }
  const reviewedClosure = deriveV138PathStableCustody(root, {
    sourceCommit: plan114.payload.reviewedSourceCommit,
    checkoutPaths: V138_LIVE_V10_REVIEWED_SOURCE_PATHS,
  })
  const exact = renderV138LiveV10ProspectiveContracts({
    source,
    reviewedClosure,
    reviewedLocalExecutionClosureRoot: plan114.payload.reviewedLocalExecutionClosureRoot,
    plan114PublicationCommit: commit,
  })
  let supplement: Json = exact.supplement
  if (requireSupplement) {
    const supplementCommit = locateAddCommit(root, V138_LIVE_V10_PATHS.supplementV3)
    assertExactAddPublication(root, supplementCommit, [V138_LIVE_V10_PATHS.supplementV3])
    supplement = jsonAt(root, supplementCommit, V138_LIVE_V10_PATHS.supplementV3)
  } else if (existsSync(target(root, V138_LIVE_V10_PATHS.supplementV3))) {
    fail("V138_LIVE_V10_SUPPLEMENT_PREMATURE")
  }
  if (boundary === "pre") assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  else assertAbsent(root, DOWNSTREAM_OUTPUTS)
  const checked = checkV138LiveV10ProspectiveCustodyForReview({
    source, reviewedClosure, plan114PublicationCommit: commit, plan114, supplement,
  })
  return Object.freeze({
    ...checked,
    canonicalLocalExecutionClosureRoot: reviewedClosure.localExecutionClosureRoot,
  })
}

const authenticateV138LiveV10SourceOnlyForFuture = (rootInput: string): V138LiveV10SourceAdmission => {
  const root = path.resolve(rootInput)
  assertImmutableHistory(root)
  const pair = assertPairAndStop(root)
  assertAbsent(root, [V138_LIVE_V10_PATHS.supplementV1, V138_LIVE_V10_PATHS.supplementV2])
  const custody = deriveV138PathStableCustody(root, { sourceCommit: PLAN_111_SOURCE_COMMIT, checkoutPaths: PLAN_111_SOURCE_PATHS })
  return Object.freeze({ ...authenticateV138LiveV10SourceOnlyShape(custody, pair) })
}

const authenticateV138LiveV10SourceOnlyShape = (
  custody: V138PathStableCustody,
  pair: Readonly<V138DerivedV3SealEnvelope>,
): V138LiveV10SourceAdmission => Object.freeze({
  correctedPublicationCommit: CORRECTED_PUBLICATION_COMMIT,
  correctedPayloadRoot: CORRECTED_ROOTS.payload, correctedReviewRoot: CORRECTED_ROOTS.review, correctedCarrierRoot: CORRECTED_ROOTS.carrier,
  plan111SourceCommit: PLAN_111_SOURCE_COMMIT,
  plan112V1PublicationCommit: PLAN_112_V1_PUBLICATION_COMMIT, plan112V1PayloadRoot: PLAN_112_V1_ROOTS.payload, plan112V1ReviewRoot: PLAN_112_V1_ROOTS.review, plan112V1CarrierRoot: PLAN_112_V1_ROOTS.carrier,
  plan112V2PublicationCommit: PLAN_112_V2_PUBLICATION_COMMIT, plan112V2PayloadRoot: PLAN_112_V2_ROOTS.payload, plan112V2ReviewRoot: PLAN_112_V2_ROOTS.review, plan112V2CarrierRoot: PLAN_112_V2_ROOTS.carrier,
  plan112V2FindingCount: 3, plan112V2FindingCodes: PLAN_112_V2_FINDINGS, plan109Eligible: false,
  plan93StopCommit: PLAN_93_STOP_COMMIT, pairCommit: PAIR_COMMIT, sealRoot: SEAL_ROOT,
  envelopeRoot: ENVELOPE_ROOT, protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
  envelopeStatus: "sealed_inactive", counters: ZERO_COUNTERS, custody,
  reviewedClosureRoot: custody.reviewedClosureRoot, localExecutionClosureRoot: custody.localExecutionClosureRoot,
  pair,
  liveInvoked: false, downstreamAuthority: "denied",
})

const pathPresent = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error }
}
const readCanonicalJsonNoFollow = (root: string, repoPath: string, maximumBytes: number): Json => {
  try {
    const bytes = readRegularNoFollow(root, repoPath, maximumBytes)
    const value = JSON.parse(bytes.toString("utf8")) as Json
    if (!bytes.equals(Buffer.from(canonical(value))))
      fail(`V138_LIVE_V10_LIVE_FILE_NONCANONICAL:${repoPath}`)
    return value
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_LIVE_V10_")) throw error
    fail(`V138_LIVE_V10_LIVE_FILE_INVALID:${repoPath}`)
  }
}
const readCanonicalJournalNoFollow = (root: string): readonly Json[] => {
  try {
    const text = readRegularNoFollow(root, V138_BOUNDED_RETRY_V3_PATHS.journal).toString("utf8")
    const lines = text.split("\n")
    if (lines.pop() !== "" || lines.length === 0) fail("V138_LIVE_V10_JOURNAL_NONCANONICAL")
    return Object.freeze(lines.map((line) => {
      const value = JSON.parse(line) as Json
      if (`${canonical(value).trimEnd()}\n` !== `${line}\n`)
        fail("V138_LIVE_V10_JOURNAL_NONCANONICAL")
      return Object.freeze(value)
    }))
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_LIVE_V10_")) throw error
    fail("V138_LIVE_V10_JOURNAL_INVALID")
  }
}
const assertPostRun = (root: string): void => {
  const journalPresent = pathPresent(root, V138_BOUNDED_RETRY_V3_PATHS.journal)
  const privateDirectoryPresent = pathPresent(root, V138_BOUNDED_RETRY_V3_PATHS.privateDir)
  const terminalPresent = pathPresent(root, V138_BOUNDED_RETRY_V3_PATHS.terminal)
  const outcome = journalPresent || privateDirectoryPresent || terminalPresent
    ? checkV138PublishedRetryV3Outcome(root) : undefined
  const checked = checkV138LiveV10PostRunOutputCustodyForReview({
    journalPresent, privateDirectoryPresent, terminalPresent,
    lockPresent: pathPresent(root, `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`),
    reproductionPresent: pathPresent(root, V138_BOUNDED_RETRY_V3_PATHS.reproduction),
    adjudicationOrDownstreamPresent: DOWNSTREAM_OUTPUTS.some((repoPath) => pathPresent(root, repoPath)),
    outcome,
  })
  if (checked.status === "bounded_success") {
    const artifact = readCanonicalJsonNoFollow(
      root, V138_BOUNDED_RETRY_V3_PATHS.reproduction, 1024 * 1024,
    )
    const journalRecords = readCanonicalJournalNoFollow(root)
    checkV138LiveV10ReproductionV17ForReview({ artifact, journalRecords, outcome: outcome! })
    const after = checkV138PublishedRetryV3Outcome(root)
    if (canonical(after) !== canonical(outcome))
      fail("V138_LIVE_V10_POST_RUN_OUTCOME_CHANGED")
  }
}
export const assertV138LiveV10PostRunForReview = assertPostRun

export const runV138ReviewedBoundedLiveEnvelopeV10 = async (repoRoot: string): Promise<void> => {
  const ready = authenticateFutureCustody(repoRoot, true)
  let producerError: unknown
  let postCustodyError: unknown
  try {
    await runV138V3ProductionLive(repoRoot, {
      validateInputs: false,
      checkPair: () => ({ seal: ready.source.pair.seal, envelope: ready.source.pair.envelope }),
    })
  } catch (error) { producerError = error }
  finally {
    try {
      const after = authenticateFutureCustody(repoRoot, true, "post")
      if (after.canonicalLocalExecutionClosureRoot !== ready.canonicalLocalExecutionClosureRoot)
        fail("V138_LIVE_V10_CANONICAL_LOCAL_CLOSURE_CHANGED")
      assertPostRun(repoRoot)
    }
    catch (error) { postCustodyError = error }
  }
  void ready
  settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)
}

export const executeV138LiveV10Cli = async (
  args: readonly string[],
  injected?: Partial<{ repoRoot: string; writeOutput: (value: string) => void }>,
): Promise<void> => {
  if (args.length !== 1 || !V138_LIVE_V10_MODES.includes(args[0] as never)) fail("V138_LIVE_V10_ARGUMENTS_INVALID")
  const root = injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const output = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (args[0] === "--run-reviewed-bounded-live-envelope") {
    await runV138ReviewedBoundedLiveEnvelopeV10(root)
    output(`${JSON.stringify({ status: "reviewed_bounded_live_complete" })}\n`)
    return
  }
  if (args[0] === "--check-source-only") {
    const result = authenticateV138LiveV10SourceOnly(root)
    output(`${JSON.stringify({
      status: "source_only_checked", reviewedClosureRoot: result.reviewedClosureRoot,
      localExecutionClosureRoot: result.localExecutionClosureRoot,
      plan112V2FindingCount: result.plan112V2FindingCount, plan109Eligible: false,
      liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied",
    })}\n`)
    return
  }
  const result = authenticateFutureCustody(
    root,
    args[0] !== "--check-prospective-custody",
    args[0] === "--check-post-run-custody" ? "post" : "pre",
  )
  if (args[0] === "--check-post-run-custody") assertPostRun(root)
  output(`${JSON.stringify({
    status: args[0] === "--check-prospective-custody" ? "prospective_custody_checked" :
      args[0] === "--check-post-run-custody" ? "post_run_custody_checked" : "reviewed_live_ready",
    supplementRoot: result.supplement.supplementRoot,
    producerWouldInvoke: args[0] === "--check-reviewed-live-ready",
    liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied",
  })}\n`)
}

const isEntrypoint = process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isEntrypoint) await executeV138LiveV10Cli(process.argv.slice(2))
