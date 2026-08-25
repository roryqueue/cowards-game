#!/usr/bin/env -S pnpm exec tsx
// Plan-262-61 reviewer custody source; immutable successor carries the reviewer-tool trailer.
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, closeSync, constants as fsConstants, existsSync, fstatSync, lstatSync,
  mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, realpathSync,
  rmSync, unlinkSync, utimesSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Session } from "node:inspector"
import { createRequire, syncBuiltinESMExports } from "node:module"
import { encodeCanonicalJson, hashCanonicalIdentity } from "@cowards/spec"
import {
  V138_REVIEW_V3_CANONICAL_PATH,
  V138_REVIEW_V3_REPORT_PATH,
  V138_REVIEW_V3_ROUTE_MANIFEST,
  V138_REVIEW_V3_SOURCE_PATHS,
  buildV138ReviewV3CommandArgv,
  checkV138ReviewV3ClaimsAgainstObservations,
  computeV138ReviewV3Root,
  validateV138ReviewV3Document,
} from "./lib/v1-38-source-completeness-review-v3.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type AgentHistoryEntry = Readonly<{
  agent_id?: unknown
  phase?: unknown
  plan?: unknown
  segment?: unknown
  status?: unknown
  completion_timestamp?: unknown
}>

export const SOURCE_BASE9 = "1f6a8b4c3b668c1b26147bb9947f4d9b5940d7cd"
export const SOURCE_A9 = "c112383a6e23196da0e9f2d4cd2fc72736a4952f"
export const SOURCE_A9_TREE = "874c9950c309670ef8aa5802eb1b42fcf2b1b3d7"
export const SOURCE_A9_RUN = "codex-plan-262-60-a9-review-fix-v8"
export const SUMMARY_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-SUMMARY.md"
export const SUMMARY_CARRIER = "d40791ad3cc0528224b635e529bb86c0e03dcd2a"
export const SUMMARY_BLOB = "4fcec27c5826e2905d42f635864bf0b21bba6125"
export const SUMMARY_SHA256 =
  "sha256:046dea915f8453d7c7c8fa8c45b21ea02f9a46881d14d024523293dfe752c2"
export const SUMMARY_BYTE_LENGTH = 12486
export const PLAN_60_CONVERGENCE = "9541749092cc8f5df130864919effe7473f55f55"
export const PLAN_60_V9_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-CODE-REVIEW-V9.md"
export const PLAN_60_V9_BLOB = "6611ca2b9087e491a3830816278e81d8aa2e7c35"
export const PLAN_60_V9_SHA256 =
  "sha256:93c47ed053c0c60dec40571250d3e5a8bb46b26b9ed369fa0861b933fbb90747"
export const PLAN_60_REVIEW_FIX_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-60-REVIEW-FIX.md"
export const PLAN_60_REVIEW_FIX_BLOB = "c1f687c827a4f61d95a9e6b52bfe5e72f8c7449e"
export const PLAN_60_REVIEW_FIX_SHA256 =
  "sha256:3cd4fd62fe806696e666686e1b61b4bfe53becb3eda75865a2b025f274ae2868"
export const R3_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-61-source-completeness-review-v3.test.ts",
  "scripts/check-v1-38-plan-262-61-source-completeness-review-v3.ts",
] as const)

const PREDECESSOR_LAYERS = Object.freeze([
  ["32eef5c147dc34b1a75c936ed7a0148f8e5d748e", "7ce7e1e9ae90f2ecb2204f9f1681e86ebaba64c0"],
  ["c5a08bd50eec0f8c937b42bd07fd9009e7b88c17", "bff3a3caa90d8bd6e629c8d40599e953ed1a020d"],
  ["5bf7839123f9a52b9e16edbc6ce70206c5a4bd54", "b1352f7e3c5558ff8056f870471f1e1ed6f48fd1"],
  ["704eed00eb51098e3b363380c1e1033df0e7c207", "f42afce01835f69b087d187062778d77a87360aa"],
  ["c60146dcf6278151997bce914b11174faab9a045", SOURCE_BASE9],
] as const)

const AUTHORIZATION_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-plan-262-15-authorization-v1.json",
  ".planning/artifacts/v1.38-plan-262-18-authorization-v2.json",
  ".planning/artifacts/v1.38-plan-262-21-authorization-v3.json",
  ".planning/artifacts/v1.38-plan-262-24-authorization-v4.json",
  ".planning/artifacts/v1.38-plan-262-29-authorization-v5.json",
  ".planning/artifacts/v1.38-plan-262-47-authorization-v6.json",
] as const)
const FROZEN_AUTHORIZATIONS = Object.freeze([
  [AUTHORIZATION_PATHS[0], "1bfb413192f113ac7949cde676d7b55aea77f4fe",
    "0183733a18d4bdbf61c46e723373ec8359f2944f",
    "sha256:1e58a293effd7e84e7c88978dd9dda0dd0ef07c3d66e85312f457a4d183c0220", 570],
  [AUTHORIZATION_PATHS[1], "b00af0406b97aa5f0538209d1f31a6e36659e570",
    "2843f136e5c48513e66ace422b5db826bcd51971",
    "sha256:514320cce291d5137e6ddf9c2b92ae1941e8f00bf4eb9480d7ea38cc01e0fffa", 9063],
  [AUTHORIZATION_PATHS[2], "1387813e9f7262ac0c5916635addee9cdb96354b",
    "703513ce15c27bf0ffefe632c9bb8fa2033310a8",
    "sha256:30c4f8a85678b0e274588be9a038cd59c824ad892b987ca79d1de35806823734", 6188],
  [AUTHORIZATION_PATHS[3], "d0e3a2cae3d0849aec7f8b1c783f7ed16c8e2947",
    "e3f5ff9db66401adfa7d39bbefb94aa9170b7049",
    "sha256:1b18234f0e2255af852038e153355fa3295f4e7863966803b335285e3da85eea", 172878],
  [AUTHORIZATION_PATHS[4], "a0a37e8ca8420faa42cb57bdb5a210779d2fff23",
    "57c4d7f2e54901aed04b1b713a5839ef25a946f2",
    "sha256:e9568f8606901935a403f3f2c4ff1bb0d142169544c469f424c764088eff3456", 176454],
  [AUTHORIZATION_PATHS[5], "e2166736c2a1a3f1decbb1d6b3722f87945a47ea",
    "94e512a7f1b2bf04f96e8e4d00a6325fa735f285",
    "sha256:77af205522666a4e013c19732eec580d7848722e348fe1029eb850263820f428", 175645],
] as const)
const FROZEN_PROTECTED_ROOTS = Object.freeze({
  formationAbsenceRoot: "sha256:b0ab7d57681b89313fc7bc2406adf1f2aad70e1a7aa431f17c4c8d5850c297a7",
  frozenPolicyRoot: "sha256:2118c59a35298d0ce1d67753b3d000858cccf1c244afae56b07c0e43c194c818",
  gameplayRuntimePrivacyClosureRoot: "sha256:c1e0a6b89a4f0f4eb7f89b7631a7cb25bc55cadf2e010b9b4cde924afe70bcdd",
  localSealIndependentVerificationRoot: "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b",
  localSealProtocolRoot: "sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a",
  preSearchPolicyRoot: "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382",
  predecessorSealV5BytesSha256: "sha256:0f9a5af1164e7daffc3a3603c01a3376cc4939fab9e668e97f7b7a9b326f0345",
  predecessorSealV5Root: "sha256:2db3689e8071466ff6bcf7898dd038740f8ac8f982fab50efe27f262198dd55e",
  protectedHistoryRoot: "sha256:1e1faa95b73c834a94e77be824a994c6105a78f04aeb0e76a396522692a3ea10",
  replacementMetricContractRoot: "sha256:1250d82cdd114b9dfd6dd0778b5023ae3ccb7f9f71b5d2f8c46bf3b6bf7bad57",
  selectedRouteClosureRoot: "sha256:c1e0a6b89a4f0f4eb7f89b7631a7cb25bc55cadf2e010b9b4cde924afe70bcdd",
})

const FORBIDDEN_DESTINATIONS = Object.freeze([
  V138_REVIEW_V3_CANONICAL_PATH,
  V138_REVIEW_V3_REPORT_PATH,
  ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
  ".planning/artifacts/v1.38-successor-source-seal-v9.json",
  ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json",
  ".planning/artifacts/v1.38-current-matrix-execution-context-v11.json",
  ".planning/artifacts/v1.38-current-matrix-headroom-preflight-v11.json",
  ".planning/artifacts/v1.38-current-matrix-calibration-v11.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v12.json",
  ".planning/artifacts/v1.38-plan-262-57-terminal-v1.json",
] as const)

const REVIEW_DIRECTORY =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const PLAN_61_REVIEW_FIX = `${REVIEW_DIRECTORY}/262-61-REVIEW-FIX.md`
const PLAN_61_RECEIPT =
  ".planning/artifacts/v1.38-plan-262-61-r3-author-tracking-v1.json"
const PLAN_61_SUMMARY = `${REVIEW_DIRECTORY}/262-61-SUMMARY.md`
const PLAN_62_REVIEW = V138_REVIEW_V3_CANONICAL_PATH
const PLAN_62_REPORT = V138_REVIEW_V3_REPORT_PATH
const PLAN_62_SUMMARY = `${REVIEW_DIRECTORY}/262-62-SUMMARY.md`
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
let routeExecutionHookCount = 0
let candidateDerivationHookCount = 0
const activeDisposableRoots = new Set<string>()
let cachedRouteObservation: { rootPath: string; value: any } | undefined
let candidateCleanlinessPath: string | null = null

const fail = (code: string): never => { throw new TypeError(code) }
const canonicalize = (value: Json): Json => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)).map(([key, item]) => [key, canonicalize(item)]))
    : value
export const canonicalV138ReviewerV3 = (value: unknown) =>
  JSON.stringify(canonicalize(value as Json))
export const sha256V138ReviewerV3 = (value: Buffer | string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}` as const
const identityRootV138ReviewerV3 = (domain: "evidenceBundle" |
  "canonicalJsonProfile" | "artifactManifest" | "containmentPolicy",
  schemaVersion: string, value: unknown) => `sha256:${hashCanonicalIdentity(domain, [
    Buffer.from(schemaVersion, "utf8"),
    Buffer.from(canonicalV138ReviewerV3(value), "utf8"),
  ])}` as const
const git = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const gitBytes = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, maxBuffer: 64 * 1024 * 1024,
})
const commitSynthetic = (rootPath: string, message: string) => execFileSync("git",
  ["-c", "user.name=Plan 262-61 Fixture", "-c",
    "user.email=plan-262-61@example.invalid", "commit", "--quiet", "-m", message],
  { cwd: rootPath, env: { ...process.env,
    GIT_AUTHOR_NAME: "Plan 262-61 Fixture",
    GIT_AUTHOR_EMAIL: "plan-262-61@example.invalid",
    GIT_COMMITTER_NAME: "Plan 262-61 Fixture",
    GIT_COMMITTER_EMAIL: "plan-262-61@example.invalid",
    GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z" } })
const commitSyntheticTree = (rootPath: string, tree: string, parent: string,
  message: string) => execFileSync("git", ["commit-tree", tree, "-p", parent,
    "-m", message], { cwd: rootPath, encoding: "utf8", env: { ...process.env,
      GIT_AUTHOR_NAME: "Plan 262-61 Fixture",
      GIT_AUTHOR_EMAIL: "plan-262-61@example.invalid",
      GIT_COMMITTER_NAME: "Plan 262-61 Fixture",
      GIT_COMMITTER_EMAIL: "plan-262-61@example.invalid",
      GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
      GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
    } }).trim()
const lines = (value: string) => value.split("\n").filter(Boolean)
const fullOid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const root = (value: unknown): value is string =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const readJson = (rootPath: string, repoPath: string) =>
  JSON.parse(readFileSync(path.resolve(rootPath, repoPath), "utf8")) as Record<string, unknown>
const changedPaths = (rootPath: string, commit: string) => lines(git(rootPath,
  ["diff-tree", "--no-commit-id", "--name-only", "-r", "--no-renames", commit])).sort()
const ancestor = (rootPath: string, older: string, newer: string) => {
  try { execFileSync("git", ["merge-base", "--is-ancestor", older, newer], { cwd: rootPath }) }
  catch { fail("V138_PLAN_262_61_FIRST_PARENT_ORDER_INVALID") }
  const firstParent = lines(git(rootPath, ["rev-list", "--first-parent", newer]))
  if (!firstParent.includes(older)) fail("V138_PLAN_262_61_FIRST_PARENT_ORDER_INVALID")
}

const physicalRepoRoot = (rootPath: string) => {
  const resolved = path.resolve(rootPath)
  let physical: string
  try { physical = realpathSync(resolved) } catch {
    fail("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  }
  if (physical !== resolved || lstatSync(resolved).isSymbolicLink() ||
    git(physical, ["rev-parse", "--show-toplevel"]) !== physical)
    fail("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  return physical
}

/** Exact, repository-confined, no-follow read with stable file identity. */
const readRepositoryFile = (rootPath: string, repoPath: string,
  expectedPath?: string, expectedMode = 0o644) => {
  const physical = physicalRepoRoot(rootPath)
  if (path.isAbsolute(repoPath) || repoPath === "" || repoPath.includes("\\") ||
    repoPath.split("/").some((part) => part === "" || part === "." || part === "..") ||
    expectedPath !== undefined && repoPath !== expectedPath)
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  const absolute = path.join(physical, ...repoPath.split("/"))
  const parent = path.dirname(absolute)
  let parentPhysical: string
  try { parentPhysical = realpathSync(parent) } catch {
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  }
  if (parentPhysical !== parent || !parentPhysical.startsWith(`${physical}${path.sep}`))
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  let descriptor = -1
  try {
    try { descriptor = openSync(absolute, fsConstants.O_RDONLY |
      (fsConstants.O_NOFOLLOW ?? 0)) } catch {
      fail("V138_PLAN_262_61_PATH_METADATA_INVALID")
    }
    const before = fstatSync(descriptor)
    const leaf = lstatSync(absolute)
    if (!before.isFile() || !leaf.isFile() || leaf.isSymbolicLink() ||
      before.nlink !== 1 || before.uid !== process.geteuid?.() ||
      before.dev !== leaf.dev || before.ino !== leaf.ino ||
      (before.mode & 0o777) !== expectedMode || (leaf.mode & 0o777) !== expectedMode ||
      before.size > 256 * 1024 * 1024)
      fail("V138_PLAN_262_61_PATH_METADATA_INVALID")
    const bytes = Buffer.alloc(before.size)
    let offset = 0
    while (offset < bytes.length) offset += readSync(descriptor, bytes, offset,
      bytes.length - offset, offset)
    const after = fstatSync(descriptor)
    if (before.dev !== after.dev || before.ino !== after.ino ||
      before.size !== after.size || before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs)
      fail("V138_PLAN_262_61_PATH_IDENTITY_CHANGED")
    return Object.freeze({ bytes, identity:
      `dev:${before.dev}:ino:${before.ino}:size:${before.size}`,
    mode: before.mode & 0o777 })
  } finally { if (descriptor >= 0) closeSync(descriptor) }
}
export const inspectV138Plan26261RepositoryFile = (rootPath: string,
  repoPath: string, expectedPath: string) => readRepositoryFile(rootPath,
  repoPath, expectedPath)

const requireCleanRepository = (rootPath: string) => {
  const rows = lines(git(rootPath,
    ["status", "--porcelain=v1", "--untracked-files=all"]))
  if (rows.length === 0) return
  if (candidateCleanlinessPath === null || rows.some((row) =>
    row.slice(3) !== candidateCleanlinessPath ||
    !["??", " M", "M ", "AM"].includes(row.slice(0, 2))))
    fail("V138_PLAN_262_61_REPOSITORY_DIRTY")
}

const enableCandidateCleanliness = (repoPath: string) => {
  if (![PLAN_61_SUMMARY, PLAN_62_SUMMARY].includes(repoPath))
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  candidateCleanlinessPath = repoPath
}

export const assertV138Plan26261CandidateCleanliness = (rootPath: string,
  repoPath: string) => {
  const previous = candidateCleanlinessPath
  try { enableCandidateCleanliness(repoPath); requireCleanRepository(rootPath) }
  finally { candidateCleanlinessPath = previous }
  return true
}

export const assertV138Plan26261SummaryPublicationState = (rootPath: string,
  repoPath: string, committed: boolean) => {
  if (![PLAN_61_SUMMARY, PLAN_62_SUMMARY].includes(repoPath))
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  if (!committed) return assertV138Plan26261CandidateCleanliness(rootPath, repoPath)
  requireCleanRepository(rootPath)
  const immutable = committedCurrentFile(rootPath, repoPath,
    "V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
  if (canonicalV138ReviewerV3(changedPaths(rootPath, immutable.commit)) !==
    canonicalV138ReviewerV3([repoPath]))
    fail("V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
  return true
}

const blobRow = (rootPath: string, commit: string, repoPath: string) => {
  const bytes = gitBytes(rootPath, ["show", `${commit}:${repoPath}`])
  const ls = git(rootPath, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
  return Object.freeze({ path: repoPath, mode: ls[0], blobOid: ls[2],
    sha256: sha256V138ReviewerV3(bytes), byteLength: bytes.byteLength })
}

export const inspectV138Plan26261A9Custody = (rootPath = repoRoot) => {
  requireCleanRepository(rootPath)
  const parent = lines(git(rootPath, ["show", "-s", "--format=%P", SOURCE_A9]))
  const trailer = git(rootPath, ["log", "-1",
    "--format=%(trailers:key=Plan-262-60-Author-Run,valueonly)", SOURCE_A9])
  const paths = changedPaths(rootPath, SOURCE_A9)
  if (parent.length !== 1 || parent[0] !== SOURCE_BASE9 ||
    git(rootPath, ["rev-parse", `${SOURCE_A9}^{tree}`]) !== SOURCE_A9_TREE ||
    trailer !== SOURCE_A9_RUN || canonicalV138ReviewerV3(paths) !==
      canonicalV138ReviewerV3([...V138_REVIEW_V3_SOURCE_PATHS].sort())) {
    fail("V138_PLAN_262_61_A9_CUSTODY_INVALID")
  }
  const blobs = V138_REVIEW_V3_SOURCE_PATHS.map((repoPath) =>
    blobRow(rootPath, SOURCE_A9, repoPath)).sort((a, b) => a.path.localeCompare(b.path))
  const descendantDrift = lines(git(rootPath, ["log", "--first-parent", "--format=%H",
    `${SOURCE_A9}..HEAD`, "--", ...V138_REVIEW_V3_SOURCE_PATHS]))
  if (descendantDrift.length !== 0)
    fail("V138_PLAN_262_61_POST_A9_COMMITTED_SOURCE_DRIFT")
  for (const item of blobs) {
    const current = readRepositoryFile(rootPath, item.path, item.path)
    if (item.mode !== "100644" || current.mode !== 0o644 ||
      !current.bytes.equals(gitBytes(rootPath, ["show", `${SOURCE_A9}:${item.path}`])))
      fail("V138_PLAN_262_61_POST_A9_SOURCE_DRIFT")
  }
  return Object.freeze({ sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9,
    tree: SOURCE_A9_TREE, parent: SOURCE_BASE9, authorRun: SOURCE_A9_RUN,
    paths: Object.freeze(paths), blobs: Object.freeze(blobs) })
}

export const inspectV138Plan26261Predecessors = (rootPath = repoRoot) => {
  const layers = PREDECESSOR_LAYERS.map(([tip, carrier], index) => {
    const tipParents = lines(git(rootPath, ["show", "-s", "--format=%P", tip]))
    const carrierParents = lines(git(rootPath, ["show", "-s", "--format=%P", carrier]))
    if (tipParents.length !== 1 || carrierParents.length !== 1 || carrierParents[0] !== tip)
      fail("V138_PLAN_262_61_PREDECESSOR_MANIFEST_INVALID")
    if (index > 0 && tipParents[0] !== PREDECESSOR_LAYERS[index - 1]![1])
      fail("V138_PLAN_262_61_PREDECESSOR_MANIFEST_INVALID")
    return Object.freeze({ ordinal: index + 3, tip, carrier,
      tipTree: git(rootPath, ["rev-parse", `${tip}^{tree}`]),
      tipParent: tipParents[0], tipPaths: Object.freeze(changedPaths(rootPath, tip)),
      carrierTree: git(rootPath, ["rev-parse", `${carrier}^{tree}`]),
      carrierParent: carrierParents[0],
      carrierPaths: Object.freeze(changedPaths(rootPath, carrier)),
      carrierBlobs: Object.freeze(changedPaths(rootPath, carrier).map((repoPath) =>
        blobRow(rootPath, carrier, repoPath))) })
  })
  return Object.freeze(layers)
}

export const inspectV138Plan26261SummaryConvergence = (rootPath = repoRoot) => {
  const current = readFileSync(path.resolve(rootPath, SUMMARY_PATH))
  if (current.byteLength !== SUMMARY_BYTE_LENGTH)
    fail(`V138_PLAN_262_61_SUMMARY_BYTES_INVALID:length:${current.byteLength}`)
  const commits = lines(git(rootPath, ["log", "--first-parent", "--format=%H",
    "HEAD", "--", SUMMARY_PATH]))
  const matching = commits.filter((commit) => {
    try { return gitBytes(rootPath, ["show", `${commit}:${SUMMARY_PATH}`]).equals(current) }
    catch { return false }
  })
  const finalCarrier = matching.filter((commit) =>
    changedPaths(rootPath, commit).includes(SUMMARY_PATH))[0]
  if (finalCarrier !== SUMMARY_CARRIER ||
    git(rootPath, ["rev-parse", `${finalCarrier}:${SUMMARY_PATH}`]) !== SUMMARY_BLOB ||
    lines(git(rootPath, ["log", "--format=%H", `${finalCarrier}..HEAD`, "--",
      SUMMARY_PATH])).length !== 0) fail("V138_PLAN_262_61_SUMMARY_CARRIER_INVALID")
  ancestor(rootPath, SOURCE_A9, finalCarrier)
  ancestor(rootPath, finalCarrier, PLAN_60_CONVERGENCE)
  const v9 = gitBytes(rootPath, ["show", `${PLAN_60_CONVERGENCE}:${PLAN_60_V9_PATH}`])
  const fix = gitBytes(rootPath,
    ["show", `${PLAN_60_CONVERGENCE}:${PLAN_60_REVIEW_FIX_PATH}`])
  if (git(rootPath, ["rev-parse", `${PLAN_60_CONVERGENCE}:${PLAN_60_V9_PATH}`]) !==
      PLAN_60_V9_BLOB || sha256V138ReviewerV3(v9) !== PLAN_60_V9_SHA256 ||
    git(rootPath, ["rev-parse", `${PLAN_60_CONVERGENCE}:${PLAN_60_REVIEW_FIX_PATH}`]) !==
      PLAN_60_REVIEW_FIX_BLOB || sha256V138ReviewerV3(fix) !== PLAN_60_REVIEW_FIX_SHA256)
    fail("V138_PLAN_262_61_PLAN_60_CONVERGENCE_INVALID")
  return Object.freeze({ carrierCommit: finalCarrier, carrierBlob: SUMMARY_BLOB,
    carrierSha256: SUMMARY_SHA256, carrierByteLength: SUMMARY_BYTE_LENGTH,
    convergenceCommit: PLAN_60_CONVERGENCE, v9Blob: PLAN_60_V9_BLOB,
    v9Root: PLAN_60_V9_SHA256, reviewFixBlob: PLAN_60_REVIEW_FIX_BLOB,
    reviewFixRoot: PLAN_60_REVIEW_FIX_SHA256 })
}

export const inspectV138Plan26261ProtectedHistory = (rootPath = repoRoot) => {
  const expected = [5, 6, 7, 8, 9].flatMap((version) =>
    Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`))
  const failurePath =
    ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json"
  const failureCommit = "bc0f95141d475d1d56ecf9d8ce67880f29385ea1"
  const failureBlob = "f5efc47d0e65cebee250431cded02c3fa41906c0"
  const failureRoot =
    "sha256:dffa9bf3915895506958aef5bb45d350f70eb7a3c190078e217384c16f3e4a8a"
  const authorizationDescendants = lines(git(rootPath, ["log", "--first-parent",
    "--format=%H", `${SOURCE_A9}..HEAD`, "--", ...AUTHORIZATION_PATHS]))
  if (authorizationDescendants.length !== 0)
    fail("V138_PLAN_262_61_POST_A9_AUTHORIZATION_HISTORY_DRIFT")
  const failureDescendants = lines(git(rootPath, ["log", "--first-parent",
    "--format=%H", `${SOURCE_A9}..HEAD`, "--", failurePath]))
  if (failureDescendants.length !== 0)
    fail("V138_PLAN_262_61_POST_A9_PROTECTED_HISTORY_DRIFT")
  const failureMode = lstatSync(path.resolve(rootPath, failurePath)).mode & 0o777
  if (failureMode !== 0o600 && failureMode !== 0o644)
    fail("V138_PLAN_262_61_PATH_METADATA_INVALID")
  const failureRead = readRepositoryFile(rootPath, failurePath, failurePath,
    failureMode)
  if (git(rootPath, ["ls-tree", SOURCE_A9, "--", failurePath]).split(/\s+/u)[0] !==
    "100644") fail("V138_PLAN_262_61_PATH_METADATA_INVALID")
  const failureBytes = failureRead.bytes
  const failure = JSON.parse(failureBytes.toString("utf8")) as Record<string, unknown>
  const authorizations = FROZEN_AUTHORIZATIONS.map(([repoPath, commit, blobOid,
    sha256, byteLength]) => {
    const bytes = readRepositoryFile(rootPath, repoPath, repoPath).bytes
    if (git(rootPath, ["rev-parse", `${commit}:${repoPath}`]) !== blobOid ||
      !gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).equals(bytes) ||
      !gitBytes(rootPath, ["show", `${SOURCE_A9}:${repoPath}`]).equals(bytes) ||
      sha256V138ReviewerV3(bytes) !== sha256 || bytes.byteLength !== byteLength ||
      lines(git(rootPath, ["log", "--format=%H", `${commit}..${SOURCE_A9}`, "--",
        repoPath])).length !== 0)
      fail("V138_PLAN_262_61_AUTHORIZATION_HISTORY_INVALID")
    return Object.freeze({ path: repoPath, commit, blobOid, sha256, byteLength })
  })
  if (git(rootPath, ["rev-parse", `${failureCommit}:${failurePath}`]) !== failureBlob ||
    sha256V138ReviewerV3(failureBytes) !== failureRoot || failureBytes.byteLength !== 5792 ||
    !gitBytes(rootPath, ["show", `${failureCommit}:${failurePath}`]).equals(failureBytes) ||
    !gitBytes(rootPath, ["show", `${SOURCE_A9}:${failurePath}`]).equals(failureBytes) ||
    canonicalV138ReviewerV3(failure.historicalChargedPublicAttemptIds as Json) !==
      canonicalV138ReviewerV3(expected) ||
    canonicalV138ReviewerV3(failure.protectedRoots as Json) !==
      canonicalV138ReviewerV3(FROZEN_PROTECTED_ROOTS) ||
    authorizations.length !== 6)
    fail("V138_PLAN_262_61_PROTECTED_HISTORY_INVALID")
  return Object.freeze({ chargeIds: Object.freeze(expected),
    authorizations: Object.freeze(authorizations), protectedRoots: FROZEN_PROTECTED_ROOTS,
    protectedHistoryRoot: FROZEN_PROTECTED_ROOTS.protectedHistoryRoot,
    sourceFailureCommit: failureCommit, sourceFailureBlobOid: failureBlob,
    sourceFailureSha256: failureRoot })
}

const EXPECTED_PLAN_GRAPH = Object.freeze([
  "01:1:", "02:2:01", "08:3:02", "09:4:08", "10:5:09", "11:6:10",
  "12:7:11", "13:8:12", "14:9:13", "15:10:14", "16:11:15", "17:12:16",
  "18:13:17", "19:14:18", "20:15:19", "21:16:20", "22:17:21", "23:18:22",
  "24:19:23", "25:20:24", "26:21:25", "27:22:26", "28:23:27", "29:24:28",
  "30:25:29", "31:26:30", "32:27:31", "33:28:32", "34:29:33", "35:30:34",
  "36:31:35", "37:32:36", "38:33:37", "39:34:35,36,37,38", "42:35:39",
  "44:36:42", "45:37:44", "49:38:45", "51:39:49", "52:40:51", "53:41:52",
  "54:42:53", "60:43:54", "61:44:60", "62:45:61", "56:46:62", "57:47:56",
  "48:48:57",
] as const)
const EXPECTED_ARCHIVE = Object.freeze(["03", "04", "05", "06", "07", "40",
  "43", "46", "47", "48", "50", "55", "58", "59"] as const)
const LIFECYCLE_BASELINE = "3a63735a603e85a605ce8ce2e82f1dbb0a78873d"
const LIFECYCLE_INVENTORY_ROOT =
  "sha256:674354a710b7bb1a2137ab9bf766bc48757fc0e6cdfb204c1b6b8227225883ed"
const isLifecyclePath = (repoPath: string) => repoPath === ".planning/ROADMAP.md" ||
  repoPath === ".planning/STATE.md" || repoPath.startsWith(`${REVIEW_DIRECTORY}/`) &&
    (/\/262-.*-(?:PLAN|SUMMARY)\.md$/u.test(repoPath) ||
      /\/archived\/.*-HISTORICAL\.md$/u.test(repoPath))

const planIdentity = (bytes: string) => {
  const frontmatter = bytes.split("---")[1] ?? ""
  const plan = /^plan:\s*["']?([0-9]+)/mu.exec(frontmatter)?.[1]?.padStart(2, "0")
  const wave = /^wave:\s*([0-9]+)/mu.exec(frontmatter)?.[1]
  const linesValue = frontmatter.split("\n")
  const depends: string[] = []
  const inline = /^depends_on:\s*\[([^\]]*)\]/mu.exec(frontmatter)
  if (inline) depends.push(...inline[1]!.split(",").map(value =>
    value.replaceAll(/["'\s]/gu, "").replace(/^262-/u, ""))
    .filter(Boolean).map(value => value.padStart(2, "0")))
  else {
    const index = linesValue.findIndex(value => /^depends_on:\s*$/u.test(value))
    for (let cursor = index + 1; index >= 0 && cursor < linesValue.length; cursor += 1) {
      const match = /^\s+-\s*["']?(?:262-)?([0-9]+)/u.exec(linesValue[cursor]!)
      if (!match) break
      depends.push(match[1]!.padStart(2, "0"))
    }
  }
  if (!plan || !wave) fail("V138_PLAN_262_61_LIFECYCLE_SCHEMA_INVALID")
  return `${plan}:${wave}:${depends.join(",")}`
}

export const inspectV138Plan26261Lifecycle = (rootPath = repoRoot) => {
  const planDirectory = path.resolve(rootPath, REVIEW_DIRECTORY)
  const plans = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/262-*-PLAN.md`]))
  const summaries = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/262-*-SUMMARY.md`]))
  if (!existsSync(planDirectory) || plans.length !== 48 || summaries.length !== 43)
    fail("V138_PLAN_262_61_LIFECYCLE_INVALID")
  const baselinePaths = lines(git(rootPath, ["ls-tree", "-r", "--name-only",
    LIFECYCLE_BASELINE])).filter(isLifecyclePath).sort()
  const currentPaths = lines(git(rootPath, ["ls-files"])).filter(isLifecyclePath).sort()
  if (canonicalV138ReviewerV3(currentPaths) !== canonicalV138ReviewerV3(baselinePaths))
    fail("V138_PLAN_262_61_LIFECYCLE_PATH_INVENTORY_INVALID")
  const inventory = baselinePaths.map(repoPath => {
    const baseline = blobRow(rootPath, LIFECYCLE_BASELINE, repoPath)
    const current = readRepositoryFile(rootPath, repoPath, repoPath)
    if (baseline.mode !== "100644" || current.mode !== 0o644 ||
      !current.bytes.equals(gitBytes(rootPath,
        ["show", `${LIFECYCLE_BASELINE}:${repoPath}`])))
      fail("V138_PLAN_262_61_LIFECYCLE_BYTES_INVALID")
    return Object.freeze({ path: repoPath, mode: baseline.mode,
      blob: baseline.blobOid, sha256: baseline.sha256,
      byteLength: baseline.byteLength })
  })
  const inventoryRoot = sha256V138ReviewerV3(canonicalV138ReviewerV3(inventory))
  if (inventoryRoot !== LIFECYCLE_INVENTORY_ROOT ||
    lines(git(rootPath, ["log", "--first-parent", "--format=%H",
      `${LIFECYCLE_BASELINE}..HEAD`, "--", ...baselinePaths])).length !== 0)
    fail("V138_PLAN_262_61_LIFECYCLE_HISTORY_INVALID")
  const graph = plans.map(repoPath => planIdentity(readRepositoryFile(rootPath,
    repoPath, repoPath).bytes.toString("utf8"))).sort((left, right) =>
      Number(left.split(":")[1]) - Number(right.split(":")[1]))
  if (canonicalV138ReviewerV3(graph) !== canonicalV138ReviewerV3(EXPECTED_PLAN_GRAPH))
    fail("V138_PLAN_262_61_LIFECYCLE_GRAPH_INVALID")
  const archive = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/archived/262-*-HISTORICAL.md`]))
    .map(repoPath => /^262-([0-9]+)-HISTORICAL\.md$/u.exec(path.basename(repoPath))?.[1])
    .filter((value): value is string => value !== undefined)
  if (canonicalV138ReviewerV3(archive) !== canonicalV138ReviewerV3(EXPECTED_ARCHIVE))
    fail("V138_PLAN_262_61_LIFECYCLE_ARCHIVE_INVALID")
  const incomplete = plans.map((repoPath) => path.basename(repoPath).replace("-PLAN.md", ""))
    .filter((id) => !summaries.some((repoPath) => repoPath.endsWith(`${id}-SUMMARY.md`)))
  const expected = ["262-48", "262-56", "262-57", "262-61", "262-62"]
  if (canonicalV138ReviewerV3(incomplete.sort()) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_61_LIFECYCLE_INVALID")
  return Object.freeze({ totalPlans: plans.length, summaries: summaries.length,
    incomplete: Object.freeze(incomplete.sort()), graph: Object.freeze(graph),
    archive: Object.freeze(archive), inventoryRoot,
    inventory: Object.freeze(inventory) })
}

export const selectCompletedAgentHistory = (entries: readonly AgentHistoryEntry[],
  phase: string, plan: string) => {
  const matches = entries.filter((entry) => String(entry.phase) === phase &&
    String(entry.plan) === plan && entry.status === "completed")
  if (matches.length !== 1) fail("V138_PLAN_262_61_AGENT_HISTORY_CARDINALITY_INVALID")
  const selected = matches[0]!
  if (typeof selected.agent_id !== "string" || selected.agent_id.length === 0 ||
    typeof selected.completion_timestamp !== "string" ||
    selected.completion_timestamp.length === 0)
    fail("V138_PLAN_262_61_AGENT_HISTORY_IDENTITY_INVALID")
  return Object.freeze({ agentId: selected.agent_id, phase, plan,
    completionTimestamp: selected.completion_timestamp })
}

const parseAgentHistoryBytes = (bytes: Buffer) => {
  const parsed = JSON.parse(bytes.toString("utf8")) as unknown
  const entries = Array.isArray(parsed) ? parsed :
    parsed !== null && typeof parsed === "object" &&
      Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: AgentHistoryEntry[] }).entries : null
  if (entries === null) fail("V138_PLAN_262_61_AGENT_HISTORY_INVALID")
  return entries as AgentHistoryEntry[]
}
const boundedAgentHistory = (entries: readonly AgentHistoryEntry[]) =>
  Object.freeze(entries.map(entry => Object.freeze({ agent_id: entry.agent_id,
    phase: entry.phase, plan: entry.plan, segment: entry.segment,
    status: entry.status, completion_timestamp: entry.completion_timestamp })))
const agentHistoryRoot = (entries: readonly AgentHistoryEntry[]) =>
  sha256V138ReviewerV3(canonicalV138ReviewerV3(entries))

const committedCurrentFile = (rootPath: string, repoPath: string,
  code: string) => {
  const commit = git(rootPath, ["log", "-1", "--format=%H", "--", repoPath])
  if (!fullOid(commit)) fail(code)
  const current = readRepositoryFile(rootPath, repoPath, repoPath)
  const treeRow = git(rootPath, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
  const bytes = current.bytes
  if (treeRow[0] !== "100644" || current.mode !== 0o644 ||
    !gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).equals(bytes) ||
    lines(git(rootPath, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0)
    fail(code)
  return Object.freeze({ commit, blob: git(rootPath,
    ["rev-parse", `${commit}:${repoPath}`]), bytes, root: sha256V138ReviewerV3(bytes) })
}

const yamlScalar = (text: string, key: string) =>
  new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "mu").exec(text)?.[1]?.trim()
const recordsParentCommit = (rootPath: string, repoPath: string) =>
  git(rootPath, ["log", "-1", "--format=%H", "--", repoPath])
export const R3_REVIEWER_TOOL = "codex-gsd-code-reviewer-v3" as const
export const validateR3ReviewerToolTrailer = (trailer: string) => {
  if (trailer !== R3_REVIEWER_TOOL) fail("V138_PLAN_262_61_R3_TRAILER_INVALID")
  return true
}
export const reviewSuccessorHasOnlyConvergenceCarriers = (rootPath: string,
  previousReviewCommit: string, reviewedSource: string) => {
  const commits = lines(git(rootPath, ["rev-list", "--first-parent",
    `${previousReviewCommit}..${reviewedSource}`]))
  return commits.length > 0 && lines(git(rootPath, ["rev-list", "--first-parent",
    reviewedSource])).includes(previousReviewCommit) && commits.slice(1).every(commit => {
      const paths = canonicalV138ReviewerV3(changedPaths(rootPath, commit))
      return paths === canonicalV138ReviewerV3([PLAN_61_REVIEW_FIX]) ||
        paths === canonicalV138ReviewerV3([...R3_PATHS].sort())
    })
}

const latestReview = (rootPath: string, sourceR3: ReturnType<typeof inspectCommittedR3>) => {
  const tracked = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/262-61-CODE-REVIEW*.md`]))
  const reports = tracked.map((repoPath) => {
    const name = path.basename(repoPath)
    const version = name === "262-61-CODE-REVIEW.md" ? 1 :
      Number(/-V([0-9]+)\.md$/u.exec(name)?.[1] ?? -1)
    return { repoPath, version }
  }).filter(({ version }) => version >= 1).sort((a, b) => a.version - b.version)
  if (reports.length === 0 || reports.some((entry, index) => entry.version !== index + 1))
    fail("V138_PLAN_262_61_CODE_REVIEW_SEQUENCE_INVALID")
  const records = reports.map(({ repoPath }, index) => {
    const immutable = committedCurrentFile(rootPath, repoPath,
      "V138_PLAN_262_61_CODE_REVIEW_NOT_IMMUTABLE")
    const text = immutable.bytes.toString("utf8")
    const counts = Object.fromEntries(["critical", "warning", "info", "total"].map(key =>
      [key, Number(new RegExp(`^\\s*${key}:\\s*([0-9]+)\\s*$`, "mu")
        .exec(text)?.[1] ?? -1)]))
    const reviewedSource = yamlScalar(text, "reviewed_source_commit")
    const paths = [...text.matchAll(/^\s+-\s+(scripts\/check-v1-38-plan-262-61-source-completeness-review-v3(?:\.test)?\.ts)\s*$/gmu)]
      .map(match => match[1]!).sort()
    if (!fullOid(reviewedSource) || yamlScalar(text, "depth") !== "deep" ||
      yamlScalar(text, "files_reviewed") !== "2" ||
      canonicalV138ReviewerV3(paths) !== canonicalV138ReviewerV3([...R3_PATHS].sort()) ||
      canonicalV138ReviewerV3(changedPaths(rootPath, reviewedSource)) !==
        canonicalV138ReviewerV3([...R3_PATHS].sort()) ||
      changedPaths(rootPath, immutable.commit).length !== 1 ||
      changedPaths(rootPath, immutable.commit)[0] !== repoPath ||
      lines(git(rootPath, ["show", "-s", "--format=%P", immutable.commit]))[0] !==
        reviewedSource || index > 0 && !reviewSuccessorHasOnlyConvergenceCarriers(
          rootPath, recordsParentCommit(rootPath, reports[index - 1]!.repoPath),
          reviewedSource))
      fail("V138_PLAN_262_61_CODE_REVIEW_HISTORY_INVALID")
    if (index === reports.length - 1 &&
      (yamlScalar(text, "status") !== "clean" ||
        Object.values(counts).some(value => value !== 0) ||
        reviewedSource !== sourceR3.commit))
      fail("V138_PLAN_262_61_CODE_REVIEW_NOT_CLEAN")
    return Object.freeze({ path: repoPath, commit: immutable.commit,
      blob: immutable.blob, root: immutable.root, reviewedSource })
  })
  const latest = records.at(-1)!
  return Object.freeze({ reports: Object.freeze(records), path: latest.path,
    root: latest.root, commit: latest.commit, blob: latest.blob,
    sourceFixCommits: Object.freeze(records.slice(1).map(({ reviewedSource }) =>
      reviewedSource)) })
}

export const inspectCommittedR3 = (rootPath = repoRoot) => {
  if (git(rootPath, ["status", "--porcelain=v1", "--untracked-files=all", "--",
    ...R3_PATHS]) !== "")
    fail("V138_PLAN_262_61_R3_PHYSICAL_CUSTODY_INVALID")
  requireCleanRepository(rootPath)
  const candidates = lines(git(rootPath, ["log", "--first-parent", "--format=%H", "HEAD",
    "--", ...R3_PATHS]))
  const commit = candidates.find((candidate) =>
    canonicalV138ReviewerV3(changedPaths(rootPath, candidate)) ===
      canonicalV138ReviewerV3([...R3_PATHS].sort()))
  if (!commit) fail("V138_PLAN_262_61_R3_NOT_COMMITTED")
  const later = lines(git(rootPath, ["log", "--format=%H", `${commit}..HEAD`, "--",
    ...R3_PATHS]))
  if (later.length !== 0) fail("V138_PLAN_262_61_R3_LATER_REWRITE")
  for (const repoPath of R3_PATHS) {
    const current = readRepositoryFile(rootPath, repoPath, repoPath)
    const treeRow = git(rootPath, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
    if (treeRow[0] !== "100644" || current.mode !== 0o644 ||
      !gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).equals(current.bytes))
      fail("V138_PLAN_262_61_R3_PHYSICAL_CUSTODY_INVALID")
  }
  const trailer = git(rootPath, ["log", "-1",
    "--format=%(trailers:key=Plan-262-61-Reviewer-Tool,valueonly)", commit])
  validateR3ReviewerToolTrailer(trailer)
  return Object.freeze({ commit, tree: git(rootPath, ["rev-parse", `${commit}^{tree}`]),
    parent: lines(git(rootPath, ["show", "-s", "--format=%P", commit]))[0], trailer,
    blobs: Object.freeze(R3_PATHS.map((repoPath) => blobRow(rootPath, commit, repoPath))) })
}

export const inspectReviewerConvergence = (rootPath = repoRoot) => {
  const sourceR3 = inspectCommittedR3(rootPath)
  const review = latestReview(rootPath, sourceR3)
  const immutableFix = committedCurrentFile(rootPath, PLAN_61_REVIEW_FIX,
    "V138_PLAN_262_61_REVIEW_FIX_NOT_IMMUTABLE")
  const fixBytes = immutableFix.bytes
  const fixText = fixBytes.toString("utf8")
  const fixRoot = sha256V138ReviewerV3(fixBytes)
  const manifestMatch = /```review-convergence-json\n([^\n]+)\n```/u.exec(fixText)
  if (!manifestMatch) fail("V138_PLAN_262_61_REVIEW_FIX_SCHEMA_INVALID")
  let manifest: Record<string, unknown>
  try { manifest = JSON.parse(manifestMatch[1]!) as Record<string, unknown> } catch {
    fail("V138_PLAN_262_61_REVIEW_FIX_SCHEMA_INVALID")
  }
  const expected = { schemaVersion: "v1.38-plan-262-61-review-fix-convergence-v1",
    sourceR3: sourceR3.commit, sourceR3Tree: sourceR3.tree,
    sourceR3Parent: sourceR3.parent, reports: review.reports,
    terminalReviewPath: review.path, terminalReviewRoot: review.root,
    terminalReviewCommit: review.commit, terminalReviewBlob: review.blob,
    sourceFixCommits: review.sourceFixCommits }
  if (canonicalV138ReviewerV3(manifest) !== canonicalV138ReviewerV3(expected) ||
    review.sourceFixCommits.length !== review.reports.length - 1)
    fail("V138_PLAN_262_61_REVIEW_FIX_BINDING_INVALID")
  return Object.freeze({ sourceR3, codeReviewPath: review.path,
    codeReviewRoot: review.root, codeReviewCommit: review.commit,
    codeReviewBlob: review.blob,
    reviewFixRoot: fixRoot, reviewFixCommit: immutableFix.commit,
    reviewFixBlob: immutableFix.blob })
}

const OWNED_TEMP_PREFIX = /^(?:plan-262-61-exact-a9-|plan-262-61-review-v3-|plan-262-62-review-|v138-plan-262-62-)/u
const ACTUAL_HANDLER_BY_COMMAND = Object.freeze({
  "--check-plan-262-57-pre-execution-readiness-v1":
    "checkV138Plan26257PreExecutionReadinessV1",
  "--resolve-plan-262-57-pre-start-v1": "writeV138Plan26257PreStartObstructionV1",
  "--check-plan-262-57-pre-start-obstruction-v1":
    "checkV138Plan26257PreStartObstructionBranch",
  "--write-execution-context-v11-receipt": "writeV138Plan26257RouteStartV1",
  "--write-plan-262-57-route-start-v1": "writeV138Plan26257RouteStartV1",
  "--write-headroom-preflight-v11-receipt": "writeV138HostHeadroomPreflightV11Receipt",
  "--calibrate-parallel-v11-receipt": "writeV138ParallelCalibrationV11Receipt",
  "--write-authoritative-v12-receipt": "writeV138AuthoritativeMatrixV12Receipt",
  "--write-plan-262-57-terminal-v1": "writeV138Plan26257TerminalV1",
  "--check-plan-262-57-terminal-v1": "checkV138Plan26257TerminalBranch",
} as const)
export const snapshotReadiness = (rootPath: string) => {
  const status = git(rootPath, ["status", "--porcelain=v1"])
  const destinations = [...FORBIDDEN_DESTINATIONS, PLAN_61_RECEIPT].map((repoPath) => {
    const absolute = path.resolve(rootPath, repoPath)
    try {
      const stat = lstatSync(absolute)
      return { path: repoPath, type: stat.isSymbolicLink() ? "symlink" :
        stat.isFile() ? "file" : "other" }
    } catch { return { path: repoPath, type: "absent" } }
  })
  const tempInventory = readdirSync(os.tmpdir()).filter(name =>
    OWNED_TEMP_PREFIX.test(name)).sort().map(name => {
      const absolute = path.join(os.tmpdir(), name)
      const stat = lstatSync(absolute)
      return { name, type: stat.isSymbolicLink() ? "symlink" :
        stat.isDirectory() ? "directory" : stat.isFile() ? "file" : "other",
      mode: stat.mode & 0o777, dev: String(stat.dev), ino: String(stat.ino) }
    })
  const cloneInventory = lines(git(rootPath, ["worktree", "list", "--porcelain"]))
    .filter(line => line.startsWith("worktree ")).map(line => line.slice(9))
    .filter(worktree => /plan-262-62|v138-plan-262-62/u.test(worktree) &&
      realpathSync(worktree) !== realpathSync(rootPath)).sort()
  const hooks = { routeExecutionHookCount, candidateDerivationHookCount }
  const snapshot = { status, destinations, tempInventory, cloneInventory,
    activeDisposableRoots: [...activeDisposableRoots].sort(), hooks }
  return Object.freeze({ ...snapshot,
    root: sha256V138ReviewerV3(canonicalV138ReviewerV3(snapshot as unknown as Json)) })
}

export const assertV138Plan26261NoCrashLeak = (snapshot: ReturnType<
  typeof snapshotReadiness>) => {
  if (snapshot.tempInventory.length !== 0 || snapshot.cloneInventory.length !== 0 ||
    snapshot.activeDisposableRoots.length !== 0)
    fail("V138_PLAN_262_61_MAIN_TEMP_LEAK")
}

type RouteObservation = Readonly<{ command: string; handler: string;
  manifestHandler: string;
  aliasAudit: Readonly<Record<string, unknown>> | null;
  sourceFinding: string | null;
  destination: string; argv: readonly string[]; exit: number; outputRoot: string;
  resultCode: string; observedDisposition: string | null;
  outputByteLength: number; handlerSourceRoot: string; dispatcherSourceRoot: string;
  functionRangeRoot: string; callCount: number; callTraceRoot: string;
  effectPolicyRoot: string; routeIdentityRoot: string;
  beforeRoot: string; afterRoot: string;
  beforePathCount: number; afterPathCount: number; eventPaths: readonly string[];
  changedLocations: readonly string[] }>

const completeRouteInventoryPaths = (rootPath: string,
  additionalPaths: readonly string[] = []) => [...new Set([
  ...lines(git(rootPath, ["ls-files"])),
  ...lines(git(rootPath, ["status", "--porcelain=v1", "--untracked-files=all"]))
    .map(row => row.slice(3)).filter(Boolean),
  ...FORBIDDEN_DESTINATIONS,
    ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-preflight-consumption-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json",
    ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1/claim.json",
    ...additionalPaths,
  ])].sort()

const inspectorPost = <T>(session: Session, method: string,
  params?: Record<string, unknown>) => new Promise<T>((resolve, reject) =>
  session.post(method, params ?? {}, (error, result) => error ? reject(error) :
    resolve(result as T)))

const routeInventory = (rootPath: string, additionalPaths: readonly string[] = []) => {
  const physical = physicalRepoRoot(rootPath)
  const paths = completeRouteInventoryPaths(rootPath, additionalPaths)
  return Object.freeze(paths.map(repoPath => {
    const absolute = path.resolve(physical, repoPath)
    if (!existsSync(absolute)) return { path: repoPath, type: "absent" }
    const stat = lstatSync(absolute)
    if (!stat.isFile() || stat.isSymbolicLink()) return { path: repoPath,
      type: stat.isSymbolicLink() ? "symlink" : "other" }
    if (realpathSync(path.dirname(absolute)) !== path.dirname(absolute))
      fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
    let descriptor = -1
    let bytes: Buffer
    try {
      descriptor = openSync(absolute, fsConstants.O_RDONLY |
        (fsConstants.O_NOFOLLOW ?? 0))
      const before = fstatSync(descriptor)
      if (!before.isFile() || before.dev !== stat.dev || before.ino !== stat.ino ||
        before.size > 256 * 1024 * 1024)
        fail("V138_PLAN_262_61_PATH_METADATA_INVALID")
      bytes = Buffer.alloc(before.size)
      let offset = 0
      while (offset < bytes.length) offset += readSync(descriptor, bytes, offset,
        bytes.length - offset, offset)
      const after = fstatSync(descriptor)
      if (before.dev !== after.dev || before.ino !== after.ino ||
        before.size !== after.size || before.mtimeMs !== after.mtimeMs ||
        before.ctimeMs !== after.ctimeMs)
        fail("V138_PLAN_262_61_PATH_IDENTITY_CHANGED")
    } finally { if (descriptor >= 0) closeSync(descriptor) }
    const routeMutable = repoPath.startsWith(".planning/artifacts/.v1.38-") ||
      FORBIDDEN_DESTINATIONS.includes(repoPath as never) ||
      repoPath.includes("plan-262-57-") || repoPath.includes("current-matrix-")
    return { path: repoPath, type: "file", mode: stat.mode & 0o777,
      byteLength: bytes.byteLength,
      ...(routeMutable ? { contentBinding: "route-volatile-diagnostic-only" } :
        { sha256: sha256V138ReviewerV3(bytes) }) }
  }))
}

const routeGitState = (rootPath: string) => Object.freeze({
  head: git(rootPath, ["rev-parse", "HEAD"]),
  tree: git(rootPath, ["rev-parse", "HEAD^{tree}"]),
  refsRoot: sha256V138ReviewerV3(git(rootPath, ["show-ref"])),
  indexRoot: sha256V138ReviewerV3(gitBytes(rootPath, ["ls-files", "-s", "-z"])),
  statusRoot: sha256V138ReviewerV3(gitBytes(rootPath,
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"])),
})

export const inventoryChangedPaths = (before: readonly Record<string, unknown>[],
  after: readonly Record<string, unknown>[]) => {
  const left = new Map(before.map(row => [String(row.path), row]))
  const right = new Map(after.map(row => [String(row.path), row]))
  return [...new Set([...left.keys(), ...right.keys()])].sort().filter(repoPath =>
    canonicalV138ReviewerV3(left.get(repoPath) ?? null) !==
      canonicalV138ReviewerV3(right.get(repoPath) ?? null))
}

/**
 * Project a physical inventory delta into the only path-shaped data permitted in
 * emitted custody evidence.  The physical list never leaves the observation:
 * every location is verified against the specific disposable repository root,
 * canonicalized, and rejected when it could name an outside or private target.
 */
export const projectV138Plan26261ChangedLocations = (rootPath: string,
  physicalChangedPaths: readonly unknown[]) => {
  const physical = physicalRepoRoot(rootPath)
  if (!Array.isArray(physicalChangedPaths) || physicalChangedPaths.length > 128)
    fail("V138_PLAN_262_61_CHANGED_LOCATION_INVALID")
  const locations = physicalChangedPaths.map((value) => {
    if (typeof value !== "string" || value.length === 0 || value.length > 512 ||
      path.isAbsolute(value) || value.includes("\\") ||
      value.split("/").some(part => part === "" || part === "." || part === "..") ||
      /(?:^|\/)(?:\.git|private|secret|secrets|strategyMemory|soldierMemory|objectivePayload|rawDiagnostics)(?:\/|$)/iu.test(value))
      fail("V138_PLAN_262_61_CHANGED_LOCATION_INVALID")
    const absolute = path.resolve(physical, value)
    const relative = path.relative(physical, absolute).split(path.sep).join("/")
    if (relative !== value || relative === "" || relative === ".." ||
      relative.startsWith("../") || path.isAbsolute(relative))
      fail("V138_PLAN_262_61_CHANGED_LOCATION_INVALID")
    return relative
  })
  const canonical = [...new Set(locations)].sort()
  if (canonicalV138ReviewerV3(physicalChangedPaths) !==
    canonicalV138ReviewerV3(canonical))
    fail("V138_PLAN_262_61_CHANGED_LOCATION_INVALID")
  return Object.freeze(canonical)
}

type FsPathState = Readonly<{ type: "absent" | "file" | "directory" |
  "symlink" | "other"; mode?: number; byteLength?: number; sha256?: string }>
type FsOperation = Readonly<{ ordinal: number; command: string; operation: string;
  path: string; sideEffect: string; outcome: "success" | "error";
  errorCode: string | null;
  flags: string | null; beforeState: FsPathState; afterState: FsPathState;
  detailRoot: string }>

export const physicalEventDetailRootV138Plan26261 = (detail: unknown) =>
  identityRootV138ReviewerV3("evidenceBundle",
    "v1.38-plan-262-61-physical-event-detail-v1", detail)
export const logicalEventDetailRootV138Plan26261 = (detail: unknown) =>
  identityRootV138ReviewerV3("evidenceBundle",
    "v1.38-plan-262-61-logical-event-detail-v1", detail)

const normalizeRouteObservedPath = (repoPath: string) => repoPath.replace(
  /([/.][^/]+)\.[0-9]+\.[0-9a-f]{16,}\.tmp$/u, "$1.<pid-random>.tmp")

const fsOperationSideEffect = (method: string, index: number,
  beforeState: FsPathState, afterState: FsPathState) => {
  if (method === "mkdirSync") return "directory-create"
  if (method === "openSync") return "temporary-file-create"
  if (method === "writeSync" || method === "writeFileSync" ||
    method === "appendFileSync" || method === "truncateSync")
    return "content-write"
  if (method === "fsyncSync") return "durability-sync"
  if (method === "closeSync") return "descriptor-close"
  if (method === "linkSync") return index === 0 ?
    "publication-source-link" : "publication-destination-link"
  if (method === "unlinkSync" || method === "rmSync" || method === "rmdirSync")
    return "cleanup-delete"
  if (method === "renameSync") return index === 0 ?
    "publication-source-rename" : "publication-destination-rename"
  if (method === "copyFileSync") return index === 0 ?
    "copy-source-read" : "copy-destination-write"
  if (method === "symlinkSync") return index === 0 ?
    "symlink-source-reference" : "symlink-destination-create"
  if (method === "chmodSync" || method === "chownSync") return "metadata-write"
  return beforeState.type === afterState.type ? "state-observation" : "state-change"
}

export const installRouteFsObserver = () => {
  const require = createRequire(import.meta.url)
  const fs = require("node:fs") as Record<string, any>
  const methods = ["openSync", "writeSync", "fsyncSync", "closeSync",
    "writeFileSync", "appendFileSync", "renameSync", "unlinkSync", "mkdirSync",
    "rmdirSync", "rmSync", "chmodSync", "chownSync", "truncateSync",
    "linkSync", "symlinkSync", "copyFileSync"] as const
  const originals = Object.fromEntries(methods.map(name => [name, fs[name]])) as
    Record<string, Function>
  let active: { root: string; command: string; records: FsOperation[] } | null = null
  const descriptors = new Map<number, string>()
  const observedDescriptors = new Set<number>()
  const confined = (rootPath: string, value: unknown) => {
    const raw = value instanceof URL ? fileURLToPath(value) : String(value)
    const lexical = path.resolve(rootPath, raw)
    let absolute: string
    try { absolute = realpathSync(lexical) } catch {
      try { absolute = path.join(realpathSync(path.dirname(lexical)),
        path.basename(lexical)) } catch { absolute = lexical }
    }
    const physical = realpathSync(rootPath)
    if (absolute !== physical && !absolute.startsWith(`${physical}${path.sep}`))
      fail("V138_PLAN_262_61_ROUTE_FS_ESCAPE")
    return path.relative(physical, absolute).split(path.sep).join("/") || "."
  }
  const state = (rootPath: string, repoPath: string): FsPathState => {
    const absolute = path.resolve(rootPath, repoPath)
    try {
      const stat = lstatSync(absolute)
      if (stat.isSymbolicLink()) return Object.freeze({ type: "symlink",
        mode: stat.mode & 0o777 })
      if (stat.isDirectory()) return Object.freeze({ type: "directory",
        mode: stat.mode & 0o777 })
      if (!stat.isFile()) return Object.freeze({ type: "other",
        mode: stat.mode & 0o777 })
      const fd = originals.openSync!.call(fs, absolute, fsConstants.O_RDONLY |
        (fsConstants.O_NOFOLLOW ?? 0)) as number
      let bytes: Buffer
      try {
        const fileStat = fs.fstatSync(fd)
        bytes = Buffer.alloc(fileStat.size)
        let offset = 0
        while (offset < bytes.length) offset += fs.readSync(fd, bytes, offset,
          bytes.length - offset, offset)
      } finally { originals.closeSync!.call(fs, fd) }
      return Object.freeze({ type: "file", mode: stat.mode & 0o777,
        byteLength: bytes.byteLength, sha256: sha256V138ReviewerV3(bytes) })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return Object.freeze({ type: "absent" })
      throw error
    }
  }
  for (const method of methods) fs[method] = function (...args: unknown[]) {
    const openFlags = method === "openSync" ? args[1] : null
    const mutatingOpen = typeof openFlags === "number" ?
      (openFlags & (fsConstants.O_WRONLY | fsConstants.O_RDWR | fsConstants.O_CREAT |
        fsConstants.O_TRUNC | fsConstants.O_APPEND)) !== 0 :
      typeof openFlags === "string" && /[wax+]/u.test(openFlags)
    const descriptorMethod = ["writeSync", "fsyncSync", "closeSync",
      "writeFileSync", "appendFileSync", "truncateSync"].includes(method) &&
      typeof args[0] === "number"
    const descriptorPath = descriptorMethod ? descriptors.get(args[0] as number) :
      undefined
    const unknownDescriptor = descriptorMethod && descriptorPath === undefined
    if (active !== null && unknownDescriptor && method !== "closeSync")
      fail("V138_PLAN_262_61_ROUTE_FS_DESCRIPTOR_UNKNOWN")
    if (active !== null && descriptorMethod && !unknownDescriptor &&
      method !== "closeSync") observedDescriptors.add(args[0] as number)
    const shouldObserve = active !== null && (method !== "openSync" || mutatingOpen) &&
      !(method === "closeSync" && (unknownDescriptor ||
        !observedDescriptors.has(args[0] as number)))
    const candidates = !shouldObserve ? [] : descriptorMethod ? [descriptorPath] :
      ["renameSync", "linkSync", "symlinkSync", "copyFileSync"].includes(method) ?
        [args[0], args[1]] : [args[0]]
    const operationFlags = method === "openSync" ? String(args[1]) :
      (method === "writeFileSync" || method === "appendFileSync") &&
        typeof args[0] !== "number" && args[2] !== undefined ?
        canonicalV138ReviewerV3(args[2]) : null
    const observed = candidates.map((candidate, index) => {
      const physicalRepoPath = confined(active!.root, candidate)
      const repoPath = normalizeRouteObservedPath(physicalRepoPath)
      return { index, repoPath, physicalRepoPath,
        beforeState: state(active!.root, physicalRepoPath) }
    })
    let result: unknown
    try { result = originals[method]!.apply(fs, args) } catch (error) {
      for (const { index, repoPath, physicalRepoPath, beforeState } of observed) {
        const afterState = state(active!.root, physicalRepoPath)
        const errorCode = typeof (error as NodeJS.ErrnoException).code === "string" ?
          (error as NodeJS.ErrnoException).code! : "UNKNOWN"
        const retainedDetail = { ordinal: active!.records.length,
          operation: observed.length === 2 ?
            `${method}:${index === 0 ? "from" : "to"}` : method,
          path: repoPath,
          sideEffect: fsOperationSideEffect(method, index, beforeState, afterState),
          flags: operationFlags, outcome: "error" as const, errorCode,
          beforeState, afterState }
        active!.records.push(Object.freeze({ ...retainedDetail,
          command: active!.command,
          detailRoot: physicalEventDetailRootV138Plan26261(retainedDetail) }))
      }
      throw error
    }
    if (method === "openSync" && typeof result === "number" && active !== null) {
      descriptors.set(result, confined(active.root, args[0]))
      if (mutatingOpen) observedDescriptors.add(result)
    }
    for (const { index, repoPath, physicalRepoPath, beforeState } of observed) {
      const afterState = state(active!.root, physicalRepoPath)
      const retainedDetail = { ordinal: active!.records.length,
        operation: observed.length === 2 ?
          `${method}:${index === 0 ? "from" : "to"}` : method,
        path: repoPath,
        sideEffect: fsOperationSideEffect(method, index, beforeState, afterState),
        flags: operationFlags, outcome: "success" as const, errorCode: null,
        beforeState, afterState }
      active!.records.push(Object.freeze({ ...retainedDetail,
        command: active!.command,
        detailRoot: physicalEventDetailRootV138Plan26261(retainedDetail) }))
    }
    if (method === "closeSync" && typeof args[0] === "number") {
      descriptors.delete(args[0]); observedDescriptors.delete(args[0])
    }
    return result
  }
  syncBuiltinESMExports()
  return Object.freeze({
    start(rootPath: string, command: string) {
      if (active !== null) fail("V138_PLAN_262_61_ROUTE_FS_OBSERVER_REENTRY")
      active = { root: realpathSync(rootPath), command, records: [] }
      descriptors.clear()
      observedDescriptors.clear()
    },
    stop() {
      if (active === null) fail("V138_PLAN_262_61_ROUTE_FS_OBSERVER_INACTIVE")
      const result = Object.freeze([...active.records])
      active = null
      descriptors.clear()
      observedDescriptors.clear()
      return result
    },
    restore() {
      active = null
      observedDescriptors.clear()
      for (const method of methods) fs[method] = originals[method]
      syncBuiltinESMExports()
    },
  })
}

const ROUTE_RESERVATION_DIRECTORY =
  ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1"
const ROUTE_RESERVATION_CLAIM = `${ROUTE_RESERVATION_DIRECTORY}/claim.json`
const emptySha256 = sha256V138ReviewerV3(Buffer.alloc(0))

const operationIdentity = (operation: FsOperation) =>
  `${operation.operation}:${operation.path}`

const projectRouteLogicalIdentity = <T>(value: T,
  replacements: ReadonlyMap<string, string>): T => {
  if (typeof value === "string") {
    let projected = value
    for (const [physical, logical] of replacements)
      projected = projected.replaceAll(physical, logical)
    return projected as T
  }
  if (Array.isArray(value)) return value.map(item =>
    projectRouteLogicalIdentity(item, replacements)) as T
  if (value !== null && typeof value === "object") return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) =>
      [key, projectRouteLogicalIdentity(item, replacements)])) as T
  return value
}

export const projectV138Plan26261LogicalExecutionResult = (physical: any,
  replacements: ReadonlyMap<string, string>) => {
  const { physicalOutputText: _physicalOutputText,
    physicalOutputRoot: _physicalOutputRoot, projectionTuples,
    derivedRootEvidence, ...shared } = physical
  const projectedShared = projectRouteLogicalIdentity(shared, replacements)
  return Object.freeze({ ...projectedShared,
    projectionTuples: Object.freeze(projectionTuples.map((tuple: any) =>
      Object.freeze({ label: tuple.label,
        logical: projectRouteLogicalIdentity(tuple.logical, replacements) }))),
    derivedRootEvidence: derivedRootEvidence === null ? null : Object.freeze({
      domain: derivedRootEvidence.domain,
      rootField: derivedRootEvidence.rootField,
      logicalSchemaVersion: derivedRootEvidence.logicalSchemaVersion,
      logicalRecord: projectRouteLogicalIdentity(
        derivedRootEvidence.logicalStructure, replacements),
      logicalRoot: projectRouteLogicalIdentity(
        derivedRootEvidence.logicalRoot, replacements),
    }),
  })
}

export const verifyV138Plan26261LogicalExecutionResult = (physical: any,
  logical: any, replacements: ReadonlyMap<string, string>) => {
  if (canonicalV138ReviewerV3(
    projectV138Plan26261LogicalExecutionResult(physical, replacements)) !==
      canonicalV138ReviewerV3(logical))
    fail("V138_PLAN_262_61_LOGICAL_EXECUTION_PROJECTION_INVALID")
  return true
}

export const auditLogicalRouteOutput = (entry: Readonly<{ command: string }>,
  output: string, allowedDerivedRoots: ReadonlySet<string>) => {
  if (!output.startsWith("{")) return true
  let value: unknown
  try { value = JSON.parse(output) } catch {
    fail("V138_PLAN_262_61_LOGICAL_OUTPUT_AUDIT_INVALID")
  }
  const visit = (item: unknown, key = "") => {
    if (/(?:inode|ctime|device|absolutePath|noFollowIdentity)/iu.test(key))
      fail("V138_PLAN_262_61_LOGICAL_OUTPUT_VOLATILITY_INVALID")
    if (["metadataRoot", "dispositionRoot", "receiptRoot", "terminalRoot"]
      .includes(key) && (typeof item !== "string" ||
      !allowedDerivedRoots.has(item)))
      fail("V138_PLAN_262_61_LOGICAL_OUTPUT_VOLATILITY_INVALID")
    if (typeof item === "string" && path.isAbsolute(item))
      fail("V138_PLAN_262_61_LOGICAL_OUTPUT_VOLATILITY_INVALID")
    if (Array.isArray(item)) item.forEach(value => visit(value, key))
    else if (item !== null && typeof item === "object")
      Object.entries(item as Record<string, unknown>).forEach(([childKey, child]) =>
        visit(child, childKey))
  }
  visit(value)
  return entry.command
}

export const verifyAndProjectV138Plan26261DerivedRouteRoot = (input: Readonly<{
  domain: "evidenceBundle" | "canonicalJsonProfile" | "artifactManifest" |
    "containmentPolicy"; rootField: string; physicalRecord: Record<string, unknown>;
  physicalOutputRoot: string; logicalSchemaVersion: string;
  logicalStructure: Record<string, unknown>; expectedLogicalRoot?: string }>) => {
  const { [input.rootField]: physicalRecordRoot, ...physicalBody } =
    input.physicalRecord
  const schemaVersion = String(input.physicalRecord.schemaVersion)
  const recomputedPhysicalRoot = identityRootV138ReviewerV3(input.domain,
    schemaVersion, physicalBody)
  if (!root(input.physicalOutputRoot) || physicalRecordRoot !==
      input.physicalOutputRoot || recomputedPhysicalRoot !== input.physicalOutputRoot)
    fail("V138_PLAN_262_61_DERIVED_ROUTE_PHYSICAL_ROOT_INVALID")
  const logicalRoot = identityRootV138ReviewerV3("evidenceBundle",
    input.logicalSchemaVersion, input.logicalStructure)
  if (input.expectedLogicalRoot !== undefined &&
    input.expectedLogicalRoot !== logicalRoot)
    fail("V138_PLAN_262_61_DERIVED_ROUTE_LOGICAL_ROOT_INVALID")
  return Object.freeze({ physicalRoot: input.physicalOutputRoot, logicalRoot,
    physicalRootVerified: true as const, logicalRootRecomputed: true as const })
}

export const verifyAndProjectV138Plan26261PersistedRouteFile = (input: Readonly<{
  destination: string; expectedDestination: string; physicalBytes: Buffer;
  physicalSha256: string; physicalByteLength: number; physicalMode: number;
  expectedKeys: readonly string[]; embeddedRoots: Readonly<Record<string, string>>;
  logicalRecord: Record<string, unknown>; expectedLogicalSha256?: string }>) => {
  let physicalRecord: Record<string, any>
  try { physicalRecord = JSON.parse(input.physicalBytes.toString("utf8")) } catch {
    fail("V138_PLAN_262_61_PERSISTED_FILE_PARSE_INVALID")
  }
  if (input.destination !== input.expectedDestination ||
    canonicalV138ReviewerV3(Object.keys(physicalRecord)) !==
      canonicalV138ReviewerV3([...input.expectedKeys]) ||
    !input.physicalBytes.equals(Buffer.from(
      `${JSON.stringify(physicalRecord)}\n`)))
    fail("V138_PLAN_262_61_PERSISTED_FILE_SCHEMA_INVALID")
  if (sha256V138ReviewerV3(input.physicalBytes) !== input.physicalSha256 ||
    input.physicalBytes.byteLength !== input.physicalByteLength ||
    input.physicalMode !== 0o600)
    fail("V138_PLAN_262_61_PERSISTED_FILE_METADATA_INVALID")
  const atPath = (value: Record<string, any>, dotted: string) => dotted.split(".")
    .reduce<any>((cursor, key) => cursor?.[key], value)
  for (const [dotted, expected] of Object.entries(input.embeddedRoots))
    if (atPath(physicalRecord, dotted) !== expected)
      fail("V138_PLAN_262_61_PERSISTED_FILE_EMBEDDED_ROOT_INVALID")
  const logicalBytes = Buffer.from(`${JSON.stringify(input.logicalRecord)}\n`)
  const logicalSha256 = sha256V138ReviewerV3(logicalBytes)
  if (input.expectedLogicalSha256 !== undefined &&
    input.expectedLogicalSha256 !== logicalSha256)
    fail("V138_PLAN_262_61_PERSISTED_FILE_LOGICAL_ROOT_INVALID")
  return Object.freeze({ physicalRecord, logicalBytes,
    physicalSha256: input.physicalSha256, logicalSha256,
    physicalFileVerified: true as const })
}

const EXACT_ROUTE_EFFECT_CLASS = Object.freeze({
  "--check-plan-262-57-pre-execution-readiness-v1": "none",
  "--resolve-plan-262-57-pre-start-v1": "fixture-write-only",
  "--check-plan-262-57-pre-start-obstruction-v1": "none",
  "--write-execution-context-v11-receipt": "fixture-write-only",
  "--write-plan-262-57-route-start-v1": "fixture-write-only",
  "--write-headroom-preflight-v11-receipt": "injected-headroom",
  "--calibrate-parallel-v11-receipt": "injected-child-runner",
  "--write-authoritative-v12-receipt": "injected-child-runner",
  "--write-plan-262-57-terminal-v1": "fixture-write-only",
  "--check-plan-262-57-terminal-v1": "none",
} as const)

const EXACT_PRE_WRITE_FAILURES = Object.freeze({
  "--calibrate-parallel-v11-receipt":
    Object.freeze(["MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID"]),
  "--write-authoritative-v12-receipt":
    Object.freeze(["MATRIX_PLAN_262_30_CALIBRATION_INVALID"]),
  "--write-plan-262-57-terminal-v1":
    Object.freeze(["MATRIX_PLAN_262_30_CALIBRATION_INVALID"]),
  "--check-plan-262-57-terminal-v1":
    Object.freeze(["MATRIX_PLAN_262_30_TERMINAL_INVALID"]),
} as const)

export const V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS = Object.freeze([
  "authorization-bytes-root", "authorization-root", "execution-b9",
  "seal-bytes-root", "seal-root",
  "route-obstruction-metadata:--resolve-plan-262-57-pre-start-v1",
  "route-obstruction-metadata:--check-plan-262-57-pre-start-obstruction-v1",
  "route-derived-root:--resolve-plan-262-57-pre-start-v1:dispositionRoot",
  "route-derived-root:--check-plan-262-57-pre-start-obstruction-v1:dispositionRoot",
  "route-derived-root:--write-execution-context-v11-receipt:receiptRoot",
  "route-derived-root:--write-plan-262-57-route-start-v1:receiptRoot",
  "route-derived-root:--write-headroom-preflight-v11-receipt:receiptRoot",
  "route-reservation-claim:--write-execution-context-v11-receipt",
  "route-reservation-claim:--write-plan-262-57-route-start-v1",
  "route-persisted-receipt:--resolve-plan-262-57-pre-start-v1",
  "route-persisted-receipt:--write-execution-context-v11-receipt",
  "route-persisted-receipt:--write-plan-262-57-route-start-v1",
  "route-persisted-receipt:--write-headroom-preflight-v11-receipt",
  ...V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }) => `route-output:${command}`),
].sort())

/**
 * Production effect gate for one authenticated CLI route. The policy is closed:
 * it permits no path merely because the path was restored before the endpoint
 * inventory. Atomic receipt publication has one exact operation sequence; the
 * route-start reservation has one exact prefix. Content roots are bound at every
 * file-bearing step and then compared by the two-fresh custody proof.
 */
export const validateV138Plan26261RouteEffects = (entry: Readonly<{
  command: string; destination: string; sideEffect: string }>,
  operations: readonly FsOperation[], routeResult: Readonly<{
    exit: number; resultCode: string }> = { exit: 0,
      resultCode: "success_no_disposition" }, logicalReplacements:
      ReadonlyMap<string, string> = new Map()) => {
  const expectedClass = EXACT_ROUTE_EFFECT_CLASS[
    entry.command as keyof typeof EXACT_ROUTE_EFFECT_CLASS]
  if (expectedClass === undefined || entry.sideEffect !== expectedClass)
    fail("V138_PLAN_262_61_ROUTE_SIDE_EFFECT_CLASS_INVALID")
  const directory = path.posix.dirname(entry.destination)
  const basename = path.posix.basename(entry.destination)
  const temporary = `${directory}/.${basename}.<pid-random>.tmp`
  const reservationPrefix = entry.command === "--write-execution-context-v11-receipt" ||
    entry.command === "--write-plan-262-57-route-start-v1" ? [
      `mkdirSync:${ROUTE_RESERVATION_DIRECTORY}`,
      `writeFileSync:${ROUTE_RESERVATION_CLAIM}`,
    ] : []
  const publication = [
    `openSync:${temporary}`, `writeSync:${temporary}`,
    `writeFileSync:${temporary}`,
    `fsyncSync:${temporary}`, `closeSync:${temporary}`,
    `linkSync:from:${temporary}`, `linkSync:to:${entry.destination}`,
    `fsyncSync:${directory}`, `closeSync:${directory}`,
    `unlinkSync:${temporary}`, `fsyncSync:${directory}`,
    `closeSync:${directory}`,
  ]
  const publicationEffects = [
    "temporary-file-create", "content-write", "content-write",
    "durability-sync", "descriptor-close", "publication-source-link",
    "publication-destination-link", "durability-sync", "descriptor-close",
    "cleanup-delete", "durability-sync", "descriptor-close",
  ]
  const reservationEffects = reservationPrefix.length === 0 ? [] :
    ["directory-create", "content-write"]
  const identities = operations.map(operationIdentity)
  const allowedPaths = new Set([entry.destination, temporary, directory,
    ...(reservationPrefix.length === 0 ? [] :
      [ROUTE_RESERVATION_DIRECTORY, ROUTE_RESERVATION_CLAIM])])
  if (operations.some(operation => !allowedPaths.has(operation.path)))
    fail("V138_PLAN_262_61_ROUTE_FORBIDDEN_TRANSIENT_EFFECT")
  const readOnly = expectedClass === "none"
  const allowedPreWriteFailures = EXACT_PRE_WRITE_FAILURES[
    entry.command as keyof typeof EXACT_PRE_WRITE_FAILURES] ?? []
  const preWriteFailure = routeResult.exit !== 0 &&
    allowedPreWriteFailures.includes(routeResult.resultCode as never)
  if (routeResult.exit !== 0 && !preWriteFailure)
    fail("V138_PLAN_262_61_ROUTE_EFFECT_RESULT_INVALID")
  const permitted = readOnly || preWriteFailure ? [] :
    [...reservationPrefix, ...publication]
  const permittedEffects = readOnly || preWriteFailure ? [] :
    [...reservationEffects, ...publicationEffects]
  if (canonicalV138ReviewerV3(identities) !== canonicalV138ReviewerV3(permitted))
    fail("V138_PLAN_262_61_ROUTE_EFFECT_POLICY_INVALID")
  if (canonicalV138ReviewerV3(operations.map(operation => operation.sideEffect)) !==
      canonicalV138ReviewerV3(permittedEffects))
    fail("V138_PLAN_262_61_ROUTE_SIDE_EFFECT_POLICY_INVALID")
  if (operations.some(operation => operation.command !== entry.command ||
    operation.outcome !== "success" || operation.errorCode !== null))
    fail("V138_PLAN_262_61_ROUTE_EFFECT_OUTCOME_INVALID")
  const temporaryRows = operations.filter(operation => operation.path === temporary)
  const destinationRows = operations.filter(operation => operation.path === entry.destination)
  if (temporaryRows.length !== 0) {
    const contentRoot = temporaryRows.find(operation =>
      operation.operation === "writeFileSync")?.afterState.sha256
    if (!root(contentRoot) || temporaryRows.some(operation => {
      if (operation.operation === "openSync") return operation.flags !== "wx" ||
        operation.beforeState.type !== "absent" || operation.afterState.type !== "file" ||
        operation.afterState.mode !== 0o600 || operation.afterState.byteLength !== 0 ||
        operation.afterState.sha256 !== emptySha256
      if (operation.operation === "unlinkSync") return operation.beforeState.sha256 !==
        contentRoot || operation.afterState.type !== "absent"
      return operation.beforeState.type !== "file" ||
        operation.afterState.type !== "file" || operation.afterState.sha256 !== contentRoot
    }) || destinationRows.length !== 1 ||
      destinationRows[0]!.operation !== "linkSync:to" ||
      destinationRows[0]!.beforeState.type !== "absent" ||
      destinationRows[0]!.afterState.sha256 !== contentRoot)
      fail("V138_PLAN_262_61_ROUTE_EFFECT_CONTENT_INVALID")
  }
  const reservation = operations.find(operation =>
    operation.path === ROUTE_RESERVATION_CLAIM)
  if (reservation !== undefined && (reservation.operation !== "writeFileSync" ||
    reservation.beforeState.type !== "absent" ||
    reservation.afterState.type !== "file" || reservation.afterState.mode !== 0o600 ||
    !root(reservation.afterState.sha256) ||
    reservation.afterState.byteLength === undefined ||
    reservation.afterState.byteLength <= 0))
    fail("V138_PLAN_262_61_ROUTE_EFFECT_CONTENT_INVALID")
  const logicalOperations = operations.map(operation => {
    const projected = projectRouteLogicalIdentity(operation, logicalReplacements)
    const { detailRoot: _physicalDetailRoot, command: _outerCommand, ...detail } =
      projected
    return Object.freeze({ ...detail,
      detailRoot: logicalEventDetailRootV138Plan26261(detail) })
  })
  const policy = Object.freeze({ command: entry.command,
    destination: entry.destination, sideEffect: entry.sideEffect,
    routeResult, expectedDestinationChange: readOnly || preWriteFailure ?
      "unchanged" : "absent-to-durable-file",
    identities: Object.freeze(identities),
    operations: Object.freeze(logicalOperations.map(operation => Object.freeze({
      ordinal: operation.ordinal, operation: operation.operation,
      path: operation.path, sideEffect: operation.sideEffect,
      flags: operation.flags, outcome: operation.outcome,
      errorCode: operation.errorCode, beforeState: operation.beforeState,
      afterState: operation.afterState, detailRoot: operation.detailRoot }))) })
  return Object.freeze({ policy,
    effectPolicyRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(policy)) })
}

const closeBeforeInventoryOverObservedUnion = (
  before: readonly Record<string, unknown>[], operations: readonly FsOperation[]) => {
  const rows = new Map(before.map(row => [String(row.path), row]))
  for (const operation of operations) if (!rows.has(operation.path))
    rows.set(operation.path, Object.freeze({ path: operation.path,
      ...operation.beforeState }))
  return Object.freeze([...rows.values()].sort((left, right) =>
    String(left.path).localeCompare(String(right.path))))
}

type ExpectedRouteIdentities = Readonly<{ sourceA9: string;
  logicalSourceB9: string; physicalSourceB9: string;
  authorizationRoot: string; sealRoot: string }>

export const verifyV138Plan26261RouteIdentity = (input: Readonly<{
  command: string; handler: string; manifestHandler: string;
  handlerSourceRoot: string; dispatcherSourceRoot: string;
  resultCode: string; physicalOutputRoot: string; logicalOutputRoot: string;
  expected: ExpectedRouteIdentities; observed: ExpectedRouteIdentities;
  logical: ExpectedRouteIdentities }>) => {
  if (canonicalV138ReviewerV3(input.observed) !==
      canonicalV138ReviewerV3(input.expected) ||
    !V138_REVIEW_V3_ROUTE_MANIFEST.some(entry => entry.command === input.command &&
      entry.handler === input.manifestHandler) ||
    ACTUAL_HANDLER_BY_COMMAND[input.command as
      keyof typeof ACTUAL_HANDLER_BY_COMMAND] !== input.handler ||
    !root(input.handlerSourceRoot) || !root(input.dispatcherSourceRoot) ||
    !root(input.physicalOutputRoot) || !root(input.logicalOutputRoot) ||
    input.resultCode.length === 0)
    fail("V138_PLAN_262_61_ROUTE_IDENTITY_INVALID")
  const body = { schemaVersion: "v1.38-plan-262-61-physical-route-identity-v1",
    command: input.command, handler: input.handler,
    manifestHandler: input.manifestHandler,
    handlerSourceRoot: input.handlerSourceRoot,
    dispatcherSourceRoot: input.dispatcherSourceRoot,
    resultCode: input.resultCode, physicalOutputRoot: input.physicalOutputRoot,
    logicalOutputRoot: input.logicalOutputRoot, identities: input.expected }
  const physicalRouteIdentityRoot = identityRootV138ReviewerV3(
    "evidenceBundle", body.schemaVersion, body)
  const logicalBody = { ...body,
    schemaVersion: "v1.38-plan-262-61-logical-route-identity-v1",
    physicalOutputRoot: input.logicalOutputRoot, identities: input.logical }
  const logicalRouteIdentityRoot = identityRootV138ReviewerV3(
    "evidenceBundle", logicalBody.schemaVersion, logicalBody)
  return Object.freeze({ physicalRouteIdentityRoot, logicalRouteIdentityRoot,
    physicalRouteIdentityBody: Object.freeze(body),
    logicalRouteIdentityBody: Object.freeze(logicalBody) })
}

export const validateV138Plan26261RouteResult = (entry: Readonly<{
  command: string; terminalDisposition: string | null }>, exit: number,
  output: string, expected?: ExpectedRouteIdentities) => {
  if (exit !== 0) {
    if (output.length === 0 || output.length > 256 || /[\n\0]/u.test(output))
      fail("V138_PLAN_262_61_ROUTE_OUTPUT_INVALID")
    const allowedFailures: Record<string, readonly string[]> = {
      "--check-plan-262-57-pre-execution-readiness-v1": [],
      "--resolve-plan-262-57-pre-start-v1": [],
      "--check-plan-262-57-pre-start-obstruction-v1": [],
      "--write-execution-context-v11-receipt": [],
      "--write-plan-262-57-route-start-v1": [],
      "--write-headroom-preflight-v11-receipt": [],
      "--calibrate-parallel-v11-receipt":
        ["MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID"],
      "--write-authoritative-v12-receipt":
        ["MATRIX_PLAN_262_30_CALIBRATION_INVALID"],
      "--write-plan-262-57-terminal-v1":
        ["MATRIX_PLAN_262_30_CALIBRATION_INVALID"],
      "--check-plan-262-57-terminal-v1": ["MATRIX_PLAN_262_30_TERMINAL_INVALID"],
    }
    if (!allowedFailures[entry.command]?.includes(output))
      fail("V138_PLAN_262_61_ROUTE_RESULT_INVALID")
    return Object.freeze({ resultCode: output, observedDisposition:
      output === "MATRIX_ROUTE7_ADAPTER_KEY_INVENTORY_INVALID" ?
        "calibration_source_defect" : null })
  }
  if (Buffer.byteLength(output) === 0 || Buffer.byteLength(output) > 4096 ||
    /\0/u.test(output)) fail("V138_PLAN_262_61_ROUTE_OUTPUT_BOUNDS_INVALID")
  let parsed: Record<string, unknown>
  try { parsed = JSON.parse(output) as Record<string, unknown> } catch {
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_INVALID")
  }
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object" ||
    output !== `${JSON.stringify(parsed)}\n`)
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
    canonicalV138ReviewerV3(Object.keys(value).sort()) ===
      canonicalV138ReviewerV3([...keys].sort())
  const stageSchemas: Record<string, string> = {
    "--write-execution-context-v11-receipt": "v1.38-plan-262-57-route-start-v1",
    "--write-plan-262-57-route-start-v1": "v1.38-plan-262-57-route-start-v1",
    "--write-headroom-preflight-v11-receipt":
      "v1.38-current-matrix-headroom-preflight-v11",
    "--calibrate-parallel-v11-receipt": "v1.38-current-matrix-calibration-v11",
    "--write-authoritative-v12-receipt": "v1.38-current-matrix-reproduction-v12",
  }
  if (Object.hasOwn(stageSchemas, entry.command) &&
    (!exactKeys(parsed, ["disposition", "receiptRoot", "schemaVersion"]) ||
      parsed.schemaVersion !== stageSchemas[entry.command] || !root(parsed.receiptRoot)))
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  if ((entry.command === "--write-plan-262-57-terminal-v1" ||
    entry.command === "--check-plan-262-57-terminal-v1") &&
    (!exactKeys(parsed, ["disposition", "terminalRoot"]) ||
      !root(parsed.terminalRoot))) fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  if (entry.command === "--check-plan-262-57-pre-execution-readiness-v1" &&
    (!exactKeys(parsed, ["schemaVersion", "sourceA9", "sourceB9",
      "authorizationRoot", "sealRoot", "absentDestinations", "routeStarted",
      "chargedAttemptCount", "acceptedCellCount"]) ||
      parsed.schemaVersion !== "v1.38-plan-262-57-pre-execution-readiness-v1" ||
      parsed.sourceA9 !== SOURCE_A9 || !fullOid(parsed.sourceB9) ||
      !root(parsed.authorizationRoot) || !root(parsed.sealRoot) ||
      expected !== undefined && (parsed.sourceB9 !== expected.physicalSourceB9 ||
        parsed.authorizationRoot !== expected.authorizationRoot ||
        parsed.sealRoot !== expected.sealRoot) ||
      !Array.isArray(parsed.absentDestinations) || parsed.routeStarted !== false ||
      parsed.chargedAttemptCount !== 0 || parsed.acceptedCellCount !== 0))
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  if ((entry.command === "--resolve-plan-262-57-pre-start-v1" ||
    entry.command === "--check-plan-262-57-pre-start-obstruction-v1") &&
    (!exactKeys(parsed, ["schemaVersion", "obstruction", "authorizationRoot",
      "sealRoot", "routeStarted", "isRouteTerminal", "chargedAttemptCount",
      "acceptedCellCount", "authorityExpired", "noRetry", "satisfiesAdmit03",
      "downstreamAuthority", "dispositionRoot"]) ||
      parsed.schemaVersion !== "v1.38-plan-262-57-pre-start-obstruction-v1" ||
      parsed.routeStarted !== false || parsed.isRouteTerminal !== false ||
      parsed.chargedAttemptCount !== 0 || parsed.acceptedCellCount !== 0 ||
      parsed.authorityExpired !== true || parsed.noRetry !== true ||
      parsed.satisfiesAdmit03 !== false || !root(parsed.authorizationRoot) ||
      !root(parsed.sealRoot) || !root(parsed.dispositionRoot) ||
      expected !== undefined && (parsed.authorizationRoot !==
        expected.authorizationRoot || parsed.sealRoot !== expected.sealRoot) ||
      parsed.obstruction === null || typeof parsed.obstruction !== "object" ||
      Array.isArray(parsed.obstruction) || !exactKeys(parsed.obstruction as
        Record<string, unknown>, ["path", "type", "metadataRoot"])))
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  const observedDisposition = typeof parsed.disposition === "string" ?
    parsed.disposition : null
  const allowed = entry.command === "--write-headroom-preflight-v11-receipt" ?
    ["preflight_admitted"] : entry.terminalDisposition === null ? [] :
      entry.terminalDisposition.split("|")
  const requiresDisposition = Object.hasOwn(stageSchemas, entry.command) ||
    entry.command === "--write-plan-262-57-terminal-v1" ||
    entry.command === "--check-plan-262-57-terminal-v1"
  if (observedDisposition !== null && !allowed.includes(observedDisposition) ||
    entry.command === "--write-headroom-preflight-v11-receipt" &&
      observedDisposition !== "preflight_admitted" ||
    entry.terminalDisposition === null && observedDisposition !== null ||
    requiresDisposition && entry.command !== "--write-execution-context-v11-receipt" &&
      entry.command !== "--write-plan-262-57-route-start-v1" &&
      observedDisposition === null ||
    (entry.command === "--write-execution-context-v11-receipt" ||
      entry.command === "--write-plan-262-57-route-start-v1") &&
      parsed.disposition !== null)
    fail("V138_PLAN_262_61_ROUTE_DISPOSITION_INVALID")
  return Object.freeze({ resultCode: observedDisposition === null ?
    "success_no_disposition" : `success:${observedDisposition}`,
  observedDisposition })
}

/**
 * Execute the production direct-entry dispatch for every full argv. The injected
 * receipt seam is deliberately observation-only: it proves command dispatch and
 * resolves the actual exported handler function from the exact A9 source module;
 * it never writes a canonical route destination.
 */
export const observeV138Plan26261RouteDispatch = async (rootPath = repoRoot,
  options: Readonly<{ fresh?: boolean }> = {}) => {
  const physicalRoot = realpathSync(rootPath)
  if (options.fresh !== true && cachedRouteObservation?.rootPath === physicalRoot)
    return cachedRouteObservation.value
  routeExecutionHookCount += 1
  const parent = realpathSync(mkdtempSync(path.join(os.tmpdir(),
    "plan-262-61-exact-a9-")))
  activeDisposableRoots.add(parent)
  const gitConfigEnvironment = ["GIT_CONFIG_COUNT", "GIT_CONFIG_KEY_0",
    "GIT_CONFIG_VALUE_0"].map(key => [key, process.env[key]] as const)
  process.env.GIT_CONFIG_COUNT = "1"
  process.env.GIT_CONFIG_KEY_0 = "advice.detachedHead"
  process.env.GIT_CONFIG_VALUE_0 = "false"
  const templateRoot = path.join(parent, "sealed-template")
  const events: Array<{ ordinal: number; command: string; handler: string;
    event: string; path: string; result: string; physicalResult: string }> = []
  const parentStat = lstatSync(parent)
  const cleanupObservation = { complete: false, residualPaths: [parent],
    parentRoot: sha256V138ReviewerV3(parent),
    parentIdentityRoot: sha256V138ReviewerV3(`dev:${parentStat.dev}:ino:${parentStat.ino}`),
    mode: parentStat.mode & 0o777, linkCount: parentStat.nlink, byteLength: 0 }
  const routeCoverageSession = new Session()
  let routeCoverageActive = false
  let fsObserver: ReturnType<typeof installRouteFsObserver> | undefined
  try {
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", rootPath, templateRoot],
      { maxBuffer: 64 * 1024 * 1024 })
    git(templateRoot, ["checkout", "--quiet", "--detach", SOURCE_A9])
    if (git(templateRoot, ["rev-parse", "HEAD"]) !== SOURCE_A9 ||
      git(templateRoot, ["status", "--porcelain=v1"]) !== "")
      fail("V138_PLAN_262_61_EXACT_A9_CLONE_INVALID")
    routeCoverageSession.connect()
    await inspectorPost(routeCoverageSession, "Runtime.enable")
    await inspectorPost(routeCoverageSession, "Debugger.enable")
    routeCoverageActive = true
    fsObserver = installRouteFsObserver()
    const sealModule = await import("./lib/" +
      "v1-38-successor-source-seal.js") as Record<string, any>
    const routeModule = await import("./lib/" +
      "v1-38-current-matrix-reproduction.js") as Record<string, any>
    const inspectSource = sealModule["inspectV138SourceA9Custody"] as Function
    const inspectHistory = sealModule["inspectV138ProtectedHistoryV9"] as Function
    const buildAuthorization = sealModule["buildV138Plan26256AuthorizationV9"] as Function
    const buildSeal = sealModule["buildV138SuccessorSourceSealV9"] as Function
    const runReceipt = routeModule["runReceiptCli"] as Function
    if ([inspectSource, inspectHistory, buildAuthorization, buildSeal, runReceipt]
      .some(value => typeof value !== "function"))
      fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
    const dispatcherSource = Function.prototype.toString.call(runReceipt)
    const dispatcherSourceRoot = sha256V138ReviewerV3(dispatcherSource)
    const custody = inspectSource(templateRoot,
      { sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9 })
    const history = inspectHistory(templateRoot, SOURCE_A9)
    const sourcePaths = sealModule["V138_PLAN_262_60_SOURCE_PATHS"] as readonly string[]
    if (!Array.isArray(sourcePaths) || sourcePaths.length !== 4)
      fail("V138_PLAN_262_61_SHARED_SOURCE_INSPECTOR_INVALID")
    const sourceBaseBlobs = sourcePaths.map((repoPath) => {
      const entry = git(templateRoot, ["ls-tree", SOURCE_BASE9, "--", repoPath])
      if (entry === "") return { path: repoPath, mode: "deleted", blobOid: null,
        sha256: null, byteLength: 0 }
      const bytes = gitBytes(templateRoot, ["show", `${SOURCE_BASE9}:${repoPath}`])
      return { path: repoPath, mode: entry.split(/\s+/u)[0],
        blobOid: git(templateRoot, ["rev-parse", `${SOURCE_BASE9}:${repoPath}`]),
        sha256: sha256V138ReviewerV3(bytes), byteLength: bytes.byteLength }
    })
    const snapshotRoot = (records: unknown) => {
      const encoded = encodeCanonicalJson(records as never,
        { context: "canonical-manifest" })
      if (!encoded.ok) fail("V138_PLAN_262_61_SNAPSHOT_INVALID")
      return `sha256:${hashCanonicalIdentity("artifactManifest", [
        Buffer.from("v1.38-review-v3-source-snapshot-v1", "utf8"),
        encoded.bytes])}`
    }
    const reviewBody: Record<string, any> = { schemaVersion:
      "v1.38-plan-262-62-source-completeness-review-v3",
    sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9,
    sourceCustody: { tree: custody.sourceA9Tree, parent: custody.sourceA9Parent,
      authorRun: SOURCE_A9_RUN, paths: custody.sourceA9Paths,
      blobs: custody.sourceA9Blobs, deletionHistory: custody.deletionHistory },
    routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
    protectedHistory: { root: history.protectedHistoryRoot,
      protectedA8: SOURCE_A9, protectedRoots: history.protectedRoots },
    chargeIds: [5, 6, 7, 8, 9].flatMap(version => Array.from({ length: 8 },
      (_, index) => `calibration:v${version}:${index}`)),
    priorAuthorizationBytes: history.priorAuthorizationBytes,
    snapshots: [{ name: "before", inventoryRoot: snapshotRoot(sourceBaseBlobs),
      pathCount: sourceBaseBlobs.length }, { name: "after",
      inventoryRoot: snapshotRoot(custody.sourceA9Blobs),
      pathCount: custody.sourceA9Blobs.length }],
    orderedEvents: V138_REVIEW_V3_ROUTE_MANIFEST.map((entry, ordinal) => ({ ordinal,
      event: entry.handler, path: entry.destination,
      result: entry.terminalDisposition ?? "none" })),
    cleanup: { complete: true, residualPaths: [] },
    publication: { changedPaths: [V138_REVIEW_V3_CANONICAL_PATH,
      V138_REVIEW_V3_REPORT_PATH] }, verdict: { findingCount: 0,
      sourceCompletenessPassed: true, authorizesExecution: false },
    identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
      externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false, proceduralContext: "disposable fixture" } }
    const review = { ...reviewBody, reviewV3Root: computeV138ReviewV3Root(reviewBody) }
    const canonicalBytes = (value: unknown) => {
      const encoded = encodeCanonicalJson(value as never, { context: "canonical-manifest" })
      if (!encoded.ok) fail("V138_PLAN_262_61_CANONICAL_JSON_INVALID")
      return Buffer.concat([encoded.bytes, Buffer.from("\n")])
    }
    for (const [repoPath, bytes] of [[V138_REVIEW_V3_CANONICAL_PATH,
      canonicalBytes(review)], [V138_REVIEW_V3_REPORT_PATH,
      Buffer.from("# Disposable Plan 262-62 review\n")]] as const) {
      mkdirSync(path.dirname(path.join(templateRoot, repoPath)), { recursive: true })
      writeFileSync(path.join(templateRoot, repoPath), bytes, { flag: "wx" })
    }
    execFileSync("git", ["add", "--", V138_REVIEW_V3_CANONICAL_PATH,
      V138_REVIEW_V3_REPORT_PATH], { cwd: templateRoot })
    commitSynthetic(templateRoot, "test: synthetic disposable review publication")
    const publicationCommit = git(templateRoot, ["rev-parse", "HEAD"])
    const prerequisitePublication = Object.freeze({ semanticEvidenceEligible: false,
      commit: publicationCommit,
      parent: git(templateRoot, ["show", "-s", "--format=%P", publicationCommit]),
      tree: git(templateRoot, ["rev-parse", `${publicationCommit}^{tree}`]),
      changedPaths: Object.freeze(changedPaths(templateRoot, publicationCommit)),
      reviewBlob: git(templateRoot, ["rev-parse",
        `${publicationCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`]),
      reviewRoot: sha256V138ReviewerV3(canonicalBytes(review)),
      reviewByteLength: canonicalBytes(review).byteLength,
      reportBlob: git(templateRoot, ["rev-parse",
        `${publicationCommit}:${V138_REVIEW_V3_REPORT_PATH}`]),
      reportRoot: sha256V138ReviewerV3(Buffer.from("# Disposable Plan 262-62 review\n")),
      reportByteLength: Buffer.byteLength("# Disposable Plan 262-62 review\n") })
    const detachedReview = path.join(realpathSync(parent), "detached-input",
      path.basename(V138_REVIEW_V3_CANONICAL_PATH))
    const detachedBytes = canonicalBytes(review)
    if (existsSync(detachedReview)) {
      if (!readFileSync(detachedReview).equals(detachedBytes) ||
        (lstatSync(detachedReview).mode & 0o777) !== 0o444)
        fail("V138_PLAN_262_61_DETACHED_REVIEW_IDENTITY_INVALID")
    } else {
      mkdirSync(path.dirname(detachedReview), { recursive: true })
      writeFileSync(detachedReview, detachedBytes, { flag: "wx", mode: 0o444 })
    }
    const physicalAuthorization = buildAuthorization({ repoRoot: templateRoot,
      reviewV3AbsolutePath: detachedReview })
    const physicalSeal = buildSeal({ repoRoot: templateRoot,
      authorization: physicalAuthorization })
    const detachedStat = lstatSync(detachedReview)
    const physicalInput = Object.freeze({
      pathRoot: sha256V138ReviewerV3(detachedReview),
      identityRoot: sha256V138ReviewerV3(String(
        physicalAuthorization.reviewV3Input.preNoFollowIdentity)),
      authorizationRoot: physicalAuthorization.authorizationRoot,
      sealRoot: physicalSeal.sealRoot,
      regularFile: detachedStat.isFile() && !detachedStat.isSymbolicLink(),
      linkCount: detachedStat.nlink,
      mode: detachedStat.mode & 0o777,
      bytesSha256: sha256V138ReviewerV3(detachedBytes),
      byteLength: detachedBytes.byteLength,
      independentlyValidated: true as const,
    })
    if (!physicalInput.regularFile || physicalInput.linkCount !== 1 ||
      physicalInput.mode !== 0o444 ||
      physicalAuthorization.reviewV3Input.preNoFollowIdentity !==
        physicalAuthorization.reviewV3Input.postNoFollowIdentity)
      fail("V138_PLAN_262_61_DETACHED_REVIEW_IDENTITY_INVALID")
    const { authorizationRoot: _physicalAuthorizationRoot,
      ...physicalAuthorizationBody } = physicalAuthorization
    const logicalReviewInput = Object.freeze({
      ...physicalAuthorization.reviewV3Input,
      absolutePath: `/logical-custody/${path.basename(V138_REVIEW_V3_CANONICAL_PATH)}`,
      preNoFollowIdentity: `logical:file:${physicalInput.bytesSha256}:` +
        `${physicalInput.byteLength}:mode-0444:nlink-1`,
      postNoFollowIdentity: `logical:file:${physicalInput.bytesSha256}:` +
        `${physicalInput.byteLength}:mode-0444:nlink-1`,
    })
    const authorizationBody = Object.freeze({ ...physicalAuthorizationBody,
      reviewV3Input: logicalReviewInput })
    const authorization = Object.freeze({ ...authorizationBody,
      authorizationRoot: identityRootV138ReviewerV3("evidenceBundle",
        String(authorizationBody.schemaVersion), authorizationBody) })
    const { sealRoot: _physicalSealRoot, ...physicalSealBody } = physicalSeal
    const sealBody = Object.freeze({ ...physicalSealBody,
      authorizationRoot: authorization.authorizationRoot })
    const seal = Object.freeze({ ...sealBody,
      sealRoot: identityRootV138ReviewerV3("evidenceBundle",
        String(sealBody.schemaVersion), sealBody) })
    const logicalInputCustody = Object.freeze({
      schemaVersion: "v1.38-plan-262-61-logical-detached-input-custody-v1",
      canonicalPath: logicalReviewInput.absolutePath,
      regularFile: true, symlinkFree: true, linkCount: 1, mode: 0o444,
      bytesSha256: physicalInput.bytesSha256,
      byteLength: physicalInput.byteLength,
      reviewV3Root: logicalReviewInput.reviewV3Root,
      inputCommit: logicalReviewInput.inputCommit,
      inputBlob: logicalReviewInput.inputBlob,
    })
    const syntheticPaths = [
      ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
      ".planning/artifacts/v1.38-successor-source-seal-v9.json",
    ].sort()
    writeFileSync(path.join(templateRoot, syntheticPaths[0]!), canonicalBytes(authorization),
      { flag: "wx" })
    writeFileSync(path.join(templateRoot, syntheticPaths[1]!), canonicalBytes(seal),
      { flag: "wx" })
    execFileSync("git", ["add", "--", ...syntheticPaths], { cwd: templateRoot })
    commitSynthetic(templateRoot, "test: synthetic disposable B9 custody")
    const sourceB9 = git(templateRoot, ["rev-parse", "HEAD"])
    if (canonicalV138ReviewerV3(changedPaths(templateRoot, publicationCommit)) !==
        canonicalV138ReviewerV3([V138_REVIEW_V3_CANONICAL_PATH,
          V138_REVIEW_V3_REPORT_PATH].sort()) ||
      canonicalV138ReviewerV3(changedPaths(templateRoot, sourceB9)) !==
        canonicalV138ReviewerV3(syntheticPaths) ||
      git(templateRoot, ["show", "-s", "--format=%P", sourceB9]) !== publicationCommit)
      fail("V138_PLAN_262_61_SYNTHETIC_B9_CUSTODY_INVALID")
    const b9Custody = Object.freeze({ identityKind: "logical_synthetic_b9",
      commit: sourceB9,
      parent: publicationCommit,
      tree: git(templateRoot, ["rev-parse", `${sourceB9}^{tree}`]),
      changedPaths: Object.freeze(syntheticPaths),
      authorizationBlob: git(templateRoot, ["rev-parse",
        `${sourceB9}:${syntheticPaths[0]}`]),
      authorizationRoot: sha256V138ReviewerV3(canonicalBytes(authorization)),
      authorizationByteLength: canonicalBytes(authorization).byteLength,
      sealBlob: git(templateRoot, ["rev-parse", `${sourceB9}:${syntheticPaths[1]}`]),
      sealRoot: sha256V138ReviewerV3(canonicalBytes(seal)),
      sealByteLength: canonicalBytes(seal).byteLength })
    writeFileSync(path.join(templateRoot, syntheticPaths[0]!),
      canonicalBytes(physicalAuthorization))
    writeFileSync(path.join(templateRoot, syntheticPaths[1]!),
      canonicalBytes(physicalSeal))
    execFileSync("git", ["add", "--", ...syntheticPaths], { cwd: templateRoot })
    const executionTree = git(templateRoot, ["write-tree"])
    const executionSourceB9 = commitSyntheticTree(templateRoot, executionTree,
      publicationCommit, "test: independently validated physical B9 input")
    git(templateRoot, ["checkout", "--quiet", "--detach", executionSourceB9])
    if (executionSourceB9 === sourceB9 ||
      git(templateRoot, ["show", "-s", "--format=%P", executionSourceB9]) !==
        publicationCommit ||
      canonicalV138ReviewerV3(changedPaths(templateRoot, executionSourceB9)) !==
        canonicalV138ReviewerV3(syntheticPaths))
      fail("V138_PLAN_262_61_PHYSICAL_EXECUTION_B9_INVALID")
    const logicalReplacements = new Map<string, string>()
    const physicalToLogicalProjection: Array<Readonly<{ label: string;
      physical: string; logical: string; projected: boolean;
      independentlyValidated: true }>> = []
    const bindProjection = (label: string, physical: string, logical: string) => {
      if (physicalToLogicalProjection.some(entry => entry.label === label))
        fail("V138_PLAN_262_61_LOGICAL_PROJECTION_DUPLICATE")
      const present = logicalReplacements.get(physical)
      if (physical !== logical && present !== undefined && present !== logical)
        fail(`V138_PLAN_262_61_LOGICAL_PROJECTION_CONFLICT:${label}:` +
          `${physicalToLogicalProjection.find(entry => entry.physical === physical)?.label ??
            "unlabelled"}`)
      if (physical !== logical) logicalReplacements.set(physical, logical)
      physicalToLogicalProjection.push(Object.freeze({ label, physical, logical,
        projected: physical !== logical, independentlyValidated: true as const }))
    }
    bindProjection("execution-b9", executionSourceB9, sourceB9)
    bindProjection("authorization-root", physicalAuthorization.authorizationRoot,
      authorization.authorizationRoot)
    bindProjection("seal-root", physicalSeal.sealRoot, seal.sealRoot)
    bindProjection("authorization-bytes-root",
      sha256V138ReviewerV3(canonicalBytes(physicalAuthorization)),
      sha256V138ReviewerV3(canonicalBytes(authorization)))
    bindProjection("seal-bytes-root",
      sha256V138ReviewerV3(canonicalBytes(physicalSeal)),
      sha256V138ReviewerV3(canonicalBytes(seal)))
    const observations: RouteObservation[] = []
    const physicalRouteIdentityAudits: Array<Readonly<{
      command: string; physicalRouteIdentityRoot: string;
      logicalRouteIdentityRoot: string;
      physicalRouteIdentityBody: Readonly<Record<string, unknown>>;
      logicalRouteIdentityBody: Readonly<Record<string, unknown>> }>> = []
    const successfulRunner = { async run(shard: any, control: any) {
      control.onLaunch({ event: "child_launched", shardId: shard.shardId,
        laneId: shard.laneId, executionAttemptIds: shard.attempts.map(
          ({ executionAttemptId }: any) => executionAttemptId) })
      control.onResourceSample({ childId: `child:${shard.shardId}`,
        childRssKilobytes: 100, hostTotalMemoryKilobytes: 10_000,
        hostFreeMemoryKilobytes: 5_000 })
      return { shardId: shard.shardId, laneId: shard.laneId,
        classification: "success", elapsedMilliseconds: 100,
        maxRssKilobytes: 100, cleanup: { gracefulTerminationSent: false,
          forceTerminationSent: false, exitAwaited: true, orphanProcessIds: [] },
        outcomes: shard.attempts.map(({ executionAttemptId }: any) => ({
          attemptId: executionAttemptId, classification: "success", outcome: "draw" })) }
    } }
    const admittedHeadroom = async () => ({ ok: true, observation: {
      metricId: "darwin-memorystatus-effective-available-basis-points-v1",
      providerId: "apple-memory-pressure-q-v1",
      parserId: "apple-memory-pressure-q-c-locale-parser-v1",
      stdoutByteLength: 100,
      stdoutSha256: `sha256:${"0123456789abcdef".repeat(4)}`,
      totalBytes: 4096, pageCount: 1, pageSizeBytes: 4096, percentage: 25,
      observedBasisPoints: 2500, disposition: "preflight_admitted" } })
    const calibrateProduction = routeModule["calibrateV138ParallelMatrix"] as Function
    const executeProduction = routeModule["executeV138ParallelMatrix"] as Function
    const dependencies = { observeHeadroom: admittedHeadroom,
      calibrate: (input: any) => calibrateProduction({ ...input,
        runner: successfulRunner, sharedHeadroomObserver: admittedHeadroom }),
      executeMatrix: (input: any) => executeProduction({ ...input,
        runner: successfulRunner, sharedHeadroomObserver: admittedHeadroom }),
      observationProviders: { toolIdentity: () => `sha256:${"9".repeat(64)}` } }
    const routeClones = new Map<string, string>()
    const physicalObstructionInputs: Array<Readonly<{ pathRoot: string;
      identityRoot: string; bytesSha256: string; byteLength: number; mode: number;
      linkCount: number; independentlyValidated: true }>> = []
    const physicalCloneInputs = new Map<string, Readonly<{
      pathRoot: string; identityRoot: string; sourceB9: string;
      logicalSourceB9: string; mode: number; linkCount: number; byteLength: number;
      independentlyValidated: true }>>()
    const cloneFor = (group: string) => {
      const present = routeClones.get(group)
      if (present !== undefined) return present
      const cloneRoot = path.join(parent, `route-${group}`)
      if (existsSync(cloneRoot))
        fail("V138_PLAN_262_61_ROUTE_CLONE_NOT_FRESH")
      execFileSync("git", ["clone", "--quiet", "--no-hardlinks", templateRoot,
        cloneRoot], { maxBuffer: 64 * 1024 * 1024 })
      git(cloneRoot, ["checkout", "--quiet", "--detach", executionSourceB9])
      const cloneStat = lstatSync(cloneRoot)
      if (!cloneStat.isDirectory() || cloneStat.isSymbolicLink() ||
        git(cloneRoot, ["rev-parse", "HEAD"]) !== executionSourceB9 ||
        git(cloneRoot, ["status", "--porcelain=v1"]) !== "")
        fail("V138_PLAN_262_61_ROUTE_CLONE_NOT_FRESH")
      physicalCloneInputs.set(group, Object.freeze({
        pathRoot: sha256V138ReviewerV3(cloneRoot),
        identityRoot: sha256V138ReviewerV3(
          `dev:${cloneStat.dev}:ino:${cloneStat.ino}`),
        sourceB9: executionSourceB9, logicalSourceB9: sourceB9,
        mode: cloneStat.mode & 0o777, linkCount: cloneStat.nlink, byteLength: 0,
        independentlyValidated: true as const }))
      routeClones.set(group, cloneRoot)
      return cloneRoot
    }
    for (const [ordinal, entry] of V138_REVIEW_V3_ROUTE_MANIFEST.entries()) {
      const group = entry.command.includes("pre-start") ? "obstruction" :
        entry.command === "--check-plan-262-57-pre-execution-readiness-v1" ?
          "readiness" : entry.command === "--write-execution-context-v11-receipt" ?
            "alias" : "happy"
      const cloneRoot = cloneFor(group)
      if (entry.command === "--resolve-plan-262-57-pre-start-v1") {
        const obstruction = path.join(cloneRoot,
          ".planning/artifacts/v1.38-plan-262-57-route-start-v1.json")
        mkdirSync(path.dirname(obstruction), { recursive: true })
        if (!existsSync(obstruction)) {
          writeFileSync(obstruction, "{}\n", { flag: "wx" })
          const fixedFixtureTime = new Date("2000-01-01T00:00:00Z")
          utimesSync(obstruction, fixedFixtureTime, fixedFixtureTime)
        }
        const obstructionStat = lstatSync(obstruction)
        const obstructionBytes = readFileSync(obstruction)
        if (!obstructionStat.isFile() || obstructionStat.isSymbolicLink() ||
          obstructionStat.nlink !== 1 || (obstructionStat.mode & 0o777) !== 0o644 ||
          !obstructionBytes.equals(Buffer.from("{}\n")))
          fail("V138_PLAN_262_61_OBSTRUCTION_INPUT_INVALID")
        physicalObstructionInputs.push(Object.freeze({
          pathRoot: sha256V138ReviewerV3(obstruction),
          identityRoot: sha256V138ReviewerV3(
            `dev:${obstructionStat.dev}:ino:${obstructionStat.ino}:` +
            `ctime:${obstructionStat.ctimeMs}`),
          bytesSha256: sha256V138ReviewerV3(obstructionBytes),
          byteLength: obstructionBytes.byteLength,
          mode: obstructionStat.mode & 0o777,
          linkCount: obstructionStat.nlink,
          independentlyValidated: true as const }))
      }
      const actualArgv = buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9,
        executionSourceB9)
      const aliasAudit: Record<string, unknown> | null = null
      const before = routeInventory(cloneRoot)
      const beforeGit = routeGitState(cloneRoot)
      const actualHandlerName = ACTUAL_HANDLER_BY_COMMAND[entry.command as
        keyof typeof ACTUAL_HANDLER_BY_COMMAND]
      const sourceFinding = actualHandlerName === entry.handler ? null :
        "V138_PLAN_262_61_A9_CLI_MANIFEST_HANDLER_BYPASS"
      const handler = routeModule[actualHandlerName]
      if (typeof handler !== "function" || (handler as Function).name !== actualHandlerName ||
        !dispatcherSource.includes(entry.command) ||
        !dispatcherSource.includes(actualHandlerName))
        fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
      const traceKey = `__v138Plan26261Handler${ordinal}`
      ;(globalThis as Record<string, unknown>)[traceKey] = handler
      const remote = await inspectorPost<any>(routeCoverageSession,
        "Runtime.evaluate", { expression: `globalThis[${JSON.stringify(traceKey)}]` })
      const objectId = remote?.result?.objectId
      if (typeof objectId !== "string")
        fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
      const breakpoint = await inspectorPost<any>(routeCoverageSession,
        "Debugger.setBreakpointOnFunctionCall", { objectId })
      const callFrames: Array<{ functionName: string;
        location: { lineNumber: number; columnNumber: number } }> = []
      const onPaused = (message: any) => {
        const frame = message?.params?.callFrames?.[0]
        if (frame !== undefined) callFrames.push({ functionName: frame.functionName,
          location: { lineNumber: Number(frame.location?.lineNumber),
            columnNumber: Number(frame.location?.columnNumber) } })
        routeCoverageSession.post("Debugger.resume")
      }
      routeCoverageSession.on("Debugger.paused", onPaused)
      let output = ""; let exit = 0
      let fsOperations: readonly FsOperation[] = []
      fsObserver!.start(cloneRoot, entry.command)
      try {
        await runReceipt({ repoRoot: cloneRoot, argv: actualArgv, ...dependencies,
          writeOutput: (value: string) => { output += value } })
      } catch (error) {
        exit = 1
        output = error instanceof Error ? error.message : String(error)
      } finally {
        fsOperations = fsObserver!.stop()
        routeCoverageSession.off("Debugger.paused", onPaused)
        await inspectorPost(routeCoverageSession, "Debugger.removeBreakpoint",
          { breakpointId: breakpoint.breakpointId })
        delete (globalThis as Record<string, unknown>)[traceKey]
      }
      if (callFrames.length !== 1 || callFrames[0]!.functionName !== actualHandlerName)
        fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
      const handlerSource = Function.prototype.toString.call(handler)
      const handlerSourceRoot = sha256V138ReviewerV3(handlerSource)
      const expectedRouteIdentities = Object.freeze({ sourceA9: SOURCE_A9,
        logicalSourceB9: sourceB9, physicalSourceB9: executionSourceB9,
        authorizationRoot: physicalAuthorization.authorizationRoot,
        sealRoot: physicalSeal.sealRoot })
      const { resultCode, observedDisposition } =
        validateV138Plan26261RouteResult(entry, exit, output,
          expectedRouteIdentities)
      const allowedLogicalDerivedRoots = new Set<string>()
      const parsedOutput = output.startsWith("{") ?
        JSON.parse(output) as Record<string, any> : null
      let obstructionMetadataEvidence: Readonly<Record<string, unknown>> | null = null
      if (entry.command === "--resolve-plan-262-57-pre-start-v1" ||
        entry.command === "--check-plan-262-57-pre-start-obstruction-v1") {
        const physicalMetadataRoot = String(parsedOutput!.obstruction?.metadataRoot)
        const obstructionPath = String(parsedOutput!.obstruction?.path)
        const obstructionStat = lstatSync(path.resolve(cloneRoot, obstructionPath))
        const recomputedMetadataRoot = identityRootV138ReviewerV3("artifactManifest",
          "v1.38-plan-262-57-pre-start-obstruction-metadata-v1", {
            type: parsedOutput!.obstruction.type, mode: obstructionStat.mode,
            size: obstructionStat.size,
            modifiedMilliseconds: Math.trunc(obstructionStat.mtimeMs) })
        if (!root(physicalMetadataRoot) ||
          recomputedMetadataRoot !== physicalMetadataRoot)
          fail("V138_PLAN_262_61_OBSTRUCTION_INPUT_INVALID")
        obstructionMetadataEvidence = Object.freeze({ domain: "artifactManifest",
          schemaVersion: "v1.38-plan-262-57-pre-start-obstruction-metadata-v1",
          body: Object.freeze({ type: parsedOutput!.obstruction.type,
            mode: obstructionStat.mode, size: obstructionStat.size,
            modifiedMilliseconds: Math.trunc(obstructionStat.mtimeMs) }),
          physicalRoot: physicalMetadataRoot, logicalRoot: physicalMetadataRoot })
        bindProjection(`route-obstruction-metadata:${entry.command}`,
          physicalMetadataRoot, physicalMetadataRoot)
        allowedLogicalDerivedRoots.add(physicalMetadataRoot)
      }
      const derivedRoot = (() => {
        if (parsedOutput === null || exit !== 0) return null
        let rootField: string; let outputField: string
        let domain: "evidenceBundle" | "canonicalJsonProfile"
        let physicalRecord: Record<string, unknown>
        if (entry.command === "--resolve-plan-262-57-pre-start-v1" ||
          entry.command === "--check-plan-262-57-pre-start-obstruction-v1") {
          rootField = "dispositionRoot"; outputField = "dispositionRoot"
          domain = "evidenceBundle"; physicalRecord = parsedOutput
        } else if (entry.command === "--write-execution-context-v11-receipt" ||
          entry.command === "--write-plan-262-57-route-start-v1") {
          rootField = "routeStartRoot"; outputField = "receiptRoot"
          domain = "evidenceBundle"
          physicalRecord = JSON.parse(readFileSync(path.resolve(cloneRoot,
            entry.destination), "utf8")) as Record<string, unknown>
        } else if (entry.command === "--write-headroom-preflight-v11-receipt") {
          rootField = "receiptRoot"; outputField = "receiptRoot"
          domain = "canonicalJsonProfile"
          physicalRecord = JSON.parse(readFileSync(path.resolve(cloneRoot,
            entry.destination), "utf8")) as Record<string, unknown>
        } else return null
        const logicalStructure = {
          schemaVersion: "v1.38-plan-262-61-logical-derived-route-root-v1",
          destination: entry.destination,
          outputSchemaVersion: parsedOutput.schemaVersion,
          disposition: parsedOutput.disposition ?? null,
          sourceA9: SOURCE_A9, sourceB9,
          authorizationRoot: authorization.authorizationRoot,
          sealRoot: seal.sealRoot,
          ...(parsedOutput.obstruction === undefined ? {} : { obstruction: {
            path: parsedOutput.obstruction.path, type: parsedOutput.obstruction.type,
            metadataRoot: parsedOutput.obstruction.metadataRoot } }),
        }
        const verified = verifyAndProjectV138Plan26261DerivedRouteRoot({ domain,
          rootField, physicalRecord,
          physicalOutputRoot: String(parsedOutput[outputField]),
          logicalSchemaVersion:
            "v1.38-plan-262-61-logical-derived-route-root-v1",
          logicalStructure })
        bindProjection(`route-derived-root:${entry.command}:${outputField}`,
          verified.physicalRoot, verified.logicalRoot)
        allowedLogicalDerivedRoots.add(verified.logicalRoot)
        return Object.freeze({ ...verified, physicalRecord, rootField,
          outputField, domain, logicalSchemaVersion:
            "v1.38-plan-262-61-logical-derived-route-root-v1",
          logicalStructure })
      })()
      const logicalOutput = projectRouteLogicalIdentity(output, logicalReplacements)
      auditLogicalRouteOutput(entry, logicalOutput, allowedLogicalDerivedRoots)
      const physicalOutputRoot = sha256V138ReviewerV3(output)
      const logicalOutputRoot = sha256V138ReviewerV3(logicalOutput)
      bindProjection(`route-output:${entry.command}`, physicalOutputRoot,
        logicalOutputRoot)
      const routeIdentity = verifyV138Plan26261RouteIdentity({
        command: entry.command, handler: actualHandlerName,
        manifestHandler: entry.handler, handlerSourceRoot, dispatcherSourceRoot,
        resultCode, physicalOutputRoot, logicalOutputRoot,
        expected: expectedRouteIdentities, observed: expectedRouteIdentities,
        logical: { sourceA9: SOURCE_A9, logicalSourceB9: sourceB9,
          physicalSourceB9: sourceB9,
          authorizationRoot: authorization.authorizationRoot,
          sealRoot: seal.sealRoot } })
      physicalRouteIdentityAudits.push(Object.freeze({ command: entry.command,
        physicalRouteIdentityRoot: routeIdentity.physicalRouteIdentityRoot,
        logicalRouteIdentityRoot: routeIdentity.logicalRouteIdentityRoot,
        physicalRouteIdentityBody: routeIdentity.physicalRouteIdentityBody,
        logicalRouteIdentityBody: routeIdentity.logicalRouteIdentityBody }))
      if (derivedRoot !== null && entry.sideEffect !== "none") {
        const destinationBytes = readFileSync(path.resolve(cloneRoot,
          entry.destination))
        const destinationStat = lstatSync(path.resolve(cloneRoot,
          entry.destination))
        const destinationOperation = fsOperations.find(operation =>
          operation.path === entry.destination &&
          operation.operation === "linkSync:to")
        if (destinationOperation?.afterState.type !== "file" ||
          destinationOperation.afterState.sha256 !==
            sha256V138ReviewerV3(destinationBytes) ||
          destinationOperation.afterState.byteLength !== destinationBytes.byteLength)
          fail("V138_PLAN_262_61_PERSISTED_FILE_EVENT_REFERENCE_INVALID")
        if (entry.command === "--resolve-plan-262-57-pre-start-v1")
          routeModule["checkV138Plan26257PreStartObstructionV1"](
            derivedRoot.physicalRecord)
        else if (entry.command === "--write-execution-context-v11-receipt" ||
          entry.command === "--write-plan-262-57-route-start-v1")
          routeModule["checkV138Plan26257RouteStartV1"](
            derivedRoot.physicalRecord)
        else if (entry.command === "--write-headroom-preflight-v11-receipt") {
          const routeStart = JSON.parse(readFileSync(path.resolve(cloneRoot,
            V138_REVIEW_V3_ROUTE_MANIFEST.find(candidate => candidate.command ===
              "--write-plan-262-57-route-start-v1")!.destination), "utf8"))
          routeModule["checkV138HostHeadroomPreflightV11Receipt"](
            derivedRoot.physicalRecord, routeStart.context)
        }
        const logicalPersistedRecord = physicalOutputRoot ===
          sha256V138ReviewerV3(destinationBytes) ?
          JSON.parse(logicalOutput) as Record<string, unknown> : {
          schemaVersion: "v1.38-plan-262-61-logical-persisted-route-file-v1",
          destination: entry.destination,
          physicalSchemaVersion: derivedRoot.physicalRecord.schemaVersion,
          logicalDerivedRoot: derivedRoot.logicalRoot,
          disposition: parsedOutput!.disposition ?? null,
          sourceA9: SOURCE_A9, sourceB9,
          authorizationRoot: authorization.authorizationRoot,
          sealRoot: seal.sealRoot,
        }
        const expectedPersistedKeys = entry.command ===
          "--resolve-plan-262-57-pre-start-v1" ? ["schemaVersion", "obstruction",
            "authorizationRoot", "sealRoot", "routeStarted", "isRouteTerminal",
            "chargedAttemptCount", "acceptedCellCount", "authorityExpired", "noRetry",
            "satisfiesAdmit03", "downstreamAuthority", "dispositionRoot"] :
          entry.command === "--write-headroom-preflight-v11-receipt" ?
            ["schemaVersion", "sourceA9", "sourceB9", "executionContextRoot",
              "authorizationRoot", "sealRoot", "chargedIdentityId", "metricId",
              "providerId", "parserId", "requiredHostHeadroomBasisPoints",
              "observation", "disposition", "acceptedCellCount", "noRetry",
              "receiptRoot"] :
            ["schemaVersion", "routeOrdinal", "context", "executionContextRoot",
              "preflightConsumption", "preflightConsumptionRoot", "reservationRoot",
              "routeStarted", "acceptedCellCount", "noRetry", "routeStartRoot"]
        const persisted = verifyAndProjectV138Plan26261PersistedRouteFile({
          destination: entry.destination, expectedDestination: entry.destination,
          physicalBytes: destinationBytes,
          physicalSha256: destinationOperation.afterState.sha256,
          physicalByteLength: destinationOperation.afterState.byteLength!,
          physicalMode: destinationStat.mode & 0o777,
          expectedKeys: expectedPersistedKeys,
          embeddedRoots: {
            [derivedRoot.rootField]: derivedRoot.physicalRoot,
            ...(derivedRoot.physicalRecord.sourceB9 === undefined ? {} :
              { sourceB9: executionSourceB9 }),
            ...(derivedRoot.physicalRecord.authorizationRoot === undefined ? {} :
              { authorizationRoot: physicalAuthorization.authorizationRoot }),
            ...(derivedRoot.physicalRecord.sealRoot === undefined ? {} :
              { sealRoot: physicalSeal.sealRoot }),
          }, logicalRecord: logicalPersistedRecord,
        })
        bindProjection(`route-persisted-receipt:${entry.command}`,
          persisted.physicalSha256, persisted.logicalSha256)

        if (entry.command === "--write-execution-context-v11-receipt" ||
          entry.command === "--write-plan-262-57-route-start-v1") {
          const claimBytes = readFileSync(path.resolve(cloneRoot,
            ROUTE_RESERVATION_CLAIM))
          const claimStat = lstatSync(path.resolve(cloneRoot,
            ROUTE_RESERVATION_CLAIM))
          const claimOperation = fsOperations.find(operation =>
            operation.path === ROUTE_RESERVATION_CLAIM &&
            operation.operation === "writeFileSync")
          if (claimOperation?.afterState.type !== "file" ||
            claimOperation.afterState.sha256 !== sha256V138ReviewerV3(claimBytes) ||
            claimOperation.afterState.byteLength !== claimBytes.byteLength)
            fail("V138_PLAN_262_61_PERSISTED_FILE_EVENT_REFERENCE_INVALID")
          const physicalClaim = JSON.parse(claimBytes.toString("utf8")) as
            Record<string, unknown>
          const physicalContext = (derivedRoot.physicalRecord.context ?? {}) as
            Record<string, unknown>
          const reservationBody = {
            schemaVersion: "v1.38-plan-262-57-route-reservation-v1",
            sourceA9: SOURCE_A9, sourceB9: executionSourceB9,
            authorizationRoot: physicalAuthorization.authorizationRoot,
            sealRoot: physicalSeal.sealRoot,
            executionContextRoot: physicalContext.receiptRoot,
          }
          const physicalReservationRoot = identityRootV138ReviewerV3(
            "containmentPolicy", String(reservationBody.schemaVersion),
            reservationBody)
          if (physicalClaim.reservationRoot !== physicalReservationRoot ||
            derivedRoot.physicalRecord.reservationRoot !== physicalReservationRoot)
            fail("V138_PLAN_262_61_RESERVATION_ROOT_INVALID")
          const logicalClaimBody = {
            schemaVersion: "v1.38-plan-262-57-route-reservation-v1",
            sourceA9: SOURCE_A9, sourceB9,
            authorizationRoot: authorization.authorizationRoot,
            sealRoot: seal.sealRoot,
            executionContextRoot: identityRootV138ReviewerV3("evidenceBundle",
              "v1.38-plan-262-61-logical-execution-context-root-v1", {
                destination: entry.destination, sourceA9: SOURCE_A9, sourceB9,
                authorizationRoot: authorization.authorizationRoot,
                sealRoot: seal.sealRoot,
              }),
          }
          const logicalClaim = { ...logicalClaimBody,
            reservationRoot: identityRootV138ReviewerV3("containmentPolicy",
              logicalClaimBody.schemaVersion, logicalClaimBody) }
          const claim = verifyAndProjectV138Plan26261PersistedRouteFile({
            destination: ROUTE_RESERVATION_CLAIM,
            expectedDestination: ROUTE_RESERVATION_CLAIM,
            physicalBytes: claimBytes,
            physicalSha256: claimOperation.afterState.sha256,
            physicalByteLength: claimOperation.afterState.byteLength!,
            physicalMode: claimStat.mode & 0o777,
            expectedKeys: ["schemaVersion", "sourceA9", "sourceB9",
              "authorizationRoot", "sealRoot", "executionContextRoot",
              "reservationRoot"],
            embeddedRoots: {
              sourceB9: executionSourceB9,
              authorizationRoot: physicalAuthorization.authorizationRoot,
              sealRoot: physicalSeal.sealRoot,
              executionContextRoot: String(physicalContext.receiptRoot),
              reservationRoot: physicalReservationRoot,
            }, logicalRecord: logicalClaim,
          })
          bindProjection(`route-reservation-claim:${entry.command}`,
            claim.physicalSha256, claim.logicalSha256)
        }
      }
      for (const operation of fsOperations) {
        const { command: _command, detailRoot, ...retainedDetail } = operation
        if (detailRoot !== physicalEventDetailRootV138Plan26261(retainedDetail))
          fail("V138_PLAN_262_61_PHYSICAL_EVENT_DETAIL_ROOT_INVALID")
        const writtenSha = operation.afterState.type === "file" &&
          ["content-write", "publication-destination-link", "durability-sync",
            "descriptor-close", "publication-source-link"].includes(
              operation.sideEffect) ? operation.afterState.sha256 : undefined
        if (writtenSha !== undefined && writtenSha !== emptySha256 &&
          !logicalReplacements.has(writtenSha))
          fail("V138_PLAN_262_61_PERSISTED_FILE_PROJECTION_MISSING")
      }
      const effects = validateV138Plan26261RouteEffects(entry, fsOperations,
        { exit, resultCode }, logicalReplacements)
      for (const operation of effects.policy.operations) {
        const { detailRoot, ...retainedDetail } = operation
        if (detailRoot !== logicalEventDetailRootV138Plan26261(retainedDetail))
          fail("V138_PLAN_262_61_LOGICAL_EVENT_DETAIL_ROOT_INVALID")
      }
      const eventPaths = [...new Set(fsOperations.map(({ path: repoPath }) =>
        repoPath))].sort()
      const closedBefore = closeBeforeInventoryOverObservedUnion(before, fsOperations)
      const after = routeInventory(cloneRoot, eventPaths)
      const afterGit = routeGitState(cloneRoot)
      if (beforeGit.head !== afterGit.head || beforeGit.tree !== afterGit.tree ||
        beforeGit.refsRoot !== afterGit.refsRoot ||
        beforeGit.indexRoot !== afterGit.indexRoot)
        fail("V138_PLAN_262_61_ROUTE_GIT_STATE_INVALID")
      const physicalChangedPaths = inventoryChangedPaths(closedBefore, after)
      const changedLocations = projectV138Plan26261ChangedLocations(cloneRoot,
        physicalChangedPaths)
      const logicalBefore = projectRouteLogicalIdentity(closedBefore,
        logicalReplacements)
      const logicalAfter = projectRouteLogicalIdentity(after, logicalReplacements)
      const functionRangeRoot = sha256V138ReviewerV3(canonicalV138ReviewerV3({
        functionName: actualHandlerName, handlerSourceRoot,
        startByteOffset: 0, endByteOffset: Buffer.byteLength(handlerSource) }))
      const callCount = callFrames.length
      const trace = { command: entry.command, handler: actualHandlerName, callCount }
      observations.push(Object.freeze({ command: entry.command,
        handler: actualHandlerName, manifestHandler: entry.handler, aliasAudit,
        sourceFinding,
        destination: entry.destination,
        argv: projectRouteLogicalIdentity(actualArgv, logicalReplacements), exit,
        outputRoot: logicalOutputRoot,
        resultCode: projectRouteLogicalIdentity(resultCode, logicalReplacements),
        observedDisposition, outputByteLength: Buffer.byteLength(logicalOutput),
        handlerSourceRoot, dispatcherSourceRoot,
        functionRangeRoot, callCount,
        callTraceRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(trace)),
        effectPolicyRoot: effects.effectPolicyRoot,
        routeIdentityRoot: routeIdentity.logicalRouteIdentityRoot,
        beforeRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
          { inventory: logicalBefore, statusRoot: beforeGit.statusRoot })),
        afterRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
          { inventory: logicalAfter, statusRoot: afterGit.statusRoot })),
        beforePathCount: closedBefore.length, afterPathCount: after.length,
        eventPaths: Object.freeze(eventPaths), changedLocations }))
      for (const [operationIndex, operation] of effects.policy.operations.entries()) {
        const physicalOperation = fsOperations[operationIndex] ??
          fail("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID")
        const operationPreimage = (value: FsOperation) => canonicalV138ReviewerV3({
          ordinal: value.ordinal, operation: value.operation,
          path: value.path, sideEffect: value.sideEffect, flags: value.flags,
          outcome: value.outcome, errorCode: value.errorCode,
          beforeState: value.beforeState, afterState: value.afterState,
          detailRoot: value.detailRoot })
        const logicalOperationPreimage = operationPreimage(operation)
        const physicalOperationPreimage = operationPreimage(physicalOperation)
        verifyV138Plan26261PhysicalLogicalEventPreimages({
          physicalResultPreimage: physicalOperationPreimage,
          logicalResultPreimage: logicalOperationPreimage,
          location: operation.path, operation: operation.operation,
          replacements: logicalReplacements })
        events.push({ ordinal: events.length,
        command: entry.command, handler: actualHandlerName,
        event: `${entry.command}:${operation.operation}`, path: operation.path,
        result: logicalOperationPreimage,
        physicalResult: physicalOperationPreimage })
      }
      const executionResult = canonicalV138ReviewerV3({ exit,
        resultCode, observedDisposition, sourceFinding, changedLocations,
        handlerSourceRoot, dispatcherSourceRoot,
        physicalOutputText: output, logicalOutputText: logicalOutput,
        physicalOutputRoot, logicalOutputRoot,
        projectionTuples: physicalToLogicalProjection.filter(({ label }) =>
          projectionCommand(label) === entry.command).map(({ label, physical,
            logical }) => ({ label, physical, logical })),
        obstructionMetadataEvidence,
        derivedRootEvidence: derivedRoot === null ? null : {
          domain: derivedRoot.domain, rootField: derivedRoot.rootField,
          physicalRecord: derivedRoot.physicalRecord,
          physicalRoot: derivedRoot.physicalRoot,
          logicalSchemaVersion: derivedRoot.logicalSchemaVersion,
          logicalStructure: derivedRoot.logicalStructure,
          logicalRoot: derivedRoot.logicalRoot } })
      const logicalExecutionResult = canonicalV138ReviewerV3(
        projectV138Plan26261LogicalExecutionResult(JSON.parse(executionResult),
          logicalReplacements))
      events.push({ ordinal: events.length, command: entry.command,
        handler: actualHandlerName, event: `execute:${actualHandlerName}`,
        path: entry.destination, result: logicalExecutionResult,
        physicalResult: executionResult })
    }
    const postRoot = path.join(parent, "post-execution-publication")
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", templateRoot,
      postRoot], { maxBuffer: 64 * 1024 * 1024 })
    git(postRoot, ["checkout", "--quiet", "--detach", SOURCE_A9])
    const logicalPostEvents = Object.freeze(events.map(
      ({ physicalResult: _physicalResult, ...logicalEvent }) =>
        Object.freeze(logicalEvent)))
    const postEvidence = { schemaVersion:
      "v1.38-plan-262-61-post-execution-synthetic-publication-v1",
    sourceA9: SOURCE_A9, semanticEvidenceEligible: false,
    observations: observations.map(({ command, handler, exit, resultCode,
      observedDisposition, callTraceRoot, beforeRoot, afterRoot, changedLocations }) =>
      ({ command, handler, exit, resultCode, observedDisposition, callTraceRoot,
        beforeRoot, afterRoot, changedLocations })), orderedEvents: events }
    const logicalPostEvidence = { ...postEvidence, orderedEvents: logicalPostEvents }
    const postReviewBytes = canonicalBytes(postEvidence)
    const logicalPostReviewBytes = canonicalBytes(logicalPostEvidence)
    const postReportBytes = Buffer.from("# Post-execution synthetic publication\n\n" +
      "Not eligible as semantic or canonical review evidence.\n")
    writeFileSync(path.join(postRoot, V138_REVIEW_V3_CANONICAL_PATH), postReviewBytes,
      { flag: "wx" })
    writeFileSync(path.join(postRoot, V138_REVIEW_V3_REPORT_PATH), postReportBytes,
      { flag: "wx" })
    execFileSync("git", ["add", "--", V138_REVIEW_V3_CANONICAL_PATH,
      V138_REVIEW_V3_REPORT_PATH], { cwd: postRoot })
    commitSynthetic(postRoot, "test: post-execution synthetic publication")
    const postCommit = git(postRoot, ["rev-parse", "HEAD"])
    const postExecutionPublication = Object.freeze({ semanticEvidenceEligible: false,
      commit: postCommit, parent: git(postRoot, ["show", "-s", "--format=%P",
        postCommit]), tree: git(postRoot, ["rev-parse", `${postCommit}^{tree}`]),
      changedLocations: projectV138Plan26261ChangedLocations(postRoot,
        changedPaths(postRoot, postCommit)),
      reviewBlob: git(postRoot, ["rev-parse",
        `${postCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`]),
      reviewRoot: sha256V138ReviewerV3(postReviewBytes),
      reviewByteLength: postReviewBytes.byteLength,
      reportBlob: git(postRoot, ["rev-parse",
        `${postCommit}:${V138_REVIEW_V3_REPORT_PATH}`]),
      reportRoot: sha256V138ReviewerV3(postReportBytes),
      reportByteLength: postReportBytes.byteLength })
    const logicalPublicationBody = Object.freeze({ schemaVersion:
      "v1.38-plan-262-61-logical-post-execution-publication-v1",
    identityKind: "logical_synthetic_publication",
    semanticEvidenceEligible: false,
    changedLocations: Object.freeze([V138_REVIEW_V3_CANONICAL_PATH,
      V138_REVIEW_V3_REPORT_PATH]),
    reviewBlobRoot: identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-logical-review-blob-v1", {
        path: V138_REVIEW_V3_CANONICAL_PATH,
        bytesRoot: sha256V138ReviewerV3(logicalPostReviewBytes),
        byteLength: logicalPostReviewBytes.byteLength }),
    reportBlobRoot: identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-logical-report-blob-v1", {
        path: V138_REVIEW_V3_REPORT_PATH,
        bytesRoot: sha256V138ReviewerV3(postReportBytes),
        byteLength: postReportBytes.byteLength }),
    semanticRoot: identityRootV138ReviewerV3("evidenceBundle",
      "v1.38-plan-262-61-logical-post-execution-semantics-v1",
      logicalPostEvidence) })
    const logicalPublicationTreeRoot = identityRootV138ReviewerV3(
      "artifactManifest",
        "v1.38-plan-262-61-logical-publication-tree-v1", {
          changedLocations: logicalPublicationBody.changedLocations,
          reviewBlobRoot: logicalPublicationBody.reviewBlobRoot,
          reportBlobRoot: logicalPublicationBody.reportBlobRoot })
    const logicalPostExecutionPublication = Object.freeze({
      ...logicalPublicationBody,
      treeRoot: logicalPublicationTreeRoot,
      publicationIdentityRoot: identityRootV138ReviewerV3("evidenceBundle",
        "v1.38-plan-262-61-logical-publication-identity-v1",
        { ...logicalPublicationBody, treeRoot: logicalPublicationTreeRoot }) })
    const observedPathUnion = [...new Set(observations.flatMap(observation =>
      observation.eventPaths))].sort()
    const snapshots = Object.freeze([{ name: "before", inventoryRoot:
      sha256V138ReviewerV3(canonicalV138ReviewerV3(observations.map(
        ({ command, beforeRoot }) => ({ command, inventoryRoot: beforeRoot })))),
    pathCount: new Set(completeRouteInventoryPaths(templateRoot)).size },
    { name: "after", inventoryRoot:
      sha256V138ReviewerV3(canonicalV138ReviewerV3({ observations: observations.map(
        ({ command, afterRoot }) => ({ command, inventoryRoot: afterRoot })),
      observedPathUnion })),
    pathCount: new Set([...completeRouteInventoryPaths(templateRoot),
      ...observedPathUnion]).size }])
    const sortedProjection = [...physicalToLogicalProjection].sort((left, right) =>
      left.label.localeCompare(right.label))
    if (canonicalV138ReviewerV3(sortedProjection.map(({ label }) => label)) !==
      canonicalV138ReviewerV3(V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS))
      fail("V138_PLAN_262_61_LOGICAL_PROJECTION_INCOMPLETE")
    const value = Object.freeze({ sourceB9, publicationCommit,
      cloneHead: git(templateRoot, ["rev-parse", "HEAD"]),
      observations: Object.freeze(observations), events: Object.freeze(events),
      snapshots,
      cleanup: cleanupObservation,
      syntheticPrerequisitePublication: prerequisitePublication,
      postExecutionPublication,
      logicalPostExecutionPublication,
      physicalIsolation: Object.freeze({
        identityKind: "physical_execution_b9",
        detachedInput: physicalInput, executionSourceB9,
        obstructionInputs: Object.freeze(physicalObstructionInputs),
        routeClones: Object.freeze([...physicalCloneInputs.entries()].map(
          ([group, proof]) => Object.freeze({ group, ...proof })).sort((left, right) =>
          left.group.localeCompare(right.group))),
        routeIdentityAudits: Object.freeze(physicalRouteIdentityAudits),
        physicalToLogicalProjection: Object.freeze(sortedProjection
          .map((entry, ordinal) => Object.freeze({ ordinal, ...entry }))) }),
      logicalInputCustody,
      b9Custody,
      b9ChangedPaths: Object.freeze(syntheticPaths) })
    if (options.fresh !== true) cachedRouteObservation = { rootPath: physicalRoot, value }
    return value
  } finally {
    fsObserver?.restore()
    if (routeCoverageActive) {
      await inspectorPost(routeCoverageSession, "Debugger.disable")
      await inspectorPost(routeCoverageSession, "Runtime.disable")
      routeCoverageSession.disconnect()
    }
    rmSync(parent, { recursive: true, force: true })
    activeDisposableRoots.delete(parent)
    for (const [key, value] of gitConfigEnvironment) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    if (existsSync(parent)) fail("V138_PLAN_262_61_DISPOSABLE_CLEANUP_INVALID")
    cleanupObservation.complete = true
    cleanupObservation.residualPaths = []
  }
}

export const validateV138Plan26261FreshRoutePairIsolation = (left: any,
  right: any) => {
  const leftCloneProofs = left.physicalIsolation.routeClones as readonly any[]
  const rightCloneProofs = right.physicalIsolation.routeClones as readonly any[]
  const leftProjection = left.physicalIsolation.physicalToLogicalProjection as
    readonly any[]
  const rightProjection = right.physicalIsolation.physicalToLogicalProjection as
    readonly any[]
  const leftObstructions = left.physicalIsolation.obstructionInputs as readonly any[]
  const rightObstructions = right.physicalIsolation.obstructionInputs as readonly any[]
  let issue: string | null = null
  if (!left.cleanup.complete || !right.cleanup.complete ||
    left.cleanup.residualPaths.length !== 0 || right.cleanup.residualPaths.length !== 0)
    issue = "cleanup"
  else if (left.physicalIsolation.detachedInput.independentlyValidated !== true ||
    right.physicalIsolation.detachedInput.independentlyValidated !== true)
    issue = "detached-validation"
  else if (left.physicalIsolation.detachedInput.pathRoot ===
    right.physicalIsolation.detachedInput.pathRoot) issue = "detached-path-reuse"
  else if (left.physicalIsolation.detachedInput.identityRoot ===
    right.physicalIsolation.detachedInput.identityRoot) issue = "detached-inode-reuse"
  else if (left.physicalIsolation.identityKind !== "physical_execution_b9" ||
    right.physicalIsolation.identityKind !== "physical_execution_b9" ||
    left.b9Custody.identityKind !== "logical_synthetic_b9" ||
    right.b9Custody.identityKind !== "logical_synthetic_b9") issue = "identity-kind"
  else if (left.physicalIsolation.executionSourceB9 === left.sourceB9 ||
    right.physicalIsolation.executionSourceB9 === right.sourceB9)
    issue = "physical-logical-b9-alias"
  else if (leftCloneProofs.length === 0 ||
    leftCloneProofs.length !== rightCloneProofs.length) issue = "clone-count"
  else {
    const cloneIssue = leftCloneProofs.findIndex((leftProof, index) =>
      leftProof.independentlyValidated !== true ||
      rightCloneProofs[index]?.independentlyValidated !== true ||
      leftProof.group !== rightCloneProofs[index]?.group ||
      leftProof.pathRoot === rightCloneProofs[index]?.pathRoot ||
      leftProof.identityRoot === rightCloneProofs[index]?.identityRoot)
    if (cloneIssue !== -1) issue = `clone-${cloneIssue}`
  }
  if (issue === null && (leftObstructions.length !== 1 ||
    rightObstructions.length !== 1)) issue = "obstruction-count"
  if (issue === null && (leftObstructions[0]!.independentlyValidated !== true ||
    rightObstructions[0]!.independentlyValidated !== true ||
    leftObstructions[0]!.pathRoot === rightObstructions[0]!.pathRoot ||
    leftObstructions[0]!.identityRoot === rightObstructions[0]!.identityRoot ||
    leftObstructions[0]!.bytesSha256 !== rightObstructions[0]!.bytesSha256 ||
    leftObstructions[0]!.byteLength !== rightObstructions[0]!.byteLength ||
    leftObstructions[0]!.mode !== rightObstructions[0]!.mode))
    issue = "obstruction-physical-custody"
  if (issue === null && (leftProjection.length === 0 ||
    leftProjection.length !== rightProjection.length)) issue = "projection-count"
  if (issue === null && (canonicalV138ReviewerV3(leftProjection.map(
    ({ label }) => label)) !== canonicalV138ReviewerV3(
      V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS) ||
    canonicalV138ReviewerV3(rightProjection.map(({ label }) => label)) !==
      canonicalV138ReviewerV3(V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS)))
    issue = "projection-labels"
  if (issue === null) {
    const projectionIssues: string[] = []
    leftProjection.forEach((entry, index) => {
      const repeated = rightProjection[index]
      const label = String(entry.label)
      if (entry.ordinal !== index || repeated?.ordinal !== index)
        projectionIssues.push(`${label}:ordinal`)
      if (entry.label !== repeated?.label) projectionIssues.push(`${label}:label`)
      if (entry.independentlyValidated !== true ||
        repeated?.independentlyValidated !== true)
        projectionIssues.push(`${label}:validation`)
      if (entry.projected !== (entry.physical !== entry.logical) ||
        repeated?.projected !== (repeated?.physical !== repeated?.logical) ||
        entry.projected !== repeated?.projected)
        projectionIssues.push(`${label}:projection-state`)
      if (entry.projected && entry.physical === repeated?.physical ||
        !entry.projected && entry.physical !== repeated?.physical)
        projectionIssues.push(`${label}:physical`)
      if (entry.logical !== repeated?.logical)
        projectionIssues.push(`${label}:logical`)
    })
    if (projectionIssues.length !== 0)
      issue = `projection[${projectionIssues.slice(0, 8).join(",")}]`
  }
  if (issue !== null)
    fail(`V138_PLAN_262_61_FRESH_DERIVATION_ISOLATION_INVALID:${issue}`)
  return true
}

export const observeV138Plan26261RouteDispatchPair = async (rootPath = repoRoot) => {
  const left = await observeV138Plan26261RouteDispatch(rootPath, { fresh: true })
  const right = await observeV138Plan26261RouteDispatch(rootPath, { fresh: true })
  validateV138Plan26261FreshRoutePairIsolation(left, right)
  return Object.freeze({ left, right })
}

export const deriveV138Plan26261NoPublish = async (rootPath = repoRoot) => {
  candidateDerivationHookCount += 1
  if (lstatSync(rootPath).isSymbolicLink())
    fail("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  const source = inspectV138Plan26261A9Custody(rootPath)
  const predecessors = inspectV138Plan26261Predecessors(rootPath)
  const convergence = inspectV138Plan26261SummaryConvergence(rootPath)
  const protectedHistory = inspectV138Plan26261ProtectedHistory(rootPath)
  const lifecycle = inspectV138Plan26261Lifecycle(rootPath)
  const present = FORBIDDEN_DESTINATIONS.filter((repoPath) =>
    existsSync(path.resolve(rootPath, repoPath)))
  if (present.length !== 0) fail("V138_PLAN_262_61_CANONICAL_DESTINATION_PRESENT")
  const routeExecution = await observeV138Plan26261RouteDispatch(rootPath)
  const sealModule = await import("./lib/" + "v1-38-successor-source-seal.js") as
    Record<string, unknown>
  const inspectSource = sealModule["inspectV138SourceA9Custody"] as
    (rootPath: string, value: Record<string, unknown>) => Record<string, any>
  if (typeof inspectSource !== "function")
    fail("V138_PLAN_262_61_SHARED_SOURCE_INSPECTOR_INVALID")
  const sourceA9 = inspectSource(rootPath,
    { sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9 })
  const sourceCustody = { tree: sourceA9.sourceA9Tree, parent: sourceA9.sourceA9Parent,
    authorRun: SOURCE_A9_RUN, paths: sourceA9.sourceA9Paths,
    blobs: sourceA9.sourceA9Blobs, deletionHistory: sourceA9.deletionHistory }
  const snapshots = routeExecution.snapshots
  const protectedObservation = { root: protectedHistory.protectedHistoryRoot,
    protectedA8: SOURCE_A9, protectedRoots: protectedHistory.protectedRoots }
  const routeFindings = routeExecution.observations.filter(
    ({ exit, sourceFinding }: RouteObservation) => exit !== 0 || sourceFinding !== null)
  if (routeFindings.length !== 0) {
    return Object.freeze({ schemaVersion:
      "v1.38-plan-262-61-reviewer-v3-no-publish-v2", source, predecessors,
    convergence, protectedHistory, lifecycle,
    commands: routeExecution.observations,
    reviewDocument: null, reviewBlocked: true,
    findingCount: routeFindings.length, sourceCompletenessPassed: false,
    findings: Object.freeze(routeFindings.map(({ command, handler, destination,
      exit, sourceFinding, outputRoot, resultCode, observedDisposition, callTraceRoot,
      beforeRoot, afterRoot, changedLocations }: RouteObservation) =>
      Object.freeze({ command, handler, destination, exit, sourceFinding, outputRoot,
        resultCode, observedDisposition, callTraceRoot, beforeRoot, afterRoot,
        changedLocations }))),
    syntheticB9: { sourceB9: routeExecution.sourceB9,
      changedPaths: routeExecution.b9ChangedPaths },
    forbiddenDestinations: FORBIDDEN_DESTINATIONS,
    publishesCanonicalReview: false, authorizesExecution: false,
    identityClaims: Object.freeze({ independentPersonClaimed: false,
      reviewerSeparated: false, externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false }) })
  }
  const body: Record<string, unknown> = { schemaVersion:
    "v1.38-plan-262-62-source-completeness-review-v3",
  sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9, sourceCustody,
  routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST, protectedHistory: protectedObservation,
  chargeIds: protectedHistory.chargeIds,
  priorAuthorizationBytes: protectedHistory.authorizations, snapshots,
  orderedEvents: routeExecution.events, cleanup: { complete: true, residualPaths: [] },
  publication: { changedPaths: [V138_REVIEW_V3_CANONICAL_PATH,
    V138_REVIEW_V3_REPORT_PATH] }, verdict: { findingCount: 0,
    sourceCompletenessPassed: true, authorizesExecution: false },
  identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
    externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
    independentCustodyClaimed: false, proceduralContext:
      "main-orchestrator procedural review; no person or custody claim" } }
  const document = { ...body, reviewV3Root: computeV138ReviewV3Root(body) }
  validateV138ReviewV3Document(document)
  checkV138ReviewV3ClaimsAgainstObservations({ document,
    routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST, sourceCustody,
    publication: body.publication, protectedHistory: protectedObservation,
    priorAuthorizationBytes: protectedHistory.authorizations, snapshots })
  return Object.freeze({ schemaVersion: "v1.38-plan-262-61-reviewer-v3-no-publish-v2",
    source, predecessors, convergence, protectedHistory, lifecycle,
    commands: routeExecution.observations, reviewDocument: document,
    syntheticB9: { sourceB9: routeExecution.sourceB9,
      changedPaths: routeExecution.b9ChangedPaths },
    forbiddenDestinations: FORBIDDEN_DESTINATIONS,
    findingCount: 0, publishesCanonicalReview: false, authorizesExecution: false,
    identityClaims: Object.freeze({ independentPersonClaimed: false,
      reviewerSeparated: false, externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false }) })
}

const requireExactArgv = (argv: readonly string[], expected: readonly string[]) => {
  if (canonicalV138ReviewerV3(argv) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_61_ARGUMENTS_INVALID")
}

const receiptEntryRoot = (entry: Readonly<{ agentId: string; phase: string;
  plan: string; completionTimestamp: string }>) => sha256V138ReviewerV3(
  canonicalV138ReviewerV3(entry as unknown as Json))

export const inspectV138Plan26261Receipt = (rootPath: string, receiptPath: string) => {
  if (receiptPath !== PLAN_61_RECEIPT)
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  const immutable = committedCurrentFile(rootPath, receiptPath,
    "V138_PLAN_262_61_RECEIPT_NOT_IMMUTABLE")
  const receipt = JSON.parse(immutable.bytes.toString("utf8")) as Record<string, unknown>
  const convergence = inspectReviewerConvergence(rootPath)
  const expectedKeys = ["schemaVersion", "r3AuthorAgent", "phase", "plan",
    "completionTimestamp", "historyEntryRoot", "agentHistorySnapshot",
    "agentHistoryRoot", "sourceR3", "codeReviewPath", "codeReviewRoot",
    "reviewFixRoot"]
  if (!Array.isArray(receipt.agentHistorySnapshot))
    fail("V138_PLAN_262_61_RECEIPT_HISTORY_INVALID")
  const snapshot = boundedAgentHistory(receipt.agentHistorySnapshot as AgentHistoryEntry[])
  const selected = selectCompletedAgentHistory(snapshot, "262", "61")
  const entry = selected
  if (canonicalV138ReviewerV3(Object.keys(receipt).sort()) !==
      canonicalV138ReviewerV3(expectedKeys.sort()) ||
    receipt.schemaVersion !== "v1.38-plan-262-61-r3-author-tracking-v1" ||
    receipt.phase !== "262" || receipt.plan !== "61" ||
    receipt.agentHistoryRoot !== agentHistoryRoot(snapshot) ||
    receipt.r3AuthorAgent !== selected.agentId ||
    receipt.completionTimestamp !== selected.completionTimestamp ||
    receipt.historyEntryRoot !== receiptEntryRoot(entry) ||
    receipt.sourceR3 !== convergence.sourceR3.commit ||
    receipt.codeReviewPath !== convergence.codeReviewPath ||
    receipt.codeReviewRoot !== convergence.codeReviewRoot ||
    receipt.reviewFixRoot !== convergence.reviewFixRoot ||
    typeof receipt.r3AuthorAgent !== "string" ||
    typeof receipt.completionTimestamp !== "string" ||
    receipt.completionTimestamp.length === 0 || receipt.r3AuthorAgent.length === 0)
    fail("V138_PLAN_262_61_RECEIPT_INVALID")
  const changed = changedPaths(rootPath, immutable.commit)
  if (canonicalV138ReviewerV3(changed) !== canonicalV138ReviewerV3([receiptPath]))
    fail("V138_PLAN_262_61_RECEIPT_CARRIER_INVALID")
  return Object.freeze({ receipt, convergence, receiptCommit: immutable.commit,
    receiptBlob: immutable.blob, receiptRoot: immutable.root })
}

export const deriveV138Plan26262AgentSeparation = (rootPath: string,
  receiptPath: string, historyPath: string) => {
  if (historyPath !== ".planning/agent-history.json")
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  const { receipt } = inspectV138Plan26261Receipt(rootPath, receiptPath)
  const history = boundedAgentHistory(parseAgentHistoryBytes(
    readRepositoryFile(rootPath, historyPath, historyPath).bytes))
  const reviewer = selectCompletedAgentHistory(history, "262", "62")
  if (reviewer.agentId === receipt.r3AuthorAgent)
    fail("V138_PLAN_262_62_AGENT_SEPARATION_INVALID")
  return Object.freeze({ r3AuthorAgent: String(receipt.r3AuthorAgent),
    r3CompletionTimestamp: String(receipt.completionTimestamp),
    r3HistoryEntryRoot: String(receipt.historyEntryRoot),
    reviewAgent: reviewer.agentId, reviewCompletionTimestamp:
      reviewer.completionTimestamp, reviewerHistoryEntryRoot: receiptEntryRoot(reviewer),
    agentHistoryRoot: agentHistoryRoot(history) })
}

export const validatePlan26262Summary = (manifest: unknown, expected: unknown) => {
  if (canonicalV138ReviewerV3(manifest) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_62_SUMMARY_BINDING_INVALID")
}

export const assembleExpectedPlan26262Review = (input: Readonly<{
  sourceCustody: unknown; protectedHistory: unknown; chargeIds: unknown;
  priorAuthorizationBytes: unknown; snapshots: unknown; orderedEvents: unknown;
}>) => {
  const body: Record<string, unknown> = { schemaVersion:
    "v1.38-plan-262-62-source-completeness-review-v3",
  sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9,
  sourceCustody: input.sourceCustody,
  routeManifest: V138_REVIEW_V3_ROUTE_MANIFEST,
  protectedHistory: input.protectedHistory,
  chargeIds: input.chargeIds,
  priorAuthorizationBytes: input.priorAuthorizationBytes,
  snapshots: input.snapshots, orderedEvents: input.orderedEvents,
  cleanup: { complete: true, residualPaths: [] },
  publication: { changedPaths: [PLAN_62_REVIEW, PLAN_62_REPORT] },
  verdict: { findingCount: 0, sourceCompletenessPassed: true,
    authorizesExecution: false },
  identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
    externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
    independentCustodyClaimed: false, proceduralContext:
      "main-orchestrator procedural review; no person or custody claim" } }
  return Object.freeze({ ...body, reviewV3Root: computeV138ReviewV3Root(body) })
}

export const validatePlan26262ReviewAgainstExpected = (candidate: any,
  expected: any) => {
  validateV138ReviewV3Document(candidate)
  if (candidate.sourceBase9 !== expected.sourceBase9 ||
    candidate.sourceA9 !== expected.sourceA9)
    fail("V138_PLAN_262_62_REVIEW_SOURCE_BINDING_INVALID")
  checkV138ReviewV3ClaimsAgainstObservations({ document: candidate,
    routeManifest: expected.routeManifest,
    sourceCustody: expected.sourceCustody,
    publication: expected.publication,
    protectedHistory: expected.protectedHistory,
    priorAuthorizationBytes: expected.priorAuthorizationBytes,
    snapshots: expected.snapshots })
  if (canonicalV138ReviewerV3(candidate.chargeIds) !==
      canonicalV138ReviewerV3(expected.chargeIds))
    fail("V138_PLAN_262_62_REVIEW_CHARGE_BINDING_INVALID")
  if (canonicalV138ReviewerV3(candidate.orderedEvents) !==
      canonicalV138ReviewerV3(expected.orderedEvents))
    fail("V138_PLAN_262_62_REVIEW_EVENT_BINDING_INVALID")
  if (canonicalV138ReviewerV3(candidate.cleanup) !==
      canonicalV138ReviewerV3(expected.cleanup))
    fail("V138_PLAN_262_62_REVIEW_CLEANUP_BINDING_INVALID")
  if (canonicalV138ReviewerV3(candidate) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_62_REVIEW_DOCUMENT_BINDING_INVALID")
  return true
}

const PAIR_AUDIT_CLONE_GROUPS = Object.freeze([
  "alias", "happy", "obstruction", "readiness",
] as const)
const PAIR_AUDIT_MAX_BYTES = 512 * 1024
const pairAuditRecord = (value: unknown, keys: readonly string[]) =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  canonicalV138ReviewerV3(Object.keys(value as Record<string, unknown>).sort()) ===
    canonicalV138ReviewerV3([...keys].sort())
const pairAuditString = (value: unknown, maximum = 4096) =>
  typeof value === "string" && value.length > 0 && value.length <= maximum &&
  !value.includes("\0")
const pairAuditInt = (value: unknown, minimum: number, maximum: number) =>
  Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum
const pairAuditProjectionValue = (value: unknown) => root(value) || fullOid(value)
const pairAuditEventPreimage = (value: unknown) => {
  if (!pairAuditString(value, 128 * 1024)) return false
  try { return canonicalV138ReviewerV3(JSON.parse(value as string)) === value }
  catch { return false }
}
const pairAuditRepositoryLocation = (value: unknown) => pairAuditString(value, 512) &&
  !path.posix.isAbsolute(String(value)) && !String(value).includes("\\") &&
  !String(value).split("/").includes("..")
export const verifyV138Plan26261PhysicalLogicalEventPreimages = (input: Readonly<{
  physicalResultPreimage: string; logicalResultPreimage: string;
  location: string; operation: string;
  replacements: ReadonlyMap<string, string> }>) => {
  let physicalResult: any; let logicalResult: any
  try {
    physicalResult = JSON.parse(input.physicalResultPreimage)
    logicalResult = JSON.parse(input.logicalResultPreimage)
  } catch { fail("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID") }
  const operationKeys = ["ordinal", "operation", "path", "sideEffect", "flags",
    "outcome", "errorCode", "beforeState", "afterState", "detailRoot"]
  const { detailRoot: physicalDetailRoot, ...physicalDetail } = physicalResult
  const projectedDetail = projectRouteLogicalIdentity(physicalDetail,
    input.replacements)
  const expectedLogicalResult = { ...projectedDetail,
    detailRoot: logicalEventDetailRootV138Plan26261(projectedDetail) }
  const diagnosticRoot = (value: unknown) => sha256V138ReviewerV3(
    canonicalV138ReviewerV3(value))
  const mismatchDiagnostic = (leaf: string) => {
    const physicalValue = (physicalResult as Record<string, unknown>)[leaf]
    const logicalValue = (logicalResult as Record<string, unknown>)[leaf]
    const expectedValue = (expectedLogicalResult as Record<string, unknown>)[leaf]
    return `V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID:` +
      `class=${String(input.operation).replaceAll(":", "-")}:leaf=${leaf}:` +
      `physicalKeys=${diagnosticRoot(Object.keys(physicalResult).sort())}:` +
      `physicalBody=${diagnosticRoot(physicalResult)}:` +
      `retainedPhysicalDetail=${diagnosticRoot(physicalDetail)}:` +
      `projectedBody=${diagnosticRoot(projectedDetail)}:` +
      `logicalBody=${diagnosticRoot(logicalResult)}:` +
      `expectedLogical=${diagnosticRoot(expectedLogicalResult)}:` +
      `physicalValue=${diagnosticRoot(physicalValue)}:` +
      `logicalValue=${diagnosticRoot(logicalValue)}:` +
      `expectedValue=${diagnosticRoot(expectedValue)}`
  }
  if (!pairAuditRecord(physicalResult, operationKeys) ||
    !pairAuditRecord(logicalResult, operationKeys) ||
    !pairAuditInt(physicalResult.ordinal, 0, 100_000) ||
    logicalResult.ordinal !== physicalResult.ordinal ||
    physicalDetailRoot !== physicalEventDetailRootV138Plan26261(physicalDetail) ||
    physicalResult.path !== input.location || logicalResult.path !== input.location ||
    physicalResult.operation !== input.operation ||
    logicalResult.operation !== physicalResult.operation) {
    const leaf = operationKeys.find(key =>
      canonicalV138ReviewerV3((physicalResult as Record<string, any>)[key]) !==
        canonicalV138ReviewerV3((logicalResult as Record<string, any>)[key])) ??
      "physical-structure"
    fail(mismatchDiagnostic(leaf))
  }
  if (canonicalV138ReviewerV3(expectedLogicalResult) !==
      canonicalV138ReviewerV3(logicalResult)) {
    const leaf = operationKeys.find(key => canonicalV138ReviewerV3(
      (expectedLogicalResult as Record<string, any>)[key]) !==
      canonicalV138ReviewerV3((logicalResult as Record<string, any>)[key])) ??
      "logical-structure"
    fail(mismatchDiagnostic(leaf))
  }
  return true
}
const pairAuditSensitive = (value: unknown, key = ""): boolean => {
  if (/secret|private|host|user|path|diagnostic|memory|objective|environment/iu.test(key))
    return !["pathRoot", "pathComponentRoot", "rawPhysicalPreimageRetained",
      "residualPaths", "beforePathCount", "afterPathCount"].includes(key)
  if (typeof value === "string") return value.startsWith("/") ||
    /(?:^|[\\/])var[\\/]folders(?:[\\/]|$)/u.test(value) ||
    /StrategyMemory|SoldierMemory|objectivePayload|rawDiagnostics/iu.test(value)
  if (Array.isArray(value)) return value.some(item => pairAuditSensitive(item, key))
  if (value !== null && typeof value === "object") return Object.entries(
    value as Record<string, unknown>).some(([nestedKey, nested]) =>
      pairAuditSensitive(nested, nestedKey))
  return false
}

const PAIR_AUDIT_ASSURANCE = "single_operator_local_observation_v1" as const

export const localObservationCommitment = (input: Readonly<Record<string, unknown>>) => {
  const { pathComponentRoot: observedPathRoot,
    inodeDeviceComponentRoot: observedFilesystemIdentityRoot,
    locationCommitment: retainedLocationCommitment,
    filesystemIdentityCommitment: retainedFilesystemIdentityCommitment,
    ...safe } = input
  const locationCommitment = retainedLocationCommitment ?? identityRootV138ReviewerV3(
    "artifactManifest", "v1.38-plan-262-61-local-observed-location-v1",
    { observedPathRoot })
  const filesystemIdentityCommitment = retainedFilesystemIdentityCommitment ??
    identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-local-observed-filesystem-identity-v1",
      { observedFilesystemIdentityRoot })
  const componentBody = { assurance: safe.assurance, run: safe.run,
    kind: safe.kind, group: safe.group, ordinal: safe.ordinal,
    contentRoot: safe.contentRoot, mode: safe.mode, byteLength: safe.byteLength,
    linkCount: safe.linkCount, executionCommit: safe.executionCommit,
    locationCommitment, filesystemIdentityCommitment }
  const pathComponentRoot = identityRootV138ReviewerV3("artifactManifest",
    "v1.38-plan-262-61-hashed-local-path-component-v1", componentBody)
  const inodeDeviceComponentRoot = identityRootV138ReviewerV3("artifactManifest",
    "v1.38-plan-262-61-hashed-local-inode-device-component-v1",
    { ...componentBody, pathComponentRoot })
  const body = { ...safe, locationCommitment, filesystemIdentityCommitment,
    pathComponentRoot, inodeDeviceComponentRoot }
  return Object.freeze({ ...body, commitmentRoot: identityRootV138ReviewerV3(
    "evidenceBundle", "v1.38-plan-262-61-local-observation-commitment-v1", body) })
}

const projectionCommand = (label: string) => {
  for (const prefix of ["route-output:", "route-obstruction-metadata:",
    "route-persisted-receipt:", "route-reservation-claim:"])
    if (label.startsWith(prefix)) return label.slice(prefix.length)
  if (label.startsWith("route-derived-root:")) {
    const value = label.slice("route-derived-root:".length)
    return value.slice(0, value.lastIndexOf(":"))
  }
  return null
}

const pairAuditRun = (label: "left" | "right", route: any) => {
  const physical = route.physicalIsolation
  const projection = (name: string) => physical.physicalToLogicalProjection.find(
    ({ label: candidate }: any) => candidate === name) ??
    fail(`V138_PLAN_262_61_PAIR_AUDIT_PROJECTION_MISSING:${name}`)
  const logicalCustody = Object.freeze({ sourceA9: SOURCE_A9,
    sourceB9: route.sourceB9,
    authorizationRoot: projection("authorization-root").logical,
    sealRoot: projection("seal-root").logical,
    authorizationBytesRoot: route.b9Custody.authorizationRoot,
    sealBytesRoot: route.b9Custody.sealRoot,
    detachedBytesSha256: route.logicalInputCustody.bytesSha256,
    detachedByteLength: route.logicalInputCustody.byteLength,
    detachedMode: route.logicalInputCustody.mode,
    detachedLinkCount: route.logicalInputCustody.linkCount })
  const physicalPublicationBody = Object.freeze({
    ...route.postExecutionPublication })
  const physicalPublicationEvidence = Object.freeze({
    ...physicalPublicationBody,
    evidenceRoot: identityRootV138ReviewerV3("evidenceBundle",
      "v1.38-plan-262-61-physical-publication-evidence-v1",
      physicalPublicationBody) })
  const logicalPublicationEvidence = Object.freeze({
    ...route.logicalPostExecutionPublication })
  const handlerValidationRoot = identityRootV138ReviewerV3("evidenceBundle",
    "v1.38-plan-262-61-handler-validation-v1", physical.routeIdentityAudits.map(
      ({ command, physicalRouteIdentityRoot, logicalRouteIdentityRoot }: any) =>
        ({ command, physicalRouteIdentityRoot, logicalRouteIdentityRoot,
          result: "handler_success" })))
  const commitmentCommon = { assurance: PAIR_AUDIT_ASSURANCE,
    run: label, authorizationRoot: physical.detachedInput.authorizationRoot,
    sealRoot: physical.detachedInput.sealRoot,
    executionCommit: physical.executionSourceB9,
    executionBlobRoot: identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-execution-blob-join-v1", {
        authorizationBytesRoot: projection("authorization-bytes-root").physical,
        sealBytesRoot: projection("seal-bytes-root").physical }),
    handlerValidationResult: "handler_success",
    handlerValidationRoot }
  const physicalCommitments = Object.freeze([
    localObservationCommitment({ ...commitmentCommon, kind: "detached",
      group: "input", ordinal: 0,
      contentRoot: physical.detachedInput.bytesSha256,
      mode: physical.detachedInput.mode, byteLength: physical.detachedInput.byteLength,
      linkCount: physical.detachedInput.linkCount,
      pathComponentRoot: physical.detachedInput.pathRoot,
      inodeDeviceComponentRoot: physical.detachedInput.identityRoot }),
    ...physical.routeClones.map((entry: any, ordinal: number) =>
      localObservationCommitment({ ...commitmentCommon, kind: "clone",
        group: entry.group, ordinal, contentRoot: entry.sourceB9,
        mode: entry.mode, byteLength: entry.byteLength, linkCount: entry.linkCount,
        pathComponentRoot: entry.pathRoot,
        inodeDeviceComponentRoot: entry.identityRoot })),
    ...physical.obstructionInputs.map((entry: any, ordinal: number) =>
      localObservationCommitment({ ...commitmentCommon, kind: "obstruction",
        group: "obstruction", ordinal, contentRoot: entry.bytesSha256,
        mode: entry.mode, byteLength: entry.byteLength, linkCount: entry.linkCount,
        pathComponentRoot: entry.pathRoot,
        inodeDeviceComponentRoot: entry.identityRoot })),
    localObservationCommitment({ ...commitmentCommon, kind: "cleanup",
      group: "parent", ordinal: 0,
      contentRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
        route.cleanup.residualPaths)), mode: route.cleanup.mode,
      byteLength: route.cleanup.byteLength, linkCount: route.cleanup.linkCount,
      pathComponentRoot: route.cleanup.parentRoot,
      inodeDeviceComponentRoot: route.cleanup.parentIdentityRoot }),
  ])
  const eventLedger = Object.freeze(route.events.map((event: any, ordinal: number) => {
    const command = event.command
    const observation = route.observations.find((candidate: RouteObservation) =>
      candidate.command === command)!
    if (observation === undefined || event.handler !== observation.handler)
      fail("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID")
    return Object.freeze({ ordinal, command, handler: event.handler,
      event: event.event, location: event.path,
      changed: observation.changedLocations.includes(event.path),
      physicalResultPreimage: String(event.physicalResult),
      physicalResultRoot: sha256V138ReviewerV3(String(event.physicalResult)),
      resultPreimage: String(event.result),
      resultRoot: sha256V138ReviewerV3(String(event.result)) })
  }))
  const routeEvidence = Object.freeze(route.observations.map(
    (observation: RouteObservation) => {
      const commandEvents = eventLedger.filter((event: any) =>
        event.command === observation.command).map(({ ordinal, event, location,
          changed, resultRoot }: any) => Object.freeze({ ordinal, event, location,
            changed, resultRoot }))
      const eventLocations = Object.freeze([...new Set(commandEvents.map(
        ({ location }: any) => location))].sort())
      const changedLocations = Object.freeze([...new Set(commandEvents.filter(
        ({ changed }: any) => changed).map(({ location }: any) => location))].sort())
      const eventEvidenceRoot = identityRootV138ReviewerV3("evidenceBundle",
        "v1.38-plan-262-61-route-event-evidence-v1", commandEvents)
      return Object.freeze({
      command: observation.command, handler: observation.handler,
      manifestHandler: observation.manifestHandler,
      destination: observation.destination, exit: observation.exit,
      resultCode: observation.resultCode,
      logicalOutputRoot: observation.outputRoot,
      outputByteLength: observation.outputByteLength,
      handlerSourceRoot: observation.handlerSourceRoot,
      dispatcherSourceRoot: observation.dispatcherSourceRoot,
      effectPolicyRoot: observation.effectPolicyRoot,
      logicalRouteIdentityRoot: observation.routeIdentityRoot,
      beforeRoot: observation.beforeRoot, afterRoot: observation.afterRoot,
      beforePathCount: observation.beforePathCount,
      afterPathCount: observation.afterPathCount,
      eventLocations, changedLocations,
      commandEvents: Object.freeze(commandEvents), eventEvidenceRoot }) }))
  const projectionEvidenceLedger = Object.freeze(
    physical.physicalToLogicalProjection.map((entry: any) => {
      const command = projectionCommand(entry.label)
      const routeIdentity = command === null ? null : physical.routeIdentityAudits.find(
        (candidate: any) => candidate.command === command) ?? null
      const handlerRoot = command === null ? handlerValidationRoot :
        identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-projection-handler-join-v1", {
            command, physicalRouteIdentityRoot:
              routeIdentity?.physicalRouteIdentityRoot,
            logicalRouteIdentityRoot: routeIdentity?.logicalRouteIdentityRoot,
            result: "handler_success" })
      const body = { ordinal: entry.ordinal, label: entry.label,
        evidenceClass: command === null ? "custody" : entry.label.slice(6,
          entry.label.indexOf(":", 6) < 0 ? undefined : entry.label.indexOf(":", 6)),
        command, physical: entry.physical, logical: entry.logical,
        authorizationRoot: physical.detachedInput.authorizationRoot,
        sealRoot: physical.detachedInput.sealRoot,
        executionCommit: physical.executionSourceB9,
        handlerValidationResult: "handler_success", handlerValidationRoot: handlerRoot }
      return Object.freeze({ ...body, evidenceRoot: identityRootV138ReviewerV3(
        "evidenceBundle", "v1.38-plan-262-61-projection-evidence-v1", body) })
    }))
  const body = { schemaVersion: "v1.38-plan-262-61-physical-run-audit-v2",
    label, identityKind: physical.identityKind, assurance: PAIR_AUDIT_ASSURANCE,
    independentCustody: false, rawPhysicalPreimageRetained: false,
    executionSourceB9: physical.executionSourceB9,
    logicalCustody,
    physicalPublicationEvidence, logicalPublicationEvidence,
    physicalCommitments,
    routeIdentityAudits: physical.routeIdentityAudits,
    routeEvidence, eventLedger,
    projectionLedger: physical.physicalToLogicalProjection,
    projectionEvidenceLedger,
    cleanup: Object.freeze({ complete: route.cleanup.complete,
      residualPaths: route.cleanup.residualPaths, mode: route.cleanup.mode,
      linkCount: route.cleanup.linkCount, byteLength: route.cleanup.byteLength }) }
  return Object.freeze({ ...body, runAuditRoot: identityRootV138ReviewerV3(
    "evidenceBundle", body.schemaVersion, body) })
}

export const buildV138Plan26261PairAudit = (left: any, right: any) => {
  validateV138Plan26261FreshRoutePairIsolation(left, right)
  const runs = Object.freeze([pairAuditRun("left", left),
    pairAuditRun("right", right)])
  const logicalProjectionManifest = Object.freeze(left.physicalIsolation
    .physicalToLogicalProjection.map(({ ordinal, label, logical, projected,
      independentlyValidated }: any) => Object.freeze({ ordinal, label, logical,
      projected, independentlyValidated })))
  const logicalProjectionRoot = identityRootV138ReviewerV3("artifactManifest",
    "v1.38-plan-262-61-logical-projection-manifest-v2",
    logicalProjectionManifest)
  const body = { schemaVersion: "v1.38-plan-262-61-two-fresh-pair-audit-v2",
    assurance: PAIR_AUDIT_ASSURANCE, independentCustody: false,
    rawPhysicalPreimageRetained: false,
    runs, logicalProjectionManifest, logicalProjectionRoot }
  return Object.freeze({ ...body, pairAuditRoot: identityRootV138ReviewerV3(
    "evidenceBundle", body.schemaVersion, body) })
}

export const validateV138Plan26261PairAudit = (audit: any) => {
  if (!pairAuditRecord(audit, ["schemaVersion", "assurance",
    "independentCustody", "rawPhysicalPreimageRetained", "runs",
    "logicalProjectionManifest", "logicalProjectionRoot", "pairAuditRoot"]) ||
    audit.schemaVersion !== "v1.38-plan-262-61-two-fresh-pair-audit-v2" ||
    audit.assurance !== PAIR_AUDIT_ASSURANCE || audit.independentCustody !== false ||
    audit.rawPhysicalPreimageRetained !== false ||
    Buffer.byteLength(canonicalV138ReviewerV3(audit)) > PAIR_AUDIT_MAX_BYTES ||
    pairAuditSensitive(audit) ||
    !Array.isArray(audit.runs) || audit.runs.length !== 2 ||
    audit.runs[0]?.label !== "left" || audit.runs[1]?.label !== "right")
    fail("V138_PLAN_262_61_PAIR_AUDIT_INVALID")
  for (const run of audit.runs) {
    if (!pairAuditRecord(run, ["schemaVersion", "label", "identityKind",
      "assurance", "independentCustody", "rawPhysicalPreimageRetained",
      "executionSourceB9", "logicalCustody", "physicalPublicationEvidence",
      "logicalPublicationEvidence", "physicalCommitments",
      "routeIdentityAudits", "routeEvidence", "eventLedger", "projectionLedger",
      "projectionEvidenceLedger", "cleanup", "runAuditRoot"]) ||
      run.schemaVersion !== "v1.38-plan-262-61-physical-run-audit-v2" ||
      run.assurance !== PAIR_AUDIT_ASSURANCE || run.independentCustody !== false ||
      run.rawPhysicalPreimageRetained !== false ||
      !pairAuditRecord(run.logicalCustody, ["sourceA9", "sourceB9",
        "authorizationRoot", "sealRoot", "authorizationBytesRoot",
        "sealBytesRoot", "detachedBytesSha256", "detachedByteLength",
        "detachedMode", "detachedLinkCount"]) ||
      run.logicalCustody.sourceA9 !== SOURCE_A9 ||
      !fullOid(run.logicalCustody.sourceB9) ||
      !root(run.logicalCustody.authorizationRoot) ||
      !root(run.logicalCustody.sealRoot) ||
      !root(run.logicalCustody.authorizationBytesRoot) ||
      !root(run.logicalCustody.sealBytesRoot) ||
      !root(run.logicalCustody.detachedBytesSha256) ||
      !pairAuditInt(run.logicalCustody.detachedByteLength, 1, 8 * 1024 * 1024) ||
      run.logicalCustody.detachedMode !== 0o444 ||
      run.logicalCustody.detachedLinkCount !== 1)
      fail("V138_PLAN_262_61_PAIR_AUDIT_INVALID")
    const physicalPublicationKeys = ["semanticEvidenceEligible", "commit", "parent",
      "tree", "changedLocations", "reviewBlob", "reviewRoot", "reviewByteLength",
      "reportBlob", "reportRoot", "reportByteLength", "evidenceRoot"]
    const logicalPublicationKeys = ["schemaVersion", "identityKind",
      "semanticEvidenceEligible", "changedLocations", "reviewBlobRoot",
      "reportBlobRoot", "semanticRoot", "treeRoot", "publicationIdentityRoot"]
    if (!pairAuditRecord(run.physicalPublicationEvidence,
      physicalPublicationKeys) ||
      !pairAuditRecord(run.logicalPublicationEvidence, logicalPublicationKeys) ||
      run.physicalPublicationEvidence.semanticEvidenceEligible !== false ||
      !fullOid(run.physicalPublicationEvidence.commit) ||
      !fullOid(run.physicalPublicationEvidence.parent) ||
      !fullOid(run.physicalPublicationEvidence.tree) ||
      !fullOid(run.physicalPublicationEvidence.reviewBlob) ||
      !fullOid(run.physicalPublicationEvidence.reportBlob) ||
      !root(run.physicalPublicationEvidence.reviewRoot) ||
      !root(run.physicalPublicationEvidence.reportRoot) ||
      !pairAuditInt(run.physicalPublicationEvidence.reviewByteLength, 1,
        8 * 1024 * 1024) ||
      !pairAuditInt(run.physicalPublicationEvidence.reportByteLength, 1,
        8 * 1024 * 1024) ||
      !Array.isArray(run.physicalPublicationEvidence.changedLocations) ||
      run.physicalPublicationEvidence.changedLocations.some(
        (location: unknown) => !pairAuditRepositoryLocation(location)) ||
      canonicalV138ReviewerV3(run.physicalPublicationEvidence.changedLocations) !==
        canonicalV138ReviewerV3([...new Set(
          run.physicalPublicationEvidence.changedLocations)].sort()) ||
      canonicalV138ReviewerV3(run.physicalPublicationEvidence.changedLocations) !==
        canonicalV138ReviewerV3([V138_REVIEW_V3_CANONICAL_PATH,
          V138_REVIEW_V3_REPORT_PATH]) ||
      run.physicalPublicationEvidence.evidenceRoot !==
        identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-physical-publication-evidence-v1", (() => {
            const { evidenceRoot: _root, ...body } =
              run.physicalPublicationEvidence
            return body
          })()) ||
      run.logicalPublicationEvidence.schemaVersion !==
        "v1.38-plan-262-61-logical-post-execution-publication-v1" ||
      run.logicalPublicationEvidence.identityKind !==
        "logical_synthetic_publication" ||
      run.logicalPublicationEvidence.semanticEvidenceEligible !== false ||
      !Array.isArray(run.logicalPublicationEvidence.changedLocations) ||
      run.logicalPublicationEvidence.changedLocations.some(
        (location: unknown) => !pairAuditRepositoryLocation(location)) ||
      canonicalV138ReviewerV3(run.logicalPublicationEvidence.changedLocations) !==
        canonicalV138ReviewerV3([...new Set(
          run.logicalPublicationEvidence.changedLocations)].sort()) ||
      canonicalV138ReviewerV3(run.logicalPublicationEvidence.changedLocations) !==
        canonicalV138ReviewerV3([V138_REVIEW_V3_CANONICAL_PATH,
          V138_REVIEW_V3_REPORT_PATH]) ||
      !root(run.logicalPublicationEvidence.reviewBlobRoot) ||
      !root(run.logicalPublicationEvidence.reportBlobRoot) ||
      !root(run.logicalPublicationEvidence.semanticRoot) ||
      run.logicalPublicationEvidence.treeRoot !== identityRootV138ReviewerV3(
        "artifactManifest", "v1.38-plan-262-61-logical-publication-tree-v1", {
          changedLocations: run.logicalPublicationEvidence.changedLocations,
          reviewBlobRoot: run.logicalPublicationEvidence.reviewBlobRoot,
          reportBlobRoot: run.logicalPublicationEvidence.reportBlobRoot }) ||
      run.logicalPublicationEvidence.publicationIdentityRoot !==
        identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-logical-publication-identity-v1", (() => {
            const { publicationIdentityRoot: _identity, ...body } =
              run.logicalPublicationEvidence
            return body
          })()))
      fail("V138_PLAN_262_61_PAIR_AUDIT_PUBLICATION_INVALID")
    const { runAuditRoot, ...body } = run
    if (run.identityKind !== "physical_execution_b9" ||
      !fullOid(run.executionSourceB9) ||
      run.executionSourceB9 === run.logicalCustody.sourceB9 ||
      !pairAuditRecord(run.cleanup, ["complete", "residualPaths", "mode",
        "linkCount", "byteLength"]) ||
      run.cleanup.complete !== true || !Array.isArray(run.cleanup.residualPaths) ||
      run.cleanup.residualPaths.length !== 0 || run.cleanup.byteLength !== 0 ||
      !pairAuditInt(run.cleanup.mode, 0, 0o777) ||
      !pairAuditInt(run.cleanup.linkCount, 1, 1_000_000) ||
      !Array.isArray(run.physicalCommitments) ||
      run.physicalCommitments.length !== 7 ||
      !Array.isArray(run.routeIdentityAudits) ||
      canonicalV138ReviewerV3(run.routeIdentityAudits.map(
        ({ command }: any) => command)) !== canonicalV138ReviewerV3(
          V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }) => command)) ||
      !Array.isArray(run.routeEvidence) ||
      canonicalV138ReviewerV3(run.routeEvidence.map(
        ({ command }: any) => command)) !== canonicalV138ReviewerV3(
          V138_REVIEW_V3_ROUTE_MANIFEST.map(({ command }) => command)) ||
      !Array.isArray(run.projectionLedger) ||
      canonicalV138ReviewerV3(run.projectionLedger.map(({ label }: any) => label)) !==
        canonicalV138ReviewerV3(V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS) ||
      run.projectionLedger.some((entry: any, ordinal: number) =>
        !pairAuditRecord(entry, ["ordinal", "label", "physical", "logical",
          "projected", "independentlyValidated"]) || entry.ordinal !== ordinal ||
        !pairAuditString(entry.label, 256) ||
        !pairAuditProjectionValue(entry.physical) ||
        !pairAuditProjectionValue(entry.logical) ||
        entry.independentlyValidated !== true ||
        entry.projected !== (entry.physical !== entry.logical)) ||
      !Array.isArray(run.projectionEvidenceLedger) ||
      run.projectionEvidenceLedger.length !== run.projectionLedger.length ||
      !Array.isArray(run.eventLedger) ||
      runAuditRoot !== identityRootV138ReviewerV3("evidenceBundle",
        String(body.schemaVersion), body))
      fail("V138_PLAN_262_61_PAIR_AUDIT_INVALID")

    const projections = new Map(run.projectionLedger.map((entry: any) =>
      [entry.label, entry]))
    const commitmentKeys = ["assurance", "run", "authorizationRoot", "sealRoot",
      "executionCommit", "executionBlobRoot", "handlerValidationResult",
      "handlerValidationRoot", "kind", "group", "ordinal", "contentRoot", "mode",
      "byteLength", "linkCount", "locationCommitment",
      "filesystemIdentityCommitment", "pathComponentRoot",
      "inodeDeviceComponentRoot", "commitmentRoot"]
    const expectedHandlerValidationRoot = identityRootV138ReviewerV3(
      "evidenceBundle", "v1.38-plan-262-61-handler-validation-v1",
      run.routeIdentityAudits.map(({ command, physicalRouteIdentityRoot,
        logicalRouteIdentityRoot }: any) => ({ command, physicalRouteIdentityRoot,
          logicalRouteIdentityRoot, result: "handler_success" })))
    const expectedExecutionBlobRoot = identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-execution-blob-join-v1", {
        authorizationBytesRoot: projections.get("authorization-bytes-root")?.physical,
        sealBytesRoot: projections.get("seal-bytes-root")?.physical })
    const expectedCommitmentTuples = [
      ["detached", "input", 0],
      ...PAIR_AUDIT_CLONE_GROUPS.map((group, ordinal) => ["clone", group, ordinal]),
      ["obstruction", "obstruction", 0], ["cleanup", "parent", 0],
    ]
    if (run.physicalCommitments.some((entry: any, index: number) => {
      if (!pairAuditRecord(entry, commitmentKeys)) return true
      const { commitmentRoot, ...commitmentBody } = entry
      const recomputed = localObservationCommitment(commitmentBody)
      const [kind, group, ordinal] = expectedCommitmentTuples[index]!
      return entry.assurance !== PAIR_AUDIT_ASSURANCE || entry.run !== run.label ||
        entry.kind !== kind || entry.group !== group || entry.ordinal !== ordinal ||
        !pairAuditProjectionValue(entry.contentRoot) ||
        !pairAuditInt(entry.mode, 0, 0o777) ||
        !pairAuditInt(entry.byteLength, 0, 8 * 1024 * 1024) ||
        !pairAuditInt(entry.linkCount, 1, 1_000_000) ||
        !root(entry.locationCommitment) || !root(entry.filesystemIdentityCommitment) ||
        !root(entry.pathComponentRoot) || !root(entry.inodeDeviceComponentRoot) ||
        entry.authorizationRoot !== projections.get("authorization-root")?.physical ||
        entry.sealRoot !== projections.get("seal-root")?.physical ||
        entry.executionCommit !== run.executionSourceB9 ||
        entry.executionBlobRoot !== expectedExecutionBlobRoot ||
        entry.handlerValidationResult !== "handler_success" ||
        entry.handlerValidationRoot !== expectedHandlerValidationRoot ||
        canonicalV138ReviewerV3(entry) !== canonicalV138ReviewerV3(recomputed)
    })) fail("V138_PLAN_262_61_PAIR_AUDIT_COMMITMENT_INVALID")
    const detachedCommitment = run.physicalCommitments[0]
    const obstructionCommitment = run.physicalCommitments[5]
    const cleanupCommitment = run.physicalCommitments[6]
    if (projections.get("execution-b9")?.physical !== run.executionSourceB9 ||
      projections.get("execution-b9")?.logical !== run.logicalCustody.sourceB9 ||
      projections.get("authorization-root")?.physical !==
        detachedCommitment.authorizationRoot ||
      projections.get("authorization-root")?.logical !==
        run.logicalCustody.authorizationRoot ||
      projections.get("seal-root")?.physical !== detachedCommitment.sealRoot ||
      projections.get("seal-root")?.logical !== run.logicalCustody.sealRoot ||
      projections.get("authorization-bytes-root")?.logical !==
        run.logicalCustody.authorizationBytesRoot ||
      projections.get("seal-bytes-root")?.logical !==
        run.logicalCustody.sealBytesRoot ||
      detachedCommitment.contentRoot !== run.logicalCustody.detachedBytesSha256 ||
      detachedCommitment.mode !== run.logicalCustody.detachedMode ||
      detachedCommitment.byteLength !== run.logicalCustody.detachedByteLength ||
      detachedCommitment.linkCount !== run.logicalCustody.detachedLinkCount ||
      obstructionCommitment.contentRoot !== sha256V138ReviewerV3(Buffer.from("{}\n")) ||
      obstructionCommitment.mode !== 0o644 || obstructionCommitment.byteLength !== 3 ||
      obstructionCommitment.linkCount !== 1 ||
      cleanupCommitment.contentRoot !== sha256V138ReviewerV3("[]") ||
      cleanupCommitment.mode !== run.cleanup.mode ||
      cleanupCommitment.linkCount !== run.cleanup.linkCount)
      fail("V138_PLAN_262_61_PAIR_AUDIT_PROJECTION_INVALID")

    if (run.eventLedger.length < V138_REVIEW_V3_ROUTE_MANIFEST.length ||
      run.eventLedger.length > 2_560 || run.eventLedger.some(
        (event: any, ordinal: number) => !pairAuditRecord(event,
          ["ordinal", "command", "handler", "event", "location", "changed",
            "physicalResultPreimage", "physicalResultRoot", "resultPreimage",
            "resultRoot"]) || event.ordinal !== ordinal ||
          !V138_REVIEW_V3_ROUTE_MANIFEST.some(entry => entry.command === event.command) ||
          event.handler !== ACTUAL_HANDLER_BY_COMMAND[event.command as
            keyof typeof ACTUAL_HANDLER_BY_COMMAND] ||
          !pairAuditString(event.event, 512) ||
          !(event.event.startsWith(`${event.command}:`) ||
            event.event === `execute:${event.handler}`) ||
          !pairAuditRepositoryLocation(event.location) ||
          typeof event.changed !== "boolean" ||
          !pairAuditEventPreimage(event.physicalResultPreimage) ||
          event.physicalResultRoot !== sha256V138ReviewerV3(
            event.physicalResultPreimage) ||
          !pairAuditEventPreimage(event.resultPreimage) ||
          event.resultRoot !== sha256V138ReviewerV3(event.resultPreimage)))
      fail("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID")
    const eventProjectionReplacements = new Map(run.projectionLedger.filter(
      (entry: any) => entry.projected).map((entry: any) =>
        [entry.physical, entry.logical]))
    const invalidEventProjection = run.eventLedger.find((event: any) => {
      if (event.event === `execute:${event.handler}`) {
        try {
          return !verifyV138Plan26261LogicalExecutionResult(
            JSON.parse(event.physicalResultPreimage),
            JSON.parse(event.resultPreimage), eventProjectionReplacements)
        } catch { return true }
      }
      try {
        return !verifyV138Plan26261PhysicalLogicalEventPreimages({
          physicalResultPreimage: event.physicalResultPreimage,
          logicalResultPreimage: event.resultPreimage,
          location: event.location,
          operation: event.event.slice(event.command.length + 1),
          replacements: eventProjectionReplacements })
      } catch { return true }
    })
    if (invalidEventProjection !== undefined)
      fail(`V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID:` +
        `${invalidEventProjection.ordinal}:${invalidEventProjection.event}`)
    const allCommandEventOrdinals = run.routeEvidence.flatMap((evidence: any) =>
      evidence.commandEvents.map((event: any) => event.ordinal))
    if (canonicalV138ReviewerV3([...allCommandEventOrdinals].sort(
      (left: number, right: number) => left - right)) !==
        canonicalV138ReviewerV3(run.eventLedger.map((_: any, ordinal: number) => ordinal)) ||
      new Set(allCommandEventOrdinals).size !== run.eventLedger.length)
      fail("V138_PLAN_262_61_PAIR_AUDIT_EVENT_INVALID")

    const invalidProjectionEvidence = run.projectionEvidenceLedger.find(
      (evidence: any, ordinal: number) => {
      if (!pairAuditRecord(evidence, ["ordinal", "label", "evidenceClass",
        "command", "physical", "logical", "authorizationRoot", "sealRoot",
        "executionCommit", "handlerValidationResult", "handlerValidationRoot",
        "evidenceRoot"])) return true
      const { evidenceRoot, ...evidenceBody } = evidence
      const projection = run.projectionLedger[ordinal]
      const command = projectionCommand(evidence.label)
      const routeIdentity = command === null ? null : run.routeIdentityAudits.find(
        (candidate: any) => candidate.command === command)
      const expectedHandlerRoot = command === null ? expectedHandlerValidationRoot :
        identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-projection-handler-join-v1", {
            command, physicalRouteIdentityRoot:
              routeIdentity?.physicalRouteIdentityRoot,
            logicalRouteIdentityRoot: routeIdentity?.logicalRouteIdentityRoot,
            result: "handler_success" })
      if (evidence.ordinal !== ordinal || evidence.label !== projection.label ||
        evidence.command !== command || evidence.physical !== projection.physical ||
        evidence.logical !== projection.logical ||
        evidence.authorizationRoot !== detachedCommitment.authorizationRoot ||
        evidence.sealRoot !== detachedCommitment.sealRoot ||
        evidence.executionCommit !== run.executionSourceB9 ||
        evidence.handlerValidationResult !== "handler_success" ||
        evidence.handlerValidationRoot !== expectedHandlerRoot ||
        evidenceRoot !== identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-projection-evidence-v1", evidenceBody)) return true
      if (command !== null) {
        const executeEvent = run.eventLedger.find((event: any) =>
          event.command === command && event.event === `execute:${event.handler}`)
        let result: any
        try { result = JSON.parse(executeEvent?.physicalResultPreimage ?? "") } catch {
          return true
        }
        const tuple = result.projectionTuples?.find((candidate: any) =>
          candidate.label === evidence.label)
        if (!pairAuditRecord(tuple, ["label", "physical", "logical"]) ||
          tuple.physical !== evidence.physical || tuple.logical !== evidence.logical)
          return true
        if (evidence.label === `route-output:${command}` &&
          (sha256V138ReviewerV3(String(result.physicalOutputText)) !==
            evidence.physical || sha256V138ReviewerV3(
              String(result.logicalOutputText)) !== evidence.logical)) return true
        if (evidence.label.startsWith("route-obstruction-metadata:")) {
          const metadata = result.obstructionMetadataEvidence
          if (!pairAuditRecord(metadata, ["domain", "schemaVersion", "body",
            "physicalRoot", "logicalRoot"]) || metadata.domain !== "artifactManifest" ||
            identityRootV138ReviewerV3("artifactManifest", metadata.schemaVersion,
              metadata.body) !== evidence.physical ||
            evidence.physical !== evidence.logical) return true
        }
        if (evidence.label.startsWith("route-derived-root:")) {
          const derived = result.derivedRootEvidence
          if (!pairAuditRecord(derived, ["domain", "rootField", "physicalRecord",
            "physicalRoot", "logicalSchemaVersion", "logicalStructure",
            "logicalRoot"])) return true
          const { [derived.rootField]: embeddedRoot, ...physicalBody } =
            derived.physicalRecord
          if (embeddedRoot !== evidence.physical || derived.physicalRoot !==
            evidence.physical || identityRootV138ReviewerV3(derived.domain,
              String(derived.physicalRecord.schemaVersion), physicalBody) !==
                evidence.physical || derived.logicalRoot !== evidence.logical ||
            identityRootV138ReviewerV3("evidenceBundle",
              derived.logicalSchemaVersion, derived.logicalStructure) !==
                evidence.logical) return true
        }
        if (evidence.label.startsWith("route-persisted-receipt:") ||
          evidence.label.startsWith("route-reservation-claim:")) {
          const location = evidence.label.startsWith("route-reservation-claim:") ?
            ROUTE_RESERVATION_CLAIM : V138_REVIEW_V3_ROUTE_MANIFEST.find(
              entry => entry.command === command)!.destination
          const physicalFileJoin = run.eventLedger.filter((event: any) =>
            event.command === command && event.location === location &&
            event.event !== `execute:${event.handler}`).some((event: any) => {
              try { return JSON.parse(
                event.physicalResultPreimage).afterState?.sha256 ===
                evidence.physical } catch { return false }
            })
          if (!physicalFileJoin) return true
        }
      }
      return false
    })
    if (invalidProjectionEvidence !== undefined)
      fail(`V138_PLAN_262_61_PAIR_AUDIT_PROJECTION_INVALID:` +
        `${invalidProjectionEvidence.label}`)

    for (const [ordinal, manifest] of V138_REVIEW_V3_ROUTE_MANIFEST.entries()) {
      const routeAudit = run.routeIdentityAudits[ordinal]
      const evidence = run.routeEvidence[ordinal]
      if (!pairAuditRecord(routeAudit, ["command", "physicalRouteIdentityRoot",
        "logicalRouteIdentityRoot", "physicalRouteIdentityBody",
        "logicalRouteIdentityBody"]) ||
        !pairAuditRecord(evidence, ["command", "handler", "manifestHandler",
          "destination", "exit", "resultCode", "logicalOutputRoot",
          "outputByteLength", "handlerSourceRoot", "dispatcherSourceRoot",
          "effectPolicyRoot", "logicalRouteIdentityRoot", "beforeRoot",
          "afterRoot", "beforePathCount", "afterPathCount", "eventLocations",
          "changedLocations", "commandEvents", "eventEvidenceRoot"]) ||
        routeAudit.command !== manifest.command || evidence.command !== manifest.command ||
        evidence.handler !== ACTUAL_HANDLER_BY_COMMAND[manifest.command as
          keyof typeof ACTUAL_HANDLER_BY_COMMAND] ||
        evidence.manifestHandler !== manifest.handler ||
        evidence.destination !== manifest.destination ||
        !pairAuditInt(evidence.exit, 0, 1) ||
        !pairAuditString(evidence.resultCode, 4096) ||
        !root(evidence.logicalOutputRoot) ||
        !pairAuditInt(evidence.outputByteLength, 1,
          evidence.exit === 0 ? 4096 : 256) ||
        !root(evidence.handlerSourceRoot) || !root(evidence.dispatcherSourceRoot) ||
        !root(evidence.effectPolicyRoot) ||
        !root(evidence.beforeRoot) || !root(evidence.afterRoot) ||
        !pairAuditInt(evidence.beforePathCount, 1, 100_000) ||
        !pairAuditInt(evidence.afterPathCount, 1, 100_000) ||
        !Array.isArray(evidence.eventLocations) ||
        evidence.eventLocations.length > 128 ||
        evidence.eventLocations.some((location: unknown) =>
          !pairAuditRepositoryLocation(location)) ||
        canonicalV138ReviewerV3(evidence.eventLocations) !==
          canonicalV138ReviewerV3([...new Set(evidence.eventLocations)].sort()) ||
        !Array.isArray(evidence.changedLocations) ||
        evidence.changedLocations.length > 128 ||
        evidence.changedLocations.some((location: unknown) =>
          !pairAuditRepositoryLocation(location)) ||
        canonicalV138ReviewerV3(evidence.changedLocations) !==
          canonicalV138ReviewerV3([...new Set(evidence.changedLocations)].sort()) ||
        !Array.isArray(evidence.commandEvents) ||
        !pairAuditInt(evidence.commandEvents.length, 1, 256) ||
        evidence.commandEvents.some((event: any, eventOrdinal: number) =>
          !pairAuditRecord(event, ["ordinal", "event", "location", "changed",
            "resultRoot"]) ||
          !pairAuditInt(event.ordinal, 0, 100_000) ||
          (eventOrdinal > 0 && event.ordinal <=
            evidence.commandEvents[eventOrdinal - 1].ordinal) ||
          !pairAuditString(event.event, 512) ||
          !(event.event.startsWith(`${manifest.command}:`) ||
            event.event === `execute:${evidence.handler}`) ||
          !pairAuditRepositoryLocation(event.location) ||
          typeof event.changed !== "boolean" || !root(event.resultRoot) ||
          canonicalV138ReviewerV3(event) !== canonicalV138ReviewerV3((() => {
            const ledger = run.eventLedger[event.ordinal]
            return ledger === undefined ? null : { ordinal: ledger.ordinal,
              event: ledger.event, location: ledger.location,
              changed: ledger.changed, resultRoot: ledger.resultRoot }
          })())) ||
        canonicalV138ReviewerV3(evidence.eventLocations) !==
          canonicalV138ReviewerV3([...new Set(evidence.commandEvents.map(
            ({ location }: any) => location))].sort()) ||
        canonicalV138ReviewerV3(evidence.changedLocations) !==
          canonicalV138ReviewerV3([...new Set(evidence.commandEvents.filter(
            ({ changed }: any) => changed).map(({ location }: any) => location))].sort()) ||
        evidence.commandEvents.at(-1)?.event !== `execute:${evidence.handler}` ||
        evidence.eventEvidenceRoot !== identityRootV138ReviewerV3("evidenceBundle",
          "v1.38-plan-262-61-route-event-evidence-v1", evidence.commandEvents) ||
        evidence.logicalRouteIdentityRoot !== routeAudit.logicalRouteIdentityRoot ||
        !root(routeAudit.physicalRouteIdentityRoot) ||
        !root(routeAudit.logicalRouteIdentityRoot))
        fail("V138_PLAN_262_61_PAIR_AUDIT_ROUTE_INVALID")
      const physicalBody = routeAudit.physicalRouteIdentityBody
      const logicalBody = routeAudit.logicalRouteIdentityBody
      const bodyKeys = ["schemaVersion", "command", "handler", "manifestHandler",
        "handlerSourceRoot", "dispatcherSourceRoot", "resultCode",
        "physicalOutputRoot", "logicalOutputRoot", "identities"]
      const identityKeys = ["sourceA9", "logicalSourceB9", "physicalSourceB9",
        "authorizationRoot", "sealRoot"]
      if (!pairAuditRecord(physicalBody, bodyKeys) ||
        !pairAuditRecord(logicalBody, bodyKeys) ||
        !pairAuditRecord(physicalBody.identities, identityKeys) ||
        !pairAuditRecord(logicalBody.identities, identityKeys) ||
        physicalBody.schemaVersion !==
          "v1.38-plan-262-61-physical-route-identity-v1" ||
        logicalBody.schemaVersion !==
          "v1.38-plan-262-61-logical-route-identity-v1" ||
        physicalBody.command !== manifest.command || logicalBody.command !==
          manifest.command || physicalBody.handler !== evidence.handler ||
        logicalBody.handler !== evidence.handler ||
        physicalBody.manifestHandler !== manifest.handler ||
        logicalBody.manifestHandler !== manifest.handler ||
        physicalBody.handlerSourceRoot !== evidence.handlerSourceRoot ||
        logicalBody.handlerSourceRoot !== evidence.handlerSourceRoot ||
        physicalBody.dispatcherSourceRoot !== evidence.dispatcherSourceRoot ||
        logicalBody.dispatcherSourceRoot !== evidence.dispatcherSourceRoot ||
        physicalBody.resultCode !== evidence.resultCode ||
        logicalBody.resultCode !== evidence.resultCode ||
        physicalBody.logicalOutputRoot !== evidence.logicalOutputRoot ||
        logicalBody.logicalOutputRoot !== evidence.logicalOutputRoot ||
        logicalBody.physicalOutputRoot !== evidence.logicalOutputRoot ||
        physicalBody.physicalOutputRoot !== projections.get(
          `route-output:${manifest.command}`)?.physical ||
        evidence.logicalOutputRoot !== projections.get(
          `route-output:${manifest.command}`)?.logical ||
        canonicalV138ReviewerV3(physicalBody.identities) !==
          canonicalV138ReviewerV3({ sourceA9: SOURCE_A9,
            logicalSourceB9: run.logicalCustody.sourceB9,
            physicalSourceB9: run.executionSourceB9,
            authorizationRoot: detachedCommitment.authorizationRoot,
            sealRoot: detachedCommitment.sealRoot }) ||
        canonicalV138ReviewerV3(logicalBody.identities) !==
          canonicalV138ReviewerV3({ sourceA9: SOURCE_A9,
            logicalSourceB9: run.logicalCustody.sourceB9,
            physicalSourceB9: run.logicalCustody.sourceB9,
            authorizationRoot: run.logicalCustody.authorizationRoot,
            sealRoot: run.logicalCustody.sealRoot }) ||
        routeAudit.physicalRouteIdentityRoot !== identityRootV138ReviewerV3(
          "evidenceBundle", String(physicalBody.schemaVersion), physicalBody) ||
        routeAudit.logicalRouteIdentityRoot !== identityRootV138ReviewerV3(
          "evidenceBundle", String(logicalBody.schemaVersion), logicalBody))
        fail("V138_PLAN_262_61_PAIR_AUDIT_ROUTE_INVALID")
    }

    const routeEvidenceByCommand = new Map(run.routeEvidence.map((entry: any) =>
      [entry.command, entry]))
    for (const projection of run.projectionLedger) {
      const label = String(projection.label)
      let command: string | null = null
      let kind: "output" | "obstruction" | "derived" | "reservation" |
        "persisted" | null = null
      if (label.startsWith("route-output:")) {
        kind = "output"; command = label.slice("route-output:".length)
      } else if (label.startsWith("route-obstruction-metadata:")) {
        kind = "obstruction"
        command = label.slice("route-obstruction-metadata:".length)
      } else if (label.startsWith("route-derived-root:")) {
        kind = "derived"
        const value = label.slice("route-derived-root:".length)
        command = value.slice(0, value.lastIndexOf(":"))
      } else if (label.startsWith("route-reservation-claim:")) {
        kind = "reservation"
        command = label.slice("route-reservation-claim:".length)
      } else if (label.startsWith("route-persisted-receipt:")) {
        kind = "persisted"
        command = label.slice("route-persisted-receipt:".length)
      }
      if (kind === null) continue
      const evidence = routeEvidenceByCommand.get(command!)
      const manifest = V138_REVIEW_V3_ROUTE_MANIFEST.find(entry =>
        entry.command === command)
      if (evidence === undefined || manifest === undefined ||
        (kind === "output" && (projection.physical !== run.routeIdentityAudits[
          V138_REVIEW_V3_ROUTE_MANIFEST.indexOf(manifest)]
          .physicalRouteIdentityBody.physicalOutputRoot ||
          projection.logical !== evidence.logicalOutputRoot)) ||
        (kind === "obstruction" && ![
          "--resolve-plan-262-57-pre-start-v1",
          "--check-plan-262-57-pre-start-obstruction-v1",
        ].includes(command!)) ||
        (kind === "derived" && ![
          "--resolve-plan-262-57-pre-start-v1",
          "--check-plan-262-57-pre-start-obstruction-v1",
          "--write-execution-context-v11-receipt",
          "--write-plan-262-57-route-start-v1",
          "--write-headroom-preflight-v11-receipt",
        ].includes(command!)) ||
        (kind === "persisted" && (!evidence.eventLocations.includes(
          manifest.destination) || !evidence.changedLocations.includes(
          manifest.destination))) ||
        (kind === "reservation" && (!evidence.eventLocations.includes(
          ROUTE_RESERVATION_CLAIM) || !evidence.changedLocations.includes(
          ROUTE_RESERVATION_CLAIM))))
        fail("V138_PLAN_262_61_PAIR_AUDIT_PROJECTION_INVALID")
    }
  }
  const leftPhysicalCommitments = audit.runs[0].physicalCommitments
  const rightPhysicalCommitments = audit.runs[1].physicalCommitments
  if (audit.runs[0].executionSourceB9 === audit.runs[1].executionSourceB9 ||
    leftPhysicalCommitments.some((left: any) => rightPhysicalCommitments.some(
      (right: any) => left.locationCommitment === right.locationCommitment ||
        left.filesystemIdentityCommitment === right.filesystemIdentityCommitment)))
    fail("V138_PLAN_262_61_PAIR_AUDIT_REUSE_INVALID")
  if (canonicalV138ReviewerV3(audit.runs[0].logicalPublicationEvidence) !==
      canonicalV138ReviewerV3(audit.runs[1].logicalPublicationEvidence) ||
    ["commit", "tree", "reviewBlob", "reviewRoot"].some(key =>
      audit.runs[0].physicalPublicationEvidence[key] ===
        audit.runs[1].physicalPublicationEvidence[key]))
    fail("V138_PLAN_262_61_PAIR_AUDIT_PUBLICATION_REUSE_INVALID")
  const leftClones = leftPhysicalCommitments.slice(1, 5)
  const rightClones = rightPhysicalCommitments.slice(1, 5)
  if (leftClones.length !== rightClones.length || leftClones.some(
    (entry: any, index: number) => entry.group !== rightClones[index]?.group))
    fail("V138_PLAN_262_61_PAIR_AUDIT_REUSE_INVALID")
  const expectedLogical = audit.runs[0].projectionLedger.map(
    ({ ordinal, label, logical, projected, independentlyValidated }: any) =>
      ({ ordinal, label, logical, projected, independentlyValidated }))
  if (canonicalV138ReviewerV3(expectedLogical) !==
      canonicalV138ReviewerV3(audit.logicalProjectionManifest) ||
    canonicalV138ReviewerV3(expectedLogical) !== canonicalV138ReviewerV3(
      audit.runs[1].projectionLedger.map(
        ({ ordinal, label, logical, projected, independentlyValidated }: any) =>
          ({ ordinal, label, logical, projected, independentlyValidated }))) ||
    !Array.isArray(audit.logicalProjectionManifest) ||
    audit.logicalProjectionManifest.length !==
      V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS.length ||
    audit.logicalProjectionManifest.some((entry: any, ordinal: number) =>
      !pairAuditRecord(entry, ["ordinal", "label", "logical", "projected",
        "independentlyValidated"]) || entry.ordinal !== ordinal ||
      entry.label !== V138_PLAN_262_61_PHYSICAL_PROJECTION_LABELS[ordinal] ||
      !pairAuditProjectionValue(entry.logical) || typeof entry.projected !== "boolean" ||
      entry.independentlyValidated !== true) ||
    audit.logicalProjectionRoot !== identityRootV138ReviewerV3("artifactManifest",
      "v1.38-plan-262-61-logical-projection-manifest-v2",
      audit.logicalProjectionManifest))
    fail("V138_PLAN_262_61_PAIR_AUDIT_PROJECTION_INVALID")
  const { pairAuditRoot, ...body } = audit
  if (pairAuditRoot !== identityRootV138ReviewerV3("evidenceBundle",
    String(body.schemaVersion), body))
    fail("V138_PLAN_262_61_PAIR_AUDIT_ROOT_INVALID")
  return true
}

export const deterministicRouteCustody = (route: any, pairAudit?: any) => {
  const observations = route.observations.map((value: RouteObservation) => {
    if (!root(value.outputRoot) || value.outputByteLength <= 0 ||
      value.outputByteLength > (value.exit === 0 ? 4096 : 256) ||
      !root(value.callTraceRoot) || !root(value.functionRangeRoot) ||
      value.callCount !== 1 || !root(value.effectPolicyRoot) ||
      !root(value.routeIdentityRoot))
      fail("V138_PLAN_262_61_ROUTE_PROOF_BOUNDS_INVALID")
    return Object.freeze({ command: value.command, handler: value.handler,
      manifestHandler: value.manifestHandler, aliasAudit: value.aliasAudit,
      sourceFinding: value.sourceFinding, destination: value.destination,
      argv: value.argv, exit: value.exit, outputRoot: value.outputRoot,
      outputByteLength: value.outputByteLength, resultCode: value.resultCode,
      observedDisposition: value.observedDisposition,
      handlerSourceRoot: value.handlerSourceRoot,
      dispatcherSourceRoot: value.dispatcherSourceRoot,
      functionRangeRoot: value.functionRangeRoot, callCount: value.callCount,
      callTraceRoot: value.callTraceRoot, effectPolicyRoot: value.effectPolicyRoot,
      routeIdentityRoot: value.routeIdentityRoot,
      beforeRoot: value.beforeRoot, afterRoot: value.afterRoot,
      beforePathCount: value.beforePathCount, afterPathCount: value.afterPathCount,
      eventPaths: value.eventPaths, changedLocations: value.changedLocations })
  })
  const publication = (value: any) => Object.freeze({
    semanticEvidenceEligible: value.semanticEvidenceEligible,
    commit: value.commit, parent: value.parent, tree: value.tree,
    changedLocations: value.changedLocations, reviewBlob: value.reviewBlob,
    reviewRoot: value.reviewRoot, reviewByteLength: value.reviewByteLength,
    reportBlob: value.reportBlob, reportRoot: value.reportRoot,
    reportByteLength: value.reportByteLength })
  const logicalEvents = route.events.map(({ physicalResult: _physicalResult,
    ...logicalEvent }: any) => Object.freeze(logicalEvent))
  return Object.freeze({ schemaVersion:
    "v1.38-plan-262-61-complete-route-custody-v3",
  b9: Object.freeze({ ...route.b9Custody }),
  observations: Object.freeze(observations),
  events: Object.freeze(logicalEvents), snapshots: route.snapshots,
  cleanup: { complete: route.cleanup.complete,
    residualPaths: route.cleanup.residualPaths },
  logicalInputCustody: route.logicalInputCustody,
  prerequisitePublication: publication(route.syntheticPrerequisitePublication),
  logicalPostExecutionPublication: Object.freeze({
    ...route.logicalPostExecutionPublication }),
  ...(pairAudit === undefined ? {} : { pairAudit }) })
}

export const validateV138Plan26261SemanticEventPair = (
  leftEvents: readonly any[], rightEvents: readonly any[]) => {
  if (leftEvents.length === 0 || leftEvents.length !== rightEvents.length)
    fail("V138_PLAN_262_61_SEMANTIC_EVENT_PAIR_INVALID")
  let physicalDifferenceCount = 0
  for (const [ordinal, left] of leftEvents.entries()) {
    const right = rightEvents[ordinal]
    if (left.physicalResult !== right?.physicalResult) physicalDifferenceCount += 1
    const { physicalResult: _leftPhysical, ...leftLogical } = left
    const { physicalResult: _rightPhysical, ...rightLogical } = right ?? {}
    if (canonicalV138ReviewerV3(leftLogical) !==
        canonicalV138ReviewerV3(rightLogical))
      fail("V138_PLAN_262_61_SEMANTIC_EVENT_LOGICAL_MISMATCH")
  }
  if (physicalDifferenceCount === 0)
    fail("V138_PLAN_262_61_SEMANTIC_EVENT_PHYSICAL_REUSE")
  return true
}

export const normalizedPlan26262ReportContentRoot = (bytes: Buffer | string) => {
  const text = (Buffer.isBuffer(bytes) ? bytes.toString("utf8") : bytes)
    .replace(/\r\n?/gu, "\n")
  const normalized = text.replace(
    /```plan-262-62-review-v3-report-json\n[^\n]*\n```/gu,
    "```plan-262-62-review-v3-report-json\n<binding>\n```")
    .split("\n").map(line => line.replace(/[ \t]+$/u, "")).join("\n").trimEnd() + "\n"
  return sha256V138ReviewerV3(normalized)
}

export const validatePlan26262ReportManifest = (candidate: unknown,
  expected: unknown) => {
  const left = structuredClone(candidate) as any
  const right = structuredClone(expected) as any
  const candidateCopies = [left?.completeRouteCustody?.pairAudit,
    left?.custody?.completeRouteCustody?.pairAudit]
  const expectedCopies = [right?.completeRouteCustody?.pairAudit,
    right?.custody?.completeRouteCustody?.pairAudit]
  const expectedHasPair = expectedCopies.some(value => value !== undefined)
  if (expectedHasPair) {
    if (expectedCopies.some(value => value === undefined) ||
      candidateCopies.some(value => value === undefined))
      fail("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")
    for (const audit of [...expectedCopies, ...candidateCopies]) {
      try {
        validateV138Plan26261PairAudit(audit)
      } catch {
        fail("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")
      }
    }
    const immutablePairBytes = canonicalV138ReviewerV3(expectedCopies[0])
    if ([...expectedCopies, ...candidateCopies].some(audit =>
      canonicalV138ReviewerV3(audit) !== immutablePairBytes))
      fail("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")
  } else if (candidateCopies.some(value => value !== undefined) ||
    expectedCopies.some(value => value !== undefined))
    fail("V138_PLAN_262_62_REVIEW_REPORT_PAIR_AUDIT_INVALID")
  if (canonicalV138ReviewerV3(left) !== canonicalV138ReviewerV3(right))
    fail("V138_PLAN_262_62_REVIEW_REPORT_BINDING_INVALID")
  return true
}

export const deriveExpectedPlan26262ReviewFresh = async (rootPath: string) => {
  const source = inspectV138Plan26261A9Custody(rootPath)
  const predecessors = inspectV138Plan26261Predecessors(rootPath)
  const convergence = inspectV138Plan26261SummaryConvergence(rootPath)
  const protectedHistory = inspectV138Plan26261ProtectedHistory(rootPath)
  const lifecycle = inspectV138Plan26261Lifecycle(rootPath)
  const sealModule = await import("./lib/" + "v1-38-successor-source-seal.js") as
    Record<string, any>
  const inspectSource = sealModule["inspectV138SourceA9Custody"] as Function
  if (typeof inspectSource !== "function")
    fail("V138_PLAN_262_61_SHARED_SOURCE_INSPECTOR_INVALID")
  const sharedSource = inspectSource(rootPath,
    { sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9 })
  const sourceCustody = { tree: sharedSource.sourceA9Tree,
    parent: sharedSource.sourceA9Parent, authorRun: SOURCE_A9_RUN,
    paths: sharedSource.sourceA9Paths, blobs: sharedSource.sourceA9Blobs,
    deletionHistory: sharedSource.deletionHistory }
  const protectedObservation = { root: protectedHistory.protectedHistoryRoot,
    protectedA8: SOURCE_A9, protectedRoots: protectedHistory.protectedRoots }
  const hookBefore = routeExecutionHookCount
  const { left: route, right: routeRepeat } =
    await observeV138Plan26261RouteDispatchPair(rootPath)
  if (routeExecutionHookCount !== hookBefore + 2)
    fail("V138_PLAN_262_62_REVIEW_FRESH_OBSERVATION_INVALID")
  const document = assembleExpectedPlan26262Review({ sourceCustody,
    protectedHistory: protectedObservation, chargeIds: protectedHistory.chargeIds,
    priorAuthorizationBytes: protectedHistory.authorizations,
    snapshots: route.snapshots, orderedEvents: route.events })
  const repeatedDocument = assembleExpectedPlan26262Review({ sourceCustody,
    protectedHistory: protectedObservation, chargeIds: protectedHistory.chargeIds,
    priorAuthorizationBytes: protectedHistory.authorizations,
    snapshots: routeRepeat.snapshots, orderedEvents: routeRepeat.events })
  if (canonicalV138ReviewerV3(document) !== canonicalV138ReviewerV3(repeatedDocument) ||
    canonicalV138ReviewerV3(deterministicRouteCustody(route)) !==
      canonicalV138ReviewerV3(deterministicRouteCustody(routeRepeat)))
    fail("V138_PLAN_262_62_REVIEW_NONDETERMINISTIC")
  const reviewerConvergence = inspectReviewerConvergence(rootPath)
  const pairAudit = buildV138Plan26261PairAudit(route, routeRepeat)
  validateV138Plan26261PairAudit(pairAudit)
  const completeRouteCustody = deterministicRouteCustody(route, pairAudit)
  const custody = Object.freeze({ schemaVersion:
    "v1.38-plan-262-62-review-v3-custody-wrapper-v2",
  source: { sourceBase9: SOURCE_BASE9, sourceA9: SOURCE_A9 },
  predecessors, plan60Convergence: convergence, lifecycle,
  reviewedR3: reviewerConvergence.sourceR3,
  terminalReview: { path: reviewerConvergence.codeReviewPath,
    root: reviewerConvergence.codeReviewRoot,
    commit: reviewerConvergence.codeReviewCommit,
    blob: reviewerConvergence.codeReviewBlob },
  reviewFix: { root: reviewerConvergence.reviewFixRoot,
    commit: reviewerConvergence.reviewFixCommit,
    blob: reviewerConvergence.reviewFixBlob },
  reviewV3Root: document.reviewV3Root,
  completeRouteCustody })
  return Object.freeze({ source, predecessors, convergence, protectedHistory,
    lifecycle, route, document, sourceCustody, protectedObservation,
    reviewerConvergence, custody, completeRouteCustody,
    b9: { sourceB9: route.sourceB9, publicationCommit: route.publicationCommit,
      changedPaths: route.b9ChangedPaths,
      prerequisitePublication: route.syntheticPrerequisitePublication },
    publication: route.postExecutionPublication })
}

export const inspectPlan26262Review = async (rootPath: string, reviewPath: string,
  reportPath: string, committed: boolean) => {
  if (reviewPath !== PLAN_62_REVIEW || reportPath !== PLAN_62_REPORT)
    fail("V138_PLAN_262_61_PATH_CONFINEMENT_INVALID")
  const expected = await deriveExpectedPlan26262ReviewFresh(rootPath)
  const reviewRead = readRepositoryFile(rootPath, reviewPath, reviewPath)
  const reportRead = readRepositoryFile(rootPath, reportPath, reportPath)
  let document: Record<string, any>
  try { document = JSON.parse(reviewRead.bytes.toString("utf8")) } catch {
    fail("V138_PLAN_262_62_REVIEW_SCHEMA_INVALID")
  }
  const findings = expected.route.observations.filter(
    ({ exit, sourceFinding }: RouteObservation) => exit !== 0 || sourceFinding !== null)
  if (findings.length !== 0)
    fail("V138_PLAN_262_62_REVIEW_OBSERVATION_FINDINGS")
  validatePlan26262ReviewAgainstExpected(document, expected.document)
  if (document.verdict?.findingCount !== 0 ||
    document.verdict?.sourceCompletenessPassed !== true ||
    document.verdict?.authorizesExecution !== false)
    fail("V138_PLAN_262_62_REVIEW_FINDINGS_INVALID")
  let immutable: Record<string, unknown> = {}
  if (committed) {
    const review = committedCurrentFile(rootPath, reviewPath,
      "V138_PLAN_262_62_REVIEW_COMMIT_INVALID")
    const report = committedCurrentFile(rootPath, reportPath,
      "V138_PLAN_262_62_REVIEW_COMMIT_INVALID")
    if (review.commit !== report.commit ||
      canonicalV138ReviewerV3(changedPaths(rootPath, review.commit)) !==
        canonicalV138ReviewerV3([reviewPath, reportPath].sort()))
      fail("V138_PLAN_262_62_REVIEW_COMMIT_INVALID")
    const parent = lines(git(rootPath, ["show", "-s", "--format=%P", review.commit]))
    if (parent.length !== 1 || !lines(git(rootPath,
      ["rev-list", "--first-parent", review.commit])).includes(SOURCE_A9))
      fail("V138_PLAN_262_62_REVIEW_COMMIT_INVALID")
    const reportBinding = /```plan-262-62-review-v3-report-json\n([^\n]+)\n```/u
      .exec(reportRead.bytes.toString("utf8"))
    let reportManifest: Record<string, unknown>
    try { reportManifest = JSON.parse(reportBinding?.[1] ?? "") as
      Record<string, unknown> } catch {
      fail("V138_PLAN_262_62_REVIEW_REPORT_BINDING_INVALID")
    }
    const expectedReport = { schemaVersion:
      "v1.38-plan-262-62-review-v3-report-binding-v1",
    reviewPath, reviewRoot: review.root, reviewV3Root: document.reviewV3Root,
    sourceA9: SOURCE_A9, findingCount: 0, sourceCompletenessPassed: true,
    identityClaims: document.identityClaims, authorizesExecution: false,
    completeRouteCustody: expected.completeRouteCustody,
    custody: expected.custody,
    normalizedReportContentRoot: normalizedPlan26262ReportContentRoot(
      reportRead.bytes) }
    validatePlan26262ReportManifest(reportManifest, expectedReport)
    immutable = { commit: review.commit, parent: parent[0],
      tree: git(rootPath, ["rev-parse", `${review.commit}^{tree}`]),
      reviewBlob: review.blob, reportBlob: report.blob,
      reportRoot: report.root }
  }
  return Object.freeze({ document, reviewRoot: sha256V138ReviewerV3(reviewRead.bytes),
    ...immutable })
}

export const runV138Plan26261ReviewerCli = async (rootPath: string,
  argv: readonly string[]) => {
  if (argv.length === 1 && argv[0] === "--derive-no-publish") {
    process.stdout.write(`${canonicalV138ReviewerV3(
      await deriveV138Plan26261NoPublish(rootPath))}\n`)
    return
  }
  if (argv.length === 1 && argv[0] === "--check-reviewer-convergence") {
    const value = inspectReviewerConvergence(rootPath)
    process.stdout.write(`reviewer-converged sourceR3=${value.sourceR3.commit} ` +
      `codeReviewPath=${value.codeReviewPath} codeReviewRoot=${value.codeReviewRoot} ` +
      `reviewFixRoot=${value.reviewFixRoot}\n`)
    return
  }
  if (argv[0] === "--render-r3-author-receipt") {
    requireExactArgv(argv, ["--render-r3-author-receipt", "--agent-history",
      ".planning/agent-history.json"])
    const historyRead = readRepositoryFile(rootPath, ".planning/agent-history.json",
      ".planning/agent-history.json")
    const snapshot = boundedAgentHistory(parseAgentHistoryBytes(historyRead.bytes))
    const history = selectCompletedAgentHistory(snapshot, "262", "61")
    const convergence = inspectReviewerConvergence(rootPath)
    const body = { schemaVersion: "v1.38-plan-262-61-r3-author-tracking-v1",
      r3AuthorAgent: history.agentId, phase: history.phase, plan: history.plan,
      completionTimestamp: history.completionTimestamp,
      historyEntryRoot: receiptEntryRoot(history),
      agentHistorySnapshot: snapshot, agentHistoryRoot: agentHistoryRoot(snapshot),
      sourceR3: convergence.sourceR3.commit,
      codeReviewPath: convergence.codeReviewPath,
      codeReviewRoot: convergence.codeReviewRoot,
      reviewFixRoot: convergence.reviewFixRoot }
    process.stdout.write(`${canonicalV138ReviewerV3(body)}\n`)
    return
  }
  if (argv[0] === "--check-r3-author-receipt") {
    requireExactArgv(argv, ["--check-r3-author-receipt", "--receipt",
      PLAN_61_RECEIPT])
    inspectV138Plan26261Receipt(rootPath, PLAN_61_RECEIPT)
    process.stdout.write("r3-author-receipt-valid\n")
    return
  }
  if (argv[0] === "--derive-agent-separation") {
    requireExactArgv(argv, ["--derive-agent-separation", "--author-receipt",
      PLAN_61_RECEIPT, "--agent-history", ".planning/agent-history.json"])
    const value = deriveV138Plan26262AgentSeparation(rootPath, PLAN_61_RECEIPT,
      ".planning/agent-history.json")
    process.stdout.write(`agent-separation r3AuthorAgent=${value.r3AuthorAgent} ` +
      `reviewAgent=${value.reviewAgent}\n`)
    return
  }
  if (argv[0] === "--check-review-v3") {
    requireExactArgv(argv, ["--check-review-v3", "--review", PLAN_62_REVIEW,
      "--report", PLAN_62_REPORT])
    await inspectPlan26262Review(rootPath, PLAN_62_REVIEW, PLAN_62_REPORT, true)
    process.stdout.write("plan-262-62-review-v3-valid\n")
    return
  }
  if (argv[0] === "--check-summary-candidate" || argv[0] === "--check-summary") {
    requireExactArgv(argv, [argv[0]!, "--summary", PLAN_62_SUMMARY,
      "--author-receipt", PLAN_61_RECEIPT, "--agent-history",
      ".planning/agent-history.json", "--review", PLAN_62_REVIEW,
      "--report", PLAN_62_REPORT])
    if (argv[0] === "--check-summary-candidate")
      enableCandidateCleanliness(PLAN_62_SUMMARY)
    const separation = deriveV138Plan26262AgentSeparation(rootPath, PLAN_61_RECEIPT,
      ".planning/agent-history.json")
    const receipt = inspectV138Plan26261Receipt(rootPath, PLAN_61_RECEIPT)
    const review = await inspectPlan26262Review(rootPath, PLAN_62_REVIEW,
      PLAN_62_REPORT, true)
    const summaryRead = readRepositoryFile(rootPath, PLAN_62_SUMMARY, PLAN_62_SUMMARY)
    const match = /```plan-262-62-summary-json\n([^\n]+)\n```/u.exec(
      summaryRead.bytes.toString("utf8"))
    let manifest: Record<string, unknown>
    try { manifest = JSON.parse(match?.[1] ?? "") as Record<string, unknown> } catch {
      fail("V138_PLAN_262_62_SUMMARY_SCHEMA_INVALID")
    }
    const expected = { schemaVersion: "v1.38-plan-262-62-summary-v2",
      authors: { r3: { agentId: separation.r3AuthorAgent,
        completionTimestamp: separation.r3CompletionTimestamp,
        historyEntryRoot: separation.r3HistoryEntryRoot },
      reviewer: { agentId: separation.reviewAgent,
        completionTimestamp: separation.reviewCompletionTimestamp,
        historyEntryRoot: separation.reviewerHistoryEntryRoot,
        historyRoot: separation.agentHistoryRoot } },
      sourceR3: receipt.convergence.sourceR3,
      authorReceipt: { path: PLAN_61_RECEIPT, commit: receipt.receiptCommit,
        blob: receipt.receiptBlob, root: receipt.receiptRoot,
        historyRoot: receipt.receipt.agentHistoryRoot },
      convergence: { codeReviewPath: receipt.convergence.codeReviewPath,
        codeReviewRoot: receipt.convergence.codeReviewRoot,
        reviewFixRoot: receipt.convergence.reviewFixRoot },
      reviewPublication: { reviewPath: PLAN_62_REVIEW, reportPath: PLAN_62_REPORT,
        commit: review.commit, parent: review.parent, tree: review.tree,
        reviewBlob: review.reviewBlob, reviewRoot: review.reviewRoot,
        reviewV3Root: review.document.reviewV3Root, reportBlob: review.reportBlob,
        reportRoot: review.reportRoot },
      identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
        externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
        independentCustodyClaimed: false },
      eligibility: { plan26256: true, admit03: false },
      downstreamAuthority: { execution: false, candidate: false, formation: false,
        holdoutOpening: false, public: false, production: false, live: false } }
    validatePlan26262Summary(manifest, expected)
    if (argv[0] === "--check-summary") {
      const immutable = committedCurrentFile(rootPath, PLAN_62_SUMMARY,
        "V138_PLAN_262_62_SUMMARY_COMMIT_INVALID")
      if (canonicalV138ReviewerV3(changedPaths(rootPath, immutable.commit)) !==
        canonicalV138ReviewerV3([PLAN_62_SUMMARY]))
        fail("V138_PLAN_262_62_SUMMARY_COMMIT_INVALID")
    }
    process.stdout.write("plan-262-62-summary-valid\n")
    return
  }
  if (argv.length === 1 && argv[0] === "--check-main-readiness") {
    const before = snapshotReadiness(rootPath)
    assertV138Plan26261NoCrashLeak(before)
    if (before.status !== "" || before.destinations.some(({ path: repoPath, type }) =>
      repoPath !== PLAN_61_RECEIPT && type !== "absent") ||
      before.hooks.routeExecutionHookCount !== 0 ||
      before.hooks.candidateDerivationHookCount !== 0)
      fail("V138_PLAN_262_61_MAIN_NOT_READY")
    const { receipt, convergence } = inspectV138Plan26261Receipt(rootPath, PLAN_61_RECEIPT)
    const after = snapshotReadiness(rootPath)
    if (before.root !== after.root) fail("V138_PLAN_262_61_READINESS_SIDE_EFFECT")
    process.stdout.write(`ready-main-review-v3 r3AuthorAgent=${receipt.r3AuthorAgent} ` +
      `sourceR3=${convergence.sourceR3.commit} codeReviewRoot=${convergence.codeReviewRoot} ` +
      `reviewFixRoot=${convergence.reviewFixRoot}\n`)
    return
  }
  if (argv[0] === "--check-plan-61-summary-candidate" ||
    argv[0] === "--check-plan-61-summary") {
    requireExactArgv(argv, [argv[0]!, "--summary", PLAN_61_SUMMARY,
      "--receipt", PLAN_61_RECEIPT])
    if (argv[0] === "--check-plan-61-summary-candidate")
      enableCandidateCleanliness(PLAN_61_SUMMARY)
    const summaryPath = PLAN_61_SUMMARY
    const { receipt, convergence, receiptCommit, receiptBlob, receiptRoot } =
      inspectV138Plan26261Receipt(rootPath, PLAN_61_RECEIPT)
    const bytes = readRepositoryFile(rootPath, summaryPath, summaryPath).bytes
    const text = bytes.toString("utf8")
    const manifestMatch = /```plan-262-61-summary-json\n([^\n]+)\n```/u.exec(text)
    if (!manifestMatch) fail("V138_PLAN_262_61_SUMMARY_SCHEMA_INVALID")
    let manifest: unknown
    try { manifest = JSON.parse(manifestMatch[1]!) } catch {
      fail("V138_PLAN_262_61_SUMMARY_SCHEMA_INVALID")
    }
    const expected = { schemaVersion: "v1.38-plan-262-61-summary-v1",
      r3AuthorAgent: receipt.r3AuthorAgent,
      completionTimestamp: receipt.completionTimestamp,
      sourceR3: convergence.sourceR3.commit, sourceR3Tree: convergence.sourceR3.tree,
      sourceR3Parent: convergence.sourceR3.parent,
      codeReviewPath: convergence.codeReviewPath,
      codeReviewRoot: convergence.codeReviewRoot,
      reviewFixRoot: convergence.reviewFixRoot, receiptPath: PLAN_61_RECEIPT,
      receiptCommit, receiptBlob, receiptRoot,
      independentPersonClaimed: false, reviewerSeparated: false,
      independentCustodyClaimed: false, authorizesPlan26262: false,
      authorizesExecution: false }
    if (canonicalV138ReviewerV3(manifest) !== canonicalV138ReviewerV3(expected))
      fail("V138_PLAN_262_61_SUMMARY_BINDING_INVALID")
    if (argv[0] === "--check-plan-61-summary") {
      const immutable = committedCurrentFile(rootPath, summaryPath,
        "V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
      if (canonicalV138ReviewerV3(changedPaths(rootPath, immutable.commit)) !==
        canonicalV138ReviewerV3([summaryPath]))
        fail("V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
    }
    process.stdout.write("plan-262-61-summary-valid\n")
    return
  }
  fail("V138_PLAN_262_61_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runV138Plan26261ReviewerCli(repoRoot, process.argv.slice(2)).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
