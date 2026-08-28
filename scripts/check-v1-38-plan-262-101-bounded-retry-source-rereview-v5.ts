#!/usr/bin/env -S pnpm exec tsx
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readlinkSync,
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
  authenticateV138RetryV3ExecutionClosure,
  type V138RetryV3ExecutionClosure,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`
type Source = Readonly<Record<string, string>>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_101_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json"
export const V138_PLAN_262_101_REPORT_PATH = `${PHASE_DIR}/262-101-REVIEW.md`
export const V138_PLAN_262_101_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
] as const)

const PLAN_100_SOURCE_COMMIT = "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb"
const PLAN_100_SOURCE_TREE = "e6b89de1c699d35b0e5068e0c064b7badd53ad00"
const PLAN_100_SOURCE_PARENT = "71dc34c79a27ba57e67f8a2a2b7471dedade7a09"
const PLAN_100_SUMMARY_PATH = `${PHASE_DIR}/262-100-SUMMARY.md`

export const V138_PLAN_262_101_DOMAINS = Object.freeze({
  portable: "v1.38:plan-262-101:git-object-byte-custody:portable:v5",
  result: "v1.38:plan-262-101:git-object-byte-custody:root:v5",
  review: "v1.38:plan-262-101:git-object-byte-custody:review:v5",
  finding: "v1.38:plan-262-101:git-object-byte-custody:finding:v5",
} as const)

const EXECUTED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  V138_PLAN_262_101_SOURCE_PATHS[0],
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  V138_PLAN_262_101_SOURCE_PATHS[1],
  V138_PLAN_262_101_SOURCE_PATHS[2],
] as const)

const PLAN_98 = Object.freeze({
  sourceCommit: "702bfa5216e3b0e15b4816ce28c98dbcdee38517",
  sourceTree: "4a4ea89f5392c250d32a39abde0bcf9b98aa079f",
  sourceParent: "266c977a657c04c32a54b2293d01cf6fab1edf10",
  summaryPath: `${PHASE_DIR}/262-98-SUMMARY.md`,
  summarySha256:
    "sha256:0d42f4833cce41f80e66d2343b4427e2b8149942c070a211338ffc0cc04dfe99",
})
const PLAN_99 = Object.freeze({
  provisionalPairCommit: "19a6eb53a2ad2c0188009d095103c42718aa3214",
  artifactPath:
    ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
  artifactSha256:
    "sha256:b52599fcbcf53f3eac8e435f87ad85d6d8cc4512dcfa18fe029d5670127aaa34",
  reviewPath: `${PHASE_DIR}/262-99-REVIEW.md`,
  reviewSha256:
    "sha256:f0fe8877f1b33132b101aaa4e475d06fc462e0ce19af22785e0049daff338b34",
  summaryPath: `${PHASE_DIR}/262-99-SUMMARY.md`,
  summarySha256:
    "sha256:0ab477151ea5a272987c7f83567c172ab540ec9c979b84501f1bc7cb45fbd294",
  provisionalFindingRoot:
    "sha256:f42b8afbcf35570b2c5be6bee0e7b06548deb19b4f533260bf16c56d0c7a4b9c",
  provisionalReviewRoot:
    "sha256:9d5a3f650a34e3074c49ceb61072ba361932af20a5a1bf7b8fb61e197d345f4a",
  blockedFindingRoot:
    "sha256:05a090e72cb43224683b190bca9b27ac81fed4cbef2792a9cb39d8d78e233b77",
  blockedReviewRoot:
    "sha256:332855378479e0bceee3f82a4e5445039d476345ab4d1d9b019d5c435a57664b",
})

const DOWNSTREAM_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v3.json",
  ".planning/artifacts/v1.38-plan-262-94-admission-disposition-v3.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v11.json",
  ".planning/artifacts/v1.38-plan-262-route-11-activation-v1.json",
  ".planning/artifacts/v1.38-plan-262-95-lifecycle-driver-readiness-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v3.json",
  ".planning/artifacts/v1.38-phase-263-planning-authorization-v1.json",
  ".planning/artifacts/v1.38-phase-263-execution-authorization-v1.json",
  ".planning/artifacts/v1.38-phase-263-candidate-search-authorization-v1.json",
  ".planning/artifacts/v1.38-formation-materialization-authorization-v1.json",
  ".planning/artifacts/v1.38-holdout-opening-authorization-v1.json",
  ".planning/artifacts/v1.38-public-product-production-authorization-v1.json",
  ".planning/artifacts/v1.38-counted-play-authorization-v1.json",
  ".planning/artifacts/v1.38-gameplay-change-authorization-v1.json",
  ".planning/artifacts/v1.38-archive-tag-authorization-v1.json",
] as const)

export const V138_PLAN_262_101_MUTATIONS = Object.freeze([
  ["RAW_OUTPUT_UNION_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[0], 'encoding: "utf8" | "buffer"', 'encoding: "utf8"'],
  ["RAW_HELPER_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[0], "export const runV138RetryV3IsolatedGitBytes", "const runV138RetryV3IsolatedGitBytesBypassed"],
  ["RAW_BUFFER_GUARD_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[0], 'if (!Buffer.isBuffer(result)) fail("V138_RETRY_V3_GIT_BYTES_INVALID")', "if (false) fail(\"V138_RETRY_V3_GIT_BYTES_INVALID\")"],
  ["TEXT_TRIM_METADATA_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[0], "return result.trim()", "return result"],
  ["REGULAR_MODE_GRAMMAR_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "/^(100644|100755) blob ([0-9a-f]{40})$/u", "/^(.+)$/u"],
  ["NUL_RECORD_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "terminator !== bytes.length - 1", "false"],
  ["ASCII_METADATA_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "value > 0x7f", "false"],
  ["EXACT_PATH_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], ".equals(Buffer.from(repoPath))", ".equals(Buffer.from(\"bypass\"))"],
  ["LS_TREE_NUL_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], '"ls-tree",\n        "-z",', '"ls-tree",'],
  ["CAT_FILE_BLOB_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], '"cat-file",\n      "blob",', '"show",'],
  ["BUFFER_EQUALS_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "!committed.equals(working.bytes)", "false"],
  ["EXECUTABLE_PROJECTION_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], 'const workingMode = (working.mode & 0o111) === 0 ? "100644" : "100755"', 'const workingMode = "100644"'],
  ["V5_SCHEMA_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], 'review.schemaVersion !==\n      "v1.38-plan-262-101-git-object-byte-custody-rereview-v5"', 'review.schemaVersion !==\n      "v1.38-plan-262-99-bounded-retry-source-rereview-v4"'],
  ["V5_PROTOCOL_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], 'review.protocol !== "git-object-byte-custody-v1"', 'review.protocol !== "self-review"'],
  ["PORTABLE_DOMAIN_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], V138_PLAN_262_101_DOMAINS.portable, "v1.38:wrong:portable"],
  ["RESULT_DOMAIN_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], V138_PLAN_262_101_DOMAINS.result, "v1.38:wrong:result"],
  ["REVIEW_DOMAIN_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], V138_PLAN_262_101_DOMAINS.review, "v1.38:wrong:review"],
  ["FINDING_DOMAIN_CHANGED", V138_PLAN_262_101_SOURCE_PATHS[1], V138_PLAN_262_101_DOMAINS.finding, "v1.38:wrong:finding"],
  ["ACTUAL_CONSUMER_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], 'execution.actualConsumerStatus !== "passed"', "false"],
  ["FULL_ROOT_BRACKET_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "executionAfter.executionClosureRoot !== executionBefore.executionClosureRoot", "false"],
  ["HISTORY_REINTERPRETATION_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "protectedHistory.provisionalPairReinterpreted !== false", "false"],
  ["PLAN92_GATE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[1], "review.authority.plan26292Eligible !== true", "false"],
  ["FINAL_NEWLINE_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '["final newline", Buffer.from("alpha\\n")]', '["final newline", Buffer.from("alpha")]'],
  ["INVALID_UTF8_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '["invalid UTF-8", Buffer.from([0xff, 0xfe, 0x80, 0xc0])]', '["invalid UTF-8", Buffer.from("text")]'],
  ["NUL_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '["embedded NUL", Buffer.from([0x61, 0x00, 0x62, 0x00])]', '["embedded NUL", Buffer.from("ab")]'],
  ["EXECUTABLE_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '[0o755, "100755"]', '[0o644, "100644"]'],
  ["DUPLICATE_RECORD_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '"duplicate records"', '"duplicate fixture removed"'],
  ["GITLINK_FIXTURE_REMOVED", V138_PLAN_262_101_SOURCE_PATHS[2], '"gitlink mode"', '"gitlink fixture removed"'],
] as const satisfies readonly (readonly [string, string, string, string])[])

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const normalize = (value: Json): Json =>
  Array.isArray(value)
    ? value.map(normalize)
    : value !== null && typeof value === "object"
      ? (Object.fromEntries(
          Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, child]) => [key, normalize(child)]),
        ) as Json)
      : value
const canonical = (value: unknown): string =>
  `${JSON.stringify(normalize(value as Json))}\n`
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  canonical(Object.keys(value as Record<string, unknown>).sort()) ===
    canonical([...keys].sort())
const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
const lines = (value: string): string[] =>
  value.trim() === "" ? [] : value.trim().split("\n")

const isolatedEnvironment = (home: string): NodeJS.ProcessEnv => ({
  PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`,
  LANG: "C",
  LC_ALL: "C",
  HOME: home,
  XDG_CONFIG_HOME: home,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
  CI: "1",
})
const hardenedGitArgs = (args: readonly string[]) => [
  "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false",
  "-c", "core.autocrlf=false",
  "-c", "core.eol=lf",
  "-c", "core.safecrlf=true",
  "-c", "core.attributesFile=/dev/null",
  "-c", "core.symlinks=true",
  "-c", "commit.gpgsign=false",
  "-c", "tag.gpgsign=false",
  "-c", "advice.detachedHead=false",
  ...args,
]
const git = (root: string, args: readonly string[], home = tmpdir()): string =>
  execFileSync("/usr/bin/git", hardenedGitArgs(args), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: isolatedEnvironment(home),
  }).trim()
const gitBuffer = (
  root: string,
  args: readonly string[],
  home = tmpdir(),
): Buffer =>
  execFileSync("/usr/bin/git", hardenedGitArgs(args), {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
    env: isolatedEnvironment(home),
  })
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_PLAN_262_101_ANCESTRY_INVALID")
  }
}
const safeType = (target: string): "absent" | "regular" | "directory" | "unsafe" => {
  try {
    const status = lstatSync(target)
    if (status.isSymbolicLink()) return "unsafe"
    if (status.isFile()) return "regular"
    if (status.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const readRegularWithMode = (root: string, repoPath: string) => {
  const target = path.resolve(root, repoPath)
  if (safeType(target) !== "regular") fail("V138_PLAN_262_101_INPUT_UNSAFE")
  const before = lstatSync(target)
  const descriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    const opened = fstatSync(descriptor)
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino)
      fail("V138_PLAN_262_101_INPUT_UNSAFE")
    return Object.freeze({ bytes: readFileSync(descriptor), mode: opened.mode })
  } finally {
    closeSync(descriptor)
  }
}
const readRegular = (root: string, repoPath: string): Buffer =>
  readRegularWithMode(root, repoPath).bytes

export const parseV138Plan262101RegularBlobTreeEntry = (
  bytes: Buffer,
  repoPath: string,
): Readonly<{ mode: "100644" | "100755"; oid: string }> => {
  if (
    path.isAbsolute(repoPath) ||
    repoPath.includes("\0") ||
    repoPath.split("/").some((part) => !part || part === "." || part === "..")
  ) fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  const terminator = bytes.indexOf(0)
  if (terminator < 0 || terminator !== bytes.length - 1)
    fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  const record = bytes.subarray(0, terminator)
  const separator = record.indexOf(0x09)
  if (separator <= 0 || record.indexOf(0x09, separator + 1) !== -1)
    fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  const metadataBytes = record.subarray(0, separator)
  if ([...metadataBytes].some((value) => value > 0x7f))
    fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  const match = /^(100644|100755) blob ([0-9a-f]{40})$/u.exec(
    metadataBytes.toString("ascii"),
  )
  if (
    match === null ||
    !record.subarray(separator + 1).equals(Buffer.from(repoPath))
  ) fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  return Object.freeze({
    mode: match[1] as "100644" | "100755",
    oid: match[2]!,
  })
}

const authenticateCommitted = (root: string, commit: string, repoPath: string) => {
  const entry = parseV138Plan262101RegularBlobTreeEntry(
    gitBuffer(root, ["ls-tree", "-z", commit, "--", repoPath]),
    repoPath,
  )
  const committed = gitBuffer(root, ["cat-file", "blob", entry.oid])
  const working = readRegularWithMode(root, repoPath)
  const workingMode = (working.mode & 0o111) === 0 ? "100644" : "100755"
  if (entry.mode !== workingMode || !committed.equals(working.bytes))
    fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
  return Object.freeze({
    path: repoPath,
    mode: entry.mode,
    blob: entry.oid,
    byteLength: committed.length,
    sha256: sha256(committed),
  })
}

export const inspectV138Plan262101CorrectedSource = (root: string) => {
  const [commit, tree, parent] = git(root, [
    "show", "-s", "--format=%H%n%T%n%P", PLAN_100_SOURCE_COMMIT,
  ]).split("\n")
  if (
    commit !== PLAN_100_SOURCE_COMMIT ||
    tree !== PLAN_100_SOURCE_TREE ||
    parent !== PLAN_100_SOURCE_PARENT
  ) fail("V138_PLAN_262_101_SOURCE_IDENTITY_INVALID")
  requireAncestor(root, commit, "HEAD")
  const files = V138_PLAN_262_101_SOURCE_PATHS.map((repoPath) => {
    const value = authenticateCommitted(root, commit, repoPath)
    if (lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0)
      fail("V138_PLAN_262_101_SOURCE_CUSTODY_INVALID")
    return value
  })
  const expected = [
    ["80a5aa8e900d8bcbbeed66363e39d574fe0d3f59", 20_459, "sha256:8a5ad1808819173d75744306f5003d00e67a0c5e72d6964f23c102ad14f155d7"],
    ["8a6f6dc8e9c6efbb4626eba0dd846cd059881654", 81_171, "sha256:0ab49ae8d0e1fec3e216b2a45624824cc4d2c592a5a8e3f6c5ec1b625f021091"],
    ["50e479136f1537573cb83d26d03ffa16c4ac08b1", 49_828, "sha256:8f1be655746a99ab7de75c00bbcdf35e728a6fb136638291ccda5abf1f47f441"],
  ] as const
  files.forEach((file, index) => {
    if (
      file.mode !== "100644" ||
      file.blob !== expected[index]![0] ||
      file.byteLength !== expected[index]![1] ||
      file.sha256 !== expected[index]![2]
    ) fail("V138_PLAN_262_101_SOURCE_BLOB_INVALID")
  })
  if (safeType(path.resolve(root, PLAN_100_SUMMARY_PATH)) !== "regular")
    fail("V138_PLAN_262_101_SUMMARY_LOCATOR_INVALID")
  return Object.freeze({
    commit,
    tree,
    parent,
    noLaterRewrite: true as const,
    summaryTrustedAsVerdict: false as const,
    files: Object.freeze(files),
  })
}

export const inspectV138Plan262101Source = (source: Source): string[] => {
  const findings = V138_PLAN_262_101_MUTATIONS.flatMap(
    ([code, repoPath, token]) =>
      source[repoPath]?.split(token).length - 1 === 1 ? [] : [code],
  )
  const combined = V138_PLAN_262_101_SOURCE_PATHS.map(
    (repoPath) => source[repoPath] ?? "",
  ).join("\n")
  if (/Math\.random|Date\.now|node:vm|new Function/u.test(combined))
    findings.push("FORBIDDEN_NONDETERMINISM_PRESENT")
  return [...new Set(findings)].sort()
}

export const inspectV138Plan262101ProtectedHistory = (root: string) => {
  for (const [repoPath, digest] of [
    [PLAN_98.summaryPath, PLAN_98.summarySha256],
    [PLAN_99.artifactPath, PLAN_99.artifactSha256],
    [PLAN_99.reviewPath, PLAN_99.reviewSha256],
    [PLAN_99.summaryPath, PLAN_99.summarySha256],
  ] as const) {
    if (sha256(readRegular(root, repoPath)) !== digest)
      fail("V138_PLAN_262_101_PROTECTED_HISTORY_BYTES_INVALID")
  }
  const provisional = JSON.parse(readRegular(root, PLAN_99.artifactPath).toString("utf8")) as any
  if (
    provisional.findingCount !== 0 ||
    provisional.findingRoot !== PLAN_99.provisionalFindingRoot ||
    provisional.reviewRoot !== PLAN_99.provisionalReviewRoot ||
    provisional.authority?.plan26292Eligible !== true ||
    !readRegular(root, PLAN_99.summaryPath).toString("utf8").includes("GIT_SHOW_BYTES_TRIMMED") ||
    !readRegular(root, PLAN_99.summaryPath).toString("utf8").includes(PLAN_99.blockedFindingRoot) ||
    !readRegular(root, PLAN_99.summaryPath).toString("utf8").includes(PLAN_99.blockedReviewRoot)
  ) fail("V138_PLAN_262_101_PROTECTED_HISTORY_RESULT_INVALID")
  return Object.freeze({
    provisionalPairReinterpreted: false as const,
    plan98: Object.freeze({
      sourceCommit: PLAN_98.sourceCommit,
      sourceTree: PLAN_98.sourceTree,
      sourceParent: PLAN_98.sourceParent,
      summarySha256: PLAN_98.summarySha256,
    }),
    plan99: Object.freeze({
      provisionalPairCommit: PLAN_99.provisionalPairCommit,
      artifactSha256: PLAN_99.artifactSha256,
      reviewSha256: PLAN_99.reviewSha256,
      summarySha256: PLAN_99.summarySha256,
      provisionalFindingCount: 0 as const,
      provisionalFindingRoot: PLAN_99.provisionalFindingRoot,
      provisionalReviewRoot: PLAN_99.provisionalReviewRoot,
      blockedFindingCode: "GIT_SHOW_BYTES_TRIMMED" as const,
      blockedFindingRoot: PLAN_99.blockedFindingRoot,
      blockedReviewRoot: PLAN_99.blockedReviewRoot,
      plan26292Eligible: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
    }),
  })
}

export const snapshotV138Plan262101Destinations = (root: string) =>
  [
    V138_PLAN_262_101_REVIEW_PATH,
    V138_PLAN_262_101_REPORT_PATH,
    ...DOWNSTREAM_DESTINATIONS,
  ].map((repoPath) => {
    const target = path.resolve(root, repoPath)
    const type = safeType(target)
    return Object.freeze({
      path: repoPath,
      type,
      ...(type === "regular" ? { sha256: sha256(readFileSync(target)) } : {}),
    })
  })
const normalizePair = (
  snapshot: ReturnType<typeof snapshotV138Plan262101Destinations>,
) => snapshot.map((item) =>
  [V138_PLAN_262_101_REVIEW_PATH, V138_PLAN_262_101_REPORT_PATH].includes(item.path)
    ? Object.freeze({ path: item.path, type: "absent" as const })
    : item,
)

export type V138Plan262101PortableClosure = Readonly<{
  schemaVersion: "v1.38-reviewed-execution-closure-v2"
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutByteManifestRoot: Sha256
  installedClosureRoot: Sha256
  gitExecutable: "/usr/bin/git"
  gitExecutableSha256: Sha256
  gitIsolationRoot: Sha256
  nodeSha256: Sha256
  pnpmDistributionSha256: Sha256
  nativeSourcesRoot: Sha256
  pathnameLaunchReplacementResistanceClaimed: false
}>
const portableFrom = (
  closure: V138RetryV3ExecutionClosure,
): V138Plan262101PortableClosure => Object.freeze({
  schemaVersion: "v1.38-reviewed-execution-closure-v2" as const,
  sourceCommit: closure.sourceCommit,
  sourceTree: closure.sourceTree,
  sourceParent: closure.sourceParent,
  checkoutByteManifestRoot: closure.checkoutByteManifestRoot,
  installedClosureRoot: closure.installedClosureRoot,
  gitExecutable: closure.gitExecutable,
  gitExecutableSha256: closure.gitExecutableSha256,
  gitIsolationRoot: closure.gitIsolationRoot,
  nodeSha256: closure.nodeSha256,
  pnpmDistributionSha256: closure.pnpmDistributionSha256,
  nativeSourcesRoot: closure.nativeSourcesRoot,
  pathnameLaunchReplacementResistanceClaimed: false as const,
})
export const computeV138Plan262101PortableRoot = (
  body: V138Plan262101PortableClosure,
): Sha256 =>
  sha256(`${V138_PLAN_262_101_DOMAINS.portable}\0${canonical(body)}`)
export const computeV138Plan262101FindingRoot = (
  findings: readonly unknown[],
): Sha256 =>
  sha256(`${V138_PLAN_262_101_DOMAINS.finding}\0${canonical(findings)}`)
export const computeV138Plan262101ReviewRoot = (
  bytes: Uint8Array,
): Sha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(`${V138_PLAN_262_101_DOMAINS.review}\0`),
      Buffer.from(bytes),
    ]),
  )
export const computeV138Plan262101ResultRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.resultRoot
  return sha256(`${V138_PLAN_262_101_DOMAINS.result}\0${canonical(body)}`)
}

const authorityProjection = () => Object.freeze({
  plan26292Eligible: false,
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
  activationAuthorized: false,
  productionAuthorized: false,
  countedPlayAuthorized: false,
  gameplayChangeAuthorized: false,
  archiveAuthorized: false,
  tagAuthorized: false,
})
const identityClaims = Object.freeze({
  independentPersonClaimed: false,
  externalIdentityClaimed: false,
  cryptographicReviewerIdentityClaimed: false,
  independentCustodyClaimed: false,
  separatePermissioningClaimed: false,
  maliciousOperatorResistanceClaimed: false,
  hostileSameUidResistanceClaimed: false,
  pathnameLaunchReplacementResistanceClaimed: false,
})
const finding = Object.freeze({
  code: "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE" as const,
  severity: "critical" as const,
  evidenceRoot: sha256(
    "The exact final candidate JSON cannot contain its own whole-file SHA-256 without a cryptographic fixed point.\n",
  ),
})

const TOP_KEYS = [
  "schemaVersion", "protocol", "status", "correctedSource",
  "protectedHistory", "execution", "reviewedExecutionClosure", "findings",
  "findingCount", "findingRoot", "sourceReviewPassed", "identityClaims",
  "authority", "reviewRoot", "resultRoot",
] as const
const AUTHORITY_KEYS = Object.keys(authorityProjection())
const IDENTITY_KEYS = Object.keys(identityClaims)
const EXECUTION_KEYS = [
  "focusedTestsPassed", "sourceOnlyPassed", "checkoutBytesMatchedBefore",
  "checkoutBytesMatchedAfter", "executionClosureMatchedBeforeAfter",
  "actualConsumerStatus", "actualConsumerCandidateJsonSha256",
  "actualConsumerCandidateReviewSha256", "destinationsUnchanged",
  "cleanupComplete", "canonicalWrites", "liveInvoked", "freshCharged",
  "freshAccepted", "localSecretAccessed", "identityConsumed",
] as const
const PORTABLE_KEYS = [
  "schemaVersion", "sourceCommit", "sourceTree", "sourceParent",
  "checkoutByteManifestRoot", "installedClosureRoot", "gitExecutable",
  "gitExecutableSha256", "gitIsolationRoot", "nodeSha256",
  "pnpmDistributionSha256", "nativeSourcesRoot",
  "pathnameLaunchReplacementResistanceClaimed", "reviewedExecutionClosureRoot",
] as const

export const renderV138Plan262101Report = (review: any): string => `---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "101"
schema_version: ${review.schemaVersion}
protocol: ${review.protocol}
reviewed_source_commit: ${review.correctedSource.commit}
finding_count: ${review.findingCount}
source_review_passed: ${review.sourceReviewPassed}
status: ${review.status}
finding_root: ${review.findingRoot}
---

# Phase 262 Plan 101: Git Object Byte-Custody Re-review v5

## Verdict

**BLOCKED.** The exact final candidate JSON is required to contain its own whole-file SHA-256. That self-reference has no constructible deterministic value without finding a SHA-256 fixed point, so the review fails closed and Plans 262-92 through 262-95 remain ineligible.

## Plan-100 Source Custody

- Source completion commit: \`${review.correctedSource.commit}\`
- Tree: \`${review.correctedSource.tree}\`
- Sole parent: \`${review.correctedSource.parent}\`
- The raw helper, controller, and focused test are exact committed regular blobs with tracked modes, working-byte equality, and no later rewrite.
- The Plan-100 summary was used only as a locator, never as verdict authority.

## Actual Final Consumer

An owner-only \`0700\` isolated \`git clone --no-local --no-checkout\` committed the byte-identical blocked candidate pair at the final paths. The actual \`--derive-seal-envelope-no-publish\` consumer rejected it as expected; every seal, envelope, live, capacity, lifecycle, and downstream destination remained absent and the clone was removed.

## Portable Closure

- Portable reviewed-closure root: \`${review.reviewedExecutionClosure.reviewedExecutionClosureRoot}\`
- Installed closure member: \`${review.reviewedExecutionClosure.installedClosureRoot}\`
- \`gitObjectRoot\` and the complete local \`executionClosureRoot\` are excluded from publication and are not aliases of the portable root.

## Protected History

Plan 98 and the Plan-99 producer, checker, tests, provisional pair, invalidation, and closeout remain byte-identical history. The provisional pair is not reinterpreted; its Plan-92 eligibility is invalid and current Plan-92 eligibility remains false.

## Findings

- **${review.findings[0].code}** (${review.findings[0].severity}) — evidence root \`${review.findings[0].evidenceRoot}\`.

## Non-Authority

Fresh charged/accepted remain 0/0. No execution, seal, envelope, live work, secret access, capacity use, Phase-263, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, or tag authority was created.

## Roots

- Finding root: \`${review.findingRoot}\`
- Portable reviewed-closure root: \`${review.reviewedExecutionClosure.reviewedExecutionClosureRoot}\`
- The review root is the domain-separated hash of these exact report bytes and is carried in the paired JSON; it is intentionally not embedded recursively in this report.
`

const candidateCorrelation = (): Sha256 =>
  sha256(
    "UNSATISFIABLE_EXACT_WHOLE_FILE_SELF_HASH:v1.38-plan-262-101-git-object-byte-custody-rereview-v5\n",
  )

const buildReview = (input: {
  correctedSource: ReturnType<typeof inspectV138Plan262101CorrectedSource>
  protectedHistory: ReturnType<typeof inspectV138Plan262101ProtectedHistory>
  closure: V138RetryV3ExecutionClosure
  focusedTestsPassed: number
}) => {
  const portable = portableFrom(input.closure)
  const reviewedExecutionClosure = Object.freeze({
    ...portable,
    reviewedExecutionClosureRoot: computeV138Plan262101PortableRoot(portable),
  })
  const findings = Object.freeze([finding])
  const base: any = {
    schemaVersion:
      "v1.38-plan-262-101-git-object-byte-custody-rereview-v5",
    protocol: "git-object-byte-custody-v1",
    status: "blocked",
    correctedSource: input.correctedSource,
    protectedHistory: input.protectedHistory,
    execution: {
      focusedTestsPassed: input.focusedTestsPassed,
      sourceOnlyPassed: true,
      checkoutBytesMatchedBefore: true,
      checkoutBytesMatchedAfter: true,
      executionClosureMatchedBeforeAfter: true,
      actualConsumerStatus: "rejected_expected",
      actualConsumerCandidateJsonSha256: candidateCorrelation(),
      actualConsumerCandidateReviewSha256: sha256("pending-report"),
      destinationsUnchanged: true,
      cleanupComplete: true,
      canonicalWrites: 0,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      localSecretAccessed: false,
      identityConsumed: false,
    },
    reviewedExecutionClosure,
    findings,
    findingCount: findings.length,
    findingRoot: computeV138Plan262101FindingRoot(findings),
    sourceReviewPassed: false,
    identityClaims,
    authority: authorityProjection(),
  }
  const provisionalReport = renderV138Plan262101Report(base)
  base.execution.actualConsumerCandidateReviewSha256 = sha256(provisionalReport)
  const report = renderV138Plan262101Report(base)
  base.reviewRoot = computeV138Plan262101ReviewRoot(Buffer.from(report))
  base.resultRoot = computeV138Plan262101ResultRoot(base)
  return Object.freeze({ review: Object.freeze(base), report })
}

let cachedExerciseRoot: string | undefined
let cachedExercise: any
const runIsolatedCandidateExercise = (
  root: string,
  correctedSource: ReturnType<typeof inspectV138Plan262101CorrectedSource>,
  protectedHistory: ReturnType<typeof inspectV138Plan262101ProtectedHistory>,
) => {
  if (cachedExerciseRoot === path.resolve(root) && cachedExercise !== undefined)
    return cachedExercise
  const previousUmask = process.umask(0o077)
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan262101-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  const environment = isolatedEnvironment(owner)
  const canonicalRefsBefore = git(root, ["for-each-ref", "--format=%(refname)%00%(objectname)"])
  try {
    execFileSync(
      "/usr/bin/git",
      hardenedGitArgs(["clone", "--no-local", "--no-checkout", root, clone]),
      { env: environment, stdio: "pipe", maxBuffer: 64 * 1024 * 1024 },
    )
    execFileSync(
      "/usr/bin/git",
      hardenedGitArgs(["checkout", "--detach", PLAN_100_SOURCE_COMMIT]),
      { cwd: clone, env: environment, stdio: "pipe" },
    )
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_101_OWNER_MODE_INVALID")
    const commonDir = realpathSync(
      path.resolve(clone, git(clone, ["rev-parse", "--git-common-dir"], owner)),
    )
    if (
      !commonDir.startsWith(`${realpathSync(clone)}${path.sep}`) ||
      safeType(path.join(commonDir, "objects", "info", "alternates")) !== "absent"
    ) fail("V138_PLAN_262_101_OBJECT_STORE_NOT_ISOLATED")
    symlinkSync(path.resolve(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    for (const packageJson of lines(git(root, ["ls-files", "*/package.json"], owner))) {
      const packageDir = path.dirname(packageJson)
      const sourceModules = path.resolve(root, packageDir, "node_modules")
      const targetModules = path.resolve(clone, packageDir, "node_modules")
      if (safeType(sourceModules) === "directory" && safeType(targetModules) === "absent")
        symlinkSync(sourceModules, targetModules, "dir")
    }
    const closureBefore = authenticateV138RetryV3ExecutionClosure(clone, {
      sourceCommit: PLAN_100_SOURCE_COMMIT,
      checkoutPaths: EXECUTED_SOURCE_PATHS,
    })
    const packageRoot = path.dirname(
      createRequire(path.join(root, "package.json")).resolve("vitest/package.json"),
    )
    const resultPath = path.join(owner, "vitest-result.json")
    const testRun = spawnSync(
      process.execPath,
      [
        path.join(packageRoot, "vitest.mjs"),
        "run",
        V138_PLAN_262_101_SOURCE_PATHS[2],
        "--pool=forks",
        "--maxWorkers=1",
        "--no-file-parallelism",
        "--testTimeout=180000",
        "--hookTimeout=180000",
        "--bail=1",
        "--reporter=json",
        `--outputFile=${resultPath}`,
      ],
      {
        cwd: clone,
        env: environment,
        timeout: 180_000,
        maxBuffer: 64 * 1024 * 1024,
        encoding: "utf8",
      },
    )
    if (testRun.status !== 0 || safeType(resultPath) !== "regular")
      fail(`V138_PLAN_262_101_FOCUSED_TEST_FAILED:${testRun.status}:${testRun.stderr}`)
    const testResult = JSON.parse(readFileSync(resultPath, "utf8")) as any
    unlinkSync(resultPath)
    const tsxCli = createRequire(path.join(root, "package.json")).resolve("tsx/cli")
    const sourceOnly = JSON.parse(execFileSync(
      process.execPath,
      [tsxCli, V138_PLAN_262_101_SOURCE_PATHS[1], "--check-source-only"],
      {
        cwd: clone,
        env: environment,
        encoding: "utf8",
        timeout: 180_000,
        maxBuffer: 64 * 1024 * 1024,
      },
    )) as any
    if (
      testResult.success !== true ||
      testResult.numFailedTests !== 0 ||
      testResult.numPassedTests < 140 ||
      sourceOnly.status !== "passed" ||
      sourceOnly.liveInvoked !== false ||
      sourceOnly.freshCharged !== 0 ||
      sourceOnly.freshAccepted !== 0 ||
      sourceOnly.downstreamAuthority !== "denied"
    ) fail("V138_PLAN_262_101_SOURCE_EXERCISE_INVALID")
    const built = buildReview({
      correctedSource,
      protectedHistory,
      closure: closureBefore,
      focusedTestsPassed: testResult.numPassedTests,
    })
    mkdirSync(path.dirname(path.resolve(clone, V138_PLAN_262_101_REVIEW_PATH)), { recursive: true })
    mkdirSync(path.dirname(path.resolve(clone, V138_PLAN_262_101_REPORT_PATH)), { recursive: true })
    const jsonBytes = Buffer.from(canonical(built.review))
    const reportBytes = Buffer.from(built.report)
    writeFileSync(path.resolve(clone, V138_PLAN_262_101_REVIEW_PATH), jsonBytes, { mode: 0o600 })
    writeFileSync(path.resolve(clone, V138_PLAN_262_101_REPORT_PATH), reportBytes, { mode: 0o600 })
    git(clone, ["add", "--", V138_PLAN_262_101_REVIEW_PATH, V138_PLAN_262_101_REPORT_PATH], owner)
    execFileSync(
      "/usr/bin/git",
      hardenedGitArgs(["commit", "--quiet", "-m", "candidate Plan 262-101 blocked review"]),
      {
        cwd: clone,
        env: {
          ...environment,
          GIT_AUTHOR_NAME: "Plan 262 Review Candidate",
          GIT_AUTHOR_EMAIL: "plan-262-review@example.invalid",
          GIT_COMMITTER_NAME: "Plan 262 Review Candidate",
          GIT_COMMITTER_EMAIL: "plan-262-review@example.invalid",
          GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
          GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
        },
        stdio: "pipe",
      },
    )
    const changed = lines(git(clone, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], owner)).sort()
    if (canonical(changed) !== canonical([
      V138_PLAN_262_101_REVIEW_PATH,
      V138_PLAN_262_101_REPORT_PATH,
    ].sort())) fail("V138_PLAN_262_101_CANDIDATE_COMMIT_INVALID")
    if (
      !gitBuffer(clone, ["cat-file", "blob", `HEAD:${V138_PLAN_262_101_REVIEW_PATH}`], owner).equals(jsonBytes) ||
      !gitBuffer(clone, ["cat-file", "blob", `HEAD:${V138_PLAN_262_101_REPORT_PATH}`], owner).equals(reportBytes)
    ) fail("V138_PLAN_262_101_CANDIDATE_BYTES_INVALID")
    const before = snapshotV138Plan262101Destinations(clone)
    const consumer = spawnSync(
      process.execPath,
      [tsxCli, V138_PLAN_262_101_SOURCE_PATHS[1], "--derive-seal-envelope-no-publish"],
      {
        cwd: clone,
        env: environment,
        timeout: 180_000,
        maxBuffer: 64 * 1024 * 1024,
        encoding: "utf8",
      },
    )
    const after = snapshotV138Plan262101Destinations(clone)
    const closureAfter = authenticateV138RetryV3ExecutionClosure(clone, {
      sourceCommit: PLAN_100_SOURCE_COMMIT,
      checkoutPaths: EXECUTED_SOURCE_PATHS,
      executionClosureRoot: closureBefore.executionClosureRoot,
    })
    if (
      consumer.status === 0 ||
      !consumer.stderr.includes("V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID") ||
      canonical(normalizePair(before)) !== canonical(normalizePair(after)) ||
      closureAfter.executionClosureRoot !== closureBefore.executionClosureRoot
    ) fail("V138_PLAN_262_101_BLOCKED_CONSUMER_BRANCH_INVALID")
    cachedExercise = Object.freeze({
      review: built.review,
      report: built.report,
      jsonBytes,
      reportBytes,
      candidateCommit: git(clone, ["rev-parse", "HEAD"], owner),
    })
    cachedExerciseRoot = path.resolve(root)
    return cachedExercise
  } finally {
    rmSync(owner, { recursive: true, force: true })
    process.umask(previousUmask)
    if (git(root, ["for-each-ref", "--format=%(refname)%00%(objectname)"]) !== canonicalRefsBefore)
      fail("V138_PLAN_262_101_CANONICAL_REFS_MUTATED")
  }
}

let cachedRoot: string | undefined
let cachedReview: any
export const deriveV138Plan262101ReviewNoPublish = (root: string) => {
  if (cachedRoot === path.resolve(root) && cachedReview !== undefined)
    return cachedReview
  const before = snapshotV138Plan262101Destinations(root)
  const correctedSource = inspectV138Plan262101CorrectedSource(root)
  const protectedHistory = inspectV138Plan262101ProtectedHistory(root)
  const source = Object.fromEntries(V138_PLAN_262_101_SOURCE_PATHS.map((repoPath) => [
    repoPath,
    gitBuffer(root, ["cat-file", "blob", `${correctedSource.commit}:${repoPath}`]).toString("utf8"),
  ]))
  const sourceFindings = inspectV138Plan262101Source(source)
  if (sourceFindings.length !== 0)
    fail(`V138_PLAN_262_101_SOURCE_FINDINGS:${sourceFindings.join(",")}`)
  const exercised = runIsolatedCandidateExercise(root, correctedSource, protectedHistory)
  const after = snapshotV138Plan262101Destinations(root)
  if (canonical(normalizePair(before)) !== canonical(normalizePair(after)))
    fail("V138_PLAN_262_101_DESTINATION_MUTATED")
  cachedReview = exercised.review
  cachedRoot = path.resolve(root)
  return cachedReview
}

export const validateV138Plan262101Review = (
  candidate: unknown,
  expected: unknown,
): true => {
  const value = candidate as any
  const portable = value?.reviewedExecutionClosure
  const portableBody = portable === undefined
    ? undefined
    : Object.fromEntries(Object.entries(portable).filter(([key]) => key !== "reviewedExecutionClosureRoot"))
  if (
    !exactKeys(value, TOP_KEYS) ||
    !exactKeys(value?.authority, AUTHORITY_KEYS) ||
    !exactKeys(value?.identityClaims, IDENTITY_KEYS) ||
    !exactKeys(value?.execution, EXECUTION_KEYS) ||
    !exactKeys(portable, PORTABLE_KEYS) ||
    value.schemaVersion !== "v1.38-plan-262-101-git-object-byte-custody-rereview-v5" ||
    value.protocol !== "git-object-byte-custody-v1" ||
    value.status !== "blocked" ||
    value.findingCount !== 1 ||
    value.findings?.[0]?.code !== finding.code ||
    value.findingRoot !== computeV138Plan262101FindingRoot(value.findings) ||
    value.sourceReviewPassed !== false ||
    value.authority.plan26292Eligible !== false ||
    Object.entries(value.authority).some(([key, item]) =>
      ["freshCharged", "freshAccepted"].includes(key) ? item !== 0 : item !== false
    ) ||
    Object.values(value.identityClaims).some((item) => item !== false) ||
    value.execution.actualConsumerStatus !== "rejected_expected" ||
    value.execution.actualConsumerCandidateJsonSha256 !== candidateCorrelation() ||
    value.execution.actualConsumerCandidateReviewSha256 !== sha256(renderV138Plan262101Report(value)) ||
    value.execution.destinationsUnchanged !== true ||
    value.execution.cleanupComplete !== true ||
    value.execution.canonicalWrites !== 0 ||
    value.execution.liveInvoked !== false ||
    value.execution.freshCharged !== 0 ||
    value.execution.freshAccepted !== 0 ||
    Object.prototype.hasOwnProperty.call(portable ?? {}, "gitObjectRoot") ||
    Object.prototype.hasOwnProperty.call(portable ?? {}, "executionClosureRoot") ||
    portable?.reviewedExecutionClosureRoot !== computeV138Plan262101PortableRoot(portableBody as V138Plan262101PortableClosure) ||
    portable?.reviewedExecutionClosureRoot === portable?.installedClosureRoot ||
    value.reviewRoot !== computeV138Plan262101ReviewRoot(Buffer.from(renderV138Plan262101Report(value))) ||
    value.resultRoot !== computeV138Plan262101ResultRoot(value) ||
    canonical(value) !== canonical(expected)
  ) fail("V138_PLAN_262_101_REVIEW_MISMATCH")
  return true
}

const exclusiveWrite = (target: string, bytes: Buffer): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_101_DESTINATION_PRESENT")
  const descriptor = openSync(
    target,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}
export const publishV138Plan262101Review = (root: string) => {
  const review = deriveV138Plan262101ReviewNoPublish(root)
  const report = renderV138Plan262101Report(review)
  const jsonBytes = Buffer.from(canonical(review))
  const reportBytes = Buffer.from(report)
  exclusiveWrite(path.resolve(root, V138_PLAN_262_101_REVIEW_PATH), jsonBytes)
  try {
    exclusiveWrite(path.resolve(root, V138_PLAN_262_101_REPORT_PATH), reportBytes)
  } catch (error) {
    unlinkSync(path.resolve(root, V138_PLAN_262_101_REVIEW_PATH))
    throw error
  }
  return review
}

export const checkV138Plan262101PublishedReview = (root: string) => {
  const jsonBytes = readRegular(root, V138_PLAN_262_101_REVIEW_PATH)
  const reportBytes = readRegular(root, V138_PLAN_262_101_REPORT_PATH)
  const candidate = JSON.parse(jsonBytes.toString("utf8"))
  const expected = deriveV138Plan262101ReviewNoPublish(root)
  if (
    !jsonBytes.equals(Buffer.from(canonical(candidate))) ||
    !reportBytes.equals(Buffer.from(renderV138Plan262101Report(candidate)))
  ) fail("V138_PLAN_262_101_PAIR_MISMATCH")
  validateV138Plan262101Review(candidate, expected)
  const commits = lines(git(root, [
    "log", "--format=%H", "--all", "--",
    V138_PLAN_262_101_REVIEW_PATH,
    V138_PLAN_262_101_REPORT_PATH,
  ]))
  if (commits.length > 1) fail("V138_PLAN_262_101_PUBLICATION_LINEAGE_INVALID")
  const publicationCommit = commits[0] ?? null
  if (publicationCommit !== null) {
    const changed = lines(git(root, [
      "diff-tree", "--no-commit-id", "--name-only", "-r", publicationCommit,
    ])).sort()
    if (canonical(changed) !== canonical([
      V138_PLAN_262_101_REVIEW_PATH,
      V138_PLAN_262_101_REPORT_PATH,
    ].sort())) fail("V138_PLAN_262_101_PUBLICATION_LINEAGE_INVALID")
    requireAncestor(root, PLAN_100_SOURCE_COMMIT, publicationCommit)
    requireAncestor(root, publicationCommit, "HEAD")
    for (const [repoPath, bytes] of [
      [V138_PLAN_262_101_REVIEW_PATH, jsonBytes],
      [V138_PLAN_262_101_REPORT_PATH, reportBytes],
    ] as const) {
      if (
        !gitBuffer(root, ["cat-file", "blob", `${publicationCommit}:${repoPath}`]).equals(bytes) ||
        lines(git(root, ["log", "--format=%H", `${publicationCommit}..HEAD`, "--", repoPath])).length !== 0
      ) fail("V138_PLAN_262_101_PUBLICATION_REWRITE_INVALID")
    }
  }
  return Object.freeze({ candidate, publicationCommit })
}

export const checkV138Plan262101ConsumerBranch = (root: string) => {
  const checked = checkV138Plan262101PublishedReview(root)
  if (
    checked.candidate.status !== "blocked" ||
    checked.candidate.execution.actualConsumerStatus !== "rejected_expected" ||
    checked.candidate.authority.plan26292Eligible !== false
  ) fail("V138_PLAN_262_101_CONSUMER_BRANCH_INVALID")
  return checked
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = (review: any, publicationCommit: string | null = null) => canonical({
  status: review.status === "blocked" ? "blocked_verified" : "passed",
  findingCount: review.findingCount,
  findingRoot: review.findingRoot,
  reviewedExecutionClosureRoot:
    review.reviewedExecutionClosure.reviewedExecutionClosureRoot,
  reviewRoot: review.reviewRoot,
  resultRoot: review.resultRoot,
  publicationCommit,
  plan26292Eligible: review.authority.plan26292Eligible,
  authorizesExecution: false,
  liveInvoked: false,
  freshCharged: 0,
  freshAccepted: 0,
})
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-review-no-publish"])) {
    process.stdout.write(output(deriveV138Plan262101ReviewNoPublish(repoRoot)))
    return
  }
  if (canonical(argv) === canonical(["--write-review"])) {
    process.stdout.write(output(publishV138Plan262101Review(repoRoot)))
    return
  }
  if (canonical(argv) === canonical(["--check-review"])) {
    const { candidate, publicationCommit } = checkV138Plan262101PublishedReview(repoRoot)
    process.stdout.write(output(candidate, publicationCommit))
    return
  }
  if (canonical(argv) === canonical(["--check-review-consumer-branch"])) {
    const { candidate, publicationCommit } = checkV138Plan262101ConsumerBranch(repoRoot)
    process.stdout.write(output(candidate, publicationCommit))
    return
  }
  fail("V138_PLAN_262_101_ARGUMENTS_INVALID")
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
