#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  closeSync,
  constants,
  copyFileSync,
  existsSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  watch,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import {
  V138_PLAN_262_57_DISPOSITIONS,
  V138_PLAN_262_57_ROUTE_CONTRACT,
  V138_RECEIPT_DIRECT_COMMANDS,
  V138_ROUTE_7_SOURCE_MANIFEST,
  checkV138Route7SourceCompleteness,
  dispatchV138CurrentMatrixDirectEntry,
} from "./lib/v1-38-current-matrix-reproduction.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type RecordValue = Record<string, any>
const REVIEW_SCHEMA = "v1.38-plan-262-59-source-completeness-review-v2" as const
const PLAN_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-58-PLAN.md"
const REVIEW_PATH = ".planning/artifacts/v1.38-plan-262-59-source-completeness-review-v2.json"
const REPORT_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-59-REVIEW.md"
const FAILURE_PATH = ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json"
const DISPOSITION_PATH = ".planning/artifacts/v1.38-plan-262-58-review-v1-invalid-disposition-v1.json"
const AUTHOR_TRAILER_KEY = "Plan262-58-Author-Run"
const FROZEN_SOURCE_BASE8 =
  "5fa635ccebfcef6ff00cd05876401cec4688e64f" as const
const SUMMARY_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-58-SUMMARY.md"
const CUSTODY_MARKER = "PLAN262-58-A8-CUSTODY-V1"

export const V138_PLAN_262_58_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.ts",
  "scripts/check-v1-38-plan-262-58-source-completeness-review-v2.test.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/check-v1-38-dependency-revision-boundaries.ts",
] as const)
export const V138_PLAN_262_58_COMMANDS = Object.freeze(
  V138_ROUTE_7_SOURCE_MANIFEST.map(({ command }) => command))

const canonicalize = (value: Json): Json => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]))
    : value
export const canonicalV138ReviewV2 = (value: unknown) =>
  JSON.stringify(canonicalize(value as Json))
export const sha256V138ReviewV2 = (value: Buffer | string) =>
  `sha256:${createHash("sha256").update(value).digest("hex")}` as const
const fail = (code: string): never => { throw new TypeError(code) }
const git = (repoRoot: string, args: readonly string[]) => execFileSync("git",
  [...args], { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).trim()
const gitBytes = (repoRoot: string, args: readonly string[]) => execFileSync("git",
  [...args], { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 })
const isRecord = (value: unknown): value is RecordValue => value !== null &&
  typeof value === "object" && !Array.isArray(value)
const exactKeys = (value: RecordValue, keys: readonly string[]) =>
  canonicalV138ReviewV2(Object.keys(value).sort()) ===
    canonicalV138ReviewV2([...keys].sort())
const readJson = (repoRoot: string, repoPath: string) =>
  JSON.parse(readFileSync(path.resolve(repoRoot, repoPath), "utf8")) as RecordValue

const sourceBlobs = (repoRoot: string, commit: string) =>
  V138_PLAN_262_58_SOURCE_PATHS.map(repoPath => {
    const bytes = gitBytes(repoRoot, ["show", `${commit}:${repoPath}`])
    return Object.freeze({ path: repoPath,
      blobOid: git(repoRoot, ["rev-parse", `${commit}:${repoPath}`]),
      byteLength: bytes.byteLength, sha256: sha256V138ReviewV2(bytes) })
  })

type FrozenA8Custody = Readonly<{
  schemaVersion: "v1.38-plan-262-58-a8-custody-v1"
  sourceBase8: string
  sourceA8: string
  sourceA8Tree: string
  sourceA8Parent: string
  authorRun: string
  paths: readonly string[]
  blobs: readonly Readonly<{ path: string; mode: "100644"; blobOid: string;
    sha256: `sha256:${string}`; byteLength: number }>[]
}>

const parseCustodyCarrier = (bytes: Buffer): FrozenA8Custody => {
  const text = bytes.toString("utf8")
  const match = new RegExp(`<!-- ${CUSTODY_MARKER}\\n([^]*?)\\n-->`, "u").exec(text)
  if (match === null) throw new TypeError("V138_PLAN_262_58_CUSTODY_CARRIER_INVALID")
  let value: unknown
  try { value = JSON.parse(match[1]!) } catch {
    fail("V138_PLAN_262_58_CUSTODY_CARRIER_INVALID")
  }
  const keys = ["schemaVersion", "sourceBase8", "sourceA8", "sourceA8Tree",
    "sourceA8Parent", "authorRun", "paths", "blobs"]
  if (!isRecord(value) || !exactKeys(value, keys) ||
    value.schemaVersion !== "v1.38-plan-262-58-a8-custody-v1" ||
    !Array.isArray(value.paths) || !Array.isArray(value.blobs) ||
    value.blobs.some(blob => !isRecord(blob) || !exactKeys(blob,
      ["path", "mode", "blobOid", "sha256", "byteLength"]))) {
    fail("V138_PLAN_262_58_CUSTODY_CARRIER_INVALID")
  }
  return value as FrozenA8Custody
}

/** The sole authority for A8 is the immutable one-path summary carrier. */
export const inspectV138FrozenA8Custody = (repoRoot: string) => {
  const current = readFileSync(path.resolve(repoRoot, SUMMARY_PATH))
  const carrier = parseCustodyCarrier(current)
  if (carrier.sourceBase8 !== FROZEN_SOURCE_BASE8 ||
    carrier.sourceA8Parent !== FROZEN_SOURCE_BASE8 ||
    canonicalV138ReviewV2([...carrier.paths].sort()) !==
      canonicalV138ReviewV2([...V138_PLAN_262_58_SOURCE_PATHS].sort()) ||
    carrier.blobs.length !== V138_PLAN_262_58_SOURCE_PATHS.length) {
    fail("V138_PLAN_262_58_CUSTODY_CARRIER_INVALID")
  }
  const commits = git(repoRoot, ["log", "--first-parent", "--reverse",
    "--format=%H", "HEAD", "--", SUMMARY_PATH]).split("\n").filter(Boolean)
  const introducing = commits.filter(commit => {
    try {
      const candidate = parseCustodyCarrier(gitBytes(repoRoot,
        ["show", `${commit}:${SUMMARY_PATH}`]))
      const changed = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
        "-r", "--no-renames", commit]).split("\n").filter(Boolean)
      return candidate.sourceA8 === carrier.sourceA8 &&
        canonicalV138ReviewV2(changed) === canonicalV138ReviewV2([SUMMARY_PATH])
    } catch { return false }
  })
  if (introducing.length !== 1 ||
    git(repoRoot, ["merge-base", "--is-ancestor", carrier.sourceA8, "HEAD"]) !== "" ||
    git(repoRoot, ["show", "-s", "--format=%P", introducing[0]!]) !== carrier.sourceA8 ||
    git(repoRoot, ["log", "--format=%H", `${introducing[0]}..HEAD`, "--",
      SUMMARY_PATH]).length !== 0 ||
    !gitBytes(repoRoot, ["show", `${introducing[0]}:${SUMMARY_PATH}`]).equals(current)) {
    fail("V138_PLAN_262_58_CUSTODY_CARRIER_HISTORY_INVALID")
  }
  const parents = git(repoRoot, ["show", "-s", "--format=%P", carrier.sourceA8])
    .split(" ").filter(Boolean)
  const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
    "-r", "--no-renames", carrier.sourceA8]).split("\n").filter(Boolean).sort()
  const trailer = git(repoRoot, ["log", "-1",
    `--format=%(trailers:key=${AUTHOR_TRAILER_KEY},valueonly)`, carrier.sourceA8])
  const actualBlobs = sourceBlobs(repoRoot, carrier.sourceA8).map(blob => ({
    ...blob, mode: git(repoRoot, ["ls-tree", carrier.sourceA8, "--", blob.path])
      .split(/\s+/u)[0],
  })).sort((left, right) => left.path.localeCompare(right.path))
  if (parents.length !== 1 || parents[0] !== FROZEN_SOURCE_BASE8 ||
    trailer !== carrier.authorRun || carrier.authorRun.length === 0 ||
    canonicalV138ReviewV2(paths) !== canonicalV138ReviewV2([...carrier.paths].sort()) ||
    git(repoRoot, ["rev-parse", `${carrier.sourceA8}^{tree}`]) !== carrier.sourceA8Tree ||
    canonicalV138ReviewV2(actualBlobs) !== canonicalV138ReviewV2(
      [...carrier.blobs].sort((left, right) => left.path.localeCompare(right.path)))) {
    fail("V138_PLAN_262_58_CUSTODY_CARRIER_GIT_INVALID")
  }
  for (const blob of carrier.blobs) {
    if (blob.mode !== "100644" || !gitBytes(repoRoot,
      ["show", `${carrier.sourceA8}:${blob.path}`]).equals(
        readFileSync(path.resolve(repoRoot, blob.path)))) {
      fail("V138_PLAN_262_58_CUSTODY_CARRIER_WORKTREE_DRIFT")
    }
  }
  return Object.freeze({ ...carrier, carrierCommit: introducing[0]!,
    carrierBlob: git(repoRoot, ["rev-parse", `${introducing[0]}:${SUMMARY_PATH}`]) })
}

/** Derives the Plan-58 predecessor and maximal same-trailer exact-six-path run. */
export const inspectV138SourceIdentityA8 = (repoRoot: string) => {
  const frozen = inspectV138FrozenA8Custody(repoRoot)
  return Object.freeze({ sourceBase8: frozen.sourceBase8, a8: frozen.sourceA8,
    sourceBase8Tree: git(repoRoot, ["rev-parse", `${frozen.sourceBase8}^{tree}`]),
    a8Tree: frozen.sourceA8Tree, a8Parents: Object.freeze([frozen.sourceA8Parent]),
    authorRun: frozen.authorRun, run: Object.freeze([{ commit: frozen.sourceA8,
      parents: [frozen.sourceA8Parent], paths: frozen.paths,
      authorRun: frozen.authorRun, tree: frozen.sourceA8Tree }]),
    aggregateChangedPaths: Object.freeze([...frozen.paths].sort()),
    blobs: Object.freeze(frozen.blobs.map(({ mode: _mode, ...blob }) => blob)),
    planningDescendants: Object.freeze([{ commit: frozen.carrierCommit,
      paths: [SUMMARY_PATH] }]) })
}

const FROZEN_CHARGE_IDS = Object.freeze([5, 6, 7, 8, 9].flatMap(version =>
  Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`)))
const FROZEN_AUTHORIZATIONS = Object.freeze([
  [".planning/artifacts/v1.38-plan-262-15-authorization-v1.json", "0183733a18d4bdbf61c46e723373ec8359f2944f", "sha256:1e58a293effd7e84e7c88978dd9dda0dd0ef07c3d66e85312f457a4d183c0220"],
  [".planning/artifacts/v1.38-plan-262-18-authorization-v2.json", "2843f136e5c48513e66ace422b5db826bcd51971", "sha256:514320cce291d5137e6ddf9c2b92ae1941e8f00bf4eb9480d7ea38cc01e0fffa"],
  [".planning/artifacts/v1.38-plan-262-21-authorization-v3.json", "703513ce15c27bf0ffefe632c9bb8fa2033310a8", "sha256:30c4f8a85678b0e274588be9a038cd59c824ad892b987ca79d1de35806823734"],
  [".planning/artifacts/v1.38-plan-262-24-authorization-v4.json", "e3f5ff9db66401adfa7d39bbefb94aa9170b7049", "sha256:1b18234f0e2255af852038e153355fa3295f4e7863966803b335285e3da85eea"],
  [".planning/artifacts/v1.38-plan-262-29-authorization-v5.json", "57c4d7f2e54901aed04b1b713a5839ef25a946f2", "sha256:e9568f8606901935a403f3f2c4ff1bb0d142169544c469f424c764088eff3456"],
  [".planning/artifacts/v1.38-plan-262-47-authorization-v6.json", "94e512a7f1b2bf04f96e8e4d00a6325fa735f285", "sha256:77af205522666a4e013c19732eec580d7848722e348fe1029eb850263820f428"],
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

const deriveProtectedHistory = (repoRoot: string) => {
  const failed = readJson(repoRoot, FAILURE_PATH)
  const dispositionBytes = readFileSync(path.resolve(repoRoot, DISPOSITION_PATH))
  const discovered = git(repoRoot, ["ls-files", ".planning/artifacts"])
    .split("\n").filter(repoPath => /authorization-v[1-6]\.json$/u.test(repoPath)).sort()
  if (canonicalV138ReviewV2(failed.historicalChargedPublicAttemptIds) !==
      canonicalV138ReviewV2(FROZEN_CHARGE_IDS) || failed.sourceA6 !==
      "600c7770867e6090147914dc090780f5b63930ec" || failed.sourceB6 !==
      "e2166736c2a1a3f1decbb1d6b3722f87945a47ea" ||
    canonicalV138ReviewV2(failed.protectedRoots) !==
      canonicalV138ReviewV2(FROZEN_PROTECTED_ROOTS) ||
    canonicalV138ReviewV2(discovered) !== canonicalV138ReviewV2(
      FROZEN_AUTHORIZATIONS.map(([repoPath]) => repoPath))) {
    fail("V138_PLAN_262_58_PROTECTED_HISTORY_INVALID")
  }
  const frozenInputs = [
    ["package.json", "a059907e8d3e30fd7a5c0e0490be742469f50608", "sha256:9fc87b150e7477f4fe711d0bbc5baf3b77245ebe35a25103749ce0dc132e646e"],
    ["pnpm-lock.yaml", "3cbadfe3a6297d1706c026d381cb4b565935faea", "sha256:55cfd0166e4954863a84a77d50968269c14a22a2a788278ad5dead963fff0df3"],
    [".planning/config.json", "d9629e25323e778ed028cb33a306817e8cbdd8a2", "sha256:a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b"],
    [".planning/artifacts/v1.38-pre-search-policy-root.json", "68e753ac98767988951f3a240fe2281a84189f3a", "sha256:97eb6a7d3ba3e23f5cbeba101f7f17b0fe5556d5e6581da170313a0dbf5cf982"],
    [".planning/artifacts/v1.38-local-seal-independent-verification-v3.json", "42fdf6cdfe04ab477c4499257c6fd245f2ad02c3", "sha256:9d60a6dad3e084d9dbd28fdccf68e61f9f1aa1483df42ed61ec426b93bbb023e"],
    [FAILURE_PATH, "f5efc47d0e65cebee250431cded02c3fa41906c0", "sha256:dffa9bf3915895506958aef5bb45d350f70eb7a3c190078e217384c16f3e4a8a"],
    [DISPOSITION_PATH, "9c9bc79a0eec75c174f45ead3db64d7eecad9269", "sha256:870521e336074efd00c2fc765d552f7b23e6898410daf512d59b8792cad1fd59"],
  ] as const
  const authoritativeInputs = frozenInputs.map(([repoPath, blobOid, digest]) => {
    const bytes = readFileSync(path.resolve(repoRoot, repoPath))
    if (git(repoRoot, ["rev-parse", `HEAD:${repoPath}`]) !== blobOid ||
      sha256V138ReviewV2(bytes) !== digest ||
      !gitBytes(repoRoot, ["show", `${FROZEN_SOURCE_BASE8}:${repoPath}`]).equals(bytes)) {
      fail("V138_PLAN_262_58_PROTECTED_HISTORY_INVALID")
    }
    return Object.freeze({ path: repoPath, blobOid, sha256: digest })
  })
  return Object.freeze({ protectedA7:
    "5f39aba7833030d537c4c2767c369d24c982ed83",
    sourceA6: failed.sourceA6, sourceB6: failed.sourceB6,
    exactChargeIds: FROZEN_CHARGE_IDS,
    priorAuthorizationBytes: Object.freeze(FROZEN_AUTHORIZATIONS.map(
      ([repoPath, blobOid, digest]) => {
        const bytes = readFileSync(path.resolve(repoRoot, repoPath))
        if (git(repoRoot, ["rev-parse", `HEAD:${repoPath}`]) !== blobOid ||
          sha256V138ReviewV2(bytes) !== digest ||
          !gitBytes(repoRoot, ["show", `${FROZEN_SOURCE_BASE8}:${repoPath}`]).equals(bytes)) {
          fail("V138_PLAN_262_58_PROTECTED_HISTORY_INVALID")
        }
        return Object.freeze({ path: repoPath, blobOid, sha256: digest })
      })),
    protectedRoots: FROZEN_PROTECTED_ROOTS,
    authoritativeInputs: Object.freeze(authoritativeInputs),
    reviewV1InvalidDispositionSha256: sha256V138ReviewV2(dispositionBytes) })
}

const inventoryPaths = Object.freeze([
  REVIEW_PATH, REPORT_PATH,
  ".planning/artifacts/v1.38-plan-262-56-authorization-v8.json",
  ".planning/artifacts/v1.38-successor-source-seal-v8.json",
  ".planning/artifacts/v1.38-plan-262-56-authorization-v7.json",
  ".planning/artifacts/v1.38-successor-source-seal-v7.json",
  ...V138_PLAN_262_57_ROUTE_CONTRACT.canonicalDestinations,
])

const inspectNoFollow = (repoRoot: string, repoPath: string) => {
  if (path.isAbsolute(repoPath) || path.normalize(repoPath) !== repoPath ||
    repoPath.split(path.sep).includes("..")) fail("V138_REVIEW_V2_PATH_ESCAPE")
  let cursor = realpathSync(repoRoot)
  for (const part of repoPath.split("/")) {
    cursor = path.join(cursor, part)
    try {
      const stat = lstatSync(cursor)
      if (stat.isSymbolicLink()) fail("V138_REVIEW_V2_SYMLINK_PATH")
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { path: repoPath, state: "absent" }
      throw error
    }
  }
  const stat = lstatSync(cursor)
  if (!stat.isFile() || stat.nlink !== 1) fail("V138_REVIEW_V2_NONCANONICAL_PATH")
  const fd = openSync(cursor, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { return { path: repoPath, state: "file", byteLength: fstatSync(fd).size,
    sha256: sha256V138ReviewV2(readFileSync(fd)) } } finally { closeSync(fd) }
}
const snapshot = (repoRoot: string) => {
  const entries = inventoryPaths.map(repoPath => inspectNoFollow(repoRoot, repoPath))
  return Object.freeze({ entries: Object.freeze(entries), root:
    sha256V138ReviewV2(canonicalV138ReviewV2(entries)) })
}

/** Runs the production direct dispatcher in an exact-A8 disposable clone. */
export const captureV138ReviewV2Execution = async (
  repoRoot: string,
): Promise<Readonly<RecordValue>> => {
  const custody = inspectV138SourceIdentityA8(repoRoot)
  const fixtureRoot = mkdtempSync(path.join(realpathSync(os.tmpdir()), "cowards-a8-review-v2-"))
  const events: RecordValue[] = [{ sequence: 0, operation: "lstat", target: fixtureRoot,
    disposition: "created" }]
  let captured: RecordValue | undefined
  try {
    execFileSync("git", ["clone", "--quiet", "--no-local", repoRoot, fixtureRoot])
    execFileSync("git", ["checkout", "--quiet", custody.a8], { cwd: fixtureRoot })
    const dependencyRepoRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)), "..")
    symlinkSync(path.resolve(dependencyRepoRoot, "node_modules"),
      path.resolve(fixtureRoot, "node_modules"))
    for (const workspace of ["apps/api", "apps/runtime-service", "apps/web",
      "packages/engine", "packages/golden", "packages/map-configs",
      "packages/persistence", "packages/replay", "packages/runtime-js",
      "packages/runtime-python", "packages/runtime-supervisor",
      "packages/runtime-wasm-wasi", "packages/service", "packages/spec",
      "packages/test-utils", "packages/worker"]) {
      const sourceModules = path.resolve(dependencyRepoRoot, workspace, "node_modules")
      const fixtureModules = path.resolve(fixtureRoot, workspace, "node_modules")
      if (existsSync(sourceModules) && !existsSync(fixtureModules)) {
        symlinkSync(sourceModules, fixtureModules)
      }
    }
    const detached = await import(`${pathToFileURL(path.resolve(fixtureRoot,
      "scripts/lib/v1-38-current-matrix-reproduction.ts")).href}?a8=${custody.a8}`)
    const before = snapshot(repoRoot)
    const manifest = detached.checkV138Route7SourceCompleteness()
    const records: RecordValue[] = []
    for (const entry of manifest) {
      let reached = false
      let observedOutput = ""
      let observedError: string | undefined
      await detached.dispatchV138CurrentMatrixDirectEntry(entry.command, {
        runShard: () => fail("V138_REVIEW_V2_DECOY_SHARD_REACHED"),
        runReceipt: async () => {
          reached = true
          try {
            await detached.runReceiptCli({ argv: ["node", "detached-a8",
              entry.command], repoRoot: fixtureRoot,
              observeHeadroom: async () => { throw new TypeError("INJECTED_HEADROOM") },
              calibrate: async () => { throw new TypeError("INJECTED_CALIBRATION") },
              executeMatrix: async () => { throw new TypeError("INJECTED_MATRIX") },
              writeOutput: (value: string) => { observedOutput += value } })
          } catch (error) {
            observedError = error instanceof Error ? error.message : String(error)
          }
          return undefined
        },
      })
      if (!reached) fail("V138_REVIEW_V2_DISPATCH_UNREACHED")
      events.push({ sequence: events.length, operation: "dispatch",
        target: entry.command, disposition: "reached" })
      records.push(Object.freeze({ command: entry.command, reachedExport:
        "dispatchV138CurrentMatrixDirectEntry", reachedHandler: entry.handler,
      prerequisite: entry.prerequisite, destination: entry.destination,
      effectClass: entry.sideEffect, terminalDisposition: entry.terminalDisposition,
      exitStatus: observedError === undefined ? 0 : 64,
      observedError: observedError ?? null,
      outputDigest: sha256V138ReviewV2(observedOutput) }))
    }
    const transientRoot = path.resolve(fixtureRoot, ".review-v2-transient")
    mkdirSync(transientRoot)
    const fixtureWatcher = watch(transientRoot,
      { recursive: true }, (eventType, filename) => events.push({
        sequence: events.length, operation: "write", target: String(filename),
        disposition: eventType }))
    let testOutput: string
    try {
      testOutput = execFileSync(path.resolve(dependencyRepoRoot, "node_modules/.bin/vitest"),
        ["run", "scripts/evaluate-v1-38-successor-source-complete.test.ts",
          "--pool=forks", "--maxWorkers=1", "--no-file-parallelism",
          "--testTimeout=1500000", "--bail=1"], { cwd: fixtureRoot,
          encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
          env: { ...process.env, TMPDIR: transientRoot,
            V138_PLAN_262_58_EXACT_A8: custody.a8 } })
      await new Promise(resolve => setTimeout(resolve, 25))
    } finally { fixtureWatcher.close() }
    events.push({ sequence: events.length, operation: "open", target: "exact-a8-test-output",
      disposition: sha256V138ReviewV2(testOutput) })
    if (!events.some(event => event.operation === "write")) {
      fail("V138_REVIEW_V2_TRANSIENT_WRITE_LEDGER_MISSING")
    }
    const after = snapshot(repoRoot)
    if (before.root !== after.root) fail("V138_REVIEW_V2_CANONICAL_STATE_CHANGED")
    captured = { fixtureRoot, fixtureCommit: custody.a8,
      manifest: Object.freeze(manifest.map((item: RecordValue) => ({ ...item }))), records: Object.freeze(records),
      terminalDispositions: Object.freeze([...V138_PLAN_262_57_DISPOSITIONS]),
      before, after, testOutputDigest: sha256V138ReviewV2(testOutput),
    }
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
    events.push({ sequence: events.length, operation: "cleanup", target: fixtureRoot,
      disposition: "removed" })
    let absent = false
    try { lstatSync(fixtureRoot) } catch (error) {
      absent = (error as NodeJS.ErrnoException).code === "ENOENT"
    }
    if (!absent) fail("V138_REVIEW_V2_FIXTURE_CLEANUP_FAILED")
    events.push({ sequence: events.length, operation: "lstat", target: fixtureRoot,
      disposition: "ENOENT" })
  }
  if (captured === undefined) fail("V138_REVIEW_V2_EXECUTION_CAPTURE_MISSING")
  return Object.freeze({ ...captured, events: Object.freeze([...events]) })
}

const artifactKeys = ["schemaVersion", "sourceBase8", "sourceA8", "custody",
  "reachability", "transcript", "protectedHistory", "snapshots", "identityClaims",
  "findings", "findingCount", "sourceCompletenessPassed", "reviewRoot"] as const
const requireRecordKeys = (value: unknown, keys: readonly string[], code: string): RecordValue => {
  if (!isRecord(value) || !exactKeys(value, keys)) fail(code)
  return value as RecordValue
}

/** Pure structural/root validation shared by reviewer and authorization-v8. */
export const validateV138ReviewV2DocumentShape = (value: unknown) => {
  const document = requireRecordKeys(value, artifactKeys, "V138_REVIEW_V2_SCHEMA_INVALID")
  const identity = requireRecordKeys(document.identityClaims,
    ["independentPersonClaimed", "reviewerSeparated", "externalIdentityClaimed",
      "cryptographicReviewerIdentityClaimed", "independentCustodyClaimed",
      "proceduralContext"], "V138_REVIEW_V2_IDENTITY_INVALID")
  requireRecordKeys(document.custody, ["sourceBase8", "a8", "sourceBase8Tree",
    "a8Tree", "a8Parents", "authorRun", "run", "aggregateChangedPaths", "blobs",
    "planningDescendants"], "V138_REVIEW_V2_CUSTODY_INVALID")
  requireRecordKeys(document.reachability, ["manifest", "commands", "directCommands",
    "reachedHandlers", "routeOrdinal", "executionSchemas"],
  "V138_REVIEW_V2_REACHABILITY_INVALID")
  const transcript = requireRecordKeys(document.transcript, ["fixtureCommit", "records",
    "terminalDispositions", "testOutputDigest", "events", "cleanup"],
  "V138_REVIEW_V2_TRANSCRIPT_INVALID")
  requireRecordKeys(document.protectedHistory, ["protectedA7", "sourceA6", "sourceB6",
    "exactChargeIds", "priorAuthorizationBytes", "protectedRoots", "authoritativeInputs",
    "reviewV1InvalidDispositionSha256"], "V138_REVIEW_V2_PROTECTED_HISTORY_INVALID")
  requireRecordKeys(document.snapshots, ["repositoryBefore", "repositoryAfter",
    "closedInventory", "transientWritesObserved"], "V138_REVIEW_V2_SNAPSHOTS_INVALID")
  if (document.schemaVersion !== REVIEW_SCHEMA ||
    identity.independentPersonClaimed !== false || identity.reviewerSeparated !== false ||
    identity.externalIdentityClaimed !== false ||
    identity.cryptographicReviewerIdentityClaimed !== false ||
    identity.independentCustodyClaimed !== false || document.findingCount !== 0 ||
    document.sourceCompletenessPassed !== true || !Array.isArray(document.findings) ||
    document.findings.length !== 0 || !Array.isArray(transcript.records) ||
    transcript.records.length !== 10 || !Array.isArray(transcript.events) ||
    transcript.events.length === 0 || !isRecord(transcript.cleanup) ||
    !exactKeys(transcript.cleanup, ["removed", "finalLstat"]) ||
    transcript.cleanup.removed !== true || transcript.cleanup.finalLstat !== "ENOENT") {
    fail("V138_REVIEW_V2_SCHEMA_INVALID")
  }
  const { reviewRoot, ...body } = document
  if (reviewRoot !== sha256V138ReviewV2(canonicalV138ReviewV2(body))) {
    fail("V138_REVIEW_V2_ROOT_INVALID")
  }
  return document
}
export const deriveV138ReviewV2 = async (repoRoot: string) => {
  const custody = inspectV138SourceIdentityA8(repoRoot)
  const execution = await captureV138ReviewV2Execution(repoRoot)
  const reachability = Object.freeze({ manifest: execution.manifest,
    commands: Object.freeze([...V138_PLAN_262_58_COMMANDS]),
    directCommands: Object.freeze([...V138_RECEIPT_DIRECT_COMMANDS]
      .filter(command => V138_PLAN_262_58_COMMANDS.includes(command as never))),
    reachedHandlers: Object.freeze(execution.records.map(item => item.reachedHandler)),
    routeOrdinal: V138_PLAN_262_57_ROUTE_CONTRACT.routeOrdinal,
    executionSchemas: Object.freeze({ context:
      V138_PLAN_262_57_ROUTE_CONTRACT.executionContextSchema, preflight:
      V138_PLAN_262_57_ROUTE_CONTRACT.preflightSchema, calibration:
      V138_PLAN_262_57_ROUTE_CONTRACT.calibrationSchema, reproduction:
      V138_PLAN_262_57_ROUTE_CONTRACT.reproductionSchema }) })
  const transcript = Object.freeze({ fixtureCommit: execution.fixtureCommit,
    records: execution.records, terminalDispositions: execution.terminalDispositions,
    testOutputDigest: execution.testOutputDigest, events: execution.events,
    cleanup: Object.freeze({ removed: true, finalLstat: "ENOENT" }) })
  const body = { schemaVersion: REVIEW_SCHEMA, sourceBase8: custody.sourceBase8,
    sourceA8: custody.a8, custody, reachability, transcript,
    protectedHistory: deriveProtectedHistory(repoRoot),
    snapshots: Object.freeze({ repositoryBefore: execution.before,
      repositoryAfter: execution.after, closedInventory: inventoryPaths,
      transientWritesObserved: execution.events.some(event => event.operation === "open") }),
    identityClaims: Object.freeze({ independentPersonClaimed: false,
      reviewerSeparated: false, externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false, independentCustodyClaimed: false,
      proceduralContext: "single_operator_owned_exact_a8_review_v2" }),
    findings: Object.freeze([]), findingCount: 0, sourceCompletenessPassed: true }
  return Object.freeze({ ...body, reviewRoot:
    sha256V138ReviewV2(canonicalV138ReviewV2(body)) })
}

export const validateV138ReviewV2Artifact = async (repoRoot: string,
  value: unknown) => {
  validateV138ReviewV2DocumentShape(value)
  const expected = await deriveV138ReviewV2(repoRoot)
  if (canonicalV138ReviewV2(value) !== canonicalV138ReviewV2(expected)) {
    fail("V138_REVIEW_V2_RECOMPUTATION_INVALID")
  }
  return expected
}

export const inspectV138ReviewV2Publication = (repoRoot: string) => {
  const a8 = inspectV138SourceIdentityA8(repoRoot).a8
  const commits = git(repoRoot, ["log", "--all", "--format=%H", "--", REVIEW_PATH,
    REPORT_PATH]).split("\n").filter(Boolean)
  const introducing = commits.filter(commit => {
    const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only", "-r",
      "--no-renames", commit]).split("\n").filter(Boolean).sort()
    return canonicalV138ReviewV2(paths) === canonicalV138ReviewV2([REPORT_PATH, REVIEW_PATH].sort())
  })
  if (introducing.length !== 1) fail("V138_REVIEW_V2_PUBLICATION_COMMIT_INVALID")
  const commit = introducing[0]!
  const parents = git(repoRoot, ["show", "-s", "--format=%P", commit]).split(" ").filter(Boolean)
  const firstParent = git(repoRoot, ["rev-list", "--first-parent", "HEAD"])
    .split("\n").filter(Boolean)
  if (parents.length !== 1 || !firstParent.includes(commit) ||
    git(repoRoot, ["merge-base", "--is-ancestor", a8, commit]) !== "" ||
    git(repoRoot, ["merge-base", "--is-ancestor", commit, "HEAD"]) !== "") {
    fail("V138_REVIEW_V2_PUBLICATION_PARENT_INVALID")
  }
  for (const repoPath of [REVIEW_PATH, REPORT_PATH]) {
    if (git(repoRoot, ["ls-tree", "--name-only", parents[0]!, "--", repoPath])) {
      fail("V138_REVIEW_V2_PUBLICATION_NOT_EXCLUSIVE")
    }
  }
  const later = git(repoRoot, ["log", "--format=%H", `${commit}..HEAD`, "--",
    REVIEW_PATH, REPORT_PATH]).split("\n").filter(Boolean)
  if (later.length !== 0) fail("V138_REVIEW_V2_PUBLICATION_MODIFIED")
  return Object.freeze({ commit, parents: Object.freeze(parents),
    tree: git(repoRoot, ["rev-parse", `${commit}^{tree}`]),
    blobs: Object.freeze([REVIEW_PATH, REPORT_PATH].map(repoPath => ({ path: repoPath,
      blobOid: git(repoRoot, ["rev-parse", `${commit}:${repoPath}`]),
      sha256: sha256V138ReviewV2(gitBytes(repoRoot, ["show", `${commit}:${repoPath}`])) }))),
    laterModificationCount: 0 as const })
}

const validatePublicationParent = (repoRoot: string, repoPath: string) => {
  const root = realpathSync(repoRoot)
  const parent = path.dirname(repoPath)
  let cursor = root
  for (const segment of parent.split("/")) {
    cursor = path.join(cursor, segment)
    const stat = lstatSync(cursor)
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail("V138_REVIEW_V2_PUBLICATION_ANCESTOR_INVALID")
    }
  }
  return cursor
}

export const publishV138ReviewV2 = async (repoRoot: string) => {
  const artifact = await deriveV138ReviewV2(repoRoot)
  const artifactTarget = path.resolve(repoRoot, REVIEW_PATH)
  const reportTarget = path.resolve(repoRoot, REPORT_PATH)
  for (const [repoPath, target] of [[REVIEW_PATH, artifactTarget],
    [REPORT_PATH, reportTarget]] as const) {
    validatePublicationParent(repoRoot, repoPath)
    try { lstatSync(target); fail("V138_REVIEW_V2_PUBLICATION_TARGET_PRESENT") }
    catch (error) { if (error instanceof TypeError) throw error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
  }
  const stage = mkdtempSync(path.join(path.resolve(repoRoot, ".planning"),
    ".review-v2-stage-"))
  const stagedArtifact = path.join(stage, "artifact")
  const stagedReport = path.join(stage, "report")
  let artifactLinked = false
  let reportLinked = false
  try {
    for (const [target, bytes] of [[stagedArtifact,
      `${canonicalV138ReviewV2(artifact)}\n`], [stagedReport,
      `# Plan 262-59 Review v2\n\nReview root: \`${artifact.reviewRoot}\`\n`]] as const) {
      const fd = openSync(target, constants.O_CREAT | constants.O_EXCL |
        constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
      try { writeFileSync(fd, bytes); fsyncSync(fd) } finally { closeSync(fd) }
    }
    linkSync(stagedArtifact, artifactTarget); artifactLinked = true
    linkSync(stagedReport, reportTarget); reportLinked = true
    return artifact
  } catch (error) {
    if (reportLinked) unlinkSync(reportTarget)
    if (artifactLinked) unlinkSync(artifactTarget)
    throw error
  } finally { rmSync(stage, { recursive: true, force: true }) }
}

export const buildV138ReviewV1InvalidDisposition = (repoRoot: string) =>
  readJson(repoRoot, DISPOSITION_PATH)
export const checkV138ReviewV1InvalidDisposition = (repoRoot: string,
  value: unknown) => {
  const expected = buildV138ReviewV1InvalidDisposition(repoRoot)
  if (canonicalV138ReviewV2(value) !== canonicalV138ReviewV2(expected)) {
    fail("V138_REVIEW_V1_INVALID_DISPOSITION_INVALID")
  }
  return expected
}

export const assertV138Plan26258DestinationAbsence = (repoRoot: string) => {
  for (const repoPath of inventoryPaths) {
    if (inspectNoFollow(repoRoot, repoPath).state !== "absent") {
      fail("V138_PLAN_262_58_DESTINATION_PRESENT")
    }
  }
  return inventoryPaths
}

const main = async () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === "--check-source-a8") {
    process.stdout.write(`${canonicalV138ReviewV2(inspectV138SourceIdentityA8(repoRoot))}\n`)
  } else if (args.length === 1 && args[0] === "--publish-review-v2") {
    const artifact = await publishV138ReviewV2(repoRoot)
    process.stdout.write(`${canonicalV138ReviewV2({ reviewRoot: artifact.reviewRoot })}\n`)
  } else if (args.length === 1 && args[0] === "--check-review-v2") {
    const publication = inspectV138ReviewV2Publication(repoRoot)
    const bytes = readFileSync(path.resolve(repoRoot, REVIEW_PATH), "utf8")
    const artifact = await validateV138ReviewV2Artifact(repoRoot, JSON.parse(bytes))
    if (bytes !== `${canonicalV138ReviewV2(artifact)}\n`) fail("V138_REVIEW_V2_BYTES_INVALID")
    process.stdout.write(`${canonicalV138ReviewV2({ reviewRoot: artifact.reviewRoot,
      publication })}\n`)
  } else if (args.length === 1 && args[0] === "--check-review-v1-invalid-disposition") {
    const value = readJson(repoRoot, DISPOSITION_PATH)
    checkV138ReviewV1InvalidDisposition(repoRoot, value)
    process.stdout.write(`${canonicalV138ReviewV2({ disposition: value.disposition,
      dispositionRoot: value.dispositionRoot, eligibleAuthorizationInput: false })}\n`)
  } else fail("V138_PLAN_262_58_REVIEWER_V2_CLI_ARGUMENTS_INVALID")
}
if (process.argv[1] === fileURLToPath(import.meta.url)) void main()
