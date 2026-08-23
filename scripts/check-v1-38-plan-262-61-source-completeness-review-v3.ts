#!/usr/bin/env -S pnpm exec tsx
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_REVIEW_V3_CANONICAL_PATH,
  V138_REVIEW_V3_REPORT_PATH,
  V138_REVIEW_V3_ROUTE_MANIFEST,
  V138_REVIEW_V3_SOURCE_PATHS,
  buildV138ReviewV3CommandArgv,
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

const blobRow = (rootPath: string, commit: string, repoPath: string) => {
  const bytes = gitBytes(rootPath, ["show", `${commit}:${repoPath}`])
  const ls = git(rootPath, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
  return Object.freeze({ path: repoPath, mode: ls[0], blobOid: ls[2],
    sha256: sha256V138ReviewerV3(bytes), byteLength: bytes.byteLength })
}

export const inspectV138Plan26261A9Custody = (rootPath = repoRoot) => {
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
  for (const item of blobs) {
    const current = readFileSync(path.resolve(rootPath, item.path))
    if (!current.equals(gitBytes(rootPath, ["show", `${SOURCE_A9}:${item.path}`])))
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
  const failure = readJson(rootPath,
    ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json")
  const charges = failure.historicalChargedPublicAttemptIds
  const expected = [5, 6, 7, 8, 9].flatMap((version) =>
    Array.from({ length: 8 }, (_, index) => `calibration:v${version}:${index}`))
  if (canonicalV138ReviewerV3(charges) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_61_CHARGES_INVALID")
  const authorizations = AUTHORIZATION_PATHS.map((repoPath) => {
    const commit = git(rootPath, ["log", "-1", "--format=%H", "--", repoPath])
    return Object.freeze({ path: repoPath, commit,
      blobOid: git(rootPath, ["rev-parse", `${commit}:${repoPath}`]),
      sha256: sha256V138ReviewerV3(gitBytes(rootPath, ["show", `${commit}:${repoPath}`])),
      byteLength: gitBytes(rootPath, ["show", `${commit}:${repoPath}`]).byteLength })
  })
  const protectedRoots = failure.protectedRoots
  if (protectedRoots === null || typeof protectedRoots !== "object" ||
    Object.values(protectedRoots).some((value) => !root(value)))
    fail("V138_PLAN_262_61_PROTECTED_ROOTS_INVALID")
  return Object.freeze({ chargeIds: Object.freeze(expected),
    authorizations: Object.freeze(authorizations), protectedRoots })
}

export const inspectV138Plan26261Lifecycle = (rootPath = repoRoot) => {
  const planDirectory = path.resolve(rootPath, REVIEW_DIRECTORY)
  const plans = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/262-*-PLAN.md`]))
  const summaries = lines(git(rootPath, ["ls-files", `${REVIEW_DIRECTORY}/262-*-SUMMARY.md`]))
  if (!existsSync(planDirectory) || plans.length !== 48 || summaries.length !== 43)
    fail("V138_PLAN_262_61_LIFECYCLE_INVALID")
  const incomplete = plans.map((repoPath) => path.basename(repoPath).replace("-PLAN.md", ""))
    .filter((id) => !summaries.some((repoPath) => repoPath.endsWith(`${id}-SUMMARY.md`)))
  const expected = ["262-48", "262-56", "262-57", "262-61", "262-62"]
  if (canonicalV138ReviewerV3(incomplete.sort()) !== canonicalV138ReviewerV3(expected))
    fail("V138_PLAN_262_61_LIFECYCLE_INVALID")
  return Object.freeze({ totalPlans: plans.length, summaries: summaries.length,
    incomplete: Object.freeze(incomplete.sort()) })
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

const parseAgentHistory = (historyPath: string) => {
  const parsed = JSON.parse(readFileSync(historyPath, "utf8")) as unknown
  const entries = Array.isArray(parsed) ? parsed :
    parsed !== null && typeof parsed === "object" &&
      Array.isArray((parsed as { entries?: unknown }).entries)
      ? (parsed as { entries: AgentHistoryEntry[] }).entries : null
  if (entries === null) fail("V138_PLAN_262_61_AGENT_HISTORY_INVALID")
  return entries as AgentHistoryEntry[]
}

const latestReview = (rootPath: string) => {
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
  const bytes = readFileSync(path.resolve(rootPath, latest.repoPath))
  const text = bytes.toString("utf8")
  if (!/^status: clean$/mu.test(text) || !/^\s*total: 0$/mu.test(text))
    fail("V138_PLAN_262_61_CODE_REVIEW_NOT_CLEAN")
  return Object.freeze({ reports: Object.freeze(reports.map(({ repoPath }) => repoPath)),
    path: latest.repoPath, root: sha256V138ReviewerV3(bytes) })
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
  const review = latestReview(rootPath)
  const fixBytes = readFileSync(path.resolve(rootPath, PLAN_61_REVIEW_FIX))
  const fixText = fixBytes.toString("utf8")
  const fixRoot = sha256V138ReviewerV3(fixBytes)
  for (const required of [sourceR3.commit, review.path, review.root, ...review.reports]) {
    if (!fixText.includes(required)) fail("V138_PLAN_262_61_REVIEW_FIX_BINDING_INVALID")
  }
  return Object.freeze({ sourceR3, codeReviewPath: review.path,
    codeReviewRoot: review.root, reviewFixRoot: fixRoot })
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
  return sha256V138ReviewerV3(canonicalV138ReviewerV3({ status, destinations }))
}

export const deriveV138Plan26261NoPublish = (rootPath = repoRoot) => {
  if (lstatSync(rootPath).isSymbolicLink())
    fail("V138_PLAN_262_61_PHYSICAL_ROOT_INVALID")
  const source = inspectV138Plan26261A9Custody(rootPath)
  const predecessors = inspectV138Plan26261Predecessors(rootPath)
  const convergence = inspectV138Plan26261SummaryConvergence(rootPath)
  const protectedHistory = inspectV138Plan26261ProtectedHistory(rootPath)
  const lifecycle = inspectV138Plan26261Lifecycle(rootPath)
  const commands = V138_REVIEW_V3_ROUTE_MANIFEST.map((entry) => Object.freeze({
    ...entry, argv: buildV138ReviewV3CommandArgv(entry.command, SOURCE_A9, "f".repeat(40)),
  }))
  const present = FORBIDDEN_DESTINATIONS.filter((repoPath) =>
    existsSync(path.resolve(rootPath, repoPath)))
  if (present.length !== 0) fail("V138_PLAN_262_61_CANONICAL_DESTINATION_PRESENT")
  return Object.freeze({ schemaVersion: "v1.38-plan-262-61-reviewer-v3-no-publish-v1",
    source, predecessors, convergence, protectedHistory, lifecycle,
    commands: Object.freeze(commands), forbiddenDestinations: FORBIDDEN_DESTINATIONS,
    findingCount: 0, publishesCanonicalReview: false, authorizesExecution: false,
    identityClaims: Object.freeze({ independentPersonClaimed: false,
      reviewerSeparated: false, externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false }) })
}

const requireOption = (argv: readonly string[], name: string) => {
  const index = argv.indexOf(name)
  if (index < 0 || index + 1 >= argv.length || argv[index + 1]!.startsWith("--"))
    fail("V138_PLAN_262_61_ARGUMENTS_INVALID")
  return argv[index + 1]!
}

const checkReceipt = (rootPath: string, receiptPath: string) => {
  const receipt = readJson(rootPath, receiptPath)
  const convergence = inspectReviewerConvergence(rootPath)
  if (receipt.schemaVersion !== "v1.38-plan-262-61-r3-author-tracking-v1" ||
    receipt.sourceR3 !== convergence.sourceR3.commit ||
    receipt.codeReviewPath !== convergence.codeReviewPath ||
    receipt.codeReviewRoot !== convergence.codeReviewRoot ||
    receipt.reviewFixRoot !== convergence.reviewFixRoot ||
    typeof receipt.r3AuthorAgent !== "string" ||
    typeof receipt.completionTimestamp !== "string")
    fail("V138_PLAN_262_61_RECEIPT_INVALID")
  return Object.freeze({ receipt, convergence })
}

const main = () => {
  const argv = process.argv.slice(2)
  if (argv.length === 1 && argv[0] === "--derive-no-publish") {
    process.stdout.write(`${canonicalV138ReviewerV3(deriveV138Plan26261NoPublish())}\n`)
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
    const history = selectCompletedAgentHistory(parseAgentHistory(path.resolve(repoRoot,
      requireOption(argv, "--agent-history"))), "262", "61")
    const convergence = inspectReviewerConvergence()
    const body = { schemaVersion: "v1.38-plan-262-61-r3-author-tracking-v1",
      r3AuthorAgent: history.agentId, phase: history.phase, plan: history.plan,
      completionTimestamp: history.completionTimestamp,
      sourceR3: convergence.sourceR3.commit,
      codeReviewPath: convergence.codeReviewPath,
      codeReviewRoot: convergence.codeReviewRoot,
      reviewFixRoot: convergence.reviewFixRoot }
    process.stdout.write(`${canonicalV138ReviewerV3(body)}\n`)
    return
  }
  if (argv[0] === "--check-r3-author-receipt") {
    checkReceipt(repoRoot, requireOption(argv, "--receipt"))
    process.stdout.write("r3-author-receipt-valid\n")
    return
  }
  if (argv.length === 1 && argv[0] === "--check-main-readiness") {
    const before = snapshotReadiness(repoRoot)
    const { receipt, convergence } = checkReceipt(repoRoot, PLAN_61_RECEIPT)
    const after = snapshotReadiness(repoRoot)
    if (before !== after) fail("V138_PLAN_262_61_READINESS_SIDE_EFFECT")
    process.stdout.write(`ready-main-review-v3 r3AuthorAgent=${receipt.r3AuthorAgent} ` +
      `sourceR3=${convergence.sourceR3.commit} codeReviewRoot=${convergence.codeReviewRoot} ` +
      `reviewFixRoot=${convergence.reviewFixRoot}\n`)
    return
  }
  if (argv[0] === "--check-plan-61-summary-candidate" ||
    argv[0] === "--check-plan-61-summary") {
    const summaryPath = requireOption(argv, "--summary")
    const receiptPath = requireOption(argv, "--receipt")
    const { receipt, convergence } = checkReceipt(repoRoot, receiptPath)
    const bytes = readFileSync(path.resolve(repoRoot, summaryPath))
    const text = bytes.toString("utf8")
    for (const value of [receipt.r3AuthorAgent, receipt.completionTimestamp,
      convergence.sourceR3.commit, convergence.codeReviewPath,
      convergence.codeReviewRoot, convergence.reviewFixRoot]) {
      if (typeof value !== "string" || !text.includes(value))
        fail("V138_PLAN_262_61_SUMMARY_BINDING_INVALID")
    }
    if (argv[0] === "--check-plan-61-summary") {
      const carrier = git(repoRoot, ["log", "-1", "--format=%H", "--", summaryPath])
      if (!gitBytes(repoRoot, ["show", `${carrier}:${summaryPath}`]).equals(bytes) ||
        lines(git(repoRoot, ["log", "--format=%H", `${carrier}..HEAD`, "--",
          summaryPath])).length !== 0) fail("V138_PLAN_262_61_SUMMARY_COMMIT_INVALID")
    }
    process.stdout.write("plan-262-61-summary-valid\n")
    return
  }
  fail("V138_PLAN_262_61_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
