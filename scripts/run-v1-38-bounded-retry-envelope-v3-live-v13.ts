import { createHash } from "node:crypto"
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
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
  computeV138PathStableLocalExecutionClosureRoot,
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
const PLAN_93_CURRENT_AMENDMENT_COMMIT = "b331baad29053f523233558f66aa2855f2925b2b"
const PLAN_93_CURRENT_BLOB = "d540a5a7b0f7200ed86287a3744e46ebd66987bd"
const PLAN_93_CURRENT_AMENDMENT_PARENT = "b6cd3ec13aa25c6b1a5416a264ddf17855c19bad"
const PLAN_93_SUMMARY_BLOB = "e2db03c938d23305527bcad6ab0c479fbadd0bd3"
const PLAN_120_SUMMARY_BLOB = "86621b8f8ac5546b66265b2cc5ca3f6b80468be7"
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
const PLAN_117_SUBJECT_COMMIT = "41c716c55cec09a35180cd5229cf2f7545c504d4"
const PLAN_118_PUBLICATION_COMMIT = "e693f8fe1ff74e2c0d1d733c85c422fd68cb467c"
const PLAN_118_ROOTS = Object.freeze({
  payload: "sha256:6a262e4b8e267a6be8858c1247a49ceab3c0dbb23b9ebfea9f675a6e02f527e8",
  review: "sha256:be5bea259659c0b8878a09ff7ca7df991fda9b6702c8bc3b90f38922068d8f16",
  carrier: "sha256:ae957db112a31b563ae5357104351c0c8da90b1de7563d6ab86cfd2223286bcb",
} as const)
const ALLOWED_CORRECTION_COMMIT = "0f8258d888eba27cfaa48a9cc5175e578364077b"
const ALLOWED_CORRECTION_PARENT = "7f65ff66be29de4f655736f60d6c68683fae3e35"
const LIVE_V11_SOURCE_BLOB = "4cb2041a1305db808fe7459a64f331558e5f981c"
const LIVE_V11_REVIEWED_TEST_BLOB = "e5b32103b0355b4abeecfc6f85cf05a92ad787b8"
const LIVE_V11_CORRECTED_TEST_BLOB = "a7d7368c41a95a100c8c144c3a78dfe84aea76d4"
const LIVE_V11_PATHS = Object.freeze([
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v11.test.ts",
] as const)
const PLAN_120_V2_PUBLICATION_COMMIT = "c7390cf521234e13e6c09c784df25f65a722aa23"
const PLAN_120_V2_ROOTS = Object.freeze({
  payload: "sha256:a5338bfa3150a685cb35f2b402a35e80a0b78ff98df165998bc5c4581ea5f9da",
  review: "sha256:a5bf40478f1f9ba4eb7e0403407ba8bb2a1146c7ee139cc0820dacdcbdc765df",
  carrier: "sha256:699a0250fc3b4fff916601e50ad19b764319ce9a629198e93525f4dca62f78ab",
} as const)
const PLAN_120_V2_DISPOSITION = "process_invalid_local_context_misbinding" as const
const PLAN_119_SUBJECT_COMMIT = "0a85d4906e36b66b3d4d6d7a7269531ae9becf57"
const PLAN_119_TREE = "268ec124d743d6525d5be126e5e89c0526cb7304"
const PLAN_119_PARENT = "1517c6de267c21da33f35bf1c0ee7623cbc030ba"
const PLAN_119_SOURCE_BLOB = "872463aafbb2a835dcb9e530fefd009afeec9d95"
const PLAN_119_TEST_BLOB = "874813e8b9e6a54e8ef9655784415453c801b366"
const PLAN_119_PATHS = Object.freeze([
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v12.test.ts",
] as const)

export const V138_LIVE_V13_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v13.test.ts",
  plan93: `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
  plan93Summary: `${PHASE}/262-93-SUMMARY.md`,
  plan120Summary: `${PHASE}/262-120-SUMMARY.md`,
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
  plan118PayloadV1: ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-payload-v1.json",
  plan118ReviewV1: `${PHASE}/262-118-REVIEW.md`,
  plan118CarrierV1: ".planning/artifacts/v1.38-plan-262-118-live-v11-custody-review-carrier-v1.json",
  plan120PayloadV2: ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-payload-v2.json",
  plan120ReviewV2: `${PHASE}/262-120-REVIEW-v2.md`,
  plan120CarrierV2: ".planning/artifacts/v1.38-plan-262-120-live-v12-custody-review-carrier-v2.json",
  plan122Payload: ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-payload-v3.json",
  plan122Review: `${PHASE}/262-122-REVIEW-v3.md`,
  plan122Carrier: ".planning/artifacts/v1.38-plan-262-122-live-v13-custody-review-carrier-v3.json",
})
const plan116Paths = (version: number) => Object.freeze([
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-payload-v${version}.json`,
  version === 1 ? `${PHASE}/262-116-REVIEW.md` : `${PHASE}/262-116-REVIEW-v${version}.md`,
  `.planning/artifacts/v1.38-plan-262-116-supplement-v3-adapter-review-carrier-v${version}.json`,
] as const)
const PLAN_114_PATHS = Object.freeze([
  Object.freeze([V138_LIVE_V13_PATHS.plan114PayloadV1, V138_LIVE_V13_PATHS.plan114ReviewV1, V138_LIVE_V13_PATHS.plan114CarrierV1] as const),
  Object.freeze([V138_LIVE_V13_PATHS.plan114PayloadV2, V138_LIVE_V13_PATHS.plan114ReviewV2, V138_LIVE_V13_PATHS.plan114CarrierV2] as const),
] as const)
const PLAN_122_PATHS = Object.freeze([
  V138_LIVE_V13_PATHS.plan122Payload,
  V138_LIVE_V13_PATHS.plan122Review,
  V138_LIVE_V13_PATHS.plan122Carrier,
] as const)
const PLAN_120_V2_PATHS = Object.freeze([
  V138_LIVE_V13_PATHS.plan120PayloadV2,
  V138_LIVE_V13_PATHS.plan120ReviewV2,
  V138_LIVE_V13_PATHS.plan120CarrierV2,
] as const)
const PLAN_118_V1_PATHS = Object.freeze([
  V138_LIVE_V13_PATHS.plan118PayloadV1,
  V138_LIVE_V13_PATHS.plan118ReviewV1,
  V138_LIVE_V13_PATHS.plan118CarrierV1,
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
export const V138_LIVE_V13_FORBIDDEN_PRE_EFFECT = Object.freeze([
  ...PLAN_122_PATHS,
  ...PRODUCER_OUTPUTS,
  ...DOWNSTREAM_OUTPUTS,
])
export const V138_LIVE_V13_MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-reviewed-live-ready",
  "--run-reviewed-bounded-live-envelope",
] as const)
export const V138_LIVE_V13_REVIEWED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
  V138_LIVE_V13_PATHS.source,
  V138_LIVE_V13_PATHS.tests,
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
      fail(`V138_LIVE_V13_CURRENT_ENTRY_INVALID:${repoPath}`)
    const bytes = readFileSync(descriptor)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size ||
        before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs)
      fail(`V138_LIVE_V13_CURRENT_ENTRY_CHANGED:${repoPath}`)
    return bytes
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("V138_LIVE_V13_")) throw error
    fail(`V138_LIVE_V13_CURRENT_ENTRY_INVALID:${repoPath}`)
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
    fail(`V138_LIVE_V13_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail(`V138_LIVE_V13_SUCCESSOR_REWRITE:${paths[0]}`)
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
  if (canonical(changed) !== canonical(expected)) fail("V138_LIVE_V13_PUBLICATION_SCOPE_INVALID")
  const bytes = paths.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath])
    const match = /^100644 blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
    if (match === null || match[2] !== repoPath) fail(`V138_LIVE_V13_PUBLICATION_MODE_INVALID:${repoPath}`)
    const committed = gitBytes(root, commit, repoPath)
    if (!readRegularNoFollow(root, repoPath).equals(committed))
      fail(`V138_LIVE_V13_PUBLICATION_CURRENT_BYTES_INVALID:${repoPath}`)
    return committed
  })
  noRewrite(root, commit, paths)
  return Object.freeze({
    payload: jsonBytes(bytes[0]!, "V138_LIVE_V13_PAYLOAD_INVALID"),
    reviewBytes: bytes[1]!,
    carrier: jsonBytes(bytes[2]!, "V138_LIVE_V13_CARRIER_INVALID"),
  })
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (pathPresent(root, repoPath))
    fail(`V138_LIVE_V13_FORBIDDEN_DESTINATION_PRESENT:${repoPath}`)
}

const authenticateAllowedLiveV11Successor = (root: string) => {
  const plan118 = exactPublication(root, PLAN_118_PUBLICATION_COMMIT, PLAN_118_V1_PATHS)
  if (plan118.payload.schemaVersion !== "v1.38-plan-262-118-live-v11-custody-review-payload-v1" ||
      plan118.payload.subjectCommit !== PLAN_117_SUBJECT_COMMIT ||
      plan118.payload.payloadRoot !== PLAN_118_ROOTS.payload ||
      plan118.carrier.reviewRoot !== PLAN_118_ROOTS.review ||
      plan118.carrier.carrierRoot !== PLAN_118_ROOTS.carrier ||
      plan118.payload.findingCount !== 0 || plan118.payload.actualModesPassed !== 6 ||
      plan118.payload.plan110Eligible !== true || plan118.payload.authorizesExecution !== false ||
      plan118.payload.producerCalls !== 0 || plan118.payload.readinessInvoked !== false ||
      plan118.payload.liveInvoked !== false || plan118.payload.freshCharged !== 0 ||
      plan118.payload.freshAccepted !== 0 || plan118.payload.downstreamAuthority !== "denied")
    fail("V138_LIVE_V13_PLAN118_V1_HISTORY_INVALID")

  requireAncestor(root, PLAN_117_SUBJECT_COMMIT)
  const reviewedEntries = LIVE_V11_PATHS.map((repoPath, index) =>
    git(root, ["ls-tree", PLAN_117_SUBJECT_COMMIT, "--", repoPath]) ===
      `100644 blob ${index === 0 ? LIVE_V11_SOURCE_BLOB : LIVE_V11_REVIEWED_TEST_BLOB}\t${repoPath}`)
  if (reviewedEntries.some((valid) => !valid)) fail("V138_LIVE_V13_PLAN117_V1_HISTORY_INVALID")

  requireAncestor(root, ALLOWED_CORRECTION_COMMIT)
  if (git(root, ["rev-list", "--parents", "-n", "1", ALLOWED_CORRECTION_COMMIT]) !==
      `${ALLOWED_CORRECTION_COMMIT} ${ALLOWED_CORRECTION_PARENT}`)
    fail("V138_LIVE_V13_CORRECTION_PARENT_INVALID")
  if (git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", ALLOWED_CORRECTION_COMMIT]) !==
      `M\t${LIVE_V11_PATHS[1]}`)
    fail("V138_LIVE_V13_CORRECTION_SCOPE_INVALID")
  const correctionEntries = [LIVE_V11_SOURCE_BLOB, LIVE_V11_CORRECTED_TEST_BLOB].map((blob, index) =>
    git(root, ["ls-tree", ALLOWED_CORRECTION_COMMIT, "--", LIVE_V11_PATHS[index]!]) ===
      `100644 blob ${blob}\t${LIVE_V11_PATHS[index]}`)
  if (correctionEntries.some((valid) => !valid)) fail("V138_LIVE_V13_CORRECTION_ENTRY_INVALID")
  const parentEntries = [LIVE_V11_SOURCE_BLOB, LIVE_V11_REVIEWED_TEST_BLOB].map((blob, index) =>
    git(root, ["ls-tree", ALLOWED_CORRECTION_PARENT, "--", LIVE_V11_PATHS[index]!]) ===
      `100644 blob ${blob}\t${LIVE_V11_PATHS[index]}`)
  if (parentEntries.some((valid) => !valid)) fail("V138_LIVE_V13_CORRECTION_PARENT_ENTRY_INVALID")
  for (const [index, repoPath] of LIVE_V11_PATHS.entries()) {
    const expected = index === 0 ? LIVE_V11_SOURCE_BLOB : LIVE_V11_CORRECTED_TEST_BLOB
    if (!readRegularNoFollow(root, repoPath).equals(gitBytes(root, ALLOWED_CORRECTION_COMMIT, repoPath)) ||
        git(root, ["hash-object", repoPath]) !== expected)
      fail(`V138_LIVE_V13_CORRECTION_CURRENT_ENTRY_INVALID:${repoPath}`)
  }
  noRewrite(root, ALLOWED_CORRECTION_COMMIT, LIVE_V11_PATHS)
  const history = Object.freeze({
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
  return Object.freeze({
    ...history,
    allowedHistoryRoot: rooted("v138-plan-262-119-live-v13-allowed-history-v1", history),
  })
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
      fail(`V138_LIVE_V13_PLAN114_V${index + 1}_INVALID`)
    if (index === 1 && (publication.payload.plan109Eligible !== true ||
        publication.payload.supersedesPublicationCommit !== PLAN_114_V1_COMMIT))
      fail("V138_LIVE_V13_PLAN114_V2_AUTHORITY_INVALID")
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
      fail(`V138_LIVE_V13_PLAN116_V${index + 1}_INVALID`)
    if (index > 0 && publication.payload.supersedesPublicationCommit !== PLAN_116_COMMITS[index - 1])
      fail(`V138_LIVE_V13_PLAN116_V${index + 1}_SUPERSESSION_INVALID`)
  }
}
const authenticateSupplement = (root: string): Json => {
  requireAncestor(root, SUPPLEMENT_COMMIT)
  const scope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", SUPPLEMENT_COMMIT])
  if (scope !== `A\t${V138_LIVE_V13_PATHS.supplementV3}`) fail("V138_LIVE_V13_SUPPLEMENT_SCOPE_INVALID")
  const entry = git(root, ["ls-tree", SUPPLEMENT_COMMIT, "--", V138_LIVE_V13_PATHS.supplementV3])
  if (entry !== `100644 blob ${SUPPLEMENT_BLOB}\t${V138_LIVE_V13_PATHS.supplementV3}`)
    fail("V138_LIVE_V13_SUPPLEMENT_ENTRY_INVALID")
  const bytes = gitBytes(root, SUPPLEMENT_COMMIT, V138_LIVE_V13_PATHS.supplementV3)
  if (sha(bytes) !== SUPPLEMENT_SHA256 || !readRegularNoFollow(root, V138_LIVE_V13_PATHS.supplementV3).equals(bytes))
    fail("V138_LIVE_V13_SUPPLEMENT_BYTES_INVALID")
  noRewrite(root, SUPPLEMENT_COMMIT, [V138_LIVE_V13_PATHS.supplementV3])
  const supplement = jsonBytes(bytes, "V138_LIVE_V13_SUPPLEMENT_INVALID")
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
      supplement.downstreamAuthority !== "denied") fail("V138_LIVE_V13_SUPPLEMENT_SEMANTICS_INVALID")
  return supplement
}
const authenticatePairAndStop = (root: string): Readonly<{ seal: Json; envelope: Json }> => {
  requireAncestor(root, PAIR_COMMIT)
  const seal = jsonBytes(gitBytes(root, PAIR_COMMIT, V138_LIVE_V13_PATHS.seal), "V138_LIVE_V13_SEAL_INVALID")
  const envelope = jsonBytes(gitBytes(root, PAIR_COMMIT, V138_LIVE_V13_PATHS.envelope), "V138_LIVE_V13_ENVELOPE_INVALID")
  if (!readRegularNoFollow(root, V138_LIVE_V13_PATHS.seal, 8 * 1024 * 1024, 0o600)
      .equals(gitBytes(root, PAIR_COMMIT, V138_LIVE_V13_PATHS.seal)) ||
      !readRegularNoFollow(root, V138_LIVE_V13_PATHS.envelope, 8 * 1024 * 1024, 0o600)
        .equals(gitBytes(root, PAIR_COMMIT, V138_LIVE_V13_PATHS.envelope)))
    fail("V138_LIVE_V13_PAIR_CURRENT_BYTES_INVALID")
  noRewrite(root, PAIR_COMMIT, [V138_LIVE_V13_PATHS.seal, V138_LIVE_V13_PATHS.envelope])
  requireAncestor(root, PLAN_93_STOP_COMMIT)
  requireAncestor(root, PLAN_93_CURRENT_AMENDMENT_COMMIT)
  if (git(root, ["rev-list", "--parents", "-n", "1", PLAN_93_CURRENT_AMENDMENT_COMMIT]) !==
      `${PLAN_93_CURRENT_AMENDMENT_COMMIT} ${PLAN_93_CURRENT_AMENDMENT_PARENT}`)
    fail("V138_LIVE_V13_PLAN_CLOSEOUT_ANCESTRY_INVALID")
  const expectedScope = [
    ["M", ".planning/ROADMAP.md"],
    ["M", ".planning/STATE.md"],
    ["M", `${PHASE}/262-110-PLAN.md`],
    ["A", V138_LIVE_V13_PATHS.plan120Summary],
    ["M", `${PHASE}/262-122-PLAN.md`],
    ["M", V138_LIVE_V13_PATHS.plan93],
    ["A", V138_LIVE_V13_PATHS.plan93Summary],
  ].sort((a, b) => a[1]!.localeCompare(b[1]!))
  const actualScope = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", PLAN_93_CURRENT_AMENDMENT_COMMIT])
    .split("\n").filter(Boolean).map((line) => line.split("\t"))
    .sort((a, b) => a[1]!.localeCompare(b[1]!))
  if (canonical(actualScope) !== canonical(expectedScope))
    fail("V138_LIVE_V13_PLAN_CLOSEOUT_SCOPE_INVALID")
  for (const [repoPath, blob] of [
    [V138_LIVE_V13_PATHS.plan93, PLAN_93_CURRENT_BLOB],
    [V138_LIVE_V13_PATHS.plan93Summary, PLAN_93_SUMMARY_BLOB],
    [V138_LIVE_V13_PATHS.plan120Summary, PLAN_120_SUMMARY_BLOB],
  ] as const) {
    if (git(root, ["ls-tree", PLAN_93_CURRENT_AMENDMENT_COMMIT, "--", repoPath]) !==
        `100644 blob ${blob}\t${repoPath}` ||
        !readRegularNoFollow(root, repoPath).equals(
          gitBytes(root, PLAN_93_CURRENT_AMENDMENT_COMMIT, repoPath),
        )) fail(`V138_LIVE_V13_PLAN_CLOSEOUT_CURRENT_BYTES_INVALID:${repoPath}`)
  }
  noRewrite(root, PLAN_93_CURRENT_AMENDMENT_COMMIT, [
    V138_LIVE_V13_PATHS.plan93,
    V138_LIVE_V13_PATHS.plan93Summary,
    V138_LIVE_V13_PATHS.plan120Summary,
  ])
  if (seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied" ||
      envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
      canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      ["candidateSearchAuthorized", "formationMaterializationAuthorized", "gameplayChangeAuthorized",
        "holdoutOpeningAuthorized", "partialAcceptedEvidenceReusable", "phase263PlanningAuthorized",
        "productAuthorized", "productionAuthorized", "publicAuthorized"]
        .some((key) => envelope.policy[key] !== false) || envelope.policy.supervisedRuntimeOnly !== true)
    fail("V138_LIVE_V13_PAIR_SEMANTICS_INVALID")
  return Object.freeze({ seal, envelope })
}

const authenticatePlan120V2InvalidHistory = (root: string) => {
  const publication = exactPublication(root, PLAN_120_V2_PUBLICATION_COMMIT, PLAN_120_V2_PATHS)
  const { payload, carrier } = publication
  if (payload.schemaVersion !== "v1.38-plan-262-120-live-v12-custody-review-payload-v2" ||
      payload.payloadRoot !== PLAN_120_V2_ROOTS.payload ||
      carrier.reviewRoot !== PLAN_120_V2_ROOTS.review ||
      carrier.carrierRoot !== PLAN_120_V2_ROOTS.carrier ||
      payload.plan110Eligible !== true || payload.authorizesExecution !== false ||
      payload.producerCalls !== 0 || payload.readinessInvoked !== false ||
      payload.liveInvoked !== false || payload.freshCharged !== 0 ||
      payload.freshAccepted !== 0 || payload.downstreamAuthority !== "denied")
    fail("V138_LIVE_V13_PLAN120_V2_HISTORY_INVALID")
  const recomputed = computeV138PathStableLocalExecutionClosureRoot({
    reviewedClosureRoot: payload.reviewedClosureRoot,
    localInstalledClosureRoot: payload.localInstalledClosureRoot,
    localGitObjectRoot: payload.localGitObjectRoot,
    localNativeSourcesRoot: payload.localNativeSourcesRoot,
  })
  if (recomputed === payload.reviewedLocalExecutionClosureRoot)
    fail("V138_LIVE_V13_PLAN120_V2_EXPECTED_CONTEXT_MISBINDING_ABSENT")
  return Object.freeze({
    plan120PublicationCommit: PLAN_120_V2_PUBLICATION_COMMIT,
    plan120PayloadRoot: PLAN_120_V2_ROOTS.payload,
    plan120ReviewRoot: PLAN_120_V2_ROOTS.review,
    plan120CarrierRoot: PLAN_120_V2_ROOTS.carrier,
    plan120Disposition: PLAN_120_V2_DISPOSITION,
    supersededV2Plan110Eligible: false as const,
    recordedV2Plan110Eligible: true as const,
    recomputedV2CanonicalComponentRoot: recomputed,
    recordedV2DisposableRoot: payload.reviewedLocalExecutionClosureRoot as Sha,
  })
}

const authenticatePlan119Source = (root: string) => {
  requireAncestor(root, PLAN_119_SUBJECT_COMMIT)
  if (git(root, ["rev-parse", `${PLAN_119_SUBJECT_COMMIT}^{tree}`]) !== PLAN_119_TREE ||
      git(root, ["rev-parse", `${PLAN_119_SUBJECT_COMMIT}^`]) !== PLAN_119_PARENT)
    fail("V138_LIVE_V13_PLAN119_COMMIT_INVALID")
  for (const [index, repoPath] of PLAN_119_PATHS.entries()) {
    const blob = index === 0 ? PLAN_119_SOURCE_BLOB : PLAN_119_TEST_BLOB
    if (git(root, ["ls-tree", PLAN_119_SUBJECT_COMMIT, "--", repoPath]) !==
        `100644 blob ${blob}\t${repoPath}` ||
        !readRegularNoFollow(root, repoPath).equals(gitBytes(root, PLAN_119_SUBJECT_COMMIT, repoPath)))
      fail(`V138_LIVE_V13_PLAN119_ENTRY_INVALID:${repoPath}`)
  }
  noRewrite(root, PLAN_119_SUBJECT_COMMIT, PLAN_119_PATHS)
  return Object.freeze({
    plan119SubjectCommit: PLAN_119_SUBJECT_COMMIT,
    plan119SourceBlob: PLAN_119_SOURCE_BLOB,
    plan119TestBlob: PLAN_119_TEST_BLOB,
  })
}

export type V138LiveV13SourceAdmission = Readonly<{
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
  plan120PublicationCommit: typeof PLAN_120_V2_PUBLICATION_COMMIT
  plan120PayloadRoot: typeof PLAN_120_V2_ROOTS.payload
  plan120ReviewRoot: typeof PLAN_120_V2_ROOTS.review
  plan120CarrierRoot: typeof PLAN_120_V2_ROOTS.carrier
  plan120Disposition: typeof PLAN_120_V2_DISPOSITION
  supersededV2Plan110Eligible: false
  recordedV2Plan110Eligible: true
  recomputedV2CanonicalComponentRoot: Sha
  recordedV2DisposableRoot: Sha
  plan119SubjectCommit: typeof PLAN_119_SUBJECT_COMMIT
  plan119SourceBlob: typeof PLAN_119_SOURCE_BLOB
  plan119TestBlob: typeof PLAN_119_TEST_BLOB
  allowedHistoryRoot: Sha
  plan117SubjectCommit: typeof PLAN_117_SUBJECT_COMMIT
  plan118PublicationCommit: typeof PLAN_118_PUBLICATION_COMMIT
  plan118PayloadRoot: typeof PLAN_118_ROOTS.payload
  plan118ReviewRoot: typeof PLAN_118_ROOTS.review
  plan118CarrierRoot: typeof PLAN_118_ROOTS.carrier
  allowedCorrectionCommit: typeof ALLOWED_CORRECTION_COMMIT
  allowedCorrectionParent: typeof ALLOWED_CORRECTION_PARENT
  liveV11SourceBlob: typeof LIVE_V11_SOURCE_BLOB
  liveV11ReviewedTestBlob: typeof LIVE_V11_REVIEWED_TEST_BLOB
  liveV11CorrectedTestBlob: typeof LIVE_V11_CORRECTED_TEST_BLOB
  pair: Readonly<{ seal: Json; envelope: Json }>
  supplement: Json
}>

const authenticateV138LiveV13InvariantCustody = (rootInput: string): V138LiveV13SourceAdmission => {
  const root = path.resolve(rootInput)
  authenticatePublicationHistory(root)
  const allowedHistory = authenticateAllowedLiveV11Successor(root)
  const supplement = authenticateSupplement(root)
  const pair = authenticatePairAndStop(root)
  const plan120 = authenticatePlan120V2InvalidHistory(root)
  const plan119 = authenticatePlan119Source(root)
  assertAbsent(root, [V138_LIVE_V13_PATHS.supplementV1, V138_LIVE_V13_PATHS.supplementV2])
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
    ...plan120,
    ...plan119,
    ...allowedHistory,
    pair,
    supplement,
  })
}

export const authenticateV138LiveV13SourceOnly = (rootInput: string): V138LiveV13SourceAdmission => {
  const source = authenticateV138LiveV13InvariantCustody(rootInput)
  assertAbsent(path.resolve(rootInput), [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  return source
}

export const V138_LIVE_V13_REVIEW_MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
  "--check-non-pass-value",
  "--check-bounded-success-value",
  "--check-exact-reproduction-v17-value",
] as const)
export type V138LiveV13ModeObservation = Readonly<{
  mode: typeof V138_LIVE_V13_REVIEW_MODES[number]
  status: string
  producerGuardCount: 0
  reducedValue: Json
  disposableReviewedClosureRoot: Sha
  disposableLocalInstalledClosureRoot: Sha
  disposableLocalGitObjectRoot: Sha
  disposableLocalNativeSourcesRoot: Sha
  disposableLocalExecutionClosureRoot: Sha
  observationRoot: Sha
}>
export const computeV138LiveV13ObservationRoot = (body: Omit<V138LiveV13ModeObservation, "observationRoot">): Sha =>
  rooted("v138-plan-262-122-mode-observation-v3", body)
export const computeV138LiveV13ObservationsRoot = (observations: readonly V138LiveV13ModeObservation[]): Sha =>
  rooted("v138-plan-262-122-observations-v3", observations)
const plan122PayloadRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-payload-v3", body)
const plan122ReviewRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-markdown-v3", body)
const plan122CarrierRoot = (body: Json): Sha => rooted("v138-plan-262-122-live-v13-custody-review-carrier-v3", body)

const REVIEW_STATUS_BY_MODE = Object.freeze({
  "--check-source-only": "source_only_checked",
  "--check-prospective-custody": "prospective_custody_checked",
  "--check-post-run-custody": "post_run_no_effect_custody_checked",
  "--check-non-pass-value": "bounded_non_pass_value_checked",
  "--check-bounded-success-value": "bounded_success_value_checked",
  "--check-exact-reproduction-v17-value": "exact_reproduction_v17_value_checked",
} as const)
const checkReducedValue = (mode: V138LiveV13ModeObservation["mode"], value: Json): boolean => {
  if (mode === "--check-non-pass-value")
    return canonical(value) === canonical({ classification: "non_pass", reproductionEligible: false })
  if (mode === "--check-bounded-success-value")
    return canonical(value) === canonical({ classification: "bounded_success", reproductionEligible: true })
  if (mode === "--check-exact-reproduction-v17-value")
    return canonical(value) === canonical({ acceptedCells: 540, requiredAccepted: 540, exact: true })
  return canonical(value) === canonical({
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    downstreamAuthority: "denied",
  })
}
const checkObservations = (
  observations: readonly V138LiveV13ModeObservation[],
  canonicalLocalExecutionClosureRoot: Sha,
): "prospective" | "eligible" => {
  if (observations.length !== V138_LIVE_V13_REVIEW_MODES.length ||
      canonical(observations.map(({ mode }) => mode)) !== canonical(V138_LIVE_V13_REVIEW_MODES))
    fail("V138_LIVE_V13_OBSERVATIONS_INVALID")
  let prospective = true
  for (const observation of observations) {
    const roots = [
      observation.disposableReviewedClosureRoot,
      observation.disposableLocalInstalledClosureRoot,
      observation.disposableLocalGitObjectRoot,
      observation.disposableLocalNativeSourcesRoot,
      observation.disposableLocalExecutionClosureRoot,
      observation.observationRoot,
    ]
    if (observation.producerGuardCount !== 0 ||
        roots.some((root) => !/^sha256:[0-9a-f]{64}$/u.test(root)) ||
        observation.disposableLocalExecutionClosureRoot === canonicalLocalExecutionClosureRoot ||
        observation.disposableLocalExecutionClosureRoot !== computeV138PathStableLocalExecutionClosureRoot({
          reviewedClosureRoot: observation.disposableReviewedClosureRoot,
          localInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
          localGitObjectRoot: observation.disposableLocalGitObjectRoot,
          localNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot,
        }) ||
        observation.observationRoot !== computeV138LiveV13ObservationRoot({
          mode: observation.mode,
          status: observation.status,
          producerGuardCount: observation.producerGuardCount,
          reducedValue: observation.reducedValue,
          disposableReviewedClosureRoot: observation.disposableReviewedClosureRoot,
          disposableLocalInstalledClosureRoot: observation.disposableLocalInstalledClosureRoot,
          disposableLocalGitObjectRoot: observation.disposableLocalGitObjectRoot,
          disposableLocalNativeSourcesRoot: observation.disposableLocalNativeSourcesRoot,
          disposableLocalExecutionClosureRoot: observation.disposableLocalExecutionClosureRoot,
        })) fail("V138_LIVE_V13_OBSERVATIONS_INVALID")
    if (observation.status !== "prospective_only") prospective = false
  }
  if (prospective) return "prospective"
  for (const observation of observations)
    if (observation.status !== REVIEW_STATUS_BY_MODE[observation.mode] ||
        !checkReducedValue(observation.mode, observation.reducedValue))
      fail("V138_LIVE_V13_OBSERVATIONS_INVALID")
  return "eligible"
}

const renderPlan122Contracts = (input: {
  source: V138LiveV13SourceAdmission
  reviewedClosure: V138PathStableCustody
  canonicalLocalExecutionClosureRoot: Sha
  observations: readonly V138LiveV13ModeObservation[]
  plan122PublicationCommit: string
}) => {
  if (!/^[0-9a-f]{40}$/u.test(input.plan122PublicationCommit) ||
      !/^sha256:[0-9a-f]{64}$/u.test(input.canonicalLocalExecutionClosureRoot) ||
      input.canonicalLocalExecutionClosureRoot !== input.reviewedClosure.localExecutionClosureRoot ||
      canonical(input.reviewedClosure.checkoutPaths) !== canonical(V138_LIVE_V13_REVIEWED_SOURCE_PATHS) ||
      input.reviewedClosure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_LIVE_V13_FRESH_CLOSURE_INVALID")
  const observationDisposition = checkObservations(
    input.observations,
    input.canonicalLocalExecutionClosureRoot,
  )
  const eligible = observationDisposition === "eligible"
  const body = {
    schemaVersion: "v1.38-plan-262-122-live-v13-custody-review-payload-v3",
    protocol: "independent-live-v13-executable-custody-review-v3",
    subjectCommit: input.reviewedClosure.sourceCommit,
    sourceTree: input.reviewedClosure.sourceTree,
    sourceParent: input.reviewedClosure.sourceParent,
    checkoutManifestRoot: input.reviewedClosure.checkoutManifestRoot,
    recursiveDependencyRoot: input.reviewedClosure.recursiveDependencyRoot,
    recursiveDependencyCount: input.reviewedClosure.recursiveDependencyCount,
    installedClosureRoot: input.reviewedClosure.installedClosureRoot,
    nodeSha256: input.reviewedClosure.nodeSha256,
    pnpmDistributionSha256: input.reviewedClosure.pnpmDistributionSha256,
    pathStableNativeSourcesRoot: input.reviewedClosure.pathStableNativeSourcesRoot,
    gitExecutableSha256: input.reviewedClosure.gitExecutableSha256,
    hardenedGitArgumentsRoot: input.reviewedClosure.hardenedGitArgumentsRoot,
    reviewedClosureRoot: input.reviewedClosure.reviewedClosureRoot,
    canonicalLocalExecutionClosureRoot: input.canonicalLocalExecutionClosureRoot,
    localInstalledClosureRoot: input.reviewedClosure.localInstalledClosureRoot,
    localGitObjectRoot: input.reviewedClosure.localGitObjectRoot,
    localNativeSourcesRoot: input.reviewedClosure.localNativeSourcesRoot,
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
    allowedHistoryRoot: input.source.allowedHistoryRoot,
    plan117SubjectCommit: input.source.plan117SubjectCommit,
    plan118PublicationCommit: input.source.plan118PublicationCommit,
    plan118PayloadRoot: input.source.plan118PayloadRoot,
    plan118ReviewRoot: input.source.plan118ReviewRoot,
    plan118CarrierRoot: input.source.plan118CarrierRoot,
    allowedCorrectionCommit: input.source.allowedCorrectionCommit,
    allowedCorrectionParent: input.source.allowedCorrectionParent,
    liveV11SourceBlob: input.source.liveV11SourceBlob,
    liveV11ReviewedTestBlob: input.source.liveV11ReviewedTestBlob,
    liveV11CorrectedTestBlob: input.source.liveV11CorrectedTestBlob,
    supersedesPublicationCommit: input.source.plan120PublicationCommit,
    supersededV2PayloadRoot: input.source.plan120PayloadRoot,
    supersededV2ReviewRoot: input.source.plan120ReviewRoot,
    supersededV2CarrierRoot: input.source.plan120CarrierRoot,
    supersededV2Disposition: input.source.plan120Disposition,
    supersededV2Plan110Eligible: false,
    observations: input.observations,
    observationsRoot: computeV138LiveV13ObservationsRoot(input.observations),
    counters: ZERO_COUNTERS,
    reviewStatus: eligible ? "zero_findings" : "prospective_only",
    findings: [],
    findingCount: 0,
    actualModesPassed: eligible ? 6 : 0,
    plan110Eligible: eligible,
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
  const payload = Object.freeze({ ...body, payloadRoot: plan122PayloadRoot(body) })
  const reviewBody = {
    payloadRoot: payload.payloadRoot,
    reviewedClosureRoot: payload.reviewedClosureRoot,
    findingCount: 0,
    actualModesPassed: eligible ? 6 : 0,
    plan110Eligible: eligible,
    producerCalls: 0,
    downstreamAuthority: "denied",
  }
  const reviewRoot = plan122ReviewRoot(reviewBody)
  const reviewBytes = Buffer.from(`---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "122"\nreview_type: independent_live_v13_executable_custody_v3\nstatus: ${eligible ? "zero_findings" : "prospective_only"}\nfinding_count: 0\nreview_root: ${reviewRoot}\n---\n\n# Phase 262 Plan 122 Independent Live-v13 Executable-Custody Review v3\n\n${eligible ? "**ZERO FINDINGS.** Six producer-incapable modes passed. Only revised Plan 110 is eligible." : "**PROSPECTIVE ONLY.** No independently reviewed mode has passed and Plan 110 is ineligible."} Authorizes execution: false. Producer calls: 0. Readiness/live invoked: false. Fresh charged/accepted: 0/0. Downstream authority: denied.\n`)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-122-live-v13-custody-review-carrier-v3",
    protocol: "nonrecursive-external-review-carrier-v1",
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: sha(Buffer.from(canonical(payload))),
    reviewSha256: sha(reviewBytes),
    findingCount: 0,
    actualModesPassed: eligible ? 6 : 0,
    subjectCommit: input.reviewedClosure.sourceCommit,
    plan110Eligible: eligible,
    producerCalls: 0,
    readinessInvoked: false,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: plan122CarrierRoot(carrierBody) })
  return Object.freeze({ payload, reviewBytes, reviewRoot, carrier, plan122PublicationCommit: input.plan122PublicationCommit })
}

export const deriveV138LiveV13ProspectiveContractsForReview = (input: {
  repoRoot: string
  reviewedSourceCommit: string
  plan122PublicationCommit: string
  canonicalLocalExecutionClosureRoot?: Sha
  observations?: readonly V138LiveV13ModeObservation[]
}) => {
  const source = authenticateV138LiveV13SourceOnly(input.repoRoot)
  const reviewedClosure = deriveV138PathStableCustody(input.repoRoot, {
    sourceCommit: input.reviewedSourceCommit,
    checkoutPaths: V138_LIVE_V13_REVIEWED_SOURCE_PATHS,
  })
  checkV138PathStableCustodyForReview(reviewedClosure, reviewedClosure)
  if (input.canonicalLocalExecutionClosureRoot !== undefined &&
      input.canonicalLocalExecutionClosureRoot !== reviewedClosure.localExecutionClosureRoot)
    fail("V138_LIVE_V13_FRESH_CLOSURE_INVALID")
  const observations = input.observations ?? V138_LIVE_V13_REVIEW_MODES.map((mode, index) => {
    const disposableReviewedClosureRoot = rooted(
      "v138-plan-262-121-prospective-disposable-reviewed-v1",
      { mode, index, reviewedClosureRoot: reviewedClosure.reviewedClosureRoot },
    )
    const disposableLocalInstalledClosureRoot = rooted(
      "v138-plan-262-121-prospective-disposable-installed-v1", { mode, index },
    )
    const disposableLocalGitObjectRoot = rooted(
      "v138-plan-262-121-prospective-disposable-git-v1", { mode, index },
    )
    const disposableLocalNativeSourcesRoot = rooted(
      "v138-plan-262-121-prospective-disposable-native-v1", { mode, index },
    )
    const observationBody = Object.freeze({
      mode,
      status: "prospective_only",
      producerGuardCount: 0 as const,
      reducedValue: Object.freeze({ prospectiveIndex: index }),
      disposableReviewedClosureRoot,
      disposableLocalInstalledClosureRoot,
      disposableLocalGitObjectRoot,
      disposableLocalNativeSourcesRoot,
      disposableLocalExecutionClosureRoot: computeV138PathStableLocalExecutionClosureRoot({
        reviewedClosureRoot: disposableReviewedClosureRoot,
        localInstalledClosureRoot: disposableLocalInstalledClosureRoot,
        localGitObjectRoot: disposableLocalGitObjectRoot,
        localNativeSourcesRoot: disposableLocalNativeSourcesRoot,
      }),
    })
    return Object.freeze({ ...observationBody, observationRoot: computeV138LiveV13ObservationRoot(observationBody) })
  })
  const contracts = renderPlan122Contracts({
    source,
    reviewedClosure,
    canonicalLocalExecutionClosureRoot:
      input.canonicalLocalExecutionClosureRoot ?? reviewedClosure.localExecutionClosureRoot,
    observations,
    plan122PublicationCommit: input.plan122PublicationCommit,
  })
  return Object.freeze({ source, reviewedClosure, ...contracts })
}

export const checkV138LiveV13FreshClosureForReview = (input: {
  freshClosure: V138PathStableCustody
  candidateClosure: V138PathStableCustody
  claimedLocalExecutionClosureRoot: Sha
}) => {
  try { checkV138PathStableCustodyForReview(input.freshClosure, input.candidateClosure) }
  catch { fail("V138_LIVE_V13_FRESH_CLOSURE_INVALID") }
  if (input.claimedLocalExecutionClosureRoot !== input.freshClosure.localExecutionClosureRoot ||
      input.candidateClosure.pathnameLaunchReplacementResistanceClaimed !== false)
    fail("V138_LIVE_V13_FRESH_CLOSURE_INVALID")
  return true as const
}

export const checkV138LiveV13ProspectiveCustodyForReview = (input: {
  repoRoot: string
  source: V138LiveV13SourceAdmission
  reviewedClosure: V138PathStableCustody
  canonicalLocalExecutionClosureRoot: Sha
  observations: readonly V138LiveV13ModeObservation[]
  plan122PublicationCommit: string
  plan122: Readonly<{ payload: Json; reviewBytes: Buffer; carrier: Json; reviewRoot: Sha }>
  requireEligiblePublication?: boolean
}) => {
  const root = path.resolve(input.repoRoot)
  const freshSource = authenticateV138LiveV13InvariantCustody(root)
  if (canonical(input.source) !== canonical(freshSource)) fail("V138_LIVE_V13_FRESH_SOURCE_INVALID")
  const freshClosure = deriveV138PathStableCustody(root, {
    sourceCommit: input.reviewedClosure.sourceCommit,
    checkoutPaths: V138_LIVE_V13_REVIEWED_SOURCE_PATHS,
  })
  checkV138LiveV13FreshClosureForReview({
    freshClosure,
    candidateClosure: input.reviewedClosure,
    claimedLocalExecutionClosureRoot: input.canonicalLocalExecutionClosureRoot,
  })
  const exact = renderPlan122Contracts({ ...input, source: freshSource, reviewedClosure: freshClosure })
  if (canonical(input.plan122.payload) !== canonical(exact.payload) ||
      !input.plan122.reviewBytes.equals(exact.reviewBytes) ||
      canonical(input.plan122.carrier) !== canonical(exact.carrier) ||
      input.plan122.reviewRoot !== exact.reviewRoot)
    fail("V138_LIVE_V13_PLAN122_CUSTODY_INVALID")
  if (input.requireEligiblePublication === true && (
    exact.payload.reviewStatus !== "zero_findings" ||
    exact.payload.findingCount !== 0 ||
    exact.payload.actualModesPassed !== 6 ||
    exact.payload.plan110Eligible !== true ||
    exact.payload.producerCalls !== 0 ||
    exact.payload.readinessInvoked !== false ||
    exact.payload.liveInvoked !== false ||
    exact.payload.freshCharged !== 0 ||
    exact.payload.freshAccepted !== 0 ||
    exact.payload.authorizesExecution !== false ||
    exact.payload.downstreamAuthority !== "denied"))
    fail("V138_LIVE_V13_PLAN122_NOT_ELIGIBLE")
  return Object.freeze({
    ...exact,
    canonicalLocalExecutionClosureRoot: freshClosure.localExecutionClosureRoot,
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
  const publicationCommit = git(root, ["log", "--diff-filter=A", "--format=%H", "--", V138_LIVE_V13_PATHS.plan122Payload])
  if (!/^[0-9a-f]{40}$/u.test(publicationCommit)) fail("V138_LIVE_V13_PLAN122_PUBLICATION_INVALID")
  const plan122 = exactPublication(root, publicationCommit, PLAN_122_PATHS)
  const subjectCommit = plan122.payload.subjectCommit
  if (typeof subjectCommit !== "string" || !/^[0-9a-f]{40}$/u.test(subjectCommit))
    fail("V138_LIVE_V13_PLAN122_SUBJECT_INVALID")
  const source = authenticateV138LiveV13InvariantCustody(root)
  const reviewedClosure = deriveV138PathStableCustody(root, {
    sourceCommit: subjectCommit,
    checkoutPaths: V138_LIVE_V13_REVIEWED_SOURCE_PATHS,
  })
  const checked = checkV138LiveV13ProspectiveCustodyForReview({
    repoRoot: root,
    source,
    reviewedClosure,
    canonicalLocalExecutionClosureRoot: plan122.payload.canonicalLocalExecutionClosureRoot,
    observations: plan122.payload.observations,
    plan122PublicationCommit: publicationCommit,
    plan122: { ...plan122, reviewRoot: plan122.carrier.reviewRoot },
    requireEligiblePublication: true,
  })
  if (boundary === "pre") assertAbsent(root, [...PRODUCER_OUTPUTS, ...DOWNSTREAM_OUTPUTS])
  else assertAbsent(root, DOWNSTREAM_OUTPUTS)
  return checked
}

export const authenticateV138LiveV13FutureCustodyForReview = authenticateFutureCustody

export const checkV138LiveV13PostRunOutputCustodyForReview =
  checkV138LiveV10PostRunOutputCustodyForReview
export const computeV138LiveV13ReproductionV17ReceiptRoot =
  computeV138LiveV10ReproductionV17ReceiptRoot
export const checkV138LiveV13ReproductionV17ForReview =
  checkV138LiveV10ReproductionV17ForReview

export const inspectV138LiveV13ProductionBoundarySourceForReview = (source: string) => {
  const sourceFile = ts.createSourceFile(V138_LIVE_V13_PATHS.source, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const producerModule = "./run-v1-38-bounded-retry-envelope-v3.js"
  const producerImports = sourceFile.statements.filter((statement): statement is ts.ImportDeclaration =>
    ts.isImportDeclaration(statement) && statement.moduleSpecifier.getText(sourceFile) ===
      '"./run-v1-38-bounded-retry-envelope-v3.js"')
  const importedBindings = producerImports.flatMap((statement) => {
    const bindings = statement.importClause?.namedBindings
    return bindings !== undefined && ts.isNamedImports(bindings) ? [...bindings.elements] : []
  })
  const exactImport = producerImports.length === 1 && importedBindings.some((binding) =>
    binding.propertyName === undefined && binding.name.text === "runV138V3ProductionLive")
  let producerReferences = 0
  let reviewedOwnerReferences = 0
  let producerModuleLiteralCount = 0
  let dynamicProducerAccessCount = 0
  const producerCalls: ts.CallExpression[] = []
  const reviewedOwnerCalls: ts.CallExpression[] = []
  const enclosingOwner = (node: ts.Node): string | undefined => {
    let current: ts.Node | undefined = node.parent
    while (current !== undefined) {
      if ((ts.isArrowFunction(current) || ts.isFunctionExpression(current)) &&
          ts.isVariableDeclaration(current.parent) && ts.isIdentifier(current.parent.name))
        return current.parent.name.text
      if (ts.isFunctionDeclaration(current) && current.name !== undefined) return current.name.text
      current = current.parent
    }
    return undefined
  }
  const exactLiveSelectorAncestor = (node: ts.Node): boolean => {
    let current: ts.Node | undefined = node.parent
    while (current !== undefined) {
      if (ts.isIfStatement(current)) {
        const expression = current.expression
        return ts.isBinaryExpression(expression) &&
          expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
          expression.left.getText(sourceFile) === "args[0]" &&
          ts.isStringLiteral(expression.right) &&
          expression.right.text === "--run-reviewed-bounded-live-envelope" &&
          current.thenStatement.pos <= node.pos && node.end <= current.thenStatement.end
      }
      current = current.parent
    }
    return false
  }
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteral(node) && node.text === producerModule) {
      producerModuleLiteralCount += 1
      const isInspectorConstant = ts.isVariableDeclaration(node.parent) &&
        ts.isIdentifier(node.parent.name) && node.parent.name.text === "producerModule"
      if (!ts.isImportDeclaration(node.parent) && !isInspectorConstant) dynamicProducerAccessCount += 1
    }
    if (ts.isStringLiteral(node) && node.text === "runV138V3ProductionLive" &&
        (ts.isElementAccessExpression(node.parent) || ts.isPropertyAssignment(node.parent)))
      dynamicProducerAccessCount += 1
    if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
        node.getText(sourceFile).includes("runV138V3ProductionLive")) dynamicProducerAccessCount += 1
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword)
      dynamicProducerAccessCount += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "require")
      dynamicProducerAccessCount += 1
    if (ts.isIdentifier(node) && node.text === "runV138V3ProductionLive") producerReferences += 1
    if (ts.isIdentifier(node) && node.text === "runV138ReviewedBoundedLiveEnvelopeV13")
      reviewedOwnerReferences += 1
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138V3ProductionLive") producerCalls.push(node)
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
        node.expression.text === "runV138ReviewedBoundedLiveEnvelopeV13") reviewedOwnerCalls.push(node)
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  const producerCall = producerCalls[0]
  const reviewedOwnerCall = reviewedOwnerCalls[0]
  const producerCallValid = producerCalls.length === 1 && producerCall !== undefined &&
    ts.isAwaitExpression(producerCall.parent) &&
    enclosingOwner(producerCall) === "runV138ReviewedBoundedLiveEnvelopeV13" &&
    producerCall.arguments.length === 2 && producerCall.arguments[0]?.getText(sourceFile) === "repoRoot" &&
    producerCall.arguments[1] !== undefined && ts.isObjectLiteralExpression(producerCall.arguments[1]) &&
    canonical(producerCall.arguments[1].properties.map((property) => property.name?.getText(sourceFile)).sort()) ===
      canonical(["checkPair", "validateInputs"])
  const reviewedDispatchValid = reviewedOwnerReferences === 2 && reviewedOwnerCalls.length === 1 &&
    reviewedOwnerCall !== undefined && ts.isAwaitExpression(reviewedOwnerCall.parent) &&
    enclosingOwner(reviewedOwnerCall) === "executeV138LiveV13Cli" &&
    reviewedOwnerCall.arguments.length === 1 && reviewedOwnerCall.arguments[0]?.getText(sourceFile) === "root" &&
    exactLiveSelectorAncestor(reviewedOwnerCall)
  if (!exactImport || importedBindings.length !== 2 || producerReferences !== 2 ||
      producerModuleLiteralCount !== 2 || dynamicProducerAccessCount !== 0 ||
      !producerCallValid || !reviewedDispatchValid ||
      !source.includes('"--check-reviewed-live-ready"') ||
      !source.includes('"--run-reviewed-bounded-live-envelope"') ||
      /runV138ReviewedBoundedLiveEnvelopeV13\s*=\s*async\s*\([^)]*,/u.test(source) ||
      /Partial<\{[^}]*?(?:producer|readiness|renderer)/su.test(source))
    fail("V138_LIVE_V13_PRODUCTION_BOUNDARY_INVALID")
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

export const inspectV138LiveV13ProductionBoundaryForReview = (rootInput: string) =>
  inspectV138LiveV13ProductionBoundarySourceForReview(
    readRegularNoFollow(path.resolve(rootInput), V138_LIVE_V13_PATHS.source).toString("utf8"),
  )

export const runV138ReviewedBoundedLiveEnvelopeV13 = async (repoRoot: string): Promise<void> => {
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
        fail("V138_LIVE_V13_CANONICAL_LOCAL_CLOSURE_CHANGED")
      assertV138LiveV10PostRunForReview(repoRoot)
    } catch (error) { postCustodyError = error }
  }
  settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)
}

const resolveCurrentSubjectCommit = (root: string): string => {
  const commit = git(root, ["log", "-1", "--format=%H", "--", V138_LIVE_V13_PATHS.source, V138_LIVE_V13_PATHS.tests])
  if (!/^[0-9a-f]{40}$/u.test(commit)) fail("V138_LIVE_V13_SUBJECT_COMMIT_INVALID")
  return commit
}

export const executeV138LiveV13Cli = async (
  args: readonly string[],
  injected?: Partial<{ repoRoot: string; writeOutput: (value: string) => void }>,
): Promise<void> => {
  if (args.length !== 1 || !V138_LIVE_V13_MODES.includes(args[0] as never))
    fail("V138_LIVE_V13_ARGUMENTS_INVALID")
  const root = injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const output = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (args[0] === "--run-reviewed-bounded-live-envelope") {
    await runV138ReviewedBoundedLiveEnvelopeV13(root)
    output(`${JSON.stringify({ status: "reviewed_bounded_live_complete" })}\n`)
    return
  }
  if (args[0] === "--check-source-only") {
    const result = authenticateV138LiveV13SourceOnly(root)
    output(`${JSON.stringify({ status: "source_only_checked", plan114V2PayloadRoot: result.plan114V2PayloadRoot,
      plan116V4PayloadRoot: result.plan116V4PayloadRoot, supplementRoot: result.supplementRoot,
      producerCalls: 0, readinessInvoked: false, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, downstreamAuthority: "denied" })}\n`)
    return
  }
  if ((args[0] === "--check-prospective-custody" || args[0] === "--check-post-run-custody") &&
      !pathPresent(root, V138_LIVE_V13_PATHS.plan122Payload)) {
    const subjectCommit = resolveCurrentSubjectCommit(root)
    const prospective = deriveV138LiveV13ProspectiveContractsForReview({
      repoRoot: root,
      reviewedSourceCommit: subjectCommit,
      plan122PublicationCommit: "0".repeat(40),
    })
    checkV138LiveV13ProspectiveCustodyForReview({
      repoRoot: root,
      source: prospective.source,
      reviewedClosure: prospective.reviewedClosure,
      canonicalLocalExecutionClosureRoot: prospective.reviewedClosure.localExecutionClosureRoot,
      observations: prospective.payload.observations,
      plan122PublicationCommit: "0".repeat(40),
      plan122: prospective,
    })
    output(`${JSON.stringify({
      status: args[0] === "--check-post-run-custody" ? "post_run_no_effect_custody_checked" :
        "prospective_custody_checked", subjectCommit,
      plan114V2PayloadRoot: prospective.source.plan114V2PayloadRoot,
      plan116V4PayloadRoot: prospective.source.plan116V4PayloadRoot,
      supplementRoot: prospective.source.supplementRoot, payloadRoot: prospective.payload.payloadRoot,
      reviewRoot: prospective.reviewRoot, carrierRoot: prospective.carrier.carrierRoot,
      reviewedClosureRoot: prospective.reviewedClosure.reviewedClosureRoot,
      producerCalls: 0, readinessInvoked: false,
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
if (isEntrypoint) await executeV138LiveV13Cli(process.argv.slice(2))
