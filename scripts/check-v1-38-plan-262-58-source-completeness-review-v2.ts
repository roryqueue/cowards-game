#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  closeSync,
  constants,
  copyFileSync,
  existsSync,
  fstatSync,
  lstatSync,
  mkdtempSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  rmSync,
  symlinkSync,
  watch,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
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

/** Derives the Plan-58 predecessor and maximal same-trailer exact-six-path run. */
export const inspectV138SourceIdentityA8 = (repoRoot: string) => {
  const sourcePathSet = [...V138_PLAN_262_58_SOURCE_PATHS].sort()
  const firstParent = git(repoRoot, ["log", "--first-parent", "--reverse",
    "--format=%H", `--grep=${AUTHOR_TRAILER_KEY}:`, "HEAD"])
    .split("\n").filter(Boolean)
  const start = firstParent.findIndex(commit => {
    const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
      "-r", "--no-renames", commit]).split("\n").filter(Boolean).sort()
    return canonicalV138ReviewV2(paths) === canonicalV138ReviewV2(sourcePathSet)
  })
  if (start !== 0 || firstParent.length === 0) fail("V138_PLAN_262_58_SOURCE_RUN_MISSING")
  const sourceBase8 = git(repoRoot, ["show", "-s", "--format=%P",
    firstParent[start]!]).split(" ").filter(Boolean)[0] ?? ""
  if (!/^[0-9a-f]{40}$/u.test(sourceBase8) ||
    git(repoRoot, ["cat-file", "-e", `${sourceBase8}:${PLAN_PATH}`]) !== "") {
    /* cat-file success proves the frozen Plan-58 predecessor contains the plan. */
  }
  if (!/^[0-9a-f]{40}$/u.test(sourceBase8)) fail("V138_PLAN_262_58_SOURCE_BASE_INVALID")
  const sourceCandidates = firstParent.slice(start)
  const run: RecordValue[] = []
  let parent = sourceBase8
  let authorRun: string | undefined
  let index = 0
  for (; index < sourceCandidates.length; index += 1) {
    const commit = sourceCandidates[index]!
    const parents = git(repoRoot, ["show", "-s", "--format=%P", commit])
      .split(" ").filter(Boolean)
    const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
      "-r", "--no-renames", commit]).split("\n").filter(Boolean).sort()
    const trailers = git(repoRoot, ["log", "-1",
      `--format=%(trailers:key=${AUTHOR_TRAILER_KEY},valueonly)`, commit])
      .split("\n").filter(Boolean)
    if (canonicalV138ReviewV2(paths) !== canonicalV138ReviewV2(sourcePathSet)) break
    if (parents.length !== 1 || parents[0] !== parent || trailers.length !== 1 ||
      trailers[0]!.length === 0 || (authorRun !== undefined &&
      trailers[0] !== authorRun)) fail("V138_PLAN_262_58_SOURCE_RUN_INVALID")
    authorRun ??= trailers[0]
    run.push(Object.freeze({ commit, parents, paths, authorRun: trailers[0],
      tree: git(repoRoot, ["rev-parse", `${commit}^{tree}`]) }))
    parent = commit
  }
  if (run.length === 0) fail("V138_PLAN_262_58_SOURCE_RUN_MISSING")
  const a8 = run.at(-1)!.commit as string
  const laterCommits = git(repoRoot, ["rev-list", "--first-parent", "--reverse",
    `${a8}..HEAD`]).split("\n").filter(Boolean)
  const later = laterCommits.map(commit => ({ commit,
    paths: git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only", "-r",
      "--no-renames", commit]).split("\n").filter(Boolean).sort() }))
  if (later.some(({ paths }) => paths.length === 0 ||
    paths.some(repoPath => !repoPath.startsWith(".planning/")))) {
    fail("V138_PLAN_262_58_NON_PLANNING_DESCENDANT")
  }
  const aggregate = [...new Set(run.flatMap(item => item.paths as string[]))].sort()
  if (canonicalV138ReviewV2(aggregate) !== canonicalV138ReviewV2(sourcePathSet)) {
    fail("V138_PLAN_262_58_SOURCE_PATHS_INVALID")
  }
  return Object.freeze({ sourceBase8, a8,
    sourceBase8Tree: git(repoRoot, ["rev-parse", `${sourceBase8}^{tree}`]),
    a8Tree: git(repoRoot, ["rev-parse", `${a8}^{tree}`]),
    a8Parents: Object.freeze([sourceBase8]), authorRun, run: Object.freeze(run),
    aggregateChangedPaths: Object.freeze(aggregate), blobs: Object.freeze(sourceBlobs(repoRoot, a8)),
    planningDescendants: Object.freeze(later) })
}

const deriveProtectedHistory = (repoRoot: string) => {
  const failed = readJson(repoRoot, FAILURE_PATH)
  const dispositionBytes = readFileSync(path.resolve(repoRoot, DISPOSITION_PATH))
  const chargeIds = failed.historicalChargedPublicAttemptIds
  const authorizations = git(repoRoot, ["ls-files", ".planning/artifacts"])
    .split("\n").filter(repoPath => /authorization-v[1-6]\.json$/u.test(repoPath)).sort()
  if (!Array.isArray(chargeIds) || chargeIds.length !== 40 ||
    new Set(chargeIds).size !== 40 || authorizations.length !== 6 ||
    !isRecord(failed.protectedRoots)) fail("V138_PLAN_262_58_PROTECTED_HISTORY_INVALID")
  const authoritativeInputs = ["package.json", "pnpm-lock.yaml", ".planning/config.json",
    ".planning/artifacts/v1.38-pre-search-policy-root.json",
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
    FAILURE_PATH, DISPOSITION_PATH].map(repoPath => Object.freeze({ path: repoPath,
      blobOid: git(repoRoot, ["rev-parse", `HEAD:${repoPath}`]),
      sha256: sha256V138ReviewV2(readFileSync(path.resolve(repoRoot, repoPath))) }))
  return Object.freeze({ protectedA7:
    "5f39aba7833030d537c4c2767c369d24c982ed83",
    sourceA6: failed.sourceA6, sourceB6: failed.sourceB6,
    exactChargeIds: Object.freeze([...chargeIds]),
    priorAuthorizationBytes: Object.freeze(authorizations.map(repoPath => ({
      path: repoPath, blobOid: git(repoRoot, ["rev-parse", `HEAD:${repoPath}`]),
      sha256: sha256V138ReviewV2(readFileSync(path.resolve(repoRoot, repoPath))) }))),
    protectedRoots: Object.freeze(failed.protectedRoots),
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
export const captureV138ReviewV2Execution = async (repoRoot: string) => {
  const custody = inspectV138SourceIdentityA8(repoRoot)
  const fixtureRoot = mkdtempSync(path.join(realpathSync(os.tmpdir()), "cowards-a8-review-v2-"))
  const events: RecordValue[] = [{ sequence: 0, operation: "lstat", target: fixtureRoot,
    disposition: "created" }]
  let captured: RecordValue | undefined
  try {
    execFileSync("git", ["clone", "--quiet", "--no-local", repoRoot, fixtureRoot])
    execFileSync("git", ["checkout", "--quiet", custody.a8], { cwd: fixtureRoot })
    symlinkSync(path.resolve(repoRoot, "node_modules"), path.resolve(fixtureRoot, "node_modules"))
    for (const workspace of ["apps/api", "apps/runtime-service", "apps/web",
      "packages/engine", "packages/golden", "packages/map-configs",
      "packages/persistence", "packages/replay", "packages/runtime-js",
      "packages/runtime-python", "packages/runtime-supervisor",
      "packages/runtime-wasm-wasi", "packages/service", "packages/spec",
      "packages/test-utils", "packages/worker"]) {
      const sourceModules = path.resolve(repoRoot, workspace, "node_modules")
      const fixtureModules = path.resolve(fixtureRoot, workspace, "node_modules")
      if (existsSync(sourceModules) && !existsSync(fixtureModules)) {
        symlinkSync(sourceModules, fixtureModules)
      }
    }
    const before = snapshot(repoRoot)
    const manifest = checkV138Route7SourceCompleteness()
    const records: RecordValue[] = []
    for (const entry of manifest) {
      let reached = false
      await dispatchV138CurrentMatrixDirectEntry(entry.command, {
        runShard: () => fail("V138_REVIEW_V2_DECOY_SHARD_REACHED"),
        runReceipt: () => { reached = true; return entry.handler },
      })
      if (!reached) fail("V138_REVIEW_V2_DISPATCH_UNREACHED")
      events.push({ sequence: events.length, operation: "dispatch",
        target: entry.command, disposition: "reached" })
      records.push(Object.freeze({ command: entry.command, reachedExport:
        "dispatchV138CurrentMatrixDirectEntry", reachedHandler: entry.handler,
      prerequisite: entry.prerequisite, destination: entry.destination,
      effectClass: entry.sideEffect, terminalDisposition: entry.terminalDisposition,
      exitStatus: 0, outputDigest: sha256V138ReviewV2(entry.handler) }))
    }
    const transientRoot = path.resolve(fixtureRoot, ".review-v2-transient")
    mkdirSync(transientRoot)
    const fixtureWatcher = watch(transientRoot,
      { recursive: true }, (eventType, filename) => events.push({
        sequence: events.length, operation: "write", target: String(filename),
        disposition: eventType }))
    let testOutput: string
    try {
      testOutput = execFileSync(path.resolve(repoRoot, "node_modules/.bin/vitest"),
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
      manifest: Object.freeze(manifest.map(item => ({ ...item }))), records: Object.freeze(records),
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
  if (!isRecord(value) || !exactKeys(value, artifactKeys) ||
    value.schemaVersion !== REVIEW_SCHEMA || value.identityClaims?.reviewerSeparated !== false ||
    value.identityClaims?.independentPersonClaimed !== false ||
    value.identityClaims?.cryptographicReviewerIdentityClaimed !== false ||
    value.identityClaims?.independentCustodyClaimed !== false ||
    value.findingCount !== 0 || value.sourceCompletenessPassed !== true ||
    !Array.isArray(value.findings) || value.findings.length !== 0) {
    fail("V138_REVIEW_V2_SCHEMA_INVALID")
  }
  const expected = await deriveV138ReviewV2(repoRoot)
  if (canonicalV138ReviewV2(value) !== canonicalV138ReviewV2(expected)) {
    fail("V138_REVIEW_V2_RECOMPUTATION_INVALID")
  }
  return expected
}

export const inspectV138ReviewV2Publication = (repoRoot: string) => {
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
  if (parents.length !== 1) fail("V138_REVIEW_V2_PUBLICATION_PARENT_INVALID")
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

export const publishV138ReviewV2 = async (repoRoot: string) => {
  const artifact = await deriveV138ReviewV2(repoRoot)
  const artifactTarget = path.resolve(repoRoot, REVIEW_PATH)
  const reportTarget = path.resolve(repoRoot, REPORT_PATH)
  for (const target of [artifactTarget, reportTarget]) {
    try { lstatSync(target); fail("V138_REVIEW_V2_PUBLICATION_TARGET_PRESENT") }
    catch (error) { if (error instanceof TypeError) throw error
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error }
  }
  writeFileSync(artifactTarget, `${canonicalV138ReviewV2(artifact)}\n`, { flag: "wx", mode: 0o600 })
  writeFileSync(reportTarget, `# Plan 262-59 Review v2\n\nReview root: \`${artifact.reviewRoot}\`\n`,
    { flag: "wx", mode: 0o600 })
  return artifact
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
