import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { encodeV138RetryV3CanonicalJson } from "./v1-38-bounded-retry-envelope-v3.js"

export type V138Plan262103Sha256 = `sha256:${string}`

const PHASE_DIR =
  ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"

export const V138_PLAN_262_103_CANDIDATE_SCHEMA =
  "v1.38-plan-262-103-git-object-byte-custody-rereview-payload-v6" as const
export const V138_PLAN_262_103_CANDIDATE_PROTOCOL =
  "git-object-byte-custody-nonrecursive-v1" as const
export const V138_PLAN_262_103_CANDIDATE_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:candidate-payload:v6" as const
export const V138_PLAN_262_103_CARRIER_SCHEMA =
  "v1.38-plan-262-103-git-object-byte-custody-rereview-carrier-v1" as const
export const V138_PLAN_262_103_CARRIER_PROTOCOL =
  "git-object-byte-custody-external-carrier-v1" as const
export const V138_PLAN_262_103_CARRIER_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:carrier:v1" as const
export const V138_PLAN_262_103_FINDING_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:finding:v6" as const
export const V138_PLAN_262_103_REVIEW_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:review:v6" as const
export const V138_PLAN_262_103_PORTABLE_CLOSURE_DOMAIN =
  "v1.38:plan-262-103:git-object-byte-custody:portable:v6" as const

export const V138_PLAN_262_103_CANDIDATE_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-payload-v6.json" as const
export const V138_PLAN_262_103_CARRIER_PATH =
  ".planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-carrier-v1.json" as const
export const V138_PLAN_262_103_REPORT_PATH = `${PHASE_DIR}/262-103-REVIEW.md` as const

export const V138_PLAN_262_102_SOURCE_PATHS = Object.freeze([
  "scripts/lib/v1-38-plan-262-103-nonrecursive-review-contract-v1.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.ts",
  "scripts/run-v1-38-bounded-retry-envelope-v3-review-v6.test.ts",
] as const)

export const V138_PLAN_262_103_AUTHORITY_KEYS = Object.freeze([
  "plan26292Eligible",
  "authorizesExecution",
  "authorizationCreated",
  "sealV13Created",
  "retryEnvelopeV3Created",
  "journalV3Created",
  "receiptsV3Created",
  "terminalV3Created",
  "reproductionV17Created",
  "dispositionV3Created",
  "correctionV11Created",
  "route11ActivationCreated",
  "readinessV3Created",
  "lifecycleV3Created",
  "liveInvoked",
  "localSecretAccessed",
  "lifecycleMutated",
  "freshCharged",
  "freshAccepted",
  "phase263PlanningAuthorized",
  "phase263ExecutionAuthorized",
  "candidateSearchAuthorized",
  "formationMaterializationAuthorized",
  "holdoutOpeningAuthorized",
  "publicAuthorized",
  "productAuthorized",
  "activationAuthorized",
  "productionAuthorized",
  "countedPlayAuthorized",
  "gameplayChangeAuthorized",
  "archiveAuthorized",
  "tagAuthorized",
] as const)

const CANDIDATE_KEYS = Object.freeze([
  "schemaVersion",
  "protocol",
  "status",
  "correctedSource",
  "protectedHistory",
  "reviewedExecutionClosure",
  "execution",
  "findings",
  "findingCount",
  "findingRoot",
  "sourceReviewPassed",
  "identityClaims",
  "authority",
  "reviewRoot",
  "candidatePayloadRoot",
] as const)

const CARRIER_KEYS = Object.freeze([
  "schemaVersion",
  "protocol",
  "status",
  "reviewedSource",
  "candidate",
  "review",
  "actualConsumer",
  "protectedHistory",
  "findings",
  "findingCount",
  "sourceReviewPassed",
  "authority",
  "carrierRoot",
] as const)

const SOURCE_KEYS = Object.freeze([
  "commit",
  "tree",
  "parent",
  "noLaterRewrite",
  "summaryTrustedAsVerdict",
  "files",
] as const)
const SOURCE_FILE_KEYS = Object.freeze([
  "path",
  "mode",
  "blob",
  "byteLength",
  "sha256",
] as const)
const CANDIDATE_CUSTODY_KEYS = Object.freeze([
  "path",
  "mode",
  "byteLength",
  "sha256",
  "blobOid",
  "candidatePayloadRoot",
] as const)
const REVIEW_CUSTODY_KEYS = Object.freeze([
  "path",
  "mode",
  "byteLength",
  "sha256",
  "blobOid",
] as const)
const IDENTITY_KEYS = Object.freeze([
  "independentPersonClaimed",
  "externalIdentityClaimed",
  "cryptographicReviewerIdentityClaimed",
  "independentCustodyClaimed",
  "separatePermissioningClaimed",
  "maliciousOperatorResistanceClaimed",
  "hostileSameUidResistanceClaimed",
  "pathnameLaunchReplacementResistanceClaimed",
] as const)
const EXECUTION_KEYS = Object.freeze([
  "focusedTestsPassed",
  "sourceOnlyPassed",
  "checkoutBytesMatchedBefore",
  "checkoutBytesMatchedAfter",
  "executionClosureMatchedBeforeAfter",
  "actualConsumerStatus",
  "actualConsumerObservationRoot",
  "destinationsUnchanged",
  "cleanupComplete",
  "canonicalWrites",
  "liveInvoked",
  "freshCharged",
  "freshAccepted",
  "localSecretAccessed",
  "identityConsumed",
] as const)
const ACTUAL_CONSUMER_KEYS = Object.freeze([
  "status",
  "observationRoot",
  "executionClosureMatchedBeforeAfter",
  "destinationsUnchanged",
  "cleanupComplete",
  "canonicalWrites",
  "liveInvoked",
  "freshCharged",
  "freshAccepted",
  "localSecretAccessed",
  "identityConsumed",
] as const)
const CLOSURE_KEYS = Object.freeze([
  "schemaVersion",
  "sourceCommit",
  "sourceTree",
  "sourceParent",
  "checkoutByteManifestRoot",
  "installedClosureRoot",
  "gitExecutable",
  "gitExecutableSha256",
  "gitIsolationRoot",
  "nodeSha256",
  "pnpmDistributionSha256",
  "nativeSourcesRoot",
  "pathnameLaunchReplacementResistanceClaimed",
  "reviewedExecutionClosureRoot",
] as const)
const PROTECTED_KEYS = Object.freeze(["plan100", "plan101"] as const)
const PLAN_100_KEYS = Object.freeze([
  "sourceCommit",
  "sourceTree",
  "sourceParent",
  "summarySha256",
  "noLaterRewrite",
] as const)
const PLAN_101_KEYS = Object.freeze([
  "pairCommit",
  "candidateSha256",
  "reviewSha256",
  "summarySha256",
  "findingCode",
  "findingCount",
  "findingRoot",
  "reviewRoot",
  "resultRoot",
  "status",
  "plan26292Eligible",
  "freshCharged",
  "freshAccepted",
  "reinterpreted",
] as const)

const fail = (code: string): never => {
  throw new TypeError(code)
}
const canonical = encodeV138RetryV3CanonicalJson
const sha256 = (value: Uint8Array): V138Plan262103Sha256 =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`
const record = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
const exactKeys = (value: unknown, expected: readonly string[]): boolean =>
  record(value) &&
  canonical(Object.keys(value).sort()) === canonical([...expected].sort())
const isSha256 = (value: unknown): value is V138Plan262103Sha256 =>
  typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value)
const isOid = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{40}$/u.test(value)
const isRegularMode = (value: unknown): value is "100644" | "100755" =>
  value === "100644" || value === "100755"
const isPositiveLength = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) > 0

const rootPreimage = (
  domain: string,
  value: Record<string, unknown>,
  excluded: "candidatePayloadRoot" | "carrierRoot",
): Buffer => {
  if (!Object.prototype.hasOwnProperty.call(value, excluded))
    fail(
      excluded === "candidatePayloadRoot"
        ? "V138_PLAN_262_103_CANDIDATE_INVALID"
        : "V138_PLAN_262_103_CARRIER_INVALID",
    )
  const body = { ...value }
  delete body[excluded]
  return Buffer.concat([Buffer.from(domain), Buffer.from([0]), Buffer.from(canonical(body))])
}

export const candidateV138Plan262103Preimage = (candidate: unknown): Buffer => {
  if (!record(candidate)) fail("V138_PLAN_262_103_CANDIDATE_INVALID")
  return rootPreimage(V138_PLAN_262_103_CANDIDATE_DOMAIN, candidate, "candidatePayloadRoot")
}

export const carrierV138Plan262103Preimage = (carrier: unknown): Buffer => {
  if (!record(carrier)) fail("V138_PLAN_262_103_CARRIER_INVALID")
  return rootPreimage(V138_PLAN_262_103_CARRIER_DOMAIN, carrier, "carrierRoot")
}

export const computeV138Plan262103CandidatePayloadRoot = (
  candidate: unknown,
): V138Plan262103Sha256 => sha256(candidateV138Plan262103Preimage(candidate))

export const computeV138Plan262103CarrierRoot = (
  carrier: unknown,
): V138Plan262103Sha256 => sha256(carrierV138Plan262103Preimage(carrier))

export const computeV138Plan262103FindingRoot = (
  findings: readonly unknown[],
): V138Plan262103Sha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(V138_PLAN_262_103_FINDING_DOMAIN),
      Buffer.from([0]),
      Buffer.from(canonical(findings)),
    ]),
  )

export const computeV138Plan262103ReviewRoot = (
  reportBytes: Uint8Array,
): V138Plan262103Sha256 =>
  sha256(
    Buffer.concat([
      Buffer.from(V138_PLAN_262_103_REVIEW_DOMAIN),
      Buffer.from([0]),
      Buffer.from(reportBytes),
    ]),
  )

export const computeV138Plan262103PortableClosureRoot = (
  closure: unknown,
): V138Plan262103Sha256 => {
  if (!record(closure) || !Object.hasOwn(closure, "reviewedExecutionClosureRoot"))
    fail("V138_PLAN_262_103_CANDIDATE_INVALID")
  const body = { ...closure }
  delete body.reviewedExecutionClosureRoot
  return sha256(
    Buffer.concat([
      Buffer.from(V138_PLAN_262_103_PORTABLE_CLOSURE_DOMAIN),
      Buffer.from([0]),
      Buffer.from(canonical(body)),
    ]),
  )
}

const validateSource = (source: unknown): source is Record<string, any> =>
  exactKeys(source, SOURCE_KEYS) &&
  isOid(source.commit) &&
  isOid(source.tree) &&
  isOid(source.parent) &&
  source.noLaterRewrite === true &&
  source.summaryTrustedAsVerdict === false &&
  Array.isArray(source.files) &&
  source.files.length === 3 &&
  canonical(source.files.map((item: any) => item?.path).sort()) ===
    canonical([...V138_PLAN_262_102_SOURCE_PATHS].sort()) &&
  source.files.every(
    (item: unknown) =>
      exactKeys(item, SOURCE_FILE_KEYS) &&
      V138_PLAN_262_102_SOURCE_PATHS.includes(item.path) &&
      isRegularMode(item.mode) &&
      isOid(item.blob) &&
      isPositiveLength(item.byteLength) &&
      isSha256(item.sha256),
  )

const validateProtectedHistory = (value: unknown): boolean => {
  if (!exactKeys(value, PROTECTED_KEYS)) return false
  const plan100 = value.plan100
  const plan101 = value.plan101
  return (
    exactKeys(plan100, PLAN_100_KEYS) &&
    plan100.sourceCommit === "a879bfc6cab49abf2e12a5b882a06b7e9fb446cb" &&
    plan100.sourceTree === "e6b89de1c699d35b0e5068e0c064b7badd53ad00" &&
    plan100.sourceParent === "71dc34c79a27ba57e67f8a2a2b7471dedade7a09" &&
    plan100.summarySha256 ===
      "sha256:858b082ca74c8a77b380fc16d658b17cb8a30de823894161bd541feeb6bb0c2c" &&
    plan100.noLaterRewrite === true &&
    exactKeys(plan101, PLAN_101_KEYS) &&
    plan101.pairCommit === "8c4e74180e36f22e3a44520d2cda145b3aa30671" &&
    plan101.candidateSha256 ===
      "sha256:891776dee9f6e2b3f87a99d8199512bfa4207f9fe03ab63fd29d04ac1c142ee3" &&
    plan101.reviewSha256 ===
      "sha256:14e750b89dc8bb30c080bd8fcc9a25fc7fe0d841367b3149c78b517a0d8f7f27" &&
    plan101.summarySha256 ===
      "sha256:f1a4b96e3c2122e20dffd9fbab2b64ec976315e6655da51433bfb960cdb1f350" &&
    plan101.findingCode ===
      "CANDIDATE_JSON_HASH_SELF_REFERENCE_UNSATISFIABLE" &&
    plan101.findingCount === 1 &&
    plan101.findingRoot ===
      "sha256:4dfccd91907322bc560584de13570ef5f243ebdeb8a9ce117673befc3dce9953" &&
    plan101.reviewRoot ===
      "sha256:68c66d072b65a5d1dd30351b609a3bd6f1a327740da966ef2bc37cf92e2425b4" &&
    plan101.resultRoot ===
      "sha256:72bc2402c9678c3a719587b8d3c5862fbd12dd0d6abd42b5758d6cf6ef708ddc" &&
    plan101.status === "blocked" &&
    plan101.plan26292Eligible === false &&
    plan101.freshCharged === 0 &&
    plan101.freshAccepted === 0 &&
    plan101.reinterpreted === false
  )
}

const validateAuthority = (value: unknown, eligible: boolean): boolean =>
  exactKeys(value, V138_PLAN_262_103_AUTHORITY_KEYS) &&
  value.plan26292Eligible === eligible &&
  value.freshCharged === 0 &&
  value.freshAccepted === 0 &&
  Object.entries(value).every(
    ([key, child]) =>
      ["plan26292Eligible", "freshCharged", "freshAccepted"].includes(key) ||
      child === false,
  )

const validateClosure = (value: unknown, source: Record<string, any>): boolean =>
  exactKeys(value, CLOSURE_KEYS) &&
  value.schemaVersion === "v1.38-reviewed-execution-closure-v2" &&
  value.sourceCommit === source.commit &&
  value.sourceTree === source.tree &&
  value.sourceParent === source.parent &&
  value.gitExecutable === "/usr/bin/git" &&
  value.pathnameLaunchReplacementResistanceClaimed === false &&
  CLOSURE_KEYS.filter((key) => key.endsWith("Root") || key.endsWith("Sha256")).every(
    (key) => isSha256(value[key]),
  ) &&
  value.reviewedExecutionClosureRoot ===
    computeV138Plan262103PortableClosureRoot(value)

const validateExecution = (value: unknown): boolean =>
  exactKeys(value, EXECUTION_KEYS) &&
  Number.isSafeInteger(value.focusedTestsPassed) &&
  value.focusedTestsPassed >= 0 &&
  value.sourceOnlyPassed === true &&
  value.checkoutBytesMatchedBefore === true &&
  value.checkoutBytesMatchedAfter === true &&
  value.executionClosureMatchedBeforeAfter === true &&
  ["passed", "blocked_review"].includes(value.actualConsumerStatus) &&
  isSha256(value.actualConsumerObservationRoot) &&
  value.destinationsUnchanged === true &&
  value.cleanupComplete === true &&
  value.canonicalWrites === 0 &&
  value.liveInvoked === false &&
  value.freshCharged === 0 &&
  value.freshAccepted === 0 &&
  value.localSecretAccessed === false &&
  value.identityConsumed === false

export const validateV138Plan262103Candidate = (
  candidate: unknown,
): Record<string, any> => {
  if (!exactKeys(candidate, CANDIDATE_KEYS))
    fail("V138_PLAN_262_103_CANDIDATE_INVALID")
  const zero = candidate.status === "zero_findings"
  if (
    candidate.schemaVersion !== V138_PLAN_262_103_CANDIDATE_SCHEMA ||
    candidate.protocol !== V138_PLAN_262_103_CANDIDATE_PROTOCOL ||
    (!zero && candidate.status !== "blocked") ||
    !validateSource(candidate.correctedSource) ||
    !validateProtectedHistory(candidate.protectedHistory) ||
    !validateClosure(candidate.reviewedExecutionClosure, candidate.correctedSource) ||
    !validateExecution(candidate.execution) ||
    !Array.isArray(candidate.findings) ||
    !Number.isSafeInteger(candidate.findingCount) ||
    candidate.findingCount !== candidate.findings.length ||
    (zero ? candidate.findingCount !== 0 : candidate.findingCount < 1) ||
    !isSha256(candidate.findingRoot) ||
    candidate.findingRoot !== computeV138Plan262103FindingRoot(candidate.findings) ||
    candidate.sourceReviewPassed !== zero ||
    !exactKeys(candidate.identityClaims, IDENTITY_KEYS) ||
    Object.values(candidate.identityClaims).some((child) => child !== false) ||
    !validateAuthority(candidate.authority, zero) ||
    !isSha256(candidate.reviewRoot) ||
    !isSha256(candidate.candidatePayloadRoot) ||
    candidate.candidatePayloadRoot !==
      computeV138Plan262103CandidatePayloadRoot(candidate) ||
    candidate.execution.actualConsumerStatus !== (zero ? "passed" : "blocked_review")
  )
    fail("V138_PLAN_262_103_CANDIDATE_INVALID")
  return candidate
}

const validateCustody = (
  value: unknown,
  expectedPath: string,
  candidate: boolean,
): boolean =>
  exactKeys(value, candidate ? CANDIDATE_CUSTODY_KEYS : REVIEW_CUSTODY_KEYS) &&
  value.path === expectedPath &&
  isRegularMode(value.mode) &&
  isPositiveLength(value.byteLength) &&
  isSha256(value.sha256) &&
  isOid(value.blobOid) &&
  (!candidate || isSha256(value.candidatePayloadRoot))

const validateActualConsumer = (value: unknown, zero: boolean): boolean =>
  exactKeys(value, ACTUAL_CONSUMER_KEYS) &&
  value.status === (zero ? "passed" : "blocked_review") &&
  isSha256(value.observationRoot) &&
  value.executionClosureMatchedBeforeAfter === true &&
  value.destinationsUnchanged === true &&
  value.cleanupComplete === true &&
  value.canonicalWrites === 0 &&
  value.liveInvoked === false &&
  value.freshCharged === 0 &&
  value.freshAccepted === 0 &&
  value.localSecretAccessed === false &&
  value.identityConsumed === false

export const validateV138Plan262103Carrier = (
  carrier: unknown,
): Record<string, any> => {
  if (!exactKeys(carrier, CARRIER_KEYS))
    fail("V138_PLAN_262_103_CARRIER_INVALID")
  const zero = carrier.status === "zero_findings"
  if (
    carrier.schemaVersion !== V138_PLAN_262_103_CARRIER_SCHEMA ||
    carrier.protocol !== V138_PLAN_262_103_CARRIER_PROTOCOL ||
    (!zero && carrier.status !== "blocked") ||
    !validateSource(carrier.reviewedSource) ||
    !validateCustody(carrier.candidate, V138_PLAN_262_103_CANDIDATE_PATH, true) ||
    !validateCustody(carrier.review, V138_PLAN_262_103_REPORT_PATH, false) ||
    !validateActualConsumer(carrier.actualConsumer, zero) ||
    !validateProtectedHistory(carrier.protectedHistory) ||
    !Array.isArray(carrier.findings) ||
    !Number.isSafeInteger(carrier.findingCount) ||
    carrier.findingCount !== carrier.findings.length ||
    (zero ? carrier.findingCount !== 0 : carrier.findingCount < 1) ||
    carrier.sourceReviewPassed !== zero ||
    !validateAuthority(carrier.authority, zero) ||
    !isSha256(carrier.carrierRoot) ||
    carrier.carrierRoot !== computeV138Plan262103CarrierRoot(carrier)
  )
    fail("V138_PLAN_262_103_CARRIER_INVALID")
  return carrier
}
