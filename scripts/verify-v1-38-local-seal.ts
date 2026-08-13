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
  buildV138LocalSealProtocolArtifactV2,
  commitV138LocalSeal,
  consumeV138LocalSealOpening,
  deriveV138LocalSealCheckoutIdentity,
  projectV138LocalSealReceipt,
  retireV138LocalSeal,
  verifyV138LocalSealReceipt,
  type V138LocalSealOpenRequest,
} from "./lib/v1-38-local-seal.js"

type Sha256 = `sha256:${string}`
type FindingCode = "DIRTY_FREEZE_BINDING_MISSING" | "INFLATED_CUSTODY_CLAIM"

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const ARTIFACT_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-independent-verification-v1.json")
const ARTIFACT_V2_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-independent-verification-v2.json")
const ARTIFACT_V3_PATH = path.join(REPO_ROOT, ".planning/artifacts/v1.38-local-seal-independent-verification-v3.json")
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

const protocolFor = (repoRoot: string) => buildV138LocalSealProtocolArtifactV2({
  moduleSourceBytes: readFileSync(path.join(repoRoot, "scripts/lib/v1-38-local-seal.ts")),
  testSourceBytes: readFileSync(path.join(repoRoot, "scripts/evaluate-v1-38-local-seal.test.ts")),
  cliSourceBytes: readFileSync(path.join(repoRoot, "scripts/evaluate-v1-38-local-seal.ts")),
  preSearchPolicyBytes: readFileSync(path.join(repoRoot, ".planning/artifacts/v1.38-pre-search-policy-root.json")),
})

const makeCleanSealCheckout = (scratchRoot: string): Readonly<{
  repoRoot: string
  request: V138LocalSealOpenRequest
}> => {
  const repoRoot = mkdtempSync(path.join(scratchRoot, "checkout-"))
  chmodSync(repoRoot, 0o700)
  execFileSync("git", ["-C", repoRoot, "init", "--quiet"], { stdio: "ignore" })
  execFileSync("git", ["-C", repoRoot, "config", "user.email", "local-seal-review@example.invalid"], { stdio: "ignore" })
  execFileSync("git", ["-C", repoRoot, "config", "user.name", "Local Seal Review"], { stdio: "ignore" })
  writeFileSync(path.join(repoRoot, "freeze-carrier.json"), "{\"schemaVersion\":\"review-fixture-v2\"}\n", { mode: 0o600 })
  execFileSync("git", ["-C", repoRoot, "add", "freeze-carrier.json"], { stdio: "ignore" })
  execFileSync("git", ["-C", repoRoot, "commit", "--quiet", "-m", "freeze carrier"], { stdio: "ignore" })
  const checkout = deriveV138LocalSealCheckoutIdentity(repoRoot)
  return { repoRoot, request: request({ currentLeagueFreezeRoot: checkout.currentLeagueFreezeRoot }) }
}

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
  const sealCheckout = makeCleanSealCheckout(scratchRoot)
  const sealRepoRoot = sealCheckout.repoRoot
  const sealRequest = sealCheckout.request
  const expectedProtocol = protocolFor(repoRoot)
  const expectedProtocolBytes = Buffer.from(`${JSON.stringify(expectedProtocol)}\n`)
  const actualProtocolBytes = readFileSync(path.join(repoRoot, ".planning/artifacts/v1.38-local-seal-protocol-v2.json"))

  const storeCommitment = makeStore(scratchRoot)
  const committedForMutation = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeCommitment, request: sealRequest })
  mutateJsonFile(path.join(storeCommitment, "commitment/record.json"), (value) => { value.commitmentRoot = ROOT_C })
  const commitmentMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeCommitment }, sealRequest, committedForMutation.commitmentRoot,
  ))

  const storeLedger = makeStore(scratchRoot)
  const committedForLedger = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeLedger, request: sealRequest })
  const ledgerPath = path.join(storeLedger, "events/ledger.ndjson")
  writeFileSync(ledgerPath, readFileSync(ledgerPath, "utf8").replace("committed", "projected"), { mode: 0o600 })
  const eventChainMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeLedger }, sealRequest, committedForLedger.commitmentRoot,
  ))

  const storeRequest = makeStore(scratchRoot)
  const committedForRequest = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeRequest, request: sealRequest })
  const requestMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeRequest }, { ...sealRequest, scheduleRoot: ROOT_C }, committedForRequest.commitmentRoot,
  ))

  const storeFreeze = makeStore(scratchRoot)
  const committedForFreeze = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeFreeze, request: sealRequest })
  const freezeRootMutationRejected = rejects(() => armV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeFreeze }, { ...sealRequest, currentLeagueFreezeRoot: ROOT_B }, committedForFreeze.commitmentRoot,
  ))

  const storeResult = makeStore(scratchRoot)
  const committedForResult = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeResult, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeResult }, sealRequest, committedForResult.commitmentRoot)
  const openedForResult = consumeV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeResult }, sealRequest, projection)
  mutateJsonFile(path.join(storeResult, "private/evaluation.json"), (value) => { value.resultRoot = ROOT_C })
  const resultMutationRejected = rejects(() => projectV138LocalSealReceipt(
    { repoRoot: sealRepoRoot, storeRoot: storeResult }, sealRequest, openedForResult.evaluationRoot,
  ))

  const storeReceipt = makeStore(scratchRoot)
  const committedForReceipt = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeReceipt, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeReceipt }, sealRequest, committedForReceipt.commitmentRoot)
  const openedForReceipt = consumeV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeReceipt }, sealRequest, projection)
  const receipt = projectV138LocalSealReceipt({ repoRoot: sealRepoRoot, storeRoot: storeReceipt }, sealRequest, openedForReceipt.evaluationRoot)
  const receiptMutationRejected = rejects(() => verifyV138LocalSealReceipt(
    { repoRoot: sealRepoRoot, storeRoot: storeReceipt }, sealRequest, { ...receipt, findingCount: 1 },
  ))

  const storeSecond = makeStore(scratchRoot)
  const committedForSecond = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeSecond, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeSecond }, sealRequest, committedForSecond.commitmentRoot)
  consumeV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeSecond }, sealRequest, projection)
  const secondOpeningRejected = rejects(() => consumeV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeSecond }, sealRequest, projection,
  ))

  const storeCrash = makeStore(scratchRoot)
  const committedForCrash = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeCrash, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeCrash }, sealRequest, committedForCrash.commitmentRoot)
  const crashBeforeResultRejected = rejects(() => consumeV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storeCrash }, sealRequest, () => { throw new Error("synthetic-review-crash") },
  )) && rejects(() => consumeV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeCrash }, sealRequest, projection))

  const storePrivacy = makeStore(scratchRoot)
  const committedForPrivacy = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storePrivacy, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storePrivacy }, sealRequest, committedForPrivacy.commitmentRoot)
  const openedForPrivacy = consumeV138LocalSealOpening(
    { repoRoot: sealRepoRoot, storeRoot: storePrivacy }, sealRequest, () => ({ ...projection(), StrategyMemory: "PRIVATE_review_seed" }),
  )
  const privacySeedRejected = rejects(() => projectV138LocalSealReceipt(
    { repoRoot: sealRepoRoot, storeRoot: storePrivacy }, sealRequest, openedForPrivacy.evaluationRoot,
  ))

  const storeLifecycle = makeStore(scratchRoot)
  const committedForLifecycle = commitV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle, request: sealRequest })
  armV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle }, sealRequest, committedForLifecycle.commitmentRoot)
  const openedLifecycle = consumeV138LocalSealOpening({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle }, sealRequest, projection)
  const receiptLifecycle = projectV138LocalSealReceipt({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle }, sealRequest, openedLifecycle.evaluationRoot)
  verifyV138LocalSealReceipt({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle }, sealRequest, receiptLifecycle)
  retireV138LocalSeal({ repoRoot: sealRepoRoot, storeRoot: storeLifecycle }, sealRequest)

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

type VersionedVerificationVersion = "v2" | "v3"

export interface V138LocalSealVersionedVerificationResult {
  readonly status: "passed" | "failed_with_findings"
  readonly verificationRoot: Sha256
  readonly satisfiesRevisedSeal01: boolean
}

const VERSIONED_EVIDENCE = Object.freeze({
  localSealProtocolV1: "sha256:0db2b18d7e09894d52856478415889748802b745f1a36ca0d1bc1fcb39ecec5e",
  independentVerificationV1: "sha256:01a7e1e8e5534a762845cf39be3ed4c79ff98c6cda8bcd3e86f7ffaafe1c6c3e",
  plan26246Review: "sha256:d23272bc13a6f35c9158dae3b9da881deffcf13a490c627c60f4cc3e227bb96b",
  archivedPlan26246: "sha256:ebe4a0a03768ed47984058d5ba1166c861d4d70e6bf95ac17799ab36bae87f41",
  localSealProtocolV2: "sha256:b6c087a10d17eb1a8361b0beea728f5c987cd7b8e3a73f417c98c97aed1995c9",
  independentVerificationV2: "sha256:277b20a6149947e73532c83a92205621108a0afe804c10115c8eccb74185c8e6",
  plan26250Review: "sha256:704148d7882277fc7b033756879dd6afe9226edc5583c6de14cf01c7cfa4c8ba",
  archivedPlan26250: "sha256:e7ebdabdd057c541b09ab2337cd5f9fc505212f2b965a70aa042f8d0dcda81c8",
} as const)

const V2_KEYS = Object.freeze([
  "schemaVersion", "assuranceClass", "sourceCommit", "sourceTree", "sourceParent", "reviewerIdentity",
  "reviewerSourceAuthorSeparated", "plan26249ImplementationCommits", "cleanSourceStatus", "localSealProtocolRoot",
  "protectedInventoryRoot", "preservedEvidenceSha256", "regressionResults", "mutationResults", "commandResults",
  "findingCount", "findingCodes", "independentEvidenceVerification", "satisfiesRevisedSeal01",
  "independentCustodyClaimed", "maliciousOwnerResistanceClaimed", "comprehensiveHostMonitoringClaimed",
  "cryptographicErasureClaimed", "admit03Status", "candidateSearchAuthorized", "phase263Authorized",
  "formationMaterializationAuthorized", "holdoutOpeningAuthorized", "publicAuthorized", "activationAuthorized",
  "productionAuthorized", "downstreamAuthority", "verificationRoot",
] as const)

const V3_KEYS = Object.freeze([
  "schemaVersion", "assuranceClass", "sourceCommit", "sourceTree", "sourceParent", "reviewerIdentity",
  "reviewerSourceAuthorSeparated", "plan26251ImplementationCommits", "cleanSourceStatus", "localSealProtocolRoot",
  "protectedInventoryRoot", "preservedEvidenceSha256", "regressionResults", "commandResults", "findingCount",
  "findingCodes", "independentEvidenceVerification", "satisfiesRevisedSeal01", "independentCustodyClaimed",
  "maliciousOwnerResistanceClaimed", "comprehensiveHostMonitoringClaimed", "cryptographicErasureClaimed",
  "admit03Status", "candidateSearchAuthorized", "phase263Authorized", "formationMaterializationAuthorized",
  "holdoutOpeningAuthorized", "publicAuthorized", "activationAuthorized", "productionAuthorized",
  "downstreamAuthority", "verificationRoot",
] as const)

const recordKeysExact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) &&
  JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort())

const zeroCleanStatus = (value: unknown): boolean => recordKeysExact(value, ["staged", "unstaged", "untracked"]) &&
  value.staged === 0 && value.unstaged === 0 && value.untracked === 0

const exactRecord = (value: unknown, expected: Readonly<Record<string, unknown>>): boolean =>
  recordKeysExact(value, Object.keys(expected)) && Object.entries(expected).every(([key, expectedValue]) => value[key] === expectedValue)

const exactFalseAuthority = (value: Readonly<Record<string, unknown>>): boolean =>
  value.assuranceClass === "single_operator_local_seal_v1" && value.independentCustodyClaimed === false &&
  value.maliciousOwnerResistanceClaimed === false && value.comprehensiveHostMonitoringClaimed === false &&
  value.cryptographicErasureClaimed === false && value.admit03Status === "blocked" &&
  value.candidateSearchAuthorized === false && value.phase263Authorized === false &&
  value.formationMaterializationAuthorized === false && value.holdoutOpeningAuthorized === false &&
  value.publicAuthorized === false && value.activationAuthorized === false && value.productionAuthorized === false &&
  value.downstreamAuthority === "denied"

export const calculateV138LocalSealVersionedVerificationRoot = (
  version: VersionedVerificationVersion,
  body: Readonly<Record<string, unknown>>,
): Sha256 => {
  if (version !== "v2" && version !== "v3") throw new TypeError("V138_LOCAL_SEAL_VERSIONED_VERSION_INVALID")
  if (Object.hasOwn(body, "verificationRoot")) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ROOT_BODY_INVALID")
  return domainRoot(`cowards-game:v1.38:local-seal-independent-verification:${version}`, body)
}

const parseVersionedArtifact = (bytes: Buffer): Record<string, unknown> => {
  let value: unknown
  try { value = JSON.parse(bytes.toString("utf8")) } catch {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_INVALID")
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_INVALID")
  }
  if (!bytes.equals(Buffer.from(`${JSON.stringify(value)}\n`))) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_NONCANONICAL")
  }
  return value as Record<string, unknown>
}

const verifyVersionedRoot = (version: VersionedVerificationVersion, artifact: Record<string, unknown>): void => {
  if (typeof artifact.verificationRoot !== "string" || !SHA256.test(artifact.verificationRoot)) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ROOT_INVALID")
  }
  const { verificationRoot, ...body } = artifact
  if (verificationRoot !== calculateV138LocalSealVersionedVerificationRoot(version, body)) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ROOT_MISMATCH")
  }
}

const verifyPreservedEvidence = (value: unknown, includeV2: boolean): void => {
  const expected = includeV2 ? VERSIONED_EVIDENCE : {
    localSealProtocolV1: VERSIONED_EVIDENCE.localSealProtocolV1,
    independentVerificationV1: VERSIONED_EVIDENCE.independentVerificationV1,
    plan26246Review: VERSIONED_EVIDENCE.plan26246Review,
    archivedPlan26246: VERSIONED_EVIDENCE.archivedPlan26246,
    localSealProtocolV2: VERSIONED_EVIDENCE.localSealProtocolV2,
  }
  if (!exactRecord(value, expected)) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_EVIDENCE_MISMATCH")
}

const verifyV2Artifact = (artifact: Record<string, unknown>): V138LocalSealVersionedVerificationResult => {
  if (!recordKeysExact(artifact, V2_KEYS) || artifact.schemaVersion !== "v1.38-local-seal-independent-verification-v2") {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_SCHEMA_INVALID")
  }
  verifyVersionedRoot("v2", artifact)
  if (artifact.sourceCommit !== "0a33db37473faff95025e0d51f6281cd38f18769" ||
    artifact.sourceTree !== "b78fef698069c8e01aa8d9a91259d880f3a1a328" ||
    artifact.sourceParent !== "00af433feffe681ed99364df7b4997f0c38c42d4" ||
    artifact.reviewerIdentity !== "codex-independent-plan-262-50-reviewer" ||
    artifact.reviewerSourceAuthorSeparated !== true || !zeroCleanStatus(artifact.cleanSourceStatus) ||
    artifact.localSealProtocolRoot !== "sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a" ||
    artifact.protectedInventoryRoot !== "sha256:cb88cde2ae9e201c246959b1b60e6173ea9ee59cb552bc6ef2b57252479c576a") {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_IDENTITY_MISMATCH")
  }
  const commits = artifact.plan26249ImplementationCommits
  if (!Array.isArray(commits) || JSON.stringify(commits) !== JSON.stringify([
    "3567c61c58ee2f3b0d7b82438720ea452532e0f8", "e30c6ef8c77e9de5ab45e897083ae7dafbd60eb8",
    "def3d25a1ef9dd31fe4d503204035b838933bd65", "85e41dbf884cec3f49a2f6c9a74431cc2f2139e9",
    "c19b6089fe18062057613a0ea0d2ae81773d4be9", "00af433feffe681ed99364df7b4997f0c38c42d4",
  ])) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_IDENTITY_MISMATCH")
  verifyPreservedEvidence(artifact.preservedEvidenceSha256, false)
  if (!exactRecord(artifact.regressionResults, {
    DIRTY_FREEZE_BINDING_MISSING: "resolved", PLAN_DISCOVERY_DRIFT: "resolved", PRIVATE_DATA_EXPOSURE: "resolved",
  }) || !recordKeysExact(artifact.mutationResults, [
    "nonGitRejected", "dirtyStagedRejected", "dirtyUnstagedRejected", "dirtyUntrackedRejected",
    "inventedFreezeRejected", "abbreviatedIdentityRejected", "headDriftRejectedBeforeEvaluation",
    "treeDriftRejectedBeforeEvaluation", "commitToArmDriftRejectedBeforeEvaluation", "planIndexExact",
    "privacyFalsePositiveAbsent", "privacyTrueLeakSeedsRejected", "lifecycleMutationsRejected",
    "protectedHistoryMutationsRejected", "authorityMutationsRejected", "forbiddenReachabilityRejected",
  ]) || !Object.values(artifact.mutationResults).every((result) => result === true)) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_REGRESSION_INVALID")
  }
  if (!exactRecord(artifact.commandResults, {
    focusedSuites: "passed_39_with_1_platform_conditional_skip", protocolV2ByteCheck: "passed",
    independentVerifierV2Check: "failed_V138_LOCAL_SEAL_REVIEW_CLI_USAGE",
    dependencyRevisionBoundaryCheck: "passed_zero_findings_145_paths_12_sources",
    typecheck: "passed_27_of_27", diffCheck: "passed",
  })) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_COMMAND_INVALID")
  if (!exactFalseAuthority(artifact)) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_AUTHORITY_INVALID")
  if (artifact.findingCount !== 1 || JSON.stringify(artifact.findingCodes) !== JSON.stringify(["V2_VERIFIER_MODE_MISSING"]) ||
    artifact.independentEvidenceVerification !== "failed_with_findings" || artifact.satisfiesRevisedSeal01 !== false) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_DISPOSITION_INVALID")
  }
  return Object.freeze({
    status: "failed_with_findings" as const,
    verificationRoot: artifact.verificationRoot as Sha256,
    satisfiesRevisedSeal01: false,
  })
}

const verifyV3Artifact = (artifact: Record<string, unknown>): V138LocalSealVersionedVerificationResult => {
  if (!recordKeysExact(artifact, V3_KEYS) || artifact.schemaVersion !== "v1.38-local-seal-independent-verification-v3") {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_SCHEMA_INVALID")
  }
  verifyVersionedRoot("v3", artifact)
  if (![artifact.sourceCommit, artifact.sourceTree, artifact.sourceParent].every((value) => typeof value === "string" && GIT_OBJECT.test(value)) ||
    typeof artifact.reviewerIdentity !== "string" || !/^codex-independent-plan-262-52-reviewer$/u.test(artifact.reviewerIdentity) ||
    artifact.reviewerSourceAuthorSeparated !== true || !zeroCleanStatus(artifact.cleanSourceStatus) ||
    artifact.localSealProtocolRoot !== "sha256:bd4cd1af650f026fd45045d45069eaad0ccd7154140899e314780bb0ec38541a" ||
    typeof artifact.protectedInventoryRoot !== "string" || !SHA256.test(artifact.protectedInventoryRoot)) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_IDENTITY_MISMATCH")
  }
  const commits = artifact.plan26251ImplementationCommits
  if (!Array.isArray(commits) || commits.length === 0 || !commits.every((value) => typeof value === "string" && GIT_OBJECT.test(value))) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_IDENTITY_MISMATCH")
  }
  verifyPreservedEvidence(artifact.preservedEvidenceSha256, true)
  if (!exactRecord(artifact.regressionResults, {
    DIRTY_FREEZE_BINDING_MISSING: "resolved", PLAN_DISCOVERY_DRIFT: "resolved", PRIVATE_DATA_EXPOSURE: "resolved",
    V2_VERIFIER_MODE_MISSING: "resolved",
  }) || !exactRecord(artifact.commandResults, {
    focusedSuites: "passed", protocolV2ByteCheck: "passed", independentVerifierV2Check: "passed",
    dependencyRevisionBoundaryCheck: "passed", typecheck: "passed", diffCheck: "passed",
  })) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_REGRESSION_INVALID")
  if (!exactFalseAuthority(artifact)) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_AUTHORITY_INVALID")
  const codes = artifact.findingCodes
  if (!Array.isArray(codes) || !codes.every((code) => typeof code === "string" && /^[A-Z0-9_]{1,80}$/u.test(code)) ||
    new Set(codes).size !== codes.length || typeof artifact.findingCount !== "number" ||
    !Number.isSafeInteger(artifact.findingCount) || artifact.findingCount !== codes.length || codes.length > 32) {
    throw new TypeError("V138_LOCAL_SEAL_VERSIONED_DISPOSITION_INVALID")
  }
  const pass = codes.length === 0
  if (artifact.independentEvidenceVerification !== (pass ? "passed" : "failed_with_findings") ||
    artifact.satisfiesRevisedSeal01 !== pass) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_DISPOSITION_INVALID")
  return Object.freeze({
    status: artifact.independentEvidenceVerification,
    verificationRoot: artifact.verificationRoot as Sha256,
    satisfiesRevisedSeal01: pass,
  })
}

export const verifyV138LocalSealVersionedVerificationBytes = (input: Readonly<{
  version: VersionedVerificationVersion
  bytes: Buffer
}>): V138LocalSealVersionedVerificationResult => {
  if (input.version !== "v2" && input.version !== "v3") throw new TypeError("V138_LOCAL_SEAL_VERSIONED_VERSION_INVALID")
  const artifact = parseVersionedArtifact(input.bytes)
  return input.version === "v2" ? verifyV2Artifact(artifact) : verifyV3Artifact(artifact)
}

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
  if (unexpected.length !== 0 || !["--write", "--check", "--check-v2", "--check-v3"].includes(command ?? "")) {
    throw new TypeError("V138_LOCAL_SEAL_REVIEW_CLI_USAGE")
  }
  if (command === "--check-v2" || command === "--check-v3") {
    const version = command === "--check-v2" ? "v2" : "v3"
    const target = version === "v2" ? ARTIFACT_V2_PATH : ARTIFACT_V3_PATH
    if (!existsSync(target)) throw new TypeError("V138_LOCAL_SEAL_VERSIONED_ARTIFACT_MISSING")
    const result = verifyV138LocalSealVersionedVerificationBytes({ version, bytes: readFileSync(target) })
    process.stdout.write(`${JSON.stringify(result)}\n`)
    return
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
