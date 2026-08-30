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
export type V138Plan122Finding = Readonly<{
  code: string
  severity: "critical" | "warning"
  subject: string
  detail: string
}>
export type V138Plan122ModeResult = Readonly<{
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
    producerGuardCount: 0
    reducedValue: Json
    disposableReviewedClosureRoot: Sha
    disposableLocalInstalledClosureRoot: Sha
    disposableLocalGitObjectRoot: Sha
    disposableLocalNativeSourcesRoot: Sha
    disposableLocalExecutionClosureRoot: Sha
    observationRoot: Sha
  }>[]
  findings: readonly V138Plan122Finding[]
  observationRoot: Sha
  producerGuardCount: 0
  reviewedCustody: V138PathStableCustody
  reviewedClosureRoot: Sha
  canonicalCustody: V138PathStableCustody
  sourceTree: string
  sourceParent: string
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  installedClosureRoot: Sha
}>

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const PLAN_122_SUBJECT_COMMIT = "3882cd5d3ec7a834e1de88254dd0daf955da12aa"
const SUBJECT_TREE = "79cf4be43901dd5c9d698cc31a43b20d65e3d3be"
const SUBJECT_PARENT = "feff354a78020287e5ec95d52abe876b3a223028"
const SUBJECT_SOURCE_BLOB = "0d299dc98c3af22d6a2312a7bdc6062538bc1cd9"
const SUBJECT_TEST_BLOB = "3e32de9f2e9e57bac98fb789bf1dd1941e2bdef1"
const REVIEWED_CLOSURE_ROOT = "sha256:9b803ab8f108923e1160d308ac91a1e4fabdafea28a0115e290f38cf1fd94952"
const CANONICAL_LOCAL_EXECUTION_CLOSURE_ROOT = "sha256:58617465d61e1c7bc5f7b90cfeafe2529959051144a55defda56613a7c8e3102"
const PLAN_121_CLOSEOUT_COMMIT = "c92b5d0fb74414d6950eeea8a316b9a779a120d3"
const PLAN_121_SUMMARY_BLOB = "f4d3184c3f4c30af02fd7273bd148821b7a56b93"
const PLAN_121_REVIEW_COMMIT = "5ef819d048a38ed3c87a8ee9017b5b5b77472b6b"
const PLAN_121_REVIEW_BLOB = "ffb8928885a62974926d2d9a48a4efb9ca0cf54c"
const PLAN_120_PUBLICATION_COMMIT = "c7390cf521234e13e6c09c784df25f65a722aa23"
const PLAN_120_ROOTS = Object.freeze({
  payload: "sha256:a5338bfa3150a685cb35f2b402a35e80a0b78ff98df165998bc5c4581ea5f9da",
  review: "sha256:a5bf40478f1f9ba4eb7e0403407ba8bb2a1146c7ee139cc0820dacdcbdc765df",
  carrier: "sha256:699a0250fc3b4fff916601e50ad19b764319ce9a629198e93525f4dca62f78ab",
})
const PLAN_120_DISPOSITION = "process_invalid_local_context_misbinding"
const PLAN_117_SUBJECT_COMMIT = "41c716c55cec09a35180cd5229cf2f7545c504d4"
const PLAN_118_PUBLICATION_COMMIT = "e693f8fe1ff74e2c0d1d733c85c422fd68cb467c"
const PLAN_118_ROOTS = Object.freeze({
  payload: "sha256:6a262e4b8e267a6be8858c1247a49ceab3c0dbb23b9ebfea9f675a6e02f527e8",
  review: "sha256:be5bea259659c0b8878a09ff7ca7df991fda9b6702c8bc3b90f38922068d8f16",
  carrier: "sha256:ae957db112a31b563ae5357104351c0c8da90b1de7563d6ab86cfd2223286bcb",
})
const ALLOWED_CORRECTION_COMMIT = "0f8258d888eba27cfaa48a9cc5175e578364077b"
const ALLOWED_CORRECTION_PARENT = "7f65ff66be29de4f655736f60d6c68683fae3e35"
const LIVE_V13_SOURCE_BLOB = "4cb2041a1305db808fe7459a64f331558e5f981c"
const LIVE_V13_REVIEWED_TEST_BLOB = "e5b32103b0355b4abeecfc6f85cf05a92ad787b8"
const LIVE_V13_CORRECTED_TEST_BLOB = "a7d7368c41a95a100c8c144c3a78dfe84aea76d4"
const ALLOWED_HISTORY_ROOT = "sha256:0647481df4f5f0e01cb30175181c706b4c894fe9e31844491220ccb3d0baee0c"
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
export const V138_PLAN122_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts",
  payload: ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-payload-v3.json",
  review: `${PHASE}/262-122-REVIEW-v3.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-carrier-v3.json",
  supplement: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
})
const REVIEW_PATHS = Object.freeze([V138_PLAN122_PATHS.payload, V138_PLAN122_PATHS.review, V138_PLAN122_PATHS.carrier])
const PLAN_120_V2_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-payload-v2.json",
  `${PHASE}/262-120-REVIEW-v2.md`,
  ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-carrier-v2.json",
] as const)
const PLAN_121_CLOSEOUT_PATHS = Object.freeze([
  `${PHASE}/262-121-SUMMARY.md`,
  `${PHASE}/262-121-CODE-REVIEW.md`,
] as const)
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
  V138_PLAN122_PATHS.source,
  V138_PLAN122_PATHS.tests,
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
  for (const repoPath of paths) if (present(root, repoPath)) fail(`V138_PLAN122_FORBIDDEN_PRESENT:${repoPath}`)
}
const readNoFollow = (root: string, repoPath: string, mode = 0o644): Buffer => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target(root, repoPath), constants.O_RDONLY | constants.O_NOFOLLOW)
    const before = fstatSync(descriptor)
    if (!before.isFile() || (before.mode & 0o7777) !== mode || before.size > 8 * 1024 * 1024)
      fail(`V138_PLAN122_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_PLAN122_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_PLAN122_")) throw error
    fail(`V138_PLAN122_CURRENT_ENTRY_INVALID:${repoPath}`)
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
    fail(`V138_PLAN122_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_PLAN122_SUCCESSOR_REWRITE:${paths[0]}`)
}
const exactAddPublication = (root: string, commit: string, paths: readonly string[]) => {
  ancestor(root, commit)
  const actual = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).sort()
  const expected = paths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN122_PUBLICATION_SCOPE_INVALID")
  const bytes = paths.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath])
    if (!entry.startsWith("100644 blob ") || !entry.endsWith(`\t${repoPath}`))
      fail(`V138_PLAN122_PUBLICATION_MODE_INVALID:${repoPath}`)
    const committed = gitBytes(root, commit, repoPath)
    if (!readNoFollow(root, repoPath).equals(committed))
      fail(`V138_PLAN122_PUBLICATION_BYTES_INVALID:${repoPath}`)
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
    const payload = jsonBytes(bytes[0]!, "V138_PLAN122_PLAN114_PAYLOAD_INVALID")
    const carrier = jsonBytes(bytes[2]!, "V138_PLAN122_PLAN114_CARRIER_INVALID")
    const roots = PLAN_114_ROOTS[index]!
    if (payload.payloadRoot !== roots.payload || carrier.reviewRoot !== roots.review ||
        carrier.carrierRoot !== roots.carrier || payload.findingCount !== 0 ||
        payload.actualModesPassed !== 6 || payload.authorizesExecution !== false ||
        payload.liveInvoked !== false || payload.downstreamAuthority !== "denied" ||
        (index === 1 && (payload.plan109Eligible !== true ||
          payload.supersedesPublicationCommit !== PLAN_114_COMMITS[0])))
      fail(`V138_PLAN122_PLAN114_V${index + 1}_SEMANTICS_INVALID`)
  }
  for (const [index, commit] of PLAN_116_COMMITS.entries()) {
    const paths = plan116Paths(index + 1)
    const bytes = exactAddPublication(root, commit, paths)
    const payload = jsonBytes(bytes[0]!, "V138_PLAN122_PLAN116_PAYLOAD_INVALID")
    const carrier = jsonBytes(bytes[2]!, "V138_PLAN122_PLAN116_CARRIER_INVALID")
    const roots = PLAN_116_ROOTS[index]!
    if (payload.payloadRoot !== roots.payload || carrier.reviewRoot !== roots.review ||
        carrier.carrierRoot !== roots.carrier || payload.findingCount !== 0 ||
        payload.actualModesPassed !== 9 || payload.plan109Eligible !== true ||
        payload.authorizesExecution !== false || payload.producerCalls !== 0 ||
        payload.readinessInvoked !== false || payload.liveInvoked !== false ||
        payload.downstreamAuthority !== "denied")
      fail(`V138_PLAN122_PLAN116_V${index + 1}_SEMANTICS_INVALID`)
  }
  const supplement = jsonBytes(readNoFollow(root, V138_PLAN122_PATHS.supplement),
    "V138_PLAN122_SUPPLEMENT_INVALID")
  const supplementEntry = git(root, ["ls-tree", SUPPLEMENT_COMMIT, "--", V138_PLAN122_PATHS.supplement])
  if (!supplementEntry.startsWith("100644 blob f5953ea37f8648fa85790f97f536d92f94f999e7\t") ||
      !readNoFollow(root, V138_PLAN122_PATHS.supplement).equals(
        gitBytes(root, SUPPLEMENT_COMMIT, V138_PLAN122_PATHS.supplement)) ||
      supplement.supplementRoot !== SUPPLEMENT_ROOT || supplement.authorizesExecution !== false ||
      supplement.createsCapacity !== false || supplement.resetsCounters !== false ||
      canonical(supplement.counters) !== canonical(ZERO_COUNTERS) ||
      supplement.downstreamAuthority !== "denied") fail("V138_PLAN122_SUPPLEMENT_SEMANTICS_INVALID")
  noRewrite(root, SUPPLEMENT_COMMIT, [V138_PLAN122_PATHS.supplement])
  const seal = jsonBytes(readNoFollow(root, V138_PLAN122_PATHS.seal, 0o600), "V138_PLAN122_SEAL_INVALID")
  const envelope = jsonBytes(readNoFollow(root, V138_PLAN122_PATHS.envelope, 0o600), "V138_PLAN122_ENVELOPE_INVALID")
  if (!readNoFollow(root, V138_PLAN122_PATHS.seal, 0o600).equals(gitBytes(root, PAIR_COMMIT, V138_PLAN122_PATHS.seal)) ||
      !readNoFollow(root, V138_PLAN122_PATHS.envelope, 0o600).equals(gitBytes(root, PAIR_COMMIT, V138_PLAN122_PATHS.envelope)) ||
      seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.sealRoot !== SEAL_ROOT || envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      envelope.status !== "sealed_inactive" || canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      envelope.policy.phase263PlanningAuthorized !== false || envelope.policy.candidateSearchAuthorized !== false ||
      envelope.policy.formationMaterializationAuthorized !== false || envelope.policy.holdoutOpeningAuthorized !== false ||
      envelope.policy.publicAuthorized !== false || envelope.policy.productAuthorized !== false ||
      envelope.policy.productionAuthorized !== false || envelope.policy.gameplayChangeAuthorized !== false)
    fail("V138_PLAN122_PAIR_SEMANTICS_INVALID")
  noRewrite(root, PAIR_COMMIT, [V138_PLAN122_PATHS.seal, V138_PLAN122_PATHS.envelope])
}

const authenticateAllowedHistory = (root: string): void => {
  const reviewBytes = exactAddPublication(root, PLAN_118_PUBLICATION_COMMIT, PLAN_118_V1_PATHS)
  const reviewPayload = jsonBytes(reviewBytes[0]!, "V138_PLAN122_PLAN118_PAYLOAD_INVALID")
  const reviewCarrier = jsonBytes(reviewBytes[2]!, "V138_PLAN122_PLAN118_CARRIER_INVALID")
  if (reviewPayload.payloadRoot !== PLAN_118_ROOTS.payload ||
      reviewCarrier.reviewRoot !== PLAN_118_ROOTS.review ||
      reviewCarrier.carrierRoot !== PLAN_118_ROOTS.carrier ||
      reviewPayload.subjectCommit !== PLAN_117_SUBJECT_COMMIT ||
      reviewPayload.findingCount !== 0 || reviewPayload.actualModesPassed !== 6 ||
      reviewPayload.plan110Eligible !== true || reviewPayload.authorizesExecution !== false ||
      reviewPayload.producerCalls !== 0 || reviewPayload.readinessInvoked !== false ||
      reviewPayload.liveInvoked !== false || reviewPayload.freshCharged !== 0 ||
      reviewPayload.freshAccepted !== 0 || reviewPayload.downstreamAuthority !== "denied")
    fail("V138_PLAN122_PLAN118_SEMANTICS_INVALID")

  ancestor(root, PLAN_117_SUBJECT_COMMIT)
  ancestor(root, ALLOWED_CORRECTION_COMMIT)
  if (git(root, ["rev-parse", `${ALLOWED_CORRECTION_COMMIT}^`]) !== ALLOWED_CORRECTION_PARENT ||
      git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", ALLOWED_CORRECTION_COMMIT]) !==
        `M\t${LIVE_V11_PATHS[1]}`)
    fail("V138_PLAN122_ALLOWED_CORRECTION_ANCESTRY_INVALID")
  const reviewedEntries = [
    [LIVE_V11_PATHS[0], LIVE_V13_SOURCE_BLOB],
    [LIVE_V11_PATHS[1], LIVE_V13_REVIEWED_TEST_BLOB],
  ] as const
  for (const [repoPath, blob] of reviewedEntries)
    if (git(root, ["ls-tree", PLAN_117_SUBJECT_COMMIT, "--", repoPath]) !==
        `100644 blob ${blob}\t${repoPath}`)
      fail(`V138_PLAN122_PLAN117_ENTRY_INVALID:${repoPath}`)
  if (git(root, ["ls-tree", ALLOWED_CORRECTION_COMMIT, "--", LIVE_V11_PATHS[0]]) !==
        `100644 blob ${LIVE_V13_SOURCE_BLOB}\t${LIVE_V11_PATHS[0]}` ||
      git(root, ["ls-tree", ALLOWED_CORRECTION_COMMIT, "--", LIVE_V11_PATHS[1]]) !==
        `100644 blob ${LIVE_V13_CORRECTED_TEST_BLOB}\t${LIVE_V11_PATHS[1]}` ||
      !readNoFollow(root, LIVE_V11_PATHS[0]).equals(
        gitBytes(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS[0])) ||
      !readNoFollow(root, LIVE_V11_PATHS[1]).equals(
        gitBytes(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS[1])))
    fail("V138_PLAN122_ALLOWED_CORRECTION_ENTRY_INVALID")

  const allowedHistory = rooted("v138-plan-262-119-live-v13-allowed-history-v1", {
    plan117SubjectCommit: PLAN_117_SUBJECT_COMMIT,
    plan118PublicationCommit: PLAN_118_PUBLICATION_COMMIT,
    plan118PayloadRoot: PLAN_118_ROOTS.payload,
    plan118ReviewRoot: PLAN_118_ROOTS.review,
    plan118CarrierRoot: PLAN_118_ROOTS.carrier,
    allowedCorrectionCommit: ALLOWED_CORRECTION_COMMIT,
    allowedCorrectionParent: ALLOWED_CORRECTION_PARENT,
    liveV11SourceBlob: LIVE_V13_SOURCE_BLOB,
    liveV11ReviewedTestBlob: LIVE_V13_REVIEWED_TEST_BLOB,
    liveV11CorrectedTestBlob: LIVE_V13_CORRECTED_TEST_BLOB,
  })
  if (allowedHistory !== ALLOWED_HISTORY_ROOT) fail("V138_PLAN122_ALLOWED_HISTORY_ROOT_INVALID")
  noRewrite(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS)
}

const authenticateSubject = (root: string): V138PathStableCustody => {
  ancestor(root, PLAN_122_SUBJECT_COMMIT)
  if (git(root, ["rev-parse", `${PLAN_122_SUBJECT_COMMIT}^{tree}`]) !== SUBJECT_TREE ||
      git(root, ["rev-parse", `${PLAN_122_SUBJECT_COMMIT}^`]) !== SUBJECT_PARENT)
    fail("V138_PLAN122_SUBJECT_IDENTITY_INVALID")
  const entries = [
    [V138_PLAN122_PATHS.source, SUBJECT_SOURCE_BLOB],
    [V138_PLAN122_PATHS.tests, SUBJECT_TEST_BLOB],
  ] as const
  for (const [repoPath, blob] of entries) {
    const entry = git(root, ["ls-tree", PLAN_122_SUBJECT_COMMIT, "--", repoPath])
    if (entry !== `100644 blob ${blob}\t${repoPath}` ||
        !readNoFollow(root, repoPath).equals(gitBytes(root, PLAN_122_SUBJECT_COMMIT, repoPath)))
      fail(`V138_PLAN122_SUBJECT_ENTRY_INVALID:${repoPath}`)
  }
  noRewrite(root, PLAN_122_SUBJECT_COMMIT, [V138_PLAN122_PATHS.source, V138_PLAN122_PATHS.tests])
  const closure = deriveV138PathStableCustody(root, {
    sourceCommit: PLAN_122_SUBJECT_COMMIT,
    checkoutPaths: SOURCE_PATHS,
  })
  checkV138PathStableCustodyForReview(closure, closure)
  if (closure.reviewedClosureRoot !== REVIEWED_CLOSURE_ROOT ||
      closure.localExecutionClosureRoot !== CANONICAL_LOCAL_EXECUTION_CLOSURE_ROOT ||
      closure.sourceTree !== SUBJECT_TREE ||
      closure.sourceParent !== SUBJECT_PARENT || canonical(closure.checkoutPaths) !== canonical(SOURCE_PATHS) ||
      closure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_PLAN122_REVIEWED_CLOSURE_INVALID")
  return closure
}

const authenticateCurrentLineage = (root: string): void => {
  const summaryPath = PLAN_121_CLOSEOUT_PATHS[0]
  const reviewPath = PLAN_121_CLOSEOUT_PATHS[1]
  ancestor(root, PLAN_121_CLOSEOUT_COMMIT)
  ancestor(root, PLAN_121_REVIEW_COMMIT)
  if (git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN_121_CLOSEOUT_COMMIT]) !==
        `M\t${summaryPath}` ||
      git(root, ["ls-tree", PLAN_121_CLOSEOUT_COMMIT, "--", summaryPath]) !==
        `100644 blob ${PLAN_121_SUMMARY_BLOB}\t${summaryPath}` ||
      !readNoFollow(root, summaryPath).equals(gitBytes(root, PLAN_121_CLOSEOUT_COMMIT, summaryPath)) ||
      git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN_121_REVIEW_COMMIT]) !==
        `A\t${reviewPath}` ||
      git(root, ["ls-tree", PLAN_121_REVIEW_COMMIT, "--", reviewPath]) !==
        `100644 blob ${PLAN_121_REVIEW_BLOB}\t${reviewPath}` ||
      !readNoFollow(root, reviewPath).equals(gitBytes(root, PLAN_121_REVIEW_COMMIT, reviewPath)))
    fail("V138_PLAN122_PLAN121_CLOSEOUT_INVALID")
  noRewrite(root, PLAN_121_CLOSEOUT_COMMIT, [summaryPath])
  noRewrite(root, PLAN_121_REVIEW_COMMIT, [reviewPath])

  const v2Bytes = exactAddPublication(root, PLAN_120_PUBLICATION_COMMIT, PLAN_120_V2_PATHS)
  const v2Payload = jsonBytes(v2Bytes[0]!, "V138_PLAN122_PLAN120_V2_PAYLOAD_INVALID")
  const v2Carrier = jsonBytes(v2Bytes[2]!, "V138_PLAN122_PLAN120_V2_CARRIER_INVALID")
  if (v2Payload.payloadRoot !== PLAN_120_ROOTS.payload ||
      v2Carrier.reviewRoot !== PLAN_120_ROOTS.review ||
      v2Carrier.carrierRoot !== PLAN_120_ROOTS.carrier ||
      v2Payload.plan110Eligible !== true || v2Payload.actualModesPassed !== 6 ||
      v2Payload.authorizesExecution !== false || v2Payload.producerCalls !== 0 ||
      v2Payload.readinessInvoked !== false || v2Payload.liveInvoked !== false ||
      v2Payload.downstreamAuthority !== "denied")
    fail("V138_PLAN122_PLAN120_V2_SEMANTICS_INVALID")

  const custodyCommit = "b331baad29053f523233558f66aa2855f2925b2b"
  const custodyParent = "b6cd3ec13aa25c6b1a5416a264ddf17855c19bad"
  const custodyEntries = Object.freeze([
    [`${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`, "d540a5a7b0f7200ed86287a3744e46ebd66987bd"],
    [`${PHASE}/262-93-SUMMARY.md`, "e2db03c938d23305527bcad6ab0c479fbadd0bd3"],
    [`${PHASE}/262-120-SUMMARY.md`, "86621b8f8ac5546b66265b2cc5ca3f6b80468be7"],
  ] as const)
  ancestor(root, custodyCommit)
  if (git(root, ["rev-parse", `${custodyCommit}^`]) !== custodyParent)
    fail("V138_PLAN122_B331_ANCESTRY_INVALID")
  for (const [repoPath, blob] of custodyEntries) {
    if (git(root, ["ls-tree", custodyCommit, "--", repoPath]) !==
          `100644 blob ${blob}\t${repoPath}` ||
        !readNoFollow(root, repoPath).equals(gitBytes(root, custodyCommit, repoPath)))
      fail(`V138_PLAN122_B331_ENTRY_INVALID:${repoPath}`)
    noRewrite(root, custodyCommit, [repoPath])
  }
}

export const inspectV138Plan122BoundarySourceForReview = (source: string) => {
  const sourceFile = ts.createSourceFile(V138_PLAN122_PATHS.source, source,
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
  let dynamicImportCount = 0
  let dangerousIdentifierCount = 0
  let assembledExecutableCount = 0
  const staticString = (node: ts.Expression): string | undefined => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = staticString(node.left)
      const right = staticString(node.right)
      return left === undefined || right === undefined ? undefined : left + right
    }
    return undefined
  }
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      dynamicImportCount += 1
    if (ts.isIdentifier(node) && ["eval", "Function", "require", "createRequire", "getBuiltinModule"]
      .includes(node.text)) dangerousIdentifierCount += 1
    if (ts.isBinaryExpression(node)) {
      const value = staticString(node)
      if (value !== undefined && ["eval", "Function", "require", "createRequire", "getBuiltinModule",
        "runV138V3ProductionLive", "./run-v1-38-bounded-retry-envelope-v3.js"].includes(value))
        assembledExecutableCount += 1
    }
    if (ts.isIdentifier(node) && node.text === "runV138V3ProductionLive") references += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138V3ProductionLive") {
      calls += 1
      directAwaited = ts.isAwaitExpression(node.parent)
      producerCall = node
    }
    if (ts.isIdentifier(node) && node.text === "runV138ReviewedBoundedLiveEnvelopeV13")
      reviewedOwnerReferences += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138ReviewedBoundedLiveEnvelopeV13") {
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
      references !== 2 || calls !== 1 || !directAwaited || dynamicImportCount !== 0 ||
      dangerousIdentifierCount !== 0 || assembledExecutableCount !== 0 ||
      producerOwner !== "runV138ReviewedBoundedLiveEnvelopeV13" ||
      reviewedOwnerReferences !== 2 || reviewedOwnerCalls !== 1 ||
      !ts.isAwaitExpression(reviewedOwnerCall?.parent) ||
      dispatchOwner !== "executeV138LiveV13Cli" || !exactProductionCondition ||
      !source.includes('"--check-reviewed-live-ready"') ||
      !source.includes('"--run-reviewed-bounded-live-envelope"') ||
      /runV138ReviewedBoundedLiveEnvelopeV13\s*=\s*async\s*\([^)]*,/u.test(source) ||
      /(?:injectedProducer|injectedReadiness|injectedRenderer)\??\s*:/u.test(source) ||
      /Partial<\{[^}]*?(?:producer|readiness|renderer)/su.test(source))
    fail("V138_PLAN122_PRODUCTION_BOUNDARY_INVALID")
  return Object.freeze({ producerCallSites: 1 as const, producerCalls: 0 as const,
    producerOwner: "runV138ReviewedBoundedLiveEnvelopeV13" as const,
    productionDispatchCondition: 'args[0] === "--run-reviewed-bounded-live-envelope"' as const,
    readinessInvoked: false as const, liveInvoked: false as const, downstreamAuthority: "denied" as const })
}

const authenticateFoundation = (rootInput: string) => {
  const root = path.resolve(rootInput)
  authenticateHistory(root)
  authenticateAllowedHistory(root)
  authenticateCurrentLineage(root)
  const closure = authenticateSubject(root)
  inspectV138Plan122BoundarySourceForReview(readNoFollow(root, V138_PLAN122_PATHS.source).toString("utf8"))
  assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return Object.freeze({ closure })
}

const reauthenticateCanonicalSnapshot = (root: string, expected: V138PathStableCustody): V138PathStableCustody => {
  for (const repoPath of SOURCE_PATHS) {
    const entry = git(root, ["ls-tree", PLAN_122_SUBJECT_COMMIT, "--", repoPath])
    const match = /^100644 blob ([0-9a-f]{40})\t/u.exec(entry)
    if (match === null || git(root, ["hash-object", repoPath]) !== match[1])
      fail(`V138_PLAN122_CANONICAL_CURRENT_ENTRY_INVALID:${repoPath}`)
  }
  checkV138PathStableCustodyForReview(expected, expected)
  if (expected.reviewedClosureRoot !== REVIEWED_CLOSURE_ROOT ||
      expected.localExecutionClosureRoot !== CANONICAL_LOCAL_EXECUTION_CLOSURE_ROOT)
    fail("V138_PLAN122_CANONICAL_ROOT_INVALID")
  return expected
}

const payloadRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-payload-v3", body)
const reviewRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-markdown-v3", body)
const carrierRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-carrier-v3", body)

const renderEvidence = (input: {
  closure: V138PathStableCustody
  canonicalLocalExecutionClosureRoot: Sha
  findings: readonly V138Plan122Finding[]
  actualModesPassed: number
  observations?: V138Plan122ModeResult["observations"]
  observationsRoot?: Sha
}) => {
  const findings = [...input.findings].sort((a, b) =>
    `${a.code}\0${a.subject}\0${a.detail}`.localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const zero = findings.length === 0 && input.actualModesPassed === 6
  const body = {
    schemaVersion: "v1.38-plan-262-122-live-v13-custody-review-payload-v3",
    protocol: "independent-live-v13-executable-custody-review-v3",
    subjectCommit: PLAN_122_SUBJECT_COMMIT,
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
    canonicalLocalExecutionClosureRoot: input.canonicalLocalExecutionClosureRoot,
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
    liveV11SourceBlob: LIVE_V13_SOURCE_BLOB,
    liveV11ReviewedTestBlob: LIVE_V13_REVIEWED_TEST_BLOB,
    liveV11CorrectedTestBlob: LIVE_V13_CORRECTED_TEST_BLOB,
    supersedesPublicationCommit: PLAN_120_PUBLICATION_COMMIT,
    supersededV2PayloadRoot: PLAN_120_ROOTS.payload,
    supersededV2ReviewRoot: PLAN_120_ROOTS.review,
    supersededV2CarrierRoot: PLAN_120_ROOTS.carrier,
    supersededV2Disposition: PLAN_120_DISPOSITION,
    supersededV2Plan110Eligible: false,
    observations: input.observations ?? [],
    observationsRoot: input.observationsRoot ?? rooted("v138-plan-262-122-observations-v3", []),
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
    ? Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "122"\nreview_type: independent_live_v13_executable_custody_v3\nstatus: zero_findings\nfinding_count: 0\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 122 Independent Live-v13 Executable-Custody Review v3\n\n**ZERO FINDINGS.** Six producer-incapable modes passed. Only revised Plan 110 is eligible. Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Fresh charged/accepted: 0/0. Downstream authority: denied.\n`)
    : Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "122"\nreview_type: independent_live_v13_executable_custody_v3\nstatus: blocked\nfinding_count: ${findings.length}\nreview_root: ${rRoot}\n---\n\n# Phase 262 Plan 122 Independent Live-v13 Executable-Custody Review v3\n\n**BLOCKED.** Finding codes: ${findings.map(({ code }) => code).join(", ")}. Actual producer-incapable modes passed: ${input.actualModesPassed}/6. Plan 110 eligible: false. Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Downstream authority: denied.\n`)
  const cBody = {
    schemaVersion: "v1.38-plan-262-122-live-v13-custody-review-carrier-v3",
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
    subjectCommit: PLAN_122_SUBJECT_COMMIT,
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

const modeObservationV3 = (
  mode: string,
  status: string,
  reducedValue: Json,
  custody: V138PathStableCustody,
) => {
  const disposableLocalInstalledClosureRoot = rooted(
    "v138-plan-262-122-disposable-local-installed-v3", { mode, root: custody.localInstalledClosureRoot })
  const disposableLocalGitObjectRoot = rooted(
    "v138-plan-262-122-disposable-local-git-v3", { mode, root: custody.localGitObjectRoot })
  const disposableLocalNativeSourcesRoot = rooted(
    "v138-plan-262-122-disposable-local-native-v3", { mode, root: custody.localNativeSourcesRoot })
  const disposableLocalExecutionClosureRoot = rooted("v138-retry-v3-path-stable-local-execution-closure-v1", {
    reviewedClosureRoot: custody.reviewedClosureRoot,
    localInstalledClosureRoot: disposableLocalInstalledClosureRoot,
    localGitObjectRoot: disposableLocalGitObjectRoot,
    localNativeSourcesRoot: disposableLocalNativeSourcesRoot,
  })
  const body = Object.freeze({
    mode,
    status,
    producerGuardCount: 0 as const,
    reducedValue,
    disposableReviewedClosureRoot: custody.reviewedClosureRoot,
    disposableLocalInstalledClosureRoot,
    disposableLocalGitObjectRoot,
    disposableLocalNativeSourcesRoot,
    disposableLocalExecutionClosureRoot,
  })
  return Object.freeze({
    ...body,
    observationRoot: rooted("v138-plan-262-122-mode-observation-v3", body),
  })
}
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

export const executeV138Plan122DisposableModes = (repoRootInput: string): V138Plan122ModeResult => {
  const repoRoot = path.resolve(repoRootInput)
  const canonicalBefore = authenticateFoundation(repoRoot).closure
  const observations: Array<ReturnType<typeof modeObservationV3>> = []
  const findings: V138Plan122Finding[] = []
  const modes = [
    "--check-source-only",
    "--check-prospective-custody",
    "--check-post-run-custody",
    "--check-non-pass-value",
    "--check-bounded-success-value",
    "--check-exact-reproduction-v17-value",
  ] as const
  const statuses = [
    "source_only_checked",
    "prospective_custody_checked",
    "post_run_no_effect_custody_checked",
    "bounded_non_pass_value_checked",
    "bounded_success_value_checked",
    "exact_reproduction_v17_value_checked",
  ] as const

  for (const [index, mode] of modes.entries()) {
    const owner = mkdtempSync(path.join(tmpdir(), `v138-plan122-mode-${index}-`))
    const linked = path.join(owner, "repo")
    let added = false
    try {
      run("/usr/bin/git", ["worktree", "add", "--quiet", "--detach", linked, PLAN_122_SUBJECT_COMMIT], repoRoot, owner)
      added = true
      linkDependencies(repoRoot, linked)
      chmodSync(target(linked, V138_PLAN122_PATHS.seal), 0o600)
      chmodSync(target(linked, V138_PLAN122_PATHS.envelope), 0o600)
      const custody = reauthenticateCanonicalSnapshot(linked, canonicalBefore)
      checkV138PathStableCustodyForReview(custody, custody)
      if (custody.reviewedClosureRoot !== REVIEWED_CLOSURE_ROOT)
        fail(`V138_PLAN122_DISPOSABLE_PORTABLE_CUSTODY_INVALID:${mode}`)

      const guardPath = path.join(owner, "producer-invocation-guard.jsonl")
      const guardedPath = path.join(linked, "scripts/.plan122-live-v13-guarded.ts")
      const exactSource = readNoFollow(linked, V138_PLAN122_PATHS.source).toString("utf8")
      inspectV138Plan122BoundarySourceForReview(exactSource)
      const aliasedSource = exactSource.replace(
        "  runV138V3ProductionLive,\n",
        "  runV138V3ProductionLive as importedRunV138V3ProductionLive,\n",
      )
      const guardedSource = aliasedSource.replace(
        "type Sha = `sha256:${string}`",
        `import { appendFileSync as appendV138Plan122ProducerGuard } from "node:fs"\nconst runV138V3ProductionLive: typeof importedRunV138V3ProductionLive = async (..._args) => { appendV138Plan122ProducerGuard(${JSON.stringify(guardPath)}, "invoked\\n", { mode: 0o600 }); throw new Error("V138_PLAN122_PRODUCER_GUARD_TRIPPED") }\n\ntype Sha = \`sha256:\${string}\``,
      )
      if (aliasedSource === exactSource || guardedSource === aliasedSource)
        fail("V138_PLAN122_GUARD_INSTRUMENTATION_INVALID")
      writeFileSync(guardedPath, guardedSource, { mode: 0o600, flag: "wx" })
      const tsx = path.join(linked, "node_modules/.bin/tsx")
      const spawn = (args: readonly string[]) => spawnSync(tsx, [...args], {
        cwd: linked,
        encoding: "utf8",
        env: { PATH: toolPath(), HOME: owner, LANG: "C", LC_ALL: "C" },
        stdio: ["ignore", "pipe", "pipe"],
      })
      let reducedValue: Json
      let valid = true
      if (index < 3) {
        const result = spawn(["scripts/.plan122-live-v13-guarded.ts", mode])
        if (result.error !== undefined || result.status !== 0) {
          valid = false
          reducedValue = { detail: result.stderr.trim() || `exit:${String(result.status)}` }
        } else {
          const value = JSON.parse(result.stdout.trim()) as Json
          valid = value.status === statuses[index] && value.producerCalls === 0 &&
            value.readinessInvoked === false && value.liveInvoked === false &&
            value.freshCharged === 0 && value.freshAccepted === 0 &&
            value.downstreamAuthority === "denied" &&
            (index === 0 || (value.subjectCommit === PLAN_122_SUBJECT_COMMIT &&
              value.reviewedClosureRoot === REVIEWED_CLOSURE_ROOT))
          reducedValue = {
            producerCalls: value.producerCalls,
            readinessInvoked: value.readinessInvoked,
            liveInvoked: value.liveInvoked,
            freshCharged: value.freshCharged,
            freshAccepted: value.freshAccepted,
            downstreamAuthority: value.downstreamAuthority,
          }
        }
      } else {
        const runner = path.join(linked, `.plan122-mode-${index}.ts`)
        const nonPass = { journalPresent: true, privateDirectoryPresent: true, terminalPresent: true,
          lockPresent: false, reproductionPresent: false, adjudicationOrDownstreamPresent: false,
          outcome: { disposition: "exhausted", journalRoot: `sha256:${"1".repeat(64)}`,
            stateRoot: `sha256:${"2".repeat(64)}`, completeCleanup: true,
            reproductionPresent: false, downstreamAuthority: "denied" } }
        const success = { ...nonPass, reproductionPresent: true,
          outcome: { ...nonPass.outcome, disposition: "succeeded", reproductionPresent: true } }
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
        const expression = index === 3
          ? `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(nonPass)})`
          : index === 4
            ? `subject.checkV138LiveV13PostRunOutputCustodyForReview(${JSON.stringify(success)})`
            : `subject.checkV138LiveV13ReproductionV17ForReview(${JSON.stringify(reproduction)})`
        writeFileSync(runner,
          `import * as subject from './scripts/.plan122-live-v13-guarded.ts'; const value=${expression}; process.stdout.write(JSON.stringify(value));`,
          { mode: 0o600, flag: "wx" })
        const result = spawn([runner])
        rmSync(runner, { force: true })
        if (result.error !== undefined || result.status !== 0) {
          valid = false
          reducedValue = { detail: result.stderr.trim() || `exit:${String(result.status)}` }
        } else {
          const value = JSON.parse(result.stdout.trim()) as Json
          if (index === 3) {
            valid = canonical(value) === canonical(deriveV138Plan114IndependentPostSemantics(nonPass as never))
            reducedValue = { classification: "non_pass", reproductionEligible: false }
          } else if (index === 4) {
            valid = canonical(value) === canonical(deriveV138Plan114IndependentPostSemantics(success as never))
            reducedValue = { classification: "bounded_success", reproductionEligible: true }
          } else {
            valid = canonical(value) === canonical(deriveV138Plan114IndependentReproductionSemantics(reproduction as never))
            reducedValue = { acceptedCells: 540, requiredAccepted: 540, exact: true }
          }
        }
      }
      const guardCount = existsSync(guardPath)
        ? readFileSync(guardPath, "utf8").split("\n").filter(Boolean).length
        : 0
      if (guardCount !== 0) valid = false
      if (!valid) findings.push({ code: `MODE_${index + 1}_FAILED`, severity: "critical",
        subject: mode, detail: canonical(reducedValue).trim() })
      observations.push(modeObservationV3(mode, valid ? statuses[index]! : "failed", reducedValue, custody))
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("V138_PLAN122_")) throw error
      fail(`V138_PLAN122_MODE_PROCESS_INTEGRITY:${mode}`)
    } finally {
      if (added) {
        try { run("/usr/bin/git", ["worktree", "remove", "--force", linked], repoRoot, owner) }
        catch { fail(`V138_PLAN122_WORKTREE_CLEANUP_INVALID:${mode}`) }
      }
      rmSync(owner, { recursive: true, force: true })
    }
    const canonicalAfter = reauthenticateCanonicalSnapshot(repoRoot, canonicalBefore)
    if (canonical(canonicalAfter) !== canonical(canonicalBefore))
      fail(`V138_PLAN122_CANONICAL_CUSTODY_CHANGED:${mode}`)
  }
  const sorted = [...findings].sort((a, b) =>
    `${a.code}\0${a.subject}\0${a.detail}`.localeCompare(`${b.code}\0${b.subject}\0${b.detail}`))
  const observationsRoot = rooted("v138-plan-262-122-observations-v3", observations)
  return Object.freeze({
    modeNames: Object.freeze([...modes]),
    actualModesPassed: observations.filter(({ status }) => status !== "failed").length,
    producerCalls: 0 as const, readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const,
    observations: Object.freeze(observations), findings: Object.freeze(sorted),
    observationRoot: observationsRoot, producerGuardCount: 0 as const,
    reviewedCustody: canonicalBefore, reviewedClosureRoot: canonicalBefore.reviewedClosureRoot,
    canonicalCustody: canonicalBefore, sourceTree: canonicalBefore.sourceTree,
    sourceParent: canonicalBefore.sourceParent,
    recursiveDependencyRoot: canonicalBefore.recursiveDependencyRoot,
    recursiveDependencyCount: canonicalBefore.recursiveDependencyCount,
    installedClosureRoot: canonicalBefore.installedClosureRoot,
  })
}

export const assertV138Plan122PublishedLocalClosureForReview = (
  payload: Json,
  modes: V138Plan122ModeResult,
) => {
  checkV138PathStableCustodyForReview(modes.reviewedCustody, modes.reviewedCustody)
  const expectedModes = ["--check-source-only", "--check-prospective-custody", "--check-post-run-custody",
    "--check-non-pass-value", "--check-bounded-success-value", "--check-exact-reproduction-v17-value"]
  const observationRoot = rooted("v138-plan-262-122-observations-v3", modes.observations)
  const observationsValid = modes.observations.every((observation) => {
    const { observationRoot: recorded, ...body } = observation
    return observation.producerGuardCount === 0 &&
      observation.disposableLocalExecutionClosureRoot !== payload.canonicalLocalExecutionClosureRoot &&
      recorded === rooted("v138-plan-262-122-mode-observation-v3", body)
  })
  if (payload.reviewedClosureRoot !== modes.reviewedCustody.reviewedClosureRoot ||
      payload.canonicalLocalExecutionClosureRoot !== modes.reviewedCustody.localExecutionClosureRoot ||
      payload.localInstalledClosureRoot !== modes.reviewedCustody.localInstalledClosureRoot ||
      payload.localGitObjectRoot !== modes.reviewedCustody.localGitObjectRoot ||
      payload.localNativeSourcesRoot !== modes.reviewedCustody.localNativeSourcesRoot ||
      payload.findingCount !== 0 || payload.actualModesPassed !== 6 ||
      canonical(modes.modeNames) !== canonical(expectedModes) || modes.actualModesPassed !== 6 ||
      modes.findings.length !== 0 || modes.producerGuardCount !== 0 || !observationsValid ||
      modes.observationRoot !== observationRoot || payload.observationsRoot !== observationRoot ||
      canonical(payload.observations) !== canonical(modes.observations))
    fail("V138_PLAN122_PUBLISHED_LOCAL_CLOSURE_INVALID")
  return Object.freeze({ actualModesPassed: 6 as const, producerGuardCount: 0 as const,
    observationRoot,
    canonicalLocalExecutionClosureRoot: modes.reviewedCustody.localExecutionClosureRoot,
    recursiveDependencyRoot: modes.reviewedCustody.recursiveDependencyRoot,
    installedClosureRoot: modes.reviewedCustody.installedClosureRoot,
    pathStableNativeSourcesRoot: modes.reviewedCustody.pathStableNativeSourcesRoot })
}

export const renderV138Plan122EvidenceForReview = (
  repoRootInput: string,
  findings: readonly V138Plan122Finding[],
  modes?: V138Plan122ModeResult,
) => {
  const foundation = authenticateFoundation(path.resolve(repoRootInput))
  if (findings.length === 0 && modes === undefined) fail("V138_PLAN122_ZERO_REQUIRES_EXECUTED_MODES")
  if (findings.length === 0 && (modes!.actualModesPassed !== 6 || modes!.findings.length !== 0 ||
      modes!.producerCalls !== 0 || modes!.readinessInvoked !== false || modes!.liveInvoked !== false))
    fail("V138_PLAN122_ZERO_REQUIRES_SIX_CLEAN_MODES")
  return renderEvidence({ closure: foundation.closure,
    canonicalLocalExecutionClosureRoot: foundation.closure.localExecutionClosureRoot,
    findings, actualModesPassed: modes?.actualModesPassed ?? 0,
    observations: modes?.observations ?? Object.freeze([]),
    observationsRoot: modes?.observationRoot ?? rooted("v138-plan-262-122-observations-v3", []),
  })
}

export const writeV138Plan122ReviewForReview = (rootInput: string): void => {
  const root = path.resolve(rootInput)
  assertAbsent(root, [...REVIEW_PATHS, ...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  const modes = executeV138Plan122DisposableModes(root)
  const evidence = renderV138Plan122EvidenceForReview(root, modes.findings, modes)
  for (const [repoPath, bytes] of [[V138_PLAN122_PATHS.payload, Buffer.from(canonical(evidence.payload))],
    [V138_PLAN122_PATHS.review, evidence.reviewBytes],
    [V138_PLAN122_PATHS.carrier, Buffer.from(canonical(evidence.carrier))]] as const) {
    mkdirSync(path.dirname(target(root, repoPath)), { recursive: true })
    writeFileSync(target(root, repoPath), bytes, { mode: 0o644, flag: "wx" })
  }
}

const locatePublication = (root: string): string => {
  const commits = git(root, ["log", "--diff-filter=A", "--format=%H", "--", V138_PLAN122_PATHS.payload])
    .split("\n").filter(Boolean)
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!))
    fail("V138_PLAN122_PUBLICATION_INVALID")
  return commits[0]!
}
export const authenticateV138Plan122GeneratedReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const bytes = REVIEW_PATHS.map((repoPath) => readNoFollow(root, repoPath))
  const payload = jsonBytes(bytes[0]!, "V138_PLAN122_GENERATED_PAYLOAD_INVALID")
  const carrier = jsonBytes(bytes[2]!, "V138_PLAN122_GENERATED_CARRIER_INVALID")
  const findings = payload.findings as V138Plan122Finding[]
  const observations = payload.observations as V138Plan122ModeResult["observations"]
  if (!Array.isArray(findings) || !Array.isArray(observations) ||
      findings.length !== payload.findingCount || observations.length !== 6 ||
      payload.observationsRoot !== rooted("v138-plan-262-122-observations-v3", observations) ||
      observations.some((observation) => {
        const { observationRoot, ...body } = observation
        return observation.producerGuardCount !== 0 ||
          observation.disposableLocalExecutionClosureRoot === payload.canonicalLocalExecutionClosureRoot ||
          observationRoot !== rooted("v138-plan-262-122-mode-observation-v3", body)
      })) fail("V138_PLAN122_GENERATED_OBSERVATIONS_INVALID")
  const foundation = authenticateFoundation(root)
  const exact = renderEvidence({ closure: foundation.closure,
    canonicalLocalExecutionClosureRoot: payload.canonicalLocalExecutionClosureRoot,
    findings, actualModesPassed: payload.actualModesPassed,
    observations, observationsRoot: payload.observationsRoot })
  if (canonical(payload) !== canonical(exact.payload) || !bytes[1]!.equals(exact.reviewBytes) ||
      canonical(carrier) !== canonical(exact.carrier)) fail("V138_PLAN122_GENERATED_RERENDER_INVALID")
  return Object.freeze({ findingCount: payload.findingCount, actualModesPassed: payload.actualModesPassed,
    plan110Eligible: payload.plan110Eligible, payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot, carrierRoot: carrier.carrierRoot })
}
export const authenticateV138Plan122PublishedReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const commit = locatePublication(root)
  const bytes = exactAddPublication(root, commit, REVIEW_PATHS)
  const payload = jsonBytes(bytes[0]!, "V138_PLAN122_PUBLISHED_PAYLOAD_INVALID")
  const carrier = jsonBytes(bytes[2]!, "V138_PLAN122_PUBLISHED_CARRIER_INVALID")
  const findings = payload.findings as V138Plan122Finding[]
  if (!Array.isArray(findings) || findings.length !== payload.findingCount) fail("V138_PLAN122_FINDINGS_INVALID")
  const foundation = authenticateFoundation(root)
  const publishedObservations = payload.observations as V138Plan122ModeResult["observations"]
  if (!Array.isArray(publishedObservations) || publishedObservations.length !== 6 ||
      payload.observationsRoot !== rooted("v138-plan-262-122-observations-v3", publishedObservations) ||
      publishedObservations.some((observation) => {
        const { observationRoot, ...body } = observation
        return observation.producerGuardCount !== 0 ||
          observation.disposableLocalExecutionClosureRoot === payload.canonicalLocalExecutionClosureRoot ||
          observationRoot !== rooted("v138-plan-262-122-mode-observation-v3", body)
      })) fail("V138_PLAN122_PUBLISHED_OBSERVATIONS_INVALID")
  const exact = renderEvidence({ closure: foundation.closure,
    canonicalLocalExecutionClosureRoot: payload.canonicalLocalExecutionClosureRoot,
    findings, actualModesPassed: payload.actualModesPassed,
    observations: publishedObservations, observationsRoot: payload.observationsRoot })
  if (canonical(payload) !== canonical(exact.payload) || !bytes[1]!.equals(exact.reviewBytes) ||
      canonical(carrier) !== canonical(exact.carrier)) fail("V138_PLAN122_PUBLICATION_RERENDER_INVALID")
  const modes = executeV138Plan122DisposableModes(root)
  const expectedSemantic = publishedObservations.map(({ mode, status, producerGuardCount, reducedValue }) =>
    ({ mode, status, producerGuardCount, reducedValue }))
  const freshSemantic = modes.observations.map(({ mode, status, producerGuardCount, reducedValue }) =>
    ({ mode, status, producerGuardCount, reducedValue }))
  if (modes.actualModesPassed !== 6 || modes.findings.length !== 0 ||
      canonical(expectedSemantic) !== canonical(freshSemantic) ||
      foundation.closure.localExecutionClosureRoot !== payload.canonicalLocalExecutionClosureRoot)
    fail("V138_PLAN122_FRESH_SEMANTIC_EQUIVALENCE_INVALID")
  assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return Object.freeze({ publicationCommit: commit, payloadRoot: payload.payloadRoot,
    reviewRoot: carrier.reviewRoot, carrierRoot: carrier.carrierRoot,
    findingCount: payload.findingCount, actualModesPassed: payload.actualModesPassed,
    plan110Eligible: payload.findingCount === 0 && payload.actualModesPassed === 6,
    observationRoot: payload.observationsRoot,
    freshSemanticObservationRoot: modes.observationRoot,
    canonicalLocalExecutionClosureRoot: foundation.closure.localExecutionClosureRoot,
    recursiveDependencyRoot: foundation.closure.recursiveDependencyRoot,
    installedClosureRoot: foundation.closure.installedClosureRoot,
    pathStableNativeSourcesRoot: foundation.closure.pathStableNativeSourcesRoot,
    authorizesExecution: false as const, producerCalls: 0 as const,
    readinessInvoked: false as const, liveInvoked: false as const,
    freshCharged: 0 as const, freshAccepted: 0 as const, downstreamAuthority: "denied" as const })
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1) fail("V138_PLAN122_ARGUMENTS_INVALID")
  if (args[0] === "--write-review") { writeV138Plan122ReviewForReview(root); return }
  if (args[0] === "--check-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan122PublishedReview(root))}\n`); return
  }
  if (args[0] === "--check-generated-review") {
    process.stdout.write(`${JSON.stringify(authenticateV138Plan122GeneratedReview(root))}\n`); return
  }
  if (args[0] === "--check-observations") {
    process.stdout.write(`${JSON.stringify(executeV138Plan122DisposableModes(root))}\n`); return
  }
  fail("V138_PLAN122_ARGUMENTS_INVALID")
}
if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
