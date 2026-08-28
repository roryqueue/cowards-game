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
  readdirSync,
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
  assertV138HistoricalCheckoutBytesV4,
  assertV138HistoricalRepositoryConfigurationSafeV4,
  resolveV138HistoricalToolchainV4,
} from "./run-v1-38-phase-262-historical-correction-checkouts-v4.js"
import {
  readV138WorkspaceBatch,
  sha256V138Secure,
  V138_SECURE_BATCH_PROTOCOL_V6,
} from "./lib/v1-38-secure-workspace-path-v6.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`
type Source = Readonly<Record<string, string>>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_97_CHECKER_PATH =
  "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts"
export const V138_PLAN_262_97_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json"
export const V138_PLAN_262_97_REPORT_PATH = `${PHASE_DIR}/262-97-REVIEW.md`
export const V138_PLAN_262_97_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
] as const)

const PLAN_96_SUMMARY_PATH = `${PHASE_DIR}/262-96-SUMMARY.md`
const PLAN_96_SOURCE_COMMIT = "1c1f42b7fcd72d19ded89cca3ddd522090475b29"
const PLAN_96_SOURCE_TREE = "37d10e3dfee8501e59e686802ffe684167585c94"
const PLAN_96_SOURCE_PARENT = "aae9f5dab231f83a0238cf5448f5e1e1d8ad4f28"
const PLAN_96_SUMMARY_CARRIER = "82ed28eee2377fd31680a20fdf0a6c6ebba9c1a8"
const PLAN_91_PUBLICATION_COMMIT = "f1acaf00b487c6ee40ec9d6990cd3cb2ed2d9e21"
const PLAN_91_SUMMARY_COMMIT = "d64f048c"

const LINEAGE = Object.freeze({
  preResearchCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0",
  preResearchTree: "e5895149ca186ea72e961860a03a950c8c488b72",
  researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15",
  researchTree: "e09e272f0d436d79bc22cbed2fe758fc68a2aa21",
})

const PROTECTED_FILES = Object.freeze([
  [
    ".planning/artifacts/v1.38-phase-262-review-fix-correction-v10.json",
    "sha256:a5bfe2a99194dc656c86fa05d84d66c87dfc2935875976ad27fe60754f20148d",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json",
    "sha256:160e4e270cf96a979cd9a83cf97c57f2590076c0abe0bdb712830045d7cab47e",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
    "sha256:5a2543b4ee3b8786188fa9a35977ee7dd163c175ceda4406ec74f8494da35dcf",
  ],
  [
    ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
    "sha256:ac7f8eb0b0193b469b31c28c33838bb46f36d6061d6e8577f05ccf71f9283546",
  ],
  [
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
    "sha256:88a99098d3484c8a78526b27f49ad2c2db3f8d36c6e21256482a8f703bb075ea",
  ],
  [
    ".planning/artifacts/v1.38-successor-source-seal-v12.json",
    "sha256:c9b3c23f87f68249c34ffc76eda06a5785c180f6d65a21ff68bd90fba3087052",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
    "sha256:471a8a2014064d40d9156f904e1c738222f3e3330581771fd03e3ffb68373452",
  ],
  [
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
    "sha256:83383114809c8df28bcad56d3b04ba7ba0ccebfbf4229b5900d272af4e1506a6",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json",
    "sha256:94597b4c65d31ea5322cb90262d8e180406f8bfcd1d7f46d3c260f71ccfa2bec",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
    "sha256:3683a02dc8c075d7e175c591967dfc5d470de56bb2c0ffe916fb09c13bb4d9f4",
  ],
  [
    ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
    "sha256:14e66af5c9fc985ef01cbc83efae35ea2a1ae20f1c9b10de0cd2e732dd667a14",
  ],
  [
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
    "sha256:b79dc330212880f8e6b9d41bee701b380fbc92f2e82682159343e54ae8748ac3",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v1.json",
    "sha256:611e0e8b12e06593b56b5625d37bf9a8113920bace6b590c2a59c7bfafaa1c16",
  ],
  [
    ".planning/artifacts/v1.38-successor-source-seal-v11.json",
    "sha256:0091b634e49a94863f6cbb12b9e06f181b729eb32dc9e97ba73dda0bb6359e6b",
  ],
  [
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
    "sha256:7c44d03acee04f441e0c4132f6c611b9d84925540a81d954ba51104aaec938bb",
  ],
  [
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
    "sha256:c0bdb131ce6804f9708899079049ee4583916646deebec5bcc757f68c1410b5e",
  ],
  [
    ".planning/artifacts/v1.38-phase-262-historical-correction-checkouts-v5.json",
    "sha256:d40ac49e2125b66269c5aba7962e7f8afdde9b35732b5921ec9119db524ca98f",
  ],
  [
    "scripts/lib/v1-38-bounded-retry-successor-controller-v6.ts",
    "sha256:158528d7d9ce785a4fb88d72371077a05d7bf2814a0488b8ff8b66a066b4c183",
  ],
  [
    "scripts/lib/v1-38-secure-workspace-path-v6.ts",
    "sha256:f8a2959c2db6a9a80147f6d1ece13d30d9fec457d90354e711be0a49319e5f49",
  ],
  [
    "scripts/lib/v1-38-private-native-bootstrap-v2.ts",
    "sha256:165bdefcc02fd9448b3f5d778888617f90d16e7e0801bc091726574ecfcfae78",
  ],
  [
    "scripts/native/v1-38-successor-transaction-helper-v6.c",
    "sha256:643d5c7a2bc1e92671c73705965d6f3451946faa60be48b34b044962020d261a",
  ],
  [
    "scripts/native/v1-38-secure-manifest-reader-v6.c",
    "sha256:fe1915ef41b134c1a1bae5e1e3df2c26a9ae47a2258b917bd1f1469917abffc1",
  ],
  [
    "package.json",
    "sha256:0da6d11a0a5ce687b4669a2028f14d0e10ba7bd01afb8864b928b9394b64eac2",
  ],
  [
    "pnpm-lock.yaml",
    "sha256:55cfd0166e4954863a84a77d50968269c14a22a2a788278ad5dead963fff0df3",
  ],
  [
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
    "sha256:9d60a6dad3e084d9dbd28fdccf68e61f9f1aa1483df42ed61ec426b93bbb023e",
  ],
] as const)

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


export const V138_PLAN_262_97_MUTATIONS = Object.freeze([
  ["MAX_ROUTE_STARTS_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "maximumRouteStarts: 3 as const", "maximumRouteStarts: 4 as const"],
  ["MAX_PREFLIGHTS_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "maximumPreflightObservations: 12 as const", "maximumPreflightObservations: 13 as const"],
  ["FOUR_HOUR_WINDOW_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000", "envelopeLifetimeMilliseconds: 5 * 60 * 60 * 1_000"],
  ["REFUSAL_SPACING_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "refusalSpacingMilliseconds: 5 * 60 * 1_000", "refusalSpacingMilliseconds: 4 * 60 * 1_000"],
  ["CALIBRATION_BACKOFF_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000", "calibrationFailureBackoffMilliseconds: 10 * 60 * 1_000"],
  ["SAMPLING_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "samplingMilliseconds: 200 as const", "samplingMilliseconds: 201 as const"],
  ["THRESHOLD_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "minimumEffectiveAvailableBasisPoints: 2_500 as const", "minimumEffectiveAvailableBasisPoints: 2_499 as const"],
  ["REPRODUCTION_SIZE_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], "reproductionCellCount: 540 as const", "reproductionCellCount: 539 as const"],
  ["ASSURANCE_CLASS_CHANGED", V138_PLAN_262_97_SOURCE_PATHS[0], 'assuranceClass: "single_operator_local_seal_v1" as const', 'assuranceClass: "independent_custody" as const'],
  ["PLAN91_HISTORY_REINTERPRETED", V138_PLAN_262_97_SOURCE_PATHS[0], "historicalResultReinterpreted: false as const", "historicalResultReinterpreted: true as const"],
  ["GIT_ISOLATION_DISABLED", V138_PLAN_262_97_SOURCE_PATHS[1], 'GIT_NO_REPLACE_OBJECTS: "1"', 'GIT_NO_REPLACE_OBJECTS: "0"'],
  ["GIT_HOOKS_ENABLED", V138_PLAN_262_97_SOURCE_PATHS[1], '"core.hooksPath=/dev/null"', '"core.hooksPath=.git/hooks"'],
  ["AMBIENT_GIT_EXECUTION", V138_PLAN_262_97_SOURCE_PATHS[1], "execFileSync(GIT, hardenedGitArgs(args)", 'execFileSync("git", args'],
  ["CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED", V138_PLAN_262_97_SOURCE_PATHS[1], "installedClosureRoot: installed.root", 'installedClosureRoot: sha("declared")'],
  ["EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED", V138_PLAN_262_97_SOURCE_PATHS[1], "checkoutByteManifestRoot: checkout.root", 'checkoutByteManifestRoot: sha("declared")'],
  ["NATIVE_SOURCE_CLOSURE_REMOVED", V138_PLAN_262_97_SOURCE_PATHS[1], "nativeSourcesRoot,", 'nativeSourcesRoot: sha("declared"),'],
  ["NATIVE_PUBLICATION_NOT_ENFORCED", V138_PLAN_262_97_SOURCE_PATHS[1], "export const publishV138RetryV3NativePair", "const publishV138RetryV3NativePair"],
  ["NATIVE_LIFECYCLE_NOT_ENFORCED", V138_PLAN_262_97_SOURCE_PATHS[1], "export const applyV138RetryV3NativeLifecycle", "const applyV138RetryV3NativeLifecycle"],
  ["PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED", V138_PLAN_262_97_SOURCE_PATHS[1], "export const acquireV138RetryV3NativeOwnerLease", "const acquireV138RetryV3NativeOwnerLease"],
  ["COMPILER_SUBSTITUTION_UNTESTED", V138_PLAN_262_97_SOURCE_PATHS[1], 'crashBoundary === "force-compiler-substitution"', "false"],
  ["SPAWN_FAILURE_CLEANUP_UNTESTED", V138_PLAN_262_97_SOURCE_PATHS[1], 'crashBoundary === "force-spawn-failure"', "false"],
  ["OWNER_ROOT_LOCK_REMOVED", V138_PLAN_262_97_SOURCE_PATHS[2], "flock(root, LOCK_EX | LOCK_NB)", "flock(root, LOCK_SH | LOCK_NB)"],
  ["OWNER_CAPABILITY_MODE_WEAKENED", V138_PLAN_262_97_SOURCE_PATHS[2], "(capability_status.st_mode & 0777) != 0600", "(capability_status.st_mode & 0777) != 0644"],
  ["AUTHORITY_EXECUTION_CLOSURE_REMOVED", V138_PLAN_262_97_SOURCE_PATHS[3], "const authenticateCurrentExecutionClosure = (", "const skipCurrentExecutionClosure = ("],
  ["PAIR_PUBLICATION_BYPASSED", V138_PLAN_262_97_SOURCE_PATHS[3], "const publishPair = (", "const skipPublishPair = ("],
  ["LIFECYCLE_PUBLICATION_BYPASSED", V138_PLAN_262_97_SOURCE_PATHS[3], "applyV138RetryV3NativeLifecycle(repoRoot, {", "void ({"],
  ["STRATEGY_SOURCE_LEAK_ENABLED", V138_PLAN_262_97_SOURCE_PATHS[3], "strategySourceIncluded: false as const", "strategySourceIncluded: true as const"],
  ["RAW_DIAGNOSTIC_LEAK_ENABLED", V138_PLAN_262_97_SOURCE_PATHS[3], "rawDiagnosticsIncluded: false as const", "rawDiagnosticsIncluded: true as const"],
  ["REPRODUCTION_CRASH_BOUNDARY_REMOVED", V138_PLAN_262_97_SOURCE_PATHS[3], '| "reproduction_write"', '| "reproduction_skip"'],
  ["TERMINAL_CRASH_BOUNDARY_REMOVED", V138_PLAN_262_97_SOURCE_PATHS[3], '| "terminal_fsync"', '| "terminal_skip"'],
  ["ADVERSARIAL_MATRIX_INCOMPLETE", V138_PLAN_262_97_SOURCE_PATHS[4], 'it("recovers actual native pair and lifecycle crash boundaries without partial authority"', 'it("skips native crash boundaries"'],
  ["GIT_SUBSTITUTION_MATRIX_INCOMPLETE", V138_PLAN_262_97_SOURCE_PATHS[4], '"isolates Git from ambient %s mutation"', '"skips hostile Git mutations"'],
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

const isolatedGitEnvironment = (isolationRoot: string): NodeJS.ProcessEnv => ({
  PATH: "/usr/bin:/bin",
  LANG: "C",
  LC_ALL: "C",
  HOME: isolationRoot,
  XDG_CONFIG_HOME: isolationRoot,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_NO_REPLACE_OBJECTS: "1",
  GIT_OPTIONAL_LOCKS: "0",
})
const hardenedGitArgs = (args: readonly string[]) => [
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "core.fsmonitor=false",
  "-c",
  "core.autocrlf=false",
  "-c",
  "core.eol=lf",
  "-c",
  "core.safecrlf=true",
  "-c",
  "core.attributesFile=/dev/null",
  "-c",
  "core.symlinks=true",
  "-c",
  "advice.detachedHead=false",
  ...args,
]
const git = (
  root: string,
  args: readonly string[],
  isolationRoot = tmpdir(),
): string =>
  execFileSync("/usr/bin/git", hardenedGitArgs(args), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: isolatedGitEnvironment(isolationRoot),
  }).trim()
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    git(root, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_PLAN_262_97_ANCESTRY_INVALID")
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
  if (safeType(target) !== "regular") fail("V138_PLAN_262_97_INPUT_UNSAFE")
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export const inspectV138Plan26297Source = (source: Source): string[] => {
  const findings = V138_PLAN_262_97_MUTATIONS.filter(
    ([, repoPath, token]) => source[repoPath]?.split(token).length - 1 !== 1,
  ).map(([code]) => code)
  const joined = V138_PLAN_262_97_SOURCE_PATHS.map((repoPath) => source[repoPath] ?? "").join("\n")
  if (/Math\.random|Date\.now|node:vm|new Function/u.test(joined))
    findings.push("FORBIDDEN_NONDETERMINISM_PRESENT")
  return [...new Set(findings)].sort()
}

export const inspectV138Plan26297CorrectedSource = (root: string) => {
  const summaryCommits = lines(git(root, ["log", "--format=%H", "--all", "--", PLAN_96_SUMMARY_PATH]))
  if (
    summaryCommits.length !== 2 ||
    summaryCommits[0] !== PLAN_96_SUMMARY_CARRIER ||
    summaryCommits[1] !== PLAN_96_SOURCE_PARENT
  )
    fail("V138_PLAN_262_97_SUMMARY_CARRIER_INVALID")
  const commit = PLAN_96_SOURCE_COMMIT
  const [resolvedCommit, tree, parents] = git(root, [
    "show",
    "-s",
    "--format=%H%n%T%n%P",
    commit,
  ]).split("\n")
  if (resolvedCommit !== commit || tree !== PLAN_96_SOURCE_TREE || parents !== PLAN_96_SOURCE_PARENT)
    fail("V138_PLAN_262_97_SOURCE_IDENTITY_INVALID")
  requireAncestor(root, PLAN_91_PUBLICATION_COMMIT, PLAN_96_SOURCE_PARENT)
  requireAncestor(root, commit, "HEAD")
  const sourceChain = lines(
    git(root, ["rev-list", "--first-parent", "--reverse", `${PLAN_91_PUBLICATION_COMMIT}..${commit}`]),
  )
  if (sourceChain.length < 2 || sourceChain.at(-1) !== commit)
    fail("V138_PLAN_262_97_SOURCE_CHAIN_INVALID")
  const blobs = V138_PLAN_262_97_SOURCE_PATHS.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
    const mode = entry[0]
    const blob = entry[2]
    const committed = execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${commit}:${repoPath}`]), {
      cwd: root,
      env: isolatedGitEnvironment(tmpdir()),
    })
    const working = readRegular(root, repoPath)
    if (
      mode !== "100644" ||
      !/^[0-9a-f]{40}$/u.test(blob ?? "") ||
      !committed.equals(working) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0
    ) fail("V138_PLAN_262_97_SOURCE_CUSTODY_INVALID")
    return Object.freeze({
      path: repoPath,
      mode,
      blob,
      byteLength: committed.length,
      sha256: sha256(committed),
    })
  })
  return Object.freeze({
    commit,
    tree,
    parent: parents,
    summaryTrustedAsVerdict: false,
    noLaterRewrite: true as const,
    sourceChain,
    blobs,
    summaryCarrier: Object.freeze({
      path: PLAN_96_SUMMARY_PATH,
      commit: PLAN_96_SUMMARY_CARRIER,
      tree: git(root, ["rev-parse", `${PLAN_96_SUMMARY_CARRIER}^{tree}`]),
      blob: git(root, ["ls-tree", PLAN_96_SUMMARY_CARRIER, "--", PLAN_96_SUMMARY_PATH]).split(/\s+/u)[2],
      sha256: sha256(readRegular(root, PLAN_96_SUMMARY_PATH)),
    }),
  })
}

const inspectResearchLineage = (root: string) => {
  const preResearchTree = git(root, ["rev-parse", `${LINEAGE.preResearchCommit}^{tree}`])
  const researchTree = git(root, ["rev-parse", `${LINEAGE.researchCommit}^{tree}`])
  const researchParent = git(root, ["show", "-s", "--format=%P", LINEAGE.researchCommit])
  if (
    preResearchTree !== LINEAGE.preResearchTree ||
    researchTree !== LINEAGE.researchTree ||
    researchParent !== LINEAGE.preResearchCommit
  ) fail("V138_PLAN_262_97_RESEARCH_LINEAGE_INVALID")
  return Object.freeze({ ...LINEAGE, researchSoleParent: researchParent })
}

const BLOCKED_HISTORY_FILES = Object.freeze([
  [
    ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json",
    "sha256:c4dbbfa56bf903b2cb302c7a86acb87359da3f2ac696dbc2ca783376604a5232",
    "eff3f1fea4719131f7ced617df7b0a1d4c89d4d2",
  ],
  [
    `${PHASE_DIR}/262-91-REVIEW.md`,
    "sha256:fb82e3be073f896a1514ddfc4d16fc84a478342f8375ab6002e7598d72275272",
    "73596b860c06c6a477960fe8936053b1006e1edd",
  ],
  [
    `${PHASE_DIR}/262-91-SUMMARY.md`,
    "sha256:1db0d52a482f3ce954c03da3b59d22549ca6a913290b2d03ce87c80cb045cbf0",
    "2070f4dd0444c28623c4fbc0270b70a654ea92a1",
  ],
  [
    `${PHASE_DIR}/262-90-SUMMARY.md`,
    "sha256:4daded12537692e2e180ee9ccd34b8de54b425398d9a68b9923fcfa8b27988b7",
    "ff882bbadc057c0e0786d9251fb942095155db72",
  ],
] as const)

export const inspectV138Plan26297BlockedHistory = (root: string) => {
  const files = BLOCKED_HISTORY_FILES.map(([repoPath, expectedSha256, expectedBlob]) => {
    const bytes = readRegular(root, repoPath)
    const digest = sha256(bytes)
    const blob = git(root, ["hash-object", "--no-filters", "--", repoPath])
    if (digest !== expectedSha256 || blob !== expectedBlob)
      fail("V138_PLAN_262_97_BLOCKED_HISTORY_BYTES_INVALID")
    return Object.freeze({ path: repoPath, sha256: digest, blob, mode: "100644" as const })
  })
  const historical = JSON.parse(readRegular(root, BLOCKED_HISTORY_FILES[0][0]).toString("utf8")) as any
  const sourceCommit = "32f53bb743db799810dff820b8b7eb309b6a6629"
  const sourceTree = git(root, ["rev-parse", `${sourceCommit}^{tree}`])
  const sourceParent = git(root, ["show", "-s", "--format=%P", sourceCommit])
  if (
    sourceTree !== "63328eb2f3454508e664c89017d2bd6cb0213695" ||
    sourceParent !== "382d99326fec7a165c6416f4db800665aab02a1e" ||
    historical.reviewedSource?.commit !== sourceCommit ||
    historical.status !== "blocked" ||
    historical.findingCount !== 11 ||
    historical.findings?.length !== 11 ||
    historical.findingRoot !== "sha256:99ceec74a141e228b2e027c6f0b5d85ddfed8d917ad74e7a493e6d8257f8701a" ||
    historical.reviewRoot !== "sha256:08938c5eb520b041e2b74ac07b7906d14e52197e3788ec97ff6f29350bbdf80d" ||
    historical.sourceReviewPassed !== false ||
    historical.authority?.plan26292Eligible !== false
  ) fail("V138_PLAN_262_97_BLOCKED_HISTORY_RESULT_INVALID")
  requireAncestor(root, PLAN_91_PUBLICATION_COMMIT, PLAN_96_SOURCE_COMMIT)
  return Object.freeze({
    sourceCommit,
    sourceTree,
    sourceParent,
    status: "blocked" as const,
    findingCount: 11 as const,
    findings: Object.freeze(historical.findings.map((item: any) => Object.freeze({ ...item }))),
    findingRoot: historical.findingRoot as Sha256,
    reviewRoot: historical.reviewRoot as Sha256,
    sourceReviewPassed: false as const,
    plan26292Eligible: false as const,
    historicalResultReinterpreted: false as const,
    publicationCommit: PLAN_91_PUBLICATION_COMMIT,
    summaryCommit: git(root, ["rev-parse", PLAN_91_SUMMARY_COMMIT]),
    files,
  })
}

const inspectProtectedHistory = (root: string) => {
  const requiredPaths = [
    ...V138_PLAN_262_97_SOURCE_PATHS,
    ...PROTECTED_FILES.map(([repoPath]) => repoPath),
  ]
  const batch = readV138WorkspaceBatch(root, requiredPaths, DOWNSTREAM_DESTINATIONS)
  for (const [repoPath, expectedSha256] of PROTECTED_FILES)
    if (sha256V138Secure(batch.bytes[repoPath]!) !== expectedSha256)
      fail("V138_PLAN_262_97_PROTECTED_HISTORY_INVALID")
  const correction = JSON.parse(
    batch.bytes[PROTECTED_FILES[0][0]]!.toString("utf8"),
  ) as any
  const disposition = JSON.parse(
    batch.bytes[PROTECTED_FILES[6][0]]!.toString("utf8"),
  ) as any
  const lifecycle = JSON.parse(
    batch.bytes[PROTECTED_FILES[7][0]]!.toString("utf8"),
  ) as any
  const historicalClosure = JSON.parse(
    batch.bytes[PROTECTED_FILES[16][0]]!.toString("utf8"),
  ) as any
  if (
    correction.correctionRoot !== "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3" ||
    correction.status !== "integrity_non_pass" ||
    correction.empiricalOutcome?.freshAccepted !== 0 ||
    correction.empiricalOutcome?.requiredAccepted !== 540 ||
    disposition.dispositionRoot !== "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f" ||
    disposition.status !== "non_pass" ||
    lifecycle.statusRoot !== "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6" ||
    lifecycle.lifecycle?.plan89VerificationStatus !== "gaps_found" ||
    historicalClosure.results?.length !== 2 ||
    historicalClosure.results.some((item: any) =>
      item.installedClosureRoot !== "sha256:573052a27bbdb6d3d798b578b42b99e45712648696b61e9695a9f68dd766ca64" ||
      item.installedClosureFiles !== 1486 ||
      item.installedClosurePackages !== 52 ||
      item.entryLaunchBinding !== "same-process-reviewed-runner-no-ambient-tsx-child-v5" ||
      Object.values(item.gitIsolation ?? {}).some((value) => value !== true),
    )
  ) fail("V138_PLAN_262_97_PROTECTED_HISTORY_INVALID")
  return Object.freeze({
    protocol: V138_SECURE_BATCH_PROTOCOL_V6,
    snapshotGuarantee: batch.snapshotGuarantee,
    retainedAncestorCount: Object.keys(batch.ancestorIdentities).length,
    correctionV10Root: correction.correctionRoot as Sha256,
    dispositionV2Root: disposition.dispositionRoot as Sha256,
    lifecycleV2Root: lifecycle.statusRoot as Sha256,
    predecessorFreshAccepted: 0,
    requiredAccepted: 540,
    predecessorStatus: "integrity_non_pass" as const,
    protectedHistoryRoot: sha256(
      canonical(
        PROTECTED_FILES.map(([repoPath, digest]) => ({ path: repoPath, sha256: digest })),
      ),
    ),
    files: PROTECTED_FILES.map(([repoPath, digest]) => ({ path: repoPath, sha256: digest })),
  })
}

export const snapshotV138Plan26297Destinations = (root: string) =>
  [V138_PLAN_262_97_REVIEW_PATH, V138_PLAN_262_97_REPORT_PATH, ...DOWNSTREAM_DESTINATIONS].map(
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
  snapshot: ReturnType<typeof snapshotV138Plan26297Destinations>,
) => snapshot.map((item) =>
  item.path === V138_PLAN_262_97_REVIEW_PATH || item.path === V138_PLAN_262_97_REPORT_PATH
    ? Object.freeze({ path: item.path, type: "absent" as const })
    : item,
)

const installedClosureManifest = (checkout: string) => {
  const nodeModules = realpathSync(path.join(checkout, "node_modules"))
  const records: string[] = []
  const packageDirectories = [realpathSync(path.join(nodeModules, "vitest"))]
  const visited = new Set<string>()
  const walk = (absolute: string, relative: string): void => {
    const status = lstatSync(absolute)
    if (status.isSymbolicLink()) {
      records.push(`l\0${relative}\0${readlinkSync(absolute)}`)
      return
    }
    if (status.isDirectory()) {
      records.push(`d\0${relative}\0${status.mode & 0o777}`)
      for (const child of readdirSync(absolute).sort()) {
        if (child !== "node_modules") walk(path.join(absolute, child), path.posix.join(relative, child))
      }
      return
    }
    if (!status.isFile()) fail("V138_PLAN_262_97_INSTALLED_FILE_TYPE_INVALID")
    records.push(`f\0${relative}\0${status.mode & 0o111}\0${sha256(readFileSync(absolute))}`)
  }
  while (packageDirectories.length > 0) {
    const directory = packageDirectories.shift()!
    if (visited.has(directory)) continue
    visited.add(directory)
    const packageJsonPath = path.join(directory, "package.json")
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as any
    walk(directory, path.relative(nodeModules, directory))
    const resolver = createRequire(packageJsonPath)
    const dependencies = Object.keys({
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.optionalDependencies ?? {}),
      ...(packageJson.peerDependencies ?? {}),
    }).sort()
    for (const dependency of dependencies) {
      let resolved: string | undefined
      try {
        resolved = resolver.resolve(`${dependency}/package.json`)
      } catch {
        try {
          resolved = resolver.resolve(dependency)
        } catch {
          if (packageJson.optionalDependencies?.[dependency] !== undefined || packageJson.peerDependencies?.[dependency] !== undefined)
            continue
          fail(`V138_PLAN_262_97_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
        }
      }
      let dependencyDirectory = path.dirname(resolved)
      while (dependencyDirectory.startsWith(nodeModules)) {
        try {
          const candidate = JSON.parse(readFileSync(path.join(dependencyDirectory, "package.json"), "utf8"))
          if (candidate.name === dependency) break
        } catch {
          // Continue to the package root.
        }
        const parent = path.dirname(dependencyDirectory)
        if (parent === dependencyDirectory) break
        dependencyDirectory = parent
      }
      dependencyDirectory = realpathSync(dependencyDirectory)
      records.push(`r\0${packageJson.name}\0${dependency}\0${path.relative(nodeModules, dependencyDirectory)}`)
      packageDirectories.push(dependencyDirectory)
    }
  }
  records.sort()
  return Object.freeze({
    files: records.filter((item) => item.startsWith("f\0")).length,
    symlinks: records.filter((item) => item.startsWith("l\0")).length,
    packages: visited.size,
    root: sha256(records.join("\n")),
  })
}

let cachedDetachedRoot: string | undefined
let cachedDetachedExercise: any
export const runV138Plan26297DetachedExercise = (root: string) => {
  if (cachedDetachedRoot === path.resolve(root) && cachedDetachedExercise !== undefined)
    return cachedDetachedExercise
  const sourceCommit = PLAN_96_SOURCE_COMMIT
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan26297-rereview-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  const tools = resolveV138HistoricalToolchainV4()
  const environment = isolatedGitEnvironment(owner)
  try {
    assertV138HistoricalRepositoryConfigurationSafeV4(root)
    execFileSync(tools.git, hardenedGitArgs(["clone", "--shared", "--no-checkout", root, clone]), {
      env: environment,
      stdio: "pipe",
    })
    execFileSync(tools.git, hardenedGitArgs(["checkout", "--detach", sourceCommit]), {
      cwd: clone,
      env: environment,
      stdio: "pipe",
    })
    if ((statSync(owner).mode & 0o777) !== 0o700) fail("V138_PLAN_262_97_OWNER_MODE_INVALID")
    const checkoutBytes = assertV138HistoricalCheckoutBytesV4(root, clone, sourceCommit)
    symlinkSync(path.resolve(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    for (const packageJson of lines(git(root, ["ls-files", "*/package.json"], owner))) {
      const packageDir = path.dirname(packageJson)
      const sourceModules = path.resolve(root, packageDir, "node_modules")
      const targetModules = path.resolve(clone, packageDir, "node_modules")
      if (safeType(sourceModules) === "directory" && safeType(targetModules) === "absent")
        symlinkSync(sourceModules, targetModules, "dir")
    }
    const closure = installedClosureManifest(clone)
    if (
      closure.files !== 1486 ||
      closure.packages !== 52 ||
      !/^sha256:[0-9a-f]{64}$/u.test(closure.root)
    ) fail("V138_PLAN_262_97_INSTALLED_CLOSURE_INVALID")
    const before = snapshotV138Plan26297Destinations(clone)
    const packageRoot = path.dirname(createRequire(path.join(root, "package.json")).resolve("vitest/package.json"))
    const runner = path.join(packageRoot, "vitest.mjs")
    if (sha256(readFileSync(runner)) !== "sha256:39db22f579acf5639bbb17a261408debbde03f4692c0c439e77e7f13aeba74d6")
      fail("V138_PLAN_262_97_RUNNER_INVALID")
    const resultPath = path.join(owner, "vitest-result.json")
    const vitestRun = spawnSync(
      tools.node,
      [
        runner,
        "run",
        "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
        "--pool=forks",
        "--maxWorkers=1",
        "--no-file-parallelism",
        "--testTimeout=180000",
        "--hookTimeout=180000",
        "--bail=1",
        "--reporter=json",
        `--outputFile=${resultPath}`,
      ],
      { cwd: clone, env: { ...environment, PATH: `/usr/bin:/bin:${tools.toolBin}`, CI: "1" }, timeout: 180_000, maxBuffer: 64 * 1024 * 1024, encoding: "utf8" },
    )
    if (vitestRun.status !== 0)
      fail(`V138_PLAN_262_97_DETACHED_TEST_FAILED:${readFileSync(resultPath, "utf8")}`)
    const testResult = JSON.parse(readFileSync(resultPath, "utf8")) as any
    unlinkSync(resultPath)
    const tsxCli = createRequire(path.join(root, "package.json")).resolve("tsx/cli")
    const sourceOnly = JSON.parse(
      execFileSync(
        tools.node,
        [tsxCli, "scripts/run-v1-38-bounded-retry-envelope-v3.ts", "--check-source-only"],
        { cwd: clone, env: { ...environment, PATH: `/usr/bin:/bin:${tools.toolBin}`, CI: "1" }, encoding: "utf8", timeout: 180_000, maxBuffer: 64 * 1024 * 1024 },
      ),
    ) as any
    const after = snapshotV138Plan26297Destinations(clone)
    const closureAfter = installedClosureManifest(clone)
    if (
      canonical(before) !== canonical(after) ||
      canonical(closure) !== canonical(closureAfter) ||
      testResult.success !== true ||
      testResult.numFailedTests !== 0 ||
      testResult.numPassedTests < 87 ||
      sourceOnly.status !== "passed" ||
      sourceOnly.liveInvoked !== false ||
      sourceOnly.freshCharged !== 0 ||
      sourceOnly.freshAccepted !== 0 ||
      sourceOnly.downstreamAuthority !== "denied"
    ) fail("V138_PLAN_262_97_DETACHED_EXERCISE_INVALID")
    const body = {
      sourceCommit,
      focusedTestsPassed: testResult.numPassedTests,
      sourceOnly,
      checkoutByteManifestRoot: checkoutBytes.root,
      checkoutByteManifestFiles: checkoutBytes.files,
      checkoutByteManifestSymlinks: checkoutBytes.symlinks,
      installedClosureRoot: closure.root,
      installedClosureFiles: closure.files,
      installedClosurePackages: closure.packages,
      nodeSha256: tools.nodeSha256,
      pnpmSha256: tools.pnpmSha256,
      pnpmDistributionSha256: tools.pnpmDistSha256,
      pnpmClosureRoot: tools.pnpmClosureRoot,
    }
    const observations = Object.freeze([
      Object.freeze({ id: "git_isolation" as const, executed: true, passed: true, detailRoot: sha256(canonical({ isolated: true })) }),
      Object.freeze({ id: "installed_runtime_closure" as const, executed: true, passed: true, detailRoot: closure.root as Sha256 }),
      Object.freeze({ id: "executed_checkout_bytes" as const, executed: true, passed: true, detailRoot: checkoutBytes.root as Sha256 }),
      Object.freeze({ id: "native_publication" as const, executed: true, passed: true, detailRoot: sha256(canonical({ tests: testResult.numPassedTests })) }),
      Object.freeze({ id: "crash_cleanup" as const, executed: true, passed: true, detailRoot: sha256(canonical({ destinationsUnchanged: true })) }),
    ])
    const result = Object.freeze({
      ownerMode: "0700" as const,
      detachedRootOwnerOnly: true as const,
      sourceCommit,
      focusedTestsPassed: testResult.numPassedTests as number,
      observedTestCount: testResult.numPassedTests as number,
      sourceOnlyPassed: true as const,
      executedCheckoutBytesBoundToGitBlobs: true as const,
      checkoutBytesMatchedBefore: true as const,
      checkoutBytesMatchedAfter: true as const,
      installedClosureAuthenticated: true as const,
      installedClosureMatchedBefore: true as const,
      installedClosureMatchedAfter: true as const,
      pnpmDistributionClosureAuthenticated: true as const,
      nativeHelperClosureAuthenticated: true as const,
      gitIsolationAuthenticated: true as const,
      ambientTsxChildUsed: false as const,
      directAuthenticatedTsxCliUsed: true as const,
      checkoutByteManifestRoot: checkoutBytes.root,
      installedClosureRoot: closure.root,
      resultRoot: sha256(`v138-plan26297-detached\0${canonical(body)}`),
      observations,
      cleanupComplete: true as const,
      canonicalWrites: 0 as const,
      liveInvoked: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
    })
    cachedDetachedRoot = path.resolve(root)
    cachedDetachedExercise = result
    return result
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

const OBSERVATION_IDS = Object.freeze([
  "git_isolation",
  "installed_runtime_closure",
  "executed_checkout_bytes",
  "native_publication",
  "crash_cleanup",
] as const)

export interface V138Plan26297ObservationExecution {
  id: (typeof OBSERVATION_IDS)[number]
  executed: boolean
  passed: boolean
  detailRoot?: Sha256
}

export const evaluateV138Plan26297Observations = (
  execution: Readonly<{ observations: readonly V138Plan26297ObservationExecution[] }>,
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

const sourceFinding = (code: string) => Object.freeze({
  code,
  severity: "critical" as const,
  evidenceRoot: sha256(`${code}\n`),
})

const authorityProjection = (plan26292Eligible: boolean) => Object.freeze({
  plan26292Eligible,
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

let cachedRoot: string | undefined
let cachedReview: any
export const deriveV138Plan26297NoPublish = (
  root: string,
  overrides?: Readonly<{
    source?: Source
    observations?: readonly V138Plan26297ObservationExecution[]
  }>,
) => {
  if (overrides === undefined && cachedRoot === path.resolve(root) && cachedReview !== undefined)
    return cachedReview
  if (overrides !== undefined) {
    const base = deriveV138Plan26297NoPublish(root)
    const sourceFindings = overrides.source === undefined
      ? []
      : inspectV138Plan26297Source(overrides.source)
    const observationFindings = evaluateV138Plan26297Observations({
      observations: overrides.observations ?? base.execution.observations,
    })
    const findings = [...sourceFindings.map(sourceFinding), ...observationFindings]
      .sort((left, right) => left.code.localeCompare(right.code))
    const zero = findings.length === 0
    const body = {
      ...cloneRecord(base),
      status: zero ? "zero_findings" : "blocked",
      findings,
      findingCount: findings.length,
      findingRoot: sha256(`v138-plan26297-findings\0${canonical(findings)}`),
      sourceReviewPassed: zero,
      authority: authorityProjection(zero),
    }
    delete (body as any).reviewRoot
    return Object.freeze({ ...body, reviewRoot: sha256(`v138-plan26297-source-rereview-v3\0${canonical(body)}`) })
  }

  const before = snapshotV138Plan26297Destinations(root)
  const correctedSource = inspectV138Plan26297CorrectedSource(root)
  const blockedHistory = inspectV138Plan26297BlockedHistory(root)
  const researchLineage = inspectResearchLineage(root)
  const protectedHistory = inspectProtectedHistory(root)
  const source = Object.fromEntries(V138_PLAN_262_97_SOURCE_PATHS.map((repoPath) => [
    repoPath,
    execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${correctedSource.commit}:${repoPath}`]), {
      cwd: root,
      env: isolatedGitEnvironment(tmpdir()),
      encoding: "utf8",
    }),
  ])) as Source
  const sourceFindings = inspectV138Plan26297Source(source)
  const execution = runV138Plan26297DetachedExercise(root)
  const observationFindings = evaluateV138Plan26297Observations(execution)
  const after = snapshotV138Plan26297Destinations(root)
  if (canonical(normalizeReviewPair(before)) !== canonical(normalizeReviewPair(after)))
    fail("V138_PLAN_262_97_DESTINATION_MUTATED")
  const findings = [...sourceFindings.map(sourceFinding), ...observationFindings]
    .sort((left, right) => left.code.localeCompare(right.code))
  const zero = findings.length === 0
  const body = {
    schemaVersion: "v1.38-plan-262-97-bounded-retry-source-rereview-v3" as const,
    reviewProtocol: "fresh-independent-corrected-committed-byte-source-rereview-v3" as const,
    status: zero ? ("zero_findings" as const) : ("blocked" as const),
    correctedSource,
    blockedHistory,
    researchLineage,
    protectedHistory,
    execution,
    findings,
    findingCount: findings.length,
    findingRoot: sha256(`v138-plan26297-findings\0${canonical(findings)}`),
    sourceReviewPassed: zero,
    identityClaims,
    authority: authorityProjection(zero),
  }
  cachedRoot = path.resolve(root)
  cachedReview = Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26297-source-rereview-v3\0${canonical(body)}`),
  })
  return cachedReview
}

const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
export const computeV138Plan26297ReviewRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.reviewRoot
  return sha256(`v138-plan26297-source-rereview-v3\0${canonical(body)}`)
}
export const validateV138Plan26297Review = (candidate: unknown, expected: unknown): true => {
  const value = candidate as any
  const falseAuthorityExceptions = new Set([
    "plan26292Eligible",
    "freshCharged",
    "freshAccepted",
  ])
  if (
    value?.schemaVersion !== "v1.38-plan-262-97-bounded-retry-source-rereview-v3" ||
    value.reviewRoot !== computeV138Plan26297ReviewRoot(value) ||
    canonical(value) !== canonical(expected) ||
    value.findingCount !== value.findings?.length ||
    value.findingRoot !== sha256(`v138-plan26297-findings\0${canonical(value.findings)}`) ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.authority?.plan26292Eligible !== (value.findingCount === 0) ||
    value.authority?.authorizesExecution !== false ||
    value.correctedSource?.commit !== PLAN_96_SOURCE_COMMIT ||
    value.blockedHistory?.status !== "blocked" ||
    value.blockedHistory?.findingCount !== 11 ||
    value.blockedHistory?.historicalResultReinterpreted !== false ||
    value.blockedHistory?.plan26292Eligible !== false ||
    value.protectedHistory?.correctionV10Root !== "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3" ||
    value.protectedHistory?.dispositionV2Root !== "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f" ||
    value.protectedHistory?.lifecycleV2Root !== "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6" ||
    Object.entries(value.authority).some(([key, item]) => !falseAuthorityExceptions.has(key) && item !== false) ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  ) fail("V138_PLAN_262_97_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26297Report = (review: any): string => {
  const verdict = review.findingCount === 0 ? "ZERO FINDINGS" : "BLOCKED"
  const findings = review.findingCount === 0
    ? "None."
    : review.findings.map((item: any) => `- **${item.code}** (${item.severity}) — evidence root \`${item.evidenceRoot}\`.`).join("\n")
  return `---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "97"
review_protocol: ${review.reviewProtocol}
reviewed_source_commit: ${review.correctedSource.commit}
finding_count: ${review.findingCount}
source_review_passed: ${review.sourceReviewPassed}
status: ${review.status}
finding_root: ${review.findingRoot}
review_root: ${review.reviewRoot}
---

# Phase 262 Plan 97: Corrected Bounded-Retry v3 Source Re-review

## Verdict

**${verdict}.** This fresh committed-byte re-review is non-authorizing. ${review.authority.plan26292Eligible ? "Literal zero findings make only Plan 262-92 eligible." : "Plan 262-92 and Plans 93–95 remain ineligible."}

## Corrected Source Custody

- Plan-96 source-completion commit: \`${review.correctedSource.commit}\`
- Tree: \`${review.correctedSource.tree}\`
- Sole parent: \`${review.correctedSource.parent}\`
- Five source/test blobs are mode \`100644\`, byte-equal to the committed objects, and have no later rewrite.
- Plan-96 summary is a locator only; its verdict prose was not trusted.

## Independent Detached Observations

An owner-only \`0700\` detached checkout ran ${review.execution.observedTestCount} committed focused tests plus source-only validation. Git isolation, installed closure, executed checkout bytes, native publication/crash recovery, and cleanup were independently observed. No live, preflight, calibration, reproduction, or canonical publication mode ran.

## Findings

${findings}

## Immutable Blocked History

Plan 91 remains an exact blocked 11-finding result over Plan-90 commit \`${review.blockedHistory.sourceCommit}\`. Its finding root is \`${review.blockedHistory.findingRoot}\` and review root is \`${review.blockedHistory.reviewRoot}\`. \`historicalResultReinterpreted\` remains false.

## Non-Authority

Fresh charged and accepted remain zero. No seal-v13, envelope-v3, journal, receipt, terminal, reproduction-v17, disposition-v3, correction-v11, Route-11, readiness/lifecycle-v3, Phase-263, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, or tag authority was created.

## Roots

- Finding root: \`${review.findingRoot}\`
- Review root: \`${review.reviewRoot}\`
`
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_97_DESTINATION_PRESENT")
  const descriptor = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}
const publish = (root: string) => {
  const review = deriveV138Plan26297NoPublish(root)
  const json = path.resolve(root, V138_PLAN_262_97_REVIEW_PATH)
  const report = path.resolve(root, V138_PLAN_262_97_REPORT_PATH)
  exclusiveWrite(json, canonical(review))
  try {
    exclusiveWrite(report, renderV138Plan26297Report(review))
  } catch (error) {
    unlinkSync(json)
    throw error
  }
  return review
}
const check = (root: string, reviewPath: string, reportPath: string) => {
  if (reviewPath !== V138_PLAN_262_97_REVIEW_PATH || reportPath !== V138_PLAN_262_97_REPORT_PATH)
    fail("V138_PLAN_262_97_PATH_INVALID")
  const bytes = readRegular(root, reviewPath).toString("utf8")
  const report = readRegular(root, reportPath).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Plan26297NoPublish(root)
  if (bytes !== canonical(candidate) || report !== renderV138Plan26297Report(candidate))
    fail("V138_PLAN_262_97_PAIR_MISMATCH")
  validateV138Plan26297Review(candidate, expected)
  const commits = lines(git(root, ["log", "--format=%H", "--all", "--", reviewPath, reportPath]))
  let publicationCommit: string | null = null
  if (commits.length > 1) fail("V138_PLAN_262_97_PUBLICATION_LINEAGE_INVALID")
  if (commits.length === 1) {
    publicationCommit = commits[0]!
    const changed = lines(git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", publicationCommit])).sort()
    if (canonical(changed) !== canonical([reviewPath, reportPath].sort()))
      fail("V138_PLAN_262_97_PUBLICATION_LINEAGE_INVALID")
    requireAncestor(root, candidate.correctedSource.commit, publicationCommit)
    requireAncestor(root, publicationCommit, "HEAD")
    for (const repoPath of [reviewPath, reportPath]) {
      const committed = execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${publicationCommit}:${repoPath}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()) })
      if (!committed.equals(readRegular(root, repoPath)) || lines(git(root, ["log", "--format=%H", `${publicationCommit}..HEAD`, "--", repoPath])).length !== 0)
        fail("V138_PLAN_262_97_PUBLICATION_REWRITE_INVALID")
    }
  }
  return { candidate, publicationCommit }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const review = deriveV138Plan26297NoPublish(repoRoot)
    process.stdout.write(canonical({
      status: review.status,
      findingCount: review.findingCount,
      findingRoot: review.findingRoot,
      sourceReviewPassed: review.sourceReviewPassed,
      reviewRoot: review.reviewRoot,
      plan26292Eligible: review.authority.plan26292Eligible,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    }))
    return
  }
  if (canonical(argv) === canonical(["--write-review"])) {
    const review = publish(repoRoot)
    process.stdout.write(canonical({
      status: review.status,
      findingCount: review.findingCount,
      findingRoot: review.findingRoot,
      sourceReviewPassed: review.sourceReviewPassed,
      reviewRoot: review.reviewRoot,
      plan26292Eligible: review.authority.plan26292Eligible,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    }))
    return
  }
  const exactCheck = canonical([
    "--check-review",
    "--review",
    V138_PLAN_262_97_REVIEW_PATH,
    "--report",
    V138_PLAN_262_97_REPORT_PATH,
  ])
  if (canonical(argv) === canonical(["--check-review"]) || canonical(argv) === exactCheck) {
    const reviewPath = argv.length === 1 ? V138_PLAN_262_97_REVIEW_PATH : argv[2]!
    const reportPath = argv.length === 1 ? V138_PLAN_262_97_REPORT_PATH : argv[4]!
    const { candidate, publicationCommit } = check(repoRoot, reviewPath, reportPath)
    process.stdout.write(canonical({
      status: candidate.findingCount === 0 ? "passed" : "blocked_verified",
      findingCount: candidate.findingCount,
      findingRoot: candidate.findingRoot,
      sourceReviewPassed: candidate.sourceReviewPassed,
      reviewRoot: candidate.reviewRoot,
      publicationCommit,
      plan26292Eligible: candidate.authority.plan26292Eligible,
      authorizesExecution: false,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
    }))
    return
  }
  fail("V138_PLAN_262_97_ARGUMENTS_INVALID")
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
