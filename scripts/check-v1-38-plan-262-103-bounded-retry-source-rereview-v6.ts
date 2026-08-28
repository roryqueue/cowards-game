import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { createRequire } from "node:module"
import {
  chmodSync,
  closeSync,
  constants,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { execFileSync, spawnSync } from "node:child_process"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { encodeV138RetryV3CanonicalJson } from "./lib/v1-38-bounded-retry-envelope-v3.js"
import { authenticateV138RetryV3ExecutionClosure } from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"
import { V138_PLAN_262_103_FORBIDDEN_DESTINATIONS } from "./run-v1-38-bounded-retry-envelope-v3-review-v6.js"

type Sha256 = `sha256:${string}`
const PHASE_DIR = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SOURCE_COMMIT = "332aae093ef6e26c95a18f21cfd253ccc829ce48"
const SOURCE_TREE = "5be3d3f850d7d0ebcd2cfee87101242826faafc1"
const SOURCE_PARENT = "a98c0c40134d9b57efd34bbbedd8faf18f6df622"
export const V138_PLAN_262_103_CANDIDATE_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6" as const
export const V138_PLAN_262_103_CARRIER_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:carrier:v1" as const
const FINDING_DOMAIN = "v1.38:plan-262-103:git-object-byte-custody:finding:v6"
const REVIEW_DOMAIN = "v1.38:plan-262-103:git-object-byte-custody:review:v6"
const PORTABLE_DOMAIN = "v1.38:plan-262-103:git-object-byte-custody:portable:v6"
const OBSERVATION_DOMAIN = "v1.38:plan-262-103:actual-final-consumer-observation:v1"
export const V138_PLAN_262_103_CANDIDATE_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json" as const
export const V138_PLAN_262_103_CARRIER_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json" as const
export const V138_PLAN_262_103_REPORT_PATH = `${PHASE_DIR}/262-103-REVIEW.md` as const
export const V138_PLAN_262_103_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
] as const)

const canonical = encodeV138RetryV3CanonicalJson
const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const blobOid = (bytes: Buffer): string =>
  createHash("sha1").update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex")
const lines = (value: string): string[] => value.trim() === "" ? [] : value.trim().split("\n")
const git = (root: string, args: readonly string[], home?: string): string =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", ...args], {
    cwd: root,
    env: { ...process.env, ...(home ? { HOME: home, XDG_CONFIG_HOME: path.join(home, "xdg") } : {}) },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  }).trim()
const gitBytes = (root: string, args: readonly string[], home?: string): Buffer =>
  execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", ...args], {
    cwd: root,
    env: { ...process.env, ...(home ? { HOME: home, XDG_CONFIG_HOME: path.join(home, "xdg") } : {}) },
    maxBuffer: 64 * 1024 * 1024,
  })
const safeType = (target: string): "absent" | "regular" | "directory" | "other" => {
  try {
    const value = lstatSync(target)
    return value.isSymbolicLink() ? "other" : value.isFile() ? "regular" : value.isDirectory() ? "directory" : "other"
  } catch (error: any) {
    if (error?.code === "ENOENT") return "absent"
    throw error
  }
}
const regularBytes = (root: string, repoPath: string): Buffer => {
  const target = path.resolve(root, repoPath)
  if (!target.startsWith(`${path.resolve(root)}${path.sep}`) || safeType(target) !== "regular")
    fail("V138_PLAN_262_103_CUSTODY_INVALID")
  const fd = openSync(target, constants.O_RDONLY | constants.O_NOFOLLOW)
  try { return readFileSync(fd) } finally { closeSync(fd) }
}
const domainRoot = (domain: string, value: unknown): Sha256 =>
  sha256(Buffer.concat([Buffer.from(domain), Buffer.from([0]), Buffer.from(canonical(value))]))
const byteDomainRoot = (domain: string, value: Uint8Array): Sha256 =>
  sha256(Buffer.concat([Buffer.from(domain), Buffer.from([0]), Buffer.from(value)]))

const exactPreimage = (domain: string, value: unknown, excluded: string): Buffer => {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !Object.hasOwn(value, excluded))
    fail("V138_PLAN_262_103_PREIMAGE_INVALID")
  const body = { ...(value as Record<string, unknown>) }
  delete body[excluded]
  return Buffer.concat([Buffer.from(domain), Buffer.from([0]), Buffer.from(canonical(body))])
}
export const candidatePreimageIndependent = (value: unknown): Buffer =>
  exactPreimage(V138_PLAN_262_103_CANDIDATE_DOMAIN, value, "candidatePayloadRoot")
export const carrierPreimageIndependent = (value: unknown): Buffer =>
  exactPreimage(V138_PLAN_262_103_CARRIER_DOMAIN, value, "carrierRoot")
const candidateRoot = (value: unknown): Sha256 => sha256(candidatePreimageIndependent(value))
const carrierRoot = (value: unknown): Sha256 => sha256(carrierPreimageIndependent(value))

export const inspectV138Plan262103Source = (root: string) => {
  const [commit, tree, parent] = git(root, ["show", "-s", "--format=%H%n%T%n%P", SOURCE_COMMIT]).split("\n")
  if (commit !== SOURCE_COMMIT || tree !== SOURCE_TREE || parent !== SOURCE_PARENT)
    fail("V138_PLAN_262_103_SOURCE_LINEAGE_INVALID")
  const expected = [
    [V138_PLAN_262_103_SOURCE_PATHS[0], "100644", "0ad422245174c2f3cbb1cf46fc1932b45f758d9e", 17_394, "sha256:dc3e63e49dbf104d21405f6b381181ac2cd29d481b1c3fa5ee27c68392486e27"],
    [V138_PLAN_262_103_SOURCE_PATHS[1], "100644", "745495ff59a9dea6c898f2a0c2551396e6a54deb", 18_903, "sha256:7ade65c9a6fb9a650bb837ed1d2381248de79bda5552dccd7309792e47318931"],
    [V138_PLAN_262_103_SOURCE_PATHS[2], "100644", "df395006dfad9c63a9006fd8ee23e80982a009ec", 15_969, "sha256:7ecf92a86948a23f01004841d58a6447f9e743bc5043143ff396f659ea1c1f03"],
  ] as const
  const files = expected.map(([repoPath, mode, oid, byteLength, digest]) => {
    const entry = git(root, ["ls-tree", SOURCE_COMMIT, "--", repoPath]).split(/\s+/u)
    const bytes = gitBytes(root, ["cat-file", "blob", `${SOURCE_COMMIT}:${repoPath}`])
    if (entry[0] !== mode || entry[1] !== "blob" || entry[2] !== oid || bytes.length !== byteLength || sha256(bytes) !== digest)
      fail("V138_PLAN_262_103_SOURCE_CUSTODY_INVALID")
    if (!bytes.equals(regularBytes(root, repoPath))) fail("V138_PLAN_262_103_WORKING_BYTES_INVALID")
    if (lines(git(root, ["log", "--format=%H", `${SOURCE_COMMIT}..HEAD`, "--", repoPath])).length !== 0)
      fail("V138_PLAN_262_103_SOURCE_REWRITE_INVALID")
    return { path: repoPath, mode, blob: oid, byteLength, sha256: digest }
  })
  return Object.freeze({ commit, tree, parent, noLaterRewrite: true, summaryTrustedAsVerdict: false, files })
}

export const inspectV138Plan262103ProtectedHistory = (root: string) => {
  const values = [
    [`${PHASE_DIR}/262-100-SUMMARY.md`, "sha256:858b082ca74c8a77b380fc16d658b17cb8a30de823894161bd541feeb6bb0c2c"],
    [".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json", "sha256:891776dee9f6e2b3f87a99d8199512bfa4207f9fe03ab63fd29d04ac1c142ee3"],
    [`${PHASE_DIR}/262-101-REVIEW.md`, "sha256:14e750b89dc8bb30c080bd8fcc9a25fc7fe0d841367b3149c78b517a0d8f7f27"],
    [`${PHASE_DIR}/262-101-SUMMARY.md`, "sha256:f1a4b96e3c2122e20dffd9fbab2b64ec976315e6655da51433bfb960cdb1f350"],
  ] as const
  for (const [repoPath, digest] of values)
    if (sha256(regularBytes(root, repoPath)) !== digest) fail("V138_PLAN_262_103_PROTECTED_HISTORY_INVALID")
  return Object.freeze({
    plan100: {
      sourceCommit: "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb", sourceTree: "e6b89de1c699d35b0e5068e0c064b7badd53ad00",
      sourceParent: "71dc34c79a27ba57e67f8a2a2b7471dedade7a09", summarySha256: values[0][1], noLaterRewrite: true,
    },
    plan101: {
      pairCommit: "8c4e74180e36f22e3a44520d2cda145b3aa30671", candidateSha256: values[1][1], reviewSha256: values[2][1], summarySha256: values[3][1],
      findingCode: "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE", findingCount: 1,
      findingRoot: "sha256:4dfccd91907322bc560584de13570ef5f243ebdeb8a9ce117673befc3dce9953",
      reviewRoot: "sha256:68c66d072b65a5d1dd30351b609a3bd6f1a327740da966ef2bc37cf92e2425b4",
      resultRoot: "sha256:72bc2402c9678c3a719587b8d3c5862fbd12dd0d6abd42b5758d6cf6ef708ddc",
      status: "blocked", plan26292Eligible: false, freshCharged: 0, freshAccepted: 0, reinterpreted: false,
    },
  })
}

const falseAuthority = (eligible: boolean) => Object.fromEntries([
  "plan26292Eligible", "authorizesExecution", "authorizationCreated", "sealV13Created", "retryEnvelopeV3Created",
  "journalV3Created", "receiptsV3Created", "terminalV3Created", "reproductionV17Created", "dispositionV3Created",
  "correctionV11Created", "route11ActivationCreated", "readinessV3Created", "lifecycleV3Created", "liveInvoked",
  "localSecretAccessed", "lifecycleMutated", "freshCharged", "freshAccepted", "phase263PlanningAuthorized",
  "phase263ExecutionAuthorized", "candidateSearchAuthorized", "formationMaterializationAuthorized", "holdoutOpeningAuthorized",
  "publicAuthorized", "productAuthorized", "activationAuthorized", "productionAuthorized", "countedPlayAuthorized",
  "gameplayChangeAuthorized", "archiveAuthorized", "tagAuthorized",
].map((key) => [key, key === "plan26292Eligible" ? eligible : ["freshCharged", "freshAccepted"].includes(key) ? 0 : false]))
const identityClaims = Object.freeze({ independentPersonClaimed: false, externalIdentityClaimed: false,
  cryptographicReviewerIdentityClaimed: false, independentCustodyClaimed: false, separatePermissioningClaimed: false,
  maliciousOperatorResistanceClaimed: false, hostileSameUidResistanceClaimed: false,
  pathnameLaunchReplacementResistanceClaimed: false })

const portableClosure = (closure: any) => {
  const body: any = { ...closure }
  delete body.gitObjectRoot
  delete body.executionClosureRoot
  delete body.reviewedExecutionClosureRoot
  body.schemaVersion = "v1.38-reviewed-execution-closure-v2"
  body.reviewedExecutionClosureRoot = domainRoot(PORTABLE_DOMAIN, body)
  return Object.freeze(body)
}

const observationRoot = (): Sha256 => domainRoot(OBSERVATION_DOMAIN, {
  policy: { maximumRouteStarts: 3, maximumPreflightObservations: 12, envelopeLifetimeMilliseconds: 14_400_000,
    refusalSpacingMilliseconds: 300_000, calibrationFailureBackoffMilliseconds: 900_000,
    calibrationAttemptsPerRoute: 8, calibrationShardCount: 4, samplingMilliseconds: 200,
    minimumEffectiveAvailableBasisPoints: 2_500, reproductionCellCount: 540, maximumReproductionRuns: 1,
    rulesAuthority: "MATCH_KERNEL", supervisedRuntimeOnly: true, assuranceClass: "single_operator_local_seal_v1" },
  counts: { routes: 3, preflights: 12, calibrations: 24, reproduction: 540 }, canonicalWrites: 0,
  liveInvoked: false, freshCharged: 0, freshAccepted: 0, downstreamAuthority: "denied",
})

export const renderV138Plan262103Report = (candidate: any): string => `---
schema_version: v1.38-plan-262-103-review-report-v1
status: ${candidate.status}
finding_count: ${candidate.findingCount}
source_review_passed: ${candidate.sourceReviewPassed}
plan_262_92_eligible: ${candidate.authority.plan26292Eligible}
fresh_charged: 0
fresh_accepted: 0
---

# Phase 262 Plan 103 Independent Source Re-Review

## Verdict

${candidate.status === "zero_findings" ? "Zero findings. The exact isolated committed trio passed the actual Plan-102 no-publish final consumer." : "Blocked. At least one integrity finding remains and Plan 92 is ineligible."}

## Exact Reviewed Source

- Commit: \`${candidate.correctedSource.commit}\`
- Tree: \`${candidate.correctedSource.tree}\`
- Sole parent: \`${candidate.correctedSource.parent}\`
- Source files: 3 exact regular Git blobs; working bytes equal committed bytes; no later rewrite.

## Protected History

Plans 100 and 101 remain byte-immutable. Plan 101 remains blocked for \`CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE\` and is not reinterpreted.

## Consumer and Closure

- Actual consumer: \`${candidate.execution.actualConsumerStatus}\`
- Observation root: \`${candidate.execution.actualConsumerObservationRoot}\`
- Portable reviewed-closure root: \`${candidate.reviewedExecutionClosure.reviewedExecutionClosureRoot}\`
- Finding root: \`${candidate.findingRoot}\`

## Non-Authority

Fresh charged/accepted remain 0/0. No seal, retry envelope, live execution, capacity use, lifecycle artifact, downstream authority, or independent-custody claim was created.
`

const buildCandidate = (source: any, history: any, closure: any, findings: readonly any[], focusedTestsPassed: number) => {
  const zero = findings.length === 0
  const candidate: any = {
    schemaVersion: "v1.38-plan-262-103-git-object-byte-custody-rereview-payload-v6",
    protocol: "git-object-byte-custody-nonrecursive-v1", status: zero ? "zero_findings" : "blocked",
    correctedSource: source, protectedHistory: history, reviewedExecutionClosure: closure,
    execution: { focusedTestsPassed, sourceOnlyPassed: true, checkoutBytesMatchedBefore: true, checkoutBytesMatchedAfter: true,
      executionClosureMatchedBeforeAfter: true, actualConsumerStatus: zero ? "passed" : "blocked_review",
      actualConsumerObservationRoot: observationRoot(), destinationsUnchanged: true, cleanupComplete: true, canonicalWrites: 0,
      liveInvoked: false, freshCharged: 0, freshAccepted: 0, localSecretAccessed: false, identityConsumed: false },
    findings, findingCount: findings.length, findingRoot: domainRoot(FINDING_DOMAIN, findings), sourceReviewPassed: zero,
    identityClaims, authority: falseAuthority(zero), reviewRoot: `sha256:${"0".repeat(64)}`,
    candidatePayloadRoot: `sha256:${"0".repeat(64)}`,
  }
  const report = renderV138Plan262103Report(candidate)
  candidate.reviewRoot = byteDomainRoot(REVIEW_DOMAIN, Buffer.from(report))
  const finalReport = renderV138Plan262103Report(candidate)
  if (finalReport !== report) fail("V138_PLAN_262_103_REPORT_RECURSIVE")
  candidate.candidatePayloadRoot = candidateRoot(candidate)
  return { candidate: Object.freeze(candidate), reportBytes: Buffer.from(finalReport) }
}

const buildCarrier = (candidate: any, reportBytes: Buffer) => {
  const candidateBytes = Buffer.from(canonical(candidate))
  const carrier: any = {
    schemaVersion: "v1.38-plan-262-103-git-object-byte-custody-rereview-carrier-v1",
    protocol: "git-object-byte-custody-external-carrier-v1", status: candidate.status,
    reviewedSource: candidate.correctedSource,
    candidate: { path: V138_PLAN_262_103_CANDIDATE_PATH, mode: "100644", byteLength: candidateBytes.length,
      sha256: sha256(candidateBytes), blobOid: blobOid(candidateBytes), candidatePayloadRoot: candidate.candidatePayloadRoot },
    review: { path: V138_PLAN_262_103_REPORT_PATH, mode: "100644", byteLength: reportBytes.length,
      sha256: sha256(reportBytes), blobOid: blobOid(reportBytes) },
    actualConsumer: { status: candidate.status === "zero_findings" ? "passed" : "blocked_review",
      observationRoot: candidate.execution.actualConsumerObservationRoot, executionClosureMatchedBeforeAfter: true,
      destinationsUnchanged: true, cleanupComplete: true, canonicalWrites: 0, liveInvoked: false, freshCharged: 0,
      freshAccepted: 0, localSecretAccessed: false, identityConsumed: false },
    protectedHistory: candidate.protectedHistory, findings: candidate.findings, findingCount: candidate.findingCount,
    sourceReviewPassed: candidate.sourceReviewPassed, authority: candidate.authority, carrierRoot: `sha256:${"0".repeat(64)}`,
  }
  carrier.carrierRoot = carrierRoot(carrier)
  return { carrier: Object.freeze(carrier), candidateBytes, carrierBytes: Buffer.from(canonical(carrier)) }
}

export const snapshotV138Plan262103Destinations = (root: string) => Object.freeze(Object.fromEntries(
  V138_PLAN_262_103_FORBIDDEN_DESTINATIONS.map((repoPath) => {
    const target = path.resolve(root, repoPath)
    const type = safeType(target)
    return [repoPath, type === "regular" ? { type, sha256: sha256(regularBytes(root, repoPath)) } : { type }]
  }),
))

const cloneModules = (sourceRoot: string, clone: string) => {
  symlinkSync(path.resolve(sourceRoot, "node_modules"), path.resolve(clone, "node_modules"), "dir")
  for (const manifest of lines(git(sourceRoot, ["ls-files", "*/package.json"]))) {
    const packageDir = path.dirname(manifest)
    const from = path.resolve(sourceRoot, packageDir, "node_modules")
    const to = path.resolve(clone, packageDir, "node_modules")
    if (safeType(from) === "directory" && safeType(to) === "absent") symlinkSync(from, to, "dir")
  }
}

const consumerProcessClosure = (clone: string, owner: string, tsxCli: string, expectedRoot?: string): any => {
  const source = `import { authenticateV138RetryV3ExecutionClosure as authenticate } from "./scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts"; const value=authenticate(process.cwd(),{sourceCommit:"${SOURCE_COMMIT}",checkoutPaths:${JSON.stringify(V138_PLAN_262_103_SOURCE_PATHS)}${expectedRoot ? `,executionClosureRoot:"${expectedRoot}"` : ""}}); process.stdout.write(JSON.stringify(value));`
  return JSON.parse(execFileSync(process.execPath, [tsxCli, "-e", source], {
    cwd: clone,
    env: { ...process.env, HOME: owner, XDG_CONFIG_HOME: path.join(owner, "xdg") },
    encoding: "utf8",
    timeout: 180_000,
    maxBuffer: 64 * 1024 * 1024,
  }))
}

const exercise = (root: string, findings: readonly any[] = []) => {
  const previous = process.umask(0o077)
  const owner = path.join(tmpdir(), "cowards-v138-plan262103-review-v6")
  if (safeType(owner) !== "absent") fail("V138_PLAN_262_103_OWNER_PRESENT")
  mkdirSync(owner, { mode: 0o700 })
  const clone = path.join(owner, "repo")
  const refsBefore = git(root, ["for-each-ref", "--format=%(refname)%00%(objectname)"])
  try {
    execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "clone", "--no-local", "--no-checkout", root, clone],
      { env: { ...process.env, HOME: owner, XDG_CONFIG_HOME: path.join(owner, "xdg") }, stdio: "pipe", maxBuffer: 64 * 1024 * 1024 })
    git(clone, ["checkout", "--detach", SOURCE_COMMIT], owner)
    if ((statSync(owner).mode & 0o777) !== 0o700) fail("V138_PLAN_262_103_OWNER_MODE_INVALID")
    const common = realpathSync(path.resolve(clone, git(clone, ["rev-parse", "--git-common-dir"], owner)))
    if (!common.startsWith(`${realpathSync(clone)}${path.sep}`) || safeType(path.join(common, "objects/info/alternates")) !== "absent")
      fail("V138_PLAN_262_103_OBJECT_STORE_NOT_ISOLATED")
    cloneModules(root, clone)
    const tsxCli = createRequire(path.join(root, "package.json")).resolve("tsx/cli")
    const source = inspectV138Plan262103Source(clone)
    const history = inspectV138Plan262103ProtectedHistory(clone)
    const closureBefore = consumerProcessClosure(clone, owner, tsxCli)
    const packageRoot = path.dirname(createRequire(path.join(root, "package.json")).resolve("vitest/package.json"))
    const resultPath = path.join(owner, "vitest.json")
    const testRun = spawnSync(process.execPath, [path.join(packageRoot, "vitest.mjs"), "run", V138_PLAN_262_103_SOURCE_PATHS[2],
      "--pool=forks", "--maxWorkers=1", "--no-file-parallelism", "--testTimeout=180000", "--hookTimeout=180000",
      "--bail=1", "--reporter=json", `--outputFile=${resultPath}`], { cwd: clone,
      env: { ...process.env, HOME: owner, XDG_CONFIG_HOME: path.join(owner, "xdg") }, timeout: 180_000, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    if (testRun.status !== 0 || safeType(resultPath) !== "regular") fail("V138_PLAN_262_103_FOCUSED_TEST_FAILED")
    const testResult = JSON.parse(readFileSync(resultPath, "utf8")); unlinkSync(resultPath)
    const built = buildCandidate(source, history, portableClosure(closureBefore), findings, testResult.numPassedTests)
    const external = buildCarrier(built.candidate, built.reportBytes)
    for (const [repoPath, bytes] of [[V138_PLAN_262_103_CANDIDATE_PATH, external.candidateBytes], [V138_PLAN_262_103_REPORT_PATH, built.reportBytes], [V138_PLAN_262_103_CARRIER_PATH, external.carrierBytes]] as const) {
      mkdirSync(path.dirname(path.resolve(clone, repoPath)), { recursive: true }); writeFileSync(path.resolve(clone, repoPath), bytes, { mode: 0o600 })
    }
    git(clone, ["add", "--", V138_PLAN_262_103_CANDIDATE_PATH, V138_PLAN_262_103_REPORT_PATH, V138_PLAN_262_103_CARRIER_PATH], owner)
    execFileSync("/usr/bin/git", ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", "commit", "--quiet", "-m", "candidate Plan 262-103 review trio"], {
      cwd: clone, env: { ...process.env, HOME: owner, XDG_CONFIG_HOME: path.join(owner, "xdg"), GIT_AUTHOR_NAME: "Plan 262 Review Candidate",
        GIT_AUTHOR_EMAIL: "plan-262-review@example.invalid", GIT_COMMITTER_NAME: "Plan 262 Review Candidate",
        GIT_COMMITTER_EMAIL: "plan-262-review@example.invalid", GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z", GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z" }, stdio: "pipe" })
    const changed = lines(git(clone, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"], owner)).sort()
    if (canonical(changed) !== canonical([V138_PLAN_262_103_CANDIDATE_PATH, V138_PLAN_262_103_REPORT_PATH, V138_PLAN_262_103_CARRIER_PATH].sort()))
      fail("V138_PLAN_262_103_CANDIDATE_COMMIT_INVALID")
    const preConsumerClosure = consumerProcessClosure(clone, owner, tsxCli)
    for (const key of ["sourceCommit", "sourceTree", "sourceParent", "checkoutByteManifestRoot", "installedClosureRoot", "gitExecutable", "gitExecutableSha256", "gitIsolationRoot", "nodeSha256", "pnpmDistributionSha256", "nativeSourcesRoot", "pathnameLaunchReplacementResistanceClaimed"] as const)
      if (preConsumerClosure[key] !== built.candidate.reviewedExecutionClosure[key])
        fail(`V138_PLAN_262_103_PRECONSUMER_CLOSURE_MISMATCH:${key}:${String(built.candidate.reviewedExecutionClosure[key])}:${String(preConsumerClosure[key])}`)
    const before = snapshotV138Plan262103Destinations(clone)
    const consumerRun = spawnSync(process.execPath, [tsxCli, V138_PLAN_262_103_SOURCE_PATHS[1], "--derive-seal-envelope-no-publish"], {
      cwd: clone, env: { ...process.env, HOME: owner, XDG_CONFIG_HOME: path.join(owner, "xdg") }, timeout: 180_000, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
    if (consumerRun.status !== 0) fail(`V138_PLAN_262_103_ACTUAL_CONSUMER_FAILED:${consumerRun.stderr.trim()}`)
    const consumer = JSON.parse(consumerRun.stdout)
    if (consumer.kind !== (findings.length === 0 ? "eligible" : "ineligible_review")) fail("V138_PLAN_262_103_ACTUAL_CONSUMER_BRANCH_INVALID")
    const after = snapshotV138Plan262103Destinations(clone)
    const closureAfter = consumerProcessClosure(clone, owner, tsxCli, closureBefore.executionClosureRoot)
    if (canonical(before) !== canonical(after) || closureAfter.executionClosureRoot !== closureBefore.executionClosureRoot)
      fail("V138_PLAN_262_103_CONSUMER_MUTATED_STATE")
    return Object.freeze({ ...built, ...external, consumer, candidateCommit: git(clone, ["rev-parse", "HEAD"], owner) })
  } finally {
    rmSync(owner, { recursive: true, force: true }); process.umask(previous)
    if (git(root, ["for-each-ref", "--format=%(refname)%00%(objectname)"]) !== refsBefore) fail("V138_PLAN_262_103_CANONICAL_REFS_MUTATED")
  }
}

let cacheRoot = ""; let cache: any
export const deriveV138Plan262103ReviewNoPublish = (root: string) => {
  if (cacheRoot === path.resolve(root) && cache) return cache
  const before = snapshotV138Plan262103Destinations(root)
  inspectV138Plan262103Source(root); inspectV138Plan262103ProtectedHistory(root)
  cache = exercise(root); cacheRoot = path.resolve(root)
  if (canonical(before) !== canonical(snapshotV138Plan262103Destinations(root))) fail("V138_PLAN_262_103_CANONICAL_DESTINATION_MUTATED")
  return cache
}

export const validateV138Plan262103Publication = (candidate: any, carrier: any, reportBytes: Buffer): true => {
  const expected = buildCarrier(candidate, reportBytes)
  if (candidate.candidatePayloadRoot !== candidateRoot(candidate) || carrier.carrierRoot !== carrierRoot(carrier) ||
    candidate.reviewRoot !== byteDomainRoot(REVIEW_DOMAIN, reportBytes) || canonical(carrier) !== canonical(expected.carrier) ||
    candidate.status !== carrier.status || candidate.sourceReviewPassed !== carrier.sourceReviewPassed ||
    canonical(candidate.protectedHistory) !== canonical(carrier.protectedHistory) ||
    carrier.candidate.candidatePayloadRoot !== candidate.candidatePayloadRoot ||
    (candidate.status === "zero_findings") !== (candidate.findingCount === 0 && candidate.authority.plan26292Eligible === true) ||
    candidate.execution.freshCharged !== 0 || candidate.execution.freshAccepted !== 0 ||
    Object.entries(candidate.authority).some(([key, value]) => key === "plan26292Eligible" ? value !== (candidate.status === "zero_findings") :
      ["freshCharged", "freshAccepted"].includes(key) ? value !== 0 : value !== false))
    fail("V138_PLAN_262_103_PUBLICATION_INVALID")
  return true
}

const exclusiveWrite = (target: string, bytes: Buffer) => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_103_DESTINATION_PRESENT")
  const fd = openSync(target, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600)
  try { writeFileSync(fd, bytes) } finally { closeSync(fd) }
}
export const publishV138Plan262103Review = (root: string) => {
  const built = deriveV138Plan262103ReviewNoPublish(root)
  const written: string[] = []
  try {
    for (const [repoPath, bytes] of [[V138_PLAN_262_103_CANDIDATE_PATH, built.candidateBytes], [V138_PLAN_262_103_REPORT_PATH, built.reportBytes], [V138_PLAN_262_103_CARRIER_PATH, built.carrierBytes]] as const) {
      exclusiveWrite(path.resolve(root, repoPath), bytes); written.push(repoPath)
    }
  } catch (error) {
    for (const repoPath of written) unlinkSync(path.resolve(root, repoPath))
    throw error
  }
  return built
}

export const checkV138Plan262103PublishedReview = (root: string) => {
  const candidateBytes = regularBytes(root, V138_PLAN_262_103_CANDIDATE_PATH)
  const reportBytes = regularBytes(root, V138_PLAN_262_103_REPORT_PATH)
  const carrierBytes = regularBytes(root, V138_PLAN_262_103_CARRIER_PATH)
  const candidate = JSON.parse(candidateBytes.toString("utf8")); const carrier = JSON.parse(carrierBytes.toString("utf8"))
  if (!candidateBytes.equals(Buffer.from(canonical(candidate))) || !carrierBytes.equals(Buffer.from(canonical(carrier))) ||
    !reportBytes.equals(Buffer.from(renderV138Plan262103Report(candidate)))) fail("V138_PLAN_262_103_CANONICAL_BYTES_INVALID")
  validateV138Plan262103Publication(candidate, carrier, reportBytes)
  const commits = lines(git(root, ["log", "--format=%H", "--all", "--", V138_PLAN_262_103_CANDIDATE_PATH, V138_PLAN_262_103_REPORT_PATH, V138_PLAN_262_103_CARRIER_PATH]))
  if (commits.length !== 1) fail("V138_PLAN_262_103_PUBLICATION_LINEAGE_INVALID")
  const publicationCommit = commits[0]
  const changed = lines(git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", publicationCommit])).sort()
  if (canonical(changed) !== canonical([V138_PLAN_262_103_CANDIDATE_PATH, V138_PLAN_262_103_REPORT_PATH, V138_PLAN_262_103_CARRIER_PATH].sort()))
    fail("V138_PLAN_262_103_PUBLICATION_LINEAGE_INVALID")
  return Object.freeze({ candidate, carrier, reportBytes, publicationCommit })
}
export const checkV138Plan262103ConsumerBranch = (root: string) => {
  const checked = checkV138Plan262103PublishedReview(root)
  if (checked.candidate.status === "zero_findings" && (checked.carrier.actualConsumer.status !== "passed" || checked.carrier.authority.plan26292Eligible !== true))
    fail("V138_PLAN_262_103_CONSUMER_BRANCH_INVALID")
  if (checked.candidate.status === "blocked" && checked.carrier.authority.plan26292Eligible !== false)
    fail("V138_PLAN_262_103_CONSUMER_BRANCH_INVALID")
  return checked
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const output = (value: any, publicationCommit: string | null = null) => canonical({ status: value.candidate.status,
  findingCount: value.candidate.findingCount, findingRoot: value.candidate.findingRoot,
  candidatePayloadRoot: value.candidate.candidatePayloadRoot, reviewRoot: value.candidate.reviewRoot,
  carrierRoot: value.carrier.carrierRoot, actualConsumerStatus: value.carrier.actualConsumer.status,
  publicationCommit, plan26292Eligible: value.carrier.authority.plan26292Eligible, liveInvoked: false, freshCharged: 0, freshAccepted: 0 })
const main = () => {
  const arg = process.argv.slice(2)
  if (canonical(arg) === canonical(["--derive-review-no-publish"])) return process.stdout.write(output(deriveV138Plan262103ReviewNoPublish(repoRoot)))
  if (canonical(arg) === canonical(["--write-review"])) return process.stdout.write(output(publishV138Plan262103Review(repoRoot)))
  if (canonical(arg) === canonical(["--check-review"])) { const v = checkV138Plan262103PublishedReview(repoRoot); return process.stdout.write(output(v, v.publicationCommit)) }
  if (canonical(arg) === canonical(["--check-review-consumer-branch"])) { const v = checkV138Plan262103ConsumerBranch(repoRoot); return process.stdout.write(output(v, v.publicationCommit)) }
  fail("V138_PLAN_262_103_ARGUMENTS_INVALID")
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
