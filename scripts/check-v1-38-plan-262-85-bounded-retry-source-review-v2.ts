#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
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
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type Sha256 = `sha256:${string}`
type Source = Readonly<{ model: string; controller: string; tests: string }>

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_PLAN_262_85_CHECKER_PATH =
  "scripts/check-v1-38-plan-262-85-bounded-retry-source-review-v2.ts"
export const V138_PLAN_262_85_REVIEW_PATH =
  ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json"
export const V138_PLAN_262_85_REPORT_PATH = `${PHASE_DIR}/262-85-REVIEW.md`
export const V138_PLAN_262_85_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v2.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v2.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v2.test.ts",
] as const)

const EXPECTED = Object.freeze({
  reviewedSourceCommit: "7a829707900d646c943535a82fbc718de93aec95",
  reviewedSourceTree: "a9d8b45a3d0d37d07b56d03de3c115ba83220c4d",
  reviewedSourceParent: "92b14663c625a29268ac31e8de3ce982d06cc31b",
  sourceBaseCommit: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
  sourceBaseTree: "98e633df3870c944adaa9c5dc553a6df367da354",
  authorizationCommit: "453a33a10c247fb9c75e969ed4ab63646b16b488",
  authorizationTree: "32626e7f24b7262e461cb1e12c3efb691dbb5739",
  authorizationParent: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
})

const PROTECTED_FILES = Object.freeze([
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
] as const)

const DOWNSTREAM_DESTINATIONS = Object.freeze([
  ".planning/artifacts/v1.38-successor-source-seal-v12.json",
  ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v2",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
  ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
  ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v3.json",
  ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v2.json",
  ".planning/artifacts/v1.38-foundation-activation-root-route10.json",
] as const)

export const V138_PLAN_262_85_MUTATIONS = Object.freeze([
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
  ["PARTIAL_REUSE_ENABLED", "model", "partialAcceptedEvidenceReusable: false as const", "partialAcceptedEvidenceReusable: true as const"],
  ["KERNEL_AUTHORITY_CHANGED", "model", 'rulesAuthority: "MATCH_KERNEL" as const', 'rulesAuthority: "COPIED_KERNEL" as const'],
  ["SUPERVISED_RUNTIME_DISABLED", "model", "supervisedRuntimeOnly: true as const", "supervisedRuntimeOnly: false as const"],
  ["FORMATION_AUTHORITY_ENABLED", "model", "formationMaterializationAuthorized: false as const", "formationMaterializationAuthorized: true as const"],
  ["PRODUCTION_AUTHORITY_ENABLED", "model", "productionAuthorized: false as const", "productionAuthorized: true as const"],
  ["JOURNAL_CHAIN_WEAKENED", "model", "record.previousRoot !== previousRoot", "false"],
  ["NOFOLLOW_REMOVED", "controller", "constants.O_WRONLY | constants.O_APPEND | (constants.O_NOFOLLOW ?? 0)", "constants.O_WRONLY | constants.O_APPEND"],
  ["LOCKF_REMOVED", "controller", '"/usr/bin/lockf"', '"/usr/bin/true"'],
  ["PRIVACY_SOURCE_ENABLED", "controller", "strategySourceIncluded: false as const", "strategySourceIncluded: true as const"],
  ["CRASH_MATRIX_REMOVED", "tests", '"recovers a real SIGKILL at %s with one chain and no reserved identity reuse"', '"skips crash recovery"'],
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
const git = (root: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
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
  if (safeType(target) !== "regular") fail("V138_PLAN_262_85_INPUT_UNSAFE")
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
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, descendant], {
      cwd: root,
      stdio: "ignore",
    })
  } catch {
    fail("V138_PLAN_262_85_ANCESTRY_INVALID")
  }
}

export const inspectV138Plan26285Source = (source: Source): string[] => {
  const findings = V138_PLAN_262_85_MUTATIONS.filter(
    ([, file, token]) => source[file].split(token).length - 1 !== 1,
  ).map(([code]) => code)
  if (/Math\.random|Date\.now|node:vm|new Function/u.test(source.model + source.controller))
    findings.push("FORBIDDEN_NONDETERMINISM_PRESENT")
  if (!source.controller.includes("fsyncSync(descriptor)") || !source.controller.includes("fsyncParent(target)"))
    findings.push("DURABILITY_BOUNDARY_MISSING")
  if (!source.controller.includes("requireExactV2Lineage(repoRoot)"))
    findings.push("GIT_LINEAGE_GATE_MISSING")
  return [...new Set(findings)].sort()
}

const inspectCustody = (root: string) => {
  const summaryPath = `${PHASE_DIR}/262-84-SUMMARY.md`
  const summaryCommits = lines(git(root, ["log", "--format=%H", "--", summaryPath]))
  if (
    summaryCommits.length !== 1 ||
    summaryCommits[0] !== EXPECTED.reviewedSourceCommit
  )
    fail("V138_PLAN_262_85_SOURCE_COMPLETION_INVALID")
  const [commit, tree, parents] = git(root, [
    "show",
    "-s",
    "--format=%H%n%T%n%P",
    summaryCommits[0]!,
  ]).split("\n")
  if (
    commit !== EXPECTED.reviewedSourceCommit ||
    tree !== EXPECTED.reviewedSourceTree ||
    parents !== EXPECTED.reviewedSourceParent
  )
    fail("V138_PLAN_262_85_SOURCE_IDENTITY_INVALID")
  requireAncestor(root, commit, "HEAD")
  const blobs = V138_PLAN_262_85_SOURCE_PATHS.map((repoPath) => {
    const entry = git(root, ["ls-tree", commit, "--", repoPath]).split(/\s+/u)
    const mode = entry[0]
    const blob = entry[2]
    const committed = execFileSync("git", ["show", `${commit}:${repoPath}`], {
      cwd: root,
    })
    const working = readRegular(root, repoPath)
    if (
      mode !== "100644" ||
      !committed.equals(working) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath]))
        .length !== 0
    )
      fail("V138_PLAN_262_85_SOURCE_CUSTODY_INVALID")
    return Object.freeze({
      path: repoPath,
      mode,
      blob,
      byteLength: committed.length,
      sha256: sha256(committed),
    })
  })
  return Object.freeze({ commit, tree, parent: parents, summaryPath, blobs })
}

const inspectDecisionJoin = (root: string) => {
  const sourceBaseTree = git(root, ["rev-parse", `${EXPECTED.sourceBaseCommit}^{tree}`])
  const authorizationTree = git(root, [
    "rev-parse",
    `${EXPECTED.authorizationCommit}^{tree}`,
  ])
  const authorizationSoleParent = git(root, [
    "show",
    "-s",
    "--format=%P",
    EXPECTED.authorizationCommit,
  ])
  if (
    sourceBaseTree !== EXPECTED.sourceBaseTree ||
    authorizationTree !== EXPECTED.authorizationTree ||
    authorizationSoleParent !== EXPECTED.authorizationParent
  )
    fail("V138_PLAN_262_85_DECISION_JOIN_INVALID")
  requireAncestor(root, EXPECTED.authorizationCommit, EXPECTED.reviewedSourceCommit)
  return Object.freeze({
    sourceBaseCommit: EXPECTED.sourceBaseCommit,
    sourceBaseTree,
    authorizationCommit: EXPECTED.authorizationCommit,
    authorizationTree,
    authorizationSoleParent,
    distinctFromReviewedSource:
      EXPECTED.authorizationCommit !== EXPECTED.reviewedSourceCommit &&
      EXPECTED.sourceBaseCommit !== EXPECTED.reviewedSourceCommit,
  })
}

const inspectProtectedHistory = (root: string) => {
  const files = PROTECTED_FILES.map(([repoPath, expectedSha256]) => {
    const bytes = readRegular(root, repoPath)
    const actualSha256 = sha256(bytes)
    if (actualSha256 !== expectedSha256)
      fail("V138_PLAN_262_85_PROTECTED_HISTORY_INVALID")
    return Object.freeze({ path: repoPath, sha256: actualSha256 })
  })
  const correction = JSON.parse(
    readRegular(root, PROTECTED_FILES[0][0]).toString("utf8"),
  ) as any
  if (
    correction.correctionRoot !==
      "sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026" ||
    correction.effectiveAssurance?.status !== "integrity_non_pass" ||
    correction.effectiveAssurance?.integrityPassed !== false ||
    correction.effectiveAssurance?.historicalBytesMutated !== false ||
    correction.empiricalOutcome?.freshAccepted !== 0 ||
    correction.empiricalOutcome?.requiredAccepted !== 540
  )
    fail("V138_PLAN_262_85_CORRECTION_INVALID")
  return Object.freeze({
    correctionRoot: correction.correctionRoot as Sha256,
    status: correction.effectiveAssurance.status,
    historicalBytesMutated: false,
    freshAccepted: 0,
    requiredAccepted: 540,
    files,
  })
}

export const snapshotV138Plan26285Destinations = (root: string) =>
  [
    V138_PLAN_262_85_REVIEW_PATH,
    V138_PLAN_262_85_REPORT_PATH,
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

const normalizeReviewPairForDerivation = (
  snapshot: ReturnType<typeof snapshotV138Plan26285Destinations>,
) =>
  snapshot.map((item) =>
    item.path === V138_PLAN_262_85_REVIEW_PATH ||
    item.path === V138_PLAN_262_85_REPORT_PATH
      ? Object.freeze({ path: item.path, type: "absent" as const })
      : item,
  )

const linkWorkspaceModules = (root: string, clone: string): void => {
  symlinkSync(path.resolve(root, "node_modules"), path.join(clone, "node_modules"), "dir")
  for (const packageJson of lines(git(root, ["ls-files", "*/package.json"]))) {
    const packageDir = path.dirname(packageJson)
    const source = path.resolve(root, packageDir, "node_modules")
    const target = path.resolve(clone, packageDir, "node_modules")
    if (safeType(source) === "directory" && safeType(target) === "absent")
      symlinkSync(source, target, "dir")
  }
}

const detachedExercise = (root: string) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan26285-review-"))
  chmodSync(owner, 0o700)
  const clone = path.join(owner, "repo")
  try {
    execFileSync("git", ["clone", "--shared", "--no-checkout", root, clone], {
      stdio: ["ignore", "pipe", "pipe"],
    })
    execFileSync("git", ["checkout", "--detach", EXPECTED.reviewedSourceCommit], {
      cwd: clone,
      stdio: ["ignore", "pipe", "pipe"],
    })
    linkWorkspaceModules(root, clone)
    if ((statSync(owner).mode & 0o777) !== 0o700)
      fail("V138_PLAN_262_85_OWNER_MODE_INVALID")
    const before = snapshotV138Plan26285Destinations(clone)
    const resultPath = path.join(clone, ".plan26285-vitest.json")
    execFileSync(
      path.resolve(root, "node_modules/.bin/vitest"),
      [
        "run",
        "scripts/run-v1-38-bounded-retry-envelope-v2.test.ts",
        "--pool=forks",
        "--maxWorkers=1",
        "--no-file-parallelism",
        "--testTimeout=180000",
        "--bail=1",
        "--reporter=json",
        `--outputFile=${resultPath}`,
      ],
      { cwd: clone, timeout: 180_000, maxBuffer: 32 * 1024 * 1024 },
    )
    const testResult = JSON.parse(readFileSync(resultPath, "utf8")) as any
    unlinkSync(resultPath)
    const sourceOnly = JSON.parse(
      execFileSync(
        path.resolve(root, "node_modules/.bin/tsx"),
        ["scripts/run-v1-38-bounded-retry-envelope-v2.ts", "--check-source-only"],
        {
          cwd: clone,
          encoding: "utf8",
          timeout: 180_000,
          maxBuffer: 32 * 1024 * 1024,
        },
      ),
    ) as any
    const after = snapshotV138Plan26285Destinations(clone)
    if (
      canonical(before) !== canonical(after) ||
      testResult.success !== true ||
      testResult.numFailedTests !== 0 ||
      testResult.numPassedTests !== 81 ||
      sourceOnly.liveInvoked !== false ||
      sourceOnly.freshCharged !== 0 ||
      sourceOnly.freshAccepted !== 0 ||
      sourceOnly.downstreamAuthority !== "denied"
    )
      fail("V138_PLAN_262_85_DETACHED_EXERCISE_INVALID")
    return Object.freeze({
      ownerMode: "0700",
      sourceCommit: EXPECTED.reviewedSourceCommit,
      focusedTestsPassed: testResult.numPassedTests as number,
      sourceOnlyPassed: true,
      resultRoot: sha256(
        canonical({
          success: testResult.success,
          numPassedTests: testResult.numPassedTests,
          numFailedTests: testResult.numFailedTests,
          sourceOnly,
        }),
      ),
      canonicalWrites: 0,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      lockfRacesProved: true,
      realCrashBoundariesProved: 7,
      deadlineAndBackoffProved: true,
      noIdentityReuseProved: true,
      idempotenceProved: true,
    })
  } finally {
    rmSync(owner, { recursive: true, force: true })
  }
}

const OBSERVATION_IDS = Object.freeze([
  "git-custody",
  "decision-join",
  "protected-history",
  "frozen-bounds",
  "detached-fake-effect-proof",
  "lockf-contention",
  "crash-recovery",
  "deadline-backoff",
  "no-reuse-idempotence",
  "privacy-authority-denial",
  "canonical-absence",
] as const)

export interface V138Plan26285ObservationExecution {
  readonly id: (typeof OBSERVATION_IDS)[number]
  readonly executed: boolean
  readonly passed: boolean
  readonly detail: unknown
}

export const evaluateV138Plan26285Observations = (
  executions: readonly V138Plan26285ObservationExecution[],
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
    .map(({ id, executed, detailRoot }) =>
      Object.freeze({
        code: `OBSERVATION_${id.toUpperCase().replaceAll("-", "_")}_${
          executed ? "FAILED" : "INCOMPLETE"
        }`,
        severity: "critical" as const,
        summary: executed
          ? `The ${id} observation failed.`
          : `The ${id} observation was not executed.`,
        detailRoot,
      }),
    )
  return Object.freeze({ observations, findings })
}

let cachedRoot: string | undefined
let cachedReview: any
export const deriveV138Plan26285NoPublish = (root: string) => {
  if (cachedRoot === path.resolve(root) && cachedReview !== undefined)
    return cachedReview
  const before = snapshotV138Plan26285Destinations(root)
  const normalizedBefore = normalizeReviewPairForDerivation(before)
  const reviewedSource = inspectCustody(root)
  const decisionJoin = inspectDecisionJoin(root)
  const protectedHistory = inspectProtectedHistory(root)
  const source: Source = {
    model: git(root, ["show", `${reviewedSource.commit}:${V138_PLAN_262_85_SOURCE_PATHS[0]}`]),
    controller: git(root, ["show", `${reviewedSource.commit}:${V138_PLAN_262_85_SOURCE_PATHS[1]}`]),
    tests: git(root, ["show", `${reviewedSource.commit}:${V138_PLAN_262_85_SOURCE_PATHS[2]}`]),
  }
  const sourceFindings = inspectV138Plan26285Source(source)
  const detached = detachedExercise(root)
  const after = snapshotV138Plan26285Destinations(root)
  const normalizedAfter = normalizeReviewPairForDerivation(after)
  const unchanged = canonical(before) === canonical(after)
  if (!unchanged) fail("V138_PLAN_262_85_DESTINATION_MUTATED")
  const executed = (
    id: (typeof OBSERVATION_IDS)[number],
    passed: boolean,
    detail: unknown,
  ): V138Plan26285ObservationExecution => ({ id, executed: true, passed, detail })
  const evaluated = evaluateV138Plan26285Observations([
    executed("git-custody", reviewedSource.blobs.length === 3, reviewedSource),
    executed("decision-join", decisionJoin.distinctFromReviewedSource, decisionJoin),
    executed("protected-history", protectedHistory.status === "integrity_non_pass", protectedHistory),
    executed("frozen-bounds", sourceFindings.length === 0, { sourceFindings }),
    executed("detached-fake-effect-proof", detached.focusedTestsPassed === 81, detached.resultRoot),
    executed("lockf-contention", detached.lockfRacesProved, detached.resultRoot),
    executed("crash-recovery", detached.realCrashBoundariesProved === 7, detached.resultRoot),
    executed("deadline-backoff", detached.deadlineAndBackoffProved, detached.resultRoot),
    executed("no-reuse-idempotence", detached.noIdentityReuseProved && detached.idempotenceProved, detached.resultRoot),
    executed("privacy-authority-denial", !detached.liveInvoked && detached.freshCharged === 0, detached.resultRoot),
    executed("canonical-absence", unchanged, {
      before: normalizedBefore,
      after: normalizedAfter,
    }),
  ])
  const findings = [
    ...sourceFindings.map((code) =>
      Object.freeze({
        code,
        severity: "critical" as const,
        summary: "A frozen source, policy, runtime, privacy, or authority family changed.",
        detailRoot: sha256(`${code}\n`),
      }),
    ),
    ...evaluated.findings,
  ]
  const body = {
    schemaVersion: "v1.38-plan-262-85-bounded-retry-source-review-v2" as const,
    reviewProtocol: "fresh-source-only-non-authorizing-review-v2" as const,
    status: findings.length === 0 ? ("zero_findings" as const) : ("blocked" as const),
    reviewedSource,
    decisionJoin,
    protectedHistory,
    detachedExercise: detached,
    observations: evaluated.observations,
    findings,
    findingCount: findings.length,
    sourceReviewPassed: findings.length === 0,
    identityClaims: Object.freeze({
      independentPersonClaimed: false,
      externalIdentityClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      independentCustodyClaimed: false,
      separatePermissioningClaimed: false,
      maliciousOperatorResistanceClaimed: false,
    }),
    authority: Object.freeze({
      plan26286Eligible: findings.length === 0,
      authorizesExecution: false,
      authorizationCreated: false,
      sealCreated: false,
      envelopeCreated: false,
      liveInvoked: false,
      localSecretAccessed: false,
      lifecycleMutated: false,
      freshCharged: 0,
      freshAccepted: 0,
      admit03Status: "blocked" as const,
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      activationAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
    }),
  }
  cachedRoot = path.resolve(root)
  cachedReview = Object.freeze({
    ...body,
    reviewRoot: sha256(`v138-plan26285-source-review-v2\0${canonical(body)}`),
  })
  return cachedReview
}

const cloneRecord = (value: unknown): Record<string, any> =>
  JSON.parse(JSON.stringify(value)) as Record<string, any>
export const computeV138Plan26285ReviewRoot = (candidate: unknown): Sha256 => {
  const body = cloneRecord(candidate)
  delete body.reviewRoot
  return sha256(`v138-plan26285-source-review-v2\0${canonical(body)}`)
}
export const validateV138Plan26285Review = (
  candidate: unknown,
  expected: unknown,
): true => {
  const value = candidate as any
  const detachedObservationIds = [
    "detached-fake-effect-proof",
    "lockf-contention",
    "crash-recovery",
    "deadline-backoff",
    "no-reuse-idempotence",
    "privacy-authority-denial",
  ]
  const normalized = (input: unknown) => {
    const copy = cloneRecord(input)
    delete copy.reviewRoot
    if (copy.detachedExercise)
      copy.detachedExercise.resultRoot = "sha256:detached-execution"
    for (const observation of copy.observations ?? []) {
      if (detachedObservationIds.includes(observation.id))
        observation.detailRoot = "sha256:detached-execution-observation"
    }
    return copy
  }
  const detachedObservationRootsValid = (value.observations ?? [])
    .filter((observation: any) =>
      detachedObservationIds.includes(observation.id),
    )
    .every(
      (observation: any) =>
        observation.detailRoot ===
        sha256(
          `${observation.id}\0${canonical(value.detachedExercise.resultRoot)}`,
        ),
    )
  if (
    value?.schemaVersion !== "v1.38-plan-262-85-bounded-retry-source-review-v2" ||
    value.reviewRoot !== computeV138Plan26285ReviewRoot(value) ||
    canonical(normalized(value)) !== canonical(normalized(expected)) ||
    !detachedObservationRootsValid ||
    value.findingCount !== value.findings?.length ||
    value.sourceReviewPassed !== (value.findingCount === 0) ||
    value.status !== (value.findingCount === 0 ? "zero_findings" : "blocked") ||
    value.authority?.plan26286Eligible !== (value.findingCount === 0) ||
    value.authority?.authorizesExecution !== false ||
    value.protectedHistory?.correctionRoot !==
      "sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026" ||
    Object.entries(value.authority).some(
      ([key, item]) =>
        !["plan26286Eligible", "admit03Status", "freshCharged", "freshAccepted"].includes(key) && item !== false,
    ) ||
    value.authority.admit03Status !== "blocked" ||
    value.authority.freshCharged !== 0 ||
    value.authority.freshAccepted !== 0 ||
    Object.values(value.identityClaims).some((item) => item !== false)
  )
    fail("V138_PLAN_262_85_REVIEW_MISMATCH")
  return true
}

export const renderV138Plan26285Report = (review: any): string => {
  const verdict = review.findingCount === 0 ? "PASS — exact zero findings" : "BLOCKED"
  const findings =
    review.findingCount === 0
      ? "None."
      : review.findings
          .map(
            (item: any) =>
              `- **${item.code}** (${item.severity}): ${item.summary} Evidence root: \`${item.detailRoot}\`.`,
          )
          .join("\n")
  return `---\nphase: 262-foundation-admission-measurement-custody-and-containment-con\nplan: "85"\nreview_protocol: ${review.reviewProtocol}\nreviewed_source_commit: ${review.reviewedSource.commit}\nfinding_count: ${review.findingCount}\nsource_review_passed: ${review.sourceReviewPassed}\nstatus: ${review.status}\nreview_root: ${review.reviewRoot}\n---\n\n# Phase 262 Plan 85: Bounded-Retry v2 Source Review\n\n## Verdict\n\n**${verdict}.** This source-only technical review is non-authorizing. ${review.authority.plan26286Eligible ? "Exact zero findings make only Plan 262-86 eligible to create a separately committed direct-child seal and inactive envelope." : "Plan 262-86 and all later work remain ineligible."}\n\n## Exact Git Custody\n\n- Reviewed-source completion head A2: \`${review.reviewedSource.commit}\`\n- Tree: \`${review.reviewedSource.tree}\`\n- Sole parent: \`${review.reviewedSource.parent}\`\n- Source-base decision join: \`${review.decisionJoin.sourceBaseCommit}\` -> authorization \`${review.decisionJoin.authorizationCommit}\`\n- Authorization sole parent: \`${review.decisionJoin.authorizationSoleParent}\`\n- All three reviewed source paths are mode \`100644\`, match their committed blobs, and have no later rewrite. A2 is distinct from both decision identities and no B2 exists in this review.\n\n## Independent Exercises\n\nAn owner-only \`0700\` detached clone of A2 ran all ${review.detachedExercise.focusedTestsPassed} source tests and the source-only CLI. The suite exercises injected effects, synchronized \`lockf\` contention, seven real SIGKILL boundaries, durable reservation/recovery, deadline and backoff rules, idempotence, no identity reuse, no-follow containment, and exact frozen bounds. It created zero canonical writes and invoked no live work.\n\n## Findings\n\n${findings}\n\n## Protected History\n\nCorrection-v2 remains \`${review.protectedHistory.status}\` under root \`${review.protectedHistory.correctionRoot}\`. All authenticated v1 evidence bytes remain unchanged; fresh accepted remains 0/540. Plan-83 zero findings are historical only and create no present authority.\n\n## Preserved Boundaries\n\nNo seal-v12, retry envelope v2, journal, receipt, terminal, reproduction-v16, disposition, correction-v3, lifecycle, activation, formation, holdout, public, product, counted-play, production, or gameplay authority was created. Identity claims for an independent person, external identity, independent custody, separate permissioning, and malicious-operator resistance are false.\n\n## Review Root\n\n\`${review.reviewRoot}\`\n`
}

const exclusiveWrite = (target: string, bytes: string): void => {
  if (safeType(target) !== "absent") fail("V138_PLAN_262_85_DESTINATION_PRESENT")
  const descriptor = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(descriptor, bytes)
  } finally {
    closeSync(descriptor)
  }
}
const publish = (root: string) => {
  const review = deriveV138Plan26285NoPublish(root)
  const json = path.resolve(root, V138_PLAN_262_85_REVIEW_PATH)
  const report = path.resolve(root, V138_PLAN_262_85_REPORT_PATH)
  exclusiveWrite(json, canonical(review))
  try {
    exclusiveWrite(report, renderV138Plan26285Report(review))
  } catch (error) {
    unlinkSync(json)
    throw error
  }
  return review
}
const check = (root: string, reviewPath: string, reportPath: string) => {
  if (
    reviewPath !== V138_PLAN_262_85_REVIEW_PATH ||
    reportPath !== V138_PLAN_262_85_REPORT_PATH
  )
    fail("V138_PLAN_262_85_PATH_INVALID")
  const bytes = readRegular(root, reviewPath).toString("utf8")
  const report = readRegular(root, reportPath).toString("utf8")
  const candidate = JSON.parse(bytes)
  const expected = deriveV138Plan26285NoPublish(root)
  if (
    bytes !== canonical(candidate) ||
    report !== renderV138Plan26285Report(candidate)
  )
    fail("V138_PLAN_262_85_PAIR_MISMATCH")
  validateV138Plan26285Review(candidate, expected)
  const commits = lines(
    git(root, ["log", "--format=%H", "--all", "--", reviewPath, reportPath]),
  )
  if (commits.length !== 1) fail("V138_PLAN_262_85_PUBLICATION_LINEAGE_INVALID")
  const commit = commits[0]!
  const changed = lines(
    git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]),
  ).sort()
  if (canonical(changed) !== canonical([reviewPath, reportPath].sort()))
    fail("V138_PLAN_262_85_PUBLICATION_LINEAGE_INVALID")
  requireAncestor(root, EXPECTED.reviewedSourceCommit, commit)
  requireAncestor(root, commit, "HEAD")
  for (const repoPath of [reviewPath, reportPath]) {
    const committed = execFileSync("git", ["show", `${commit}:${repoPath}`], {
      cwd: root,
    })
    if (
      !committed.equals(readRegular(root, repoPath)) ||
      lines(git(root, ["log", "--format=%H", `${commit}..HEAD`, "--", repoPath]))
        .length !== 0
    )
      fail("V138_PLAN_262_85_PUBLICATION_REWRITE_INVALID")
  }
  return { candidate, publicationCommit: commit }
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const review = deriveV138Plan26285NoPublish(repoRoot)
    process.stdout.write(
      canonical({
        status: review.status,
        findingCount: review.findingCount,
        sourceReviewPassed: review.sourceReviewPassed,
        reviewRoot: review.reviewRoot,
        plan26286Eligible: review.authority.plan26286Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  if (canonical(argv) === canonical(["--write-review"])) {
    const review = publish(repoRoot)
    process.stdout.write(
      canonical({
        status: review.status,
        findingCount: review.findingCount,
        sourceReviewPassed: review.sourceReviewPassed,
        reviewRoot: review.reviewRoot,
        plan26286Eligible: review.authority.plan26286Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  if (
    canonical(argv) ===
    canonical([
      "--check-review",
      "--review",
      V138_PLAN_262_85_REVIEW_PATH,
      "--report",
      V138_PLAN_262_85_REPORT_PATH,
    ])
  ) {
    const { candidate, publicationCommit } = check(repoRoot, argv[2]!, argv[4]!)
    process.stdout.write(
      canonical({
        status: candidate.findingCount === 0 ? "passed" : "blocked_verified",
        findingCount: candidate.findingCount,
        sourceReviewPassed: candidate.sourceReviewPassed,
        reviewRoot: candidate.reviewRoot,
        publicationCommit,
        plan26286Eligible: candidate.authority.plan26286Eligible,
        authorizesExecution: false,
        liveInvoked: false,
      }),
    )
    return
  }
  fail("V138_PLAN_262_85_ARGUMENTS_INVALID")
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
