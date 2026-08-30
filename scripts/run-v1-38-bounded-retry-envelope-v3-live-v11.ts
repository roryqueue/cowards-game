import { createHash } from "node:crypto"
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_PATHS,
  runV138V3ProductionLive,
} from "./run-v1-38-bounded-retry-envelope-v3.js"
import { encodeV138RetryV3CanonicalJson } from "./lib/v1-38-bounded-retry-envelope-v3.js"
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
  assertV138LiveV10PostRunForReview,
  checkV138LiveV10PostRunOutputCustodyForReview,
  checkV138LiveV10ReproductionV17ForReview,
  computeV138LiveV10ReproductionV17ReceiptRoot,
} from "./run-v1-38-bounded-retry-envelope-v3-live-v10.js"
import { settleV138LiveV9ProducerOutcomeForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v9.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
})
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const PLAN_93_STOP_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const SUPPLEMENT_COMMIT = "a1e693a2ae528ba06597d3262041d6f947ecbeca"
const SUPPLEMENT_ROOT = "sha256:3a653c44db658a89250d4b90d9a3bb086c99ac3fc04ebf8c7107bc66fd4f8e4b"
const SUPPLEMENT_BLOB = "f5953ea37f8648fa85790f97f536d92f94f999e7"
const SUPPLEMENT_SHA256 = "sha256:16c8cd800340047222ecd8a958c40c5be6997c4281ec15b00a182fb3cc5e819b"
const PLAN_114_V1_COMMIT = "ab539ab2b3706981aaeb053b3fafce6b46532b40"
const PLAN_114_V2_COMMIT = "34bc94ec4e348f71e6055a091d60a505cffc0d79"
const PLAN_116_COMMITS = Object.freeze([
  "e1e75fc6ef177a8213d903f1ec365d86f37cf62a",
  "2219a36b62b41b45626ed93f13f43edb36463e61",
  "1c0862e16ff4a32add4308e481df567b1212eb0c",
  "f03f0e05539a1591b91000fc9d35b8381a082ec2",
] as const)
const PLAN_114_ROOTS = Object.freeze([
  Object.freeze({
    payload: "sha256:7a414ac6d41af084e785e9eaed4fc28835806bf1aa339be571befab114e9d857",
    review: "sha256:ab85273e90e40749324b270db1bfc5275b29fbb20b7eebcf9d6d776fe7a0cdec",
    carrier: "sha256:4fba941b15a1435d37d99a1847e44f8bdbb8d5ecafa7a1d8c3b9b60b81dc38fc",
  }),
  Object.freeze({
    payload: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac",
    review: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee",
    carrier: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26",
  }),
] as const)
const PLAN_116_ROOTS = Object.freeze([
  Object.freeze({ payload: "sha256:b10df97b08ac7e23b7b48f645f16a7f086c431580769e70d171cd9c6ee93cfb5", review: "sha256:f3d5eee2701dba2617594ecf28cd57f6dee52d2d087d241d6b59c6fb69943230", carrier: "sha256:56a6a1a9bc76bc99fe7de7f77e70c45b46cf5ed8ab3b3baf5b27868f66d45e0b" }),
  Object.freeze({ payload: "sha256:08a648525023db9d193bd377c1bda0ab5e9d8534d4681b8931228da4889ab264", review: "sha256:622a7fc1bc37701414f152246f347d31e841d27aaeed8589d6b2b14bdbaf84af", carrier: "sha256:aeddda11d0632711d61face9f01e1fefe7778b12c2b3621c139225446f8c0e12" }),
  Object.freeze({ payload: "sha256:a7028015d8d45381cab4a2be7232239b00830c3839dfdd4e790204e5e3bb64c6", review: "sha256:12fae1e53ce2706d1e456e995b335c4e428046087ae510f8f6d24275ce3d6050", carrier: "sha256:1aba12b4ad9e75d42b58be0b606cb661fd04b3fa090588ddb30676949209e0c8" }),
  Object.freeze({ payload: "sha256:251b01b973f1abde239089e6e49dc6c38c74803a273fa6f104a6cdda156de1d7", review: "sha256:d238645459920ba74d9e8265f5b0c0609e636f86d027a2e7f473058f746aedf3", carrier: "sha256:3d665d7f562b575a9b2ffdeafbe1458922e2687bd75b32027b39cb67c0a7632b" }),
] as const)

export const V138_LIVE_V11_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.test.ts",
  plan93: `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
  plan114PayloadV1: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json",
  plan114ReviewV1: `${PHASE}/262-114-REVIEW.md`,
  plan114CarrierV1: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json",
  plan114PayloadV2: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json",
  plan114ReviewV2: `${PHASE}/262-114-REVIEW-v2.md`,
  plan114CarrierV2: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v2.json",
  supplementV1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplementV2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
  supplementV3: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  plan118Payload: ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-payload-v1.json",
  plan118Review: `${PHASE}/262-118-REVIEW.md`,
  plan118Carrier: ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-carrier-v1.json",
})
const plan116Paths = (version: number) => Object.freeze([
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v${version}.json`,
  version === 1 ? `${PHASE}/262-116-REVIEW.md` : `${PHASE}/262-116-REVIEW-v${version}.md`,
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v${version}.json`,
] as const)
const PLAN_114_PATHS = Object.freeze([
  Object.freeze([V138_LIVE_V11_PATHS.plan114PayloadV1, V138_LIVE_V11_PATHS.plan114ReviewV1, V138_LIVE_V11_PATHS.plan114CarrierV1] as const),
  Object.freeze([V138_LIVE_V11_PATHS.plan114PayloadV2, V138_LIVE_V11_PATHS.plan114ReviewV2, V138_LIVE_V11_PATHS.plan114CarrierV2] as const),
] as const)
const PLAN_118_PATHS = Object.freeze([
  V138_LIVE_V11_PATHS.plan118Payload,
  V138_LIVE_V11_PATHS.plan118Review,
  V138_LIVE_V11_PATHS.plan118Carrier,
] as const)
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
export const V138_LIVE_V11_FORBIDDEN_PRE_EFFECT = Object.freeze([
  ...PLAN_118_PATHS,
  ...PRODUCER_OUTPUTS,
  ...DOWNSTREAM_OUTPUTS,
])
export const V138_LIVE_V11_MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-reviewed-live-ready",
  "--run-reviewed-bounded-live-envelope",
] as const)
export const V138_LIVE_V11_REVIEWED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  V138_LIVE_V11_PATHS.source,
  V138_LIVE_V11_PATHS.tests,
] as const)

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = encodeV138RetryV3CanonicalJson
const sha = (bytes: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => path.join(path.resolve(root), ...repoPath.split("/"))
const git = (root: string, args: readonly string[], allowFailure = false): string =>
  runV138RetryV3IsolatedGit(root, args, allowFailure)
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const pathPresent = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const readRegularNoFollow = (
  root: string,
  repoPath: string,
  maximumBytes = 8 * 1024 * 1024,
  expectedMode = 0o644,
): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || before.size > maximumBytes || (before.mode & 0o7777) !== expectedMode)
      fail(`V138_LIVE_V11_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_LIVE_V11_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_LIVE_V11_")) throw error
    fail(`V138_LIVE_V11_CURRENT_ENTRY_INVALID:${repoPath}`)
  } finally { if (descriptor !== undefined) closeSync(descriptor) }
}
const jsonBytes = (bytes: Buffer, code: string): Json => {
  try {
    const value = JSON.parse(bytes.toString("utf8")) as Json
    if (!bytes.equals(Buffer.from(canonical(value)))) fail(code)
    return value
  } catch (error) {
    if (error instanceof Error && error.message === code) throw error
    fail(code)
  }
}
const requireAncestor = (root: string, commit: string): void => {
  if (git(root, ["merge-base", "--is-ancestor", commit, "HEAD"], true) !== "")
    fail(`V138_LIVE_V11_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_LIVE_V11_SUCCESSOR_REWRITE:${paths[0]}`)
}
const exactPublication = (
  root: string,
  commit: string,
  paths: readonly string[],
): Readonly<{ payload: Json; reviewBytes: Buffer; carrier: Json }> => {
  requireAncestor(root, commit)
  const changed = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).map((line) => line.split("\t"))
  const expected = paths.map((repoPath) => ["A", repoPath])
    .sort((a, b) => a[1]!.localeCompare(b[1]!))
  if (canonical(changed) !== canonical(expected)) fail("V138_LIVE_V11_PUBLICATION_SCOPE_INVALID")
  const bytes = paths.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath])
    const match = /^100644 blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
    if (match === null || match[2] !== repoPath) fail(`V138_LIVE_V11_PUBLICATION_MODE_INVALID:${repoPath}`)
    const committed = gitBytes(root, commit, repoPath)
    if (!readRegularNoFollow(root, repoPath).equals(committed))
      fail(`V138_LIVE_V11_PUBLICATION_CURRENT_BYTES_INVALID:${repoPath}`)
    return committed
  })
  noRewrite(root, commit, paths)
  return Object.freeze({
    payload: jsonBytes(bytes[0]!, "V138_LIVE_V11_PAYLOAD_INVALID"),
    reviewBytes: bytes[1]!,
    carrier: jsonBytes(bytes[2]!, "V138_LIVE_V11_CARRIER_INVALID"),
  })
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (pathPresent(root, repoPath))
    fail(`V138_LIVE_V11_FORBIDDEN_DESTINATION_PRESENT:${repoPath}`)
}

const authenticatePublicationHistory = (root: string): void => {
  for (const [index, paths] of PLAN_114_PATHS.entries()) {
    const commit = index === 0 ? PLAN_114_V1_COMMIT : PLAN_114_V2_COMMIT
    const publication = exactPublication(root, commit, paths)
    const roots = PLAN_114_ROOTS[index]!
    if (publication.payload.payloadRoot !== roots.payload || publication.carrier.reviewRoot !== roots.review ||
        publication.carrier.carrierRoot !== roots.carrier || publication.payload.findingCount !== 0 ||
        publication.payload.actualModesPassed !== 6 || publication.payload.authorizesExecution !== false ||
        publication.payload.liveInvoked !== false || publication.payload.freshCharged !== 0 ||
        publication.payload.freshAccepted !== 0 || publication.payload.downstreamAuthority !== "denied")
      fail(`V138_LIVE_V11_PLAN114_V${index + 1}_INVALID`)
    if (index === 1 && (publication.payload.plan109Eligible !== true ||
        publication.payload.supersedesPublicationCommit !== PLAN_114_V1_COMMIT))
      fail("V138_LIVE_V11_PLAN114_V2_AUTHORITY_INVALID")
  }
  for (const [index, commit] of PLAN_116_COMMITS.entries()) {
    const publication = exactPublication(root, commit, plan116Paths(index + 1))
    const roots = PLAN_116_ROOTS[index]!
    if (publication.payload.payloadRoot !== roots.payload || publication.carrier.reviewRoot !== roots.review ||
        publication.carrier.carrierRoot !== roots.carrier || publication.payload.findingCount !== 0 ||
        publication.payload.actualModesPassed !== 9 || publication.payload.plan109Eligible !== true ||
        publication.payload.supplementRoot !== SUPPLEMENT_ROOT || publication.payload.authorizesExecution !== false ||
        publication.payload.producerCalls !== 0 || publication.payload.readinessInvoked !== false ||
        publication.payload.liveInvoked !== false || publication.payload.freshCharged !== 0 ||
        publication.payload.freshAccepted !== 0 || publication.payload.downstreamAuthority !== "denied")
      fail(`V138_LIVE_V11_PLAN116_V${index + 1}_INVALID`)
    if (index > 0 && publication.payload.supersedesPublicationCommit !== PLAN_116_COMMITS[index - 1])
      fail(`V138_LIVE_V11_PLAN116_V${index + 1}_SUPERSESSION_INVALID`)
  }
}
const authenticateSupplement = (root: string): Json => {
  requireAncestor(root, SUPPLEMENT_COMMIT)
  const scope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", SUPPLEMENT_COMMIT])
  if (scope !== `A\t${V138_LIVE_V11_PATHS.supplementV3}`) fail("V138_LIVE_V11_SUPPLEMENT_SCOPE_INVALID")
  const entry = git(root, ["ls-tree", SUPPLEMENT_COMMIT, "--", V138_LIVE_V11_PATHS.supplementV3])
  if (entry !== `100644 blob ${SUPPLEMENT_BLOB}\t${V138_LIVE_V11_PATHS.supplementV3}`)
    fail("V138_LIVE_V11_SUPPLEMENT_ENTRY_INVALID")
  const bytes = gitBytes(root, SUPPLEMENT_COMMIT, V138_LIVE_V11_PATHS.supplementV3)
  if (sha(bytes) !== SUPPLEMENT_SHA256 || !readRegularNoFollow(root, V138_LIVE_V11_PATHS.supplementV3).equals(bytes))
    fail("V138_LIVE_V11_SUPPLEMENT_BYTES_INVALID")
  noRewrite(root, SUPPLEMENT_COMMIT, [V138_LIVE_V11_PATHS.supplementV3])
  const supplement = jsonBytes(bytes, "V138_LIVE_V11_SUPPLEMENT_INVALID")
  if (supplement.schemaVersion !== "v1.38-successor-source-seal-v13-executable-custody-supplement-v3" ||
      supplement.supplementRoot !== SUPPLEMENT_ROOT || supplement.plan114PublicationCommit !== PLAN_114_V2_COMMIT ||
      supplement.plan114PayloadRoot !== PLAN_114_ROOTS[1].payload ||
      supplement.plan114ReviewRoot !== PLAN_114_ROOTS[1].review ||
      supplement.plan114CarrierRoot !== PLAN_114_ROOTS[1].carrier || supplement.pairCommit !== PAIR_COMMIT ||
      supplement.sealRoot !== SEAL_ROOT || supplement.envelopeRoot !== ENVELOPE_ROOT ||
      supplement.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      canonical(supplement.counters) !== canonical(ZERO_COUNTERS) || supplement.createsEnvelope !== false ||
      supplement.createsCapacity !== false || supplement.resetsCounters !== false ||
      supplement.authorizesExecution !== false || supplement.phase263PlanningAuthorized !== false ||
      supplement.candidateSearchAuthorized !== false || supplement.formationMaterializationAuthorized !== false ||
      supplement.holdoutOpeningAuthorized !== false || supplement.publicAuthorized !== false ||
      supplement.productAuthorized !== false || supplement.productionAuthorized !== false ||
      supplement.downstreamAuthority !== "denied") fail("V138_LIVE_V11_SUPPLEMENT_SEMANTICS_INVALID")
  return supplement
}
const authenticatePairAndStop = (root: string): Readonly<{ seal: Json; envelope: Json }> => {
  requireAncestor(root, PAIR_COMMIT)
  const seal = jsonBytes(gitBytes(root, PAIR_COMMIT, V138_LIVE_V11_PATHS.seal), "V138_LIVE_V11_SEAL_INVALID")
  const envelope = jsonBytes(gitBytes(root, PAIR_COMMIT, V138_LIVE_V11_PATHS.envelope), "V138_LIVE_V11_ENVELOPE_INVALID")
  if (!readRegularNoFollow(root, V138_LIVE_V11_PATHS.seal, 8 * 1024 * 1024, 0o600)
      .equals(gitBytes(root, PAIR_COMMIT, V138_LIVE_V11_PATHS.seal)) ||
      !readRegularNoFollow(root, V138_LIVE_V11_PATHS.envelope, 8 * 1024 * 1024, 0o600)
        .equals(gitBytes(root, PAIR_COMMIT, V138_LIVE_V11_PATHS.envelope)))
    fail("V138_LIVE_V11_PAIR_CURRENT_BYTES_INVALID")
  noRewrite(root, PAIR_COMMIT, [V138_LIVE_V11_PATHS.seal, V138_LIVE_V11_PATHS.envelope])
  requireAncestor(root, PLAN_93_STOP_COMMIT)
  if (!readRegularNoFollow(root, V138_LIVE_V11_PATHS.plan93).equals(gitBytes(root, PLAN_93_STOP_COMMIT, V138_LIVE_V11_PATHS.plan93)))
    fail("V138_LIVE_V11_PLAN93_CURRENT_BYTES_INVALID")
  noRewrite(root, PLAN_93_STOP_COMMIT, [V138_LIVE_V11_PATHS.plan93])
  if (seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied" ||
      envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
      canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      ["candidateSearchAuthorized", "formationMaterializationAuthorized", "gameplayChangeAuthorized",
        "holdoutOpeningAuthorized", "partialAcceptedEvidenceReusable", "phase263PlanningAuthorized",
        "productAuthorized", "productionAuthorized", "publicAuthorized"]
        .some((key) => envelope.policy[key] !== false) || envelope.policy.supervisedRuntimeOnly !== true)
    fail("V138_LIVE_V11_PAIR_SEMANTICS_INVALID")
  return Object.freeze({ seal, envelope })
}

export type V138LiveV11SourceAdmission = Readonly<{
  plan114V2PublicationCommit: typeof PLAN_114_V2_COMMIT
  plan114V2PayloadRoot: string
  plan116V4PublicationCommit: typeof PLAN_116_COMMITS[3]
  plan116V4PayloadRoot: string
  supplementPublicationCommit: typeof SUPPLEMENT_COMMIT
  supplementRoot: typeof SUPPLEMENT_ROOT
  pairCommit: typeof PAIR_COMMIT
  sealRoot: typeof SEAL_ROOT
  envelopeRoot: typeof ENVELOPE_ROOT
  protectedHistoryRoot: typeof PROTECTED_HISTORY_ROOT
  counters: typeof ZERO_COUNTERS
  envelopeStatus: "sealed_inactive"
  producerCalls: 0
  readinessInvoked: false
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  authorizesExecution: false
  downstreamAuthority: "denied"
  pair: Readonly<{ seal: Json; envelope: Json }>
  supplement: Json
}>

export const authenticateV138LiveV11SourceOnly = (rootInput: string): V138LiveV11SourceAdmission => {
  const root = path.resolve(rootInput)
  authenticatePublicationHistory(root)
  const supplement = authenticateSupplement(root)
  const pair = authenticatePairAndStop(root)
  assertAbsent(root, [V138_LIVE_V11_PATHS.supplementV1, V138_LIVE_V11_PATHS.supplementV2,
    ...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return Object.freeze({
    plan114V2PublicationCommit: PLAN_114_V2_COMMIT,
    plan114V2PayloadRoot: PLAN_114_ROOTS[1].payload,
    plan116V4PublicationCommit: PLAN_116_COMMITS[3],
    plan116V4PayloadRoot: PLAN_116_ROOTS[3].payload,
    supplementPublicationCommit: SUPPLEMENT_COMMIT,
    supplementRoot: SUPPLEMENT_ROOT,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    counters: ZERO_COUNTERS,
    envelopeStatus: "sealed_inactive",
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
    pair,
    supplement,
  })
}

const plan118PayloadRoot = (body: Json): Sha => rooted("v138-plan-262-118-live-v11-custody-review-payload-v1", body)
const plan118ReviewRoot = (body: Json): Sha => rooted("v138-plan-262-118-live-v11-custody-review-markdown-v1", body)
const plan118CarrierRoot = (body: Json): Sha => rooted("v138-plan-262-118-live-v11-custody-review-carrier-v1", body)

const renderPlan118Contracts = (input: {
  source: V138LiveV11SourceAdmission
  reviewedClosure: V138PathStableCustody
  reviewedLocalExecutionClosureRoot: Sha
  plan118PublicationCommit: string
}) => {
  if (!/^[0-9a-f]{40}$/u.test(input.plan118PublicationCommit) ||
      !/^sha256:[0-9a-f]{64}$/u.test(input.reviewedLocalExecutionClosureRoot) ||
      canonical(input.reviewedClosure.checkoutPaths) !== canonical(V138_LIVE_V11_REVIEWED_SOURCE_PATHS) ||
      input.reviewedClosure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_LIVE_V11_PLAN118_INPUT_INVALID")
  const body = {
    schemaVersion: "v1.38-plan-262-118-live-v11-custody-review-payload-v1",
    protocol: "independent-live-v11-executable-custody-review-v1",
    subjectCommit: input.reviewedClosure.sourceCommit,
    reviewedClosureRoot: input.reviewedClosure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.reviewedLocalExecutionClosureRoot,
    plan114V2PublicationCommit: input.source.plan114V2PublicationCommit,
    plan114V2PayloadRoot: input.source.plan114V2PayloadRoot,
    plan116V4PublicationCommit: input.source.plan116V4PublicationCommit,
    plan116V4PayloadRoot: input.source.plan116V4PayloadRoot,
    supplementPublicationCommit: input.source.supplementPublicationCommit,
    supplementRoot: input.source.supplementRoot,
    pairCommit: input.source.pairCommit,
    sealRoot: input.source.sealRoot,
    envelopeRoot: input.source.envelopeRoot,
    protectedHistoryRoot: input.source.protectedHistoryRoot,
    counters: ZERO_COUNTERS,
    reviewStatus: "zero_findings",
    findings: [],
    findingCount: 0,
    actualModesPassed: 6,
    plan110Eligible: true,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
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
  const payload = Object.freeze({ ...body, payloadRoot: plan118PayloadRoot(body) })
  const reviewBody = {
    payloadRoot: payload.payloadRoot,
    reviewedClosureRoot: payload.reviewedClosureRoot,
    findingCount: 0,
    actualModesPassed: 6,
    plan110Eligible: true,
    producerCalls: 0,
    downstreamAuthority: "denied",
  }
  const reviewRoot = plan118ReviewRoot(reviewBody)
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "118"\nreview_type: independent_live_v11_executable_custody_v1\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${reviewRoot}\n---\n\n# Phase 262 Plan 118 Independent Live-v11 Executable-Custody Review\n\n**ZERO FINDINGS.** Six producer-incapable modes passed. Only revised Plan 110 is eligible. Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Fresh charged/accepted: 0/0. Downstream authority: denied.\n`)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-118-live-v11-custody-review-carrier-v1",
    protocol: "nonrecursive-external-review-carrier-v1",
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: sha(Buffer.from(canonical(payload))),
    reviewSha256: sha(reviewBytes),
    findingCount: 0,
    actualModesPassed: 6,
    subjectCommit: input.reviewedClosure.sourceCommit,
    plan110Eligible: true,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: plan118CarrierRoot(carrierBody) })
  return Object.freeze({ payload, reviewBytes, reviewRoot, carrier, plan118PublicationCommit: input.plan118PublicationCommit })
}

export const deriveV138LiveV11ProspectiveContractsForReview = (input: {
  repoRoot: string
  reviewedSourceCommit: string
  plan118PublicationCommit: string
  reviewedLocalExecutionClosureRoot?: Sha
}) => {
  const source = authenticateV138LiveV11SourceOnly(input.repoRoot)
  const reviewedClosure = deriveV138PathStableCustody(input.repoRoot, {
    sourceCommit: input.reviewedSourceCommit,
    checkoutPaths: V138_LIVE_V11_REVIEWED_SOURCE_PATHS,
  })
  checkV138PathStableCustodyForReview(reviewedClosure, reviewedClosure)
  const contracts = renderPlan118Contracts({
    source,
    reviewedClosure,
    reviewedLocalExecutionClosureRoot:
      input.reviewedLocalExecutionClosureRoot ?? reviewedClosure.localExecutionClosureRoot,
    plan118PublicationCommit: input.plan118PublicationCommit,
  })
  return Object.freeze({ source, reviewedClosure, ...contracts })
}

export const checkV138LiveV11ProspectiveCustodyForReview = (input: {
  source: V138LiveV11SourceAdmission
  reviewedClosure: V138PathStableCustody
  reviewedLocalExecutionClosureRoot: Sha
  plan118PublicationCommit: string
  plan118: Readonly<{ payload: Json; reviewBytes: Buffer; carrier: Json; reviewRoot: Sha }>
}) => {
  checkV138PathStableCustodyForReview(input.reviewedClosure, input.reviewedClosure)
  const exact = renderPlan118Contracts(input)
  if (canonical(input.plan118.payload) !== canonical(exact.payload) ||
      !input.plan118.reviewBytes.equals(exact.reviewBytes) ||
      canonical(input.plan118.carrier) !== canonical(exact.carrier) ||
      input.plan118.reviewRoot !== exact.reviewRoot)
    fail("V138_LIVE_V11_PLAN118_CUSTODY_INVALID")
  return Object.freeze({
    ...exact,
    canonicalLocalExecutionClosureRoot: input.reviewedClosure.localExecutionClosureRoot,
    producerWouldInvoke: true as const,
    producerCalls: 0 as const,
    readinessInvoked: false as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
  })
}

const authenticateFutureCustody = (rootInput: string, boundary: "pre" | "post" = "pre") => {
  const root = path.resolve(rootInput)
  const publicationCommit = git(root, ["log", "--diff-filter=A", "--format=%H", "--", V138_LIVE_V11_PATHS.plan118Payload])
  if (!/^[0-9a-f]{40}$/u.test(publicationCommit)) fail("V138_LIVE_V11_PLAN118_PUBLICATION_INVALID")
  const plan118 = exactPublication(root, publicationCommit, PLAN_118_PATHS)
  const subjectCommit = plan118.payload.subjectCommit
  if (typeof subjectCommit !== "string" || !/^[0-9a-f]{40}$/u.test(subjectCommit))
    fail("V138_LIVE_V11_PLAN118_SUBJECT_INVALID")
  const source = authenticateV138LiveV11SourceOnly(root)
  const reviewedClosure = deriveV138PathStableCustody(root, {
    sourceCommit: subjectCommit,
    checkoutPaths: V138_LIVE_V11_REVIEWED_SOURCE_PATHS,
  })
  const checked = checkV138LiveV11ProspectiveCustodyForReview({
    source,
    reviewedClosure,
    reviewedLocalExecutionClosureRoot: plan118.payload.reviewedLocalExecutionClosureRoot,
    plan118PublicationCommit: publicationCommit,
    plan118: { ...plan118, reviewRoot: plan118.carrier.reviewRoot },
  })
  if (boundary === "pre") assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  else assertAbsent(root, DOWNSTREAM_OUTPUTS)
  return checked
}

export const checkV138LiveV11PostRunOutputCustodyForReview =
  checkV138LiveV10PostRunOutputCustodyForReview
export const computeV138LiveV11ReproductionV17ReceiptRoot =
  computeV138LiveV10ReproductionV17ReceiptRoot
export const checkV138LiveV11ReproductionV17ForReview =
  checkV138LiveV10ReproductionV17ForReview

export const inspectV138LiveV11ProductionBoundaryForReview = (rootInput: string) => {
  const source = readRegularNoFollow(path.resolve(rootInput), V138_LIVE_V11_PATHS.source).toString("utf8")
  const producerCallSites = source.match(/await runV138V3ProductionLive\(/gu)?.length ?? 0
  if (producerCallSites !== 1 ||
      !source.includes('"--check-reviewed-live-ready"') ||
      !source.includes('"--run-reviewed-bounded-live-envelope"') ||
      /runV138ReviewedBoundedLiveEnvelopeV11\s*=\s*async\s*\([^)]*,/u.test(source) ||
      /Partial<\{[^}]*?(?:producer|readiness|renderer)/su.test(source))
    fail("V138_LIVE_V11_PRODUCTION_BOUNDARY_INVALID")
  return Object.freeze({
    producerCallSites: 1 as const,
    readinessSelectorPresent: true as const,
    productionSelectorPresent: true as const,
    injectedProducerPresent: false as const,
    injectedReadinessPresent: false as const,
    injectedRendererPresent: false as const,
    producerCalls: 0 as const,
    readinessInvoked: false as const,
    liveInvoked: false as const,
    downstreamAuthority: "denied" as const,
  })
}

export const runV138ReviewedBoundedLiveEnvelopeV11 = async (repoRoot: string): Promise<void> => {
  const ready = authenticateFutureCustody(repoRoot, "pre")
  let producerError: unknown
  let postCustodyError: unknown
  try {
    await runV138V3ProductionLive(repoRoot, {
      validateInputs: false,
      checkPair: () => ({ seal: ready.source.pair.seal, envelope: ready.source.pair.envelope } as never),
    })
  } catch (error) { producerError = error }
  finally {
    try {
      const after = authenticateFutureCustody(repoRoot, "post")
      if (after.canonicalLocalExecutionClosureRoot !== ready.canonicalLocalExecutionClosureRoot)
        fail("V138_LIVE_V11_CANONICAL_LOCAL_CLOSURE_CHANGED")
      assertV138LiveV10PostRunForReview(repoRoot)
    } catch (error) { postCustodyError = error }
  }
  settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)
}

const resolveCurrentSubjectCommit = (root: string): string => {
  const commit = git(root, ["log", "-1", "--format=%H", "--", V138_LIVE_V11_PATHS.source, V138_LIVE_V11_PATHS.tests])
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("V138_LIVE_V11_SUBJECT_COMMIT_INVALID")
  return commit
}

export const executeV138LiveV11Cli = async (
  args: readonly string[],
  injected?: Partial<{ repoRoot: string; writeOutput: (value: string) => void }>,
): Promise<void> => {
  if (args.length !== 1 || !V138_LIVE_V11_MODES.includes(args[0] as never))
    fail("V138_LIVE_V11_ARGUMENTS_INVALID")
  const root = injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const output = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (args[0] === "--run-reviewed-bounded-live-envelope") {
    await runV138ReviewedBoundedLiveEnvelopeV11(root)
    output(`${JSON.stringify({ status: "reviewed_bounded_live_complete" })}\n`)
    return
  }
  if (args[0] === "--check-source-only") {
    const result = authenticateV138LiveV11SourceOnly(root)
    output(`${JSON.stringify({ status: "source_only_checked", plan114V2PayloadRoot: result.plan114V2PayloadRoot,
      plan116V4PayloadRoot: result.plan116V4PayloadRoot, supplementRoot: result.supplementRoot,
      producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, downstreamAuthority: "denied" })}\n`)
    return
  }
  if (args[0] === "--check-prospective-custody" && !pathPresent(root, V138_LIVE_V11_PATHS.plan118Payload)) {
    const source = authenticateV138LiveV11SourceOnly(root)
    output(`${JSON.stringify({ status: "prospective_custody_checked", subjectCommit: resolveCurrentSubjectCommit(root),
      plan114V2PayloadRoot: source.plan114V2PayloadRoot, plan116V4PayloadRoot: source.plan116V4PayloadRoot,
      supplementRoot: source.supplementRoot, producerCalls: 0, readinessInvoked: false,
      liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied" })}\n`)
    return
  }
  const result = authenticateFutureCustody(root, args[0] === "--check-post-run-custody" ? "post" : "pre")
  if (args[0] === "--check-post-run-custody") assertV138LiveV10PostRunForReview(root)
  output(`${JSON.stringify({
    status: args[0] === "--check-post-run-custody" ? "post_run_custody_checked" :
      args[0] === "--check-reviewed-live-ready" ? "reviewed_live_ready" : "prospective_custody_checked",
    payloadRoot: result.payload.payloadRoot,
    producerWouldInvoke: args[0] === "--check-reviewed-live-ready",
    producerCalls: 0, readinessInvoked: false, liveInvoked: false,
    freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied",
  })}\n`)
}

const isEntrypoint = process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isEntrypoint) await executeV138LiveV11Cli(process.argv.slice(2))
