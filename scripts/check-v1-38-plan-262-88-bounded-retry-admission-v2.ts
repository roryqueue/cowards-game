#!/usr/bin/env -S pnpm exec tsx
import type { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

type Sha256 = `sha256:${string}`
type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
type SafeStatus = "absent" | "regular" | "directory" | "unsafe"

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_PLAN_262_88_PATHS = Object.freeze({
  sourceSummary: `${PHASE_DIR}/262-84-SUMMARY.md`,
  sourceController: "scripts/run-v1-38-bounded-retry-envelope-v2.ts",
  sourceModel: "scripts/lib/v1-38-bounded-retry-envelope-v2.ts",
  sourceTests: "scripts/run-v1-38-bounded-retry-envelope-v2.test.ts",
  review:
    ".planning/artifacts/v1.38-plan-262-85-bounded-retry-source-review-v2.json",
  reviewReport: `${PHASE_DIR}/262-85-REVIEW.md`,
  reviewSummary: `${PHASE_DIR}/262-85-SUMMARY.md`,
  localSeal:
    ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json",
  correctionV2:
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v2.json",
  historicalManifest:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v1.json",
  historicalEnvelope:
    ".planning/artifacts/v1.38-plan-262-78-retry-envelope-v1.json",
  historicalJournal:
    ".planning/artifacts/v1.38-current-matrix-retry-journal-v1.jsonl",
  historicalTerminal:
    ".planning/artifacts/v1.38-current-matrix-retry-terminal-v1.json",
  historicalSeal: ".planning/artifacts/v1.38-successor-source-seal-v11.json",
  historicalDisposition:
    ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
  historicalLifecycle:
    ".planning/artifacts/v1.38-phase-262-current-lifecycle-status-v1.json",
  seal: ".planning/artifacts/v1.38-successor-source-seal-v12.json",
  envelope: ".planning/artifacts/v1.38-plan-262-86-retry-envelope-v2.json",
  journal: ".planning/artifacts/v1.38-current-matrix-retry-journal-v2.jsonl",
  privateDir: ".planning/artifacts/v1.38-current-matrix-retry-private-v2",
  terminal: ".planning/artifacts/v1.38-current-matrix-retry-terminal-v2.json",
  reproduction:
    ".planning/artifacts/v1.38-current-matrix-reproduction-v16.json",
  manifest:
    ".planning/artifacts/v1.38-plan-262-historical-live-receipt-manifest-v2.json",
  disposition:
    ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
  correctionV3:
    ".planning/artifacts/v1.38-plan-262-post-run-audit-correction-v3.json",
  activation:
    ".planning/artifacts/v1.38-foundation-activation-root-route10.json",
})

const SOURCE_PATHS = Object.freeze([
  V138_PLAN_262_88_PATHS.sourceSummary,
  V138_PLAN_262_88_PATHS.sourceController,
  V138_PLAN_262_88_PATHS.sourceModel,
  V138_PLAN_262_88_PATHS.sourceTests,
])
const REVIEW_PATHS = Object.freeze([
  V138_PLAN_262_88_PATHS.review,
  V138_PLAN_262_88_PATHS.reviewReport,
  V138_PLAN_262_88_PATHS.reviewSummary,
])
const HISTORICAL_PATHS = Object.freeze([
  V138_PLAN_262_88_PATHS.correctionV2,
  V138_PLAN_262_88_PATHS.historicalManifest,
  V138_PLAN_262_88_PATHS.historicalEnvelope,
  V138_PLAN_262_88_PATHS.historicalJournal,
  V138_PLAN_262_88_PATHS.historicalTerminal,
  V138_PLAN_262_88_PATHS.historicalSeal,
  V138_PLAN_262_88_PATHS.historicalDisposition,
  V138_PLAN_262_88_PATHS.historicalLifecycle,
])

const EXPECTED = Object.freeze({
  sourceBase: "9e7087b34f0bd6fa12d8b265f09d4c656eb044b0",
  sourceBaseTree: "98e633df3870c944adaa9c5dc553a6df367da354",
  authorization: "453a33a10c247fb9c75e969ed4ab63646b16b488",
  authorizationTree: "32626e7f24b7262e461cb1e12c3efb691dbb5739",
  reviewedSource: "7a829707900d646c943535a82fbc718de93aec95",
  reviewedSourceTree: "a9d8b45a3d0d37d07b56d03de3c115ba83220c4d",
  reviewedSourceParent: "92b14663c625a29268ac31e8de3ce982d06cc31b",
  closure: "bd236adc26469cfa1ad26f4f75071c9d4e84de6a",
  pairCommit: "9314d1d21d9a6d3b4ee0750b09dc27bae13b580f",
  liveCommit: "c5a4fc4bc35d3d50ea84fa493e8eaac29e6f8b96",
  reviewRoot:
    "sha256:cb2caa67fb06d18ecbd55ade040a80f7c1fa90505cc37b6a7079722c14e9544b",
  localSealRoot:
    "sha256:4385ac8270b649f0876c7846cfc75bdc3682b8526d3ab517736ff27f01ab4b3b",
  correctionV2Root:
    "sha256:0d132bf4b59fd0203dba5fa49763bb2ec7568e1b84881f1908f114cd680ba026",
  protectedHistoryRoot:
    "sha256:9e7aacdb310acfd9803278db0d2a8ea3babd86c1f499c7f86f48683dcd466447",
  sealRoot:
    "sha256:b4fa466f9bc437b0b1cc5e22d7c1faf7ac91ea7c57e78be6c9fb9c33f5e83b7a",
  envelopeRoot:
    "sha256:b38c2d444f60bceba83dfd96d304fa2632b3a05975ef715241d1653ceeade3c7",
  journalRoot:
    "sha256:fb2f09f15e2dc201fcb8f5094e16ee4252ea370e322bb476d02067a03c89753a",
  historicalManifestRoot:
    "sha256:cbafd7aaedef7b8f8c9d596a79c914482df40300fc0142e912db2754fe39a4b7",
})

const EXPECTED_POLICY = Object.freeze({
  assuranceClass: "single_operator_local_seal_v1",
  calibrationAttemptsPerRoute: 8,
  calibrationFailureBackoffMilliseconds: 900_000,
  calibrationShardCount: 4,
  candidateSearchAuthorized: false,
  envelopeLifetimeMilliseconds: 14_400_000,
  formationMaterializationAuthorized: false,
  gameplayChangeAuthorized: false,
  holdoutOpeningAuthorized: false,
  maximumPreflightObservations: 12,
  maximumReproductionRuns: 1,
  maximumRouteStarts: 3,
  minimumEffectiveAvailableBasisPoints: 2_500,
  partialAcceptedEvidenceReusable: false,
  phase263PlanningAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  publicAuthorized: false,
  refusalSpacingMilliseconds: 300_000,
  reproductionCellCount: 540,
  rulesAuthority: "MATCH_KERNEL",
  samplingMilliseconds: 200,
  schemaVersion: "retry-envelope:v2",
  supervisedRuntimeOnly: true,
})

const HISTORICAL_HASHES = Object.freeze({
  [V138_PLAN_262_88_PATHS.correctionV2]:
    "sha256:94597b4c65d31ea5322cb90262d8e180406f8bfcd1d7f46d3c260f71ccfa2bec",
  [V138_PLAN_262_88_PATHS.historicalManifest]:
    "sha256:611e0e8b12e06593b56b5625d37bf9a8113920bace6b590c2a59c7bfafaa1c16",
  [V138_PLAN_262_88_PATHS.historicalEnvelope]:
    "sha256:3683a02dc8c075d7e175c591967dfc5d470de56bb2c0ffe916fb09c13bb4d9f4",
  [V138_PLAN_262_88_PATHS.historicalJournal]:
    "sha256:14e66af5c9fc985ef01cbc83efae35ea2a1ae20f1c9b10de0cd2e732dd667a14",
  [V138_PLAN_262_88_PATHS.historicalTerminal]:
    "sha256:b79dc330212880f8e6b9d41bee701b380fbc92f2e82682159343e54ae8748ac3",
  [V138_PLAN_262_88_PATHS.historicalSeal]:
    "sha256:0091b634e49a94863f6cbb12b9e06f181b729eb32dc9e97ba73dda0bb6359e6b",
  [V138_PLAN_262_88_PATHS.historicalDisposition]:
    "sha256:7c44d03acee04f441e0c4132f6c611b9d84925540a81d954ba51104aaec938bb",
  [V138_PLAN_262_88_PATHS.historicalLifecycle]:
    "sha256:c0bdb131ce6804f9708899079049ee4583916646deebec5bcc757f68c1410b5e",
} as Record<string, Sha256>)

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
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const lines = (value: string): string[] =>
  value.trim() === "" ? [] : value.trim().split("\n")
const isSha = (value: unknown): value is Sha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const rootWithout = (domain: string, value: any, key: string): Sha256 => {
  const body = clone(value)
  delete body[key]
  return sha256(`${domain}\0${canonical(body)}`)
}
const git = (root: string, args: readonly string[]): string =>
  execFileSync("git", [...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim()
const gitBytes = (root: string, commit: string, repoPath: string): Buffer =>
  execFileSync("git", ["show", `${commit}:${repoPath}`], {
    cwd: root,
    maxBuffer: 32 * 1024 * 1024,
  })
const isAncestor = (root: string, commit: string): boolean => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
      cwd: root,
      stdio: "ignore",
    })
    return true
  } catch {
    return false
  }
}

const resolveContained = (root: string, repoPath: string): string => {
  if (path.isAbsolute(repoPath)) fail("V138_PLAN_262_88_PATH_UNSAFE")
  const resolvedRoot = path.resolve(root)
  const target = path.resolve(resolvedRoot, repoPath)
  const relative = path.relative(resolvedRoot, target)
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    fail("V138_PLAN_262_88_PATH_UNSAFE")
  return target
}

const containedStatus = (root: string, repoPath: string): SafeStatus => {
  const resolvedRoot = path.resolve(root)
  const target = resolveContained(root, repoPath)
  const relative = path.relative(resolvedRoot, target)
  let current = resolvedRoot
  try {
    const rootStat = lstatSync(current)
    if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) return "unsafe"
    const components = relative.split(path.sep)
    for (const component of components.slice(0, -1)) {
      current = path.join(current, component)
      const stat = lstatSync(current)
      if (!stat.isDirectory() || stat.isSymbolicLink()) return "unsafe"
    }
    const stat = lstatSync(target)
    if (stat.isSymbolicLink()) return "unsafe"
    if (stat.isFile()) return "regular"
    if (stat.isDirectory()) return "directory"
    return "unsafe"
  } catch (error) {
    if ((error as { code?: string }).code === "ENOENT") {
      const parent = path.dirname(target)
      try {
        const parentStat = lstatSync(parent)
        return parentStat.isDirectory() && !parentStat.isSymbolicLink()
          ? "absent"
          : "unsafe"
      } catch {
        return "unsafe"
      }
    }
    return "unsafe"
  }
}

const readRegular = (root: string, repoPath: string): Buffer => {
  if (containedStatus(root, repoPath) !== "regular")
    fail("V138_PLAN_262_88_INPUT_UNSAFE")
  const target = resolveContained(root, repoPath)
  const fd = openSync(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    return readFileSync(fd)
  } finally {
    closeSync(fd)
  }
}

const readJson = (root: string, repoPath: string): any => {
  const bytes = readRegular(root, repoPath).toString("utf8")
  return JSON.parse(bytes)
}

const gitMetadata = (root: string, commit: string) => {
  const [hash, parents, tree] = git(root, [
    "show",
    "-s",
    "--format=%H%n%P%n%T",
    commit,
  ]).split("\n")
  return { hash, parents, tree }
}

const changedPaths = (root: string, commit: string): string[] =>
  lines(
    git(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]),
  ).sort()

const pathUnrewritten = (
  root: string,
  sinceCommit: string,
  repoPath: string,
): boolean =>
  lines(
    git(root, ["log", "--format=%H", `${sinceCommit}..HEAD`, "--", repoPath]),
  ).length === 0

const scanUnsafeKeys = (value: unknown): string[] => {
  const forbidden = new Set([
    "strategySource",
    "strategyMemory",
    "soldierMemory",
    "objectivePayload",
    "rawDiagnostics",
    "commitmentSecret",
    "environment",
    "hostPath",
  ])
  const found = new Set<string>()
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) return item.forEach(visit)
    if (item === null || typeof item !== "object") return
    for (const [key, child] of Object.entries(item)) {
      if (forbidden.has(key)) found.add(key)
      visit(child)
    }
  }
  visit(value)
  return [...found].sort()
}

const inspectGitCustody = (root: string, receiptNames: string[]) => {
  const reviewed = gitMetadata(root, EXPECTED.reviewedSource)
  const closure = gitMetadata(root, EXPECTED.closure)
  const pair = gitMetadata(root, EXPECTED.pairCommit)
  const authorization = gitMetadata(root, EXPECTED.authorization)
  const livePaths = [
    V138_PLAN_262_88_PATHS.journal,
    V138_PLAN_262_88_PATHS.terminal,
    ...receiptNames.map(
      (name) => `${V138_PLAN_262_88_PATHS.privateDir}/${name}`,
    ),
  ].sort()
  const sourceBytes = SOURCE_PATHS.map((repoPath) => ({
    repoPath,
    sha256: sha256(readRegular(root, repoPath)),
  }))
  const inputs = [
    ...SOURCE_PATHS,
    ...REVIEW_PATHS,
    ...HISTORICAL_PATHS,
    V138_PLAN_262_88_PATHS.localSeal,
    V138_PLAN_262_88_PATHS.seal,
    V138_PLAN_262_88_PATHS.envelope,
    ...livePaths,
  ]
  return {
    repoRoot: path.resolve(root),
    sourceRoot: sha256(canonical(sourceBytes)),
    sourceReviewedCommitExact:
      reviewed.hash === EXPECTED.reviewedSource &&
      reviewed.parents === EXPECTED.reviewedSourceParent &&
      reviewed.tree === EXPECTED.reviewedSourceTree,
    sourceCurrentMatchesReviewed: SOURCE_PATHS.every((repoPath) =>
      gitBytes(root, EXPECTED.reviewedSource, repoPath).equals(
        readRegular(root, repoPath),
      ),
    ),
    sourceUnrewritten: SOURCE_PATHS.every((repoPath) =>
      pathUnrewritten(root, EXPECTED.reviewedSource, repoPath),
    ),
    reviewClosureExact:
      closure.hash === EXPECTED.closure &&
      REVIEW_PATHS.every((repoPath) =>
        gitBytes(root, EXPECTED.closure, repoPath).equals(
          readRegular(root, repoPath),
        ),
      ),
    reviewUnrewritten: REVIEW_PATHS.every((repoPath) =>
      pathUnrewritten(root, EXPECTED.closure, repoPath),
    ),
    sourceBaseTreeExact:
      git(root, ["rev-parse", `${EXPECTED.sourceBase}^{tree}`]) ===
      EXPECTED.sourceBaseTree,
    authorizationJoinExact:
      authorization.hash === EXPECTED.authorization &&
      authorization.parents === EXPECTED.sourceBase &&
      authorization.tree === EXPECTED.authorizationTree,
    pairDirectChild:
      pair.hash === EXPECTED.pairCommit && pair.parents === EXPECTED.closure,
    pairPathsExact:
      canonical(changedPaths(root, EXPECTED.pairCommit)) ===
      canonical(
        [V138_PLAN_262_88_PATHS.envelope, V138_PLAN_262_88_PATHS.seal].sort(),
      ),
    livePathsExact:
      canonical(changedPaths(root, EXPECTED.liveCommit)) ===
      canonical(livePaths),
    evidenceUnrewritten: livePaths.every((repoPath) =>
      pathUnrewritten(root, EXPECTED.liveCommit, repoPath),
    ),
    allCommitsOnHead: [
      EXPECTED.sourceBase,
      EXPECTED.authorization,
      EXPECTED.reviewedSource,
      EXPECTED.closure,
      EXPECTED.pairCommit,
      EXPECTED.liveCommit,
    ].every((commit) => isAncestor(root, commit)),
    clean: git(root, ["status", "--porcelain", "--", ...inputs]) === "",
  }
}

export const loadV138Plan26288Evidence = (root: string): any => {
  const review = readJson(root, V138_PLAN_262_88_PATHS.review)
  const localSeal = readJson(root, V138_PLAN_262_88_PATHS.localSeal)
  const correctionV2 = readJson(root, V138_PLAN_262_88_PATHS.correctionV2)
  const historicalManifest = readJson(
    root,
    V138_PLAN_262_88_PATHS.historicalManifest,
  )
  const seal = readJson(root, V138_PLAN_262_88_PATHS.seal)
  const envelope = readJson(root, V138_PLAN_262_88_PATHS.envelope)
  const journalBytes = readRegular(
    root,
    V138_PLAN_262_88_PATHS.journal,
  ).toString("utf8")
  const journal = lines(journalBytes).map((line) => JSON.parse(line))
  const terminalBytes = readRegular(
    root,
    V138_PLAN_262_88_PATHS.terminal,
  ).toString("utf8")
  const terminal = JSON.parse(terminalBytes)
  const privateStatus = containedStatus(root, V138_PLAN_262_88_PATHS.privateDir)
  if (privateStatus !== "directory") fail("V138_PLAN_262_88_PRIVATE_DIR_UNSAFE")
  const privateTarget = resolveContained(
    root,
    V138_PLAN_262_88_PATHS.privateDir,
  )
  const privateNames = readdirSync(privateTarget).sort()
  const privateReceipts = privateNames.map((name) => {
    if (!/^journal-record-[0-9]{4}\.json$/u.test(name))
      fail("V138_PLAN_262_88_PRIVATE_RECEIPT_NAME_INVALID")
    const repoPath = `${V138_PLAN_262_88_PATHS.privateDir}/${name}`
    const bytes = readRegular(root, repoPath)
    return {
      name,
      repoPath,
      bytes: bytes.toString("utf8"),
      byteLength: bytes.byteLength,
      sha256: sha256(bytes),
      mode: statSync(resolveContained(root, repoPath)).mode & 0o777,
      gitBlob: git(root, ["rev-parse", `${EXPECTED.liveCommit}:${repoPath}`]),
    }
  })
  const reproductionStatus = containedStatus(
    root,
    V138_PLAN_262_88_PATHS.reproduction,
  )
  const terminalClaimsExactSuccess =
    terminal?.schemaVersion === "v1.38-current-matrix-retry-terminal-v2" &&
    terminal.disposition === "succeeded" &&
    terminal.counters?.acceptedCells === 540 &&
    terminal.counters?.reproductionIdentitiesCharged === 540 &&
    terminal.freshAccepted === 540 &&
    terminal.completeCleanup === true
  const reproduction =
    terminalClaimsExactSuccess && reproductionStatus === "regular"
      ? readJson(root, V138_PLAN_262_88_PATHS.reproduction)
      : null
  const destinationStatus = {
    manifest: containedStatus(root, V138_PLAN_262_88_PATHS.manifest),
    disposition: containedStatus(root, V138_PLAN_262_88_PATHS.disposition),
    correctionV3: containedStatus(root, V138_PLAN_262_88_PATHS.correctionV3),
    activation: containedStatus(root, V138_PLAN_262_88_PATHS.activation),
  }
  return {
    review,
    localSeal,
    correctionV2,
    historicalManifest,
    historicalBytes: Object.fromEntries(
      HISTORICAL_PATHS.map((repoPath) => [
        repoPath,
        sha256(readRegular(root, repoPath)),
      ]),
    ),
    seal,
    envelope,
    journal,
    journalBytes,
    journalSha256: sha256(journalBytes),
    terminal,
    terminalBytes,
    terminalSha256: sha256(terminalBytes),
    privateReceipts,
    privateDirMode: statSync(privateTarget).mode & 0o777,
    reproductionStatus,
    reproduction,
    sourceText: {
      controller: readRegular(
        root,
        V138_PLAN_262_88_PATHS.sourceController,
      ).toString("utf8"),
      model: readRegular(root, V138_PLAN_262_88_PATHS.sourceModel).toString(
        "utf8",
      ),
    },
    canonicalEvidence: [
      V138_PLAN_262_88_PATHS.review,
      V138_PLAN_262_88_PATHS.correctionV2,
      V138_PLAN_262_88_PATHS.historicalManifest,
      V138_PLAN_262_88_PATHS.seal,
      V138_PLAN_262_88_PATHS.envelope,
      V138_PLAN_262_88_PATHS.terminal,
    ].every((repoPath) => {
      const bytes = readRegular(root, repoPath).toString("utf8")
      return bytes === canonical(JSON.parse(bytes))
    }),
    unsafeProjectionKeys: scanUnsafeKeys({ journal, terminal, reproduction }),
    custody: inspectGitCustody(root, privateNames),
    destinationStatus,
  }
}

type Replay = {
  reasonCodes: string[]
  disposition: "active" | "succeeded" | "terminal_failure" | "exhausted"
  terminalReason: "time_window_expired" | null
  journalRoot: Sha256
  stateRoot: Sha256
  counters: {
    preflightObservationsConsumed: number
    routeStartsConsumed: number
    calibrationIdentitiesCharged: number
    reproductionIdentitiesCharged: number
    acceptedCells: number
  }
  completeCleanup: boolean
  reproductionRoot: Sha256 | null
}

const GENESIS_ROOT = sha256("v138-bounded-retry-journal-genesis-v2")

export const reconstructV138Plan26288Journal = (
  envelope: any,
  records: any[],
): Replay => {
  const reasons: string[] = []
  const add = (code: string): void => {
    if (!reasons.includes(code)) reasons.push(code)
  }
  const preflightReservations = new Map<string, string>()
  const observations = new Map<string, number>()
  const routes = new Map<string, { owner: string; preflight: string }>()
  const calibrations = new Map<string, string[]>()
  const finishes = new Map<string, any>()
  let reproductionRoute: string | null = null
  let reproductionTerminal: any = null
  let firstObservation: number | null = null
  let lastRefusal: number | null = null
  let lastFailure: number | null = null
  let expiryCount = 0
  let integrityFailure = false
  let terminalReached = false
  let previousRoot: string = GENESIS_ROOT
  let previousTime = -1

  const semantic = (): void => add("JOURNAL_SEMANTICS_INVALID")
  for (let ordinal = 0; ordinal < records.length; ordinal += 1) {
    const record = records[ordinal]
    const { recordRoot, ...body } = record ?? {}
    if (
      record?.schemaVersion !== "v1.38-bounded-retry-journal-record-v2" ||
      record.ordinal !== ordinal ||
      record.envelopeRoot !== envelope?.envelopeRoot ||
      record.previousRoot !== previousRoot ||
      !Number.isSafeInteger(record.atMilliseconds) ||
      record.atMilliseconds < 0 ||
      record.atMilliseconds < previousTime ||
      !isSha(recordRoot) ||
      recordRoot !== sha256(`v138-retry-journal-record-v2\0${canonical(body)}`)
    ) {
      add("JOURNAL_CHAIN_INVALID")
    }
    const ownerValid = record?.owner === "repository_operator"
    if (!ownerValid || terminalReached) semantic()
    const now = Number.isSafeInteger(record?.atMilliseconds)
      ? record.atMilliseconds
      : previousTime
    const cleanupReconciliation =
      (record?.kind === "finish_calibration" &&
        record.status === "system_failure" &&
        record.completeCleanup === false &&
        calibrations.has(record.routeIdentity) &&
        !finishes.has(record.routeIdentity)) ||
      (record?.kind === "finish_reproduction" &&
        record.status === "system_failure" &&
        record.acceptedCells === 0 &&
        record.completeCleanup === false &&
        reproductionRoute !== null &&
        reproductionTerminal === null)
    if (
      record?.kind !== "time_window_expired" &&
      firstObservation !== null &&
      now >= firstObservation + EXPECTED_POLICY.envelopeLifetimeMilliseconds &&
      !cleanupReconciliation
    )
      semantic()

    switch (record?.kind) {
      case "reserve_preflight": {
        const expected = `preflight:v2:${preflightReservations.size}`
        if (
          record.identity !== expected ||
          preflightReservations.has(record.identity) ||
          [...preflightReservations.keys()].some((identity) =>
            identity.includes(":v1:"),
          ) ||
          (lastRefusal !== null &&
            now < lastRefusal + EXPECTED_POLICY.refusalSpacingMilliseconds) ||
          (lastFailure !== null &&
            now <
              lastFailure +
                EXPECTED_POLICY.calibrationFailureBackoffMilliseconds)
        )
          semantic()
        preflightReservations.set(record.identity, record.owner)
        break
      }
      case "observe_preflight": {
        if (
          preflightReservations.get(record.identity) !== record.owner ||
          observations.has(record.identity) ||
          !Number.isSafeInteger(record.effectiveAvailableBasisPoints) ||
          record.effectiveAvailableBasisPoints < 0 ||
          record.effectiveAvailableBasisPoints > 10_000
        )
          semantic()
        observations.set(record.identity, record.effectiveAvailableBasisPoints)
        firstObservation ??= now
        if (
          record.effectiveAvailableBasisPoints <
          EXPECTED_POLICY.minimumEffectiveAvailableBasisPoints
        )
          lastRefusal = now
        break
      }
      case "reserve_route": {
        const expected = `route:v2:${routes.size}`
        if (
          record.identity !== expected ||
          routes.has(record.identity) ||
          preflightReservations.get(record.preflightIdentity) !==
            record.owner ||
          !observations.has(record.preflightIdentity) ||
          (observations.get(record.preflightIdentity) ?? -1) <
            EXPECTED_POLICY.minimumEffectiveAvailableBasisPoints ||
          [...routes.values()].some(
            ({ preflight }) => preflight === record.preflightIdentity,
          )
        )
          semantic()
        routes.set(record.identity, {
          owner: record.owner,
          preflight: record.preflightIdentity,
        })
        break
      }
      case "reserve_calibration": {
        const routeOrdinal = Number(
          String(record.routeIdentity).split(":").at(-1),
        )
        const expected = Array.from(
          { length: EXPECTED_POLICY.calibrationAttemptsPerRoute },
          (_, attempt) => `calibration:v2:${routeOrdinal}:${attempt}`,
        )
        if (
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          !Number.isInteger(routeOrdinal) ||
          routeOrdinal < 0 ||
          routeOrdinal >= EXPECTED_POLICY.maximumRouteStarts ||
          calibrations.has(record.routeIdentity) ||
          canonical(record.identities) !== canonical(expected)
        )
          semantic()
        calibrations.set(record.routeIdentity, [...(record.identities ?? [])])
        break
      }
      case "finish_calibration": {
        if (
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          !calibrations.has(record.routeIdentity) ||
          finishes.has(record.routeIdentity) ||
          !["admitted", "system_failure"].includes(record.status) ||
          typeof record.completeCleanup !== "boolean" ||
          !isSha(record.supervisionRoot) ||
          (record.status === "admitted" && !record.completeCleanup)
        )
          semantic()
        finishes.set(record.routeIdentity, record)
        if (!record.completeCleanup) {
          integrityFailure = true
          terminalReached = true
        } else if (record.status === "system_failure") {
          lastFailure = now
        }
        if (
          routes.size === EXPECTED_POLICY.maximumRouteStarts &&
          finishes.size === EXPECTED_POLICY.maximumRouteStarts &&
          [...finishes.values()].every(
            (finish) =>
              finish.status === "system_failure" && finish.completeCleanup,
          )
        )
          terminalReached = true
        break
      }
      case "reserve_reproduction": {
        const expected = Array.from(
          { length: EXPECTED_POLICY.reproductionCellCount },
          (_, index) => `reproduction:v2:${index}`,
        )
        if (
          reproductionRoute !== null ||
          finishes.get(record.routeIdentity)?.status !== "admitted" ||
          finishes.get(record.routeIdentity)?.completeCleanup !== true ||
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          canonical(record.identities) !== canonical(expected)
        )
          semantic()
        reproductionRoute = record.routeIdentity
        break
      }
      case "finish_reproduction": {
        if (
          reproductionRoute !== record.routeIdentity ||
          reproductionTerminal !== null ||
          routes.get(record.routeIdentity)?.owner !== record.owner ||
          !["passed_exact", "system_failure"].includes(record.status) ||
          !Number.isSafeInteger(record.acceptedCells) ||
          record.acceptedCells < 0 ||
          record.acceptedCells > EXPECTED_POLICY.reproductionCellCount ||
          typeof record.completeCleanup !== "boolean" ||
          (record.status === "passed_exact" &&
            (record.acceptedCells !== EXPECTED_POLICY.reproductionCellCount ||
              record.completeCleanup !== true ||
              !isSha(record.reproductionRoot)))
        )
          semantic()
        reproductionTerminal = record
        if (!record.completeCleanup) integrityFailure = true
        terminalReached = true
        break
      }
      case "time_window_expired": {
        expiryCount += 1
        if (
          record.reason !== "time_window_expired" ||
          expiryCount !== 1 ||
          firstObservation === null ||
          now < firstObservation + EXPECTED_POLICY.envelopeLifetimeMilliseconds
        )
          semantic()
        terminalReached = true
        break
      }
      default:
        semantic()
    }
    previousRoot = isSha(recordRoot) ? recordRoot : previousRoot
    previousTime = now
  }

  if (
    preflightReservations.size > EXPECTED_POLICY.maximumPreflightObservations ||
    routes.size > EXPECTED_POLICY.maximumRouteStarts ||
    calibrations.size > EXPECTED_POLICY.maximumRouteStarts
  )
    semantic()
  const calibrationCount = [...calibrations.values()].reduce(
    (count, identities) => count + identities.length,
    0,
  )
  let disposition: Replay["disposition"] = "active"
  if (expiryCount === 1) disposition = "exhausted"
  else if (reproductionTerminal !== null)
    disposition =
      reproductionTerminal.status === "passed_exact" &&
      reproductionTerminal.acceptedCells === 540 &&
      reproductionTerminal.completeCleanup
        ? "succeeded"
        : "terminal_failure"
  else if (integrityFailure) disposition = "terminal_failure"
  else if (
    routes.size === 3 &&
    finishes.size === 3 &&
    [...finishes.values()].every(
      (finish) => finish.status === "system_failure" && finish.completeCleanup,
    )
  )
    disposition = "exhausted"
  else if (
    preflightReservations.size === 12 &&
    observations.size === 12 &&
    [...observations.values()].every((value) => value < 2_500)
  )
    disposition = "exhausted"
  const completeCleanup =
    calibrations.size === finishes.size &&
    [...finishes.values()].every((finish) => finish.completeCleanup === true) &&
    (reproductionRoute === null ||
      reproductionTerminal?.completeCleanup === true)
  const terminal = disposition !== "active"
  const stateBody = {
    schemaVersion: "v1.38-bounded-retry-derived-state-v2",
    journalRoot: records.at(-1)?.recordRoot ?? GENESIS_ROOT,
    preflightObservationsConsumed: preflightReservations.size,
    routeStartsConsumed: routes.size,
    calibrationIdentitiesCharged: calibrationCount,
    reproductionIdentitiesCharged: reproductionRoute === null ? 0 : 540,
    acceptedCells: disposition === "succeeded" ? 540 : 0,
    remainingPreflightObservations: terminal
      ? 0
      : 12 - preflightReservations.size,
    remainingRouteStarts: terminal ? 0 : 3 - routes.size,
    nextPreflightIdentity: terminal
      ? null
      : `preflight:v2:${preflightReservations.size}`,
    nextRouteIdentity: terminal ? null : `route:v2:${routes.size}`,
    protectedHistoricalIdentityCount:
      envelope?.protectedHistoricalIdentities?.length,
    firstObservationMilliseconds: firstObservation,
    terminalReason: expiryCount === 1 ? "time_window_expired" : null,
    completeCleanup,
    disposition,
    downstreamAuthority: false,
  }
  return {
    reasonCodes: reasons.sort(),
    disposition,
    terminalReason: stateBody.terminalReason as "time_window_expired" | null,
    journalRoot: stateBody.journalRoot,
    stateRoot: sha256(`v138-retry-derived-state-v2\0${canonical(stateBody)}`),
    counters: {
      preflightObservationsConsumed: preflightReservations.size,
      routeStartsConsumed: routes.size,
      calibrationIdentitiesCharged: calibrationCount,
      reproductionIdentitiesCharged: reproductionRoute === null ? 0 : 540,
      acceptedCells: disposition === "succeeded" ? 540 : 0,
    },
    completeCleanup,
    reproductionRoot: isSha(reproductionTerminal?.reproductionRoot)
      ? reproductionTerminal.reproductionRoot
      : null,
  }
}

const expectedTerminal = (replay: Replay): any => ({
  schemaVersion: "v1.38-current-matrix-retry-terminal-v2",
  terminalReason: replay.terminalReason,
  journalRoot: replay.journalRoot,
  stateRoot: replay.stateRoot,
  disposition: replay.disposition,
  counters: replay.counters,
  freshAccepted: replay.counters.acceptedCells,
  completeCleanup: replay.completeCleanup,
  downstreamAuthority: "denied",
  productionAuthorized: false,
})

const validateReproduction = (value: any, replay: Replay): boolean =>
  value?.schemaVersion === "v1.38-current-matrix-reproduction-v16" &&
  value.status === "passed_exact" &&
  value.chargedAttemptCount === 540 &&
  value.acceptedCellCount === 540 &&
  value.completeCleanup === true &&
  value.runtimeRoute === "v1.18/v1.19/MATCH_KERNEL" &&
  value.samplingMilliseconds === 200 &&
  value.partialAcceptedEvidenceReusable === false &&
  isSha(value.admittedCalibrationRoot) &&
  isSha(value.executionRoot) &&
  value.receiptRoot === replay.reproductionRoot &&
  value.receiptRoot ===
    rootWithout("v138-current-matrix-reproduction-v16", value, "receiptRoot") &&
  Object.values(value.privacyProjection ?? {}).every(
    (item) => item === false,
  ) &&
  [
    "phase263PlanningAuthorized",
    "candidateSearchAuthorized",
    "formationMaterializationAuthorized",
    "holdoutOpeningAuthorized",
    "publicAuthorized",
    "productAuthorized",
    "productionAuthorized",
  ].every((key) => value[key] === false)

const falseAuthority = (activate = false) => ({
  foundationActivationAuthorized: activate,
  phase263PlanningAuthorized: activate,
  phase263ExecutionAuthorized: false,
  candidateSearchAuthorized: false,
  formationMaterializationAuthorized: false,
  holdoutOpeningAuthorized: false,
  publicAuthorized: false,
  productAuthorized: false,
  productionAuthorized: false,
  countedPlayAuthorized: false,
  gameplayChangeAuthorized: false,
  archiveAuthorized: false,
  tagAuthorized: false,
})

const buildManifest = (evidence: any, replay: Replay): any => {
  const historical = evidence.historicalManifest
  const v2Receipts = evidence.privateReceipts.map((receipt: any) => ({
    repoPath: receipt.repoPath,
    sha256: receipt.sha256,
    byteLength: receipt.byteLength,
    gitBlob: receipt.gitBlob,
  }))
  const v2PrivateRoot = sha256(canonical(v2Receipts))
  const body = {
    schemaVersion: "v1.38-plan-262-historical-live-receipt-manifest-v2",
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    generations: [
      {
        generation: "v1",
        immutable: true,
        liveCommit: historical.liveCommit,
        journal: historical.journal,
        terminal: historical.terminal,
        receiptCount: historical.receiptCount,
        privateReceiptRoot: historical.privateReceiptRoot,
        receipts: historical.receipts,
        counters: {
          routeStartsCharged: 3,
          preflightObservationsCharged: 3,
          calibrationIdentitiesCharged: 24,
          reproductionIdentitiesCharged: 0,
          freshAccepted: 0,
        },
      },
      {
        generation: "v2",
        immutable: true,
        liveCommit: EXPECTED.liveCommit,
        journal: {
          repoPath: V138_PLAN_262_88_PATHS.journal,
          sha256: evidence.journalSha256,
          byteLength: Buffer.byteLength(evidence.journalBytes),
          gitBlob: git(evidence.repoRoot, [
            "rev-parse",
            `${EXPECTED.liveCommit}:${V138_PLAN_262_88_PATHS.journal}`,
          ]),
        },
        terminal: {
          repoPath: V138_PLAN_262_88_PATHS.terminal,
          sha256: evidence.terminalSha256,
          byteLength: Buffer.byteLength(evidence.terminalBytes),
          gitBlob: git(evidence.repoRoot, [
            "rev-parse",
            `${EXPECTED.liveCommit}:${V138_PLAN_262_88_PATHS.terminal}`,
          ]),
        },
        receiptCount: v2Receipts.length,
        privateReceiptRoot: v2PrivateRoot,
        receipts: v2Receipts,
        counters: {
          routeStartsCharged: replay.counters.routeStartsConsumed,
          preflightObservationsCharged:
            replay.counters.preflightObservationsConsumed,
          calibrationIdentitiesCharged:
            replay.counters.calibrationIdentitiesCharged,
          reproductionIdentitiesCharged:
            replay.counters.reproductionIdentitiesCharged,
          freshAccepted: replay.counters.acceptedCells,
        },
      },
    ],
    cumulative: {
      routeStartsCharged: 3 + replay.counters.routeStartsConsumed,
      preflightObservationsCharged:
        3 + replay.counters.preflightObservationsConsumed,
      calibrationIdentitiesCharged:
        24 + replay.counters.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged:
        replay.counters.reproductionIdentitiesCharged,
      freshAccepted: replay.counters.acceptedCells,
      requiredAccepted: 540,
    },
    privacyProjection: {
      privatePayloadIncluded: false,
      strategySourceIncluded: false,
      strategyMemoryIncluded: false,
      soldierMemoryIncluded: false,
      objectivePayloadIncluded: false,
      rawDiagnosticsIncluded: false,
      hostDataIncluded: false,
    },
    generationsFungible: false,
    priorChargesReusable: false,
    authority: falseAuthority(false),
  }
  return Object.freeze({
    ...body,
    manifestRoot: sha256(
      `v138-plan262-historical-live-receipt-manifest-v2\0${canonical(body)}`,
    ),
  })
}

export const computeV138Plan26288ManifestRoot = (candidate: any): Sha256 =>
  rootWithout(
    "v138-plan262-historical-live-receipt-manifest-v2",
    candidate,
    "manifestRoot",
  )

const validateHistoricalManifest = (value: any): boolean =>
  value?.schemaVersion ===
    "v1.38-plan-262-historical-live-receipt-manifest-v1" &&
  value.manifestRoot === EXPECTED.historicalManifestRoot &&
  value.manifestRoot ===
    rootWithout(
      "v138-plan262-historical-live-receipt-manifest-v1",
      value,
      "manifestRoot",
    ) &&
  value.liveCommit === "b4be9f5f5207c7eb87c6cd0e8f79863d4877cf3b" &&
  value.receiptCount === 15 &&
  value.receipts?.length === 15 &&
  isSha(value.privateReceiptRoot) &&
  value.empiricalOutcome?.freshAccepted === 0 &&
  value.empiricalOutcome?.requiredAccepted === 540 &&
  value.empiricalOutcome?.terminalDisposition === "exhausted"

const reviewRootValid = (review: any): boolean =>
  review?.reviewRoot === EXPECTED.reviewRoot &&
  review.reviewRoot ===
    rootWithout("v138-plan26285-source-review-v2", review, "reviewRoot") &&
  review.schemaVersion === "v1.38-plan-262-85-bounded-retry-source-review-v2" &&
  review.status === "zero_findings" &&
  review.findingCount === 0 &&
  review.sourceReviewPassed === true &&
  review.reviewProtocol === "fresh-source-only-non-authorizing-review-v2" &&
  review.reviewedSource?.commit === EXPECTED.reviewedSource &&
  review.reviewedSource?.tree === EXPECTED.reviewedSourceTree &&
  review.reviewedSource?.parent === EXPECTED.reviewedSourceParent &&
  review.detachedExercise?.focusedTestsPassed === 81 &&
  review.detachedExercise?.sourceOnlyPassed === true &&
  review.detachedExercise?.canonicalWrites === 0 &&
  review.detachedExercise?.liveInvoked === false &&
  review.protectedHistory?.correctionRoot === EXPECTED.correctionV2Root &&
  review.protectedHistory?.status === "integrity_non_pass" &&
  review.protectedHistory?.historicalBytesMutated === false &&
  review.authority?.plan26286Eligible === true &&
  review.authority?.authorizesExecution === false &&
  review.authority?.liveInvoked === false &&
  review.identityClaims?.independentCustodyClaimed === false

const sealRootValid = (seal: any, evidence: any): boolean =>
  seal?.schemaVersion === "v1.38-successor-source-seal-v12" &&
  seal.sealRoot === EXPECTED.sealRoot &&
  seal.sealRoot ===
    rootWithout("v138-successor-source-seal-v12", seal, "sealRoot") &&
  seal.sourceBaseCommit === EXPECTED.sourceBase &&
  seal.authorizationCommit === EXPECTED.authorization &&
  seal.authorizationSoleParent === EXPECTED.sourceBase &&
  seal.sourceCommit === EXPECTED.closure &&
  seal.directParentCommit === EXPECTED.closure &&
  seal.sourceRoot === evidence.custody.sourceRoot &&
  seal.reviewRoot === EXPECTED.reviewRoot &&
  seal.reviewRoot === evidence.review.reviewRoot &&
  seal.localSealVerificationRoot === EXPECTED.localSealRoot &&
  seal.protectedHistoryRoot === EXPECTED.protectedHistoryRoot &&
  seal.directChild === true &&
  seal.assuranceClass === "single_operator_local_seal_v1" &&
  seal.productionAuthorized === false &&
  seal.downstreamAuthority === "denied"

const envelopeRootValid = (envelope: any, seal: any): boolean =>
  envelope?.schemaVersion === "retry-envelope:v2" &&
  envelope.status === "sealed_inactive" &&
  envelope.envelopeRoot === EXPECTED.envelopeRoot &&
  envelope.envelopeRoot ===
    rootWithout("v138-retry-envelope-v2", envelope, "envelopeRoot") &&
  canonical(envelope.policy) === canonical(EXPECTED_POLICY) &&
  envelope.sourceRoot === seal.sourceRoot &&
  envelope.reviewRoot === seal.reviewRoot &&
  envelope.sealRoot === seal.sealRoot &&
  envelope.protectedHistoryRoot === EXPECTED.protectedHistoryRoot &&
  envelope.protectedHistoricalIdentities?.includes("retry-envelope:v1") &&
  !envelope.protectedHistoricalIdentities?.some(
    (identity: string) =>
      identity.startsWith("route:v2:") ||
      identity.startsWith("preflight:v2:") ||
      identity.startsWith("calibration:v2:") ||
      identity.startsWith("reproduction:v2:"),
  ) &&
  canonical(envelope.counters) ===
    canonical({
      acceptedCells: 0,
      calibrationIdentitiesCharged: 0,
      preflightObservationsConsumed: 0,
      reproductionIdentitiesCharged: 0,
      routeStartsConsumed: 0,
    })

const buildCorrection = (
  assuranceDefects: string[],
  evidence: any,
  replay: Replay,
): any => {
  const body = {
    schemaVersion: "v1.38-plan-262-post-run-audit-correction-v3",
    correctionKind: "additive_v2_post_run_assurance_supersession",
    assuranceDefects: [...assuranceDefects].sort(),
    historical: {
      correctionV2Root: EXPECTED.correctionV2Root,
      v1BytesMutated: false,
      v2LiveBytesMutated: false,
      v2SealRoot: evidence.seal?.sealRoot ?? null,
      v2EnvelopeRoot: evidence.envelope?.envelopeRoot ?? null,
      v2JournalSha256: evidence.journalSha256,
      v2TerminalSha256: evidence.terminalSha256,
    },
    empiricalOutcome: {
      terminalDisposition: replay.disposition,
      freshAccepted: replay.counters.acceptedCells,
      requiredAccepted: 540,
      preserved: true,
    },
    effectiveAssurance: {
      status: "integrity_non_pass",
      integrityPassed: false,
      supersedesV2CleanConclusion: true,
      historicalBytesMutated: false,
    },
    authority: falseAuthority(false),
  }
  return Object.freeze({
    ...body,
    correctionRoot: sha256(
      `v138-plan262-post-run-audit-correction-v3\0${canonical(body)}`,
    ),
  })
}

export const computeV138Plan26288CorrectionRoot = (candidate: any): Sha256 =>
  rootWithout(
    "v138-plan262-post-run-audit-correction-v3",
    candidate,
    "correctionRoot",
  )

export const evaluateV138Plan26288Evidence = (evidence: any): any => {
  const assuranceDefects: string[] = []
  const addDefect = (code: string): void => {
    if (!assuranceDefects.includes(code)) assuranceDefects.push(code)
  }
  if (!evidence.canonicalEvidence) addDefect("CANONICAL_EVIDENCE_INVALID")
  if (!reviewRootValid(evidence.review)) addDefect("SOURCE_REVIEW_INVALID")
  if (
    evidence.localSeal?.schemaVersion !==
      "v1.38-local-seal-independent-verification-v3" ||
    evidence.localSeal.assuranceClass !== "single_operator_local_seal_v1" ||
    evidence.localSeal.satisfiesRevisedSeal01 !== true ||
    evidence.localSeal.findingCount !== 0 ||
    evidence.localSeal.independentCustodyClaimed !== false ||
    evidence.localSeal.verificationRoot !== EXPECTED.localSealRoot
  )
    addDefect("LOCAL_SEAL_INVALID")
  if (
    evidence.correctionV2?.schemaVersion !==
      "v1.38-plan-262-post-run-audit-correction-v2" ||
    evidence.correctionV2.correctionRoot !== EXPECTED.correctionV2Root ||
    evidence.correctionV2.correctionRoot !==
      rootWithout(
        "v138-plan262-post-run-audit-correction-v2",
        evidence.correctionV2,
        "correctionRoot",
      ) ||
    evidence.correctionV2.effectiveAssurance?.status !== "integrity_non_pass" ||
    evidence.correctionV2.effectiveAssurance?.integrityPassed !== false ||
    evidence.correctionV2.effectiveAssurance?.historicalBytesMutated !==
      false ||
    !validateHistoricalManifest(evidence.historicalManifest) ||
    Object.entries(HISTORICAL_HASHES).some(
      ([repoPath, digest]) => evidence.historicalBytes?.[repoPath] !== digest,
    )
  )
    addDefect("PROTECTED_V1_HISTORY_INVALID")
  if (!sealRootValid(evidence.seal, evidence)) addDefect("SEAL_INVALID")
  if (
    canonical(evidence.envelope?.policy) !== canonical(EXPECTED_POLICY) ||
    evidence.envelope?.schemaVersion !== "retry-envelope:v2" ||
    evidence.envelope?.status !== "sealed_inactive"
  )
    addDefect("FROZEN_POLICY_INVALID")
  if (!envelopeRootValid(evidence.envelope, evidence.seal))
    addDefect("ENVELOPE_INVALID")
  if (
    !evidence.custody?.sourceReviewedCommitExact ||
    !evidence.custody?.sourceCurrentMatchesReviewed ||
    !evidence.custody?.sourceUnrewritten ||
    !evidence.custody?.reviewClosureExact ||
    !evidence.custody?.reviewUnrewritten ||
    !evidence.custody?.sourceBaseTreeExact ||
    !evidence.custody?.authorizationJoinExact ||
    !evidence.custody?.pairDirectChild ||
    !evidence.custody?.pairPathsExact ||
    !evidence.custody?.livePathsExact ||
    !evidence.custody?.evidenceUnrewritten ||
    !evidence.custody?.allCommitsOnHead ||
    !evidence.custody?.clean
  )
    addDefect("GIT_CUSTODY_INVALID")
  const modelTokens = [
    'rulesAuthority: "MATCH_KERNEL"',
    "samplingMilliseconds: 200",
    "minimumEffectiveAvailableBasisPoints: 2_500",
    "calibrationAttemptsPerRoute: 8",
    "calibrationShardCount: 4",
    "reproductionCellCount: 540",
    "v138-bounded-retry-journal-genesis-v2",
  ]
  const controllerTokens = [
    "calibrateV138ParallelMatrix",
    "executeV138ParallelMatrix",
    "createV138SubprocessShardRunner",
    'runtimeRoute: "v1.18/v1.19/MATCH_KERNEL"',
    "strategySourceIncluded: false",
    "strategyMemoryIncluded: false",
    "soldierMemoryIncluded: false",
    "objectivePayloadIncluded: false",
    "rawDiagnosticsIncluded: false",
    "/usr/bin/lockf",
  ]
  if (
    modelTokens.some((token) => !evidence.sourceText?.model?.includes(token)) ||
    controllerTokens.some(
      (token) => !evidence.sourceText?.controller?.includes(token),
    )
  )
    addDefect("RUNTIME_KERNEL_CONTRACT_INVALID")
  if (evidence.unsafeProjectionKeys?.length > 0)
    addDefect("PRIVACY_PROJECTION_INVALID")
  if (
    evidence.privateDirMode !== 0o700 ||
    evidence.privateReceipts?.length !== evidence.journal?.length ||
    evidence.privateReceipts?.some(
      (receipt: any, ordinal: number) =>
        receipt.name !==
          `journal-record-${String(ordinal).padStart(4, "0")}.json` ||
        receipt.mode !== 0o600 ||
        receipt.bytes !== canonical(evidence.journal[ordinal]) ||
        receipt.sha256 !== sha256(receipt.bytes) ||
        receipt.byteLength !== Buffer.byteLength(receipt.bytes),
    )
  )
    addDefect("PRIVATE_RECEIPT_INVALID")

  const replay = reconstructV138Plan26288Journal(
    evidence.envelope,
    evidence.journal ?? [],
  )
  replay.reasonCodes.forEach(addDefect)
  if (canonical(evidence.terminal) !== canonical(expectedTerminal(replay)))
    addDefect("TERMINAL_INVALID")
  if (
    evidence.terminal?.downstreamAuthority !== "denied" ||
    evidence.terminal?.productionAuthorized !== false
  )
    addDefect("AUTHORITY_ESCALATION")
  if (
    evidence.reproductionStatus === "unsafe" ||
    evidence.reproductionStatus === "directory"
  )
    addDefect("REPRODUCTION_PATH_UNSAFE")
  const successBranch =
    replay.disposition === "succeeded" &&
    replay.counters.acceptedCells === 540 &&
    replay.counters.reproductionIdentitiesCharged === 540
  if (
    (!successBranch && evidence.reproductionStatus !== "absent") ||
    (successBranch && evidence.reproductionStatus !== "regular")
  )
    addDefect("REPRODUCTION_BRANCH_MISMATCH")
  if (successBranch && !validateReproduction(evidence.reproduction, replay))
    addDefect("REPRODUCTION_EVIDENCE_INVALID")
  if (!replay.completeCleanup) addDefect("CLEANUP_UNCERTAIN")

  assuranceDefects.sort()
  const pass =
    assuranceDefects.length === 0 &&
    successBranch &&
    validateReproduction(evidence.reproduction, replay)
  const reasonCodes: string[] = []
  if (!pass) {
    if (replay.disposition === "exhausted")
      reasonCodes.push("ENVELOPE_EXHAUSTED")
    else if (replay.disposition === "terminal_failure")
      reasonCodes.push("TERMINAL_FAILURE")
    if (replay.counters.acceptedCells !== 540)
      reasonCodes.push("FRESH_ACCEPTED_NOT_540")
    if (
      replay.counters.reproductionIdentitiesCharged === 0 &&
      evidence.reproductionStatus === "absent"
    )
      reasonCodes.push("REPRODUCTION_EVIDENCE_ABSENT")
  }
  const manifest = buildManifest(evidence, replay)
  if (
    computeV138Plan26288ManifestRoot(manifest) !== manifest.manifestRoot ||
    scanUnsafeKeys(manifest).length > 0
  )
    addDefect("MANIFEST_PRIVACY_INVALID")
  assuranceDefects.sort()
  const correction =
    assuranceDefects.length > 0
      ? buildCorrection(assuranceDefects, evidence, replay)
      : null
  const effectivePass = pass && correction === null
  const body = {
    schemaVersion: "v1.38-plan-262-88-admission-disposition-v2",
    status: effectivePass ? "pass" : "non_pass",
    terminalDisposition: replay.disposition,
    reasonCodes: effectivePass ? [] : reasonCodes.sort(),
    assuranceDefects,
    assuranceStatus: assuranceDefects.length === 0 ? "clean" : "defective",
    correctionRequired: correction !== null,
    correctionRoot: correction?.correctionRoot ?? null,
    counters: {
      preflightObservationsConsumed:
        replay.counters.preflightObservationsConsumed,
      routeStartsConsumed: replay.counters.routeStartsConsumed,
      calibrationIdentitiesCharged:
        replay.counters.calibrationIdentitiesCharged,
      reproductionIdentitiesCharged:
        replay.counters.reproductionIdentitiesCharged,
      freshAccepted: replay.counters.acceptedCells,
      requiredAccepted: 540,
    },
    evidence: {
      sourceBaseCommit: EXPECTED.sourceBase,
      authorizationCommit: EXPECTED.authorization,
      reviewedSourceCommit: EXPECTED.reviewedSource,
      reviewedClosureCommit: EXPECTED.closure,
      directChildPairCommit: EXPECTED.pairCommit,
      liveCommit: EXPECTED.liveCommit,
      sourceRoot: evidence.seal?.sourceRoot ?? null,
      sourceReviewRoot: evidence.review?.reviewRoot ?? null,
      sealRoot: evidence.seal?.sealRoot ?? null,
      envelopeRoot: evidence.envelope?.envelopeRoot ?? null,
      protectedHistoryRoot: evidence.envelope?.protectedHistoryRoot ?? null,
      historicalCorrectionRoot: EXPECTED.correctionV2Root,
      localSealVerificationRoot: evidence.localSeal?.verificationRoot ?? null,
      journalRoot: replay.journalRoot,
      journalSha256: evidence.journalSha256,
      stateRoot: replay.stateRoot,
      terminalSha256: evidence.terminalSha256,
      reproductionRoot: evidence.reproduction?.receiptRoot ?? null,
      receiptManifestRoot: manifest.manifestRoot,
    },
    frozenContract: EXPECTED_POLICY,
    integrityPassed: assuranceDefects.length === 0,
    privacySafe:
      evidence.unsafeProjectionKeys?.length === 0 &&
      scanUnsafeKeys(manifest).length === 0,
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    authority: falseAuthority(effectivePass),
  }
  const disposition = Object.freeze({
    ...body,
    dispositionRoot: sha256(
      `v138-plan26288-admission-disposition-v2\0${canonical(body)}`,
    ),
  })
  return Object.freeze({ manifest, disposition, correction, replay })
}

export const computeV138Plan26288DispositionRoot = (candidate: any): Sha256 =>
  rootWithout(
    "v138-plan26288-admission-disposition-v2",
    candidate,
    "dispositionRoot",
  )

export const deriveV138Plan26288NoPublish = (root: string): any =>
  evaluateV138Plan26288Evidence(loadV138Plan26288Evidence(root))

export const computeV138Plan26288ActivationRoot = (disposition: any): any => {
  if (
    disposition?.schemaVersion !==
      "v1.38-plan-262-88-admission-disposition-v2" ||
    disposition.status !== "pass" ||
    disposition.terminalDisposition !== "succeeded" ||
    disposition.integrityPassed !== true ||
    disposition.privacySafe !== true ||
    disposition.assuranceStatus !== "clean" ||
    disposition.correctionRequired !== false ||
    disposition.correctionRoot !== null ||
    disposition.reasonCodes?.length !== 0 ||
    disposition.assuranceDefects?.length !== 0 ||
    disposition.counters?.freshAccepted !== 540 ||
    disposition.counters?.requiredAccepted !== 540 ||
    disposition.counters?.reproductionIdentitiesCharged !== 540 ||
    !isSha(disposition.evidence?.reproductionRoot) ||
    disposition.authority?.foundationActivationAuthorized !== true ||
    disposition.authority?.phase263PlanningAuthorized !== true ||
    disposition.dispositionRoot !==
      computeV138Plan26288DispositionRoot(disposition)
  )
    fail("V138_PLAN_262_88_ACTIVATION_NOT_AUTHORIZED")
  const body = {
    schemaVersion: "v1.38-foundation-activation-root-route10-v1",
    routeOrdinal: 10,
    dispositionRoot: disposition.dispositionRoot,
    receiptManifestRoot: disposition.evidence.receiptManifestRoot,
    sourceRoot: disposition.evidence.sourceRoot,
    sourceReviewRoot: disposition.evidence.sourceReviewRoot,
    sealRoot: disposition.evidence.sealRoot,
    envelopeRoot: disposition.evidence.envelopeRoot,
    protectedHistoryRoot: disposition.evidence.protectedHistoryRoot,
    localSealVerificationRoot: disposition.evidence.localSealVerificationRoot,
    journalRoot: disposition.evidence.journalRoot,
    stateRoot: disposition.evidence.stateRoot,
    reproductionRoot: disposition.evidence.reproductionRoot,
    freshCharged: 540,
    freshAccepted: 540,
    requiredAccepted: 540,
    assuranceClass: "single_operator_local_seal_v1",
    independentCustodyClaimed: false,
    phase263PlanningAuthorized: true,
    phase263ExecutionAuthorized: false,
    candidateSearchAuthorized: false,
    formationMaterializationAuthorized: false,
    holdoutOpeningAuthorized: false,
    publicAuthorized: false,
    productAuthorized: false,
    productionAuthorized: false,
    countedPlayAuthorized: false,
    gameplayChangeAuthorized: false,
    archiveAuthorized: false,
    tagAuthorized: false,
  }
  return Object.freeze({
    ...body,
    activationRoot: sha256(
      `v138-foundation-activation-root-route10-v1\0${canonical(body)}`,
    ),
  })
}

const fsyncParent = (target: string): void => {
  const fd = openSync(path.dirname(target), constants.O_RDONLY)
  try {
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
}

const publishExact = (root: string, repoPath: string, value: any): void => {
  const bytes = canonical(value)
  const status = containedStatus(root, repoPath)
  if (status === "regular") {
    if (readRegular(root, repoPath).toString("utf8") !== bytes)
      fail("V138_PLAN_262_88_DESTINATION_CONFLICT")
    return
  }
  if (status !== "absent") fail("V138_PLAN_262_88_DESTINATION_UNSAFE")
  const target = resolveContained(root, repoPath)
  const fd = openSync(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  )
  try {
    writeFileSync(fd, bytes)
    fsyncSync(fd)
  } finally {
    closeSync(fd)
  }
  fsyncParent(target)
}

const requireAbsent = (root: string, repoPath: string, code: string): void => {
  if (containedStatus(root, repoPath) !== "absent") fail(code)
}

export const publishV138Plan26288Artifacts = (root: string): any => {
  const result = deriveV138Plan26288NoPublish(root)
  requireAbsent(
    root,
    V138_PLAN_262_88_PATHS.activation,
    "V138_PLAN_262_88_PREEXISTING_ACTIVATION",
  )
  if (result.correction === null)
    requireAbsent(
      root,
      V138_PLAN_262_88_PATHS.correctionV3,
      "V138_PLAN_262_88_UNEXPECTED_CORRECTION",
    )
  publishExact(root, V138_PLAN_262_88_PATHS.manifest, result.manifest)
  if (result.correction !== null)
    publishExact(root, V138_PLAN_262_88_PATHS.correctionV3, result.correction)
  publishExact(root, V138_PLAN_262_88_PATHS.disposition, result.disposition)
  if (result.disposition.status === "pass") {
    publishExact(
      root,
      V138_PLAN_262_88_PATHS.activation,
      computeV138Plan26288ActivationRoot(result.disposition),
    )
  } else {
    requireAbsent(
      root,
      V138_PLAN_262_88_PATHS.activation,
      "V138_PLAN_262_88_NONPASS_ACTIVATION_PRESENT",
    )
  }
  return result
}

const validateManifest = (candidate: any, expected: any): true => {
  if (
    candidate?.schemaVersion !==
      "v1.38-plan-262-historical-live-receipt-manifest-v2" ||
    candidate.manifestRoot !== computeV138Plan26288ManifestRoot(candidate) ||
    canonical(candidate) !== canonical(expected) ||
    candidate.generations?.length !== 2 ||
    candidate.generations?.[0]?.generation !== "v1" ||
    candidate.generations?.[1]?.generation !== "v2" ||
    candidate.generations?.some((generation: any) =>
      generation.receipts?.some((receipt: any) => "bytes" in receipt),
    ) ||
    scanUnsafeKeys(candidate).length > 0 ||
    Object.values(candidate.authority ?? {}).some((value) => value !== false)
  )
    fail("V138_PLAN_262_88_MANIFEST_INVALID")
  return true
}

const validateDisposition = (candidate: any, expected: any): true => {
  if (
    candidate?.schemaVersion !== "v1.38-plan-262-88-admission-disposition-v2" ||
    candidate.dispositionRoot !==
      computeV138Plan26288DispositionRoot(candidate) ||
    canonical(candidate) !== canonical(expected) ||
    candidate.counters?.requiredAccepted !== 540 ||
    candidate.assuranceClass !== "single_operator_local_seal_v1" ||
    candidate.independentCustodyClaimed !== false ||
    candidate.authority?.foundationActivationAuthorized !==
      (candidate.status === "pass") ||
    candidate.authority?.phase263PlanningAuthorized !==
      (candidate.status === "pass") ||
    [
      "phase263ExecutionAuthorized",
      "candidateSearchAuthorized",
      "formationMaterializationAuthorized",
      "holdoutOpeningAuthorized",
      "publicAuthorized",
      "productAuthorized",
      "productionAuthorized",
      "countedPlayAuthorized",
      "gameplayChangeAuthorized",
      "archiveAuthorized",
      "tagAuthorized",
    ].some((key) => candidate.authority?.[key] !== false)
  )
    fail("V138_PLAN_262_88_DISPOSITION_INVALID")
  return true
}

export const checkV138Plan26288Artifacts = (root: string): any => {
  const expected = deriveV138Plan26288NoPublish(root)
  if (
    containedStatus(root, V138_PLAN_262_88_PATHS.manifest) !== "regular" ||
    containedStatus(root, V138_PLAN_262_88_PATHS.disposition) !== "regular"
  )
    fail("V138_PLAN_262_88_REQUIRED_ARTIFACT_MISSING")
  const manifest = readJson(root, V138_PLAN_262_88_PATHS.manifest)
  const disposition = readJson(root, V138_PLAN_262_88_PATHS.disposition)
  validateManifest(manifest, expected.manifest)
  validateDisposition(disposition, expected.disposition)
  const correctionStatus = containedStatus(
    root,
    V138_PLAN_262_88_PATHS.correctionV3,
  )
  if (expected.correction === null) {
    if (correctionStatus !== "absent")
      fail("V138_PLAN_262_88_UNEXPECTED_CORRECTION")
  } else {
    if (correctionStatus !== "regular")
      fail("V138_PLAN_262_88_CORRECTION_MISSING")
    const correction = readJson(root, V138_PLAN_262_88_PATHS.correctionV3)
    if (
      correction.correctionRoot !==
        computeV138Plan26288CorrectionRoot(correction) ||
      canonical(correction) !== canonical(expected.correction) ||
      disposition.status !== "non_pass" ||
      disposition.correctionRoot !== correction.correctionRoot
    )
      fail("V138_PLAN_262_88_CORRECTION_INVALID")
  }
  const activationStatus = containedStatus(
    root,
    V138_PLAN_262_88_PATHS.activation,
  )
  if (disposition.status === "pass") {
    if (activationStatus !== "regular")
      fail("V138_PLAN_262_88_ACTIVATION_MISSING")
    const activation = readJson(root, V138_PLAN_262_88_PATHS.activation)
    if (
      canonical(activation) !==
      canonical(computeV138Plan26288ActivationRoot(disposition))
    )
      fail("V138_PLAN_262_88_ACTIVATION_INVALID")
  } else if (activationStatus !== "absent") {
    fail("V138_PLAN_262_88_NONPASS_ACTIVATION_PRESENT")
  }
  return Object.freeze({
    manifest,
    disposition,
    correctionPresent: correctionStatus === "regular",
    activationPresent: activationStatus === "regular",
  })
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)
const main = (): void => {
  const argv = process.argv.slice(2)
  if (canonical(argv) === canonical(["--derive-no-publish"])) {
    const result = deriveV138Plan26288NoPublish(repoRoot)
    process.stdout.write(
      canonical({
        status: result.disposition.status,
        terminalDisposition: result.disposition.terminalDisposition,
        assuranceStatus: result.disposition.assuranceStatus,
        assuranceDefects: result.disposition.assuranceDefects,
        correctionRequired: result.disposition.correctionRequired,
        freshAccepted: result.disposition.counters.freshAccepted,
        requiredAccepted: result.disposition.counters.requiredAccepted,
        manifestRoot: result.manifest.manifestRoot,
        dispositionRoot: result.disposition.dispositionRoot,
        activationCreated: false,
      }),
    )
    return
  }
  if (canonical(argv) === canonical(["--write-artifacts"])) {
    const result = publishV138Plan26288Artifacts(repoRoot)
    process.stdout.write(
      canonical({
        status: result.disposition.status,
        terminalDisposition: result.disposition.terminalDisposition,
        assuranceStatus: result.disposition.assuranceStatus,
        assuranceDefects: result.disposition.assuranceDefects,
        correctionCreated: result.correction !== null,
        activationCreated: result.disposition.status === "pass",
        manifestRoot: result.manifest.manifestRoot,
        dispositionRoot: result.disposition.dispositionRoot,
      }),
    )
    return
  }
  if (canonical(argv) === canonical(["--check-artifacts"])) {
    const result = checkV138Plan26288Artifacts(repoRoot)
    process.stdout.write(
      canonical({
        status: "verified",
        branch: result.disposition.status,
        terminalDisposition: result.disposition.terminalDisposition,
        assuranceStatus: result.disposition.assuranceStatus,
        assuranceDefects: result.disposition.assuranceDefects,
        correctionPresent: result.correctionPresent,
        activationPresent: result.activationPresent,
        manifestRoot: result.manifest.manifestRoot,
        dispositionRoot: result.disposition.dispositionRoot,
      }),
    )
    return
  }
  fail("V138_PLAN_262_88_ARGUMENTS_INVALID")
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    main()
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : String(error)}\n`,
    )
    process.exitCode = 1
  }
}
