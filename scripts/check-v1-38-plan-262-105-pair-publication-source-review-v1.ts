import { Buffer } from "node:buffer"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_BOUNDED_RETRY_V3_IDENTITIES,
  V138_BOUNDED_RETRY_V3_PATHS,
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

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_105_RESULT_PATH =
  ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json"
export const V138_PLAN_262_105_REVIEW_PATH = `${PHASE_DIR}/262-105-REVIEW.md`
const RESULT_DOMAIN =
  "v1.38:plan-262-105:pair-publication-source-review:result:v1"
const FINDING_DOMAIN =
  "v1.38:plan-262-105:pair-publication-source-review:finding:v1"
const REVIEW_DOMAIN =
  "v1.38:plan-262-105:pair-publication-source-review:review:v1"
const MODE_DOMAIN =
  "v1.38:plan-262-105:pair-publication-source-review:actual-mode:v1"
const PAIR_INTENT = ".planning/artifacts/v1.38-v3-seal-envelope-v7.intent"

const FORBIDDEN_DESTINATIONS = Object.freeze([
  V138_BOUNDED_RETRY_V3_PATHS.seal,
  V138_BOUNDED_RETRY_V3_PATHS.envelope,
  PAIR_INTENT,
  V138_BOUNDED_RETRY_V3_PATHS.journal,
  `${V138_BOUNDED_RETRY_V3_PATHS.journal}.lock`,
  V138_BOUNDED_RETRY_V3_PATHS.lock,
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

type ModeStatus = "passed" | "rejected_expected" | "not_run_due_to_prior_finding"
type ModeObservation = Readonly<{ status: ModeStatus; observationRoot: Sha256 | null }>
type Finding = Readonly<{ code: string; stage: string }>

const safeType = (target: string): "absent" | "regular" | "directory" | "other" => {
  try {
    const value = lstatSync(target)
    return value.isSymbolicLink()
      ? "other"
      : value.isFile()
        ? "regular"
        : value.isDirectory()
          ? "directory"
          : "other"
  } catch (error: any) {
    if (error?.code === "ENOENT") return "absent"
    throw error
  }
}

const snapshotDestinations = (root: string) =>
  Object.freeze(
    Object.fromEntries(
      FORBIDDEN_DESTINATIONS.map((repoPath) => {
        const target = contained(root, repoPath)
        const type = safeType(target)
        return [
          repoPath,
          type === "regular" ? { type, sha256: sha256(regularBytes(root, repoPath)) } : { type },
        ]
      }),
    ),
  )

const snapshotCanonical = (root: string) =>
  Object.freeze({
    head: git(root, ["rev-parse", "HEAD"]),
    refsRoot: sha256(git(root, ["for-each-ref", "--format=%(refname)%00%(objectname)"])),
    objectsRoot: sha256(git(root, ["rev-list", "--objects", "--all"])),
    destinationsRoot: sha256(canonical(snapshotDestinations(root))),
  })

const falseAuthority = (eligible: boolean) =>
  Object.freeze({
    plan26292Eligible: eligible,
    authorizesExecution: false,
    authorizationCreated: false,
    sealV13Created: false,
    retryEnvelopeV3Created: false,
    journalV3Created: false,
    receiptsV3Created: false,
    terminalV3Created: false,
    reproductionV17Created: false,
    dispositionV3Created: false,
    correctionV11Created: false,
    route11ActivationCreated: false,
    readinessV3Created: false,
    lifecycleV3Created: false,
    liveInvoked: false,
    localSecretAccessed: false,
    lifecycleMutated: false,
    freshCharged: 0,
    freshAccepted: 0,
    phase263PlanningAuthorized: false,
    phase263ExecutionAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    countedPlayAuthorized: false,
    gameplayChangeAuthorized: false,
    activationAuthorized: false,
    archiveAuthorized: false,
    tagAuthorized: false,
  })

const notRunModes = (): Record<(typeof V138_PLAN_262_105_ACTUAL_MODES)[number], ModeObservation> =>
  Object.fromEntries(
    V138_PLAN_262_105_ACTUAL_MODES.map((mode) => [
      mode,
      Object.freeze({ status: "not_run_due_to_prior_finding" as const, observationRoot: null }),
    ]),
  ) as Record<(typeof V138_PLAN_262_105_ACTUAL_MODES)[number], ModeObservation>

const hardenedProcessEnvironment = (owner: string): NodeJS.ProcessEnv => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  HOME: owner,
  XDG_CONFIG_HOME: path.join(owner, "xdg"),
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
})

const cloneModules = (sourceRoot: string, clone: string): void => {
  symlinkSync(path.resolve(sourceRoot, "node_modules"), path.resolve(clone, "node_modules"), "dir")
  const manifests = git(sourceRoot, ["ls-files", "*/package.json"])
    .split("\n")
    .filter(Boolean)
  for (const manifest of manifests) {
    const packageDir = path.dirname(manifest)
    const source = path.resolve(sourceRoot, packageDir, "node_modules")
    const target = path.resolve(clone, packageDir, "node_modules")
    if (safeType(source) === "directory" && safeType(target) === "absent")
      symlinkSync(source, target, "dir")
  }
}

const runActualMode = (
  clone: string,
  owner: string,
  tsxCli: string,
  mode: (typeof V138_PLAN_262_105_ACTUAL_MODES)[number],
): Record<string, any> => {
  const result = spawnSync(
    process.execPath,
    [tsxCli, "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts", mode],
    {
      cwd: clone,
      env: hardenedProcessEnvironment(owner),
      encoding: "utf8",
      timeout: 180_000,
      maxBuffer: 64 * 1024 * 1024,
    },
  )
  if (result.status !== 0)
    fail(`V138_PLAN_262_105_ACTUAL_MODE_FAILED:${mode}`)
  const output = result.stdout.trim()
  if (output === "") fail(`V138_PLAN_262_105_ACTUAL_MODE_OUTPUT_INVALID:${mode}`)
  return JSON.parse(output) as Record<string, any>
}

const commitDisposablePair = (clone: string, owner: string): string => {
  git(clone, [
    "add",
    "--",
    V138_BOUNDED_RETRY_V3_PATHS.seal,
    V138_BOUNDED_RETRY_V3_PATHS.envelope,
  ])
  execFileSync(
    "/usr/bin/git",
    [
      "-c",
      "core.hooksPath=/dev/null",
      "-c",
      "commit.gpgSign=false",
      "commit",
      "--quiet",
      "-m",
      "Plan 262-105 disposable inactive pair",
    ],
    {
      cwd: clone,
      env: {
        ...hardenedProcessEnvironment(owner),
        GIT_AUTHOR_NAME: "Plan 262 Independent Review",
        GIT_AUTHOR_EMAIL: "plan-262-review@example.invalid",
        GIT_COMMITTER_NAME: "Plan 262 Independent Review",
        GIT_COMMITTER_EMAIL: "plan-262-review@example.invalid",
        GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
        GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
      },
    },
  )
  return git(clone, ["rev-parse", "HEAD"])
}

const exerciseActualModes = (root: string) => {
  const before = snapshotCanonical(root)
  const previousUmask = process.umask(0o077)
  const owner = mkdtempSync(path.join(tmpdir(), "cowards-v138-plan262105-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  const modes = notRunModes()
  const findings: Finding[] = []
  let cleanupComplete = false
  let pairCommit: string | null = null
  let disposableParentCommit: string | null = null
  try {
    execFileSync(
      "/usr/bin/git",
      ["-c", "core.hooksPath=/dev/null", "clone", "--quiet", "--no-local", root, clone],
      { env: hardenedProcessEnvironment(owner), maxBuffer: 64 * 1024 * 1024 },
    )
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_105_OWNER_MODE_INVALID")
    const common = realpathSync(path.resolve(clone, git(clone, ["rev-parse", "--git-common-dir"])))
    if (
      !common.startsWith(`${realpathSync(clone)}${path.sep}`) ||
      existsSync(path.join(common, "objects/info/alternates"))
    )
      fail("V138_PLAN_262_105_OBJECT_STORE_NOT_ISOLATED")
    cloneModules(root, clone)
    disposableParentCommit = git(clone, ["rev-parse", "HEAD"])
    requireAncestor(clone, TRIO_PUBLICATION_COMMIT, disposableParentCommit)
    if (TRIO_PUBLICATION_COMMIT === disposableParentCommit)
      fail("V138_PLAN_262_105_LATER_SUMMARY_TOPOLOGY_MISSING")
    const tsxCli = createRequire(path.join(root, "package.json")).resolve("tsx/cli")
    const beforeDerive = snapshotDestinations(clone)
    for (const mode of V138_PLAN_262_105_ACTUAL_MODES) {
      try {
        const output = runActualMode(clone, owner, tsxCli, mode)
        if (
          (output.liveInvoked !== undefined && output.liveInvoked !== false) ||
          output.freshCharged !== 0 ||
          output.freshAccepted !== 0 ||
          output.downstreamAuthority !== "denied"
        )
          fail(`V138_PLAN_262_105_ACTUAL_MODE_AUTHORITY_INVALID:${mode}`)
        if (mode === "--check-source-only" && output.status !== "passed")
          fail("V138_PLAN_262_105_CHECK_SOURCE_STATUS_INVALID")
        if (
          mode === "--derive-seal-envelope-no-publish" &&
          (output.kind !== "eligible" || output.status !== "sealed_inactive_not_published")
        )
          fail("V138_PLAN_262_105_DERIVE_STATUS_INVALID")
        if (
          mode === "--publish-sealed-inactive-envelope" &&
          output.status !== "sealed_inactive_published"
        )
          fail("V138_PLAN_262_105_PUBLISH_STATUS_INVALID")
        if (
          mode === "--check-sealed-inactive-envelope" &&
          (output.status !== "sealed_inactive_committed" || output.plan26293Eligible !== true)
        )
          fail("V138_PLAN_262_105_CHECK_PAIR_STATUS_INVALID")
        modes[mode] = Object.freeze({
          status: "passed",
          observationRoot: domainRoot(`${MODE_DOMAIN}:${mode}`, output),
        })
        if (mode === "--derive-seal-envelope-no-publish") {
          if (canonical(beforeDerive) !== canonical(snapshotDestinations(clone)))
            fail("V138_PLAN_262_105_DERIVE_MUTATED_STATE")
        } else if (mode === "--publish-sealed-inactive-envelope") {
          if (
            safeType(contained(clone, V138_BOUNDED_RETRY_V3_PATHS.seal)) !== "regular" ||
            safeType(contained(clone, V138_BOUNDED_RETRY_V3_PATHS.envelope)) !== "regular" ||
            safeType(contained(clone, PAIR_INTENT)) !== "absent"
          )
            fail("V138_PLAN_262_105_PUBLISH_RESIDUE_INVALID")
          pairCommit = commitDisposablePair(clone, owner)
        }
      } catch (error) {
        modes[mode] = Object.freeze({ status: "rejected_expected", observationRoot: null })
        findings.push(
          Object.freeze({
            code: error instanceof Error ? error.message.split(":", 1)[0] : "ACTUAL_MODE_FAILED",
            stage: mode,
          }),
        )
        break
      }
    }
  } finally {
    rmSync(owner, { recursive: true, force: true })
    cleanupComplete = safeType(owner) === "absent"
    process.umask(previousUmask)
  }
  const after = snapshotCanonical(root)
  return Object.freeze({
    modes: Object.freeze(modes),
    findings: Object.freeze(findings),
    ownerOnly: true as const,
    noLocalClone: true as const,
    laterSummaryTopology: disposableParentCommit !== TRIO_PUBLICATION_COMMIT,
    disposableParentCommit,
    disposablePairCommit: pairCommit,
    cleanupComplete,
    canonicalHeadUnchanged: before.head === after.head,
    canonicalRefsUnchanged: before.refsRoot === after.refsRoot,
    canonicalObjectsUnchanged: before.objectsRoot === after.objectsRoot,
    canonicalDestinationsUnchanged: before.destinationsRoot === after.destinationsRoot,
    canonicalBeforeRoot: domainRoot(
      "v1.38:plan-262-105:pair-publication-source-review:canonical-snapshot:v1",
      before,
    ),
    canonicalAfterRoot: domainRoot(
      "v1.38:plan-262-105:pair-publication-source-review:canonical-snapshot:v1",
      after,
    ),
  })
}

export const renderV138Plan262105Review = (result: Record<string, any>): string => `---
schema_version: v1.38-plan-262-105-pair-publication-source-review-v1
status: ${result.status}
finding_count: ${result.findingCount}
plan_262_92_eligible: ${result.authority.plan26292Eligible}
fresh_charged: 0
fresh_accepted: 0
---

# Phase 262 Plan 105 Independent Pair-Publication Source Review

## Verdict

${result.status === "zero_findings" ? "Zero findings. Exact Plan-104 source custody, independent Plan-103 trio lineage, and all four actual v7 modes passed." : "Blocked. At least one source, lineage, mode, cleanup, or canonical-equality finding remains."}

## Exact Source and Lineage

- Plan-104 source commit: \`${result.source.commit}\`
- Plan-104 tree / sole parent: \`${result.source.tree}\` / \`${result.source.parent}\`
- Reviewed Plan-103 source: \`${result.lineage.reviewedSourceCommit}\`
- Exact trio publication: \`${result.lineage.publicationCommit}\`
- Source and trio no-later-rewrite: \`true\`

## Actual Disposable Modes

${V138_PLAN_262_105_ACTUAL_MODES.map((mode) => `- \`${mode}\`: \`${result.execution.modes[mode].status}\``).join("\n")}

Owner-only no-local disposable custody, later-summary topology, cleanup, canonical ref/object/destination equality, and canonical seal/envelope absence are all required by the recorded branch.

## Finding Root

- Finding root: \`${result.findingRoot}\`

## Non-Authority

Fresh charged/accepted remain 0/0. ADMIT-03 remains blocked at 0/540. No canonical seal, retry envelope, live work, identity charge, lifecycle mutation, Phase-263, candidate, formation, holdout, public, product, production, counted-play, gameplay, archive, or tag authority was created. Literal zero grants Plan 262-92 eligibility only.
`

export const resultPreimageV138Plan262105Independent = (value: Record<string, any>): Buffer => {
  if (!Object.hasOwn(value, "resultRoot"))
    fail("V138_PLAN_262_105_RESULT_PREIMAGE_INVALID")
  const body = { ...value }
  delete body.resultRoot
  return Buffer.concat([Buffer.from(RESULT_DOMAIN), Buffer.from([0]), Buffer.from(canonical(body))])
}

const buildResult = (
  source: ReturnType<typeof inspectV138Plan262104SourceIndependent>,
  lineage: ReturnType<typeof inspectV138Plan262103TrioIndependent>,
  execution: ReturnType<typeof exerciseActualModes>,
  initialFindings: readonly Finding[],
) => {
  const findings = Object.freeze([...initialFindings, ...execution.findings])
  const everyModePassed = V138_PLAN_262_105_ACTUAL_MODES.every(
    (mode) => execution.modes[mode].status === "passed",
  )
  const zero =
    findings.length === 0 &&
    everyModePassed &&
    execution.cleanupComplete &&
    execution.canonicalHeadUnchanged &&
    execution.canonicalRefsUnchanged &&
    execution.canonicalObjectsUnchanged &&
    execution.canonicalDestinationsUnchanged &&
    execution.canonicalBeforeRoot === execution.canonicalAfterRoot
  const result: Record<string, any> = {
    schemaVersion: "v1.38-plan-262-105-pair-publication-source-review-v1",
    protocol: "git-object-pair-publication-source-review-v1",
    status: zero ? "zero_findings" : "blocked",
    source,
    lineage: {
      reviewedSourceCommit: lineage.reviewedSourceCommit,
      publicationCommit: lineage.publicationCommit,
      headCommit: lineage.headCommit,
      noLaterRewrite: lineage.noLaterRewrite,
      candidate: lineage.candidate,
      review: lineage.review,
      carrier: lineage.carrier,
    },
    execution: {
      ownerOnly: execution.ownerOnly,
      noLocalClone: execution.noLocalClone,
      laterSummaryTopology: execution.laterSummaryTopology,
      disposableParentCommit: execution.disposableParentCommit,
      disposablePairCommit: execution.disposablePairCommit,
      cleanupComplete: execution.cleanupComplete,
      canonicalHeadUnchanged: execution.canonicalHeadUnchanged,
      canonicalRefsUnchanged: execution.canonicalRefsUnchanged,
      canonicalObjectsUnchanged: execution.canonicalObjectsUnchanged,
      canonicalDestinationsUnchanged: execution.canonicalDestinationsUnchanged,
      canonicalBeforeRoot: execution.canonicalBeforeRoot,
      canonicalAfterRoot: execution.canonicalAfterRoot,
      modes: execution.modes,
    },
    findings,
    findingCount: findings.length,
    findingRoot: domainRoot(FINDING_DOMAIN, findings),
    identityClaims: {
      independentPersonClaimed: false,
      externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      separatePermissioningClaimed: false,
      maliciousOperatorResistanceClaimed: false,
      hostileSameUidResistanceClaimed: false,
      pathnameLaunchReplacementResistanceClaimed: false,
    },
    authority: falseAuthority(zero),
    reviewRoot: `sha256:${"0".repeat(64)}`,
    resultRoot: `sha256:${"0".repeat(64)}`,
  }
  const reportBytes = Buffer.from(renderV138Plan262105Review(result))
  result.reviewRoot = byteDomainRoot(REVIEW_DOMAIN, reportBytes)
  if (!reportBytes.equals(Buffer.from(renderV138Plan262105Review(result))))
    fail("V138_PLAN_262_105_REVIEW_RECURSIVE")
  result.resultRoot = sha256(resultPreimageV138Plan262105Independent(result))
  return Object.freeze({ result: Object.freeze(result), reportBytes })
}

let derivedCacheRoot = ""
let derivedCache: ReturnType<typeof buildResult> | undefined
export const deriveV138Plan262105ReviewNoPublish = (rootInput: string) => {
  const root = path.resolve(rootInput)
  if (derivedCacheRoot === root && derivedCache !== undefined) return derivedCache
  const initialFindings: Finding[] = []
  let source: ReturnType<typeof inspectV138Plan262104SourceIndependent>
  let lineage: ReturnType<typeof inspectV138Plan262103TrioIndependent>
  try {
    source = inspectV138Plan262104SourceIndependent(root)
    lineage = inspectV138Plan262103TrioIndependent(root)
  } catch (error) {
    initialFindings.push(
      Object.freeze({
        code: error instanceof Error ? error.message.split(":", 1)[0] : "SOURCE_REVIEW_FAILED",
        stage: "source_and_lineage",
      }),
    )
    source = Object.freeze({
      commit: PLAN_104_COMMIT,
      tree: PLAN_104_TREE,
      parent: PLAN_104_PARENT,
      noLaterRewrite: false as const,
      files: PLAN_104_FILES.map((item) => ({ ...item })),
    }) as never
    lineage = Object.freeze({
      reviewedSourceCommit: REVIEWED_SOURCE_COMMIT,
      publicationCommit: TRIO_PUBLICATION_COMMIT,
      headCommit: git(root, ["rev-parse", "HEAD"]),
      noLaterRewrite: false as const,
      candidate: Object.freeze({ mode: "100644" as const, blob: "2d3f995bcd4c0067e3d8c0c2a0120a36bfdc1745" }),
      review: Object.freeze({ mode: "100644" as const, blob: "680616684dcdc408829923bf9f062a075ddf32f2" }),
      carrier: Object.freeze({ mode: "100644" as const, blob: "89d1077b12672c4a066cbcba77568e228c0669de" }),
      candidateValue: {},
      carrierValue: {},
    }) as never
  }
  const execution =
    initialFindings.length === 0
      ? exerciseActualModes(root)
      : Object.freeze({
          modes: Object.freeze(notRunModes()),
          findings: Object.freeze([] as Finding[]),
          ownerOnly: true as const,
          noLocalClone: true as const,
          laterSummaryTopology: false,
          disposableParentCommit: null,
          disposablePairCommit: null,
          cleanupComplete: true,
          canonicalHeadUnchanged: true,
          canonicalRefsUnchanged: true,
          canonicalObjectsUnchanged: true,
          canonicalDestinationsUnchanged: true,
          canonicalBeforeRoot: domainRoot("blocked-before-mode", {}),
          canonicalAfterRoot: domainRoot("blocked-after-mode", {}),
        })
  derivedCache = buildResult(source, lineage, execution, initialFindings)
  derivedCacheRoot = root
  return derivedCache
}

export const validateV138Plan262105Result = (
  result: Record<string, any>,
  reportBytes: Buffer,
): true => {
  const everyModePassed = V138_PLAN_262_105_ACTUAL_MODES.every(
    (mode) => result.execution?.modes?.[mode]?.status === "passed",
  )
  const zero =
    result.findingCount === 0 &&
    Array.isArray(result.findings) &&
    result.findings.length === 0 &&
    everyModePassed &&
    result.execution.ownerOnly === true &&
    result.execution.noLocalClone === true &&
    result.execution.laterSummaryTopology === true &&
    result.execution.cleanupComplete === true &&
    result.execution.canonicalHeadUnchanged === true &&
    result.execution.canonicalRefsUnchanged === true &&
    result.execution.canonicalObjectsUnchanged === true &&
    result.execution.canonicalDestinationsUnchanged === true &&
    result.execution.canonicalBeforeRoot === result.execution.canonicalAfterRoot
  const authority = result.authority as Record<string, unknown>
  const authorityValid = Object.entries(authority).every(([key, value]) =>
    key === "plan26292Eligible"
      ? value === zero
      : key === "freshCharged" || key === "freshAccepted"
        ? value === 0
        : value === false,
  )
  if (
    result.schemaVersion !== "v1.38-plan-262-105-pair-publication-source-review-v1" ||
    result.protocol !== "git-object-pair-publication-source-review-v1" ||
    result.status !== (zero ? "zero_findings" : "blocked") ||
    !authorityValid ||
    !Object.hasOwn(authority, "authorizesExecution") ||
    !Object.hasOwn(authority, "productionAuthorized") ||
    result.findingRoot !== domainRoot(FINDING_DOMAIN, result.findings) ||
    result.reviewRoot !== byteDomainRoot(REVIEW_DOMAIN, reportBytes) ||
    !reportBytes.equals(Buffer.from(renderV138Plan262105Review(result))) ||
    result.resultRoot !== sha256(resultPreimageV138Plan262105Independent(result))
  )
    fail("V138_PLAN_262_105_RESULT_INVALID")
  return true
}

const exclusiveWrite = (target: string, bytes: Buffer): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_105_DESTINATION_PRESENT")
  const descriptor = openSync(
    target,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}

export const publishV138Plan262105Review = (root: string) => {
  const built = deriveV138Plan262105ReviewNoPublish(root)
  const resultTarget = contained(root, V138_PLAN_262_105_RESULT_PATH)
  const reviewTarget = contained(root, V138_PLAN_262_105_REVIEW_PATH)
  mkdirSync(path.dirname(resultTarget), { recursive: true })
  mkdirSync(path.dirname(reviewTarget), { recursive: true })
  const written: string[] = []
  try {
    exclusiveWrite(resultTarget, Buffer.from(canonical(built.result)))
    written.push(resultTarget)
    exclusiveWrite(reviewTarget, built.reportBytes)
    written.push(reviewTarget)
  } catch (error) {
    for (const target of written) unlinkSync(target)
    throw error
  }
  return built
}

export const checkV138Plan262105PublishedReview = (root: string) => {
  const resultBytes = regularBytes(root, V138_PLAN_262_105_RESULT_PATH)
  const reportBytes = regularBytes(root, V138_PLAN_262_105_REVIEW_PATH)
  const result = JSON.parse(resultBytes.toString("utf8")) as Record<string, any>
  if (!resultBytes.equals(Buffer.from(canonical(result))))
    fail("V138_PLAN_262_105_CANONICAL_RESULT_INVALID")
  validateV138Plan262105Result(result, reportBytes)
  return Object.freeze({ result, reportBytes })
}

export const checkV138Plan262105ReviewModeBranch = (root: string) => {
  const checked = checkV138Plan262105PublishedReview(root)
  if (
    checked.result.status === "zero_findings" &&
    checked.result.authority.plan26292Eligible !== true
  )
    fail("V138_PLAN_262_105_MODE_BRANCH_INVALID")
  if (
    checked.result.status === "blocked" &&
    checked.result.authority.plan26292Eligible !== false
  )
    fail("V138_PLAN_262_105_MODE_BRANCH_INVALID")
  return checked
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const cliOutput = (value: Record<string, any>): string =>
  canonical({
    status: value.status,
    findingCount: value.findingCount,
    findingRoot: value.findingRoot,
    reviewRoot: value.reviewRoot,
    resultRoot: value.resultRoot,
    actualModes: Object.fromEntries(
      V138_PLAN_262_105_ACTUAL_MODES.map((mode) => [mode, value.execution.modes[mode].status]),
    ),
    cleanupComplete: value.execution.cleanupComplete,
    canonicalRefsUnchanged: value.execution.canonicalRefsUnchanged,
    canonicalObjectsUnchanged: value.execution.canonicalObjectsUnchanged,
    canonicalDestinationsUnchanged: value.execution.canonicalDestinationsUnchanged,
    plan26292Eligible: value.authority.plan26292Eligible,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
  })

const main = (): void => {
  const args = process.argv.slice(2)
  if (canonical(args) === canonical(["--write-review"])) {
    process.stdout.write(cliOutput(publishV138Plan262105Review(repoRoot).result))
    return
  }
  if (canonical(args) === canonical(["--check-review"])) {
    process.stdout.write(cliOutput(checkV138Plan262105PublishedReview(repoRoot).result))
    return
  }
  if (canonical(args) === canonical(["--check-review-mode-branch"])) {
    process.stdout.write(cliOutput(checkV138Plan262105ReviewModeBranch(repoRoot).result))
    return
  }
  fail("V138_PLAN_262_105_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
