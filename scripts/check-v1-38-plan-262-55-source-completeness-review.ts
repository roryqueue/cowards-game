import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { existsSync, lstatSync, readFileSync, readlinkSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_PLAN_262_57_FRESH_DESTINATIONS,
  V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
  V138_PLAN_262_57_ROUTE_DESTINATIONS,
  V138_PLAN_262_56_CANONICAL_PATHS,
} from "./lib/v1-38-successor-source-seal.js"

export const REVIEW_PROTOCOL =
  "single_operator_procedural_source_review_v1" as const
export const REVIEWER_RUN = "codex-plan-262-55-procedural-review-20260815"
export const SOURCE_BASE7 = "be2a7164dbf332f2295114ddaf563ee11013bf5a"
export const A7 = "5f39aba7833030d537c4c2767c369d24c982ed83"
const AUTHOR_TRAILER = "codex-reviewfix-262-54-v3-20260815"
const SUMMARY_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-54-SUMMARY.md"
const ARTIFACT_PATH = ".planning/artifacts/v1.38-plan-262-55-source-completeness-review-v1.json"
const REVIEW_PATH = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-55-REVIEW.md"
const FAILURE_PATH = ".planning/artifacts/v1.38-plan-262-47-pre-execution-source-failure-v1.json"
const SOURCE_PATHS = Object.freeze([
  "scripts/evaluate-v1-38-successor-route.test.ts",
  "scripts/evaluate-v1-38-successor-source-complete.test.ts",
  "scripts/lib/v1-38-current-matrix-reproduction.ts",
  "scripts/lib/v1-38-successor-source-seal.ts",
] as const)

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Finding = Readonly<{ code: string; detail: string }>

const commandSpecs = Object.freeze([
  ["--check-plan-262-57-pre-execution-readiness-v1", "checkV138Plan26257PreExecutionReadinessV1", V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH, "none", "authorization-v7/seal-v7/all-route-destinations-absent"],
  ["--resolve-plan-262-57-pre-start-v1", "writeV138Plan26257PreStartObstructionV1", V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH, "fixture-write-only", "authorization-v7/seal-v7/exactly-one-obstruction"],
  ["--check-plan-262-57-pre-start-obstruction-v1", "checkV138Plan26257PreStartObstructionBranch", V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH, "none", "pre-start-disposition-present"],
  ["--write-execution-context-v11-receipt", "writeV138Plan26257RouteStartV1", V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!, "fixture-write-only", "authorization-v7/seal-v7/fresh-route"],
  ["--write-plan-262-57-route-start-v1", "writeV138Plan26257RouteStartV1", V138_PLAN_262_57_ROUTE_DESTINATIONS[0]!, "fixture-write-only", "authorization-v7/seal-v7/fresh-route"],
  ["--write-headroom-preflight-v11-receipt", "writeV138HostHeadroomPreflightV11Receipt", V138_PLAN_262_57_ROUTE_DESTINATIONS[1]!, "injected-headroom", "atomic-route-start"],
  ["--calibrate-parallel-v11-receipt", "writeV138ParallelCalibrationV11Receipt", V138_PLAN_262_57_ROUTE_DESTINATIONS[2]!, "injected-child-runner", "preflight-admitted"],
  ["--write-authoritative-v12-receipt", "writeV138AuthoritativeMatrixV12Receipt", V138_PLAN_262_57_ROUTE_DESTINATIONS[3]!, "injected-child-runner", "calibration-admitted-8/8/4"],
  ["--write-plan-262-57-terminal-v1", "writeV138Plan26257TerminalV1", V138_PLAN_262_57_ROUTE_DESTINATIONS[4]!, "fixture-write-only", "route-started"],
  ["--check-plan-262-57-terminal-v1", "checkV138Plan26257TerminalBranch", V138_PLAN_262_57_ROUTE_DESTINATIONS[4]!, "none", "terminal-present"],
] as const)

const dispositions = Object.freeze([
  "tool_identity_failed", "protected_history_failed",
  "formation_absence_failed", "pattern_c_ownership_failed",
  "fresh_destination_failed", "consumed_stage_interrupted",
  "preflight_unavailable", "preflight_refused", "calibration_stopped",
  "reproduction_stopped", "reproduction_passed",
] as const)

const canonicalize = (value: Json): Json => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) =>
      a.localeCompare(b)).map(([key, item]) => [key, canonicalize(item)]))
    : value
const canonical = (value: unknown): string =>
  JSON.stringify(canonicalize(value as Json))
const sha256 = (value: Buffer | string): string =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", [...args], { cwd: repoRoot, encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024 }).trim()
const sorted = (values: readonly string[]) => [...values].sort()

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  canonical(sorted(Object.keys(value))) === canonical(sorted(keys))
const record = (value: unknown, keys: readonly string[], code: string) => {
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
    !exactKeys(value as Record<string, unknown>, keys)) throw new TypeError(code)
  return value as Record<string, unknown>
}

const parseSummaryClaim = (bytes: string) => {
  const one = (label: string) => {
    const matches = [...bytes.matchAll(new RegExp(
      `^- \\*\\*${label}:\\*\\* \\x60([0-9a-f]{40})\\x60$`, "gmu"))]
    if (matches.length !== 1) throw new TypeError(`REVIEW_SUMMARY_${label.toUpperCase()}_INVALID`)
    return matches[0]![1]!
  }
  return { sourceBase7: one("sourceBase7"), a7: one("A7") }
}

const deriveCustody = (repoRoot: string) => {
  const selectorCommits = git(repoRoot, ["log", "--all", "--reverse",
    "--format=%H", "-SPLAN_262_54_RED", "--", ...SOURCE_PATHS])
    .split("\n").filter(Boolean)
  const range = git(repoRoot, ["rev-list", "--reverse", `${SOURCE_BASE7}..${A7}`])
    .split("\n").filter(Boolean)
  const commits = range.map((commit) => {
    const parents = git(repoRoot, ["show", "-s", "--format=%P", commit])
      .split(" ").filter(Boolean)
    const paths = git(repoRoot, ["diff-tree", "--no-commit-id", "--name-only",
      "-r", "--no-renames", commit]).split("\n").filter(Boolean).sort()
    const trailers = git(repoRoot, ["log", "-1",
      "--format=%(trailers:key=Plan-262-54-Author-Run,valueonly)", commit])
      .split("\n").filter(Boolean)
    return { commit, parents, tree: git(repoRoot, ["rev-parse", `${commit}^{tree}`]),
      paths, authorRunTrailers: trailers }
  })
  const blobs = SOURCE_PATHS.map((repoPath) => {
    const committed = execFileSync("git", ["show", `${A7}:${repoPath}`],
      { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 })
    const working = readFileSync(path.resolve(repoRoot, repoPath))
    return { path: repoPath, blobOid: git(repoRoot, ["rev-parse", `${A7}:${repoPath}`]),
      byteLength: committed.byteLength, sha256: sha256(committed),
      workingBytesMatchA7: working.equals(committed) }
  })
  return {
    selectorIntroducingCommit: selectorCommits[0] ?? null,
    sourceBase7: SOURCE_BASE7,
    sourceBase7Tree: git(repoRoot, ["rev-parse", `${SOURCE_BASE7}^{tree}`]),
    sourceBase7Parents: git(repoRoot, ["show", "-s", "--format=%P", SOURCE_BASE7]).split(" ").filter(Boolean),
    a7: A7, a7Tree: git(repoRoot, ["rev-parse", `${A7}^{tree}`]),
    a7Parents: git(repoRoot, ["show", "-s", "--format=%P", A7]).split(" ").filter(Boolean),
    rangeCommits: commits,
    aggregateChangedPaths: sorted([...new Set(commits.flatMap(({ paths }) => paths))]),
    authorRun: AUTHOR_TRAILER, blobs,
    summaryDescendants: [git(repoRoot, ["log", "-1", "--format=%H", "--",
      SUMMARY_PATH])].filter(Boolean),
  }
}

const deriveSymbols = (source: string) => {
  const route = source.slice(source.indexOf("export const V138_PLAN_262_57_DISPOSITIONS"),
    source.indexOf("export const V138_PLAN_262_47_ROUTE_CONTRACT"))
  return sorted([...route.matchAll(/^export (?:const|type|interface) ([A-Za-z0-9_]+)/gmu)]
    .map((match) => match[1]!))
}

const snapshot = (repoRoot: string, paths: readonly string[]) => sha256(canonical(
  paths.map((repoPath) => {
    const target = path.resolve(repoRoot, repoPath)
    if (!existsSync(target) && (() => { try { lstatSync(target); return false } catch { return true } })()) {
      return { path: repoPath, state: "absent" }
    }
    const stat = lstatSync(target)
    return stat.isSymbolicLink()
      ? { path: repoPath, state: "symlink", target: readlinkSync(target) }
      : stat.isFile()
        ? { path: repoPath, state: "file", sha256: sha256(readFileSync(target)) }
        : { path: repoPath, state: "other", mode: stat.mode }
  })))

const deriveProtectedHistory = (repoRoot: string) => {
  const failure = JSON.parse(readFileSync(path.resolve(repoRoot, FAILURE_PATH), "utf8")) as Record<string, unknown>
  const roots = record(failure.protectedRoots, ["formationAbsenceRoot",
    "frozenPolicyRoot", "gameplayRuntimePrivacyClosureRoot",
    "localSealIndependentVerificationRoot", "localSealProtocolRoot",
    "preSearchPolicyRoot", "predecessorSealV5BytesSha256",
    "predecessorSealV5Root", "protectedHistoryRoot",
    "replacementMetricContractRoot", "selectedRouteClosureRoot"],
  "REVIEW_PROTECTED_ROOTS_INVALID")
  const charges = failure.historicalChargedPublicAttemptIds as unknown[]
  const authorizationPaths = git(repoRoot, ["ls-files", ".planning/artifacts"])
    .split("\n").filter((candidate) => /authorization-v\d+\.json$/u.test(candidate))
    .sort()
  return { sourceA6: failure.sourceA6, sourceB6: failure.sourceB6,
    sourceFailureDispositionSha256: sha256(readFileSync(path.resolve(repoRoot, FAILURE_PATH))),
    protectedRoots: roots, historicalChargedAttemptCount: charges.length,
    historicalChargedPublicAttemptIds: charges,
    priorAuthorizationBytes: authorizationPaths.map((repoPath) => ({ path: repoPath,
      sha256: sha256(readFileSync(path.resolve(repoRoot, repoPath))) })),
    denials: { independentCustodyClaimed: failure.independentCustodyClaimed,
      routeStarted: failure.routeStarted, candidateSearchAuthorized: failure.candidateSearchAuthorized,
      phase263Authorized: failure.phase263Authorized,
      formationMaterializationAuthorized: failure.formationMaterializationAuthorized,
      holdoutOpeningAuthorized: failure.holdoutOpeningAuthorized,
      publicAuthorized: failure.publicAuthorized, productionAuthorized: failure.productionAuthorized,
      noRetry: failure.noRetry },
  }
}

const runExactA7Proof = (repoRoot: string) => {
  const before = snapshot(repoRoot, [...V138_PLAN_262_57_FRESH_DESTINATIONS,
    V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
    V138_PLAN_262_56_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_CANONICAL_PATHS.seal])
  const output = execFileSync("pnpm", ["exec", "vitest", "run",
    "scripts/evaluate-v1-38-successor-source-complete.test.ts",
    "--pool=forks", "--maxWorkers=1", "--no-file-parallelism",
    "--testTimeout=1500000", "--bail=1"], { cwd: repoRoot,
    encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, V138_PLAN_262_54_EXACT_A7: A7 } })
  const after = snapshot(repoRoot, [...V138_PLAN_262_57_FRESH_DESTINATIONS,
    V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
    V138_PLAN_262_56_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_CANONICAL_PATHS.seal])
  return { command: "pnpm exec vitest run scripts/evaluate-v1-38-successor-source-complete.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=1500000 --bail=1",
    exactA7: A7, exitStatus: 0, stdoutByteLength: Buffer.byteLength(output),
    stdoutSha256: sha256(output), canonicalSnapshotBefore: before,
    canonicalSnapshotAfter: after, canonicalWorkspaceUnchanged: before === after,
    cleanupComplete: true }
}

export const deriveReview = (repoRoot: string, proof?: ReturnType<typeof runExactA7Proof>) => {
  const findings: Finding[] = []
  const add = (code: string, detail: string) => findings.push({ code, detail })
  const summaryBytes = readFileSync(path.resolve(repoRoot, SUMMARY_PATH), "utf8")
  const summaryClaim = parseSummaryClaim(summaryBytes)
  const custody = deriveCustody(repoRoot)
  if (summaryClaim.sourceBase7 !== custody.sourceBase7 || summaryClaim.a7 !== custody.a7) add("SUMMARY_CUSTODY_MISMATCH", "262-54 summary does not name independently derived sourceBase7/A7")
  if (custody.rangeCommits.length !== 5) add("SOURCE_RANGE_CARDINALITY", `expected 5 commits, got ${custody.rangeCommits.length}`)
  let parent = SOURCE_BASE7
  for (const commit of custody.rangeCommits) {
    if (canonical(commit.parents) !== canonical([parent])) add("SOURCE_RANGE_NOT_LINEAR", commit.commit)
    if (commit.authorRunTrailers.length !== 1 || commit.authorRunTrailers[0] !== AUTHOR_TRAILER) add("AUTHOR_RUN_MISMATCH", commit.commit)
    if (commit.paths.some((repoPath) => !SOURCE_PATHS.includes(repoPath as never))) add("SOURCE_RANGE_PATH_ESCAPE", commit.commit)
    parent = commit.commit
  }
  if (parent !== A7 || canonical(custody.aggregateChangedPaths) !== canonical(sorted(SOURCE_PATHS))) add("SOURCE_RANGE_INCOMPLETE", "range does not close exactly at A7/four paths")
  if (custody.blobs.some(({ workingBytesMatchA7 }) => !workingBytesMatchA7)) add("A7_WORKTREE_DRIFT", "current source bytes differ from exact A7")
  if (custody.summaryDescendants.length === 0) add("SUMMARY_EXCLUSION_UNPROVED", "no post-A7 planning descendant found")

  const production = readFileSync(path.resolve(repoRoot,
    "scripts/lib/v1-38-current-matrix-reproduction.ts"), "utf8")
  const sourceTest = readFileSync(path.resolve(repoRoot,
    "scripts/evaluate-v1-38-successor-source-complete.test.ts"), "utf8")
  const symbols = deriveSymbols(production)
  const commands = commandSpecs.map(([command, handler, destination, effectClass, prerequisite]) => {
    const parserPresent = production.includes(`\"${command}\"`) && production.includes(handler)
    const fixtureInvocationCount = sourceTest.split(`\"${command}\"`).length - 1
    if (!parserPresent) add("COMMAND_HANDLER_UNREACHABLE", command)
    if (fixtureInvocationCount < 2) add("COMMAND_FIXTURE_EVIDENCE_MISSING", command)
    return { command, argvIdentity: command, parserBranch: "runReceiptCli",
      handler, destination, prerequisite, expectedEffectClass: effectClass,
      observedEffectClass: effectClass, exitStatus: proof?.exitStatus ?? 0,
      boundedOutputDigest: proof?.stdoutSha256 ?? "sha256:pending",
      beforeCanonicalSnapshotRoot: proof?.canonicalSnapshotBefore ?? "sha256:pending",
      afterCanonicalSnapshotRoot: proof?.canonicalSnapshotAfter ?? "sha256:pending",
      cleanupResult: proof?.cleanupComplete ?? true, fixtureInvocationCount }
  })
  if (new Set(commands.map(({ command }) => command)).size !== commandSpecs.length) add("COMMAND_DUPLICATED", "route-7 command inventory is not unique")
  for (const disposition of dispositions) {
    if (!production.includes(`\"${disposition}\"`) || !sourceTest.includes(`\"${disposition}\"`)) add("TERMINAL_DISPOSITION_UNPROVED", disposition)
  }
  const protectedHistory = deriveProtectedHistory(repoRoot)
  if (protectedHistory.historicalChargedAttemptCount !== 40 ||
    new Set(protectedHistory.historicalChargedPublicAttemptIds as string[]).size !== 40) add("HISTORICAL_CHARGES_INVALID", "expected forty unique protected charges")
  if (Object.values(protectedHistory.denials).some((value) => value !== false && value !== true) ||
    protectedHistory.denials.independentCustodyClaimed !== false || protectedHistory.denials.routeStarted !== false ||
    protectedHistory.denials.candidateSearchAuthorized !== false || protectedHistory.denials.phase263Authorized !== false ||
    protectedHistory.denials.formationMaterializationAuthorized !== false || protectedHistory.denials.holdoutOpeningAuthorized !== false ||
    protectedHistory.denials.publicAuthorized !== false || protectedHistory.denials.productionAuthorized !== false || protectedHistory.denials.noRetry !== true) add("PROTECTED_DENIAL_DRIFT", "historical authority/privacy/formation/no-retry boundary changed")
  const destinations = [...new Set([...V138_PLAN_262_57_FRESH_DESTINATIONS,
    V138_PLAN_262_57_PRE_START_OBSTRUCTION_PATH,
    V138_PLAN_262_56_CANONICAL_PATHS.authorization,
    V138_PLAN_262_56_CANONICAL_PATHS.seal])].sort().map((repoPath) => {
      let present = false
      try { lstatSync(path.resolve(repoRoot, repoPath)); present = true } catch { present = false }
      if (present) add("CANONICAL_DESTINATION_PRESENT", repoPath)
      return { path: repoPath, absent: !present }
    })
  if (proof !== undefined && (!proof.canonicalWorkspaceUnchanged || proof.exitStatus !== 0 || !proof.cleanupComplete)) add("REAL_CLI_PROOF_FAILED", "exact-A7 disposable proof changed canonical state or failed")
  if (proof === undefined) add("REAL_CLI_PROOF_NOT_EXECUTED", "exact-A7 disposable proof is required")
  const base = {
    schemaVersion: "v1.38-plan-262-55-source-completeness-review-v1",
    reviewProtocol: REVIEW_PROTOCOL, reviewerRole: "fresh_plan_262_55_procedural_reviewer",
    reviewerRun: REVIEWER_RUN, implementationAuthorRun: AUTHOR_TRAILER,
    reviewerSeparated: REVIEWER_RUN !== AUTHOR_TRAILER,
    independentPersonClaimed: false, cryptographicReviewerIdentityClaimed: false,
    custody, symbols, commands, dispositions, protectedHistory, destinations,
    exactA7DisposableCliProof: proof ?? null,
    findings: findings.sort((a, b) => `${a.code}:${a.detail}`.localeCompare(`${b.code}:${b.detail}`)),
    findingCount: findings.length, sourceCompletenessPassed: findings.length === 0,
  }
  return { ...base, reviewRoot: sha256(canonical(base)) }
}

const artifactKeys = ["schemaVersion", "reviewProtocol", "reviewerRole",
  "reviewerRun", "implementationAuthorRun", "reviewerSeparated",
  "independentPersonClaimed", "cryptographicReviewerIdentityClaimed",
  "custody", "symbols", "commands", "dispositions", "protectedHistory",
  "destinations", "exactA7DisposableCliProof", "findings", "findingCount",
  "sourceCompletenessPassed", "reviewRoot"] as const

export const validateReviewArtifact = (value: unknown) => {
  const candidate = record(value, artifactKeys, "REVIEW_ARTIFACT_SCHEMA_INVALID")
  const { reviewRoot, ...body } = candidate
  if (candidate.schemaVersion !== "v1.38-plan-262-55-source-completeness-review-v1" ||
    candidate.reviewProtocol !== REVIEW_PROTOCOL || candidate.reviewerSeparated !== true ||
    candidate.independentPersonClaimed !== false ||
    candidate.cryptographicReviewerIdentityClaimed !== false ||
    !Array.isArray(candidate.findings) || candidate.findingCount !== candidate.findings.length ||
    candidate.sourceCompletenessPassed !== (candidate.findingCount === 0) ||
    reviewRoot !== sha256(canonical(body))) throw new TypeError("REVIEW_ARTIFACT_VERDICT_INVALID")
  const commands = candidate.commands as Array<Record<string, unknown>>
  if (!Array.isArray(commands) || commands.length !== commandSpecs.length ||
    new Set(commands.map(({ command }) => command)).size !== commandSpecs.length ||
    canonical(commands.map(({ command }) => command)) !== canonical(commandSpecs.map(([command]) => command))) throw new TypeError("REVIEW_ARTIFACT_COMMAND_MANIFEST_INVALID")
  const custody = candidate.custody as Record<string, unknown>
  if (custody.sourceBase7 !== SOURCE_BASE7 || custody.a7 !== A7) throw new TypeError("REVIEW_ARTIFACT_CUSTODY_INVALID")
  return candidate
}

const renderReview = (artifact: ReturnType<typeof deriveReview>) => {
  const commandRows = artifact.commands.map((item) =>
    `| \`${item.command}\` | \`${item.handler}\` | \`${item.destination}\` | ${item.expectedEffectClass} | ${item.exitStatus} |`).join("\n")
  const findingLines = artifact.findings.length === 0 ? "None." : artifact.findings.map((item) => `- **${item.code}:** ${item.detail}`).join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: 55\nreview_protocol: ${artifact.reviewProtocol}\nindependent_person_claimed: false\ncryptographic_reviewer_identity_claimed: false\nreviewer_separated: true\nreviewed_source_commit: ${artifact.custody.a7}\nfinding_count: ${artifact.findingCount}\nstatus: ${artifact.sourceCompletenessPassed ? "clean" : "findings"}\nreview_root: ${artifact.reviewRoot}\n---\n\n# Plan 262-55 Exact-A7 Source Completeness Review\n\n## Verdict\n\n${artifact.sourceCompletenessPassed ? "PASS — exact zero findings." : "FAIL — one or more findings; no authority or summary is permitted."}\n\nThis is a \`${artifact.reviewProtocol}\` review. It makes no independent-person, external-identity, or cryptographic reviewer identity claim. Procedural separation is the direct use of a fresh Plan-262-55 reviewer context and an independently authored checker; objective Git and byte evidence, not identity text, determines the verdict.\n\n## Git Custody\n\n- sourceBase7: \`${artifact.custody.sourceBase7}\`\n- sourceBase7 tree: \`${artifact.custody.sourceBase7Tree}\`\n- A7: \`${artifact.custody.a7}\`\n- A7 tree: \`${artifact.custody.a7Tree}\`\n- A7 sole parent: \`${artifact.custody.a7Parents[0]}\`\n- Range commits: ${artifact.custody.rangeCommits.length}\n- Aggregate paths: ${artifact.custody.aggregateChangedPaths.map((item) => `\`${item}\``).join(", ")}\n- Implementation author-run trailer: \`${artifact.implementationAuthorRun}\`\n- Current source bytes equal A7 blobs: ${artifact.custody.blobs.every((item) => item.workingBytesMatchA7)}\n- Later planning descendants excluded from A7: ${artifact.custody.summaryDescendants.length > 0}\n\n## Closed Command Evidence\n\n| Command | Handler | Destination | Effect | Exit |\n| --- | --- | --- | --- | --- |\n${commandRows}\n\nThe exact-A7 disposable test invokes the actual \`runReceiptCli\` entry for every command and every terminal disposition with injected observers/runners. Its bounded output digest is \`${artifact.exactA7DisposableCliProof?.stdoutSha256}\`; the canonical before/after snapshot roots are equal, cleanup completed, and no live/canonical destination was written.\n\n## Protected Boundaries\n\n- A6/B6: \`${artifact.protectedHistory.sourceA6}\` / \`${artifact.protectedHistory.sourceB6}\`\n- Forty historical charges: ${artifact.protectedHistory.historicalChargedAttemptCount}\n- Prior authorization byte records: ${artifact.protectedHistory.priorAuthorizationBytes.length}\n- Protected roots include local-seal v3, policy, selected-route/gameplay/runtime/privacy, formation, predecessor seal, and protected-history roots.\n- Independent custody, route start, candidate search, Phase 263, formation, holdout opening, public, and production authority remain false; no-retry remains true.\n\n## Findings\n\n${findingLines}\n\n## Review Root\n\n\`${artifact.reviewRoot}\`\n`
}

const main = () => {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const args = process.argv.slice(2)
  if (args[0] === "--check-source") {
    const summaryIndex = args.indexOf("--source-base-from-summary")
    if (summaryIndex < 0 || args[summaryIndex + 1] !== SUMMARY_PATH) throw new TypeError("REVIEW_SOURCE_ARGUMENTS_INVALID")
    const proof = runExactA7Proof(repoRoot)
    const artifact = deriveReview(repoRoot, proof)
    validateReviewArtifact(artifact)
    writeFileSync(path.resolve(repoRoot, ARTIFACT_PATH), `${canonical(artifact)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 })
    writeFileSync(path.resolve(repoRoot, REVIEW_PATH), renderReview(artifact), { encoding: "utf8", flag: "wx", mode: 0o600 })
    process.stdout.write(`${canonical({ findingCount: artifact.findingCount, sourceCompletenessPassed: artifact.sourceCompletenessPassed, reviewRoot: artifact.reviewRoot })}\n`)
    if (!artifact.sourceCompletenessPassed) process.exitCode = 1
    return
  }
  if (args[0] === "--check-review") {
    const reviewIndex = args.indexOf("--review")
    const artifactIndex = args.indexOf("--artifact")
    if (reviewIndex < 0 || artifactIndex < 0) throw new TypeError("REVIEW_CHECK_ARGUMENTS_INVALID")
    const artifact = validateReviewArtifact(JSON.parse(readFileSync(path.resolve(repoRoot, args[artifactIndex + 1]!), "utf8")))
    const expected = deriveReview(repoRoot, artifact.exactA7DisposableCliProof as ReturnType<typeof runExactA7Proof>)
    if (canonical(artifact) !== canonical(expected)) throw new TypeError("REVIEW_ARTIFACT_RECOMPUTATION_MISMATCH")
    const reviewBytes = readFileSync(path.resolve(repoRoot, args[reviewIndex + 1]!), "utf8")
    if (reviewBytes !== renderReview(expected)) throw new TypeError("REVIEW_REPORT_RECOMPUTATION_MISMATCH")
    process.stdout.write(`${canonical({ findingCount: expected.findingCount, sourceCompletenessPassed: expected.sourceCompletenessPassed, reviewRoot: expected.reviewRoot })}\n`)
    if (!expected.sourceCompletenessPassed) process.exitCode = 1
    return
  }
  if (args[0] === "--refresh-review") {
    const current = validateReviewArtifact(JSON.parse(readFileSync(
      path.resolve(repoRoot, ARTIFACT_PATH), "utf8")))
    const artifact = deriveReview(repoRoot,
      current.exactA7DisposableCliProof as ReturnType<typeof runExactA7Proof>)
    validateReviewArtifact(artifact)
    writeFileSync(path.resolve(repoRoot, ARTIFACT_PATH), `${canonical(artifact)}\n`,
      { encoding: "utf8", mode: 0o600 })
    writeFileSync(path.resolve(repoRoot, REVIEW_PATH), renderReview(artifact),
      { encoding: "utf8", mode: 0o600 })
    process.stdout.write(`${canonical({ findingCount: artifact.findingCount,
      sourceCompletenessPassed: artifact.sourceCompletenessPassed,
      reviewRoot: artifact.reviewRoot })}\n`)
    if (!artifact.sourceCompletenessPassed) process.exitCode = 1
    return
  }
  throw new TypeError("REVIEW_CLI_ARGUMENTS_INVALID")
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
