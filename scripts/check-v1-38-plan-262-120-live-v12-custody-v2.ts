import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  chmodSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import {
  deriveV138Plan114IndependentPostSemantics,
  deriveV138Plan114IndependentReproductionSemantics,
  computeV138Plan114IndependentReproductionRoot,
} from "./lib/v1-38-plan-262-114-independent-semantics-v2.js"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import {
  deriveV138PathStableCustody,
  checkV138PathStableCustodyForReview,
  type V138PathStableCustody,
} from "./lib/v1-38-bounded-retry-v3-path-stable-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>
export type V138Plan120Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  subject: string
  detail: string
}>
export type V138Plan120ModeResult = Readonly<{
  modeNames: readonly string[]
  actualModesPassed: number
  producerCalls: 0
  readinessInvoked: false
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  observations: readonly Readonly<{
    mode: string
    status: string
    producerGuardInvocations: 0
    root: Sha
  }>[]
  findings: readonly V138Plan120Finding[]
  observationRoot: Sha
  producerGuardObservationRoot: Sha
  producerGuardInvocations: 0
  reviewedCustody: V138PathStableCustody
  reviewedClosureRoot: Sha
  linkedLocalExecutionClosureRoot: Sha
  sourceTree: string
  sourceParent: string
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  installedClosureRoot: Sha
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const PLAN_120_SUBJECT_COMMIT = "0a85d4906e36b66b3d4d6d7a7269531ae9becf57"
const SUBJECT_TREE = "268ec124d743d6525d5be126e5e89c0526cb7304"
const SUBJECT_PARENT = "1517c6de267c21da33f35bf1c0ee7623cbc030ba"
const SUBJECT_SOURCE_BLOB = "872463aafbb2a835dcb9e530fefd009afeec9d95"
const SUBJECT_TEST_BLOB = "874813e8b9e6a54e8ef9655784415453c801b366"
const REVIEWED_CLOSURE_ROOT = "sha256:4c299ff8d1500c7662de1131b44e45a15b99cc140bc6b2f2c2ce7aed80fab8f3"
const PLAN_117_SUBJECT_COMMIT = "41c716c55cec09a35180cd5229cf2f7545c504d4"
const PLAN_118_PUBLICATION_COMMIT = "e693f8fe1ff74e2c0d1d733c85c422fd68cb467c"
const PLAN_118_ROOTS = Object.freeze({
  payload: "sha256:6a262e4b8e267a6be8858c1247a49ceab3c0dbb23b9ebfea9f675a6e02f527e8",
  review: "sha256:be5bea259659c0b8878a09ff7ca7df991fda9b6702c8bc3b90f38922068d8f16",
  carrier: "sha256:ae957db112a31b563ae5357104351c0c8da90b1de7563d6ab86cfd2223286bcb",
})
const ALLOWED_CORRECTION_COMMIT = "0f8258d888eba27cfaa48a9cc5175e578364077b"
const ALLOWED_CORRECTION_PARENT = "7f65ff66be29de4f655736f60d6c68683fae3e35"
const LIVE_V11_SOURCE_BLOB = "4cb2041a1305db808fe7459a64f331558e5f981c"
const LIVE_V11_REVIEWED_TEST_BLOB = "e5b32103b0355b4abeecfc6f85cf05a92ad787b8"
const LIVE_V11_CORRECTED_TEST_BLOB = "a7d7368c41a95a100c8c144c3a78dfe84aea76d4"
const ALLOWED_HISTORY_ROOT = "sha256:527b9d0ca006b27160278a0723d4978c34074738b23334b4a297e98527eaf059"
const PLAN_114_COMMITS = Object.freeze([
  "ab539ab2b3706981aaeb053b3fafce6b46532b40",
  "34bc94ec4e348f71e6055a091d60a505cffc0d79",
] as const)
const PLAN_114_ROOTS = Object.freeze([
  Object.freeze({ payload: "sha256:7a414ac6d41af084e785e9eaed4fc28835806bf1aa339be571befab114e9d857", review: "sha256:ab85273e90e40749324b270db1bfc5275b29fbb20b7eebcf9d6d776fe7a0cdec", carrier: "sha256:4fba941b15a1435d37d99a1847e44f8bdbb8d5ecafa7a1d8c3b9b60b81dc38fc" }),
  Object.freeze({ payload: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac", review: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee", carrier: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26" }),
] as const)
const PLAN_116_COMMITS = Object.freeze([
  "e1e75fc6ef177a8213d903f1ec365d86f37cf62a",
  "2219a36b62b41b45626ed93f13f43edb36463e61",
  "1c0862e16ff4a32add4308e481df567b1212eb0c",
  "f03f0e05539a1591b91000fc9d35b8381a082ec2",
] as const)
const PLAN_116_ROOTS = Object.freeze([
  Object.freeze({ payload: "sha256:b10df97b08ac7e23b7b48f645f16a7f086c431580769e70d171cd9c6ee93cfb5", review: "sha256:f3d5eee2701dba2617594ecf28cd57f6dee52d2d087d241d6b59c6fb69943230", carrier: "sha256:56a6a1a9bc76bc99fe7de7f77e70c45b46cf5ed8ab3b3baf5b27868f66d45e0b" }),
  Object.freeze({ payload: "sha256:08a648525023db9d193bd377c1bda0ab5e9d8534d4681b8931228da4889ab264", review: "sha256:622a7fc1bc37701414f152246f347d31e841d27aaeed8589d6b2b14bdbaf84af", carrier: "sha256:aeddda11d0632711d61face9f01e1fefe7778b12c2b3621c139225446f8c0e12" }),
  Object.freeze({ payload: "sha256:a7028015d8d45381cab4a2be7232239b00830c3839dfdd4e790204e5e3bb64c6", review: "sha256:12fae1e53ce2706d1e456e995b335c4e428046087ae510f8f6d24275ce3d6050", carrier: "sha256:1aba12b4ad9e75d42b58be0b606cb661fd04b3fa090588ddb30676949209e0c8" }),
  Object.freeze({ payload: "sha256:251b01b973f1abde239089e6e49dc6c38c74803a273fa6f104a6cdda156de1d7", review: "sha256:d238645459920ba74d9e8265f5b0c0609e636f86d027a2e7f473058f746aedf3", carrier: "sha256:3d665d7f562b575a9b2ffdeafbe1458922e2687bd75b32027b39cb67c0a7632b" }),
] as const)
const SUPPLEMENT_COMMIT = "a1e693a2ae528ba06597d3262041d6f947ecbeca"
const SUPPLEMENT_ROOT = "sha256:3a653c44db658a89250d4b90d9a3bb086c99ac3fc04ebf8c7107bc66fd4f8e4b"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
})
export const V138_PLAN120_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.test.ts",
  payload: ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-payload-v2.json",
  review: `${PHASE}/262-120-REVIEW-v2.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-carrier-v2.json",
  supplement: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
})
const REVIEW_PATHS = Object.freeze([V138_PLAN120_PATHS.payload, V138_PLAN120_PATHS.review, V138_PLAN120_PATHS.carrier])
const PLAN_118_V1_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-payload-v1.json",
  `${PHASE}/262-118-REVIEW.md`,
  ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-carrier-v1.json",
] as const)
const LIVE_V11_PATHS = Object.freeze([
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.test.ts",
] as const)
const SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  V138_PLAN120_PATHS.source,
  V138_PLAN120_PATHS.tests,
] as const)
const PRODUCER_OUTPUTS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
])
const DOWNSTREAM_OUTPUTS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-private-receipt-manifest-v3.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
])

const fail = (code: string): never => { throw new TypeError(code) }
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => Array.isArray(item)
    ? item.map(normalize)
    : item !== null && typeof item === "object"
      ? Object.fromEntries(Object.entries(item as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, normalize(child)]))
      : item
  return `${JSON.stringify(normalize(value))}\n`
}
const sha = (bytes: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => path.join(path.resolve(root), ...repoPath.split("/"))
const git = (root: string, args: readonly string[], allowFailure = false): string =>
  runV138RetryV3IsolatedGit(root, args, allowFailure)
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const present = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (present(root, repoPath)) fail(`V138_PLAN120_FORBIDDEN_PRESENT:${repoPath}`)
}
const readNoFollow = (root: string, repoPath: string, mode = 0o644): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (before.mode & 0o7777) !== mode || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN120_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN120_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN120_")) throw error
    fail(`V138_PLAN120_CURRENT_ENTRY_INVALID:${repoPath}`)
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
const ancestor = (root: string, commit: string): void => {
  if (git(root, ["merge-base", "--is-ancestor", commit, "HEAD"], true) !== "")
    fail(`V138_PLAN120_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_PLAN120_SUCCESSOR_REWRITE:${paths[0]}`)
}
const exactAddPublication = (root: string, commit: string, paths: readonly string[]) => {
  ancestor(root, commit)
  const actual = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).sort()
  const expected = paths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN120_PUBLICATION_SCOPE_INVALID")
  const bytes = paths.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath])
    if (!entry.startsWith("100644 blob ") || !entry.endsWith(`\t${repoPath}`))
      fail(`V138_PLAN120_PUBLICATION_MODE_INVALID:${repoPath}`)
    const committed = gitBytes(root, commit, repoPath)
    if (!readNoFollow(root, repoPath).equals(committed))
      fail(`V138_PLAN120_PUBLICATION_BYTES_INVALID:${repoPath}`)
    return committed
  })
  noRewrite(root, commit, paths)
  return bytes
}
const plan114Paths = (version: number) => [
  `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v${version}.json`,
  version === 1 ? `${PHASE}/262-114-REVIEW.md` : `${PHASE}/262-114-REVIEW-v${version}.md`,
  `.planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v${version}.json`,
] as const
const plan116Paths = (version: number) => [
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v${version}.json`,
  version === 1 ? `${PHASE}/262-116-REVIEW.md` : `${PHASE}/262-116-REVIEW-v${version}.md`,
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v${version}.json`,
] as const

const authenticateHistory = (root: string): void => {
  for (const [index, commit] of PLAN_114_COMMITS.entries()) {
    const paths = plan114Paths(index + 1)
    const bytes = exactAddPublication(root, commit, paths)
    const payload = jsonBytes(bytes[0]!, "V138_PLAN120_PLAN114_PAYLOAD_INVALID")
    const carrier = jsonBytes(bytes[2]!, "V138_PLAN120_PLAN114_CARRIER_INVALID")
    const roots = PLAN_114_ROOTS[index]!
    if (payload.payloadRoot !== roots.payload || carrier.reviewRoot !== roots.review ||
        carrier.carrierRoot !== roots.carrier || payload.findingCount !== 0 ||
        payload.actualModesPassed !== 6 || payload.authorizesExecution !== false ||
        payload.liveInvoked !== false || payload.downstreamAuthority !== "denied" ||
        (index === 1 && (payload.plan109Eligible !== true ||
          payload.supersedesPublicationCommit !== PLAN_114_COMMITS[0])))
      fail(`V138_PLAN120_PLAN114_V${index + 1}_SEMANTICS_INVALID`)
  }
  for (const [index, commit] of PLAN_116_COMMITS.entries()) {
    const paths = plan116Paths(index + 1)
    const bytes = exactAddPublication(root, commit, paths)
    const payload = jsonBytes(bytes[0]!, "V138_PLAN120_PLAN116_PAYLOAD_INVALID")
    const carrier = jsonBytes(bytes[2]!, "V138_PLAN120_PLAN116_CARRIER_INVALID")
    const roots = PLAN_116_ROOTS[index]!
    if (payload.payloadRoot !== roots.payload || carrier.reviewRoot !== roots.review ||
        carrier.carrierRoot !== roots.carrier || payload.findingCount !== 0 ||
        payload.actualModesPassed !== 9 || payload.plan109Eligible !== true ||
        payload.authorizesExecution !== false || payload.producerCalls !== 0 ||
        payload.readinessInvoked !== false || payload.liveInvoked !== false ||
        payload.downstreamAuthority !== "denied")
      fail(`V138_PLAN120_PLAN116_V${index + 1}_SEMANTICS_INVALID`)
  }
  const supplement = jsonBytes(readNoFollow(root, V138_PLAN120_PATHS.supplement),
    "V138_PLAN120_SUPPLEMENT_INVALID")
  const supplementEntry = git(root, ["ls-tree", SUPPLEMENT_COMMIT, "--", V138_PLAN120_PATHS.supplement])
  if (!supplementEntry.startsWith("100644 blob f5953ea37f8648fa85790f97f536d92f94f999e7\t") ||
      !readNoFollow(root, V138_PLAN120_PATHS.supplement).equals(
        gitBytes(root, SUPPLEMENT_COMMIT, V138_PLAN120_PATHS.supplement)) ||
      supplement.supplementRoot !== SUPPLEMENT_ROOT || supplement.authorizesExecution !== false ||
      supplement.createsCapacity !== false || supplement.resetsCounters !== false ||
      canonical(supplement.counters) !== canonical(ZERO_COUNTERS) ||
      supplement.downstreamAuthority !== "denied") fail("V138_PLAN120_SUPPLEMENT_SEMANTICS_INVALID")
  noRewrite(root, SUPPLEMENT_COMMIT, [V138_PLAN120_PATHS.supplement])
  const seal = jsonBytes(readNoFollow(root, V138_PLAN120_PATHS.seal, 0o600), "V138_PLAN120_SEAL_INVALID")
  const envelope = jsonBytes(readNoFollow(root, V138_PLAN120_PATHS.envelope, 0o600), "V138_PLAN120_ENVELOPE_INVALID")
  if (!readNoFollow(root, V138_PLAN120_PATHS.seal, 0o600).equals(gitBytes(root, PAIR_COMMIT, V138_PLAN120_PATHS.seal)) ||
      !readNoFollow(root, V138_PLAN120_PATHS.envelope, 0o600).equals(gitBytes(root, PAIR_COMMIT, V138_PLAN120_PATHS.envelope)) ||
      seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.sealRoot !== SEAL_ROOT || envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      envelope.status !== "sealed_inactive" || canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      envelope.policy.phase263PlanningAuthorized !== false || envelope.policy.candidateSearchAuthorized !== false ||
      envelope.policy.formationMaterializationAuthorized !== false || envelope.policy.holdoutOpeningAuthorized !== false ||
      envelope.policy.publicAuthorized !== false || envelope.policy.productAuthorized !== false ||
      envelope.policy.productionAuthorized !== false || envelope.policy.gameplayChangeAuthorized !== false)
    fail("V138_PLAN120_PAIR_SEMANTICS_INVALID")
  noRewrite(root, PAIR_COMMIT, [V138_PLAN120_PATHS.seal, V138_PLAN120_PATHS.envelope])
}

const authenticateAllowedHistory = (root: string): void => {
  const reviewBytes = exactAddPublication(root, PLAN_118_PUBLICATION_COMMIT, PLAN_118_V1_PATHS)
  const reviewPayload = jsonBytes(reviewBytes[0]!, "V138_PLAN120_PLAN118_PAYLOAD_INVALID")
  const reviewCarrier = jsonBytes(reviewBytes[2]!, "V138_PLAN120_PLAN118_CARRIER_INVALID")
  if (reviewPayload.payloadRoot !== PLAN_118_ROOTS.payload ||
      reviewCarrier.reviewRoot !== PLAN_118_ROOTS.review ||
      reviewCarrier.carrierRoot !== PLAN_118_ROOTS.carrier ||
      reviewPayload.subjectCommit !== PLAN_117_SUBJECT_COMMIT ||
      reviewPayload.findingCount !== 0 || reviewPayload.actualModesPassed !== 6 ||
      reviewPayload.plan110Eligible !== true || reviewPayload.authorizesExecution !== false ||
      reviewPayload.producerCalls !== 0 || reviewPayload.readinessInvoked !== false ||
      reviewPayload.liveInvoked !== false || reviewPayload.freshCharged !== 0 ||
      reviewPayload.freshAccepted !== 0 || reviewPayload.downstreamAuthority !== "denied")
    fail("V138_PLAN120_PLAN118_SEMANTICS_INVALID")

  ancestor(root, PLAN_117_SUBJECT_COMMIT)
  ancestor(root, ALLOWED_CORRECTION_COMMIT)
  if (git(root, ["rev-parse", `${ALLOWED_CORRECTION_COMMIT}^`]) !== ALLOWED_CORRECTION_PARENT ||
      git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", ALLOWED_CORRECTION_COMMIT]) !==
        `M\t${LIVE_V11_PATHS[1]}`)
    fail("V138_PLAN120_ALLOWED_CORRECTION_ANCESTRY_INVALID")
  const reviewedEntries = [
    [LIVE_V11_PATHS[0], LIVE_V11_SOURCE_BLOB],
    [LIVE_V11_PATHS[1], LIVE_V11_REVIEWED_TEST_BLOB],
  ] as const
  for (const [repoPath, blob] of reviewedEntries)
    if (git(root, ["ls-tree", PLAN_117_SUBJECT_COMMIT, "--", repoPath]) !==
        `100644 blob ${blob}\t${repoPath}`)
      fail(`V138_PLAN120_PLAN117_ENTRY_INVALID:${repoPath}`)
  if (git(root, ["ls-tree", ALLOWED_CORRECTION_COMMIT, "--", LIVE_V11_PATHS[0]]) !==
        `100644 blob ${LIVE_V11_SOURCE_BLOB}\t${LIVE_V11_PATHS[0]}` ||
      git(root, ["ls-tree", ALLOWED_CORRECTION_COMMIT, "--", LIVE_V11_PATHS[1]]) !==
        `100644 blob ${LIVE_V11_CORRECTED_TEST_BLOB}\t${LIVE_V11_PATHS[1]}` ||
      !readNoFollow(root, LIVE_V11_PATHS[0]).equals(
        gitBytes(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS[0])) ||
      !readNoFollow(root, LIVE_V11_PATHS[1]).equals(
        gitBytes(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS[1])))
    fail("V138_PLAN120_ALLOWED_CORRECTION_ENTRY_INVALID")

  const allowedHistory = rooted("v138-plan-262-119-live-v12-allowed-history-v1", {
    plan117SubjectCommit: PLAN_117_SUBJECT_COMMIT,
    plan118PublicationCommit: PLAN_118_PUBLICATION_COMMIT,
    plan118PayloadRoot: PLAN_118_ROOTS.payload,
    plan118ReviewRoot: PLAN_118_ROOTS.review,
    plan118CarrierRoot: PLAN_118_ROOTS.carrier,
    allowedCorrectionCommit: ALLOWED_CORRECTION_COMMIT,
    allowedCorrectionParent: ALLOWED_CORRECTION_PARENT,
    liveV11SourceBlob: LIVE_V11_SOURCE_BLOB,
    liveV11ReviewedTestBlob: LIVE_V11_REVIEWED_TEST_BLOB,
    liveV11CorrectedTestBlob: LIVE_V11_CORRECTED_TEST_BLOB,
  })
  if (allowedHistory !== ALLOWED_HISTORY_ROOT) fail("V138_PLAN120_ALLOWED_HISTORY_ROOT_INVALID")
  noRewrite(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS)
}

const authenticateSubject = (root: string): V138PathStableCustody => {
  ancestor(root, PLAN_120_SUBJECT_COMMIT)
  if (git(root, ["rev-parse", `${PLAN_120_SUBJECT_COMMIT}^{tree}`]) !== SUBJECT_TREE ||
      git(root, ["rev-parse", `${PLAN_120_SUBJECT_COMMIT}^`]) !== SUBJECT_PARENT)
    fail("V138_PLAN120_SUBJECT_IDENTITY_INVALID")
  const entries = [
    [V138_PLAN120_PATHS.source, SUBJECT_SOURCE_BLOB],
    [V138_PLAN120_PATHS.tests, SUBJECT_TEST_BLOB],
  ] as const
  for (const [repoPath, blob] of entries) {
    const entry = git(root, ["ls-tree", PLAN_120_SUBJECT_COMMIT, "--", repoPath])
    if (entry !== `100644 blob ${blob}\t${repoPath}` ||
        !readNoFollow(root, repoPath).equals(gitBytes(root, PLAN_120_SUBJECT_COMMIT, repoPath)))
      fail(`V138_PLAN120_SUBJECT_ENTRY_INVALID:${repoPath}`)
  }
  noRewrite(root, PLAN_120_SUBJECT_COMMIT, [V138_PLAN120_PATHS.source, V138_PLAN120_PATHS.tests])
  const closure = deriveV138PathStableCustody(root, {
    sourceCommit: PLAN_120_SUBJECT_COMMIT,
    checkoutPaths: SOURCE_PATHS,
  })
  checkV138PathStableCustodyForReview(closure, closure)
  if (closure.reviewedClosureRoot !== REVIEWED_CLOSURE_ROOT || closure.sourceTree !== SUBJECT_TREE ||
      closure.sourceParent !== SUBJECT_PARENT || canonical(closure.checkoutPaths) !== canonical(SOURCE_PATHS) ||
      closure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_PLAN120_REVIEWED_CLOSURE_INVALID")
  return closure
}

export const inspectV138Plan120BoundarySourceForReview = (source: string) => {
  const sourceFile = ts.createSourceFile(V138_PLAN120_PATHS.source, source,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = sourceFile.statements.filter((statement): statement is ts.ImportDeclaration =>
    ts.isImportDeclaration(statement) && statement.moduleSpecifier.getText(sourceFile) ===
      '"./run-v1-38-bounded-retry-envelope-v3.js"')
  const bindings = imports.flatMap((statement) => {
    const named = statement.importClause?.namedBindings
    return named !== undefined && ts.isNamedImports(named) ? [...named.elements] : []
  })
  let references = 0
  let calls = 0
  let directAwaited = false
  let producerCall: ts.CallExpression | undefined
  let reviewedOwnerReferences = 0
  let reviewedOwnerCalls = 0
  let reviewedOwnerCall: ts.CallExpression | undefined
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === "runV138V3ProductionLive") references += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138V3ProductionLive") {
      calls += 1
      directAwaited = ts.isAwaitExpression(node.parent)
      producerCall = node
    }
    if (ts.isIdentifier(node) && node.text === "runV138ReviewedBoundedLiveEnvelopeV12")
      reviewedOwnerReferences += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138ReviewedBoundedLiveEnvelopeV12") {
      reviewedOwnerCalls += 1
      reviewedOwnerCall = node
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  const enclosingVariable = (node: ts.Node | undefined): string | undefined => {
    for (let current = node?.parent; current !== undefined; current = current.parent)
      if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text
    return undefined
  }
  const enclosingIf = (node: ts.Node | undefined): ts.IfStatement | undefined => {
    for (let current = node?.parent; current !== undefined; current = current.parent)
      if (ts.isIfStatement(current)) return current
    return undefined
  }
  const producerOwner = enclosingVariable(producerCall)
  const dispatchOwner = enclosingVariable(reviewedOwnerCall)
  const dispatchIf = enclosingIf(reviewedOwnerCall)
  const exactProductionCondition = dispatchIf?.expression.getText(sourceFile) ===
    'args[0] === "--run-reviewed-bounded-live-envelope"'
  if (imports.length !== 1 || bindings.length !== 2 ||
      !bindings.some((binding) => binding.name.text === "runV138V3ProductionLive" && binding.propertyName === undefined) ||
      references !== 2 || calls !== 1 || !directAwaited ||
      producerOwner !== "runV138ReviewedBoundedLiveEnvelopeV12" ||
      reviewedOwnerReferences !== 2 || reviewedOwnerCalls !== 1 ||
      !ts.isAwaitExpression(reviewedOwnerCall?.parent) ||
      dispatchOwner !== "executeV138LiveV12Cli" || !exactProductionCondition ||
      !source.includes('"--check-reviewed-live-ready"') ||
      !source.includes('"--run-reviewed-bounded-live-envelope"') ||
      /runV138ReviewedBoundedLiveEnvelopeV12\s*=\s*async\s*\([^)]*,/u.test(source) ||
      /(?:injectedProducer|injectedReadiness|injectedRenderer)\??\s*:/u.test(source) ||
      /Partial<\{[^}]*?(?:producer|readiness|renderer)/su.test(source))
    fail("V138_PLAN120_PRODUCTION_BOUNDARY_INVALID")
  return Object.freeze({ producerCallSites: 1 as const, producerCalls: 0 as const,
    producerOwner: "runV138ReviewedBoundedLiveEnvelopeV12" as const,
    productionDispatchCondition: 'args[0] === "--run-reviewed-bounded-live-envelope"' as const,
    readinessInvoked: false as const, liveInvoked: false as const, downstreamAuthority: "denied" as const })
}

const authenticateFoundation = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateHistory(root)
  authenticateAllowedHistory(root)
  const closure = authenticateSubject(root)
  inspectV138Plan120BoundarySourceForReview(readNoFollow(root, V138_PLAN120_PATHS.source).toString("utf8"))
  assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return Object.freeze({ closure })
}

const payloadRoot = (body: Json): Sha => rooted("v138-plan-262-120-live-v12-custody-review-payload-v2", body)
const reviewRoot = (body: Json): Sha => rooted("v138-plan-262-120-live-v12-custody-review-markdown-v2", body)
const carrierRoot = (body: Json): Sha => rooted("v138-plan-262-120-live-v12-custody-review-carrier-v2", body)

const renderEvidence = (input: {
  closure: V138PathStableCustody
  linkedLocalExecutionClosureRoot: Sha
  findings: readonly V138Plan120Finding[]
  actualModesPassed: number
  observationRoot?: Sha
}) => {
  const findings = [...input.findings].sort((a, b) =>
    `${a.code}\0${a.subject}\0${a.detail}`.localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const zero = findings.length === 0 && input.actualModesPassed === 6
  const body = {
    schemaVersion: "v1.38-plan-262-120-live-v12-custody-review-payload-v2",
    protocol: "independent-live-v12-executable-custody-review-v2",
    subjectCommit: PLAN_120_SUBJECT_COMMIT,
    sourceTree: input.closure.sourceTree,
    sourceParent: input.closure.sourceParent,
    checkoutManifestRoot: input.closure.checkoutManifestRoot,
    recursiveDependencyRoot: input.closure.recursiveDependencyRoot,
    recursiveDependencyCount: input.closure.recursiveDependencyCount,
    installedClosureRoot: input.closure.installedClosureRoot,
    nodeSha256: input.closure.nodeSha256,
    pnpmDistributionSha256: input.closure.pnpmDistributionSha256,
    pathStableNativeSourcesRoot: input.closure.pathStableNativeSourcesRoot,
    gitExecutableSha256: input.closure.gitExecutableSha256,
    hardenedGitArgumentsRoot: input.closure.hardenedGitArgumentsRoot,
    reviewedClosureRoot: input.closure.reviewedClosureRoot,
    reviewedLocalExecutionClosureRoot: input.linkedLocalExecutionClosureRoot,
    localInstalledClosureRoot: input.closure.localInstalledClosureRoot,
    localGitObjectRoot: input.closure.localGitObjectRoot,
    localNativeSourcesRoot: input.closure.localNativeSourcesRoot,
    plan114V2PublicationCommit: PLAN_114_COMMITS[1],
    plan114V2PayloadRoot: PLAN_114_ROOTS[1].payload,
    plan116V4PublicationCommit: PLAN_116_COMMITS[3],
    plan116V4PayloadRoot: PLAN_116_ROOTS[3].payload,
    supplementPublicationCommit: SUPPLEMENT_COMMIT,
    supplementRoot: SUPPLEMENT_ROOT,
    pairCommit: PAIR_COMMIT,
    sealRoot: SEAL_ROOT,
    envelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    allowedHistoryRoot: ALLOWED_HISTORY_ROOT,
    plan117SubjectCommit: PLAN_117_SUBJECT_COMMIT,
    plan118PublicationCommit: PLAN_118_PUBLICATION_COMMIT,
    plan118PayloadRoot: PLAN_118_ROOTS.payload,
    plan118ReviewRoot: PLAN_118_ROOTS.review,
    plan118CarrierRoot: PLAN_118_ROOTS.carrier,
    allowedCorrectionCommit: ALLOWED_CORRECTION_COMMIT,
    allowedCorrectionParent: ALLOWED_CORRECTION_PARENT,
    liveV11SourceBlob: LIVE_V11_SOURCE_BLOB,
    liveV11ReviewedTestBlob: LIVE_V11_REVIEWED_TEST_BLOB,
    liveV11CorrectedTestBlob: LIVE_V11_CORRECTED_TEST_BLOB,
    counters: ZERO_COUNTERS,
    reviewStatus: zero ? "zero_findings" : "blocked",
    findings,
    findingCount: findings.length,
    actualModesPassed: input.actualModesPassed,
    plan110Eligible: zero,
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
  const payload = Object.freeze({ ...body, payloadRoot: payloadRoot(body) })
  const rBody = {
    payloadRoot: payload.payloadRoot,
    reviewedClosureRoot: payload.reviewedClosureRoot,
    findingCount: findings.length,
    actualModesPassed: input.actualModesPassed,
    plan110Eligible: zero,
    producerCalls: 0,
    downstreamAuthority: "denied",
  }
  const rRoot = reviewRoot(rBody)
  const reviewBytes = zero
    ? Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "120"\nreview_type: independent_live_v12_executable_custody_v2\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 120 Independent Live-v12 Executable-Custody Review v2\n\n**ZERO FINDINGS.** Six producer-incapable modes passed. Only revised Plan 110 is eligible. Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Fresh charged/accepted: 0/0. Downstream authority: denied.\n`)
    : Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "120"\nreview_type: independent_live_v12_executable_custody_v2\nstatus: blocked\nfinding_count: ${findings.length}\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 120 Independent Live-v12 Executable-Custody Review v2\n\n**BLOCKED.** Finding codes: ${findings.map(({ code }) => code).join(", ")}. Actual producer-incapable modes passed: ${input.actualModesPassed}/6. Plan 110 eligible: false. Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Downstream authority: denied.\n`)
  const cBody = {
    schemaVersion: "v1.38-plan-262-120-live-v12-custody-review-carrier-v2",
    protocol: "nonrecursive-external-review-carrier-v1",
    payloadRoot: payload.payloadRoot,
    reviewRoot: rRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: sha(Buffer.from(canonical(payload))),
    reviewSha256: sha(reviewBytes),
    findingCount: findings.length,
    actualModesPassed: input.actualModesPassed,
    subjectCommit: PLAN_120_SUBJECT_COMMIT,
    plan110Eligible: zero,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...cBody, carrierRoot: carrierRoot(cBody) })
  return Object.freeze({ payload, reviewBytes, reviewRoot: rRoot, carrier })
}

const modeObservation = (mode: string, status: string, value: unknown, producerGuardInvocations: 0) => Object.freeze({
  mode, status, producerGuardInvocations,
  root: rooted("v138-plan-262-120-mode-observation-v2", { value, producerGuardInvocations }),
})
const toolPath = (): string => `${path.dirname(process.execPath)}:/usr/bin:/bin`
const run = (executable: string, args: readonly string[], cwd: string, home: string): string =>
  execFileSync(executable, [...args], { cwd, encoding: "utf8",
    env: { PATH: toolPath(), HOME: home, LANG: "C", LC_ALL: "C" },
    stdio: ["ignore", "pipe", "pipe"] }).trim()
const linkDependencies = (sourceRoot: string, linkedRoot: string): void => {
  symlinkSync(path.join(sourceRoot, "node_modules"), path.join(linkedRoot, "node_modules"), "dir")
  for (const workspace of ["apps/runtime-service", "apps/web", "apps/worker", "packages/engine",
    "packages/golden", "packages/map-configs", "packages/persistence", "packages/replay",
    "packages/runtime-js", "packages/runtime-python", "packages/runtime-supervisor",
    "packages/runtime-wasm-wasi", "packages/service", "packages/spec", "packages/test-utils"]) {
    const source = path.join(sourceRoot, workspace, "node_modules")
    if (!existsSync(source)) continue
    const destination = path.join(linkedRoot, workspace, "node_modules")
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(source, destination, "dir")
  }
}

export const executeV138Plan120DisposableModes = (repoRootInput: string): V138Plan120ModeResult => {
  const repoRoot = path.resolve(repoRootInput)
  const foundation = authenticateFoundation(repoRoot)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan120-"))
  const linked = path.join(owner, "repo")
  let added = false
  try {
    run("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", linked, PLAN_120_SUBJECT_COMMIT], repoRoot, owner)
    added = true
    linkDependencies(repoRoot, linked)
    chmodSync(target(linked, V138_PLAN120_PATHS.seal), 0o600)
    chmodSync(target(linked, V138_PLAN120_PATHS.envelope), 0o600)
    const tsx = path.join(linked, "node_modules/.bin/tsx")
    const reviewerProcessClosure = authenticateSubject(linked)
    const closureRunner = path.join(linked, ".plan120-linked-closure.ts")
    writeFileSync(closureRunner,
      `import { deriveV138PathStableCustody } from './scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts'; const value=deriveV138PathStableCustody(process.cwd(), { sourceCommit:${JSON.stringify(PLAN_120_SUBJECT_COMMIT)}, checkoutPaths:${JSON.stringify(SOURCE_PATHS)} }); process.stdout.write(JSON.stringify(value));`,
      { mode: 0o600, flag: "wx" })
    const linkedClosureResult = spawnSync(tsx, [closureRunner], { cwd: linked, encoding: "utf8",
      env: { PATH: toolPath(), HOME: owner, LANG: "C", LC_ALL: "C" }, stdio: ["ignore", "pipe", "pipe"] })
    rmSync(closureRunner, { force: true })
    if (linkedClosureResult.error !== undefined || linkedClosureResult.status !== 0)
      fail("V138_PLAN120_LINKED_CLOSURE_PROCESS_INVALID")
    const linkedClosure = JSON.parse(linkedClosureResult.stdout) as V138PathStableCustody
    checkV138PathStableCustodyForReview(linkedClosure, linkedClosure)
    if (linkedClosure.reviewedClosureRoot !== foundation.closure.reviewedClosureRoot)
      fail("V138_PLAN120_LINKED_CLOSURE_INVALID")
    if (reviewerProcessClosure.reviewedClosureRoot !== linkedClosure.reviewedClosureRoot)
      fail("V138_PLAN120_LINKED_PORTABLE_CLOSURE_INVALID")
    const boundary = inspectV138Plan120BoundarySourceForReview(readNoFollow(linked, V138_PLAN120_PATHS.source).toString("utf8"))
    const observations: Array<ReturnType<typeof modeObservation>> = []
    const findings: V138Plan120Finding[] = []
    const guardPath = path.join(owner, "producer-invocation-guard.jsonl")
    const guardedPath = path.join(linked, "scripts/.plan120-live-v12-guarded.ts")
    const exactSource = readNoFollow(linked, V138_PLAN120_PATHS.source).toString("utf8")
    const aliasedSource = exactSource.replace(
      "  runV138V3ProductionLive,\n",
      "  runV138V3ProductionLive as importedRunV138V3ProductionLive,\n",
    )
    if (aliasedSource === exactSource) fail("V138_PLAN120_GUARD_INSTRUMENTATION_INVALID")
    const guardedSource = aliasedSource.replace(
      "type Sha = `sha256:${string}`",
      `import { appendFileSync as appendV138Plan120ProducerGuard } from "node:fs"\nconst runV138V3ProductionLive: typeof importedRunV138V3ProductionLive = async (..._args) => { appendV138Plan120ProducerGuard(${JSON.stringify(guardPath)}, "invoked\\n", { mode: 0o600 }); throw new Error("V138_PLAN120_PRODUCER_GUARD_TRIPPED") }\n\ntype Sha = \`sha256:\${string}\``,
    )
    if (guardedSource === aliasedSource) fail("V138_PLAN120_GUARD_INSTRUMENTATION_INVALID")
    writeFileSync(guardedPath, guardedSource, { mode: 0o600, flag: "wx" })
    const guardInvocations = (): number => {
      if (!existsSync(guardPath)) return 0
      const entry = lstatSync(guardPath)
      if (!entry.isFile() || entry.isSymbolicLink() || (entry.mode & 0o7777) !== 0o600)
        fail("V138_PLAN120_PRODUCER_GUARD_INVALID")
      return readFileSync(guardPath, "utf8").split("\n").filter(Boolean).length
    }
    let expectedPostPayloadRoot: Sha | undefined
    const cli = (name: string, selector: string, expectedStatus: string, code: string): void => {
      const beforeGuard = guardInvocations()
      const result = spawnSync(tsx, ["scripts/.plan120-live-v12-guarded.ts", selector], { cwd: linked, encoding: "utf8",
        env: { PATH: toolPath(), HOME: owner, LANG: "C", LC_ALL: "C" }, stdio: ["ignore", "pipe", "pipe"] })
      const afterGuard = guardInvocations()
      const guardClean = beforeGuard === 0 && afterGuard === 0
      if (result.error !== undefined || result.status === null) fail(`V138_PLAN120_MODE_PROCESS_INTEGRITY:${selector}`)
      if (result.status !== 0) {
        const detail = result.stderr.trim() || `exit:${String(result.status)}`
        findings.push({ code, severity: "critical", subject: selector, detail })
        if (!guardClean) findings.push({ code: "PRODUCER_GUARD_TRIPPED", severity: "critical",
          subject: selector, detail: `before:${beforeGuard};after:${afterGuard}` })
        observations.push(modeObservation(name, "failed", { detail }, 0))
        return
      }
      let value: Json
      try { value = JSON.parse(result.stdout.trim()) as Json }
      catch { fail(`V138_PLAN120_MODE_PROCESS_INTEGRITY:${selector}:json`) }
      const commonValid = value.status === expectedStatus && value.freshCharged === 0 &&
        value.freshAccepted === 0 && value.downstreamAuthority === "denied"
      const selectorValid = selector === "--check-source-only"
        ? value.plan114V2PayloadRoot === PLAN_114_ROOTS[1].payload &&
          value.plan116V4PayloadRoot === PLAN_116_ROOTS[3].payload && value.supplementRoot === SUPPLEMENT_ROOT
        : selector === "--check-prospective-custody"
          ? value.subjectCommit === PLAN_120_SUBJECT_COMMIT &&
            value.reviewedClosureRoot === REVIEWED_CLOSURE_ROOT &&
            value.plan114V2PayloadRoot === PLAN_114_ROOTS[1].payload &&
            value.plan116V4PayloadRoot === PLAN_116_ROOTS[3].payload && value.supplementRoot === SUPPLEMENT_ROOT
          : expectedPostPayloadRoot !== undefined && value.payloadRoot === expectedPostPayloadRoot
      const valid = guardClean && commonValid && selectorValid
      if (!valid) findings.push({ code, severity: "critical", subject: selector, detail: canonical(value).trim() })
      if (!guardClean) findings.push({ code: "PRODUCER_GUARD_TRIPPED", severity: "critical",
        subject: selector, detail: `before:${beforeGuard};after:${afterGuard}` })
      const independentBoundResult = selector === "--check-source-only"
        ? { status: expectedStatus, plan114V2PayloadRoot: PLAN_114_ROOTS[1].payload,
          plan116V4PayloadRoot: PLAN_116_ROOTS[3].payload, supplementRoot: SUPPLEMENT_ROOT }
        : selector === "--check-prospective-custody"
          ? { status: expectedStatus, subjectCommit: PLAN_120_SUBJECT_COMMIT,
            reviewedClosureRoot: REVIEWED_CLOSURE_ROOT, plan114V2PayloadRoot: PLAN_114_ROOTS[1].payload,
            plan116V4PayloadRoot: PLAN_116_ROOTS[3].payload, supplementRoot: SUPPLEMENT_ROOT }
          : { status: expectedStatus, payloadRoot: expectedPostPayloadRoot }
      observations.push(modeObservation(name, valid ? expectedStatus : "failed", independentBoundResult, 0))
    }
    cli("source_only_cli", "--check-source-only", "source_only_checked", "MODE_SOURCE_ONLY_FAILED")
    cli("prospective_custody_cli", "--check-prospective-custody", "prospective_custody_checked",
      "MODE_PROSPECTIVE_CUSTODY_FAILED")
    const candidate = renderEvidence({ closure: linkedClosure,
      linkedLocalExecutionClosureRoot: linkedClosure.localExecutionClosureRoot, findings: [], actualModesPassed: 6 })
    expectedPostPayloadRoot = candidate.payload.payloadRoot
    for (const [repoPath, bytes] of [[V138_PLAN120_PATHS.payload, Buffer.from(canonical(candidate.payload))],
      [V138_PLAN120_PATHS.review, candidate.reviewBytes],
      [V138_PLAN120_PATHS.carrier, Buffer.from(canonical(candidate.carrier))]] as const) {
      mkdirSync(path.dirname(target(linked, repoPath)), { recursive: true })
      writeFileSync(target(linked, repoPath), bytes, { mode: 0o644, flag: "wx" })
    }
    run("/usr/bin/git", ["add", "--", ...REVIEW_PATHS], linked, owner)
    run("/usr/bin/git", ["-c", "user.name=Plan 120 Disposable", "-c", "user.email=plan120@example.invalid",
      "commit", "--quiet", "-m", "disposable Plan 120 trio"], linked, owner)
    cli("post_no_effect_cli", "--check-post-run-custody", "post_run_custody_checked",
      "MODE_POST_NO_EFFECT_FAILED")

    const runner = path.join(linked, ".plan120-mode-runner.ts")
    const runValue = (expression: string): Json => {
      writeFileSync(runner,
        `import * as subject from './scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts'; try { const value=${expression}; process.stdout.write(JSON.stringify({kind:'value',value})); } catch (error) { process.stdout.write(JSON.stringify({kind:'rejection',detail:error instanceof Error ? error.name+':'+error.message : String(error)})); }`,
        { mode: 0o600 })
      const result = spawnSync(tsx, [runner], { cwd: linked, encoding: "utf8",
        env: { PATH: toolPath(), HOME: owner, LANG: "C", LC_ALL: "C" }, stdio: ["ignore", "pipe", "pipe"] })
      rmSync(runner, { force: true })
      if (result.error !== undefined || result.status !== 0) fail("V138_PLAN120_VALUE_MODE_PROCESS_INTEGRITY")
      let parsed: Json
      try { parsed = JSON.parse(result.stdout.trim()) as Json }
      catch { fail("V138_PLAN120_VALUE_MODE_PROCESS_INTEGRITY:json") }
      if (parsed.kind !== "value" || parsed.value === null || typeof parsed.value !== "object")
        fail(`V138_PLAN120_VALUE_MODE_SUBJECT_REJECTION:${String(parsed.detail)}`)
      return parsed.value as Json
    }
    const valueMode = (name: string, expression: string, expected: Json, code: string): void => {
      const value = runValue(expression)
      const valid = canonical(value) === canonical(expected)
      if (!valid) findings.push({ code, severity: "critical", subject: name, detail: canonical(value).trim() })
      observations.push(modeObservation(name, valid ? String(expected.status) : "failed", value, 0))
    }
    const nonPass = { journalPresent: true, privateDirectoryPresent: true, terminalPresent: true,
      lockPresent: false, reproductionPresent: false, adjudicationOrDownstreamPresent: false,
      outcome: { disposition: "exhausted" as const, journalRoot: `sha256:${"1".repeat(64)}` as Sha,
        stateRoot: `sha256:${"2".repeat(64)}` as Sha, completeCleanup: true,
        reproductionPresent: false, downstreamAuthority: "denied" } }
    const success = { ...nonPass, reproductionPresent: true,
      outcome: { ...nonPass.outcome, disposition: "succeeded" as const, reproductionPresent: true } }
    valueMode("post_non_pass_value",
      `subject.checkV138LiveV12PostRunOutputCustodyForReview(${JSON.stringify(nonPass)})`,
      deriveV138Plan114IndependentPostSemantics(nonPass), "MODE_NON_PASS_FAILED")
    valueMode("post_success_value",
      `subject.checkV138LiveV12PostRunOutputCustodyForReview(${JSON.stringify(success)})`,
      deriveV138Plan114IndependentPostSemantics(success), "MODE_SUCCESS_FAILED")
    const reproductionBody = {
      schemaVersion: "v1.38-current-matrix-reproduction-v17", status: "passed_exact",
      admittedCalibrationRoot: `sha256:${"3".repeat(64)}`, chargedAttemptCount: 540,
      acceptedCellCount: 540, completeCleanup: true, executionRoot: `sha256:${"4".repeat(64)}`,
      runtimeRoute: "v1.18/v1.19/MATCH_KERNEL", samplingMilliseconds: 200,
      partialAcceptedEvidenceReusable: false,
      privacyProjection: { strategySourceIncluded: false, strategyMemoryIncluded: false,
        soldierMemoryIncluded: false, objectivePayloadIncluded: false, rawDiagnosticsIncluded: false },
      phase263PlanningAuthorized: false, candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
      publicAuthorized: false, productAuthorized: false, productionAuthorized: false,
    }
    const receiptRoot = computeV138Plan114IndependentReproductionRoot(reproductionBody)
    const reproduction = { artifact: { ...reproductionBody, receiptRoot }, journalRecords: [
      { kind: "finish_calibration", routeIdentity: "route:v3:0", owner: "owner", status: "admitted",
        completeCleanup: true, supervisionRoot: reproductionBody.admittedCalibrationRoot },
      { kind: "finish_reproduction", routeIdentity: "route:v3:0", owner: "owner", status: "passed_exact",
        acceptedCells: 540, completeCleanup: true, reproductionRoot: receiptRoot,
        recordRoot: `sha256:${"5".repeat(64)}` },
    ], outcome: { disposition: "succeeded", journalRoot: `sha256:${"5".repeat(64)}`,
      stateRoot: `sha256:${"6".repeat(64)}`, completeCleanup: true,
      reproductionPresent: true, downstreamAuthority: "denied" } }
    valueMode("exact_reproduction_value",
      `subject.checkV138LiveV12ReproductionV17ForReview(${JSON.stringify(reproduction)})`,
      deriveV138Plan114IndependentReproductionSemantics(reproduction), "MODE_EXACT_REPRODUCTION_FAILED")

    const modeNames = ["source_only_cli", "prospective_custody_cli", "post_no_effect_cli",
      "post_non_pass_value", "post_success_value", "exact_reproduction_value"] as const
    if (observations.length !== 6 || boundary.producerCalls !== 0 || guardInvocations() !== 0)
      fail("V138_PLAN120_MODE_COUNT_INVALID")
    const sorted = [...findings].sort((a, b) =>
      `${a.code}\0${a.subject}\0${a.detail}`.localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
    authenticateFoundation(repoRoot)
    return Object.freeze({ modeNames,
      actualModesPassed: observations.filter(({ status }) => status !== "failed").length,
      producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
      freshCharged: 0 as const, freshAccepted: 0 as const,
      observations: Object.freeze(observations), findings: Object.freeze(sorted),
      observationRoot: rooted("v138-plan-262-120-observations-v2", observations),
      producerGuardObservationRoot: rooted("v138-plan-262-120-producer-guard-observations-v1",
        observations.map(({ mode, producerGuardInvocations }) => ({ mode, producerGuardInvocations }))),
      producerGuardInvocations: 0 as const,
      reviewedCustody: linkedClosure, reviewedClosureRoot: linkedClosure.reviewedClosureRoot,
      linkedLocalExecutionClosureRoot: linkedClosure.localExecutionClosureRoot,
      sourceTree: linkedClosure.sourceTree, sourceParent: linkedClosure.sourceParent,
      recursiveDependencyRoot: linkedClosure.recursiveDependencyRoot,
      recursiveDependencyCount: linkedClosure.recursiveDependencyCount,
      installedClosureRoot: linkedClosure.installedClosureRoot,
    })
  } finally {
    if (added) {
      try { run("/usr/bin/git", ["worktree", "remove", "--force", linked], repoRoot, owner) }
      catch { /* retain the primary result */ }
    }
    rmSync(owner, { recursive: true, force: true })
  }
}

export const assertV138Plan120PublishedLocalClosureForReview = (
  payload: Pick<Json, "reviewedClosureRoot" | "reviewedLocalExecutionClosureRoot" |
    "findingCount" | "actualModesPassed">,
  modes: V138Plan120ModeResult,
) => {
  checkV138PathStableCustodyForReview(modes.reviewedCustody, modes.reviewedCustody)
  const expectedModes = ["source_only_cli", "prospective_custody_cli", "post_no_effect_cli",
    "post_non_pass_value", "post_success_value", "exact_reproduction_value"]
  const observationRoot = rooted("v138-plan-262-120-observations-v2", modes.observations)
  const producerGuardObservationRoot = rooted("v138-plan-262-120-producer-guard-observations-v1",
    modes.observations.map(({ mode, producerGuardInvocations }) => ({ mode, producerGuardInvocations })))
  if (payload.reviewedClosureRoot !== modes.reviewedCustody.reviewedClosureRoot ||
      payload.reviewedLocalExecutionClosureRoot !== modes.reviewedCustody.localExecutionClosureRoot ||
      payload.findingCount !== 0 || payload.actualModesPassed !== 6 ||
      canonical(modes.modeNames) !== canonical(expectedModes) || modes.actualModesPassed !== 6 ||
      modes.findings.length !== 0 || modes.producerGuardInvocations !== 0 ||
      modes.observations.some(({ producerGuardInvocations }) => producerGuardInvocations !== 0) ||
      modes.observationRoot !== observationRoot ||
      modes.producerGuardObservationRoot !== producerGuardObservationRoot)
    fail("V138_PLAN120_PUBLISHED_LOCAL_CLOSURE_INVALID")
  return Object.freeze({ actualModesPassed: 6 as const, producerGuardInvocations: 0 as const,
    observationRoot, producerGuardObservationRoot,
    reviewedLocalExecutionClosureRoot: modes.reviewedCustody.localExecutionClosureRoot,
    recursiveDependencyRoot: modes.reviewedCustody.recursiveDependencyRoot,
    installedClosureRoot: modes.reviewedCustody.installedClosureRoot,
    pathStableNativeSourcesRoot: modes.reviewedCustody.pathStableNativeSourcesRoot })
}

export const renderV138Plan120EvidenceForReview = (
  repoRootInput: string,
  findings: readonly V138Plan120Finding[],
  modes?: V138Plan120ModeResult,
) => {
  const foundation = authenticateFoundation(path.resolve(repoRootInput))
  if (findings.length === 0 && modes === undefined) fail("V138_PLAN120_ZERO_REQUIRES_EXECUTED_MODES")
  if (findings.length === 0 && (modes!.actualModesPassed !== 6 || modes!.findings.length !== 0 ||
      modes!.producerCalls !== 0 || modes!.readinessInvoked !== false || modes!.liveInvoked !== false))
    fail("V138_PLAN120_ZERO_REQUIRES_SIX_CLEAN_MODES")
  return renderEvidence({ closure: foundation.closure,
    linkedLocalExecutionClosureRoot: modes?.linkedLocalExecutionClosureRoot ?? foundation.closure.localExecutionClosureRoot,
    findings, actualModesPassed: modes?.actualModesPassed ?? 0, observationRoot: modes?.observationRoot })
}

export const writeV138Plan120ReviewForReview = (rootInput: string): void => {
  const root = path.resolve(rootInput)
  assertAbsent(root, [...REVIEW_PATHS, ...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  const modes = executeV138Plan120DisposableModes(root)
  const evidence = renderV138Plan120EvidenceForReview(root, modes.findings, modes)
  for (const [repoPath, bytes] of [[V138_PLAN120_PATHS.payload, Buffer.from(canonical(evidence.payload))],
    [V138_PLAN120_PATHS.review, evidence.reviewBytes],
    [V138_PLAN120_PATHS.carrier, Buffer.from(canonical(evidence.carrier))]] as const) {
    mkdirSync(path.dirname(target(root, repoPath)), { recursive: true })
    writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
  }
}

const locatePublication = (root: string): string => {
  const commits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", V138_PLAN120_PATHS.payload])
    .split("\n").filter(Boolean)
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!))
    fail("V138_PLAN120_PUBLICATION_INVALID")
  return commits[0]!
}
export const authenticateV138Plan120PublishedReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const commit = locatePublication(root)
  const bytes = exactAddPublication(root, commit, REVIEW_PATHS)
  const payload = jsonBytes(bytes[0]!, "V138_PLAN120_PUBLISHED_PAYLOAD_INVALID")
  const carrier = jsonBytes(bytes[2]!, "V138_PLAN120_PUBLISHED_CARRIER_INVALID")
  const findings = payload.findings as V138Plan120Finding[]
  if (!Array.isArray(findings) || findings.length !== payload.findingCount) fail("V138_PLAN120_FINDINGS_INVALID")
  const foundation = authenticateFoundation(root)
  const exact = renderEvidence({ closure: foundation.closure,
    linkedLocalExecutionClosureRoot: payload.reviewedLocalExecutionClosureRoot,
    findings, actualModesPassed: payload.actualModesPassed, observationRoot: payload.observationRoot })
  if (canonical(payload) !== canonical(exact.payload) || !bytes[1]!.equals(exact.reviewBytes) ||
      canonical(carrier) !== canonical(exact.carrier)) fail("V138_PLAN120_PUBLICATION_RERENDER_INVALID")
  const modes = executeV138Plan120DisposableModes(root)
  const linked = assertV138Plan120PublishedLocalClosureForReview(payload, modes)
  assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return Object.freeze({ publicationCommit: commit, payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot, carrierRoot: carrier.carrierRoot,
    findingCount: payload.findingCount, actualModesPassed: payload.actualModesPassed,
    plan110Eligible: payload.findingCount === 0 && payload.actualModesPassed === 6,
    observationRoot: linked.observationRoot,
    producerGuardObservationRoot: linked.producerGuardObservationRoot,
    reviewedLocalExecutionClosureRoot: linked.reviewedLocalExecutionClosureRoot,
    recursiveDependencyRoot: linked.recursiveDependencyRoot,
    installedClosureRoot: linked.installedClosureRoot,
    pathStableNativeSourcesRoot: linked.pathStableNativeSourcesRoot,
    authorizesExecution: false as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, downstreamAuthority: "denied" as const })
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN120_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeV138Plan120ReviewForReview(root); return }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan120PublishedReview(root))}\n`); return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan120DisposableModes(root))}\n`); return
  }
  fail("V138_PLAN120_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
