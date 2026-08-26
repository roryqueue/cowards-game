#!/usr/bin/env -S pnpm exec tsx
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  V138_ROUTE_8_COMMANDS,
  V138_ROUTE_8_CONTRACT,
  V138_ROUTE_8_DESTINATIONS,
} from "./lib/v1-38-route-8-source.js"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`

export const V138_PLAN_262_70_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-70-route-8-source-review-v1.json"
export const V138_PLAN_262_70_REPORT_PATH =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-70-REVIEW.md"
export const V138_PLAN_262_70_SOURCE_PATHS = Object.freeze([
  "scripts/check-v1-38-plan-262-69-route-8-source.test.ts",
  "scripts/check-v1-38-plan-262-69-route-8-source.ts",
  "scripts/lib/v1-38-route-8-source.ts",
] as const)

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const REQUIREMENT_IDS = Object.freeze([
  "ADMIT-01", "ADMIT-02", "ADMIT-03", "ADMIT-04",
  "MEAS-01", "MEAS-02", "MEAS-03", "MEAS-04", "MEAS-05", "MEAS-06",
  "MEAS-07", "MEAS-08", "MEAS-09", "MEAS-10", "SEAL-01", "DECI-02",
] as const)
const DECISION_IDS = Object.freeze([
  "D-01", "D-02", "D-03", "D-04", "D-05", "D-06", "D-07", "D-08",
  "D-09", "D-10", "D-11", "D-12", "D-13", "D-14", "D-15", "D-16",
  "D-17", "D-18", "D-19R", "D-20R", "D-21", "D-22",
] as const)
const ARCHIVES = Object.freeze([
  [`${PHASE_DIR}/archived/262-48-ROUTE-V9-HISTORICAL.md`,
    "d531e64db2be1d804248f390c1cda215f3d237cdc58d40498e057bf2dc5c32f0"],
  [`${PHASE_DIR}/archived/262-48-HISTORICAL.md`,
    "8ac51a38c5b73d901dde595ed315bf497a42ce243513e056e3a67b22c37dd3d1"],
  [`${PHASE_DIR}/archived/262-56-HISTORICAL.md`,
    "18f7cb76e397958918eca1c9ae8abb758b17a34a0b44f1201969b35e603a64cb"],
  [`${PHASE_DIR}/archived/262-57-HISTORICAL.md`,
    "d17e7df7f22a2457739a123203e358d30d9b7da5631eb2dfdb2d9cf2d310fe1e"],
  [`${PHASE_DIR}/archived/262-62-HISTORICAL.md`,
    "438e139b6710c482b668514091968ee3a31ea575f2d0d002ec0c11473fdbc07a"],
] as const)
const CANONICAL_PATHS = Object.freeze([
  V138_PLAN_262_70_REVIEW_PATH,
  V138_PLAN_262_70_REPORT_PATH,
  ...V138_ROUTE_8_DESTINATIONS.filter(item => item !== V138_PLAN_262_70_REVIEW_PATH),
])
const OBSERVATION_IDS = Object.freeze([
  "static-capability-inventory", "authority-seal-topology", "pre-start-obstruction",
  "route-start-exclusive", "calibration-charge-before-child",
  "reproduction-charge-before-child", "post-start-terminal-no-resume",
  "authoritative-56-plan-topology", "validation-normalization",
  "post-validation-binder", "automatic-root-selection", "single-sentinel-driver",
  "verifier-report-authentication", "temporary-cleanup", "pass-only-summary",
  "obstruction-gaps-phase263-denial", "malformed-input-denial",
  "canonical-kernel-runtime-delegation",
] as const)

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (value: string | Uint8Array): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonicalize = (value: Json): Json => Array.isArray(value)
  ? value.map(canonicalize)
  : value !== null && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).sort(([left], [right]) =>
      left.localeCompare(right)).map(([key, child]) => [key, canonicalize(child)]))
    : value
const canonical = (value: unknown): string => `${JSON.stringify(canonicalize(value as Json))}\n`
const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child)
    Object.freeze(value)
  }
  return value as Readonly<T>
}
const git = (root: string, args: readonly string[], encoding: BufferEncoding = "utf8") =>
  execFileSync("git", [...args], { cwd: root, encoding }).trim()
const lines = (value: string): string[] => value.split("\n").map(item => item.trim()).filter(Boolean)
const safeType = (file: string): "absent" | "regular" | "unsafe" => {
  try {
    const stat = lstatSync(file)
    return stat.isFile() && !stat.isSymbolicLink() ? "regular" : "unsafe"
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "absent"
    throw error
  }
}
const read = (root: string, repoPath: string): string => {
  const file = path.resolve(root, repoPath)
  if (file !== root && !file.startsWith(`${root}${path.sep}`)) fail("V138_PLAN_262_70_PATH_ESCAPE")
  if (safeType(file) !== "regular") fail("V138_PLAN_262_70_FILE_INVALID")
  return readFileSync(file, "utf8")
}
const changedPaths = (root: string, commit: string): string[] =>
  lines(git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit])).sort()

const rootForLine = (domain: string, id: string, line: string): Sha256 =>
  sha256(`${domain}\0${id}\0${line.trim()}\n`)
const exactPolicyLines = (bytes: string, ids: readonly string[], domain: string) => ids.map(id => {
  const matches = bytes.split("\n").filter(line => line.includes(`**${id}:**`) || line.includes(`**${id}**:`))
  if (matches.length !== 1) fail("V138_PLAN_262_70_POLICY_INVENTORY_INVALID")
  return Object.freeze({ id, root: rootForLine(domain, id, matches[0]!) })
})

const sourceCustody = (root: string) => {
  const actualRoot = realpathSync(git(root, ["rev-parse", "--show-toplevel"]))
  if (actualRoot !== realpathSync(root)) fail("V138_PLAN_262_70_REPOSITORY_ROOT_INVALID")
  const commits = lines(git(root, ["log", "--reverse", "--format=%H", "--",
    ...V138_PLAN_262_70_SOURCE_PATHS]))
  if (commits.length === 0) fail("V138_PLAN_262_70_SOURCE_CUSTODY_INVALID")
  const commit = commits.at(-1)!
  const first = commits[0]!
  const base = git(root, ["rev-parse", `${first}^`])
  const [tree, parents] = git(root, ["show", "-s", "--format=%T%n%P", commit]).split("\n")
  const parentList = lines(parents ?? "")
  if (!tree || parentList.length !== 1) fail("V138_PLAN_262_70_SOURCE_CUSTODY_INVALID")
  const aggregatePaths = lines(git(root, ["diff", "--name-only", base, commit, "--",
    ...V138_PLAN_262_70_SOURCE_PATHS])).sort()
  if (canonical(aggregatePaths) !== canonical([...V138_PLAN_262_70_SOURCE_PATHS]))
    fail("V138_PLAN_262_70_SOURCE_SCOPE_INVALID")
  const blobs = V138_PLAN_262_70_SOURCE_PATHS.map(repoPath => {
    const tuple = git(root, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
    const mode = tuple[0]
    const blob = tuple[2]
    if (mode !== "100644" || !blob || !/^[0-9a-f]{40}$/u.test(blob))
      fail("V138_PLAN_262_70_SOURCE_BLOB_INVALID")
    const bytes = execFileSync("git", ["show", `${commit}:${repoPath}`], { cwd: root })
    const working = readFileSync(path.resolve(root, repoPath))
    if (!bytes.equals(working)) fail("V138_PLAN_262_70_SOURCE_WORKTREE_DRIFT")
    return Object.freeze({ path: repoPath, mode, blob, sha256: sha256(bytes),
      byteLength: bytes.length })
  })
  const rangeCommits = lines(git(root, ["rev-list", "--reverse", `${base}..${commit}`, "--first-parent"]))
  if (rangeCommits.length === 0 || rangeCommits.some(item => !commits.includes(item)))
    fail("V138_PLAN_262_70_SOURCE_RUN_INVALID")
  return deepFreeze({ base, commit, tree, parent: parentList[0]!, commits: rangeCommits,
    paths: [...V138_PLAN_262_70_SOURCE_PATHS], blobs })
}

const requireTokens = (bytes: string, tokens: readonly string[], code: string): void => {
  if (tokens.some(token => !bytes.includes(token))) fail(code)
}

export const inspectV138Plan26270SourceBytes = (bytes: string): true => {
  const expectedCommit = git(repoRoot, ["rev-list", "-1", "HEAD", "--",
    "scripts/lib/v1-38-route-8-source.ts"])
  const expected = execFileSync("git", ["show",
    `${expectedCommit}:scripts/lib/v1-38-route-8-source.ts`], { cwd: repoRoot })
  if (sha256(bytes) !== sha256(expected) || /formationMaterializationAuthorized\s*=\s*true/u.test(bytes) ||
    bytes.includes("Math.random") || bytes.includes("Date.now") || bytes.includes("node:vm"))
    fail("V138_PLAN_262_70_SOURCE_BOUNDARY_INVALID")
  return true
}

const inspectStaticSurface = (root: string) => {
  const route = read(root, "scripts/lib/v1-38-route-8-source.ts")
  const checker = read(root, "scripts/check-v1-38-plan-262-69-route-8-source.ts")
  const test = read(root, "scripts/check-v1-38-plan-262-69-route-8-source.test.ts")
  const matrix = read(root, "scripts/lib/v1-38-current-matrix-reproduction.ts")
  const seal = read(root, "scripts/lib/v1-38-successor-source-seal.ts")
  inspectV138Plan26270SourceBytes(route)
  requireTokens(route, ["routeOrdinal: 8", "executionContextVersion: 13",
    "preflightVersion: 13", "calibrationVersion: 13", "reproductionVersion: 14",
    "samplingMilliseconds: 200", "minimumEffectiveAvailableBasisPoints: 2500",
    "calibrationAttempts: 8", "calibrationShards: 4",
    "conditionalReproductionCells: 540", "rulesAuthority: \"MATCH_KERNEL\"",
    "supervisedRuntimeOnly: true", "strategyExecutionInWebApiGo: false",
    "formationMaterialization: false", "privateEvidenceOnly: true",
    "directChild: true", "canonicalArtifactCount: 2",
    "pre_start_obstruction_xor_consumed_route_terminal",
    "exact_540_of_540_and_reduced_assurance_local_seal",
    "V138_ROUTE8_PATH_UNSAFE", "V138_ROUTE8_DESTINATION_PRESENT",
    "O_EXCL", "O_NOFOLLOW"], "V138_PLAN_262_70_ROUTE_SOURCE_INCOMPLETE")
  requireTokens(checker, ["trustworthy_summaries\":50".replace("\\\"", "\""),
    "total_plans\":56".replace("\\\"", "\""),
    "normalizeV138PostValidation", "checkV138NormalizedPostValidation",
    "bindV138PostValidation", "checkV138PostValidationBinder",
    "runV138Plan26274Sentinel", "checkV138Plan26274Result", "requested !== \"auto\"",
    "262-74-SUMMARY.md", "262-74-BLOCKED.md", "finally { rmSync(temp"],
  "V138_PLAN_262_70_LIFECYCLE_SOURCE_INCOMPLETE")
  requireTokens(test, ["pre_start_obstruction", "stopped_terminal",
    "admitted_pending_reproduction", "V138_ROUTE8_PATH_UNSAFE", "freshAccepted: 539"],
  "V138_PLAN_262_70_TEST_SURFACE_INCOMPLETE")
  requireTokens(matrix, ["executePreparedRuntimeServiceRequestV118",
    "v1.18/v1.19/MATCH_KERNEL", "runV138SupervisedAssignments"],
  "V138_PLAN_262_70_RUNTIME_DELEGATION_INVALID")
  requireTokens(seal, ["runtimeRoute: \"v1.18/v1.19/MATCH_KERNEL\""],
  "V138_PLAN_262_70_KERNEL_DELEGATION_INVALID")
  for (const prohibited of ["executePreparedRuntimeServiceRequestV118",
    "writeV138AuthoritativeMatrixV12Receipt"])
    if (new RegExp(`\\b${prohibited}\\s*\\(`, "u").test(route) ||
      new RegExp(`\\b${prohibited}\\s*\\(`, "u").test(checker))
      fail("V138_PLAN_262_70_CAPABILITY_OVERREACH")
  if (/from\s+["']node:vm["']|\bnew\s+Function\s*\(/u.test(`${route}\n${checker}`))
    fail("V138_PLAN_262_70_CAPABILITY_OVERREACH")
  const imports = [...`${route}\n${checker}`.matchAll(/from\s+["']([^"']+)["']/gu)]
    .map(match => match[1]!).sort()
  const permitted = imports.every(item => item.startsWith("node:") || item.startsWith("./"))
  if (!permitted) fail("V138_PLAN_262_70_IMPORT_BOUNDARY_INVALID")
  return deepFreeze({ imports, routeRoot: sha256(route), checkerRoot: sha256(checker),
    testRoot: sha256(test), currentMatrixRoot: sha256(matrix), successorSealRoot: sha256(seal) })
}

const runDetached = (root: string, sourceCommit: string) => {
  const owner = mkdtempSync(path.join(realpathSync(tmpdir()), "v138-plan26270-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  let checkerStdout = ""
  let noPublishStdout = ""
  try {
    execFileSync("git", ["clone", "--shared", "--no-checkout", root, clone],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    execFileSync("git", ["checkout", "--detach", sourceCommit],
      { cwd: clone, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    const physicalClone = realpathSync(clone)
    const tsx = path.resolve(root, "node_modules/.bin/tsx")
    checkerStdout = execFileSync(tsx,
      [path.join(physicalClone, "scripts/check-v1-38-plan-262-69-route-8-source.ts"), "--check"],
      { cwd: physicalClone, encoding: "utf8", env: { ...process.env, LC_ALL: "C", LANG: "C" } }).trim()
    const check = JSON.parse(checkerStdout) as Record<string, unknown>
    if (check.status !== "passed" || check.sourceOnly !== true || check.authority !== false)
      fail("V138_PLAN_262_70_DETACHED_CHECK_INVALID")
    const reviewFile = path.resolve(physicalClone, V138_PLAN_262_70_REVIEW_PATH)
    writeFileSync(reviewFile, canonical({ reviewRoot: `sha256:${"7".repeat(64)}` }),
      { flag: "wx", mode: 0o600 })
    noPublishStdout = execFileSync(tsx,
      [path.join(physicalClone, "scripts/lib/v1-38-route-8-source.ts"),
        "--derive-authority-seal-no-publish"],
      { cwd: physicalClone, encoding: "utf8", env: { ...process.env, LC_ALL: "C", LANG: "C" } }).trim()
    const noPublish = JSON.parse(noPublishStdout) as Record<string, unknown>
    if (noPublish.authority !== "route_eligible_not_started" ||
      typeof noPublish.authorizationRoot !== "string" || typeof noPublish.sealRoot !== "string")
      fail("V138_PLAN_262_70_DETACHED_NO_PUBLISH_INVALID")
    for (const destination of V138_ROUTE_8_DESTINATIONS.filter(item =>
      item !== V138_PLAN_262_70_REVIEW_PATH))
      if (existsSync(path.resolve(physicalClone, destination)))
        fail("V138_PLAN_262_70_DETACHED_CANONICAL_WRITE")
    return deepFreeze({ sourceCommit, checkerOutputRoot: sha256(`${checkerStdout}\n`),
      noPublishOutputRoot: sha256(`${noPublishStdout}\n`), cleanupComplete: true,
      cleanupPath: ".review-owned-disposable-removed", canonicalWrites: 0,
      physicalCloneRootClaimed: false })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

export const snapshotV138Plan26270CanonicalDestinations = (root: string) =>
  CANONICAL_PATHS.map(repoPath => Object.freeze({ path: repoPath,
    type: safeType(path.resolve(root, repoPath)),
    ...(safeType(path.resolve(root, repoPath)) === "regular"
      ? { root: sha256(readFileSync(path.resolve(root, repoPath))) } : {}) }))

const observation = (id: typeof OBSERVATION_IDS[number], details: unknown) =>
  Object.freeze({ id, passed: true, detailRoot: sha256(`${id}\0${canonical(details)}`) })

const reviewBody = (root: string) => {
  const custody = sourceCustody(root)
  const staticSurface = inspectStaticSurface(root)
  const detachedExecution = runDetached(root, custody.commit)
  const requirements = exactPolicyLines(read(root, ".planning/REQUIREMENTS.md"),
    REQUIREMENT_IDS, "v138-plan26270-requirement")
  const decisions = exactPolicyLines(read(root, `${PHASE_DIR}/262-CONTEXT.md`),
    DECISION_IDS, "v138-plan26270-decision")
  const archives = ARCHIVES.map(([repoPath, expected]) => {
    const actual = sha256(readFileSync(path.resolve(root, repoPath)))
    if (actual !== `sha256:${expected}`) fail("V138_PLAN_262_70_ARCHIVE_CUSTODY_INVALID")
    return Object.freeze({ path: repoPath, sha256: actual })
  })
  const protocol = read(root, `${PHASE_DIR}/262-ROUTE8-EXECUTION-PROTOCOL.md`)
  requireTokens(protocol, ["Unfiltered `$gsd-execute-phase 262` is prohibited",
    "--bind-post-validation", "--run-plan-262-74-sentinel"],
  "V138_PLAN_262_70_PROTOCOL_INVALID")
  const observations = OBSERVATION_IDS.map(id => observation(id, {
    custody: custody.commit, staticSurface, detachedExecution,
    commands: [...V138_ROUTE_8_COMMANDS], contract: V138_ROUTE_8_CONTRACT,
  }))
  const body = {
    schemaVersion: "v1.38-plan-262-70-route-8-source-review-v1",
    reviewProtocol: "fresh-route8-source-review-v1",
    reviewedSource: custody,
    contract: V138_ROUTE_8_CONTRACT,
    staticSurface,
    detachedExecution,
    protectedHistory: { historicalCharges: 40, retiredRouteOrdinals: [1, 2, 3, 4, 5, 6, 7],
      archives, priorAuthorizationBytesPreserved: true },
    requirementRoots: requirements,
    decisionRoots: decisions,
    observations,
    findings: [] as Array<{ code: string; detail: string }>,
    findingCount: 0,
    sourceReviewPassed: true,
    identityClaims: { independentPersonClaimed: false, reviewerSeparated: false,
      externalIdentityClaimed: false, cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false },
    authority: { plan26271Eligible: true, authorizationCreated: false,
      sealCreated: false, routeStarted: false, admit03Status: "blocked", freshAccepted: 0,
      requiredAccepted: 540, phase263Authorized: false, candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false, holdoutOpeningAuthorized: false,
      publicAuthorized: false, productionAuthorized: false, liveAuthorized: false },
  }
  return body
}

export const computeV138Plan26270ReviewRoot = (candidate: unknown): Sha256 => {
  const body = structuredClone(candidate) as Record<string, unknown>
  delete body.reviewRoot
  return sha256(`v138-plan26270-route8-source-review\0${canonical(body)}`)
}

export const deriveV138Plan26270NoPublish = async (root = repoRoot) => {
  const body = reviewBody(realpathSync(root))
  return deepFreeze({ ...body, reviewRoot: computeV138Plan26270ReviewRoot(body) })
}

export const validateV138Plan26270Review = (candidate: unknown, expected: unknown): true => {
  const value = candidate as Record<string, unknown>
  if (value === null || typeof value !== "object" || Array.isArray(value) ||
    value.reviewRoot !== computeV138Plan26270ReviewRoot(value) || canonical(value) !== canonical(expected))
    fail("V138_PLAN_262_70_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26270ReviewReport = (review: any): string => {
  const verdict = review.findingCount === 0 && review.sourceReviewPassed === true
    ? "PASS — exact zero findings" : "FAIL — findings block publication"
  const observations = review.observations.map((item: { id: string; detailRoot: string }) =>
    `| ${item.id} | passed | \`${item.detailRoot}\` |`).join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "70"\nreview_protocol: ${review.reviewProtocol}\nreviewed_source_commit: ${review.reviewedSource.commit}\nfinding_count: ${review.findingCount}\nsource_review_passed: ${review.sourceReviewPassed}\nreview_root: ${review.reviewRoot}\nstatus: ${review.sourceReviewPassed ? "clean" : "findings"}\n---\n\n# Phase 262 Plan 70: Route-8 Source Review\n\n## Verdict\n\n**${verdict}.** This is a non-authorizing source review. It creates no authorization, seal, route, Matrix, activation, candidate, formation, holdout, public, production, or live capability.\n\n## Git Custody\n\n- Source base: \`${review.reviewedSource.base}\`\n- Source commit: \`${review.reviewedSource.commit}\`\n- Source tree: \`${review.reviewedSource.tree}\`\n- Sole parent: \`${review.reviewedSource.parent}\`\n- Exact paths: ${review.reviewedSource.paths.map((item: string) => `\`${item}\``).join(", ")}\n\n## Observations\n\n| Observation | Status | Detail root |\n|---|---|---|\n${observations}\n\n## Findings\n\n${review.findings.length === 0 ? "None." : review.findings.map((item: any) => `- ${item.code}: ${item.detail}`).join("\n")}\n\n## Claim Boundary\n\nIndependent person, reviewer separation, external identity, cryptographic reviewer identity, and independent custody are all unclaimed. ADMIT-03 remains blocked at 0/540; Phase 263 and every downstream/live capability remain unauthorized. Exact zero findings make only Plan 262-71 eligible.\n\n## Review Root\n\n\`${review.reviewRoot}\`\n`
}

export const validateV138Plan26270ReviewPair = (candidate: any, report: string,
  expected: any): true => {
  if (candidate?.findingCount !== 0 || candidate?.sourceReviewPassed !== true ||
    candidate?.findings?.length !== 0) fail("V138_PLAN_262_70_REVIEW_FINDINGS")
  validateV138Plan26270Review(candidate, expected)
  if (report !== renderV138Plan26270ReviewReport(expected))
    fail("V138_PLAN_262_70_REPORT_MISMATCH")
  return true
}

const exclusiveWrite = (file: string, bytes: string): void => {
  if (safeType(file) !== "absent") fail("V138_PLAN_262_70_DESTINATION_PRESENT")
  const descriptor = openSync(file,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeFileSync(descriptor, bytes) } finally { closeSync(descriptor) }
}

const publishReview = async (root: string) => {
  const review = await deriveV138Plan26270NoPublish(root)
  if (review.findingCount !== 0 || !review.sourceReviewPassed)
    fail("V138_PLAN_262_70_REVIEW_FINDINGS")
  const report = renderV138Plan26270ReviewReport(review)
  const reviewPath = path.resolve(root, V138_PLAN_262_70_REVIEW_PATH)
  const reportPath = path.resolve(root, V138_PLAN_262_70_REPORT_PATH)
  exclusiveWrite(reviewPath, canonical(review))
  try { exclusiveWrite(reportPath, report) } catch (error) {
    rmSync(reviewPath)
    throw error
  }
  return review
}

const inspectCommittedPair = (root: string): void => {
  const commits = lines(git(root, ["log", "--format=%H", "--all", "--",
    V138_PLAN_262_70_REVIEW_PATH, V138_PLAN_262_70_REPORT_PATH]))
  if (commits.length !== 1) fail("V138_PLAN_262_70_PUBLICATION_LINEAGE_INVALID")
  const commit = commits[0]!
  if (canonical(changedPaths(root, commit)) !== canonical([
    V138_PLAN_262_70_REVIEW_PATH, V138_PLAN_262_70_REPORT_PATH].sort()))
    fail("V138_PLAN_262_70_PUBLICATION_LINEAGE_INVALID")
  const currentLineage = lines(git(root, ["rev-list", "--first-parent", "HEAD"]))
  if (!currentLineage.includes(commit)) fail("V138_PLAN_262_70_PUBLICATION_LINEAGE_INVALID")
  for (const repoPath of [V138_PLAN_262_70_REVIEW_PATH, V138_PLAN_262_70_REPORT_PATH]) {
    const committed = execFileSync("git", ["show", `${commit}:${repoPath}`], { cwd: root })
    if (!committed.equals(readFileSync(path.resolve(root, repoPath))) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath])).length !== 0)
      fail("V138_PLAN_262_70_PUBLICATION_LINEAGE_INVALID")
  }
}

const checkReview = async (root: string, reviewPath: string, reportPath: string) => {
  if (reviewPath !== V138_PLAN_262_70_REVIEW_PATH || reportPath !== V138_PLAN_262_70_REPORT_PATH)
    fail("V138_PLAN_262_70_PATH_INVALID")
  const expected = await deriveV138Plan26270NoPublish(root)
  let candidate: unknown
  try { candidate = JSON.parse(read(root, reviewPath)) } catch {
    fail("V138_PLAN_262_70_REVIEW_SCHEMA_INVALID")
  }
  validateV138Plan26270ReviewPair(candidate, read(root, reportPath), expected)
  inspectCommittedPair(root)
  return expected
}

const exactArgv = (actual: readonly string[], expected: readonly string[]): void => {
  if (canonical(actual) !== canonical(expected)) fail("V138_PLAN_262_70_ARGUMENTS_INVALID")
}
const main = async (): Promise<void> => {
  const argv = process.argv.slice(2)
  if (argv.length === 1 && argv[0] === "--derive-no-publish") {
    const review = await deriveV138Plan26270NoPublish(repoRoot)
    process.stdout.write(canonical({ findingCount: review.findingCount,
      sourceReviewPassed: review.sourceReviewPassed, reviewRoot: review.reviewRoot,
      plan26271Eligible: review.authority.plan26271Eligible, authorizesExecution: false }))
    return
  }
  if (argv.length === 1 && argv[0] === "--write-review") {
    const review = await publishReview(repoRoot)
    process.stdout.write(canonical({ findingCount: 0, sourceReviewPassed: true,
      reviewRoot: review.reviewRoot, authorizesExecution: false }))
    return
  }
  if (argv[0] === "--check-review") {
    exactArgv(argv, ["--check-review", "--review", V138_PLAN_262_70_REVIEW_PATH,
      "--report", V138_PLAN_262_70_REPORT_PATH])
    const review = await checkReview(repoRoot, argv[2]!, argv[4]!)
    process.stdout.write(canonical({ status: "passed", findingCount: 0,
      reviewRoot: review.reviewRoot, authorizesExecution: false }))
    return
  }
  fail("V138_PLAN_262_70_ARGUMENTS_INVALID")
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
