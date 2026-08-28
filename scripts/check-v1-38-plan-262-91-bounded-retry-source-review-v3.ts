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
type Source = Readonly<{
  model: string
  controller: string
  tests: string
  summary: string
}>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_91_CHECKER_PATH =
  "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts"
export const V138_PLAN_262_91_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json"
export const V138_PLAN_262_91_REPORT_PATH = `${PHASE_DIR}/262-91-REVIEW.md`
export const V138_PLAN_262_91_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  `${PHASE_DIR}/262-90-SUMMARY.md`,
] as const)

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

export const V138_PLAN_262_91_MUTATIONS = Object.freeze([
  ["MAX_ROUTE_STARTS_CHANGED", "model", "maximumRouteStarts: 3 as const", "maximumRouteStarts: 4 as const"],
  ["MAX_PREFLIGHTS_CHANGED", "model", "maximumPreflightObservations: 12 as const", "maximumPreflightObservations: 13 as const"],
  ["FOUR_HOUR_WINDOW_CHANGED", "model", "envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000", "envelopeLifetimeMilliseconds: 5 * 60 * 60 * 1_000"],
  ["REFUSAL_SPACING_CHANGED", "model", "refusalSpacingMilliseconds: 5 * 60 * 1_000", "refusalSpacingMilliseconds: 4 * 60 * 1_000"],
  ["CALIBRATION_BACKOFF_CHANGED", "model", "calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000", "calibrationFailureBackoffMilliseconds: 10 * 60 * 1_000"],
  ["CALIBRATION_ATTEMPTS_CHANGED", "model", "calibrationAttemptsPerRoute: 8 as const", "calibrationAttemptsPerRoute: 9 as const"],
  ["CALIBRATION_SHARDS_CHANGED", "model", "calibrationShardCount: 4 as const", "calibrationShardCount: 5 as const"],
  ["SAMPLING_CHANGED", "model", "samplingMilliseconds: 200 as const", "samplingMilliseconds: 201 as const"],
  ["THRESHOLD_CHANGED", "model", "minimumEffectiveAvailableBasisPoints: 2_500 as const", "minimumEffectiveAvailableBasisPoints: 2_499 as const"],
  ["REPRODUCTION_SIZE_CHANGED", "model", "reproductionCellCount: 540 as const", "reproductionCellCount: 539 as const"],
  ["REPRODUCTION_RETRY_CHANGED", "model", "maximumReproductionRuns: 1 as const", "maximumReproductionRuns: 2 as const"],
  ["ASSURANCE_CLASS_CHANGED", "model", 'assuranceClass: "single_operator_local_seal_v1" as const', 'assuranceClass: "independent_custody" as const'],
  ["PARTIAL_REUSE_ENABLED", "model", "partialAcceptedEvidenceReusable: false as const", "partialAcceptedEvidenceReusable: true as const"],
  ["KERNEL_AUTHORITY_CHANGED", "model", 'rulesAuthority: "MATCH_KERNEL" as const', 'rulesAuthority: "COPIED_KERNEL" as const'],
  ["SUPERVISED_RUNTIME_DISABLED", "model", "supervisedRuntimeOnly: true as const", "supervisedRuntimeOnly: false as const"],
  ["BASELINE_CHANGED", "model", 'preResearchBaselineCommit: "dd7536c780a4d53199a949ef0cbd95d43414a4a0" as const', 'preResearchBaselineCommit: "0000000000000000000000000000000000000000" as const'],
  ["RESEARCH_COMMIT_CHANGED", "model", 'researchCommit: "ae29b3220351b7e6b31adfa6d8462d0c8eb15f15" as const', 'researchCommit: "0000000000000000000000000000000000000000" as const'],
  ["CORRECTION_ROOT_CHANGED", "model", '"sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3" as V138RetrySha256', '"sha256:0000000000000000000000000000000000000000000000000000000000000000" as V138RetrySha256'],
  ["DISPOSITION_ROOT_CHANGED", "model", '"sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f" as V138RetrySha256', '"sha256:0000000000000000000000000000000000000000000000000000000000000000" as V138RetrySha256'],
  ["LIFECYCLE_ROOT_CHANGED", "model", '"sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6" as V138RetrySha256', '"sha256:0000000000000000000000000000000000000000000000000000000000000000" as V138RetrySha256'],
  ["ROUTE_NAMESPACE_REUSED", "model", "`route:v3:${ordinal}`", "`route:v2:${ordinal}`"],
  ["PREFLIGHT_NAMESPACE_REUSED", "model", "`preflight:v3:${ordinal}`", "`preflight:v2:${ordinal}`"],
  ["CALIBRATION_NAMESPACE_REUSED", "model", "`calibration:v3:${routeOrdinal}:${attemptOrdinal}`", "`calibration:v2:${routeOrdinal}:${attemptOrdinal}`"],
  ["REPRODUCTION_NAMESPACE_REUSED", "model", "`reproduction:v3:${ordinal}`", "`reproduction:v2:${ordinal}`"],
  ["JOURNAL_CHAIN_WEAKENED", "model", "record.previousRoot !== previousRoot", "false"],
  ["DEADLINE_INCLUSIVE_WEAKENED", "model", "atMilliseconds >=\n      state.firstObservationMilliseconds +", "atMilliseconds >\n      state.firstObservationMilliseconds +"],
  ["REFUSAL_BOUNDARY_WEAKENED", "controller", "if (basisPoints < 2_500) continue", "if (basisPoints <= 2_500) continue"],
  ["CALIBRATION_RESERVATION_ORDER_REMOVED", "controller", 'kind: "reserve_calibration",\n      routeIdentity,\n      owner: input.owner,\n      identities: calibrationIdentities,', 'kind: "finish_calibration",\n      routeIdentity,\n      owner: input.owner,\n      identities: calibrationIdentities,'],
  ["CRASH_RECONCILIATION_REMOVED", "controller", "A prior invocation may have died only after its durable reservation.", "Crash reconciliation omitted."],
  ["CLEANUP_UNCERTAINTY_WEAKENED", "controller", "completeCleanup: false,", "completeCleanup: true,"],
  ["NOFOLLOW_APPEND_REMOVED", "controller", "constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0)", "constants.O_WRONLY | constants.O_APPEND"],
  ["ROOT_LOCK_REMOVED", "controller", '["-t", "0", lock, "/bin/sh", "-c", \'printf "acquired\\\\n"; cat >/dev/null\']', '["-t", "0", lock, "/bin/true"]'],
  ["PRIVATE_MODE_CHANGED", "controller", "mkdirSync(privateTarget, { mode: 0o700 })", "mkdirSync(privateTarget, { mode: 0o755 })"],
  ["PRIVATE_RECEIPT_MODE_CHANGED", "controller", "mode = 0o600", "mode = 0o644"],
  ["STRATEGY_SOURCE_LEAK_ENABLED", "controller", "strategySourceIncluded: false as const", "strategySourceIncluded: true as const"],
  ["STRATEGY_MEMORY_LEAK_ENABLED", "controller", "strategyMemoryIncluded: false as const", "strategyMemoryIncluded: true as const"],
  ["SOLDIER_MEMORY_LEAK_ENABLED", "controller", "soldierMemoryIncluded: false as const", "soldierMemoryIncluded: true as const"],
  ["OBJECTIVE_LEAK_ENABLED", "controller", "objectivePayloadIncluded: false as const", "objectivePayloadIncluded: true as const"],
  ["DIAGNOSTIC_LEAK_ENABLED", "controller", "rawDiagnosticsIncluded: false as const", "rawDiagnosticsIncluded: true as const"],
  ["LIVE_MODE_RELABELED_SOURCE_ONLY", "controller", 'command === "--run-bounded-live-envelope"', 'command === "--check-source-only"'],
  ["SOURCE_ONLY_LIVE_CALL_INSERTED", "controller", "checkV138ProtectedHistoryV3(V138_BOUNDED_RETRY_V3_PROTECTED_HISTORY)", "await runLive()"],
  ["AUTHORITY_FIELD_ENABLED", "model", "phase263PlanningAuthorized: false as const", "phase263PlanningAuthorized: true as const"],
  ["CANDIDATE_AUTHORITY_ENABLED", "model", "candidateSearchAuthorized: false as const", "candidateSearchAuthorized: true as const"],
  ["FORMATION_AUTHORITY_ENABLED", "model", "formationMaterializationAuthorized: false as const", "formationMaterializationAuthorized: true as const"],
  ["HOLDOUT_AUTHORITY_ENABLED", "model", "holdoutOpeningAuthorized: false as const", "holdoutOpeningAuthorized: true as const"],
  ["PUBLIC_AUTHORITY_ENABLED", "model", "publicAuthorized: false as const", "publicAuthorized: true as const"],
  ["PRODUCT_AUTHORITY_ENABLED", "model", "productAuthorized: false as const", "productAuthorized: true as const"],
  ["PRODUCTION_AUTHORITY_ENABLED", "model", "productionAuthorized: false as const", "productionAuthorized: true as const"],
  ["GAMEPLAY_AUTHORITY_ENABLED", "model", "gameplayChangeAuthorized: false as const", "gameplayChangeAuthorized: true as const"],
  ["SUMMARY_LIVE_OVERCLAIM", "summary", "Proved 40 focused synthetic cases without running headroom observation", "Ran live headroom observation"],
] as const satisfies readonly (readonly [string, keyof Source, string, string])[])

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
    fail("V138_PLAN_262_91_ANCESTRY_INVALID")
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
  if (safeType(target) !== "regular") fail("V138_PLAN_262_91_INPUT_UNSAFE")
  const descriptor = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(descriptor)
  } finally {
    closeSync(descriptor)
  }
}

export const inspectV138Plan26291Source = (source: Source): string[] => {
  const findings = V138_PLAN_262_91_MUTATIONS.filter(
    ([, file, token]) => source[file].split(token).length - 1 !== 1,
  ).map(([code]) => code)
  if (/Math\.random|Date\.now|node:vm|new Function/u.test(source.model + source.controller))
    findings.push("FORBIDDEN_NONDETERMINISM_PRESENT")
  if (source.controller.includes('execFileSync("git"'))
    findings.push("AMBIENT_GIT_EXECUTION")
  if (
    source.controller.includes("installedRuntimeClosureAuthenticated: true") &&
    !source.controller.includes("installedClosureManifest(")
  ) findings.push("CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED")
  if (
    source.controller.includes("executedCheckoutBytesBoundToGitBlobs: true") &&
    !source.controller.includes("hash-object") &&
    !source.controller.includes("checkoutByteManifest(")
  ) findings.push("EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED")
  if (
    source.controller.includes("nativePublication: true") &&
    !source.controller.includes("v1-38-successor-transaction-helper-v6")
  ) findings.push("NATIVE_PUBLICATION_NOT_ENFORCED")
  if (source.controller.includes('spawn(\n    "/usr/bin/lockf"'))
    findings.push("PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED")
  const adversarialTokens = [
    "symlinkSync",
    "mkfifo",
    "replacement object",
    "core.hooksPath",
    "installed closure",
    "checkout bytes",
    "parent replacement",
    "generation race",
    "reproduction_write",
    "terminal_fsync",
  ]
  if (adversarialTokens.some((token) => !source.tests.includes(token)))
    findings.push("ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE")
  return [...new Set(findings)].sort()
}

const inspectCustody = (root: string) => {
  const summaryPath = V138_PLAN_262_91_SOURCE_PATHS[3]
  const commits = lines(
    git(root, [
      "log",
      "--format=%H",
      `${LINEAGE.researchCommit}..HEAD`,
      "--",
      summaryPath,
    ]),
  )
  if (commits.length !== 1) fail("V138_PLAN_262_91_SOURCE_COMPLETION_INVALID")
  const commit = commits[0]!
  const [resolvedCommit, tree, parents] = git(root, [
    "show",
    "-s",
    "--format=%H%n%T%n%P",
    commit,
  ]).split("\n")
  if (resolvedCommit !== commit || !/^[0-9a-f]{40}$/u.test(tree!) || !/^[0-9a-f]{40}$/u.test(parents!))
    fail("V138_PLAN_262_91_SOURCE_IDENTITY_INVALID")
  requireAncestor(root, LINEAGE.researchCommit, commit)
  requireAncestor(root, commit, "HEAD")
  const sourceChain = lines(
    git(root, ["rev-list", "--first-parent", "--reverse", `${LINEAGE.researchCommit}..${commit}`]),
  )
  if (sourceChain.length !== 6 || sourceChain.at(-1) !== commit)
    fail("V138_PLAN_262_91_SOURCE_CHAIN_INVALID")
  const blobs = V138_PLAN_262_91_SOURCE_PATHS.map((repoPath) => {
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
    ) fail("V138_PLAN_262_91_SOURCE_CUSTODY_INVALID")
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
    summaryPath,
    summaryTrustedAsVerdict: false,
    sourceChain,
    blobs,
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
  ) fail("V138_PLAN_262_91_RESEARCH_LINEAGE_INVALID")
  return Object.freeze({ ...LINEAGE, researchSoleParent: researchParent })
}

const inspectProtectedHistory = (root: string) => {
  const requiredPaths = [
    ...V138_PLAN_262_91_SOURCE_PATHS,
    ...PROTECTED_FILES.map(([repoPath]) => repoPath),
  ]
  const batch = readV138WorkspaceBatch(root, requiredPaths, DOWNSTREAM_DESTINATIONS)
  for (const [repoPath, expectedSha256] of PROTECTED_FILES)
    if (sha256V138Secure(batch.bytes[repoPath]!) !== expectedSha256)
      fail("V138_PLAN_262_91_PROTECTED_HISTORY_INVALID")
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
  ) fail("V138_PLAN_262_91_PROTECTED_HISTORY_INVALID")
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

export const snapshotV138Plan26291Destinations = (root: string) =>
  [V138_PLAN_262_91_REVIEW_PATH, V138_PLAN_262_91_REPORT_PATH, ...DOWNSTREAM_DESTINATIONS].map(
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
  snapshot: ReturnType<typeof snapshotV138Plan26291Destinations>,
) => snapshot.map((item) =>
  item.path === V138_PLAN_262_91_REVIEW_PATH || item.path === V138_PLAN_262_91_REPORT_PATH
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
    if (!status.isFile()) fail("V138_PLAN_262_91_INSTALLED_FILE_TYPE_INVALID")
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
          fail(`V138_PLAN_262_91_DEPENDENCY_RESOLUTION_FAILED:${dependency}`)
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

const detachedExercise = (root: string, sourceCommit: string) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan26291-review-"))
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
    if ((statSync(owner).mode & 0o777) !== 0o700) fail("V138_PLAN_262_91_OWNER_MODE_INVALID")
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
    ) fail("V138_PLAN_262_91_INSTALLED_CLOSURE_INVALID")
    const before = snapshotV138Plan26291Destinations(clone)
    const packageRoot = path.dirname(createRequire(path.join(root, "package.json")).resolve("vitest/package.json"))
    const runner = path.join(packageRoot, "vitest.mjs")
    if (sha256(readFileSync(runner)) !== "sha256:39db22f579acf5639bbb17a261408debbde03f4692c0c439e77e7f13aeba74d6")
      fail("V138_PLAN_262_91_RUNNER_INVALID")
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
      fail(`V138_PLAN_262_91_DETACHED_TEST_FAILED:${readFileSync(resultPath, "utf8")}`)
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
    const after = snapshotV138Plan26291Destinations(clone)
    const closureAfter = installedClosureManifest(clone)
    if (
      canonical(before) !== canonical(after) ||
      canonical(closure) !== canonical(closureAfter) ||
      testResult.success !== true ||
      testResult.numFailedTests !== 0 ||
      testResult.numPassedTests !== 40 ||
      sourceOnly.status !== "passed" ||
      sourceOnly.liveInvoked !== false ||
      sourceOnly.freshCharged !== 0 ||
      sourceOnly.freshAccepted !== 0 ||
      sourceOnly.downstreamAuthority !== "denied"
    ) fail("V138_PLAN_262_91_DETACHED_EXERCISE_INVALID")
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
    return Object.freeze({
      ownerMode: "0700" as const,
      sourceCommit,
      focusedTestsPassed: testResult.numPassedTests as number,
      sourceOnlyPassed: true as const,
      executedCheckoutBytesBoundToGitBlobs: true as const,
      installedClosureAuthenticated: true as const,
      pnpmDistributionClosureAuthenticated: true as const,
      nativeHelperClosureAuthenticated: true as const,
      gitIsolationAuthenticated: true as const,
      ambientTsxChildUsed: false as const,
      directAuthenticatedTsxCliUsed: true as const,
      checkoutByteManifestRoot: checkoutBytes.root,
      installedClosureRoot: closure.root,
      resultRoot: sha256(`v138-plan26291-detached\0${canonical(body)}`),
      canonicalWrites: 0 as const,
      liveInvoked: false as const,
      freshCharged: 0 as const,
      freshAccepted: 0 as const,
    })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

const OBSERVATION_IDS = Object.freeze([
  "git-custody",
  "research-lineage",
  "coherent-retained-root-batch",
  "protected-history",
  "frozen-bounds-identities",
  "detached-source-tests",
  "installed-runtime-closure",
  "executed-checkout-bytes",
  "git-isolation",
  "native-helper",
  "native-publication",
  "crash-cleanup",
  "privacy-authority-denial",
  "canonical-absence",
] as const)

export interface V138Plan26291ObservationExecution {
  readonly id: (typeof OBSERVATION_IDS)[number]
  readonly executed: boolean
  readonly passed: boolean
  readonly detail: unknown
}

export const evaluateV138Plan26291Observations = (
  executions: readonly V138Plan26291ObservationExecution[],
) => {
  const byId = new Map(executions.map((item) => [item.id, item]))
  const observations = OBSERVATION_IDS.map((id) => {
    const execution = byId.get(id)
    const executed = execution?.executed === true
    const passed = executed && execution?.passed === true
    return Object.freeze({
      id,
      executed,
      passed,
      detailRoot: sha256(`${id}\0${canonical(execution?.detail ?? null)}`),
    })
  })
  const findings = observations
    .filter(({ passed }) => !passed)
    .map(({ id, executed, detailRoot }) => Object.freeze({
      code: `OBSERVATION_${id.toUpperCase().replaceAll("-", "_")}_${executed ? "FAILED" : "INCOMPLETE"}`,
      severity: "critical" as const,
      summary: executed ? `The ${id} observation failed.` : `The ${id} observation was not executed.`,
      detailRoot,
    }))
    .sort((left, right) => left.code.localeCompare(right.code))
  return Object.freeze({ observations, findings })
}

const sourceFinding = (code: string) => Object.freeze({
  code,
  severity: "critical" as const,
  summary: ({
    AMBIENT_GIT_EXECUTION: "Plan 90 invokes Git through ambient PATH resolution without the correction-v10 isolated Git environment.",
    CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED: "Plan 90 declares installed-runtime closure authentication but does not authenticate the current execution closure before authority-sensitive modes.",
    EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED: "Plan 90 declares executed-byte binding but does not bind executed checkout bytes to Git blobs in its controller gate.",
    NATIVE_PUBLICATION_NOT_ENFORCED: "Plan 90 declares native publication but implements authority artifacts with path-based Node exclusive writes rather than the authenticated native transaction helper.",
    PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED: "Plan 90 launches /usr/bin/lockf by pathname without authenticating the launched executable closure.",
    ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE: "Plan 90 tests do not exercise the required filesystem, Git, installed-closure, executed-byte, native-helper, and all crash-publication mutations.",
  } as Record<string, string>)[code] ?? "A frozen source, identity, integrity, privacy, or authority control changed.",
  detailRoot: sha256(`${code}\n`),
})

let cachedRoot: string | undefined
let cachedReview: any
export const deriveV138Plan26291NoPublish = (root: string) => {
  if (cachedRoot === path.resolve(root) && cachedReview !== undefined) return cachedReview
  const before = snapshotV138Plan26291Destinations(root)
  const reviewedSource = inspectCustody(root)
  const researchLineage = inspectResearchLineage(root)
  const protectedHistory = inspectProtectedHistory(root)
  const source: Source = {
    model: execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${reviewedSource.commit}:${V138_PLAN_262_91_SOURCE_PATHS[0]}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()), encoding: "utf8" }),
    controller: execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${reviewedSource.commit}:${V138_PLAN_262_91_SOURCE_PATHS[1]}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()), encoding: "utf8" }),
    tests: execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${reviewedSource.commit}:${V138_PLAN_262_91_SOURCE_PATHS[2]}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()), encoding: "utf8" }),
    summary: execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${reviewedSource.commit}:${V138_PLAN_262_91_SOURCE_PATHS[3]}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()), encoding: "utf8" }),
  }
  const sourceFindings = inspectV138Plan26291Source(source)
  const detached = detachedExercise(root, reviewedSource.commit)
  const after = snapshotV138Plan26291Destinations(root)
  if (canonical(before) !== canonical(after)) fail("V138_PLAN_262_91_DESTINATION_MUTATED")
  const executed = (
    id: (typeof OBSERVATION_IDS)[number],
    passed: boolean,
    detail: unknown,
  ): V138Plan26291ObservationExecution => ({ id, executed: true, passed, detail })
  const evaluated = evaluateV138Plan26291Observations([
    executed("git-custody", reviewedSource.blobs.length === 4, reviewedSource),
    executed("research-lineage", researchLineage.researchSoleParent === LINEAGE.preResearchCommit, researchLineage),
    executed("coherent-retained-root-batch", protectedHistory.protocol === V138_SECURE_BATCH_PROTOCOL_V6, protectedHistory),
    executed("protected-history", protectedHistory.predecessorStatus === "integrity_non_pass", protectedHistory),
    executed("frozen-bounds-identities", sourceFindings.filter((code) => V138_PLAN_262_91_MUTATIONS.some(([mutation]) => mutation === code)).length === 0, { sourceFindings }),
    executed("detached-source-tests", detached.focusedTestsPassed === 40 && detached.sourceOnlyPassed, detached.resultRoot),
    executed("installed-runtime-closure", !sourceFindings.includes("CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED"), { independentReviewClosure: detached.installedClosureRoot, producerSourceFinding: sourceFindings.includes("CURRENT_INSTALLED_CLOSURE_NOT_AUTHENTICATED") }),
    executed("executed-checkout-bytes", !sourceFindings.includes("EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED"), { independentReviewManifest: detached.checkoutByteManifestRoot, producerSourceFinding: sourceFindings.includes("EXECUTED_CHECKOUT_BINDING_NOT_ENFORCED") }),
    executed("git-isolation", !sourceFindings.includes("AMBIENT_GIT_EXECUTION"), { independentReviewIsolated: detached.gitIsolationAuthenticated, producerSourceFinding: sourceFindings.includes("AMBIENT_GIT_EXECUTION") }),
    executed("native-helper", detached.nativeHelperClosureAuthenticated, protectedHistory.files.filter(({ path: repoPath }) => repoPath.includes("native/"))),
    executed("native-publication", !sourceFindings.includes("NATIVE_PUBLICATION_NOT_ENFORCED") && !sourceFindings.includes("PATHNAME_LOCK_LAUNCH_UNAUTHENTICATED"), { sourceFindings }),
    executed("crash-cleanup", !sourceFindings.includes("ADVERSARIAL_SOURCE_TEST_MATRIX_INCOMPLETE"), { sourceFindings }),
    executed("privacy-authority-denial", !detached.liveInvoked && detached.freshCharged === 0 && detached.freshAccepted === 0, detached.resultRoot),
    executed("canonical-absence", canonical(normalizeReviewPair(before)) === canonical(normalizeReviewPair(after)), { before: normalizeReviewPair(before), after: normalizeReviewPair(after) }),
  ])
  const findings = [
    ...sourceFindings.map(sourceFinding),
    ...evaluated.findings,
  ].sort((left, right) => left.code.localeCompare(right.code))
  const zero = findings.length === 0
  const body = {
    schemaVersion: "v1.38-plan-262-91-bounded-retry-source-review-v3" as const,
    reviewProtocol: "independent-committed-byte-correction-v10-source-review-v3" as const,
    status: zero ? ("zero_findings" as const) : ("blocked" as const),
    reviewedSource,
    researchLineage,
    protectedHistory,
    detachedExercise: detached,
    observations: evaluated.observations,
    findings,
    findingCount: findings.length,
    findingRoot: sha256(`v138-plan26291-findings\0${canonical(findings)}`),
    sourceReviewPassed: zero,
    identityClaims: Object.freeze({
      independentPersonClaimed: false,
      externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      separatePermissioningClaimed: false,
      maliciousOperatorResistanceClaimed: false,
      hostileSameUidResistanceClaimed: false,
      pathnameLaunchReplacementResistanceClaimed: false,
    }),
    authority: Object.freeze({
      plan26292Eligible: zero,
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
      admit03Status: "blocked" as const,
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
    }),
  }
  cachedRoot = path.resolve(root)
  cachedReview = Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26291-source-review-v3\0${canonical(body)}`),
  })
  return cachedReview
}

const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
export const computeV138Plan26291ReviewRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.reviewRoot
  return sha256(`v138-plan26291-source-review-v3\0${canonical(body)}`)
}
export const validateV138Plan26291Review = (candidate: unknown, expected: unknown): true => {
  const value = candidate as any
  const falseAuthorityExceptions = new Set([
    "plan26292Eligible",
    "admit03Status",
    "freshCharged",
    "freshAccepted",
  ])
  if (
    value?.schemaVersion !== "v1.38-plan-262-91-bounded-retry-source-review-v3" ||
    value.reviewRoot !== computeV138Plan26291ReviewRoot(value) ||
    canonical(value) !== canonical(expected) ||
    value.findingCount !== value.findings?.length ||
    value.findingRoot !== sha256(`v138-plan26291-findings\0${canonical(value.findings)}`) ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.authority?.plan26292Eligible !== (value.findingCount === 0) ||
    value.authority?.authorizesExecution !== false ||
    value.protectedHistory?.correctionV10Root !== "sha256:79f0ba7b9352992c5ad51a102bfd93f21bde93f5a01ff2438a25fef0919b22d3" ||
    value.protectedHistory?.dispositionV2Root !== "sha256:03ba0268fca01ea40e08d323565bbfcfffefa8bf7ddfe9c95b58fa423c32dd7f" ||
    value.protectedHistory?.lifecycleV2Root !== "sha256:e762aa430aadcd1986d04c79dc9d102641e9a177f099ee066bcb9464c09f94a6" ||
    Object.entries(value.authority).some(([key, item]) => !falseAuthorityExceptions.has(key) && item !== false) ||
    value.authority.admit03Status !== "blocked" ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  ) fail("V138_PLAN_262_91_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26291Report = (review: any): string => {
  const verdict = review.findingCount === 0 ? "PASS — exact zero findings" : "BLOCKED — source findings"
  const findings = review.findingCount === 0
    ? "None."
    : review.findings.map((item: any) => `- **${item.code}** (${item.severity}): ${item.summary} Evidence root: \`${item.detailRoot}\`.`).join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "91"\nreview_protocol: ${review.reviewProtocol}\nreviewed_source_commit: ${review.reviewedSource.commit}\nfinding_count: ${review.findingCount}\nsource_review_passed: ${review.sourceReviewPassed}\nstatus: ${review.status}\nfinding_root: ${review.findingRoot}\nreview_root: ${review.reviewRoot}\n---\n\n# Phase 262 Plan 91: Bounded-Retry v3 Source Review\n\n## Verdict\n\n**${verdict}.** This independent committed-byte review is non-authorizing. ${review.authority.plan26292Eligible ? "Exact zero findings make only Plan 262-92 eligible to publish a separate direct-child seal and inactive envelope." : "Plan 262-92 and every later v3 step remain ineligible."}\n\n## Exact Git Custody\n\n- Reviewed Plan-90 source-completion commit: \`${review.reviewedSource.commit}\`\n- Tree: \`${review.reviewedSource.tree}\`\n- Sole parent: \`${review.reviewedSource.parent}\`\n- Pre-research baseline: \`${review.researchLineage.preResearchCommit}\`\n- Research carrier: \`${review.researchLineage.researchCommit}\`\n- The three v3 source/test files and Plan-90 summary are mode \`100644\`, match their exact Git blobs, and have no later rewrite. Summary prose was evidence input only and was not trusted as a verdict.\n\n## Detached Execution Closure\n\nAn owner-only \`0700\` detached checkout ran ${review.detachedExercise.focusedTestsPassed} committed Plan-90 tests and source-only mode using authenticated Node, pnpm distribution, Vitest installed closure, isolated Git configuration, and a checkout-byte manifest bound to Git blobs. No ambient \`tsx\` PATH child, live mode, canonical write, headroom observation, calibration, or reproduction was used.\n\n## Findings\n\n${findings}\n\n## Protected History\n\nCorrection-v10 remains \`${review.protectedHistory.predecessorStatus}\` at \`${review.protectedHistory.correctionV10Root}\`; disposition-v2 remains \`${review.protectedHistory.dispositionV2Root}\`; lifecycle-v2 remains \`${review.protectedHistory.lifecycleV2Root}\`. Protected v1/v2 evidence and helper bytes remain unchanged, and predecessor fresh accepted remains 0/540.\n\n## Non-Authority\n\nNo seal-v13, retry-envelope:v3, journal, receipt, terminal, reproduction-v17, disposition-v3, correction-v11, Route-11 activation, readiness, lifecycle-v3, Phase-263 authority, candidate, formation, holdout, public, product, production, counted-play, gameplay-change, archive, or tag authority was created. Fresh charged and accepted counts remain zero.\n\n## Finding and Review Roots\n\n- Finding root: \`${review.findingRoot}\`\n- Review root: \`${review.reviewRoot}\`\n`
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_91_DESTINATION_PRESENT")
  const descriptor = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600)
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}
const publish = (root: string) => {
  const review = deriveV138Plan26291NoPublish(root)
  const json = path.resolve(root, V138_PLAN_262_91_REVIEW_PATH)
  const report = path.resolve(root, V138_PLAN_262_91_REPORT_PATH)
  exclusiveWrite(json, canonical(review))
  try {
    exclusiveWrite(report, renderV138Plan26291Report(review))
  } catch (error) {
    unlinkSync(json)
    throw error
  }
  return review
}
const check = (root: string, reviewPath: string, reportPath: string) => {
  if (reviewPath !== V138_PLAN_262_91_REVIEW_PATH || reportPath !== V138_PLAN_262_91_REPORT_PATH)
    fail("V138_PLAN_262_91_PATH_INVALID")
  const bytes = readRegular(root, reviewPath).toString("utf8")
  const report = readRegular(root, reportPath).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Plan26291NoPublish(root)
  if (bytes !== canonical(candidate) || report !== renderV138Plan26291Report(candidate))
    fail("V138_PLAN_262_91_PAIR_MISMATCH")
  validateV138Plan26291Review(candidate, expected)
  const commits = lines(git(root, ["log", "--format=%H", "--all", "--", reviewPath, reportPath]))
  let publicationCommit: string | null = null
  if (commits.length > 1) fail("V138_PLAN_262_91_PUBLICATION_LINEAGE_INVALID")
  if (commits.length === 1) {
    publicationCommit = commits[0]!
    const changed = lines(git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", publicationCommit])).sort()
    if (canonical(changed) !== canonical([reviewPath, reportPath].sort()))
      fail("V138_PLAN_262_91_PUBLICATION_LINEAGE_INVALID")
    requireAncestor(root, candidate.reviewedSource.commit, publicationCommit)
    requireAncestor(root, publicationCommit, "HEAD")
    for (const repoPath of [reviewPath, reportPath]) {
      const committed = execFileSync("/usr/bin/git", hardenedGitArgs(["show", `${publicationCommit}:${repoPath}`]), { cwd: root, env: isolatedGitEnvironment(tmpdir()) })
      if (!committed.equals(readRegular(root, repoPath)) || lines(git(root, ["log", "--format=%H", `${publicationCommit}..HEAD`, "--", repoPath])).length !== 0)
        fail("V138_PLAN_262_91_PUBLICATION_REWRITE_INVALID")
    }
  }
  return { candidate, publicationCommit }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const review = deriveV138Plan26291NoPublish(repoRoot)
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
    V138_PLAN_262_91_REVIEW_PATH,
    "--report",
    V138_PLAN_262_91_REPORT_PATH,
  ])
  if (canonical(argv) === canonical(["--check-review"]) || canonical(argv) === exactCheck) {
    const reviewPath = argv.length === 1 ? V138_PLAN_262_91_REVIEW_PATH : argv[2]!
    const reportPath = argv.length === 1 ? V138_PLAN_262_91_REPORT_PATH : argv[4]!
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
  fail("V138_PLAN_262_91_ARGUMENTS_INVALID")
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
