import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import { runV138V3ProductionLive } from "./run-v1-38-bounded-retry-envelope-v3.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
export const V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT =
  "2639ff3b42e2a238919a3104c9fa8c785c69b93d"
const PLAN_107_SOURCE_COMMIT = "a964be04a8a0628d4969d2b38b02a31a51120a83"
const PLAN_107_SOURCE_TREE = "20772dc04f7ca2b767cc4cc3ac090b54c149e239"
const PLAN_107_SOURCE_PARENT = "b94d48050289707190cfcecffda567fd710c7801"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT =
  "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT =
  "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT =
  "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const SEAL_BLOB = "e6166e7a97945b4542750b2f9cfbb3ca79fbff50"
const ENVELOPE_BLOB = "e925c8c1ccf3e4bfc2174e83239bf4d846b12e69"
const PLAN_93_STOP_COMMIT = "de42f5e7c08925ab3f6829354bd1861b98088ea5"
const PLAN_93_STOP_BLOB = "e9de1116995f32b3ec564c6bd0fb0d1a00de4e7d"
const PLAN_93_STOP_SHA256 =
  "sha256:ef19330651725dfcaf5a1de35435a27d4f270f54428b5f57e063ee58f041f1a3"

export const V138_LIVE_V9_PATHS = Object.freeze({
  source: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.ts",
  tests: "scripts/run-v1-38-bounded-retry-envelope-v3-live-v9.test.ts",
  correctedPayload:
    ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  correctedReview: `${PHASE_DIR}/262-108-REVIEW-FIX.md`,
  correctedCarrier:
    ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
  plan93Stop: `${PHASE_DIR}/262-93-PRESTART-INTEGRITY-STOP.md`,
  plan112Payload:
    ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-payload-v1.json",
  plan112Review: `${PHASE_DIR}/262-112-REVIEW.md`,
  plan112Carrier:
    ".planning/artifacts/v1.38-plan-262-112-live-v9-custody-review-carrier-v1.json",
  supplementV1:
    ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
  supplementV2:
    ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v2.json",
})

export const V138_LIVE_V9_MODES = Object.freeze([
  "--check-source-only",
  "--check-prospective-custody",
  "--check-post-run-custody",
] as const)

const PLAN_107_EXECUTED_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts",
] as const)

export const V138_LIVE_V9_EXECUTED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  V138_LIVE_V9_PATHS.source,
] as const)

export const V138_LIVE_V9_PROTECTED_BRANCHES = Object.freeze([
  { plan: 90, lineageCommit: "32f53bb743db799810dff820b8b7eb309b6a6629", paths: [
    `${PHASE_DIR}/262-90-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3.ts", "scripts/run-v1-38-bounded-retry-envelope-v3.test.ts",
  ] },
  { plan: 91, lineageCommit: "d64f048c12440978f449a5e2e655c33f55adc4ce", paths: [
    `${PHASE_DIR}/262-91-SUMMARY.md`, `${PHASE_DIR}/262-91-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-91-bounded-retry-source-review-v3.json",
    "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.ts",
    "scripts/check-v1-38-plan-262-91-bounded-retry-source-review-v3.test.ts",
  ] },
  { plan: 96, lineageCommit: "82ed28eee2377fd31680a20fdf0a6c6ebba9c1a8", paths: [
    `${PHASE_DIR}/262-96-SUMMARY.md`, "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
    "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  ] },
  { plan: 97, lineageCommit: "24d759a9c95499d56d483ff23c1e9bfbe0356f30", paths: [
    `${PHASE_DIR}/262-97-SUMMARY.md`, `${PHASE_DIR}/262-97-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-97-bounded-retry-source-rereview-v3.json",
    "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.ts",
    "scripts/check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.test.ts",
  ] },
  { plan: 98, lineageCommit: "c3ed45c7a4ec54f456ae21d04095ab898df870db", paths: [
    `${PHASE_DIR}/262-98-SUMMARY.md`,
  ] },
  { plan: 99, lineageCommit: "497ba238e789d6f32252bde291ced9438b05a190", paths: [
    `${PHASE_DIR}/262-99-SUMMARY.md`, `${PHASE_DIR}/262-99-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.ts",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.test.ts",
  ] },
  { plan: 100, lineageCommit: "1e071bdb087e7360ee27e6558f6e717180d4d4a9", paths: [
    `${PHASE_DIR}/262-100-SUMMARY.md`,
  ] },
  { plan: 101, lineageCommit: "72e62d480a38f7c853a9010fd2918a0396118e07", paths: [
    `${PHASE_DIR}/262-101-SUMMARY.md`, `${PHASE_DIR}/262-101-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts",
  ] },
  { plan: 102, lineageCommit: "66fa1358daf8005fab4b1b90b2831ccb60d1ca3e", paths: [
    `${PHASE_DIR}/262-102-SUMMARY.md`, "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
  ] },
  { plan: 103, lineageCommit: "658e3149a25a2af8f0511f5845936f23fe574fc5", paths: [
    `${PHASE_DIR}/262-103-SUMMARY.md`, `${PHASE_DIR}/262-103-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json",
    ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json",
    "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.ts",
    "scripts/check-v1-38-plan-262-103-bounded-retry-source-rereview-v6.test.ts",
  ] },
  { plan: 104, lineageCommit: "126a72e52d6c83e15cacf31a5ef46753c0fcce37", paths: [
    `${PHASE_DIR}/262-104-SUMMARY.md`, "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.test.ts",
  ] },
  { plan: 105, lineageCommit: "250c152d3b2c8d7c1e7808985b61626bc3290883", paths: [
    `${PHASE_DIR}/262-105-SUMMARY.md`, `${PHASE_DIR}/262-105-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json",
    "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.ts",
    "scripts/check-v1-38-plan-262-105-pair-publication-source-review-v1.test.ts",
  ] },
] as const)

const ZERO_COUNTERS = Object.freeze({
  acceptedCells: 0,
  calibrationIdentitiesCharged: 0,
  preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0,
  routeStartsConsumed: 0,
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
  schemaVersion: "retry-envelope:v3",
  supervisedRuntimeOnly: true,
})

const fail = (code: string): never => {
  throw new TypeError(code)
}
const sha256 = (value: string | Uint8Array): Sha =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object")
      return Object.fromEntries(
        Object.entries(item as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, normalize(child)]),
      )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const assertExactKeys = (value: unknown, expected: readonly string[], code: string): void => {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    canonical(Object.keys(value).sort()) !== canonical([...expected].sort())
  ) fail(code)
}
const repoTarget = (root: string, repoPath: string): string => {
  if (
    path.isAbsolute(repoPath) ||
    repoPath.split("/").some((part) => !part || part === "." || part === "..")
  ) fail("V138_LIVE_V9_PATH_INVALID")
  return path.join(path.resolve(root), ...repoPath.split("/"))
}
const workingBytes = (
  root: string,
  repoPath: string,
  mode: "100644" | "100755" = "100644",
): Buffer => {
  const target = repoTarget(root, repoPath)
  const status = lstatSync(target)
  if (
    !status.isFile() ||
    status.isSymbolicLink() ||
    (mode === "100755") !== ((status.mode & 0o111) !== 0)
  ) fail(`V138_LIVE_V9_WORKING_MODE_INVALID:${repoPath}`)
  return readFileSync(target)
}
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try {
    runV138RetryV3IsolatedGit(root, ["merge-base", "--is-ancestor", ancestor, descendant])
  } catch {
    fail("V138_LIVE_V9_ANCESTRY_INVALID")
  }
}
const committedRecord = (
  root: string,
  commit: string,
  repoPath: string,
) => {
  const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath)
    fail(`V138_LIVE_V9_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const mode = match[1] as "100644" | "100755"
  const blob = match[2]!
  const bytes = runV138RetryV3IsolatedGitBytes(root, [
    "cat-file",
    "blob",
    `${commit}:${repoPath}`,
  ])
  if (!workingBytes(root, repoPath, mode).equals(bytes))
    fail(`V138_LIVE_V9_WORKING_BYTES_INVALID:${repoPath}`)
  return Object.freeze({ path: repoPath, mode, blob, sha256: sha256(bytes), bytes })
}

const assertNoSuccessorRewrite = (
  root: string,
  commit: string,
  repoPaths: readonly string[],
): void => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, commit, head)
  if (
    runV138RetryV3IsolatedGit(root, [
      "log",
      "--format=%H",
      `${commit}..${head}`,
      "--",
      ...repoPaths,
    ]) !== ""
  ) fail("V138_LIVE_V9_SUCCESSOR_REWRITE")
}

const resolveCommittedImport = (
  root: string,
  ownerPath: string,
  specifier: string,
): string | null => {
  if (!specifier.startsWith(".")) return null
  const raw = path.posix.normalize(
    path.posix.join(path.posix.dirname(ownerPath), specifier),
  )
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates) {
    const entry = runV138RetryV3IsolatedGit(root, [
      "ls-tree",
      PLAN_107_SOURCE_COMMIT,
      "--",
      candidate,
    ])
    if (/^(100644|100755) blob [0-9a-f]{40}\t/u.test(entry)) return candidate
  }
  fail(`V138_LIVE_V9_IMPORT_UNRESOLVED:${ownerPath}:${specifier}`)
}
const recursivePlan107Manifest = (root: string) => {
  const visited = new Set<string>()
  const queue = PLAN_107_EXECUTED_PATHS.filter((repoPath) => repoPath.endsWith(".ts")) as string[]
  const records: Array<ReturnType<typeof committedRecord>> = []
  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = committedRecord(root, PLAN_107_SOURCE_COMMIT, repoPath)
    records.push(record)
    const imports = ts
      .preProcessFile(record.bytes.toString("utf8"), true, true)
      .importedFiles.map(({ fileName }) => fileName)
      .filter((fileName) => fileName.startsWith("."))
    for (const specifier of [...new Set(imports)].sort()) {
      const resolved = resolveCommittedImport(root, repoPath, specifier)
      if (resolved !== null && !visited.has(resolved)) queue.push(resolved)
    }
  }
  records.sort((left, right) => left.path.localeCompare(right.path))
  assertNoSuccessorRewrite(root, PLAN_107_SOURCE_COMMIT, records.map(({ path }) => path))
  const portable = records.map(({ bytes: _bytes, ...record }) => record)
  return Object.freeze({
    paths: Object.freeze(records.map(({ path: repoPath }) => repoPath)),
    count: records.length,
    root: sha256(
      `v138-plan-262-108-recursive-dependency-v2\0${canonical(portable)}`,
    ),
  })
}

const inspectProtectedHistory = (root: string) => {
  const records: string[] = []
  const paths = new Set<string>()
  for (const branch of V138_LIVE_V9_PROTECTED_BRANCHES) {
    requireAncestor(root, branch.lineageCommit, PAIR_COMMIT)
    for (const repoPath of branch.paths) {
      const record = committedRecord(root, PAIR_COMMIT, repoPath)
      paths.add(repoPath)
      records.push(
        `${branch.plan}\0${branch.lineageCommit}\0${record.mode}\0${repoPath}\0${record.blob}`,
      )
    }
  }
  assertNoSuccessorRewrite(root, PAIR_COMMIT, [...paths].sort())
  return Object.freeze({
    branchCount: V138_LIVE_V9_PROTECTED_BRANCHES.length,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    expandedManifestRoot: sha256(
      `v138-plan-262-108-independent-protected-history-v1\0${records.sort().join("\n")}`,
    ),
  })
}

const authenticatePlan93Stop = (root: string): void => {
  const entry = runV138RetryV3IsolatedGit(root, [
    "ls-tree",
    PLAN_93_STOP_COMMIT,
    "--",
    V138_LIVE_V9_PATHS.plan93Stop,
  ])
  if (
    entry !==
    `100644 blob ${PLAN_93_STOP_BLOB}\t${V138_LIVE_V9_PATHS.plan93Stop}`
  ) fail("V138_LIVE_V9_PLAN_93_ENTRY_INVALID")
  const bytes = runV138RetryV3IsolatedGitBytes(root, [
    "cat-file",
    "blob",
    `${PLAN_93_STOP_COMMIT}:${V138_LIVE_V9_PATHS.plan93Stop}`,
  ])
  if (
    sha256(bytes) !== PLAN_93_STOP_SHA256 ||
    !workingBytes(root, V138_LIVE_V9_PATHS.plan93Stop).equals(bytes) ||
    runV138RetryV3IsolatedGit(root, [
      "log",
      "--format=%H",
      `${PLAN_93_STOP_COMMIT}..HEAD`,
      "--",
      V138_LIVE_V9_PATHS.plan93Stop,
    ]) !== ""
  ) fail("V138_LIVE_V9_PLAN_93_CUSTODY_INVALID")
  const text = bytes.toString("utf8")
  for (const expected of [
    "status: pre_start_integrity_stop",
    "Live effect boundary crossed: `false`",
    "Route starts: `0/3`",
    "Fresh accepted: `0/540`",
    "Plan 93 is not complete",
  ]) if (!text.includes(expected)) fail("V138_LIVE_V9_PLAN_93_SEMANTICS_INVALID")
}

const authenticatePair = (root: string) => {
  const sealRecord = committedRecord(
    root,
    PAIR_COMMIT,
    ".planning/artifacts/v1.38-successor-source-seal-v13.json",
  )
  const envelopeRecord = committedRecord(
    root,
    PAIR_COMMIT,
    ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json",
  )
  assertNoSuccessorRewrite(root, PAIR_COMMIT, [sealRecord.path, envelopeRecord.path])
  if (sealRecord.blob !== SEAL_BLOB || envelopeRecord.blob !== ENVELOPE_BLOB)
    fail("V138_LIVE_V9_PAIR_BLOB_INVALID")
  const seal = JSON.parse(sealRecord.bytes.toString("utf8")) as Record<string, any>
  const envelope = JSON.parse(envelopeRecord.bytes.toString("utf8")) as Record<string, any>
  if (
    !sealRecord.bytes.equals(Buffer.from(canonical(seal))) ||
    !envelopeRecord.bytes.equals(Buffer.from(canonical(envelope)))
  ) fail("V138_LIVE_V9_PAIR_CANONICAL_INVALID")
  const { sealRoot, ...sealBody } = seal
  const { envelopeRoot, ...envelopeBody } = envelope
  if (
    sha256(`v138-successor-source-seal-v13\0${canonical(sealBody)}`) !== sealRoot ||
    sealRoot !== SEAL_ROOT ||
    sha256(`v138-retry-envelope-v3\0${canonical(envelopeBody)}`) !== envelopeRoot ||
    envelopeRoot !== ENVELOPE_ROOT ||
    envelope.sealRoot !== sealRoot ||
    envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    seal.productionAuthorized !== false ||
    seal.downstreamAuthority !== "denied" ||
    envelope.status !== "sealed_inactive" ||
    canonical(envelope.policy) !== canonical(EXPECTED_POLICY) ||
    canonical(envelope.counters) !== canonical(ZERO_COUNTERS)
  ) fail("V138_LIVE_V9_PAIR_SEMANTICS_INVALID")
  return Object.freeze({ pairCommit: PAIR_COMMIT, seal, envelope })
}

const inspectPlan107Source = (root: string) => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, PLAN_107_SOURCE_COMMIT, head)
  if (
    runV138RetryV3IsolatedGit(root, [
      "rev-parse",
      `${PLAN_107_SOURCE_COMMIT}^{tree}`,
    ]) !== PLAN_107_SOURCE_TREE ||
    runV138RetryV3IsolatedGit(root, [
      "rev-parse",
      `${PLAN_107_SOURCE_COMMIT}^`,
    ]) !== PLAN_107_SOURCE_PARENT
  ) fail("V138_LIVE_V9_PLAN_107_SOURCE_IDENTITY_INVALID")
  const entries = PLAN_107_EXECUTED_PATHS.map((repoPath) =>
    committedRecord(root, PLAN_107_SOURCE_COMMIT, repoPath),
  )
  const rawRecords = entries.map(({ bytes: _bytes, ...record }) => record)
  const recursive = recursivePlan107Manifest(root)
  const closure = authenticateV138RetryV3ExecutionClosure(root, {
    sourceCommit: PLAN_107_SOURCE_COMMIT,
    checkoutPaths: PLAN_107_EXECUTED_PATHS,
  })
  const protectedHistory = inspectProtectedHistory(root)
  const portableBody = {
    sourceCommit: PLAN_107_SOURCE_COMMIT,
    sourceTree: PLAN_107_SOURCE_TREE,
    sourceParent: PLAN_107_SOURCE_PARENT,
    checkoutPaths: PLAN_107_EXECUTED_PATHS,
    rawByteManifestRoot: sha256(
      `v138-plan-262-108-raw-byte-manifest-v2\0${canonical(rawRecords)}`,
    ),
    recursiveDependencyRoot: recursive.root,
    installedClosureRoot: closure.installedClosureRoot,
    nodeSha256: closure.nodeSha256,
    pnpmDistributionSha256: closure.pnpmDistributionSha256,
    nativeSourcesRoot: closure.nativeSourcesRoot,
    pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const portableClosureRoot = sha256(
    `v138-plan-262-108-portable-closure-v2\0${canonical(portableBody)}`,
  )
  if (portableClosureRoot === closure.executionClosureRoot)
    fail("V138_LIVE_V9_PORTABLE_FULL_ROOT_ALIAS")
  return Object.freeze({
    sourceCommit: PLAN_107_SOURCE_COMMIT,
    sourceTree: PLAN_107_SOURCE_TREE,
    sourceParent: PLAN_107_SOURCE_PARENT,
    checkoutPaths: PLAN_107_EXECUTED_PATHS,
    pathCount: entries.length,
    rawByteManifestRoot: portableBody.rawByteManifestRoot,
    recursiveDependencyRoot: recursive.root,
    recursiveDependencyCount: recursive.count,
    portableClosureRoot,
    executionClosureRoot: closure.executionClosureRoot,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    expandedProtectedHistoryRoot: protectedHistory.expandedManifestRoot,
    pathnameLaunchReplacementResistanceClaimed: false as const,
  })
}

export const computeV138LiveV9Plan108PayloadRoot = (
  body: Record<string, unknown>,
): Sha =>
  sha256(`v138-plan-262-108-live-controller-review-payload-v9\0${canonical(body)}`)
export const computeV138LiveV9Plan108CarrierRoot = (
  body: Record<string, unknown>,
): Sha =>
  sha256(`v138-plan-262-108-live-controller-review-carrier-v2\0${canonical(body)}`)
const computeFindingRoot = (): Sha =>
  sha256(`v138-plan-262-108-findings-v2\0${canonical([])}`)
const computeReviewRoot = (source: ReturnType<typeof inspectPlan107Source>): Sha =>
  sha256(
    `v138-plan-262-108-review-semantic-v2\0${canonical({
      schemaVersion: "v1.38-plan-262-108-review-semantic-v2",
      source,
      findings: [],
      findingRoot: computeFindingRoot(),
      observations: {
        actualModesPassed: 4,
        syntheticProducerCalls: 1,
        liveInvoked: false,
      },
      pairCommit: PAIR_COMMIT,
      sealRoot: SEAL_ROOT,
      envelopeRoot: ENVELOPE_ROOT,
      counters: ZERO_COUNTERS,
      assuranceClass: "single_operator_local_seal_v1",
      plan109Eligible: true,
      authorizesExecution: false,
      downstreamAuthority: "denied",
    })}`,
  )
const computeSupplementDerivationRoot = (
  source: ReturnType<typeof inspectPlan107Source>,
  payloadRoot: Sha,
  reviewRoot: Sha,
): Sha =>
  sha256(
    `v138-plan-262-108-supplement-derivation-v2\0${canonical({
      sourceCommit: source.sourceCommit,
      payloadRoot,
      reviewRoot,
      findingRoot: computeFindingRoot(),
      plan109Eligible: true,
      authorizesExecution: false,
    })}`,
  )
const renderCorrectedReview = (
  source: ReturnType<typeof inspectPlan107Source>,
  reviewRoot: Sha,
  payloadRoot: Sha,
): Buffer =>
  Buffer.from(`---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "108"
review_type: independent_executable_custody_corrected_v2
status: zero_findings
finding_count: 0
review_root: ${reviewRoot}
reviewed: 2026-08-28
---

# Phase 262 Plan 108 Corrected Independent Executable-Custody Review

## Verdict

**ZERO FINDINGS.** Finding codes: none.

- Source commit: \`${source.sourceCommit}\`
- Raw manifest root: \`${source.rawByteManifestRoot}\`
- Recursive dependency root/count: \`${source.recursiveDependencyRoot}\` / ${source.recursiveDependencyCount}
- Portable/full roots: \`${source.portableClosureRoot}\` / \`${source.executionClosureRoot}\`
- Protected history roots: \`${source.protectedHistoryRoot}\` / \`${source.expandedProtectedHistoryRoot}\`
- Actual modes: 4/4
- Synthetic producer eligibility observations: 1
- Live invoked: false
- Finding root: \`${computeFindingRoot()}\`
- Supplement derivation root: \`${computeSupplementDerivationRoot(source, payloadRoot, reviewRoot)}\`
- Review root: \`${reviewRoot}\`

Plan 109 eligibility: true. This review authorizes no execution, supplement, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted play, gameplay change, archive, tag, or Phase 263 action. Downstream authority remains denied.
`)

type CorrectedValues = Readonly<{
  source: ReturnType<typeof inspectPlan107Source>
  payload: Record<string, any>
  reviewBytes: Buffer
  carrier: Record<string, any>
}>

export const checkV138LiveV9CorrectedPlan108ValuesForReview = (
  input: CorrectedValues,
) => {
  const source = input.source
  const expectedPayloadBody = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-payload-v9",
    reviewedSourceCommit: source.sourceCommit,
    reviewedSourceTree: source.sourceTree,
    reviewedSourceParent: source.sourceParent,
    checkoutPaths: source.checkoutPaths,
    executionClosureRoot: source.executionClosureRoot,
    recursiveDependencyRoot: source.recursiveDependencyRoot,
    protectedHistoryRoot: source.protectedHistoryRoot,
    findingCount: 0,
    findingRoot: computeFindingRoot(),
    findingCodes: [],
    reviewStatus: "zero_findings",
    actualModesPassed: 4,
    syntheticProducerCalls: 1,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    plan109Eligible: true,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const expectedPayload = {
    ...expectedPayloadBody,
    payloadRoot: computeV138LiveV9Plan108PayloadRoot(expectedPayloadBody),
  }
  assertExactKeys(
    input.payload,
    Object.keys(expectedPayload),
    "V138_LIVE_V9_CORRECTED_PAYLOAD_KEYS_INVALID",
  )
  if (canonical(input.payload) !== canonical(expectedPayload))
    fail("V138_LIVE_V9_CORRECTED_PAYLOAD_SEMANTICS_INVALID")
  const reviewRoot = computeReviewRoot(source)
  const expectedReview = renderCorrectedReview(source, reviewRoot, expectedPayload.payloadRoot)
  if (!input.reviewBytes.equals(expectedReview))
    fail("V138_LIVE_V9_CORRECTED_REVIEW_BYTES_INVALID")
  const expectedCarrierBody = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-carrier-v2",
    payloadRoot: expectedPayload.payloadRoot,
    reviewRoot,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadSha256: sha256(Buffer.from(canonical(expectedPayload))),
    reviewSha256: sha256(expectedReview),
    findingCount: 0,
    findingRoot: computeFindingRoot(),
    plan109Eligible: true,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const expectedCarrier = {
    ...expectedCarrierBody,
    carrierRoot: computeV138LiveV9Plan108CarrierRoot(expectedCarrierBody),
  }
  assertExactKeys(
    input.carrier,
    Object.keys(expectedCarrier),
    "V138_LIVE_V9_CORRECTED_CARRIER_KEYS_INVALID",
  )
  if (canonical(input.carrier) !== canonical(expectedCarrier))
    fail("V138_LIVE_V9_CORRECTED_CARRIER_SEMANTICS_INVALID")
  return Object.freeze({
    source,
    payload: Object.freeze(expectedPayload),
    reviewBytes: Buffer.from(expectedReview),
    carrier: Object.freeze(expectedCarrier),
    payloadRoot: expectedPayload.payloadRoot,
    reviewRoot,
    carrierRoot: expectedCarrier.carrierRoot,
    findingRoot: computeFindingRoot(),
  })
}

const shaPattern = /^sha256:[0-9a-f]{64}$/u
type ReviewedLiveV9Closure = Readonly<{
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutPaths: readonly string[]
  rawByteManifestRoot: Sha
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  installedClosureRoot: Sha
  nodeSha256: Sha
  pnpmDistributionSha256: Sha
  nativeSourcesRoot: Sha
  portableClosureRoot: Sha
  executionClosureRoot: Sha
  pathnameLaunchReplacementResistanceClaimed: false
}>

type CorrectedAdmission = Readonly<{
  correctedPublicationCommit: string
  correctedPayloadRoot: Sha
  correctedReviewRoot: Sha
  correctedCarrierRoot: Sha
  correctedPayload: Record<string, any>
  correctedReviewBytes: Buffer
  correctedCarrier: Record<string, any>
  correctedSource: ReturnType<typeof inspectPlan107Source>
  pair: Readonly<{ seal: Record<string, any>; envelope: Record<string, any> }>
  pairCommit: string
  envelopeStatus: string
  liveInvoked: false
  freshCharged: 0
  freshAccepted: 0
  downstreamAuthority: "denied"
}>

const assertReviewedClosure = (closure: ReviewedLiveV9Closure): void => {
  assertExactKeys(closure, [
    "sourceCommit", "sourceTree", "sourceParent", "checkoutPaths",
    "rawByteManifestRoot", "recursiveDependencyRoot", "recursiveDependencyCount",
    "installedClosureRoot", "nodeSha256", "pnpmDistributionSha256",
    "nativeSourcesRoot", "portableClosureRoot", "executionClosureRoot",
    "pathnameLaunchReplacementResistanceClaimed",
  ], "V138_LIVE_V9_REVIEWED_CLOSURE_KEYS_INVALID")
  if (
    !/^[0-9a-f]{40}$/u.test(closure.sourceCommit) ||
    !/^[0-9a-f]{40}$/u.test(closure.sourceTree) ||
    !/^[0-9a-f]{40}$/u.test(closure.sourceParent) ||
    canonical(closure.checkoutPaths) !== canonical(V138_LIVE_V9_EXECUTED_SOURCE_PATHS) ||
    closure.recursiveDependencyCount < V138_LIVE_V9_EXECUTED_SOURCE_PATHS.length ||
    closure.pathnameLaunchReplacementResistanceClaimed !== false ||
    [
      closure.rawByteManifestRoot, closure.recursiveDependencyRoot,
      closure.installedClosureRoot, closure.nodeSha256,
      closure.pnpmDistributionSha256, closure.nativeSourcesRoot,
      closure.portableClosureRoot, closure.executionClosureRoot,
    ].some((root) => !shaPattern.test(root)) ||
    closure.portableClosureRoot === closure.executionClosureRoot
  ) fail("V138_LIVE_V9_REVIEWED_CLOSURE_INVALID")
}

const computePlan112FindingRoot = (): Sha =>
  sha256(`v138-plan-262-112-live-v9-findings-v1\0${canonical([])}`)
export const computeV138LiveV9Plan112PayloadRoot = (
  body: Record<string, unknown>,
): Sha => sha256(`v138-plan-262-112-live-v9-custody-review-payload-v1\0${canonical(body)}`)
const computePlan112ReviewRoot = (payloadRoot: Sha): Sha =>
  sha256(`v138-plan-262-112-live-v9-custody-review-v1\0${canonical({
    payloadRoot,
    findingRoot: computePlan112FindingRoot(),
    findingCount: 0,
    plan109Eligible: true,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  })}`)
export const computeV138LiveV9Plan112CarrierRoot = (
  body: Record<string, unknown>,
): Sha => sha256(`v138-plan-262-112-live-v9-custody-review-carrier-v1\0${canonical(body)}`)
export const computeV138LiveV9SupplementV2Root = (
  body: Record<string, unknown>,
): Sha => sha256(`v138-successor-source-seal-v13-executable-custody-supplement-v2\0${canonical(body)}`)

const renderPlan112Review = (
  closure: ReviewedLiveV9Closure,
  payloadRoot: Sha,
  reviewRoot: Sha,
): Buffer => Buffer.from(`---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "112"
review_type: independent_live_v9_executable_custody_v1
status: zero_findings
finding_count: 0
review_root: ${reviewRoot}
reviewed: 2026-08-28
---

# Phase 262 Plan 112 Independent Live-v9 Executable-Custody Review

## Verdict

**ZERO FINDINGS.** Finding codes: none.

- Source commit: \`${closure.sourceCommit}\`
- Recursive dependency root/count: \`${closure.recursiveDependencyRoot}\` / ${closure.recursiveDependencyCount}
- Portable/full roots: \`${closure.portableClosureRoot}\` / \`${closure.executionClosureRoot}\`
- Payload root: \`${payloadRoot}\`
- Finding root: \`${computePlan112FindingRoot()}\`
- Review root: \`${reviewRoot}\`
- Actual modes: 6/6
- Producer-incapable observations: 1
- Live invoked: false
- Fresh charged/accepted: 0/0

Plan 109 supplement-v2 publication eligibility: true. This review authorizes no execution, envelope, capacity, counter reset, live effect, candidate, formation, holdout, public, product, production, counted play, gameplay change, archive, tag, or Phase 263 action. Downstream authority remains denied.
`)

export const deriveV138LiveV9ProspectiveContractsForReview = (input: {
  corrected: CorrectedAdmission
  reviewedClosure: ReviewedLiveV9Closure
  plan112PublicationCommit: string
}) => {
  const { corrected, reviewedClosure: closure } = input
  assertReviewedClosure(closure)
  if (
    !/^[0-9a-f]{40}$/u.test(input.plan112PublicationCommit) ||
    corrected.correctedPublicationCommit !== V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT ||
    corrected.pairCommit !== PAIR_COMMIT || corrected.envelopeStatus !== "sealed_inactive" ||
    corrected.liveInvoked !== false || corrected.freshCharged !== 0 ||
    corrected.freshAccepted !== 0 || corrected.downstreamAuthority !== "denied"
  ) fail("V138_LIVE_V9_CORRECTED_ADMISSION_INVALID")
  checkV138LiveV9CorrectedPlan108ValuesForReview({
    source: corrected.correctedSource,
    payload: corrected.correctedPayload,
    reviewBytes: corrected.correctedReviewBytes,
    carrier: corrected.correctedCarrier,
  })
  const payloadBody = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-payload-v1",
    reviewedSourceCommit: closure.sourceCommit,
    reviewedSourceTree: closure.sourceTree,
    reviewedSourceParent: closure.sourceParent,
    checkoutPaths: closure.checkoutPaths,
    rawByteManifestRoot: closure.rawByteManifestRoot,
    recursiveDependencyRoot: closure.recursiveDependencyRoot,
    recursiveDependencyCount: closure.recursiveDependencyCount,
    installedClosureRoot: closure.installedClosureRoot,
    nodeSha256: closure.nodeSha256,
    pnpmDistributionSha256: closure.pnpmDistributionSha256,
    nativeSourcesRoot: closure.nativeSourcesRoot,
    portableClosureRoot: closure.portableClosureRoot,
    fullExecutionClosureRoot: closure.executionClosureRoot,
    pathnameLaunchReplacementResistanceClaimed: false,
    correctedPublicationCommit: V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
    correctedPayloadRoot: corrected.correctedPayloadRoot,
    correctedReviewRoot: corrected.correctedReviewRoot,
    correctedCarrierRoot: corrected.correctedCarrierRoot,
    pairCommit: PAIR_COMMIT,
    sourceSealRoot: SEAL_ROOT,
    retryEnvelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan93StopCommit: PLAN_93_STOP_COMMIT,
    plan93StopSha256: PLAN_93_STOP_SHA256,
    findingCount: 0,
    findingRoot: computePlan112FindingRoot(),
    findingCodes: [],
    reviewStatus: "zero_findings",
    actualModesPassed: 6,
    producerIncapableObservations: 1,
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    plan109Eligible: true,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const payload = Object.freeze({
    ...payloadBody,
    payloadRoot: computeV138LiveV9Plan112PayloadRoot(payloadBody),
  })
  const reviewRoot = computePlan112ReviewRoot(payload.payloadRoot)
  const reviewBytes = renderPlan112Review(closure, payload.payloadRoot, reviewRoot)
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-112-live-v9-custody-review-carrier-v1",
    payloadPath: V138_LIVE_V9_PATHS.plan112Payload,
    reviewPath: V138_LIVE_V9_PATHS.plan112Review,
    payloadMode: "100644",
    reviewMode: "100644",
    carrierMode: "100644",
    payloadRoot: payload.payloadRoot,
    reviewRoot,
    payloadSha256: sha256(Buffer.from(canonical(payload))),
    reviewSha256: sha256(reviewBytes),
    findingCount: 0,
    findingRoot: computePlan112FindingRoot(),
    plan109Eligible: true,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({
    ...carrierBody,
    carrierRoot: computeV138LiveV9Plan112CarrierRoot(carrierBody),
  })
  const supplementBody = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v2",
    pairCommit: PAIR_COMMIT,
    sourceSealRoot: SEAL_ROOT,
    retryEnvelopeRoot: ENVELOPE_ROOT,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan93StopCommit: PLAN_93_STOP_COMMIT,
    plan93StopSha256: PLAN_93_STOP_SHA256,
    correctedPublicationCommit: V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
    correctedPayloadRoot: corrected.correctedPayloadRoot,
    correctedReviewRoot: corrected.correctedReviewRoot,
    correctedCarrierRoot: corrected.correctedCarrierRoot,
    reviewedSourceCommit: closure.sourceCommit,
    reviewedExecutionClosureRoot: closure.executionClosureRoot,
    plan112PayloadRoot: payload.payloadRoot,
    plan112ReviewRoot: reviewRoot,
    plan112CarrierRoot: carrier.carrierRoot,
    plan112PublicationCommit: input.plan112PublicationCommit,
    findingCount: 0,
    findingRoot: computePlan112FindingRoot(),
    liveInvoked: false,
    freshCharged: 0,
    freshAccepted: 0,
    authorizesEnvelope: false,
    authorizesCapacity: false,
    authorizesCounterReset: false,
    authorizesExecution: false,
    downstreamAuthority: "denied",
  }
  const supplement = Object.freeze({
    ...supplementBody,
    supplementRoot: computeV138LiveV9SupplementV2Root(supplementBody),
  })
  return Object.freeze({
    plan112: Object.freeze({ payload, reviewBytes, carrier, reviewRoot }),
    supplement,
  })
}

export const checkV138LiveV9ProspectiveCustodyForReview = (input: {
  corrected: CorrectedAdmission
  reviewedClosure: ReviewedLiveV9Closure
  plan112PublicationCommit: string
  plan112: Readonly<{ payload: Record<string, any>; reviewBytes: Buffer; carrier: Record<string, any>; reviewRoot: Sha }>
  supplement: Record<string, any>
}) => {
  const expected = deriveV138LiveV9ProspectiveContractsForReview(input)
  if (
    canonical(input.plan112.payload) !== canonical(expected.plan112.payload) ||
    !input.plan112.reviewBytes.equals(expected.plan112.reviewBytes) ||
    canonical(input.plan112.carrier) !== canonical(expected.plan112.carrier) ||
    input.plan112.reviewRoot !== expected.plan112.reviewRoot ||
    canonical(input.supplement) !== canonical(expected.supplement)
  ) fail("V138_LIVE_V9_PROSPECTIVE_CUSTODY_INVALID")
  return Object.freeze({
    producerWouldInvoke: true as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    downstreamAuthority: "denied" as const,
    reviewedClosure: input.reviewedClosure,
    pair: input.corrected.pair,
    plan112: expected.plan112,
    supplement: expected.supplement,
  })
}

const authenticateCorrectedPublication = (root: string) => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT, head)
  const paths = [
    V138_LIVE_V9_PATHS.correctedPayload,
    V138_LIVE_V9_PATHS.correctedReview,
    V138_LIVE_V9_PATHS.correctedCarrier,
  ] as const
  const entries = runV138RetryV3IsolatedGit(root, [
    "diff-tree",
    "--no-commit-id",
    "--raw",
    "-r",
    V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
  ])
    .split("\n")
    .filter(Boolean)
  if (entries.length !== paths.length)
    fail("V138_LIVE_V9_CORRECTED_PUBLICATION_SCOPE_INVALID")
  const records = paths.map((repoPath) => {
    const record = committedRecord(
      root,
      V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
      repoPath,
    )
    const raw = entries.find((entry) => entry.endsWith(`\t${repoPath}`))
    if (
      record.mode !== "100644" ||
      raw === undefined ||
      !raw.startsWith(
        `:000000 100644 ${"0".repeat(40)} ${record.blob} A`,
      )
    ) fail(`V138_LIVE_V9_CORRECTED_PUBLICATION_ENTRY_INVALID:${repoPath}`)
    return record
  })
  assertNoSuccessorRewrite(root, V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT, paths)
  const source = inspectPlan107Source(root)
  const payload = JSON.parse(records[0]!.bytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(records[2]!.bytes.toString("utf8")) as Record<string, any>
  return checkV138LiveV9CorrectedPlan108ValuesForReview({
    source,
    payload,
    reviewBytes: records[1]!.bytes,
    carrier,
  })
}

const ALWAYS_FORBIDDEN_DESTINATIONS = Object.freeze([
  V138_LIVE_V9_PATHS.supplementV1,
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl",
  ".planning/artifacts/v1.38-current-matrix-retry-journal-v3.jsonl.lock",
  ".planning/artifacts/v1.38-current-matrix-retry-private-v3",
  ".planning/artifacts/v1.38-current-matrix-retry-terminal-v3.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-disposition.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-correction.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-activation.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-readiness.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-lifecycle.json",
])
const assertForbiddenDestinationsAbsent = (
  root: string,
  options: Readonly<{ forbidSupplementV2: boolean }>,
): void => {
  const forbidden = options.forbidSupplementV2
    ? [...ALWAYS_FORBIDDEN_DESTINATIONS, V138_LIVE_V9_PATHS.supplementV2]
    : ALWAYS_FORBIDDEN_DESTINATIONS
  for (const repoPath of forbidden)
    if (existsSync(repoTarget(root, repoPath)))
      fail(`V138_LIVE_V9_FORBIDDEN_DESTINATION_PRESENT:${repoPath}`)
}

const authenticateV138LiveV9Base = (
  rootInput: string,
  forbidSupplementV2: boolean,
) => {
  const root = path.resolve(rootInput)
  authenticatePlan93Stop(root)
  const pair = authenticatePair(root)
  const protectedHistory = inspectProtectedHistory(root)
  const corrected = authenticateCorrectedPublication(root)
  assertForbiddenDestinationsAbsent(root, { forbidSupplementV2 })
  return Object.freeze({
    correctedPublicationCommit: V138_LIVE_V9_CORRECTED_PUBLICATION_COMMIT,
    correctedPayloadRoot: corrected.payloadRoot,
    correctedReviewRoot: corrected.reviewRoot,
    correctedCarrierRoot: corrected.carrierRoot,
    correctedPayload: corrected.payload,
    correctedReviewBytes: corrected.reviewBytes,
    correctedCarrier: corrected.carrier,
    correctedSource: corrected.source,
    findingCount: 0 as const,
    actualModesPassed: 4 as const,
    syntheticProducerCalls: 1 as const,
    plan109Eligible: true as const,
    liveInvoked: false as const,
    freshCharged: 0 as const,
    freshAccepted: 0 as const,
    pairCommit: PAIR_COMMIT,
    envelopeStatus: "sealed_inactive" as const,
    protectedBranchCount: protectedHistory.branchCount,
    recursiveDependencyCount: corrected.source.recursiveDependencyCount,
    downstreamAuthority: "denied" as const,
    pair,
    sha256Canonical: (value: unknown): Sha => sha256(Buffer.from(canonical(value))),
  })
}

export const authenticateV138LiveV9SourceOnly = (rootInput: string) =>
  authenticateV138LiveV9Base(rootInput, true)

const exactPublication = (
  root: string,
  commit: string,
  repoPaths: readonly string[],
): ReadonlyArray<ReturnType<typeof committedRecord>> => {
  const changed = runV138RetryV3IsolatedGit(root, [
    "diff-tree", "--no-commit-id", "--name-only", "-r", commit,
  ]).split("\n").filter(Boolean).sort()
  if (canonical(changed) !== canonical([...repoPaths].sort()))
    fail("V138_LIVE_V9_PUBLICATION_SCOPE_INVALID")
  const records = repoPaths.map((repoPath) => committedRecord(root, commit, repoPath))
  if (records.some(({ mode }) => mode !== "100644"))
    fail("V138_LIVE_V9_PUBLICATION_MODE_INVALID")
  assertNoSuccessorRewrite(root, commit, repoPaths)
  return records
}

const closureFromPlan112Payload = (payload: Record<string, any>): ReviewedLiveV9Closure =>
  Object.freeze({
    sourceCommit: payload.reviewedSourceCommit,
    sourceTree: payload.reviewedSourceTree,
    sourceParent: payload.reviewedSourceParent,
    checkoutPaths: payload.checkoutPaths,
    rawByteManifestRoot: payload.rawByteManifestRoot,
    recursiveDependencyRoot: payload.recursiveDependencyRoot,
    recursiveDependencyCount: payload.recursiveDependencyCount,
    installedClosureRoot: payload.installedClosureRoot,
    nodeSha256: payload.nodeSha256,
    pnpmDistributionSha256: payload.pnpmDistributionSha256,
    nativeSourcesRoot: payload.nativeSourcesRoot,
    portableClosureRoot: payload.portableClosureRoot,
    executionClosureRoot: payload.fullExecutionClosureRoot,
    pathnameLaunchReplacementResistanceClaimed:
      payload.pathnameLaunchReplacementResistanceClaimed,
  })

const locateSingleAddCommit = (root: string, repoPath: string): string => {
  const commits = runV138RetryV3IsolatedGit(root, [
    "log", "--diff-filter=A", "--format=%H", "--", repoPath,
  ]).split("\n").filter(Boolean)
  if (commits.length !== 1 || !/^[0-9a-f]{40}$/u.test(commits[0]!))
    fail(`V138_LIVE_V9_ADD_COMMIT_INVALID:${repoPath}`)
  return commits[0]!
}

const authenticateV138LiveV9FutureCustody = (
  rootInput: string,
  requirePublishedSupplement: boolean,
) => {
  const root = path.resolve(rootInput)
  const corrected = authenticateV138LiveV9Base(root, !requirePublishedSupplement)
  const plan112Paths = [
    V138_LIVE_V9_PATHS.plan112Payload,
    V138_LIVE_V9_PATHS.plan112Review,
    V138_LIVE_V9_PATHS.plan112Carrier,
  ] as const
  if (!plan112Paths.every((repoPath) => existsSync(repoTarget(root, repoPath))))
    fail("V138_LIVE_V9_PLAN_112_PUBLICATION_REQUIRED")

  let supplement: Record<string, any> | undefined
  let plan112PublicationCommit: string
  if (requirePublishedSupplement) {
    const supplementBytes = workingBytes(root, V138_LIVE_V9_PATHS.supplementV2)
    supplement = JSON.parse(supplementBytes.toString("utf8")) as Record<string, any>
    plan112PublicationCommit = supplement.plan112PublicationCommit
  } else {
    const plan112Add = locateSingleAddCommit(root, V138_LIVE_V9_PATHS.plan112Payload)
    plan112PublicationCommit = plan112Add
  }
  if (!/^[0-9a-f]{40}$/u.test(plan112PublicationCommit))
    fail("V138_LIVE_V9_PLAN_112_COMMIT_INVALID")
  const plan112Records = exactPublication(root, plan112PublicationCommit, plan112Paths)
  const payload = JSON.parse(plan112Records[0]!.bytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(plan112Records[2]!.bytes.toString("utf8")) as Record<string, any>
  const closure = closureFromPlan112Payload(payload)
  assertReviewedClosure(closure)
  const actualClosure = authenticateV138RetryV3ExecutionClosure(root, {
    sourceCommit: closure.sourceCommit,
    checkoutPaths: V138_LIVE_V9_EXECUTED_SOURCE_PATHS,
    executionClosureRoot: closure.executionClosureRoot,
  })
  if (
    actualClosure.sourceTree !== closure.sourceTree ||
    actualClosure.sourceParent !== closure.sourceParent ||
    actualClosure.installedClosureRoot !== closure.installedClosureRoot ||
    actualClosure.nodeSha256 !== closure.nodeSha256 ||
    actualClosure.pnpmDistributionSha256 !== closure.pnpmDistributionSha256 ||
    actualClosure.nativeSourcesRoot !== closure.nativeSourcesRoot
  ) fail("V138_LIVE_V9_REVIEWED_EXECUTION_CLOSURE_INVALID")
  const prospective = deriveV138LiveV9ProspectiveContractsForReview({
    corrected,
    reviewedClosure: closure,
    plan112PublicationCommit,
  })
  const plan112 = Object.freeze({
    payload,
    reviewBytes: plan112Records[1]!.bytes,
    carrier,
    reviewRoot: carrier.reviewRoot as Sha,
  })
  if (!requirePublishedSupplement) supplement = prospective.supplement
  else {
    const supplementCommit = locateSingleAddCommit(root, V138_LIVE_V9_PATHS.supplementV2)
    const [record] = exactPublication(root, supplementCommit, [V138_LIVE_V9_PATHS.supplementV2])
    if (!record!.bytes.equals(Buffer.from(canonical(supplement))))
      fail("V138_LIVE_V9_SUPPLEMENT_CANONICAL_INVALID")
  }
  if (supplement === undefined) fail("V138_LIVE_V9_SUPPLEMENT_REQUIRED")
  return checkV138LiveV9ProspectiveCustodyForReview({
    corrected,
    reviewedClosure: closure,
    plan112PublicationCommit,
    plan112,
    supplement,
  })
}

export const settleV138LiveV9ProducerOutcomeForReview = (
  producerError: unknown | undefined,
  postCustodyError: unknown | undefined,
): void => {
  if (producerError !== undefined && postCustodyError !== undefined)
    throw new AggregateError(
      [producerError, postCustodyError],
      "V138_LIVE_V9_PRODUCER_AND_POST_CUSTODY_FAILED",
      { cause: producerError },
    )
  if (producerError !== undefined) throw producerError
  if (postCustodyError !== undefined) throw postCustodyError
}

export const runV138ReviewedBoundedLiveEnvelopeV9 = async (
  repoRoot: string,
): Promise<void> => {
  const ready = authenticateV138LiveV9FutureCustody(repoRoot, true)
  let producerError: unknown | undefined
  let postCustodyError: unknown | undefined
  try {
    await runV138V3ProductionLive(repoRoot, {
      validateInputs: false,
      checkPair: () => ({ seal: ready.pair.seal, envelope: ready.pair.envelope }),
    })
  } catch (error) {
    producerError = error
  } finally {
    try {
      authenticateV138LiveV9FutureCustody(repoRoot, true)
    } catch (error) {
      postCustodyError = error
    }
  }
  settleV138LiveV9ProducerOutcomeForReview(producerError, postCustodyError)
}

export interface V138LiveV9CliDependencies {
  repoRoot: string
  writeOutput: (value: string) => void
}
export const executeV138LiveV9Cli = (
  args: readonly string[],
  injected?: Partial<V138LiveV9CliDependencies>,
): void => {
  if (args.length !== 1 || !V138_LIVE_V9_MODES.includes(args[0] as never))
    fail("V138_LIVE_V9_ARGUMENTS_INVALID")
  const repoRoot =
    injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  if (args[0] === "--check-prospective-custody") {
    const result = authenticateV138LiveV9FutureCustody(repoRoot, false)
    writeOutput(`${JSON.stringify({
      status: "prospective_custody_checked",
      supplementRoot: result.supplement.supplementRoot,
      producerWouldInvoke: true,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })}\n`)
    return
  }
  if (args[0] === "--check-post-run-custody") {
    const result = authenticateV138LiveV9FutureCustody(repoRoot, true)
    writeOutput(`${JSON.stringify({
      status: "post_run_custody_checked",
      supplementRoot: result.supplement.supplementRoot,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })}\n`)
    return
  }
  const result = authenticateV138LiveV9SourceOnly(repoRoot)
  writeOutput(
    `${JSON.stringify({
      status: "source_only_checked",
      correctedPublicationCommit: result.correctedPublicationCommit,
      correctedPayloadRoot: result.correctedPayloadRoot,
      correctedReviewRoot: result.correctedReviewRoot,
      correctedCarrierRoot: result.correctedCarrierRoot,
      findingCount: 0,
      actualModesPassed: 4,
      liveInvoked: false,
      freshCharged: 0,
      freshAccepted: 0,
      downstreamAuthority: "denied",
    })}\n`,
  )
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isEntrypoint) {
  try {
    executeV138LiveV9Cli(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}
