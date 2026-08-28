import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
} from "node:fs"
import path from "node:path"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_POLICY,
  encodeV138RetryV3CanonicalJson,
} from "./lib/v1-38-bounded-retry-envelope-v3.js"
import {
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha256 = `sha256:${string}`
const canonical = encodeV138RetryV3CanonicalJson
const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const gitBlob = (bytes: Buffer): string =>
  createHash("sha1")
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest("hex")
const domainRoot = (domain: string, value: unknown): Sha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(domain),
      Buffer.from([0]),
      Buffer.from(canonical(value)),
    ]),
  )
const byteDomainRoot = (domain: string, value: Uint8Array): Sha256 =>
  sha256(Buffer.concat([Buffer.from(domain), Buffer.from([0]), Buffer.from(value)]))

const PLAN_104_COMMIT = "58669ae69376375f171aa56fd57b331355703e9a"
const PLAN_104_TREE = "cca6ff090cc82c70f28109fbbedf3c2f61fa073b"
const PLAN_104_PARENT = "d86abb40eb8bbc68860925072b1c9cd4fe42dfb4"
const REVIEWED_SOURCE_COMMIT = "332aae093ef6e26c95a18f21cfd253ccc829ce48"
const TRIO_PUBLICATION_COMMIT = "2f4fd225ca32b0ac67c2fd09f3036cbbe208725c"
const CANDIDATE_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6"
const CARRIER_DOMAIN = "v1.38:plan-262-103:git-object-byte-custody:carrier:v1"
const PLAN_103_REVIEW_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:review:v6"

const PLAN_104_FILES = Object.freeze([
  Object.freeze({
    path: "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts",
    mode: "100644" as const,
    blob: "b293acb6b025aa460b9e886379fe47498e3fb705",
    byteLength: 25_977,
    sha256: "sha256:d8fed836bf6c1b6c81a65b3ecb01818fef38bfe7905a4a223e35f37ebed88642" as Sha256,
  }),
  Object.freeze({
    path: "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts",
    mode: "100644" as const,
    blob: "9c9a52ce996245959b5fbf1006749e05d85b7a0c",
    byteLength: 10_446,
    sha256: "sha256:efe202a4302b5cfa11d0c95a4de34059b31f4fdfd57c4823ef440076334dd6d2" as Sha256,
  }),
] as const)

const CANDIDATE_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json"
const REVIEW_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-103-REVIEW.md"
const CARRIER_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json"
const TRIO_PATHS = Object.freeze([CANDIDATE_PATH, REVIEW_PATH, CARRIER_PATH] as const)

export const V138_PLAN_262_105_ACTUAL_MODES = Object.freeze([
  "--check-source-only",
  "--derive-seal-envelope-no-publish",
  "--publish-sealed-inactive-envelope",
  "--check-sealed-inactive-envelope",
] as const)

const git = (root: string, args: readonly string[]): string =>
  runV138RetryV3IsolatedGit(root, args)
const gitBytes = (root: string, args: readonly string[]): Buffer =>
  runV138RetryV3IsolatedGitBytes(root, args)

const contained = (rootInput: string, repoPath: string): string => {
  if (
    path.isAbsolute(repoPath) ||
    repoPath.includes("\0") ||
    repoPath.split("/").some((part) => part === "" || part === "." || part === "..")
  )
    fail("V138_PLAN_262_105_PATH_INVALID")
  const root = path.resolve(rootInput)
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${root}${path.sep}`)) fail("V138_PLAN_262_105_PATH_INVALID")
  return target
}

const regularBytes = (root: string, repoPath: string): Buffer => {
  const target = contained(root, repoPath)
  const before = lstatSync(target)
  if (!before.isFile() || before.isSymbolicLink())
    fail("V138_PLAN_262_105_WORKING_CUSTODY_INVALID")
  const descriptor = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const opened = fstatSync(descriptor)
    if (
      !opened.isFile() ||
      opened.dev !== before.dev ||
      opened.ino !== before.ino ||
      opened.size > 64 * 1024 * 1024
    )
      fail("V138_PLAN_262_105_WORKING_CUSTODY_INVALID")
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

const treeEntry = (root: string, commit: string, repoPath: string) => {
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(
    git(root, ["ls-tree", commit, "--", repoPath]),
  )
  if (match === null || match[3] !== repoPath)
    fail("V138_PLAN_262_105_TREE_ENTRY_INVALID")
  return Object.freeze({ mode: match[1], blob: match[2] })
}

const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_PLAN_262_105_TRIO_ANCESTRY_INVALID")
  }
}

type RawDiff = Readonly<{
  oldMode: string
  newMode: string
  oldBlob: string
  newBlob: string
  status: string
  repoPath: string
}>

const rawDiff = (root: string, commit: string): readonly RawDiff[] => {
  const output = git(root, ["diff-tree", "--root", "--no-commit-id", "--raw", "-r", commit])
  if (output === "") return []
  return output.split("\n").map((line) => {
    const match =
      /^:([0-9]{6}) ([0-9]{6}) ([0-9a-f]{40}) ([0-9a-f]{40}) ([A-Z][0-9]*)\t(.+)$/u.exec(
        line,
      )
    if (match === null) fail("V138_PLAN_262_105_GIT_DIFF_INVALID")
    return Object.freeze({
      oldMode: match[1],
      newMode: match[2],
      oldBlob: match[3],
      newBlob: match[4],
      status: match[5],
      repoPath: match[6],
    })
  })
}

export const inspectV138Plan262104SourceIndependent = (root: string) => {
  const [commit, tree, parent] = git(root, [
    "show",
    "-s",
    "--format=%H%n%T%n%P",
    PLAN_104_COMMIT,
  ]).split("\n")
  if (commit !== PLAN_104_COMMIT || tree !== PLAN_104_TREE || parent !== PLAN_104_PARENT)
    fail("V138_PLAN_262_105_SOURCE_LINEAGE_INVALID")
  const changed = rawDiff(root, PLAN_104_COMMIT)
  if (
    changed.length !== PLAN_104_FILES.length ||
    !changed.every((entry) =>
      PLAN_104_FILES.some(
        (expected) =>
          entry.repoPath === expected.path &&
          entry.newMode === expected.mode &&
          entry.newBlob === expected.blob &&
          entry.status === "M",
      ),
    )
  )
    fail("V138_PLAN_262_105_SOURCE_DIFF_INVALID")

  const files = PLAN_104_FILES.map((expected) => {
    const entry = treeEntry(root, PLAN_104_COMMIT, expected.path)
    const committed = gitBytes(root, ["cat-file", "blob", `${PLAN_104_COMMIT}:${expected.path}`])
    if (
      entry.mode !== expected.mode ||
      entry.blob !== expected.blob ||
      committed.length !== expected.byteLength ||
      sha256(committed) !== expected.sha256
    )
      fail("V138_PLAN_262_105_SOURCE_CUSTODY_INVALID")
    const working = regularBytes(root, expected.path)
    if (!working.equals(committed)) fail("V138_PLAN_262_105_SOURCE_WORKING_BYTES_INVALID")
    const workingMode = lstatSync(contained(root, expected.path)).mode & 0o111 ? "100755" : "100644"
    if (workingMode !== expected.mode) fail("V138_PLAN_262_105_SOURCE_WORKING_MODE_INVALID")
    if (git(root, ["log", "--format=%H", `${PLAN_104_COMMIT}..HEAD`, "--", expected.path]) !== "")
      fail("V138_PLAN_262_105_SOURCE_REWRITTEN")
    return { ...expected }
  })

  const sourceText = gitBytes(root, [
    "cat-file",
    "blob",
    `${PLAN_104_COMMIT}:${PLAN_104_FILES[0].path}`,
  ]).toString("utf8")
  for (const mode of V138_PLAN_262_105_ACTUAL_MODES)
    if (!sourceText.includes(`"${mode}"`)) fail("V138_PLAN_262_105_MODE_SURFACE_INVALID")
  if (
    sourceText.includes("--run-bounded-live-envelope") ||
    !sourceText.includes("v1.38-successor-source-seal-v13") ||
    !sourceText.includes("v138-successor-source-seal-v13\\0")
  )
    fail("V138_PLAN_262_105_MODE_SURFACE_INVALID")
  return Object.freeze({ commit, tree, parent, noLaterRewrite: true as const, files })
}

const exactRoot = (value: Record<string, unknown>, excluded: string, domain: string): Sha256 => {
  if (!Object.hasOwn(value, excluded)) fail("V138_PLAN_262_105_ROOT_PREIMAGE_INVALID")
  const body = { ...value }
  delete body[excluded]
  return domainRoot(domain, body)
}

const requireClosedAuthority = (authority: Record<string, unknown>): void => {
  const expectedTrue = new Set(["plan26292Eligible"])
  for (const [key, value] of Object.entries(authority)) {
    if (expectedTrue.has(key)) {
      if (value !== true) fail("V138_PLAN_262_105_AUTHORITY_INVALID")
    } else if (key === "freshCharged" || key === "freshAccepted") {
      if (value !== 0) fail("V138_PLAN_262_105_AUTHORITY_INVALID")
    } else if (value !== false) fail("V138_PLAN_262_105_AUTHORITY_INVALID")
  }
  if (!Object.hasOwn(authority, "authorizesExecution") || !Object.hasOwn(authority, "liveInvoked"))
    fail("V138_PLAN_262_105_AUTHORITY_INVALID")
}

export const inspectV138Plan262103TrioIndependent = (root: string) => {
  const headCommit = git(root, ["rev-parse", "HEAD"])
  const candidateBytes = regularBytes(root, CANDIDATE_PATH)
  const reviewBytes = regularBytes(root, REVIEW_PATH)
  const carrierBytes = regularBytes(root, CARRIER_PATH)
  const candidate = JSON.parse(candidateBytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(carrierBytes.toString("utf8")) as Record<string, any>
  if (
    !candidateBytes.equals(Buffer.from(canonical(candidate))) ||
    !carrierBytes.equals(Buffer.from(canonical(carrier))) ||
    candidate.schemaVersion !==
      "v1.38-plan-262-103-git-object-byte-custody-rereview-payload-v6" ||
    candidate.protocol !== "git-object-byte-custody-nonrecursive-v1" ||
    carrier.schemaVersion !==
      "v1.38-plan-262-103-git-object-byte-custody-rereview-carrier-v1" ||
    carrier.protocol !== "git-object-byte-custody-external-carrier-v1" ||
    candidate.status !== "zero_findings" ||
    carrier.status !== "zero_findings" ||
    candidate.findingCount !== 0 ||
    carrier.findingCount !== 0 ||
    candidate.sourceReviewPassed !== true ||
    carrier.sourceReviewPassed !== true ||
    candidate.candidatePayloadRoot !== exactRoot(candidate, "candidatePayloadRoot", CANDIDATE_DOMAIN) ||
    carrier.carrierRoot !== exactRoot(carrier, "carrierRoot", CARRIER_DOMAIN) ||
    candidate.reviewRoot !== byteDomainRoot(PLAN_103_REVIEW_DOMAIN, reviewBytes) ||
    carrier.candidate.candidatePayloadRoot !== candidate.candidatePayloadRoot ||
    carrier.actualConsumer.status !== "passed" ||
    carrier.actualConsumer.liveInvoked !== false ||
    carrier.actualConsumer.freshCharged !== 0 ||
    carrier.actualConsumer.freshAccepted !== 0
  )
    fail("V138_PLAN_262_105_TRIO_SCHEMA_INVALID")
  requireClosedAuthority(candidate.authority)
  requireClosedAuthority(carrier.authority)

  const expectedBlobs = Object.freeze({
    [CANDIDATE_PATH]: "2d3f995bcd4c0067e3d8c0c2a0120a36bfdc1745",
    [REVIEW_PATH]: "680616684dcdc408829923bf9f062a075ddf32f2",
    [CARRIER_PATH]: "89d1077b12672c4a066cbcba77568e228c0669de",
  })
  if (
    gitBlob(candidateBytes) !== expectedBlobs[CANDIDATE_PATH] ||
    gitBlob(reviewBytes) !== expectedBlobs[REVIEW_PATH] ||
    gitBlob(carrierBytes) !== expectedBlobs[CARRIER_PATH]
  )
    fail("V138_PLAN_262_105_TRIO_BLOB_INVALID")
  const history = git(root, ["log", "--format=%H", headCommit, "--", ...TRIO_PATHS])
    .split("\n")
    .filter(Boolean)
  const publications = history.filter((commit) => {
    const entries = rawDiff(root, commit)
    if (entries.length !== TRIO_PATHS.length) return false
    return TRIO_PATHS.every((repoPath) => {
      const entry = entries.find((value) => value.repoPath === repoPath)
      return (
        entry?.oldMode === "000000" &&
        entry.newMode === "100644" &&
        entry.oldBlob === "0".repeat(40) &&
        entry.newBlob === expectedBlobs[repoPath] &&
        entry.status === "A"
      )
    })
  })
  if (publications.length !== 1)
    fail("V138_PLAN_262_105_TRIO_PUBLICATION_NOT_UNIQUE")
  const publicationCommit = publications[0]
  if (publicationCommit !== TRIO_PUBLICATION_COMMIT)
    fail("V138_PLAN_262_105_TRIO_PUBLICATION_INVALID")
  requireAncestor(root, REVIEWED_SOURCE_COMMIT, publicationCommit)
  requireAncestor(root, publicationCommit, headCommit)
  if (
    git(root, ["log", "--format=%H", `${publicationCommit}..${headCommit}`, "--", ...TRIO_PATHS]) !== ""
  )
    fail("V138_PLAN_262_105_TRIO_REWRITTEN")

  for (const expected of candidate.correctedSource.files as readonly Record<string, any>[]) {
    const entry = treeEntry(root, REVIEWED_SOURCE_COMMIT, expected.path)
    const bytes = gitBytes(root, ["cat-file", "blob", `${REVIEWED_SOURCE_COMMIT}:${expected.path}`])
    if (
      entry.mode !== expected.mode ||
      entry.blob !== expected.blob ||
      bytes.length !== expected.byteLength ||
      sha256(bytes) !== expected.sha256 ||
      !bytes.equals(regularBytes(root, expected.path)) ||
      git(root, ["log", "--format=%H", `${REVIEWED_SOURCE_COMMIT}..HEAD`, "--", expected.path]) !== ""
    )
      fail("V138_PLAN_262_105_REVIEWED_SOURCE_INVALID")
  }
  if (
    V138_BOUNDED_RETRY_V3_POLICY.maximumRouteStarts !== 3 ||
    V138_BOUNDED_RETRY_V3_POLICY.maximumPreflightObservations !== 12 ||
    V138_BOUNDED_RETRY_V3_POLICY.envelopeLifetimeMilliseconds !== 14_400_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.refusalSpacingMilliseconds !== 300_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationFailureBackoffMilliseconds !== 900_000 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationAttemptsPerRoute !== 8 ||
    V138_BOUNDED_RETRY_V3_POLICY.calibrationShardCount !== 4 ||
    V138_BOUNDED_RETRY_V3_POLICY.samplingMilliseconds !== 200 ||
    V138_BOUNDED_RETRY_V3_POLICY.minimumEffectiveAvailableBasisPoints !== 2_500 ||
    V138_BOUNDED_RETRY_V3_POLICY.reproductionCellCount !== 540 ||
    V138_BOUNDED_RETRY_V3_POLICY.rulesAuthority !== "MATCH_KERNEL" ||
    V138_BOUNDED_RETRY_V3_POLICY.supervisedRuntimeOnly !== true ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.routes.length !== 3 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.preflights.length !== 12 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.calibrations.length !== 24 ||
    V138_BOUNDED_RETRY_V3_IDENTITIES.reproduction.length !== 540
  )
    fail("V138_PLAN_262_105_FROZEN_POLICY_INVALID")
  return Object.freeze({
    reviewedSourceCommit: REVIEWED_SOURCE_COMMIT,
    publicationCommit,
    headCommit,
    noLaterRewrite: true as const,
    candidate: Object.freeze({ mode: "100644" as const, blob: expectedBlobs[CANDIDATE_PATH] }),
    review: Object.freeze({ mode: "100644" as const, blob: expectedBlobs[REVIEW_PATH] }),
    carrier: Object.freeze({ mode: "100644" as const, blob: expectedBlobs[CARRIER_PATH] }),
    candidateValue: candidate,
    carrierValue: carrier,
  })
}
