#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  closeSync,
  constants,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
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
export const V138_PLAN_262_99_CHECKER_PATH =
  "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.ts"
export const V138_PLAN_262_99_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json"
export const V138_PLAN_262_99_REPORT_PATH = `${PHASE_DIR}/262-99-REVIEW.md`
export const V138_PLAN_262_99_SOURCE_PATHS = Object.freeze([
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
] as const)

const PLAN_98_SOURCE_COMMIT = "702bfa5216e3b0e15b4816ce28c98dbcdee38517"
const PLAN_98_SOURCE_TREE = "4a4ea89f5392c250d32a39abde0bcf9b98aa079f"
const PLAN_98_SOURCE_PARENT = "266c977a657c04c32a54b2293d01cf6fab1edf10"
const PLAN_98_SUMMARY_PATH = `${PHASE_DIR}/262-98-SUMMARY.md`
const PLAN_98_SUMMARY_SHA256 =
  "sha256:0d42f4833cce41f80e66d2343b4427e2b8149942c070a211338ffc0cc04dfe99"

const EXECUTED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  ...V138_PLAN_262_99_SOURCE_PATHS,
] as const)

const PLAN_96 = Object.freeze({
  planPath: `${PHASE_DIR}/262-96-PLAN.md`,
  planSha256:
    "sha256:84ea0af1612e8f188d829781f48337b7f7e2b453188fe33e86dff36b02021cd9",
  sourceCommit: "1c1f42b7fcd72d19ded89cca3ddd522090475b29",
  sourceTree: "37d10e3dfee8501e59e686802ffe684167585c94",
  sourceParent: "aae9f5dab231f83a0238cf5448f5e1e1d8ad4f28",
  summaryPath: `${PHASE_DIR}/262-96-SUMMARY.md`,
  summarySha256:
    "sha256:a3b2f63c542c69f565ca8a56d0bc8ee7e45971c52ff3ee6556e1d4f93d3132d5",
})
const PLAN_97 = Object.freeze({
  planPath: `${PHASE_DIR}/262-97-PLAN.md`,
  planSha256:
    "sha256:df0cf0066d6e837104f70b055e9c4c8f32dd0179bf335245f050a2c00c22d4ce",
  artifactPath:
    ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json",
  artifactSha256:
    "sha256:08fd056f3056bb45daf6e82a04eab72bd4ca73bda812512cad8b04960ce2b2e9",
  reviewPath: `${PHASE_DIR}/262-97-REVIEW.md`,
  reviewSha256:
    "sha256:1a7737aaa37ff886ba90e37a73d9643b5e0fdea321a6cb859e475f906562bfe7",
  summaryPath: `${PHASE_DIR}/262-97-SUMMARY.md`,
  summarySha256:
    "sha256:fa9dca2adbb113f0c30925ae8548aac935888066e2d9d2df73de793c1b5e5cc1",
  schemaVersion: "v1.38-plan-262-97-bounded-retry-source-rereview-v3",
  reviewRoot:
    "sha256:2765f8c028a7c0e089b401898d80f12fa425e993f13255423abb052f22adee90",
  findingRoot:
    "sha256:638909ad31b44fc81e01b6f081b2b1c97ad4091413e4c285c83e61d6fbbc152a",
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

export const V138_PLAN_262_99_MUTATIONS = Object.freeze([
  ["STRICT_TOP_LEVEL_SCHEMA_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "const PLAN_262_99_TOP_LEVEL_KEYS = Object.freeze([", "const PLAN_262_99_TOP_LEVEL_KEYS_BYPASSED = Object.freeze(["],
  ["STRICT_AUTHORITY_SCHEMA_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "const PLAN_262_99_AUTHORITY_KEYS = Object.freeze([", "const PLAN_262_99_AUTHORITY_KEYS_BYPASSED = Object.freeze(["],
  ["STRICT_IDENTITY_SCHEMA_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "const PLAN_262_99_IDENTITY_KEYS = Object.freeze([", "const PLAN_262_99_IDENTITY_KEYS_BYPASSED = Object.freeze(["],
  ["PORTABLE_SCHEMA_KEYS_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "const V138_REVIEWED_EXECUTION_CLOSURE_KEYS = Object.freeze([", "const V138_REVIEWED_EXECUTION_CLOSURE_KEYS_BYPASSED = Object.freeze(["],
  ["PORTABLE_ROOT_DOMAIN_CHANGED", V138_PLAN_262_99_SOURCE_PATHS[0], "v138-reviewed-execution-closure-v2\\0", "v138-reviewed-execution-closure-v1\\0"],
  ["REVIEW_ROOT_DOMAIN_CHANGED", V138_PLAN_262_99_SOURCE_PATHS[0], "v138-plan26299-source-rereview-v4\\0", "v138-plan26299-source-rereview-v3\\0"],
  ["REVIEW_PROTOCOL_CHANGED", V138_PLAN_262_99_SOURCE_PATHS[0], 'review.reviewProtocol !== "fresh-independent-plan-98-portable-closure-rereview-v4"', 'review.reviewProtocol !== "self-reviewed"'],
  ["ZERO_STATUS_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], 'review.status !== "zero_findings"', "false"],
  ["ZERO_FINDING_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], 'review.status !== "zero_findings" ||\n    review.findingCount !== 0 ||', 'review.status !== "zero_findings" ||\n    false ||'],
  ["EMPTY_FINDING_ARRAY_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "review.findings.length !== 0", "false"],
  ["SOURCE_REVIEW_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "review.sourceReviewPassed !== true", "false"],
  ["PLAN92_ELIGIBILITY_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "review.authority.plan26292Eligible !== true", "false"],
  ["PORTABLE_INSTALLED_ALIAS_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "portable.reviewedExecutionClosureRoot === portable.installedClosureRoot", "false"],
  ["PORTABLE_FULL_ALIAS_GATE_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "portable.reviewedExecutionClosureRoot === current.executionClosureRoot", "false"],
  ["PORTABLE_MEMBER_JOIN_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "if (current[key] !== body[key])", "if (false)"],
  ["LOCAL_ROOT_BEFORE_AFTER_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[0], "if (executionAfter.executionClosureRoot !== executionBefore.executionClosureRoot)", "if (false)"],
  ["FAILED_HISTORY_REINTERPRETED", V138_PLAN_262_99_SOURCE_PATHS[1], 'stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID"', 'stopCode: "NORMALIZED"'],
  ["PORTABLE_GIT_OBJECT_ALLOWED", V138_PLAN_262_99_SOURCE_PATHS[1], 'expect(review.reviewedExecutionClosure).not.toHaveProperty("gitObjectRoot")', 'expect(review.reviewedExecutionClosure).toHaveProperty("gitObjectRoot")'],
  ["INSTALLED_ROOT_ALIAS_ALLOWED", V138_PLAN_262_99_SOURCE_PATHS[1], 'expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).not.toBe(\n      review.reviewedExecutionClosure.installedClosureRoot,', 'expect(review.reviewedExecutionClosure.reviewedExecutionClosureRoot).toBe(\n      review.reviewedExecutionClosure.installedClosureRoot,'],
  ["PORTABLE_SOURCE_COMMIT_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "sourceCommit",\n    "sourceTree",', '    "sourceTree",'],
  ["PORTABLE_SOURCE_TREE_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "sourceTree",\n    "sourceParent",', '    "sourceParent",'],
  ["PORTABLE_SOURCE_PARENT_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "sourceParent",\n    "checkoutByteManifestRoot",', '    "checkoutByteManifestRoot",'],
  ["PORTABLE_CHECKOUT_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "checkoutByteManifestRoot",\n    "installedClosureRoot",', '    "installedClosureRoot",'],
  ["PORTABLE_GIT_DIGEST_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "gitExecutableSha256",\n    "gitIsolationRoot",', '    "gitIsolationRoot",'],
  ["PORTABLE_GIT_ISOLATION_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "gitIsolationRoot",\n    "nodeSha256",', '    "nodeSha256",'],
  ["PORTABLE_NODE_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "nodeSha256",\n    "pnpmDistributionSha256",', '    "pnpmDistributionSha256",'],
  ["PORTABLE_PNPM_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "pnpmDistributionSha256",\n    "nativeSourcesRoot",', '    "nativeSourcesRoot",'],
  ["PORTABLE_NATIVE_MUTATION_MISSING", V138_PLAN_262_99_SOURCE_PATHS[1], '    "nativeSourcesRoot",\n    "pathnameLaunchReplacementResistanceClaimed",', '    "pathnameLaunchReplacementResistanceClaimed",'],
  ["AUTHORITY_PATH_BRACKET_TEST_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[1], '"requires one unchanged full local root around %s"', '"skips complete local closure bracket"'],
  ["FULL_ROOT_DRIFT_TEST_REMOVED", V138_PLAN_262_99_SOURCE_PATHS[1], "expect(closureCall).toBe(2)", "expect(closureCall).toBe(1)"],
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
const lines = (value: string): string[] =>
  value.trim() === "" ? [] : value.trim().split("\n")
const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>

const isolatedGitEnvironment = (home: string): NodeJS.ProcessEnv => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  HOME: home,
  XDG_CONFIG_HOME: home,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
})
const hardenedGitArgs = (args: readonly string[]) => [
  "-c", "core.hooksPath=/dev/null",
  "-c", "core.fsmonitor=false",
  "-c", "core.autocrlf=false",
  "-c", "core.eol=lf",
  "-c", "core.safecrlf=true",
  "-c", "core.attributesFile=/dev/null",
  "-c", "core.symlinks=true",
  "-c", "advice.detachedHead=false",
  ...args,
]
const git = (root: string, args: readonly string[], home = tmpdir()): string =>
  execFileSync("/usr/bin/git", hardenedGitArgs(args), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: isolatedGitEnvironment(home),
  }).trim()
const gitBytes = (root: string, spec: string, home = tmpdir()): Buffer =>
  execFileSync("/usr/bin/git", hardenedGitArgs(["show", spec]), {
    cwd: root,
    maxBuffer: 64 * 1024 * 1024,
    env: isolatedGitEnvironment(home),
  })
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_PLAN_262_99_ANCESTRY_INVALID")
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
const readRegular = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  if (safeType(target) !== "regular") fail("V138_PLAN_262_99_INPUT_UNSAFE")
  const descriptor = openSync(
    target,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  )
  try {
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export const inspectV138Plan26299Source = (source: Source): string[] => {
  const findings = V138_PLAN_262_99_MUTATIONS.filter(
    ([, repoPath, token]) => source[repoPath]?.split(token).length - 1 !== 1,
  ).map(([code]) => code)
  const joined = V138_PLAN_262_99_SOURCE_PATHS.map(
    (repoPath) => source[repoPath] ?? "",
  ).join("\n")
  if (/Math\.random|Date\.now|node:vm|new Function/u.test(joined))
    findings.push("FORBIDDEN_NONDETERMINISM_PRESENT")
  return [...new Set(findings)].sort()
}

export const inspectV138Plan26299CorrectedSource = (root: string) => {
  const [commit, tree, parents] = git(root, [
    "show", "-s", "--format=%H%n%T%n%P", PLAN_98_SOURCE_COMMIT,
  ]).split("\n")
  if (
    commit !== PLAN_98_SOURCE_COMMIT ||
    tree !== PLAN_98_SOURCE_TREE ||
    parents !== PLAN_98_SOURCE_PARENT
  ) fail("V138_PLAN_262_99_SOURCE_IDENTITY_INVALID")
  requireAncestor(root, commit, "HEAD")
  const files = V138_PLAN_262_99_SOURCE_PATHS.map((repoPath) => {
    const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(
      git(root, ["ls-tree", commit, "--", repoPath]),
    )
    if (match === null || match[1] !== "100644" || match[3] !== repoPath)
      fail("V138_PLAN_262_99_SOURCE_TREE_INVALID")
    const committed = gitBytes(root, `${commit}:${repoPath}`)
    if (
      !committed.equals(readRegular(root, repoPath)) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0
    ) fail("V138_PLAN_262_99_SOURCE_CUSTODY_INVALID")
    return Object.freeze({
      path: repoPath,
      mode: match[1],
      blob: match[2],
      byteLength: committed.length,
      sha256: sha256(committed),
    })
  })
  if (
    files[0]?.blob !== "d23450e0578969623e6063620688f0f10d75d744" ||
    files[0]?.sha256 !== "sha256:ab5168c8ff252b912033c09655f83924c411e0c22d5319dbc5f741c9501c7bb5" ||
    files[1]?.blob !== "9e01cd52f76d04b04a87fa550077e595da2f65a4" ||
    files[1]?.sha256 !== "sha256:dcb37c409d6178f597d64a8628ceb0005d26b3392b46c4acfd1b261b4bd2450e"
  ) fail("V138_PLAN_262_99_SOURCE_BLOB_INVALID")
  const summary = readRegular(root, PLAN_98_SUMMARY_PATH)
  if (sha256(summary) !== PLAN_98_SUMMARY_SHA256)
    fail("V138_PLAN_262_99_SUMMARY_LOCATOR_INVALID")
  return Object.freeze({
    commit,
    tree,
    parent: parents,
    noLaterRewrite: true as const,
    summaryTrustedAsVerdict: false as const,
    files,
  })
}

export const inspectV138Plan26299ProtectedHistory = (root: string) => {
  for (const item of [
    [PLAN_96.planPath, PLAN_96.planSha256],
    [PLAN_96.summaryPath, PLAN_96.summarySha256],
    [PLAN_97.planPath, PLAN_97.planSha256],
    [PLAN_97.artifactPath, PLAN_97.artifactSha256],
    [PLAN_97.reviewPath, PLAN_97.reviewSha256],
    [PLAN_97.summaryPath, PLAN_97.summarySha256],
  ] as const) {
    if (sha256(readRegular(root, item[0])) !== item[1])
      fail("V138_PLAN_262_99_PROTECTED_HISTORY_BYTES_INVALID")
  }
  const plan97 = JSON.parse(readRegular(root, PLAN_97.artifactPath).toString("utf8")) as any
  if (
    git(root, ["rev-parse", `${PLAN_96.sourceCommit}^{tree}`]) !== PLAN_96.sourceTree ||
    git(root, ["show", "-s", "--format=%P", PLAN_96.sourceCommit]) !== PLAN_96.sourceParent ||
    plan97.schemaVersion !== PLAN_97.schemaVersion ||
    plan97.reviewRoot !== PLAN_97.reviewRoot ||
    plan97.findingRoot !== PLAN_97.findingRoot ||
    plan97.findingCount !== 0 ||
    !Array.isArray(plan97.findings) ||
    plan97.findings.length !== 0 ||
    plan97.sourceReviewPassed !== true ||
    plan97.authority?.plan26292Eligible !== true
  ) fail("V138_PLAN_262_99_PROTECTED_HISTORY_RESULT_INVALID")
  return Object.freeze({
    historicalResultReinterpreted: false as const,
    plan96: Object.freeze({
      sourceCommit: PLAN_96.sourceCommit,
      sourceTree: PLAN_96.sourceTree,
      sourceParent: PLAN_96.sourceParent,
      summarySha256: PLAN_96.summarySha256,
    }),
    plan97: Object.freeze({
      schemaVersion: PLAN_97.schemaVersion,
      reviewRoot: PLAN_97.reviewRoot,
      findingRoot: PLAN_97.findingRoot,
      findingCount: 0 as const,
      sourceReviewPassed: true as const,
      artifactSha256: PLAN_97.artifactSha256,
      reviewSha256: PLAN_97.reviewSha256,
      summarySha256: PLAN_97.summarySha256,
    }),
  })
}

export const snapshotV138Plan26299Destinations = (root: string) =>
  [V138_PLAN_262_99_REVIEW_PATH, V138_PLAN_262_99_REPORT_PATH, ...DOWNSTREAM_DESTINATIONS].map(
    (repoPath) => {
      const target = path.resolve(root, repoPath)
      const type = safeType(target)
      return Object.freeze({
        path: repoPath,
        type,
        ...(type === "regular" ? { sha256: sha256(readFileSync(target)) } : {}),
      })
    },
  )
const normalizeReviewPair = (
  snapshot: ReturnType<typeof snapshotV138Plan26299Destinations>,
) => snapshot.map((item) =>
  item.path === V138_PLAN_262_99_REVIEW_PATH ||
  item.path === V138_PLAN_262_99_REPORT_PATH
    ? Object.freeze({ path: item.path, type: "absent" as const })
    : item,
)

export type V138Plan26299PortableClosure = Readonly<{
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
export const computeV138Plan26299PortableRoot = (
  body: V138Plan26299PortableClosure,
): Sha256 =>
  sha256(`v138-reviewed-execution-closure-v2\0${canonical(body)}`)

const portableFrom = (
  closure: V138RetryV3ExecutionClosure,
): V138Plan26299PortableClosure => Object.freeze({
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

const OBSERVATION_IDS = Object.freeze([
  "git_isolation",
  "installed_runtime_closure",
  "executed_checkout_bytes",
  "portable_closure",
  "source_only",
  "destination_absence",
  "cleanup",
] as const)
export interface V138Plan26299Observation {
  id: (typeof OBSERVATION_IDS)[number]
  executed: boolean
  passed: boolean
  detailRoot?: Sha256
}
export const evaluateV138Plan26299Observations = (
  execution: Readonly<{ observations: readonly V138Plan26299Observation[] }>,
) => {
  const byId = new Map(execution.observations.map((item) => [item.id, item]))
  return OBSERVATION_IDS.flatMap((id) => {
    const observation = byId.get(id)
    if (observation?.executed === true && observation.passed === true) return []
    const state = observation?.executed === true ? "FAILED" : "INCOMPLETE"
    return [Object.freeze({
      code: `OBSERVATION_${id.toUpperCase()}_${state}`,
      severity: "critical" as const,
      evidenceRoot: observation?.detailRoot ?? sha256(`${id}\0${state}`),
    })]
  }).sort((left, right) => left.code.localeCompare(right.code))
}

let cachedDetachedRoot: string | undefined
let cachedDetached: any
export const runV138Plan26299DetachedExercise = (root: string) => {
  if (cachedDetachedRoot === path.resolve(root) && cachedDetached !== undefined)
    return cachedDetached
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan26299-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  const environment = isolatedGitEnvironment(owner)
  try {
    execFileSync(
      "/usr/bin/git",
      hardenedGitArgs(["clone", "--shared", "--no-checkout", root, clone]),
      { env: environment, stdio: "pipe" },
    )
    execFileSync(
      "/usr/bin/git",
      hardenedGitArgs(["checkout", "--detach", PLAN_98_SOURCE_COMMIT]),
      { cwd: clone, env: environment, stdio: "pipe" },
    )
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_99_OWNER_MODE_INVALID")
    symlinkSync(path.resolve(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    for (const packageJson of lines(git(root, ["ls-files", "*/package.json"], owner))) {
      const packageDir = path.dirname(packageJson)
      const sourceModules = path.resolve(root, packageDir, "node_modules")
      const targetModules = path.resolve(clone, packageDir, "node_modules")
      if (safeType(sourceModules) === "directory" && safeType(targetModules) === "absent")
        symlinkSync(sourceModules, targetModules, "dir")
    }
    const before = snapshotV138Plan26299Destinations(clone)
    const closureBefore = authenticateV138RetryV3ExecutionClosure(clone, {
      sourceCommit: PLAN_98_SOURCE_COMMIT,
      checkoutPaths: EXECUTED_SOURCE_PATHS,
    })
    const packageRoot = path.dirname(
      createRequire(path.join(root, "package.json")).resolve("vitest/package.json"),
    )
    const runner = path.join(packageRoot, "vitest.mjs")
    const resultPath = path.join(owner, "vitest-result.json")
    const testRun = spawnSync(
      process.execPath,
      [
        runner,
        "run",
        V138_PLAN_262_99_SOURCE_PATHS[1],
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
        env: { ...environment, PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, CI: "1" },
        timeout: 180_000,
        maxBuffer: 64 * 1024 * 1024,
        encoding: "utf8",
      },
    )
    if (testRun.status !== 0 || safeType(resultPath) !== "regular")
      fail(
        `V138_PLAN_262_99_DETACHED_TEST_FAILED:${testRun.status}:${testRun.error?.message ?? ""}:${testRun.stderr}:${safeType(resultPath) === "regular" ? readFileSync(resultPath, "utf8") : testRun.stdout}`,
      )
    const testResult = JSON.parse(readFileSync(resultPath, "utf8")) as any
    unlinkSync(resultPath)
    const tsxCli = createRequire(path.join(root, "package.json")).resolve("tsx/cli")
    const sourceOnly = JSON.parse(execFileSync(
      process.execPath,
      [tsxCli, V138_PLAN_262_99_SOURCE_PATHS[0], "--check-source-only"],
      {
        cwd: clone,
        env: { ...environment, PATH: `${path.dirname(process.execPath)}:/usr/bin:/bin`, CI: "1" },
        encoding: "utf8",
        timeout: 180_000,
        maxBuffer: 64 * 1024 * 1024,
      },
    )) as any
    const closureAfter = authenticateV138RetryV3ExecutionClosure(clone, {
      sourceCommit: PLAN_98_SOURCE_COMMIT,
      checkoutPaths: EXECUTED_SOURCE_PATHS,
      executionClosureRoot: closureBefore.executionClosureRoot,
    })
    const after = snapshotV138Plan26299Destinations(clone)
    const portable = portableFrom(closureBefore)
    const portableRoot = computeV138Plan26299PortableRoot(portable)
    if (
      canonical(before) !== canonical(after) ||
      testResult.success !== true ||
      testResult.numFailedTests !== 0 ||
      testResult.numPassedTests < 117 ||
      sourceOnly.status !== "passed" ||
      sourceOnly.liveInvoked !== false ||
      sourceOnly.freshCharged !== 0 ||
      sourceOnly.freshAccepted !== 0 ||
      sourceOnly.downstreamAuthority !== "denied" ||
      portableRoot === portable.installedClosureRoot ||
      portableRoot === closureBefore.executionClosureRoot ||
      closureAfter.executionClosureRoot !== closureBefore.executionClosureRoot
    ) fail("V138_PLAN_262_99_DETACHED_EXERCISE_INVALID")
    const observations = Object.freeze([
      { id: "git_isolation", executed: true, passed: true, detailRoot: closureBefore.gitIsolationRoot },
      { id: "installed_runtime_closure", executed: true, passed: true, detailRoot: closureBefore.installedClosureRoot },
      { id: "executed_checkout_bytes", executed: true, passed: true, detailRoot: closureBefore.checkoutByteManifestRoot },
      { id: "portable_closure", executed: true, passed: true, detailRoot: portableRoot },
      { id: "source_only", executed: true, passed: true, detailRoot: sha256(canonical(sourceOnly)) },
      { id: "destination_absence", executed: true, passed: true, detailRoot: sha256(canonical(after)) },
      { id: "cleanup", executed: true, passed: true, detailRoot: sha256("owner-disposable-cleanup") },
    ] as const)
    cachedDetached = Object.freeze({
      ownerMode: "0700" as const,
      detachedRootOwnerOnly: true as const,
      sourceCommit: PLAN_98_SOURCE_COMMIT,
      focusedTestsPassed: testResult.numPassedTests as number,
      sourceOnlyPassed: true as const,
      checkoutBytesMatchedBefore: true as const,
      checkoutBytesMatchedAfter: true as const,
      cleanupComplete: true as const,
      canonicalWrites: 0 as const,
      liveInvoked: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
      localSecretAccessed: false as const,
      identityConsumed: false as const,
      detachedGitObjectRoot: closureBefore.gitObjectRoot,
      detachedExecutionClosureRoot: closureBefore.executionClosureRoot,
      reviewedExecutionClosure: Object.freeze({
        ...portable,
        reviewedExecutionClosureRoot: portableRoot,
      }),
      observations,
    })
    cachedDetachedRoot = path.resolve(root)
    return cachedDetached
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

const sourceFinding = (code: string) => Object.freeze({
  code,
  severity: "critical" as const,
  evidenceRoot: sha256(`${code}\n`),
})
const authorityProjection = (eligible: boolean) => Object.freeze({
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
const failedAttempt = Object.freeze({
  plan: "262-92" as const,
  stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID" as const,
  status: "integrity_stop" as const,
  canonicalWrites: 0 as const,
  freshCharged: 0 as const,
  freshAccepted: 0 as const,
  localSecretAccessed: false as const,
  identityConsumed: false as const,
})

let cachedRoot: string | undefined
let cachedReview: any
export const deriveV138Plan26299ReviewNoPublish = (
  root: string,
  overrides?: Readonly<{
    source?: Source
    observations?: readonly V138Plan26299Observation[]
  }>,
) => {
  if (overrides === undefined && cachedRoot === path.resolve(root) && cachedReview !== undefined)
    return cachedReview
  if (overrides !== undefined) {
    const base = deriveV138Plan26299ReviewNoPublish(root)
    const sourceFindings = overrides.source === undefined
      ? []
      : inspectV138Plan26299Source(overrides.source).map(sourceFinding)
    const observationFindings = evaluateV138Plan26299Observations({
      observations: overrides.observations ?? base.execution.observations,
    })
    const findings = [...sourceFindings, ...observationFindings]
      .sort((left, right) => left.code.localeCompare(right.code))
    const zero = findings.length === 0
    const body = {
      ...cloneRecord(base),
      status: zero ? "zero_findings" : "blocked",
      findings,
      findingCount: findings.length,
      findingRoot: sha256(`v138-plan26299-findings\0${canonical(findings)}`),
      sourceReviewPassed: zero,
      authority: authorityProjection(zero),
    }
    delete (body as any).reviewRoot
    return Object.freeze({
      ...body,
      reviewRoot: sha256(`v138-plan26299-source-rereview-v4\0${canonical(body)}`),
    })
  }
  const before = snapshotV138Plan26299Destinations(root)
  const correctedSource = inspectV138Plan26299CorrectedSource(root)
  const protectedHistory = inspectV138Plan26299ProtectedHistory(root)
  const source = Object.fromEntries(V138_PLAN_262_99_SOURCE_PATHS.map((repoPath) => [
    repoPath,
    gitBytes(root, `${correctedSource.commit}:${repoPath}`).toString("utf8"),
  ])) as Source
  const sourceFindings = inspectV138Plan26299Source(source).map(sourceFinding)
  const detached = runV138Plan26299DetachedExercise(root)
  const observationFindings = evaluateV138Plan26299Observations(detached)
  const after = snapshotV138Plan26299Destinations(root)
  if (canonical(normalizeReviewPair(before)) !== canonical(normalizeReviewPair(after)))
    fail("V138_PLAN_262_99_DESTINATION_MUTATED")
  const findings = [...sourceFindings, ...observationFindings]
    .sort((left, right) => left.code.localeCompare(right.code))
  const zero = findings.length === 0
  const execution = Object.freeze({
    focusedTestsPassed: detached.focusedTestsPassed,
    sourceOnlyPassed: detached.sourceOnlyPassed,
    checkoutBytesMatchedBefore: detached.checkoutBytesMatchedBefore,
    checkoutBytesMatchedAfter: detached.checkoutBytesMatchedAfter,
    cleanupComplete: detached.cleanupComplete,
    canonicalWrites: 0 as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    localSecretAccessed: false as const,
    identityConsumed: false as const,
    detachedExecutionClosureRoot: detached.detachedExecutionClosureRoot,
    observations: detached.observations,
  })
  const body = {
    schemaVersion: "v1.38-plan-262-99-bounded-retry-source-rereview-v4" as const,
    reviewProtocol: "fresh-independent-plan-98-portable-closure-rereview-v4" as const,
    status: zero ? ("zero_findings" as const) : ("blocked" as const),
    correctedSource,
    protectedHistory,
    failedAttempt,
    execution,
    reviewedExecutionClosure: detached.reviewedExecutionClosure,
    findings,
    findingCount: findings.length,
    findingRoot: sha256(`v138-plan26299-findings\0${canonical(findings)}`),
    sourceReviewPassed: zero,
    identityClaims,
    authority: authorityProjection(zero),
  }
  cachedReview = Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26299-source-rereview-v4\0${canonical(body)}`),
  })
  cachedRoot = path.resolve(root)
  return cachedReview
}

export const computeV138Plan26299ReviewRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.reviewRoot
  return sha256(`v138-plan26299-source-rereview-v4\0${canonical(body)}`)
}
export const validateV138Plan26299Review = (
  candidate: unknown,
  expected: unknown,
): true => {
  const value = candidate as any
  const portable = value?.reviewedExecutionClosure
  const portableBody = portable === undefined
    ? undefined
    : Object.fromEntries(Object.entries(portable).filter(([key]) => key !== "reviewedExecutionClosureRoot"))
  const falseAuthorityExceptions = new Set([
    "plan26292Eligible", "freshCharged", "freshAccepted",
  ])
  if (
    value?.schemaVersion !== "v1.38-plan-262-99-bounded-retry-source-rereview-v4" ||
    value.reviewProtocol !== "fresh-independent-plan-98-portable-closure-rereview-v4" ||
    canonical(value) !== canonical(expected) ||
    value.reviewRoot !== computeV138Plan26299ReviewRoot(value) ||
    value.findingCount !== value.findings?.length ||
    value.findingRoot !== sha256(`v138-plan26299-findings\0${canonical(value.findings)}`) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.authority?.plan26292Eligible !== (value.findingCount === 0) ||
    value.correctedSource?.commit !== PLAN_98_SOURCE_COMMIT ||
    value.protectedHistory?.historicalResultReinterpreted !== false ||
    value.protectedHistory?.plan97?.reviewRoot !== PLAN_97.reviewRoot ||
    value.failedAttempt?.status !== "integrity_stop" ||
    value.failedAttempt?.canonicalWrites !== 0 ||
    value.failedAttempt?.freshCharged !== 0 ||
    value.failedAttempt?.freshAccepted !== 0 ||
    value.failedAttempt?.localSecretAccessed !== false ||
    value.failedAttempt?.identityConsumed !== false ||
    portable === undefined ||
    Object.prototype.hasOwnProperty.call(portable, "gitObjectRoot") ||
    portable.reviewedExecutionClosureRoot !== computeV138Plan26299PortableRoot(portableBody as V138Plan26299PortableClosure) ||
    portable.reviewedExecutionClosureRoot === portable.installedClosureRoot ||
    portable.reviewedExecutionClosureRoot === value.execution?.detachedExecutionClosureRoot ||
    Object.entries(value.authority).some(([key, item]) =>
      !falseAuthorityExceptions.has(key) && item !== false) ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  ) fail("V138_PLAN_262_99_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26299Report = (review: any): string => {
  const verdict = review.findingCount === 0 ? "ZERO FINDINGS" : "BLOCKED"
  const findings = review.findingCount === 0
    ? "None."
    : review.findings.map((item: any) =>
        `- **${item.code}** (${item.severity}) — evidence root \`${item.evidenceRoot}\`.`,
      ).join("\n")
  return `---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "99"
review_protocol: ${review.reviewProtocol}
reviewed_source_commit: ${review.correctedSource.commit}
finding_count: ${review.findingCount}
source_review_passed: ${review.sourceReviewPassed}
status: ${review.status}
finding_root: ${review.findingRoot}
review_root: ${review.reviewRoot}
---

# Phase 262 Plan 99: Portable Execution-Closure Re-review

## Verdict

**${verdict}.** This committed-byte re-review is non-authorizing. ${review.authority.plan26292Eligible ? "Literal zero findings make only Plan 262-92 eligible." : "Plans 262-92 through 262-95 remain blocked."}

## Plan-98 Source Custody

- Source-completion commit: \`${review.correctedSource.commit}\`
- Tree: \`${review.correctedSource.tree}\`
- Sole parent: \`${review.correctedSource.parent}\`
- Producer and focused test are exact mode-100644 committed blobs with no later rewrite.
- The Plan-98 summary was used only as a locator; its verdict prose was not trusted.

## Detached Review

An owner-only \`0700\` detached checkout ran ${review.execution.focusedTestsPassed} committed focused tests plus source-only validation. All required observations passed without canonical writes, live invocation, secret access, or capacity identity consumption.

## Portable Reviewed Closure

- Schema: \`${review.reviewedExecutionClosure.schemaVersion}\`
- Portable root: \`${review.reviewedExecutionClosure.reviewedExecutionClosureRoot}\`
- Installed closure member: \`${review.reviewedExecutionClosure.installedClosureRoot}\`
- Detached full local root: \`${review.execution.detachedExecutionClosureRoot}\`
- \`gitObjectRoot\` is excluded from the portable tuple and retained only in the detached full local root.
- The portable, installed, and full roots are distinct hash domains.

## Findings

${findings}

## Protected and Failed History

Plans 96 and 97 retain their exact committed identities. Plan 97 remains a literal-zero historical review with root \`${review.protectedHistory.plan97.reviewRoot}\`; \`historicalResultReinterpreted\` is false. The failed Plan-92 attempt remains an incompatible-schema integrity stop before publication with zero writes, fresh 0/0, no secret access, and no consumed identity.

## Non-Authority

No seal-v13, envelope-v3, journal, receipt, terminal, reproduction-v17, disposition-v3, correction-v11, Route-11 activation, lifecycle-v3, execution, Phase-263, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, or tag authority was created.

## Roots

- Finding root: \`${review.findingRoot}\`
- Review root: \`${review.reviewRoot}\`
`
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_99_DESTINATION_PRESENT")
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
export const publishV138Plan26299Review = (root: string) => {
  const review = deriveV138Plan26299ReviewNoPublish(root)
  const json = path.resolve(root, V138_PLAN_262_99_REVIEW_PATH)
  const report = path.resolve(root, V138_PLAN_262_99_REPORT_PATH)
  exclusiveWrite(json, canonical(review))
  try {
    exclusiveWrite(report, renderV138Plan26299Report(review))
  } catch (error) {
    unlinkSync(json)
    throw error
  }
  return review
}
export const checkV138Plan26299PublishedReview = (root: string) => {
  const bytes = readRegular(root, V138_PLAN_262_99_REVIEW_PATH).toString("utf8")
  const report = readRegular(root, V138_PLAN_262_99_REPORT_PATH).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Plan26299ReviewNoPublish(root)
  if (
    bytes !== canonical(candidate) ||
    report !== renderV138Plan26299Report(candidate)
  ) fail("V138_PLAN_262_99_PAIR_MISMATCH")
  validateV138Plan26299Review(candidate, expected)
  const commits = lines(git(root, [
    "log", "--format=%H", "--all", "--",
    V138_PLAN_262_99_REVIEW_PATH,
    V138_PLAN_262_99_REPORT_PATH,
  ]))
  let publicationCommit: string | null = null
  if (commits.length > 1) fail("V138_PLAN_262_99_PUBLICATION_LINEAGE_INVALID")
  if (commits.length === 1) {
    publicationCommit = commits[0]!
    const changed = lines(git(root, [
      "diff-tree", "--no-commit-id", "--name-only", "-r", publicationCommit,
    ])).sort()
    if (canonical(changed) !== canonical([
      V138_PLAN_262_99_REVIEW_PATH,
      V138_PLAN_262_99_REPORT_PATH,
    ].sort())) fail("V138_PLAN_262_99_PUBLICATION_LINEAGE_INVALID")
    requireAncestor(root, PLAN_98_SOURCE_COMMIT, publicationCommit)
    requireAncestor(root, publicationCommit, "HEAD")
    for (const repoPath of [V138_PLAN_262_99_REVIEW_PATH, V138_PLAN_262_99_REPORT_PATH]) {
      if (
        !gitBytes(root, `${publicationCommit}:${repoPath}`).equals(readRegular(root, repoPath)) ||
        lines(git(root, ["log", "--format=%H", `${publicationCommit}..HEAD`, "--", repoPath])).length !== 0
      ) fail("V138_PLAN_262_99_PUBLICATION_REWRITE_INVALID")
    }
  }
  return Object.freeze({ candidate, publicationCommit })
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = (review: any, publicationCommit: string | null = null) => canonical({
  status: review.findingCount === 0 ? "passed" : "blocked_verified",
  findingCount: review.findingCount,
  findingRoot: review.findingRoot,
  reviewedExecutionClosureRoot:
    review.reviewedExecutionClosure.reviewedExecutionClosureRoot,
  reviewRoot: review.reviewRoot,
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
    process.stdout.write(output(deriveV138Plan26299ReviewNoPublish(repoRoot)))
    return
  }
  if (canonical(argv) === canonical(["--write-review"])) {
    process.stdout.write(output(publishV138Plan26299Review(repoRoot)))
    return
  }
  if (canonical(argv) === canonical(["--check-review"])) {
    const { candidate, publicationCommit } = checkV138Plan26299PublishedReview(repoRoot)
    process.stdout.write(output(candidate, publicationCommit))
    return
  }
  fail("V138_PLAN_262_99_ARGUMENTS_INVALID")
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
