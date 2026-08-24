#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, closeSync, constants as fsConstants, existsSync, fstatSync, lstatSync,
  mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, realpathSync,
  rmSync, writeFileSync } from "node:fs"
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
const git = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
}).trim()
const gitBytes = (root: string, args: readonly string[]) => execFileSync("git", [...args], {
  cwd: root, maxBuffer: 64 * 1024 * 1024,
})
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
  if (git(rootPath, ["status", "--porcelain=v1", "--untracked-files=all"]) !== "")
    fail("V138_PLAN_262_61_REPOSITORY_DIRTY")
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
  const failureBytes = readRepositoryFile(rootPath, failurePath, failurePath).bytes
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
        reviewedSource || index > 0 && lines(git(rootPath,
          ["show", "-s", "--format=%P", reviewedSource]))[0] !==
            recordsParentCommit(rootPath, reports[index - 1]!.repoPath))
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
  if (trailer.length === 0) fail("V138_PLAN_262_61_R3_TRAILER_INVALID")
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
  destination: string; argv: readonly string[]; exit: number; outputRoot: string;
  resultCode: string; observedDisposition: string | null;
  outputByteLength: number; handlerSourceRoot: string; dispatcherSourceRoot: string;
  functionRangeRoot: string; callCount: number; callTraceRoot: string;
  beforeRoot: string; afterRoot: string;
  beforePathCount: number; afterPathCount: number; eventPaths: readonly string[];
  changedPaths: readonly string[] }>

const completeRouteInventoryPaths = (rootPath: string) => [...new Set([
  ...lines(git(rootPath, ["ls-files"])),
  ...lines(git(rootPath, ["status", "--porcelain=v1", "--untracked-files=all"]))
    .map(row => row.slice(3)).filter(Boolean),
  ...FORBIDDEN_DESTINATIONS,
    ".planning/artifacts/v1.38-plan-262-57-pre-start-obstruction-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-preflight-consumption-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-calibration-consumption-v1.json",
    ".planning/artifacts/v1.38-plan-262-57-reproduction-consumption-v1.json",
    ".planning/artifacts/.v1.38-plan-262-57-route-reservation-v1/claim.json",
  ])].sort()

const inspectorPost = <T>(session: Session, method: string,
  params?: Record<string, unknown>) => new Promise<T>((resolve, reject) =>
  session.post(method, params ?? {}, (error, result) => error ? reject(error) :
    resolve(result as T)))

const routeInventory = (rootPath: string) => {
  const physical = physicalRepoRoot(rootPath)
  const paths = completeRouteInventoryPaths(rootPath)
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
    return { path: repoPath, type: "file", mode: stat.mode & 0o777,
      uid: stat.uid, gid: stat.gid, nlink: stat.nlink,
      dev: String(stat.dev), ino: String(stat.ino), ctimeMs: stat.ctimeMs,
      mtimeMs: stat.mtimeMs, byteLength: bytes.byteLength,
      sha256: sha256V138ReviewerV3(bytes) }
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

type FsOperation = Readonly<{ ordinal: number; command: string; operation: string;
  path: string; detailRoot: string }>

const installRouteFsObserver = () => {
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
  const confined = (rootPath: string, value: unknown) => {
    const raw = value instanceof URL ? fileURLToPath(value) : String(value)
    const absolute = path.resolve(rootPath, raw)
    const physical = realpathSync(rootPath)
    if (absolute !== physical && !absolute.startsWith(`${physical}${path.sep}`))
      fail("V138_PLAN_262_61_ROUTE_FS_ESCAPE")
    return path.relative(physical, absolute).split(path.sep).join("/") || "."
  }
  for (const method of methods) fs[method] = function (...args: unknown[]) {
    const openFlags = method === "openSync" ? args[1] : null
    const mutatingOpen = typeof openFlags === "number" ?
      (openFlags & (fsConstants.O_WRONLY | fsConstants.O_RDWR | fsConstants.O_CREAT |
        fsConstants.O_TRUNC | fsConstants.O_APPEND)) !== 0 :
      typeof openFlags === "string" && /[wax+]/u.test(openFlags)
    const descriptorMethod = ["writeSync", "fsyncSync", "closeSync"].includes(method)
    const descriptorPath = descriptorMethod && typeof args[0] === "number" ?
      descriptors.get(args[0]) : undefined
    if (active !== null && (method !== "openSync" || mutatingOpen) &&
      (!descriptorMethod || descriptorPath !== undefined)) {
      const paths = descriptorMethod ? [descriptorPath] :
        ["renameSync", "linkSync", "symlinkSync", "copyFileSync"].includes(method) ?
          [args[0], args[1]] : [args[0]]
      for (const [index, candidate] of paths.entries()) {
        const repoPath = confined(active.root, candidate)
        active.records.push(Object.freeze({ ordinal: active.records.length,
          command: active.command,
          operation: paths.length === 2 ?
            `${method}:${index === 0 ? "from" : "to"}` : method,
          path: repoPath,
          detailRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3({ method,
            index, flags: method === "openSync" ? String(args[1]) : null })) }))
      }
    }
    const result = originals[method]!.apply(fs, args)
    if (method === "openSync" && typeof result === "number" && active !== null &&
      mutatingOpen) descriptors.set(result, confined(active.root, args[0]))
    if (method === "closeSync" && typeof args[0] === "number") descriptors.delete(args[0])
    return result
  }
  syncBuiltinESMExports()
  return Object.freeze({
    start(rootPath: string, command: string) {
      if (active !== null) fail("V138_PLAN_262_61_ROUTE_FS_OBSERVER_REENTRY")
      active = { root: realpathSync(rootPath), command, records: [] }
      descriptors.clear()
    },
    stop() {
      if (active === null) fail("V138_PLAN_262_61_ROUTE_FS_OBSERVER_INACTIVE")
      const result = Object.freeze([...active.records])
      active = null
      descriptors.clear()
      return result
    },
    restore() {
      active = null
      for (const method of methods) fs[method] = originals[method]
      syncBuiltinESMExports()
    },
  })
}

export const validateV138Plan26261RouteResult = (entry: Readonly<{
  command: string; terminalDisposition: string | null }>, exit: number,
  output: string) => {
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
  const stageSchemas: Record<string, string> = {
    "--write-execution-context-v11-receipt": "v1.38-plan-262-57-route-start-v1",
    "--write-plan-262-57-route-start-v1": "v1.38-plan-262-57-route-start-v1",
    "--write-headroom-preflight-v11-receipt":
      "v1.38-current-matrix-headroom-preflight-v11",
    "--calibrate-parallel-v11-receipt": "v1.38-current-matrix-calibration-v11",
    "--write-authoritative-v12-receipt": "v1.38-current-matrix-reproduction-v12",
  }
  if (Object.hasOwn(stageSchemas, entry.command) &&
    (canonicalV138ReviewerV3(Object.keys(parsed).sort()) !==
      canonicalV138ReviewerV3(["disposition", "receiptRoot", "schemaVersion"]) ||
      parsed.schemaVersion !== stageSchemas[entry.command] || !root(parsed.receiptRoot)))
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  if ((entry.command === "--write-plan-262-57-terminal-v1" ||
    entry.command === "--check-plan-262-57-terminal-v1") &&
    (canonicalV138ReviewerV3(Object.keys(parsed).sort()) !==
      canonicalV138ReviewerV3(["disposition", "terminalRoot"]) ||
      !root(parsed.terminalRoot))) fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  if (entry.command === "--check-plan-262-57-pre-execution-readiness-v1" &&
    parsed.schemaVersion !== "v1.38-plan-262-57-pre-execution-readiness-v1" ||
    (entry.command === "--resolve-plan-262-57-pre-start-v1" ||
      entry.command === "--check-plan-262-57-pre-start-obstruction-v1") &&
    parsed.schemaVersion !== "v1.38-plan-262-57-pre-start-obstruction-v1")
    fail("V138_PLAN_262_61_ROUTE_OUTPUT_SCHEMA_INVALID")
  const observedDisposition = typeof parsed.disposition === "string" ?
    parsed.disposition : null
  const allowed = entry.command === "--write-headroom-preflight-v11-receipt" ?
    ["preflight_admitted"] : entry.terminalDisposition === null ? [] :
      entry.terminalDisposition.split("|")
  if (observedDisposition !== null && !allowed.includes(observedDisposition) ||
    entry.command === "--write-headroom-preflight-v11-receipt" &&
      observedDisposition !== "preflight_admitted" ||
    entry.terminalDisposition === null && observedDisposition !== null)
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
  const events: Array<{ ordinal: number; event: string; path: string; result: string }> = []
  const cleanupObservation = { complete: false, residualPaths: [parent],
    parentRoot: sha256V138ReviewerV3(parent) }
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
    await inspectorPost(routeCoverageSession, "Profiler.enable")
    await inspectorPost(routeCoverageSession, "Profiler.startPreciseCoverage",
      { callCount: true, detailed: true })
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
    const routeModuleBlob = git(templateRoot, ["rev-parse",
      `${SOURCE_A9}:scripts/lib/v1-38-current-matrix-reproduction.ts`])
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
    execFileSync("git", ["-c", "user.name=Plan 262-61 Fixture", "-c",
      "user.email=plan-262-61@example.invalid", "commit", "--quiet", "-m",
      "test: synthetic disposable review publication"], { cwd: templateRoot })
    const publicationCommit = git(templateRoot, ["rev-parse", "HEAD"])
    const prerequisitePublication = Object.freeze({ semanticEvidenceEligible: false,
      commit: publicationCommit,
      parent: git(templateRoot, ["show", "-s", "--format=%P", publicationCommit]),
      tree: git(templateRoot, ["rev-parse", `${publicationCommit}^{tree}`]),
      changedPaths: Object.freeze(changedPaths(templateRoot, publicationCommit)),
      reviewBlob: git(templateRoot, ["rev-parse",
        `${publicationCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`]),
      reviewRoot: sha256V138ReviewerV3(canonicalBytes(review)),
      reportBlob: git(templateRoot, ["rev-parse",
        `${publicationCommit}:${V138_REVIEW_V3_REPORT_PATH}`]),
      reportRoot: sha256V138ReviewerV3(Buffer.from("# Disposable Plan 262-62 review\n")) })
    const detachedReview = path.join(realpathSync(parent),
      path.basename(V138_REVIEW_V3_CANONICAL_PATH))
    writeFileSync(detachedReview, canonicalBytes(review)); chmodSync(detachedReview, 0o444)
    const authorization = buildAuthorization({ repoRoot: templateRoot,
      reviewV3AbsolutePath: detachedReview })
    const seal = buildSeal({ repoRoot: templateRoot, authorization })
    const syntheticPaths = [
      ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
      ".planning/artifacts/v1.38-successor-source-seal-v9.json",
    ].sort()
    writeFileSync(path.join(templateRoot, syntheticPaths[0]!), canonicalBytes(authorization),
      { flag: "wx" })
    writeFileSync(path.join(templateRoot, syntheticPaths[1]!), canonicalBytes(seal),
      { flag: "wx" })
    execFileSync("git", ["add", "--", ...syntheticPaths], { cwd: templateRoot })
    execFileSync("git", ["-c", "user.name=Plan 262-61 Fixture", "-c",
      "user.email=plan-262-61@example.invalid", "commit", "--quiet", "-m",
      "test: synthetic disposable B9 custody"], { cwd: templateRoot })
    const sourceB9 = git(templateRoot, ["rev-parse", "HEAD"])
    if (canonicalV138ReviewerV3(changedPaths(templateRoot, publicationCommit)) !==
        canonicalV138ReviewerV3([V138_REVIEW_V3_CANONICAL_PATH,
          V138_REVIEW_V3_REPORT_PATH].sort()) ||
      canonicalV138ReviewerV3(changedPaths(templateRoot, sourceB9)) !==
        canonicalV138ReviewerV3(syntheticPaths) ||
      git(templateRoot, ["show", "-s", "--format=%P", sourceB9]) !== publicationCommit)
      fail("V138_PLAN_262_61_SYNTHETIC_B9_CUSTODY_INVALID")
    const observations: RouteObservation[] = []
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
    const cloneFor = (group: string) => {
      const present = routeClones.get(group)
      if (present !== undefined) return present
      const cloneRoot = path.join(parent, `route-${group}`)
      execFileSync("git", ["clone", "--quiet", "--no-hardlinks", templateRoot,
        cloneRoot], { maxBuffer: 64 * 1024 * 1024 })
      git(cloneRoot, ["checkout", "--quiet", "--detach", sourceB9])
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
        writeFileSync(obstruction, "{}\n", { flag: "wx" })
      }
      const argv = buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9, sourceB9)
      let aliasAudit: Record<string, unknown> | null = null
      let aliasOperations: readonly FsOperation[] = []
      if (entry.command === "--write-execution-context-v11-receipt") {
        const aliasRoot = cloneFor("alias-contract")
        const publicAlias = routeModule[entry.handler]
        const delegated = routeModule["writeV138Plan26257RouteStartV1"]
        if (typeof publicAlias !== "function" || typeof delegated !== "function")
          fail("V138_PLAN_262_61_ROUTE_ALIAS_INVALID")
        const aliasKey = "__v138Plan26261PublicAlias"
        const delegatedKey = "__v138Plan26261DelegatedRouteStart"
        ;(globalThis as Record<string, unknown>)[aliasKey] = publicAlias
        ;(globalThis as Record<string, unknown>)[delegatedKey] = delegated
        const aliasRemote = await inspectorPost<any>(routeCoverageSession,
          "Runtime.evaluate", { expression: `globalThis[${JSON.stringify(aliasKey)}]` })
        const delegatedRemote = await inspectorPost<any>(routeCoverageSession,
          "Runtime.evaluate", { expression: `globalThis[${JSON.stringify(delegatedKey)}]` })
        const aliasBreakpoint = await inspectorPost<any>(routeCoverageSession,
          "Debugger.setBreakpointOnFunctionCall", { objectId: aliasRemote.result.objectId })
        const delegatedBreakpoint = await inspectorPost<any>(routeCoverageSession,
          "Debugger.setBreakpointOnFunctionCall", { objectId: delegatedRemote.result.objectId })
        const aliasFrames: string[] = []
        const onAliasPaused = (message: any) => {
          aliasFrames.push(String(message?.params?.callFrames?.[0]?.functionName ?? ""))
          routeCoverageSession.post("Debugger.resume")
        }
        routeCoverageSession.on("Debugger.paused", onAliasPaused)
        fsObserver!.start(aliasRoot, "alias-contract")
        try {
          publicAlias(aliasRoot, argv[3]!, argv[5]!, argv[7]!,
            JSON.parse(argv[9]!), argv[11]!, argv[13]!, argv[15]!, argv[17]!)
        } finally {
          aliasOperations = fsObserver!.stop()
          routeCoverageSession.off("Debugger.paused", onAliasPaused)
          await inspectorPost(routeCoverageSession, "Debugger.removeBreakpoint",
            { breakpointId: aliasBreakpoint.breakpointId })
          await inspectorPost(routeCoverageSession, "Debugger.removeBreakpoint",
            { breakpointId: delegatedBreakpoint.breakpointId })
          delete (globalThis as Record<string, unknown>)[aliasKey]
          delete (globalThis as Record<string, unknown>)[delegatedKey]
        }
        if (canonicalV138ReviewerV3(aliasFrames) !== canonicalV138ReviewerV3([
          "writeV138ExecutionContextV11Receipt", "writeV138Plan26257RouteStartV1"]))
          fail("V138_PLAN_262_61_ROUTE_ALIAS_INVALID")
        aliasAudit = Object.freeze({ manifestHandler: entry.handler,
          manifestHandlerSourceRoot: sha256V138ReviewerV3(
            Function.prototype.toString.call(publicAlias)),
          delegatedHandler: "writeV138Plan26257RouteStartV1",
          delegatedHandlerSourceRoot: sha256V138ReviewerV3(
            Function.prototype.toString.call(delegated)),
          callFrames: Object.freeze(aliasFrames),
          operations: aliasOperations })
        for (const operation of aliasOperations) events.push({ ordinal: events.length,
          event: `${operation.command}:${operation.operation}`, path: operation.path,
          result: operation.detailRoot })
      }
      const before = routeInventory(cloneRoot)
      const beforeGit = routeGitState(cloneRoot)
      const actualHandlerName = ACTUAL_HANDLER_BY_COMMAND[entry.command as
        keyof typeof ACTUAL_HANDLER_BY_COMMAND]
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
      const callFrames: Array<{ functionName: string; scriptId: string;
        location: unknown }> = []
      const onPaused = (message: any) => {
        const frame = message?.params?.callFrames?.[0]
        if (frame !== undefined) callFrames.push({ functionName: frame.functionName,
          scriptId: frame.location?.scriptId, location: frame.location })
        routeCoverageSession.post("Debugger.resume")
      }
      routeCoverageSession.on("Debugger.paused", onPaused)
      let output = ""; let exit = 0
      let coverage: any
      let fsOperations: readonly FsOperation[] = []
      fsObserver!.start(cloneRoot, entry.command)
      try {
        await runReceipt({ repoRoot: cloneRoot, argv, ...dependencies,
          writeOutput: (value: string) => { output += value } })
      } catch (error) {
        exit = 1
        output = error instanceof Error ? error.message : String(error)
      } finally {
        fsOperations = fsObserver!.stop()
        coverage = await inspectorPost<any>(routeCoverageSession,
          "Profiler.takePreciseCoverage")
        routeCoverageSession.off("Debugger.paused", onPaused)
        await inspectorPost(routeCoverageSession, "Debugger.removeBreakpoint",
          { breakpointId: breakpoint.breakpointId })
        delete (globalThis as Record<string, unknown>)[traceKey]
      }
      const coveredFunctions = (coverage?.result ?? []).flatMap((script: any) =>
        (script.functions ?? []).filter((fn: any) =>
          fn.functionName === actualHandlerName && fn.ranges?.some(
            (range: any) => Number(range.count) > 0)).map((fn: any) => ({
              urlRoot: sha256V138ReviewerV3(String(script.url)),
              functionName: fn.functionName, ranges: fn.ranges })))
      if (callFrames.length !== 1 || callFrames[0]!.functionName !== actualHandlerName)
        fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
      const handlerSourceRoot = sha256V138ReviewerV3(
        Function.prototype.toString.call(handler))
      const { resultCode, observedDisposition } =
        validateV138Plan26261RouteResult(entry, exit, output)
      const after = routeInventory(cloneRoot)
      const afterGit = routeGitState(cloneRoot)
      if (beforeGit.head !== afterGit.head || beforeGit.tree !== afterGit.tree ||
        beforeGit.refsRoot !== afterGit.refsRoot ||
        beforeGit.indexRoot !== afterGit.indexRoot)
        fail("V138_PLAN_262_61_ROUTE_GIT_STATE_INVALID")
      const changedPaths = inventoryChangedPaths(before, after)
      const trace = { command: entry.command, argv, aliasAudit,
        argvRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(argv)),
        routeModuleBlob, dispatcherSourceRoot, handlerSourceRoot,
        functionRangeRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
          { callFrames, preciseCoverage: coveredFunctions })),
        callCount: callFrames.length, exit,
        resultCode, observedDisposition, outputRoot: sha256V138ReviewerV3(output) }
      observations.push(Object.freeze({ command: entry.command,
        handler: actualHandlerName, manifestHandler: entry.handler, aliasAudit,
        destination: entry.destination, argv, exit,
        outputRoot: sha256V138ReviewerV3(output),
        resultCode, observedDisposition, outputByteLength: Buffer.byteLength(output),
        handlerSourceRoot, dispatcherSourceRoot,
        functionRangeRoot: trace.functionRangeRoot, callCount: trace.callCount,
        callTraceRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(trace)),
        beforeRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
          { inventory: before, git: beforeGit })),
        afterRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
          { inventory: after, git: afterGit })),
        beforePathCount: before.length, afterPathCount: after.length,
        eventPaths: Object.freeze([...new Set([...aliasOperations, ...fsOperations].map(
          ({ path: repoPath }) => repoPath))].sort()),
        changedPaths: Object.freeze(changedPaths) }))
      for (const operation of fsOperations) events.push({ ordinal: events.length,
        event: `${operation.command}:${operation.operation}`, path: operation.path,
        result: operation.detailRoot })
      events.push({ ordinal: events.length, event: `execute:${actualHandlerName}`,
        path: entry.destination, result: canonicalV138ReviewerV3({ exit,
          resultCode, observedDisposition, outputRoot: sha256V138ReviewerV3(output),
          changedPaths, callTraceRoot: sha256V138ReviewerV3(
            canonicalV138ReviewerV3(trace)) }) })
    }
    const postRoot = path.join(parent, "post-execution-publication")
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", templateRoot,
      postRoot], { maxBuffer: 64 * 1024 * 1024 })
    git(postRoot, ["checkout", "--quiet", "--detach", SOURCE_A9])
    const postEvidence = { schemaVersion:
      "v1.38-plan-262-61-post-execution-synthetic-publication-v1",
    sourceA9: SOURCE_A9, semanticEvidenceEligible: false,
    observations: observations.map(({ command, handler, exit, resultCode,
      observedDisposition, callTraceRoot, beforeRoot, afterRoot, changedPaths }) =>
      ({ command, handler, exit, resultCode, observedDisposition, callTraceRoot,
        beforeRoot, afterRoot, changedPaths })), orderedEvents: events }
    const postReviewBytes = canonicalBytes(postEvidence)
    const postReportBytes = Buffer.from("# Post-execution synthetic publication\n\n" +
      "Not eligible as semantic or canonical review evidence.\n")
    writeFileSync(path.join(postRoot, V138_REVIEW_V3_CANONICAL_PATH), postReviewBytes,
      { flag: "wx" })
    writeFileSync(path.join(postRoot, V138_REVIEW_V3_REPORT_PATH), postReportBytes,
      { flag: "wx" })
    execFileSync("git", ["add", "--", V138_REVIEW_V3_CANONICAL_PATH,
      V138_REVIEW_V3_REPORT_PATH], { cwd: postRoot })
    execFileSync("git", ["-c", "user.name=Plan 262-61 Fixture", "-c",
      "user.email=plan-262-61@example.invalid", "commit", "--quiet", "-m",
      "test: post-execution synthetic publication"], { cwd: postRoot })
    const postCommit = git(postRoot, ["rev-parse", "HEAD"])
    const postExecutionPublication = Object.freeze({ semanticEvidenceEligible: false,
      commit: postCommit, parent: git(postRoot, ["show", "-s", "--format=%P",
        postCommit]), tree: git(postRoot, ["rev-parse", `${postCommit}^{tree}`]),
      changedPaths: Object.freeze(changedPaths(postRoot, postCommit)),
      reviewBlob: git(postRoot, ["rev-parse",
        `${postCommit}:${V138_REVIEW_V3_CANONICAL_PATH}`]),
      reviewRoot: sha256V138ReviewerV3(postReviewBytes),
      reportBlob: git(postRoot, ["rev-parse",
        `${postCommit}:${V138_REVIEW_V3_REPORT_PATH}`]),
      reportRoot: sha256V138ReviewerV3(postReportBytes) })
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
    const value = Object.freeze({ sourceB9, publicationCommit,
      cloneHead: git(templateRoot, ["rev-parse", "HEAD"]),
      observations: Object.freeze(observations), events: Object.freeze(events),
      snapshots,
      cleanup: cleanupObservation,
      syntheticPrerequisitePublication: prerequisitePublication,
      postExecutionPublication,
      b9ChangedPaths: Object.freeze(syntheticPaths) })
    if (options.fresh !== true) cachedRouteObservation = { rootPath: physicalRoot, value }
    return value
  } finally {
    fsObserver?.restore()
    if (routeCoverageActive) {
      await inspectorPost(routeCoverageSession, "Profiler.stopPreciseCoverage")
      await inspectorPost(routeCoverageSession, "Profiler.disable")
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
    ({ exit }: RouteObservation) => exit !== 0)
  if (routeFindings.length !== 0) {
    return Object.freeze({ schemaVersion:
      "v1.38-plan-262-61-reviewer-v3-no-publish-v2", source, predecessors,
    convergence, protectedHistory, lifecycle,
    commands: routeExecution.observations,
    reviewDocument: null, reviewBlocked: true,
    findingCount: routeFindings.length, sourceCompletenessPassed: false,
    findings: Object.freeze(routeFindings.map(({ command, handler, destination,
      exit, outputRoot, resultCode, observedDisposition, callTraceRoot,
      beforeRoot, afterRoot, changedPaths }: RouteObservation) =>
      Object.freeze({ command, handler, destination, exit, outputRoot,
        resultCode, observedDisposition, callTraceRoot, beforeRoot, afterRoot,
        changedPaths }))),
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

const deriveExpectedPlan26262ReviewFresh = async (rootPath: string) => {
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
  const route = await observeV138Plan26261RouteDispatch(rootPath, { fresh: true })
  if (routeExecutionHookCount !== hookBefore + 1)
    fail("V138_PLAN_262_62_REVIEW_FRESH_OBSERVATION_INVALID")
  const document = assembleExpectedPlan26262Review({ sourceCustody,
    protectedHistory: protectedObservation, chargeIds: protectedHistory.chargeIds,
    priorAuthorizationBytes: protectedHistory.authorizations,
    snapshots: route.snapshots, orderedEvents: route.events })
  return Object.freeze({ source, predecessors, convergence, protectedHistory,
    lifecycle, route, document, sourceCustody, protectedObservation,
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
    ({ exit }: RouteObservation) => exit !== 0)
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
    sourceB9: expected.b9.sourceB9,
    b9PublicationCommit: expected.b9.publicationCommit,
    b9ChangedPaths: expected.b9.changedPaths,
    prerequisitePublicationRoot: sha256V138ReviewerV3(
      canonicalV138ReviewerV3(expected.b9.prerequisitePublication)),
    postExecutionPublicationRoot: sha256V138ReviewerV3(
      canonicalV138ReviewerV3(expected.publication)) }
    if (canonicalV138ReviewerV3(reportManifest) !==
      canonicalV138ReviewerV3(expectedReport))
      fail("V138_PLAN_262_62_REVIEW_REPORT_BINDING_INVALID")
    immutable = { commit: review.commit, parent: parent[0],
      tree: git(rootPath, ["rev-parse", `${review.commit}^{tree}`]),
      reviewBlob: review.blob, reportBlob: report.blob,
      reportRoot: report.root }
  }
  return Object.freeze({ document, reviewRoot: sha256V138ReviewerV3(reviewRead.bytes),
    ...immutable })
}

const main = async () => {
  const argv = process.argv.slice(2)
  if (argv.length === 1 && argv[0] === "--derive-no-publish") {
    process.stdout.write(`${canonicalV138ReviewerV3(await deriveV138Plan26261NoPublish())}\n`)
    return
  }
  if (argv.length === 1 && argv[0] === "--check-reviewer-convergence") {
    const value = inspectReviewerConvergence()
    process.stdout.write(`reviewer-converged sourceR3=${value.sourceR3.commit} ` +
      `codeReviewPath=${value.codeReviewPath} codeReviewRoot=${value.codeReviewRoot} ` +
      `reviewFixRoot=${value.reviewFixRoot}\n`)
    return
  }
  if (argv[0] === "--render-r3-author-receipt") {
    requireExactArgv(argv, ["--render-r3-author-receipt", "--agent-history",
      ".planning/agent-history.json"])
    const historyRead = readRepositoryFile(repoRoot, ".planning/agent-history.json",
      ".planning/agent-history.json")
    const snapshot = boundedAgentHistory(parseAgentHistoryBytes(historyRead.bytes))
    const history = selectCompletedAgentHistory(snapshot, "262", "61")
    const convergence = inspectReviewerConvergence()
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
    inspectV138Plan26261Receipt(repoRoot, PLAN_61_RECEIPT)
    process.stdout.write("r3-author-receipt-valid\n")
    return
  }
  if (argv[0] === "--derive-agent-separation") {
    requireExactArgv(argv, ["--derive-agent-separation", "--author-receipt",
      PLAN_61_RECEIPT, "--agent-history", ".planning/agent-history.json"])
    const value = deriveV138Plan26262AgentSeparation(repoRoot, PLAN_61_RECEIPT,
      ".planning/agent-history.json")
    process.stdout.write(`agent-separation r3AuthorAgent=${value.r3AuthorAgent} ` +
      `reviewAgent=${value.reviewAgent}\n`)
    return
  }
  if (argv[0] === "--check-review-v3") {
    requireExactArgv(argv, ["--check-review-v3", "--review", PLAN_62_REVIEW,
      "--report", PLAN_62_REPORT])
    await inspectPlan26262Review(repoRoot, PLAN_62_REVIEW, PLAN_62_REPORT, true)
    process.stdout.write("plan-262-62-review-v3-valid\n")
    return
  }
  if (argv[0] === "--check-summary-candidate" || argv[0] === "--check-summary") {
    requireExactArgv(argv, [argv[0]!, "--summary", PLAN_62_SUMMARY,
      "--author-receipt", PLAN_61_RECEIPT, "--agent-history",
      ".planning/agent-history.json", "--review", PLAN_62_REVIEW,
      "--report", PLAN_62_REPORT])
    const separation = deriveV138Plan26262AgentSeparation(repoRoot, PLAN_61_RECEIPT,
      ".planning/agent-history.json")
    const receipt = inspectV138Plan26261Receipt(repoRoot, PLAN_61_RECEIPT)
    const review = await inspectPlan26262Review(repoRoot, PLAN_62_REVIEW,
      PLAN_62_REPORT, true)
    const summaryRead = readRepositoryFile(repoRoot, PLAN_62_SUMMARY, PLAN_62_SUMMARY)
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
      const immutable = committedCurrentFile(repoRoot, PLAN_62_SUMMARY,
        "V138_PLAN_262_62_SUMMARY_COMMIT_INVALID")
      if (canonicalV138ReviewerV3(changedPaths(repoRoot, immutable.commit)) !==
        canonicalV138ReviewerV3([PLAN_62_SUMMARY]))
        fail("V138_PLAN_262_62_SUMMARY_COMMIT_INVALID")
    }
    process.stdout.write("plan-262-62-summary-valid\n")
    return
  }
  if (argv.length === 1 && argv[0] === "--check-main-readiness") {
    const before = snapshotReadiness(repoRoot)
    assertV138Plan26261NoCrashLeak(before)
    if (before.status !== "" || before.destinations.some(({ path: repoPath, type }) =>
      repoPath !== PLAN_61_RECEIPT && type !== "absent") ||
      before.hooks.routeExecutionHookCount !== 0 ||
      before.hooks.candidateDerivationHookCount !== 0)
      fail("V138_PLAN_262_61_MAIN_NOT_READY")
    const { receipt, convergence } = inspectV138Plan26261Receipt(repoRoot, PLAN_61_RECEIPT)
    const after = snapshotReadiness(repoRoot)
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
    const summaryPath = PLAN_61_SUMMARY
    const { receipt, convergence, receiptCommit, receiptBlob, receiptRoot } =
      inspectV138Plan26261Receipt(repoRoot, PLAN_61_RECEIPT)
    const bytes = readRepositoryFile(repoRoot, summaryPath, summaryPath).bytes
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
      const immutable = committedCurrentFile(repoRoot, summaryPath,
        "V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
      if (canonicalV138ReviewerV3(changedPaths(repoRoot, immutable.commit)) !==
        canonicalV138ReviewerV3([summaryPath]))
        fail("V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
    }
    process.stdout.write("plan-262-61-summary-valid\n")
    return
  }
  fail("V138_PLAN_262_61_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
