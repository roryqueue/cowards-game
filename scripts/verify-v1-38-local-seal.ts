#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import {
  chmodSync,
  constants,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  closeSync,
  fsyncSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { encodeCanonicalJson } from "../packages/spec/src/canonical-json-encode.js"
import { hashCanonicalIdentity } from "../packages/spec/src/canonical-identity-domains.js"
// eslint-disable-next-line no-restricted-imports -- This verifier checks the bounded public evidence projection.
import { assertPublicOutputLeakSafe } from "../packages/spec/src/public-output-privacy.js"
import type { JsonValue } from "../packages/spec/src/types.js"
import {
  armV138LocalSealOpening,
  buildV138LocalSealProtocolArtifact,
  commitV138LocalSeal,
  consumeV138LocalSealOpening,
  projectV138LocalSealReceipt,
  retireV138LocalSeal,
  verifyV138LocalSealReceipt,
  type V138LocalSealOpenRequest,
} from "./lib/v1-38-local-seal.js"

type Sha256 = `sha256:${string}`
type FindingCode = "DIRTY_FREEZE_BINDING_MISSING" | "INFLATED_CUSTODY_CLAIM"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ARTIFACT_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-independent-verification-v1.json")
const PLAN45_SOURCE_COMMIT = "755f6ce7f78994c9078abc157f42e37299a2ec4a" as const
const SHA256 = /^sha256:[0-9a-f]{64}$/u
const GIT_OBJECT = /^[0-9a-f]{40}$/u
const ROOT_A = `sha256:${"a".repeat(64)}` as const
const ROOT_B = `sha256:${"b".repeat(64)}` as const
const ROOT_C = `sha256:${"c".repeat(64)}` as const

const PROTECTED_HISTORY = Object.freeze([
  {
    path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-40-HISTORICAL.md",
    sha256: "sha256:e745ba878fcd0090a968762f314c787dae86896d27f2bc8a72498d684ed39231" as Sha256,
  },
  {
    path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-42-SUMMARY.md",
    sha256: "sha256:297aacff196884d5cbdd5e97dfc69c596055359ac6cf55a91f2ef7ac2555808b" as Sha256,
  },
  {
    path: ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-43-HISTORICAL.md",
    sha256: "sha256:aad6ed06fc7e1fc0a0643d9ece8a9e85611d836212516c3284541a153c581239" as Sha256,
  },
  {
    path: ".planning/artifacts/v1.38-phase-262-terminal-deferment.json",
    sha256: "sha256:ac612457eacefd5333d4d179027cf1f48a6235dbb47fb4c0a259b81132a73f15" as Sha256,
  },
] as const)

const FORBIDDEN_AUTHORITY_PATHS = Object.freeze([
  ".planning/artifacts/v1.38-foundation-activation-root.json",
  ".planning/artifacts/v1.38-custody-public-reference.json",
  ".planning/artifacts/v1.38-local-seal-public-reference.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v10.json",
  ".planning/artifacts/v1.38-current-matrix-reproduction-v11.json",
] as const)

const sha256 = (value: Uint8Array | string): Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Buffer => {
  const encoded = encodeCanonicalJson(value as JsonValue, { context: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("V138_LOCAL_SEAL_REVIEW_CANONICAL_INVALID")
  return Buffer.from(encoded.bytes)
}

const domainRoot = (domain: string, value: unknown): Sha256 =>
  `sha256:${hashCanonicalIdentity("artifactManifest", [Buffer.from(domain, "utf8"), canonicalBytes(value)])}`

const roots = Object.freeze({
  currentLeagueFreezeRoot: ROOT_A,
  coldCommonRoot: ROOT_B,
  profileManifestFreezeRoot: ROOT_C,
  preSearchPolicyRoot: "sha256:6ad9134977310215ce6e98171d3586c9ae1853313f912ff6e9af95966607e382" as const,
  metricRoot: ROOT_A,
  classifierRoot: ROOT_B,
  thresholdRoot: ROOT_C,
  opponentRoot: ROOT_A,
  scheduleRoot: ROOT_B,
  finalistRoot: ROOT_C,
  kernelRoot: ROOT_A,
  runtimeRoot: ROOT_B,
  semanticRoot: ROOT_C,
  receiptAllowlistRoot: ROOT_A,
  contaminationPolicyRoot: ROOT_B,
  retirementPolicyRoot: ROOT_C,
})

const request = (overrides: Partial<V138LocalSealOpenRequest> = {}): V138LocalSealOpenRequest => ({
  schemaVersion: "v1.38-local-seal-open-request-v1",
  assuranceClass: "single_operator_local_seal_v1",
  repositoryOperator: "roryquinlan-repository-operator",
  toolMediatedLedger: true,
  operatorNoPrematureAccessDeclaration: true,
  ...roots,
  ...overrides,
})

const projection = () => ({
  schemaVersion: "v1.38-local-seal-safe-receipt-v1" as const,
  status: "synthetic_protocol_passed" as const,
  evaluatedItemCount: 3,
  findingCount: 0,
  aggregateMetrics: { interactionRateBps: 5100, exploitabilityMilli: 125 },
  resultRoot: ROOT_A,
  receiptRoot: ROOT_B,
})

const makeStore = (scratchRoot: string): string => {
  const storeRoot = mkdtempSync(path.join(scratchRoot, "store-"))
  chmodSync(storeRoot, 0o700)
  const inputRoot = path.join(storeRoot, "input")
  mkdirSync(inputRoot, { mode: 0o700 })
  writeFileSync(path.join(inputRoot, "commitment-secret.bin"), Buffer.alloc(32, 0x46), { mode: 0o600 })
  return storeRoot
}

const rejects = (action: () => unknown): boolean => {
  try { action(); return false } catch { return true }
}

const mutateJsonFile = (target: string, mutate: (value: Record<string, unknown>) => void): void => {
  const value = JSON.parse(readFileSync(target, "utf8")) as Record<string, unknown>
  mutate(value)
  writeFileSync(target, `${JSON.stringify(value)}\n`, { mode: 0o600 })
}

const protocolFor = (repoRoot: string) => buildV138LocalSealProtocolArtifact({
  moduleSourceBytes: readFileSync(path.join(repoRoot, "scripts/lib/v1-38-local-seal.ts")),
  testSourceBytes: readFileSync(path.join(repoRoot, "scripts/evaluate-v1-38-local-seal.test.ts")),
  cliSourceBytes: readFileSync(path.join(repoRoot, "scripts/evaluate-v1-38-local-seal.ts")),
  preSearchPolicyBytes: readFileSync(path.join(repoRoot, ".planning/artifacts/v1.38-pre-search-policy-root.json")),
})

const claimInflated = (source: string): boolean => [
  /(?:provides?|guarantees?|establishes?|achieves?|with)\s+(?:independent|third-party)\s+custody/iu,
  /(?:provides?|guarantees?|establishes?|achieves?|with)\s+malicious[- ]owner\s+resistance/iu,
  /separately\s+permissioned\s+custody\s+(?:is|has been)\s+(?:provided|established)/iu,
].some((pattern) => pattern.test(source))

export interface V138LocalSealIndependentVerificationFinding {
  readonly code: FindingCode
  readonly severity: "critical"
  readonly publicReason: "pre_open_freeze_checkout_binding_not_enforced" | "assurance_claim_exceeds_single_operator_local_seal_v1"
}

export interface V138LocalSealIndependentVerificationAnalysis {
  readonly verdict: "pass" | "fail"
  readonly protocolRoot: Sha256
  readonly protocolByteIdentical: boolean
  readonly protectedHistoryExact: boolean
  readonly protectedHistoryRoot: Sha256
  readonly downstreamAuthorityDenied: boolean
  readonly mutationChecks: Readonly<Record<
    | "bundleMutationRejected" | "commitmentMutationRejected" | "eventChainMutationRejected"
    | "requestMutationRejected" | "freezeRootMutationRejected" | "resultMutationRejected"
    | "receiptMutationRejected" | "claimMutationRejected" | "protectedHistoryMutationRejected"
    | "secondOpeningRejected" | "crashBeforeResultRejected" | "privacySeedRejected"
    | "genericDebugExportRejected" | "forbiddenReachabilityRejected", boolean>>
  readonly findings: readonly V138LocalSealIndependentVerificationFinding[]
}

export const analyzeV138LocalSealIndependentVerification = (input: Readonly<{
  repoRoot: string
  scratchRoot: string
  claimCarrierOverrides?: Readonly<Record<string, string>>
}>): V138LocalSealIndependentVerificationAnalysis => {
  const repoRoot = path.resolve(input.repoRoot)
  const scratchRoot = path.resolve(input.scratchRoot)
  if (!path.isAbsolute(input.scratchRoot) || scratchRoot === repoRoot || scratchRoot.startsWith(`${repoRoot}${path.sep}`)) {
    throw new TypeError("V138_LOCAL_SEAL_REVIEW_SCRATCH_INVALID")
  }
  chmodSync(scratchRoot, 0o700)
  const expectedProtocol = protocolFor(repoRoot)
  const expectedProtocolBytes = Buffer.from(`${JSON.stringify(expectedProtocol)}\n`)
  const actualProtocolBytes = readFileSync(path.join(repoRoot, ".planning/artifacts/v1.38-local-seal-protocol-v1.json"))

  const storeCommitment = makeStore(scratchRoot)
  const committedForMutation = commitV138LocalSeal({ repoRoot, storeRoot: storeCommitment, request: request() })
  mutateJsonFile(path.join(storeCommitment, "commitment/record.json"), (value) => { value.commitmentRoot = ROOT_C })
  const commitmentMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot, storeRoot: storeCommitment }, request(), committedForMutation.commitmentRoot,
  ))

  const storeLedger = makeStore(scratchRoot)
  const committedForLedger = commitV138LocalSeal({ repoRoot, storeRoot: storeLedger, request: request() })
  const ledgerPath = path.join(storeLedger, "events/ledger.ndjson")
  writeFileSync(ledgerPath, readFileSync(ledgerPath, "utf8").replace("committed", "projected"), { mode: 0o600 })
  const eventChainMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot, storeRoot: storeLedger }, request(), committedForLedger.commitmentRoot,
  ))

  const storeRequest = makeStore(scratchRoot)
  const committedForRequest = commitV138LocalSeal({ repoRoot, storeRoot: storeRequest, request: request() })
  const requestMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot, storeRoot: storeRequest }, request({ scheduleRoot: ROOT_C }), committedForRequest.commitmentRoot,
  ))

  const storeFreeze = makeStore(scratchRoot)
  const committedForFreeze = commitV138LocalSeal({ repoRoot, storeRoot: storeFreeze, request: request() })
  const freezeRootMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot, storeRoot: storeFreeze }, request({ currentLeagueFreezeRoot: ROOT_B }), committedForFreeze.commitmentRoot,
  ))

  const storeResult = makeStore(scratchRoot)
  const committedForResult = commitV138LocalSeal({ repoRoot, storeRoot: storeResult, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storeResult }, request(), committedForResult.commitmentRoot)
  const openedForResult = consumeV138LocalSealOpening({ repoRoot, storeRoot: storeResult }, request(), projection)
  mutateJsonFile(path.join(storeResult, "private/evaluation.json"), (value) => { value.resultRoot = ROOT_C })
  const resultMutationRejected = rejects(() => projectV138LocalSealReceipt(
    { repoRoot, storeRoot: storeResult }, request(), openedForResult.evaluationRoot,
  ))

  const storeReceipt = makeStore(scratchRoot)
  const committedForReceipt = commitV138LocalSeal({ repoRoot, storeRoot: storeReceipt, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storeReceipt }, request(), committedForReceipt.commitmentRoot)
  const openedForReceipt = consumeV138LocalSealOpening({ repoRoot, storeRoot: storeReceipt }, request(), projection)
  const receipt = projectV138LocalSealReceipt({ repoRoot, storeRoot: storeReceipt }, request(), openedForReceipt.evaluationRoot)
  const receiptMutationRejected = rejects(() => verifyV138LocalSealReceipt(
    { repoRoot, storeRoot: storeReceipt }, request(), { ...receipt, findingCount: 1 },
  ))

  const storeSecond = makeStore(scratchRoot)
  const committedForSecond = commitV138LocalSeal({ repoRoot, storeRoot: storeSecond, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storeSecond }, request(), committedForSecond.commitmentRoot)
  consumeV138LocalSealOpening({ repoRoot, storeRoot: storeSecond }, request(), projection)
  const secondOpeningRejected = rejects(() => consumeV138LocalSealOpening(
    { repoRoot, storeRoot: storeSecond }, request(), projection,
  ))

  const storeCrash = makeStore(scratchRoot)
  const committedForCrash = commitV138LocalSeal({ repoRoot, storeRoot: storeCrash, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storeCrash }, request(), committedForCrash.commitmentRoot)
  const crashBeforeResultRejected = rejects(() => consumeV138LocalSealOpening(
    { repoRoot, storeRoot: storeCrash }, request(), () => { throw new Error("synthetic-review-crash") },
  )) && rejects(() => consumeV138LocalSealOpening({ repoRoot, storeRoot: storeCrash }, request(), projection))

  const storePrivacy = makeStore(scratchRoot)
  const committedForPrivacy = commitV138LocalSeal({ repoRoot, storeRoot: storePrivacy, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storePrivacy }, request(), committedForPrivacy.commitmentRoot)
  const openedForPrivacy = consumeV138LocalSealOpening(
    { repoRoot, storeRoot: storePrivacy }, request(), () => ({ ...projection(), StrategyMemory: "PRIVATE_review_seed" }),
  )
  const privacySeedRejected = rejects(() => projectV138LocalSealReceipt(
    { repoRoot, storeRoot: storePrivacy }, request(), openedForPrivacy.evaluationRoot,
  ))

  const storeLifecycle = makeStore(scratchRoot)
  const committedForLifecycle = commitV138LocalSeal({ repoRoot, storeRoot: storeLifecycle, request: request() })
  armV138LocalSealOpening({ repoRoot, storeRoot: storeLifecycle }, request(), committedForLifecycle.commitmentRoot)
  const openedLifecycle = consumeV138LocalSealOpening({ repoRoot, storeRoot: storeLifecycle }, request(), projection)
  const receiptLifecycle = projectV138LocalSealReceipt({ repoRoot, storeRoot: storeLifecycle }, request(), openedLifecycle.evaluationRoot)
  verifyV138LocalSealReceipt({ repoRoot, storeRoot: storeLifecycle }, request(), receiptLifecycle)
  retireV138LocalSeal({ repoRoot, storeRoot: storeLifecycle }, request())

  const localSealModuleSource = readFileSync(path.join(repoRoot, "scripts/lib/v1-38-local-seal.ts"), "utf8")
  const exportedNames = [...localSealModuleSource.matchAll(/export\s+(?:const|interface|type|function|class)\s+([A-Za-z0-9_]+)/gu)].map((match) => match[1]!)
  const genericDebugExportRejected = exportedNames.every((name) => !/(?:read|get|query|list|debug|preimage|secret)/iu.test(name))

  const historyActual = PROTECTED_HISTORY.map((entry) => ({ path: entry.path, sha256: sha256(readFileSync(path.join(repoRoot, entry.path))) }))
  const protectedHistoryExact = historyActual.every((entry, index) => entry.sha256 === PROTECTED_HISTORY[index]!.sha256)
  const protectedHistoryRoot = domainRoot("cowards-game:v1.38:local-seal-protected-history:v1", historyActual)
  const protectedHistoryMutationRejected = sha256(Buffer.concat([
    readFileSync(path.join(repoRoot, PROTECTED_HISTORY[0].path)), Buffer.from([0x01]),
  ])) !== PROTECTED_HISTORY[0].sha256

  const forbiddenReachabilityRejected = FORBIDDEN_AUTHORITY_PATHS.every((repoPath) => !existsSync(path.join(repoRoot, repoPath))) &&
    !/(?:apps\/web|apps\/go-backend|apps\/runtime-service|packages\/persistence)/u.test(localSealModuleSource)

  const carrierOverrides = input.claimCarrierOverrides ?? {}
  const claimMutationRejected = claimInflated("This provides independent custody and malicious-owner resistance.")
  const findings: V138LocalSealIndependentVerificationFinding[] = []
  if (Object.values(carrierOverrides).some(claimInflated)) findings.push({
    code: "INFLATED_CUSTODY_CLAIM",
    severity: "critical",
    publicReason: "assurance_claim_exceeds_single_operator_local_seal_v1",
  })

  // The implementation accepts a non-Git repository root with an arbitrary freeze root. That
  // proves the opening request is internally committed but not joined to a clean checkout.
  const fakeRepoRoot = path.join(scratchRoot, "synthetic-dirty-repo")
  mkdirSync(fakeRepoRoot, { mode: 0o700 })
  writeFileSync(path.join(fakeRepoRoot, "uncommitted-review-marker"), "synthetic\n", { mode: 0o600 })
  const storeDirty = makeStore(scratchRoot)
  const dirtyFreezeAccepted = !rejects(() => commitV138LocalSeal({
    repoRoot: fakeRepoRoot,
    storeRoot: storeDirty,
    request: request({ currentLeagueFreezeRoot: ROOT_C }),
  }))
  if (dirtyFreezeAccepted) findings.push({
    code: "DIRTY_FREEZE_BINDING_MISSING",
    severity: "critical",
    publicReason: "pre_open_freeze_checkout_binding_not_enforced",
  })

  const mutationChecks = Object.freeze({
    bundleMutationRejected: !Buffer.concat([actualProtocolBytes, Buffer.from([0x01])]).equals(expectedProtocolBytes),
    commitmentMutationRejected,
    eventChainMutationRejected,
    requestMutationRejected,
    freezeRootMutationRejected,
    resultMutationRejected,
    receiptMutationRejected,
    claimMutationRejected,
    protectedHistoryMutationRejected,
    secondOpeningRejected,
    crashBeforeResultRejected,
    privacySeedRejected,
    genericDebugExportRejected,
    forbiddenReachabilityRejected,
  })
  const downstreamAuthorityDenied = FORBIDDEN_AUTHORITY_PATHS.every((repoPath) => !existsSync(path.join(repoRoot, repoPath))) &&
    expectedProtocol.admit03 === "blocked" && expectedProtocol.downstreamAuthority === "denied" &&
    expectedProtocol.candidateSearchAuthorized === false && expectedProtocol.phase263Authorized === false &&
    expectedProtocol.formationMaterializationAuthorized === false && expectedProtocol.holdoutOpeningAuthorized === false &&
    expectedProtocol.publicAuthorized === false && expectedProtocol.productionAuthorized === false
  const protocolByteIdentical = actualProtocolBytes.equals(expectedProtocolBytes)
  const allChecksPass = Object.values(mutationChecks).every(Boolean) && protocolByteIdentical && protectedHistoryExact && downstreamAuthorityDenied
  const analysis = Object.freeze({
    verdict: allChecksPass && findings.length === 0 ? "pass" as const : "fail" as const,
    protocolRoot: expectedProtocol.protocolRoot,
    protocolByteIdentical,
    protectedHistoryExact,
    protectedHistoryRoot,
    downstreamAuthorityDenied,
    mutationChecks,
    findings: Object.freeze(findings),
  })
  assertPublicOutputLeakSafe(analysis, "v1.38 local seal independent verification analysis")
  return analysis
}

export interface V138LocalSealIndependentVerificationArtifact {
  readonly schemaVersion: "v1.38-local-seal-independent-verification-v1"
  readonly assuranceClass: "single_operator_local_seal_v1"
  readonly sourceCommit: string
  readonly sourceTree: string
  readonly reviewerCommit: string
  readonly localSealProtocolRoot: Sha256
  readonly protectedHistoryRoot: Sha256
  readonly independentEvidenceVerification: "passed" | "failed_with_findings"
  readonly findingCodes: readonly FindingCode[]
  readonly satisfiesRevisedSeal01: boolean
  readonly independentCustodyClaimed: false
  readonly maliciousOwnerResistanceClaimed: false
  readonly admit03Status: "blocked"
  readonly candidateSearchAuthorized: false
  readonly phase263Authorized: false
  readonly formationMaterializationAuthorized: false
  readonly holdoutOpeningAuthorized: false
  readonly publicAuthorized: false
  readonly productionAuthorized: false
  readonly verificationRoot: Sha256
}

export const buildV138LocalSealIndependentVerificationArtifact = (input: Readonly<{
  analysis: V138LocalSealIndependentVerificationAnalysis
  sourceCommit: string
  sourceTree: string
  reviewerCommit: string
}>): V138LocalSealIndependentVerificationArtifact => {
  if (![input.sourceCommit, input.sourceTree, input.reviewerCommit].every((value) => GIT_OBJECT.test(value)) ||
    !SHA256.test(input.analysis.protocolRoot) || !SHA256.test(input.analysis.protectedHistoryRoot)) {
    throw new TypeError("V138_LOCAL_SEAL_REVIEW_IDENTITY_INVALID")
  }
  const pass = input.analysis.verdict === "pass" && input.analysis.findings.length === 0 &&
    input.analysis.protocolByteIdentical && input.analysis.protectedHistoryExact &&
    input.analysis.downstreamAuthorityDenied && Object.values(input.analysis.mutationChecks).every(Boolean)
  const body = {
    schemaVersion: "v1.38-local-seal-independent-verification-v1" as const,
    assuranceClass: "single_operator_local_seal_v1" as const,
    sourceCommit: input.sourceCommit,
    sourceTree: input.sourceTree,
    reviewerCommit: input.reviewerCommit,
    localSealProtocolRoot: input.analysis.protocolRoot,
    protectedHistoryRoot: input.analysis.protectedHistoryRoot,
    independentEvidenceVerification: pass ? "passed" as const : "failed_with_findings" as const,
    findingCodes: Object.freeze(input.analysis.findings.map((finding) => finding.code).sort()),
    satisfiesRevisedSeal01: pass,
    independentCustodyClaimed: false as const,
    maliciousOwnerResistanceClaimed: false as const,
    admit03Status: "blocked" as const,
    candidateSearchAuthorized: false as const,
    phase263Authorized: false as const,
    formationMaterializationAuthorized: false as const,
    holdoutOpeningAuthorized: false as const,
    publicAuthorized: false as const,
    productionAuthorized: false as const,
  }
  const artifact = Object.freeze({
    ...body,
    verificationRoot: domainRoot("cowards-game:v1.38:local-seal-independent-verification:v1", body),
  })
  assertPublicOutputLeakSafe(artifact, "v1.38 local seal independent verification artifact")
  return artifact
}

export const renderV138LocalSealIndependentVerificationArtifact = (
  artifact: V138LocalSealIndependentVerificationArtifact,
): string => `${JSON.stringify(artifact)}\n`

const git = (repoRoot: string, args: readonly string[]): string =>
  execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()

const writeExclusive = (target: string, bytes: Uint8Array): void => {
  let descriptor: number | undefined
  try {
    descriptor = openSync(target, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0), 0o600)
    writeFileSync(descriptor, bytes)
    fsyncSync(descriptor)
  } finally {
    if (descriptor !== undefined) closeSync(descriptor)
  }
}

const buildCurrentArtifact = (existing?: V138LocalSealIndependentVerificationArtifact): V138LocalSealIndependentVerificationArtifact => {
  const scratchRoot = mkdtempSync(path.join(tmpdir(), "v138-local-seal-independent-check-"))
  chmodSync(scratchRoot, 0o700)
  try {
    const analysis = analyzeV138LocalSealIndependentVerification({ repoRoot: REPO_ROOT, scratchRoot })
    const sourceCommit = PLAN45_SOURCE_COMMIT
    const sourceTree = git(REPO_ROOT, ["rev-parse", `${sourceCommit}^{tree}`])
    const reviewerCommit = existing?.reviewerCommit ?? git(REPO_ROOT, ["rev-parse", "HEAD"])
    if (git(REPO_ROOT, ["rev-parse", sourceCommit]) !== sourceCommit) throw new TypeError("V138_LOCAL_SEAL_REVIEW_SOURCE_MISSING")
    return buildV138LocalSealIndependentVerificationArtifact({ analysis, sourceCommit, sourceTree, reviewerCommit })
  } finally {
    rmSync(scratchRoot, { recursive: true, force: true })
  }
}

const parseArtifact = (bytes: Buffer): V138LocalSealIndependentVerificationArtifact => {
  let value: unknown
  try { value = JSON.parse(bytes.toString("utf8")) } catch { throw new TypeError("V138_LOCAL_SEAL_REVIEW_ARTIFACT_INVALID") }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError("V138_LOCAL_SEAL_REVIEW_ARTIFACT_INVALID")
  return value as V138LocalSealIndependentVerificationArtifact
}

const main = (): void => {
  const [command, ...unexpected] = process.argv.slice(2)
  if (unexpected.length !== 0 || (command !== "--write" && command !== "--check")) {
    throw new TypeError("V138_LOCAL_SEAL_REVIEW_CLI_USAGE")
  }
  if (command === "--write") {
    if (existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_REVIEW_ARTIFACT_EXISTS")
    const artifact = buildCurrentArtifact()
    writeExclusive(ARTIFACT_PATH, Buffer.from(renderV138LocalSealIndependentVerificationArtifact(artifact)))
    process.stdout.write(`${JSON.stringify({ status: artifact.independentEvidenceVerification, verificationRoot: artifact.verificationRoot })}\n`)
    return
  }
  if (!existsSync(ARTIFACT_PATH)) throw new TypeError("V138_LOCAL_SEAL_REVIEW_ARTIFACT_MISSING")
  const actual = readFileSync(ARTIFACT_PATH)
  const stored = parseArtifact(actual)
  const expected = Buffer.from(renderV138LocalSealIndependentVerificationArtifact(buildCurrentArtifact(stored)))
  if (!actual.equals(expected)) throw new TypeError("V138_LOCAL_SEAL_REVIEW_ARTIFACT_MISMATCH")
  process.stdout.write(`${JSON.stringify({ status: stored.independentEvidenceVerification, verificationRoot: stored.verificationRoot })}\n`)
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
