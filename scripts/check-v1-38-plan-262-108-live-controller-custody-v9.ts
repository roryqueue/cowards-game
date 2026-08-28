import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import ts from "typescript"
import { checkV138LiveV8SyntheticCustodyForReview } from "./run-v1-38-bounded-retry-envelope-v3-live-v8.js"
import {
  authenticateV138RetryV3ExecutionClosure,
  runV138RetryV3IsolatedGit,
  runV138RetryV3IsolatedGitBytes,
} from "./lib/v1-38-bounded-retry-v3-native-custody-v1.js"

type Sha = `sha256:${string}`
type Finding = Readonly<{ code: string; boundary: string; detailRoot: Sha }>
type SourceObservation = Readonly<{
  sourceCommit: string
  sourceTree: string
  sourceParent: string
  checkoutPaths: readonly string[]
  pathCount: number
  rawByteManifestRoot: Sha
  recursiveDependencyRoot: Sha
  recursiveDependencyCount: number
  portableClosureRoot: Sha
  executionClosureRoot: Sha
  protectedHistoryRoot: Sha
  expandedProtectedHistoryRoot: Sha
  pathnameLaunchReplacementResistanceClaimed: false
}>

const PHASE_DIR = ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"
const SOURCE_COMMIT = "a964be04a8a0628d4969d2b38b02a31a51120a83"
const SOURCE_TREE = "20772dc04f7ca2b767cc4cc3ac090b54c149e239"
const SOURCE_PARENT = "b94d48050289707190cfcecffda567fd710c7801"
const PAIR_COMMIT = "8080ff66a0880db25db227d23e7e7a0884a79b56"
const SEAL_ROOT = "sha256:ec1cb108c8fcdd710090e72ccec32ed58574a06d8970a2b44b1bb6f7ec3ea752"
const ENVELOPE_ROOT = "sha256:f6a92d5ddfc6b10fe5a0600927e0427b112bf0b49f2d03d895a229642456904a"
const PROTECTED_HISTORY_ROOT = "sha256:77e0e71f62ec4abd997f1df2c1fc9bf1db7b95247404f78b558a634cdc1ec57d"
const SEAL_BLOB = "e6166e7a97945b4542750b2f9cfbb3ca79fbff50"
const ENVELOPE_BLOB = "e925c8c1ccf3e4bfc2174e83239bf4d846b12e69"
const ZERO_SHA = `sha256:${"0".repeat(64)}` as Sha

const EXECUTED_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-bounded-retry-envelope-v3.ts",
  "scripts/lib/v1-38-bounded-retry-v3-native-custody-v1.ts",
  "scripts/native/v1-38-bounded-retry-v3-owner-lock-v1.c",
  "scripts/run-v1-38-bounded-retry-envelope-v3.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.ts",
] as const)

const OLD_PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v8.json",
  review: `${PHASE_DIR}/262-108-REVIEW.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v1.json",
  supplement: ".planning/artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json",
})

export const V138_PLAN_262_108_CORRECTED_PATHS = Object.freeze({
  payload: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v9.json",
  review: `${PHASE_DIR}/262-108-REVIEW-FIX.md`,
  carrier: ".planning/artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v2.json",
})

const LIVE_DESTINATIONS = Object.freeze([
  OLD_PATHS.supplement,
  ".planning/artifacts/v1.38-bounded-retry-v3-journal.jsonl",
  ".planning/artifacts/v1.38-bounded-retry-v3-journal.jsonl.lock",
  ".planning/artifacts/v1.38-bounded-retry-v3-private-receipts",
  ".planning/artifacts/v1.38-plan-262-110-terminal-v1.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v17.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-receipt-manifest.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-disposition.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-correction.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-activation.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-readiness.json",
  ".planning/artifacts/v1.38-bounded-retry-v3-lifecycle.json",
])

export const V138_PLAN_262_108_CORRECTED_MODES = Object.freeze([
  "--derive-review-no-publish",
  "--write-review",
  "--check-review",
  "--derive-supplement-no-publish",
  "--publish-disposable-supplement",
  "--check-disposable-supplement",
  "--run-synthetic-no-effect",
] as const)

export const V138_PLAN_262_108_PROTECTED_BRANCHES = Object.freeze([
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
  { plan: 98, lineageCommit: "c3ed45c7a4ec54f456ae21d04095ab898df870db", paths: [`${PHASE_DIR}/262-98-SUMMARY.md`] },
  { plan: 99, lineageCommit: "497ba238e789d6f32252bde291ced9438b05a190", paths: [
    `${PHASE_DIR}/262-99-SUMMARY.md`, `${PHASE_DIR}/262-99-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-99-bounded-retry-source-rereview-v4.json",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.ts",
    "scripts/check-v1-38-plan-262-99-bounded-retry-source-rereview-v4.test.ts",
  ] },
  { plan: 100, lineageCommit: "1e071bdb087e7360ee27e6558f6e717180d4d4a9", paths: [`${PHASE_DIR}/262-100-SUMMARY.md`] },
  { plan: 101, lineageCommit: "72e62d480a38f7c853a9010fd2918a0396118e07", paths: [
    `${PHASE_DIR}/262-101-SUMMARY.md`, `${PHASE_DIR}/262-101-REVIEW.md`,
    ".planning/artifacts/v1.38-plan-262-101-bounded-retry-source-rereview-v5.json",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.ts",
    "scripts/check-v1-38-plan-262-101-bounded-retry-source-rereview-v5.test.ts",
  ] },
  { plan: 102, lineageCommit: "66fa1358daf8005fab4b1b90b2831ccb60d1ca3e", paths: [
    `${PHASE_DIR}/262-102-SUMMARY.md`, "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
    "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts", "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
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

const fail = (code: string): never => { throw new TypeError(code) }
const sha256 = (value: string | Uint8Array): Sha => `sha256:${createHash("sha256").update(value).digest("hex")}`
const canonical = (value: unknown): string => {
  const normalize = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(normalize)
    if (item !== null && typeof item === "object") return Object.fromEntries(
      Object.entries(item as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, normalize(child)]),
    )
    return item
  }
  return `${JSON.stringify(normalize(value))}\n`
}
const gitBlob = (bytes: Buffer): string => createHash("sha1")
  .update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex")

export const computeV138Plan262108PayloadRootV9 = (body: Record<string, unknown>): Sha =>
  sha256(`v138-plan-262-108-live-controller-review-payload-v9\0${canonical(body)}`)
export const computeV138Plan262108CarrierRootV2 = (body: Record<string, unknown>): Sha =>
  sha256(`v138-plan-262-108-live-controller-review-carrier-v2\0${canonical(body)}`)
export const computeV138Plan262108SupplementRootV2 = (body: Record<string, unknown>): Sha =>
  sha256(`v138-successor-executable-custody-supplement-v2\0${canonical(body)}`)
const reviewRootV2 = (body: Record<string, unknown>): Sha =>
  sha256(`v138-plan-262-108-review-semantic-v2\0${canonical(body)}`)
const findingRoot = (findings: readonly Finding[]): Sha =>
  sha256(`v138-plan-262-108-findings-v2\0${canonical(findings)}`)

const target = (root: string, repoPath: string): string => {
  if (path.isAbsolute(repoPath) || repoPath.split("/").some((part) => !part || part === "." || part === ".."))
    fail("V138_PLAN_262_108_V9_PATH_INVALID")
  return path.join(path.resolve(root), ...repoPath.split("/"))
}
const workingBytes = (root: string, repoPath: string, mode?: "100644" | "100755"): Buffer => {
  const absolute = target(root, repoPath)
  const stat = lstatSync(absolute)
  if (!stat.isFile() || stat.isSymbolicLink()) fail(`V138_PLAN_262_108_V9_WORKING_ENTRY_INVALID:${repoPath}`)
  if (mode !== undefined && ((mode === "100755") !== ((stat.mode & 0o111) !== 0)))
    fail(`V138_PLAN_262_108_V9_WORKING_MODE_INVALID:${repoPath}`)
  return readFileSync(absolute)
}
const requireAncestor = (root: string, ancestor: string, descendant: string): void => {
  try { runV138RetryV3IsolatedGit(root, ["merge-base", "--is-ancestor", ancestor, descendant]) }
  catch { fail("V138_PLAN_262_108_V9_ANCESTRY_INVALID") }
}
const committedRecord = (root: string, commit: string, repoPath: string, noRewriteFrom = commit) => {
  const entry = runV138RetryV3IsolatedGit(root, ["ls-tree", commit, "--", repoPath])
  const match = /^(100644|100755) blob ([0-9a-f]{40})\t(.+)$/u.exec(entry)
  if (match === null || match[3] !== repoPath) fail(`V138_PLAN_262_108_V9_COMMITTED_ENTRY_INVALID:${repoPath}`)
  const mode = match[1] as "100644" | "100755"
  const blob = match[2]!
  const bytes = runV138RetryV3IsolatedGitBytes(root, ["cat-file", "blob", `${commit}:${repoPath}`])
  if (!workingBytes(root, repoPath, mode).equals(bytes)) fail(`V138_PLAN_262_108_V9_WORKING_BYTES_INVALID:${repoPath}`)
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, noRewriteFrom, head)
  if (runV138RetryV3IsolatedGit(root, ["log", "--format=%H", `${noRewriteFrom}..${head}`, "--", repoPath]) !== "")
    fail(`V138_PLAN_262_108_V9_SUCCESSOR_REWRITE:${repoPath}`)
  return Object.freeze({ path: repoPath, mode, blob, sha256: sha256(bytes), bytes })
}

const resolveImport = (root: string, ownerPath: string, specifier: string): string | null => {
  if (!specifier.startsWith(".")) return null
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(ownerPath), specifier))
  const candidates = raw.endsWith(".js")
    ? [`${raw.slice(0, -3)}.ts`, `${raw.slice(0, -3)}.tsx`]
    : [raw, `${raw}.ts`, `${raw}.tsx`, `${raw}/index.ts`]
  for (const candidate of candidates)
    if (/^(100644|100755) blob [0-9a-f]{40}\t/u.test(runV138RetryV3IsolatedGit(root, ["ls-tree", SOURCE_COMMIT, "--", candidate])))
      return candidate
  fail(`V138_PLAN_262_108_V9_IMPORT_UNRESOLVED:${ownerPath}:${specifier}`)
}
const recursiveManifest = (root: string) => {
  const visited = new Set<string>()
  const queue = EXECUTED_SOURCE_PATHS.filter((repoPath) => repoPath.endsWith(".ts")) as string[]
  const records: Array<ReturnType<typeof committedRecord>> = []
  while (queue.length > 0) {
    const repoPath = queue.shift()!
    if (visited.has(repoPath)) continue
    visited.add(repoPath)
    const record = committedRecord(root, SOURCE_COMMIT, repoPath)
    records.push(record)
    const imports = ts.preProcessFile(record.bytes.toString("utf8"), true, true).importedFiles
      .map(({ fileName }) => fileName).filter((fileName) => fileName.startsWith("."))
    for (const specifier of [...new Set(imports)].sort()) {
      const resolved = resolveImport(root, repoPath, specifier)
      if (resolved !== null && !visited.has(resolved)) queue.push(resolved)
    }
  }
  records.sort((left, right) => left.path.localeCompare(right.path))
  const portable = records.map(({ bytes: _bytes, ...record }) => record)
  return Object.freeze({
    paths: Object.freeze(records.map(({ path: repoPath }) => repoPath)),
    count: records.length,
    root: sha256(`v138-plan-262-108-recursive-dependency-v2\0${canonical(portable)}`),
  })
}

export const inspectV138Plan262108IndependentProtectedHistory = (root: string) => {
  const records: string[] = []
  for (const branch of V138_PLAN_262_108_PROTECTED_BRANCHES) {
    requireAncestor(root, branch.lineageCommit, PAIR_COMMIT)
    for (const repoPath of branch.paths) {
      const record = committedRecord(root, PAIR_COMMIT, repoPath, PAIR_COMMIT)
      records.push(`${branch.plan}\0${branch.lineageCommit}\0${record.mode}\0${repoPath}\0${record.blob}`)
    }
  }
  return Object.freeze({
    branchCount: V138_PLAN_262_108_PROTECTED_BRANCHES.length,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    expandedManifestRoot: sha256(`v138-plan-262-108-independent-protected-history-v1\0${records.sort().join("\n")}`),
  })
}

const expectedPolicy = Object.freeze({
  assuranceClass: "single_operator_local_seal_v1", calibrationAttemptsPerRoute: 8,
  calibrationFailureBackoffMilliseconds: 900000, calibrationShardCount: 4,
  candidateSearchAuthorized: false, envelopeLifetimeMilliseconds: 14400000,
  formationMaterializationAuthorized: false, gameplayChangeAuthorized: false,
  holdoutOpeningAuthorized: false, maximumPreflightObservations: 12,
  maximumReproductionRuns: 1, maximumRouteStarts: 3,
  minimumEffectiveAvailableBasisPoints: 2500, partialAcceptedEvidenceReusable: false,
  phase263PlanningAuthorized: false, productAuthorized: false, productionAuthorized: false,
  publicAuthorized: false, refusalSpacingMilliseconds: 300000, reproductionCellCount: 540,
  rulesAuthority: "MATCH_KERNEL", samplingMilliseconds: 200, schemaVersion: "retry-envelope:v3",
  supervisedRuntimeOnly: true,
})
const zeroCounters = Object.freeze({
  acceptedCells: 0, calibrationIdentitiesCharged: 0, preflightObservationsConsumed: 0,
  reproductionIdentitiesCharged: 0, routeStartsConsumed: 0,
})

const authenticateIndependentPair = (root: string) => {
  const sealRecord = committedRecord(root, PAIR_COMMIT, ".planning/artifacts/v1.38-successor-source-seal-v13.json", PAIR_COMMIT)
  const envelopeRecord = committedRecord(root, PAIR_COMMIT, ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json", PAIR_COMMIT)
  if (sealRecord.blob !== SEAL_BLOB || envelopeRecord.blob !== ENVELOPE_BLOB)
    fail("V138_PLAN_262_108_V9_PAIR_BLOB_INVALID")
  const seal = JSON.parse(sealRecord.bytes.toString("utf8")) as Record<string, any>
  const envelope = JSON.parse(envelopeRecord.bytes.toString("utf8")) as Record<string, any>
  if (!sealRecord.bytes.equals(Buffer.from(canonical(seal))) || !envelopeRecord.bytes.equals(Buffer.from(canonical(envelope))))
    fail("V138_PLAN_262_108_V9_PAIR_CANONICAL_INVALID")
  const { sealRoot, ...sealBody } = seal
  const { envelopeRoot, ...envelopeBody } = envelope
  if (
    sha256(`v138-successor-source-seal-v13\0${canonical(sealBody)}`) !== sealRoot || sealRoot !== SEAL_ROOT ||
    sha256(`v138-retry-envelope-v3\0${canonical(envelopeBody)}`) !== envelopeRoot || envelopeRoot !== ENVELOPE_ROOT ||
    envelope.sealRoot !== sealRoot || envelope.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT ||
    seal.protectedHistoryRoot !== PROTECTED_HISTORY_ROOT || seal.productionAuthorized !== false ||
    seal.downstreamAuthority !== "denied" || envelope.status !== "sealed_inactive" ||
    canonical(envelope.policy) !== canonical(expectedPolicy) || canonical(envelope.counters) !== canonical(zeroCounters)
  ) fail("V138_PLAN_262_108_V9_PAIR_SEMANTICS_INVALID")
  return Object.freeze({ pairCommit: PAIR_COMMIT, directParentCommit: seal.directParentCommit, seal, envelope })
}

export const inspectV138Plan262108IndependentSource = (rootInput: string): SourceObservation => {
  const root = path.resolve(rootInput)
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, SOURCE_COMMIT, head)
  if (
    runV138RetryV3IsolatedGit(root, ["rev-parse", `${SOURCE_COMMIT}^{tree}`]) !== SOURCE_TREE ||
    runV138RetryV3IsolatedGit(root, ["rev-parse", `${SOURCE_COMMIT}^`]) !== SOURCE_PARENT
  ) fail("V138_PLAN_262_108_V9_SOURCE_IDENTITY_INVALID")
  const entries = EXECUTED_SOURCE_PATHS.map((repoPath) => committedRecord(root, SOURCE_COMMIT, repoPath))
  const rawRecords = entries.map(({ bytes: _bytes, ...record }) => record)
  const recursive = recursiveManifest(root)
  const closure = authenticateV138RetryV3ExecutionClosure(root, { sourceCommit: SOURCE_COMMIT, checkoutPaths: EXECUTED_SOURCE_PATHS })
  const protectedHistory = inspectV138Plan262108IndependentProtectedHistory(root)
  const portableBody = {
    sourceCommit: SOURCE_COMMIT, sourceTree: SOURCE_TREE, sourceParent: SOURCE_PARENT,
    checkoutPaths: EXECUTED_SOURCE_PATHS,
    rawByteManifestRoot: sha256(`v138-plan-262-108-raw-byte-manifest-v2\0${canonical(rawRecords)}`),
    recursiveDependencyRoot: recursive.root, installedClosureRoot: closure.installedClosureRoot,
    nodeSha256: closure.nodeSha256, pnpmDistributionSha256: closure.pnpmDistributionSha256,
    nativeSourcesRoot: closure.nativeSourcesRoot, pathnameLaunchReplacementResistanceClaimed: false as const,
  }
  const portableClosureRoot = sha256(`v138-plan-262-108-portable-closure-v2\0${canonical(portableBody)}`)
  if (portableClosureRoot === closure.executionClosureRoot) fail("V138_PLAN_262_108_V9_ROOT_ALIAS")
  return Object.freeze({
    sourceCommit: SOURCE_COMMIT, sourceTree: SOURCE_TREE, sourceParent: SOURCE_PARENT,
    checkoutPaths: EXECUTED_SOURCE_PATHS, pathCount: entries.length,
    rawByteManifestRoot: portableBody.rawByteManifestRoot,
    recursiveDependencyRoot: recursive.root, recursiveDependencyCount: recursive.count,
    portableClosureRoot, executionClosureRoot: closure.executionClosureRoot,
    protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    expandedProtectedHistoryRoot: protectedHistory.expandedManifestRoot,
    pathnameLaunchReplacementResistanceClaimed: false,
  })
}

const renderReview = (input: {
  source: SourceObservation; findings: readonly Finding[]; findingRoot: Sha; reviewRoot: Sha;
  observations: { actualModesPassed: number; syntheticProducerCalls: number; liveInvoked: false };
  plan109Eligible: boolean; supplementDerivationRoot: Sha
}): Buffer => {
  const status = input.findings.length === 0 && input.observations.actualModesPassed === 4 ? "zero_findings" : "blocked"
  const codes = input.findings.length === 0 ? "none" : input.findings.map(({ code }) => `\`${code}\``).join(", ")
  return Buffer.from(`---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "108"
review_type: independent_executable_custody_corrected_v2
status: ${status}
finding_count: ${input.findings.length}
review_root: ${input.reviewRoot}
reviewed: 2026-08-28
---

# Phase 262 Plan 108 Corrected Independent Executable-Custody Review

## Verdict

**${status === "zero_findings" ? "ZERO FINDINGS" : "BLOCKED"}.** Finding codes: ${codes}.

- Source commit: \`${input.source.sourceCommit}\`
- Raw manifest root: \`${input.source.rawByteManifestRoot}\`
- Recursive dependency root/count: \`${input.source.recursiveDependencyRoot}\` / ${input.source.recursiveDependencyCount}
- Portable/full roots: \`${input.source.portableClosureRoot}\` / \`${input.source.executionClosureRoot}\`
- Protected history roots: \`${input.source.protectedHistoryRoot}\` / \`${input.source.expandedProtectedHistoryRoot}\`
- Actual modes: ${input.observations.actualModesPassed}/4
- Synthetic producer eligibility observations: ${input.observations.syntheticProducerCalls}
- Live invoked: false
- Finding root: \`${input.findingRoot}\`
- Supplement derivation root: \`${input.supplementDerivationRoot}\`
- Review root: \`${input.reviewRoot}\`

Plan 109 eligibility: ${input.plan109Eligible}. This review authorizes no execution, supplement, route, capacity, counter reset, candidate, formation, holdout, public, product, production, counted play, gameplay change, archive, tag, or Phase 263 action. Downstream authority remains denied.
`)
}

export const buildV138Plan262108CorrectedReview = (input: {
  source: SourceObservation
  observations: { actualModesPassed: number; syntheticProducerCalls: number; liveInvoked: false }
  findings: readonly Finding[]
}) => {
  const findings = Object.freeze([...input.findings].sort((a, b) => a.code.localeCompare(b.code)))
  const findingsRoot = findingRoot(findings)
  const plan109Eligible = findings.length === 0 && input.observations.actualModesPassed === 4 &&
    input.observations.syntheticProducerCalls === 1 && input.observations.liveInvoked === false
  const payloadBody = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-payload-v9",
    reviewedSourceCommit: input.source.sourceCommit, reviewedSourceTree: input.source.sourceTree,
    reviewedSourceParent: input.source.sourceParent, checkoutPaths: input.source.checkoutPaths,
    executionClosureRoot: input.source.executionClosureRoot, recursiveDependencyRoot: input.source.recursiveDependencyRoot,
    protectedHistoryRoot: input.source.protectedHistoryRoot,
    findingCount: findings.length, findingRoot: findingsRoot, findingCodes: findings.map(({ code }) => code),
    reviewStatus: plan109Eligible ? "zero_findings" : "blocked",
    actualModesPassed: input.observations.actualModesPassed,
    syntheticProducerCalls: input.observations.syntheticProducerCalls,
    liveInvoked: false, freshCharged: 0, freshAccepted: 0,
    plan109Eligible, authorizesExecution: false, downstreamAuthority: "denied",
  }
  const payload = Object.freeze({ ...payloadBody, payloadRoot: computeV138Plan262108PayloadRootV9(payloadBody) })
  const semantic = {
    schemaVersion: "v1.38-plan-262-108-review-semantic-v2", source: input.source,
    findings, findingRoot: findingsRoot, observations: input.observations,
    pairCommit: PAIR_COMMIT, sealRoot: SEAL_ROOT, envelopeRoot: ENVELOPE_ROOT,
    counters: zeroCounters, assuranceClass: "single_operator_local_seal_v1",
    plan109Eligible, authorizesExecution: false, downstreamAuthority: "denied",
  }
  const reviewRoot = reviewRootV2(semantic)
  const supplementDerivationRoot = sha256(`v138-plan-262-108-supplement-derivation-v2\0${canonical({
    sourceCommit: input.source.sourceCommit, payloadRoot: payload.payloadRoot, reviewRoot,
    findingRoot: findingsRoot, plan109Eligible, authorizesExecution: false,
  })}`)
  const reviewBytes = renderReview({
    source: input.source, findings, findingRoot: findingsRoot, reviewRoot,
    observations: input.observations, plan109Eligible, supplementDerivationRoot,
  })
  const carrierBody = {
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-carrier-v2",
    payloadRoot: payload.payloadRoot, reviewRoot, payloadMode: "100644", reviewMode: "100644",
    carrierMode: "100644", payloadSha256: sha256(Buffer.from(canonical(payload))),
    reviewSha256: sha256(reviewBytes), findingCount: findings.length, findingRoot: findingsRoot,
    plan109Eligible, authorizesExecution: false, downstreamAuthority: "denied",
  }
  const carrier = Object.freeze({ ...carrierBody, carrierRoot: computeV138Plan262108CarrierRootV2(carrierBody) })
  const review = Object.freeze({
    schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v2",
    payloadRoot: payload.payloadRoot, findingCount: findings.length,
    verdict: plan109Eligible ? "zero_findings" : "blocked", reviewRoot,
  })
  const supplementBody = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v2",
    pairCommit: PAIR_COMMIT, sealRoot: SEAL_ROOT, envelopeRoot: ENVELOPE_ROOT,
    envelopeStatus: "sealed_inactive", counters: zeroCounters,
    assuranceClass: "single_operator_local_seal_v1", protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan107: { sourceCommit: input.source.sourceCommit, sourceTree: input.source.sourceTree,
      sourceParent: input.source.sourceParent, checkoutPaths: input.source.checkoutPaths,
      executionClosureRoot: input.source.executionClosureRoot },
    plan108: { payloadRoot: payload.payloadRoot, reviewRoot, carrierRoot: carrier.carrierRoot,
      findingCount: findings.length, verdict: review.verdict },
    createsEnvelope: false, createsCapacity: false, resetsCounters: false,
    authorizesExecution: false, candidateSearchAuthorized: false, formationAuthorized: false,
    holdoutAuthorized: false, publicAuthorized: false, productAuthorized: false,
    productionAuthorized: false, countedPlayAuthorized: false, gameplayChangeAuthorized: false,
    archiveAuthorized: false, tagAuthorized: false, phase263Authorized: false,
    downstreamAuthority: "denied",
  }
  const supplement = Object.freeze({ ...supplementBody, supplementRoot: computeV138Plan262108SupplementRootV2(supplementBody) })
  return Object.freeze({ source: input.source, findings, findingCount: findings.length, findingRoot: findingsRoot,
    observations: input.observations, payload, review, reviewRoot, reviewBytes, carrier, supplement,
    supplementDerivationRoot, plan109Eligible })
}

const writeExclusive = (root: string, repoPath: string, bytes: Buffer): void =>
  writeFileSync(target(root, repoPath), bytes, { flag: "wx", mode: 0o644 })
const writeCorrectedTrio = (root: string, result: ReturnType<typeof buildV138Plan262108CorrectedReview>): void => {
  writeExclusive(root, V138_PLAN_262_108_CORRECTED_PATHS.payload, Buffer.from(canonical(result.payload)))
  writeExclusive(root, V138_PLAN_262_108_CORRECTED_PATHS.review, result.reviewBytes)
  writeExclusive(root, V138_PLAN_262_108_CORRECTED_PATHS.carrier, Buffer.from(canonical(result.carrier)))
}
const assertNoEffects = (root: string): void => {
  for (const repoPath of LIVE_DESTINATIONS)
    if (existsSync(target(root, repoPath))) fail(`V138_PLAN_262_108_V9_FORBIDDEN_EFFECT:${repoPath}`)
}

const compatibilityBundle = (root: string, source: SourceObservation) => {
  const payloadBytes = workingBytes(root, OLD_PATHS.payload, "100644")
  const reviewBytes = workingBytes(root, OLD_PATHS.review, "100644")
  const carrierBytes = workingBytes(root, OLD_PATHS.carrier, "100644")
  const payload = JSON.parse(payloadBytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(carrierBytes.toString("utf8")) as Record<string, any>
  const { payloadRoot, ...payloadBody } = payload
  const { carrierRoot, ...carrierBody } = carrier
  if (
    sha256(`v138-plan-262-108-live-controller-review-payload-v8\0${canonical(payloadBody)}`) !== payloadRoot ||
    sha256(`v138-plan-262-108-live-controller-review-carrier-v1\0${canonical(carrierBody)}`) !== carrierRoot ||
    carrier.payloadSha256 !== sha256(payloadBytes) || carrier.reviewSha256 !== sha256(reviewBytes)
  ) fail("V138_PLAN_262_108_V9_COMPATIBILITY_REVIEW_INVALID")
  const review = { schemaVersion: "v1.38-plan-262-108-live-controller-custody-review-v1",
    payloadRoot, findingCount: 0, verdict: "zero_findings", reviewRoot: carrier.reviewRoot }
  const supplementBody = {
    schemaVersion: "v1.38-successor-source-seal-v13-executable-custody-supplement-v1",
    pairCommit: PAIR_COMMIT, sealRoot: SEAL_ROOT, envelopeRoot: ENVELOPE_ROOT,
    envelopeStatus: "sealed_inactive", counters: zeroCounters,
    assuranceClass: "single_operator_local_seal_v1", protectedHistoryRoot: PROTECTED_HISTORY_ROOT,
    plan93: { attempt: 1, status: "pre_start_integrity_stop", stopCode: "V138_RETRY_V3_REVIEWED_EXECUTION_CLOSURE_INVALID",
      liveEffectBoundaryCrossed: false, envelopeConsumed: false, routeStarts: 0, preflightObservations: 0,
      calibrationCharged: 0, reproductionCharged: 0, freshAccepted: 0, terminalPresent: false, complete: false },
    plan107: { sourceCommit: source.sourceCommit, sourceTree: source.sourceTree, sourceParent: source.sourceParent,
      checkoutPaths: source.checkoutPaths, executionClosureRoot: source.executionClosureRoot },
    plan108: { payloadRoot, reviewRoot: carrier.reviewRoot, carrierRoot, findingCount: 0, verdict: "zero_findings" },
    supersessionScope: "executable_source_custody_only", createsEnvelope: false, createsCapacity: false,
    resetsCounters: false, authorizesExecution: false, candidateSearchAuthorized: false,
    formationAuthorized: false, holdoutAuthorized: false, publicAuthorized: false, productAuthorized: false,
    productionAuthorized: false, countedPlayAuthorized: false, gameplayChangeAuthorized: false,
    archiveAuthorized: false, tagAuthorized: false, phase263Authorized: false, downstreamAuthority: "denied",
  }
  const supplement = { ...supplementBody,
    supplementRoot: sha256(`v138-successor-executable-custody-supplement-v1\0${canonical(supplementBody)}`) }
  return { payload, review, carrier, supplement, plan93: supplementBody.plan93 }
}

const exerciseActualModes = (root: string, source: SourceObservation) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-108-v9-modes-"))
  const clone = path.join(owner, "repo")
  try {
    execFileSync("/usr/bin/git", ["clone", "--quiet", "--no-local", root, clone], {
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner },
    })
    symlinkSync(path.join(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    const cloneSource = inspectV138Plan262108IndependentSource(clone)
    const pair = authenticateIndependentPair(clone)
    assertNoEffects(clone)
    const corrected = buildV138Plan262108CorrectedReview({
      source: cloneSource, observations: { actualModesPassed: 4, syntheticProducerCalls: 1, liveInvoked: false }, findings: [],
    })
    writeCorrectedTrio(clone, corrected)
    writeExclusive(clone, OLD_PATHS.supplement, Buffer.from(canonical(corrected.supplement)))
    if (!workingBytes(clone, OLD_PATHS.supplement, "100644").equals(Buffer.from(canonical(corrected.supplement))))
      fail("V138_PLAN_262_108_V9_DISPOSABLE_SUPPLEMENT_INVALID")
    rmSync(target(clone, OLD_PATHS.supplement))
    const compatibility = compatibilityBundle(clone, source)
    const synthetic = checkV138LiveV8SyntheticCustodyForReview({
      stop: compatibility.plan93 as any, pair: pair as any,
      review: { payload: compatibility.payload, review: compatibility.review, carrier: compatibility.carrier } as any,
      supplement: compatibility.supplement as any,
      closure: { sourceCommit: source.sourceCommit, sourceTree: source.sourceTree,
        sourceParent: source.sourceParent, executionClosureRoot: source.executionClosureRoot },
    })
    if (synthetic.producerWouldInvoke !== true || synthetic.liveInvoked !== false)
      fail("V138_PLAN_262_108_V9_SYNTHETIC_INVALID")
    assertNoEffects(clone)
    return Object.freeze({ actualModesPassed: 4, syntheticProducerCalls: 1, liveInvoked: false as const })
  } finally { rmSync(owner, { recursive: true, force: true }) }
}

const restore = (root: string, commit: string, repoPath: string): void => {
  execFileSync("/usr/bin/git", ["checkout", commit, "--", repoPath], { cwd: root })
}
const mustReject = (operation: () => unknown, code: string): void => {
  try { operation() } catch { return }
  fail(`V138_PLAN_262_108_V9_MUTATION_ACCEPTED:${code}`)
}
const assertNoSelfCustody = (body: Record<string, unknown>): void => {
  if ("carrierRoot" in body || "supplementRoot" in body) fail("V138_PLAN_262_108_V9_SELF_CUSTODY")
}
const assertDistinctRoots = (portable: Sha, full: Sha): void => {
  if (portable === full) fail("V138_PLAN_262_108_V9_ROOT_ALIAS")
}

export const runV138Plan262108AdversarialMatrix = (root: string) => {
  const owner = mkdtempSync(path.join(tmpdir(), "v138-plan-262-108-v9-matrix-"))
  const clone = path.join(owner, "repo")
  try {
    execFileSync("/usr/bin/git", ["clone", "--quiet", "--no-local", root, clone], {
      env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C", HOME: owner },
    })
    symlinkSync(path.join(root, "node_modules"), path.join(clone, "node_modules"), "dir")
    const clean = inspectV138Plan262108IndependentSource(clone)
    const nonEntry = recursiveManifest(clone).paths.find((repoPath) => !EXECUTED_SOURCE_PATHS.includes(repoPath as any))
    if (nonEntry === undefined) fail("V138_PLAN_262_108_V9_NON_ENTRY_MISSING")
    writeFileSync(target(clone, nonEntry), Buffer.concat([readFileSync(target(clone, nonEntry)), Buffer.from("dirty\n")]))
    mustReject(() => inspectV138Plan262108IndependentSource(clone), "non_entry_recursive_dependency")
    restore(clone, SOURCE_COMMIT, nonEntry)
    const omitted = EXECUTED_SOURCE_PATHS[0]
    unlinkSync(target(clone, omitted))
    mustReject(() => inspectV138Plan262108IndependentSource(clone), "omitted_dependency")
    restore(clone, SOURCE_COMMIT, omitted)
    unlinkSync(target(clone, omitted))
    symlinkSync("/dev/null", target(clone, omitted))
    mustReject(() => inspectV138Plan262108IndependentSource(clone), "path_substitution")
    unlinkSync(target(clone, omitted)); restore(clone, SOURCE_COMMIT, omitted)
    chmodSync(target(clone, omitted), 0o755)
    mustReject(() => inspectV138Plan262108IndependentSource(clone), "mode_drift")
    chmodSync(target(clone, omitted), 0o644)
    for (const branch of V138_PLAN_262_108_PROTECTED_BRANCHES) {
      const repoPath = branch.paths[0]
      writeFileSync(target(clone, repoPath), Buffer.concat([readFileSync(target(clone, repoPath)), Buffer.from("dirty\n")]))
      mustReject(() => inspectV138Plan262108IndependentProtectedHistory(clone), `protected_history_${branch.plan}`)
      restore(clone, PAIR_COMMIT, repoPath)
    }
    mustReject(() => assertDistinctRoots(clean.portableClosureRoot, clean.portableClosureRoot), "portable_full_root_alias")
    mustReject(() => assertNoSelfCustody({ carrierRoot: ZERO_SHA }), "review_self_custody")
    const sealPath = ".planning/artifacts/v1.38-successor-source-seal-v13.json"
    const sealBytes = readFileSync(target(clone, sealPath))
    writeFileSync(target(clone, sealPath), Buffer.concat([sealBytes, Buffer.from("dirty\n")]))
    mustReject(() => authenticateIndependentPair(clone), "pair_rewrite")
    writeFileSync(target(clone, sealPath), sealBytes)
    const envelopePath = ".planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json"
    const envelopeBytes = readFileSync(target(clone, envelopePath))
    const envelope = JSON.parse(envelopeBytes.toString("utf8")); envelope.counters.routeStartsConsumed = 1
    writeFileSync(target(clone, envelopePath), Buffer.from(canonical(envelope)))
    mustReject(() => authenticateIndependentPair(clone), "counter_drift")
    writeFileSync(target(clone, envelopePath), envelopeBytes)
    const seal = JSON.parse(sealBytes.toString("utf8")); seal.productionAuthorized = true
    writeFileSync(target(clone, sealPath), Buffer.from(canonical(seal)))
    mustReject(() => authenticateIndependentPair(clone), "authority_claim")
    writeFileSync(target(clone, sealPath), sealBytes)
    writeFileSync(target(clone, LIVE_DESTINATIONS[0]), Buffer.from("forbidden\n"))
    mustReject(() => assertNoEffects(clone), "forbidden_effect")
    rmSync(target(clone, LIVE_DESTINATIONS[0]))
    const fixture = buildV138Plan262108CorrectedReview({
      source: clean, observations: { actualModesPassed: 4, syntheticProducerCalls: 1, liveInvoked: false }, findings: [],
    })
    let cliModesPassed = 0
    for (const mode of V138_PLAN_262_108_CORRECTED_MODES) {
      let output = ""
      executeV138Plan262108CorrectedCli([mode], { repoRoot: clone, writeOutput: (value) => { output += value }, result: fixture })
      if (output.length === 0) fail(`V138_PLAN_262_108_V9_CLI_MODE_INVALID:${mode}`)
      cliModesPassed += 1
    }
    assertNoEffects(clone)
    return Object.freeze({
      completed: true as const, liveInvoked: false as const, effectCount: 0 as const,
      boundaries: Object.freeze(["non_entry_recursive_dependency", "omitted_dependency", "path_substitution", "mode_drift",
        "protected_history_all_branches", "portable_full_root_alias", "review_self_custody", "pair_rewrite",
        "counter_drift", "authority_claim", "forbidden_effect"]),
      protectedPlans: Object.freeze(V138_PLAN_262_108_PROTECTED_BRANCHES.map(({ plan }) => plan)),
      cliModesPassed,
    })
  } finally { rmSync(owner, { recursive: true, force: true }) }
}

const fallbackSource = (): SourceObservation => Object.freeze({
  sourceCommit: SOURCE_COMMIT, sourceTree: SOURCE_TREE, sourceParent: SOURCE_PARENT,
  checkoutPaths: EXECUTED_SOURCE_PATHS, pathCount: EXECUTED_SOURCE_PATHS.length,
  rawByteManifestRoot: ZERO_SHA, recursiveDependencyRoot: ZERO_SHA, recursiveDependencyCount: 0,
  portableClosureRoot: ZERO_SHA, executionClosureRoot: ZERO_SHA,
  protectedHistoryRoot: PROTECTED_HISTORY_ROOT, expandedProtectedHistoryRoot: ZERO_SHA,
  pathnameLaunchReplacementResistanceClaimed: false,
})
const findingFor = (code: string, boundary: string, error: unknown): Finding => Object.freeze({
  code, boundary, detailRoot: sha256(`${boundary}\0${error instanceof Error ? error.message : String(error)}`),
})

export const deriveV138Plan262108CorrectedReview = (root: string) => {
  assertNoEffects(root)
  const findings: Finding[] = []
  let source = fallbackSource()
  try { source = inspectV138Plan262108IndependentSource(root) }
  catch (error) { findings.push(findingFor("F-262-108-V9-SOURCE-CUSTODY", "source_custody", error)) }
  try { authenticateIndependentPair(root) }
  catch (error) { findings.push(findingFor("F-262-108-V9-PAIR-CUSTODY", "pair_custody", error)) }
  let observations = { actualModesPassed: 0, syntheticProducerCalls: 0, liveInvoked: false as const }
  if (findings.length === 0) {
    try { observations = exerciseActualModes(root, source) }
    catch (error) { findings.push(findingFor("F-262-108-V9-ACTUAL-MODES", "actual_modes", error)) }
    try {
      const matrix = runV138Plan262108AdversarialMatrix(root)
      if (!matrix.completed || matrix.cliModesPassed !== 7) fail("V138_PLAN_262_108_V9_MATRIX_INCOMPLETE")
    } catch (error) { findings.push(findingFor("F-262-108-V9-ADVERSARIAL-MATRIX", "adversarial_matrix", error)) }
  }
  const result = buildV138Plan262108CorrectedReview({ source, observations, findings })
  assertNoEffects(root)
  return result
}

export const publishV138Plan262108CorrectedReview = (root: string) => {
  for (const repoPath of Object.values(V138_PLAN_262_108_CORRECTED_PATHS))
    if (existsSync(target(root, repoPath))) fail(`V138_PLAN_262_108_V9_DESTINATION_EXISTS:${repoPath}`)
  const result = deriveV138Plan262108CorrectedReview(root)
  writeCorrectedTrio(root, result)
  return result
}

export const authenticateV138Plan262108CorrectedTrioCustody = (root: string, publicationCommit: string) => {
  const head = runV138RetryV3IsolatedGit(root, ["rev-parse", "HEAD"])
  requireAncestor(root, publicationCommit, head)
  const parent = runV138RetryV3IsolatedGit(root, ["rev-parse", `${publicationCommit}^`])
  const entries = runV138RetryV3IsolatedGit(root, ["diff-tree", "--no-commit-id", "--raw", "-r", publicationCommit])
    .split("\n").filter(Boolean)
  const paths = Object.values(V138_PLAN_262_108_CORRECTED_PATHS)
  if (entries.length !== paths.length) fail("V138_PLAN_262_108_V9_PUBLICATION_SCOPE_INVALID")
  const records = paths.map((repoPath) => {
    const record = committedRecord(root, publicationCommit, repoPath, publicationCommit)
    const raw = entries.find((entry) => entry.endsWith(`\t${repoPath}`))
    if (raw === undefined || !raw.startsWith(`:000000 100644 ${"0".repeat(40)} ${record.blob} A`))
      fail(`V138_PLAN_262_108_V9_PUBLICATION_ENTRY_INVALID:${repoPath}`)
    return record
  })
  const payloadRecord = records[0]!, reviewRecord = records[1]!, carrierRecord = records[2]!
  const payload = JSON.parse(payloadRecord.bytes.toString("utf8")) as Record<string, any>
  const carrier = JSON.parse(carrierRecord.bytes.toString("utf8")) as Record<string, any>
  const { payloadRoot, ...payloadBody } = payload
  const { carrierRoot, ...carrierBody } = carrier
  if (
    computeV138Plan262108PayloadRootV9(payloadBody) !== payloadRoot ||
    computeV138Plan262108CarrierRootV2(carrierBody) !== carrierRoot ||
    carrier.payloadRoot !== payloadRoot || carrier.payloadSha256 !== sha256(payloadRecord.bytes) ||
    carrier.reviewSha256 !== sha256(reviewRecord.bytes) || carrier.payloadMode !== "100644" ||
    carrier.reviewMode !== "100644" || carrier.carrierMode !== "100644" ||
    !reviewRecord.bytes.toString("utf8").includes(carrier.reviewRoot)
  ) fail("V138_PLAN_262_108_V9_TRIO_CLOSURE_INVALID")
  return Object.freeze({ publicationCommit, publicationParent: parent, payload, carrier,
    blobs: Object.freeze(records.map(({ path: repoPath, mode, blob }) => ({ path: repoPath, mode, blob }))) })
}

export const resolveV138Plan262108CorrectedPublication = (root: string): string => {
  const commits = runV138RetryV3IsolatedGit(root, ["log", "--format=%H", "--", ...Object.values(V138_PLAN_262_108_CORRECTED_PATHS)])
    .split("\n").filter(Boolean)
  for (const commit of commits) {
    try { authenticateV138Plan262108CorrectedTrioCustody(root, commit); return commit } catch { /* continue */ }
  }
  fail("V138_PLAN_262_108_V9_PUBLICATION_NOT_FOUND")
}

export interface V138Plan262108CorrectedCliDependencies {
  repoRoot: string
  writeOutput: (value: string) => void
  result: ReturnType<typeof buildV138Plan262108CorrectedReview>
}
const resultLine = (result: ReturnType<typeof buildV138Plan262108CorrectedReview>, mode: string) => `${JSON.stringify({
  mode, status: result.plan109Eligible ? "zero_findings" : "blocked", findingCount: result.findingCount,
  findingRoot: result.findingRoot, payloadRoot: result.payload.payloadRoot, reviewRoot: result.reviewRoot,
  carrierRoot: result.carrier.carrierRoot, supplementRoot: result.supplement.supplementRoot,
  actualModesPassed: result.observations.actualModesPassed, liveInvoked: false, freshCharged: 0,
  freshAccepted: 0, plan109Eligible: result.plan109Eligible, downstreamAuthority: "denied",
})}\n`

export const executeV138Plan262108CorrectedCli = (
  args: readonly string[], injected?: Partial<V138Plan262108CorrectedCliDependencies>,
): void => {
  if (args.length !== 1 || !V138_PLAN_262_108_CORRECTED_MODES.includes(args[0] as never))
    fail("V138_PLAN_262_108_V9_ARGUMENTS_INVALID")
  const repoRoot = injected?.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
  const writeOutput = injected?.writeOutput ?? ((value: string) => process.stdout.write(value))
  const mode = args[0]!
  if (injected?.result !== undefined) { writeOutput(resultLine(injected.result, mode)); return }
  if (mode === "--write-review") { writeOutput(resultLine(publishV138Plan262108CorrectedReview(repoRoot), mode)); return }
  if (mode === "--check-review") {
    const publication = resolveV138Plan262108CorrectedPublication(repoRoot)
    const custody = authenticateV138Plan262108CorrectedTrioCustody(repoRoot, publication)
    writeOutput(`${JSON.stringify({ mode, status: custody.payload.reviewStatus, publicationCommit: publication,
      findingCount: custody.payload.findingCount, plan109Eligible: custody.payload.plan109Eligible,
      liveInvoked: false, downstreamAuthority: "denied" })}\n`)
    return
  }
  const result = deriveV138Plan262108CorrectedReview(repoRoot)
  writeOutput(resultLine(result, mode))
}

const isEntrypoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isEntrypoint) {
  try { executeV138Plan262108CorrectedCli(process.argv.slice(2)) }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
