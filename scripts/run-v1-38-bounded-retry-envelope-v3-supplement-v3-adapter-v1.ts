import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Json = Record<string, any>

export const V138_SUPPLEMENT_V3_ADAPTER_SELECTORS = Object.freeze([
  "--check-source-only",
  "--write-supplement-v3",
  "--check-supplement-v3",
] as const)

const PHASE = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const LIVE_SOURCE_COMMIT = "ba1f8ddb4d701762d5d443f41edcbb691bb0eda5"
const LIVE_SOURCE_TREE = "0a35c771e145b9feee43d696dbb1b6ae10c42b9c"
const LIVE_SOURCE_PARENT = "e0215b7738ab44bdd4a8f536cc53ee71008989f9"
const REVIEWED_CLOSURE_ROOT = "sha256:8929dd2d2d8c9c72c293a7b9e41e722ef274a1296160e877685ce0956969b852"
const REVIEWED_LOCAL_ROOT = "sha256:9e69dca582dd49f119cde283491173d0c3fd7c5aca40dfaf95e53c99dec5ee0c"
const PLAN114_V2_COMMIT = "34bc94ec4e348f71e6055a091d60a505cffc0d79"
const PLAN114_V2_ROOTS = Object.freeze({
  payload: "sha256:d4ca10f333598968c0f9b9d7729d5193c981f501a8284cdd5626f2f2b5a518ac",
  review: "sha256:f802ac51d79702f1163fd8d5151b2b7384e2d43de1d97f15ddd74f39538a79ee",
  carrier: "sha256:8ddd2dc65d0601f8c6d027e225c16e8ea81574f197f877dd4f3c1830f5563c26",
})
const PLAN114_V1_COMMIT = "ab539ab2b3706981aaeb053b3fafce6b46532b40"
const PLAN114_FINAL_SOURCE_COMMIT = "1314e24b43f9469e0f6d425c007d88ca2fca9716"
const PLAN114_FINAL_SOURCE_TREE = "95cc3b5b78bcf0317f0dba1e3aeeb979c48de89a"
const PLAN114_FINAL_SOURCE_PARENT = "0c0a52e947c1693652446fedf1e8b0fb6ab69068"
const PLAN114_FINAL_REVIEW_COMMIT = "92415ea08ccddd2c8fae3c8fc922078d14c589c9"
const PLAN114_FINAL_REVIEW_SHA = "sha256:e200f87639b8680603315c2317327390af8389328a9e388ed37eeac09642c201"
const CORRECTED_COMMIT = "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const PLAN112_V1_COMMIT = "29d4cf5c942d63fd767f658ec2506a5764ff19fa"
const PLAN112_V2_COMMIT = "5b5ec60154bb82a3cfa3b25a03f8a2379010c829"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const PLAN93_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
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
const LIVE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/lib/v1-38-bounded-retry-v3-path-stable-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v10.ts",
])
const PATHS = Object.freeze({
  payloadV2: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v2.json",
  reviewV2: `${PHASE}/262-114-REVIEW-v2.md`,
  carrierV2: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v2.json",
  payloadV1: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-payload-v1.json",
  reviewV1: `${PHASE}/262-114-REVIEW.md`,
  carrierV1: ".planning/artifacts/v1.38-plan-262-114-live-v10-custody-review-carrier-v1.json",
  reviewer: "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.ts",
  reviewerTest: "scripts/check-v1-38-plan-262-114-live-v10-custody-v1.test.ts",
  finalReview: `${PHASE}/262-114-FINAL-CLEAN-REVIEW.md`,
  correctedPayload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  correctedReview: `${PHASE}/262-108-REVIEW-FIX.md`,
  correctedCarrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
  plan112V1Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json",
  plan112V1Review: `${PHASE}/262-112-REVIEW.md`,
  plan112V1Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json",
  plan112V2Payload: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v2.json",
  plan112V2Review: `${PHASE}/262-112-REVIEW-FIX.md`,
  plan112V2Carrier: ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v2.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  envelope: ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  plan93: `${PHASE}/262-93-PRESTART-INTEGRITY-STOP.md`,
  supplement1: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplement2: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
  supplement3: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v3.json",
})
const nativeWriterSource = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "native/v1-38-plan-262-115-exclusive-writer-v1.c")
const EFFECT_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
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
const sha = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const rooted = (domain: string, value: unknown): Sha => sha(`${domain}\0${canonical(value)}`)
const target = (root: string, repoPath: string): string => {
  const base = path.resolve(root)
  const resolved = path.resolve(base, repoPath)
  if (!resolved.startsWith(`${base}${path.sep}`)) fail("V138_SUPPLEMENT_ADAPTER_PATH_INVALID")
  return resolved
}
const git = (root: string, args: readonly string[], allowFailure = false): string =>
  runV138RetryV3IsolatedGit(root, args, allowFailure)
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
const readRegularNoFollow = (root: string, repoPath: string): Buffer => {
  const absolute = target(root, repoPath)
  const before = lstatSync(absolute)
  if (!before.isFile() || before.isSymbolicLink() || (before.mode & 0o7777) !== 0o644)
    fail(`V138_SUPPLEMENT_ADAPTER_FILE_UNSAFE:${repoPath}`)
  const fd = openSync(absolute, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(fd)
    if (!opened.isFile() || (opened.mode & 0o7777) !== 0o644 || opened.dev !== before.dev ||
        opened.ino !== before.ino || opened.size !== before.size)
      fail(`V138_SUPPLEMENT_ADAPTER_FILE_CHANGED:${repoPath}`)
    const bytes = readFileSync(fd)
    const after = fstatSync(fd)
    if (!after.isFile() || (after.mode & 0o7777) !== 0o644 || after.dev !== opened.dev ||
        after.ino !== opened.ino || after.size !== opened.size || after.mode !== opened.mode)
      fail(`V138_SUPPLEMENT_ADAPTER_FILE_CHANGED:${repoPath}`)
    return bytes
  } finally { closeSync(fd) }
}
const pathPresent = (root: string, repoPath: string): boolean => {
  try { lstatSync(target(root, repoPath)); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false
    throw error
  }
}
const assertAbsent = (root: string, paths: readonly string[]): void => {
  for (const repoPath of paths) if (pathPresent(root, repoPath))
    fail(`V138_SUPPLEMENT_ADAPTER_FORBIDDEN_PRESENT:${repoPath}`)
}
const ancestor = (root: string, commit: string): void => {
  if (git(root, ["merge-base", "--is-ancestor", commit, "HEAD"], true) !== "")
    fail(`V138_SUPPLEMENT_ADAPTER_ANCESTRY_INVALID:${commit}`)
}
const noRewrite = (root: string, commit: string, paths: readonly string[]): void => {
  if (git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", ...paths]) !== "")
    fail("V138_SUPPLEMENT_ADAPTER_SUCCESSOR_REWRITE")
}
const committed = (root: string, commit: string, repoPath: string, compareCurrent = true) => {
  const entry = git(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath) fail(`V138_SUPPLEMENT_ADAPTER_ENTRY_INVALID:${repoPath}`)
  const bytes = gitBytes(root, commit, repoPath)
  if (compareCurrent && !readRegularNoFollow(root, repoPath).equals(bytes))
    fail(`V138_SUPPLEMENT_ADAPTER_CURRENT_BYTES_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode: match[1]!, blob: match[2]!, sha256: sha(bytes), bytes })
}
const jsonAt = (root: string, commit: string, repoPath: string): Json => {
  const bytes = gitBytes(root, commit, repoPath)
  const value = JSON.parse(bytes.toString("utf8")) as Json
  if (!bytes.equals(Buffer.from(canonical(value)))) fail(`V138_SUPPLEMENT_ADAPTER_NONCANONICAL:${repoPath}`)
  return value
}
const exactPublication = (root: string, commit: string, paths: readonly string[]): void => {
  ancestor(root, commit)
  const actual = git(root, ["diff-tree", "--no-commit-id", "--name-status", "-r", commit])
    .split("\n").filter(Boolean).sort()
  const expected = paths.map((repoPath) => `A\t${repoPath}`).sort()
  if (canonical(actual) !== canonical(expected)) fail("V138_SUPPLEMENT_ADAPTER_PUBLICATION_SCOPE_INVALID")
  for (const repoPath of paths) {
    const record = committed(root, commit, repoPath)
    if (record.mode !== "100644") fail("V138_SUPPLEMENT_ADAPTER_PUBLICATION_MODE_INVALID")
  }
  noRewrite(root, commit, paths)
}

const renderSupplement = (): Json => {
  const body = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v3",
    supersessionScope: "executable_source_custody_only",
    plan114PublicationCommit: PLAN114_V2_COMMIT,
    plan114PayloadRoot: PLAN114_V2_ROOTS.payload,
    plan114ReviewRoot: PLAN114_V2_ROOTS.review,
    plan114CarrierRoot: PLAN114_V2_ROOTS.carrier,
    reviewedSourceCommit: LIVE_SOURCE_COMMIT,
    reviewedClosureRoot: REVIEWED_CLOSURE_ROOT,
    reviewedLocalExecutionClosureRoot: REVIEWED_LOCAL_ROOT,
    correctedPublicationCommit: CORRECTED_COMMIT,
    plan112V1PublicationCommit: PLAN112_V1_COMMIT,
    plan112V2PublicationCommit: PLAN112_V2_COMMIT,
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
  return Object.freeze({ ...body, supplementRoot: rooted(
    "v138-successor-source-seal-v13-executable-custody-supplement-v3", body,
  ) })
}

const authenticateUpstream = (rootInput: string, allowSupplementV3: boolean) => {
  const root = path.resolve(rootInput)
  for (const commit of [LIVE_SOURCE_COMMIT, PLAN114_V1_COMMIT, PLAN114_V2_COMMIT,
    PLAN114_FINAL_SOURCE_COMMIT, PLAN114_FINAL_REVIEW_COMMIT, CORRECTED_COMMIT,
    PLAN112_V1_COMMIT, PLAN112_V2_COMMIT, PAIR_COMMIT, PLAN93_COMMIT]) ancestor(root, commit)
  if (git(root, ["rev-parse", `${LIVE_SOURCE_COMMIT}^{tree}`]) !== LIVE_SOURCE_TREE ||
      git(root, ["rev-parse", `${LIVE_SOURCE_COMMIT}^`]) !== LIVE_SOURCE_PARENT)
    fail("V138_SUPPLEMENT_ADAPTER_LIVE_SOURCE_IDENTITY_INVALID")
  for (const repoPath of LIVE_PATHS) committed(root, LIVE_SOURCE_COMMIT, repoPath)
  noRewrite(root, LIVE_SOURCE_COMMIT, LIVE_PATHS)

  const v2Paths = [PATHS.payloadV2, PATHS.reviewV2, PATHS.carrierV2]
  exactPublication(root, PLAN114_V2_COMMIT, v2Paths)
  const payload = jsonAt(root, PLAN114_V2_COMMIT, PATHS.payloadV2)
  const carrier = jsonAt(root, PLAN114_V2_COMMIT, PATHS.carrierV2)
  if (payload.schemaVersion !== "v1.38-plan-262-114-live-v10-custody-review-payload-v2" ||
      payload.supersedesPublicationCommit !== PLAN114_V1_COMMIT || payload.payloadRoot !== PLAN114_V2_ROOTS.payload ||
      carrier.reviewRoot !== PLAN114_V2_ROOTS.review || carrier.carrierRoot !== PLAN114_V2_ROOTS.carrier ||
      payload.reviewedSourceCommit !== LIVE_SOURCE_COMMIT || payload.reviewedClosureRoot !== REVIEWED_CLOSURE_ROOT ||
      payload.reviewedLocalExecutionClosureRoot !== REVIEWED_LOCAL_ROOT || payload.findingCount !== 0 ||
      canonical(payload.findingCodes) !== canonical([]) || canonical(payload.findings) !== canonical([]) ||
      payload.reviewStatus !== "zero_findings" || payload.actualModesPassed !== 6 ||
      payload.plan109Eligible !== true || payload.liveInvoked !== false || payload.freshCharged !== 0 ||
      payload.freshAccepted !== 0 || payload.authorizesExecution !== false || payload.downstreamAuthority !== "denied" ||
      carrier.payloadRoot !== payload.payloadRoot || carrier.findingCount !== 0 ||
      carrier.authorizesExecution !== false || carrier.downstreamAuthority !== "denied")
    fail("V138_SUPPLEMENT_ADAPTER_PLAN114_V2_INVALID")

  if (git(root, ["rev-parse", `${PLAN114_FINAL_SOURCE_COMMIT}^{tree}`]) !== PLAN114_FINAL_SOURCE_TREE ||
      git(root, ["rev-parse", `${PLAN114_FINAL_SOURCE_COMMIT}^`]) !== PLAN114_FINAL_SOURCE_PARENT)
    fail("V138_SUPPLEMENT_ADAPTER_FINAL_SOURCE_IDENTITY_INVALID")
  const reviewer = committed(root, PLAN114_FINAL_SOURCE_COMMIT, PATHS.reviewer)
  const reviewerTest = committed(root, PLAN114_FINAL_SOURCE_COMMIT, PATHS.reviewerTest)
  if (reviewer.mode !== "100644" || reviewer.blob !== "392eff05bc1935a2bb056dd9a2915a5d114f2afd" ||
      reviewerTest.mode !== "100644" || reviewerTest.blob !== "b6ed1ba67a4251d36eb5ef1c004a8638bd4f515f")
    fail("V138_SUPPLEMENT_ADAPTER_FINAL_SOURCE_BLOB_INVALID")
  noRewrite(root, PLAN114_FINAL_SOURCE_COMMIT, [PATHS.reviewer, PATHS.reviewerTest])
  exactPublication(root, PLAN114_FINAL_REVIEW_COMMIT, [PATHS.finalReview])
  const finalReview = committed(root, PLAN114_FINAL_REVIEW_COMMIT, PATHS.finalReview)
  if (finalReview.blob !== "a60bb69c235a393b9300311cb43514a00f315ea0" ||
      finalReview.sha256 !== PLAN114_FINAL_REVIEW_SHA ||
      !finalReview.bytes.toString("utf8").includes("  total: 0") ||
      !finalReview.bytes.toString("utf8").includes("status: clean"))
    fail("V138_SUPPLEMENT_ADAPTER_FINAL_REVIEW_INVALID")

  for (const [commit, paths, roots] of [
    [CORRECTED_COMMIT, [PATHS.correctedPayload, PATHS.correctedReview, PATHS.correctedCarrier],
      ["sha256:1e012ddcac45a9b201c8d12c58b14ac532302c87516f17aafa220a5899f3afc2",
        "sha256:d5678937bd87eb53c6df418a5c26fe2be4c3ae95f96d131fe9b086ae7c9316db",
        "sha256:1588f5abd35b8c21f33fefe3d492d44c52f69421ada43e63229df2115d1848e5"]],
    [PLAN112_V1_COMMIT, [PATHS.plan112V1Payload, PATHS.plan112V1Review, PATHS.plan112V1Carrier],
      ["sha256:abf5255241780c0774991fb3fbb282806475deb80c9d59d35f6669fa61fb3292",
        "sha256:7b2cc0f32be4d50ca0b5a7207f08a1c7d6bea9646731d84e07434d082d82b63c",
        "sha256:21af5983c3e64c01cfb62f6cf2e3404b6d3783914441bdd4c2f51bb490e9111e"]],
    [PLAN112_V2_COMMIT, [PATHS.plan112V2Payload, PATHS.plan112V2Review, PATHS.plan112V2Carrier],
      ["sha256:558d329e537dc4673dcaf216ce68faf651dfbbf1ce19536d54cacc3d76b9e194",
        "sha256:8aca84cbb80b000dd5cdeb1735367dd7cc51eb858a0ce2960c4ac33e849dc0e9",
        "sha256:06417e5f8b44a28e88bd20e746fa2319235250d687190ab1fa7a49f485d3a355"]],
  ] as const) {
    exactPublication(root, commit, paths)
    const historicalPayload = jsonAt(root, commit, paths[0])
    const historicalCarrier = jsonAt(root, commit, paths[2])
    if (historicalPayload.payloadRoot !== roots[0] || historicalCarrier.reviewRoot !== roots[1] ||
        historicalCarrier.carrierRoot !== roots[2]) fail("V138_SUPPLEMENT_ADAPTER_HISTORY_INVALID")
  }
  const blocked = jsonAt(root, PLAN112_V2_COMMIT, PATHS.plan112V2Payload)
  if (blocked.findingCount !== 3 || canonical(blocked.findingCodes) !== canonical([
    "MODE_POST_NO_EFFECT_FAILED", "MODE_PROSPECTIVE_CUSTODY_FAILED", "MODE_SOURCE_ONLY_FAILED",
  ]) || blocked.plan109Eligible !== false) fail("V138_SUPPLEMENT_ADAPTER_PLAN112_V2_INVALID")

  const seal = jsonAt(root, PAIR_COMMIT, PATHS.seal)
  const envelope = jsonAt(root, PAIR_COMMIT, PATHS.envelope)
  const sealRecord = committed(root, PAIR_COMMIT, PATHS.seal)
  const envelopeRecord = committed(root, PAIR_COMMIT, PATHS.envelope)
  noRewrite(root, PAIR_COMMIT, [PATHS.seal, PATHS.envelope])
  const plan93 = committed(root, PLAN93_COMMIT, PATHS.plan93)
  noRewrite(root, PLAN93_COMMIT, [PATHS.plan93])
  if (seal.sealRoot !== SEAL_ROOT || seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
      seal.productionAuthorized !== false || seal.downstreamAuthority !== "denied" ||
      envelope.sealRoot !== SEAL_ROOT || envelope.envelopeRoot !== ENVELOPE_ROOT ||
      envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || envelope.status !== "sealed_inactive" ||
      canonical(envelope.counters) !== canonical(ZERO_COUNTERS) ||
      ["candidateSearchAuthorized", "formationMaterializationAuthorized", "holdoutOpeningAuthorized",
        "phase263PlanningAuthorized", "publicAuthorized", "productAuthorized", "productionAuthorized",
        "gameplayChangeAuthorized"].some((key) => envelope.policy[key] !== false) ||
      !plan93.bytes.toString("utf8").includes("Live effect boundary crossed: `false`") ||
      !plan93.bytes.toString("utf8").includes("Fresh accepted: `0/540`"))
    fail("V138_SUPPLEMENT_ADAPTER_PAIR_INVALID")

  assertAbsent(root, [PATHS.supplement1, PATHS.supplement2, ...EFFECT_PATHS])
  if (!allowSupplementV3) assertAbsent(root, [PATHS.supplement3])
  const supplement = renderSupplement()
  return Object.freeze({ payload, carrier, seal, envelope, supplement, sealRecord, envelopeRecord })
}

export const checkV138SupplementV3AdapterSourceOnly = (root: string) => {
  const checked = authenticateUpstream(root, false)
  return Object.freeze({
    status: "source_only_checked" as const,
    plan114PublicationCommit: PLAN114_V2_COMMIT,
    plan114PayloadRoot: PLAN114_V2_ROOTS.payload,
    plan114ReviewRoot: PLAN114_V2_ROOTS.review,
    plan114CarrierRoot: PLAN114_V2_ROOTS.carrier,
    finalCleanReviewCommit: PLAN114_FINAL_REVIEW_COMMIT,
    supplementRoot: checked.supplement.supplementRoot,
    plan116ReviewEligible: true as const,
    plan109Eligible: false as const,
    reviewRequired: true as const,
    envelopeStatus: "sealed_inactive" as const,
    counters: ZERO_COUNTERS,
    createsEnvelope: false as const,
    createsCapacity: false as const,
    resetsCounters: false as const,
    authorizesExecution: false as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
  })
}

const supplementProjection = (status: "supplement_v3_written" | "supplement_v3_committed_checked") => ({
  status,
  supplementRoot: renderSupplement().supplementRoot,
  plan116ReviewEligible: true as const,
  plan109Eligible: false as const,
  reviewRequired: true as const,
  envelopeStatus: "sealed_inactive" as const,
  counters: ZERO_COUNTERS,
  createsEnvelope: false as const,
  createsCapacity: false as const,
  resetsCounters: false as const,
  authorizesExecution: false as const,
  liveInvoked: false as const,
  freshCharged: 0 as const,
  freshAccepted: 0 as const,
  downstreamAuthority: "denied" as const,
})

const nativeWriterExecutable = (): string => {
  const identity = createHash("sha256").update(readFileSync(nativeWriterSource)).digest("hex")
  const executable = path.join(tmpdir(), `cowards-v138-plan115-writer-${identity}`)
  if (!existsSync(executable)) {
    const output = `${executable}.${process.pid}.tmp`
    const compilation = spawnSync("/usr/bin/clang", ["-std=c11", "-Wall", "-Wextra", "-Werror",
      nativeWriterSource, "-o", output], { encoding: "utf8" })
    if (compilation.status !== 0)
      fail(`V138_PLAN115_NATIVE_COMPILE_FAILED:${compilation.stderr.trim()}`)
    const install = spawnSync("/bin/mv", ["-n", output, executable], { encoding: "utf8" })
    if (install.status !== 0 && !existsSync(executable)) fail("V138_PLAN115_NATIVE_INSTALL_FAILED")
    if (existsSync(output)) rmSync(output, { force: true })
  }
  return executable
}

const writeExclusiveRetainedParent = (root: string, repoPath: string, bytes: string): void => {
  const identity = lstatSync(root)
  if (!identity.isDirectory() || identity.isSymbolicLink()) fail("V138_PLAN115_NATIVE_ROOT_UNSAFE")
  const result = spawnSync(nativeWriterExecutable(), [root, String(identity.dev), String(identity.ino), repoPath], {
    cwd: root,
    input: bytes,
    encoding: "utf8",
    env: process.env,
    stdio: ["pipe", "ignore", "pipe"],
  })
  if (result.status !== 0)
    fail(result.stderr.trim() || `V138_PLAN115_NATIVE_WRITE_FAILED:${String(result.status)}`)
}

export const writeV138SupplementV3ForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const checked = authenticateUpstream(root, false)
  const canonicalBytes = canonical(checked.supplement)
  writeExclusiveRetainedParent(root, PATHS.supplement3, canonicalBytes)
  if (!readRegularNoFollow(root, PATHS.supplement3).equals(Buffer.from(canonicalBytes)))
    fail("V138_PLAN115_NATIVE_POSTCONDITION_INVALID")
  return Object.freeze({ ...supplementProjection("supplement_v3_written"), canonicalBytes })
}

export const checkV138CommittedSupplementV3ForReview = (rootInput: string) => {
  const root = path.resolve(rootInput)
  const checked = authenticateUpstream(root, true)
  const additions = git(root, ["log", "--format=%H", "--diff-filter=A", "--", PATHS.supplement3])
    .split("\n").filter(Boolean)
  if (additions.length !== 1) fail("V138_SUPPLEMENT_ADAPTER_PUBLICATION_COMMIT_INVALID")
  const publicationCommit = additions[0]!
  exactPublication(root, publicationCommit, [PATHS.supplement3])
  const publication = committed(root, publicationCommit, PATHS.supplement3)
  const parsed = JSON.parse(publication.bytes.toString("utf8")) as Json
  const expected = canonical(checked.supplement)
  if (!publication.bytes.equals(Buffer.from(canonical(parsed))) ||
      !publication.bytes.equals(Buffer.from(expected)))
    fail("V138_SUPPLEMENT_ADAPTER_SUPPLEMENT_INVALID")
  return Object.freeze({
    ...supplementProjection("supplement_v3_committed_checked"),
    publicationCommit,
    publicationBlob: publication.blob,
    publicationSha256: publication.sha256,
  })
}

const execute = (args: readonly string[]): void => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  if (args.length !== 1 || !V138_SUPPLEMENT_V3_ADAPTER_SELECTORS.includes(args[0] as never))
    fail("V138_SUPPLEMENT_ADAPTER_ARGUMENTS_INVALID")
  const result = args[0] === "--check-source-only"
    ? checkV138SupplementV3AdapterSourceOnly(root)
    : args[0] === "--write-supplement-v3"
      ? writeV138SupplementV3ForReview(root)
      : checkV138CommittedSupplementV3ForReview(root)
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { execute(process.argv.slice(2)) }
  catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
