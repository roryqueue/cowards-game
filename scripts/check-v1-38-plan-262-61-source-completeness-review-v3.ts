#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { closeSync, constants as fsConstants, existsSync, fstatSync, lstatSync,
  mkdirSync, mkdtempSync, openSync, readFileSync, readSync, realpathSync,
  rmSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
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
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

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
  expectedPath?: string) => {
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
      before.dev !== leaf.dev || before.ino !== leaf.ino || before.size > 16 * 1024 * 1024)
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
    archive: Object.freeze(archive) })
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

const committedCurrentFile = (rootPath: string, repoPath: string,
  code: string) => {
  const commit = git(rootPath, ["log", "-1", "--format=%H", "--", repoPath])
  if (!fullOid(commit)) fail(code)
  const bytes = readRepositoryFile(rootPath, repoPath, repoPath).bytes
  if (!gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).equals(bytes) ||
    lines(git(rootPath, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0)
    fail(code)
  return Object.freeze({ commit, blob: git(rootPath,
    ["rev-parse", `${commit}:${repoPath}`]), bytes, root: sha256V138ReviewerV3(bytes) })
}

const yamlScalar = (text: string, key: string) =>
  new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "mu").exec(text)?.[1]?.trim()

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
  const latest = reports.at(-1)!
  const immutable = committedCurrentFile(rootPath, latest.repoPath,
    "V138_PLAN_262_61_CODE_REVIEW_NOT_IMMUTABLE")
  const bytes = immutable.bytes
  const text = bytes.toString("utf8")
  const counts = Object.fromEntries(["critical", "warning", "info", "total"].map(key =>
    [key, Number(new RegExp(`^\\s*${key}:\\s*([0-9]+)\\s*$`, "mu").exec(text)?.[1] ?? -1)]))
  const reviewed = yamlScalar(text, "reviewed_source_commit")
  const paths = [...text.matchAll(/^\s+-\s+(scripts\/check-v1-38-plan-262-61-source-completeness-review-v3(?:\.test)?\.ts)\s*$/gmu)]
    .map(match => match[1]!).sort()
  if (yamlScalar(text, "status") !== "clean" || yamlScalar(text, "depth") !== "deep" ||
    yamlScalar(text, "files_reviewed") !== "2" ||
    Object.values(counts).some(value => value !== 0) || reviewed !== sourceR3.commit ||
    canonicalV138ReviewerV3(paths) !== canonicalV138ReviewerV3([...R3_PATHS].sort()))
    fail("V138_PLAN_262_61_CODE_REVIEW_NOT_CLEAN")
  return Object.freeze({ reports: Object.freeze(reports.map(({ repoPath }) => repoPath)),
    path: latest.repoPath, root: immutable.root, commit: immutable.commit,
    blob: immutable.blob })
}

export const inspectCommittedR3 = (rootPath = repoRoot) => {
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
    if (!gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).equals(
      readFileSync(path.resolve(rootPath, repoPath)))) fail("V138_PLAN_262_61_R3_BYTE_DRIFT")
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
    sourceFixCommits: manifest.sourceFixCommits }
  if (canonicalV138ReviewerV3(manifest) !== canonicalV138ReviewerV3(expected) ||
    !Array.isArray(manifest.sourceFixCommits) ||
    manifest.sourceFixCommits.some(value => !fullOid(value)))
    fail("V138_PLAN_262_61_REVIEW_FIX_BINDING_INVALID")
  return Object.freeze({ sourceR3, codeReviewPath: review.path,
    codeReviewRoot: review.root, codeReviewCommit: review.commit,
    reviewFixRoot: fixRoot, reviewFixCommit: immutableFix.commit,
    reviewFixBlob: immutableFix.blob })
}

const snapshotReadiness = (rootPath: string) => {
  const status = git(rootPath, ["status", "--porcelain=v1"])
  const destinations = [...FORBIDDEN_DESTINATIONS, PLAN_61_RECEIPT].map((repoPath) => {
    const absolute = path.resolve(rootPath, repoPath)
    try {
      const stat = lstatSync(absolute)
      return { path: repoPath, type: stat.isSymbolicLink() ? "symlink" :
        stat.isFile() ? "file" : "other" }
    } catch { return { path: repoPath, type: "absent" } }
  })
  const snapshot = { status, destinations }
  return Object.freeze({ ...snapshot,
    root: sha256V138ReviewerV3(canonicalV138ReviewerV3(snapshot as unknown as Json)) })
}

type RouteObservation = Readonly<{ command: string; handler: string;
  destination: string; argv: readonly string[]; exit: number; outputRoot: string;
  terminalDisposition: string | null }>

/**
 * Execute the production direct-entry dispatch for every full argv. The injected
 * receipt seam is deliberately observation-only: it proves command dispatch and
 * resolves the actual exported handler function from the exact A9 source module;
 * it never writes a canonical route destination.
 */
export const observeV138Plan26261RouteDispatch = async (rootPath = repoRoot) => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "plan-262-61-exact-a9-"))
  const cloneRoot = path.join(parent, "repository")
  const events: Array<{ ordinal: number; event: string; path: string; result: string }> = []
  try {
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", rootPath, cloneRoot],
      { maxBuffer: 64 * 1024 * 1024 })
    git(cloneRoot, ["checkout", "--quiet", "--detach", SOURCE_A9])
    if (git(cloneRoot, ["rev-parse", "HEAD"]) !== SOURCE_A9 ||
      git(cloneRoot, ["status", "--porcelain=v1"]) !== "")
      fail("V138_PLAN_262_61_EXACT_A9_CLONE_INVALID")
    const syntheticPaths = [
      ".planning/artifacts/v1.38-plan-262-56-authorization-v9.json",
      ".planning/artifacts/v1.38-successor-source-seal-v9.json",
    ].sort()
    for (const repoPath of syntheticPaths) {
      mkdirSync(path.dirname(path.join(cloneRoot, repoPath)), { recursive: true })
      writeFileSync(path.join(cloneRoot, repoPath), "{}\n", { flag: "wx" })
    }
    execFileSync("git", ["add", "--", ...syntheticPaths], { cwd: cloneRoot })
    execFileSync("git", ["-c", "user.name=Plan 262-61 Fixture", "-c",
      "user.email=plan-262-61@example.invalid", "commit", "--quiet", "-m",
      "test: synthetic disposable B9 custody"], { cwd: cloneRoot })
    const sourceB9 = git(cloneRoot, ["rev-parse", "HEAD"])
    if (canonicalV138ReviewerV3(changedPaths(cloneRoot, sourceB9)) !==
      canonicalV138ReviewerV3(syntheticPaths))
      fail("V138_PLAN_262_61_SYNTHETIC_B9_CUSTODY_INVALID")
    const routeModule = await import("./lib/" +
      "v1-38-current-matrix-reproduction.js") as Record<string, unknown>
    const directEntry = routeModule["dispatchV138CurrentMatrixDirectEntry"] as
      (command: string, handlers: Readonly<{ runShard: () => never;
        runReceipt: () => Record<string, unknown> }>) => Promise<Record<string, unknown>>
    if (typeof directEntry !== "function")
      fail("V138_PLAN_262_61_ROUTE_DISPATCH_INVALID")
    const observations: RouteObservation[] = []
    for (const entry of V138_REVIEW_V3_ROUTE_MANIFEST) {
      const argv = buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9, sourceB9)
      let dispatchCount = 0
      const result = await directEntry(entry.command, {
        runShard: () => fail("V138_PLAN_262_61_ROUTE_DISPATCH_SHARD_INVALID"),
        runReceipt: () => {
          dispatchCount += 1
          const handler = routeModule[entry.handler]
          if (typeof handler !== "function" || (handler as Function).name !== entry.handler)
            fail("V138_PLAN_262_61_ROUTE_HANDLER_INVALID")
          return { handler: (handler as Function).name, argv }
        },
      })
      if (dispatchCount !== 1 || result.handler !== entry.handler ||
        result.argv !== argv || argv[2] !== entry.command)
        fail("V138_PLAN_262_61_ROUTE_EXECUTION_INVALID")
      const output = canonicalV138ReviewerV3(result as unknown as Json)
      observations.push(Object.freeze({ command: entry.command, handler: result.handler,
        destination: entry.destination, argv, exit: 0,
        outputRoot: sha256V138ReviewerV3(output),
        terminalDisposition: entry.terminalDisposition }))
      events.push({ ordinal: events.length, event: `dispatch:${result.handler}`,
        path: entry.destination, result: "exit:0" })
    }
    return Object.freeze({ sourceB9, cloneHead: git(cloneRoot, ["rev-parse", "HEAD"]),
      observations: Object.freeze(observations), events: Object.freeze(events),
      b9ChangedPaths: Object.freeze(syntheticPaths) })
  } finally {
    rmSync(parent, { recursive: true, force: true })
    if (existsSync(parent)) fail("V138_PLAN_262_61_DISPOSABLE_CLEANUP_INVALID")
  }
}

export const deriveV138Plan26261NoPublish = async (rootPath = repoRoot) => {
  if (lstatSync(rootPath).isSymbolicLink())
    fail("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  const source = inspectV138Plan26261A9Custody(rootPath)
  const predecessors = inspectV138Plan26261Predecessors(rootPath)
  const convergence = inspectV138Plan26261SummaryConvergence(rootPath)
  const protectedHistory = inspectV138Plan26261ProtectedHistory(rootPath)
  const lifecycle = inspectV138Plan26261Lifecycle(rootPath)
  const routeExecution = await observeV138Plan26261RouteDispatch(rootPath)
  const present = FORBIDDEN_DESTINATIONS.filter((repoPath) =>
    existsSync(path.resolve(rootPath, repoPath)))
  if (present.length !== 0) fail("V138_PLAN_262_61_CANONICAL_DESTINATION_PRESENT")
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
  const snapshots = [{ name: "before", inventoryRoot: sha256V138ReviewerV3(
    canonicalV138ReviewerV3(sourceA9.sourceA9Blobs as unknown as Json)),
  pathCount: sourceA9.sourceA9Blobs.length }, { name: "after",
    inventoryRoot: sha256V138ReviewerV3(canonicalV138ReviewerV3(
      sourceA9.sourceA9Blobs as unknown as Json)), pathCount: sourceA9.sourceA9Blobs.length }]
  const protectedObservation = { root: protectedHistory.protectedHistoryRoot,
    protectedA8: SOURCE_A9, protectedRoots: protectedHistory.protectedRoots }
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
    "completionTimestamp", "historyEntryRoot", "sourceR3", "codeReviewPath",
    "codeReviewRoot", "reviewFixRoot"]
  const entry = { agentId: String(receipt.r3AuthorAgent ?? ""),
    phase: String(receipt.phase ?? ""), plan: String(receipt.plan ?? ""),
    completionTimestamp: String(receipt.completionTimestamp ?? "") }
  if (canonicalV138ReviewerV3(Object.keys(receipt).sort()) !==
      canonicalV138ReviewerV3(expectedKeys.sort()) ||
    receipt.schemaVersion !== "v1.38-plan-262-61-r3-author-tracking-v1" ||
    receipt.phase !== "262" || receipt.plan !== "61" ||
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
    const history = selectCompletedAgentHistory(parseAgentHistoryBytes(
      historyRead.bytes), "262", "61")
    const convergence = inspectReviewerConvergence()
    const body = { schemaVersion: "v1.38-plan-262-61-r3-author-tracking-v1",
      r3AuthorAgent: history.agentId, phase: history.phase, plan: history.plan,
      completionTimestamp: history.completionTimestamp,
      historyEntryRoot: receiptEntryRoot(history),
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
  if (argv.length === 1 && argv[0] === "--check-main-readiness") {
    const before = snapshotReadiness(repoRoot)
    if (before.status !== "" || before.destinations.some(({ path: repoPath, type }) =>
      repoPath !== PLAN_61_RECEIPT && type !== "absent"))
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
